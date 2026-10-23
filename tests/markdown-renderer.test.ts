import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import MarkdownRenderer from "../components/ui/MarkdownRenderer";

test("MarkdownRenderer Suite", async (t) => {
  await t.test("Requirement 3: Renders Headings (#, ##, ###)", () => {
    const markdown = "# Heading 1\n## Heading 2\n### Heading 3";
    const html = renderToStaticMarkup(React.createElement(MarkdownRenderer, { content: markdown }));
    
    assert.match(html, /<h1[^>]*>Heading 1<\/h1>/);
    assert.match(html, /<h2[^>]*>Heading 2<\/h2>/);
    assert.match(html, /<h3[^>]*>Heading 3<\/h3>/);
  });

  await t.test("Requirement 3: Renders Bold, Italic, Inline Code, and Fenced Code Blocks", () => {
    const markdown = "**bold text** and *italic text* and `inlineCode()`\n\n```python\ndef solve():\n    return 42\n```";
    const html = renderToStaticMarkup(React.createElement(MarkdownRenderer, { content: markdown }));
    
    assert.match(html, /<strong[^>]*>bold text<\/strong>/);
    assert.match(html, /<em[^>]*>italic text<\/em>/);
    assert.match(html, /<code[^>]*>inlineCode\(\)<\/code>/);
    assert.match(html, /solve\(\)/);
    assert.match(html, /PYTHON/); // Language badge
  });

  await t.test("Requirement 3: Renders Ordered and Unordered Lists, including nested lists", () => {
    const markdown = "- Item A\n- Item B\n  - Nested B1\n  - Nested B2\n\n1. First\n2. Second";
    const html = renderToStaticMarkup(React.createElement(MarkdownRenderer, { content: markdown }));
    
    assert.match(html, /<ul[^>]*>/);
    assert.match(html, /<ol[^>]*>/);
    assert.match(html, /Item A/);
    assert.match(html, /Nested B1/);
    assert.match(html, /First/);
  });

  await t.test("Requirement 3 & 4: Renders GFM Markdown Tables with responsive overflow container", () => {
    const markdown = `
| Algorithm | Time Complexity | Space Complexity |
| :--- | :--- | :--- |
| Binary Search | $O(\\log N)$ | $O(1)$ |
| Merge Sort | $O(N \\log N)$ | $O(N)$ |
`;
    const html = renderToStaticMarkup(React.createElement(MarkdownRenderer, { content: markdown }));
    
    assert.match(html, /<table[^>]*>/);
    assert.match(html, /<thead[^>]*>/);
    assert.match(html, /<th[^>]*>Algorithm<\/th>/);
    assert.match(html, /<td[^>]*>Binary Search<\/td>/);
    assert.match(html, /overflow-x:auto/);
  });

  await t.test("Requirement 3: Renders Blockquotes and Horizontal Rules", () => {
    const markdown = "> Critical architectural invariant: ensure idempotency.\n\n---";
    const html = renderToStaticMarkup(React.createElement(MarkdownRenderer, { content: markdown }));
    
    assert.match(html, /<blockquote[^>]*>/);
    assert.match(html, /Critical architectural invariant/);
    assert.match(html, /<hr[^>]*>/);
  });

  await t.test("Requirement 3: Renders Hindi/Hinglish text mixed with English technical terms", () => {
    const markdown = "Dhyan rahe ki **Indexing** ka use karke hum `$O(\\log N)$` me search kar sakte hain, lekin **Write amplification** badh jati hai.";
    const html = renderToStaticMarkup(React.createElement(MarkdownRenderer, { content: markdown }));
    
    assert.match(html, /Dhyan rahe ki/);
    assert.match(html, /<strong[^>]*>Indexing<\/strong>/);
    assert.match(html, /Write amplification/);
  });

  await t.test("Requirement 8: Handles incomplete/streaming markdown gracefully without crashing", () => {
    const unclosedBold = "Here is some **incomplete bold text";
    const unclosedCode = "```typescript\nconst a = 1;";
    
    const html1 = renderToStaticMarkup(React.createElement(MarkdownRenderer, { content: unclosedBold }));
    assert.ok(html1.includes("incomplete bold text"));

    const html2 = renderToStaticMarkup(React.createElement(MarkdownRenderer, { content: unclosedCode }));
    assert.ok(html2.includes("const a = 1;"));
  });

  await t.test("Requirement 9: Secure rendering - scripts are not executed as executable elements", () => {
    const malicious = "<script>alert('pwned')</script>\n\n<img src=x onerror=alert(1)>";
    const html = renderToStaticMarkup(React.createElement(MarkdownRenderer, { content: malicious }));
    
    // react-markdown without rehypeRaw will escape or strip raw HTML script tags
    assert.doesNotMatch(html, /<script>/);
  });
});
