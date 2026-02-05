import { describe, test, expect } from "bun:test";
import {
  satisfiesRange,
  filterByRange,
  maxSatisfying,
  minSatisfying,
} from "../src/semver-range";

describe("semver-range", () => {
  describe("satisfiesRange", () => {
    describe("caret ranges (^)", () => {
      test("should match same version", () => {
        expect(satisfiesRange("1.0.0", "^1.0.0")).toBe(true);
      });

      test("should match higher minor versions", () => {
        expect(satisfiesRange("1.2.3", "^1.0.0")).toBe(true);
        expect(satisfiesRange("1.9.9", "^1.0.0")).toBe(true);
      });

      test("should not match higher major versions", () => {
        expect(satisfiesRange("2.0.0", "^1.0.0")).toBe(false);
      });

      test("should not match lower versions", () => {
        expect(satisfiesRange("0.9.9", "^1.0.0")).toBe(false);
      });

      test("should not match lower minor versions in same major", () => {
        expect(satisfiesRange("1.1.0", "^1.2.0")).toBe(false);
      });
    });

    describe("tilde ranges (~)", () => {
      test("should match same version", () => {
        expect(satisfiesRange("1.2.3", "~1.2.3")).toBe(true);
      });

      test("should match higher patch versions", () => {
        expect(satisfiesRange("1.2.9", "~1.2.3")).toBe(true);
      });

      test("should not match higher minor versions", () => {
        expect(satisfiesRange("1.3.0", "~1.2.3")).toBe(false);
      });

      test("should not match lower patch versions", () => {
        expect(satisfiesRange("1.2.2", "~1.2.3")).toBe(false);
      });
    });

    describe("compound ranges", () => {
      test("should match versions in range >=1.0.0 <2.0.0", () => {
        expect(satisfiesRange("1.0.0", ">=1.0.0 <2.0.0")).toBe(true);
        expect(satisfiesRange("1.5.0", ">=1.0.0 <2.0.0")).toBe(true);
        expect(satisfiesRange("1.9.9", ">=1.0.0 <2.0.0")).toBe(true);
      });

      test("should not match versions outside range >=1.0.0 <2.0.0", () => {
        expect(satisfiesRange("2.0.0", ">=1.0.0 <2.0.0")).toBe(false);
        expect(satisfiesRange("0.9.9", ">=1.0.0 <2.0.0")).toBe(false);
      });

      test("should handle >1.0.0 <=2.0.0", () => {
        expect(satisfiesRange("1.0.0", ">1.0.0 <=2.0.0")).toBe(false);
        expect(satisfiesRange("1.0.1", ">1.0.0 <=2.0.0")).toBe(true);
        expect(satisfiesRange("2.0.0", ">1.0.0 <=2.0.0")).toBe(true);
      });
    });

    describe("comparison operators", () => {
      test("should handle >= correctly", () => {
        expect(satisfiesRange("1.0.0", ">=1.0.0")).toBe(true);
        expect(satisfiesRange("2.0.0", ">=1.0.0")).toBe(true);
        expect(satisfiesRange("0.9.9", ">=1.0.0")).toBe(false);
      });

      test("should handle > correctly", () => {
        expect(satisfiesRange("1.0.1", ">1.0.0")).toBe(true);
        expect(satisfiesRange("1.0.0", ">1.0.0")).toBe(false);
      });

      test("should handle <= correctly", () => {
        expect(satisfiesRange("1.0.0", "<=1.0.0")).toBe(true);
        expect(satisfiesRange("0.9.9", "<=1.0.0")).toBe(true);
        expect(satisfiesRange("1.0.1", "<=1.0.0")).toBe(false);
      });

      test("should handle < correctly", () => {
        expect(satisfiesRange("0.9.9", "<1.0.0")).toBe(true);
        expect(satisfiesRange("1.0.0", "<1.0.0")).toBe(false);
      });
    });

    describe("x-ranges", () => {
      test("should match 1.x", () => {
        expect(satisfiesRange("1.0.0", "1.x")).toBe(true);
        expect(satisfiesRange("1.5.0", "1.x")).toBe(true);
        expect(satisfiesRange("2.0.0", "1.x")).toBe(false);
      });

      test("should match 1.2.x", () => {
        expect(satisfiesRange("1.2.0", "1.2.x")).toBe(true);
        expect(satisfiesRange("1.2.9", "1.2.x")).toBe(true);
        expect(satisfiesRange("1.3.0", "1.2.x")).toBe(false);
      });
    });

    describe("exact match", () => {
      test("should match exact version", () => {
        expect(satisfiesRange("1.2.3", "1.2.3")).toBe(true);
      });

      test("should not match different version", () => {
        expect(satisfiesRange("1.2.4", "1.2.3")).toBe(false);
      });
    });
  });

  describe("filterByRange", () => {
    const versions = ["0.9.0", "1.0.0", "1.2.3", "1.5.0", "2.0.0", "2.1.0"];

    test("should filter versions by caret range", () => {
      expect(filterByRange(versions, "^1.0.0")).toEqual(["1.0.0", "1.2.3", "1.5.0"]);
    });

    test("should filter versions by compound range", () => {
      expect(filterByRange(versions, ">=1.0.0 <2.0.0")).toEqual([
        "1.0.0",
        "1.2.3",
        "1.5.0",
      ]);
    });
  });

  describe("maxSatisfying", () => {
    const versions = ["1.0.0", "1.2.3", "1.5.0", "2.0.0"];

    test("should find highest version in caret range", () => {
      expect(maxSatisfying(versions, "^1.0.0")).toBe("1.5.0");
    });

    test("should return null if no version matches", () => {
      expect(maxSatisfying(versions, "^3.0.0")).toBe(null);
    });
  });

  describe("minSatisfying", () => {
    const versions = ["1.0.0", "1.2.3", "1.5.0", "2.0.0"];

    test("should find lowest version in caret range", () => {
      expect(minSatisfying(versions, "^1.0.0")).toBe("1.0.0");
    });

    test("should return null if no version matches", () => {
      expect(minSatisfying(versions, "^3.0.0")).toBe(null);
    });
  });
});
