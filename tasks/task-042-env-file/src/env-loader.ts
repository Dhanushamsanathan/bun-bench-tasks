/**
 * Environment file loader module.
 * BUG: Ignores .env file and uses hardcoded values instead.
 */

export interface EnvConfig {
  databaseUrl: string;
  redisUrl: string;
  secretKey: string;
  port: number;
  nodeEnv: string;
}

/**
 * Load configuration from environment.
 * BUG: Uses hardcoded values instead of loading from .env file.
 */
export function loadEnvConfig(): EnvConfig {
  // BUG: Hardcoded values instead of reading from .env file
  // The .env file is completely ignored
  return {
    databaseUrl: "postgres://localhost:5432/default_db",
    redisUrl: "redis://localhost:6379",
    secretKey: "hardcoded-secret-key-not-secure",
    port: 3000,
    nodeEnv: "development",
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
 * BUG: This function is implemented but never called.
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
 * BUG: Only checks process.env, doesn't load from .env file first.
 */
export function getEnvVar(
  key: string,
  defaultValue: string = ""
): string {
  // BUG: Doesn't load .env file, only checks process.env
  // which won't have values from .env unless Bun auto-loads it
  return process.env[key] ?? defaultValue;
}

/**
 * Load environment from a specific file path.
 * BUG: Function exists but returns hardcoded values.
 */
export async function loadFromFile(path: string): Promise<EnvConfig> {
  // BUG: Completely ignores the path parameter
  // Returns hardcoded values instead of reading the file
  return {
    databaseUrl: "postgres://localhost:5432/default_db",
    redisUrl: "redis://localhost:6379",
    secretKey: "hardcoded-secret-key-not-secure",
    port: 3000,
    nodeEnv: "development",
  };
}

/**
 * Check if configuration is from .env file.
 * BUG: Always returns false because we never load from file.
 */
export function isConfigFromEnvFile(): boolean {
  // BUG: Always returns false - config is always hardcoded
  return false;
}
