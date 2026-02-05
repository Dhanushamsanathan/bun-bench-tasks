# Task 074: Set-Cookie Header Missing Security Attributes

## Problem Description

The cookie serialization implementation creates `Set-Cookie` headers that are missing required security attributes (`Secure`, `HttpOnly`, `SameSite`), making cookies vulnerable to attacks.

## Bug Details

The buggy implementation only sets the cookie name and value, ignoring critical security attributes:

- **Secure**: Cookie should only be sent over HTTPS
- **HttpOnly**: Cookie should not be accessible via JavaScript (prevents XSS)
- **SameSite**: Controls cross-site request behavior (prevents CSRF)

For example, setting a session cookie without these attributes:
```
Set-Cookie: session=abc123
```

Should actually be:
```
Set-Cookie: session=abc123; Path=/; Secure; HttpOnly; SameSite=Strict
```

The missing attributes leave the application vulnerable to:
- Session hijacking via man-in-the-middle attacks (no `Secure`)
- Cross-site scripting cookie theft (no `HttpOnly`)
- Cross-site request forgery attacks (no `SameSite`)

## Files

- `src/cookies.ts` - Buggy implementation missing security attributes
- `test/cookies.test.ts` - Tests that verify security attributes (will fail)
- `solution/cookies.ts` - Fixed implementation using `Bun.Cookie` with proper attributes

## Expected Behavior

Cookie serialization should:
1. Always include `Secure` flag for sensitive cookies
2. Always include `HttpOnly` for session/auth cookies
3. Always include appropriate `SameSite` setting
4. Use `Bun.Cookie` for reliable serialization

## How to Run

```bash
# Run the failing test
bun test

# Test the implementation
bun run src/cookies.ts
```
