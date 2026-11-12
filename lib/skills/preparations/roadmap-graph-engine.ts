/**
 * COGNALYZE DYNAMIC DEPENDENCY-GRAPH LEARNING ROADMAP ENGINE
 *
 * Replaces static phased checklists with a Student-DNA-personalized
 * dependency graph (DAG) with 5 distinct mastery states:
 * 1. not_started
 * 2. learning (opened / studying resources — NEVER triggers mastery completion)
 * 3. practiced (attempted sandbox drill / task without passing threshold yet)
 * 4. demonstrated (project submission / code artifact observed)
 * 5. independently_verified (passed hidden sandbox test / verified GitHub PR / autonomous assessment)
 */

import {
  DependencyRoadmapNode,
  PreparationArena,
  RoadmapNodeMasteryState,
  StudentArenaState,
  StudentIntelligenceSnapshot,
} from "./types";
import { getExperienceResourcesForProgram } from "./experience-knowledge-base";
import { DiscoveredIssueOpportunity } from "./github-discovery-engine";

export function computeNodeMasteryState(
  nodeId: string,
  expectedCompetency: string,
  dna: StudentIntelligenceSnapshot,
  arenaState: StudentArenaState,
  nodeStates?: Record<string, RoadmapNodeMasteryState>
): { state: RoadmapNodeMasteryState; evidence: string[] } {
  const compLower = expectedCompetency.toLowerCase();
  const evidence: string[] = [];

  // 1. Check independent verification in canonical Student DNA
  const verifiedHit = dna.verifiedSkills.find(v => {
    const s = v.skill.toLowerCase();
    return compLower.includes(s) || s.includes(compLower) ||
      compLower.split(/[\s/,&-]+/).some(tok => tok.length > 3 && s.includes(tok));
  });
  if (verifiedHit) {
    evidence.push(`Student DNA Verified (${verifiedHit.sourceTypes.join(", ")})`);
    return { state: "independently_verified", evidence };
  }

  // 2. Check demonstrated code/project evidence
  const demoHit = dna.demonstratedSkills.find(d => {
    const s = d.skill.toLowerCase();
    return compLower.includes(s) || s.includes(compLower);
  });
  if (demoHit) {
    evidence.push(`Code / Project Demonstrated (${demoHit.sourceTypes.join(", ")})`);
    return { state: "demonstrated", evidence };
  }

  // 3. Check persisted node state (excluding opening/learning alone from claiming demonstrated)
  const stored = nodeStates?.[nodeId];
  if (stored === "independently_verified" && arenaState.evidenceCount > 0) {
    evidence.push("Verified in Preparation Assessment / PR Check");
    return { state: "independently_verified", evidence };
  }
  if (stored === "demonstrated" || arenaState.completedTaskIds.includes(nodeId)) {
    evidence.push("Completed Milestone Artifact");
    return { state: "demonstrated", evidence };
  }
  if (stored === "practiced") {
    evidence.push("Sandbox practice started");
    return { state: "practiced", evidence };
  }
  if (stored === "learning") {
    evidence.push("Study resources opened (awaiting practice verification)");
    return { state: "learning", evidence };
  }

  return { state: "not_started", evidence: [] };
}

