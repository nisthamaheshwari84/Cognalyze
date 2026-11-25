/**
 * COGNALYZE GROUP DISCUSSION — DYNAMIC SIMULATION & ORCHESTRATION ENGINE
 * 
 * Orchestrates:
 * - Context-aware turn arbitration (no simple round-robin)
 * - 4 Simulation Formats (Collaborative, Competitive, Corporate, Technical/Business)
 * - 4 Adaptive Difficulty Tiers (Beginner, Intermediate, Advanced, Expert)
 * - Persistent participant memory & stance evolution
 * - Integration with Active Coach Moderator
 * - Rich LLM dialogue generation via Groq API with robust fallback recovery
 */

import {
  GDSessionData,
  GDSimulationFormat,
  GDDifficultyLevel,
  GDParticipantState,
  GDTranscriptItem,
  GDDiscussionStage
} from "./types";
import { ARCHETYPE_PROFILES } from "./participant-archetypes";
import { evaluateCoachIntervention } from "./coach-moderator-engine";
import { runGDJsonCompletion, sanitizeGDPromptInput } from "./ai-gateway";
import { updateParticipantMemoryAfterTurn } from "./dynamic-agent-generator";

export interface NextTurnResult {
  speakerId: string;
  speakerName: string;
  speakerAvatar: string;
  speakerRole: string;
  isHuman: boolean;
  content: string;
  stage: GDDiscussionStage;
  isCoachIntervention: boolean;
  coachInterventionType?: string;
  updatedStage?: GDDiscussionStage;
  twistLabel?: string;
  studentCoaching?: {
    articulationScore: number;
    valueAdded: "High" | "Medium" | "Low";
    feedbackTip: string;
    winningCounterPhrase: string;
  };
}

/**
 * Context-aware speaker selector.
 * Evaluates conversation balance, who was challenged, participant assertiveness, and speaking recency.
 */
export function selectNextSpeaker(params: {
  participants: GDParticipantState[];
  transcripts: GDTranscriptItem[];
  currentStage: GDDiscussionStage;
  format: GDSimulationFormat;
  difficulty: GDDifficultyLevel;
}): GDParticipantState {
  const { participants, transcripts, currentStage, format } = params;
  const lastTurn = transcripts[transcripts.length - 1];
  const lastSpeakerId = lastTurn?.speakerId;

  // Filter out the last speaker so they do not speak twice consecutively
  const eligiblePeers = participants.filter(p => !p.isHuman && p.id !== lastSpeakerId);
  if (eligiblePeers.length === 0) {
    return participants[0];
  }

  // Stage-based preference
  if (currentStage === "synthesis" || currentStage === "conclusion") {
    // Prioritize Diplomatic Contributor or Analytical Thinker to drive conclusion
    const diplomatic = eligiblePeers.find(p => p.archetype === "diplomatic_contributor");
    if (diplomatic) return diplomatic;
  }

  if (currentStage === "dynamic_challenge") {
    // Prioritize Critical Challenger or Dominant Speaker
    const critical = eligiblePeers.find(p => p.archetype === "critical_challenger");
    if (critical) return critical;
  }

  // If a participant was directly named/challenged in the last turn, give them right of reply!
  if (lastTurn) {
    const textLower = lastTurn.content.toLowerCase();
    const mentionedPeer = eligiblePeers.find(p => textLower.includes(p.name.toLowerCase()));
    if (mentionedPeer) {
      return mentionedPeer;
    }
  }

  // Weight by speaking recency (who has waited the longest) and turn deficit
  const sorted = [...eligiblePeers].sort((a, b) => {
    // Least turns first
    if (a.speakingTurnCount !== b.speakingTurnCount) {
      return a.speakingTurnCount - b.speakingTurnCount;
    }
    // Lowest assertiveness vs highest based on format, deterministic tie-breaker by peer id
    if (format === "competitive") {
      return b.assertiveness - a.assertiveness;
    }
    return a.id.localeCompare(b.id);
  });

  return sorted[0];
}

