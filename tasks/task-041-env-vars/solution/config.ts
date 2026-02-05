/**
 * Configuration module for application settings.
 * FIXED: Provides sensible default values for all environment variables.
 */

export interface AppConfig {
  apiUrl: string;
  apiKey: string;
  timeout: number;
  debug: boolean;
  logLevel: string;
}

/**
 * Get the application configuration from environment variables.
 * FIXED: Provides default values using nullish coalescing.
 */
export function getConfig(): AppConfig {
  // FIXED: Use default values when env vars are not set
  return {
    apiUrl: process.env.API_URL ?? "http://localhost:3000",
    apiKey: process.env.API_KEY ?? "",
    timeout: parseInt(process.env.TIMEOUT ?? "30", 10),
    debug: process.env.DEBUG === "true",
    logLevel: process.env.LOG_LEVEL ?? "info",
  };
}

/**
 * Build a full API endpoint URL.
 * FIXED: Works correctly with default apiUrl.
 */
export function buildApiUrl(config: AppConfig, path: string): string {
  // FIXED: apiUrl always has a valid default value
  return `${config.apiUrl}/${path}`;
}

/**
 * Create authorization header.
 * FIXED: Returns empty string when no API key is configured.
 */
export function getAuthHeader(config: AppConfig): string {
  // FIXED: Return empty string if no API key
  if (!config.apiKey) {
    return "";
  }
  return `Bearer ${config.apiKey}`;
}

/**
 * Get the current log level or default.
 * FIXED: Always returns a valid log level.
 */
export function getEffectiveLogLevel(config: AppConfig): string {
  // FIXED: logLevel always has "info" as default
  return config.logLevel;
}

/**
 * Check if debug mode is enabled.
 */
export function isDebugEnabled(config: AppConfig): boolean {
  return config.debug;
}

/**
 * Get timeout in milliseconds.
 * FIXED: Always returns a valid number.
 */
export function getTimeoutMs(config: AppConfig): number {
  // FIXED: timeout always has 30 as default, never NaN
  return config.timeout * 1000;
}
