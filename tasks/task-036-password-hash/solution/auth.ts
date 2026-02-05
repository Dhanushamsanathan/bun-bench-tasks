// FIXED: Uses Bun.password.hash() with bcrypt for secure password hashing
// Bcrypt is slow by design and includes automatic salting

export async function hashPassword(password: string): Promise<string> {
  // FIXED: Use Bun.password.hash with bcrypt algorithm
  return await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 10, // Work factor - higher is slower but more secure
  });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // FIXED: Use Bun.password.verify for secure comparison
  return await Bun.password.verify(password, hash);
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

  // Demonstrate that same password produces different hashes
  const hash2 = await hashPassword(password);
  console.log("Second hash:", hash2);
  console.log("Hashes are different:", hash !== hash2);
}
