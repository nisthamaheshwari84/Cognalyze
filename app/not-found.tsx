"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, Home, Compass } from "lucide-react";

export default function NotFound() {
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
          maxWidth: 500,
          width: "100%",
          background: "var(--bg-card, #FFFFFF)",
          border: "1px solid var(--border-subtle, #E4E1DA)",
          borderRadius: 16,
          padding: "40px 32px",
          textAlign: "center",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.04)"
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "rgba(53, 106, 230, 0.1)",
            border: "1px solid rgba(53, 106, 230, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 28,
            margin: "0 auto 16px"
          }}
        >
          🔍
        </div>

        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "1px",
            color: "#356AE6",
            display: "inline-block",
            marginBottom: 6
          }}
        >
          404 • Page Not Found
        </span>

        <h1
          style={{
            fontSize: 22,
            fontWeight: 800,
            margin: "0 0 10px",
            color: "var(--text-primary, #162A43)",
            letterSpacing: "-0.4px"
          }}
        >
          Destination Unavailable
        </h1>

        <p
          style={{
            fontSize: 13,
            color: "#667085",
            lineHeight: 1.6,
            margin: "0 0 24px"
          }}
        >
          The page or workspace segment you requested does not exist or has been relocated within the intelligence platform.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <button
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                borderRadius: 8,
                background: "#356AE6",
                color: "#FFFFFF",
                border: "none",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(53, 106, 230, 0.2)"
              }}
            >
              <Home size={15} />
              <span>Return Home</span>
            </button>
          </Link>

          <Link href="/post" style={{ textDecoration: "none" }}>
            <button
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 20px",
                borderRadius: 8,
                background: "var(--bg-canvas, #F6F5F1)",
                border: "1px solid var(--border-subtle, #E4E1DA)",
                color: "var(--text-primary, #162A43)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              <Compass size={15} />
              <span>Explore Posts</span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
