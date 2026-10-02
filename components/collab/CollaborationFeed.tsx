"use client";

import React, { useState, useEffect } from "react";
import { CollaborationFeedRole } from "@/lib/collab/types";
import { useTheme } from "@/components/ThemeProvider";

interface CollaborationFeedProps {
  onApplied?: (roleId: string) => void;
}

export default function CollaborationFeed({ onApplied }: CollaborationFeedProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const [roles, setRoles] = useState<CollaborationFeedRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Apply Modal State
  const [selectedRole, setSelectedRole] = useState<CollaborationFeedRole | null>(null);
  const [resumeId, setResumeId] = useState("resume_demo_default");
  const [githubUrl, setGithubUrl] = useState("");
  const [applying, setApplying] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);

  // Design system theme tokens
  const cardBg = isDark ? "#0E1B2E" : "#FFFFFF";
  const borderCol = isDark ? "#223750" : "#E4E1DA";
  const textPrimary = isDark ? "#F2F6FC" : "#17191C";
  const textSecondary = isDark ? "#B6C4D6" : "#667085";
  const headingCol = isDark ? "#F2F6FC" : "#162A43";
  const inputBg = isDark ? "#13243A" : "#FFFFFF";
  const chipBg = isDark ? "#13243A" : "#F6F5F1";
  const chipBorder = isDark ? "#223750" : "#E4E1DA";
  const accent = isDark ? "#3478F6" : "#356AE6";
  const accentBg = isDark ? "rgba(52, 120, 246, 0.15)" : "#EFF4FE";
  const accentBorder = isDark ? "rgba(52, 120, 246, 0.3)" : "#D2E0FB";

  useEffect(() => {
    loadFeed();
  }, []);

  async function loadFeed() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/feed/collaboration?page=0");
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load collaboration feed");
      }

      setRoles(data.feed || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleApply(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRole) return;

    setApplying(true);
    setApplyError(null);

    try {
      const res = await fetch(`/api/roles/${encodeURIComponent(selectedRole.id)}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_id: resumeId,
          github_url: githubUrl.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 412) {
          throw new Error(
            "🧬 " + (data.error || "No verified DNA analysis found. Please complete your DNA profile first.")
          );
        }
        throw new Error(data.error || "Failed to submit application");
      }

      setApplySuccess(true);
      // Mark role as already applied
      setRoles((prev) =>
        prev.map((r) => (r.id === selectedRole.id ? { ...r, already_applied: true } : r))
      );

      if (onApplied) onApplied(selectedRole.id);
    } catch (err: any) {
      setApplyError(err.message);
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center", color: textSecondary }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>⚡</div>
        <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>Loading verified recruiter roles from the network...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "20px", borderRadius: 10, background: isDark ? "rgba(230,57,70,0.1)" : "#FDF2F2", border: `1px solid ${isDark ? "rgba(230,57,70,0.25)" : "#F8C8C8"}`, color: "#E63946", fontSize: 13 }}>
        ⚠️ {error}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Collaboration Feed Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderRadius: 10, background: cardBg, border: `1px solid ${borderCol}`, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ height: 8, width: 8, borderRadius: "50%", background: "#2E7D5B" }} />
            <span style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, color: headingCol }}>
              Recruiter Collaboration Feed
            </span>
          </div>
          <p style={{ fontSize: 12, color: textSecondary, margin: "4px 0 0" }}>
            Verified open roles from enterprise recruiters. Your Cognalyze DNA is automatically attached upon application.
          </p>
        </div>
        <span style={{ padding: "4px 10px", borderRadius: 5, background: accentBg, border: `1px solid ${accentBorder}`, color: accent, fontSize: 12, fontWeight: 700 }}>
          {roles.length} Open Roles
        </span>
      </div>

      {roles.length === 0 ? (
        <div style={{ padding: "48px 24px", textAlign: "center", borderRadius: 10, background: cardBg, border: `1px dashed ${borderCol}`, color: textSecondary }}>
          <span style={{ fontSize: 32, display: "block", marginBottom: 8 }}>🤝</span>
          <p style={{ fontSize: 14, fontWeight: 700, color: headingCol, margin: "0 0 4px" }}>No open collaboration roles currently active.</p>
          <p style={{ fontSize: 12, color: textSecondary, margin: 0 }}>Check back shortly as recruiters post new verified openings.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {roles.map((role) => (
            <div
              key={role.id}
              style={{
                padding: "20px",
                borderRadius: 10,
                background: cardBg,
                border: `1px solid ${borderCol}`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: headingCol, margin: 0 }}>{role.title}</h3>
                    <span style={{ padding: "2px 8px", borderRadius: 4, fontSize: 10, fontWeight: 800, textTransform: "uppercase", background: isDark ? "rgba(46,125,91,0.2)" : "#EAF4EE", border: `1px solid ${isDark ? "rgba(46,125,91,0.4)" : "#C8E4D3"}`, color: isDark ? "#4ade80" : "#2E7D5B" }}>
                      Open
                    </span>
                  </div>
                  <p style={{ fontSize: 12, color: textSecondary, margin: "4px 0 0" }}>
                    Posted {new Date(role.created_at).toLocaleDateString()}
                  </p>
                </div>

                {role.already_applied ? (
                  <span style={{ padding: "6px 12px", borderRadius: 7, background: isDark ? "rgba(46,125,91,0.2)" : "#EAF4EE", border: `1px solid ${isDark ? "rgba(46,125,91,0.4)" : "#C8E4D3"}`, color: isDark ? "#4ade80" : "#2E7D5B", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                    <span>✓</span> Applied with DNA
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedRole(role);
                      setApplyError(null);
                      setApplySuccess(false);
                    }}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 7,
                      background: accent,
                      color: "white",
                      fontSize: 12,
                      fontWeight: 700,
                      border: "none",
                      cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    Apply with Auto-DNA
                  </button>
                )}
              </div>

              {/* Description */}
              <p style={{ fontSize: 13, color: textPrimary, lineHeight: 1.5, margin: 0, whiteSpace: "pre-line" }}>
                {role.description}
              </p>

              {/* Skills */}
              {role.required_skills.length > 0 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", paddingTop: 4 }}>
                  <span style={{ fontSize: 11, textTransform: "uppercase", fontWeight: 700, color: textSecondary, marginRight: 4 }}>Skills:</span>
                  {role.required_skills.map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      style={{
                        padding: "3px 8px",
                        borderRadius: 5,
                        background: chipBg,
                        border: `1px solid ${chipBorder}`,
                        color: headingCol,
                        fontSize: 11,
                        fontWeight: 600,
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── APPLY MODAL ── */}
      {selectedRole && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16, background: "rgba(0,0,0,0.65)", backdropFilter: "blur(6px)" }}>
          <div style={{ width: "100%", maxWidth: 520, borderRadius: 12, background: cardBg, border: `1px solid ${borderCol}`, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3), 0 10px 10px -5px rgba(0,0,0,0.1)", padding: "24px", color: textPrimary, display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: 12, borderBottom: `1px solid ${borderCol}` }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: headingCol, margin: 0 }}>Apply to {selectedRole.title}</h3>
                <p style={{ fontSize: 12, color: textSecondary, margin: "2px 0 0" }}>Direct Submission to Collaboration Feed</p>
              </div>
              <button
                onClick={() => setSelectedRole(null)}
                style={{ background: "none", border: "none", color: textSecondary, fontSize: 18, cursor: "pointer", padding: 4 }}
              >
                ✕
              </button>
            </div>

            {applySuccess ? (
              <div style={{ padding: "24px", textAlign: "center", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ fontSize: 32 }}>🎉</div>
                <div style={{ fontSize: 15, fontWeight: 800, color: isDark ? "#4ade80" : "#2E7D5B" }}>Application Submitted!</div>
                <p style={{ fontSize: 13, color: textSecondary, margin: 0 }}>
                  Your resume, GitHub link, and frozen DNA snapshot were successfully attached.
                </p>
              </div>
            ) : (
              <form onSubmit={handleApply} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {applyError && (
                  <div style={{ padding: "10px 14px", borderRadius: 7, background: isDark ? "rgba(230,57,70,0.1)" : "#FDF2F2", border: `1px solid ${isDark ? "rgba(230,57,70,0.25)" : "#F8C8C8"}`, fontSize: 12, color: "#E63946", lineHeight: 1.4 }}>
                    {applyError}
                  </div>
                )}

                {/* Auto-DNA Callout Banner */}
                <div style={{ padding: "12px 14px", borderRadius: 8, background: accentBg, border: `1px solid ${accentBorder}`, display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: accent }}>
                    <span>🧬</span> Automatic Cognalyze DNA Attachment
                  </div>
                  <p style={{ fontSize: 11.5, color: textPrimary, lineHeight: 1.5, margin: 0 }}>
                    Your computed DNA radar, skill proficiency proofs, and project verification records are pulled server-side and attached as a frozen snapshot. You do not need to manually upload or re-enter anything.
                  </p>
                </div>

                {/* Resume Selector */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: headingCol, marginBottom: 6 }}>
                    Select Resume <span style={{ color: "#E63946" }}>*</span>
                  </label>
                  <select
                    value={resumeId}
                    onChange={(e) => setResumeId(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 7, background: inputBg, border: `1px solid ${borderCol}`, fontSize: 13, color: textPrimary, outline: "none", boxSizing: "border-box" }}
                  >
                    <option value="resume_demo_default">Primary Engineering Resume (Verified)</option>
                    <option value="resume_secondary_swe">Full-Stack / Systems Track Resume</option>
                  </select>
                </div>

                {/* GitHub URL (Optional) */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: headingCol, marginBottom: 6 }}>
                    GitHub Profile URL <span style={{ color: textSecondary, fontWeight: 500 }}>(Optional)</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/username"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: 7, background: inputBg, border: `1px solid ${borderCol}`, fontSize: 13, color: textPrimary, outline: "none", boxSizing: "border-box" }}
                  />
                  <p style={{ fontSize: 11, color: textSecondary, margin: "4px 0 0" }}>
                    Used alongside your DNA for automated commit and repository verification.
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, paddingTop: 8, borderTop: `1px solid ${borderCol}` }}>
                  <button
                    type="button"
                    onClick={() => setSelectedRole(null)}
                    style={{ padding: "8px 16px", borderRadius: 7, border: `1px solid ${borderCol}`, background: cardBg, color: textSecondary, fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={applying}
                    style={{ padding: "8px 18px", borderRadius: 7, background: accent, color: "white", fontSize: 12, fontWeight: 700, border: "none", cursor: applying ? "not-allowed" : "pointer" }}
                  >
                    {applying ? "Attaching DNA & Submitting..." : "Submit Application"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
