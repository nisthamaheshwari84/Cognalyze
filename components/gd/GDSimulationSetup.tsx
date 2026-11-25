"use client";

import React, { useState, useEffect } from "react";
import {
  Play,
  Mic,
  MicOff,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Users,
  Sliders,
  Volume2
} from "lucide-react";
import { GDThemeTokens, GD_EXPERIENCE_MODES } from "./gd-theme";
import { GDTopicItem } from "@/lib/group-discussion-data";
import type { GDExperienceMode } from "@/lib/gd/types";
import { GD_EXPERIENCE_MODE_META } from "@/lib/gd/experience-engine";

interface GDSimulationSetupProps {
  T: GDThemeTokens;
  topicsPool: GDTopicItem[];
  simulationFormat: "collaborative" | "competitive" | "corporate" | "technical_business";
  setSimulationFormat: (val: "collaborative" | "competitive" | "corporate" | "technical_business") => void;
  difficultyTier: "beginner" | "intermediate" | "advanced" | "expert";
  setDifficultyTier: (val: "beginner" | "intermediate" | "advanced" | "expert") => void;
  onLaunchSession: (params: {
    topicTitle: string;
    format: "collaborative" | "competitive" | "corporate" | "technical_business";
    experienceMode: GDExperienceMode;
    difficulty: "beginner" | "intermediate" | "advanced" | "expert";
    durationMinutes: number;
  }) => void;
}

const DIFFICULTY_META: Array<{
  id: "beginner" | "intermediate" | "advanced" | "expert";
  label: string;
  desc: string;
}> = [
  { id: "beginner", label: "Beginner", desc: "Supportive pace, structured prompts, gentle interruptions." },
  { id: "intermediate", label: "Intermediate", desc: "Standard campus placement pace with balanced pushback." },
  { id: "advanced", label: "Advanced", desc: "High interruption pressure and rigorous evidence checks." },
  { id: "expert", label: "Expert", desc: "Bar-raiser scrutiny, rapid cross-questioning, sharp trade-offs." }
];

