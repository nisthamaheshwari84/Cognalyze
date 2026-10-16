"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  getStudentIntelligenceProfile,
  getCapabilityWhy,
  StudentDNAProfile,
  CapabilityWhyExplanation,
  EpistemicStatus
} from "@/lib/intelligence/student-intelligence";
import {
  ClaimVerificationRecord,
  ClaimVerificationDossier,
  SourceStatusItem,
  ConcreteDiscrepancyItem,
  ClaimVerificationOutcome,
  ClaimCategory
} from "@/lib/evidence/claim-verification-engine";
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  FileText,
  Code2,
  Globe,
  Award,
  Layers,
  ArrowRight,
  Database,
  Search
} from "lucide-react";

interface EvidenceNode {
  id: string;
  label: string;
  type: "skill" | "project" | "github" | "interview" | "assessment" | "claim";
  status: EpistemicStatus;
  coverage: "High" | "Medium" | "Low";
  verified: boolean;
  connections: string[];
  details: string;
  provenance: string;
  date: string;
}

export default function EvidenceHubPage() {
  const [candidateId, setCandidateId] = useState<string>("");
  const [intelligence, setIntelligence] = useState<StudentDNAProfile | null>(null);
  const [dossier, setDossier] = useState<ClaimVerificationDossier | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // Tabs: claims | matrix | discrepancies | audit | graph
  const [activeTab, setActiveTab] = useState<"claims" | "matrix" | "discrepancies" | "audit" | "graph">("claims");

  // Filters for Claims
  const [selectedOutcomeFilter, setSelectedOutcomeFilter] = useState<string>("ALL");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");
  const [claimSearchQuery, setClaimSearchQuery] = useState<string>("");

  // Modals / Detail Drawers
  const [selectedClaim, setSelectedClaim] = useState<ClaimVerificationRecord | null>(null);
  const [whyModalData, setWhyModalData] = useState<CapabilityWhyExplanation | null>(null);
  const [selectedNode, setSelectedNode] = useState<EvidenceNode | null>(null);

  // Graph nodes
  const [evidenceNodes, setEvidenceNodes] = useState<EvidenceNode[]>([]);

  async function loadData(refresh: boolean = false) {
    if (refresh) setRefreshing(true);
    else setLoading(true);

    try {
      const sessRes = await fetch("/api/auth/session");
      const sess = await sessRes.json();
      if (!sess.authenticated || !sess.user?.id) {
        setCandidateId("");
        setIntelligence(null);
        setDossier(null);
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const cId = sess.user.id;
      setCandidateId(cId);

      // Fetch Evidence API which returns full ClaimVerificationDossier and isolated intelligence
      const evRes = await fetch(`/api/student/evidence?candidateId=${cId}${refresh ? "&refresh=true" : ""}`);
      if (evRes.ok) {
        const evData = await evRes.json();
        if (evData.dossier) {
          setDossier(evData.dossier);
        }
        if (evData.profile) {
          setIntelligence(evData.profile);
        }
      }

      // Also fetch DNA for legacy graph visualization compatibility
      const dnaRes = await fetch("/api/student/dna");
      if (dnaRes.ok) {
        const dnaData = await dnaRes.json();
        if (dnaData.dna) {
          const dynamicNodes: EvidenceNode[] = [];
          (dnaData.dna.projects || []).forEach((p: any, idx: number) => {
            dynamicNodes.push({
              id: `node-proj-${idx}`,
              label: p.title || `Project ${idx + 1}`,
              type: "project",
              status: p.github_verified ? "Verified" : "Demonstrated",
              coverage: "High",
              verified: !!p.github_verified,
              connections: [],
              details: p.description || `Built with ${(p.tech_stack || []).join(", ")}.`,
              provenance: p.github_url || "Student Project Portfolio",
              date: "Recorded"
            });
          });

          (dnaData.dna.skills || []).forEach((s: any, idx: number) => {
            dynamicNodes.push({
              id: `node-skill-${idx}`,
              label: s.name,
              type: "skill",
              status: s.evidence ? "Demonstrated" : "Developing",
              coverage: s.evidence ? "High" : "Medium",
              verified: !!s.verified_on_github,
              connections: [],
              details: s.evidence || `Skill declared at ${s.level} proficiency. Project implementation pending.`,
              provenance: s.verified_on_github ? "GitHub Activity Sync" : "Student Profile",
              date: "Declared"
            });
          });

          if (dnaData.dna.github_enrichment?.username) {
            dynamicNodes.push({
              id: "node-gh",
              label: `GitHub: ${dnaData.dna.github_enrichment.username}`,
              type: "github",
              status: "Verified",
              coverage: "High",
              verified: true,
              connections: [],
              details: `${dnaData.dna.github_enrichment.repoCount || 0} public repositories. Top languages: ${(dnaData.dna.github_enrichment.topLanguages || []).join(", ")}`,
              provenance: "GitHub API Sync v3",
              date: "Real-time sync"
            });
          }

          setEvidenceNodes(dynamicNodes);
        }
      }
    } catch (err) {
      console.error("Failed to load evidence vault data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const getOutcomeBadge = (outcome: ClaimVerificationOutcome) => {
    switch (outcome) {
      case "SUPPORTED":
        return { label: "Supported", color: "#2E7D5B", bg: "#EAF4EE", border: "#C8E4D3", icon: CheckCircle2 };
      case "PARTIALLY_SUPPORTED":
        return { label: "Partially Supported", color: "#B7791F", bg: "#FEF7ED", border: "#F8D8A7", icon: AlertTriangle };
      case "CONFLICTING":
        return { label: "Conflicting Evidence", color: "#C24141", bg: "#FDF2F2", border: "#F8C8C8", icon: XCircle };
      case "NOT_FOUND":
        return { label: "Not Found in Source", color: "#D97706", bg: "#FFFBEB", border: "#FDE68A", icon: AlertTriangle };
      case "NOT_INSPECTED":
        return { label: "Not Inspected", color: "#667085", bg: "#FAF9F6", border: "#E4E1DA", icon: HelpCircle };
      case "SOURCE_UNAVAILABLE":
        return { label: "Source Unavailable", color: "#C24141", bg: "#FDF2F2", border: "#F8C8C8", icon: XCircle };
      default:
        return { label: "Pending", color: "#98A2B3", bg: "#FAF9F6", border: "#E4E1DA", icon: HelpCircle };
    }
  };

  const getStatusBadge = (status: EpistemicStatus) => {
    switch (status) {
      case "Verified":
        return { label: "Verified", color: "#2E7D5B", bg: "#EAF4EE", border: "#C8E4D3" };
      case "Strong":
      case "Demonstrated":
        return { label: "Demonstrated", color: "#356AE6", bg: "#EFF4FE", border: "#D2E0FB" };
      case "Developing":
        return { label: "Developing", color: "#B7791F", bg: "#FEF7ED", border: "#F8D8A7" };
      case "Claimed":
        return { label: "Claimed", color: "#667085", bg: "#FAF9F6", border: "#E4E1DA" };
      case "Contradicted":
      case "Gap":
        return { label: "Gap / Contradicted", color: "#C24141", bg: "#FDF2F2", border: "#F8C8C8" };
      default:
        return { label: "Insufficient Evidence", color: "#98A2B3", bg: "#FAF9F6", border: "#E4E1DA" };
    }
  };

  const filteredClaims = (dossier?.claims || []).filter(c => {
    if (selectedOutcomeFilter !== "ALL" && c.verificationResult !== selectedOutcomeFilter) return false;
    if (selectedCategoryFilter !== "ALL" && c.claimCategory !== selectedCategoryFilter) return false;
    if (claimSearchQuery.trim()) {
      const q = claimSearchQuery.toLowerCase();
      return (
        c.claimText.toLowerCase().includes(q) ||
        (c.resumeSection && c.resumeSection.toLowerCase().includes(q)) ||
        (c.relevantProjectTitle && c.relevantProjectTitle.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1", color: "#17191C", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="student" />

      {/* HEADER SECTION */}
      <div style={{ borderBottom: "1px solid #E4E1DA", background: "#FFFFFF" }}>
        <div style={{ maxWidth: 1240, margin: "0 auto", padding: "1.5rem 2rem 1.25rem" }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 10, letterSpacing: 1, color: "#356AE6", fontWeight: 700, textTransform: "uppercase" }}>
                  EVIDENCE-FIRST CAREER VAULT
                </span>
                <span style={{ fontSize: 11, padding: "2px 8px", background: "#EAF4EE", color: "#2E7D5B", borderRadius: 5, border: "1px solid #C8E4D3", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  <ShieldCheck size={13} /> Multi-Source Claim Verification Active
                </span>
                {dossier?.auditHash && (
                  <span style={{ fontSize: 10, fontFamily: "monospace", padding: "2px 8px", background: "#FAF9F6", color: "#667085", borderRadius: 5, border: "1px solid #E4E1DA" }}>
                    SHA-256: {dossier.auditHash}
                  </span>
                )}
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.3px", margin: 0, color: "#162A43" }}>
                Evidence Vault & Cross-Source Verification
              </h1>
              <p style={{ color: "#667085", fontSize: 13, marginTop: 4, margin: 0, maxWidth: 740 }}>
                Every student claim is independently compared against inspected GitHub source code, live deployments, LinkedIn credentials, LeetCode data, and standardized assessments.
              </p>
            </div>

            {/* ACTION & TAB SELECTOR */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <button
                onClick={() => loadData(true)}
                disabled={refreshing}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 14px",
                  borderRadius: 7,
                  border: "1px solid #D2E0FB",
                  background: refreshing ? "#EFF4FE" : "#FFFFFF",
                  color: "#356AE6",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: refreshing ? "not-allowed" : "pointer",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
                }}
              >
                <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
                {refreshing ? "Re-verifying..." : "Refresh Evidence"}
              </button>

              <div style={{ display: "flex", background: "#FAF9F6", padding: 3, borderRadius: 8, border: "1px solid #E4E1DA", gap: 3 }}>
                {[
                  { id: "claims", label: "Claim Vault" },
                  { id: "matrix", label: "Source Matrix" },
                  { id: "discrepancies", label: `Discrepancies (${dossier?.discrepancies.length ?? 0})` },
                  { id: "audit", label: "Audit Trail" },
                  { id: "graph", label: "Graph View" }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 6,
                      border: activeTab === t.id ? "1px solid #E4E1DA" : "1px solid transparent",
                      background: activeTab === t.id ? "#FFFFFF" : "transparent",
                      color: activeTab === t.id ? "#162A43" : "#667085",
                      fontSize: 12,
                      fontWeight: activeTab === t.id ? 600 : 500,
                      cursor: "pointer",
                      boxShadow: activeTab === t.id ? "0 1px 3px rgba(0,0,0,0.05)" : "none",
                      transition: "all 0.15s ease"
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* EVIDENCE COVERAGE COUNTERS GRID (PHASE 12A) */}
          {dossier && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10, marginTop: 18, paddingTop: 14, borderTop: "1px solid #E4E1DA" }}>
              <div style={{ background: "#FAF9F6", padding: "8px 12px", borderRadius: 8, border: "1px solid #E4E1DA" }}>
                <div style={{ fontSize: 10, color: "#667085", fontWeight: 600, textTransform: "uppercase" }}>Resume Claims</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#162A43", marginTop: 2 }}>{dossier.coverage.resumeClaimsExtracted}</div>
              </div>
              <div style={{ background: "#FAF9F6", padding: "8px 12px", borderRadius: 8, border: "1px solid #E4E1DA" }}>
                <div style={{ fontSize: 10, color: "#667085", fontWeight: 600, textTransform: "uppercase" }}>Repos Inspected</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#162A43", marginTop: 2 }}>{dossier.coverage.repositoriesInspected}</div>
              </div>
              <div style={{ background: "#FAF9F6", padding: "8px 12px", borderRadius: 8, border: "1px solid #E4E1DA" }}>
                <div style={{ fontSize: 10, color: "#667085", fontWeight: 600, textTransform: "uppercase" }}>Deployments</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#162A43", marginTop: 2 }}>{dossier.coverage.deploymentsInspected}</div>
              </div>
              <div style={{ background: "#FAF9F6", padding: "8px 12px", borderRadius: 8, border: "1px solid #E4E1DA" }}>
                <div style={{ fontSize: 10, color: "#667085", fontWeight: 600, textTransform: "uppercase" }}>Certifications</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#162A43", marginTop: 2 }}>{dossier.coverage.certificationsRetrieved}</div>
              </div>
              <div style={{ background: "#FAF9F6", padding: "8px 12px", borderRadius: 8, border: "1px solid #E4E1DA" }}>
                <div style={{ fontSize: 10, color: "#667085", fontWeight: 600, textTransform: "uppercase" }}>Assessments</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#162A43", marginTop: 2 }}>{dossier.coverage.assessmentsCompleted}</div>
              </div>
              <div style={{ background: "#EAF4EE", padding: "8px 12px", borderRadius: 8, border: "1px solid #C8E4D3" }}>
                <div style={{ fontSize: 10, color: "#2E7D5B", fontWeight: 700, textTransform: "uppercase" }}>Supported</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#2E7D5B", marginTop: 2 }}>{dossier.coverage.claimsSupported}</div>
              </div>
              <div style={{ background: "#FEF7ED", padding: "8px 12px", borderRadius: 8, border: "1px solid #F8D8A7" }}>
                <div style={{ fontSize: 10, color: "#B7791F", fontWeight: 700, textTransform: "uppercase" }}>Partial</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#B7791F", marginTop: 2 }}>{dossier.coverage.claimsPartiallySupported}</div>
              </div>
              <div style={{ background: "#FDF2F2", padding: "8px 12px", borderRadius: 8, border: "1px solid #F8C8C8" }}>
                <div style={{ fontSize: 10, color: "#C24141", fontWeight: 700, textTransform: "uppercase" }}>Conflicts</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#C24141", marginTop: 2 }}>{dossier.coverage.claimsWithConflicts}</div>
              </div>
              <div style={{ background: "#FAF9F6", padding: "8px 12px", borderRadius: 8, border: "1px solid #E4E1DA" }}>
                <div style={{ fontSize: 10, color: "#667085", fontWeight: 700, textTransform: "uppercase" }}>Awaiting</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#667085", marginTop: 2 }}>{dossier.coverage.claimsAwaitingInspection}</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MAIN CONTAINER */}
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "2rem" }}>

        {/* ══════════════════════════════════════════════════════════════
            TAB 1: CLAIM VERIFICATION VAULT (PHASE 12C & 12F)
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === "claims" && (
          <div>
            {/* FILTER & SEARCH TOOLBAR */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                {/* Search Bar */}
                <div style={{ position: "relative", minWidth: 260, flex: 1, maxWidth: 400 }}>
                  <Search size={14} style={{ position: "absolute", left: 10, top: 10, color: "#98A2B3" }} />
                  <input
                    type="text"
                    value={claimSearchQuery}
                    onChange={(e) => setClaimSearchQuery(e.target.value)}
                    placeholder="Search claims, projects, or skills..."
                    style={{
                      width: "100%",
                      padding: "6px 12px 6px 32px",
                      fontSize: 12,
                      borderRadius: 7,
                      border: "1px solid #E4E1DA",
                      background: "#FFFFFF",
                      outline: "none"
                    }}
                  />
                </div>

                {/* Category Filters */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, color: "#667085", fontWeight: 700, textTransform: "uppercase" }}>CATEGORY:</span>
                  {["ALL", "technical_skill", "project", "experience", "education", "certification"].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategoryFilter(cat)}
                      style={{
                        padding: "4px 10px",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: selectedCategoryFilter === cat ? 600 : 500,
                        cursor: "pointer",
                        textTransform: "capitalize",
                        border: selectedCategoryFilter === cat ? "1px solid #356AE6" : "1px solid #E4E1DA",
                        background: selectedCategoryFilter === cat ? "#EFF4FE" : "#FFFFFF",
                        color: selectedCategoryFilter === cat ? "#356AE6" : "#667085"
                      }}
                    >
                      {cat.replace(/_/g, " ")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Outcome Filters */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 11, color: "#667085", fontWeight: 700, textTransform: "uppercase" }}>OUTCOME:</span>
                {[
                  { id: "ALL", label: "All Claims" },
                  { id: "SUPPORTED", label: "Supported" },
                  { id: "PARTIALLY_SUPPORTED", label: "Partially Supported" },
                  { id: "CONFLICTING", label: "Conflicting" },
                  { id: "NOT_FOUND", label: "Not Found in Source" },
                  { id: "NOT_INSPECTED", label: "Not Inspected" },
                  { id: "SOURCE_UNAVAILABLE", label: "Source Unavailable" }
                ].map(out => (
                  <button
                    key={out.id}
                    onClick={() => setSelectedOutcomeFilter(out.id)}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: selectedOutcomeFilter === out.id ? 600 : 500,
                      cursor: "pointer",
                      border: selectedOutcomeFilter === out.id ? "1px solid #162A43" : "1px solid #E4E1DA",
                      background: selectedOutcomeFilter === out.id ? "#162A43" : "#FFFFFF",
                      color: selectedOutcomeFilter === out.id ? "#FFFFFF" : "#667085"
                    }}
                  >
                    {out.label}
                  </button>
                ))}
              </div>
            </div>

            {/* CLAIMS LIST */}
            {filteredClaims.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center", background: "#FFFFFF", borderRadius: 10, border: "1px solid #E4E1DA" }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#162A43", marginBottom: 6 }}>No claims matching filter criteria</div>
                <p style={{ fontSize: 13, color: "#667085", maxWidth: 440, margin: "0 auto 16px" }}>
                  Adjust your search or filter tags above to inspect recorded candidate claims.
                </p>
                <button
                  onClick={() => { setSelectedOutcomeFilter("ALL"); setSelectedCategoryFilter("ALL"); setClaimSearchQuery(""); }}
                  style={{ padding: "6px 16px", borderRadius: 6, background: "#FAF9F6", border: "1px solid #E4E1DA", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {filteredClaims.map((claim) => {
                  const badge = getOutcomeBadge(claim.verificationResult);
                  const Icon = badge.icon;
                  return (
                    <div
                      key={claim.claimId}
                      style={{
                        background: "#FFFFFF",
                        border: "1px solid #E4E1DA",
                        borderRadius: 10,
                        padding: "18px 22px",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.02)"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 8, flexWrap: "wrap" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                            <span style={{ fontSize: 10, color: "#356AE6", fontWeight: 700, textTransform: "uppercase", background: "#EFF4FE", padding: "1px 6px", borderRadius: 4 }}>
                              {claim.claimCategory.replace(/_/g, " ")}
                            </span>
                            <span style={{ fontSize: 11, color: "#98A2B3" }}>
                              Source: {claim.originalSource} {claim.resumeSection ? `• Section: ${claim.resumeSection}` : ""}
                            </span>
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 600, color: "#162A43" }}>
                            "{claim.claimText}"
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: badge.color,
                            background: badge.bg,
                            border: `1px solid ${badge.border}`,
                            padding: "3px 9px",
                            borderRadius: 5,
                            display: "flex",
                            alignItems: "center",
                            gap: 5
                          }}
                        >
                          <Icon size={13} />
                          {badge.label}
                        </span>
                      </div>

                      {/* Snippet / Observation */}
                      <div style={{ background: "#FAF9F6", padding: "10px 14px", borderRadius: 7, border: "1px solid #E4E1DA", fontSize: 12, color: "#475467", lineHeight: 1.5, margin: "10px 0" }}>
                        <strong style={{ color: "#162A43" }}>Verification Procedure:</strong> {claim.verificationProcedure}
                        {claim.supportingEvidence.length > 0 && (
                          <div style={{ marginTop: 6, color: "#2E7D5B" }}>
                            <strong>✓ Observable Proof:</strong> {claim.supportingEvidence[0].excerpt}
                          </div>
                        )}
                        {claim.conflictingEvidence.length > 0 && (
                          <div style={{ marginTop: 6, color: "#C24141" }}>
                            <strong>⚠️ Evidence Gap / Conflict:</strong> {claim.conflictingEvidence[0].claimDiff}
                          </div>
                        )}
                      </div>

                      {/* Footer Tags & Detail Action */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #F2F1EE", paddingTop: 10, flexWrap: "wrap", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: "#667085" }}>
                          <span>Inspected: <strong>{claim.sourcesInspected.join(", ") || "None"}</strong></span>
                          <span>•</span>
                          <span>Supporting Artifacts: <strong style={{ color: "#2E7D5B" }}>{claim.supportingEvidence.length}</strong></span>
                          {claim.conflictingEvidence.length > 0 && (
                            <>
                              <span>•</span>
                              <span>Conflicts: <strong style={{ color: "#C24141" }}>{claim.conflictingEvidence.length}</strong></span>
                            </>
                          )}
                        </div>

                        <button
                          onClick={() => setSelectedClaim(claim)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            padding: "4px 12px",
                            borderRadius: 6,
                            border: "1px solid #D2E0FB",
                            background: "#EFF4FE",
                            color: "#356AE6",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          Inspect Full Proof & Artifacts <ArrowRight size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 2: SOURCE STATUS MATRIX (PHASE 12B)
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === "matrix" && dossier && (
          <div>
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "20px 24px", marginBottom: 18 }}>
              <div style={{ fontSize: 10, letterSpacing: 1, color: "#356AE6", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
                MULTI-SOURCE TRACEABILITY
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 6px", color: "#162A43" }}>
                Source Connection & Retrieval Status Matrix
              </h2>
              <p style={{ color: "#667085", fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                Every data source is independently tracked. If a platform is disconnected or restricted, it is recorded truthfully rather than fabricated.
              </p>
            </div>

            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#FAF9F6", borderBottom: "1px solid #E4E1DA", textAlign: "left", color: "#667085", fontWeight: 600 }}>
                    <th style={{ padding: "12px 16px" }}>SOURCE NAME</th>
                    <th style={{ padding: "12px 16px" }}>CONNECTION</th>
                    <th style={{ padding: "12px 16px" }}>RETRIEVAL</th>
                    <th style={{ padding: "12px 16px" }}>INSPECTION</th>
                    <th style={{ padding: "12px 16px" }}>RECORDS INSPECTED</th>
                    <th style={{ padding: "12px 16px" }}>LAST RETRIEVAL</th>
                    <th style={{ padding: "12px 16px" }}>KNOWN LIMITATIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {dossier.sourceMatrix.map((src) => {
                    return (
                      <tr key={src.sourceKey} style={{ borderBottom: "1px solid #F2F1EE" }}>
                        <td style={{ padding: "14px 16px", fontWeight: 600, color: "#162A43" }}>
                          {src.displayName}
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "2px 7px",
                              borderRadius: 4,
                              background: src.connectionStatus === "CONNECTED" ? "#EAF4EE" : "#FAF9F6",
                              color: src.connectionStatus === "CONNECTED" ? "#2E7D5B" : "#667085",
                              border: `1px solid ${src.connectionStatus === "CONNECTED" ? "#C8E4D3" : "#E4E1DA"}`
                            }}
                          >
                            {src.connectionStatus}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "2px 7px",
                              borderRadius: 4,
                              background: src.retrievalStatus === "SUCCESS" ? "#EAF4EE" : src.retrievalStatus === "RESTRICTED" ? "#FEF7ED" : "#FAF9F6",
                              color: src.retrievalStatus === "SUCCESS" ? "#2E7D5B" : src.retrievalStatus === "RESTRICTED" ? "#B7791F" : "#667085",
                              border: `1px solid ${src.retrievalStatus === "SUCCESS" ? "#C8E4D3" : "#E4E1DA"}`
                            }}
                          >
                            {src.retrievalStatus}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px" }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: "2px 7px",
                              borderRadius: 4,
                              background: src.inspectionStatus === "INSPECTED" ? "#EFF4FE" : "#FAF9F6",
                              color: src.inspectionStatus === "INSPECTED" ? "#356AE6" : "#667085",
                              border: `1px solid ${src.inspectionStatus === "INSPECTED" ? "#D2E0FB" : "#E4E1DA"}`
                            }}
                          >
                            {src.inspectionStatus}
                          </span>
                        </td>
                        <td style={{ padding: "14px 16px", fontWeight: 600, color: "#162A43" }}>
                          {src.recordsInspectedCount} records
                        </td>
                        <td style={{ padding: "14px 16px", color: "#667085" }}>
                          {src.lastRetrievalTimestamp ? new Date(src.lastRetrievalTimestamp).toLocaleTimeString() : "Never"}
                        </td>
                        <td style={{ padding: "14px 16px", color: "#667085", maxWidth: 280 }}>
                          {src.knownLimitations.join("; ") || "None"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 3: DISCREPANCY AUDITOR (PHASE 12E & PHASE 9)
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === "discrepancies" && dossier && (
          <div>
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "20px 24px", marginBottom: 18 }}>
              <div style={{ fontSize: 10, letterSpacing: 1, color: "#C24141", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
                OBJECTIVE ANOMALY DETECTION
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 6px", color: "#162A43" }}>
                Concrete Discrepancy Findings ({dossier.discrepancies.length})
              </h2>
              <p style={{ color: "#667085", fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                Discrepancies represent evidence gaps, language mismatches, or date inconsistencies. They are factual observations intended to help you corroborate claims before recruiter screening.
              </p>
            </div>

            {dossier.discrepancies.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center", background: "#FFFFFF", borderRadius: 10, border: "1px solid #E4E1DA" }}>
                <CheckCircle2 size={32} style={{ color: "#2E7D5B", margin: "0 auto 10px" }} />
                <div style={{ fontSize: 16, fontWeight: 600, color: "#162A43", marginBottom: 6 }}>No discrepancies detected</div>
                <p style={{ fontSize: 13, color: "#667085", maxWidth: 440, margin: "0 auto" }}>
                  All inspected claims are fully aligned across your resume, repositories, and connected profiles.
                </p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {dossier.discrepancies.map((disc) => (
                  <div
                    key={disc.id}
                    style={{
                      background: "#FFFFFF",
                      border: "1px solid #E4E1DA",
                      borderRadius: 10,
                      padding: "18px 22px"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                      <div>
                        <span style={{ fontSize: 10, letterSpacing: 0.5, color: disc.severity === "CRITICAL_GAP" ? "#C24141" : "#B7791F", fontWeight: 700, textTransform: "uppercase" }}>
                          {disc.discrepancyType.replace(/_/g, " ")}
                        </span>
                        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#162A43", margin: "2px 0 0" }}>
                          {disc.title}
                        </h3>
                      </div>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 4,
                          background: disc.severity === "CRITICAL_GAP" ? "#FDF2F2" : "#FEF7ED",
                          color: disc.severity === "CRITICAL_GAP" ? "#C24141" : "#B7791F",
                          border: `1px solid ${disc.severity === "CRITICAL_GAP" ? "#F8C8C8" : "#F8D8A7"}`
                        }}
                      >
                        {disc.severity.replace(/_/g, " ")}
                      </span>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, background: "#FAF9F6", padding: 12, borderRadius: 8, border: "1px solid #E4E1DA", margin: "12px 0" }}>
                      <div>
                        <div style={{ fontSize: 10, color: "#667085", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
                          {disc.claimSource.name}
                        </div>
                        <div style={{ fontSize: 12, color: "#162A43", lineHeight: 1.4 }}>
                          "{disc.claimSource.statement}"
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: "#667085", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
                          {disc.evidenceSource.name}
                        </div>
                        <div style={{ fontSize: 12, color: "#162A43", lineHeight: 1.4 }}>
                          {disc.evidenceSource.observation}
                        </div>
                      </div>
                    </div>

                    <div style={{ fontSize: 12.5, color: "#475467", lineHeight: 1.5, marginBottom: 10 }}>
                      <strong style={{ color: "#162A43" }}>Neutral Explanation:</strong> {disc.neutralExplanation}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #F2F1EE", paddingTop: 10 }}>
                      <span style={{ fontSize: 11, color: "#356AE6", fontWeight: 600 }}>
                        💡 Recommended Next Step: {disc.recommendedAction}
                      </span>
                      {disc.claimId && (
                        <button
                          onClick={() => {
                            const found = dossier.claims.find(c => c.claimId === disc.claimId);
                            if (found) setSelectedClaim(found);
                          }}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 6,
                            border: "1px solid #D2E0FB",
                            background: "#EFF4FE",
                            color: "#356AE6",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          View Related Claim ↗
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 4: AUDIT TRAIL & DETERMINISTIC HASH (PHASE 14)
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === "audit" && dossier && (
          <div>
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "20px 24px", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: 1, color: "#356AE6", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
                    CRYPTOGRAPHIC PROVENANCE LOG
                  </div>
                  <h2 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 6px", color: "#162A43" }}>
                    Deterministic Verification Audit Trail
                  </h2>
                  <p style={{ color: "#667085", fontSize: 13, lineHeight: 1.5, margin: 0 }}>
                    Every verification procedure creates an immutable audit record. The hash below is deterministically derived from canonical event states.
                  </p>
                </div>
                <div style={{ background: "#EFF4FE", border: "1px solid #D2E0FB", borderRadius: 8, padding: "8px 14px", textAlign: "right" }}>
                  <div style={{ fontSize: 10, color: "#356AE6", fontWeight: 700, textTransform: "uppercase" }}>AUTHENTIC AUDIT HASH</div>
                  <div style={{ fontSize: 14, fontFamily: "monospace", fontWeight: 700, color: "#162A43", marginTop: 2 }}>{dossier.auditHash}</div>
                </div>
              </div>
            </div>

            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, overflow: "hidden" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                  <tr style={{ background: "#FAF9F6", borderBottom: "1px solid #E4E1DA", textAlign: "left", color: "#667085", fontWeight: 600 }}>
                    <th style={{ padding: "12px 16px" }}>OPERATION ID</th>
                    <th style={{ padding: "12px 16px" }}>METHOD</th>
                    <th style={{ padding: "12px 16px" }}>SOURCES INSPECTED</th>
                    <th style={{ padding: "12px 16px" }}>RESULT</th>
                    <th style={{ padding: "12px 16px" }}>TIMESTAMP</th>
                  </tr>
                </thead>
                <tbody>
                  {dossier.auditTrail.map((entry) => (
                    <tr key={entry.operationId} style={{ borderBottom: "1px solid #F2F1EE" }}>
                      <td style={{ padding: "12px 16px", fontFamily: "monospace", color: "#667085" }}>
                        {entry.operationId.slice(0, 22)}...
                      </td>
                      <td style={{ padding: "12px 16px", color: "#162A43", fontWeight: 500, maxWidth: 260 }}>
                        {entry.verificationMethod}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#667085" }}>
                        {entry.sourcesInspected.join(", ")}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 4,
                            background: entry.result === "SUPPORTED" ? "#EAF4EE" : entry.result === "PARTIALLY_SUPPORTED" ? "#FEF7ED" : "#FAF9F6",
                            color: entry.result === "SUPPORTED" ? "#2E7D5B" : entry.result === "PARTIALLY_SUPPORTED" ? "#B7791F" : "#667085"
                          }}
                        >
                          {entry.result}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "#98A2B3" }}>
                        {new Date(entry.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 5: GRAPH VIEW (PRESERVED)
           ══════════════════════════════════════════════════════════════ */}
        {activeTab === "graph" && (
          <div>
            {evidenceNodes.length === 0 ? (
              <div style={{ padding: "48px 24px", textAlign: "center", background: "#FFFFFF", borderRadius: 10, border: "1px solid #E4E1DA" }}>
                <div style={{ fontSize: 16, fontWeight: 600, color: "#162A43", marginBottom: 6 }}>No evidence nodes recorded yet</div>
                <p style={{ fontSize: 13, color: "#667085", maxWidth: 440, margin: "0 auto 16px" }}>
                  Add your skills and projects in your profile to generate your connected evidence graph.
                </p>
                <Link href="/student/profile" style={{ display: "inline-block", padding: "8px 18px", borderRadius: 7, background: "#356AE6", color: "#FFFFFF", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                  + Add Skills & Projects
                </Link>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 14 }}>
                {evidenceNodes.map(node => {
                  const badge = getStatusBadge(node.status);
                  const isSelected = selectedNode?.id === node.id;
                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      style={{
                        background: isSelected ? "#EFF4FE" : "#FFFFFF",
                        border: `1px solid ${isSelected ? "#356AE6" : "#E4E1DA"}`,
                        borderRadius: 10,
                        padding: "16px 18px",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        boxShadow: isSelected ? "0 0 0 1px #356AE6" : "none"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 8 }}>
                        <div>
                          <span style={{ fontSize: 10, letterSpacing: 0.5, color: "#98A2B3", fontWeight: 700, textTransform: "uppercase" }}>
                            {node.type}
                          </span>
                          <div style={{ fontSize: 15, fontWeight: 600, color: "#162A43", marginTop: 2 }}>
                            {node.label}
                          </div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 600, color: badge.color, background: badge.bg, border: `1px solid ${badge.border}`, padding: "2px 7px", borderRadius: 4 }}>
                          {badge.label}
                        </span>
                      </div>

                      <p style={{ fontSize: 12, color: "#667085", lineHeight: 1.5, margin: "0 0 12px" }}>
                        {node.details}
                      </p>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid #E4E1DA", paddingTop: 10 }}>
                        <span style={{ fontSize: 11, color: "#98A2B3" }}>
                          Provenience: {node.provenance}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (intelligence) {
                              const why = getCapabilityWhy(intelligence, node.label);
                              setWhyModalData(why);
                            }
                          }}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 6,
                            border: "1px solid #D2E0FB",
                            background: "#EFF4FE",
                            color: "#356AE6",
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          Inspect "Why?" ↗
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          CLAIM DETAIL MODAL / DRAWER (PHASE 12D)
         ══════════════════════════════════════════════════════════════ */}
      {selectedClaim && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(22, 42, 67, 0.45)", backdropFilter: "blur(6px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
          <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 12, maxWidth: 700, width: "100%", padding: "24px 28px", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 20px 40px rgba(22, 42, 67, 0.15)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 10, letterSpacing: 1, color: "#356AE6", fontWeight: 700, textTransform: "uppercase" }}>
                  INSPECTABLE CLAIM AUDIT PROOF
                </span>
                <h2 style={{ fontSize: 18, fontWeight: 600, margin: "4px 0 0", color: "#162A43" }}>
                  "{selectedClaim.claimText}"
                </h2>
              </div>
              <button
                onClick={() => setSelectedClaim(null)}
                style={{ background: "#FAF9F6", border: "1px solid #E4E1DA", color: "#667085", width: 28, height: 28, borderRadius: 6, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                ✕
              </button>
            </div>

            {/* Status & Outcome Summary */}
            {(() => {
              const b = getOutcomeBadge(selectedClaim.verificationResult);
              return (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: b.color, background: b.bg, border: `1px solid ${b.border}`, padding: "3px 10px", borderRadius: 5 }}>
                    {b.label}
                  </span>
                  <span style={{ fontSize: 11, color: "#667085" }}>
                    Category: <strong>{selectedClaim.claimCategory.replace(/_/g, " ")}</strong>
                  </span>
                  {selectedClaim.resumePageOrLine && (
                    <span style={{ fontSize: 11, color: "#667085" }}>
                      • Location: <strong>{selectedClaim.resumePageOrLine}</strong>
                    </span>
                  )}
                </div>
              );
            })()}

            {/* 1. Original Resume Excerpt */}
            <div style={{ background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 8, padding: "12px 16px", marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: "#356AE6", fontWeight: 700, letterSpacing: 0.5, marginBottom: 4, textTransform: "uppercase" }}>
                1. ORIGINAL RESUME STATEMENT & LOCATION
              </div>
              <div style={{ fontSize: 13, color: "#162A43", fontStyle: "italic", lineHeight: 1.5 }}>
                "{selectedClaim.claimText}"
              </div>
              <div style={{ fontSize: 11, color: "#98A2B3", marginTop: 4 }}>
                Section: {selectedClaim.resumeSection || "General"} {selectedClaim.resumePageOrLine ? `(${selectedClaim.resumePageOrLine})` : ""}
              </div>
            </div>

            {/* 2. Inspected Artifacts & Repositories */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 8, padding: "12px 16px", marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: "#667085", fontWeight: 700, letterSpacing: 0.5, marginBottom: 6, textTransform: "uppercase" }}>
                2. INSPECTED SOURCE CODE & ARTIFACTS
              </div>
              <div style={{ fontSize: 12, color: "#475467", lineHeight: 1.5 }}>
                Sources Inspected: <strong>{selectedClaim.sourcesInspected.join(", ") || "None"}</strong>
              </div>
              {selectedClaim.relevantRepositoryUrl && (
                <div style={{ fontSize: 12, color: "#356AE6", marginTop: 4 }}>
                  <a href={selectedClaim.relevantRepositoryUrl} target="_blank" rel="noreferrer" style={{ color: "#356AE6", textDecoration: "none" }}>
                    🔗 Repository: {selectedClaim.relevantRepositoryUrl} ↗
                  </a>
                </div>
              )}
              {selectedClaim.relevantFilesInspected.length > 0 && (
                <div style={{ fontSize: 11, color: "#667085", marginTop: 6 }}>
                  Files Inspected ({selectedClaim.relevantFilesInspected.length}): {selectedClaim.relevantFilesInspected.slice(0, 5).join(", ")}
                </div>
              )}
            </div>

            {/* 3. Observable Proof vs Conflicts */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div style={{ background: "#EAF4EE", border: "1px solid #C8E4D3", borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 10, color: "#2E7D5B", fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>
                  ✓ SUPPORTING EVIDENCE ({selectedClaim.supportingEvidence.length})
                </div>
                {selectedClaim.supportingEvidence.length === 0 ? (
                  <div style={{ fontSize: 11, color: "#2E7D5B", fontStyle: "italic" }}>No supporting artifacts yet</div>
                ) : (
                  selectedClaim.supportingEvidence.map((s, i) => (
                    <div key={i} style={{ fontSize: 11, color: "#2E7D5B", marginBottom: 4 }}>
                      • <strong>{s.source}:</strong> {s.excerpt}
                    </div>
                  ))
                )}
              </div>

              <div style={{ background: "#FDF2F2", border: "1px solid #F8C8C8", borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 10, color: "#C24141", fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>
                  ⚠️ MISSING EVIDENCE / CONFLICTS
                </div>
                {selectedClaim.conflictingEvidence.length === 0 && selectedClaim.missingEvidence.length === 0 ? (
                  <div style={{ fontSize: 11, color: "#C24141", fontStyle: "italic" }}>No discrepancies or missing files</div>
                ) : (
                  <>
                    {selectedClaim.conflictingEvidence.map((c, i) => (
                      <div key={`c-${i}`} style={{ fontSize: 11, color: "#C24141", marginBottom: 4 }}>
                        • <strong>{c.source}:</strong> {c.claimDiff}
                      </div>
                    ))}
                    {selectedClaim.missingEvidence.map((m, i) => (
                      <div key={`m-${i}`} style={{ fontSize: 11, color: "#C24141", marginBottom: 4 }}>
                        • {m}
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* 4. Limitations & Procedure */}
            <div style={{ background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 8, padding: "12px 16px", marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: "#667085", fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>
                VERIFICATION PROCEDURE & CONFIDENCE RATIONALE
              </div>
              <div style={{ fontSize: 12, color: "#162A43", lineHeight: 1.5 }}>
                {selectedClaim.confidenceRationale}
              </div>
              {selectedClaim.knownLimitations.length > 0 && (
                <div style={{ fontSize: 11, color: "#98A2B3", marginTop: 6 }}>
                  Known Limitations: {selectedClaim.knownLimitations.join("; ")}
                </div>
              )}
            </div>

            {/* 5. Recommended Next Action */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#EFF4FE", border: "1px solid #D2E0FB", borderRadius: 8, padding: "12px 16px" }}>
              <div>
                <span style={{ fontSize: 10, color: "#356AE6", fontWeight: 700, textTransform: "uppercase" }}>ACTIONABLE IMPROVEMENT</span>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#162A43", marginTop: 2 }}>
                  {selectedClaim.suggestedNextAction}
                </div>
              </div>
              <Link
                href="/student/profile"
                style={{
                  padding: "6px 14px",
                  borderRadius: 7,
                  background: "#356AE6",
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: "none",
                  whiteSpace: "nowrap"
                }}
              >
                Update Artifacts →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* WHY MODAL DIAGNOSTIC (PRESERVED) */}
      {whyModalData && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(22, 42, 67, 0.45)", backdropFilter: "blur(6px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
          <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 12, maxWidth: 620, width: "100%", padding: "24px 28px", maxHeight: "85vh", overflowY: "auto", boxShadow: "0 20px 40px rgba(22, 42, 67, 0.15)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <span style={{ fontSize: 10, letterSpacing: 1, color: "#356AE6", fontWeight: 700, textTransform: "uppercase" }}>
                  CANONICAL DIAGNOSTIC TRACE
                </span>
                <h2 style={{ fontSize: 17, fontWeight: 600, margin: "4px 0 0", color: "#162A43" }}>
                  Why is {whyModalData.capability} marked as "{whyModalData.status}"?
                </h2>
              </div>
              <button
                onClick={() => setWhyModalData(null)}
                style={{ background: "#FAF9F6", border: "1px solid #E4E1DA", color: "#667085", width: 28, height: 28, borderRadius: 6, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: "#EFF4FE", border: "1px solid #D2E0FB", borderRadius: 8, padding: "12px 14px", marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: "#356AE6", fontWeight: 700, letterSpacing: 0.5, marginBottom: 4, textTransform: "uppercase" }}>
                ANALYSIS & REASONING
              </div>
              <p style={{ fontSize: 12.5, color: "#162A43", lineHeight: 1.5, margin: 0 }}>
                {whyModalData.reasoning}
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 8, padding: "12px 16px" }}>
              <div>
                <span style={{ fontSize: 10, color: "#356AE6", fontWeight: 700, textTransform: "uppercase" }}>RECOMMENDED NEXT ACTION</span>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#162A43", marginTop: 2 }}>
                  {whyModalData.recommendedNextAction}
                </div>
              </div>
              <button
                onClick={() => setWhyModalData(null)}
                style={{ padding: "6px 14px", borderRadius: 7, background: "#356AE6", color: "#FFFFFF", fontSize: 12, fontWeight: 600, border: "none", cursor: "pointer" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
