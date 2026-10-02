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

  const getCertaintyStyle = (cert: CapabilityItem["certainty"]) => {
    if (cert === "High") return { color: "#2E7D5B", bg: "#EAF4EE", border: "#C8E4D3" };
    if (cert === "Moderate") return { color: "#356AE6", bg: "#EFF4FE", border: "#D2E0FB" };
    return { color: "#B7791F", bg: "#FEF7ED", border: "#F8D8A7" };
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1", color: "#17191C", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="student" />

      <main style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 24px 96px" }}>
        
        {/* HEADER: ONE QUESTION */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 5, background: "#EFF4FE", color: "#356AE6", fontWeight: 700, textTransform: "uppercase" }}>
                Living Evidence Passport
              </span>
              <span style={{ fontSize: 12, color: "#667085" }}>
                Portable & Verifiable
              </span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 600, margin: 0, color: "#162A43", letterSpacing: "-0.3px" }}>
              What can I prove?
            </h1>
            <p style={{ fontSize: 13, color: "#667085", margin: "6px 0 0", maxWidth: 720, lineHeight: 1.5 }}>
              Your capabilities are anchored in verifiable artifacts — production code, algorithmic solutions, and work sample benchmarks. You own your data and grant scoped access to employers with full revocation control.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              onClick={() => setShowGrantModal(true)}
              style={{
                padding: "8px 16px",
                borderRadius: 7,
                background: "#356AE6",
                border: "none",
                color: "#FFFFFF",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                transition: "background 0.15s ease"
              }}
            >
              + Grant Scoped Consent
            </button>
            <Link
              href="/student/growth"
              style={{
                padding: "8px 16px",
                borderRadius: 7,
                background: "#FFFFFF",
                border: "1px solid #E4E1DA",
                color: "#162A43",
                fontSize: 12,
                fontWeight: 600,
                textDecoration: "none"
              }}
            >
              Growth & Next Evidence →
            </Link>
          </div>
        </div>

        {/* ── SHAREABLE PASSPORT LINKS ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16, marginBottom: 28 }}>
          {/* Public Link */}
          <div style={{ padding: "18px 20px", borderRadius: 10, background: "#FFFFFF", border: "1px solid #E4E1DA" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#356AE6", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
              Verifiable Passport Link
            </div>
            <div style={{ fontSize: 12, color: "#667085", marginBottom: 12 }}>
              Full capability profile with verified code snippets and problem-solving badges.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                readOnly
                value={shareableLink || "https://cognalyze.vercel.app/passport/share/student-demo"}
                style={{ flex: 1, padding: "8px 12px", borderRadius: 7, background: "#FAF9F6", border: "1px solid #E4E1DA", color: "#17191C", fontSize: 12, outline: "none" }}
              />
              <button
                onClick={() => copyToClipboard(shareableLink || "https://cognalyze.vercel.app/passport/share/student-demo", "public")}
                style={{
                  padding: "8px 14px",
                  borderRadius: 7,
                  background: copied === "public" ? "#EAF4EE" : "#FAF9F6",
                  border: `1px solid ${copied === "public" ? "#C8E4D3" : "#E4E1DA"}`,
                  color: copied === "public" ? "#2E7D5B" : "#162A43",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                {copied === "public" ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>

          {/* Anonymous Blind Link */}
          <div style={{ padding: "18px 20px", borderRadius: 10, background: "#FFFFFF", border: "1px solid #E4E1DA" }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#2E7D5B", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
              Anonymous Blind Passport Link
            </div>
            <div style={{ fontSize: 12, color: "#667085", marginBottom: 12 }}>
              Zero-bias review: Hides your name, gender, institution, and background details.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                type="text"
                readOnly
                value={anonymousLink || "https://cognalyze.vercel.app/passport/share/student-demo?anon=true"}
                style={{ flex: 1, padding: "8px 12px", borderRadius: 7, background: "#FAF9F6", border: "1px solid #E4E1DA", color: "#17191C", fontSize: 12, outline: "none" }}
              />
              <button
                onClick={() => copyToClipboard(anonymousLink || "https://cognalyze.vercel.app/passport/share/student-demo?anon=true", "anon")}
                style={{
                  padding: "8px 14px",
                  borderRadius: 7,
                  background: copied === "anon" ? "#EAF4EE" : "#FAF9F6",
                  border: `1px solid ${copied === "anon" ? "#C8E4D3" : "#E4E1DA"}`,
                  color: copied === "anon" ? "#2E7D5B" : "#162A43",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                {copied === "anon" ? "✓ Copied" : "Copy"}
              </button>
            </div>
          </div>
        </div>

        {/* ── VERIFIED CAPABILITIES LIST ── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: "#162A43", margin: 0, letterSpacing: "-0.2px" }}>
              Verified Capability Portfolio ({capabilities.length})
            </h2>
            <span style={{ fontSize: 12, color: "#667085" }}>
              Anchored in code repositories, problem submissions, and live samples
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {capabilities.map(cap => {
              const style = getCertaintyStyle(cap.certainty);
              return (
                <div
                  key={cap.id}
                  style={{
                    padding: "18px 22px",
                    borderRadius: 10,
                    background: "#FFFFFF",
                    border: "1px solid #E4E1DA",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: 16
                  }}
                >
                  <div style={{ maxWidth: 840 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 4, background: style.bg, color: style.color, fontWeight: 700, border: `1px solid ${style.border}` }}>
                        {cap.certainty.toUpperCase()} CERTAINTY
                      </span>
                      <span style={{ fontSize: 11, color: "#667085" }}>
                        {cap.domain}
                      </span>
                    </div>

                    <h3 style={{ fontSize: 15, fontWeight: 600, color: "#162A43", margin: "2px 0 6px" }}>
                      {cap.name}
                    </h3>

                    <div style={{ fontSize: 13, color: "#17191C", lineHeight: 1.5, background: "#FAF9F6", border: "1px solid #E4E1DA", padding: "8px 12px", borderRadius: 7, margin: "6px 0" }}>
                      &ldquo;{cap.evidenceSnippet}&rdquo;
                    </div>

                    <div style={{ fontSize: 11, color: "#98A2B3", marginTop: 4 }}>
                      Provenance: {cap.source} • Verified: {cap.verifiedAt}
                    </div>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                    {cap.sourceUrl && (
                      <a
                        href={cap.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ padding: "6px 12px", borderRadius: 7, background: "#FAF9F6", border: "1px solid #E4E1DA", color: "#162A43", fontSize: 11, fontWeight: 600, textDecoration: "none" }}
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
        <div style={{ padding: "24px", borderRadius: 10, background: "#FFFFFF", border: "1px solid #E4E1DA" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: "#162A43", margin: 0 }}>
                Active Scoped Consent Grants ({activeGrants.length})
              </h2>
              <p style={{ fontSize: 12, color: "#667085", margin: "4px 0 0" }}>
                Employers with authorized access to your capability evidence. Revoke access at any time.
              </p>
            </div>
          </div>

          {activeGrants.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "#667085", fontSize: 13, background: "#FAF9F6", borderRadius: 8, border: "1px solid #E4E1DA" }}>
              No active employer consent grants. When you apply to a role, a scoped grant is created automatically.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {activeGrants.map(grant => (
                <div
                  key={grant.id}
                  style={{
                    padding: "12px 18px",
                    borderRadius: 8,
                    background: "#FAF9F6",
                    border: "1px solid #E4E1DA",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 12
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <strong style={{ fontSize: 13, color: "#162A43" }}>{grant.granteeOrgName}</strong>
                      {grant.isAnonymous && (
                        <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#EAF4EE", color: "#2E7D5B", border: "1px solid #C8E4D3", fontWeight: 700 }}>
                          ANONYMOUS
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>
                      Scopes: {grant.scopes.join(", ")} • Expires: {grant.expiresAt ? new Date(grant.expiresAt).toLocaleDateString() : "30 days"}
                    </div>
                  </div>

                  <button
                    onClick={() => handleRevokeGrant(grant.id)}
                    style={{ padding: "6px 12px", borderRadius: 7, background: "#FDF2F2", border: "1px solid #F8C8C8", color: "#C24141", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
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
          <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(22, 42, 67, 0.45)", backdropFilter: "blur(6px)", padding: 20 }}>
            <div style={{ width: "100%", maxWidth: 480, background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 12, padding: "24px 28px", boxShadow: "0 20px 40px rgba(22, 42, 67, 0.15)" }}>
              <h2 style={{ fontSize: 17, fontWeight: 600, color: "#162A43", margin: "0 0 4px" }}>Grant Scoped Access</h2>
              <p style={{ fontSize: 12, color: "#667085", margin: "0 0 18px" }}>Authorize an organization to inspect your verified capabilities.</p>

              <form onSubmit={handleCreateGrant}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#667085", display: "block", marginBottom: 6, textTransform: "uppercase" }}>ORGANIZATION NAME</label>
                  <input
                    type="text"
                    value={granteeOrg}
                    onChange={e => setGranteeOrg(e.target.value)}
                    placeholder="e.g. Stripe, Acme Corp"
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 7, background: "#FAF9F6", border: "1px solid #E4E1DA", color: "#17191C", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#667085", display: "block", marginBottom: 6, textTransform: "uppercase" }}>DURATION</label>
                    <select
                      value={grantDuration}
                      onChange={e => setGrantDuration(parseInt(e.target.value))}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: 7, background: "#FAF9F6", border: "1px solid #E4E1DA", color: "#17191C", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                    >
                      <option value={7}>7 Days</option>
                      <option value={30}>30 Days</option>
                      <option value={90}>90 Days</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#667085", display: "block", marginBottom: 6, textTransform: "uppercase" }}>BLIND REVIEW</label>
                    <button
                      type="button"
                      onClick={() => setIsAnonGrant(!isAnonGrant)}
                      style={{
                        width: "100%",
                        padding: "8px 12px",
                        borderRadius: 7,
                        background: isAnonGrant ? "#EAF4EE" : "#FAF9F6",
                        border: `1px solid ${isAnonGrant ? "#C8E4D3" : "#E4E1DA"}`,
                        color: isAnonGrant ? "#2E7D5B" : "#667085",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: "pointer",
                        boxSizing: "border-box"
                      }}
                    >
                      {isAnonGrant ? "✓ Anonymous" : "Include Identity"}
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowGrantModal(false)}
                    style={{ padding: "8px 14px", borderRadius: 7, background: "#FAF9F6", border: "1px solid #E4E1DA", color: "#667085", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={grantSaving || !granteeOrg.trim()}
                    style={{ padding: "8px 18px", borderRadius: 7, background: "#356AE6", border: "none", color: "#FFFFFF", fontSize: 12, fontWeight: 600, cursor: grantSaving ? "not-allowed" : "pointer" }}
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
