import { test, expect, describe } from "bun:test";
import {
  parseNumber,
  validateEmail,
  normalizeUser,
  getOptions,
  compact,
  createSparseArray,
  getStatusCode,
  isEmpty,
} from "../src/validators";

describe("parseNumber", () => {
  // FIXED: Use .toBe() for primitive comparison
  test("parses string to number", () => {
    const result = parseNumber("42");
    expect(result).toBe(42); // Proper number comparison
  });

  // FIXED: Check the actual type
  test("returns a number type", () => {
    const result = parseNumber("100");
    expect(result).toBe(100);
    expect(typeof result).toBe("number"); // Verify type explicitly
  });
});

describe("validateEmail", () => {
  // FIXED: Use toEqual() for object deep comparison
  test("returns validation result for valid email", () => {
    const result = validateEmail("test@example.com");
    expect(result).toEqual({ valid: true, errors: undefined });
  });

  // FIXED: Use proper undefined matcher
  test("has no errors for valid email", () => {
    const result = validateEmail("test@example.com");
    expect(result.errors).toBeUndefined();
  });

  // Additional: Test invalid email
  test("returns errors for invalid email", () => {
    const result = validateEmail("invalid-email");
    expect(result.valid).toBe(false);
    expect(result.errors).toBeInstanceOf(Array);
    expect(result.errors).toContain("Invalid email format");
  });
});

describe("normalizeUser", () => {
  // FIXED: Use toStrictEqual for exact object matching
  test("normalizes user data", () => {
    const result = normalizeUser({ name: "  JOHN  ", age: "25" });
    expect(result).toStrictEqual({ name: "john", age: 25 });
  });

  // Additional: Verify no extra properties
  test("returns only expected properties", () => {
    const result = normalizeUser({ name: "Jane", age: "30" });
    expect(Object.keys(result)).toEqual(["name", "age"]);
  });
});

describe("getOptions", () => {
  // FIXED: Use toEqual for object comparison
  test("returns default options", () => {
    const result = getOptions();
    expect(result).toEqual({ timeout: 5000, retries: 3, debug: false });
  });

  // FIXED: Check the entire merged object
  test("merges custom options", () => {
    const result = getOptions({ timeout: 1000 });
    expect(result).toEqual({
      timeout: 1000,
      retries: 3,
      debug: false,
    });
  });
});

describe("compact", () => {
  // FIXED: Use toEqual for array deep comparison
  test("removes falsy values", () => {
    const result = compact([1, null, 2, undefined, 3, false, 4]);
    expect(result).toEqual([1, 2, 3, 4]);
  });

  // Additional: Verify array length
  test("returns correct length", () => {
    const result = compact([0, "", null, "hello", undefined, 42]);
    expect(result).toHaveLength(2);
    expect(result).toEqual(["hello", 42]);
  });
});

describe("createSparseArray", () => {
  // FIXED: Use toStrictEqual to detect array holes vs undefined
  test("creates sparse array with holes", () => {
    const result = createSparseArray();
    // toStrictEqual distinguishes between holes and undefined
    expect(result).toHaveLength(5);
    expect(result[0]).toBe(1);
    expect(result[2]).toBe(3);
    expect(result[4]).toBe(5);
    // Check for holes (not the same as undefined values)
    expect(1 in result).toBe(false); // hole at index 1
    expect(3 in result).toBe(false); // hole at index 3
  });
});

describe("getStatusCode", () => {
  // FIXED: Use toBe with correct types
  test("returns string status code", () => {
    const stringCode = getStatusCode(true);
    expect(stringCode).toBe("200");
    expect(typeof stringCode).toBe("string");
  });

  test("returns number status code", () => {
    const numCode = getStatusCode(false);
    expect(numCode).toBe(200);
    expect(typeof numCode).toBe("number");
  });

  // Ensure they are different types
  test("returns different types based on parameter", () => {
    const stringCode = getStatusCode(true);
    const numCode = getStatusCode(false);
    expect(stringCode).not.toBe(numCode); // Different types
    expect(typeof stringCode).not.toBe(typeof numCode);
  });
});

describe("isEmpty", () => {
  // FIXED: Use proper matchers for booleans
  test("returns true for null", () => {
    expect(isEmpty(null)).toBe(true);
  });

  test("returns true for undefined", () => {
    expect(isEmpty(undefined)).toBe(true);
  });

  test("returns true for empty string", () => {
    expect(isEmpty("")).toBe(true);
  });

  test("returns true for empty array", () => {
    expect(isEmpty([])).toBe(true);
  });

  test("returns false for non-empty values", () => {
    expect(isEmpty("hello")).toBe(false);
    expect(isEmpty([1, 2, 3])).toBe(false);
    expect(isEmpty(0)).toBe(false); // 0 is not empty, just falsy
  });
});