export function buildDependencyRoadmap(params: {
  arena: PreparationArena;
  dna: StudentIntelligenceSnapshot;
  arenaState: StudentArenaState;
  discoveredIssues?: DiscoveredIssueOpportunity[];
  storedNodeStates?: Record<string, RoadmapNodeMasteryState>;
}): DependencyRoadmapNode[] {
  const { arena, dna, arenaState, discoveredIssues = [], storedNodeStates } = params;
  const kbResources = getExperienceResourcesForProgram(arena.slug);
  const topIssue = discoveredIssues[0];
  const primaryProject = arena.projects[0];

  const isOpenSource = arena.category === "OPEN_SOURCE";

  // Build foundation -> core -> specialization -> verification DAG tailored to Student DNA gaps
  const gapSkills = dna.identifiedSkillGaps.map(g => g.skill);
  const prioritySkill1 = gapSkills[0] || arena.requiredSkills[0]?.skill || "Core Language & Syntax";
  const prioritySkill2 = gapSkills[1] || arena.requiredSkills[1]?.skill || "System Architecture & Problem Solving";

  const rawNodes: Array<Omit<DependencyRoadmapNode, "masteryState" | "evidenceSources" | "isBlockedByPrerequisites">> = [
    {
      id: `${arena.id}-node-1-foundation`,
      phaseNumber: 1,
      title: isOpenSource
        ? `Foundation & ${prioritySkill1} Verification`
        : `Core Foundations: ${prioritySkill1}`,
      learningObjective: isOpenSource
        ? `Establish reproducible local build/test setup and verify ${prioritySkill1} without syntax or tooling guesswork.`
        : `Eliminate baseline gaps in ${prioritySkill1} verified through timed execution in Cognalyze coding sandboxes.`,
      prerequisiteNodeIds: [],
      recommendedResources: kbResources.slice(0, 2).map(r => ({
        title: r.title,
        url: r.url,
        resourceType: r.resourceType === "youtube_video" ? "video_insight" : "official_docs",
        provenanceNote: `${r.trustClassification} (${r.programYear})`,
      })),
      practicalExercises: [
        {
          label: arena.phases[arenaState.selectedLevel]?.[0]?.tasks?.[0]?.actionLabel || "Practice Core Drills",
          targetHref: arena.phases[arenaState.selectedLevel]?.[0]?.tasks?.[0]?.targetHref || "/student/skills/dsa",
          estimatedMinutes: 60,
        },
      ],
      relevantRepoOrProject: topIssue ? `${topIssue.repository} (#${topIssue.issueNumber})` : (primaryProject?.title || arena.shortName),
      expectedCompetency: prioritySkill1,
      verificationCriteria: "Pass automated sandbox test cases or verify baseline skill inside Student DNA.",
    },
    {
      id: `${arena.id}-node-2-comprehension`,
      phaseNumber: 2,
      title: isOpenSource
        ? "Codebase Tracing & Target Repository Architecture"
        : `Deep Problem Solving: ${prioritySkill2}`,
      learningObjective: isOpenSource
        ? `Map call graphs, locate bug entry points, and understand module boundaries across an active open-source repository.`
        : `Master ${prioritySkill2} under realistic constraints matching ${arena.shortName} screening rounds.`,
      prerequisiteNodeIds: [`${arena.id}-node-1-foundation`],
      recommendedResources: [
        ...kbResources.slice(1, 3).map(r => ({
          title: r.title,
          url: r.url,
          resourceType: (r.resourceType === "youtube_video" ? "video_insight" : "written_experience") as "video_insight" | "written_experience",
          provenanceNote: r.trustClassification,
        })),
        {
          title: "Cognalyze Code Comprehension Studio",
          url: "/student/skills/code-comprehension",
          resourceType: "cognalyze_arena",
          provenanceNote: "Interactive Cognalyze Execution Arena",
        },
      ],
      practicalExercises: [
        {
          label: isOpenSource ? "Trace Execution in Code Comprehension" : "Solve Timed DSA / Systems Drills",
          targetHref: isOpenSource ? "/student/skills/code-comprehension" : "/student/skills/dsa",
          estimatedMinutes: 75,
        },
      ],
      relevantRepoOrProject: topIssue ? topIssue.repository : (primaryProject?.title || "Core Systems Track"),
      expectedCompetency: prioritySkill2,
      verificationCriteria: isOpenSource
        ? "Complete diagnostic tracing & reproduce target issue locally."
        : "Achieve >= 75% accuracy across timed problems in arena.",
    },
    {
      id: `${arena.id}-node-3-build`,
      phaseNumber: 3,
      title: isOpenSource
        ? "Real Issue Execution, Unit Tests & Pull Request"
        : `Architecture Build: ${primaryProject?.title || "Capstone MVP"}`,
      learningObjective: isOpenSource
        ? `Author a failing regression test, implement a minimal fix, and verify PR submission against GitHub REST API.`
        : `Implement core system components with automated tests, database isolation, and verified latency/failure safeguards.`,
      prerequisiteNodeIds: [`${arena.id}-node-2-comprehension`],
      recommendedResources: [
        {
          title: isOpenSource && topIssue ? `Issue #${topIssue.issueNumber}: ${topIssue.title}` : `${primaryProject?.title || "Project"} Blueprint`,
          url: isOpenSource && topIssue ? topIssue.issueUrl : `/student/skills/preparations/${arena.slug}?tab=projects`,
          resourceType: "official_docs",
          provenanceNote: isOpenSource ? "Target Issue Specification" : "Cognalyze Architecture Blueprint",
        },
      ],
      practicalExercises: [
        {
          label: isOpenSource ? "Launch Contribution Workspace" : "Open Ranked Project Studio",
          targetHref: `/student/skills/preparations/${arena.slug}?tab=${isOpenSource ? "opensource" : "projects"}`,
          estimatedMinutes: 120,
        },
      ],
      relevantRepoOrProject: isOpenSource && topIssue ? topIssue.repository : (primaryProject?.title || arena.shortName),
      expectedCompetency: arena.requiredSkills[2]?.skill || "Automated Testing & System Implementation",
      verificationCriteria: isOpenSource
        ? "Verified open or merged Pull Request URL confirmed via GitHub API."
        : "Working demo meeting all architectural acceptance criteria.",
    },
    {
      id: `${arena.id}-node-4-assess`,
      phaseNumber: 4,
      title: `Autonomous Assessment & Technical Interview Defense (${arena.shortName})`,
      learningObjective: "Validate end-to-end readiness under adaptive assessment and conversational technical follow-up probing.",
      prerequisiteNodeIds: [`${arena.id}-node-3-build`],
      recommendedResources: [
        {
          title: `${arena.shortName} Official Selection Guidelines`,
          url: arena.officialUrl,
          resourceType: "official_docs",
          provenanceNote: "Official Primary Source",
        },
      ],
      practicalExercises: [
        {
          label: "Start Personalized Assessment",
          targetHref: `/student/skills/preparations/${arena.slug}?tab=mock_assessment`,
          estimatedMinutes: 45,
        },
        {
          label: "Run AI Technical Interview",
          targetHref: `/student/skills/preparations/${arena.slug}?tab=interview`,
          estimatedMinutes: 30,
        },
      ],
      relevantRepoOrProject: `${arena.shortName} Evaluation Cycle`,
      expectedCompetency: "Technical Defense & Selection Readiness",
      verificationCriteria: "Pass Autonomous Assessment (>= 70%) and complete Conversational Interview evaluation.",
    },
    {
      id: `${arena.id}-node-5-submit`,
      phaseNumber: 5,
      title: arena.category === "OPEN_SOURCE"
        ? "Organization-Aware Proposal & Application Verification"
        : "Submission Audit & Final Application",
      learningObjective: "Synthesize verified PRs, projects, milestones, and risk mitigations into an organization-aligned submission.",
      prerequisiteNodeIds: [`${arena.id}-node-4-assess`],
      recommendedResources: kbResources
        .filter(r => r.preparationStage === "Proposal & Application")
        .map(r => ({
          title: r.title,
          url: r.url,
          resourceType: "official_docs" as const,
          provenanceNote: r.trustClassification,
        })),
      practicalExercises: [
        {
          label: "Open Proposal & Application Intelligence",
          targetHref: `/student/skills/preparations/${arena.slug}?tab=proposal`,
          estimatedMinutes: 60,
        },
      ],
      relevantRepoOrProject: arena.title,
      expectedCompetency: "Technical Proposal Writing & Completeness",
      verificationCriteria: "Proposal rubric audit >= 80/100 with zero missing required sections.",
    },
  ];

  // Resolve mastery state + prerequisite blocking across nodes
  const stateMap = new Map<string, RoadmapNodeMasteryState>();
  const resolvedNodes: DependencyRoadmapNode[] = rawNodes.map(raw => {
    const { state, evidence } = computeNodeMasteryState(
      raw.id,
      raw.expectedCompetency,
      dna,
      arenaState,
      storedNodeStates
    );
    stateMap.set(raw.id, state);

    const isBlocked = raw.prerequisiteNodeIds.some(preId => {
      const preState = stateMap.get(preId);
      return preState !== "demonstrated" && preState !== "independently_verified";
    });

    return {
      ...raw,
      masteryState: state,
      evidenceSources: evidence,
      isBlockedByPrerequisites: isBlocked,
    };
  });

  return resolvedNodes;
}

