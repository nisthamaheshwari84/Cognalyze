/**
 * COGNALYZE PREPARATIONS PERSONALIZATION ENGINE
 * 
 * Computes:
 * 1. Evidence-based requirement coverage against verified Student DNA.
 * 2. Personalized multi-phase roadmaps adjusted to student level and demonstrated skills.
 * 3. Cross-Opportunity optimization across multiple concurrent target programs.
 */

import {
  PreparationArena,
  RoadmapPhase,
  StartingLevel,
  CrossOpportunityOptimization,
  ArenaTask
} from "./types";
import {
  CANONICAL_PREPARATION_ARENAS,
  getPreparationArenaBySlug,
} from "./canonical-arenas-registry";

export interface StudentSkillEvidence {
  skillName: string;
  level: "Beginner" | "Intermediate" | "Advanced" | "Expert";
  evidenceSource?: string;
}

export interface StudentProfileContext {
  candidateId: string;
  fullName?: string;
  verifiedSkills: string[];
  projects: string[];
  targetRoles: string[];
  academicYear?: number;
}

export class PreparationsPersonalizationEngine {
  private static instance: PreparationsPersonalizationEngine;

  private constructor() {}

  public static getInstance(): PreparationsPersonalizationEngine {
    if (!PreparationsPersonalizationEngine.instance) {
      PreparationsPersonalizationEngine.instance = new PreparationsPersonalizationEngine();
    }
    return PreparationsPersonalizationEngine.instance;
  }

  /**
   * Evaluates student profile against an arena's required skills
   */
  public evaluateSkillMatch(
    arena: PreparationArena,
    profile?: StudentProfileContext | null
  ): {
    evidenceCoveragePercentage: number;
    alreadyDemonstratedSkills: string[];
    missingSkills: string[];
    recommendedStartingLevel: StartingLevel;
  } {
    const verifiedSet = new Set(
      (profile?.verifiedSkills || []).map(s => s.toLowerCase().trim())
    );

    const alreadyDemonstrated: string[] = [];
    const missing: string[] = [];

    for (const req of arena.requiredSkills) {
      const reqLower = req.skill.toLowerCase();
      const isDemonstrated = Array.from(verifiedSet).some(
        v => reqLower.includes(v) || v.includes(reqLower)
      );

      if (isDemonstrated) {
        alreadyDemonstrated.push(req.skill);
      } else {
        missing.push(req.skill);
      }
    }

    const totalReqs = arena.requiredSkills.length || 1;
    const coverage = Math.round((alreadyDemonstrated.length / totalReqs) * 100);

    // Recommend starting level based on demonstrated skills
    let recommendedLevel: StartingLevel = "absolute_beginner";
    if (coverage >= 75) {
      recommendedLevel = "advanced";
    } else if (coverage >= 40) {
      recommendedLevel = "intermediate";
    } else if (coverage >= 15) {
      recommendedLevel = "beginner";
    }

    return {
      evidenceCoveragePercentage: coverage,
      alreadyDemonstratedSkills: alreadyDemonstrated,
      missingSkills: missing,
      recommendedStartingLevel: recommendedLevel,
    };
  }

  /**
   * Generates a tailored roadmap based on student starting level & verified skills
   */
  public generatePersonalizedRoadmap(
    arena: PreparationArena,
    level: StartingLevel,
    verifiedSkills: string[] = []
  ): RoadmapPhase[] {
    const verifiedLower = new Set(verifiedSkills.map(s => s.toLowerCase()));
    const rawPhases = arena.phases[level] || arena.phases.beginner || [];

    // For intermediate and advanced students, filter out tasks that are already 100% demonstrated
    if (level === "intermediate" || level === "advanced") {
      return rawPhases.map(phase => {
        const filteredTasks = phase.tasks.filter(task => {
          // If task outcomes are already demonstrated, it can be marked optional or skipped
          const allOutcomesDemonstrated = task.learningOutcomes.every(outcome =>
            Array.from(verifiedLower).some(v => outcome.toLowerCase().includes(v))
          );
          // Always keep at least 1 core task per phase
          return !allOutcomesDemonstrated;
        });

        return {
          ...phase,
          tasks: filteredTasks.length > 0 ? filteredTasks : phase.tasks,
        };
      });
    }

    return rawPhases;
  }

