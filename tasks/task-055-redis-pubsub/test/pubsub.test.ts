import { expect, test, beforeEach, afterAll, describe } from "bun:test";
import {
  subscribe,
  unsubscribe,
  publish,
  cleanup,
  getSubscriptionCount,
  isSubscribed,
  getMessageCount,
  resetMessageCount,
  publisher,
  subscriber,
} from "../src/pubsub";

const TEST_CHANNEL = "test:055:channel";

beforeEach(async () => {
  resetMessageCount();
});

afterAll(async () => {
  await cleanup();
});

describe("subscribe", () => {
  test("should receive published messages", async () => {
    const messages: string[] = [];

    await subscribe(`${TEST_CHANNEL}:receive`, (message) => {
      messages.push(message);
    });

    await publish(`${TEST_CHANNEL}:receive`, "test-message");

    // Wait for message propagation
    await Bun.sleep(100);

    expect(messages).toContain("test-message");
  });

  test("should track subscription in local state", async () => {
    await subscribe(`${TEST_CHANNEL}:track`, () => {});

    expect(isSubscribed(`${TEST_CHANNEL}:track`)).toBe(true);
    expect(getSubscriptionCount()).toBeGreaterThanOrEqual(1);
  });
});

describe("unsubscribe", () => {
  test("should stop receiving messages after unsubscribe", async () => {
    const messages: string[] = [];
    const channel = `${TEST_CHANNEL}:unsub:${Date.now()}`;

    await subscribe(channel, (message) => {
      messages.push(message);
    });

    await publish(channel, "before-unsub");
    await Bun.sleep(100);

    const countBefore = messages.length;
    expect(countBefore).toBe(1);

    // Unsubscribe
    await unsubscribe(channel);
    await Bun.sleep(50);

    // Publish after unsubscribe
    await publish(channel, "after-unsub-1");
    await publish(channel, "after-unsub-2");
    await Bun.sleep(100);

    // BUG: This test FAILS because messages are still received after unsubscribe
    expect(messages.length).toBe(1);
    expect(messages).not.toContain("after-unsub-1");
    expect(messages).not.toContain("after-unsub-2");
  });

  test("should remove subscription from local state", async () => {
    const channel = `${TEST_CHANNEL}:remove:${Date.now()}`;

    await subscribe(channel, () => {});
    expect(isSubscribed(channel)).toBe(true);

    await unsubscribe(channel);

    expect(isSubscribed(channel)).toBe(false);
  });

  test("should not increment message count after unsubscribe", async () => {
    const channel = `${TEST_CHANNEL}:count:${Date.now()}`;
    resetMessageCount();

    await subscribe(channel, () => {});

    await publish(channel, "message-1");
    await Bun.sleep(100);

    const countBefore = getMessageCount();
    expect(countBefore).toBe(1);

    await unsubscribe(channel);
    await Bun.sleep(50);

    await publish(channel, "message-2");
    await publish(channel, "message-3");
    await Bun.sleep(100);

    // BUG: This test FAILS because message count keeps incrementing
    expect(getMessageCount()).toBe(1);
  });
});

describe("duplicate subscriptions", () => {
  test("should not create duplicate handlers for same channel", async () => {
    const messages: string[] = [];
    const channel = `${TEST_CHANNEL}:dup:${Date.now()}`;

    // Subscribe twice to the same channel
    await subscribe(channel, (message) => {
      messages.push(`first:${message}`);
    });

    await subscribe(channel, (message) => {
      messages.push(`second:${message}`);
    });

    await publish(channel, "test");
    await Bun.sleep(100);

    // BUG: This may fail if duplicate handlers are created
    // Should only have one message (from the second handler which replaced the first)
    // Or should have rejected the second subscription
    expect(messages.length).toBeLessThanOrEqual(1);
  });
});

describe("cleanup", () => {
  test("should unsubscribe from all channels on cleanup", async () => {
    const messages: string[] = [];
    const channel = `${TEST_CHANNEL}:cleanup:${Date.now()}`;

    await subscribe(channel, (message) => {
      messages.push(message);
    });

    await publish(channel, "before-cleanup");
    await Bun.sleep(100);

    expect(messages.length).toBe(1);

    // Note: Can't fully test cleanup without creating new connections
    // This test documents expected behavior
    expect(getSubscriptionCount()).toBeGreaterThanOrEqual(1);
  });
});
