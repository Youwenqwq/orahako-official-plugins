import { describe, expect, it } from "vitest"
import {
  createSkbirdFeedStateStore,
  type SkbirdFeedIdentity,
  type SkbirdFeedSnapshot,
  type SkbirdFeedStateStorage,
} from "./feed-state"

function createSlot(initial: string | null = null): SkbirdFeedStateStorage & {
  set(value: string): void
} {
  let value = initial
  return {
    getItem: () => value,
    setItem: (next) => {
      value = next
    },
    set: (next) => {
      value = next
    },
  }
}

const ACCOUNT_A: SkbirdFeedIdentity = {
  token: "TOKEN_A",
  deviceId: "device-a",
  alias: "ysu",
}

const ACCOUNT_A_DEVICE_CHANGED: SkbirdFeedIdentity = {
  ...ACCOUNT_A,
  deviceId: "device-b",
}

const ACCOUNT_A_ALIAS_CHANGED: SkbirdFeedIdentity = {
  ...ACCOUNT_A,
  alias: "other-school",
}

const ACCOUNT_B: SkbirdFeedIdentity = {
  token: "TOKEN_B",
  deviceId: "device-b",
  alias: "ysu",
}

const SNAPSHOT: SkbirdFeedSnapshot = {
  version: 1,
  tab: "latest",
  wd: "考试",
  submittedWd: "考试",
  cateId: "101",
  range: "7d",
  threads: [],
  hasMore: true,
  cursor: "1700000000",
  searchPage: 3,
  searchOpen: true,
  scrollY: 640,
  mainScrollTop: 1280,
}

describe("skbird feed state", () => {
  it("保存并恢复同一账号的列表筛选、分页和滚动状态", () => {
    const store = createSkbirdFeedStateStore(createSlot())

    store.write(ACCOUNT_A, SNAPSHOT)

    expect(store.read(ACCOUNT_A)).toEqual(SNAPSHOT)
  })

  it("账号切换后丢弃上一账号的快照，使列表走正常首屏加载", () => {
    const store = createSkbirdFeedStateStore(createSlot())
    store.write(ACCOUNT_A, SNAPSHOT)

    expect(store.read(ACCOUNT_B)).toBeNull()
    expect(store.read(ACCOUNT_A_DEVICE_CHANGED)).toBeNull()
    expect(store.read(ACCOUNT_A_ALIAS_CHANGED)).toBeNull()
  })

  it("新账号写回后旧账号不再读取到新账号的快照", () => {
    const store = createSkbirdFeedStateStore(createSlot())
    const snapshotB: SkbirdFeedSnapshot = { ...SNAPSHOT, tab: "hot", threads: [] }
    store.write(ACCOUNT_A, SNAPSHOT)
    store.write(ACCOUNT_B, snapshotB)

    expect(store.read(ACCOUNT_A)).toBeNull()
    expect(store.read(ACCOUNT_B)).toEqual(snapshotB)
  })

  it("身份信息只保存在会话内存，不进入快照存储", () => {
    const slot = createSlot()
    const store = createSkbirdFeedStateStore(slot)
    store.write(ACCOUNT_A, SNAPSHOT)

    const stored = slot.getItem()
    expect(stored).not.toBeNull()
    expect(stored).not.toContain(ACCOUNT_A.token)
    expect(stored).not.toContain(ACCOUNT_A.deviceId)
  })

  it("忽略旧版本或损坏的快照，避免阻断列表加载", () => {
    const slot = createSlot()
    const store = createSkbirdFeedStateStore(slot)
    store.write(ACCOUNT_A, SNAPSHOT)

    slot.set(JSON.stringify({ ...SNAPSHOT, version: 0, threads: "invalid" }))
    expect(store.read(ACCOUNT_A)).toBeNull()

    slot.set("not json")
    expect(store.read(ACCOUNT_A)).toBeNull()
  })

  it("会话作用域相互隔离，不写入宿主存储", () => {
    const first = createSkbirdFeedStateStore(createSlot())
    const second = createSkbirdFeedStateStore(createSlot())

    first.write(ACCOUNT_A, SNAPSHOT)

    expect(second.read(ACCOUNT_A)).toBeNull()
  })
})
