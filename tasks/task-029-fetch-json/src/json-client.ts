/**
 * JSON HTTP client for API interactions
 * BUG: POST body is not stringified, sends [object Object]
 */

export interface ApiResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Posts JSON data to an API endpoint
 * BUG: body is not JSON.stringify'd before sending
 */
export async function postJson<T>(
  url: string,
  body: unknown
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      // BUG: body needs to be JSON.stringify()'d
      // This will send "[object Object]" as the body
      body: body as any
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`
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
 * Puts JSON data to an API endpoint
 * BUG: Same issue - body not stringified
 */
export async function putJson<T>(
  url: string,
  body: unknown
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      // BUG: body needs to be JSON.stringify()'d
      body: body as any
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`
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
 * Patches JSON data to an API endpoint
 * BUG: Same issue - body not stringified
 */
export async function patchJson<T>(
  url: string,
  body: unknown
): Promise<ApiResult<T>> {
  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      // BUG: body needs to be JSON.stringify()'d
      body: body as any
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`
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
 * Generic JSON request function
 * BUG: Body handling is inconsistent
 */
export async function jsonRequest<T>(
  url: string,
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  body?: unknown
): Promise<ApiResult<T>> {
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    // BUG: Body is not stringified for methods that have a body
    if (body !== undefined) {
      options.body = body as any;
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `HTTP ${response.status}: ${errorText}`
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
