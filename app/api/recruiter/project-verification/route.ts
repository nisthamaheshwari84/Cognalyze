import { NextResponse } from "next/server";
import { getAllCandidates, getAllRoles } from "@/lib/recruiter-store";
import { analyzeProjectOwnership, evaluateCandidateRisks } from "@/lib/recruiter/recruiter-intelligence";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidateId");
    const projectTitle = searchParams.get("project") || searchParams.get("projectTitle") || "Main Project";

    if (!candidateId) {
      return NextResponse.json({ error: "candidateId is required" }, { status: 400 });
    }

    const [candidates, roles] = await Promise.all([
      getAllCandidates(),
      getAllRoles()
    ]);

    const candidate = candidates.find((c) => c.id === candidateId);

    if (!candidate) {
      return NextResponse.json({ error: "Candidate not found" }, { status: 404 });
    }

    const role = roles.find((r) => r.id === candidate.appliedRoleId);

    const projectAnalysis = analyzeProjectOwnership(candidate, projectTitle, role);
    const riskAnalysis = evaluateCandidateRisks(candidate);

    return NextResponse.json({
      success: true,
      candidateId,
      candidateName: candidate.name,
      projectAnalysis,
      riskAnalysis,
    });
  } catch (err: any) {
    console.error("GET /api/recruiter/project-verification error:", err);
    return NextResponse.json({ error: err.message || "Failed to analyze project ownership" }, { status: 500 });
  }
}
