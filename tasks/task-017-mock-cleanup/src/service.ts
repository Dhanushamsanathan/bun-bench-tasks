import { getConfig, getConfigValue } from "./config";

/**
 * Service that uses configuration to make API calls.
 */
export class ApiService {
  /**
   * Gets the full API endpoint URL.
   */
  getApiEndpoint(path: string): string {
    const config = getConfig();
    return `${config.apiUrl}${path}`;
  }

  /**
   * Gets the configured timeout value.
   */
  getTimeout(): number {
    return getConfigValue("timeout");
  }

  /**
   * Checks if debug mode is enabled.
   */
  isDebugEnabled(): boolean {
    return getConfigValue("debug");
  }

  /**
   * Gets retry configuration.
   */
  getRetryConfig(): { retries: number; timeout: number } {
    const config = getConfig();
    return {
      retries: config.retries,
      timeout: config.timeout,
    };
  }
}

/**
 * Creates a configured fetch request.
 */
export function createRequest(path: string): { url: string; timeout: number } {
  const config = getConfig();
  return {
    url: `${config.apiUrl}${path}`,
    timeout: config.timeout,
  };
}
