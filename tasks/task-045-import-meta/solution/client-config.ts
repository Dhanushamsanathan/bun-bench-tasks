/**
 * Client-side configuration module.
 * FIXED: Uses import.meta.env for browser builds.
 *
 * Note: In Bun/Node server environment, we fall back to process.env
 * but the primary pattern uses import.meta.env for bundler compatibility.
 */

export interface ClientConfig {
  apiBaseUrl: string;
  appName: string;
  version: string;
  debug: boolean;
  analyticsId: string;
  publicKey: string;
}

// FIXED: Helper to get env var from import.meta.env or process.env
function getEnvVar(key: string, defaultValue: string = ""): string {
  // FIXED: Check import.meta.env first (for browser builds)
  // then fall back to process.env (for server/testing)
  if (typeof import.meta !== "undefined" && import.meta.env) {
    const value = (import.meta.env as Record<string, string>)[key];
    if (value !== undefined) {
      return value;
    }
  }

  // Fall back to process.env for server-side
  if (typeof process !== "undefined" && process.env) {
    return process.env[key] ?? defaultValue;
  }

  return defaultValue;
}

/**
 * Detect if running in browser environment.
 */
export function isBrowser(): boolean {
  return typeof window !== "undefined";
}

/**
 * Get client configuration.
 * FIXED: Uses import.meta.env for browser compatibility.
 */
export function getClientConfig(): ClientConfig {
  // FIXED: Use getEnvVar helper that checks import.meta.env first
  return {
    apiBaseUrl: getEnvVar("VITE_API_BASE_URL", "http://localhost:3000"),
    appName: getEnvVar("VITE_APP_NAME", "My App"),
    version: getEnvVar("VITE_APP_VERSION", "1.0.0"),
    debug: getEnvVar("VITE_DEBUG") === "true",
    analyticsId: getEnvVar("VITE_ANALYTICS_ID", ""),
    publicKey: getEnvVar("VITE_PUBLIC_KEY", ""),
  };
}

/**
 * Get API base URL for client requests.
 * FIXED: Uses import.meta.env.
 */
export function getApiBaseUrl(): string {
  return getEnvVar("VITE_API_BASE_URL", "/api");
}

/**
 * Check if debug mode is enabled.
 * FIXED: Uses import.meta.env.
 */
export function isDebugMode(): boolean {
  return getEnvVar("VITE_DEBUG") === "true";
}

/**
 * Get the current environment (development/production).
 * FIXED: Uses import.meta.env.MODE.
 */
export function getEnvironment(): string {
  // FIXED: Check import.meta.env.MODE for browser builds
  if (typeof import.meta !== "undefined" && import.meta.env) {
    const mode = (import.meta.env as Record<string, string>).MODE;
    if (mode) {
      return mode;
    }
  }

  return process.env.NODE_ENV || "development";
}

/**
 * Check if running in production.
 * FIXED: Uses import.meta.env.PROD.
 */
export function isProduction(): boolean {
  // FIXED: Check import.meta.env.PROD for browser builds
  if (typeof import.meta !== "undefined" && import.meta.env) {
    const prod = (import.meta.env as Record<string, boolean>).PROD;
    if (prod !== undefined) {
      return prod;
    }
  }

  return process.env.NODE_ENV === "production";
}

/**
 * Check if running in development.
 * FIXED: Uses import.meta.env.DEV.
 */
export function isDevelopment(): boolean {
  // FIXED: Check import.meta.env.DEV for browser builds
  if (typeof import.meta !== "undefined" && import.meta.env) {
    const dev = (import.meta.env as Record<string, boolean>).DEV;
    if (dev !== undefined) {
      return dev;
    }
  }

  return process.env.NODE_ENV === "development";
}

/**
 * Get all public environment variables.
 * FIXED: Works in both browser and server environments.
 */
export function getPublicEnvVars(): Record<string, string> {
  const result: Record<string, string> = {};

  // FIXED: Check import.meta.env first for browser
  if (typeof import.meta !== "undefined" && import.meta.env) {
    const metaEnv = import.meta.env as Record<string, string>;
    for (const [key, value] of Object.entries(metaEnv)) {
      if (
        typeof value === "string" &&
        (key.startsWith("VITE_") || key.startsWith("PUBLIC_"))
      ) {
        result[key] = value;
      }
    }
    return result;
  }

  // Fall back to process.env for server
  if (typeof process !== "undefined" && process.env) {
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith("VITE_") || key.startsWith("PUBLIC_")) {
        result[key] = value || "";
      }
    }
  }

  return result;
}

/**
 * Build full API URL.
 * FIXED: Uses import.meta.env for base URL.
 */
export function buildApiUrl(path: string): string {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * Get analytics configuration.
 * FIXED: Uses import.meta.env for analytics ID.
 */
export function getAnalyticsConfig(): { id: string; enabled: boolean } {
  const id = getEnvVar("VITE_ANALYTICS_ID", "");
  return {
    id,
    enabled: id.length > 0 && isProduction(),
  };
}

/**
 * Determine if env var access method is correct for environment.
 * FIXED: Properly checks the access method.
 */
export function usesCorrectEnvAccess(): boolean {
  if (isBrowser()) {
    // FIXED: In browser, we should be using import.meta.env
    // Check if import.meta.env is available
    return typeof import.meta !== "undefined" && import.meta.env !== undefined;
  }
  // In server context, process.env is acceptable
  return true;
}
