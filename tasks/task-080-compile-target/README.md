# Task 080: Compile Cross-Platform Target

## Problem Description

A build script using `bun build --compile` needs to create executables for different target platforms (Linux, macOS, Windows). However, the target platform is not specified correctly, causing builds to fail or produce executables for the wrong platform.

## Bug

The build script attempts to cross-compile for different targets but uses incorrect target identifiers. The `--target` flag requires specific format strings like `bun-linux-x64`, `bun-darwin-arm64`, etc., but the script uses invalid or incomplete target names.

## Expected Behavior

The build should successfully create platform-specific executables when the correct target platform identifier is provided. The script should validate target names and handle cross-compilation properly.

## Actual Behavior

The build fails with invalid target errors, or produces executables for the current platform instead of the specified target because the target format is incorrect.

## Files

- `src/build.ts` - Buggy build script with incorrect target specification
- `src/app.ts` - Simple application to compile
- `test/compile.test.ts` - Tests that verify cross-compilation targets
- `solution/build.ts` - Fixed build script with correct target format

## Valid Target Identifiers

Bun supports the following target identifiers for `--target`:

- `bun-linux-x64` - Linux x86_64
- `bun-linux-x64-baseline` - Linux x86_64 (older CPUs)
- `bun-linux-arm64` - Linux ARM64
- `bun-darwin-x64` - macOS Intel
- `bun-darwin-arm64` - macOS Apple Silicon
- `bun-windows-x64` - Windows x86_64
- `bun-windows-x64-baseline` - Windows x86_64 (older CPUs)

## CLI Usage

```bash
# Build for specific target
bun build --compile --target=bun-linux-x64 --outfile ./dist/myapp-linux ./src/app.ts

# Build for macOS ARM64
bun build --compile --target=bun-darwin-arm64 --outfile ./dist/myapp-macos ./src/app.ts

# Build for Windows
bun build --compile --target=bun-windows-x64 --outfile ./dist/myapp.exe ./src/app.ts
```

## Bun.build() API Reference

```typescript
// Note: Cross-compilation requires CLI, Bun.build() compiles for current platform
// Use Bun.spawn() to invoke CLI for cross-platform builds
const proc = Bun.spawn([
  "bun", "build", "--compile",
  "--target=bun-linux-x64",
  "--outfile", "./dist/myapp",
  "./src/app.ts"
]);
```
