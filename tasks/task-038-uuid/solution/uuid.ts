// FIXED: Uses crypto.randomUUID() for cryptographically secure UUID generation
// This produces valid UUID v4 format per RFC 4122

export function generateUUID(): string {
  // FIXED: Use crypto.randomUUID() which is cryptographically secure
  // and produces valid UUID v4 format
  return crypto.randomUUID();
}

export function generateSessionToken(): string {
  // FIXED: Session tokens now use cryptographically secure UUIDs
  return `session_${generateUUID()}`;
}

export function generateApiKey(): string {
  // FIXED: API keys now use cryptographically secure randomness
  return `api_${generateUUID().replace(/-/g, "")}`;
}

// Example usage
if (import.meta.main) {
  console.log("Generated UUIDs:");
  for (let i = 0; i < 5; i++) {
    const uuid = generateUUID();
    console.log(uuid);

    // Show that version (4) and variant (8-b) are correctly set
    const parts = uuid.split("-");
    console.log(`  Version: ${parts[2][0]}, Variant: ${parts[3][0]}`);
  }

  console.log("\nSession token:", generateSessionToken());
  console.log("API key:", generateApiKey());
}
