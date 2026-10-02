/**
 * lib/dna/profile-engine.ts
 * STUDENT SKILL PROFILE & DETERMINISTIC PROFICIENCY ESTIMATION
 * 
 * Rules:
 * 1. UNKNOWN IS EXPLICITLY DIFFERENT FROM ZERO (Level 0 = Unknown, "Not enough evidence yet").
 * 2. Deterministic aggregation (Weighted combination of strength, reliability, verification, recency).
 * 3. NO LLM-generated magic numbers.
 * 4. Every level includes a plain-English, non-technical "Why?" answer.
 * 5. Distinct Confidence (High/Medium/Low) and Evidence Coverage (High/Medium/Low/None).
 */

import { CanonicalSkill, getAllCanonicalSkills, getCanonicalSkill } from "./taxonomy";
import {
  DNAEvidence,
  calculateRecencyState,
  detectContradictions,
  ContradictionFinding
} from "./evidence-pipeline";

export interface StudentSkill {
  userId: string;
  skillId: string;
  skillName: string;
  category: string;
  estimatedLevel: 0 | 1 | 2 | 3 | 4 | 5;
  levelLabel: "Unknown" | "Familiar" | "Beginner" | "Intermediate" | "Advanced" | "Strongly Demonstrated";
  studentFacingLabel: "Strong" | "Developing" | "Needs Practice" | "Not enough evidence";
  confidence: "HIGH" | "MEDIUM" | "LOW";
  evidenceCoverage: "HIGH" | "MEDIUM" | "LOW" | "NONE";
  evidenceCount: number;
  verifiedEvidenceCount: number;
  recentEvidenceCount: number;
  lastDemonstratedAt?: string;
  statusReason: string;
  evidenceList: DNAEvidence[];
  provenanceSources: string[];
  whyExplanation: string;
  contradiction?: ContradictionFinding | null;
  updatedAt: string;
}

export interface StudentDNASnapshot {
  userId: string;
  headline: string;
  strongestSkills: StudentSkill[];
  growingSkills: StudentSkill[];
  needsAttentionSkills: StudentSkill[];
  unprovenSkillsCount: number;
  proofSummary: {
    githubVerified: boolean;
    githubRepoCount: number;
    leetcodeSolvedCount: number;
    projectsCount: number;
    assessmentsCount: number;
    interviewsCount: number;
    hackathonsCount: number;
  };
  overallCoverage: "HIGH" | "MEDIUM" | "LOW";
  generatedAt: string;
}

/**
 * Computes deterministic proficiency for a single skill from its evidence pool.
 */
