import { NextResponse } from "next/server";
import {
  getMentorSessionHistory,
  deleteMentorSession
} from "@/lib/mentor/store";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidateId") || "student-demo";

    const sessions = getMentorSessionHistory(candidateId);
    return NextResponse.json({
      success: true,
      sessions
    });
  } catch (err: any) {
    console.error("[GET /api/mentor/history] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to load history" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    const { candidateId = "student-demo", sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const deleted = deleteMentorSession(candidateId, sessionId);
    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    console.error("[DELETE /api/mentor/history] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to delete session" }, { status: 500 });
  }
}
