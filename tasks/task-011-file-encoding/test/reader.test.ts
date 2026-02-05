import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { readConfig, readConfigKey, readMultipleConfigs } from "../src/reader";
import { join } from "path";
import { mkdtemp, rm } from "fs/promises";
import { tmpdir } from "os";

describe("readConfig", () => {
  let tempDir: string;
  let configPath: string;
  let envPath: string;

  beforeAll(async () => {
    // Create temporary directory and test files
    tempDir = await mkdtemp(join(tmpdir(), "task-011-"));
    configPath = join(tempDir, "config.txt");
    envPath = join(tempDir, ".env");

    // Write test configuration files
    await Bun.write(configPath, "Hello, World!\nThis is a test config file.");
    await Bun.write(envPath, "DATABASE_URL=postgres://localhost:5432/mydb\nAPI_KEY=secret123\nDEBUG=true");
  });

  afterAll(async () => {
    // Cleanup temporary files
    await rm(tempDir, { recursive: true, force: true });
  });

  test("should return file contents as a string", async () => {
    const content = await readConfig(configPath);

    // This test will FAIL because content is actually an ArrayBuffer, not a string
    expect(typeof content).toBe("string");
  });

  test("should return the actual file contents", async () => {
    const content = await readConfig(configPath);

    // This test will FAIL because the type cast doesn't convert ArrayBuffer to string
    expect(content).toBe("Hello, World!\nThis is a test config file.");
  });

  test("should be able to use string methods on the result", async () => {
    const content = await readConfig(configPath);

    // This test will FAIL because ArrayBuffer doesn't have proper string methods
    expect(content.includes("Hello")).toBe(true);
  });

  test("should have correct string length", async () => {
    const content = await readConfig(configPath);
    const expected = "Hello, World!\nThis is a test config file.";

    // This test will FAIL because ArrayBuffer.byteLength !== string.length behavior
    expect(content.length).toBe(expected.length);
  });
});

describe("readConfigKey", () => {
  let tempDir: string;
  let envPath: string;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "task-011-key-"));
    envPath = join(tempDir, ".env");
    await Bun.write(envPath, "DATABASE_URL=postgres://localhost:5432/mydb\nAPI_KEY=secret123\nDEBUG=true");
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("should extract DATABASE_URL value", async () => {
    const value = await readConfigKey(envPath, "DATABASE_URL");

    // This test will FAIL because split() won't work on the broken content
    expect(value).toBe("postgres://localhost:5432/mydb");
  });

  test("should extract API_KEY value", async () => {
    const value = await readConfigKey(envPath, "API_KEY");

    // This test will FAIL
    expect(value).toBe("secret123");
  });

  test("should return undefined for missing key", async () => {
    const value = await readConfigKey(envPath, "MISSING_KEY");

    // This might pass by accident if the function throws or returns undefined
    expect(value).toBeUndefined();
  });
});

describe("readMultipleConfigs", () => {
  let tempDir: string;
  let file1: string;
  let file2: string;

  beforeAll(async () => {
    tempDir = await mkdtemp(join(tmpdir(), "task-011-multi-"));
    file1 = join(tempDir, "config1.txt");
    file2 = join(tempDir, "config2.txt");
    await Bun.write(file1, "Config file 1");
    await Bun.write(file2, "Config file 2");
  });

  afterAll(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  test("should return array of strings", async () => {
    const contents = await readMultipleConfigs([file1, file2]);

    // This test will FAIL because the array contains ArrayBuffers, not strings
    expect(contents.every(c => typeof c === "string")).toBe(true);
  });

  test("should return correct file contents", async () => {
    const contents = await readMultipleConfigs([file1, file2]);

    // This test will FAIL
    expect(contents).toEqual(["Config file 1", "Config file 2"]);
  });
});
