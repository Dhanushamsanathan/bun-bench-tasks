// BUG: Redis get/set doesn't handle null/undefined values correctly
// This causes unexpected behavior with missing keys and empty values

const redis = new Bun.RedisClient();

export async function getValue(key: string): Promise<string> {
  // BUG: Assumes get() always returns a string, but it returns null for missing keys
  const value = await redis.get(key);
  // BUG: No null check - this will cause issues when key doesn't exist
  return value.toUpperCase(); // TypeError when value is null
}

export async function setValue(key: string, value: string | undefined): Promise<void> {
  // BUG: Doesn't validate that value is defined
  // undefined gets coerced to string "undefined"
  await redis.set(key, value);
}

export async function getValueWithDefault(key: string, defaultValue: string): Promise<string> {
  const value = await redis.get(key);
  // BUG: Using || instead of ?? means empty string "" returns default too
  return value || defaultValue;
}

export async function setIfNotExists(key: string, value: string): Promise<boolean> {
  const existing = await redis.get(key);
  // BUG: Truthy check fails for empty string - "" is falsy but is a valid existing value
  if (existing) {
    return false;
  }
  await redis.set(key, value);
  return true;
}

// Example usage
async function main() {
  try {
    // This will fail when key doesn't exist
    const value = await getValue("nonexistent-key");
    console.log("Value:", value);
  } catch (error) {
    console.error("Error:", error);
  }

  // This stores "undefined" as a string
  await setValue("test-key", undefined);
  const stored = await redis.get("test-key");
  console.log("Stored value:", stored); // Prints: "undefined"

  await redis.quit();
}

export { redis };
export default main;
