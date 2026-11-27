import type { ChargeDevice } from "./types"

export const CHARGE_DEVICES: readonly ChargeDevice[] = [
  { code: "G6177010", name: "A01" },
  { code: "G6176342", name: "A02" },
  { code: "G6176353", name: "A03" },
  { code: "G6176388", name: "A04" },
  { code: "G6177026", name: "A05" },
  { code: "G6176370", name: "A06" },
  { code: "G6231661", name: "A07" },
  { code: "G6177011", name: "A08" },
  { code: "G6177029", name: "A09" },
  { code: "G6176369", name: "A10" },
  { code: "G6176343", name: "A11" },
  { code: "G6176292", name: "A12" },
  { code: "G6176346", name: "A13" },
  { code: "G6177028", name: "A14" },
  { code: "G6156159", name: "A15" },
  { code: "G6231634", name: "A16" },
  { code: "G6176290", name: "A17" },
  { code: "G6177020", name: "A18" },
  { code: "G6177027", name: "A19" },
  { code: "G6176381", name: "A20" },
] as const

export const DEVICE_CODE_SET = new Set(CHARGE_DEVICES.map((device) => device.code))

/** 60-second reading freshness window matching upstream server cache TTL. */
export const READING_TTL_MS = 60_000

/** Minimum delay between sequential upstream device queries. */
export const MIN_QUERY_INTERVAL_MS = 1_500

/** Cooldown duration applied when upstream signals rate limiting. */
export const RATE_LIMIT_COOLDOWN_MS = 120_000

/** Entry link to open in WeChat to establish a washpayer.com session. */
export const WECHAT_LOGIN_URL = "https://www.washpayer.com/userLogin?l=G6177010"

/** Debug link that enables washpayer.com's built-in vConsole inside WeChat. */
export const WECHAT_VCONSOLE_URL = "https://www.washpayer.com/user/index.html?isTest=1"

/** One-liner for vConsole Console tab to print the jwt-token from cookies. */
export const VCONSOLE_EXTRACT_SNIPPET =
  "document.cookie.match(/MyUser_session_id=([^;]+)/)?.[1] || '未找到，请先完成微信登录'"
