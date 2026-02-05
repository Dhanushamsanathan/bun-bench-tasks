// FIXED: Consistent hex encoding for both sign and verify operations
// This ensures signatures can be properly verified

export function signData(data: string, secretKey: string): string {
  const hasher = new Bun.CryptoHasher("sha256", secretKey);
  hasher.update(data);
  // FIXED: Use hex encoding consistently
  return hasher.digest("hex");
}

export function verifySignature(data: string, signature: string, secretKey: string): boolean {
  const hasher = new Bun.CryptoHasher("sha256", secretKey);
  hasher.update(data);
  // FIXED: Now matches the hex encoding used in signData
  const expectedSignature = hasher.digest("hex");
  return signature === expectedSignature;
}

export interface SignedPayload {
  data: string;
  signature: string;
  timestamp: number;
}

export function createSignedPayload(data: string, secretKey: string): SignedPayload {
  const timestamp = Date.now();
  const dataWithTimestamp = `${data}:${timestamp}`;
  const signature = signData(dataWithTimestamp, secretKey);

  return {
    data,
    signature,
    timestamp,
  };
}

export function verifySignedPayload(
  payload: SignedPayload,
  secretKey: string,
  maxAgeMs: number = 300000 // 5 minutes
): boolean {
  // Check timestamp
  const age = Date.now() - payload.timestamp;
  if (age > maxAgeMs) {
    return false;
  }

  // Verify signature - now works correctly with consistent encoding
  const dataWithTimestamp = `${payload.data}:${payload.timestamp}`;
  return verifySignature(dataWithTimestamp, payload.signature, secretKey);
}

// Example usage
if (import.meta.main) {
  const secretKey = "my-secret-key-12345";
  const data = "Hello, World!";

  const signature = signData(data, secretKey);
  console.log("Data:", data);
  console.log("Signature:", signature);

  const isValid = verifySignature(data, signature, secretKey);
  console.log("Verification result:", isValid); // Now true!

  // Create and verify signed payload
  const payload = createSignedPayload(data, secretKey);
  console.log("\nSigned Payload:", JSON.stringify(payload, null, 2));

  const payloadValid = verifySignedPayload(payload, secretKey);
  console.log("Payload verification:", payloadValid); // Now true!
}
