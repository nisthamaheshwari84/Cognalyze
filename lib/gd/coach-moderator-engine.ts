/**
 * COGNALYZE GROUP DISCUSSION — ACTIVE GD COACH & MODERATION ENGINE
 * 
 * Implements proactive discussion governance:
 * - Stage Transition Management (Briefing -> Opening -> Active -> Challenge -> Synthesis -> Conclusion)
 * - Turn Dominance & Floor Monopolization Detection
 * - Interruption Arbitrament & Disciplinary Warning Escalation
 * - Stagnation Detection & Probing Question Injection
 * - Quiet Candidate Engagement & Equal Floor Opportunity
 * - Structured Time Management
 */

import {
  GDDiscussionStage,
  GDParticipantState,
  GDTranscriptItem,
  GDModerationIncident,
  GDSimulationFormat,
  GDDifficultyLevel
} from "./types";
import { evaluateUtteranceForMisconduct, issueDisciplinaryAction } from "./disciplinary-system";

export interface CoachInterventionDecision {
  shouldIntervene: boolean;
  type: 
    | "NONE"
    | "STAGE_TRANSITION"
    | "POLITE_NUDGE"
    | "DISCIPLINARY_WARNING"
    | "FLOOR_REDIRECTION"
    | "PROBING_QUESTION"
    | "DYNAMIC_CHALLENGE"
    | "INVITE_QUIET_PARTICIPANT"
    | "TIME_WARNING";
  moderatorUtterance?: string;
  targetParticipantId?: string;
  targetParticipantName?: string;
  suggestedNextSpeakerId?: string;
  newStage?: GDDiscussionStage;
  incident?: GDModerationIncident;
}

/**
 * Determine if and how the Coach should proactively intervene in the Group Discussion.
 */
