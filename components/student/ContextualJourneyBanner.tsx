"use client";

import React, { useState } from "react";
import JourneyContextModal, { StageContextData } from "./JourneyContextModal";

interface ContextualJourneyBannerProps {
  stageKey: "direction" | "build" | "develop" | "prove" | "match" | "apply" | "interview" | "outcome" | "learn";
  stageLabel?: string;
  stageSummary?: string;
  evidenceStats?: {
    totalRecords?: number;
    verifiedRecords?: number;
    highlightText?: string;
  };
}

const STAGE_TITLES: Record<string, { stageNum: string; name: string; icon: string }> = {
  direction: { stageNum: "01", name: "DIRECTION", icon: "🎯" },
  build: { stageNum: "02", name: "BUILD", icon: "📄" },
  develop: { stageNum: "03", name: "DEVELOP", icon: "⚡" },
  prove: { stageNum: "04", name: "PROVE", icon: "🎙️" },
  match: { stageNum: "05", name: "MATCH", icon: "🔍" },
  apply: { stageNum: "06", name: "APPLY", icon: "📋" },
  interview: { stageNum: "07", name: "INTERVIEW", icon: "🎤" },
  outcome: { stageNum: "08", name: "OUTCOME", icon: "🏆" },
  learn: { stageNum: "09", name: "LEARN", icon: "🧬" }
};

export default function ContextualJourneyBanner({
  stageKey,
  stageLabel,
  stageSummary,
  evidenceStats
}: ContextualJourneyBannerProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const stageInfo = STAGE_TITLES[stageKey] || { stageNum: "03", name: "DEVELOP", icon: "⚡" };
  const displayLabel = stageLabel || `Stage ${stageInfo.stageNum} · ${stageInfo.name}`;
  const defaultSummaries: Record<string, string> = {
    direction: "Career horizon and target capability benchmarks locked.",
    build: "Your resume and projects are continuously synthesized into verified Student DNA evidence.",
    develop: "Your algorithmic DSA and coding activity contribute direct evidence to Problem Solving.",
    prove: "Mock interviews provide assessed evaluation across technical depth and system design.",
    match: "Your Student DNA is evaluated against requirements of verified campus recruitment drives.",
    apply: "Applications carry your verified DNA snapshot and highlight bridged capabilities.",
    interview: "Live interview preparation and evaluation notes feed back into capability confidence.",
    outcome: "Placement offers and feedback become part of your immutable Career Memory.",
    learn: "Every verified outcome recalibrates your Student DNA and computes your next best action."
  };

  const displaySummary = stageSummary || defaultSummaries[stageKey] || "Contextual Career Journey integration.";

  return (
    <>
      <div
        style={{
          background: "linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(16, 185, 129, 0.05) 100%)",
          border: "1px solid rgba(99, 102, 241, 0.2)",
          borderRadius: 12,
          padding: "10px 16px",
          marginBottom: "1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 16 }}>{stageInfo.icon}</span>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, color: "#818cf8", textTransform: "uppercase" }}>
                CAREER JOURNEY · {displayLabel}
              </span>
              {evidenceStats?.highlightText && (
                <span style={{ fontSize: 10, padding: "1px 6px", background: "rgba(16, 185, 129, 0.15)", color: "#34d399", borderRadius: 4, fontWeight: 700 }}>
                  {evidenceStats.highlightText}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255, 255, 255, 0.8)", marginTop: 1 }}>
              {displaySummary}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {evidenceStats?.totalRecords !== undefined && (
            <span style={{ fontSize: 11, color: "rgba(255, 255, 255, 0.5)", marginRight: 4 }}>
              Evidence: <strong style={{ color: "white" }}>{evidenceStats.verifiedRecords || evidenceStats.totalRecords}</strong> verified
            </span>
          )}

          <button
            onClick={() => setModalOpen(true)}
            style={{
              padding: "5px 12px",
              background: "rgba(99, 102, 241, 0.15)",
              border: "1px solid rgba(99, 102, 241, 0.35)",
              borderRadius: 6,
              color: "#c7d2fe",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
              whiteSpace: "nowrap"
            }}
          >
            View {stageInfo.name.charAt(0) + stageInfo.name.slice(1).toLowerCase()} Details →
          </button>
        </div>
      </div>

      <JourneyContextModal
        isOpen={modalOpen}
        stageKey={stageKey}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
