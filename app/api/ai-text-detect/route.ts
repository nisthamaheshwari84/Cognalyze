import { NextResponse } from "next/server";

// Truth Contract T7: Cognalyze decommissions emotion AI / pseudoscientific proctoring.
// Never evaluate emotion, facial expressions, body language, or typing cadence.
// AI text detection based on subjective writing style/vocabulary is decommissioned.
export async function POST(_req: Request) {
  return NextResponse.json({
    decommissioned: true,
    status: "DECOMMISSIONED",
    isAI: false,
    confidence: 0,
    ai_score: 0,
    signals_found: [],
    verdict: "AI stylistic detection decommissioned per Truth Contract T7 (no subjective style or pacing penalties)",
    risk_level: "NONE"
  });
}