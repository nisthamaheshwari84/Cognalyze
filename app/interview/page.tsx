"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { VisionPipeline } from "@/lib/camera/vision-models";
import { TemporalTracker } from "@/lib/camera/temporal-tracker";

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
  const c = status === "ok" ? "#00ff88" : status === "missing" ? "#ff4466" : status === "multiple" ? "#fbbf24" : "rgba(255,255,255,0.35)";
  const label = status === "ok" ? "✓ FACE DETECTED & ALIGNED" : status === "missing" ? "✗ ALIGN FACE IN OVAL" : status === "multiple" ? "⚠ MULTIPLE FACES DETECTED" : "ALIGN YOUR FACE";

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 2 }}>
      <div style={{
        width: "55%",
        height: "75%",
        border: `2.5px solid ${c}`,
        borderRadius: "50%",
        boxShadow: status === "ok"
          ? `0 0 35px ${c}60, inset 0 0 25px ${c}20`
          : status === "missing"
            ? `0 0 25px ${c}40, inset 0 0 20px ${c}10`
            : status === "multiple"
              ? `0 0 25px ${c}40, inset 0 0 20px ${c}10`
              : "0 0 15px rgba(255,255,255,0.08)",
        transition: "all 0.3s ease"
      }} />
      <div style={{
        position: "absolute",
        bottom: "8%",
        left: "50%",
        transform: "translateX(-50%)",
        padding: "4px 14px",
        background: status === "ok" ? "rgba(0,255,136,0.18)" : status === "missing" ? "rgba(255,68,102,0.18)" : status === "multiple" ? "rgba(251,191,36,0.18)" : "rgba(0,0,0,0.6)",
        border: `1px solid ${c}`,
        borderRadius: 999,
        whiteSpace: "nowrap",
        backdropFilter: "blur(8px)",
        transition: "all 0.3s ease"
      }}>
        <span style={{ fontSize: 10, color: c, fontWeight: 800, letterSpacing: 1.2 }}>
          {label}
        </span>
      </div>
    </div>
  );
}

// ═══ TRUST RING (from secure interview) ═══
function TrustRing({ score, size = 60 }: { score: number; size?: number }) {
  const c = score >= 80 ? "#00ff88" : score >= 60 ? "#fbbf24" : "#ff4466";
  const r = size * 0.42, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={size * 0.07} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c} strokeWidth={size * 0.07}
          strokeDasharray={circ} strokeDashoffset={circ - (circ * score / 100)}
          strokeLinecap="round" style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.5s", filter: `drop-shadow(0 0 6px ${c})` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size * 0.24, fontWeight: 900, color: c, lineHeight: 1 }}>{score}</span>
      </div>
    </div>
  );
}

