import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { getStudentDNAFull } from "@/lib/dna/store";
import {
  REAL_OPPORTUNITY_CATALOG,
  evaluateOpportunityAgainstStudentDNA,
  getStudentSavedOpportunityIds,
  getStudentTrackedApplications,
  PersonalizedOpportunity,
  GroundedOpportunityEvaluation,
  StudentTrackedApplication
} from "@/lib/dna/opportunity-intelligence";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in to view Personalized Opportunities." },
        { status: 401 }
      );
    }

    if (auth.user.accountType === "recruiter") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Recruiter accounts cannot access Student Opportunity Intelligence." },
        { status: 403 }
      );
    }

    const candidateId = auth.user.id;
    const { searchParams } = new URL(req.url);
    const categoryFilter = searchParams.get("category");
    const freshnessFilter = searchParams.get("freshness");
    const matchFilter = searchParams.get("matchCategory");

    // 1. Fetch Student DNA canonical profile
    const dnaFull = await getStudentDNAFull(candidateId);
    const savedIds = new Set(getStudentSavedOpportunityIds(candidateId));
    const trackedList = getStudentTrackedApplications(candidateId);
    const trackedMap = new Map<string, StudentTrackedApplication>();
    for (const t of trackedList) {
      trackedMap.set(t.opportunityId, t);
    }

    // 2. Evaluate all catalog opportunities against this student's DNA
    const evaluatedOpportunities = REAL_OPPORTUNITY_CATALOG.map((opp) => {
      const evaluation = evaluateOpportunityAgainstStudentDNA(dnaFull.skills, dnaFull.snapshot, opp);
      const isSaved = savedIds.has(opp.id);
      const tracked = trackedMap.get(opp.id);

      return {
        opportunity: opp,
        evaluation,
        isSaved,
        trackedStage: tracked?.stage || (isSaved ? "SAVED" : null),
        trackedApplication: tracked || null
      };
    });

    // 3. Sort by DNA Alignment Score (Ranked Recommendations)
    evaluatedOpportunities.sort((a, b) => b.evaluation.dnaAlignmentScore - a.evaluation.dnaAlignmentScore);

    // 4. Apply optional filters
    let filtered = evaluatedOpportunities;
    if (categoryFilter && categoryFilter !== "ALL") {
      filtered = filtered.filter(item => item.opportunity.category === categoryFilter);
    }
    if (freshnessFilter && freshnessFilter !== "ALL") {
      filtered = filtered.filter(item => item.opportunity.freshnessState === freshnessFilter);
    }
    if (matchFilter && matchFilter !== "ALL") {
      filtered = filtered.filter(item => item.evaluation.matchCategory === matchFilter);
    }

    // 5. Categorized buckets for dedicated tabs
    const recommendedForYou = evaluatedOpportunities.slice(0, 8);
    const jobsAndInternships = evaluatedOpportunities.filter(
      item => item.opportunity.category === "job" || item.opportunity.category === "internship"
    );
    const hackathonsAndFellowships = evaluatedOpportunities.filter(
      item => item.opportunity.category === "hackathon" || item.opportunity.category === "fellowship"
    );
    const researchOpportunities = evaluatedOpportunities.filter(
      item => item.opportunity.category === "research"
    );
    const freelanceAndProjects = evaluatedOpportunities.filter(
      item => item.opportunity.category === "freelance_project"
    );
    const otherFields = evaluatedOpportunities.filter(
      item => item.opportunity.category === "other_field"
    );
    const savedOpportunities = evaluatedOpportunities.filter(item => item.isSaved);
    const trackedApplications = trackedList;

    return NextResponse.json({
      success: true,
      candidateId,
      totalCount: evaluatedOpportunities.length,
      opportunities: filtered,
      buckets: {
        recommendedForYou,
        jobsAndInternships,
        hackathonsAndFellowships,
        researchOpportunities,
        freelanceAndProjects,
        otherFields,
        savedOpportunities,
        trackedApplications
      },
      stats: {
        strongMatchCount: evaluatedOpportunities.filter(i => i.evaluation.matchCategory === "STRONG MATCH").length,
        potentialMatchCount: evaluatedOpportunities.filter(i => i.evaluation.matchCategory === "POTENTIAL MATCH").length,
        savedCount: savedOpportunities.length,
        appliedCount: trackedList.filter(t => t.stage === "APPLIED" || t.stage === "INTERVIEW" || t.stage === "OFFER").length
      }
    });
  } catch (error: any) {
    console.error("GET /api/student-dna/opportunities error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load personalized opportunities" },
      { status: 500 }
    );
  }
}
