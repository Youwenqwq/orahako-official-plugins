import { describe, expect, it, vi } from "vitest"
import type { SkbirdConfig } from "./client"
import { createSkbirdUnreadSync } from "./unread"
import type { SkbirdUnread } from "./types"

interface Deferred<T> {
  readonly promise: Promise<T>
  resolve(value: T): void
  reject(reason: unknown): void
}

function createDeferred<T>(): Deferred<T> {
  const { promise, resolve, reject } = Promise.withResolvers<T>()
  return { promise, resolve, reject }
}

const ACCOUNT_A: SkbirdConfig = {
  token: "TOKEN_A",
  deviceId: "device-a",
  alias: "ysu",
}

const ACCOUNT_B: SkbirdConfig = {
  token: "TOKEN_B",
  deviceId: "device-b",
  alias: "ysu",
}

const UNREAD: SkbirdUnread = { imCount: 1, count: 2, markCount: 0 }

describe("skbird unread sync", () => {
  it("同一配置的并发刷新共享一个在途请求", async () => {
    const pending = createDeferred<SkbirdUnread>()
    const request = vi.fn(() => pending.promise)
    const published: number[] = []
    const refresh = createSkbirdUnreadSync({
      getConfig: () => ACCOUNT_A,
      request,
      publish: (count) => published.push(count),
    })

    const first = refresh()
    const second = refresh()

    expect(request).toHaveBeenCalledTimes(1)
    pending.resolve(UNREAD)
    await Promise.all([first, second])
    expect(published).toEqual([UNREAD.count + UNREAD.imCount])
  })

  it("配置变化立即发起新请求，旧响应按当前配置丢弃", async () => {
    let current = ACCOUNT_A
    const pendingA = createDeferred<SkbirdUnread>()
    const pendingB = createDeferred<SkbirdUnread>()
    const request = vi.fn((config: SkbirdConfig) =>
      config.token === ACCOUNT_A.token ? pendingA.promise : pendingB.promise
    )
    const published: number[] = []
    const refresh = createSkbirdUnreadSync({
      getConfig: () => current,
      request,
      publish: (count) => published.push(count),
    })

    const oldRefresh = refresh()
    expect(request).toHaveBeenCalledTimes(1)

    current = ACCOUNT_B
    const newRefresh = refresh()
    expect(request).toHaveBeenCalledTimes(2)
    expect(request.mock.calls[1]![0]).toEqual(ACCOUNT_B)

    pendingA.resolve({ imCount: 9, count: 9, markCount: 0 })
    await oldRefresh
    expect(published).toEqual([])

    // 旧请求结束不能清掉新账号仍在途的单飞记录。
    const joinedRefresh = refresh()
    expect(request).toHaveBeenCalledTimes(2)

    pendingB.resolve(UNREAD)
    await Promise.all([newRefresh, joinedRefresh])
    expect(published).toEqual([UNREAD.count + UNREAD.imCount])
  })

  it("deviceId 或 alias 变化同样视为新配置并立即请求", async () => {
    let current = ACCOUNT_A
    const pending: Deferred<SkbirdUnread>[] = []
    const request = vi.fn(() => {
      const deferred = createDeferred<SkbirdUnread>()
      pending.push(deferred)
      return deferred.promise
    })
    const published: number[] = []
    const refresh = createSkbirdUnreadSync({
      getConfig: () => current,
      request,
      publish: (count) => published.push(count),
    })

    const deviceRefresh = refresh()
    expect(request).toHaveBeenCalledTimes(1)

    current = { ...ACCOUNT_A, deviceId: "device-b" }
    const aliasRefresh = refresh()
    expect(request).toHaveBeenCalledTimes(2)

    current = { ...ACCOUNT_A, alias: "other-school" }
    const latestRefresh = refresh()
    expect(request).toHaveBeenCalledTimes(3)

    pending[0]!.resolve(UNREAD)
    await deviceRefresh
    pending[1]!.resolve(UNREAD)
    await aliasRefresh
    expect(published).toEqual([])

    pending[2]!.resolve(UNREAD)
    await latestRefresh
    expect(published).toEqual([UNREAD.count + UNREAD.imCount])
  })

  it("无 Token 清零且不再请求，清空后旧响应不发布", async () => {
    let current = ACCOUNT_A
    const pendingA = createDeferred<SkbirdUnread>()
    const request = vi.fn(() => pendingA.promise)
    const published: number[] = []
    const refresh = createSkbirdUnreadSync({
      getConfig: () => current,
      request,
      publish: (count) => published.push(count),
    })

    const inFlight = refresh()
    expect(request).toHaveBeenCalledTimes(1)

    current = { ...ACCOUNT_A, token: "" }
    await refresh()
    expect(published).toEqual([0])
    expect(request).toHaveBeenCalledTimes(1)

    pendingA.resolve({ imCount: 8, count: 8, markCount: 0 })
    await inFlight
    expect(published).toEqual([0])
  })

  it("请求失败不发布，并允许下一次刷新重试", async () => {
    const failed = createDeferred<SkbirdUnread>()
    const retried = createDeferred<SkbirdUnread>()
    const request = vi
      .fn<(config: SkbirdConfig) => Promise<SkbirdUnread>>()
      .mockImplementationOnce(() => failed.promise)
      .mockImplementationOnce(() => retried.promise)
    const published: number[] = []
    const refresh = createSkbirdUnreadSync({
      getConfig: () => ACCOUNT_A,
      request,
      publish: (count) => published.push(count),
    })

    const first = refresh()
    failed.reject(new Error("network"))
    await first
    expect(published).toEqual([])

    const second = refresh()
    expect(request).toHaveBeenCalledTimes(2)
    retried.resolve(UNREAD)
    await second
    expect(published).toEqual([UNREAD.count + UNREAD.imCount])
  })
})
