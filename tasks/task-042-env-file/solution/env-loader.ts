/**
 * Environment file loader module.
 * FIXED: Properly loads and parses .env files.
 */

export interface EnvConfig {
  databaseUrl: string;
  redisUrl: string;
  secretKey: string;
  port: number;
  nodeEnv: string;
}

// Track loaded env vars from file
let loadedEnvVars: Record<string, string> = {};
let configLoadedFromFile = false;

/**
 * Load configuration from environment.
 * FIXED: Uses environment variables (which can be loaded from .env).
 */
export function loadEnvConfig(): EnvConfig {
  // FIXED: Read from process.env which includes loaded .env values
  return {
    databaseUrl:
      process.env.DATABASE_URL ?? "postgres://localhost:5432/default_db",
    redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
    secretKey: process.env.SECRET_KEY ?? "hardcoded-secret-key-not-secure",
    port: parseInt(process.env.PORT ?? "3000", 10),
    nodeEnv: process.env.NODE_ENV ?? "development",
  };
}

/**
 * Check if .env file exists.
 */
export async function envFileExists(path: string = ".env"): Promise<boolean> {
  const file = Bun.file(path);
  return file.exists();
}

/**
 * Parse .env file content into key-value pairs.
 */
export function parseEnvContent(content: string): Record<string, string> {
  const result: Record<string, string> = {};

  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const equalIndex = trimmed.indexOf("=");
    if (equalIndex > 0) {
      const key = trimmed.substring(0, equalIndex).trim();
      let value = trimmed.substring(equalIndex + 1).trim();

      // Remove surrounding quotes
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      result[key] = value;
    }
  }

  return result;
}

/**
 * Get a specific environment variable.
 * FIXED: Checks loaded env vars first, then process.env.
 */
export function getEnvVar(key: string, defaultValue: string = ""): string {
  // FIXED: Check loaded env vars first, then process.env
  return loadedEnvVars[key] ?? process.env[key] ?? defaultValue;
}

/**
 * Load environment from a specific file path.
 * FIXED: Actually reads and parses the file.
 */
export async function loadFromFile(path: string): Promise<EnvConfig> {
  // FIXED: Actually read and parse the .env file
  const file = Bun.file(path);

  if (await file.exists()) {
    const content = await file.text();
    loadedEnvVars = parseEnvContent(content);

    // Set values in process.env so they're available globally
    for (const [key, value] of Object.entries(loadedEnvVars)) {
      process.env[key] = value;
    }

    configLoadedFromFile = true;
  }

  return {
    databaseUrl:
      loadedEnvVars.DATABASE_URL ??
      process.env.DATABASE_URL ??
      "postgres://localhost:5432/default_db",
    redisUrl:
      loadedEnvVars.REDIS_URL ??
      process.env.REDIS_URL ??
      "redis://localhost:6379",
    secretKey:
      loadedEnvVars.SECRET_KEY ??
      process.env.SECRET_KEY ??
      "hardcoded-secret-key-not-secure",
    port: parseInt(
      loadedEnvVars.PORT ?? process.env.PORT ?? "3000",
      10
    ),
    nodeEnv:
      loadedEnvVars.NODE_ENV ?? process.env.NODE_ENV ?? "development",
  };
}

/**
 * Check if configuration is from .env file.
 * FIXED: Returns true when config was loaded from file.
 */
export function isConfigFromEnvFile(): boolean {
  return configLoadedFromFile;
}
