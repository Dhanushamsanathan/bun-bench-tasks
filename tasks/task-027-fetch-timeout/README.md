# Task 027: Fetch Timeout

## Problem Description

The `fetchWithTimeout` function is supposed to cancel requests that take too long, but it doesn't use AbortController properly. This causes requests to hang indefinitely when the server is slow or unresponsive.

## Bug

The fetch request is not connected to an AbortController signal. Even though a timeout is conceptually desired:
- No AbortController is created
- No signal is passed to fetch()
- Requests can hang forever waiting for a response
- No way to cancel in-flight requests

## Expected Behavior

- Requests should abort after the specified timeout
- AbortController should be used to signal cancellation
- The function should return an error when timeout occurs
- Resources should be cleaned up properly

## Files

- `src/timeout.ts` - Buggy implementation without AbortController
- `test/timeout.test.ts` - Tests that demonstrate the hanging behavior
- `solution/timeout.ts` - Fixed implementation with proper timeout handling
