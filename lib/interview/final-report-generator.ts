import crypto from "crypto";
import { AdvancedSessionState } from "@/lib/ai/interview-engine";
import { ConductIncident, ConductState } from "./conduct-engine";

// ══════════════════════════════════════════════════════════════
// 1. THE 7 CALIBRATED COMPETENCY DIMENSIONS
// ══════════════════════════════════════════════════════════════

export type CompetencyDimensionId =
  | "DIM_1_TECH_FUNDAMENTALS"
  | "DIM_2_PROBLEM_SOLVING"
  | "DIM_3_PRACTICAL_IMPL"
  | "DIM_4_SYSTEM_DESIGN"
  | "DIM_5_PROJECT_EXPERIENCE"
  | "DIM_6_COMMUNICATION"
  | "DIM_7_ROLE_RELEVANCE";

export interface DimensionMetadata {
  id: CompetencyDimensionId;
  name: string;
  description: string;
}

export const CANONICAL_DIMENSIONS: Record<CompetencyDimensionId, DimensionMetadata> = {
  DIM_1_TECH_FUNDAMENTALS: {
    id: "DIM_1_TECH_FUNDAMENTALS",
    name: "Technical Fundamentals",
    description: "Core computer science foundations, memory models, protocol semantics, concurrency primitives, complexity theory.",
  },
  DIM_2_PROBLEM_SOLVING: {
    id: "DIM_2_PROBLEM_SOLVING",
    name: "Problem Solving & Algorithms",
    description: "Algorithmic decomposition, edge-case identification, space/time trade-off optimization.",
  },
  DIM_3_PRACTICAL_IMPL: {
    id: "DIM_3_PRACTICAL_IMPL",
    name: "Practical Implementation & Hands-on Code",
    description: "Milestone 4 sandbox code execution, clean idiomatic syntax, test pass rate, defensive programming.",
  },
  DIM_4_SYSTEM_DESIGN: {
    id: "DIM_4_SYSTEM_DESIGN",
    name: "System Design & Architecture",
    description: "High-level architecture, scalability, state persistence, failure domains, consensus and caching trade-offs.",
  },
  DIM_5_PROJECT_EXPERIENCE: {
    id: "DIM_5_PROJECT_EXPERIENCE",
    name: "Project Ownership & Experience",
    description: "Verification of claimed resume projects (12-point intelligence profile), architectural decisions, depth of individual ownership.",
  },
  DIM_6_COMMUNICATION: {
    id: "DIM_6_COMMUNICATION",
    name: "Technical Communication",
    description: "Precision of thought, structured explanations, active listening, handling hints and counterfactual challenges.",
  },
  DIM_7_ROLE_RELEVANCE: {
    id: "DIM_7_ROLE_RELEVANCE",
    name: "Job Role Relevance",
    description: "Alignment with JD must-have and good-to-have technologies, domain-specific best practices.",
  },
};

// ══════════════════════════════════════════════════════════════
// 2. TRACK WEIGHT MATRIX (Strictly sums to 1.00 per track)
// ══════════════════════════════════════════════════════════════

export type InterviewTrackId =
  | "fullstack"
  | "backend"
  | "frontend"
  | "systems"
  | "devops"
  | "ml_data"
  | "security"
  | "general_swe";

