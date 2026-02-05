// FIXED: Extracts all link types from HTML using HTMLRewriter
// Handles: a, img, script, link, video, audio, source, iframe, embed, object, form, area, base

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

  const rewriter = new HTMLRewriter()
    // FIXED: Extract href from anchor tags
    .on("a", {
      element(element) {
        const href = element.getAttribute("href");
        if (href) links.push(href);
      },
    })
    // FIXED: Extract src from images
    .on("img", {
      element(element) {
        const src = element.getAttribute("src");
        if (src) links.push(src);
        // Also extract srcset URLs
        const srcset = element.getAttribute("srcset");
        if (srcset) {
          parseSrcset(srcset).forEach(url => links.push(url));
        }
      },
    })
    // FIXED: Extract src from scripts
    .on("script", {
      element(element) {
        const src = element.getAttribute("src");
        if (src) links.push(src);
      },
    })
    // FIXED: Extract href from link tags (stylesheets, icons, etc.)
    .on("link", {
      element(element) {
        const href = element.getAttribute("href");
        if (href) links.push(href);
      },
    })
    // FIXED: Extract src from video tags
    .on("video", {
      element(element) {
        const src = element.getAttribute("src");
        if (src) links.push(src);
        const poster = element.getAttribute("poster");
        if (poster) links.push(poster);
      },
    })
    // FIXED: Extract src from audio tags
    .on("audio", {
      element(element) {
        const src = element.getAttribute("src");
        if (src) links.push(src);
      },
    })
    // FIXED: Extract src and srcset from source tags
    .on("source", {
      element(element) {
        const src = element.getAttribute("src");
        if (src) links.push(src);
        const srcset = element.getAttribute("srcset");
        if (srcset) {
          parseSrcset(srcset).forEach(url => links.push(url));
        }
      },
    })
    // FIXED: Extract src from iframes
    .on("iframe", {
      element(element) {
        const src = element.getAttribute("src");
        if (src) links.push(src);
      },
    })
    // FIXED: Extract src from embed tags
    .on("embed", {
      element(element) {
        const src = element.getAttribute("src");
        if (src) links.push(src);
      },
    })
    // FIXED: Extract data from object tags
    .on("object", {
      element(element) {
        const data = element.getAttribute("data");
        if (data) links.push(data);
      },
    })
    // FIXED: Extract action from form tags
    .on("form", {
      element(element) {
        const action = element.getAttribute("action");
        if (action) links.push(action);
      },
    })
    // FIXED: Extract href from area tags (image maps)
    .on("area", {
      element(element) {
        const href = element.getAttribute("href");
        if (href) links.push(href);
      },
    })
    // FIXED: Extract href from base tag
    .on("base", {
      element(element) {
        const href = element.getAttribute("href");
        if (href) links.push(href);
      },
    });

  const response = new Response(html);
  await rewriter.transform(response).text();

  return links;
}

// Helper function to parse srcset attribute
function parseSrcset(srcset: string): string[] {
  return srcset
    .split(",")
    .map(entry => entry.trim().split(/\s+/)[0])
    .filter(url => url.length > 0);
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

  const rewriter = new HTMLRewriter()
    // Anchors
    .on("a", {
      element(element) {
        const href = element.getAttribute("href");
        if (href) result.anchors.push(href);
      },
    })
    .on("area", {
      element(element) {
        const href = element.getAttribute("href");
        if (href) result.anchors.push(href);
      },
    })
    // Images
    .on("img", {
      element(element) {
        const src = element.getAttribute("src");
        if (src) result.images.push(src);
        const srcset = element.getAttribute("srcset");
        if (srcset) {
          parseSrcset(srcset).forEach(url => result.images.push(url));
        }
      },
    })
    // Scripts
    .on("script", {
      element(element) {
        const src = element.getAttribute("src");
        if (src) result.scripts.push(src);
      },
    })
    // Stylesheets and other link types
    .on("link", {
      element(element) {
        const href = element.getAttribute("href");
        const rel = element.getAttribute("rel") || "";

        if (href) {
          if (rel === "stylesheet") {
            result.stylesheets.push(href);
          } else if (rel === "icon" || rel === "shortcut icon" || rel === "apple-touch-icon") {
            result.images.push(href);
          } else {
            result.other.push(href);
          }
        }
      },
    })
    // Video
    .on("video", {
      element(element) {
        const src = element.getAttribute("src");
        if (src) result.media.push(src);
        const poster = element.getAttribute("poster");
        if (poster) result.images.push(poster);
      },
    })
    // Audio
    .on("audio", {
      element(element) {
        const src = element.getAttribute("src");
        if (src) result.media.push(src);
      },
    })
    // Source (for video/audio)
    .on("source", {
      element(element) {
        const src = element.getAttribute("src");
        if (src) result.media.push(src);
        const srcset = element.getAttribute("srcset");
        if (srcset) {
          parseSrcset(srcset).forEach(url => result.images.push(url));
        }
      },
    })
    // Iframes
    .on("iframe", {
      element(element) {
        const src = element.getAttribute("src");
        if (src) result.other.push(src);
      },
    })
    // Embeds
    .on("embed", {
      element(element) {
        const src = element.getAttribute("src");
        if (src) result.other.push(src);
      },
    })
    // Objects
    .on("object", {
      element(element) {
        const data = element.getAttribute("data");
        if (data) result.other.push(data);
      },
    })
    // Forms
    .on("form", {
      element(element) {
        const action = element.getAttribute("action");
        if (action) result.other.push(action);
      },
    });

  const response = new Response(html);
  await rewriter.transform(response).text();

  return result;
}

export async function extractAllUrls(html: string): Promise<Set<string>> {
  const links = await extractLinks(html);
  return new Set(links);
}

export async function extractExternalLinks(html: string, baseHost: string): Promise<string[]> {
  const allLinks = await extractLinks(html);
  const externalLinks: string[] = [];

  for (const link of allLinks) {
    try {
      const url = new URL(link, `https://${baseHost}`);
      if (url.host !== baseHost) {
        externalLinks.push(link);
      }
    } catch {
      // Invalid URL, skip
    }
  }

  return externalLinks;
}

export async function extractSrcsetUrls(html: string): Promise<string[]> {
  const urls: string[] = [];

  const rewriter = new HTMLRewriter()
    .on("img", {
      element(element) {
        const srcset = element.getAttribute("srcset");
        if (srcset) {
          parseSrcset(srcset).forEach(url => urls.push(url));
        }
      },
    })
    .on("source", {
      element(element) {
        const srcset = element.getAttribute("srcset");
        if (srcset) {
          parseSrcset(srcset).forEach(url => urls.push(url));
        }
      },
    });

  const response = new Response(html);
  await rewriter.transform(response).text();

  return urls;
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
