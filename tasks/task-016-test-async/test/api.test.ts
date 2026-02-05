import { test, expect } from "bun:test";
import { fetchData, fetchUser, fetchItems } from "../src/api";

// BUG: Missing await - test passes before assertion runs!
// The .then() callback runs AFTER the test completes
test("fetchData returns correct value", () => {
  fetchData().then(data => {
    expect(data.value).toBe(999); // Wrong value but test passes!
  });
});

// BUG: Same issue - using .then() without returning the promise
test("fetchUser returns user with correct id", () => {
  fetchUser(5).then(user => {
    expect(user.id).toBe(100); // Wrong id but test passes!
    expect(user.name).toBe("Wrong Name"); // Wrong name but test passes!
  });
});

// BUG: Nested .then() without any await or return
test("fetchItems returns all items", () => {
  fetchItems().then(items => {
    expect(items.length).toBe(10); // Wrong count but test passes!
    expect(items[0]).toBe("wrong"); // Wrong item but test passes!
  });
});

// BUG: Mixing async and .then() incorrectly
test("combined fetch operations", () => {
  fetchData().then(data => {
    fetchUser(data.value).then(user => {
      expect(user.name).toBe("Invalid"); // Never actually checked!
    });
  });
});
