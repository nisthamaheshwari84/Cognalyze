/**
 * lib/skills/ai-data/roles.ts
 * 
 * Verified Industry Role Profiles for AI, Data & Intelligence Careers.
 * Sourced from official job specifications (OpenAI, Google Cloud, Meta, Amazon, Uber, Stripe, TCS Digital).
 */

import { TargetRoleProfile, TargetRoleSlug } from "./types";

export const TARGET_ROLE_PROFILES: Record<TargetRoleSlug, TargetRoleProfile> = {
  ai_engineer: {
    slug: "ai_engineer",
    title: "AI Engineer",
    badge: "LLM Apps & Agents",
    icon: "🤖",
    summary: "Builds production AI applications using LLMs, multi-step agent graphs, tool calling, and RAG architectures with strict latency and eval guardrails.",
    typicalCompanies: ["OpenAI", "Google", "Microsoft", "Stripe", "Anthropic", "Scale AI"],
    primaryInterviewFormats: [
      "Agent Architecture & Tool Calling (45m)",
      "RAG Pipeline Optimization & Evals (60m)",
      "Prompt Injection & Guardrail Defense (45m)"
    ],
    requiredSkills: [
      "prompt_engineering_structured_outputs",
      "rag_architecture_and_retrieval",
      "ai_agents_and_tool_calling",
      "llm_evaluations_and_safety",
      "python"
    ],
    preferredSkills: [
      "python_data_stack",
      "mlops_serving_and_monitoring",
      "rest_api"
    ],
    primaryTrack: "genai_llm",
    secondaryTracks: ["applied_projects", "mlops"],
    salaryTier: "₹18–45 LPA (India) / $160k–260k (US)"
  },
  ml_engineer: {
    slug: "ml_engineer",
    title: "Machine Learning Engineer (MLE)",
    badge: "Algorithms & Scale",
    icon: "⚙️",
    summary: "Designs, trains, evaluates, and deploys scalable classical ML and deep learning models from tabular prediction to ranking and recommendation systems.",
    typicalCompanies: ["Meta", "Amazon", "Google", "Uber", "Flipkart", "Swiggy"],
    primaryInterviewFormats: [
      "Coding & Algorithmic Problem Solving (60m)",
      "ML System Design: Feed/Search Ranking (60m)",
      "Cross-Validation & Error Analysis (45m)"
    ],
    requiredSkills: [
      "python_data_stack",
      "classical_ml_modeling",
      "ml_model_evaluation",
      "deep_learning_foundations",
      "dsa"
    ],
    preferredSkills: [
      "mlops_serving_and_monitoring",
      "advanced_sql_analytics",
      "docker"
    ],
    primaryTrack: "ai_ml",
    secondaryTracks: ["mlops", "applied_projects"],
    salaryTier: "₹16–42 LPA (India) / $155k–250k (US)"
  },
  data_scientist: {
    slug: "data_scientist",
    title: "Data Scientist",
    badge: "Stats & Inference",
    icon: "🧪",
    summary: "Combines statistical rigor, hypothesis testing, experiment design (A/B tests), and predictive modeling to extract causal insights and drive business growth.",
    typicalCompanies: ["Uber", "Airbnb", "Netflix", "Razorpay", "Zomato", "Cred"],
    primaryInterviewFormats: [
      "A/B Testing & Experimentation Case Study (45m)",
      "Applied Modeling & Feature Engineering (45m)",
      "SQL Screener (45m)"
    ],
    requiredSkills: [
      "advanced_sql_analytics",
      "exploratory_data_analysis",
      "ab_testing_statistics",
      "classical_ml_modeling",
      "ml_model_evaluation"
    ],
    preferredSkills: [
      "business_product_analytics",
      "python_data_stack"
    ],
    primaryTrack: "data_science_analytics",
    secondaryTracks: ["ai_ml", "applied_projects"],
    salaryTier: "₹15–38 LPA (India) / $140k–230k (US)"
  },
  data_analyst: {
    slug: "data_analyst",
    title: "Data & Product Analyst",
    badge: "SQL & Metrics",
    icon: "📊",
    summary: "Translates ambiguous business questions into measurable metric trees, designs cohort retention analyses, writes production SQL, and isolates root-cause anomalies.",
    typicalCompanies: ["Stripe", "Amazon", "TCS Digital", "Infosys", "PhonePe", "Deloitte"],
    primaryInterviewFormats: [
      "Live SQL Coding: Window Functions & CTEs (45m)",
      "Product Metric Decomposition & Root Cause Case (45m)",
      "Business Stakeholder Communication (30m)"
    ],
    requiredSkills: [
      "advanced_sql_analytics",
      "business_product_analytics",
      "exploratory_data_analysis",
      "communication"
    ],
    preferredSkills: [
      "ab_testing_statistics",
      "python_data_stack"
    ],
    primaryTrack: "data_science_analytics",
    secondaryTracks: ["applied_projects"],
    salaryTier: "₹8–24 LPA (India) / $95k–160k (US)"
  },
  data_engineer: {
    slug: "data_engineer",
    title: "Data Engineer",
    badge: "Pipelines & Warehousing",
    icon: "🛢️",
    summary: "Architects scalable ETL/ELT pipelines, designs dimensional data warehouses (Star/Snowflake, SCD Type 1 & 2), and optimizes distributed processing with PySpark.",
    typicalCompanies: ["Databricks", "Snowflake", "Amazon", "TCS Digital", "Walmart Global Tech", "Target"],
    primaryInterviewFormats: [
      "Advanced SQL & PySpark Data Transformations (45m)",
      "Data Warehouse & Pipeline System Design (60m)",
      "Idempotency & Data Quality Recovery (45m)"
    ],
    requiredSkills: [
      "data_engineering_pipelines",
      "advanced_sql_analytics",
      "sql",
      "python"
    ],
    preferredSkills: [
      "python_data_stack",
      "docker",
      "system_design"
    ],
    primaryTrack: "data_eng",
    secondaryTracks: ["data_science_analytics", "applied_projects"],
    salaryTier: "₹14–36 LPA (India) / $135k–220k (US)"
  },
  genai_llm_engineer: {
    slug: "genai_llm_engineer",
    title: "GenAI & LLM Platform Engineer",
    badge: "Evals & Guardrails",
    icon: "⚡",
    summary: "Specializes in productionizing foundational models: fine-tuning, latency optimization, prompt caching, hybrid search, Ragas evals, and prompt injection defense.",
    typicalCompanies: ["Anthropic", "Microsoft", "Amazon Bedrock", "Cohere", "Infosys Digital", "Wipro Turbo"],
    primaryInterviewFormats: [
      "RAG Triad & Hallucination Elimination (60m)",
      "Golden Eval Dataset Design & CI/CD Benchmarking (45m)",
      "Token Optimization & Prefix Caching Architecture (45m)"
    ],
    requiredSkills: [
      "rag_architecture_and_retrieval",
      "llm_evaluations_and_safety",
      "prompt_engineering_structured_outputs",
      "python"
    ],
    preferredSkills: [
      "ai_agents_and_tool_calling",
      "mlops_serving_and_monitoring"
    ],
    primaryTrack: "genai_llm",
    secondaryTracks: ["mlops", "applied_projects"],
    salaryTier: "₹20–48 LPA (India) / $170k–280k (US)"
  },
  mlops_engineer: {
    slug: "mlops_engineer",
    title: "MLOps & ML Platform Engineer",
    badge: "Serving & Drift",
    icon: "🚀",
    summary: "Bridges model training and production: builds low-latency inference APIs (FastAPI/Triton), tracks experiments (MLflow), monitors data/concept drift, and coordinates rollbacks.",
    typicalCompanies: ["Snowflake", "Databricks", "Uber", "Google Cloud", "Thoughtworks", "Persistent"],
    primaryInterviewFormats: [
      "Model Inference Serving & Latency Optimization (45m)",
      "Live Production Drift Incident Triage (45m)",
      "Automated CI/CD & Model Rollback Pipeline (45m)"
    ],
    requiredSkills: [
      "mlops_serving_and_monitoring",
      "classical_ml_modeling",
      "docker",
      "fastapi",
      "rest_api"
    ],
    preferredSkills: [
      "data_engineering_pipelines",
      "deep_learning_foundations"
    ],
    primaryTrack: "mlops",
    secondaryTracks: ["ai_ml", "applied_projects"],
    salaryTier: "₹16–40 LPA (India) / $150k–240k (US)"
  },
  applied_ai_engineer: {
    slug: "applied_ai_engineer",
    title: "Applied AI Engineer",
    badge: "Full-Stack AI",
    icon: "🌟",
    summary: "Full-stack software engineer with deep AI capabilities: embeds intelligent workflows, real-time streaming, and tool execution into responsive end-user products.",
    typicalCompanies: ["OpenAI", "Palantir", "Vercel", "Razorpay", "Postman", "BrowserStack"],
    primaryInterviewFormats: [
      "Full-Stack AI Work-Sample Challenge (90m)",
      "Asynchronous Streaming & State Architecture (45m)",
      "Product Defense & Trade-Offs (45m)"
    ],
    requiredSkills: [
      "ai_agents_and_tool_calling",
      "prompt_engineering_structured_outputs",
      "typescript",
      "python",
      "rest_api"
    ],
    preferredSkills: [
      "nextjs",
      "rag_architecture_and_retrieval",
      "advanced_sql_analytics"
    ],
    primaryTrack: "applied_projects",
    secondaryTracks: ["genai_llm", "ai_ml"],
    salaryTier: "₹18–45 LPA (India) / $160k–265k (US)"
  }
};

export function getAllTargetRoles(): TargetRoleProfile[] {
  return Object.values(TARGET_ROLE_PROFILES);
}

export function getTargetRoleBySlug(slug: TargetRoleSlug): TargetRoleProfile {
  return TARGET_ROLE_PROFILES[slug] || TARGET_ROLE_PROFILES.ai_engineer;
}