export default function GDSimulationSetup({
  T,
  topicsPool,
  simulationFormat,
  setSimulationFormat,
  difficultyTier,
  setDifficultyTier,
  onLaunchSession
}: GDSimulationSetupProps) {
  const [selectedTopicTitle, setSelectedTopicTitle] = useState<string>(
    topicsPool[0]?.title || "Autonomous AI Coding Agents vs Junior Software Engineers"
  );
  const [customPrompt, setCustomPrompt] = useState<string>("");
  const [customBrief, setCustomBrief] = useState<{
    normalizedTitle: string;
    context: string;
    propositionCamp: string;
    oppositionCamp: string;
  } | null>(null);
  const [customBriefError, setCustomBriefError] = useState<string | null>(null);
  const [enrichingCustom, setEnrichingCustom] = useState(false);
  const [experienceMode, setExperienceMode] = useState<GDExperienceMode>("standard_round");
  const [durationMinutes, setDurationMinutes] = useState<number>(15);
  const [interactionPreference, setInteractionPreference] = useState<"voice" | "text">("voice");
  const [speechSupported, setSpeechSupported] = useState<boolean | null>(null);
  const [micStatus, setMicStatus] = useState<"idle" | "checking" | "ready" | "denied">("idle");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasRec = Boolean((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
      setSpeechSupported(hasRec);
    }
  }, []);

  const checkMicrophoneAccess = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setMicStatus("denied");
      return;
    }
    setMicStatus("checking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicStatus("ready");
    } catch {
      setMicStatus("denied");
    }
  };

  const finalTopic = customBrief?.normalizedTitle || customPrompt.trim() || selectedTopicTitle;

  const handleEnrichCustomPrompt = async () => {
    if (!customPrompt.trim()) return;
    setEnrichingCustom(true);
    setCustomBriefError(null);
    try {
      const res = await fetch("/api/gd/generate-topics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "enrich_custom",
          prompt: customPrompt.trim()
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setCustomBrief(null);
        setCustomBriefError(data.reason || data.message || "Enter a full debatable topic with at least 4 words.");
      } else {
        setCustomBrief({
          normalizedTitle: data.normalizedTitle,
          context: data.context,
          propositionCamp: data.propositionCamp,
          oppositionCamp: data.oppositionCamp
        });
      }
    } catch {
      setCustomBriefError("Unable to validate custom prompt right now.");
    } finally {
      setEnrichingCustom(false);
    }
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 18 }}>
      {/* Left Configuration Column */}
      <div
        style={{
          backgroundColor: T.bgCard,
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          padding: 22,
          boxShadow: T.shadowCard,
          display: "flex",
          flexDirection: "column",
          gap: 18
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Sliders size={16} style={{ color: T.accent }} />
          <h2 style={{ fontSize: 16, fontWeight: 800, color: T.textPrimary, margin: 0 }}>
            1. Format, Difficulty & Topic Setup
          </h2>
        </div>

        {/* Simulation Format */}
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", marginBottom: 8 }}>
            Experience Mode / Format
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {GD_EXPERIENCE_MODES.map((m) => {
              const active = simulationFormat === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSimulationFormat(m.id)}
                  style={{
                    textAlign: "left",
                    padding: "10px 12px",
                    borderRadius: 8,
                    backgroundColor: active ? T.accentSoft : T.bgSubtle,
                    border: `1px solid ${active ? T.accent : T.border}`,
                    cursor: "pointer"
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: active ? T.accent : T.textPrimary }}>
                    {m.label}
                  </div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{m.tagline}</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Experience Mode */}
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", marginBottom: 8 }}>
            Scenario Experience Mode
          </label>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {(Object.keys(GD_EXPERIENCE_MODE_META) as GDExperienceMode[]).map((modeId) => {
              const meta = GD_EXPERIENCE_MODE_META[modeId];
              const active = experienceMode === modeId;
              return (
                <button
                  key={modeId}
                  type="button"
                  onClick={() => setExperienceMode(modeId)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 7,
                    backgroundColor: active ? T.accentSoft : T.bgSubtle,
                    border: `1px solid ${active ? T.accent : T.border}`,
                    color: active ? T.accent : T.textSecondary,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 6 }}>
            {GD_EXPERIENCE_MODE_META[experienceMode].description}
          </div>
        </div>

        {/* Difficulty Tier */}
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", marginBottom: 8 }}>
            Panel Pressure / Difficulty
          </label>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
            {DIFFICULTY_META.map((d) => {
              const active = difficultyTier === d.id;
              return (
                <button
                  key={d.id}
                  type="button"
                  onClick={() => setDifficultyTier(d.id)}
                  style={{
                    padding: "8px 6px",
                    borderRadius: 8,
                    backgroundColor: active ? T.accent : T.bgSubtle,
                    color: active ? "#FFFFFF" : T.textPrimary,
                    border: `1px solid ${active ? T.accent : T.border}`,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {d.label}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 6 }}>
            {DIFFICULTY_META.find((d) => d.id === difficultyTier)?.desc}
          </div>
        </div>

        {/* Topic Picker */}
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", marginBottom: 6 }}>
            Select Discussion Topic
          </label>
          <select
            value={selectedTopicTitle}
            onChange={(e) => setSelectedTopicTitle(e.target.value)}
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: 8,
              backgroundColor: T.bgSubtle,
              border: `1px solid ${T.borderStrong}`,
              color: T.textPrimary,
              fontSize: 12,
              fontWeight: 600,
              outline: "none",
              marginBottom: 10
            }}
          >
            {topicsPool.map((t) => (
              <option key={t.id} value={t.title}>
                [{t.category}] {t.title}
              </option>
            ))}
          </select>

          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", marginBottom: 6 }}>
            Or Enter Custom Prompt (Overrides Picker)
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              value={customPrompt}
              onChange={(e) => {
                setCustomPrompt(e.target.value);
                setCustomBrief(null);
                setCustomBriefError(null);
              }}
              placeholder="e.g., Should regulated banks deploy open-weight LLMs on-premise vs frontier APIs?"
              style={{
                flex: 1,
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
            <button
              type="button"
              disabled={enrichingCustom || !customPrompt.trim()}
              onClick={handleEnrichCustomPrompt}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                backgroundColor: T.accentSoft,
                border: `1px solid ${T.accentBorder}`,
                color: T.accent,
                fontSize: 11,
                fontWeight: 700,
                cursor: enrichingCustom || !customPrompt.trim() ? "not-allowed" : "pointer",
                whiteSpace: "nowrap"
              }}
            >
              {enrichingCustom ? "Framing..." : "Structure Brief"}
            </button>
          </div>
          {customBriefError && (
            <div style={{ fontSize: 11, color: T.danger, marginTop: 6 }}>{customBriefError}</div>
          )}
          {customBrief && (
            <div
              style={{
                marginTop: 8,
                padding: 10,
                borderRadius: 8,
                backgroundColor: T.bgSubtle,
                border: `1px solid ${T.accentBorder}`,
                fontSize: 11,
                color: T.textSecondary,
                lineHeight: 1.45
              }}
            >
              <div style={{ fontWeight: 700, color: T.textPrimary, marginBottom: 3 }}>
                {customBrief.normalizedTitle}
              </div>
              <div style={{ marginBottom: 4 }}>{customBrief.context}</div>
              <div><strong>Side A:</strong> {customBrief.propositionCamp}</div>
              <div><strong>Side B:</strong> {customBrief.oppositionCamp}</div>
            </div>
          )}
        </div>

        {/* Duration */}
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", marginBottom: 6 }}>
            Session Duration
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            {[10, 15, 20].map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => setDurationMinutes(mins)}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: 8,
                  backgroundColor: durationMinutes === mins ? T.accentSoft : T.bgSubtle,
                  border: `1px solid ${durationMinutes === mins ? T.accent : T.border}`,
                  color: durationMinutes === mins ? T.accent : T.textPrimary,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                {mins} Minutes
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Audio Pre-Flight & Summary Column */}
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
          gap: 18
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Volume2 size={16} style={{ color: T.accent }} />
            <h2 style={{ fontSize: 16, fontWeight: 800, color: T.textPrimary, margin: 0 }}>
              2. Voice Readiness & Panel Brief
            </h2>
          </div>

          {/* Voice / Text Mode Check */}
          <div
            style={{
              padding: 14,
              borderRadius: 10,
              backgroundColor: T.bgSubtle,
              border: `1px solid ${T.border}`
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: T.textPrimary, marginBottom: 8 }}>
              Speaking Mode Preference
            </div>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button
                type="button"
                onClick={() => setInteractionPreference("voice")}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  borderRadius: 7,
                  backgroundColor: interactionPreference === "voice" ? T.accentSoft : T.bgCard,
                  border: `1px solid ${interactionPreference === "voice" ? T.accent : T.border}`,
                  color: interactionPreference === "voice" ? T.accent : T.textSecondary,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6
                }}
              >
                <Mic size={13} />
                <span>Voice + Live Transcript</span>
              </button>
              <button
                type="button"
                onClick={() => setInteractionPreference("text")}
                style={{
                  flex: 1,
                  padding: "8px 10px",
                  borderRadius: 7,
                  backgroundColor: interactionPreference === "text" ? T.accentSoft : T.bgCard,
                  border: `1px solid ${interactionPreference === "text" ? T.accent : T.border}`,
                  color: interactionPreference === "text" ? T.accent : T.textSecondary,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6
                }}
              >
                <MicOff size={13} />
                <span>Typed Intervention</span>
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div style={{ fontSize: 11, color: T.textMuted }}>
                Browser Speech-to-Text:{" "}
                <strong style={{ color: speechSupported ? T.success : T.warning }}>
                  {speechSupported === null
                    ? "Checking..."
                    : speechSupported
                    ? "Available"
                    : "Unavailable (Typed fallback ready)"}
                </strong>
              </div>
              <button
                type="button"
                onClick={checkMicrophoneAccess}
                style={{
                  padding: "5px 10px",
                  borderRadius: 6,
                  backgroundColor: T.bgCard,
                  border: `1px solid ${T.borderStrong}`,
                  color: T.textPrimary,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                {micStatus === "checking"
                  ? "Checking Mic..."
                  : micStatus === "ready"
                  ? "Mic Verified ✓"
                  : micStatus === "denied"
                  ? "Mic Blocked — Retry"
                  : "Test Microphone"}
              </button>
            </div>

            {micStatus === "ready" && (
              <div style={{ marginTop: 8, fontSize: 11, color: T.success, display: "flex", alignItems: "center", gap: 5 }}>
                <CheckCircle2 size={12} />
                <span>Audio input permission confirmed.</span>
              </div>
            )}
            {micStatus === "denied" && (
              <div style={{ marginTop: 8, fontSize: 11, color: T.danger, display: "flex", alignItems: "center", gap: 5 }}>
                <AlertCircle size={12} />
                <span>Microphone permission blocked. You can still participate cleanly using live typed interventions.</span>
              </div>
            )}
          </div>

          {/* Session Summary Card */}
          <div
            style={{
              padding: 14,
              borderRadius: 10,
              backgroundColor: T.bgSubtle,
              border: `1px solid ${T.border}`,
              display: "flex",
              flexDirection: "column",
              gap: 8
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700, color: T.textPrimary }}>
              <Users size={14} style={{ color: T.accent }} />
              <span>AI Panel Composition Preview</span>
            </div>
            <p style={{ fontSize: 12, color: T.textSecondary, margin: 0, lineHeight: 1.45 }}>
              You will join <strong>4 calibrated AI peers</strong> (Velocity Architect, Systems Analyst, Practical Skeptic,
              Diplomatic Synthesizer) and <strong>1 always-present Evaluator & Moderator</strong>.
            </p>
            <div style={{ fontSize: 11, color: T.textMuted, borderTop: `1px solid ${T.border}`, paddingTop: 8 }}>
              <strong>Selected Topic:</strong> {finalTopic}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            onLaunchSession({
              topicTitle: finalTopic,
              format: simulationFormat,
              experienceMode,
              difficulty: difficultyTier,
              durationMinutes
            })
          }
          style={{
            width: "100%",
            padding: "13px 18px",
            borderRadius: 10,
            background: `linear-gradient(135deg, ${T.accent}, ${T.accentSecondary})`,
            color: "#FFFFFF",
            border: "none",
            fontSize: 14,
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8
          }}
        >
          <Sparkles size={15} />
          <Play size={14} />
          <span>Enter Live GD Arena</span>
        </button>
      </div>
    </div>
  );
}
