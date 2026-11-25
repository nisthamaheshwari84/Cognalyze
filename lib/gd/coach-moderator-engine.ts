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
  GDDifficultyLevel,
  GDExperienceBlueprint
} from "./types";
import { evaluateUtteranceForMisconduct, issueDisciplinaryAction } from "./disciplinary-system";
import { generateDynamicScenarioTwistAsync } from "./experience-engine";

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
  twistLabel?: string;
}

/**
 * Topic-agnostic semantic stagnation detector: catches circular repetition
 * across recent turns (any domain: HR, Ethics, FinTech, Strategy, Systems).
 */
export function detectConversationalStagnation(transcripts: GDTranscriptItem[]): {
  stagnant: boolean;
  repeatedTerms: string[];
} {
  if (transcripts.length < 5) {
    return { stagnant: false, repeatedTerms: [] };
  }

  const stopWords = new Set([
    "the", "and", "that", "this", "with", "from", "they", "have", "must", "would",
    "could", "should", "about", "their", "there", "which", "while", "where", "being",
    "because", "point", "agree", "disagree", "think", "believe", "group", "panel"
  ]);

  const recentNonCoach = transcripts.filter((t) => !t.speakerId.includes("moderator")).slice(-3);
  if (recentNonCoach.length < 3) {
    return { stagnant: false, repeatedTerms: [] };
  }

  const tokenSets = recentNonCoach.map((t) => {
    const tokens = t.content
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopWords.has(w));
    return new Set(tokens);
  });

  // Measure average pairwise Jaccard similarity across recent turns
  let pairCount = 0;
  let totalSim = 0;
  const termFreq = new Map<string, number>();

  for (const s of tokenSets) {
    for (const w of s) {
      termFreq.set(w, (termFreq.get(w) || 0) + 1);
    }
  }

  for (let i = 0; i < tokenSets.length; i++) {
    for (let j = i + 1; j < tokenSets.length; j++) {
      let inter = 0;
      for (const w of tokenSets[i]) {
        if (tokenSets[j].has(w)) inter++;
      }
      const union = new Set([...tokenSets[i], ...tokenSets[j]]).size;
      if (union > 0) {
        totalSim += inter / union;
        pairCount++;
      }
    }
  }

  const avgSim = pairCount > 0 ? totalSim / pairCount : 0;
  const dominantTerms = Array.from(termFreq.entries())
    .filter(([, count]) => count >= recentNonCoach.length)
    .map(([word]) => word)
    .slice(0, 3);

  return {
    stagnant: avgSim >= 0.36 || dominantTerms.length >= 2,
    repeatedTerms: dominantTerms
  };
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
  experienceBlueprint?: GDExperienceBlueprint;
}): Promise<CoachInterventionDecision> {
  const {
    sessionId,
    topicTitle,
    format,
    currentStage,
    secondsElapsed,
    totalDurationSeconds,
    participants,
    transcripts,
    studentUserId,
    studentName = "You",
    isFriendsRoom = false,
    roomCode,
    experienceBlueprint
  } = params;

  const timeRemainingSeconds = Math.max(0, totalDurationSeconds - secondsElapsed);
  const totalTurns = transcripts.length;
  const lastTurn = transcripts[transcripts.length - 1];

  // 1. PRIORITY: CONDUCT & MISCONDUCT EVALUATION (Never bypassed by stage boundaries)
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

  // 2. TIME-BASED STAGE TRANSITIONS
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

  // Stage 3: Active Discussion -> Dynamic Challenge / Experience Twist (approx 50% mark or 6+ turns)
  if (
    currentStage === "active_discussion" &&
    ((secondsElapsed >= totalDurationSeconds * 0.50 && secondsElapsed < totalDurationSeconds * 0.58) ||
      (totalTurns >= 7 && !experienceBlueprint?.twistInjected))
  ) {
    const twist = await generateDynamicScenarioTwistAsync({
      topicTitle,
      experienceBlueprint,
      recentTranscripts: transcripts
    });

    if (experienceBlueprint) {
      experienceBlueprint.twistInjected = true;
    }

    return {
      shouldIntervene: true,
      type: "DYNAMIC_CHALLENGE",
      newStage: "dynamic_challenge",
      twistLabel: twist.label,
      moderatorUtterance: `${twist.label}: ${twist.prompt}`
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

  // 5. SEMANTIC STAGNATION DETECTION (Group circling same argument in any domain)
  const stagnation = detectConversationalStagnation(transcripts);
  if (stagnation.stagnant && totalTurns >= 5) {
    const repeatedContext =
      stagnation.repeatedTerms.length > 0
        ? `around ${stagnation.repeatedTerms.join(", ")}`
        : "on the same narrow premise";
    return {
      shouldIntervene: true,
      type: "PROBING_QUESTION",
      moderatorUtterance: `The panel has explored points ${repeatedContext}. Let us widen the lens: What are the unexamined implementation risks, stakeholder incentives, and measurable failure criteria we have missed so far?`
    };
  }

  return { shouldIntervene: false, type: "NONE" };
}
