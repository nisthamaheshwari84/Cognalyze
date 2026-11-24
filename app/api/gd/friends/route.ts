/**
 * COGNALYZE API ROUTE — FRIENDS MULTIPLAYER GD ROOM CONTROLLER
 * 
 * Supports:
 * - Room Creation (POST action: 'create_room')
 * - Room Joining (POST action: 'join_room')
 * - Discussion Launch (POST action: 'start_room')
 * - Room State Polling & Synchronized Audio Roster (GET / POST action: 'poll_room')
 * - Warning & Suspension Appeals (POST action: 'appeal_warning')
 */

import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import {
  createFriendsGDRoom,
  joinFriendsGDRoom,
  startFriendsGDSession,
  getFriendsRoomState
} from "@/lib/gd/friends-gd-service";
import { submitDisciplinaryAppeal, isUserSuspended } from "@/lib/gd/disciplinary-system";

export async function POST(req: Request) {
  try {
    const authCtx = await getAuthenticatedContext(req);
    const userId = authCtx?.user?.id || "guest-user";
    const userName = authCtx?.user?.fullName || "Candidate Friend";

    // Disciplinary suspension check
    const suspension = isUserSuspended(userId);
    if (suspension.suspended) {
      return NextResponse.json(
        {
          success: false,
          error: "account_suspended",
          message: `Your account is currently suspended until ${suspension.expiresAt || "further notice"}. Reason: ${suspension.reason}`,
          appealToken: suspension.appealToken
        },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { action } = body;

    // 1. Create Room
    if (action === "create_room") {
      const {
        topicTitle,
        topicContext,
        format = "competitive",
        difficulty = "intermediate",
        durationMinutes = 15,
        maxParticipants = 6
      } = body;

      if (!topicTitle) {
        return NextResponse.json({ success: false, error: "Missing topicTitle" }, { status: 400 });
      }

      const room = createFriendsGDRoom({
        hostUserId: userId,
        hostName: userName,
        topicTitle,
        topicContext,
        format,
        difficulty,
        durationMinutes,
        maxParticipants
      });

      return NextResponse.json({ success: true, room });
    }

    // 2. Join Room
    if (action === "join_room") {
      const { roomCodeOrId } = body;
      if (!roomCodeOrId) {
        return NextResponse.json({ success: false, error: "Missing roomCodeOrId" }, { status: 400 });
      }

      const room = joinFriendsGDRoom({
        roomCodeOrId,
        userId,
        userName
      });

      return NextResponse.json({ success: true, room });
    }

    // 3. Start Discussion Room
    if (action === "start_room") {
      const { roomId } = body;
      if (!roomId) {
        return NextResponse.json({ success: false, error: "Missing roomId" }, { status: 400 });
      }

      const result = startFriendsGDSession(roomId, userId);
      return NextResponse.json({ success: true, room: result.room, sessionId: result.sessionId });
    }

    // 4. Poll Room State
    if (action === "poll_room") {
      const { roomId } = body;
      const room = getFriendsRoomState(roomId);
      if (!room) {
        return NextResponse.json({ success: false, error: "Room not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, room });
    }

    // 5. Submit Disciplinary Appeal
    if (action === "appeal_warning") {
      const { appealToken, explanation } = body;
      if (!appealToken || !explanation) {
        return NextResponse.json({ success: false, error: "Missing appealToken or explanation" }, { status: 400 });
      }

      const result = submitDisciplinaryAppeal({
        appealToken,
        userId,
        explanation
      });

      return NextResponse.json(result);
    }

    return NextResponse.json({ success: false, error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    console.error("[friends-gd] Exception:", err);
    return NextResponse.json(
      { success: false, error: "action_failed", message: err.message },
      { status: 500 }
    );
  }
}
