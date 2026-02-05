// Buggy build script - incorrect target specification for cross-compilation
import { join } from "path";
import { mkdir } from "fs/promises";

const srcDir = join(import.meta.dir, ".");
const outDir = join(import.meta.dir, "..", "dist");

// BUG: These target names are incorrect
// Using OS names instead of Bun's specific target identifiers
const INVALID_TARGETS = {
  linux: "linux-x64", // Wrong: should be "bun-linux-x64"
  macos: "darwin-arm64", // Wrong: should be "bun-darwin-arm64"
  windows: "windows-x64", // Wrong: should be "bun-windows-x64"
};

export type TargetPlatform = "linux" | "macos" | "windows";

export interface BuildResult {
  success: boolean;
  outputPath: string | null;
  target: string;
  error?: string;
}

export async function buildForTarget(
  platform: TargetPlatform
): Promise<BuildResult> {
  await mkdir(outDir, { recursive: true });

  const entrypoint = join(srcDir, "app.ts");
  // BUG: Using invalid target identifier
  const target = INVALID_TARGETS[platform];
  const outputName = platform === "windows" ? "myapp.exe" : "myapp";
  const outputPath = join(outDir, `${platform}-${outputName}`);

  try {
    // BUG: Target format is wrong - missing "bun-" prefix
    const proc = Bun.spawn(
      [
        "bun",
        "build",
        "--compile",
        `--target=${target}`, // Invalid target format
        "--outfile",
        outputPath,
        entrypoint,
      ],
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
        target,
        error: stderr,
      };
    }

    return {
      success: true,
      outputPath,
      target,
    };
  } catch (error) {
    return {
      success: false,
      outputPath: null,
      target,
      error: String(error),
    };
  }
}

export async function buildForAllTargets(): Promise<
  Record<TargetPlatform, BuildResult>
> {
  const targets: TargetPlatform[] = ["linux", "macos", "windows"];
  const results: Record<string, BuildResult> = {};

  for (const target of targets) {
    results[target] = await buildForTarget(target);
  }

  return results as Record<TargetPlatform, BuildResult>;
}

export function getValidTargets(): string[] {
  // BUG: Returns invalid target names
  return Object.values(INVALID_TARGETS);
}

export function isValidTarget(target: string): boolean {
  // BUG: Validates against wrong target format
  return Object.values(INVALID_TARGETS).includes(target);
}

export function getOutputDirectory(): string {
  return outDir;
}

// Run build if executed directly
if (import.meta.main) {
  const args = process.argv.slice(2);
  const platform = (args[0] as TargetPlatform) || "linux";

  console.log(`Building for ${platform}...`);
  const result = await buildForTarget(platform);
  console.log("Build result:", result);
}
