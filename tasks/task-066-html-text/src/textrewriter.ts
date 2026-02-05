// BUG: Text handler doesn't properly accumulate chunks or preserve encoding
// This causes issues with multi-byte characters and text spanning multiple chunks

export async function replaceText(
  html: string,
  selector: string,
  oldText: string,
  newText: string
): Promise<string> {
  const rewriter = new HTMLRewriter().on(selector, {
    text(text) {
      // BUG: Replaces each chunk separately without accumulating
      // This breaks text that spans multiple chunks
      // Also doesn't check if this is the last chunk
      if (text.text.includes(oldText)) {
        text.replace(text.text.replace(oldText, newText));
      }
    },
  });

  const response = new Response(html);
  const result = await rewriter.transform(response).text();
  return result;
}

export async function transformTextContent(
  html: string,
  selector: string,
  transformer: (text: string) => string
): Promise<string> {
  const rewriter = new HTMLRewriter().on(selector, {
    text(text) {
      // BUG: Transforms each chunk separately
      // For functions like toUpperCase, this works per-chunk but is inefficient
      // For functions that need full text (like word count), this fails
      const transformed = transformer(text.text);
      text.replace(transformed);
    },
  });

  const response = new Response(html);
  const result = await rewriter.transform(response).text();
  return result;
}

export async function escapeHtmlEntities(
  html: string,
  selector: string
): Promise<string> {
  const rewriter = new HTMLRewriter().on(selector, {
    text(text) {
      // BUG: Using { html: true } when we want escaped text
      // This interprets the replacement as HTML, not escaping entities
      const escaped = text.text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
      // BUG: html: true causes double-interpretation of entities
      text.replace(escaped, { html: true });
    },
  });

  const response = new Response(html);
  const result = await rewriter.transform(response).text();
  return result;
}

export async function preserveUtf8Text(
  html: string,
  selector: string,
  prefix: string
): Promise<string> {
  const rewriter = new HTMLRewriter().on(selector, {
    text(text) {
      // BUG: Doesn't accumulate chunks before adding prefix
      // If text comes in multiple chunks, prefix gets added to first chunk only
      // or added multiple times if we try to handle each chunk
      if (text.text.trim()) {
        text.replace(prefix + text.text);
      }
    },
  });

  const response = new Response(html);
  const result = await rewriter.transform(response).text();
  return result;
}

export async function wrapTextWithTag(
  html: string,
  selector: string,
  tagName: string
): Promise<string> {
  const rewriter = new HTMLRewriter().on(selector, {
    text(text) {
      // BUG: Wrapping each chunk creates invalid HTML with multiple wrapper tags
      // e.g., "Hello World" in 2 chunks becomes "<span>Hello</span><span> World</span>"
      if (text.text.trim()) {
        text.replace(`<${tagName}>${text.text}</${tagName}>`, { html: true });
      }
    },
  });

  const response = new Response(html);
  const result = await rewriter.transform(response).text();
  return result;
}

export async function countAndReplaceWords(
  html: string,
  selector: string
): Promise<{ html: string; wordCount: number }> {
  let wordCount = 0;

  const rewriter = new HTMLRewriter().on(selector, {
    text(text) {
      // BUG: Counting words per chunk gives incorrect totals
      // "Hello World" split as "Hello Wor" + "ld" counts as 3 words instead of 2
      const words = text.text.trim().split(/\s+/).filter(w => w.length > 0);
      wordCount += words.length;
    },
  });

  const response = new Response(html);
  const resultHtml = await rewriter.transform(response).text();

  return { html: resultHtml, wordCount };
}

// Example usage
if (import.meta.main) {
  const html = `
    <html>
      <body>
        <p class="content">Hello World, this is a test.</p>
        <div class="special">Special chars: <>&"'</div>
        <span class="utf8">Japanese: ___</span>
      </body>
    </html>
  `;

  console.log("Original HTML:", html);

  const replaced = await replaceText(html, "p.content", "World", "Universe");
  console.log("\nWith text replaced:", replaced);

  const upper = await transformTextContent(html, "p.content", (t) => t.toUpperCase());
  console.log("\nUppercased:", upper);

  const escaped = await escapeHtmlEntities(html, "div.special");
  console.log("\nEscaped entities:", escaped);

  const { html: countedHtml, wordCount } = await countAndReplaceWords(html, "p.content");
  console.log("\nWord count:", wordCount);
}
