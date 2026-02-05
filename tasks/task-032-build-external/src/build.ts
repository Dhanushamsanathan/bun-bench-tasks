// Buggy build script - missing external configuration
import { join } from "path";

const srcDir = join(import.meta.dir, ".");

export async function buildLibrary() {
  // BUG: Missing 'external' option - dependencies will be bundled
  // instead of being kept as external imports
  const result = await Bun.build({
    entrypoints: [join(srcDir, "index.ts")],
    outdir: join(import.meta.dir, "..", "dist"),
    target: "bun",
    // Missing: external: ['lodash', 'axios']
  });

  if (!result.success) {
    console.error("Build failed:", result.logs);
    return { success: false, outputs: [], bundleSize: 0 };
  }

  // Get the bundle size
  const outputFile = result.outputs[0];
  const bundleSize = outputFile ? await outputFile.arrayBuffer().then(b => b.byteLength) : 0;

  return {
    success: true,
    outputs: result.outputs.map((o) => o.path),
    bundleSize,
  };
}

export async function getBundleContent(): Promise<string> {
  const result = await Bun.build({
    entrypoints: [join(srcDir, "index.ts")],
    outdir: join(import.meta.dir, "..", "dist"),
    target: "bun",
    // Missing: external: ['lodash', 'axios']
  });

  if (!result.success || result.outputs.length === 0) {
    return "";
  }

  return await result.outputs[0].text();
}

// Run build if executed directly
if (import.meta.main) {
  buildLibrary().then(console.log);
}
