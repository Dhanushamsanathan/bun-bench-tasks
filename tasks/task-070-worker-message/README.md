# Task 070: Worker Message Passing Bug

## Category
Bun Workers / Web Workers

## Difficulty
Medium

## Problem Description
When sending complex objects between the main thread and a Web Worker, data types are being lost during serialization. The worker receives messages but certain data types (like Date objects, Maps, Sets) are not properly preserved through the structured clone algorithm or are being incorrectly serialized.

## Buggy Behavior
- Date objects arrive as strings or ISO date strings instead of Date instances
- Nested objects lose their prototype chain
- The worker's response doesn't maintain type fidelity

## Expected Behavior
- Complex objects should be properly serialized and deserialized
- Date objects should be handled appropriately (converted and reconstructed)
- The main thread should receive properly typed responses

## Files
- `src/main.ts` - Main thread code that creates worker and sends messages
- `src/worker.ts` - Worker code that processes messages
- `test/worker-message.test.ts` - Tests for message passing
- `solution/main.ts` - Fixed main thread code
- `solution/worker.ts` - Fixed worker code

## Hints
1. The structured clone algorithm has limitations with certain types
2. Consider serializing Date objects to ISO strings and reconstructing them
3. Use a consistent message format with type information
