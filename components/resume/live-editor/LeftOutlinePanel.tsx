"use client";

import React, { useState } from "react";
import { ResumeDocument, ResumeSection, SectionType } from "@/lib/resume/types";

interface LeftOutlinePanelProps {
  document: ResumeDocument;
  onUpdateDocument: (doc: ResumeDocument, isSignificant: boolean) => void;
  onSelectSection: (section: ResumeSection) => void;
  selectedSectionId: string | null;
  onClose?: () => void;
}

const AVAILABLE_SECTION_TEMPLATES: Array<{ type: SectionType; title: string }> = [
  { type: "experience", title: "Work Experience" },
  { type: "projects", title: "Technical Projects" },
  { type: "education", title: "Education" },
  { type: "skills", title: "Technical Skills" },
  { type: "certifications", title: "Certifications" },
  { type: "achievements", title: "Honors & Achievements" },
  { type: "leadership", title: "Leadership & Activities" },
  { type: "publications", title: "Publications & Research" },
  { type: "coursework", title: "Relevant Coursework" },
  { type: "custom", title: "Additional Information" },
];

export const LeftOutlinePanel: React.FC<LeftOutlinePanelProps> = ({
  document: doc,
  onUpdateDocument,
  onSelectSection,
  selectedSectionId,
  onClose,
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Move section up
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const sorted = [...doc.sections].sort((a, b) => a.order - b.order);
    const temp = sorted[index].order;
    sorted[index].order = sorted[index - 1].order;
    sorted[index - 1].order = temp;
    onUpdateDocument({ ...doc, sections: sorted }, true);
  };

  // Move section down
  const handleMoveDown = (index: number) => {
    const sorted = [...doc.sections].sort((a, b) => a.order - b.order);
    if (index >= sorted.length - 1) return;
    const temp = sorted[index].order;
    sorted[index].order = sorted[index + 1].order;
    sorted[index + 1].order = temp;
    onUpdateDocument({ ...doc, sections: sorted }, true);
  };

  // Toggle visibility
  const handleToggleVisibility = (sectionId: string) => {
    const updated = doc.sections.map((s) =>
      s.id === sectionId ? { ...s, visible: !s.visible } : s
    );
    onUpdateDocument({ ...doc, sections: updated }, true);
  };

  // Delete section
  const handleDeleteSection = (sectionId: string) => {
    const updated = doc.sections.filter((s) => s.id !== sectionId);
    onUpdateDocument({ ...doc, sections: updated }, true);
  };

  // Add new section
  const handleAddSection = (template: { type: SectionType; title: string }) => {
    const maxOrder = doc.sections.reduce((max, s) => Math.max(max, s.order), 0);
    const newSection: ResumeSection = {
      id: `sec-${Date.now()}`,
      type: template.type,
      title: template.title,
      visible: true,
      order: maxOrder + 1,
      items: [],
    };
    onUpdateDocument({ ...doc, sections: [...doc.sections, newSection] }, true);
    setShowAddMenu(false);
    onSelectSection(newSection);
  };

  const sortedSections = [...doc.sections].sort((a, b) => a.order - b.order);

  return (
    <aside
      style={{
        width: 280,
        backgroundColor: "#FFFFFF",
        borderRight: "1px solid #E4E1DA",
        color: "#17191C",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        height: "100%",
        userSelect: "none",
        zIndex: 50,
      }}
    >
      {/* Panel Header */}
      <div
        style={{
          padding: "14px 18px",
          borderBottom: "1px solid #E4E1DA",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 700, margin: 0, color: "#162A43", letterSpacing: "0.5px" }}>
            RESUME SECTIONS
          </h3>
          <p style={{ fontSize: 11, color: "#667085", margin: "2px 0 0" }}>
            {doc.sections.filter((s) => s.visible).length} active sections
          </p>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            title="Close outline"
            style={{
              background: "transparent",
              border: "none",
              color: "#667085",
              fontSize: 16,
              cursor: "pointer",
              padding: "4px 8px",
              borderRadius: 6,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Sections List */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 10px" }}>
        {sortedSections.map((sec, idx) => {
          const isSelected = selectedSectionId === sec.id;
          return (
            <div
              key={sec.id}
              onClick={() => onSelectSection(sec)}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "8px 10px",
                marginBottom: 4,
                borderRadius: 6,
                backgroundColor: isSelected
                  ? "#EFF4FE"
                  : "transparent",
                border: isSelected
                  ? "1px solid #D2E0FB"
                  : "1px solid transparent",
                cursor: "pointer",
                transition: "all 0.12s ease",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, overflow: "hidden" }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggleVisibility(sec.id);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: sec.visible ? "#356AE6" : "#98A2B3",
                    cursor: "pointer",
                    fontSize: 12,
                    padding: 0,
                  }}
                  title={sec.visible ? "Hide section" : "Show section"}
                >
                  {sec.visible ? "👁" : "👁‍🗨"}
                </button>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: sec.visible ? "#162A43" : "#98A2B3",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                  }}
                >
                  {sec.title}
                </span>
              </div>

              {/* Action Controls */}
              <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
                <button
                  type="button"
                  disabled={idx === 0}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveUp(idx);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: idx === 0 ? "#E4E1DA" : "#667085",
                    cursor: idx === 0 ? "default" : "pointer",
                    padding: "2px 4px",
                    fontSize: 11,
                  }}
                  title="Move section up"
                >
                  ▲
                </button>
                <button
                  type="button"
                  disabled={idx === sortedSections.length - 1}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleMoveDown(idx);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: idx === sortedSections.length - 1 ? "#E4E1DA" : "#667085",
                    cursor: idx === sortedSections.length - 1 ? "default" : "pointer",
                    padding: "2px 4px",
                    fontSize: 11,
                  }}
                  title="Move section down"
                >
                  ▼
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSection(sec.id);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#C24141",
                    cursor: "pointer",
                    padding: "2px 4px",
                    fontSize: 11,
                  }}
                  title="Delete section"
                >
                  ✕
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Section Button & Popover */}
      <div style={{ padding: "14px 16px", borderTop: "1px solid #E4E1DA", position: "relative" }}>
        <button
          type="button"
          onClick={() => setShowAddMenu(!showAddMenu)}
          style={{
            width: "100%",
            padding: "8px 14px",
            backgroundColor: "#F6F5F1",
            color: "#162A43",
            border: "1px solid #E4E1DA",
            borderRadius: 6,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            transition: "all 0.15s ease",
          }}
        >
          <span>+</span> Add Section
        </button>

        {showAddMenu && (
          <div
            style={{
              position: "absolute",
              bottom: "54px",
              left: "14px",
              right: "14px",
              backgroundColor: "#FFFFFF",
              border: "1px solid #E4E1DA",
              borderRadius: 8,
              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
              padding: "6px",
              zIndex: 50,
              maxHeight: "260px",
              overflowY: "auto",
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 700, color: "#667085", padding: "6px 8px", textTransform: "uppercase" }}>
              Available Standard Sections
            </div>
            {AVAILABLE_SECTION_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.type}
                type="button"
                onClick={() => handleAddSection(tmpl)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "6px 10px",
                  borderRadius: 4,
                  backgroundColor: "transparent",
                  border: "none",
                  color: "#162A43",
                  fontSize: 12,
                  cursor: "pointer",
                  display: "block",
                  transition: "background-color 0.1s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F6F5F1")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                {tmpl.title}
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
};
