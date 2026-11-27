/**
 * COGNALYZE DSA LEARN — CONCEPT MASTERY STORE (PHASE 9)
 * 
 * Manages persistent conceptual mastery metrics independently from the 455 DSA problem
 * solved count. Guarantees zero pollution or merging of problem practice metrics.
 */

import { getCurriculumCoverageStats } from "./curriculum-registry";
import { isPrerequisiteSatisfied, getMissingPrerequisites } from "./prerequisite-graph";

export interface ConceptMasteryRecord {
  microConceptId: string;
  masteryScore: number; // 0 to 100
  verifiedAt: string;
  evaluationMode: "llm" | "diagnostic_quiz" | "socratic_verification";
}

export interface StudentConceptMasteryData {
  candidateId: string;
  understoodConcepts: Record<string, ConceptMasteryRecord>;
  lastActiveTimestamp: string;
}

export interface ConceptMasterySummary {
  candidateId: string;
  totalAvailableConcepts: number;
  totalUnderstoodCount: number;
  overallMasteryPercentage: number;
  understoodConceptIds: string[];
  records: Record<string, ConceptMasteryRecord>;
}

const STORAGE_PREFIX = "cognalyze_learn_mastery_v1_";

/**
 * In-memory fallback cache for SSR and tests
 */
const MEMORY_MASTERY_STORE: Record<string, StudentConceptMasteryData> = {};

/**
 * Loads concept mastery state for a given candidate.
 */
export function getStudentConceptMastery(candidateId: string = "guest"): ConceptMasterySummary {
  const stats = getCurriculumCoverageStats();
  const totalAvailable = stats.totalMicroConcepts; // 59 micro-concepts

  let data: StudentConceptMasteryData | null = null;

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${candidateId}`);
      if (raw) data = JSON.parse(raw);
    } catch (e) {
      console.warn("[getStudentConceptMastery] LocalStorage read failed:", e);
    }
  }

  if (!data) {
    data = MEMORY_MASTERY_STORE[candidateId] || {
      candidateId,
      understoodConcepts: {
        // Pilot Golden Standard module (mc-3-2-1-1: Kadane's Algorithm) pre-seeded as verified
        "mc-3-2-1-1": {
          microConceptId: "mc-3-2-1-1",
          masteryScore: 92,
          verifiedAt: new Date().toISOString(),
          evaluationMode: "socratic_verification"
        }
      },
      lastActiveTimestamp: new Date().toISOString()
    };
  }

  const understoodIds = Object.keys(data.understoodConcepts);
  const understoodCount = understoodIds.length;
  const percentage = Math.round((understoodCount / Math.max(1, totalAvailable)) * 100);

  return {
    candidateId,
    totalAvailableConcepts: totalAvailable,
    totalUnderstoodCount: understoodCount,
    overallMasteryPercentage: percentage,
    understoodConceptIds: understoodIds,
    records: data.understoodConcepts
  };
}

/**
 * Records that a candidate has mastered/understood a micro-concept.
 */
export function markMicroConceptUnderstood(
  candidateId: string = "guest",
  microConceptId: string,
  score: number = 85,
  mode: ConceptMasteryRecord["evaluationMode"] = "socratic_verification"
): ConceptMasterySummary {
  let data = MEMORY_MASTERY_STORE[candidateId];

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      const raw = localStorage.getItem(`${STORAGE_PREFIX}${candidateId}`);
      if (raw) data = JSON.parse(raw);
    } catch (e) {
      console.warn("[markMicroConceptUnderstood] LocalStorage read failed:", e);
    }
  }

  if (!data) {
    const existing = getStudentConceptMastery(candidateId);
    data = {
      candidateId,
      understoodConcepts: { ...existing.records },
      lastActiveTimestamp: new Date().toISOString()
    };
  }

  data.understoodConcepts[microConceptId] = {
    microConceptId,
    masteryScore: Math.min(100, Math.max(0, Math.round(score))),
    verifiedAt: new Date().toISOString(),
    evaluationMode: mode
  };
  data.lastActiveTimestamp = new Date().toISOString();

  MEMORY_MASTERY_STORE[candidateId] = data;

  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.setItem(`${STORAGE_PREFIX}${candidateId}`, JSON.stringify(data));
    } catch (e) {
      console.warn("[markMicroConceptUnderstood] LocalStorage write failed:", e);
    }
  }

  return getStudentConceptMastery(candidateId);
}

/**
 * Checks whether a micro-concept is unlocked based on prerequisite DAG satisfaction.
 */
export function isConceptNodeUnlocked(
  microConceptId: string,
  understoodConceptIds: string[]
): {
  isUnlocked: boolean;
  isMastered: boolean;
  missingPrerequisites: Array<{ id: string; title: string }>;
} {
  const isMastered = understoodConceptIds.includes(microConceptId);
  const completedSet = new Set(understoodConceptIds);

  const isUnlocked = isPrerequisiteSatisfied(microConceptId, completedSet);
  const missing = getMissingPrerequisites(microConceptId, completedSet);

  return {
    isUnlocked,
    isMastered,
    missingPrerequisites: missing.map((m) => ({ id: m.id, title: m.title }))
  };
}
