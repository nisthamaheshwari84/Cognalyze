import { NextRequest, NextResponse } from "next/server";
import { opportunityService, OpportunityFeedFilterOptions } from "@/lib/opportunities/opportunity-service";
import { CanonicalOpportunity, RecommendationTier, RemoteType } from "@/lib/opportunities/types";
import { getAuthenticatedContext } from "@/lib/auth/server";

/**
 * GET /api/opportunities
 * 
 * Fetches opportunities with multi-source filtering, search, pagination,
 * and Student DNA personalization when authenticated.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(request);
    const { searchParams } = new URL(request.url);

    const studentId = auth?.user?.id || (searchParams.get("studentId") === "student-demo" ? "student-demo" : null);
    const q = searchParams.get("q") || searchParams.get("searchQuery") || undefined;
    const category = searchParams.get("category") || searchParams.get("roleCategory") || undefined;
    const workMode = searchParams.get("workMode") || searchParams.get("remoteType");
    const remoteType = (workMode as RemoteType) || undefined;
    const country = searchParams.get("country") || undefined;
    const companyType = (searchParams.get("companyType") as "enterprise" | "startup" | "university") || undefined;
    const recommendationTier = (searchParams.get("recommendationTier") as RecommendationTier) || undefined;
    const closingSoon = searchParams.get("closingSoon") === "true";
    const verifiedOnly = searchParams.get("verifiedOnly") === "true";
    const forceRefresh = searchParams.get("forceRefresh") === "true";

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSizeParam = searchParams.get("pageSize") || searchParams.get("limit") || "24";
    const pageSize = pageSizeParam === "all" ? 9999 : Math.min(100, Math.max(1, parseInt(pageSizeParam, 10)));

    const filters: OpportunityFeedFilterOptions = {
      searchQuery: q,
      roleCategory: category,
      category,
      country,
      remoteType,
      companyType,
      recommendationTier,
      deadlineClosingSoon: closingSoon,
      verifiedOnly,
    };

    // If authenticated or studentId provided: Personalized Feed
    if (studentId) {
      const feed = await opportunityService.getPersonalizedFeed(studentId, {
        filters,
        forceRefresh,
      });

      const total = feed.allPersonalizedMatches.length;
      const totalPages = Math.ceil(total / pageSize);
      const startIndex = (page - 1) * pageSize;
      const paginatedMatches = feed.allPersonalizedMatches.slice(startIndex, startIndex + pageSize);

      return NextResponse.json({
        success: true,
        summary: feed.summary,
        categorized: feed.categorized,
        allMatches: paginatedMatches,
        pagination: {
          total,
          page,
          pageSize,
          totalPages,
          hasMore: page < totalPages,
        },
        preferences: feed.preferences,
        studentContext: feed.studentContext,
      });
    }

    // Guest / Unauthenticated Browsing over canonical catalog
    const allOpps = await opportunityService.ensureIngested(forceRefresh);

    // Apply filters directly to canonical opportunities
    let filteredOpps = allOpps.filter((opp) => {
      // 1. Text search
      if (q && q.trim().length > 0) {
        const query = q.toLowerCase();
        const searchableText = `${opp.title} ${opp.companyName} ${opp.organizer || ""} ${opp.location} ${opp.description || ""} ${(opp.requiredSkills || []).join(" ")} ${opp.roleDNA?.roleCategory || ""} ${(opp.tags || []).join(" ")}`.toLowerCase();
        if (!searchableText.includes(query)) return false;
      }

      // 2. Category
      if (category && category !== "all") {
        const target = category.toLowerCase();
        const oppType = (opp.opportunityType || "").toLowerCase();
        const roleCat = (opp.roleDNA?.roleCategory || "").toLowerCase();
        const classif = (opp.classification || "").toLowerCase();
        const matchesCat = oppType.includes(target) || roleCat.includes(target) || classif.includes(target);
        if (!matchesCat) return false;
      }

      // 3. Country / Location
      if (country && country !== "all") {
        const targetCountry = country.toLowerCase();
        const oppCountry = (opp.country || "").toLowerCase();
        const oppLocation = (opp.location || "").toLowerCase();
        if (!oppCountry.includes(targetCountry) && !oppLocation.includes(targetCountry) && oppCountry !== "global") {
          return false;
        }
      }

      // 4. Remote type
      if (remoteType && remoteType !== ("all" as any)) {
        if (opp.remoteType !== remoteType) return false;
      }

      // 5. Company type
      if (companyType && companyType !== ("all" as any)) {
        if (opp.companyType !== companyType) return false;
      }

      // 6. Verified only
      if (verifiedOnly) {
        if (opp.verificationStatus !== "VERIFIED") return false;
      }

      // 7. Closing soon
      if (closingSoon) {
        if (!opp.deadline) return false;
        const diff = new Date(opp.deadline).getTime() - Date.now();
        if (diff < 0 || diff > 7 * 86400000) return false;
      }

      return true;
    });

    const total = filteredOpps.length;
    const totalPages = Math.ceil(total / pageSize);
    const startIndex = (page - 1) * pageSize;
    const paginatedOpps = filteredOpps.slice(startIndex, startIndex + pageSize);

    // Map to normalized match format for consistent client rendering
    const mappedMatches = paginatedOpps.map((opp) => ({
      candidateId: "guest",
      opportunityId: opp.id,
      opportunity: opp,
      eligibilityResult: {
        status: "ELIGIBLE" as const,
        isEligible: true,
        reasons: ["Open application window"],
        blockers: [],
        warnings: [],
      },
      recommendation: "EXPLORE" as const,
      recommendationReason: "Sign in to evaluate evidence-backed Student DNA alignment",
      priority: "MEDIUM" as const,
      internalScore: 70,
      matchBreakdown: {
        roleAlignment: "Moderate" as const,
        coreRequirementCoverage: { total: opp.requiredSkills?.length || 0, matched: 0, percentage: 0 },
        evidenceStrength: "Claimed" as const,
        projectRelevance: "Moderate" as const,
        experienceFit: "Strong" as const,
        preferenceFit: "Strong" as const,
        trajectoryFit: "Moderate" as const,
      },
      evidenceMapping: [],
      matchedRequirements: [],
      missingRequirements: opp.requiredSkills || [],
      evidenceGaps: (opp.requiredSkills || []).map((sk) => ({
        skill: sk,
        isMustHave: true,
        recommendationAction: `Build a verifiable project demonstrating ${sk}`,
      })),
      why: {
        whyThisCandidate: "Sign in to calculate personalized alignment",
        whyThisOpportunity: opp.description || opp.title,
        whyNow: opp.deadline ? `Application deadline: ${opp.deadline}` : "Open rolling admission",
        summary: `Explore ${opp.title} at ${opp.companyName || opp.organizer}`,
      },
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 86400000).toISOString(),
    }));

    return NextResponse.json({
      success: true,
      summary: {
        totalResearched: allOpps.length,
        activeCount: allOpps.filter((o) => o.status === "ACTIVE").length,
        uniqueAfterDeduplication: allOpps.length,
        personalizedCount: total,
        applyNowCount: 0,
        buildEvidenceCount: 0,
        exploreCount: total,
        newSinceLastVisit: Math.min(total, 6),
        closingSoonCount: filteredOpps.filter((o) => {
          if (!o.deadline) return false;
          const diff = new Date(o.deadline).getTime() - Date.now();
          return diff > 0 && diff <= 7 * 86400000;
        }).length,
        sourcesActive: opportunityService.getSourceHealth().filter((s) => s.status === "ACTIVE").length,
        lastResearchedAt: new Date().toISOString(),
      },
      categorized: {
        applyNow: [],
        buildEvidence: [],
        explore: mappedMatches,
        verify: [],
        lowPriority: [],
        notEligible: [],
      },
      allMatches: mappedMatches,
      pagination: {
        total,
        page,
        pageSize,
        totalPages,
        hasMore: page < totalPages,
      },
      preferences: null,
      studentContext: null,
    });
  } catch (error: any) {
    console.error("[GET /api/opportunities] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to retrieve opportunities",
      },
      { status: 500 }
    );
  }
}
