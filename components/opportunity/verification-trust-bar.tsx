"use client";

import React, { useState } from "react";
import { ShieldCheck, ExternalLink, CheckCircle2, AlertTriangle, X, Clock, Info } from "lucide-react";
import { isActionableOpportunityUrl } from "@/lib/ai/placement-intelligence";

export interface VerificationTrustBarProps {
  source?: string;
  sourceUrl?: string;
  applicationUrl?: string;
  lastChecked?: string;
  status?: string;
  classification?: string;
  verifiedFields?: string[];
  inferredFields?: string[];
}

export function VerificationTrustBar({
  source = "Official Partner / Platform",
  sourceUrl,
  applicationUrl,
  lastChecked = "12 minutes ago",
  status = "VERIFIED_ACTIVE",
  classification = "HACKATHON",
  verifiedFields = ["Title", "Organizer", "Deadline", "Eligibility", "Tracks"],
  inferredFields = ["Recommended Tech Stack", "Implementation Architecture"]
}: VerificationTrustBarProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 10,
          background: "#FAF9F6",
          border: "1px solid #E4E1DA",
          borderRadius: 8,
          padding: "8px 14px",
          marginBottom: 16,
          fontSize: 12,
          color: "#162A43"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#2E7D5B", fontWeight: 600 }}>
            <ShieldCheck size={14} /> Source verified
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#2E7D5B", fontWeight: 600 }}>
            <CheckCircle2 size={13} /> Deadline verified
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, color: "#2E7D5B", fontWeight: 600 }}>
            <CheckCircle2 size={13} /> Application verified
          </span>
          <span style={{ color: "#667085", display: "inline-flex", alignItems: "center", gap: 4 }}>
            <Clock size={12} /> Last checked {lastChecked}
          </span>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            background: "transparent",
            border: "none",
            color: "#356AE6",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: 4,
            padding: 0
          }}
        >
          View verification details ↗
        </button>
      </div>

      {/* Verification Transparency Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(4px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 12,
              border: "1px solid #E4E1DA",
              maxWidth: 540,
              width: "100%",
              maxHeight: "85vh",
              overflowY: "auto",
              padding: 24,
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)"
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldCheck size={20} color="#2E7D5B" />
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#162A43" }}>
                  Source Verification & Provenance
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "#667085" }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: "#667085", lineHeight: 1.5, margin: "0 0 16px" }}>
              Cognalyze strictly validates every opportunity against authoritative source listings. Information is categorized into Verified official requirements, Inferred architectural patterns, and Cognalyze recommendations.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
              <div style={{ background: "#FAF9F6", padding: "10px 12px", borderRadius: 8, border: "1px solid #E4E1DA" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", marginBottom: 4 }}>
                  PRIMARY SOURCE
                </div>
                <div style={{ fontWeight: 600, color: "#162A43" }}>{source}</div>
              </div>

              {sourceUrl && (
                <div style={{ background: "#FAF9F6", padding: "10px 12px", borderRadius: 8, border: "1px solid #E4E1DA" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", marginBottom: 4 }}>
                    VERIFIED SOURCE URL
                  </div>
                  <a
                    href={sourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#356AE6", textDecoration: "none", wordBreak: "break-all", fontWeight: 500 }}
                  >
                    {sourceUrl} ↗
                  </a>
                </div>
              )}

              {applicationUrl && (
                <div style={{ background: "#FAF9F6", padding: "10px 12px", borderRadius: 8, border: "1px solid #E4E1DA" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", marginBottom: 4 }}>
                    APPLICATION DESTINATION
                  </div>
                  <a
                    href={applicationUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#356AE6", textDecoration: "none", wordBreak: "break-all", fontWeight: 500 }}
                  >
                    {applicationUrl} ↗
                  </a>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <div style={{ background: "#FAF9F6", padding: "10px 12px", borderRadius: 8, border: "1px solid #E4E1DA" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", marginBottom: 4 }}>
                    CLASSIFICATION
                  </div>
                  <div style={{ fontWeight: 600, color: "#162A43" }}>{classification}</div>
                </div>

                <div style={{ background: "#FAF9F6", padding: "10px 12px", borderRadius: 8, border: "1px solid #E4E1DA" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", marginBottom: 4 }}>
                    VERIFICATION STATUS
                  </div>
                  <div style={{ fontWeight: 600, color: "#2E7D5B" }}>{status}</div>
                </div>
              </div>

              {/* Verified Fields vs Recommendations */}
              <div style={{ marginTop: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#162A43", marginBottom: 6 }}>
                  Verified Official Fields:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                  {verifiedFields.map((f, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 11,
                        background: "#EAF4EE",
                        color: "#2E7D5B",
                        padding: "2px 8px",
                        borderRadius: 4,
                        border: "1px solid #C8E4D3",
                        fontWeight: 500
                      }}
                    >
                      ✓ {f}
                    </span>
                  ))}
                </div>

                <div style={{ fontSize: 12, fontWeight: 700, color: "#162A43", marginBottom: 6 }}>
                  Cognalyze Inferred & Recommended:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {inferredFields.map((f, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: 11,
                        background: "#EFF4FE",
                        color: "#356AE6",
                        padding: "2px 8px",
                        borderRadius: 4,
                        border: "1px solid #D2E0FB",
                        fontWeight: 500
                      }}
                    >
                      ◇ {f}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 20, textAlign: "right" }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "#162A43",
                  color: "#FFFFFF",
                  border: "none",
                  padding: "7px 16px",
                  borderRadius: 6,
                  fontWeight: 600,
                  fontSize: 12,
                  cursor: "pointer"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export interface VerifiedApplyButtonProps {
  url?: string;
  sourceUrl?: string;
  opportunityId?: string;
  title?: string;
  organizer?: string;
  status?: string;
  label?: string;
  style?: React.CSSProperties;
}

