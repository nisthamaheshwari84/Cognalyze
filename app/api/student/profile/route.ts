import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { getStudentProfileByUserId, upsertStudentProfileByUserId, saveStoreToCloud } from "@/lib/auth/store";
import { upsertStudentProfile, invalidatePlacementProfile } from "@/lib/placement-store";
import { invalidateStudentDNACache } from "@/lib/ai/student-dna";
import { invalidateUserDNAScope } from "@/lib/dna/store";

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
        name: typeof s === "string" ? s : (s.name || ""),
        level: (typeof s === "object" && s.level) ? s.level : "Intermediate",
        evidence: (typeof s === "object" && s.evidence) ? s.evidence : undefined
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
    }

    // Invalidate scopes across placement, DNA, and AI cache
    invalidateStudentDNACache(auth.user.id);
    invalidatePlacementProfile(auth.user.id);
    invalidateUserDNAScope(auth.user.id);

    // Persist to Supabase cloud store
    await saveStoreToCloud();

    return NextResponse.json({
      success: true,
      profile: updated,
    });
  } catch (err: any) {
    console.error("POST /api/student/profile error:", err);
    return NextResponse.json({ error: err.message || "Failed to update profile." }, { status: 500 });
  }
}
