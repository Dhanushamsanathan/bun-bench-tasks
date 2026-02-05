# Task 030: Fetch Response Check

## Problem Description

The `fetchApi` function makes HTTP requests but does not check `response.ok` to verify the request succeeded. This causes HTTP error responses (4xx, 5xx) to be treated as successful responses, leading to incorrect application behavior.

## Bug

After calling fetch():
- The `response.ok` property is not checked
- 404 Not Found responses are treated as success
- 500 Internal Server Error responses are treated as success
- Error data is passed to application as if it were valid data
- No distinction between successful and failed HTTP responses

## Expected Behavior

- Check `response.ok` before processing response body
- Return error result for 4xx and 5xx status codes
- Include status code in error information
- Only treat 2xx responses as successful

## Files

- `src/api-client.ts` - Buggy client that doesn't check response.ok
- `test/api-client.test.ts` - Tests that demonstrate the missing check
- `solution/api-client.ts` - Fixed implementation with proper response checking
