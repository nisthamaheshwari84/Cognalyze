"use client";

import React, { useState } from "react";
import { RoleDNA, RoleApprovalRecord } from "@/lib/ai/role-dna";
import { RoleVersionSnapshot } from "@/lib/recruiter-store";

interface RoleApprovalAndVersionVaultProps {
  role: RoleDNA;
  versions: RoleVersionSnapshot[];
  onApprove: (notes: string) => Promise<void>;
  loadingVersions?: boolean;
}

export default function RoleApprovalAndVersionVault({
  role,
  versions,
  onApprove,
  loadingVersions = false,
}: RoleApprovalAndVersionVaultProps) {
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [approving, setApproving] = useState(false);

  const approval = role.approvalRecord;
  const isApproved = approval?.approvalStatus === "approved" || approval?.approvalStatus === "published";

  const handleConfirmApproval = async () => {
    setApproving(true);
    try {
      await onApprove(approvalNotes);
      setShowApprovalDialog(false);
      setApprovalNotes("");
    } finally {
      setApproving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* SECTION 1: ROLE APPROVAL STATUS & SIGN-OFF BANNER */}
      <div
        style={{
          padding: "20px 24px",
          background: isApproved ? "#F0FDF4" : "var(--surface)",
          border: isApproved ? "1px solid #BBF7D0" : "1px solid var(--border-subtle)",
          borderRadius: 10,
          boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "2px 8px",
                  borderRadius: 4,
                  background: isApproved ? "#ECFDF5" : "var(--color-warning-bg)",
                  color: isApproved ? "#065F46" : "var(--color-warning)",
                  border: isApproved ? "1px solid #A7F3D0" : "1px solid #F8D8A7",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                }}
              >
                {isApproved ? "✓ Approved & Published" : "Draft / Unsigned"}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color: "var(--brand-navy)" }}>
                Active Version: v{role.version || 1}.0
              </span>
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--brand-navy)", margin: "0 0 6px" }}>
              Human Recruiter Sign-Off &amp; Governance
            </h3>

            {isApproved && approval ? (
              <div style={{ fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>
                <div>
                  <strong>Approved By:</strong> {approval.approvedBy} ({approval.approverRole})
                </div>
                <div>
                  <strong>Timestamp:</strong> {new Date(approval.approvedAt).toLocaleString()}
                </div>
                {approval.approvalNotes && (
                  <div style={{ marginTop: 4, fontStyle: "italic", color: "var(--text-primary)" }}>
                    &ldquo;{approval.approvalNotes}&rdquo;
                  </div>
                )}
              </div>
            ) : (
              <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: 0, maxWidth: 640 }}>
                This role is currently in draft mode. Signing off verifies that the technical competencies, ownership levels, and evaluation criteria accurately reflect hiring manager expectations.
              </p>
            )}
          </div>

          <div>
            {!isApproved ? (
              <button
                type="button"
                onClick={() => setShowApprovalDialog(true)}
                style={{
                  padding: "9px 18px",
                  borderRadius: 7,
                  background: "#059669",
                  color: "#FFFFFF",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 1px 2px rgba(5, 150, 105, 0.2)",
                }}
              >
                <span>🖋️</span> Sign-Off &amp; Approve Role
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowApprovalDialog(true)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 7,
                  background: "var(--surface)",
                  color: "var(--brand-navy)",
                  border: "1px solid var(--border-subtle)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Re-sign / Bump Version
              </button>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: IMMUTABLE VERSION SNAPSHOT HISTORY */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 16 }}>📜</span>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--brand-navy)", margin: 0 }}>
            Immutable Role Version History ({versions.length})
          </h4>
        </div>

        {loadingVersions ? (
          <div style={{ padding: 20, textAlign: "center", color: "var(--text-secondary)", fontSize: 12 }}>
            Loading role history...
          </div>
        ) : versions.length === 0 ? (
          <div style={{ padding: "16px 20px", background: "var(--surface-subtle)", border: "1px dashed var(--border-subtle)", borderRadius: 8, fontSize: 12, color: "var(--text-secondary)", textAlign: "center" }}>
            Initial version snapshot active. Subsequent updates and human approvals will record immutable point-in-time audit snapshots.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {versions.map((ver, idx) => (
              <div
                key={ver.id || idx}
                style={{
                  padding: "14px 18px",
                  background: "var(--surface)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: 8,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: "var(--color-info-bg)",
                        color: "var(--brand-cobalt)",
                        border: "1px solid #D2E0FB",
                      }}
                    >
                      v{ver.version}.0
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--brand-navy)" }}>
                      {ver.changeSummary || "Role definition snapshot"}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4 }}>
                    Recorded on {new Date(ver.createdAt).toLocaleString()} by {ver.createdBy}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6, fontSize: 11, color: "var(--text-secondary)" }}>
                  <span style={{ padding: "2px 8px", background: "var(--surface-subtle)", borderRadius: 4, border: "1px solid var(--border-subtle)" }}>
                    {ver.structuredRequirements?.length || 0} Requirements
                  </span>
                  <span style={{ padding: "2px 8px", background: "var(--surface-subtle)", borderRadius: 4, border: "1px solid var(--border-subtle)" }}>
                    {ver.responsibilityGraph?.length || 0} Graph Nodes
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* APPROVAL DIALOG MODAL */}
      {showApprovalDialog && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(16, 24, 40, 0.4)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 480,
              background: "var(--surface)",
              border: "1px solid var(--border-subtle)",
              borderRadius: 12,
              padding: 24,
              boxShadow: "var(--shadow-modal)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--brand-navy)", margin: 0 }}>
                Sign-Off &amp; Publish Role (v{(role.version || 1) + 1}.0)
              </h3>
              <button
                type="button"
                onClick={() => setShowApprovalDialog(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-secondary)", fontSize: 18, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "0 0 16px", lineHeight: 1.5 }}>
              By signing off, you approve the required competencies, evidence tiers, and assessment methods for active candidate screening. A new immutable version snapshot will be committed.
            </p>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "var(--text-secondary)", marginBottom: 6 }}>
                Approval Notes / Sign-Off Comments
              </label>
              <textarea
                rows={3}
                value={approvalNotes}
                onChange={(e) => setApprovalNotes(e.target.value)}
                placeholder="e.g. Verified with Engineering Lead; high concurrency and Kafka experience are non-negotiable."
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 7,
                  background: "var(--surface)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-primary)",
                  fontSize: 12,
                  outline: "none",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowApprovalDialog(false)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  background: "var(--surface)",
                  border: "1px solid var(--border-subtle)",
                  color: "var(--text-secondary)",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmApproval}
                disabled={approving}
                style={{
                  padding: "8px 18px",
                  borderRadius: 6,
                  background: "#059669",
                  color: "#FFFFFF",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: approving ? "not-allowed" : "pointer",
                }}
              >
                {approving ? "Signing..." : "Confirm & Sign-Off"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

