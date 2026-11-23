import {
  type AcademicSliceMap,
  type Credential,
  type CurrentWeek,
  type CurrentWeekQueryOptions,
  type GPAStats,
  type Grade,
  type LoginStep1Input,
  type LoginStep1Result,
  type QueryService,
  type SchoolProvider,
  type SessionService,
  ProviderError,
  ProviderErrorCode,
} from "@orahako/academic-sdk"
import { currentWeekFromContext } from "./protocol/mappers"
import { ZMUClient } from "./protocol/client"
import { ZMU_GPA_SCALE } from "./grade-scale"
import { ZMU_CONFIG } from "./zmu-config"

/** Injected host services the provider uses through public contracts only. */
export interface ZMUProviderServices {
  session: Pick<
    SessionService,
    "getSnapshot" | "setCredential" | "clearCredential" | "createCookieJar" | "fetchWithJar"
  >
  query: Pick<QueryService, "invalidate" | "clearPersistent">
}

/** Academic slices contributed by the ZMU provider. */
export type ZMUAcademicSlices = Pick<
  AcademicSliceMap,
  "auth" | "timetable" | "grades" | "exams" | "studentProfile"
>

function rounded(value: number): { text: string; value: number } | undefined {
  if (!Number.isFinite(value)) return undefined
  const normalized = Math.round(value * 100) / 100
  return { text: normalized.toFixed(2), value: normalized }
}

export class ZMUProvider implements SchoolProvider {
  readonly id = ZMU_CONFIG.id
  readonly name = ZMU_CONFIG.name
  readonly slices: ZMUAcademicSlices
  private readonly client: ZMUClient
  private initialized = false

  constructor(
    private readonly services: ZMUProviderServices,
    client?: ZMUClient
  ) {
    this.client = client ?? new ZMUClient(services.session)
    this.slices = {
      auth: {
        prepareLogin: () => this.client.prepareLogin(),
        resetLoginSession: () => this.client.reset(),
        getCaptchaUrl: () => this.client.captchaUrl,
        checkCaptchaNeeded: async () => {
          await this.client.refreshCaptcha()
          return true
        },
        login: (credential) => this.login(credential),
        loginStep1: (input) => this.loginStep1(input),
        checkAuthStatus: async () => {
          if (!this.services.session.getSnapshot().credential) return { authenticated: false }
          return { authenticated: await this.client.checkAuthStatus() }
        },
        isAuthenticated: () => this.services.session.getSnapshot().isAuthenticated,
      },
      timetable: {
        getSchedule: (options) => this.client.getSchedule(options),
        getUnscheduledCourses: async () => {
          throw new ProviderError(
            ProviderErrorCode.FEATURE_NOT_SUPPORTED,
            "ZMU does not expose an unscheduled-course query"
          )
        },
        getClassPeriods: async () =>
          Array.from({ length: 12 }, (_, index) => ({
            name: `第${String(index + 1).padStart(2, "0")}节`,
            section: index + 1,
            isInUse: true,
          })),
        getTermCalendar: async (options) => {
          const current = await this.getCurrentWeek(options)
          const start = new Date(`${current.weekStartDate}T12:00:00Z`)
          start.setUTCDate(start.getUTCDate() - (current.week - 1) * 7)
          return {
            semester: current.semester,
            startDate: start.toISOString().slice(0, 10),
            totalWeeks: 24,
            teachingWeeks: 24,
            isInUse: true,
            raw: current.raw,
          }
        },
        getCurrentWeek: (options) => this.getCurrentWeek(options),
        getCurrentWeekNumber: async (options) => (await this.getCurrentWeek(options)).week,
      },
      grades: {
        getGrades: (options) => this.client.getGrades(options),
        getGPAStats: () => this.getGPAStats(),
        gpaScale: ZMU_GPA_SCALE,
      },
      exams: {
        getExams: (options) => this.client.getExams(options),
      },
      studentProfile: {
        getStudentInfo: () => this.client.getStudentInfo(),
      },
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) return
    const snapshot = this.services.session.getSnapshot()
    if (!snapshot.activeSchoolId || snapshot.activeSchoolId === this.id) {
      const credential = snapshot.credential
      if (credential) {
        try {
          this.client.restore(credential)
          if (!(await this.client.hasSession())) this.services.session.clearCredential(this.id)
        } catch {
          this.client.reset()
          this.services.session.clearCredential(this.id)
        }
      }
    }
    this.initialized = true
  }

