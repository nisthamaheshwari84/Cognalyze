import { NextResponse } from "next/server";
import { markNotificationRead } from "@/lib/notifications";
import { getAuthenticatedContext } from "@/lib/auth/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const auth = await getAuthenticatedContext(req as any);
    const resolvedParams = await Promise.resolve(params);
    const notificationId = resolvedParams.id;

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body optional if studentId query param provided
    }

    const { searchParams } = new URL(req.url);
    const studentId = auth?.user?.id || (searchParams.get("candidateId") === "student-demo" ? "student-demo" : null);

    if (!studentId) {
      return NextResponse.json({ error: "Unauthorized. Please sign in.", success: false }, { status: 401 });
    }

    if (!notificationId) {
      return NextResponse.json({ error: "Notification ID is required" }, { status: 400 });
    }

    const success = await markNotificationRead(notificationId, studentId);

    if (!success) {
      return NextResponse.json(
        { error: "Notification not found or access denied", success: false },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, notification_id: notificationId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
