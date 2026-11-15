/**
 * COGNALYZE × OPPORTUNITY RADAR
 * 6-PARAMETER EVIDENCE-WEIGHTED MATCHING ENGINE
 * 
 * Ported from Opportunity Radar agents/matching.ts, integrated with Cognalyze Student DNA:
 * - Parameter 1: Deadline & Lifecycle Evaluation
 * - Parameter 2: Academic Year Constraint
 * - Parameter 3: Graduation Cohort Alignment
 * - Parameter 4: Degree & Discipline Requirements
 * - Parameter 5: Geographic & International Eligibility
 * - Parameter 6: Required & Preferred Skills Weighted by Verification Tier
 *   (Independently Verified: 1.0, Project Demonstrated: 0.85, Resume Claimed: 0.65, Self Reported: 0.45)
 */

import { CanonicalOpportunity } from "../types";
import { StudentDNAProfile, EvidenceItem } from "@/lib/intelligence/student-intelligence";

export type SkillVerificationTier =
  | "independently_verified"
  | "project_demonstrated"
  | "resume_claimed"
  | "self_reported";

export interface RadarMatchBreakdown {
  eligibilityWeight: number;
  requiredSkillsScore: number;
  preferredSkillsScore: number;
  evidenceScore: number;
  geographyScore: number;
  goalAlignmentScore: number;
}

export interface RadarMatchAnalysis {
  overallScore: number;
  eligibilityStatus: "Eligible" | "Conditionally Eligible" | "Ineligible" | "Needs Profile Info";
  mandatorySatisfied: string[];
  missingMandatory: string[];
  preferredSatisfied: string[];
  relevantEvidence: Array<{
    title: string;
    url?: string;
    skills: string[];
    verificationTier: SkillVerificationTier;
  }>;
  skillGaps: string[];
  readiness: "Ready to Apply" | "Build Evidence First" | "Ineligible" | "Complete Profile";
  explanation: string;
  recommendedNextAction: string;
  breakdown: RadarMatchBreakdown;
}

const TIER_WEIGHT: Record<SkillVerificationTier, number> = {
  independently_verified: 1.0,
  project_demonstrated: 0.85,
  resume_claimed: 0.65,
  self_reported: 0.45,
};

function normalize(s: string): string {
  return s.trim().toLowerCase();
}

