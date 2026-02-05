# Task 072: Worker Terminate Bug

## Category
Bun Workers / Web Workers

## Difficulty
Medium

## Problem Description
A Web Worker is not properly terminated after use, causing it to continue running in the background. This leads to resource leaks, continued execution of intervals/timeouts, and potential memory issues when workers are created repeatedly.

## Buggy Behavior
- Worker continues running after the main thread is done with it
- Intervals and timeouts in the worker keep executing
- No cleanup is performed when the worker should be stopped
- Multiple workers accumulate over time

## Expected Behavior
- `worker.terminate()` should be called when work is complete
- Worker should stop all execution after termination
- Intervals and timeouts should be cleared
- Resources should be properly cleaned up

## Files
- `src/main.ts` - Main thread code that creates and should terminate workers
- `src/worker.ts` - Worker code with background tasks
- `test/worker-terminate.test.ts` - Tests for proper termination
- `solution/main.ts` - Fixed main thread code
- `solution/worker.ts` - Fixed worker code

## Hints
1. Always call `worker.terminate()` when done with a worker
2. Use a cleanup mechanism in the worker to stop intervals/timeouts
3. Track worker state to know if termination is needed
4. Consider using AbortController pattern for cancellation
