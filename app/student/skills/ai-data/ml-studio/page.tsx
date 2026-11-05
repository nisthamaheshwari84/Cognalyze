"use client";

import React, { useState, Suspense, useMemo } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { useTheme } from "@/components/ThemeProvider";
import {
  ML_STUDIO_DATASETS,
  ModelAlgorithm,
  ExperimentRunResult
} from "@/lib/skills/ai-data/ml-studio-engine";

const datasetList = Object.values(ML_STUDIO_DATASETS);

function MlStudioContent() {
  const { isDark } = useTheme();

  const [selectedDatasetId, setSelectedDatasetId] = useState<string>("customer_churn");
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<ModelAlgorithm>("logistic_regression");
  const [learningRate, setLearningRate] = useState<number>(0.05);
  const [epochs, setEpochs] = useState<number>(100);
  const [regularization, setRegularization] = useState<number>(0.01);
  const [scaling, setScaling] = useState<"standard" | "minmax" | "none">("standard");

  const [training, setTraining] = useState<boolean>(false);
  const [currentResult, setCurrentResult] = useState<ExperimentRunResult | null>(null);
  const [runHistory, setRunHistory] = useState<ExperimentRunResult[]>([]);

  const activeDataset = useMemo(() => {
    return ML_STUDIO_DATASETS[selectedDatasetId] || datasetList[0];
  }, [selectedDatasetId]);

  const handleDatasetChange = (id: string) => {
    setSelectedDatasetId(id);
    if (id === "housing_prices") {
      setSelectedAlgorithm("linear_regression");
    } else {
      setSelectedAlgorithm("logistic_regression");
    }
    setCurrentResult(null);
  };

  const handleRunTraining = async () => {
    setTraining(true);
    try {
      const features = activeDataset.features.map((f: any) => f.name);
      const res = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "train_ml_model",
          datasetId: selectedDatasetId,
          selectedFeatures: features,
          config: {
            algorithm: selectedAlgorithm,
            learningRate,
            epochs,
            regularizationLambda: regularization,
            scaling
          }
        })
      });
      const data = await res.json();
      if (data.success && data.result) {
        setCurrentResult(data.result);
        setRunHistory((prev) => [data.result, ...prev.slice(0, 9)]);
      } else {
        alert(data.error || "Training failed");
      }
    } catch (err: any) {
      alert("Error training model: " + err.message);
    } finally {
      setTraining(false);
    }
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
              <span style={{ color: "#356AE6", fontSize: 11.5, fontWeight: 700 }}>ML Experiment Studio</span>
            </div>
            <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: isDark ? "#FFFFFF" : "#162A43", display: "flex", alignItems: "center", gap: 8 }}>
              <span>🔬</span> Machine Learning Experiment & Evaluation Studio
            </h1>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={handleRunTraining}
              disabled={training}
              style={{
                fontSize: 12,
                fontWeight: 700,
                padding: "8px 20px",
                borderRadius: 6,
                backgroundColor: "#356AE6",
                color: "#FFFFFF",
                border: "none",
                cursor: training ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 2px 4px rgba(53, 106, 230, 0.25)"
              }}
            >
              {training ? "⏳ Training Model..." : "▶ Train & Evaluate Model"}
            </button>
          </div>
        </div>
      </header>

      {/* ── MAIN STUDIO CONTENT ── */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "16px 24px", display: "grid", gridTemplateColumns: "300px 1fr 300px", gap: 16 }}>
        
        {/* ── LEFT COLUMN: DATASET WORKSPACE & PREPROCESSING ── */}
        <div
          style={{
            backgroundColor: isDark ? "#111C2E" : "#FFFFFF",
            border: `1px solid ${isDark ? "#22334A" : "#E2E8F0"}`,
            borderRadius: 8,
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 14,
            height: "fit-content"
          }}
        >
          {/* Dataset Selector */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#64748B", marginBottom: 6 }}>
              1. Benchmark Dataset
            </div>
            <select
              value={selectedDatasetId}
              onChange={(e) => handleDatasetChange(e.target.value)}
              style={{
                width: "100%",
                padding: "7px 10px",
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: isDark ? "#16253C" : "#F8FAFC",
                border: `1px solid ${isDark ? "#2A3F5F" : "#CBD5E1"}`,
                color: isDark ? "#FFFFFF" : "#1E293B"
              }}
            >
              {datasetList.map((d: any) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.taskType})
                </option>
              ))}
            </select>
          </div>

          {/* Dataset Details Card */}
          <div
            style={{
              padding: 10,
              borderRadius: 6,
              backgroundColor: isDark ? "#16253C" : "#F8FAFC",
              fontSize: 11.5,
              display: "flex",
              flexDirection: "column",
              gap: 4
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748B" }}>Total Samples:</span>
              <strong style={{ color: isDark ? "#FFFFFF" : "#1E293B" }}>{activeDataset.rows.length} rows</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748B" }}>Feature Count:</span>
              <strong style={{ color: isDark ? "#FFFFFF" : "#1E293B" }}>{activeDataset.features.length} features</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748B" }}>Target Column:</span>
              <strong style={{ color: "#356AE6" }}>{activeDataset.targetColumn}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#64748B" }}>Task Type:</span>
              <span style={{ textTransform: "capitalize", fontWeight: 700, color: "#10B981" }}>{activeDataset.taskType}</span>
            </div>
          </div>

          <hr style={{ borderColor: isDark ? "#1E2A3B" : "#F1F5F9", margin: "2px 0" }} />

          {/* Preprocessing Controls */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#64748B", marginBottom: 8 }}>
              2. Preprocessing &amp; Scaling
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, fontSize: 11.5 }}>
              <div>
                <label style={{ display: "block", color: "#64748B", marginBottom: 3 }}>Feature Scaling</label>
                <select
                  value={scaling}
                  onChange={(e) => setScaling(e.target.value as any)}
                  style={{
                    width: "100%",
                    padding: "6px 8px",
                    borderRadius: 4,
                    fontSize: 11.5,
                    backgroundColor: isDark ? "#16253C" : "#FFFFFF",
                    border: `1px solid ${isDark ? "#2A3F5F" : "#CBD5E1"}`,
                    color: isDark ? "#FFFFFF" : "#1E293B"
                  }}
                >
                  <option value="standard">StandardScaler (Zero mean, unit variance)</option>
                  <option value="minmax">MinMaxScaler [0, 1]</option>
                  <option value="none">None (Raw numerical features)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── CENTER COLUMN: ALGORITHM, METRICS & VISUALIZATIONS ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          
          {/* Algorithm & Hyperparameter Bar */}
          <div
            style={{
              backgroundColor: isDark ? "#111C2E" : "#FFFFFF",
              border: `1px solid ${isDark ? "#22334A" : "#E2E8F0"}`,
              borderRadius: 8,
              padding: 14,
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr 1fr 1fr",
              gap: 12,
              alignItems: "center"
            }}
          >
            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 3 }}>
                Algorithm Architecture
              </label>
              <select
                value={selectedAlgorithm}
                onChange={(e) => setSelectedAlgorithm(e.target.value as ModelAlgorithm)}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 4,
                  fontSize: 12,
                  fontWeight: 600,
                  backgroundColor: isDark ? "#16253C" : "#FFFFFF",
                  border: `1px solid ${isDark ? "#2A3F5F" : "#CBD5E1"}`,
                  color: isDark ? "#FFFFFF" : "#1E293B"
                }}
              >
                {activeDataset.taskType === "classification" ? (
                  <>
                    <option value="logistic_regression">Logistic Regression (L2)</option>
                    <option value="decision_tree">Decision Tree Classifier</option>
                    <option value="random_forest">Random Forest Classifier (Ensemble)</option>
                  </>
                ) : (
                  <>
                    <option value="linear_regression">Linear Regression (OLS)</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 3 }}>
                Learning Rate (α)
              </label>
              <input
                type="number"
                min="0.001"
                max="1.0"
                step="0.01"
                value={learningRate}
                onChange={(e) => setLearningRate(parseFloat(e.target.value))}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 4,
                  fontSize: 12,
                  backgroundColor: isDark ? "#16253C" : "#FFFFFF",
                  border: `1px solid ${isDark ? "#2A3F5F" : "#CBD5E1"}`,
                  color: isDark ? "#FFFFFF" : "#1E293B"
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 3 }}>
                Iterations / Epochs
              </label>
              <input
                type="number"
                min="10"
                max="500"
                step="10"
                value={epochs}
                onChange={(e) => setEpochs(parseInt(e.target.value, 10))}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 4,
                  fontSize: 12,
                  backgroundColor: isDark ? "#16253C" : "#FFFFFF",
                  border: `1px solid ${isDark ? "#2A3F5F" : "#CBD5E1"}`,
                  color: isDark ? "#FFFFFF" : "#1E293B"
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11, fontWeight: 700, color: "#64748B", display: "block", marginBottom: 3 }}>
                Regularization (λ)
              </label>
              <input
                type="number"
                min="0"
                max="0.5"
                step="0.01"
                value={regularization}
                onChange={(e) => setRegularization(parseFloat(e.target.value))}
                style={{
                  width: "100%",
                  padding: "6px 8px",
                  borderRadius: 4,
                  fontSize: 12,
                  backgroundColor: isDark ? "#16253C" : "#FFFFFF",
                  border: `1px solid ${isDark ? "#2A3F5F" : "#CBD5E1"}`,
                  color: isDark ? "#FFFFFF" : "#1E293B"
                }}
              />
            </div>
          </div>

          {/* Results Display Area */}
          <div
            style={{
              backgroundColor: isDark ? "#111C2E" : "#FFFFFF",
              border: `1px solid ${isDark ? "#22334A" : "#E2E8F0"}`,
              borderRadius: 8,
              padding: 16,
              minHeight: 460
            }}
          >
            {!currentResult && !training && (
              <div style={{ textAlign: "center", padding: "80px 20px", color: "#64748B" }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>📊</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: isDark ? "#FFFFFF" : "#1E293B" }}>
                  Ready to Train Real Machine Learning Model
                </div>
                <div style={{ fontSize: 12, marginTop: 4, maxWidth: 440, margin: "6px auto 0" }}>
                  Select benchmark parameters, configure hyperparameters, and press &quot;Train &amp; Evaluate Model&quot; to compute genuine training telemetry and confusion matrices.
                </div>
              </div>
            )}

            {training && (
              <div style={{ textAlign: "center", padding: "80px 20px", color: "#356AE6" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>⏳</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Executing Model Fitting &amp; Optimization...</div>
                <div style={{ fontSize: 12, color: "#64748B", marginTop: 4 }}>
                  Computing test metrics, cross-entropy loss, and diagnostics.
                </div>
              </div>
            )}

            {currentResult && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                
                {/* Target Leakage Warning Banner */}
                {currentResult.diagnostics?.leakageDetected && (
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: 6,
                      backgroundColor: "#FEF2F2",
                      border: "1px solid #F87171",
                      color: "#991B1B",
                      fontSize: 12,
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: 8
                    }}
                  >
                    <span>🚨 TARGET LEAKAGE DETECTED:</span>
                    <span>
                      {currentResult.diagnostics.summaryNotes}
                    </span>
                  </div>
                )}

                {/* Scorecards */}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#64748B", marginBottom: 8 }}>
                    Evaluation Metrics
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
                    {Object.entries(currentResult.testMetrics).map(([metricKey, metricVal]) => (
                      <div
                        key={metricKey}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 6,
                          backgroundColor: isDark ? "#16253C" : "#F8FAFC",
                          border: `1px solid ${isDark ? "#2A3F5F" : "#E2E8F0"}`
                        }}
                      >
                        <div style={{ fontSize: 11, color: "#64748B", textTransform: "capitalize" }}>
                          {metricKey.replace(/_/g, " ")}
                        </div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: "#356AE6" }}>
                          {typeof metricVal === "number" && metricVal <= 1.0 ? `${(metricVal * 100).toFixed(1)}%` : String(metricVal)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Confusion Matrix (for classification) */}
                {currentResult.confusionMatrix && (
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 6,
                      backgroundColor: isDark ? "#16253C" : "#F8FAFC",
                      border: `1px solid ${isDark ? "#2A3F5F" : "#E2E8F0"}`
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#64748B", marginBottom: 8 }}>
                      Binary Confusion Matrix Heatmap
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "100px 1fr 1fr", gap: 6, textAlign: "center", fontSize: 12 }}>
                      <div />
                      <div style={{ fontWeight: 700, color: "#64748B" }}>Predicted Negative (0)</div>
                      <div style={{ fontWeight: 700, color: "#64748B" }}>Predicted Positive (1)</div>

                      <div style={{ fontWeight: 700, color: "#64748B", textAlign: "left", alignSelf: "center" }}>Actual 0:</div>
                      <div style={{ padding: 12, backgroundColor: "#ECFDF5", color: "#047857", fontWeight: 800, borderRadius: 4 }}>
                        TN: {currentResult.confusionMatrix.tn}
                      </div>
                      <div style={{ padding: 12, backgroundColor: "#FEF2F2", color: "#B91C1C", fontWeight: 800, borderRadius: 4 }}>
                        FP: {currentResult.confusionMatrix.fp}
                      </div>

                      <div style={{ fontWeight: 700, color: "#64748B", textAlign: "left", alignSelf: "center" }}>Actual 1:</div>
                      <div style={{ padding: 12, backgroundColor: "#FEF2F2", color: "#B91C1C", fontWeight: 800, borderRadius: 4 }}>
                        FN: {currentResult.confusionMatrix.fn}
                      </div>
                      <div style={{ padding: 12, backgroundColor: "#ECFDF5", color: "#047857", fontWeight: 800, borderRadius: 4 }}>
                        TP: {currentResult.confusionMatrix.tp}
                      </div>
                    </div>
                  </div>
                )}

                {/* Training Telemetry */}
                <div
                  style={{
                    padding: 12,
                    borderRadius: 6,
                    backgroundColor: isDark ? "#16253C" : "#F8FAFC",
                    fontSize: 11.5,
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: "#64748B", marginBottom: 4 }}>Overfitting Risk Diagnostic</div>
                    <div style={{ color: isDark ? "#CBD5E1" : "#475569" }}>
                      Risk Level: <strong style={{ textTransform: "uppercase" }}>{currentResult.diagnostics.overfittingRisk}</strong>
                    </div>
                    <div style={{ fontSize: 11, color: "#64748B", marginTop: 2 }}>
                      {currentResult.diagnostics.summaryNotes}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "#64748B", marginBottom: 4 }}>Execution Telemetry</div>
                    <div style={{ color: isDark ? "#CBD5E1" : "#475569" }}>
                      Training Time: <strong>{currentResult.durationMs}ms</strong>
                    </div>
                    <div style={{ color: isDark ? "#CBD5E1" : "#475569" }}>
                      Features Evaluated: <strong>{currentResult.featuresUsed.join(", ")}</strong>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: EXPERIMENT HISTORY & COMPARISON ── */}
        <div
          style={{
            backgroundColor: isDark ? "#111C2E" : "#FFFFFF",
            border: `1px solid ${isDark ? "#22334A" : "#E2E8F0"}`,
            borderRadius: 8,
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 12,
            height: "fit-content"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em", color: "#64748B" }}>
              Experiment Run History
            </span>
            <span style={{ fontSize: 11, color: "#94A3B8" }}>{runHistory.length} runs</span>
          </div>

          {runHistory.length === 0 ? (
            <div style={{ fontSize: 11.5, color: "#64748B", textAlign: "center", padding: "20px 0" }}>
              No previous runs in current session.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {runHistory.map((run) => (
                <div
                  key={run.runId}
                  onClick={() => setCurrentResult(run)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: 6,
                    backgroundColor: currentResult?.runId === run.runId ? (isDark ? "#233857" : "#EFF4FE") : (isDark ? "#16253C" : "#F8FAFC"),
                    border: `1px solid ${currentResult?.runId === run.runId ? "#356AE6" : (isDark ? "#2A3F5F" : "#E2E8F0")}`,
                    cursor: "pointer",
                    fontSize: 11.5
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 2 }}>
                    <span style={{ fontWeight: 700, color: isDark ? "#FFFFFF" : "#1E293B" }}>
                      {run.algorithm.replace(/_/g, " ")}
                    </span>
                    <span style={{ color: "#356AE6", fontWeight: 800 }}>
                      {run.testMetrics.accuracy ? `${(run.testMetrics.accuracy * 100).toFixed(0)}% Acc` : (run.testMetrics.r2 ? `${run.testMetrics.r2.toFixed(2)} R²` : "Done")}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", color: "#64748B", fontSize: 10.5 }}>
                    <span>{run.datasetId}</span>
                    <span>{new Date(run.completedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MlStudioPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>Loading ML Studio...</div>}>
      <MlStudioContent />
    </Suspense>
  );
}
