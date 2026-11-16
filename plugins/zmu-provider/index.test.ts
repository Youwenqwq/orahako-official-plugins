import { describe, expect, it, vi } from "vitest"
import type {
  PluginContext,
  PluginProviderService,
  ProviderFactory,
} from "@orahako/plugin-sdk"
import { definition, manifest } from "./index"
import { ZMU_CONFIG } from "./zmu-config"
import { ZMUProvider } from "./zmu-provider"
import { createTestSession } from "./test-support"

function createProviders() {
  const entries = new Map<string, ProviderFactory>()
  const service: PluginProviderService = {
    registerProvider: (schoolId, factory) => {
      entries.set(schoolId, factory)
      return () => {
        if (entries.get(schoolId) === factory) entries.delete(schoolId)
      }
    },
    hasProvider: (schoolId) => entries.has(schoolId),
  }
  return { service, entries }
}

describe("ZMU provider plugin", () => {
  it("declares the public services and storage it needs", () => {
    expect(manifest.inject).toEqual(["providers", "session", "query"])
    expect(manifest.nativeCapabilities).toBeUndefined()
  })

  it("registers a provider factory under the plugin-local school id", () => {
    const providers = createProviders()
    const { session } = createTestSession({
      fetchWithJar: async () => {
        throw new Error("unexpected request")
      },
    })
    const query = { invalidate: vi.fn(), clearPersistent: vi.fn() }
    const ctx = { providers: providers.service, session, query } as unknown as PluginContext

    definition(ctx)

    expect(ZMU_CONFIG.id).toBe("zmu")
    expect(providers.service.hasProvider("zmu")).toBe(true)
    const create = providers.entries.get("zmu")!

    const provider = create(ctx)
    expect(provider).toBeInstanceOf(ZMUProvider)
    expect(provider.id).toBe("zmu")
    expect(provider.name).toBe(ZMU_CONFIG.name)
    expect(provider.capabilities.schedule).toBe(true)
    expect(provider.capabilities.exams).toBe(true)
    expect(provider.capabilities.ecard).toBe(false)
    expect(provider.supportedPlugins).toBeUndefined()
    expect(create(ctx)).not.toBe(provider)
  })

  it("serves provider state from the context passed to the factory", () => {
    const providers = createProviders()
    const { session } = createTestSession({
      snapshot: { isAuthenticated: true, credential: "JSESSIONID=active" },
      fetchWithJar: async () => {
        throw new Error("unexpected request")
      },
    })
    const query = { invalidate: vi.fn(), clearPersistent: vi.fn() }
    const ctx = { providers: providers.service, session, query } as unknown as PluginContext

    definition(ctx)
    const provider = providers.entries.get("zmu")!(ctx)
    expect(provider.isAuthenticated()).toBe(true)
  })
})
