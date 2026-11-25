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
import { GDSessionData, GDSimulationFormat, GDDifficultyLevel, GDExperienceMode } from "./types";
import { generateCalibratedAIParticipants } from "./participant-archetypes";
import { generateDynamicAIPanelAsync } from "./dynamic-agent-generator";
import { buildExperienceBlueprintAsync, buildFallbackBlueprint } from "./experience-engine";
import {
  upsertGDSessionCloud,
  fetchGDSessionCloud,
  fetchUserGDSessionsCloud,
  fetchFriendsRoomCloud
} from "./gd-cloud-db";

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
  experienceMode?: GDExperienceMode;
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
    experienceMode = "standard_round",
    difficulty = "intermediate",
    durationMinutes = 15,
    targetRole = "Software Engineer",
    isFriendsRoom = false,
    friendsRoomCode
  } = params;

  const sessionId = `gd_sess_${Date.now()}_${globalThis.crypto.randomUUID().slice(0, 8)}`;
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
    experienceMode,
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
  void upsertGDSessionCloud(session);
  return session;
}

export async function createGDSessionAsync(params: {
  userId: string;
  topicId: string;
  topicTitle: string;
  format?: GDSimulationFormat;
  experienceMode?: GDExperienceMode;
  difficulty?: GDDifficultyLevel;
  durationMinutes?: number;
  targetRole?: string;
  isFriendsRoom?: boolean;
  friendsRoomCode?: string;
}): Promise<GDSessionData> {
  const session = createGDSession(params);

  // Enforce a crisp 4.5s upper bound on optional AI persona/scenario customization so session launch stays snappy
  const initEnrichmentPromise = Promise.all([
    generateDynamicAIPanelAsync({
      topicTitle: session.topicTitle,
      format: session.format,
      difficulty: session.difficulty,
      targetRole: session.targetRole
    }).catch(() => []),
    buildExperienceBlueprintAsync({
      topicTitle: session.topicTitle,
      format: session.format,
      difficulty: session.difficulty,
      experienceMode: params.experienceMode || "standard_round"
    }).catch(() => undefined)
  ]);

  let timeoutHandle: ReturnType<typeof setTimeout> | null = null;
  const deadlinePromise = new Promise<null>((resolve) => {
    timeoutHandle = setTimeout(() => resolve(null), 4500);
  });

  const enriched = await Promise.race([initEnrichmentPromise, deadlinePromise]);
  if (timeoutHandle) clearTimeout(timeoutHandle);

  if (Array.isArray(enriched)) {
    const [dynamicPeers, blueprint] = enriched;
    if (Array.isArray(dynamicPeers) && dynamicPeers.length === 4) {
      const humans = session.participants.filter((p) => p.isHuman);
      session.participants = [...humans, ...dynamicPeers];
    }
    if (blueprint) {
      session.experienceBlueprint = blueprint;
    }
  } else {
    session.experienceBlueprint = buildFallbackBlueprint({
      topicTitle: session.topicTitle,
      format: session.format,
      mode: params.experienceMode || "standard_round"
    });
  }

  inMemorySessions.set(session.sessionId, session);
  persistSessionsToDisk();
  await upsertGDSessionCloud(session);
  return session;
}

export function getGDSessionById(sessionId: string, requestingUserId?: string): GDSessionData | null {
  loadSessionsFromDisk();
  const session = inMemorySessions.get(sessionId);
  if (!session) return null;

  // User isolation check: if requestingUserId is provided, reject if not owner or explicit participant
  if (requestingUserId && session.userId !== requestingUserId) {
    const isHumanParticipant = session.participants.some(
      (p) => p.isHuman && p.userId === requestingUserId
    );
    if (!session.isFriendsRoom || !isHumanParticipant) {
      throw new Error(`[gd-session-store] Unauthorized access: session ${sessionId} does not belong to user ${requestingUserId}`);
    }
  }

  return session;
}

export async function getGDSessionByIdAsync(
  sessionId: string,
  requestingUserId?: string
): Promise<GDSessionData | null> {
  loadSessionsFromDisk();
  let session = inMemorySessions.get(sessionId) || null;
  if (!session) {
    session = await fetchGDSessionCloud(sessionId);
    if (session) {
      inMemorySessions.set(session.sessionId, session);
    }
  }
  if (!session) return null;

  if (requestingUserId && session.userId !== requestingUserId) {
    const isSessionParticipant = session.participants.some(
      (p) => p.isHuman && p.userId === requestingUserId
    );
    let isRoomMember = isSessionParticipant;
    if (!isRoomMember && session.isFriendsRoom && session.friendsRoomCode) {
      const room = await fetchFriendsRoomCloud(session.friendsRoomCode);
      isRoomMember = Boolean(
        room &&
          (room.hostUserId === requestingUserId ||
            room.participants.some((p) => p.userId === requestingUserId))
      );
    }
    if (!isRoomMember) {
      throw new Error(
        `[gd-session-store] Unauthorized access: session ${sessionId} does not belong to user ${requestingUserId}`
      );
    }
  }

  return session;
}

export function saveGDSession(session: GDSessionData): GDSessionData {
  loadSessionsFromDisk();
  const existing = inMemorySessions.get(session.sessionId);

  // Immutability Check: completed sessions cannot be modified or tampered with post-evaluation
  if (existing && existing.lifecycleState === "COMPLETED") {
    const revertedState = session.lifecycleState !== "COMPLETED";
    const postEvalMutation =
      Boolean(existing.evaluationReport) &&
      (session.topicTitle !== existing.topicTitle ||
        session.transcripts.length !== existing.transcripts.length ||
        session.evaluationReport?.overallScore !== existing.evaluationReport?.overallScore);
    if (revertedState || postEvalMutation) {
      throw new Error(
        `[gd-session-store] Immutability violation: completed session ${session.sessionId} cannot be mutated.`
      );
    }
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
  void upsertGDSessionCloud(session);
  return session;
}

export async function saveGDSessionAsync(session: GDSessionData): Promise<GDSessionData> {
  const saved = saveGDSession(session);
  await upsertGDSessionCloud(saved);
  return saved;
}

export function listGDSessionsForUser(userId: string): GDSessionData[] {
  loadSessionsFromDisk();
  return Array.from(inMemorySessions.values())
    .filter(s => s.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function listGDSessionsForUserAsync(userId: string): Promise<GDSessionData[]> {
  loadSessionsFromDisk();
  const cloudRows = await fetchUserGDSessionsCloud(userId);
  for (const row of cloudRows) {
    const existing = inMemorySessions.get(row.sessionId);
    if (!existing || new Date(row.updatedAt).getTime() >= new Date(existing.updatedAt).getTime()) {
      inMemorySessions.set(row.sessionId, row);
    }
  }
  return Array.from(inMemorySessions.values())
    .filter(s => s.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
