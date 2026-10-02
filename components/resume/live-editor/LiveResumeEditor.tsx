"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  ATSValidationResult,
  ResumeBullet,
  ResumeDocument,
  ResumeSection,
  TemplateId,
} from "@/lib/resume/types";
import { RESUME_TEMPLATES } from "@/lib/resume/templates";
import { createDefaultResumeDocument, checkBulletEditValidity } from "@/lib/resume/evidence-tracker";
import { runATSValidation } from "@/lib/resume/ats-validator";
import { validateBeforeExport, printPDF, downloadDOCX } from "@/lib/resume/export-engine";
import { calculatePageUtilization } from "@/lib/resume/page-fitting-engine";
import { DocumentCanvas } from "./DocumentCanvas";
import { LeftOutlinePanel } from "./LeftOutlinePanel";
import { RightInspectorPanel } from "./RightInspectorPanel";
import { PreExportModal } from "./PreExportModal";

interface LiveResumeEditorProps {
  initialDocument?: ResumeDocument;
  onSave?: (doc: ResumeDocument) => void;
  onRebuild?: () => void;
}

export default function LiveResumeEditor({
  initialDocument,
  onSave,
  onRebuild,
}: LiveResumeEditorProps) {
  // Master document state - ONE canonical resume
  const [document, setDocument] = useState<ResumeDocument>(() => {
    if (initialDocument) return initialDocument;
    // Default to clean real student profile if not supplied
    return createDefaultResumeDocument("Nishtha Maheshwari");
  });

  // History stack for Undo / Redo
  const [history, setHistory] = useState<ResumeDocument[]>([
    initialDocument || createDefaultResumeDocument("Nishtha Maheshwari"),
  ]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const lastSavedDocRef = useRef<ResumeDocument | null>(initialDocument || null);

  // Sync ONLY when a genuinely different initialDocument is provided from parent
  useEffect(() => {
    if (
      initialDocument &&
      initialDocument !== lastSavedDocRef.current &&
      initialDocument.documentId !== document.documentId
    ) {
      setDocument(initialDocument);
      setHistory([initialDocument]);
      setHistoryIndex(0);
      lastSavedDocRef.current = initialDocument;
    }
  }, [initialDocument, document.documentId]);

  // Autosave status
  const [saveStatus, setSaveStatus] = useState<"SAVED" | "SAVING">("SAVED");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Selected item / section
  const [selectedBullet, setSelectedBullet] = useState<ResumeBullet | null>(null);
  const [selectedSection, setSelectedSection] = useState<ResumeSection | null>(null);

  // Active tool panel (sections, ai, ats, jd, design) - null by default so resume takes full screen!
  const [activeTool, setActiveTool] = useState<"ai" | "ats" | "jd" | "design" | "sections" | null>(null);

  // Zoom scale
  const [zoomScale, setZoomScale] = useState(1.0);

  // Export Modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Real-time ATS validation on current canonical document (debounced to avoid typing lag)
  const [atsResult, setAtsResult] = useState<ATSValidationResult>(() =>
    runATSValidation(document)
  );

  // Recalculate ATS when document changes (debounced 400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      const result = runATSValidation(document);
      setAtsResult(result);
    }, 400);
    return () => clearTimeout(timer);
  }, [document]);

  // Page budget calculation memoized
  const pageBudget = useMemo(() => calculatePageUtilization(document), [document]);

  // Update document helper with history push
  const handleUpdateDocument = useCallback(
    (updatedDoc: ResumeDocument, isSignificant = true) => {
      lastSavedDocRef.current = updatedDoc;
      setSaveStatus("SAVING");
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        setSaveStatus("SAVED");
        if (onSave) onSave(updatedDoc);
      }, 700);

      setDocument(updatedDoc);

      if (isSignificant) {
        setHistory((prev) => {
          const next = prev.slice(0, historyIndex + 1);
          return [...next, updatedDoc];
        });
        setHistoryIndex((prev) => prev + 1);
      }
    },
    [historyIndex, onSave]
  );

  // Undo
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevDoc = history[historyIndex - 1];
      setHistoryIndex((idx) => idx - 1);
      setDocument(prevDoc);
    }
  }, [history, historyIndex]);

  // Redo
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextDoc = history[historyIndex + 1];
      setHistoryIndex((idx) => idx + 1);
      setDocument(nextDoc);
    }
  }, [history, historyIndex]);

  // Global Keyboard Shortcuts (Cmd+Z, Cmd+Shift+Z, Cmd+S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;
      if (isMeta && e.key === "z") {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      } else if (isMeta && e.key === "s") {
        e.preventDefault();
        setSaveStatus("SAVED");
        if (onSave) onSave(document);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleUndo, handleRedo, onSave, document]);

  // Apply bullet rewrite proposal directly to canonical resume state
  const handleApplyBulletRewrite = (bulletId: string, newText: string) => {
    const updatedSections = document.sections.map((sec) => {
      if (!sec.items) return sec;
      const updatedItems = sec.items.map((item: any) => {
        if (!item.bullets) return item;
        const updatedBullets = item.bullets.map((b: ResumeBullet) => {
          if (b.id !== bulletId) return b;
          const audit = checkBulletEditValidity(b, newText);
          const updatedBullet: ResumeBullet = {
            ...b,
            text: newText,
            claim_status: audit.claim_status,
            evidence_type: audit.evidence_type,
            unverified_flags: audit.unverified_flags,
            why_allowed: audit.why_allowed,
            transformation_notes: audit.transformation_notes,
          };
          if (selectedBullet && selectedBullet.id === b.id) {
            setSelectedBullet(updatedBullet);
          }
          return updatedBullet;
        });
        return { ...item, bullets: updatedBullets };
      });
      return { ...sec, items: updatedItems };
    });

    handleUpdateDocument({ ...document, sections: updatedSections }, true);
  };

  // Change active template
  const handleSwitchTemplate = (templateId: TemplateId) => {
    const updated: ResumeDocument = {
      ...document,
      settings: {
        ...document.settings,
        template: templateId,
      },
    };
    handleUpdateDocument(updated, true);
  };

  // Pre-export validation
  const exportValidation = validateBeforeExport(document, atsResult);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        backgroundColor: "#F6F5F1",
        color: "#17191C",
        fontFamily:
          "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* ========================================================= */}
      {/* TOP TOOLBAR */}
      {/* ========================================================= */}
      <header
        style={{
          height: 52,
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #E4E1DA",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 16px",
          zIndex: 40,
          flexShrink: 0,
        }}
      >
        {/* Left: Brand & Document Info */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {onRebuild && (
            <button
              type="button"
              onClick={onRebuild}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 6,
                backgroundColor: "#FFFFFF",
                border: "1px solid #E4E1DA",
                color: "#162A43",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
              title="Return to form inputs"
            >
              <span>↺</span> Rebuild
            </button>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 800, color: "#162A43" }}>
              {document.contact.name || "Resume"}
            </span>
            <span style={{ fontSize: 10, color: "#98A2B3" }}>•</span>
            <span style={{ fontSize: 11, color: "#667085" }}>
              {document.targetRole || "Software Engineer"}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: saveStatus === "SAVED" ? "#2E7D5B" : "#B7791F",
                marginLeft: 4,
              }}
            >
              {saveStatus === "SAVED" ? "✓ Saved" : "⏳ Saving..."}
            </span>
          </div>
        </div>

        {/* Center: Controls (Template, Zoom, Undo, Redo) */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* Template Switcher Dropdown */}
          <select
            value={document.settings.template}
            onChange={(e) => handleSwitchTemplate(e.target.value as TemplateId)}
            style={{
              padding: "6px 12px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E4E1DA",
              borderRadius: 6,
              color: "#162A43",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {RESUME_TEMPLATES.map((tmpl) => (
              <option key={tmpl.id} value={tmpl.id}>
                Template: {tmpl.name}
              </option>
            ))}
          </select>

          {/* Zoom controls */}
          <div style={{ display: "flex", background: "#FFFFFF", borderRadius: 6, border: "1px solid #E4E1DA" }}>
            <button
              type="button"
              onClick={() => setZoomScale((s) => Math.max(0.6, s - 0.1))}
              style={{
                padding: "6px 8px",
                background: "transparent",
                border: "none",
                color: "#162A43",
                cursor: "pointer",
                fontSize: 12,
              }}
              title="Zoom out"
            >
              −
            </button>
            <span
              style={{
                padding: "6px 4px",
                fontSize: 11,
                color: "#667085",
                fontWeight: 600,
                minWidth: 42,
                textAlign: "center",
              }}
            >
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomScale((s) => Math.min(1.4, s + 0.1))}
              style={{
                padding: "6px 8px",
                background: "transparent",
                border: "none",
                color: "#162A43",
                cursor: "pointer",
                fontSize: 12,
              }}
              title="Zoom in"
            >
              +
            </button>
          </div>

          {/* Undo / Redo */}
          <div style={{ display: "flex", background: "#FFFFFF", borderRadius: 6, border: "1px solid #E4E1DA" }}>
            <button
              type="button"
              disabled={historyIndex <= 0}
              onClick={handleUndo}
              style={{
                padding: "6px 10px",
                background: "transparent",
                border: "none",
                color: historyIndex > 0 ? "#162A43" : "#98A2B3",
                cursor: historyIndex > 0 ? "pointer" : "default",
                fontSize: 11,
                fontWeight: 600,
              }}
              title="Undo (Cmd+Z)"
            >
              ↶
            </button>
            <div style={{ width: 1, backgroundColor: "#E4E1DA" }} />
            <button
              type="button"
              disabled={historyIndex >= history.length - 1}
              onClick={handleRedo}
              style={{
                padding: "6px 10px",
                background: "transparent",
                border: "none",
                color: historyIndex < history.length - 1 ? "#162A43" : "#98A2B3",
                cursor: historyIndex < history.length - 1 ? "pointer" : "default",
                fontSize: 11,
                fontWeight: 600,
              }}
              title="Redo (Cmd+Shift+Z)"
            >
              ↷
            </button>
          </div>
        </div>

        {/* Right: Export Buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={() => downloadDOCX(document)}
            style={{
              padding: "6px 12px",
              backgroundColor: "#FFFFFF",
              color: "#162A43",
              border: "1px solid #E4E1DA",
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
            title="Download Word DOCX"
          >
            <span>📄</span> DOCX
          </button>

          <button
            type="button"
            onClick={() => {
              // Print current canvas directly as vector PDF
              printPDF("resume-live-canvas");
            }}
            style={{
              padding: "6px 16px",
              background: "#356AE6",
              color: "white",
              border: "none",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              boxShadow: "0 1px 3px rgba(53, 106, 230, 0.25)",
            }}
          >
            <span>📥</span> Download PDF
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* MAIN WORKSPACE (RESUME TAKES CENTER STAGE) */}
      {/* ========================================================= */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
        {/* Optional Section Organizer Slide-Over */}
        {activeTool === "sections" && (
          <LeftOutlinePanel
            document={document}
            onUpdateDocument={handleUpdateDocument}
            onSelectSection={(sec) => setSelectedSection(sec)}
            selectedSectionId={selectedSection?.id || null}
            onClose={() => setActiveTool(null)}
          />
        )}

        {/* CENTER RESUME CANVAS - OCCUPIES MAJORITY/FULL SCREEN */}
        <main
          style={{
            flex: 1,
            height: "100%",
            overflowY: "auto",
            backgroundColor: "#EFECE6",
            position: "relative",
            display: "flex",
            justifyContent: "center",
            padding: "24px 16px 80px",
          }}
        >
          <DocumentCanvas
            document={document}
            onUpdateDocument={handleUpdateDocument}
            selectedBulletId={selectedBullet?.id || null}
            onSelectBullet={(b) => {
              setSelectedBullet(b);
            }}
            onSelectSection={(sec) => setSelectedSection(sec)}
            zoomScale={zoomScale}
          />
        </main>

        {/* Optional Right Tool Panel (AI Polish, ATS Check, JD Match, Design) */}
        {activeTool && activeTool !== "sections" && (
          <RightInspectorPanel
            document={document}
            onUpdateDocument={handleUpdateDocument}
            selectedBullet={selectedBullet}
            selectedSection={selectedSection}
            atsResult={atsResult}
            onApplyBulletRewrite={handleApplyBulletRewrite}
            initialTab={activeTool}
            onClose={() => setActiveTool(null)}
          />
        )}
      </div>

      {/* ========================================================= */}
      {/* BOTTOM FLOATING ACTION DOCK */}
      {/* ========================================================= */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 8px",
          backgroundColor: "#FFFFFF",
          border: "1px solid #E4E1DA",
          borderRadius: 30,
          boxShadow: "0 6px 20px rgba(0, 0, 0, 0.08)",
          zIndex: 40,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTool(activeTool === "ai" ? null : "ai")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 20,
            border: "none",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            backgroundColor: activeTool === "ai" ? "#356AE6" : "transparent",
            color: activeTool === "ai" ? "white" : "#667085",
            transition: "all 0.15s ease",
          }}
        >
          <span>✨</span> AI Polish
        </button>

        <button
          type="button"
          onClick={() => setActiveTool(activeTool === "ats" ? null : "ats")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 20,
            border: "none",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            backgroundColor: activeTool === "ats" ? "#2E7D5B" : "transparent",
            color: activeTool === "ats" ? "white" : "#667085",
            transition: "all 0.15s ease",
          }}
        >
          <span>📊</span> ATS Check ({atsResult.overallScore}%)
        </button>

        <button
          type="button"
          onClick={() => setActiveTool(activeTool === "jd" ? null : "jd")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 20,
            border: "none",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            backgroundColor: activeTool === "jd" ? "#162A43" : "transparent",
            color: activeTool === "jd" ? "white" : "#667085",
            transition: "all 0.15s ease",
          }}
        >
          <span>🎯</span> JD Match
        </button>

        <button
          type="button"
          onClick={() => setActiveTool(activeTool === "design" ? null : "design")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 20,
            border: "none",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            backgroundColor: activeTool === "design" ? "#356AE6" : "transparent",
            color: activeTool === "design" ? "white" : "#667085",
            transition: "all 0.15s ease",
          }}
        >
          <span>🎨</span> Design & Layout
        </button>

        <button
          type="button"
          onClick={() => setActiveTool(activeTool === "sections" ? null : "sections")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 14px",
            borderRadius: 20,
            border: "none",
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            backgroundColor: activeTool === "sections" ? "#162A43" : "transparent",
            color: activeTool === "sections" ? "white" : "#667085",
            transition: "all 0.15s ease",
          }}
        >
          <span>📑</span> Sections
        </button>
      </div>

      {/* Pre-export Quality Modal (Optional Pre-Flight Check) */}
      {isExportModalOpen && (
        <PreExportModal
          document={document}
          validation={exportValidation}
          atsResult={atsResult}
          onClose={() => setIsExportModalOpen(false)}
          onExportPDF={() => {
            setIsExportModalOpen(false);
            printPDF("resume-live-canvas");
          }}
          onExportDOCX={() => {
            setIsExportModalOpen(false);
            downloadDOCX(document);
          }}
        />
      )}
    </div>
  );
}
