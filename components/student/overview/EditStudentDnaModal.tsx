"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";

interface EditStudentDnaModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId?: string;
  currentGoal?: string;
  onGoalUpdated?: (newGoal: string) => void;
}

export default function EditStudentDnaModal({
  isOpen,
  onClose,
  candidateId = "student-demo",
  currentGoal = "AI/ML Engineer",
  onGoalUpdated
}: EditStudentDnaModalProps) {
  const { isDark } = useTheme();
  const [selectedGoal, setSelectedGoal] = useState(currentGoal);
  const [timeline, setTimeline] = useState("Next 6 months");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSelectedGoal(currentGoal);
  }, [currentGoal]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const roleOptions = [
    { title: "AI/ML Engineer", focus: "Python, PyTorch, Transformers, MLOps, Model Deployment" },
    { title: "Full Stack Engineer", focus: "React, Next.js, TypeScript, Node.js, SQL, Cloud" },
    { title: "Backend / Distributed Systems", focus: "Go / Java, Microservices, Kafka, Redis, PostgreSQL" },
    { title: "Data Engineer", focus: "Spark, Airflow, Snowflake, Python, Data Warehousing" }
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/student/dna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidateId,
          careerIntent: {
            primaryGoal: selectedGoal,
            timeline
          }
        })
      });
      if (res.ok) {
        if (onGoalUpdated) onGoalUpdated(selectedGoal);
        onClose();
      }
    } catch (err) {
      console.error("Failed to update Student DNA:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: isDark ? "rgba(3, 8, 16, 0.72)" : "rgba(22, 42, 67, 0.45)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
          borderRadius: 12,
          border: isDark ? "1px solid #223750" : "1px solid #E4E1DA",
          boxShadow: isDark
            ? "0 24px 48px -12px rgba(0, 0, 0, 0.5)"
            : "0 20px 40px -10px rgba(22, 42, 67, 0.18)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "18px 24px",
            borderBottom: isDark ? "1px solid #223750" : "1px solid #E4E1DA",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF"
          }}
        >
          <div>
            <div style={{ fontSize: 17, fontWeight: 700, color: isDark ? "#F2F6FC" : "#162A43" }}>
              Edit Student DNA & Career Intent
            </div>
            <div style={{ fontSize: 13, color: isDark ? "#8292A8" : "#667085", marginTop: 2 }}>
              Calibrate role expectations, gap formulas, and opportunity ranking
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
              backgroundColor: isDark ? "#13243A" : "#F6F5F1",
              color: isDark ? "#B6C4D6" : "#667085",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontWeight: 600,
              fontSize: 14
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#8292A8" : "#667085", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Primary Career Target
            </label>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
              {roleOptions.map((opt) => {
                const isSelected = selectedGoal === opt.title;
                return (
                  <button
                    key={opt.title}
                    type="button"
                    onClick={() => setSelectedGoal(opt.title)}
                    style={{
                      textAlign: "left",
                      padding: "12px 14px",
                      borderRadius: 7,
                      border: isSelected
                        ? "1.5px solid #3478F6"
                        : isDark
                        ? "1px solid #263D57"
                        : "1px solid #E4E1DA",
                      backgroundColor: isSelected
                        ? isDark
                          ? "rgba(52, 120, 246, 0.16)"
                          : "#EEF4FD"
                        : isDark
                        ? "#13243A"
                        : "#FAF9F6",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: isSelected
                            ? isDark
                              ? "#73A6FF"
                              : "#356AE6"
                            : isDark
                            ? "#F2F6FC"
                            : "#17191C"
                        }}
                      >
                        {opt.title}
                      </div>
                      <div style={{ fontSize: 12, color: isDark ? "#8292A8" : "#667085", marginTop: 2 }}>
                        {opt.focus}
                      </div>
                    </div>
                    {isSelected && (
                      <span style={{ fontSize: 14, color: isDark ? "#73A6FF" : "#356AE6", fontWeight: 700 }}>✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#8292A8" : "#667085", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Target Season / Timeline
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
              {["Immediate / 2026 Batch", "Next 6 months", "Summer 2027", "Full-Time Placement"].map((t) => {
                const isSelected = timeline === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTimeline(t)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 7,
                      fontSize: 12,
                      fontWeight: 500,
                      border: isSelected
                        ? "1.5px solid #3478F6"
                        : isDark
                        ? "1px solid #263D57"
                        : "1px solid #E4E1DA",
                      backgroundColor: isSelected
                        ? isDark
                          ? "rgba(52, 120, 246, 0.16)"
                          : "#EEF4FD"
                        : isDark
                        ? "#13243A"
                        : "#FAF9F6",
                      color: isSelected
                        ? isDark
                          ? "#73A6FF"
                          : "#356AE6"
                        : isDark
                        ? "#B6C4D6"
                        : "#667085",
                      cursor: "pointer"
                    }}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 6, paddingTop: 14, borderTop: isDark ? "1px solid #223750" : "1px solid #E4E1DA" }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 7,
                backgroundColor: "#3478F6",
                color: "#ffffff",
                border: "none",
                fontSize: 13,
                fontWeight: 600,
                cursor: saving ? "not-allowed" : "pointer",
                boxShadow: "0 1px 2px rgba(16, 24, 40, 0.05)"
              }}
            >
              {saving ? "Updating DNA..." : "Save Career Direction"}
            </button>
            <Link
              href="/student/dna"
              onClick={onClose}
              style={{
                padding: "10px 16px",
                borderRadius: 7,
                border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                color: isDark ? "#DCE7F5" : "#17191C",
                fontSize: 13,
                fontWeight: 600,
                textDecoration: "none",
                display: "flex",
                alignItems: "center"
              }}
            >
              Full DNA →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
