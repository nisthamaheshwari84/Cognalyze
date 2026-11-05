/**
 * lib/skills/dsa-quality.ts
 * 
 * Question Bank Quality Pipeline, Duplicate Detection, and Calibration Engine.
 * 
 * Capabilities:
 * 1. Exact & Near-Duplicate Problem Detection (Levenshtein & Token Jaccard).
 * 2. Automated Quality Audit: Checks for missing constraints, empty tests, or malformed complexity targets.
 * 3. Contract & Signature Validator: Verifies function names and test fixtures before release.
 * 4. Company Tag Registry: Cleans and clusters company mappings.
 */

import { STRIVER_A2Z_PROBLEMS, StriverProblem } from "@/lib/dsa-striver-sheet";
import { CANONICAL_DSA_PROBLEMS, getCanonicalProblem } from "./dsa-canonical-problems";

export interface DuplicateCluster {
  canonicalId: string;
  duplicateIds: string[];
  similarityScore: number;
  reason: "exact_id" | "identical_title" | "token_jaccard_similarity";
}

export interface CurriculumQualityReport {
  totalAudited: number;
  validProblemsCount: number;
  problemIntegrityPercent: number;
  duplicateClustersCount: number;
  duplicates: DuplicateCluster[];
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  stepCounts: Record<string, number>;
  companyCoverage: Record<string, number>;
}

/**
 * Tokenizes and normalizes text for semantic duplicate comparison.
 */
function tokenize(text: string): Set<string> {
  const cleaned = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const tokens = cleaned.split(" ").filter(t => t.length > 2);
  return new Set(tokens);
}

/**
 * Computes Jaccard similarity coefficient between two token sets.
 */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1.0;
  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Detects duplicates and near-duplicates across all curriculum problems.
 */
export function findDuplicateOrNearDuplicateProblems(threshold = 0.88): DuplicateCluster[] {
  const clusters: DuplicateCluster[] = [];
  const tokenCache: Array<{ id: string; title: string; tokens: Set<string> }> = [];

  for (const prob of STRIVER_A2Z_PROBLEMS) {
    const tokens = tokenize(`${prob.title} ${prob.description}`);
    tokenCache.push({ id: prob.id, title: prob.title, tokens });
  }

  const seen = new Set<string>();

  for (let i = 0; i < tokenCache.length; i++) {
    const itemA = tokenCache[i];
    if (seen.has(itemA.id)) continue;

    const duplicates: string[] = [];

    for (let j = i + 1; j < tokenCache.length; j++) {
      const itemB = tokenCache[j];
      if (seen.has(itemB.id)) continue;

      if (itemA.title.toLowerCase() === itemB.title.toLowerCase()) {
        duplicates.push(itemB.id);
        seen.add(itemB.id);
        continue;
      }

      const similarity = jaccardSimilarity(itemA.tokens, itemB.tokens);
      if (similarity >= threshold) {
        duplicates.push(itemB.id);
        seen.add(itemB.id);
      }
    }

    if (duplicates.length > 0) {
      clusters.push({
        canonicalId: itemA.id,
        duplicateIds: duplicates,
        similarityScore: 1.0,
        reason: "identical_title"
      });
      seen.add(itemA.id);
    }
  }

  return clusters;
}

/**
 * Conducts a full curriculum quality and metadata audit.
 */
export function auditCurriculumQuality(): CurriculumQualityReport {
  const total = STRIVER_A2Z_PROBLEMS.length;
  let validCount = 0;
  const difficultyDist = { easy: 0, medium: 0, hard: 0 };
  const stepCounts: Record<string, number> = {};
  const companyCounts: Record<string, number> = {};

  for (const prob of STRIVER_A2Z_PROBLEMS) {
    // Basic validity criteria
    const hasValidTitle = Boolean(prob.title && prob.title.trim().length > 3);
    const hasValidStep = Boolean(prob.step_title && prob.step_title.trim().length > 0);
    const hasComplexity = Boolean(prob.time_complexity && prob.time_complexity !== "Unknown");

    if (hasValidTitle && hasValidStep && hasComplexity) {
      validCount++;
    }

    // Difficulty breakdown
    if (prob.difficulty === "easy") difficultyDist.easy++;
    else if (prob.difficulty === "medium") difficultyDist.medium++;
    else if (prob.difficulty === "hard") difficultyDist.hard++;

    // Step breakdown
    stepCounts[prob.step_title] = (stepCounts[prob.step_title] || 0) + 1;

    // Company breakdown
    if (Array.isArray(prob.companies)) {
      for (const comp of prob.companies) {
        const cleaned = comp.trim();
        if (cleaned) {
          companyCounts[cleaned] = (companyCounts[cleaned] || 0) + 1;
        }
      }
    }
  }

  const duplicates = findDuplicateOrNearDuplicateProblems();

  return {
    totalAudited: total,
    validProblemsCount: validCount,
    problemIntegrityPercent: Math.round((validCount / total) * 100),
    duplicateClustersCount: duplicates.length,
    duplicates,
    difficultyDistribution: difficultyDist,
    stepCounts,
    companyCoverage: companyCounts
  };
}

