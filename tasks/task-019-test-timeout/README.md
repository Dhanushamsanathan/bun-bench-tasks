# Task 019: Test Timeout

## Problem Description

The test file contains long-running operations without proper timeout configuration. This causes tests to hang indefinitely or fail intermittently in CI environments with different timeout defaults.

## Bug Location

File: `test/operations.test.ts`

Tests that involve:
- Network-like operations with delays
- Infinite loops or retry logic without bounds
- No timeout configuration on individual tests or describe blocks
- Missing timeout handling for async operations

## Expected Behavior

Tests should have appropriate timeouts configured to:
- Fail fast when operations take too long
- Provide clear timeout error messages
- Work consistently across different environments

## Actual Behavior

- Tests hang waiting for operations that never complete
- Default timeout may be too long, wasting CI time
- Tests pass locally but fail in CI due to different timeout settings
- No indication of which operation is slow

## Files

- `src/operations.ts` - Operations that may take a long time
- `test/operations.test.ts` - Tests without timeout configuration
- `solution/operations.test.ts` - Fixed tests with proper timeouts

## Key Concepts

- Use `test("name", callback, timeout)` to set per-test timeout
- Use `describe` level timeout via test options
- Handle potential infinite operations with AbortController
- Set reasonable timeouts based on expected operation duration
- bun:test default timeout is 5000ms
