"use client";

import React, { useState } from "react";
import { MarketSignal, RoleEvolutionProposal } from "@/lib/workforce/types";

interface WorkforceIntelligencePanelProps {
  signals: MarketSignal[];
  proposals: RoleEvolutionProposal[];
  onReviewProposal: (proposalId: string, decision: "approved" | "rejected") => Promise<void>;
  onGenerateProposals?: () => Promise<void>;
}

export default function WorkforceIntelligencePanel({
  signals,
  proposals,
  onReviewProposal,
  onGenerateProposals,
}: WorkforceIntelligencePanelProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const getIndiaImpactBadge = (status: string) => {
    switch (status) {
      case "confirmed_india_impact":
        return { label: "Confirmed India Impact", bg: "#ECFDF5", text: "#065F46", border: "#A7F3D0" };
      case "reported_india_impact":
        return { label: "Reported Local Impact", bg: "var(--color-warning-bg)", text: "var(--color-warning)", border: "#F8D8A7" };
      case "potential_india_impact":
        return { label: "Potential Indirect Impact", bg: "var(--color-info-bg)", text: "var(--brand-cobalt)", border: "#D2E0FB" };
      default:
        return { label: "No Established India Impact", bg: "var(--surface-subtle)", text: "var(--text-secondary)", border: "var(--border-subtle)" };
    }
  };

  const handleAction = async (id: string, decision: "approved" | "rejected") => {
    setProcessingId(id);
    try {
      await onReviewProposal(id, decision);
    } finally {
      setProcessingId(null);
    }
  };

  const handleGenerate = async () => {
    if (!onGenerateProposals) return;
    setGenerating(true);
    try {
      await onGenerateProposals();
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* SECTION 1: PROACTIVE EVOLUTION PROPOSALS */}
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>⚡</span>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--brand-navy)", margin: 0 }}>
                Proactive Role Evolution Proposals ({proposals.length})
              </h4>
            </div>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "2px 0 0" }}>
              AI analyzes global &amp; Indian market signals to propose capability updates. Requires explicit human recruiter approval.
            </p>
          </div>

          {onGenerateProposals && (
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "6px 12px",
                borderRadius: 6,
                background: "var(--surface)",
                border: "1px solid var(--border-subtle)",
                color: "var(--brand-cobalt)",
                cursor: generating ? "not-allowed" : "pointer",
              }}
            >
              {generating ? "Scanning Market..." : "🔄 Refresh Market Proposals"}
            </button>
          )}
        </div>

        {proposals.length === 0 ? (
          <div
            style={{
              padding: "16px 20px",
              background: "var(--surface-subtle)",
              border: "1px dashed var(--border-subtle)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--text-secondary)",
              textAlign: "center",
            }}
          >
            No pending capability proposals for this role. Current requirements match verified market expectations.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {proposals.map((prop) => {
              const isPending = prop.status === "pending_approval";
              const isApproved = prop.status === "approved";

              return (
                <div
                  key={prop.id}
                  style={{
                    padding: "14px 18px",
                    background: isApproved ? "#F0FDF4" : "var(--surface)",
                    border: isApproved ? "1px solid #BBF7D0" : "1px solid var(--border-subtle)",
                    borderRadius: 8,
                    boxShadow: "0 1px 2px rgba(16, 24, 40, 0.03)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                    <div style={{ flex: 1, minWidth: 260 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            padding: "2px 6px",
                            borderRadius: 4,
                            background: prop.changeType === "add_capability" ? "#ECFDF5" : "var(--color-warning-bg)",
                            color: prop.changeType === "add_capability" ? "#065F46" : "var(--color-warning)",
                            textTransform: "uppercase",
                          }}
                        >
                          {prop.changeType === "add_capability" ? "+ Add Capability" : "↘ Deprecate"}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--brand-navy)" }}>
                          {prop.proposedChange}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "4px 0 0", lineHeight: 1.4 }}>
                        {prop.marketRationale}
                      </p>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {isPending ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleAction(prop.id, "approved")}
                            disabled={processingId === prop.id}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 6,
                              background: "#059669",
                              color: "#FFFFFF",
                              border: "none",
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            ✓ Accept Proposal
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAction(prop.id, "rejected")}
                            disabled={processingId === prop.id}
                            style={{
                              padding: "6px 12px",
                              borderRadius: 6,
                              background: "var(--surface)",
                              color: "var(--text-secondary)",
                              border: "1px solid var(--border-subtle)",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                            }}
                          >
                            Dismiss
                          </button>
                        </>
                      ) : (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "4px 10px",
                            borderRadius: 4,
                            background: isApproved ? "#ECFDF5" : "var(--surface-subtle)",
                            color: isApproved ? "#065F46" : "var(--text-secondary)",
                          }}
                        >
                          {isApproved ? "✓ Accepted by Recruiter" : "✕ Dismissed"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 2: VERIFIED MARKET SIGNALS & GCC TRENDS */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 16 }}>🌐</span>
          <div>
            <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--brand-navy)", margin: 0 }}>
              Verified Market Signals &amp; India Workforce Context ({signals.length})
            </h4>
            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "2px 0 0" }}>
              Grounded data from Global Capability Centers (GCCs), restructuring disclosures, and technology talent shifts.
            </p>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {signals.map((sig) => {
            const badge = getIndiaImpactBadge(sig.indiaImpactStatus);

            return (
              <div
                key={sig.id}
                style={{
                  padding: "16px 20px",
                  background: "var(--surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 8,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: "var(--brand-navy)" }}>
                        {sig.companyName}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                        • {sig.industry}
                      </span>
                      <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                        ({sig.announcementDate})
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: 4,
                      background: badge.bg,
                      color: badge.text,
                      border: `1px solid ${badge.border}`,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {badge.label}
                  </span>
                </div>

                <p style={{ fontSize: 12, color: "var(--text-primary)", margin: "0 0 10px", lineHeight: 1.4 }}>
                  {sig.indiaImpactDetails}
                </p>

                {/* Capability shifts */}
                {sig.affectedCapabilities && sig.affectedCapabilities.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10 }}>
                    {sig.affectedCapabilities.map((ac, aIdx) => (
                      <div
                        key={aIdx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "6px 10px",
                          borderRadius: 4,
                          background: "var(--surface-subtle)",
                          fontSize: 11,
                        }}
                      >
                        <span style={{ fontWeight: 600, color: "var(--brand-navy)" }}>
                          {ac.direction === "surging" ? "↗ " : "↘ "}
                          {ac.capabilityName}
                        </span>
                        <span style={{ color: "var(--text-secondary)", fontStyle: "italic", maxWidth: "60%" }}>
                          {ac.rationale}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Sources */}
                {sig.sourceUrls && sig.sourceUrls.length > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--text-secondary)" }}>
                    <span style={{ fontWeight: 700 }}>Provenance:</span>
                    {sig.sourceUrls.map((url, uIdx) => (
                      <a
                        key={uIdx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "var(--brand-cobalt)", textDecoration: "underline" }}
                      >
                        Source {uIdx + 1}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

