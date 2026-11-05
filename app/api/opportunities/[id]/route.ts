import { NextRequest, NextResponse } from "next/server";
import { opportunityService } from "@/lib/opportunities/opportunity-service";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { dynamicPreparationEngine } from "@/lib/opportunities/engines/dynamic-preparation-engine";
import { CanonicalOpportunity } from "@/lib/opportunities/types";
import { OpportunityData } from "@/lib/ai/placement-intelligence";
import { getAllOpportunities } from "@/lib/placement-store";

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
      perks: c.prize ? [c.prize] : [],
      tracks_or_themes: c.domains || []
    },
    verificationStatus: (c.status === "ACTIVE" ? "verified" : "pending") as any,
    lastVerifiedAt: c.lastVerifiedAt || undefined,
    discoveredAt: c.postedAt,
    mode: c.remoteType as any,
    teamSize: c.teamSize,
    prize: c.prize
  };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedContext(request);
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const studentId = auth?.user?.id || searchParams.get("studentId") || searchParams.get("candidateId") || "student-demo";

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Opportunity ID is required" },
        { status: 400 }
      );
    }

    const cleanId = id.trim();
    const normalizedQueryId = cleanId.toLowerCase().replace(/-/g, "_");
    const dashQueryId = cleanId.toLowerCase().replace(/_/g, "-");

    // 1. Ensure canonical catalog is ingested and warm
    const opps = await opportunityService.ensureIngested();
    let canonicalOpp = opps.find((o) =>
      o.id === cleanId ||
      o.id.toLowerCase() === cleanId.toLowerCase() ||
      o.id.toLowerCase() === normalizedQueryId ||
      o.id.toLowerCase() === dashQueryId ||
      o.sourceId === cleanId ||
      o.normalizedTitle === cleanId.toLowerCase()
    );

    // 2. Check Real Opportunity Catalog (122+ corporate, startup & research opportunities)
    let legacyOpp: OpportunityData | null = null;
    if (!canonicalOpp) {
      const { REAL_OPPORTUNITY_CATALOG } = await import("@/lib/dna/opportunity-intelligence");
      const matchedPersonalized = REAL_OPPORTUNITY_CATALOG.find((o) =>
        o.id === cleanId ||
        o.id.toLowerCase() === cleanId.toLowerCase() ||
        o.id.toLowerCase() === normalizedQueryId ||
        o.id.toLowerCase() === dashQueryId ||
        o.title.toLowerCase().trim() === cleanId.toLowerCase().trim()
      );

      if (matchedPersonalized) {
        canonicalOpp = {
          id: matchedPersonalized.id,
          source: matchedPersonalized.sourceName,
          sourceType: "COMPANY_CAREER",
          sourceUrl: matchedPersonalized.sourceUrl,
          applicationUrl: matchedPersonalized.sourceUrl,
          companyId: "org-partner",
          companyName: matchedPersonalized.organization,
          organizer: matchedPersonalized.organization,
          title: matchedPersonalized.title,
          normalizedTitle: matchedPersonalized.title.toLowerCase().trim(),
          description: matchedPersonalized.description,
          responsibilities: [],
          location: matchedPersonalized.location,
          country: "India",
          city: matchedPersonalized.location.split("/")[0]?.trim() || "Online",
          remoteType: matchedPersonalized.workMode === "Remote" ? "remote" : matchedPersonalized.workMode === "Hybrid" ? "hybrid" : "onsite",
          employmentType: matchedPersonalized.category === "job" ? "full_time" : "internship",
          experienceLevel: matchedPersonalized.experienceLevel === "0-1 Years" ? "entry_level" : "intern",
          educationRequirements: { degreesAllowed: ["All"], fieldsAllowed: ["All"], isMandatory: false },
          graduationRequirements: { isMandatory: false },
          requiredSkills: matchedPersonalized.requiredSkills,
          preferredSkills: matchedPersonalized.preferredSkills,
          eligibilityRequirements: [matchedPersonalized.eligibility],
          disqualifiers: [],
          postedAt: matchedPersonalized.lastChecked,
          updatedAt: matchedPersonalized.lastChecked,
          deadline: matchedPersonalized.deadline || null,
          status: "ACTIVE",
          freshness: "FRESH",
          roleDNA: {
            roleCategory: matchedPersonalized.categoryLabel || "Engineering",
            mustHaveSkills: matchedPersonalized.requiredSkills,
            preferredSkills: matchedPersonalized.preferredSkills,
            experienceYearsMin: 0,
            experienceYearsMax: 1,
            educationSummary: matchedPersonalized.eligibility,
            graduationWindow: "Open",
            locationMode: matchedPersonalized.workMode,
            disqualifiers: []
          },
          createdAt: matchedPersonalized.lastChecked,
          lastVerifiedAt: matchedPersonalized.lastChecked
        };
      }
    }

    // 3. If not found, check placement store
    if (!canonicalOpp) {
      const allLegacy = await getAllOpportunities();
      const found = allLegacy.find((o) =>
        (o.id && (o.id === cleanId || o.id.toLowerCase() === cleanId.toLowerCase() || o.id.toLowerCase() === normalizedQueryId || o.id.toLowerCase() === dashQueryId)) ||
        o.title.toLowerCase().trim() === cleanId.toLowerCase().trim()
      );
      if (found) {
        legacyOpp = found;
        canonicalOpp = {
          id: found.id || cleanId,
          source: found.extracted_context?.platform || "Cognalyze Verified",
          sourceType: "COMPANY_CAREER",
          sourceUrl: found.source_url || "",
          applicationUrl: found.source_url || "",
          companyId: "org-partner",
          companyName: found.organizer,
          organizer: found.organizer,
          title: found.title,
          normalizedTitle: found.title.toLowerCase(),
          description: found.extracted_context?.summary || found.eligibility,
          responsibilities: [],
          location: "Virtual",
          country: "India",
          city: "Online",
          remoteType: "remote",
          employmentType: "internship",
          experienceLevel: "intern",
          educationRequirements: { degreesAllowed: ["All"], fieldsAllowed: ["All"], isMandatory: false },
          graduationRequirements: { isMandatory: false },
          requiredSkills: found.tags || [],
          preferredSkills: [],
          eligibilityRequirements: [found.eligibility],
          disqualifiers: [],
          postedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deadline: found.deadline,
          status: "ACTIVE",
          freshness: "FRESH",
          roleDNA: {
            roleCategory: "Engineering Challenge",
            mustHaveSkills: (found.tags || []).slice(0, 3),
            preferredSkills: [],
            experienceYearsMin: 0,
            experienceYearsMax: 2,
            educationSummary: found.eligibility,
            graduationWindow: "Open",
            locationMode: "Remote",
            disqualifiers: []
          },
          createdAt: new Date().toISOString(),
          lastVerifiedAt: new Date().toISOString()
        };
      }
    }

    if (!canonicalOpp && !legacyOpp) {
      return NextResponse.json(
        { success: false, error: "Opportunity not found or expired" },
        { status: 404 }
      );
    }

    const resolvedOpp: OpportunityData = legacyOpp || mapCanonicalToOpportunityData(canonicalOpp!);
    let match = canonicalOpp ? await opportunityService.getOpportunityById(canonicalOpp.id, studentId) : null;

    // Load actual student DNA to personalize preparation plan
    let studentDNA: any = null;
    if (studentId) {
      try {
        const { getStudentDNAFull } = await import("@/lib/dna/store");
        const full = await getStudentDNAFull(studentId);
        if (full) {
          studentDNA = {
            verifiedSkills: full.skills?.map((s: any) => s.name || s.skillName) || [],
            skills: full.skills || [],
            coreSkills: full.skills?.map((s: any) => s.name || s.skillName) || [],
            capabilities: (full.snapshot as any)?.capabilities || {}
          };
        }
      } catch (err) {
        console.warn("Could not load student DNA for preparation plan:", err);
      }
    }

    const preparationPlan = dynamicPreparationEngine.generatePreparationPlan(canonicalOpp!, studentDNA);
    const isSaved = studentId ? opportunityService.isOpportunitySaved(studentId, canonicalOpp!.id) : false;

    return NextResponse.json({
      success: true,
      match,
      opportunity: resolvedOpp,
      canonicalOpportunity: canonicalOpp,
      preparationPlan,
      isSaved,
    });
  } catch (error: any) {
    console.error("[GET /api/opportunities/[id]] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to retrieve opportunity details",
      },
      { status: 500 }
    );
  }
}
