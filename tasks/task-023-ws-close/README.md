# Task 023: WebSocket Close Handler Bug

## Problem Description

The WebSocket server maintains a set of connected clients and resources (like subscriptions, timers, etc.) for each client. When a client disconnects, these resources should be properly cleaned up in the `close` handler. However, the close handler doesn't properly clean up resources.

## Bug Details

The server tracks connected clients and their associated resources:

1. Active clients are stored in a `Map` with their WebSocket and associated data
2. Each client may have interval timers for heartbeat/ping
3. Each client may have subscriptions to topics

The bug is that when a client disconnects:
1. The client is not removed from the active clients map
2. Interval timers are not cleared, causing memory leaks
3. Subscriptions are not cleaned up

This leads to:
- Memory leaks from orphaned references
- Timers continuing to run for disconnected clients
- Incorrect client counts

## Files

- `src/server.ts` - Buggy implementation that doesn't clean up on close
- `test/server.test.ts` - Tests that verify proper cleanup (will fail)
- `solution/server.ts` - Fixed implementation with proper resource cleanup

## Expected Behavior

1. Remove client from active clients map on disconnect
2. Clear any interval timers associated with the client
3. Remove client from all topic subscriptions
4. Emit proper close events with cleanup confirmation

## How to Run

```bash
# Run the failing test
bun test

# Run the server
bun run src/server.ts
```
