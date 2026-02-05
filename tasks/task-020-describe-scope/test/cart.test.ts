import { test, expect, describe } from "bun:test";
import { ShoppingCart, createOrder } from "../src/cart";

describe("ShoppingCart", () => {
  // BUG: Shared cart instance across all tests!
  const cart = new ShoppingCart();

  // BUG: Shared test data that gets modified
  const testItems = [
    { id: "1", name: "Apple", price: 1.5 },
    { id: "2", name: "Banana", price: 0.75 },
    { id: "3", name: "Orange", price: 2.0 },
  ];

  test("starts empty", () => {
    // This might fail if another test ran first and added items!
    expect(cart.isEmpty()).toBe(true);
    expect(cart.getItemCount()).toBe(0);
  });

  test("can add items", () => {
    // BUG: Modifies shared cart state
    cart.addItem(testItems[0]);
    cart.addItem(testItems[1], 2);

    expect(cart.getItemCount()).toBe(2);
    expect(cart.getTotalQuantity()).toBe(3);
  });

  test("calculates subtotal correctly", () => {
    // BUG: Depends on items added in previous test!
    // Expected: 1.5 + (0.75 * 2) = 3.0
    // But if "starts empty" runs after "can add items", cart is not empty!
    expect(cart.getSubtotal()).toBe(3.0);
  });

  test("can apply discount", () => {
    // BUG: Modifies shared discount state
    cart.applyDiscount(10);
    expect(cart.getDiscount()).toBe(10);
    expect(cart.getTotal()).toBe(2.7); // 3.0 - 10% = 2.7
  });

  test("can add more items", () => {
    // BUG: Cart already has items and discount from previous tests!
    cart.addItem(testItems[2], 3);
    // If this runs after discount test: 3 existing + 3 new = wrong total
    expect(cart.getTotalQuantity()).toBe(6); // Expects 6, but depends on order!
  });

  test("can remove items", () => {
    // BUG: Depends on what's currently in the cart
    const removed = cart.removeItem("1");
    expect(removed).toBe(true);
    // Item count depends on previous tests!
  });

  test("handles empty cart total", () => {
    // BUG: This expects cart to be cleared, but it's not!
    // Previous tests have added items
    expect(cart.getTotal()).toBe(0); // FAILS - cart has items!
  });
});

describe("createOrder", () => {
  // BUG: Shared cart for order tests
  const cart = new ShoppingCart();

  // BUG: No reset of order counter between tests!
  test("creates order with incrementing ID", () => {
    cart.addItem({ id: "x", name: "Test", price: 10 });
    const order = createOrder(cart);
    // BUG: Order ID depends on how many orders were created in previous test runs!
    expect(order.orderId).toBe(1); // May fail if tests ran before!
  });

  test("creates second order with next ID", () => {
    const order = createOrder(cart);
    // BUG: Assumes previous test ran and created order 1
    expect(order.orderId).toBe(2);
  });

  test("order ID starts at 1 for fresh cart", () => {
    // BUG: Counter was never reset!
    const freshCart = new ShoppingCart();
    freshCart.addItem({ id: "y", name: "Fresh", price: 5 });
    const order = createOrder(freshCart);
    expect(order.orderId).toBe(1); // FAILS - counter is already at 2 or more!
  });
});

describe("ShoppingCart - accumulating errors", () => {
  // BUG: Counter that accumulates across tests
  let addCount = 0;
  const cart = new ShoppingCart();

  test("first add", () => {
    cart.addItem({ id: "a", name: "A", price: 1 });
    addCount++;
    expect(addCount).toBe(1);
  });

  test("second add", () => {
    cart.addItem({ id: "b", name: "B", price: 2 });
    addCount++;
    // BUG: This depends on first test having run
    expect(addCount).toBe(2);
    expect(cart.getItemCount()).toBe(2);
  });

  test("check total adds", () => {
    // BUG: Relies on accumulated state from both previous tests
    expect(addCount).toBe(2);
    expect(cart.getSubtotal()).toBe(3); // 1 + 2
  });

  test("independent check - but it's not!", () => {
    // BUG: This looks independent but cart and addCount are polluted
    expect(cart.isEmpty()).toBe(true); // FAILS!
    expect(addCount).toBe(0); // FAILS!
  });
});
