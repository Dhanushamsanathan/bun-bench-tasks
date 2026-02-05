import { expect, test, describe } from "bun:test";
import { hashPassword, verifyPassword, registerUser, loginUser } from "../src/verify";

describe("Hash Comparison", () => {
  test("verifyPassword should return true for correct password", async () => {
    const password = "correctPassword123";
    const hash = await hashPassword(password);

    // This test FAILS because === comparison with rehashed password
    // never matches due to different salts in bcrypt
    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);
  });

  test("verifyPassword should return false for incorrect password", async () => {
    const password = "correctPassword123";
    const wrongPassword = "wrongPassword456";
    const hash = await hashPassword(password);

    const isValid = await verifyPassword(wrongPassword, hash);
    expect(isValid).toBe(false);
  });

  test("login should succeed with correct credentials", async () => {
    const username = "testuser1";
    const password = "userPassword123";

    await registerUser(username, password);

    // This test FAILS because verifyPassword uses === comparison
    const loginSuccess = await loginUser(username, password);
    expect(loginSuccess).toBe(true);
  });

  test("login should fail with incorrect password", async () => {
    const username = "testuser2";
    const password = "userPassword123";
    const wrongPassword = "hackerPassword";

    await registerUser(username, password);

    const loginSuccess = await loginUser(username, wrongPassword);
    expect(loginSuccess).toBe(false);
  });

  test("login should fail for non-existent user", async () => {
    const loginSuccess = await loginUser("nonexistent", "anyPassword");
    expect(loginSuccess).toBe(false);
  });

  test("same password verified multiple times should always succeed", async () => {
    const password = "consistentPassword";
    const hash = await hashPassword(password);

    // Verify multiple times - all should succeed
    // This test FAILS because each verification rehashes with new salt
    const results = await Promise.all([
      verifyPassword(password, hash),
      verifyPassword(password, hash),
      verifyPassword(password, hash),
    ]);

    expect(results.every(r => r === true)).toBe(true);
  });
});
