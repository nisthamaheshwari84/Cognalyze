"use client";

import React, { useState, useEffect } from "react";
import { CollaborationFeedRole } from "@/lib/collab/types";

interface CollaborationFeedProps {
  onApplied?: (roleId: string) => void;
}

export default function CollaborationFeed({ onApplied }: CollaborationFeedProps) {
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

      setTimeout(() => {
        setApplySuccess(false);
        setSelectedRole(null);
        setGithubUrl("");
      }, 1500);
    } catch (err: any) {
      setApplyError(err.message);
    } finally {
      setApplying(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-3">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs">Loading verified collaboration opportunities...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 text-center">
        <div className="text-rose-400 text-sm font-semibold mb-1">Feed Unavailable</div>
        <p className="text-xs text-slate-400 mb-4">{error}</p>
        <button
          onClick={loadFeed}
          className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Collaboration Feed Header */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-900/30">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
              Recruiter Collaboration Feed
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Verified open roles from enterprise recruiters. Your Cognalyze DNA is automatically attached upon application.
          </p>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-indigo-950/80 border border-indigo-800/60 text-indigo-300 text-xs font-semibold">
          {roles.length} Open Roles
        </span>
      </div>

      {roles.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-slate-900/40 border border-dashed border-slate-800 text-slate-400">
          <span className="text-2xl block mb-2">🤝</span>
          <p className="text-sm font-medium text-slate-300">No open collaboration roles currently active.</p>
          <p className="text-xs text-slate-500 mt-1">Check back shortly as recruiters post new verified openings.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {roles.map((role) => (
            <div
              key={role.id}
              className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h3 className="text-base font-bold text-white tracking-wide">{role.title}</h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-950/60 border border-emerald-800/40 text-emerald-400">
                      Open
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Posted {new Date(role.created_at).toLocaleDateString()}
                  </p>
                </div>

                {role.already_applied ? (
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 text-xs font-bold flex items-center gap-1.5 shrink-0">
                    <span>✓</span> Applied with DNA
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedRole(role);
                      setApplyError(null);
                      setApplySuccess(false);
                    }}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md hover:shadow-indigo-500/20 transition shrink-0"
                  >
                    Apply with Auto-DNA
                  </button>
                )}
              </div>

              {/* Description */}
              <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                {role.description}
              </p>

              {/* Skills */}
              {role.required_skills.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 mr-1">Skills:</span>
                  {role.required_skills.map((skill, sIdx) => (
                    <span
                      key={sIdx}
                      className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700/60 text-slate-300 text-[11px]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-5 text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">Apply to {selectedRole.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Direct Submission to Collaboration Feed</p>
              </div>
              <button
                onClick={() => setSelectedRole(null)}
                className="text-slate-400 hover:text-white text-lg p-1"
              >
                ✕
              </button>
            </div>

            {applySuccess ? (
              <div className="p-6 text-center space-y-2">
                <div className="text-3xl">🎉</div>
                <div className="text-sm font-bold text-emerald-400">Application Submitted!</div>
                <p className="text-xs text-slate-400">
                  Your resume, GitHub link, and frozen DNA snapshot were successfully attached.
                </p>
              </div>
            ) : (
              <form onSubmit={handleApply} className="space-y-4">
                {applyError && (
                  <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 leading-relaxed">
                    {applyError}
                  </div>
                )}

                {/* Auto-DNA Callout Banner */}
                <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/60 to-purple-950/40 border border-indigo-800/40 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                    <span>🧬</span> Automatic Cognalyze DNA Attachment
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Your computed DNA radar, skill proficiency proofs, and project verification records are pulled server-side and attached as a frozen snapshot. You do not need to manually upload or re-enter anything.
                  </p>
                </div>

                {/* Resume Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Select Resume <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={resumeId}
                    onChange={(e) => setResumeId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="resume_demo_default">Primary Engineering Resume (Verified)</option>
                    <option value="resume_secondary_swe">Full-Stack / Systems Track Resume</option>
                  </select>
                </div>

                {/* GitHub URL (Optional) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    GitHub Profile URL <span className="text-slate-500">(Optional)</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://github.com/username"
                    value={githubUrl}
                    onChange={(e) => setGithubUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 placeholder-slate-600"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Used alongside your DNA for automated commit and repository verification.
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedRole(null)}
                    className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={applying}
                    className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {applying && (
                      <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    )}
                    <span>{applying ? "Attaching DNA & Submitting..." : "Submit Application"}</span>
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
