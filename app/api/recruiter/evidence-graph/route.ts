import { NextResponse } from "next/server";
import { getCandidateById, getRoleById } from "@/lib/recruiter-store";
import { buildEvidenceGraph } from "@/lib/ai/evidence-graph";

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

    const evidenceResult = buildEvidenceGraph(
      {
        id: candidate.id,
        name: candidate.name,
        resumeText: candidate.resumeText,
        githubData: candidate.githubData,
        studentProjects: candidate.studentProjects,
        hackathons: candidate.hackathonRecords,
        workSampleResults: candidate.workSampleResults,
        interviewNotes: candidate.interviewHistory?.questionHistory.reduce((acc, q) => {
          acc[q.requirementId] = {
            verified: q.competencyConfirmed ?? true,
            rating: q.rating ?? 7,
            transcriptQuote: q.verbatimQuote || q.candidateResponseSummary || ""
          };
          return acc;
        }, {} as Record<string, any>)
      },
      role
    );

    return NextResponse.json({
      success: true,
      candidateDNA: evidenceResult.candidateDNA,
      evidenceNodes: evidenceResult.nodes
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
