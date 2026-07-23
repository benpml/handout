import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const viteConfigSource = readFileSync(
  new URL("../vite.config.ts", import.meta.url),
  "utf8",
)

describe("web build output", () => {
  it("uses opaque chunk filenames that content blockers cannot classify as embedded routes", () => {
    expect(viteConfigSource).toContain("chunkFileNames: 'assets/[hash].js'")
  })
})
