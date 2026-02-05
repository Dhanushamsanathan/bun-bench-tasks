# Task 025: WebSocket Authentication Bug

## Problem Description

The WebSocket server implements authentication for WebSocket connections. However, the authentication check happens AFTER the WebSocket upgrade is completed, instead of BEFORE. This allows unauthorized clients to temporarily connect and potentially access protected resources.

## Bug Details

The correct flow for WebSocket authentication should be:

1. Client sends upgrade request with auth token (in header or query param)
2. Server validates token BEFORE upgrading
3. If invalid, return HTTP 401 Unauthorized (no upgrade)
4. If valid, upgrade to WebSocket

The buggy implementation does:

1. Client sends upgrade request
2. Server upgrades to WebSocket immediately (no auth check!)
3. Auth check happens in `open` handler
4. If invalid, close the connection

This is problematic because:
- Unauthorized clients briefly have a WebSocket connection
- They may receive initial data before being kicked
- Resources are wasted on upgrading unauthorized requests
- The close code/reason isn't always properly communicated

## Files

- `src/server.ts` - Buggy implementation that checks auth after upgrade
- `test/server.test.ts` - Tests that verify proper pre-upgrade auth (will fail)
- `solution/server.ts` - Fixed implementation that checks auth before upgrade

## Expected Behavior

1. Validate authentication token in the `fetch` handler BEFORE calling `server.upgrade()`
2. Return HTTP 401 if authentication fails (no WebSocket connection established)
3. Only upgrade authenticated requests

## How to Run

```bash
# Run the failing test
bun test

# Run the server
bun run src/server.ts
```
