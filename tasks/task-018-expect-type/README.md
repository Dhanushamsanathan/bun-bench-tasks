# Task 018: Expect Assertion

## Problem Description

The test file uses incorrect expect matchers or comparison operators that cause tests to pass when they should fail. Common mistakes include using `==` instead of `.toBe()`, wrong matchers for different data types, and type coercion issues.

## Bug Location

File: `test/validators.test.ts`

Multiple tests use incorrect matchers:
- Using `==` comparison instead of proper matchers
- Using `.toBe()` for object/array comparison (reference equality)
- Using `.toEqual()` when `.toStrictEqual()` is needed
- Missing type checking in assertions

## Expected Behavior

Tests should correctly validate the exact values and types returned by functions.

## Actual Behavior

- Tests pass due to type coercion (`"5" == 5` is true)
- Object comparisons fail silently with `.toBe()` (different references)
- Undefined properties are ignored with `.toEqual()`
- Type mismatches go undetected

## Files

- `src/validators.ts` - Validation functions to test
- `test/validators.test.ts` - Buggy tests with wrong matchers
- `solution/validators.test.ts` - Fixed tests with correct matchers

## Key Concepts

- `.toBe()` uses `Object.is()` for strict equality (primitives and same references)
- `.toEqual()` does deep equality but ignores undefined
- `.toStrictEqual()` checks for undefined properties and array holes
- Never use `==` in expect - use proper matchers
- `.toBeNull()`, `.toBeUndefined()`, `.toBeTruthy()` for specific checks
