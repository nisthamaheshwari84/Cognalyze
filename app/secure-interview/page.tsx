"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { VisionPipeline } from "@/lib/camera/vision-models";
import { TemporalTracker } from "@/lib/camera/temporal-tracker";

interface Msg { role: "user" | "assistant"; content: string; time: string; }
interface Violation { time: string; type: string; severity: "critical" | "high" | "medium" | "low"; }
interface AICheck { isAI: boolean; ai_score: number; risk_level: string; signals_found: string[]; verdict: string; }
interface TrustReport { trust_score: number; verdict: string; verdict_reason: string; breakdown: Record<string, { score: number; label: string; note: string }>; flags: string[]; ai_observation: string; recruiter_recommendation: string; confidence_level: string; }
interface ScoreBreakdown { relevance: number; technicalAccuracy: number; communicationClarity: number; problemSolving: number; depth: number; examples: number; confidence: number; }
interface ScoreEvidence { strengths: string[]; improvements: string[]; suggestedAnswer: string; scoreReason: string; }
interface ScoreData { overall: number; breakdown: ScoreBreakdown; evidence: ScoreEvidence; verdict: string; hiringSignal: string; bodyLanguage: any; timestamp: number; }
interface FinalVerdict { decision: string; confidence: number; headline: string; overview: string; hire_reasons: string[]; no_hire_reasons: string[]; standout_moments: string[]; concerning_moments: string[]; scorecard: Record<string, { score: number; comment: string }>; next_steps: string; interviewer_note: string; }

const ZERO_SCORE: ScoreData = {
  overall: 0, timestamp: 0,
  breakdown: { relevance: 0, technicalAccuracy: 0, communicationClarity: 0, problemSolving: 0, depth: 0, examples: 0, confidence: 0 },
  evidence: { strengths: [], improvements: [], suggestedAnswer: "", scoreReason: "Answer the first question to see your score" },
  verdict: "Waiting...", hiringSignal: "NEUTRAL",
  bodyLanguage: { overall: 0, posture: 0, eyeContact: 0, confidence: 0, expression: 0, notes: "" }
};

// ─── TRUST RING ───
function TrustRing({ score, size = 60 }: { score: number; size?: number }) {
  const c = score >= 80 ? "#00ff88" : score >= 60 ? "#fbbf24" : "#ff4466";
  const r = size * 0.42, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={size * 0.07} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={c} strokeWidth={size * 0.07}
          strokeDasharray={circ} strokeDashoffset={circ - (circ * score / 100)}
          strokeLinecap="round" style={{ transition: "all 0.8s ease", filter: `drop-shadow(0 0 ${size * 0.1}px ${c})` }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: size * 0.22, fontWeight: 900, color: c, lineHeight: 1 }}>{score}</span>
      </div>
    </div>
  );
}

// ─── SCORE PANEL ───
function ScorePanel({ score, updating }: { score: ScoreData; updating: boolean }) {
  const ov = score.overall, bd = score.breakdown, ev = score.evidence;
  const hs = score.hiringSignal;
  const hsColor = hs === "STRONG" ? "#00ff88" : hs === "MODERATE" ? "#fbbf24" : hs === "WEAK" ? "#ff8c00" : hs === "CRITICAL" ? "#ff4466" : "rgba(255,255,255,0.2)";
  const oc = ov >= 75 ? "#00ff88" : ov >= 55 ? "#fbbf24" : ov > 0 ? "#ff4466" : "rgba(255,255,255,0.15)";
  const r = 38, circ = 2 * Math.PI * r;
  const DIMS = [
    { key: "relevance", label: "Relevance", max: 20, color: "#356AE6" },
    { key: "technicalAccuracy", label: "Technical", max: 20, color: "#2E7D5B" },
    { key: "communicationClarity", label: "Clarity", max: 15, color: "#356AE6" },
    { key: "problemSolving", label: "Problem Solving", max: 15, color: "#B7791F" },
    { key: "depth", label: "Depth", max: 15, color: "#162A43" },
    { key: "examples", label: "Examples", max: 10, color: "#2E7D5B" },
    { key: "confidence", label: "Confidence", max: 5, color: "#356AE6" },
  ];
  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "10px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 9, letterSpacing: 2, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>LIVE SCORE</span>
        {updating && <span style={{ fontSize: 9, color: "rgba(99,102,241,0.7)", animation: "blink 0.6s infinite" }}>● updating</span>}
      </div>
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{ position: "relative", width: 84, height: 84, margin: "0 auto 6px" }}>
          <svg width="84" height="84" style={{ transform: "rotate(-90deg)" }}>
            <circle cx="42" cy="42" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
            <circle cx="42" cy="42" r={r} fill="none" stroke={oc} strokeWidth="6"
              strokeDasharray={circ} strokeDashoffset={circ - (circ * ov / 100)}
              strokeLinecap="round" style={{ transition: "all 1s ease", filter: ov > 0 ? `drop-shadow(0 0 8px ${oc})` : "none" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "1.4rem", fontWeight: 900, color: oc, lineHeight: 1 }}>{ov > 0 ? ov : "—"}</span>
            <span style={{ fontSize: 8, color: "rgba(255,255,255,0.3)" }}>/ 100</span>
          </div>
        </div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 9px", background: `${hsColor}15`, border: `1px solid ${hsColor}30`, borderRadius: 999 }}>
          <div style={{ width: 4, height: 4, borderRadius: "50%", background: hsColor }} />
          <span style={{ fontSize: 8, color: hsColor, fontWeight: 700, letterSpacing: 1 }}>{hs}</span>
        </div>
        {score.verdict && <div style={{ fontSize: 9, color: "rgba(255,255,255,0.35)", marginTop: 4, fontStyle: "italic", lineHeight: 1.4, padding: "0 4px" }}>"{score.verdict}"</div>}
      </div>
      <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 10, padding: "8px", marginBottom: 7 }}>
        <div style={{ fontSize: 8, letterSpacing: 2, color: "rgba(255,255,255,0.25)", marginBottom: 7, fontWeight: 600 }}>BREAKDOWN</div>
        {DIMS.map(d => {
          const val = (bd as any)[d.key] || 0, pct = (val / d.max) * 100;
          const c = pct >= 75 ? "#00ff88" : pct >= 50 ? "#fbbf24" : pct > 0 ? "#ff4466" : "rgba(255,255,255,0.1)";
          return (
            <div key={d.key} style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.45)" }}>{d.label}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: c }}>{val > 0 ? `${val}/${d.max}` : "—"}</span>
              </div>
              <div style={{ height: 2.5, background: "rgba(255,255,255,0.06)", borderRadius: 999, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: `linear-gradient(90deg,${d.color}50,${d.color})`, borderRadius: 999, transition: "width 0.9s ease" }} />
              </div>
            </div>
          );
        })}
        {ev.scoreReason && <div style={{ marginTop: 5, padding: "5px 7px", background: "rgba(99,102,241,0.07)", borderRadius: 7, fontSize: 9, color: "rgba(99,102,241,0.8)", lineHeight: 1.5, borderLeft: "2px solid rgba(99,102,241,0.35)" }}>{ev.scoreReason}</div>}
      </div>
      {ev.strengths?.length > 0 && (
        <div style={{ background: "rgba(0,255,136,0.04)", border: "1px solid rgba(0,255,136,0.12)", borderRadius: 9, padding: "7px 9px", marginBottom: 6 }}>
          <div style={{ fontSize: 8, color: "#00ff88", fontWeight: 600, marginBottom: 5, letterSpacing: 1 }}>✓ STRENGTHS</div>
          {ev.strengths.slice(0, 3).map((s, i) => <div key={i} style={{ display: "flex", gap: 4, marginBottom: 4 }}><span style={{ color: "#00ff88", fontSize: 9, flexShrink: 0 }}>•</span><span style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>{s}</span></div>)}
        </div>
      )}
      {ev.improvements?.length > 0 && (
        <div style={{ background: "rgba(255,68,102,0.04)", border: "1px solid rgba(255,68,102,0.12)", borderRadius: 9, padding: "7px 9px", marginBottom: 6 }}>
          <div style={{ fontSize: 8, color: "#ff4466", fontWeight: 600, marginBottom: 5, letterSpacing: 1 }}>⚠ IMPROVE</div>
          {ev.improvements.slice(0, 3).map((s, i) => <div key={i} style={{ display: "flex", gap: 4, marginBottom: 4 }}><span style={{ color: "#ff4466", fontSize: 9, flexShrink: 0 }}>•</span><span style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>{s}</span></div>)}
        </div>
      )}
      {ev.suggestedAnswer && (
        <div style={{ background: "rgba(251,191,36,0.04)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: 9, padding: "7px 9px" }}>
          <div style={{ fontSize: 8, color: "#fbbf24", fontWeight: 600, marginBottom: 4, letterSpacing: 1 }}>🎯 STRONGER ANSWER</div>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", lineHeight: 1.5, margin: 0, fontStyle: "italic" }}>{ev.suggestedAnswer}</p>
        </div>
      )}
    </div>
  );
}

