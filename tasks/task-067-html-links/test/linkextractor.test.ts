import { expect, test, describe } from "bun:test";
import {
  extractLinks,
  extractCategorizedLinks,
  extractAllUrls,
  extractExternalLinks,
  extractSrcsetUrls,
} from "../src/linkextractor";

describe("HTMLRewriter Link Extraction", () => {
  const sampleHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <link rel="stylesheet" href="/styles/main.css">
        <link rel="icon" href="/favicon.ico">
        <script src="/js/app.js"></script>
      </head>
      <body>
        <a href="https://example.com">External Link</a>
        <a href="/internal">Internal Link</a>
        <img src="/images/photo.jpg" alt="Photo">
        <video src="/video/intro.mp4">
          <source src="/video/intro.webm" type="video/webm">
        </video>
        <iframe src="https://embed.example.com/widget"></iframe>
      </body>
    </html>
  `;

  test("should extract anchor links", async () => {
    const html = '<a href="/page1">Link 1</a><a href="/page2">Link 2</a>';
    const links = await extractLinks(html);

    expect(links).toContain("/page1");
    expect(links).toContain("/page2");
    expect(links.length).toBe(2);
  });

  test("should extract image sources", async () => {
    const html = '<img src="/image1.jpg"><img src="/image2.png">';
    const links = await extractLinks(html);

    // This test FAILS because the buggy code only extracts <a> hrefs
    expect(links).toContain("/image1.jpg");
    expect(links).toContain("/image2.png");
  });

  test("should extract script sources", async () => {
    const html = '<script src="/js/main.js"></script><script src="/js/vendor.js"></script>';
    const links = await extractLinks(html);

    // This test FAILS because script sources are not extracted
    expect(links).toContain("/js/main.js");
    expect(links).toContain("/js/vendor.js");
  });

  test("should extract stylesheet links", async () => {
    const html = '<link rel="stylesheet" href="/css/style.css">';
    const links = await extractLinks(html);

    // This test FAILS because link hrefs are not extracted
    expect(links).toContain("/css/style.css");
  });

  test("should extract iframe sources", async () => {
    const html = '<iframe src="https://embed.example.com/widget"></iframe>';
    const links = await extractLinks(html);

    // This test FAILS because iframe sources are not extracted
    expect(links).toContain("https://embed.example.com/widget");
  });

  test("should extract video and source tags", async () => {
    const html = `
      <video src="/video/main.mp4">
        <source src="/video/main.webm" type="video/webm">
      </video>
    `;
    const links = await extractLinks(html);

    // This test FAILS because media sources are not extracted
    expect(links).toContain("/video/main.mp4");
    expect(links).toContain("/video/main.webm");
  });

  test("should extract form actions", async () => {
    const html = '<form action="/submit"><input type="submit"></form>';
    const links = await extractLinks(html);

    // This test FAILS because form actions are not extracted
    expect(links).toContain("/submit");
  });

  test("should categorize links correctly", async () => {
    const categorized = await extractCategorizedLinks(sampleHtml);

    // Anchors
    expect(categorized.anchors).toContain("https://example.com");
    expect(categorized.anchors).toContain("/internal");

    // Images - This FAILS because images aren't categorized
    expect(categorized.images).toContain("/images/photo.jpg");

    // Scripts - This FAILS because scripts aren't categorized
    expect(categorized.scripts).toContain("/js/app.js");

    // Stylesheets
    expect(categorized.stylesheets).toContain("/styles/main.css");

    // Media - This FAILS because media isn't categorized
    expect(categorized.media).toContain("/video/intro.mp4");
    expect(categorized.media).toContain("/video/intro.webm");
  });

  test("should extract all unique URLs", async () => {
    const urls = await extractAllUrls(sampleHtml);

    // This test FAILS because not all URL types are extracted
    expect(urls.size).toBeGreaterThanOrEqual(8); // At minimum: 2 links, 2 anchors, 1 img, 1 script, 2 video, 1 iframe
  });

  test("should extract external links from all sources", async () => {
    const html = `
      <a href="https://external.com/page">External Anchor</a>
      <a href="/internal">Internal</a>
      <img src="https://cdn.external.com/image.jpg">
      <script src="https://cdn.external.com/script.js"></script>
      <iframe src="https://embed.external.com/widget"></iframe>
    `;
    const external = await extractExternalLinks(html, "mysite.com");

    // This test FAILS because only <a> tags are checked for external links
    expect(external).toContain("https://external.com/page");
    expect(external).toContain("https://cdn.external.com/image.jpg");
    expect(external).toContain("https://cdn.external.com/script.js");
    expect(external).toContain("https://embed.external.com/widget");
    expect(external.length).toBe(4);
  });

  test("should not include internal links in external results", async () => {
    const html = `
      <a href="/internal">Internal</a>
      <a href="https://mysite.com/page">Same domain</a>
    `;
    const external = await extractExternalLinks(html, "mysite.com");

    expect(external).not.toContain("/internal");
    expect(external).not.toContain("https://mysite.com/page");
  });

  test("should extract srcset URLs", async () => {
    const html = `
      <img src="/image.jpg" srcset="/image-2x.jpg 2x, /image-3x.jpg 3x">
      <source srcset="/hero-small.jpg 300w, /hero-medium.jpg 600w, /hero-large.jpg 1200w">
    `;
    const srcsetUrls = await extractSrcsetUrls(html);

    // This test FAILS because srcset is not parsed
    expect(srcsetUrls).toContain("/image-2x.jpg");
    expect(srcsetUrls).toContain("/image-3x.jpg");
    expect(srcsetUrls).toContain("/hero-small.jpg");
    expect(srcsetUrls).toContain("/hero-medium.jpg");
    expect(srcsetUrls).toContain("/hero-large.jpg");
  });

  test("should handle empty HTML", async () => {
    const links = await extractLinks("");
    expect(links).toEqual([]);
  });

  test("should handle HTML without links", async () => {
    const html = "<p>No links here</p><div>Just text</div>";
    const links = await extractLinks(html);

    expect(links).toEqual([]);
  });

  test("should handle malformed URLs gracefully", async () => {
    const html = '<a href="not a valid url">Link</a><a href="">Empty</a>';
    const links = await extractLinks(html);

    // Should still extract the href values even if malformed
    expect(links).toContain("not a valid url");
  });

  test("should extract links with special characters", async () => {
    const html = '<a href="/search?q=hello+world&lang=en">Search</a>';
    const links = await extractLinks(html);

    expect(links).toContain("/search?q=hello+world&lang=en");
  });
});
