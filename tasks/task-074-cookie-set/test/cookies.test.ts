import { expect, test, describe } from "bun:test";
import {
  serializeCookie,
  createSecureSessionCookie,
  setResponseCookie,
} from "../src/cookies";

describe("Cookie Serialization Security", () => {
  test("should include Secure attribute when specified", () => {
    const cookie = serializeCookie({
      name: "token",
      value: "secret",
      secure: true,
    });

    // This test FAILS because buggy code ignores secure option
    expect(cookie.toLowerCase()).toContain("secure");
  });

  test("should include HttpOnly attribute when specified", () => {
    const cookie = serializeCookie({
      name: "session",
      value: "abc123",
      httpOnly: true,
    });

    // This test FAILS because buggy code ignores httpOnly option
    expect(cookie.toLowerCase()).toContain("httponly");
  });

  test("should include SameSite attribute when specified", () => {
    const cookie = serializeCookie({
      name: "csrf",
      value: "token123",
      sameSite: "strict",
    });

    // This test FAILS because buggy code ignores sameSite option
    expect(cookie.toLowerCase()).toContain("samesite=strict");
  });

  test("should include Path attribute when specified", () => {
    const cookie = serializeCookie({
      name: "pref",
      value: "dark",
      path: "/admin",
    });

    // This test FAILS because buggy code ignores path option
    expect(cookie.toLowerCase()).toContain("path=/admin");
  });

  test("should include Max-Age attribute when specified", () => {
    const cookie = serializeCookie({
      name: "remember",
      value: "true",
      maxAge: 604800, // 1 week
    });

    // This test FAILS because buggy code ignores maxAge option
    expect(cookie.toLowerCase()).toContain("max-age=604800");
  });

  test("should include Domain attribute when specified", () => {
    const cookie = serializeCookie({
      name: "tracking",
      value: "id123",
      domain: "example.com",
    });

    // This test FAILS because buggy code ignores domain option
    expect(cookie.toLowerCase()).toContain("domain=example.com");
  });

  test("createSecureSessionCookie should include all security attributes", () => {
    const cookie = createSecureSessionCookie("session123");
    const lowerCookie = cookie.toLowerCase();

    // All these tests FAIL because buggy code ignores security options
    expect(lowerCookie).toContain("session=session123");
    expect(lowerCookie).toContain("secure");
    expect(lowerCookie).toContain("httponly");
    expect(lowerCookie).toContain("samesite=strict");
    expect(lowerCookie).toContain("path=/");
    expect(lowerCookie).toContain("max-age=86400");
  });

  test("should handle all attributes together", () => {
    const cookie = serializeCookie({
      name: "auth",
      value: "token",
      secure: true,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 3600,
      domain: "api.example.com",
    });
    const lowerCookie = cookie.toLowerCase();

    expect(lowerCookie).toContain("auth=token");
    expect(lowerCookie).toContain("secure");
    expect(lowerCookie).toContain("httponly");
    expect(lowerCookie).toContain("samesite=lax");
    expect(lowerCookie).toContain("path=/");
    expect(lowerCookie).toContain("max-age=3600");
    expect(lowerCookie).toContain("domain=api.example.com");
  });

  test("setResponseCookie should add proper Set-Cookie header", () => {
    const originalResponse = new Response("OK");
    const newResponse = setResponseCookie(originalResponse, {
      name: "session",
      value: "xyz789",
      secure: true,
      httpOnly: true,
      sameSite: "strict",
    });

    const setCookieHeader = newResponse.headers.get("Set-Cookie");
    expect(setCookieHeader).not.toBeNull();

    const lowerHeader = setCookieHeader!.toLowerCase();
    expect(lowerHeader).toContain("session=xyz789");
    expect(lowerHeader).toContain("secure");
    expect(lowerHeader).toContain("httponly");
  });

  test("SameSite=None should require Secure attribute", () => {
    const cookie = serializeCookie({
      name: "cross-site",
      value: "data",
      sameSite: "none",
      secure: true, // Required when SameSite=None
    });
    const lowerCookie = cookie.toLowerCase();

    expect(lowerCookie).toContain("samesite=none");
    expect(lowerCookie).toContain("secure");
  });
});
