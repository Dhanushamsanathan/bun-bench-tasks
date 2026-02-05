# Task 032: Build External Dependencies

## Problem Description

A build script using `Bun.build()` is bundling a library that depends on external packages (like `lodash`). The dependencies should be marked as external to prevent them from being bundled, but they are being included in the output, causing bloated bundle sizes.

## Bug

The `external` option is not specified in the build configuration, causing all dependencies to be bundled into the output file instead of being kept as external imports.

## Expected Behavior

External dependencies like `lodash` should remain as import statements in the bundled output, not be included in the bundle.

## Actual Behavior

All dependencies are bundled into the output file, significantly increasing bundle size and potentially causing issues with duplicate dependencies.

## Files

- `src/build.ts` - Buggy build script missing external configuration
- `src/index.ts` - Library code that imports external packages
- `test/build.test.ts` - Tests that verify external dependencies are not bundled
- `solution/build.ts` - Fixed build script with proper external configuration

## Bun.build() API Reference

```typescript
Bun.build({
  entrypoints: ['./src/index.ts'],
  outdir: './dist',
  external: ['lodash', 'axios'], // Dependencies to exclude from bundle
});
```
