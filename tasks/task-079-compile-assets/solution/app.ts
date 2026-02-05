// Fixed application with properly embedded assets
// Using import with { type: "file" } ensures assets are embedded in compiled executable

// FIX: Import assets using the file type attribute for embedding
// This tells Bun to embed the file content and return a path that works at runtime
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
    // The import returns a path to the embedded file
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
    .replace(/\{\{appName\}\}/g, config.appName)
    .replace(/\{\{version\}\}/g, config.version);
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
