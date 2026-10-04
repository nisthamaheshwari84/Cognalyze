/**
 * COGNALYZE OPPORTUNITY INTELLIGENCE — PERSONALIZATION & RANKING ENGINE
 * 
 * CORE PRINCIPLE:
 * Student DNA × Role DNA × Evidence × Career Intent × Eligibility × Preferences × Career Memory
 * -> Personalized Opportunity Recommendation
 * 
 * Rules:
 * 1. Evidence-First Matching: Never do "keyword in JD + keyword in resume = Match".
 * 2. Classify evidence rigorously: PROVEN, SUPPORTED, CLAIMED, WEAK, MISSING.
 * 3. Never expose an internal ranking score as a "hiring probability".
 * 4. Distinct recommendation tiers: APPLY_NOW, BUILD_EVIDENCE, EXPLORE, VERIFY, LOW_PRIORITY, NOT_ELIGIBLE.
 * 5. Every recommendation generates transparent "Why this candidate?", "Why this opportunity?", "Why now?".
 * 6. "Build Evidence First" turns skill gaps into concrete actionable project action plans.
 */

import {
  CanonicalOpportunity,
  CandidateOpportunityMatch,
  EligibilityResult,
  EvidenceGapItem,
  EvidenceMappingItem,
  EvidenceStatus,
  OpportunityActionPlan,
  RecommendationTier,
  StudentOpportunityPreferences,
  SupportingEvidenceDetail,
} from "../types";
import {
  StudentDNAProfile,
  EvidenceItem,
  getStudentEvidence,
  getCareerMemory,
} from "@/lib/intelligence/student-intelligence";
import { CandidateEligibilityContext, OpportunityEligibilityEngine } from "./eligibility-engine";

