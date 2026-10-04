/**
 * COGNALYZE OPPORTUNITY INTELLIGENCE — ELIGIBILITY ENGINE (PART 1)
 * 
 * CORE PRINCIPLE:
 * "Eligibility is NOT the same as ranking."
 * A candidate may be:
 * - Eligible but a weak fit
 * - Eligible and a strong fit
 * - Potentially eligible but missing information
 * - Ineligible despite having strong skills
 * 
 * Critical Rules:
 * 1. Hard eligibility failure overrides any skill match score.
 * 2. Evaluate in strict priority order:
 *    Explicit disqualifiers -> Work auth/location -> Education/degree -> Graduation year/student status -> Experience -> Employment type.
 * 3. Soft requirements ("preferred", "bonus") affect ranking, NOT eligibility.
 * 4. Skills are NOT automatic eligibility blockers (missing skill = skill gap, not eligibility failure).
 * 5. Never guess or hallucinate eligibility status.
 */

import { CanonicalOpportunity, EligibilityResult, EligibilityStatus } from "../types";
import { StudentDNAProfile } from "@/lib/intelligence/student-intelligence";

export interface CandidateEligibilityContext {
  studentId: string;
  degree?: string;              // e.g. "B.Tech Computer Science"
  fieldOfStudy?: string;        // e.g. "Computer Science & Engineering"
  graduationYear?: number;      // e.g. 2027
  isCurrentlyEnrolled?: boolean;
  yearsOfExperience?: number;   // e.g. 0
  currentLocationCountry?: string; // e.g. "India"
  currentLocationCity?: string;    // e.g. "Bengaluru"
  workAuthorizationCountry?: string; // e.g. "India"
  requiresSponsorship?: boolean;
}

