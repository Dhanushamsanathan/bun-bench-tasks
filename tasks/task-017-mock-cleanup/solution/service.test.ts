import { test, expect, describe, spyOn, beforeEach, afterEach, mock } from "bun:test";
import { ApiService, createRequest } from "../src/service";
import * as config from "../src/config";
import { resetConfig } from "../src/config";

describe("ApiService", () => {
  let mockGetConfig: ReturnType<typeof spyOn<typeof config, "getConfig">>;
  let mockGetConfigValue: ReturnType<typeof spyOn<typeof config, "getConfigValue">>;

  // FIXED: Reset config and restore mocks before each test
  beforeEach(() => {
    resetConfig();
  });

  // FIXED: Clean up all mocks after each test
  afterEach(() => {
    if (mockGetConfig) {
      mockGetConfig.mockRestore();
    }
    if (mockGetConfigValue) {
      mockGetConfigValue.mockRestore();
    }
  });

  test("uses test API URL when mocked", () => {
    mockGetConfig = spyOn(config, "getConfig").mockReturnValue({
      apiUrl: "https://test.api.com",
      timeout: 1000,
      retries: 1,
      debug: true,
    });

    const service = new ApiService();
    const endpoint = service.getApiEndpoint("/users");

    expect(endpoint).toBe("https://test.api.com/users");
    expect(mockGetConfig).toHaveBeenCalled();
    // Mock will be restored in afterEach
  });

  test("uses production API URL by default", () => {
    // No mock here - uses real implementation
    const service = new ApiService();
    const endpoint = service.getApiEndpoint("/users");

    // Now works correctly because previous mock was restored
    expect(endpoint).toBe("https://api.production.com/users");
  });

  test("returns debug mode when enabled", () => {
    mockGetConfigValue = spyOn(config, "getConfigValue").mockReturnValue(true);

    const service = new ApiService();
    expect(service.isDebugEnabled()).toBe(true);
    // Mock will be restored in afterEach
  });

  test("returns production timeout", () => {
    // No mock - uses real implementation
    const service = new ApiService();
    // Now works because previous mock was restored
    expect(service.getTimeout()).toBe(5000);
  });
});

describe("createRequest", () => {
  // FIXED: Each describe block manages its own mocks
  afterEach(() => {
    resetConfig();
  });

  test("creates request with mock config", () => {
    const mockGetConfig = spyOn(config, "getConfig").mockReturnValue({
      apiUrl: "https://mock.api.com",
      timeout: 500,
      retries: 0,
      debug: false,
    });

    const request = createRequest("/data");
    expect(request.url).toBe("https://mock.api.com/data");
    expect(request.timeout).toBe(500);

    // FIXED: Restore mock immediately after use
    mockGetConfig.mockRestore();
  });

  test("creates request with real config", () => {
    // Works correctly with real implementation
    const request = createRequest("/data");
    expect(request.url).toBe("https://api.production.com/data");
    expect(request.timeout).toBe(5000);
  });
});
