/**
 * COGNALYZE GROUP DISCUSSION (GD) ARENA — COMPREHENSIVE DATA CONTRACTS
 * 
 * Formal schemas for:
 * - Simulation Formats & Difficulty Tiers
 * - 5 Behavioral Participant Archetypes & Persistent States
 * - Structured Session State Machine & Discussion Stages
 * - Active Coach Moderation & 3-Warning Disciplinary System
 * - Evidence-Grounded 8-Dimension Evaluation
 * - Friends Multiplayer GD Rooms
 */

export type GDSimulationFormat = 
  | "collaborative"      // Candidates build on perspectives toward common understanding
  | "competitive"        // Placement contest: defend stances, challenge logic, assertiveness
  | "corporate"          // Recruiter-style structured trade-offs, executive business focus
  | "technical_business"; // Engineering architecture, p99 latency vs shipping velocity, security

export type GDDifficultyLevel = 
  | "beginner"
  | "intermediate"
  | "advanced"
  | "expert";

export type GDParticipantArchetype = 
  | "dominant_speaker"    // High assertiveness, initiates, occasionally interrupts, monopolization risk
  | "analytical_thinker"   // Structured, data/metrics-oriented, challenges unsupported claims
  | "reserved_contributor" // Less assertive, thoughtful, waits for natural openings
  | "critical_challenger"  // Questions assumptions, counter-perspectives, opposes weak logic
  | "diplomatic_contributor"; // Builds consensus, connects polarized views, synthesis driver

export type GDDiscussionStage = 
  | "briefing"            // Topic orientation, rules, expectations
  | "opening"             // Initial framing and stance declarations
  | "active_discussion"   // Core debate, arguments, rebuttals, cross-examination
  | "dynamic_challenge"   // Contextual complications, market shock, constraint injected
  | "synthesis"           // Connecting arguments, identifying consensus
  | "conclusion"          // Final individual closing summaries
  | "evaluation";         // Final assessment generation

export type GDSessionLifecycleState = 
  | "INITIALIZING"
  | "DEVICE_CHECK"
  | "BRIEFING"
  | "OPENING"
  | "ACTIVE_DISCUSSION"
  | "MODERATION"
  | "CHALLENGE"
  | "SYNTHESIS"
  | "CONCLUSION"
  | "EVALUATION"
  | "COMPLETED"
  | "PAUSED"
  | "RECOVERING"
  | "FAILED";

export interface GDParticipantState {
  id: string;
  name: string;
  archetype: GDParticipantArchetype;
  avatar: string;
  roleTitle: string;
  voiceProfile: {
    pitch: number;
    rate: number;
    voiceName?: string;
  };
  currentStance: "pro" | "con" | "neutral" | "nuanced";
  assertiveness: number; // 0.0 - 1.0
  speakingTurnCount: number;
  totalSpeakingTimeSeconds: number;
  lastSpokeAtTimestamp: number;
  argumentsPresented: string[];
  agreementsWith: string[]; // participant names
  disagreementsWith: string[]; // participant names
  interruptionCount: number;
  currentEmotionState: "calm" | "assertive" | "probing" | "defensive" | "conciliatory";
  isHuman: boolean;
  userId?: string;
}

export interface GDTranscriptItem {
  id: string;
  speakerId: string;
  speakerName: string;
  speakerAvatar: string;
  speakerRole: string;
  isHuman: boolean;
  content: string;
  timestamp: number;
  formattedTime: string;
  stage: GDDiscussionStage;
  sentiment?: "constructive" | "challenging" | "conciliatory" | "neutral" | "disruptive";
  isInterruption?: boolean;
  interruptedSpeakerName?: string;
  unsupportedClaimsDetected?: string[];
  metricsCited?: string[];
  audioMetadata?: {
    durationMs: number;
    confidenceScore?: number;
    perceivedClarity?: "clear" | "muffled" | "choppy";
  };
}

export type GDConductViolationCategory = 
  | "REPEATED_INTERRUPTION"
  | "EXCESSIVE_DOMINANCE"
  | "PERSONAL_ATTACK"
  | "DISRESPECTFUL_LANGUAGE"
  | "HARASSMENT"
  | "DELIBERATE_DISRUPTION"
  | "UNSUPPORTED_FACTUAL_FABRICATION"
  | "OFF_TOPIC_STAGNATION";

