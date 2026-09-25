"use client";

import React, { useState, useEffect } from "react";

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
          maxWidth: 480,
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
              Update Student Profile
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>
              Academic context for campus placement eligibility
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

        <form onSubmit={handleSubmit} style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6 }}>
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
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid rgba(255, 255, 255, 0.12)",
                backgroundColor: "rgba(2, 6, 23, 0.7)",
                fontSize: 14,
                color: "#ffffff",
                outline: "none"
              }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6 }}>
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
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  backgroundColor: "rgba(2, 6, 23, 0.7)",
                  fontSize: 14,
                  color: "#ffffff",
                  outline: "none"
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6 }}>
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
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  backgroundColor: "rgba(2, 6, 23, 0.7)",
                  fontSize: 14,
                  color: "#ffffff",
                  outline: "none"
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6 }}>
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
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid rgba(255, 255, 255, 0.12)",
                backgroundColor: "rgba(2, 6, 23, 0.7)",
                fontSize: 14,
                color: "#ffffff",
                outline: "none"
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.6 }}>
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
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid rgba(255, 255, 255, 0.12)",
                backgroundColor: "rgba(2, 6, 23, 0.7)",
                fontSize: 14,
                color: "#ffffff",
                outline: "none"
              }}
            />
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
            <button
              type="submit"
              style={{
                flex: 1,
                padding: "11px 0",
                borderRadius: 10,
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 8px rgba(37, 99, 235, 0.4)"
              }}
            >
              Save Profile
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: "11px 18px",
                borderRadius: 10,
                border: "1px solid rgba(255, 255, 255, 0.12)",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "#94a3b8",
                fontSize: 14,
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
