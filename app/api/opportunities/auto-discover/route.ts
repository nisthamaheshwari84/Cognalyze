import { NextRequest, NextResponse } from "next/server";
import { opportunityService } from "@/lib/opportunities/opportunity-service";
import {
  recordStudentEvent,
  getStudentIntelligenceProfile,
} from "@/lib/intelligence/student-intelligence";

export const maxDuration = 60;

/**
 * GET /api/opportunities/auto-discover
 * 
 * Fetches automatic opportunity discovery results for a candidate
 * based on their current Student DNA and verified evidence.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId") || "student-demo";

    const feed = await opportunityService.getPersonalizedFeed(studentId);

    // Map into candidate-facing categories
    const strongOpportunities = feed.categorized.applyNow.map((m) => ({
      id: m.opportunityId,
      title: m.opportunity.title,
      company: m.opportunity.companyName,
      location: m.opportunity.location,
      remoteType: m.opportunity.remoteType,
      employmentType: m.opportunity.employmentType,
      stipend: m.opportunity.compensation?.stipendText || "Competitive Stipend",
      badge: "You can apply",
      recommendation: "Apply now. Your core evidence aligns strongly with the role.",
      whySummary: m.why.summary,
      whyThisCandidate: m.why.whyThisCandidate,
      whyThisOpportunity: m.why.whyThisOpportunity,
      whyNow: m.why.whyNow,
      matchedEvidence: m.matchedRequirements,
      evidenceGaps: m.evidenceGaps.map((g) => g.skill),
      source: m.opportunity.source,
      freshness: m.opportunity.freshness === "FRESH" ? "Verified today" : "Verified active",
      applicationUrl: m.opportunity.applicationUrl || m.opportunity.sourceUrl,
      sourceUrl: m.opportunity.sourceUrl,
      companyType: m.opportunity.companyType,
    }));

    const opportunitiesWithGaps = feed.categorized.buildEvidence.map((m) => ({
      id: m.opportunityId,
      title: m.opportunity.title,
      company: m.opportunity.companyName,
      location: m.opportunity.location,
      remoteType: m.opportunity.remoteType,
      employmentType: m.opportunity.employmentType,
      stipend: m.opportunity.compensation?.stipendText || "Competitive Stipend",
      badge: "Relevant — but evidence gap",
      recommendation: m.recommendationReason,
      whySummary: m.why.summary,
      whyThisCandidate: m.why.whyThisCandidate,
      whyThisOpportunity: m.why.whyThisOpportunity,
      whyNow: m.why.whyNow,
      matchedEvidence: m.matchedRequirements,
      evidenceGaps: m.evidenceGaps.map((g) => g.skill),
      actionPlan: m.actionPlan,
      source: m.opportunity.source,
      freshness: m.opportunity.freshness === "FRESH" ? "Verified today" : "Verified active",
      applicationUrl: m.opportunity.applicationUrl || m.opportunity.sourceUrl,
      sourceUrl: m.opportunity.sourceUrl,
      companyType: m.opportunity.companyType,
    }));

    const otherOpportunities = [
      ...feed.categorized.explore,
      ...feed.categorized.verify,
    ].slice(0, 5).map((m) => ({
      id: m.opportunityId,
      title: m.opportunity.title,
      company: m.opportunity.companyName,
      location: m.opportunity.location,
      remoteType: m.opportunity.remoteType,
      employmentType: m.opportunity.employmentType,
      stipend: m.opportunity.compensation?.stipendText || "Competitive Stipend",
      badge: m.recommendation === "VERIFY" ? "Verify eligibility" : "Moderate fit",
      recommendation: m.recommendationReason,
      whySummary: m.why.summary,
      whyThisCandidate: m.why.whyThisCandidate,
      whyThisOpportunity: m.why.whyThisOpportunity,
      whyNow: m.why.whyNow,
      matchedEvidence: m.matchedRequirements,
      evidenceGaps: m.evidenceGaps.map((g) => g.skill),
      source: m.opportunity.source,
      freshness: m.opportunity.freshness === "FRESH" ? "Verified today" : "Verified active",
      applicationUrl: m.opportunity.applicationUrl || m.opportunity.sourceUrl,
      sourceUrl: m.opportunity.sourceUrl,
      companyType: m.opportunity.companyType,
    }));

    const totalCount =
      strongOpportunities.length +
      opportunitiesWithGaps.length +
      otherOpportunities.length;

    return NextResponse.json({
      success: true,
      status: "completed",
      totalResearched: feed.summary.totalResearched,
      totalMatched: totalCount,
      summaryText: `Cognalyze researched current opportunities based on your updated Student DNA and found ${totalCount} opportunities relevant to your profile.`,
      categories: {
        strongOpportunities,
        opportunitiesWithGaps,
        otherOpportunities,
      },
      sourcesCount: feed.summary.sourcesActive,
      lastResearchedAt: feed.summary.lastResearchedAt,
    });
  } catch (error: any) {
    console.error("[GET /api/opportunities/auto-discover] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to auto-discover opportunities",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/opportunities/auto-discover
 * 
 * Triggered automatically upon resume analysis completion.
 * Updates Student DNA with newly extracted resume evidence,
 * then triggers asynchronous opportunity research.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentId = "student-demo", extractedSkills, extractedProjects } = body;

    // 1. Update Student DNA with new evidence if provided
    if (extractedSkills?.length > 0 || extractedProjects?.length > 0) {
      await recordStudentEvent({
        studentId,
        eventType: "resume_uploaded",
        payload: {
          skills: extractedSkills || [],
          projects: extractedProjects || [],
        },
      });
    }

    // 2. Run Opportunity Research on updated Student DNA
    const feed = await opportunityService.getPersonalizedFeed(studentId, {
      forceRefresh: true,
    });

    const strongOpportunities = feed.categorized.applyNow.map((m) => ({
      id: m.opportunityId,
      title: m.opportunity.title,
      company: m.opportunity.companyName,
      location: m.opportunity.location,
      remoteType: m.opportunity.remoteType,
      employmentType: m.opportunity.employmentType,
      stipend: m.opportunity.compensation?.stipendText || "Competitive Stipend",
      badge: "You can apply",
      recommendation: "Apply now. Your core evidence aligns strongly with the role.",
      whySummary: m.why.summary,
      whyThisCandidate: m.why.whyThisCandidate,
      whyThisOpportunity: m.why.whyThisOpportunity,
      whyNow: m.why.whyNow,
      matchedEvidence: m.matchedRequirements,
      evidenceGaps: m.evidenceGaps.map((g) => g.skill),
      source: m.opportunity.source,
      freshness: m.opportunity.freshness === "FRESH" ? "Verified today" : "Verified active",
      applicationUrl: m.opportunity.applicationUrl || m.opportunity.sourceUrl,
      sourceUrl: m.opportunity.sourceUrl,
      companyType: m.opportunity.companyType,
    }));

    const opportunitiesWithGaps = feed.categorized.buildEvidence.map((m) => ({
      id: m.opportunityId,
      title: m.opportunity.title,
      company: m.opportunity.companyName,
      location: m.opportunity.location,
      remoteType: m.opportunity.remoteType,
      employmentType: m.opportunity.employmentType,
      stipend: m.opportunity.compensation?.stipendText || "Competitive Stipend",
      badge: "Relevant — but evidence gap",
      recommendation: m.recommendationReason,
      whySummary: m.why.summary,
      whyThisCandidate: m.why.whyThisCandidate,
      whyThisOpportunity: m.why.whyThisOpportunity,
      whyNow: m.why.whyNow,
      matchedEvidence: m.matchedRequirements,
      evidenceGaps: m.evidenceGaps.map((g) => g.skill),
      actionPlan: m.actionPlan,
      source: m.opportunity.source,
      freshness: m.opportunity.freshness === "FRESH" ? "Verified today" : "Verified active",
      applicationUrl: m.opportunity.applicationUrl || m.opportunity.sourceUrl,
      sourceUrl: m.opportunity.sourceUrl,
      companyType: m.opportunity.companyType,
    }));

    const otherOpportunities = [
      ...feed.categorized.explore,
      ...feed.categorized.verify,
    ].slice(0, 5).map((m) => ({
      id: m.opportunityId,
      title: m.opportunity.title,
      company: m.opportunity.companyName,
      location: m.opportunity.location,
      remoteType: m.opportunity.remoteType,
      employmentType: m.opportunity.employmentType,
      stipend: m.opportunity.compensation?.stipendText || "Competitive Stipend",
      badge: m.recommendation === "VERIFY" ? "Verify eligibility" : "Moderate fit",
      recommendation: m.recommendationReason,
      whySummary: m.why.summary,
      whyThisCandidate: m.why.whyThisCandidate,
      whyThisOpportunity: m.why.whyThisOpportunity,
      whyNow: m.why.whyNow,
      matchedEvidence: m.matchedRequirements,
      evidenceGaps: m.evidenceGaps.map((g) => g.skill),
      source: m.opportunity.source,
      freshness: m.opportunity.freshness === "FRESH" ? "Verified today" : "Verified active",
      applicationUrl: m.opportunity.applicationUrl || m.opportunity.sourceUrl,
      sourceUrl: m.opportunity.sourceUrl,
      companyType: m.opportunity.companyType,
    }));

    const totalCount =
      strongOpportunities.length +
      opportunitiesWithGaps.length +
      otherOpportunities.length;

    return NextResponse.json({
      success: true,
      status: "completed",
      totalResearched: feed.summary.totalResearched,
      totalMatched: totalCount,
      summaryText: `Cognalyze researched current opportunities based on your updated Student DNA and found ${totalCount} opportunities relevant to your profile.`,
      categories: {
        strongOpportunities,
        opportunitiesWithGaps,
        otherOpportunities,
      },
      sourcesCount: feed.summary.sourcesActive,
      lastResearchedAt: feed.summary.lastResearchedAt,
    });
  } catch (error: any) {
    console.error("[POST /api/opportunities/auto-discover] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to trigger auto-discovery",
      },
      { status: 500 }
    );
  }
}
