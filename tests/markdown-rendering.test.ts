import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { sanitizeMarkdownContent } from "../components/ui/MarkdownRenderer";

describe("Global Markdown Sanitizer & Normalizer", () => {
  it("normalizes markdown headings missing a space after hash", () => {
    const raw = "###1. Introduction to Invariants\nSome body text\n##Overview";
    const cleaned = sanitizeMarkdownContent(raw);
    assert.match(cleaned, /### 1\. Introduction to Invariants/);
    assert.match(cleaned, /## Overview/);
  });

  it("strictly protects C/C++ preprocessor directives from being converted to headings", () => {
    const cppCode = [
      "#include <vector>",
      "#include <iostream>",
      "#define BUFFER_SIZE 4096",
      "#pragma once",
      "#ifdef DEBUG",
      "#ifndef NDEBUG",
      "#endif",
      "#undef TEST",
      "#error Failed"
    ].join("\n");

    const cleaned = sanitizeMarkdownContent(cppCode);
    assert.equal(cleaned, cppCode, "C/C++ preprocessor directives must remain completely unmodified");
  });

  it("preserves code blocks and inline code without mutating interior formatting", () => {
    const markdownWithCode = `
Here is a function:
\`\`\`typescript
// ### Not a heading
const x = 5 * 10 * 20;
// • Not a bullet
#include <stdio.h>
\`\`\`
And inline \`const val = 2 * 3;\` should not become italic.
`;
    const cleaned = sanitizeMarkdownContent(markdownWithCode);
    assert.match(cleaned, /const x = 5 \* 10 \* 20;/);
    assert.match(cleaned, /\/\/ • Not a bullet/);
    assert.match(cleaned, /const val = 2 \* 3;/);
  });

  it("preserves math expressions ($...$) without asterisk or symbol corruption", () => {
    const mathText = "The time complexity is $O(N * M)$ and space is $O(1)$.";
    const cleaned = sanitizeMarkdownContent(mathText);
    assert.match(cleaned, /\$O\(N \* M\)\$/);
    assert.match(cleaned, /\$O\(1\)\$/);
  });

  it("unescapes backslash-escaped markdown formatting characters", () => {
    const escaped = "This is \\*\\*bold text\\*\\* and \\#\\# Heading and \\`code\\`.";
    const cleaned = sanitizeMarkdownContent(escaped);
    assert.equal(cleaned, "This is **bold text** and ## Heading and `code`.");
  });

  it("converts Unicode bullet characters to standard markdown list dashes", () => {
    const bullets = "• Item 1\n● Item 2\n◦ Item 3\n⁃ Item 4\n– Item 5";
    const cleaned = sanitizeMarkdownContent(bullets);
    assert.match(cleaned, /^- Item 1/m);
    assert.match(cleaned, /^- Item 2/m);
    assert.match(cleaned, /^- Item 3/m);
    assert.match(cleaned, /^- Item 4/m);
    assert.match(cleaned, /^- Item 5/m);
  });

  it("normalizes bold and italic syntax with internal spacing", () => {
    const boldWithSpace = "** bold text ** is important.";
    const cleaned = sanitizeMarkdownContent(boldWithSpace);
    assert.match(cleaned, /\*\*bold text\*\*/);
  });

  it("converts double-stringified JSON newlines to real newlines", () => {
    const jsonEscaped = "First line\\nSecond line\\nThird line";
    const cleaned = sanitizeMarkdownContent(jsonEscaped);
    assert.equal(cleaned, "First line\nSecond line\nThird line");
  });

  it("automatically closes unclosed code fences from streaming cutoffs", () => {
    const streamingCutoff = "Here is the code:\n```typescript\nfunction solve() {\n  return true;\n";
    const cleaned = sanitizeMarkdownContent(streamingCutoff);
    assert.ok(cleaned.endsWith("\n```"), "Unclosed code fence must be closed");
  });

  it("cleans spaces in markdown links", () => {
    const linkWithSpaces = "[Cognalyze]( https://cognalyze-gules.vercel.app )";
    const cleaned = sanitizeMarkdownContent(linkWithSpaces);
    assert.equal(cleaned, "[Cognalyze](https://cognalyze-gules.vercel.app)");
  });

  it("ensures a blank line before markdown headings attached to paragraph text", () => {
    const attachedHeading = "End of paragraph.\n### Next Step";
    const cleaned = sanitizeMarkdownContent(attachedHeading);
    assert.equal(cleaned, "End of paragraph.\n\n### Next Step");
  });
});

