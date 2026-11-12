/**
 * COGNALYZE JOURNEY RECONSTRUCTION & EXPERIENCE-TO-EXECUTION ENGINE
 *
 * Converts official program guidance and documented contributor pathways into
 * structured execution timelines and executable Cognalyze arena mappings.
 *
 * Strictly marks undisclosed attributes as "[Not disclosed in source]" and
 * clearly distinguishes documented pathways from AI-synthesized study tracks.
 */

import {
  ReconstructedJourney,
  StudentIntelligenceSnapshot,
} from "./types";
import { resolveKBProgramId } from "./experience-knowledge-base";

export const DOCUMENTED_JOURNEYS: ReconstructedJourney[] = [
  {
    id: "journey-gsoc-oss-pathway",
    programId: "gsoc",
    programYear: 2026,
    candidateLabel: "Google Official GSoC Contributor Composite Pathway (Derived from Official Student Guide)",
    sourceResourceIds: ["exp-gsoc-official-guide", "exp-oss-guide-contribute"],
    trustClassification: "Official primary source",
    startingSkillLevel: "Intermediate in at least one target repository language; Beginner in large OSS navigation",
    startingPoint: "Exploring 2-3 archived GSoC organizations 8-12 weeks prior to application window opening",
    preparationDuration: "10–14 Weeks Pre-Application + 12–22 Weeks Coding",
    learningResourcesUsed: [
      "Google GSoC Official Student Guide",
      "GitHub Open Source Contributing Guides",
      "Organization README, CONTRIBUTING.md & issue trackers"
    ],
    projectsBuilt: ["Minimal standalone proof-of-concept reproducing organization project idea"],
    contributionsMade: ["1–3 verified bug fixes, documentation clarifications, or unit test PRs to establish maintainer rapport"],
    assessmentsAndRounds: [
      "Local build + test suite setup verification",
      "Community discussion on mailing list / Zulip",
      "Technical Project Proposal review with mentor feedback cycles"
    ],
    outcome: "[Official reference pathway — selection depends on organization slots, proposal feasibility & prior PRs]",
    lessonsLearned: [
      "Do not wait for organization list announcement to practice Git, debugging, and reading unfamiliar codebases.",
      "Share an early draft proposal with mentors at least 2 weeks before portal deadline so technical gaps get caught early."
    ],
    mappedCognalyzeActions: [
      { skill: "Multi-File Codebase Tracing", arenaHref: "/student/skills/code-comprehension", label: "Trace Code in Code Comprehension Arena" },
      { skill: "Python / Data Stack", arenaHref: "/student/skills/ai-data?tab=coding-arena&subject=subj_python", label: "Verify Python Execution in Sandbox" }
    ]
  },
  {
    id: "journey-flipkart-concurrency-pathway",
    programId: "flipkart-grid",
    programYear: 2026,
    candidateLabel: "Flipkart E-Commerce Systems Pathway (Derived from Flipkart Tech Blog & Unstop Track Docs)",
    sourceResourceIds: ["exp-flipkart-tech-blog", "exp-flipkart-unstop-portal"],
    trustClassification: "Official primary source",
    startingSkillLevel: "[Not disclosed in source — recommended Medium DSA + SQL/OS core]",
    startingPoint: "Pairing 2-3 teammates covering backend systems, frontend UX, and algorithmic problem solving",
    preparationDuration: "4–8 Weeks Focused Sprint",
    learningResourcesUsed: ["Flipkart Tech Blog concurrency architectures", "Unstop Software Development Track rules"],
    projectsBuilt: ["Flash-sale / logistics prototype proving atomicity and zero oversell invariants"],
    contributionsMade: ["[Not applicable — hackathon team prototype]"],
    assessmentsAndRounds: [
      "Level 1: 60-minute timed CS Core MCQs + 2 DSA Coding problems",
      "Level 2: Architecture Concept Note + Working Prototype Demo",
      "Level 3: Grand Finale Engineering Defense & PPI Technical Interviews"
    ],
    outcome: "[Official competition structure benchmark — advancing teams evaluated by engineering panels]",
    lessonsLearned: [
      "High Level-1 accuracy in OS/DBMS locks & graph algorithms keeps teams alive before Level 2 ever begins.",
      "Demonstrate working database transactions and concurrency benchmarks rather than mock UI dashboards."
    ],
    mappedCognalyzeActions: [
      { skill: "Graphs, DP & Greedy Scheduling", arenaHref: "/student/skills/dsa", label: "Practice Timed DSA Drills" },
      { skill: "OS Concurrency & DBMS Isolation", arenaHref: "/student/skills/cs-interview", label: "Drill CS Core Fundamentals" }
    ]
  },
  {
    id: "journey-amazon-sde-pathway",
    programId: "amazon-hackon",
    programYear: 2026,
    candidateLabel: "Amazon Builders' Reliability & LP Pathway (Derived from AWS Builders' Library & LP Docs)",
    sourceResourceIds: ["exp-amazon-lp-official", "exp-amazon-builders-library"],
    trustClassification: "Official primary source",
    startingSkillLevel: "[Not disclosed in source — requires core DSA + REST API familiarity]",
    startingPoint: "Aligning customer problem statement directly with Amazon Leadership Principles before writing code",
    preparationDuration: "4–6 Weeks",
    learningResourcesUsed: ["Amazon Leadership Principles", "AWS Builders' Library (Timeouts, Retries & Idempotency)"],
    projectsBuilt: ["Idempotent order / commerce service with backoff & queue decoupling"],
    contributionsMade: ["[Not applicable — innovation challenge & coding OA]"],
    assessmentsAndRounds: [
      "Ideation Architecture Deck",
      "Coding + Debugging Assessment",
      "Technical & Behavioral Leadership Principle Interviews"
    ],
    outcome: "[Official evaluation pillar benchmark]",
    lessonsLearned: [
      "Always pair feature architecture with concrete failure handling (idempotency keys, dead-letter queues, retry jitter).",
      "Frame behavioral examples using quantifiable individual ownership ('I built/measured') rather than vague group statements."
    ],
    mappedCognalyzeActions: [
      { skill: "Idempotent System Design", arenaHref: "/student/skills/system-design", label: "Design Resilient Architectures" },
      { skill: "STAR + Leadership Principles", arenaHref: "/student/skills/behavioral", label: "Practice Behavioral Prompts" }
    ]
  },
  {
    id: "journey-google-swe-pathway",
    programId: "google-swe-prep",
    programYear: 2025,
    candidateLabel: "Google SWE Algorithmic & Communication Pathway (Google Tech Dev Guide)",
    sourceResourceIds: ["exp-google-tech-dev-guide"],
    trustClassification: "Official primary source",
    startingSkillLevel: "[Not disclosed in source]",
    startingPoint: "Mastering core data structures before transitioning into mock timed coding without IDE autocomplete",
    preparationDuration: "10–14 Weeks",
    learningResourcesUsed: ["Google Tech Dev Guide", "Code tracing & complexity verification drills"],
    projectsBuilt: ["High-throughput rate limiter or prefix-tree engine with clean unit tests"],
    contributionsMade: ["[Optional — OSS PRs strengthen resume screening]"],
    assessmentsAndRounds: [
      "Google Online Challenge (GOC)",
      "45-Minute Technical Coding Interviews (Algorithmic + Edge Case Testing)",
      "Googleyness & Leadership Behavioral Round"
    ],
    outcome: "[Official Google interview rubric benchmark]",
    lessonsLearned: [
      "Clarify constraints (empty inputs, duplicates, cyclic graphs) explicitly before writing line 1 of code.",
      "Dry-run small counterexamples aloud on paper/comment block to prove correctness before interviewer hints."
    ],
    mappedCognalyzeActions: [
      { skill: "Graphs, Trees & Dynamic Programming", arenaHref: "/student/skills/dsa", label: "Solve Medium/Hard Algorithms" },
      { skill: "Dry-Run Debugging", arenaHref: "/student/skills/code-comprehension", label: "Trace Bugs & Complexity" }
    ]
  }
];

