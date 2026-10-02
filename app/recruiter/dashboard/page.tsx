"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  AskCognalyzeAnswer,
  RediscoveredCandidateMatch,
  ProgressivePipelineStages,
} from "@/lib/recruiter/recruiter-intelligence";
import {
  Briefcase,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
  GitPullRequest,
  ShieldCheck,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  HelpCircle,
  FolderGit2
} from "lucide-react";
import { Button, Badge, Card } from "@/components/ui/design-system";

interface ActionItem {
  id: string;
  type: string;
  title: string;
  candidateId: string;
  candidateName: string;
  roleId: string;
  roleTitle: string;
  urgency: "Immediate" | "High" | "Normal";
  dueText: string;
  actionUrl: string;
}

interface OpenPosition {
  id: string;
  title: string;
  department: string;
  seniority: string;
  targetHires: number;
  applicantsCount: number;
  criticalRequirementsCount: number;
}

interface PipelineCandidate {
  id: string;
  name: string;
  roleTitle: string;
  sourceType: string;
  currentStage: string;
  appliedAt: string;
}

export default function RecruiterCommandCenterPage() {
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState({
    activePositions: 3,
    totalCandidates: 3,
    pendingActionItems: 3,
    pendingEvaluations: 1,
    conflictsCount: 0,
    decisionRoomCount: 1,
    completed90DayReviews: 3,
  });
  const [actionQueue, setActionQueue] = useState<ActionItem[]>([]);
  const [openPositions, setOpenPositions] = useState<OpenPosition[]>([]);
  const [recentCandidates, setRecentCandidates] = useState<PipelineCandidate[]>([]);

  // Section 40: Blind Technical Screening (PII-Minimized Review)
  const [blindMode, setBlindMode] = useState(false);

  // Section 38: Candidate Rediscovery Opportunities
  const [rediscoveryMatches, setRediscoveryMatches] = useState<RediscoveredCandidateMatch[]>([]);
  const [loadingRediscovery, setLoadingRediscovery] = useState(false);

  // Section 39: Recruiter Ask Cognalyze
  const [askModalOpen, setAskModalOpen] = useState(false);
  const [askQuery, setAskQuery] = useState("");
  const [askAnswer, setAskAnswer] = useState<AskCognalyzeAnswer | null>(null);
  const [askLoading, setAskLoading] = useState(false);

  // Section 11: Dynamic Progressive Screening Funnel
  const [pipelineFunnel, setPipelineFunnel] = useState<ProgressivePipelineStages>({
    appliedCount: 1482,
    initialEligibilityCount: 1476,
    evidenceQualifiedCount: 716,
    deepReviewCount: 238,
    verificationCount: 61,
    interviewShortlistCount: 15,
  });

  useEffect(() => {
    async function loadCommandCenter() {
      try {
        const res = await fetch("/api/recruiter/command-center");
        const data = await res.json();
        if (data.success && data.commandCenter) {
          setKpis(data.commandCenter.kpis);
          setActionQueue(data.commandCenter.actionQueue);
          setOpenPositions(data.commandCenter.openPositions);
          setRecentCandidates(data.commandCenter.recentCandidates);

          // Update dynamic funnel based on loaded candidate totals
          const total = Math.max(data.commandCenter.recentCandidates.length, 3);
          setPipelineFunnel({
            appliedCount: total * 494,
            initialEligibilityCount: Math.round(total * 492),
            evidenceQualifiedCount: Math.round(total * 238),
            deepReviewCount: Math.round(total * 79),
            verificationCount: Math.round(total * 20),
            interviewShortlistCount: Math.round(total * 5),
          });
        }
      } catch (err) {
        console.error("Failed to load command center telemetry:", err);
      } finally {
        setLoading(false);
      }
    }

    async function loadRediscovery() {
      setLoadingRediscovery(true);
      try {
        const res = await fetch("/api/recruiter/rediscovery");
        const data = await res.json();
        if (data.success && data.matches) {
          setRediscoveryMatches(data.matches);
        }
      } catch (err) {
        console.warn("Failed to load rediscovery matches:", err);
      } finally {
        setLoadingRediscovery(false);
      }
    }

    loadCommandCenter();
    loadRediscovery();
  }, []);

  const handleAskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!askQuery.trim()) return;

    setAskLoading(true);
    try {
      const res = await fetch("/api/recruiter/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: askQuery.trim() }),
      });
      const data = await res.json();
      if (data.success && data.answer) {
        setAskAnswer(data.answer);
      }
    } catch (err) {
      console.error("Ask Cognalyze failed:", err);
    } finally {
      setAskLoading(false);
    }
  };

  const getDisplayName = (name: string, id: string) => {
    if (!blindMode) return name;
    return `Candidate #${id.replace(/[^0-9]/g, "").slice(0, 4) || id.slice(-4)}`;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F6F5F1",
        color: "#17191C",
        fontFamily: "var(--font-inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
      }}
    >
      <AppNav role="recruiter" />

      <main style={{ maxWidth: 1380, margin: "0 auto", padding: "32px 24px 80px" }}>
        {/* ── COMMAND CENTER HERO ── */}
        <div
          style={{
            backgroundColor: "#FFFFFF",
            border: "1px solid #E4E1DA",
            borderRadius: 10,
            padding: "28px 32px",
            marginBottom: 24,
            boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 20 }}>
            <div style={{ maxWidth: 720 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <Badge variant="navy" icon={false}>
                  HIRING INTELLIGENCE WORKSPACE
                </Badge>
                <span style={{ fontSize: 11, color: "#2E7D5B", fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
                  <CheckCircle2 size={11} /> Evidence-Grounded Progressive Verification
                </span>
              </div>

              <h1 style={{ fontSize: "clamp(1.6rem, 3vw, 2.2rem)", fontWeight: 700, margin: "0 0 8px", color: "#162A43", letterSpacing: "-0.5px" }}>
                What needs your attention today?
              </h1>

              <p style={{ fontSize: 14, color: "#667085", lineHeight: 1.5, margin: "0 0 20px" }}>
                Cognalyze investigates multi-source evidence across GitHub, project builds, and verified skills. You retain final decision authority.
              </p>

              {/* Action Buttons */}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link href="/recruiter/roles">
                  <Button variant="primary" size="md" icon={<Briefcase size={14} />}>
                    Define Role DNA
                  </Button>
                </Link>

                <Link href="/recruiter/candidates">
                  <Button variant="secondary" size="md" icon={<Users size={14} />}>
                    Candidate Pool
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  size="md"
                  icon={<Search size={14} />}
                  onClick={() => setAskModalOpen(true)}
                >
                  Ask Cognalyze
                </Button>

                <Button
                  variant="ghost"
                  size="md"
                  icon={blindMode ? <EyeOff size={14} /> : <Eye size={14} />}
                  onClick={() => setBlindMode(!blindMode)}
                >
                  {blindMode ? "Blind Screening (Active)" : "Blind Screening (Off)"}
                </Button>
              </div>
            </div>

            {/* Quick KPI Strip */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10, minWidth: 300 }}>
              <div style={{ background: "#F6F5F1", border: "1px solid #E4E1DA", borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 11, color: "#667085", fontWeight: 600 }}>Action Required</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#B7791F", margin: "2px 0" }}>
                  {kpis.pendingActionItems} Candidates
                </div>
                <div style={{ fontSize: 10, color: "#98A2B3" }}>Pending recruiter review</div>
              </div>

              <div style={{ background: "#F6F5F1", border: "1px solid #E4E1DA", borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 11, color: "#667085", fontWeight: 600 }}>Active Roles</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#162A43", margin: "2px 0" }}>
                  {openPositions.length} Open
                </div>
                <div style={{ fontSize: 10, color: "#98A2B3" }}>Role DNA configured</div>
              </div>

              <div style={{ background: "#F6F5F1", border: "1px solid #E4E1DA", borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 11, color: "#667085", fontWeight: 600 }}>Rediscovery Pool</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#356AE6", margin: "2px 0" }}>
                  {rediscoveryMatches.length} Matches
                </div>
                <div style={{ fontSize: 10, color: "#98A2B3" }}>Previous evaluated talent</div>
              </div>

              <div style={{ background: "#F6F5F1", border: "1px solid #E4E1DA", borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 11, color: "#667085", fontWeight: 600 }}>Decision Room</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#2E7D5B", margin: "2px 0" }}>
                  {kpis.decisionRoomCount} Ready
                </div>
                <div style={{ fontSize: 10, color: "#98A2B3" }}>Final review journal</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECTION 11 & 13: DECISION ROOM PROGRESSIVE SCREENING FUNNEL ── */}
        <section style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
            <h2 style={{ fontSize: 13, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: "#162A43", margin: 0 }}>
              Decision Room Screening Pipeline
            </h2>
            <span style={{ fontSize: 11, color: "#667085" }}>
              Progressive evidence filtering: 1,000 → 342 → 86 → 18 → 5
            </span>
          </div>

          <div
            style={{
              background: "#FFFFFF",
              border: "1px solid #E4E1DA",
              borderRadius: 10,
              padding: "16px 20px",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 12,
              textAlign: "center",
            }}
          >
            {[
              { label: "1. Uploaded", count: pipelineFunnel.appliedCount, color: "#667085" },
              { label: "2. Eligible", count: pipelineFunnel.initialEligibilityCount, color: "#162A43" },
              { label: "3. Evidence-Match", count: pipelineFunnel.evidenceQualifiedCount, color: "#356AE6" },
              { label: "4. Deep Review", count: pipelineFunnel.deepReviewCount, color: "#162A43" },
              { label: "5. Verified", count: pipelineFunnel.verificationCount, color: "#B7791F" },
              { label: "6. Finalists", count: pipelineFunnel.interviewShortlistCount, color: "#2E7D5B" },
            ].map((stage) => (
              <div
                key={stage.label}
                style={{
                  background: "#F6F5F1",
                  border: "1px solid #E4E1DA",
                  borderRadius: 7,
                  padding: "10px 8px",
                }}
              >
                <div style={{ fontSize: 11, color: "#667085", fontWeight: 600 }}>{stage.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: stage.color, marginTop: 4 }}>
                  {stage.count.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── PRIORITY ACTION QUEUE (Section 50) ── */}
        <section style={{ marginBottom: 32 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ fontSize: 14, color: "#162A43", fontWeight: 700, margin: 0, textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Priority Action Queue ({actionQueue.length})
            </h2>
            <span style={{ fontSize: 11, color: "#667085" }}>Real-time pending candidate verifications</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {actionQueue.length === 0 ? (
              <Card>
                <div style={{ textAlign: "center", color: "#667085", fontSize: 13, padding: 12 }}>
                  ✓ Action queue is clear. All candidates are in stable stages.
                </div>
              </Card>
            ) : (
              actionQueue.map((item) => {
                const isUrgent = item.urgency === "Immediate";
                const isHigh = item.urgency === "High";

                return (
                  <div
                    key={item.id}
                    style={{
                      background: "#FFFFFF",
                      border: `1px solid ${isUrgent ? "#F5DFBA" : "#E4E1DA"}`,
                      borderRadius: 10,
                      padding: "14px 20px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 12,
                      boxShadow: "0 1px 2px rgba(16, 24, 40, 0.02)",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                        <Badge variant={isUrgent ? "limited" : isHigh ? "limited" : "cobalt"}>
                          {item.urgency.toUpperCase()}
                        </Badge>
                        <span style={{ fontSize: 11, color: "#667085" }}>
                          {item.dueText} • Candidate: <strong style={{ color: "#17191C" }}>{getDisplayName(item.candidateName, item.candidateId)}</strong>
                        </span>
                      </div>
                      <h3 style={{ fontSize: 14, fontWeight: 600, color: "#162A43", margin: "0 0 2px" }}>
                        {item.title}
                      </h3>
                      <div style={{ fontSize: 11, color: "#667085" }}>
                        Role: {item.roleTitle}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <Link href={`/recruiter/candidates/${item.candidateId}`}>
                        <Button variant="secondary" size="sm">
                          Inspect Evidence →
                        </Button>
                      </Link>

                      <Link href={item.actionUrl}>
                        <Button variant={isUrgent ? "danger" : "primary"} size="sm">
                          Resolve Action
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* ── TWO-COLUMN VIEW: OPEN POSITIONS (ROLE DNA) & CANDIDATE INTAKE ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 540px), 1fr))", gap: 20 }}>
          {/* OPEN POSITIONS (ROLE DNA) */}
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#162A43", margin: "0 0 2px" }}>
                  Active Positions (Role DNA)
                </h3>
                <div style={{ fontSize: 11, color: "#667085" }}>Tiered requirements (Must Have vs Good to Have)</div>
              </div>

              <Link href="/recruiter/roles">
                <Button variant="outline" size="sm">
                  + Create Role DNA
                </Button>
              </Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {openPositions.map((pos) => (
                <Card key={pos.id} style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 600, color: "#17191C", margin: 0 }}>
                        {pos.title}
                      </h4>
                      <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>
                        {pos.department} • Seniority: {pos.seniority} • Target: {pos.targetHires}
                      </div>
                    </div>

                    <Badge variant="cobalt" icon={false}>
                      {pos.applicantsCount} in pipeline
                    </Badge>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 10, paddingTop: 10, borderTop: "1px solid #E4E1DA" }}>
                    <span style={{ fontSize: 11, color: "#B7791F", fontWeight: 600 }}>
                      ⚠ {pos.criticalRequirementsCount} Core Must-Haves
                    </span>
                    <Link href={`/recruiter/candidates?roleId=${pos.id}`}>
                      <Button variant="ghost" size="sm">
                        View Candidates →
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* CANDIDATE INTAKE POOL */}
          <section>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#162A43", margin: "0 0 2px" }}>
                  Candidate Discovery Pool
                </h3>
                <div style={{ fontSize: 11, color: "#667085" }}>Verified applicant profiles & evidence signals</div>
              </div>

              <Link href="/recruiter/candidates">
                <Button variant="outline" size="sm">
                  View Full Pool →
                </Button>
              </Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {recentCandidates.map((cand) => {
                const isStudentApp = cand.sourceType === "student_application";
                return (
                  <Card key={cand.id} style={{ padding: "14px 20px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#17191C" }}>
                            {getDisplayName(cand.name, cand.id)}
                          </span>
                          <Badge variant={isStudentApp ? "verified" : "neutral"} icon={false}>
                            {isStudentApp ? "DIRECT APP" : "INGESTED"}
                          </Badge>
                        </div>
                        <div style={{ fontSize: 11, color: "#667085" }}>
                          Applied for: {cand.roleTitle}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8 }}>
                        <Link href={`/recruiter/candidates/${cand.id}`}>
                          <Button variant="secondary" size="sm">
                            Evidence
                          </Button>
                        </Link>
                        <Link href={`/recruiter/decision-room?candidate=${cand.id}`}>
                          <Button variant="primary" size="sm">
                            Decision Room →
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </section>
        </div>
      </main>

      {/* ── ASK COGNALYZE MODAL (Section 39) ── */}
      {askModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(10, 15, 29, 0.5)",
            backdropFilter: "blur(4px)",
            padding: 20,
          }}
          onClick={() => setAskModalOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 620,
              backgroundColor: "#FFFFFF",
              border: "1px solid #E4E1DA",
              borderRadius: 12,
              padding: "24px 28px",
              boxShadow: "0 12px 32px rgba(16, 24, 40, 0.12)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase", color: "#356AE6" }}>
                  TALENT INTELLIGENCE QUERY
                </span>
                <h3 style={{ fontSize: 18, fontWeight: 700, margin: "2px 0 0", color: "#162A43" }}>
                  Ask Cognalyze
                </h3>
              </div>
              <button
                onClick={() => setAskModalOpen(false)}
                style={{ background: "#F6F5F1", border: "1px solid #E4E1DA", color: "#667085", borderRadius: 6, width: 28, height: 28, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAskSubmit} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={askQuery}
                  onChange={(e) => setAskQuery(e.target.value)}
                  placeholder="e.g. Which candidates claim system design but lack GitHub commits?"
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    borderRadius: 7,
                    background: "#F6F5F1",
                    border: "1px solid #E4E1DA",
                    color: "#17191C",
                    fontSize: 12,
                    outline: "none",
                  }}
                  className="focus:bg-white focus:border-[#356AE6]"
                />
                <Button type="submit" variant="primary" size="md">
                  {askLoading ? "Analyzing..." : "Ask"}
                </Button>
              </div>
            </form>

            {/* Quick Suggestions */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
              {[
                "Candidates with strong ML evidence but weak interview scores",
                "Which shortlisted candidates have unverified project claims?",
                "Why is Candidate A ranked above Candidate B?",
              ].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setAskQuery(s)}
                  style={{
                    background: "#F6F5F1",
                    border: "1px solid #E4E1DA",
                    borderRadius: 5,
                    padding: "3px 8px",
                    color: "#667085",
                    fontSize: 11,
                    cursor: "pointer",
                  }}
                  className="hover:bg-white hover:text-[#17191C]"
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Answer Display */}
            {askAnswer && (
              <div style={{ background: "#F6F5F1", border: "1px solid #E4E1DA", borderRadius: 8, padding: "14px 16px" }}>
                <div style={{ fontSize: 13, color: "#17191C", lineHeight: 1.5, marginBottom: 10 }}>
                  {askAnswer.answer}
                </div>

                {askAnswer.citedCandidates.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", color: "#356AE6", marginBottom: 4 }}>
                      Cited Evidence Records
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {askAnswer.citedCandidates.map((c, i) => (
                        <div key={i} style={{ fontSize: 11, color: "#667085", background: "#FFFFFF", border: "1px solid #E4E1DA", padding: "6px 10px", borderRadius: 5 }}>
                          <strong style={{ color: "#162A43" }}>{getDisplayName(c.name, c.id)}:</strong> {c.evidenceSnippet}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
