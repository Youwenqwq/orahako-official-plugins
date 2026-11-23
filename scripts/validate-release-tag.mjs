import { appendFileSync } from "node:fs"
import path from "node:path"
import { ROOT, listPlugins, tagFor } from "./plugins.mjs"

const tag = process.argv[2] ?? process.env.GITHUB_REF_NAME
if (!tag) {
  console.error("Usage: node scripts/validate-release-tag.mjs <plugin-id>@<version>")
  process.exit(1)
}

const separator = tag.indexOf("@")
if (separator <= 0 || separator === tag.length - 1 || tag.indexOf("@", separator + 1) !== -1) {
  console.error(`Invalid tag "${tag}". Expected <plugin-id>@<version>.`)
  process.exit(1)
}
const pluginId = tag.slice(0, separator)
const version = tag.slice(separator + 1)

const plugins = await listPlugins()
const matches = plugins.filter((plugin) => tagFor(plugin) === tag)
if (matches.length !== 1) {
  const known = plugins.map(tagFor).join(", ")
  console.error(
    matches.length === 0
      ? `Tag "${tag}" does not match any plugin manifest. Known releases: ${known}`
      : `Tag "${tag}" matches more than one plugin manifest.`
  )
  process.exit(1)
}

const [plugin] = matches
if (plugin.id !== pluginId || plugin.version !== version) {
  console.error(`Tag "${tag}" is not an exact plugin-id@version match.`)
  process.exit(1)
}

const marketUrl =
  process.env.PLUGIN_MARKET_URL ??
  "https://raw.githubusercontent.com/Youwenqwq/orahako-plugin-registry/main/dist/plugins.json"
const response = await fetch(marketUrl, {
  cache: "no-store",
  signal: AbortSignal.timeout(30_000),
})
if (!response.ok) {
  console.error(`Cannot verify release uniqueness: market returned HTTP ${response.status}.`)
  process.exit(1)
}
const market = await response.json()
const alreadyPublished = market.plugins?.some(
  (candidate) =>
    candidate.id === plugin.id &&
    candidate.versions?.some((release) => release.version === plugin.version)
)
if (alreadyPublished) {
  console.error(
    `${tag} is already present in ${marketUrl}. Published versions are immutable; bump the manifest version.`
  )
  process.exit(1)
}

const output = {
  tag,
  plugin_id: plugin.id,
  version: plugin.version,
  directory: path.relative(ROOT, plugin.directory),
  zip: path.relative(ROOT, plugin.artifact),
}

console.log(`Validated ${tag} -> ${output.directory}`)
if (process.env.GITHUB_OUTPUT) {
  const lines = Object.entries(output)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n")
  appendFileSync(process.env.GITHUB_OUTPUT, `${lines}\n`)
} else {
  console.log(JSON.stringify(output, null, 2))
}
