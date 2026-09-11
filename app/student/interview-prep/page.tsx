"use client";

import React, { useState } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";

export default function StudentInterviewPrepPage() {
  const [selectedTrack, setSelectedTrack] = useState<"all" | "product" | "service">("all");

  const arenas = [
    {
      id: "vision-interview",
      title: "FAANG AI Mock Interview (Live Vision & Voice)",
      interviewer: "Alex, Lead Architect & Vision Panel",
      desc: "Cognalyze's flagship full-screen FAANG technical interview. Features Alex's interactive animated 3D avatar, real-time voice speech synthesis (TTS) & mic transcription (STT), webcam face oval proctoring, posture & eye contact telemetry, and 7-axis precision scoring.",
      track: "product",
      href: "/interview",
      badge: "⭐ Flagship FAANG Experience",
      badgeColor: "#ec4899",
      icon: "🎙️",
      features: ["3D Alex Animated Avatar", "Webcam Vision & Eye Contact", "Voice STT & TTS Audio", "7-Axis Scoring & Verdict"]
    },
    {
      id: "cs-technical",
      title: "CS Fundamentals Technical Interview",
      interviewer: "Alex, Lead Architect",
      desc: "Simulated 1-on-1 technical grilling on DBMS, OOP, Operating Systems, and Networks. Features speech audio narration, integrated code editor, and live follow-up scale questions.",
      track: "product",
      href: "/student/skills/cs-interview",
      badge: "Lead Architect Alex",
      badgeColor: "#38bdf8",
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
      badgeColor: "#fbbf24",
      icon: "👔",
      features: ["STAR Structure Scoring", "Voice Response Mode", "Service & FAANG Track", "16+ Scenarios"]
    },
    {
      id: "system-design",
      title: "High-Scale System Design Studio",
      interviewer: "Principal Systems Architect",
      desc: "Architect distributed production systems (Rate Limiter, TinyURL, WhatsApp Chat, Uber Dispatch, Flash Sale, Netflix CDN) across 4 dimensions with real-time word count telemetry.",
      track: "product",
      href: "/student/skills/system-design",
      badge: "L4/L5 Production Scale",
      badgeColor: "#a855f7",
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
      badgeColor: "#ef4444",
      icon: "⏱️",
      features: ["TCS / Infosys / Wipro", "Timed Speed Test", "Sub-Topic Filtering", "42+ Questions"]
    },
    {
      id: "gd-arena",
      title: "FAANG AI Group Discussion (GD) Arena",
      interviewer: "Multi-Persona AI Panel",
      desc: "Live simulated group discussion room with diverse AI participants (Analytical, Skeptical, Moderating). Test your articulation, rebuttal, timing, and consensus building.",
      track: "service",
      href: "/student/gd-practice",
      badge: "Communication Filter",
      badgeColor: "#10b981",
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
      badgeColor: "#a855f7",
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
      badgeColor: "#f43f5e",
      icon: "🛡️",
      features: ["Timed Coding + Aptitude", "Tab & Window Proctoring", "Auto-Submit on Expiry", "Detailed Score Breakdown"]
    }
  ];

  const filteredArenas = arenas.filter(a => selectedTrack === "all" || a.track === selectedTrack || a.track === "all");

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#060913", color: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="student" />

      <main style={{ maxWidth: 1300, margin: "0 auto", padding: "32px 24px" }}>
        
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(99,102,241,0.2)", color: "#818cf8", fontWeight: 800 }}>
                STUDENT INTERVIEW PREPARATION
              </span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                8 Interactive Arenas
              </span>
            </div>
            <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>
              🎙️ Mock Interview & Assessment Arenas
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", margin: "8px 0 0", maxWidth: 650, lineHeight: 1.5 }}>
              Prepare for real campus selection funnels with conversational AI interviewers, timed aptitude papers, and high-scale architecture studios.
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
                borderRadius: 10,
                background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                color: "white",
                textDecoration: "none",
                fontWeight: 800,
                fontSize: 13,
                boxShadow: "0 0 20px rgba(99,102,241,0.3)",
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
                borderRadius: 10,
                background: "rgba(99,102,241,0.15)",
                border: "1px solid rgba(99,102,241,0.3)",
                color: "#c7d2fe",
                textDecoration: "none",
                fontWeight: 700,
                fontSize: 13,
              }}
            >
              📊 Prep History
            </Link>

            <div style={{ display: "flex", background: "rgba(0,0,0,0.5)", padding: 4, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)" }}>
              <button
                onClick={() => setSelectedTrack("all")}
                style={{
                  padding: "6px 14px",
                  borderRadius: 8,
                  border: "none",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  background: selectedTrack === "all" ? "#6366f1" : "transparent",
                  color: selectedTrack === "all" ? "white" : "#94a3b8"
                }}
              >
                All Arenas
              </button>
            <button
              onClick={() => setSelectedTrack("product")}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                background: selectedTrack === "product" ? "#38bdf8" : "transparent",
                color: selectedTrack === "product" ? "black" : "#94a3b8"
              }}
            >
              Product / FAANG
            </button>
            <button
              onClick={() => setSelectedTrack("service")}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                border: "none",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                background: selectedTrack === "service" ? "#10b981" : "transparent",
                color: selectedTrack === "service" ? "white" : "#94a3b8"
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
            const isFlagship = arena.id === "vision-interview";
            return (
              <div
                key={arena.id}
                style={{
                  background: isFlagship 
                    ? "linear-gradient(145deg, rgba(236, 72, 153, 0.15) 0%, rgba(15, 23, 42, 0.85) 100%)"
                    : "rgba(15, 23, 42, 0.7)",
                  border: isFlagship
                    ? "1.5px solid rgba(236, 72, 153, 0.5)"
                    : "1px solid rgba(255, 255, 255, 0.08)",
                  borderRadius: 18,
                  padding: "24px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: isFlagship
                    ? "0 14px 35px rgba(236, 72, 153, 0.25)"
                    : "0 10px 25px rgba(0,0,0,0.4)",
                  position: "relative",
                  overflow: "hidden"
                }}
              >
                {isFlagship && (
                  <div style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    background: "linear-gradient(135deg, #ec4899, #8b5cf6)",
                    color: "white",
                    fontSize: 9,
                    fontWeight: 900,
                    padding: "3px 14px",
                    borderBottomLeftRadius: 10,
                    letterSpacing: 1
                  }}>
                    MOST POPULAR
                  </div>
                )}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <div style={{ fontSize: 32 }}>{arena.icon}</div>
                    <span
                      style={{
                        fontSize: 10,
                        padding: "3px 9px",
                        borderRadius: 6,
                        fontWeight: 800,
                        background: `${arena.badgeColor}18`,
                        color: arena.badgeColor,
                        border: `1px solid ${arena.badgeColor}40`
                      }}
                    >
                      {arena.badge}
                    </span>
                  </div>

                  <h3 style={{ fontSize: 17, fontWeight: 800, color: "white", margin: "0 0 6px" }}>
                    {arena.title}
                  </h3>
                  <div style={{ fontSize: 11, color: isFlagship ? "#f472b6" : "#818cf8", fontWeight: 700, marginBottom: 10 }}>
                    Interviewer: {arena.interviewer}
                  </div>
                  <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 16px", lineHeight: 1.55 }}>
                    {arena.desc}
                  </p>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
                    {arena.features.map((feat, idx) => (
                      <span
                        key={idx}
                        style={{
                          fontSize: 10,
                          padding: "2px 7px",
                          borderRadius: 4,
                          background: isFlagship ? "rgba(236,72,153,0.15)" : "rgba(255,255,255,0.05)",
                          color: isFlagship ? "#fbcfe8" : "#cbd5e1"
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
                    borderRadius: 10,
                    background: isFlagship
                      ? "linear-gradient(135deg, #ec4899, #8b5cf6)"
                      : "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.15))",
                    border: isFlagship ? "none" : "1px solid rgba(99,102,241,0.4)",
                    color: "white",
                    textDecoration: "none",
                    fontSize: 12,
                    fontWeight: 800,
                    boxShadow: isFlagship ? "0 4px 15px rgba(236,72,153,0.4)" : "none",
                    transition: "all 0.15s ease"
                  }}
                >
                  {isFlagship ? "🎙️ Launch Flagship FAANG Interview ➔" : "Enter Arena Session ➔"}
                </Link>
              </div>
            );
          })}
        </div>

      </main>
    </div>
  );
}
