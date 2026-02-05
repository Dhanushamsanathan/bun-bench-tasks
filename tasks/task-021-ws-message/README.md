# Task 021: WebSocket Message Handler Bug

## Problem Description

The WebSocket server is supposed to receive JSON messages, parse them, and respond with a processed JSON object. However, the message handler doesn't properly parse incoming JSON messages and instead sends back the raw string.

## Bug Details

The server's `message` handler receives messages that are expected to be JSON strings (e.g., `{"action": "echo", "data": "hello"}`), but:

1. It doesn't parse the incoming message as JSON
2. It treats the message as a raw string
3. It sends back the unparsed string instead of a processed JSON response

For example, when receiving:
```json
{"action": "echo", "data": "hello"}
```

The buggy server responds with:
```
{"action": "echo", "data": "hello"}
```

Instead of the expected response:
```json
{"status": "ok", "action": "echo", "result": "hello"}
```

## Files

- `src/server.ts` - Buggy implementation that doesn't parse JSON messages
- `test/server.test.ts` - Tests that verify proper JSON parsing (will fail)
- `solution/server.ts` - Fixed implementation that correctly parses and responds with JSON

## Expected Behavior

1. Parse incoming messages as JSON
2. Extract the `action` and `data` fields
3. Respond with a properly formatted JSON object containing the result

## How to Run

```bash
# Run the failing test
bun test

# Run the server
bun run src/server.ts
```
