"use client";

import React, { useEffect, useState } from "react";
import AppNav from "@/components/AppNav";
import { QualityOfHireAnalytics, HireOutcomeRecord } from "@/lib/ai/quality-of-hire";

export default function QualityOfHirePage() {
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<QualityOfHireAnalytics | null>(null);
  const [records, setRecords] = useState<HireOutcomeRecord[]>([]);

  // Record Form state
  const [isRecording, setIsRecording] = useState(false);
  const [candidateName, setCandidateName] = useState("");
  const [roleTitle, setRoleTitle] = useState("Senior Distributed Backend Engineer");
  const [day30Score, setDay30Score] = useState(9);
  const [day60Score, setDay60Score] = useState(8);
  const [day90Score, setDay90Score] = useState(92);
  const [outcomeMet, setOutcomeMet] = useState(true);
  const [hadWorkSample, setHadWorkSample] = useState(true);
  const [managerFeedback, setManagerFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const fetchQualityData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/recruiter/quality-of-hire`);
      const data = await res.json();
      if (data.success) {
        setAnalytics(data.analytics);
        setRecords(data.records || []);
      }
    } catch (err) {
      console.error("Failed to fetch quality of hire telemetry:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQualityData();
  }, []);

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim()) return;
    setSubmitting(true);
    setSubmitMessage(null);

    try {
      const res = await fetch("/api/recruiter/quality-of-hire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId: `cand-${Date.now().toString().slice(-4)}`,
          candidateName,
          roleId: "role-senior-backend",
          roleTitle,
          preHireSignals: {
            overallFitScore: 88,
            hadVerifiedWorkSample: hadWorkSample,
            interviewScore: 85,
            criticalGapsIdentified: [],
            evidenceTypeForCritical: hadWorkSample ? "work_sample" : "interview_only"
          },
          day30Milestone: {
            recordedAt: new Date().toISOString(),
            onboardingRampScore: day30Score,
            prThroughputScore: day30Score,
            managerFeedback: "Fast onboarding"
          },
          day60Milestone: {
            recordedAt: new Date().toISOString(),
            autonomyScore: day60Score,
            systemOwnershipScore: day60Score,
            managerFeedback: "Strong peer collaboration"
          },
          day90Milestone: {
            recordedAt: new Date().toISOString(),
            businessOutcomeMet: outcomeMet,
            overall90DayPerformance: day90Score,
            retentionRisk: "Low",
            managerVerdict: outcomeMet ? "Exceeded Expectations" : "Underperformed",
            keyLearnings: managerFeedback || "Empirical work sample directly correlated with delivery speed."
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        setSubmitMessage(`✓ 90-Day outcome milestone recorded for ${candidateName}`);
        setIsRecording(false);
        setCandidateName("");
        setManagerFeedback("");
        fetchQualityData();
        setTimeout(() => setSubmitMessage(null), 4000);
      }
    } catch (err: any) {
      setSubmitMessage(`Error: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-canvas)", color: "var(--text-primary)", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <AppNav role="recruiter" />

      <main style={{ maxWidth: 1380, margin: "0 auto", padding: "32px 24px 80px" }}>
        
        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 5, background: "var(--color-info-bg)", border: "1px solid #D2E0FB", color: "var(--brand-cobalt)", fontWeight: 700 }}>
                CLOSED-LOOP RETENTION TELEMETRY
              </span>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                30 / 60 / 90-Day Retention Analytics &amp; Continuous Learning
              </span>
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, margin: 0, color: "var(--brand-navy)", letterSpacing: "-0.5px" }}>
              Quality-of-Hire Learning Loop &amp; Calibration
            </h1>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "8px 0 0", maxWidth: 750, lineHeight: 1.5 }}>
              Measures real 30-day onboarding ramp, 60-day engineering autonomy, and 90-day business milestone attainment. Insights are gated behind a 3-hire threshold to feed validated signal correlations directly back into future Role DNAs.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={async () => {
                try {
                  await fetch("/api/recruiter/quality-of-hire?mode=seed_baseline", { method: "POST" });
                  fetchQualityData();
                } catch {
                  fetchQualityData();
                }
              }}
              style={{
                padding: "8px 14px",
                borderRadius: 7,
                background: "var(--surface)",
                border: "1px solid var(--border-subtle)",
                color: "var(--brand-navy)",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
              }}
            >
              🔄 Refresh Baseline Telemetry
            </button>

            <button
              onClick={() => setIsRecording(!isRecording)}
              style={{
                padding: "8px 16px",
                borderRadius: 7,
                background: isRecording ? "#FFFFFF" : "var(--brand-cobalt)",
                border: isRecording ? "1px solid var(--border-subtle)" : "none",
                color: isRecording ? "#162A43" : "var(--surface)",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: isRecording ? "none" : "0 2px 6px rgba(53, 106, 230, 0.3)"
              }}
            >
              {isRecording ? "✕ Cancel" : "+ Record Milestone Review"}
            </button>
          </div>
        </div>

        {submitMessage && (
          <div style={{ padding: "12px 18px", borderRadius: 8, background: "var(--color-success-bg)", border: "1px solid #C8E4D3", color: "var(--color-success)", marginBottom: 24, fontSize: 13, fontWeight: 700 }}>
            {submitMessage}
          </div>
        )}

        {/* ── RECORD MILESTONE DRAWER ── */}
        {isRecording && (
          <div style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: 24, marginBottom: 28, boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--brand-navy)", margin: "0 0 16px" }}>
              Record 30/60/90 Post-Hire Milestone Evaluation
            </h3>

            <form onSubmit={handleRecordSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>HIRED CANDIDATE NAME</label>
                  <input
                    type="text"
                    required
                    value={candidateName}
                    onChange={e => setCandidateName(e.target.value)}
                    placeholder="e.g. Priyanshu Sharma"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 7, background: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", fontSize: 12, boxSizing: "border-box", outline: "none" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>ROLE TITLE</label>
                  <input
                    type="text"
                    value={roleTitle}
                    onChange={e => setRoleTitle(e.target.value)}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 7, background: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", fontSize: 12, boxSizing: "border-box", outline: "none" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>HAD WORK SAMPLE EVIDENCE?</label>
                  <select
                    value={hadWorkSample ? "yes" : "no"}
                    onChange={e => setHadWorkSample(e.target.value === "yes")}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 7, background: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", fontSize: 12, boxSizing: "border-box", outline: "none" }}
                  >
                    <option value="yes">Yes — Verified Work Sample</option>
                    <option value="no">No — Interview-Only Hire</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>90-DAY OUTCOME MET?</label>
                  <select
                    value={outcomeMet ? "yes" : "no"}
                    onChange={e => setOutcomeMet(e.target.value === "yes")}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: 7, background: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", fontSize: 12, boxSizing: "border-box", outline: "none" }}
                  >
                    <option value="yes">Yes — Delivered Target Business Milestone</option>
                    <option value="no">No — Missed Key Milestone</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>DAY 30 RAMP SCORE ({day30Score}/10)</label>
                  <input type="range" min="1" max="10" value={day30Score} onChange={e => setDay30Score(parseInt(e.target.value))} style={{ width: "100%" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>DAY 60 AUTONOMY ({day60Score}/10)</label>
                  <input type="range" min="1" max="10" value={day60Score} onChange={e => setDay60Score(parseInt(e.target.value))} style={{ width: "100%" }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>DAY 90 PERFORMANCE ({day90Score}%)</label>
                  <input type="range" min="40" max="100" value={day90Score} onChange={e => setDay90Score(parseInt(e.target.value))} style={{ width: "100%" }} />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", display: "block", marginBottom: 4 }}>ENGINEERING MANAGER KEY LEARNINGS</label>
                <input
                  type="text"
                  value={managerFeedback}
                  onChange={e => setManagerFeedback(e.target.value)}
                  placeholder="e.g. Work sample on Kafka partition keys directly predicted system reliability under load."
                  style={{ width: "100%", padding: "8px 12px", borderRadius: 7, background: "var(--bg-canvas)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)", fontSize: 12, boxSizing: "border-box", outline: "none" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsRecording(false)}
                  style={{ padding: "8px 14px", borderRadius: 7, background: "transparent", border: "1px solid var(--border-subtle)", color: "var(--text-secondary)", fontSize: 12, cursor: "pointer", fontWeight: 600 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: "8px 18px", borderRadius: 7, background: "var(--brand-cobalt)", border: "none", color: "white", fontSize: 12, fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer" }}
                >
                  {submitting ? "Saving..." : "Save Milestone Outcome"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── STATE 1: INSUFFICIENT DATA GATING ── */}
        {analytics?.status === "insufficient_data" ? (
          <div
            style={{
              padding: "40px 32px",
              borderRadius: 10,
              background: "#FEF7ED",
              border: "1px solid #F8D8A7",
              marginBottom: 32,
              textAlign: "center"
            }}
          >
            <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "var(--color-warning)", margin: "0 0 8px" }}>
              Statistical Gating Active: Insufficient Outcome Data
            </h2>
            <p style={{ fontSize: 13, color: "var(--text-secondary)", maxWidth: 680, margin: "0 auto 20px", lineHeight: 1.6 }}>
              {analytics.message}
            </p>

            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 16px", borderRadius: 7, background: "var(--surface)", border: "1px solid #F8D8A7" }}>
              <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Progress to Statistical Threshold:</span>
              <strong style={{ color: "var(--color-warning)", fontSize: 13 }}>{analytics.currentRecordsCount} of {analytics.minimumThreshold} Hires Recorded</strong>
            </div>

            <div style={{ marginTop: 20, fontSize: 12, color: "var(--text-muted)" }}>
              Tip: Click &ldquo;Refresh Baseline Telemetry&rdquo; above to load sample verified outcomes.
            </div>
          </div>
        ) : (
          /* ── STATE 2: THRESHOLD MET STATISTICAL TELEMETRY ── */
          <div>
            {/* KPI STRIP */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 28 }}>
              <div style={{ padding: "20px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border-subtle)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>AVERAGE 90-DAY PERFORMANCE</div>
                <div style={{ fontSize: 30, fontWeight: 900, color: "var(--color-success)", margin: "6px 0 2px" }}>
                  {analytics?.metrics?.average90DayPerformance}%
                </div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Across all completed 90-day cohorts</div>
              </div>

              <div style={{ padding: "20px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border-subtle)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>OUTCOME ATTAINMENT RATE</div>
                <div style={{ fontSize: 30, fontWeight: 900, color: "var(--brand-cobalt)", margin: "6px 0 2px" }}>
                  {analytics?.metrics?.outcomeAttainmentRatePct}%
                </div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Achieved target business outcome</div>
              </div>

              <div style={{ padding: "20px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border-subtle)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>WORK SAMPLE ADVANTAGE</div>
                <div style={{ fontSize: 30, fontWeight: 900, color: "var(--brand-navy)", margin: "6px 0 2px" }}>
                  +{analytics?.metrics?.workSampleCorrelation.deltaPct}%
                </div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Work Sample vs Interview-Only delta</div>
              </div>

              <div style={{ padding: "20px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border-subtle)", boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase" }}>RETENTION STABILITY</div>
                <div style={{ fontSize: 30, fontWeight: 900, color: "var(--color-success)", margin: "6px 0 2px" }}>
                  {analytics?.metrics?.retentionRatePct}%
                </div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>Low retention risk classification</div>
              </div>
            </div>

            {/* ── PHASE 13 FUTURE OPTIMIZATION RECOMMENDATIONS ── */}
            <div style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: 24, marginBottom: 28, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "var(--brand-navy)", margin: 0 }}>
                    Closed-Loop Calibration Recommendations for Future Role DNAs
                  </h3>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                    Synthesizes 90-day retention outcomes to calibrate future screening filters and Role DNA requirements
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {analytics?.phase13FutureRecommendations?.map((rec, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "16px 20px",
                      borderRadius: 8,
                      background: "#F9F8F5",
                      border: "1px solid var(--border-subtle)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 16
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "var(--color-info-bg)", border: "1px solid #D2E0FB", color: "var(--brand-cobalt)", fontWeight: 700 }}>
                          {rec.recommendationType.toUpperCase().replace(/_/g, " ")}
                        </span>
                        <strong style={{ fontSize: 13, color: "var(--brand-navy)" }}>{rec.roleTitle}</strong>
                      </div>
                      <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 6px", lineHeight: 1.5 }}>
                        {rec.rationale}
                      </p>
                      <div style={{ fontSize: 11, color: "var(--color-success)", fontWeight: 700 }}>
                        Impact: {rec.expectedYieldImprovement}
                      </div>
                    </div>

                    <button
                      onClick={() => alert(`Applied calibration learning to ${rec.roleTitle} Role DNA!`)}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 7,
                        background: "var(--brand-cobalt)",
                        border: "none",
                        color: "white",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        whiteSpace: "nowrap"
                      }}
                    >
                      Apply to Role DNA ➔
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── COHORT HIRE RECORDS TABLE ── */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border-subtle)", borderRadius: 10, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.03)" }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "var(--brand-navy)", margin: "0 0 16px" }}>
            Recorded Hire Cohorts &amp; Outcome Trail ({records.length})
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {records.map(rec => (
              <div
                key={rec.hireId}
                style={{
                  padding: "16px 20px",
                  borderRadius: 8,
                  background: "#F9F8F5",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: 14
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <strong style={{ fontSize: 14, color: "var(--brand-navy)" }}>{rec.candidateName}</strong>
                    <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>• {rec.roleTitle}</span>
                    <span style={{
                      fontSize: 10,
                      padding: "2px 7px",
                      borderRadius: 4,
                      background: rec.preHireSignals.hadVerifiedWorkSample ? "var(--color-success-bg)" : "#FEF7ED",
                      border: rec.preHireSignals.hadVerifiedWorkSample ? "1px solid #C8E4D3" : "1px solid #F8D8A7",
                      color: rec.preHireSignals.hadVerifiedWorkSample ? "#2E7D5B" : "var(--color-warning)",
                      fontWeight: 700
                    }}>
                      {rec.preHireSignals.hadVerifiedWorkSample ? "VERIFIED WORK SAMPLE" : "INTERVIEW ONLY"}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                    Key Learning: {rec.day90Milestone?.keyLearnings}
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: rec.day90Milestone?.businessOutcomeMet ? "#2E7D5B" : "var(--color-error)" }}>
                    {rec.day90Milestone?.overall90DayPerformance}%
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>
                    {rec.day90Milestone?.managerVerdict}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
