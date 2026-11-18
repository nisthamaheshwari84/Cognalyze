/**
 * COGNALYZE INTERVIEW SYSTEM — ADAPTIVE INTERVIEW BLUEPRINT SERVICE
 * 
 * Designs a balanced, multi-competency interview blueprint covering Categories A through K.
 * Enforces strict question budgeting and anti-tunnel-vision controls to ensure a candidate
 * is evaluated across the complete landscape without getting trapped in a single topic.
 */

import { StructuredJDIntelligence, JDCompetency } from "./jd-intelligence-service";
import { ResumeContextSnapshot, ExtractedProject } from "./resume-context-service";

export type BlueprintCategoryCode =
  | "CAT_A_RESUME_PROJECTS"
  | "CAT_B_DSA_PROBLEM_SOLVING"
  | "CAT_C_SYSTEM_DESIGN"
  | "CAT_D_CS_FUNDAMENTALS"
  | "CAT_E_LANGUAGE_RUNTIME"
  | "CAT_F_TESTING_EDGE_CASES"
  | "CAT_G_DEBUGGING_OBSERVABILITY"
  | "CAT_H_API_CONTRACTS"
  | "CAT_I_SECURITY_AUTH"
  | "CAT_J_DEVOPS_CICD"
  | "CAT_K_BEHAVIORAL_OWNERSHIP";

export interface BlueprintCategoryPlan {
  code: BlueprintCategoryCode;
  name: string;
  categoryLetter: "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K";
  allocatedTurnBudget: number; // Max turns Alex is permitted to spend here
  minTurns: number;
  targetCompetencies: string[];
  evaluationFocus: string;
  rationale: string;
}

export interface StructuredInterviewBlueprint {
  sessionId: string;
  totalTargetTurns: number;
  maxTurnsPerProject: number; // Anti-tunnel-vision: default 2 turns max
  maxTurnsPerCompetency: number; // Anti-tunnel-vision: default 2 turns max
  categories: BlueprintCategoryPlan[];
  primaryProjectToExplore?: ExtractedProject;
  secondaryProjectToExplore?: ExtractedProject;
  orderedCategorySequence: BlueprintCategoryCode[];
}

/**
 * Creates an Adaptive Structured Interview Blueprint balanced across Categories A through K.
 */
