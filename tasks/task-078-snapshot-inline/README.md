# Task 078: Inline Snapshot Update

## Problem Description

The test file contains inline snapshot tests with stale snapshot data. The source code has changed but the inline snapshots were never updated, causing tests to pass with outdated expected values that no longer match the actual behavior.

## Bug Location

File: `test/formatter.test.ts`

The inline snapshot tests contain hardcoded snapshot values that:
1. Were captured when the code had different behavior
2. Don't match the current output of the functions
3. Tests still pass because the snapshot comparison is misconfigured or the snapshots need regeneration

## Expected Behavior

Inline snapshots should reflect the current behavior of the code. When the implementation changes, running `bun test --update-snapshots` should update the inline snapshot values in the test file.

## Actual Behavior

The inline snapshots contain stale data:
1. `formatCurrency()` now includes currency symbol, but snapshot shows old format
2. `formatDate()` output format changed, but snapshot shows old format
3. `generateSlug()` handling changed, but snapshot shows old output
4. Tests may pass incorrectly or silently use wrong expected values

## Files

- `src/formatter.ts` - Formatting functions with updated implementations
- `test/formatter.test.ts` - Buggy tests with stale inline snapshots
- `solution/formatter.test.ts` - Fixed tests with updated inline snapshots

## Key Concepts

- `toMatchInlineSnapshot()` stores the expected value directly in the test file
- Inline snapshots must be updated when implementation changes
- Run `bun test --update-snapshots` to regenerate snapshots
- Empty `toMatchInlineSnapshot()` will auto-populate on first run
- Stale snapshots can hide bugs or cause false positives
- Inline snapshots are useful for small, predictable outputs
