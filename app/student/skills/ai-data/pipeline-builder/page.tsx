"use client";

import React, { useState, useEffect, Suspense, useMemo } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { useTheme } from "@/components/ThemeProvider";
import {
  PipelineDefinition,
  PipelineRunReport,
  StageExecutionResult
} from "@/lib/skills/ai-data/pipeline-builder-engine";

const STARTER_PIPELINES: Record<string, { name: string; description: string; pipeline: PipelineDefinition }> = {
  ecommerce_analytics: {
    name: "E-Commerce Transaction ETL Pipeline",
    description: "Ingests raw order records, validates schema, filters corrupt rows, verifies non-negative revenue, and loads to analytics store.",
    pipeline: {
      id: "pipe-ecommerce-etl",
      name: "E-Commerce Daily Transaction Ingestion",
      description: "Daily automated order and revenue processing",
      stages: [
        {
          id: "stg-source",
          name: "Raw Ingestion (Orders Stream)",
          type: "source_ingest",
          config: { sourceTable: "orders" },
          dependsOn: []
        },
        {
          id: "stg-schema",
          name: "Schema & Type Validator",
          type: "schema_validation",
          config: { requiredColumns: ["order_id", "user_id", "amount", "status"] },
          dependsOn: ["stg-source"]
        },
        {
          id: "stg-clean",
          name: "Drop Null User IDs",
          type: "cleaning",
          config: { nonNullColumns: ["user_id", "order_id"] },
          dependsOn: ["stg-schema"]
        },
        {
          id: "stg-filter",
          name: "Filter Valid Orders",
          type: "filtering",
          config: { filter_column: "status", allowed_values: ["completed"] },
          dependsOn: ["stg-clean"]
        },
        {
          id: "stg-quality",
          name: "Quality Gate: Positive Amounts",
          type: "quality_check",
          config: { assert_positive_amount: true },
          dependsOn: ["stg-filter"]
        },
        {
          id: "stg-sink",
          name: "Materialize Analytics Sink",
          type: "sink_export",
          config: { sinkName: "fct_orders_clean" },
          dependsOn: ["stg-quality"]
        }
      ]
    }
  },
  feature_store: {
    name: "ML User Retention Feature Pipeline",
    description: "Filters cancelled events, imputes numerical features, and stages normalized records for ML model training.",
    pipeline: {
      id: "pipe-ml-features",
      name: "User Churn Feature Engineering Pipeline",
      description: "Batch feature transformation for churn models",
      stages: [
        {
          id: "stg-src",
          name: "Customer Events Source",
          type: "source_ingest",
          config: { sourceTable: "customer_churn" },
          dependsOn: []
        },
        {
          id: "stg-clean2",
          name: "Clean Null Values",
          type: "cleaning",
          config: {},
          dependsOn: ["stg-src"]
        },
        {
          id: "stg-filter2",
          name: "Filter Active Subscriptions",
          type: "filtering",
          config: { filter_column: "status", allowed_values: ["completed"] },
          dependsOn: ["stg-clean2"]
        },
        {
          id: "stg-feat",
          name: "Derive High Value Feature",
          type: "feature_prep",
          config: {},
          dependsOn: ["stg-filter2"]
        },
        {
          id: "stg-quality2",
          name: "Assert Valid PKs",
          type: "quality_check",
          config: { assert_unique_pk: "order_id" },
          dependsOn: ["stg-feat"]
        },
        {
          id: "stg-sink2",
          name: "Output to Feature Store",
          type: "sink_export",
          config: { sinkName: "ml_feature_store_churn" },
          dependsOn: ["stg-quality2"]
        }
      ]
    }
  }
};

const STAGE_TYPE_ICONS: Record<string, string> = {
  source_ingest: "📥",
  schema_validation: "📋",
  cleaning: "🧹",
  transformation: "🔄",
  filtering: "🔍",
  feature_prep: "🛠️",
  model_inference: "🧠",
  quality_check: "🛡️",
  sink_export: "💾"
};

