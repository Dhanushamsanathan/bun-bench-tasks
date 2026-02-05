# Task 001: Content-Length UTF-8 Bug

## Problem Description

The HTTP server returns an incorrect `Content-Length` header when responding with UTF-8 encoded text containing multi-byte characters.

## Bug Details

The server uses JavaScript's `string.length` property to calculate the Content-Length header value. However, `string.length` returns the number of **characters** (UTF-16 code units), not the number of **bytes** in the UTF-8 encoded string.

For example, the Japanese greeting "こんにちは" has:
- 5 characters (what `string.length` returns)
- 15 bytes when UTF-8 encoded (what Content-Length should be)

This causes HTTP clients to potentially truncate or misread the response body.

## Files

- `src/server.ts` - Buggy implementation using character count
- `test/server.test.ts` - Test that verifies correct byte length (will fail)
- `solution/server.ts` - Fixed implementation using `Buffer.byteLength()`

## Expected Behavior

The `Content-Length` header should always reflect the actual byte size of the response body, not the character count.

## How to Run

```bash
# Run the failing test
bun test

# Run the server
bun run src/server.ts
```
