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
    let isMounted = true;
    async function init() {
      let activeCId = "";
      try {
        const sessionRes = await fetch("/api/auth/session");
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          if (sessionData.authenticated && sessionData.user?.id) {
            activeCId = sessionData.user.id;
          }
        }
      } catch (err) {
        console.warn("Session check error in journey:", err);
      }

      if (!activeCId && typeof window !== "undefined") {
        activeCId = localStorage.getItem("cognalyze_student_id") || "";
      }

      if (isMounted) {
        setCandidateId(activeCId);
        if (activeCId) {
          loadData(activeCId);
        } else {
          setLoading(false);
        }
      }
    }
    init();
    return () => { isMounted = false; };
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
    <div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1", color: "#17191C", fontFamily: "Inter, sans-serif" }}>
      <AppNav role="student" />

      <main style={{ maxWidth: 1320, margin: "0 auto", padding: "32px 24px" }}>
        
        {/* HEADER */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase", color: "#356AE6" }}>
              END-TO-END CAREER PIPELINE
            </span>
            <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, backgroundColor: "#EAF4EE", color: "#2E7D5B", border: "1px solid #C8E4D3", fontWeight: 700 }}>
              ● 9-Stage Connected Pipeline
            </span>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "4px 0 0", color: "#162A43", letterSpacing: "-0.4px" }}>
            Your Career Journey
          </h1>
          <p style={{ fontSize: 13, color: "#667085", margin: "4px 0 0" }}>
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
            backgroundColor: "#FFFFFF",
            borderRadius: 10,
            border: "1px solid #E4E1DA",
            boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)"
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
                  borderRadius: 8,
                  border: isSelected ? "1px solid #356AE6" : "1px solid transparent",
                  backgroundColor: isSelected ? "#EFF4FE" : "#FFFFFF",
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                  transition: "all 0.15s ease"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: isSelected ? "#356AE6" : "#667085" }}>
                    {stage.number}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: isCompleted ? "#2E7D5B" : isInProgress ? "#356AE6" : "#98A2B3" }}>
                    {isCompleted ? "✓" : isInProgress ? "●" : "○"}
                  </span>
                </div>

                <span style={{ fontSize: 12, fontWeight: 600, textAlign: "center", color: isSelected ? "#162A43" : "#667085" }}>
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
            backgroundColor: "#FFFFFF",
            border: "1px solid #E4E1DA",
            borderRadius: 10,
            padding: "28px",
            boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)"
          }}
        >
          {/* TOP BAR */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 8,
                  backgroundColor: "#EFF4FE",
                  border: "1px solid #D2E0FB",
                  color: "#356AE6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  fontWeight: 700
                }}
              >
                {activeStage.number}
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0, color: "#162A43" }}>
                  Stage {activeStage.number}: {activeStage.name}
                </h2>
                <span style={{ fontSize: 13, color: "#667085" }}>
                  {activeStage.summary}
                </span>
              </div>
            </div>

            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 5,
                backgroundColor: activeStage.status === "completed" ? "#EAF4EE" : "#EFF4FE",
                color: activeStage.status === "completed" ? "#2E7D5B" : "#356AE6",
                border: activeStage.status === "completed" ? "1px solid #C8E4D3" : "1px solid #D2E0FB"
              }}
            >
              {activeStage.status === "completed" ? "COMPLETED" : "ACTIVE / IN PROGRESS"}
            </span>
          </div>

          {/* 4 STAGE PERSPECTIVES (WHAT HAPPENED, EVIDENCE, WHAT CHANGED, NEXT ACTION) */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 24 }}>
            
            {/* 1. WHAT HAPPENED */}
            <div style={{ backgroundColor: "#F6F5F1", borderRadius: 8, padding: "18px", border: "1px solid #E4E1DA" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#356AE6", textTransform: "uppercase", letterSpacing: 0.8 }}>
                1. What Happened
              </span>
              <p style={{ fontSize: 13, color: "#17191C", lineHeight: 1.5, marginTop: 8 }}>
                {activeStage.details.whatHappened}
              </p>
            </div>

            {/* 2. WHAT EVIDENCE EXISTS */}
            <div style={{ backgroundColor: "#F6F5F1", borderRadius: 8, padding: "18px", border: "1px solid #E4E1DA" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#2E7D5B", textTransform: "uppercase", letterSpacing: 0.8 }}>
                2. What Evidence Exists
              </span>
              <p style={{ fontSize: 13, color: "#17191C", lineHeight: 1.5, marginTop: 8 }}>
                {activeStage.details.whatEvidenceExists}
              </p>
            </div>

            {/* 3. WHAT CHANGED */}
            <div style={{ backgroundColor: "#F6F5F1", borderRadius: 8, padding: "18px", border: "1px solid #E4E1DA" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#B7791F", textTransform: "uppercase", letterSpacing: 0.8 }}>
                3. What Changed
              </span>
              <p style={{ fontSize: 13, color: "#17191C", lineHeight: 1.5, marginTop: 8 }}>
                {activeStage.details.whatChanged}
              </p>
            </div>

            {/* 4. NEXT BEST ACTION */}
            <div style={{ backgroundColor: "#FFFFFF", borderRadius: 8, padding: "18px", border: "1px solid #356AE6", display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 1px 3px rgba(53, 106, 230, 0.08)" }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#162A43", textTransform: "uppercase", letterSpacing: 0.8 }}>
                  4. Recommended Action
                </span>
                <p style={{ fontSize: 13, color: "#667085", lineHeight: 1.4, marginTop: 8 }}>
                  Keep your pipeline momentum active by executing this connected milestone.
                </p>
              </div>

              <Link
                href={activeStage.details.nextAction.href}
                style={{
                  textAlign: "center",
                  textDecoration: "none",
                  backgroundColor: "#356AE6",
                  color: "white",
                  padding: "10px 16px",
                  borderRadius: 7,
                  fontSize: 12,
                  fontWeight: 600,
                  marginTop: 12,
                  boxShadow: "0 2px 6px rgba(53, 106, 230, 0.2)"
                }}
              >
                {activeStage.details.nextAction.label} →
              </Link>
            </div>
          </div>

          {/* BOTTOM CONTROLS */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 16, borderTop: "1px solid #E4E1DA" }}>
            <button
              onClick={() => handleOpenWhy(profile?.targetProfile?.coreCapabilities?.[0] || "Python")}
              style={{
                background: "transparent",
                border: "none",
                color: "#356AE6",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Inspect Core Capability Provenance →
            </button>

            <button
              onClick={() => setAskModalOpen(true)}
              style={{
                backgroundColor: "#FFFFFF",
                border: "1px solid #E4E1DA",
                borderRadius: 7,
                color: "#162A43",
                padding: "6px 14px",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(16, 24, 40, 0.04)"
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