function PipelineBuilderContent() {
  const { isDark } = useTheme();

  const [activePipelineKey, setActivePipelineKey] = useState<string>("ecommerce_analytics");
  const [pipeline, setPipeline] = useState<PipelineDefinition>(STARTER_PIPELINES.ecommerce_analytics.pipeline);
  const [injectFault, setInjectFault] = useState<boolean>(false);
  const [executing, setExecuting] = useState<boolean>(false);
  const [report, setReport] = useState<PipelineRunReport | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<string>("stg-source");

  const runPipelineWithParams = async (targetPipeline: PipelineDefinition, fault: boolean) => {
    setExecuting(true);
    try {
      const res = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute_pipeline",
          pipeline: targetPipeline,
          injectFailure: fault
        })
      });
      const data = await res.json();
      if (data.success && data.result) {
        setReport(data.result);
        if (data.result.stageResults && data.result.stageResults.length > 0) {
          setSelectedStageId(data.result.stageResults[0].stageId);
        }
      }
    } catch (err: any) {
      console.error("Pipeline execution error:", err);
    } finally {
      setExecuting(false);
    }
  };

  useEffect(() => {
    runPipelineWithParams(pipeline, injectFault);
  }, []);

  const selectedStageResult: StageExecutionResult | undefined = useMemo(() => {
    if (!report || !report.stageResults) return undefined;
    return report.stageResults.find((s) => s.stageId === selectedStageId) || report.stageResults[0];
  }, [report, selectedStageId]);

  const handleTemplateChange = (key: string) => {
    if (STARTER_PIPELINES[key]) {
      const nextPipe = JSON.parse(JSON.stringify(STARTER_PIPELINES[key].pipeline));
      setActivePipelineKey(key);
      setPipeline(nextPipe);
      setSelectedStageId(nextPipe.stages[0]?.id || "");
      runPipelineWithParams(nextPipe, injectFault);
    }
  };

  const handleRunPipeline = async () => {
    runPipelineWithParams(pipeline, injectFault);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: isDark ? "#0A0F1D" : "#F7F9FC",
        color: isDark ? "#F2F6FC" : "#17191C",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      }}
    >
      <AppNav role="student" />

      {/* ── TOP HEADER / BREADCRUMB ── */}
      <header
        style={{
          borderBottom: `1px solid ${isDark ? "#1E2A3B" : "#E4E1DA"}`,
          backgroundColor: isDark ? "#0E1726" : "#FFFFFF",
          padding: "12px 24px",
          position: "sticky",
          top: 56,
          zIndex: 30
        }}
      >
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <Link href="/student/skills/ai-data" style={{ color: "#667085", textDecoration: "none", fontSize: 11.5, fontWeight: 600 }}>
                ← AI, Data & Intelligence Arena
              </Link>
              <span style={{ color: "#98A2B3" }}>/</span>
              <span style={{ color: "#356AE6", fontSize: 11.5, fontWeight: 700 }}>Data & ML Pipeline Builder</span>
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: isDark ? "#FFFFFF" : "#162A43", display: "flex", alignItems: "center", gap: 8 }}>
              <span>⚡</span> Data &amp; ML Production Pipeline Builder &amp; Stage Inspector
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
              <span style={{ color: "#64748B", fontWeight: 600 }}>Pipeline:</span>
              <select
                value={activePipelineKey}
                onChange={(e) => handleTemplateChange(e.target.value)}
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  padding: "6px 10px",
                  borderRadius: 6,
                  backgroundColor: isDark ? "#16253C" : "#FFFFFF",
                  border: `1px solid ${isDark ? "#2A3F5F" : "#CBD5E1"}`,
                  color: isDark ? "#FFFFFF" : "#1E293B"
                }}
              >
                <option value="ecommerce_analytics">E-Commerce Transaction ETL</option>
                <option value="feature_store">ML Feature Store Pipeline</option>
              </select>
            </div>

            {/* Injected Fault Toggle */}
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 11.5,
                fontWeight: 600,
                color: injectFault ? "#EF4444" : "#64748B",
                cursor: "pointer",
                padding: "6px 10px",
                borderRadius: 6,
                backgroundColor: injectFault ? (isDark ? "#3B1818" : "#FEF2F2") : (isDark ? "#16253C" : "#F8FAFC"),
                border: `1px solid ${injectFault ? "#EF4444" : (isDark ? "#2A3F5F" : "#E2E8F0")}`
              }}
            >
              <input
                type="checkbox"
                checked={injectFault}
                onChange={(e) => setInjectFault(e.target.checked)}
              />
              <span>Inject Corrupted Row (Test Quality Gate)</span>
            </label>

            <button
              onClick={handleRunPipeline}
              disabled={executing}
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: "8px 18px",
                borderRadius: 6,
                backgroundColor: "#10B981",
                color: "#FFFFFF",
                border: "none",
                cursor: executing ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              {executing ? "Running..." : "▶ Execute Pipeline DAG"}
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN STUDIO CONTENT ── */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "16px 24px", display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
        
        {/* ── LEFT COLUMN: VISUAL DAG STAGES FLOW ── */}
        <div
          style={{
            backgroundColor: isDark ? "#111C2E" : "#FFFFFF",
            border: `1px solid ${isDark ? "#22334A" : "#E2E8F0"}`,
            borderRadius: 8,
            padding: 18,
            display: "flex",
            flexDirection: "column",
            gap: 14
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, margin: 0, color: isDark ? "#FFFFFF" : "#1E293B" }}>
                {pipeline.name}
              </h2>
              <div style={{ fontSize: 11.5, color: "#64748B", marginTop: 2 }}>
                Sequential DAG execution with intermediate rowset inspection and schema contracts.
              </div>
            </div>
            {report && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: "4px 10px",
                  borderRadius: 4,
                  backgroundColor: report.success ? "#ECFDF5" : "#FEF2F2",
                  color: report.success ? "#047857" : "#B91C1C",
                  border: `1px solid ${report.success ? "#10B981" : "#EF4444"}`
                }}
              >
                {report.success ? `✓ SUCCESS (${report.totalDurationMs}ms)` : "✕ FAILED AT GATE"}
              </span>
            )}
          </div>

          {/* Sequential Stages List */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
            {pipeline.stages.map((stage, index) => {
              const stageRes = report?.stageResults?.find((s: StageExecutionResult) => s.stageId === stage.id);
              const isSelected = stage.id === selectedStageId;
              const icon = STAGE_TYPE_ICONS[stage.type] || "📦";

              let statusColor = isDark ? "#2A3F5F" : "#CBD5E1";
              let statusLabel = "PENDING";
              if (stageRes) {
                if (stageRes.status === "SUCCESS") {
                  statusColor = "#10B981";
                  statusLabel = "SUCCESS";
                } else if (stageRes.status === "FAILED") {
                  statusColor = "#EF4444";
                  statusLabel = "FAILED";
                } else if (stageRes.status === "SKIPPED") {
                  statusColor = isDark ? "#4B5563" : "#94A3B8";
                  statusLabel = "SKIPPED";
                } else {
                  statusColor = "#F59E0B";
                  statusLabel = "RUNNING";
                }
              }

              return (
                <div key={stage.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div
                    onClick={() => setSelectedStageId(stage.id)}
                    style={{
                      width: "100%",
                      padding: "12px 16px",
                      borderRadius: 8,
                      border: `2px solid ${isSelected ? "#356AE6" : (stageRes?.status === "FAILED" ? "#EF4444" : (isDark ? "#22334A" : "#E2E8F0"))}`,
                      backgroundColor: isDark ? "#16253C" : (isSelected ? "#EFF4FE" : "#F8FAFC"),
                      boxShadow: isSelected ? "0 0 0 3px rgba(53, 106, 230, 0.2)" : "none",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ fontSize: 20 }}>{icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? "#FFFFFF" : "#1E293B" }}>
                          Stage {index + 1}: {stage.name}
                        </div>
                        <div style={{ fontSize: 11, color: "#64748B" }}>
                          Type: <strong style={{ color: "#356AE6" }}>{stage.type}</strong>
                          {stageRes && (
                            <span> • Rows: {stageRes.inputRowCount} ➔ {stageRes.outputRowCount}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {stageRes && (
                        <span style={{ fontSize: 11, color: "#64748B" }}>
                          {stageRes.durationMs}ms
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 800,
                          padding: "2px 8px",
                          borderRadius: 4,
                          backgroundColor: stageRes ? (stageRes.status === "SUCCESS" ? "#ECFDF5" : "#FEF2F2") : (isDark ? "#233857" : "#E2E8F0"),
                          color: stageRes ? (stageRes.status === "SUCCESS" ? "#047857" : "#B91C1C") : "#64748B"
                        }}
                      >
                        {statusLabel}
                      </span>
                    </div>
                  </div>

                  {index < pipeline.stages.length - 1 && (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", margin: "2px 0" }}>
                      <div style={{ width: 2, height: 12, backgroundColor: isDark ? "#334155" : "#CBD5E1" }} />
                      <span style={{ fontSize: 9, color: isDark ? "#64748B" : "#94A3B8" }}>▼</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT COLUMN: INTERMEDIATE ROWSET & SCHEMA INSPECTOR ── */}
        <div
          style={{
            backgroundColor: isDark ? "#111C2E" : "#FFFFFF",
            border: `1px solid ${isDark ? "#22334A" : "#E2E8F0"}`,
            borderRadius: 8,
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            height: "fit-content"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#64748B" }}>
              Intermediate Rowset &amp; Schema Inspector
            </span>
            <span style={{ fontSize: 11, fontFamily: "monospace", color: "#94A3B8" }}>
              {selectedStageId}
            </span>
          </div>

          {!report && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748B" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⚡</div>
              <div style={{ fontSize: 13, fontWeight: 600 }}>No pipeline run executed yet.</div>
              <div style={{ fontSize: 12, marginTop: 4 }}>
                Click &quot;Execute Pipeline DAG&quot; to execute real data transformations and inspect rowsets at each stage.
              </div>
            </div>
          )}

          {report && selectedStageResult && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              
              {/* Stage error alert if failed */}
              {selectedStageResult.status === "FAILED" && (
                <div
                  style={{
                    padding: 10,
                    borderRadius: 6,
                    backgroundColor: "#FEF2F2",
                    border: "1px solid #F87171",
                    color: "#991B1B",
                    fontSize: 12
                  }}
                >
                  <div style={{ fontWeight: 800, marginBottom: 2 }}>⚠️ STAGE ERROR DETECTED:</div>
                  <div>{selectedStageResult.errorMessage}</div>
                  <div style={{ fontSize: 11, marginTop: 4, color: "#7F1D1D" }}>
                    Recommendation: Verify schema validation rules or uncheck &quot;Inject Corrupted Row&quot; to test happy-path flow.
                  </div>
                </div>
              )}

              {/* Stage Status & Row Telemetry */}
              <div
                style={{
                  padding: 10,
                  borderRadius: 6,
                  backgroundColor: isDark ? "#16253C" : "#F8FAFC",
                  fontSize: 11.5,
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 8
                }}
              >
                <div>
                  <span style={{ color: "#64748B" }}>Stage Name:</span>
                  <div style={{ fontWeight: 700, color: isDark ? "#FFFFFF" : "#1E293B" }}>
                    {selectedStageResult.stageName}
                  </div>
                </div>
                <div>
                  <span style={{ color: "#64748B" }}>Execution Duration:</span>
                  <div style={{ fontWeight: 700, color: "#356AE6" }}>
                    {selectedStageResult.durationMs}ms
                  </div>
                </div>
                <div>
                  <span style={{ color: "#64748B" }}>Input Rows:</span>
                  <div style={{ fontWeight: 700 }}>{selectedStageResult.inputRowCount}</div>
                </div>
                <div>
                  <span style={{ color: "#64748B" }}>Output Rows:</span>
                  <div style={{ fontWeight: 700, color: "#10B981" }}>{selectedStageResult.outputRowCount}</div>
                </div>
              </div>

              {/* Intermediate Rows Table Preview */}
              <div>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: "#64748B", marginBottom: 6 }}>
                  Sample Rowset Preview ({selectedStageResult.sampleOutput?.length || 0} rows):
                </div>

                {(!selectedStageResult.sampleOutput || selectedStageResult.sampleOutput.length === 0) ? (
                  <div style={{ fontSize: 11, color: "#64748B", fontStyle: "italic" }}>
                    No rows passed or stage failed before output generation.
                  </div>
                ) : (
                  <div style={{ overflowX: "auto", border: `1px solid ${isDark ? "#2A3F5F" : "#E2E8F0"}`, borderRadius: 6 }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "monospace" }}>
                      <thead>
                        <tr style={{ backgroundColor: isDark ? "#16253C" : "#F1F5F9", borderBottom: `1px solid ${isDark ? "#2A3F5F" : "#CBD5E1"}` }}>
                          {Object.keys(selectedStageResult.sampleOutput[0] || {}).map((col: string) => (
                            <th key={col} style={{ padding: "6px 8px", textAlign: "left", color: "#64748B", fontWeight: 700 }}>
                              {col}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedStageResult.sampleOutput.map((row: Record<string, any>, rIdx: number) => (
                          <tr
                            key={rIdx}
                            style={{
                              borderBottom: `1px solid ${isDark ? "#1E2A3B" : "#F1F5F9"}`,
                              backgroundColor: rIdx % 2 === 0 ? "transparent" : (isDark ? "#0E1726" : "#FAFAFA")
                            }}
                          >
                            {Object.values(row).map((val: any, cIdx: number) => (
                              <td key={cIdx} style={{ padding: "6px 8px", color: isDark ? "#E2E8F0" : "#1E293B" }}>
                                {String(val)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PipelineBuilderPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>Loading Pipeline Builder...</div>}>
      <PipelineBuilderContent />
    </Suspense>
  );
}
