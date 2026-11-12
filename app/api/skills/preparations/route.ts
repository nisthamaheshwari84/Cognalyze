import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { getArenasByCategory } from "@/lib/skills/preparations/canonical-arenas-registry";
import { preparationsStore } from "@/lib/skills/preparations/arena-store";
import { preparationsPersonalization } from "@/lib/skills/preparations/personalization-engine";
import { buildStudentIntelligenceSnapshot } from "@/lib/skills/preparations/student-dna-bridge";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || "ALL";
    const requestedCandidateId = searchParams.get("candidateId");

    // Strict user isolation: authenticated sessions cannot inspect another student's records
    if (auth?.user?.id && requestedCandidateId && requestedCandidateId !== auth.user.id) {
      return NextResponse.json(
        { success: false, error: "Forbidden: cannot access another student's preparation records." },
        { status: 403 }
      );
    }

    const candidateId = auth?.user?.id || requestedCandidateId || "cand_demo_student";
    const arenas = getArenasByCategory(category);
    const enrolledStates = preparationsStore.getCandidateEnrolledArenas(candidateId);

    // Retrieve authentic Student DNA snapshot
    const dna = await buildStudentIntelligenceSnapshot(candidateId, null, {
      isAuthenticated: Boolean(auth?.user?.id),
    });
    const verifiedSkillNames = dna.verifiedSkills.map(v => v.skill);
    const projectTitles = dna.projects.map(p => p.title);

    const arenasWithMatch = arenas.map(arena => {
      const match = preparationsPersonalization.evaluateSkillMatch(arena, {
        candidateId,
        verifiedSkills: verifiedSkillNames,
        projects: projectTitles,
        targetRoles: [],
      });

      const userState = enrolledStates.find(e => e.arenaId === arena.id || e.arenaId === arena.slug);

      return {
        id: arena.id,
        slug: arena.slug,
        title: arena.title,
        shortName: arena.shortName,
        companyOrOrg: arena.companyOrOrg,
        category: arena.category,
        categoryLabel: arena.categoryLabel,
        tagline: arena.tagline,
        badge: arena.badge,
        icon: arena.icon,
        stipendOrPrize: arena.stipendOrPrize,
        duration: arena.duration,
        applicationDeadline: arena.applicationDeadline,
        eventOrProgramDates: arena.eventOrProgramDates,
        cycleYear: arena.cycleYear,
        cycleStatus: arena.cycleStatus,
        dateVerificationStatus: arena.dateVerificationStatus,
        cycleNotes: arena.cycleNotes,
        officialUrl: arena.officialUrl,
        primaryDomains: arena.primaryDomains,
        matchCoveragePercentage: match.evidenceCoveragePercentage,
        alreadyDemonstratedSkills: match.alreadyDemonstratedSkills,
        missingSkills: match.missingSkills,
        recommendedStartingLevel: match.recommendedStartingLevel,
        isEnrolled: !!userState,
        userProgress: userState
          ? {
              level: userState.selectedLevel,
              completedTasksCount: userState.completedTaskIds.length,
              lastActiveAt: userState.lastActiveAt,
            }
          : null,
      };
    });

    const categoryStats = {
      totalArenas: arenasWithMatch.length,
      openSourceCount: arenas.filter(a => a.category === "OPEN_SOURCE").length,
      hackathonsCount: arenas.filter(a => a.category === "COMPANY_HACKATHON").length,
      companyHiringCount: arenas.filter(a => a.category === "COMPANY_HIRING").length,
      internshipsCount: arenas.filter(a => a.category === "SPECIALIZED_INTERNSHIP").length,
    };

    return NextResponse.json({
      success: true,
      categoryStats,
      arenas: arenasWithMatch,
      candidateId,
      isAuthenticated: Boolean(auth?.user?.id),
      studentDNASummary: {
        verifiedSkillsCount: dna.verifiedSkills.length,
        demonstratedSkillsCount: dna.demonstratedSkills.length,
        claimedOnlyCount: dna.inferredOrClaimedSkills.length,
        confidence: dna.confidenceAndFreshness.confidence,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("[api/skills/preparations] GET Error:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