export const TRACK_WEIGHT_MATRIX: Record<InterviewTrackId, Record<CompetencyDimensionId, number>> = {
  fullstack: {
    DIM_1_TECH_FUNDAMENTALS: 0.15,
    DIM_2_PROBLEM_SOLVING: 0.15,
    DIM_3_PRACTICAL_IMPL: 0.20,
    DIM_4_SYSTEM_DESIGN: 0.15,
    DIM_5_PROJECT_EXPERIENCE: 0.15,
    DIM_6_COMMUNICATION: 0.10,
    DIM_7_ROLE_RELEVANCE: 0.10,
  },
  backend: {
    DIM_1_TECH_FUNDAMENTALS: 0.15,
    DIM_2_PROBLEM_SOLVING: 0.15,
    DIM_3_PRACTICAL_IMPL: 0.20,
    DIM_4_SYSTEM_DESIGN: 0.20,
    DIM_5_PROJECT_EXPERIENCE: 0.15,
    DIM_6_COMMUNICATION: 0.05,
    DIM_7_ROLE_RELEVANCE: 0.10,
  },
  frontend: {
    DIM_1_TECH_FUNDAMENTALS: 0.10,
    DIM_2_PROBLEM_SOLVING: 0.10,
    DIM_3_PRACTICAL_IMPL: 0.25,
    DIM_4_SYSTEM_DESIGN: 0.15,
    DIM_5_PROJECT_EXPERIENCE: 0.15,
    DIM_6_COMMUNICATION: 0.10,
    DIM_7_ROLE_RELEVANCE: 0.15,
  },
  systems: {
    DIM_1_TECH_FUNDAMENTALS: 0.25,
    DIM_2_PROBLEM_SOLVING: 0.15,
    DIM_3_PRACTICAL_IMPL: 0.25,
    DIM_4_SYSTEM_DESIGN: 0.15,
    DIM_5_PROJECT_EXPERIENCE: 0.10,
    DIM_6_COMMUNICATION: 0.05,
    DIM_7_ROLE_RELEVANCE: 0.05,
  },
  devops: {
    DIM_1_TECH_FUNDAMENTALS: 0.15,
    DIM_2_PROBLEM_SOLVING: 0.05,
    DIM_3_PRACTICAL_IMPL: 0.15,
    DIM_4_SYSTEM_DESIGN: 0.25,
    DIM_5_PROJECT_EXPERIENCE: 0.20,
    DIM_6_COMMUNICATION: 0.05,
    DIM_7_ROLE_RELEVANCE: 0.15,
  },
  ml_data: {
    DIM_1_TECH_FUNDAMENTALS: 0.15,
    DIM_2_PROBLEM_SOLVING: 0.20,
    DIM_3_PRACTICAL_IMPL: 0.20,
    DIM_4_SYSTEM_DESIGN: 0.15,
    DIM_5_PROJECT_EXPERIENCE: 0.15,
    DIM_6_COMMUNICATION: 0.05,
    DIM_7_ROLE_RELEVANCE: 0.10,
  },
  security: {
    DIM_1_TECH_FUNDAMENTALS: 0.20,
    DIM_2_PROBLEM_SOLVING: 0.10,
    DIM_3_PRACTICAL_IMPL: 0.20,
    DIM_4_SYSTEM_DESIGN: 0.20,
    DIM_5_PROJECT_EXPERIENCE: 0.15,
    DIM_6_COMMUNICATION: 0.05,
    DIM_7_ROLE_RELEVANCE: 0.10,
  },
  general_swe: {
    DIM_1_TECH_FUNDAMENTALS: 0.15,
    DIM_2_PROBLEM_SOLVING: 0.20,
    DIM_3_PRACTICAL_IMPL: 0.25,
    DIM_4_SYSTEM_DESIGN: 0.15,
    DIM_5_PROJECT_EXPERIENCE: 0.10,
    DIM_6_COMMUNICATION: 0.05,
    DIM_7_ROLE_RELEVANCE: 0.10,
  },
};

export function getTrackWeights(track?: string): Record<CompetencyDimensionId, number> {
  const normalized = (track || "general_swe").toLowerCase().replace(/[^a-z0-9_]/g, "_") as InterviewTrackId;
  return TRACK_WEIGHT_MATRIX[normalized] || TRACK_WEIGHT_MATRIX.general_swe;
}

// ══════════════════════════════════════════════════════════════
// 3. EVIDENCE & DIMENSION REPORT INTERFACES
// ══════════════════════════════════════════════════════════════

export interface VerbatimTranscriptAnchor {
  turnIndex: number;
  stageId: string;
  questionExcerpt: string;
  candidateQuote: string;
  quoteHash: string; // SHA-256
  demonstratedTopic: string;
  rubricScore: number;
  evaluationNote: string;
}

export interface CodeSubmissionAnchor {
  submissionId: string;
  problemId: string;
  language: string;
  codeSha256: string;
  verdict: "ACCEPTED" | "WRONG_ANSWER" | "TIME_LIMIT_EXCEEDED" | "MEMORY_LIMIT_EXCEEDED" | "RUNTIME_ERROR" | "INTERNAL_ERROR";
  runtimeMs: number;
  memoryKb: number;
  stressTestPassed: boolean;
  cheatSuspicionScore: number;
  executionSource: "live_judge0" | "trusted_mock_fixture";
}

export type DimensionStatus =
  | "DEMONSTRATED_COMPETENCY"
  | "DEMONSTRATED_WEAKNESS"
  | "INSUFFICIENT_EVIDENCE"
  | "NOT_ASSESSED";

