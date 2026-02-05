// BUG: Link extraction only handles <a> tags, missing many link types
// Missing: img src, script src, link href, video/audio src, iframe, srcset, etc.

export interface ExtractedLinks {
  anchors: string[];
  images: string[];
  scripts: string[];
  stylesheets: string[];
  media: string[];
  other: string[];
}

export async function extractLinks(html: string): Promise<string[]> {
  const links: string[] = [];

  const rewriter = new HTMLRewriter().on("a", {
    element(element) {
      // BUG: Only extracts href from anchor tags
      const href = element.getAttribute("href");
      if (href) {
        links.push(href);
      }
    },
  });

  const response = new Response(html);
  await rewriter.transform(response).text();

  return links;
}

export async function extractCategorizedLinks(html: string): Promise<ExtractedLinks> {
  const result: ExtractedLinks = {
    anchors: [],
    images: [],
    scripts: [],
    stylesheets: [],
    media: [],
    other: [],
  };

  // BUG: Only handles <a> and <link> tags, missing many others
  const rewriter = new HTMLRewriter()
    .on("a", {
      element(element) {
        const href = element.getAttribute("href");
        if (href) {
          result.anchors.push(href);
        }
      },
    })
    .on("link", {
      element(element) {
        const href = element.getAttribute("href");
        const rel = element.getAttribute("rel");
        if (href && rel === "stylesheet") {
          result.stylesheets.push(href);
        }
        // BUG: Missing other link types like preload, icon, etc.
      },
    });

  // BUG: Missing handlers for:
  // - img (src, srcset)
  // - script (src)
  // - video, audio (src)
  // - source (src, srcset)
  // - iframe (src)
  // - embed (src)
  // - object (data)
  // - form (action)

  const response = new Response(html);
  await rewriter.transform(response).text();

  return result;
}

export async function extractAllUrls(html: string): Promise<Set<string>> {
  const urls = new Set<string>();

  // BUG: This regex-based approach misses many URLs and is unreliable
  // It also runs after HTMLRewriter, mixing approaches incorrectly
  const rewriter = new HTMLRewriter().on("a", {
    element(element) {
      const href = element.getAttribute("href");
      if (href) {
        urls.add(href);
      }
    },
  });

  const response = new Response(html);
  await rewriter.transform(response).text();

  return urls;
}

export async function extractExternalLinks(html: string, baseHost: string): Promise<string[]> {
  const externalLinks: string[] = [];

  // BUG: Only checks <a> tags for external links
  // External resources in <img>, <script>, etc. are ignored
  const rewriter = new HTMLRewriter().on("a", {
    element(element) {
      const href = element.getAttribute("href");
      if (href) {
        try {
          const url = new URL(href, `https://${baseHost}`);
          if (url.host !== baseHost) {
            externalLinks.push(href);
          }
        } catch {
          // Invalid URL, skip
        }
      }
    },
  });

  const response = new Response(html);
  await rewriter.transform(response).text();

  return externalLinks;
}

export async function extractSrcsetUrls(html: string): Promise<string[]> {
  // BUG: Doesn't extract srcset values at all
  // srcset has a special format: "url1 1x, url2 2x" or "url1 300w, url2 600w"
  return [];
}

// Example usage
if (import.meta.main) {
  const html = `
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
        <img src="/images/photo.jpg" srcset="/images/photo-2x.jpg 2x, /images/photo-3x.jpg 3x">
        <video src="/video/intro.mp4" poster="/images/poster.jpg">
          <source src="/video/intro.webm" type="video/webm">
        </video>
        <iframe src="https://embed.example.com/widget"></iframe>
        <form action="/submit">
          <input type="submit">
        </form>
      </body>
    </html>
  `;

  console.log("Extracting links from HTML...\n");

  const allLinks = await extractLinks(html);
  console.log("All links found:", allLinks);

  const categorized = await extractCategorizedLinks(html);
  console.log("\nCategorized links:", categorized);

  const external = await extractExternalLinks(html, "mysite.com");
  console.log("\nExternal links:", external);

  const srcset = await extractSrcsetUrls(html);
  console.log("\nSrcset URLs:", srcset);
}
