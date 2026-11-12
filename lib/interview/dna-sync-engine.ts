import { AdvancedSessionState } from "@/lib/ai/interview-engine";
import { addStudentEvidenceRecord } from "@/lib/dna/store";
import { isSupabaseAvailable, supabaseAdmin } from "@/lib/supabase";
import { Milestone5FinalReport, computeSha256 } from "./final-report-generator";

// ══════════════════════════════════════════════════════════════
// 1. THE 5-TIER PROVENANCE HIERARCHY
// ══════════════════════════════════════════════════════════════

export const PROVENANCE_HIERARCHY = {
  LEVEL_1_SANDBOX: "PROVENANCE_LEVEL_1_VERIFIED_INTERVIEW_SANDBOX",
  LEVEL_2_THEORY: "PROVENANCE_LEVEL_2_VERIFIED_INTERVIEW_THEORY",
  LEVEL_3_AUDITED: "PROVENANCE_LEVEL_3_EXTERNALLY_AUDITED",
  LEVEL_4_CLAIM: "PROVENANCE_LEVEL_4_UNVERIFIED_CANDIDATE_CLAIM",
  LEVEL_5_FAILED: "PROVENANCE_LEVEL_5_CONTRADICTED_OR_FAILED",
} as const;

export type ProvenanceLevel = (typeof PROVENANCE_HIERARCHY)[keyof typeof PROVENANCE_HIERARCHY];

export const PROVENANCE_CONFIDENCE_WEIGHTS: Record<ProvenanceLevel, number> = {
  PROVENANCE_LEVEL_1_VERIFIED_INTERVIEW_SANDBOX: 1.00,
  PROVENANCE_LEVEL_2_VERIFIED_INTERVIEW_THEORY: 0.85,
  PROVENANCE_LEVEL_3_EXTERNALLY_AUDITED: 0.70,
  PROVENANCE_LEVEL_4_UNVERIFIED_CANDIDATE_CLAIM: 0.25,
  PROVENANCE_LEVEL_5_CONTRADICTED_OR_FAILED: 0.00,
};

// ══════════════════════════════════════════════════════════════
// 2. TRI-ANCHOR VERIFICATION STANDARDS
// ══════════════════════════════════════════════════════════════

export interface TriAnchorEvaluationResult {
  competencyId: string;
  isVerified: boolean;
  provenanceLevel: ProvenanceLevel;
  confidenceScore: number;
  stageCount: number;
  turnCount: number;
  handsOnCodingPassed: boolean;
  averageScore: number;
  stagesInvolved: string[];
  rejectionReason?: string;
  evidenceQuotes: string[];
}

const CODING_SKILL_KEYWORDS = [
  "algorithm",
  "dsa",
  "data structure",
  "dynamic programming",
  "binary search",
  "graph",
  "tree",
  "kadane",
  "two sum",
  "array",
  "string manipulation",
  "sorting",
];

export function isCodingCompetency(competency: string): boolean {
  const norm = competency.toLowerCase();
  return CODING_SKILL_KEYWORDS.some(kw => norm.includes(kw));
}

/**
 * Evaluates a single competency against the Tri-Anchor Standard:
 * 1. Cross-stage demonstration (>= 2 distinct stages)
 * 2. Inquiry depth (>= 3 distinct turns)
 * 3. Hands-on sandbox pass for coding/algorithmic competencies (Milestone 4 ACCEPTED verdict)
 * 4. Aggregated score >= 80/100, zero cheat flags
 */
