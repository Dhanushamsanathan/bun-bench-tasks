# Task 010: Query All vs Get

## Problem Description

The reporting module uses `.get()` when it should use `.all()` for queries that return multiple rows. This causes only the first row to be returned, making aggregate reports incomplete and statistics incorrect.

## Bug Location

- `src/reports.ts`: Uses `.get()` instead of `.all()` for multi-row queries

## Expected Behavior

- Queries that can return multiple rows should use `.all()`
- Reports should include all matching records
- Aggregations should be calculated over complete datasets

## Actual Behavior

- Only the first matching row is returned
- Reports show incomplete data
- Counts, sums, and averages are calculated on single records
- Users see only partial information

## How to Test

```bash
bun test
```

## Files

- `src/reports.ts` - Buggy implementation using .get() for multi-row queries
- `test/reports.test.ts` - Tests that demonstrate missing data
- `solution/reports.ts` - Fixed implementation using .all() correctly
