import { expect, test, beforeAll, afterAll, describe } from "bun:test";
import {
  setWithTTL,
  setWithTTLSeconds,
  setWithTTLMillis,
  getTTL,
  getTTLMillis,
  extendTTL,
  setIfNotExistsWithTTL,
  redis,
} from "../src/expire";

const TEST_PREFIX = "test:056:";

beforeAll(async () => {
  // Clean up any existing test keys
  const keys = await redis.keys(`${TEST_PREFIX}*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
});

afterAll(async () => {
  // Clean up test keys
  const keys = await redis.keys(`${TEST_PREFIX}*`);
  if (keys.length > 0) {
    await redis.del(...keys);
  }
  await redis.quit();
});

describe("setWithTTL (milliseconds input)", () => {
  test("should set TTL correctly when given milliseconds", async () => {
    const key = `${TEST_PREFIX}ttl-millis`;

    // Set with 5000 milliseconds = 5 seconds TTL
    await setWithTTL(key, "test-value", 5000);

    const ttl = await getTTL(key);

    // BUG: This test FAILS because TTL is ~5000 seconds instead of ~5 seconds
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(5);
  });

  test("should have key expire after TTL", async () => {
    const key = `${TEST_PREFIX}expire-millis`;

    // Set with 1000 milliseconds = 1 second TTL
    await setWithTTL(key, "test-value", 1000);

    // Key should exist immediately
    const valueBefore = await redis.get(key);
    expect(valueBefore).toBe("test-value");

    // Wait for expiration (1.5 seconds to be safe)
    await Bun.sleep(1500);

    // BUG: This test FAILS because key hasn't expired (TTL is 1000 seconds!)
    const valueAfter = await redis.get(key);
    expect(valueAfter).toBeNull();
  });
});

describe("setWithTTLSeconds", () => {
  test("should set TTL correctly when given seconds", async () => {
    const key = `${TEST_PREFIX}ttl-seconds`;

    await setWithTTLSeconds(key, "test-value", 10);

    // Need to wait a moment for non-awaited operations to complete
    await Bun.sleep(50);

    const ttl = await getTTL(key);

    // BUG: This test may FAIL due to missing awaits - TTL might not be set yet
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(10);
  });

  test("should have value set correctly", async () => {
    const key = `${TEST_PREFIX}value-seconds`;

    await setWithTTLSeconds(key, "my-value", 60);

    // BUG: Due to missing await, value might not be set yet
    const value = await redis.get(key);
    expect(value).toBe("my-value");
  });
});

describe("setWithTTLMillis (millisecond precision)", () => {
  test("should set TTL with millisecond precision", async () => {
    const key = `${TEST_PREFIX}pttl`;

    // Set with 2500 milliseconds TTL
    await setWithTTLMillis(key, "test-value", 2500);

    const pttl = await getTTLMillis(key);

    // BUG: This test FAILS because EXPIRE was used instead of PEXPIRE
    // TTL will be ~2500 seconds * 1000 = millions of milliseconds
    expect(pttl).toBeGreaterThan(0);
    expect(pttl).toBeLessThanOrEqual(2500);
  });

  test("should expire after millisecond TTL", async () => {
    const key = `${TEST_PREFIX}pexpire`;

    // Set with 500 milliseconds TTL
    await setWithTTLMillis(key, "test-value", 500);

    // Key should exist immediately
    const valueBefore = await redis.get(key);
    expect(valueBefore).toBe("test-value");

    // Wait for expiration
    await Bun.sleep(700);

    // BUG: This test FAILS because key won't expire (500 seconds TTL!)
    const valueAfter = await redis.get(key);
    expect(valueAfter).toBeNull();
  });
});

describe("extendTTL", () => {
  test("should extend existing TTL", async () => {
    const key = `${TEST_PREFIX}extend`;

    await redis.set(key, "value");
    await redis.expire(key, 5);

    const ttlBefore = await getTTL(key);
    expect(ttlBefore).toBeLessThanOrEqual(5);

    const result = await extendTTL(key, 10);
    expect(result).toBe(true);

    // Need small delay for non-awaited operation
    await Bun.sleep(50);

    const ttlAfter = await getTTL(key);

    // BUG: This may FAIL due to missing await on expire
    expect(ttlAfter).toBeGreaterThan(ttlBefore);
  });

  test("should return false for non-existent key", async () => {
    const result = await extendTTL(`${TEST_PREFIX}nonexistent`, 10);
    expect(result).toBe(false);
  });
});

describe("setIfNotExistsWithTTL", () => {
  test("should set value with TTL if key doesn't exist", async () => {
    const key = `${TEST_PREFIX}setnx-ttl`;

    const result = await setIfNotExistsWithTTL(key, "new-value", 30);
    expect(result).toBe(true);

    // Small delay for non-awaited operations
    await Bun.sleep(50);

    const value = await redis.get(key);
    expect(value).toBe("new-value");

    const ttl = await getTTL(key);
    // BUG: TTL might not be set due to missing await
    expect(ttl).toBeGreaterThan(0);
    expect(ttl).toBeLessThanOrEqual(30);
  });

  test("should not set value if key exists", async () => {
    const key = `${TEST_PREFIX}setnx-exists`;

    await redis.set(key, "original");

    const result = await setIfNotExistsWithTTL(key, "new-value", 30);
    expect(result).toBe(false);

    const value = await redis.get(key);
    expect(value).toBe("original");
  });
});
