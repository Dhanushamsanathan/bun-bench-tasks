# Task 069: Glob Scan

## Problem Description

The glob scan implementation doesn't correctly handle symlinks and hidden files when scanning directories. The code uses `glob.scan()` or `glob.scanSync()` but the options are misconfigured.

## Bug

The `scanDirectory` function has issues with:
1. Hidden files (dotfiles) are not being included when they should be
2. Symlinks are not followed, causing files to be missed
3. The scan options are incorrectly configured
4. Async iteration is not properly handled

## Expected Behavior

- Hidden files should be included when `includeHidden: true` is passed
- Symlinks should be followed when `followSymlinks: true` is passed
- Both `scan()` (async) and `scanSync()` should work correctly
- Directory scanning should respect the configured options

## Actual Behavior

- Hidden files are always excluded regardless of options
- Symlinks are never followed
- Options passed to scan methods are ignored or incorrectly applied
- Async scanning doesn't collect all results properly

## Files

- `src/glob-scan.ts` - Buggy implementation
- `test/glob-scan.test.ts` - Test file (should pass after fix)
- `solution/glob-scan.ts` - Fixed implementation

## Bun APIs Used

- `new Bun.Glob(pattern)` - Create a glob pattern matcher
- `glob.scan(options)` - Async iterator for matching files
- `glob.scanSync(options)` - Sync iterator for matching files
