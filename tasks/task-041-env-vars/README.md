# Task 041: Env Variables

## Problem Description

A configuration module accesses environment variables directly without providing default values. When environment variables are not set, the code crashes with undefined values or causes unexpected behavior.

## Bug

The code accesses `process.env.VARIABLE` directly without defaults, which returns `undefined` when the variable is not set. This causes crashes or unexpected behavior when concatenating strings or performing operations on these values.

## Expected Behavior

- Environment variables should have sensible default values
- The application should work even when optional env vars are not set
- Required env vars should be clearly documented

## Files

- `src/config.ts` - Buggy configuration module
- `test/config.test.ts` - Tests that expose the bug
- `solution/config.ts` - Fixed implementation

## Bun APIs Used

- `process.env` - Environment variable access
- `Bun.env` - Bun's environment variable access
