import { describe, expect, it, vi } from "vitest"
import {
  CampusChargeClient,
  normalizeReading,
  normalizeTokenInput,
  type ChargeHttp,
} from "./client"
import { ChargeClientError, countUsableFreePorts } from "./types"

function mockResponse(status: number, body: unknown) {
  const text = typeof body === "string" ? body : JSON.stringify(body)
  return {
    status,
    headers: {},
    text: async () => text,
    bytes: async () => new TextEncoder().encode(text),
  }
}

describe("normalizeTokenInput", () => {
  it("strips header prefix, cookie prefix, quotes and whitespace", () => {
    expect(normalizeTokenInput("  jwt-token: abc.def.ghi  ")).toBe("abc.def.ghi")
    expect(normalizeTokenInput("MyUser_session_id=abc.def.ghi")).toBe("abc.def.ghi")
    expect(normalizeTokenInput('"abc.def.ghi"')).toBe("abc.def.ghi")
  })
})

describe("normalizeReading", () => {
  it("parses and numerically sorts ports from chargeIndex", () => {
    const reading = normalizeReading(
      "G6177010",
      {
        result: 1,
        payload: {
          online: 1,
          devType: {
            chargeIndex: {
              "10": { portName: "10", status: "busy" },
              "2": { portName: "2", status: "idle" },
              "1": { portName: "1", status: "connected" },
            },
          },
        },
      },
      1_700_000_000_000
    )

    expect(reading.online).toBe(true)
    expect(reading.checkedAt).toBe(1_700_000_000_000)
    expect(reading.ports.map((p) => p.number)).toEqual(["1", "2", "10"])
    expect(countUsableFreePorts(reading, {})).toBe(2)
    expect(
      countUsableFreePorts(reading, {
        "G6177010:2": {
          code: "G6177010",
          port: "2",
          usability: "bad",
          note: "松动",
          updatedAt: 1,
        },
      })
    ).toBe(1)
  })

  it("classifies rate-limit and login-expired upstream rejections", () => {
    expect(() =>
      normalizeReading("G6177010", { result: 0, description: "请求过于频繁，请稍后再试" })
    ).toThrowError(ChargeClientError)

    try {
      normalizeReading("G6177010", { result: 0, description: "请求过于频繁，请稍后再试" })
    } catch (error) {
      expect((error as ChargeClientError).code).toBe("upstream_limited")
      expect((error as ChargeClientError).retryAfterMs).toBe(120_000)
    }

    try {
      normalizeReading("G6177010", { result: 0, description: "用户未登录或 token 失效" })
    } catch (error) {
      expect((error as ChargeClientError).code).toBe("login_expired")
    }
  })
})

describe("CampusChargeClient", () => {
  it("sends required WeChat H5 headers and jwt-token", async () => {
    const send = vi.fn(async () =>
      mockResponse(200, {
        result: 1,
        payload: {
          online: true,
          devType: {
            chargeIndex: { "1": { portName: "1", status: "idle" } },
          },
        },
      })
    )
    const client = new CampusChargeClient({ send } as unknown as ChargeHttp, "my-jwt-123")
    const reading = await client.queryDevice("G6177010")

    expect(reading.online).toBe(true)
    expect(send).toHaveBeenCalledTimes(1)
    const callArg = send.mock.calls[0]?.[0] as { url: string; headers: Record<string, string> }
    expect(callArg.url).toBe("https://www.washpayer.com/user/device/refreshPortStatus?logicalCode=G6177010")
    expect(callArg.headers.platform).toBe("h5")
    expect(callArg.headers["jwt-auth-domain"]).toBe("MyUser")
    expect(callArg.headers["jwt-token"]).toBe("my-jwt-123")
  })

  it("verifies token with userInfo endpoint", async () => {
    const send = vi.fn(async () =>
      mockResponse(200, { result: 1, payload: { nickName: "Alice" } })
    )
    const client = new CampusChargeClient({ send } as unknown as ChargeHttp, "valid-token")
    const result = await client.testConnection()
    expect(result.label).toBe("Alice")
  })

  it("rejects unknown device codes before calling HTTP", async () => {
    const send = vi.fn()
    const client = new CampusChargeClient({ send } as unknown as ChargeHttp, "valid-token")
    await expect(client.queryDevice("UNKNOWN")).rejects.toMatchObject({ code: "unknown_device" })
    expect(send).not.toHaveBeenCalled()
  })
})
