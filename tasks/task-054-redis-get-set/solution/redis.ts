// FIXED: Redis get/set properly handles null/undefined values
// Uses proper null checks and validation

const redis = new Bun.RedisClient();

export async function getValue(key: string): Promise<string | null> {
  const value = await redis.get(key);
  // FIXED: Properly check for null and return it
  if (value === null) {
    return null;
  }
  return value.toUpperCase();
}

export async function setValue(key: string, value: string | undefined): Promise<void> {
  // FIXED: Validate that value is defined and is a string
  if (value === undefined || value === null) {
    throw new Error("Cannot set undefined or null value");
  }
  await redis.set(key, value);
}

export async function getValueWithDefault(key: string, defaultValue: string): Promise<string> {
  const value = await redis.get(key);
  // FIXED: Use nullish coalescing (??) instead of logical OR (||)
  // This allows empty string "" to be returned as a valid value
  return value ?? defaultValue;
}

export async function setIfNotExists(key: string, value: string): Promise<boolean> {
  const existing = await redis.get(key);
  // FIXED: Explicit null check instead of truthy check
  // This correctly handles empty string as an existing value
  if (existing !== null) {
    return false;
  }
  await redis.set(key, value);
  return true;
}

// Example usage
async function main() {
  try {
    const value = await getValue("nonexistent-key");
    if (value === null) {
      console.log("Key does not exist");
    } else {
      console.log("Value:", value);
    }
  } catch (error) {
    console.error("Error:", error);
  }

  // This now throws an error instead of storing "undefined"
  try {
    await setValue("test-key", undefined);
  } catch (error) {
    console.log("Correctly rejected undefined:", error.message);
  }

  // Properly store a valid value
  await setValue("test-key", "valid-value");
  const stored = await redis.get("test-key");
  console.log("Stored value:", stored); // Prints: "valid-value"

  await redis.quit();
}

export { redis };
export default main;
