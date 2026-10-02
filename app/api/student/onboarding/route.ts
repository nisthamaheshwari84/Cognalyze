import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { upsertStudentProfileByUserId, getUserById } from "@/lib/auth/store";
import { upsertStudentProfile } from "@/lib/placement-store";
import { invalidateStudentDNACache } from "@/lib/ai/student-dna";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth || !auth.user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }

    if (auth.user.accountType !== "student") {
      return NextResponse.json({ error: "Forbidden. Recruiter accounts cannot access student onboarding." }, { status: 403 });
    }

    const targetUserId = auth.user.id;
    const body = await req.json();

    const user = getUserById(targetUserId);
    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    const {
      fullName,
      username,
      email,
      phone,
      location,
      linkedinUrl,
      githubUrl,
      portfolioUrl,
      college,
      degree,
      branch,
      year,
      graduationYear,
      cgpa,
      coursework,
      skills,
      projects,
      experience,
      achievements,
      certifications,
      careerGoals,
      resumeUrl,
      resumeFileName,
    } = body;

    const effectiveFullName = (fullName || user.fullName || "").trim();
    if (!effectiveFullName || effectiveFullName.length < 2) {
      return NextResponse.json({ error: "Full Name is required." }, { status: 400 });
    }

    // 1. Calculate profile completion percentage based on provided sections
    let completedSections = 0;
    const totalSections = 9;

    if (fullName && (email || user.email)) completedSections++;
    if (college && degree) completedSections++;
    if (Array.isArray(skills) && skills.length > 0) completedSections++;
    if (Array.isArray(projects) && projects.length > 0) completedSections++;
    if (Array.isArray(experience) && experience.length > 0) completedSections++;
    if (Array.isArray(achievements) && achievements.length > 0) completedSections++;
    if (Array.isArray(certifications) && certifications.length > 0) completedSections++;
    if (careerGoals && (careerGoals.targetRoles?.length > 0 || careerGoals.preferredDomains?.length > 0)) completedSections++;
    if (resumeUrl || resumeFileName) completedSections++;

    const completionPercentage = Math.round((completedSections / totalSections) * 100);

    // 2. Upsert comprehensive Student Profile in auth store
    const studentProfile = upsertStudentProfileByUserId(targetUserId, {
      fullName: effectiveFullName,
      username: username ? username.trim().toLowerCase() : undefined,
      email: email || user.email,
      phone: phone || "",
      location: location || "",
      linkedinUrl: linkedinUrl || "",
      githubUrl: githubUrl || "",
      portfolioUrl: portfolioUrl || "",
      college: (college || "Not Specified").trim(),
      degree: (degree || "B.Tech").trim(),
      branch: (branch || "Computer Science").trim(),
      year: (year || "3rd Year").trim(),
      graduationYear: (graduationYear || "2026").trim(),
      cgpa: (cgpa || "").trim(),
      coursework: Array.isArray(coursework) ? coursework : [],
      skills: Array.isArray(skills) ? skills : [],
      projects: Array.isArray(projects) ? projects : [],
      experience: Array.isArray(experience) ? experience : [],
      achievements: Array.isArray(achievements) ? achievements : [],
      certifications: Array.isArray(certifications) ? certifications : [],
      careerGoals: careerGoals || {
        targetRoles: [],
        preferredDomains: [],
        targetCompanies: [],
        preferredLocations: []
      },
      resumeUrl: resumeUrl || "",
      resumeFileName: resumeFileName || "",
      profileCompleted: true,
      profileCompletionPercentage: Math.max(completionPercentage, 50), // At least 50% when onboarding submitted
    });

    // 3. Mirror into placement-store so AI Student DNA & Opportunity matching engine use this user's data
    const pastProjects = (Array.isArray(projects) ? projects : []).map((p: any) => ({
      title: p.title || "Project",
      tech_stack: Array.isArray(p.techStack) ? p.techStack : (p.tech_stack || []),
      description: p.description || "",
      github_url: p.githubUrl || p.github_url || ""
    }));

    const placementSkills = (Array.isArray(skills) ? skills : []).map((s: any) => ({
      name: s.name || s,
      level: s.level || "Intermediate",
      evidence: s.evidence || undefined
    }));

    await upsertStudentProfile({
      candidate_id: targetUserId,
      skills: placementSkills,
      past_projects: pastProjects,
      target_roles: careerGoals?.targetRoles || [],
      target_companies_or_events: careerGoals?.targetCompanies || [],
      availability: "Immediate",
      risk_appetite: "Moderate",
      profile_summary: `${degree || "Student"} in ${branch || "Engineering"} at ${college || "University"}. ${projects?.length ? `Built ${projects.map((p: any) => p.title).join(", ")}.` : ""}`
    });

    // 4. Invalidate any cached Student DNA for this user
    invalidateStudentDNACache(targetUserId);

    return NextResponse.json({
      success: true,
      profile: studentProfile,
      completionPercentage,
      nextUrl: "/student/dashboard"
    });
  } catch (err: any) {
    console.error("Student onboarding error:", err);
    return NextResponse.json({ error: err.message || "Failed to complete onboarding." }, { status: 500 });
  }
}