export function generateAdaptiveInterviewBlueprint(
  sessionId: string,
  jdIntelligence: StructuredJDIntelligence,
  resumeSnapshot?: ResumeContextSnapshot,
  totalTargetTurns: number = 12
): StructuredInterviewBlueprint {
  const resumeProjects = resumeSnapshot?.projects || [];
  const primaryProject = resumeProjects[0];
  const secondaryProject = resumeProjects[1];

  const categories: BlueprintCategoryPlan[] = [];

  // Category A: Resume Project Deep Dive
  categories.push({
    code: "CAT_A_RESUME_PROJECTS",
    name: "Resume Project Deep Dive (Architecture & Ownership)",
    categoryLetter: "A",
    allocatedTurnBudget: 3, // At most 3 turns across all projects
    minTurns: 1,
    targetCompetencies: [
      primaryProject ? `Project Architecture: ${primaryProject.name}` : "System Implementation",
      "Individual Technical Ownership",
      "Architectural Trade-offs",
    ],
    evaluationFocus: "Personal contribution, architecture choices, real constraints solved.",
    rationale: "Verify candidate's authentic execution versus passive participation or inflated claims.",
  });

  // Category B: Data Structures & Algorithms
  categories.push({
    code: "CAT_B_DSA_PROBLEM_SOLVING",
    name: "Data Structures & Algorithmic Problem Solving",
    categoryLetter: "B",
    allocatedTurnBudget: 2,
    minTurns: 1,
    targetCompetencies: ["Data Structures & Algorithms", "Time & Space Complexity"],
    evaluationFocus: "Algorithmic thinking, complexity trade-offs, optimization.",
    rationale: "Core problem-solving foundation required by role.",
  });

  // Category C: System Design & Scalability
  categories.push({
    code: "CAT_C_SYSTEM_DESIGN",
    name: "System Design & Distributed Scalability",
    categoryLetter: "C",
    allocatedTurnBudget: 2,
    minTurns: 1,
    targetCompetencies: ["System Design & Architecture", "Database Partitioning & Caching"],
    evaluationFocus: "Scale bottlenecks, caching invalidation, fault-tolerance.",
    rationale: "Assess ability to reason about production scale and latency boundaries.",
  });

  // Category D: Core Computer Science Fundamentals
  categories.push({
    code: "CAT_D_CS_FUNDAMENTALS",
    name: "Computer Science Fundamentals (OS, Concurrency & DB)",
    categoryLetter: "D",
    allocatedTurnBudget: 2,
    minTurns: 1,
    targetCompetencies: ["Concurrency & Multithreading", "Database Transactions & Isolation Levels"],
    evaluationFocus: "Locks, isolation levels, thread safety, index mechanisms.",
    rationale: "Ensure foundational engineering concepts are solid.",
  });

  // Category E: Language & Framework Mechanics
  categories.push({
    code: "CAT_E_LANGUAGE_RUNTIME",
    name: "Language Runtime & Framework Mechanics",
    categoryLetter: "E",
    allocatedTurnBudget: 2,
    minTurns: 1,
    targetCompetencies: ["Runtime Memory Management", "Event Loop & Async I/O"],
    evaluationFocus: "Memory leaks, garbage collection, event loop blocking.",
    rationale: "Deep command of the runtime environment.",
  });

  // Category F: Testing, Quality & Edge Case Handling
  categories.push({
    code: "CAT_F_TESTING_EDGE_CASES",
    name: "Automated Testing, Quality & Edge Cases",
    categoryLetter: "F",
    allocatedTurnBudget: 1,
    minTurns: 0,
    targetCompetencies: ["Automated Testing & Edge Cases"],
    evaluationFocus: "Unit/integration testing strategy, defensive assertions.",
    rationale: "Engineering rigor and defect prevention.",
  });

  // Category G: Debugging & Observability
  categories.push({
    code: "CAT_G_DEBUGGING_OBSERVABILITY",
    name: "Production Incident Debugging & Observability",
    categoryLetter: "G",
    allocatedTurnBudget: 1,
    minTurns: 0,
    targetCompetencies: ["Production Incident Debugging & Observability"],
    evaluationFocus: "Triage process, log analysis, CPU/memory profiling.",
    rationale: "Hands-on incident resolution capabilities.",
  });

  // Category K: Behavioral & Ownership
  categories.push({
    code: "CAT_K_BEHAVIORAL_OWNERSHIP",
    name: "Behavioral, Ownership & Engineering Integrity",
    categoryLetter: "K",
    allocatedTurnBudget: 1,
    minTurns: 1,
    targetCompetencies: ["Engineering Ownership & Collaboration"],
    evaluationFocus: "Handling disagreement, admitting gaps, mentoring others.",
    rationale: "Professional maturity and team impact.",
  });

  // Sequence to follow during the interview
  const orderedCategorySequence: BlueprintCategoryCode[] = [
    "CAT_A_RESUME_PROJECTS",
    "CAT_D_CS_FUNDAMENTALS",
    "CAT_B_DSA_PROBLEM_SOLVING",
    "CAT_C_SYSTEM_DESIGN",
    "CAT_E_LANGUAGE_RUNTIME",
    "CAT_G_DEBUGGING_OBSERVABILITY",
    "CAT_K_BEHAVIORAL_OWNERSHIP",
  ];

  return {
    sessionId,
    totalTargetTurns,
    maxTurnsPerProject: 2, // Maximum 2 turns probing any single project
    maxTurnsPerCompetency: 2, // Maximum 2 turns probing any single competency
    categories,
    primaryProjectToExplore: primaryProject,
    secondaryProjectToExplore: secondaryProject,
    orderedCategorySequence,
  };
}

