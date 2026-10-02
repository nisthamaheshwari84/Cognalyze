"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { toFriendlyError } from "@/lib/resilience/error-handler";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalAppError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log privately to monitoring console without exposing to the user interface
    console.error("[Cognalyze Production Resilience] Caught unhandled route error:", error);
  }, [error]);

  const friendly = toFriendlyError(error);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "var(--bg-canvas, #F6F5F1)",
        color: "var(--text-primary, #17191C)",
        fontFamily: "var(--font-inter, -apple-system, BlinkMacSystemFont, sans-serif)",
        padding: "24px"
      }}
    >
      <div
        style={{
          maxWidth: 520,
          width: "100%",
          background: "var(--bg-card, #FFFFFF)",
          border: "1px solid var(--border-subtle, #E4E1DA)",
          borderRadius: 16,
          padding: "36px 32px",
          textAlign: "center",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.04)"
        }}
      >
        {/* Friendly Robot / Cognalyze Icon */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "var(--accent-bg, #EFF4FE)",
            border: "1px solid var(--accent-border, #D2E0FB)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            margin: "0 auto 20px"
          }}
        >
          🤖
        </div>

        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: 1.5,
            color: "var(--accent, #356AE6)",
            display: "inline-block",
            marginBottom: 8
          }}
        >
          COGNALYZE RECOVERY ENGINE
        </span>

        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            margin: "0 0 10px",
            color: "var(--text-primary, #162A43)"
          }}
        >
          {friendly.title}
        </h1>

        <p
          style={{
            fontSize: 14,
            lineHeight: 1.6,
            color: "var(--text-secondary, #667085)",
            margin: "0 0 24px"
          }}
        >
          {friendly.message}
        </p>

        {/* Safety Assurance Badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 999,
            background: "rgba(46, 125, 91, 0.1)",
            border: "1px solid rgba(46, 125, 91, 0.25)",
            color: "#2E7D5B",
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 28
          }}
        >
          <span>🛡️</span>
          <span>Your data and progress are safe.</span>
        </div>

        {/* Action Controls */}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          {friendly.retryable && (
            <button
              onClick={() => reset()}
              style={{
                padding: "10px 22px",
                borderRadius: 8,
                background: "var(--accent, #356AE6)",
                color: "#FFFFFF",
                border: "none",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                transition: "opacity 0.2s"
              }}
            >
              {friendly.actionText}
            </button>
          )}

          <Link href="/student/dashboard" style={{ textDecoration: "none" }}>
            <button
              style={{
                padding: "10px 22px",
                borderRadius: 8,
                background: "var(--bg-canvas, #F6F5F1)",
                border: "1px solid var(--border-subtle, #E4E1DA)",
                color: "var(--text-primary, #162A43)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Return to Dashboard
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
