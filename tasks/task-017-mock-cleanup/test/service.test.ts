import { test, expect, describe, spyOn } from "bun:test";
import { ApiService, createRequest } from "../src/service";
import * as config from "../src/config";

describe("ApiService", () => {
  // BUG: Mock is created but never restored!
  test("uses test API URL when mocked", () => {
    const mockGetConfig = spyOn(config, "getConfig").mockReturnValue({
      apiUrl: "https://test.api.com",
      timeout: 1000,
      retries: 1,
      debug: true,
    });

    const service = new ApiService();
    const endpoint = service.getApiEndpoint("/users");

    expect(endpoint).toBe("https://test.api.com/users");
    // BUG: Missing mockGetConfig.mockRestore()!
  });

  // BUG: This test expects production config but gets test config from previous test!
  test("uses production API URL by default", () => {
    const service = new ApiService();
    const endpoint = service.getApiEndpoint("/users");

    // This will fail because the mock from the previous test is still active!
    expect(endpoint).toBe("https://api.production.com/users");
  });

  // BUG: Another mock that's never cleaned up
  test("returns debug mode when enabled", () => {
    spyOn(config, "getConfigValue").mockReturnValue(true);

    const service = new ApiService();
    expect(service.isDebugEnabled()).toBe(true);
    // BUG: Mock not restored!
  });

  // BUG: This test is affected by the previous mock
  test("returns production timeout", () => {
    const service = new ApiService();
    // This will fail because getConfigValue is still mocked to return true!
    expect(service.getTimeout()).toBe(5000);
  });
});

describe("createRequest", () => {
  // BUG: Mock pollutes across describe blocks too!
  test("creates request with mock config", () => {
    spyOn(config, "getConfig").mockReturnValue({
      apiUrl: "https://mock.api.com",
      timeout: 500,
      retries: 0,
      debug: false,
    });

    const request = createRequest("/data");
    expect(request.url).toBe("https://mock.api.com/data");
    expect(request.timeout).toBe(500);
    // BUG: No cleanup!
  });
});
