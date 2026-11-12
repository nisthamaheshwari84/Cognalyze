/**
 * lib/skills/ai-data/sequencing-engine.ts
 *
 * Intelligent Prerequisite & Curriculum Sequencing Engine for AI & Data Arena.
 * Determines the prerequisite-aware learning progression across all 8 career roles:
 * - Data Analyst
 * - Data Scientist
 * - Data Engineer
 * - Machine Learning Engineer
 * - MLOps Engineer
 * - AI Engineer
 * - Generative AI & LLM Engineer
 * - Applied AI Engineer
 *
 * Reuses shared foundational subjects (Python, NumPy, Pandas, SQL, etc.)
 * while tailoring module emphasis, progression order, and projects to each target role.
 */

import { TargetRoleSlug } from "./types";
import {
  MASTER_CURRICULUM_SUBJECTS,
  TaxonomySubject,
  TaxonomyTopic,
  TaxonomyModule,
  getTaxonomyTopicById,
} from "./master-curriculum-taxonomy";

export interface RoleProgressionSubject {
  subjectId: string;
  slug: string;
  title: string;
  icon: string;
  badge: string;
  estimatedHours: number;
  roleImportance: "FOUNDATION" | "CORE" | "SPECIALIZED" | "ADVANCED" | "SUPPORTING";
  roleWhy: string;
  prerequisites: string[]; // Subject IDs that must be completed first
  recommendedOrder: number;
}

export interface RoleLearningProgression {
  role: TargetRoleSlug;
  roleTitle: string;
  summary: string;
  subjects: RoleProgressionSubject[];
}

/**
 * Prerequisite and progression mapping for all 8 target roles.
 * Every role progression references canonical subjects from MASTER_CURRICULUM_SUBJECTS.
 */
