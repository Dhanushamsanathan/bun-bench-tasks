// BUG: Redis key expiration not set correctly (wrong time unit or missing await)
// Keys don't expire when expected or have incorrect TTL values

const redis = new Bun.RedisClient();

export async function setWithTTL(
  key: string,
  value: string,
  ttlMillis: number
): Promise<void> {
  await redis.set(key, value);
  // BUG: EXPIRE expects seconds, but we're passing milliseconds
  // A 5000ms (5 second) TTL becomes 5000 seconds (83 minutes!)
  redis.expire(key, ttlMillis); // BUG: Also missing await!
}

export async function setWithTTLSeconds(
  key: string,
  value: string,
  ttlSeconds: number
): Promise<void> {
  // BUG: Missing await on set operation
  redis.set(key, value);
  // BUG: Missing await on expire operation - race condition!
  redis.expire(key, ttlSeconds);
}

export async function setWithTTLMillis(
  key: string,
  value: string,
  ttlMillis: number
): Promise<void> {
  await redis.set(key, value);
  // BUG: Using EXPIRE (seconds) instead of PEXPIRE (milliseconds)
  // 500 milliseconds becomes 500 seconds (8+ minutes!)
  await redis.expire(key, ttlMillis);
}

export async function setExWithTTL(
  key: string,
  value: string,
  ttlSeconds: number
): Promise<void> {
  // BUG: Using EX option but passing the value incorrectly
  // The spread of array causes issues
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
  // BUG: Missing await
  redis.expire(key, currentTTL + additionalSeconds);
  return true;
}

export async function setIfNotExistsWithTTL(
  key: string,
  value: string,
  ttlSeconds: number
): Promise<boolean> {
  // BUG: SET NX and EX should be combined, not separate operations
  const result = await redis.setnx(key, value);
  if (result === 1) {
    // BUG: If this fails or times out, we have a key without expiration
    redis.expire(key, ttlSeconds); // Missing await!
    return true;
  }
  return false;
}

// Example usage
async function main() {
  // Set a key that should expire in 5 seconds (5000 milliseconds)
  await setWithTTL("test:expire", "value", 5000);

  // Check the TTL - should be around 5 seconds
  const ttl = await getTTL("test:expire");
  console.log("TTL after setWithTTL(5000ms):", ttl, "seconds");
  // BUG: This will show ~5000 seconds instead of ~5 seconds!

  // Set with seconds
  await setWithTTLSeconds("test:seconds", "value", 10);
  const ttl2 = await getTTL("test:seconds");
  console.log("TTL after setWithTTLSeconds(10s):", ttl2, "seconds");

  await redis.quit();
}

export { redis };
export default main;
