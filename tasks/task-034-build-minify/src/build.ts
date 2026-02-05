// Buggy build script - minify enabled but no sourcemaps
import { join } from "path";
import { mkdir } from "fs/promises";

const srcDir = join(import.meta.dir, ".");
const outDir = join(import.meta.dir, "..", "dist");

export async function buildMinified() {
  await mkdir(outDir, { recursive: true });

  // BUG: Minify is enabled but sourcemap is not configured
  // This makes debugging production issues nearly impossible
  const result = await Bun.build({
    entrypoints: [join(srcDir, "utils.ts")],
    outdir: outDir,
    target: "bun",
    minify: true, // Minification enabled
    // Missing: sourcemap: 'external'
  });

  if (!result.success) {
    console.error("Build failed:", result.logs);
    return {
      success: false,
      outputs: [],
      minified: true,
      hasSourcemap: false,
    };
  }

  return {
    success: true,
    outputs: result.outputs.map((o) => o.path),
    minified: true,
    hasSourcemap: false, // No sourcemap generated
  };
}

export async function getMinifiedContent(): Promise<string> {
  await mkdir(outDir, { recursive: true });

  const result = await Bun.build({
    entrypoints: [join(srcDir, "utils.ts")],
    outdir: outDir,
    target: "bun",
    minify: true,
    // Missing: sourcemap: 'external'
  });

  if (!result.success || result.outputs.length === 0) {
    return "";
  }

  return await result.outputs[0].text();
}

export function getOutputDirectory(): string {
  return outDir;
}

// Run build if executed directly
if (import.meta.main) {
  buildMinified().then(console.log);
}
