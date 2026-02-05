// BUG: Naive cookie parsing doesn't handle special characters or URL encoding
// This causes incorrect parsing for values with spaces, encoded chars, or equal signs

interface ParsedCookies {
  [key: string]: string;
}

export function parseCookies(cookieString: string): ParsedCookies {
  const cookies: ParsedCookies = {};

  if (!cookieString) {
    return cookies;
  }

  // BUG: Simple split doesn't handle values with = signs
  const pairs = cookieString.split(";");

  for (const pair of pairs) {
    const trimmed = pair.trim();
    if (!trimmed) continue;

    // BUG: Only takes first part before =, loses data if value contains =
    const [name, value] = trimmed.split("=");

    if (name) {
      // BUG: Doesn't decode URL-encoded values
      cookies[name.trim()] = value?.trim() || "";
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
  // Buggy output: { user: "John%20Doe", data: "a", token: "abc%3D%3D" }
  // Expected: { user: "John Doe", data: "a=b=c", token: "abc==" }
}
