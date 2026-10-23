"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Terminal, Copy, Check, ExternalLink } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export interface MarkdownRendererProps {
  content: string;
  className?: string;
  style?: React.CSSProperties;
  isDark?: boolean;
  compact?: boolean;
}

/**
 * Reusable Code Block with language badge and 1-click clipboard copy
 */
function CodeBlock({
  code,
  language,
  isDark
}: {
  code: string;
  language?: string;
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

  const cleanLang = (language || "text").replace(/^language-/, "").toLowerCase();

  return (
    <div
      style={{
        margin: "10px 0",
        borderRadius: 8,
        overflow: "hidden",
        border: `1px solid ${isDark ? "#283548" : "#E2E8F0"}`,
        background: isDark ? "#0A101D" : "#0F172A",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
        maxWidth: "100%"
      }}
    >
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
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Terminal size={12} color="#94A3B8" />
          <span
            style={{
              fontSize: 11,
              fontFamily: "monospace",
              color: "#94A3B8",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              fontWeight: 700
            }}
          >
            {cleanLang.toUpperCase()}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code to clipboard"
          style={{
            background: copied ? "rgba(16, 185, 129, 0.15)" : "rgba(255, 255, 255, 0.08)",
            border: `1px solid ${copied ? "#10B981" : "rgba(255, 255, 255, 0.15)"}`,
            borderRadius: 4,
            color: copied ? "#10B981" : "#E2E8F0",
            fontSize: 11,
            padding: "3px 8px",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            transition: "all 0.15s ease"
          }}
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          <span>{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>

      <pre
        style={{
          margin: 0,
          padding: "12px 14px",
          overflowX: "auto",
          fontSize: 12.5,
          fontFamily: "var(--font-mono, 'Fira Code', 'Roboto Mono', 'Menlo', monospace)",
          lineHeight: 1.6,
          color: "#E2E8F0"
        }}
      >
        <code>{code}</code>
      </pre>
    </div>
  );
}

/**
 * Text node helper: Formats LaTeX math notation ($O(log n)$, $N$, $X \rightarrow Y$) gracefully
 */
function formatMathTokens(text: string, isDark: boolean): React.ReactNode {
  if (!text || typeof text !== "string") return text;
  if (!text.includes("$")) return text;

  // Split by inline math: $...$ (minimum 1 char inside)
  const mathRegex = /(\$[^$\n]+\$)/g;
  const parts = text.split(mathRegex);

  if (parts.length === 1) return text;

  return parts.map((part, i) => {
    if (part.startsWith("$") && part.endsWith("$") && part.length >= 3) {
      const expr = part.slice(1, -1);
      return (
        <span
          key={i}
          style={{
            fontFamily: "var(--font-mono, 'Fira Code', 'Roboto Mono', monospace)",
            fontWeight: 600,
            color: isDark ? "#F472B6" : "#DB2777",
            background: isDark ? "rgba(244, 114, 182, 0.12)" : "#FDF2F8",
            padding: "1px 5px",
            borderRadius: 4,
            fontSize: "0.92em"
          }}
        >
          {expr}
        </span>
      );
    }
    return part;
  });
}

/**
 * Canonical Cognalyze Markdown Renderer
 * Standard, secure, high-fidelity Markdown parser supporting GFM tables, code blocks with copy,
 * math tokens, nested lists, and seamless Light/Dark themes.
 */
export default function MarkdownRenderer({
  content,
  className = "",
  style,
  isDark: isDarkProp,
  compact = false
}: MarkdownRendererProps) {
  const themeContext = useTheme();
  const isDark = isDarkProp !== undefined ? isDarkProp : themeContext?.isDark || false;

  if (!content || typeof content !== "string") {
    return null;
  }

  // Pre-process raw <br> tags and normalize newlines safely
  const sanitized = content
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/&nbsp;/gi, " ")
    .replace(/\r\n/g, "\n");

  return (
    <div
      className={`cognalyze-markdown ${className}`}
      style={{
        fontSize: compact ? "13px" : "14px",
        lineHeight: compact ? 1.55 : 1.65,
        color: isDark ? "#E2E8F0" : "#17191C",
        wordBreak: "break-word",
        overflowWrap: "break-word",
        ...style
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ children }) => (
            <h1
              style={{
                fontSize: compact ? "17px" : "19px",
                fontWeight: 800,
                margin: compact ? "10px 0 4px" : "14px 0 6px",
                color: isDark ? "#FFFFFF" : "#162A43",
                letterSpacing: "-0.01em"
              }}
            >
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2
              style={{
                fontSize: compact ? "15px" : "17px",
                fontWeight: 700,
                margin: compact ? "8px 0 4px" : "12px 0 4px",
                color: isDark ? "#F8FAFC" : "#162A43",
                letterSpacing: "-0.01em"
              }}
            >
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3
              style={{
                fontSize: compact ? "13.5px" : "15px",
                fontWeight: 700,
                margin: compact ? "6px 0 2px" : "10px 0 3px",
                color: isDark ? "#93C5FD" : "#2563EB",
                letterSpacing: "-0.005em"
              }}
            >
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4
              style={{
                fontSize: "12px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
                margin: "6px 0 2px",
                color: isDark ? "#94A3B8" : "#475467"
              }}
            >
              {children}
            </h4>
          ),

          // Paragraphs
          p: ({ children }) => {
            // Check if single child is a string that might contain math notation
            if (typeof children === "string") {
              return (
                <p style={{ margin: compact ? "4px 0" : "6px 0" }}>
                  {formatMathTokens(children, isDark)}
                </p>
              );
            }
            return (
              <p style={{ margin: compact ? "4px 0" : "6px 0" }}>
                {children}
              </p>
            );
          },

          // Bold & Italic
          strong: ({ children }) => (
            <strong style={{ fontWeight: 700, color: isDark ? "#FFFFFF" : "#0F172A" }}>
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em style={{ fontStyle: "italic", color: isDark ? "#E2E8F0" : "#334155" }}>
              {children}
            </em>
          ),

          // Lists
          ul: ({ children }) => (
            <ul
              style={{
                margin: compact ? "4px 0" : "6px 0",
                paddingLeft: "20px",
                display: "flex",
                flexDirection: "column",
                gap: compact ? "3px" : "5px"
              }}
            >
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol
              style={{
                margin: compact ? "4px 0" : "6px 0",
                paddingLeft: "20px",
                display: "flex",
                flexDirection: "column",
                gap: compact ? "3px" : "5px"
              }}
            >
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li style={{ lineHeight: 1.6 }}>
              {children}
            </li>
          ),

          // Code blocks & Inline Code
          pre: ({ children }: any) => <>{children}</>,
          code: ({ inline, className: codeClass, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(codeClass || "");
            const rawCode = String(children).replace(/\n$/, "");

            if (!inline && (match || rawCode.includes("\n") || codeClass)) {
              return (
                <CodeBlock
                  code={rawCode}
                  language={match ? match[1] : undefined}
                  isDark={isDark}
                />
              );
            }

            return (
              <code
                style={{
                  fontFamily: "var(--font-mono, 'Fira Code', 'Roboto Mono', 'Menlo', monospace)",
                  fontSize: "0.9em",
                  background: isDark ? "#1E293B" : "#F1F5F9",
                  color: isDark ? "#38BDF8" : "#0284C7",
                  padding: "1px 5px",
                  borderRadius: 4,
                  border: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`,
                  fontWeight: 500
                }}
                {...props}
              >
                {children}
              </code>
            );
          },

          // GFM Tables with responsive horizontal scroll
          table: ({ children }) => (
            <div
              style={{
                margin: compact ? "6px 0" : "10px 0",
                overflowX: "auto",
                borderRadius: 8,
                border: `1px solid ${isDark ? "#283548" : "#E2E8F0"}`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  fontSize: compact ? "12px" : "13px",
                  textAlign: "left"
                }}
              >
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead
              style={{
                background: isDark ? "#132338" : "#F8FAFC",
                borderBottom: `2px solid ${isDark ? "#283548" : "#CBD5E1"}`
              }}
            >
              {children}
            </thead>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr
              style={{
                borderBottom: `1px solid ${isDark ? "#1E2D44" : "#F1F5F9"}`
              }}
            >
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th
              style={{
                padding: compact ? "7px 10px" : "9px 12px",
                fontWeight: 700,
                color: isDark ? "#F1F5F9" : "#0F172A",
                whiteSpace: "nowrap"
              }}
            >
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td
              style={{
                padding: compact ? "7px 10px" : "8px 12px",
                color: isDark ? "#CBD5E1" : "#334155"
              }}
            >
              {children}
            </td>
          ),

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote
              style={{
                margin: compact ? "6px 0" : "8px 0",
                padding: "8px 14px",
                borderLeft: `3px solid ${isDark ? "#3B82F6" : "#2563EB"}`,
                background: isDark ? "rgba(59, 130, 246, 0.08)" : "#F0F7FF",
                borderRadius: "0 6px 6px 0",
                color: isDark ? "#CBD5E1" : "#334155",
                fontStyle: "italic",
                fontSize: compact ? "12.5px" : "13.5px"
              }}
            >
              {children}
            </blockquote>
          ),

          // Horizontal rule
          hr: () => (
            <hr
              style={{
                border: "none",
                borderTop: `1px solid ${isDark ? "#334155" : "#E2E8F0"}`,
                margin: compact ? "8px 0" : "12px 0"
              }}
            />
          ),

          // Links
          a: ({ href, children }) => {
            const isExternal = href?.startsWith("http");
            return (
              <a
                href={href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                style={{
                  color: isDark ? "#60A5FA" : "#2563EB",
                  textDecoration: "underline",
                  textUnderlineOffset: "2px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                  fontWeight: 500
                }}
              >
                {children}
                {isExternal && <ExternalLink size={11} />}
              </a>
            );
          }
        }}
      >
        {sanitized}
      </ReactMarkdown>
    </div>
  );
}
