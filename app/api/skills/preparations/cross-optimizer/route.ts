import { NextRequest, NextResponse } from "next/server";
import { preparationsPersonalization } from "@/lib/skills/preparations/personalization-engine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { arenaIds } = body;

    if (!Array.isArray(arenaIds) || arenaIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Please provide an array of at least 1 arenaId in 'arenaIds'." },
        { status: 400 }
      );
    }

    const optimization = preparationsPersonalization.optimizeMultipleTargets(arenaIds);

    return NextResponse.json({
      success: true,
      optimization,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[api/skills/preparations/cross-optimizer] POST Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

