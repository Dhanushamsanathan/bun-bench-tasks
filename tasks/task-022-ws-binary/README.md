# Task 022: WebSocket Binary Data Bug

## Problem Description

The WebSocket server is supposed to handle binary data (like images, files, or raw bytes) correctly. However, the message handler treats all messages as text strings, which corrupts binary data.

## Bug Details

When binary data is sent to the WebSocket server:

1. The handler converts the binary `Buffer` or `ArrayBuffer` to a string using `.toString()`
2. This conversion corrupts non-UTF8 binary data
3. The corrupted data is then sent back, making it unusable

For example, when receiving a binary buffer like:
```
Buffer<0x89, 0x50, 0x4E, 0x47> (PNG header)
```

The buggy server:
1. Converts it to string (lossy conversion for non-text bytes)
2. Sends back the corrupted string representation
3. Client receives corrupted data that no longer matches the original

## Files

- `src/server.ts` - Buggy implementation that treats binary as text
- `test/server.test.ts` - Tests that verify proper binary handling (will fail)
- `solution/server.ts` - Fixed implementation that preserves binary data

## Expected Behavior

1. Detect when a message is binary data (Buffer/ArrayBuffer)
2. Process binary data without converting to string
3. Send binary data back as binary, preserving all bytes

## How to Run

```bash
# Run the failing test
bun test

# Run the server
bun run src/server.ts
```
