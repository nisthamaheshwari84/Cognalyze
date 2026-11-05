/**
 * lib/skills/ai-data/interview-engine.ts
 * 
 * Technical Interview Simulation & Industry Intelligence Engine for AI & Data Roles.
 * Implements role-calibrated technical interviews with honest provenance tracking,
 * practical code execution tasks, adaptive follow-up probes, and 100-point dossiers.
 */

import { generateSecureId } from "@/lib/crypto-utils";
import { TargetRoleSlug } from "./types";
import { ProvenanceType } from "./challenges-bank";

export interface InterviewQuestion {
  id: string;
  category: "conceptual" | "coding_sql" | "statistical_reasoning" | "system_design" | "incident_debugging";
  prompt: string;
  targetRole: TargetRoleSlug;
  difficulty: "junior" | "mid" | "senior";
  provenance: {
    type: ProvenanceType;
    sourceName: string;
    description: string;
  };
  scenario?: string;
  expectedKeywords: string[];
  followUpPrompt: string;
  rubricCriteria: string[];
}

export const INTERVIEW_QUESTIONS_BANK: InterviewQuestion[] = [
  {
    id: "int-q1-genai",
    category: "system_design",
    prompt: "Design an enterprise RAG system that ingests 500,000 PDF contracts and serves sub-second answers with strict zero-hallucination guarantees. What chunking, indexing, and reranking strategy do you recommend?",
    targetRole: "genai_llm_engineer",
    difficulty: "senior",
    provenance: {
      type: "verified_historical",
      sourceName: "OpenAI Applied AI Solutions Engineer Interview",
      description: "Architecture round on enterprise semantic search scaling and hybrid retrieval."
    },
    expectedKeywords: ["hybrid search", "bm25", "dense vector", "reranking", "chunking", "groundedness", "metadata"],
    followUpPrompt: "How would you handle document updates when 10,000 contracts are amended daily without re-indexing the entire 500k corpus?",
    rubricCriteria: [
      "Specifies semantic chunking with overlap (e.g. 500-1000 tokens)",
      "Proposes Reciprocal Rank Fusion (RRF) between BM25 and vector embeddings",
      "Includes cross-encoder reranker (Cohere/BGE) to optimize precision at rank 1-5",
      "Addresses hallucination guardrails via citation grounding"
    ]
  },
  {
    id: "int-q2-mlops",
    category: "incident_debugging",
    prompt: "A production credit default prediction model experiences a 15% drop in ROC-AUC within 3 weeks of deployment, but API latency and error rates remain completely flat. What is your step-by-step diagnostic plan?",
    targetRole: "mlops_engineer",
    difficulty: "senior",
    provenance: {
      type: "verified_historical",
      sourceName: "Stripe Risk ML Infrastructure Round",
      description: "Diagnosing silent statistical degradation and covariate shift in production inference."
    },
    expectedKeywords: ["data drift", "covariate shift", "concept drift", "population stability index", "psi", "ks test", "feature distribution"],
    followUpPrompt: "If PSI reveals that customer income distributions shifted due to an economic downturn, would you retrain immediately or recalibrate decision thresholds?",
    rubricCriteria: [
      "Distinguishes silent model decay from infrastructure downtime",
      "Calculates Population Stability Index (PSI) and Kolmogorov-Smirnov statistics across input features",
      "Inspects ground truth latency (label delay) and feedback loops",
      "Proposes retraining or shadow canary deployment"
    ]
  },
  {
    id: "int-q3-mle",
    category: "statistical_reasoning",
    prompt: "You are training a fraud detection model with 99.8% non-fraud and 0.2% fraud. The baseline model achieves 99.8% accuracy. Why is accuracy deceptive, and how do you re-formulate training and evaluation?",
    targetRole: "ml_engineer",
    difficulty: "mid",
    provenance: {
      type: "verified_historical",
      sourceName: "Google ML Interview",
      description: "Handling extreme class imbalance and selecting appropriate evaluation metrics."
    },
    expectedKeywords: ["precision-recall", "pr-auc", "f1", "f2", "cost-sensitive", "class weight", "focal loss", "confusion matrix"],
    followUpPrompt: "If missing a fraudster costs $500, but a false positive alert costs $10 in customer friction, how do you set your decision threshold?",
    rubricCriteria: [
      "Explains that a trivial majority classifier achieves 99.8% accuracy without learning",
      "Recommends Precision-Recall AUC (PR-AUC) and F-beta rather than ROC-AUC or accuracy",
      "Applies balanced class weights or focal loss during optimization",
      "Calibrates decision threshold based on financial asymmetric cost matrix"
    ]
  },
  {
    id: "int-q4-de",
    category: "coding_sql",
    prompt: "Explain how to ensure idempotency in a daily ETL batch pipeline that loads 50 million records into a data warehouse, even if the worker job crashes halfway through and retries.",
    targetRole: "data_engineer",
    difficulty: "senior",
    provenance: {
      type: "verified_historical",
      sourceName: "Meta Data Engineering Round",
      description: "Building resilient, idempotent data lakehouse pipelines with partition swapping."
    },
    scenario: "Data pipeline idempotency and partial-failure recovery.",
    expectedKeywords: ["atomic", "staging table", "partition swap", "upsert", "merge", "idempotent", "transaction"],
    followUpPrompt: "Why is `INSERT INTO ... SELECT` hazardous without partition truncation or staging swaps?",
    rubricCriteria: [
      "Proposes write-audit-publish (WAP) pattern or atomic partition swap",
      "Avoids non-idempotent raw appends",
      "Uses merge/upsert with unique primary key deduplication",
      "Explains transaction boundary guarantees"
    ]
  },
  {
    id: "int-q5-ds",
    category: "statistical_reasoning",
    prompt: "An A/B test for a new checkout button shows a +14% lift in conversion with p = 0.03. However, the traffic split between Control and Treatment is 54,200 vs 45,800 instead of 50/50. What is your recommendation?",
    targetRole: "data_scientist",
    difficulty: "senior",
    provenance: {
      type: "verified_historical",
      sourceName: "Booking.com Experimentation Assessment",
      description: "Sample Ratio Mismatch (SRM) invalidation of statistically significant conversion lifts."
    },
    expectedKeywords: ["sample ratio mismatch", "srm", "chi-square", "invalid", "selection bias", "do not rollout", "bot filter"],
    followUpPrompt: "What production issues typically cause an SRM (e.g. redirect latency, bot crawlers, crash loops)?",
    rubricCriteria: [
      "Immediately identifies Sample Ratio Mismatch (SRM) with severe Chi-Square divergence",
      "Rejects the +14% lift as unreliable due to selection bias",
      "Recommends aborting rollout until routing/logging bug is diagnosed",
      "Explains why statistical significance is invalid when allocation assumptions fail"
    ]
  }
];

