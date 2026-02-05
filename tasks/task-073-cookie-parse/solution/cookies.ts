// FIXED: Uses Bun.CookieMap for proper cookie parsing with encoding support

interface ParsedCookies {
  [key: string]: string;
}

export function parseCookies(cookieString: string): ParsedCookies {
  const cookies: ParsedCookies = {};

  if (!cookieString) {
    return cookies;
  }

  // FIXED: Use Bun.CookieMap for proper parsing
  const cookieMap = new Bun.CookieMap(cookieString);

  // Convert CookieMap to object with URL decoding
  for (const [name, value] of cookieMap) {
    try {
      // FIXED: Decode URL-encoded values using decodeURIComponent
      // Note: Per RFC 6265, cookies use percent-encoding, not form encoding
      // So %20 = space, %2B = +, etc.
      cookies[name] = decodeURIComponent(value);
    } catch {
      // If decoding fails, use the raw value
      cookies[name] = value;
    }
  }

  return cookies;
}

export function getCookie(cookieString: string, name: string): string | null {
  const cookies = parseCookies(cookieString);
  return cookies[name] ?? null;
}

// Example usage
if (import.meta.main) {
  const testCookies = "user=John%20Doe; data=a=b=c; token=abc%3D%3D";
  console.log("Input:", testCookies);
  console.log("Parsed:", parseCookies(testCookies));
  // Correct output: { user: "John Doe", data: "a=b=c", token: "abc==" }
}
