import { NextResponse } from "next/server";
import { getCandidateById, getRoleById, updateCandidateStage } from "@/lib/recruiter-store";
import { buildEvidenceGraph } from "@/lib/ai/evidence-graph";
import { detectConflicts } from "@/lib/ai/conflict-detector";

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

    if (!candidate || !role) {
      return NextResponse.json({ success: false, error: "Candidate or Role not found" }, { status: 404 });
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

    const conflictResult = detectConflicts(
      role,
      candidateDNA,
      candidate.interviewHistory,
      candidate.workSampleResults
    );

    if (conflictResult.conflictsFound) {
      await updateCandidateStage(candidateId, "Conflict Review", {
        activeConflicts: conflictResult.conflicts
      });
    }

    return NextResponse.json({
      success: true,
      conflictResult
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
