"use client";

import React, { useState } from "react";
import { ShieldCheck, AlertTriangle, Scale, CheckCircle2, Send } from "lucide-react";
import { GDThemeTokens } from "./gd-theme";

interface GDGuidelinesViewProps {
  T: GDThemeTokens;
}

export default function GDGuidelinesView({ T }: GDGuidelinesViewProps) {
  const [appealToken, setAppealToken] = useState("");
  const [explanation, setExplanation] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [appealResult, setAppealResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleSubmitAppeal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appealToken.trim() || !explanation.trim()) return;
    setSubmitting(true);
    setAppealResult(null);
    try {
      const res = await fetch("/api/gd/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "appeal_warning",
          appealToken: appealToken.trim(),
          explanation: explanation.trim()
        })
      });
      const data = await res.json();
      setAppealResult({
        ok: Boolean(data.success),
        msg: data.message || data.error || "Unable to submit appeal."
      });
      if (data.success) {
        setAppealToken("");
        setExplanation("");
      }
    } catch (err: any) {
      setAppealResult({ ok: false, msg: err.message || "Network error submitting appeal." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18 }}>
      {/* Conduct Policy & Constructive Disagreement Rules */}
      <div
        style={{
          backgroundColor: T.bgCard,
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          padding: 22,
          boxShadow: T.shadowCard,
          display: "flex",
          flexDirection: "column",
          gap: 14
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Scale size={17} style={{ color: T.accent }} />
          <h2 style={{ fontSize: 16, fontWeight: 800, color: T.textPrimary, margin: 0 }}>
            Arena Conduct & Moderation Policy
          </h2>
        </div>

        <div
          style={{
            padding: 14,
            borderRadius: 8,
            backgroundColor: T.successSoft,
            border: `1px solid ${T.border}`
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: T.success, marginBottom: 4 }}>
            <CheckCircle2 size={14} />
            <span>Constructive Disagreement Is Protected</span>
          </div>
          <p style={{ fontSize: 12, color: T.textSecondary, margin: 0, lineHeight: 1.5 }}>
            Challenging ideas, questioning benchmarks, pointing out architectural flaws, and asserting respectful
            counter-arguments are core GD strengths and are never flagged as misconduct.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ padding: 12, borderRadius: 8, backgroundColor: T.bgSubtle, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.textPrimary }}>
              Warning 1 — Formal Etiquette Notice
            </div>
            <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 2 }}>
              Triggered on verified disrespectful silencing, harassment, or persistent floor hogging (&gt;48% dominance).
            </div>
          </div>

          <div style={{ padding: 12, borderRadius: 8, backgroundColor: T.warningSoft, border: `1px solid ${T.border}` }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.warning }}>
              Warning 2 — Final Session Warning
            </div>
            <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 2 }}>
              Repeated misconduct within the same session triggers a final moderator intervention with evidence quote.
            </div>
          </div>

          <div style={{ padding: 12, borderRadius: 8, backgroundColor: T.dangerSoft, border: `1px solid ${T.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: T.danger }}>
              <AlertTriangle size={13} />
              <span>Warning 3 — Room Ejection & 72-Hour Account Suspension</span>
            </div>
            <div style={{ fontSize: 12, color: T.textSecondary, marginTop: 2 }}>
              A third verified violation removes access to live/friends rooms for 72 hours and issues an Appeal Token.
            </div>
          </div>
        </div>
      </div>

      {/* Appeal Submission Form */}
      <div
        style={{
          backgroundColor: T.bgCard,
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          padding: 22,
          boxShadow: T.shadowCard,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          gap: 14
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <ShieldCheck size={17} style={{ color: T.info }} />
            <h3 style={{ fontSize: 16, fontWeight: 800, color: T.textPrimary, margin: 0 }}>
              Appeal a Warning or Speech Misattribution
            </h3>
          </div>
          <p style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.5, margin: "0 0 14px" }}>
            If automated speech-to-text misheard a phrase or flagged valid debate, submit your warning&apos;s Appeal
            Token below for transcript review.
          </p>

          <form onSubmit={handleSubmitAppeal} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", marginBottom: 5 }}>
                Appeal Token
              </label>
              <input
                type="text"
                value={appealToken}
                onChange={(e) => setAppealToken(e.target.value)}
                placeholder="e.g., appeal_17955..."
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 8,
                  backgroundColor: T.bgSubtle,
                  border: `1px solid ${T.borderStrong}`,
                  color: T.textPrimary,
                  fontSize: 12,
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", marginBottom: 5 }}>
                Context / Explanation
              </label>
              <textarea
                rows={4}
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Explain what was said or why the warning was triggered by transcription noise..."
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  borderRadius: 8,
                  backgroundColor: T.bgSubtle,
                  border: `1px solid ${T.border}`,
                  color: T.textPrimary,
                  fontSize: 12,
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>

            {appealResult && (
              <div
                style={{
                  padding: "9px 12px",
                  borderRadius: 8,
                  backgroundColor: appealResult.ok ? T.successSoft : T.dangerSoft,
                  color: appealResult.ok ? T.success : T.danger,
                  fontSize: 12,
                  fontWeight: 600
                }}
              >
                {appealResult.msg}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !appealToken.trim() || !explanation.trim()}
              style={{
                padding: "10px 16px",
                borderRadius: 8,
                background: `linear-gradient(135deg, ${T.accent}, ${T.accentSecondary})`,
                color: "#FFFFFF",
                border: "none",
                fontSize: 13,
                fontWeight: 700,
                cursor: submitting ? "wait" : "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6
              }}
            >
              <Send size={13} />
              <span>{submitting ? "Submitting Appeal..." : "Submit Moderation Appeal"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
