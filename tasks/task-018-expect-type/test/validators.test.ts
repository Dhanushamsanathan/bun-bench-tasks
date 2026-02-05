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
  // BUG: Using == comparison instead of proper matcher
  test("parses string to number", () => {
    const result = parseNumber("42");
    // This passes due to type coercion, but it's not testing properly!
    expect(result == "42").toBe(true); // BUG: comparing number to string with ==
  });

  // BUG: Not checking the actual type
  test("returns a number type", () => {
    const result = parseNumber("100");
    // This doesn't actually verify the type!
    expect(result).toBeTruthy(); // BUG: Only checks truthiness, not type
  });
});

describe("validateEmail", () => {
  // BUG: Using toBe() for object comparison (compares references, not values)
  test("returns validation result for valid email", () => {
    const result = validateEmail("test@example.com");
    // BUG: toBe() compares references, this will fail!
    expect(result).toBe({ valid: true, errors: undefined });
  });

  // BUG: Not checking for undefined properly
  test("has no errors for valid email", () => {
    const result = validateEmail("test@example.com");
    // BUG: Using == with undefined
    expect(result.errors == undefined).toBe(true);
  });
});

describe("normalizeUser", () => {
  // BUG: Using toEqual which ignores undefined, could miss issues
  test("normalizes user data", () => {
    const result = normalizeUser({ name: "  JOHN  ", age: "25" });
    // BUG: This passes but doesn't catch if extra undefined props exist
    expect(result).toEqual({ name: "john", age: 25 });
  });
});

describe("getOptions", () => {
  // BUG: Using toBe for object comparison
  test("returns default options", () => {
    const result = getOptions();
    // BUG: Reference comparison fails
    expect(result).toBe({ timeout: 5000, retries: 3, debug: false });
  });

  // BUG: Partial comparison misses extra properties
  test("merges custom options", () => {
    const result = getOptions({ timeout: 1000 });
    // BUG: Only checking one property, missing validation of full object
    expect(result.timeout).toBe(1000);
    // Not checking retries and debug!
  });
});

describe("compact", () => {
  // BUG: Using toBe for array comparison
  test("removes falsy values", () => {
    const result = compact([1, null, 2, undefined, 3, false, 4]);
    // BUG: Array reference comparison
    expect(result).toBe([1, 2, 3, 4]);
  });
});

describe("createSparseArray", () => {
  // BUG: toEqual doesn't check array holes properly
  test("creates sparse array", () => {
    const result = createSparseArray();
    // BUG: toEqual treats holes same as undefined values
    expect(result).toEqual([1, undefined, 3, undefined, 5]);
  });
});

describe("getStatusCode", () => {
  // BUG: Type coercion hides the bug
  test("returns status code", () => {
    const stringCode = getStatusCode(true);
    const numCode = getStatusCode(false);
    // BUG: These pass due to == coercion but types are different!
    expect(stringCode == 200).toBe(true);
    expect(numCode == "200").toBe(true);
  });
});

describe("isEmpty", () => {
  // BUG: Using == null which matches both null and undefined
  test("handles null and undefined", () => {
    // BUG: This doesn't distinguish between null and undefined
    expect(isEmpty(null) == isEmpty(undefined)).toBe(true);
  });

  // BUG: Not using proper boolean matchers
  test("returns true for empty values", () => {
    // BUG: Comparing boolean to boolean with ==
    expect(isEmpty("") == true).toBe(true);
    expect(isEmpty([]) == true).toBe(true);
  });
});
