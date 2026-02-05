# Task 024: WebSocket Broadcast Bug

## Problem Description

The WebSocket server implements a broadcast feature to send messages to all connected clients in a room/channel. However, the broadcast function sends messages to ALL clients including the sender, when it should exclude the sender.

## Bug Details

When a client sends a message to be broadcast to others:

1. The server iterates through all connected clients
2. It sends the message to every client, including the original sender
3. The sender receives their own message back

This causes issues such as:
- Duplicate messages in chat applications
- Infinite loops if clients echo messages
- Incorrect behavior for "send to others" functionality

For example, in a chat room with clients A, B, and C:
- When A sends "Hello everyone"
- Expected: B and C receive "Hello everyone"
- Buggy behavior: A, B, and C all receive "Hello everyone"

## Files

- `src/server.ts` - Buggy implementation that broadcasts to sender too
- `test/server.test.ts` - Tests that verify sender exclusion (will fail)
- `solution/server.ts` - Fixed implementation that excludes sender from broadcast

## Expected Behavior

1. When broadcasting, iterate through all clients
2. Skip the sender when sending the broadcast message
3. Only non-sender clients receive the broadcast

## How to Run

```bash
# Run the failing test
bun test

# Run the server
bun run src/server.ts
```