/**
 * Generate the next dialogue turn using Groq LLM with persona grounding and conversation history.
 */
export async function orchestrateNextTurn(session: GDSessionData, studentIntervention?: string): Promise<NextTurnResult> {
  const {
    sessionId,
    topicTitle,
    format,
    difficulty,
    currentStage,
    totalDurationSeconds,
    participants,
    transcripts,
    userId,
    isFriendsRoom,
    friendsRoomCode
  } = session;

  const secondsElapsed = session.totalDurationSeconds - session.stageTimeRemainingSeconds;

  // 1. Check if the Active Coach should intervene first
  const coachDecision = await evaluateCoachIntervention({
    sessionId,
    topicTitle,
    format,
    difficulty,
    currentStage,
    secondsElapsed,
    totalDurationSeconds,
    participants,
    transcripts,
    studentUserId: userId,
    studentName: "Candidate (You)",
    isFriendsRoom,
    roomCode: friendsRoomCode,
    experienceBlueprint: session.experienceBlueprint
  });

  if (coachDecision.shouldIntervene && coachDecision.moderatorUtterance) {
    return {
      speakerId: "moderator-alex",
      speakerName: "Alex (Discussion Director)",
      speakerAvatar: "🎙️",
      speakerRole: "Panel Director & Lead Bar-Raiser",
      isHuman: false,
      content: coachDecision.moderatorUtterance,
      stage: coachDecision.newStage || currentStage,
      isCoachIntervention: true,
      coachInterventionType: coachDecision.type,
      updatedStage: coachDecision.newStage,
      twistLabel: coachDecision.twistLabel
    };
  }

  // 2. Select next peer to speak
  const selectedPeer = selectNextSpeaker({
    participants,
    transcripts,
    currentStage,
    format,
    difficulty
  });

  const profile = ARCHETYPE_PROFILES[selectedPeer.archetype];
  const effectiveTemperament = selectedPeer.temperament || profile.temperament;
  const effectiveStyle = selectedPeer.speakingStyle || profile.speakingStyle;
  const effectiveLens = selectedPeer.reasoningLens || selectedPeer.roleTitle;
  const safeTopic = sanitizeGDPromptInput(topicTitle, 240);
  const safeIntervention = sanitizeGDPromptInput(studentIntervention, 500);
  const lastTurnsText = transcripts
    .slice(-6)
    .map(t => `${sanitizeGDPromptInput(t.speakerName, 40)} (${sanitizeGDPromptInput(t.speakerRole, 40)}): "${sanitizeGDPromptInput(t.content, 280)}"`)
    .join("\n");
  const lastSpeaker = transcripts[transcripts.length - 1];
  const memorySummary = [
    selectedPeer.agreementsWith.length > 0 ? `Agreed previously with: ${selectedPeer.agreementsWith.join(", ")}` : "",
    selectedPeer.disagreementsWith.length > 0 ? `Challenged previously: ${selectedPeer.disagreementsWith.join(", ")}` : "",
    selectedPeer.argumentsPresented.length > 0 ? `Your prior points: ${selectedPeer.argumentsPresented.slice(-2).join(" | ")}` : ""
  ].filter(Boolean).join("\n");

  // 3. Compose contextual prompt for AI Gateway
  const userPrompt = `You are roleplaying as "${selectedPeer.name}", a campus recruitment candidate in a premier engineering placement Group Discussion.
TOPIC: "${safeTopic}"
DISCUSSION FORMAT: ${format.toUpperCase()}
DIFFICULTY TIER: ${difficulty.toUpperCase()}
CURRENT DISCUSSION STAGE: ${currentStage.toUpperCase()}

YOUR PERSONA:
- Archetype: ${selectedPeer.archetype} (${effectiveTemperament})
- Role Title: ${selectedPeer.roleTitle}
- Reasoning Lens: ${effectiveLens}
- Speaking Style: ${effectiveStyle}
- Current Stance: ${selectedPeer.currentStance} (Emotion: ${selectedPeer.currentEmotionState})
- Assertiveness Level: ${selectedPeer.assertiveness.toFixed(2)}
${memorySummary ? `\nYOUR CONVERSATION MEMORY:\n${memorySummary}` : ""}

RECENT GROUP TRANSCRIPT:
${lastTurnsText || "The discussion has just commenced."}

LATEST EVENT:
${safeIntervention
  ? `Candidate ('You') just stated: "${safeIntervention}". React to their point, evaluate their premise, and pivot to challenge another peer.`
  : `Previous speaker was ${lastSpeaker?.speakerName || "the group"}. Deliver your next perspective in natural conversational rhythm.`}

CONVERSATION INSTRUCTIONS:
1. Speak in first person as "${selectedPeer.name}".
2. Address peer candidates naturally by name (e.g., "${lastSpeaker?.speakerName || 'Rohan'}", "Candidate", "Priya").
3. DO NOT sound like an examiner, chatbot, or textbook. Sound like a sharp Tier-1 engineering candidate competing for a placement spot.
4. Keep spoken text to 2 to 3 concise, punchy sentences (30-55 words). Ready for audio speech synthesis.
5. Ground claims with concrete operational trade-offs (e.g., p99 latency, zero-day threat surface, CAP theorem, client ROI, developer velocity).
6. If student spoke, generate recruiter coaching signals for their dashboard.

Return JSON in this EXACT format:
{
  "spoken_text": "...",
  "student_coaching": {
    "articulationScore": 84,
    "valueAdded": "High",
    "feedbackTip": "...",
    "winningCounterPhrase": "..."
  }
}`;

  const aiResult = await runGDJsonCompletion<{
    spoken_text: string;
    student_coaching?: NextTurnResult["studentCoaching"];
  }>({
    role: "participant_agent",
    systemPrompt:
      "You are the AI conversation engine for high-stakes campus placement Group Discussions. Never repeat pre-scripted phrases. Generate realistic, context-aware dialogue with active peer-to-peer engagement.",
    userPrompt,
    validate: (parsed) => {
      if (typeof parsed?.spoken_text !== "string" || parsed.spoken_text.trim().length < 12) {
        return null;
      }
      return {
        spoken_text: parsed.spoken_text.replace(/["\n\r]/g, " ").trim(),
        student_coaching: parsed.student_coaching
      };
    }
  });

  if (aiResult.ok) {
    updateParticipantMemoryAfterTurn({
      session,
      speakerId: selectedPeer.id,
      utterance: aiResult.data.spoken_text,
      stage: currentStage
    });
    return {
      speakerId: selectedPeer.id,
      speakerName: selectedPeer.name,
      speakerAvatar: selectedPeer.avatar,
      speakerRole: selectedPeer.roleTitle,
      isHuman: false,
      content: aiResult.data.spoken_text,
      stage: currentStage,
      isCoachIntervention: false,
      studentCoaching: aiResult.data.student_coaching
    };
  }

  console.warn("[simulation-engine] AI gateway failed, generating calibrated archetype fallback:", aiResult.error);

  // Archetype-calibrated deterministic response if LLM is unavailable
  const fallbackTransitions = profile.preferredTransitions;
  const pickedTransition =
    fallbackTransitions[session.transcripts.length % fallbackTransitions.length];
  const fallbackContent = `${pickedTransition} When balancing ${topicTitle.toLowerCase().split(":")[0]}, optimizing purely for one dimension inevitably shifts failure modes to secondary services.`;

  return {
    speakerId: selectedPeer.id,
    speakerName: selectedPeer.name,
    speakerAvatar: selectedPeer.avatar,
    speakerRole: selectedPeer.roleTitle,
    isHuman: false,
    content: fallbackContent,
    stage: currentStage,
    isCoachIntervention: false
  };
}
