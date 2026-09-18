import { NextResponse } from "next/server";
import { getAllCandidates, addCandidate, MultiSourceCandidateProfile } from "@/lib/recruiter-store";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roleId = searchParams.get("roleId");

    let candidates = await getAllCandidates();
    if (roleId) {
      candidates = candidates.filter(c => c.appliedRoleId === roleId);
    }

    return NextResponse.json({ success: true, count: candidates.length, candidates });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.name || !body.appliedRoleId) {
      return NextResponse.json({ success: false, error: "Candidate name and appliedRoleId are required" }, { status: 400 });
    }

    const cand: MultiSourceCandidateProfile = {
      id: body.id || `cand-${Date.now().toString().slice(-6)}`,
      name: body.name,
      email: body.email || `${body.name.toLowerCase().replace(/\s+/g, ".")}@example.com`,
      phone: body.phone,
      appliedRoleId: body.appliedRoleId,
      appliedRoleTitle: body.appliedRoleTitle || "Engineering Role",
      sourceType: body.sourceType || "bulk_upload",
      appliedAt: new Date().toISOString(),
      resumeText: body.resumeText || "",
      githubData: body.githubData,
      linkedInUrl: body.linkedInUrl,
      leetCodeProfile: body.leetCodeProfile,
      hackathonRecords: body.hackathonRecords,
      studentProjects: body.studentProjects,
      certifications: body.certifications,
      currentStage: "Applied"
    };

    const saved = await addCandidate(cand);
    return NextResponse.json({ success: true, candidate: saved });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
