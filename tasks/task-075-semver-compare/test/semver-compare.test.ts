import { describe, test, expect } from "bun:test";
import {
  compareVersions,
  isLessThan,
  isGreaterThan,
  isEqual,
  sortVersions,
} from "../src/semver-compare";

describe("semver-compare", () => {
  describe("compareVersions", () => {
    test("should return 0 for equal versions", () => {
      expect(compareVersions("1.0.0", "1.0.0")).toBe(0);
      expect(compareVersions("2.3.4", "2.3.4")).toBe(0);
    });

    test("should return -1 when v1 < v2", () => {
      expect(compareVersions("1.0.0", "2.0.0")).toBe(-1);
      expect(compareVersions("1.0.0", "1.1.0")).toBe(-1);
      expect(compareVersions("1.0.0", "1.0.1")).toBe(-1);
    });

    test("should return 1 when v1 > v2", () => {
      expect(compareVersions("2.0.0", "1.0.0")).toBe(1);
      expect(compareVersions("1.1.0", "1.0.0")).toBe(1);
      expect(compareVersions("1.0.1", "1.0.0")).toBe(1);
    });

    test("should handle pre-release versions correctly - alpha < release", () => {
      // Pre-release versions should be less than their release counterparts
      expect(compareVersions("1.0.0-alpha", "1.0.0")).toBe(-1);
    });

    test("should handle pre-release versions correctly - beta < release", () => {
      expect(compareVersions("1.0.0-beta", "1.0.0")).toBe(-1);
    });

    test("should handle pre-release versions correctly - rc < release", () => {
      expect(compareVersions("2.0.0-rc.1", "2.0.0")).toBe(-1);
    });

    test("should order pre-release versions alphabetically", () => {
      // alpha < beta
      expect(compareVersions("1.0.0-alpha", "1.0.0-beta")).toBe(-1);
    });

    test("should handle numeric pre-release identifiers", () => {
      expect(compareVersions("1.0.0-alpha.1", "1.0.0-alpha.2")).toBe(-1);
    });
  });

  describe("isLessThan", () => {
    test("should return true when v1 < v2", () => {
      expect(isLessThan("1.0.0", "2.0.0")).toBe(true);
    });

    test("should return true for pre-release < release", () => {
      expect(isLessThan("1.0.0-alpha", "1.0.0")).toBe(true);
    });

    test("should return false when v1 >= v2", () => {
      expect(isLessThan("2.0.0", "1.0.0")).toBe(false);
      expect(isLessThan("1.0.0", "1.0.0")).toBe(false);
    });
  });

  describe("isGreaterThan", () => {
    test("should return true when v1 > v2", () => {
      expect(isGreaterThan("2.0.0", "1.0.0")).toBe(true);
    });

    test("should return true for release > pre-release", () => {
      expect(isGreaterThan("1.0.0", "1.0.0-alpha")).toBe(true);
    });

    test("should return false when v1 <= v2", () => {
      expect(isGreaterThan("1.0.0", "2.0.0")).toBe(false);
      expect(isGreaterThan("1.0.0", "1.0.0")).toBe(false);
    });
  });

  describe("isEqual", () => {
    test("should return true for equal versions", () => {
      expect(isEqual("1.0.0", "1.0.0")).toBe(true);
    });

    test("should return false for different versions", () => {
      expect(isEqual("1.0.0", "1.0.1")).toBe(false);
    });

    test("should return false for pre-release vs release", () => {
      // Pre-release and release are NOT equal
      expect(isEqual("1.0.0-alpha", "1.0.0")).toBe(false);
    });
  });

  describe("sortVersions", () => {
    test("should sort versions in ascending order", () => {
      const versions = ["2.0.0", "1.0.0", "1.5.0", "1.0.1"];
      expect(sortVersions(versions)).toEqual(["1.0.0", "1.0.1", "1.5.0", "2.0.0"]);
    });

    test("should sort pre-release versions before release versions", () => {
      const versions = ["1.0.0", "1.0.0-alpha", "1.0.0-beta", "1.0.0-rc.1"];
      expect(sortVersions(versions)).toEqual([
        "1.0.0-alpha",
        "1.0.0-beta",
        "1.0.0-rc.1",
        "1.0.0",
      ]);
    });

    test("should handle mixed versions with pre-releases", () => {
      const versions = ["2.0.0", "1.0.0-alpha", "1.0.0", "2.0.0-rc.1"];
      expect(sortVersions(versions)).toEqual([
        "1.0.0-alpha",
        "1.0.0",
        "2.0.0-rc.1",
        "2.0.0",
      ]);
    });
  });
});
