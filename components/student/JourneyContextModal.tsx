"use client";

import React from "react";
import Link from "next/link";
import { StudentDNAProfile } from "@/lib/intelligence/student-intelligence";
import { useTheme } from "@/components/ThemeProvider";

export interface StageContextData {
  stageNumber: string;
  stageName: string;
  subtitle: string;
  status: "Active / Current" | "Completed" | "Upcoming";
  whatHappened: string;
  whatEvidenceExists: string;
  whatChanged: string;
  recommendedAction: {
    label: string;
    href: string;
    description: string;
  };
}

const STAGE_DEFAULTS: Record<string, StageContextData> = {
  direction: {
    stageNumber: "01",
    stageName: "Direction",
    subtitle: "Career Horizon & Target Role Definition",
    status: "Completed",
    whatHappened: "Target role benchmark defined (AI/ML Engineer, Full Stack) and timeline locked.",
    whatEvidenceExists: "Career Intent record active. Interests: Applied AI, Distributed Systems, Cloud.",
    whatChanged: "Target capability expectations loaded into DNA gap analysis engine.",
    recommendedAction: {
      label: "Adjust Direction / Intent",
      href: "/student/dashboard",
      description: "Update your target engineering roles, companies, or timeline."
    }
  },
  build: {
    stageNumber: "02",
    stageName: "Build",
    subtitle: "Artifact & Evidence Intake",
    status: "Completed",
    whatHappened: "Resume and linked project repositories parsed into verified capability evidence.",
    whatEvidenceExists: "Direct project artifacts corroborated as Level 2 Demonstrated capabilities.",
    whatChanged: "Self-reported claims captured as Level 1; concrete code samples corroborated as Level 2.",
    recommendedAction: {
      label: "Manage Resume & Projects",
      href: "/student/resume",
      description: "Upload an updated resume or link new public GitHub repositories."
    }
  },
  develop: {
    stageNumber: "03",
    stageName: "Develop",
    subtitle: "Technical Practice & Problem Solving",
    status: "Active / Current",
    whatHappened: "Actively progressing through Striver SDE Sheet and core CS algorithms.",
    whatEvidenceExists: "Verified algorithmic challenge submissions with unit test executions.",
    whatChanged: "Problem Solving capability upgraded to Assessed (Level 3).",
    recommendedAction: {
      label: "Continue DSA Practice",
      href: "/student/dsa-tracker",
      description: "Solve daily algorithmic problems and expand test-driven depth."
    }
  },
  prove: {
    stageNumber: "04",
    stageName: "Prove",
    subtitle: "Technical & Behavioral Assessment",
    status: "Active / Current",
    whatHappened: "Structured technical interviews and peer behavioral simulations under pressure.",
    whatEvidenceExists: "Assessed interview transcripts, system design scorecards, and hiring signals.",
    whatChanged: "Verified assessed capabilities across Communication, Problem Solving, and System Design.",
    recommendedAction: {
      label: "Launch Mock Interview",
      href: "/interview",
      description: "Complete an interactive AI voice and code simulation."
    }
  },
  match: {
    stageNumber: "05",
    stageName: "Match",
    subtitle: "Opportunity Intelligence & Alignment",
    status: "Completed",
    whatHappened: "DNA capability graph compared with verified campus drives and hackathon requirements.",
    whatEvidenceExists: "Explicit matching tags and unresolved gap warnings generated without synthetic scores.",
    whatChanged: "Opportunities categorized into Strong Alignment vs Developing Fit.",
    recommendedAction: {
      label: "Explore Opportunity Matches",
      href: "/student/opportunities",
      description: "Review recommended hackathons, challenges, and campus recruitment drives."
    }
  },
  apply: {
    stageNumber: "06",
    stageName: "Apply",
    subtitle: "Pipeline Execution & Application Tracking",
    status: "Active / Current",
    whatHappened: "Active applications carry current Student DNA snapshot and unresolved gaps.",
    whatEvidenceExists: "Application Kanban records, deadline milestones, and submission timestamps.",
    whatChanged: "Placement tracking pipeline synchronized with verified recruiter portals.",
    recommendedAction: {
      label: "Review Application Pipeline",
      href: "/student/applications",
      description: "Track status across Saved, Applied, Assessment, Interview, and Offer stages."
    }
  },
  interview: {
    stageNumber: "07",
    stageName: "Interview",
    subtitle: "Recruiter Rounds & Live Evaluations",
    status: "Active / Current",
    whatHappened: "Live interview scheduling and technical rounds recorded with evaluation notes.",
    whatEvidenceExists: "Interview feedback, round timestamps, and candidate preparation logs.",
    whatChanged: "Assessed performance feeds directly back into Student DNA capability confidence.",
    recommendedAction: {
      label: "Prepare for Upcoming Rounds",
      href: "/student/practice-interview",
      description: "Run targeted mock sessions for your specific upcoming interview."
    }
  },
  outcome: {
    stageNumber: "08",
    stageName: "Outcome",
    subtitle: "Offer Decisions & Career Memory",
    status: "Active / Current",
    whatHappened: "Interview decisions, offer packages, and recruiter notes captured.",
    whatEvidenceExists: "Outcome logs and feedback statements anchored into candidate history.",
    whatChanged: "Career Memory updated with confirmed strengths and verified career trajectory.",
    recommendedAction: {
      label: "Inspect Placement History",
      href: "/student/applications",
      description: "Review offer decisions, compensation details, and stage outcomes."
    }
  },
  learn: {
    stageNumber: "09",
    stageName: "Learn",
    subtitle: "Continuous Learning Loop & Next Best Action",
    status: "Active / Current",
    whatHappened: "Every outcome, assessment, and project submission recalibrates DNA recommendations.",
    whatEvidenceExists: "Traceable change log connecting actions to capability level adjustments.",
    whatChanged: "Action Engine continuously computes the single highest-leverage next step.",
    recommendedAction: {
      label: "View Next Recommended Action",
      href: "/student/dna",
      description: "Review how recent activity influenced your Student DNA profile."
    }
  }
};