export const ROLE_SUBJECT_PROGRESSIONS: Record<TargetRoleSlug, RoleLearningProgression> = {
  data_analyst: {
    role: "data_analyst",
    roleTitle: "Data Analyst",
    summary: "Master data extraction with SQL, manipulation with Pandas, exploratory data analysis, and statistical testing to drive business decisions.",
    subjects: [
      {
        subjectId: "subj_python",
        slug: "python",
        title: "Python Foundations for Data & AI",
        icon: "🐍",
        badge: "Core Language",
        estimatedHours: 20,
        roleImportance: "FOUNDATION",
        roleWhy: "Essential for scripting, automation, and data pipeline foundations.",
        prerequisites: [],
        recommendedOrder: 1,
      },
      {
        subjectId: "subj_sql",
        slug: "sql",
        title: "Relational Databases & Analytical SQL",
        icon: "💾",
        badge: "Data Querying",
        estimatedHours: 24,
        roleImportance: "CORE",
        roleWhy: "Primary language for data warehouses, window analytics, and cohort extraction.",
        prerequisites: [],
        recommendedOrder: 2,
      },
      {
        subjectId: "subj_numpy",
        slug: "numpy",
        title: "NumPy Numerical Computing Architecture",
        icon: "🔢",
        badge: "Numerical Engine",
        estimatedHours: 14,
        roleImportance: "FOUNDATION",
        roleWhy: "Array computing foundation required for advanced Pandas transformations.",
        prerequisites: ["subj_python"],
        recommendedOrder: 3,
      },
      {
        subjectId: "subj_pandas",
        slug: "pandas",
        title: "Pandas Tabular Analytics & Data Cleaning",
        icon: "🐼",
        badge: "Data Manipulation",
        estimatedHours: 28,
        roleImportance: "CORE",
        roleWhy: "Core tabular data engine for cleaning, reshaping, and exploratory analysis.",
        prerequisites: ["subj_python", "subj_numpy"],
        recommendedOrder: 4,
      },
      {
        subjectId: "subj_stats_ab",
        slug: "statistics-ab",
        title: "Statistics, Probability & A/B Testing",
        icon: "📊",
        badge: "Decision Science",
        estimatedHours: 26,
        roleImportance: "CORE",
        roleWhy: "Hypothesis testing, confidence intervals, and controlled experimentation for product metrics.",
        prerequisites: ["subj_pandas"],
        recommendedOrder: 5,
      },
      {
        subjectId: "subj_ml",
        slug: "machine-learning",
        title: "Classical Machine Learning Foundations",
        icon: "📈",
        badge: "Predictive Analytics",
        estimatedHours: 20,
        roleImportance: "SPECIALIZED",
        roleWhy: "Basic regression and classification models to interpret trends and driver analysis.",
        prerequisites: ["subj_pandas", "subj_stats_ab"],
        recommendedOrder: 6,
      },
    ],
  },

  data_scientist: {
    role: "data_scientist",
    roleTitle: "Data Scientist",
    summary: "Rigorous statistical modeling, end-to-end machine learning pipelines, deep learning feature extraction, and experimental causal inference.",
    subjects: [
      {
        subjectId: "subj_python",
        slug: "python",
        title: "Python Foundations for Data & AI",
        icon: "🐍",
        badge: "Core Language",
        estimatedHours: 20,
        roleImportance: "FOUNDATION",
        roleWhy: "Object model, vector patterns, and algorithmic foundations.",
        prerequisites: [],
        recommendedOrder: 1,
      },
      {
        subjectId: "subj_numpy",
        slug: "numpy",
        title: "NumPy Numerical Computing Architecture",
        icon: "🔢",
        badge: "Numerical Engine",
        estimatedHours: 18,
        roleImportance: "FOUNDATION",
        roleWhy: "Vectorization, memory layout, and linear algebra foundations.",
        prerequisites: ["subj_python"],
        recommendedOrder: 2,
      },
      {
        subjectId: "subj_pandas",
        slug: "pandas",
        title: "Pandas Tabular Analytics & Data Cleaning",
        icon: "🐼",
        badge: "Data Manipulation",
        estimatedHours: 24,
        roleImportance: "CORE",
        roleWhy: "Feature engineering, index alignment, and data transformation.",
        prerequisites: ["subj_python", "subj_numpy"],
        recommendedOrder: 3,
      },
      {
        subjectId: "subj_sql",
        slug: "sql",
        title: "Relational Databases & Analytical SQL",
        icon: "💾",
        badge: "Data Querying",
        estimatedHours: 20,
        roleImportance: "CORE",
        roleWhy: "Feature store querying and relational aggregation.",
        prerequisites: [],
        recommendedOrder: 4,
      },
      {
        subjectId: "subj_stats_ab",
        slug: "statistics-ab",
        title: "Statistics, Probability & A/B Testing",
        icon: "📊",
        badge: "Decision Science",
        estimatedHours: 30,
        roleImportance: "CORE",
        roleWhy: "Central Limit Theorem, power analysis, Bayesian vs frequentist inference.",
        prerequisites: ["subj_numpy", "subj_pandas"],
        recommendedOrder: 5,
      },
      {
        subjectId: "subj_ml",
        slug: "machine-learning",
        title: "Classical Machine Learning Foundations",
        icon: "📈",
        badge: "Predictive Intelligence",
        estimatedHours: 32,
        roleImportance: "CORE",
        roleWhy: "Loss optimization, cross-validation invariance, and model calibration.",
        prerequisites: ["subj_numpy", "subj_pandas", "subj_stats_ab"],
        recommendedOrder: 6,
      },
      {
        subjectId: "subj_deep_learning",
        slug: "deep-learning",
        title: "Deep Learning & Transformer Architectures",
        icon: "🧠",
        badge: "Neural Networks",
        estimatedHours: 28,
        roleImportance: "SPECIALIZED",
        roleWhy: "Autograd computational graphs, backprop, and Attention representations.",
        prerequisites: ["subj_numpy", "subj_ml"],
        recommendedOrder: 7,
      },
      {
        subjectId: "subj_genai_llm",
        slug: "genai-llm",
        title: "Generative AI & Large Language Models",
        icon: "✨",
        badge: "Foundation Models",
        estimatedHours: 24,
        roleImportance: "ADVANCED",
        roleWhy: "LLM fine-tuning, embedding exploration, and prompt evaluation.",
        prerequisites: ["subj_deep_learning"],
        recommendedOrder: 8,
      },
    ],
  },

  data_engineer: {
    role: "data_engineer",
    roleTitle: "Data Engineer",
    summary: "High-throughput data ingestion, batch and streaming pipelines, distributed relational modeling, and transactional data integrity.",
    subjects: [
      {
        subjectId: "subj_python",
        slug: "python",
        title: "Python Foundations for Data & AI",
        icon: "🐍",
        badge: "Core Language",
        estimatedHours: 24,
        roleImportance: "FOUNDATION",
        roleWhy: "Writing resilient extraction, transformation, and API orchestration scripts.",
        prerequisites: [],
        recommendedOrder: 1,
      },
      {
        subjectId: "subj_sql",
        slug: "sql",
        title: "Relational Databases & Analytical SQL",
        icon: "💾",
        badge: "Data Engine",
        estimatedHours: 32,
        roleImportance: "CORE",
        roleWhy: "Window operations, Hash/Merge joins, CTE query execution planning, and indexing.",
        prerequisites: [],
        recommendedOrder: 2,
      },
      {
        subjectId: "subj_numpy",
        slug: "numpy",
        title: "NumPy Numerical Computing Architecture",
        icon: "🔢",
        badge: "Numerical Engine",
        estimatedHours: 14,
        roleImportance: "FOUNDATION",
        roleWhy: "Low-level contiguous memory buffers and vectorized array processing.",
        prerequisites: ["subj_python"],
        recommendedOrder: 3,
      },
      {
        subjectId: "subj_pandas",
        slug: "pandas",
        title: "Pandas Tabular Analytics & Data Cleaning",
        icon: "🐼",
        badge: "Tabular Engine",
        estimatedHours: 28,
        roleImportance: "CORE",
        roleWhy: "BlockManager memory internals, batch chunking, and tabular ETL transformations.",
        prerequisites: ["subj_python", "subj_numpy"],
        recommendedOrder: 4,
      },
      {
        subjectId: "subj_stats_ab",
        slug: "statistics-ab",
        title: "Statistics, Probability & A/B Testing",
        icon: "📊",
        badge: "Data Quality",
        estimatedHours: 16,
        roleImportance: "SUPPORTING",
        roleWhy: "Statistical data profiling, anomaly detection, and automated pipeline quality checks.",
        prerequisites: ["subj_pandas"],
        recommendedOrder: 5,
      },
    ],
  },

  ml_engineer: {
    role: "ml_engineer",
    roleTitle: "Machine Learning Engineer",
    summary: "Architecting, training, validating, and deploying production ML models with strict data leakage invariants and low-latency inference.",
    subjects: [
      {
        subjectId: "subj_python",
        slug: "python",
        title: "Python Foundations for Data & AI",
        icon: "🐍",
        badge: "Core Language",
        estimatedHours: 22,
        roleImportance: "FOUNDATION",
        roleWhy: "OOP architecture, generators, memory efficiency, and C-extension interop.",
        prerequisites: [],
        recommendedOrder: 1,
      },
      {
        subjectId: "subj_numpy",
        slug: "numpy",
        title: "NumPy Numerical Computing Architecture",
        icon: "🔢",
        badge: "Numerical Engine",
        estimatedHours: 20,
        roleImportance: "FOUNDATION",
        roleWhy: "Vectorization, memory layout, broadcasting rules, and tensor building blocks.",
        prerequisites: ["subj_python"],
        recommendedOrder: 2,
      },
      {
        subjectId: "subj_pandas",
        slug: "pandas",
        title: "Pandas Tabular Analytics & Data Cleaning",
        icon: "🐼",
        badge: "Feature Store",
        estimatedHours: 22,
        roleImportance: "FOUNDATION",
        roleWhy: "Data wrangling and feature engineering before model tensor ingestion.",
        prerequisites: ["subj_python", "subj_numpy"],
        recommendedOrder: 3,
      },
      {
        subjectId: "subj_sql",
        slug: "sql",
        title: "Relational Databases & Analytical SQL",
        icon: "💾",
        badge: "Feature Extraction",
        estimatedHours: 18,
        roleImportance: "FOUNDATION",
        roleWhy: "Extracting training sets and computing point-in-time features.",
        prerequisites: [],
        recommendedOrder: 4,
      },
      {
        subjectId: "subj_stats_ab",
        slug: "statistics-ab",
        title: "Statistics, Probability & A/B Testing",
        icon: "📊",
        badge: "Validation Science",
        estimatedHours: 24,
        roleImportance: "CORE",
        roleWhy: "Statistical hypothesis testing, validation distributions, and metric confidence.",
        prerequisites: ["subj_numpy", "subj_pandas"],
        recommendedOrder: 5,
      },
      {
        subjectId: "subj_ml",
        slug: "machine-learning",
        title: "Classical Machine Learning Foundations",
        icon: "📈",
        badge: "Core Modeling",
        estimatedHours: 35,
        roleImportance: "CORE",
        roleWhy: "Gradient descent, loss surfaces, data leakage prevention, and model calibration.",
        prerequisites: ["subj_numpy", "subj_pandas", "subj_stats_ab"],
        recommendedOrder: 6,
      },
      {
        subjectId: "subj_deep_learning",
        slug: "deep-learning",
        title: "Deep Learning & Transformer Architectures",
        icon: "🧠",
        badge: "Deep Architectures",
        estimatedHours: 35,
        roleImportance: "CORE",
        roleWhy: "Reverse-mode autodiff computational graphs, backprop, and Scaled Dot-Product Attention.",
        prerequisites: ["subj_numpy", "subj_ml"],
        recommendedOrder: 7,
      },
      {
        subjectId: "subj_genai_llm",
        slug: "genai-llm",
        title: "Generative AI & Large Language Models",
        icon: "✨",
        badge: "Foundation Models",
        estimatedHours: 26,
        roleImportance: "SPECIALIZED",
        roleWhy: "Tokenizer internals, temperature scaling, and LoRA fine-tuning.",
        prerequisites: ["subj_deep_learning"],
        recommendedOrder: 8,
      },
    ],
  },

  mlops_engineer: {
    role: "mlops_engineer",
    roleTitle: "MLOps Engineer",
    summary: "Production model serving, continuous validation pipelines, model registry lifecycle, drift detection, and reproducible artifact management.",
    subjects: [
      {
        subjectId: "subj_python",
        slug: "python",
        title: "Python Foundations for Data & AI",
        icon: "🐍",
        badge: "Core Language",
        estimatedHours: 22,
        roleImportance: "FOUNDATION",
        roleWhy: "Packaging, CLI tools, async serving runtimes, and Dockerized microservices.",
        prerequisites: [],
        recommendedOrder: 1,
      },
      {
        subjectId: "subj_sql",
        slug: "sql",
        title: "Relational Databases & Analytical SQL",
        icon: "💾",
        badge: "Metadata Store",
        estimatedHours: 18,
        roleImportance: "FOUNDATION",
        roleWhy: "Feature store schema management and experiment tracking database queries.",
        prerequisites: [],
        recommendedOrder: 2,
      },
      {
        subjectId: "subj_numpy",
        slug: "numpy",
        title: "NumPy Numerical Computing Architecture",
        icon: "🔢",
        badge: "Inference Tensors",
        estimatedHours: 16,
        roleImportance: "FOUNDATION",
        roleWhy: "Zero-copy tensor serialization and batch inference shapes.",
        prerequisites: ["subj_python"],
        recommendedOrder: 3,
      },
      {
        subjectId: "subj_ml",
        slug: "machine-learning",
        title: "Classical Machine Learning Foundations",
        icon: "📈",
        badge: "Model Lifecycle",
        estimatedHours: 28,
        roleImportance: "CORE",
        roleWhy: "Data leakage invariants, train/serving skew, and offline-online evaluation parity.",
        prerequisites: ["subj_python", "subj_numpy"],
        recommendedOrder: 4,
      },
      {
        subjectId: "subj_stats_ab",
        slug: "statistics-ab",
        title: "Statistics, Probability & A/B Testing",
        icon: "📊",
        badge: "Monitoring & Drift",
        estimatedHours: 22,
        roleImportance: "CORE",
        roleWhy: "Kolmogorov-Smirnov data drift detection, population stability index (PSI), and canary releases.",
        prerequisites: ["subj_ml"],
        recommendedOrder: 5,
      },
      {
        subjectId: "subj_deep_learning",
        slug: "deep-learning",
        title: "Deep Learning & Transformer Architectures",
        icon: "🧠",
        badge: "GPU Serving",
        estimatedHours: 26,
        roleImportance: "CORE",
        roleWhy: "GPU inference optimization, quantization (INT8/FP16), and KV caching constraints.",
        prerequisites: ["subj_numpy", "subj_ml"],
        recommendedOrder: 6,
      },
    ],
  },

  ai_engineer: {
    role: "ai_engineer",
    roleTitle: "AI Engineer",
    summary: "Building intelligent end-to-end applications powered by LLMs, hybrid semantic retrieval (RAG), autonomous tool-calling agents, and real-time evaluation.",
    subjects: [
      {
        subjectId: "subj_python",
        slug: "python",
        title: "Python Foundations for Data & AI",
        icon: "🐍",
        badge: "Core Language",
        estimatedHours: 22,
        roleImportance: "FOUNDATION",
        roleWhy: "Async/await streaming, Pydantic type validation, and API SDK integration.",
        prerequisites: [],
        recommendedOrder: 1,
      },
      {
        subjectId: "subj_numpy",
        slug: "numpy",
        title: "NumPy Numerical Computing Architecture",
        icon: "🔢",
        badge: "Numerical Engine",
        estimatedHours: 16,
        roleImportance: "FOUNDATION",
        roleWhy: "Vector math, cosine similarity computations, and embedding array manipulation.",
        prerequisites: ["subj_python"],
        recommendedOrder: 2,
      },
      {
        subjectId: "subj_sql",
        slug: "sql",
        title: "Relational Databases & Analytical SQL",
        icon: "💾",
        badge: "Data Querying",
        estimatedHours: 18,
        roleImportance: "FOUNDATION",
        roleWhy: "Structured knowledge stores, pgvector semantic search, and metadata filtering.",
        prerequisites: [],
        recommendedOrder: 3,
      },
      {
        subjectId: "subj_genai_llm",
        slug: "genai-llm",
        title: "Generative AI & Large Language Models",
        icon: "✨",
        badge: "Foundation Models",
        estimatedHours: 28,
        roleImportance: "CORE",
        roleWhy: "Context windows, temperature scaling, system prompting, structured JSON schema outputs.",
        prerequisites: ["subj_python"],
        recommendedOrder: 4,
      },
      {
        subjectId: "subj_rag",
        slug: "rag",
        title: "Retrieval-Augmented Generation (RAG) Architecture",
        icon: "🔍",
        badge: "Semantic Retrieval",
        estimatedHours: 32,
        roleImportance: "CORE",
        roleWhy: "Document chunking, dense vector embeddings, hybrid BM25+Dense retrieval, and Cross-Encoder reranking.",
        prerequisites: ["subj_numpy", "subj_genai_llm"],
        recommendedOrder: 5,
      },
      {
        subjectId: "subj_agents",
        slug: "agentic-ai",
        title: "Autonomous AI Agents & Multi-Agent Workflows",
        icon: "🤖",
        badge: "Autonomous Systems",
        estimatedHours: 32,
        roleImportance: "CORE",
        roleWhy: "ReAct reasoning loops, JSON tool-calling schemas, cyclical state graph checkpointing, and orchestrator-worker patterns.",
        prerequisites: ["subj_genai_llm", "subj_rag"],
        recommendedOrder: 6,
      },
      {
        subjectId: "subj_deep_learning",
        slug: "deep-learning",
        title: "Deep Learning & Transformer Architectures",
        icon: "🧠",
        badge: "Neural Networks",
        estimatedHours: 24,
        roleImportance: "SPECIALIZED",
        roleWhy: "Scaled Dot-Product Attention, causal masking, and position embeddings understanding.",
        prerequisites: ["subj_numpy"],
        recommendedOrder: 7,
      },
    ],
  },

  genai_llm_engineer: {
    role: "genai_llm_engineer",
    roleTitle: "Generative AI & LLM Engineer",
    summary: "Deep specialization in foundation model architecture, tokenization, fine-tuning (LoRA/QLoRA), complex prompt chains, structured outputs, and alignment.",
    subjects: [
      {
        subjectId: "subj_python",
        slug: "python",
        title: "Python Foundations for Data & AI",
        icon: "🐍",
        badge: "Core Language",
        estimatedHours: 22,
        roleImportance: "FOUNDATION",
        roleWhy: "Essential for modern AI frameworks, streaming parsers, and async pipelines.",
        prerequisites: [],
        recommendedOrder: 1,
      },
      {
        subjectId: "subj_numpy",
        slug: "numpy",
        title: "NumPy Numerical Computing Architecture",
        icon: "🔢",
        badge: "Numerical Engine",
        estimatedHours: 18,
        roleImportance: "FOUNDATION",
        roleWhy: "Tensor manipulation, logit scaling, softmax normalization, and vector similarity.",
        prerequisites: ["subj_python"],
        recommendedOrder: 2,
      },
      {
        subjectId: "subj_deep_learning",
        slug: "deep-learning",
        title: "Deep Learning & Transformer Architectures",
        icon: "🧠",
        badge: "Architecture Foundation",
        estimatedHours: 32,
        roleImportance: "CORE",
        roleWhy: "Scaled Dot-Product Attention, Multi-Head Attention, RoPE positional encodings, and KV caching.",
        prerequisites: ["subj_numpy"],
        recommendedOrder: 3,
      },
      {
        subjectId: "subj_genai_llm",
        slug: "genai-llm",
        title: "Generative AI & Large Language Models",
        icon: "✨",
        badge: "Foundation Models",
        estimatedHours: 36,
        roleImportance: "CORE",
        roleWhy: "Byte-Pair Encoding, top-p/temperature decoding, structured JSON schema outputs, and prompt engineering.",
        prerequisites: ["subj_deep_learning"],
        recommendedOrder: 4,
      },
      {
        subjectId: "subj_rag",
        slug: "rag",
        title: "Retrieval-Augmented Generation (RAG) Architecture",
        icon: "🔍",
        badge: "Grounding Systems",
        estimatedHours: 30,
        roleImportance: "CORE",
        roleWhy: "Dense embeddings, cosine similarity, hybrid reciprocal rank fusion, and rerankers.",
        prerequisites: ["subj_numpy", "subj_genai_llm"],
        recommendedOrder: 5,
      },
      {
        subjectId: "subj_agents",
        slug: "agentic-ai",
        title: "Autonomous AI Agents & Multi-Agent Workflows",
        icon: "🤖",
        badge: "Agentic Systems",
        estimatedHours: 30,
        roleImportance: "CORE",
        roleWhy: "Autonomous ReAct loops, tool execution, multi-agent coordination, and human-in-the-loop controls.",
        prerequisites: ["subj_genai_llm", "subj_rag"],
        recommendedOrder: 6,
      },
    ],
  },

  applied_ai_engineer: {
    role: "applied_ai_engineer",
    roleTitle: "Applied AI Engineer",
    summary: "Translating enterprise business problems into production-grade AI solutions through full-stack integration, RAG, agents, and verified evaluations.",
    subjects: [
      {
        subjectId: "subj_python",
        slug: "python",
        title: "Python Foundations for Data & AI",
        icon: "🐍",
        badge: "Core Language",
        estimatedHours: 20,
        roleImportance: "FOUNDATION",
        roleWhy: "Rapid full-stack prototyping, API middleware, and AI orchestration.",
        prerequisites: [],
        recommendedOrder: 1,
      },
      {
        subjectId: "subj_sql",
        slug: "sql",
        title: "Relational Databases & Analytical SQL",
        icon: "💾",
        badge: "Enterprise Data",
        estimatedHours: 20,
        roleImportance: "FOUNDATION",
        roleWhy: "Querying transactional production databases and enterprise feature sets.",
        prerequisites: [],
        recommendedOrder: 2,
      },
      {
        subjectId: "subj_pandas",
        slug: "pandas",
        title: "Pandas Tabular Analytics & Data Cleaning",
        icon: "🐼",
        badge: "Data Processing",
        estimatedHours: 20,
        roleImportance: "FOUNDATION",
        roleWhy: "Cleaning and transforming business datasets before feeding into AI workflows.",
        prerequisites: ["subj_python"],
        recommendedOrder: 3,
      },
      {
        subjectId: "subj_genai_llm",
        slug: "genai-llm",
        title: "Generative AI & Large Language Models",
        icon: "✨",
        badge: "Foundation Models",
        estimatedHours: 28,
        roleImportance: "CORE",
        roleWhy: "Structured outputs, system prompt guardrails, and deterministic schema enforcement.",
        prerequisites: ["subj_python"],
        recommendedOrder: 4,
      },
      {
        subjectId: "subj_rag",
        slug: "rag",
        title: "Retrieval-Augmented Generation (RAG) Architecture",
        icon: "🔍",
        badge: "Semantic Search",
        estimatedHours: 30,
        roleImportance: "CORE",
        roleWhy: "Enterprise document QA, semantic vector retrieval, and ground-truth citations.",
        prerequisites: ["subj_genai_llm"],
        recommendedOrder: 5,
      },
      {
        subjectId: "subj_agents",
        slug: "agentic-ai",
        title: "Autonomous AI Agents & Multi-Agent Workflows",
        icon: "🤖",
        badge: "Workflow Automation",
        estimatedHours: 30,
        roleImportance: "CORE",
        roleWhy: "Autonomous tool execution, error recovery, and enterprise task automation.",
        prerequisites: ["subj_genai_llm", "subj_rag"],
        recommendedOrder: 6,
      },
      {
        subjectId: "subj_ml",
        slug: "machine-learning",
        title: "Classical Machine Learning Foundations",
        icon: "📈",
        badge: "Predictive Intelligence",
        estimatedHours: 22,
        roleImportance: "SPECIALIZED",
        roleWhy: "Hybrid workflows combining classical classifiers with generative agent decisions.",
        prerequisites: ["subj_pandas"],
        recommendedOrder: 7,
      },
    ],
  },
};