export class OpportunityPersonalizationEngine {
  /**
   * Matches and personalizes a single opportunity for a specific candidate.
   */
  public static matchOpportunity(
    opportunity: CanonicalOpportunity,
    profile: StudentDNAProfile,
    preferences?: StudentOpportunityPreferences,
    eligibilityOverride?: EligibilityResult
  ): CandidateOpportunityMatch {
    const studentId = profile.studentId;
    const evidenceItems = getStudentEvidence(studentId);
    const careerMemory = getCareerMemory(studentId);

    // 1. Evaluate Eligibility (if not provided)
    const candidateContext: CandidateEligibilityContext = {
      studentId,
      degree: "B.Tech Computer Science & Engineering",
      fieldOfStudy: "Computer Science",
      graduationYear: 2027,
      isCurrentlyEnrolled: true,
      yearsOfExperience: 0,
      currentLocationCountry: "India",
      currentLocationCity: "Bengaluru",
      workAuthorizationCountry: "India",
      requiresSponsorship: false,
    };

    const eligibilityResult =
      eligibilityOverride ||
      OpportunityEligibilityEngine.evaluate(opportunity, candidateContext, profile);

    // 2. Evidence Mapping for Required & Preferred Skills
    const evidenceMapping: EvidenceMappingItem[] = [];
    const matchedRequirements: string[] = [];
    const missingRequirements: string[] = [];
    const evidenceGaps: EvidenceGapItem[] = [];

    const allSkills = [
      ...opportunity.requiredSkills.map((s) => ({ name: s, isMustHave: true })),
      ...opportunity.preferredSkills.map((s) => ({ name: s, isMustHave: false })),
    ];

    for (const skillItem of allSkills) {
      const mapping = this.evaluateSkillEvidence(skillItem.name, skillItem.isMustHave, profile, evidenceItems);
      evidenceMapping.push(mapping);

      if (mapping.status === "PROVEN" || mapping.status === "SUPPORTED") {
        matchedRequirements.push(skillItem.name);
      } else {
        missingRequirements.push(skillItem.name);
        if (skillItem.isMustHave || mapping.status === "MISSING") {
          evidenceGaps.push({
            skill: skillItem.name,
            isMustHave: skillItem.isMustHave,
            recommendationAction: `Build a verifiable project demonstrating ${skillItem.name}`,
          });
        }
      }
    }

    // 3. Multi-Dimensional Breakdown
    const roleAlignment = this.evaluateRoleAlignment(opportunity, profile, preferences);
    const coreReqTotal = opportunity.requiredSkills.length || 1;
    const coreReqMatched = opportunity.requiredSkills.filter((s) =>
      matchedRequirements.includes(s)
    ).length;
    const coreReqPercentage = Math.round((coreReqMatched / coreReqTotal) * 100);

    const evidenceStrength = this.evaluateOverallEvidenceStrength(evidenceMapping);
    const projectRelevance = this.evaluateProjectRelevance(opportunity, evidenceItems);
    const experienceFit = this.evaluateExperienceFit(opportunity, candidateContext);
    const preferenceFit = this.evaluatePreferenceFit(opportunity, preferences);
    const trajectoryFit = this.evaluateTrajectoryFit(opportunity, profile, careerMemory);

    // 4. Calculate Internal Ranking Score (Heuristic 0-100, never exposed as hiring probability)
    const internalScore = this.calculateInternalScore({
      eligibility: eligibilityResult.status,
      roleAlignment,
      coreCoveragePct: coreReqPercentage,
      evidenceStrength,
      projectRelevance,
      experienceFit,
      preferenceFit,
      trajectoryFit,
      freshness: opportunity.freshness,
    });

    // 5. Determine Recommendation Tier
    const { tier, priority, reason } = this.determineRecommendationTier({
      eligibility: eligibilityResult.status,
      roleAlignment,
      coreReqPercentage,
      evidenceStrength,
      experienceFit,
      evidenceGaps,
      blockers: eligibilityResult.blockers,
    });

    // 6. Generate Action Plan if BUILD_EVIDENCE
    let actionPlan: OpportunityActionPlan | undefined;
    if (tier === "BUILD_EVIDENCE" && evidenceGaps.length > 0) {
      actionPlan = this.generateActionPlan(opportunity, evidenceGaps);
    }

    // 7. Transparent Provenance Explanations: Why this candidate, opportunity, now
    const why = this.generateWhyExplanations(
      opportunity,
      profile,
      eligibilityResult,
      matchedRequirements,
      evidenceGaps,
      tier,
      reason
    );

    const now = new Date().toISOString();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24hr cache validity

    return {
      candidateId: studentId,
      opportunityId: opportunity.id,
      opportunity,
      eligibilityResult,
      recommendation: tier,
      recommendationReason: reason,
      priority,
      internalScore,
      matchBreakdown: {
        roleAlignment,
        coreRequirementCoverage: {
          total: coreReqTotal,
          matched: coreReqMatched,
          percentage: coreReqPercentage,
        },
        evidenceStrength,
        projectRelevance,
        experienceFit,
        preferenceFit,
        trajectoryFit,
      },
      evidenceMapping,
      matchedRequirements,
      missingRequirements,
      evidenceGaps,
      why,
      actionPlan,
      generatedAt: now,
      expiresAt,
    };
  }

