import { expect, test, beforeAll, afterAll, describe } from "bun:test";
import { getValue, setValue, getValueWithDefault, setIfNotExists, redis } from "../src/redis";

const TEST_PREFIX = "test:054:";

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

describe("getValue", () => {
  test("should return null for non-existent keys without throwing", async () => {
    // BUG: This test FAILS because getValue throws TypeError on null
    const result = await getValue(`${TEST_PREFIX}nonexistent`);
    expect(result).toBeNull();
  });

  test("should return the value for existing keys", async () => {
    const key = `${TEST_PREFIX}existing`;
    await redis.set(key, "hello");

    const result = await getValue(key);
    expect(result).toBe("HELLO");
  });
});

describe("setValue", () => {
  test("should reject undefined values", async () => {
    const key = `${TEST_PREFIX}undefined-test`;

    // BUG: This test FAILS because setValue accepts undefined and stores "undefined"
    await expect(setValue(key, undefined)).rejects.toThrow();
  });

  test("should store valid string values", async () => {
    const key = `${TEST_PREFIX}valid-value`;
    await setValue(key, "test-value");

    const result = await redis.get(key);
    expect(result).toBe("test-value");
  });

  test("should not store the string 'undefined' when passed undefined", async () => {
    const key = `${TEST_PREFIX}undefined-check`;

    try {
      await setValue(key, undefined);
    } catch {
      // Expected to throw
    }

    const result = await redis.get(key);
    // BUG: This FAILS because "undefined" string is stored
    expect(result).not.toBe("undefined");
  });
});

describe("getValueWithDefault", () => {
  test("should return default for non-existent keys", async () => {
    const result = await getValueWithDefault(`${TEST_PREFIX}missing`, "default");
    expect(result).toBe("default");
  });

  test("should return empty string when key has empty string value", async () => {
    const key = `${TEST_PREFIX}empty-string`;
    await redis.set(key, "");

    // BUG: This test FAILS because || treats "" as falsy
    const result = await getValueWithDefault(key, "default");
    expect(result).toBe("");
  });

  test("should return actual value for existing keys", async () => {
    const key = `${TEST_PREFIX}has-value`;
    await redis.set(key, "actual-value");

    const result = await getValueWithDefault(key, "default");
    expect(result).toBe("actual-value");
  });
});

describe("setIfNotExists", () => {
  test("should set value when key does not exist", async () => {
    const key = `${TEST_PREFIX}new-key`;

    const result = await setIfNotExists(key, "new-value");
    expect(result).toBe(true);

    const stored = await redis.get(key);
    expect(stored).toBe("new-value");
  });

  test("should not overwrite existing value", async () => {
    const key = `${TEST_PREFIX}existing-key`;
    await redis.set(key, "original");

    const result = await setIfNotExists(key, "new-value");
    expect(result).toBe(false);

    const stored = await redis.get(key);
    expect(stored).toBe("original");
  });

  test("should not overwrite empty string value", async () => {
    const key = `${TEST_PREFIX}empty-existing`;
    await redis.set(key, "");

    // BUG: This test FAILS because "" is falsy and gets overwritten
    const result = await setIfNotExists(key, "new-value");
    expect(result).toBe(false);

    const stored = await redis.get(key);
    expect(stored).toBe("");
  });
});
