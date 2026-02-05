// BUG: Does not actually set attributes - stores values in variable but never calls setAttribute
// The code reads attributes correctly but fails to write them back

export async function addClassToLinks(html: string, className: string): Promise<string> {
  const rewriter = new HTMLRewriter().on("a", {
    element(element) {
      const existingClass = element.getAttribute("class") || "";
      const newClass = existingClass ? `${existingClass} ${className}` : className;
      // BUG: Stores the new class but never sets it back on the element
      // Missing: element.setAttribute("class", newClass);
      const _unused = newClass; // This line does nothing useful
    },
  });

  const response = new Response(html);
  const result = await rewriter.transform(response).text();
  return result;
}

export async function addTargetToExternalLinks(html: string): Promise<string> {
  const rewriter = new HTMLRewriter().on("a", {
    element(element) {
      const href = element.getAttribute("href") || "";
      if (href.startsWith("http://") || href.startsWith("https://")) {
        // BUG: Constructs values but never sets them on element
        const target = "_blank";
        const rel = "noopener noreferrer";
        // Missing: element.setAttribute("target", target);
        // Missing: element.setAttribute("rel", rel);
      }
    },
  });

  const response = new Response(html);
  const result = await rewriter.transform(response).text();
  return result;
}

export async function addDataAttributes(
  html: string,
  selector: string,
  dataAttrs: Record<string, string>
): Promise<string> {
  const rewriter = new HTMLRewriter().on(selector, {
    element(element) {
      for (const [key, value] of Object.entries(dataAttrs)) {
        // BUG: Computes the attribute name but never sets it
        const attrName = `data-${key}`;
        const attrValue = value;
        // Missing: element.setAttribute(attrName, attrValue);
      }
    },
  });

  const response = new Response(html);
  const result = await rewriter.transform(response).text();
  return result;
}

export async function updateImageSources(
  html: string,
  cdnPrefix: string
): Promise<string> {
  const rewriter = new HTMLRewriter().on("img", {
    element(element) {
      const src = element.getAttribute("src");
      if (src && !src.startsWith("http")) {
        // BUG: Computes new src but never sets it
        const newSrc = `${cdnPrefix}${src}`;
        // Missing: element.setAttribute("src", newSrc);
      }
    },
  });

  const response = new Response(html);
  const result = await rewriter.transform(response).text();
  return result;
}

export async function removeAttribute(
  html: string,
  selector: string,
  attribute: string
): Promise<string> {
  const rewriter = new HTMLRewriter().on(selector, {
    element(element) {
      // BUG: Checks if attribute exists but never removes it
      const hasAttr = element.getAttribute(attribute) !== null;
      // Missing: element.removeAttribute(attribute);
    },
  });

  const response = new Response(html);
  const result = await rewriter.transform(response).text();
  return result;
}

// Example usage
if (import.meta.main) {
  const html = `
    <html>
      <body>
        <a href="https://example.com">External Link</a>
        <a href="/internal">Internal Link</a>
        <img src="/images/photo.jpg" alt="Photo">
        <div id="content">Hello</div>
      </body>
    </html>
  `;

  console.log("Original HTML:", html);

  const withClass = await addClassToLinks(html, "styled-link");
  console.log("\nWith class added:", withClass);

  const withTarget = await addTargetToExternalLinks(html);
  console.log("\nWith target added:", withTarget);

  const withData = await addDataAttributes(html, "div", { tracking: "enabled", version: "1.0" });
  console.log("\nWith data attributes:", withData);

  const withCdn = await updateImageSources(html, "https://cdn.example.com");
  console.log("\nWith CDN prefix:", withCdn);
}
