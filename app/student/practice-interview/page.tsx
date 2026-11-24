"use client";

import React, { useState, useEffect, Suspense } from "react";
import AppNav from "@/components/AppNav";
import MockInterviewExperience from "@/components/interview/MockInterviewExperience";
import { Sparkles, ExternalLink, RefreshCw, Server, AlertCircle } from "lucide-react";

export default function StudentPracticeInterviewPage() {
  const [viewMode, setViewMode] = useState<"autonomous" | "classic">("autonomous");
  const [isServerHealthy, setIsServerHealthy] = useState<boolean>(true);
  const [checking, setChecking] = useState<boolean>(false);

  const checkServerHealth = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/health", { method: "GET" });
      if (res.ok) {
        setIsServerHealthy(true);
      } else {
        setIsServerHealthy(false);
      }
    } catch {
      setIsServerHealthy(false);
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkServerHealth();
    const interval = setInterval(checkServerHealth, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1", display: "flex", flexDirection: "column" }}>
      {/* Global App Header Navigation */}
      <AppNav />

      {/* Arena Sub-Header Control Bar */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #E4E1DA",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, #162A43, #356AE6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              fontSize: 16,
              fontWeight: 800,
            }}
          >
            ⚡
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 style={{ fontSize: 15, fontWeight: 800, color: "#162A43", margin: 0 }}>
                Personalized Interview Arena
              </h1>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  padding: "2px 8px",
                  borderRadius: 6,
                  backgroundColor: "#EFF4FE",
                  color: "#356AE6",
                  border: "1px solid #D2E0FB",
                }}
              >
                Autonomous Studio
              </span>
            </div>
            <p style={{ fontSize: 11, color: "#667085", margin: 0 }}>
              Live AI Adaptive Orchestration · Student DNA Progression · Real-Time Proctoring
            </p>
          </div>
        </div>

        {/* Mode Switcher & Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Health Status Indicator */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 6,
              backgroundColor: isServerHealthy ? "#EAF4EE" : "#FEF7ED",
              color: isServerHealthy ? "#2E7D5B" : "#B7791F",
              border: `1px solid ${isServerHealthy ? "#C8E4D3" : "#F8D8A7"}`,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: isServerHealthy ? "#2E7D5B" : "#B7791F",
              }}
            />
            <span>{isServerHealthy ? "Engine Active (Port 3001)" : "Engine Offline"}</span>
            <button
              onClick={checkServerHealth}
              disabled={checking}
              title="Refresh engine connection"
              style={{
                border: "none",
                background: "transparent",
                color: "inherit",
                cursor: "pointer",
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <RefreshCw size={11} className={checking ? "animate-spin" : ""} />
            </button>
          </div>

          {/* Mode Switch: Autonomous vs Classic */}
          <div
            style={{
              display: "flex",
              background: "#F6F5F1",
              padding: 3,
              borderRadius: 8,
              border: "1px solid #E4E1DA",
            }}
          >
            <button
              onClick={() => setViewMode("autonomous")}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "none",
                background: viewMode === "autonomous" ? "#162A43" : "transparent",
                color: viewMode === "autonomous" ? "#FFFFFF" : "#667085",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
                transition: "all 0.15s ease",
              }}
            >
              <Sparkles size={12} />
              <span>Personalized Arena</span>
            </button>
            <button
              onClick={() => setViewMode("classic")}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "none",
                background: viewMode === "classic" ? "#162A43" : "transparent",
                color: viewMode === "classic" ? "#FFFFFF" : "#667085",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <span>Classic Experience</span>
            </button>
          </div>

          {/* Open in Full Window */}
          <a
            href="http://localhost:3001"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11,
              fontWeight: 700,
              padding: "6px 12px",
              borderRadius: 7,
              backgroundColor: "#FFFFFF",
              color: "#356AE6",
              border: "1px solid #D2E0FB",
              textDecoration: "none",
              boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
            }}
          >
            <span>Open Dedicated Window</span>
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {viewMode === "autonomous" ? (
          <div style={{ flex: 1, position: "relative", minHeight: "calc(100vh - 120px)" }}>
            <iframe
              src="http://localhost:3001"
              style={{
                width: "100%",
                height: "calc(100vh - 120px)",
                border: "none",
                display: "block",
                backgroundColor: "#FFFFFF",
              }}
              allow="camera *; microphone *; display-capture *; autoplay *; clipboard-write *; clipboard-read *"
              title="Cognalyze Personalized Interview Arena"
            />
          </div>
        ) : (
          <Suspense
            fallback={
              <div
                style={{
                  minHeight: "100vh",
                  backgroundColor: "#F6F5F1",
                  color: "#667085",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Loading Classic Experience...
              </div>
            }
          >
            <MockInterviewExperience />
          </Suspense>
        )}
      </div>
    </div>
  );
}
