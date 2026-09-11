import { NextResponse } from "next/server";
import { dismissPersonalEvent } from "@/lib/placement-store";

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const eventId = params.id;

    await dismissPersonalEvent(eventId);

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
