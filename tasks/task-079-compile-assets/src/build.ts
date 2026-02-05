// Buggy build script - doesn't embed assets correctly
import { join } from "path";
import { mkdir } from "fs/promises";

const srcDir = join(import.meta.dir, ".");
const outDir = join(import.meta.dir, "..", "dist");

export interface BuildResult {
  success: boolean;
  outputPath: string | null;
  assetsEmbedded: boolean;
  error?: string;
}

export async function buildExecutable(): Promise<BuildResult> {
  await mkdir(outDir, { recursive: true });

  const entrypoint = join(srcDir, "app.ts");
  const outputPath = join(outDir, "myapp");

  try {
    // BUG: This build configuration doesn't properly handle asset embedding
    // The assets directory and its contents are not included
    const result = await Bun.build({
      entrypoints: [entrypoint],
      outdir: outDir,
      target: "bun",
      minify: true,
      // Missing: No special handling for embedded assets
      // The app.ts uses relative paths that won't resolve in compiled binary
    });

    if (!result.success) {
      return {
        success: false,
        outputPath: null,
        assetsEmbedded: false,
        error: result.logs.join("\n"),
      };
    }

    return {
      success: true,
      outputPath: result.outputs[0]?.path || null,
      assetsEmbedded: false, // Assets are not properly embedded
    };
  } catch (error) {
    return {
      success: false,
      outputPath: null,
      assetsEmbedded: false,
      error: String(error),
    };
  }
}

export async function compileWithCLI(): Promise<BuildResult> {
  await mkdir(outDir, { recursive: true });

  const entrypoint = join(srcDir, "app.ts");
  const outputPath = join(outDir, "myapp");

  try {
    // BUG: Running bun build --compile without ensuring assets are properly referenced
    const proc = Bun.spawn(
      ["bun", "build", "--compile", "--outfile", outputPath, entrypoint],
      {
        cwd: srcDir,
        stdout: "pipe",
        stderr: "pipe",
      }
    );

    const exitCode = await proc.exited;
    const stderr = await new Response(proc.stderr).text();

    if (exitCode !== 0) {
      return {
        success: false,
        outputPath: null,
        assetsEmbedded: false,
        error: stderr,
      };
    }

    // Even if build succeeds, assets may not be embedded correctly
    return {
      success: true,
      outputPath,
      assetsEmbedded: false, // Assets referenced incorrectly in source
    };
  } catch (error) {
    return {
      success: false,
      outputPath: null,
      assetsEmbedded: false,
      error: String(error),
    };
  }
}

export function getOutputDirectory(): string {
  return outDir;
}

// Run build if executed directly
if (import.meta.main) {
  console.log("Building with Bun.build()...");
  const result = await buildExecutable();
  console.log("Build result:", result);
}
