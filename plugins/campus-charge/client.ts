import type { PluginHttpService } from "@orahako/sdk"
import { DEVICE_CODE_SET, RATE_LIMIT_COOLDOWN_MS } from "./devices"
import { ChargeClientError, type ChargePort, type ChargeReading } from "./types"

const UPSTREAM_ORIGIN = "https://www.washpayer.com"
const REFRESH_PORT_URL = `${UPSTREAM_ORIGIN}/user/device/refreshPortStatus`
const USER_INFO_URL = `${UPSTREAM_ORIGIN}/user/userInfo`
const REFERER = `${UPSTREAM_ORIGIN}/user/index.html`
const WECHAT_USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/144.0.0.0 Safari/537.36 MicroMessenger/7.0.20.1781 WindowsWechat"

export type ChargeHttp = Pick<PluginHttpService, "send">

interface RawUpstreamBody {
  result?: unknown
  description?: unknown
  payload?: unknown
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function classifyUpstreamRejection(description: string): ChargeClientError {
  if (/(频繁|频率|频次)/.test(description)) {
    return new ChargeClientError(
      "upstream_limited",
      "平台要求稍后再查，已停止本轮查询",
      RATE_LIMIT_COOLDOWN_MS
    )
  }
  if (/(登录|认证|授权|token)/i.test(description)) {
    return new ChargeClientError(
      "login_expired",
      "充电平台登录已失效，请按引导重新获取 jwt-token"
    )
  }
  return new ChargeClientError(
    "query_failed",
    description ? `平台返回异常：${description.slice(0, 120)}` : "本次查询失败，状态未知；可以稍后重试"
  )
}

export function normalizeReading(
  code: string,
  body: unknown,
  now = Date.now()
): ChargeReading {
  if (!isRecord(body)) {
    throw new ChargeClientError("query_failed", "上游响应格式异常")
  }
  const raw = body as RawUpstreamBody
  if (raw.result !== 1) {
    const description = typeof raw.description === "string" ? raw.description : ""
    throw classifyUpstreamRejection(description)
  }

  const payload = isRecord(raw.payload) ? raw.payload : {}
  const devType = isRecord(payload.devType) ? payload.devType : {}
  const chargeIndex = isRecord(devType.chargeIndex) ? devType.chargeIndex : null

  if (!chargeIndex || Object.keys(chargeIndex).length === 0) {
    throw new ChargeClientError("query_failed", "未返回有效的端口状态数据")
  }

  const ports: ChargePort[] = Object.entries(chargeIndex).map(([key, value]) => {
    if (isRecord(value)) {
      return {
        number: String(value.portName ?? key),
        status: String(value.status ?? "unknown"),
      }
    }
    return {
      number: String(key),
      status: String(value ?? "unknown"),
    }
  })

  ports.sort((left, right) => {
    const leftNum = /^\d+$/.test(left.number) ? Number(left.number) : 999
    const rightNum = /^\d+$/.test(right.number) ? Number(right.number) : 999
    return leftNum - rightNum
  })

  return {
    code,
    checkedAt: now,
    online: payload.online === 1 || payload.online === true,
    ports,
  }
}

export function normalizeTokenInput(raw: string): string {
  return raw
    .trim()
    .replace(/^jwt-token\s*:\s*/i, "")
    .replace(/^MyUser_session_id=/i, "")
    .replace(/^["']|["']$/g, "")
    .trim()
}

export class CampusChargeClient {
  private readonly token: string

  constructor(
    private readonly http: ChargeHttp,
    token: string
  ) {
    this.token = normalizeTokenInput(token)
  }

  private buildHeaders(): Record<string, string> {
    return {
      platform: "h5",
      "jwt-auth-domain": "MyUser",
      "jwt-token": this.token,
      referer: REFERER,
      accept: "application/json, text/plain, */*",
      "user-agent": WECHAT_USER_AGENT,
    }
  }

  private async requestJson(url: string): Promise<unknown> {
    if (!this.token) {
      throw new ChargeClientError("not_configured", "尚未配置个人 jwt-token")
    }

    let response
    try {
      response = await this.http.send({
        method: "GET",
        url,
        headers: this.buildHeaders(),
        redirect: "manual",
      })
    } catch {
      throw new ChargeClientError(
        "query_failed",
        "网络请求失败（若在 Web 端使用，请确认代理白名单已放行 www.washpayer.com）"
      )
    }

    if (response.status === 401 || response.status === 403) {
      throw new ChargeClientError(
        "login_expired",
        "充电平台登录已失效，请按引导重新获取 jwt-token"
      )
    }
    if (response.status === 429) {
      throw new ChargeClientError(
        "upstream_limited",
        "平台限流，已自动进入冷却期",
        RATE_LIMIT_COOLDOWN_MS
      )
    }
    if (response.status < 200 || response.status >= 300) {
      throw new ChargeClientError("query_failed", `上游返回异常状态 HTTP ${response.status}`)
    }

    const text = await response.text()
    try {
      return JSON.parse(text) as unknown
    } catch {
      throw new ChargeClientError("query_failed", "上游返回非 JSON 数据，请检查网络或 Token")
    }
  }

  async queryDevice(code: string): Promise<ChargeReading> {
    if (!DEVICE_CODE_SET.has(code)) {
      throw new ChargeClientError("unknown_device", `未知设备编号：${code}`)
    }
    const url = `${REFRESH_PORT_URL}?${new URLSearchParams({ logicalCode: code }).toString()}`
    const body = await this.requestJson(url)
    return normalizeReading(code, body)
  }

  async testConnection(): Promise<{ label: string }> {
    const body = await this.requestJson(USER_INFO_URL)
    if (!isRecord(body)) {
      throw new ChargeClientError("query_failed", "上游响应格式异常")
    }
    if (body.result !== 1) {
      const description = typeof body.description === "string" ? body.description : ""
      throw classifyUpstreamRejection(description)
    }
    const payload = isRecord(body.payload) ? body.payload : {}
    const label =
      (typeof payload.nickName === "string" && payload.nickName) ||
      (typeof payload.nickname === "string" && payload.nickname) ||
      (typeof payload.phoneNumber === "string" && payload.phoneNumber) ||
      (typeof payload.userId === "string" && payload.userId) ||
      "已认证"
    return { label }
  }
}
