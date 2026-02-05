# Task 055: Redis Pub/Sub Memory Leak Bug

## Problem Description

The Redis pub/sub implementation doesn't properly unsubscribe from channels, causing memory leaks and zombie subscriptions that continue to receive messages even after the handler should be removed.

## Bug Details

The implementation has several issues:

1. Subscriptions are tracked in a Map but never removed when unsubscribing
2. The unsubscribe function doesn't await the Redis unsubscribe command
3. Multiple subscriptions to the same channel create duplicate handlers
4. The subscriber connection is never properly closed on cleanup

For example:
- Calling `unsubscribe()` removes from the Map but doesn't actually unsubscribe from Redis
- Subscribing multiple times to the same channel adds duplicate callbacks
- Messages continue to be processed after "unsubscribing"

## Files

- `src/pubsub.ts` - Buggy implementation with memory leak issues
- `test/pubsub.test.ts` - Tests that verify proper subscription cleanup (will fail)
- `solution/pubsub.ts` - Fixed implementation with proper cleanup

## Expected Behavior

- `subscribe()` should track subscriptions and not create duplicates
- `unsubscribe()` should properly remove the subscription from Redis
- After unsubscribing, no more messages should be received
- `cleanup()` should close all connections and clear all subscriptions

## How to Run

```bash
# Run the failing test
bun test

# Run the example
bun run src/pubsub.ts
```

## Prerequisites

Requires a running Redis server on `localhost:6379`.
