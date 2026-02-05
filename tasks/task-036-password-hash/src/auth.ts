// BUG: Uses MD5 instead of Bun.password.hash() with bcrypt/argon2
// MD5 is fast, unsalted, and cryptographically broken for password storage

export async function hashPassword(password: string): Promise<string> {
  // BUG: Using MD5 for password hashing is insecure
  const hasher = new Bun.CryptoHasher("md5");
  hasher.update(password);
  return hasher.digest("hex");
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // BUG: Simple string comparison with MD5 hash
  const inputHash = await hashPassword(password);
  return inputHash === hash;
}

// Example usage
if (import.meta.main) {
  const password = "mySecurePassword123";
  const hash = await hashPassword(password);
  console.log("Password:", password);
  console.log("Hash:", hash);
  console.log("Hash length:", hash.length);

  const isValid = await verifyPassword(password, hash);
  console.log("Verification:", isValid);
}
