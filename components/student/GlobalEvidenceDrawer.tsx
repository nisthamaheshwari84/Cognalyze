"use client";

import React, { useState, useEffect } from "react";
import { EvidenceItem, StudentCapability } from "@/lib/intelligence/student-intelligence";

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
        return { label: "LEVEL 4 — VERIFIED", color: "#10b981", bg: "rgba(16, 185, 129, 0.15)", border: "rgba(16, 185, 129, 0.4)" };
      case 3:
        return { label: "LEVEL 3 — ASSESSED", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.15)", border: "rgba(59, 130, 246, 0.4)" };
      case 2:
        return { label: "LEVEL 2 — DEMONSTRATED", color: "#a855f7", bg: "rgba(168, 85, 247, 0.15)", border: "rgba(168, 85, 247, 0.4)" };
      case 1:
        return { label: "LEVEL 1 — CLAIMED", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.15)", border: "rgba(245, 158, 11, 0.4)" };
      default:
        return { label: "LEVEL 0 — UNKNOWN", color: "#94a3b8", bg: "rgba(148, 163, 184, 0.15)", border: "rgba(148, 163, 184, 0.4)" };
    }
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case "HIGH":
        return { label: "High Confidence", color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" };
      case "MEDIUM":
        return { label: "Moderate Confidence", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" };
      default:
        return { label: "Limited / Low Confidence", color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" };
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
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(6px)",
        transition: "opacity 0.25s ease"
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 620,
          height: "100%",
          backgroundColor: "#090d1a",
          borderLeft: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "-12px 0 40px rgba(0, 0, 0, 0.8)",
          display: "flex",
          flexDirection: "column",
          color: "#f8fafc",
          overflow: "hidden"
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            background: "linear-gradient(180deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.2) 100%)",
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
                  color: "#6366f1",
                  background: "rgba(99, 102, 241, 0.12)",
                  padding: "3px 8px",
                  borderRadius: 4,
                  border: "1px solid rgba(99, 102, 241, 0.3)"
                }}
              >
                PROVENANCE & EVIDENCE INSPECTOR
              </span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 900, margin: 0, color: "white" }}>
              {capabilityName}
            </h2>
            <p style={{ fontSize: 13, color: "#94a3b8", margin: "4px 0 0" }}>
              Authentic multi-source evidence graph explaining why Cognalyze made this inference.
            </p>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.06)",
              border: "1px solid rgba(255, 255, 255, 0.12)",
              borderRadius: 8,
              color: "#94a3b8",
              cursor: "pointer",
              padding: "6px 12px",
              fontSize: 14,
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
              background: "rgba(15, 23, 42, 0.7)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 12
            }}
          >
            <div>
              <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                Proficiency State
              </span>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#f8fafc", marginTop: 2 }}>
                {summary.proficiencyState}
              </div>
            </div>

            <div>
              <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                Confidence
              </span>
              <div style={{ fontSize: 13, fontWeight: 700, color: getConfidenceBadge(summary.confidence).color, marginTop: 2 }}>
                {getConfidenceBadge(summary.confidence).label}
              </div>
            </div>

            <div>
              <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", fontWeight: 700 }}>
                Evidence Records
              </span>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#f8fafc", marginTop: 2 }}>
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
              backgroundColor: "rgba(239, 68, 68, 0.12)",
              border: "1px solid rgba(239, 68, 68, 0.35)",
              borderRadius: 10,
              display: "flex",
              alignItems: "flex-start",
              gap: 12
            }}
          >
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#fca5a5" }}>
                EVIDENCE CONFLICT DETECTED
              </div>
              <div style={{ fontSize: 12, color: "#fecaca", marginTop: 4, lineHeight: 1.4 }}>
                {summary.conflictReason}
              </div>
              <div style={{ fontSize: 11, color: "#f87171", marginTop: 6, fontWeight: 600 }}>
                Confidence has been adjusted downward to prevent false positive representation. Recommended action: complete a direct practical assessment.
              </div>
            </div>
          </div>
        )}

        {/* BODY / EVIDENCE LIST */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#94a3b8" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>⚡</div>
              Retrieving evidence records and provenance chain...
            </div>
          ) : evidenceItems.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                backgroundColor: "rgba(255, 255, 255, 0.02)",
                borderRadius: 12,
                border: "1px dashed rgba(255, 255, 255, 0.12)"
              }}
            >
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 6px" }}>INSUFFICIENT EVIDENCE</h3>
              <p style={{ fontSize: 13, color: "#94a3b8", maxWidth: 360, margin: "0 auto", lineHeight: 1.5 }}>
                Cognalyze currently does not have enough evidence to assess <strong>{capabilityName}</strong>.
                Absence of evidence is not a lack of skill — complete a project, DSA problem, or interview to establish this capability.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#64748b", textTransform: "uppercase", letterSpacing: 1 }}>
                Supporting Evidence Artifacts ({evidenceItems.length})
              </div>

              {evidenceItems.map((item, idx) => {
                const badge = getLevelBadge(item.evidenceLevel);
                const conf = getConfidenceBadge(item.confidence);

                return (
                  <div
                    key={item.id || idx}
                    style={{
                      backgroundColor: "rgba(30, 41, 59, 0.4)",
                      border: `1px solid ${badge.border}`,
                      borderRadius: 12,
                      padding: "16px 18px",
                      position: "relative",
                      transition: "all 0.15s ease"
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
                        <span style={{ fontSize: 11, color: "#64748b" }}>
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recent"}
                        </span>
                      </div>
                    </div>

                    {/* CLAIM */}
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#ffffff", marginBottom: 6 }}>
                      {item.claim}
                    </div>

                    {/* EXTRACTED EVIDENCE */}
                    <div
                      style={{
                        fontSize: 13,
                        color: "#cbd5e1",
                        lineHeight: 1.5,
                        backgroundColor: "rgba(15, 23, 42, 0.6)",
                        padding: "10px 12px",
                        borderRadius: 8,
                        borderLeft: `3px solid ${badge.color}`,
                        marginBottom: 10
                      }}
                    >
                      {item.extractedEvidence}
                    </div>

                    {/* PROVENANCE FOOTER */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 8, fontSize: 11, color: "#94a3b8", paddingTop: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span>Source:</span>
                        <strong style={{ color: "#e2e8f0" }}>{item.provenance?.sourceName || item.sourceType}</strong>
                        {item.provenance?.sourceUrl && (
                          <a
                            href={item.provenance.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: "#818cf8", textDecoration: "underline", marginLeft: 4 }}
                          >
                            View Link ↗
                          </a>
                        )}
                      </div>

                      {item.evidenceGroupId && (
                        <span style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace" }}>
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
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            background: "rgba(15, 23, 42, 0.8)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <span style={{ fontSize: 11, color: "#64748b" }}>
            🔒 Governed by Cognalyze Evidence Before Inference Standard.
          </span>

          <button
            onClick={onClose}
            style={{
              backgroundColor: "#4f46e5",
              border: "none",
              color: "white",
              padding: "8px 18px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
