import { NextResponse } from "next/server";
import { recordPSInteraction, getProblemStatementById, PSInteractionType } from "@/lib/ai/ps-engine";

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const psId = params.id;
    const body = await req.json();
    const { studentId = "student-demo", interactionType } = body;

    const validTypes: PSInteractionType[] = ["shown", "viewed", "saved", "rejected", "applied", "selected"];
    if (!validTypes.includes(interactionType)) {
      return NextResponse.json(
        { error: `Invalid interactionType. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const ps = getProblemStatementById(psId);
    if (!ps) {
      return NextResponse.json({ error: "Problem statement not found" }, { status: 404 });
    }

    recordPSInteraction(studentId, psId, interactionType);

    return NextResponse.json({
      success: true,
      ps_id: psId,
      student_id: studentId,
      interaction_type: interactionType,
      message: `Interaction '${interactionType}' recorded successfully.`
    });
  } catch (error: any) {
    console.error("POST /api/problem-statements/[id]/interact error:", error);
    return NextResponse.json({ error: error.message || "Failed to record interaction" }, { status: 500 });
  }
}