/**
 * Get the full prerequisite-ordered subject list for a specific career role.
 */
export function getRoleSubjectProgression(role: TargetRoleSlug): RoleLearningProgression {
  return ROLE_SUBJECT_PROGRESSIONS[role] || ROLE_SUBJECT_PROGRESSIONS.ai_engineer;
}

/**
 * Returns whether a given subject is unlocked for a candidate based on completed topic IDs.
 * A subject is unlocked if:
 * 1. It has no prerequisites, OR
 * 2. At least one core topic in each prerequisite subject has been completed.
 */
export function isSubjectUnlockedForCandidate(
  subjectId: string,
  role: TargetRoleSlug,
  completedTopicIds: string[]
): { isUnlocked: boolean; missingPrerequisites: string[]; missingSubjectTitles: string[] } {
  const progression = getRoleSubjectProgression(role);
  const roleSubject = progression.subjects.find((s) => s.subjectId === subjectId);

  if (!roleSubject || roleSubject.prerequisites.length === 0) {
    return { isUnlocked: true, missingPrerequisites: [], missingSubjectTitles: [] };
  }

  const missingPrerequisites: string[] = [];
  const missingSubjectTitles: string[] = [];

  for (const prereqSubjId of roleSubject.prerequisites) {
    const prereqSubject = MASTER_CURRICULUM_SUBJECTS.find((s) => s.id === prereqSubjId);
    if (!prereqSubject) continue;

    // Check if the candidate has completed at least one foundational topic in this prerequisite subject
    const prereqTopicIds = prereqSubject.modules.flatMap((m) => m.topics.map((t) => t.id));
    const hasCompletedPrereq = prereqTopicIds.some((id) => completedTopicIds.includes(id));

    if (!hasCompletedPrereq) {
      missingPrerequisites.push(prereqSubjId);
      missingSubjectTitles.push(prereqSubject.title);
    }
  }

  return {
    isUnlocked: missingPrerequisites.length === 0,
    missingPrerequisites,
    missingSubjectTitles,
  };
}

