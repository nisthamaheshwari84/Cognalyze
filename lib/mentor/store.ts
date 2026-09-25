/**
 * COGNALYZE MENTOR — STORE
 * Learning Twin persistence, active session state manager, and synchronization
 * with canonical Cognalyze Student DNA and Evidence Store.
 */

import { randomUUID } from "node:crypto";
import {
  LearningTwinState,
  LearningGoal,
  MentorEvidenceRecord,
  ConceptMastery,
  MentorSessionRecord,
  ConversationalMessage,
  TeachingMode,
  LanguageCode
} from "./types";
import { KNOWLEDGE_GRAPH } from "./knowledge-graph";
import { addEvidenceItem, logDNAChange, EvidenceItem } from "../intelligence/student-intelligence";

// In-memory Learning Twin Registry (isolated per studentId)
const LEARNING_TWIN_STORE: Map<string, LearningTwinState> = new Map();

// In-memory Session Registry & Active Session tracker per candidate
const SESSIONS_STORE: Map<string, MentorSessionRecord[]> = new Map();
const ACTIVE_SESSION_ID_STORE: Map<string, string> = new Map();

/**
 * Default Goal for initial student session
 */
export function getDefaultGoal(domain: string = "System Design"): LearningGoal {
  return {
    id: `goal-${Date.now()}`,
    title: domain === "DSA" ? "Master DSA & Algorithms" : "Master System Design & Distributed Architecture",
    domain: domain,
    timeCommitmentPerWeekHours: 6,
    targetRole: "Full Stack Engineer / SDE-1",
    priorExperience: "intermediate",
    preferredLanguage: "hinglish",
    technicalTermLanguage: "en",
    teachingStyle: "socratic"
  };
}

/**
 * Initialize a fresh Learning Twin State for a candidate
 */
export function initializeLearningTwin(studentId: string, goal?: Partial<LearningGoal>): LearningTwinState {
  const mergedGoal: LearningGoal = {
    ...getDefaultGoal(goal?.domain || "System Design"),
    ...goal
  };

  // Seed initial concepts based on domain
  const concepts: Record<string, ConceptMastery> = {};
  Object.values(KNOWLEDGE_GRAPH).forEach((node) => {
    concepts[node.id] = {
      conceptId: node.id,
      conceptName: node.title,
      domain: node.domain,
      status: "unknown",
      attemptsCount: 0,
      independentSuccessCount: 0,
      hintAssistedSuccessCount: 0,
      misconceptionsObserved: [],
      confidenceScore: 50,
      confidenceAccuracy: "uncalibrated",
      evidenceNotes: []
    };
  });

  const startingConceptId =
    mergedGoal.domain.toLowerCase().includes("dsa")
      ? "dsa-two-pointers"
      : mergedGoal.domain.toLowerCase().includes("ai")
      ? "ai-embeddings-rag"
      : mergedGoal.domain.toLowerCase().includes("backend")
      ? "be-sql-indexing"
      : "sys-networking";

  const state: LearningTwinState = {
    studentId,
    activeGoal: mergedGoal,
    diagnosticCompleted: false,
    concepts,
    activeConceptId: startingConceptId,
    currentLoopStep: "EXPLAIN",
    currentMode: "learn",
    dontGiveAnswerMode: false,
    currentHintLevel: 0,
    sessionEvidence: [],
    sessionStartedAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString()
  };

  LEARNING_TWIN_STORE.set(studentId, state);
  return state;
}

/**
 * Get or create the candidate's active Learning Twin
 */
export function getOrCreateLearningTwin(studentId: string, goal?: Partial<LearningGoal>): LearningTwinState {
  const existing = LEARNING_TWIN_STORE.get(studentId);
  if (existing) {
    if (goal) {
      existing.activeGoal = { ...existing.activeGoal, ...goal };
    }
    existing.lastActiveAt = new Date().toISOString();
    return existing;
  }
  return initializeLearningTwin(studentId, goal);
}

/**
 * Update candidate's Learning Twin state
 */
export function updateLearningTwin(studentId: string, updates: Partial<LearningTwinState>): LearningTwinState {
  const current = getOrCreateLearningTwin(studentId);
  const updated: LearningTwinState = {
    ...current,
    ...updates,
    lastActiveAt: new Date().toISOString()
  };
  LEARNING_TWIN_STORE.set(studentId, updated);
  return updated;
}

