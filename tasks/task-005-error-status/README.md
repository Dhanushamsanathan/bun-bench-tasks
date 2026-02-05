# Task 005: Error Status Code Bug

## Problem Description

The HTTP server's error handler returns HTTP 200 OK status codes instead of appropriate error codes (500, 400, etc.) when exceptions occur.

## Bug Details

The server has a try-catch error handler, but when catching errors, it returns responses without specifying the status code. Since the default status code for `new Response()` is 200, all error responses incorrectly indicate success.

This causes:
- Clients can't detect server errors from status codes
- Monitoring tools miss error conditions
- API consumers process error responses as successful
- Retry logic doesn't trigger on failures

## Files

- `src/server.ts` - Buggy implementation returning 200 for errors
- `test/server.test.ts` - Test that verifies correct error status codes (will fail)
- `solution/server.ts` - Fixed implementation with proper error status codes

## Expected Behavior

- Unhandled exceptions should return 500 Internal Server Error
- Validation errors should return 400 Bad Request
- Not found errors should return 404

## How to Run

```bash
# Run the failing test
bun test

# Run the server
bun run src/server.ts
```
