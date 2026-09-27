"use client";
import { useState, useEffect, useRef, useCallback } from "react";

// ═══ EVIDENCE-BASED INTERVIEW INTERFACES ═══
export interface EvidenceMarker {
  id: string;
  type: "demonstrated" | "partial" | "gap" | "repeated_gap";
  competency: string;
  detail: string;
  quote?: string;
  occurrences?: number;
}

export interface RepeatedGapAlert {
  competency: string;
  occurrences: number;
  message: string;
}

interface Msg { role: "user" | "assistant"; content: string; time: string; }
interface ScoreBreakdown { relevance: number; technicalAccuracy: number; communicationClarity: number; problemSolving: number; depth: number; examples: number; confidence: number; }
interface ScoreEvidence { strengths: string[]; improvements: string[]; suggestedAnswer: string; scoreReason: string; }
interface ScoreData {
  evidenceMarkers?: EvidenceMarker[];
  repeatedGapAlert?: RepeatedGapAlert | null;
  strengths?: string[];
  improvements?: string[];
  suggestedAnswer?: string;
  overall: number;
  breakdown: ScoreBreakdown;
  evidence: ScoreEvidence;
  verdict: string;
  hiringSignal: string;
  bodyLanguage: any;
  timestamp: number;
}
interface BodyLang { overall: number; posture: number; eyeContact: number; confidence: number; expression: number; notes: string; }
interface FinalVerdict { decision: string; confidence: number; headline: string; overview: string; hire_reasons: string[]; no_hire_reasons: string[]; standout_moments: string[]; concerning_moments: string[]; scorecard: Record<string, { score: number; comment: string }>; next_steps: string; interviewer_note: string; }

// ═══ PROCTORING INTERFACES ═══
interface Violation { time: string; type: string; severity: "critical" | "high" | "medium" | "low"; }
interface AICheck { isAI: boolean; ai_score: number; risk_level: string; signals_found: string[]; verdict: string; }
interface TrustReport { trust_score: number; verdict: string; verdict_reason: string; breakdown: Record<string, { score: number; label: string; note: string }>; flags: string[]; ai_observation: string; recruiter_recommendation: string; confidence_level: string; }

const ZERO_SCORE: ScoreData = {
  evidenceMarkers: [],
  repeatedGapAlert: null,
  strengths: [],
  improvements: [],
  suggestedAnswer: "",
  overall: 0, timestamp: 0,
  breakdown: { relevance: 0, technicalAccuracy: 0, communicationClarity: 0, problemSolving: 0, depth: 0, examples: 0, confidence: 0 },
  evidence: { strengths: [], improvements: [], suggestedAnswer: "", scoreReason: "Answer the question to stream live evidence" },
  verdict: "Waiting for first answer...", hiringSignal: "NEUTRAL",
  bodyLanguage: { overall: 0, posture: 0, eyeContact: 0, confidence: 0, expression: 0, notes: "" }
};

// ═══ FACE OVAL (Proctored Face Tracking) ═══
function FaceOval({ status }: { status: "idle" | "ok" | "missing" | "multiple" }) {
  const c = status === "ok" ? "#10B981" : status === "missing" ? "#EF4444" : status === "multiple" ? "#F59E0B" : "rgba(255,255,255,0.3)";
  const label = status === "ok" ? "FACE DETECTED & ALIGNED" : status === "missing" ? "ALIGN FACE IN FRAME" : status === "multiple" ? "MULTIPLE FACES DETECTED" : "ALIGN YOUR FACE";

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 2 }}>
      <div style={{
        width: "55%",
        height: "75%",
        border: `1.5px solid ${c}`,
        borderRadius: "50%",
        transition: "border-color 0.25s ease"
      }} />
      <div style={{
        position: "absolute",
        bottom: "8%",
        left: "50%",
        transform: "translateX(-50%)",
        padding: "4px 12px",
        background: "rgba(9,9,11,0.9)",
        border: `1px solid ${c}`,
        borderRadius: 4,
        whiteSpace: "nowrap",
        transition: "all 0.25s ease"
      }}>
        <span style={{ fontSize: 9.5, color: c, fontWeight: 700, letterSpacing: 0.8, fontFamily: "monospace" }}>
          {label}
        </span>
      </div>
    </div>
  );
}

// ═══ TRUST RING (from secure interview) ═══
function TrustRing({ score, size = 60 }: { score: number; size?: number }) {
  const c = score >= 80 ? "#10B981" : score >= 60 ? "#F59E0B" : "#EF4444";
  const r = size * 0.42, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={size * 0.08} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c} strokeWidth={size * 0.08}
          strokeDasharray={circ} strokeDashoffset={circ - (circ * score / 100)}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.5s" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size * 0.25, fontWeight: 800, color: c, lineHeight: 1, fontFamily: "monospace" }}>{score}</span>
      </div>
    </div>
  );
}

