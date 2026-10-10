import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { getCandidateById, getRoleById } from "@/lib/recruiter-store";
import { getStudentDNAFull } from "@/lib/dna/store";
import {
  getRoleDNASnapshot,
  generateRoleDNASnapshot,
  refreshRoleDNASnapshotWithAudit
} from "@/lib/dna/recruiter-snapshot";
import { getStudentProfileByUserId } from "@/lib/auth/store";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const { id: candidateId } = await params;
    const candidate = await getCandidateById(candidateId);
    if (!candidate) {
      return NextResponse.json({ success: false, error: "Candidate not found." }, { status: 404 });
    }

    const roleId = candidate.appliedRoleId || "role-sde-platform";
    const role = await getRoleById(roleId);
    if (!role) {
      return NextResponse.json({ success: false, error: "Associated role not found." }, { status: 404 });
    }

    // 1. Check if snapshot already exists (historical preservation)
    let snapshot = getRoleDNASnapshot(candidateId, roleId);

    // 2. If missing, generate point-of-application snapshot
    if (!snapshot) {
      const dnaFull = await getStudentDNAFull(candidateId);
      const studentProfile = getStudentProfileByUserId(candidateId);

      snapshot = generateRoleDNASnapshot({
        studentId: candidateId,
        candidateName: candidate.name,
        candidateEmail: candidate.email,
        role,
        dnaFull,
        resumeText: candidate.resumeText,
        studentProfile
      });
    }

    return NextResponse.json({
      success: true,
      candidateId,
      roleId,
      snapshot
    });
  } catch (error: any) {
    console.error("GET /api/recruiter/candidates/[id]/dna-snapshot error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch candidate DNA snapshot." },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const { id: candidateId } = await params;
    const candidate = await getCandidateById(candidateId);
    if (!candidate) {
      return NextResponse.json({ success: false, error: "Candidate not found." }, { status: 404 });
    }

    const roleId = candidate.appliedRoleId || "role-sde-platform";
    const role = await getRoleById(roleId);
    if (!role) {
      return NextResponse.json({ success: false, error: "Associated role not found." }, { status: 404 });
    }

    const body = await req.json();
    const reason = body.reason || "Manual recruiter refresh request";

    const existing = getRoleDNASnapshot(candidateId, roleId);
    const newDnaFull = await getStudentDNAFull(candidateId);

    let updatedSnapshot;
    if (existing) {
      updatedSnapshot = refreshRoleDNASnapshotWithAudit(existing, newDnaFull, reason);
    } else {
      const studentProfile = getStudentProfileByUserId(candidateId);
      updatedSnapshot = generateRoleDNASnapshot({
        studentId: candidateId,
        candidateName: candidate.name,
        candidateEmail: candidate.email,
        role,
        dnaFull: newDnaFull,
        resumeText: candidate.resumeText,
        studentProfile
      });
    }

    return NextResponse.json({
      success: true,
      candidateId,
      roleId,
      snapshot: updatedSnapshot,
      message: "Snapshot refreshed with historical audit revision log."
    });
  } catch (error: any) {
    console.error("POST /api/recruiter/candidates/[id]/dna-snapshot error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to refresh candidate DNA snapshot." },
      { status: 500 }
    );
  }
}
