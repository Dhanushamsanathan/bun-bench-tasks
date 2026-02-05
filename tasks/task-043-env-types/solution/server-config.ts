/**
 * Server configuration module.
 * FIXED: Properly converts env vars to correct types.
 */

export interface ServerConfig {
  port: number; // FIXED: Always number
  host: string;
  maxConnections: number; // FIXED: Always number
  timeout: number; // FIXED: Always number
  ssl: boolean;
}

/**
 * Get server configuration.
 * FIXED: Converts numeric env vars to numbers.
 */
export function getServerConfig(): ServerConfig {
  // FIXED: Parse numeric values with parseInt
  return {
    port: parseInt(process.env.PORT || "3000", 10),
    host: process.env.HOST || "localhost",
    maxConnections: parseInt(process.env.MAX_CONNECTIONS || "100", 10),
    timeout: parseInt(process.env.TIMEOUT || "30000", 10),
    ssl: process.env.SSL === "true",
  };
}

/**
 * Check if port is in valid range.
 * FIXED: Works correctly with number types.
 */
export function isPortInValidRange(config: ServerConfig): boolean {
  // FIXED: Numeric comparison works correctly
  return config.port >= 1024 && config.port <= 65535;
}

/**
 * Get the next available port.
 * FIXED: Numeric addition works correctly.
 */
export function getNextPort(config: ServerConfig): number {
  // FIXED: port is number, so + 1 adds numerically
  return config.port + 1;
}

/**
 * Calculate total timeout with multiplier.
 * FIXED: Works correctly with number types.
 */
export function getTotalTimeout(config: ServerConfig, multiplier: number): number {
  return config.timeout * multiplier;
}

/**
 * Check if we have room for more connections.
 * FIXED: Works correctly with number types.
 */
export function hasConnectionCapacity(
  config: ServerConfig,
  currentConnections: number
): boolean {
  // FIXED: Numeric comparison works correctly
  return currentConnections < config.maxConnections;
}

/**
 * Get connection limit as percentage.
 * FIXED: Works correctly with number types.
 */
export function getConnectionPercentage(
  config: ServerConfig,
  currentConnections: number
): number {
  return (currentConnections / config.maxConnections) * 100;
}

/**
 * Create server options for Bun.serve().
 * FIXED: port is now correctly a number.
 */
export function createServerOptions(config: ServerConfig): {
  port: number;
  hostname: string;
} {
  // FIXED: port is already a number
  return {
    port: config.port,
    hostname: config.host,
  };
}

/**
 * Check if using default port.
 * FIXED: Number to number comparison.
 */
export function isDefaultPort(config: ServerConfig): boolean {
  // FIXED: Both are numbers, strict equality works
  return config.port === 3000;
}

/**
 * Format port for display.
 */
export function formatPort(config: ServerConfig): string {
  return `Port: ${config.port}`;
}
