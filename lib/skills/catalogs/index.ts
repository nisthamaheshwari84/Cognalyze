/**
 * lib/skills/catalogs/index.ts
 * 
 * Central Aggregator and Query Engine for Cognalyze Multi-Skill Canonical Catalogs.
 * 
 * Guarantees >= 100 validated distinct questions per standalone discipline:
 * 1. DSA Catalog (120 questions)
 * 2. Machine Learning Catalog (100 questions)
 * 3. Data Science & Analytics Catalog (100 questions)
 * 4. SQL Catalog (100 questions)
 * 5. Generative AI & LLMs Catalog (100 questions)
 * 6. Data Engineering Catalog (100 questions)
 * 7. MLOps Catalog (100 questions)
 * Total: 720 distinct canonical questions.
 */

import { QuestionItem } from "../../question-bank-types";
import { DSA_CATALOG } from "./dsa-catalog";
import { ML_CATALOG } from "./ml-catalog";
import { DATA_SCIENCE_CATALOG } from "./data-science-catalog";
import { SQL_CATALOG } from "./sql-catalog";
import { GENAI_CATALOG } from "./genai-catalog";
import { DATA_ENG_CATALOG } from "./data-eng-catalog";
import { MLOPS_CATALOG } from "./mlops-catalog";

export {
  DSA_CATALOG,
  ML_CATALOG,
  DATA_SCIENCE_CATALOG,
  SQL_CATALOG,
  GENAI_CATALOG,
  DATA_ENG_CATALOG,
  MLOPS_CATALOG
};

export const ALL_SKILL_QUESTIONS: QuestionItem[] = [
  ...DSA_CATALOG,
  ...ML_CATALOG,
  ...DATA_SCIENCE_CATALOG,
  ...SQL_CATALOG,
  ...GENAI_CATALOG,
  ...DATA_ENG_CATALOG,
  ...MLOPS_CATALOG
];

/**
 * Fast lookup map by question ID
 */
export const QUESTION_BY_ID_MAP = new Map<string, QuestionItem>(
  ALL_SKILL_QUESTIONS.map(q => [q.id, q])
);

export function getQuestionById(id: string): QuestionItem | undefined {
  return QUESTION_BY_ID_MAP.get(id);
}

export function getQuestionsByDomain(domain: string): QuestionItem[] {
  const norm = domain.toLowerCase().trim();
  return ALL_SKILL_QUESTIONS.filter(q => q.domain.toLowerCase() === norm);
}

export function getQuestionsByCompany(company: string): QuestionItem[] {
  const norm = company.toLowerCase().trim();
  return ALL_SKILL_QUESTIONS.filter(q =>
    (q.company || "").toLowerCase() === norm ||
    (q.tags || []).some(t => t.toLowerCase() === norm)
  );
}

export function getCatalogStatistics() {
  return {
    dsa: DSA_CATALOG.length,
    machineLearning: ML_CATALOG.length,
    dataScience: DATA_SCIENCE_CATALOG.length,
    sql: SQL_CATALOG.length,
    generativeAi: GENAI_CATALOG.length,
    dataEngineering: DATA_ENG_CATALOG.length,
    mlops: MLOPS_CATALOG.length,
    total: ALL_SKILL_QUESTIONS.length
  };
}

