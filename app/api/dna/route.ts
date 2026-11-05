import { NextResponse } from "next/server";

/**
 * ADR-003 & Phase 1 Audit Remediation: Decommissioned Legacy DNA LLM Route
 * 
 * This legacy route previously used ungrounded LLM prompting and speculative
 * 15-dimension score guesswork with hardcoded 50/75 fallbacks.
 * It has been permanently decommissioned.
 * 
 * Canonical evidence-grounded Student DNA intelligence is provided exclusively
 * via `/api/student-dna` backed by deterministic evaluation in `@/lib/dna/*`.
 */

const DECOMMISSION_PAYLOAD = {
  error: "Gone",
  message: "The legacy speculative DNA endpoint has been decommissioned. Use the canonical evidence-based Student DNA engine at /api/student-dna.",
  status: 410,
};

export async function POST(_req: Request) {
  return NextResponse.json(DECOMMISSION_PAYLOAD, { status: 410 });
}

export async function GET(_req: Request) {
  return NextResponse.json(DECOMMISSION_PAYLOAD, { status: 410 });
}
