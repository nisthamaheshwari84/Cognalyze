"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AppNav from "@/components/AppNav";
import { useTheme } from "@/components/ThemeProvider";

type LabTab = "sql" | "cohort" | "ab_test" | "python";

function AiDataLabContent() {
  const { isDark } = useTheme();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<LabTab>("sql");
  const [candidateId, setCandidateId] = useState<string>("student-demo");
  const [loading, setLoading] = useState<boolean>(true);

  // SQL Lab State
  const [sqlChallenges, setSqlChallenges] = useState<any[]>([]);
  const [selectedSqlSlug, setSelectedSqlSlug] = useState<string>("sql-cohort-monthly-retention");
  const [userSql, setUserSql] = useState<string>("");
  const [sqlResult, setSqlResult] = useState<any>(null);
  const [executingSql, setExecutingSql] = useState<boolean>(false);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [activeDatasetTab, setActiveDatasetTab] = useState<string>("ecommerce_analytics");

  // Python Lab State
  const [pythonChallenges, setPythonChallenges] = useState<any[]>([]);
  const [selectedPySlug, setSelectedPySlug] = useState<string>("py-summary-statistics");
  const [userCode, setUserCode] = useState<string>("");
  const [pythonResult, setPythonResult] = useState<any>(null);
  const [executingPy, setExecutingPy] = useState<boolean>(false);

  // Cohort Lab State
  const [cohortReport, setCohortReport] = useState<any>(null);
  const [cohortSubmission, setCohortSubmission] = useState({
    selectedCohortMonth: "2026-01",
    predictedRetentionBehavior: "Retention stabilizes around month 2 forming an asymptote of core power users.",
    identifiedDropoffReason: "Steep month 1 drop is driven by onboarding activation friction before habit formation.",
    recommendedIntervention: "Implement day-3 automated email nudge and in-app milestone rewards to improve activation."
  });
  const [cohortEvalResult, setCohortEvalResult] = useState<any>(null);
  const [evaluatingCohort, setEvaluatingCohort] = useState<boolean>(false);

  // A/B Testing Lab State
  const [abReport, setAbReport] = useState<any>(null);
  const [abSubmission, setAbSubmission] = useState({
    recommendedAction: "rollout",
    srmDetected: false,
    statisticalSignificanceVerdict: "statistically_significant",
    businessSignificanceVerdict: "exceeds_mde",
    justification: "Chi-square SRM is clean (p > 0.05). Two-sample Z-test shows statistically significant lift (+15.2%), and 95% CI lower bound is above the 5% MDE threshold."
  });
  const [abEvalResult, setAbEvalResult] = useState<any>(null);
  const [evaluatingAb, setEvaluatingAb] = useState<boolean>(false);

  // Mentor Drawer State
  const [mentorOpen, setMentorOpen] = useState<boolean>(false);
  const [mentorLevel, setMentorLevel] = useState<1 | 2 | 3 | 4>(1);
  const [mentorGuidance, setMentorGuidance] = useState<any>(null);
  const [loadingMentor, setLoadingMentor] = useState<boolean>(false);
  const [assistedWarningAcknowledged, setAssistedWarningAcknowledged] = useState<boolean>(false);

  // Global Persistence & Feedback
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);

  // 1. Initial Data Fetch
  useEffect(() => {
    async function init() {
      try {
        const sessRes = await fetch("/api/auth/session");
        const sess = await sessRes.json();
        const cid = sess.authenticated && sess.user?.id ? sess.user.id : "u-student-sample-001";
        setCandidateId(cid);

        const tabParam = searchParams.get("tab") as LabTab;
        if (tabParam && ["sql", "cohort", "ab_test", "python"].includes(tabParam)) {
          setActiveTab(tabParam);
        }

        const res = await fetch(`/api/skills/ai-data?candidateId=${cid}`);
        const data = await res.json();
        if (data.success && data.labs) {
          setSqlChallenges(data.labs.sqlChallenges || []);
          setPythonChallenges(data.labs.pythonChallenges || []);
          setDatasets(data.labs.datasets || []);

          if (data.labs.sqlChallenges?.[0]) {
            setSelectedSqlSlug(data.labs.sqlChallenges[0].slug);
            setUserSql(data.labs.sqlChallenges[0].starterSql);
            if (data.labs.sqlChallenges[0].datasetId) {
              setActiveDatasetTab(data.labs.sqlChallenges[0].datasetId);
            }
          }
          if (data.labs.pythonChallenges?.[0]) {
            setSelectedPySlug(data.labs.pythonChallenges[0].slug);
            setUserCode(data.labs.pythonChallenges[0].starterCode);
          }

          const challengeParam = searchParams.get("challenge");
          if (challengeParam) {
            const matchSql = data.labs.sqlChallenges?.find((c: any) => c.slug === challengeParam);
            if (matchSql) {
              setSelectedSqlSlug(matchSql.slug);
              setUserSql(matchSql.starterSql);
              if (matchSql.datasetId) setActiveDatasetTab(matchSql.datasetId);
              setActiveTab("sql");
            }
            const matchPy = data.labs.pythonChallenges?.find((c: any) => c.slug === challengeParam);
            if (matchPy) {
              setSelectedPySlug(matchPy.slug);
              setUserCode(matchPy.starterCode);
              setActiveTab("python");
            }
          }
        }

        // Fetch live cohort & A/B diagnostics
        loadCohortData();
        loadAbData();
      } catch (err) {
        console.error("Lab init error:", err);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [searchParams]);

  // Sync starter code when selecting SQL challenge
  const handleSelectSqlChallenge = (slug: string) => {
    setSelectedSqlSlug(slug);
    setSqlResult(null);
    setSubmissionFeedback(null);
    const chal = sqlChallenges.find(c => c.slug === slug);
    if (chal) {
      setUserSql(chal.starterSql);
      if (chal.datasetId) {
        setActiveDatasetTab(chal.datasetId);
      }
    }
  };

  // Sync starter code when selecting Python challenge
  const handleSelectPyChallenge = (slug: string) => {
    setSelectedPySlug(slug);
    setPythonResult(null);
    setSubmissionFeedback(null);
    const chal = pythonChallenges.find(c => c.slug === slug);
    if (chal) {
      setUserCode(chal.starterCode);
    }
  };

  // 2. SQL Sandbox Execution
  const handleRunSql = async () => {
    setExecutingSql(true);
    setSqlResult(null);
    setSubmissionFeedback(null);
    try {
      const activeChal = sqlChallenges.find(c => c.slug === selectedSqlSlug);
      const datasetId = activeChal?.datasetId || activeDatasetTab;

      const res = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute_sql",
          candidateId,
          datasetId,
          userSql,
          challengeSlug: selectedSqlSlug
        })
      });
      const data = await res.json();
      if (data.success) {
        setSqlResult(data.result);
      } else {
        setSqlResult({
          success: false,
          status: "runtime_error",
          errorMessage: data.error || "Failed to execute SQL query"
        });
      }
    } catch (err: any) {
      setSqlResult({
        success: false,
        status: "runtime_error",
        errorMessage: err.message
      });
    } finally {
      setExecutingSql(false);
    }
  };

  // 3. Python Sandbox Execution
  const handleRunPython = async () => {
    setExecutingPy(true);
    setPythonResult(null);
    setSubmissionFeedback(null);
    try {
      const res = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute_python",
          candidateId,
          userCode,
          challengeSlug: selectedPySlug
        })
      });
      const data = await res.json();
      if (data.success) {
        setPythonResult(data.result);
      } else {
        setPythonResult({
          success: false,
          status: "runtime_error",
          stderr: data.error || "Execution failed"
        });
      }
    } catch (err: any) {
      setPythonResult({
        success: false,
        status: "runtime_error",
        stderr: err.message
      });
    } finally {
      setExecutingPy(false);
    }
  };

  // 4. Cohort Lab Handlers
  const loadCohortData = async () => {
    try {
      const res = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_cohort_matrix" })
      });
      const data = await res.json();
      if (data.success) {
        setCohortReport(data.report);
      }
    } catch (err) {
      console.error("Cohort fetch error:", err);
    }
  };

  const handleEvaluateCohort = async () => {
    setEvaluatingCohort(true);
    setCohortEvalResult(null);
    setSubmissionFeedback(null);
    try {
      const res = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate_cohort_interpretation",
          candidateId,
          submission: cohortSubmission
        })
      });
      const data = await res.json();
      if (data.success) {
        setCohortEvalResult(data.evaluation);
        // Persist attempt to DNA
        await handlePersistAttempt(
          "cohort-retention-analysis-and-churn",
          "case_study",
          data.evaluation.score,
          data.evaluation.passed,
          false,
          { analytical_depth: data.evaluation.score }
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluatingCohort(false);
    }
  };

  // 5. A/B Testing Lab Handlers
  const loadAbData = async () => {
    try {
      const res = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "get_ab_diagnostics" })
      });
      const data = await res.json();
      if (data.success) {
        setAbReport(data.report);
      }
    } catch (err) {
      console.error("AB fetch error:", err);
    }
  };

  const handleEvaluateAb = async () => {
    setEvaluatingAb(true);
    setAbEvalResult(null);
    setSubmissionFeedback(null);
    try {
      const res = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "evaluate_ab_decision",
          candidateId,
          submission: {
            candidateId,
            ...abSubmission
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        setAbEvalResult(data.evaluation);
        // Persist attempt to DNA
        await handlePersistAttempt(
          "hypothesis-testing-and-experiment-design",
          "case_study",
          data.evaluation.score,
          data.evaluation.decisionVerdict === "correct",
          false,
          { statistical_rigor: data.evaluation.score }
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEvaluatingAb(false);
    }
  };

  // 6. Mentor Guidance Fetch
  const fetchMentorHint = async (level: 1 | 2 | 3 | 4) => {
    setLoadingMentor(true);
    setMentorLevel(level);
    try {
      const labType = activeTab === "sql" ? "sql" : activeTab === "python" ? "python" : activeTab === "cohort" ? "cohort" : "ab_testing";
      const slug = activeTab === "sql" ? selectedSqlSlug : activeTab === "python" ? selectedPySlug : activeTab;

      const res = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "get_mentor_hint",
          labType,
          challengeSlug: slug,
          hintLevel: level,
          currentCode: activeTab === "sql" ? userSql : userCode
        })
      });
      const data = await res.json();
      if (data.success) {
        setMentorGuidance(data.guidance);
      }
    } catch (err) {
      console.error("Mentor hint error:", err);
    } finally {
      setLoadingMentor(false);
    }
  };

  // 7. Persist Attempt to Student DNA
  const handlePersistAttempt = async (
    lessonSlug: string,
    exerciseType: any,
    score: number,
    passed: boolean,
    assisted: boolean,
    dimensions?: any
  ) => {
    try {
      const res = await fetch("/api/skills/ai-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_lab_assessment",
          candidateId,
          trackSlug: "data_science_analytics",
          lessonSlug,
          exerciseType,
          score,
          passed,
          assisted,
          dimensions,
          executionReport: {
            timestamp: new Date().toISOString(),
            status: passed ? "passed" : "failed"
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        if (data.dnaSync?.evidenceId) {
          setSubmissionFeedback(`✅ Verified Competency Evidence Recorded! Student DNA updated (ID: ${data.dnaSync.evidenceId.slice(0, 10)}...).`);
        } else if (!passed || score === 0) {
          setSubmissionFeedback("ℹ️ Attempt logged in diagnostic history without false positive mastery.");
        } else {
          setSubmissionFeedback("✅ Attempt recorded successfully.");
        }
      }
    } catch (err: any) {
      setSubmissionFeedback(`Submission notice: ${err.message}`);
    }
  };

  const activeSqlChallenge = sqlChallenges.find(c => c.slug === selectedSqlSlug);
  const activePyChallenge = pythonChallenges.find(c => c.slug === selectedPySlug);
  const currentDataset = datasets.find(d => d.id === activeDatasetTab) || datasets[0];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: isDark ? "#0A101D" : "#F6F5F1",
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
          padding: "14px 24px",
          position: "sticky",
          top: 56,
          zIndex: 30
        }}
      >
        <div style={{ maxWidth: 1240, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link
              href="/student/skills/ai-data"
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#356AE6",
                textDecoration: "none",
                display: "inline-flex",
                alignItems: "center",
                gap: 4
              }}
            >
              ← Arena Overview
            </Link>
            <span style={{ color: isDark ? "#4B5563" : "#D1D5DB" }}>|</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: isDark ? "#FFFFFF" : "#162A43" }}>
              ⚡ Interactive Execution & Assessment Labs
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                backgroundColor: "#EBF3FF",
                color: "#2563EB",
                padding: "2px 8px",
                borderRadius: 4
              }}
            >
              Track 2: Data Science & Analytics
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => {
                setMentorOpen(true);
                fetchMentorHint(1);
              }}
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                padding: "6px 12px",
                borderRadius: 6,
                backgroundColor: isDark ? "#1E2A3B" : "#F3F4F6",
                border: `1px solid ${isDark ? "#2E3F55" : "#D1D5DB"}`,
                color: isDark ? "#F2F6FC" : "#1F2937",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              💡 Socratic Mentor Hints
            </button>
          </div>
        </div>
      </header>

      {/* ── LAB TABS SWITCHER ── */}
      <div style={{ maxWidth: 1240, margin: "20px auto 0", padding: "0 24px" }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            borderBottom: `2px solid ${isDark ? "#1E2A3B" : "#E4E1DA"}`,
            paddingBottom: 2
          }}
        >
          {[
            { id: "sql", label: "📊 SQL Execution Lab", badge: "Live SQLite" },
            { id: "cohort", label: "📈 Cohort & Retention Analysis", badge: "Heatmap Matrix" },
            { id: "ab_test", label: "🧪 A/B Testing Diagnostics", badge: "SRM & Z-Test" },
            { id: "python", label: "🐍 Python Practice", badge: "StdLib Sandbox" }
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as LabTab);
                  setSubmissionFeedback(null);
                }}
                style={{
                  padding: "10px 18px",
                  fontSize: 13,
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? "#356AE6" : isDark ? "#8FA0B8" : "#667085",
                  backgroundColor: "transparent",
                  border: "none",
                  borderBottom: isActive ? "3px solid #356AE6" : "3px solid transparent",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: -2,
                  transition: "all 0.15s ease"
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    fontSize: 9.5,
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: 4,
                    backgroundColor: isActive
                      ? (isDark ? "#1A3258" : "#EBF3FF")
                      : (isDark ? "#111C2E" : "#E5E7EB"),
                    color: isActive ? "#356AE6" : isDark ? "#8FA0B8" : "#4B5563"
                  }}
                >
                  {tab.badge}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── FEEDBACK ALERT BANNER ── */}
      {submissionFeedback && (
        <div style={{ maxWidth: 1240, margin: "14px auto 0", padding: "0 24px" }}>
          <div
            style={{
              padding: "10px 14px",
              borderRadius: 8,
              backgroundColor: submissionFeedback.includes("✅") ? "#EAF4EE" : "#EFF4FE",
              border: `1px solid ${submissionFeedback.includes("✅") ? "#2E7D5B" : "#356AE6"}`,
              color: submissionFeedback.includes("✅") ? "#1E5E41" : "#1D4ED8",
              fontSize: 12.5,
              fontWeight: 600
            }}
          >
            {submissionFeedback}
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT AREA ── */}
      <main style={{ maxWidth: 1240, margin: "20px auto 40px", padding: "0 24px" }}>

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* TAB 1: SQL EXECUTION LAB                                             */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "sql" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 20 }}>
            {/* Left Column: Challenge & Schema Inspector */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Challenge Selector */}
              <div
                style={{
                  backgroundColor: isDark ? "#111C2E" : "#FFFFFF",
                  border: `1px solid ${isDark ? "#22334A" : "#E4E1DA"}`,
                  borderRadius: 10,
                  padding: "16px 18px"
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: "#356AE6", textTransform: "uppercase", marginBottom: 6 }}>
                  Select SQL Challenge
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {sqlChallenges.map(chal => {
                    const isSelected = chal.slug === selectedSqlSlug;
                    return (
                      <div
                        key={chal.slug}
                        onClick={() => handleSelectSqlChallenge(chal.slug)}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 8,
                          backgroundColor: isSelected
                            ? (isDark ? "#16253C" : "#EFF4FE")
                            : (isDark ? "#0A101D" : "#F9FAFB"),
                          border: `1.5px solid ${isSelected ? "#356AE6" : (isDark ? "#1E2A3B" : "#E5E7EB")}`,
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? "#FFFFFF" : "#111827" }}>
                            {chal.title}
                          </div>
                          <div style={{ fontSize: 11, color: isDark ? "#8FA0B8" : "#6B7280", marginTop: 2 }}>
                            {chal.summary}
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            padding: "2px 6px",
                            borderRadius: 4,
                            backgroundColor: chal.difficulty === "advanced" ? "#FEF2F2" : "#F0FDF4",
                            color: chal.difficulty === "advanced" ? "#DC2626" : "#16A34A"
                          }}
                        >
                          {chal.difficulty.toUpperCase()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Schema Inspector */}
              <div
                style={{
                  backgroundColor: isDark ? "#111C2E" : "#FFFFFF",
                  border: `1px solid ${isDark ? "#22334A" : "#E4E1DA"}`,
                  borderRadius: 10,
                  padding: "16px 18px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#356AE6", textTransform: "uppercase" }}>
                    Database Schema Explorer
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {datasets.map(d => (
                      <button
                        key={d.id}
                        onClick={() => setActiveDatasetTab(d.id)}
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 4,
                          backgroundColor: activeDatasetTab === d.id ? "#356AE6" : isDark ? "#1E2A3B" : "#E5E7EB",
                          color: activeDatasetTab === d.id ? "#FFFFFF" : isDark ? "#8FA0B8" : "#4B5563",
                          border: "none",
                          cursor: "pointer"
                        }}
                      >
                        {d.name}
                      </button>
                    ))}
                  </div>
                </div>

                {currentDataset && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {currentDataset.tables.map((tbl: any) => (
                      <div
                        key={tbl.name}
                        style={{
                          border: `1px solid ${isDark ? "#1E2A3B" : "#E5E7EB"}`,
                          borderRadius: 6,
                          padding: "10px 12px",
                          backgroundColor: isDark ? "#0A101D" : "#FAFAFA"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 800, fontFamily: "monospace", color: "#356AE6" }}>
                            {tbl.name}
                          </span>
                          <span style={{ fontSize: 10, color: isDark ? "#8FA0B8" : "#6B7280" }}>
                            {tbl.description}
                          </span>
                        </div>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                          {tbl.columns.map((c: any) => (
                            <span
                              key={c.name}
                              style={{
                                fontSize: 10,
                                fontFamily: "monospace",
                                padding: "2px 6px",
                                borderRadius: 4,
                                backgroundColor: isDark ? "#16253C" : "#EBF3FF",
                                color: isDark ? "#93C5FD" : "#1E40AF"
                              }}
                            >
                              {c.name}: <span style={{ opacity: 0.7 }}>{c.type}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: SQL Editor & Results Output */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Editor Pane */}
              <div
                style={{
                  backgroundColor: isDark ? "#111C2E" : "#FFFFFF",
                  border: `1px solid ${isDark ? "#22334A" : "#E4E1DA"}`,
                  borderRadius: 10,
                  padding: "16px 18px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: isDark ? "#FFFFFF" : "#111827" }}>
                    SQL Query Editor
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => {
                        if (activeSqlChallenge) setUserSql(activeSqlChallenge.starterSql);
                      }}
                      style={{
                        fontSize: 11,
                        padding: "4px 8px",
                        borderRadius: 4,
                        border: `1px solid ${isDark ? "#2E3F55" : "#D1D5DB"}`,
                        backgroundColor: "transparent",
                        color: isDark ? "#8FA0B8" : "#6B7280",
                        cursor: "pointer"
                      }}
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleRunSql}
                      disabled={executingSql}
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "6px 16px",
                        borderRadius: 6,
                        backgroundColor: "#356AE6",
                        color: "#FFFFFF",
                        border: "none",
                        cursor: executingSql ? "wait" : "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                      }}
                    >
                      {executingSql ? "Executing..." : "▶ Run SQL"}
                    </button>
                  </div>
                </div>

                <textarea
                  value={userSql}
                  onChange={e => setUserSql(e.target.value)}
                  rows={10}
                  spellCheck={false}
                  style={{
                    width: "100%",
                    fontFamily: "'Fira Code', 'SF Mono', Monaco, monospace",
                    fontSize: 12.5,
                    lineHeight: 1.5,
                    backgroundColor: isDark ? "#0A101D" : "#1E293B",
                    color: "#F8FAFC",
                    border: `1px solid ${isDark ? "#22334A" : "#334155"}`,
                    borderRadius: 6,
                    padding: 12,
                    boxSizing: "border-box",
                    outline: "none"
                  }}
                />
              </div>

              {/* Execution Results Pane */}
              <div
                style={{
                  backgroundColor: isDark ? "#111C2E" : "#FFFFFF",
                  border: `1px solid ${isDark ? "#22334A" : "#E4E1DA"}`,
                  borderRadius: 10,
                  padding: "16px 18px",
                  minHeight: 220
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: isDark ? "#FFFFFF" : "#111827" }}>
                    Live Query Execution Output
                  </div>
                  {sqlResult && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 11, color: isDark ? "#8FA0B8" : "#6B7280" }}>
                        ⏱️ {sqlResult.executionTimeMs} ms • {sqlResult.rowCount} rows
                      </span>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          padding: "2px 8px",
                          borderRadius: 4,
                          backgroundColor: sqlResult.testPassed ? "#EAF4EE" : "#FDF2F2",
                          color: sqlResult.testPassed ? "#2E7D5B" : "#C24141"
                        }}
                      >
                        {sqlResult.testPassed ? "TESTS PASSED" : sqlResult.status.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {sqlResult ? (
                  <div>
                    {sqlResult.errorMessage ? (
                      <div
                        style={{
                          padding: "10px 12px",
                          borderRadius: 6,
                          backgroundColor: "#FEF2F2",
                          border: "1px solid #F87171",
                          color: "#991B1B",
                          fontSize: 12,
                          fontFamily: "monospace",
                          marginBottom: 12
                        }}
                      >
                        {sqlResult.errorMessage}
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: 11.5, color: isDark ? "#B0C0D4" : "#4B5563", marginBottom: 10 }}>
                          {sqlResult.feedback}
                        </div>

                        {/* Result Table Preview */}
                        {sqlResult.rows && sqlResult.rows.length > 0 && (
                          <div style={{ overflowX: "auto", maxHeight: 200, border: `1px solid ${isDark ? "#1E2A3B" : "#E5E7EB"}`, borderRadius: 6 }}>
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11.5, fontFamily: "monospace" }}>
                              <thead>
                                <tr style={{ backgroundColor: isDark ? "#16253C" : "#F3F4F6", borderBottom: `1px solid ${isDark ? "#1E2A3B" : "#E5E7EB"}` }}>
                                  {sqlResult.columns.map((col: string) => (
                                    <th key={col} style={{ padding: "6px 10px", textAlign: "left", color: isDark ? "#93C5FD" : "#1E40AF" }}>
                                      {col}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {sqlResult.rows.map((row: any, idx: number) => (
                                  <tr key={idx} style={{ borderBottom: `1px solid ${isDark ? "#1E2A3B" : "#E5E7EB"}` }}>
                                    {sqlResult.columns.map((col: string) => (
                                      <td key={col} style={{ padding: "6px 10px", color: isDark ? "#F3F4F6" : "#1F2937" }}>
                                        {String(row[col] !== undefined && row[col] !== null ? row[col] : "NULL")}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}

                        {/* Submit to DNA button if passed */}
                        {sqlResult.testPassed && (
                          <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
                            <button
                              onClick={() => {
                                handlePersistAttempt(
                                  selectedSqlSlug,
                                  "code_lab",
                                  sqlResult.score || 100,
                                  true,
                                  mentorLevel === 4,
                                  { sql_accuracy: sqlResult.score || 100 }
                                );
                              }}
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                padding: "6px 14px",
                                borderRadius: 6,
                                backgroundColor: "#2E7D5B",
                                color: "#FFFFFF",
                                border: "none",
                                cursor: "pointer"
                              }}
                            >
                              ✓ Sync Verified Competency to Student DNA
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div style={{ color: isDark ? "#8FA0B8" : "#9CA3AF", fontSize: 12, textAlign: "center", padding: "40px 0" }}>
                    Write or edit SQL above and click "▶ Run SQL" to execute in the isolated sandbox.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* TAB 2: COHORT & RETENTION ANALYSIS LAB                               */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "cohort" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Triangular Heatmap Card */}
            <div
              style={{
                backgroundColor: isDark ? "#111C2E" : "#FFFFFF",
                border: `1px solid ${isDark ? "#22334A" : "#E4E1DA"}`,
                borderRadius: 10,
                padding: "20px 22px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: isDark ? "#FFFFFF" : "#111827" }}>
                    Live Triangular Cohort Retention Matrix
                  </h3>
                  <div style={{ fontSize: 11.5, color: isDark ? "#8FA0B8" : "#6B7280", marginTop: 2 }}>
                    Calculated directly from e-commerce user acquisition orders stream.
                  </div>
                </div>
                {cohortReport && (
                  <div style={{ fontSize: 11, color: isDark ? "#8FA0B8" : "#6B7280" }}>
                    {cohortReport.totalCohorts} Acquisition Cohorts • {cohortReport.maxPeriodsAnalyzed} Periods
                  </div>
                )}
              </div>

              {cohortReport ? (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, textAlign: "center" }}>
                    <thead>
                      <tr style={{ backgroundColor: isDark ? "#16253C" : "#F3F4F6", borderBottom: `1px solid ${isDark ? "#1E2A3B" : "#E5E7EB"}` }}>
                        <th style={{ padding: "8px 12px", textAlign: "left", color: isDark ? "#FFFFFF" : "#111827" }}>Cohort Month</th>
                        <th style={{ padding: "8px 12px", color: isDark ? "#93C5FD" : "#1E40AF" }}>Users</th>
                        <th style={{ padding: "8px 12px", color: isDark ? "#93C5FD" : "#1E40AF" }}>Month 0</th>
                        <th style={{ padding: "8px 12px", color: isDark ? "#93C5FD" : "#1E40AF" }}>Month 1</th>
                        <th style={{ padding: "8px 12px", color: isDark ? "#93C5FD" : "#1E40AF" }}>Month 2</th>
                        <th style={{ padding: "8px 12px", color: isDark ? "#93C5FD" : "#1E40AF" }}>Month 3</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cohortReport.matrix.map((row: any) => (
                        <tr key={row.cohortMonth} style={{ borderBottom: `1px solid ${isDark ? "#1E2A3B" : "#E5E7EB"}` }}>
                          <td style={{ padding: "8px 12px", textAlign: "left", fontWeight: 700, fontFamily: "monospace" }}>
                            {row.cohortMonth}
                          </td>
                          <td style={{ padding: "8px 12px", fontWeight: 600 }}>{row.initialUsers}</td>
                          {[0, 1, 2, 3].map(period => {
                            const pData = row.periods.find((p: any) => p.periodMonth === period);
                            if (!pData) {
                              return (
                                <td key={period} style={{ padding: "8px 12px", color: isDark ? "#374151" : "#D1D5DB" }}>
                                  -
                                </td>
                              );
                            }
                            const rate = pData.retentionRate;
                            // Color mapping for heatmap
                            const bgColor =
                              rate >= 80 ? "rgba(46, 125, 91, 0.35)" :
                              rate >= 40 ? "rgba(53, 106, 230, 0.25)" :
                              rate >= 20 ? "rgba(245, 158, 11, 0.25)" :
                              "rgba(239, 68, 68, 0.2)";
                            return (
                              <td
                                key={period}
                                style={{
                                  padding: "8px 12px",
                                  backgroundColor: bgColor,
                                  fontWeight: 700,
                                  color: isDark ? "#F9FAFB" : "#111827"
                                }}
                              >
                                {rate.toFixed(1)}%
                                <div style={{ fontSize: 9.5, opacity: 0.75, fontWeight: 500 }}>
                                  ({pData.activeUsers} users)
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0", color: isDark ? "#8FA0B8" : "#9CA3AF" }}>
                  Loading live cohort retention matrix...
                </div>
              )}
            </div>

            {/* Strategic Interpretation & Defense Form */}
            <div
              style={{
                backgroundColor: isDark ? "#111C2E" : "#FFFFFF",
                border: `1px solid ${isDark ? "#22334A" : "#E4E1DA"}`,
                borderRadius: 10,
                padding: "20px 22px"
              }}
            >
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 14px", color: isDark ? "#FFFFFF" : "#111827" }}>
                Analytical Defense: Interpret Retention Curves
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, marginBottom: 4 }}>
                    Observed Retention Curve Pattern & Asymptote:
                  </label>
                  <textarea
                    rows={3}
                    value={cohortSubmission.predictedRetentionBehavior}
                    onChange={e => setCohortSubmission({ ...cohortSubmission, predictedRetentionBehavior: e.target.value })}
                    style={{
                      width: "100%",
                      fontSize: 12,
                      padding: 8,
                      borderRadius: 6,
                      backgroundColor: isDark ? "#0A101D" : "#FAFAFA",
                      border: `1px solid ${isDark ? "#22334A" : "#D1D5DB"}`,
                      color: isDark ? "#FFFFFF" : "#111827"
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, marginBottom: 4 }}>
                    Root Cause of Month 1 Steep Dropoff:
                  </label>
                  <textarea
                    rows={3}
                    value={cohortSubmission.identifiedDropoffReason}
                    onChange={e => setCohortSubmission({ ...cohortSubmission, identifiedDropoffReason: e.target.value })}
                    style={{
                      width: "100%",
                      fontSize: 12,
                      padding: 8,
                      borderRadius: 6,
                      backgroundColor: isDark ? "#0A101D" : "#FAFAFA",
                      border: `1px solid ${isDark ? "#22334A" : "#D1D5DB"}`,
                      color: isDark ? "#FFFFFF" : "#111827"
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, marginBottom: 4 }}>
                  Recommended Product / Growth Intervention to Lift Retention:
                </label>
                <textarea
                  rows={2}
                  value={cohortSubmission.recommendedIntervention}
                  onChange={e => setCohortSubmission({ ...cohortSubmission, recommendedIntervention: e.target.value })}
                  style={{
                    width: "100%",
                    fontSize: 12,
                    padding: 8,
                    borderRadius: 6,
                    backgroundColor: isDark ? "#0A101D" : "#FAFAFA",
                    border: `1px solid ${isDark ? "#22334A" : "#D1D5DB"}`,
                    color: isDark ? "#FFFFFF" : "#111827"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: isDark ? "#8FA0B8" : "#6B7280" }}>
                  Evaluated against professional product analytics defense rubric.
                </span>
                <button
                  onClick={handleEvaluateCohort}
                  disabled={evaluatingCohort}
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "8px 18px",
                    borderRadius: 6,
                    backgroundColor: "#356AE6",
                    color: "#FFFFFF",
                    border: "none",
                    cursor: evaluatingCohort ? "wait" : "pointer"
                  }}
                >
                  {evaluatingCohort ? "Evaluating..." : "Submit Interpretation for Evaluation"}
                </button>
              </div>

              {/* Evaluation Results */}
              {cohortEvalResult && (
                <div
                  style={{
                    marginTop: 16,
                    padding: "14px 16px",
                    borderRadius: 8,
                    backgroundColor: cohortEvalResult.passed ? (isDark ? "#0D251C" : "#EAF4EE") : (isDark ? "#2D1515" : "#FDF2F2"),
                    border: `1px solid ${cohortEvalResult.passed ? "#2E7D5B" : "#C24141"}`
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: cohortEvalResult.passed ? "#2E7D5B" : "#C24141" }}>
                      Score: {cohortEvalResult.score} / 100 ({cohortEvalResult.passed ? "PASSED" : "NEEDS REVISION"})
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: cohortEvalResult.passed ? "#2E7D5B" : "#C24141" }}>
                      {cohortEvalResult.passed ? "✓ Student DNA Evidence Recorded" : "Review Feedback & Retry"}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: isDark ? "#E5E7EB" : "#374151", marginBottom: 8 }}>
                    {cohortEvalResult.feedback}
                  </div>
                  {cohortEvalResult.keyInsights && (
                    <ul style={{ margin: "4px 0 0", paddingLeft: 18, fontSize: 11.5, color: isDark ? "#9CA3AF" : "#4B5563" }}>
                      {cohortEvalResult.keyInsights.map((ins: string, idx: number) => (
                        <li key={idx}>{ins}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* TAB 3: A/B TESTING DIAGNOSTICS LAB                                   */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "ab_test" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Experiment Dashboard */}
            {abReport ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
                {/* Variant Traffic & Conversion Card */}
                <div
                  style={{
                    backgroundColor: isDark ? "#111C2E" : "#FFFFFF",
                    border: `1px solid ${isDark ? "#22334A" : "#E4E1DA"}`,
                    borderRadius: 10,
                    padding: "16px 18px"
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#356AE6", textTransform: "uppercase", marginBottom: 8 }}>
                    Variant Conversion Telemetry
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12 }}>
                    <div style={{ padding: 10, borderRadius: 6, backgroundColor: isDark ? "#0A101D" : "#F9FAFB" }}>
                      <div style={{ fontSize: 11, color: isDark ? "#8FA0B8" : "#6B7280" }}>Control (A)</div>
                      <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2 }}>{abReport.control.conversionRatePct}%</div>
                      <div style={{ fontSize: 10, color: isDark ? "#8FA0B8" : "#6B7280" }}>
                        {abReport.control.conversions} / {abReport.control.visitors} visitors
                      </div>
                    </div>
                    <div style={{ padding: 10, borderRadius: 6, backgroundColor: isDark ? "#0A101D" : "#F9FAFB" }}>
                      <div style={{ fontSize: 11, color: isDark ? "#8FA0B8" : "#6B7280" }}>Treatment (B)</div>
                      <div style={{ fontSize: 16, fontWeight: 800, marginTop: 2, color: "#356AE6" }}>
                        {abReport.treatment.conversionRatePct}%
                      </div>
                      <div style={{ fontSize: 10, color: isDark ? "#8FA0B8" : "#6B7280" }}>
                        {abReport.treatment.conversions} / {abReport.treatment.visitors} visitors
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: 12, display: "flex", justifyContent: "space-between", borderTop: `1px solid ${isDark ? "#1E2A3B" : "#E5E7EB"}`, paddingTop: 8 }}>
                    <span>Relative Uplift:</span>
                    <strong style={{ color: abReport.relativeUpliftPct >= 0 ? "#2E7D5B" : "#DC2626" }}>
                      {abReport.relativeUpliftPct >= 0 ? "+" : ""}{abReport.relativeUpliftPct}%
                    </strong>
                  </div>
                  <div style={{ fontSize: 11, display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span style={{ color: isDark ? "#8FA0B8" : "#6B7280" }}>95% Confidence Interval:</span>
                    <span style={{ fontFamily: "monospace" }}>
                      {abReport.confidenceInterval95.formatted || `[${abReport.confidenceInterval95.lowerPct}%, ${abReport.confidenceInterval95.upperPct}%]`}
                    </span>
                  </div>
                </div>

                {/* SRM & Statistical Significance Card */}
                <div
                  style={{
                    backgroundColor: isDark ? "#111C2E" : "#FFFFFF",
                    border: `1px solid ${isDark ? "#22334A" : "#E4E1DA"}`,
                    borderRadius: 10,
                    padding: "16px 18px"
                  }}
                >
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#356AE6", textTransform: "uppercase", marginBottom: 8 }}>
                    Diagnostic Checks & Significance
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {/* SRM Indicator */}
                    <div
                      style={{
                        padding: "8px 12px",
                        borderRadius: 6,
                        backgroundColor: abReport.srm.detected ? "#FDF2F2" : "#EAF4EE",
                        border: `1px solid ${abReport.srm.detected ? "#F87171" : "#86EFAC"}`
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: abReport.srm.detected ? "#991B1B" : "#166534" }}>
                          Sample Ratio Mismatch (SRM): {abReport.srm.status.toUpperCase()}
                        </span>
                        <span style={{ fontSize: 11, fontFamily: "monospace" }}>
                          χ² = {abReport.srm.chiSquareStatistic} (p = {abReport.srm.pValue})
                        </span>
                      </div>
                      <div style={{ fontSize: 10.5, color: abReport.srm.detected ? "#7F1D1D" : "#14532D", marginTop: 2 }}>
                        {abReport.srm.interpretation}
                      </div>
                    </div>

                    {/* Z-Test Significance */}
                    <div style={{ padding: "8px 12px", borderRadius: 6, backgroundColor: isDark ? "#0A101D" : "#F9FAFB" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 12, fontWeight: 700 }}>
                          Two-Sample Z-Test: {abReport.zTest.isStatisticallySignificant ? "SIGNIFICANT (p < 0.05)" : "NOT SIGNIFICANT"}
                        </span>
                        <span style={{ fontSize: 11, fontFamily: "monospace" }}>
                          z = {abReport.zTest.zScore} (p = {abReport.zTest.pValue})
                        </span>
                      </div>
                      <div style={{ fontSize: 10.5, color: isDark ? "#8FA0B8" : "#6B7280", marginTop: 2 }}>
                        Business Hurdle Rate (MDE): +{abReport.businessSignificance.minimumDetectableEffectPct}% (Verdict: {abReport.businessSignificance.verdict.toUpperCase()})
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "20px 0", color: isDark ? "#8FA0B8" : "#9CA3AF" }}>
                Loading live A/B experiment telemetry...
              </div>
            )}

            {/* Decision Submission Form */}
            <div
              style={{
                backgroundColor: isDark ? "#111C2E" : "#FFFFFF",
                border: `1px solid ${isDark ? "#22334A" : "#E4E1DA"}`,
                borderRadius: 10,
                padding: "20px 22px"
              }}
            >
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: "0 0 14px", color: isDark ? "#FFFFFF" : "#111827" }}>
                Executive Rollout Decision Defense
              </h3>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, marginBottom: 4 }}>
                    Recommended Decision:
                  </label>
                  <select
                    value={abSubmission.recommendedAction}
                    onChange={e => setAbSubmission({ ...abSubmission, recommendedAction: e.target.value })}
                    style={{
                      width: "100%",
                      fontSize: 12,
                      padding: 8,
                      borderRadius: 6,
                      backgroundColor: isDark ? "#0A101D" : "#FAFAFA",
                      border: `1px solid ${isDark ? "#22334A" : "#D1D5DB"}`,
                      color: isDark ? "#FFFFFF" : "#111827"
                    }}
                  >
                    <option value="rollout">Rollout Treatment B to 100% Traffic</option>
                    <option value="reject">Reject Treatment B and Retain Control A</option>
                    <option value="investigate_srm">Abort Rollout: Investigate Sample Ratio Mismatch</option>
                    <option value="continue_collecting">Continue Experiment: Insufficient Sample Size</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, marginBottom: 4 }}>
                    Statistical Verdict:
                  </label>
                  <select
                    value={abSubmission.statisticalSignificanceVerdict}
                    onChange={e => setAbSubmission({ ...abSubmission, statisticalSignificanceVerdict: e.target.value })}
                    style={{
                      width: "100%",
                      fontSize: 12,
                      padding: 8,
                      borderRadius: 6,
                      backgroundColor: isDark ? "#0A101D" : "#FAFAFA",
                      border: `1px solid ${isDark ? "#22334A" : "#D1D5DB"}`,
                      color: isDark ? "#FFFFFF" : "#111827"
                    }}
                  >
                    <option value="statistically_significant">Statistically Significant (p &lt; 0.05)</option>
                    <option value="not_significant">Not Statistically Significant</option>
                    <option value="srm_invalidated">Invalidated by Sample Ratio Mismatch</option>
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 11.5, fontWeight: 700, marginBottom: 4 }}>
                  Decision Justification (State SRM check, Z-test p-value, 95% CI bounds, and MDE):
                </label>
                <textarea
                  rows={3}
                  value={abSubmission.justification}
                  onChange={e => setAbSubmission({ ...abSubmission, justification: e.target.value })}
                  style={{
                    width: "100%",
                    fontSize: 12,
                    padding: 8,
                    borderRadius: 6,
                    backgroundColor: isDark ? "#0A101D" : "#FAFAFA",
                    border: `1px solid ${isDark ? "#22334A" : "#D1D5DB"}`,
                    color: isDark ? "#FFFFFF" : "#111827"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, color: isDark ? "#8FA0B8" : "#6B7280" }}>
                  Automated evaluation tests SRM detection, statistical rigor, and business trade-offs.
                </span>
                <button
                  onClick={handleEvaluateAb}
                  disabled={evaluatingAb}
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    padding: "8px 18px",
                    borderRadius: 6,
                    backgroundColor: "#356AE6",
                    color: "#FFFFFF",
                    border: "none",
                    cursor: evaluatingAb ? "wait" : "pointer"
                  }}
                >
                  {evaluatingAb ? "Evaluating..." : "Submit Decision for Review"}
                </button>
              </div>

              {/* Evaluation Results */}
              {abEvalResult && (
                <div
                  style={{
                    marginTop: 16,
                    padding: "14px 16px",
                    borderRadius: 8,
                    backgroundColor: abEvalResult.decisionVerdict === "correct" ? (isDark ? "#0D251C" : "#EAF4EE") : (isDark ? "#2D1515" : "#FDF2F2"),
                    border: `1px solid ${abEvalResult.decisionVerdict === "correct" ? "#2E7D5B" : "#C24141"}`
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: abEvalResult.decisionVerdict === "correct" ? "#2E7D5B" : "#C24141" }}>
                      Score: {abEvalResult.score} / 100 ({abEvalResult.decisionVerdict.toUpperCase()})
                    </span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: abEvalResult.decisionVerdict === "correct" ? "#2E7D5B" : "#C24141" }}>
                      {abEvalResult.decisionVerdict === "correct" ? "✓ Student DNA Evidence Recorded" : "Revision Recommended"}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: isDark ? "#E5E7EB" : "#374151", marginBottom: 8 }}>
                    {abEvalResult.feedback}
                  </div>
                  {abEvalResult.strengths && (
                    <div style={{ fontSize: 11.5, color: isDark ? "#A7F3D0" : "#065F46", marginBottom: 4 }}>
                      ✓ {abEvalResult.strengths.join(" • ")}
                    </div>
                  )}
                  {abEvalResult.missingConsiderations && (
                    <div style={{ fontSize: 11.5, color: isDark ? "#FECACA" : "#991B1B" }}>
                      ⚠️ Missing: {abEvalResult.missingConsiderations.join(" • ")}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════════ */}
        {/* TAB 4: PYTHON PRACTICE LAB                                           */}
        {/* ══════════════════════════════════════════════════════════════════════ */}
        {activeTab === "python" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.3fr", gap: 20 }}>
            {/* Left Column: Challenge Details */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div
                style={{
                  backgroundColor: isDark ? "#111C2E" : "#FFFFFF",
                  border: `1px solid ${isDark ? "#22334A" : "#E4E1DA"}`,
                  borderRadius: 10,
                  padding: "16px 18px"
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: "#356AE6", textTransform: "uppercase", marginBottom: 6 }}>
                  Select Python Challenge
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {pythonChallenges.map(chal => {
                    const isSelected = chal.slug === selectedPySlug;
                    return (
                      <div
                        key={chal.slug}
                        onClick={() => handleSelectPyChallenge(chal.slug)}
                        style={{
                          padding: "10px 12px",
                          borderRadius: 8,
                          backgroundColor: isSelected
                            ? (isDark ? "#16253C" : "#EFF4FE")
                            : (isDark ? "#0A101D" : "#F9FAFB"),
                          border: `1.5px solid ${isSelected ? "#356AE6" : (isDark ? "#1E2A3B" : "#E5E7EB")}`,
                          cursor: "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center"
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? "#FFFFFF" : "#111827" }}>
                            {chal.title}
                          </div>
                          <div style={{ fontSize: 11, color: isDark ? "#8FA0B8" : "#6B7280", marginTop: 2 }}>
                            {chal.summary}
                          </div>
                        </div>
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 800,
                            padding: "2px 6px",
                            borderRadius: 4,
                            backgroundColor: chal.difficulty === "advanced" ? "#FEF2F2" : "#F0FDF4",
                            color: chal.difficulty === "advanced" ? "#DC2626" : "#16A34A"
                          }}
                        >
                          {chal.difficulty.toUpperCase()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Environment Notice Card */}
              <div
                style={{
                  backgroundColor: isDark ? "#111C2E" : "#FFFFFF",
                  border: `1px solid ${isDark ? "#22334A" : "#E4E1DA"}`,
                  borderRadius: 10,
                  padding: "16px 18px"
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: "#F59E0B", textTransform: "uppercase", marginBottom: 6 }}>
                  Pure Python 3 Execution Environment
                </div>
                <div style={{ fontSize: 12, color: isDark ? "#B0C0D4" : "#4B5563", lineHeight: 1.5 }}>
                  This sandbox runs pure Python 3 standard library.
                  <br /><br />
                  <strong>Allowed:</strong> <code>math</code>, <code>statistics</code>, <code>collections</code>, <code>itertools</code>, <code>json</code>.
                  <br />
                  <strong>Notice:</strong> External packages (<code>numpy</code>, <code>pandas</code>, <code>scipy</code>) are intentionally restricted to evaluate core algorithmic implementation and statistical mechanics from first principles.
                </div>
              </div>
            </div>

            {/* Right Column: Code Editor & Execution Results */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Python Editor */}
              <div
                style={{
                  backgroundColor: isDark ? "#111C2E" : "#FFFFFF",
                  border: `1px solid ${isDark ? "#22334A" : "#E4E1DA"}`,
                  borderRadius: 10,
                  padding: "16px 18px"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: isDark ? "#FFFFFF" : "#111827" }}>
                    Python 3 Function Editor
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => {
                        if (activePyChallenge) setUserCode(activePyChallenge.starterCode);
                      }}
                      style={{
                        fontSize: 11,
                        padding: "4px 8px",
                        borderRadius: 4,
                        border: `1px solid ${isDark ? "#2E3F55" : "#D1D5DB"}`,
                        backgroundColor: "transparent",
                        color: isDark ? "#8FA0B8" : "#6B7280",
                        cursor: "pointer"
                      }}
                    >
                      Reset
                    </button>
                    <button
                      onClick={handleRunPython}
                      disabled={executingPy}
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        padding: "6px 16px",
                        borderRadius: 6,
                        backgroundColor: "#356AE6",
                        color: "#FFFFFF",
                        border: "none",
                        cursor: executingPy ? "wait" : "pointer"
                      }}
                    >
                      {executingPy ? "Running..." : "▶ Run Python"}
                    </button>
                  </div>
                </div>

                <textarea
                  value={userCode}
                  onChange={e => setUserCode(e.target.value)}
                  rows={10}
                  spellCheck={false}
                  style={{
                    width: "100%",
                    fontFamily: "'Fira Code', 'SF Mono', Monaco, monospace",
                    fontSize: 12.5,
                    lineHeight: 1.5,
                    backgroundColor: isDark ? "#0A101D" : "#1E293B",
                    color: "#F8FAFC",
                    border: `1px solid ${isDark ? "#22334A" : "#334155"}`,
                    borderRadius: 6,
                    padding: 12,
                    boxSizing: "border-box",
                    outline: "none"
                  }}
                />
              </div>

              {/* Python Results Output */}
              <div
                style={{
                  backgroundColor: isDark ? "#111C2E" : "#FFFFFF",
                  border: `1px solid ${isDark ? "#22334A" : "#E4E1DA"}`,
                  borderRadius: 10,
                  padding: "16px 18px",
                  minHeight: 220
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: isDark ? "#FFFFFF" : "#111827" }}>
                    Execution Output & Test Assertions
                  </div>
                  {pythonResult && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 11, color: isDark ? "#8FA0B8" : "#6B7280" }}>
                        ⏱️ {pythonResult.executionTimeMs} ms
                      </span>
                      <span
                        style={{
                          fontSize: 10.5,
                          fontWeight: 800,
                          padding: "2px 8px",
                          borderRadius: 4,
                          backgroundColor: pythonResult.status === "passed" ? "#EAF4EE" : "#FDF2F2",
                          color: pythonResult.status === "passed" ? "#2E7D5B" : "#C24141"
                        }}
                      >
                        {pythonResult.status.toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>

                {pythonResult ? (
                  <div>
                    {pythonResult.status === "environment_notice" ? (
                      <div
                        style={{
                          padding: "10px 12px",
                          borderRadius: 6,
                          backgroundColor: "#FEF3C7",
                          border: "1px solid #F59E0B",
                          color: "#92400E",
                          fontSize: 12,
                          lineHeight: 1.45
                        }}
                      >
                        {pythonResult.stderr}
                      </div>
                    ) : pythonResult.stderr ? (
                      <div
                        style={{
                          padding: "10px 12px",
                          borderRadius: 6,
                          backgroundColor: "#FEF2F2",
                          border: "1px solid #F87171",
                          color: "#991B1B",
                          fontSize: 12,
                          fontFamily: "monospace"
                        }}
                      >
                        {pythonResult.stderr}
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: 12, color: isDark ? "#B0C0D4" : "#4B5563", marginBottom: 8 }}>
                          {pythonResult.feedback}
                        </div>
                        {pythonResult.testResults && (
                          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                            {pythonResult.testResults.map((t: any, i: number) => (
                              <div
                                key={i}
                                style={{
                                  padding: "6px 10px",
                                  borderRadius: 4,
                                  backgroundColor: t.passed ? (isDark ? "#0A1B14" : "#F0FDF4") : (isDark ? "#270E0E" : "#FEF2F2"),
                                  border: `1px solid ${t.passed ? "#86EFAC" : "#FCA5A5"}`,
                                  fontSize: 11,
                                  fontFamily: "monospace",
                                  display: "flex",
                                  justifyContent: "space-between"
                                }}
                              >
                                <span>{t.testName}</span>
                                <strong>{t.passed ? "✓ PASS" : "✗ FAIL"}</strong>
                              </div>
                            ))}
                          </div>
                        )}

                        {pythonResult.status === "passed" && (
                          <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
                            <button
                              onClick={() => {
                                handlePersistAttempt(
                                  selectedPySlug,
                                  "code_lab",
                                  pythonResult.score || 100,
                                  true,
                                  mentorLevel === 4,
                                  { python_accuracy: pythonResult.score || 100 }
                                );
                              }}
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                padding: "6px 14px",
                                borderRadius: 6,
                                backgroundColor: "#2E7D5B",
                                color: "#FFFFFF",
                                border: "none",
                                cursor: "pointer"
                              }}
                            >
                              ✓ Sync Verified Competency to Student DNA
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div style={{ color: isDark ? "#8FA0B8" : "#9CA3AF", fontSize: 12, textAlign: "center", padding: "40px 0" }}>
                    Write Python solution above and click "▶ Run Python" to verify test assertions.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── SOCRATIC MENTOR DRAWER ── */}
      {mentorOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            right: 0,
            width: 440,
            maxWidth: "100%",
            height: "100vh",
            backgroundColor: isDark ? "#0E1726" : "#FFFFFF",
            borderLeft: `1px solid ${isDark ? "#22334A" : "#D1D5DB"}`,
            boxShadow: "-4px 0 20px rgba(0,0,0,0.25)",
            zIndex: 100,
            display: "flex",
            flexDirection: "column"
          }}
        >
          {/* Drawer Header */}
          <div
            style={{
              padding: "16px 20px",
              borderBottom: `1px solid ${isDark ? "#1E2A3B" : "#E5E7EB"}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#356AE6", textTransform: "uppercase" }}>
                AI Mentor Scaffolding
              </div>
              <div style={{ fontSize: 14, fontWeight: 800, color: isDark ? "#FFFFFF" : "#111827" }}>
                Socratic Diagnostic Guidance
              </div>
            </div>
            <button
              onClick={() => setMentorOpen(false)}
              style={{
                backgroundColor: "transparent",
                border: "none",
                fontSize: 18,
                color: isDark ? "#8FA0B8" : "#6B7280",
                cursor: "pointer"
              }}
            >
              ✕
            </button>
          </div>

          {/* Level Switcher (1-4) */}
          <div style={{ padding: "12px 20px", borderBottom: `1px solid ${isDark ? "#1E2A3B" : "#E5E7EB"}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#8FA0B8" : "#6B7280", marginBottom: 6 }}>
              Progressive Hint Scaffolding
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
              {[1, 2, 3, 4].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => {
                    if (lvl === 4 && !assistedWarningAcknowledged) {
                      const proceed = window.confirm("Requesting Level 4 (Full Walkthrough) will record this attempt as Assisted in your Student DNA. Continue?");
                      if (!proceed) return;
                      setAssistedWarningAcknowledged(true);
                    }
                    fetchMentorHint(lvl as any);
                  }}
                  style={{
                    padding: "6px 0",
                    fontSize: 11,
                    fontWeight: mentorLevel === lvl ? 800 : 600,
                    borderRadius: 4,
                    border: "none",
                    backgroundColor: mentorLevel === lvl ? "#356AE6" : isDark ? "#1E2A3B" : "#E5E7EB",
                    color: mentorLevel === lvl ? "#FFFFFF" : isDark ? "#8FA0B8" : "#4B5563",
                    cursor: "pointer"
                  }}
                >
                  Lvl {lvl} {lvl === 4 ? "⚠️" : ""}
                </button>
              ))}
            </div>
          </div>

          {/* Drawer Body */}
          <div style={{ padding: "20px", flex: 1, overflowY: "auto" }}>
            {loadingMentor ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: isDark ? "#8FA0B8" : "#6B7280" }}>
                Generating mentor guidance...
              </div>
            ) : mentorGuidance ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: 4,
                      backgroundColor: mentorGuidance.isAssisted ? "#FEF2F2" : "#EFF4FE",
                      color: mentorGuidance.isAssisted ? "#DC2626" : "#2563EB"
                    }}
                  >
                    {mentorGuidance.levelName}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: 12.5,
                    lineHeight: 1.6,
                    color: isDark ? "#E5E7EB" : "#374151",
                    whiteSpace: "pre-wrap"
                  }}
                >
                  {mentorGuidance.guidanceText}
                </div>

                {mentorGuidance.socraticQuestions && (
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: "#356AE6", marginBottom: 4 }}>
                      Reflective Questions:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: isDark ? "#9CA3AF" : "#4B5563" }}>
                      {mentorGuidance.socraticQuestions.map((q: string, i: number) => (
                        <li key={i} style={{ marginBottom: 4 }}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: isDark ? "#8FA0B8" : "#6B7280", fontSize: 12 }}>
                Click a hint level above to receive socratic scaffolding from the AI Mentor.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AiDataLabPage() {
  return (
    <Suspense fallback={<div style={{ padding: 40, textAlign: "center" }}>Loading AI & Data Labs...</div>}>
      <AiDataLabContent />
    </Suspense>
  );
}

