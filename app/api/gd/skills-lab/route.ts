/**
 * COGNALYZE API ROUTE — GD SKILLS LAB CONTROLLER (PHASE 9)
 *
 * GET  /api/gd/skills-lab  -> Caller's persisted mastery across the 12 tracks
 * POST /api/gd/skills-lab  -> Start contextual micro-drill / Evaluate response
 */

import { NextResponse } from "next/server";
import { GD_SKILLS_LAB_TRACKS } from "@/components/gd/gd-theme";
import {
  requireAuthenticatedGDStudent,
  GD_NO_STORE_HEADERS
} from "@/lib/gd/api-security";
import {
  getUserSkillsProgressAsync,
  generateSkillDrillScenarioAsync,
  evaluateSkillDrillResponseAsync
} from "@/lib/gd/skills-lab-service";
import { getStudentDNAFull } from "@/lib/dna/store";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function jsonNoStore(data: any, status = 200) {
  return NextResponse.json(data, { status, headers: GD_NO_STORE_HEADERS });
}

export async function GET(req: Request) {
  try {
    const guard = await requireAuthenticatedGDStudent(req, { allowWhenSuspended: true });
    if (!guard.ok) return guard.response;

    const progress = await getUserSkillsProgressAsync(guard.student.userId);
    return jsonNoStore({
      success: true,
      tracks: GD_SKILLS_LAB_TRACKS,
      progress
    });
  } catch (err: any) {
    console.error("[api/gd/skills-lab] GET error:", err);
    return jsonNoStore({ success: false, error: "fetch_failed", message: err?.message }, 500);
  }
}

export async function POST(req: Request) {
  try {
    const guard = await requireAuthenticatedGDStudent(req);
    if (!guard.ok) return guard.response;
    const { userId } = guard.student;

    const body = await req.json();
    const { action, trackId } = body;

    if (!trackId) {
      return jsonNoStore({ success: false, error: "Missing trackId" }, 400);
    }

    if (action === "start_drill") {
      const dna = await getStudentDNAFull(userId).catch(() => null);
      const scenario = await generateSkillDrillScenarioAsync({
        trackId: String(trackId),
        targetRole: dna?.targetRoleTitle || "Software Engineer"
      });
      if (!scenario) {
        return jsonNoStore({ success: false, error: "track_not_found" }, 404);
      }
      return jsonNoStore({ success: true, scenario });
    }

    if (action === "submit_drill") {
      const evalRes = await evaluateSkillDrillResponseAsync({
        userId,
        trackId: String(trackId),
        promptScenario: String(body.promptScenario || ""),
        peerSetupLine: String(body.peerSetupLine || ""),
        studentResponse: String(body.studentResponse || "")
      });

      if ("error" in evalRes) {
        return jsonNoStore({ success: false, error: "validation_failed", message: evalRes.error }, 400);
      }

      const progress = await getUserSkillsProgressAsync(userId);
      return jsonNoStore({
        success: true,
        evaluation: evalRes,
        progress
      });
    }

    return jsonNoStore({ success: false, error: "Unknown action" }, 400);
  } catch (err: any) {
    console.error("[api/gd/skills-lab] POST error:", err);
    return jsonNoStore({ success: false, error: "action_failed", message: err?.message }, 500);
  }
}
