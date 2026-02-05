// FIXED: Uses correct setAttribute() API to modify element attributes
// HTMLRewriter elements have setAttribute(), getAttribute(), removeAttribute() methods

export async function addClassToLinks(html: string, className: string): Promise<string> {
  const rewriter = new HTMLRewriter().on("a", {
    element(element) {
      const existingClass = element.getAttribute("class") || "";
      const newClass = existingClass ? `${existingClass} ${className}` : className;
      // FIXED: Use element.setAttribute() instead of attributes.set()
      element.setAttribute("class", newClass);
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
        // FIXED: Use setAttribute() to add new attributes
        element.setAttribute("target", "_blank");
        element.setAttribute("rel", "noopener noreferrer");
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
        // FIXED: Use setAttribute() for each data attribute
        element.setAttribute(`data-${key}`, value);
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
        // FIXED: Use setAttribute() to update src
        element.setAttribute("src", `${cdnPrefix}${src}`);
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
      // FIXED: Use removeAttribute() method
      element.removeAttribute(attribute);
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
