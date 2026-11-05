import { NextResponse } from "next/server";

/**
 * Truth Contract T7 & ADR-002: Decommissioned Legacy Match Evaluation Route
 * 
 * This legacy route previously used LLM category guesswork, ungrounded honeypot
 * penalties, and obsolete institutional/employer prestige tiers.
 * It has been permanently decommissioned per Truth Contract T7.
 * 
 * Canonical candidate screening and match evaluation are performed deterministically
 * via Policy A in `@/lib/screening/candidate-screening-engine`.
 */

const DECOMMISSION_PAYLOAD = {
  error: "Gone",
  message: "The legacy match evaluation endpoint has been decommissioned per Truth Contract T7. Use the canonical Policy A screening engine.",
  status: 410,
};

export async function POST(_req: Request) {
  return NextResponse.json(DECOMMISSION_PAYLOAD, { status: 410 });
}

export async function GET(_req: Request) {
  return NextResponse.json(DECOMMISSION_PAYLOAD, { status: 410 });
}
