/**
 * Simulates an async API call that returns data after a delay.
 */
export async function fetchData(): Promise<{ value: number }> {
  await Bun.sleep(10);
  return { value: 42 };
}

/**
 * Fetches user data from a simulated API.
 */
export async function fetchUser(id: number): Promise<{ id: number; name: string }> {
  await Bun.sleep(5);
  return { id, name: `User ${id}` };
}

/**
 * Fetches multiple items with a delay.
 */
export async function fetchItems(): Promise<string[]> {
  await Bun.sleep(15);
  return ["item1", "item2", "item3"];
}
