/**
 * Shopping cart implementation.
 */

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export class ShoppingCart {
  private items: CartItem[] = [];
  private discount: number = 0;

  /**
   * Adds an item to the cart.
   */
  addItem(item: Omit<CartItem, "quantity">, quantity: number = 1): void {
    const existing = this.items.find((i) => i.id === item.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      this.items.push({ ...item, quantity });
    }
  }

  /**
   * Removes an item from the cart.
   */
  removeItem(id: string): boolean {
    const index = this.items.findIndex((i) => i.id === id);
    if (index !== -1) {
      this.items.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Updates the quantity of an item.
   */
  updateQuantity(id: string, quantity: number): boolean {
    const item = this.items.find((i) => i.id === id);
    if (item) {
      if (quantity <= 0) {
        return this.removeItem(id);
      }
      item.quantity = quantity;
      return true;
    }
    return false;
  }

  /**
   * Gets all items in the cart.
   */
  getItems(): CartItem[] {
    return [...this.items];
  }

  /**
   * Gets the number of unique items.
   */
  getItemCount(): number {
    return this.items.length;
  }

  /**
   * Gets the total quantity of all items.
   */
  getTotalQuantity(): number {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  /**
   * Calculates the subtotal before discount.
   */
  getSubtotal(): number {
    return this.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  /**
   * Applies a discount percentage.
   */
  applyDiscount(percent: number): void {
    this.discount = Math.min(100, Math.max(0, percent));
  }

  /**
   * Gets the current discount.
   */
  getDiscount(): number {
    return this.discount;
  }

  /**
   * Calculates the total after discount.
   */
  getTotal(): number {
    const subtotal = this.getSubtotal();
    return subtotal - subtotal * (this.discount / 100);
  }

  /**
   * Clears all items from the cart.
   */
  clear(): void {
    this.items = [];
    this.discount = 0;
  }

  /**
   * Checks if the cart is empty.
   */
  isEmpty(): boolean {
    return this.items.length === 0;
  }
}

/**
 * Global counter for demonstration of shared state issues.
 */
let orderCounter = 0;

/**
 * Creates an order from the cart.
 */
export function createOrder(cart: ShoppingCart): {
  orderId: number;
  items: CartItem[];
  total: number;
} {
  orderCounter++;
  return {
    orderId: orderCounter,
    items: cart.getItems(),
    total: cart.getTotal(),
  };
}

/**
 * Resets the order counter (for testing).
 */
export function resetOrderCounter(): void {
  orderCounter = 0;
}
