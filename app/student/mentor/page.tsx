"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MentorRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/student/ai-mentor");
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-canvas, #F6F5F1)",
        fontFamily: "var(--font-inter, -apple-system, sans-serif)",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            width: 36,
            height: 36,
            border: "2px solid #E4E1DA",
            borderTop: "2px solid #356AE6",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 12px",
          }}
        />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <p style={{ color: "#667085", fontSize: 13, fontWeight: 500 }}>
          Redirecting to Cognalyze AI Mentor...
        </p>
      </div>
    </div>
  );
}
