import { describe, test, expect, beforeAll, afterAll } from "bun:test";
import { unlink } from "node:fs/promises";
import {
  loadEnvConfig,
  envFileExists,
  parseEnvContent,
  getEnvVar,
  loadFromFile,
  isConfigFromEnvFile,
} from "../src/env-loader";

describe("Env File Loading", () => {
  const testEnvPath = "/tmp/test-env-042/.env";
  const testEnvContent = `
# Database configuration
DATABASE_URL=postgres://user:pass@prod-db:5432/myapp
REDIS_URL=redis://prod-redis:6379

# Security
SECRET_KEY=super-secret-production-key-12345

# Server config
PORT=8080
NODE_ENV=production
`;

  beforeAll(async () => {
    // Create test .env file
    await Bun.write(testEnvPath, testEnvContent);
  });

  afterAll(async () => {
    // Clean up test file
    try {
      await unlink(testEnvPath);
    } catch {
      // Ignore if file doesn't exist
    }
  });

  describe("parseEnvContent", () => {
    test("should parse env content correctly", () => {
      const content = `
KEY1=value1
KEY2="quoted value"
KEY3='single quoted'
# comment
EMPTY=
`;
      const result = parseEnvContent(content);

      expect(result.KEY1).toBe("value1");
      expect(result.KEY2).toBe("quoted value");
      expect(result.KEY3).toBe("single quoted");
      expect(result.EMPTY).toBe("");
    });
  });

  describe("envFileExists", () => {
    test("should detect existing .env file", async () => {
      const exists = await envFileExists(testEnvPath);
      expect(exists).toBe(true);
    });

    test("should return false for non-existent file", async () => {
      const exists = await envFileExists("/non/existent/.env");
      expect(exists).toBe(false);
    });
  });

  describe("loadFromFile", () => {
    test("should load config from .env file", async () => {
      const config = await loadFromFile(testEnvPath);

      // BUG: Returns hardcoded values instead of file content
      expect(config.databaseUrl).toBe(
        "postgres://user:pass@prod-db:5432/myapp"
      );
      expect(config.redisUrl).toBe("redis://prod-redis:6379");
      expect(config.secretKey).toBe("super-secret-production-key-12345");
      expect(config.port).toBe(8080);
      expect(config.nodeEnv).toBe("production");
    });

    test("should not return hardcoded localhost values", async () => {
      const config = await loadFromFile(testEnvPath);

      // BUG: Will fail because config always uses hardcoded localhost values
      expect(config.databaseUrl).not.toContain("localhost");
      expect(config.redisUrl).not.toContain("localhost");
    });

    test("should not use hardcoded secret key", async () => {
      const config = await loadFromFile(testEnvPath);

      // BUG: Will fail because secret is hardcoded
      expect(config.secretKey).not.toBe("hardcoded-secret-key-not-secure");
    });
  });

  describe("loadEnvConfig", () => {
    test("should use values from environment, not hardcoded", () => {
      // Set environment variables that would come from .env
      process.env.DATABASE_URL = "postgres://env:pass@db:5432/envdb";
      process.env.PORT = "9000";

      const config = loadEnvConfig();

      // BUG: Returns hardcoded values, ignoring env vars
      expect(config.port).toBe(9000);
      expect(config.databaseUrl).toBe("postgres://env:pass@db:5432/envdb");

      // Clean up
      delete process.env.DATABASE_URL;
      delete process.env.PORT;
    });
  });

  describe("isConfigFromEnvFile", () => {
    test("should return true after loading from file", async () => {
      await loadFromFile(testEnvPath);
      const isFromFile = isConfigFromEnvFile();

      // BUG: Always returns false because file is never actually loaded
      expect(isFromFile).toBe(true);
    });
  });

  describe("getEnvVar", () => {
    test("should get value from loaded .env file", async () => {
      // First load the env file
      await loadFromFile(testEnvPath);

      // BUG: getEnvVar doesn't use values from loaded file
      const dbUrl = getEnvVar(
        "DATABASE_URL",
        "postgres://localhost:5432/default"
      );

      // This should return the value from the .env file, not the default
      expect(dbUrl).toBe("postgres://user:pass@prod-db:5432/myapp");
    });
  });
});
