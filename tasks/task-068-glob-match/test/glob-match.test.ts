import { describe, test, expect } from "bun:test";
import {
  isTypeScriptFile,
  matchesExtension,
  matchAnyPattern,
  isInDirectory,
  isSourceFile,
  isConfigFile,
  filterByPattern,
  shouldExclude
} from "../src/glob-match";

describe("Glob Match", () => {
  describe("isTypeScriptFile", () => {
    test("should match .ts files in root", () => {
      expect(isTypeScriptFile("index.ts")).toBe(true);
      expect(isTypeScriptFile("app.ts")).toBe(true);
    });

    test("should match .ts files in nested directories", () => {
      expect(isTypeScriptFile("src/index.ts")).toBe(true);
      expect(isTypeScriptFile("src/utils/helper.ts")).toBe(true);
      expect(isTypeScriptFile("deep/nested/path/file.ts")).toBe(true);
    });

    test("should not match non-.ts files", () => {
      expect(isTypeScriptFile("index.js")).toBe(false);
      expect(isTypeScriptFile("style.css")).toBe(false);
      expect(isTypeScriptFile("README.md")).toBe(false);
    });
  });

  describe("matchesExtension", () => {
    test("should match files with any of the given extensions", () => {
      expect(matchesExtension("file.ts", ["ts", "js"])).toBe(true);
      expect(matchesExtension("file.js", ["ts", "js"])).toBe(true);
    });

    test("should not match files with other extensions", () => {
      expect(matchesExtension("file.css", ["ts", "js"])).toBe(false);
      expect(matchesExtension("file.md", ["ts", "js"])).toBe(false);
    });

    test("should work with single extension", () => {
      expect(matchesExtension("app.tsx", ["tsx"])).toBe(true);
      expect(matchesExtension("app.ts", ["tsx"])).toBe(false);
    });
  });

  describe("matchAnyPattern", () => {
    test("should match if any pattern matches", () => {
      expect(matchAnyPattern("src/index.ts", ["**/*.ts", "**/*.js"])).toBe(true);
      expect(matchAnyPattern("lib/utils.js", ["**/*.ts", "**/*.js"])).toBe(true);
    });

    test("should not match if no patterns match", () => {
      expect(matchAnyPattern("styles/main.css", ["**/*.ts", "**/*.js"])).toBe(false);
    });

    test("should work with single pattern", () => {
      expect(matchAnyPattern("test.ts", ["*.ts"])).toBe(true);
    });
  });

  describe("isInDirectory", () => {
    test("should match files in the specified directory", () => {
      expect(isInDirectory("src/index.ts", "src")).toBe(true);
      expect(isInDirectory("src/utils/helper.ts", "src")).toBe(true);
    });

    test("should not match files outside the directory", () => {
      expect(isInDirectory("lib/index.ts", "src")).toBe(false);
      expect(isInDirectory("index.ts", "src")).toBe(false);
    });

    test("should handle nested directory patterns", () => {
      expect(isInDirectory("src/components/Button.tsx", "src/components")).toBe(true);
    });
  });

  describe("isSourceFile", () => {
    test("should match TypeScript files", () => {
      expect(isSourceFile("index.ts")).toBe(true);
      expect(isSourceFile("src/app.ts")).toBe(true);
    });

    test("should match TSX files", () => {
      expect(isSourceFile("Component.tsx")).toBe(true);
      expect(isSourceFile("src/components/Button.tsx")).toBe(true);
    });

    test("should match JavaScript files", () => {
      expect(isSourceFile("script.js")).toBe(true);
      expect(isSourceFile("lib/utils.js")).toBe(true);
    });

    test("should match JSX files", () => {
      expect(isSourceFile("App.jsx")).toBe(true);
      expect(isSourceFile("components/Header.jsx")).toBe(true);
    });

    test("should not match non-source files", () => {
      expect(isSourceFile("styles.css")).toBe(false);
      expect(isSourceFile("data.json")).toBe(false);
      expect(isSourceFile("README.md")).toBe(false);
    });
  });

  describe("isConfigFile", () => {
    test("should match config files", () => {
      expect(isConfigFile("tsconfig.json")).toBe(true);
      expect(isConfigFile("webpack.config.js")).toBe(true);
      expect(isConfigFile("vite.config.ts")).toBe(true);
    });

    test("should match rc files", () => {
      expect(isConfigFile(".eslintrc")).toBe(true);
      expect(isConfigFile(".prettierrc")).toBe(true);
    });

    test("should match nested config files", () => {
      expect(isConfigFile("packages/web/tsconfig.json")).toBe(true);
    });

    test("should not match regular source files", () => {
      expect(isConfigFile("src/index.ts")).toBe(false);
      expect(isConfigFile("utils/helper.js")).toBe(false);
    });
  });

  describe("filterByPattern", () => {
    const testFiles = [
      "src/index.ts",
      "src/utils.ts",
      "lib/helper.js",
      "test/app.test.ts",
      "README.md",
      "package.json"
    ];

    test("should filter TypeScript files", () => {
      const result = filterByPattern(testFiles, "**/*.ts");
      expect(result).toEqual([
        "src/index.ts",
        "src/utils.ts",
        "test/app.test.ts"
      ]);
    });

    test("should filter test files", () => {
      const result = filterByPattern(testFiles, "**/*.test.ts");
      expect(result).toEqual(["test/app.test.ts"]);
    });

    test("should filter by directory", () => {
      const result = filterByPattern(testFiles, "src/**");
      expect(result).toEqual(["src/index.ts", "src/utils.ts"]);
    });
  });

  describe("shouldExclude", () => {
    test("should exclude node_modules", () => {
      expect(shouldExclude("node_modules/lodash/index.js")).toBe(true);
      expect(shouldExclude("node_modules/@types/node/index.d.ts")).toBe(true);
    });

    test("should exclude dist folder", () => {
      expect(shouldExclude("dist/bundle.js")).toBe(true);
      expect(shouldExclude("dist/index.js")).toBe(true);
    });

    test("should exclude .git folder", () => {
      expect(shouldExclude(".git/config")).toBe(true);
      expect(shouldExclude(".git/HEAD")).toBe(true);
    });

    test("should not exclude source files", () => {
      expect(shouldExclude("src/index.ts")).toBe(false);
      expect(shouldExclude("lib/utils.js")).toBe(false);
    });
  });
});