  /**
   * Evaluates evidence for a specific skill from Student DNA & Evidence items.
   */
  private static evaluateSkillEvidence(
    skillName: string,
    isMustHave: boolean,
    profile: StudentDNAProfile,
    evidenceItems: EvidenceItem[]
  ): EvidenceMappingItem {
    const canonicalLower = skillName.toLowerCase().trim();

    // Check capability state in DNA with flexible token & keyword matching
    const capability = Object.values(profile.capabilities || {}).find((c) => {
      const cLower = c.name.toLowerCase();
      if (cLower === canonicalLower || canonicalLower.includes(cLower) || cLower.includes(canonicalLower)) {
        return true;
      }
      const techKeywords = [
        "python", "machine learning", "ml", "dsa", "algorithms", "data structures",
        "sql", "git", "fastapi", "react", "docker", "aws", "pytorch", "rest", "api"
      ];
      for (const kw of techKeywords) {
        if (canonicalLower.includes(kw) && cLower.includes(kw)) {
          return true;
        }
      }
      return false;
    });

    // Find direct evidence items with token matching
    const relatedEvidence = evidenceItems.filter((e) => {
      const eCap = e.capability.toLowerCase();
      if (
        eCap === canonicalLower ||
        canonicalLower.includes(eCap) ||
        eCap.includes(canonicalLower) ||
        (e.claim && canonicalLower.includes(e.claim.toLowerCase())) ||
        (e.extractedEvidence && canonicalLower.includes(e.extractedEvidence.toLowerCase()))
      ) {
        return true;
      }
      const techKeywords = [
        "python", "machine learning", "ml", "dsa", "algorithms", "data structures",
        "sql", "git", "fastapi", "react", "docker", "aws", "pytorch", "scikit", "rest", "api"
      ];
      for (const kw of techKeywords) {
        if (
          canonicalLower.includes(kw) &&
          (eCap.includes(kw) ||
            (e.claim && e.claim.toLowerCase().includes(kw)) ||
            (e.extractedEvidence && e.extractedEvidence.toLowerCase().includes(kw)))
        ) {
          return true;
        }
      }
      return false;
    });

    const supportingEvidence: SupportingEvidenceDetail[] = relatedEvidence.map((e) => ({
      claim: e.claim,
      source: e.provenance?.sourceName || e.sourceType,
      confidence: e.confidence,
      artifactName: e.relatedArtifactId || e.provenance?.context,
      extractedSnippet: e.extractedEvidence,
    }));

    let status: EvidenceStatus = "MISSING";

    if (capability) {
      if (
        capability.evidenceLevel >= 3 ||
        capability.proficiencyState === "Verified" ||
        capability.proficiencyState === "Strong"
      ) {
        status = "PROVEN";
      } else if (
        capability.evidenceLevel >= 2 ||
        capability.proficiencyState === "Demonstrated" ||
        relatedEvidence.length >= 1
      ) {
        status = "SUPPORTED";
      } else if (capability.evidenceLevel === 1 || capability.proficiencyState === "Claimed") {
        status = "CLAIMED";
      } else if (capability.proficiencyState === "Developing") {
        status = "WEAK";
      }
    } else if (relatedEvidence.length > 0) {
      const hasVerified = relatedEvidence.some(
        (e) => e.verificationStatus === "verified" || e.evidenceLevel >= 3
      );
      const hasProject = relatedEvidence.some(
        (e) => e.sourceType === "project" || e.sourceType === "github"
      );
      if (hasVerified || relatedEvidence.length >= 3) {
        status = "PROVEN";
      } else if (hasProject || relatedEvidence.length >= 1) {
        status = "SUPPORTED";
      } else {
        status = "CLAIMED";
      }
    }

    return {
      requirement: skillName,
      isMustHave,
      status,
      evidenceCount: relatedEvidence.length,
      supportingEvidence,
    };
  }

