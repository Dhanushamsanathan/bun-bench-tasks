import { test, expect } from "bun:test";
import { fetchData, fetchUser, fetchItems } from "../src/api";

// FIXED: Use async/await to properly wait for assertions
test("fetchData returns correct value", async () => {
  const data = await fetchData();
  expect(data.value).toBe(42); // Correct value, test properly awaits
});

// FIXED: Proper async/await pattern
test("fetchUser returns user with correct id", async () => {
  const user = await fetchUser(5);
  expect(user.id).toBe(5);
  expect(user.name).toBe("User 5");
});

// FIXED: Proper async handling for array operations
test("fetchItems returns all items", async () => {
  const items = await fetchItems();
  expect(items.length).toBe(3);
  expect(items[0]).toBe("item1");
  expect(items).toEqual(["item1", "item2", "item3"]);
});

// FIXED: Sequential async operations with proper await
test("combined fetch operations", async () => {
  const data = await fetchData();
  const user = await fetchUser(data.value);
  expect(user.name).toBe("User 42");
});

// Alternative fix: Return the promise (less preferred but works)
test("fetchData with returned promise", () => {
  return fetchData().then(data => {
    expect(data.value).toBe(42);
  });
});
