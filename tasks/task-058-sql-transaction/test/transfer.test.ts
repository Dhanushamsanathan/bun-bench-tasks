import { describe, test, expect, beforeEach } from "bun:test";
import {
  sql,
  createAccount,
  getBalance,
  transfer,
  bulkCreateAccounts,
  applyInterestToAll,
  getTransactionLog,
  resetDatabase,
} from "../src/transfer";

describe("SQL Transaction Rollback", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  test("transfer should be atomic - rollback on constraint violation", async () => {
    const alice = await createAccount("Alice", 100);
    const bob = await createAccount("Bob", 50);

    // Try to transfer more than Alice has
    // This will fail due to CHECK constraint on balance >= 0
    // BUG: Alice's balance gets debited before the constraint check fails
    await expect(async () => {
      await transfer(alice, bob, 150);
    }).toThrow();

    // BUG: This test FAILS - Alice's balance was debited even though transfer failed
    // With proper transaction, balances should be unchanged
    expect(await getBalance(alice)).toBe(100);
    expect(await getBalance(bob)).toBe(50);
  });

  test("transfer should be atomic - rollback on invalid destination", async () => {
    const alice = await createAccount("Alice", 100);
    const invalidAccountId = 9999; // Does not exist

    // BUG: Money disappears from Alice's account!
    // Debit succeeds, but destination check throws
    await expect(async () => {
      await transfer(alice, invalidAccountId, 50);
    }).toThrow("Destination account does not exist");

    // BUG: This test FAILS - Alice lost $50 to nowhere
    expect(await getBalance(alice)).toBe(100);
  });

  test("transfer should validate amount before any modifications", async () => {
    const alice = await createAccount("Alice", 100);
    const bob = await createAccount("Bob", 50);

    // Transfer with invalid amount (0 or negative)
    await expect(async () => {
      await transfer(alice, bob, -10);
    }).toThrow("Transfer amount must be positive");

    // Balances should be unchanged
    expect(await getBalance(alice)).toBe(100);
    expect(await getBalance(bob)).toBe(50);
  });

  test("bulk insert should be all-or-nothing", async () => {
    const accounts = [
      { name: "User1", balance: 100 },
      { name: "User2", balance: 200 },
      { name: "User3", balance: -50 }, // Invalid - will throw
      { name: "User4", balance: 400 },
    ];

    // BUG: First two accounts are created before error on third
    await expect(async () => {
      await bulkCreateAccounts(accounts);
    }).toThrow("Invalid balance");

    // BUG: This test FAILS - User1 and User2 were created
    // With proper transaction, no accounts should exist
    const [{ count }] = await sql`SELECT COUNT(*) as count FROM accounts`;
    expect(count).toBe(0);
  });

  test("bulk insert should not leave partial data on constraint failure", async () => {
    // First, create an account with a name we'll try to duplicate
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_name ON accounts(name)`;

    const accounts = [
      { name: "UniqueUser", balance: 100 },
      { name: "AnotherUser", balance: 200 },
    ];
    await bulkCreateAccounts(accounts);

    // Try to insert duplicates mixed with new
    const newAccounts = [
      { name: "NewUser1", balance: 100 },
      { name: "UniqueUser", balance: 300 }, // Duplicate - will fail
      { name: "NewUser2", balance: 200 },
    ];

    await expect(async () => {
      await bulkCreateAccounts(newAccounts);
    }).toThrow();

    // BUG: NewUser1 was created before the duplicate error
    const [{ count }] = await sql`SELECT COUNT(*) as count FROM accounts`;
    expect(count).toBe(2); // Should only have the original 2
  });

  test("interest application should be atomic", async () => {
    await createAccount("Account1", 1000);
    await createAccount("Account2", 2000);
    await createAccount("Account3", 3000);

    // Simulate a failure during interest application
    // by temporarily breaking the transaction_log table
    await sql`ALTER TABLE transaction_log RENAME TO transaction_log_backup`.simple();

    await expect(async () => {
      await applyInterestToAll(0.1); // 10% interest
    }).toThrow();

    // Restore the table
    await sql`ALTER TABLE transaction_log_backup RENAME TO transaction_log`.simple();

    // BUG: This test FAILS - Account1 has interest applied, others don't
    // With proper transaction, all accounts should have original balance
    expect(await getBalance(1)).toBe(1000);
    expect(await getBalance(2)).toBe(2000);
    expect(await getBalance(3)).toBe(3000);
  });

  test("successful transfer should update all balances and log", async () => {
    const alice = await createAccount("Alice", 500);
    const bob = await createAccount("Bob", 500);

    await transfer(alice, bob, 100);

    expect(await getBalance(alice)).toBe(400);
    expect(await getBalance(bob)).toBe(600);

    const log = await getTransactionLog();
    expect(log.length).toBe(1);
    expect(log[0].amount).toBe(100);
  });

  test("transaction log should match actual transfers", async () => {
    const alice = await createAccount("Alice", 500);
    const bob = await createAccount("Bob", 500);

    // Successful transfer
    await transfer(alice, bob, 100);

    // Failed transfer (insufficient funds)
    try {
      await transfer(alice, bob, 1000);
    } catch {
      // Expected
    }

    const log = await getTransactionLog();

    // BUG: If the debit succeeded before constraint failure,
    // the log might be inconsistent with actual balances
    // Log should show only 1 successful transfer
    expect(log.length).toBe(1);

    // Balances should reflect only the successful transfer
    expect(await getBalance(alice)).toBe(400);
    expect(await getBalance(bob)).toBe(600);
  });

  test("nested operations should maintain atomicity", async () => {
    const alice = await createAccount("Alice", 1000);
    const bob = await createAccount("Bob", 500);
    const charlie = await createAccount("Charlie", 200);

    // Try to do multiple transfers where one will fail
    await expect(async () => {
      // First transfer succeeds
      await transfer(alice, bob, 100);
      // Second transfer fails (Charlie doesn't have enough)
      await transfer(charlie, alice, 500);
    }).toThrow();

    // BUG: First transfer persisted even though second failed
    // With proper transaction wrapping, all should be rolled back
    // Note: This test demonstrates the need for wrapping multiple operations
    expect(await getBalance(alice)).toBe(1000);
    expect(await getBalance(bob)).toBe(500);
    expect(await getBalance(charlie)).toBe(200);
  });
});