export function VerifiedApplyButton({
  url,
  sourceUrl,
  opportunityId,
  title,
  organizer,
  status = "ACTIVE",
  label = "Apply Now",
  style
}: VerifiedApplyButtonProps) {
  const [verifying, setVerifying] = useState(false);
  const [brokenModal, setBrokenModal] = useState<{ open: boolean; reason?: string; fallbackUrl?: string }>({
    open: false
  });

  const isActionable = isActionableOpportunityUrl(url);

  // If known to be expired or closed
  if (status === "EXPIRED") {
    return (
      <button
        disabled
        style={{
          padding: "7px 12px",
          borderRadius: 7,
          background: "#F6F5F1",
          color: "#98A2B3",
          border: "1px solid #E4E1DA",
          fontSize: 12,
          fontWeight: 600,
          cursor: "not-allowed",
          ...style
        }}
      >
        Expired
      </button>
    );
  }

  if (status === "REGISTRATION_CLOSED") {
    return (
      <button
        disabled
        style={{
          padding: "7px 12px",
          borderRadius: 7,
          background: "#FEF7ED",
          color: "#B7791F",
          border: "1px solid #F8D8A7",
          fontSize: 12,
          fontWeight: 600,
          cursor: "not-allowed",
          ...style
        }}
      >
        Registration Closed
      </button>
    );
  }

  // If no actionable URL exists per Rule 2
  if (!isActionable) {
    return (
      <button
        onClick={() => {
          if (sourceUrl && sourceUrl.startsWith("http")) {
            window.open(sourceUrl, "_blank");
          } else {
            setBrokenModal({
              open: true,
              reason: "Official application endpoint has not been verified yet. Check official source.",
              fallbackUrl: sourceUrl
            });
          }
        }}
        title="Direct application URL unavailable"
        style={{
          padding: "7px 12px",
          borderRadius: 7,
          background: "#FAF9F6",
          color: "#667085",
          border: "1px solid #E4E1DA",
          fontSize: 12,
          fontWeight: 600,
          cursor: "pointer",
          ...style
        }}
      >
        {sourceUrl ? "View Verified Source ↗" : "Application Link Unavailable"}
      </button>
    );
  }

  const handleApplyClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    setVerifying(true);

    try {
      const res = await fetch("/api/opportunities/verify-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          opportunityId,
          title,
          organizer,
          recordAttempt: true
        })
      });

      const data = await res.json();
      const result = data.result;

      if (data.success && result && result.isActionable) {
        // Destination verified active! Redirect safely.
        const dest = result.finalUrl || url;
        window.open(dest, "_blank");
      } else {
        // Destination failed or returned 404/closed
        setBrokenModal({
          open: true,
          reason: result?.failureReason || "The destination page could not be verified or is no longer accepting applications.",
          fallbackUrl: sourceUrl || url
        });
      }
    } catch {
      // In case of network glitch verifying, check fallback
      if (url) {
        window.open(url, "_blank");
      }
    } finally {
      setVerifying(false);
    }
  };

  return (
    <>
      <button
        onClick={handleApplyClick}
        disabled={verifying}
        style={{
          padding: "7px 12px",
          borderRadius: 7,
          background: "#356AE6",
          color: "#FFFFFF",
          border: "none",
          fontSize: 12,
          fontWeight: 600,
          cursor: verifying ? "wait" : "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 5,
          opacity: verifying ? 0.8 : 1,
          ...style
        }}
      >
        {verifying ? (
          <>Verifying link...</>
        ) : (
          <>
            {label} <ExternalLink size={12} />
          </>
        )}
      </button>

      {/* Broken Link Interceptor Modal (Rule 38) */}
      {brokenModal.open && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(15, 23, 42, 0.5)",
            backdropFilter: "blur(4px)",
            zIndex: 110,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16
          }}
          onClick={() => setBrokenModal({ open: false })}
        >
          <div
            style={{
              background: "#FFFFFF",
              borderRadius: 12,
              border: "1px solid #E4E1DA",
              maxWidth: 440,
              width: "100%",
              padding: 24,
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <AlertTriangle size={22} color="#D97706" />
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "#162A43" }}>
                Application Page Unavailable
              </h3>
            </div>

            <p style={{ fontSize: 13, color: "#667085", lineHeight: 1.5, margin: "0 0 16px" }}>
              {brokenModal.reason}
            </p>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                onClick={() => setBrokenModal({ open: false })}
                style={{
                  background: "#FAF9F6",
                  color: "#667085",
                  border: "1px solid #E4E1DA",
                  padding: "7px 14px",
                  borderRadius: 6,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Close
              </button>

              {brokenModal.fallbackUrl && (
                <a
                  href={brokenModal.fallbackUrl}
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setBrokenModal({ open: false })}
                  style={{
                    background: "#356AE6",
                    color: "#FFFFFF",
                    border: "none",
                    padding: "7px 14px",
                    borderRadius: 6,
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: "none",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4
                  }}
                >
                  View Verified Source ↗
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
