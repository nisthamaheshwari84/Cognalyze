"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeProvider";

interface UpdateProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: {
    fullName: string;
    college: string;
    degree: string;
    branch: string;
    graduationYear: string;
  };
  onSave: (updated: { fullName: string; college: string; degree: string; branch: string; graduationYear: string }) => void;
}

export default function UpdateProfileModal({
  isOpen,
  onClose,
  profile,
  onSave
}: UpdateProfileModalProps) {
  const { isDark } = useTheme();
  const [fullName, setFullName] = useState(profile.fullName);
  const [college, setCollege] = useState(profile.college);
  const [degree, setDegree] = useState(profile.degree);
  const [branch, setBranch] = useState(profile.branch);
  const [graduationYear, setGraduationYear] = useState(profile.graduationYear);

  useEffect(() => {
    setFullName(profile.fullName);
    setCollege(profile.college);
    setDegree(profile.degree);
    setBranch(profile.branch);
    setGraduationYear(profile.graduationYear);
  }, [profile]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ fullName, college, degree, branch, graduationYear });
    onClose();
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
          maxWidth: 480,
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
              Update Student Profile
            </div>
            <div style={{ fontSize: 13, color: isDark ? "#8292A8" : "#667085", marginTop: 2 }}>
              Academic context for campus placement eligibility
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

        <form onSubmit={handleSubmit} style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#8292A8" : "#667085", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              style={{
                width: "100%",
                marginTop: 6,
                padding: "9px 12px",
                borderRadius: 7,
                border: isDark ? "1px solid #263D57" : "1px solid #E4E1DA",
                backgroundColor: isDark ? "#13243A" : "#FAF9F6",
                fontSize: 13,
                color: isDark ? "#F2F6FC" : "#17191C",
                outline: "none"
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#8292A8" : "#667085", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Degree
              </label>
              <input
                type="text"
                value={degree}
                onChange={(e) => setDegree(e.target.value)}
                placeholder="B.Tech"
                style={{
                  width: "100%",
                  marginTop: 6,
                  padding: "9px 12px",
                  borderRadius: 7,
                  border: isDark ? "1px solid #263D57" : "1px solid #E4E1DA",
                  backgroundColor: isDark ? "#13243A" : "#FAF9F6",
                  fontSize: 13,
                  color: isDark ? "#F2F6FC" : "#17191C",
                  outline: "none"
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#8292A8" : "#667085", textTransform: "uppercase", letterSpacing: 0.5 }}>
                Branch / Major
              </label>
              <input
                type="text"
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                placeholder="CSE · AI & ML"
                style={{
                  width: "100%",
                  marginTop: 6,
                  padding: "9px 12px",
                  borderRadius: 7,
                  border: isDark ? "1px solid #263D57" : "1px solid #E4E1DA",
                  backgroundColor: isDark ? "#13243A" : "#FAF9F6",
                  fontSize: 13,
                  color: isDark ? "#F2F6FC" : "#17191C",
                  outline: "none"
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#8292A8" : "#667085", textTransform: "uppercase", letterSpacing: 0.5 }}>
              College / University
            </label>
            <input
              type="text"
              value={college}
              onChange={(e) => setCollege(e.target.value)}
              placeholder="ABES Engineering College"
              style={{
                width: "100%",
                marginTop: 6,
                padding: "9px 12px",
                borderRadius: 7,
                border: isDark ? "1px solid #263D57" : "1px solid #E4E1DA",
                backgroundColor: isDark ? "#13243A" : "#FAF9F6",
                fontSize: 13,
                color: isDark ? "#F2F6FC" : "#17191C",
                outline: "none"
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#8292A8" : "#667085", textTransform: "uppercase", letterSpacing: 0.5 }}>
              Graduation Year
            </label>
            <input
              type="text"
              value={graduationYear}
              onChange={(e) => setGraduationYear(e.target.value)}
              placeholder="2026"
              style={{
                width: "100%",
                marginTop: 6,
                padding: "9px 12px",
                borderRadius: 7,
                border: isDark ? "1px solid #263D57" : "1px solid #E4E1DA",
                backgroundColor: isDark ? "#13243A" : "#FAF9F6",
                fontSize: 13,
                color: isDark ? "#F2F6FC" : "#17191C",
                outline: "none"
              }}
            />
          </div>

          <div style={{ marginTop: 8, display: "flex", gap: 10, paddingTop: 14, borderTop: isDark ? "1px solid #223750" : "1px solid #E4E1DA" }}>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: "10px 0",
                borderRadius: 7,
                backgroundColor: "#3478F6",
                color: "#ffffff",
                border: "none",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(16, 24, 40, 0.05)"
              }}
            >
              Save Profile
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "10px 16px",
                borderRadius: 7,
                border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
                backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                color: isDark ? "#DCE7F5" : "#17191C",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