export interface DimensionAssessmentRecord {
  dimensionId: CompetencyDimensionId;
  dimensionName: string;
  status: DimensionStatus;
  score: number | null;
  weight: number;
  itemCount: number;
  transcriptAnchors: VerbatimTranscriptAnchor[];
  codeSubmissionAnchors?: CodeSubmissionAnchor[];
  strengths: string[];
  growthAreas: string[];
}

export interface ConductScorecardRecord {
  currentConductState: ConductState;
  totalInfractions: number;
  incidentLog: ConductIncident[];
  isTerminatedForMisconduct: boolean;
  behavioralImpactSummary: string;
}

export interface ActionableStudyTrack {
  dimensionId: CompetencyDimensionId;
  dimensionName: string;
  priority: "HIGH" | "MEDIUM" | "LOW";
  recommendedAction: string;
  suggestedModules: string[];
}

export type AssessmentStatus =
  | "COMPLETED_CERTIFIED"
  | "ASSESSMENT_INCOMPLETE"
  | "TERMINATED_MISCONDUCT";

export interface Milestone5FinalReport {
  reportId: string;
  sessionId: string;
  candidateId: string;
  targetRole: string;
  trackId: InterviewTrackId;
  assessmentStatus: AssessmentStatus;
  overallScore: number | null;
  overallScoreCalculation: string;
  confidence: number;
  executiveSummary: string;
  dimensionScores: Record<CompetencyDimensionId, DimensionAssessmentRecord>;
  codingEvaluation: {
    hasCodingSubmission: boolean;
    submissionsCount: number;
    highestVerdict?: string;
    optimalComplexityDemonstrated: boolean;
    submissions: CodeSubmissionAnchor[];
  };
  conductScorecard: ConductScorecardRecord;
  keyStrengths: string[];
  criticalGaps: string[];
  actionableStudyTracks: ActionableStudyTrack[];
  dnaSyncStatus: "PENDING" | "COMMITTED" | "SKIPPED" | "FAILED";
  generatedAt: string;
  metadata: {
    version: "2.0.0";
    synthesizer: "llm_calibrated" | "deterministic_rubric_fallback";
    hash: string;
  };
}

// ══════════════════════════════════════════════════════════════
// 4. SHA-256 HASH UTILITY
// ══════════════════════════════════════════════════════════════

export function computeSha256(content: string): string {
  return crypto.createHash("sha256").update(content.trim()).digest("hex");
}

export function extractVerbatimQuote(candidateAnswer: string, minLength = 10): string {
  if (!candidateAnswer || candidateAnswer.trim().length < minLength) {
    return "";
  }
  const clean = candidateAnswer.trim();
  // Take first substantive sentence or up to 160 characters
  const sentenceMatch = clean.match(/^([^\.\n\?!]{10,160}[\.\n\?!]?)/);
  if (sentenceMatch && sentenceMatch[1]) {
    return sentenceMatch[1].trim();
  }
  return clean.slice(0, 140).trim();
}

// ══════════════════════════════════════════════════════════════
// 5. 7-DIMENSION EVALUATION ENGINE
// ══════════════════════════════════════════════════════════════

/**
 * Maps turn sections, questions, and topics to appropriate dimensions
 */
