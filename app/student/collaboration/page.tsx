"use client";

import React from "react";
import AppNav from "@/components/AppNav";
import CollaborationFeed from "@/components/collab/CollaborationFeed";

export default function StudentCollaborationPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1", color: "#17191C", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="student" />

      <main style={{ maxWidth: 1024, margin: "0 auto", padding: "32px 20px 60px", display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Banner */}
        <div style={{ padding: "24px", borderRadius: 10, background: "#FFFFFF", border: "1px solid #E4E1DA", boxShadow: "0 1px 3px rgba(0,0,0,0.03)", display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 8px", borderRadius: 5, background: "#EFF4FE", border: "1px solid #D2E0FB", color: "#356AE6", fontSize: 11, fontWeight: 700, width: "fit-content" }}>
            <span>🤝</span> Verified Enterprise Placement
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#162A43", margin: "4px 0 0", letterSpacing: "-0.5px" }}>
            Collaboration Feed
          </h1>
          <p style={{ fontSize: 13, color: "#667085", maxWidth: 640, lineHeight: 1.5, margin: 0 }}>
            Direct collaboration roles posted exclusively by enterprise recruiters. When you apply, your verified Cognalyze DNA radar and project credentials are automatically attached as a frozen snapshot.
          </p>
        </div>

        {/* Feed Component */}
        <CollaborationFeed />
      </main>
    </div>
  );
}