/**
 * Resolves the intelligent "Next Recommended Topic" for the student.
 * Inspects role curriculum in progression order, finds the first incomplete topic whose prerequisites are satisfied.
 */
export function resolveNextTopicRecommendation(
  role: TargetRoleSlug,
  completedTopicIds: string[]
): {
  recommendedTopic: TaxonomyTopic;
  subject: TaxonomySubject;
  module: TaxonomyModule;
  rationale: string;
} {
  const progression = getRoleSubjectProgression(role);

  for (const roleSubject of progression.subjects) {
    const fullSubject = MASTER_CURRICULUM_SUBJECTS.find((s) => s.id === roleSubject.subjectId);
    if (!fullSubject) continue;

    // Verify subject is unlocked
    const { isUnlocked, missingSubjectTitles } = isSubjectUnlockedForCandidate(
      roleSubject.subjectId,
      role,
      completedTopicIds
    );

    if (!isUnlocked) continue;

    // Find first incomplete topic in this subject
    for (const mod of fullSubject.modules) {
      for (const topic of mod.topics) {
        if (!completedTopicIds.includes(topic.id)) {
          // Check if topic's direct prerequisites are met
          const prereqsMet = topic.prerequisites.every((pId) => completedTopicIds.includes(pId));
          if (prereqsMet) {
            return {
              recommendedTopic: topic,
              subject: fullSubject,
              module: mod,
              rationale: `Next sequential milestone for ${progression.roleTitle}: ${topic.title} (${roleSubject.roleWhy})`,
            };
          }
        }
      }
    }
  }

  // Fallback to the first topic of the first subject
  const firstSubj = MASTER_CURRICULUM_SUBJECTS[0];
  const firstMod = firstSubj.modules[0];
  const firstTopic = firstMod.topics[0];

  return {
    recommendedTopic: firstTopic,
    subject: firstSubj,
    module: firstMod,
    rationale: `Foundational starting point for ${progression.roleTitle}`,
  };
}