export function classifyTurnDimensions(turn: any): CompetencyDimensionId[] {
  const dims: Set<CompetencyDimensionId> = new Set();
  const section = (turn.question?.section || "").toLowerCase();
  const questionTargets = (turn.question?.question_targets || "").toLowerCase();
  const topics = (turn.assessment?.topics_demonstrated || []).map((t: string) => t.toLowerCase());
  const questionType = (turn.question?.question_type || "").toLowerCase();

  // 1. Coding & Hands-on Code
  if (section.includes("coding") || questionType.includes("coding") || topics.some((t: string) => t.includes("algorithm") || t.includes("dsa") || t.includes("code"))) {
    dims.add("DIM_3_PRACTICAL_IMPL");
    dims.add("DIM_2_PROBLEM_SOLVING");
  }

  // 2. System Design
  if (section.includes("system_design") || questionTargets.includes("system design") || topics.some((t: string) => t.includes("architecture") || t.includes("distributed") || t.includes("redis") || t.includes("kafka") || t.includes("scale"))) {
    dims.add("DIM_4_SYSTEM_DESIGN");
    dims.add("DIM_1_TECH_FUNDAMENTALS");
  }

  // 3. Project Experience & Resume Deep Dive
  if (section.includes("project") || section.includes("resume") || questionTargets.includes("project") || questionTargets.includes("past work")) {
    dims.add("DIM_5_PROJECT_EXPERIENCE");
  }

  // 4. Job Role Relevance
  if (section.includes("role") || section.includes("jd") || questionTargets.includes("requirement") || questionTargets.includes("must-have")) {
    dims.add("DIM_7_ROLE_RELEVANCE");
  }

  // 5. Technical Fundamentals
  if (section.includes("fundamentals") || questionTargets.includes("cs fundamentals") || questionTargets.includes("memory") || questionTargets.includes("protocol")) {
    dims.add("DIM_1_TECH_FUNDAMENTALS");
  }

  // 6. Communication (all substantive verbal responses evaluate communication)
  if (turn.answer && turn.answer.trim().length >= 15) {
    dims.add("DIM_6_COMMUNICATION");
  }

  // Fallback default: if no explicit dimension matched, map to fundamentals
  if (dims.size === 0) {
    dims.add("DIM_1_TECH_FUNDAMENTALS");
  }

  return Array.from(dims);
}

/**
 * Converts rubric answer quality or numerical score into a normalized [0, 100] score
 */
export function normalizeTurnItemScore(turn: any): number {
  if (typeof turn.assessment?.rubric_score === "number") {
    return Math.max(0, Math.min(100, Math.round(turn.assessment.rubric_score)));
  }
  const quality = (turn.assessment?.answer_quality || "adequate").toLowerCase();
  switch (quality) {
    case "exceptional":
      return 95;
    case "strong":
      return 85;
    case "adequate":
      return 70;
    case "partial":
    case "partially_correct":
      return 55;
    case "shallow":
      return 40;
    case "vague":
      return 35;
    case "evasive":
    case "incorrect":
      return 20;
    case "declined":
    case "unanswered":
      return 0;
    default:
      return 65;
  }
}

/**
 * Computes the 7-dimension scorecard from session state with verbatim quote grounding
 */
