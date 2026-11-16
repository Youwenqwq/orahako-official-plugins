# Orahako Official Plugins

Private build workspace for the developer-maintained Orahako plugins. It holds
plugin source, tests, and packaging automation. It does **not** serve public
marketplace metadata, and its releases are not public distribution.

## Status and boundaries

- This repository is private. GitHub Releases here are internal builds for
  maintainers and testers.
- Public plugin distribution stays in the main `Youwenqwq/ysu-client`
  repository and at <https://ysu.welain.com/updates/plugins.json>. Nothing in
  this repository changes the public index, ZIP URLs, hashes, sizes, or publish
  timestamps.
- Marketplace metadata generation lives in the separate private
  `orahako-plugin-registry` repository.
- The public SDK (`@orahako/plugin-sdk`), UI kit (`@orahako/plugin-ui`) and
  plugin templates (`packages/plugin-template`, `packages/plugin-shell-template`)
  live in the host repository. This repository only builds the
  developer-maintained plugins against the pinned host checkout.
- There is no community crawler, topic bot, or npm SDK publication.

## Plugins

| Directory | Plugin id | Version | Kind |
| --- | --- | --- | --- |
| `plugins/perlica-toybox` | `community.perlica-toybox` | 1.3.0 | feature |
| `plugins/skbird` | `orahako.skbird` | 1.2.0 | feature |
| `plugins/theme-arknights` | `community.theme.arknights` | 1.0.1 | theme |
| `plugins/theme-yuna` | `community.theme.yuna` | 1.0.1 | theme |
| `plugins/zmu-provider` | `zmu.provider` | 1.0.0 | provider |

All manifests target API 2 (`apiVersion: 2`). API 1 ZIPs are intentionally
incompatible with the current host and are rejected; published versions are
immutable, so bump the manifest version instead of rebuilding or editing a
released one.

## Layout

```text
plugins/<plugin>/          Plugin sources, tests, and manifest.json
toolchain/ysu-client/      Pinned host submodule (build script + SDK packages)
scripts/plugins.mjs        Plugin discovery shared by build and release scripts
scripts/build-plugins.mjs  Pack one or all plugins through the host packer
scripts/validate-release-tag.mjs  Validate <plugin-id>@<version> tags
artifacts/                 Generated ZIPs (gitignored)
```

Host integration is resolved from the pinned toolchain, never from a checkout
of a dirty working tree. The `@orahako/*` and `@/` aliases in `vitest.config.ts`
point at `toolchain/ysu-client`, so the existing host-integration tests run
against the host surface that produced the current artifacts. Because the root
workspace links `plugin-sdk` and `plugin-ui` from that submodule, update the
submodule pin and refresh `pnpm-lock.yaml` together.

Set `ORAHAKO_TOOLCHAIN` to an absolute path to run the build and tests against a
different host checkout:

```sh
ORAHAKO_TOOLCHAIN=/home/me/ysu-client pnpm build
ORAHAKO_TOOLCHAIN=/home/me/ysu-client pnpm test
```

`scripts/plugins.mjs` and `vitest.config.ts` both honor the override. The pnpm
workspace still links SDK/UI packages from `toolchain/ysu-client`, so install
dependencies in that checkout and keep the override's public SDK surface
compatible with the pins; an override does not rewrite `pnpm-lock.yaml`.

## Public plugin services

Plugins consume the host only through public contracts:

- `@orahako/plugin-sdk` subpaths: `runtime`, `composition`, `manifest`,
  `academic`, `ui`, `slots`, `i18n`, `services`, `session`,
  `provider-runtime`, `query`, `navigation`, `events`, `providers`,
  `provider-base`, `provider-capabilities`, `provider-errors`,
  `crypto`, `market`, `installer`, `http`, `kernel`, `mfa`.
- `@orahako/plugin-ui` subpaths and `@orahako/academic` for shared UI and
  academic components.
- The scoped `PluginContext` services: `ui`, `slots`, `settings`,
  `notifications`, `i18n`, `providers`, `session`, `provider`, `query`,
  `navigation`, `plugins`, `storage`, `http` (including read-only
  `http.activity`), `native` (versioned capabilities), `assets` and `mfa`.

