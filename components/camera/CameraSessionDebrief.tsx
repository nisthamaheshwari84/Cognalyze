"use client";

import React, { useState } from "react";
import { CameraSessionReport, CameraObservation } from "@/lib/camera/types";

interface CameraSessionDebriefProps {
  report: CameraSessionReport;
  onClose?: () => void;
}

export default function CameraSessionDebrief({ report, onClose }: CameraSessionDebriefProps) {
  const [filter, setFilter] = useState<"all" | "gaze" | "posture" | "integrity">("all");

  const filteredTimeline = report.timeline.filter((obs) => {
    if (filter === "all") return true;
    if (filter === "gaze") return obs.observationType === "camera_gaze";
    if (filter === "posture") return obs.observationType === "posture" || obs.observationType === "framing";
    if (filter === "integrity") return obs.observationType === "integrity_event" || obs.observationType === "face_missing" || obs.observationType === "multiple_people";
    return true;
  });

  const getSeverityBadge = (s: CameraObservation["severity"]) => {
    switch (s) {
      case "critical":
        return { color: "#EF4444", bg: "rgba(239, 68, 68, 0.15)", label: "CRITICAL" };
      case "high":
        return { color: "#F87171", bg: "rgba(248, 113, 113, 0.15)", label: "FLAGGED" };
      case "medium":
        return { color: "#F59E0B", bg: "rgba(245, 158, 11, 0.15)", label: "NOTICE" };
      case "low":
        return { color: "#60A5FA", bg: "rgba(96, 165, 250, 0.15)", label: "COACH" };
      case "info":
      default:
        return { color: "#10B981", bg: "rgba(16, 185, 129, 0.15)", label: "INFO" };
    }
  };

  return (
    <div
      style={{
        background: "#FFFFFF",
        border: "1px solid #E4E1DA",
        borderRadius: 12,
        padding: 24,
        fontFamily: "var(--font-inter, -apple-system, sans-serif)",
        color: "#17191C",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#356AE6", textTransform: "uppercase", letterSpacing: 0.5 }}>
            CAMERA & PRESENTATION INTELLIGENCE DEBRIEF
          </span>
          <h3 style={{ fontSize: 18, fontWeight: 700, margin: "2px 0 0", color: "#162A43" }}>
            Session Performance & Visual Timeline ({report.durationFormatted})
          </h3>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid #E4E1DA",
              borderRadius: 6,
              padding: "4px 10px",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
              color: "#667085",
            }}
          >
            ✕ Close
          </button>
        )}
      </div>

      {/* Grid: 4 Core Presentation Pillars */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12, marginBottom: 20 }}>
        <div style={{ background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", marginBottom: 4 }}>📷 FRAMING & LIGHTING</div>
          <div style={{ fontSize: 12, lineHeight: 1.4, color: "#17191C" }}>{report.presentationPerformance.cameraFraming}</div>
        </div>

        <div style={{ background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", marginBottom: 4 }}>👁️ CAMERA PRESENCE & GAZE</div>
          <div style={{ fontSize: 12, lineHeight: 1.4, color: "#17191C" }}>{report.presentationPerformance.cameraPresence}</div>
        </div>

        <div style={{ background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", marginBottom: 4 }}>🧍 POSTURE & MOVEMENT</div>
          <div style={{ fontSize: 12, lineHeight: 1.4, color: "#17191C" }}>{report.presentationPerformance.postureObservations}</div>
        </div>

        <div style={{ background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 8, padding: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", marginBottom: 4 }}>🎙️ VOCAL PACING</div>
          <div style={{ fontSize: 12, lineHeight: 1.4, color: "#17191C" }}>{report.presentationPerformance.voiceDeliverySummary}</div>
        </div>
      </div>

      {/* What Worked & Needs Improvement */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
        <div style={{ background: "#EBFDF5", border: "1px solid #A6F4C5", borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#2E7D5B", marginBottom: 8, textTransform: "uppercase" }}>
            ✓ What Worked (Observable Strengths)
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.5, color: "#17191C" }}>
            {report.whatWorked.map((item, idx) => (
              <li key={idx} style={{ marginBottom: 4 }}>{item}</li>
            ))}
          </ul>
        </div>

        <div style={{ background: "#FEF7EC", border: "1px solid #F5DFBA", borderRadius: 8, padding: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#B7791F", marginBottom: 8, textTransform: "uppercase" }}>
            🎯 Actionable Coaching (Refinements)
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, lineHeight: 1.5, color: "#17191C" }}>
            {report.whatNeedsImprovement.map((item, idx) => (
              <li key={idx} style={{ marginBottom: 4 }}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Structured Timeline */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase" }}>
            Observable Event Timeline ({report.timeline.length} events)
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {(["all", "gaze", "posture", "integrity"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                style={{
                  padding: "3px 8px",
                  borderRadius: 4,
                  border: "1px solid #E4E1DA",
                  background: filter === tab ? "#162A43" : "#FAF9F6",
                  color: filter === tab ? "#FFFFFF" : "#667085",
                  fontSize: 10,
                  fontWeight: 600,
                  cursor: "pointer",
                  textTransform: "capitalize",
                }}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div style={{ maxHeight: 180, overflowY: "auto", border: "1px solid #E4E1DA", borderRadius: 8, background: "#FAF9F6" }}>
          {filteredTimeline.length === 0 ? (
            <div style={{ padding: "16px 12px", textAlign: "center", color: "#667085", fontSize: 12 }}>
              No events recorded under this filter.
            </div>
          ) : (
            filteredTimeline.map((obs) => {
              const badge = getSeverityBadge(obs.severity);
              return (
                <div
                  key={obs.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    borderBottom: "1px solid #E4E1DA",
                    fontSize: 11.5,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: "monospace", color: "#667085", fontWeight: 700 }}>
                      {obs.timeFormatted}
                    </span>
                    <span style={{ color: "#17191C" }}>{obs.evidence}</span>
                  </div>
                  <span
                    style={{
                      fontSize: 9,
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: 3,
                      background: badge.bg,
                      color: badge.color,
                      flexShrink: 0,
                    }}
                  >
                    {badge.label}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Next Practice Drills */}
      {report.nextPracticeDrills.length > 0 && (
        <div style={{ marginTop: 16, padding: "10px 14px", background: "#EFF4FE", border: "1px solid #C8DBFC", borderRadius: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#356AE6", marginBottom: 4 }}>
            ⚡ RECOMMENDED DRILLS FOR NEXT PRACTICE SESSION
          </div>
          <div style={{ fontSize: 12, color: "#162A43", lineHeight: 1.45 }}>
            {report.nextPracticeDrills.join(" • ")}
          </div>
        </div>
      )}
    </div>
  );
}
