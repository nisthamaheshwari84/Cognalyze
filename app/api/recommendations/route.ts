import { NextRequest, NextResponse } from "next/server";
import {
  computeMatchScore,
  StudentProfileData,
  OpportunityData
} from "@/lib/ai/placement-intelligence";
import {
  getStudentProfile,
  saveRecommendations,
  getCachedRecommendations
} from "@/lib/placement-store";
import { createNotification } from "@/lib/notifications";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { opportunityService } from "@/lib/opportunities/opportunity-service";
import { CanonicalOpportunity } from "@/lib/opportunities/types";

/**
 * Maps canonical opportunity to legacy OpportunityData shape for backward compatibility
 */
function mapCanonicalToOpportunityData(c: CanonicalOpportunity): OpportunityData {
  const orgType: any = c.sourceType === "IIT"
    ? "IIT-fest"
    : c.sourceType === "UNIVERSITY"
    ? "university"
    : c.sourceType === "STARTUP"
    ? "startup"
    : "corporate";

  const oppType: any = c.opportunityType === "INTERNSHIP"
    ? "internship"
    : c.opportunityType === "JOB"
    ? "internship"
    : c.opportunityType === "FELLOWSHIP"
    ? "fellowship"
    : c.opportunityType === "COMPETITION"
    ? "contest"
    : "hackathon";

  return {
    id: c.id,
    title: c.title,
    type: oppType,
    organizer: c.organizer || c.companyName,
    organizer_type: orgType,
    tags: c.tags && c.tags.length > 0 ? c.tags : (c.requiredSkills || []),
    domain_tags: c.domains && c.domains.length > 0 ? c.domains : ["Software Engineering"],
    tier: "Tier 1",
    deadline: c.deadline,
    eligibility: c.eligibilityRequirements?.[0] || c.roleDNA?.educationSummary || "Open to eligible students",
    source_url: c.applicationUrl || c.sourceUrl,
    extracted_context: {
      platform: c.source || c.sourceType,
      summary: c.description,
      prize_pool: c.prize || undefined,
      team_size: c.teamSize || undefined,
      perks: c.prize ? [c.prize] : []
    }
  };
}

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const { searchParams } = new URL(req.url);
    const isDemo = process.env.NODE_ENV !== "production" && (searchParams.get("candidateId") === "student-demo" || req.headers.get("x-cognalyze-demo") === "true");
    const queryCandidateId = searchParams.get("candidateId");

    const candidateId = auth?.user?.id || (queryCandidateId && queryCandidateId !== "null" && queryCandidateId !== "undefined" ? queryCandidateId : null) || (isDemo ? "student-demo" : "student-demo");

    const limitParam = searchParams.get("limit");
    const limit = limitParam && limitParam !== "all" ? parseInt(limitParam, 10) : undefined;
    const refresh = searchParams.get("refresh") === "true";

    // 1. Fetch Student Profile with fallback to canonical Student DNA
    let fetchedProfile = candidateId ? await getStudentProfile(candidateId) : null;
    let needsOnboarding = false;

    if (!fetchedProfile || !fetchedProfile.skills || fetchedProfile.skills.length === 0) {
      needsOnboarding = true;
      if (candidateId) {
        try {
          const { getStudentDNAFull } = await import("@/lib/dna/store");
          const dna = await getStudentDNAFull(candidateId);
          if (dna && dna.skills && dna.skills.length > 0) {
            fetchedProfile = {
              candidate_id: candidateId,
              skills: dna.skills.map((s: any) => ({
                name: s.name || s.skillName,
                level: (s.confidenceScore && s.confidenceScore >= 0.8) ? "Advanced" : (s.confidenceScore && s.confidenceScore >= 0.5) ? "Intermediate" : "Beginner",
                evidence: s.evidenceCount ? `${s.evidenceCount} verified artifacts` : "Verified by DNA"
              })),
              past_projects: ((dna as any).projects || []).map((p: any) => ({
                title: p.title || p.name,
                description: p.description || "",
                tech_stack: p.techStack || p.technologies || []
              })),
              target_roles: dna.targetRoleTitle ? [dna.targetRoleTitle] : ["Software Engineer"],
              target_companies_or_events: [],
              availability: "Immediate",
              risk_appetite: "Moderate",
              profile_summary: (dna as any).headline || "Verified Engineering Candidate",
              experience_level: "fresher"
            };
            needsOnboarding = false;
          }
        } catch (e) {
          console.warn("Could not load Student DNA for recommendations profile:", e);
        }
      }
      if (!fetchedProfile && candidateId === "student-demo") {
        fetchedProfile = await getStudentProfile("student-demo");
      }
    }

    // Check memory cache first (only if not forcing refresh)
    const cached = (!refresh && candidateId) ? getCachedRecommendations(candidateId) : null;
    if (cached && cached.length > 0) {
      const isSufficient = limit ? cached.length >= limit : cached.length >= 30;
      if (isSufficient) {
        const sliced = limit ? cached.slice(0, limit) : cached;
        return NextResponse.json({
          success: true,
          candidateId: candidateId || "",
          needsOnboarding,
          count: sliced.length,
          recommendations: sliced,
          from_cache: true
        });
      }
    }

    const activeProfile: StudentProfileData = fetchedProfile || {
      candidate_id: candidateId || "",
      skills: [],
      past_projects: [],
      target_roles: ["Software Engineer"],
      target_companies_or_events: [],
      availability: "Immediate",
      risk_appetite: "Moderate",
      profile_summary: "",
      experience_level: "fresher"
    };

    // 2. Fetch Opportunities from Canonical Opportunity Service merged with Comprehensive Store (224+ verified opportunities)
    const { getAllOpportunities } = await import("@/lib/placement-store");
    const canonicalList = await opportunityService.ensureIngested(refresh);
    const activeCanonical = canonicalList.filter(o => o.status === "ACTIVE").map(mapCanonicalToOpportunityData);
    const allStoreOpps = await getAllOpportunities();

    const oppMap = new Map<string, OpportunityData>();
    for (const opp of activeCanonical) {
      if (opp.id) oppMap.set(opp.id.toLowerCase(), opp);
    }
    for (const opp of allStoreOpps) {
      const key = (opp.id || opp.title).toLowerCase();
      if (!oppMap.has(key)) {
        oppMap.set(key, opp);
      }
    }
    const opportunities = Array.from(oppMap.values());

    if (!opportunities || opportunities.length === 0) {
      return NextResponse.json({
        success: true,
        candidateId: candidateId || "",
        needsOnboarding,
        count: 0,
        recommendations: [],
        message: "No verified opportunities are available from your currently connected sources. Connect approved sources or check back after the next refresh."
      });
    }

    // 3. Compute fit score for each opportunity against student evidence
    const scoredList = opportunities.map(opp => {
      const match = computeMatchScore(activeProfile, opp);
      return {
        opportunity: opp,
        fit_score: match.fit_score,
        matching_tags: match.matching_tags,
        missing_tags: match.missing_tags
      };
    });

    // Sort descending by fit score
    scoredList.sort((a, b) => b.fit_score - a.fit_score);

    // 4. Generate match reasoning
    const allRecommendations = scoredList.map((item) => {
      const targetRole = activeProfile.target_roles?.[0] || "Software Engineering";
      const overlap = item.matching_tags.slice(0, 3).join(", ");
      const reasoning = item.matching_tags.length > 0
        ? `Synergy with your demonstrated skills in ${overlap} targeting ${targetRole}.`
        : `Opportunity from ${item.opportunity.organizer} to develop hands-on technical evidence.`;

      return {
        opportunity_id: item.opportunity.id || "",
        fit_score: item.fit_score,
        matching_tags: item.matching_tags,
        missing_tags: item.missing_tags,
        reasoning,
        status: "recommended",
        opportunity: item.opportunity
      };
    });

    // 5. Persist recommendations cache for this user
    if (candidateId) {
      await saveRecommendations(candidateId, allRecommendations);
    }

    const recommendations = limit ? allRecommendations.slice(0, limit) : allRecommendations;

    // Notification Hook for high-fit match
    if (candidateId) {
      const topMatch = recommendations.find(r => r.fit_score >= 85);
      if (topMatch) {
        await createNotification({
          studentId: candidateId,
          sourceFeature: "matching",
          notificationType: "new_high_fit_match",
          title: `🎯 New High-Fit Match: ${topMatch.opportunity.title} (${Math.round(topMatch.fit_score)}%)`,
          body: `Top placement match from ${topMatch.opportunity.organizer} with ${topMatch.matching_tags?.length || 0} overlapping skills.`,
          linkUrl: `/student/opportunities/${topMatch.opportunity.id}`,
          priority: "normal"
        });
      }
    }

    return NextResponse.json({
      success: true,
      candidateId: candidateId || "",
      needsOnboarding,
      count: recommendations.length,
      recommendations
    });
  } catch (err: any) {
    console.error("[recommendations GET] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const body = await req.json().catch(() => ({}));
    const isDemo = process.env.NODE_ENV !== "production" && (body.candidateId === "student-demo" || req.headers.get("x-cognalyze-demo") === "true");

    if (!auth && !isDemo) {
      return NextResponse.json({ error: "Unauthorized. Authentication is required." }, { status: 401 });
    }

    // Delegate to GET handler logic with authenticated context preserved
    return GET(req);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
