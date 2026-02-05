/**
 * Client-side configuration module.
 * BUG: Uses process.env instead of import.meta.env for browser builds.
 */

export interface ClientConfig {
  apiBaseUrl: string;
  appName: string;
  version: string;
  debug: boolean;
  analyticsId: string;
  publicKey: string;
}

/**
 * Detect if running in browser environment.
 */
export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Get client configuration.
 * BUG: Uses process.env which doesn't work in browser.
 */
export function getClientConfig(): ClientConfig {
  // BUG: process.env is not available in browser environment
  // Should use import.meta.env instead
  return {
    apiBaseUrl: process.env.VITE_API_BASE_URL || "http://localhost:3000",
    appName: process.env.VITE_APP_NAME || "My App",
    version: process.env.VITE_APP_VERSION || "1.0.0",
    debug: process.env.VITE_DEBUG === "true",
    analyticsId: process.env.VITE_ANALYTICS_ID || "",
    publicKey: process.env.VITE_PUBLIC_KEY || "",
  };
}

/**
 * Get API base URL for client requests.
 * BUG: Uses process.env directly.
 */
export function getApiBaseUrl(): string {
  // BUG: process.env.VITE_API_BASE_URL will be undefined in browser
  return process.env.VITE_API_BASE_URL || "/api";
}

/**
 * Check if debug mode is enabled.
 * BUG: Uses process.env in browser-intended code.
 */
export function isDebugMode(): boolean {
  // BUG: process.env.VITE_DEBUG won't exist in browser
  return process.env.VITE_DEBUG === "true";
}

/**
 * Get the current environment (development/production).
 * BUG: Uses process.env.NODE_ENV.
 */
export function getEnvironment(): string {
  // BUG: Should use import.meta.env.MODE in browser builds
  return process.env.NODE_ENV || "development";
}

/**
 * Check if running in production.
 * BUG: Uses process.env.NODE_ENV.
 */
export function isProduction(): boolean {
  // BUG: Should use import.meta.env.PROD in browser builds
  return process.env.NODE_ENV === "production";
}

/**
 * Check if running in development.
 * BUG: Uses process.env.NODE_ENV.
 */
export function isDevelopment(): boolean {
  // BUG: Should use import.meta.env.DEV in browser builds
  return process.env.NODE_ENV === "development";
}

/**
 * Get all public environment variables.
 * BUG: Tries to access process.env which doesn't exist in browser.
 */
export function getPublicEnvVars(): Record<string, string> {
  // BUG: process.env is an object in Node but undefined in browser
  // This will throw: Cannot convert undefined to object
  const result: Record<string, string> = {};

  // BUG: This iteration won't work in browser
  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith("VITE_") || key.startsWith("PUBLIC_")) {
      result[key] = value || "";
    }
  }

  return result;
}

/**
 * Build full API URL.
 * BUG: Uses process.env for base URL.
 */
export function buildApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Get analytics configuration.
 * BUG: Uses process.env for analytics ID.
 */
export function getAnalyticsConfig(): { id: string; enabled: boolean } {
  // BUG: process.env won't have these values in browser
  const id = process.env.VITE_ANALYTICS_ID || "";
  return {
    id,
    enabled: id.length > 0 && isProduction(),
  };
}

/**
 * Determine if env var access method is correct for environment.
 */
export function usesCorrectEnvAccess(): boolean {
  // BUG: Always returns true, but it should check if we're using
  // import.meta.env in browser context
  if (isBrowser()) {
    // In browser, we should be using import.meta.env
    // but this code uses process.env, so should return false
    return true; // BUG: Should return false
  }
  return true;
}
