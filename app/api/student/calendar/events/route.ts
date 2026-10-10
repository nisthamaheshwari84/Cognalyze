import { NextResponse } from "next/server";
import { createPersonalEvent } from "@/lib/placement-store";
import { getAuthenticatedContext } from "@/lib/auth/server";

export async function POST(req: Request) {
  try {
    const auth = await getAuthenticatedContext(req as any);
    if (!auth) {
      return NextResponse.json(
        { error: "Unauthorized. Creating calendar events requires authentication." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const studentId = auth.user.id;
    const title = body.title;
    const eventDate = body.event_date || body.date;
    let eventType = body.event_type || "practice_session";
    if (eventType === "interview") eventType = "practice_session";
    const notes = body.notes || "";
    const linkedOpportunityId = body.linked_opportunity_id || null;

    if (!title || !eventDate) {
      return NextResponse.json(
        { error: "Missing required fields: title and event_date are mandatory." },
        { status: 400 }
      );
    }

    const validTypes = ["exam", "reminder", "practice_session", "other"];
    if (!validTypes.includes(eventType)) {
      return NextResponse.json(
        { error: `Invalid event_type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const newEvent = await createPersonalEvent({
      student_id: studentId,
      title,
      event_date: eventDate,
      event_type: eventType,
      notes,
      linked_opportunity_id: linkedOpportunityId,
      is_dismissed: false,
      snoozed_until: null
    });

    return NextResponse.json({ success: true, event: newEvent });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
