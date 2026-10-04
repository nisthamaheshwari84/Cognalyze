"use client";

import React, { useState, useEffect, useRef } from "react";
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
  onSuccess,
}: ResumeUploadModalProps) {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<"file" | "paste">("file");
  const [file, setFile] = useState<File | null>(null);
  const [pasteText, setPasteText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadStage, setUploadStage] = useState<string>("");
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen && !uploading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, uploading]);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setFile(null);
      setPasteText("");
      setMessage(null);
      setUploading(false);
      setUploadStage("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileSelect = (selectedFile: File) => {
    if (selectedFile.size > 20 * 1024 * 1024) {
      setMessage({
        type: "error",
        text: "File exceeds 20MB limit. Please upload a condensed resume document.",
      });
      return;
    }
    setFile(selectedFile);
    setMessage(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (activeTab === "file" && !file) return;
    if (activeTab === "paste" && !pasteText.trim()) return;

    setUploading(true);
    setMessage(null);
    setUploadStage("Reading document content...");

    try {
      let res: Response;

      if (activeTab === "file" && file) {
        setUploadStage("Uploading document & parsing text...");
        const formData = new FormData();
        formData.append("resume", file);
        formData.append("candidateId", candidateId);

        res = await fetch("/api/parse-resume", {
          method: "POST",
          body: formData,
        });
      } else {
        setUploadStage("Extracting evidence claims & skills...");
        res = await fetch("/api/parse-resume", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resumeText: pasteText.trim(),
            candidateId,
            filename: "pasted_resume.txt",
          }),
        });
      }

      setUploadStage("Synchronizing with Student DNA & Opportunity Engine...");
      const data = await res.json().catch(() => null);

      if (res.ok && data?.success) {
        const skillsCount = data.skillsCount || 0;
        const projectsCount = data.projectsCount || 0;
        setMessage({
          type: "success",
          text: `Resume parsed successfully! Extracted ${skillsCount} skills and ${projectsCount} demonstrated projects into Student DNA.`,
        });

        // Trigger immediate dashboard refresh
        if (onSuccess) {
          onSuccess();
        }

        // Auto close after brief celebration so student sees the confirmed metrics
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        const errMsg =
          data?.userMessage ||
          data?.error ||
          "Could not extract evidence from this resume. Please ensure the file is not empty or password-protected.";
        setMessage({ type: "error", text: errMsg });
      }
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err?.message || "Network error while parsing resume. Please check your connection and try again.",
      });
    } finally {
      setUploading(false);
      setUploadStage("");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: isDark ? "rgba(3, 8, 16, 0.76)" : "rgba(22, 42, 67, 0.48)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={() => {
        if (!uploading) onClose();
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 520,
          backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
          borderRadius: 14,
          border: isDark ? "1px solid #223750" : "1px solid #E4E1DA",
          boxShadow: isDark
            ? "0 28px 56px -12px rgba(0, 0, 0, 0.65)"
            : "0 20px 40px -10px rgba(22, 42, 67, 0.22)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "18px 24px",
            borderBottom: isDark ? "1px solid #223750" : "1px solid #E4E1DA",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
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
            onClick={() => {
              if (!uploading) onClose();
            }}
            disabled={uploading}
            style={{
              width: 32,
              height: 32,
              borderRadius: 7,
              border: isDark ? "1px solid #2A435F" : "1px solid #E4E1DA",
              backgroundColor: isDark ? "#13243A" : "#F6F5F1",
              color: isDark ? "#B6C4D6" : "#667085",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: uploading ? "not-allowed" : "pointer",
              fontWeight: 600,
              fontSize: 14,
            }}
            title="Close"
          >
            ✕
          </button>
        </div>

        {/* Tab Toggle: Upload File vs Paste Text */}
        <div
          style={{
            display: "flex",
            padding: "12px 24px 0",
            gap: 8,
            backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
          }}
        >
          <button
            onClick={() => {
              setActiveTab("file");
              setMessage(null);
            }}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              backgroundColor: activeTab === "file" ? (isDark ? "#3478F6" : "#356AE6") : "transparent",
              color: activeTab === "file" ? "#ffffff" : isDark ? "#8292A8" : "#667085",
              transition: "all 0.15s ease",
            }}
          >
            📄 Upload Document (PDF / DOCX)
          </button>
          <button
            onClick={() => {
              setActiveTab("paste");
              setMessage(null);
            }}
            style={{
              padding: "6px 14px",
              borderRadius: 6,
              fontSize: 12,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              backgroundColor: activeTab === "paste" ? (isDark ? "#3478F6" : "#356AE6") : "transparent",
              color: activeTab === "paste" ? "#ffffff" : isDark ? "#8292A8" : "#667085",
              transition: "all 0.15s ease",
            }}
          >
            📝 Paste Resume Text
          </button>
        </div>

        {/* Modal Content */}
        <div style={{ padding: "18px 24px 22px" }}>
          {activeTab === "file" ? (
            <div>
              {/* Dropzone */}
              {!file ? (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: isDragging
                      ? "2px dashed #3478F6"
                      : isDark
                      ? "2px dashed #263D57"
                      : "2px dashed #CBD5E1",
                    borderRadius: 10,
                    padding: "32px 20px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    backgroundColor: isDragging
                      ? isDark
                        ? "rgba(52, 120, 246, 0.12)"
                        : "#EEF4FD"
                      : isDark
                      ? "#13243A"
                      : "#FAF9F6",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 9,
                      backgroundColor: isDark ? "rgba(52, 120, 246, 0.16)" : "#EEF4FD",
                      color: isDark ? "#73A6FF" : "#356AE6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 22,
                    }}
                  >
                    📄
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: isDark ? "#F2F6FC" : "#17191C" }}>
                      Click to choose or drag & drop resume
                    </span>
                    <div style={{ fontSize: 12, color: isDark ? "#8292A8" : "#667085", marginTop: 4 }}>
                      Supports PDF, DOCX, DOC, TXT (up to 20MB)
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.doc,.txt"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                </div>
              ) : (
                /* Selected File Card */
                <div
                  style={{
                    border: isDark ? "1px solid #2B4565" : "1px solid #D0D5DD",
                    borderRadius: 10,
                    padding: "16px 18px",
                    backgroundColor: isDark ? "#13243A" : "#F8FAFC",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12, overflow: "hidden" }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 8,
                        backgroundColor: isDark ? "rgba(52, 120, 246, 0.2)" : "#EEF4FD",
                        color: isDark ? "#73A6FF" : "#356AE6",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        flexShrink: 0,
                      }}
                    >
                      {file.name.toLowerCase().endsWith(".pdf")
                        ? "📕"
                        : file.name.toLowerCase().endsWith(".docx") || file.name.toLowerCase().endsWith(".doc")
                        ? "📘"
                        : "📄"}
                    </div>
                    <div style={{ overflow: "hidden" }}>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: isDark ? "#F2F6FC" : "#162A43",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                        }}
                      >
                        {file.name}
                      </div>
                      <div style={{ fontSize: 11, color: isDark ? "#8292A8" : "#667085", marginTop: 2 }}>
                        {(file.size / 1024).toFixed(1)} KB · Ready to analyze
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setFile(null);
                      setMessage(null);
                    }}
                    disabled={uploading}
                    style={{
                      border: "none",
                      backgroundColor: "transparent",
                      color: isDark ? "#8292A8" : "#667085",
                      cursor: uploading ? "not-allowed" : "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                      padding: "4px 8px",
                      borderRadius: 4,
                    }}
                  >
                    Change
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Paste Text Mode */
            <div>
              <textarea
                value={pasteText}
                onChange={(e) => {
                  setPasteText(e.target.value);
                  setMessage(null);
                }}
                placeholder="Paste your full resume text here (Contact, Skills, Projects, Experience, Education)..."
                rows={8}
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: "monospace",
                  backgroundColor: isDark ? "#13243A" : "#FAF9F6",
                  color: isDark ? "#F2F6FC" : "#17191C",
                  border: isDark ? "1px solid #263D57" : "1px solid #CBD5E1",
                  resize: "vertical",
                  outline: "none",
                  lineHeight: 1.5,
                }}
              />
              <div
                style={{
                  fontSize: 11,
                  color: isDark ? "#8292A8" : "#667085",
                  marginTop: 4,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>Extracts skills, projects, and evidence claims instantly</span>
                <span>{pasteText.trim().length} chars</span>
              </div>
            </div>
          )}

          {/* Upload Progress / Stage Indicator */}
          {uploading && (
            <div
              style={{
                marginTop: 14,
                padding: "10px 14px",
                borderRadius: 8,
                backgroundColor: isDark ? "rgba(52, 120, 246, 0.12)" : "#EEF4FD",
                border: isDark ? "1px solid rgba(52, 120, 246, 0.28)" : "1px solid #D1E2FB",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  border: "2px solid #3478F6",
                  borderTopColor: "transparent",
                  borderRadius: "50%",
                  animation: "spin 0.8s linear infinite",
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 500, color: isDark ? "#73A6FF" : "#356AE6" }}>
                {uploadStage || "Processing resume evidence..."}
              </span>
              <style jsx>{`
                @keyframes spin {
                  to {
                    transform: rotate(360deg);
                  }
                }
              `}</style>
            </div>
          )}

          {/* Feedback Message */}
          {message && !uploading && (
            <div
              style={{
                marginTop: 14,
                padding: "10px 14px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 500,
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                backgroundColor:
                  message.type === "success"
                    ? isDark
                      ? "rgba(53, 185, 130, 0.14)"
                      : "#EAF4EE"
                    : isDark
                    ? "rgba(240, 82, 82, 0.14)"
                    : "#FEEBEB",
                color:
                  message.type === "success"
                    ? isDark
                      ? "#5ED19D"
                      : "#2E7D5B"
                    : isDark
                    ? "#F87171"
                    : "#DC2626",
                border: `1px solid ${
                  message.type === "success"
                    ? isDark
                      ? "rgba(53, 185, 130, 0.3)"
                      : "#C8E4D3"
                    : isDark
                    ? "rgba(240, 82, 82, 0.3)"
                    : "#FCA5A5"
                }`,
              }}
            >
              <span style={{ fontSize: 14 }}>{message.type === "success" ? "✓" : "⚠️"}</span>
              <span style={{ flex: 1, lineHeight: 1.4 }}>{message.text}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 8 }}>
            <button
              onClick={handleUpload}
              disabled={
                uploading ||
                (activeTab === "file" && !file) ||
                (activeTab === "paste" && !pasteText.trim())
              }
              style={{
                width: "100%",
                padding: "11px 0",
                borderRadius: 8,
                backgroundColor:
                  uploading ||
                  (activeTab === "file" && !file) ||
                  (activeTab === "paste" && !pasteText.trim())
                    ? isDark
                      ? "#16283F"
                      : "#E4E1DA"
                    : "#3478F6",
                color:
                  uploading ||
                  (activeTab === "file" && !file) ||
                  (activeTab === "paste" && !pasteText.trim())
                    ? isDark
                      ? "#8292A8"
                      : "#98A2B3"
                    : "#ffffff",
                border: "none",
                fontSize: 13,
                fontWeight: 600,
                cursor:
                  uploading ||
                  (activeTab === "file" && !file) ||
                  (activeTab === "paste" && !pasteText.trim())
                    ? "not-allowed"
                    : "pointer",
                boxShadow: "0 1px 2px rgba(16, 24, 40, 0.05)",
                transition: "background 0.15s ease",
              }}
            >
              {uploading
                ? "Analyzing & Updating Student DNA..."
                : "Upload & Recalculate Student DNA"}
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
                padding: "6px 0",
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
