import { Database } from "bun:sqlite";

const db = new Database(":memory:");

db.run(`
  CREATE TABLE orders (
    id INTEGER PRIMARY KEY,
    customer_id INTEGER NOT NULL,
    product TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    status TEXT DEFAULT 'pending',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

db.run(`
  CREATE TABLE customers (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    tier TEXT DEFAULT 'standard'
  )
`);

interface Order {
  id: number;
  customer_id: number;
  product: string;
  quantity: number;
  price: number;
  status: string;
  created_at: string;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  tier: string;
}

export function createCustomer(name: string, email: string, tier?: string): number {
  const result = db.run("INSERT INTO customers (name, email, tier) VALUES (?, ?, ?)", [
    name,
    email,
    tier ?? "standard",
  ]);
  return Number(result.lastInsertRowid);
}

export function createOrder(
  customerId: number,
  product: string,
  quantity: number,
  price: number
): number {
  const result = db.run(
    "INSERT INTO orders (customer_id, product, quantity, price) VALUES (?, ?, ?, ?)",
    [customerId, product, quantity, price]
  );
  return Number(result.lastInsertRowid);
}

export function updateOrderStatus(orderId: number, status: string): void {
  db.run("UPDATE orders SET status = ? WHERE id = ?", [status, orderId]);
}

// FIXED: Use .all() to return all matching orders
export function getOrdersByCustomer(customerId: number): Order[] {
  return db.query("SELECT * FROM orders WHERE customer_id = ?").all(customerId) as Order[];
}

// FIXED: Use .all() to return all orders with status
export function getOrdersByStatus(status: string): Order[] {
  return db.query("SELECT * FROM orders WHERE status = ?").all(status) as Order[];
}

// FIXED: Use .all() to return all matching products
export function searchOrders(searchTerm: string): Order[] {
  return db.query("SELECT * FROM orders WHERE product LIKE ?").all(`%${searchTerm}%`) as Order[];
}

// FIXED: Use .all() to return all customers in tier
export function getCustomersByTier(tier: string): Customer[] {
  return db.query("SELECT * FROM customers WHERE tier = ?").all(tier) as Customer[];
}

// FIXED: Use .all() and calculate total from all orders
export function getCustomerOrderTotal(customerId: number): number {
  const orders = db.query("SELECT price, quantity FROM orders WHERE customer_id = ?").all(
    customerId
  ) as Array<{ price: number; quantity: number }>;

  return orders.reduce((total, order) => total + order.price * order.quantity, 0);
}

// Alternative: Use SQL aggregation (more efficient)
export function getCustomerOrderTotalSQL(customerId: number): number {
  const result = db
    .query("SELECT COALESCE(SUM(price * quantity), 0) as total FROM orders WHERE customer_id = ?")
    .get(customerId) as { total: number };
  return result.total;
}

// FIXED: Use .all() to return all product aggregations
export function getSalesByProduct(): Array<{
  product: string;
  total_quantity: number;
  total_revenue: number;
}> {
  return db
    .query(
      `SELECT product,
              SUM(quantity) as total_quantity,
              SUM(price * quantity) as total_revenue
       FROM orders
       GROUP BY product`
    )
    .all() as Array<{ product: string; total_quantity: number; total_revenue: number }>;
}

// FIXED: Use .all() to return top N customers
export function getTopCustomers(
  limit: number
): Array<{ customer_id: number; name: string; total_spent: number }> {
  return db
    .query(
      `SELECT c.id as customer_id, c.name, SUM(o.price * o.quantity) as total_spent
       FROM customers c
       JOIN orders o ON c.id = o.customer_id
       GROUP BY c.id
       ORDER BY total_spent DESC
       LIMIT ?`
    )
    .all(limit) as Array<{ customer_id: number; name: string; total_spent: number }>;
}

// FIXED: Use .all() to return all pending orders
export function getPendingOrders(): Order[] {
  return db.query("SELECT * FROM orders WHERE status = 'pending'").all() as Order[];
}

// FIXED: Use .all() to return complete daily report
export function getDailyOrderReport(): Array<{
  date: string;
  order_count: number;
  total_revenue: number;
}> {
  return db
    .query(
      `SELECT DATE(created_at) as date,
              COUNT(*) as order_count,
              SUM(price * quantity) as total_revenue
       FROM orders
       GROUP BY DATE(created_at)
       ORDER BY date DESC`
    )
    .all() as Array<{ date: string; order_count: number; total_revenue: number }>;
}

// Correct: .get() is appropriate for single-row results
export function getOrderCount(): number {
  const result = db.query("SELECT COUNT(*) as count FROM orders").get() as { count: number };
  return result.count;
}

// Correct: .get() is appropriate for single-row aggregation
export function getTotalRevenue(): number {
  const result = db.query(
    "SELECT COALESCE(SUM(price * quantity), 0) as total FROM orders"
  ).get() as { total: number };
  return result.total;
}

// FIXED: Use .all() to return all recent orders
export function getRecentOrders(days: number): Order[] {
  return db
    .query(
      `SELECT * FROM orders
       WHERE created_at >= datetime('now', '-' || ? || ' days')
       ORDER BY created_at DESC`
    )
    .all(days) as Order[];
}

// Correct: .get() for fetching single record by ID
export function getOrderById(id: number): Order | null {
  return db.query("SELECT * FROM orders WHERE id = ?").get(id) as Order | null;
}

// Correct: .get() for checking existence
export function customerExists(email: string): boolean {
  const result = db.query("SELECT 1 FROM customers WHERE email = ?").get(email);
  return result !== null;
}

export function resetDatabase() {
  db.run("DELETE FROM orders");
  db.run("DELETE FROM customers");
}

export { db };
