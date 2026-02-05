# Task 061: ReadableStream Resource Leak

## Problem Description

A ReadableStream is not properly closed after reading, causing resource leaks. The stream's controller is not properly cancelled when reading is complete or when an error occurs.

## Bug Details

The implementation creates a ReadableStream that generates data but fails to properly signal completion. The `controller.close()` is never called, leaving the stream in an open state indefinitely. This causes:

- Memory leaks as the stream resources are never released
- The stream's `locked` state never resolves properly
- Consumers waiting for stream completion hang indefinitely

## Files

- `src/stream.ts` - Buggy implementation that never closes the stream
- `test/stream.test.ts` - Tests that verify proper stream cleanup (will fail)
- `solution/stream.ts` - Fixed implementation with proper `controller.close()`

## Expected Behavior

The ReadableStream should:
1. Properly call `controller.close()` when all data has been enqueued
2. Allow the stream to be fully consumed and closed
3. Release resources after the stream is complete

## How to Run

```bash
# Run the failing test
bun test

# Run the stream example
bun run src/stream.ts
```
