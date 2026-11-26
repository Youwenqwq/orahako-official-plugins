# Orahako Official Plugins

Source, tests, and packaging for developer-maintained Orahako plugins. All
plugins target **API v1** and restart their release lines at **1.0.0**.

The public marketplace is served from
[`Youwenqwq/orahako-plugin-registry`](https://github.com/Youwenqwq/orahako-plugin-registry)
through GitHub Raw. This repository does not serve the marketplace index and
GitHub Release asset URLs are not used as `zipUrl`: browser downloads require
the CORS contract provided by GitHub Raw.

## Plugins

| Directory | Plugin ID | Version | Kind |
| --- | --- | --- | --- |
| `plugins/daimao` | `orahako.daimao` | 1.0.0 | feature |
| `plugins/skbird` | `orahako.skbird` | 1.0.1 | feature |
| `plugins/theme-arknights` | `community.theme.arknights` | 1.0.1 | theme |
| `plugins/theme-yuna` | `community.theme.yuna` | 1.0.0 | theme |

ZMU Provider and Perlica development are paused. Their sources are retained
under `archived/`, outside plugin discovery and release builds.

## Layout

```text
plugins/<plugin>/                 Active source, tests, manifest.json, optional assets
archived/<plugin>/                Paused source excluded from discovery and builds
scripts/plugins.mjs               Plugin discovery and artifact paths
scripts/build-plugins.mjs         Pack one or all plugins via @orahako/cli
scripts/validate-release-tag.mjs  Validate <plugin-id>@<version> tags
artifacts/                        Generated ZIPs (gitignored)
```

Public host contracts and the packer are installed directly from npm:
`@orahako/sdk`, `@orahako/academic-sdk`, `@orahako/ui-primitives`, and
`@orahako/cli`. No host repository checkout or git submodule is required. Do
not import host-private modules or the removed `plugin-sdk` / `plugin-ui`
packages.

## Public contracts

External packages share only the modules listed by `PLATFORM_MODULES`: React,
React DOM, `sonner`, `@orahako/sdk`, and `@orahako/ui-primitives`.
`@orahako/academic-sdk` may be bundled into a Provider ZIP but is not a shared
host module. Other runtime dependencies are bundled by esbuild.

Plugins use the declarative `definePlugin({ manifest, inject, apply })` form.
UI registrations receive derived Props from the host renderer; they do not read
`ctx`, business React contexts, or legacy UI stores. Dictionaries use
`defineDictionary`, stores use scoped `defineStore` factories, and disposers are
bound to the plugin scope. Provider plugins register a `SchoolProvider` factory
through `ctx.providers.registerProvider`.

Every manifest has `apiVersion: 1`, a SemVer `version`, and
`entry: "dist/index.js"`. Native capabilities must be declared explicitly; a
ZIP cannot add Android code, modules, permissions, receivers, or widgets.

## Setup

Requires Node.js 24+ and pnpm 12:

```sh
pnpm install
```

## Test and build

```sh
pnpm test
pnpm build                          # all active plugins
pnpm build:plugin -- orahako.skbird # one plugin
```

Builds invoke the pinned host packer and write
`artifacts/<plugin-id>-<version>.zip`. A full build clears `artifacts/` first;
a targeted build preserves unrelated artifacts. The packer emits ESM, bundles
non-shared dependencies, compiles plugin Tailwind utilities, validates the ZIP,
and prints its exact size and SHA-256.

## Publishing

GitHub Releases preserve tagged builds and checksums for maintainers. Public
installation uses the reviewed bytes committed to the registry:

1. Build the plugin to produce `artifacts/<id>-<version>.zip`.
2. In `orahako-plugin-registry`, ingest the built ZIP and validate offline:

   ```sh
   pnpm run ingest ../orahako-official-plugins/artifacts/<id>-<version>.zip --changelog "..."
   pnpm run validate
   ```

   For a brand-new plugin, also pass `--source-path plugins/<dir>` (and any
   display overrides such as `--summary` or `--categories` if not in
   `manifest.json`).
3. Commit the updated `plugins/<id>.json`, generated `dist/plugins.json`, and
   `dist/plugins/<id>/<version>.zip` together.
4. After the registry reaches `main`, clients read the new index and ZIPs
   directly from `raw.githubusercontent.com`.

A published `<id>@<version>` is immutable. Never replace its registry asset;
bump the version for changed code.

Tags in this repository use `<plugin-id>@<version>` and must exactly match one
manifest:

```sh
pnpm validate:tag -- orahako.skbird@1.0.1
git tag orahako.skbird@1.0.1
git push origin orahako.skbird@1.0.1
```

The tag workflow checks that the version is absent from the public registry,
builds the tagged plugin, and creates a GitHub Release containing the ZIP and
SHA-256. Registry publication remains a separate reviewed commit so the exact
public bytes are validated offline before release.

## CI

`.github/workflows/ci.yml` checks out the pinned submodule, installs both
workspaces, runs all plugin tests, builds every ZIP, and uploads the artifacts.
`.github/workflows/release-plugin.yml` runs only for matching tags and requests
`contents: write`; CI requests only `contents: read`.
