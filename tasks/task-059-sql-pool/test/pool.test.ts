import { describe, test, expect, beforeEach } from "bun:test";
import {
  sql,
  addUser,
  getUserWithSession,
  createUserWithSession,
  batchGetUsers,
  getActiveConnectionCount,
  resetDatabase,
} from "../src/pool";

describe("SQL Connection Pool Management", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  test("should not exhaust connection pool with repeated getUserWithSession calls", async () => {
    // Setup
    const userId = await addUser("Test User", "test@example.com");

    // BUG: Each call leaks a connection
    // After MAX_CONNECTIONS calls, pool should be exhausted
    for (let i = 0; i < 10; i++) {
      await getUserWithSession(userId);
    }

    // Should not have any active connections if properly released
    // This test FAILS because connections are never released
    expect(await getActiveConnectionCount()).toBe(0);
  });

  test("should handle concurrent getUserWithSession calls", async () => {
    const userId = await addUser("Test User", "test@example.com");

    // Run multiple concurrent calls
    // BUG: All these reserve connections but never release them
    const promises = Array(10).fill(null).map(() => getUserWithSession(userId));

    // This should not throw if connections are properly managed
    // BUG: This will throw "Connection pool exhausted" after MAX_CONNECTIONS
    await expect(async () => {
      await Promise.all(promises);
    }).not.toThrow();
  });

  test("should release connection on error in createUserWithSession", async () => {
    // First user succeeds
    await createUserWithSession("User1", "user1@test.com", "token1");

    // Second user with duplicate email should fail
    await expect(async () => {
      await createUserWithSession("User2", "user1@test.com", "token2");
    }).toThrow();

    // Connection should be released even on error
    // BUG: This fails because connection is leaked on error
    expect(await getActiveConnectionCount()).toBe(0);
  });

  test("should not leak connections in batchGetUsers", async () => {
    // Setup multiple users
    const userIds: number[] = [];
    for (let i = 0; i < 8; i++) {
      const id = await addUser(`User${i}`, `user${i}@test.com`);
      userIds.push(id);
    }

    // BUG: This will exhaust the pool after MAX_CONNECTIONS users
    await expect(async () => {
      await batchGetUsers(userIds);
    }).not.toThrow();

    // All connections should be released
    expect(await getActiveConnectionCount()).toBe(0);
  });

  test("should handle mixed operations without exhausting pool", async () => {
    for (let i = 0; i < 20; i++) {
      await addUser(`User${i}`, `user${i}@test.com`);
      await getUserWithSession(1);
    }

    // Pool should be healthy after many operations
    // BUG: Pool is exhausted due to connection leaks
    expect(await getActiveConnectionCount()).toBe(0);
  });

  test("should use IN clause for batch queries instead of multiple connections", async () => {
    // Setup users
    const userIds: number[] = [];
    for (let i = 0; i < 5; i++) {
      const id = await addUser(`User${i}`, `user${i}@test.com`);
      userIds.push(id);
    }

    // This should use a single query with IN clause
    // Not multiple reserved connections
    const users = await batchGetUsers(userIds);

    expect(users.length).toBe(5);
    expect(await getActiveConnectionCount()).toBe(0);
  });

  test("should recover from temporary connection exhaustion", async () => {
    const userId = await addUser("Test", "test@test.com");

    // Exhaust pool (if buggy)
    try {
      for (let i = 0; i < 10; i++) {
        await getUserWithSession(userId);
      }
    } catch {
      // Pool might be exhausted
    }

    // Reset should clean up
    await resetDatabase();
    const newUserId = await addUser("New", "new@test.com");

    // Should be able to use connections again
    await expect(async () => {
      await getUserWithSession(newUserId);
    }).not.toThrow();
  });

  test("should use pooled connections efficiently for transactions", async () => {
    // Transactions should use the same connection throughout
    // and release it when done
    for (let i = 0; i < 5; i++) {
      await createUserWithSession(`User${i}`, `user${i}@test.com`, `token${i}`);
    }

    // All transaction connections should be released
    expect(await getActiveConnectionCount()).toBe(0);

    // Verify data integrity
    const [{ count }] = await sql`SELECT COUNT(*) as count FROM users`;
    expect(count).toBe(5);
  });
});
