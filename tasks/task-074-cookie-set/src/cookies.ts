// BUG: Set-Cookie header is missing required security attributes
// This makes cookies vulnerable to various attacks

export interface CookieOptions {
  name: string;
  value: string;
  maxAge?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: "strict" | "lax" | "none";
}

export function serializeCookie(options: CookieOptions): string {
  const { name, value } = options;

  // BUG: Only serializes name and value, ignores all security attributes
  return `${name}=${value}`;
}

export function createSecureSessionCookie(
  sessionId: string
): string {
  // BUG: Doesn't pass security options, even though this is a session cookie
  return serializeCookie({
    name: "session",
    value: sessionId,
    // These options are defined but ignored by serializeCookie!
    secure: true,
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    maxAge: 86400, // 1 day
  });
}

export function setResponseCookie(
  response: Response,
  options: CookieOptions
): Response {
  const cookieHeader = serializeCookie(options);
  const headers = new Headers(response.headers);
  headers.append("Set-Cookie", cookieHeader);

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// Example usage
if (import.meta.main) {
  const cookie = createSecureSessionCookie("abc123xyz");
  console.log("Set-Cookie:", cookie);
  // Buggy output: "session=abc123xyz"
  // Expected: "session=abc123xyz; Path=/; Max-Age=86400; Secure; HttpOnly; SameSite=Strict"
}
