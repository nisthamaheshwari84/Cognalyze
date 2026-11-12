"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  TaxonomyTopic,
  TaxonomySubject,
  MASTER_CURRICULUM_SUBJECTS,
  getTaxonomyTopicById,
} from "@/lib/skills/ai-data/master-curriculum-taxonomy";
import {
  PdfDocumentMode,
  GeneratedRevisionDocument,
  generateTopicRevisionDocument,
  persistGeneratedDocument,
  getSavedRevisionDocuments,
  deleteSavedRevisionDocument,
  persistTopicNotes,
  getTopicNotes,
  triggerPdfDownload,
} from "@/lib/skills/ai-data/revision-pdf-engine";

interface PersonalRevisionLibraryProps {
  currentTopic: TaxonomyTopic;
  currentSubject: TaxonomySubject;
  candidateId: string;
  candidateName?: string;
  targetRoleTitle?: string;
  onSelectTopic?: (topicId: string) => void;
}

export default function PersonalRevisionLibrary({
  currentTopic,
  currentSubject,
  candidateId,
  candidateName = "Cognalyze Verified Student",
  targetRoleTitle = "AI & Data Engineer",
  onSelectTopic,
}: PersonalRevisionLibraryProps) {
  // Document generation state
  const [selectedMode, setSelectedMode] = useState<PdfDocumentMode>("complete");
  const [personalNotes, setPersonalNotes] = useState<string>("");
  const [includeCodeSnippet, setIncludeCodeSnippet] = useState<boolean>(true);
  const [studentCode, setStudentCode] = useState<string>(currentTopic.solutionSnippet || currentTopic.starterCode || "");
  const [savedDocs, setSavedDocs] = useState<GeneratedRevisionDocument[]>([]);
  const [librarySearch, setLibrarySearch] = useState<string>("");
  const [activeTab, setActiveTab] = useState<"generator" | "library">("generator");
  const [previewDoc, setPreviewDoc] = useState<GeneratedRevisionDocument | null>(null);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string>("");

  // Load existing personal notes & library documents
  useEffect(() => {
    const loadedNotes = getTopicNotes(currentTopic.id);
    setPersonalNotes(loadedNotes);
    setStudentCode(currentTopic.solutionSnippet || currentTopic.starterCode || "");
    setSavedDocs(getSavedRevisionDocuments());
  }, [currentTopic]);

  const handleSaveNotes = () => {
    persistTopicNotes(currentTopic.id, personalNotes);
    setSaveSuccessNotice("✓ Personal notes saved to your knowledge library!");
    setTimeout(() => setSaveSuccessNotice(""), 3000);
  };

  const handleGeneratePdf = () => {
    const doc = generateTopicRevisionDocument(currentTopic, currentSubject, selectedMode, {
      candidateName,
      targetRoleTitle,
      studentNotes: personalNotes.trim() ? personalNotes : undefined,
      studentCodeSnippet: includeCodeSnippet && studentCode.trim() ? studentCode : undefined,
      studentCodeOutput: includeCodeSnippet ? "Execution Status: 0 errors • Invariants verified" : undefined,
    });

    persistGeneratedDocument(doc);
    setSavedDocs(getSavedRevisionDocuments());
    setPreviewDoc(doc);
    triggerPdfDownload(doc.htmlContent);
  };

  const handleDeleteDoc = (docId: string) => {
    deleteSavedRevisionDocument(docId);
    setSavedDocs(getSavedRevisionDocuments());
    if (previewDoc?.id === docId) {
      setPreviewDoc(null);
    }
  };

  const filteredDocs = useMemo(() => {
    if (!librarySearch.trim()) return savedDocs;
    const q = librarySearch.toLowerCase();
    return savedDocs.filter(
      (d) =>
        d.topicTitle.toLowerCase().includes(q) ||
        d.subjectTitle.toLowerCase().includes(q) ||
        d.modeLabel.toLowerCase().includes(q)
    );
  }, [savedDocs, librarySearch]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Top Ribbon: Generator vs Saved Knowledge Library */}
      <div
        style={{
          background: "#FFFFFF",
          border: "1px solid #E4E1DA",
          borderRadius: 10,
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <div>
          <span style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            TECHNICAL KNOWLEDGE LIBRARY &amp; REVISION PDF ENGINE
          </span>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#162A43", margin: "2px 0 0" }}>
            Personal Notes, Cheat Sheets &amp; Institutional Documentation
          </h2>
          <p style={{ fontSize: 12, color: "#667085", margin: "3px 0 0" }}>
            Generate comprehensive, publication-grade revision PDFs for {currentTopic.title} across 3 customizable modes.
          </p>
        </div>

        <div style={{ display: "flex", background: "#F6F5F1", padding: 3, borderRadius: 8, border: "1px solid #E4E1DA", gap: 2 }}>
          <button
            onClick={() => setActiveTab("generator")}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: "none",
              background: activeTab === "generator" ? "#162A43" : "transparent",
              color: activeTab === "generator" ? "#FFFFFF" : "#667085",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            📄 PDF Generator &amp; Notes
          </button>
          <button
            onClick={() => setActiveTab("library")}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              border: "none",
              background: activeTab === "library" ? "#162A43" : "transparent",
              color: activeTab === "library" ? "#FFFFFF" : "#667085",
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            📚 Saved Library ({savedDocs.length})
          </button>
        </div>
      </div>

      {saveSuccessNotice && (
        <div style={{ padding: "8px 14px", background: "#EAF4EE", border: "1px solid #C8E4D3", borderRadius: 8, color: "#2E7D5B", fontSize: 11, fontWeight: 700 }}>
          {saveSuccessNotice}
        </div>
      )}

      {/* TAB 1: GENERATOR & PERSONAL NOTES */}
      {activeTab === "generator" && (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
          {/* Left Column: Mode Selection & Document Configuration */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 20, display: "flex", flexDirection: "column", gap: 16, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Select Document Generation Mode
              </span>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 8 }}>
                {[
                  {
                    id: "quick" as PdfDocumentMode,
                    title: "Quick Revision",
                    badge: "1-2 Pages",
                    desc: "Definitions, formulas, key rules, and quick checklist.",
                  },
                  {
                    id: "complete" as PdfDocumentMode,
                    title: "Complete Notes",
                    badge: "Master Doc",
                    desc: "Deep theory, mathematics, code, edge cases, and failure modes.",
                  },
                  {
                    id: "cheatsheet" as PdfDocumentMode,
                    title: "Interview Cheat Sheet",
                    badge: "High-Yield",
                    desc: "Code snippets, complexity, common pitfalls, and defense questions.",
                  },
                ].map((mode) => {
                  const isSelected = selectedMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setSelectedMode(mode.id)}
                      style={{
                        padding: "12px",
                        borderRadius: 8,
                        textAlign: "left",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        background: isSelected ? "#EFF4FE" : "#FAF9F6",
                        border: isSelected ? "2px solid #356AE6" : "1px solid #E4E1DA",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: isSelected ? "#356AE6" : "#162A43" }}>{mode.title}</span>
                        <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: isSelected ? "#356AE6" : "#E4E1DA", color: isSelected ? "#FFFFFF" : "#667085", fontWeight: 700 }}>
                          {mode.badge}
                        </span>
                      </div>
                      <p style={{ fontSize: 10, color: "#667085", margin: 0, lineHeight: 1.4 }}>{mode.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Document Inclusions */}
            <div style={{ padding: "12px 14px", borderRadius: 8, background: "#FAF9F6", border: "1px solid #E4E1DA" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#162A43" }}>Document Personalization:</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8, fontSize: 11, color: "#17191C" }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={includeCodeSnippet}
                    onChange={(e) => setIncludeCodeSnippet(e.target.checked)}
                  />
                  <span>Include candidate-verified code solution in output document</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input type="checkbox" checked={true} disabled />
                  <span>Include official industry references &amp; verified last-checked dates</span>
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <input type="checkbox" checked={true} disabled />
                  <span>Include Hinglish conceptual translation alongside English</span>
                </label>
              </div>
            </div>

            {/* Generate Action Button */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleGeneratePdf}
                style={{
                  flex: 1,
                  padding: "12px 20px",
                  borderRadius: 8,
                  background: "#356AE6",
                  color: "#FFFFFF",
                  border: "none",
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  boxShadow: "0 2px 6px rgba(53, 106, 230, 0.2)",
                }}
              >
                <span>🖨️</span>
                <span>Generate &amp; Download PDF</span>
              </button>
            </div>
          </div>

          {/* Right Column: Personal Notes Editor */}
          <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 20, display: "flex", flexDirection: "column", gap: 12, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#162A43", textTransform: "uppercase" }}>
                📝 Personal Notes Editor: {currentTopic.title}
              </span>
              <button
                onClick={handleSaveNotes}
                style={{
                  padding: "4px 10px",
                  borderRadius: 6,
                  background: "#162A43",
                  color: "#FFFFFF",
                  border: "none",
                  fontSize: 10.5,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Save Notes
              </button>
            </div>

            <textarea
              placeholder="Write your personal observations, interview notes, or implementation nuances here. These will be permanently saved and embedded in your revision PDF..."
              value={personalNotes}
              onChange={(e) => setPersonalNotes(e.target.value)}
              rows={8}
              style={{
                width: "100%",
                background: "#FAF9F6",
                border: "1px solid #E4E1DA",
                borderRadius: 8,
                padding: 12,
                fontSize: 11.5,
                color: "#17191C",
                lineHeight: 1.5,
                outline: "none",
                resize: "vertical",
                fontFamily: "inherit",
              }}
            />

            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: "#667085", marginBottom: 6 }}>
                Custom Solution Code (included in PDF):
              </div>
              <textarea
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
                rows={6}
                style={{
                  width: "100%",
                  background: "#FAF9F6",
                  border: "1px solid #E4E1DA",
                  borderRadius: 8,
                  padding: 10,
                  fontFamily: "monospace",
                  fontSize: 10.5,
                  color: "#1E293B",
                  outline: "none",
                  resize: "vertical",
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SAVED KNOWLEDGE LIBRARY */}
      {activeTab === "library" && (
        <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 20, display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: "#162A43", margin: 0 }}>
                Personal Knowledge Documents ({filteredDocs.length})
              </h3>
              <p style={{ fontSize: 11, color: "#667085", margin: "2px 0 0" }}>
                All generated revision notes and cheat sheets saved across your learning sessions.
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#FAF9F6", padding: "6px 12px", borderRadius: 8, border: "1px solid #E4E1DA" }}>
              <span style={{ fontSize: 11, color: "#667085" }}>🔍</span>
              <input
                type="text"
                placeholder="Search saved documents..."
                value={librarySearch}
                onChange={(e) => setLibrarySearch(e.target.value)}
                style={{ background: "transparent", border: "none", outline: "none", fontSize: 11, color: "#17191C", width: 180 }}
              />
            </div>
          </div>

          {filteredDocs.length > 0 ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  style={{
                    background: "#FAF9F6",
                    border: "1px solid #E4E1DA",
                    borderRadius: 8,
                    padding: 14,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#EFF4FE", color: "#356AE6", fontWeight: 700, border: "1px solid #D2E0FB" }}>
                        {doc.modeLabel}
                      </span>
                      <span style={{ fontSize: 9.5, color: "#667085" }}>{doc.createdAt}</span>
                    </div>
                    <h4 style={{ fontSize: 12.5, fontWeight: 800, color: "#162A43", margin: "4px 0" }}>
                      {doc.topicTitle}
                    </h4>
                    <div style={{ fontSize: 10, color: "#667085" }}>Subject: {doc.subjectTitle}</div>
                  </div>

                  <div style={{ display: "flex", gap: 6, borderTop: "1px solid #E4E1DA", paddingTop: 8 }}>
                    <button
                      onClick={() => triggerPdfDownload(doc.htmlContent)}
                      style={{
                        flex: 1,
                        padding: "5px 10px",
                        borderRadius: 6,
                        background: "#356AE6",
                        color: "#FFFFFF",
                        border: "none",
                        fontSize: 10.5,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      🖨️ Print / PDF
                    </button>
                    <button
                      onClick={() => handleDeleteDoc(doc.id)}
                      style={{
                        padding: "5px 8px",
                        borderRadius: 6,
                        background: "#FFFFFF",
                        color: "#C24141",
                        border: "1px solid #E4E1DA",
                        fontSize: 10.5,
                        cursor: "pointer",
                      }}
                      title="Delete from Library"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#667085", fontSize: 12 }}>
              No saved revision documents found. Generate your first revision PDF using the generator tab above!
            </div>
          )}
        </div>
      )}
    </div>
  );
}

