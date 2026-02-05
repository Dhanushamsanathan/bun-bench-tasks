import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { join } from "path";
import { rm, exists } from "fs/promises";
import { buildLibrary, getBundleContent } from "../src/build";

const distDir = join(import.meta.dir, "..", "dist");

describe("Bun.build() External Dependencies", () => {
  beforeAll(async () => {
    // Clean up dist directory before tests
    if (await exists(distDir)) {
      await rm(distDir, { recursive: true });
    }
  });

  afterAll(async () => {
    // Clean up after tests
    if (await exists(distDir)) {
      await rm(distDir, { recursive: true });
    }
  });

  test("should build successfully", async () => {
    const result = await buildLibrary();
    expect(result.success).toBe(true);
  });

  test("should generate output file", async () => {
    const result = await buildLibrary();
    expect(result.outputs.length).toBeGreaterThan(0);
  });

  test("bundle should not contain inlined lodash code", async () => {
    // This test will fail because lodash is bundled instead of external
    const content = await getBundleContent();

    // If lodash was external, the bundle would contain an import statement
    // not the actual implementation
    const hasLodashImport = content.includes('require("lodash")') ||
                           content.includes('from "lodash"') ||
                           content.includes("from 'lodash'");

    // The bundle should NOT contain the full lodash implementation
    const hasInlinedChunk = content.includes("chunk") && content.includes("slice");

    // This assertion will fail - lodash is bundled, not external
    expect(hasLodashImport || !hasInlinedChunk).toBe(true);
  });

  test("bundle should not contain inlined axios code", async () => {
    // This test will fail because axios is bundled instead of external
    const content = await getBundleContent();

    const hasAxiosImport = content.includes('require("axios")') ||
                          content.includes('from "axios"') ||
                          content.includes("from 'axios'");

    // The bundle should NOT contain mock axios implementation
    const hasInlinedAxios = content.includes("mockAxios");

    // This assertion will fail - axios mock is bundled
    expect(hasAxiosImport || !hasInlinedAxios).toBe(true);
  });

  test("bundle size should be small when externals are excluded", async () => {
    // This test will fail because everything is bundled
    const result = await buildLibrary();

    // With externals, bundle should be under 1KB
    // Without externals, it will be larger
    expect(result.bundleSize).toBeLessThan(1000);
  });

  test("external markers should indicate proper external handling", async () => {
    const content = await getBundleContent();

    // If externals were properly configured, these markers would be
    // replaced with actual import statements
    const hasLodashMarker = content.includes("__LODASH_EXTERNAL__");
    const hasAxiosMarker = content.includes("__AXIOS_EXTERNAL__");

    // Markers should NOT be present in properly configured build
    // This will fail because externals are bundled
    expect(hasLodashMarker && hasAxiosMarker).toBe(false);
  });
});
