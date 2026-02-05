# Task 062: WritableStream Backpressure Data Loss

## Problem Description

A WritableStream implementation doesn't properly handle backpressure, causing data loss when writing large amounts of data quickly. The write operations don't wait for the previous write to complete before enqueueing more data.

## Bug Details

The implementation writes data to a WritableStream without awaiting the writer's `ready` promise. When writing large amounts of data, this can cause:

- Data loss when the underlying sink can't keep up
- Backpressure signals being ignored
- The internal queue overflowing
- Write operations completing in unexpected order

## Files

- `src/stream.ts` - Buggy implementation that ignores backpressure
- `test/stream.test.ts` - Tests that verify all data is written (will fail)
- `solution/stream.ts` - Fixed implementation that properly awaits backpressure

## Expected Behavior

The WritableStream should:
1. Await the `writer.ready` promise before each write
2. Properly handle backpressure from the underlying sink
3. Guarantee all data is written in order without loss

## How to Run

```bash
# Run the failing test
bun test

# Run the stream example
bun run src/stream.ts
```
