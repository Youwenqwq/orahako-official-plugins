import type { CookieEntry, HttpRequest, HttpResponse } from "@orahako/sdk"
import type {
  CookieJar,
  CredentialInput,
  SessionService,
  SessionSnapshot,
} from "@orahako/academic-sdk"

export type ZMUTestSession = Pick<
  SessionService,
  | "getSnapshot"
  | "setCredential"
  | "clearCredential"
  | "createCookieJar"
  | "fetchWithJar"
>

/** Minimal in-memory CookieJar used to exercise public session contracts. */
export class TestCookieJar implements CookieJar {
  private cookies: CookieEntry[]

  constructor(serialized?: string) {
    this.cookies = serialized ? (JSON.parse(serialized) as CookieEntry[]) : []
  }

  async setCookie(cookie: string, url: string): Promise<void> {
    const pair = cookie.split(";")[0]?.trim()
    if (!pair) return
    const separator = pair.indexOf("=")
    if (separator < 0) return
    const name = pair.slice(0, separator).trim()
    if (!name) return
    const value = pair.slice(separator + 1).trim()
    const domain = new URL(url).hostname
    const entry: CookieEntry = {
      name,
      value,
      domain,
      path: "/",
      secure: url.startsWith("https:"),
      expires: null,
    }
    const index = this.cookies.findIndex(
      (cookie) => cookie.name === name && cookie.domain === domain && cookie.path === "/"
    )
    if (index >= 0) this.cookies[index] = entry
    else this.cookies.push(entry)
  }

  async getCookieString(): Promise<string> {
    return this.cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ")
  }

  async getAllCookies(): Promise<readonly CookieEntry[]> {
    return [...this.cookies]
  }

  async removeCookie(domain: string, path: string, key: string): Promise<void> {
    this.cookies = this.cookies.filter(
      (cookie) =>
        !(cookie.name === key && cookie.domain === domain && cookie.path === path)
    )
  }

  toJSON(): string {
    return JSON.stringify(this.cookies)
  }
}

export interface TestSessionOptions {
  snapshot?: Partial<SessionSnapshot>
  fetchWithJar: (jar: CookieJar, request: HttpRequest) => Promise<HttpResponse>
}

/**
 * Public service fake: the provider and client must only depend on these
 * contracts, so the tests never touch host stores or transports.
 */
export function createTestSession({ snapshot: initial, fetchWithJar }: TestSessionOptions) {
  let snapshot: SessionSnapshot = {
    activeSchoolId: "zmu",
    credential: null,
    username: null,
    isAuthenticated: false,
    sessionExpired: false,
    hasHydrated: true,
    artifacts: {},
    ...initial,
  }
  const session: ZMUTestSession = {
    getSnapshot: () => snapshot,
    setCredential: (input: CredentialInput) => {
      snapshot = {
        ...snapshot,
        activeSchoolId: input.schoolId,
        credential: input.credential,
        username: input.username ?? null,
        isAuthenticated: true,
        sessionExpired: false,
      }
    },
    clearCredential: () => {
      snapshot = {
        ...snapshot,
        credential: null,
        username: null,
        isAuthenticated: false,
        sessionExpired: false,
      }
    },
    createCookieJar: (serialized?: string) => new TestCookieJar(serialized),
    fetchWithJar,
  }
  return { session, getSnapshot: () => snapshot }
}
