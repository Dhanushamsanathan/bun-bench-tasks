// Fixed build script - properly embeds assets in compiled executable
import { join } from "path";
import { mkdir, exists } from "fs/promises";

const srcDir = join(import.meta.dir, "..", "src");
const outDir = join(import.meta.dir, "..", "dist");

export interface BuildResult {
  success: boolean;
  outputPath: string | null;
  assetsEmbedded: boolean;
  error?: string;
}

// FIX: Create a modified app.ts that properly references assets for embedding
async function createEmbeddableApp(): Promise<string> {
  const appCode = `
// Fixed application with properly embedded assets
// Using import.meta.dir ensures paths resolve correctly in compiled executable

// FIX: Import assets using the file type attribute for embedding
import configFile from "./assets/config.json" with { type: "file" };
import templateFile from "./assets/template.txt" with { type: "file" };

export interface AppConfig {
  appName: string;
  version: string;
  settings: {
    debug: boolean;
    maxConnections: number;
    timeout: number;
  };
  features: string[];
}

export async function loadConfig(): Promise<AppConfig | null> {
  try {
    // FIX: Use the imported file reference which is embedded
    const file = Bun.file(configFile);
    const content = await file.text();
    return JSON.parse(content);
  } catch (error) {
    console.error("Failed to load config:", error);
    return null;
  }
}

export async function loadTemplate(): Promise<string | null> {
  try {
    // FIX: Use the imported file reference which is embedded
    const file = Bun.file(templateFile);
    return await file.text();
  } catch (error) {
    console.error("Failed to load template:", error);
    return null;
  }
}

export function renderTemplate(template: string, config: AppConfig): string {
  return template
    .replace(/\\{\\{appName\\}\\}/g, config.appName)
    .replace(/\\{\\{version\\}\\}/g, config.version);
}

export async function getAppInfo(): Promise<{
  config: AppConfig | null;
  template: string | null;
  rendered: string | null;
}> {
  const config = await loadConfig();
  const template = await loadTemplate();

  let rendered: string | null = null;
  if (config && template) {
    rendered = renderTemplate(template, config);
  }

  return { config, template, rendered };
}

// Main entry point
if (import.meta.main) {
  const info = await getAppInfo();
  console.log("Config:", info.config);
  console.log("Rendered:", info.rendered);
}
`;
  return appCode;
}

export async function buildExecutable(): Promise<BuildResult> {
  await mkdir(outDir, { recursive: true });

  // Create a temporary fixed app file for compilation
  const fixedAppPath = join(outDir, "app-fixed.ts");
  const fixedAppCode = await createEmbeddableApp();
  await Bun.write(fixedAppPath, fixedAppCode);

  // Copy assets to be alongside the fixed app for proper resolution
  const assetsDir = join(outDir, "assets");
  await mkdir(assetsDir, { recursive: true });

  const srcConfigPath = join(srcDir, "assets", "config.json");
  const srcTemplatePath = join(srcDir, "assets", "template.txt");

  await Bun.write(join(assetsDir, "config.json"), Bun.file(srcConfigPath));
  await Bun.write(join(assetsDir, "template.txt"), Bun.file(srcTemplatePath));

  const outputPath = join(outDir, "myapp");

  try {
    // FIX: Compile with proper asset handling
    const proc = Bun.spawn(
      ["bun", "build", "--compile", "--minify", "--outfile", outputPath, fixedAppPath],
      {
        cwd: outDir,
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

    // Verify the executable works and has embedded assets
    const assetsEmbedded = await verifyAssetsEmbedded(outputPath);

    return {
      success: true,
      outputPath,
      assetsEmbedded,
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

async function verifyAssetsEmbedded(executablePath: string): Promise<boolean> {
  if (!(await exists(executablePath))) {
    return false;
  }

  try {
    // Run the executable from /tmp to verify assets are truly embedded
    const proc = Bun.spawn([executablePath], {
      cwd: "/tmp",
      stdout: "pipe",
      stderr: "pipe",
    });

    const exitCode = await proc.exited;
    const stdout = await new Response(proc.stdout).text();
    const stderr = await new Response(proc.stderr).text();

    // Check that no errors occurred and config was loaded
    return (
      exitCode === 0 &&
      !stderr.includes("Failed to load") &&
      stdout.includes("MyEmbeddedApp")
    );
  } catch {
    return false;
  }
}

export async function compileWithCLI(): Promise<BuildResult> {
  // Same implementation as buildExecutable for the fixed version
  return buildExecutable();
}

export function getOutputDirectory(): string {
  return outDir;
}

// Run build if executed directly
if (import.meta.main) {
  console.log("Building with embedded assets...");
  const result = await buildExecutable();
  console.log("Build result:", result);
}
