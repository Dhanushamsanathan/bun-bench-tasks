// BUG: Uses Math.random() instead of crypto.randomUUID()
// Math.random() is not cryptographically secure and this implementation
// doesn't properly set UUID version and variant bits

export function generateUUID(): string {
  // BUG: Using Math.random() which is predictable and not cryptographically secure
  const hex = () => Math.floor(Math.random() * 16).toString(16);

  // Generate UUID-like string but without proper version/variant bits
  // BUG: This doesn't follow RFC 4122 UUID v4 format requirements
  const uuid = [
    hex() + hex() + hex() + hex() + hex() + hex() + hex() + hex(),
    hex() + hex() + hex() + hex(),
    hex() + hex() + hex() + hex(), // Should have version nibble (4) at position 12
    hex() + hex() + hex() + hex(), // Should have variant bits (10xx) at position 16
    hex() + hex() + hex() + hex() + hex() + hex() + hex() + hex() + hex() + hex() + hex() + hex(),
  ].join("-");

  return uuid;
}

export function generateSessionToken(): string {
  // BUG: Session tokens generated with predictable randomness
  return `session_${generateUUID()}`;
}

export function generateApiKey(): string {
  // BUG: API keys should use cryptographically secure randomness
  return `api_${generateUUID().replace(/-/g, "")}`;
}

// Example usage
if (import.meta.main) {
  console.log("Generated UUIDs:");
  for (let i = 0; i < 5; i++) {
    console.log(generateUUID());
  }

  console.log("\nSession token:", generateSessionToken());
  console.log("API key:", generateApiKey());
}
