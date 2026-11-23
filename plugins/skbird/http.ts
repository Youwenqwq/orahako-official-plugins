/**
 * 森空鸟的公共 HTTP 辅助函数。
 *
 * 传输、代理与原生解码全部由 `ctx.http.send` 负责；这里只处理插件自己的
 * 图片响应形态。
 */
import type { PluginHttpService } from "@orahako/sdk"

const DEFAULT_IMAGE_TYPE = "image/jpeg"

/**
 * 拉取图片二进制。Native 端必须走宿主传输，避免 https 页面加载 http
 * 子资源被 WebView 的 mixed-content 策略拦截。
 */
export async function fetchImageBlob(http: PluginHttpService, url: string): Promise<Blob> {
  const response = await http.send({
    method: "GET",
    url,
    redirect: "manual",
    responseType: "arraybuffer",
  })
  if (response.status !== 200) throw new Error(`HTTP ${response.status}`)
  const contentType = response.headers["content-type"]
  const type = (Array.isArray(contentType) ? contentType[0] : contentType) ?? DEFAULT_IMAGE_TYPE
  return new Blob([await response.arrayBuffer()], { type })
}
