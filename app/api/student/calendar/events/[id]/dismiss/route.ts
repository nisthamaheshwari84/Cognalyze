import { NextResponse } from "next/server";
import { dismissPersonalEvent } from "@/lib/placement-store";
import { getAuthenticatedContext } from "@/lib/auth/server";

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedContext(req as any);
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized. Dismissing calendar events requires authentication." },
        { status: 401 }
      );
    }

    const params = await props.params;
    const eventId = params.id;

    const result = await dismissPersonalEvent(eventId, auth.user.id);
    if (!result) {
      return NextResponse.json(
        { error: "Event not found or not owned by the authenticated student." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      event_id: eventId,
      is_dismissed: true,
      message: `Event dismissed. It is hidden from active calendar views but preserved for retrospective analytics.`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