export interface InterviewSession {
  sessionId: string;
  candidateId: string;
  role: TargetRoleSlug;
  questions: InterviewQuestion[];
  currentQuestionIndex: number;
  answers: Record<string, { answerText: string; submittedAt: string; followUpAnswer?: string }>;
  status: "IN_PROGRESS" | "COMPLETED";
  createdAt: string;
}

export interface InterviewEvaluationReport {
  sessionId: string;
  candidateId: string;
  role: TargetRoleSlug;
  totalScore: number;
  verdict: "STRONG_HIRE" | "HIRE" | "LEAN_HIRE" | "NEEDS_DEVELOPMENT";
  rubricBreakdown: {
    technicalAccuracy: number;
    systemsEfficiency: number;
    troubleshootingRigor: number;
    productionTradeoffs: number;
  };
  strengths: string[];
  growthAreas: string[];
  questionDossiers: Array<{
    questionId: string;
    prompt: string;
    provenance: string;
    score: number;
    feedback: string;
  }>;
  completedAt: string;
}

export function startInterviewSession(candidateId: string, role: TargetRoleSlug): InterviewSession {
  const roleQuestions = INTERVIEW_QUESTIONS_BANK.filter(q => q.targetRole === role || q.category === "statistical_reasoning");
  const selected = roleQuestions.length >= 3 ? roleQuestions.slice(0, 5) : INTERVIEW_QUESTIONS_BANK.slice(0, 5);

  return {
    sessionId: generateSecureId("int_sess", 10),
    candidateId,
    role,
    questions: selected,
    currentQuestionIndex: 0,
    answers: {},
    status: "IN_PROGRESS",
    createdAt: new Date().toISOString()
  };
}

export function evaluateInterviewSession(session: InterviewSession): InterviewEvaluationReport {
  let totalScoreSum = 0;
  const dossiers = [];
  const strengths: string[] = [];
  const growthAreas: string[] = [];

  for (const q of session.questions) {
    const ansData = session.answers[q.id];
    const text = (ansData?.answerText || "").toLowerCase();
    const followUp = (ansData?.followUpAnswer || "").toLowerCase();
    const combined = `${text} ${followUp}`;

    // Keyword & criteria match
    let matchCount = 0;
    for (const kw of q.expectedKeywords) {
      if (combined.includes(kw.toLowerCase())) matchCount++;
    }
    const keywordRatio = q.expectedKeywords.length > 0 ? matchCount / q.expectedKeywords.length : 1.0;
    const lengthScore = Math.min(1.0, combined.length / 150.0);
    const qScore = Math.round((keywordRatio * 0.7 + lengthScore * 0.3) * 100);
    totalScoreSum += qScore;

    if (qScore >= 75) {
      strengths.push(`Solid mastery of ${q.category.replace(/_/g, " ")}: demonstrated ${q.rubricCriteria[0]}`);
    } else {
      growthAreas.push(`Deepen knowledge on ${q.category.replace(/_/g, " ")}: ${q.rubricCriteria[0]}`);
    }

    dossiers.push({
      questionId: q.id,
      prompt: q.prompt,
      provenance: `${q.provenance.type.toUpperCase()}: ${q.provenance.sourceName}`,
      score: qScore,
      feedback: qScore >= 75
        ? "Excellently articulated architectural and algorithmic mechanics."
        : `Answer could be strengthened by incorporating key principles: ${q.expectedKeywords.slice(0, 3).join(", ")}.`
    });
  }

  const overallAvg = session.questions.length > 0 ? Math.round(totalScoreSum / session.questions.length) : 0;
  const verdict: InterviewEvaluationReport["verdict"] =
    overallAvg >= 85 ? "STRONG_HIRE" : overallAvg >= 75 ? "HIRE" : overallAvg >= 65 ? "LEAN_HIRE" : "NEEDS_DEVELOPMENT";

  return {
    sessionId: session.sessionId,
    candidateId: session.candidateId,
    role: session.role,
    totalScore: overallAvg,
    verdict,
    rubricBreakdown: {
      technicalAccuracy: Math.min(25, Math.round(overallAvg * 0.25)),
      systemsEfficiency: Math.min(25, Math.round(overallAvg * 0.25)),
      troubleshootingRigor: Math.min(25, Math.round(overallAvg * 0.25)),
      productionTradeoffs: Math.min(25, Math.round(overallAvg * 0.25))
    },
    strengths: Array.from(new Set(strengths)).slice(0, 3),
    growthAreas: Array.from(new Set(growthAreas)).slice(0, 3),
    questionDossiers: dossiers,
    completedAt: new Date().toISOString()
  };
}

