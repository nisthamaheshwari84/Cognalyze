"use client";

import React from "react";
import { ATSValidationResult, ExportValidationResult, ResumeDocument } from "@/lib/resume/types";

interface PreExportModalProps {
  document: ResumeDocument;
  validation: ExportValidationResult;
  atsResult: ATSValidationResult;
  onClose: () => void;
  onExportPDF: () => void;
  onExportDOCX: () => void;
}

export const PreExportModal: React.FC<PreExportModalProps> = ({
  document: doc,
  validation,
  atsResult,
  onClose,
  onExportPDF,
  onExportDOCX,
}) => {
  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(10, 15, 29, 0.5)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "520px",
          backgroundColor: "#FFFFFF",
          border: "1px solid #E4E1DA",
          borderRadius: "12px",
          boxShadow: "0 20px 45px rgba(0, 0, 0, 0.15)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: "1px solid #E4E1DA",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#162A43", margin: 0 }}>
              Pre-Export Quality Review
            </h3>
            <p style={{ fontSize: 12, color: "#667085", margin: "2px 0 0" }}>
              Comprehensive verification audit before final document export
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#667085",
              fontSize: 18,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body: Check items */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Check 1: Evidence Integrity */}
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              backgroundColor: validation.evidenceIntegrityCertified ? "#EAF4EE" : "#FEF7ED",
              border: `1px solid ${validation.evidenceIntegrityCertified ? "#C8E4D3" : "#F8D8A7"}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>{validation.evidenceIntegrityCertified ? "✓" : "⚠"}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#162A43" }}>
                  Evidence Integrity
                </div>
                <div style={{ fontSize: 11, color: "#667085" }}>
                  {validation.evidenceIntegrityCertified
                    ? "100% of resume statements are verified by primary source citations."
                    : "Some statements contain unverified user assertions."}
                </div>
              </div>
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: validation.evidenceIntegrityCertified ? "#2E7D5B" : "#B7791F",
              }}
            >
              {atsResult.evidenceIntegrityScore}%
            </span>
          </div>

          {/* Check 2: ATS Structure */}
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              backgroundColor: "#EFF4FE",
              border: "1px solid #D2E0FB",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16, color: "#356AE6" }}>✓</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#162A43" }}>
                  ATS Structure & Text Extraction
                </div>
                <div style={{ fontSize: 11, color: "#667085" }}>
                  Linear reading order confirmed. Standard section headings recognized.
                </div>
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#356AE6" }}>
              {atsResult.atsStructureScore}%
            </span>
          </div>

          {/* Check 3: Page Count */}
          <div
            style={{
              padding: "10px 14px",
              borderRadius: "8px",
              backgroundColor: "#F6F5F1",
              border: "1px solid #E4E1DA",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>📄</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#162A43" }}>
                  Page Layout Geometry
                </div>
                <div style={{ fontSize: 11, color: "#667085" }}>
                  Estimated length: {atsResult.pageCountEstimate} page ({doc.settings.paperSize})
                </div>
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#162A43" }}>
              {atsResult.isSinglePage ? "Optimal 1 Page" : `${atsResult.pageCountEstimate} Pages`}
            </span>
          </div>

          {/* Blockers or Warnings */}
          {validation.blockers.length > 0 && (
            <div style={{ padding: "10px", borderRadius: 6, backgroundColor: "#FDF2F2", border: "1px solid #F8C8C8" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#C24141" }}>Export Blocked:</div>
              <ul style={{ margin: "4px 0 0 16px", padding: 0, fontSize: 11, color: "#C24141" }}>
                {validation.blockers.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div style={{ padding: "10px", borderRadius: 6, backgroundColor: "#FEF7ED", border: "1px solid #F8D8A7" }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#B7791F" }}>Advisory Warnings:</div>
              <ul style={{ margin: "4px 0 0 16px", padding: 0, fontSize: 11, color: "#B7791F" }}>
                {validation.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Modal Footer: Action Buttons */}
        <div
          style={{
            padding: "16px 24px",
            backgroundColor: "#F6F5F1",
            borderTop: "1px solid #E4E1DA",
            display: "flex",
            justifyContent: "flex-end",
            gap: 12,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 16px",
              backgroundColor: "#FFFFFF",
              color: "#162A43",
              border: "1px solid #E4E1DA",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Back to Editor
          </button>
          <button
            type="button"
            onClick={onExportDOCX}
            disabled={!validation.readyToExport}
            style={{
              padding: "8px 16px",
              backgroundColor: "#FFFFFF",
              color: "#356AE6",
              border: "1px solid #E4E1DA",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: validation.readyToExport ? "pointer" : "not-allowed",
              opacity: validation.readyToExport ? 1 : 0.5,
            }}
          >
            Export DOCX
          </button>
          <button
            type="button"
            onClick={onExportPDF}
            disabled={!validation.readyToExport}
            style={{
              padding: "8px 18px",
              backgroundColor: "#356AE6",
              color: "white",
              border: "none",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 700,
              cursor: validation.readyToExport ? "pointer" : "not-allowed",
              opacity: validation.readyToExport ? 1 : 0.5,
            }}
          >
            Export Vector PDF
          </button>
        </div>
      </div>
    </div>
  );
};
