import { describe, test, expect, beforeEach } from "bun:test";
import {
  sql,
  createEvent,
  getEvent,
  createProduct,
  getProduct,
  createEvents,
  getEventsBetweenDates,
  getEventsByMetadataKey,
  resetDatabase,
  type Event,
  type Product,
} from "../src/types";

describe("SQL Type Conversion", () => {
  beforeEach(async () => {
    await resetDatabase();
  });

  test("should properly store and retrieve Date objects", async () => {
    const eventDate = new Date("2025-06-15T10:30:00Z");

    const event: Event = {
      title: "Conference",
      event_date: eventDate,
      metadata: { location: "NYC" },
      tags: ["tech", "conference"],
    };

    const id = await createEvent(event);
    const retrieved = await getEvent(id);

    expect(retrieved).toBeDefined();
    // BUG: This fails because event_date is stored incorrectly
    expect(retrieved?.event_date).toBeInstanceOf(Date);
    expect(retrieved?.event_date.getTime()).toBe(eventDate.getTime());
  });

  test("should properly store and retrieve JSON objects", async () => {
    const metadata = {
      location: "San Francisco",
      capacity: 500,
      speakers: ["Alice", "Bob"],
      nested: { key: "value" },
    };

    const event: Event = {
      title: "Tech Talk",
      event_date: new Date(),
      metadata,
      tags: [],
    };

    const id = await createEvent(event);
    const retrieved = await getEvent(id);

    expect(retrieved).toBeDefined();
    // BUG: This fails because metadata is stored as "[object Object]"
    expect(typeof retrieved?.metadata).toBe("object");
    expect(retrieved?.metadata.location).toBe("San Francisco");
    expect(retrieved?.metadata.capacity).toBe(500);
    expect(Array.isArray(retrieved?.metadata.speakers)).toBe(true);
  });

  test("should properly store and retrieve arrays", async () => {
    const tags = ["javascript", "bun", "database"];

    const event: Event = {
      title: "Bun Workshop",
      event_date: new Date(),
      metadata: {},
      tags,
    };

    const id = await createEvent(event);
    const retrieved = await getEvent(id);

    expect(retrieved).toBeDefined();
    // BUG: This fails because tags are not properly stored as JSON array
    expect(Array.isArray(retrieved?.tags)).toBe(true);
    expect(retrieved?.tags.length).toBe(3);
    expect(retrieved?.tags).toContain("javascript");
  });

  test("should handle empty arrays and objects", async () => {
    const event: Event = {
      title: "Empty Event",
      event_date: new Date(),
      metadata: {},
      tags: [],
    };

    const id = await createEvent(event);
    const retrieved = await getEvent(id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.metadata).toEqual({});
    expect(retrieved?.tags).toEqual([]);
  });

  test("should handle complex nested objects", async () => {
    const attributes = {
      dimensions: { width: 10, height: 20, depth: 5 },
      features: ["waterproof", "durable"],
      specs: {
        weight: "1.5kg",
        material: "aluminum",
        nested: { deep: { value: 42 } },
      },
    };

    const product: Product = {
      name: "Widget Pro",
      price_cents: 9999,
      attributes,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const id = await createProduct(product);
    const retrieved = await getProduct(id);

    expect(retrieved).toBeDefined();
    // BUG: This fails because attributes is stored incorrectly
    expect(retrieved?.attributes.dimensions.width).toBe(10);
    expect(retrieved?.attributes.specs.nested.deep.value).toBe(42);
  });

  test("should handle date comparisons in queries", async () => {
    const jan1 = new Date("2025-01-01T00:00:00Z");
    const jan15 = new Date("2025-01-15T00:00:00Z");
    const feb1 = new Date("2025-02-01T00:00:00Z");
    const mar1 = new Date("2025-03-01T00:00:00Z");

    await createEvent({
      title: "January Event",
      event_date: jan15,
      metadata: {},
      tags: [],
    });

    await createEvent({
      title: "February Event",
      event_date: feb1,
      metadata: {},
      tags: [],
    });

    // Query for events in January
    const januaryEvents = await getEventsBetweenDates(jan1, new Date("2025-01-31T23:59:59Z"));

    // BUG: Date comparison fails because dates are not properly formatted
    expect(januaryEvents.length).toBe(1);
    expect(januaryEvents[0].title).toBe("January Event");
  });

  test("should support JSON path queries", async () => {
    await createEvent({
      title: "NYC Event",
      event_date: new Date(),
      metadata: { city: "New York", country: "USA" },
      tags: [],
    });

    await createEvent({
      title: "LA Event",
      event_date: new Date(),
      metadata: { city: "Los Angeles", country: "USA" },
      tags: [],
    });

    // BUG: JSON queries fail because metadata is not stored as valid JSON
    const nycEvents = await getEventsByMetadataKey("city", "New York");
    expect(nycEvents.length).toBe(1);
    expect(nycEvents[0].title).toBe("NYC Event");
  });

  test("should handle large numbers without precision loss", async () => {
    const largeNumber = BigInt("9007199254740993"); // Larger than Number.MAX_SAFE_INTEGER

    const event: Event = {
      title: "Big Number Event",
      event_date: new Date(),
      metadata: {},
      tags: [],
      large_number: largeNumber,
    };

    const id = await createEvent(event);
    const retrieved = await getEvent(id);

    expect(retrieved).toBeDefined();
    // BUG: Large number may lose precision without proper handling
    expect(retrieved?.large_number).toBe(largeNumber);
  });

  test("should handle bulk insert with proper type conversion", async () => {
    const events: Event[] = [
      {
        title: "Event 1",
        event_date: new Date("2025-01-01"),
        metadata: { type: "workshop" },
        tags: ["education"],
      },
      {
        title: "Event 2",
        event_date: new Date("2025-02-01"),
        metadata: { type: "conference" },
        tags: ["networking"],
      },
    ];

    const ids = await createEvents(events);
    expect(ids.length).toBe(2);

    for (let i = 0; i < ids.length; i++) {
      const retrieved = await getEvent(ids[i]);
      expect(retrieved?.title).toBe(events[i].title);
      expect(retrieved?.event_date).toBeInstanceOf(Date);
      expect(typeof retrieved?.metadata).toBe("object");
      expect(Array.isArray(retrieved?.tags)).toBe(true);
    }
  });

  test("should handle special characters in JSON", async () => {
    const metadata = {
      description: 'Contains "quotes" and \'apostrophes\'',
      notes: "Line1\nLine2\tTabbed",
      special: "Unicode: \u2603 \u2764",
    };

    const event: Event = {
      title: "Special Chars",
      event_date: new Date(),
      metadata,
      tags: ["test's", 'tag"with"quotes'],
    };

    const id = await createEvent(event);
    const retrieved = await getEvent(id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.metadata.description).toBe(metadata.description);
    expect(retrieved?.tags).toContain("test's");
  });

  test("should handle null values in complex types", async () => {
    const metadata = {
      required: "value",
      optional: null,
      nested: { key: null },
    };

    const event: Event = {
      title: "Null Test",
      event_date: new Date(),
      metadata,
      tags: [],
    };

    const id = await createEvent(event);
    const retrieved = await getEvent(id);

    expect(retrieved).toBeDefined();
    expect(retrieved?.metadata.optional).toBeNull();
    expect(retrieved?.metadata.nested.key).toBeNull();
  });
});