  /**
   * Evaluates role alignment against candidate's primary/secondary career goals.
   */
  private static evaluateRoleAlignment(
    opp: CanonicalOpportunity,
    profile: StudentDNAProfile,
    preferences?: StudentOpportunityPreferences
  ): "Strong" | "Moderate" | "Weak" {
    const oppCategory = (opp.roleDNA?.roleCategory || opp.normalizedTitle || opp.title).toLowerCase();
    const primaryGoal = (profile.intent?.primaryGoal || "").toLowerCase();
    const secondaryGoals = (profile.intent?.secondaryGoals || []).map((g) => g.toLowerCase());
    const targetRoles = (preferences?.targetRoles || []).map((r) => r.toLowerCase());

    const allTargets = [primaryGoal, ...secondaryGoals, ...targetRoles].filter(Boolean);

    // Strong alignment if exact match or high overlap
    const isStrong = allTargets.some((target) => {
      if (!target) return false;
      return (
        oppCategory.includes(target) ||
        target.includes(oppCategory) ||
        (target.includes("ai") && (oppCategory.includes("ml") || oppCategory.includes("ai") || oppCategory.includes("data"))) ||
        (target.includes("swe") && (oppCategory.includes("software") || oppCategory.includes("full-stack") || oppCategory.includes("backend"))) ||
        (target.includes("backend") && oppCategory.includes("backend"))
      );
    });

    if (isStrong) return "Strong";

    // Moderate alignment
    const isModerate =
      allTargets.some((target) => {
        return (
          oppCategory.includes("engineer") ||
          oppCategory.includes("developer") ||
          target.includes("tech")
        );
      }) || opp.normalizedTitle.includes("Software");

    if (isModerate) return "Moderate";

    return "Weak";
  }

  /**
   * Evaluates overall evidence strength across mapped requirements.
   */
  private static evaluateOverallEvidenceStrength(
    mapping: EvidenceMappingItem[]
  ): "Strong" | "Supported" | "Claimed" | "Weak" | "Missing" {
    const mustHaves = mapping.filter((m) => m.isMustHave);
    const targetSet = mustHaves.length > 0 ? mustHaves : mapping;

    const provenCount = targetSet.filter((m) => m.status === "PROVEN").length;
    const supportedCount = targetSet.filter((m) => m.status === "SUPPORTED").length;
    const missingCount = targetSet.filter((m) => m.status === "MISSING").length;

    if (provenCount >= 2 && missingCount === 0) return "Strong";
    if (provenCount + supportedCount >= Math.ceil(targetSet.length * 0.6)) return "Supported";
    if (targetSet.some((m) => m.status === "CLAIMED") && missingCount < targetSet.length) return "Claimed";
    if (missingCount >= Math.ceil(targetSet.length * 0.5)) return "Weak";
    return "Missing";
  }

  /**
   * Evaluates candidate project relevance to the opportunity's domain.
   */
  private static evaluateProjectRelevance(
    opp: CanonicalOpportunity,
    evidenceItems: EvidenceItem[]
  ): "Strong" | "Moderate" | "Low" {
    const projectEvidence = evidenceItems.filter(
      (e) => e.sourceType === "project" || e.sourceType === "github"
    );

    if (projectEvidence.length === 0) return "Low";

    const oppKeywords = [
      ...opp.requiredSkills,
      opp.roleDNA.roleCategory,
      opp.normalizedTitle,
    ].map((k) => k.toLowerCase());

    let matchCount = 0;
    for (const proj of projectEvidence) {
      const text = `${proj.claim} ${proj.extractedEvidence} ${proj.relatedArtifactId || ""}`.toLowerCase();
      const hasMatch = oppKeywords.some((kw) => kw.length > 2 && text.includes(kw));
      if (hasMatch) matchCount++;
    }

    if (matchCount >= 2) return "Strong";
    if (matchCount === 1) return "Moderate";
    return "Low";
  }

  /**
   * Evaluates experience level alignment (student/intern vs senior).
   */
  private static evaluateExperienceFit(
    opp: CanonicalOpportunity,
    candidate: CandidateEligibilityContext
  ): "Strong" | "Moderate" | "Mismatch" {
    const candExp = candidate.yearsOfExperience || 0;

    if (opp.experienceLevel === "intern" || opp.employmentType === "internship") {
      return "Strong";
    }

    if (opp.experienceLevel === "entry_level") {
      return candExp <= 1 ? "Strong" : "Moderate";
    }

    if (opp.experienceLevel === "mid_level") {
      return candExp >= 1 ? "Moderate" : "Mismatch";
    }

    if (opp.experienceLevel === "senior") {
      return "Mismatch";
    }

    return "Moderate";
  }

