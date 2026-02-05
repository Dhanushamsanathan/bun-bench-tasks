# Task 017: Mock Cleanup

## Problem Description

The test file creates mocks but fails to restore them between tests. This causes test pollution where mocks from one test affect subsequent tests, leading to flaky or incorrect test results.

## Bug Location

File: `test/service.test.ts`

Mocks are created using `mock()` but never restored with `mockRestore()` or cleaned up in `afterEach`. The mock state persists across tests.

## Expected Behavior

Each test should run in isolation with fresh mocks. The `getConfig` function should return its real implementation unless explicitly mocked in that specific test.

## Actual Behavior

- First test mocks `getConfig` to return test data
- Mock is never restored
- Second test expects real behavior but gets the mocked behavior
- Tests pass or fail depending on execution order
- Running tests individually may pass, but running all together fails

## Files

- `src/service.ts` - Service that depends on config
- `src/config.ts` - Config module to be mocked
- `test/service.test.ts` - Buggy tests with mock pollution
- `solution/service.test.ts` - Fixed tests with proper mock cleanup

## Key Concepts

- Mocks persist across tests unless explicitly restored
- Use `afterEach` or `beforeEach` for mock cleanup
- `mock.mockRestore()` restores original implementation
- `mock.mockClear()` only clears call history, not the mock itself
- bun:test `spyOn` returns a mock that should be restored
