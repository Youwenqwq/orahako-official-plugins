import { spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
import { mkdir, rm } from "node:fs/promises"
import path from "node:path"
import { ARTIFACTS_DIR, TOOLCHAIN_DIR, listPlugins } from "./plugins.mjs"

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

const packer = path.join(TOOLCHAIN_DIR, "scripts", "plugin.ts")
const tsxCli = path.join(TOOLCHAIN_DIR, "node_modules", "tsx", "dist", "cli.mjs")
if (!existsSync(packer) || !existsSync(tsxCli)) {
  console.error(
    `Incomplete pinned toolchain at ${path.relative(process.cwd(), TOOLCHAIN_DIR)}. ` +
      "Run: git submodule update --init --recursive && pnpm --dir toolchain/ysu-client install --frozen-lockfile"
  )
  process.exit(1)
}

// A full build starts from a clean output directory. A targeted build keeps
// unrelated artifacts so local release dry runs do not disturb them.
if (!requested[0]) await rm(ARTIFACTS_DIR, { recursive: true, force: true })
await mkdir(ARTIFACTS_DIR, { recursive: true })

const results = []
for (const plugin of selected) {
  console.log(`Packing ${plugin.id}@${plugin.version} -> ${path.relative(process.cwd(), plugin.artifact)}`)
  const result = spawnSync(
    process.execPath,
    [tsxCli, packer, "pack", plugin.directory, plugin.artifact],
    { cwd: process.cwd(), stdio: "inherit" }
  )
  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(
      `Packing ${plugin.id} failed with exit code ${result.status}. ` +
        "Install the pinned toolchain dependencies first: pnpm --dir toolchain/ysu-client install --frozen-lockfile"
    )
  }
  results.push({
    id: plugin.id,
    version: plugin.version,
    artifact: path.relative(process.cwd(), plugin.artifact),
  })
}

console.log(JSON.stringify(results, null, 2))
