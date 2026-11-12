"use client";

import React, { useState } from "react";

interface AppliedProjectsHubProps {
  candidateId: string;
  onBackToOverview?: () => void;
  onLaunchStudio?: (studioId: string) => void;
}

export default function AppliedProjectsHub({
  candidateId,
  onBackToOverview,
  onLaunchStudio,
}: AppliedProjectsHubProps) {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("proj_churn");
  const [activeMilestoneIndex, setActiveMilestoneIndex] = useState<number>(0);

  const projects = [
    {
      id: "proj_churn",
      title: "Predictive Tabular ML: Customer Churn Defense Engine",
      domain: "Machine Learning & Business ROI",
      duration: "6 Hours",
      stack: ["Python 3.11", "Scikit-Learn", "SHAP", "FastAPI", "Docker"],
      overview:
        "Build a production-grade churn mitigation pipeline on 50,000 telco accounts. Calibrate decision thresholds using asymmetrical business misclassification costs ($C_FN = 5 * C_FP), compute SHAP waterfall values for explainability, and package into a Dockerized inference microservice.",
      architecture: [
        { layer: "Data Ingestion", desc: "Temporal train/test split preventing future-data lookahead leakage." },
        { layer: "Feature Engineering", desc: "Tenure-to-spend ratios, support ticket escalation rates, contract renewal windows." },
        { layer: "Modeling & Optimization", desc: "Cost-sensitive logistic loss & gradient boosted trees with early stopping." },
        { layer: "Explainability", desc: "SHAP global feature importance and local instance waterfall explanations." },
        { layer: "Serving", desc: "FastAPI REST microservice with Pydantic contract validation and Prometheus metrics." },
      ],
      milestones: [
        {
          title: "Milestone 1: Data Audit & Temporal Split",
          tasks: [
            "Inspect target distribution and verify absence of target leakage features.",
            "Implement date-based temporal split (Train: months 1-9, Test: months 10-12).",
            "Establish naive baseline: majority class predicting zero-churn accuracy.",
          ],
          codeSnippet: `# Temporal Splitting Invariant
def temporal_train_test_split(df, date_col='signup_date', cutoff='2025-10-01'):
    train = df[df[date_col] < cutoff].copy()
    test = df[df[date_col] >= cutoff].copy()
    assert len(train) > 0 and len(test) > 0, "Split resulted in empty partition"
    return train, test`,
        },
        {
          title: "Milestone 2: Cost-Sensitive Calibration",
          tasks: [
            "Define business loss function: False Negative = $500 ARR loss, False Positive = $100 discount cost.",
            "Sweep decision threshold from 0.1 to 0.9 to find optimal profit frontier.",
            "Plot expected value curves against default 0.5 probability cutoff.",
          ],
          codeSnippet: `# Cost-Sensitive Threshold Optimizer
def find_optimal_threshold(y_true, y_probs, c_fn=500, c_fp=100):
    best_cost, best_thresh = float('inf'), 0.5
    for thresh in [i / 100 for i in range(10, 90)]:
        preds = (y_probs >= thresh).astype(int)
        fn = ((y_true == 1) & (preds == 0)).sum()
        fp = ((y_true == 0) & (preds == 1)).sum()
        total_cost = fn * c_fn + fp * c_fp
        if total_cost < best_cost:
            best_cost, best_thresh = total_cost, thresh
    return best_thresh, best_cost`,
        },
        {
          title: "Milestone 3: SHAP Feature Attribution",
          tasks: [
            "Compute TreeExplainer SHAP values across test partition.",
            "Generate top-5 global feature drivers of customer defection.",
            "Format individual customer attribution cards for customer success team.",
          ],
          codeSnippet: `import shap
explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X_test)
# Generate force plot for account A-102
shap.force_plot(explainer.expected_value, shap_values[0,:], X_test.iloc[0,:])`,
        },
      ],
    },
    {
      id: "proj_rag",
      title: "Enterprise Document RAG with Hybrid BM25 & Semantic Search",
      domain: "GenAI & Information Retrieval",
      duration: "8 Hours",
      stack: ["Python 3.11", "pgvector / PostgreSQL", "BM25", "Cross-Encoder", "FastAPI"],
      overview:
        "Architect an enterprise question-answering system over corporate policies and financial reports. Overcome pure dense search blindspots via hybrid sparse BM25 + dense vector retrieval merged through Reciprocal Rank Fusion (RRF), re-ranked with a cross-encoder, and evaluated via RAGAS faithfulness metrics.",
      architecture: [
        { layer: "Document Chunking", desc: "Markdown header-aware recursive chunking with 15% sliding window overlap." },
        { layer: "Vector & Lexical Store", desc: "PostgreSQL pgvector with HNSW index + BM25 inverted index for exact tokens." },
        { layer: "Fusion & Re-ranking", desc: "Reciprocal Rank Fusion (k=60) followed by Cross-Encoder scoring." },
        { layer: "Citation Back-pointers", desc: "Exact page number and character span grounding in generated LLM answers." },
        { layer: "RAGAS Evaluation", desc: "Golden dataset evaluation measuring Faithfulness and Context Precision." },
      ],
      milestones: [
        {
          title: "Milestone 1: Hybrid Retrieval & Reciprocal Rank Fusion",
          tasks: [
            "Ingest PDF documents and create recursive text chunks with section metadata.",
            "Generate dense embeddings (384-dim) and index in pgvector with HNSW cosine distance.",
            "Compute BM25 sparse scores and merge ranks using RRF formula: RRF_score = sum(1 / (k + rank)).",
          ],
          codeSnippet: `def reciprocal_rank_fusion(sparse_ranks, dense_ranks, k=60):
    scores = {}
    for rank, doc_id in enumerate(sparse_ranks):
        scores[doc_id] = scores.get(doc_id, 0.0) + (1.0 / (k + rank + 1))
    for rank, doc_id in enumerate(dense_ranks):
        scores[doc_id] = scores.get(doc_id, 0.0) + (1.0 / (k + rank + 1))
    return sorted(scores.items(), key=lambda x: x[1], reverse=True)`,
        },
        {
          title: "Milestone 2: Cross-Encoder Re-ranking",
          tasks: [
            "Pass top 20 candidate chunks through `cross-encoder/ms-marco-MiniLM-L-6-v2`.",
            "Filter down to top 4 highest confidence passages to maximize context density.",
            "Construct structured system prompt enforcing verbatim quote constraints.",
          ],
          codeSnippet: `from sentence_transformers import CrossEncoder
reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
pairs = [[query, doc.text] for doc in candidate_docs]
scores = reranker.predict(pairs)
ranked_docs = [doc for _, doc in sorted(zip(scores, candidate_docs), reverse=True)][:4]`,
        },
        {
          title: "Milestone 3: Grounded Citation Verification",
          tasks: [
            "Enforce LLM output format: claim followed by citation index `[1]`, `[2]`.",
            "Implement citation verifier validating substring containment in retrieved passage.",
            "Reject and trigger fallback when citation hallucination rate exceeds zero.",
          ],
          codeSnippet: `def verify_citations(answer: str, context_chunks: list[str]) -> bool:
    import re
    citations = re.findall(r'\\[(\\d+)\\]', answer)
    for c in citations:
        idx = int(c) - 1
        if idx < 0 or idx >= len(context_chunks):
            return False
    return True`,
        },
      ],
    },
    {
      id: "proj_agents",
      title: "Autonomous Multi-Agent Technical Research Crew",
      domain: "Agentic AI & Orchestration",
      duration: "10 Hours",
      stack: ["Python 3.11", "LangGraph", "Docker Sandbox", "SQLite"],
      overview:
        "Orchestrate a coordinated multi-agent team with dedicated roles: Planner, Python Sandbox Developer, and Verification Critic. Maintain typed state graph memory, enforce human-in-the-loop checkpoints for privileged operations, and implement automated self-reflection loops when unit tests fail.",
      architecture: [
        { layer: "Supervisor Planner", desc: "Decomposes high-level technical goals into acyclic execution steps." },
        { layer: "Coder Agent", desc: "Generates Python implementations conforming to strict type contracts." },
        { layer: "Sandbox Runner", desc: "Isolated Docker process execution with memory limits and syscall sandboxing." },
        { layer: "Critic Evaluator", desc: "Analyzes stdout and stderr, providing constructive feedback for retry loops." },
        { layer: "Human Approval Gate", desc: "Halts workflow and prompts user before destructive filesystem mutations." },
      ],
      milestones: [
        {
          title: "Milestone 1: State Machine & Typed Agent State",
          tasks: [
            "Define typed state dictionary with goal, execution plan, code artifacts, test logs, and iteration count.",
            "Implement conditional graph edges routing based on test success vs failure.",
            "Configure max loop budget (5 iterations) preventing infinite execution spin.",
          ],
          codeSnippet: `from typing import TypedDict, Annotated, Sequence
import operator

class AgentState(TypedDict):
    goal: str
    plan: list[str]
    code: str
    test_stdout: str
    iteration: int
    is_approved: bool`,
        },
        {
          title: "Milestone 2: ReAct Reflexion Loop",
          tasks: [
            "Execute generated code in sandbox and capture returncode.",
            "On failure, invoke Critic Agent to formulate diagnostic feedback.",
            "Prompt Coder Agent with previous code + exact error stacktrace for targeted patch.",
          ],
          codeSnippet: `def route_after_test(state: AgentState) -> str:
    if "FAIL" in state['test_stdout'] or state['test_stdout'].startswith("Traceback"):
        if state['iteration'] >= 5:
            return "escalate_to_human"
        return "critic_agent"
    return "human_approval_gate"`,
        },
      ],
    },
    {
      id: "proj_stream",
      title: "Real-Time Streaming Feature Store & Production Drift Sentinel",
      domain: "Data Engineering & MLOps",
      duration: "7 Hours",
      stack: ["Python 3.11", "Kafka / Redpanda", "Redis", "DuckDB", "Streamlit"],
      overview:
        "Stream high-velocity user interaction events, compute 1-hour and 24-hour sliding window velocity aggregates, write into an in-memory Redis feature store for sub-5ms model inference, and continuously compute Population Stability Index (PSI) drift metrics with automated canary rollback.",
      architecture: [
        { layer: "Event Ingestion", desc: "Kafka / Redpanda partitioned topic processing 2,000 events/sec." },
        { layer: "Windowed Aggregation", desc: "Sliding window aggregation computing purchase velocity and login anomalies." },
        { layer: "Feature Serving", desc: "Redis hashes serving online feature vectors with sub-5ms latency." },
        { layer: "Drift Sentinel", desc: "Automated cron calculating PSI and Kolmogorov-Smirnov statistics against baseline." },
        { layer: "Canary Rollback", desc: "Automated webhook reducing canary traffic to 0% upon PSI breach." },
      ],
      milestones: [
        {
          title: "Milestone 1: Sliding Window Velocity Aggregations",
          tasks: [
            "Process stream of user transactions with event timestamps.",
            "Compute 1-hour rolling transaction count and cumulative dollar amount using Redis sorted sets.",
            "Implement TTL expiration to prevent memory bloat in online store.",
          ],
          codeSnippet: `import time
def record_event(redis_client, user_id: str, amount: float):
    now = time.time()
    key = f"user_events:{user_id}"
    redis_client.zadd(key, {f"{now}:{amount}": now})
    # Evict events older than 1 hour (3600 seconds)
    redis_client.zremrangebyscore(key, 0, now - 3600)
    redis_client.expire(key, 7200)`,
        },
        {
          title: "Milestone 2: Population Stability Index (PSI) Drift Monitor",
          tasks: [
            "Bin baseline training feature distribution into 10 deciles.",
            "Compare against live streaming inference feature distribution over last 24 hours.",
            "Calculate PSI = sum((Actual% - Expected%) * ln(Actual% / Expected%)).",
          ],
          codeSnippet: `import numpy as np
def calculate_psi(expected: np.ndarray, actual: np.ndarray, num_buckets=10) -> float:
    # Bin distributions and compute PSI
    exp_pct = expected / np.sum(expected) + 1e-4
    act_pct = actual / np.sum(actual) + 1e-4
    psi = np.sum((act_pct - exp_pct) * np.log(act_pct / exp_pct))
    return float(psi)`,
        },
      ],
    },
  ];

  const activeProject = projects.find((p) => p.id === selectedProjectId) || projects[0];
  const activeMilestone = activeProject.milestones[activeMilestoneIndex] || activeProject.milestones[0];

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
            {onBackToOverview && (
              <button
                onClick={onBackToOverview}
                style={{
                  background: "none",
                  border: "none",
                  color: "#667085",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                ← Studio Overview
              </button>
            )}
            <span style={{ color: "#E4E1DA" }}>/</span>
            <span style={{ color: "#356AE6", fontSize: 12, fontWeight: 700 }}>Capstone Projects</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: "#162A43", margin: 0, letterSpacing: "-0.02em" }}>
            Multi-Layer Capstone Industry Projects
          </h1>
          <p style={{ margin: "2px 0 0", fontSize: 12, color: "#667085" }}>
            End-to-end architectures, step-by-step milestones, code artifacts, and technical defense rubrics.
          </p>
        </div>

        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: "4px 10px",
            borderRadius: 6,
            background: "#EFF4FE",
            color: "#356AE6",
            border: "1px solid #D2E0FB",
          }}
        >
          Portfolio Proof-of-Work
        </span>
      </div>

      {/* Project Selector Tabs */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: 12,
          marginBottom: 24,
        }}
      >
        {projects.map((proj) => {
          const isSelected = selectedProjectId === proj.id;
          return (
            <button
              key={proj.id}
              onClick={() => {
                setSelectedProjectId(proj.id);
                setActiveMilestoneIndex(0);
              }}
              style={{
                background: isSelected ? "#FFFFFF" : "#FAF9F6",
                border: isSelected ? "2px solid #356AE6" : "1px solid #E4E1DA",
                borderRadius: 10,
                padding: "14px 16px",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.15s ease",
                boxShadow: isSelected ? "0 4px 12px rgba(53, 106, 230, 0.08)" : "none",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: isSelected ? "#356AE6" : "#667085",
                    background: isSelected ? "#EFF4FE" : "#F1F5F9",
                    padding: "2px 6px",
                    borderRadius: 4,
                  }}
                >
                  {proj.domain}
                </span>
                <span style={{ fontSize: 11, color: "#667085" }}>⏱️ {proj.duration}</span>
              </div>
              <div style={{ fontSize: 13.5, fontWeight: 800, color: "#162A43", lineHeight: 1.35 }}>
                {proj.title}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Project Full Detail */}
      <div
        style={{
          background: "#FFFFFF",
          borderRadius: 12,
          border: "1px solid #E4E1DA",
          padding: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        {/* Project Header */}
        <div style={{ borderBottom: "1px solid #F1F5F9", paddingBottom: 18, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
            <div style={{ maxWidth: 860 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#7C3AED", background: "#F5F3FF", padding: "3px 8px", borderRadius: 4, border: "1px solid #DDD6FE" }}>
                {activeProject.domain}
              </span>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: "#162A43", margin: "8px 0 6px 0" }}>
                {activeProject.title}
              </h2>
              <p style={{ fontSize: 13, color: "#475467", lineHeight: 1.5, margin: 0 }}>
                {activeProject.overview}
              </p>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxWidth: 280 }}>
              {activeProject.stack.map((tech, idx) => (
                <span key={idx} style={{ fontSize: 11, padding: "3px 8px", borderRadius: 5, background: "#F6F5F1", color: "#162A43", border: "1px solid #E4E1DA", fontWeight: 600 }}>
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 5-Layer Architecture Breakdown */}
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "#162A43", margin: "0 0 12px 0" }}>
            🏗️ 5-Layer System Architecture
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12 }}>
            {activeProject.architecture.map((layer, idx) => (
              <div
                key={idx}
                style={{
                  background: "#FAF9F6",
                  borderRadius: 8,
                  padding: "12px 14px",
                  border: "1px solid #E4E1DA",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: "#356AE6", marginBottom: 4 }}>
                  LAYER {idx + 1}: {layer.layer}
                </div>
                <div style={{ fontSize: 11.5, color: "#475467", lineHeight: 1.45 }}>
                  {layer.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step-by-Step Milestones & Code Inspection */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "#162A43", margin: 0 }}>
              📋 Implementation Milestones
            </h3>
            <div style={{ display: "flex", gap: 6 }}>
              {activeProject.milestones.map((m, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveMilestoneIndex(idx)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 6,
                    border: activeMilestoneIndex === idx ? "1px solid #356AE6" : "1px solid #E4E1DA",
                    background: activeMilestoneIndex === idx ? "#EFF4FE" : "#FFFFFF",
                    color: activeMilestoneIndex === idx ? "#356AE6" : "#667085",
                    fontSize: 11.5,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Milestone {idx + 1}
                </button>
              ))}
            </div>
          </div>

          <div style={{ background: "#FAF9F6", borderRadius: 10, border: "1px solid #E4E1DA", padding: 18 }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: "#162A43", margin: "0 0 10px 0" }}>
              {activeMilestone.title}
            </h4>

            <ul style={{ margin: "0 0 16px 0", paddingLeft: 20, fontSize: 12.5, color: "#475467", lineHeight: 1.6 }}>
              {activeMilestone.tasks.map((task, tIdx) => (
                <li key={tIdx} style={{ marginBottom: 4 }}>{task}</li>
              ))}
            </ul>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", marginBottom: 6 }}>
                PRODUCTION CODE ARTIFACT
              </div>
              <pre
                style={{
                  margin: 0,
                  padding: 14,
                  borderRadius: 8,
                  background: "#FFFFFF",
                  border: "1px solid #CBD5E1",
                  fontFamily: "monospace",
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: "#162A43",
                  overflowX: "auto",
                }}
              >
                <code>{activeMilestone.codeSnippet}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

