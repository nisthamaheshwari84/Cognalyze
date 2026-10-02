"use client";

import React, { useState } from "react";
import {
  ATSValidationResult,
  DesignSettings,
  ResumeBullet,
  ResumeDocument,
  ResumeSection,
  TemplateId,
  FontFamily,
  FontSize,
  SpacingScale,
  AccentColor,
  PaperSize,
} from "@/lib/resume/types";
import { RESUME_TEMPLATES } from "@/lib/resume/templates";
import { proposeBulletRewrite, RewriteProposal, RewriteAction } from "@/lib/resume/ai-editor";
import { calculatePageUtilization, optimizeResumeBalance } from "@/lib/resume/page-fitting-engine";

interface RightInspectorPanelProps {
  document: ResumeDocument;
  onUpdateDocument: (doc: ResumeDocument, isSignificant: boolean) => void;
  selectedBullet: ResumeBullet | null;
  selectedSection: ResumeSection | null;
  atsResult: ATSValidationResult;
  onApplyBulletRewrite: (bulletId: string, newText: string) => void;
  initialTab?: InspectorTab;
  onClose?: () => void;
}

export type InspectorTab = "ai" | "ats" | "jd" | "design";

export const RightInspectorPanel: React.FC<RightInspectorPanelProps> = ({
  document: doc,
  onUpdateDocument,
  selectedBullet,
  selectedSection,
  atsResult,
  onApplyBulletRewrite,
  initialTab = "ai",
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<InspectorTab>(initialTab);
  const [activeProposal, setActiveProposal] = useState<RewriteProposal | null>(null);
  const [jdInput, setJdInput] = useState(doc.targetJdText || "");
  const [customPrompt, setCustomPrompt] = useState("");

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Page budget calculation for 85-95% balance
  const budget = calculatePageUtilization(doc);

  // Handle triggering an AI rewrite proposal
  const handleTriggerRewrite = (action: RewriteAction, customText?: string) => {
    if (!selectedBullet) return;
    const proposal = proposeBulletRewrite(selectedBullet, action, doc.targetRole, customText);
    setActiveProposal(proposal);
  };

  // Commit proposal
  const handleCommitProposal = () => {
    if (!activeProposal || !selectedBullet) return;
    onApplyBulletRewrite(selectedBullet.id, activeProposal.suggestedText);
    setActiveProposal(null);
  };

  // Update design setting helper
  const handleUpdateSetting = <K extends keyof DesignSettings>(key: K, value: DesignSettings[K]) => {
    const updated: ResumeDocument = {
      ...doc,
      settings: {
        ...doc.settings,
        [key]: value,
      },
    };
    onUpdateDocument(updated, false);
  };

  return (
    <aside
      style={{
        width: 380,
        backgroundColor: "#FFFFFF",
        borderLeft: "1px solid #E4E1DA",
        color: "#17191C",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        height: "100%",
        userSelect: "none",
        zIndex: 50,
      }}
    >
      {/* Header & Tab Navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          borderBottom: "1px solid #E4E1DA",
          backgroundColor: "#F6F5F1",
          paddingRight: 8,
        }}
      >
        <div style={{ display: "flex", flex: 1 }}>
          {(
            [
              { id: "ai", label: "AI Polish", icon: "✨" },
              { id: "ats", label: "ATS Check", icon: "📊" },
              { id: "jd", label: "JD Match", icon: "🎯" },
              { id: "design", label: "Design", icon: "🎨" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              style={{
                flex: 1,
                padding: "10px 4px",
                background: activeTab === t.id ? "#FFFFFF" : "transparent",
                border: "none",
                borderBottom: activeTab === t.id ? "2px solid #356AE6" : "2px solid transparent",
                color: activeTab === t.id ? "#162A43" : "#667085",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 2,
                transition: "all 0.1s ease",
              }}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
            </button>
          ))}
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            title="Close tools panel"
            style={{
              background: "transparent",
              border: "none",
              color: "#667085",
              fontSize: 16,
              cursor: "pointer",
              padding: "6px 10px",
              borderRadius: 6,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Tab Contents */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>

        {/* ========================================================= */}
        {/* TAB 2: TRANSACTIONAL AI EDITING */}
        {/* ========================================================= */}
        {activeTab === "ai" && (
          <div>
            <div style={{ marginBottom: 12 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, margin: 0, color: "#162A43", textTransform: "uppercase" }}>
                AI Bullet Polish
              </h4>
              <p style={{ fontSize: 11, color: "#667085", margin: "2px 0 0" }}>
                Strictly evidence-bound. Never invents metrics, titles, or unverified tools.
              </p>
            </div>

            {selectedBullet ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ fontSize: 11, color: "#667085" }}>Current text:</div>
                <div style={{ backgroundColor: "#F6F5F1", padding: 10, borderRadius: 6, fontSize: 12, border: "1px solid #E4E1DA", color: "#17191C" }}>
                  &ldquo;{selectedBullet.text}&rdquo;
                </div>

                <div style={{ fontSize: 11, color: "#667085", marginTop: 4 }}>Select improvement:</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => handleTriggerRewrite("concise")}
                    style={{
                      padding: "8px",
                      borderRadius: 6,
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E4E1DA",
                      color: "#162A43",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ✂ Make Concise
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTriggerRewrite("technical")}
                    style={{
                      padding: "8px",
                      borderRadius: 6,
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E4E1DA",
                      color: "#162A43",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    ⚙ Make Technical
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTriggerRewrite("clarity")}
                    style={{
                      padding: "8px",
                      borderRadius: 6,
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E4E1DA",
                      color: "#162A43",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    🎯 Add Clarity
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTriggerRewrite("jd_tailor")}
                    style={{
                      padding: "8px",
                      borderRadius: 6,
                      backgroundColor: "#FFFFFF",
                      border: "1px solid #E4E1DA",
                      color: "#162A43",
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: "pointer",
                    }}
                  >
                    📌 Tailor to JD
                  </button>
                </div>

                {/* Custom AI Instruction */}
                <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                  <div style={{ fontSize: 11, color: "#667085" }}>Or custom AI instruction:</div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      type="text"
                      value={customPrompt}
                      onChange={(e) => setCustomPrompt(e.target.value)}
                      placeholder="e.g. Make this more ATS-friendly"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && customPrompt.trim()) {
                          handleTriggerRewrite("custom", customPrompt.trim());
                        }
                      }}
                      style={{
                        flex: 1,
                        padding: "7px 10px",
                        backgroundColor: "#FFFFFF",
                        border: "1px solid #E4E1DA",
                        borderRadius: 6,
                        color: "#17191C",
                        fontSize: 12,
                        outline: "none",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => customPrompt.trim() && handleTriggerRewrite("custom", customPrompt.trim())}
                      disabled={!customPrompt.trim()}
                      style={{
                        padding: "7px 12px",
                        backgroundColor: customPrompt.trim() ? "#356AE6" : "#F6F5F1",
                        color: customPrompt.trim() ? "white" : "#98A2B3",
                        border: "none",
                        borderRadius: 6,
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: customPrompt.trim() ? "pointer" : "default",
                      }}
                    >
                      Rewrite
                    </button>
                  </div>
                </div>

                {/* Proposed Rewrite Card */}
                {activeProposal && (
                  <div
                    style={{
                      marginTop: 12,
                      padding: 12,
                      backgroundColor: "#EFF4FE",
                      border: "1px solid #D2E0FB",
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#356AE6", marginBottom: 6 }}>
                      PROPOSED REWRITE ({activeProposal.action.toUpperCase()})
                    </div>
                    <div style={{ fontSize: 12, color: "#162A43", lineHeight: "1.4", marginBottom: 8 }}>
                      &ldquo;{activeProposal.suggestedText}&rdquo;
                    </div>
                    <div style={{ fontSize: 11, color: "#667085", fontStyle: "italic", marginBottom: 12 }}>
                      Rationale: {activeProposal.rationale}
                    </div>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={handleCommitProposal}
                        style={{
                          flex: 1,
                          padding: "6px 12px",
                          backgroundColor: "#2E7D5B",
                          color: "white",
                          border: "none",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        ✓ Apply Rewrite
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveProposal(null)}
                        style={{
                          padding: "6px 12px",
                          backgroundColor: "#FFFFFF",
                          color: "#162A43",
                          border: "1px solid #E4E1DA",
                          borderRadius: 6,
                          fontSize: 11,
                          cursor: "pointer",
                        }}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px 16px", color: "#667085", fontSize: 12 }}>
                Select a resume bullet to review AI suggestions.
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: JD MATCH */}
        {/* ========================================================= */}
        {activeTab === "jd" && (
          <div>
            <div style={{ marginBottom: 12 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, margin: 0, color: "#162A43", textTransform: "uppercase" }}>
                Target Job Description
              </h4>
              <p style={{ fontSize: 11, color: "#667085", margin: "2px 0 0" }}>
                Match candidate evidence against target job expectations.
              </p>
            </div>

            <textarea
              rows={6}
              value={jdInput}
              onChange={(e) => setJdInput(e.target.value)}
              placeholder="Paste job description text here (e.g. Senior Backend Engineer - Python, FastAPI, Docker, Microservices)..."
              style={{
                width: "100%",
                padding: "8px 10px",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E4E1DA",
                borderRadius: 6,
                color: "#17191C",
                fontSize: 12,
                fontFamily: "inherit",
                resize: "vertical",
                boxSizing: "border-box",
                outline: "none",
              }}
            />

            <button
              type="button"
              onClick={() => {
                onUpdateDocument({ ...doc, targetJdText: jdInput }, true);
              }}
              style={{
                width: "100%",
                marginTop: 8,
                padding: "8px",
                backgroundColor: "#356AE6",
                color: "white",
                border: "none",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Update Semantic Matching
            </button>

            {/* Match Summary */}
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", marginBottom: 6 }}>
                Alignment Summary
              </div>
              <div style={{ backgroundColor: "#F6F5F1", padding: 12, borderRadius: 6, border: "1px solid #E4E1DA" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: "#162A43" }}>Match Score</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: "#356AE6" }}>
                    {atsResult.jdAlignmentScore}%
                  </span>
                </div>
                <div style={{ fontSize: 11, color: "#667085", marginTop: 6 }}>
                  {atsResult.checks.find((c) => c.id === "jd-match-audit")?.description ||
                    "Enter a target job description to audit requirements against candidate evidence."}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: ATS CHECK */}
        {/* ========================================================= */}
        {activeTab === "ats" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, margin: 0, color: "#162A43", textTransform: "uppercase" }}>
                ATS Diagnostics
              </h4>
              <span style={{ fontSize: 16, fontWeight: 900, color: "#356AE6" }}>
                {atsResult.overallScore}/100
              </span>
            </div>

            {/* Sub-Scores Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
              <div style={{ backgroundColor: "#F6F5F1", padding: 8, borderRadius: 6, border: "1px solid #E4E1DA" }}>
                <div style={{ fontSize: 10, color: "#667085" }}>Evidence Integrity</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: atsResult.evidenceIntegrityScore === 100 ? "#2E7D5B" : "#B7791F" }}>
                  {atsResult.evidenceIntegrityScore}%
                </div>
              </div>
              <div style={{ backgroundColor: "#F6F5F1", padding: 8, borderRadius: 6, border: "1px solid #E4E1DA" }}>
                <div style={{ fontSize: 10, color: "#667085" }}>ATS Structure</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#356AE6" }}>
                  {atsResult.atsStructureScore}%
                </div>
              </div>
              <div style={{ backgroundColor: "#F6F5F1", padding: 8, borderRadius: 6, border: "1px solid #E4E1DA" }}>
                <div style={{ fontSize: 10, color: "#667085" }}>Action Verbs</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#356AE6" }}>
                  {atsResult.readabilityScore}%
                </div>
              </div>
              <div style={{ backgroundColor: "#F6F5F1", padding: 8, borderRadius: 6, border: "1px solid #E4E1DA" }}>
                <div style={{ fontSize: 10, color: "#667085" }}>Formatting</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#356AE6" }}>
                  {atsResult.formattingScore}%
                </div>
              </div>
            </div>

            {/* Checks list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {atsResult.checks.map((c) => (
                <div
                  key={c.id}
                  style={{
                    backgroundColor: c.status === "PASSED" ? "#EAF4EE" : c.status === "WARNING" ? "#FEF7ED" : "#FDF2F2",
                    padding: "10px 12px",
                    borderRadius: 6,
                    border: `1px solid ${
                      c.status === "PASSED"
                        ? "#C8E4D3"
                        : c.status === "WARNING"
                        ? "#F8D8A7"
                        : "#F8C8C8"
                    }`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, fontWeight: 700 }}>
                    <span>{c.status === "PASSED" ? "✓" : c.status === "WARNING" ? "⚠" : "✕"}</span>
                    <span
                      style={{
                        color:
                          c.status === "PASSED"
                            ? "#2E7D5B"
                            : c.status === "WARNING"
                            ? "#B7791F"
                            : "#C24141",
                      }}
                    >
                      {c.title}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "#667085", marginTop: 4, lineHeight: "1.3" }}>
                    {c.description}
                  </div>
                  {c.remediation && (
                    <div style={{ fontSize: 10, color: "#356AE6", marginTop: 4 }}>
                      Fix: {c.remediation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: DESIGN & TOKENS */}
        {/* ========================================================= */}
        {activeTab === "design" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 10px 0", color: "#162A43", textTransform: "uppercase" }}>
                10 Layout Templates
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {RESUME_TEMPLATES.map((tmpl) => {
                  const isCurrent = doc.settings.template === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => handleUpdateSetting("template", tmpl.id)}
                      style={{
                        textAlign: "left",
                        padding: "8px 10px",
                        backgroundColor: isCurrent ? "#EFF4FE" : "#FFFFFF",
                        border: isCurrent ? "1px solid #356AE6" : "1px solid #E4E1DA",
                        borderRadius: 6,
                        cursor: "pointer",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: isCurrent ? "#356AE6" : "#162A43" }}>
                          {tmpl.name}
                        </div>
                        <div style={{ fontSize: 10, color: "#667085" }}>{tmpl.category} • {tmpl.atsCompatibility}</div>
                      </div>
                      {isCurrent && <span style={{ fontSize: 12, color: "#356AE6" }}>✓ Active</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Page Utilization & Vertical Rhythm Budget */}
            <div
              style={{
                backgroundColor: "#F6F5F1",
                padding: 12,
                borderRadius: 8,
                border: "1px solid #E4E1DA",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>
                  Page Utilization
                </span>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 800,
                    color: budget.isBalanced ? "#2E7D5B" : budget.utilizationPercent < 80 ? "#B7791F" : "#C24141",
                  }}
                >
                  {budget.utilizationPercent}% {budget.isBalanced ? "(Optimal Overleaf Layout)" : ""}
                </span>
              </div>

              {/* Progress bar */}
              <div style={{ width: "100%", height: 6, backgroundColor: "#E4E1DA", borderRadius: 3, overflow: "hidden", marginBottom: 8 }}>
                <div
                  style={{
                    width: `${Math.min(100, budget.utilizationPercent)}%`,
                    height: "100%",
                    backgroundColor: budget.isBalanced ? "#2E7D5B" : budget.utilizationPercent < 80 ? "#B7791F" : "#C24141",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>

              <div style={{ fontSize: 11, color: "#667085", lineHeight: "1.4", marginBottom: 10 }}>
                {budget.recommendation}
              </div>

              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  onClick={() => {
                    const balanced = optimizeResumeBalance(doc);
                    onUpdateDocument(balanced, true);
                  }}
                  style={{
                    flex: 1,
                    padding: "5px 8px",
                    backgroundColor: "#356AE6",
                    border: "none",
                    color: "#FFFFFF",
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  ⚡ Auto-Balance Page
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const resetDoc: ResumeDocument = {
                      ...doc,
                      settings: {
                        template: "ats-classic",
                        paperSize: "A4",
                        fontFamily: "Inter",
                        fontSize: "medium",
                        lineHeight: "normal",
                        sectionSpacing: "normal",
                        margins: "normal",
                        accentColor: "black",
                        singlePageMode: true,
                      },
                    };
                    onUpdateDocument(resetDoc, true);
                  }}
                  style={{
                    flex: 1,
                    padding: "5px 8px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E4E1DA",
                    color: "#162A43",
                    borderRadius: 6,
                    fontSize: 10,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  ↺ Reset to Recommended
                </button>
              </div>
            </div>

            {/* Typography */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", marginBottom: 6 }}>
                Typography Font
              </div>
              <select
                value={doc.settings.fontFamily}
                onChange={(e) => handleUpdateSetting("fontFamily", e.target.value as FontFamily)}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E4E1DA",
                  borderRadius: 6,
                  color: "#162A43",
                  fontSize: 12,
                }}
              >
                {(["Inter", "IBM Plex Sans", "Source Sans 3", "Lato", "Georgia", "Times New Roman"] as const).map(
                  (f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Spacing Controls */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase", marginBottom: 4 }}>
                  Font Size
                </div>
                <select
                  value={doc.settings.fontSize}
                  onChange={(e) => handleUpdateSetting("fontSize", e.target.value as FontSize)}
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E4E1DA",
                    borderRadius: 6,
                    color: "#162A43",
                    fontSize: 12,
                  }}
                >
                  <option value="small">Compact (10pt)</option>
                  <option value="medium">Standard (11pt)</option>
                  <option value="large">Spacious (12pt)</option>
                </select>
              </div>

              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase", marginBottom: 4 }}>
                  Section Spacing
                </div>
                <select
                  value={doc.settings.sectionSpacing}
                  onChange={(e) => handleUpdateSetting("sectionSpacing", e.target.value as SpacingScale)}
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E4E1DA",
                    borderRadius: 6,
                    color: "#162A43",
                    fontSize: 12,
                  }}
                >
                  <option value="compact">Compact</option>
                  <option value="normal">Normal</option>
                  <option value="spacious">Spacious</option>
                </select>
              </div>
            </div>

            {/* Paper Size & Single Page Toggle */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase", marginBottom: 4 }}>
                  Paper Size
                </div>
                <select
                  value={doc.settings.paperSize}
                  onChange={(e) => handleUpdateSetting("paperSize", e.target.value as PaperSize)}
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E4E1DA",
                    borderRadius: 6,
                    color: "#162A43",
                    fontSize: 12,
                  }}
                >
                  <option value="A4">A4 (210 x 297mm)</option>
                  <option value="Letter">Letter (8.5 x 11in)</option>
                </select>
              </div>

              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase", marginBottom: 4 }}>
                  Accent Color
                </div>
                <select
                  value={doc.settings.accentColor}
                  onChange={(e) => handleUpdateSetting("accentColor", e.target.value as AccentColor)}
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid #E4E1DA",
                    borderRadius: 6,
                    color: "#162A43",
                    fontSize: 12,
                  }}
                >
                  {(["black", "charcoal", "navy", "blue", "green", "burgundy", "purple", "neutral"] as const).map(
                    (c) => (
                      <option key={c} value={c}>
                        {c.charAt(0).toUpperCase() + c.slice(1)}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
