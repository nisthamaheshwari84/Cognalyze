import { NextRequest, NextResponse } from "next/server";
import { skillHubStore, CompanyTrack } from "@/lib/skill-hub-store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidateId") || "student-demo";

    const allTracks = skillHubStore.getTracks();
    const studentTracks = skillHubStore.getStudentTracks(candidateId);

    return NextResponse.json({
      success: true,
      tracks: allTracks,
      studentTracks,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    console.error("Error fetching company tracks:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { candidateId = "student-demo", targetTracks } = body;

    if (!Array.isArray(targetTracks) || targetTracks.length === 0) {
      return NextResponse.json(
        { success: false, error: "targetTracks must be a non-empty array of valid company track slugs." },
        { status: 400 }
      );
    }

    const validSlugs = ["service_mass", "service_elite", "product_mid", "product_faang"];
    const filteredTracks = targetTracks.filter((t: any) => validSlugs.includes(t));

    skillHubStore.setStudentTracks(candidateId, filteredTracks);

    return NextResponse.json({
      success: true,
      candidateId,
      studentTracks: skillHubStore.getStudentTracks(candidateId),
      message: "Target company tracks updated successfully."
    });
  } catch (err: any) {
    console.error("Error updating company tracks:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
