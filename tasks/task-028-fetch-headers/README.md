# Task 028: Fetch Headers

## Problem Description

The `AuthenticatedClient` is supposed to add an Authorization header with a Bearer token, but the token is not formatted correctly. The "Bearer " prefix is missing, causing authentication to fail on the server.

## Bug

When setting the Authorization header:
- The token is passed directly without the "Bearer " prefix
- Server expects: `Authorization: Bearer abc123`
- Client sends: `Authorization: abc123`
- This causes 401 Unauthorized responses

## Expected Behavior

- Authorization header should include "Bearer " prefix
- Format should be: `Bearer <token>`
- Server should accept the properly formatted token
- API calls should authenticate successfully

## Files

- `src/auth-client.ts` - Buggy client with malformed Authorization header
- `test/auth-client.test.ts` - Tests that demonstrate the authentication failure
- `solution/auth-client.ts` - Fixed implementation with proper Bearer token format
