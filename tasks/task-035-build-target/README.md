# Task 035: Build Target

## Problem Description

A build script using `Bun.build()` is bundling code that uses Bun-specific APIs. However, the target is incorrectly set to "node" instead of "bun", causing the bundled code to fail when it tries to use Bun-specific features.

## Bug

The `target` option is set to "node" instead of "bun". This causes the bundler to not include Bun-specific APIs and runtime features, resulting in errors when the bundled code is executed.

## Expected Behavior

When bundling code that uses Bun APIs (like `Bun.file()`, `Bun.serve()`, etc.), the target should be set to "bun" to ensure these APIs are available.

## Actual Behavior

The build target is "node", which strips out or doesn't properly handle Bun-specific APIs, causing runtime errors.

## Files

- `src/build.ts` - Buggy build script with wrong target
- `src/server.ts` - Server code using Bun-specific APIs
- `test/build.test.ts` - Tests that verify Bun APIs are preserved in bundle
- `solution/build.ts` - Fixed build script with correct target

## Bun.build() API Reference

```typescript
Bun.build({
  entrypoints: ['./src/server.ts'],
  outdir: './dist',
  target: 'bun', // Use 'bun' for Bun-specific code, 'node' for Node.js, 'browser' for browsers
});
```
