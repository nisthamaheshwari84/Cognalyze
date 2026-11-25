import { NextRequest, NextResponse } from "next/server";
import { authorizeStudentDnaAccess, DNA_NO_STORE_HEADERS } from "@/lib/dna/security-audit";
import { getStudentEvidenceList, setUserTargetRole } from "@/lib/dna/store";
import { calculateStudentSkillProfile } from "@/lib/dna/profile-engine";
import {
  getBenchmarkProfile,
  extractRequirementsFromJD,
  parseJobDescriptionDeterministically,
  RequirementProfile,
} from "@/lib/dna/requirement-engine";
import { runDeterministicGapAnalysis } from "@/lib/dna/gap-engine";
import { evaluateRoleGaps } from "@/lib/dna/role-gap-engine";
import { getStudentProfileByUserId } from "@/lib/auth/store";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authCheck = await authorizeStudentDnaAccess(req, {
      requestedCandidateId: body.userId || body.candidateId,
      resourceName: "/api/student-dna/gap-analysis",
    });
    if (!authCheck.ok) return authCheck.response;

    const candidateId = authCheck.studentId;
    const { roleKey, jobDescriptionText, roleTitle } = body;

    let targetProfile: RequirementProfile | undefined;

    if (jobDescriptionText && typeof jobDescriptionText === "string" && jobDescriptionText.trim().length > 20) {
      targetProfile = await extractRequirementsFromJD(jobDescriptionText, roleTitle || "Custom Job Description");
      if (!targetProfile || targetProfile.requirements.length === 0) {
        targetProfile = parseJobDescriptionDeterministically(jobDescriptionText, roleTitle || "Custom Role");
      }
    } else if (roleKey) {
      targetProfile = getBenchmarkProfile(roleKey);
      if (!targetProfile) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid roleKey: '${roleKey}'. Must be one of: sde_intern, full_stack, backend_sde1, ai_ml_engineer`,
          },
          { status: 400, headers: DNA_NO_STORE_HEADERS }
        );
      }
      setUserTargetRole(candidateId, roleKey);
    }

    if (!targetProfile) {
      targetProfile = getBenchmarkProfile("sde_intern")!;
      setUserTargetRole(candidateId, "sde_intern");
    }

    const evidence = await getStudentEvidenceList(candidateId);
    const skills = calculateStudentSkillProfile(candidateId, evidence);

    const authProfile = getStudentProfileByUserId(candidateId);
    const studentClaims = (authProfile?.skills || []).map((s: any) => ({
      skillName: typeof s === "string" ? s : s.name,
      claimedLevel: typeof s === "object" && s.level ? s.level : "Intermediate",
    }));

    const gapReport = runDeterministicGapAnalysis(skills, targetProfile);
    const roleGapIntelligence = evaluateRoleGaps(candidateId, targetProfile, evidence, studentClaims);

    return NextResponse.json(
      {
        success: true,
        candidateId,
        targetProfile,
        gapReport,
        roleGapIntelligence,
      },
      { headers: DNA_NO_STORE_HEADERS }
    );
  } catch (error: any) {
    console.error("POST /api/student-dna/gap-analysis error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to analyze skill gaps" },
      { status: 500, headers: DNA_NO_STORE_HEADERS }
    );
  }
}
