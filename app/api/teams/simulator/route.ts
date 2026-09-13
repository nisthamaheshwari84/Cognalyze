import { NextResponse } from "next/server";
import { getStudentDNA, StudentDNA } from "@/lib/ai/student-dna";
import { getProblemStatementById } from "@/lib/ai/ps-engine";
import { simulateTeamSkillGraph, CANDIDATE_POOL_STUDENTS } from "@/lib/ai/team-match";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { psId, memberIds = ["student-demo"] } = body;

    if (!psId) {
      return NextResponse.json({ error: "Missing required psId" }, { status: 400 });
    }

    const ps = getProblemStatementById(psId);
    if (!ps) {
      return NextResponse.json({ error: "Problem statement not found" }, { status: 404 });
    }

    // Resolve member DNAs
    const memberDNAs: StudentDNA[] = [];
    for (const mId of memberIds) {
      const fromPool = CANDIDATE_POOL_STUDENTS.find(c => c.candidate_id === mId);
      if (fromPool) {
        memberDNAs.push(fromPool);
      } else {
        const dna = await getStudentDNA(mId);
        memberDNAs.push(dna);
      }
    }

    const simulation = simulateTeamSkillGraph(ps, memberDNAs);

    return NextResponse.json({
      success: true,
      simulation
    });
  } catch (error: any) {
    console.error("POST /api/teams/simulator error:", error);
    return NextResponse.json({ error: error.message || "Failed to simulate team skill graph" }, { status: 500 });
  }
}
