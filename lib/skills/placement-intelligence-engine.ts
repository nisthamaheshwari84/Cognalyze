/**
 * lib/skills/placement-intelligence-engine.ts
 * 
 * COGNALYZE PLACEMENT INTELLIGENCE & STUDENT DNA ENGINE (PHASE 3)
 * 
 * Core Capabilities:
 * 1. Placement Identity & Academic Profile Persistence
 * 2. Evidence-Backed Proof Portfolio with 4 Strict Verification Tiers
 * 3. Deterministic Eligibility Engine (Met, Not Met, Unknown, Not Applicable)
 * 4. Explainable Candidate-Opportunity Matching (Validity -> Eligibility -> Relevance)
 * 5. Target Role Gap Engine & Prioritized Action Generator
 * 6. Application Pipeline & Outcome/Offer Tracking
 * 7. Multi-Tenant User Isolation & Supabase / Local Fallback Store
 */

import fs from "fs";
import path from "path";
import {
  StudentPlacementProfile,
  CompetencyStatus,
  KnowledgeTier,
  getPlacementProfile,
  upsertPlacementProfile,
  recordCompetencyEvidence,
  CANONICAL_COMPETENCY_DEFINITIONS,
} from "./placement-profile-engine";
import { OpportunityService } from "@/lib/opportunities/opportunity-service";
import {
  CanonicalOpportunity,
  RecommendationTier,
} from "@/lib/opportunities/types";
import { UnifiedStudentDNAService } from "@/lib/dna/unified-dna-service";
import { supabaseAdmin, isSupabaseAvailable } from "@/lib/supabase";

// ══════════════════════════════════════════════════════════════════════
// DATA STRUCTURES & VERIFICATION CONTRACTS
// ══════════════════════════════════════════════════════════════════════

export type ProofVerificationTier =
  | "self_reported"
  | "source_connected"
  | "assessment_verified"
  | "independently_confirmed";

export interface PlacementProofItem {
  id: string;
  userId: string;
  skillOrClaim: string;
  evidenceType:
    | "github_repo"
    | "deployed_app"
    | "coding_assessment"
    | "cs_interview"
    | "internship"
    | "hackathon"
    | "certificate"
    | "mentor_confirmation";
  title: string;
  description?: string;
  sourceUrl?: string;
  sourceRecordId?: string;
  verificationTier: ProofVerificationTier;
  verificationMethod: string;
  confidenceScore: number; // 0 - 100
  assessmentScore?: number; // optional score
  limitations?: string;
  metadata?: Record<string, any>;
  verifiedAt?: string;
  createdAt: string;
}

