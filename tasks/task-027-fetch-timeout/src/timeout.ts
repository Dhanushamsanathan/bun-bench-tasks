/**
 * HTTP client with timeout support
 * BUG: No AbortController used, requests hang forever
 */

export interface FetchResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  timedOut?: boolean;
}

/**
 * Fetches data with a timeout
 * BUG: timeout parameter is ignored, no AbortController used
 */
export async function fetchWithTimeout<T>(
  url: string,
  timeoutMs: number = 5000
): Promise<FetchResult<T>> {
  // BUG: timeout is ignored, no AbortController created
  // BUG: No signal passed to fetch, request will hang forever
  try {
    const response = await fetch(url);

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}`
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
 * Fetches with configurable options including timeout
 * BUG: timeout in options is not implemented
 */
export interface FetchOptions {
  timeout?: number;
  headers?: Record<string, string>;
  method?: string;
  body?: string;
}

export async function fetchWithOptions<T>(
  url: string,
  options: FetchOptions = {}
): Promise<FetchResult<T>> {
  const { timeout = 5000, headers, method = 'GET', body } = options;

  // BUG: timeout is extracted but never used
  // BUG: No AbortController to cancel the request
  try {
    const response = await fetch(url, {
      method,
      headers,
      body
      // BUG: Missing signal property for abort
    });

    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}`
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
 * Race between fetch and timeout
 * BUG: Even if timeout wins, fetch continues in background
 */
export async function fetchWithRaceTimeout<T>(
  url: string,
  timeoutMs: number = 5000
): Promise<FetchResult<T>> {
  // BUG: This approach is broken - fetch continues even after timeout
  // BUG: No way to actually cancel the request
  const timeoutPromise = new Promise<FetchResult<T>>((resolve) => {
    setTimeout(() => {
      resolve({
        success: false,
        error: 'Request timed out',
        timedOut: true
      });
    }, timeoutMs);
  });

  const fetchPromise = fetch(url).then(async (response) => {
    if (!response.ok) {
      return {
        success: false,
        error: `HTTP ${response.status}`
      } as FetchResult<T>;
    }
    const data = await response.json();
    return {
      success: true,
      data: data as T
    };
  }).catch((error) => ({
    success: false,
    error: error instanceof Error ? error.message : String(error)
  } as FetchResult<T>));

  // BUG: fetch is not actually cancelled, just ignored
  return Promise.race([fetchPromise, timeoutPromise]);
}
