/**
 * Configuration module for application settings.
 * BUG: Accesses process.env directly without defaults, crashes on undefined.
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
 * BUG: No default values - crashes when env vars are undefined.
 */
export function getConfig(): AppConfig {
  // BUG: Direct access without defaults - will be undefined if not set
  return {
    apiUrl: process.env.API_URL!,
    apiKey: process.env.API_KEY!,
    timeout: parseInt(process.env.TIMEOUT!),
    debug: process.env.DEBUG === "true",
    logLevel: process.env.LOG_LEVEL!,
  };
}

/**
 * Build a full API endpoint URL.
 * BUG: Will crash if apiUrl is undefined.
 */
export function buildApiUrl(config: AppConfig, path: string): string {
  // BUG: If apiUrl is undefined, this will produce "undefined/path"
  return `${config.apiUrl}/${path}`;
}

/**
 * Create authorization header.
 * BUG: Will produce invalid header if apiKey is undefined.
 */
export function getAuthHeader(config: AppConfig): string {
  // BUG: If apiKey is undefined, returns "Bearer undefined"
  return `Bearer ${config.apiKey}`;
}

/**
 * Get the current log level or default.
 * BUG: Doesn't handle undefined logLevel.
 */
export function getEffectiveLogLevel(config: AppConfig): string {
  // BUG: Returns undefined if logLevel not set
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
 * BUG: Will return NaN if TIMEOUT env var is not set.
 */
export function getTimeoutMs(config: AppConfig): number {
  // BUG: If timeout is NaN, multiplication still returns NaN
  return config.timeout * 1000;
}