export function computeStudentSkillProfile(
  userId: string,
  canonical: CanonicalSkill,
  evidencePool: DNAEvidence[]
): StudentSkill {
  const matchingEvidence = evidencePool.filter(e => e.skillId === canonical.skillId);
  const evidenceCount = matchingEvidence.length;

  // ── INVARIANT 1: UNKNOWN MUST BE DIFFERENT FROM ZERO ──
  if (evidenceCount === 0) {
    return {
      userId,
      skillId: canonical.skillId,
      skillName: canonical.name,
      category: canonical.category,
      estimatedLevel: 0,
      levelLabel: "Unknown",
      studentFacingLabel: "Not enough evidence",
      confidence: "LOW",
      evidenceCoverage: "NONE",
      evidenceCount: 0,
      verifiedEvidenceCount: 0,
      recentEvidenceCount: 0,
      statusReason: "No observed evidence or demonstration recorded yet.",
      evidenceList: [],
      provenanceSources: [],
      whyExplanation: "We need more proof before we can assess your capability in this skill. Complete a practice module or add a project artifact.",
      contradiction: null,
      updatedAt: new Date().toISOString()
    };
  }

  // ── 2. AGGREGATE EVIDENCE METRICS ──
  const verifiedCount = matchingEvidence.filter(e => e.verificationStatus === "VERIFIED" || e.verificationStatus === "DEMONSTRATED").length;
  const recentCount = matchingEvidence.filter(e => e.recency === "CURRENT" || e.recency === "RECENT").length;

  // Sort by observation date (most recent first)
  const sorted = [...matchingEvidence].sort(
    (a, b) => new Date(b.observedAt).getTime() - new Date(a.observedAt).getTime()
  );
  const lastDemonstratedAt = sorted[0]?.observedAt;

  // Check for contradiction
  const contradiction = detectContradictions(canonical.skillId, matchingEvidence);

  // Distinct sources list
  const provenanceSources = Array.from(new Set(matchingEvidence.map(e => e.sourceType)));

  // ── 3. COMPUTE WEIGHTED SCORE ACCUMULATION ──
  let totalScore = 0;
  for (const ev of matchingEvidence) {
    const { multiplier: recencyMult } = calculateRecencyState(ev.observedAt);
    const verificationMult = ev.verificationStatus === "VERIFIED" ? 1.3 : ev.verificationStatus === "DEMONSTRATED" ? 1.1 : 0.8;
    const itemWeight = ev.strength * ev.reliability * recencyMult * verificationMult;
    totalScore += itemWeight;
  }

  // Multi-source independence bonus (corroboration without duplicate counting)
  if (provenanceSources.length >= 2) {
    totalScore *= 1.25;
  }
  if (provenanceSources.length >= 3) {
    totalScore *= 1.15;
  }

  // ── 4. DETERMINISTIC LEVEL ASSIGNMENT ──
  let estimatedLevel: 0 | 1 | 2 | 3 | 4 | 5 = 1;
  let levelLabel: StudentSkill["levelLabel"] = "Familiar";
  let studentFacingLabel: StudentSkill["studentFacingLabel"] = "Needs Practice";

  if (contradiction) {
    estimatedLevel = 2;
    levelLabel = "Beginner";
    studentFacingLabel = "Needs Practice";
  } else if (totalScore >= 3.2 && verifiedCount >= 2) {
    estimatedLevel = 5;
    levelLabel = "Strongly Demonstrated";
    studentFacingLabel = "Strong";
  } else if (totalScore >= 2.0 && (verifiedCount >= 1 || matchingEvidence.length >= 2)) {
    estimatedLevel = 4;
    levelLabel = "Advanced";
    studentFacingLabel = "Strong";
  } else if (totalScore >= 1.1) {
    estimatedLevel = 3;
    levelLabel = "Intermediate";
    studentFacingLabel = "Developing";
  } else if (totalScore >= 0.5) {
    estimatedLevel = 2;
    levelLabel = "Beginner";
    studentFacingLabel = "Needs Practice";
  } else {
    estimatedLevel = 1;
    levelLabel = "Familiar";
    studentFacingLabel = "Needs Practice";
  }

  // ── 5. CONFIDENCE & EVIDENCE COVERAGE ──
  let confidence: "HIGH" | "MEDIUM" | "LOW" = "LOW";
  if (verifiedCount >= 2 || (matchingEvidence.length >= 3 && provenanceSources.length >= 2)) {
    confidence = "HIGH";
  } else if (matchingEvidence.length >= 2 || verifiedCount >= 1) {
    confidence = "MEDIUM";
  }

  let evidenceCoverage: "HIGH" | "MEDIUM" | "LOW" | "NONE" = "LOW";
  if (matchingEvidence.length >= 3 && provenanceSources.length >= 2) {
    evidenceCoverage = "HIGH";
  } else if (matchingEvidence.length >= 2) {
    evidenceCoverage = "MEDIUM";
  }

  // ── 6. BUILD PLAIN ENGLISH "WHY?" EXPLANATION ──
  const whyPoints: string[] = [];

  const projectEv = matchingEvidence.filter(e => e.sourceType === "project" || e.sourceType === "github");
  if (projectEv.length > 0) {
    whyPoints.push(`✓ Used in ${projectEv.length} project artifact${projectEv.length > 1 ? "s" : ""}`);
  }

  const assessmentEv = matchingEvidence.find(e => e.sourceType === "assessment" || e.sourceType === "practice");
  if (assessmentEv) {
    const scoreVal = assessmentEv.extractedValue?.score || assessmentEv.metadata?.score;
    if (scoreVal) {
      whyPoints.push(`✓ Practical assessment score: ${scoreVal}%`);
    } else {
      whyPoints.push("✓ Completed Cognalyze practical assessment module");
    }
  }

  const interviewEv = matchingEvidence.find(e => e.sourceType === "interview");
  if (interviewEv) {
    whyPoints.push("✓ Demonstrated during live technical/behavioral interview");
  }

  const leetcodeEv = matchingEvidence.find(e => e.sourceType === "leetcode" || e.sourceType === "codeforces");
  if (leetcodeEv) {
    whyPoints.push(`✓ Problem-solving activity verified on ${leetcodeEv.sourceType === "leetcode" ? "LeetCode" : "Codeforces"}`);
  }

  const resumeEv = matchingEvidence.find(e => e.sourceType === "resume");
  if (resumeEv && whyPoints.length === 0) {
    whyPoints.push("Claimed on resume (practical demonstration pending)");
  }

  const whyExplanation = whyPoints.length > 0
    ? whyPoints.join(" • ")
    : "Evaluated based on self-reported background.";

  const statusReason = estimatedLevel >= 4
    ? "Demonstrated across multiple verified artifacts with strong performance."
    : estimatedLevel === 3
    ? "Solid foundational and project usage; ready for advanced challenge."
    : "Basic exposure observed; further practical tasks recommended to verify higher depth.";

  return {
    userId,
    skillId: canonical.skillId,
    skillName: canonical.name,
    category: canonical.category,
    estimatedLevel,
    levelLabel,
    studentFacingLabel,
    confidence,
    evidenceCoverage,
    evidenceCount,
    verifiedEvidenceCount: verifiedCount,
    recentEvidenceCount: recentCount,
    lastDemonstratedAt,
    statusReason,
    evidenceList: matchingEvidence,
    provenanceSources,
    whyExplanation,
    contradiction,
    updatedAt: new Date().toISOString()
  };
}