// ─── ALEX FACE ───
function AlexFace({ speaking, listening }: { speaking: boolean; listening: boolean }) {
  return (
    <div style={{ width: "100%", height: "100%", background: "linear-gradient(160deg,#0f0c24,#1a0e35,#0d1a2e)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
      <style>{`
        @keyframes floatFace{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
        @keyframes speakGlow{0%,100%{box-shadow:0 0 20px rgba(99,102,241,0.3)}50%{box-shadow:0 0 60px rgba(99,102,241,0.8),0 0 120px rgba(168,85,247,0.5)}}
        @keyframes eyeBlink{0%,88%,100%{transform:scaleY(1)}93%{transform:scaleY(0.05)}}
        @keyframes mouthTalk{0%,100%{height:4px}50%{height:16px}}
        @keyframes bgPulse{0%,100%{opacity:0.3}50%{opacity:0.7}}
        @keyframes ringOut{0%{transform:scale(1);opacity:0.5}100%{transform:scale(2.2);opacity:0}}
      `}</style>
      <div style={{ position: "absolute", width: 240, height: 240, borderRadius: "50%", background: "radial-gradient(circle,rgba(99,102,241,0.25),transparent 70%)", animation: "bgPulse 3s ease-in-out infinite", filter: "blur(25px)" }} />
      {speaking && [1, 2, 3].map(i => (
        <div key={i} style={{ position: "absolute", width: `${95 + i * 60}px`, height: `${95 + i * 60}px`, borderRadius: "50%", border: `1.5px solid rgba(99,102,241,${0.5 - i * 0.13})`, animation: `ringOut ${0.7 + i * 0.25}s ease-out infinite`, animationDelay: `${i * 0.18}s`, pointerEvents: "none" }} />
      ))}
      <div style={{ position: "relative", animation: speaking ? "none" : "floatFace 4s ease-in-out infinite" }}>
        <div style={{ width: 90, height: 102, borderRadius: "48% 48% 44% 44%", background: "linear-gradient(160deg,#c8845a,#a86035)", position: "relative", animation: speaking ? "speakGlow 1.5s ease-in-out infinite" : "none", boxShadow: "0 8px 32px rgba(0,0,0,0.6)", transition: "all 0.4s" }}>
          <div style={{ position: "absolute", top: -10, left: -5, right: -5, height: 46, borderRadius: "50% 50% 0 0", background: "linear-gradient(160deg,#150800,#2a1008)" }} />
          <div style={{ position: "absolute", top: -8, left: -11, width: 22, height: 40, borderRadius: "50% 0 0 50%", background: "#150800" }} />
          <div style={{ position: "absolute", top: -8, right: -11, width: 22, height: 40, borderRadius: "0 50% 50% 0", background: "#150800" }} />
          {[0, 1].map(i => <div key={i} style={{ position: "absolute", top: 22, left: i === 0 ? 12 : 47, width: 17, height: 2.5, borderRadius: 999, background: "#0f0800", transform: i === 0 ? "rotate(-10deg)" : "rotate(10deg)" }} />)}
          <div style={{ position: "absolute", top: 31, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 20 }}>
            {[0, 1].map(i => (
              <div key={i} style={{ width: 13, height: 13, borderRadius: "50%", background: "#0f0800", display: "flex", alignItems: "center", justifyContent: "center", animation: "eyeBlink 4s ease-in-out infinite", animationDelay: `${i * 0.12}s`, overflow: "hidden", position: "relative" }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#2d1860" }} />
                <div style={{ position: "absolute", width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.9)", top: "15%", left: "20%" }} />
              </div>
            ))}
          </div>
          <div style={{ position: "absolute", top: 50, left: "50%", transform: "translateX(-50%)", width: 8, height: 7, borderRadius: "0 0 5px 5px", background: "rgba(0,0,0,0.18)" }} />
          <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)", width: 34, overflow: "hidden", display: "flex", justifyContent: "center", gap: 2, alignItems: "flex-end", height: speaking ? "auto" : 8 }}>
            {speaking ? Array.from({ length: 6 }).map((_, i) => <div key={i} style={{ width: 4, background: "#6b2810", borderRadius: 999, minHeight: 3, maxHeight: 15, animation: `mouthTalk ${0.22 + i * 0.04}s ease-in-out infinite alternate`, animationDelay: `${i * 0.04}s` }} />) : <div style={{ width: 34, height: 8, borderRadius: "0 0 8px 8px", background: "rgba(90,40,20,0.7)" }} />}
          </div>
          <div style={{ position: "absolute", bottom: -20, left: 8, right: 8, height: 26, background: "linear-gradient(180deg,#1a3a6e,#2458a8)", borderRadius: "0 0 6px 6px" }} />
          <div style={{ position: "absolute", bottom: -14, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderTop: "11px solid #1a3a6e" }} />
        </div>
      </div>
      <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)", padding: "5px 14px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.1)", display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: speaking ? "#6366f1" : listening ? "#00ff88" : "rgba(255,255,255,0.2)", boxShadow: speaking ? "0 0 8px #6366f1" : listening ? "0 0 8px #00ff88" : "none", transition: "all 0.3s" }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: "white" }}>Alex</span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>Staff Engineer · Google</span>
      </div>
      {(speaking || listening) && (
        <div style={{ position: "absolute", bottom: 42, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 2.5, alignItems: "flex-end" }}>
          {Array.from({ length: 9 }).map((_, i) => <div key={i} style={{ width: 2.5, background: speaking ? "#6366f1" : "#00ff88", borderRadius: 999, minHeight: 3, maxHeight: 18, animation: `mouthTalk ${0.28 + i * 0.05}s ease-in-out infinite alternate`, animationDelay: `${i * 0.055}s` }} />)}
        </div>
      )}
    </div>
  );
}

// ─── VERDICT MODAL ───
function VerdictModal({ verdict, onClose }: { verdict: FinalVerdict; onClose: () => void }) {
  const isHire = verdict.decision === "HIRE" || verdict.decision === "STRONG_HIRE";
  const dc = isHire ? "#00ff88" : verdict.decision === "NO_HIRE" ? "#ff4466" : "#fbbf24";
  const dIcon = verdict.decision === "STRONG_HIRE" ? "🏆" : isHire ? "✅" : verdict.decision === "STRONG_NO_HIRE" ? "❌" : "⚠️";
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", backdropFilter: "blur(20px)", zIndex: 1000, overflowY: "auto", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "2rem" }}>
      <div style={{ maxWidth: 760, width: "100%" }}>
        <div style={{ textAlign: "center", padding: "3rem 2rem 2rem", background: `linear-gradient(135deg,${dc}10,rgba(0,0,0,0.5))`, border: `1px solid ${dc}30`, borderRadius: "24px 24px 0 0" }}>
          <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>{dIcon}</div>
          <div style={{ fontSize: "3.5rem", fontWeight: 900, color: dc, letterSpacing: -2, textShadow: `0 0 60px ${dc}`, lineHeight: 1, marginBottom: "1rem" }}>{verdict.decision.replace("_", " ")}</div>
          <div style={{ fontSize: "1.1rem", color: "rgba(255,255,255,0.8)", maxWidth: 500, margin: "0 auto 1rem", lineHeight: 1.5 }}>"{verdict.headline}"</div>
          <span style={{ fontSize: 12, padding: "4px 14px", background: `${dc}15`, border: `1px solid ${dc}30`, borderRadius: 999, color: dc }}>Confidence: {verdict.confidence}%</span>
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderTop: "none", padding: "1.5rem 2rem" }}>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.7, margin: 0 }}>{verdict.overview}</p>
        </div>
        {verdict.scorecard && Object.keys(verdict.scorecard).length > 0 && (
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderTop: "none", padding: "1.5rem 2rem" }}>
            <div style={{ fontSize: 10, letterSpacing: 3, color: "rgba(255,255,255,0.3)", fontWeight: 600, marginBottom: "1rem" }}>SCORECARD</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
              {Object.entries(verdict.scorecard).map(([k, v]) => (
                <div key={k} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: "10px 12px", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: "capitalize" }}>{k}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: v.score >= 70 ? "#00ff88" : v.score >= 50 ? "#fbbf24" : "#ff4466" }}>{v.score}</span>
                  </div>
                  <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 999, marginBottom: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${v.score}%`, background: v.score >= 70 ? "#00ff88" : v.score >= 50 ? "#fbbf24" : "#ff4466", borderRadius: 999 }} />
                  </div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>{v.comment}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "none" }}>
          <div style={{ background: "rgba(0,255,136,0.04)", border: "1px solid rgba(0,255,136,0.12)", padding: "1.25rem 1.5rem" }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: "#00ff88", fontWeight: 600, marginBottom: "0.75rem" }}>✓ HIRE SIGNALS</div>
            {verdict.hire_reasons?.map((r, i) => <div key={i} style={{ display: "flex", gap: 7, marginBottom: 6 }}><span style={{ color: "#00ff88", fontSize: 11, flexShrink: 0 }}>•</span><span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{r}</span></div>)}
          </div>
          <div style={{ background: "rgba(255,68,102,0.04)", border: "1px solid rgba(255,68,102,0.12)", padding: "1.25rem 1.5rem" }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: "#ff4466", fontWeight: 600, marginBottom: "0.75rem" }}>✗ CONCERNS</div>
            {verdict.no_hire_reasons?.map((r, i) => <div key={i} style={{ display: "flex", gap: 7, marginBottom: 6 }}><span style={{ color: "#ff4466", fontSize: 11, flexShrink: 0 }}>•</span><span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", lineHeight: 1.5 }}>{r}</span></div>)}
          </div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", borderTop: "none", padding: "1.5rem 2rem", borderRadius: "0 0 24px 24px", marginBottom: "1.5rem" }}>
          <div style={{ marginBottom: "1rem" }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: "rgba(99,102,241,0.8)", fontWeight: 600, marginBottom: 6 }}>NEXT STEPS</div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.6, margin: 0 }}>{verdict.next_steps}</p>
          </div>
          <div style={{ padding: "1rem", background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 12 }}>
            <div style={{ fontSize: 9, letterSpacing: 2, color: "rgba(99,102,241,0.8)", fontWeight: 600, marginBottom: 5 }}>INTERVIEWER'S NOTE</div>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", fontStyle: "italic", lineHeight: 1.6, margin: 0 }}>"{verdict.interviewer_note}"</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
          <button onClick={onClose} style={{ padding: "0.75rem 1.5rem", borderRadius: 12, background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.15)", color: "white", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Review Transcript</button>
          <a href="/" style={{ textDecoration: "none" }}><button style={{ padding: "0.75rem 1.5rem", borderRadius: 12, border: "none", background: "linear-gradient(135deg,#6366f1,#a855f7)", color: "white", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>Home →</button></a>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════
// MAIN PAGE
// ════════════════════════════════════════════════════
export default function SecureInterviewPage() {
  // Phase management
  const [phase, setPhase] = useState<"setup" | "identity" | "precheck" | "live" | "report">("setup");

  // Setup
  const [jd, setJd] = useState("");
  const [resume, setResume] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [linkedinText, setLinkedinText] = useState("");
  const [githubData, setGithubData] = useState<any>(null);
  const [linkedinAnalysis, setLinkedinAnalysis] = useState<any>(null);
  const githubRef = useRef<any>(null);
  const linkedinRef = useRef<any>(null);
  const [mode, setMode] = useState<"text" | "voice">("text");
  const [voiceOk] = useState(() => typeof window !== "undefined" && ("SpeechRecognition" in window || "webkitSpeechRecognition" in window));

  // Interview
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [qNum, setQNum] = useState(0);
  const [stage, setStage] = useState("intro");
  const [ended, setEnded] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [score, setScore] = useState<ScoreData>(ZERO_SCORE);
  const [scoring, setScoring] = useState(false);
  const [finalVerdict, setFinalVerdict] = useState<FinalVerdict | null>(null);
  const [showVerdict, setShowVerdict] = useState(false);
  const [buildingVerdict, setBuildingVerdict] = useState(false);

  // Camera
  const [camError, setCamError] = useState("");
  const [streamReady, setStreamReady] = useState(false);
  const [identityPhoto, setIdentityPhoto] = useState<string | null>(null);
  const [capturing, setCapturing] = useState(false);

  // Face verification — runs fully client-side via face-api.js.
  // This replaces the old server round-trip to /api/face-check, which is what was
  // "failing silently": no network call means no silent failure.
  //
  // NOTE: only TinyFaceDetector is loaded/used here (SsdMobilenetv1 was removed).
  // The public/models folder only ships TinyFaceDetector's weight files, and
  // Promise.all([...]) loading both models meant the SSD load 404'd, the whole
  // Promise.all rejected, modelsReady never flipped to true, and the identity
  // page got stuck forever on "Loading face verification...". TinyFaceDetector
  // alone is sufficient for presence/liveness-style checks like this.
  const faceapiRef = useRef<any>(null);
  const visionPipelineRef = useRef<VisionPipeline | null>(null);
  const temporalTrackerRef = useRef<TemporalTracker | null>(null);
  const [modelsReady, setModelsReady] = useState(false);
  const [phoneStatus, setPhoneStatus] = useState<"clear" | "detected">("clear");
  const [personCount, setPersonCount] = useState(0);
  const [lastPhoneConf, setLastPhoneConf] = useState(0);
  const phoneFramesRef = useRef(0);

  // Precheck
  const [checksDone, setChecksDone] = useState({ camera: false, mic: false, security: false, network: false });
  const [checkStep, setCheckStep] = useState(-1);

  // Proctoring
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
  const [report, setReport] = useState<TrustReport | null>(null);
  const [buildingReport, setBuildingReport] = useState(false);
  const [pasteDetected, setPasteDetected] = useState(false);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const identityVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const recRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const msgsRef = useRef<Msg[]>([]);
  const qNumRef = useRef(0);
  const jdRef = useRef(jd);
  const resumeRef = useRef(resume);
  const modeRef = useRef(mode);
  const endedRef = useRef(false);
  const sessionStartRef = useRef(Date.now());
  const lastQuestionRef = useRef("");
  const inputTypingStartRef = useRef<number | null>(null);
  const faceIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Mutable refs for proctoring (avoid stale closures)
  const tabSwitchesRef = useRef(0);
  const windowBlursRef = useRef(0);
  const pasteCountRef = useRef(0);
  const totalFramesRef = useRef(0);
  const faceOkFramesRef = useRef(0);
  const multipleFaceFramesRef = useRef(0);
  const aiWarningsRef = useRef(0);
  const violationsRef = useRef<Violation[]>([]);
  const aiChecksRef = useRef<AICheck[]>([]);

  useEffect(() => { jdRef.current = jd; }, [jd]);
  useEffect(() => { resumeRef.current = resume; }, [resume]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs]);

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      synthRef.current = window.speechSynthesis;
      window.speechSynthesis.getVoices();
    }
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);
    };
  }, []);

  // ── LOAD DUAL VISION PIPELINE (MediaPipe ObjectDetector + BlazeFace + face-api fallback) ──
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
        console.error("[PROCTORING] Vision pipeline init failed:", e);
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

  // ── REAL FACE COUNT — validates human face presence with dual vision models ──
  const detectFaceCount = useCallback(async (
    mediaEl: HTMLVideoElement,
    mode: "lenient" | "strict" = "lenient"
  ): Promise<number> => {
    if (!modelsReady || !mediaEl || mediaEl.readyState < 2 || mediaEl.videoWidth === 0) return -1;
    try {
      const pipeline = visionPipelineRef.current;
      if (pipeline && pipeline.isReady()) {
        const det = pipeline.detectFrame(mediaEl);
        if (mode === "strict") {
          return det.faceCount;
        }
        return Math.max(det.faceCount, det.personCount);
      }
      return -1;
    } catch (e) {
      console.error("Face detection error:", e);
      return -1;
    }
  }, [modelsReady]);

  // ── LIVE TRUST CALC ──
  useEffect(() => {
    const faceScore = totalFrames > 0 ? (faceOkFrames / totalFrames) * 40 : 40;
    const focusScore = Math.max(0, 32 - tabSwitches * 7 - windowBlurCount * 2);
    const behaviorScore = Math.max(0, 28 - aiWarnings * 8 - pasteCount * 10 - (multipleFaceFrames > 1 ? 12 : 0) - (phoneFramesRef.current > 0 ? 15 : 0));
    setLiveTrust(Math.round(faceScore + focusScore + behaviorScore));
  }, [totalFrames, faceOkFrames, multipleFaceFrames, tabSwitches, windowBlurCount, aiWarnings, pasteCount]);

  const addViolation = useCallback((type: string, severity: Violation["severity"]) => {
    const v: Violation = { time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }), type, severity };
    violationsRef.current = [...violationsRef.current, v];
    setViolations([...violationsRef.current]);
  }, []);

  // ── TAB/WINDOW PROCTORING ──
  useEffect(() => {
    if (phase !== "live") return;
    const onVisibility = () => {
      if (document.hidden) {
        tabSwitchesRef.current++;
        setTabSwitches(tabSwitchesRef.current);
        addViolation("Tab switched away", "high");
      }
    };
    const onBlur = () => {
      windowBlursRef.current++;
      setWindowBlurCount(windowBlursRef.current);
      addViolation("Window focus lost", "medium");
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("blur", onBlur);
    document.addEventListener("contextmenu", e => e.preventDefault());
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
    };
  }, [phase]);

  // ── REAL-TIME LIVE-FRAME VISION PROCTORING LOOP (320ms tick) ──
  useEffect(() => {
    if (phase !== "live") return;
    let loopFrameCount = 0;
    console.log("[PROCTORING] Starting live vision proctoring loop (phase=live).");
    faceIntervalRef.current = setInterval(() => {
      const vid = videoRef.current;
      if (!vid || vid.readyState < 2 || vid.videoWidth === 0 || vid.paused || vid.ended) {
        if (loopFrameCount === 0) {
          console.log(`[PROCTORING] Loop tick skipped: vid=${!!vid}, readyState=${vid?.readyState}, videoWidth=${vid?.videoWidth}, paused=${vid?.paused}`);
        }
        return;
      }
      totalFramesRef.current++;
      setTotalFrames(totalFramesRef.current);

      const pipeline = visionPipelineRef.current;
      const tracker = temporalTrackerRef.current;
      if (!pipeline || !tracker || !pipeline.isReady()) {
        if (loopFrameCount === 0) {
          console.log(`[PROCTORING] Pipeline not ready: pipeline=${!!pipeline}, tracker=${!!tracker}, status=${pipeline?.getStatus()}`);
        }
        return;
      }
      loopFrameCount++;
      if (loopFrameCount === 1) {
        console.log(`[PROCTORING] ✅ First detection frame running! Pipeline status: ${pipeline.getStatus()}`);
      }

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
          multipleFaceFramesRef.current++;
          setMultipleFaceFrames(multipleFaceFramesRef.current);
          addViolation(`Multiple individuals detected in camera frame (${effectivePeople} people present)`, "critical");
        } else if (evt.eventType === "PERSON_LEFT_FRAME") {
          addViolation("Candidate left camera frame (0 persons detected)", "high");
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
        faceOkFramesRef.current++;
        setFaceOkFrames(faceOkFramesRef.current);
      }
    }, 320);

    return () => {
      if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);
    };
  }, [phase, addViolation]);

  // ══ CAMERA INIT — WITH VIDEO-ONLY FALLBACK ══
  const initCamera = async (): Promise<boolean> => {
    setCamError("");
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;

    let stream: MediaStream | null = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      });
    } catch (e1) {
      console.warn("HD Video+Audio failed, retrying video-only:", e1);
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false
        });
      } catch (e2) {
        console.warn("User-facing video failed, retrying basic video:", e2);
        try {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        } catch (e3: any) {
          const msg = e3.name === "NotAllowedError"
            ? "Camera access denied. Please allow camera in browser settings and try again."
            : e3.name === "NotFoundError"
              ? "No camera found. Please connect a camera and try again."
              : `Camera error: ${e3.message}`;
          setCamError(msg);
          return false;
        }
      }
    }

    if (stream) {
      streamRef.current = stream;
      setStreamReady(true);
      return true;
    }
    return false;
  };

  // ══ ATTACH STREAM TO VIDEO — separate from init ══
  const attachStreamToVideo = useCallback((videoEl: HTMLVideoElement | null) => {
    if (!videoEl || !streamRef.current) return;
    if (videoEl.srcObject !== streamRef.current) {
      videoEl.srcObject = streamRef.current;
    }
    videoEl.muted = true;
    videoEl.autoplay = true;
    videoEl.playsInline = true;
    const tryPlay = () => {
      videoEl.play().catch(() => {
        setTimeout(tryPlay, 200);
      });
    };
    if (videoEl.readyState >= 2) {
      tryPlay();
    } else {
      videoEl.onloadedmetadata = tryPlay;
    }
  }, []);

  // Attach stream when phase changes to identity
  useEffect(() => {
    if (phase === "identity" && streamReady) {
      const tryAttach = () => {
        if (identityVideoRef.current) {
          attachStreamToVideo(identityVideoRef.current);
        } else {
          setTimeout(tryAttach, 100);
        }
      };
      setTimeout(tryAttach, 100);
    }
    if (phase === "live" && streamReady) {
      const tryAttach = () => {
        if (videoRef.current) {
          attachStreamToVideo(videoRef.current);
        } else {
          setTimeout(tryAttach, 100);
        }
      };
      setTimeout(tryAttach, 200);
    }
  }, [phase, streamReady, attachStreamToVideo]);

  // ══ IDENTITY CAPTURE — FIXED: now actually validates a real face before accepting ══
  const captureIdentity = useCallback(async () => {
    setCapturing(true);
    setCamError("");
    const vid = identityVideoRef.current;

    // Wait until video is actually playing
    const waitForVideo = (): Promise<HTMLVideoElement> => new Promise((resolve, reject) => {
      if (!vid) return reject("No video element");
      if (vid.videoWidth > 0 && vid.readyState >= 2) return resolve(vid);
      let attempts = 0;
      const check = setInterval(() => {
        attempts++;
        if (vid.videoWidth > 0 && vid.readyState >= 2) {
          clearInterval(check);
          resolve(vid);
        } else if (attempts > 30) {
          clearInterval(check);
          reject("Video not ready after 3s");
        }
      }, 100);
    });

    try {
      const v = await waitForVideo();

      // ── Real validation: does the frame actually contain a human face? ──
      const faceCount = await detectFaceCount(v,"strict");
      if (faceCount === -1) {
        setCamError("Face verification is still loading. Wait a second and try again.");
        setCapturing(false);
        return;
      }
      if (faceCount === 0) {
        setCamError("No face detected. Move into the oval and make sure your face is well-lit, then try again.");
        setCapturing(false);
        return;
      }
      if (faceCount > 1) {
        setCamError("Multiple faces detected. Make sure you're alone in frame before capturing.");
        setCapturing(false);
        return;
      }

      const canvas = document.createElement("canvas");
      canvas.width = v.videoWidth;
      canvas.height = v.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas context failed");
      // Mirror the canvas to match video display
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(v, 0, 0);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      if (dataUrl === "data:,") throw new Error("Canvas capture returned empty");
      setIdentityPhoto(dataUrl);
    } catch (e: any) {
      setCamError(`Photo capture failed: ${e.message || e}. Please ensure camera is active.`);
    }
    setCapturing(false);
  }, [detectFaceCount]);

  // ══ PRECHECK ══
  const runPrechecks = async () => {
    setCheckStep(0);
    const steps = ["camera", "mic", "security", "network"] as const;
    for (let i = 0; i < steps.length; i++) {
      setCheckStep(i);
      await new Promise(r => setTimeout(r, 200));
      setChecksDone(p => ({ ...p, [steps[i]]: true }));
    }
    await startLiveInterview();
  };

  // ══ START LIVE INTERVIEW ══
  const startLiveInterview = async () => {
    sessionStartRef.current = Date.now();
    setPhase("live");
    setLoading(true);
    try {
      const res = await fetch("/api/interview-chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [],
          jd: jdRef.current,
          resume: resumeRef.current,
          qNumber: 0,
          githubData: githubRef.current,
          linkedinAnalysis: linkedinRef.current
        })
      });
      const d = await res.json();
      lastQuestionRef.current = d.message;
      const m: Msg = { role: "assistant", content: d.message, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      msgsRef.current = [m];
      setMsgs([m]);
      if (modeRef.current === "voice") setTimeout(() => speakText(d.message), 600);
    } catch {}
    setLoading(false);
  };

  // ══ END INTERVIEW ══
  const endInterview = async () => {
    if (faceIntervalRef.current) clearInterval(faceIntervalRef.current);
    endedRef.current = true;
    synthRef.current?.cancel();
    try { recRef.current?.stop(); } catch {}
    setEnded(true);
    setBuildingVerdict(true);
    // Final verdict
    try {
      const res = await fetch("/api/interview-final", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: msgsRef.current.map(m => ({ role: m.role, content: m.content })), jd: jdRef.current, resume: resumeRef.current, finalScore: score })
      });
      if (res.ok) { const d = await res.json(); setFinalVerdict(d); setShowVerdict(true); }
    } catch {}
    setBuildingVerdict(false);
    // Trust report
    setBuildingReport(true);
    const dur = Math.round((Date.now() - sessionStartRef.current) / 1000);
    try {
      const res = await fetch("/api/trust-score", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalFrames: totalFramesRef.current, faceDetectedFrames: faceOkFramesRef.current,
          multipleFaceFrames: multipleFaceFramesRef.current, tabSwitches: tabSwitchesRef.current,
          windowBlurs: windowBlursRef.current, totalDuration: dur,
          violations: violationsRef.current.map(v => v.type), questionCount: qNumRef.current,
          avgResponseTime: dur / Math.max(1, qNumRef.current),
          behaviorNotes: `AI warnings: ${aiWarningsRef.current}, Pastes: ${pasteCountRef.current}`
        })
      });
      if (res.ok) setReport(await res.json());
    } catch {}
    setBuildingReport(false);
    setPhase("report");
  };

  // ══ AI TEXT CHECK ══
  const analyzeForAI = async (text: string) => {
    const dur = inputTypingStartRef.current ? (Date.now() - inputTypingStartRef.current) / 1000 : null;
    const words = text.split(/\s+/).filter(Boolean).length;
    const wpm = dur && words ? Math.round((words / dur) * 60) : 0;
    if (wpm > 160 || pasteDetected) addViolation(`Possible AI text — ${wpm > 160 ? `${wpm} WPM` : "paste detected"}`, "high");
    if (words > 25) {
      try {
        const res = await fetch("/api/ai-text-detect", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, question: lastQuestionRef.current, timeToType: dur, wordCount: words, pasteDetected, typingSpeed: wpm })
        });
        const d: AICheck = await res.json();
        aiChecksRef.current = [...aiChecksRef.current, d];
        setAiChecks([...aiChecksRef.current]);
        if (d.isAI || d.risk_level === "HIGH" || d.risk_level === "CRITICAL") {
          aiWarningsRef.current++;
          setAiWarnings(aiWarningsRef.current);
          addViolation(`AI text detected (${d.ai_score}% score)`, d.risk_level === "CRITICAL" ? "critical" : "high");
        }
      } catch {}
    }
    setPasteDetected(false);
    inputTypingStartRef.current = null;
  };

  // ══ SEND ══
  const send = async (text?: string) => {
    const content = (text || input).trim();
    if (!content || loading || ended) return;
    await analyzeForAI(content);
    setInput("");
    const newQ = qNumRef.current + 1;
    qNumRef.current = newQ;
    setQNum(newQ);
    const newStage = newQ <= 1 ? "intro" : newQ <= 4 ? "behavioral" : newQ <= 8 ? "technical" : newQ <= 10 ? "system-design" : "culture";
    setStage(newStage);
    const userMsg: Msg = { role: "user", content, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    const updated = [...msgsRef.current, userMsg];
    msgsRef.current = updated;
    setMsgs([...updated]);
    // Score
    setScoring(true);
    fetch("/api/interview-score", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: updated.map(m => ({ role: m.role, content: m.content })), jd: jdRef.current, resume: resumeRef.current })
    }).then(r => r.ok ? r.json() : null).then(d => { if (d) setScore({ ...d }); }).catch(() => {}).finally(() => setScoring(false));
    setLoading(true);
    try {
      const res = await fetch("/api/interview-chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updated.map(m => ({ role: m.role, content: m.content })),
          jd: jdRef.current,
          resume: resumeRef.current,
          qNumber: newQ,
          githubData: githubRef.current,
          linkedinAnalysis: linkedinRef.current
        })
      });
      const d = await res.json();
      lastQuestionRef.current = d.message;
      const aiMsg: Msg = { role: "assistant", content: d.message, time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
      const final = [...updated, aiMsg];
      msgsRef.current = final;
      setMsgs([...final]);
      if (modeRef.current === "voice") speakText(d.message);
    } catch {}
    setLoading(false);
  };

  // ══ VOICE ══
  const speakText = (text: string) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[*#`]/g, "").trim());
    u.rate = 0.87; u.pitch = 1.0;
    const voices = synthRef.current.getVoices();
    const v = ["Google UK English Male", "Daniel", "Alex", "Arthur"].map(n => voices.find(v => v.name === n)).find(Boolean) || voices.find(v => v.lang.startsWith("en"));
    if (v) u.voice = v;
    u.onstart = () => setSpeaking(true);
    u.onend = () => { setSpeaking(false); if (modeRef.current === "voice" && !endedRef.current) setTimeout(startListening, 600); };
    u.onerror = () => setSpeaking(false);
    synthRef.current.speak(u);
  };

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

  // ══ DOWNLOAD REPORT ══
  const downloadReport = () => {
    if (!report) return;
    const vc = report.verdict === "VERIFIED" ? "#059669" : report.verdict === "CAUTION" ? "#d97706" : "#dc2626";
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>COGNALYZE Trust Report</title>
    <style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:system-ui,sans-serif;max-width:700px;margin:40px auto;padding:0 24px;font-size:14px;line-height:1.6;color:#111;}
    h1{font-size:28px;font-weight:900;letter-spacing:-1px;}.score-big{font-size:64px;font-weight:900;color:${vc};line-height:1;}
    .verdict{font-size:32px;font-weight:900;color:${vc};}
    .section{margin:20px 0;padding:16px 18px;border:1px solid #e5e7eb;border-radius:10px;}
    .section h3{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#888;margin-bottom:10px;}
    .bar{height:5px;background:#f0f0f0;border-radius:999px;margin-top:3px;}.bar-fill{height:100%;border-radius:999px;background:${vc};}
    .flag{padding:5px 10px;background:#fef2f2;border:1px solid #fca5a5;border-radius:6px;margin:3px 0;font-size:12px;color:#991b1b;}
    .ai-warn{padding:5px 10px;background:#fff7ed;border:1px solid #fdba74;border-radius:6px;margin:3px 0;font-size:12px;color:#9a3412;}
    @media print{body{margin:20px;}}</style></head><body>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:28px;padding-bottom:16px;border-bottom:2px solid #111">
      <div style="width:36px;height:36px;background:#111;border-radius:8px;display:flex;align-items:center;justify-content:center;color:white;font-size:18px;">⚡</div>
      <div><div style="font-size:10px;letter-spacing:3px;color:#888;font-weight:700">COGNALYZE SECURE INTERVIEW</div><h1>Integrity Report</h1></div>
    </div>
    ${identityPhoto ? `<div style="margin-bottom:20px"><img src="${identityPhoto}" style="width:80px;height:80px;object-fit:cover;border-radius:50%;border:2px solid ${vc};" /><div style="font-size:11px;color:#888;margin-top:4px">Identity verified at session start</div></div>` : ""}
    <div style="text-align:center;padding:28px;background:${vc}08;border:1px solid ${vc}20;border-radius:12px;margin-bottom:20px">
      <div class="score-big">${report.trust_score}</div>
      <div style="font-size:12px;color:#888;margin:3px 0">/100 Trust Score</div>
      <div class="verdict">${report.verdict}</div>
      <div style="font-size:13px;color:#555;margin-top:4px">${report.verdict_reason}</div>
    </div>
    <div class="section"><h3>Score Breakdown</h3>
      ${Object.values(report.breakdown).map(b => `<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between"><strong>${b.label}</strong><strong style="color:${b.score >= 70 ? "#059669" : b.score >= 50 ? "#d97706" : "#dc2626"}">${b.score}/100</strong></div><div style="font-size:11px;color:#888">${b.note}</div><div class="bar"><div class="bar-fill" style="width:${b.score}%"></div></div></div>`).join("")}
    </div>
    ${report.flags.length > 0 ? `<div class="section"><h3>Violations (${report.flags.length})</h3>${report.flags.map(f => `<div class="flag">⚠ ${f}</div>`).join("")}</div>` : ""}
    ${aiChecksRef.current.filter(c => c.isAI).length > 0 ? `<div class="section"><h3>AI Text Warnings</h3>${aiChecksRef.current.filter(c => c.isAI).map(c => `<div class="ai-warn">🤖 ${c.verdict} — Score: ${c.ai_score}%</div>`).join("")}</div>` : ""}
    <div class="section"><h3>Behavioral Analysis</h3><p>${report.ai_observation}</p></div>
    <div class="section" style="background:#f0fdf4;border-color:#86efac"><h3 style="color:#166534">Recruiter Recommendation</h3><p>${report.recruiter_recommendation}</p></div>
    <div style="margin-top:24px;font-size:11px;color:#aaa;display:flex;justify-content:space-between"><span>COGNALYZE™</span><span>${new Date().toLocaleString()}</span></div>
    </body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 500);
  };

  // Colors
  const tc = liveTrust >= 80 ? "#00ff88" : liveTrust >= 60 ? "#fbbf24" : "#ff4466";
  const fc = phoneStatus === "detected" ? "#ff4466" : faceStatus === "ok" ? "#00ff88" : faceStatus === "missing" ? "#ff4466" : faceStatus === "multiple" ? "#fbbf24" : "rgba(255,255,255,0.25)";
  const sc = stage === "intro" ? "#a5b4fc" : stage === "behavioral" ? "#6366f1" : stage === "technical" ? "#00ff88" : stage === "system-design" ? "#fbbf24" : "#38bdf8";
  const sl = { intro: "Intro", behavioral: "Behavioral", technical: "Technical", "system-design": "System Design", culture: "Culture" }[stage] || stage;

  const BG = "#F6F5F1";
  const LIVE_BG = "#0D1929";

  // ════════ SETUP ════════
  if (phase === "setup") return (
    <div style={{ minHeight: "100vh", background: BG, color: "#17191C", fontFamily: "var(--font-inter, -apple-system, sans-serif)" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        textarea:focus,input:focus{outline:none;}
        ::-webkit-scrollbar{width:4px;}::-webkit-scrollbar-thumb{background:#E4E1DA;border-radius:2px;}
      `}</style>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 2rem", background: "#FFFFFF", borderBottom: "1px solid #E4E1DA" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "#162A43", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#FFFFFF" }}>🛡️</div>
          <span style={{ fontWeight: 800, color: "#162A43", letterSpacing: "-0.01em" }}>COGNALYZE</span>
          <span style={{ fontSize: 10, padding: "2px 8px", background: "#EFF4FE", border: "1px solid #D2E0FB", borderRadius: 20, color: "#356AE6", fontWeight: 700, letterSpacing: 0.5 }}>SECURE PROCTORING</span>
        </div>
        <a href="/interview" style={{ color: "#667085", textDecoration: "none", fontSize: 13, fontWeight: 500 }}>← Standard Mode</a>
      </nav>
      <div style={{ maxWidth: 680, margin: "0 auto", padding: "3rem 2rem", animation: "fadeUp 0.6s ease" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", background: "#EFF4FE", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, margin: "0 auto 16px" }}>🛡️</div>
          <div style={{ fontSize: 11, letterSpacing: 2, color: "#356AE6", marginBottom: 8, fontWeight: 700, textTransform: "uppercase" }}>PROCTORED FAANG EVALUATION</div>
          <h1 style={{ fontSize: "clamp(2rem,4vw,2.5rem)", fontWeight: 800, letterSpacing: "-0.5px", lineHeight: 1.15, marginBottom: 10, color: "#162A43" }}>Cognalyze Secure Interview</h1>
          <p style={{ color: "#667085", fontSize: 14, lineHeight: 1.6, maxWidth: 520, margin: "0 auto" }}>FAANG-level questions · Live face monitoring · AI text detection · Evidence-backed Trust Certificate</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: "1.75rem" }}>
          {[["🪪", "Identity Verified", "Photo captured at start"], ["👁", "Face Monitoring", "Verified every 5 seconds"], ["🔄", "Tab Detection", "Logged with timestamps"], ["🤖", "AI Text Scan", "Statistical syntax check"], ["⌚", "Typing Analysis", "Paste + cadence tracked"], ["📊", "Trust Score™", "Defensible hiring report"]].map(([icon, label, desc]) => (
            <div key={label as string} style={{ padding: "12px 14px", background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, display: "flex", gap: 10 }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#162A43", marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 11, color: "#667085" }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
          {[{ id: "text", label: "⌨️ Text Mode" }, { id: "voice", label: "🎤 Voice Mode", disabled: !voiceOk }].map(m => (
            <div key={m.id} onClick={() => !m.disabled && setMode(m.id as any)} style={{ padding: "0.85rem", borderRadius: 10, border: mode === m.id ? "2px solid #356AE6" : "1px solid #E4E1DA", background: mode === m.id ? "#EFF4FE" : "#FFFFFF", cursor: m.disabled ? "not-allowed" : "pointer", textAlign: "center", fontSize: 13, fontWeight: mode === m.id ? 700 : 500, color: mode === m.id ? "#356AE6" : "#667085", opacity: m.disabled ? 0.4 : 1, transition: "all 0.2s" }}>
              {m.label}
            </div>
          ))}
        </div>
        <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 14, padding: "1.75rem", marginBottom: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, letterSpacing: 1.5, color: "#162A43", marginBottom: 6, fontWeight: 700 }}>JOB DESCRIPTION</div>
            <textarea value={jd} onChange={e => setJd(e.target.value)} rows={4} style={{ width: "100%", background: "#FAFAF8", border: "1px solid #E4E1DA", borderRadius: 8, padding: 12, color: "#17191C", fontSize: 13, resize: "none", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box" }} placeholder="Paste the job description..." />
          </div>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 1.5, color: "#162A43", marginBottom: 6, fontWeight: 700 }}>YOUR RESUME</div>
            <textarea value={resume} onChange={e => setResume(e.target.value)} rows={4} style={{ width: "100%", background: "#FAFAF8", border: "1px solid #E4E1DA", borderRadius: 8, padding: 12, color: "#17191C", fontSize: 13, resize: "none", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box" }} placeholder="Paste your resume..." />
          </div>

          {/* GitHub + LinkedIn */}
          <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: 1.5, color: "#162A43", marginBottom: 6, fontWeight: 700 }}>
                GITHUB USERNAME
              </div>
              <input
                value={githubUsername}
                onChange={e => setGithubUsername(e.target.value)}
                placeholder="e.g. dev-candidate"
                style={{ width: "100%", background: "#FAFAF8", border: "1px solid #E4E1DA", borderRadius: 8, padding: "10px 12px", color: "#17191C", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }}
              />
            </div>
            <div>
              <div style={{ fontSize: 11, letterSpacing: 1.5, color: "#162A43", marginBottom: 6, fontWeight: 700 }}>
                LINKEDIN URL
              </div>
              <input
                value={linkedinUrl}
                onChange={e => setLinkedinUrl(e.target.value)}
                placeholder="linkedin.com/in/profile"
                style={{ width: "100%", background: "#FAFAF8", border: "1px solid #E4E1DA", borderRadius: 8, padding: "10px 12px", color: "#17191C", fontSize: 13, fontFamily: "inherit", boxSizing: "border-box" }}
              />
            </div>
          </div>

          {/* LinkedIn About/Experience paste area */}
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 11, letterSpacing: 1.5, color: "#162A43", marginBottom: 6, fontWeight: 700 }}>
              LINKEDIN ABOUT + EXPERIENCE TEXT
              <span style={{ marginLeft: 6, fontSize: 10, color: "#667085", fontWeight: 400, letterSpacing: 0 }}>
                (Copy and paste from your profile)
              </span>
            </div>
            <textarea
              value={linkedinText}
              onChange={e => setLinkedinText(e.target.value)}
              rows={3}
              placeholder="Paste your LinkedIn summary and experience details here..."
              style={{ width: "100%", background: "#FAFAF8", border: "1px solid #E4E1DA", borderRadius: 8, padding: 12, color: "#17191C", fontSize: 13, resize: "none", fontFamily: "inherit", lineHeight: 1.6, boxSizing: "border-box" }}
            />
          </div>
        </div>
        <div style={{ padding: "10px 14px", background: "#EFF4FE", border: "1px solid #D2E0FB", borderRadius: 8, marginBottom: 16, fontSize: 12, color: "#162A43", lineHeight: 1.5 }}>
          🔒 Proceeding confirms candidate consent to automated face monitoring, tab logging, text analysis, and response timing for this proctored session.
        </div>
        <button onClick={async () => {
          const ok = await initCamera();
          if (!ok) return;

          const promises = [];

          if (githubUsername.trim()) {
            promises.push(
              fetch("/api/github-analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username: githubUsername.trim() })
              })
              .then(r => r.ok ? r.json() : null)
              .then(d => { if (d) { setGithubData(d); githubRef.current = d; } })
              .catch(() => {})
            );
          }

          if (linkedinText.trim()) {
            promises.push(
              fetch("/api/linkedin-analyze", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ linkedinText: linkedinText.trim(), jd, resume })
              })
              .then(r => r.ok ? r.json() : null)
              .then(d => { if (d) { setLinkedinAnalysis(d); linkedinRef.current = d; } })
              .catch(() => {})
            );
          }

          await Promise.all(promises);
          setPhase("identity");
        }} disabled={!jd || !resume} style={{ width: "100%", padding: "1rem", borderRadius: 10, border: "none", background: !jd || !resume ? "#E4E1DA" : "#356AE6", color: !jd || !resume ? "#98A2B3" : "#FFFFFF", fontSize: 14, fontWeight: 700, letterSpacing: 1, cursor: !jd || !resume ? "not-allowed" : "pointer", transition: "all 0.2s" }}>
          🛡️ BEGIN SECURE INTERVIEW →
        </button>
        {camError && <div style={{ marginTop: 10, padding: "10px 14px", background: "#FDF2F2", border: "1px solid #F8C8C8", borderRadius: 8, fontSize: 12, color: "#C24141", lineHeight: 1.5 }}>⚠ {camError}</div>}
      </div>
    </div>
  );

  // ════════ IDENTITY ════════
  if (phase === "identity") return (
    <div style={{ minHeight: "100vh", background: BG, color: "#17191C", fontFamily: "var(--font-inter, -apple-system, sans-serif)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}
        @keyframes ovalPulse{0%,100%{opacity:0.7;transform:scale(1)}50%{opacity:1;transform:scale(1.01)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
      `}</style>
      <div style={{ maxWidth: 540, width: "100%", textAlign: "center", animation: "fadeUp 0.5s ease" }}>
        <div style={{ fontSize: 11, letterSpacing: 2, color: "#356AE6", marginBottom: 8, fontWeight: 700 }}>STEP 1 OF 3 — IDENTITY VERIFICATION</div>
        <h2 style={{ fontSize: "1.85rem", fontWeight: 800, letterSpacing: -0.5, marginBottom: 8, color: "#162A43" }}>Look directly at the camera</h2>
        <p style={{ color: "#667085", fontSize: 13, marginBottom: "1.75rem" }}>Position your face inside the oval. Good lighting required. Click capture when ready.</p>

        <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: `2px solid ${identityPhoto ? "#2E7D5B" : streamReady ? "#356AE6" : "#E4E1DA"}`, boxShadow: "0 4px 20px rgba(0,0,0,0.06)", marginBottom: "1.5rem", background: "#FAFAF8", aspectRatio: "4/3", transition: "all 0.4s" }}>

          {/* Video element */}
          <video
            ref={identityVideoRef}
            autoPlay
            muted
            playsInline
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", display: identityPhoto ? "none" : "block" }}
          />

          {/* Captured photo */}
          {identityPhoto && <img src={identityPhoto} alt="Identity" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}

          {/* Face oval guide */}
          {!identityPhoto && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <div style={{ width: "45%", height: "70%", border: `2px solid ${streamReady ? "#356AE6" : "#E4E1DA"}`, borderRadius: "50%", animation: streamReady ? "ovalPulse 2s ease-in-out infinite" : "none" }} />
            </div>
          )}

          {/* Not ready overlay */}
          {!streamReady && !identityPhoto && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(246,245,241,0.9)" }}>
              <div style={{ width: 36, height: 36, border: "2px solid #E4E1DA", borderTop: "2px solid #356AE6", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: 12 }} />
              <div style={{ fontSize: 13, color: "#667085" }}>Starting camera...</div>
            </div>
          )}

          {/* Captured badge */}
          {identityPhoto && (
            <div style={{ position: "absolute", top: 14, right: 14, padding: "5px 14px", background: "#2E7D5B", borderRadius: 999, fontSize: 11, fontWeight: 700, color: "#FFFFFF" }}>✓ CAPTURED</div>
          )}

          {/* Live indicator */}
          {streamReady && !identityPhoto && (
            <div style={{ position: "absolute", top: 12, left: 12, display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", background: "#FFFFFF", borderRadius: 999, border: "1px solid #E4E1DA" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2E7D5B", animation: "blink 1s infinite" }} />
              <span style={{ fontSize: 10, color: "#162A43", fontWeight: 700, letterSpacing: 0.5 }}>LIVE</span>
            </div>
          )}
        </div>

        {camError && (
          <div style={{ marginBottom: 14, padding: "10px 14px", background: "#FDF2F2", border: "1px solid #F8C8C8", borderRadius: 8, fontSize: 12, color: "#C24141", lineHeight: 1.5, textAlign: "left" }}>
            ⚠ {camError}
            <button onClick={async () => { const ok = await initCamera(); }} style={{ display: "block", marginTop: 8, padding: "4px 12px", borderRadius: 6, border: "1px solid #F8C8C8", background: "#FFFFFF", color: "#C24141", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>↺ Retry Camera</button>
          </div>
        )}

        {!identityPhoto ? (
          <button onClick={captureIdentity} disabled={!streamReady || capturing || !modelsReady} style={{ width: "100%", padding: "0.95rem", borderRadius: 10, border: "none", background: !streamReady || capturing || !modelsReady ? "#E4E1DA" : "#356AE6", color: !streamReady || capturing || !modelsReady ? "#98A2B3" : "#FFFFFF", fontSize: 14, fontWeight: 700, cursor: !streamReady || capturing || !modelsReady ? "not-allowed" : "pointer", letterSpacing: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {capturing ? <><span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</span> Capturing...</> : !modelsReady ? "Loading face verification..." : "📸 CAPTURE PHOTO"}
          </button>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => setIdentityPhoto(null)} style={{ flex: 1, padding: "0.9rem", borderRadius: 10, border: "1px solid #E4E1DA", background: "#FFFFFF", color: "#162A43", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>↺ Retake</button>
            <button onClick={() => setPhase("precheck")} style={{ flex: 2, padding: "0.9rem", borderRadius: 10, border: "none", background: "#356AE6", color: "#FFFFFF", fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: 1 }}>
              CONFIRM & CONTINUE →
            </button>
          </div>
        )}

        <p style={{ marginTop: 14, fontSize: 11, color: "#667085", lineHeight: 1.5 }}>
          This photo is used strictly for identity verification during this proctored evaluation session.
        </p>
      </div>
    </div>
  );

  // ════════ PRECHECK ════════
  if (phase === "precheck") return (
    <div style={{ minHeight: "100vh", background: BG, color: "#17191C", fontFamily: "var(--font-inter, -apple-system, sans-serif)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
      <div style={{ maxWidth: 480, width: "100%", animation: "fadeUp 0.5s ease" }}>
        <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <div style={{ fontSize: 11, letterSpacing: 2, color: "#356AE6", marginBottom: 8, fontWeight: 700 }}>STEP 2 OF 3 — SYSTEM CHECK</div>
          <h2 style={{ fontSize: "1.85rem", fontWeight: 800, letterSpacing: -0.5, color: "#162A43" }}>Verifying setup</h2>
          <p style={{ color: "#667085", fontSize: 13, marginTop: 6 }}>All systems must pass before interview begins</p>
        </div>
        {[
          { key: "camera", icon: "📷", label: "Camera feed verified", sub: "Live video stream active" },
          { key: "mic", icon: "🎙", label: "Microphone active", sub: "Audio capture confirmed" },
          { key: "security", icon: "🔒", label: "Security environment", sub: "Proctoring engine armed" },
          { key: "network", icon: "🌐", label: "Connection stable", sub: "Low-latency path verified" },
        ].map((item, i) => {
          const done = checksDone[item.key as keyof typeof checksDone];
          const active = checkStep === i && !done;
          return (
            <div key={item.key} style={{ display: "flex", alignItems: "center", gap: 14, padding: "1rem 1.25rem", background: done ? "#EAF4EE" : active ? "#EFF4FE" : "#FFFFFF", border: `1px solid ${done ? "#C8E4D3" : active ? "#D2E0FB" : "#E4E1DA"}`, borderRadius: 12, marginBottom: 10, transition: "all 0.35s" }}>
              <span style={{ fontSize: 22, flexShrink: 0 }}>{item.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: done ? "#2E7D5B" : active ? "#356AE6" : "#162A43" }}>{item.label}</div>
                <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>{item.sub}</div>
              </div>
              {done ? <span style={{ fontSize: 18, color: "#2E7D5B", fontWeight: 700 }}>✓</span>
                : active ? <span style={{ animation: "spin 0.8s linear infinite", display: "inline-block", color: "#356AE6", fontSize: 18 }}>⟳</span>
                  : <span style={{ color: "#98A2B3", fontSize: 18 }}>○</span>}
            </div>
          );
        })}
        {checkStep === -1 && (
          <button onClick={runPrechecks} style={{ width: "100%", padding: "1rem", marginTop: 16, borderRadius: 10, border: "none", background: "#356AE6", color: "#FFFFFF", fontSize: 14, fontWeight: 700, cursor: "pointer", letterSpacing: 1 }}>
            ⚡ START SYSTEM CHECK →
          </button>
        )}
      </div>
    </div>
  );

  // ════════ LIVE INTERVIEW ════════
  if (phase === "live") return (
    <div style={{ height: "100vh", background: LIVE_BG, color: "white", fontFamily: "var(--font-inter, -apple-system, sans-serif)", display: "flex", flexDirection: "column", overflow: "hidden" }} onContextMenu={e => e.preventDefault()}>
      <style>{`
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes wave{0%,100%{height:3px}50%{height:16px}}
        @keyframes ripple{0%{transform:scale(1);opacity:0.5}100%{transform:scale(2.5);opacity:0}}
        @keyframes slideIn{from{opacity:0;transform:translateX(10px)}to{opacity:1;transform:translateX(0)}}
        textarea:focus,input:focus{outline:none;}
        ::-webkit-scrollbar{width:3px;}::-webkit-scrollbar-thumb{background:rgba(230,57,70,0.3);border-radius:2px;}
      `}</style>

      {showVerdict && finalVerdict && <VerdictModal verdict={finalVerdict} onClose={() => setShowVerdict(false)} />}

      {/* PROCTORING BAR */}
      <div style={{ flexShrink: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(230,57,70,0.12)", padding: "0.45rem 1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "2px 10px", background: "rgba(230,57,70,0.12)", border: "1px solid rgba(230,57,70,0.3)", borderRadius: 999 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#e63946", animation: "blink 1s infinite" }} />
            <span style={{ fontSize: 9, color: "rgba(230,57,70,0.9)", fontWeight: 700, letterSpacing: 1.5 }}>PROCTORING ACTIVE</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: fc, boxShadow: `0 0 5px ${fc}`, transition: "all 0.5s" }} />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>Candidate: <span style={{ color: fc, fontWeight: 600 }}>{faceStatus === "ok" ? "1 Present ✓" : faceStatus === "missing" ? "Missing! ✗" : faceStatus === "multiple" ? `Multiple (${personCount}) ⚠` : "Monitoring..."}</span></span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>Phone: <span style={{ color: phoneStatus === "detected" ? "#ff4466" : "#00ff88", fontWeight: 600 }}>{phoneStatus === "detected" ? `DETECTED! 📱 (${lastPhoneConf}%)` : "Clear ✓"}</span></span>
          </div>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>Tabs: <span style={{ color: tabSwitches > 0 ? "#ff4466" : "#00ff88", fontWeight: 600 }}>{tabSwitches}</span></span>
          {pasteCount > 0 && <span style={{ fontSize: 10, color: "#fbbf24" }}>📋 {pasteCount} paste{pasteCount > 1 ? "s" : ""}</span>}
          {aiWarnings > 0 && <span style={{ fontSize: 10, color: "#ff4466" }}>🤖 {aiWarnings} AI flag{aiWarnings > 1 ? "s" : ""}</span>}
          {violations.length > 0 && <span style={{ fontSize: 10, color: "#ff4466", fontWeight: 600 }}>⚠ {violations.length}</span>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <TrustRing score={liveTrust} size={34} />
          <button onClick={endInterview} disabled={ended || buildingVerdict || buildingReport} style={{ padding: "4px 14px", borderRadius: 8, border: "1px solid rgba(230,57,70,0.4)", background: "rgba(230,57,70,0.12)", color: "#ff6b6b", cursor: "pointer", fontSize: 11, fontWeight: 700, opacity: ended || buildingVerdict || buildingReport ? 0.5 : 1 }}>
            {buildingVerdict || buildingReport ? "⟳ Building..." : "End & Get Report"}
          </button>
        </div>
      </div>

      {/* TOP BAR */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0.5rem 1.25rem", borderBottom: "1px solid rgba(255,255,255,0.06)", flexShrink: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(20px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#00ff88", boxShadow: "0 0 6px #00ff88" }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>🛡️ Secure FAANG Interview</span>
          <div style={{ padding: "2px 9px", background: `${sc}12`, border: `1px solid ${sc}22`, borderRadius: 999 }}>
            <span style={{ fontSize: 10, color: sc, fontWeight: 600 }}>{sl}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {scoring && <span style={{ fontSize: 9, color: "rgba(99,102,241,0.7)", animation: "blink 0.8s infinite" }}>● scoring</span>}
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", padding: "2px 8px", background: "rgba(255,255,255,0.04)", borderRadius: 999 }}>Q{qNum}</span>
          {ended && finalVerdict && <button onClick={() => setShowVerdict(true)} style={{ padding: "4px 12px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#6366f1,#a855f7)", color: "white", cursor: "pointer", fontSize: 11, fontWeight: 700 }}>Verdict 🏆</button>}
        </div>
      </div>

      {/* MAIN 3-COL */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "210px 1fr 205px", overflow: "hidden" }}>

        {/* LEFT */}
        <div style={{ borderRight: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: 6, padding: 8, background: "rgba(0,0,0,0.2)" }}>
          {/* Alex */}
          <div style={{ flex: 2, borderRadius: 14, overflow: "hidden", border: `1px solid ${speaking ? "rgba(99,102,241,0.5)" : "rgba(255,255,255,0.07)"}`, transition: "all 0.3s", minHeight: 0, boxShadow: speaking ? "0 0 20px rgba(99,102,241,0.2)" : "none" }}>
            <AlexFace speaking={speaking} listening={listening} />
          </div>

          {/* User cam */}
          <div style={{ flex: 1, borderRadius: 14, overflow: "hidden", border: `2px solid ${fc}30`, background: "#07111F", position: "relative", minHeight: 110, transition: "border-color 0.5s" }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", display: "block" }} />

            {/* Face oval overlay */}
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none", zIndex: 2 }}>
              <div style={{ width: "55%", height: "75%", border: `1.5px solid ${fc}`, borderRadius: "50%", boxShadow: faceStatus !== "idle" ? `0 0 15px ${fc}30, inset 0 0 15px ${fc}08` : "none", transition: "all 0.5s" }} />
              {faceStatus !== "idle" && (
                <div style={{ position: "absolute", bottom: "6%", left: "50%", transform: "translateX(-50%)", padding: "2px 9px", background: `${fc}18`, border: `1px solid ${fc}40`, borderRadius: 999, whiteSpace: "nowrap" }}>
                  <span style={{ fontSize: 8, color: fc, fontWeight: 700, letterSpacing: 0.8 }}>
                    {phoneStatus === "detected" ? `⚠ PHONE DETECTED (${lastPhoneConf}%)` : faceStatus === "ok" ? "✓ DETECTED" : faceStatus === "missing" ? "✗ NOT VISIBLE" : `⚠ MULTIPLE (${personCount})`}
                  </span>
                </div>
              )}
            </div>

            <div style={{ position: "absolute", top: 5, right: 5, width: 7, height: 7, borderRadius: "50%", background: fc, boxShadow: `0 0 5px ${fc}`, zIndex: 3, transition: "all 0.5s" }} />
            <div style={{ position: "absolute", bottom: 4, left: 6, fontSize: 8, color: "rgba(255,255,255,0.5)", fontWeight: 600, zIndex: 2 }}>You</div>
          </div>

          {/* Identity thumbnail */}
          {identityPhoto && (
            <div style={{ padding: "6px 8px", background: "rgba(0,255,136,0.05)", border: "1px solid rgba(0,255,136,0.15)", borderRadius: 10, flexShrink: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <img src={identityPhoto} alt="ID" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", border: "1.5px solid rgba(0,255,136,0.4)", flexShrink: 0 }} />
              <div>
                <div style={{ fontSize: 9, color: "#00ff88", fontWeight: 600, letterSpacing: 0.5 }}>✓ IDENTITY VERIFIED</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>Captured at session start</div>
              </div>
            </div>
          )}

          {/* Trust */}
          <div style={{ padding: "8px 10px", background: `rgba(${liveTrust >= 80 ? "0,255,136" : liveTrust >= 60 ? "251,191,36" : "255,68,102"},0.06)`, border: `1px solid ${tc}22`, borderRadius: 10, flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 9, letterSpacing: 1.5, color: "rgba(255,255,255,0.3)", fontWeight: 600 }}>TRUST SCORE</span>
              <span style={{ fontSize: 9, color: tc, fontWeight: 700, letterSpacing: 1 }}>{liveTrust >= 80 ? "VERIFIED" : liveTrust >= 60 ? "CAUTION" : "FLAGGED"}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <TrustRing score={liveTrust} size={58} />
            </div>
            <div style={{ height: 2.5, background: "rgba(255,255,255,0.05)", borderRadius: 999, marginTop: 7, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${liveTrust}%`, background: `linear-gradient(90deg,${tc}50,${tc})`, borderRadius: 999, transition: "width 0.8s ease" }} />
            </div>
          </div>

          {/* Status */}
          <div style={{ padding: "6px 10px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10, flexShrink: 0 }}>
            <div style={{ color: speaking ? "#6366f1" : listening ? "#a855f7" : loading ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.25)", fontWeight: 500, fontSize: 11 }}>
              {speaking ? "🔊 Alex speaking..." : listening ? "🎤 Listening..." : loading ? "💭 Thinking..." : "✓ Ready"}
            </div>
            <div style={{ color: "rgba(255,255,255,0.15)", fontSize: 10, marginTop: 1 }}>{mode === "voice" ? "Voice" : "Text"} mode · Q{qNum}</div>
          </div>
        </div>

        {/* CENTER — Chat */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {mode === "voice" && (speaking || listening || transcript) && (
            <div style={{ padding: "7px 16px", background: speaking ? "rgba(99,102,241,0.07)" : "rgba(168,85,247,0.07)", borderBottom: "1px solid rgba(255,255,255,0.04)", flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ display: "flex", gap: 2, alignItems: "flex-end" }}>
                {Array.from({ length: 8 }).map((_, i) => <div key={i} style={{ width: 2.5, background: speaking ? "#6366f1" : "#a855f7", borderRadius: 999, minHeight: 3, maxHeight: 14, animation: `wave ${0.3 + i * 0.06}s ease-in-out infinite alternate`, animationDelay: `${i * 0.06}s` }} />)}
              </div>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                {speaking ? "Alex speaking..." : `Listening...${transcript ? ` "${transcript.slice(0, 40)}..."` : ""}`}
              </span>
            </div>
          )}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px" }}>
            {msgs.map((m, i) => (
              <div key={i} style={{ display: "flex", gap: 9, marginBottom: 13, flexDirection: m.role === "assistant" ? "row" : "row-reverse", animation: "fadeUp 0.3s ease" }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: m.role === "assistant" ? "linear-gradient(135deg,#e63946,#ff6b6b)" : "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>
                  {m.role === "assistant" ? "👔" : "🧑"}
                </div>
                <div style={{ maxWidth: "80%" }}>
                  <div style={{ padding: "9px 13px", borderRadius: m.role === "assistant" ? "4px 14px 14px 14px" : "14px 4px 14px 14px", background: m.role === "assistant" ? "rgba(255,255,255,0.07)" : "linear-gradient(135deg,#e63946,#ff6b6b)", border: m.role === "assistant" ? "1px solid rgba(255,255,255,0.08)" : "none", fontSize: 13.5, lineHeight: 1.7, color: "rgba(255,255,255,0.9)" }}>
                    {m.content}
                  </div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.18)", marginTop: 3, textAlign: m.role === "user" ? "right" : "left" }}>{m.time}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: "flex", gap: 9, marginBottom: 13 }}>
                <div style={{ width: 28, height: 28, borderRadius: "50%", background: "linear-gradient(135deg,#e63946,#ff6b6b)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}>👔</div>
                <div style={{ padding: "9px 13px", background: "rgba(255,255,255,0.07)", borderRadius: "4px 14px 14px 14px", display: "flex", gap: 4, alignItems: "center" }}>
                  {[0, 1, 2].map(i => <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: "rgba(230,57,70,0.8)", animation: `blink 1.2s infinite ${i * 0.25}s` }} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "10px 14px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(20px)", flexShrink: 0 }}>
            {ended ? (
              <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
                {buildingVerdict || buildingReport ? (
                  <span style={{ fontSize: 13, color: "#fbbf24" }}><span style={{ animation: "spin 1s linear infinite", display: "inline-block", marginRight: 6 }}>⟳</span>Generating report...</span>
                ) : (
                  <>
                    <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>Interview complete 🎉</span>
                    {finalVerdict && <button onClick={() => setShowVerdict(true)} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#6366f1,#a855f7)", color: "white", cursor: "pointer", fontSize: 12, fontWeight: 700 }}>Verdict 🏆</button>}
                    <a href="/"><button style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 12 }}>Home</button></a>
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
                    if ((e.ctrlKey || e.metaKey) && e.key === "v") {
                      setPasteDetected(true);
                      pasteCountRef.current++;
                      setPasteCount(pasteCountRef.current);
                      addViolation("Paste action detected", "high");
                    }
                  }}
                  onPaste={() => {
                    setPasteDetected(true);
                    pasteCountRef.current++;
                    setPasteCount(pasteCountRef.current);
                    addViolation("Text pasted — possible AI content", "high");
                  }}
                  placeholder="Type your answer... (Enter to send, Shift+Enter for new line)"
                  rows={2}
                  style={{ flex: 1, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "10px 13px", color: "white", fontSize: 13.5, resize: "none", fontFamily: "inherit", lineHeight: 1.5, boxSizing: "border-box" }}
                  onFocus={e => e.target.style.borderColor = "rgba(230,57,70,0.5)"}
                  onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
                  <button onClick={() => send()} disabled={!input.trim() || loading} style={{ width: 40, height: 40, borderRadius: 11, border: "none", background: !input.trim() || loading ? "rgba(230,57,70,0.15)" : "linear-gradient(135deg,#e63946,#ff6b6b)", cursor: !input.trim() || loading ? "not-allowed" : "pointer", color: "white", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {loading ? <span style={{ animation: "spin 1s linear infinite", display: "inline-block", fontSize: 12 }}>⟳</span> : "↑"}
                  </button>
                  {voiceOk && <button onClick={() => setMode("voice")} style={{ width: 40, height: 40, borderRadius: 11, border: "1px solid rgba(230,57,70,0.3)", background: "rgba(230,57,70,0.08)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>🎤</button>}
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ position: "relative" }}>
                    {listening && <div style={{ position: "absolute", inset: -8, borderRadius: "50%", border: "2px solid rgba(230,57,70,0.4)", animation: "ripple 1.5s ease-out infinite" }} />}
                    <button onClick={listening ? stopListening : () => { if (!speaking && !loading) startListening(); }} disabled={speaking || loading} style={{ width: 52, height: 52, borderRadius: "50%", border: "none", background: listening ? "linear-gradient(135deg,#e63946,#ff4466)" : speaking || loading ? "rgba(255,255,255,0.05)" : "linear-gradient(135deg,#e63946,#ff6b6b)", cursor: speaking || loading ? "not-allowed" : "pointer", fontSize: 22, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: listening ? "0 0 25px rgba(230,57,70,0.5)" : "none", opacity: speaking || loading ? 0.4 : 1, transition: "all 0.2s" }}>
                      {listening ? "⏹" : "🎤"}
                    </button>
                  </div>
                  <div style={{ fontSize: 12, color: listening ? "#ff6b6b" : speaking ? "#e63946" : "rgba(255,255,255,0.3)", fontWeight: 500 }}>
                    {listening ? "Listening — tap to stop" : speaking ? "Alex speaking..." : loading ? "Thinking..." : "Tap mic to answer"}
                    {transcript && <div style={{ fontSize: 11, color: "rgba(230,57,70,0.7)", fontStyle: "italic" }}>"{transcript.slice(0, 40)}..."</div>}
                  </div>
                </div>
                <button onClick={() => { synthRef.current?.cancel(); stopListening(); setMode("text"); }} style={{ padding: "5px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: 11 }}>⌨️ Text</button>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — Score + Integrity */}
        <div style={{ borderLeft: "1px solid rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", background: "rgba(0,0,0,0.2)", overflow: "hidden" }}>
          {/* Score panel top half */}
          <div style={{ flex: 1, overflow: "hidden", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <ScorePanel score={score} updating={scoring} />
          </div>
          {/* Integrity log bottom half */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "8px 12px", borderBottom: "1px solid rgba(255,255,255,0.06)", fontSize: 9, letterSpacing: 2, color: "rgba(255,255,255,0.25)", fontWeight: 600 }}>INTEGRITY LOG</div>
            <div style={{ flex: 1, overflowY: "auto", padding: 8 }}>
              {violations.length === 0 ? (
                <div style={{ textAlign: "center", padding: "1.5rem 0", color: "rgba(255,255,255,0.15)", fontSize: 11 }}>
                  <div style={{ fontSize: 18, marginBottom: 4 }}>✓</div>No violations
                </div>
              ) : [...violations].reverse().map((v, i) => (
                <div key={i} style={{ marginBottom: 5, padding: "5px 8px", background: `rgba(${v.severity === "critical" ? "220,38,38" : v.severity === "high" ? "255,68,102" : v.severity === "medium" ? "251,191,36" : "99,102,241"},0.08)`, border: `1px solid rgba(${v.severity === "critical" ? "220,38,38" : v.severity === "high" ? "255,68,102" : v.severity === "medium" ? "251,191,36" : "99,102,241"},0.2)`, borderRadius: 8, animation: "slideIn 0.3s ease" }}>
                  <div style={{ fontSize: 9, fontWeight: 600, color: v.severity === "critical" ? "#dc2626" : v.severity === "high" ? "#ff4466" : v.severity === "medium" ? "#fbbf24" : "#a5b4fc", marginBottom: 1 }}>{v.type}</div>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.2)" }}>{v.time}</div>
                </div>
              ))}
            </div>
            {/* Bottom metrics */}
            <div style={{ padding: "8px 10px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              {[
                ["Face OK", totalFrames > 0 ? `${Math.round(faceOkFrames / totalFrames * 100)}%` : "—", faceOkFrames / (totalFrames || 1) >= 0.8 ? "#00ff88" : "#ff4466"],
                ["Tab Switches", String(tabSwitches), tabSwitches === 0 ? "#00ff88" : "#ff4466"],
                ["Pastes", String(pasteCount), pasteCount === 0 ? "#00ff88" : "#ff4466"],
                ["AI Warnings", String(aiWarnings), aiWarnings === 0 ? "#00ff88" : "#ff4466"],
              ].map(([l, v, c]) => (
                <div key={l as string} style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: 9, color: "rgba(255,255,255,0.3)" }}>{l}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, color: c as string }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ════════ REPORT ════════
  return (
    <div style={{ minHeight: "100vh", background: BG, color: "#17191C", fontFamily: "var(--font-inter, -apple-system, sans-serif)" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}} @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1rem 2rem", background: "#FFFFFF", borderBottom: "1px solid #E4E1DA" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, background: "#162A43", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#FFFFFF" }}>🛡️</div>
          <span style={{ fontWeight: 800, color: "#162A43", letterSpacing: "-0.01em" }}>COGNALYZE</span>
          <span style={{ fontSize: 10, padding: "2px 8px", background: "#EFF4FE", border: "1px solid #D2E0FB", borderRadius: 20, color: "#356AE6", fontWeight: 700 }}>INTEGRITY REPORT</span>
        </div>
        <a href="/" style={{ color: "#667085", textDecoration: "none", fontSize: 13, fontWeight: 500 }}>← Home</a>
      </nav>
      <div style={{ maxWidth: 780, margin: "0 auto", padding: "3rem 2rem", animation: "fadeUp 0.6s ease" }}>
        {buildingReport ? (
          <div style={{ textAlign: "center", padding: "6rem 0" }}>
            <div style={{ position: "relative", width: 64, height: 64, margin: "0 auto 1.5rem" }}>
              <div style={{ position: "absolute", inset: 0, border: "3px solid #E4E1DA", borderTop: "3px solid #356AE6", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
              <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>🛡️</span>
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#162A43", marginBottom: 4 }}>Generating evidence-based integrity report...</div>
            <div style={{ fontSize: 12, color: "#667085" }}>Synthesizing session metrics, face continuity, and response verification.</div>
          </div>
        ) : report ? (() => {
          const isVerified = report.verdict === "VERIFIED";
          const isCaution = report.verdict === "CAUTION";
          const vc = isVerified ? "#2E7D5B" : isCaution ? "#B7791F" : "#C24141";
          const vbg = isVerified ? "#EAF4EE" : isCaution ? "#FEF7ED" : "#FDF2F2";
          const vborder = isVerified ? "#C8E4D3" : isCaution ? "#F8D8A7" : "#F8C8C8";
          const icon = isVerified ? "✅" : isCaution ? "⚠️" : "🚩";
          return (
            <>
              {/* Hero Card */}
              <div style={{ textAlign: "center", padding: "3rem 2rem", background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 16, marginBottom: "1.5rem", position: "relative", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: vc }} />
                {identityPhoto && <img src={identityPhoto} alt="ID" style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: `2px solid ${vc}`, marginBottom: 16 }} />}
                <div style={{ fontSize: "2.5rem", marginBottom: 8 }}>{icon}</div>
                <div style={{ fontSize: "2rem", fontWeight: 800, color: vc, letterSpacing: -0.5, marginBottom: 4 }}>{report.verdict}</div>
                <div style={{ fontSize: "3.5rem", fontWeight: 900, color: "#162A43", letterSpacing: -1, lineHeight: 1, marginBottom: 8 }}>{report.trust_score}<span style={{ fontSize: "1.2rem", color: "#667085", fontWeight: 500 }}>/100</span></div>
                <div style={{ fontSize: 14, color: "#667085", marginBottom: 14, maxWidth: 500, margin: "0 auto 14px" }}>{report.verdict_reason}</div>
                <div style={{ display: "inline-flex", gap: 8, flexWrap: "wrap", justifyContent: "center" }}>
                  <span style={{ fontSize: 11, padding: "3px 12px", background: vbg, border: `1px solid ${vborder}`, borderRadius: 999, color: vc, fontWeight: 700 }}>Confidence: {report.confidence_level}</span>
                  <span style={{ fontSize: 11, padding: "3px 12px", background: "#FAFAF8", border: "1px solid #E4E1DA", borderRadius: 999, color: "#667085", fontWeight: 600 }}>
                    {aiWarnings > 0 ? `${aiWarnings} AI warning${aiWarnings > 1 ? "s" : ""}` : "Zero AI synthetic markers detected"}
                  </span>
                </div>
              </div>

              {/* Breakdown Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12, marginBottom: "1.5rem" }}>
                {Object.values(report.breakdown).map((b, i) => {
                  const bScoreColor = b.score >= 70 ? "#2E7D5B" : b.score >= 50 ? "#B7791F" : "#C24141";
                  return (
                    <div key={i} style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 12, padding: "1.25rem", textAlign: "center" }}>
                      <div style={{ fontSize: "1.8rem", fontWeight: 900, color: bScoreColor, marginBottom: 2 }}>{b.score}</div>
                      <div style={{ fontSize: 12, color: "#162A43", fontWeight: 700, marginBottom: 6 }}>{b.label}</div>
                      <div style={{ height: 4, background: "#E4E1DA", borderRadius: 999, overflow: "hidden", marginBottom: 8 }}>
                        <div style={{ height: "100%", width: `${b.score}%`, background: bScoreColor, borderRadius: 999 }} />
                      </div>
                      <div style={{ fontSize: 11, color: "#667085", lineHeight: 1.4 }}>{b.note}</div>
                    </div>
                  );
                })}
              </div>

              {/* AI Detection */}
              {aiChecks.length > 0 && (
                <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 14, padding: "1.5rem", marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: 11, color: "#162A43", fontWeight: 800, letterSpacing: 1.5, marginBottom: "1rem" }}>🤖 SYNTACTIC AI TEXT VERIFICATION</div>
                  {aiChecks.map((c, i) => (
                    <div key={i} style={{ marginBottom: 8, padding: "10px 12px", background: "#FAFAF8", border: `1px solid ${c.isAI ? "#F8C8C8" : "#E4E1DA"}`, borderRadius: 8 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: c.isAI ? "#C24141" : "#2E7D5B" }}>{c.isAI ? "⚠ AI-generated patterns" : "✓ Human conversational text"} — Answer {i + 1}</span>
                        <span style={{ fontSize: 11, color: "#667085", fontWeight: 600 }}>Synthetic index: {c.ai_score}%</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#667085", lineHeight: 1.4 }}>{c.verdict}</div>
                      {c.signals_found.length > 0 && <div style={{ fontSize: 11, color: "#C24141", marginTop: 2 }}>Signals: {c.signals_found.join(", ")}</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Violations + Analysis */}
              <div style={{ display: "grid", gridTemplateColumns: report.flags.length > 0 ? "1fr 1fr" : "1fr", gap: 12, marginBottom: "1.5rem" }}>
                {report.flags.length > 0 && (
                  <div style={{ background: "#FDF2F2", border: "1px solid #F8C8C8", borderRadius: 12, padding: "1.25rem" }}>
                    <div style={{ fontSize: 11, color: "#C24141", fontWeight: 800, letterSpacing: 1.5, marginBottom: "0.75rem" }}>🚩 PROCTORING FLAGS ({report.flags.length})</div>
                    {report.flags.map((f, i) => <div key={i} style={{ fontSize: 12, color: "#17191C", marginBottom: 5, paddingLeft: 8, borderLeft: "2px solid #C24141", lineHeight: 1.4 }}>{f}</div>)}
                  </div>
                )}
                <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 12, padding: "1.25rem" }}>
                  <div style={{ fontSize: 11, color: "#356AE6", fontWeight: 800, letterSpacing: 1.5, marginBottom: "0.75rem" }}>🧠 BEHAVIORAL OBSERVATION</div>
                  <p style={{ fontSize: 13, color: "#667085", lineHeight: 1.6, margin: 0 }}>{report.ai_observation}</p>
                </div>
              </div>

              {/* Recommendation */}
              <div style={{ padding: "1.25rem 1.5rem", background: "#EAF4EE", border: "1px solid #C8E4D3", borderRadius: 12, marginBottom: "1.5rem" }}>
                <div style={{ fontSize: 11, color: "#2E7D5B", fontWeight: 800, letterSpacing: 1.5, marginBottom: 6 }}>📋 RECRUITER RECOMMENDATION</div>
                <p style={{ fontSize: 13, color: "#17191C", lineHeight: 1.6, margin: 0 }}>{report.recruiter_recommendation}</p>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                <button onClick={downloadReport} style={{ padding: "0.85rem 2rem", borderRadius: 8, border: "none", background: "#356AE6", color: "#FFFFFF", cursor: "pointer", fontSize: 13, fontWeight: 700, letterSpacing: 0.5 }}>
                  ⬇ Download Trust Report
                </button>
                {finalVerdict && (
                  <button onClick={() => setShowVerdict(true)} style={{ padding: "0.85rem 1.75rem", borderRadius: 8, border: "1px solid #D2E0FB", background: "#EFF4FE", color: "#356AE6", cursor: "pointer", fontSize: 13, fontWeight: 700 }}>
                    View Verdict 🏆
                  </button>
                )}
                <a href="/" style={{ textDecoration: "none" }}>
                  <button style={{ padding: "0.85rem 1.75rem", borderRadius: 8, border: "1px solid #E4E1DA", background: "#FFFFFF", color: "#162A43", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Home</button>
                </a>
              </div>
              {showVerdict && finalVerdict && <VerdictModal verdict={finalVerdict} onClose={() => setShowVerdict(false)} />}
            </>
          );
        })() : (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "#667085" }}>No report available</div>
        )}
      </div>
    </div>
  );
}