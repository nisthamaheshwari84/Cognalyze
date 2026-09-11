import { NextResponse } from "next/server";
import { getCollegeLeaderboard, getLeaderboardPreferences } from "@/lib/dsa-store";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId") || "student-demo";

    const [leaderboard, myPref] = await Promise.all([
      getCollegeLeaderboard(),
      getLeaderboardPreferences(studentId)
    ]);

    return NextResponse.json({
      student_id: studentId,
      my_preference: myPref,
      is_opted_in: myPref.is_opted_in,
      leaderboard
    });
  } catch (error: any) {
    console.error("GET /api/dsa/social/leaderboard error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch leaderboard" }, { status: 500 });
  }
}
