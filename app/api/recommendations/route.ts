import { NextResponse } from "next/server";
import {
  computeMatchScore,
  generateMatchReasoning
} from "@/lib/ai/placement-intelligence";
import {
  getStudentProfile,
  getAllOpportunities,
  saveRecommendations,
  getCachedRecommendations
} from "@/lib/placement-store";
import { createNotification } from "@/lib/notifications";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidateId") || "student-default";
    const limitParam = searchParams.get("limit");
    const limit = limitParam && limitParam !== "all" ? parseInt(limitParam, 10) : undefined;

    const refresh = searchParams.get("refresh") === "true";

    // Check memory cache first (only if not forcing refresh and cache has sufficient depth)
    const cached = !refresh ? getCachedRecommendations(candidateId) : null;
    if (cached && cached.length > 0) {
      // If no limit was requested, ensure cache isn't just a small slice
      const isSufficient = limit ? cached.length >= limit : cached.length >= 30;
      if (isSufficient) {
        const sliced = limit ? cached.slice(0, limit) : cached;
        return NextResponse.json({
          success: true,
          candidateId,
          needsOnboarding: false,
          count: sliced.length,
          recommendations: sliced,
          from_cache: true
        });
      }
    }

    // 1. Fetch Student Profile
    const profile = await getStudentProfile(candidateId);
    if (!profile) {
      return NextResponse.json({
        needsOnboarding: true,
        message: "Student profile not found. Please complete onboarding first.",
        recommendations: []
      });
    }

    // 2. Fetch Opportunities
    const opportunities = await getAllOpportunities();
    if (!opportunities || opportunities.length === 0) {
      return NextResponse.json({
        needsOnboarding: false,
        recommendations: [],
        message: "No active opportunities found."
      });
    }

    // 3. Compute fit score for each opportunity
    const scoredList = opportunities.map(opp => {
      const match = computeMatchScore(profile, opp);
      return {
        opportunity: opp,
        fit_score: match.fit_score,
        matching_tags: match.matching_tags,
        missing_tags: match.missing_tags
      };
    });

    // Sort descending by fit score
    scoredList.sort((a, b) => b.fit_score - a.fit_score);

    // 4. Generate high-signal match reasoning for the FULL catalog
    const allRecommendations = scoredList.map((item) => {
      const targetRole = profile.target_roles?.[0] || "Software Engineering";
      const overlap = item.matching_tags.slice(0, 3).join(", ");
      const reasoning = item.matching_tags.length > 0
        ? `High synergy with your verified proficiency in ${overlap} targeting ${targetRole} tracks.`
        : `Strong platform to expand your profile and compete for high-impact ${item.opportunity.tier || "Tier 1"} roles.`;

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

    // 5. Persist the FULL recommendations array so subsequent calls have full depth
    await saveRecommendations(candidateId, allRecommendations);

    const recommendations = limit ? allRecommendations.slice(0, limit) : allRecommendations;

    // Unified Notification Hook: If top recommendation has high fit score (>= 85)
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

    return NextResponse.json({
      success: true,
      candidateId,
      needsOnboarding: false,
      count: recommendations.length,
      recommendations
    });
  } catch (err: any) {
    console.error("[recommendations GET] Error:", err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const candidateId = body.candidateId || "student-default";
    const limit = body.limit || 10;

    // Delegate to GET handler logic
    const url = new URL(`http://localhost/api/recommendations?candidateId=${candidateId}&limit=${limit}`);
    const syntheticReq = new Request(url.toString(), { method: "GET" });
    return GET(syntheticReq);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
