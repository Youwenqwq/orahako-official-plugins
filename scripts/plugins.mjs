import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

export const ROOT = fileURLToPath(new URL("..", import.meta.url))
export const PLUGINS_DIR = path.join(ROOT, "plugins")
export const TOOLCHAIN_DIR = path.join(ROOT, "toolchain", "ysu-client")
export const ARTIFACTS_DIR = path.join(ROOT, "artifacts")

/**
 * Read every plugin directory from `plugins/` and return its manifest data.
 * Directories without a manifest are ignored so editor/OS leftovers do not
 * break the build.
 */
export async function listPlugins() {
  const entries = await readdir(PLUGINS_DIR, { withFileTypes: true })
  const plugins = []
  for (const entry of entries) {
    if (!entry.isDirectory()) continue
    const directory = path.join(PLUGINS_DIR, entry.name)
    const manifestPath = path.join(directory, "manifest.json")
    let source
    try {
      source = await readFile(manifestPath, "utf8")
    } catch (error) {
      if (error.code === "ENOENT") continue
      throw error
    }
    const manifest = JSON.parse(source)
    if (typeof manifest.id !== "string" || typeof manifest.version !== "string") {
      throw new Error(`Missing id or version in ${path.relative(ROOT, manifestPath)}`)
    }
    if (/[/\\]/.test(manifest.id) || /[/\\]/.test(manifest.version)) {
      throw new Error(`Invalid id or version in ${path.relative(ROOT, manifestPath)}`)
    }
    plugins.push({
      id: manifest.id,
      version: manifest.version,
      directory,
      artifact: path.join(ARTIFACTS_DIR, `${manifest.id}-${manifest.version}.zip`),
    })
  }
  plugins.sort((left, right) => left.id.localeCompare(right.id))
  const duplicated = plugins.find(
    (plugin, index) => index > 0 && plugins[index - 1].id === plugin.id
  )
  if (duplicated) throw new Error(`Duplicate plugin id: ${duplicated.id}`)
  return plugins
}

export function tagFor(plugin) {
  return `${plugin.id}@${plugin.version}`
}