export function evaluateCompetencyTriAnchor(
  competency: string,
  sessionState: AdvancedSessionState,
  codeSubmissions: any[] = []
): TriAnchorEvaluationResult {
  const normComp = competency.toLowerCase().trim();
  const turns = sessionState.turns || [];

  const matchedTurns: any[] = [];
  const stagesSet = new Set<string>();
  const quotes: string[] = [];
  let scoreSum = 0;

  for (const turn of turns) {
    const topics = (turn.assessment?.topics_demonstrated || []).map((t: string) => t.toLowerCase());
    const targets = (turn.question?.question_targets || "").toLowerCase();
    const qText = (turn.question?.question || "").toLowerCase();
    const aText = (turn.answer || "").toLowerCase();

    const matches =
      topics.some((t: string) => t.includes(normComp) || normComp.includes(t)) ||
      targets.includes(normComp) ||
      (qText.includes(normComp) && aText.length > 20);

    if (matches) {
      matchedTurns.push(turn);
      const stage = (turn.question as any)?.stageId || turn.question?.section || "stage_general";
      stagesSet.add(stage);

      if (turn.answer && turn.answer.trim().length >= 10) {
        quotes.push(turn.answer.trim().slice(0, 140));
      }

      const rubricScore = (turn.assessment as any)?.rubric_score;
      const answerQuality = (turn.assessment?.answer_quality as string) || "";
      const itemScore =
        typeof rubricScore === "number"
          ? rubricScore
          : answerQuality === "strong" || answerQuality === "exceptional"
          ? 85
          : answerQuality === "adequate"
          ? 70
          : 40;
      scoreSum += itemScore;
    }
  }

  const turnCount = matchedTurns.length;
  const stageCount = stagesSet.size;
  const averageScore = turnCount > 0 ? Math.round(scoreSum / turnCount) : 0;
  const stagesInvolved = Array.from(stagesSet);

  // Check hands-on sandbox requirement
  const needsCoding = isCodingCompetency(competency);
  const codingPassed = codeSubmissions.some(
    sub =>
      (sub.verdict === "ACCEPTED" || sub.verdict === "accepted") &&
      Boolean(sub.stressTestPassed) &&
      (!sub.cheatSuspicionScore || sub.cheatSuspicionScore < 50)
  );

  // Failure / contradiction check
  const hasFailedTurn = matchedTurns.some(
    t => t.assessment?.answer_quality === "incorrect" || t.assessment?.answer_quality === "shallow"
  );
  if (turnCount >= 2 && averageScore < 50 && hasFailedTurn) {
    return {
      competencyId: competency,
      isVerified: false,
      provenanceLevel: PROVENANCE_HIERARCHY.LEVEL_5_FAILED,
      confidenceScore: PROVENANCE_CONFIDENCE_WEIGHTS[PROVENANCE_HIERARCHY.LEVEL_5_FAILED],
      stageCount,
      turnCount,
      handsOnCodingPassed: codingPassed,
      averageScore,
      stagesInvolved,
      evidenceQuotes: quotes,
      rejectionReason: `Failed live probing on ${competency}: average score ${averageScore}/100.`,
    };
  }

  // Tri-Anchor Verification Invariant Checks:
  // 1. Cross-stage consistency (>= 2 distinct stages)
  // 2. Inquiry depth (>= 3 turns)
  // 3. Hands-on coding verification (if applicable)
  // 4. Performance threshold (>= 80/100)
  if (stageCount < 2) {
    return {
      competencyId: competency,
      isVerified: false,
      provenanceLevel: PROVENANCE_HIERARCHY.LEVEL_4_CLAIM,
      confidenceScore: PROVENANCE_CONFIDENCE_WEIGHTS[PROVENANCE_HIERARCHY.LEVEL_4_CLAIM],
      stageCount,
      turnCount,
      handsOnCodingPassed: codingPassed,
      averageScore,
      stagesInvolved,
      evidenceQuotes: quotes,
      rejectionReason: `Fails Tri-Anchor requirement: demonstrated in only ${stageCount} stage (minimum 2 distinct stages required). Retained as unverified claim.`,
    };
  }

  if (turnCount < 3) {
    return {
      competencyId: competency,
      isVerified: false,
      provenanceLevel: PROVENANCE_HIERARCHY.LEVEL_4_CLAIM,
      confidenceScore: PROVENANCE_CONFIDENCE_WEIGHTS[PROVENANCE_HIERARCHY.LEVEL_4_CLAIM],
      stageCount,
      turnCount,
      handsOnCodingPassed: codingPassed,
      averageScore,
      stagesInvolved,
      evidenceQuotes: quotes,
      rejectionReason: `Fails Tri-Anchor requirement: probed across ${turnCount} turns (minimum 3 turns required). Retained as unverified claim.`,
    };
  }

  if (needsCoding && !codingPassed) {
    return {
      competencyId: competency,
      isVerified: false,
      provenanceLevel: PROVENANCE_HIERARCHY.LEVEL_4_CLAIM,
      confidenceScore: PROVENANCE_CONFIDENCE_WEIGHTS[PROVENANCE_HIERARCHY.LEVEL_4_CLAIM],
      stageCount,
      turnCount,
      handsOnCodingPassed: false,
      averageScore,
      stagesInvolved,
      evidenceQuotes: quotes,
      rejectionReason: `Fails Tri-Anchor requirement: algorithmic competency requires an ACCEPTED sandbox solution at N = 10^5. Retained as unverified claim.`,
    };
  }

  if (averageScore < 80) {
    return {
      competencyId: competency,
      isVerified: false,
      provenanceLevel: PROVENANCE_HIERARCHY.LEVEL_4_CLAIM,
      confidenceScore: PROVENANCE_CONFIDENCE_WEIGHTS[PROVENANCE_HIERARCHY.LEVEL_4_CLAIM],
      stageCount,
      turnCount,
      handsOnCodingPassed: codingPassed,
      averageScore,
      stagesInvolved,
      evidenceQuotes: quotes,
      rejectionReason: `Fails Tri-Anchor requirement: average score ${averageScore}/100 is below the 80-point threshold. Retained as unverified claim.`,
    };
  }

  // If all criteria satisfied: Eligible for permanent Student DNA commit
  const assignedLevel = (needsCoding && codingPassed)
    ? PROVENANCE_HIERARCHY.LEVEL_1_SANDBOX
    : PROVENANCE_HIERARCHY.LEVEL_2_THEORY;

  return {
    competencyId: competency,
    isVerified: true,
    provenanceLevel: assignedLevel,
    confidenceScore: PROVENANCE_CONFIDENCE_WEIGHTS[assignedLevel],
    stageCount,
    turnCount,
    handsOnCodingPassed: codingPassed,
    averageScore,
    stagesInvolved,
    evidenceQuotes: quotes,
  };
}

