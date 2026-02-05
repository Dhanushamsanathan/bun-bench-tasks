# Task 053: UDP Socket Port Binding and Message Handling Bug

## Problem Description

The UDP socket implementation has issues with port binding and message handling. The socket doesn't properly bind to the specified port, and the message handler doesn't correctly process incoming data or handle the sender's address information.

## Bug Details

The code uses `Bun.udpSocket()` to create a UDP socket. However:

1. The socket configuration doesn't properly specify the port to bind to
2. The message handler ignores sender address information
3. Response messages are sent to wrong port or fail silently
4. The socket doesn't properly handle the message callback parameters

For example:
- Buggy socket binds to random port instead of specified port
- Received messages lose sender information
- Responses never reach the original sender

## Files

- `src/socket.ts` - Buggy implementation with incorrect port binding
- `test/socket.test.ts` - Tests that verify proper UDP communication (will fail)
- `solution/socket.ts` - Fixed implementation with correct port binding and message handling

## Expected Behavior

1. UDP socket should bind to the specified port
2. Message handler should receive sender address and port
3. Responses should be sent back to the correct sender
4. Message content should be properly decoded

## How to Run

```bash
# Run the failing test
bun test

# Run the socket
bun run src/socket.ts
```
