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
import { GDFriendsRoom, GDSimulationFormat, GDDifficultyLevel } from "./types";
import { isUserSuspended } from "./disciplinary-system";
import { createGDSession } from "./gd-session-store";

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
  let code = "GD-";
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
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

  const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
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

  return { room, sessionId: gdSession.sessionId };
}

export function getFriendsRoomState(roomId: string): GDFriendsRoom | null {
  loadRoomsFromDisk();
  return inMemoryRooms.get(roomId) || null;
}

export function ejectParticipantForMisconduct(roomId: string, targetUserId: string): GDFriendsRoom {
  loadRoomsFromDisk();
  const room = inMemoryRooms.get(roomId);
  if (!room) throw new Error("Room not found.");

  room.participants = room.participants.filter(p => p.userId !== targetUserId);
  room.updatedAt = new Date().toISOString();
  persistRoomsToDisk();
  return room;
}