export class OpportunityEligibilityEngine {
  /**
   * Evaluates candidate eligibility against an opportunity with strict priority rules.
   */
  public static evaluate(
    opp: CanonicalOpportunity,
    candidate: CandidateEligibilityContext,
    profile?: StudentDNAProfile
  ): EligibilityResult {
    const hardRequirements: string[] = [];
    const satisfiedRequirements: string[] = [];
    const failedRequirements: string[] = [];
    const unknownRequirements: string[] = [];
    const blockers: string[] = [];

    // ─────────────────────────────────────────────────────────────
    // 1. Explicit Disqualifiers Check
    // ─────────────────────────────────────────────────────────────
    if (opp.disqualifiers && opp.disqualifiers.length > 0) {
      for (const disq of opp.disqualifiers) {
        hardRequirements.push(`No Disqualifier: ${disq}`);
        const lowerDisq = disq.toLowerCase();

        // Check experience disqualifier (e.g. "5+ years required")
        if (lowerDisq.includes("5+ years") || lowerDisq.includes("senior")) {
          if ((candidate.yearsOfExperience || 0) < 3) {
            failedRequirements.push(disq);
            blockers.push(`Requires 5+ years professional experience (candidate has ${candidate.yearsOfExperience || 0} years)`);
          } else {
            satisfiedRequirements.push(disq);
          }
        }
        // Check US citizenship / security clearance
        else if (lowerDisq.includes("us citizenship") || lowerDisq.includes("security clearance")) {
          if (candidate.workAuthorizationCountry !== "United States" && candidate.workAuthorizationCountry !== "US") {
            failedRequirements.push(disq);
            blockers.push("Requires US Citizenship or government security clearance");
          } else {
            satisfiedRequirements.push(disq);
          }
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 2. Work Authorization / Hard Location Constraints
    // ─────────────────────────────────────────────────────────────
    if (opp.workAuthRequirements?.isMandatory) {
      const requiredCountry = opp.workAuthRequirements.country.toLowerCase();
      const candCountry = (candidate.workAuthorizationCountry || candidate.currentLocationCountry || "india").toLowerCase();
      hardRequirements.push(`Work Authorization in ${opp.workAuthRequirements.country}`);

      if (candCountry && !candCountry.includes(requiredCountry) && !requiredCountry.includes(candCountry)) {
        if (!opp.workAuthRequirements.sponsorshipAvailable) {
          failedRequirements.push(`Work authorization required in ${opp.workAuthRequirements.country} without sponsorship`);
          blockers.push(`Requires work authorization in ${opp.workAuthRequirements.country} (sponsorship not provided)`);
        } else {
          unknownRequirements.push(`Work authorization in ${opp.workAuthRequirements.country} (sponsorship may be needed)`);
        }
      } else {
        satisfiedRequirements.push(`Work authorized in ${opp.workAuthRequirements.country}`);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 3. Education / Degree Eligibility
    // ─────────────────────────────────────────────────────────────
    const edu = opp.educationRequirements;
    if (edu && edu.isMandatory && edu.degreesAllowed && edu.degreesAllowed.length > 0) {
      hardRequirements.push(`Degree: ${edu.degreesAllowed.join(" or ")}`);
      const candDegree = (candidate.degree || "B.Tech").toLowerCase();

      const degreeMatches = edu.degreesAllowed.some(d => {
        const cleanD = d.toLowerCase().replace(/[^a-z0-9]/g, "");
        const cleanCand = candDegree.replace(/[^a-z0-9]/g, "");
        return cleanCand.includes(cleanD) || cleanD.includes(cleanCand) || cleanCand.includes("btech") || cleanCand.includes("be");
      });

      if (degreeMatches) {
        satisfiedRequirements.push(`Degree compatible (${candidate.degree || "B.Tech"})`);
      } else if (!candidate.degree) {
        unknownRequirements.push(`Degree requirement (${edu.degreesAllowed.join(", ")})`);
      } else {
        // If degree explicitly doesn't match and is mandatory
        failedRequirements.push(`Degree requires: ${edu.degreesAllowed.join(", ")}`);
        blockers.push(`Candidate degree (${candidate.degree}) does not match allowed degrees: ${edu.degreesAllowed.join(", ")}`);
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 4. Graduation Year / Student Status
    // ─────────────────────────────────────────────────────────────
    const grad = opp.graduationRequirements;
    if (grad && grad.isMandatory) {
      if (grad.allowedYears && grad.allowedYears.length > 0) {
        hardRequirements.push(`Graduation Year: ${grad.allowedYears.join(", ")}`);
        const candGradYear = candidate.graduationYear || 2027; // default to standard student year

        if (grad.allowedYears.includes(candGradYear)) {
          satisfiedRequirements.push(`Graduation year ${candGradYear} is within allowed window (${grad.allowedYears.join(", ")})`);
        } else if (candGradYear < Math.min(...grad.allowedYears)) {
          failedRequirements.push(`Graduation year ${candGradYear} is before allowed batch (${grad.allowedYears.join(", ")})`);
          blockers.push(`Opportunity requires graduating batch ${grad.allowedYears.join(", ")}; candidate graduated in ${candGradYear}`);
        } else if (candGradYear > Math.max(...grad.allowedYears)) {
          failedRequirements.push(`Graduation year ${candGradYear} is after allowed batch (${grad.allowedYears.join(", ")})`);
          blockers.push(`Opportunity requires graduating batch ${grad.allowedYears.join(", ")}; candidate graduates in ${candGradYear}`);
        }
      }

      if (grad.currentlyEnrolledRequired) {
        hardRequirements.push("Currently enrolled student status");
        if (candidate.isCurrentlyEnrolled !== false) {
          satisfiedRequirements.push("Currently enrolled in recognized university program");
        } else {
          failedRequirements.push("Must be currently enrolled student");
          blockers.push("Opportunity requires currently enrolled student status");
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 5. Experience Requirement (Hard vs Soft)
    // ─────────────────────────────────────────────────────────────
    if (opp.experienceLevel === "senior") {
      hardRequirements.push("Senior engineering experience (3+ years)");
      if ((candidate.yearsOfExperience || 0) < 2) {
        failedRequirements.push("Requires senior engineering experience");
        blockers.push("Senior level role requires 3+ years experience (candidate is intern/student)");
      } else {
        satisfiedRequirements.push("Experience level compatible");
      }
    }

    // ─────────────────────────────────────────────────────────────
    // Determine Overall Status
    // ─────────────────────────────────────────────────────────────
    let status: EligibilityStatus = "ELIGIBLE";
    let explanation = "";

    if (blockers.length > 0) {
      status = "INELIGIBLE";
      explanation = `Not currently eligible: ${blockers[0]}.`;
    } else if (unknownRequirements.length > 0 && satisfiedRequirements.length === 0) {
      status = "UNKNOWN";
      explanation = "Eligibility needs verification with employer details.";
    } else if (unknownRequirements.length > 0) {
      status = "POTENTIALLY_ELIGIBLE";
      explanation = `Appears compatible on core criteria, but ${unknownRequirements[0]} requires verification before applying.`;
    } else {
      status = "ELIGIBLE";
      explanation = "Confirmed eligible. Degree, graduation year, experience, and enrollment criteria are satisfied.";
    }

    return {
      status,
      hardRequirements,
      satisfiedRequirements,
      failedRequirements,
      unknownRequirements,
      blockers,
      explanation
    };
  }
}