There is no `@orahako/plugin-sdk/host` entry point and no official-only private
API. External packages may not import `@/` host modules; the host rejects bare
imports outside its shared module table and resolves only package-relative
imports inside a ZIP. An external package can declare `provides` in its manifest
to expose a new root service to other plugins and `inject` to consume one;
replacing a core service that the host composition already provides requires a
host composition change, not a marketplace install. Notifications use open
channel strings, network activity is read-only (no URLs), and native access is
limited to capabilities compiled into the host.

## Native capabilities

Plugins that use Android capabilities declare them in `manifest.json`, for
example:

```json
{
  "nativeCapabilities": ["native.geolocation@1"]
}
```

The host installs a package only when every declared capability is enabled by
the app's build composition (`assets/native-companion.json`). A market release
may also declare `nativeCapabilities`; the host filters releases whose declared
capabilities are unavailable. A ZIP cannot add Kotlin code or Gradle modules: a
new native capability requires a new host build with a companion module, a
capability factory and a composition entry. Declaring a capability never grants
permission by itself; call `ctx.native.capabilities.has()` and handle
unavailable/denied results.

## Requirements

- Node.js 24 or newer
- pnpm 12 (pinned by `packageManager`)
- Git submodule support

## Setup

```sh
git submodule update --init --recursive
pnpm --dir toolchain/ysu-client install --frozen-lockfile
pnpm install
```

The root workspace links `@orahako/plugin-sdk` and `@orahako/plugin-ui` from the
pinned toolchain for `plugins/perlica-toybox`. Non-host runtime dependencies
such as `leaflet`, `html5-qrcode`, `lucide-react`, `zustand`, `sonner`, and
`react` are installed by the root package so plugins without their own
`package.json` resolve them while packing.

## Test

```sh
pnpm test        # one run
pnpm test:watch  # watch mode
```

Tests include a host-integration case that constructs `PluginRuntime` and the UI
registry through `@/` imports, plus the plugin-level unit tests.

## Build

```sh
pnpm build                          # all five plugins
pnpm build:plugin -- orahako.skbird # one plugin
```

Both commands invoke the pinned toolchain's `scripts/plugin.ts pack` command and
write ZIPs to `artifacts/<plugin-id>-<version>.zip`. A full build clears
`artifacts/` first; a targeted build leaves other artifacts alone. The plugin
packer also writes each plugin's `dist/` directory next to its sources; both
`artifacts/` and `plugins/*/dist/` are gitignored.

The packer validates the manifest (`apiVersion` must be `2`), bundles the entry
as ESM while externalizing host-shared modules, and, when the plugin uses
Tailwind utilities, compiles them into `dist/tailwind.css` and appends it to the
packaged `manifest.styles`. Styles are therefore owned by the plugin ZIP rather
than the host stylesheet. It prints the ZIP path, byte size and SHA-256; the
market index must record exactly that hash and size.

Builds require the toolchain dependencies to be installed because the packer
uses the host's esbuild, PostCSS, Tailwind, and manifest validator.

## Releases

Releases are tag-driven:

```sh
git tag community.theme.yuna@1.0.1
git push origin community.theme.yuna@1.0.1
```

The release workflow requires the tag to be exactly
`<plugin-id>@<version>` and to match one plugin manifest. It builds only that
plugin, attaches the ZIP to a GitHub Release, and records the artifact SHA-256
in the release notes. A mismatched or unknown tag fails before building. The
validator also fails closed if the public market cannot be reached or already
contains the same `id@version`; rebuilds never replace a published version.
The same checks can be run locally:

```sh
pnpm validate:tag -- community.theme.yuna@1.0.1
```

Because this repository is private, these Releases are internal only. Public
users continue to install from the ZIPs distributed by the main website. Public
object/CDN delivery and marketplace metadata publication are a later phase.

## CI

`.github/workflows/ci.yml` runs on pushes and pull requests. It checks out the
pinned submodule, installs both the toolchain and root workspace dependencies,
runs `pnpm test`, builds all ZIPs, and uploads them as the `plugin-zips` build
artifact. Workflows request only the permissions they need: `contents: read` for
CI and `contents: write` for releases.
