/**
 * lib/skills/curriculum/unified-curriculum-registry.ts
 * 
 * Canonical Master Registry for the Cognalyze Unified Learning & Evaluation System.
 * Aggregates all 17 canonical subjects, chapters, topics, and subtopics into a
 * single searchable, typed, dependency-aware curriculum graph.
 * 
 * Hierarchy:
 * Learning → Subject → Chapter → Topic → Subtopic → Learning Experience.
 */

import {
  CanonicalSubject,
  CanonicalSubjectSlug,
  CanonicalSubtopic,
  CanonicalChapter,
  CanonicalTopic,
  CurriculumCoverageReport
} from "./types";

import { PYTHON_SUBJECT } from "./subjects/python";
import { NUMPY_SUBJECT } from "./subjects/numpy";
import { PANDAS_SUBJECT } from "./subjects/pandas";
import { VISUALIZATION_SUBJECT } from "./subjects/visualization";
import { SCIKIT_LEARN_SUBJECT } from "./subjects/scikit_learn";
import { SQL_SUBJECT } from "./subjects/sql";
import { MATH_STATS_SUBJECT } from "./subjects/math_stats";
import { DATA_SCIENCE_SUBJECT } from "./subjects/data_science";
import { MACHINE_LEARNING_SUBJECT } from "./subjects/machine_learning";
import { DEEP_LEARNING_SUBJECT } from "./subjects/deep_learning";
import { ARTIFICIAL_INTELLIGENCE_SUBJECT } from "./subjects/artificial_intelligence";
import { GENAI_LLM_SUBJECT } from "./subjects/genai_llm";
import { AGENTIC_AI_SUBJECT } from "./subjects/agentic_ai";
import { DATA_ENGINEERING_SUBJECT } from "./subjects/data_engineering";
import { MLOPS_SUBJECT } from "./subjects/mlops";
import { APPLIED_PROJECTS_SUBJECT } from "./subjects/applied_projects";
import { DSA_SUBJECT } from "./subjects/dsa";

export const ALL_CANONICAL_SUBJECTS: Record<CanonicalSubjectSlug, CanonicalSubject> = {
  python: PYTHON_SUBJECT,
  numpy: NUMPY_SUBJECT,
  pandas: PANDAS_SUBJECT,
  visualization: VISUALIZATION_SUBJECT,
  scikit_learn: SCIKIT_LEARN_SUBJECT,
  sql: SQL_SUBJECT,
  math_stats: MATH_STATS_SUBJECT,
  data_science: DATA_SCIENCE_SUBJECT,
  machine_learning: MACHINE_LEARNING_SUBJECT,
  deep_learning: DEEP_LEARNING_SUBJECT,
  artificial_intelligence: ARTIFICIAL_INTELLIGENCE_SUBJECT,
  genai_llm: GENAI_LLM_SUBJECT,
  agentic_ai: AGENTIC_AI_SUBJECT,
  data_engineering: DATA_ENGINEERING_SUBJECT,
  mlops: MLOPS_SUBJECT,
  applied_projects: APPLIED_PROJECTS_SUBJECT,
  dsa: DSA_SUBJECT
};

export const CANONICAL_SUBJECT_LIST: CanonicalSubject[] = Object.values(ALL_CANONICAL_SUBJECTS);

/**
 * Returns all registered canonical subjects in display order
 */
export function getAllSubjects(): CanonicalSubject[] {
  return CANONICAL_SUBJECT_LIST;
}

/**
 * Retrieves a subject by its canonical slug
 */
export function getSubjectBySlug(slug: string): CanonicalSubject | undefined {
  return ALL_CANONICAL_SUBJECTS[slug as CanonicalSubjectSlug];
}

/**
 * Retrieves a flat array of all subtopics across all subjects
 */
export function getAllSubtopics(): CanonicalSubtopic[] {
  const allSubtopics: CanonicalSubtopic[] = [];
  for (const subject of CANONICAL_SUBJECT_LIST) {
    for (const chapter of subject.chapters) {
      for (const topic of chapter.topics) {
        for (const subtopic of topic.subtopics) {
          allSubtopics.push(subtopic);
        }
      }
    }
  }
  return allSubtopics;
}

/**
 * Fast lookup map for subtopics by slug
 */
const SUBTOPIC_BY_SLUG_MAP: Map<string, CanonicalSubtopic> = new Map(
  getAllSubtopics().map((s) => [s.slug, s])
);

/**
 * Retrieves a single subtopic by its unique slug
 */
export function getSubtopicBySlug(slug: string): CanonicalSubtopic | undefined {
  return SUBTOPIC_BY_SLUG_MAP.get(slug);
}

/**
 * Retrieves all subtopics belonging to a specific subject
 */
export function getSubtopicsForSubject(subjectSlug: CanonicalSubjectSlug): CanonicalSubtopic[] {
  const subject = getSubjectBySlug(subjectSlug);
  if (!subject) return [];

  const subtopics: CanonicalSubtopic[] = [];
  for (const chapter of subject.chapters) {
    for (const topic of chapter.topics) {
      for (const sub of topic.subtopics) {
        subtopics.push(sub);
      }
    }
  }
  return subtopics;
}

/**
 * Performs keyword search across curriculum titles, goals, and summaries
 */
export function searchCurriculum(query: string): Array<{
  subtopic: CanonicalSubtopic;
  subjectName: string;
  chapterTitle: string;
}> {
  if (!query || !query.trim()) return [];
  const q = query.toLowerCase().trim();

  const results: Array<{
    subtopic: CanonicalSubtopic;
    subjectName: string;
    chapterTitle: string;
  }> = [];

  for (const subject of CANONICAL_SUBJECT_LIST) {
    for (const chapter of subject.chapters) {
      for (const topic of chapter.topics) {
        for (const sub of topic.subtopics) {
          if (
            sub.title.toLowerCase().includes(q) ||
            sub.learningGoal.toLowerCase().includes(q) ||
            sub.formalConcept.toLowerCase().includes(q) ||
            topic.title.toLowerCase().includes(q)
          ) {
            results.push({
              subtopic: sub,
              subjectName: subject.name,
              chapterTitle: chapter.title
            });
          }
        }
      }
    }
  }

  return results;
}

/**
 * Generates an empirical coverage manifest of all registered subjects, chapters, and topics
 */
export function getCurriculumCoverageManifest(): CurriculumCoverageReport {
  let totalChapters = 0;
  let totalTopics = 0;
  let totalSubtopics = 0;

  const breakdown = CANONICAL_SUBJECT_LIST.map((subj) => {
    let sTopics = 0;
    let sSubtopics = 0;

    for (const ch of subj.chapters) {
      totalChapters++;
      sTopics += ch.topics.length;
      totalTopics += ch.topics.length;
      for (const top of ch.topics) {
        sSubtopics += top.subtopics.length;
        totalSubtopics += top.subtopics.length;
      }
    }

    return {
      subjectSlug: subj.slug,
      name: subj.name,
      chaptersCount: subj.chapters.length,
      topicsCount: sTopics,
      subtopicsCount: sSubtopics,
      estimatedHours: subj.estimatedHours
    };
  });

  return {
    totalSubjects: CANONICAL_SUBJECT_LIST.length,
    totalChapters,
    totalTopics,
    totalSubtopics,
    subjectsBreakdown: breakdown
  };
}

