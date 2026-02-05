# Task 068: Glob Match

## Problem Description

The glob pattern matching implementation has incorrect pattern syntax that causes it to fail matching the expected files. The code uses `new Bun.Glob()` but the patterns are malformed or use incorrect syntax.

## Bug

The `matchFiles` function doesn't correctly match files because:
1. The pattern for matching TypeScript files uses incorrect glob syntax
2. The brace expansion pattern `{a,b}.js` is not handled properly
3. Negation patterns are incorrectly formed

## Expected Behavior

- Pattern `**/*.ts` should match all TypeScript files recursively
- Pattern `{a,b}.js` should match both `a.js` and `b.js`
- Pattern `!node_modules/**` should exclude node_modules directory

## Actual Behavior

- Patterns fail to match expected files due to syntax errors
- Brace expansion doesn't work as expected
- Some files that should match are being missed

## Files

- `src/glob-match.ts` - Buggy implementation
- `test/glob-match.test.ts` - Test file (should pass after fix)
- `solution/glob-match.ts` - Fixed implementation

## Bun APIs Used

- `new Bun.Glob(pattern)` - Create a glob pattern matcher
- `glob.match(path)` - Test if a path matches the pattern