/**
 * Record evidence and sync with canonical Student DNA
 */
export function recordMentorEvidence(studentId: string, record: MentorEvidenceRecord): void {
  const twin = getOrCreateLearningTwin(studentId);
  twin.sessionEvidence.push(record);

  // Update concept mastery state
  const concept = twin.concepts[record.conceptId];
  if (concept) {
    concept.attemptsCount += 1;
    if (record.assistanceLevel === "Independent") {
      concept.independentSuccessCount += 1;
      concept.status = "demonstrated";
    } else if (record.assistanceLevel === "Hint-Assisted") {
      concept.hintAssistedSuccessCount += 1;
      concept.status = "partially_understood";
    } else {
      concept.status = "weak";
    }
    concept.lastDemonstratedAt = record.createdAt;
    concept.evidenceNotes.push(`${record.assistanceLevel}: ${record.reasoningJustification}`);
  }

  // Sync into Student DNA as a formal EvidenceItem
  const evidenceLevel = record.demonstratedLevel === "Demonstrated" ? 3 : 2;
  const canonicalEvidence: EvidenceItem = {
    id: `ev-mentor-${Date.now()}-${randomUUID().substring(0, 8)}`,
    studentId,
    sourceType: "assessment", // Mentor interactive demonstration counts as assessed
    sourceId: record.id,
    capability: record.conceptName,
    claim: `Demonstrated understanding of ${record.conceptName} in Cognalyze Mentor session`,
    extractedEvidence: `[${record.assistanceLevel}] ${record.reasoningJustification} | Excerpt: "${record.verbatimExcerpt.slice(0, 180)}"`,
    evidenceLevel,
    confidence: record.assistanceLevel === "Independent" ? "HIGH" : "MEDIUM",
    createdAt: record.createdAt,
    updatedAt: record.createdAt,
    verificationStatus: "verified",
    provenance: {
      sourceName: "Cognalyze Mentor",
      context: `Domain: ${record.domain} | Hints Used: ${record.hintsUsed} | Assistance: ${record.assistanceLevel}`
    }
  };

  try {
    addEvidenceItem(canonicalEvidence);
    logDNAChange(studentId, {
      id: `change-mentor-${Date.now()}`,
      timestamp: record.createdAt,
      triggerEvent: `Cognalyze Mentor session on ${record.conceptName}`,
      newEvidence: `Demonstrated ${record.conceptName} (${record.assistanceLevel}, ${record.hintsUsed} hints)`,
      affectedCapabilities: [record.conceptName],
      beforeSummary: `Previous level for ${record.conceptName}`,
      afterSummary: `Upgraded to ${record.demonstratedLevel} via interactive evaluation`,
      affectedOpportunitiesDelta: record.demonstratedLevel === "Demonstrated" ? 2 : 0
    });

    // Also attach to active session if available
    const activeSess = getActiveSession(studentId, false);
    if (activeSess) {
      activeSess.evidenceGenerated.push(record);
    }
  } catch (err) {
    console.error("[MentorStore] Failed to commit evidence to Student DNA:", err);
  }
}

/**
 * Get all conversation session history for a student (newest first)
 */
export function getMentorSessionHistory(studentId: string): MentorSessionRecord[] {
  const sessions = SESSIONS_STORE.get(studentId) || [];
  return [...sessions].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );
}

/**
 * Get a specific session by ID
 */
export function getMentorSessionById(studentId: string, sessionId: string): MentorSessionRecord | null {
  const sessions = SESSIONS_STORE.get(studentId) || [];
  return sessions.find((s) => s.id === sessionId) || null;
}

/**
 * Get active session, optionally creating one if none exists
 */
export function getActiveSession(studentId: string, autoCreate = true): MentorSessionRecord | null {
  const activeId = ACTIVE_SESSION_ID_STORE.get(studentId);
  const sessions = SESSIONS_STORE.get(studentId) || [];

  if (activeId) {
    const found = sessions.find((s) => s.id === activeId);
    if (found && found.status === "active") {
      return found;
    }
  }

  if (autoCreate) {
    return createMentorSession(studentId);
  }
  return null;
}

/**
 * Create a brand new session, archiving previous active session into history
 */
