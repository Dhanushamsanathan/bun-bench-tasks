# Task 031: Build Entry Points

## Problem Description

A build script using `Bun.build()` is supposed to bundle multiple entry points (main.ts and worker.ts) into separate output files. However, the entry points are not specified correctly as an array, causing only one entry point to be processed.

## Bug

The `entrypoints` option is passed as a single string instead of an array of strings. This causes Bun.build() to only process one entry point instead of multiple.

## Expected Behavior

Both `main.ts` and `worker.ts` should be bundled into separate output files in the `dist/` directory.

## Actual Behavior

Only one entry point is processed because the entrypoints option expects an array but receives a string.

## Files

- `src/build.ts` - Buggy build script with incorrect entrypoints specification
- `src/main.ts` - Main application entry point
- `src/worker.ts` - Worker entry point
- `test/build.test.ts` - Tests that verify both entry points are bundled
- `solution/build.ts` - Fixed build script with proper array syntax

## Bun.build() API Reference

```typescript
Bun.build({
  entrypoints: ['./src/main.ts', './src/worker.ts'], // Must be an array
  outdir: './dist',
});
```
