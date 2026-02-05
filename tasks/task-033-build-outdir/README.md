# Task 033: Build Output Directory

## Problem Description

A build script using `Bun.build()` is supposed to output bundled files to a specific directory structure with versioned folders. However, the output directory path is incorrectly constructed, causing the build output to be written to the wrong location.

## Bug

The build script uses `import.meta.dir` incorrectly, resulting in the output being written to a path relative to the build script instead of the project root. Additionally, the versioned output path doesn't match what the application expects.

## Expected Behavior

The build should output files to `./dist/v1/app.js` relative to the project root, making it easy to serve versioned builds.

## Actual Behavior

The output is written to an incorrect nested path that doesn't match the expected versioned structure, causing file not found errors when trying to load the bundled application.

## Files

- `src/build.ts` - Buggy build script with incorrect outdir path construction
- `src/app.ts` - Application source code to bundle
- `test/build.test.ts` - Tests that verify output directory structure and file locations
- `solution/build.ts` - Fixed build script with proper path construction

## Bun.build() API Reference

```typescript
import { join } from "path";

// Correct path construction relative to project root
const projectRoot = join(import.meta.dir, "..");
const outDir = join(projectRoot, "dist", "v1");

Bun.build({
  entrypoints: ['./src/app.ts'],
  outdir: outDir,
});
```
