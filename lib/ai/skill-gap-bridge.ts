import { StudentDNA } from "@/lib/ai/student-dna";
import { ProblemStatement, getProblemStatementById } from "@/lib/ai/ps-engine";

export interface SkillGapItem {
  skill: string;
  level: "Covered" | "Partial" | "Gap" | "Missing";
  priority: "Critical" | "High" | "Medium" | "Low";
  studentEvidence?: string;
  actionableFix?: string;
}

export interface TeamSearchTargetProfile {
  required_roles: string[];
  target_skills_sought: string[];
  domain: string;
  difficulty: string;
}

export interface PSSkillGapAnalysis {
  ps_id: string;
  ps_title: string;
  overall_readiness_pct: number;
  covered_skills: SkillGapItem[];
  missing_skills: SkillGapItem[];
  team_search_target_profile: TeamSearchTargetProfile;
  honest_assessment: string;
}

/**
 * Shared core skill gap computation logic.
 * Compares target requirements against student DNA skills and project stacks.
 * Directly reuses the gap-identification contract from the Skill-Gap Roadmap feature.
 */
export function computeSkillGapsAgainstRequirements(
  dna: StudentDNA,
  requiredSkills: string[],
  fundamentalSkills: string[] = []
): { covered: SkillGapItem[]; missing: SkillGapItem[]; readinessScore: number } {
  const covered: SkillGapItem[] = [];
  const missing: SkillGapItem[] = [];

  const dnaSkillMap = new Map<string, { level: string; weight: number; evidence?: string }>();
  for (const s of dna.skills) {
    dnaSkillMap.set(s.name.toLowerCase(), {
      level: s.level,
      weight: s.proficiency_weight,
      evidence: s.evidence || (s.verified_on_github ? "Verified on GitHub" : undefined)
    });
  }

  // Also index project tech stacks
  for (const p of dna.projects) {
    for (const t of p.tech_stack) {
      const lower = t.toLowerCase();
      if (!dnaSkillMap.has(lower)) {
        dnaSkillMap.set(lower, {
          level: "Intermediate",
          weight: 0.8,
          evidence: `Applied in project: ${p.title}`
        });
      }
    }
  }

  let totalWeight = 0;
  let achievedWeight = 0;

  // 1. Process Required Skills (High / Critical priority)
  for (const req of requiredSkills) {
    const lower = req.toLowerCase();
    totalWeight += 2.0;

    let matched = false;
    for (const [sName, sData] of dnaSkillMap.entries()) {
      if (sName.includes(lower) || lower.includes(sName)) {
        achievedWeight += Math.min(2.0, sData.weight * 1.5);
        covered.push({
          skill: req,
          level: sData.level === "Advanced" || sData.level === "Expert" ? "Covered" : "Partial",
          priority: "High",
          studentEvidence: sData.evidence || `Demonstrated at ${sData.level} level`
        });
        matched = true;
        break;
      }
    }

    if (!matched) {
      missing.push({
        skill: req,
        level: "Missing",
        priority: "Critical",
        actionableFix: `Partner with a teammate proficient in ${req} or complete practical module`
      });
    }
  }

  // 2. Process Fundamental Skills (Medium priority)
  for (const fund of fundamentalSkills) {
    const lower = fund.toLowerCase();
    totalWeight += 1.0;

    let matched = false;
    for (const [sName, sData] of dnaSkillMap.entries()) {
      if (sName.includes(lower) || lower.includes(sName)) {
        achievedWeight += Math.min(1.0, sData.weight);
        covered.push({
          skill: fund,
          level: "Covered",
          priority: "Medium",
          studentEvidence: sData.evidence || `Covered via foundation knowledge`
        });
        matched = true;
        break;
      }
    }

    if (!matched) {
      missing.push({
        skill: fund,
        level: "Gap",
        priority: "Medium",
        actionableFix: `Review core engineering fundamentals in ${fund}`
      });
    }
  }

  const readinessScore = totalWeight > 0
    ? Math.min(100, Math.max(20, Math.round((achievedWeight / totalWeight) * 100)))
    : 50;

  return { covered, missing, readinessScore };
}

/**
 * PS Skill Gap Bridge function:
 * Analyzes gaps between a student's DNA and a specific Problem Statement,
 * and packages the missing skills as the target profile for Phase 4 TeamMatch.
 */
export function analyzePSSkillGap(dna: StudentDNA, ps: ProblemStatement): PSSkillGapAnalysis {
  const { covered, missing, readinessScore } = computeSkillGapsAgainstRequirements(
    dna,
    ps.required_skills,
    ps.fundamental_skills
  );

  // Derive target roles for missing skill coverage
  const requiredRoles: string[] = [];
  const missingSkillNames = missing.map(m => m.skill);

  if (missingSkillNames.some(s => /solidity|web3|ethereum|smart contract/i.test(s))) {
    requiredRoles.push("Smart Contract / Web3 Engineer");
  }
  if (missingSkillNames.some(s => /kafka|distributed|redis|concurrency|java|microservice/i.test(s))) {
    requiredRoles.push("Backend & Distributed Systems Architect");
  }
  if (missingSkillNames.some(s => /pytorch|tensorflow|python|machine learning|embeddings|llm/i.test(s))) {
    requiredRoles.push("AI/ML Engineer");
  }
  if (missingSkillNames.some(s => /react|next\.js|frontend|ui|css/i.test(s))) {
    requiredRoles.push("Frontend & UI/UX Specialist");
  }
  if (requiredRoles.length === 0) {
    requiredRoles.push(`${ps.domain} Domain Specialist`);
  }

  const honestAssessment = readinessScore >= 75
    ? `Strong individual readiness (${readinessScore}%). You cover the critical skills (${covered.map(c => c.skill).slice(0, 3).join(", ")}). Adding a teammate with ${missingSkillNames.join(", ")} will maximize hackathon winning potential.`
    : `Moderate readiness (${readinessScore}%). You have core strengths in ${covered.map(c => c.skill).join(", ")}, but need complementary teammates covering ${missingSkillNames.join(", ")} to tackle the ${ps.difficulty} challenges of this problem.`;

  return {
    ps_id: ps.id,
    ps_title: ps.title,
    overall_readiness_pct: readinessScore,
    covered_skills: covered,
    missing_skills: missing,
    team_search_target_profile: {
      required_roles: requiredRoles,
      target_skills_sought: missingSkillNames,
      domain: ps.domain,
      difficulty: ps.difficulty
    },
    honest_assessment: honestAssessment
  };
}
