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
- There is no community crawler, topic bot, npm SDK publication, public plugin
  template, or public development toolchain here.

## Plugins

| Directory | Plugin id | Version | Kind |
| --- | --- | --- | --- |
| `plugins/perlica-toybox` | `community.perlica-toybox` | 1.2.0 | feature |
| `plugins/skbird` | `orahako.skbird` | 1.1.0 | feature |
| `plugins/theme-arknights` | `community.theme.arknights` | 1.0.1 | theme |
| `plugins/theme-yuna` | `community.theme.yuna` | 1.0.1 | theme |
| `plugins/zmu-provider` | `zmu.provider` | 1.0.0 | provider |

The plugin sources and manifests were imported at host commit
`f04980ef49f40c459c40dbfe8e0974fb22acbf27`. Versions already present in the
public index are immutable; bump the manifest version instead of rebuilding or
editing a released one.

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

Tests include the two host-integration cases that construct `PluginRuntime` and
`ProviderPluginRegistry` through `@/` imports, plus the plugin-level unit tests.

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