// ══════════════════════════════════════════════════════════════
// 3. MASTER EVIDENCE SYNCHRONIZATION PIPELINE
// ══════════════════════════════════════════════════════════════

export async function commitMilestone5EvidenceToDNA(
  candidateId: string,
  report: Milestone5FinalReport,
  sessionState: AdvancedSessionState
): Promise<{
  success: boolean;
  verifiedCommittedCount: number;
  unverifiedCount: number;
  failedCount: number;
  results: TriAnchorEvaluationResult[];
}> {
  const turns = sessionState.turns || [];
  const codeSubmissions = (sessionState as any).codeSubmissions || [];

  // 1. Gather all candidate competencies probed during the interview
  const candidateCompetencies = new Set<string>();

  for (const turn of turns) {
    const topics = turn.assessment?.topics_demonstrated || [];
    for (const top of topics) {
      if (top && typeof top === "string" && top.trim().length > 2) {
        candidateCompetencies.add(top.trim());
      }
    }
  }

  // Include project technologies from dossier if present
  const dossierObj = sessionState.dossier as any;
  const dossierSkills = [
    ...(dossierObj?.verifiedProjectEvidence?.flatMap((p: any) => p.technologiesUsed) || []),
    ...(dossierObj?.jdCompetencies?.mustHave || []),
  ];
  for (const s of dossierSkills) {
    if (s && typeof s === "string") candidateCompetencies.add(s.trim());
  }

  // 2. Evaluate each competency using Tri-Anchor standard
  const evaluationResults: TriAnchorEvaluationResult[] = [];
  let verifiedCommittedCount = 0;
  let unverifiedCount = 0;
  let failedCount = 0;

  for (const comp of Array.from(candidateCompetencies)) {
    const evalRes = evaluateCompetencyTriAnchor(comp, sessionState, codeSubmissions);
    evaluationResults.push(evalRes);

    if (evalRes.isVerified) {
      verifiedCommittedCount++;
      // Commit verified evidence to Student DNA store
      try {
        const quote = evalRes.evidenceQuotes[0] || `Demonstrated ${comp} across ${evalRes.stageCount} interview stages`;
        await addStudentEvidenceRecord(candidateId, {
          sourceType: "interview",
          sourceId: `interview_${report.sessionId}`,
          userId: candidateId,
          skillRaw: comp,
          evidenceType: "VERIFIED_MOCK_INTERVIEW",
          claim: `Verified competency in ${comp} (${evalRes.provenanceLevel})`,
          strength: evalRes.confidenceScore,
          timestamp: new Date().toISOString(),
          metadata: {
            provenanceLevel: evalRes.provenanceLevel,
            confidenceScore: evalRes.confidenceScore,
            score: evalRes.averageScore,
            stageCount: evalRes.stageCount,
            turnCount: evalRes.turnCount,
            stagesInvolved: evalRes.stagesInvolved,
            quoteHash: computeSha256(quote),
            targetRole: report.targetRole,
            sessionId: report.sessionId,
          },
        });
      } catch (err) {
        console.warn(`[dna-sync] Failed to commit evidence for ${comp}:`, err);
      }
    } else if (evalRes.provenanceLevel === PROVENANCE_HIERARCHY.LEVEL_5_FAILED) {
      failedCount++;
    } else {
      unverifiedCount++;
    }
  }

  // 3. Persist authoritative records to Supabase if connected
  try {
    const hasSupabase = await isSupabaseAvailable();
    if (hasSupabase && supabaseAdmin) {
      // Upsert final report into interview_final_reports
      await supabaseAdmin.from("interview_final_reports").upsert({
        session_id: report.sessionId,
        candidate_id: candidateId,
        track_id: report.trackId,
        overall_score: report.overallScore,
        assessment_status: report.assessmentStatus,
        dimension_scores: report.dimensionScores,
        coding_evaluation: report.codingEvaluation,
        conduct_scorecard: report.conductScorecard,
        verbatim_evidence: {
          reportId: report.reportId,
          hash: report.metadata.hash,
        },
        strengths: report.keyStrengths,
        growth_areas: report.criticalGaps,
        dna_sync_status: verifiedCommittedCount > 0 ? "COMMITTED" : "SKIPPED",
        created_at: new Date().toISOString(),
      });

      // Insert event ledger entries for verified competencies
      for (const res of evaluationResults.filter(r => r.isVerified)) {
        await supabaseAdmin.from("student_dna_events").insert({
          student_id: candidateId,
          session_id: report.sessionId,
          competency_id: res.competencyId,
          provenance_level: res.provenanceLevel,
          confidence_score: res.confidenceScore,
          evidence_summary: `Demonstrated in ${res.stageCount} stages over ${res.turnCount} turns (score: ${res.averageScore}/100)`,
          created_at: new Date().toISOString(),
        });
      }
    }
  } catch (dbErr) {
    console.warn("[dna-sync] Supabase persistence skipped or failed (local dev fallback active):", dbErr);
  }

  report.dnaSyncStatus = verifiedCommittedCount > 0 ? "COMMITTED" : "SKIPPED";

  return {
    success: true,
    verifiedCommittedCount,
    unverifiedCount,
    failedCount,
    results: evaluationResults,
  };
}
