// Buggy build script - wrong target for Bun-specific code
import { join } from "path";
import { mkdir } from "fs/promises";

const srcDir = join(import.meta.dir, ".");
const outDir = join(import.meta.dir, "..", "dist");

export async function buildServer() {
  await mkdir(outDir, { recursive: true });

  // BUG: Target is "node" but the code uses Bun-specific APIs
  // This will cause issues when the bundled code is executed
  const result = await Bun.build({
    entrypoints: [join(srcDir, "server.ts")],
    outdir: outDir,
    target: "node", // WRONG: Should be "bun" for Bun-specific code
  });

  if (!result.success) {
    console.error("Build failed:", result.logs);
    return {
      success: false,
      outputs: [],
      target: "node",
    };
  }

  return {
    success: true,
    outputs: result.outputs.map((o) => o.path),
    target: "node",
  };
}

export async function getBundleContent(): Promise<string> {
  await mkdir(outDir, { recursive: true });

  const result = await Bun.build({
    entrypoints: [join(srcDir, "server.ts")],
    outdir: outDir,
    target: "node", // WRONG target
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
  buildServer().then(console.log);
}
