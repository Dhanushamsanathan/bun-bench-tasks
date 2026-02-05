# Task 064: Stream Pipeline Error Handling

## Problem Description

A stream pipeline using `.pipeTo()` and `.pipeThrough()` doesn't properly handle errors that occur mid-pipeline. When an error is injected into the pipeline, it either crashes unhandled or silently fails without proper cleanup.

## Bug Details

The implementation creates a pipeline of streams but doesn't configure error handling options. When an error occurs:

- The pipeline crashes without proper error propagation
- Upstream streams are not properly aborted
- Downstream streams don't receive error signals
- Resources are leaked because streams aren't cleaned up

The `pipeTo()` method accepts options like `preventAbort`, `preventCancel`, and `preventClose` which must be configured properly, and errors must be caught and handled.

## Files

- `src/stream.ts` - Buggy implementation without proper error handling
- `test/stream.test.ts` - Tests that verify error handling in pipeline (will fail)
- `solution/stream.ts` - Fixed implementation with proper error handling

## Expected Behavior

The stream pipeline should:
1. Catch and handle errors that occur in any part of the pipeline
2. Properly abort upstream streams when errors occur downstream
3. Signal errors to downstream consumers
4. Clean up all resources in the pipeline on error

## How to Run

```bash
# Run the failing test
bun test

# Run the stream example
bun run src/stream.ts
```
