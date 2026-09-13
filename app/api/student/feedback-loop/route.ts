import { NextResponse } from "next/server";
import { getStudentDNA, recordHackathonOutcome, invalidateStudentDNACache } from "@/lib/ai/student-dna";
import { getStudentProfile, upsertStudentProfile, DEMO_STUDENT_PROFILE } from "@/lib/placement-store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      candidateId = "student-demo",
      hackathonId,
      hackathonTitle,
      status = "completed",
      skillsPracticed = [],
      newProject,
      teamRole
    } = body;

    if (!hackathonId || !hackathonTitle) {
      return NextResponse.json({ error: "Missing required hackathonId or hackathonTitle" }, { status: 400 });
    }

    // 1. Fetch current profile
    const rawProfile = await getStudentProfile(candidateId);
    const profile = rawProfile || { ...DEMO_STUDENT_PROFILE, candidate_id: candidateId };

    // 2. Update skills ONLY with student-confirmed inputs
    const updatedSkills = [...(profile.skills || [])];
    for (const sName of skillsPracticed) {
      const existing = updatedSkills.find(s => s.name.toLowerCase() === sName.toLowerCase());
      if (existing) {
        // Upgrade level if was Beginner -> Intermediate, or Intermediate -> Advanced
        if (existing.level === "Beginner") existing.level = "Intermediate";
        else if (existing.level === "Intermediate") existing.level = "Advanced";
        existing.evidence = `Practiced in ${hackathonTitle} (${status})`;
      } else {
        updatedSkills.push({
          name: sName,
          level: "Intermediate",
          evidence: `Practiced in ${hackathonTitle} (${status})`
        });
      }
    }

    // 3. Add new project if provided
    const updatedProjects = [...(profile.past_projects || [])];
    if (newProject && newProject.title) {
      updatedProjects.push({
        title: newProject.title,
        tech_stack: newProject.techStack || skillsPracticed,
        description: newProject.description || `Built during ${hackathonTitle}`,
        impact: `Outcome: ${status}`,
        github_url: newProject.githubUrl
      });
    }

    // 4. Persist to student_profiles
    await upsertStudentProfile({
      ...profile,
      skills: updatedSkills,
      past_projects: updatedProjects
    });

    // 5. Record hackathon outcome in DNA history
    recordHackathonOutcome(candidateId, {
      hackathon_id: hackathonId,
      hackathon_title: hackathonTitle,
      date: new Date().toISOString().split("T")[0],
      role: teamRole || "Participant",
      status,
      skills_practiced: skillsPracticed
    });

    // 6. Invalidate DNA cache to force refresh
    invalidateStudentDNACache(candidateId);
    const refreshedDNA = await getStudentDNA(candidateId);

    return NextResponse.json({
      success: true,
      candidate_id: candidateId,
      message: "Hackathon outcome recorded and Student DNA updated with confirmed data.",
      updated_skills_count: refreshedDNA.skills.length,
      updated_projects_count: refreshedDNA.projects.length,
      hackathon_history: refreshedDNA.hackathon_history
    });
  } catch (error: any) {
    console.error("POST /api/student/feedback-loop error:", error);
    return NextResponse.json({ error: error.message || "Failed to process feedback loop" }, { status: 500 });
  }
}
