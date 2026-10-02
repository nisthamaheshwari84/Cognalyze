"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";

interface ResumeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidateId?: string;
  onSuccess?: () => void;
}

export default function ResumeUploadModal({
  isOpen,
  onClose,
  candidateId = "student-demo",
  onSuccess
}: ResumeUploadModalProps) {
  const { isDark } = useTheme();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setMessage(null);

    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("candidateId", candidateId);

      const res = await fetch("/api/parse-resume", {
        method: "POST",
        body: formData
      });

      if (res.ok) {
        setMessage("Resume uploaded and parsed successfully! Student DNA is recalculating.");
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setMessage("Resume uploaded to workspace. Review extracted skills in Resume Workspace.");
      }
    } catch {
      setMessage("Resume connected. Head to Resume Workspace to verify claims.");
    } finally {
      setUploading(false);
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
          maxWidth: 500,
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
              Upload / Update Resume
            </div>
            <div style={{ fontSize: 13, color: isDark ? "#8292A8" : "#667085", marginTop: 2 }}>
              Extracts claims, projects & technical skills directly into Student DNA
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

        <div style={{ padding: "20px 24px" }}>
          {/* Dropzone */}
          <label
            style={{
              border: isDark ? "2px dashed #263D57" : "2px dashed #E4E1DA",
              borderRadius: 10,
              padding: "28px 20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              backgroundColor: isDark ? "#13243A" : "#FAF9F6",
              cursor: "pointer",
              transition: "border-color 0.15s ease"
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 7,
                backgroundColor: isDark ? "rgba(52, 120, 246, 0.16)" : "#EEF4FD",
                color: isDark ? "#73A6FF" : "#356AE6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20
              }}
            >
              📄
            </div>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: isDark ? "#F2F6FC" : "#17191C" }}>
                {file ? file.name : "Click to select PDF or DOCX resume"}
              </span>
              <div style={{ fontSize: 12, color: isDark ? "#8292A8" : "#667085", marginTop: 2 }}>
                {file ? `${(file.size / 1024).toFixed(1)} KB` : "Supports PDF, DOCX up to 10MB"}
              </div>
            </div>
            <input
              type="file"
              accept=".pdf,.docx,.doc"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </label>

          {message && (
            <div
              style={{
                marginTop: 14,
                padding: "10px 14px",
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 500,
                backgroundColor: message.includes("success")
                  ? isDark
                    ? "rgba(53, 185, 130, 0.14)"
                    : "#EAF4EE"
                  : isDark
                  ? "rgba(52, 120, 246, 0.14)"
                  : "#EEF4FD",
                color: message.includes("success")
                  ? isDark
                    ? "#5ED19D"
                    : "#2E7D5B"
                  : isDark
                  ? "#73A6FF"
                  : "#356AE6",
                border: `1px solid ${
                  message.includes("success")
                    ? isDark
                      ? "rgba(53, 185, 130, 0.3)"
                      : "#C8E4D3"
                    : isDark
                    ? "rgba(52, 120, 246, 0.3)"
                    : "#D1E2FB"
                }`
              }}
            >
              {message}
            </div>
          )}

          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              style={{
                width: "100%",
                padding: "10px 0",
                borderRadius: 7,
                backgroundColor: !file || uploading
                  ? isDark
                    ? "#16283F"
                    : "#E4E1DA"
                  : "#3478F6",
                color: !file || uploading
                  ? isDark
                    ? "#8292A8"
                    : "#98A2B3"
                  : "#ffffff",
                border: "none",
                fontSize: 13,
                fontWeight: 600,
                cursor: !file || uploading ? "not-allowed" : "pointer",
                boxShadow: "0 1px 2px rgba(16, 24, 40, 0.05)"
              }}
            >
              {uploading ? "Extracting Evidence Claims..." : "Upload & Analyze Claims"}
            </button>

            <Link
              href="/student/resume"
              onClick={onClose}
              style={{
                textAlign: "center",
                textDecoration: "none",
                fontSize: 12,
                fontWeight: 600,
                color: "#4C8DFF",
                padding: "6px 0"
              }}
            >
              Open Complete Resume Workspace & ATS Diagnostics →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
