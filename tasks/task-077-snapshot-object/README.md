# Task 077: Snapshot Object with Property Matchers

## Problem Description

The test file contains a snapshot test that fails due to dynamic values in the object being tested. Values like timestamps, UUIDs, and auto-generated IDs change on every test run, causing the snapshot to never match.

## Bug Location

File: `test/user.test.ts`

The snapshot test captures an entire object including dynamic fields like `createdAt` (timestamp) and `id` (generated UUID). Since these values change on every run, the test either:
1. Fails because the snapshot doesn't match the new dynamic values
2. Requires constant snapshot updates, defeating the purpose of snapshot testing

## Expected Behavior

The test should use property matchers to handle dynamic values while still verifying the static structure and values of the object.

## Actual Behavior

The test fails with a snapshot mismatch because:
1. `createdAt` contains the current timestamp (different every run)
2. `id` contains a generated UUID (different every run)
3. The snapshot was created at a specific point in time with specific values
4. New runs produce new dynamic values that don't match

## Files

- `src/user.ts` - User creation function that generates dynamic values
- `test/user.test.ts` - Buggy snapshot test without property matchers
- `solution/user.test.ts` - Fixed test using property matchers for dynamic values

## Key Concepts

- `toMatchSnapshot()` captures the entire value literally
- Property matchers allow specific fields to use asymmetric matchers
- Use `expect.any(Date)` for timestamps
- Use `expect.any(String)` for UUIDs/IDs
- Use `expect.stringMatching()` for pattern-based matching
- Property matchers are passed as the first argument to `toMatchSnapshot()`
