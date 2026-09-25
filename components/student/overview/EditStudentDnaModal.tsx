"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

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
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(8px)",
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
          maxWidth: 540,
          backgroundColor: "#0f172a",
          borderRadius: 16,
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "rgba(15, 23, 42, 0.8)"
          }}
        >
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: "#ffffff" }}>
              Edit Student DNA & Career Intent
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>
              Calibrate role expectations, gap formulas, and opportunity ranking
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              border: "1px solid rgba(255, 255, 255, 0.1)",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              color: "#94a3b8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontWeight: 700
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 18 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6 }}>
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
                      padding: "12px 16px",
                      borderRadius: 12,
                      border: isSelected ? "2px solid #2563eb" : "1px solid rgba(255, 255, 255, 0.1)",
                      backgroundColor: isSelected ? "rgba(37, 99, 235, 0.15)" : "rgba(2, 6, 23, 0.5)",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: isSelected ? "#60a5fa" : "#ffffff" }}>
                        {opt.title}
                      </div>
                      <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                        {opt.focus}
                      </div>
                    </div>
                    {isSelected && (
                      <span style={{ fontSize: 16, color: "#38bdf8", fontWeight: 900 }}>✓</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6 }}>
              Target Season / Timeline
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
              {["Immediate / 2026 Batch", "Next 6 months", "Summer 2027", "Full-Time Placement"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTimeline(t)}
                  style={{
                    padding: "8px 12px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    border: timeline === t ? "1px solid #2563eb" : "1px solid rgba(255, 255, 255, 0.1)",
                    backgroundColor: timeline === t ? "rgba(37, 99, 235, 0.2)" : "rgba(2, 6, 23, 0.5)",
                    color: timeline === t ? "#60a5fa" : "#94a3b8",
                    cursor: "pointer"
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1,
                padding: "11px 0",
                borderRadius: 10,
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                fontSize: 14,
                fontWeight: 700,
                cursor: saving ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px rgba(37, 99, 235, 0.4)"
              }}
            >
              {saving ? "Updating DNA..." : "Save Career Direction"}
            </button>
            <Link
              href="/student/dna"
              onClick={onClose}
              style={{
                padding: "11px 18px",
                borderRadius: 10,
                border: "1px solid rgba(255, 255, 255, 0.12)",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "#cbd5e1",
                fontSize: 13,
                fontWeight: 700,
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
