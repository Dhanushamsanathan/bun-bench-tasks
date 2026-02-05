# Task 044: Env Validation

## Problem Description

A configuration module doesn't validate required environment variables at startup. Missing required variables cause cryptic errors later in the application lifecycle instead of failing fast with clear error messages.

## Bug

The code doesn't check for required environment variables during initialization. When required variables like DATABASE_URL or API_KEY are missing, the application starts but fails later with unclear errors.

## Expected Behavior

- Required env vars should be validated at startup
- Missing required vars should throw descriptive errors
- Optional vars should have documented defaults
- Validation should happen before the app starts serving

## Files

- `src/env-validator.ts` - Buggy env validator
- `test/env-validator.test.ts` - Tests that expose the bug
- `solution/env-validator.ts` - Fixed implementation

## Bun APIs Used

- `process.env` - Environment variable access
- `Bun.env` - Bun's environment variable access
