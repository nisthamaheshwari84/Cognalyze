/**
 * COGNALYZE API ROUTE — FRIENDS MULTIPLAYER GD ROOM CONTROLLER
 *
 * Security & Persistence (Phase 2 + Phase 8 Realtime Multiplayer):
 * - Enforces canonical authenticated student identity (zero guest fallback)
 * - Uses Supabase PostgreSQL + local cache via friends-gd-service async methods
 * - Verifies room membership on poll_room, submit_turn, update_presence, and evaluation
 * - Evaluates each human participant strictly on their own isolated spoken turns
 */

import { NextResponse } from "next/server";
import {
  requireAuthenticatedGDStudent,
  GD_NO_STORE_HEADERS
} from "@/lib/gd/api-security";
import {
  createFriendsGDRoomAsync,
  joinFriendsGDRoomAsync,
  startFriendsGDSessionAsync,
  getFriendsRoomStateAsync,
  updateFriendsPresenceAsync,
  submitFriendsTurnAsync,
  finalizeFriendsEvaluationAsync
} from "@/lib/gd/friends-gd-service";
import { getGDSessionByIdAsync } from "@/lib/gd/gd-session-store";
import { submitDisciplinaryAppealAsync } from "@/lib/gd/disciplinary-system";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function jsonNoStore(data: any, status = 200) {
  return NextResponse.json(data, { status, headers: GD_NO_STORE_HEADERS });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action } = body;

    // Suspended users are blocked from rooms, but allowed to submit an appeal
    const guard = await requireAuthenticatedGDStudent(req, {
      allowWhenSuspended: action === "appeal_warning"
    });
    if (!guard.ok) return guard.response;
    const { userId, userName } = guard.student;

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
        return jsonNoStore({ success: false, error: "Missing topicTitle" }, 400);
      }

      const room = await createFriendsGDRoomAsync({
        hostUserId: userId,
        hostName: userName,
        topicTitle,
        topicContext,
        format,
        difficulty,
        durationMinutes,
        maxParticipants
      });

      return jsonNoStore({
        success: true,
        room,
        currentUserId: userId,
        selfUserId: userId,
        selfUserName: userName
      });
    }

    // 2. Join Room
    if (action === "join_room") {
      const { roomCodeOrId } = body;
      if (!roomCodeOrId) {
        return jsonNoStore({ success: false, error: "Missing roomCodeOrId" }, 400);
      }

      const room = await joinFriendsGDRoomAsync({
        roomCodeOrId,
        userId,
        userName
      });

      const session = room.activeSessionId
        ? await getGDSessionByIdAsync(room.activeSessionId, userId).catch(() => null)
        : null;

      return jsonNoStore({
        success: true,
        room,
        sessionId: room.activeSessionId || null,
        session,
        transcripts: session?.transcripts || [],
        currentUserId: userId,
        selfUserId: userId,
        selfUserName: userName
      });
    }

    // 3. Start Discussion Room
    if (action === "start_room") {
      const targetRoomId = body.roomId || body.roomCodeOrId;
      if (!targetRoomId) {
        return jsonNoStore({ success: false, error: "Missing roomId" }, 400);
      }

      const result = await startFriendsGDSessionAsync(targetRoomId, userId);
      const session = result.session || (await getGDSessionByIdAsync(result.sessionId, userId).catch(() => null));
      return jsonNoStore({
        success: true,
        room: result.room,
        sessionId: result.sessionId,
        session,
        transcripts: session?.transcripts || [],
        currentStage: session?.currentStage || "opening",
        currentUserId: userId
      });
    }

    // 4. Poll Room State + Shared Transcript (Membership Enforced)
    if (action === "poll_room") {
      const targetKey = body.roomId || body.roomCodeOrId;
      if (!targetKey) {
        return jsonNoStore({ success: false, error: "Missing roomId" }, 400);
      }

      try {
        const room = await getFriendsRoomStateAsync(targetKey, userId);
        if (!room) {
          return jsonNoStore({ success: false, error: "Room not found" }, 404);
        }
        const session = room.activeSessionId
          ? await getGDSessionByIdAsync(room.activeSessionId, userId).catch(() => null)
          : null;
        return jsonNoStore({
          success: true,
          room,
          sessionId: room.activeSessionId || null,
          currentStage: session?.currentStage || "briefing",
          transcripts: session?.transcripts || [],
          currentUserId: userId
        });
      } catch (err: any) {
        if (String(err?.message || "").includes("Forbidden")) {
          return jsonNoStore({ success: false, error: "forbidden", message: err.message }, 403);
        }
        throw err;
      }
    }

    // 5. Submit Turn in Active Friends GD Room
    if (action === "submit_turn") {
      const targetKey = body.roomId || body.roomCodeOrId;
      const { content, isInterruption = false } = body;
      if (!targetKey || !content) {
        return jsonNoStore({ success: false, error: "Missing roomId or content" }, 400);
      }

      try {
        const result = await submitFriendsTurnAsync({
          roomCodeOrId: targetKey,
          userId,
          userName,
          content: String(content),
          isInterruption: Boolean(isInterruption)
        });
        return jsonNoStore({
          success: true,
          room: result.room,
          sessionId: result.session.sessionId,
          currentStage: result.session.currentStage,
          transcripts: result.session.transcripts,
          recordedTurn: result.recordedTurn,
          coachIntervention: result.coachIntervention || null,
          ejected: result.ejected
        });
      } catch (err: any) {
        if (String(err?.message || "").includes("Forbidden")) {
          return jsonNoStore({ success: false, error: "forbidden", message: err.message }, 403);
        }
        throw err;
      }
    }

    // 6. Update Mic / Hand-Raise Presence
    if (action === "update_presence" || action === "toggle_presence") {
      const targetKey = body.roomId || body.roomCodeOrId;
      const { micActive, handRaised } = body;
      if (!targetKey) {
        return jsonNoStore({ success: false, error: "Missing roomId" }, 400);
      }

      try {
        const room = await updateFriendsPresenceAsync({
          roomCodeOrId: targetKey,
          userId,
          micActive,
          handRaised
        });
        return jsonNoStore({ success: true, room });
      } catch (err: any) {
        if (String(err?.message || "").includes("Forbidden")) {
          return jsonNoStore({ success: false, error: "forbidden", message: err.message }, 403);
        }
        throw err;
      }
    }

    // 7. Finalize Per-Participant Room Evaluation & Student DNA Sync
    if (action === "finalize_room_evaluation") {
      const targetKey = body.roomId || body.roomCodeOrId;
      const closeFlag = body.closeRoom !== undefined ? body.closeRoom : body.closeRoomIfHost;
      if (!targetKey) {
        return jsonNoStore({ success: false, error: "Missing roomId" }, 400);
      }

      try {
        const evalRes = await finalizeFriendsEvaluationAsync({
          roomCodeOrId: targetKey,
          userId,
          userName,
          closeRoom: Boolean(closeFlag)
        });
        return jsonNoStore({
          success: true,
          room: evalRes.room,
          report: evalRes.report,
          dnaSynced: evalRes.dnaSynced,
          dnaSyncReason: evalRes.dnaSyncReason || null
        });
      } catch (err: any) {
        if (String(err?.message || "").includes("Forbidden")) {
          return jsonNoStore({ success: false, error: "forbidden", message: err.message }, 403);
        }
        throw err;
      }
    }

    // 8. Submit Disciplinary Appeal
    if (action === "appeal_warning") {
      const { appealToken, explanation } = body;
      if (!appealToken || !explanation) {
        return jsonNoStore({ success: false, error: "Missing appealToken or explanation" }, 400);
      }

      const result = await submitDisciplinaryAppealAsync({
        appealToken,
        userId,
        explanation
      });

      return jsonNoStore(result, result.success ? 200 : 400);
    }

    return jsonNoStore({ success: false, error: "Unknown action" }, 400);
  } catch (err: any) {
    const msg = String(err?.message || "Action failed");
    const status = msg.includes("suspended") || msg.includes("Only the room host") || msg.includes("Forbidden")
      ? 403
      : msg.includes("not found")
      ? 404
      : 500;
    console.error("[friends-gd] Exception:", err);
    return jsonNoStore({ success: false, error: "action_failed", message: msg }, status);
  }
}
