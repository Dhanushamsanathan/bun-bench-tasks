import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import {
  getServerConfig,
  isPortInValidRange,
  getNextPort,
  getTotalTimeout,
  hasConnectionCapacity,
  getConnectionPercentage,
  createServerOptions,
  isDefaultPort,
} from "../src/server-config";

describe("Server Config - Env Type Coercion", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    delete process.env.PORT;
    delete process.env.HOST;
    delete process.env.MAX_CONNECTIONS;
    delete process.env.TIMEOUT;
    delete process.env.SSL;
  });

  afterEach(() => {
    Object.keys(process.env).forEach((key) => {
      if (!(key in originalEnv)) {
        delete process.env[key];
      }
    });
    Object.assign(process.env, originalEnv);
  });

  describe("getServerConfig", () => {
    test("should return port as number type", () => {
      const config = getServerConfig();

      // BUG: port is string "3000", not number 3000
      expect(typeof config.port).toBe("number");
    });

    test("should return maxConnections as number type", () => {
      const config = getServerConfig();

      // BUG: maxConnections is string "100", not number 100
      expect(typeof config.maxConnections).toBe("number");
    });

    test("should return timeout as number type", () => {
      const config = getServerConfig();

      // BUG: timeout is string "30000", not number 30000
      expect(typeof config.timeout).toBe("number");
    });

    test("port should equal number 3000", () => {
      const config = getServerConfig();

      // BUG: "3000" !== 3000 (strict equality)
      expect(config.port).toBe(3000);
    });
  });

  describe("isPortInValidRange", () => {
    test("should validate default port is in range", () => {
      const config = getServerConfig();
      const valid = isPortInValidRange(config);

      // BUG: String comparison makes this unreliable
      expect(valid).toBe(true);
    });

    test("should reject port below 1024", () => {
      process.env.PORT = "80";
      const config = getServerConfig();
      const valid = isPortInValidRange(config);

      // BUG: "80" >= 1024 comparison is broken
      expect(valid).toBe(false);
    });

    test("should reject port above 65535", () => {
      process.env.PORT = "70000";
      const config = getServerConfig();
      const valid = isPortInValidRange(config);

      // BUG: String comparison "70000" <= "65535" is wrong
      expect(valid).toBe(false);
    });
  });

  describe("getNextPort", () => {
    test("should return port + 1 as number", () => {
      const config = getServerConfig();
      const nextPort = getNextPort(config);

      // BUG: Returns "30001" (string concat) instead of 3001
      expect(nextPort).toBe(3001);
    });

    test("should return number type", () => {
      const config = getServerConfig();
      const nextPort = getNextPort(config);

      // BUG: Returns string instead of number
      expect(typeof nextPort).toBe("number");
    });

    test("should work with custom port", () => {
      process.env.PORT = "8080";
      const config = getServerConfig();
      const nextPort = getNextPort(config);

      // BUG: "8080" + 1 = "80801"
      expect(nextPort).toBe(8081);
    });
  });

  describe("getTotalTimeout", () => {
    test("should multiply timeout correctly", () => {
      const config = getServerConfig();
      const total = getTotalTimeout(config, 2);

      // This actually works due to JS coercion, but type is wrong
      expect(total).toBe(60000);
      expect(typeof total).toBe("number");
    });
  });

  describe("hasConnectionCapacity", () => {
    test("should return true when under capacity", () => {
      const config = getServerConfig();
      const hasCapacity = hasConnectionCapacity(config, 50);

      // Works due to coercion
      expect(hasCapacity).toBe(true);
    });

    test("should handle edge case with 9 connections", () => {
      const config = getServerConfig();
      // BUG: "100" < 9 is true in string comparison ("1" < "9")
      const hasCapacity = hasConnectionCapacity(config, 9);

      // Should be true (9 < 100), but string comparison may fail
      expect(hasCapacity).toBe(true);
    });

    test("should return false when at capacity", () => {
      const config = getServerConfig();
      const hasCapacity = hasConnectionCapacity(config, 100);

      expect(hasCapacity).toBe(false);
    });
  });

  describe("getConnectionPercentage", () => {
    test("should calculate percentage correctly", () => {
      const config = getServerConfig();
      const percentage = getConnectionPercentage(config, 50);

      expect(percentage).toBe(50);
    });

    test("should return number type", () => {
      const config = getServerConfig();
      const percentage = getConnectionPercentage(config, 25);

      expect(typeof percentage).toBe("number");
      expect(Number.isNaN(percentage)).toBe(false);
    });
  });

  describe("createServerOptions", () => {
    test("should return port as number for Bun.serve", () => {
      const config = getServerConfig();
      const options = createServerOptions(config);

      // BUG: port is actually string, not number
      expect(typeof options.port).toBe("number");
      expect(options.port).toBe(3000);
    });
  });

  describe("isDefaultPort", () => {
    test("should return true for default port", () => {
      const config = getServerConfig();
      const isDefault = isDefaultPort(config);

      // BUG: "3000" === 3000 is false (strict equality)
      expect(isDefault).toBe(true);
    });

    test("should return false for custom port", () => {
      process.env.PORT = "8080";
      const config = getServerConfig();
      const isDefault = isDefaultPort(config);

      expect(isDefault).toBe(false);
    });
  });
});
