import { NextResponse } from "next/server";
import { updateLeaderboardPreference } from "@/lib/dsa-store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { studentId = "student-demo", isOptedIn, displayHandle } = body;

    if (typeof isOptedIn !== "boolean") {
      return NextResponse.json({ error: "Missing boolean isOptedIn flag" }, { status: 400 });
    }

    const updated = await updateLeaderboardPreference(studentId, isOptedIn, displayHandle);
    return NextResponse.json({
      success: true,
      preference: updated
    });
  } catch (error: any) {
    console.error("POST /api/dsa/social/leaderboard/toggle error:", error);
    return NextResponse.json({ error: error.message || "Failed to update leaderboard preference" }, { status: 500 });
  }
}
