/**
 * Environment variable validator module.
 * FIXED: Properly validates required env vars at startup.
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

const REQUIRED_VARS = ["DATABASE_URL", "API_KEY", "JWT_SECRET"] as const;

/**
 * Validate and load environment configuration.
 * FIXED: Properly validates required vars and sets isValid/errors.
 */
export function validateEnv(): ValidatedConfig {
  const errors: string[] = [];

  // FIXED: Check all required vars and collect errors
  for (const varName of REQUIRED_VARS) {
    if (!process.env[varName]) {
      errors.push(`${varName} is required`);
    }
  }

  return {
    databaseUrl: process.env.DATABASE_URL || "",
    apiKey: process.env.API_KEY || "",
    jwtSecret: process.env.JWT_SECRET || "",
    port: parseInt(process.env.PORT || "3000", 10),
    logLevel: process.env.LOG_LEVEL || "info",
    debug: process.env.DEBUG === "true",
    isValid: errors.length === 0, // FIXED: Only valid if no errors
    errors, // FIXED: Populated with actual errors
  };
}

/**
 * Check if a specific env var is set.
 * FIXED: Returns false for empty strings.
 */
export function isEnvVarSet(name: string): boolean {
  // FIXED: Check for non-empty value, not just existence
  const value = process.env[name];
  return value !== undefined && value !== "";
}

/**
 * Get list of missing required env vars.
 */
export function getMissingRequiredVars(): string[] {
  const missing: string[] = [];

  for (const varName of REQUIRED_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  return missing;
}

/**
 * Initialize the application with validated config.
 * FIXED: Throws when config is invalid.
 */
export function initializeApp(): ValidatedConfig {
  const config = validateEnv();

  // FIXED: Throw if config is invalid
  if (!config.isValid) {
    throw new Error(
      `Invalid configuration: ${config.errors.join(", ")}`
    );
  }

  return config;
}

/**
 * Require an env var or throw.
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
 * FIXED: Actually throws when required vars are missing.
 */
export function validateAndThrow(): ValidatedConfig {
  const config = validateEnv();
  const missing = getMissingRequiredVars();

  // FIXED: Throw when required vars are missing
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }

  return config;
}

/**
 * Check if the configuration is production-ready.
 * FIXED: Properly checks required vars.
 */
export function isProductionReady(config: ValidatedConfig): boolean {
  // FIXED: Check isValid which is now properly set
  return config.isValid;
}

/**
 * Get validation errors.
 * FIXED: Returns actual errors from validation.
 */
export function getValidationErrors(config: ValidatedConfig): string[] {
  return config.errors;
}