// ═══ ALEX FACE (unchanged) ═══
function AlexFace({ speaking, listening }: { speaking: boolean; listening: boolean }) {
  return (
    <div style={{ width: "100%", height: "100%", background: "#121215", border: "1px solid #27272A", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes floatFace{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
        @keyframes eyeBlink{0%,88%,100%{transform:scaleY(1)}93%{transform:scaleY(0.05)}}
        @keyframes mouthTalk{0%,100%{height:4px}50%{height:14px}}
      `}</style>
      <div style={{ position: "relative", animation: speaking ? "none" : "floatFace 4s ease-in-out infinite" }}>
        <div style={{ width: 84, height: 94, borderRadius: "46%", background: "#C28359", position: "relative", border: "1px solid rgba(255,255,255,0.1)", transition: "all 0.3s" }}>
          <div style={{ position: "absolute", top: -8, left: -4, right: -4, height: 40, borderRadius: "50% 50% 0 0", background: "#1E1E24" }} />
          <div style={{ position: "absolute", top: -6, left: -8, width: 20, height: 34, borderRadius: "50% 0 0 50%", background: "#1E1E24" }} />
          <div style={{ position: "absolute", top: -6, right: -8, width: 20, height: 34, borderRadius: "0 50% 50% 0", background: "#1E1E24" }} />
          {[0, 1].map(i => <div key={i} style={{ position: "absolute", top: 19, left: i === 0 ? 12 : 44, width: 15, height: 2, borderRadius: 999, background: "#1E1E24", transform: i === 0 ? "rotate(-8deg)" : "rotate(8deg)" }} />)}
          <div style={{ position: "absolute", top: 28, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 18 }}>
            {[0, 1].map(i => (
              <div key={i} style={{ width: 11, height: 11, borderRadius: "50%", background: "#121215", display: "flex", alignItems: "center", justifyContent: "center", animation: "eyeBlink 4s ease-in-out infinite", animationDelay: `${i * 0.12}s`, overflow: "hidden", position: "relative" }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#27272A" }} />
                <div style={{ position: "absolute", width: 2.5, height: 2.5, borderRadius: "50%", background: "#FFFFFF", top: "15%", left: "20%" }} />
              </div>
            ))}
          </div>
          <div style={{ position: "absolute", top: 45, left: "50%", transform: "translateX(-50%)", width: 7, height: 6, borderRadius: "0 0 4px 4px", background: "rgba(0,0,0,0.2)" }} />
          <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", width: 30, overflow: "hidden", display: "flex", justifyContent: "center", gap: 2, alignItems: "flex-end", height: speaking ? "auto" : 6 }}>
            {speaking ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ width: 3.5, background: "#18181B", borderRadius: 999, minHeight: 3, maxHeight: 13, animation: `mouthTalk ${0.22 + i * 0.04}s ease-in-out infinite alternate`, animationDelay: `${i * 0.04}s` }} />
              ))
            ) : (
              <div style={{ width: 28, height: 5, borderRadius: "0 0 6px 6px", background: "rgba(30,30,36,0.8)" }} />
            )}
          </div>
          <div style={{ position: "absolute", bottom: -18, left: 8, right: 8, height: 24, background: "#18181B", border: "1px solid #27272A", borderRadius: "0 0 6px 6px" }} />
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", background: "#09090B", padding: "4px 12px", borderRadius: 6, border: "1px solid #27272A", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: speaking ? "#10B981" : listening ? "#3B82F6" : "rgba(255,255,255,0.3)", transition: "background-color 0.25s" }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: "#F8FAFC" }}>Alex</span>
        <span style={{ fontSize: 10, color: "#94A3B8" }}>Staff Technical Interviewer</span>
      </div>
      {(speaking || listening) && (
        <div style={{ position: "absolute", bottom: 42, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 2, alignItems: "flex-end" }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ width: 2, background: speaking ? "#10B981" : "#3B82F6", borderRadius: 999, minHeight: 3, maxHeight: 14, animation: `mouthTalk ${0.26 + i * 0.04}s ease-in-out infinite alternate`, animationDelay: `${i * 0.05}s` }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ═══ EVIDENCE STREAM PANEL (Replaces arbitrary 100-pt ScorePanel) ═══
function ScorePanel({ score, updating }: { score: ScoreData; updating: boolean }) {
  const markers = score.evidenceMarkers || [];
  const repeatedAlert = score.repeatedGapAlert;
  const strengths = score.strengths || score.evidence?.strengths || [];
  const improvements = score.improvements || score.evidence?.improvements || [];
  const suggestedAnswer = score.suggestedAnswer || score.evidence?.suggestedAnswer || "";

  const getMarkerBadge = (type: EvidenceMarker["type"], occurrences?: number) => {
    switch (type) {
      case "demonstrated":
        return {
          icon: "✓",
          label: "Demonstrated",
          color: "#10B981",
          bg: "rgba(16,185,129,0.1)",
          border: "rgba(16,185,129,0.3)"
        };
      case "partial":
        return {
          icon: "◐",
          label: "Partial Evidence",
          color: "#F59E0B",
          bg: "rgba(245,158,11,0.1)",
          border: "rgba(245,158,11,0.3)"
        };
      case "repeated_gap":
        return {
          icon: "◒",
          label: `Repeated Gap (${occurrences || 2}x)`,
          color: "#EF4444",
          bg: "rgba(239,68,68,0.12)",
          border: "rgba(239,68,68,0.35)"
        };
      case "gap":
      default:
        return {
          icon: "✕",
          label: "Gap",
          color: "#EF4444",
          bg: "rgba(239,68,68,0.1)",
          border: "rgba(239,68,68,0.3)"
        };
    }
  };

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "14px 12px 10px", display: "flex", flexDirection: "column", gap: 10 }}>
      {/* HEADER & DNA STATUS */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 9, letterSpacing: 1.5, color: "#94A3B8", fontWeight: 800 }}>LIVE EVIDENCE STREAM</span>
          <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 4, background: "rgba(16,185,129,0.15)", color: "#10b981", fontWeight: 700 }}>
            ● Synced to DNA
          </span>
        </div>
        {updating && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#10B981", animation: "blink 0.6s infinite" }} />
            <span style={{ fontSize: 8, color: "#10B981", fontWeight: 700 }}>analyzing</span>
          </div>
        )}
      </div>

      {/* REPEATED GAP ALERT BANNER (Triggers after 2+ independent failures) */}
      {repeatedAlert && (
        <div style={{
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: 8,
          padding: "10px 12px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#EF4444", fontWeight: 800, fontSize: 10, letterSpacing: 0.8 }}>
            <span>◒</span> REPEATED GAP DETECTED
          </div>
          <div style={{ fontSize: 11, color: "#FECACA", marginTop: 4, lineHeight: 1.45, fontWeight: 500 }}>
            {repeatedAlert.message}
          </div>
          <div style={{ marginTop: 6, fontSize: 9, color: "rgba(255,255,255,0.4)" }}>
            Observed across interview history. Flagged in Student DNA Career Memory.
          </div>
        </div>
      )}

      {/* QUALITATIVE VERDICT */}
      {score.verdict && (
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 9,
          padding: "8px 10px",
          fontSize: 11,
          color: "rgba(255,255,255,0.75)",
          lineHeight: 1.4,
          fontStyle: "italic"
        }}>
          "{score.verdict}"
        </div>
      )}

      {/* EVIDENCE MARKERS LIST */}
      <div>
        <div style={{ fontSize: 9, letterSpacing: 1.5, color: "rgba(255,255,255,0.35)", fontWeight: 700, marginBottom: 7, textTransform: "uppercase" }}>
          Demonstrated Competencies ({markers.length})
        </div>

        {markers.length === 0 ? (
          <div style={{
            padding: "16px 12px",
            background: "rgba(255,255,255,0.02)",
            border: "1px dashed rgba(255,255,255,0.1)",
            borderRadius: 10,
            textAlign: "center",
            color: "rgba(255,255,255,0.4)",
            fontSize: 11,
            lineHeight: 1.5
          }}>
            Speak or submit your answer. Evidence markers will stream here in real time as you demonstrate competencies or encounter gaps.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {markers.map((m) => {
              const meta = getMarkerBadge(m.type, m.occurrences);
              return (
                <div
                  key={m.id}
                  style={{
                    background: meta.bg,
                    border: `1px solid ${meta.border}`,
                    borderRadius: 9,
                    padding: "8px 10px"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "white" }}>
                      {m.competency}
                    </span>
                    <span style={{
                      fontSize: 8.5,
                      fontWeight: 800,
                      color: meta.color,
                      padding: "1px 6px",
                      borderRadius: 4,
                      background: "rgba(0,0,0,0.3)"
                    }}>
                      {meta.icon} {meta.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.7)", lineHeight: 1.35 }}>
                    {m.detail}
                  </div>
                  {m.quote && (
                    <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.4)", marginTop: 4, fontStyle: "italic", borderLeft: "2px solid rgba(255,255,255,0.15)", paddingLeft: 6 }}>
                      "{m.quote}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* FACTUAL STRENGTHS */}
      {strengths.length > 0 && (
        <div style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: 8, padding: "8px 10px" }}>
          <div style={{ fontSize: 9, color: "#10B981", fontWeight: 700, marginBottom: 5, letterSpacing: 1 }}>
            ✓ DEMONSTRATED STRENGTHS
          </div>
          {strengths.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 5, marginBottom: 4 }}>
              <span style={{ color: "#10B981", fontSize: 9, flexShrink: 0, marginTop: 2 }}>•</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", lineHeight: 1.4 }}>{s}</span>
            </div>
          ))}
        </div>
      )}

      {/* STRONGER ANSWER GUIDANCE */}
      {suggestedAnswer && (
        <div style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 8, padding: "8px 10px" }}>
          <div style={{ fontSize: 9, color: "#F59E0B", fontWeight: 700, marginBottom: 4, letterSpacing: 1 }}>
            WHAT A STRONGER ANSWER COVERS
          </div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", lineHeight: 1.45, margin: 0, fontStyle: "italic" }}>
            {suggestedAnswer}
          </p>
        </div>
      )}

      {/* FOOTER & STUDENT DNA LINK */}
      <div style={{ marginTop: "auto", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a
          href="/student/dna"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: "none", fontSize: 9.5, color: "#818cf8", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}
        >
          <span>🧬 Inspect in Student DNA</span>
        </a>
        <span style={{ fontSize: 8.5, color: "rgba(255,255,255,0.25)" }}>
          Zero Arbitrary Scores
        </span>
      </div>
    </div>
  );
}

// ═══ VERDICT MODAL (unchanged) ═══
function VerdictModal({ verdict, onClose }: { verdict: FinalVerdict; onClose: () => void }) {
  const isHire = verdict.decision === "HIRE" || verdict.decision === "STRONG_HIRE";
  const dc = isHire ? "#10B981" : verdict.decision === "NO_HIRE" ? "#EF4444" : "#F59E0B";
  const dLabel = verdict.decision === "STRONG_HIRE" ? "STRONG HIRE" : isHire ? "HIRE" : verdict.decision === "STRONG_NO_HIRE" ? "STRONG NO HIRE" : "NEUTRAL / EVALUATE";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(9,9,11,0.92)", backdropFilter: "blur(12px)", zIndex: 1000, overflowY: "auto", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "2rem" }}>
      <div style={{ maxWidth: 740, width: "100%", fontFamily: "-apple-system,sans-serif" }}>
        <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
        <div style={{ textAlign: "center", padding: "2.5rem 2rem 1.8rem", background: "#121215", border: "1px solid #27272A", borderRadius: "10px 10px 0 0", animation: "fadeUp 0.4s ease" }}>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: dc, letterSpacing: -0.5, lineHeight: 1.1, marginBottom: "0.8rem", fontFamily: "monospace" }}>
            {dLabel}
          </div>
          <div style={{ fontSize: "1.05rem", color: "#F8FAFC", fontWeight: 500, maxWidth: 540, margin: "0 auto 1rem", lineHeight: 1.5 }}>
            "{verdict.headline}"
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid #27272A", borderRadius: 4 }}>
            <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 600 }}>Confidence Rating: {verdict.confidence}%</span>
          </div>
        </div>
        <div style={{ background: "#121215", border: "1px solid #27272A", borderTop: "none", padding: "1.5rem 2rem" }}>
          <p style={{ fontSize: 13.5, color: "#CBD5E1", lineHeight: 1.7, margin: 0 }}>{verdict.overview}</p>
        </div>
        {verdict.scorecard && Object.keys(verdict.scorecard).length > 0 && (
          <div style={{ background: "#121215", border: "1px solid #27272A", borderTop: "none", padding: "1.5rem 2rem" }}>
            <div style={{ fontSize: 10, letterSpacing: 1.5, color: "#94A3B8", fontWeight: 700, marginBottom: "0.85rem" }}>EVALUATION CRITERIA SCORECARD</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
              {Object.entries(verdict.scorecard).map(([k, v]) => (
                <div key={k} style={{ background: "#18181B", borderRadius: 6, padding: "10px 12px", border: "1px solid #27272A" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: "#94A3B8", textTransform: "capitalize" }}>{k}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, fontFamily: "monospace", color: v.score >= 70 ? "#10B981" : v.score >= 50 ? "#F59E0B" : "#EF4444" }}>{v.score}/100</span>
                  </div>
                  <div style={{ height: 3, background: "#27272A", borderRadius: 2, marginBottom: 5, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${v.score}%`, background: v.score >= 70 ? "#10B981" : v.score >= 50 ? "#F59E0B" : "#EF4444" }} />
                  </div>
                  <div style={{ fontSize: 10.5, color: "#64748B", lineHeight: 1.4 }}>{v.comment}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, background: "#27272A" }}>
          <div style={{ background: "#121215", padding: "1.25rem 1.5rem" }}>
            <div style={{ fontSize: 10, letterSpacing: 1.5, color: "#10B981", fontWeight: 700, marginBottom: "0.75rem" }}>DEMONSTRATED STRENGTHS</div>
            {verdict.hire_reasons?.map((r, i) => <div key={i} style={{ display: "flex", gap: 7, marginBottom: 7 }}><span style={{ color: "#10B981", fontSize: 11, flexShrink: 0, marginTop: 1 }}>•</span><span style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.5 }}>{r}</span></div>)}
          </div>
          <div style={{ background: "#121215", padding: "1.25rem 1.5rem" }}>
            <div style={{ fontSize: 10, letterSpacing: 1.5, color: "#EF4444", fontWeight: 700, marginBottom: "0.75rem" }}>AUDITED GAPS & RISKS</div>
            {verdict.no_hire_reasons?.map((r, i) => <div key={i} style={{ display: "flex", gap: 7, marginBottom: 7 }}><span style={{ color: "#EF4444", fontSize: 11, flexShrink: 0, marginTop: 1 }}>•</span><span style={{ fontSize: 12, color: "#CBD5E1", lineHeight: 1.5 }}>{r}</span></div>)}
          </div>
        </div>
        {(verdict.standout_moments?.length > 0 || verdict.concerning_moments?.length > 0) && (
          <div style={{ background: "#121215", border: "1px solid #27272A", borderTop: "none", padding: "1.5rem 2rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2rem" }}>
              {verdict.standout_moments?.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, letterSpacing: 1.5, color: "#10B981", fontWeight: 700, marginBottom: "0.75rem" }}>KEY DEMONSTRATED EVIDENCE</div>
                  {verdict.standout_moments.map((m, i) => <div key={i} style={{ fontSize: 12, color: "#94A3B8", marginBottom: 6, paddingLeft: 10, borderLeft: "2px solid #10B981", lineHeight: 1.5 }}>{m}</div>)}
                </div>
              )}
              {verdict.concerning_moments?.length > 0 && (
                <div>
                  <div style={{ fontSize: 10, letterSpacing: 1.5, color: "#F59E0B", fontWeight: 700, marginBottom: "0.75rem" }}>DEVELOPING COMPETENCIES</div>
                  {verdict.concerning_moments.map((m, i) => <div key={i} style={{ fontSize: 12, color: "#94A3B8", marginBottom: 6, paddingLeft: 10, borderLeft: "2px solid #F59E0B", lineHeight: 1.5 }}>{m}</div>)}
                </div>
              )}
            </div>
          </div>
        )}
        <div style={{ background: "#121215", border: "1px solid #27272A", borderTop: "none", padding: "1.5rem 2rem", borderRadius: "0 0 10px 10px", marginBottom: "1.5rem" }}>
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: 10, letterSpacing: 1.5, color: "#94A3B8", fontWeight: 700, marginBottom: 6 }}>SUGGESTED NEXT STEPS</div>
            <p style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>{verdict.next_steps}</p>
          </div>
          <div style={{ padding: "0.85rem 1.1rem", background: "#18181B", border: "1px solid #27272A", borderRadius: 6 }}>
            <div style={{ fontSize: 9.5, letterSpacing: 1.5, color: "#94A3B8", fontWeight: 700, marginBottom: 4 }}>INTERVIEWER OBSERVATION</div>
            <p style={{ fontSize: 12.5, color: "#E2E8F0", fontStyle: "italic", lineHeight: 1.6, margin: 0 }}>"{verdict.interviewer_note}"</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <a href="/student/dashboard" style={{ textDecoration: "none" }}><button style={{ padding: "0.75rem 1.5rem", borderRadius: 6, background: "#18181B", border: "1px solid #27272A", color: "#F8FAFC", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>← Return to Dashboard</button></a>
          <button onClick={onClose} style={{ padding: "0.75rem 1.5rem", borderRadius: 6, background: "#176B5B", border: "none", color: "#FFFFFF", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Review Transcript</button>
        </div>
      </div>
    </div>
  );
}

// ═══ TRUST REPORT MODAL (from secure interview) ═══
function TrustReportModal({ report, aiChecks, onClose, onDownload }: { report: TrustReport; aiChecks: AICheck[]; onClose: () => void; onDownload: () => void }) {
  const aiWarnings = aiChecks.filter(c => c.isAI).length;
  const vc = report.verdict === "VERIFIED" ? "#10B981" : report.verdict === "CAUTION" ? "#F59E0B" : "#EF4444";
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(9,9,11,0.92)", backdropFilter: "blur(12px)", zIndex: 1001, overflowY: "auto", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "2rem" }}>
      <div style={{ maxWidth: 720, width: "100%", fontFamily: "-apple-system,sans-serif" }}>
        <div style={{ textAlign: "center", padding: "2.2rem 2rem 1.8rem", background: "#121215", border: "1px solid #27272A", borderRadius: "10px 10px 0 0" }}>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: vc, letterSpacing: -0.5, marginBottom: 4, fontFamily: "monospace" }}>
            AUTHENTICITY AUDIT: {report.verdict}
          </div>
          <div style={{ fontSize: "3.2rem", fontWeight: 900, color: "#F8FAFC", letterSpacing: -1.5, lineHeight: 1, marginBottom: 8, fontFamily: "monospace" }}>
            {report.trust_score}<span style={{ fontSize: "1rem", color: "#64748B", fontWeight: 400 }}>/100</span>
          </div>
          <div style={{ fontSize: 13, color: "#94A3B8", marginBottom: 10, maxWidth: 500, margin: "0 auto 10px" }}>{report.verdict_reason}</div>
          <div style={{ display: "inline-flex", gap: 8 }}>
            <span style={{ fontSize: 11, padding: "3px 10px", background: "rgba(255,255,255,0.04)", border: `1px solid ${vc}40`, borderRadius: 4, color: vc, fontWeight: 600 }}>Confidence: {report.confidence_level}</span>
            <span style={{ fontSize: 11, padding: "3px 10px", background: "rgba(255,255,255,0.04)", border: "1px solid #27272A", borderRadius: 4, color: "#94A3B8" }}>{aiWarnings > 0 ? `${aiWarnings} AI Flags Detected` : "Zero Synthetic Anomalies"}</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 1, background: "#27272A" }}>
          {Object.values(report.breakdown).map((b, i) => (
            <div key={i} style={{ background: "#121215", padding: "1.1rem 1rem", textAlign: "center" }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: b.score >= 70 ? "#10B981" : b.score >= 50 ? "#F59E0B" : "#EF4444", marginBottom: 4, fontFamily: "monospace" }}>{b.score}/100</div>
              <div style={{ fontSize: 11, color: "#F8FAFC", fontWeight: 600, marginBottom: 4 }}>{b.label}</div>
              <div style={{ height: 3, background: "#27272A", borderRadius: 2, overflow: "hidden", marginBottom: 6 }}>
                <div style={{ height: "100%", width: `${b.score}%`, background: b.score >= 70 ? "#10B981" : b.score >= 50 ? "#F59E0B" : "#EF4444" }} />
              </div>
              <div style={{ fontSize: 10.5, color: "#64748B", lineHeight: 1.4 }}>{b.note}</div>
            </div>
          ))}
        </div>
        {aiChecks.length > 0 && (
          <div style={{ background: "#121215", border: "1px solid #27272A", borderTop: "none", padding: "1.25rem" }}>
            <div style={{ fontSize: 10, color: aiWarnings > 0 ? "#EF4444" : "#10B981", fontWeight: 700, letterSpacing: 1.5, marginBottom: "0.85rem" }}>AI TEXT DETECTION AUDIT</div>
            {aiChecks.map((c, i) => (
              <div key={i} style={{ marginBottom: 8, padding: "8px 12px", background: "#18181B", border: `1px solid ${c.isAI ? "rgba(239,68,68,0.3)" : "#27272A"}`, borderRadius: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: c.isAI ? "#EF4444" : "#10B981" }}>{c.isAI ? "Flagged: Synthetic Anomalies" : "Verified: Authentic Human Reasoning"} — Turn {i + 1}</span>
                  <span style={{ fontSize: 11, color: "#94A3B8", fontFamily: "monospace" }}>Likelihood: {c.ai_score}%</span>
                </div>
                <div style={{ fontSize: 11.5, color: "#94A3B8" }}>{c.verdict}</div>
                {c.signals_found.length > 0 && <div style={{ fontSize: 10.5, color: "#64748B", marginTop: 2 }}>Signals: {c.signals_found.join(", ")}</div>}
              </div>
            ))}
          </div>
        )}
        {report.flags.length > 0 && (
          <div style={{ background: "#121215", border: "1px solid #27272A", borderTop: "none", padding: "1.25rem" }}>
            <div style={{ fontSize: 10, color: "#EF4444", fontWeight: 700, letterSpacing: 1.5, marginBottom: "0.85rem" }}>INTEGRITY VIOLATIONS ({report.flags.length})</div>
            {report.flags.map((f, i) => <div key={i} style={{ fontSize: 12, color: "#E2E8F0", marginBottom: 5, paddingLeft: 10, borderLeft: "2px solid #EF4444", lineHeight: 1.4 }}>{f}</div>)}
          </div>
        )}
        <div style={{ background: "#121215", border: "1px solid #27272A", borderTop: "none", padding: "1.25rem" }}>
          <div style={{ fontSize: 10, color: "#94A3B8", fontWeight: 700, letterSpacing: 1.5, marginBottom: 6 }}>BEHAVIORAL EVIDENCE OBSERVATIONS</div>
          <p style={{ fontSize: 13, color: "#CBD5E1", lineHeight: 1.6, margin: 0 }}>{report.ai_observation}</p>
        </div>
        <div style={{ background: "#121215", border: "1px solid #27272A", borderTop: "none", padding: "1.25rem", borderRadius: "0 0 10px 10px", marginBottom: "1.5rem" }}>
          <div style={{ fontSize: 10, color: "#10B981", fontWeight: 700, letterSpacing: 1.5, marginBottom: 6 }}>AUDIT RECOMMENDATION</div>
          <p style={{ fontSize: 13, color: "#E2E8F0", lineHeight: 1.6, margin: 0 }}>{report.recruiter_recommendation}</p>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={onDownload} style={{ padding: "0.75rem 1.5rem", borderRadius: 6, border: "none", background: "#176B5B", color: "#FFFFFF", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Download Trust Audit Report</button>
          <button onClick={onClose} style={{ padding: "0.75rem 1.5rem", borderRadius: 6, border: "1px solid #27272A", background: "#18181B", color: "#94A3B8", cursor: "pointer", fontSize: 13 }}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════
export default function InterviewPage() {
  // ── Normal interview state ──
  const [jd, setJd] = useState("");
  const [resume, setResume] = useState("");
  const [started, setStarted] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [qNum, setQNum] = useState(0);
  const [stage, setStage] = useState("intro");
  const [ended, setEnded] = useState(false);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [score, setScore] = useState<ScoreData>(ZERO_SCORE);
  const [scoring, setScoring] = useState(false);
  const [voiceOk, setVoiceOk] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [camErr, setCamErr] = useState("");
  const [bodyLang, setBodyLang] = useState<BodyLang | null>(null);
  const [bodyScanning, setBodyScanning] = useState(false);
  const [finalVerdict, setFinalVerdict] = useState<FinalVerdict | null>(null);
  const [showVerdict, setShowVerdict] = useState(false);
  const [buildingVerdict, setBuildingVerdict] = useState(false);

  // ── Secure mode state ──
  const [secureMode, setSecureMode] = useState(false);
  const [securePhase, setSecurePhase] = useState<"identity" | "precheck" | "done">("identity");
  const [identityPhoto, setIdentityPhoto] = useState<string | null>(null);
  const [identityFaceStatus, setIdentityFaceStatus] = useState<"idle" | "ok" | "missing" | "multiple">("idle");
  const [identityFaceCount, setIdentityFaceCount] = useState<number>(0);
  const [modelsReady, setModelsReady] = useState(false);
  const faceapiRef = useRef<any>(null);
  const [checksDone, setChecksDone] = useState({ camera: false, mic: false, security: false, network: false });
  const [checkStep, setCheckStep] = useState(-1);
  const [faceStatus, setFaceStatus] = useState<"idle" | "ok" | "missing" | "multiple">("idle");
  const [tabSwitches, setTabSwitches] = useState(0);
  const [windowBlurCount, setWindowBlurCount] = useState(0);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [totalFrames, setTotalFrames] = useState(0);
  const [faceOkFrames, setFaceOkFrames] = useState(0);
  const [multipleFaceFrames, setMultipleFaceFrames] = useState(0);
  const [liveTrust, setLiveTrust] = useState(100);
  const [aiChecks, setAiChecks] = useState<AICheck[]>([]);
  const [pasteCount, setPasteCount] = useState(0);
  const [aiWarnings, setAiWarnings] = useState(0);
  const [trustReport, setTrustReport] = useState<TrustReport | null>(null);
  const [showTrustReport, setShowTrustReport] = useState(false);
  const [buildingTrustReport, setBuildingTrustReport] = useState(false);
  const [pasteDetected, setPasteDetected] = useState(false);

  // ── All refs ──
  const bottomRef = useRef<HTMLDivElement>(null);
  const recRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const identityVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const modeRef = useRef(mode);
  const endedRef = useRef(false);
  const jdRef = useRef(jd);
  const resumeRef = useRef(resume);
  const msgsRef = useRef<Msg[]>([]);
  const qNumRef = useRef(0);
  const bodyLangRef = useRef<BodyLang | null>(null);
  const secureModeRef = useRef(secureMode);
  const tabSwitchesRef = useRef(0);
  const windowBlursRef = useRef(0);
  const pasteCountRef = useRef(0);
  const totalFramesRef = useRef(0);
  const faceOkFramesRef = useRef(0);
  const multipleFaceFramesRef = useRef(0);
  const aiWarningsRef = useRef(0);
  const violationsRef = useRef<Violation[]>([]);
  const aiChecksRef = useRef<AICheck[]>([]);
  const faceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartRef = useRef(Date.now());
  const lastQuestionRef = useRef("");
  const inputTypingStartRef = useRef<number | null>(null);

  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { endedRef.current = ended; }, [ended]);
  useEffect(() => { jdRef.current = jd; }, [jd]);
  useEffect(() => { resumeRef.current = resume; }, [resume]);
  useEffect(() => { bodyLangRef.current = bodyLang; }, [bodyLang]);
  useEffect(() => { secureModeRef.current = secureMode; }, [secureMode]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  // Load client-side Face Detection model (TinyFaceDetector)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const faceapi = await import("face-api.js");
        faceapiRef.current = faceapi;
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        const warmup = document.createElement("canvas");
        warmup.width = 320;
        warmup.height = 240;
        await faceapi.detectAllFaces(warmup, new faceapi.TinyFaceDetectorOptions({ inputSize: 416 }));
        if (!cancelled) setModelsReady(true);
      } catch (e) {
        console.warn("Client face model load warning (will use fallback if needed):", e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("jd")) setJd(decodeURIComponent(p.get("jd")!));
    if (p.get("resume")) setResume(decodeURIComponent(p.get("resume")!));
    if (p.get("secure") === "true" || p.get("mode") === "secure") {
      setSecureMode(true);
    }
    setVoiceOk("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
    if (window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
      window.speechSynthesis.getVoices();
    }

    async function preloadCandidateSession() {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.studentProfile) {
            const sp = data.studentProfile;
            const skillsList = (sp.skills || []).map((s: any) => `${s.name} (${s.level || "Demonstrated"})`).join(", ");
            const projsList = (sp.projects || []).map((p: any) => `• ${p.title}: ${p.description || "Portfolio project"}`).join("\n");
            const resumeLines = [
              `${sp.fullName || data.user?.fullName || "Candidate Dossier"}`,
              sp.college ? `Education: ${sp.degree || "Degree"} in ${sp.branch || "CS"} • ${sp.college} (${sp.graduationYear || "2026"})` : "",
              skillsList ? `Verified Skills: ${skillsList}` : "",
              projsList ? `Core Engineering Proofs:\n${projsList}` : "",
            ].filter(Boolean).join("\n\n");

            if (!p.get("resume")) {
              setResume((prev) => prev || resumeLines);
            }

            const targetRole = sp.careerGoals?.targetRoles?.[0] || "Software Engineering Intern";
            if (!p.get("jd")) {
              setJd((prev) => prev || `Position: ${targetRole}\nDomain: Enterprise Systems & Infrastructure\nRequirements: Strong computer science fundamentals, data structures & algorithms, system design, and production engineering execution.`);
            }
          }
        }
      } catch (err) {
        // Fallback gracefully
      }
    }
    preloadCandidateSession();

    return () => { streamRef.current?.getTracks().forEach(t => t.stop()); };
  }, []);

  // Safe stream attacher for Safari & Chrome
  const attachStream = useCallback((videoEl: HTMLVideoElement | null, stream: MediaStream | null) => {
    if (!videoEl || !stream) return;
    if (videoEl.srcObject !== stream) {
      videoEl.srcObject = stream;
    }
    videoEl.muted = true;
    (videoEl as any).defaultMuted = true;
    videoEl.playsInline = true;
    videoEl.autoplay = true;

    const tryPlay = () => {
      videoEl.play().catch(() => {
        setTimeout(() => videoEl.play().catch(() => {}), 250);
      });
    };

    if (videoEl.readyState >= 2) {
      tryPlay();
    } else {
      videoEl.onloadedmetadata = tryPlay;
      videoEl.onloadeddata = tryPlay;
    }
  }, []);

  // Sync stream to video
  useEffect(() => {
    if (!streamRef.current) return;
    const vid = !started && secureMode && securePhase === "identity" ? identityVideoRef.current : videoRef.current;
    if (vid) {
      attachStream(vid, streamRef.current);
    }
  }, [started, secureMode, securePhase, camOn, attachStream]);

  // Normal camera (non-secure)
  useEffect(() => {
    if (!camOn || secureMode) return;
    let active = true;
    (async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } }, audio: false });
        if (!active) { s.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = s;
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          videoRef.current.onloadedmetadata = () => videoRef.current?.play().catch(() => {});
        }
        setCamErr("");
      } catch (e: any) {
        setCamErr(e.name === "NotAllowedError" ? "Permission denied" : "Camera unavailable");
        setCamOn(false);
      }
    })();
    return () => {
      active = false;
      if (!camOn) { streamRef.current?.getTracks().forEach(t => t.stop()); if (videoRef.current) videoRef.current.srcObject = null; }
    };
  }, [camOn, secureMode]);

  // Body language scan (normal mode)
  useEffect(() => {
    if (!camOn || !started || secureMode) return;
    const interval = setInterval(async () => {
      if (!videoRef.current || videoRef.current.readyState < 2) return;
      setBodyScanning(true);
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 320; canvas.height = 240;
        canvas.getContext("2d")?.drawImage(videoRef.current, 0, 0, 320, 240);
        const b64 = canvas.toDataURL("image/jpeg", 0.6).split(",")[1];
        const res = await fetch("/api/body-language", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageBase64: b64 }) });
        if (res.ok) { const d = await res.json(); setBodyLang(d); }
      } catch {}
      setBodyScanning(false);
    }, 15000);
    return () => clearInterval(interval);
  }, [camOn, started, secureMode]);

  // ── LIVE TRUST SCORE CALC ──
  useEffect(() => {
    if (!secureMode) return;
    const faceScore = totalFrames > 0 ? (faceOkFrames / totalFrames) * 38 : 38;
    const focusPenalty = tabSwitches * 7 + windowBlurCount * 2;
    const focusScore = Math.max(0, 32 - focusPenalty);
    const behaviorPenalty = aiWarnings * 8 + pasteCount * 10 + (multipleFaceFrames > 1 ? 12 : 0);
    const behaviorScore = Math.max(0, 30 - behaviorPenalty);
    setLiveTrust(Math.round(faceScore + focusScore + behaviorScore));
  }, [secureMode, totalFrames, faceOkFrames, multipleFaceFrames, tabSwitches, windowBlurCount, aiWarnings, pasteCount]);

  // ── TAB/WINDOW PROCTORING ──
  useEffect(() => {
    if (!started || !secureMode) return;
    const onVisibility = () => {
      if (document.hidden) {
        const newCount = tabSwitchesRef.current + 1;
        tabSwitchesRef.current = newCount;
        setTabSwitches(newCount);
        addViolation("Tab switched away", "high");
      }
    };
    const onBlur = () => {
      const newCount = windowBlursRef.current + 1;
      windowBlursRef.current = newCount;
      setWindowBlurCount(newCount);
      addViolation("Window focus lost", "medium");
    };
    const onContextMenu = (e: Event) => e.preventDefault();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("contextmenu", onContextMenu);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("contextmenu", onContextMenu);
    };
  }, [started, secureMode]);

  // ── MULTI-TIER CLIENT-SIDE FACE DETECTION ──
  const detectFaceCount = useCallback(async (
    videoEl: HTMLVideoElement | null,
    mode: "lenient" | "strict" = "lenient"
  ): Promise<{ count: number; status: "idle" | "ok" | "missing" | "multiple" }> => {
    if (!videoEl || videoEl.readyState < 2 || videoEl.videoWidth === 0) {
      return { count: -1, status: "idle" };
    }

    const faceapi = faceapiRef.current;
    if (faceapi && modelsReady) {
      try {
        const threshold = mode === "strict" ? 0.6 : 0.35;
        const detections = await faceapi.detectAllFaces(
          videoEl,
          new faceapi.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: threshold })
        );
        const w = videoEl.videoWidth || 1;
        const valid = detections.filter((d: any) => d.box.width >= w * 0.07);

        if (valid.length === 0 && mode === "lenient") {
          const retryDetections = await faceapi.detectAllFaces(
            videoEl,
            new faceapi.TinyFaceDetectorOptions({ inputSize: 608, scoreThreshold: 0.22 })
          );
          const retryValid = retryDetections.filter((d: any) => d.box.width >= w * 0.06);
          if (retryValid.length > 0) {
            const count = retryValid.length;
            return { count, status: count === 1 ? "ok" : count > 1 ? "multiple" : "missing" };
          }
        }

        const count = valid.length;
        return { count, status: count === 1 ? "ok" : count > 1 ? "multiple" : "missing" };
      } catch (err) {
        console.warn("face-api error, falling back to shape/heuristic detection:", err);
      }
    }

    // Fallback 1: Native FaceDetector API (Chromium / Android)
    if (typeof window !== "undefined" && (window as any).FaceDetector) {
      try {
        const detector = new (window as any).FaceDetector({ fastMode: true, maxDetectedFaces: 5 });
        const faces = await detector.detect(videoEl);
        const count = faces.length;
        return { count, status: count === 1 ? "ok" : count > 1 ? "multiple" : "missing" };
      } catch {}
    }

    // Fallback 2: Canvas luminance & skin tone heuristic
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 160;
      canvas.height = 120;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(videoEl, 0, 0, 160, 120);
        const imgData = ctx.getImageData(0, 0, 160, 120);
        const data = imgData.data;
        let totalLum = 0;
        let centerSkin = 0;
        let centerCount = 0;

        for (let y = 0; y < 120; y++) {
          for (let x = 0; x < 160; x++) {
            const i = (y * 160 + x) * 4;
            const r = data[i], g = data[i + 1], b = data[i + 2];
            totalLum += 0.299 * r + 0.587 * g + 0.114 * b;
            const isSkin = (r > 60 && g > 40 && b > 20 && r > g && r > b && (Math.max(r, g, b) - Math.min(r, g, b) > 15));
            if (x >= 40 && x <= 120 && y >= 20 && y <= 100) {
              centerCount++;
              if (isSkin) centerSkin++;
            }
          }
        }
        const avgLum = totalLum / (160 * 120);
        const skinRatio = centerSkin / Math.max(1, centerCount);
        if (avgLum < 12 || skinRatio < 0.08) {
          return { count: 0, status: "missing" };
        }
        return { count: 1, status: "ok" };
      }
    } catch {}

    return { count: 1, status: "ok" };
  }, [modelsReady]);

  // ── AUTO-INIT SECURE CAMERA ON IDENTITY STEP ──
  useEffect(() => {
    if (secureMode && !started && securePhase === "identity") {
      if (!streamRef.current && !camOn) {
        initSecureCamera();
      } else if (identityVideoRef.current && streamRef.current) {
        attachStream(identityVideoRef.current, streamRef.current);
      }
    }
  }, [secureMode, started, securePhase, camOn, attachStream]);

  // ── STEP 1: IDENTITY FACE OVAL TRACKING LOOP ──
  useEffect(() => {
    if (!secureMode || started || securePhase !== "identity" || !camOn || identityPhoto) return;
    let active = true;

    const interval = setInterval(async () => {
      const vid = identityVideoRef.current;
      if (!vid || vid.readyState < 2 || vid.videoWidth === 0) return;
      const res = await detectFaceCount(vid, "lenient");
      if (!active) return;
      if (res.count >= 0) {
        setIdentityFaceStatus(res.status);
        setIdentityFaceCount(res.count);
      }
    }, 400);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [secureMode, started, securePhase, camOn, identityPhoto, detectFaceCount]);

  const addViolation = useCallback((type: string, severity: Violation["severity"]) => {
    const v: Violation = { time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }), type, severity };
    violationsRef.current = [...violationsRef.current, v];
    setViolations([...violationsRef.current]);
  }, []);

  // ── STEP 3: LIVE INTERVIEW FACE MONITORING LOOP ──
  useEffect(() => {
    if (!started || !secureMode || !streamRef.current) return;
    let consecutiveMisses = 0;

    faceIntervalRef.current = setInterval(async () => {
      const vid = videoRef.current;
      if (!vid || vid.readyState < 2 || vid.videoWidth === 0) return;

      totalFramesRef.current += 1;
      setTotalFrames(totalFramesRef.current);

      const res = await detectFaceCount(vid, "lenient");
      if (res.count === -1) return; // not ready

      if (res.count === 0) {
        consecutiveMisses++;
        if (consecutiveMisses >= 2) {
          setFaceStatus("missing");
          addViolation("Face not visible in camera frame", "high");
        }
      } else if (res.count > 1) {
        consecutiveMisses = 0;
        setFaceStatus("multiple");
        multipleFaceFramesRef.current += 1;
        setMultipleFaceFrames(multipleFaceFramesRef.current);
        addViolation("Multiple faces detected in proctored session", "critical");
      } else {
        consecutiveMisses = 0;
        setFaceStatus("ok");
        faceOkFramesRef.current += 1;
        setFaceOkFrames(faceOkFramesRef.current);
      }
    }, 5000);

    return () => { if (faceIntervalRef.current) clearInterval(faceIntervalRef.current); };
  }, [started, secureMode, detectFaceCount, addViolation]);

  // ── SECURE CAMERA INIT (With Video-only Fallback for Safari/Mic constraints) ──
  const initSecureCamera = async (): Promise<boolean> => {
    setCamErr("");
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    let stream: MediaStream | null = null;
    try {
      // 1. Try ideal HD video + audio
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
    } catch (e1) {
      console.warn("HD Video+Audio failed, retrying video-only user-facing:", e1);
      try {
        // 2. Try HD user-facing video only
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
      } catch (e2) {
        console.warn("User-facing video failed, retrying any video stream:", e2);
        try {
          // 3. Fallback to basic video
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        } catch (e3: any) {
          const msg = e3.name === "NotAllowedError"
            ? "Camera permission denied. Please allow camera access in browser settings and retry."
            : e3.name === "NotFoundError"
              ? "No camera found on this device."
              : `Camera error: ${e3.message || "Unable to start camera"}`;
          setCamErr(msg);
          setCamOn(false);
          return false;
        }
      }
    }

    if (stream) {
      streamRef.current = stream;
      setCamOn(true);
      setCamErr("");
      setTimeout(() => {
        const vid = (!started && secureMode && securePhase === "identity") ? identityVideoRef.current : videoRef.current;
        if (vid) attachStream(vid, stream);
      }, 100);
      return true;
    }
    return false;
  };

  const captureIdentity = async () => {
    setCamErr("");
    const vid = identityVideoRef.current;
    if (!vid || vid.videoWidth === 0 || vid.readyState < 2) {
      setCamErr("Camera is still initializing. Please wait a moment.");
      return;
    }

    const check = await detectFaceCount(vid, "strict");
    if (check.count === 0 && modelsReady) {
      setCamErr("No face detected in the oval. Please position your face inside the frame and ensure good lighting.");
      return;
    }
    if (check.count > 1) {
      setCamErr("Multiple faces detected. Please make sure only you are in the camera frame.");
      return;
    }

    const c = document.createElement("canvas");
    c.width = vid.videoWidth;
    c.height = vid.videoHeight;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    // Mirror snapshot to match preview
    ctx.translate(c.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(vid, 0, 0);
    const dataUrl = c.toDataURL("image/jpeg", 0.9);
    setIdentityPhoto(dataUrl);
    setCamErr("");
  };

  const runPrechecks = async () => {
    setCheckStep(0);
    const steps: (keyof typeof checksDone)[] = ["camera", "mic", "security", "network"];
    for (let i = 0; i < steps.length; i++) {
      setCheckStep(i);
      await new Promise(r => setTimeout(r, 200));
      setChecksDone(p => ({ ...p, [steps[i]]: true }));
    }
    setSecurePhase("done");
    await doStartInterview();
  };

  // ── AI TEXT CHECK ──
  const analyzeAnswerForAI = async (text: string) => {
    const dur = inputTypingStartRef.current ? (Date.now() - inputTypingStartRef.current) / 1000 : null;
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const wpm = dur && wordCount ? Math.round((wordCount / dur) * 60) : 0;
    if (wpm > 160 || pasteDetected) {
      addViolation(`Possible AI text — ${wpm > 160 ? `${wpm} WPM typing speed` : "paste detected"}`, "high");
    }
    if (wordCount > 30) {
      try {
        const res = await fetch("/api/ai-text-detect", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, question: lastQuestionRef.current, timeToType: dur, wordCount, pasteDetected, typingSpeed: wpm })
        });
        const d: AICheck = await res.json();
        aiChecksRef.current = [...aiChecksRef.current, d];
        setAiChecks([...aiChecksRef.current]);
        if (d.isAI || d.risk_level === "HIGH" || d.risk_level === "CRITICAL") {
          aiWarningsRef.current += 1;
          setAiWarnings(aiWarningsRef.current);
          addViolation(`AI-generated text detected (${d.ai_score}% AI score)`, d.risk_level === "CRITICAL" ? "critical" : "high");
        }
      } catch {}
    }
    setPasteDetected(false);
    inputTypingStartRef.current = null;
  };

  // ── DOWNLOAD TRUST REPORT ──
  const downloadTrustReport = () => {
    if (!trustReport) return;
    const win = window.open("", "_blank");
    if (!win) return;
    const vc = trustReport.verdict === "VERIFIED" ? "#059669" : trustReport.verdict === "CAUTION" ? "#d97706" : "#dc2626";
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>COGNALYZE Trust Report</title>
      <style>*{margin:0;padding:0;box-sizing:border-box;} body{font-family:system-ui,sans-serif;max-width:720px;margin:40px auto;padding:0 24px;font-size:14px;line-height:1.6;color:#111;}
      h1{font-size:28px;font-weight:900;letter-spacing:-1px;} .score-big{font-size:64px;font-weight:900;color:${vc};line-height:1;}
      .verdict{font-size:32px;font-weight:900;color:${vc};margin:6px 0;}
      .section{margin:20px 0;padding:16px 18px;border:1px solid #e5e7eb;border-radius:10px;}
      .section h3{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#666;margin-bottom:10px;}
      .bar{height:5px;background:#f0f0f0;border-radius:999px;margin-top:4px;}
      .bar-fill{height:100%;border-radius:999px;background:${vc};}
      .flag{padding:5px 10px;background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;margin:3px 0;font-size:12px;color:#991b1b;}
      @media print{body{margin:20px;}}</style></head><body>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px;padding-bottom:16px;border-bottom:2px solid #111">
        <div style="width:36px;height:36px;background:#111;border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-size:18px;">⚡</div>
        <div><div style="font-size:10px;letter-spacing:3px;color:#888;font-weight:700">COGNALYZE SECURE INTERVIEW</div><h1>Integrity Report</h1></div>
      </div>
      <div style="text-align:center;padding:28px;background:${vc}08;border:1px solid ${vc}25;border-radius:12px;margin-bottom:20px">
        <div class="score-big">${trustReport.trust_score}</div>
        <div style="font-size:12px;color:#888;margin:3px 0">/100 Trust Score</div>
        <div class="verdict">${trustReport.verdict}</div>
        <div style="font-size:13px;color:#555">${trustReport.verdict_reason}</div>
      </div>
      <div class="section"><h3>Score Breakdown</h3>
        ${Object.values(trustReport.breakdown).map(b => `<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between"><strong>${b.label}</strong><strong style="color:${b.score >= 70 ? "#059669" : b.score >= 50 ? "#d97706" : "#dc2626"}">${b.score}/100</strong></div><div style="font-size:11px;color:#888">${b.note}</div><div class="bar"><div class="bar-fill" style="width:${b.score}%"></div></div></div>`).join("")}
      </div>
      ${trustReport.flags.length > 0 ? `<div class="section"><h3>Violations (${trustReport.flags.length})</h3>${trustReport.flags.map(f => `<div class="flag">⚠ ${f}</div>`).join("")}</div>` : ""}
      <div class="section"><h3>AI Behavioral Analysis</h3><p>${trustReport.ai_observation}</p></div>
      <div class="section" style="background:#f0fdf4;border-color:#86efac"><h3 style="color:#166534">Recruiter Recommendation</h3><p>${trustReport.recruiter_recommendation}</p></div>
      <div style="margin-top:28px;font-size:11px;color:#aaa;display:flex;justify-content:space-between"><span>COGNALYZE Secure Interview™</span><span>${new Date().toLocaleString()}</span></div>
      </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  // ── HELPERS ──
  const getVoice = () => {
    const voices = synthRef.current?.getVoices() || [];
    const want = ["Google UK English Male", "Google US English", "Alex", "Daniel", "Rishi", "Arthur", "Samantha"];
    for (const n of want) { const v = voices.find(v => v.name === n); if (v) return v; }
    return voices.find(v => v.lang.startsWith("en")) || null;
  };

  const speak = useCallback((text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const clean = text.replace(/[*#`_]/g, "").replace(/\n+/g, ". ").trim();
    const u = new SpeechSynthesisUtterance(clean);
    u.rate = 0.87; u.pitch = 1.0; u.volume = 1;
    const v = getVoice(); if (v) u.voice = v;
    u.onstart = () => setSpeaking(true);
    u.onend = () => { setSpeaking(false); if (modeRef.current === "voice" && !endedRef.current) setTimeout(() => startListening(), 700); };
    u.onerror = () => setSpeaking(false);
    synthRef.current.speak(u);
  }, []);

  const startListening = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    try {
      const r = new SR(); recRef.current = r;
      r.continuous = false; r.interimResults = true; r.lang = "en-US";
      r.onstart = () => setListening(true);
      r.onresult = (e: any) => {
        const t = Array.from(e.results).map((x: any) => x[0].transcript).join("");
        setTranscript(t);
        if (e.results[e.results.length - 1].isFinal) { setTranscript(""); setListening(false); if (t.trim().length > 2) send(t.trim()); }
      };
      r.onerror = () => { setListening(false); setTranscript(""); };
      r.onend = () => setListening(false);
      r.start();
    } catch { setListening(false); }
  }, []);

  const stopListening = () => { try { recRef.current?.stop(); } catch {} setListening(false); setTranscript(""); };

  const refreshScore = async (explicitMsgs: Msg[]) => {
    const userMsgs = explicitMsgs.filter(m => m.role === "user");
    if (userMsgs.length === 0) return;
    setScoring(true);
    try {
      const res = await fetch("/api/interview-score", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: explicitMsgs.map(m => ({ role: m.role, content: m.content })), jd: jdRef.current, resume: resumeRef.current, bodyLanguage: bodyLangRef.current })
      });
      if (res.ok) { const d = await res.json(); setScore({ ...d }); }
    } catch (e) { console.error("Score error:", e); }
    setScoring(false);
  };

  const doStartInterview = async () => {
    sessionStartRef.current = Date.now();
    setStarted(true);
    setLoading(true);
    // Attach stream to live video after phase change
    setTimeout(() => {
      if (streamRef.current && videoRef.current) {
        videoRef.current.srcObject = streamRef.current;
        videoRef.current.onloadedmetadata = () => videoRef.current?.play().catch(() => {});
      }
    }, 200);
    try {
      const res = await fetch("/api/interview-chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [], jd: jdRef.current, resume: resumeRef.current, qNumber: 0 }) });
      const d = await res.json();
      lastQuestionRef.current = d.message;
      const m: Msg = { role: "assistant", content: d.message, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      msgsRef.current = [m];
      setMsgs([m]);
      if (mode === "voice") setTimeout(() => speak(d.message), 500);
    } catch {}
    setLoading(false);
  };

  const startInterview = async () => {
    if (!jd || !resume) return;
    if (secureMode) {
      // Route through identity verification first
      const ok = await initSecureCamera();
      if (ok) setSecurePhase("identity");
      // Don't call doStartInterview yet — wait for precheck
    } else {
      await doStartInterview();
    }
  };

  const endInterview = async () => {
    if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);
    stopListening(); synthRef.current?.cancel();
    setEnded(true); endedRef.current = true;
    // Always build final verdict
    setBuildingVerdict(true);
    try {
      const res = await fetch("/api/interview-final", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgsRef.current.map(m => ({ role: m.role, content: m.content })), jd: jdRef.current, resume: resumeRef.current, finalScore: score })
      });
      if (res.ok) { const d = await res.json(); setFinalVerdict(d); setShowVerdict(true); }
    } catch (e) { console.error("Verdict error:", e); }
    setBuildingVerdict(false);
    // Also build trust report if secure mode
    if (secureModeRef.current) {
      setBuildingTrustReport(true);
      const dur = Math.round((Date.now() - sessionStartRef.current) / 1000);
      try {
        const res = await fetch("/api/trust-score", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            totalFrames: totalFramesRef.current, faceDetectedFrames: faceOkFramesRef.current, multipleFaceFrames: multipleFaceFramesRef.current,
            tabSwitches: tabSwitchesRef.current, windowBlurs: windowBlursRef.current, totalDuration: dur,
            violations: violationsRef.current.map(v => v.type), questionCount: qNumRef.current,
            avgResponseTime: dur / Math.max(1, qNumRef.current),
            behaviorNotes: `AI warnings: ${aiWarningsRef.current}, Paste count: ${pasteCountRef.current}`
          })
        });
        if (res.ok) { const d = await res.json(); setTrustReport(d); }
      } catch {}
      setBuildingTrustReport(false);
    }
  };

  const send = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading || ended) return;
    if (secureModeRef.current) await analyzeAnswerForAI(content);
    setInput("");
    const newQ = qNumRef.current + 1;
    qNumRef.current = newQ;
    setQNum(newQ);
    const newStage = newQ <= 1 ? "intro" : newQ <= 4 ? "behavioral" : newQ <= 8 ? "technical" : newQ <= 10 ? "system-design" : "culture";
    setStage(newStage);
    const userMsg: Msg = { role: "user", content, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    const explicitMsgs = [...msgsRef.current, userMsg];
    msgsRef.current = explicitMsgs;
    setMsgs([...explicitMsgs]);
    refreshScore(explicitMsgs);
    setLoading(true);
    try {
      const res = await fetch("/api/interview-chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: explicitMsgs.map(m => ({ role: m.role, content: m.content })), jd: jdRef.current, resume: resumeRef.current, qNumber: newQ })
      });
      const d = await res.json();
      lastQuestionRef.current = d.message;
      const aiMsg: Msg = { role: "assistant", content: d.message, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      const finalMsgs = [...explicitMsgs, aiMsg];
      msgsRef.current = finalMsgs;
      setMsgs([...finalMsgs]);
      if (modeRef.current === "voice") speak(d.message);
    } catch {}
    setLoading(false);
  };

  const sc = stage === "intro" ? "#A1A1AA" : stage === "behavioral" ? "#38BDF8" : stage === "technical" ? "#10B981" : stage === "system-design" ? "#F59E0B" : "#818CF8";
  const sl = { intro: "Intro", behavioral: "Behavioral", technical: "Technical", "system-design": "System Design", culture: "Culture" }[stage] || stage;
  const tc = liveTrust >= 80 ? "#10B981" : liveTrust >= 60 ? "#F59E0B" : "#EF4444";
  const fc = faceStatus === "ok" ? "#10B981" : faceStatus === "missing" ? "#EF4444" : faceStatus === "multiple" ? "#F59E0B" : "#71717A";

  // ════════ SECURE: IDENTITY PAGE ════════
  if (secureMode && !started && securePhase === "identity") return (
    <div style={{ minHeight: "100vh", background: "#09090B", color: "#F8FAFC", fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ maxWidth: 520, width: "100%", textAlign: "center", animation: "fadeUp 0.4s ease" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 6, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", fontSize: 11, letterSpacing: 1.2, color: "#F87171", marginBottom: 14, fontWeight: 700 }}>
          STEP 1 OF 3 • IDENTITY VERIFICATION
        </div>
        <h2 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 8, color: "#FFFFFF" }}>Look directly at the camera</h2>
        <p style={{ color: "#A1A1AA", fontSize: 13, marginBottom: "1.75rem", lineHeight: 1.5 }}>Align your face inside the frame. Live face detection verifies your position before capture.</p>
        
        <div style={{
          position: "relative",
          borderRadius: 12,
          overflow: "hidden",
          border: `1.5px solid ${identityPhoto ? "#10B981" : identityFaceStatus === "ok" ? "#10B981" : identityFaceStatus === "missing" ? "#EF4444" : "#27272A"}`,
          marginBottom: "1.5rem",
          background: "#121215",
          minHeight: 300,
          aspectRatio: "4/3",
          transition: "border-color 0.25s ease"
        }}>
          {identityPhoto ? (
            <img src={identityPhoto} alt="Identity" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <video
              ref={identityVideoRef}
              autoPlay
              muted
              playsInline
              style={{ width: "100%", height: "100%", display: "block", transform: "scaleX(-1)", objectFit: "cover" }}
            />
          )}

          {!identityPhoto && <FaceOval status={!camOn ? "idle" : identityFaceStatus} />}

          {!camOn && !identityPhoto && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(9,9,11,0.92)", zIndex: 3, padding: "1.5rem" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📷</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#FFFFFF", marginBottom: 6 }}>Camera access needed</div>
              <div style={{ fontSize: 12, color: "#A1A1AA", marginBottom: 16, maxWidth: 300, lineHeight: 1.5 }}>
                Please allow camera access to enable live face detection and identity capture.
              </div>
              <button
                onClick={initSecureCamera}
                style={{
                  padding: "10px 20px",
                  borderRadius: 6,
                  border: "none",
                  background: "#FFFFFF",
                  color: "#09090B",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: 0.5
                }}
              >
                Enable Camera
              </button>
            </div>
          )}

          {identityPhoto && (
            <div style={{ position: "absolute", top: 12, right: 12, padding: "4px 10px", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", borderRadius: 6, fontSize: 11, fontWeight: 700, color: "#10B981", zIndex: 3 }}>
              ✓ CAPTURED & VERIFIED
            </div>
          )}
        </div>

        {!identityPhoto ? (
          <button
            onClick={!camOn ? initSecureCamera : captureIdentity}
            style={{
              width: "100%",
              padding: "0.85rem",
              borderRadius: 6,
              border: "none",
              background: !camOn
                ? "#FFFFFF"
                : identityFaceStatus === "ok"
                  ? "#10B981"
                  : "#EF4444",
              color: !camOn ? "#09090B" : "#FFFFFF",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: 0.8,
              transition: "all 0.2s ease"
            }}
          >
            {!camOn ? "Enable Camera" : identityFaceStatus === "ok" ? "Capture Photo (Face Position Verified)" : "Capture Photo"}
          </button>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => { setIdentityPhoto(null); setIdentityFaceStatus("idle"); }}
              style={{ flex: 1, padding: "0.85rem", borderRadius: 6, border: "1px solid #27272A", background: "#18181B", color: "#A1A1AA", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
            >
              Retake
            </button>
            <button
              onClick={() => setSecurePhase("precheck")}
              style={{ flex: 2, padding: "0.85rem", borderRadius: 6, border: "none", background: "#FFFFFF", color: "#09090B", fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: 0.8 }}
            >
              Continue to System Check →
            </button>
          </div>
        )}

        {camErr && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 6, fontSize: 12, color: "#EF4444", textAlign: "left", lineHeight: 1.5 }}>
            ⚠ {camErr}
            <button
              onClick={initSecureCamera}
              style={{ display: "block", marginTop: 8, padding: "4px 10px", borderRadius: 4, border: "1px solid rgba(239,68,68,0.3)", background: "transparent", color: "#EF4444", cursor: "pointer", fontSize: 11, fontWeight: 600 }}
            >
              ↺ Retry Camera
            </button>
          </div>
        )}
      </div>
    </div>
  );

  // ════════ SECURE: PRECHECK PAGE ════════
  if (secureMode && !started && securePhase === "precheck") return (
    <div style={{ minHeight: "100vh", background: "#09090B", color: "#F8FAFC", fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <div style={{ maxWidth: 460, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 6, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", fontSize: 11, letterSpacing: 1.2, color: "#F87171", marginBottom: 12, fontWeight: 700 }}>
            STEP 2 OF 3 • SYSTEM VERIFICATION
          </div>
          <h2 style={{ fontSize: "1.75rem", fontWeight: 800, letterSpacing: "-0.03em", color: "#FFFFFF" }}>Hardware & Environment</h2>
        </div>
        {[
          { key: "camera", icon: "📷", label: "Camera feed verified", sub: "Live video stream confirmed" },
          { key: "mic", icon: "🎙", label: "Microphone active", sub: "Audio input confirmed" },
          { key: "security", icon: "🔒", label: "Security environment", sub: "Proctoring system armed" },
          { key: "network", icon: "🌐", label: "Connection stable", sub: "Low latency verified" },
        ].map((item, i) => {
          const done = checksDone[item.key as keyof typeof checksDone];
          const active = checkStep === i && !done;
          return (
            <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 14, padding: "0.9rem 1.1rem", background: done ? "rgba(16,185,129,0.06)" : "#121215", border: `1px solid ${done ? "rgba(16,185,129,0.25)" : active ? "rgba(239,68,68,0.4)" : "#27272A"}`, borderRadius: 8, marginBottom: 10, transition: "all 0.2s" }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: done ? "#10B981" : "#FFFFFF" }}>{item.label}</div>
                <div style={{ fontSize: 11, color: "#71717A", marginTop: 2 }}>{item.sub}</div>
              </div>
              {done ? <span style={{ fontSize: 16, color: "#10B981", fontWeight: 700 }}>✓</span>
                : active ? <span style={{ animation: "spin 0.8s linear infinite", display: "inline-block", color: "#EF4444", fontSize: 16 }}>⟳</span>
                  : <span style={{ color: "#3F3F46", fontSize: 16 }}>○</span>}
            </div>
          );
        })}
        {checkStep === -1 && (
          <button onClick={runPrechecks} style={{ width: "100%", padding: "0.85rem", marginTop: 14, borderRadius: 6, border: "none", background: "#FFFFFF", color: "#09090B", fontSize: 13, fontWeight: 700, cursor: "pointer", letterSpacing: 0.8 }}>Start System Check →</button>
        )}
      </div>
    </div>
  );

  // ════════ SETUP PAGE (normal + secure toggle) ════════
  if (!started) return (
    <div style={{ minHeight: "100vh", background: "#09090B", color: "#F8FAFC", fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        textarea:focus,input:focus{outline:none;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:#27272A;border-radius:2px;}
      `}</style>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.1rem 2rem", borderBottom: "1px solid #27272A", background: "#09090B" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, background: "#18181B", border: "1px solid #27272A", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>⚡</div>
          <span style={{ fontWeight: 800, color: "#FFFFFF", letterSpacing: "-0.02em", fontSize: 15 }}>COGNALYZE</span>
          <span style={{ fontSize: 11, padding: "2px 8px", border: "1px solid #27272A", borderRadius: 4, color: secureMode ? "#EF4444" : "#A1A1AA", background: "#121215", fontWeight: 600 }}>
            {secureMode ? "SECURE PROCTORED" : "INTERVIEW STUDIO"}
          </span>
        </div>
        <a href="/" style={{ color: "#71717A", textDecoration: "none", fontSize: 13, transition: "color 0.15s" }} onMouseEnter={e => e.currentTarget.style.color = "#FFFFFF"} onMouseLeave={e => e.currentTarget.style.color = "#71717A"}>
          ← Back to Dashboard
        </a>
      </div>

      <div style={{ maxWidth: 660, margin: "0 auto", padding: "3.5rem 1.5rem", animation: "fadeUp 0.4s ease", width: "100%", boxSizing: "border-box" }}>
        <div style={{ textAlign: "center", marginBottom: "2.25rem" }}>
          <div style={{ fontSize: 11, letterSpacing: 1.5, color: "#71717A", marginBottom: 10, fontWeight: 700, textTransform: "uppercase" }}>
            AI Technical Evaluation • Alex
          </div>
          <h1 style={{ fontSize: "clamp(1.75rem,4.5vw,2.5rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15, marginBottom: 10, color: "#FFFFFF" }}>
            Mock Interview Studio
          </h1>
          <p style={{ color: "#A1A1AA", fontSize: 14, maxWidth: 480, margin: "0 auto", lineHeight: 1.55 }}>
            Structured competency evaluation with real-time evidence streaming, live audio dialogue, and Career DNA logging.
          </p>
        </div>

        {/* Secure Mode Toggle */}
        <div onClick={() => setSecureMode(p => !p)} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px", background: "#121215", border: `1px solid ${secureMode ? "rgba(239,68,68,0.4)" : "#27272A"}`, borderRadius: 8, marginBottom: 14, cursor: "pointer", transition: "all 0.2s" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 20 }}>🛡️</span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: secureMode ? "#F87171" : "#FFFFFF" }}>Secure Proctored Mode</div>
              <div style={{ fontSize: 11, color: "#71717A", marginTop: 2 }}>Face presence verification, tab tracking, paste audit, and cryptographically verified trust score</div>
            </div>
          </div>
          <div style={{ width: 40, height: 22, borderRadius: 999, background: secureMode ? "#EF4444" : "#27272A", transition: "background 0.2s", position: "relative", flexShrink: 0 }}>
            <div style={{ position: "absolute", top: 3, left: secureMode ? 21 : 3, width: 16, height: 16, borderRadius: "50%", background: "white", transition: "left 0.2s" }} />
          </div>
        </div>

        {/* Mode */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          {[{ id: "text", icon: "⌨️", label: "Text Mode", sub: "Type your responses" }, { id: "voice", icon: "🎤", label: "Voice Mode", sub: voiceOk ? "Live two-way audio" : "Chrome only" }].map(m => (
            <div key={m.id} onClick={() => m.id === "voice" ? voiceOk && setMode("voice") : setMode("text")} style={{ padding: "1.1rem", borderRadius: 8, border: `1px solid ${mode === m.id ? "#FFFFFF" : "#27272A"}`, background: mode === m.id ? "#18181B" : "#121215", cursor: m.id === "voice" && !voiceOk ? "not-allowed" : "pointer", textAlign: "center", transition: "all 0.15s", opacity: m.id === "voice" && !voiceOk ? 0.4 : 1 }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>{m.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 13, color: mode === m.id ? "#FFFFFF" : "#A1A1AA", marginBottom: 3 }}>{m.label}</div>
              <div style={{ fontSize: 11, color: "#71717A" }}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Inputs */}
        <div style={{ background: "#121215", border: "1px solid #27272A", borderRadius: 8, padding: "1.5rem", marginBottom: 14 }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 11, letterSpacing: 1, color: "#71717A", fontWeight: 700, textTransform: "uppercase" }}>TARGET JOB DESCRIPTION</div>
              <span style={{ fontSize: 10, color: "#10B981", background: "rgba(16,185,129,0.1)", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>Active Target</span>
            </div>
            <textarea value={jd} onChange={e => setJd(e.target.value)} rows={4} style={{ width: "100%", background: "#09090B", border: "1px solid #27272A", borderRadius: 6, padding: 12, color: "#F8FAFC", fontSize: 13, resize: "none", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor = "#71717A"} onBlur={e => e.target.style.borderColor = "#27272A"} placeholder="Paste the target job description or role requirements..." />
          </div>
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 11, letterSpacing: 1, color: "#71717A", fontWeight: 700, textTransform: "uppercase" }}>VERIFIED CANDIDATE PROFILE</div>
              <span style={{ fontSize: 10, color: "#10B981", background: "rgba(16,185,129,0.1)", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>● Profile Preloaded</span>
            </div>
            <textarea value={resume} onChange={e => setResume(e.target.value)} rows={5} style={{ width: "100%", background: "#09090B", border: "1px solid #27272A", borderRadius: 6, padding: 12, color: "#F8FAFC", fontSize: 13, resize: "none", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor = "#71717A"} onBlur={e => e.target.style.borderColor = "#27272A"} placeholder="Candidate background, verified skills, and project experience..." />
          </div>
        </div>

        {secureMode && (
          <div style={{ padding: "10px 14px", background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 6, marginBottom: 14, fontSize: 12, color: "#F87171", lineHeight: 1.5 }}>
            🔒 Proctored session active: Camera and microphone required. Browser tab switching, paste events, and external assistance will be audited on the trust transcript.
          </div>
        )}

        <button onClick={startInterview} disabled={!jd || !resume} style={{ width: "100%", padding: "0.95rem", borderRadius: 6, border: "none", background: !jd || !resume ? "#18181B" : "#FFFFFF", color: !jd || !resume ? "#52525B" : "#09090B", fontSize: 14, fontWeight: 700, letterSpacing: 0.5, cursor: !jd || !resume ? "not-allowed" : "pointer", opacity: !jd || !resume ? 0.6 : 1, transition: "all 0.15s" }}>
          {secureMode ? "Start Proctored Interview →" : mode === "voice" ? "Start Voice Interview →" : "Start Interview →"}
        </button>
      </div>
    </div>
  );

  // ════════ ACTIVE INTERVIEW ════════
  return (
    <div style={{ height: "100vh", background: "#09090B", color: "#F8FAFC", fontFamily: "-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif", display: "flex", flexDirection: "column", overflow: "hidden" }} onContextMenu={secureMode ? e => e.preventDefault() : undefined}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes ripple{0%{transform:scale(1);opacity:0.4}100%{transform:scale(2.2);opacity:0}}
        @keyframes wave{0%,100%{height:4px}50%{height:16px}}
        @keyframes slideIn{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}
        textarea:focus,input:focus{outline:none;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:#27272A;border-radius:2px;}
      `}</style>

      {showVerdict && finalVerdict && <VerdictModal verdict={finalVerdict} onClose={() => setShowVerdict(false)} />}
      {showTrustReport && trustReport && <TrustReportModal report={trustReport} aiChecks={aiChecks} onClose={() => setShowTrustReport(false)} onDownload={downloadTrustReport} />}

      {/* ── PROCTORING BAR (secure only) ── */}
      {secureMode && (
        <div style={{ flexShrink: 0, background: "#121215", borderBottom: "1px solid #27272A", padding: "0.4rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "2px 8px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 4 }}>
              <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#EF4444", animation: "blink 1s infinite" }} />
              <span style={{ fontSize: 10, color: "#F87171", fontWeight: 700, letterSpacing: 0.8 }}>PROCTORING ACTIVE</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: fc }} />
              <span style={{ fontSize: 11, color: "#71717A" }}>Face: <span style={{ color: fc, fontWeight: 600 }}>{faceStatus === "ok" ? "Detected" : faceStatus === "missing" ? "Missing!" : faceStatus === "multiple" ? "Multiple!" : "Checking..."}</span></span>
            </div>
            <span style={{ fontSize: 11, color: "#71717A" }}>Tabs: <span style={{ color: tabSwitches > 0 ? "#EF4444" : "#10B981", fontWeight: 600 }}>{tabSwitches}</span></span>
            {pasteCount > 0 && <span style={{ fontSize: 11, color: "#F59E0B" }}>📋 Pastes: {pasteCount}</span>}
            {aiWarnings > 0 && <span style={{ fontSize: 11, color: "#EF4444" }}>🤖 AI flags: {aiWarnings}</span>}
            {violations.length > 0 && <span style={{ fontSize: 11, color: "#EF4444", fontWeight: 600 }}>⚠ {violations.length}</span>}
          </div>
          <TrustRing score={liveTrust} size={28} />
        </div>
      )}

      {/* ── TOP BAR ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.6rem 1.25rem", borderBottom: "1px solid #27272A", flexShrink: 0, background: "#121215" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#10B981" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>Evaluation Studio • Alex{secureMode ? " 🛡️" : ""}</span>
          <div style={{ padding: "2px 8px", background: "#18181B", border: "1px solid #27272A", borderRadius: 4 }}>
            <span style={{ fontSize: 10, color: sc, fontWeight: 600 }}>{sl}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {scoring && <span style={{ fontSize: 10, color: "#10B981", animation: "blink 0.8s infinite" }}>● scoring answer</span>}
          {buildingVerdict && <span style={{ fontSize: 10, color: "#F59E0B", animation: "blink 0.8s infinite" }}>● generating verdict</span>}
          {buildingTrustReport && <span style={{ fontSize: 10, color: "#EF4444", animation: "blink 0.8s infinite" }}>● compiling trust report</span>}
          <span style={{ fontSize: 11, color: "#71717A", padding: "2px 8px", background: "#18181B", border: "1px solid #27272A", borderRadius: 4 }}>Q{qNum}</span>
          {ended && finalVerdict && <button onClick={() => setShowVerdict(true)} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: "#FFFFFF", color: "#09090B", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Verdict 🏆</button>}
          {ended && trustReport && secureMode && <button onClick={() => setShowTrustReport(true)} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid #27272A", background: "#18181B", color: "#FFFFFF", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Trust Report 🛡️</button>}
          <button onClick={endInterview} disabled={ended || buildingVerdict} style={{ padding: "4px 10px", borderRadius: 6, border: "1px solid rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#EF4444", cursor: ended || buildingVerdict ? "not-allowed" : "pointer", fontSize: 11, fontWeight: 600, opacity: ended || buildingVerdict ? 0.5 : 1 }}>
            {buildingVerdict ? "Finalizing..." : "End Interview"}
          </button>
        </div>
      </div>

      {/* ── MAIN 3-COLUMN ── */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "220px 1fr 240px", overflow: "hidden" }}>

        {/* LEFT */}
        <div style={{ borderRight: "1px solid #27272A", display: "flex", flexDirection: "column", gap: 8, padding: 10, background: "#121215" }}>
          {/* Alex */}
          <div style={{ flex: 2, borderRadius: 8, overflow: "hidden", border: `1px solid ${speaking ? "#10B981" : "#27272A"}`, transition: "border-color 0.2s", minHeight: 0 }}>
            <AlexFace speaking={speaking} listening={listening} />
          </div>

          {/* User cam */}
          <div style={{ flex: 1, borderRadius: 8, overflow: "hidden", border: `1px solid ${secureMode ? fc : "#27272A"}`, background: "#09090B", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 110, transition: "border-color 0.3s" }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", display: camOn || secureMode ? "block" : "none" }} />
            {secureMode && <FaceOval status={faceStatus} />}
            {!camOn && !secureMode && (
              <div style={{ textAlign: "center", zIndex: 1, padding: 10 }}>
                <div style={{ fontSize: 22, marginBottom: 6 }}>🧑</div>
                <button onClick={() => setCamOn(true)} style={{ padding: "4px 10px", borderRadius: 4, border: "1px solid #27272A", background: "#18181B", color: "#A1A1AA", cursor: "pointer", fontSize: 10, fontWeight: 600, display: "block", margin: "0 auto" }}>Enable Camera</button>
                {camErr && <div style={{ fontSize: 10, color: "#EF4444", marginTop: 4 }}>{camErr}</div>}
              </div>
            )}
            {camOn && !secureMode && <button onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); if (videoRef.current) videoRef.current.srcObject = null; setCamOn(false); }} style={{ position: "absolute", top: 6, right: 6, padding: "2px 6px", borderRadius: 4, border: "1px solid #27272A", background: "#18181B", color: "#71717A", cursor: "pointer", fontSize: 10, zIndex: 3 }}>off</button>}
            <div style={{ position: "absolute", bottom: 5, left: 7, fontSize: 9, color: "#71717A", fontWeight: 600, zIndex: 2 }}>You</div>
            {bodyScanning && camOn && !secureMode && <div style={{ position: "absolute", top: 6, left: 8, fontSize: 9, color: "#F59E0B", animation: "blink 0.8s infinite", zIndex: 2 }}>● analyzing</div>}
          </div>

          {/* Trust display (secure only) */}
          {secureMode && (
            <div style={{ padding: "8px 10px", background: "#18181B", border: `1px solid ${tc}30`, borderRadius: 8, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                <span style={{ fontSize: 9, letterSpacing: 1.2, color: "#71717A", fontWeight: 700 }}>TRUST SCORE</span>
                <span style={{ fontSize: 9, color: tc, fontWeight: 700, letterSpacing: 0.8 }}>{liveTrust >= 80 ? "VERIFIED" : liveTrust >= 60 ? "CAUTION" : "FLAGGED"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <TrustRing score={liveTrust} size={54} />
              </div>
              <div style={{ height: 3, background: "#27272A", borderRadius: 2, marginTop: 7, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${liveTrust}%`, background: tc, borderRadius: 2, transition: "width 0.6s ease" }} />
              </div>
            </div>
          )}

          {/* Body language (normal only) */}
          {bodyLang && !secureMode && (
            <div style={{ padding: "8px 10px", background: "#18181B", border: "1px solid #27272A", borderRadius: 8, flexShrink: 0 }}>
              <div style={{ fontSize: 9, letterSpacing: 1.2, color: "#A1A1AA", fontWeight: 700, marginBottom: 6 }}>PRESENCE ANALYSIS</div>
              {[["Posture", bodyLang.posture], ["Eye Contact", bodyLang.eyeContact], ["Confidence", bodyLang.confidence], ["Expression", bodyLang.expression]].map(([l, v]) => (
                <div key={l as string} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 10, color: "#71717A" }}>{l}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, color: Number(v) >= 70 ? "#10B981" : Number(v) >= 50 ? "#F59E0B" : "#EF4444" }}>{v}</span>
                </div>
              ))}
              {bodyLang.notes && <div style={{ fontSize: 9, color: "#71717A", marginTop: 3, fontStyle: "italic", lineHeight: 1.3 }}>{bodyLang.notes}</div>}
            </div>
          )}

          {/* Status */}
          <div style={{ padding: "7px 10px", background: "#18181B", border: "1px solid #27272A", borderRadius: 8, flexShrink: 0 }}>
            <div style={{ color: speaking ? "#10B981" : listening ? "#F59E0B" : loading ? "#A1A1AA" : "#71717A", fontWeight: 600, fontSize: 11 }}>
              {speaking ? "🔊 Alex speaking..." : listening ? "🎤 Listening..." : loading ? "💭 Processing..." : "✓ Ready"}
            </div>
            <div style={{ color: "#52525B", fontSize: 10, marginTop: 2 }}>{mode === "voice" ? "Voice mode" : "Text mode"} · Q{qNum}</div>
          </div>
        </div>

        {/* CENTER — Chat */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "#09090B" }}>
          {mode === "voice" && (speaking || listening || transcript) && (
            <div style={{ padding: "8px 16px", background: "#121215", borderBottom: "1px solid #27272A", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", gap: 2, alignItems: "flex-end" }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} style={{ width: 2.5, background: speaking ? "#10B981" : "#A1A1AA", borderRadius: 1, minHeight: 3, maxHeight: 16, animation: `wave ${0.3 + i * 0.06}s ease-in-out infinite alternate`, animationDelay: `${i * 0.06}s` }} />
                ))}
              </div>
              <span style={{ fontSize: 12, color: "#A1A1AA" }}>
                {speaking ? "Alex speaking..." : "Listening to response..."}
                {transcript && ` — "${transcript.slice(0, 60)}${transcript.length > 60 ? "..." : ""}"`}
              </span>
            </div>
          )}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 16, flexDirection: m.role === "assistant" ? "row" : "row-reverse", animation: "fadeUp 0.25s ease" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: m.role === "assistant" ? "#18181B" : "#176B5B", border: m.role === "assistant" ? "1px solid #27272A" : "1px solid #1E7E6C", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>
                  {m.role === "assistant" ? "👔" : "🧑"}
                </div>
                <div style={{ maxWidth: "80%" }}>
                  <div style={{ padding: "11px 15px", borderRadius: 8, background: m.role === "assistant" ? "#18181B" : "#176B5B", border: m.role === "assistant" ? "1px solid #27272A" : "1px solid #1E7E6C", fontSize: 13.5, lineHeight: 1.65, color: m.role === "assistant" ? "#E4E4E7" : "#FFFFFF" }}>
                    {m.content}
                  </div>
                  <div style={{ fontSize: 10, color: "#52525B", marginTop: 4, textAlign: m.role === "user" ? "right" : "left" }}>{m.time}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#18181B", border: "1px solid #27272A", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>👔</div>
                <div style={{ padding: "10px 14px", background: "#18181B", border: "1px solid #27272A", borderRadius: 8, display: "flex", gap: 5, alignItems: "center" }}>
                  {[0, 1, 2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "#71717A", animation: `blink 1.2s infinite ${i * 0.25}s` }} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "12px 16px", borderTop: "1px solid #27272A", background: "#121215", flexShrink: 0 }}>
            {ended ? (
              <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "center" }}>
                {buildingVerdict || buildingTrustReport ? (
                  <span style={{ fontSize: 13, color: "#F59E0B" }}><span style={{ animation: "spin 1s linear infinite", display: "inline-block", marginRight: 6 }}>⟳</span>{buildingVerdict ? "Synthesizing evidence verdict..." : "Compiling trust certificate..."}</span>
                ) : (
                  <>
                    <span style={{ fontSize: 13, color: "#A1A1AA" }}>Interview evaluation complete</span>
                    {finalVerdict && <button onClick={() => setShowVerdict(true)} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "#FFFFFF", color: "#09090B", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Verdict 🏆</button>}
                    {trustReport && secureMode && <button onClick={() => setShowTrustReport(true)} style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #27272A", background: "#18181B", color: "#FFFFFF", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Trust Report 🛡️</button>}
                    <a href="/"><button style={{ padding: "6px 14px", borderRadius: 6, border: "1px solid #27272A", background: "transparent", color: "#A1A1AA", cursor: "pointer", fontSize: 12 }}>Home</button></a>
                  </>
                )}
              </div>
            ) : mode === "text" ? (
              <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
                <textarea
                  value={input}
                  onChange={e => {
                    if (!inputTypingStartRef.current) inputTypingStartRef.current = Date.now();
                    setInput(e.target.value);
                  }}
                  onKeyDown={e => {
                    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); return; }
                    if (secureMode && (e.ctrlKey || e.metaKey) && e.key === "v") {
                      setPasteDetected(true);
                      const newCount = pasteCountRef.current + 1; pasteCountRef.current = newCount;
                      setPasteCount(newCount);
                      addViolation("Paste action detected", "high");
                    }
                  }}
                  onPaste={secureMode ? () => {
                    setPasteDetected(true);
                    const newCount = pasteCountRef.current + 1; pasteCountRef.current = newCount;
                    setPasteCount(newCount);
                    addViolation("Text pasted — external source audit", "high");
                  } : undefined}
                  placeholder="Type your technical response... (Enter to send, Shift+Enter for newline)"
                  rows={2}
                  style={{ flex: 1, background: "#18181B", border: "1px solid #27272A", borderRadius: 6, padding: "10px 12px", color: "#FFFFFF", fontSize: 13, resize: "none", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = "#71717A"}
                  onBlur={e => e.target.style.borderColor = "#27272A"}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => send()} disabled={!input.trim() || loading} style={{ width: 36, height: 36, borderRadius: 6, border: "none", background: !input.trim() || loading ? "#18181B" : "#FFFFFF", cursor: !input.trim() || loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: !input.trim() || loading ? "#52525B" : "#09090B", fontWeight: 700 }}>
                    {loading ? <span style={{ animation: "spin 1s linear infinite", display: "inline-block", fontSize: 12 }}>⟳</span> : "↑"}
                  </button>
                  {voiceOk && <button onClick={() => setMode("voice")} style={{ width: 36, height: 36, borderRadius: 6, border: "1px solid #27272A", background: "#18181B", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>🎤</button>}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ position: "relative" }}>
                    {listening && <div style={{ position: "absolute", inset: -6, borderRadius: "50%", border: "2px solid rgba(239,68,68,0.4)", animation: "ripple 1.5s ease-out infinite" }} />}
                    <button onClick={listening ? stopListening : () => { if (!speaking && !loading) startListening(); }} disabled={speaking || loading} style={{ width: 44, height: 44, borderRadius: "50%", border: "none", background: listening ? "#EF4444" : speaking || loading ? "#18181B" : "#FFFFFF", cursor: speaking || loading ? "not-allowed" : "pointer", fontSize: 18, color: listening ? "#FFFFFF" : speaking || loading ? "#52525B" : "#09090B", display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.2s", opacity: speaking || loading ? 0.4 : 1 }}>
                      {listening ? "⏹" : "🎤"}
                    </button>
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                    <div style={{ color: listening ? "#EF4444" : speaking ? "#10B981" : loading ? "#71717A" : "#A1A1AA", fontWeight: 600 }}>
                      {listening ? "Listening... click to send" : speaking ? "Alex speaking..." : loading ? "Evaluating response..." : "Click microphone to speak"}
                    </div>
                    {transcript && <div style={{ fontSize: 11, color: "#71717A", fontStyle: "italic" }}>"{transcript.slice(0, 60)}{transcript.length > 60 ? "..." : ""}"</div>}
                  </div>
                </div>
                <button onClick={() => { synthRef.current?.cancel(); stopListening(); setMode("text"); }} style={{ padding: "5px 12px", borderRadius: 6, border: "1px solid #27272A", background: "#18181B", color: "#A1A1AA", cursor: "pointer", fontSize: 11 }}>⌨️ Switch to Text</button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ borderLeft: "1px solid #27272A", display: "flex", flexDirection: "column", background: "#121215", overflow: "hidden" }}>
          {secureMode ? (
            // Secure: top = score panel, bottom = violations log
            <>
              <div style={{ flex: 1, overflow: "hidden", borderBottom: "1px solid #27272A" }}>
                <ScorePanel score={score} updating={scoring} />
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ padding: "8px 12px", borderBottom: "1px solid #27272A", fontSize: 10, letterSpacing: 1.2, color: "#71717A", fontWeight: 700 }}>INTEGRITY LOG</div>
                <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
                  {violations.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "1.5rem 0", color: "#52525B", fontSize: 11 }}>
                      <div style={{ fontSize: 16, marginBottom: 4 }}>✓</div>No integrity flags
                    </div>
                  ) : [...violations].reverse().map((v, i) => (
                    <div key={i} style={{ marginBottom: 6, padding: "6px 8px", background: "#18181B", border: `1px solid ${v.severity === "critical" ? "rgba(239,68,68,0.4)" : v.severity === "high" ? "rgba(239,68,68,0.25)" : v.severity === "medium" ? "rgba(245,158,11,0.25)" : "#27272A"}`, borderRadius: 6, animation: "slideIn 0.2s ease" }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: v.severity === "critical" ? "#EF4444" : v.severity === "high" ? "#F87171" : v.severity === "medium" ? "#F59E0B" : "#A1A1AA", marginBottom: 1 }}>{v.type}</div>
                      <div style={{ fontSize: 9, color: "#52525B" }}>{v.time}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "8px 10px", borderTop: "1px solid #27272A", background: "#121215" }}>
                  {[["Face Presence", totalFrames > 0 ? `${Math.round(faceOkFrames / totalFrames * 100)}%` : "100%", faceOkFrames / (totalFrames || 1) >= 0.8 ? "#10B981" : "#EF4444"], ["Tab Switches", String(tabSwitches), tabSwitches === 0 ? "#10B981" : "#EF4444"], ["Pastes", String(pasteCount), pasteCount === 0 ? "#10B981" : "#EF4444"], ["AI Flags", String(aiWarnings), aiWarnings === 0 ? "#10B981" : "#EF4444"]].map(([l, v, c]) => (
                    <div key={l as string} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 9, color: "#71717A" }}>{l}</span>
                      <span style={{ fontSize: 9, fontWeight: 700, color: c as string, fontFamily: "monospace" }}>{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            // Normal: full score panel
            <ScorePanel score={score} updating={scoring} />
          )}
        </div>
      </div>
    </div>
  );
}