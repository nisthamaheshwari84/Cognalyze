/**
 * lib/dna/gap-engine.ts
 * DETERMINISTIC SKILL GAP INTELLIGENCE & ACTION RECOMMENDATION ENGINE
 * 
 * Rules:
 * 1. UNKNOWN/UNPROVEN is strictly separated from 0 or MET.
 * 2. Deterministic gap calculation:
 *    - current >= target -> MET
 *    - current == 0 -> UNPROVEN ("Not enough evidence yet")
 *    - target - current == 1 -> DEVELOPING
 *    - target - current >= 2 -> GAP
 *    - stale evidence -> STALE
 *    - conflicting evidence -> CONFLICTING
 * 3. Plain English "Focus First" prioritization (Top 3 highest impact).
 * 4. Every gap explains "Why" and provides a direct Cognalyze action recommendation.
 */

import { StudentSkill } from "./profile-engine";
import { RequirementProfile, SkillRequirement } from "./requirement-engine";
import { getCanonicalSkill } from "./taxonomy";

export type GapStatus =
  | "MET"
  | "DEVELOPING"
  | "GAP"
  | "UNPROVEN"
  | "UNKNOWN"
  | "STALE"
  | "CONFLICTING";

export interface SkillGapItem {
  skillId: string;
  skillName: string;
  category: string;
  currentLevel: 0 | 1 | 2 | 3 | 4 | 5;
  currentLevelLabel: string;
  targetLevel: 1 | 2 | 3 | 4 | 5;
  targetLevelLabel: string;
  importance: "MUST_HAVE" | "NICE_TO_HAVE";
  gapStatus: GapStatus;
  gapSize: number;
  confidence: "HIGH" | "MEDIUM" | "LOW";
  evidenceCoverage: "HIGH" | "MEDIUM" | "LOW" | "NONE";
  priorityRank: number;
  whyExplanation: string;
  actionRecommendation: {
    actionType: "PRACTICE" | "ASSESSMENT" | "BUILD_PROJECT" | "INTERVIEW" | "LEARN";
    title: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
  };
}

export interface GapAnalysisReport {
  userId: string;
  targetRoleTitle: string;
  overallReadiness: "Strong Match" | "Developing Match" | "High Skill Gap" | "Needs Verification";
  matchPercentage: number;
  criticalGapsCount: number;
  metRequirementsCount: number;
  unprovenRequirementsCount: number;
  focusFirst: Array<{
    rank: number;
    skillName: string;
    summary: string;
    actionHref: string;
    actionLabel: string;
  }>;
  gaps: SkillGapItem[];
  generatedAt: string;
}

/**
 * Maps a canonical skill to the appropriate Cognalyze interactive practice module.
 */
function getActionForSkill(skillId: string, skillName: string, gapStatus: GapStatus): SkillGapItem["actionRecommendation"] {
  switch (skillId) {
    case "dsa":
      return {
        actionType: "PRACTICE",
        title: "Solve Targeted Algorithmic Problems",
        description: "Practice key data structures (Trees, Graphs, Sliding Window) to reach the required interview proficiency.",
        ctaLabel: "Practice DSA ➔",
        ctaHref: "/student/skills/dsa"
      };
    case "system_design":
      return {
        actionType: "BUILD_PROJECT",
        title: "Design a High-Scale Architecture",
        description: "Draft and test high-concurrency rate limiters and caching topologies in the System Design Studio.",
        ctaLabel: "Open System Design Studio ➔",
        ctaHref: "/student/skills/system-design"
      };
    case "communication":
      return {
        actionType: "PRACTICE",
        title: "Practice Spoken Articulation",
        description: "Complete voice placement drills focusing on concise technical explanation without hesitation.",
        ctaLabel: "Practice Communication ➔",
        ctaHref: "/student/skills/communication"
      };
    case "leadership_ownership":
      return {
        actionType: "INTERVIEW",
        title: "Complete Behavioral Interview Scenarios",
        description: "Practice handling team blockers, failure recovery, and constructive disagreement with Priya Sharma.",
        ctaLabel: "Practice Behavioral ➔",
        ctaHref: "/student/skills/behavioral"
      };
    case "cs_fundamentals":
      return {
        actionType: "INTERVIEW",
        title: "CS Fundamentals Grilling",
        description: "Simulate a 1-on-1 grilling on Operating Systems, Networks, and DBMS concurrency with Lead Architect Alex.",
        ctaLabel: "Practice CS Fundamentals ➔",
        ctaHref: "/student/skills/cs-interview"
      };
    default:
      return {
        actionType: gapStatus === "UNPROVEN" ? "BUILD_PROJECT" : "ASSESSMENT",
        title: `Build & Verify ${skillName}`,
        description: `Create a concrete project artifact or take an assessment to demonstrate ${skillName} capability.`,
        ctaLabel: `Practice ${skillName} ➔`,
        ctaHref: `/student/skills?skill=${skillId}`
      };
  }
}

