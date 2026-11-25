/**
 * COGNALYZE GD ARENA — BIDIRECTIONAL STUDENT DNA SYNC ENGINE (PHASE 7)
 *
 * Syncs verified Group Discussion outcomes into the student's Student DNA
 * evidence graph without ever inventing claims on zero-turn silent sessions.
 */

import { GDComprehensiveReport } from "./types";
import { addStudentEvidenceRecord, invalidateUserDNAScope } from "@/lib/dna/store";
import { invalidateStudentDNACache } from "@/lib/ai/student-dna";

export interface GDDNASyncResult {
  synced: boolean;
  reason?: string;
  recordedEvidenceIds: string[];
}

export async function syncGDReportToStudentDNAAsync(params: {
  userId: string;
  report: GDComprehensiveReport;
}): Promise<GDDNASyncResult> {
  const { userId, report } = params;

  if (!userId || report.speakingTimeAnalysis.studentTurnCount === 0) {
    return {
      synced: false,
      reason: "insufficient_evidence",
      recordedEvidenceIds: []
    };
  }

  const normalizedScore = Math.max(0, Math.min(100, Math.round(report.overallScore)));
  const strength = Number((0.45 + (normalizedScore / 100) * 0.5).toFixed(2));
  const recordedIds: string[] = [];

  const primaryEvidence = await addStudentEvidenceRecord(userId, {
    userId,
    sourceType: "assessment",
    sourceId: report.sessionId,
    skillRaw: "communication",
    evidenceType: "gd_session_evaluation",
    claim: `Completed verified GD session "${report.topicTitle}" (${report.format}, ${report.difficulty}) scoring ${normalizedScore}/100 (${report.hiringVerdict}) across ${report.speakingTimeAnalysis.studentTurnCount} spoken turns.`,
    extractedValue: {
      score: normalizedScore,
      verdictSummary: report.verdictSummary
    },
    strength,
    trustedServerVerified: true,
    metadata: {
      score: normalizedScore,
      module: "gd_arena",
      sessionId: report.sessionId,
      topicTitle: report.topicTitle,
      hiringVerdict: report.hiringVerdict,
      turnCount: report.speakingTimeAnalysis.studentTurnCount
    }
  });

  if (primaryEvidence.success && primaryEvidence.evidence?.id) {
    recordedIds.push(primaryEvidence.evidence.id);
  }

  // Record leadership / ownership signal when initiative score is >= 70
  const leadershipDim = report.dimensions.find((d) => d.dimension === "leadership");
  if (leadershipDim && leadershipDim.score >= 70 && leadershipDim.verdict !== "insufficient_evidence") {
    const dimStrength = Number((0.45 + (leadershipDim.score / 100) * 0.5).toFixed(2));
    const secondaryEvidence = await addStudentEvidenceRecord(userId, {
      userId,
      sourceType: "assessment",
      sourceId: `${report.sessionId}_leadership`,
      skillRaw: "leadership_ownership",
      evidenceType: "gd_leadership_evaluation",
      claim: `Demonstrated ${leadershipDim.label} (${leadershipDim.score}/100) during GD debate on "${report.topicTitle}".`,
      extractedValue: {
        score: leadershipDim.score,
        feedback: leadershipDim.feedback
      },
      strength: dimStrength,
      trustedServerVerified: true,
      metadata: {
        score: leadershipDim.score,
        module: "gd_arena_dimension",
        dimension: leadershipDim.dimension,
        sessionId: report.sessionId
      }
    });

    if (secondaryEvidence.success && secondaryEvidence.evidence?.id) {
      recordedIds.push(secondaryEvidence.evidence.id);
    }
  }

  invalidateUserDNAScope(userId);
  invalidateStudentDNACache(userId);

  return {
    synced: recordedIds.length > 0,
    recordedEvidenceIds: recordedIds
  };
}
