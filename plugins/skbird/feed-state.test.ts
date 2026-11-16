import { describe, expect, it } from "vitest"
import {
  createSkbirdFeedStateStore,
  type SkbirdFeedSnapshot,
  type SkbirdFeedStateStorage,
} from "./feed-state"

function createSlot(initial: string | null = null): SkbirdFeedStateStorage {
  let value = initial
  return {
    getItem: () => value,
    setItem: (next) => {
      value = next
    },
  }
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
  it("保存并恢复列表筛选、分页和滚动状态", () => {
    const store = createSkbirdFeedStateStore(createSlot())

    store.write(SNAPSHOT)

    expect(store.read()).toEqual(SNAPSHOT)
  })

  it("忽略旧版本或损坏的快照，避免阻断列表加载", () => {
    const oldVersion = createSkbirdFeedStateStore(
      createSlot(JSON.stringify({ ...SNAPSHOT, version: 0, threads: "invalid" }))
    )
    expect(oldVersion.read()).toBeNull()

    const malformed = createSkbirdFeedStateStore(createSlot("not json"))
    expect(malformed.read()).toBeNull()
  })

  it("会话作用域相互隔离，不写入宿主存储", () => {
    const first = createSkbirdFeedStateStore(createSlot())
    const second = createSkbirdFeedStateStore(createSlot())

    first.write(SNAPSHOT)

    expect(second.read()).toBeNull()
  })
})
