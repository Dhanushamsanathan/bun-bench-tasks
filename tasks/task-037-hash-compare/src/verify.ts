// BUG: Uses === for hash comparison instead of Bun.password.verify()
// This is vulnerable to timing attacks and doesn't work with salted hashes

export async function hashPassword(password: string): Promise<string> {
  // Using proper bcrypt hashing
  return await Bun.password.hash(password, {
    algorithm: "bcrypt",
    cost: 10,
  });
}

export async function verifyPassword(inputPassword: string, storedHash: string): Promise<boolean> {
  // BUG: Using === comparison instead of Bun.password.verify()
  // This fails because bcrypt hashes include random salt,
  // so rehashing the same password produces a different hash
  const inputHash = await hashPassword(inputPassword);
  return storedHash === inputHash;
}

// User database simulation
const userDatabase: Map<string, string> = new Map();

export async function registerUser(username: string, password: string): Promise<void> {
  const hash = await hashPassword(password);
  userDatabase.set(username, hash);
}

export async function loginUser(username: string, password: string): Promise<boolean> {
  const storedHash = userDatabase.get(username);
  if (!storedHash) {
    return false;
  }
  return await verifyPassword(password, storedHash);
}

// Example usage
if (import.meta.main) {
  const username = "testuser";
  const password = "mySecurePassword123";

  // Register user
  await registerUser(username, password);
  console.log("User registered:", username);

  // Try to login
  const loginSuccess = await loginUser(username, password);
  console.log("Login attempt with correct password:", loginSuccess);

  const wrongLoginSuccess = await loginUser(username, "wrongPassword");
  console.log("Login attempt with wrong password:", wrongLoginSuccess);
}
