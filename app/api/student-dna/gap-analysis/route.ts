import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { getStudentEvidenceList } from "@/lib/dna/store";
import { calculateStudentSkillProfile } from "@/lib/dna/profile-engine";
import { getBenchmarkProfile, extractRequirementsFromJD, parseJobDescriptionDeterministically, RequirementProfile } from "@/lib/dna/requirement-engine";
import { runDeterministicGapAnalysis } from "@/lib/dna/gap-engine";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const body = await req.json();

    let candidateId = body.candidateId;
    if (auth && auth.user && auth.user.accountType === "student") {
      candidateId = auth.user.id;
    } else if (!candidateId) {
      candidateId = auth?.user?.id || "student-demo";
    }

    const { roleKey, jobDescriptionText, roleTitle } = body;

    let targetProfile: RequirementProfile | undefined;

    if (jobDescriptionText && typeof jobDescriptionText === "string" && jobDescriptionText.trim().length > 20) {
      // Parse JD using AI with prompt injection protection, or deterministic regex fallback
      targetProfile = await extractRequirementsFromJD(jobDescriptionText, roleTitle || "Custom Job Description");
      if (!targetProfile || targetProfile.requirements.length === 0) {
        targetProfile = parseJobDescriptionDeterministically(jobDescriptionText, roleTitle || "Custom Role");
      }
    } else if (roleKey) {
      targetProfile = getBenchmarkProfile(roleKey);
    }

    if (!targetProfile) {
      targetProfile = getBenchmarkProfile("sde_intern")!;
    }

    // Fetch user-isolated evidence and calculate skills
    const evidence = await getStudentEvidenceList(candidateId);
    const skills = calculateStudentSkillProfile(candidateId, evidence);

    // Run deterministic gap engine
    const gapReport = runDeterministicGapAnalysis(skills, targetProfile);

    return NextResponse.json({
      success: true,
      candidateId,
      targetProfile,
      gapReport
    });
  } catch (error: any) {
    console.error("POST /api/student-dna/gap-analysis error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to analyze skill gaps" }, { status: 500 });
  }
}
