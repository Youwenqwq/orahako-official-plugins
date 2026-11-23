import { fileURLToPath } from "node:url"
import { defineConfig } from "vitest/config"

// Resolve public host packages against the pinned toolchain checkout so the
// plugin tests exercise the same SDK and UI primitives that build the package.
const toolchain = process.env.ORAHAKO_TOOLCHAIN
  ? `${process.env.ORAHAKO_TOOLCHAIN.replace(/\/$/, "")}/`
  : fileURLToPath(new URL("../../toolchain/ysu-client/", import.meta.url))
const sdk = `${toolchain}packages/core/sdk/src/index.ts`
const uiPrimitives = `${toolchain}packages/core/ui-primitives/src/index.ts`

export default defineConfig({
  resolve: {
    alias: [
      { find: /^@orahako\/sdk$/, replacement: sdk },
      { find: /^@orahako\/ui-primitives$/, replacement: uiPrimitives },
    ],
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
})
