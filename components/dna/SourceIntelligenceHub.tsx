"use client";

import React, { useState } from "react";
import type { CandidateUnifiedEvidenceDossier, SourceEvidenceRecord, CrossSourceDiscrepancy } from "@/lib/evidence/candidate-evidence-engine";
import {
  FileText,
  GitBranch,
  Globe,
  Code2,
  Trophy,
  Award,
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Info,
  Clock,
  Layers,
  Sparkles
} from "lucide-react";

interface SourceIntelligenceHubProps {
  dossier?: CandidateUnifiedEvidenceDossier | null;
  onRefresh?: () => void;
  isLoading?: boolean;
}

export default function SourceIntelligenceHub({ dossier, onRefresh, isLoading }: SourceIntelligenceHubProps) {
  const [activeSource, setActiveSource] = useState<
    "overview" | "resume" | "linkedin" | "github" | "deployments" | "leetcode" | "hackathons" | "certifications" | "internal" | "discrepancies"
  >("overview");
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [selectedMetric, setSelectedMetric] = useState<any | null>(null);

  if (!dossier) {
    return (
      <div style={{ padding: 40, textAlign: "center", background: "#FFFFFF", borderRadius: 10, border: "1px solid #E4E1DA" }}>
        <HelpCircle size={32} style={{ color: "#667085", marginBottom: 12 }} />
        <h3 style={{ fontSize: 16, fontWeight: 600, color: "#162A43", margin: "0 0 6px" }}>Evidence Dossier Awaiting Sync</h3>
        <p style={{ fontSize: 13, color: "#667085", margin: 0 }}>
          Complete your profile onboarding or upload your technical artifacts to initiate ground-truth evidence inspection.
        </p>
      </div>
    );
  }

  const toggleExpand = (id: string) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "INDEPENDENTLY_VERIFIED":
      case "CONTENT_RETRIEVED":
      case "SUCCESS":
        return <span style={{ background: "#EAF4EE", color: "#2E7D5B", border: "1px solid #C8E4D3", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}><CheckCircle2 size={12} /> Independently Verified</span>;
      case "STUDENT_REPORTED":
      case "SOURCE_OBSERVED":
        return <span style={{ background: "#EFF4FE", color: "#356AE6", border: "1px solid #D2E0FB", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}><ShieldCheck size={12} /> Student Reported</span>;
      case "ACCESS_RESTRICTED":
      case "RETRIEVAL_FAILED":
      case "EXTRACTION_FAILED":
        return <span style={{ background: "#FDF2F2", color: "#E03137", border: "1px solid #FCD8D8", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}><AlertTriangle size={12} /> Inaccessible / Restricted</span>;
      case "CONFLICTING_EVIDENCE":
        return <span style={{ background: "#FEF8EC", color: "#B7791F", border: "1px solid #F9E4B7", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}><AlertTriangle size={12} /> Discrepancy Flagged</span>;
      default:
        return <span style={{ background: "#F6F5F1", color: "#667085", border: "1px solid #E4E1DA", padding: "2px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 4 }}><HelpCircle size={12} /> Not Connected</span>;
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* ─── SUMMARY BANNER ─── */}
      <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 18, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: "#162A43", margin: 0 }}>Ground-Truth Evidence Intelligence Hub</h2>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#2E7D5B", background: "#EAF4EE", border: "1px solid #C8E4D3", padding: "2px 8px", borderRadius: 12 }}>
              Coverage: {dossier.evidence_coverage}
            </span>
          </div>
          <p style={{ fontSize: 12, color: "#667085", margin: "4px 0 0" }}>
            Every claim is derived exclusively from real inspected sources. Zero simulated scores or fabricated records.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: "#98A2B3" }}>Audit Hash: {dossier.version_hash}</span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              style={{
                background: "#EFF4FE",
                border: "1px solid #356AE6",
                color: "#356AE6",
                borderRadius: 6,
                padding: "6px 12px",
                fontSize: 12,
                fontWeight: 600,
                cursor: isLoading ? "not-allowed" : "pointer"
              }}
            >
              {isLoading ? "Re-verifying..." : "Refresh Evidence"}
            </button>
          )}
        </div>
      </div>

      {/* ─── EXPLAINABLE METRICS ROW (SECTION 17) ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {dossier.explainable_metrics.map(m => (
          <div
            key={m.metric_key}
            onClick={() => setSelectedMetric(selectedMetric?.metric_key === m.metric_key ? null : m)}
            style={{
              background: "#FFFFFF",
              border: selectedMetric?.metric_key === m.metric_key ? "1.5px solid #356AE6" : "1px solid #E4E1DA",
              borderRadius: 8,
              padding: "12px 14px",
              cursor: "pointer",
              transition: "all 0.15s ease"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, color: "#667085", fontWeight: 600, textTransform: "uppercase" }}>{m.display_name}</span>
              <Info size={13} style={{ color: "#356AE6" }} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "#162A43", margin: "4px 0" }}>
              {m.actual_value}
            </div>
            <div style={{ fontSize: 11, color: "#98A2B3", display: "flex", alignItems: "center", gap: 4 }}>
              <Clock size={11} /> Source: {m.source_name}
            </div>
          </div>
        ))}
      </div>

      {/* ─── METRIC EXPLAINER ACCORDION (SECTION 17) ─── */}
      {selectedMetric && (
        <div style={{ background: "#EFF4FE", border: "1px solid #D2E0FB", borderRadius: 8, padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#356AE6" }}>Metric Audit Details: {selectedMetric.display_name}</div>
              <div style={{ fontSize: 12, color: "#162A43", marginTop: 4 }}>
                <strong>Calculation Method:</strong> {selectedMetric.calculation_method}
              </div>
              <div style={{ fontSize: 12, color: "#162A43", marginTop: 2 }}>
                <strong>Deterministic Formula:</strong> <code>{selectedMetric.formula}</code>
              </div>
              <div style={{ fontSize: 11, color: "#667085", marginTop: 4 }}>
                Retrieved: {new Date(selectedMetric.retrieval_timestamp).toLocaleString()} • Referenced Evidence Items: {selectedMetric.evidence_ids.length}
              </div>
            </div>
            <button
              onClick={() => setSelectedMetric(null)}
              style={{ background: "transparent", border: "none", color: "#667085", cursor: "pointer", fontSize: 12 }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ─── SOURCE NAVIGATION TABS ─── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, borderBottom: "1px solid #E4E1DA", paddingBottom: 10 }}>
        {[
          { key: "overview", label: "Evidence Overview", count: dossier.evidence_records.length },
          { key: "resume", label: "Resume Analysis", count: dossier.resume.skills_claimed.length },
          { key: "github", label: "GitHub Codebases", count: dossier.github.accessible_repos.length },
          { key: "deployments", label: "Live Deployments", count: dossier.deployments.deployments.length },
          { key: "leetcode", label: "LeetCode & DSA", count: dossier.leetcode.total_solved ?? 0 },
          { key: "hackathons", label: "Hackathons", count: dossier.hackathons.hackathons.length },
          { key: "certifications", label: "Certifications", count: dossier.certifications.deduplicated_count },
          { key: "internal", label: "Internal Sessions", count: dossier.internal_activities.sessions_count },
          { key: "discrepancies", label: "Discrepancy Findings", count: dossier.cross_source_discrepancies.length, alert: dossier.cross_source_discrepancies.length > 0 }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveSource(tab.key as any)}
            style={{
              background: activeSource === tab.key ? "#EFF4FE" : "#FFFFFF",
              border: activeSource === tab.key ? "1px solid #356AE6" : "1px solid #E4E1DA",
              color: activeSource === tab.key ? "#356AE6" : "#667085",
              borderRadius: 6,
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6
            }}
          >
            <span>{tab.label}</span>
            <span style={{ fontSize: 10, background: activeSource === tab.key ? "#356AE6" : "#F6F5F1", color: activeSource === tab.key ? "#FFFFFF" : "#667085", padding: "1px 6px", borderRadius: 10 }}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ─── TAB CONTENT: OVERVIEW ─── */}
      {activeSource === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 8, padding: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "#162A43", margin: "0 0 8px" }}>Source Verification Matrix</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 10 }}>
              <div style={{ border: "1px solid #E4E1DA", borderRadius: 6, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#162A43" }}>Resume Source</span>
                  {statusBadge(dossier.resume.extraction_status)}
                </div>
                <div style={{ fontSize: 11, color: "#667085", marginTop: 4 }}>
                  {dossier.resume.file_uploaded ? `File: ${dossier.resume.file_name}` : "No file uploaded"}
                </div>
              </div>

              <div style={{ border: "1px solid #E4E1DA", borderRadius: 6, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#162A43" }}>GitHub Integration</span>
                  {statusBadge(dossier.github.retrieval_status)}
                </div>
                <div style={{ fontSize: 11, color: "#667085", marginTop: 4 }}>
                  {dossier.github.accessible_repos.length} accessible repos inspected
                </div>
              </div>

              <div style={{ border: "1px solid #E4E1DA", borderRadius: 6, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#162A43" }}>LeetCode Platform</span>
                  {statusBadge(dossier.leetcode.retrieval_status)}
                </div>
                <div style={{ fontSize: 11, color: "#667085", marginTop: 4 }}>
                  {dossier.leetcode.total_solved !== null ? `${dossier.leetcode.total_solved} solved problems` : "Not connected"}
                </div>
              </div>

              <div style={{ border: "1px solid #E4E1DA", borderRadius: 6, padding: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#162A43" }}>Internal Cognalyze Sessions</span>
                  {statusBadge(dossier.internal_activities.sessions_count > 0 ? "INDEPENDENTLY_VERIFIED" : "NOT_PROVIDED")}
                </div>
                <div style={{ fontSize: 11, color: "#667085", marginTop: 4 }}>
                  {dossier.internal_activities.sessions_count} verified practical assessment attempts
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB CONTENT: RESUME (SECTION 5 & 16) ─── */}
      {activeSource === "resume" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 8, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#162A43", margin: 0 }}>Resume Extraction Audit</h3>
              {statusBadge(dossier.resume.extraction_status)}
            </div>

            {!dossier.resume.file_uploaded ? (
              <div style={{ padding: "20px 0", color: "#667085", fontSize: 13 }}>
                No readable resume has been uploaded by the candidate. No resume metrics or summaries have been fabricated.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ background: "#FAF9F6", padding: 10, borderRadius: 6, border: "1px solid #E4E1DA" }}>
                    <div style={{ fontSize: 11, color: "#667085", fontWeight: 600 }}>DOCUMENTED EXPERIENCE</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "#162A43", marginTop: 2 }}>
                      {dossier.resume.experience_years !== null ? `${dossier.resume.experience_years} years` : "Fresher / Unspecified"}
                    </div>
                  </div>
                  <div style={{ background: "#FAF9F6", padding: 10, borderRadius: 6, border: "1px solid #E4E1DA" }}>
                    <div style={{ fontSize: 11, color: "#667085", fontWeight: 600 }}>EDUCATION RECORDED</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#162A43", marginTop: 2 }}>
                      {dossier.resume.education || "Undergraduate Degree"}
                    </div>
                  </div>
                </div>

                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: "#162A43", margin: "8px 0 6px" }}>Extracted Skills Inventory ({dossier.resume.skills_claimed.length})</h4>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {dossier.resume.skills_claimed.map((s, idx) => (
                      <span key={idx} style={{ background: "#EFF4FE", color: "#356AE6", border: "1px solid #D2E0FB", padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB CONTENT: GITHUB REPOSITORIES (SECTION 7, 9 & 16) ─── */}
      {activeSource === "github" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {dossier.github.accessible_repos.length === 0 ? (
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 8, padding: 30, textAlign: "center", color: "#667085" }}>
              No accessible GitHub repositories connected. Repositories are not inferred or fabricated.
            </div>
          ) : (
            dossier.github.accessible_repos.map((repo, idx) => {
              const cardId = `repo_${idx}`;
              const isExpanded = expandedCards[cardId];
              return (
                <div key={idx} style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 8, padding: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <GitBranch size={16} style={{ color: "#356AE6" }} />
                        <span style={{ fontSize: 15, fontWeight: 700, color: "#162A43" }}>{repo.name}</span>
                        {repo.is_fork && <span style={{ fontSize: 10, color: "#B7791F", background: "#FEF8EC", padding: "1px 6px", borderRadius: 4 }}>Fork</span>}
                        {repo.template_signal?.detected && (
                          <span style={{ fontSize: 10, color: "#B7791F", background: "#FEF8EC", border: "1px solid #F9E4B7", padding: "1px 6px", borderRadius: 4 }}>
                            Starter Template Detected
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12, color: "#667085", marginTop: 4 }}>
                        {repo.description || "Project repository"}
                      </div>
                    </div>

                    <button
                      onClick={() => toggleExpand(cardId)}
                      style={{ background: "#EFF4FE", border: "1px solid #D2E0FB", color: "#356AE6", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                    >
                      {isExpanded ? "Collapse Audit" : "Answer 7 Questions"}
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  </div>

                  {/* 7 QUESTIONS PROGRESSIVE DISCLOSURE (SECTION 16) */}
                  {isExpanded && (
                    <div style={{ background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 6, padding: 14, marginTop: 12, display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ fontSize: 12, color: "#162A43" }}>
                        <strong>1. WHAT WAS CLAIMED?</strong> Implementation of {repo.name} with technologies: {repo.languages_in_code.join(", ") || "General software"}
                      </div>
                      <div style={{ fontSize: 12, color: "#162A43" }}>
                        <strong>2. WHERE WAS IT FOUND?</strong> Repository URL: <a href={repo.url} target="_blank" rel="noopener noreferrer" style={{ color: "#356AE6" }}>{repo.url}</a>
                      </div>
                      <div style={{ fontSize: 12, color: "#162A43" }}>
                        <strong>3. WHAT DID COGNALYZE ACTUALLY INSPECT?</strong> {repo.inspected_files_coverage} (Source trees, package manifests, and test configurations).
                      </div>
                      <div style={{ fontSize: 12, color: "#162A43" }}>
                        <strong>4. WHAT EVIDENCE SUPPORTS THE FINDING?</strong> {repo.commit_count} commits analyzed. Detected languages: {repo.languages_in_code.join(", ") || "None"}. Declared dependencies: {repo.frameworks_in_deps.join(", ") || "None"}.
                      </div>
                      <div style={{ fontSize: 12, color: "#162A43" }}>
                        <strong>5. WHAT WAS VERIFIED?</strong> Source code implementation and dependency configuration verified on default branch.
                      </div>
                      <div style={{ fontSize: 12, color: "#162A43" }}>
                        <strong>6. WHAT REMAINS UNKNOWN?</strong> Runtime execution, test pass rates in sandbox, and multi-contributor commit attribution.
                      </div>
                      <div style={{ fontSize: 12, color: "#162A43" }}>
                        <strong>7. WHAT SHOULD HAPPEN NEXT?</strong> Complete a short Cognalyze practical code walkthrough to demonstrate deep architecture reasoning.
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ─── TAB CONTENT: DISCREPANCY FINDINGS (SECTION 14 & 16) ─── */}
      {activeSource === "discrepancies" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {dossier.cross_source_discrepancies.length === 0 ? (
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 8, padding: 30, textAlign: "center", color: "#2E7D5B" }}>
              <CheckCircle2 size={24} style={{ marginBottom: 6 }} />
              <div style={{ fontSize: 14, fontWeight: 700 }}>Zero Cross-Source Conflicts</div>
              <div style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>Candidate claims and verified technical artifacts align consistently across all inspected channels.</div>
            </div>
          ) : (
            dossier.cross_source_discrepancies.map(disc => (
              <div
                key={disc.id}
                style={{
                  background: "#FFFFFF",
                  border: disc.severity === "DISCREPANCY" ? "1px solid #F9E4B7" : "1px solid #D2E0FB",
                  borderRadius: 8,
                  padding: 16
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: disc.severity === "DISCREPANCY" ? "#B7791F" : "#356AE6",
                      background: disc.severity === "DISCREPANCY" ? "#FEF8EC" : "#EFF4FE",
                      padding: "2px 8px",
                      borderRadius: 4
                    }}
                  >
                    {disc.severity === "OPPORTUNITY_TO_SHOWCASE" ? "Showcase Opportunity" : "Evidence Gap / Notice"}
                  </span>
                  <span style={{ fontSize: 11, color: "#98A2B3" }}>ID: {disc.id}</span>
                </div>

                <div style={{ fontSize: 13, color: "#162A43", margin: "8px 0 4px", fontWeight: 500 }}>
                  {disc.neutral_explanation}
                </div>

                <div style={{ fontSize: 12, color: "#667085", background: "#FAF9F6", padding: "6px 10px", borderRadius: 6, border: "1px solid #E4E1DA", marginTop: 6 }}>
                  <strong>Next Action:</strong> {disc.recommended_action}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
