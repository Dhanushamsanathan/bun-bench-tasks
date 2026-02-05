# Task 073: Cookie Parsing Special Characters Bug

## Problem Description

The cookie parsing implementation doesn't properly handle special characters, spaces, or URL-encoded values in cookie strings.

## Bug Details

The buggy implementation uses a naive string split approach to parse cookies, which fails when cookie values contain special characters like:
- Spaces (which should be preserved in values)
- URL-encoded characters (like `%20`, `%3D`, `%3B`)
- Equal signs in values (like JSON or base64)
- Semicolons in quoted values

For example, the cookie string `user=John%20Doe; data=a=b=c; token=abc%3D%3D` should parse to:
- `user` = `John Doe` (URL-decoded)
- `data` = `a=b=c` (preserving equal signs in value)
- `token` = `abc==` (URL-decoded)

The buggy code doesn't decode URL-encoded values and incorrectly splits values containing `=`.

## Files

- `src/cookies.ts` - Buggy implementation with naive parsing
- `test/cookies.test.ts` - Tests that verify correct parsing (will fail)
- `solution/cookies.ts` - Fixed implementation using `Bun.CookieMap`

## Expected Behavior

Cookie parsing should:
1. Properly decode URL-encoded values
2. Handle equal signs within cookie values
3. Preserve spaces and special characters correctly
4. Use `Bun.CookieMap` for reliable parsing

## How to Run

```bash
# Run the failing test
bun test

# Test the implementation
bun run src/cookies.ts
```
