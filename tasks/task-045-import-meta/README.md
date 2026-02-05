# Task 045: Import Meta Env

## Problem Description

A module intended for browser builds incorrectly uses `process.env` instead of `import.meta.env`. In browser environments, `process.env` is not available and will cause runtime errors. The code should use `import.meta.env` which is the standard way to access environment variables in browser builds with bundlers.

## Bug

The code uses `process.env` which works in Node.js/Bun server-side but fails in browser builds. For client-side code, `import.meta.env` should be used instead, which bundlers like Vite, esbuild, and Bun's bundler replace at build time.

## Expected Behavior

- Client-side code should use `import.meta.env`
- Environment variables should be prefixed appropriately (e.g., `VITE_`, `PUBLIC_`)
- Build-time replacement should work correctly

## Files

- `src/client-config.ts` - Buggy client configuration using process.env
- `test/client-config.test.ts` - Tests that expose the bug
- `solution/client-config.ts` - Fixed implementation using import.meta.env

## Bun APIs Used

- `import.meta.env` - Build-time environment variable access
- `process.env` - Runtime environment variable access (server-side only)
