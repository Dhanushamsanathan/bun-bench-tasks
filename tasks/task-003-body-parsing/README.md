# Task 003: Request Body Parsing Bug

## Problem Description

The HTTP server fails to properly parse JSON request bodies because the handler doesn't await the asynchronous `req.json()` method.

## Bug Details

The server's POST handler calls `req.json()` to parse the request body, but forgets to `await` the result. Since `req.json()` returns a Promise, the code ends up working with a Promise object instead of the actual parsed data.

This causes:
- Response contains `[object Promise]` or `undefined` instead of actual data
- Data validation always fails
- Echo/reflection endpoints return garbage

## Files

- `src/server.ts` - Buggy implementation that doesn't await req.json()
- `test/server.test.ts` - Test that verifies correct body parsing (will fail)
- `solution/server.ts` - Fixed implementation with proper async/await

## Expected Behavior

The server should properly await `req.json()` to get the parsed request body data.

## How to Run

```bash
# Run the failing test
bun test

# Run the server
bun run src/server.ts
```
