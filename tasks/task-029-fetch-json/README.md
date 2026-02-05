# Task 029: Fetch JSON Body

## Problem Description

The `postJson` function is supposed to send JSON data in a POST request, but the body is not properly serialized. Instead of sending valid JSON, it sends the string `[object Object]` because `JSON.stringify()` is not called.

## Bug

When sending a POST request with a JavaScript object:
- The body is passed directly to fetch without `JSON.stringify()`
- JavaScript converts the object to string: `[object Object]`
- Server receives invalid JSON and cannot parse it
- API requests fail or produce unexpected results

## Expected Behavior

- Objects should be serialized with `JSON.stringify()`
- Server should receive valid JSON
- Content-Type should be set to `application/json`
- Server should successfully parse the request body

## Files

- `src/json-client.ts` - Buggy client that doesn't stringify body
- `test/json-client.test.ts` - Tests that demonstrate the serialization failure
- `solution/json-client.ts` - Fixed implementation with proper JSON serialization
