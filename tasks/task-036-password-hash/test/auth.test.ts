import { expect, test, describe } from "bun:test";
import { hashPassword, verifyPassword } from "../src/auth";

describe("Password Hashing", () => {
  test("hash should use bcrypt or argon2 format", async () => {
    const password = "testPassword123";
    const hash = await hashPassword(password);

    // Bcrypt hashes start with $2a$, $2b$, or $2y$
    // Argon2 hashes start with $argon2
    const isBcrypt = hash.startsWith("$2a$") || hash.startsWith("$2b$") || hash.startsWith("$2y$");
    const isArgon2 = hash.startsWith("$argon2");

    // This test FAILS because MD5 produces a 32-char hex string, not bcrypt/argon2 format
    expect(isBcrypt || isArgon2).toBe(true);
  });

  test("same password should produce different hashes (salted)", async () => {
    const password = "testPassword123";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    // This test FAILS because MD5 always produces the same hash for same input
    expect(hash1).not.toBe(hash2);
  });

  test("hash should be verifiable with Bun.password.verify", async () => {
    const password = "testPassword123";
    const hash = await hashPassword(password);

    // This test FAILS because MD5 hash cannot be verified with Bun.password.verify
    const isValid = await Bun.password.verify(password, hash);
    expect(isValid).toBe(true);
  });

  test("verification should reject wrong password", async () => {
    const password = "correctPassword";
    const wrongPassword = "wrongPassword";
    const hash = await hashPassword(password);

    const isValid = await verifyPassword(wrongPassword, hash);
    expect(isValid).toBe(false);
  });

  test("hash length should indicate secure algorithm", async () => {
    const password = "testPassword123";
    const hash = await hashPassword(password);

    // Bcrypt hashes are 60 characters, Argon2 are typically 95+ characters
    // MD5 hashes are only 32 characters
    // This test FAILS because MD5 produces 32-char output
    expect(hash.length).toBeGreaterThan(50);
  });
});
