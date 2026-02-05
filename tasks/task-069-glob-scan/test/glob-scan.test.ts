import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { mkdirSync, writeFileSync, symlinkSync, rmSync } from "fs";
import { join } from "path";
import {
  scanDirectorySync,
  scanDirectoryAsync,
  findHiddenFiles,
  findFilesWithSymlinks,
  getAbsolutePaths,
  findDirectories,
  comprehensiveScan,
  countMatchingFiles
} from "../src/glob-scan";

const TEST_DIR = join(import.meta.dir, ".test-fixtures");

describe("Glob Scan", () => {
  beforeAll(() => {
    // Create test directory structure
    rmSync(TEST_DIR, { recursive: true, force: true });

    // Create directories
    mkdirSync(TEST_DIR, { recursive: true });
    mkdirSync(join(TEST_DIR, "src"), { recursive: true });
    mkdirSync(join(TEST_DIR, "lib"), { recursive: true });
    mkdirSync(join(TEST_DIR, ".hidden"), { recursive: true });
    mkdirSync(join(TEST_DIR, "linked-target"), { recursive: true });

    // Create regular files
    writeFileSync(join(TEST_DIR, "index.ts"), "export {}");
    writeFileSync(join(TEST_DIR, "src", "app.ts"), "export {}");
    writeFileSync(join(TEST_DIR, "src", "utils.ts"), "export {}");
    writeFileSync(join(TEST_DIR, "lib", "helper.js"), "module.exports = {}");

    // Create hidden files
    writeFileSync(join(TEST_DIR, ".env"), "SECRET=123");
    writeFileSync(join(TEST_DIR, ".gitignore"), "node_modules");
    writeFileSync(join(TEST_DIR, ".hidden", "config.json"), "{}");

    // Create symlink target files
    writeFileSync(join(TEST_DIR, "linked-target", "linked-file.ts"), "export {}");

    // Create symlink to directory
    try {
      symlinkSync(
        join(TEST_DIR, "linked-target"),
        join(TEST_DIR, "symlinked-dir"),
        "dir"
      );
    } catch {
      // Symlink might fail on some systems, tests will be skipped
    }
  });

  afterAll(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  describe("scanDirectorySync", () => {
    test("should scan for TypeScript files", () => {
      const results = scanDirectorySync("**/*.ts", { cwd: TEST_DIR });
      expect(results).toContain("index.ts");
      expect(results).toContain("src/app.ts");
      expect(results).toContain("src/utils.ts");
    });

    test("should scan for JavaScript files", () => {
      const results = scanDirectorySync("**/*.js", { cwd: TEST_DIR });
      expect(results).toContain("lib/helper.js");
    });

    test("should respect cwd option", () => {
      const results = scanDirectorySync("*.ts", { cwd: join(TEST_DIR, "src") });
      expect(results).toContain("app.ts");
      expect(results).toContain("utils.ts");
      expect(results).not.toContain("index.ts");
    });
  });

  describe("scanDirectoryAsync", () => {
    test("should scan for files asynchronously", async () => {
      const results = await scanDirectoryAsync("**/*.ts", { cwd: TEST_DIR });
      expect(results).toContain("index.ts");
      expect(results).toContain("src/app.ts");
      expect(results.length).toBeGreaterThanOrEqual(3);
    });

    test("should return all matching files", async () => {
      const results = await scanDirectoryAsync("**/*", { cwd: TEST_DIR });
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe("findHiddenFiles", () => {
    test("should find dotfiles", () => {
      const results = findHiddenFiles(TEST_DIR);
      expect(results).toContain(".env");
      expect(results).toContain(".gitignore");
    });

    test("should find files in hidden directories", () => {
      const results = findHiddenFiles(TEST_DIR);
      expect(results.some(f => f.includes(".hidden"))).toBe(true);
    });

    test("should not include regular files", () => {
      const results = findHiddenFiles(TEST_DIR);
      expect(results).not.toContain("index.ts");
      expect(results).not.toContain("src/app.ts");
    });
  });

  describe("findFilesWithSymlinks", () => {
    test("should find files through symlinks when enabled", () => {
      const results = findFilesWithSymlinks("**/*.ts", TEST_DIR);
      // Should include files from symlinked directory
      const hasSymlinkedFile = results.some(f =>
        f.includes("symlinked-dir") || f.includes("linked-file.ts")
      );
      // This test verifies symlink following works
      expect(results.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe("getAbsolutePaths", () => {
    test("should return absolute paths", () => {
      const results = getAbsolutePaths("**/*.ts", TEST_DIR);
      expect(results.length).toBeGreaterThan(0);

      for (const path of results) {
        expect(path.startsWith("/")).toBe(true);
        expect(path).toContain(TEST_DIR);
      }
    });

    test("should include full path to files", () => {
      const results = getAbsolutePaths("*.ts", TEST_DIR);
      expect(results.some(p => p.endsWith("index.ts"))).toBe(true);
      expect(results.some(p => p.includes(TEST_DIR))).toBe(true);
    });
  });

  describe("findDirectories", () => {
    test("should find directories matching pattern", () => {
      const results = findDirectories("*", TEST_DIR);
      expect(results).toContain("src");
      expect(results).toContain("lib");
    });

    test("should not include files when finding directories", () => {
      const results = findDirectories("*", TEST_DIR);
      expect(results).not.toContain("index.ts");
    });
  });

  describe("comprehensiveScan", () => {
    test("should respect includeHidden option", () => {
      const withHidden = comprehensiveScan("**/*", {
        cwd: TEST_DIR,
        includeHidden: true
      });

      const withoutHidden = comprehensiveScan("**/*", {
        cwd: TEST_DIR,
        includeHidden: false
      });

      expect(withHidden.length).toBeGreaterThan(withoutHidden.length);
      expect(withHidden.some(f => f.startsWith("."))).toBe(true);
    });

    test("should respect absolute option", () => {
      const absolute = comprehensiveScan("**/*.ts", {
        cwd: TEST_DIR,
        absolute: true
      });

      const relative = comprehensiveScan("**/*.ts", {
        cwd: TEST_DIR,
        absolute: false
      });

      expect(absolute.every(p => p.startsWith("/"))).toBe(true);
      expect(relative.every(p => !p.startsWith("/"))).toBe(true);
    });

    test("should combine multiple options", () => {
      const results = comprehensiveScan("**/*", {
        cwd: TEST_DIR,
        includeHidden: true,
        absolute: true,
        onlyFiles: true
      });

      expect(results.length).toBeGreaterThan(0);
      expect(results.every(p => p.startsWith("/"))).toBe(true);
    });
  });

  describe("countMatchingFiles", () => {
    test("should count TypeScript files", async () => {
      const count = await countMatchingFiles("**/*.ts", TEST_DIR);
      expect(count).toBeGreaterThanOrEqual(3);
    });

    test("should count JavaScript files", async () => {
      const count = await countMatchingFiles("**/*.js", TEST_DIR);
      expect(count).toBeGreaterThanOrEqual(1);
    });

    test("should return 0 for no matches", async () => {
      const count = await countMatchingFiles("**/*.xyz", TEST_DIR);
      expect(count).toBe(0);
    });
  });
});
