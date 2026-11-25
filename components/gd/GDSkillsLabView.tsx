"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  Target,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  PlayCircle,
  Mic,
  MicOff,
  Send,
  Award
} from "lucide-react";
import { GDThemeTokens, GD_SKILLS_LAB_TRACKS, GDSkillTrackSpec } from "./gd-theme";

interface SkillProgressRow {
  trackId: string;
  attemptCount: number;
  bestScore: number;
  latestScore: number;
  completedAt: string | null;
}

interface DrillScenarioState {
  trackId: string;
  promptScenario: string;
  peerSetupLine: string;
  targetGuidance: string;
  rubricChecklist: string[];
}

interface DrillEvalState {
  score: number;
  passed: boolean;
  rubricHits: Array<{ criterion: string; met: boolean; note: string }>;
  coachFeedback: string;
  improvedExample: string;
}

interface GDSkillsLabViewProps {
  T: GDThemeTokens;
  dnaSkillGaps: string[];
  onPracticeInArena: (topicTitle: string) => void;
}

const CATEGORIES = ["All", "Opening", "Reasoning", "Interaction", "Leadership", "Composure"] as const;

export default function GDSkillsLabView({
  T,
  dnaSkillGaps,
  onPracticeInArena
}: GDSkillsLabViewProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [activeTrack, setActiveTrack] = useState<GDSkillTrackSpec | null>(GD_SKILLS_LAB_TRACKS[0]);
  const [progressByTrack, setProgressByTrack] = useState<Record<string, SkillProgressRow>>({});

  // Micro-Drill Interactive Runner State
  const [drillScenario, setDrillScenario] = useState<DrillScenarioState | null>(null);
  const [startingDrill, setStartingDrill] = useState(false);
  const [drillInput, setDrillInput] = useState("");
  const [evaluatingDrill, setEvaluatingDrill] = useState(false);
  const [drillEval, setDrillEval] = useState<DrillEvalState | null>(null);
  const [drillError, setDrillError] = useState<string | null>(null);
  const [recordingMic, setRecordingMic] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    fetch("/api/gd/skills-lab")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.success && Array.isArray(data.progress)) {
          const map: Record<string, SkillProgressRow> = {};
          for (const row of data.progress) {
            map[row.trackId] = row;
          }
          setProgressByTrack(map);
        }
      })
      .catch(() => {});
  }, []);

  const filteredTracks = useMemo(() => {
    if (selectedCategory === "All") return GD_SKILLS_LAB_TRACKS;
    return GD_SKILLS_LAB_TRACKS.filter((t) => t.category === selectedCategory);
  }, [selectedCategory]);

  const masteredCount = useMemo(
    () => Object.values(progressByTrack).filter((p) => Boolean(p.completedAt)).length,
    [progressByTrack]
  );

  const selectTrack = (track: GDSkillTrackSpec) => {
    setActiveTrack(track);
    setDrillScenario(null);
    setDrillEval(null);
    setDrillError(null);
    setDrillInput("");
  };

  const handleStartMicroDrill = async () => {
    if (!activeTrack) return;
    setStartingDrill(true);
    setDrillError(null);
    setDrillEval(null);
    try {
      const res = await fetch("/api/gd/skills-lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start_drill", trackId: activeTrack.id })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setDrillError(data.message || "Sign in as a student to launch guided Skills Lab drills.");
        return;
      }
      setDrillScenario(data.scenario);
    } catch {
      setDrillError("Unable to load drill scenario.");
    } finally {
      setStartingDrill(false);
    }
  };

  const handleSubmitMicroDrill = async () => {
    if (!activeTrack || !drillScenario || !drillInput.trim()) return;
    setEvaluatingDrill(true);
    setDrillError(null);
    try {
      const res = await fetch("/api/gd/skills-lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_drill",
          trackId: activeTrack.id,
          promptScenario: drillScenario.promptScenario,
          peerSetupLine: drillScenario.peerSetupLine,
          studentResponse: drillInput.trim()
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setDrillError(data.message || "Failed to evaluate drill response.");
        return;
      }
      setDrillEval(data.evaluation);
      if (Array.isArray(data.progress)) {
        const map: Record<string, SkillProgressRow> = {};
        for (const row of data.progress) {
          map[row.trackId] = row;
        }
        setProgressByTrack(map);
      }
    } catch {
      setDrillError("Network error while evaluating drill.");
    } finally {
      setEvaluatingDrill(false);
    }
  };

  const toggleDrillMic = () => {
    if (recordingMic) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setRecordingMic(false);
      return;
    }
    const SR = typeof window !== "undefined" ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition : null;
    if (!SR) {
      setDrillError("Browser speech-to-text unavailable. Type your micro-drill response below.");
      return;
    }
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = "en-US";
    rec.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setDrillInput(transcript);
    };
    rec.onerror = () => setRecordingMic(false);
    rec.onend = () => setRecordingMic(false);
    recognitionRef.current = rec;
    rec.start();
    setRecordingMic(true);
  };

  const activeProgress = activeTrack ? progressByTrack[activeTrack.id] : undefined;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Header Card */}
      <div
        style={{
          backgroundColor: T.bgCard,
          border: `1px solid ${T.border}`,
          borderRadius: 12,
          padding: 20,
          boxShadow: T.shadowCard,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 14
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Target size={17} style={{ color: T.accent }} />
            <h2 style={{ fontSize: 17, fontWeight: 800, color: T.textPrimary, margin: 0 }}>
              GD Skills Lab — 12 Focused Communication Micro-Drills
            </h2>
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 6,
                backgroundColor: T.accentSoft,
                color: T.accent
              }}
            >
              {masteredCount}/12 Mastered
            </span>
          </div>
          <p style={{ fontSize: 12, color: T.textSecondary, margin: 0, maxWidth: 680 }}>
            Practice isolated 30-to-45 second drills with real-time AI Coach rubric grading before entering full 15-minute
            roundtables.
          </p>
        </div>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {CATEGORIES.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: `1px solid ${active ? T.accent : T.border}`,
                  backgroundColor: active ? T.accent : T.bgSubtle,
                  color: active ? "#FFFFFF" : T.textSecondary,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Grid: Track List + Interactive Runner */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 16 }}>
        {/* Tracks List */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 12,
            alignContent: "start"
          }}
        >
          {filteredTracks.map((track) => {
            const isSelected = activeTrack?.id === track.id;
            const prog = progressByTrack[track.id];
            const matchesDnaGap = dnaSkillGaps.some(
              (gap) =>
                gap.toLowerCase().includes(track.dnaTag.toLowerCase()) ||
                track.title.toLowerCase().includes(gap.toLowerCase())
            );
            return (
              <button
                key={track.id}
                type="button"
                onClick={() => selectTrack(track)}
                style={{
                  textAlign: "left",
                  padding: 15,
                  borderRadius: 10,
                  backgroundColor: isSelected ? T.accentSoft : T.bgCard,
                  border: `1px solid ${isSelected ? T.accent : T.border}`,
                  boxShadow: T.shadowCard,
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: 8
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: 5,
                        backgroundColor: T.bgSubtle,
                        border: `1px solid ${T.border}`,
                        color: T.accent
                      }}
                    >
                      {track.category}
                    </span>
                    <span style={{ fontSize: 11, color: T.textMuted, display: "inline-flex", alignItems: "center", gap: 3 }}>
                      <Clock size={11} />
                      {track.durationMinutes}m
                    </span>
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary, lineHeight: 1.35 }}>
                    {track.title}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4, gap: 6 }}>
                  <span style={{ fontSize: 11, color: T.textMuted }}>{track.difficulty}</span>
                  <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                    {prog && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: prog.completedAt ? T.success : T.info,
                          backgroundColor: prog.completedAt ? T.successSoft : T.infoSoft,
                          padding: "2px 6px",
                          borderRadius: 4
                        }}
                      >
                        Best {prog.bestScore}/100
                      </span>
                    )}
                    {matchesDnaGap && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: T.warning,
                          backgroundColor: T.warningSoft,
                          padding: "2px 6px",
                          borderRadius: 4
                        }}
                      >
                        DNA Focus
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Drill Detail & Interactive Runner */}
        {activeTrack && (
          <div
            style={{
              backgroundColor: T.bgCard,
              border: `1px solid ${T.border}`,
              borderRadius: 12,
              padding: 22,
              boxShadow: T.shadowCard,
              display: "flex",
              flexDirection: "column",
              gap: 15,
              alignSelf: "start"
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 9px",
                    borderRadius: 6,
                    backgroundColor: T.accentSoft,
                    color: T.accent,
                    border: `1px solid ${T.accentBorder}`
                  }}
                >
                  {activeTrack.category} · {activeTrack.difficulty}
                </span>
                {activeProgress && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: T.success, display: "inline-flex", alignItems: "center", gap: 4 }}>
                    <Award size={13} />
                    Attempts: {activeProgress.attemptCount} · Best: {activeProgress.bestScore}/100
                  </span>
                )}
              </div>

              <h3 style={{ fontSize: 18, fontWeight: 800, color: T.textPrimary, margin: "0 0 6px" }}>
                {activeTrack.title}
              </h3>

              <p style={{ fontSize: 13, color: T.textSecondary, lineHeight: 1.5, margin: 0 }}>
                {activeTrack.objective}
              </p>
            </div>

            {/* Rubric Summary */}
            <div
              style={{
                padding: 12,
                borderRadius: 8,
                backgroundColor: T.bgSubtle,
                border: `1px solid ${T.border}`
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: T.textMuted, textTransform: "uppercase", marginBottom: 6 }}>
                Evaluator Rubric Signals Checked
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {activeTrack.rubricFocus.map((item) => (
                  <div key={item} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: T.textPrimary, fontWeight: 600 }}>
                    <CheckCircle2 size={13} style={{ color: T.success }} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {drillError && (
              <div style={{ padding: 10, borderRadius: 8, backgroundColor: T.dangerSoft, color: T.danger, fontSize: 12, fontWeight: 600 }}>
                {drillError}
              </div>
            )}

            {/* Guided Drill Workspace */}
            {!drillScenario ? (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  disabled={startingDrill}
                  onClick={handleStartMicroDrill}
                  style={{
                    flex: "1 1 200px",
                    padding: "11px 16px",
                    borderRadius: 8,
                    background: `linear-gradient(135deg, ${T.accent}, ${T.accentSecondary})`,
                    color: "#FFFFFF",
                    border: "none",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: startingDrill ? "wait" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 7
                  }}
                >
                  <Sparkles size={14} />
                  <span>{startingDrill ? "Preparing Drill..." : "Start Guided Micro-Drill"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => onPracticeInArena(`Micro-Drill Focus — ${activeTrack.title}`)}
                  style={{
                    flex: "1 1 180px",
                    padding: "11px 14px",
                    borderRadius: 8,
                    backgroundColor: T.bgSubtle,
                    border: `1px solid ${T.borderStrong}`,
                    color: T.textPrimary,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6
                  }}
                >
                  <PlayCircle size={14} />
                  <span>Full Panel Practice</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            ) : (
              <div
                style={{
                  padding: 14,
                  borderRadius: 10,
                  backgroundColor: T.bgSubtle,
                  border: `1px solid ${T.accentBorder}`,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10
                }}
              >
                <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.45 }}>
                  <strong>Scenario:</strong> {drillScenario.promptScenario}
                </div>
                <div
                  style={{
                    padding: "9px 12px",
                    borderRadius: 8,
                    backgroundColor: T.bgCard,
                    borderLeft: `3px solid ${T.accent}`,
                    fontSize: 12,
                    fontStyle: "italic",
                    color: T.textPrimary
                  }}
                >
                  &quot;{drillScenario.peerSetupLine}&quot;
                </div>
                <div style={{ fontSize: 11, color: T.accent, fontWeight: 600 }}>
                  Tip: {drillScenario.targetGuidance}
                </div>

                <textarea
                  rows={3}
                  value={drillInput}
                  onChange={(e) => setDrillInput(e.target.value)}
                  placeholder="Speak with mic or type your 30-second turn response..."
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    borderRadius: 8,
                    backgroundColor: T.bgCard,
                    border: `1px solid ${T.borderStrong}`,
                    color: T.textPrimary,
                    fontSize: 12,
                    outline: "none",
                    boxSizing: "border-box"
                  }}
                />

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={toggleDrillMic}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 7,
                      backgroundColor: recordingMic ? T.dangerSoft : T.bgCard,
                      border: `1px solid ${recordingMic ? T.danger : T.borderStrong}`,
                      color: recordingMic ? T.danger : T.textPrimary,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 5
                    }}
                  >
                    {recordingMic ? <Mic size={13} /> : <MicOff size={13} />}
                    <span>{recordingMic ? "Stop Dictation" : "Speak Response"}</span>
                  </button>

                  <button
                    type="button"
                    disabled={evaluatingDrill || !drillInput.trim()}
                    onClick={handleSubmitMicroDrill}
                    style={{
                      flex: 1,
                      padding: "8px 14px",
                      borderRadius: 7,
                      background: `linear-gradient(135deg, ${T.accent}, ${T.accentSecondary})`,
                      color: "#FFFFFF",
                      border: "none",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: evaluatingDrill ? "wait" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6
                    }}
                  >
                    <Send size={13} />
                    <span>{evaluatingDrill ? "Scoring Against Rubric..." : "Submit for Coach Review"}</span>
                  </button>
                </div>

                {drillEval && (
                  <div
                    style={{
                      marginTop: 4,
                      padding: 12,
                      borderRadius: 8,
                      backgroundColor: T.bgCard,
                      border: `1px solid ${drillEval.passed ? T.success : T.warning}`,
                      display: "flex",
                      flexDirection: "column",
                      gap: 8
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <strong style={{ fontSize: 13, color: drillEval.passed ? T.success : T.warning }}>
                        {drillEval.passed ? "Mastery Criteria Met" : "Keep Refining"}
                      </strong>
                      <span style={{ fontSize: 16, fontWeight: 800, color: T.textPrimary }}>
                        {drillEval.score}/100
                      </span>
                    </div>

                    <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.45 }}>
                      {drillEval.coachFeedback}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                      {drillEval.rubricHits.map((h, i) => (
                        <div key={i} style={{ fontSize: 11, display: "flex", alignItems: "flex-start", gap: 5, color: T.textPrimary }}>
                          {h.met ? (
                            <CheckCircle2 size={13} style={{ color: T.success, marginTop: 1, flexShrink: 0 }} />
                          ) : (
                            <XCircle size={13} style={{ color: T.warning, marginTop: 1, flexShrink: 0 }} />
                          )}
                          <span>
                            <strong>{h.criterion}:</strong> {h.note}
                          </span>
                        </div>
                      ))}
                    </div>

                    {drillEval.improvedExample && (
                      <div style={{ fontSize: 11, color: T.accent, backgroundColor: T.accentSoft, padding: "7px 10px", borderRadius: 6 }}>
                        <strong>Coach Model Rewrite:</strong> &quot;{drillEval.improvedExample}&quot;
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
