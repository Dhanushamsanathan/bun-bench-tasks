# Task 052: TCP Client Connection Error Handling Bug

## Problem Description

The TCP client doesn't properly handle connection errors such as connection refused (server not running) or connection timeout. The code crashes or hangs instead of gracefully handling these error conditions.

## Bug Details

The client uses `Bun.connect()` to connect to a TCP server. However:

1. It doesn't handle connection refused errors (when server isn't running)
2. It doesn't implement proper timeout handling
3. It doesn't provide meaningful error callbacks
4. The promise rejection is not caught, causing unhandled promise rejections

For example, when connecting to a non-existent server:
- Buggy client crashes with unhandled rejection
- No error callback is invoked
- No timeout mechanism exists

## Files

- `src/client.ts` - Buggy implementation without proper error handling
- `test/client.test.ts` - Tests that verify error handling (will fail)
- `solution/client.ts` - Fixed implementation with proper error handling

## Expected Behavior

1. Connection errors should be caught and reported via callback
2. Connection attempts should timeout after a specified period
3. The client should not crash on connection failures
4. Error messages should be descriptive and actionable

## How to Run

```bash
# Run the failing test
bun test

# Run the client
bun run src/client.ts
```
