import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { getStudentProfileByUserId, upsertStudentProfileByUserId } from "@/lib/auth/store";
import { upsertStudentProfile } from "@/lib/placement-store";
import { invalidateStudentDNACache } from "@/lib/ai/student-dna";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth || !auth.user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const profile = getStudentProfileByUserId(auth.user.id);
    if (!profile) {
      return NextResponse.json({
        success: false,
        profileCompleted: false,
        profile: null,
      });
    }

    return NextResponse.json({
      success: true,
      profileCompleted: profile.profileCompleted || false,
      profile,
    });
  } catch (err: any) {
    console.error("GET /api/student/profile error:", err);
    return NextResponse.json({ error: err.message || "Failed to fetch profile." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth || !auth.user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    const body = await req.json();
    const updated = upsertStudentProfileByUserId(auth.user.id, body);

    // Sync with placement store
    if (body.skills || body.projects) {
      const pastProjects = (body.projects || []).map((p: any) => ({
        title: p.title || "Project",
        tech_stack: Array.isArray(p.techStack) ? p.techStack : (p.tech_stack || []),
        description: p.description || "",
        github_url: p.githubUrl || p.github_url || ""
      }));

      const placementSkills = (body.skills || []).map((s: any) => ({
        name: s.name || s,
        level: s.level || "Intermediate",
        evidence: s.evidence || undefined
      }));

      await upsertStudentProfile({
        candidate_id: auth.user.id,
        skills: placementSkills,
        past_projects: pastProjects,
        target_roles: body.careerGoals?.targetRoles || [],
        target_companies_or_events: body.careerGoals?.targetCompanies || [],
        availability: "Immediate",
        risk_appetite: "Moderate",
        profile_summary: `${updated.degree || "Student"} in ${updated.branch || "Engineering"} at ${updated.college || "University"}`
      });

      invalidateStudentDNACache(auth.user.id);
    }

    return NextResponse.json({
      success: true,
      profile: updated,
    });
  } catch (err: any) {
    console.error("POST /api/student/profile error:", err);
    return NextResponse.json({ error: err.message || "Failed to update profile." }, { status: 500 });
  }
}
