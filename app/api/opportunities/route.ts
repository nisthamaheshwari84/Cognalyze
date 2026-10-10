import { NextRequest, NextResponse } from "next/server";
import { opportunityService, OpportunityFeedFilterOptions } from "@/lib/opportunities/opportunity-service";
import { RecommendationTier, RemoteType } from "@/lib/opportunities/types";
import { getAuthenticatedContext } from "@/lib/auth/server";

/**
 * GET /api/opportunities
 * 
 * Fetches personalized opportunities for a candidate using their Student DNA.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(request);
    const { searchParams } = new URL(request.url);

    const studentId = auth?.user?.id || searchParams.get("studentId") || "student-demo";
    const searchQuery = searchParams.get("searchQuery") || undefined;
    const roleCategory = searchParams.get("roleCategory") || undefined;
    const remoteType = (searchParams.get("remoteType") as RemoteType) || undefined;
    const companyType = (searchParams.get("companyType") as "enterprise" | "startup" | "university") || undefined;
    const recommendationTier = (searchParams.get("recommendationTier") as RecommendationTier) || undefined;
    const closingSoon = searchParams.get("closingSoon") === "true";
    const forceRefresh = searchParams.get("forceRefresh") === "true";

    const filters: OpportunityFeedFilterOptions = {
      searchQuery,
      roleCategory,
      remoteType,
      companyType,
      recommendationTier,
      deadlineClosingSoon: closingSoon,
    };

    const feed = await opportunityService.getPersonalizedFeed(studentId, {
      filters,
      forceRefresh,
    });

    return NextResponse.json({
      success: true,
      summary: feed.summary,
      categorized: feed.categorized,
      allMatches: feed.allPersonalizedMatches,
      preferences: feed.preferences,
      studentContext: feed.studentContext,
    });
  } catch (error: any) {
    console.error("[GET /api/opportunities] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to retrieve personalized opportunities",
      },
      { status: 500 }
    );
  }
}