/**
 * Deterministically computes the skill gap between student's profile and target requirements.
 */
export function computeSkillGaps(
  userId: string,
  studentSkills: StudentSkill[],
  requirementProfile: RequirementProfile
): GapAnalysisReport {
  const studentSkillMap = new Map<string, StudentSkill>();
  for (const s of studentSkills) {
    studentSkillMap.set(s.skillId, s);
  }

  const gapItems: SkillGapItem[] = [];
  let totalRequiredWeight = 0;
  let achievedWeight = 0;
  let metCount = 0;
  let criticalGapCount = 0;
  let unprovenCount = 0;

  for (const req of requirementProfile.requirements) {
    const studentSkill = studentSkillMap.get(req.skillId);
    const weight = req.importance === "MUST_HAVE" ? 2.0 : 1.0;
    totalRequiredWeight += weight;

    // ── CASE 1: UNPROVEN (Student has NO evidence for this required skill) ──
    if (!studentSkill || studentSkill.estimatedLevel === 0) {
      unprovenCount++;
      if (req.importance === "MUST_HAVE") criticalGapCount++;

      gapItems.push({
        skillId: req.skillId,
        skillName: req.skillName,
        category: req.category,
        currentLevel: 0,
        currentLevelLabel: "Unknown",
        targetLevel: req.targetLevel,
        targetLevelLabel: req.targetLevelLabel,
        importance: req.importance,
        gapStatus: "UNPROVEN",
        gapSize: req.targetLevel,
        confidence: "LOW",
        evidenceCoverage: "NONE",
        priorityRank: req.importance === "MUST_HAVE" ? 1 : 3,
        whyExplanation: `This role expects ${req.targetLevelLabel} level in ${req.skillName}, but Cognalyze does not have enough evidence yet to assess your capability.`,
        actionRecommendation: getActionForSkill(req.skillId, req.skillName, "UNPROVEN")
      });
      continue;
    }

    const current = studentSkill.estimatedLevel;
    const target = req.targetLevel;
    const diff = target - current;

    // ── CASE 2: CONTRADICTING EVIDENCE ──
    if (studentSkill.contradiction) {
      criticalGapCount++;
      gapItems.push({
        skillId: req.skillId,
        skillName: req.skillName,
        category: req.category,
        currentLevel: current,
        currentLevelLabel: studentSkill.levelLabel,
        targetLevel: target,
        targetLevelLabel: req.targetLevelLabel,
        importance: req.importance,
        gapStatus: "CONFLICTING",
        gapSize: Math.max(1, diff),
        confidence: "MEDIUM",
        evidenceCoverage: studentSkill.evidenceCoverage,
        priorityRank: 1,
        whyExplanation: studentSkill.contradiction.neutralExplanation,
        actionRecommendation: getActionForSkill(req.skillId, req.skillName, "CONFLICTING")
      });
      achievedWeight += weight * 0.4;
      continue;
    }

    // ── CASE 3: STALE EVIDENCE ──
    if (studentSkill.evidenceList.every(e => e.recency === "STALE")) {
      gapItems.push({
        skillId: req.skillId,
        skillName: req.skillName,
        category: req.category,
        currentLevel: current,
        currentLevelLabel: studentSkill.levelLabel,
        targetLevel: target,
        targetLevelLabel: req.targetLevelLabel,
        importance: req.importance,
        gapStatus: "STALE",
        gapSize: Math.max(1, diff),
        confidence: "LOW",
        evidenceCoverage: studentSkill.evidenceCoverage,
        priorityRank: 2,
        whyExplanation: `You demonstrated ${req.skillName} in the past, but no recent project or assessment activity was observed in the last 12 months.`,
        actionRecommendation: getActionForSkill(req.skillId, req.skillName, "STALE")
      });
      achievedWeight += weight * 0.6;
      continue;
    }

    // ── CASE 4: MET (Candidate meets or exceeds requirement) ──
    if (current >= target) {
      metCount++;
      achievedWeight += weight;
      gapItems.push({
        skillId: req.skillId,
        skillName: req.skillName,
        category: req.category,
        currentLevel: current,
        currentLevelLabel: studentSkill.levelLabel,
        targetLevel: target,
        targetLevelLabel: req.targetLevelLabel,
        importance: req.importance,
        gapStatus: "MET",
        gapSize: 0,
        confidence: studentSkill.confidence,
        evidenceCoverage: studentSkill.evidenceCoverage,
        priorityRank: 4,
        whyExplanation: `Your demonstrated evidence (${studentSkill.levelLabel}) meets the required ${req.targetLevelLabel} level: ${studentSkill.whyExplanation}`,
        actionRecommendation: {
          actionType: "ASSESSMENT",
          title: "Maintain Skill Freshness",
          description: "Your evidence meets expectations for this role. Keep your skills sharp with occasional practice.",
          ctaLabel: "View Evidence ➔",
          ctaHref: `/student/dna?skill=${req.skillId}`
        }
      });
      continue;
    }

    // ── CASE 5: DEVELOPING (Gap of 1 level) ──
    if (diff === 1) {
      achievedWeight += weight * 0.7;
      gapItems.push({
        skillId: req.skillId,
        skillName: req.skillName,
        category: req.category,
        currentLevel: current,
        currentLevelLabel: studentSkill.levelLabel,
        targetLevel: target,
        targetLevelLabel: req.targetLevelLabel,
        importance: req.importance,
        gapStatus: "DEVELOPING",
        gapSize: 1,
        confidence: studentSkill.confidence,
        evidenceCoverage: studentSkill.evidenceCoverage,
        priorityRank: req.importance === "MUST_HAVE" ? 1 : 2,
        whyExplanation: `You have established ${studentSkill.levelLabel} foundation, but this role requires ${req.targetLevelLabel} depth. ${studentSkill.whyExplanation}`,
        actionRecommendation: getActionForSkill(req.skillId, req.skillName, "DEVELOPING")
      });
      continue;
    }

    // ── CASE 6: GAP (Gap >= 2 levels) ──
    criticalGapCount++;
    achievedWeight += weight * 0.3;
    gapItems.push({
      skillId: req.skillId,
      skillName: req.skillName,
      category: req.category,
      currentLevel: current,
      currentLevelLabel: studentSkill.levelLabel,
      targetLevel: target,
      targetLevelLabel: req.targetLevelLabel,
      importance: req.importance,
      gapStatus: "GAP",
      gapSize: diff,
      confidence: studentSkill.confidence,
      evidenceCoverage: studentSkill.evidenceCoverage,
      priorityRank: 1,
      whyExplanation: `Significant gap: The role expects ${req.targetLevelLabel} level, while your current verified evidence shows ${studentSkill.levelLabel}.`,
      actionRecommendation: getActionForSkill(req.skillId, req.skillName, "GAP")
    });
  }

  // Sort gaps by priority: Must-have first, then larger gap size, then unproven
  gapItems.sort((a, b) => {
    if (a.importance !== b.importance) {
      return a.importance === "MUST_HAVE" ? -1 : 1;
    }
    if (a.gapStatus === "MET" && b.gapStatus !== "MET") return 1;
    if (b.gapStatus === "MET" && a.gapStatus !== "MET") return -1;
    return b.gapSize - a.gapSize;
  });

  // Calculate Match Percentage
  const matchPercentage = totalRequiredWeight > 0
    ? Math.round((achievedWeight / totalRequiredWeight) * 100)
    : 0;

  const overallReadiness: GapAnalysisReport["overallReadiness"] =
    matchPercentage >= 80 ? "Strong Match"
    : matchPercentage >= 60 ? "Developing Match"
    : unprovenCount >= 3 ? "Needs Verification"
    : "High Skill Gap";

  // Build Top 3 "Focus First" Action items
  const nonMetItems = gapItems.filter(g => g.gapStatus !== "MET");
  const focusFirst = nonMetItems.slice(0, 3).map((item, idx) => ({
    rank: idx + 1,
    skillName: item.skillName,
    summary: item.whyExplanation,
    actionHref: item.actionRecommendation.ctaHref,
    actionLabel: item.actionRecommendation.ctaLabel
  }));

  return {
    userId,
    targetRoleTitle: requirementProfile.roleTitle,
    overallReadiness,
    matchPercentage,
    criticalGapsCount: criticalGapCount,
    metRequirementsCount: metCount,
    unprovenRequirementsCount: unprovenCount,
    focusFirst,
    gaps: gapItems,
    generatedAt: new Date().toISOString()
  };
}

export type GapReport = GapAnalysisReport;
export function runDeterministicGapAnalysis(
  studentSkills: StudentSkill[],
  requirementProfile: RequirementProfile
): GapAnalysisReport {
  const userId = studentSkills[0]?.userId || "student";
  return computeSkillGaps(userId, studentSkills, requirementProfile);
}
export type PrioritizedGapAction = SkillGapItem["actionRecommendation"];


