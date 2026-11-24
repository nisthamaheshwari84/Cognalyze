/**
 * COGNALYZE GROUP DISCUSSION — INDEPENDENT PARTICIPANT ARCHETYPES
 * 
 * Implements 5 distinct behavioral participant personalities:
 * 1. Dominant Speaker: High assertiveness, leads early, risks monopolizing, challenges rapidly.
 * 2. Analytical Thinker: Evidence/metrics-driven, structured reasoning, questions vague claims.
 * 3. Reserved Contributor: Thoughtful, waits for clear openings, high signal-to-noise ratio.
 * 4. Critical Challenger: Contrarian, identifies unstated assumptions, plays devil's advocate.
 * 5. Diplomatic Contributor: Builds consensus, bridges opposing views, synthesis driver.
 */

import { GDParticipantArchetype, GDParticipantState, GDSimulationFormat, GDDifficultyLevel } from "./types";

export interface ArchetypeProfileDefinition {
  archetype: GDParticipantArchetype;
  defaultName: string;
  defaultRole: string;
  avatar: string;
  baseAssertiveness: number;
  voiceProfile: {
    pitch: number;
    rate: number;
  };
  temperament: string;
  speakingStyle: string;
  preferredTransitions: string[];
  reactionWhenChallenged: (challengerName: string, point: string) => string;
  synthesisDrive: number; // 0.0 - 1.0
}

export const ARCHETYPE_PROFILES: Record<GDParticipantArchetype, ArchetypeProfileDefinition> = {
  dominant_speaker: {
    archetype: "dominant_speaker",
    defaultName: "Rohan V.",
    defaultRole: "The Velocity Architect",
    avatar: "⚡",
    baseAssertiveness: 0.88,
    voiceProfile: {
      pitch: 0.88,
      rate: 1.08
    },
    temperament: "High conviction, proactive initiator, challenges hesitancy, occasionally needs moderation pacing.",
    speakingStyle: "Decisive, direct, uses active verbs, frames arguments as urgent operational trade-offs.",
    preferredTransitions: [
      "Let's get straight to the core dilemma here.",
      "We cannot afford to analyze this in a vacuum; looking at production reality...",
      "I have to step in and push back on that assumption.",
      "The real constraint the panel is evaluating is not theory, but execution speed."
    ],
    reactionWhenChallenged: (challenger, point) => 
      `${challenger}, I see your point on ${point}, but in a real engineering environment, waiting for perfection guarantees market obsolescence.`,
    synthesisDrive: 0.3
  },

  analytical_thinker: {
    archetype: "analytical_thinker",
    defaultName: "Ananya S.",
    defaultRole: "Data & Systems Modeler",
    avatar: "📊",
    baseAssertiveness: 0.65,
    voiceProfile: {
      pitch: 1.15,
      rate: 1.0
    },
    temperament: "Objective, methodical, quotes metrics, disassembles hand-waving and unverified numbers.",
    speakingStyle: "Structured, measured, begins with premise, presents data/trade-off, then concludes logically.",
    preferredTransitions: [
      "If we break down the unit economics mathematically...",
      "What empirical metrics are we using to benchmark that claim?",
      "Let's look at the failure distributions rather than just the median case.",
      "There is an asymmetry in that argument when you measure p99 latency."
    ],
    reactionWhenChallenged: (challenger, point) =>
      `Fair counter, ${challenger}. However, unless we have quantitative verification for ${point}, we are relying on anecdotal intuition.`,
    synthesisDrive: 0.6
  },

  reserved_contributor: {
    archetype: "reserved_contributor",
    defaultName: "Aditya M.",
    defaultRole: "Core Infrastructure Specialist",
    avatar: "🛡️",
    baseAssertiveness: 0.42,
    voiceProfile: {
      pitch: 0.82,
      rate: 0.95
    },
    temperament: "Patient listener, speaks selectively with high impact, highlights hidden systemic constraints.",
    speakingStyle: "Calm, concise, insightful, avoids filler, lands points with strong clarity.",
    preferredTransitions: [
      "I've been listening to the debate between the two sides, and one crucial aspect is being overlooked...",
      "If I may add a specific technical perspective here...",
      "Before we move on, we have to consider the long-term maintainability burden...",
      "To add to what the group has established..."
    ],
    reactionWhenChallenged: (challenger, point) =>
      `I agree that ${challenger}'s objection has merit in the short term, but over a multi-year horizon, ${point} becomes the real bottleneck.`,
    synthesisDrive: 0.7
  },

  critical_challenger: {
    archetype: "critical_challenger",
    defaultName: "Karan T.",
    defaultRole: "Security & Threat Analyst",
    avatar: "💡",
    baseAssertiveness: 0.78,
    voiceProfile: {
      pitch: 0.94,
      rate: 1.02
    },
    temperament: "Contrarian, spots blind spots, exposes attack surfaces, questions mainstream consensus.",
    speakingStyle: "Inquisitive, sharp, raises 'what-if' scenarios, tests resilience of other candidates' models.",
    preferredTransitions: [
      "Everyone seems to agree on that, but what happens when the primary assumption fails?",
      "That is a dangerous oversimplification under adversarial conditions.",
      "We're looking at the sunny-day scenario; let's stress-test the boundary limits.",
      "I strongly disagree with the idea that convenience should outrank security compliance."
    ],
    reactionWhenChallenged: (challenger, point) =>
      `Good defense, ${challenger}, but your model completely ignores the secondary blast radius if ${point} is compromised.`,
    synthesisDrive: 0.4
  },

  diplomatic_contributor: {
    archetype: "diplomatic_contributor",
    defaultName: "Priya K.",
    defaultRole: "Product & Strategy Lead",
    avatar: "🎯",
    baseAssertiveness: 0.70,
    voiceProfile: {
      pitch: 1.22,
      rate: 1.04
    },
    temperament: "Collaborative leader, builds common ground, prevents stalemate, guides group toward consensus.",
    speakingStyle: "Harmonizing, outcome-oriented, acknowledges valid sides, frames actionable hybrid solutions.",
    preferredTransitions: [
      "Both viewpoints highlight two sides of the same coin here.",
      "Let's see if we can reconcile the engineering constraint with the customer requirement.",
      "Building on the candidate's point and Rohan's concern...",
      "As we approach our conclusion, let's synthesize the consensus the group has built."
    ],
    reactionWhenChallenged: (challenger, point) =>
      `I appreciate ${challenger} pointing that out. It actually reinforces why a phased hybrid model addresses ${point} while keeping momentum.`,
    synthesisDrive: 0.95
  }
};

