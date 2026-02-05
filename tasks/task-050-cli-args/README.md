# Task 050: CLI Arguments

## Problem Description

This task involves a CLI tool that parses command-line arguments. The current implementation **incorrectly parses Bun.argv**, using wrong indices to access arguments.

## The Bug

In `src/cli.ts`, arguments are accessed with incorrect indices:

```typescript
// BUG: Bun.argv[0] is the bun executable, [1] is the script
// User arguments start at index 2, not 0 or 1!
const command = Bun.argv[0]; // Wrong! This is "bun", not the command
const file = Bun.argv[1];    // Wrong! This is the script path, not the file
```

## Expected Behavior

- `Bun.argv[0]` = bun executable path
- `Bun.argv[1]` = script being run
- `Bun.argv[2]` onwards = user-provided arguments
- Named arguments (--flag) should be parsed correctly

## Actual Behavior

- Arguments accessed at wrong indices
- First user argument treated as script path
- Commands and options shifted incorrectly
- Tool behaves unpredictably

## Files

- `src/cli.ts` - Buggy CLI implementation with wrong argv indices
- `test/cli.test.ts` - Tests that expose the argument parsing bugs
- `solution/cli.ts` - Fixed implementation with correct indices

## How to Test

```bash
cd task-050-cli-args
bun test
```

## Hints

1. `Bun.argv` is similar to Node.js `process.argv`
2. Use `Bun.argv.slice(2)` to get user arguments
3. Consider using a library like `commander` or `yargs` for complex CLIs
4. `process.argv` also works in Bun and has the same structure
