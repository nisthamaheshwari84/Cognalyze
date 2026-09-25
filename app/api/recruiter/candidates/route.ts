import { NextResponse } from "next/server";
import {
  getAllCandidates,
  addCandidate,
  getRoleById,
  getRoleCandidateMetrics,
  MultiSourceCandidateProfile
} from "@/lib/recruiter-store";
import { screenCandidateAgainstRole } from "@/lib/screening/candidate-screening-engine";
import { processCandidateBatch, BatchCandidateInput } from "@/lib/screening/batch-screener";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roleId = searchParams.get("roleId");
    const evidenceCoverage = searchParams.get("evidenceCoverage");
    const needsReview = searchParams.get("needsReview");
    const includeMetrics = searchParams.get("metrics");

    let candidates = await getAllCandidates();

    if (roleId) {
      candidates = candidates.filter(c => c.appliedRoleId === roleId);
    }

    if (evidenceCoverage) {
      candidates = candidates.filter(
        c => c.screeningDossier?.overallCoverage === evidenceCoverage
      );
    }

    if (needsReview === "true") {
      candidates = candidates.filter(c => {
        if (!c.screeningDossier) return false;
        return (
          c.screeningDossier.coverageCounts.needsReviewCount > 0 ||
          c.screeningDossier.coverageCounts.conflictingCount > 0
        );
      });
    }

    let roleMetrics = null;
    if (roleId && includeMetrics === "true") {
      roleMetrics = await getRoleCandidateMetrics(roleId);
    }

    return NextResponse.json({
      success: true,
      count: candidates.length,
      candidates,
      metrics: roleMetrics
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // 1. Batch Upload mode
    if (Array.isArray(body.batch) && body.appliedRoleId) {
      const role = await getRoleById(body.appliedRoleId);
      if (!role) {
        return NextResponse.json({ success: false, error: "Applied role not found" }, { status: 404 });
      }

      const batchItems: BatchCandidateInput[] = body.batch;
      const batchResult = await processCandidateBatch(batchItems, role);

      // Persist newly analyzed candidates to store
      const addedProfiles: MultiSourceCandidateProfile[] = [];
      for (const dossier of batchResult.dossiers) {
        const itemInput = batchItems.find(b => b.id === dossier.candidateId || b.name === dossier.candidateName);
        const profile: MultiSourceCandidateProfile = {
          id: dossier.candidateId,
          name: dossier.candidateName,
          email: dossier.email || `${dossier.candidateName.toLowerCase().replace(/\s+/g, ".")}@example.com`,
          phone: itemInput?.phone,
          appliedRoleId: role.id,
          appliedRoleTitle: role.title,
          sourceType: "bulk_upload",
          appliedAt: dossier.analyzedAt,
          resumeText: itemInput?.rawText || "",
          currentStage: "Applied",
          screeningDossier: dossier
        };
        await addCandidate(profile);
        addedProfiles.push(profile);
      }

      return NextResponse.json({
        success: true,
        batchResult,
        candidatesAdded: addedProfiles.length
      });
    }

    // 2. Single Candidate Intake Mode
    if (!body.name || !body.appliedRoleId) {
      return NextResponse.json(
        { success: false, error: "Candidate name and appliedRoleId are required" },
        { status: 400 }
      );
    }

    const candId = body.id || `cand-${Date.now().toString().slice(-6)}`;
    const role = await getRoleById(body.appliedRoleId);

    let screeningDossier = undefined;
    if (role && (body.resumeText || "").trim()) {
      screeningDossier = screenCandidateAgainstRole(
        {
          id: candId,
          name: body.name,
          email: body.email,
          phone: body.phone,
          resumeText: body.resumeText
        },
        role
      );
    }

    const cand: MultiSourceCandidateProfile = {
      id: candId,
      name: body.name,
      email: body.email || `${body.name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      phone: body.phone,
      appliedRoleId: body.appliedRoleId,
      appliedRoleTitle: role?.title || body.appliedRoleTitle || "Engineering Role",
      sourceType: body.sourceType || "bulk_upload",
      appliedAt: new Date().toISOString(),
      resumeText: body.resumeText || "",
      githubData: body.githubData,
      linkedInUrl: body.linkedInUrl,
      leetCodeProfile: body.leetCodeProfile,
      hackathonRecords: body.hackathonRecords,
      studentProjects: body.studentProjects,
      certifications: body.certifications,
      currentStage: "Applied",
      screeningDossier
    };

    const saved = await addCandidate(cand);
    return NextResponse.json({ success: true, candidate: saved });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    if (!body.id || !body.currentStage) {
      return NextResponse.json(
        { success: false, error: "Candidate id and currentStage are required" },
        { status: 400 }
      );
    }

    const { updateCandidateStage } = await import("@/lib/recruiter-store");
    const updated = await updateCandidateStage(body.id, body.currentStage, body.extraUpdates);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Candidate not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, candidate: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
