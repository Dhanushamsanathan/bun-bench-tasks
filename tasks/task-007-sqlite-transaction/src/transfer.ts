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

// BUG: No transaction wrapping - partial writes persist on failure
export function transfer(fromId: number, toId: number, amount: number): void {
  // Step 1: Debit from source account
  // This will succeed and persist even if later steps fail!
  db.run("UPDATE accounts SET balance = balance - ? WHERE id = ?", [amount, fromId]);

  // Step 2: Validate the transfer (simulated business logic)
  // This could throw if amount is invalid
  if (amount <= 0) {
    throw new Error("Transfer amount must be positive");
  }

  // Step 3: Credit to destination account
  // If this fails (e.g., invalid account), the debit is already committed!
  db.run("UPDATE accounts SET balance = balance + ? WHERE id = ?", [amount, toId]);

  // Step 4: Log the transaction
  // If this fails, the transfer happened but wasn't logged
  db.run("INSERT INTO transaction_log (from_account, to_account, amount) VALUES (?, ?, ?)", [
    fromId,
    toId,
    amount,
  ]);
}

// BUG: Bulk insert without transaction - partial data on failure
export function bulkCreateAccounts(accounts: Array<{ name: string; balance: number }>): number[] {
  const ids: number[] = [];

  for (const account of accounts) {
    // Each insert is auto-committed
    // If one fails mid-way, previous inserts persist
    if (account.balance < 0) {
      throw new Error(`Invalid balance for ${account.name}`);
    }
    const result = db.run("INSERT INTO accounts (name, balance) VALUES (?, ?)", [
      account.name,
      account.balance,
    ]);
    ids.push(Number(result.lastInsertRowid));
  }

  return ids;
}

// BUG: Update multiple records without transaction
export function applyInterestToAll(interestRate: number): void {
  const accounts = db.query("SELECT id, balance FROM accounts").all() as Array<{
    id: number;
    balance: number;
  }>;

  for (const account of accounts) {
    const interest = Math.floor(account.balance * interestRate);
    // Each update is separate - partial application possible
    db.run("UPDATE accounts SET balance = balance + ? WHERE id = ?", [interest, account.id]);

    // Log each interest application
    // If logging fails, interest was still applied inconsistently
    db.run("INSERT INTO transaction_log (to_account, amount) VALUES (?, ?)", [account.id, interest]);
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