export function computeSevenDimensionScorecard(
  sessionState: AdvancedSessionState,
  trackId: InterviewTrackId = "general_swe"
): {
  dimensionRecords: Record<CompetencyDimensionId, DimensionAssessmentRecord>;
  assessedDimensions: CompetencyDimensionId[];
  overallScore: number | null;
  overallScoreCalculation: string;
  assessmentStatus: AssessmentStatus;
  keyStrengths: string[];
  criticalGaps: string[];
  actionableStudyTracks: ActionableStudyTrack[];
} {
  const trackWeights = getTrackWeights(trackId);
  const turns = sessionState.turns || [];
  const codeSubmissions = (sessionState as any).codeSubmissions || [];

  // Group items by dimension
  const dimensionItems: Record<CompetencyDimensionId, Array<{ score: number; anchor?: VerbatimTranscriptAnchor }>> = {
    DIM_1_TECH_FUNDAMENTALS: [],
    DIM_2_PROBLEM_SOLVING: [],
    DIM_3_PRACTICAL_IMPL: [],
    DIM_4_SYSTEM_DESIGN: [],
    DIM_5_PROJECT_EXPERIENCE: [],
    DIM_6_COMMUNICATION: [],
    DIM_7_ROLE_RELEVANCE: [],
  };

  // 1. Process Turns
  for (const turn of turns) {
    const itemScore = normalizeTurnItemScore(turn);
    const assignedDims = classifyTurnDimensions(turn);
    const quote = extractVerbatimQuote(turn.answer || "");

    const anchor: VerbatimTranscriptAnchor | undefined = quote
      ? {
          turnIndex: turn.turnIndex || 1,
          stageId: (turn.question as any)?.stageId || turn.question?.section || "stage",
          questionExcerpt: (turn.question?.question || "").slice(0, 100),
          candidateQuote: quote,
          quoteHash: computeSha256(quote),
          demonstratedTopic: (turn.assessment?.topics_demonstrated || [])[0] || "Engineering Discussion",
          rubricScore: itemScore,
          evaluationNote: turn.assessment?.reasoning || "Evaluated response",
        }
      : undefined;

    for (const d of assignedDims) {
      dimensionItems[d].push({ score: itemScore, anchor });
    }
  }

  // 2. Process Code Submissions (Milestone 4)
  const codeAnchors: CodeSubmissionAnchor[] = [];
  for (const sub of codeSubmissions) {
    let subScore = 0;
    if (sub.verdict === "ACCEPTED") {
      subScore = sub.complexityPass ? 100 : 90;
    } else if (sub.verdict === "WRONG_ANSWER") {
      subScore = 40;
    } else if (sub.verdict === "TIME_LIMIT_EXCEEDED") {
      subScore = 50; // Functional logic worked but suboptimal complexity
    } else {
      subScore = 20;
    }

    const cAnchor: CodeSubmissionAnchor = {
      submissionId: sub.submissionId || `sub_${Date.now()}`,
      problemId: sub.problemId || "coding_problem",
      language: sub.language || "python",
      codeSha256: computeSha256(sub.code || ""),
      verdict: sub.verdict || "UNKNOWN",
      runtimeMs: sub.runtimeMs || 0,
      memoryKb: sub.memoryKb || 0,
      stressTestPassed: Boolean(sub.stressTestPassed),
      cheatSuspicionScore: sub.cheatSuspicionScore || 0,
      executionSource: sub.executionSource || "live_judge0",
    };

    codeAnchors.push(cAnchor);

    // Code submission informs Practical Implementation & Problem Solving
    dimensionItems.DIM_3_PRACTICAL_IMPL.push({ score: subScore });
    dimensionItems.DIM_2_PROBLEM_SOLVING.push({ score: subScore });
  }

  // 3. Compute Individual Dimension Records
  const dimensionRecords: Partial<Record<CompetencyDimensionId, DimensionAssessmentRecord>> = {};
  const assessedDimensions: CompetencyDimensionId[] = [];
  const keyStrengths: string[] = [];
  const criticalGaps: string[] = [];
  const actionableStudyTracks: ActionableStudyTrack[] = [];

  let weightedScoreSum = 0;
  let assessedWeightSum = 0;

  for (const dimKey of Object.keys(CANONICAL_DIMENSIONS) as CompetencyDimensionId[]) {
    const meta = CANONICAL_DIMENSIONS[dimKey];
    const weight = trackWeights[dimKey] ?? 0.15;
    const items = dimensionItems[dimKey];

    if (items.length === 0) {
      // Unassessed protection: strict score: null and NOT_ASSESSED status
      dimensionRecords[dimKey] = {
        dimensionId: dimKey,
        dimensionName: meta.name,
        status: "NOT_ASSESSED",
        score: null,
        weight,
        itemCount: 0,
        transcriptAnchors: [],
        codeSubmissionAnchors: dimKey === "DIM_3_PRACTICAL_IMPL" ? codeAnchors : undefined,
        strengths: [],
        growthAreas: [],
      };
      continue;
    }

    assessedDimensions.push(dimKey);
    const avgScore = Math.round(items.reduce((acc, curr) => acc + curr.score, 0) / items.length);
    weightedScoreSum += avgScore * weight;
    assessedWeightSum += weight;

    const anchors = items.filter(it => it.anchor !== undefined).map(it => it.anchor as VerbatimTranscriptAnchor);
    const status: DimensionStatus =
      avgScore >= 75 ? "DEMONSTRATED_COMPETENCY" :
      avgScore < 60 ? "DEMONSTRATED_WEAKNESS" : "INSUFFICIENT_EVIDENCE";

    const strengths: string[] = [];
    const growthAreas: string[] = [];

    if (avgScore >= 75) {
      strengths.push(`Solid demonstration of ${meta.name} (average score: ${avgScore}/100)`);
      keyStrengths.push(`${meta.name}: Demonstrated high proficiency`);
    } else if (avgScore < 70) {
      growthAreas.push(`Needs deeper practice in ${meta.name} (average score: ${avgScore}/100)`);
      criticalGaps.push(`${meta.name}: Knowledge gap or shallow implementation details`);
      actionableStudyTracks.push({
        dimensionId: dimKey,
        dimensionName: meta.name,
        priority: avgScore < 50 ? "HIGH" : "MEDIUM",
        recommendedAction: `Focus on ${meta.name} practice modules and interview walkthroughs`,
        suggestedModules: getSuggestedModulesForDimension(dimKey),
      });
    }

    dimensionRecords[dimKey] = {
      dimensionId: dimKey,
      dimensionName: meta.name,
      status,
      score: avgScore,
      weight,
      itemCount: items.length,
      transcriptAnchors: anchors,
      codeSubmissionAnchors: dimKey === "DIM_3_PRACTICAL_IMPL" && codeAnchors.length > 0 ? codeAnchors : undefined,
      strengths,
      growthAreas,
    };
  }

  // 4. Check Conduct Independence & Misconduct State
  const conductState = (sessionState as any).conductState || "NORMAL";
  const isTerminated = conductState === "TERMINATED";

  // 5. Dynamic Weight Re-normalization & Certified Coverage Check
  let overallScore: number | null = null;
  let overallScoreCalculation = "";
  let assessmentStatus: AssessmentStatus = "COMPLETED_CERTIFIED";

  // Requirements: At least 4 dimensions assessed AND >= 60% of track weight assessed
  const meetsCoverageThreshold = assessedDimensions.length >= 4 && assessedWeightSum >= 0.60;

  if (isTerminated) {
    assessmentStatus = "TERMINATED_MISCONDUCT";
    overallScore = null;
    overallScoreCalculation = "Interview terminated early due to critical behavioral misconduct.";
  } else if (!meetsCoverageThreshold) {
    assessmentStatus = "ASSESSMENT_INCOMPLETE";
    overallScore = null;
    overallScoreCalculation = `Incomplete assessment: only ${assessedDimensions.length}/7 dimensions evaluated (${Math.round(assessedWeightSum * 100)}% track coverage, minimum 60% required).`;
  } else {
    // Dynamic weight re-normalization strictly over assessed dimensions
    overallScore = Math.round(weightedScoreSum / assessedWeightSum);
    overallScoreCalculation = `Evaluated across ${assessedDimensions.length} dimensions with ${Math.round(assessedWeightSum * 100)}% track weight: sum(w_d * S_d) / sum(w_d) = ${overallScore}/100.`;
  }

  return {
    dimensionRecords: dimensionRecords as Record<CompetencyDimensionId, DimensionAssessmentRecord>,
    assessedDimensions,
    overallScore,
    overallScoreCalculation,
    assessmentStatus,
    keyStrengths,
    criticalGaps,
    actionableStudyTracks,
  };
}

