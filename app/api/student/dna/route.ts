import { NextResponse } from "next/server";
import { getStudentDNA, setTeamMatchOptIn, invalidateStudentDNACache } from "@/lib/ai/student-dna";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidateId") || "student-demo";
    const refresh = searchParams.get("refresh") === "true";

    if (refresh) {
      invalidateStudentDNACache(candidateId);
    }

    const dna = await getStudentDNA(candidateId);
    return NextResponse.json({
      success: true,
      dna
    });
  } catch (error: any) {
    console.error("GET /api/student/dna error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch student DNA" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { candidateId = "student-demo", teamMatchOptIn } = body;

    if (typeof teamMatchOptIn === "boolean") {
      setTeamMatchOptIn(candidateId, teamMatchOptIn);
    }

    const dna = await getStudentDNA(candidateId);
    return NextResponse.json({
      success: true,
      dna
    });
  } catch (error: any) {
    console.error("POST /api/student/dna error:", error);
    return NextResponse.json({ error: error.message || "Failed to update student DNA settings" }, { status: 500 });
  }
}