  /**
   * Evaluates candidate preferences (remote, location, company type).
   */
  private static evaluatePreferenceFit(
    opp: CanonicalOpportunity,
    prefs?: StudentOpportunityPreferences
  ): "Strong" | "Moderate" | "Conflict" {
    if (!prefs) return "Strong";

    let conflicts = 0;

    // Remote preference check
    if (prefs.remotePreferences && prefs.remotePreferences.length > 0) {
      if (!prefs.remotePreferences.includes(opp.remoteType)) {
        conflicts++;
      }
    }

    // Company type preference check
    if (prefs.preferredCompanyTypes && prefs.preferredCompanyTypes.length > 0 && opp.companyType) {
      if (!prefs.preferredCompanyTypes.includes(opp.companyType as any)) {
        conflicts++;
      }
    }

    // Location check
    if (prefs.locations && prefs.locations.length > 0 && opp.remoteType !== "remote") {
      const matchLoc = prefs.locations.some(
        (loc) =>
          opp.location.toLowerCase().includes(loc.toLowerCase()) ||
          opp.city.toLowerCase().includes(loc.toLowerCase()) ||
          opp.country.toLowerCase().includes(loc.toLowerCase())
      );
      if (!matchLoc) conflicts++;
    }

    if (conflicts === 0) return "Strong";
    if (conflicts === 1) return "Moderate";
    return "Conflict";
  }

  /**
   * Evaluates career trajectory fit based on historical outcomes & long-term goals.
   */
  private static evaluateTrajectoryFit(
    opp: CanonicalOpportunity,
    profile: StudentDNAProfile,
    careerMemory: { records: any[]; patterns: any[] }
  ): "Strong" | "Moderate" | "Weak" {
    const goal = (profile.intent?.primaryGoal || "").toLowerCase();
    const title = opp.normalizedTitle.toLowerCase();

    // Check if past successful interviews/offers correlate with this role
    const successfulPast = careerMemory.records.some(
      (r) =>
        (r.status === "Selected" || r.status === "Offer" || r.status === "Interviewing") &&
        r.roleTitle.toLowerCase().includes(opp.roleDNA.roleCategory.toLowerCase())
    );

    if (successfulPast || (goal.includes("ai") && title.includes("ai"))) {
      return "Strong";
    }

    if (title.includes("software") || title.includes("engineer")) {
      return "Moderate";
    }

    return "Weak";
  }

