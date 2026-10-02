"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function CandidatePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/student/resume?tab=intelligence");
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F6F5F1",
        color: "#17191C",
        fontFamily: "var(--font-inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
      }}
    >
      <div
        style={{
          maxWidth: 440,
          width: "100%",
          textAlign: "center",
          backgroundColor: "#FFFFFF",
          border: "1px solid #E4E1DA",
          borderRadius: 14,
          padding: "2.5rem 2rem",
          boxShadow: "0 4px 20px rgba(22, 42, 67, 0.06)",
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 10,
            backgroundColor: "#EFF4FE",
            border: "1px solid #D2E0FB",
            color: "#356AE6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 20,
            margin: "0 auto 1.25rem",
          }}
        >
          ⚡
        </div>
        <h1
          style={{
            fontSize: "1.25rem",
            fontWeight: 800,
            color: "#162A43",
            marginBottom: 8,
          }}
        >
          Redirecting to Candidate Workspace...
        </h1>
        <p style={{ fontSize: 13, color: "#667085", lineHeight: 1.5, marginBottom: "1.5rem" }}>
          Routing you to the institutional Resume & Career Intelligence Layer.
        </p>
        <Link
          href="/student/resume?tab=intelligence"
          style={{
            display: "inline-block",
            padding: "8px 18px",
            borderRadius: 8,
            backgroundColor: "#356AE6",
            color: "#FFFFFF",
            fontSize: 13,
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          Click here if not redirected
        </Link>
      </div>
    </div>
  );
}