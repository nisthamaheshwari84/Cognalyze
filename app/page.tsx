"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [loadingSection, setLoadingSection] = useState<string | null>(null);

  const handleSelect = async (section: "student" | "recruiter" | "post") => {
    setLoadingSection(section);
    try {
      if (section === "post") {
        router.push("/post");
        return;
      }

      // Set active role cookie
      await fetch("/api/auth/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: section })
      });

      if (section === "student") {
        router.push("/student/dashboard");
      } else {
        router.push("/recruiter/dashboard");
      }
    } catch (err) {
      console.error("Navigation error:", err);
      if (section === "post") router.push("/post");
      else if (section === "student") router.push("/student/dashboard");
      else router.push("/recruiter/dashboard");
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        backgroundColor: "#050713",
        color: "white",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "32px 20px",
        position: "relative",
        overflow: "hidden"
      }}
    >
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        .landing-card {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          cursor: pointer;
        }
        .landing-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 24px 48px -12px rgba(99, 102, 241, 0.35);
          border-color: rgba(255, 255, 255, 0.25) !important;
        }
      `}</style>

      {/* Background Gradients */}
      <div
        style={{
          position: "absolute",
          top: "-15%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "700px",
          height: "500px",
          background: "radial-gradient(ellipse at center, rgba(99, 102, 241, 0.18) 0%, rgba(168, 85, 247, 0.08) 50%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
          animation: "pulseGlow 6s infinite"
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "linear-gradient(rgba(255, 255, 255, 0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.02) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none"
        }}
      />

      {/* Main Container */}
      <div
        style={{
          width: "100%",
          maxWidth: "1160px",
          position: "relative",
          zIndex: 10,
          animation: "fadeIn 0.6s ease"
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              borderRadius: "999px",
              background: "rgba(99, 102, 241, 0.12)",
              border: "1px solid rgba(99, 102, 241, 0.28)",
              marginBottom: "16px"
            }}
          >
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1" }} />
            <span style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "2px", color: "#a5b4fc", textTransform: "uppercase" }}>
              Placement & Hiring Intelligence
            </span>
          </div>

          <h1
            style={{
              fontSize: "clamp(2.4rem, 5vw, 3.8rem)",
              fontWeight: 900,
              letterSpacing: "-2px",
              lineHeight: 1.1,
              margin: "0 0 12px",
              color: "white"
            }}
          >
            Welcome to <span style={{ background: "linear-gradient(135deg, #38bdf8, #818cf8, #c084fc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Cognalyze</span>
          </h1>

          <p style={{ fontSize: "clamp(1rem, 2vw, 1.15rem)", color: "rgba(255, 255, 255, 0.65)", margin: 0, fontWeight: 500 }}>
            Select where you want to go:
          </p>
        </div>

        {/* 3 Large Clear Options */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px"
          }}
        >
          {/* 1. STUDENT OPTION */}
          <div
            id="option-student"
            className="landing-card"
            onClick={() => handleSelect("student")}
            style={{
              background: "linear-gradient(180deg, rgba(56, 189, 248, 0.08) 0%, rgba(10, 15, 29, 0.95) 100%)",
              border: "1px solid rgba(56, 189, 248, 0.25)",
              borderRadius: "24px",
              padding: "36px 28px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: "340px",
              position: "relative",
              overflow: "hidden"
            }}
          >
            <div style={{ position: "absolute", top: 0, right: 0, width: "120px", height: "120px", background: "radial-gradient(circle, rgba(56, 189, 248, 0.2) 0%, transparent 70%)", pointerEvents: "none" }} />
            
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "16px",
                    background: "rgba(56, 189, 248, 0.15)",
                    border: "1px solid rgba(56, 189, 248, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px"
                  }}
                >
                  🎓
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "1px",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    background: "rgba(56, 189, 248, 0.15)",
                    color: "#38bdf8",
                    border: "1px solid rgba(56, 189, 248, 0.3)"
                  }}
                >
                  STUDENT
                </span>
              </div>

              <h2 style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "-1px", margin: "0 0 12px", color: "white" }}>
                Student
              </h2>

              <p style={{ fontSize: "15px", color: "rgba(255, 255, 255, 0.75)", lineHeight: 1.6, margin: "0 0 20px" }}>
                Track opportunities, prep for interviews, build your resume.
              </p>
            </div>

            <button
              disabled={loadingSection !== null}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #0284c7, #38bdf8)",
                color: "white",
                fontSize: "14px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 8px 24px -6px rgba(56, 189, 248, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              <span>{loadingSection === "student" ? "Opening Student..." : "Open Student"}</span>
              <span>→</span>
            </button>
          </div>

          {/* 2. RECRUITER OPTION */}
          <div
            id="option-recruiter"
            className="landing-card"
            onClick={() => handleSelect("recruiter")}
            style={{
              background: "linear-gradient(180deg, rgba(168, 85, 247, 0.08) 0%, rgba(10, 15, 29, 0.95) 100%)",
              border: "1px solid rgba(168, 85, 247, 0.25)",
              borderRadius: "24px",
              padding: "36px 28px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: "340px",
              position: "relative",
              overflow: "hidden"
            }}
          >
            <div style={{ position: "absolute", top: 0, right: 0, width: "120px", height: "120px", background: "radial-gradient(circle, rgba(168, 85, 247, 0.2) 0%, transparent 70%)", pointerEvents: "none" }} />
            
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "16px",
                    background: "rgba(168, 85, 247, 0.15)",
                    border: "1px solid rgba(168, 85, 247, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px"
                  }}
                >
                  💼
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "1px",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    background: "rgba(168, 85, 247, 0.15)",
                    color: "#c084fc",
                    border: "1px solid rgba(168, 85, 247, 0.3)"
                  }}
                >
                  RECRUITER
                </span>
              </div>

              <h2 style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "-1px", margin: "0 0 12px", color: "white" }}>
                Recruiter
              </h2>

              <p style={{ fontSize: "15px", color: "rgba(255, 255, 255, 0.75)", lineHeight: 1.6, margin: "0 0 20px" }}>
                Manage hiring, screen candidates, run assessments.
              </p>
            </div>

            <button
              disabled={loadingSection !== null}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #7c3aed, #a855f7)",
                color: "white",
                fontSize: "14px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 8px 24px -6px rgba(168, 85, 247, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              <span>{loadingSection === "recruiter" ? "Opening Recruiter..." : "Open Recruiter"}</span>
              <span>→</span>
            </button>
          </div>

          {/* 3. POST OPTION */}
          <div
            id="option-post"
            className="landing-card"
            onClick={() => handleSelect("post")}
            style={{
              background: "linear-gradient(180deg, rgba(52, 211, 153, 0.08) 0%, rgba(10, 15, 29, 0.95) 100%)",
              border: "1px solid rgba(52, 211, 153, 0.25)",
              borderRadius: "24px",
              padding: "36px 28px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: "340px",
              position: "relative",
              overflow: "hidden"
            }}
          >
            <div style={{ position: "absolute", top: 0, right: 0, width: "120px", height: "120px", background: "radial-gradient(circle, rgba(52, 211, 153, 0.2) 0%, transparent 70%)", pointerEvents: "none" }} />
            
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    borderRadius: "16px",
                    background: "rgba(52, 211, 153, 0.15)",
                    border: "1px solid rgba(52, 211, 153, 0.35)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "28px"
                  }}
                >
                  📢
                </div>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    letterSpacing: "1px",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    background: "rgba(52, 211, 153, 0.15)",
                    color: "#34d399",
                    border: "1px solid rgba(52, 211, 153, 0.3)"
                  }}
                >
                  POST
                </span>
              </div>

              <h2 style={{ fontSize: "28px", fontWeight: 900, letterSpacing: "-1px", margin: "0 0 12px", color: "white" }}>
                Post
              </h2>

              <p style={{ fontSize: "15px", color: "rgba(255, 255, 255, 0.75)", lineHeight: 1.6, margin: "0 0 20px" }}>
                Browse hiring posts, opportunities, and community updates.
              </p>
            </div>

            <button
              disabled={loadingSection !== null}
              style={{
                width: "100%",
                padding: "14px",
                borderRadius: "12px",
                border: "none",
                background: "linear-gradient(135deg, #059669, #34d399)",
                color: "white",
                fontSize: "14px",
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 8px 24px -6px rgba(52, 211, 153, 0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px"
              }}
            >
              <span>{loadingSection === "post" ? "Opening Post..." : "Open Post"}</span>
              <span>→</span>
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}