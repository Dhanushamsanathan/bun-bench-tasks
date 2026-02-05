# Task 026: Fetch Error Handling

## Problem Description

The `fetchData` function makes HTTP requests but does not properly handle network errors. When a fetch request fails (e.g., network error, DNS failure, connection refused), the promise rejection crashes the application instead of being caught and handled gracefully.

## Bug

The fetch() call is not wrapped in try-catch, and rejected promises are not handled. This causes:
- Unhandled promise rejections when the network is unavailable
- Application crashes when the target server is down
- No error recovery or fallback behavior

## Expected Behavior

- Network errors should be caught and return a structured error response
- The function should never throw unhandled exceptions
- Callers should receive an error object with status and message

## Files

- `src/client.ts` - Buggy HTTP client implementation
- `test/client.test.ts` - Tests that demonstrate the failure
- `solution/client.ts` - Fixed implementation with proper error handling
