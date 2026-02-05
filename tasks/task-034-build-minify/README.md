# Task 034: Build Minify with Sourcemaps

## Problem Description

A build script using `Bun.build()` is configured to minify the output for production. However, sourcemaps are not being generated, making it impossible to debug the minified code in production.

## Bug

The `minify` option is enabled but the `sourcemap` option is not configured. This results in minified code without corresponding sourcemaps for debugging.

## Expected Behavior

When minification is enabled, sourcemaps should also be generated (either inline or as separate files) to allow debugging of production code.

## Actual Behavior

The build produces minified JavaScript without sourcemaps, making stack traces and debugging nearly impossible.

## Files

- `src/build.ts` - Buggy build script with minify but no sourcemaps
- `src/utils.ts` - Utility code to bundle
- `test/build.test.ts` - Tests that verify minification and sourcemap generation
- `solution/build.ts` - Fixed build script with sourcemaps enabled

## Bun.build() API Reference

```typescript
Bun.build({
  entrypoints: ['./src/utils.ts'],
  outdir: './dist',
  minify: true,
  sourcemap: 'external', // or 'inline' or 'linked'
});
```
