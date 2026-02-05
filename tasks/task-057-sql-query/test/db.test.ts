import { describe, test, expect, beforeEach } from "bun:test";
import {
  sql,
  addUser,
  findUser,
  findUserByName,
  searchUsers,
  deleteUser,
  resetDatabase,
} from "../src/db";

describe("SQL Parameterized Queries", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  test("should handle names with apostrophes", async () => {
    // BUG: This will fail because the apostrophe breaks the SQL syntax
    // Error: near "Brien": syntax error
    await expect(async () => {
      await addUser("O'Brien", "obrien@test.com");
    }).not.toThrow();

    const user = await findUserByName("O'Brien");
    expect(user).toBeDefined();
    expect(user?.name).toBe("O'Brien");
  });

  test("should handle emails with special characters", async () => {
    await addUser("Test User", "test+filter@example.com");

    // This should work but the query building is fragile
    const user = await findUser("test+filter@example.com");
    expect(user).toBeDefined();
  });

  test("should prevent SQL injection in findUser", async () => {
    await addUser("Admin", "admin@test.com");
    await addUser("Regular", "user@test.com");

    // SQL injection attempt - this should NOT return any user
    // But with string concatenation, it becomes:
    // SELECT * FROM users WHERE email = '' OR '1'='1'
    // which returns the first user (SQL injection success)
    const injectionAttempt = "' OR '1'='1";
    const result = await findUser(injectionAttempt);

    // This test FAILS - the injection works and returns a user
    expect(result).toBeUndefined();
  });

  test("should prevent SQL injection in deleteUser", async () => {
    await addUser("Alice", "alice@test.com");
    await addUser("Bob", "bob@test.com");
    await addUser("Charlie", "charlie@test.com");

    // Attacker tries to delete all users with injection
    // DELETE FROM users WHERE email = '' OR '1'='1'
    const maliciousInput = "' OR '1'='1";
    await deleteUser(maliciousInput);

    // This test FAILS - all users get deleted instead of none
    const alice = await findUser("alice@test.com");
    const bob = await findUser("bob@test.com");
    const charlie = await findUser("charlie@test.com");

    expect(alice).toBeDefined();
    expect(bob).toBeDefined();
    expect(charlie).toBeDefined();
  });

  test("should handle search with percent signs safely", async () => {
    await addUser("Test User", "test@example.com");
    await addUser("Another User", "another@example.com");

    // BUG: Percent signs in search break the LIKE pattern
    // This could match unintended records or cause errors
    const results = await searchUsers("100%");

    // Should find nothing, not accidentally match everything
    expect(results.length).toBe(0);
  });

  test("should handle names with double quotes", async () => {
    // Names with quotes should be stored and retrieved correctly
    await expect(async () => {
      await addUser('John "Johnny" Doe', "john@test.com");
    }).not.toThrow();

    const user = await findUser("john@test.com");
    expect(user?.name).toBe('John "Johnny" Doe');
  });

  test("should handle backslashes in input", async () => {
    // Backslashes can cause escaping issues
    await expect(async () => {
      await addUser("Path\\User", "path@test.com");
    }).not.toThrow();

    const user = await findUserByName("Path\\User");
    expect(user).toBeDefined();
    expect(user?.name).toBe("Path\\User");
  });

  test("should handle semicolons without executing additional statements", async () => {
    await addUser("Victim", "victim@test.com");

    // Attempt to inject additional SQL statement
    // With string concatenation this becomes:
    // SELECT * FROM users WHERE email = ''; DROP TABLE users; --'
    const injection = "'; DROP TABLE users; --";

    // This might throw or succeed depending on configuration
    // but should NEVER actually drop the table
    try {
      await findUser(injection);
    } catch {
      // Expected to potentially throw
    }

    // Table should still exist and have data
    // This test FAILS if the injection succeeds
    await expect(async () => {
      const user = await findUser("victim@test.com");
      expect(user).toBeDefined();
    }).not.toThrow();
  });

  test("should handle UNION-based injection attempts", async () => {
    await addUser("Test", "test@example.com");

    // UNION injection attempt to extract data
    // With vulnerable code: SELECT * FROM users WHERE email = '' UNION SELECT 1,2,3 --'
    const injection = "' UNION SELECT 1,'hacked','data' --";
    const result = await findUser(injection);

    // Should return nothing, not injected data
    expect(result).toBeUndefined();
  });
});
