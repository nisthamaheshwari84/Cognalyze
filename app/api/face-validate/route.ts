import { NextResponse } from "next/server";

// Truth Contract T7: Cognalyze decommissions emotion AI / pseudoscientific proctoring.
export async function POST(_req: Request) {
  return NextResponse.json({
    decommissioned: true,
    status: "DECOMMISSIONED",
    valid: true,
    reason: "Facial validation decommissioned per Truth Contract T7",
    quality: "good",
    face_count: 1
  });
}
