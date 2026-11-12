/**
 * app/api/recruitment/journeys/[id]/route.ts
 * 
 * Specific Recruitment Journey API.
 * GET: Retrieves the full state of a journey, its blueprint stages, and currently unlocked stages.
 */

import { NextRequest, NextResponse } from "next/server";
import { getJourneyById } from "@/lib/recruitment/journey-store";
import { getAnyBlueprintById } from "@/lib/recruitment/dynamic-blueprint-engine";
import { getAvailableStages } from "@/lib/recruitment/journey-engine";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: "Journey ID required." }, { status: 400 });
    }

    const journey = await getJourneyById(id);
    if (!journey) {
      return NextResponse.json({ error: "Recruitment journey not found." }, { status: 404 });
    }

    const blueprint = getAnyBlueprintById(journey.blueprintId);
    const availableStages = getAvailableStages(journey);

    return NextResponse.json({
      success: true,
      journey,
      blueprint,
      availableStages,
    });
  } catch (err: any) {
    console.error("[GET /api/recruitment/journeys/[id]] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to retrieve journey." },
      { status: 500 }
    );
  }
}

