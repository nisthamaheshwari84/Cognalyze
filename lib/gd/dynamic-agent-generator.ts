/**
 * COGNALYZE GD ARENA — DYNAMIC AI PARTICIPANT GENERATOR & STANCE MEMORY ENGINE
 *
 * Generates bespoke, topic- and role-calibrated AI co-discussants using the
 * Phase 3 AI Gateway, calibrates distinct voice & assertiveness signatures,
 * and maintains evolving peer memory (agreements, disagreements, stances).
 */

import {
  GDSessionData,
  GDParticipantState,
  GDParticipantArchetype,
  GDSimulationFormat,
  GDDifficultyLevel,
  GDDiscussionStage
} from "./types";
import {
  ARCHETYPE_PROFILES,
  generateCalibratedAIParticipants
} from "./participant-archetypes";
import { runGDJsonCompletion, sanitizeGDPromptInput } from "./ai-gateway";

const VALID_ARCHETYPES: GDParticipantArchetype[] = [
  "dominant_speaker",
  "analytical_thinker",
  "reserved_contributor",
  "critical_challenger",
  "diplomatic_contributor"
];

const VOICE_SLOTS: Array<{ pitch: number; rate: number; genderHint: "male" | "female"; avatar: string }> = [
  { pitch: 0.88, rate: 1.07, genderHint: "male", avatar: "⚡" },
  { pitch: 1.18, rate: 0.98, genderHint: "female", avatar: "📊" },
  { pitch: 0.94, rate: 1.02, genderHint: "male", avatar: "💡" },
  { pitch: 1.24, rate: 1.04, genderHint: "female", avatar: "🎯" }
];

export async function generateDynamicAIPanelAsync(params: {
  topicTitle: string;
  format: GDSimulationFormat;
  difficulty: GDDifficultyLevel;
  targetRole?: string;
}): Promise<GDParticipantState[]> {
  const safeTopic = sanitizeGDPromptInput(params.topicTitle, 240);
  const safeRole = sanitizeGDPromptInput(params.targetRole || "Software Engineer", 80);

  const diffMultiplier =
    params.difficulty === "beginner"
      ? 0.85
      : params.difficulty === "intermediate"
      ? 1.0
      : params.difficulty === "advanced"
      ? 1.12
      : 1.22;

  const userPrompt = `Design a panel of exactly 4 distinct student candidates for a Group Discussion.
TOPIC: "${safeTopic}"
FORMAT: ${params.format}
DIFFICULTY: ${params.difficulty}
CANDIDATE TARGET ROLE: ${safeRole}

REQUIREMENTS:
1. Create 4 realistic names (diverse everyday campus placement candidate names) with specific role titles/lenses relevant to the topic.
2. Assign complementary archetypes across: "dominant_speaker", "analytical_thinker", "critical_challenger", "diplomatic_contributor"${params.difficulty === "advanced" || params.difficulty === "expert" ? ' (or "reserved_contributor" for one seat)' : ""}.
3. Balance initial stances across "pro", "con", "nuanced", "neutral" so genuine two-sided debate happens.
4. Keep temperament and speakingStyle concise (under 18 words each).

Return JSON ONLY:
{
  "participants": [
    {
      "name": "First L.",
      "roleTitle": "Specific Domain Angle",
      "archetype": "dominant_speaker",
      "currentStance": "pro",
      "reasoningLens": "What constraint this candidate cares about most",
      "temperament": "Concise behavioral disposition",
      "speakingStyle": "Concise cadence and rhetorical style"
    }
  ]
}`;

  const result = await runGDJsonCompletion<any[]>({
    role: "dynamic_agent_generator",
    systemPrompt:
      "You architect balanced, realistic AI Group Discussion panels tailored to the exact debate domain and student target role.",
    userPrompt,
    validate: (parsed) => {
      if (!Array.isArray(parsed?.participants) || parsed.participants.length < 4) {
        return null;
      }
      return parsed.participants.slice(0, 4);
    }
  });

  if (!result.ok) {
    return generateCalibratedAIParticipants(params);
  }

  const usedNames = new Set<string>();
  return result.data.map((raw, idx) => {
    const rawArch = VALID_ARCHETYPES.includes(raw?.archetype)
      ? (raw.archetype as GDParticipantArchetype)
      : VALID_ARCHETYPES[idx % VALID_ARCHETYPES.length];
    const baseProfile = ARCHETYPE_PROFILES[rawArch];
    const voice = VOICE_SLOTS[idx % VOICE_SLOTS.length];

    let name = sanitizeGDPromptInput(String(raw?.name || baseProfile.defaultName), 36) || baseProfile.defaultName;
    if (usedNames.has(name.toLowerCase())) {
      name = `${baseProfile.defaultName} (${idx + 1})`;
    }
    usedNames.add(name.toLowerCase());

    const rawStance = raw?.currentStance;
    const currentStance: GDParticipantState["currentStance"] =
      rawStance === "pro" || rawStance === "con" || rawStance === "neutral" || rawStance === "nuanced"
        ? rawStance
        : idx % 2 === 0
        ? "pro"
        : "con";

    return {
      id: `ai-peer-${idx + 1}-${rawArch}`,
      name,
      archetype: rawArch,
      avatar: voice.avatar,
      roleTitle: sanitizeGDPromptInput(String(raw?.roleTitle || baseProfile.defaultRole), 48) || baseProfile.defaultRole,
      voiceProfile: {
        pitch: voice.pitch,
        rate: voice.rate,
        genderHint: voice.genderHint
      },
      reasoningLens: sanitizeGDPromptInput(String(raw?.reasoningLens || baseProfile.temperament), 120),
      temperament: sanitizeGDPromptInput(String(raw?.temperament || baseProfile.temperament), 120),
      speakingStyle: sanitizeGDPromptInput(String(raw?.speakingStyle || baseProfile.speakingStyle), 120),
      currentStance,
      assertiveness: Math.min(0.98, Math.max(0.32, baseProfile.baseAssertiveness * diffMultiplier)),
      speakingTurnCount: 0,
      totalSpeakingTimeSeconds: 0,
      lastSpokeAtTimestamp: 0,
      argumentsPresented: [],
      agreementsWith: [],
      disagreementsWith: [],
      interruptionCount: 0,
      currentEmotionState: rawArch === "dominant_speaker" ? "assertive" : "calm",
      isHuman: false
    };
  });
}

