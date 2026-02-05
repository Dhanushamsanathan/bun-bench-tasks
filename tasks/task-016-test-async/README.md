# Task 016: Async Test Await

## Problem Description

The test file contains a common async testing mistake where the test function does not properly await the async operation. This causes the test to pass before the assertion actually runs.

## Bug Location

File: `test/api.test.ts`

The test uses `.then()` without returning the promise or using async/await. The test function completes immediately (passing), and the assertion inside `.then()` runs later but its failure is never caught.

## Expected Behavior

The test should fail because `fetchData()` returns `{ value: 42 }` but the assertion expects `999`.

## Actual Behavior

The test passes because:
1. Test function starts executing
2. `fetchData()` returns a Promise
3. `.then()` schedules the callback for later
4. Test function returns (no assertion ran yet) - TEST PASSES
5. Later, the `.then()` callback runs and the assertion fails
6. But the test already passed, so the failure is silently ignored

## Files

- `src/api.ts` - Async function that returns data after a delay
- `test/api.test.ts` - Buggy test that doesn't await
- `solution/api.test.ts` - Fixed test with proper async handling

## Key Concepts

- bun:test requires async tests to either use async/await or return a Promise
- Unhandled promise rejections in tests may be silently ignored
- Always use `async/await` for testing async code
