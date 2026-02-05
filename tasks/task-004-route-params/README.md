# Task 004: Route Parameters Extraction Bug

## Problem Description

The HTTP server incorrectly extracts URL path parameters due to an off-by-one error when splitting the pathname.

## Bug Details

The server attempts to extract route parameters by splitting the URL pathname on `/` and accessing array elements. However, there's an off-by-one error because `pathname.split("/")` produces an empty string as the first element (before the leading `/`).

For example, `/api/users/123`:
- `pathname.split("/")` returns `["", "api", "users", "123"]`
- The buggy code accesses index 2 expecting the ID, but gets "users" instead of "123"

This causes:
- Wrong parameter values extracted from URLs
- 404 errors or incorrect data returned
- Database lookups with wrong IDs

## Files

- `src/server.ts` - Buggy implementation with off-by-one error
- `test/server.test.ts` - Test that verifies correct parameter extraction (will fail)
- `solution/server.ts` - Fixed implementation with correct array indexing

## Expected Behavior

URL parameters should be correctly extracted: `/api/users/123` should extract `123` as the user ID.

## How to Run

```bash
# Run the failing test
bun test

# Run the server
bun run src/server.ts
```
