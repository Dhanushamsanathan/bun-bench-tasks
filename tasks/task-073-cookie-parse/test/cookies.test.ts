import { expect, test, describe } from "bun:test";
import { parseCookies, getCookie } from "../src/cookies";

describe("Cookie Parsing", () => {
  test("should decode URL-encoded spaces in values", () => {
    const cookieString = "user=John%20Doe";
    const cookies = parseCookies(cookieString);

    // This test FAILS because buggy code doesn't decode URL-encoded values
    expect(cookies.user).toBe("John Doe");
  });

  test("should preserve equal signs in cookie values", () => {
    const cookieString = "data=a=b=c";
    const cookies = parseCookies(cookieString);

    // This test FAILS because buggy code splits on first = only
    expect(cookies.data).toBe("a=b=c");
  });

  test("should decode URL-encoded special characters", () => {
    const cookieString = "token=abc%3D%3D";
    const cookies = parseCookies(cookieString);

    // This test FAILS because buggy code doesn't decode %3D to =
    expect(cookies.token).toBe("abc==");
  });

  test("should handle multiple cookies with special characters", () => {
    const cookieString = "user=John%20Doe; data=a=b=c; token=abc%3D%3D";
    const cookies = parseCookies(cookieString);

    expect(cookies.user).toBe("John Doe");
    expect(cookies.data).toBe("a=b=c");
    expect(cookies.token).toBe("abc==");
  });

  test("should decode semicolons in URL-encoded values", () => {
    const cookieString = "path=%2Fhome%3Bsection%3Dmain";
    const cookies = parseCookies(cookieString);

    // %2F = /, %3B = ;, %3D = =
    expect(cookies.path).toBe("/home;section=main");
  });

  test("should handle empty cookie string", () => {
    const cookies = parseCookies("");
    expect(Object.keys(cookies).length).toBe(0);
  });

  test("should handle cookies with no value", () => {
    const cookieString = "flag=; active=true";
    const cookies = parseCookies(cookieString);

    expect(cookies.flag).toBe("");
    expect(cookies.active).toBe("true");
  });

  test("getCookie should return decoded value", () => {
    const cookieString = "session=abc%2B123%2Fxyz";
    const value = getCookie(cookieString, "session");

    // %2B = +, %2F = /
    expect(value).toBe("abc+123/xyz");
  });

  test("getCookie should return null for non-existent cookie", () => {
    const cookieString = "user=test";
    const value = getCookie(cookieString, "nonexistent");

    expect(value).toBeNull();
  });

  test("should preserve plus signs in cookie values", () => {
    const cookieString = "query=hello+world";
    const cookies = parseCookies(cookieString);

    // Per RFC 6265, cookies use percent-encoding, not form encoding
    // Plus signs remain as-is (use %20 for spaces in cookies)
    expect(cookies.query).toBe("hello+world");
  });
});
