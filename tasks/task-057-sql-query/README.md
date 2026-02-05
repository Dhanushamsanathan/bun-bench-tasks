# Task 057: SQL Query Parameterization

## Problem Description

The database module uses string concatenation to build SQL queries instead of using Bun.sql's built-in tagged template literal parameterization. This creates SQL injection vulnerabilities when user input is directly embedded in query strings.

## Bug Location

- `src/db.ts`: Uses string concatenation/interpolation instead of parameterized queries via tagged template literals

## Expected Behavior

- Queries should use Bun.sql tagged template literals which automatically escape values
- Special characters in user input should be handled safely
- SQL injection attacks should be prevented
- The parameterized values should be passed through the template literal syntax

## Actual Behavior

- User input is concatenated directly into SQL strings using `sql.unsafe()`
- Single quotes and special characters in input can break queries
- Malicious input can manipulate query logic (SQL injection)

## How to Test

```bash
bun test
```

## Files

- `src/db.ts` - Buggy database implementation using string concatenation
- `test/db.test.ts` - Tests that demonstrate the SQL injection vulnerability
- `solution/db.ts` - Fixed implementation using Bun.sql parameterized queries

## Bun.sql Reference

Bun.sql uses tagged template literals for automatic parameterization:

```ts
import { sql } from "bun";

// CORRECT: Values are automatically escaped
const users = await sql`SELECT * FROM users WHERE email = ${email}`;

// WRONG: Vulnerable to SQL injection
const users = await sql.unsafe(`SELECT * FROM users WHERE email = '${email}'`);
```