// ═══ ALEX FACE (unchanged) ═══
function AlexFace({ speaking, listening }: { speaking: boolean; listening: boolean }) {
  return (
    <div style={{ width: "100%", height: "100%", background: "linear-gradient(160deg,#0f0c24,#1a0e35,#0d1a2e)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes floatFace{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
        @keyframes speakGlow{0%,100%{box-shadow:0 0 20px rgba(99,102,241,0.3),0 8px 30px rgba(0,0,0,0.5)}50%{box-shadow:0 0 60px rgba(99,102,241,0.7),0 0 100px rgba(168,85,247,0.4),0 8px 30px rgba(0,0,0,0.5)}}
        @keyframes eyeBlink{0%,88%,100%{transform:scaleY(1)}93%{transform:scaleY(0.05)}}
        @keyframes mouthTalk{0%,100%{height:4px}50%{height:16px}}
        @keyframes bgPulse{0%,100%{opacity:0.3}50%{opacity:0.7}}
        @keyframes ringOut{0%{transform:scale(1);opacity:0.5}100%{transform:scale(2);opacity:0}}
      `}</style>
      <div style={{ position: "absolute", width: 220, height: 220, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.2),transparent 70%)", animation: "bgPulse 3s ease-in-out infinite", filter: "blur(20px)" }} />
      {speaking && [1, 2, 3].map(i => (
        <div key={i} style={{ position: "absolute", width: `${90 + i * 55}px`, height: `${90 + i * 55}px`, borderRadius: "50%", border: `1.5px solid rgba(99,102,241,${0.55 - i * 0.14})`, animation: `ringOut ${0.7 + i * 0.25}s ease-out infinite`, animationDelay: `${i * 0.18}s`, pointerEvents: "none" }} />
      ))}
      <div style={{ position: "relative", animation: speaking ? "none" : "floatFace 4s ease-in-out infinite" }}>
        <div style={{ width: 90, height: 100, borderRadius: "48% 48% 44% 44%", background: "linear-gradient(160deg,#c8845a,#a86035)", position: "relative", animation: speaking ? "speakGlow 1.5s ease-in-out infinite" : "none", boxShadow: "0 8px 32px rgba(0,0,0,0.6)", transition: "box-shadow 0.4s" }}>
          <div style={{ position: "absolute", top: -10, left: -5, right: -5, height: 44, borderRadius: "50% 50% 0 0", background: "linear-gradient(160deg,#150800,#2a1008)" }} />
          <div style={{ position: "absolute", top: -8, left: -10, width: 22, height: 38, borderRadius: "50% 0 0 50%", background: "#150800" }} />
          <div style={{ position: "absolute", top: -8, right: -10, width: 22, height: 38, borderRadius: "0 50% 50% 0", background: "#150800" }} />
          {[0, 1].map(i => <div key={i} style={{ position: "absolute", top: 21, left: i === 0 ? 12 : 47, width: 17, height: 2.5, borderRadius: 999, background: "#0f0800", transform: i === 0 ? "rotate(-10deg)" : "rotate(10deg)" }} />)}
          <div style={{ position: "absolute", top: 30, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 20 }}>
            {[0, 1].map(i => (
              <div key={i} style={{ width: 13, height: 13, borderRadius: "50%", background: "#0f0800", display: "flex", alignItems: "center", justifyContent: "center", animation: "eyeBlink 4s ease-in-out infinite", animationDelay: `${i * 0.12}s`, overflow: "hidden", position: "relative" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d1860" }} />
                <div style={{ position: "absolute", width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.9)", top: "15%", left: "20%" }} />
              </div>
            ))}
          </div>
          <div style={{ position: "absolute", top: 48, left: "50%", transform: "translateX(-50%)", width: 8, height: 7, borderRadius: "0 0 5px 5px", background: "rgba(0,0,0,0.18)" }} />
          <div style={{ position: "absolute", bottom: 15, left: "50%", transform: "translateX(-50%)", width: 34, overflow: "hidden", display: "flex", justifyContent: "center", gap: 2, alignItems: "flex-end", height: speaking ? "auto" : 8 }}>
            {speaking ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ width: 4, background: "#6b2810", borderRadius: 999, minHeight: 3, maxHeight: 15, animation: `mouthTalk ${0.22 + i * 0.04}s ease-in-out infinite alternate`, animationDelay: `${i * 0.04}s` }} />
              ))
            ) : (
              <div style={{ width: 34, height: 8, borderRadius: "0 0 8px 8px", background: "rgba(90,40,20,0.7)" }} />
            )}
          </div>
          <div style={{ position: "absolute", bottom: -20, left: 8, right: 8, height: 26, background: "linear-gradient(180deg,#1a3a6e,#2458a8)", borderRadius: "0 0 6px 6px" }} />
          <div style={{ position: "absolute", bottom: -14, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderTop: "11px solid #1a3a6e" }} />
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)", padding: "5px 14px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: speaking ? "#6366f1" : listening ? "#00ff88" : "rgba(255,255,255,0.25)", boxShadow: speaking ? "0 0 8px #6366f1" : listening ? "0 0 8px #00ff88" : "none", transition: "all 0.3s" }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: "white" }}>Alex</span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Staff Engineer · Google</span>
      </div>
      {(speaking || listening) && (
        <div style={{ position: "absolute", bottom: 44, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 2.5, alignItems: "flex-end" }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{ width: 2.5, background: speaking ? "#6366f1" : "#00ff88", borderRadius: 999, minHeight: 3, maxHeight: 18, animation: `mouthTalk ${0.28 + i * 0.05}s ease-in-out infinite alternate`, animationDelay: `${i * 0.055}s` }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ═══ EVIDENCE STREAM PANEL (Replaces arbitrary 100-pt ScorePanel) ═══
function ScorePanel({ score, updating }: { score: ScoreData; updating: boolean }) {
  const ov = score.overall || 0;
  const bd = score.breakdown || { relevance: 0, technicalAccuracy: 0, communicationClarity: 0, problemSolving: 0, depth: 0, examples: 0, confidence: 0 };
  const ev = score.evidence || { strengths: [], improvements: [], suggestedAnswer: "", scoreReason: "" };
  const hs = score.hiringSignal || "NEUTRAL";
  const hsColor = hs === "STRONG" ? "#00ff88" : hs === "MODERATE" ? "#fbbf24" : hs === "WEAK" ? "#ff8c00" : hs === "CRITICAL" ? "#ff4466" : "rgba(255,255,255,0.25)";
  const oc = ov >= 75 ? "#00ff88" : ov >= 55 ? "#fbbf24" : ov > 0 ? "#ff4466" : "rgba(255,255,255,0.18)";
  const r = 38;
  const circ = 2 * Math.PI * r;

  const DIMS = [
    { key: "relevance", label: "Relevance", max: 20, color: "#6366f1" },
    { key: "technicalAccuracy", label: "Technical", max: 20, color: "#00ff88" },
    { key: "communicationClarity", label: "Clarity", max: 15, color: "#22d3ee" },
    { key: "problemSolving", label: "Problem Solving", max: 15, color: "#fbbf24" },
    { key: "depth", label: "Depth", max: 15, color: "#a855f7" },
    { key: "examples", label: "Examples", max: 10, color: "#ec4899" },
    { key: "confidence", label: "Confidence", max: 5, color: "#38bdf8" },
  ];

  const markers = score.evidenceMarkers || [];
  const repeatedAlert = score.repeatedGapAlert;
  const strengths = score.strengths?.length ? score.strengths : ev.strengths || [];
  const improvements = score.improvements?.length ? score.improvements : ev.improvements || [];
  const suggestedAnswer = score.suggestedAnswer || ev.suggestedAnswer || "";
  const scoreReason = ev.scoreReason || score.verdict || "";

  const getMarkerBadge = (type: EvidenceMarker["type"], occurrences?: number) => {
    switch (type) {
      case "demonstrated":
        return {
          icon: "✅",
          label: "Demonstrated",
          color: "#00ff88",
          bg: "rgba(0,255,136,0.08)",
          border: "rgba(0,255,136,0.25)"
        };
      case "partial":
        return {
          icon: "⚠️",
          label: "Partial",
          color: "#fbbf24",
          bg: "rgba(251,191,36,0.08)",
          border: "rgba(251,191,36,0.25)"
        };
      case "repeated_gap":
        return {
          icon: "🔁",
          label: `Repeated Gap (${occurrences || 2}x)`,
          color: "#f43f5e",
          bg: "rgba(244,63,94,0.12)",
          border: "rgba(244,63,94,0.35)"
        };
      case "gap":
      default:
        return {
          icon: "❌",
          label: "Gap",
          color: "#ff4466",
          bg: "rgba(255,68,102,0.08)",
          border: "rgba(255,68,102,0.25)"
        };
    }
  };

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "12px 12px 10px", display: "flex", flexDirection: "column", gap: 10 }}>
      {/* ── HEADER & LIVE STATUS ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 9, letterSpacing: 1.5, color: "#818cf8", fontWeight: 800 }}>LIVE INTERVIEW SCORE</span>
          <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 4, background: "rgba(16,185,129,0.15)", color: "#10b981", fontWeight: 700 }}>
            ● Synced to DNA
          </span>
        </div>
        {updating && (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#6366f1", animation: "blink 0.6s infinite" }} />
            <span style={{ fontSize: 9, color: "rgba(99,102,241,0.9)", fontWeight: 700 }}>evaluating</span>
          </div>
        )}
      </div>

      {/* ── LIVE SCORE ROTATING RING METER ── */}
      <div style={{ textAlign: "center", padding: "4px 0 2px" }}>
        <div style={{ position: "relative", width: 84, height: 84, margin: "0 auto 6px" }}>
          <svg width="84" height="84" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="42" cy="42" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            <circle
              cx="42"
              cy="42"
              r={r}
              fill="none"
              stroke={oc}
              strokeWidth="6"
              strokeDasharray={circ}
              strokeDashoffset={circ - (circ * ov) / 100}
              strokeLinecap="round"
              style={{
                transition: "stroke-dashoffset 0.8s ease, stroke 0.4s",
                filter: ov > 0 ? `drop-shadow(0 0 10px ${oc}70)` : "none",
              }}
            />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "1.45rem", fontWeight: 900, color: oc, lineHeight: 1 }}>{ov > 0 ? ov : "—"}</span>
            <span style={{ fontSize: 8.5, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>/ 100</span>
          </div>
        </div>

        {/* Hiring signal pill */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", background: `${hsColor}18`, border: `1px solid ${hsColor}35`, borderRadius: 999 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: hsColor }} />
          <span style={{ fontSize: 9, color: hsColor, fontWeight: 800, letterSpacing: 0.8 }}>{hs}</span>
        </div>

        {score.verdict && (
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", marginTop: 5, fontStyle: "italic", lineHeight: 1.4, padding: "0 4px" }}>
            "{score.verdict}"
          </div>
        )}
      </div>

      {/* ── 7-DIMENSION BREAKDOWN ── */}
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "9px 10px 5px" }}>
        <div style={{ fontSize: 9, letterSpacing: 1.5, color: "rgba(255,255,255,0.35)", marginBottom: 7, fontWeight: 700 }}>
          SCORE BREAKDOWN
        </div>
        {DIMS.map((d) => {
          const val = (bd as any)[d.key] || 0;
          const pct = Math.min(100, Math.max(0, (val / d.max) * 100));
          const c = pct >= 75 ? "#00ff88" : pct >= 50 ? "#fbbf24" : pct > 0 ? "#ff4466" : "rgba(255,255,255,0.15)";
          return (
            <div key={d.key} style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.65)" }}>{d.label}</span>
                <span style={{ fontSize: 9.5, fontWeight: 800, color: c }}>{val > 0 ? `${val}/${d.max}` : "—"}</span>
              </div>
              <div style={{ height: 3, background: "rgba(255,255,255,0.06)", borderRadius: 999, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, ${d.color}60, ${d.color})`,
                    borderRadius: 999,
                    transition: "width 0.6s ease",
                  }}
                />
              </div>
            </div>
          );
        })}
        {scoreReason && (
          <div style={{ marginTop: 6, padding: "5px 7px", background: "rgba(99,102,241,0.08)", borderRadius: 7, fontSize: 9.5, color: "rgba(99,102,241,0.9)", lineHeight: 1.4, borderLeft: "2px solid rgba(99,102,241,0.5)" }}>
            {scoreReason}
          </div>
        )}
      </div>

      {/* ── 🎯 STRONGEST ANSWER CARD (PROMINENT MODEL ANSWER) ── */}
      {suggestedAnswer ? (
        <div style={{
          background: "linear-gradient(135deg, rgba(251,191,36,0.09) 0%, rgba(245,158,11,0.04) 100%)",
          border: "1.5px solid rgba(251,191,36,0.35)",
          borderRadius: 11,
          padding: "10px 11px",
          boxShadow: "0 4px 18px rgba(251,191,36,0.08)"
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 13 }}>🎯</span>
              <span style={{ fontSize: 9.5, color: "#fbbf24", fontWeight: 800, letterSpacing: 0.8, textTransform: "uppercase" }}>
                STRONGEST ANSWER
              </span>
            </div>
            <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 4, background: "rgba(251,191,36,0.2)", color: "#fef08a", fontWeight: 700 }}>
              Model Benchmark
            </span>
          </div>
          <div style={{
            fontSize: 11,
            color: "rgba(255,255,255,0.9)",
            lineHeight: 1.5,
            fontFamily: "inherit",
            background: "rgba(0,0,0,0.25)",
            padding: "8px 9px",
            borderRadius: 7,
            borderLeft: "2.5px solid #fbbf24"
          }}>
            {suggestedAnswer}
          </div>
        </div>
      ) : (
        <div style={{
          background: "rgba(251,191,36,0.03)",
          border: "1px dashed rgba(251,191,36,0.18)",
          borderRadius: 10,
          padding: "9px 10px",
          textAlign: "center",
          color: "rgba(251,191,36,0.7)",
          fontSize: 10,
          lineHeight: 1.4
        }}>
          🎯 <strong>Strongest Answer Benchmark</strong> will appear here once you answer the question.
        </div>
      )}

      {/* ── REPEATED GAP ALERT BANNER ── */}
      {repeatedAlert && (
        <div style={{
          background: "linear-gradient(135deg, rgba(239,68,68,0.15) 0%, rgba(159,18,57,0.1) 100%)",
          border: "1px solid rgba(239,68,68,0.45)",
          borderRadius: 10,
          padding: "9px 11px",
          boxShadow: "0 4px 14px rgba(239,68,68,0.15)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#f87171", fontWeight: 800, fontSize: 9.5, letterSpacing: 0.8 }}>
            <span>🔁</span> REPEATED GAP DETECTED
          </div>
          <div style={{ fontSize: 10.5, color: "#fecaca", marginTop: 3, lineHeight: 1.4, fontWeight: 500 }}>
            {repeatedAlert.message}
          </div>
        </div>
      )}

      {/* ── STRENGTHS & IMPROVEMENTS ── */}
      {strengths.length > 0 && (
        <div style={{ background: "rgba(0,255,136,0.04)", border: "1px solid rgba(0,255,136,0.15)", borderRadius: 10, padding: "8px 10px" }}>
          <div style={{ fontSize: 9, color: "#00ff88", fontWeight: 800, marginBottom: 5, letterSpacing: 1 }}>
            ✓ DEMONSTRATED STRENGTHS
          </div>
          {strengths.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 5, marginBottom: 4 }}>
              <span style={{ color: "#00ff88", fontSize: 9, flexShrink: 0, marginTop: 1 }}>•</span>
              <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.75)", lineHeight: 1.35 }}>{s}</span>
            </div>
          ))}
        </div>
      )}

      {improvements.length > 0 && (
        <div style={{ background: "rgba(255,68,102,0.04)", border: "1px solid rgba(255,68,102,0.15)", borderRadius: 10, padding: "8px 10px" }}>
          <div style={{ fontSize: 9, color: "#ff4466", fontWeight: 800, marginBottom: 5, letterSpacing: 1 }}>
            ⚠ AREAS FOR IMPROVEMENT
          </div>
          {improvements.map((s, i) => (
            <div key={i} style={{ display: "flex", gap: 5, marginBottom: 4 }}>
              <span style={{ color: "#ff4466", fontSize: 9, flexShrink: 0, marginTop: 1 }}>•</span>
              <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.75)", lineHeight: 1.35 }}>{s}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── DEMONSTRATED COMPETENCIES (DNA EVIDENCE STREAM) ── */}
      {markers.length > 0 && (
        <div>
          <div style={{ fontSize: 9, letterSpacing: 1.5, color: "rgba(255,255,255,0.35)", fontWeight: 700, marginBottom: 6, textTransform: "uppercase" }}>
            Demonstrated Competencies ({markers.length})
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {markers.map((m) => {
              const meta = getMarkerBadge(m.type, m.occurrences);
              return (
                <div
                  key={m.id}
                  style={{
                    background: meta.bg,
                    border: `1px solid ${meta.border}`,
                    borderRadius: 8,
                    padding: "7px 9px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: "white" }}>
                      {m.competency}
                    </span>
                    <span style={{
                      fontSize: 8,
                      fontWeight: 800,
                      color: meta.color,
                      padding: "1px 5px",
                      borderRadius: 4,
                      background: "rgba(0,0,0,0.3)"
                    }}>
                      {meta.icon} {meta.label}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)", lineHeight: 1.3 }}>
                    {m.detail}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── FOOTER & STUDENT DNA LINK ── */}
      <div style={{ marginTop: "auto", paddingTop: 8, borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <a
          href="/student/dna"
          target="_blank"
          rel="noopener noreferrer"
          style={{ textDecoration: "none", fontSize: 9.5, color: "#818cf8", fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}
        >
          <span>🧬 Student DNA</span>
        </a>
        <span style={{ fontSize: 8.5, color: "rgba(255,255,255,0.35)" }}>
          Evidence-First Scoring
        </span>
      </div>
    </div>
  );
}

// ═══ VERDICT MODAL ═══
function VerdictModal({ verdict, onClose }: { verdict: FinalVerdict; onClose: () => void }) {
  const isHire = verdict.decision === "HIRE" || verdict.decision === "STRONG_HIRE";
  const dc = isHire ? "#2E7D5B" : verdict.decision === "NO_HIRE" ? "#C24141" : "#B7791F";
  const bgCol = isHire ? "#EBFDF5" : verdict.decision === "NO_HIRE" ? "#FEF3F2" : "#FEF7EC";
  const borderCol = isHire ? "#A6F4C5" : verdict.decision === "NO_HIRE" ? "#F8C8C8" : "#F5DFBA";
  const dIcon = verdict.decision === "STRONG_HIRE" ? "🏆" : isHire ? "✅" : verdict.decision === "STRONG_NO_HIRE" ? "❌" : "⚠️";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(22, 42, 67, 0.45)", backdropFilter: "blur(4px)", zIndex: 1000, overflowY: "auto", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "32px 16px" }}>
      <div style={{ maxWidth: 740, width: "100%", background: "#FFFFFF", borderRadius: 12, border: "1px solid #E4E1DA", boxShadow: "0 20px 40px -10px rgba(22, 42, 67, 0.18)", overflow: "hidden", fontFamily: "var(--font-inter, -apple-system, sans-serif)" }}>
        
        {/* Header */}
        <div style={{ padding: "28px 28px 20px", borderBottom: "1px solid #E4E1DA", background: "#FAF9F6", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", background: bgCol, border: `1px solid ${borderCol}`, borderRadius: 5, color: dc, fontSize: 12, fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>
              <span>{dIcon}</span>
              <span>{verdict.decision.replace("_", " ")}</span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: "#162A43", margin: "0 0 6px", letterSpacing: "-0.01em" }}>
              "{verdict.headline}"
            </h2>
            <div style={{ fontSize: 12, color: "#667085" }}>
              Interviewer Confidence: <strong style={{ color: "#162A43" }}>{verdict.confidence}%</strong>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#667085", fontSize: 20, cursor: "pointer", padding: "4px 8px" }}>×</button>
        </div>

        <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Overview */}
          <div style={{ fontSize: 14, color: "#17191C", lineHeight: 1.6, background: "#FAF9F6", padding: 16, borderRadius: 10, border: "1px solid #E4E1DA" }}>
            {verdict.overview}
          </div>

          {/* Scorecard */}
          {verdict.scorecard && Object.keys(verdict.scorecard).length > 0 && (
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: "#667085", textTransform: "uppercase", marginBottom: 10 }}>
                EVALUATION SCORECARD
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {Object.entries(verdict.scorecard).map(([k, v]) => {
                  const metricColor = v.score >= 70 ? "#2E7D5B" : v.score >= 50 ? "#B7791F" : "#C24141";
                  return (
                    <div key={k} style={{ background: "#FFFFFF", borderRadius: 8, padding: "12px 14px", border: "1px solid #E4E1DA" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 11, color: "#667085", textTransform: "capitalize", fontWeight: 500 }}>{k}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: metricColor }}>{v.score}</span>
                      </div>
                      <div style={{ height: 4, background: "#E4E1DA", borderRadius: 999, marginBottom: 8, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${v.score}%`, background: metricColor, borderRadius: 999 }} />
                      </div>
                      <div style={{ fontSize: 11, color: "#667085", lineHeight: 1.4 }}>{v.comment}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Hire Signals & Concerns */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div style={{ background: "#EBFDF5", border: "1px solid #A6F4C5", padding: 16, borderRadius: 10 }}>
              <div style={{ fontSize: 11, letterSpacing: 0.5, color: "#2E7D5B", fontWeight: 700, marginBottom: 10, textTransform: "uppercase" }}>
                ✓ Demonstration Signals
              </div>
              {verdict.hire_reasons?.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 12, color: "#17191C", lineHeight: 1.5 }}>
                  <span style={{ color: "#2E7D5B", fontWeight: 700 }}>•</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>

            <div style={{ background: "#FEF3F2", border: "1px solid #F8C8C8", padding: 16, borderRadius: 10 }}>
              <div style={{ fontSize: 11, letterSpacing: 0.5, color: "#C24141", fontWeight: 700, marginBottom: 10, textTransform: "uppercase" }}>
                ✗ Evaluation Gaps
              </div>
              {verdict.no_hire_reasons?.map((r, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 12, color: "#17191C", lineHeight: 1.5 }}>
                  <span style={{ color: "#C24141", fontWeight: 700 }}>•</span>
                  <span>{r}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Next Steps & Note */}
          <div style={{ background: "#FAF9F6", border: "1px solid #E4E1DA", padding: 16, borderRadius: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.5, color: "#162A43", textTransform: "uppercase", marginBottom: 6 }}>
              RECOMMENDED NEXT STEPS
            </div>
            <p style={{ fontSize: 13, color: "#17191C", lineHeight: 1.6, margin: "0 0 12px" }}>{verdict.next_steps}</p>
            
            <div style={{ borderTop: "1px solid #E4E1DA", paddingTop: 10, fontSize: 12, color: "#667085", fontStyle: "italic" }}>
              Evaluator Note: “{verdict.interviewer_note}”
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8, borderTop: "1px solid #E4E1DA" }}>
            <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 7, background: "#FFFFFF", border: "1px solid #E4E1DA", color: "#17191C", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
              Review Dialogue
            </button>
            <a href="/" style={{ textDecoration: "none" }}>
              <button style={{ padding: "8px 16px", borderRadius: 7, border: "none", background: "#356AE6", color: "#FFFFFF", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                Return to Dashboard →
              </button>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}

// ═══ TRUST REPORT MODAL ═══
function TrustReportModal({ report, aiChecks, onClose, onDownload }: { report: TrustReport; aiChecks: AICheck[]; onClose: () => void; onDownload: () => void }) {
  const aiWarnings = aiChecks.filter(c => c.isAI).length;
  const isVerified = report.verdict === "VERIFIED";
  const isCaution = report.verdict === "CAUTION";
  const vc = isVerified ? "#2E7D5B" : isCaution ? "#B7791F" : "#C24141";
  const bgCol = isVerified ? "#EBFDF5" : isCaution ? "#FEF7EC" : "#FEF3F2";
  const borderCol = isVerified ? "#A6F4C5" : isCaution ? "#F5DFBA" : "#F8C8C8";
  const icon = isVerified ? "✅" : isCaution ? "⚠️" : "🚩";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(22, 42, 67, 0.45)", backdropFilter: "blur(4px)", zIndex: 1001, overflowY: "auto", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "32px 16px" }}>
      <div style={{ maxWidth: 740, width: "100%", background: "#FFFFFF", borderRadius: 12, border: "1px solid #E4E1DA", boxShadow: "0 20px 40px -10px rgba(22, 42, 67, 0.18)", overflow: "hidden", fontFamily: "var(--font-inter, -apple-system, sans-serif)" }}>
        
        {/* Header */}
        <div style={{ padding: "28px 28px 20px", borderBottom: "1px solid #E4E1DA", background: "#FAF9F6", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", background: bgCol, border: `1px solid ${borderCol}`, borderRadius: 5, color: vc, fontSize: 12, fontWeight: 700, textTransform: "uppercase", marginBottom: 10 }}>
              <span>{icon}</span>
              <span>{report.verdict} INTEGRITY PASSPORT</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
              <div style={{ fontSize: 32, fontWeight: 800, color: "#162A43", letterSpacing: "-0.02em" }}>
                {report.trust_score}<span style={{ fontSize: 16, color: "#667085", fontWeight: 400 }}>/100</span>
              </div>
              <div style={{ fontSize: 13, color: "#667085" }}>
                {report.verdict_reason}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#667085", fontSize: 20, cursor: "pointer", padding: "4px 8px" }}>×</button>
        </div>

        <div style={{ padding: 28, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Breakdown Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
            {Object.values(report.breakdown).map((b, i) => {
              const bColor = b.score >= 70 ? "#2E7D5B" : b.score >= 50 ? "#B7791F" : "#C24141";
              return (
                <div key={i} style={{ background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: bColor, marginBottom: 2 }}>{b.score}</div>
                  <div style={{ fontSize: 11, color: "#162A43", fontWeight: 600, marginBottom: 6 }}>{b.label}</div>
                  <div style={{ height: 4, background: "#E4E1DA", borderRadius: 999, overflow: "hidden", marginBottom: 6 }}>
                    <div style={{ height: "100%", width: `${b.score}%`, background: bColor, borderRadius: 999 }} />
                  </div>
                  <div style={{ fontSize: 10, color: "#667085", lineHeight: 1.4 }}>{b.note}</div>
                </div>
              );
            })}
          </div>

          {/* AI Check & Flags */}
          {report.flags.length > 0 && (
            <div style={{ background: "#FEF3F2", border: "1px solid #F8C8C8", padding: 16, borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: "#C24141", fontWeight: 700, letterSpacing: 0.5, marginBottom: 8, textTransform: "uppercase" }}>
                🚩 Integrity Flags ({report.flags.length})
              </div>
              {report.flags.map((f, i) => (
                <div key={i} style={{ fontSize: 12, color: "#17191C", marginBottom: 4, paddingLeft: 8, borderLeft: "2px solid #C24141", lineHeight: 1.4 }}>
                  {f}
                </div>
              ))}
            </div>
          )}

          {/* Behavioral Analysis & Recruiter Recommendation */}
          <div style={{ background: "#FAF9F6", border: "1px solid #E4E1DA", padding: 16, borderRadius: 10 }}>
            <div style={{ fontSize: 11, color: "#162A43", fontWeight: 700, letterSpacing: 0.5, marginBottom: 6, textTransform: "uppercase" }}>
              Recruiter Evaluation Guidance
            </div>
            <p style={{ fontSize: 13, color: "#17191C", lineHeight: 1.6, margin: "0 0 10px" }}>{report.recruiter_recommendation}</p>
            <div style={{ fontSize: 12, color: "#667085", borderTop: "1px solid #E4E1DA", paddingTop: 8 }}>
              Observed Signals: {report.ai_observation}
            </div>
          </div>

          {/* Footer Actions */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 8, borderTop: "1px solid #E4E1DA" }}>
            <button onClick={onClose} style={{ padding: "8px 16px", borderRadius: 7, border: "1px solid #E4E1DA", background: "#FFFFFF", color: "#667085", cursor: "pointer", fontSize: 13, fontWeight: 500 }}>
              Dismiss
            </button>
            <button onClick={onDownload} style={{ padding: "8px 16px", borderRadius: 7, border: "none", background: "#356AE6", color: "#FFFFFF", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
              ⬇ Export Integrity Certificate
            </button>
          </div>
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
  const visionPipelineRef = useRef<VisionPipeline | null>(null);
  const temporalTrackerRef = useRef<TemporalTracker | null>(null);
  const [phoneStatus, setPhoneStatus] = useState<"clear" | "detected">("clear");
  const [personCount, setPersonCount] = useState(0);
  const [lastPhoneConf, setLastPhoneConf] = useState(0);
  const phoneFramesRef = useRef(0);

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

  // Load client-side Dual Vision Pipeline (MediaPipe ObjectDetector + BlazeFace + face-api fallback)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!visionPipelineRef.current) {
          visionPipelineRef.current = new VisionPipeline();
        }
        if (!temporalTrackerRef.current) {
          temporalTrackerRef.current = new TemporalTracker();
        }
        const res = await visionPipelineRef.current.initialize();
        console.log(`[PROCTORING] Vision pipeline init result: status=${res.status}, success=${res.success}, message=${res.message}`);
        if (!cancelled && res.success) {
          setModelsReady(true);
        }
      } catch (e) {
        console.warn("[PROCTORING] Vision model load warning:", e);
        // Even on failure, check if fallback mode is available
        if (!cancelled && visionPipelineRef.current?.isReady()) {
          console.log("[PROCTORING] Pipeline in fallback mode, setting modelsReady=true");
          setModelsReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
      visionPipelineRef.current?.release();
    };
  }, []);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get("jd")) setJd(decodeURIComponent(p.get("jd")!));
    if (p.get("resume")) setResume(decodeURIComponent(p.get("resume")!));
    if (p.get("secure") === "true" || p.get("mode") === "secure") {
      setSecureMode(true);
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
              `${sp.fullName || data.user?.fullName || "Candidate"}`,
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
      } catch (err) {}
    }
    preloadCandidateSession();
    setVoiceOk("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
    if (window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
      window.speechSynthesis.getVoices();
    }
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

  // ── DUAL VISION DETECTION (MediaPipe ObjectDetector + BlazeFace + face-api fallback) ──
  const detectFaceCount = useCallback(async (
    videoEl: HTMLVideoElement | null,
    mode: "lenient" | "strict" = "lenient"
  ): Promise<{ count: number; status: "idle" | "ok" | "missing" | "multiple" }> => {
    if (!videoEl || videoEl.readyState < 2 || videoEl.videoWidth === 0) {
      return { count: -1, status: "idle" };
    }

    const pipeline = visionPipelineRef.current;
    if (pipeline && pipeline.isReady()) {
      try {
        const det = pipeline.detectFrame(videoEl);
        const count = mode === "strict" ? det.faceCount : Math.max(det.faceCount, det.personCount);
        return {
          count,
          status: count === 1 ? "ok" : count > 1 ? "multiple" : "missing",
        };
      } catch (err) {
        console.warn("Vision pipeline error:", err);
      }
    }

    return { count: -1, status: "idle" };
  }, []);

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

  // ── STEP 3: LIVE INTERVIEW VISION PROCTORING MONITORING LOOP (320ms tick) ──
  useEffect(() => {
    if (!started || !secureMode || !streamRef.current) return;

    faceIntervalRef.current = setInterval(() => {
      const vid = videoRef.current;
      if (!vid || vid.readyState < 2 || vid.videoWidth === 0 || vid.paused || vid.ended) return;

      totalFramesRef.current += 1;
      setTotalFrames(totalFramesRef.current);

      const pipeline = visionPipelineRef.current;
      const tracker = temporalTrackerRef.current;
      if (!pipeline || !tracker || !pipeline.isReady()) return;

      const raw = pipeline.detectFrame(vid);
      const sample = {
        timestamp: Date.now(),
        personCount: raw.personCount,
        faceCount: raw.faceCount,
        phoneCount: raw.phoneCount,
        rawPhoneCandidate: raw.rawPhoneCandidate,
        objects: raw.objects,
        faces: raw.faces,
      };

      const { state, newEvents } = tracker.processFrame(sample);
      const effectivePeople = Math.max(raw.personCount, raw.faceCount);
      setPersonCount(effectivePeople);

      if (raw.phoneCount > 0 && raw.rawPhoneCandidate) {
        setLastPhoneConf(Math.round(raw.rawPhoneCandidate.confidence * 100));
      }

      for (const evt of newEvents) {
        if (evt.eventType === "PHONE_DETECTED") {
          phoneFramesRef.current++;
          setPhoneStatus("detected");
          addViolation(`Mobile phone detected in frame (${Math.round(evt.confidence * 100)}% confidence)`, "critical");
        } else if (evt.eventType === "MULTIPLE_PERSONS") {
          multipleFaceFramesRef.current += 1;
          setMultipleFaceFrames(multipleFaceFramesRef.current);
          addViolation(`Multiple individuals detected in proctored session (${effectivePeople} detected)`, "critical");
        } else if (evt.eventType === "PERSON_LEFT_FRAME") {
          addViolation("Candidate left camera frame", "high");
        }
      }

      if (state === "PHONE_DETECTED") {
        setPhoneStatus("detected");
      } else {
        setPhoneStatus("clear");
      }

      if (state === "MULTIPLE_PERSONS") {
        setFaceStatus("multiple");
      } else if (state === "NO_PERSON" || state === "PERSON_LEFT_FRAME") {
        setFaceStatus("missing");
      } else if (state === "ONE_PERSON" || effectivePeople === 1) {
        setFaceStatus("ok");
        faceOkFramesRef.current += 1;
        setFaceOkFrames(faceOkFramesRef.current);
      }
    }, 320);

    return () => { if (faceIntervalRef.current) clearInterval(faceIntervalRef.current); };
  }, [started, secureMode, addViolation]);

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

  const sc = stage === "intro" ? "#a5b4fc" : stage === "behavioral" ? "#6366f1" : stage === "technical" ? "#00ff88" : stage === "system-design" ? "#fbbf24" : "#38bdf8";
  const sl = { intro: "Intro", behavioral: "Behavioral", technical: "Technical", "system-design": "System Design", culture: "Culture" }[stage] || stage;
  const tc = liveTrust >= 80 ? "#00ff88" : liveTrust >= 60 ? "#fbbf24" : "#ff4466";
  const fc = phoneStatus === "detected" ? "#ff4466" : faceStatus === "ok" ? "#00ff88" : faceStatus === "missing" ? "#ff4466" : faceStatus === "multiple" ? "#fbbf24" : "rgba(255,255,255,0.3)";

  // ════════ SECURE: IDENTITY PAGE ════════
  if (secureMode && !started && securePhase === "identity") return (
    <div style={{ minHeight: "100vh", background: "#F6F5F1", color: "#17191C", fontFamily: "var(--font-inter, -apple-system, sans-serif)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ maxWidth: 540, width: "100%", textAlign: "center", animation: "fadeUp 0.5s ease" }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: "#356AE6", marginBottom: 8, fontWeight: 700, textTransform: "uppercase" }}>STEP 1 OF 3 — IDENTITY VERIFICATION</div>
        <h2 style={{ fontSize: "1.85rem", fontWeight: 800, letterSpacing: -0.5, marginBottom: 8, color: "#162A43" }}>Look directly at the camera</h2>
        <p style={{ color: "#667085", fontSize: 13, marginBottom: "1.5rem" }}>Align your face inside the oval. Live face detection verifies your position before capture.</p>
        
        <div style={{
          position: "relative",
          borderRadius: 16,
          overflow: "hidden",
          border: `2px solid ${identityPhoto ? "#2E7D5B" : identityFaceStatus === "ok" ? "#2E7D5B" : identityFaceStatus === "missing" ? "#C24141" : "#E4E1DA"}`,
          boxShadow: identityPhoto ? "0 4px 20px rgba(46,125,91,0.15)" : identityFaceStatus === "ok" ? "0 4px 20px rgba(46,125,91,0.12)" : "0 4px 20px rgba(22,42,67,0.06)",
          marginBottom: "1.5rem",
          background: "#FAFAF8",
          minHeight: 300,
          aspectRatio: "4/3",
          transition: "all 0.35s ease"
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

          {/* Camera permission overlay if camera is not streaming */}
          {!camOn && !identityPhoto && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(246, 245, 241, 0.95)", zIndex: 3, padding: "1.5rem" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📷</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#162A43", marginBottom: 6 }}>Camera access needed</div>
              <div style={{ fontSize: 12, color: "#667085", marginBottom: 16, maxWidth: 300, lineHeight: 1.5 }}>
                Please allow camera access to enable live face detection and identity capture.
              </div>
              <button
                onClick={initSecureCamera}
                style={{
                  padding: "10px 22px",
                  borderRadius: 8,
                  border: "none",
                  background: "#356AE6",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  letterSpacing: 0.5,
                  boxShadow: "0 2px 6px rgba(53,106,230,0.25)"
                }}
              >
                ENABLE CAMERA
              </button>
            </div>
          )}

          {identityPhoto && (
            <div style={{ position: "absolute", top: 14, right: 14, padding: "5px 14px", background: "#2E7D5B", borderRadius: 999, fontSize: 11, fontWeight: 700, color: "#FFFFFF", zIndex: 3, boxShadow: "0 2px 8px rgba(46,125,91,0.3)" }}>
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
              borderRadius: 10,
              border: "none",
              background: !camOn
                ? "#356AE6"
                : identityFaceStatus === "ok"
                  ? "#2E7D5B"
                  : "#356AE6",
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              letterSpacing: 0.5,
              boxShadow: "0 2px 8px rgba(53,106,230,0.25)",
              transition: "all 0.2s ease"
            }}
          >
            {!camOn ? "📷 Enable Camera" : identityFaceStatus === "ok" ? "📸 Capture Photo (Face Aligned)" : "📸 Capture Photo"}
          </button>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => { setIdentityPhoto(null); setIdentityFaceStatus("idle"); }}
              style={{ flex: 1, padding: "0.85rem", borderRadius: 8, border: "1px solid #E4E1DA", background: "#FFFFFF", color: "#667085", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}
            >
              ↺ Retake
            </button>
            <button
              onClick={() => setSecurePhase("precheck")}
              style={{ flex: 2, padding: "0.85rem", borderRadius: 8, border: "none", background: "#356AE6", color: "#FFFFFF", fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: 0.5, boxShadow: "0 2px 8px rgba(53,106,230,0.25)" }}
            >
              Confirm & Continue →
            </button>
          </div>
        )}

        {camErr && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#FDF2F2", border: "1px solid #F8C8C8", borderRadius: 8, fontSize: 12, color: "#C24141", textAlign: "left", lineHeight: 1.5 }}>
            ⚠ {camErr}
            <button
              onClick={initSecureCamera}
              style={{ display: "block", marginTop: 8, padding: "4px 12px", borderRadius: 6, border: "1px solid #F8C8C8", background: "#FFFFFF", color: "#C24141", cursor: "pointer", fontSize: 11, fontWeight: 600 }}
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
    <div style={{ minHeight: "100vh", background: "#F6F5F1", color: "#17191C", fontFamily: "var(--font-inter, -apple-system, sans-serif)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <div style={{ maxWidth: 480, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: "#356AE6", marginBottom: 8, fontWeight: 700, textTransform: "uppercase" }}>STEP 2 OF 3 — SYSTEM CHECK</div>
          <h2 style={{ fontSize: "1.85rem", fontWeight: 800, letterSpacing: -0.5, color: "#162A43" }}>Verifying Environment</h2>
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
            <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 14, padding: "1rem 1.25rem", background: done ? "#EAF4EE" : "#FFFFFF", border: `1px solid ${done ? "#C8E4D3" : active ? "#356AE6" : "#E4E1DA"}`, borderRadius: 10, marginBottom: 10, transition: "all 0.2s ease", boxShadow: "0 1px 3px rgba(22,42,67,0.03)" }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: done ? "#2E7D5B" : "#162A43" }}>{item.label}</div>
                <div style={{ fontSize: 11, color: done ? "#2E7D5B" : "#667085", marginTop: 2 }}>{item.sub}</div>
              </div>
              {done ? <span style={{ fontSize: 16, color: "#2E7D5B", fontWeight: 800 }}>✓</span>
                : active ? <span style={{ animation: "spin 0.8s linear infinite", display: "inline-block", color: "#356AE6", fontSize: 16 }}>⟳</span>
                  : <span style={{ color: "#E4E1DA", fontSize: 16 }}>○</span>}
            </div>
          );
        })}
        {checkStep === -1 && (
          <button onClick={runPrechecks} style={{ width: "100%", padding: "0.85rem", marginTop: 14, borderRadius: 8, border: "none", background: "#356AE6", color: "#FFFFFF", fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: 0.5, boxShadow: "0 2px 8px rgba(53,106,230,0.25)" }}>⚡ START SYSTEM CHECK →</button>
        )}
      </div>
    </div>
  );

  // ════════ SETUP PAGE (normal + secure toggle) ════════
  if (!started) return (
    <div style={{ minHeight: "100vh", background: "#F6F5F1", color: "#17191C", fontFamily: "var(--font-inter, -apple-system, sans-serif)" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        textarea:focus,input:focus{outline:none;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:#D0D5DD;border-radius:2px;}
      `}</style>
      
      {/* Top Bar */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 24px", background: "#FFFFFF", borderBottom: "1px solid #E4E1DA" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, background: "#162A43", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", fontSize: 13, fontWeight: 700 }}>
            C
          </div>
          <span style={{ fontWeight: 700, fontSize: 14, color: "#162A43", letterSpacing: "-0.01em" }}>COGNALYZE</span>
          <span style={{ fontSize: 11, padding: "2px 8px", border: `1px solid ${secureMode ? "#F8C8C8" : "#E4E1DA"}`, background: secureMode ? "#FEF3F2" : "#FAF9F6", borderRadius: 5, color: secureMode ? "#C24141" : "#667085", fontWeight: 600 }}>
            {secureMode ? "SECURE PROCTORED" : "INTERVIEW STUDIO"}
          </span>
        </div>
        <a href="/" style={{ color: "#667085", textDecoration: "none", fontSize: 13, fontWeight: 500 }}>← Exit to Dashboard</a>
      </div>

      <div style={{ maxWidth: 680, margin: "0 auto", padding: "40px 24px 80px", animation: "fadeUp 0.3s ease", width: "100%", boxSizing: "border-box" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 11, letterSpacing: 1.5, color: "#356AE6", marginBottom: 8, fontWeight: 700, textTransform: "uppercase" }}>
            EVIDENCE-DRIVEN TECHNICAL EVALUATION
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#162A43", letterSpacing: "-0.02em", lineHeight: 1.2, margin: "0 0 8px" }}>
            Technical Interview with Alex
          </h1>
          <p style={{ color: "#667085", fontSize: 14, margin: 0 }}>
            Live 7-dimension competency scoring · Grounded claim verification · Verifiable evidence audit
          </p>
        </div>

        {/* Secure Mode Toggle Card */}
        <div 
          onClick={() => setSecureMode(p => !p)} 
          style={{ 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "space-between", 
            padding: "14px 18px", 
            background: secureMode ? "#FEF3F2" : "#FFFFFF", 
            border: `1px solid ${secureMode ? "#F8C8C8" : "#E4E1DA"}`, 
            borderRadius: 10, 
            marginBottom: 14, 
            cursor: "pointer", 
            boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 36, height: 36, borderRadius: 7, background: secureMode ? "#FEE4E2" : "#FAF9F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>
              🛡️
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: secureMode ? "#C24141" : "#17191C" }}>
                Secure Proctored Evaluation
              </div>
              <div style={{ fontSize: 12, color: "#667085", marginTop: 2 }}>
                Biometric attention monitoring · External tab integrity · Evidence audit trail
              </div>
            </div>
          </div>
          <div style={{ width: 42, height: 24, borderRadius: 999, background: secureMode ? "#C24141" : "#E4E1DA", position: "relative", flexShrink: 0, transition: "background 0.2s ease" }}>
            <div style={{ position: "absolute", top: 2, left: secureMode ? 20 : 2, width: 20, height: 20, borderRadius: "50%", background: "#FFFFFF", transition: "left 0.2s ease", boxShadow: "0 1px 2px rgba(0,0,0,0.15)" }} />
          </div>
        </div>

        {/* Interaction Mode Selection */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
          {[
            { id: "text", icon: "⌨️", label: "Text Mode", sub: "Standard typed dialogue & code" },
            { id: "voice", icon: "🎤", label: "Voice Mode", sub: voiceOk ? "Real-time speech conversation" : "Chrome only" }
          ].map(m => (
            <div 
              key={m.id} 
              onClick={() => m.id === "voice" ? voiceOk && setMode("voice") : setMode("text")} 
              style={{ 
                padding: "16px 14px", 
                borderRadius: 10, 
                border: `1px solid ${mode === m.id ? "#356AE6" : "#E4E1DA"}`, 
                background: mode === m.id ? "#FFFFFF" : "#FFFFFF", 
                cursor: m.id === "voice" && !voiceOk ? "not-allowed" : "pointer", 
                textAlign: "center", 
                boxShadow: mode === m.id ? "0 0 0 1px #356AE6, 0 1px 3px rgba(16, 24, 40, 0.04)" : "0 1px 3px rgba(16, 24, 40, 0.04)",
                opacity: m.id === "voice" && !voiceOk ? 0.4 : 1 
              }}
            >
              <div style={{ fontSize: 22, marginBottom: 4 }}>{m.icon}</div>
              <div style={{ fontWeight: 600, fontSize: 13, color: mode === m.id ? "#162A43" : "#17191C", marginBottom: 2 }}>{m.label}</div>
              <div style={{ fontSize: 11, color: "#667085" }}>{m.sub}</div>
            </div>
          ))}
        </div>

        {/* Inputs Card */}
        <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 20, marginBottom: 14, boxShadow: "0 1px 3px rgba(16, 24, 40, 0.04)" }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, letterSpacing: 0.5, color: "#162A43", marginBottom: 6, fontWeight: 700 }}>
              TARGET JOB DESCRIPTION
            </div>
            <textarea 
              value={jd} 
              onChange={e => setJd(e.target.value)} 
              rows={4} 
              style={{ width: "100%", background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 7, padding: 12, color: "#17191C", fontSize: 13, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box" }} 
              onFocus={e => e.target.style.borderColor = "#356AE6"} 
              onBlur={e => e.target.style.borderColor = "#E4E1DA"} 
              placeholder="Paste the target job description or requirements..." 
            />
          </div>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 0.5, color: "#162A43", marginBottom: 6, fontWeight: 700 }}>
              CANDIDATE RESUME / EXPERIENCE
            </div>
            <textarea 
              value={resume} 
              onChange={e => setResume(e.target.value)} 
              rows={4} 
              style={{ width: "100%", background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 7, padding: 12, color: "#17191C", fontSize: 13, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box" }} 
              onFocus={e => e.target.style.borderColor = "#356AE6"} 
              onBlur={e => e.target.style.borderColor = "#E4E1DA"} 
              placeholder="Paste candidate resume text or verified claims..." 
            />
          </div>
        </div>

        {secureMode && (
          <div style={{ padding: "10px 14px", background: "#FEF3F2", border: "1px solid #F8C8C8", borderRadius: 7, marginBottom: 14, fontSize: 12, color: "#C24141", lineHeight: 1.5 }}>
            🔒 <strong>Secure protocol active:</strong> Camera and microphone access are monitored. Window switches, paste events, and non-authentic responses are logged to the recruiter evidence passport.
          </div>
        )}

        <button 
          onClick={startInterview} 
          disabled={!jd || !resume} 
          style={{ 
            width: "100%", 
            padding: "12px 18px", 
            borderRadius: 7, 
            border: "none", 
            background: !jd || !resume ? "#98A2B3" : secureMode ? "#C24141" : "#356AE6", 
            color: "#FFFFFF", 
            fontSize: 14, 
            fontWeight: 600, 
            cursor: !jd || !resume ? "not-allowed" : "pointer", 
            opacity: !jd || !resume ? 0.6 : 1, 
            boxShadow: "0 1px 2px rgba(16, 24, 40, 0.05)", 
            transition: "background 0.15s ease" 
          }}
        >
          {secureMode ? "Begin Secure Proctored Session →" : mode === "voice" ? "Start Voice Interview Session →" : "Start Technical Interview →"}
        </button>
      </div>
    </div>
  );

  // ════════ ACTIVE INTERVIEW ════════
  return (
    <div style={{ height: "100vh", background: "#0D1929", color: "#F1F5F9", fontFamily: "var(--font-inter, -apple-system, sans-serif)", display: "flex", flexDirection: "column", overflow: "hidden" }} onContextMenu={secureMode ? e => e.preventDefault() : undefined}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes ripple{0%{transform:scale(1);opacity:0.5}100%{transform:scale(2.2);opacity:0}}
        @keyframes wave{0%,100%{height:4px}50%{height:16px}}
        @keyframes slideIn{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}
        textarea:focus,input:focus{outline:none;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:#334155;border-radius:2px;}
      `}</style>

      {showVerdict && finalVerdict && <VerdictModal verdict={finalVerdict} onClose={() => setShowVerdict(false)} />}
      {showTrustReport && trustReport && <TrustReportModal report={trustReport} aiChecks={aiChecks} onClose={() => setShowTrustReport(false)} onDownload={downloadTrustReport} />}

      {/* ── PROCTORING BAR (secure only) ── */}
      {secureMode && (
        <div style={{ flexShrink: 0, background: "#111C2E", borderBottom: "1px solid #233752", padding: "8px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 10px", background: "rgba(194,65,65,0.15)", border: "1px solid rgba(194,65,65,0.35)", borderRadius: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#C24141", animation: "blink 1s infinite" }} />
              <span style={{ fontSize: 10, color: "#F87171", fontWeight: 700, letterSpacing: 1 }}>PROCTORING ACTIVE</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: fc }} />
              <span style={{ fontSize: 11, color: "#94A3B8" }}>Candidate: <span style={{ color: fc, fontWeight: 600 }}>{faceStatus === "ok" ? "1 Present ✓" : faceStatus === "missing" ? "Missing! ✗" : faceStatus === "multiple" ? `Multiple (${personCount}) ⚠` : "Checking..."}</span></span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: "#94A3B8" }}>Phone: <span style={{ color: phoneStatus === "detected" ? "#F87171" : "#34D399", fontWeight: 600 }}>{phoneStatus === "detected" ? `DETECTED! 📱 (${lastPhoneConf}%)` : "Clear ✓"}</span></span>
            </div>
            <span style={{ fontSize: 11, color: "#94A3B8" }}>Tabs: <span style={{ color: tabSwitches > 0 ? "#F87171" : "#34D399", fontWeight: 600 }}>{tabSwitches}</span></span>
            {pasteCount > 0 && <span style={{ fontSize: 11, color: "#FBBF24" }}>📋 Pastes: {pasteCount}</span>}
            {aiWarnings > 0 && <span style={{ fontSize: 11, color: "#F87171" }}>🤖 Flags: {aiWarnings}</span>}
            {violations.length > 0 && <span style={{ fontSize: 11, color: "#F87171", fontWeight: 600 }}>⚠ {violations.length}</span>}
          </div>
          <TrustRing score={liveTrust} size={28} />
        </div>
      )}

      {/* ── TOP BAR ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 20px", borderBottom: "1px solid #233752", flexShrink: 0, background: "#162A43" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2E7D5B" }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>Evaluation Studio{secureMode ? " 🛡️" : ""}</span>
          <div style={{ padding: "2px 8px", background: "rgba(53, 106, 230, 0.15)", border: "1px solid rgba(53, 106, 230, 0.35)", borderRadius: 5 }}>
            <span style={{ fontSize: 11, color: "#60A5FA", fontWeight: 600 }}>{sl}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {scoring && <span style={{ fontSize: 11, color: "#60A5FA", animation: "blink 0.8s infinite" }}>● evaluating</span>}
          {buildingVerdict && <span style={{ fontSize: 11, color: "#FBBF24", animation: "blink 0.8s infinite" }}>● synthesizing verdict</span>}
          {buildingTrustReport && <span style={{ fontSize: 11, color: "#F87171", animation: "blink 0.8s infinite" }}>● compiling passport</span>}
          <span style={{ fontSize: 11, color: "#94A3B8", padding: "3px 8px", background: "rgba(255,255,255,0.06)", borderRadius: 5 }}>Q{qNum}</span>
          {ended && finalVerdict && <button onClick={() => setShowVerdict(true)} style={{ padding: "6px 14px", borderRadius: 7, border: "none", background: "#356AE6", color: "#FFFFFF", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Verdict 🏆</button>}
          {ended && trustReport && secureMode && <button onClick={() => setShowTrustReport(true)} style={{ padding: "6px 14px", borderRadius: 7, border: "none", background: "#C24141", color: "#FFFFFF", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Trust Report 🛡️</button>}
          <button onClick={endInterview} disabled={ended || buildingVerdict} style={{ padding: "6px 14px", borderRadius: 7, border: "1px solid rgba(194,65,65,0.4)", background: "rgba(194,65,65,0.15)", color: "#F87171", cursor: ended || buildingVerdict ? "not-allowed" : "pointer", fontSize: 12, fontWeight: 600, opacity: ended || buildingVerdict ? 0.5 : 1 }}>
            {buildingVerdict ? "Synthesizing..." : "End Session"}
          </button>
        </div>
      </div>

      {/* ── MAIN 3-COLUMN ── */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "230px 1fr 240px", overflow: "hidden" }}>

        {/* LEFT */}
        <div style={{ borderRight: "1px solid #233752", display: "flex", flexDirection: "column", gap: 8, padding: 10, background: "#0B1422" }}>
          {/* Alex */}
          <div style={{ flex: 2, borderRadius: 10, overflow: "hidden", border: `1px solid ${speaking ? "#356AE6" : "#233752"}`, transition: "border-color 0.2s ease", minHeight: 0 }}>
            <AlexFace speaking={speaking} listening={listening} />
          </div>

          {/* User cam */}
          <div style={{ flex: 1, borderRadius: 10, overflow: "hidden", border: `1px solid ${secureMode ? fc + "40" : "#233752"}`, background: "#0F172A", position: "relative", display: "flex", alignItems: "center", justifyContent: "center", minHeight: 110 }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", display: camOn || secureMode ? "block" : "none" }} />
            {secureMode && <FaceOval status={faceStatus} />}
            {!camOn && !secureMode && (
              <div style={{ textAlign: "center", zIndex: 1, padding: 10 }}>
                <div style={{ fontSize: 24, marginBottom: 6 }}>🧑</div>
                <button onClick={() => setCamOn(true)} style={{ padding: "5px 12px", borderRadius: 7, border: "1px solid #356AE6", background: "rgba(53,106,230,0.15)", color: "#60A5FA", cursor: "pointer", fontSize: 11, fontWeight: 600, display: "block", margin: "0 auto" }}>Enable Camera</button>
                {camErr && <div style={{ fontSize: 10, color: "#F87171", marginTop: 4 }}>{camErr}</div>}
              </div>
            )}
            {camOn && !secureMode && <button onClick={() => { streamRef.current?.getTracks().forEach(t => t.stop()); if (videoRef.current) videoRef.current.srcObject = null; setCamOn(false); }} style={{ position: "absolute", top: 6, right: 6, padding: "2px 7px", borderRadius: 5, border: "1px solid rgba(194,65,65,0.4)", background: "rgba(194,65,65,0.2)", color: "#F87171", cursor: "pointer", fontSize: 10, zIndex: 3 }}>off</button>}
            <div style={{ position: "absolute", bottom: 6, left: 8, fontSize: 10, color: "#94A3B8", fontWeight: 600, zIndex: 2 }}>Candidate</div>
            {bodyScanning && camOn && !secureMode && <div style={{ position: "absolute", top: 6, left: 8, fontSize: 9, color: "#F97316", animation: "blink 0.8s infinite", zIndex: 2 }}>● analyzing</div>}
          </div>

          {/* Trust display (secure only) */}
          {secureMode && (
            <div style={{ padding: "10px 12px", background: "#111C2E", border: "1px solid #233752", borderRadius: 8, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 10, letterSpacing: 1, color: "#94A3B8", fontWeight: 600 }}>PASSPORT INTEGRITY</span>
                <span style={{ fontSize: 10, color: tc, fontWeight: 700 }}>{liveTrust >= 80 ? "VERIFIED" : liveTrust >= 60 ? "CAUTION" : "FLAGGED"}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "center", margin: "6px 0" }}>
                <TrustRing score={liveTrust} size={50} />
              </div>
              <div style={{ height: 4, background: "#1E293B", borderRadius: 999, marginTop: 6, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${liveTrust}%`, background: tc, borderRadius: 999, transition: "width 0.5s ease" }} />
              </div>
            </div>
          )}

          {/* Camera & Observable Presentation (normal only) */}
          {bodyLang && !secureMode && (
            <div style={{ padding: "10px 12px", background: "#111C2E", border: "1px solid #233752", borderRadius: 8, flexShrink: 0 }}>
              <div style={{ fontSize: 10, letterSpacing: 1, color: "#94A3B8", fontWeight: 700, marginBottom: 8 }}>CAMERA & PRESENTATION</div>
              {[["Framing", bodyLang.posture], ["Camera Gaze", bodyLang.eyeContact], ["Camera Position", bodyLang.confidence], ["Lighting", bodyLang.expression]].map(([l, v]) => (
                <div key={l as string} style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 11, color: "#94A3B8" }}>{l}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: Number(v) >= 70 ? "#34D399" : Number(v) >= 50 ? "#FBBF24" : "#F87171" }}>{Number(v) >= 70 ? "Optimal" : Number(v) >= 50 ? "Acceptable" : "Adjust"}</span>
                </div>
              ))}
              {bodyLang.notes && <div style={{ fontSize: 10, color: "#64748B", marginTop: 4, fontStyle: "italic", lineHeight: 1.3 }}>{bodyLang.notes}</div>}
            </div>
          )}

          {/* Status */}
          <div style={{ padding: "8px 12px", background: "#111C2E", border: "1px solid #233752", borderRadius: 8, flexShrink: 0 }}>
            <div style={{ color: speaking ? "#60A5FA" : listening ? "#34D399" : loading ? "#94A3B8" : "#64748B", fontWeight: 600, fontSize: 11 }}>
              {speaking ? "🔊 Alex speaking..." : listening ? "🎤 Listening..." : loading ? "💭 Processing response..." : "✓ Ready"}
            </div>
            <div style={{ color: "#64748B", fontSize: 10, marginTop: 2 }}>{mode === "voice" ? "Voice mode" : "Text mode"} · Question {qNum}</div>
          </div>
        </div>

        {/* CENTER — Chat */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: "#0D1929" }}>
          {mode === "voice" && (speaking || listening || transcript) && (
            <div style={{ padding: "8px 16px", background: "#111C2E", borderBottom: "1px solid #233752", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", gap: 3, alignItems: "flex-end" }}>
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} style={{ width: 2.5, background: speaking ? "#356AE6" : "#2E7D5B", borderRadius: 999, minHeight: 3, maxHeight: 16, animation: `wave ${0.3 + i * 0.06}s ease-in-out infinite alternate`, animationDelay: `${i * 0.06}s` }} />
                ))}
              </div>
              <span style={{ fontSize: 12, color: speaking ? "#60A5FA" : "#34D399" }}>
                {speaking ? "Alex speaking..." : "Listening..."}
                {transcript && ` — "${transcript.slice(0, 50)}${transcript.length > 50 ? "..." : ""}"`}
              </span>
            </div>
          )}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 16, flexDirection: m.role === "assistant" ? "row" : "row-reverse", animation: "fadeUp 0.2s ease" }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: m.role === "assistant" ? "#162A43" : "#356AE6", border: "1px solid #233752", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, color: "#FFFFFF" }}>
                  {m.role === "assistant" ? "A" : "U"}
                </div>
                <div style={{ maxWidth: "80%" }}>
                  <div style={{ padding: "10px 14px", borderRadius: m.role === "assistant" ? "2px 10px 10px 10px" : "10px 2px 10px 10px", background: m.role === "assistant" ? "#1E293B" : "#356AE6", border: m.role === "assistant" ? "1px solid #334155" : "none", fontSize: 13, lineHeight: 1.6, color: "#FFFFFF" }}>
                    {m.content}
                  </div>
                  <div style={{ fontSize: 10, color: "#64748B", marginTop: 4, textAlign: m.role === "user" ? "right" : "left" }}>{m.time}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 28, height: 28, borderRadius: 6, background: "#162A43", border: "1px solid #233752", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0, color: "#FFFFFF" }}>A</div>
                <div style={{ padding: "10px 14px", background: "#1E293B", border: "1px solid #334155", borderRadius: "2px 10px 10px 10px", display: "flex", gap: 5, alignItems: "center" }}>
                  {[0, 1, 2].map(i => <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#60A5FA", animation: `blink 1.2s infinite ${i * 0.25}s` }} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "12px 16px", borderTop: "1px solid #233752", background: "#111C2E", flexShrink: 0 }}>
            {ended ? (
              <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "center" }}>
                {buildingVerdict || buildingTrustReport ? (
                  <span style={{ fontSize: 13, color: "#FBBF24" }}><span style={{ animation: "spin 1s linear infinite", display: "inline-block", marginRight: 6 }}>⟳</span>{buildingVerdict ? "Synthesizing verdict..." : "Compiling integrity passport..."}</span>
                ) : (
                  <>
                    <span style={{ fontSize: 13, color: "#94A3B8" }}>Session complete</span>
                    {finalVerdict && <button onClick={() => setShowVerdict(true)} style={{ padding: "7px 16px", borderRadius: 7, border: "none", background: "#356AE6", color: "#FFFFFF", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Verdict 🏆</button>}
                    {trustReport && secureMode && <button onClick={() => setShowTrustReport(true)} style={{ padding: "7px 16px", borderRadius: 7, border: "none", background: "#C24141", color: "#FFFFFF", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>Trust Report 🛡️</button>}
                    <a href="/"><button style={{ padding: "7px 14px", borderRadius: 7, border: "1px solid #334155", background: "#1E293B", color: "#94A3B8", cursor: "pointer", fontSize: 12 }}>Home</button></a>
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
                    addViolation("Text pasted — external source review logged", "high");
                  } : undefined}
                  placeholder="Type your response... (Enter to send, Shift+Enter for new line)"
                  rows={2}
                  style={{ flex: 1, background: "#1E293B", border: "1px solid #334155", borderRadius: 7, padding: "10px 12px", color: "#FFFFFF", fontSize: 13, resize: "none", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = "#356AE6"}
                  onBlur={e => e.target.style.borderColor = "#334155"}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => send()} disabled={!input.trim() || loading} style={{ width: 38, height: 38, borderRadius: 7, border: "none", background: !input.trim() || loading ? "#334155" : "#356AE6", cursor: !input.trim() || loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, color: "#FFFFFF" }}>
                    {loading ? <span style={{ animation: "spin 1s linear infinite", display: "inline-block", fontSize: 12 }}>⟳</span> : "↑"}
                  </button>
                  {voiceOk && <button onClick={() => setMode("voice")} style={{ width: 38, height: 38, borderRadius: 7, border: "1px solid #334155", background: "#1E293B", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}>🎤</button>}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ position: "relative" }}>
                    {listening && <div style={{ position: "absolute", inset: -6, borderRadius: "50%", border: "2px solid #C24141", animation: "ripple 1.5s ease-out infinite" }} />}
                    <button onClick={listening ? stopListening : () => { if (!speaking && !loading) startListening(); }} disabled={speaking || loading} style={{ width: 48, height: 48, borderRadius: "50%", border: "none", background: listening ? "#C24141" : speaking || loading ? "#334155" : "#356AE6", cursor: speaking || loading ? "not-allowed" : "pointer", fontSize: 20, display: "flex", alignItems: "center", justifyContent: "center", transition: "all 0.15s ease", opacity: speaking || loading ? 0.5 : 1 }}>
                      {listening ? "⏹" : "🎤"}
                    </button>
                  </div>
                  <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                    <div style={{ color: listening ? "#34D399" : speaking ? "#60A5FA" : loading ? "#94A3B8" : "#64748B", fontWeight: 600 }}>
                      {listening ? "Listening — tap to complete" : speaking ? "Alex speaking..." : loading ? "Analyzing response..." : "Tap mic to speak"}
                    </div>
                    {transcript && <div style={{ fontSize: 11, color: "#94A3B8", fontStyle: "italic" }}>"{transcript.slice(0, 50)}{transcript.length > 50 ? "..." : ""}"</div>}
                  </div>
                </div>
                <button onClick={() => { synthRef.current?.cancel(); stopListening(); setMode("text"); }} style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid #334155", background: "#1E293B", color: "#94A3B8", cursor: "pointer", fontSize: 11 }}>⌨️ Switch to Text</button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT */}
        <div style={{ borderLeft: "1px solid #233752", display: "flex", flexDirection: "column", background: "#0B1422", overflow: "hidden" }}>
          {secureMode ? (
            // Secure: top = score panel, bottom = violations log
            <>
              <div style={{ flex: 1, overflow: "hidden", borderBottom: "1px solid #233752" }}>
                <ScorePanel score={score} updating={scoring} />
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ padding: "8px 12px", borderBottom: "1px solid #233752", fontSize: 10, letterSpacing: 1, color: "#94A3B8", fontWeight: 700 }}>INTEGRITY LOG</div>
                <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
                  {violations.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "1.5rem 0", color: "#64748B", fontSize: 11 }}>
                      <div style={{ fontSize: 18, marginBottom: 4, color: "#34D399" }}>✓</div>Zero integrity violations
                    </div>
                  ) : [...violations].reverse().map((v, i) => (
                    <div key={i} style={{ marginBottom: 6, padding: "6px 10px", background: "rgba(194,65,65,0.12)", border: "1px solid rgba(194,65,65,0.3)", borderRadius: 6, animation: "slideIn 0.2s ease" }}>
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#F87171", marginBottom: 1 }}>{v.type}</div>
                      <div style={{ fontSize: 10, color: "#94A3B8" }}>{v.time}</div>
                    </div>
                  ))}
                </div>
                <div style={{ padding: "8px 12px", borderTop: "1px solid #233752" }}>
                  {[["Face OK", totalFrames > 0 ? `${Math.round(faceOkFrames / totalFrames * 100)}%` : "100%", faceOkFrames / (totalFrames || 1) >= 0.8 ? "#34D399" : "#F87171"], ["Tab Switches", String(tabSwitches), tabSwitches === 0 ? "#34D399" : "#F87171"], ["Pastes", String(pasteCount), pasteCount === 0 ? "#34D399" : "#F87171"], ["AI Flags", String(aiWarnings), aiWarnings === 0 ? "#34D399" : "#F87171"]].map(([l, v, c]) => (
                    <div key={l as string} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                      <span style={{ fontSize: 10, color: "#94A3B8" }}>{l}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: c as string }}>{v}</span>
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