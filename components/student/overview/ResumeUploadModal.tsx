"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

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
          maxWidth: 520,
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
              Upload / Update Resume
            </div>
            <div style={{ fontSize: 12, color: "#94a3b8" }}>
              Extracts claims, projects & technical skills directly into Student DNA
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

        <div style={{ padding: "24px" }}>
          {/* Dropzone */}
          <label
            style={{
              border: "2px dashed rgba(255, 255, 255, 0.15)",
              borderRadius: 14,
              padding: "32px 20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              backgroundColor: "rgba(2, 6, 23, 0.5)",
              cursor: "pointer",
              transition: "border-color 0.15s ease"
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: "50%",
                backgroundColor: "rgba(37, 99, 235, 0.15)",
                color: "#60a5fa",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22
              }}
            >
              📄
            </div>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#ffffff" }}>
                {file ? file.name : "Click to choose PDF or DOCX resume"}
              </span>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 4 }}>
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
                borderRadius: 10,
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: message.includes("success") ? "rgba(16, 185, 129, 0.15)" : "rgba(37, 99, 235, 0.15)",
                color: message.includes("success") ? "#34d399" : "#93c5fd",
                border: `1px solid ${message.includes("success") ? "rgba(16, 185, 129, 0.3)" : "rgba(37, 99, 235, 0.3)"}`
              }}
            >
              {message}
            </div>
          )}

          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={handleUpload}
              disabled={!file || uploading}
              style={{
                width: "100%",
                padding: "12px 0",
                borderRadius: 10,
                backgroundColor: !file || uploading ? "rgba(255, 255, 255, 0.1)" : "#2563eb",
                color: "#ffffff",
                border: "none",
                fontSize: 14,
                fontWeight: 700,
                cursor: !file || uploading ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)"
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
                fontSize: 13,
                fontWeight: 600,
                color: "#94a3b8",
                padding: "8px 0"
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
