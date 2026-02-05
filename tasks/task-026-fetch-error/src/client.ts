/**
 * HTTP client for fetching data from APIs
 * BUG: fetch() errors are not caught, causing unhandled promise rejections
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
 * BUG: No try-catch around fetch, network errors crash the app
 */
export async function fetchUserData(url: string): Promise<ApiResponse<UserData>> {
  // BUG: This will throw if the network request fails
  // No error handling for connection refused, DNS errors, etc.
  const response = await fetch(url);
  const data = await response.json();

  return {
    success: true,
    data: data as UserData
  };
}

/**
 * Fetches multiple resources in parallel
 * BUG: Promise.all will reject if any fetch fails, no error handling
 */
export async function fetchMultipleResources(urls: string[]): Promise<ApiResponse<unknown[]>> {
  // BUG: If any URL fails, the entire operation crashes
  const responses = await Promise.all(urls.map(url => fetch(url)));
  const data = await Promise.all(responses.map(r => r.json()));

  return {
    success: true,
    data
  };
}

/**
 * Fetches data with retry logic
 * BUG: Retry logic doesn't catch the initial fetch error
 */
export async function fetchWithRetry(
  url: string,
  maxRetries: number = 3
): Promise<ApiResponse<unknown>> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    // BUG: fetch errors are not caught, so retry never happens
    const response = await fetch(url);
    const data = await response.json();
    return {
      success: true,
      data
    };
  }

  return {
    success: false,
    error: lastError?.message || 'Max retries exceeded'
  };
}