/**
 * Builds the complete list of student skills across the taxonomy.
 */
export function buildFullStudentSkillProfile(
  userId: string,
  evidencePool: DNAEvidence[]
): StudentSkill[] {
  const allCanonical = getAllCanonicalSkills();
  return allCanonical.map(canonical => computeStudentSkillProfile(userId, canonical, evidencePool));
}

/**
 * Generates the clean "First View" Student DNA Snapshot (Section 30).
 */
export function generateStudentDNASnapshot(
  userId: string,
  skills: StudentSkill[],
  rawSources?: {
    githubRepoCount?: number;
    githubVerified?: boolean;
    leetcodeSolvedCount?: number;
    projectsCount?: number;
    assessmentsCount?: number;
    interviewsCount?: number;
    hackathonsCount?: number;
  }
): StudentDNASnapshot {
  const skillsWithEvidence = skills.filter(s => s.estimatedLevel > 0);

  // Strongest: Level 4 or 5
  const strongestSkills = skillsWithEvidence
    .filter(s => s.estimatedLevel >= 4)
    .sort((a, b) => b.estimatedLevel - a.estimatedLevel || b.evidenceCount - a.evidenceCount)
    .slice(0, 5);

  // Growing: Level 3
  const growingSkills = skillsWithEvidence
    .filter(s => s.estimatedLevel === 3)
    .sort((a, b) => b.evidenceCount - a.evidenceCount)
    .slice(0, 5);

  // Needs Attention: Level 1 or 2 (or with contradiction)
  const needsAttentionSkills = skillsWithEvidence
    .filter(s => s.estimatedLevel <= 2 || s.contradiction != null)
    .sort((a, b) => (b.contradiction ? 1 : 0) - (a.contradiction ? 1 : 0))
    .slice(0, 5);

  const unprovenSkillsCount = skills.filter(s => s.estimatedLevel === 0).length;

  // Proof counts
  const proofSummary = {
    githubVerified: rawSources?.githubVerified || false,
    githubRepoCount: rawSources?.githubRepoCount || 0,
    leetcodeSolvedCount: rawSources?.leetcodeSolvedCount || 0,
    projectsCount: rawSources?.projectsCount || 0,
    assessmentsCount: rawSources?.assessmentsCount || 0,
    interviewsCount: rawSources?.interviewsCount || 0,
    hackathonsCount: rawSources?.hackathonsCount || 0
  };

  const overallCoverage =
    skillsWithEvidence.length >= 8 ? "HIGH" : skillsWithEvidence.length >= 4 ? "MEDIUM" : "LOW";

  const headline = strongestSkills.length >= 3
    ? "You are building a strong technical profile with verified project depth."
    : skillsWithEvidence.length >= 3
    ? "You have a solid technical foundation. Focus on building and assessing core skills."
    : "Start building your Student DNA by importing your resume, projects, or taking a practice session.";

  return {
    userId,
    headline,
    strongestSkills,
    growingSkills,
    needsAttentionSkills,
    unprovenSkillsCount,
    proofSummary,
    overallCoverage,
    generatedAt: new Date().toISOString()
  };
}

