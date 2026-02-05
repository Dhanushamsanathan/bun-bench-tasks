// Buggy build script - incorrect output directory path construction
import { join } from "path";

const srcDir = join(import.meta.dir, ".");

// BUG: Output directory path is incorrectly constructed
// Uses wrong base path and version format
const outDir = join(import.meta.dir, "dist", "version-1"); // Wrong: nested in src/, wrong version format

// Expected output location for the application to find
const expectedVersionedPath = "dist/v1";

export async function buildApp() {
  try {
    const result = await Bun.build({
      entrypoints: [join(srcDir, "app.ts")],
      outdir: outDir, // Wrong path - outputs to src/dist/version-1 instead of dist/v1
      target: "bun",
    });

    if (!result.success) {
      console.error("Build failed:", result.logs);
      return {
        success: false,
        outputs: [],
        outdir: outDir,
        expectedPath: expectedVersionedPath,
        error: "Build failed",
      };
    }

    return {
      success: true,
      outputs: result.outputs.map((o) => o.path),
      outdir: outDir,
      expectedPath: expectedVersionedPath,
    };
  } catch (error) {
    return {
      success: false,
      outputs: [],
      outdir: outDir,
      expectedPath: expectedVersionedPath,
      error: String(error),
    };
  }
}

export function getExpectedOutputPath(): string {
  // This is where the application expects to find the bundle
  return join(import.meta.dir, "..", expectedVersionedPath, "app.js");
}

export function getActualOutputPath(): string {
  // This is where the bundle is actually written
  return join(outDir, "app.js");
}

export function getOutputDirectory(): string {
  return outDir;
}

export function getExpectedDirectory(): string {
  return join(import.meta.dir, "..", expectedVersionedPath);
}

// Run build if executed directly
if (import.meta.main) {
  buildApp().then(console.log);
}
