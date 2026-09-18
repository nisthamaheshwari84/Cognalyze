import { NextResponse } from "next/server";
import { getStudentDNA, setTeamMatchOptIn, invalidateStudentDNACache } from "@/lib/ai/student-dna";
import { 
  getStudentIntelligenceProfile, 
  updateCareerIntent, 
  getStudentEvidence 
} from "@/lib/intelligence/student-intelligence";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidateId") || "student-demo";
    const refresh = searchParams.get("refresh") === "true";

    if (refresh) {
      invalidateStudentDNACache(candidateId);
    }

    const [dna, intelligence, evidence] = await Promise.all([
      getStudentDNA(candidateId),
      getStudentIntelligenceProfile(candidateId),
      getStudentEvidence(candidateId)
    ]);

    return NextResponse.json({
      success: true,
      dna,
      intelligence,
      evidence
    });
  } catch (error: any) {
    console.error("GET /api/student/dna error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch student DNA" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      candidateId = "student-demo", 
      teamMatchOptIn,
      careerIntent
    } = body;

    if (typeof teamMatchOptIn === "boolean") {
      setTeamMatchOptIn(candidateId, teamMatchOptIn);
    }

    if (careerIntent) {
      updateCareerIntent({
        ...careerIntent,
        studentId: candidateId
      });
    }

    const [dna, intelligence] = await Promise.all([
      getStudentDNA(candidateId),
      getStudentIntelligenceProfile(candidateId)
    ]);

    return NextResponse.json({
      success: true,
      dna,
      intelligence
    });
  } catch (error: any) {
    console.error("POST /api/student/dna error:", error);
    return NextResponse.json({ error: error.message || "Failed to update student DNA settings" }, { status: 500 });
  }
}