export default function JourneyContextModal({
  isOpen,
  stageKey,
  onClose,
  customData
}: {
  isOpen: boolean;
  stageKey: string;
  onClose: () => void;
  customData?: Partial<StageContextData>;
}) {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  const stage = {
    ...(STAGE_DEFAULTS[stageKey.toLowerCase()] || STAGE_DEFAULTS["develop"]),
    ...customData
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(8px)",
        zIndex: 110,
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-end"
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 540,
          height: "100vh",
          background: isDark ? "#0E1B2E" : "#FFFFFF",
          borderLeft: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxShadow: isDark ? "-20px 0 50px rgba(0,0,0,0.8)" : "-20px 0 50px rgba(22, 42, 67, 0.12)",
          overflowY: "auto",
          color: isDark ? "#F2F6FC" : "#17191C",
          fontFamily: "var(--font-inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)"
        }}
        onClick={e => e.stopPropagation()}
      >
        <div>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.5rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.2, padding: "2px 8px", background: isDark ? "rgba(52, 120, 246, 0.15)" : "#EEF4FD", color: isDark ? "#3478F6" : "#356AE6", borderRadius: 4, border: `1px solid ${isDark ? "rgba(52, 120, 246, 0.3)" : "#D1E2FB"}` }}>
                  CAREER JOURNEY · STAGE {stage.stageNumber}
                </span>
                <span style={{ fontSize: 10, padding: "2px 8px", background: stage.status.includes("Active") ? (isDark ? "rgba(46, 125, 91, 0.2)" : "#EAF4EE") : (isDark ? "rgba(255,255,255,0.06)" : "#F0EFEA"), color: stage.status.includes("Active") ? "#2E7D5B" : (isDark ? "#B6C4D6" : "#667085"), borderRadius: 4, fontWeight: 700 }}>
                  ● {stage.status}
                </span>
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 900, color: isDark ? "#F2F6FC" : "#17191C", margin: "0 0 2px" }}>
                {stage.stageName}
              </h2>
              <p style={{ fontSize: 12, color: isDark ? "#B6C4D6" : "#667085", margin: 0 }}>
                {stage.subtitle}
              </p>
            </div>

            <button
              onClick={onClose}
              style={{ background: isDark ? "rgba(255,255,255,0.06)" : "#F0EFEA", border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`, color: isDark ? "#B6C4D6" : "#667085", width: 32, height: 32, borderRadius: 8, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}
            >
              ✕
            </button>
          </div>

          {/* Section 1: What Happened */}
          <div style={{ marginBottom: "1.25rem", padding: "1rem", background: isDark ? "#13243A" : "#FAF9F6", border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`, borderRadius: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: isDark ? "#3478F6" : "#356AE6", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 }}>
              WHAT HAPPENED
            </div>
            <div style={{ fontSize: 13, color: isDark ? "#F2F6FC" : "#17191C", lineHeight: 1.5 }}>
              {stage.whatHappened}
            </div>
          </div>

          {/* Section 2: What Evidence Exists */}
          <div style={{ marginBottom: "1.25rem", padding: "1rem", background: isDark ? "#13243A" : "#FAF9F6", border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`, borderRadius: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#2E7D5B", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 }}>
              WHAT EVIDENCE EXISTS
            </div>
            <div style={{ fontSize: 13, color: isDark ? "#F2F6FC" : "#17191C", lineHeight: 1.5 }}>
              {stage.whatEvidenceExists}
            </div>
          </div>

          {/* Section 3: What Changed in DNA */}
          <div style={{ marginBottom: "1.25rem", padding: "1rem", background: isDark ? "#13243A" : "#FAF9F6", border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`, borderRadius: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#B7791F", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 }}>
              WHAT CHANGED IN DNA
            </div>
            <div style={{ fontSize: 13, color: isDark ? "#F2F6FC" : "#17191C", lineHeight: 1.5 }}>
              {stage.whatChanged}
            </div>
          </div>

          {/* Section 4: Recommended Action */}
          <div style={{ padding: "1rem", background: isDark ? "rgba(52, 120, 246, 0.12)" : "#EEF4FD", border: `1px solid ${isDark ? "rgba(52, 120, 246, 0.3)" : "#D1E2FB"}`, borderRadius: 12, marginBottom: "1.25rem" }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: isDark ? "#3478F6" : "#356AE6", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 6 }}>
              RECOMMENDED NEXT ACTION
            </div>
            <div style={{ fontSize: 13, color: isDark ? "#F2F6FC" : "#17191C", fontWeight: 700, marginBottom: 4 }}>
              {stage.recommendedAction.label}
            </div>
            <div style={{ fontSize: 12, color: isDark ? "#B6C4D6" : "#667085", lineHeight: 1.4, marginBottom: 12 }}>
              {stage.recommendedAction.description}
            </div>
            <Link
              href={stage.recommendedAction.href}
              onClick={onClose}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 16px",
                background: "linear-gradient(135deg, #356AE6, #2858C7)",
                color: "white",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 800,
                textDecoration: "none",
                boxShadow: "0 2px 6px rgba(53, 106, 230, 0.25)"
              }}
            >
              {stage.recommendedAction.label} →
            </Link>
          </div>
        </div>

        {/* Drawer Footer Navigation */}
        <div style={{ borderTop: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`, paddingTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link
            href="/student/journey"
            onClick={onClose}
            style={{ fontSize: 12, color: isDark ? "#B6C4D6" : "#667085", textDecoration: "none" }}
          >
            🗺️ View Full 9-Stage Pipeline
          </Link>
          <Link
            href="/student/dna"
            onClick={onClose}
            style={{ fontSize: 12, color: isDark ? "#3478F6" : "#356AE6", textDecoration: "none", fontWeight: 700 }}
          >
            Inspect Student DNA ↗
          </Link>
        </div>
      </div>
    </div>
  );
}
