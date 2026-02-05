# Task 043: Env Type Coercion

## Problem Description

Environment variables are always strings, but the application uses them directly without type conversion. This causes type mismatches, especially for numeric values like PORT, where string comparison or arithmetic operations fail.

## Bug

The PORT environment variable is used as a string instead of being converted to a number. This causes issues with port comparisons, range checking, and arithmetic operations.

## Expected Behavior

- Numeric env vars should be converted to numbers
- Boolean env vars should be properly coerced to boolean
- Type validation should occur during configuration loading

## Files

- `src/server-config.ts` - Buggy server configuration
- `test/server-config.test.ts` - Tests that expose the bug
- `solution/server-config.ts` - Fixed implementation

## Bun APIs Used

- `process.env` - Environment variable access
- `Bun.serve()` - Server creation (uses port)