export function createMentorSession(
  studentId: string,
  options?: {
    domain?: string;
    conceptId?: string;
    mode?: TeachingMode;
    language?: LanguageCode;
    title?: string;
  }
): MentorSessionRecord {
  const twin = getOrCreateLearningTwin(studentId, options?.domain ? { domain: options.domain } : undefined);
  const sessions = SESSIONS_STORE.get(studentId) || [];

  // If there is an active session with messages, mark it completed in history
  const currentActiveId = ACTIVE_SESSION_ID_STORE.get(studentId);
  if (currentActiveId) {
    const currentActive = sessions.find((s) => s.id === currentActiveId);
    if (currentActive && currentActive.status === "active") {
      currentActive.status = "completed";
      currentActive.endedAt = new Date().toISOString();
    }
  }

  const activeConceptId = options?.conceptId || twin.activeConceptId;
  const conceptNode = KNOWLEDGE_GRAPH[activeConceptId];
  const conceptTitle = conceptNode ? conceptNode.title : "Core Foundations";
  const domain = options?.domain || twin.activeGoal.domain;
  const mode = options?.mode || twin.currentMode;
  const language = options?.language || twin.activeGoal.preferredLanguage;

  const newSession: MentorSessionRecord = {
    id: `sess-${Date.now()}-${randomUUID().substring(0, 6)}`,
    studentId,
    title: options?.title || `${domain}: ${conceptTitle}`,
    domain,
    conceptId: activeConceptId,
    conceptTitle,
    mode,
    language,
    messages: [],
    evidenceGenerated: [],
    startedAt: new Date().toISOString(),
    status: "active"
  };

  sessions.unshift(newSession);
  SESSIONS_STORE.set(studentId, sessions);
  ACTIVE_SESSION_ID_STORE.set(studentId, newSession.id);

  // Reset twin's session-scoped state for the fresh conversation
  twin.sessionEvidence = [];
  twin.sessionStartedAt = newSession.startedAt;
  twin.currentHintLevel = 0;

  return newSession;
}

/**
 * Persist messages into the current active or specified session
 */
export function saveSessionMessages(
  studentId: string,
  sessionId: string,
  messages: ConversationalMessage[]
): void {
  const sessions = SESSIONS_STORE.get(studentId) || [];
  const session = sessions.find((s) => s.id === sessionId);
  if (session) {
    session.messages = messages;
    // If the session has a user message and a default title, generate an intuitive topic title
    const firstUserMsg = messages.find((m) => m.role === "user");
    if (firstUserMsg && session.title.includes(":")) {
      const topicSnippet = firstUserMsg.content.slice(0, 45).replace(/\n/g, " ").trim();
      if (topicSnippet.length > 5) {
        session.title = `${session.conceptTitle} — "${topicSnippet}${firstUserMsg.content.length > 45 ? "..." : ""}"`;
      }
    }
  }
}

/**
 * End / exit the active session, archive it into history, and clear active state
 */
export function endMentorSession(studentId: string, sessionId?: string): MentorSessionRecord | null {
  const sessions = SESSIONS_STORE.get(studentId) || [];
  const targetId = sessionId || ACTIVE_SESSION_ID_STORE.get(studentId);
  if (!targetId) return null;

  const session = sessions.find((s) => s.id === targetId);
  if (session) {
    session.status = "completed";
    session.endedAt = new Date().toISOString();
  }

  // Clear active session pointer so next visit is fresh!
  if (ACTIVE_SESSION_ID_STORE.get(studentId) === targetId) {
    ACTIVE_SESSION_ID_STORE.delete(studentId);
  }

  return session || null;
}

/**
 * Delete a session from history
 */
export function deleteMentorSession(studentId: string, sessionId: string): boolean {
  const sessions = SESSIONS_STORE.get(studentId) || [];
  const index = sessions.findIndex((s) => s.id === sessionId);
  if (index !== -1) {
    sessions.splice(index, 1);
    SESSIONS_STORE.set(studentId, sessions);
    if (ACTIVE_SESSION_ID_STORE.get(studentId) === sessionId) {
      ACTIVE_SESSION_ID_STORE.delete(studentId);
    }
    return true;
  }
  return false;
}

/**
 * Reset / clean session for a student
 */
export function resetMentorSession(studentId: string): void {
  LEARNING_TWIN_STORE.delete(studentId);
  ACTIVE_SESSION_ID_STORE.delete(studentId);
  SESSIONS_STORE.delete(studentId);
}