export type GDWarningSeverity = 
  | "NOTICE"       // Polite coach nudge
  | "WARNING_1"    // Formal 1st verbal warning
  | "WARNING_2"    // Final 2nd warning (imminent suspension warning)
  | "WARNING_3";   // Account suspension triggered (72h default)

export interface GDModerationIncident {
  id: string;
  timestamp: number;
  participantId: string;
  participantName: string;
  isHuman: boolean;
  violationCategory: GDConductViolationCategory;
  severity: GDWarningSeverity;
  evidenceQuote: string;
  moderatorUtterance: string;
  disciplinaryActionTaken: "none" | "turn_limited" | "warning_logged" | "session_ejection" | "account_suspended";
  suspensionDurationHours?: number;
  suspensionExpiresAt?: string;
  resolved: boolean;
}

export interface GDEvaluationDimension {
  dimension: 
    | "communication_clarity"
    | "content_quality"
    | "logical_reasoning"
    | "active_listening"
    | "critical_thinking"
    | "collaboration"
    | "leadership"
    | "professional_conduct";
  label: string;
  weight: number; // e.g. 0.15 for 15%
  score: number;  // 0 - 100
  verdict: "exemplary" | "proficient" | "developing" | "insufficient_evidence";
  feedback: string;
  citedExcerpts: {
    quote: string;
    timestamp: number;
    turnNumber: number;
    significance: string;
  }[];
}

export interface GDComprehensiveReport {
  sessionId: string;
  studentId: string;
  studentName: string;
  topicTitle: string;
  format: GDSimulationFormat;
  difficulty: GDDifficultyLevel;
  totalDurationSeconds: number;
  overallScore: number; // 0 - 100 weighted
  hiringVerdict: "STRONG_HIRE" | "HIRE" | "LEAN_HIRE" | "NO_HIRE";
  verdictSummary: string;
  dimensions: GDEvaluationDimension[];
  strongestContributions: {
    quote: string;
    stage: GDDiscussionStage;
    whyStrong: string;
  }[];
  weakestContributions: {
    quote: string;
    whyNeedsImprovement: string;
    recruiterRewrite: string;
  }[];
  missedOpportunities: string[];
  unsupportedClaims: string[];
  speakingTimeAnalysis: {
    studentSpeakingTimeSeconds: number;
    studentTurnCount: number;
    speakingPercentage: number;
    groupAverageTurnCount: number;
    dominanceRatio: "under_participated" | "balanced_optimal" | "over_dominant";
  };
  moderationHistory: GDModerationIncident[];
  targetedImprovementPlan: string[];
  nextRecommendedPracticeTopic: string;
  createdAt: string;
}

export interface GDSessionData {
  sessionId: string;
  userId: string;
  topicId: string;
  topicTitle: string;
  format: GDSimulationFormat;
  difficulty: GDDifficultyLevel;
  targetRole: string;
  targetCompany?: string;
  lifecycleState: GDSessionLifecycleState;
  currentStage: GDDiscussionStage;
  stageTimeRemainingSeconds: number;
  totalDurationSeconds: number;
  isFriendsRoom: boolean;
  friendsRoomCode?: string;
  participants: GDParticipantState[];
  activeSpeakerId: string | null;
  transcripts: GDTranscriptItem[];
  moderationIncidents: GDModerationIncident[];
  studentWarningCount: number;
  evaluationReport?: GDComprehensiveReport;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface GDFriendsRoom {
  roomId: string;
  roomCode: string; // 6-character unique join code e.g. "GD-8492"
  hostUserId: string;
  hostName: string;
  topicTitle: string;
  topicContext?: string;
  format: GDSimulationFormat;
  difficulty: GDDifficultyLevel;
  durationMinutes: number;
  status: "WAITING_ROOM" | "IN_PROGRESS" | "COMPLETED" | "ABORTED";
  maxParticipants: number; // 3 - 8
  participants: {
    userId: string;
    fullName: string;
    avatar: string;
    isHost: boolean;
    micActive: boolean;
    handRaised: boolean;
    warningCount: number;
    isSuspended: boolean;
    joinedAt: string;
    lastPingAt: string;
  }[];
  activeSessionId?: string;
  createdAt: string;
  updatedAt: string;
}
