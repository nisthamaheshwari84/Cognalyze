import { NextResponse } from "next/server";
import { getNotifications } from "@/lib/notifications";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidateId") || searchParams.get("studentId") || "student-demo";
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const { notifications, unread_count } = await getNotifications(candidateId, limit);

    return NextResponse.json({
      success: true,
      notifications,
      unread_count
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
