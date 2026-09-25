import { NextRequest, NextResponse } from "next/server";
import { evaluateInternalMobility, InternalRoleListing } from "@/lib/mobility/internal-mobility";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { employeePersonId, role } = body;

    if (!employeePersonId || !role) {
      return NextResponse.json(
        { success: false, error: "employeePersonId and role definition are required" },
        { status: 400 }
      );
    }

    const report = await evaluateInternalMobility({
      employeePersonId,
      role: role as InternalRoleListing,
    });

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error("POST /api/mobility/evaluate error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to evaluate internal mobility" },
      { status: 500 }
    );
  }
}
