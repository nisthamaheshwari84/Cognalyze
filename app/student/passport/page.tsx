"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";

interface CapabilityItem {
  id: string;
  name: string;
  domain: string;
  certainty: "High" | "Moderate" | "Needs Validation";
  evidenceSnippet: string;
  source: string;
  sourceUrl?: string;
  verifiedAt: string;
}

interface ActiveGrant {
  id: string;
  granteeOrgName: string;
  scopes: string[];
  expiresAt: string;
  isAnonymous: boolean;
}

export default function StudentPassportPage() {
  const [candidateId, setCandidateId] = useState("student-demo");
  const [shareableLink, setShareableLink] = useState("");
  const [anonymousLink, setAnonymousLink] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [activeGrants, setActiveGrants] = useState<ActiveGrant[]>([]);
  const [loading, setLoading] = useState(true);

  // New Grant Form State
  const [showGrantModal, setShowGrantModal] = useState(false);
  const [granteeOrg, setGranteeOrg] = useState("");
  const [grantDuration, setGrantDuration] = useState(30);
  const [isAnonGrant, setIsAnonGrant] = useState(false);
  const [grantSaving, setGrantSaving] = useState(false);

  // Verified Capabilities Seed/State
  const [capabilities, setCapabilities] = useState<CapabilityItem[]>([
    {
      id: "cap-1",
      name: "Distributed Consensus & Raft",
      domain: "Distributed Systems",
      certainty: "High",
      evidenceSnippet: "Authored raft-consensus-go implementation with leader election, log replication, and snapshotting",
      source: "GitHub Repository (verified_code)",
      sourceUrl: "https://github.com/demo/raft-go",
      verifiedAt: "2026-09-15"
    },
    {
      id: "cap-2",
      name: "Transactional Outbox & Event Streaming",
      domain: "Backend Systems",
      certainty: "High",
      evidenceSnippet: "Engineered transactional outbox pattern using PostgreSQL LISTEN/NOTIFY and Kafka partition balancing",
      source: "Production Work Sample (executed_sample)",
      verifiedAt: "2026-09-14"
    },
    {
      id: "cap-3",
      name: "Algorithmic Problem Solving & Data Structures",
      domain: "Core Computer Science",
      certainty: "High",
      evidenceSnippet: "480 algorithmic problems solved across Trees, Graphs, Dynamic Programming (Top 1.2% Guardian badge)",
      source: "Verified Platform Submission",
      sourceUrl: "https://leetcode.com",
      verifiedAt: "2026-09-10"
    },
    {
      id: "cap-4",
      name: "Next.js App Router & Edge Architecture",
      domain: "Fullstack Systems",
      certainty: "Moderate",
      evidenceSnippet: "Built high-performance multi-tenant dashboard with server actions and streaming SSR",
      source: "Project Codebase Review",
      verifiedAt: "2026-09-08"
    },
    {
      id: "cap-5",
      name: "Kubernetes Operator & Helm Automation",
      domain: "Cloud Infrastructure",
      certainty: "Needs Validation",
      evidenceSnippet: "Configuration manifests present in portfolio; runtime reconciliation loop pending live verification",
      source: "Portfolio Manifest (unverified_claim)",
      verifiedAt: "2026-09-01"
    }
  ]);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("cognalyze_student_id") || "student-demo" : "student-demo";
    setCandidateId(stored);

    async function loadConsent() {
      try {
        const res = await fetch(`/api/candidate/consent?candidateId=${stored}`);
        const data = await res.json();
        if (data.success) {
          setShareableLink(data.shareableLink || window.location.origin + `/passport/share/${stored}`);
          setAnonymousLink(data.anonymousLink || window.location.origin + `/passport/share/${stored}?anon=true`);
          setActiveGrants(data.grants || []);
        }
      } catch (err) {
        console.error("Failed to load passport consent:", err);
      } finally {
        setLoading(false);
      }
    }
    loadConsent();
  }, []);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 3000);
  };

  const handleCreateGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!granteeOrg.trim()) return;
    setGrantSaving(true);

    try {
      const res = await fetch("/api/candidate/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId,
          granteeOrgId: `org-${granteeOrg.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
          granteeOrgName: granteeOrg.trim(),
          scopes: ["verified_claims", "evidence_links"],
          isAnonymous: isAnonGrant,
          durationDays: grantDuration
        })
      });
      const data = await res.json();
      if (data.success && data.grant) {
        setActiveGrants(prev => [data.grant, ...prev]);
        setShowGrantModal(false);
        setGranteeOrg("");
      }
    } catch (err) {
      console.error("Failed to create grant:", err);
    } finally {
      setGrantSaving(false);
    }
  };

  const handleRevokeGrant = async (grantId: string) => {
    try {
      const res = await fetch(`/api/candidate/consent?grantId=${grantId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setActiveGrants(prev => prev.filter(g => g.id !== grantId));
      }
    } catch (err) {
      console.error("Failed to revoke grant:", err);
    }
  };

  const certaintyColor = (cert: CapabilityItem["certainty"]) => {
    if (cert === "High") return "#10b981";
    if (cert === "Moderate") return "#3b82f6";
    return "#f59e0b";
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#060913", color: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="student" />

      <main style={{ maxWidth: 1380, margin: "0 auto", padding: "32px 24px" }}>
        
        {/* HEADER: ONE QUESTION */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 6, background: "rgba(99,102,241,0.2)", color: "#a5b4fc", fontWeight: 800, textTransform: "uppercase" }}>
                Living Evidence Passport
              </span>
              <span style={{ fontSize: 11, color: "#94a3b8" }}>
                Portable & Verifiable
              </span>
            </div>
            <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 900, margin: 0, letterSpacing: "-0.5px" }}>
              What can I prove?
            </h1>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", margin: "8px 0 0", maxWidth: 750, lineHeight: 1.5 }}>
              Your capabilities are anchored in verifiable artifacts — production code, algorithmic solutions, and work sample benchmarks. You own your data and grant scoped access to employers with full revocation control.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => setShowGrantModal(true)}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                background: "linear-gradient(135deg, #6366f1, #a855f7)",
                border: "none",
                color: "white",
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 4px 15px rgba(99,102,241,0.3)"
              }}
            >
              + Grant Scoped Consent
            </button>
            <Link
              href="/student/growth"
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                background: "rgba(255, 255, 255, 0.08)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                color: "white",
                fontSize: 13,
                fontWeight: 700,
                textDecoration: "none"
              }}
            >
              🌱 Growth & Next Evidence
            </Link>
          </div>
        </div>

        {/* ── SHAREABLE PASSPORT LINKS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginBottom: 28 }}>
          {/* Public Link */}
          <div style={{ padding: "18px 20px", borderRadius: 14, background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#818cf8", textTransform: "uppercase", marginBottom: 4 }}>
              Verifiable Passport Link
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10 }}>
              Full capability profile with verified code snippets and problem-solving badges.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                readOnly
                value={shareableLink || "https://cognalyze.vercel.app/passport/share/student-demo"}
                style={{ flex: 1, padding: "8px 12px", borderRadius: 8, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "#cbd5e1", fontSize: 12 }}
              />
              <button
                onClick={() => copyToClipboard(shareableLink || "https://cognalyze.vercel.app/passport/share/student-demo", "public")}
                style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(99,102,241,0.2)", border: "1px solid rgba(99,102,241,0.4)", color: "#a5b4fc", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                {copied === "public" ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>

          {/* Anonymous Blind Link */}
          <div style={{ padding: "18px 20px", borderRadius: 14, background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#34d399", textTransform: "uppercase", marginBottom: 4 }}>
              Anonymous Blind Passport Link
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 10 }}>
              Zero-bias review: Hides your name, gender, institution, and background details.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                readOnly
                value={anonymousLink || "https://cognalyze.vercel.app/passport/share/student-demo?anon=true"}
                style={{ flex: 1, padding: "8px 12px", borderRadius: 8, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.1)", color: "#cbd5e1", fontSize: 12 }}
              />
              <button
                onClick={() => copyToClipboard(anonymousLink || "https://cognalyze.vercel.app/passport/share/student-demo?anon=true", "anon")}
                style={{ padding: "8px 14px", borderRadius: 8, background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.4)", color: "#6ee7b7", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                {copied === "anon" ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        {/* ── VERIFIED CAPABILITIES LIST ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "white", margin: 0 }}>
              Verified Capability Portfolio ({capabilities.length})
            </h2>
            <span style={{ fontSize: 12, color: "#94a3b8" }}>
              Anchored in code repositories, problem submissions, and live samples
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {capabilities.map(cap => {
              const color = certaintyColor(cap.certainty);
              return (
                <div
                  key={cap.id}
                  style={{
                    padding: "18px 22px",
                    borderRadius: 14,
                    background: "rgba(15, 23, 42, 0.7)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 16
                  }}
                >
                  <div style={{ maxWidth: 800 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: `${color}20`, color, fontWeight: 800, border: `1px solid ${color}40` }}>
                        {cap.certainty.toUpperCase()} CERTAINTY
                      </span>
                      <span style={{ fontSize: 11, color: "#94a3b8" }}>
                        {cap.domain}
                      </span>
                    </div>

                    <h3 style={{ fontSize: 16, fontWeight: 800, color: "white", margin: "2px 0 6px" }}>
                      {cap.name}
                    </h3>

                    <div style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.5, fontStyle: "italic", background: "rgba(0,0,0,0.25)", padding: "8px 12px", borderRadius: 8, margin: "6px 0" }}>
                      &ldquo;{cap.evidenceSnippet}&rdquo;
                    </div>

                    <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>
                      Provenance: {cap.source} • Verified: {cap.verifiedAt}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    {cap.sourceUrl && (
                      <a
                        href={cap.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ padding: "6px 12px", borderRadius: 6, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "#cbd5e1", fontSize: 11, textDecoration: "none" }}
                      >
                        Inspect Artifact ➔
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── ACTIVE CONSENT GRANTS ── */}
        <div style={{ padding: "24px", borderRadius: 16, background: "rgba(15, 23, 42, 0.6)", border: "1px solid rgba(255, 255, 255, 0.08)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "white", margin: 0 }}>
                Active Scoped Consent Grants ({activeGrants.length})
              </h2>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: "4px 0 0" }}>
                Employers with authorized access to your capability evidence. Revoke access at any time.
              </p>
            </div>
          </div>

          {activeGrants.length === 0 ? (
            <div style={{ padding: 20, textAlign: "center", color: "#94a3b8", fontSize: 13 }}>
              No active employer consent grants. When you apply to a role, a scoped grant is created automatically.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {activeGrants.map(grant => (
                <div
                  key={grant.id}
                  style={{
                    padding: "12px 18px",
                    borderRadius: 10,
                    background: "rgba(0,0,0,0.3)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <strong style={{ fontSize: 13, color: "white" }}>{grant.granteeOrgName}</strong>
                      {grant.isAnonymous && (
                        <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "rgba(16,185,129,0.2)", color: "#6ee7b7", fontWeight: 800 }}>
                          ANONYMOUS
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                      Scopes: {grant.scopes.join(", ")} • Expires: {grant.expiresAt ? new Date(grant.expiresAt).toLocaleDateString() : "30 days"}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevokeGrant(grant.id)}
                    style={{ padding: "6px 12px", borderRadius: 6, background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                  >
                    Revoke Consent
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── SCOPED GRANT MODAL ── */}
        {showGrantModal && (
          <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.7)", padding: 20 }}>
            <div style={{ width: "100%", maxWidth: 500, background: "#0b0f19", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 16, padding: "28px" }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "white", margin: "0 0 4px" }}>Grant Scoped Access</h2>
              <p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 18px" }}>Authorize an organization to inspect your verified capabilities.</p>

              <form onSubmit={handleCreateGrant}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", display: "block", marginBottom: 6 }}>ORGANIZATION NAME</label>
                  <input
                    type="text"
                    value={granteeOrg}
                    onChange={e => setGranteeOrg(e.target.value)}
                    placeholder="e.g. Stripe, Acme Corp"
                    required
                    style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.15)", color: "white", fontSize: 13 }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", display: "block", marginBottom: 6 }}>DURATION</label>
                    <select
                      value={grantDuration}
                      onChange={e => setGrantDuration(parseInt(e.target.value))}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.15)", color: "white", fontSize: 13 }}
                    >
                      <option value={7}>7 Days</option>
                      <option value={30}>30 Days</option>
                      <option value={90}>90 Days</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 800, color: "#94a3b8", display: "block", marginBottom: 6 }}>BLIND REVIEW</label>
                    <button
                      type="button"
                      onClick={() => setIsAnonGrant(!isAnonGrant)}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: 8, background: isAnonGrant ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.05)", border: `1px solid ${isAnonGrant ? "#10b981" : "rgba(255,255,255,0.1)"}`, color: isAnonGrant ? "#6ee7b7" : "#cbd5e1", fontSize: 13, fontWeight: 700, cursor: "pointer" }}
                    >
                      {isAnonGrant ? "✓ Anonymous" : "Include Identity"}
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setShowGrantModal(false)}
                    style={{ padding: "9px 16px", borderRadius: 8, background: "rgba(255,255,255,0.08)", border: "none", color: "white", fontSize: 13, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={grantSaving || !granteeOrg.trim()}
                    style={{ padding: "9px 20px", borderRadius: 8, background: "linear-gradient(135deg, #6366f1, #a855f7)", border: "none", color: "white", fontSize: 13, fontWeight: 700, cursor: grantSaving ? "not-allowed" : "pointer" }}
                  >
                    {grantSaving ? "Creating..." : "✓ Authorize Grant"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
