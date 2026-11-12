"use client";

import React, { useState, useMemo } from "react";
import {
  MASTER_CURRICULUM_SUBJECTS,
  TaxonomySubject,
  TaxonomyTopic,
} from "@/lib/skills/ai-data/master-curriculum-taxonomy";
import { TARGET_ROLE_PROFILES } from "@/lib/skills/ai-data/roles";
import { TargetRoleSlug } from "@/lib/skills/ai-data/types";
import { resolveNextTopicRecommendation } from "@/lib/skills/ai-data/sequencing-engine";

export type StudioTabKey = "overview" | "learn" | "practice" | "labs" | "projects" | "library";

interface StudioOverviewDashboardProps {
  candidateId: string;
  activeSubjectId: string;
  targetRoleSlug: TargetRoleSlug;
  completedTopicIds?: string[];
  onSelectRole: (role: TargetRoleSlug) => void;
  onSelectSubject: (subjectId: string) => void;
  onSelectTab: (tab: StudioTabKey) => void;
  onLaunchTopic: (topicId: string, subjectId: string) => void;
  onLaunchStudio: (studioId: string) => void;
  onLaunchOnboarding: () => void;
}

export default function StudioOverviewDashboard({
  candidateId,
  activeSubjectId,
  targetRoleSlug,
  completedTopicIds = [],
  onSelectRole,
  onSelectSubject,
  onSelectTab,
  onLaunchTopic,
  onLaunchStudio,
  onLaunchOnboarding,
}: StudioOverviewDashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");

  // Next milestone recommendation
  const nextMilestone = useMemo(() => {
    try {
      return resolveNextTopicRecommendation(targetRoleSlug, completedTopicIds);
    } catch {
      const firstSubject = MASTER_CURRICULUM_SUBJECTS[0];
      const firstMod = firstSubject.modules[0];
      const firstTopic = firstMod.topics[0];
      return {
        recommendedTopic: firstTopic,
        subject: firstSubject,
        module: firstMod,
        rationale: "Begin your foundational journey by mastering core programming invariants.",
      };
    }
  }, [targetRoleSlug, completedTopicIds]);

  // Filtered Subjects
  const filteredSubjects = useMemo(() => {
    return MASTER_CURRICULUM_SUBJECTS.filter((subject) => {
      if (selectedCategoryFilter !== "all") {
        const cat = selectedCategoryFilter.toLowerCase();
        const matchCat =
          subject.id.toLowerCase().includes(cat) ||
          subject.title.toLowerCase().includes(cat) ||
          subject.badge.toLowerCase().includes(cat);
        if (!matchCat) return false;
      }
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchSubject =
        subject.title.toLowerCase().includes(q) || subject.description.toLowerCase().includes(q);
      const matchModule = subject.modules.some(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.topics.some(
            (t) =>
              t.title.toLowerCase().includes(q) ||
              t.practicalOutcome.toLowerCase().includes(q)
          )
      );
      return matchSubject || matchModule;
    });
  }, [searchQuery, selectedCategoryFilter]);

  const activeRoleProfile = TARGET_ROLE_PROFILES[targetRoleSlug] || TARGET_ROLE_PROFILES.ai_engineer;

  // 10 Real Engineering Studios list
  const engineeringStudios = [
    {
      id: "python",
      name: "Python Lab",
      icon: "🐍",
      badge: "In-Browser REPL",
      desc: "Interactive Python execution, AST inspection, algorithm benchmarking, and test runner.",
      action: "Launch Python Lab",
    },
    {
      id: "sql",
      name: "SQL Studio",
      icon: "🗄️",
      badge: "In-Memory SQLite",
      desc: "Live relational database engine, EXPLAIN query plans, window functions, and analytics queries.",
      action: "Open SQL Studio",
    },
    {
      id: "ml",
      name: "ML Studio",
      icon: "🤖",
      badge: "Real Training",
      desc: "Train Logistic & Linear Regression, evaluate confusion matrices, and tune hyperparameters.",
      action: "Launch ML Studio",
    },
    {
      id: "stats",
      name: "Statistics Studio",
      icon: "📐",
      badge: "Hypothesis Testing",
      desc: "Probability distributions, Z-score/T-test calculators, p-values, and confidence intervals.",
      action: "Open Stats Studio",
    },
    {
      id: "pipeline",
      name: "Data Pipeline Studio",
      icon: "⚙️",
      badge: "Interactive DAG",
      desc: "Design and debug batch & streaming pipelines with Idempotency checks and Dead-Letter Queues.",
      action: "Open Pipeline DAG",
    },
    {
      id: "genai",
      name: "GenAI Studio",
      icon: "🔮",
      badge: "Prompt Playground",
      desc: "Prompt engineering playground, temperature/top-p controls, JSON mode, and token tracking.",
      action: "Open GenAI Studio",
    },
    {
      id: "rag",
      name: "RAG Studio",
      icon: "📚",
      badge: "Hybrid Search",
      desc: "Chunking visualizer, embedding cosine similarity, hybrid BM25 + dense search and RRF re-ranking.",
      action: "Open RAG Studio",
    },
    {
      id: "agent",
      name: "Agent Studio",
      icon: "🕵️",
      badge: "ReAct Loop",
      desc: "Multi-turn ReAct agents, dynamic tool execution trace, reflection loops, and state machines.",
      action: "Open Agent Studio",
    },
    {
      id: "mlops",
      name: "MLOps Studio",
      icon: "🚢",
      badge: "Model Registry",
      desc: "Model registry lifecycle (Dev → Staging → Prod), Population Stability Index (PSI), and canary rollout.",
      action: "Open MLOps Studio",
    },
    {
      id: "abtest",
      name: "Experiment Studio",
      icon: "🧪",
      badge: "A/B Testing",
      desc: "Sample ratio mismatch (SRM) Chi-square tests, minimum detectable effect (MDE), and uplift CI.",
      action: "Open Experiment Studio",
    },
  ];

  // Capstone Projects
  const capstoneProjects = [
    {
      id: "proj_churn",
      title: "Predictive Tabular ML: Customer Churn Defense",
      tag: "Classical ML & Business Impact",
      duration: "6 Hours",
      skills: ["Feature Store", "Cost-Sensitive Loss", "SHAP Values", "Canary Deployment"],
      desc: "Build an end-to-end churn prediction pipeline on 50,000 telco records with business ROI calibration.",
    },
    {
      id: "proj_rag",
      title: "Enterprise Document RAG with Hybrid BM25 & Semantic Search",
      tag: "GenAI & Information Retrieval",
      duration: "8 Hours",
      skills: ["Chunking Invariants", "pgvector", "Cross-Encoder Re-ranker", "RAGAS Evaluation"],
      desc: "Deploy a hallucination-resistant financial report Q&A engine with citation back-pointers and LLM-as-a-judge.",
    },
    {
      id: "proj_agents",
      title: "Autonomous Multi-Agent Technical Research Crew",
      tag: "Agentic AI & Orchestration",
      duration: "10 Hours",
      skills: ["LangGraph State Machine", "Sandboxed Code Execution", "Human-in-the-Loop Approval"],
      desc: "Orchestrate an analyst agent, coding agent, and validator agent coordinating through shared state memory.",
    },
    {
      id: "proj_stream",
      title: "Real-Time Streaming Feature Pipeline & Drift Monitor",
      tag: "Data Engineering & MLOps",
      duration: "7 Hours",
      skills: ["Event Ingestion", "Sliding Window Aggregation", "PSI Drift Detector", "Slack Alerting"],
      desc: "Stream live e-commerce clickstream events, compute real-time velocity features, and detect data drift.",
    },
  ];

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 20px" }}>
      {/* ── 1. HERO HEADER WITH ROLE SELECTION & CALIBRATION ── */}
      <section
        style={{
          background: "#FFFFFF",
          borderRadius: 12,
          border: "1px solid #E4E1DA",
          padding: "24px 28px",
          marginBottom: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 18 }}>
          <div style={{ maxWidth: 760 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: "#356AE6",
                  background: "#EFF4FE",
                  padding: "3px 8px",
                  borderRadius: 6,
                  border: "1px solid #D2E0FB",
                }}
              >
                Production Engineering Learning Platform
              </span>
              <span style={{ fontSize: 12, color: "#667085" }}>·</span>
              <span style={{ fontSize: 12, color: "#667085", fontWeight: 600 }}>
                14 Domains · 10 Studios · 50 Questions/Subtopic · Verifiable Evidence
              </span>
            </div>

            <h1
              style={{
                fontSize: 26,
                fontWeight: 800,
                color: "#162A43",
                letterSpacing: "-0.03em",
                margin: "0 0 10px 0",
              }}
            >
              AI &amp; Data Engineering Studio
            </h1>

            <p style={{ fontSize: 13.5, color: "#475467", lineHeight: 1.55, margin: 0 }}>
              Master modern AI, Machine Learning, Data Systems, and Production Engineering through real code execution,
              visual state tracing, company-calibrated question banks, and multi-layer portfolio projects.
            </p>
          </div>

          {/* Role Target & Baseline Assessment CTA */}
          <div
            style={{
              background: "#F6F5F1",
              borderRadius: 10,
              padding: "16px 20px",
              border: "1px solid #E4E1DA",
              minWidth: 280,
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", marginBottom: 6, textTransform: "uppercase" }}>
              Target Career Role
            </div>

            <div style={{ marginBottom: 12 }}>
              <select
                value={targetRoleSlug}
                onChange={(e) => onSelectRole(e.target.value as TargetRoleSlug)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: 7,
                  border: "1px solid #CBD5E1",
                  background: "#FFFFFF",
                  color: "#162A43",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                {Object.values(TARGET_ROLE_PROFILES).map((r) => (
                  <option key={r.slug} value={r.slug}>
                    {r.title} ({r.badge})
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={onLaunchOnboarding}
              style={{
                width: "100%",
                padding: "8px 14px",
                borderRadius: 7,
                border: "none",
                background: "linear-gradient(135deg, #162A43, #24416B)",
                color: "#FFFFFF",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                boxShadow: "0 2px 4px rgba(22, 42, 67, 0.15)",
              }}
            >
              <span>⚡</span>
              <span>Calibrate with Diagnostic</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── 2. CONTINUE LEARNING & RECOMMENDED NEXT MILESTONE ── */}
      <section
        style={{
          background: "linear-gradient(135deg, #EFF4FE 0%, #FFFFFF 100%)",
          borderRadius: 12,
          border: "1px solid #D2E0FB",
          padding: "20px 24px",
          marginBottom: 28,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ maxWidth: 820 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: "#2E7D5B",
                background: "#EAF4EE",
                padding: "2px 8px",
                borderRadius: 5,
                border: "1px solid #C4E2D0",
              }}
            >
              Recommended Next Milestone
            </span>
            <span style={{ fontSize: 12, color: "#667085" }}>
              Target Role: <strong style={{ color: "#162A43" }}>{activeRoleProfile.title}</strong>
            </span>
          </div>

          <h2 style={{ fontSize: 18, fontWeight: 800, color: "#162A43", margin: "0 0 6px 0" }}>
            {nextMilestone.subject.icon} {nextMilestone.subject.title} → {nextMilestone.recommendedTopic.title}
          </h2>

          <p style={{ fontSize: 13, color: "#475467", margin: "0 0 8px 0" }}>
            {nextMilestone.rationale || nextMilestone.recommendedTopic.practicalOutcome}
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 12, color: "#667085" }}>
            <span>⏱️ Estimated: <strong>{nextMilestone.recommendedTopic.estimatedMinutes} mins</strong></span>
            <span>·</span>
            <span>⚡ Difficulty: <strong style={{ textTransform: "capitalize" }}>{nextMilestone.recommendedTopic.difficulty}</strong></span>
            <span>·</span>
            <span>🎯 8-Stage Deep Learning Ready</span>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => onLaunchTopic(nextMilestone.recommendedTopic.id, nextMilestone.subject.id)}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: "#356AE6",
              color: "#FFFFFF",
              fontSize: 13,
              fontWeight: 800,
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(53, 106, 230, 0.25)",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span>Resume Learning</span>
            <span>→</span>
          </button>

          <button
            onClick={() => onSelectTab("practice")}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "1px solid #CBD5E1",
              background: "#FFFFFF",
              color: "#162A43",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Practice Questions
          </button>
        </div>
      </section>

      {/* ── 3. SEARCH & SUBJECT DOMAIN EXPLORER ── */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: "#162A43", margin: "0 0 4px 0" }}>
              14 Canonical Subject Domains
            </h2>
            <p style={{ fontSize: 12.5, color: "#667085", margin: 0 }}>
              Independently navigable curricula with progressive concept stages, code playgrounds, and revision notes.
            </p>
          </div>

          {/* Filter Pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {[
              { id: "all", label: "All 14 Subjects" },
              { id: "foundations", label: "Foundations" },
              { id: "data", label: "Data Systems" },
              { id: "learning", label: "ML & Deep Learning" },
              { id: "genai", label: "GenAI & Agents" },
              { id: "mlops", label: "MLOps & Safety" },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedCategoryFilter(f.id)}
                style={{
                  padding: "5px 12px",
                  borderRadius: 6,
                  border: selectedCategoryFilter === f.id ? "1px solid #356AE6" : "1px solid #E4E1DA",
                  background: selectedCategoryFilter === f.id ? "#EFF4FE" : "#FFFFFF",
                  color: selectedCategoryFilter === f.id ? "#356AE6" : "#667085",
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: 18 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="🔍 Search across all 14 domains, modules, concepts (e.g. 'Broadcasting', 'BM25', 'ReAct', 'Canary', 'PSI')..."
            style={{
              width: "100%",
              padding: "11px 16px",
              borderRadius: 8,
              border: "1px solid #E4E1DA",
              background: "#FFFFFF",
              color: "#162A43",
              fontSize: 13,
              outline: "none",
              boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
            }}
          />
        </div>

        {/* 14 Domain Cards Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))",
            gap: 16,
          }}
        >
          {filteredSubjects.map((subj) => {
            const isSelected = subj.id === activeSubjectId;
            const totalTopics = subj.modules.reduce((sum, m) => sum + m.topics.length, 0);
            const totalHours = subj.estimatedHours || 12;
            const completedInSubj = subj.modules
              .flatMap((m) => m.topics)
              .filter((t) => completedTopicIds.includes(t.id)).length;
            const progressPercent = totalTopics > 0 ? Math.round((completedInSubj / totalTopics) * 100) : 0;

            return (
              <div
                key={subj.id}
                style={{
                  background: "#FFFFFF",
                  borderRadius: 10,
                  border: isSelected ? "2px solid #356AE6" : "1px solid #E4E1DA",
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "all 0.15s ease",
                  boxShadow: isSelected ? "0 4px 12px rgba(53, 106, 230, 0.08)" : "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 24 }}>{subj.icon}</span>
                      <div>
                        <h3 style={{ fontSize: 15, fontWeight: 800, color: "#162A43", margin: 0 }}>
                          {subj.title}
                        </h3>
                        <span style={{ fontSize: 11, color: "#667085" }}>
                          {subj.modules.length} Modules · {totalTopics} Topics · ~{totalHours}h
                        </span>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: "2px 7px",
                        borderRadius: 5,
                        background: "#EFF4FE",
                        color: "#356AE6",
                        border: "1px solid #D2E0FB",
                      }}
                    >
                      {subj.badge || "Core"}
                    </span>
                  </div>

                  <p style={{ fontSize: 12.5, color: "#475467", lineHeight: 1.5, margin: "0 0 14px 0" }}>
                    {subj.description}
                  </p>

                  {/* Progress Bar */}
                  <div style={{ marginBottom: 14 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#667085", marginBottom: 4 }}>
                      <span>Mastery Progress</span>
                      <span style={{ fontWeight: 700, color: progressPercent > 0 ? "#2E7D5B" : "#667085" }}>
                        {completedInSubj} / {totalTopics} Topics ({progressPercent}%)
                      </span>
                    </div>
                    <div style={{ height: 5, background: "#F1F5F9", borderRadius: 3, overflow: "hidden" }}>
                      <div
                        style={{
                          width: `${progressPercent}%`,
                          height: "100%",
                          background: "#2E7D5B",
                          borderRadius: 3,
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Subject Actions */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTop: "1px solid #F1F5F9" }}>
                  <button
                    onClick={() => {
                      onSelectSubject(subj.id);
                      onSelectTab("learn");
                    }}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 6,
                      border: "none",
                      background: isSelected ? "#162A43" : "#EFF4FE",
                      color: isSelected ? "#FFFFFF" : "#356AE6",
                      fontSize: 11.5,
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Explore Curriculum →
                  </button>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => {
                        onSelectSubject(subj.id);
                        onSelectTab("practice");
                      }}
                      style={{
                        padding: "5px 10px",
                        borderRadius: 6,
                        border: "1px solid #E4E1DA",
                        background: "#FFFFFF",
                        color: "#667085",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      50 Questions 💼
                    </button>

                    <button
                      onClick={() => {
                        onSelectSubject(subj.id);
                        onSelectTab("library");
                      }}
                      style={{
                        padding: "5px 8px",
                        borderRadius: 6,
                        border: "1px solid #E4E1DA",
                        background: "#FFFFFF",
                        color: "#667085",
                        fontSize: 11,
                        cursor: "pointer",
                      }}
                      title="Download PDF Revision Notes"
                    >
                      📄 Notes
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 4. 10 REAL ENGINEERING STUDIOS ── */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: "#162A43", margin: "0 0 4px 0" }}>
              ⚡ 10 Real Engineering Studios
            </h2>
            <p style={{ fontSize: 12.5, color: "#667085", margin: 0 }}>
              Zero-simulation interactive playgrounds with real Node/SQLite/Python runtime execution, state diagrams, and debugging traces.
            </p>
          </div>

          <button
            onClick={() => onSelectTab("labs")}
            style={{
              padding: "7px 14px",
              borderRadius: 7,
              border: "1px solid #E4E1DA",
              background: "#FFFFFF",
              color: "#162A43",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            Open All Labs ▾
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 14,
          }}
        >
          {engineeringStudios.map((st) => (
            <div
              key={st.id}
              style={{
                background: "#FFFFFF",
                borderRadius: 10,
                border: "1px solid #E4E1DA",
                padding: "16px 18px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 22 }}>{st.icon}</span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: 4,
                      background: "#EFF4FE",
                      color: "#356AE6",
                      border: "1px solid #D2E0FB",
                    }}
                  >
                    {st.badge}
                  </span>
                </div>

                <h4 style={{ fontSize: 14, fontWeight: 800, color: "#162A43", margin: "0 0 6px 0" }}>
                  {st.name}
                </h4>

                <p style={{ fontSize: 11.5, color: "#667085", lineHeight: 1.45, margin: "0 0 12px 0" }}>
                  {st.desc}
                </p>
              </div>

              <button
                onClick={() => {
                  onLaunchStudio(st.id);
                  onSelectTab("labs");
                }}
                style={{
                  width: "100%",
                  padding: "6px 12px",
                  borderRadius: 6,
                  border: "1px solid #E4E1DA",
                  background: "#F6F5F1",
                  color: "#162A43",
                  fontSize: 11.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  textAlign: "center",
                }}
              >
                {st.action} →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── 5. CAPSTONE INDUSTRY APPLIED PROJECTS ── */}
      <section style={{ marginBottom: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <div>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: "#162A43", margin: "0 0 4px 0" }}>
              🚀 Multi-Layer Capstone Industry Projects
            </h2>
            <p style={{ fontSize: 12.5, color: "#667085", margin: 0 }}>
              Verifiable proof-of-work repositories designed to pass senior engineering hiring bar defenses.
            </p>
          </div>

          <button
            onClick={() => onSelectTab("projects")}
            style={{
              padding: "7px 14px",
              borderRadius: 7,
              border: "1px solid #E4E1DA",
              background: "#FFFFFF",
              color: "#162A43",
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            View Project Details ▾
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 16,
          }}
        >
          {capstoneProjects.map((p) => (
            <div
              key={p.id}
              style={{
                background: "#FFFFFF",
                borderRadius: 10,
                border: "1px solid #E4E1DA",
                padding: "18px 20px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 800,
                      color: "#7C3AED",
                      background: "#F5F3FF",
                      padding: "2px 7px",
                      borderRadius: 4,
                      border: "1px solid #DDD6FE",
                    }}
                  >
                    {p.tag}
                  </span>
                  <span style={{ fontSize: 11, color: "#667085", fontWeight: 600 }}>⏱️ {p.duration}</span>
                </div>

                <h4 style={{ fontSize: 14.5, fontWeight: 800, color: "#162A43", margin: "0 0 8px 0" }}>
                  {p.title}
                </h4>

                <p style={{ fontSize: 12, color: "#475467", lineHeight: 1.45, margin: "0 0 12px 0" }}>
                  {p.desc}
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
                  {p.skills.map((s, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: 10,
                        padding: "2px 6px",
                        borderRadius: 4,
                        background: "#F6F5F1",
                        color: "#475467",
                        border: "1px solid #E4E1DA",
                      }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onSelectTab("projects")}
                style={{
                  width: "100%",
                  padding: "7px 12px",
                  borderRadius: 6,
                  border: "none",
                  background: "#162A43",
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Inspect Architecture &amp; Code →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. STUDENT DNA READINESS & EVIDENCE SCORECARD ── */}
      <section
        style={{
          background: "#FFFFFF",
          borderRadius: 12,
          border: "1px solid #E4E1DA",
          padding: "22px 24px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "#162A43", margin: "0 0 4px 0" }}>
              🧬 Student DNA Evidence &amp; Verification Tiers
            </h3>
            <p style={{ fontSize: 12, color: "#667085", margin: 0 }}>
              Every completed studio execution, practice problem, and visual trace generates verifiable evidence claims.
            </p>
          </div>

          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 6,
              background: "#EAF4EE",
              color: "#2E7D5B",
              border: "1px solid #C4E2D0",
            }}
          >
            Tier: Calibrated Student
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 12 }}>
          {[
            { name: "Python Invariants", level: "L3 Verified", score: 85 },
            { name: "Relational SQL", level: "L2 Practiced", score: 70 },
            { name: "Classical ML", level: "L2 Practiced", score: 65 },
            { name: "RAG & Vector Search", level: "L3 Verified", score: 80 },
            { name: "Autonomous Agents", level: "L1 Exposed", score: 45 },
            { name: "Production MLOps", level: "L1 Exposed", score: 40 },
          ].map((item, idx) => (
            <div
              key={idx}
              style={{
                background: "#FAF9F6",
                borderRadius: 8,
                padding: "12px 14px",
                border: "1px solid #E4E1DA",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#162A43" }}>{item.name}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: "#356AE6" }}>{item.level}</span>
              </div>
              <div style={{ height: 4, background: "#E4E1DA", borderRadius: 2, overflow: "hidden" }}>
                <div
                  style={{
                    width: `${item.score}%`,
                    height: "100%",
                    background: "#356AE6",
                    borderRadius: 2,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
