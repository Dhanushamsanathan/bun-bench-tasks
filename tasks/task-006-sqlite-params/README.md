# Task 006: Prepared Statement Parameters

## Problem Description

The database module uses string interpolation instead of parameterized queries when building SQL statements. This creates SQL injection vulnerabilities and can cause unexpected behavior with special characters in user input.

## Bug Location

- `src/db.ts`: Uses template literals to embed user input directly in SQL strings

## Expected Behavior

- Queries should use parameterized statements (`?` placeholders or `$name` named parameters)
- Special characters in user input should be handled safely
- SQL injection attacks should be prevented

## Actual Behavior

- User input is interpolated directly into SQL strings
- Single quotes in input break queries
- Malicious input can manipulate query logic (SQL injection)

## How to Test

```bash
bun test
```

## Files

- `src/db.ts` - Buggy database implementation
- `test/db.test.ts` - Tests that demonstrate the vulnerability
- `solution/db.ts` - Fixed implementation using parameterized queries
