import crypto from "crypto";
import { NextResponse } from "next/server";
import { extractOpportunityFromDescription } from "@/lib/ai/placement-intelligence";
import { getAllOpportunities, insertOpportunity } from "@/lib/placement-store";

function timingSafeKeyMatch(provided: string, expected: string): boolean {
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function verifyAdminAuth(req: Request): boolean {
  const adminKey = (req.headers.get("x-admin-key") || "").trim();
  const expectedKey = (process.env.ADMIN_API_KEY || "").trim();
  if (!expectedKey || !adminKey) {
    return false;
  }
  return timingSafeKeyMatch(adminKey, expectedKey);
}

export async function GET(req: Request) {
  try {
    const opps = await getAllOpportunities();
    return NextResponse.json({ opportunities: opps, count: opps.length });
  } catch (err: any) {
    console.error("[opportunities/ingest GET] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    // 1. Gated Admin Check
    if (!verifyAdminAuth(req)) {
      return NextResponse.json(
        { error: "Forbidden: Invalid or missing admin authorization key (x-admin-key)." },
        { status: 403 }
      );
    }

    const body = await req.json();

    // Scenario A: Direct Opportunity object
    if (body.directOpportunity) {
      const saved = await insertOpportunity(body.directOpportunity);
      return NextResponse.json({ success: true, opportunity: saved });
    }

    // Scenario B: Raw description + URL to extract with AI
    const rawDescription = body.rawDescription || body.description || "";
    const sourceUrl = body.sourceUrl || body.url || "";

    if (!rawDescription || rawDescription.trim().length < 15) {
      return NextResponse.json(
        { error: "Opportunity description is too short (min 15 chars)." },
        { status: 400 }
      );
    }

    // Run AI extraction
    const extracted = await extractOpportunityFromDescription(rawDescription, sourceUrl);

    // Save
    const saved = await insertOpportunity(extracted);

    return NextResponse.json({
      success: true,
      opportunity: saved
    });
  } catch (err: any) {
    console.error("[opportunities/ingest POST] Error:", err.message);
    return NextResponse.json(
      { error: err.message || "Failed to ingest opportunity." },
      { status: 500 }
    );
  }
}
