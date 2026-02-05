# Task 020: Describe Scope

## Problem Description

The test file has variables shared across tests within a describe block, causing test pollution. Tests modify shared state, making them order-dependent and causing flaky test results.

## Bug Location

File: `test/cart.test.ts`

Problems include:
- Shared variable declared outside tests but modified inside tests
- No reset of state between tests (missing beforeEach)
- Tests that depend on side effects from previous tests
- Accumulating state across test runs

## Expected Behavior

Each test should run in isolation with a fresh state. The order of test execution should not affect results.

## Actual Behavior

- First test modifies shared state
- Second test sees modified state from first test
- Running tests in different order produces different results
- Tests pass individually but fail when run together (or vice versa)

## Files

- `src/cart.ts` - Shopping cart implementation
- `test/cart.test.ts` - Buggy tests with shared state
- `solution/cart.test.ts` - Fixed tests with proper isolation

## Key Concepts

- Use `beforeEach` to reset state before each test
- Declare test-specific variables inside the test function
- Use factory functions to create fresh instances
- Avoid mutating shared state in tests
- Consider `describe` block scope carefully
