/**
 * app/api/recruitment/journeys/route.ts
 * 
 * Recruitment Journeys Collection API.
 * POST: Create/initialize a new student recruitment journey against an immutable blueprint.
 * GET: Retrieve list of journeys for a candidate.
 */

import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { createJourney } from "@/lib/recruitment/journey-engine";
import { saveJourney, getJourneysByStudent } from "@/lib/recruitment/journey-store";
import { RoleFamily, HiringChannel } from "@/lib/recruitment/types";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const body = await req.json();

    const studentId = auth?.user?.id || body.studentId || "student-demo";
    const { companyId, roleFamily, hiringChannel = "campus", country = "GLOBAL", blueprintVersion } = body;

    if (!companyId || !roleFamily) {
      return NextResponse.json(
        { error: "Both 'companyId' and 'roleFamily' are required to start a recruitment journey." },
        { status: 400 }
      );
    }

    const journey = createJourney({
      studentId,
      companyId,
      roleFamily: roleFamily as RoleFamily,
      hiringChannel: hiringChannel as HiringChannel,
      country,
      blueprintVersion,
    });

    const saved = await saveJourney(journey);
    return NextResponse.json({ success: true, journey: saved }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/recruitment/journeys] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create recruitment journey." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const { searchParams } = new URL(req.url);
    const studentId = auth?.user?.id || searchParams.get("studentId") || "student-demo";

    const journeys = await getJourneysByStudent(studentId);
    return NextResponse.json({ success: true, count: journeys.length, journeys });
  } catch (err: any) {
    console.error("[GET /api/recruitment/journeys] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch recruitment journeys." },
      { status: 500 }
    );
  }
}

