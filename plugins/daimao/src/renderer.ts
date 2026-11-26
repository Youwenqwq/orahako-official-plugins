import {
  loadCubismCore,
  type CubismCoreAPI,
  type CubismMoc,
  type CubismModel,
} from "./cubism-core"
import {
  CubismPhysicsSolver,
  type Physics3Json,
  type PhysicsParameterBridge,
} from "./physics"

const MASK_VERTEX_SHADER = `
attribute vec2 aPosition;
attribute vec2 aTexCoord;
uniform mat4 uMatrix;
varying vec2 vTexCoord;
void main() {
  gl_Position = uMatrix * vec4(aPosition, 0.0, 1.0);
  vTexCoord = vec2(aTexCoord.x, 1.0 - aTexCoord.y);
}
`

const MASK_FRAGMENT_SHADER = `
precision mediump float;
uniform sampler2D uTexture;
varying vec2 vTexCoord;
void main() {
  float a = texture2D(uTexture, vTexCoord).a;
  gl_FragColor = vec4(1.0, 1.0, 1.0, a);
}
`

const DRAW_VERTEX_SHADER = `
attribute vec2 aPosition;
attribute vec2 aTexCoord;
uniform mat4 uMatrix;
varying vec2 vTexCoord;
varying vec2 vClipPos;
void main() {
  vec4 pos = uMatrix * vec4(aPosition, 0.0, 1.0);
  gl_Position = pos;
  vTexCoord = vec2(aTexCoord.x, 1.0 - aTexCoord.y);
  vClipPos = pos.xy * 0.5 + 0.5;
}
`

const DRAW_FRAGMENT_SHADER = `
precision mediump float;
uniform sampler2D uTexture;
uniform sampler2D uMaskTexture;
uniform float uOpacity;
uniform float uUseMask;
uniform float uInvertMask;
uniform vec4 uMultiplyColor;
uniform vec4 uScreenColor;
varying vec2 vTexCoord;
varying vec2 vClipPos;
void main() {
  vec4 tex = texture2D(uTexture, vTexCoord);
  if (tex.a <= 0.001) discard;
  // Unpremultiply for accurate Cubism multiply/screen color blending
  vec3 rgb = tex.rgb / tex.a;
  rgb = rgb * uMultiplyColor.rgb;
  rgb = (rgb + uScreenColor.rgb) - (rgb * uScreenColor.rgb);
  float alpha = tex.a * uOpacity;
  if (uUseMask > 0.5) {
    float maskAlpha = texture2D(uMaskTexture, vClipPos).a;
    alpha *= uInvertMask > 0.5 ? (1.0 - maskAlpha) : maskAlpha;
  }
  gl_FragColor = vec4(rgb * alpha, alpha);
}
`

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader {
  const shader = gl.createShader(type)
  if (!shader) throw new Error("Failed to create WebGL shader")
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(shader)
    gl.deleteShader(shader)
    throw new Error(`WebGL shader compile failed: ${log ?? "unknown"}`)
  }
  return shader
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string
): WebGLProgram {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vertexSource)
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource)
  const program = gl.createProgram()
  if (!program) throw new Error("Failed to create WebGL program")
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  gl.deleteShader(vs)
  gl.deleteShader(fs)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program)
    gl.deleteProgram(program)
    throw new Error(`WebGL program link failed: ${log ?? "unknown"}`)
  }
  return program
}