function getSuggestedModulesForDimension(dim: CompetencyDimensionId): string[] {
  switch (dim) {
    case "DIM_1_TECH_FUNDAMENTALS":
      return ["OS & Concurrency Primitives", "Network Protocols (HTTP/TCP)", "Memory Models"];
    case "DIM_2_PROBLEM_SOLVING":
      return ["Dynamic Programming Patterns", "Graph Traversals & Topological Sort", "Time/Space Complexity Drills"];
    case "DIM_3_PRACTICAL_IMPL":
      return ["Milestone 4 Interactive Coding Arena", "Clean Refactoring & Defensive Checks", "Unit Test Design"];
    case "DIM_4_SYSTEM_DESIGN":
      return ["Distributed Caching & Invalidation", "Horizontal Partitioning & Sharding", "Fault Tolerance & Queues"];
    case "DIM_5_PROJECT_EXPERIENCE":
      return ["STAR Method Technical Articulation", "Architecture Trade-Off Defense", "Deep-Dive Project Walkthroughs"];
    case "DIM_6_COMMUNICATION":
      return ["Structured Technical Communication", "Thinking Aloud During Problem Solving", "Responding to Hint Probes"];
    case "DIM_7_ROLE_RELEVANCE":
      return ["Target JD Skill Gap Bridging", "Domain-Specific Best Practices", "Production Readiness Checklist"];
    default:
      return ["Core Engineering Curriculum"];
  }
}

// ══════════════════════════════════════════════════════════════
// 6. MASTER FINAL REPORT GENERATOR (Milestone 5)
// ══════════════════════════════════════════════════════════════