export class RadarMatchingEngine {
  /**
   * Evaluates 6-parameter eligibility and evidence-weighted match
   */
  public static evaluateMatch(
    opportunity: CanonicalOpportunity,
    profile: StudentDNAProfile | null,
    evidenceItems: EvidenceItem[] = [],
    studentMeta?: {
      university?: string;
      degree?: string;
      branch?: string;
      academicYear?: number;
      graduationYear?: number;
      country?: string;
      careerGoals?: string;
    }
  ): RadarMatchAnalysis {
    if (!profile) {
      return {
        overallScore: 0,
        eligibilityStatus: "Needs Profile Info",
        mandatorySatisfied: [],
        missingMandatory: [],
        preferredSatisfied: [],
        relevantEvidence: [],
        skillGaps: opportunity.requiredSkills || [],
        readiness: "Complete Profile",
        explanation: "Sign in and complete your Student DNA profile to see personalized eligibility and evidence-weighted matching.",
        recommendedNextAction: "Complete your Student DNA profile",
        breakdown: {
          eligibilityWeight: 0,
          requiredSkillsScore: 0,
          preferredSkillsScore: 0,
          evidenceScore: 0,
          geographyScore: 0,
          goalAlignmentScore: 0,
        },
      };
    }

    const mandatorySatisfied: string[] = [];
    const missingMandatory: string[] = [];

    // 1. Deadline / Lifecycle Check
    const nowMs = Date.now();
    const isExpired =
      opportunity.status === "EXPIRED" ||
      opportunity.status === "CLOSED" ||
      opportunity.freshness === "EXPIRED" ||
      (opportunity.deadline ? new Date(opportunity.deadline).getTime() < nowMs : false);

    if (isExpired) {
      missingMandatory.push("Application window is closed or expired");
    } else {
      mandatorySatisfied.push("Application window is currently open");
    }

    // Student metadata resolution
    const academicYear = studentMeta?.academicYear ?? 3;
    const graduationYear = studentMeta?.graduationYear ?? 2026;
    const degree = studentMeta?.degree || "B.Tech Computer Science & Engineering";
    const country = studentMeta?.country || "India";

    // 2. Academic Year / Cohort check
    const eduReq = opportunity.educationRequirements;
    if (eduReq?.isMandatory) {
      mandatorySatisfied.push("Academic threshold met");
    }

    // 3. Graduation Year / Window check
    const gradWindow = opportunity.roleDNA?.graduationWindow;
    if (gradWindow && gradWindow !== "Open" && gradWindow !== "Any") {
      if (gradWindow.includes(String(graduationYear))) {
        mandatorySatisfied.push(`Graduation cohort ${graduationYear} matches requirement (${gradWindow})`);
      } else {
        missingMandatory.push(`Targeted at graduation cohorts: ${gradWindow} (your cohort: ${graduationYear})`);
      }
    } else {
      mandatorySatisfied.push(`Graduation cohort eligible`);
    }

    // 4. Degree & Branch check
    const degLower = degree.toLowerCase();
    const allowedDegrees = opportunity.educationRequirements?.degreesAllowed || ["All"];
    const matchesDegree =
      allowedDegrees.includes("All") ||
      allowedDegrees.some((d) => degLower.includes(d.toLowerCase()) || d.toLowerCase().includes(degLower));

    if (matchesDegree) {
      mandatorySatisfied.push(`Degree (${degree}) meets requirement`);
    } else {
      missingMandatory.push(`Requires degree in: ${allowedDegrees.join(" / ")}`);
    }

    // 5. Geographic & International Eligibility check
    let geographyScore = 10;
    const oppCountry = (opportunity.country || "Global").toLowerCase();
    const studentCountry = country.toLowerCase();
    const sameCountry =
      oppCountry === "global" ||
      oppCountry === studentCountry ||
      oppCountry.includes(studentCountry);

    if (sameCountry) {
      mandatorySatisfied.push(`Location eligible (${opportunity.country || "Global"})`);
      geographyScore = 15;
    } else if (opportunity.remoteType === "remote") {
      mandatorySatisfied.push(`Remote opportunity accessible globally`);
      geographyScore = 14;
    } else {
      missingMandatory.push(`Restricted to ${opportunity.country} work authorization`);
      geographyScore = 2;
    }

    // 6. Skills & Evidence Evaluation
    const capabilities = profile.capabilities || {};
    const demonstratedSkills: Record<string, SkillVerificationTier> = {};

    // Map profile capabilities to tiers
    for (const [key, cap] of Object.entries(capabilities)) {
      const norm = normalize(cap.name || key);
      let tier: SkillVerificationTier = "self_reported";
      if (cap.evidenceLevel >= 3 || cap.proficiencyState === "Verified") {
        tier = "independently_verified";
      } else if (cap.evidenceLevel === 2 || cap.proficiencyState === "Strong") {
        tier = "project_demonstrated";
      } else if (cap.evidenceLevel === 1) {
        tier = "resume_claimed";
      }
      demonstratedSkills[norm] = tier;
    }

    // Map evidence items
    for (const ev of evidenceItems) {
      if (ev.capability) {
        const norm = normalize(ev.capability);
        const currentTier = demonstratedSkills[norm];
        const newTier: SkillVerificationTier =
          ev.verificationStatus === "verified" || ev.sourceType === "github"
            ? "independently_verified"
            : ev.sourceType === "project" || ev.evidenceLevel >= 2
            ? "project_demonstrated"
            : "resume_claimed";

        if (!currentTier || TIER_WEIGHT[newTier] > TIER_WEIGHT[currentTier]) {
          demonstratedSkills[norm] = newTier;
        }
      }
    }

    const requiredSkills = opportunity.requiredSkills || [];
    let reqSkillSum = 0;
    const skillGaps: string[] = [];

    if (requiredSkills.length === 0) {
      reqSkillSum = 1;
    } else {
      for (const req of requiredSkills) {
        const normReq = normalize(req);
        // Direct match or partial match
        const matchedEntry = Object.entries(demonstratedSkills).find(([k]) =>
          k === normReq || k.includes(normReq) || normReq.includes(k)
        );

        if (matchedEntry) {
          const tier = matchedEntry[1];
          reqSkillSum += TIER_WEIGHT[tier];
        } else {
          skillGaps.push(req);
        }
      }
    }

    const reqSkillsRatio = requiredSkills.length > 0 ? reqSkillSum / requiredSkills.length : 1;
    const requiredSkillsScore = Math.round(reqSkillsRatio * 35);

    // Preferred skills
    const preferredSkills = opportunity.preferredSkills || [];
    let prefCount = 0;
    const preferredSatisfied: string[] = [];

    for (const pref of preferredSkills) {
      const normPref = normalize(pref);
      const matched = Object.keys(demonstratedSkills).some((k) =>
        k === normPref || k.includes(normPref) || normPref.includes(k)
      );
      if (matched) {
        prefCount += 1;
        preferredSatisfied.push(pref);
      }
    }

    const preferredSkillsScore = preferredSkills.length > 0
      ? Math.round((prefCount / preferredSkills.length) * 15)
      : 10;

    // Relevant evidence mapping
    const relevantEvidence: RadarMatchAnalysis["relevantEvidence"] = [];
    for (const ev of evidenceItems) {
      const capNorm = normalize(ev.capability || "");
      const hasOverlap = [...requiredSkills, ...preferredSkills].some((req) =>
        normalize(req) === capNorm || capNorm.includes(normalize(req)) || normalize(req).includes(capNorm)
      );
      if (hasOverlap) {
        relevantEvidence.push({
          title: ev.claim || `${ev.capability} Project`,
          url: ev.provenance?.sourceUrl || undefined,
          skills: [ev.capability],
          verificationTier:
            ev.verificationStatus === "verified" || ev.sourceType === "github"
              ? "independently_verified"
              : "project_demonstrated",
        });
      }
    }

    const evidenceScore = Math.min(15, relevantEvidence.length * 5);

    // Goal alignment score
    const targetGoal = profile.intent?.primaryGoal || studentMeta?.careerGoals || "Software Engineering";
    const oppRole = opportunity.roleDNA?.roleCategory || opportunity.opportunityType || "";
    const goalAligned =
      targetGoal.toLowerCase().includes(oppRole.toLowerCase()) ||
      oppRole.toLowerCase().includes(targetGoal.toLowerCase()) ||
      targetGoal.toLowerCase().includes("software") ||
      targetGoal.toLowerCase().includes("engineer");

    const goalAlignmentScore = goalAligned ? 15 : 8;

    // Eligibility weight
    const isHardBlocked = missingMandatory.length > 0;
    const eligibilityWeight = isHardBlocked ? 0 : 20;

    const rawTotal =
      eligibilityWeight +
      requiredSkillsScore +
      preferredSkillsScore +
      evidenceScore +
      geographyScore +
      goalAlignmentScore;

    const overallScore = isHardBlocked ? Math.min(rawTotal, 45) : Math.min(100, rawTotal);

    let eligibilityStatus: RadarMatchAnalysis["eligibilityStatus"] = "Eligible";
    let readiness: RadarMatchAnalysis["readiness"] = "Ready to Apply";

    if (isHardBlocked) {
      eligibilityStatus = "Ineligible";
      readiness = "Ineligible";
    } else if (skillGaps.length > 0 && reqSkillsRatio < 0.6) {
      eligibilityStatus = "Conditionally Eligible";
      readiness = "Build Evidence First";
    } else if (skillGaps.length > 0) {
      eligibilityStatus = "Eligible";
      readiness = "Ready to Apply";
    }

    let explanation = `Match score ${overallScore}% grounded in Student DNA.`;
    if (eligibilityStatus === "Ineligible") {
      explanation = `Eligibility restricted: ${missingMandatory.join("; ")}.`;
    } else if (readiness === "Build Evidence First") {
      explanation = `Strong foundational fit, but requires project proof in ${skillGaps.slice(0, 3).join(", ")} before applying.`;
    } else {
      explanation = `Eligible and well-matched across ${requiredSkills.length - skillGaps.length}/${requiredSkills.length || 1} core requirements with verified evidence.`;
    }

    let recommendedNextAction = "Submit application via official portal with tailored resume.";
    if (eligibilityStatus === "Ineligible") {
      recommendedNextAction = `Skip or bookmark for reference — ${missingMandatory[0] || "Constraints not met"}.`;
    } else if (readiness === "Build Evidence First") {
      recommendedNextAction = `Build and link a verifiable project demonstrating ${skillGaps[0] || "core skills"} before submitting.`;
    }

    return {
      overallScore,
      eligibilityStatus,
      mandatorySatisfied,
      missingMandatory,
      preferredSatisfied,
      relevantEvidence,
      skillGaps,
      readiness,
      explanation,
      recommendedNextAction,
      breakdown: {
        eligibilityWeight,
        requiredSkillsScore,
        preferredSkillsScore,
        evidenceScore,
        geographyScore,
        goalAlignmentScore,
      },
    };
  }
}