export async function evaluateCoachIntervention(params: {
  sessionId: string;
  topicTitle: string;
  format: GDSimulationFormat;
  difficulty: GDDifficultyLevel;
  currentStage: GDDiscussionStage;
  secondsElapsed: number;
  totalDurationSeconds: number;
  participants: GDParticipantState[];
  transcripts: GDTranscriptItem[];
  studentUserId?: string;
  studentName?: string;
  isFriendsRoom?: boolean;
  roomCode?: string;
}): Promise<CoachInterventionDecision> {
  const {
    sessionId,
    topicTitle,
    format,
    difficulty,
    currentStage,
    secondsElapsed,
    totalDurationSeconds,
    participants,
    transcripts,
    studentUserId,
    studentName = "You",
    isFriendsRoom = false,
    roomCode
  } = params;

  const timeRemainingSeconds = Math.max(0, totalDurationSeconds - secondsElapsed);
  const totalTurns = transcripts.length;
  const lastTurn = transcripts[transcripts.length - 1];

  // 1. TIME-BASED STAGE TRANSITIONS
  // Stage 1: Briefing (0 - 30s) -> Opening
  if (currentStage === "briefing" && secondsElapsed >= 25) {
    return {
      shouldIntervene: true,
      type: "STAGE_TRANSITION",
      newStage: "opening",
      moderatorUtterance: `The briefing is complete. The floor is now open for initial framing on "${topicTitle}". Who would like to initiate with a structured opening perspective?`
    };
  }

  // Stage 2: Opening -> Active Discussion (approx 20% of time)
  if (currentStage === "opening" && (secondsElapsed >= totalDurationSeconds * 0.20 || totalTurns >= 4)) {
    return {
      shouldIntervene: true,
      type: "STAGE_TRANSITION",
      newStage: "active_discussion",
      moderatorUtterance: `We have our opening perspectives on the table. Let us move into active cross-examination of the architectural and business trade-offs. Feel free to challenge and build on each other's points.`
    };
  }

  // Stage 3: Active Discussion -> Dynamic Challenge (approx 50% mark)
  if (currentStage === "active_discussion" && secondsElapsed >= totalDurationSeconds * 0.50 && secondsElapsed < totalDurationSeconds * 0.55) {
    const challengePrompts: Record<GDSimulationFormat, string> = {
      technical_business: `Let us introduce an unexpected production constraint: What happens if latency SLAs degrade by 5x during a high-concurrency burst, or our third-party infrastructure experiences an outage? How does the group adapt the proposed architecture?`,
      competitive: `The panel has heard theoretical arguments, but how do we justify the Capex cost and ROI when upper management demands a 40% efficiency improvement within the first quarter?`,
      corporate: `Let us stress-test this strategy against regulatory compliance and data privacy requirements. If state audits mandate full provenance, does our solution survive?`,
      collaborative: `We are seeing a divergence between delivery velocity and operational reliability. How can the team synthesize these two competing objectives into a unified roadmap?`
    };

    return {
      shouldIntervene: true,
      type: "DYNAMIC_CHALLENGE",
      newStage: "dynamic_challenge",
      moderatorUtterance: challengePrompts[format] || `Let's introduce a critical operational constraint to test our model under real-world pressure.`
    };
  }

  // Stage 4: Dynamic Challenge -> Synthesis (approx 75% mark)
  if ((currentStage === "active_discussion" || currentStage === "dynamic_challenge") && secondsElapsed >= totalDurationSeconds * 0.75) {
    return {
      shouldIntervene: true,
      type: "STAGE_TRANSITION",
      newStage: "synthesis",
      moderatorUtterance: `We are entering the final quarter of our discussion. Rather than introducing new arguments, I would like the group to focus on synthesis. What common ground and strategic consensus have we built?`
    };
  }

  // Stage 5: Synthesis -> Conclusion (approx 90% mark)
  if (currentStage === "synthesis" && secondsElapsed >= totalDurationSeconds * 0.90) {
    return {
      shouldIntervene: true,
      type: "STAGE_TRANSITION",
      newStage: "conclusion",
      moderatorUtterance: `We have less than two minutes remaining. Let us begin concluding remarks. I invite candidates to provide their final 30-second summary recommendations.`
    };
  }

  // 2. CONDUCT & MISCONDUCT EVALUATION (Last turn analysis)
  if (lastTurn && lastTurn.content) {
    const isCandidate = lastTurn.isHuman;
    const speakerHistory = transcripts.slice(-5).map(t => ({
      speakerName: t.speakerName,
      text: t.content,
      timestamp: t.timestamp
    }));

    const speakerTurns = transcripts.filter(t => t.speakerId === lastTurn.speakerId).length;
    const speakerRatio = totalTurns > 0 ? speakerTurns / totalTurns : 0;

    const evaluation = evaluateUtteranceForMisconduct({
      speakerName: lastTurn.speakerName,
      text: lastTurn.content,
      recentSpeakerHistory: speakerHistory,
      isInterruption: Boolean(lastTurn.isInterruption),
      participantSpeakingRatio: speakerRatio
    });

    if (evaluation.isViolation) {
      if (isCandidate && studentUserId) {
        // Human candidate triggered violation: execute 3-warning disciplinary policy!
        const result = await issueDisciplinaryAction({
          userId: studentUserId,
          userName: studentName,
          sessionId,
          isFriendsRoom,
          roomCode,
          violationCategory: evaluation.category || "DISRESPECTFUL_LANGUAGE",
          evidenceQuote: lastTurn.content,
          contextSummary: `Violation in stage "${currentStage}" on topic "${topicTitle}"`,
          customSuspensionHours: 72
        });

        return {
          shouldIntervene: true,
          type: "DISCIPLINARY_WARNING",
          moderatorUtterance: result.moderatorUtterance,
          targetParticipantId: lastTurn.speakerId,
          targetParticipantName: lastTurn.speakerName,
          incident: {
            id: result.disciplinaryRecord.id,
            timestamp: Date.now(),
            participantId: lastTurn.speakerId,
            participantName: lastTurn.speakerName,
            isHuman: true,
            violationCategory: evaluation.category || "DISRESPECTFUL_LANGUAGE",
            severity: result.severity,
            evidenceQuote: lastTurn.content,
            moderatorUtterance: result.moderatorUtterance,
            disciplinaryActionTaken: result.isSuspended ? "account_suspended" : "warning_logged",
            suspensionDurationHours: result.isSuspended ? 72 : undefined,
            suspensionExpiresAt: result.suspensionExpiresAt,
            resolved: false
          }
        };
      } else {
        // AI peer violated conduct (e.g. Dominant Speaker being overly aggressive)
        return {
          shouldIntervene: true,
          type: "POLITE_NUDGE",
          moderatorUtterance: `${lastTurn.speakerName}: Let's keep our remarks professional and objective. Focus on the systemic data rather than dismissive language.`,
          targetParticipantId: lastTurn.speakerId,
          targetParticipantName: lastTurn.speakerName
        };
      }
    }
  }

  // 3. FLOOR DOMINANCE ARBITRATION
  // If the last 3 consecutive turns were by the same speaker
  if (transcripts.length >= 3) {
    const last3 = transcripts.slice(-3);
    if (last3.every(t => t.speakerId === last3[0].speakerId)) {
      const dominantName = last3[0].speakerName;
      // Find a quiet candidate to invite
      const quietPeer = participants.find(p => p.id !== last3[0].speakerId && p.speakingTurnCount <= 1);
      return {
        shouldIntervene: true,
        type: "FLOOR_REDIRECTION",
        moderatorUtterance: `${dominantName}, you have shared several points in succession. Let us ensure everyone has an opportunity. ${quietPeer ? `${quietPeer.name}, what is your take on this?` : "I'd like to hear another perspective from the group."}`,
        suggestedNextSpeakerId: quietPeer?.id
      };
    }
  }

  // 4. QUIET CANDIDATE ENGAGEMENT (Candidate hasn't spoken in > 90 seconds or > 4 turns)
  const candidateTurns = transcripts.filter(t => t.isHuman);
  const candidateSpokeRecently = transcripts.slice(-4).some(t => t.isHuman);

  if (
    !candidateSpokeRecently &&
    candidateTurns.length < 2 &&
    secondsElapsed > 75 &&
    (currentStage === "active_discussion" || currentStage === "dynamic_challenge")
  ) {
    return {
      shouldIntervene: true,
      type: "INVITE_QUIET_PARTICIPANT",
      moderatorUtterance: `${studentName}, we would value your evaluation on the trade-offs currently under discussion. How do you assess the arguments made by the panel?`
    };
  }

  // 5. STAGNATION DETECTION (Group circling same argument)
  if (transcripts.length >= 6) {
    const last6Contents = transcripts.slice(-6).map(t => t.content.toLowerCase()).join(" ");
    const latencyCount = (last6Contents.match(/latency|speed|fast/g) || []).length;
    if (latencyCount >= 6) {
      return {
        shouldIntervene: true,
        type: "PROBING_QUESTION",
        moderatorUtterance: `The group has thoroughly explored latency and response times. Let us pivot: What are the security, data consistency, and developer operational costs of this approach?`
      };
    }
  }

  return { shouldIntervene: false, type: "NONE" };
}