export async function generateMilestone5FinalReport(
  sessionState: AdvancedSessionState,
  trackId: InterviewTrackId = "general_swe"
): Promise<Milestone5FinalReport> {
  const sessionId = sessionState.sessionId || `session_${Date.now()}`;
  const candidateId = sessionState.candidateId || "candidate";
  const targetRole = sessionState.dossier?.targetRole || sessionState.blueprint?.targetRole || "Software Engineer";

  // 1. Compute 7-dimension scorecard
  const scorecard = computeSevenDimensionScorecard(sessionState, trackId);

  // 2. Synthesize code submissions
  const codeSubmissions: any[] = (sessionState as any).codeSubmissions || [];
  const codingAnchors: CodeSubmissionAnchor[] = codeSubmissions.map(sub => ({
    submissionId: sub.submissionId || `sub_${Date.now()}`,
    problemId: sub.problemId || "canonical_problem",
    language: sub.language || "python",
    codeSha256: computeSha256(sub.code || ""),
    verdict: sub.verdict || "UNKNOWN",
    runtimeMs: sub.runtimeMs || 0,
    memoryKb: sub.memoryKb || 0,
    stressTestPassed: Boolean(sub.stressTestPassed),
    cheatSuspicionScore: sub.cheatSuspicionScore || 0,
    executionSource: sub.executionSource || "live_judge0",
  }));

  const hasCoding = codingAnchors.length > 0;
  const optimalPassed = codingAnchors.some(a => a.verdict === "ACCEPTED" && a.stressTestPassed);

  // 3. Conduct scorecard
  const conductState = (sessionState as any).conductState || "NORMAL";
  const conductIncidents: ConductIncident[] = (sessionState as any).conductIncidents || [];
  const conductRecord: ConductScorecardRecord = {
    currentConductState: conductState,
    totalInfractions: conductIncidents.length,
    incidentLog: conductIncidents,
    isTerminatedForMisconduct: conductState === "TERMINATED",
    behavioralImpactSummary:
      conductState === "TERMINATED"
        ? "Interview terminated early due to critical behavioral misconduct."
        : conductIncidents.length > 0
        ? `Candidate received ${conductIncidents.length} behavioral warning(s); technical evaluation remains independent.`
        : "Clean behavioral record throughout the interview.",
  };

  // 4. Executive Summary
  let executiveSummary = "";
  if (scorecard.assessmentStatus === "TERMINATED_MISCONDUCT") {
    executiveSummary = `The interview was halted early under Cognalyze Conduct Policy due to severe or persistent behavioral misconduct. Technical evaluation was suspended.`;
  } else if (scorecard.assessmentStatus === "ASSESSMENT_INCOMPLETE") {
    executiveSummary = `The candidate completed an abbreviated session covering ${scorecard.assessedDimensions.length} of 7 dimensions. Insufficient evidence was gathered to certify an overall competency score.`;
  } else {
    executiveSummary = `Candidate demonstrated overall certified proficiency of ${scorecard.overallScore}/100 across ${scorecard.assessedDimensions.length} technical dimensions for the ${targetRole} role. ${
      scorecard.keyStrengths.length > 0 ? `Key strengths identified: ${scorecard.keyStrengths.slice(0, 2).join("; ")}.` : ""
    } ${
      scorecard.criticalGaps.length > 0 ? `Primary growth areas: ${scorecard.criticalGaps.slice(0, 2).join("; ")}.` : ""
    }`;
  }

  const reportId = `rep_m5_${computeSha256(`${sessionId}_${candidateId}_${Date.now()}`).slice(0, 16)}`;
  const now = new Date().toISOString();

  const report: Milestone5FinalReport = {
    reportId,
    sessionId,
    candidateId,
    targetRole,
    trackId,
    assessmentStatus: scorecard.assessmentStatus,
    overallScore: scorecard.overallScore,
    overallScoreCalculation: scorecard.overallScoreCalculation,
    confidence: scorecard.assessedDimensions.length >= 6 ? 0.95 : scorecard.assessedDimensions.length >= 4 ? 0.80 : 0.40,
    executiveSummary,
    dimensionScores: scorecard.dimensionRecords,
    codingEvaluation: {
      hasCodingSubmission: hasCoding,
      submissionsCount: codingAnchors.length,
      highestVerdict: codingAnchors[0]?.verdict,
      optimalComplexityDemonstrated: optimalPassed,
      submissions: codingAnchors,
    },
    conductScorecard: conductRecord,
    keyStrengths: scorecard.keyStrengths,
    criticalGaps: scorecard.criticalGaps,
    actionableStudyTracks: scorecard.actionableStudyTracks,
    dnaSyncStatus: "PENDING",
    generatedAt: now,
    metadata: {
      version: "2.0.0",
      synthesizer: "deterministic_rubric_fallback",
      hash: computeSha256(`${reportId}_${sessionId}_${scorecard.overallScore}`),
    },
  };

  return report;
}
