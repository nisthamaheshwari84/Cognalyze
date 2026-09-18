import { NextResponse } from "next/server";
import { getCandidateById, getRoleById } from "@/lib/recruiter-store";
import { buildEvidenceGraph } from "@/lib/ai/evidence-graph";
import { computeRoleCandidateMatch, generateMinimumProofPlan } from "@/lib/ai/minimum-proof";

export async function POST(req: Request) {
  try {
    const { candidateId, roleId } = await req.json();
    if (!candidateId || !roleId) {
      return NextResponse.json({ success: false, error: "candidateId and roleId are required" }, { status: 400 });
    }

    const [candidate, role] = await Promise.all([
      getCandidateById(candidateId),
      getRoleById(roleId)
    ]);

    if (!candidate) {
      return NextResponse.json({ success: false, error: "Candidate not found" }, { status: 404 });
    }
    if (!role) {
      return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 });
    }

    const { candidateDNA } = buildEvidenceGraph(
      {
        id: candidate.id,
        name: candidate.name,
        resumeText: candidate.resumeText,
        githubData: candidate.githubData,
        studentProjects: candidate.studentProjects,
        hackathons: candidate.hackathonRecords,
        workSampleResults: candidate.workSampleResults
      },
      role
    );

    const match = computeRoleCandidateMatch(role, candidateDNA);
    const minimumProofPlan = generateMinimumProofPlan(role, candidateDNA);

    return NextResponse.json({
      success: true,
      match,
      minimumProofPlan
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
