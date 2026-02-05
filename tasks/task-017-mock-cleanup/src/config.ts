/**
 * Configuration module that provides app settings.
 */

export interface AppConfig {
  apiUrl: string;
  timeout: number;
  retries: number;
  debug: boolean;
}

let configCache: AppConfig | null = null;

/**
 * Returns the application configuration.
 * In production, this would load from environment or file.
 */
export function getConfig(): AppConfig {
  if (!configCache) {
    configCache = {
      apiUrl: "https://api.production.com",
      timeout: 5000,
      retries: 3,
      debug: false,
    };
  }
  return configCache;
}

/**
 * Resets the config cache (for testing).
 */
export function resetConfig(): void {
  configCache = null;
}

/**
 * Gets a specific config value.
 */
export function getConfigValue<K extends keyof AppConfig>(key: K): AppConfig[K] {
  return getConfig()[key];
}
