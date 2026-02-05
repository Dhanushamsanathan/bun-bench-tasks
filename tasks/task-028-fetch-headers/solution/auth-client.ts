/**
 * Authenticated HTTP client for API access
 * FIXED: Authorization header correctly includes "Bearer " prefix
 */

export interface AuthClientConfig {
  baseUrl: string;
  token: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

export class AuthenticatedClient {
  private baseUrl: string;
  private token: string;

  constructor(config: AuthClientConfig) {
    this.baseUrl = config.baseUrl;
    this.token = config.token;
  }

  /**
   * Gets the formatted Authorization header value
   * FIXED: Helper method to ensure Bearer prefix is always added
   */
  private getAuthHeader(): string {
    return `Bearer ${this.token}`;
  }

  /**
   * Makes an authenticated GET request
   * FIXED: Authorization header includes "Bearer " prefix
   */
  async get<T>(path: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // FIXED: Properly formatted Bearer token
          'Authorization': this.getAuthHeader()
        }
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}`,
          status: response.status
        };
      }

      const data = await response.json();
      return { success: true, data: data as T };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Makes an authenticated POST request
   * FIXED: Authorization header includes "Bearer " prefix
   */
  async post<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // FIXED: Properly formatted Bearer token
          'Authorization': this.getAuthHeader()
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}`,
          status: response.status
        };
      }

      const data = await response.json();
      return { success: true, data: data as T };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Updates the auth token
   * FIXED: Token is stored raw, Bearer prefix added when used
   */
  setToken(newToken: string): void {
    this.token = newToken;
  }
}

/**
 * Creates headers for authenticated requests
 * FIXED: Includes Bearer prefix
 */
export function createAuthHeaders(token: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    // FIXED: Proper Bearer token format
    'Authorization': `Bearer ${token}`
  };
}

/**
 * Validates an authorization header format
 * Used for testing
 */
export function isValidBearerToken(authHeader: string): boolean {
  return authHeader.startsWith('Bearer ') && authHeader.length > 7;
}
