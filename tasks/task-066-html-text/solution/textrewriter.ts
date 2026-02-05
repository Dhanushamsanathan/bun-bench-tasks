// FIXED: Text handler properly accumulates chunks and preserves encoding
// Uses lastInTextNode to know when all text has been received

export async function replaceText(
  html: string,
  selector: string,
  oldText: string,
  newText: string
): Promise<string> {
  let buffer = "";

  const rewriter = new HTMLRewriter().on(selector, {
    text(text) {
      // FIXED: Accumulate all text chunks
      buffer += text.text;

      if (text.lastInTextNode) {
        // FIXED: Replace on complete text, then output
        const replaced = buffer.replace(oldText, newText);
        text.replace(replaced, { html: false });
        buffer = "";
      } else {
        // Remove intermediate chunks (they're accumulated in buffer)
        text.remove();
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
  let buffer = "";

  const rewriter = new HTMLRewriter().on(selector, {
    text(text) {
      // FIXED: Accumulate all chunks before transforming
      buffer += text.text;

      if (text.lastInTextNode) {
        // FIXED: Transform complete text
        const transformed = transformer(buffer);
        text.replace(transformed, { html: false });
        buffer = "";
      } else {
        text.remove();
      }
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
  let buffer = "";

  const rewriter = new HTMLRewriter().on(selector, {
    text(text) {
      buffer += text.text;

      if (text.lastInTextNode) {
        // Escape special HTML characters
        const escaped = buffer
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#39;");

        // FIXED: Use html: false so escaped entities appear as literal text
        text.replace(escaped, { html: false });
        buffer = "";
      } else {
        text.remove();
      }
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
  let buffer = "";
  let isFirstChunk = true;

  const rewriter = new HTMLRewriter().on(selector, {
    text(text) {
      // FIXED: Accumulate all chunks
      buffer += text.text;

      if (text.lastInTextNode) {
        // FIXED: Add prefix only once to the complete accumulated text
        if (buffer.trim()) {
          text.replace(prefix + buffer, { html: false });
        } else {
          // Keep whitespace-only as is
          text.replace(buffer, { html: false });
        }
        buffer = "";
        isFirstChunk = true;
      } else {
        text.remove();
        isFirstChunk = false;
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
  let buffer = "";

  const rewriter = new HTMLRewriter().on(selector, {
    text(text) {
      // FIXED: Accumulate all text before wrapping
      buffer += text.text;

      if (text.lastInTextNode) {
        // FIXED: Wrap complete text with single tag
        if (buffer.trim()) {
          text.replace(`<${tagName}>${buffer}</${tagName}>`, { html: true });
        } else {
          text.replace(buffer, { html: false });
        }
        buffer = "";
      } else {
        text.remove();
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
  let buffer = "";
  let wordCount = 0;

  const rewriter = new HTMLRewriter().on(selector, {
    text(text) {
      // FIXED: Accumulate all text before counting
      buffer += text.text;

      if (text.lastInTextNode) {
        // FIXED: Count words on complete text
        const words = buffer.trim().split(/\s+/).filter(w => w.length > 0);
        wordCount += words.length;
        buffer = "";
      }
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
        <span class="utf8">Japanese: \u3053\u3093\u306B\u3061\u306F</span>
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

  const wrapped = await wrapTextWithTag(html, "p.content", "strong");
  console.log("\nWrapped with tag:", wrapped);
}
