import { describe, test, expect } from "bun:test";
import { createUserData, processUserData, type UserData } from "../src/main";

describe("Worker Message Passing", () => {
  test("should preserve Date objects through worker communication", async () => {
    const userData = createUserData();
    const response = await processUserData(userData);

    // The createdAt should still be a Date instance or properly reconstructed
    expect(response.data.createdAt).toBeInstanceOf(Date);
    expect(response.data.createdAt.getTime()).toBe(
      new Date("2024-01-15T10:30:00Z").getTime()
    );
  });

  test("should preserve Set objects through worker communication", async () => {
    const userData = createUserData();
    const response = await processUserData(userData);

    // The tags should still be a Set instance or properly reconstructed
    expect(response.data.tags).toBeInstanceOf(Set);
    expect(response.data.tags.has("admin")).toBe(true);
    expect(response.data.tags.has("active")).toBe(true);
    expect(response.data.tags.size).toBe(2);
  });

  test("should preserve Map objects through worker communication", async () => {
    const userData = createUserData();
    const response = await processUserData(userData);

    // The metadata should still be a Map instance or properly reconstructed
    expect(response.data.metadata).toBeInstanceOf(Map);
    expect(response.data.metadata.get("role")).toBe("administrator");
    expect(response.data.metadata.get("level")).toBe(5);
    expect(response.data.metadata.size).toBe(2);
  });

  test("should have processedAt as a valid Date", async () => {
    const userData = createUserData();
    const before = Date.now();
    const response = await processUserData(userData);
    const after = Date.now();

    expect(response.processedAt).toBeInstanceOf(Date);
    expect(response.processedAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(response.processedAt.getTime()).toBeLessThanOrEqual(after);
  });

  test("should preserve all user data fields", async () => {
    const userData = createUserData();
    const response = await processUserData(userData);

    expect(response.data.id).toBe(1);
    expect(response.data.name).toBe("Test User");
    expect(response.type).toBe("result");
  });
});
