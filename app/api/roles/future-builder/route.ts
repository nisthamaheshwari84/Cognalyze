import { NextRequest, NextResponse } from "next/server";
import { generateRoleDraftFromProblem } from "@/lib/roles/future-role-builder";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { businessProblem, targetHires, department, suggestedTitle } = body;

    if (!businessProblem || !businessProblem.trim()) {
      return NextResponse.json(
        { success: false, error: "businessProblem statement is required" },
        { status: 400 }
      );
    }

    const draft = generateRoleDraftFromProblem({
      businessProblem: businessProblem.trim(),
      targetHires: targetHires ? Number(targetHires) : 1,
      department: department || "Core Infrastructure",
      suggestedTitle,
    });

    return NextResponse.json({ success: true, draft });
  } catch (error: any) {
    console.error("POST /api/roles/future-builder error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to generate future role draft" },
      { status: 500 }
    );
  }
}
