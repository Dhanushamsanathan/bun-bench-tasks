import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import {
  getConfig,
  buildApiUrl,
  getAuthHeader,
  getEffectiveLogLevel,
  getTimeoutMs,
} from "../src/config";

describe("Config - Env Variables", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Clear relevant env vars to test defaults
    delete process.env.API_URL;
    delete process.env.API_KEY;
    delete process.env.TIMEOUT;
    delete process.env.DEBUG;
    delete process.env.LOG_LEVEL;
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

  describe("getConfig", () => {
    test("should return config with defaults when env vars not set", () => {
      const config = getConfig();

      // BUG: These will be undefined instead of defaults
      expect(config.apiUrl).toBe("http://localhost:3000");
      expect(config.apiKey).toBe("");
      expect(config.timeout).toBe(30);
      expect(config.debug).toBe(false);
      expect(config.logLevel).toBe("info");
    });

    test("should use env vars when set", () => {
      process.env.API_URL = "https://api.example.com";
      process.env.API_KEY = "secret-key";
      process.env.TIMEOUT = "60";
      process.env.DEBUG = "true";
      process.env.LOG_LEVEL = "debug";

      const config = getConfig();

      expect(config.apiUrl).toBe("https://api.example.com");
      expect(config.apiKey).toBe("secret-key");
      expect(config.timeout).toBe(60);
      expect(config.debug).toBe(true);
      expect(config.logLevel).toBe("debug");
    });
  });

  describe("buildApiUrl", () => {
    test("should build valid URL with default config", () => {
      const config = getConfig();
      const url = buildApiUrl(config, "users");

      // BUG: Will be "undefined/users" instead of valid URL
      expect(url).toBe("http://localhost:3000/users");
    });

    test("should not include 'undefined' in URL", () => {
      const config = getConfig();
      const url = buildApiUrl(config, "api/data");

      // BUG: Will fail because URL contains "undefined"
      expect(url).not.toContain("undefined");
    });
  });

  describe("getAuthHeader", () => {
    test("should return empty auth header when no API key", () => {
      const config = getConfig();
      const header = getAuthHeader(config);

      // BUG: Returns "Bearer undefined" instead of empty or valid header
      expect(header).toBe("");
    });

    test("should not contain 'undefined' in header", () => {
      const config = getConfig();
      const header = getAuthHeader(config);

      // BUG: Will fail because header contains "undefined"
      expect(header).not.toContain("undefined");
    });

    test("should return valid header when API key is set", () => {
      process.env.API_KEY = "my-secret-key";
      const config = getConfig();
      const header = getAuthHeader(config);

      expect(header).toBe("Bearer my-secret-key");
    });
  });

  describe("getEffectiveLogLevel", () => {
    test("should return 'info' as default log level", () => {
      const config = getConfig();
      const level = getEffectiveLogLevel(config);

      // BUG: Returns undefined instead of "info"
      expect(level).toBe("info");
    });

    test("should return configured log level", () => {
      process.env.LOG_LEVEL = "warn";
      const config = getConfig();
      const level = getEffectiveLogLevel(config);

      expect(level).toBe("warn");
    });
  });

  describe("getTimeoutMs", () => {
    test("should return default timeout in milliseconds", () => {
      const config = getConfig();
      const timeoutMs = getTimeoutMs(config);

      // BUG: Returns NaN instead of 30000
      expect(timeoutMs).toBe(30000);
    });

    test("should not return NaN", () => {
      const config = getConfig();
      const timeoutMs = getTimeoutMs(config);

      // BUG: Will fail because parseInt(undefined) = NaN
      expect(Number.isNaN(timeoutMs)).toBe(false);
    });

    test("should return configured timeout in milliseconds", () => {
      process.env.TIMEOUT = "45";
      const config = getConfig();
      const timeoutMs = getTimeoutMs(config);

      expect(timeoutMs).toBe(45000);
    });
  });
});
