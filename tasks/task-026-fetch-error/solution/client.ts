/**
 * HTTP client for fetching data from APIs
 * FIXED: All fetch() calls are wrapped in try-catch for proper error handling
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface UserData {
  id: number;
  name: string;
  email: string;
}

/**
 * Fetches user data from an API endpoint
 * FIXED: Proper try-catch around fetch to handle network errors
 */
export async function fetchUserData(url: string): Promise<ApiResponse<UserData>> {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP error: ${response.status} ${response.statusText}`
      };
    }

    const data = await response.json();

    return {
      success: true,
      data: data as UserData
    };
  } catch (error) {
    // FIXED: Network errors are now caught and returned as error response
    return {
      success: false,
      error: `fetch failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Fetches multiple resources in parallel
 * FIXED: Uses Promise.allSettled to handle partial failures
 */
export async function fetchMultipleResources(urls: string[]): Promise<ApiResponse<unknown[]>> {
  try {
    // FIXED: Use allSettled instead of all to handle partial failures
    const results = await Promise.allSettled(
      urls.map(async url => {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.json();
      })
    );

    const failures = results.filter(r => r.status === 'rejected');

    if (failures.length > 0) {
      return {
        success: false,
        error: `${failures.length} of ${urls.length} requests failed`
      };
    }

    const data = results
      .filter((r): r is PromiseFulfilledResult<unknown> => r.status === 'fulfilled')
      .map(r => r.value);

    return {
      success: true,
      data
    };
  } catch (error) {
    return {
      success: false,
      error: `fetch failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Fetches data with retry logic
 * FIXED: Catch errors to enable retry behavior
 */
export async function fetchWithRetry(
  url: string,
  maxRetries: number = 3
): Promise<ApiResponse<unknown>> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      // FIXED: Wrap fetch in try-catch to enable retries
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      // FIXED: Catch error and continue to next retry
      lastError = error instanceof Error ? error : new Error(String(error));

      // Optional: Add delay between retries
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 100 * (i + 1)));
      }
    }
  }

  return {
    success: false,
    error: lastError?.message || 'Max retries exceeded'
  };
}
