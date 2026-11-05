"use client";

import React from "react";
import { ResponsibilityGraphNode } from "@/lib/roles/types";

interface ResponsibilityGraphViewerProps {
  graph: ResponsibilityGraphNode[];
  roleTitle?: string;
}

export default function ResponsibilityGraphViewer({
  graph,
  roleTitle,
}: ResponsibilityGraphViewerProps) {
  if (!graph || graph.length === 0) {
    return (
      <div
        style={{
          padding: "24px 20px",
          textAlign: "center",
          background: "var(--surface-subtle)",
          border: "1px dashed var(--border-subtle)",
          borderRadius: 8,
          color: "var(--text-secondary)",
          fontSize: 13,
        }}
      >
        No responsibility-to-capability relationships established yet. Paste a detailed job description with explicit deliverables to generate the relationship graph.
      </div>
    );
  }

  const getOwnershipStyle = (level: string) => {
    switch (level) {
      case "architect":
        return { bg: "#ECFDF5", text: "#065F46", border: "#A7F3D0" };
      case "lead":
        return { bg: "#F5F3FF", text: "#6D28D9", border: "#DDD6FE" };
      case "own":
        return { bg: "var(--color-info-bg)", text: "var(--brand-cobalt)", border: "#D2E0FB" };
      default:
        return { bg: "var(--surface-subtle)", text: "var(--text-secondary)", border: "var(--border-subtle)" };
    }
  };

  const getComplexityStyle = (complexity: string) => {
    switch (complexity) {
      case "mission_critical":
        return { bg: "var(--color-error-bg)", text: "var(--color-error)", border: "#F8D7D7" };
      case "advanced":
        return { bg: "var(--color-warning-bg)", text: "var(--color-warning)", border: "#F8D8A7" };
      case "intermediate":
        return { bg: "var(--color-info-bg)", text: "var(--brand-cobalt)", border: "#D2E0FB" };
      default:
        return { bg: "var(--surface-subtle)", text: "var(--text-secondary)", border: "var(--border-subtle)" };
    }
  };

  const getDepthBadge = (depth: string) => {
    const depthLabels: Record<string, string> = {
      independent_architecture: "Independent Architecture",
      expert_optimization: "Expert Optimization",
      practical_implementation: "Practical Implementation",
      awareness: "Conceptual Awareness",
    };
    return depthLabels[depth] || depth.replace(/_/g, " ");
  };

  const getAssessmentLabel = (method: string) => {
    const methodLabels: Record<string, string> = {
      work_sample: "🛠️ Work Sample",
      system_design: "📐 System Design",
      debugging: "🐞 Debug Lab",
      code_execution: "💻 Code Execution",
      targeted_interview: "🎙️ Targeted Interview",
    };
    return methodLabels[method] || method.replace(/_/g, " ");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <div>
          <h4 style={{ fontSize: 14, fontWeight: 700, color: "var(--brand-navy)", margin: 0 }}>
            Responsibility-to-Capability Relational Graph ({graph.length} Nodes)
          </h4>
          <p style={{ fontSize: 12, color: "var(--text-secondary)", margin: "2px 0 0" }}>
            Every on-the-job responsibility is mapped to explicit required capabilities, depth expectations, and objective assessment methods.
          </p>
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: 4,
            background: "var(--surface-subtle)",
            color: "var(--brand-cobalt)",
            border: "1px solid var(--border-subtle)",
          }}
        >
          {roleTitle || "Target Role"}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {graph.map((node, idx) => {
          const ownStyle = getOwnershipStyle(node.ownershipLevel);
          const compStyle = getComplexityStyle(node.complexity);

          return (
            <div
              key={node.id || idx}
              style={{
                padding: "16px 20px",
                background: "var(--surface)",
                border: "1px solid var(--border-subtle)",
                borderRadius: 8,
                boxShadow: "0 1px 2px rgba(16, 24, 40, 0.03)",
              }}
            >
              {/* Top row: description and badges */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--brand-navy)", lineHeight: 1.4 }}>
                    {idx + 1}. {node.description}
                  </div>
                  {node.sourceText && node.sourceText !== node.description && (
                    <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 4, fontStyle: "italic" }}>
                      &ldquo;{node.sourceText}&rdquo;
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: 4,
                      background: ownStyle.bg,
                      color: ownStyle.text,
                      border: `1px solid ${ownStyle.border}`,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    Ownership: {node.ownershipLevel}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: 4,
                      background: compStyle.bg,
                      color: compStyle.text,
                      border: `1px solid ${compStyle.border}`,
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    {node.complexity.replace(/_/g, " ")}
                  </span>
                </div>
              </div>

              {/* Connected capabilities */}
              {node.requiredCapabilities && node.requiredCapabilities.length > 0 && (
                <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px dashed var(--border-subtle)" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 8 }}>
                    Connected Capabilities &amp; Assessment Strategy:
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {node.requiredCapabilities.map((cap, cIdx) => (
                      <div
                        key={cap.capabilityId || cIdx}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: 8,
                          padding: "8px 12px",
                          background: "var(--surface-subtle)",
                          border: "1px solid var(--border-subtle)",
                          borderRadius: 6,
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>
                            {cap.canonicalName}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              padding: "1px 6px",
                              borderRadius: 3,
                              background: cap.importance === "mandatory" ? "var(--color-error-bg)" : "var(--color-info-bg)",
                              color: cap.importance === "mandatory" ? "var(--color-error)" : "var(--brand-cobalt)",
                              fontWeight: 700,
                            }}
                          >
                            {cap.importance === "mandatory" ? "Mandatory" : "Preferred"}
                          </span>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <span
                            style={{
                              fontSize: 11,
                              padding: "2px 8px",
                              borderRadius: 4,
                              background: "var(--surface)",
                              border: "1px solid var(--border-subtle)",
                              color: "var(--brand-navy)",
                              fontWeight: 600,
                            }}
                          >
                            Depth: {getDepthBadge(cap.requiredDepth)}
                          </span>
                          <span
                            style={{
                              fontSize: 11,
                              padding: "2px 8px",
                              borderRadius: 4,
                              background: "var(--surface)",
                              border: "1px solid var(--border-subtle)",
                              color: "var(--brand-cobalt)",
                              fontWeight: 700,
                            }}
                          >
                            {getAssessmentLabel(cap.assessmentMethod)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Expected outcomes */}
              {node.expectedOutcomes && node.expectedOutcomes.length > 0 && (
                <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, color: "var(--text-secondary)", fontWeight: 700 }}>Outcomes:</span>
                  {node.expectedOutcomes.map((out, oIdx) => (
                    <span
                      key={oIdx}
                      style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 4,
                        background: "#ECFDF5",
                        color: "#065F46",
                        border: "1px solid #A7F3D0",
                      }}
                    >
                      ✓ {out}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

