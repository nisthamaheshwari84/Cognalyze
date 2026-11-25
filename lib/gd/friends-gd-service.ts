/**
 * COGNALYZE GROUP DISCUSSION — FRIENDS MULTIPLAYER ROOM SERVICE
 * 
 * Manages peer-to-peer authenticated Friends GD rooms:
 * - Room creation with unique 6-character room codes (e.g. "GD-7492")
 * - Authenticated join validation & participant capacity gating (3 - 8 participants)
 * - Integration with 3-Warning Disciplinary Policy (offenders ejected; session continues)
 * - State synchronization & synchronized discussion timing
 * - Serverless-safe dual persistence (memory + disk + cloud)
 */

import fs from "fs";
import path from "path";
import {
  GDFriendsRoom,
  GDSimulationFormat,
  GDDifficultyLevel,
  GDTranscriptItem,
  GDSessionData
} from "./types";
import { isUserSuspended, isUserSuspendedAsync } from "./disciplinary-system";
import {
  createGDSession,
  createGDSessionAsync,
  getGDSessionByIdAsync,
  saveGDSessionAsync
} from "./gd-session-store";
import {
  upsertGDFriendsRoomCloud,
  fetchFriendsRoomCloud,
  insertGDEvaluationCloud
} from "./gd-cloud-db";
import { evaluateCoachIntervention } from "./coach-moderator-engine";
import { updateParticipantMemoryAfterTurn } from "./dynamic-agent-generator";
import { evaluateGDSessionAsync } from "./evaluation-engine";
import { syncGDReportToStudentDNAAsync } from "./dna-sync";
import { transitionLifecycleState } from "./session-state-machine";

function isServerless(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NEXT_RUNTIME === "edge");
}

function getFriendsRoomsFilePath(): string {
  if (isServerless()) {
    return path.join("/tmp", "cognalyze-gd-friends-rooms.json");
  }
  return path.join(process.cwd(), "data", "gd-friends-rooms.json");
}

let inMemoryRooms: Map<string, GDFriendsRoom> = new Map();
let isLoaded = false;

function loadRoomsFromDisk(): void {
  if (isLoaded) return;
  try {
    const filePath = getFriendsRoomsFilePath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      const list: GDFriendsRoom[] = JSON.parse(data);
      if (Array.isArray(list)) {
        list.forEach(r => inMemoryRooms.set(r.roomId, r));
      }
    }
  } catch (err) {
    console.warn("[friends-gd-service] Failed to load rooms:", err);
  }
  isLoaded = true;
}

function persistRoomsToDisk(): void {
  try {
    const filePath = getFriendsRoomsFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    const list = Array.from(inMemoryRooms.values());
    fs.writeFileSync(filePath, JSON.stringify(list, null, 2), "utf-8");
  } catch (err) {
    console.warn("[friends-gd-service] Failed to persist rooms:", err);
  }
}

function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const randomBytes = new Uint32Array(4);
  globalThis.crypto.getRandomValues(randomBytes);
  let code = "GD-";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(randomBytes[i] % chars.length);
  }
  return code;
}

