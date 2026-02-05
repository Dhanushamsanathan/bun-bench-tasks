/**
 * Authenticated HTTP client for API access
 * BUG: Authorization header is missing "Bearer " prefix
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
   * Makes an authenticated GET request
   * BUG: Authorization header is missing "Bearer " prefix
   */
  async get<T>(path: string): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          // BUG: Token should be prefixed with "Bearer "
          'Authorization': this.token
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
   * BUG: Same issue - missing "Bearer " prefix
   */
  async post<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // BUG: Token should be prefixed with "Bearer "
          'Authorization': this.token
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
   * BUG: Still doesn't add "Bearer " prefix when token is updated
   */
  setToken(newToken: string): void {
    // BUG: Just stores raw token, should format with Bearer prefix
    this.token = newToken;
  }
}

/**
 * Creates headers for authenticated requests
 * BUG: Missing Bearer prefix
 */
export function createAuthHeaders(token: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    // BUG: Should be `Bearer ${token}`
    'Authorization': token
  };
}

/**
 * Validates an authorization header format
 * Used for testing
 */
export function isValidBearerToken(authHeader: string): boolean {
  return authHeader.startsWith('Bearer ') && authHeader.length > 7;
}
