/**
 * Server configuration module.
 * BUG: PORT from env is used as string, not converted to number.
 */

export interface ServerConfig {
  port: string | number; // BUG: Type allows string, should be number
  host: string;
  maxConnections: string | number; // BUG: Should be number only
  timeout: string | number; // BUG: Should be number only
  ssl: boolean;
}

/**
 * Get server configuration.
 * BUG: Doesn't convert numeric env vars to numbers.
 */
export function getServerConfig(): ServerConfig {
  // BUG: port is string from env, not converted to number
  return {
    port: process.env.PORT || "3000", // BUG: Returns string "3000"
    host: process.env.HOST || "localhost",
    maxConnections: process.env.MAX_CONNECTIONS || "100", // BUG: String
    timeout: process.env.TIMEOUT || "30000", // BUG: String
    ssl: process.env.SSL === "true",
  };
}

/**
 * Check if port is in valid range.
 * BUG: String comparison doesn't work for numeric ranges.
 */
export function isPortInValidRange(config: ServerConfig): boolean {
  // BUG: String comparison - "3000" < 1024 is true because "3" < "1" is false but
  // "3000" > "65535" is true because string comparison "3" > "6" is false
  // This logic is completely broken for string values
  return config.port >= 1024 && config.port <= 65535;
}

/**
 * Get the next available port.
 * BUG: String concatenation instead of numeric addition.
 */
export function getNextPort(config: ServerConfig): number {
  // BUG: If port is "3000", this returns "30001" not 3001
  return (config.port as any) + 1;
}

/**
 * Calculate total timeout with multiplier.
 * BUG: String multiplication returns NaN or unexpected results.
 */
export function getTotalTimeout(config: ServerConfig, multiplier: number): number {
  // BUG: "30000" * 2 = 60000 (JS coerces), but "30000" + 1000 = "300001000"
  return (config.timeout as any) * multiplier;
}

/**
 * Check if we have room for more connections.
 * BUG: String comparison for numbers.
 */
export function hasConnectionCapacity(
  config: ServerConfig,
  currentConnections: number
): boolean {
  // BUG: "100" > 50 works by coercion, but "100" < 9 is true (string comparison)
  return currentConnections < config.maxConnections;
}

/**
 * Get connection limit as percentage.
 * BUG: Division with string doesn't work properly.
 */
export function getConnectionPercentage(
  config: ServerConfig,
  currentConnections: number
): number {
  // BUG: Division by string - JS coerces but result may be unexpected
  return (currentConnections / (config.maxConnections as any)) * 100;
}

/**
 * Create server options for Bun.serve().
 * BUG: port should be number, not string.
 */
export function createServerOptions(config: ServerConfig): {
  port: number;
  hostname: string;
} {
  // BUG: Bun.serve expects port as number, but we pass string
  return {
    port: config.port as number, // BUG: Actually a string!
    hostname: config.host,
  };
}

/**
 * Check if using default port.
 * BUG: Comparing number to string.
 */
export function isDefaultPort(config: ServerConfig): boolean {
  // BUG: config.port is "3000" (string), comparison with 3000 (number)
  // Works due to coercion but is a type error
  return config.port === 3000;
}

/**
 * Format port for display.
 */
export function formatPort(config: ServerConfig): string {
  // This works, but masks the underlying type issue
  return `Port: ${config.port}`;
}
