import { describe, expect, it, vi } from "vitest"
import type { HttpRequest, HttpResponse, PluginHttpService } from "@orahako/sdk"
import { fetchImageBlob } from "./http"

const EMPTY_ACTIVITY = {
  active: [],
  history: [],
  session: null,
  revision: 0,
}

function fakeHttp(send: (request: HttpRequest) => Promise<HttpResponse>): PluginHttpService {
  const activityState = {
    getSnapshot: () => EMPTY_ACTIVITY,
    subscribe: () => () => {},
  }
  return {
    send,
    activity: {
      ...activityState,
      state: activityState,
      beginRequest: () => () => {},
      registerLabeler: () => () => {},
      registerClassifier: () => () => {},
    },
  }
}

describe("fetchImageBlob", () => {
  it("uses the injected transport and keeps the binary payload and MIME type", async () => {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47])
    const send = vi.fn(
      async (_request: HttpRequest): Promise<HttpResponse> => ({
        status: 200,
        headers: { "content-type": ["image/png", "image/jpeg"] },
        url: "https://b1.cdn.zanao.com/x.png",
        text: async () => "",
        arrayBuffer: async () => bytes.slice().buffer,
      })
    )

    const blob = await fetchImageBlob(
      fakeHttp(send),
      "https://b1.cdn.zanao.com/x.png"
    )

    expect(send).toHaveBeenCalledWith({
      method: "GET",
      url: "https://b1.cdn.zanao.com/x.png",
      redirect: "manual",
      responseType: "arraybuffer",
    })
    expect(blob.type).toBe("image/png")
    expect(new Uint8Array(await blob.arrayBuffer())).toEqual(bytes)
  })

  it("rejects non-200 responses instead of rendering an error image", async () => {
    const http = fakeHttp(async () => ({
      status: 403,
      headers: {},
      url: "",
      text: async () => "",
      arrayBuffer: async () => new ArrayBuffer(0),
    }))

    await expect(fetchImageBlob(http, "https://b1.cdn.zanao.com/x.png")).rejects.toThrow("HTTP 403")
  })
})