  /**
   * Calculates internal ranking score (0-100 heuristic).
   * Strict Rule: NEVER exposed as a hiring probability.
   */
  private static calculateInternalScore(params: {
    eligibility: string;
    roleAlignment: "Strong" | "Moderate" | "Weak";
    coreCoveragePct: number;
    evidenceStrength: "Strong" | "Supported" | "Claimed" | "Weak" | "Missing";
    projectRelevance: "Strong" | "Moderate" | "Low";
    experienceFit: "Strong" | "Moderate" | "Mismatch";
    preferenceFit: "Strong" | "Moderate" | "Conflict";
    trajectoryFit: "Strong" | "Moderate" | "Weak";
    freshness: string;
  }): number {
    if (params.eligibility === "INELIGIBLE") {
      return 15; // Ineligible hard penalty
    }

    let score = 0;

    // 1. Role Alignment (25%)
    if (params.roleAlignment === "Strong") score += 25;
    else if (params.roleAlignment === "Moderate") score += 15;
    else score += 5;

    // 2. Core Coverage (20%)
    score += Math.round((params.coreCoveragePct / 100) * 20);

    // 3. Evidence Strength (20%)
    if (params.evidenceStrength === "Strong") score += 20;
    else if (params.evidenceStrength === "Supported") score += 15;
    else if (params.evidenceStrength === "Claimed") score += 10;
    else if (params.evidenceStrength === "Weak") score += 5;
    else score += 2;

    // 4. Project Relevance (10%)
    if (params.projectRelevance === "Strong") score += 10;
    else if (params.projectRelevance === "Moderate") score += 6;
    else score += 2;

    // 5. Experience Fit (10%)
    if (params.experienceFit === "Strong") score += 10;
    else if (params.experienceFit === "Moderate") score += 6;
    else score += 0;

    // 6. Preference Fit (5%)
    if (params.preferenceFit === "Strong") score += 5;
    else if (params.preferenceFit === "Moderate") score += 3;
    else score += 0;

    // 7. Trajectory Fit (5%)
    if (params.trajectoryFit === "Strong") score += 5;
    else if (params.trajectoryFit === "Moderate") score += 3;
    else score += 1;

    // 8. Freshness (5%)
    if (params.freshness === "FRESH") score += 5;
    else if (params.freshness === "ACTIVE") score += 4;
    else if (params.freshness === "AGING") score += 2;
    else score += 0;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Deterministic Recommendation Tier Matrix.
   */
  private static determineRecommendationTier(params: {
    eligibility: string;
    roleAlignment: "Strong" | "Moderate" | "Weak";
    coreReqPercentage: number;
    evidenceStrength: "Strong" | "Supported" | "Claimed" | "Weak" | "Missing";
    experienceFit: "Strong" | "Moderate" | "Mismatch";
    evidenceGaps: EvidenceGapItem[];
    blockers: string[];
  }): { tier: RecommendationTier; priority: "HIGH" | "MEDIUM" | "LOW"; reason: string } {
    // 1. Ineligible
    if (params.eligibility === "INELIGIBLE") {
      return {
        tier: "NOT_ELIGIBLE",
        priority: "LOW",
        reason: params.blockers[0] || "Does not satisfy hard eligibility requirements.",
      };
    }

    // 2. Ambiguous Eligibility
    if (params.eligibility === "POTENTIALLY_ELIGIBLE" || params.eligibility === "UNKNOWN") {
      return {
        tier: "VERIFY",
        priority: "MEDIUM",
        reason: "Eligibility requires manual verification with the employer's specific criteria.",
      };
    }

    // 3. Experience Mismatch
    if (params.experienceFit === "Mismatch") {
      return {
        tier: "LOW_PRIORITY",
        priority: "LOW",
        reason: "Experience level expectations exceed candidate's current stage.",
      };
    }

    // 4. Strong Candidate Alignment -> APPLY_NOW vs BUILD_EVIDENCE
    if (params.roleAlignment === "Strong") {
      if (params.coreReqPercentage >= 60 && (params.evidenceStrength === "Strong" || params.evidenceStrength === "Supported")) {
        return {
          tier: "APPLY_NOW",
          priority: "HIGH",
          reason: "Strong role alignment with corroborated project evidence supporting core technical requirements.",
        };
      }

      // If they have fixable gaps
      const mustHaveGaps = params.evidenceGaps.filter((g) => g.isMustHave);
      if (mustHaveGaps.length >= 1 && mustHaveGaps.length <= 3) {
        return {
          tier: "BUILD_EVIDENCE",
          priority: "HIGH",
          reason: `High-value strategic opportunity, but missing concrete project evidence for ${mustHaveGaps.map((g) => g.skill).join(", ")}.`,
        };
      }
    }

    // 5. Moderate Alignment
    if (params.roleAlignment === "Moderate" && params.coreReqPercentage >= 60) {
      return {
        tier: "EXPLORE",
        priority: "MEDIUM",
        reason: "Relevant opportunity matching foundational technical skills with moderate career trajectory alignment.",
      };
    }

    // 6. Default to Low Priority
    return {
      tier: "LOW_PRIORITY",
      priority: "LOW",
      reason: "Lower alignment with stated career goals and current verified evidence profile.",
    };
  }

  /**
   * Generates concrete project action plan for BUILD_EVIDENCE opportunities.
   */
  private static generateActionPlan(
    opp: CanonicalOpportunity,
    gaps: EvidenceGapItem[]
  ): OpportunityActionPlan {
    const missingSkills = gaps.map((g) => g.skill).slice(0, 3);
    const skillList = missingSkills.join(" & ");

    return {
      title: `Build Evidence: ${skillList} Project`,
      description: `Bridge the verified evidence gap for ${opp.companyName}'s ${opp.title} by creating a documented, deployable project.`,
      projectIdea: `Design and implement a working service incorporating ${skillList} with automated unit tests and Dockerized deployment.`,
      deliverable: `Public GitHub repository featuring clean architecture, README architecture diagram, and live demo link.`,
      targetSkills: missingSkills,
      actionUrl: `/student/actions?targetSkill=${encodeURIComponent(missingSkills[0] || "")}`,
    };
  }

  /**
   * Generates transparent, verifiable "Why" explanations for the recommendation.
   */
  private static generateWhyExplanations(
    opp: CanonicalOpportunity,
    profile: StudentDNAProfile,
    eligibility: EligibilityResult,
    matched: string[],
    gaps: EvidenceGapItem[],
    tier: RecommendationTier,
    reason: string
  ): { whyThisCandidate: string; whyThisOpportunity: string; whyNow: string; summary: string } {
    const matchedList = matched.slice(0, 4).join(", ") || "Foundational engineering skills";
    const gapList = gaps.map((g) => g.skill).slice(0, 2).join(", ");

    const whyThisCandidate = matched.length > 0
      ? `Your verified project and repository evidence demonstrates demonstrated competence in ${matchedList}.`
      : `Your academic profile aligns with the foundational expectations of this role.`;

    const whyThisOpportunity = `Aligns with your primary intent for ${profile.intent?.primaryGoal || "Software Engineering"} at ${opp.companyName} (${opp.companyType || "technology company"}).`;

    let whyNow = `The listing was verified active with applications open.`;
    if (tier === "APPLY_NOW") {
      whyNow = `The role is actively open and your current evidence satisfies the core threshold to apply immediately without waiting.`;
    } else if (tier === "BUILD_EVIDENCE") {
      whyNow = gapList
        ? `Closing the evidence gap for ${gapList} now will upgrade this opportunity from preparation to direct application.`
        : `Building targeted evidence now maximizes competitive positioning before application deadlines.`;
    } else if (opp.deadline) {
      whyNow = `Application deadline is approaching (${opp.deadline}). Verified active today.`;
    }

    const summary = `${reason} ${whyThisCandidate} ${whyThisOpportunity}`;

    return {
      whyThisCandidate,
      whyThisOpportunity,
      whyNow,
      summary,
    };
  }

  /**
   * Applies lightweight diversification so the top results aren't 10 identical roles.
   */
  public static diversifyMatches(matches: CandidateOpportunityMatch[]): CandidateOpportunityMatch[] {
    const seenCompanies = new Map<string, number>();
    const seenRoles = new Map<string, number>();

    const diversified: CandidateOpportunityMatch[] = [];
    const overflow: CandidateOpportunityMatch[] = [];

    // Sort initially by internal score descending
    const sorted = [...matches].sort((a, b) => b.internalScore - a.internalScore);

    for (const match of sorted) {
      const company = match.opportunity.companyName.toLowerCase();
      const role = match.opportunity.roleDNA.roleCategory.toLowerCase();

      const companyCount = seenCompanies.get(company) || 0;
      const roleCount = seenRoles.get(role) || 0;

      // Allow max 2 from same company and max 4 from same exact role in top batch
      if (companyCount < 2 && roleCount < 4) {
        diversified.push(match);
        seenCompanies.set(company, companyCount + 1);
        seenRoles.set(role, roleCount + 1);
      } else {
        overflow.push(match);
      }
    }

    return [...diversified, ...overflow];
  }
}
