import { test, expect, describe, beforeEach } from "bun:test";
import { ShoppingCart, createOrder, resetOrderCounter } from "../src/cart";

describe("ShoppingCart", () => {
  // FIXED: Declare cart variable, initialize in beforeEach
  let cart: ShoppingCart;

  // FIXED: Test data is read-only, safe to share
  const testItems = [
    { id: "1", name: "Apple", price: 1.5 },
    { id: "2", name: "Banana", price: 0.75 },
    { id: "3", name: "Orange", price: 2.0 },
  ] as const;

  // FIXED: Reset cart before each test
  beforeEach(() => {
    cart = new ShoppingCart();
  });

  test("starts empty", () => {
    // Now always works - fresh cart every time
    expect(cart.isEmpty()).toBe(true);
    expect(cart.getItemCount()).toBe(0);
  });

  test("can add items", () => {
    // Fresh cart, no pollution from other tests
    cart.addItem(testItems[0]);
    cart.addItem(testItems[1], 2);

    expect(cart.getItemCount()).toBe(2);
    expect(cart.getTotalQuantity()).toBe(3);
  });

  test("calculates subtotal correctly", () => {
    // FIXED: Each test sets up its own state
    cart.addItem(testItems[0]); // 1.5
    cart.addItem(testItems[1], 2); // 0.75 * 2 = 1.5
    expect(cart.getSubtotal()).toBe(3.0);
  });

  test("can apply discount", () => {
    // FIXED: Set up complete state within this test
    cart.addItem(testItems[0]); // 1.5
    cart.addItem(testItems[1], 2); // 1.5
    cart.applyDiscount(10);

    expect(cart.getDiscount()).toBe(10);
    expect(cart.getTotal()).toBe(2.7);
  });

  test("can add multiple items independently", () => {
    // FIXED: Independent of other tests
    cart.addItem(testItems[0], 2);
    cart.addItem(testItems[2], 3);

    expect(cart.getTotalQuantity()).toBe(5); // 2 + 3
    expect(cart.getSubtotal()).toBe(9.0); // (1.5 * 2) + (2.0 * 3)
  });

  test("can remove items", () => {
    // FIXED: Set up, then test
    cart.addItem(testItems[0]);
    cart.addItem(testItems[1]);

    const removed = cart.removeItem("1");
    expect(removed).toBe(true);
    expect(cart.getItemCount()).toBe(1);
  });

  test("handles empty cart total", () => {
    // FIXED: Fresh cart is truly empty
    expect(cart.getTotal()).toBe(0);
    expect(cart.isEmpty()).toBe(true);
  });
});

describe("createOrder", () => {
  let cart: ShoppingCart;

  // FIXED: Reset both cart and order counter
  beforeEach(() => {
    cart = new ShoppingCart();
    resetOrderCounter(); // Critical: reset global state
  });

  test("creates order with ID 1", () => {
    cart.addItem({ id: "x", name: "Test", price: 10 });
    const order = createOrder(cart);
    expect(order.orderId).toBe(1); // Always 1 after reset
  });

  test("creates order with ID 1 (independent)", () => {
    // FIXED: This is now truly independent
    cart.addItem({ id: "y", name: "Another", price: 20 });
    const order = createOrder(cart);
    expect(order.orderId).toBe(1); // Always 1 after reset
  });

  test("increments order ID within same test", () => {
    cart.addItem({ id: "a", name: "A", price: 5 });
    const order1 = createOrder(cart);
    const order2 = createOrder(cart);
    const order3 = createOrder(cart);

    expect(order1.orderId).toBe(1);
    expect(order2.orderId).toBe(2);
    expect(order3.orderId).toBe(3);
  });
});

describe("ShoppingCart - isolated tests", () => {
  // FIXED: Each test is completely independent

  test("first operation", () => {
    // Create cart locally within the test
    const cart = new ShoppingCart();
    cart.addItem({ id: "a", name: "A", price: 1 });
    expect(cart.getItemCount()).toBe(1);
  });

  test("second operation", () => {
    // Completely independent - own cart instance
    const cart = new ShoppingCart();
    cart.addItem({ id: "b", name: "B", price: 2 });
    expect(cart.getItemCount()).toBe(1); // Not 2!
  });

  test("independent verification", () => {
    // Fresh state, no pollution
    const cart = new ShoppingCart();
    expect(cart.isEmpty()).toBe(true);
    expect(cart.getSubtotal()).toBe(0);
  });
});

// FIXED: Alternative pattern using factory function
describe("ShoppingCart - factory pattern", () => {
  // Factory function creates fresh instances
  const createTestCart = () => {
    const cart = new ShoppingCart();
    // Optional: pre-populate with common test data
    return cart;
  };

  const createPopulatedCart = () => {
    const cart = new ShoppingCart();
    cart.addItem({ id: "1", name: "Apple", price: 1.5 });
    cart.addItem({ id: "2", name: "Banana", price: 0.75 }, 2);
    return cart;
  };

  test("empty cart from factory", () => {
    const cart = createTestCart();
    expect(cart.isEmpty()).toBe(true);
  });

  test("populated cart from factory", () => {
    const cart = createPopulatedCart();
    expect(cart.getItemCount()).toBe(2);
    expect(cart.getSubtotal()).toBe(3.0);
  });

  test("another populated cart is independent", () => {
    const cart = createPopulatedCart();
    cart.clear();
    expect(cart.isEmpty()).toBe(true);
    // Other tests using createPopulatedCart() are not affected
  });
});