/**
 * Generate a calibrated panel of 4 AI participants tailored to topic, format, and difficulty.
 */
export function generateCalibratedAIParticipants(params: {
  topicTitle: string;
  format: GDSimulationFormat;
  difficulty: GDDifficultyLevel;
}): GDParticipantState[] {
  const { format, difficulty } = params;

  // Select 4 complementary archetypes to ensure active debate + synthesis
  const archetypeSelection: GDParticipantArchetype[] = [
    "dominant_speaker",
    "analytical_thinker",
    "critical_challenger",
    "diplomatic_contributor"
  ];

  // In Advanced/Expert, include the Reserved Contributor to reward candidates who draw in quieter peers
  if (difficulty === "advanced" || difficulty === "expert") {
    archetypeSelection[2] = "reserved_contributor";
  }

  // Difficulty adjustment factor
  const diffMultiplier = 
    difficulty === "beginner" ? 0.85 :
    difficulty === "intermediate" ? 1.0 :
    difficulty === "advanced" ? 1.15 : 1.25;

  return archetypeSelection.map((archKey, index) => {
    const profile = ARCHETYPE_PROFILES[archKey];
    
    // Vary initial stances to ensure productive conflict
    const stances: ("pro" | "con" | "neutral" | "nuanced")[] = 
      format === "collaborative" 
        ? ["pro", "nuanced", "neutral", "pro"]
        : ["pro", "con", "con", "nuanced"];

    const stance = stances[index % stances.length];

    return {
      id: `ai-peer-${index + 1}-${archKey}`,
      name: profile.defaultName,
      archetype: archKey,
      avatar: profile.avatar,
      roleTitle: profile.defaultRole,
      voiceProfile: {
        pitch: profile.voiceProfile.pitch,
        rate: profile.voiceProfile.rate
      },
      currentStance: stance,
      assertiveness: Math.min(0.98, Math.max(0.3, profile.baseAssertiveness * diffMultiplier)),
      speakingTurnCount: 0,
      totalSpeakingTimeSeconds: 0,
      lastSpokeAtTimestamp: 0,
      argumentsPresented: [],
      agreementsWith: [],
      disagreementsWith: [],
      interruptionCount: 0,
      currentEmotionState: archKey === "dominant_speaker" ? "assertive" : "calm",
      isHuman: false
    };
  });
}
