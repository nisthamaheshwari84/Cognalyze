import { NextResponse } from "next/server";
import { getStudentBadges, evaluateMilestoneBadges, BADGE_DEFINITIONS } from "@/lib/dsa-store";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId") || "student-demo";

    const earned = await evaluateMilestoneBadges(studentId);
    const earnedTypes = new Set(earned.map(b => b.badge_type));

    const catalog = BADGE_DEFINITIONS.map(badgeDef => ({
      ...badgeDef,
      is_earned: earnedTypes.has(badgeDef.type),
      earned_at: earned.find(b => b.badge_type === badgeDef.type)?.earned_at || null
    }));

    return NextResponse.json({
      student_id: studentId,
      earned_count: earned.length,
      badges: catalog
    });
  } catch (error: any) {
    console.error("GET /api/dsa/badges error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch badges" }, { status: 500 });
  }
}
