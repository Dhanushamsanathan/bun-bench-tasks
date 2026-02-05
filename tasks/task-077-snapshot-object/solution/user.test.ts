import { test, expect, describe } from "bun:test";
import { createUser, createUserProfile, createAuditLog } from "../src/user";

describe("createUser", () => {
  // FIXED: Use property matchers for dynamic values
  test("creates user with correct structure", () => {
    const user = createUser({
      name: "John Doe",
      email: "john@example.com",
      role: "admin",
    });

    // FIXED: Property matchers handle dynamic fields
    // The snapshot will verify structure and static values
    // while matchers validate dynamic fields by type/pattern
    expect(user).toMatchSnapshot({
      id: expect.any(String),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  // FIXED: Same pattern for default role test
  test("creates user with default role", () => {
    const user = createUser({
      name: "Jane Smith",
      email: "jane@example.com",
    });

    // FIXED: All dynamic fields use matchers
    expect(user).toMatchSnapshot({
      id: expect.any(String),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });

  // Additional: Verify UUID format with regex matcher
  test("generates valid UUID for id", () => {
    const user = createUser({
      name: "UUID Test",
      email: "uuid@example.com",
    });

    // Verify UUID v4 format
    expect(user).toMatchSnapshot({
      id: expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      ),
      createdAt: expect.any(Date),
      updatedAt: expect.any(Date),
    });
  });
});

describe("createUserProfile", () => {
  // FIXED: Handle string representation of dynamic values
  test("creates profile summary", () => {
    const user = createUser({
      name: "Test User",
      email: "test@example.com",
    });

    const profile = createUserProfile(user);

    // FIXED: memberSince is an ISO string, userId is a UUID string
    expect(profile).toMatchSnapshot({
      memberSince: expect.any(String),
      userId: expect.any(String),
    });
  });

  // Additional: Verify ISO date format
  test("formats memberSince as ISO string", () => {
    const user = createUser({
      name: "Date Format Test",
      email: "date@example.com",
    });

    const profile = createUserProfile(user);

    // Verify ISO 8601 format
    expect(profile).toMatchSnapshot({
      memberSince: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      userId: expect.any(String),
    });
  });
});

describe("createAuditLog", () => {
  // FIXED: All dynamic fields use appropriate matchers
  test("creates audit log entry", () => {
    const log = createAuditLog("user-123", "LOGIN", {
      ip: "192.168.1.1",
      userAgent: "Mozilla/5.0",
    });

    // FIXED: Matchers for all dynamic fields
    expect(log).toMatchSnapshot({
      id: expect.any(String),
      timestamp: expect.any(Date),
      hash: expect.any(String),
    });
  });

  // FIXED: Consistent pattern for different actions
  test("creates audit log for logout action", () => {
    const log = createAuditLog("user-456", "LOGOUT", {
      reason: "user_initiated",
    });

    expect(log).toMatchSnapshot({
      id: expect.any(String),
      timestamp: expect.any(Date),
      hash: expect.any(String),
    });
  });

  // Additional: Verify hash format
  test("generates hash with timestamp prefix", () => {
    const log = createAuditLog("user-789", "UPDATE", {
      field: "email",
    });

    // Hash format: timestamp-randomstring
    expect(log).toMatchSnapshot({
      id: expect.any(String),
      timestamp: expect.any(Date),
      hash: expect.stringMatching(/^\d+-[a-z0-9]+$/),
    });
  });
});
