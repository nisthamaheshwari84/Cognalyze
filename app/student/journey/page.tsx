"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import GlobalEvidenceDrawer from "@/components/student/GlobalEvidenceDrawer";
import AskCognalyzeModal from "@/components/student/AskCognalyzeModal";
import { StudentDNAProfile } from "@/lib/intelligence/student-intelligence";

interface JourneyStage {
  id: string;
  number: string;
  name: string;
  status: "completed" | "in_progress" | "upcoming";
  summary: string;
  details: {
    whatHappened: string;
    whatEvidenceExists: string;
    whatChanged: string;
    nextAction: {
      label: string;
      href: string;
    };
  };
}

export default function StudentJourneyPage() {
  const [candidateId, setCandidateId] = useState("student-demo");
  const [profile, setProfile] = useState<StudentDNAProfile | null>(null);
  const [activeStageId, setActiveStageId] = useState<string>("01-direction");
  const [loading, setLoading] = useState(true);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCap, setSelectedCap] = useState<string | null>(null);
  const [askModalOpen, setAskModalOpen] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("cognalyze_student_id") || "student-demo" : "student-demo";
    setCandidateId(stored);
    loadData(stored);
  }, []);

  const loadData = async (cId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/student/dna?candidateId=${cId}`);
      const data = await res.json();
      if (data.intelligence) {
        setProfile(data.intelligence);
      }
    } catch (err) {
      console.error("Failed to load Journey data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWhy = (capName: string) => {
    setSelectedCap(capName);
    setDrawerOpen(true);
  };

  // Construct the 9 connected stages using actual profile data
  const stages: JourneyStage[] = [
    {
      id: "01-direction",
      number: "01",
      name: "Direction",
      status: "completed",
      summary: `Primary career target set to ${profile?.intent.primaryGoal || "AI/ML Engineer"}.`,
      details: {
        whatHappened: `Target career direction defined: ${profile?.intent.primaryGoal || "AI/ML Engineer"}. Target timeline is ${profile?.intent.timeline || "Next 6 months"}.`,
        whatEvidenceExists: `Career Intent record locked. Interests: ${(profile?.intent.interests || ["Applied AI", "ML Systems"]).join(", ")}.`,
        whatChanged: `Target role benchmark activated: ${profile?.targetProfile.coreCapabilities.length || 4} Core capabilities and ${profile?.targetProfile.importantCapabilities.length || 4} Important capabilities configured.`,
        nextAction: {
          label: "Adjust Direction / Goals",
          href: "/student/dashboard"
        }
      }
    },
    {
      id: "02-build",
      number: "02",
      name: "Build",
      status: profile && profile.totalEvidenceCount > 0 ? "completed" : "in_progress",
      summary: "Resume & portfolio artifacts parsed into Level 1 & 2 evidence.",
      details: {
        whatHappened: "Uploaded resume and linked project artifacts were processed by the evidence engine.",
        whatEvidenceExists: `${profile?.totalEvidenceCount || 0} evidence records generated. Projects mapped to demonstrated Level 2 capabilities.`,
        whatChanged: "Self-reported claims captured as Level 1; concrete project artifacts corroborated as Level 2.",
        nextAction: {
          label: "Update Resume & Projects",
          href: "/student/resume"
        }
      }
    },
    {
      id: "03-develop",
      number: "03",
      name: "Develop",
      status: "in_progress",
      summary: "DSA Striver SDE Sheet progression and algorithm problem solving.",
      details: {
        whatHappened: "Actively solving algorithmic challenges and computer science problem sets.",
        whatEvidenceExists: "Direct DSA evidence items stored with verified test case executions.",
        whatChanged: "DSA & Problem Solving capability upgraded to Assessed (Level 3).",
        nextAction: {
          label: "Continue DSA Tracker",
          href: "/student/dsa-tracker"
        }
      }
    },
    {
      id: "04-prove",
      number: "04",
      name: "Prove",
      status: profile?.capabilities?.["Technical Depth"] ? "completed" : "in_progress",
      summary: "Structured technical assessment & mock interview under pressure.",
      details: {
        whatHappened: "Completed FAANG mock interviews with 7-axis evaluation scoring.",
        whatEvidenceExists: "Assessed interview transcripts, technical depth scorecard, and hiring signals recorded.",
        whatChanged: "Verified assessed capabilities across Communication, Problem Solving, and System Design.",
        nextAction: {
          label: "Launch FAANG Mock Interview",
          href: "/interview"
        }
      }
    },
    {
      id: "05-match",
      number: "05",
      name: "Match",
      status: "completed",
      summary: "Algorithmic alignment of 50+ campus drives against current DNA.",
      details: {
        whatHappened: "DNA capability graph compared with requirements of verified campus drives.",
        whatEvidenceExists: "Explicit matching tags and unresolved gap warnings generated without fake percentages.",
        whatChanged: "Opportunities categorized by Strong Alignment vs Developing Fit.",
        nextAction: {
          label: "Explore Opportunity Matches",
          href: "/student/opportunities"
        }
      }
    },
    {
      id: "06-apply",
      number: "06",
      name: "Apply",
      status: "in_progress",
      summary: "Applications submitted with inherited DNA snapshots & prep milestones.",
      details: {
        whatHappened: "Application records created in the placement pipeline.",
        whatEvidenceExists: "Each application inherits a point-in-time DNA snapshot, known strengths, and unresolved gaps.",
        whatChanged: "Pipeline tracks bookmarked drives, submitted applications, and active rounds.",
        nextAction: {
          label: "Manage Application Pipeline",
          href: "/student/applications"
        }
      }
    },
    {
      id: "07-interview",
      number: "07",
      name: "Interview",
      status: "in_progress",
      summary: "Targeted interviews focusing specifically on unresolved information gaps.",
      details: {
        whatHappened: "Live corporate and simulated interview rounds.",
        whatEvidenceExists: "Interviews question uncertain areas rather than repeating already-established strengths.",
        whatChanged: "Post-interview scores feed new assessed evidence into the student's DNA.",
        nextAction: {
          label: "Practice Interview Arenas",
          href: "/student/interview-prep"
        }
      }
    },
    {
      id: "08-outcome",
      number: "08",
      name: "Outcome",
      status: profile?.careerMemory && profile.careerMemory.length > 0 ? "completed" : "upcoming",
      summary: "Placement decisions and interview feedback persisted to Career Memory.",
      details: {
        whatHappened: `${profile?.careerMemory?.length || 0} application outcomes recorded in Career Memory.`,
        whatEvidenceExists: "Direct recruiter observations and round outcomes logged with zero fabricated reasons.",
        whatChanged: "Career Memory updated to analyze trends across multiple recorded rounds.",
        nextAction: {
          label: "View Application History",
          href: "/student/applications"
        }
      }
    },
    {
      id: "09-learn",
      number: "09",
      name: "Learn",
      status: "in_progress",
      summary: "Continuous DNA recalculation & gap-driven next best action loop.",
      details: {
        whatHappened: "The Career Intelligence loop completes and redirects to your highest-return next action.",
        whatEvidenceExists: `${profile?.nextBestActions?.length || 0} active next best actions calculated from current gaps.`,
        whatChanged: "DNA updates automatically trigger re-matching and targeted revision queues.",
        nextAction: {
          label: "Back to Command Center",
          href: "/student/dashboard"
        }
      }
    }
  ];

  const activeStage = stages.find(s => s.id === activeStageId) || stages[0];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#060913", color: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="student" />

      <main style={{ maxWidth: 1320, margin: "0 auto", padding: "32px 24px" }}>
        
        {/* HEADER */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.2, textTransform: "uppercase", color: "#818cf8" }}>
              END-TO-END CAREER PIPELINE
            </span>
            <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(16, 185, 129, 0.15)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.3)", fontWeight: 700 }}>
              ● 9-Stage Connected Pipeline
            </span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, color: "white" }}>
            Your Career Journey
          </h1>
          <p style={{ fontSize: 14, color: "#94a3b8", margin: "4px 0 0" }}>
            Every meaningful student action flows through one continuous intelligence system. Click any stage to inspect live evidence and next actions.
          </p>
        </div>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* INTERACTIVE STAGES STRIP                                   */}
        {/* ══════════════════════════════════════════════════════════ */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: 8,
            marginBottom: 28,
            padding: 8,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            borderRadius: 14,
            border: "1px solid rgba(255, 255, 255, 0.08)"
          }}
        >
          {stages.map(stage => {
            const isSelected = stage.id === activeStageId;
            const isCompleted = stage.status === "completed";
            const isInProgress = stage.status === "in_progress";

            return (
              <button
                key={stage.id}
                onClick={() => setActiveStageId(stage.id)}
                style={{
                  padding: "14px 10px",
                  borderRadius: 10,
                  border: isSelected ? "1px solid #6366f1" : "1px solid rgba(255, 255, 255, 0.05)",
                  background: isSelected 
                    ? "linear-gradient(135deg, rgba(99, 102, 241, 0.25) 0%, rgba(168, 85, 247, 0.15) 100%)"
                    : "rgba(255, 255, 255, 0.02)",
                  color: "white",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.15s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: isSelected ? "#818cf8" : "#64748b" }}>
                    {stage.number}
                  </span>
                  <span style={{ fontSize: 10, color: isCompleted ? "#10b981" : isInProgress ? "#38bdf8" : "#64748b" }}>
                    {isCompleted ? "✓" : isInProgress ? "●" : "○"}
                  </span>
                </div>

                <span style={{ fontSize: 12, fontWeight: 800, textAlign: "center", color: isSelected ? "#ffffff" : "#cbd5e1" }}>
                  {stage.name}
                </span>
              </button>
            );
          })}
        </div>

        {/* ══════════════════════════════════════════════════════════ */}
        {/* ACTIVE STAGE INSPECTOR CARD                                */}
        {/* ══════════════════════════════════════════════════════════ */}
        <div
          style={{
            backgroundColor: "rgba(15, 23, 42, 0.7)",
            border: "1px solid rgba(99, 102, 241, 0.3)",
            borderRadius: 16,
            padding: "28px",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.5)"
          }}
        >
          {/* TOP BAR */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: "linear-gradient(135deg, #6366f1, #a855f7)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 18,
                  fontWeight: 900
                }}
              >
                {activeStage.number}
              </div>
              <div>
                <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0, color: "white" }}>
                  Stage {activeStage.number}: {activeStage.name}
                </h2>
                <span style={{ fontSize: 13, color: "#94a3b8" }}>
                  {activeStage.summary}
                </span>
              </div>
            </div>

            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                padding: "4px 10px",
                borderRadius: 6,
                background: activeStage.status === "completed" ? "rgba(16, 185, 129, 0.15)" : "rgba(56, 189, 248, 0.15)",
                color: activeStage.status === "completed" ? "#10b981" : "#38bdf8",
                border: activeStage.status === "completed" ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(56, 189, 248, 0.3)"
              }}
            >
              {activeStage.status === "completed" ? "COMPLETED" : "ACTIVE / IN PROGRESS"}
            </span>
          </div>

          {/* 4 STAGE PERSPECTIVES (WHAT HAPPENED, EVIDENCE, WHAT CHANGED, NEXT ACTION) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 24 }}>
            
            {/* 1. WHAT HAPPENED */}
            <div style={{ backgroundColor: "rgba(30, 41, 59, 0.4)", borderRadius: 12, padding: "18px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#818cf8", textTransform: "uppercase", letterSpacing: 0.8 }}>
                1. What Happened
              </span>
              <p style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.5, marginTop: 8 }}>
                {activeStage.details.whatHappened}
              </p>
            </div>

            {/* 2. WHAT EVIDENCE EXISTS */}
            <div style={{ backgroundColor: "rgba(30, 41, 59, 0.4)", borderRadius: 12, padding: "18px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#10b981", textTransform: "uppercase", letterSpacing: 0.8 }}>
                2. What Evidence Exists
              </span>
              <p style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.5, marginTop: 8 }}>
                {activeStage.details.whatEvidenceExists}
              </p>
            </div>

            {/* 3. WHAT CHANGED */}
            <div style={{ backgroundColor: "rgba(30, 41, 59, 0.4)", borderRadius: 12, padding: "18px", border: "1px solid rgba(255, 255, 255, 0.06)" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#f59e0b", textTransform: "uppercase", letterSpacing: 0.8 }}>
                3. What Changed
              </span>
              <p style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.5, marginTop: 8 }}>
                {activeStage.details.whatChanged}
              </p>
            </div>

            {/* 4. NEXT BEST ACTION */}
            <div style={{ backgroundColor: "rgba(30, 41, 59, 0.4)", borderRadius: 12, padding: "18px", border: "1px solid rgba(99, 102, 241, 0.3)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", letterSpacing: 0.8 }}>
                  4. Recommended Action
                </span>
                <p style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.4, marginTop: 8 }}>
                  Keep your pipeline momentum active by executing this connected milestone.
                </p>
              </div>

              <Link
                href={activeStage.details.nextAction.href}
                style={{
                  textAlign: "center",
                  textDecoration: "none",
                  background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                  color: "white",
                  padding: "10px 16px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 800,
                  marginTop: 12
                }}
              >
                {activeStage.details.nextAction.label} →
              </Link>
            </div>
          </div>

          {/* BOTTOM CONTROLS */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <button
              onClick={() => handleOpenWhy(profile?.targetProfile?.coreCapabilities?.[0] || "Python")}
              style={{
                background: "transparent",
                border: "none",
                color: "#818cf8",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Inspect Core Capability Provenance →
            </button>

            <button
              onClick={() => setAskModalOpen(true)}
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                borderRadius: 8,
                color: "#cbd5e1",
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Ask AI about this stage
            </button>
          </div>
        </div>
      </main>

      {/* GLOBAL EVIDENCE DRAWER */}
      <GlobalEvidenceDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        capabilityName={selectedCap}
        candidateId={candidateId}
      />

      {/* ASK COGNALYZE MODAL */}
      <AskCognalyzeModal
        isOpen={askModalOpen}
        onClose={() => setAskModalOpen(false)}
        candidateId={candidateId}
        onOpenEvidenceDrawer={handleOpenWhy}
      />
    </div>
  );
}
