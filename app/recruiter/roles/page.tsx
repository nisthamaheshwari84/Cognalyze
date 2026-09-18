"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { RoleDNA, RequirementTier, TieredRequirement, BusinessOutcome } from "@/lib/ai/role-dna";

export default function RecruiterRolesPage() {
  const [roles, setRoles] = useState<RoleDNA[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<RoleDNA | null>(null);

  // Form State for creating new role
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [department, setDepartment] = useState("Core Systems");
  const [seniority, setSeniority] = useState<RoleDNA["seniority"]>("Senior");
  const [targetHires, setTargetHires] = useState(2);

  // 3-Question Simple Recruiter State
  const [mustHaves, setMustHaves] = useState<string[]>([
    "Distributed systems, Kafka partition balancing & Raft consensus",
    "Backend concurrency, thread pools & ACID database isolation"
  ]);
  const [niceToHaves, setNiceToHaves] = useState<string[]>([
    "Kubernetes operator development & Helm automation",
    "OpenTelemetry tracing & Prometheus monitoring"
  ]);
  const [success90Days, setSuccess90Days] = useState(
    "Architect distributed high-throughput processing pipeline achieving 99.99% availability under 10k TPS in the first 90 days."
  );

  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRoles() {
      try {
        const res = await fetch("/api/recruiter/roles");
        const data = await res.json();
        if (data.success && data.roles) {
          setRoles(data.roles);
          if (data.roles.length > 0) {
            setSelectedRole(data.roles[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch roles:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRoles();
  }, []);

  // Automatically compile requirements from the 3 plain questions
  // Must-haves: 70% total weight, Critical/Important, dealBreaker = true
  // Nice-to-haves: 30% total weight, Preferred/Trainable, dealBreaker = false
  const compileRoleRequirements = (): TieredRequirement[] => {
    const validMustHaves = mustHaves.map(m => m.trim()).filter(Boolean);
    const validNiceToHaves = niceToHaves.map(n => n.trim()).filter(Boolean);

    const compiled: TieredRequirement[] = [];

    // Allocate 70% to Must-Haves
    if (validMustHaves.length > 0) {
      const baseMust = Math.floor(70 / validMustHaves.length);
      let remMust = 70 - baseMust * validMustHaves.length;

      validMustHaves.forEach((name, idx) => {
        const extra = remMust > 0 ? 1 : 0;
        if (remMust > 0) remMust--;
        const isFirst = idx === 0;
        compiled.push({
          id: `req-must-${idx + 1}`,
          name,
          tier: isFirst ? "Critical" : "Important",
          category: isFirst ? "System Design" : "Technical",
          description: `Must-have day-one capability: ${name}`,
          weightPct: baseMust + extra,
          verificationMethod: isFirst ? "work_sample" : "code_execution",
          dealBreakerIfMissing: true,
          acceptableProofTypes: ["production_code", "live_work_sample", "github_commit"]
        });
      });
    }

    // Allocate 30% to Nice-to-Haves
    if (validNiceToHaves.length > 0) {
      const targetNice = validMustHaves.length > 0 ? 30 : 100;
      const baseNice = Math.floor(targetNice / validNiceToHaves.length);
      let remNice = targetNice - baseNice * validNiceToHaves.length;

      validNiceToHaves.forEach((name, idx) => {
        const extra = remNice > 0 ? 1 : 0;
        if (remNice > 0) remNice--;
        const isFirst = idx === 0;
        compiled.push({
          id: `req-nice-${idx + 1}`,
          name,
          tier: isFirst ? "Preferred" : "Trainable",
          category: "Technical",
          description: `Can be learned or refined on the job: ${name}`,
          weightPct: baseNice + extra,
          verificationMethod: isFirst ? "portfolio_audit" : "targeted_interview",
          dealBreakerIfMissing: false,
          acceptableProofTypes: ["verified_interview", "github_commit"]
        });
      });
    }

    if (compiled.length === 0) {
      compiled.push({
        id: "req-default-1",
        name: "General Core Competency",
        tier: "Critical",
        category: "Technical",
        description: "Core day one engineering skills",
        weightPct: 100,
        verificationMethod: "work_sample",
        dealBreakerIfMissing: true,
        acceptableProofTypes: ["production_code"]
      });
    }

    return compiled;
  };

  const handleSaveRole = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    setSaveMessage(null);

    const tieredRequirements = compileRoleRequirements();
    const businessOutcomes: BusinessOutcome[] = [
      {
        id: `out-${Date.now().toString().slice(-4)}`,
        outcome: success90Days.trim() || `${title} successful deployment and impact`,
        metric: "90-day milestone verification",
        timeframe: "First 90 days",
        impactSeverity: "Critical"
      }
    ];

    try {
      const res = await fetch("/api/recruiter/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          department,
          seniority,
          targetHires,
          uncertaintyThreshold: 0.20, // Clean background default, no jargon for recruiter
          businessOutcomes,
          tieredRequirements
        })
      });
      const data = await res.json();
      if (data.success && data.role) {
        setRoles(prev => [data.role, ...prev]);
        setSelectedRole(data.role);
        setIsCreating(false);
        if (typeof window !== "undefined") {
          localStorage.setItem("cognalyze_active_role_id", data.role.id);
        }
        setSaveMessage(`✓ Role DNA for "${data.role.title}" successfully architected and calibrated!`);
        setTimeout(() => setSaveMessage(null), 12000);
      }
    } catch (err: any) {
      setSaveMessage(`Error saving role: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#060913", color: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="recruiter" />

      <main style={{ maxWidth: 1380, margin: "0 auto", padding: "32px 24px" }}>
        
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(168,85,247,0.2)", color: "#d8b4fe", fontWeight: 800 }}>
                ROLE ARCHITECT
              </span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                3-Question Outcome-Driven Role Setup
              </span>
            </div>
            <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>
              🧬 Role DNA Architect
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", margin: "8px 0 0", maxWidth: 750, lineHeight: 1.5 }}>
              Answer 3 plain questions to define what matters most. Cognalyze automatically calibrates evaluation priorities in the background so you never have to configure weights or gate thresholds.
            </p>
          </div>

          <button
            onClick={() => setIsCreating(!isCreating)}
            style={{
              padding: "10px 18px",
              borderRadius: 10,
              background: isCreating ? "rgba(255,255,255,0.1)" : "linear-gradient(135deg, #a855f7, #6366f1)",
              border: isCreating ? "1px solid rgba(255,255,255,0.2)" : "none",
              color: "white",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: isCreating ? "none" : "0 4px 15px rgba(168,85,247,0.3)"
            }}
          >
            {isCreating ? "✕ Close Setup Form" : "+ Create New Role"}
          </button>
        </div>

        {saveMessage && (
          <div style={{ padding: "14px 20px", borderRadius: 12, background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", color: "#6ee7b7", marginBottom: 24, fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>✓</span>
              <span>{saveMessage}</span>
            </div>
            {selectedRole && (
              <Link
                href={`/recruiter/candidates?roleId=${selectedRole.id}`}
                onClick={() => {
                  if (typeof window !== "undefined") {
                    localStorage.setItem("cognalyze_active_role_id", selectedRole.id);
                  }
                }}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  background: "linear-gradient(135deg, #10b981, #059669)",
                  color: "white",
                  textDecoration: "none",
                  fontSize: 12,
                  fontWeight: 800,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 0 15px rgba(16,185,129,0.3)"
                }}
              >
                <span>🚀</span> Screen Candidates for this Role ➔
              </Link>
            )}
          </div>
        )}

        {/* ── CREATE FORM: 3 PLAIN QUESTIONS ── */}
        {isCreating && (
          <div style={{ background: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(168, 85, 247, 0.4)", borderRadius: 18, padding: "28px", marginBottom: 32, boxShadow: "0 10px 35px rgba(0,0,0,0.5)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>✨</span>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "white", margin: 0 }}>
                Create Role DNA in 3 Simple Steps
              </h2>
            </div>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 20px" }}>
              Define what matters. Cognalyze handles the underlying requirement calibration and evidence tiers automatically.
            </p>

            <form onSubmit={handleSaveRole}>
              {/* Basic Role Info */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginBottom: 24, padding: "16px", borderRadius: 12, background: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", display: "block", marginBottom: 6 }}>ROLE TITLE</label>
                  <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Senior Backend Engineer"
                    required
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.12)", color: "white", fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", display: "block", marginBottom: 6 }}>DEPARTMENT / TEAM</label>
                  <input
                    type="text"
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    placeholder="e.g. Core Platform"
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.12)", color: "white", fontSize: 13 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", display: "block", marginBottom: 6 }}>SENIORITY LEVEL</label>
                  <select
                    value={seniority}
                    onChange={e => setSeniority(e.target.value as any)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.12)", color: "white", fontSize: 13 }}
                  >
                    <option value="Junior">Junior (0-2 yrs)</option>
                    <option value="Mid-Level">Mid-Level (2-5 yrs)</option>
                    <option value="Senior">Senior (5-8 yrs)</option>
                    <option value="Staff">Staff (8+ yrs)</option>
                    <option value="Principal">Principal / Lead</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", display: "block", marginBottom: 6 }}>TARGET HIRES</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={targetHires}
                    onChange={e => setTargetHires(parseInt(e.target.value) || 1)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.12)", color: "white", fontSize: 13 }}
                  />
                </div>
              </div>

              {/* ── QUESTION 1: MUST HAVES (DAY 1) ── */}
              <div style={{ marginBottom: 22, padding: "18px 20px", borderRadius: 14, background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 4, background: "rgba(239,68,68,0.2)", color: "#f87171", textTransform: "uppercase" }}>Question 1</span>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: "#f8fafc", margin: "6px 0 2px" }}>
                      What does this person need to be great at from day one? (Must-have)
                    </h3>
                    <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
                      Non-negotiable competencies. Candidates lacking evidence here will be flagged immediately.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMustHaves([...mustHaves, ""])}
                    style={{ padding: "6px 12px", borderRadius: 6, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                  >
                    + Add Must-Have
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                  {mustHaves.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "#ef4444", fontWeight: 700, width: 22 }}>#{idx + 1}</span>
                      <input
                        type="text"
                        value={item}
                        onChange={e => {
                          const updated = [...mustHaves];
                          updated[idx] = e.target.value;
                          setMustHaves(updated);
                        }}
                        placeholder="e.g. Distributed systems, Kafka partition balancing & Raft consensus"
                        style={{ flex: 1, padding: "9px 12px", borderRadius: 8, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.12)", color: "white", fontSize: 13 }}
                      />
                      {mustHaves.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setMustHaves(mustHaves.filter((_, i) => i !== idx))}
                          style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 16, padding: "4px 8px" }}
                          title="Remove item"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── QUESTION 2: NICE TO HAVES (LEARN ON JOB) ── */}
              <div style={{ marginBottom: 22, padding: "18px 20px", borderRadius: 14, background: "rgba(59, 130, 246, 0.05)", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 4, background: "rgba(59,130,246,0.2)", color: "#60a5fa", textTransform: "uppercase" }}>Question 2</span>
                    <h3 style={{ fontSize: 14, fontWeight: 800, color: "#f8fafc", margin: "6px 0 2px" }}>
                      What's helpful but can be learned on the job? (Nice-to-have)
                    </h3>
                    <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>
                      Differentiating skills that boost a candidate's score, but won't disqualify them if missing.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNiceToHaves([...niceToHaves, ""])}
                    style={{ padding: "6px 12px", borderRadius: 6, background: "rgba(59,130,246,0.15)", border: "1px solid rgba(59,130,246,0.3)", color: "#93c5fd", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                  >
                    + Add Nice-to-Have
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                  {niceToHaves.map((item, idx) => (
                    <div key={idx} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "#3b82f6", fontWeight: 700, width: 22 }}>#{idx + 1}</span>
                      <input
                        type="text"
                        value={item}
                        onChange={e => {
                          const updated = [...niceToHaves];
                          updated[idx] = e.target.value;
                          setNiceToHaves(updated);
                        }}
                        placeholder="e.g. Kubernetes operator development or OpenTelemetry tracing"
                        style={{ flex: 1, padding: "9px 12px", borderRadius: 8, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.12)", color: "white", fontSize: 13 }}
                      />
                      {niceToHaves.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setNiceToHaves(niceToHaves.filter((_, i) => i !== idx))}
                          style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 16, padding: "4px 8px" }}
                          title="Remove item"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* ── QUESTION 3: 90-DAY SUCCESS ── */}
              <div style={{ marginBottom: 24, padding: "18px 20px", borderRadius: 14, background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 8px", borderRadius: 4, background: "rgba(16,185,129,0.2)", color: "#34d399", textTransform: "uppercase" }}>Question 3</span>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: "#f8fafc", margin: "6px 0 2px" }}>
                  What does success look like in 90 days? (Optional)
                </h3>
                <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 10px" }}>
                  One or two sentences describing the concrete outcome this person will deliver after onboarding.
                </p>
                <textarea
                  rows={2}
                  value={success90Days}
                  onChange={e => setSuccess90Days(e.target.value)}
                  placeholder="e.g. Architect and deploy high-throughput processing pipeline with 99.99% availability."
                  style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.12)", color: "white", fontSize: 13, resize: "vertical" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <div style={{ fontSize: 11, color: "#64748b" }}>
                  🔒 Requirement weights and evidence calibration are computed automatically in the background.
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    style={{ padding: "10px 18px", borderRadius: 8, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)", color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving || !title.trim()}
                    style={{
                      padding: "10px 24px",
                      borderRadius: 8,
                      background: "linear-gradient(135deg, #10b981, #059669)",
                      border: "none",
                      color: "white",
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: saving || !title.trim() ? "not-allowed" : "pointer"
                    }}
                  >
                    {saving ? "Saving Role DNA..." : "✓ Create Role DNA"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* ── ACTIVE ROLE DNA INSPECTOR ── */}
        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 24, alignItems: "flex-start" }}>
          
          {/* Roles Selector Sidebar */}
          <div style={{ background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: "18px" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: 12 }}>
              Active Role DNAs ({roles.length})
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {roles.map(r => {
                const isSelected = selectedRole?.id === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      setSelectedRole(r);
                      if (typeof window !== "undefined") {
                        localStorage.setItem("cognalyze_active_role_id", r.id);
                      }
                    }}
                    style={{
                      textAlign: "left",
                      padding: "12px 14px",
                      borderRadius: 10,
                      background: isSelected ? "rgba(168, 85, 247, 0.2)" : "rgba(255, 255, 255, 0.03)",
                      border: `1px solid ${isSelected ? "rgba(168, 85, 247, 0.5)" : "rgba(255, 255, 255, 0.06)"}`,
                      color: isSelected ? "#f8fafc" : "#cbd5e1",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 2 }}>{r.title}</div>
                    <div style={{ fontSize: 11, color: "#94a3b8" }}>{r.department} • {r.seniority}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Role DNA Deep View */}
          {selectedRole && (
            <div style={{ background: "rgba(15, 23, 42, 0.7)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 16, padding: "28px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 14, marginBottom: 20 }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 4, background: "rgba(99,102,241,0.2)", color: "#a5b4fc", fontWeight: 800 }}>
                      ACTIVE ROLE SPECIFICATION
                    </span>
                    <span style={{ fontSize: 11, color: "#94a3b8" }}>ID: {selectedRole.id}</span>
                  </div>
                  <h2 style={{ fontSize: 22, fontWeight: 900, color: "white", margin: 0 }}>
                    {selectedRole.title}
                  </h2>
                  <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
                    Department: {selectedRole.department} • Seniority: {selectedRole.seniority} • Target Hires: {selectedRole.targetHires}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <Link
                    href={`/recruiter/candidates?roleId=${selectedRole.id}`}
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        localStorage.setItem("cognalyze_active_role_id", selectedRole.id);
                      }
                    }}
                    style={{
                      padding: "9px 18px",
                      borderRadius: 10,
                      background: "linear-gradient(135deg, #6366f1, #a855f7)",
                      color: "white",
                      textDecoration: "none",
                      fontSize: 12,
                      fontWeight: 800,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      boxShadow: "0 0 20px rgba(99,102,241,0.3)"
                    }}
                  >
                    <span>📥</span> Screen Candidates ➔
                  </Link>

                  <Link
                    href={`/recruiter/decision-room?roleId=${selectedRole.id}`}
                    onClick={() => {
                      if (typeof window !== "undefined") {
                        localStorage.setItem("cognalyze_active_role_id", selectedRole.id);
                      }
                    }}
                    style={{
                      padding: "9px 16px",
                      borderRadius: 10,
                      background: "rgba(255, 255, 255, 0.06)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      color: "#cbd5e1",
                      textDecoration: "none",
                      fontSize: 12,
                      fontWeight: 700,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    <span>⚖️</span> Decision Room ➔
                  </Link>
                </div>
              </div>

              {/* 90-Day Business Outcomes */}
              <div style={{ marginBottom: 24, padding: "18px", borderRadius: 12, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#818cf8", textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 12px" }}>
                  🎯 90-Day Success & Impact Goal
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {selectedRole.businessOutcomes.map(out => (
                    <div key={out.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 13 }}>
                      <div>
                        <strong style={{ color: "#f8fafc" }}>{out.outcome}</strong>
                        <div style={{ fontSize: 11, color: "#94a3b8" }}>Milestone: {out.metric} ({out.timeframe})</div>
                      </div>
                      <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "rgba(16,185,129,0.15)", color: "#6ee7b7", fontWeight: 800 }}>
                        Target Outcome
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Requirements & Priorities */}
              <div>
                <h3 style={{ fontSize: 13, fontWeight: 800, color: "#cbd5e1", textTransform: "uppercase", letterSpacing: 0.5, margin: "0 0 12px" }}>
                  🧬 Core Requirements & Evaluation Priorities
                </h3>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {selectedRole.tieredRequirements.map(req => {
                    const isMustHave = req.dealBreakerIfMissing || req.tier === "Critical" || req.tier === "Important";
                    const badgeColor = isMustHave ? "#ef4444" : "#3b82f6";
                    return (
                      <div
                        key={req.id}
                        style={{
                          padding: "14px 18px",
                          borderRadius: 10,
                          background: "rgba(0,0,0,0.3)",
                          border: `1px solid ${isMustHave ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.15)"}`,
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          flexWrap: "wrap",
                          gap: 12
                        }}
                      >
                        <div style={{ maxWidth: 550 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                            <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: `${badgeColor}20`, color: badgeColor, fontWeight: 800, border: `1px solid ${badgeColor}40` }}>
                              {isMustHave ? "🚨 MUST-HAVE (DAY 1)" : "🌱 NICE-TO-HAVE (LEARN ON JOB)"}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: "white" }}>
                              {req.name}
                            </span>
                          </div>
                          <div style={{ fontSize: 12, color: "#94a3b8" }}>
                            {req.description}
                          </div>
                        </div>

                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 6, background: "rgba(255,255,255,0.06)", color: badgeColor, display: "inline-block" }}>
                            {isMustHave ? "Core Priority" : "Secondary Priority"} ({req.weightPct}%)
                          </div>
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 3 }}>
                            Evidence verified via {req.verificationMethod.replace(/_/g, " ")}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>

      </main>
    </div>
  );
}
