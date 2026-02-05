// Buggy build script - entrypoints should be an array but is passed as a string
import { join } from "path";

const srcDir = join(import.meta.dir, ".");

export async function buildProject() {
  // BUG: entrypoints should be an array, not a single string
  // This will only process main.ts, ignoring worker.ts
  const result = await Bun.build({
    entrypoints: join(srcDir, "main.ts") as any, // Wrong: should be an array
    outdir: join(import.meta.dir, "..", "dist"),
    target: "bun",
  });

  if (!result.success) {
    console.error("Build failed:", result.logs);
    return { success: false, outputs: [] };
  }

  return {
    success: true,
    outputs: result.outputs.map((o) => o.path),
  };
}

// Run build if executed directly
if (import.meta.main) {
  buildProject().then(console.log);
}
