/**
 * HTTP client with timeout support
 * FIXED: Proper AbortController usage to cancel requests
 */

export interface FetchResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  timedOut?: boolean;
}

/**
 * Fetches data with a timeout
 * FIXED: Uses AbortController to properly cancel requests
 */
export async function fetchWithTimeout<T>(
  url: string,
  timeoutMs: number = 5000
): Promise<FetchResult<T>> {
  // FIXED: Create AbortController for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // FIXED: Pass signal to fetch for cancellation
    const response = await fetch(url, {
      signal: controller.signal
    });

    clearTimeout(timeoutId);

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
    clearTimeout(timeoutId);

    // FIXED: Detect abort errors and mark as timeout
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timed out',
        timedOut: true
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Fetches with configurable options including timeout
 * FIXED: timeout option is properly implemented
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

  // FIXED: Create AbortController and connect to timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method,
      headers,
      body,
      signal: controller.signal // FIXED: Pass signal for abort
    });

    clearTimeout(timeoutId);

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
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timed out',
        timedOut: true
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Race between fetch and timeout with proper cancellation
 * FIXED: Uses AbortController to actually cancel the fetch
 */
export async function fetchWithRaceTimeout<T>(
  url: string,
  timeoutMs: number = 5000
): Promise<FetchResult<T>> {
  // FIXED: Create AbortController to cancel the fetch
  const controller = new AbortController();

  const timeoutPromise = new Promise<FetchResult<T>>((resolve) => {
    setTimeout(() => {
      controller.abort(); // FIXED: Actually abort the fetch
      resolve({
        success: false,
        error: 'Request timed out',
        timedOut: true
      });
    }, timeoutMs);
  });

  const fetchPromise = fetch(url, {
    signal: controller.signal // FIXED: Connect signal to fetch
  }).then(async (response) => {
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
  }).catch((error) => {
    if (error instanceof Error && error.name === 'AbortError') {
      return {
        success: false,
        error: 'Request timed out',
        timedOut: true
      } as FetchResult<T>;
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    } as FetchResult<T>;
  });

  return Promise.race([fetchPromise, timeoutPromise]);
}
