import { expect, test, describe } from "bun:test";
import { generateUUID, generateSessionToken, generateApiKey } from "../src/uuid";

describe("UUID Generation", () => {
  test("UUID should be valid v4 format", () => {
    const uuid = generateUUID();

    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    // where y is 8, 9, a, or b
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    // This test FAILS because Math.random() implementation doesn't set
    // the version nibble (4) or variant bits (8, 9, a, or b)
    expect(uuid).toMatch(uuidV4Regex);
  });

  test("UUID should have version 4 at correct position", () => {
    const uuid = generateUUID();
    const parts = uuid.split("-");

    // The third segment should start with '4' for UUID v4
    // This test FAILS because the buggy implementation doesn't set version
    expect(parts[2][0]).toBe("4");
  });

  test("UUID should have correct variant bits", () => {
    const uuid = generateUUID();
    const parts = uuid.split("-");

    // The fourth segment's first character should be 8, 9, a, or b
    const variantChar = parts[3][0].toLowerCase();
    const validVariants = ["8", "9", "a", "b"];

    // This test FAILS because the buggy implementation doesn't set variant
    expect(validVariants).toContain(variantChar);
  });

  test("UUIDs should be unique", () => {
    const uuids = new Set<string>();
    const count = 1000;

    for (let i = 0; i < count; i++) {
      uuids.add(generateUUID());
    }

    // All generated UUIDs should be unique
    expect(uuids.size).toBe(count);
  });

  test("UUID should have correct length and format", () => {
    const uuid = generateUUID();

    // UUID should be 36 characters: 8-4-4-4-12
    expect(uuid.length).toBe(36);
    expect(uuid.split("-").map(s => s.length)).toEqual([8, 4, 4, 4, 12]);
  });

  test("session token should contain valid UUID", () => {
    const token = generateSessionToken();

    expect(token).toMatch(/^session_/);

    // Extract UUID part and validate format
    const uuidPart = token.replace("session_", "");
    const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    // This test FAILS because underlying UUID is not valid v4
    expect(uuidPart).toMatch(uuidV4Regex);
  });

  test("API key should be cryptographically random", () => {
    const key = generateApiKey();

    expect(key).toMatch(/^api_/);
    // API key should be 36 characters (api_ + 32 hex chars from UUID without dashes)
    expect(key.length).toBe(36);
  });
});
