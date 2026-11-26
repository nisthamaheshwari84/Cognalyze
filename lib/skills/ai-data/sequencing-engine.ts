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

import {
  TargetRoleSlug,
  TopicMasteryRecord,
  TopicMasteryStatus,
  LearningPosition,
  CustomTargetRoleConfig,
} from "./types";
import {
  MASTER_CURRICULUM_SUBJECTS,
  TaxonomySubject,
  TaxonomyTopic,
  TaxonomyModule,
  getTaxonomyTopicById,
  TOPIC_ID_ALIASES,
} from "./master-curriculum-taxonomy";
import { BaselineAssessmentResult } from "./baseline-assessment-engine";

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

  nlp_engineer: {
    role: "nlp_engineer",
    roleTitle: "NLP Engineer",
    summary: "Master Python text processing, statistical modeling, transformer attention, dense embeddings, and RAG evaluation for language applications.",
    subjects: [
      {
        subjectId: "subj_python",
        slug: "python",
        title: "Python Foundations for Data & AI",
        icon: "🐍",
        badge: "Core Language",
        estimatedHours: 20,
        roleImportance: "FOUNDATION",
        roleWhy: "Text tokenization scripts, async inference workers, and algorithmic structures.",
        prerequisites: [],
        recommendedOrder: 1,
      },
      {
        subjectId: "subj_numpy",
        slug: "numpy",
        title: "NumPy Numerical Computing Architecture",
        icon: "🔢",
        badge: "Tensor Math",
        estimatedHours: 16,
        roleImportance: "FOUNDATION",
        roleWhy: "Matrix dot products, cosine similarity vectors, and tensor shape mechanics.",
        prerequisites: ["subj_python"],
        recommendedOrder: 2,
      },
      {
        subjectId: "subj_stats_ab",
        slug: "statistics-ab",
        title: "Statistics, Probability & A/B Testing",
        icon: "📊",
        badge: "Probabilistic Modeling",
        estimatedHours: 18,
        roleImportance: "CORE",
        roleWhy: "Perplexity, conditional distributions, and statistical significance on eval benchmarks.",
        prerequisites: ["subj_python", "subj_numpy"],
        recommendedOrder: 3,
      },
      {
        subjectId: "subj_ml",
        slug: "machine-learning",
        title: "Classical Machine Learning Foundations",
        icon: "📈",
        badge: "Classification & Baselines",
        estimatedHours: 24,
        roleImportance: "CORE",
        roleWhy: "Text classification baselines, regularization, and PR/ROC error diagnostics.",
        prerequisites: ["subj_numpy", "subj_stats_ab"],
        recommendedOrder: 4,
      },
      {
        subjectId: "subj_deep_learning",
        slug: "deep-learning",
        title: "Deep Learning & Transformers",
        icon: "🤖",
        badge: "Attention Architecture",
        estimatedHours: 36,
        roleImportance: "CORE",
        roleWhy: "Self-attention, positional encoding, backpropagation, and encoder/decoder sequences.",
        prerequisites: ["subj_numpy", "subj_ml"],
        recommendedOrder: 5,
      },
      {
        subjectId: "subj_genai_llm",
        slug: "generative-ai-llms",
        title: "Generative AI & LLM Engineering",
        icon: "✨",
        badge: "Foundation Models",
        estimatedHours: 30,
        roleImportance: "CORE",
        roleWhy: "Subword BPE tokenizers, LoRA fine-tuning, and structured semantic outputs.",
        prerequisites: ["subj_deep_learning"],
        recommendedOrder: 6,
      },
      {
        subjectId: "subj_rag",
        slug: "rag",
        title: "Retrieval-Augmented Generation (RAG)",
        icon: "🔍",
        badge: "Information Retrieval",
        estimatedHours: 28,
        roleImportance: "SPECIALIZED",
        roleWhy: "Dense embeddings, cross-encoder reranking, and lexical/semantic hybrid search.",
        prerequisites: ["subj_genai_llm"],
        recommendedOrder: 7,
      },
      {
        subjectId: "subj_ai_eval",
        slug: "ai-evaluation-safety",
        title: "AI Evaluation & Responsible AI",
        icon: "🛡️",
        badge: "Evals & Grounding",
        estimatedHours: 22,
        roleImportance: "SPECIALIZED",
        roleWhy: "Hallucination audits, LLM-as-a-judge benchmarks, and guardrail validation.",
        prerequisites: ["subj_genai_llm"],
        recommendedOrder: 8,
      },
    ],
  },

  cv_engineer: {
    role: "cv_engineer",
    roleTitle: "Computer Vision Engineer",
    summary: "Engineer high-speed numerical tensor pipelines, CNN and Vision Transformer architectures, calibration, and low-latency MLOps edge deployments.",
    subjects: [
      {
        subjectId: "subj_python",
        slug: "python",
        title: "Python Foundations for Data & AI",
        icon: "🐍",
        badge: "Core Language",
        estimatedHours: 20,
        roleImportance: "FOUNDATION",
        roleWhy: "Image batch generators, multiprocessing loaders, and typed model wrappers.",
        prerequisites: [],
        recommendedOrder: 1,
      },
      {
        subjectId: "subj_numpy",
        slug: "numpy",
        title: "NumPy Numerical Computing Architecture",
        icon: "🔢",
        badge: "Spatial Tensor Core",
        estimatedHours: 22,
        roleImportance: "FOUNDATION",
        roleWhy: "NCHW tensor strides, image convolutions, and broadcasting geometry.",
        prerequisites: ["subj_python"],
        recommendedOrder: 2,
      },
      {
        subjectId: "subj_pandas",
        slug: "pandas",
        title: "Pandas Tabular Analytics & Data Cleaning",
        icon: "🐼",
        badge: "Annotation Metadata",
        estimatedHours: 14,
        roleImportance: "FOUNDATION",
        roleWhy: "Bounding-box annotation validation, class distribution balance, and slice auditing.",
        prerequisites: ["subj_python", "subj_numpy"],
        recommendedOrder: 3,
      },
      {
        subjectId: "subj_stats_ab",
        slug: "statistics-ab",
        title: "Statistics, Probability & A/B Testing",
        icon: "📊",
        badge: "Calibration & Splits",
        estimatedHours: 16,
        roleImportance: "CORE",
        roleWhy: "Stratified splits, confidence calibration, and distribution shift testing.",
        prerequisites: ["subj_numpy"],
        recommendedOrder: 4,
      },
      {
        subjectId: "subj_ml",
        slug: "machine-learning",
        title: "Classical Machine Learning Foundations",
        icon: "📈",
        badge: "Modeling Fundamentals",
        estimatedHours: 26,
        roleImportance: "CORE",
        roleWhy: "Loss landscapes, regularization, and precision-recall calibration.",
        prerequisites: ["subj_numpy", "subj_stats_ab"],
        recommendedOrder: 5,
      },
      {
        subjectId: "subj_deep_learning",
        slug: "deep-learning",
        title: "Deep Learning & Transformers",
        icon: "🤖",
        badge: "CNNs & ViTs",
        estimatedHours: 40,
        roleImportance: "CORE",
        roleWhy: "Convolutional kernels, residual backprop, normalization, and Vision Transformers.",
        prerequisites: ["subj_numpy", "subj_ml"],
        recommendedOrder: 6,
      },
      {
        subjectId: "subj_mlops",
        slug: "mlops-llmops",
        title: "MLOps & LLMOps Production Engineering",
        icon: "🚀",
        badge: "Edge Serving & ONNX",
        estimatedHours: 26,
        roleImportance: "SPECIALIZED",
        roleWhy: "Model quantization, ONNX/TensorRT serving, and camera stream drift detection.",
        prerequisites: ["subj_deep_learning"],
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

// ============================================================================
// CANONICAL 154-TOPIC PREREQUISITE DAG & ADAPTIVE ROADMAP ENGINE (PHASE 2)
// ============================================================================

export type CanonicalNodeLockState =
  | "LOCKED"
  | "AVAILABLE"
  | "IN_PROGRESS"
  | "REMEDIATION_REQUIRED"
  | "COMPLETED"
  | "MASTERED";

export interface CanonicalRoadmapNode {
  topicId: string;
  title: string;
  subjectId: string;
  subjectTitle: string;
  moduleId: string;
  moduleTitle: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedMinutes: number;
  orderIndex: number;
  lockState: CanonicalNodeLockState;
  masteryStatus: TopicMasteryStatus;
  prerequisites: string[];
  missingPrerequisites: string[];
  unlockedReason?: string;
  lockReason?: string;
  exemptedByEvidence: boolean;
  assessmentScore: number | null;
  remediationRequired: boolean;
  weakConcepts: string[];
  roleImportance: "CRITICAL" | "HIGH" | "SUPPORTING";
  roleWhy: string;
}

export interface CanonicalRoadmapSubjectGroup {
  subjectId: string;
  slug: string;
  title: string;
  icon: string;
  badge: string;
  roleImportance: string;
  roleWhy: string;
  estimatedHours: number;
  prerequisites: string[];
  missingPrerequisiteSubjects: string[];
  isUnlocked: boolean;
  completedTopics: number;
  masteredTopics: number;
  totalTopics: number;
  percentMastered: number;
  topics: CanonicalRoadmapNode[];
}

export interface CanonicalArenaRoadmap {
  candidateId: string;
  targetRole: TargetRoleSlug | string;
  roleTitle: string;
  roleSummary: string;
  requiredCompetencies: string[];
  verifiedCompetencies: string[];
  missingPrerequisites: string[];
  exemptionsGranted: string[];
  totalTopics: number;
  completedCount: number;
  masteredCount: number;
  overallProgressPercent: number;
  currentPosition: LearningPosition | null;
  recommendedNextTopic: CanonicalRoadmapNode | null;
  upcomingPracticals: Array<{ topicId: string; title: string; subjectTitle: string }>;
  upcomingAssessments: Array<{ topicId: string; title: string; subjectTitle: string }>;
  requiredProjects: string[];
  subjects: CanonicalRoadmapSubjectGroup[];
}

function mapSubjectToSkillKey(subjectId: string): string[] {
  switch (subjectId) {
    case "subj_python": return ["python", "programming_fundamentals"];
    case "subj_numpy": return ["python_data_stack", "numpy_linear_algebra"];
    case "subj_pandas": return ["python_data_stack", "exploratory_data_analysis"];
    case "subj_sql": return ["sql", "advanced_sql_analytics", "business_product_analytics"];
    case "subj_stats_ab": return ["ab_testing_statistics", "statistics_probability"];
    case "subj_ml": return ["classical_ml_modeling", "ml_model_evaluation"];
    case "subj_deep_learning": return ["deep_learning_foundations"];
    case "subj_genai_llm": return ["prompt_engineering_structured_outputs", "genai_llms"];
    case "subj_rag": return ["rag_architecture_and_retrieval"];
    case "subj_agents": return ["ai_agents_and_tool_calling"];
    case "subj_data_engineering": return ["data_engineering_pipelines"];
    case "subj_mlops": return ["mlops_serving_and_monitoring"];
    case "subj_ai_eval": return ["llm_evaluations_and_safety"];
    default: return ["machine_learning"];
  }
}

export function isTopicCompletedOrExempted(
  topicId: string,
  masteryMap: Record<string, TopicMasteryRecord>,
  exemptedSubjectIds: Set<string>,
  topicToSubject: Map<string, string>
): boolean {
  const resolved = TOPIC_ID_ALIASES[topicId] || topicId;
  const rec = masteryMap[resolved] || masteryMap[topicId];
  if (rec) {
    if (
      rec.status === "assessment_passed" ||
      rec.status === "demonstrated" ||
      rec.status === "mastered_verified" ||
      rec.exemptedByEvidence
    ) {
      return true;
    }
  }
  const subjId = topicToSubject.get(resolved);
  if (subjId && exemptedSubjectIds.has(subjId)) {
    const topic = getTaxonomyTopicById(resolved);
    if (topic && topic.difficulty === "beginner") return true;
  }
  return false;
}

export function buildCanonicalArenaRoadmap(params: {
  candidateId: string;
  targetRole: TargetRoleSlug | string;
  customRoleConfig?: CustomTargetRoleConfig | null;
  masteryMap?: Record<string, TopicMasteryRecord>;
  baselineAssessment?: BaselineAssessmentResult | null;
  dnaVerifiedSkills?: Array<{ skillId: string; verificationState: string; level?: number }>;
  learningPosition?: LearningPosition | null;
}): CanonicalArenaRoadmap {
  const {
    candidateId,
    targetRole,
    customRoleConfig = null,
    masteryMap = {},
    baselineAssessment = null,
    dnaVerifiedSkills = [],
    learningPosition = null,
  } = params;

  const progression = customRoleConfig
    ? {
        role: targetRole as TargetRoleSlug,
        roleTitle: customRoleConfig.title,
        summary: customRoleConfig.summary,
        subjects: customRoleConfig.requiredSubjectIds
          .map((id, idx): RoleProgressionSubject | null => {
            const subj = MASTER_CURRICULUM_SUBJECTS.find((s) => s.id === id);
            if (!subj) return null;
            return {
              subjectId: subj.id,
              slug: subj.slug,
              title: subj.title,
              icon: subj.icon,
              badge: subj.badge,
              estimatedHours: subj.estimatedHours,
              roleImportance: idx < 2 ? "FOUNDATION" : "CORE",
              roleWhy: `Configured target requirement for ${customRoleConfig.title}`,
              prerequisites: subj.prerequisites,
              recommendedOrder: idx + 1,
            };
          })
          .filter((s): s is RoleProgressionSubject => Boolean(s)),
      }
    : getRoleSubjectProgression(targetRole as TargetRoleSlug);

  // Determine verified competencies from Baseline + Student DNA
  const verifiedSkillSet = new Set<string>();
  const exemptedSkills = new Set<string>(baselineAssessment?.exemptionsGranted || []);
  for (const sk of dnaVerifiedSkills) {
    if (
      sk.verificationState === "VERIFIED" ||
      sk.verificationState === "DEMONSTRATED" ||
      (typeof sk.level === "number" && sk.level >= 3)
    ) {
      verifiedSkillSet.add(sk.skillId);
      exemptedSkills.add(sk.skillId);
    }
  }
  for (const ex of exemptedSkills) verifiedSkillSet.add(ex);

  // Map which subjects have beginner exemptions from verified evidence
  const exemptedSubjectIds = new Set<string>();
  for (const subj of MASTER_CURRICULUM_SUBJECTS) {
    const keys = mapSubjectToSkillKey(subj.id);
    if (keys.some((k) => exemptedSkills.has(k))) {
      exemptedSubjectIds.add(subj.id);
    }
  }

  const topicToSubject = new Map<string, string>();
  for (const subj of MASTER_CURRICULUM_SUBJECTS) {
    for (const mod of subj.modules) {
      for (const t of mod.topics) {
        topicToSubject.set(t.id, subj.id);
      }
    }
  }

  const subjects: CanonicalRoadmapSubjectGroup[] = [];
  const missingGlobalPrerequisites = new Set<string>();
  const upcomingPracticals: Array<{ topicId: string; title: string; subjectTitle: string }> = [];
  const upcomingAssessments: Array<{ topicId: string; title: string; subjectTitle: string }> = [];
  let totalTopics = 0;
  let completedCount = 0;
  let masteredCount = 0;
  let recommendedNextTopic: CanonicalRoadmapNode | null = null;
  let globalOrder = 0;

  // Include all role subjects + ensure Applied Projects capstone subject appears at end
  const orderedRoleSubjects = [...progression.subjects];
  if (!orderedRoleSubjects.some((s) => s.subjectId === "subj_ai_projects")) {
    orderedRoleSubjects.push({
      subjectId: "subj_ai_projects",
      slug: "applied-ai-projects",
      title: "Applied AI Projects & Capstones",
      icon: "🏆",
      badge: "Production Capstones",
      estimatedHours: 40,
      roleImportance: "SPECIALIZED",
      roleWhy: "Synthesize learned competencies into verified portfolio projects.",
      prerequisites: orderedRoleSubjects.slice(-1).map((s) => s.subjectId),
      recommendedOrder: orderedRoleSubjects.length + 1,
    });
  }

  for (const roleSubj of orderedRoleSubjects) {
    const fullSubj = MASTER_CURRICULUM_SUBJECTS.find((s) => s.id === roleSubj.subjectId);
    if (!fullSubj) continue;

    // Evaluate subject-level prerequisites (satisfied when prerequisite subject has at least 1 passed/demonstrated/exempted topic)
    const missingPrerequisiteSubjects: string[] = [];
    for (const prereqSubjId of roleSubj.prerequisites) {
      const prereqSubj = MASTER_CURRICULUM_SUBJECTS.find((s) => s.id === prereqSubjId);
      if (!prereqSubj) continue;
      const prereqTopicIds = prereqSubj.modules.flatMap((m) => m.topics.map((t) => t.id));
      const satisfied =
        exemptedSubjectIds.has(prereqSubjId) ||
        prereqTopicIds.some((tid) => isTopicCompletedOrExempted(tid, masteryMap, exemptedSubjectIds, topicToSubject));
      if (!satisfied) {
        missingPrerequisiteSubjects.push(prereqSubj.title);
        missingGlobalPrerequisites.add(prereqSubj.title);
      }
    }
    const isSubjUnlocked = missingPrerequisiteSubjects.length === 0;

    const nodes: CanonicalRoadmapNode[] = [];
    let subjCompleted = 0;
    let subjMastered = 0;

    let prevTopicInSubjectId: string | null = null;
    for (const mod of fullSubj.modules) {
      for (const topic of mod.topics) {
        totalTopics++;
        const rec = masteryMap[topic.id];
        const isExempt =
          exemptedSubjectIds.has(fullSubj.id) && topic.difficulty === "beginner" && !rec?.remediationRequired;

        // Effective prerequisites: explicit topic.prerequisites + sequential previous topic within same module/subject
        const effectivePrereqs = Array.from(
          new Set([
            ...(topic.prerequisites || []).map((p) => TOPIC_ID_ALIASES[p] || p),
            ...(prevTopicInSubjectId ? [prevTopicInSubjectId] : []),
          ])
        );

        const missingTopicPrereqs: string[] = [];
        for (const pId of effectivePrereqs) {
          if (!isTopicCompletedOrExempted(pId, masteryMap, exemptedSubjectIds, topicToSubject)) {
            const pt = getTaxonomyTopicById(pId);
            missingTopicPrereqs.push(pt?.title || pId);
          }
        }

        let masteryStatus: TopicMasteryStatus = rec?.status || (isExempt ? "demonstrated" : "not_started");
        let lockState: CanonicalNodeLockState = "LOCKED";
        let lockReason: string | undefined;
        let unlockedReason: string | undefined;

        if (rec?.remediationRequired) {
          lockState = "REMEDIATION_REQUIRED";
          unlockedReason = "Review identified weak concepts and retake remediation check.";
        } else if (masteryStatus === "mastered_verified") {
          lockState = "MASTERED";
          unlockedReason = "All concept, coding, lab, and assessment gates verified.";
        } else if (masteryStatus === "assessment_passed" || masteryStatus === "demonstrated" || isExempt) {
          lockState = "COMPLETED";
          unlockedReason = isExempt
            ? "Prerequisite competence established via Diagnostic / Student DNA."
            : "Assessment passed; complete final verification if pending.";
        } else if (!isSubjUnlocked) {
          lockState = "LOCKED";
          lockReason = `Complete prerequisite module(s): ${missingPrerequisiteSubjects.join(", ")}`;
        } else if (missingTopicPrereqs.length > 0 && !isExempt) {
          lockState = "LOCKED";
          lockReason = `Complete '${missingTopicPrereqs[0]}' first (coding + lab + assessment).`;
        } else if (masteryStatus === "learning" || masteryStatus === "practiced") {
          lockState = "IN_PROGRESS";
          unlockedReason = "Currently in progress. Complete practical lab and assessment to unlock next.";
        } else {
          lockState = "AVAILABLE";
          unlockedReason = "Prerequisites satisfied. Ready to learn.";
        }

        if (lockState === "MASTERED") {
          subjMastered++;
          masteredCount++;
          subjCompleted++;
          completedCount++;
        } else if (lockState === "COMPLETED") {
          subjCompleted++;
          completedCount++;
        }

        const relevance = (topic.roleRelevance as Record<string, { importance: "CRITICAL" | "HIGH" | "SUPPORTING"; why: string }>)?.[targetRole] || {
          importance: roleSubj.roleImportance === "CORE" || roleSubj.roleImportance === "FOUNDATION" ? "CRITICAL" : "HIGH",
          why: roleSubj.roleWhy,
        };

        const node: CanonicalRoadmapNode = {
          topicId: topic.id,
          title: topic.title,
          subjectId: fullSubj.id,
          subjectTitle: fullSubj.title,
          moduleId: mod.id,
          moduleTitle: mod.title,
          difficulty: topic.difficulty,
          estimatedMinutes: topic.estimatedMinutes,
          orderIndex: globalOrder++,
          lockState,
          masteryStatus,
          prerequisites: effectivePrereqs,
          missingPrerequisites: missingTopicPrereqs,
          unlockedReason,
          lockReason,
          exemptedByEvidence: isExempt,
          assessmentScore: rec?.assessmentScore ?? null,
          remediationRequired: Boolean(rec?.remediationRequired),
          weakConcepts: rec?.weakConcepts || [],
          roleImportance: relevance.importance,
          roleWhy: relevance.why,
        };

        if (!recommendedNextTopic && (lockState === "REMEDIATION_REQUIRED" || lockState === "IN_PROGRESS" || lockState === "AVAILABLE")) {
          recommendedNextTopic = node;
        }
        if ((lockState === "AVAILABLE" || lockState === "IN_PROGRESS") && !rec?.labPassed && upcomingPracticals.length < 4) {
          upcomingPracticals.push({ topicId: topic.id, title: topic.title, subjectTitle: fullSubj.title });
        }
        if ((lockState === "AVAILABLE" || lockState === "IN_PROGRESS") && !rec?.assessmentPassed && upcomingAssessments.length < 4) {
          upcomingAssessments.push({ topicId: topic.id, title: topic.title, subjectTitle: fullSubj.title });
        }

        nodes.push(node);
        prevTopicInSubjectId = topic.id;
      }
    }

    subjects.push({
      subjectId: fullSubj.id,
      slug: fullSubj.slug,
      title: fullSubj.title,
      icon: fullSubj.icon,
      badge: fullSubj.badge,
      roleImportance: roleSubj.roleImportance,
      roleWhy: roleSubj.roleWhy,
      estimatedHours: roleSubj.estimatedHours,
      prerequisites: roleSubj.prerequisites,
      missingPrerequisiteSubjects,
      isUnlocked: isSubjUnlocked,
      completedTopics: subjCompleted,
      masteredTopics: subjMastered,
      totalTopics: nodes.length,
      percentMastered: nodes.length > 0 ? Math.round((subjCompleted / nodes.length) * 100) : 0,
      topics: nodes,
    });
  }

  const requiredCompetencies = customRoleConfig
    ? customRoleConfig.requiredSkills
    : (TARGET_ROLE_PROFILES_SAFE(targetRole)?.requiredSkills || ["python", "machine_learning"]);

  return {
    candidateId,
    targetRole,
    roleTitle: progression.roleTitle,
    roleSummary: progression.summary,
    requiredCompetencies,
    verifiedCompetencies: Array.from(verifiedSkillSet),
    missingPrerequisites: Array.from(missingGlobalPrerequisites),
    exemptionsGranted: Array.from(exemptedSkills),
    totalTopics,
    completedCount,
    masteredCount,
    overallProgressPercent: totalTopics > 0 ? Math.round((completedCount / totalTopics) * 100) : 0,
    currentPosition: learningPosition,
    recommendedNextTopic,
    upcomingPracticals,
    upcomingAssessments,
    requiredProjects: [
      "Level 1: Topic Concept Automation / Data Script",
      "Level 2: End-to-End Integration Pipeline",
      `Level 3: ${progression.roleTitle} Production Capstone`,
    ],
    subjects,
  };
}

function TARGET_ROLE_PROFILES_SAFE(slug: string) {
  try {
    const { getTargetRoleBySlug } = require("./roles");
    return getTargetRoleBySlug(slug);
  } catch {
    return null;
  }
}
