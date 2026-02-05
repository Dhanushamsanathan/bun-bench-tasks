/**
 * API client for fetching resources
 * FIXED: response.ok is checked to properly handle error responses
 */

export interface FetchResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

/**
 * Fetches data from an API endpoint
 * FIXED: Checks response.ok before treating as success
 */
export async function fetchApi<T>(url: string): Promise<FetchResult<T>> {
  try {
    const response = await fetch(url);

    // FIXED: Check response.ok to detect HTTP errors
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage += `: ${errorData.error}`;
        }
      } catch {
        // Response may not be JSON
      }

      return {
        success: false,
        error: errorMessage,
        status: response.status
      };
    }

    const data = await response.json();

    return {
      success: true,
      data: data as T
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Fetches a user by ID
 * FIXED: 404 for non-existent user is properly detected
 */
export async function fetchUser(
  baseUrl: string,
  userId: number
): Promise<FetchResult<{ id: number; name: string }>> {
  try {
    const response = await fetch(`${baseUrl}/users/${userId}`);

    // FIXED: Check response.ok
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `User not found (HTTP ${response.status})`,
        status: response.status
      };
    }

    const data = await response.json();

    return {
      success: true,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Creates a resource via POST
 * FIXED: 400 Bad Request is properly detected as failure
 */
export async function createResource<T>(
  url: string,
  body: unknown
): Promise<FetchResult<T>> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    // FIXED: Check response.ok for validation errors
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}`,
        status: response.status
      };
    }

    const data = await response.json();

    return {
      success: true,
      data: data as T
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Deletes a resource
 * FIXED: 403 Forbidden or 404 Not Found properly detected
 */
export async function deleteResource(
  url: string
): Promise<FetchResult<void>> {
  try {
    const response = await fetch(url, {
      method: 'DELETE'
    });

    // FIXED: Check response.ok for error responses
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        if (errorData.error) {
          errorMessage = errorData.error;
        }
      } catch {
        // Response may not be JSON
      }

      return {
        success: false,
        error: errorMessage,
        status: response.status
      };
    }

    return {
      success: true
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Fetches with retry on failure
 * FIXED: Retry logic triggers for 5xx errors
 */
export async function fetchWithRetry<T>(
  url: string,
  maxRetries: number = 3
): Promise<FetchResult<T>> {
  let lastError: string | undefined;
  let lastStatus: number | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);

      // FIXED: Check response.ok and retry on 5xx
      if (!response.ok) {
        lastStatus = response.status;

        // Retry on 5xx server errors
        if (response.status >= 500 && i < maxRetries - 1) {
          lastError = `HTTP ${response.status}`;
          await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
          continue;
        }

        // Don't retry on 4xx client errors
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}`,
          status: response.status
        };
      }

      const data = await response.json();

      return {
        success: true,
        data: data as T
      };
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
  }

  return {
    success: false,
    error: lastError || 'Max retries exceeded',
    status: lastStatus
  };
}
