# Task 002: JSON Response Content-Type Bug

## Problem Description

The HTTP server returns JSON data but fails to set the proper `Content-Type` header, causing clients to potentially misinterpret the response.

## Bug Details

The server manually constructs a JSON response using `JSON.stringify()` and returns it as a plain `Response`. However, it neglects to set the `Content-Type: application/json` header.

This causes:
- Browsers may not parse the response as JSON automatically
- API clients may fail to recognize the response format
- CORS preflight checks may behave unexpectedly

## Files

- `src/server.ts` - Buggy implementation missing Content-Type header
- `test/server.test.ts` - Test that verifies correct Content-Type (will fail)
- `solution/server.ts` - Fixed implementation using `Response.json()` or proper headers

## Expected Behavior

JSON responses should always include `Content-Type: application/json` header.

## How to Run

```bash
# Run the failing test
bun test

# Run the server
bun run src/server.ts
```
