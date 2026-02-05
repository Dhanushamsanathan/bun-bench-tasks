# Task 079: Compile with Embedded Assets

## Problem Description

A build script using `bun build --compile` is supposed to create a standalone executable with embedded static assets (like config files, templates, or data files). However, the assets are not being embedded correctly, causing the executable to fail when trying to access them at runtime.

## Bug

The build script uses `Bun.build()` with the `compile` target but doesn't properly configure asset embedding. Assets referenced via `import` with special attributes or through `Bun.file()` with relative paths are not included in the compiled executable.

## Expected Behavior

The compiled executable should have all referenced assets embedded and accessible at runtime without requiring the original files to be present on the filesystem.

## Actual Behavior

The executable builds successfully but crashes or returns undefined when trying to access embedded assets at runtime because they were not properly included during compilation.

## Files

- `src/build.ts` - Buggy build script that doesn't embed assets correctly
- `src/app.ts` - Main application that uses embedded assets
- `src/assets/config.json` - Configuration file to embed
- `src/assets/template.txt` - Template file to embed
- `test/compile.test.ts` - Tests that verify asset embedding in compiled executable
- `solution/build.ts` - Fixed build script with proper asset embedding

## Bun Compile with Assets Reference

```typescript
// To embed files, they must be imported or referenced correctly
// Method 1: Import with embed attribute
import config from "./assets/config.json" with { type: "file" };

// Method 2: Use Bun.file() with import.meta.dir for proper path resolution
const templatePath = import.meta.dir + "/assets/template.txt";
const template = Bun.file(templatePath);

// CLI compilation with asset embedding
// bun build --compile --minify --outfile myapp ./src/app.ts
```

## CLI Usage

```bash
# Build standalone executable with embedded assets
bun build --compile --outfile ./dist/myapp ./src/app.ts
```
