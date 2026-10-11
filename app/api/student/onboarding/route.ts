import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { upsertStudentProfileByUserId, getUserById, saveStoreToCloud } from "@/lib/auth/store";
import { upsertStudentProfile, invalidatePlacementProfile } from "@/lib/placement-store";
import { invalidateStudentDNACache } from "@/lib/ai/student-dna";
import { invalidateUserDNAScope } from "@/lib/dna/store";

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
      currentStep,
      isPartialSave,
      isFinalSubmit,
    } = body;

    const effectiveFullName = (fullName || user.fullName || user.email.split("@")[0] || "Student").trim();
    if (!isPartialSave && (!effectiveFullName || effectiveFullName.length < 2)) {
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
    const isCompleted = isFinalSubmit || (!isPartialSave && completionPercentage >= 50);

    // 2. Upsert comprehensive Student Profile in auth store
    const studentProfile = upsertStudentProfileByUserId(targetUserId, {
      fullName: effectiveFullName,
      username: username ? username.trim().toLowerCase() : undefined,
      email: email || user.email,
      phone: phone !== undefined ? phone : "",
      location: location !== undefined ? location : "",
      linkedinUrl: linkedinUrl !== undefined ? linkedinUrl : "",
      githubUrl: githubUrl !== undefined ? githubUrl : "",
      portfolioUrl: portfolioUrl !== undefined ? portfolioUrl : "",
      college: college !== undefined ? college.trim() : "",
      degree: degree !== undefined ? degree.trim() : "",
      branch: branch !== undefined ? branch.trim() : "",
      year: year !== undefined ? year.trim() : "",
      graduationYear: graduationYear !== undefined ? graduationYear.trim() : "",
      cgpa: cgpa !== undefined ? cgpa.trim() : "",
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
      currentStep: typeof currentStep === "number" ? currentStep : 1,
      profileCompleted: isCompleted,
      profileCompletionPercentage: Math.max(completionPercentage, isCompleted ? 50 : 10),
    });

    // 3. Mirror into placement-store so AI Student DNA & Opportunity matching engine use this user's data
    const pastProjects = (Array.isArray(projects) ? projects : []).map((p: any) => ({
      title: p.title || "Project",
      tech_stack: Array.isArray(p.techStack) ? p.techStack : (p.tech_stack || []),
      description: p.description || "",
      github_url: p.githubUrl || p.github_url || ""
    }));

    const placementSkills = (Array.isArray(skills) ? skills : []).map((s: any) => ({
      name: typeof s === "string" ? s : (s.name || ""),
      level: (typeof s === "object" && s.level) ? s.level : "Intermediate",
      evidence: (typeof s === "object" && s.evidence) ? s.evidence : undefined
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

    // 4. Invalidate all cached DNA & placement scopes for this user
    invalidateStudentDNACache(targetUserId);
    invalidatePlacementProfile(targetUserId);
    invalidateUserDNAScope(targetUserId);

    // 5. CRITICAL: Persist to Supabase Cloud Store so serverless invocations retain data
    await saveStoreToCloud();

    return NextResponse.json({
      success: true,
      profile: studentProfile,
      completionPercentage,
      currentStep: studentProfile.currentStep || 1,
      nextUrl: isCompleted ? "/student/dashboard?dna=ready" : undefined
    });
  } catch (err: any) {
    console.error("Student onboarding error:", err);
    return NextResponse.json({ error: err.message || "Failed to complete onboarding." }, { status: 500 });
  }
}
