/**
 * Environment variable validator module.
 * BUG: Missing required env vars are not caught at startup.
 */

export interface RequiredEnvVars {
  DATABASE_URL: string;
  API_KEY: string;
  JWT_SECRET: string;
}

export interface OptionalEnvVars {
  PORT?: string;
  LOG_LEVEL?: string;
  DEBUG?: string;
}

export interface ValidatedConfig {
  databaseUrl: string;
  apiKey: string;
  jwtSecret: string;
  port: number;
  logLevel: string;
  debug: boolean;
  isValid: boolean;
  errors: string[];
}

/**
 * Validate and load environment configuration.
 * BUG: Doesn't actually validate required vars - returns potentially invalid config.
 */
export function validateEnv(): ValidatedConfig {
  // BUG: No validation - just reads env vars without checking if they exist
  return {
    databaseUrl: process.env.DATABASE_URL || "",
    apiKey: process.env.API_KEY || "",
    jwtSecret: process.env.JWT_SECRET || "",
    port: parseInt(process.env.PORT || "3000", 10),
    logLevel: process.env.LOG_LEVEL || "info",
    debug: process.env.DEBUG === "true",
    isValid: true, // BUG: Always returns true even if required vars are missing
    errors: [], // BUG: Never populates errors
  };
}

/**
 * Check if a specific env var is set.
 * BUG: Returns true for empty strings.
 */
export function isEnvVarSet(name: string): boolean {
  // BUG: Empty string is falsy but process.env.VAR = "" would make this return true
  return name in process.env;
}

/**
 * Get list of missing required env vars.
 * BUG: This function exists but is never called by validateEnv.
 */
export function getMissingRequiredVars(): string[] {
  const required = ["DATABASE_URL", "API_KEY", "JWT_SECRET"];
  const missing: string[] = [];

  for (const varName of required) {
    // BUG: This function works but validateEnv doesn't use it
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  return missing;
}

/**
 * Initialize the application with validated config.
 * BUG: Doesn't fail when config is invalid.
 */
export function initializeApp(): ValidatedConfig {
  // BUG: Doesn't validate before returning
  const config = validateEnv();

  // BUG: Doesn't check isValid or errors before proceeding
  return config;
}

/**
 * Require an env var or throw.
 * BUG: This helper exists but validateEnv doesn't use it.
 */
export function requireEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

/**
 * Validate env vars and throw on missing required vars.
 * BUG: Doesn't actually throw - returns config anyway.
 */
export function validateAndThrow(): ValidatedConfig {
  const config = validateEnv();

  // BUG: Checks missing vars but doesn't throw when they're missing
  const missing = getMissingRequiredVars();
  if (missing.length > 0) {
    // BUG: Just logs a warning instead of throwing
    console.warn(`Warning: Missing env vars: ${missing.join(", ")}`);
  }

  return config;
}

/**
 * Check if the configuration is production-ready.
 * BUG: Doesn't properly check required vars.
 */
export function isProductionReady(config: ValidatedConfig): boolean {
  // BUG: Only checks if values are non-empty, not if they're valid
  return config.isValid;
}

/**
 * Get validation errors.
 * BUG: Always returns empty array because validateEnv never sets errors.
 */
export function getValidationErrors(config: ValidatedConfig): string[] {
  // BUG: errors array is always empty
  return config.errors;
}