/**
 * Update persistent agent memory & stance dynamics after any human or AI turn.
 */
export function updateParticipantMemoryAfterTurn(params: {
  session: GDSessionData;
  speakerId: string;
  utterance: string;
  stage: GDDiscussionStage;
}): void {
  const { session, speakerId, utterance, stage } = params;
  const clean = utterance.trim();
  if (!clean) return;

  const speaker = session.participants.find((p) => p.id === speakerId);
  if (!speaker) return;

  const summarySlice = clean.slice(0, 140);
  if (!speaker.argumentsPresented.includes(summarySlice)) {
    speaker.argumentsPresented = [...speaker.argumentsPresented.slice(-5), summarySlice];
  }

  const lower = clean.toLowerCase();
  const isAgreement = /\b(agree|building on|valid point|supports|good point|reconcile|hybrid)\b/i.test(lower);
  const isChallenge = /\b(disagree|however|flaw|risk|challenge|ignores|fails|bottleneck)\b/i.test(lower);

  for (const peer of session.participants) {
    if (peer.id === speaker.id) continue;
    const firstToken = peer.name.toLowerCase().split(/[\s(]+/)[0];
    if (firstToken.length < 2) continue;

    if (lower.includes(firstToken)) {
      if (isChallenge) {
        if (!speaker.disagreementsWith.includes(peer.name)) {
          speaker.disagreementsWith = [...speaker.disagreementsWith, peer.name].slice(-5);
        }
        if (!peer.isHuman) {
          peer.currentEmotionState = "probing";
        }
      } else if (isAgreement) {
        if (!speaker.agreementsWith.includes(peer.name)) {
          speaker.agreementsWith = [...speaker.agreementsWith, peer.name].slice(-5);
        }
        if (!peer.isHuman) {
          peer.currentEmotionState = "conciliatory";
        }
      }
    }
  }

  // Late-stage stance convergence toward synthesis
  if ((stage === "synthesis" || stage === "conclusion") && isAgreement) {
    speaker.currentStance = "nuanced";
    speaker.currentEmotionState = "conciliatory";
  } else if (isChallenge) {
    speaker.currentEmotionState = "assertive";
  }
}