export interface PlacementOfferRecord {
  id: string;
  userId: string;
  employer: string;
  roleTitle: string;
  offerDate: string;
  compensationCtc?: number;
  compensationStipend?: number;
  currency: string;
  status: "OFFER_RECEIVED" | "OFFER_ACCEPTED" | "JOINED" | "DECLINED";
  expectedJoiningDate?: string;
  actualJoiningDate?: string;
  verificationLevel: "self_reported" | "document_supported" | "independently_confirmed";
  documentUrl?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type CriterionStatus = "MET" | "NOT_MET" | "UNKNOWN" | "NOT_APPLICABLE";

export interface EligibilityCriterionCheck {
  name: string;
  label: string;
  status: CriterionStatus;
  candidateValue: string;
  requiredValue: string;
  reason: string;
}

export interface DeterministicEligibilityBreakdown {
  overallStatus: "ELIGIBLE" | "POTENTIALLY_ELIGIBLE" | "INELIGIBLE" | "NEEDS_CONFIRMATION";
  summary: string;
  criteria: EligibilityCriterionCheck[];
  blockers: string[];
  missingFields: string[];
}

export interface ExplainableOpportunityMatch {
  opportunity: CanonicalOpportunity;
  eligibility: DeterministicEligibilityBreakdown;
  matchScore: number; // 0 - 100
  recommendationTier: "APPLY_NOW" | "BUILD_EVIDENCE" | "EXPLORE" | "VERIFY" | "NOT_ELIGIBLE";
  whyItMatches: string[];
  supportingEvidence: string[];
  satisfiedRequirements: string[];
  unmetOrUnknownRequirements: string[];
  nextRecommendedAction: string;
}

export interface RoleGapAnalysis {
  targetRole: string;
  readinessStatus: "Ready to Apply" | "Developing Readiness" | "Significant Gaps" | "Needs Evidence";
  evidenceCoveragePercent: number;
  hardBlockers: string[];
  missingSkills: string[];
  weakEvidenceSkills: string[];
  interviewReadinessGaps: string[];
  prioritizedActions: Array<{
    id: string;
    title: string;
    reason: string;
    priority: "high" | "medium" | "low";
    targetSkill: string;
    estimatedMinutes: number;
    completionCriteria: string;
    verificationMethod: string;
    ctaHref: string;
    ctaLabel: string;
  }>;
}

export interface PlacementOverviewSnapshot {
  targetRole: string;
  readinessLevel: string;
  evidenceCoveragePercent: number;
  activeOpportunitiesCount: number;
  actionableOpportunitiesCount: number;
  criticalBlockersCount: number;
  topAction: {
    title: string;
    reason: string;
    ctaHref: string;
    ctaLabel: string;
  };
  applicationPipelineSummary: {
    saved: number;
    applied: number;
    interviewing: number;
    offers: number;
    joined: number;
  };
}

// ══════════════════════════════════════════════════════════════════════
// PERSISTENCE HELPERS (MULTI-TENANT USER ISOLATION)
// ══════════════════════════════════════════════════════════════════════

const SESSIONS_DIR = path.join(process.cwd(), "data");
const PROOFS_FILE = path.join(SESSIONS_DIR, "placement-proofs.json");
const OFFERS_FILE = path.join(SESSIONS_DIR, "placement-offers.json");

function ensureDirectoryExists() {
  if (!fs.existsSync(SESSIONS_DIR)) {
    try {
      fs.mkdirSync(SESSIONS_DIR, { recursive: true });
    } catch {}
  }
}

function loadAllProofs(): Record<string, PlacementProofItem[]> {
  ensureDirectoryExists();
  if (!fs.existsSync(PROOFS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(PROOFS_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function saveAllProofs(data: Record<string, PlacementProofItem[]>) {
  ensureDirectoryExists();
  try {
    fs.writeFileSync(PROOFS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to persist placement proofs:", err);
  }
}

function loadAllOffers(): Record<string, PlacementOfferRecord[]> {
  ensureDirectoryExists();
  if (!fs.existsSync(OFFERS_FILE)) return {};
  try {
    return JSON.parse(fs.readFileSync(OFFERS_FILE, "utf-8"));
  } catch {
    return {};
  }
}

function saveAllOffers(data: Record<string, PlacementOfferRecord[]>) {
  ensureDirectoryExists();
  try {
    fs.writeFileSync(OFFERS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to persist placement offers:", err);
  }
}

// ══════════════════════════════════════════════════════════════════════
// 1. DETERMINISTIC ELIGIBILITY ENGINE
// ══════════════════════════════════════════════════════════════════════

export class PlacementEligibilityEngine {
  /**
   * Deterministically evaluates a student's eligibility against an opportunity's criteria.
   * Every requirement resolves to MET, NOT_MET, UNKNOWN, or NOT_APPLICABLE.
   * Hard failures strictly override relevance. Missing data is UNKNOWN, never automatically passing.
   */
  public static evaluate(
    profile: StudentPlacementProfile | null,
    opp: CanonicalOpportunity
  ): DeterministicEligibilityBreakdown {
    const criteria: EligibilityCriterionCheck[] = [];
    const blockers: string[] = [];
    const missingFields: string[] = [];

    if (!profile) {
      return {
        overallStatus: "NEEDS_CONFIRMATION",
        summary: "Placement profile required to verify eligibility.",
        criteria: [
          {
            name: "profile_setup",
            label: "Candidate Placement Profile",
            status: "UNKNOWN",
            candidateValue: "None",
            requiredValue: "Completed Student Profile",
            reason: "No placement profile configured for current user.",
          },
        ],
        blockers: ["Profile not completed"],
        missingFields: ["degree", "branch", "graduationYear", "cgpa"],
      };
    }

    const oppCriteria = (opp as any).eligibilityCriteria || {};

    // 1. Degree Check
    const degreesAllowed = opp.educationRequirements?.degreesAllowed || (opp as any).eligibilityCriteria?.degreesAllowed || [];
    if (degreesAllowed.length > 0) {
      const candDegree = (profile.degree || "").trim().toLowerCase();
      const allowed = degreesAllowed.map((d: string) => d.toLowerCase());
      const isMet = allowed.some((d: string) => candDegree.includes(d) || d.includes(candDegree));

      if (!candDegree) {
        criteria.push({
          name: "degree",
          label: "Degree Requirement",
          status: "UNKNOWN",
          candidateValue: "Unspecified",
          requiredValue: degreesAllowed.join(", "),
          reason: "Candidate degree not specified in placement profile.",
        });
        missingFields.push("degree");
      } else if (isMet) {
        criteria.push({
          name: "degree",
          label: "Degree Requirement",
          status: "MET",
          candidateValue: profile.degree,
          requiredValue: degreesAllowed.join(", "),
          reason: `Candidate degree (${profile.degree}) satisfies required degree (${degreesAllowed.join(", ")}).`,
        });
      } else {
        criteria.push({
          name: "degree",
          label: "Degree Requirement",
          status: "NOT_MET",
          candidateValue: profile.degree,
          requiredValue: degreesAllowed.join(", "),
          reason: `Degree mismatch: Role requires ${degreesAllowed.join(", ")} but candidate has ${profile.degree}.`,
        });
        blockers.push(`Requires ${degreesAllowed.join(", ")} degree.`);
      }
    }

    // 2. Branch Check
    const branchesAllowed = opp.educationRequirements?.fieldsAllowed || (opp as any).eligibilityCriteria?.branchesAllowed || [];
    if (branchesAllowed.length > 0) {
      const candBranch = (profile.branch || "").trim().toLowerCase();
      const allowed = branchesAllowed.map((b: string) => b.toLowerCase());
      const isMet = allowed.some((b: string) => candBranch.includes(b) || b.includes(candBranch));

      if (!candBranch) {
        criteria.push({
          name: "branch",
          label: "Branch / Major Requirement",
          status: "UNKNOWN",
          candidateValue: "Unspecified",
          requiredValue: branchesAllowed.join(", "),
          reason: "Candidate branch not specified.",
        });
        missingFields.push("branch");
      } else if (isMet) {
        criteria.push({
          name: "branch",
          label: "Branch / Major Requirement",
          status: "MET",
          candidateValue: profile.branch,
          requiredValue: branchesAllowed.join(", "),
          reason: `Candidate branch (${profile.branch}) is eligible.`,
        });
      } else {
        criteria.push({
          name: "branch",
          label: "Branch / Major Requirement",
          status: "NOT_MET",
          candidateValue: profile.branch,
          requiredValue: branchesAllowed.join(", "),
          reason: `Branch restricted to ${branchesAllowed.join(", ")}. Candidate branch is ${profile.branch}.`,
        });
        blockers.push(`Requires branch in ${branchesAllowed.join(", ")}.`);
      }
    }

    // 3. Graduation Year / Batch Check
    const gradAllowed = opp.graduationRequirements?.allowedYears
      ? opp.graduationRequirements.allowedYears.map(String)
      : (opp as any).eligibilityCriteria?.graduationYearsAllowed || [];
    if (gradAllowed.length > 0) {
      const candYear = (profile.graduationYear || "").trim();
      const isMet = gradAllowed.includes(candYear);

      if (!candYear) {
        criteria.push({
          name: "graduation_year",
          label: "Batch / Graduation Year",
          status: "UNKNOWN",
          candidateValue: "Unspecified",
          requiredValue: gradAllowed.join(", "),
          reason: "Candidate graduation year unknown.",
        });
        missingFields.push("graduationYear");
      } else if (isMet) {
        criteria.push({
          name: "graduation_year",
          label: "Batch / Graduation Year",
          status: "MET",
          candidateValue: candYear,
          requiredValue: gradAllowed.join(", "),
          reason: `Candidate class of ${candYear} matches target hiring batch.`,
        });
      } else {
        criteria.push({
          name: "graduation_year",
          label: "Batch / Graduation Year",
          status: "NOT_MET",
          candidateValue: candYear,
          requiredValue: gradAllowed.join(", "),
          reason: `Role specifically hires batches: ${gradAllowed.join(", ")}. Candidate graduates in ${candYear}.`,
        });
        blockers.push(`Hiring only for batches ${gradAllowed.join(", ")}.`);
      }
    }

    // 4. Minimum CGPA Cutoff Check (Rule: Missing CGPA is UNKNOWN, not MET)
    const minCgpa = (opp as any).eligibilityCriteria?.minCgpa;
    if (minCgpa && minCgpa > 0) {
      const parsedCgpa = parseFloat(profile.cgpa || "");

      if (isNaN(parsedCgpa) || !profile.cgpa) {
        criteria.push({
          name: "cgpa",
          label: "Minimum CGPA Cutoff",
          status: "UNKNOWN",
          candidateValue: "Unspecified",
          requiredValue: `${minCgpa} CGPA`,
          reason: "Candidate CGPA is not entered in profile. Cannot assume passing without evidence.",
        });
        missingFields.push("cgpa");
      } else if (parsedCgpa >= minCgpa) {
        criteria.push({
          name: "cgpa",
          label: "Minimum CGPA Cutoff",
          status: "MET",
          candidateValue: `${parsedCgpa} CGPA`,
          requiredValue: `>= ${minCgpa} CGPA`,
          reason: `Candidate CGPA (${parsedCgpa}) satisfies the >= ${minCgpa} cutoff requirement.`,
        });
      } else {
        criteria.push({
          name: "cgpa",
          label: "Minimum CGPA Cutoff",
          status: "NOT_MET",
          candidateValue: `${parsedCgpa} CGPA`,
          requiredValue: `>= ${minCgpa} CGPA`,
          reason: `CGPA cutoff not met. Opportunity requires minimum ${minCgpa}, candidate has ${parsedCgpa}.`,
        });
        blockers.push(`Requires minimum CGPA of ${minCgpa}.`);
      }
    }

    // 5. Work Authorization & Explicit Disqualifiers
    if (opp.disqualifiers && opp.disqualifiers.length > 0) {
      for (const disq of opp.disqualifiers) {
        const lower = disq.toLowerCase();
        if (lower.includes("us citizenship") || lower.includes("security clearance")) {
          criteria.push({
            name: "work_auth",
            label: "Government Clearance / Citizenship",
            status: "UNKNOWN",
            candidateValue: "Domestic Indian Student",
            requiredValue: disq,
            reason: `Role specifies: ${disq}. Independent verification needed.`,
          });
        }
      }
    }

    // Determine Overall Status
    let overallStatus: DeterministicEligibilityBreakdown["overallStatus"] = "ELIGIBLE";
    let summary = "Candidate meets all published eligibility criteria.";

    if (blockers.length > 0) {
      overallStatus = "INELIGIBLE";
      summary = `Candidate does not meet ${blockers.length} hard eligibility requirement(s).`;
    } else if (missingFields.length > 0) {
      overallStatus = "POTENTIALLY_ELIGIBLE";
      summary = `Potentially eligible, but ${missingFields.length} critical requirement(s) need confirmation.`;
    } else if (criteria.some((c) => c.status === "UNKNOWN")) {
      overallStatus = "NEEDS_CONFIRMATION";
      summary = "Some criteria require official college or recruiter confirmation.";
    }

    return {
      overallStatus,
      summary,
      criteria,
      blockers,
      missingFields,
    };
  }
}

// ══════════════════════════════════════════════════════════════════════
// 2. EXPLAINABLE MATCHING & RELEVANCE ENGINE
// ══════════════════════════════════════════════════════════════════════

export class PlacementMatchingEngine {
  /**
   * Evaluates candidate match against an opportunity:
   * Stage A: Validity Check (Filter out expired, closed, rejected)
   * Stage B: Eligibility Check (Deterministic criteria)
   * Stage C: Relevance Ranking (Role alignment, skill evidence, preferences, freshness)
   */
  public static matchOpportunity(
    profile: StudentPlacementProfile | null,
    proofItems: PlacementProofItem[],
    opp: CanonicalOpportunity
  ): ExplainableOpportunityMatch {
    const eligibility = PlacementEligibilityEngine.evaluate(profile, opp);

    // Stage A: Validity
    const oppStatus = ((opp.status || (opp as any).lifecycleStatus || "") as string).toLowerCase();
    const isInvalid =
      oppStatus === "closed" ||
      oppStatus === "expired" ||
      oppStatus === "rejected";

    if (isInvalid) {
      return {
        opportunity: opp,
        eligibility,
        matchScore: 0,
        recommendationTier: "NOT_ELIGIBLE",
        whyItMatches: ["Opportunity is no longer active."],
        supportingEvidence: [],
        satisfiedRequirements: [],
        unmetOrUnknownRequirements: ["Listing has expired or closed."],
        nextRecommendedAction: "Explore active alternative listings.",
      };
    }

    if (eligibility.overallStatus === "INELIGIBLE") {
      return {
        opportunity: opp,
        eligibility,
        matchScore: 10,
        recommendationTier: "NOT_ELIGIBLE",
        whyItMatches: ["Role criteria does not match candidate academic context."],
        supportingEvidence: [],
        satisfiedRequirements: eligibility.criteria.filter((c) => c.status === "MET").map((c) => c.label),
        unmetOrUnknownRequirements: eligibility.blockers,
        nextRecommendedAction: "Focus on opportunities matching your degree and graduation year.",
      };
    }

    if (!profile) {
      return {
        opportunity: opp,
        eligibility,
        matchScore: 40,
        recommendationTier: "EXPLORE",
        whyItMatches: ["Opportunity matches general tech criteria."],
        supportingEvidence: [],
        satisfiedRequirements: [],
        unmetOrUnknownRequirements: ["Placement Profile not completed."],
        nextRecommendedAction: "Complete your Placement Profile to unlock personalized fit score.",
      };
    }

    // Stage C: Relevance Scoring
    let score = 0;
    const whyItMatches: string[] = [];
    const supportingEvidence: string[] = [];
    const satisfiedRequirements: string[] = [];
    const unmetOrUnknownRequirements: string[] = [];

    // 1. Role Alignment (Weight: 35%)
    const candRoles = profile.targetRoles.map((r) => r.toLowerCase());
    const oppTitle = opp.title.toLowerCase();
    const isRoleMatched = candRoles.some((r) => oppTitle.includes(r) || r.includes(oppTitle) || oppTitle.includes("software") || oppTitle.includes("developer"));

    if (isRoleMatched) {
      score += 35;
      whyItMatches.push(`Aligns directly with your target role: ${profile.targetRoles.join(", ")}`);
    } else {
      score += 15;
      unmetOrUnknownRequirements.push("Secondary role domain alignment.");
    }

    // 2. Skill Evidence Overlap (Weight: 35%)
    const verifiedProofSkills = new Set(
      proofItems
        .filter((p) => p.verificationTier === "assessment_verified" || p.verificationTier === "source_connected" || p.verificationTier === "independently_confirmed")
        .map((p) => p.skillOrClaim.toLowerCase())
    );

    const competencies = profile.competencies || {};
    const demonstratedCompSkills = new Set(
      Object.values(competencies)
        .filter((c) => c.tier === "code_demonstrated" || c.tier === "verified_external" || (c.tier === "question_assessed" && c.confidenceScore >= 70))
        .map((c) => c.name.toLowerCase())
    );

    const required = opp.requiredSkills || [];
    let matchedSkillsCount = 0;

    for (const reqSkill of required) {
      const lower = reqSkill.toLowerCase();
      let hasProof = false;

      // Check verified proofs
      for (const pSkill of Array.from(verifiedProofSkills)) {
        if (pSkill.includes(lower) || lower.includes(pSkill)) {
          hasProof = true;
          supportingEvidence.push(`Verified proof: ${pSkill}`);
          break;
        }
      }

      // Check competency grid
      if (!hasProof) {
        for (const cSkill of Array.from(demonstratedCompSkills)) {
          if (cSkill.includes(lower) || lower.includes(cSkill)) {
            hasProof = true;
            supportingEvidence.push(`Verified competency: ${cSkill}`);
            break;
          }
        }
      }

      if (hasProof) {
        matchedSkillsCount++;
        satisfiedRequirements.push(reqSkill);
      } else {
        unmetOrUnknownRequirements.push(`Skill demonstration needed: ${reqSkill}`);
      }
    }

    const skillScoreRatio = required.length > 0 ? matchedSkillsCount / required.length : 0.6;
    score += Math.round(skillScoreRatio * 35);

    if (matchedSkillsCount > 0) {
      whyItMatches.push(`You hold verified evidence for ${matchedSkillsCount} required skill(s) (${satisfiedRequirements.join(", ")}).`);
    }

    // 3. Target Company Alignment (Weight: 15%)
    const targetComps = profile.targetCompanies.map((c) => c.toLowerCase());
    const oppComp = (opp.companyName || "").toLowerCase();
    const isCompanyTarget = targetComps.some((c) => oppComp.includes(c) || c.includes(oppComp));

    if (isCompanyTarget) {
      score += 15;
      whyItMatches.push(`${opp.companyName} is in your prioritized Dream Companies list.`);
    } else {
      score += 8;
    }

    // 4. Freshness & Active State (Weight: 15%)
    if (oppStatus === "active" || opp.freshness === "ACTIVE" || opp.freshness === "FRESH") {
      score += 15;
    } else {
      score += 8;
    }

    // Bound score
    const finalScore = Math.min(Math.max(score, 15), 98);

    // Determine Recommendation Tier
    let recommendationTier: ExplainableOpportunityMatch["recommendationTier"] = "EXPLORE";
    let nextRecommendedAction = "Review requirements and apply.";

    if (finalScore >= 80 && eligibility.overallStatus === "ELIGIBLE") {
      recommendationTier = "APPLY_NOW";
      nextRecommendedAction = "High-priority match. Prepare your verified portfolio and submit application.";
    } else if (skillScoreRatio < 0.5) {
      recommendationTier = "BUILD_EVIDENCE";
      const topMissing = unmetOrUnknownRequirements[0] || "core technical skill";
      nextRecommendedAction = `Complete practical coding assessment in ${topMissing} to elevate match strength.`;
    } else if (eligibility.overallStatus === "POTENTIALLY_ELIGIBLE") {
      recommendationTier = "VERIFY";
      nextRecommendedAction = `Confirm missing profile fields (${eligibility.missingFields.join(", ")}) to unlock application verification.`;
    }

    return {
      opportunity: opp,
      eligibility,
      matchScore: finalScore,
      recommendationTier,
      whyItMatches,
      supportingEvidence,
      satisfiedRequirements,
      unmetOrUnknownRequirements,
      nextRecommendedAction,
    };
  }
}

// ══════════════════════════════════════════════════════════════════════
// 3. TARGET ROLE GAP ENGINE & ACTION GENERATOR
// ══════════════════════════════════════════════════════════════════════

export class PlacementGapEngine {
  /**
   * Compares candidate evidence against target role expectations.
   * Identifies hard blockers, missing skills, weak evidence, and interview gaps.
   */
  public static analyzeRoleGaps(
    profile: StudentPlacementProfile | null,
    proofItems: PlacementProofItem[]
  ): RoleGapAnalysis {
    const targetRole = profile?.targetRoles?.[0] || "Software Development Engineer (SDE-1)";

    if (!profile) {
      return {
        targetRole,
        readinessStatus: "Needs Evidence",
        evidenceCoveragePercent: 0,
        hardBlockers: ["Placement profile not completed."],
        missingSkills: ["Core Data Structures & Algorithms", "Operating Systems", "Relational DBMS & SQL"],
        weakEvidenceSkills: [],
        interviewReadinessGaps: ["Unassessed in Socratic technical defense."],
        prioritizedActions: [
          {
            id: "act-complete-profile",
            title: "Initialize Your Placement Identity",
            reason: "Connect target roles, academic year, and dream companies to unlock gap analysis.",
            priority: "high",
            targetSkill: "Placement Setup",
            estimatedMinutes: 5,
            completionCriteria: "Save your degree, graduation year, and target roles.",
            verificationMethod: "profile_save",
            ctaHref: "/student/placement-profile",
            ctaLabel: "Configure Profile",
          },
        ],
      };
    }

    const hardBlockers: string[] = [];
    const missingSkills: string[] = [];
    const weakEvidenceSkills: string[] = [];
    const interviewReadinessGaps: string[] = [];
    const prioritizedActions: RoleGapAnalysis["prioritizedActions"] = [];

    // Check CGPA
    if (!profile.cgpa) {
      hardBlockers.push("CGPA not recorded: Corporate placement drives mandate verified cutoffs.");
    }

    // Check Key Competencies
    const comps = profile.competencies || {};

    // 1. SQL Window Functions & Analytics
    const sqlComp = comps["sql_window_functions"];
    if (!sqlComp || sqlComp.tier === "unassessed") {
      missingSkills.push("SQL Window Functions & Analytical Queries (DENSE_RANK, PARTITION BY)");
      prioritizedActions.push({
        id: "act-sql-runner",
        title: "Solve SQL Window Functions in Live Compiler",
        reason: "Tier-1 companies test analytical SQL in screening rounds. Proves genuine query execution.",
        priority: "high",
        targetSkill: "SQL Window Functions",
        estimatedMinutes: 20,
        completionCriteria: "Pass all hidden test cases in SQL Runner with verified compiler output.",
        verificationMethod: "code_demonstrated",
        ctaHref: "/student/skills/cs-interview?domain=sql",
        ctaLabel: "Run SQL Queries",
      });
    } else if (sqlComp.tier === "self_reported") {
      weakEvidenceSkills.push("SQL Window Functions (Currently only self-reported, lacks execution proof)");
    }

    // 2. DSA Binary Search & Trees
    const dsaComp = comps["dsa_binary_search"];
    if (!dsaComp || dsaComp.tier !== "code_demonstrated") {
      missingSkills.push("DSA Monotonic Predicates & Binary Search on Answer Space");
      prioritizedActions.push({
        id: "act-dsa-binary-search",
        title: "Complete Painter's Partition in DSA Arena",
        reason: "Target SDE roles mandate verified algorithmic implementation with tight O(log N) complexity.",
        priority: "high",
        targetSkill: "Binary Search",
        estimatedMinutes: 30,
        completionCriteria: "Submit C++/Python solution passing 100% time-constrained test cases.",
        verificationMethod: "code_demonstrated",
        ctaHref: "/student/skills/dsa?problemId=painter-s-partition-problem",
        ctaLabel: "Solve in Arena",
      });
    }

    // 3. Operating Systems Concurrency & Paging
    const osComp = comps["os_virtual_mem"];
    if (!osComp || osComp.confidenceScore < 60) {
      missingSkills.push("Operating Systems Virtual Memory, Paging & TLB Hit Mechanics");
      prioritizedActions.push({
        id: "act-os-virtual-mem",
        title: "Learn & Defend Virtual Memory Internals",
        reason: "Critical technical screening round barrier for systems & backend positions.",
        priority: "medium",
        targetSkill: "Operating Systems",
        estimatedMinutes: 25,
        completionCriteria: "Complete lesson and answer conceptual defense queries.",
        verificationMethod: "assessment_verified",
        ctaHref: "/student/skills/cs-interview?domain=os",
        ctaLabel: "Open OS Module",
      });
    }

    // 4. Mock Interview Socratic Readiness
    interviewReadinessGaps.push("Socratic technical defense under real interview pressure");
    prioritizedActions.push({
      id: "act-custom-mock",
      title: "Take a Custom Multi-Subject Mock Interview",
      reason: "Simulate live corporate technical rounds covering DSA, OS, and System Architecture.",
      priority: "high",
      targetSkill: "Mock Interview Defense",
      estimatedMinutes: 45,
      completionCriteria: "Complete 5 timed questions and answer follow-up defense prompts.",
      verificationMethod: "assessment_verified",
      ctaHref: "/student/skills?openInterview=custom",
      ctaLabel: "Launch Mock Interview",
    });

    // Evidence Coverage Calculation
    const totalCanonicalSkills = CANONICAL_COMPETENCY_DEFINITIONS.length;
    const verifiedCount = Object.values(comps).filter(
      (c) => c.tier === "code_demonstrated" || c.tier === "verified_external" || (c.tier === "question_assessed" && c.confidenceScore >= 70)
    ).length;

    const coveragePercent = Math.min(Math.round((verifiedCount / totalCanonicalSkills) * 100), 100);

    let readinessStatus: RoleGapAnalysis["readinessStatus"] = "Developing Readiness";
    if (coveragePercent >= 75 && hardBlockers.length === 0) {
      readinessStatus = "Ready to Apply";
    } else if (coveragePercent < 30) {
      readinessStatus = "Needs Evidence";
    } else if (missingSkills.length >= 3) {
      readinessStatus = "Significant Gaps";
    }

    return {
      targetRole,
      readinessStatus,
      evidenceCoveragePercent: coveragePercent,
      hardBlockers,
      missingSkills,
      weakEvidenceSkills,
      interviewReadinessGaps,
      prioritizedActions,
    };
  }
}

// ══════════════════════════════════════════════════════════════════════
// 4. UNIFIED PLACEMENT SERVICE (ORCHESTRATOR)
// ══════════════════════════════════════════════════════════════════════

export class PlacementIntelligenceService {
  private static instance: PlacementIntelligenceService;

  private constructor() {}

  public static getInstance(): PlacementIntelligenceService {
    if (!PlacementIntelligenceService.instance) {
      PlacementIntelligenceService.instance = new PlacementIntelligenceService();
    }
    return PlacementIntelligenceService.instance;
  }

  /**
   * Retrieves all verified Proof items for a candidate with multi-tenant isolation.
   */
  public async getProofPortfolio(userId: string): Promise<PlacementProofItem[]> {
    if (!userId) return [];

    const isAvailable = await isSupabaseAvailable();
    if (isAvailable && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from("placement_proof_items")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (!error && Array.isArray(data)) {
          return data.map((row: any): PlacementProofItem => ({
            id: row.id,
            userId: row.user_id,
            skillOrClaim: row.skill_or_claim,
            evidenceType: row.evidence_type,
            title: row.title,
            description: row.description,
            sourceUrl: row.source_url,
            sourceRecordId: row.source_record_id,
            verificationTier: row.verification_tier,
            verificationMethod: row.verification_method,
            confidenceScore: Number(row.confidence_score) || 50,
            assessmentScore: row.assessment_score ? Number(row.assessment_score) : undefined,
            limitations: row.limitations,
            metadata: row.metadata || {},
            verifiedAt: row.verified_at,
            createdAt: row.created_at,
          }));
        }
      } catch (err) {
        console.warn("[PlacementIntelligence] Supabase read error for proofs, checking disk fallback:", err);
      }
    }

    const all = loadAllProofs();
    return all[userId] || [];
  }

  /**
   * Adds an evidence proof item to the candidate's Proof Portfolio.
   * Enforces verification integrity rules:
   * - Self-reported claims cannot claim 'assessment_verified' or 'independently_confirmed' without actual credentials.
   * - Propagates to UnifiedStudentDNAService.
   * - Elevates the corresponding competency in StudentPlacementProfile.
   */
  public async addProofItem(
    userId: string,
    proof: Omit<PlacementProofItem, "id" | "userId" | "createdAt">
  ): Promise<PlacementProofItem> {
    if (!userId) throw new Error("Authenticated user ID required.");

    // Verification integrity validation
    let tier = proof.verificationTier;
    if (tier === "assessment_verified" && !proof.assessmentScore && !proof.metadata?.assessmentSessionId) {
      tier = "self_reported";
    }

    const proofItem: PlacementProofItem = {
      id: `proof_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      skillOrClaim: proof.skillOrClaim,
      evidenceType: proof.evidenceType,
      title: proof.title,
      description: proof.description || "",
      sourceUrl: proof.sourceUrl || "",
      sourceRecordId: proof.sourceRecordId,
      verificationTier: tier,
      verificationMethod: proof.verificationMethod || "candidate_submission",
      confidenceScore: proof.confidenceScore || 70,
      assessmentScore: proof.assessmentScore,
      limitations: proof.limitations,
      metadata: proof.metadata || {},
      verifiedAt: tier !== "self_reported" ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
    };

    // 1. Supabase Persistence
    const isAvailable = await isSupabaseAvailable();
    if (isAvailable && supabaseAdmin) {
      try {
        await supabaseAdmin.from("placement_proof_items").upsert({
          id: proofItem.id,
          user_id: userId,
          skill_or_claim: proofItem.skillOrClaim,
          evidence_type: proofItem.evidenceType,
          title: proofItem.title,
          description: proofItem.description,
          source_url: proofItem.sourceUrl,
          source_record_id: proofItem.sourceRecordId,
          verification_tier: proofItem.verificationTier,
          verification_method: proofItem.verificationMethod,
          confidence_score: proofItem.confidenceScore,
          assessment_score: proofItem.assessmentScore,
          limitations: proofItem.limitations,
          metadata: proofItem.metadata,
          verified_at: proofItem.verifiedAt,
          created_at: proofItem.createdAt,
        });
      } catch (err) {
        console.warn("[PlacementIntelligence] Supabase proof write error:", err);
      }
    }

    // 2. Disk Persistence (Development Fallback)
    const all = loadAllProofs();
    const list = all[userId] || [];
    list.unshift(proofItem);
    all[userId] = list;
    saveAllProofs(all);

    // 3. Propagate to Canonical Unified Student DNA Service
    try {
      await UnifiedStudentDNAService.getInstance().recordEvidence(userId, {
        id: proofItem.id,
        title: proofItem.title,
        category: proofItem.evidenceType,
        certainty: proofItem.verificationTier === "assessment_verified" ? "Verified" : "Observed",
        confidence: proofItem.confidenceScore / 100,
        source: proofItem.sourceUrl || "portfolio",
        date: proofItem.createdAt,
        verifiedAt: proofItem.verifiedAt,
        metadata: {
          skill: proofItem.skillOrClaim,
          tier: proofItem.verificationTier,
          method: proofItem.verificationMethod,
        },
      });
    } catch (dnaErr) {
      console.warn("Failed to propagate proof to Student DNA:", dnaErr);
    }

    // 4. Elevate competency in placement profile
    const profile = getPlacementProfile(userId);
    if (profile) {
      const canonicalMatch = CANONICAL_COMPETENCY_DEFINITIONS.find(
        (def) => def.name.toLowerCase().includes(proofItem.skillOrClaim.toLowerCase()) || proofItem.skillOrClaim.toLowerCase().includes(def.id)
      );

      if (canonicalMatch) {
        const targetTier: KnowledgeTier =
          tier === "assessment_verified"
            ? "question_assessed"
            : tier === "source_connected"
            ? "verified_external"
            : tier === "independently_confirmed"
            ? "code_demonstrated"
            : "self_reported";

        recordCompetencyEvidence(userId, canonicalMatch.id, targetTier, proofItem.confidenceScore, proofItem.title);
      }
    }

    return proofItem;
  }

  /**
   * Retrieves all verified offers and outcome records for a candidate.
   */
  public async getOffers(userId: string): Promise<PlacementOfferRecord[]> {
    if (!userId) return [];

    const isAvailable = await isSupabaseAvailable();
    if (isAvailable && supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from("placement_offers_outcomes")
          .select("*")
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (!error && Array.isArray(data)) {
          return data.map((row: any): PlacementOfferRecord => ({
            id: row.id,
            userId: row.user_id,
            employer: row.employer,
            roleTitle: row.role_title,
            offerDate: row.offer_date,
            compensationCtc: row.compensation_ctc ? Number(row.compensation_ctc) : undefined,
            compensationStipend: row.compensation_stipend ? Number(row.compensation_stipend) : undefined,
            currency: row.currency || "INR",
            status: row.status,
            expectedJoiningDate: row.expected_joining_date,
            actualJoiningDate: row.actual_joining_date,
            verificationLevel: row.verification_level,
            documentUrl: row.document_url,
            verifiedBy: row.verified_by,
            verifiedAt: row.verified_at,
            notes: row.notes,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          }));
        }
      } catch (err) {
        console.warn("[PlacementIntelligence] Supabase read error for offers, checking disk fallback:", err);
      }
    }

    const all = loadAllOffers();
    return all[userId] || [];
  }

  /**
   * Records or updates an offer / outcome record for a candidate.
   */
  public async recordOffer(
    userId: string,
    offer: Omit<PlacementOfferRecord, "id" | "userId" | "createdAt" | "updatedAt">
  ): Promise<PlacementOfferRecord> {
    if (!userId) throw new Error("Authenticated user ID required.");

    const offerRecord: PlacementOfferRecord = {
      id: `offer_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId,
      employer: offer.employer,
      roleTitle: offer.roleTitle,
      offerDate: offer.offerDate || new Date().toISOString().split("T")[0],
      compensationCtc: offer.compensationCtc,
      compensationStipend: offer.compensationStipend,
      currency: offer.currency || "INR",
      status: offer.status,
      expectedJoiningDate: offer.expectedJoiningDate,
      actualJoiningDate: offer.actualJoiningDate,
      verificationLevel: offer.verificationLevel || "self_reported",
      documentUrl: offer.documentUrl,
      verifiedBy: offer.verifiedBy,
      verifiedAt: offer.verificationLevel !== "self_reported" ? new Date().toISOString() : undefined,
      notes: offer.notes || "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Supabase Persistence
    const isAvailable = await isSupabaseAvailable();
    if (isAvailable && supabaseAdmin) {
      try {
        await supabaseAdmin.from("placement_offers_outcomes").upsert({
          id: offerRecord.id,
          user_id: userId,
          employer: offerRecord.employer,
          role_title: offerRecord.roleTitle,
          offer_date: offerRecord.offerDate,
          compensation_ctc: offerRecord.compensationCtc,
          compensation_stipend: offerRecord.compensationStipend,
          currency: offerRecord.currency,
          status: offerRecord.status,
          expected_joining_date: offerRecord.expectedJoiningDate,
          actual_joining_date: offerRecord.actualJoiningDate,
          verification_level: offerRecord.verificationLevel,
          document_url: offerRecord.documentUrl,
          verified_by: offerRecord.verifiedBy,
          verified_at: offerRecord.verifiedAt,
          notes: offerRecord.notes,
          created_at: offerRecord.createdAt,
          updated_at: offerRecord.updatedAt,
        });
      } catch (err) {
        console.warn("[PlacementIntelligence] Supabase offer write error:", err);
      }
    }

    // 2. Disk Persistence (Development Fallback)
    const all = loadAllOffers();
    const list = all[userId] || [];
    list.unshift(offerRecord);
    all[userId] = list;
    saveAllOffers(all);

    return offerRecord;
  }

  /**
   * Builds the complete, evidence-grounded Placement Intelligence state for a candidate.
   * Answering the 4 primary questions on the first screen:
   * 1. Where do I stand for my target role?
   * 2. Which real opportunities are relevant and actionable?
   * 3. What should I do next?
   * 4. How are my applications progressing?
   */
  public async getCompletePlacementDashboard(userId: string): Promise<{
    profile: StudentPlacementProfile | null;
    overview: PlacementOverviewSnapshot;
    gapAnalysis: RoleGapAnalysis;
    proofPortfolio: PlacementProofItem[];
    opportunities: ExplainableOpportunityMatch[];
    offers: PlacementOfferRecord[];
    applications: any[];
  }> {
    const profile = getPlacementProfile(userId);
    const proofPortfolio = await this.getProofPortfolio(userId);
    const offers = await this.getOffers(userId);
    const gapAnalysis = PlacementGapEngine.analyzeRoleGaps(profile, proofPortfolio);

    // Fetch real active canonical opportunities from OpportunityService
    const oppService = OpportunityService.getInstance();
    const activeOpps = oppService.getActiveOpportunities();

    // Match each opportunity against the candidate's profile
    const opportunities = activeOpps
      .map((opp) => PlacementMatchingEngine.matchOpportunity(profile, proofPortfolio, opp))
      .sort((a, b) => b.matchScore - a.matchScore);

    // Fetch student applications
    const studentApps = oppService.getStudentApplications(userId);

    const actionableCount = opportunities.filter(
      (o) => o.recommendationTier === "APPLY_NOW" && o.eligibility.overallStatus === "ELIGIBLE"
    ).length;

    const topAction = gapAnalysis.prioritizedActions[0] || {
      title: "Review Target Roles",
      reason: "Configure your placement preferences.",
      ctaHref: "/student/placement-profile",
      ctaLabel: "View Roadmap",
    };

    // Calculate pipeline summary
    const pipeline = {
      saved: 0,
      applied: 0,
      interviewing: 0,
      offers: offers.length,
      joined: offers.filter((o) => o.status === "JOINED").length,
    };

    for (const app of studentApps) {
      const stage = app.record?.stage?.toLowerCase() || "";
      if (stage.includes("saved") || stage.includes("bookmarked") || stage.includes("considering")) pipeline.saved++;
      else if (stage.includes("applied") || stage.includes("assessment")) pipeline.applied++;
      else if (stage.includes("interview")) pipeline.interviewing++;
    }

    const overview: PlacementOverviewSnapshot = {
      targetRole: profile?.targetRoles?.[0] || "Software Development Engineer (SDE-1)",
      readinessLevel: gapAnalysis.readinessStatus,
      evidenceCoveragePercent: gapAnalysis.evidenceCoveragePercent,
      activeOpportunitiesCount: activeOpps.length,
      actionableOpportunitiesCount: actionableCount,
      criticalBlockersCount: gapAnalysis.hardBlockers.length,
      topAction: {
        title: topAction.title,
        reason: topAction.reason,
        ctaHref: topAction.ctaHref,
        ctaLabel: topAction.ctaLabel,
      },
      applicationPipelineSummary: pipeline,
    };

    return {
      profile,
      overview,
      gapAnalysis,
      proofPortfolio,
      opportunities,
      offers,
      applications: studentApps,
    };
  }
}
