import { NextResponse } from "next/server";
import { recordStudentEvent, StudentEvent } from "@/lib/intelligence/student-intelligence";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { studentId = "student-demo", eventType, payload } = body;

    if (!eventType) {
      return NextResponse.json({ error: "Missing eventType" }, { status: 400 });
    }

    const event: StudentEvent = {
      studentId,
      eventType,
      payload: payload || {},
      timestamp: new Date().toISOString()
    };

    const result = await recordStudentEvent(event);

    return NextResponse.json({
      success: true,
      message: `Event ${eventType} recorded and DNA recalculated.`,
      affectedCapabilities: result.affectedCapabilities,
      intelligence: result.newDNAProfile
    });
  } catch (error: any) {
    console.error("POST /api/student/events error:", error);
    return NextResponse.json({ error: error.message || "Failed to record student event" }, { status: 500 });
  }
}
