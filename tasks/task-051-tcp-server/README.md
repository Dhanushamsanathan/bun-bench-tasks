# Task 051: TCP Server Client Disconnection Bug

## Problem Description

The TCP server doesn't properly handle client disconnections, causing resource leaks. When clients disconnect (either gracefully or abruptly), the server fails to clean up tracked connections, leading to memory leaks and incorrect connection counts.

## Bug Details

The server uses `Bun.listen()` to create a TCP server and tracks connected clients in a Set. However:

1. The `close` handler doesn't remove the socket from the tracked connections Set
2. The `error` handler doesn't clean up the socket on connection errors
3. This causes the connection count to grow indefinitely as clients connect/disconnect

For example, after 10 clients connect and disconnect:
- Buggy server reports 10 active connections (should be 0)
- Memory usage grows with each connection cycle

## Files

- `src/server.ts` - Buggy implementation that doesn't clean up on disconnect
- `test/server.test.ts` - Tests that verify proper cleanup (will fail)
- `solution/server.ts` - Fixed implementation that properly removes connections

## Expected Behavior

1. When a client disconnects, remove the socket from tracked connections
2. Connection count should accurately reflect active connections
3. No memory leaks from orphaned socket references

## How to Run

```bash
# Run the failing test
bun test

# Run the server
bun run src/server.ts
```
