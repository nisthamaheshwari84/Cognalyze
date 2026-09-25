import { NextResponse } from "next/server";

// Truth Contract T7: Cognalyze decommissions emotion AI / pseudoscientific proctoring.
// Never evaluate emotion, facial expressions, body language, or typing cadence.
export async function POST(_req: Request) {
  return NextResponse.json({
    decommissioned: true,
    status: "DECOMMISSIONED",
    message: "Cognalyze Truth Contract T7: Body language / emotion AI proctoring is permanently decommissioned.",
    overall: null,
    posture: null,
    eyeContact: null,
    confidence: null,
    expression: null,
    notes: "Decommissioned per Truth Contract T7 (no emotion AI or body language scoring)."
  });
}