  async reset(): Promise<void> {
    this.client.reset()
    this.services.query.clearPersistent()
    this.services.query.invalidate()
    this.initialized = false
  }

  async logout(): Promise<void> {
    try {
      await this.client.logout()
    } catch {
      // 本地登出不因服务端会话已失效而阻塞。
    } finally {
      await this.reset()
      this.services.session.clearCredential(this.id)
    }
  }

  async relogin(): Promise<boolean> {
    const credential = this.services.session.getSnapshot().credential
    if (!credential) return false
    try {
      this.client.restore(credential)
      return await this.client.checkAuthStatus()
    } catch {
      this.client.reset()
      return false
    }
  }

  private async login(credential: Credential): Promise<void> {
    if (!this.client.captchaUrl) {
      this.client.reset()
      await this.client.prepareLogin()
      await this.client.refreshCaptcha()
      throw new ProviderError(
        ProviderErrorCode.AUTH_CAPTCHA_REQUIRED,
        "Captcha required",
        undefined,
        403
      )
    }
    const captcha = credential.metadata?.captcha
    if (typeof captcha !== "string" || !captcha) {
      throw new ProviderError(
        ProviderErrorCode.AUTH_CAPTCHA_REQUIRED,
        "Captcha required",
        undefined,
        403
      )
    }
    const result = await this.loginStep1({
      username: credential.username,
      password: credential.password,
      captcha,
    })
    if (result.credential) {
      this.services.session.setCredential({
        schoolId: this.id,
        credential: result.credential,
        username: result.username,
      })
    }
  }

  private async loginStep1(input: LoginStep1Input): Promise<LoginStep1Result> {
    if (!input.captcha) {
      throw new ProviderError(
        ProviderErrorCode.AUTH_CAPTCHA_REQUIRED,
        "Captcha required",
        undefined,
        403
      )
    }
    const result = await this.client.login(input.username, input.password, input.captcha)
    if (result.code >= 0) {
      return {
        authenticated: true,
        needsMfa: false,
        username: input.username,
        credential: this.client.credential,
      }
    }
    if (result.code === -302) {
      throw new ProviderError(
        ProviderErrorCode.AUTH_MFA_REQUIRED,
        "遵医教务要求微信扫码二次认证，当前最小适配不支持该步骤",
        result,
        403
      )
    }
    if (result.message.includes("验证码")) {
      throw new ProviderError(ProviderErrorCode.AUTH_CAPTCHA_REQUIRED, result.message, result, 403)
    }
    throw new ProviderError(
      ProviderErrorCode.AUTH_INVALID_CREDENTIAL,
      result.message || "遵医教务登录失败",
      result,
      401
    )
  }

  private async getGPAStats(): Promise<GPAStats> {
    const grades = (await this.client.getGrades()).filter(
      (grade) => grade.isValid && grade.numericCredit !== undefined
    )
    const creditSum = (rows: Grade[]) =>
      rows.reduce((sum, grade) => sum + (grade.numericCredit ?? 0), 0)
    const scored = grades.filter((grade) => grade.numericScore !== undefined)
    const withPoints = grades.filter((grade) => grade.numericGradePoint !== undefined)
    const weightedAvg = rounded(
      scored.reduce((sum, grade) => sum + grade.numericScore! * grade.numericCredit!, 0) /
        creditSum(scored)
    )
    const arithmeticAvg = rounded(
      scored.reduce((sum, grade) => sum + grade.numericScore!, 0) / scored.length
    )
    const gpa = rounded(
      withPoints.reduce((sum, grade) => sum + grade.numericGradePoint! * grade.numericCredit!, 0) /
        creditSum(withPoints)
    )
    return {
      gpaInitial: gpa?.text,
      numericGpaInitial: gpa?.value,
      gpaHighest: gpa?.text,
      numericGpaHighest: gpa?.value,
      weightedAvg: weightedAvg?.text,
      numericWeightedAvg: weightedAvg?.value,
      arithmeticAvg: arithmeticAvg?.text,
      numericArithmeticAvg: arithmeticAvg?.value,
    }
  }

  private async getCurrentWeek(options?: CurrentWeekQueryOptions): Promise<CurrentWeek> {
    const context = await this.client.getTermContext(options?.semester)
    const date =
      options?.date ??
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Shanghai",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date())
    return currentWeekFromContext(context, date)
  }
}

export function createZMUProvider(
  services: ZMUProviderServices,
  client?: ZMUClient
): ZMUProvider {
  return new ZMUProvider(services, client)
}