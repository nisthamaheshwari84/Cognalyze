import { StructuredResumeProfile } from "./resume-parser";
import { ParsedJobRequirements } from "./jd-extractor";

export interface FitEvaluationResult {
  overallScore: number;
  verdict: "Strong Fit" | "Good Match" | "Borderline" | "Not Qualified";
  matchingSkills: string[];
  missingSkills: string[];
  experienceScore: number;
  skillsScore: number;
  technicalDepthScore: number;
  redFlags: string[];
  greenFlags: string[];
  summaryNote: string;
}

/**
 * Shared Authoritative Scoring Engine
 * Used by:
 * 1. Student Side: /student/opportunities (fit-score against active opportunities)
 * 2. Recruiter Side: /recruiter/candidates (ranking candidates against job postings)
 */
export function evaluateCandidateFit(
  candidate: Partial<StructuredResumeProfile>,
  jd: Partial<ParsedJobRequirements>
): FitEvaluationResult {
  const candidateSkills = (candidate.skills || []).map(s => (typeof s === "string" ? s : s.name).toLowerCase());
  const mandatory = (jd.mandatorySkills || []).map(s => s.toLowerCase());
  const preferred = (jd.preferredSkills || []).map(s => s.toLowerCase());

  // 1. Skill Matching
  const matchingSkills: string[] = [];
  const missingSkills: string[] = [];

  for (const m of mandatory) {
    const isMatch = candidateSkills.some(cs => cs.includes(m) || m.includes(cs));
    if (isMatch) {
      matchingSkills.push(m);
    } else {
      missingSkills.push(m);
    }
  }

  const mandatoryRatio = mandatory.length > 0 ? matchingSkills.length / mandatory.length : 0.8;
  const skillsScore = Math.round(mandatoryRatio * 80 + (preferred.filter(p => candidateSkills.some(cs => cs.includes(p))).length / Math.max(preferred.length, 1)) * 20);

  // 2. Experience Alignment
  const candYoe = candidate.yearsOfExperience || 0;
  const minYoe = jd.minYearsExperience || 0;
  const maxYoe = jd.maxYearsExperience || 10;
  let experienceScore = 100;

  if (candYoe < minYoe) {
    const diff = minYoe - candYoe;
    experienceScore = Math.max(35, 100 - diff * 25);
  } else if (candYoe > maxYoe + 3) {
    // Slight over-qualification dampener
    experienceScore = 85;
  }

  // 3. Technical Depth
  const resumeLen = (candidate.rawText || "").length;
  const hasProjects = (candidate.experience || []).length >= 2;
  let technicalDepthScore = 70;
  if (hasProjects) technicalDepthScore += 15;
  if (resumeLen > 1000) technicalDepthScore += 15;
  technicalDepthScore = Math.min(100, technicalDepthScore);

  // 4. Overall Weighted Score
  const overallScore = Math.min(98, Math.max(25, Math.round(
    skillsScore * 0.50 +
    experienceScore * 0.30 +
    technicalDepthScore * 0.20
  )));

  // 5. Flags & Verdict
  const greenFlags: string[] = [];
  const redFlags: string[] = [];

  if (matchingSkills.length >= 3) greenFlags.push(`Matched ${matchingSkills.length} core mandatory skills`);
  if (candYoe >= minYoe) greenFlags.push(`Meets experience threshold (${candYoe} YOE vs min ${minYoe})`);
  if (missingSkills.length > 0) redFlags.push(`Missing core skills: ${missingSkills.slice(0, 3).join(", ")}`);
  if (candYoe < minYoe) redFlags.push(`Under experience requirement (${candYoe} YOE vs min ${minYoe})`);

  let verdict: "Strong Fit" | "Good Match" | "Borderline" | "Not Qualified" = "Borderline";
  if (overallScore >= 80) verdict = "Strong Fit";
  else if (overallScore >= 65) verdict = "Good Match";
  else if (overallScore >= 50) verdict = "Borderline";
  else verdict = "Not Qualified";

  return {
    overallScore,
    verdict,
    matchingSkills,
    missingSkills,
    experienceScore,
    skillsScore,
    technicalDepthScore,
    greenFlags,
    redFlags,
    summaryNote: `${verdict}: ${matchingSkills.length} of ${mandatory.length} mandatory skills matched with ${candYoe} YOE.`
  };
}
