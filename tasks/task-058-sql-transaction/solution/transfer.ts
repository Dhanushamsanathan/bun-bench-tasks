// FIXED: Using sql.begin() for atomic transaction handling
// All operations within a transaction are automatically rolled back on error

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
  const [{ id }] = await sql`SELECT last_insert_rowid() as id`;
  return id;
}

export async function getBalance(accountId: number): Promise<number | undefined> {
  const result = await sql`SELECT balance FROM accounts WHERE id = ${accountId}`;
  return result[0]?.balance;
}

// FIXED: Using sql.begin() for atomic operations
export async function transfer(fromId: number, toId: number, amount: number): Promise<void> {
  await sql.begin(async (tx) => {
    // Validate first, before any modifications
    if (amount <= 0) {
      throw new Error("Transfer amount must be positive");
    }

    // Verify destination account exists
    const destAccount = await tx`SELECT id FROM accounts WHERE id = ${toId}`;
    if (destAccount.length === 0) {
      throw new Error("Destination account does not exist");
    }

    // All these operations are now atomic
    // If any fails, all changes are rolled back
    await tx`UPDATE accounts SET balance = balance - ${amount} WHERE id = ${fromId}`;
    await tx`UPDATE accounts SET balance = balance + ${amount} WHERE id = ${toId}`;
    await tx`
      INSERT INTO transaction_log (from_account, to_account, amount)
      VALUES (${fromId}, ${toId}, ${amount})
    `;
  });
}

// FIXED: Bulk insert wrapped in transaction
export async function bulkCreateAccounts(
  accounts: Array<{ name: string; balance: number }>
): Promise<number[]> {
  return await sql.begin(async (tx) => {
    const ids: number[] = [];

    // Validate all accounts first
    for (const account of accounts) {
      if (account.balance < 0) {
        throw new Error(`Invalid balance for ${account.name}`);
      }
    }

    // Then insert all within the transaction
    for (const account of accounts) {
      await tx`INSERT INTO accounts (name, balance) VALUES (${account.name}, ${account.balance})`;
      const [{ id }] = await tx`SELECT last_insert_rowid() as id`;
      ids.push(id);
    }

    return ids;
  });
}

// FIXED: Interest application wrapped in transaction
export async function applyInterestToAll(interestRate: number): Promise<void> {
  await sql.begin(async (tx) => {
    const accounts = await tx`SELECT id, balance FROM accounts`;

    for (const account of accounts) {
      const interest = Math.floor(account.balance * interestRate);

      await tx`UPDATE accounts SET balance = balance + ${interest} WHERE id = ${account.id}`;
      await tx`INSERT INTO transaction_log (to_account, amount) VALUES (${account.id}, ${interest})`;
    }
  });
}

// BONUS: Using savepoints for nested transaction control
export async function transferWithSavepoint(
  fromId: number,
  toId: number,
  amount: number,
  logEnabled: boolean = true
): Promise<void> {
  await sql.begin(async (tx) => {
    if (amount <= 0) {
      throw new Error("Transfer amount must be positive");
    }

    const destAccount = await tx`SELECT id FROM accounts WHERE id = ${toId}`;
    if (destAccount.length === 0) {
      throw new Error("Destination account does not exist");
    }

    await tx`UPDATE accounts SET balance = balance - ${amount} WHERE id = ${fromId}`;
    await tx`UPDATE accounts SET balance = balance + ${amount} WHERE id = ${toId}`;

    // Use savepoint for optional logging
    if (logEnabled) {
      await tx.savepoint(async (sp) => {
        await sp`
          INSERT INTO transaction_log (from_account, to_account, amount)
          VALUES (${fromId}, ${toId}, ${amount})
        `;
      });
    }
  });
}

// BONUS: Wrap multiple transfers in a single transaction
export async function multiTransfer(
  transfers: Array<{ fromId: number; toId: number; amount: number }>
): Promise<void> {
  await sql.begin(async (tx) => {
    for (const { fromId, toId, amount } of transfers) {
      if (amount <= 0) {
        throw new Error("Transfer amount must be positive");
      }

      const destAccount = await tx`SELECT id FROM accounts WHERE id = ${toId}`;
      if (destAccount.length === 0) {
        throw new Error("Destination account does not exist");
      }

      await tx`UPDATE accounts SET balance = balance - ${amount} WHERE id = ${fromId}`;
      await tx`UPDATE accounts SET balance = balance + ${amount} WHERE id = ${toId}`;
      await tx`
        INSERT INTO transaction_log (from_account, to_account, amount)
        VALUES (${fromId}, ${toId}, ${amount})
      `;
    }
  });
}

export async function getTransactionLog() {
  return await sql`SELECT * FROM transaction_log`;
}

export async function resetDatabase() {
  await sql`DELETE FROM transaction_log`;
  await sql`DELETE FROM accounts`;
}

export { sql };
