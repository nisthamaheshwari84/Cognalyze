"use client";

import React, { useState, useEffect } from "react";
import { EvidenceItem, StudentCapability } from "@/lib/intelligence/student-intelligence";
import { useTheme } from "@/components/ThemeProvider";

interface GlobalEvidenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  capabilityName: string | null;
  candidateId?: string;
  initialEvidence?: EvidenceItem[];
  capabilitySummary?: StudentCapability | null;
}

export default function GlobalEvidenceDrawer({
  isOpen,
  onClose,
  capabilityName,
  candidateId = "student-demo",
  initialEvidence,
  capabilitySummary
}: GlobalEvidenceDrawerProps) {
  const { isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>(initialEvidence || []);
  const [summary, setSummary] = useState<StudentCapability | null>(capabilitySummary || null);

  useEffect(() => {
    if (!isOpen || !capabilityName) return;

    if (initialEvidence && initialEvidence.length > 0) {
      setEvidenceItems(initialEvidence);
      if (capabilitySummary) setSummary(capabilitySummary);
      return;
    }

    // Fetch live evidence from API
    setLoading(true);
    fetch(`/api/student/evidence?candidateId=${candidateId}&capability=${encodeURIComponent(capabilityName)}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setEvidenceItems(data.evidence || []);
          setSummary(data.capabilitySummary || null);
        }
      })
      .catch(err => console.error("Failed to load evidence drawer data:", err))
      .finally(() => setLoading(false));
  }, [isOpen, capabilityName, candidateId, initialEvidence, capabilitySummary]);

  if (!isOpen) return null;

  const getLevelBadge = (level: number) => {
    switch (level) {
      case 4:
        return { label: "LEVEL 4 — VERIFIED", color: "#2E7D5B", bg: isDark ? "rgba(46, 125, 91, 0.2)" : "#EAF4EE", border: "#2E7D5B" };
      case 3:
        return { label: "LEVEL 3 — ASSESSED", color: isDark ? "#3478F6" : "#356AE6", bg: isDark ? "rgba(52, 120, 246, 0.2)" : "#EEF4FD", border: isDark ? "#3478F6" : "#356AE6" };
      case 2:
        return { label: "LEVEL 2 — DEMONSTRATED", color: isDark ? "#A78BFA" : "#7C3AED", bg: isDark ? "rgba(167, 139, 250, 0.2)" : "#F3E8FF", border: isDark ? "#A78BFA" : "#7C3AED" };
      case 1:
        return { label: "LEVEL 1 — CLAIMED", color: "#B7791F", bg: isDark ? "rgba(183, 121, 31, 0.2)" : "#FDF6E9", border: "#B7791F" };
      default:
        return { label: "LEVEL 0 — UNKNOWN", color: isDark ? "#7E8FA6" : "#98A2B3", bg: isDark ? "rgba(255, 255, 255, 0.06)" : "#F0EFEA", border: isDark ? "#223750" : "#E4E1DA" };
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case "HIGH":
        return { label: "High Confidence", color: "#2E7D5B", bg: isDark ? "rgba(46, 125, 91, 0.15)" : "#EAF4EE" };
      case "MEDIUM":
        return { label: "Moderate Confidence", color: "#B7791F", bg: isDark ? "rgba(183, 121, 31, 0.15)" : "#FDF6E9" };
      default:
        return { label: "Limited / Low Confidence", color: "#C24141", bg: isDark ? "rgba(194, 65, 65, 0.15)" : "#FDF0F0" };
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        display: "flex",
        justifyContent: "flex-end",
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(6px)",
        transition: "opacity 0.25s ease"
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 640,
          height: "100%",
          backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
          borderLeft: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
          boxShadow: isDark ? "-12px 0 40px rgba(0, 0, 0, 0.8)" : "-12px 0 40px rgba(22, 42, 67, 0.12)",
          display: "flex",
          flexDirection: "column",
          color: isDark ? "#F2F6FC" : "#17191C",
          overflow: "hidden",
          fontFamily: "var(--font-inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "24px",
            borderBottom: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
            background: isDark ? "#13243A" : "#FAF9F6",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                  color: isDark ? "#3478F6" : "#356AE6",
                  background: isDark ? "rgba(52, 120, 246, 0.15)" : "#EEF4FD",
                  padding: "3px 8px",
                  borderRadius: 4,
                  border: `1px solid ${isDark ? "rgba(52, 120, 246, 0.3)" : "#D1E2FB"}`
                }}
              >
                PROVENANCE & EVIDENCE INSPECTOR
              </span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0, color: isDark ? "#F2F6FC" : "#17191C" }}>
              {capabilityName}
            </h2>
            <p style={{ fontSize: 13, color: isDark ? "#B6C4D6" : "#667085", margin: "4px 0 0" }}>
              Authentic multi-source evidence graph explaining why Cognalyze made this inference.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: isDark ? "rgba(255, 255, 255, 0.06)" : "#F0EFEA",
              border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
              borderRadius: 8,
              color: isDark ? "#B6C4D6" : "#667085",
              cursor: "pointer",
              padding: "6px 12px",
              fontSize: 13,
              fontWeight: 700
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* SUMMARY BAR */}
        {summary && (
          <div
            style={{
              padding: "16px 24px",
              background: isDark ? "#101F34" : "#F0EFEA",
              borderBottom: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12
            }}
          >
            <div>
              <span style={{ fontSize: 11, color: isDark ? "#7E8FA6" : "#667085", textTransform: "uppercase", fontWeight: 700 }}>
                Proficiency State
              </span>
              <div style={{ fontSize: 14, fontWeight: 800, color: isDark ? "#F2F6FC" : "#17191C", marginTop: 2 }}>
                {summary.proficiencyState}
              </div>
            </div>

            <div>
              <span style={{ fontSize: 11, color: isDark ? "#7E8FA6" : "#667085", textTransform: "uppercase", fontWeight: 700 }}>
                Confidence
              </span>
              <div style={{ fontSize: 13, fontWeight: 700, color: getConfidenceBadge(summary.confidence).color, marginTop: 2 }}>
                {getConfidenceBadge(summary.confidence).label}
              </div>
            </div>

            <div>
              <span style={{ fontSize: 11, color: isDark ? "#7E8FA6" : "#667085", textTransform: "uppercase", fontWeight: 700 }}>
                Evidence Records
              </span>
              <div style={{ fontSize: 14, fontWeight: 800, color: isDark ? "#F2F6FC" : "#17191C", marginTop: 2 }}>
                {summary.evidenceCount} total ({summary.verifiedEvidenceCount} verified)
              </div>
            </div>
          </div>
        )}

        {/* CONTRADICTION / CONFLICT ALERT */}
        {summary?.hasConflict && (
          <div
            style={{
              margin: "16px 24px 0",
              padding: "14px 16px",
              backgroundColor: isDark ? "rgba(194, 65, 65, 0.15)" : "#FDF0F0",
              border: `1px solid ${isDark ? "rgba(194, 65, 65, 0.4)" : "#F8C8C8"}`,
              borderRadius: 10,
              display: "flex",
              alignItems: "flex-start",
              gap: 12
            }}
          >
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#C24141" }}>
                EVIDENCE CONFLICT DETECTED
              </div>
              <div style={{ fontSize: 12, color: isDark ? "#F2F6FC" : "#475569", marginTop: 4, lineHeight: 1.4 }}>
                {summary.conflictReason}
              </div>
              <div style={{ fontSize: 11, color: "#C24141", marginTop: 6, fontWeight: 600 }}>
                Confidence has been adjusted downward to prevent false positive representation. Recommended action: complete a direct practical assessment.
              </div>
            </div>
          </div>
        )}

        {/* BODY / EVIDENCE LIST */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: isDark ? "#7E8FA6" : "#667085" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⚡</div>
              Retrieving evidence records and provenance chain...
            </div>
          ) : evidenceItems.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                backgroundColor: isDark ? "#13243A" : "#FAF9F6",
                borderRadius: 12,
                border: `1px dashed ${isDark ? "#223750" : "#E4E1DA"}`
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 6px", color: isDark ? "#F2F6FC" : "#17191C" }}>INSUFFICIENT EVIDENCE</h3>
              <p style={{ fontSize: 13, color: isDark ? "#B6C4D6" : "#667085", maxWidth: 360, margin: "0 auto", lineHeight: 1.5 }}>
                Cognalyze currently does not have enough evidence to assess <strong>{capabilityName}</strong>.
                Absence of evidence is not a lack of skill — complete a project, DSA problem, or interview to establish this capability.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: isDark ? "#7E8FA6" : "#667085", textTransform: "uppercase", letterSpacing: 1 }}>
                Supporting Evidence Artifacts ({evidenceItems.length})
              </div>

              {evidenceItems.map((item, idx) => {
                const badge = getLevelBadge(item.evidenceLevel);
                const conf = getConfidenceBadge(item.confidence);

                return (
                  <div
                    key={item.id || idx}
                    style={{
                      backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                      border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                      borderRadius: 12,
                      padding: "16px 18px",
                      position: "relative",
                      transition: "all 0.15s ease",
                      boxShadow: isDark ? "none" : "0 1px 3px rgba(16, 24, 40, 0.04)"
                    }}
                  >
                    {/* TOP META */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "3px 8px",
                          borderRadius: 4,
                          color: badge.color,
                          backgroundColor: badge.bg,
                          border: `1px solid ${badge.border}`
                        }}
                      >
                        {badge.label}
                      </span>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: conf.color,
                            backgroundColor: conf.bg,
                            padding: "2px 6px",
                            borderRadius: 4
                          }}
                        >
                          {conf.label}
                        </span>
                        <span style={{ fontSize: 11, color: isDark ? "#7E8FA6" : "#98A2B3" }}>
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recent"}
                        </span>
                      </div>
                    </div>

                    {/* CLAIM */}
                    <div style={{ fontSize: 14, fontWeight: 800, color: isDark ? "#F2F6FC" : "#17191C", marginBottom: 6 }}>
                      {item.claim}
                    </div>

                    {/* EXTRACTED EVIDENCE */}
                    <div
                      style={{
                        fontSize: 13,
                        color: isDark ? "#B6C4D6" : "#475569",
                        lineHeight: 1.5,
                        backgroundColor: isDark ? "#0E1B2E" : "#F8F7F4",
                        padding: "10px 12px",
                        borderRadius: 8,
                        borderLeft: `3px solid ${badge.color}`,
                        marginBottom: 10
                      }}
                    >
                      {item.extractedEvidence}
                    </div>

                    {/* PROVENANCE FOOTER */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, fontSize: 11, color: isDark ? "#7E8FA6" : "#667085", paddingTop: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span>Source:</span>
                        <strong style={{ color: isDark ? "#F2F6FC" : "#17191C" }}>{item.provenance?.sourceName || item.sourceType}</strong>
                        {item.provenance?.sourceUrl && (
                          <a
                            href={item.provenance.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: isDark ? "#3478F6" : "#356AE6", textDecoration: "underline", marginLeft: 4 }}
                          >
                            View Link ↗
                          </a>
                        )}
                      </div>

                      {item.evidenceGroupId && (
                        <span style={{ fontSize: 10, color: isDark ? "#7E8FA6" : "#98A2B3", fontFamily: "monospace" }}>
                          Group: {item.evidenceGroupId}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
            background: isDark ? "#13243A" : "#FAF9F6",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <span style={{ fontSize: 11, color: isDark ? "#7E8FA6" : "#667085" }}>
            🔒 Governed by Cognalyze Evidence Before Inference Standard.
          </span>

          <button
            onClick={onClose}
            style={{
              backgroundColor: isDark ? "#3478F6" : "#356AE6",
              border: "none",
              color: "white",
              padding: "8px 20px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(53, 106, 230, 0.25)"
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
