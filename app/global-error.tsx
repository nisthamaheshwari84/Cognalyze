"use client";

import React, { useEffect } from "react";
import { toFriendlyError } from "@/lib/resilience/error-handler";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalRootError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[Cognalyze Root Boundary] Caught layout-level error:", error);
  }, [error]);

  const friendly = toFriendlyError(error);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          padding: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F6F5F1",
          color: "#17191C",
          fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        }}
      >
        <div
          style={{
            maxWidth: 500,
            width: "90%",
            background: "#FFFFFF",
            border: "1px solid #E4E1DA",
            borderRadius: 16,
            padding: "36px 28px",
            textAlign: "center",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)"
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "#EFF4FE",
              border: "1px solid #D2E0FB",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 26,
              margin: "0 auto 16px"
            }}
          >
            🛡️
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px", color: "#162A43" }}>
            {friendly.title}
          </h2>

          <p style={{ fontSize: 14, color: "#667085", lineHeight: 1.5, margin: "0 0 20px" }}>
            {friendly.message}
          </p>

          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button
              onClick={() => reset()}
              style={{
                padding: "10px 20px",
                borderRadius: 8,
                background: "#356AE6",
                color: "#FFFFFF",
                border: "none",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {friendly.actionText}
            </button>
            <a href="/" style={{ textDecoration: "none" }}>
              <button
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  background: "#F6F5F1",
                  border: "1px solid #E4E1DA",
                  color: "#162A43",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Reload Home
              </button>
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
