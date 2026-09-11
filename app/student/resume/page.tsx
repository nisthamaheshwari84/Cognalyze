"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import AppNav from "@/components/AppNav";
import ResumeBuilderView from "@/components/resume/ResumeBuilderView";
import ResumeIntelligenceView from "@/components/resume/ResumeIntelligenceView";

function StudentResumeContent() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "intelligence" ? "intelligence" : "builder";
  const [activeTab, setActiveTab] = useState<"builder" | "intelligence">(initialTab);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "intelligence") {
      setActiveTab("intelligence");
    } else if (tabParam === "builder") {
      setActiveTab("builder");
    }
  }, [searchParams]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#060913", color: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="student" />

      {/* SUB-HEADER / TAB BAR */}
      <div style={{ background: "rgba(15, 23, 42, 0.8)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", padding: "12px 24px" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <span style={{ fontSize: 11, color: "#818cf8", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}>
              STUDENT RESUME COMMAND CENTER
            </span>
            <h1 style={{ fontSize: 20, fontWeight: 900, margin: "2px 0 0", color: "white" }}>
              {activeTab === "builder" ? "📄 ATS-Optimized Resume Builder" : "🎯 Resume Intelligence & ATS Diagnostics"}
            </h1>
          </div>

          <div style={{ display: "flex", background: "rgba(0,0,0,0.5)", padding: 4, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)" }}>
            <button
              onClick={() => setActiveTab("builder")}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                background: activeTab === "builder" ? "linear-gradient(135deg, #6366f1, #4f46e5)" : "transparent",
                color: activeTab === "builder" ? "white" : "#94a3b8",
                transition: "all 0.15s ease"
              }}
            >
              📄 6-Template Resume Builder
            </button>
            <button
              onClick={() => setActiveTab("intelligence")}
              style={{
                padding: "8px 16px",
                borderRadius: 8,
                border: "none",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                background: activeTab === "intelligence" ? "linear-gradient(135deg, #ec4899, #8b5cf6)" : "transparent",
                color: activeTab === "intelligence" ? "white" : "#94a3b8",
                transition: "all 0.15s ease"
              }}
            >
              🎯 Resume Intelligence & ATS Score
            </button>
          </div>
        </div>
      </div>

      {/* ACTIVE TAB CONTENT */}
      <div>
        {activeTab === "builder" ? (
          <ResumeBuilderView />
        ) : (
          <ResumeIntelligenceView />
        )}
      </div>
    </div>
  );
}

export default function StudentResumePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#060913", color: "white", padding: 40, textAlign: "center" }}>Loading Resume Workspace...</div>}>
      <StudentResumeContent />
    </Suspense>
  );
}
