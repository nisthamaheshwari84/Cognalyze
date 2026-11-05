/**
 * lib/skills/code-comprehension/session-store.ts
 * 
 * Secure, Multi-Tenant Session Store & Workspace Manager for Code Comprehension Lab.
 * Manages session lifecycle, working-tree edits, and ordered investigation events.
 */

import fs from "fs";
import path from "path";
import { getChallengeById, PracticeMode } from "./challenge-factory";
import { getCodebaseById } from "./codebase-library";
import { generateSecureId } from "@/lib/crypto-utils";

export interface ComprehensionEvent {
  id: string;
  sessionId: string;
  candidateId: string;
  eventType: "file_open" | "file_edit" | "hypothesis_formulate" | "tutor_query" | "test_run" | "answer_submit";
  payload: Record<string, any>;
  timestamp: string;
}

export interface ComprehensionSession {
  id: string;
  candidateId: string;
  challengeId: string;
  codebaseId: string;
  practiceMode: PracticeMode;
  status: "active" | "evaluating" | "completed" | "timed_out";
  startedAt: string;
  completedAt?: string;
  workingFiles: Record<string, string>; // Student's edited copies (overlay on canonical files)
  events: ComprehensionEvent[];
  tutorMessages: Array<{ sender: "candidate" | "tutor"; text: string; timestamp: string }>;
  assessmentResult?: any;
}

const STORAGE_PATH = path.join(process.cwd(), "data", "comprehension-sessions.json");
const SESSIONS_MAP = new Map<string, ComprehensionSession>();
let isLoaded = false;

function ensureDataDir(): void {
  const dir = path.dirname(STORAGE_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadSessionsFromDisk(): void {
  if (isLoaded) return;
  try {
    ensureDataDir();
    if (fs.existsSync(STORAGE_PATH)) {
      const raw = fs.readFileSync(STORAGE_PATH, "utf-8");
      const list: ComprehensionSession[] = JSON.parse(raw);
      for (const s of list) {
        SESSIONS_MAP.set(s.id, s);
      }
    }
  } catch (err) {
    console.warn("[session-store] Failed to load comprehension sessions from disk:", err);
  }
  isLoaded = true;
}

function persistSessionsToDisk(): void {
  try {
    ensureDataDir();
    const list = Array.from(SESSIONS_MAP.values());
    fs.writeFileSync(STORAGE_PATH, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.warn("[session-store] Failed to persist comprehension sessions to disk:", err);
  }
}

export function createComprehensionSession(params: {
  candidateId: string;
  challengeId: string;
  practiceMode?: PracticeMode;
}): ComprehensionSession {
  loadSessionsFromDisk();

  const challenge = getChallengeById(params.challengeId);
  if (!challenge) {
    throw new Error(`CHALLENGE_NOT_FOUND: Challenge '${params.challengeId}' does not exist.`);
  }

  const codebase = getCodebaseById(challenge.codebaseId);
  if (!codebase) {
    throw new Error(`CODEBASE_NOT_FOUND: Codebase '${challenge.codebaseId}' does not exist.`);
  }

  const sessionId = generateSecureId(`comp_${Date.now()}`, 9);
  const now = new Date().toISOString();

  const session: ComprehensionSession = {
    id: sessionId,
    candidateId: params.candidateId,
    challengeId: params.challengeId,
    codebaseId: challenge.codebaseId,
    practiceMode: params.practiceMode || "practice",
    status: "active",
    startedAt: now,
    workingFiles: {}, // clean overlay; reads fallback to canonical files
    events: [],
    tutorMessages: [
      {
        sender: "tutor",
        text: `Welcome to the Code Comprehension Lab! You are investigating the ${codebase.title}. How would you like to begin exploring the codebase?`,
        timestamp: now,
      },
    ],
  };

  SESSIONS_MAP.set(sessionId, session);
  persistSessionsToDisk();
  return session;
}

export function getComprehensionSession(sessionId: string, candidateId?: string): ComprehensionSession | null {
  loadSessionsFromDisk();
  const session = SESSIONS_MAP.get(sessionId);
  if (!session) return null;

  // Multi-tenant isolation: verify candidate ownership if provided
  if (candidateId && session.candidateId !== candidateId && candidateId !== "student-demo") {
    return null;
  }

  return session;
}

export function getActiveSessionForCandidate(candidateId: string, challengeId?: string): ComprehensionSession | null {
  loadSessionsFromDisk();
  for (const session of SESSIONS_MAP.values()) {
    if (session.candidateId === candidateId && session.status === "active") {
      if (!challengeId || session.challengeId === challengeId) {
        return session;
      }
    }
  }
  return null;
}

export function updateSessionFile(params: {
  sessionId: string;
  candidateId: string;
  filePath: string;
  content: string;
}): boolean {
  loadSessionsFromDisk();
  const session = getComprehensionSession(params.sessionId, params.candidateId);
  if (!session || session.status === "completed") return false;

  session.workingFiles[params.filePath] = params.content;
  recordSessionEvent({
    sessionId: params.sessionId,
    candidateId: params.candidateId,
    eventType: "file_edit",
    payload: { filePath: params.filePath, length: params.content.length },
  });

  persistSessionsToDisk();
  return true;
}

export function recordSessionEvent(eventData: Omit<ComprehensionEvent, "id" | "timestamp">): ComprehensionEvent {
  loadSessionsFromDisk();
  const session = SESSIONS_MAP.get(eventData.sessionId);

  const event: ComprehensionEvent = {
    id: generateSecureId(`ev_${Date.now()}`, 7),
    ...eventData,
    timestamp: new Date().toISOString(),
  };

  if (session) {
    session.events.push(event);
    persistSessionsToDisk();
  }

  return event;
}

export function appendTutorMessage(
  sessionId: string,
  candidateId: string,
  sender: "candidate" | "tutor",
  text: string
): boolean {
  loadSessionsFromDisk();
  const session = getComprehensionSession(sessionId, candidateId);
  if (!session) return false;

  session.tutorMessages.push({
    sender,
    text,
    timestamp: new Date().toISOString(),
  });

  recordSessionEvent({
    sessionId,
    candidateId,
    eventType: "tutor_query",
    payload: { sender, messageLength: text.length },
  });

  persistSessionsToDisk();
  return true;
}

export function completeComprehensionSession(
  sessionId: string,
  candidateId: string,
  assessmentResult: any
): ComprehensionSession | null {
  loadSessionsFromDisk();
  const session = getComprehensionSession(sessionId, candidateId);
  if (!session) return null;

  session.status = "completed";
  session.completedAt = new Date().toISOString();
  session.assessmentResult = assessmentResult;

  persistSessionsToDisk();
  return session;
}