export function getReconstructedJourneysForProgram(arenaSlugOrId: string): ReconstructedJourney[] {
  const progId = resolveKBProgramId(arenaSlugOrId);
  const matched = DOCUMENTED_JOURNEYS.filter(j => j.programId === progId);
  return matched.length > 0 ? matched : DOCUMENTED_JOURNEYS.slice(0, 2);
}

/**
 * Generates an actionable, DNA-calibrated Study Playbook linking real-world guidance
 * to Cognalyze execution arenas.
 */
export function buildPersonalizedPlaybookFromJourneys(
  arenaSlugOrId: string,
  dna: StudentIntelligenceSnapshot
): {
  strategySummary: string;
  adaptationReason: string;
  actionMappings: Array<{
    step: number;
    realWorldInsight: string;
    provenance: string;
    requiredSkill: string;
    cognalyzeActionLabel: string;
    targetHref: string;
  }>;
} {
  const journeys = getReconstructedJourneysForProgram(arenaSlugOrId);
  const primary = journeys[0];
  const hasVerifiedBaseline = dna.verifiedSkills.length >= 2;

  const adaptationReason = hasVerifiedBaseline
    ? `Your Student DNA shows ${dna.verifiedSkills.length} verified skills (${dna.verifiedSkills.map(v => v.skill).slice(0, 3).join(", ")}). Accelerating past entry setup into project architecture, live contributions, and timed simulation.`
    : `Your Student DNA currently has ${dna.verifiedSkills.length} verified skills and ${dna.identifiedSkillGaps.length} gaps. Starting with verified practical drills and codebase comprehension before high-stakes applications.`;

  const actionMappings = primary.mappedCognalyzeActions.map((act, idx) => ({
    step: idx + 1,
    realWorldInsight: primary.lessonsLearned[idx] || primary.lessonsLearned[0],
    provenance: `${primary.candidateLabel} (${primary.trustClassification})`,
    requiredSkill: act.skill,
    cognalyzeActionLabel: act.label,
    targetHref: act.arenaHref,
  }));

  return {
    strategySummary: primary.startingPoint,
    adaptationReason,
    actionMappings,
  };
}