export const calculateStudentSkillProfile = buildFullStudentSkillProfile;

/**
 * Detailed "Why?" explainer with proof checkmarks for a specific skill.
 */
export function getExplainableWhyForSkill(
  skill: StudentSkill | undefined,
  evidencePool: DNAEvidence[]
) {
  if (!skill) {
    return {
      skillName: "Skill",
      level: 0,
      levelLabel: "Unknown",
      studentFacingLabel: "Not enough evidence",
      confidence: "LOW",
      evidenceCoverage: "NONE",
      summary: "We need more proof before we can assess this skill.",
      proofChecklist: ["No verified projects or assessments submitted yet."],
      lastDemonstrated: null,
      contradiction: null,
      nextAction: "Complete a practice module or upload a project artifact to verify your proficiency."
    };
  }

  const matching = evidencePool.filter(e => e.skillId === skill.skillId);
  const proofChecklist: string[] = [];

  const projects = matching.filter(e => e.sourceType === "project" || e.sourceType === "github");
  if (projects.length > 0) {
    proofChecklist.push(`${projects.length} project repository/artifact${projects.length > 1 ? "s" : ""} verified`);
  }

  const practical = matching.find(e => e.sourceType === "assessment" || e.sourceType === "practice");
  if (practical) {
    const sc = practical.extractedValue?.score || practical.metadata?.score;
    proofChecklist.push(sc ? `Assessment performance: ${sc}%` : "Verified via Cognalyze practical assessment");
  }

  const interview = matching.find(e => e.sourceType === "interview");
  if (interview) {
    proofChecklist.push("Verified in mock/technical interview session");
  }

  const coding = matching.find(e => e.sourceType === "leetcode" || e.sourceType === "codeforces");
  if (coding) {
    proofChecklist.push("Problem solving consistency verified on external platform");
  }

  const resume = matching.find(e => e.sourceType === "resume");
  if (resume) {
    proofChecklist.push("Mentioned in resume profile");
  }

  if (proofChecklist.length === 0) {
    proofChecklist.push("Self-declared capability without independent verification.");
  }

  return {
    skillName: skill.skillName,
    level: skill.estimatedLevel,
    levelLabel: skill.levelLabel,
    studentFacingLabel: skill.studentFacingLabel,
    confidence: skill.confidence,
    evidenceCoverage: skill.evidenceCoverage,
    summary: skill.whyExplanation,
    proofChecklist,
    lastDemonstrated: skill.lastDemonstratedAt || null,
    contradiction: skill.contradiction || null,
    nextAction: skill.estimatedLevel >= 4
      ? "Level is strong! Maintain freshness with occasional practice."
      : skill.estimatedLevel === 3
      ? "Take an advanced assessment or build a high-complexity project feature to reach Level 4."
      : "Complete a targeted Cognalyze practice session to establish solid practical evidence."
  };
}