  /**
   * Multi-Opportunity Optimizer:
   * When targeting 2 or more opportunities, extracts common foundations and
   * builds a shared syllabus without duplicate effort.
   */
  public optimizeMultipleTargets(arenaIds: string[]): CrossOpportunityOptimization {
    const resolvedMap = new Map<string, (typeof CANONICAL_PREPARATION_ARENAS)[number]>();
    for (const id of arenaIds) {
      const found = getPreparationArenaBySlug(id);
      if (found) resolvedMap.set(found.id, found);
    }
    const selectedArenas = Array.from(resolvedMap.values());

    if (selectedArenas.length === 0) {
      return {
        targetArenas: [],
        sharedFoundations: [],
        arenaUniqueRequirements: [],
        estimatedTotalWeeks: 0,
        timeSavingsWeeks: 0,
        weeklyBalancedSchedule: [],
      };
    }

    // Canonical concept groups to detect semantic skill overlap
    const CANONICAL_FOUNDATIONS = [
      { name: "Git & Collaborative GitHub Workflow", keywords: ["git", "github", "pr", "collaborative"], link: "/student/skills/code-comprehension" },
      { name: "Python / Core Programming Stack", keywords: ["python"], link: "/student/skills/ai-data?tab=coding-arena&subject=subj_python" },
      { name: "Data Structures & Algorithmic Speed (DSA)", keywords: ["data structures", "algorithms", "dsa", "graphs", "trees", "dp"], link: "/student/skills/dsa" },
      { name: "Relational SQL & Query Foundations", keywords: ["sql", "database", "dbms", "rdbms", "indexing"], link: "/student/skills/ai-data?tab=coding-arena&subject=subj_sql" },
      { name: "System Design & Concurrency Mechanics", keywords: ["concurrency", "locking", "system design", "distributed", "caching", "architecture"], link: "/student/skills/system-design" },
      { name: "Automated Unit Testing & CI/CD", keywords: ["test", "testing", "pytest", "ci/cd"], link: "/student/skills/code-comprehension" },
    ];

    const sharedFoundations: CrossOpportunityOptimization["sharedFoundations"] = [];

    for (const foundation of CANONICAL_FOUNDATIONS) {
      const matchingArenas = selectedArenas.filter(arena =>
        arena.requiredSkills.some(req =>
          foundation.keywords.some(kw => req.skill.toLowerCase().includes(kw))
        )
      );

      if (matchingArenas.length >= 2) {
        sharedFoundations.push({
          skill: foundation.name,
          commonToAll: matchingArenas.length === selectedArenas.length,
          applicableArenas: matchingArenas.map(a => a.shortName),
          recommendedArenaLink: foundation.link,
        });
      }
    }

    const arenaUniqueRequirements = selectedArenas.map(arena => {
      // Skills not covered by any shared foundation
      const uniqueSkills = arena.requiredSkills
        .filter(req =>
          !sharedFoundations.some(sf =>
            sf.applicableArenas.includes(arena.shortName) &&
            CANONICAL_FOUNDATIONS.find(f => f.name === sf.skill)?.keywords.some(kw => req.skill.toLowerCase().includes(kw))
          )
        )
        .map(r => r.skill);

      return {
        arenaId: arena.id,
        uniqueSkills: uniqueSkills.length > 0 ? uniqueSkills : [arena.requiredSkills[0].skill],
        uniqueProjects: (arena.projects || []).map(p => p.title),
      };
    });

    // Estimate weeks & time savings
    const singleSumWeeks = selectedArenas.length * 8;
    const timeSavingsWeeks = Math.max(2, Math.floor(sharedFoundations.length * 1.5));
    const estimatedTotalWeeks = Math.max(6, singleSumWeeks - timeSavingsWeeks);

    // Build balanced schedule
    const weeklySchedule: CrossOpportunityOptimization["weeklyBalancedSchedule"] = [
      {
        weekNumber: 1,
        focus: "Shared Technical Foundation: Git, Terminal & Core Language Syntax",
        sharedTasks: ["Set up local Docker & Git workflow", "Core language data structures (Python / Java / C++)"],
        opportunityTasks: selectedArenas.map(a => ({ arenaId: a.id, task: `Audit official guidelines for ${a.shortName}` })),
      },
      {
        weekNumber: 2,
        focus: "Algorithmic Speed & Common Data Structures",
        sharedTasks: ["Arrays, Two-Pointers, Hash Maps in DSA Arena", "SQL Joins and Window Functions"],
        opportunityTasks: selectedArenas.map(a => ({ arenaId: a.id, task: `Solve 1 mock OA question for ${a.shortName}` })),
      },
      {
        weekNumber: 3,
        focus: "Domain Divergence: Specific Systems & Core Projects",
        sharedTasks: ["System Design & REST API Idempotency"],
        opportunityTasks: selectedArenas.map(a => ({
          arenaId: a.id,
          task: `Milestone 1 for project in ${a.shortName}`,
        })),
      },
      {
        weekNumber: 4,
        focus: "Full Prototype Completion & Final Submissions",
        sharedTasks: ["End-to-End Testing & Docker Compose Setup"],
        opportunityTasks: selectedArenas.map(a => ({
          arenaId: a.id,
          task: `Submit final proposal / pitch deck for ${a.shortName}`,
        })),
      },
    ];

    return {
      targetArenas: selectedArenas.map(a => ({
        arenaId: a.id,
        title: a.title,
        company: a.companyOrOrg,
        deadline: a.applicationDeadline,
      })),
      sharedFoundations,
      arenaUniqueRequirements,
      estimatedTotalWeeks,
      timeSavingsWeeks,
      weeklyBalancedSchedule: weeklySchedule,
    };
  }
}

export const preparationsPersonalization = PreparationsPersonalizationEngine.getInstance();
