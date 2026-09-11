import { NextResponse } from "next/server";
import { extractStudentProfileFromText } from "@/lib/ai/placement-intelligence";
import { getStudentProfile, upsertStudentProfile } from "@/lib/placement-store";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidateId") || "student-default";

    const profile = await getStudentProfile(candidateId);
    if (!profile) {
      return NextResponse.json({ profile: null, needsOnboarding: true });
    }

    return NextResponse.json({ profile, needsOnboarding: false });
  } catch (err: any) {
    console.error("[student/onboarding GET] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const candidateId = body.candidateId || "student-default";

    // Scenario A: Direct structured profile provided
    if (body.directProfile) {
      const saved = await upsertStudentProfile({
        ...body.directProfile,
        candidate_id: candidateId
      });
      return NextResponse.json({ success: true, profile: saved });
    }

    // Scenario B: Form/conversation answers or transcript provided
    let rawText = body.transcript || "";
    if (!rawText && body.answers) {
      rawText = Object.entries(body.answers)
        .map(([q, a]) => `Q: ${q}\nA: ${a}`)
        .join("\n\n");
    }

    if (!rawText || rawText.trim().length < 10) {
      return NextResponse.json(
        { error: "Insufficient input. Please provide more details about your background." },
        { status: 400 }
      );
    }

    // Run AI extraction
    const extracted = await extractStudentProfileFromText(rawText, candidateId);

    // Upsert into store (Supabase + resilient cache)
    const savedProfile = await upsertStudentProfile(extracted);

    // Auto-seed personalized opportunities into their Application Kanban
    try {
      const { INITIAL_SEED_OPPORTUNITIES } = await import("@/lib/placement-store");
      // Find top 3 relevant opportunities
      const seeded = (INITIAL_SEED_OPPORTUNITIES || []).slice(0, 3);
      for (const opp of seeded) {
        try {
          await fetch(`${new URL(req.url).origin}/api/applications`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              candidateId,
              opportunityId: opp.id,
              stage: "Bookmarked",
              notes: `Auto-recommended for ${savedProfile.target_roles?.[0] || "Software Engineer"}`
            })
          });
        } catch {}
      }
    } catch (e) {
      console.warn("Auto-seed applications fallback:", e);
    }

    return NextResponse.json({
      success: true,
      profile: savedProfile
    });
  } catch (err: any) {
    console.error("[student/onboarding POST] Error:", err.message);
    return NextResponse.json(
      { error: err.message || "Failed to process onboarding profile." },
      { status: 500 }
    );
  }
}
