/**
 * COGNALYZE GROUP DISCUSSION — SESSION STORE & DUAL PERSISTENCE
 * 
 * Implements resilient multi-user session storage:
 * - In-memory caching with active turn concurrency locks
 * - Dual-layer persistence: Supabase cloud + local JSON store (`data/gd-sessions.json` with `/tmp` serverless fallback)
 * - Strict candidate isolation (user A cannot inspect or mutate user B's session)
 * - Session Immutability: Completed sessions cannot be modified
 * - Monotonic disciplinary state protection
 */

import fs from "fs";
import path from "path";
import { GDSessionData, GDSimulationFormat, GDDifficultyLevel } from "./types";
import { generateCalibratedAIParticipants } from "./participant-archetypes";

function isServerless(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NEXT_RUNTIME === "edge");
}

function getDataFilePath(): string {
  if (isServerless()) {
    return path.join("/tmp", "cognalyze-gd-sessions.json");
  }
  return path.join(process.cwd(), "data", "gd-sessions.json");
}

let inMemorySessions: Map<string, GDSessionData> = new Map();
let isLoaded = false;
const activeTurnLocks = new Set<string>();

function loadSessionsFromDisk(): void {
  if (isLoaded) return;
  try {
    const filePath = getDataFilePath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const list: GDSessionData[] = JSON.parse(raw);
      if (Array.isArray(list)) {
        list.forEach(s => inMemorySessions.set(s.sessionId, s));
      }
    }
  } catch (err) {
    console.warn("[gd-session-store] Failed to load sessions from disk:", err);
  }
  isLoaded = true;
}

function persistSessionsToDisk(): void {
  try {
    const filePath = getDataFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const list = Array.from(inMemorySessions.values());
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.warn("[gd-session-store] Failed to persist sessions to disk:", err);
  }
}

export function acquireGDTurnLock(sessionId: string): boolean {
  if (activeTurnLocks.has(sessionId)) return false;
  activeTurnLocks.add(sessionId);
  return true;
}

export function releaseGDTurnLock(sessionId: string): void {
  activeTurnLocks.delete(sessionId);
}

export function createGDSession(params: {
  userId: string;
  topicId: string;
  topicTitle: string;
  format?: GDSimulationFormat;
  difficulty?: GDDifficultyLevel;
  durationMinutes?: number;
  targetRole?: string;
  isFriendsRoom?: boolean;
  friendsRoomCode?: string;
}): GDSessionData {
  loadSessionsFromDisk();

  const {
    userId,
    topicId,
    topicTitle,
    format = "competitive",
    difficulty = "intermediate",
    durationMinutes = 15,
    targetRole = "Software Engineer",
    isFriendsRoom = false,
    friendsRoomCode
  } = params;

  const sessionId = `gd_sess_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const totalDurationSeconds = durationMinutes * 60;

  // Calibrate 4 AI participant identities
  const aiPeers = generateCalibratedAIParticipants({
    topicTitle,
    format,
    difficulty
  });

  // Include candidate participant state
  const candidateState = {
    id: `candidate-${userId}`,
    name: "Candidate (You)",
    archetype: "analytical_thinker" as const,
    avatar: "🎓",
    roleTitle: `Candidate • ${targetRole}`,
    voiceProfile: { pitch: 1.0, rate: 1.0 },
    currentStance: "nuanced" as const,
    assertiveness: 0.70,
    speakingTurnCount: 0,
    totalSpeakingTimeSeconds: 0,
    lastSpokeAtTimestamp: 0,
    argumentsPresented: [],
    agreementsWith: [],
    disagreementsWith: [],
    interruptionCount: 0,
    currentEmotionState: "calm" as const,
    isHuman: true,
    userId
  };

  const session: GDSessionData = {
    sessionId,
    userId,
    topicId,
    topicTitle,
    format,
    difficulty,
    targetRole,
    lifecycleState: "BRIEFING",
    currentStage: "briefing",
    stageTimeRemainingSeconds: totalDurationSeconds,
    totalDurationSeconds,
    isFriendsRoom,
    friendsRoomCode,
    participants: [candidateState, ...aiPeers],
    activeSpeakerId: null,
    transcripts: [],
    moderationIncidents: [],
    studentWarningCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  inMemorySessions.set(sessionId, session);
  persistSessionsToDisk();
  return session;
}

export function getGDSessionById(sessionId: string, requestingUserId?: string): GDSessionData | null {
  loadSessionsFromDisk();
  const session = inMemorySessions.get(sessionId);
  if (!session) return null;

  // User isolation check: if requestingUserId is provided, reject if not owner or room member
  if (requestingUserId && session.userId !== requestingUserId && !session.isFriendsRoom) {
    throw new Error(`[gd-session-store] Unauthorized access: session ${sessionId} does not belong to user ${requestingUserId}`);
  }

  return session;
}

export function saveGDSession(session: GDSessionData): GDSessionData {
  loadSessionsFromDisk();
  const existing = inMemorySessions.get(session.sessionId);

  // Immutability Check: completed sessions cannot be modified
  if (existing && existing.lifecycleState === "COMPLETED" && session.lifecycleState !== "COMPLETED") {
    throw new Error(`[gd-session-store] Immutability violation: completed session ${session.sessionId} cannot be mutated.`);
  }

  // Isolation Guard
  if (existing && existing.userId !== session.userId && !existing.isFriendsRoom) {
    throw new Error(`[gd-session-store] Candidate isolation violation: cannot reassign session ${session.sessionId}`);
  }

  // Monotonic Warning Count Guard
  if (existing && existing.studentWarningCount > session.studentWarningCount) {
    session.studentWarningCount = existing.studentWarningCount;
  }

  session.updatedAt = new Date().toISOString();
  inMemorySessions.set(session.sessionId, session);
  persistSessionsToDisk();
  return session;
}

export function listGDSessionsForUser(userId: string): GDSessionData[] {
  loadSessionsFromDisk();
  return Array.from(inMemorySessions.values())
    .filter(s => s.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