export function createFriendsGDRoom(params: {
  hostUserId: string;
  hostName: string;
  topicTitle: string;
  topicContext?: string;
  format?: GDSimulationFormat;
  difficulty?: GDDifficultyLevel;
  durationMinutes?: number;
  maxParticipants?: number;
}): GDFriendsRoom {
  loadRoomsFromDisk();

  const {
    hostUserId,
    hostName,
    topicTitle,
    topicContext,
    format = "competitive",
    difficulty = "intermediate",
    durationMinutes = 15,
    maxParticipants = 6
  } = params;

  // Check if host is suspended
  const suspensionCheck = isUserSuspended(hostUserId);
  if (suspensionCheck.suspended) {
    throw new Error(`Cannot create room: Your account is suspended until ${suspensionCheck.expiresAt || "further notice"}. Reason: ${suspensionCheck.reason}`);
  }

  const roomId = `room_${Date.now()}_${globalThis.crypto.randomUUID().slice(0, 8)}`;
  const roomCode = generateRoomCode();

  const room: GDFriendsRoom = {
    roomId,
    roomCode,
    hostUserId,
    hostName,
    topicTitle,
    topicContext,
    format,
    difficulty,
    durationMinutes,
    status: "WAITING_ROOM",
    maxParticipants: Math.min(8, Math.max(3, maxParticipants)),
    participants: [
      {
        userId: hostUserId,
        fullName: hostName,
        avatar: "👑",
        isHost: true,
        micActive: false,
        handRaised: false,
        warningCount: 0,
        isSuspended: false,
        joinedAt: new Date().toISOString(),
        lastPingAt: new Date().toISOString()
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  inMemoryRooms.set(roomId, room);
  persistRoomsToDisk();
  void upsertGDFriendsRoomCloud(room);
  return room;
}

export async function createFriendsGDRoomAsync(params: {
  hostUserId: string;
  hostName: string;
  topicTitle: string;
  topicContext?: string;
  format?: GDSimulationFormat;
  difficulty?: GDDifficultyLevel;
  durationMinutes?: number;
  maxParticipants?: number;
}): Promise<GDFriendsRoom> {
  const suspensionCheck = await isUserSuspendedAsync(params.hostUserId);
  if (suspensionCheck.suspended) {
    throw new Error(
      `Cannot create room: Your account is suspended until ${suspensionCheck.expiresAt || "further notice"}. Reason: ${suspensionCheck.reason}`
    );
  }
  const room = createFriendsGDRoom(params);
  await upsertGDFriendsRoomCloud(room);
  return room;
}

export function joinFriendsGDRoom(params: {
  roomCodeOrId: string;
  userId: string;
  userName: string;
}): GDFriendsRoom {
  loadRoomsFromDisk();
  const { roomCodeOrId, userId, userName } = params;

  // Check disciplinary suspension
  const suspensionCheck = isUserSuspended(userId);
  if (suspensionCheck.suspended) {
    throw new Error(`Access Denied: Your account is suspended until ${suspensionCheck.expiresAt || "further notice"}. Reason: ${suspensionCheck.reason}`);
  }

  // Find room by code or ID
  const room = Array.from(inMemoryRooms.values()).find(
    r => r.roomId === roomCodeOrId || r.roomCode.toUpperCase() === roomCodeOrId.trim().toUpperCase()
  );

  if (!room) {
    throw new Error(`Room "${roomCodeOrId}" not found. Verify the room code and try again.`);
  }

  if (room.status === "COMPLETED" || room.status === "ABORTED") {
    throw new Error(`This Friends GD room has concluded.`);
  }

  // Check if user is already in the room
  const existingIdx = room.participants.findIndex(p => p.userId === userId);
  if (existingIdx !== -1) {
    room.participants[existingIdx].lastPingAt = new Date().toISOString();
    room.updatedAt = new Date().toISOString();
    persistRoomsToDisk();
    return room;
  }

  // Capacity check
  if (room.participants.length >= room.maxParticipants) {
    throw new Error(`Room is at maximum capacity (${room.maxParticipants} participants).`);
  }

  room.participants.push({
    userId,
    fullName: userName,
    avatar: "🎓",
    isHost: false,
    micActive: false,
    handRaised: false,
    warningCount: 0,
    isSuspended: false,
    joinedAt: new Date().toISOString(),
    lastPingAt: new Date().toISOString()
  });

  room.updatedAt = new Date().toISOString();
  persistRoomsToDisk();
  void upsertGDFriendsRoomCloud(room);
  return room;
}

export async function joinFriendsGDRoomAsync(params: {
  roomCodeOrId: string;
  userId: string;
  userName: string;
}): Promise<GDFriendsRoom> {
  loadRoomsFromDisk();
  const { roomCodeOrId, userId, userName } = params;

  const suspensionCheck = await isUserSuspendedAsync(userId);
  if (suspensionCheck.suspended) {
    throw new Error(
      `Access Denied: Your account is suspended until ${suspensionCheck.expiresAt || "further notice"}. Reason: ${suspensionCheck.reason}`
    );
  }

  let room = Array.from(inMemoryRooms.values()).find(
    (r) => r.roomId === roomCodeOrId || r.roomCode.toUpperCase() === roomCodeOrId.trim().toUpperCase()
  ) || null;

  if (!room) {
    room = await fetchFriendsRoomCloud(roomCodeOrId);
    if (room) inMemoryRooms.set(room.roomId, room);
  }

  if (!room) {
    throw new Error(`Room "${roomCodeOrId}" not found. Verify the room code and try again.`);
  }

  if (room.status === "COMPLETED" || room.status === "ABORTED") {
    throw new Error(`This Friends GD room has concluded.`);
  }

  const existingIdx = room.participants.findIndex((p) => p.userId === userId);
  if (existingIdx !== -1) {
    room.participants[existingIdx].lastPingAt = new Date().toISOString();
    room.updatedAt = new Date().toISOString();
    inMemoryRooms.set(room.roomId, room);
    persistRoomsToDisk();
    await upsertGDFriendsRoomCloud(room);
    return room;
  }

  if (room.participants.length >= room.maxParticipants) {
    throw new Error(`Room is at maximum capacity (${room.maxParticipants} participants).`);
  }

  room.participants.push({
    userId,
    fullName: userName,
    avatar: "🎓",
    isHost: false,
    micActive: false,
    handRaised: false,
    warningCount: 0,
    isSuspended: false,
    joinedAt: new Date().toISOString(),
    lastPingAt: new Date().toISOString()
  });

  room.updatedAt = new Date().toISOString();
  inMemoryRooms.set(room.roomId, room);
  persistRoomsToDisk();
  await upsertGDFriendsRoomCloud(room);
  return room;
}

export function startFriendsGDSession(roomId: string, requestingHostUserId: string): { room: GDFriendsRoom; sessionId: string } {
  loadRoomsFromDisk();
  const room = inMemoryRooms.get(roomId);
  if (!room) throw new Error("Room not found.");

  if (room.hostUserId !== requestingHostUserId) {
    throw new Error("Only the room host can start the discussion.");
  }

  if (room.status === "IN_PROGRESS" && room.activeSessionId) {
    return { room, sessionId: room.activeSessionId };
  }

  // Initialize unified GD session for this friends room
  const gdSession = createGDSession({
    userId: room.hostUserId,
    topicId: `topic_${room.roomId}`,
    topicTitle: room.topicTitle,
    format: room.format,
    difficulty: room.difficulty,
    durationMinutes: room.durationMinutes,
    isFriendsRoom: true,
    friendsRoomCode: room.roomCode
  });

  room.status = "IN_PROGRESS";
  room.activeSessionId = gdSession.sessionId;
  room.updatedAt = new Date().toISOString();
  persistRoomsToDisk();
  void upsertGDFriendsRoomCloud(room);

  return { room, sessionId: gdSession.sessionId };
}

export async function startFriendsGDSessionAsync(
  roomId: string,
  requestingHostUserId: string
): Promise<{ room: GDFriendsRoom; sessionId: string; session: GDSessionData }> {
  loadRoomsFromDisk();
  let room = inMemoryRooms.get(roomId) || (await fetchFriendsRoomCloud(roomId));
  if (!room) throw new Error("Room not found.");
  inMemoryRooms.set(room.roomId, room);

  if (room.hostUserId !== requestingHostUserId) {
    throw new Error("Only the room host can start the discussion.");
  }

  if (room.status === "IN_PROGRESS" && room.activeSessionId) {
    const existingSess = await getGDSessionByIdAsync(room.activeSessionId, requestingHostUserId);
    if (existingSess) {
      return { room, sessionId: room.activeSessionId, session: existingSess };
    }
  }

  const gdSession = await createGDSessionAsync({
    userId: room.hostUserId,
    topicId: `topic_${room.roomId}`,
    topicTitle: room.topicTitle,
    format: room.format,
    difficulty: room.difficulty,
    durationMinutes: room.durationMinutes,
    isFriendsRoom: true,
    friendsRoomCode: room.roomCode
  });

  // Ensure every joined human student has an isolated candidate state in the shared session
  const aiPeers = gdSession.participants.filter((p) => !p.isHuman);
  const humanParticipants = room.participants.map((p) => ({
    id: `candidate-${p.userId}`,
    name: p.fullName,
    archetype: "analytical_thinker" as const,
    avatar: p.avatar || "🎓",
    roleTitle: p.isHost ? "Room Host • Candidate" : "Peer Candidate",
    voiceProfile: { pitch: 1.0, rate: 1.0 },
    currentStance: "nuanced" as const,
    assertiveness: 0.72,
    speakingTurnCount: 0,
    totalSpeakingTimeSeconds: 0,
    lastSpokeAtTimestamp: 0,
    argumentsPresented: [],
    agreementsWith: [],
    disagreementsWith: [],
    interruptionCount: 0,
    currentEmotionState: "calm" as const,
    isHuman: true,
    userId: p.userId
  }));
  gdSession.participants = [...humanParticipants, ...aiPeers.slice(0, Math.max(0, 4 - humanParticipants.length))];
  gdSession.lifecycleState = "ACTIVE_DISCUSSION";
  gdSession.currentStage = "opening";
  gdSession.transcripts = [
    {
      id: `turn-friends-intro-${Date.now()}`,
      speakerId: "moderator-alex",
      speakerName: "Alex (Moderator)",
      speakerAvatar: "🎙️",
      speakerRole: "AI Room Moderator",
      isHuman: false,
      content: `Friends Multiplayer GD started for "${room.topicTitle}" (${room.participants.length} participants). Respect turn etiquette—constructive disagreement is encouraged; floor is open!`,
      timestamp: Date.now(),
      formattedTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      stage: "opening"
    }
  ];
  await saveGDSessionAsync(gdSession);

  room.status = "IN_PROGRESS";
  room.activeSessionId = gdSession.sessionId;
  room.updatedAt = new Date().toISOString();
  inMemoryRooms.set(room.roomId, room);
  persistRoomsToDisk();
  await upsertGDFriendsRoomCloud(room);

  return { room, sessionId: gdSession.sessionId, session: gdSession };
}

export function getFriendsRoomState(roomId: string): GDFriendsRoom | null {
  loadRoomsFromDisk();
  return inMemoryRooms.get(roomId) || null;
}

export async function getFriendsRoomStateAsync(
  roomCodeOrId: string,
  requestingUserId?: string
): Promise<GDFriendsRoom | null> {
  loadRoomsFromDisk();
  let room =
    inMemoryRooms.get(roomCodeOrId) ||
    Array.from(inMemoryRooms.values()).find(
      (r) => r.roomCode.toUpperCase() === roomCodeOrId.trim().toUpperCase()
    ) ||
    null;

  const cloudRoom = await fetchFriendsRoomCloud(roomCodeOrId);
  if (cloudRoom) {
    room = cloudRoom;
    inMemoryRooms.set(cloudRoom.roomId, cloudRoom);
  }
  if (!room) return null;

  if (requestingUserId) {
    const isMember =
      room.hostUserId === requestingUserId ||
      room.participants.some((p) => p.userId === requestingUserId);
    if (!isMember) {
      throw new Error(`Forbidden: User ${requestingUserId} is not a member of room ${room.roomCode}.`);
    }
  }

  return room;
}

export function ejectParticipantForMisconduct(roomId: string, targetUserId: string): GDFriendsRoom {
  loadRoomsFromDisk();
  const room = inMemoryRooms.get(roomId);
  if (!room) throw new Error("Room not found.");

  room.participants = room.participants.filter(p => p.userId !== targetUserId);
  room.updatedAt = new Date().toISOString();
  persistRoomsToDisk();
  void upsertGDFriendsRoomCloud(room);
  return room;
}

export async function updateFriendsPresenceAsync(params: {
  roomCodeOrId: string;
  userId: string;
  micActive?: boolean;
  handRaised?: boolean;
}): Promise<GDFriendsRoom> {
  const room = await getFriendsRoomStateAsync(params.roomCodeOrId, params.userId);
  if (!room) throw new Error("Room not found.");

  const idx = room.participants.findIndex((p) => p.userId === params.userId);
  if (idx === -1) throw new Error("Forbidden: Participant not in room.");

  if (typeof params.micActive === "boolean") {
    room.participants[idx].micActive = params.micActive;
  }
  if (typeof params.handRaised === "boolean") {
    room.participants[idx].handRaised = params.handRaised;
  }
  room.participants[idx].lastPingAt = new Date().toISOString();
  room.updatedAt = new Date().toISOString();

  inMemoryRooms.set(room.roomId, room);
  persistRoomsToDisk();
  await upsertGDFriendsRoomCloud(room);
  return room;
}

export async function submitFriendsTurnAsync(params: {
  roomCodeOrId: string;
  userId: string;
  userName: string;
  content: string;
  isInterruption?: boolean;
}): Promise<{
  room: GDFriendsRoom;
  session: GDSessionData;
  recordedTurn: GDTranscriptItem;
  coachIntervention?: GDTranscriptItem;
  ejected: boolean;
}> {
  const room = await getFriendsRoomStateAsync(params.roomCodeOrId, params.userId);
  if (!room) throw new Error("Room not found.");
  if (room.status !== "IN_PROGRESS" || !room.activeSessionId) {
    throw new Error("Room discussion is not currently in progress.");
  }

  const cleanText = params.content.trim();
  if (!cleanText) {
    throw new Error("Intervention content cannot be empty.");
  }

  const session = await getGDSessionByIdAsync(room.activeSessionId, params.userId);
  if (!session) throw new Error("Active session state not found.");

  const speakerId = `candidate-${params.userId}`;
  const recordedTurn: GDTranscriptItem = {
    id: `turn-friend-${params.userId.slice(0, 6)}-${Date.now()}`,
    speakerId,
    speakerName: params.userName,
    speakerAvatar: room.hostUserId === params.userId ? "👑" : "🎓",
    speakerRole: room.hostUserId === params.userId ? "Host Candidate" : "Peer Candidate",
    isHuman: true,
    content: cleanText,
    timestamp: Date.now(),
    formattedTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    stage: session.currentStage,
    isInterruption: Boolean(params.isInterruption)
  };

  session.transcripts.push(recordedTurn);

  // Ensure human participant slot exists & track turns
  let participantState = session.participants.find((p) => p.id === speakerId);
  if (!participantState) {
    participantState = {
      id: speakerId,
      name: params.userName,
      archetype: "analytical_thinker",
      avatar: "🎓",
      roleTitle: "Peer Candidate",
      voiceProfile: { pitch: 1.0, rate: 1.0 },
      currentStance: "nuanced",
      assertiveness: 0.72,
      speakingTurnCount: 0,
      totalSpeakingTimeSeconds: 0,
      lastSpokeAtTimestamp: 0,
      argumentsPresented: [],
      agreementsWith: [],
      disagreementsWith: [],
      interruptionCount: 0,
      currentEmotionState: "calm",
      isHuman: true,
      userId: params.userId
    };
    session.participants.push(participantState);
  }
  participantState.speakingTurnCount += 1;
  participantState.lastSpokeAtTimestamp = Date.now();
  if (params.isInterruption) participantState.interruptionCount += 1;

  updateParticipantMemoryAfterTurn({
    session,
    speakerId,
    utterance: cleanText,
    stage: session.currentStage
  });

  // Run Coach & 3-Warning Disciplinary check on this exact human turn
  const secondsElapsed = Math.max(
    0,
    Math.round((Date.now() - new Date(session.createdAt).getTime()) / 1000)
  );
  const coachDecision = await evaluateCoachIntervention({
    sessionId: session.sessionId,
    topicTitle: session.topicTitle,
    format: session.format,
    difficulty: session.difficulty,
    currentStage: session.currentStage,
    secondsElapsed,
    totalDurationSeconds: session.totalDurationSeconds,
    participants: session.participants,
    transcripts: session.transcripts,
    studentUserId: params.userId,
    studentName: params.userName,
    isFriendsRoom: true,
    roomCode: room.roomCode,
    experienceBlueprint: session.experienceBlueprint
  });

  let coachIntervention: GDTranscriptItem | undefined;
  let ejected = false;
  let updatedRoom = room;

  if (coachDecision.shouldIntervene && coachDecision.moderatorUtterance) {
    if (coachDecision.incident) {
      session.moderationIncidents.push(coachDecision.incident);
      const pIdx = updatedRoom.participants.findIndex((p) => p.userId === params.userId);
      if (pIdx !== -1) {
        updatedRoom.participants[pIdx].warningCount += 1;
      }
      if (coachDecision.incident.disciplinaryActionTaken === "account_suspended") {
        ejected = true;
        updatedRoom = ejectParticipantForMisconduct(room.roomId, params.userId);
      }
    }

    if (coachDecision.newStage) {
      session.currentStage = coachDecision.newStage;
    }

    coachIntervention = {
      id: `turn-friends-coach-${Date.now()}`,
      speakerId: "moderator-alex",
      speakerName: "Alex (Discussion Director)",
      speakerAvatar: "🎙️",
      speakerRole: "Always-Present Evaluator & Moderator",
      isHuman: false,
      content: coachDecision.moderatorUtterance,
      timestamp: Date.now() + 1,
      formattedTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      stage: session.currentStage
    };
    session.transcripts.push(coachIntervention);
  }

  await saveGDSessionAsync(session);
  updatedRoom.updatedAt = new Date().toISOString();
  inMemoryRooms.set(updatedRoom.roomId, updatedRoom);
  persistRoomsToDisk();
  await upsertGDFriendsRoomCloud(updatedRoom);

  return {
    room: updatedRoom,
    session,
    recordedTurn,
    coachIntervention,
    ejected
  };
}

export async function finalizeFriendsEvaluationAsync(params: {
  roomCodeOrId: string;
  userId: string;
  userName: string;
  closeRoom?: boolean;
}) {
  const room = await getFriendsRoomStateAsync(params.roomCodeOrId, params.userId);
  if (!room) throw new Error("Room not found.");
  if (!room.activeSessionId) throw new Error("Room has no active session to evaluate.");

  const session = await getGDSessionByIdAsync(room.activeSessionId, params.userId);
  if (!session) throw new Error("Session not found.");

  const report = await evaluateGDSessionAsync(session, {
    targetUserId: params.userId,
    targetUserName: params.userName
  });

  const dnaSync = await syncGDReportToStudentDNAAsync({
    userId: params.userId,
    report
  }).catch(() => ({
    synced: false,
    reason: "sync_failed",
    recordedEvidenceIds: []
  }));

  await insertGDEvaluationCloud({
    session,
    userId: params.userId,
    report,
    dnaSynced: dnaSync.synced
  });

  if (params.closeRoom && room.hostUserId === params.userId) {
    room.status = "COMPLETED";
    room.updatedAt = new Date().toISOString();
    inMemoryRooms.set(room.roomId, room);
    persistRoomsToDisk();
    await upsertGDFriendsRoomCloud(room);
    if (session.lifecycleState !== "COMPLETED") {
      const closed = transitionLifecycleState(session, "COMPLETED");
      await saveGDSessionAsync(closed);
    }
  }

  return {
    room,
    report,
    dnaSynced: dnaSync.synced,
    dnaSyncReason: dnaSync.reason || null
  };
}
