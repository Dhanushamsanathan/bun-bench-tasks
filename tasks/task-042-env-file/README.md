# Task 042: Env File Loading

## Problem Description

An application configuration module ignores `.env` files and uses hardcoded fallback values instead. This means developers cannot customize settings through `.env` files as expected, and the application always uses the same hardcoded configuration.

## Bug

The code uses hardcoded configuration values instead of loading them from `.env` files. It doesn't utilize Bun's automatic `.env` file loading or manually parse the `.env` file.

## Expected Behavior

- Configuration should be loaded from `.env` file when present
- Hardcoded values should only be used as fallbacks
- Different `.env` files for different environments (`.env.local`, `.env.development`, etc.)

## Files

- `src/env-loader.ts` - Buggy env file loader
- `test/env-loader.test.ts` - Tests that expose the bug
- `solution/env-loader.ts` - Fixed implementation

## Bun APIs Used

- `Bun.file()` - File access
- `Bun.env` - Environment variable access
- `.env` file parsing
