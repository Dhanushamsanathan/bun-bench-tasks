// FIXED: Redis key expiration now uses correct time units and proper awaits
// Keys expire when expected with accurate TTL values

const redis = new Bun.RedisClient();

export async function setWithTTL(
  key: string,
  value: string,
  ttlMillis: number
): Promise<void> {
  await redis.set(key, value);
  // FIXED: Convert milliseconds to seconds for EXPIRE command
  const ttlSeconds = Math.ceil(ttlMillis / 1000);
  await redis.expire(key, ttlSeconds); // FIXED: Added await
}

export async function setWithTTLSeconds(
  key: string,
  value: string,
  ttlSeconds: number
): Promise<void> {
  // FIXED: Properly await both operations
  await redis.set(key, value);
  await redis.expire(key, ttlSeconds);
}

export async function setWithTTLMillis(
  key: string,
  value: string,
  ttlMillis: number
): Promise<void> {
  await redis.set(key, value);
  // FIXED: Use PEXPIRE for millisecond precision instead of EXPIRE
  await redis.pexpire(key, ttlMillis);
}

export async function setExWithTTL(
  key: string,
  value: string,
  ttlSeconds: number
): Promise<void> {
  // FIXED: Use SET with EX option correctly
  await redis.set(key, value, "EX", ttlSeconds);
}

export async function getTTL(key: string): Promise<number> {
  // Returns TTL in seconds, -1 if no expire, -2 if key doesn't exist
  return await redis.ttl(key);
}

export async function getTTLMillis(key: string): Promise<number> {
  // Returns TTL in milliseconds
  return await redis.pttl(key);
}

export async function extendTTL(key: string, additionalSeconds: number): Promise<boolean> {
  const currentTTL = await redis.ttl(key);
  if (currentTTL < 0) {
    return false;
  }
  // FIXED: Added await
  await redis.expire(key, currentTTL + additionalSeconds);
  return true;
}

export async function setIfNotExistsWithTTL(
  key: string,
  value: string,
  ttlSeconds: number
): Promise<boolean> {
  // FIXED: Use SET with NX and EX options in a single atomic operation
  // This prevents race conditions where the key is set but TTL fails
  const result = await redis.set(key, value, "EX", ttlSeconds, "NX");
  return result === "OK";
}

// Example usage
async function main() {
  // Set a key that should expire in 5 seconds (5000 milliseconds)
  await setWithTTL("test:expire", "value", 5000);

  // Check the TTL - should be around 5 seconds
  const ttl = await getTTL("test:expire");
  console.log("TTL after setWithTTL(5000ms):", ttl, "seconds");
  // FIXED: This now correctly shows ~5 seconds

  // Set with seconds
  await setWithTTLSeconds("test:seconds", "value", 10);
  const ttl2 = await getTTL("test:seconds");
  console.log("TTL after setWithTTLSeconds(10s):", ttl2, "seconds");

  // Set with millisecond precision
  await setWithTTLMillis("test:millis", "value", 2500);
  const pttl = await getTTLMillis("test:millis");
  console.log("PTTL after setWithTTLMillis(2500ms):", pttl, "milliseconds");

  // Atomic set if not exists with TTL
  const created = await setIfNotExistsWithTTL("test:setnx", "value", 30);
  console.log("Created new key:", created);

  await redis.quit();
}

export { redis };
export default main;
