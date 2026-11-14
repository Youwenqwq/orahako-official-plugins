import { describe, expect, it, vi } from "vitest"

const storage = vi.hoisted(() => ({
  getItem: vi.fn(async () => null),
  setItem: vi.fn(async () => undefined),
  removeItem: vi.fn(async () => undefined),
}))

vi.mock("@orahako/plugin-ui/stores", () => ({ secureStorage: storage }))

import { useSkbirdStore } from "./store"

describe("Skbird credential persistence", () => {
  it("rehydrates and writes with the plugin-owned non-empty key", async () => {
    await vi.waitFor(() => expect(useSkbirdStore.getState().hasHydrated).toBe(true))

    expect(storage.getItem).toHaveBeenCalledWith("orahako-skbird")
    expect(storage.setItem).toHaveBeenCalledWith("orahako-skbird", expect.any(String))
    for (const call of storage.setItem.mock.calls) {
      expect(call[0]).toBeTruthy()
    }
  })
})
