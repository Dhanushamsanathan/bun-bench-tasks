import { describe, test, expect, beforeEach } from "bun:test";
import {
  createCustomer,
  createOrder,
  updateOrderStatus,
  getOrdersByCustomer,
  getOrdersByStatus,
  searchOrders,
  getCustomersByTier,
  getCustomerOrderTotal,
  getSalesByProduct,
  getTopCustomers,
  getPendingOrders,
  getDailyOrderReport,
  getOrderCount,
  getTotalRevenue,
  getRecentOrders,
  resetDatabase,
} from "../src/reports";

describe("Query All vs Get", () => {
  beforeEach(() => {
    resetDatabase();
  });

  test("should return all orders for a customer", () => {
    const customerId = createCustomer("Alice", "alice@test.com");

    createOrder(customerId, "Widget", 2, 10.0);
    createOrder(customerId, "Gadget", 1, 25.0);
    createOrder(customerId, "Gizmo", 3, 15.0);

    const orders = getOrdersByCustomer(customerId);

    // BUG: This test FAILS - only returns 1 order instead of 3
    expect(orders.length).toBe(3);
    expect(orders.map((o) => o.product).sort()).toEqual(["Gadget", "Gizmo", "Widget"]);
  });

  test("should return all orders with given status", () => {
    const customerId = createCustomer("Bob", "bob@test.com");

    const order1 = createOrder(customerId, "Product A", 1, 10.0);
    const order2 = createOrder(customerId, "Product B", 1, 20.0);
    const order3 = createOrder(customerId, "Product C", 1, 30.0);

    updateOrderStatus(order1, "shipped");
    updateOrderStatus(order2, "shipped");
    // order3 remains pending

    const shippedOrders = getOrdersByStatus("shipped");

    // BUG: This test FAILS - only returns 1 shipped order instead of 2
    expect(shippedOrders.length).toBe(2);
  });

  test("should return all matching products in search", () => {
    const customerId = createCustomer("Charlie", "charlie@test.com");

    createOrder(customerId, "Blue Widget", 1, 10.0);
    createOrder(customerId, "Red Widget", 2, 12.0);
    createOrder(customerId, "Green Widget", 1, 11.0);
    createOrder(customerId, "Gadget", 1, 25.0);

    const widgetOrders = searchOrders("Widget");

    // BUG: This test FAILS - only returns 1 widget order instead of 3
    expect(widgetOrders.length).toBe(3);
  });

  test("should return all customers in tier", () => {
    createCustomer("Premium1", "p1@test.com", "premium");
    createCustomer("Premium2", "p2@test.com", "premium");
    createCustomer("Premium3", "p3@test.com", "premium");
    createCustomer("Standard1", "s1@test.com", "standard");

    const premiumCustomers = getCustomersByTier("premium");

    // BUG: This test FAILS - only returns 1 premium customer instead of 3
    expect(premiumCustomers.length).toBe(3);
  });

  test("should calculate correct order total for customer", () => {
    const customerId = createCustomer("Diana", "diana@test.com");

    createOrder(customerId, "Item1", 2, 10.0); // 20.0
    createOrder(customerId, "Item2", 1, 50.0); // 50.0
    createOrder(customerId, "Item3", 3, 15.0); // 45.0

    const total = getCustomerOrderTotal(customerId);

    // BUG: This test FAILS - only calculates first order (20.0) instead of total (115.0)
    expect(total).toBe(115.0);
  });

  test("should return sales by all products", () => {
    const customerId = createCustomer("Eve", "eve@test.com");

    createOrder(customerId, "Alpha", 5, 10.0);
    createOrder(customerId, "Alpha", 3, 10.0);
    createOrder(customerId, "Beta", 2, 20.0);
    createOrder(customerId, "Gamma", 1, 50.0);

    const salesByProduct = getSalesByProduct();

    // BUG: This test FAILS - only returns 1 product instead of 3
    expect(salesByProduct.length).toBe(3);

    const alphaStats = salesByProduct.find((s) => s.product === "Alpha");
    expect(alphaStats?.total_quantity).toBe(8);
    expect(alphaStats?.total_revenue).toBe(80.0);
  });

  test("should return top N customers", () => {
    const c1 = createCustomer("Customer1", "c1@test.com");
    const c2 = createCustomer("Customer2", "c2@test.com");
    const c3 = createCustomer("Customer3", "c3@test.com");

    createOrder(c1, "Product", 1, 100.0); // 100
    createOrder(c2, "Product", 1, 200.0); // 200
    createOrder(c3, "Product", 1, 300.0); // 300

    const top2 = getTopCustomers(2);

    // BUG: This test FAILS - only returns 1 customer instead of 2
    expect(top2.length).toBe(2);
    expect(top2[0].name).toBe("Customer3"); // Highest spender
    expect(top2[1].name).toBe("Customer2"); // Second highest
  });

  test("should return all pending orders", () => {
    const customerId = createCustomer("Frank", "frank@test.com");

    createOrder(customerId, "Pending1", 1, 10.0);
    createOrder(customerId, "Pending2", 1, 20.0);
    createOrder(customerId, "Pending3", 1, 30.0);

    const pendingOrders = getPendingOrders();

    // BUG: This test FAILS - only returns 1 pending order instead of 3
    expect(pendingOrders.length).toBe(3);
  });

  test("should return complete daily report", () => {
    const customerId = createCustomer("Grace", "grace@test.com");

    // Create orders on different "days" by manipulating created_at
    // Note: In a real test, we'd mock dates. Here we just verify the grouping logic.
    createOrder(customerId, "Product1", 1, 10.0);
    createOrder(customerId, "Product2", 2, 20.0);
    createOrder(customerId, "Product3", 1, 30.0);

    const report = getDailyOrderReport();

    // All orders are same day in this test, but the query should still work
    // BUG: If there were multiple days, only the first would be returned
    expect(report.length).toBeGreaterThanOrEqual(1);

    // Verify totals are correct for all orders on this day
    const todayReport = report[0];
    expect(todayReport.order_count).toBe(3);
    expect(todayReport.total_revenue).toBe(80.0); // 10 + 40 + 30
  });

  test("getOrderCount should work correctly (single row expected)", () => {
    const customerId = createCustomer("Henry", "henry@test.com");

    createOrder(customerId, "Product1", 1, 10.0);
    createOrder(customerId, "Product2", 1, 20.0);
    createOrder(customerId, "Product3", 1, 30.0);

    // This uses .get() correctly because COUNT returns single row
    const count = getOrderCount();
    expect(count).toBe(3);
  });

  test("getTotalRevenue should work correctly (single row expected)", () => {
    const customerId = createCustomer("Ivy", "ivy@test.com");

    createOrder(customerId, "Product1", 2, 10.0); // 20
    createOrder(customerId, "Product2", 1, 30.0); // 30

    // This uses .get() correctly because SUM returns single row
    const revenue = getTotalRevenue();
    expect(revenue).toBe(50.0);
  });

  test("should return all recent orders", () => {
    const customerId = createCustomer("Jack", "jack@test.com");

    // All orders are created now, so they're all "recent"
    createOrder(customerId, "Recent1", 1, 10.0);
    createOrder(customerId, "Recent2", 1, 20.0);
    createOrder(customerId, "Recent3", 1, 30.0);

    const recentOrders = getRecentOrders(7);

    // BUG: This test FAILS - only returns 1 recent order instead of 3
    expect(recentOrders.length).toBe(3);
  });

  test("should handle empty results correctly", () => {
    const customerId = createCustomer("Kate", "kate@test.com");

    // No orders for this customer
    const orders = getOrdersByCustomer(customerId);
    expect(orders.length).toBe(0);

    // No shipped orders
    const shippedOrders = getOrdersByStatus("shipped");
    expect(shippedOrders.length).toBe(0);
  });

  test("should return correct data when multiple customers have orders", () => {
    const c1 = createCustomer("Customer1", "c1@test.com");
    const c2 = createCustomer("Customer2", "c2@test.com");

    createOrder(c1, "Product A", 1, 10.0);
    createOrder(c1, "Product B", 1, 20.0);
    createOrder(c2, "Product C", 1, 30.0);

    const c1Orders = getOrdersByCustomer(c1);
    const c2Orders = getOrdersByCustomer(c2);

    // BUG: This test FAILS for c1 - only gets 1 order instead of 2
    expect(c1Orders.length).toBe(2);
    expect(c2Orders.length).toBe(1);
  });
});
