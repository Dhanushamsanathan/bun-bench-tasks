# Task 071: Worker Error Handling Bug

## Category
Bun Workers / Web Workers

## Difficulty
Medium

## Problem Description
When a Web Worker throws an error, the main thread fails to catch and handle it properly. The error event handler is not set up correctly, causing unhandled errors and potential memory leaks from workers that aren't cleaned up after errors.

## Buggy Behavior
- Worker errors are not caught by the main thread
- The Promise never rejects when the worker throws
- Error details (message, stack trace) are lost
- Worker is not terminated after an error

## Expected Behavior
- Worker errors should be caught in the main thread
- Promises should reject with meaningful error information
- Error details should be preserved and accessible
- Worker should be properly terminated after an error

## Files
- `src/main.ts` - Main thread code that creates worker and handles errors
- `src/worker.ts` - Worker code that may throw errors
- `test/worker-error.test.ts` - Tests for error handling
- `solution/main.ts` - Fixed main thread code
- `solution/worker.ts` - Fixed worker code

## Hints
1. Use the `onerror` event handler on the Worker
2. Consider using `messageerror` for deserialization errors
3. Make sure to terminate the worker in error scenarios
4. Wrap worker communication in a Promise for async handling
