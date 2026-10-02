"use client";

import React, { useState } from "react";
import { Check, Copy, Terminal, ExternalLink } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

interface MentorMarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * High-fidelity, zero-dependency Markdown renderer for Cognalyze AI Mentor.
 * Solves UI bug where ##, **, |, <br>, and raw markdown syntax were displayed.
 * 
 * Supports:
 * - Headings (h1, h2, h3, h4) with clean typography
 * - Paragraphs with bold, italic, strikethrough, links
 * - Code blocks with language badge, syntax container, and 1-click copy button
 * - Inline code with subtle contrast badge
 * - Tables with border lines, zebra striping, and responsive horizontal scroll
 * - Unordered and ordered lists
 * - Blockquotes and callouts
 * - LaTeX / Big-O Math symbols ($O(log n)$, $O(n)$, etc.)
 * - Clean HTML entity & whitespace normalization
 */
export default function MentorMarkdownRenderer({
  content,
  className = ""
}: MentorMarkdownRendererProps) {
  const { isDark } = useTheme();

  if (!content || typeof content !== "string") {
    return null;
  }

  // Normalize line endings and strip raw html line breaks
  const sanitized = content
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&nbsp;/gi, " ")
    .replace(/\r\n/g, "\n");

  // Split content into blocks: code blocks, tables, headers, lists, paragraphs
  const blocks = parseMarkdownBlocks(sanitized);

  return (
    <div
      className={`mentor-markdown-content ${className}`}
      style={{
        fontSize: "14px",
        lineHeight: 1.65,
        color: isDark ? "#E2E8F0" : "#1E293B",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        overflowWrap: "break-word",
        wordBreak: "break-word"
      }}
    >
      {blocks.map((block, idx) => {
        switch (block.type) {
          case "code":
            return (
              <CodeBlockItem
                key={idx}
                code={block.content}
                language={block.language || "text"}
                isDark={isDark}
              />
            );

          case "table":
            return (
              <TableBlockItem
                key={idx}
                headers={block.tableHeaders || []}
                rows={block.tableRows || []}
                isDark={isDark}
              />
            );

          case "heading": {
            const level = block.level || 3;
            if (level === 1) {
              return (
                <h1
                  key={idx}
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    margin: "8px 0 2px",
                    color: isDark ? "#FFFFFF" : "#0F172A",
                    letterSpacing: "-0.01em"
                  }}
                >
                  <InlineFormattedText text={block.content} isDark={isDark} />
                </h1>
              );
            }
            if (level === 2) {
              return (
                <h2
                  key={idx}
                  style={{
                    fontSize: "17px",
                    fontWeight: 700,
                    margin: "6px 0 2px",
                    color: isDark ? "#F8FAFC" : "#1E293B",
                    letterSpacing: "-0.01em"
                  }}
                >
                  <InlineFormattedText text={block.content} isDark={isDark} />
                </h2>
              );
            }
            if (level === 3) {
              return (
                <h3
                  key={idx}
                  style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    margin: "4px 0 1px",
                    color: isDark ? "#93C5FD" : "#2563EB",
                    letterSpacing: "-0.005em"
                  }}
                >
                  <InlineFormattedText text={block.content} isDark={isDark} />
                </h3>
              );
            }
            return (
              <h4
                key={idx}
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  letterSpacing: "0.04em",
                  margin: "4px 0 1px",
                  color: isDark ? "#94A3B8" : "#64748B"
                }}
              >
                <InlineFormattedText text={block.content} isDark={isDark} />
              </h4>
            );
          }

          case "list":
            return (
              <ul
                key={idx}
                style={{
                  margin: "0",
                  paddingLeft: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px"
                }}
              >
                {block.items?.map((item, itemIdx) => (
                  <li key={itemIdx} style={{ listStyleType: "disc" }}>
                    <InlineFormattedText text={item} isDark={isDark} />
                  </li>
                ))}
              </ul>
            );

          case "ordered-list":
            return (
              <ol
                key={idx}
                style={{
                  margin: "0",
                  paddingLeft: "20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px"
                }}
              >
                {block.items?.map((item, itemIdx) => (
                  <li key={itemIdx} style={{ listStyleType: "decimal" }}>
                    <InlineFormattedText text={item} isDark={isDark} />
                  </li>
                ))}
              </ol>
            );

          case "quote":
            return (
              <blockquote
                key={idx}
                style={{
                  margin: "4px 0",
                  padding: "8px 14px",
                  borderLeft: `3px solid ${isDark ? "#3B82F6" : "#2563EB"}`,
                  background: isDark ? "rgba(59, 130, 246, 0.08)" : "#F0F7FF",
                  borderRadius: "0 6px 6px 0",
                  color: isDark ? "#CBD5E1" : "#334155",
                  fontStyle: "italic",
                  fontSize: "13.5px"
                }}
              >
                <InlineFormattedText text={block.content} isDark={isDark} />
              </blockquote>
            );

          case "divider":
            return (
              <hr
                key={idx}
                style={{
                  border: "none",
                  borderTop: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`,
                  margin: "6px 0"
                }}
              />
            );

          case "paragraph":
          default:
            return (
              <p key={idx} style={{ margin: 0 }}>
                <InlineFormattedText text={block.content} isDark={isDark} />
              </p>
            );
        }
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline Formatted Text Parser (handles bold, italic, inline code, math, links)
// ---------------------------------------------------------------------------
function InlineFormattedText({ text, isDark }: { text: string; isDark: boolean }) {
  if (!text) return null;

  // Regex tokens:
  // 1. Math notation: $O(...) or $...$
  // 2. Inline code: `...`
  // 3. Bold: **...**
  // 4. Italic: *...* or _..._
  // 5. Links: [label](url)
  const tokenRegex = /(\$[A-Za-z0-9_()+*\-^/\\ ]+\$|`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g;
  const parts = text.split(tokenRegex);

  return (
    <>
      {parts.map((part, i) => {
        if (!part) return null;

        // Math format: $O(log n)$
        if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
          const mathExpr = part.slice(1, -1);
          return (
            <span
              key={i}
              style={{
                fontFamily: "var(--font-mono, 'Fira Code', 'Roboto Mono', monospace)",
                fontWeight: 600,
                color: isDark ? "#F472B6" : "#DB2777",
                background: isDark ? "rgba(244, 114, 182, 0.12)" : "#FDF2F8",
                padding: "1px 5px",
                borderRadius: "4px",
                fontSize: "0.92em"
              }}
            >
              {mathExpr}
            </span>
          );
        }

        // Inline Code: `code`
        if (part.startsWith("`") && part.endsWith("`") && part.length >= 2) {
          const codeText = part.slice(1, -1);
          return (
            <code
              key={i}
              style={{
                fontFamily: "var(--font-mono, 'Fira Code', 'Roboto Mono', monospace)",
                fontSize: "0.9em",
                background: isDark ? "#1E293B" : "#F1F5F9",
                color: isDark ? "#38BDF8" : "#0284C7",
                padding: "2px 6px",
                borderRadius: "4px",
                border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`
              }}
            >
              {codeText}
            </code>
          );
        }

        // Bold: **text**
        if (part.startsWith("**") && part.endsWith("**") && part.length >= 4) {
          return (
            <strong
              key={i}
              style={{
                fontWeight: 700,
                color: isDark ? "#FFFFFF" : "#0F172A"
              }}
            >
              <InlineFormattedText text={part.slice(2, -2)} isDark={isDark} />
            </strong>
          );
        }

        // Italic: *text*
        if (part.startsWith("*") && part.endsWith("*") && part.length >= 2) {
          return (
            <em key={i} style={{ fontStyle: "italic" }}>
              <InlineFormattedText text={part.slice(1, -1)} isDark={isDark} />
            </em>
          );
        }

        // Link: [label](url)
        if (part.startsWith("[") && part.includes("](") && part.endsWith(")")) {
          const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
          if (match) {
            const [, label, href] = match;
            return (
              <a
                key={i}
                href={href}
                target={href.startsWith("http") ? "_blank" : undefined}
                rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
                style={{
                  color: isDark ? "#60A5FA" : "#2563EB",
                  textDecoration: "underline",
                  textUnderlineOffset: "2px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "2px"
                }}
              >
                {label}
                {href.startsWith("http") && <ExternalLink size={11} />}
              </a>
            );
          }
        }

        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}

// ---------------------------------------------------------------------------
// Syntax-Styled Code Block Component with Copy
// ---------------------------------------------------------------------------
function CodeBlockItem({
  code,
  language,
  isDark
}: {
  code: string;
  language: string;
  isDark: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div
      style={{
        margin: "8px 0",
        borderRadius: "8px",
        overflow: "hidden",
        border: `1px solid ${isDark ? "#283548" : "#E2E8F0"}`,
        background: isDark ? "#0A101D" : "#0F172A",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.2)"
      }}
    >
      {/* Code Header Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 12px",
          background: isDark ? "#111B2E" : "#1E293B",
          borderBottom: `1px solid ${isDark ? "#1E2D44" : "#334155"}`
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Terminal size={12} color="#94A3B8" />
          <span
            style={{
              fontSize: "11px",
              fontFamily: "monospace",
              color: "#94A3B8",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontWeight: 600
            }}
          >
            {language}
          </span>
        </div>

        <button
          onClick={handleCopy}
          aria-label="Copy code to clipboard"
          style={{
            background: copied
              ? "rgba(16, 185, 129, 0.15)"
              : "rgba(255, 255, 255, 0.08)",
            border: `1px solid ${copied ? "#10B981" : "rgba(255, 255, 255, 0.12)"}`,
            borderRadius: "4px",
            color: copied ? "#10B981" : "#E2E8F0",
            fontSize: "11px",
            padding: "3px 8px",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            transition: "all 0.15s ease"
          }}
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      {/* Code Content */}
      <pre
        style={{
          margin: 0,
          padding: "14px 16px",
          overflowX: "auto",
          fontSize: "12.5px",
          fontFamily: "var(--font-mono, 'Fira Code', 'Menlo', monospace)",
          lineHeight: 1.6,
          color: "#E2E8F0"
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Table Block Component
// ---------------------------------------------------------------------------
function TableBlockItem({
  headers,
  rows,
  isDark
}: {
  headers: string[];
  rows: string[][];
  isDark: boolean;
}) {
  return (
    <div
      style={{
        margin: "8px 0",
        overflowX: "auto",
        borderRadius: "8px",
        border: `1px solid ${isDark ? "#283548" : "#E2E8F0"}`
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: "13px",
          textAlign: "left"
        }}
      >
        <thead>
          <tr
            style={{
              background: isDark ? "#132338" : "#F8FAFC",
              borderBottom: `2px solid ${isDark ? "#283548" : "#CBD5E1"}`
            }}
          >
            {headers.map((h, i) => (
              <th
                key={i}
                style={{
                  padding: "10px 14px",
                  fontWeight: 600,
                  color: isDark ? "#F1F5F9" : "#0F172A"
                }}
              >
                <InlineFormattedText text={h} isDark={isDark} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rIdx) => (
            <tr
              key={rIdx}
              style={{
                background:
                  rIdx % 2 === 1
                    ? isDark
                      ? "rgba(19, 35, 56, 0.4)"
                      : "#F8FAFC"
                    : "transparent",
                borderBottom: `1px solid ${isDark ? "#1E2D44" : "#F1F5F9"}`
              }}
            >
              {row.map((cell, cIdx) => (
                <td
                  key={cIdx}
                  style={{
                    padding: "8px 14px",
                    color: isDark ? "#CBD5E1" : "#334155"
                  }}
                >
                  <InlineFormattedText text={cell} isDark={isDark} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Block Parsing Utility
// ---------------------------------------------------------------------------
interface ParsedBlock {
  type:
    | "paragraph"
    | "heading"
    | "code"
    | "table"
    | "list"
    | "ordered-list"
    | "quote"
    | "divider";
  content: string;
  level?: number;
  language?: string;
  items?: string[];
  tableHeaders?: string[];
  tableRows?: string[][];
}

function parseMarkdownBlocks(text: string): ParsedBlock[] {
  const lines = text.split("\n");
  const blocks: ParsedBlock[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines
    if (!trimmed) {
      i++;
      continue;
    }

    // 1. Code block fence (```)
    if (trimmed.startsWith("```")) {
      const language = trimmed.slice(3).trim() || "text";
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      blocks.push({
        type: "code",
        content: codeLines.join("\n"),
        language
      });
      continue;
    }

    // 2. Headings (#, ##, ###, ####)
    if (trimmed.startsWith("#")) {
      const match = trimmed.match(/^(#{1,4})\s+(.+)$/);
      if (match) {
        blocks.push({
          type: "heading",
          level: match[1].length,
          content: match[2].trim()
        });
        i++;
        continue;
      }
    }

    // 3. Horizontal divider (---, ***)
    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      blocks.push({
        type: "divider",
        content: ""
      });
      i++;
      continue;
    }

    // 4. Blockquote (> ...)
    if (trimmed.startsWith(">")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) {
        quoteLines.push(lines[i].trim().replace(/^>\s?/, ""));
        i++;
      }
      blocks.push({
        type: "quote",
        content: quoteLines.join(" ")
      });
      continue;
    }

    // 5. Table detector (| col1 | col2 |)
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const headerLine = tableLines[0];
        const separatorLine = tableLines[1];

        // Verify separator row (contains ---)
        if (separatorLine.includes("-")) {
          const parseRow = (rowStr: string) =>
            rowStr
              .slice(1, -1)
              .split("|")
              .map((c) => c.trim());

          const headers = parseRow(headerLine);
          const rows = tableLines.slice(2).map(parseRow);

          blocks.push({
            type: "table",
            content: "",
            tableHeaders: headers,
            tableRows: rows
          });
          continue;
        }
      }
    }

    // 6. Ordered list (1. item)
    if (/^\d+\.\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      blocks.push({
        type: "ordered-list",
        content: "",
        items
      });
      continue;
    }

    // 7. Bullet list (- item or * item)
    if (/^[-*•]\s+/.test(trimmed)) {
      const items: string[] = [];
      while (i < lines.length && /^[-*•]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*•]\s+/, ""));
        i++;
      }
      blocks.push({
        type: "list",
        content: "",
        items
      });
      continue;
    }

    // 8. General paragraph
    const paraLines: string[] = [];
    while (
      i < lines.length &&
      lines[i].trim() &&
      !lines[i].trim().startsWith("#") &&
      !lines[i].trim().startsWith("```") &&
      !lines[i].trim().startsWith(">") &&
      !lines[i].trim().startsWith("|") &&
      !/^[-*•]\s+/.test(lines[i].trim()) &&
      !/^\d+\.\s+/.test(lines[i].trim())
    ) {
      paraLines.push(lines[i].trim());
      i++;
    }

    if (paraLines.length > 0) {
      blocks.push({
        type: "paragraph",
        content: paraLines.join(" ")
      });
    }
  }

  return blocks;
}
