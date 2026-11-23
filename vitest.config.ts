import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

// Plugin sources import host capabilities through public aliases. Resolve them
// against the pinned toolchain checkout so plugin tests exercise the same host
// implementation that builds the packages.
const toolchain = process.env.ORAHAKO_TOOLCHAIN
  ? `${process.env.ORAHAKO_TOOLCHAIN.replace(/\/$/, "")}/`
  : fileURLToPath(new URL("toolchain/ysu-client/", import.meta.url))
const sdk = `${toolchain}packages/core/sdk/src/index.ts`
const academic = `${toolchain}packages/edu/sdk/src/index.ts`
const pluginUi = `${toolchain}packages/core/ui-primitives/src/index.ts`

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\/(.*)$/, replacement: `${toolchain}$1` },
      { find: /^@orahako\/sdk$/, replacement: sdk },
      { find: /^@orahako\/academic-sdk$/, replacement: academic },
      { find: /^@orahako\/ui-primitives$/, replacement: pluginUi },
    ],
  },
  test: {
    environment: "node",
    include: ["plugins/**/*.test.ts", "plugins/**/*.test.tsx"],
  },
})
