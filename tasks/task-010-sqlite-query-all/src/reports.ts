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

// BUG: Using .get() instead of .all() - only returns first order!
export function getOrdersByCustomer(customerId: number): Order[] {
  const result = db.query("SELECT * FROM orders WHERE customer_id = ?").get(customerId);
  // BUG: Wrapping single result in array, but it's only the first row
  return result ? [result as Order] : [];
}

// BUG: Using .get() - only returns first order with status
export function getOrdersByStatus(status: string): Order[] {
  const result = db.query("SELECT * FROM orders WHERE status = ?").get(status);
  return result ? [result as Order] : [];
}

// BUG: Using .get() - only returns first product match
export function searchOrders(searchTerm: string): Order[] {
  const result = db
    .query("SELECT * FROM orders WHERE product LIKE ?")
    .get(`%${searchTerm}%`);
  return result ? [result as Order] : [];
}

// BUG: Using .get() - only returns one customer
export function getCustomersByTier(tier: string): Customer[] {
  const result = db.query("SELECT * FROM customers WHERE tier = ?").get(tier);
  return result ? [result as Customer] : [];
}

// BUG: Using .get() - only gets first order, calculates wrong total
export function getCustomerOrderTotal(customerId: number): number {
  const orders = db.query("SELECT price, quantity FROM orders WHERE customer_id = ?").get(
    customerId
  ) as { price: number; quantity: number } | undefined;

  // Only calculates based on first order!
  if (!orders) return 0;
  return orders.price * orders.quantity;
}

// BUG: Returns only first row of what should be a grouped result
export function getSalesByProduct(): Array<{ product: string; total_quantity: number; total_revenue: number }> {
  const result = db
    .query(
      `SELECT product,
              SUM(quantity) as total_quantity,
              SUM(price * quantity) as total_revenue
       FROM orders
       GROUP BY product`
    )
    .get();

  // BUG: Only returns first product's aggregation
  return result
    ? [result as { product: string; total_quantity: number; total_revenue: number }]
    : [];
}

// BUG: Gets only first customer's stats
export function getTopCustomers(
  limit: number
): Array<{ customer_id: number; name: string; total_spent: number }> {
  const result = db
    .query(
      `SELECT c.id as customer_id, c.name, SUM(o.price * o.quantity) as total_spent
       FROM customers c
       JOIN orders o ON c.id = o.customer_id
       GROUP BY c.id
       ORDER BY total_spent DESC
       LIMIT ?`
    )
    .get(limit);

  // BUG: Returns only the top 1 customer regardless of limit
  return result
    ? [result as { customer_id: number; name: string; total_spent: number }]
    : [];
}

// BUG: Only gets first pending order
export function getPendingOrders(): Order[] {
  const result = db.query("SELECT * FROM orders WHERE status = 'pending'").get();
  return result ? [result as Order] : [];
}

// BUG: Returns partial daily report
export function getDailyOrderReport(): Array<{
  date: string;
  order_count: number;
  total_revenue: number;
}> {
  const result = db
    .query(
      `SELECT DATE(created_at) as date,
              COUNT(*) as order_count,
              SUM(price * quantity) as total_revenue
       FROM orders
       GROUP BY DATE(created_at)
       ORDER BY date DESC`
    )
    .get();

  // BUG: Only returns the most recent day's report
  return result
    ? [result as { date: string; order_count: number; total_revenue: number }]
    : [];
}

// This one is correct - single row expected
export function getOrderCount(): number {
  const result = db.query("SELECT COUNT(*) as count FROM orders").get() as { count: number };
  return result.count;
}

// This one is correct - single row expected
export function getTotalRevenue(): number {
  const result = db.query(
    "SELECT COALESCE(SUM(price * quantity), 0) as total FROM orders"
  ).get() as { total: number };
  return result.total;
}

// BUG: Only returns first matching order
export function getRecentOrders(days: number): Order[] {
  const result = db
    .query(
      `SELECT * FROM orders
       WHERE created_at >= datetime('now', '-' || ? || ' days')
       ORDER BY created_at DESC`
    )
    .get(days);

  return result ? [result as Order] : [];
}

export function resetDatabase() {
  db.run("DELETE FROM orders");
  db.run("DELETE FROM customers");
}

export { db };
