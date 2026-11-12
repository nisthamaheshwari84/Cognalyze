"use client";

import React, { useState } from "react";
import { TargetRoleSlug, TargetRoleProfile } from "@/lib/skills/ai-data/types";
import { TARGET_ROLE_PROFILES } from "@/lib/skills/ai-data/roles";
import {
  BaselineDiagnosticQuestion,
  BASELINE_DIAGNOSTIC_BANK,
  BaselineAssessmentResult
} from "@/lib/skills/ai-data/baseline-assessment-engine";
import { CandidateOnboardingProfile } from "@/lib/skills/ai-data/store";

interface CareerOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId: string;
  initialRole?: TargetRoleSlug;
  onCompleted: (onboarding: CandidateOnboardingProfile, baseline: BaselineAssessmentResult | null) => void;
  isDark?: boolean;
}

export default function CareerOnboardingModal({
  isOpen,
  onClose,
  candidateId,
  initialRole = "ai_engineer",
  onCompleted,
  isDark = false
}: CareerOnboardingModalProps) {
  const [step, setStep] = useState<"role" | "preferences" | "diagnostic" | "results">("role");
  const [selectedRole, setSelectedRole] = useState<TargetRoleSlug>(initialRole);
  const [secondaryRoles, setSecondaryRoles] = useState<TargetRoleSlug[]>([]);
  const [startingLevel, setStartingLevel] = useState<"beginner" | "intermediate" | "advanced">("intermediate");
  const [weeklyHours, setWeeklyHours] = useState<number>(10);
  const [languagePreference, setLanguagePreference] = useState<"english" | "hinglish">("english");
  const [learningStyle, setLearningStyle] = useState<"hands_on" | "visual" | "systematic">("hands_on");

  // Diagnostic State
  const [diagnosticResponses, setDiagnosticResponses] = useState<Record<string, string>>({});
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);
  const [isSubmittingDiagnostic, setIsSubmittingDiagnostic] = useState<boolean>(false);
  const [baselineResult, setBaselineResult] = useState<BaselineAssessmentResult | null>(null);

  if (!isOpen) return null;

  const roleList = Object.values(TARGET_ROLE_PROFILES);
  const activeRoleProfile: TargetRoleProfile = TARGET_ROLE_PROFILES[selectedRole] || TARGET_ROLE_PROFILES.ai_engineer;
  const diagnosticQuestions = BASELINE_DIAGNOSTIC_BANK;
  const currentQ = diagnosticQuestions[activeQuestionIdx];

  const handleToggleSecondaryRole = (role: TargetRoleSlug) => {
    if (role === selectedRole) return;
    setSecondaryRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSelectDiagnosticOption = (questionId: string, optionId: string) => {
    setDiagnosticResponses((prev) => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleFinishWithoutDiagnostic = async () => {
    try {
      const res = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_onboarding",
          candidateId,
          profile: {
            primaryRole: selectedRole,
            secondaryRoles,
            startingLevel,
            weeklyHours,
            languagePreference,
            learningStyle
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        onCompleted(data.profile, null);
        onClose();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitDiagnostic = async () => {
    setIsSubmittingDiagnostic(true);
    try {
      // 1. Submit diagnostic responses
      const responsesPayload = Object.entries(diagnosticResponses).map(([qId, optId]) => ({
        questionId: qId,
        selectedOptionId: optId,
        timeSpentSeconds: 25
      }));

      const diagRes = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_baseline_assessment",
          candidateId,
          targetRole: selectedRole,
          startingLevel,
          responses: responsesPayload
        })
      });
      const diagData = await diagRes.json();

      // 2. Save onboarding profile
      const onbRes = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_onboarding",
          candidateId,
          profile: {
            primaryRole: selectedRole,
            secondaryRoles,
            startingLevel,
            weeklyHours,
            languagePreference,
            learningStyle
          }
        })
      });
      const onbData = await onbRes.json();

      if (diagData.success && diagData.evaluation) {
        setBaselineResult(diagData.evaluation);
        setStep("results");
        if (onbData.success) {
          onCompleted(onbData.profile, diagData.evaluation);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingDiagnostic(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(4px)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 820,
          maxHeight: "90vh",
          backgroundColor: isDark ? "#0D1728" : "#FFFFFF",
          border: `1px solid ${isDark ? "#1E2A3B" : "#E4E1DA"}`,
          borderRadius: 12,
          boxShadow: "0 20px 40px rgba(0,0,0,0.25)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: `1px solid ${isDark ? "#1E2A3B" : "#E4E1DA"}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: isDark ? "#0A101D" : "#FAF9F6"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>🚀</span>
              <h2 style={{ fontSize: 17, fontWeight: 800, margin: 0, color: isDark ? "#FFFFFF" : "#162A43" }}>
                AI &amp; Data Arena · Career Roadmap Onboarding
              </h2>
            </div>
            <p style={{ margin: "2px 0 0", fontSize: 12, color: isDark ? "#8FA0B8" : "#667085" }}>
              Personalize your curriculum, benchmark your baseline, and unlock career-aligned prerequisites.
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              color: isDark ? "#8FA0B8" : "#667085",
              fontSize: 18,
              cursor: "pointer"
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          {/* STEP 1: SELECT PRIMARY CAREER GOAL */}
          {step === "role" && (
            <div>
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", textTransform: "uppercase" }}>
                  Step 1 of 3: Target Career Role
                </span>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: isDark ? "#FFFFFF" : "#162A43", margin: "2px 0 0" }}>
                  What high-impact role are you preparing for?
                </h3>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12, marginBottom: 20 }}>
                {roleList.map((r) => {
                  const isSelected = selectedRole === r.slug;
                  return (
                    <div
                      key={r.slug}
                      onClick={() => setSelectedRole(r.slug)}
                      style={{
                        padding: "14px 16px",
                        borderRadius: 8,
                        border: isSelected ? "2px solid #356AE6" : `1px solid ${isDark ? "#1E2A3B" : "#E4E1DA"}`,
                        backgroundColor: isSelected ? (isDark ? "#16253C" : "#EFF4FE") : (isDark ? "#0A101D" : "#FAF9F6"),
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontSize: 20 }}>{r.icon}</span>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 6px",
                            borderRadius: 4,
                            backgroundColor: isSelected ? "#356AE6" : isDark ? "#1E2A3B" : "#E4E1DA",
                            color: isSelected ? "#FFFFFF" : isDark ? "#CBD5E1" : "#475569"
                          }}
                        >
                          {r.badge}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: isDark ? "#FFFFFF" : "#162A43" }}>{r.title}</div>
                      <p style={{ fontSize: 11, color: isDark ? "#8FA0B8" : "#667085", margin: "4px 0 8px", lineHeight: 1.4 }}>
                        {r.summary.substring(0, 85)}...
                      </p>
                      <div style={{ fontSize: 10, color: "#356AE6", fontWeight: 700 }}>
                        Tier: {r.salaryTier.split("/")[0]}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Selected Role Deep-Dive Card */}
              <div
                style={{
                  padding: 16,
                  borderRadius: 8,
                  backgroundColor: isDark ? "#0A101D" : "#FAF9F6",
                  border: `1px solid ${isDark ? "#1E2A3B" : "#E4E1DA"}`
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", textTransform: "uppercase", marginBottom: 4 }}>
                  Selected Career Profile: {activeRoleProfile.title}
                </div>
                <div style={{ fontSize: 12, color: isDark ? "#CBD5E1" : "#17191C", marginBottom: 8 }}>
                  Typical Hiring Companies: <strong>{activeRoleProfile.typicalCompanies.join(", ")}</strong>
                </div>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {activeRoleProfile.requiredSkills.map((sk) => (
                    <span
                      key={sk}
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "3px 8px",
                        borderRadius: 4,
                        backgroundColor: isDark ? "#16253C" : "#EFF4FE",
                        color: "#356AE6",
                        border: "1px solid #D2E0FB"
                      }}
                    >
                      ✓ {sk.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: PREFERENCES & STARTING LEVEL */}
          {step === "preferences" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", textTransform: "uppercase" }}>
                  Step 2 of 3: Personalized Learning Configuration
                </span>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: isDark ? "#FFFFFF" : "#162A43", margin: "2px 0 0" }}>
                  Calibrate pace, starting level, and teacher explanations
                </h3>
              </div>

              {/* Starting Experience Level */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: isDark ? "#CBD5E1" : "#162A43", display: "block", marginBottom: 6 }}>
                  Current Technical Experience Level:
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                  {[
                    { id: "beginner", label: "Beginner / Transitioning", desc: "Start from foundational Python & basic data concepts." },
                    { id: "intermediate", label: "Intermediate Engineer", desc: "Familiar with syntax; focus on real systems & ML/RAG depth." },
                    { id: "advanced", label: "Advanced / Upskilling", desc: "Fast-track to production pipelines, agent graphs & evals." }
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      onClick={() => setStartingLevel(lvl.id as any)}
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        textAlign: "left",
                        border: startingLevel === lvl.id ? "2px solid #356AE6" : `1px solid ${isDark ? "#1E2A3B" : "#E4E1DA"}`,
                        backgroundColor: startingLevel === lvl.id ? (isDark ? "#16253C" : "#EFF4FE") : "transparent",
                        cursor: "pointer"
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 800, color: startingLevel === lvl.id ? "#356AE6" : isDark ? "#FFFFFF" : "#162A43" }}>
                        {lvl.label}
                      </div>
                      <div style={{ fontSize: 10.5, color: isDark ? "#8FA0B8" : "#667085", marginTop: 4 }}>{lvl.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Weekly Time Commitment */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: isDark ? "#CBD5E1" : "#162A43", display: "block", marginBottom: 6 }}>
                  Weekly Dedicated Study Time:
                </label>
                <div style={{ display: "flex", gap: 10 }}>
                  {[5, 10, 15, 20].map((hrs) => (
                    <button
                      key={hrs}
                      onClick={() => setWeeklyHours(hrs)}
                      style={{
                        flex: 1,
                        padding: "8px 12px",
                        borderRadius: 6,
                        border: weeklyHours === hrs ? "2px solid #356AE6" : `1px solid ${isDark ? "#1E2A3B" : "#E4E1DA"}`,
                        backgroundColor: weeklyHours === hrs ? (isDark ? "#16253C" : "#EFF4FE") : "transparent",
                        color: weeklyHours === hrs ? "#356AE6" : isDark ? "#CBD5E1" : "#17191C",
                        fontWeight: 700,
                        fontSize: 12,
                        cursor: "pointer"
                      }}
                    >
                      {hrs} Hours / Week
                    </button>
                  ))}
                </div>
              </div>

              {/* Language Preference */}
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: isDark ? "#CBD5E1" : "#162A43", display: "block", marginBottom: 6 }}>
                  Preferred AI Teacher Explanation Language:
                </label>
                <div style={{ display: "flex", gap: 10 }}>
                  {[
                    { id: "english", label: "English (Technical Standard)", desc: "Formal engineering documentation and standard terminology." },
                    { id: "hinglish", label: "Hinglish (Intuitive Blended)", desc: "Conversational everyday analogies blended with technical terms." }
                  ].map((lang) => (
                    <button
                      key={lang.id}
                      onClick={() => setLanguagePreference(lang.id as any)}
                      style={{
                        flex: 1,
                        padding: 12,
                        borderRadius: 8,
                        textAlign: "left",
                        border: languagePreference === lang.id ? "2px solid #356AE6" : `1px solid ${isDark ? "#1E2A3B" : "#E4E1DA"}`,
                        backgroundColor: languagePreference === lang.id ? (isDark ? "#16253C" : "#EFF4FE") : "transparent",
                        cursor: "pointer"
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 800, color: languagePreference === lang.id ? "#356AE6" : isDark ? "#FFFFFF" : "#162A43" }}>
                        {lang.label}
                      </div>
                      <div style={{ fontSize: 10.5, color: isDark ? "#8FA0B8" : "#667085", marginTop: 2 }}>{lang.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: BASELINE DIAGNOSTIC SCREENER */}
          {step === "diagnostic" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", textTransform: "uppercase" }}>
                    Baseline Diagnostic ({activeQuestionIdx + 1} / {diagnosticQuestions.length})
                  </span>
                  <h3 style={{ fontSize: 15, fontWeight: 800, color: isDark ? "#FFFFFF" : "#162A43", margin: "2px 0 0" }}>
                    {currentQ.skillName}: {currentQ.difficulty.toUpperCase()}
                  </h3>
                </div>
                <div style={{ fontSize: 11, color: isDark ? "#8FA0B8" : "#667085" }}>
                  Discipline: <strong>{currentQ.discipline}</strong>
                </div>
              </div>

              <div
                style={{
                  padding: 16,
                  borderRadius: 8,
                  backgroundColor: isDark ? "#0A101D" : "#FAF9F6",
                  border: `1px solid ${isDark ? "#1E2A3B" : "#E4E1DA"}`,
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: isDark ? "#FFFFFF" : "#17191C"
                }}
              >
                {currentQ.prompt}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {currentQ.options.map((opt) => {
                  const isSelected = diagnosticResponses[currentQ.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectDiagnosticOption(currentQ.id, opt.id)}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 6,
                        textAlign: "left",
                        border: isSelected ? "2px solid #356AE6" : `1px solid ${isDark ? "#1E2A3B" : "#E4E1DA"}`,
                        backgroundColor: isSelected ? (isDark ? "#16253C" : "#EFF4FE") : (isDark ? "#0A101D" : "#FFFFFF"),
                        color: isSelected ? "#356AE6" : isDark ? "#CBD5E1" : "#17191C",
                        fontWeight: isSelected ? 700 : 500,
                        fontSize: 12,
                        lineHeight: 1.4,
                        cursor: "pointer"
                      }}
                    >
                      <strong>{opt.id.toUpperCase()}.</strong> {opt.text}
                    </button>
                  );
                })}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                <button
                  disabled={activeQuestionIdx === 0}
                  onClick={() => setActiveQuestionIdx((prev) => Math.max(0, prev - 1))}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 6,
                    border: `1px solid ${isDark ? "#1E2A3B" : "#E4E1DA"}`,
                    background: "none",
                    color: isDark ? "#8FA0B8" : "#667085",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: activeQuestionIdx === 0 ? "not-allowed" : "pointer"
                  }}
                >
                  ◀ Previous
                </button>

                {activeQuestionIdx < diagnosticQuestions.length - 1 ? (
                  <button
                    onClick={() => setActiveQuestionIdx((prev) => prev + 1)}
                    style={{
                      padding: "6px 16px",
                      borderRadius: 6,
                      backgroundColor: "#356AE6",
                      color: "#FFFFFF",
                      border: "none",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Next Question ▶
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitDiagnostic}
                    disabled={isSubmittingDiagnostic || Object.keys(diagnosticResponses).length === 0}
                    style={{
                      padding: "8px 18px",
                      borderRadius: 6,
                      backgroundColor: "#10B981",
                      color: "#FFFFFF",
                      border: "none",
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: isSubmittingDiagnostic ? "not-allowed" : "pointer"
                    }}
                  >
                    {isSubmittingDiagnostic ? "Evaluating Baseline..." : "✓ Submit & Benchmark"}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: DIAGNOSTIC RESULTS & EXEMPTIONS */}
          {step === "results" && baselineResult && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ textAlign: "center", padding: "10px 0" }}>
                <span style={{ fontSize: 32 }}>🎯</span>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: isDark ? "#FFFFFF" : "#162A43", margin: "4px 0" }}>
                  Baseline Verified: {baselineResult.overallScorePercent}% Score
                </h3>
                <p style={{ fontSize: 12, color: isDark ? "#8FA0B8" : "#667085", maxWidth: 640, margin: "0 auto" }}>
                  {baselineResult.diagnosticSummary}
                </p>
              </div>

              {/* Exemptions Granted */}
              <div
                style={{
                  padding: 14,
                  borderRadius: 8,
                  backgroundColor: isDark ? "#162E20" : "#EAF4EE",
                  border: "1px solid #C8E4D3"
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, color: "#2E7D5B", textTransform: "uppercase", marginBottom: 6 }}>
                  ✓ Prerequisite Exemptions Granted ({baselineResult.exemptionsGranted.length})
                </div>
                {baselineResult.exemptionsGranted.length > 0 ? (
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {baselineResult.exemptionsGranted.map((sk) => (
                      <span
                        key={sk}
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 4,
                          backgroundColor: "#FFFFFF",
                          color: "#2E7D5B",
                          border: "1px solid #C8E4D3"
                        }}
                      >
                        ⚡ Exempt: {sk.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 11, color: "#667085" }}>
                    No exemptions granted. You will complete foundational topics sequentially to build complete competency.
                  </div>
                )}
              </div>

              {/* Recommended Starting Stage */}
              <div
                style={{
                  padding: 14,
                  borderRadius: 8,
                  backgroundColor: isDark ? "#0A101D" : "#FAF9F6",
                  border: `1px solid ${isDark ? "#1E2A3B" : "#E4E1DA"}`
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", textTransform: "uppercase", marginBottom: 4 }}>
                  Personalized Roadmap Progression
                </div>
                <div style={{ fontSize: 12, color: isDark ? "#FFFFFF" : "#162A43" }}>
                  Starting Stage: <strong>Stage {baselineResult.recommendedStartingStage}</strong>
                </div>
                <p style={{ fontSize: 11, color: isDark ? "#8FA0B8" : "#667085", margin: "4px 0 0" }}>
                  Foundational prerequisites have been automatically marked complete so you can jump straight to advanced applied engineering.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div
          style={{
            padding: "14px 24px",
            borderTop: `1px solid ${isDark ? "#1E2A3B" : "#E4E1DA"}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: isDark ? "#0A101D" : "#FAF9F6"
          }}
        >
          {step === "role" && (
            <>
              <button
                onClick={onClose}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  border: `1px solid ${isDark ? "#1E2A3B" : "#E4E1DA"}`,
                  background: "none",
                  color: isDark ? "#8FA0B8" : "#667085",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => setStep("preferences")}
                style={{
                  padding: "8px 18px",
                  borderRadius: 6,
                  backgroundColor: "#356AE6",
                  color: "#FFFFFF",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                Continue to Preferences →
              </button>
            </>
          )}

          {step === "preferences" && (
            <>
              <button
                onClick={() => setStep("role")}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  border: `1px solid ${isDark ? "#1E2A3B" : "#E4E1DA"}`,
                  background: "none",
                  color: isDark ? "#8FA0B8" : "#667085",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                ← Back
              </button>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={handleFinishWithoutDiagnostic}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 6,
                    border: `1px solid ${isDark ? "#1E2A3B" : "#E4E1DA"}`,
                    background: "none",
                    color: isDark ? "#CBD5E1" : "#17191C",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Skip Diagnostic &amp; Start
                </button>
                <button
                  onClick={() => setStep("diagnostic")}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 6,
                    backgroundColor: "#356AE6",
                    color: "#FFFFFF",
                    border: "none",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Take 5-Min Diagnostic Screener →
                </button>
              </div>
            </>
          )}

          {step === "diagnostic" && (
            <>
              <button
                onClick={() => setStep("preferences")}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  border: `1px solid ${isDark ? "#1E2A3B" : "#E4E1DA"}`,
                  background: "none",
                  color: isDark ? "#8FA0B8" : "#667085",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                ← Back to Preferences
              </button>
              <button
                onClick={handleFinishWithoutDiagnostic}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  border: `1px solid ${isDark ? "#1E2A3B" : "#E4E1DA"}`,
                  background: "none",
                  color: isDark ? "#8FA0B8" : "#667085",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Skip Remainder
              </button>
            </>
          )}

          {step === "results" && (
            <div style={{ width: "100%", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={onClose}
                style={{
                  padding: "8px 20px",
                  borderRadius: 6,
                  backgroundColor: "#356AE6",
                  color: "#FFFFFF",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                Launch My Personalized Roadmap 🚀
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

