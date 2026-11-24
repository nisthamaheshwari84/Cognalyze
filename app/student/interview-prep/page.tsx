"use client";

import React, { useState } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";

export default function StudentInterviewPrepPage() {
  const [selectedTrack, setSelectedTrack] = useState<"all" | "product" | "service">("all");

  const arenas = [
    {
      id: "personalized-arena",
      title: "Personalized Interview Arena (Autonomous AI Studio)",
      interviewer: "Autonomous Adaptive Panel",
      desc: "Cognalyze's flagship personalized interview studio. Features 3-stage adaptive orchestration, dynamic follow-up questioning, real-time MediaPipe eye & gaze proctoring, Student DNA skill trajectories, code sandbox execution, and comprehensive executive reports.",
      track: "all",
      href: "/student/practice-interview",
      badge: "✨ Flagship Autonomous Studio",
      badgeColor: "#356AE6",
      badgeBg: "#EFF4FE",
      badgeBorder: "#D2E0FB",
      icon: "⚡",
      features: ["3-Stage Adaptive Orchestration", "Student DNA Tracking", "MediaPipe Eye Tracking", "Executive Reports & Rubrics"]
    },
    {
      id: "cs-technical",
      title: "CS Fundamentals Technical Interview",
      interviewer: "Alex, Lead Architect",
      desc: "Simulated 1-on-1 technical grilling on DBMS, OOP, Operating Systems, and Networks. Features speech audio narration, integrated code editor, and live follow-up scale questions.",
      track: "product",
      href: "/student/skills/cs-interview",
      badge: "Lead Architect Alex",
      badgeColor: "#356AE6",
      badgeBg: "#EFF4FE",
      badgeBorder: "#D2E0FB",
      icon: "💻",
      features: ["Audio Speech Synthesis", "SQL & Code IDE", "Scale Follow-ups", "21+ Questions"]
    },
    {
      id: "behavioral-hr",
      title: "Behavioral HR & Bar-Raiser Arena",
      interviewer: "Priya Sharma, HR Director",
      desc: "Dual-track behavioral interview simulating both Amazon 16 Leadership Principles (STAR method) and Mass Service HR scenarios (service bond, night shifts, client pressure).",
      track: "service",
      href: "/student/skills/behavioral",
      badge: "HR Director Priya",
      badgeColor: "#B7791F",
      badgeBg: "#FEF7ED",
      badgeBorder: "#F8D8A7",
      icon: "👔",
      features: ["STAR Structure Scoring", "Voice Response Mode", "Service & Product Track", "16+ Scenarios"]
    },
    {
      id: "system-design",
      title: "High-Scale System Design Studio",
      interviewer: "Principal Systems Architect",
      desc: "Architect distributed production systems (Rate Limiter, TinyURL, WhatsApp Chat, Uber Dispatch, Flash Sale, Netflix CDN) across 4 dimensions with real-time word count telemetry.",
      track: "product",
      href: "/student/skills/system-design",
      badge: "L4/L5 Production Scale",
      badgeColor: "#162A43",
      badgeBg: "#F6F5F1",
      badgeBorder: "#E4E1DA",
      icon: "🏗️",
      features: ["45-Min Timed Live Mode", "Blueprint Studio", "4-Quadrant Form", "6 Challenges"]
    },
    {
      id: "mass-aptitude",
      title: "Mass Service Aptitude Simulator",
      interviewer: "Campus Assessment Board",
      desc: "Timed online aptitude test papers matching exact corporate evaluation patterns for TCS iON NQT, Infosys InfyTQ/SP, Wipro Elite NLTH, and Accenture Cognitive assessment.",
      track: "service",
      href: "/student/skills/aptitude",
      badge: "Must-Clear Gate",
      badgeColor: "#C24141",
      badgeBg: "#FDF2F2",
      badgeBorder: "#F8C8C8",
      icon: "⏱️",
      features: ["TCS / Infosys / Wipro", "Timed Speed Test", "Sub-Topic Filtering", "42+ Questions"]
    },
    {
      id: "gd-arena",
      title: "AI Group Discussion (GD) Arena",
      interviewer: "Multi-Persona AI Panel",
      desc: "Live simulated group discussion room with diverse AI participants (Analytical, Skeptical, Moderating). Test your articulation, rebuttal, timing, and consensus building.",
      track: "service",
      href: "/student/gd-practice",
      badge: "Communication Filter",
      badgeColor: "#2E7D5B",
      badgeBg: "#EAF4EE",
      badgeBorder: "#C8E4D3",
      icon: "🗣️",
      features: ["Multi-Agent Debate", "Audio Transcript", "Turn-Taking Telemetry", "Culture Fit"]
    },
    {
      id: "full-simulation",
      title: "Full Recruitment Pipeline Simulation",
      interviewer: "Autonomous Hiring Panel (ATS → OA → GD → Tech → HR)",
      desc: "Complete 5-round continuous recruitment journey: Resume ATS screening, Online Assessment coding challenge, Group Discussion debate, Tech interview, and HR round with a non-blended holistic report.",
      track: "all",
      href: "/student/simulation",
      badge: "Flagship 5-Round Journey",
      badgeColor: "#356AE6",
      badgeBg: "#EFF4FE",
      badgeBorder: "#D2E0FB",
      icon: "🏆",
      features: ["5 Sequential Stages", "Non-Blended Holistic Report", "Honest Elimination Pinpoint", "OA-Conditioned Tech Probing"]
    },
    {
      id: "assessment-arena",
      title: "Proctored Assessment Arena",
      interviewer: "Standardized Testing Board",
      desc: "Comprehensive timed technical exam combining speed quantitative/logical aptitude reasoning with live algorithmic coding problems under anti-cheat proctoring.",
      track: "all",
      href: "/student/assessment-arena",
      badge: "Timed & Proctored",
      badgeColor: "#162A43",
      badgeBg: "#F6F5F1",
      badgeBorder: "#E4E1DA",
      icon: "🛡️",
      features: ["Timed Coding + Aptitude", "Tab & Window Proctoring", "Auto-Submit on Expiry", "Detailed Score Breakdown"]
    }
  ];

  const filteredArenas = arenas.filter(a => selectedTrack === "all" || a.track === selectedTrack || a.track === "all");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1", color: "#17191C", fontFamily: "Inter, sans-serif" }}>
      <AppNav role="student" />

      <main style={{ maxWidth: 1300, margin: "0 auto", padding: "32px 24px" }}>
        
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 5, backgroundColor: "#EFF4FE", color: "#356AE6", fontWeight: 700, border: "1px solid #D2E0FB" }}>
                INTERVIEW PREPARATION MODULE
              </span>
              <span style={{ fontSize: 12, color: "#667085" }}>
                8 Rigorous Evaluation Arenas
              </span>
            </div>
            <h1 style={{ fontSize: "clamp(1.5rem, 2.5vw, 1.9rem)", fontWeight: 700, margin: 0, color: "#162A43", letterSpacing: "-0.4px" }}>
              🎙️ Mock Interview & Assessment Arenas
            </h1>
            <p style={{ fontSize: 13, color: "#667085", margin: "8px 0 0", maxWidth: 680, lineHeight: 1.5 }}>
              Prepare for rigorous campus recruitment selection funnels with conversational AI interviewers, timed aptitude papers, and high-scale architecture studios.
            </p>
          </div>

          {/* Action Links & Track Filter */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <Link
              href="/student/simulation"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 7,
                backgroundColor: "#356AE6",
                color: "#ffffff",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 13,
                boxShadow: "0 2px 6px rgba(53, 106, 230, 0.2)"
              }}
            >
              🏆 Full Pipeline Simulation
            </Link>
            <Link
              href="/student/interview-prep/history"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                borderRadius: 7,
                backgroundColor: "#FFFFFF",
                border: "1px solid #E4E1DA",
                color: "#162A43",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: 13,
                boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)"
              }}
            >
              📊 Prep History
            </Link>

            <div style={{ display: "flex", backgroundColor: "#FFFFFF", padding: 3, borderRadius: 8, border: "1px solid #E4E1DA" }}>
              <button
                onClick={() => setSelectedTrack("all")}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "none",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  backgroundColor: selectedTrack === "all" ? "#356AE6" : "transparent",
                  color: selectedTrack === "all" ? "#ffffff" : "#667085",
                  transition: "all 0.15s ease"
                }}
              >
                All Arenas
              </button>
              <button
                onClick={() => setSelectedTrack("product")}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "none",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  backgroundColor: selectedTrack === "product" ? "#356AE6" : "transparent",
                  color: selectedTrack === "product" ? "#ffffff" : "#667085",
                  transition: "all 0.15s ease"
                }}
              >
                Product Track
              </button>
              <button
                onClick={() => setSelectedTrack("service")}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "none",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  backgroundColor: selectedTrack === "service" ? "#356AE6" : "transparent",
                  color: selectedTrack === "service" ? "#ffffff" : "#667085",
                  transition: "all 0.15s ease"
                }}
              >
                Mass Service
              </button>
            </div>
          </div>
        </div>

        {/* ARENA CARDS GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 380px), 1fr))", gap: 20 }}>
          {filteredArenas.map(arena => {
            const isFlagship = arena.id === "personalized-arena";
            return (
              <div
                key={arena.id}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: isFlagship ? "2px solid #356AE6" : "1px solid #E4E1DA",
                  borderRadius: 10,
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)",
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                {isFlagship && (
                  <div style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    backgroundColor: "#356AE6",
                    color: "#ffffff",
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "3px 12px",
                    borderBottomLeftRadius: 8,
                    letterSpacing: 0.5
                  }}>
                    FLAGSHIP STUDIO
                  </div>
                )}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div style={{ fontSize: 28 }}>{arena.icon}</div>
                    <span
                      style={{
                        fontSize: 11,
                        padding: "3px 9px",
                        borderRadius: 5,
                        fontWeight: 600,
                        backgroundColor: arena.badgeBg,
                        color: arena.badgeColor,
                        border: `1px solid ${arena.badgeBorder}`
                      }}
                    >
                      {arena.badge}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 16, fontWeight: 700, color: "#162A43", margin: "0 0 6px" }}>
                    {arena.title}
                  </h3>
                  <div style={{ fontSize: 12, color: "#356AE6", fontWeight: 600, marginBottom: 10 }}>
                    Interviewer: {arena.interviewer}
                  </div>
                  <p style={{ fontSize: 12, color: "#667085", margin: "0 0 16px", lineHeight: 1.55 }}>
                    {arena.desc}
                  </p>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
                    {arena.features.map((feat, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: 11,
                          padding: "3px 8px",
                          borderRadius: 5,
                          backgroundColor: "#F6F5F1",
                          color: "#162A43",
                          border: "1px solid #E4E1DA",
                          fontWeight: 500
                        }}
                      >
                        ✓ {feat}
                      </span>
                    ))}
                  </div>
                </div>

                <Link
                  href={arena.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "10px 16px",
                    borderRadius: 7,
                    backgroundColor: isFlagship ? "#356AE6" : "#FFFFFF",
                    border: isFlagship ? "none" : "1px solid #E4E1DA",
                    color: isFlagship ? "#ffffff" : "#162A43",
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: 600,
                    boxShadow: isFlagship ? "0 2px 8px rgba(53, 106, 230, 0.25)" : "0 1px 2px rgba(16, 24, 40, 0.04)",
                    transition: "all 0.15s ease"
                  }}
                >
                  {isFlagship ? "⚡ Launch Autonomous Arena ➔" : "Enter Arena Session ➔"}
                </Link>
              </div>
            );
          })}
        </div>

      </main>
    </div>
  );
}