async function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load Live2D texture: ${url}`))
    img.src = url
  })
}

function releaseMoc(moc: CubismMoc): void {
  if (typeof moc._release === "function") {
    moc._release()
  } else if (typeof moc.release === "function") {
    moc.release()
  }
}

export interface DaimaoAssetUrls {
  readonly moc3: string
  readonly texture: string
  readonly physics?: string
}

export interface Live2DRenderer {
  readonly aspectRatio: number
  readonly parameterBridge: PhysicsParameterBridge
  setParameter(id: string, value: number): void
  getParameter(id: string): number
  stepPhysics(dtSeconds: number): void
  render(): void
  resize(cssWidth: number, cssHeight: number, dpr: number): void
  dispose(): void
}

/**
 * Pure WebGL Cubism 4/5 renderer with mask FBO support and Physics3 solver.
 * Zero external graphics framework dependencies; cleans up all GPU & WASM memory on dispose.
 */
export async function createLive2DRenderer(
  canvas: HTMLCanvasElement,
  assets: DaimaoAssetUrls
): Promise<Live2DRenderer> {
  const [core, mocResponse, textureImage, physicsData] = await Promise.all([
    loadCubismCore(),
    fetch(assets.moc3),
    loadImage(assets.texture),
    assets.physics
      ? fetch(assets.physics)
          .then((res) => (res.ok ? (res.json() as Promise<Physics3Json>) : undefined))
          .catch(() => undefined)
      : Promise.resolve(undefined),
  ])

  if (!mocResponse.ok) {
    throw new Error(`Failed to fetch Live2D moc3 (${mocResponse.status})`)
  }
  const mocBuffer = await mocResponse.arrayBuffer()
  const moc = core.Moc.fromArrayBuffer(mocBuffer)
  if (!moc) throw new Error("Failed to parse Live2D moc3 buffer")
  const model = core.Model.fromMoc(moc)
  if (!model) {
    releaseMoc(moc)
    throw new Error("Failed to instantiate Live2D model from moc")
  }

  const gl = canvas.getContext("webgl", {
    alpha: true,
    premultipliedAlpha: true,
    antialias: true,
    preserveDrawingBuffer: false,
  })
  if (!gl) {
    model.release()
    releaseMoc(moc)
    throw new Error("WebGL context unavailable")
  }

  return new WebGLCubismRenderer(gl, canvas, core, moc, model, textureImage, physicsData)
}

class WebGLCubismRenderer implements Live2DRenderer {
  readonly aspectRatio: number
  readonly parameterBridge: PhysicsParameterBridge

  private readonly paramIndex = new Map<string, number>()
  private readonly physics?: CubismPhysicsSolver
  private readonly maskProgram: WebGLProgram
  private readonly drawProgram: WebGLProgram
  private readonly texture: WebGLTexture
  private readonly maskFbo: WebGLFramebuffer
  private readonly maskTex: WebGLTexture
  private readonly posBuffer: WebGLBuffer
  private readonly uvBuffer: WebGLBuffer
  private readonly idxBuffer: WebGLBuffer
  private readonly sortedIndices: number[]
  private readonly matrix = new Float32Array(16)
  private maskWidth = 256
  private maskHeight = 256
  private disposed = false

  // Cached attribute/uniform locations
  private readonly maskLoc: {
    aPosition: number
    aTexCoord: number
    uMatrix: WebGLUniformLocation | null
    uTexture: WebGLUniformLocation | null
  }
  private readonly drawLoc: {
    aPosition: number
    aTexCoord: number
    uMatrix: WebGLUniformLocation | null
    uTexture: WebGLUniformLocation | null
    uMaskTexture: WebGLUniformLocation | null
    uOpacity: WebGLUniformLocation | null
    uUseMask: WebGLUniformLocation | null
    uInvertMask: WebGLUniformLocation | null
    uMultiplyColor: WebGLUniformLocation | null
    uScreenColor: WebGLUniformLocation | null
  }

  constructor(
    private readonly gl: WebGLRenderingContext,
    private readonly canvas: HTMLCanvasElement,
    private readonly core: CubismCoreAPI,
    private readonly moc: CubismMoc,
    private readonly model: CubismModel,
    textureImage: HTMLImageElement,
    physicsData?: Physics3Json
  ) {
    const { CanvasWidth, CanvasHeight } = model.canvasinfo
    this.aspectRatio = CanvasWidth / CanvasHeight

    for (let i = 0; i < model.parameters.count; i += 1) {
      this.paramIndex.set(model.parameters.ids[i], i)
    }

    this.parameterBridge = {
      getValue: (id) => this.getParameter(id),
      getRange: (id) => {
        const idx = this.paramIndex.get(id)
        if (idx === undefined) return undefined
        return {
          min: this.model.parameters.minimumValues[idx],
          max: this.model.parameters.maximumValues[idx],
          def: this.model.parameters.defaultValues[idx],
        }
      },
      setValue: (id, value) => this.setParameter(id, value),
    }

    if (physicsData) {
      this.physics = new CubismPhysicsSolver(physicsData)
    }

    this.sortedIndices = Array.from({ length: model.drawables.count }, (_, i) => i)

    this.maskProgram = createProgram(gl, MASK_VERTEX_SHADER, MASK_FRAGMENT_SHADER)
    this.drawProgram = createProgram(gl, DRAW_VERTEX_SHADER, DRAW_FRAGMENT_SHADER)

    this.maskLoc = {
      aPosition: gl.getAttribLocation(this.maskProgram, "aPosition"),
      aTexCoord: gl.getAttribLocation(this.maskProgram, "aTexCoord"),
      uMatrix: gl.getUniformLocation(this.maskProgram, "uMatrix"),
      uTexture: gl.getUniformLocation(this.maskProgram, "uTexture"),
    }
    this.drawLoc = {
      aPosition: gl.getAttribLocation(this.drawProgram, "aPosition"),
      aTexCoord: gl.getAttribLocation(this.drawProgram, "aTexCoord"),
      uMatrix: gl.getUniformLocation(this.drawProgram, "uMatrix"),
      uTexture: gl.getUniformLocation(this.drawProgram, "uTexture"),
      uMaskTexture: gl.getUniformLocation(this.drawProgram, "uMaskTexture"),
      uOpacity: gl.getUniformLocation(this.drawProgram, "uOpacity"),
      uUseMask: gl.getUniformLocation(this.drawProgram, "uUseMask"),
      uInvertMask: gl.getUniformLocation(this.drawProgram, "uInvertMask"),
      uMultiplyColor: gl.getUniformLocation(this.drawProgram, "uMultiplyColor"),
      uScreenColor: gl.getUniformLocation(this.drawProgram, "uScreenColor"),
    }

    const texture = gl.createTexture()
    const maskTex = gl.createTexture()
    const maskFbo = gl.createFramebuffer()
    const posBuffer = gl.createBuffer()
    const uvBuffer = gl.createBuffer()
    const idxBuffer = gl.createBuffer()
    if (!texture || !maskTex || !maskFbo || !posBuffer || !uvBuffer || !idxBuffer) {
      throw new Error("Failed to allocate WebGL resources")
    }
    this.texture = texture
    this.maskTex = maskTex
    this.maskFbo = maskFbo
    this.posBuffer = posBuffer
    this.uvBuffer = uvBuffer
    this.idxBuffer = idxBuffer

    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureImage)
    gl.generateMipmap(gl.TEXTURE_2D)
    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 0)

    this.allocateMaskTarget(256, 256)
    this.updateMatrix()
  }

  setParameter(id: string, value: number): void {
    if (this.disposed) return
    const idx = this.paramIndex.get(id)
    if (idx === undefined) return
    const min = this.model.parameters.minimumValues[idx]
    const max = this.model.parameters.maximumValues[idx]
    this.model.parameters.values[idx] = Math.max(min, Math.min(max, value))
  }

  getParameter(id: string): number {
    if (this.disposed) return 0
    const idx = this.paramIndex.get(id)
    if (idx === undefined) return 0
    return this.model.parameters.values[idx]
  }

  stepPhysics(dtSeconds: number): void {
    if (this.disposed || !this.physics) return
    this.physics.evaluate(this.parameterBridge, dtSeconds)
  }

  resize(cssWidth: number, cssHeight: number, dpr: number): void {
    if (this.disposed) return
    const clampedDpr = Math.min(Math.max(dpr, 1), 2)
    const width = Math.max(1, Math.round(cssWidth * clampedDpr))
    const height = Math.max(1, Math.round(cssHeight * clampedDpr))
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width
      this.canvas.height = height
      this.allocateMaskTarget(Math.min(width, 512), Math.min(height, 512))
    }
    this.updateMatrix()
  }

  render(): void {
    if (this.disposed) return
    const { gl, model, core } = this
    model.update()

    const { drawables } = model
    const orders = drawables.renderOrders
    this.sortedIndices.sort((a, b) => orders[a] - orders[b])

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.disable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)

    for (let s = 0; s < this.sortedIndices.length; s += 1) {
      const i = this.sortedIndices[s]
      const opacity = drawables.opacities[i]
      if (opacity <= 0.001) continue
      if (!core.Utils.hasIsVisibleBit(drawables.dynamicFlags[i])) continue
      const indexCount = drawables.indexCounts[i]
      if (indexCount <= 0) continue

      const maskCount = drawables.maskCounts[i]
      if (maskCount > 0) {
        this.renderMasks(drawables.masks[i], maskCount)
        gl.bindFramebuffer(gl.FRAMEBUFFER, null)
        gl.viewport(0, 0, this.canvas.width, this.canvas.height)
      }

      const flags = drawables.constantFlags[i]
      if (core.Utils.hasIsDoubleSidedBit(flags)) {
        gl.disable(gl.CULL_FACE)
      } else {
        gl.enable(gl.CULL_FACE)
        gl.cullFace(gl.BACK)
      }

      if (core.Utils.hasBlendAdditiveBit(flags)) {
        gl.blendFuncSeparate(gl.ONE, gl.ONE, gl.ZERO, gl.ONE)
      } else if (core.Utils.hasBlendMultiplicativeBit(flags)) {
        gl.blendFuncSeparate(gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA, gl.ZERO, gl.ONE)
      } else {
        gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA)
      }

      gl.useProgram(this.drawProgram)
      gl.uniformMatrix4fv(this.drawLoc.uMatrix, false, this.matrix)
      gl.uniform1f(this.drawLoc.uOpacity, opacity)
      gl.uniform1f(this.drawLoc.uUseMask, maskCount > 0 ? 1 : 0)
      gl.uniform1f(this.drawLoc.uInvertMask, core.Utils.hasIsInvertedMaskBit(flags) ? 1 : 0)

      const mc = drawables.multiplyColors
      const sc = drawables.screenColors
      const cOff = i * 4
      gl.uniform4f(
        this.drawLoc.uMultiplyColor,
        mc ? mc[cOff] : 1,
        mc ? mc[cOff + 1] : 1,
        mc ? mc[cOff + 2] : 1,
        mc ? mc[cOff + 3] : 1
      )
      gl.uniform4f(
        this.drawLoc.uScreenColor,
        sc ? sc[cOff] : 0,
        sc ? sc[cOff + 1] : 0,
        sc ? sc[cOff + 2] : 0,
        sc ? sc[cOff + 3] : 0
      )

      gl.activeTexture(gl.TEXTURE0)
      gl.bindTexture(gl.TEXTURE_2D, this.texture)
      gl.uniform1i(this.drawLoc.uTexture, 0)

      gl.activeTexture(gl.TEXTURE1)
      gl.bindTexture(gl.TEXTURE_2D, this.maskTex)
      gl.uniform1i(this.drawLoc.uMaskTexture, 1)

      this.drawMesh(i, this.drawLoc.aPosition, this.drawLoc.aTexCoord)
    }
  }

  dispose(): void {
    if (this.disposed) return
    this.disposed = true
    const { gl } = this
    gl.deleteTexture(this.texture)
    gl.deleteTexture(this.maskTex)
    gl.deleteFramebuffer(this.maskFbo)
    gl.deleteBuffer(this.posBuffer)
    gl.deleteBuffer(this.uvBuffer)
    gl.deleteBuffer(this.idxBuffer)
    gl.deleteProgram(this.maskProgram)
    gl.deleteProgram(this.drawProgram)
    this.model.release()
    releaseMoc(this.moc)
  }

  private renderMasks(masks: Int32Array, count: number): void {
    const { gl } = this
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.maskFbo)
    gl.viewport(0, 0, this.maskWidth, this.maskHeight)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.disable(gl.CULL_FACE)
    gl.blendFuncSeparate(gl.ONE, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA)

    gl.useProgram(this.maskProgram)
    gl.uniformMatrix4fv(this.maskLoc.uMatrix, false, this.matrix)
    gl.activeTexture(gl.TEXTURE0)
    gl.bindTexture(gl.TEXTURE_2D, this.texture)
    gl.uniform1i(this.maskLoc.uTexture, 0)

    for (let m = 0; m < count; m += 1) {
      const maskIdx = masks[m]
      if (this.model.drawables.indexCounts[maskIdx] <= 0) continue
      this.drawMesh(maskIdx, this.maskLoc.aPosition, this.maskLoc.aTexCoord)
    }
  }

  private drawMesh(drawableIndex: number, aPosition: number, aTexCoord: number): void {
    const { gl, model } = this
    const { drawables } = model

    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, drawables.vertexPositions[drawableIndex], gl.DYNAMIC_DRAW)
    gl.enableVertexAttribArray(aPosition)
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0)

    gl.bindBuffer(gl.ARRAY_BUFFER, this.uvBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, drawables.vertexUvs[drawableIndex], gl.STATIC_DRAW)
    gl.enableVertexAttribArray(aTexCoord)
    gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0)

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.idxBuffer)
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawables.indices[drawableIndex], gl.STATIC_DRAW)
    gl.drawElements(gl.TRIANGLES, drawables.indexCounts[drawableIndex], gl.UNSIGNED_SHORT, 0)
  }

  private allocateMaskTarget(width: number, height: number): void {
    const { gl } = this
    this.maskWidth = Math.max(64, width)
    this.maskHeight = Math.max(64, height)
    gl.bindTexture(gl.TEXTURE_2D, this.maskTex)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      this.maskWidth,
      this.maskHeight,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null
    )
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.maskFbo)
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.maskTex, 0)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }

  private updateMatrix(): void {
    const { CanvasWidth, CanvasHeight, PixelsPerUnit } = this.model.canvasinfo
    const modelW = CanvasWidth / PixelsPerUnit
    const modelH = CanvasHeight / PixelsPerUnit
    const viewAspect = this.canvas.width / Math.max(1, this.canvas.height)
    const modelAspect = modelW / modelH

    // Fit full model inside clip space [-1, 1] with a tiny padding margin
    const fit = 0.96
    let scaleX: number
    let scaleY: number
    if (viewAspect >= modelAspect) {
      scaleY = (2 / modelH) * fit
      scaleX = scaleY / viewAspect
    } else {
      scaleX = (2 / modelW) * fit
      scaleY = scaleX * viewAspect
    }

    this.matrix.fill(0)
    this.matrix[0] = scaleX
    this.matrix[5] = scaleY
    this.matrix[10] = 1
    this.matrix[15] = 1
  }
}
