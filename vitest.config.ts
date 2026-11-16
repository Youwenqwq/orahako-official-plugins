import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

// Plugin sources import host capabilities through public aliases. Resolve them
// against the pinned toolchain checkout so plugin tests exercise the same host
// implementation that builds the packages.
const toolchain = process.env.ORAHAKO_TOOLCHAIN
  ? `${process.env.ORAHAKO_TOOLCHAIN.replace(/\/$/, "")}/`
  : fileURLToPath(new URL("toolchain/ysu-client/", import.meta.url))
const sdk = `${toolchain}packages/plugin-sdk/`
const academic = `${toolchain}packages/academic/`
const pluginUi = `${toolchain}packages/plugin-ui/`

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@\/(.*)$/, replacement: `${toolchain}$1` },
      { find: /^@orahako\/plugin-sdk$/, replacement: `${sdk}index.ts` },
      { find: /^@orahako\/plugin-sdk\/(.*)$/, replacement: `${sdk}$1` },
      { find: /^@orahako\/academic$/, replacement: `${academic}index.ts` },
      { find: /^@orahako\/academic\/(.*)$/, replacement: `${academic}$1` },
      { find: /^@orahako\/plugin-ui$/, replacement: `${pluginUi}index.ts` },
      { find: /^@orahako\/plugin-ui\/(.*)$/, replacement: `${pluginUi}$1` },
    ],
  },
  test: {
    environment: "node",
    include: ["plugins/**/*.test.ts", "plugins/**/*.test.tsx"],
  },
})
