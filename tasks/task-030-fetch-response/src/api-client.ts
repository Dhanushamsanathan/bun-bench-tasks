/**
 * API client for fetching resources
 * BUG: response.ok is not checked, treats 404/500 as success
 */

export interface FetchResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

/**
 * Fetches data from an API endpoint
 * BUG: Does not check response.ok, 4xx/5xx treated as success
 */
export async function fetchApi<T>(url: string): Promise<FetchResult<T>> {
  try {
    const response = await fetch(url);

    // BUG: Missing response.ok check
    // This will try to parse 404/500 responses as JSON
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
 * BUG: 404 for non-existent user is treated as success
 */
export async function fetchUser(
  baseUrl: string,
  userId: number
): Promise<FetchResult<{ id: number; name: string }>> {
  try {
    const response = await fetch(`${baseUrl}/users/${userId}`);

    // BUG: No check for response.ok
    // A 404 will still try to parse response and return success: true
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
 * BUG: 400 Bad Request is treated as success
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

    // BUG: No check for response.ok
    // 400/422 validation errors are treated as success
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
 * BUG: 403 Forbidden or 404 Not Found treated as success
 */
export async function deleteResource(
  url: string
): Promise<FetchResult<void>> {
  try {
    const response = await fetch(url, {
      method: 'DELETE'
    });

    // BUG: No check for response.ok
    // 403/404 responses are treated as successful deletion

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
 * BUG: Retry logic doesn't trigger for 5xx errors
 */
export async function fetchWithRetry<T>(
  url: string,
  maxRetries: number = 3
): Promise<FetchResult<T>> {
  let lastError: string | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url);

      // BUG: No check for response.ok
      // 500 errors don't trigger retry, they're returned as success
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
    error: lastError || 'Max retries exceeded'
  };
}
