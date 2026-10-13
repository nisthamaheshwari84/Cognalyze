import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { getStudentEvidenceList } from "@/lib/dna/store";
import { calculateStudentSkillProfile } from "@/lib/dna/profile-engine";
import { getBenchmarkProfile, extractRequirementsFromJD, parseJobDescriptionDeterministically, RequirementProfile } from "@/lib/dna/requirement-engine";
import { runDeterministicGapAnalysis } from "@/lib/dna/gap-engine";
import { evaluateRoleGaps } from "@/lib/dna/role-gap-engine";
import { getStudentProfileByUserId } from "@/lib/auth/store";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in to run skill gap analysis." },
        { status: 401 }
      );
    }

    if (auth.user.accountType === "recruiter") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Recruiter accounts are restricted from accessing student gap intelligence directly." },
        { status: 403 }
      );
    }

    // Strictly scope query to authenticated student's permanent ID
    const candidateId = auth.user.id;
    const body = await req.json();
    const { roleKey, jobDescriptionText, roleTitle } = body;

    let targetProfile: RequirementProfile | undefined;

    if (jobDescriptionText && typeof jobDescriptionText === "string" && jobDescriptionText.trim().length > 20) {
      // Parse JD with injection protection and deterministic fallback
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

    const authProfile = getStudentProfileByUserId(candidateId);
    const studentClaims = (authProfile?.skills || []).map((s: any) => ({
      skillName: typeof s === "string" ? s : s.name,
      claimedLevel: (typeof s === "object" && s.level) ? s.level : "Intermediate"
    }));

    // Run deterministic gap engines
    const gapReport = runDeterministicGapAnalysis(skills, targetProfile);
    const roleGapIntelligence = evaluateRoleGaps(candidateId, targetProfile, evidence, studentClaims);

    return NextResponse.json({
      success: true,
      candidateId,
      targetProfile,
      gapReport,
      roleGapIntelligence
    });
  } catch (error: any) {
    console.error("POST /api/student-dna/gap-analysis error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to analyze skill gaps" }, { status: 500 });
  }
}
