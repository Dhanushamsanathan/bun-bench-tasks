import { expect, test, describe } from "bun:test";
import {
  signData,
  verifySignature,
  createSignedPayload,
  verifySignedPayload,
} from "../src/hmac";

describe("HMAC Signing", () => {
  const secretKey = "test-secret-key-12345";

  test("signature should verify successfully", () => {
    const data = "Hello, World!";
    const signature = signData(data, secretKey);

    // This test FAILS because signData returns base64 but
    // verifySignature computes hex for comparison
    const isValid = verifySignature(data, signature, secretKey);
    expect(isValid).toBe(true);
  });

  test("same input should produce same signature", () => {
    const data = "Consistent data";
    const signature1 = signData(data, secretKey);
    const signature2 = signData(data, secretKey);

    // HMAC should be deterministic
    expect(signature1).toBe(signature2);
  });

  test("different data should produce different signatures", () => {
    const data1 = "First message";
    const data2 = "Second message";

    const signature1 = signData(data1, secretKey);
    const signature2 = signData(data2, secretKey);

    expect(signature1).not.toBe(signature2);
  });

  test("different keys should produce different signatures", () => {
    const data = "Same message";
    const key1 = "key-one";
    const key2 = "key-two";

    const signature1 = signData(data, key1);
    const signature2 = signData(data, key2);

    expect(signature1).not.toBe(signature2);
  });

  test("wrong signature should fail verification", () => {
    const data = "Secure data";
    const wrongSignature = "invalid-signature";

    const isValid = verifySignature(data, wrongSignature, secretKey);
    expect(isValid).toBe(false);
  });

  test("tampered data should fail verification", () => {
    const data = "Original data";
    const signature = signData(data, secretKey);

    const tamperedData = "Tampered data";
    const isValid = verifySignature(tamperedData, signature, secretKey);
    expect(isValid).toBe(false);
  });

  test("signed payload should verify", () => {
    const data = "Important payload";
    const payload = createSignedPayload(data, secretKey);

    // This test FAILS due to encoding mismatch
    const isValid = verifySignedPayload(payload, secretKey);
    expect(isValid).toBe(true);
  });

  test("expired payload should fail verification", async () => {
    const data = "Time-sensitive data";
    const payload = createSignedPayload(data, secretKey);

    // Manually expire the timestamp
    payload.timestamp = Date.now() - 600000; // 10 minutes ago

    const isValid = verifySignedPayload(payload, secretKey, 300000); // 5 min max age
    expect(isValid).toBe(false);
  });

  test("payload with wrong key should fail verification", () => {
    const data = "Secret payload";
    const payload = createSignedPayload(data, secretKey);

    const isValid = verifySignedPayload(payload, "wrong-key");
    expect(isValid).toBe(false);
  });
});
