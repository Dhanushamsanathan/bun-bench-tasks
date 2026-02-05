// Main application that uses embedded assets
// BUG: Assets are not embedded correctly in the compiled executable

// Incorrect approach: Using dynamic path that won't work in compiled executable
const configPath = "./assets/config.json";
const templatePath = "./assets/template.txt";

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
    // BUG: This path resolution won't work in compiled executable
    // The relative path is resolved from cwd, not from the embedded location
    const file = Bun.file(configPath);
    const content = await file.text();
    return JSON.parse(content);
  } catch (error) {
    console.error("Failed to load config:", error);
    return null;
  }
}

export async function loadTemplate(): Promise<string | null> {
  try {
    // BUG: Same issue - relative path won't resolve to embedded asset
    const file = Bun.file(templatePath);
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
