"use client";

import React, { useState } from "react";
import { PersonalizedActionRecommendation } from "@/lib/dna/role-gap-engine";
import { X, CheckCircle2, ArrowRight, Loader2, GitBranch, Globe, Award, Code2 } from "lucide-react";

interface ActionCompletionModalProps {
  recommendation: PersonalizedActionRecommendation | null;
  onClose: () => void;
  onCompleted: () => void;
}

export default function ActionCompletionModal({
  recommendation,
  onClose,
  onCompleted
}: ActionCompletionModalProps) {
  const [artifactUrl, setArtifactUrl] = useState("");
  const [artifactType, setArtifactType] = useState<"github_repo" | "live_deployment" | "assessment_result" | "code_snippet">("github_repo");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!recommendation) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/student-dna/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          actionId: recommendation.recommendationId,
          skillId: recommendation.skillId,
          artifactType,
          artifactUrl: artifactUrl.trim() || undefined,
          details: {
            userNotes: notes.trim(),
            targetRoleTitle: recommendation.targetRoleTitle
          }
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          onCompleted();
          onClose();
        }, 1200);
      } else {
        setError(data.error || "Failed to record action completion.");
      }
    } catch (err: any) {
      setError(err?.message || "A network error occurred while submitting.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 12,
          maxWidth: 580,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
          border: "1px solid #E2E8F0"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #F1F5F9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
              Complete Recommended Action
            </div>
            <div style={{ fontSize: 12, color: "#64748B" }}>
              Target: {recommendation.skillName} • {recommendation.targetRoleTitle}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#94A3B8"
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        {success ? (
          <div style={{ padding: 40, textAlign: "center" }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                background: "#DCFCE7",
                color: "#16A34A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 16px auto"
              }}
            >
              <CheckCircle2 size={28} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A" }}>
              Action Completed & Recomputed!
            </div>
            <div style={{ fontSize: 13, color: "#64748B", marginTop: 6 }}>
              New evidence artifact ingested. Dependent skills and metrics have been recalculated.
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Recommendation Context */}
            <div
              style={{
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: 8,
                padding: "12px 16px"
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 700, color: "#334155" }}>
                Objective & Completion Criteria:
              </div>
              <div style={{ fontSize: 13, color: "#475569", marginTop: 4, lineHeight: 1.4 }}>
                {recommendation.completionCriteria}
              </div>
              <div style={{ fontSize: 11, color: "#64748B", marginTop: 6, fontStyle: "italic" }}>
                Expected deliverable: {recommendation.expectedEvidenceArtifact}
              </div>
            </div>

            {/* Artifact Type Selection */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>
                Deliverable Artifact Type
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                {[
                  { id: "github_repo", label: "GitHub Repo URL", icon: GitBranch },
                  { id: "live_deployment", label: "Live Deployment URL", icon: Globe },
                  { id: "code_snippet", label: "Code Implementation", icon: Code2 },
                  { id: "assessment_result", label: "Diagnostic Task", icon: Award }
                ].map((type) => {
                  const Icon = type.icon;
                  const isSelected = artifactType === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setArtifactType(type.id as any)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: isSelected ? "2px solid #2563EB" : "1px solid #CBD5E1",
                        background: isSelected ? "#EFF6FF" : "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 12,
                        fontWeight: isSelected ? 600 : 500,
                        color: isSelected ? "#1D4ED8" : "#475569",
                        cursor: "pointer",
                        textAlign: "left"
                      }}
                    >
                      <Icon size={16} />
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Artifact URL or Identifier Input */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>
                Artifact URL or Repository Link
              </label>
              <input
                type="text"
                value={artifactUrl}
                onChange={(e) => setArtifactUrl(e.target.value)}
                placeholder="https://github.com/username/project or deployed app URL"
                required
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 6,
                  border: "1px solid #CBD5E1",
                  fontSize: 13,
                  outline: "none"
                }}
              />
            </div>

            {/* Implementation Notes */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#334155", display: "block", marginBottom: 6 }}>
                Evidence Notes (Optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe key files, implemented endpoints, or tested components..."
                rows={3}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 6,
                  border: "1px solid #CBD5E1",
                  fontSize: 13,
                  outline: "none",
                  resize: "vertical"
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 6,
                  background: "#FEE2E2",
                  color: "#991B1B",
                  fontSize: 12
                }}
              >
                {error}
              </div>
            )}

            {/* Submit Action */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  border: "1px solid #CBD5E1",
                  background: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#475569",
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !artifactUrl.trim()}
                style={{
                  padding: "8px 18px",
                  borderRadius: 6,
                  border: "none",
                  background: submitting || !artifactUrl.trim() ? "#94A3B8" : "#2563EB",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: submitting || !artifactUrl.trim() ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Inspecting Artifact...
                  </>
                ) : (
                  <>
                    Submit & Recompute
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
