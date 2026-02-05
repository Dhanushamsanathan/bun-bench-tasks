import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import {
  validateEnv,
  isEnvVarSet,
  getMissingRequiredVars,
  initializeApp,
  requireEnvVar,
  validateAndThrow,
  isProductionReady,
  getValidationErrors,
} from "../src/env-validator";

describe("Env Validation", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear all required env vars
    delete process.env.DATABASE_URL;
    delete process.env.API_KEY;
    delete process.env.JWT_SECRET;
    delete process.env.PORT;
    delete process.env.LOG_LEVEL;
    delete process.env.DEBUG;
  });

  afterEach(() => {
    // Restore original environment
    Object.keys(process.env).forEach((key) => {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    });
    Object.assign(process.env, originalEnv);
  });

  describe("validateEnv", () => {
    test("should return isValid=false when required vars are missing", () => {
      const config = validateEnv();

      // BUG: isValid is always true even when required vars are missing
      expect(config.isValid).toBe(false);
    });

    test("should populate errors array with missing required vars", () => {
      const config = validateEnv();

      // BUG: errors array is always empty
      expect(config.errors.length).toBeGreaterThan(0);
      expect(config.errors).toContain("DATABASE_URL is required");
      expect(config.errors).toContain("API_KEY is required");
      expect(config.errors).toContain("JWT_SECRET is required");
    });

    test("should return isValid=true when all required vars are set", () => {
      process.env.DATABASE_URL = "postgres://localhost:5432/db";
      process.env.API_KEY = "my-api-key";
      process.env.JWT_SECRET = "my-jwt-secret";

      const config = validateEnv();

      expect(config.isValid).toBe(true);
      expect(config.errors).toHaveLength(0);
    });

    test("should return empty strings for missing vars", () => {
      const config = validateEnv();

      // This is the current buggy behavior - returns empty strings
      // but doesn't mark config as invalid
      expect(config.databaseUrl).toBe("");
      expect(config.apiKey).toBe("");
      expect(config.jwtSecret).toBe("");
    });
  });

  describe("getMissingRequiredVars", () => {
    test("should return all missing required vars", () => {
      const missing = getMissingRequiredVars();

      expect(missing).toContain("DATABASE_URL");
      expect(missing).toContain("API_KEY");
      expect(missing).toContain("JWT_SECRET");
      expect(missing).toHaveLength(3);
    });

    test("should return empty array when all vars are set", () => {
      process.env.DATABASE_URL = "postgres://localhost:5432/db";
      process.env.API_KEY = "my-api-key";
      process.env.JWT_SECRET = "my-jwt-secret";

      const missing = getMissingRequiredVars();

      expect(missing).toHaveLength(0);
    });
  });

  describe("initializeApp", () => {
    test("should throw when required vars are missing", () => {
      // BUG: initializeApp doesn't throw, it returns invalid config
      expect(() => initializeApp()).toThrow();
    });

    test("should return valid config when all vars are set", () => {
      process.env.DATABASE_URL = "postgres://localhost:5432/db";
      process.env.API_KEY = "my-api-key";
      process.env.JWT_SECRET = "my-jwt-secret";

      const config = initializeApp();

      expect(config.isValid).toBe(true);
      expect(config.databaseUrl).toBe("postgres://localhost:5432/db");
    });
  });

  describe("requireEnvVar", () => {
    test("should throw for missing env var", () => {
      expect(() => requireEnvVar("DATABASE_URL")).toThrow(
        "Required environment variable DATABASE_URL is not set"
      );
    });

    test("should return value for existing env var", () => {
      process.env.DATABASE_URL = "postgres://localhost:5432/db";

      const value = requireEnvVar("DATABASE_URL");

      expect(value).toBe("postgres://localhost:5432/db");
    });
  });

  describe("validateAndThrow", () => {
    test("should throw when required vars are missing", () => {
      // BUG: validateAndThrow only logs warning, doesn't throw
      expect(() => validateAndThrow()).toThrow();
    });

    test("should include missing var names in error message", () => {
      try {
        validateAndThrow();
        expect(true).toBe(false); // Should not reach here
      } catch (error) {
        const message = (error as Error).message;
        expect(message).toContain("DATABASE_URL");
        expect(message).toContain("API_KEY");
        expect(message).toContain("JWT_SECRET");
      }
    });

    test("should return config when all vars are set", () => {
      process.env.DATABASE_URL = "postgres://localhost:5432/db";
      process.env.API_KEY = "my-api-key";
      process.env.JWT_SECRET = "my-jwt-secret";

      const config = validateAndThrow();

      expect(config.isValid).toBe(true);
    });
  });

  describe("isProductionReady", () => {
    test("should return false when required vars are missing", () => {
      const config = validateEnv();
      const ready = isProductionReady(config);

      // BUG: Returns true because isValid is always true
      expect(ready).toBe(false);
    });

    test("should return true when all required vars are set", () => {
      process.env.DATABASE_URL = "postgres://localhost:5432/db";
      process.env.API_KEY = "my-api-key";
      process.env.JWT_SECRET = "my-jwt-secret";

      const config = validateEnv();
      const ready = isProductionReady(config);

      expect(ready).toBe(true);
    });
  });

  describe("getValidationErrors", () => {
    test("should return errors for missing required vars", () => {
      const config = validateEnv();
      const errors = getValidationErrors(config);

      // BUG: errors is always empty
      expect(errors.length).toBeGreaterThan(0);
    });

    test("should return empty array when config is valid", () => {
      process.env.DATABASE_URL = "postgres://localhost:5432/db";
      process.env.API_KEY = "my-api-key";
      process.env.JWT_SECRET = "my-jwt-secret";

      const config = validateEnv();
      const errors = getValidationErrors(config);

      expect(errors).toHaveLength(0);
    });
  });

  describe("isEnvVarSet", () => {
    test("should return false for unset var", () => {
      const isSet = isEnvVarSet("NONEXISTENT_VAR");
      expect(isSet).toBe(false);
    });

    test("should return true for set var", () => {
      process.env.TEST_VAR = "value";
      const isSet = isEnvVarSet("TEST_VAR");
      expect(isSet).toBe(true);
      delete process.env.TEST_VAR;
    });

    test("should return false for empty string var", () => {
      process.env.EMPTY_VAR = "";
      const isSet = isEnvVarSet("EMPTY_VAR");

      // BUG: Returns true for empty string
      // A proper check should consider empty strings as "not set"
      expect(isSet).toBe(false);

      delete process.env.EMPTY_VAR;
    });
  });
});
