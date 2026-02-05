import { Database } from "bun:sqlite";

const db = new Database(":memory:");

// Setup accounts table
db.run(`
  CREATE TABLE accounts (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    balance INTEGER NOT NULL CHECK(balance >= 0)
  )
`);

// Setup transaction log
db.run(`
  CREATE TABLE transaction_log (
    id INTEGER PRIMARY KEY,
    from_account INTEGER,
    to_account INTEGER,
    amount INTEGER,
    timestamp TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

export function createAccount(name: string, initialBalance: number): number {
  const result = db.run("INSERT INTO accounts (name, balance) VALUES (?, ?)", [
    name,
    initialBalance,
  ]);
  return Number(result.lastInsertRowid);
}

export function getBalance(accountId: number): number | undefined {
  const row = db.query("SELECT balance FROM accounts WHERE id = ?").get(accountId) as
    | { balance: number }
    | undefined;
  return row?.balance;
}

// FIXED: Using db.transaction() for atomic operations
export const transfer = db.transaction((fromId: number, toId: number, amount: number): void => {
  // Validate first, before any modifications
  if (amount <= 0) {
    throw new Error("Transfer amount must be positive");
  }

  // Verify destination account exists
  const destAccount = db.query("SELECT id FROM accounts WHERE id = ?").get(toId);
  if (!destAccount) {
    throw new Error("Destination account does not exist");
  }

  // All these operations are now atomic
  // If any fails, all changes are rolled back
  db.run("UPDATE accounts SET balance = balance - ? WHERE id = ?", [amount, fromId]);
  db.run("UPDATE accounts SET balance = balance + ? WHERE id = ?", [amount, toId]);
  db.run("INSERT INTO transaction_log (from_account, to_account, amount) VALUES (?, ?, ?)", [
    fromId,
    toId,
    amount,
  ]);
});

// FIXED: Bulk insert wrapped in transaction
export const bulkCreateAccounts = db.transaction(
  (accounts: Array<{ name: string; balance: number }>): number[] => {
    const ids: number[] = [];

    // Validate all accounts first
    for (const account of accounts) {
      if (account.balance < 0) {
        throw new Error(`Invalid balance for ${account.name}`);
      }
    }

    // Then insert all
    for (const account of accounts) {
      const result = db.run("INSERT INTO accounts (name, balance) VALUES (?, ?)", [
        account.name,
        account.balance,
      ]);
      ids.push(Number(result.lastInsertRowid));
    }

    return ids;
  }
);

// FIXED: Interest application wrapped in transaction
export const applyInterestToAll = db.transaction((interestRate: number): void => {
  const accounts = db.query("SELECT id, balance FROM accounts").all() as Array<{
    id: number;
    balance: number;
  }>;

  for (const account of accounts) {
    const interest = Math.floor(account.balance * interestRate);
    db.run("UPDATE accounts SET balance = balance + ? WHERE id = ?", [interest, account.id]);
    db.run("INSERT INTO transaction_log (to_account, amount) VALUES (?, ?)", [account.id, interest]);
  }
});

// Alternative: Manual transaction control for complex scenarios
export function transferWithManualTransaction(
  fromId: number,
  toId: number,
  amount: number
): void {
  db.run("BEGIN TRANSACTION");

  try {
    if (amount <= 0) {
      throw new Error("Transfer amount must be positive");
    }

    const destAccount = db.query("SELECT id FROM accounts WHERE id = ?").get(toId);
    if (!destAccount) {
      throw new Error("Destination account does not exist");
    }

    db.run("UPDATE accounts SET balance = balance - ? WHERE id = ?", [amount, fromId]);
    db.run("UPDATE accounts SET balance = balance + ? WHERE id = ?", [amount, toId]);
    db.run("INSERT INTO transaction_log (from_account, to_account, amount) VALUES (?, ?, ?)", [
      fromId,
      toId,
      amount,
    ]);

    db.run("COMMIT");
  } catch (error) {
    db.run("ROLLBACK");
    throw error;
  }
}

export function getTransactionLog() {
  return db.query("SELECT * FROM transaction_log").all();
}

export function resetDatabase() {
  db.run("DELETE FROM transaction_log");
  db.run("DELETE FROM accounts");
}

export { db };
