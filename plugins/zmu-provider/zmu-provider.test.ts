import { describe, expect, it, vi } from "vitest"
import type { CookieJar, HttpRequest, HttpResponse } from "@orahako/plugin-sdk"
import { ProviderErrorCode } from "@orahako/plugin-sdk/provider-errors"
import { ZMUProvider } from "./zmu-provider"
import { createTestSession, TestCookieJar } from "./test-support"

function jsonResponse(body: unknown): HttpResponse {
  return {
    status: 200,
    headers: {},
    url: "",
    text: async () => (typeof body === "string" ? body : JSON.stringify(body)),
    arrayBuffer: async () => new ArrayBuffer(0),
  }
}

type Fetch = (jar: CookieJar, request: HttpRequest) => Promise<HttpResponse>

function createServices(fetchWithJar: Fetch) {
  const { session } = createTestSession({ fetchWithJar })
  const query = { invalidate: vi.fn(), clearPersistent: vi.fn() }
  return { services: { session, query }, session, query }
}

describe("ZMUProvider auth", () => {
  it("requires the captcha before sending a login request", async () => {
    const { services } = createServices(async () => {
      throw new Error("unexpected request")
    })
    const provider = new ZMUProvider(services)
    await expect(
      provider.loginStep1({ username: "student", password: "secret" })
    ).rejects.toMatchObject({ code: ProviderErrorCode.AUTH_CAPTCHA_REQUIRED, status: 403 })
  })

  it("returns a restorable session credential and clears it on logout", async () => {
    const { services, session, query } = createServices(async (jar, request) => {
      if (request.url.endsWith("/")) {
        await jar.setCookie("JSESSIONID=zmu-session; Path=/", request.url)
        return jsonResponse('<form id="login-form"><input name="account"></form>')
      }
      if (request.url.endsWith("/new/login")) {
        return jsonResponse({ code: 0, message: "成功", data: { url: "/new/welcome.page" } })
      }
      return jsonResponse("")
    })
    const provider = new ZMUProvider(services)
    await provider.prepareLogin()
    await provider.checkCaptchaNeeded("student")
    await provider.login({
      username: "student",
      password: "secret",
      metadata: { captcha: "2enb" },
    })
    expect(session.getSnapshot().credential).toContain("zmu-session")
    expect(session.getSnapshot().username).toBe("student")
    expect(provider.isAuthenticated()).toBe(true)
    await provider.logout()
    expect(session.getSnapshot().credential).toBeNull()
    expect(provider.isAuthenticated()).toBe(false)
    expect(query.clearPersistent).toHaveBeenCalled()
    expect(query.invalidate).toHaveBeenCalled()
  })

  it("restores a persisted session during initialization", async () => {
    const { services, session } = createServices(async () => {
      throw new Error("unexpected request")
    })
    const jar = new TestCookieJar()
    await jar.setCookie("JSESSIONID=persisted; Path=/", "https://jwxt.zmu.edu.cn/")
    session.setCredential({ schoolId: "zmu", credential: jar.toJSON() })
    const provider = new ZMUProvider(services)
    await provider.initialize()
    expect(session.getSnapshot().credential).toBe(jar.toJSON())
  })

  it("clears a stored credential whose cookie jar has no session", async () => {
    const { services, session } = createServices(async () => {
      throw new Error("unexpected request")
    })
    session.setCredential({ schoolId: "zmu", credential: "[]" })
    const provider = new ZMUProvider(services)
    await provider.initialize()
    expect(session.getSnapshot().credential).toBeNull()
    expect(provider.isAuthenticated()).toBe(false)
  })

  it("provides all twelve period rows required by the schedule grid", async () => {
    const { services } = createServices(async () => {
      throw new Error("unexpected request")
    })
    const periods = await new ZMUProvider(services).getClassPeriods()
    expect(periods.map((period) => period.section)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ])
    expect(periods.every((period) => period.isInUse)).toBe(true)
  })

  it("maps a wrong captcha to the existing captcha error contract", async () => {
    const { services } = createServices(async () =>
      jsonResponse({ code: -1, message: "验证码不正确" })
    )
    const provider = new ZMUProvider(services)
    await expect(
      provider.loginStep1({ username: "student", password: "secret", captcha: "bad1" })
    ).rejects.toMatchObject({ code: ProviderErrorCode.AUTH_CAPTCHA_REQUIRED, status: 403 })
  })
})
