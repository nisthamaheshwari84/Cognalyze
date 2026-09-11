import { NextResponse } from "next/server";
import { snoozePersonalEvent } from "@/lib/placement-store";

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const eventId = params.id;
    const body = await req.json().catch(() => ({}));

    // Default snooze until 3 days from now if not specified
    let untilDate = body.until_date || body.snoozed_until;
    if (!untilDate) {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      untilDate = d.toISOString().split("T")[0];
    }

    await snoozePersonalEvent(eventId, untilDate);

    return NextResponse.json({
      success: true,
      event_id: eventId,
      snoozed_until: untilDate,
      message: `Event snoozed until ${untilDate}. It will be hidden from the 7-day priority widget until that date passes.`
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
