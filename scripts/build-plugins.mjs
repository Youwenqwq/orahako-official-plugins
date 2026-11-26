import { mkdir, rm } from "node:fs/promises"
import path from "node:path"
import { packPlugin } from "@orahako/cli"
import { ARTIFACTS_DIR, listPlugins } from "./plugins.mjs"

const requested = process.argv.slice(2).filter((argument) => argument !== "--")
if (requested.length > 1) {
  console.error("Usage: node scripts/build-plugins.mjs [plugin-id]")
  process.exit(1)
}

const plugins = await listPlugins()
if (plugins.length === 0) {
  console.error("No plugins found under plugins/")
  process.exit(1)
}
const selected = requested[0]
  ? plugins.filter((plugin) => plugin.id === requested[0])
  : plugins
if (selected.length === 0) {
  console.error(`Unknown plugin: ${requested[0]}`)
  console.error(`Known plugins: ${plugins.map((plugin) => plugin.id).join(", ")}`)
  process.exit(1)
}

// A full build starts from a clean output directory. A targeted build keeps
// unrelated artifacts so local release dry runs do not disturb them.
if (!requested[0]) await rm(ARTIFACTS_DIR, { recursive: true, force: true })
await mkdir(ARTIFACTS_DIR, { recursive: true })

const results = []
for (const plugin of selected) {
  console.log(`Packing ${plugin.id}@${plugin.version} -> ${path.relative(process.cwd(), plugin.artifact)}`)
  const packed = await packPlugin(plugin.directory, plugin.artifact)
  results.push({
    id: packed.id,
    version: packed.version,
    artifact: path.relative(process.cwd(), packed.output),
    size: packed.size,
    sha256: packed.sha256,
  })
}

console.log(JSON.stringify(results, null, 2))
