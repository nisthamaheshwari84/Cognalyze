import { NextResponse } from "next/server";
import { getNotifications } from "@/lib/notifications";
import { getAuthenticatedContext } from "@/lib/auth/server";

export async function GET(req: Request) {
  try {
    const auth = await getAuthenticatedContext(req as any);
    const { searchParams } = new URL(req.url);
    const candidateId = auth?.user?.id || (searchParams.get("candidateId") === "student-demo" ? "student-demo" : null);

    if (!candidateId) {
      return NextResponse.json({
        success: true,
        notifications: [],
        unread_count: 0
      });
    }

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
