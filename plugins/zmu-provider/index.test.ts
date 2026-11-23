import { describe, expect, it, vi } from "vitest"
import type { ProviderFactory, ProviderRegistryService } from "@orahako/academic-sdk"
import { definition, manifest, registerZMUProvider, type ZMUPluginContext } from "./index"
import { createZMUProvider, ZMUProvider } from "./zmu-provider"
import { ZMU_CONFIG } from "./zmu-config"
import { ZMU_GPA_SCALE } from "./grade-scale"
import { createTestSession } from "./test-support"

function createProviders() {
  const entries = new Map<string, ProviderFactory>()
  const service: ProviderRegistryService = {
    registerProvider: (schoolId, factory) => {
      entries.set(schoolId, factory)
      return () => {
        if (entries.get(schoolId) === factory) entries.delete(schoolId)
      }
    },
    hasProvider: (schoolId) => entries.has(schoolId),
    listProviders: () => Array.from(entries.keys()),
    createProvider: () => {
      throw new Error("createProvider is not exercised by this unit test")
    },
    subscribe: () => () => {},
  }
  return { service, entries }
}

describe("ZMU provider plugin", () => {
  it("declares the public services and API v1 contract", () => {
    expect(manifest.inject).toEqual(["providers", "session", "query"])
    expect(manifest.apiVersion).toBe(1)
    expect(manifest.version).toBe("1.0.0")
    expect(manifest.entry).toBe("dist/index.js")
    expect(manifest.nativeCapabilities).toBeUndefined()
    expect(definition.manifest.apiVersion).toBe(1)
    expect(definition.inject).toEqual(["providers", "session", "query"])
  })

  it("registers a provider factory under the plugin-local school id", () => {
    const providers = createProviders()
    const { session } = createTestSession({
      fetchWithJar: async () => {
        throw new Error("unexpected request")
      },
    })
    const query = { invalidate: vi.fn(), clearPersistent: vi.fn() }
    const ctx: ZMUPluginContext = { providers: providers.service, session, query }

    registerZMUProvider(ctx)

    expect(ZMU_CONFIG.id).toBe("zmu")
    expect(providers.service.hasProvider("zmu")).toBe(true)
    expect(providers.service.listProviders()).toEqual(["zmu"])
    const provider = createZMUProvider({ session, query })
    expect(provider).toBeInstanceOf(ZMUProvider)
    expect(provider.id).toBe("zmu")
    expect(provider.name).toBe(ZMU_CONFIG.name)
    expect(provider.slices.auth).toBeDefined()
    expect(provider.slices.timetable).toBeDefined()
    expect(provider.slices.grades.gpaScale).toBe(ZMU_GPA_SCALE)
    expect(provider.slices.exams).toBeDefined()
    expect(provider.slices.studentProfile).toBeDefined()
    expect(provider.supportedPlugins).toBeUndefined()
    expect(createZMUProvider({ session, query })).not.toBe(provider)
  })

  it("serves provider state from the injected session service", () => {
    const { session } = createTestSession({
      snapshot: { isAuthenticated: true, credential: "JSESSIONID=active" },
      fetchWithJar: async () => {
        throw new Error("unexpected request")
      },
    })
    const query = { invalidate: vi.fn(), clearPersistent: vi.fn() }
    const provider = createZMUProvider({ session, query })
    expect(provider.slices.auth.isAuthenticated()).toBe(true)
  })
})