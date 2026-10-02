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
    <div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1", color: "#17191C", fontFamily: "var(--font-inter, sans-serif)" }}>
      <AppNav role="student" />

      {/* SUB-HEADER / TAB BAR */}
      <div style={{ background: "#FFFFFF", borderBottom: "1px solid #E4E1DA", padding: "14px 24px" }}>
        <div style={{ maxWidth: 1300, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <span style={{ fontSize: 11, color: "#356AE6", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
              EVIDENCE-GROUNDED RESUME ENGINE
            </span>
            <h1 style={{ fontSize: 20, fontWeight: 700, margin: "2px 0 0", color: "#162A43" }}>
              {activeTab === "builder" ? "Resume Studio & Document Canvas" : "Resume Intelligence & ATS Diagnostics"}
            </h1>
          </div>

          <div style={{ display: "flex", background: "#FAF9F6", padding: 3, borderRadius: 7, border: "1px solid #E4E1DA" }}>
            <button
              onClick={() => setActiveTab("builder")}
              style={{
                padding: "6px 14px",
                borderRadius: 5,
                border: "none",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                background: activeTab === "builder" ? "#162A43" : "transparent",
                color: activeTab === "builder" ? "#FFFFFF" : "#667085",
                transition: "all 0.15s ease"
              }}
            >
              Resume Builder
            </button>
            <button
              onClick={() => setActiveTab("intelligence")}
              style={{
                padding: "6px 14px",
                borderRadius: 5,
                border: "none",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                background: activeTab === "intelligence" ? "#162A43" : "transparent",
                color: activeTab === "intelligence" ? "#FFFFFF" : "#667085",
                transition: "all 0.15s ease"
              }}
            >
              ATS & Role Diagnostics
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
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#F6F5F1", color: "#17191C", padding: 40, textAlign: "center", fontFamily: "var(--font-inter, sans-serif)" }}>Loading Resume Workspace...</div>}>
      <StudentResumeContent />
    </Suspense>
  );
}

