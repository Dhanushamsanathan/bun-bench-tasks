import { test, expect, describe } from "bun:test";
import { createUser, createUserProfile, createAuditLog } from "../src/user";

describe("createUser", () => {
  // BUG: Snapshot includes dynamic values that change on every run
  test("creates user with correct structure", () => {
    const user = createUser({
      name: "John Doe",
      email: "john@example.com",
      role: "admin",
    });

    // BUG: This will fail because id and timestamps change every run!
    // The snapshot captured specific values like:
    // - id: "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
    // - createdAt: "2024-01-15T10:30:00.000Z"
    // But each run generates new values
    expect(user).toMatchSnapshot();
  });

  // BUG: Same issue with nested dynamic values
  test("creates user with default role", () => {
    const user = createUser({
      name: "Jane Smith",
      email: "jane@example.com",
    });

    // BUG: createdAt, updatedAt, and id all change
    expect(user).toMatchSnapshot();
  });
});

describe("createUserProfile", () => {
  // BUG: Profile includes formatted timestamp that changes
  test("creates profile summary", () => {
    const user = createUser({
      name: "Test User",
      email: "test@example.com",
    });

    const profile = createUserProfile(user);

    // BUG: memberSince is the ISO string of createdAt, changes every run
    // userId is also dynamic
    expect(profile).toMatchSnapshot();
  });
});

describe("createAuditLog", () => {
  // BUG: Multiple dynamic fields make snapshot unreliable
  test("creates audit log entry", () => {
    const log = createAuditLog("user-123", "LOGIN", {
      ip: "192.168.1.1",
      userAgent: "Mozilla/5.0",
    });

    // BUG: id, timestamp, and hash all change on every run
    // This snapshot will NEVER match after initial creation
    expect(log).toMatchSnapshot();
  });

  // BUG: Even with fixed inputs, dynamic fields cause failures
  test("creates audit log for logout action", () => {
    const log = createAuditLog("user-456", "LOGOUT", {
      reason: "user_initiated",
    });

    // BUG: Same dynamic field issues
    expect(log).toMatchSnapshot();
  });
});
