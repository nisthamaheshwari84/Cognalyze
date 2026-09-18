import { NextResponse } from "next/server";
import { 
  getStudentEvidence, 
  getStudentIntelligenceProfile, 
  normalizeCapabilityName 
} from "@/lib/intelligence/student-intelligence";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidateId") || "student-demo";
    const capability = searchParams.get("capability");

    const allEvidence = getStudentEvidence(candidateId);
    const profile = getStudentIntelligenceProfile(candidateId);

    if (capability) {
      const norm = normalizeCapabilityName(capability);
      const items = allEvidence.filter(e => normalizeCapabilityName(e.capability) === norm);
      const capabilitySummary = profile.capabilities[norm] || null;

      return NextResponse.json({
        success: true,
        candidateId,
        capability: norm,
        capabilitySummary,
        evidence: items,
        count: items.length
      });
    }

    return NextResponse.json({
      success: true,
      candidateId,
      evidence: allEvidence,
      totalCount: allEvidence.length
    });
  } catch (error: any) {
    console.error("GET /api/student/evidence error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch evidence" }, { status: 500 });
  }
}
