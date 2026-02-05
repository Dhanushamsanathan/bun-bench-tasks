import { expect, test, describe } from "bun:test";
import {
  addClassToLinks,
  addTargetToExternalLinks,
  addDataAttributes,
  updateImageSources,
  removeAttribute,
} from "../src/rewriter";

describe("HTMLRewriter Element Attributes", () => {
  test("should add class to links", async () => {
    const html = '<a href="/page">Click me</a>';
    const result = await addClassToLinks(html, "btn");

    // This test FAILS because the buggy code uses attributes.set() which doesn't work
    expect(result).toContain('class="btn"');
  });

  test("should append class to existing classes", async () => {
    const html = '<a href="/page" class="existing">Click me</a>';
    const result = await addClassToLinks(html, "new-class");

    // This test FAILS because attributes.set() doesn't work
    expect(result).toContain('class="existing new-class"');
  });

  test("should add target=_blank to external links", async () => {
    const html = '<a href="https://example.com">External</a>';
    const result = await addTargetToExternalLinks(html);

    // This test FAILS because the bug prevents attribute modification
    expect(result).toContain('target="_blank"');
    expect(result).toContain('rel="noopener noreferrer"');
  });

  test("should not add target to internal links", async () => {
    const html = '<a href="/internal">Internal</a>';
    const result = await addTargetToExternalLinks(html);

    // Internal links should not have target attribute
    expect(result).not.toContain('target="_blank"');
  });

  test("should add data attributes to elements", async () => {
    const html = '<div id="content">Hello</div>';
    const result = await addDataAttributes(html, "div", {
      tracking: "enabled",
      version: "2.0",
    });

    // This test FAILS because attributes.set() doesn't work
    expect(result).toContain('data-tracking="enabled"');
    expect(result).toContain('data-version="2.0"');
  });

  test("should update image sources with CDN prefix", async () => {
    const html = '<img src="/images/photo.jpg" alt="Photo">';
    const result = await updateImageSources(html, "https://cdn.example.com");

    // This test FAILS because the bug prevents attribute modification
    expect(result).toContain('src="https://cdn.example.com/images/photo.jpg"');
  });

  test("should not modify absolute URLs", async () => {
    const html = '<img src="https://other.com/image.jpg" alt="External">';
    const result = await updateImageSources(html, "https://cdn.example.com");

    // Absolute URLs should remain unchanged
    expect(result).toContain('src="https://other.com/image.jpg"');
  });

  test("should handle multiple elements", async () => {
    const html = `
      <a href="/page1">Link 1</a>
      <a href="/page2">Link 2</a>
      <a href="/page3">Link 3</a>
    `;
    const result = await addClassToLinks(html, "link-style");

    // All links should have the class
    const matches = result.match(/class="link-style"/g);
    // This test FAILS because attributes.set() doesn't work
    expect(matches?.length).toBe(3);
  });

  test("should remove attributes", async () => {
    const html = '<div id="test" class="remove-me" data-value="123">Content</div>';
    const result = await removeAttribute(html, "div", "class");

    // This test FAILS because attributes.delete() doesn't work
    expect(result).not.toContain('class="remove-me"');
    expect(result).toContain('id="test"');
    expect(result).toContain('data-value="123"');
  });

  test("should handle empty HTML", async () => {
    const html = "";
    const result = await addClassToLinks(html, "btn");

    expect(result).toBe("");
  });

  test("should preserve other attributes when adding new ones", async () => {
    const html = '<a href="/page" id="main-link" data-id="123">Click</a>';
    const result = await addClassToLinks(html, "styled");

    // Original attributes should be preserved
    expect(result).toContain('href="/page"');
    expect(result).toContain('id="main-link"');
    expect(result).toContain('data-id="123"');
    // New class should be added
    expect(result).toContain('class="styled"');
  });
});
