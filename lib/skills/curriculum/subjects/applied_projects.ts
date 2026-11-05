/**
 * lib/skills/curriculum/subjects/applied_projects.ts
 * 
 * Applied Industry AI Labs & Capstone Projects:
 * Real-world multi-discipline engineering projects combining SQL,
 * Machine Learning, Vector Retrieval, Agentic Workflows, and MLOps.
 */

import { CanonicalSubject } from "../types";

export const APPLIED_PROJECTS_SUBJECT: CanonicalSubject = {
  slug: "applied_projects",
  name: "Applied Industry AI Labs & Projects",
  icon: "🏆",
  category: "AI & Modern ML",
  tagline: "End-to-End Enterprise Architecture & Portfolio Capstones",
  description: "Build, debug, and defend verified end-to-end production systems: real-time payment fraud detectors, hybrid search RAG copilots, and autonomous support agents.",
  estimatedHours: 50,
  prerequisites: ["python", "sql", "machine_learning", "genai_llm"],
  chapters: [
    {
      slug: "enterprise-capstones",
      chapterNumber: 1,
      title: "Chapter 1: Production Multi-System Capstones",
      description: "Build robust multi-tier applications with real-world datasets, low latency SLAs, and automated integration testing.",
      topics: [
        {
          slug: "fraud-detection-pipeline",
          title: "Real-Time Payment Fraud Detection Engine",
          summary: "Integrate relational transactions, sliding window aggregations, XGBoost inference, and circuit breakers.",
          subtopics: [
            {
              id: "proj-101",
              slug: "realtime-fraud-detection-engine",
              title: "End-to-End Capstone: High-Throughput Financial Fraud Scoring Engine",
              subjectSlug: "applied_projects",
              chapterSlug: "enterprise-capstones",
              topicSlug: "fraud-detection-pipeline",
              estimatedMinutes: 45,
              difficulty: "advanced",
              canonicalSkill: "classical_ml_modeling",
              prerequisites: [],
              learningGoal: "Construct an end-to-end scoring pipeline that extracts velocity features, queries trained model weights, and applies decision thresholds within 20ms.",
              intuitiveStory: "When you tap your credit card at a coffee shop, Visa has 50 milliseconds to decide whether to approve or decline. In that time, the system must check your past 10 transactions, calculate your geographic distance, run an ML model, and record the event.",
              analogy: "A production fraud engine is an airport customs checkpoint that must process a passenger in seconds without causing a line to back up.",
              formalConcept: "The scoring pipeline combines a fast feature store (in-memory sliding windows: tx_count_1h, amount_ratio_30d), vectorized model scoring, and calibrated policy rules (e.g. decline if p > 0.85, review if 0.65 < p <= 0.85).",
              mathFormula: "\\text{RiskScore}(x) = f_{\\text{model}}(x_v, x_u) \\times \\mathbb{I}_{\\text{geo\\_speed} < 800\\text{mph}}",
              productionSignificance: "Financial institutions handle billions in transactions daily; a 1% false positive drop saves millions in merchant processing disputes.",
              visualType: "memory_graph",
              mermaidDiagram: `graph LR
    Tx["Incoming Transaction: {user_id: 101, amount: $1200}"] --> Features["Fast Feature Lookup<br/>1h Velocity, 30d Avg Amount"]
    Features --> Score["Model Inference<br/>XGBoost Calibrated Probability"]
    Score --> Policy{"Policy Engine"}
    Policy -- "p < 0.05" --> Approve["Approve (< 15ms)"]
    Policy -- "0.05 <= p < 0.30" --> MFA["Challenge 2FA"]
    Policy -- "p >= 0.30" --> Decline["Block & Alert Ops"]`,
              demonstrationSteps: [
                {
                  stepNumber: 1,
                  title: "End-to-End Pipeline Handler",
                  explanation: "Coordinates velocity lookup and calibrated score thresholds.",
                  codeOrQuery: `def score_transaction(tx: dict, user_history: dict) -> dict:
    # Feature engineering
    avg_amt = user_history.get("avg_30d", 50.0)
    ratio = tx["amount"] / max(1.0, avg_amt)
    tx_velocity_1h = user_history.get("count_1h", 0)
    
    # Model scoring logic
    score = 0.02
    if ratio > 5.0: score += 0.40
    if tx_velocity_1h > 3: score += 0.45
    
    decision = "APPROVE"
    if score >= 0.50: decision = "DECLINE"
    elif score >= 0.20: decision = "MFA_CHALLENGE"
    
    return {"decision": decision, "risk_score": round(score, 3)}

user = {"avg_30d": 40.0, "count_1h": 5}
tx = {"amount": 500.0, "user_id": 999}
print(score_transaction(tx, user))`,
                  outputSummary: "{'decision': 'DECLINE', 'risk_score': 0.87}"
                }
              ],
              audioNarrationScript: "An applied machine learning capstone requires thinking beyond raw accuracy. You must consider system latency, fallback strategies when databases time out, and explainability so customers know why their transaction was declined.",
              coBuildSlot: {
                slotId: "proj-slot-101",
                instruction: "Complete decision condition: if score >= 0.50: return 'DECLINE' elif score >= 0.20: return 'MFA_CHALLENGE' else: return 'APPROVE'.",
                starterSnippet: `def make_decision(score: float) -> str:\n    if score >= 0.50:\n        return "DECLINE"\n    elif score >= 0.20:\n        return "MFA_CHALLENGE"\n    return "APPROVE"`,
                expectedPattern: "if\\s+score\\s*>=.*return\\s+[\"']DECLINE[\"']",
                hint1: "Compare score against 0.50 and 0.20 thresholds.",
                hint2: "Write the if/elif/else block returning 'DECLINE', 'MFA_CHALLENGE', or 'APPROVE'.",
                validationExplanation: "Correctly implements multi-tiered risk policy decisions."
              },
              executionEnvironment: "python_sandbox",
              starterCodeOrQuery: `def make_decision(score: float) -> str:
    if score >= 0.50:
        return "DECLINE"
    elif score >= 0.20:
        return "MFA_CHALLENGE"
    return "APPROVE"

print("Score 0.85 ->", make_decision(0.85))
print("Score 0.35 ->", make_decision(0.35))
print("Score 0.04 ->", make_decision(0.04))
`,
              debugFault: {
                faultId: "proj-fault-101",
                title: "Zero Division on New User With Empty Transaction History",
                buggyCodeOrConfig: `def compute_ratio(amount, avg_history):
    # Bug: When user has 0 prior transactions, avg_history is 0.0 -> ZeroDivisionError
    return amount / avg_history`,
                correctCodeOrConfig: `def compute_ratio(amount, avg_history):
    return amount / max(1.0, avg_history)`,
                diagnosticHint: "Use max(1.0, avg_history) to handle zero-history cold-start users.",
                explanation: "Production services must handle cold-start entities gracefully without throwing runtime exceptions."
              },
              comprehensionChecks: [
                {
                  id: "proj-cc-101a",
                  question: "Why should a financial fraud engine utilize a tiered policy (Approve, MFA, Decline) rather than a binary approve/decline gate?",
                  options: [
                    "Because binary gates are forbidden by law.",
                    "Because soft step-up authentication (MFA) captures suspicious transactions without permanently locking out legitimate users making atypical purchases.",
                    "Because ML models cannot produce probabilities.",
                    "Because MFA takes zero seconds."
                  ],
                  correctIndex: 1,
                  explanation: "Tiered policies balance fraud loss prevention against user friction and customer churn."
                }
              ],
              independentChallenge: {
                challengeId: "proj-chal-101",
                title: "Production Rate Limiter & Circuit Breaker",
                description: "Implement a sliding window circuit breaker that trips to 'OPEN' state when more than 5 errors occur within a 60-second window.",
                starterCode: `class CircuitBreaker:
    def __init__(self, max_failures: int = 5, window_sec: int = 60):
        self.max_failures = max_failures
        self.window_sec = window_sec
        self.failure_timestamps: list[float] = []

    def record_failure(self, now: float) -> bool:
        self.failure_timestamps = [t for t in self.failure_timestamps if now - t <= self.window_sec]
        self.failure_timestamps.append(now)
        return len(self.failure_timestamps) >= self.max_failures

    def is_open(self, now: float) -> bool:
        self.failure_timestamps = [t for t in self.failure_timestamps if now - t <= self.window_sec]
        return len(self.failure_timestamps) >= self.max_failures
`,
                solutionCode: `class CircuitBreaker:
    def __init__(self, max_failures: int = 5, window_sec: int = 60):
        self.max_failures = max_failures
        self.window_sec = window_sec
        self.failure_timestamps: list[float] = []

    def record_failure(self, now: float) -> bool:
        self.failure_timestamps = [t for t in self.failure_timestamps if now - t <= self.window_sec]
        self.failure_timestamps.append(now)
        return len(self.failure_timestamps) >= self.max_failures

    def is_open(self, now: float) -> bool:
        self.failure_timestamps = [t for t in self.failure_timestamps if now - t <= self.window_sec]
        return len(self.failure_timestamps) >= self.max_failures
`,
                testCases: [
                  {
                    input: "5 errors within 10 seconds",
                    expectedOutput: "is_open() returns True",
                    description: "Trips breaker when failure threshold is exceeded."
                  }
                ],
                rubric: {
                  correctness: 40,
                  codeQuality: 30,
                  efficiency: 30
                }
              }
            }
          ]
        }
      ]
    }
  ]
};

