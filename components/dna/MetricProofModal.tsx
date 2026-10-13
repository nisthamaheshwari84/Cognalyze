"use client";

import React from "react";
import { MetricProof } from "@/lib/dna/metric-proof";
import { X, Calculator, ShieldCheck, AlertCircle, Info, Database, Layers } from "lucide-react";

interface MetricProofModalProps {
  proof: MetricProof | null;
  onClose: () => void;
}

export default function MetricProofModal({ proof, onClose }: MetricProofModalProps) {
  if (!proof) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(15, 23, 42, 0.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: 16
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 12,
          maxWidth: 640,
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
          border: "1px solid #E2E8F0"
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "20px 24px",
            borderBottom: "1px solid #F1F5F9",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: "#EEF2F6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#162A43"
              }}
            >
              <Calculator size={18} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0F172A" }}>
                Metric Proof: {proof.displayName}
              </div>
              <div style={{ fontSize: 12, color: "#64748B" }}>
                Reproducible calculation with auditable record provenance
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#94A3B8",
              padding: 4,
              borderRadius: 6
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 24, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Main Stat Card */}
          <div
            style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: 10,
              padding: "16px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Calculated Value
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: "#0F172A", marginTop: 4 }}>
                {proof.displayText}
              </div>
            </div>
            <div
              style={{
                padding: "6px 12px",
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 600,
                background: proof.status === "READY" ? "#DCFCE7" : (proof.status === "NOT_ENOUGH_DATA" ? "#FEF9C3" : "#F1F5F9"),
                color: proof.status === "READY" ? "#166534" : (proof.status === "NOT_ENOUGH_DATA" ? "#854D0E" : "#475569")
              }}
            >
              {proof.status === "READY" ? "Grounded in Records" : (proof.status === "NOT_ENOUGH_DATA" ? "Insufficient Data" : proof.status)}
            </div>
          </div>

          {/* Formula */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <Layers size={14} color="#64748B" /> Exact Mathematical Formula
            </div>
            <div
              style={{
                background: "#0F172A",
                color: "#38BDF8",
                padding: "12px 16px",
                borderRadius: 8,
                fontFamily: "monospace",
                fontSize: 13,
                overflowX: "auto"
              }}
            >
              {proof.formula}
            </div>
          </div>

          {/* Numerator / Denominator (if applicable) */}
          {(typeof proof.numerator === "number" || typeof proof.denominator === "number") && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              {typeof proof.numerator === "number" && (
                <div style={{ padding: "12px 14px", background: "#F1F5F9", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#64748B" }}>Numerator (Inspected)</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>{proof.numerator}</div>
                </div>
              )}
              {typeof proof.denominator === "number" && (
                <div style={{ padding: "12px 14px", background: "#F1F5F9", borderRadius: 8, border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#64748B" }}>Denominator (Scope)</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#0F172A", marginTop: 2 }}>{proof.denominator}</div>
                </div>
              )}
            </div>
          )}

          {/* Deduplication Rule */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <ShieldCheck size={14} color="#16A34A" /> Deduplication & Ingestion Rule
            </div>
            <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.5, background: "#F8FAFC", padding: "10px 14px", borderRadius: 8, border: "1px solid #E2E8F0" }}>
              {proof.deduplicationRule}
            </div>
          </div>

          {/* Eligible Input IDs */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#334155", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <Database size={14} color="#64748B" /> Eligible Input Records ({proof.eligibleInputIds.length})
            </div>
            <div
              style={{
                maxHeight: 120,
                overflowY: "auto",
                background: "#F8FAFC",
                border: "1px solid #E2E8F0",
                borderRadius: 8,
                padding: "8px 12px",
                display: "flex",
                flexWrap: "wrap",
                gap: 6
              }}
            >
              {proof.eligibleInputIds.length > 0 ? (
                proof.eligibleInputIds.map((id) => (
                  <span
                    key={id}
                    style={{
                      fontSize: 11,
                      fontFamily: "monospace",
                      background: "#E2E8F0",
                      color: "#334155",
                      padding: "2px 6px",
                      borderRadius: 4
                    }}
                  >
                    {id}
                  </span>
                ))
              ) : (
                <span style={{ fontSize: 12, color: "#94A3B8", fontStyle: "italic" }}>
                  No matching input records in current pool.
                </span>
              )}
            </div>
          </div>

          {/* Limitations */}
          {proof.limitations && proof.limitations.length > 0 && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#B45309", display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <AlertCircle size={14} color="#D97706" /> Known Scoping Limitations
              </div>
              <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: "#64748B", lineHeight: 1.5 }}>
                {proof.limitations.map((lim, idx) => (
                  <li key={idx} style={{ marginBottom: 4 }}>{lim}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Provenance Footer */}
          <div
            style={{
              fontSize: 11,
              color: "#94A3B8",
              borderTop: "1px solid #F1F5F9",
              paddingTop: 12,
              display: "flex",
              justifyContent: "space-between"
            }}
          >
            <span>Engine: {proof.calculationVersion}</span>
            <span>Evaluated: {new Date(proof.calculationTimestamp).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
