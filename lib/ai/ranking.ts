import { RedrobCandidate, EvaluationReport } from "@/types/matching";
import { calculateExperienceScore, calculateTrajectoryScore } from "@/lib/scoring";
import { calculateBehavioralFromSignals } from "@/lib/scoring/behavioral";
import { normalizeCandidateProfile } from "@/lib/resilience/json-repair";

export interface RankResult {
  candidate_id: string;
  rank: number;
  score: number;
  reasoning: string;
  evidence_status: "verified" | "potential_match_insufficient_evidence" | "needs_review" | "gap";
}

// Tech release years to catch time-travelers
const TECH_RELEASE_YEARS: Record<string, number> = {
  "react": 2013,
  "kubernetes": 2014,
  "k8s": 2014,
  "pytorch": 2016,
  "tensorflow": 2015,
  "rust": 2015,
  "langchain": 2022,
  "pinecone": 2021,
  "weaviate": 2020,
  "qdrant": 2020
};

export function scoreCandidateLocal(
  rawCandidate: RedrobCandidate,
  targetYoe: number = 7
): { score: number; reasoning: string; isHoneypot: boolean; evidence_status: "verified" | "potential_match_insufficient_evidence" | "needs_review" | "gap" } {
  // Normalize candidate to guarantee safe property access
  const cand = normalizeCandidateProfile<RedrobCandidate>(rawCandidate);

  let score = 0;
  const reasons: string[] = [];
  let isHoneypot = false;

  // 1. Mandatory Core ML Skill Check with Evidence Depth
  const skillsList = Array.isArray(cand.skills) ? cand.skills : [];
  const candSkills = skillsList
    .map(s => (s?.name ? String(s.name).toLowerCase() : ""))
    .filter(Boolean);

  let skillMatchCount = 0;
  let verifiedSkillCount = 0;
  const coreJdSkills = ["machine learning", "ml", "embeddings", "vector search", "retrieval", "nlp", "ranking", "python"];
  
  coreJdSkills.forEach(skill => {
    if (candSkills.includes(skill)) {
      skillMatchCount++;
      const matched = skillsList.find(s => s?.name && String(s.name).toLowerCase() === skill);
      if (matched && (matched.proficiency === "advanced" || matched.proficiency === "expert" || (matched.duration_months && matched.duration_months >= 12))) {
        verifiedSkillCount++;
      }
    }
  });

  const skillScore = (skillMatchCount / coreJdSkills.length) * 100;
  score += skillScore * 0.35; // 35% weight

  // 2. Experience Gaussian Match (5-9 YoE target)
  const actualYoe = typeof cand.profile?.years_of_experience === "number" ? cand.profile.years_of_experience : 3;
  const experienceScore = calculateExperienceScore(actualYoe, targetYoe);
  score += experienceScore * 0.25; // 25% weight

  // 3. Career Progression & Tenure Signal (truthful history, no employer prestige bias)
  const history = Array.isArray(cand.career_history) ? cand.career_history : [];
  const totalMonths = history.reduce((sum, c) => sum + (typeof c?.duration_months === "number" ? c.duration_months : 0), 0);
  const avgTenure = history.length > 0 ? totalMonths / history.length : 0;
  
  // Calculate promotions as progression across multiple roles within the same company
  const companyCounts = new Map<string, number>();
  for (const item of history) {
    const key = (item?.company || "").toLowerCase().trim();
    if (key) {
      companyCounts.set(key, (companyCounts.get(key) || 0) + 1);
    }
  }
  let promotionsCount = 0;
  for (const count of companyCounts.values()) {
    if (count > 1) promotionsCount += count - 1;
  }

  const trajectoryScore = calculateTrajectoryScore(avgTenure, promotionsCount);
  score += trajectoryScore * 0.15; // 15% weight

  // 4. Behavioral & Telemetry Modifier
  const behavioral = calculateBehavioralFromSignals(cand.redrob_signals || {});
  score += (behavioral.availabilityScore || 50) * 0.15; // 15% weight
  score += (behavioral.hireabilityScore || 50) * 0.10; // 10% weight

  // 5. Fraud & Honeypot Checking (Deterministic Traps)
  let penalty = 0;
  
  // Rule A: Time-traveling skills
  skillsList.forEach(s => {
    if (!s?.name) return;
    const name = String(s.name).toLowerCase();
    const releaseYear = TECH_RELEASE_YEARS[name];
    if (releaseYear && typeof s.duration_months === "number" && s.duration_months > 0) {
      const startYearOfSkill = 2026 - (s.duration_months / 12);
      if (startYearOfSkill < releaseYear - 1) { // 1 year grace period
        isHoneypot = true;
        penalty += 40;
        reasons.push(`claimed ${Math.round(s.duration_months/12)} years of ${s.name} (released in ${releaseYear})`);
      }
    }
  });

  // Rule B: Unrealistic promotions
  if (history.length >= 2) {
    const recent = history[0];
    const prev = history[1];
    const recentTitle = (recent?.title || "").toLowerCase();
    const prevTitle = (prev?.title || "").toLowerCase();
    const recentDuration = typeof recent?.duration_months === "number" ? recent.duration_months : 24;

    if (recentTitle.includes("vp") && prevTitle.includes("junior") && recentDuration <= 12) {
      isHoneypot = true;
      penalty += 40;
      reasons.push("suspicious promotion from junior to VP in under 12 months");
    }
  }

  // Rule C: Overlapping timelines (>2 full-time current roles)
  const currentRoles = history.filter(c => Boolean(c?.is_current));
  if (currentRoles.length > 2) {
    isHoneypot = true;
    penalty += 50;
    reasons.push("claimed multiple simultaneous full-time current roles");
  }

  // Apply penalty
  const finalScore = Math.max(0, Math.round(score - penalty));

  // Determine Evidence Status (Section 12: Evidence-First Matching)
  let evidence_status: "verified" | "potential_match_insufficient_evidence" | "needs_review" | "gap" = "verified";
  if (isHoneypot) {
    evidence_status = "needs_review";
  } else if (skillMatchCount >= 3 && verifiedSkillCount === 0 && history.length === 0) {
    evidence_status = "potential_match_insufficient_evidence";
  } else if (skillMatchCount < 2) {
    evidence_status = "gap";
  } else if (skillMatchCount >= 2 && verifiedSkillCount >= 1) {
    evidence_status = "verified";
  } else {
    evidence_status = "potential_match_insufficient_evidence";
  }

  // Build specific, non-templated reasoning
  let reasoning = "";
  if (isHoneypot) {
    reasoning = `Flagged for verification: ${reasons.join(", ")}.`;
  } else if (evidence_status === "potential_match_insufficient_evidence") {
    reasoning = `Potential match (${skillMatchCount}/${coreJdSkills.length} keywords), but insufficient verified project or work evidence. Verification task recommended.`;
  } else if (finalScore >= 80) {
    reasoning = `Strong fit with ${actualYoe} YoE, matching ${skillMatchCount}/${coreJdSkills.length} core competencies with verified depth.`;
  } else if (finalScore >= 60) {
    reasoning = `Moderate fit with ${actualYoe} YoE and ${skillMatchCount}/${coreJdSkills.length} matched skills; progression aligns with baseline requirements.`;
  } else {
    reasoning = `Gaps in core technical requirements (matched ${skillMatchCount}/${coreJdSkills.length}) and experience delta (${actualYoe} vs ${targetYoe} target).`;
  }

  return {
    score: finalScore,
    reasoning,
    isHoneypot,
    evidence_status
  };
}
