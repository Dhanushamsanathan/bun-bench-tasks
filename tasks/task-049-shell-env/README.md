# Task 049: Shell Environment

## Problem Description

This task involves running shell commands that depend on environment variables. The current implementation **fails to pass environment variables** to shell commands, causing them to use default or undefined values.

## The Bug

In `src/envrunner.ts`, environment variables are not properly passed to shell commands:

```typescript
// BUG: Environment variables from Bun.env aren't passed to shell
const result = await Bun.$`echo $MY_VAR`.text(); // MY_VAR undefined in subshell
```

The shell subprocess doesn't automatically inherit custom environment variables set in the parent process.

## Expected Behavior

- Custom environment variables should be available in shell commands
- Variables set via `Bun.env` should be accessible
- Commands should be able to use the `.env()` method to set variables

## Actual Behavior

- Shell commands don't see environment variables set in parent
- `$VAR` expansions return empty strings
- Commands fail because required config is missing

## Files

- `src/envrunner.ts` - Buggy implementation without proper env passing
- `test/envrunner.test.ts` - Tests that expose the environment issues
- `solution/envrunner.ts` - Fixed implementation with `.env()` method

## How to Test

```bash
cd task-049-shell-env
bun test
```

## Hints

1. Use `.env({ VAR: "value" })` to pass environment variables
2. Access parent environment with `Bun.env`
3. Combine parent env with custom vars: `.env({ ...Bun.env, CUSTOM: "value" })`
4. Consider using template interpolation for simple cases
