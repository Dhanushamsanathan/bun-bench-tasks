// BUG: No transaction wrapping - partial writes persist on failure
// Operations are not atomic and can leave database in inconsistent state

import { SQL } from "bun";

// Use SQLite for testing (no external database needed)
const sql = new SQL("sqlite://:memory:");

// Initialize database
await sql`
  CREATE TABLE accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    balance INTEGER NOT NULL CHECK(balance >= 0)
  )
`.simple();

await sql`
  CREATE TABLE transaction_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_account INTEGER,
    to_account INTEGER,
    amount INTEGER NOT NULL,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
  )
`.simple();

export async function createAccount(name: string, initialBalance: number): Promise<number> {
  const result = await sql`
    INSERT INTO accounts (name, balance) VALUES (${name}, ${initialBalance})
  `;
  // For SQLite, we need to get the last inserted ID differently
  const [{ id }] = await sql`SELECT last_insert_rowid() as id`;
  return id;
}

export async function getBalance(accountId: number): Promise<number | undefined> {
  const result = await sql`SELECT balance FROM accounts WHERE id = ${accountId}`;
  return result[0]?.balance;
}

// BUG: No transaction wrapping - partial writes persist on failure
export async function transfer(fromId: number, toId: number, amount: number): Promise<void> {
  // Step 1: Validate the transfer amount
  if (amount <= 0) {
    throw new Error("Transfer amount must be positive");
  }

  // Step 2: Debit from source account
  // This will succeed and persist even if later steps fail!
  await sql`UPDATE accounts SET balance = balance - ${amount} WHERE id = ${fromId}`;

  // Step 3: Verify destination account exists
  const destAccount = await sql`SELECT id FROM accounts WHERE id = ${toId}`;
  if (destAccount.length === 0) {
    throw new Error("Destination account does not exist");
  }

  // Step 4: Credit to destination account
  // If this fails (e.g., constraint violation), the debit is already committed!
  await sql`UPDATE accounts SET balance = balance + ${amount} WHERE id = ${toId}`;

  // Step 5: Log the transaction
  // If this fails, the transfer happened but wasn't logged
  await sql`
    INSERT INTO transaction_log (from_account, to_account, amount)
    VALUES (${fromId}, ${toId}, ${amount})
  `;
}

// BUG: Bulk insert without transaction - partial data on failure
export async function bulkCreateAccounts(
  accounts: Array<{ name: string; balance: number }>
): Promise<number[]> {
  const ids: number[] = [];

  for (const account of accounts) {
    // Validate before insert
    if (account.balance < 0) {
      throw new Error(`Invalid balance for ${account.name}`);
    }

    // Each insert is auto-committed
    // If one fails mid-way, previous inserts persist
    await sql`INSERT INTO accounts (name, balance) VALUES (${account.name}, ${account.balance})`;
    const [{ id }] = await sql`SELECT last_insert_rowid() as id`;
    ids.push(id);
  }

  return ids;
}

// BUG: Update multiple records without transaction
export async function applyInterestToAll(interestRate: number): Promise<void> {
  const accounts = await sql`SELECT id, balance FROM accounts`;

  for (const account of accounts) {
    const interest = Math.floor(account.balance * interestRate);

    // Each update is separate - partial application possible
    await sql`UPDATE accounts SET balance = balance + ${interest} WHERE id = ${account.id}`;

    // Log each interest application
    // If logging fails, interest was still applied inconsistently
    await sql`INSERT INTO transaction_log (to_account, amount) VALUES (${account.id}, ${interest})`;
  }
}

export async function getTransactionLog() {
  return await sql`SELECT * FROM transaction_log`;
}

export async function resetDatabase() {
  await sql`DELETE FROM transaction_log`;
  await sql`DELETE FROM accounts`;
}

export { sql };
