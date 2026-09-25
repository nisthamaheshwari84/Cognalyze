import { NextResponse } from "next/server";
import {
  getCandidateById,
  getRoleById,
  saveCandidateDossier,
  addCandidateCorrection
} from "@/lib/recruiter-store";
import { screenCandidateAgainstRole, RecruiterCorrection } from "@/lib/screening/candidate-screening-engine";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let candidate = await getCandidateById(id);
    if (!candidate) {
      return NextResponse.json({ success: false, error: "Candidate not found" }, { status: 404 });
    }

    // Auto-generate dossier if missing and role exists
    if (!candidate.screeningDossier && candidate.appliedRoleId) {
      const role = await getRoleById(candidate.appliedRoleId);
      if (role && (candidate.resumeText || "").trim()) {
        const dossier = screenCandidateAgainstRole(
          {
            id: candidate.id,
            name: candidate.name,
            email: candidate.email,
            phone: candidate.phone,
            resumeText: candidate.resumeText
          },
          role
        );
        candidate = await saveCandidateDossier(candidate.id, dossier);
      }
    }

    return NextResponse.json({
      success: true,
      candidate,
      dossier: candidate?.screeningDossier || null
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (body.action === "recruiter_correction") {
      const { requirementId, originalState, correctedState, reason } = body.correction || {};
      if (!requirementId || !correctedState || !reason) {
        return NextResponse.json(
          { success: false, error: "requirementId, correctedState, and reason are required" },
          { status: 400 }
        );
      }

      const correction: RecruiterCorrection = {
        requirementId,
        originalState,
        correctedState,
        reason,
        correctedAt: new Date().toISOString()
      };

      const updated = await addCandidateCorrection(id, correction);
      if (!updated) {
        return NextResponse.json({ success: false, error: "Candidate not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        candidate: updated,
        correction
      });
    }

    return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
