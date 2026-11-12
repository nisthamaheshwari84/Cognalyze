/**
 * COGNALYZE CENTRAL PREPARATION ORCHESTRATION AGENT
 *
 * Coordinates 10 specialized sub-agents across a shared Student DNA and Target Opportunity context:
 * 1. StudentIntelligenceAgent
 * 2. OpportunityDiscoveryAgent
 * 3. RepositoryAnalysisAgent
 * 4. SkillGapAgent
 * 5. LearningPlannerAgent
 * 6. AssessmentAgent
 * 7. ProjectArchitectAgent
 * 8. InterviewAgent
 * 9. ProposalReviewerAgent
 * 10. ProgressEvidenceAgent
 *
 * Maintains a traceable execution ledger (inputEvidence, agentDecision, reasoningSummary,
 * recommendedAction, executionStatus, outcome) persisted per user.
 */

import {
  AgentTraceEntry,
  ContributionWorkspaceState,
  DependencyRoadmapNode,
  EightPillarProgress,
  PersistedAssessmentAttempt,
  PersistedInterviewSession,
  PreparationArena,
  RealExperienceResource,
  ReconstructedJourney,
  RoadmapPhase,
  SourceCoverageReport,
  StartingLevel,
  StudentArenaState,
  StudentIntelligenceSnapshot,
} from "./types";
import { getPreparationArenaBySlug } from "./canonical-arenas-registry";
import { preparationsStore, ExtendedPreparationData } from "./arena-store";
import { preparationsPersonalization } from "./personalization-engine";
import {
  getAllOpenSourceRepositories,
  getAllMatchedIssues,
  MatchedContributionIssue,
  OpenSourceRepository,
} from "./open-source-intelligence";
import {
  getAllProjectBlueprints,
  rankProjectsForStudent,
  RankedProjectRecommendation,
} from "./project-intelligence";
import {
  autonomousAssessmentEngine,
  GeneratedAssessmentSession,
} from "./autonomous-assessment-engine";
import { buildStudentIntelligenceSnapshot } from "./student-dna-bridge";
import {
  DiscoveredIssueOpportunity,
  githubDiscoveryEngine,
  GitHubDiscoveryReport,
} from "./github-discovery-engine";
import { buildDependencyRoadmap } from "./roadmap-graph-engine";
import {
  getExperienceResourcesForProgram,
  explainResourceForStudent,
  computeSourceCoverageReport,
} from "./experience-knowledge-base";
import { videoIntelligenceEngine } from "./video-intelligence-engine";
import {
  getReconstructedJourneysForProgram,
  buildPersonalizedPlaybookFromJourneys,
} from "./journey-reconstruction-engine";
import {
  proposalEvaluator,
  ContextualProposalGuidance,
} from "./proposal-evaluator";
import { getStudentIntelligenceProfile } from "@/lib/intelligence/student-intelligence";

export interface DailyCommandTask {
  id: string;
  title: string;
  category: "LEARN" | "PRACTICE" | "PROJECT" | "CONTRIBUTE" | "ASSESS" | "INTERVIEW";
  priority: "HIGH" | "MEDIUM" | "OPTIONAL";
  reasonForRecommendation: string;
  estimatedMinutes: number;
  requiredSkills: string[];
  learningResources: Array<{ title: string; url: string }>;
  completionCriteria: string;
  expectedOutcome: string;
  targetHref: string;
  actionLabel: string;
  completed: boolean;
}

export interface DailyCommandCenterState {
  todayDate: string;
  greeting: string;
  cycleStatusSummary: string;
  whatIsPreventingSelection: string[];
  primaryNextAction: {
    title: string;
    description: string;
    whyRecommended: string;
    targetHref: string;
    actionLabel: string;
    estimatedMinutes: number;
  };
  dailyTasks: DailyCommandTask[];
  nextMilestoneCountdown: string;
  topSkillGaps: string[];
}

export interface OrchestratedArenaContext {
  arena: PreparationArena;
  studentState: StudentArenaState;
  studentDNA: StudentIntelligenceSnapshot;
  activeLevel: StartingLevel;
  commandCenter: DailyCommandCenterState;
  eightPillarProgress: EightPillarProgress;
  dependencyRoadmap: DependencyRoadmapNode[];
  personalizedRoadmap: RoadmapPhase[];
  githubDiscovery: GitHubDiscoveryReport;
  matchedIssues: MatchedContributionIssue[];
  recommendedRepositories: OpenSourceRepository[];
  contributionWorkspaces: ContributionWorkspaceState[];
  rankedProjects: RankedProjectRecommendation[];
  readyMockAssessmentSession: GeneratedAssessmentSession;
  assessmentHistory: PersistedAssessmentAttempt[];
  interviewHistory: PersistedInterviewSession[];
  interviewTrackConfig: {
    track: string;
    company: string;
    role: string;
    directHref: string;
  };
  experienceIntelligence: {
    resources: Array<RealExperienceResource & { whyRecommendedForStudent: string }>;
    reconstructedJourneys: ReconstructedJourney[];
    personalizedPlaybook: ReturnType<typeof buildPersonalizedPlaybookFromJourneys>;
    sourceCoverageReport: SourceCoverageReport;
  };
  proposalGuidance: ContextualProposalGuidance;
  agentTraceLedger: AgentTraceEntry[];
}

export class PreparationOrchestrator {
  private static instance: PreparationOrchestrator;

  private constructor() {}

  public static getInstance(): PreparationOrchestrator {
    if (!PreparationOrchestrator.instance) {
      PreparationOrchestrator.instance = new PreparationOrchestrator();
    }
    return PreparationOrchestrator.instance;
  }

  /**
   * Asynchronous live-capable orchestrator for production API routes.
   */
  public async orchestrateArenaAsync(
    candidateId: string,
    arenaId: string,
    options: { allowNetwork?: boolean; isAuthenticated?: boolean } = {}
  ): Promise<OrchestratedArenaContext | null> {
    const arena = getPreparationArenaBySlug(arenaId);
    if (!arena) return null;

    const allowNetwork = options.allowNetwork ?? true;
    const studentState = preparationsStore.getOrCreateState(candidateId, arena.id);
    const extendedData = preparationsStore.getOrCreateExtendedData(candidateId, arena.id);
    const traces: AgentTraceEntry[] = [];
    const nowIso = new Date().toISOString();

    // Agent 1: StudentIntelligenceAgent
    const studentDNA = await buildStudentIntelligenceSnapshot(candidateId, arena, {
      isAuthenticated: options.isAuthenticated,
    });
    traces.push({
      id: `tr-dna-${Date.now()}`,
      agentName: "StudentIntelligenceAgent",
      timestamp: nowIso,
      inputEvidence: `${studentDNA.verifiedSkills.length} verified, ${studentDNA.demonstratedSkills.length} demonstrated, ${studentDNA.inferredOrClaimedSkills.length} claimed skills`,
      agentDecision: `Calibrated Student DNA profile (${studentDNA.confidenceAndFreshness.confidence})`,
      reasoningSummary: `Separated independently verified competencies from resume claims and unassessed gaps.`,
      recommendedAction: studentDNA.identifiedSkillGaps[0] ? `Address gap in ${studentDNA.identifiedSkillGaps[0].skill}` : "Proceed to assessment verification",
      executionStatus: "executed",
      outcome: `${studentDNA.identifiedSkillGaps.length} gaps identified`,
    });

    // Agent 2: OpportunityDiscoveryAgent (Cycle & Real Experience Verification)
    const rawResources = getExperienceResourcesForProgram(arena.slug);
    const enrichedResources = await videoIntelligenceEngine.enrichVideoResources(rawResources, {
      allowNetwork,
    });
    const experienceResourcesWithRationale = enrichedResources.map(r => ({
      ...r,
      whyRecommendedForStudent: explainResourceForStudent(r, studentDNA),
    }));
    const sourceCoverageReport = computeSourceCoverageReport();

    // Agent 3: RepositoryAnalysisAgent (Live GitHub REST API or Cached/Catalog)
    const githubDiscovery = await githubDiscoveryEngine.discoverOpportunitiesForStudent(studentDNA, {
      allowNetwork,
      limit: 80,
    });
    traces.push({
      id: `tr-oss-${Date.now() + 1}`,
      agentName: "RepositoryAnalysisAgent",
      timestamp: nowIso,
      inputEvidence: `Languages: ${studentDNA.programmingLanguages.join(", ") || "General"}, Mode: ${githubDiscovery.sourceMode}`,
      agentDecision: `Ranked ${githubDiscovery.totalDiscovered} open issues across ${githubDiscovery.repositoriesAnalyzed} repositories`,
      reasoningSummary: githubDiscovery.warning || `Verified live open issue statuses and filtered closed items.`,
      recommendedAction: githubDiscovery.opportunities[0] ? `Inspect ${githubDiscovery.opportunities[0].repository} #${githubDiscovery.opportunities[0].issueNumber}` : "Review curated repos",
      executionStatus: githubDiscovery.sourceMode === "curated_catalog_fallback" ? "fallback_used" : "executed",
      outcome: `${githubDiscovery.totalDiscovered} active opportunities`,
    });

    return this.assembleOrchestratedContext({
      arena,
      studentState,
      extendedData,
      studentDNA,
      githubDiscovery,
      experienceResourcesWithRationale,
      sourceCoverageReport,
      traces,
    });
  }

  /**
   * Synchronous deterministic orchestrator for fast in-memory / test execution.
   */
  public orchestrateArena(candidateId: string, arenaId: string): OrchestratedArenaContext | null {
    const arena = getPreparationArenaBySlug(arenaId);
    if (!arena) return null;

    const studentState = preparationsStore.getOrCreateState(candidateId, arena.id);
    const extendedData = preparationsStore.getOrCreateExtendedData(candidateId, arena.id);

    let intelProfile: ReturnType<typeof getStudentIntelligenceProfile> | null = null;
    try {
      intelProfile = getStudentIntelligenceProfile(candidateId);
    } catch {}

    const verifiedSkills: StudentIntelligenceSnapshot["verifiedSkills"] = [];
    const demonstratedSkills: StudentIntelligenceSnapshot["demonstratedSkills"] = [];
    const claimedSkills: StudentIntelligenceSnapshot["inferredOrClaimedSkills"] = [];
    const langs = new Set<string>();

    if (intelProfile?.capabilities) {
      for (const cap of Object.values(intelProfile.capabilities)) {
        if (!cap.name) continue;
        if (["python", "javascript", "typescript", "c++", "java", "go", "rust", "sql"].includes(cap.name.toLowerCase())) {
          langs.add(cap.name);
        }
        if (cap.evidenceLevel >= 3) {
          verifiedSkills.push({ skill: cap.name, evidenceCount: cap.evidenceIds?.length || 1, sourceTypes: ["intelligence"] });
        } else if (cap.evidenceLevel === 2) {
          demonstratedSkills.push({ skill: cap.name, evidenceCount: cap.evidenceIds?.length || 1, sourceTypes: ["intelligence"] });
        } else if (cap.evidenceLevel === 1) {
          claimedSkills.push({ skill: cap.name, sourceTypes: ["resume"] });
        }
      }
    }

    const gaps: StudentIntelligenceSnapshot["identifiedSkillGaps"] = arena.requiredSkills
      .filter(req => !verifiedSkills.some(v => req.skill.toLowerCase().includes(v.skill.toLowerCase())))
      .map(req => ({
        skill: req.skill,
        importance: req.isMustHave ? "core" : "important",
        reason: "Not yet independently verified in Student DNA.",
      }));

    const studentDNA: StudentIntelligenceSnapshot = {
      candidateId,
      isAuthenticated: true,
      verifiedSkills,
      demonstratedSkills,
      inferredOrClaimedSkills: claimedSkills,
      projects: [],
      githubConnected: false,
      githubRepos: [],
      externalPRs: [],
      programmingLanguages: Array.from(langs),
      identifiedSkillGaps: gaps,
      evidenceCoverage: {
        requiredCount: arena.requiredSkills.length,
        verifiedCount: arena.requiredSkills.length - gaps.length,
        demonstratedCount: demonstratedSkills.length,
        claimedOnlyCount: claimedSkills.length,
        missingCount: gaps.length,
      },
      confidenceAndFreshness: {
        confidence: verifiedSkills.length >= 2 ? "MEDIUM" : "LOW",
        lastSyncedAt: new Date().toISOString(),
      },
    };

    const curatedIssues = getAllMatchedIssues();
    const curatedRepos = getAllOpenSourceRepositories();
    const syncDiscovery: GitHubDiscoveryReport = {
      discoveredAt: new Date().toISOString(),
      sourceMode: "curated_catalog_fallback",
      totalDiscovered: curatedIssues.length,
      repositoriesAnalyzed: curatedRepos.length,
      opportunities: curatedIssues.map(ci => ({
        id: ci.id,
        organization: ci.repoFullName.split("/")[0],
        repository: ci.repoFullName,
        repoUrl: `https://github.com/${ci.repoFullName}`,
        title: ci.title,
        issueUrl: ci.issueUrl,
        issueNumber: ci.issueNumber,
        openStatus: "unverified_offline",
        lastVerifiedAt: new Date().toISOString(),
        verificationSource: "curated_catalog",
        classification: "Good First Issue",
        requiredSkills: ci.requiredSkills,
        difficulty: ci.difficulty,
        estimatedEffort: "2–4 hours",
        repoHealth: { stars: "10k+", activityStatus: "Active High-Velocity" },
        compatibility: {
          languageMatch: ci.requiredSkills.slice(0, 1),
          frameworkMatch: [],
          missingPrerequisites: ci.requiredSkills.slice(1),
          repositoryFamiliarity: "New Ecosystem",
          complexityFit: ci.difficulty === "Beginner" ? "Good Entry Point" : "Appropriate Stretch",
          maintainerActivitySignal: "Active open-source ecosystem",
          explainableReasons: [ci.whyMatchesDNA],
        },
        suggestedFirstSteps: ci.suggestedApproach,
        testRequirements: ci.testRequirements,
        contributionWorkspacePlan: [],
        rankScore: 50,
      })),
    };

    const rawResources = getExperienceResourcesForProgram(arena.slug).map(r => ({
      ...r,
      whyRecommendedForStudent: explainResourceForStudent(r, studentDNA),
    }));

    return this.assembleOrchestratedContext({
      arena,
      studentState,
      extendedData,
      studentDNA,
      githubDiscovery: syncDiscovery,
      experienceResourcesWithRationale: rawResources,
      sourceCoverageReport: computeSourceCoverageReport(),
      traces: [],
    });
  }

  private assembleOrchestratedContext(params: {
    arena: PreparationArena;
    studentState: StudentArenaState;
    extendedData: ExtendedPreparationData;
    studentDNA: StudentIntelligenceSnapshot;
    githubDiscovery: GitHubDiscoveryReport;
    experienceResourcesWithRationale: Array<RealExperienceResource & { whyRecommendedForStudent: string }>;
    sourceCoverageReport: SourceCoverageReport;
    traces: AgentTraceEntry[];
  }): OrchestratedArenaContext {
    const {
      arena,
      studentState,
      extendedData,
      studentDNA,
      githubDiscovery,
      experienceResourcesWithRationale,
      sourceCoverageReport,
      traces,
    } = params;

    const verifiedSkillNames = studentDNA.verifiedSkills.map(v => v.skill);
    const missingSkillNames = studentDNA.identifiedSkillGaps.map(g => g.skill);
    const activeLevel: StartingLevel =
      studentState.selectedLevel ||
      preparationsPersonalization.evaluateSkillMatch(arena, {
        candidateId: studentDNA.candidateId,
        verifiedSkills: verifiedSkillNames,
        projects: studentDNA.projects.map(p => p.title),
        targetRoles: [],
      }).recommendedStartingLevel;

    const personalizedRoadmap = preparationsPersonalization.generatePersonalizedRoadmap(
      arena,
      activeLevel,
      verifiedSkillNames
    );

    // Agent 5: LearningPlannerAgent (Dependency DAG)
    const dependencyRoadmap = buildDependencyRoadmap({
      arena,
      dna: studentDNA,
      arenaState: studentState,
      discoveredIssues: githubDiscovery.opportunities,
      storedNodeStates: extendedData.roadmapNodeStates,
    });

    // Agent 7: ProjectArchitectAgent
    const allBlueprints = getAllProjectBlueprints();
    const rankedProjects = rankProjectsForStudent(allBlueprints, verifiedSkillNames, arena.id);

    // Agent 6: AssessmentAgent
    const readyMockSession = autonomousAssessmentEngine.generateAutonomousAssessment(
      arena.id,
      activeLevel,
      verifiedSkillNames,
      missingSkillNames,
      studentDNA.programmingLanguages
    );

    // Agent 9: ProposalReviewerAgent
    const workspacesList = Object.values(extendedData.contributionWorkspaces);
    const proposalGuidance = proposalEvaluator.buildContextualGuidance(arena, studentDNA, workspacesList);

    // Experience Journeys & Playbook
    const reconstructedJourneys = getReconstructedJourneysForProgram(arena.slug);
    const personalizedPlaybook = buildPersonalizedPlaybookFromJourneys(arena.slug, studentDNA);

    // Agent 10: ProgressEvidenceAgent (8-Pillar Breakdown, Zero Unexplained Scores)
    const verifiedNodesCount = dependencyRoadmap.filter(n => n.masteryState === "independently_verified").length;
    const completedNodesCount = dependencyRoadmap.filter(
      n => n.masteryState === "demonstrated" || n.masteryState === "independently_verified"
    ).length;
    const verifiedPRs = workspacesList.filter(
      w => w.prVerificationStatus === "verified_open" || w.prVerificationStatus === "verified_merged"
    );
    const latestAssessment = extendedData.assessmentHistory[0];
    const passedAssessments = extendedData.assessmentHistory.filter(a => a.verdict !== "NEEDS_REMEDIATION");
    const latestInterview = extendedData.interviewHistory[0];
    const draftWords = studentState.proposalDraft ? studentState.proposalDraft.trim().split(/\s+/).filter(Boolean).length : 0;

    const blockingFactors: string[] = [];
    if (missingSkillNames.length > 0) blockingFactors.push(`Unverified skills: ${missingSkillNames.slice(0, 3).join(", ")}`);
    if (passedAssessments.length === 0) blockingFactors.push("No passed autonomous assessment yet");
    if (arena.category === "OPEN_SOURCE" && verifiedPRs.length === 0) blockingFactors.push("No verified GitHub Pull Request submitted yet");
    if (draftWords < 100 && arena.category === "OPEN_SOURCE") blockingFactors.push("Proposal draft incomplete (< 100 words)");

    let readinessStatus: EightPillarProgress["applicationReadiness"]["status"] = "Early Foundation";
    if (blockingFactors.length === 0) readinessStatus = "Submission Ready";
    else if (passedAssessments.length > 0 && completedNodesCount >= 2) readinessStatus = "Interview & Contribution Ready";
    else if (verifiedSkillNames.length > 0 || completedNodesCount >= 1) readinessStatus = "Building Evidence";

    const eightPillarProgress: EightPillarProgress = {
      learning: {
        completedNodes: completedNodesCount,
        totalNodes: dependencyRoadmap.length,
        verifiedNodes: verifiedNodesCount,
        summary: `${verifiedNodesCount} verified / ${dependencyRoadmap.length} roadmap stages`,
      },
      projects: {
        activeCount: extendedData.activeProjectIds.length,
        completedCount: studentState.submittedProjectIds.length,
        verifiedCount: studentDNA.projects.filter(p => p.verified).length,
        summary: `${extendedData.activeProjectIds.length} active blueprint(s)`,
      },
      repositoryUnderstanding: {
        inspectedRepos: extendedData.inspectedRepoNames.length,
        summary: `${extendedData.inspectedRepoNames.length} repositories analyzed`,
      },
      contributions: {
        activeWorkspaces: workspacesList.length,
        verifiedPRsCount: verifiedPRs.length,
        summary: `${verifiedPRs.length} GitHub-verified PR(s) (${workspacesList.length} active workspace)`,
      },
      assessments: {
        attemptsCount: extendedData.assessmentHistory.length,
        passedCount: passedAssessments.length,
        latestScorePct: latestAssessment?.percentage,
        summary: latestAssessment ? `Latest: ${latestAssessment.percentage}% (${passedAssessments.length} passed)` : "Not attempted yet",
      },
      interviews: {
        sessionsCount: extendedData.interviewHistory.length,
        latestVerdict: latestInterview?.finalReport?.overallVerdict,
        summary: latestInterview?.finalReport?.overallVerdict || `${extendedData.interviewHistory.length} session(s)`,
      },
      proposalDevelopment: {
        hasDraft: draftWords > 0,
        wordCount: draftWords,
        aiRubricScore: studentState.proposalEvaluation?.overallScore,
        summary: draftWords > 0 ? `${draftWords} words (AI Rubric: ${studentState.proposalEvaluation?.overallScore ?? "Unreviewed"})` : "Draft not started",
      },
      applicationReadiness: {
        status: readinessStatus,
        blockingFactors,
      },
    };

    // Build Dynamic Today's Execution Plan from next unblocked node + real open issue + assessment
    const nextUnblockedNode =
      dependencyRoadmap.find(
        n => n.masteryState !== "independently_verified" && n.masteryState !== "demonstrated" && !n.isBlockedByPrerequisites
      ) || dependencyRoadmap[0];

    const topIssue = githubDiscovery.opportunities[0];
    const dailyTasks: DailyCommandTask[] = [
      {
        id: nextUnblockedNode.id,
        title: nextUnblockedNode.title,
        category: "LEARN",
        priority: "HIGH",
        reasonForRecommendation: missingSkillNames[0]
          ? `Addresses core Student DNA gap in ${missingSkillNames[0]}.`
          : `Unblocked milestone in your ${arena.shortName} dependency roadmap.`,
        estimatedMinutes: nextUnblockedNode.practicalExercises[0]?.estimatedMinutes || 60,
        requiredSkills: [nextUnblockedNode.expectedCompetency],
        learningResources: nextUnblockedNode.recommendedResources.map(r => ({ title: r.title, url: r.url })),
        completionCriteria: nextUnblockedNode.verificationCriteria,
        expectedOutcome: `Verify ${nextUnblockedNode.expectedCompetency} in Student DNA`,
        targetHref: nextUnblockedNode.practicalExercises[0]?.targetHref || `/student/skills/preparations/${arena.slug}?tab=roadmap`,
        actionLabel: nextUnblockedNode.practicalExercises[0]?.label || "Open Roadmap Stage",
        completed: nextUnblockedNode.masteryState === "independently_verified" || nextUnblockedNode.masteryState === "demonstrated",
      },
      ...(topIssue
        ? [
            {
              id: `daily-oss-${topIssue.id}`,
              title: `Analyze ${topIssue.repository} #${topIssue.issueNumber}: ${topIssue.title.slice(0, 52)}`,
              category: "CONTRIBUTE" as const,
              priority: arena.category === "OPEN_SOURCE" ? ("HIGH" as const) : ("MEDIUM" as const),
              reasonForRecommendation: topIssue.compatibility.explainableReasons[0] || "Real open issue matched to your stack.",
              estimatedMinutes: 60,
              requiredSkills: topIssue.requiredSkills.slice(0, 3),
              learningResources: [{ title: `GitHub Issue #${topIssue.issueNumber}`, url: topIssue.issueUrl }],
              completionCriteria: "Fork repo, reproduce locally, write regression test, verify PR URL via GitHub.",
              expectedOutcome: `Demonstrated contribution workflow on ${topIssue.repository}`,
              targetHref: `/student/skills/preparations/${arena.slug}?tab=opensource`,
              actionLabel: "Open Contribution Workspace",
              completed: verifiedPRs.some(w => w.issueId === topIssue.id),
            },
          ]
        : []),
      {
        id: "daily-autonomous-assess",
        title: `Run Personalized ${arena.shortName} Assessment`,
        category: "ASSESS",
        priority: passedAssessments.length === 0 ? "HIGH" : "MEDIUM",
        reasonForRecommendation: "Single-click adaptive check calibrated strictly to your weak concepts without manual setup.",
        estimatedMinutes: 30,
        requiredSkills: missingSkillNames.slice(0, 2),
        learningResources: experienceResourcesWithRationale.slice(0, 1).map(r => ({ title: r.title, url: r.url })),
        completionCriteria: "Score >= 70% to verify competency into Student DNA.",
        expectedOutcome: "Detailed concept report + automatic DNA evidence sync",
        targetHref: `/student/skills/preparations/${arena.slug}?tab=mock_assessment`,
        actionLabel: "START MY PERSONALIZED ASSESSMENT",
        completed: passedAssessments.length > 0,
      },
    ];

    const topTask = dailyTasks.find(t => !t.completed) || dailyTasks[0];
    const deadlineDate = new Date(arena.applicationDeadline);
    const deadlineFormatted = isNaN(deadlineDate.getTime()) ? arena.eventOrProgramDates : deadlineDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    const commandCenter: DailyCommandCenterState = {
      todayDate: new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" }),
      greeting: `Target: ${arena.shortName} • Readiness Stage: ${readinessStatus}`,
      cycleStatusSummary:
        arena.dateVerificationStatus === "estimated_from_previous_cycle"
          ? `Planning Estimate (${arena.cycleYear || 2027} Cycle Unannounced — Reference Window: ${deadlineFormatted})`
          : arena.dateVerificationStatus === "rolling"
          ? `Rolling Hiring Window (${arena.eventOrProgramDates})`
          : `Verified Official Window: ${deadlineFormatted}`,
      whatIsPreventingSelection: blockingFactors.length > 0 ? blockingFactors : ["All prerequisite evidence checks satisfied — finalize and submit!"],
      primaryNextAction: {
        title: topTask.title,
        description: topTask.completionCriteria,
        whyRecommended: topTask.reasonForRecommendation,
        targetHref: topTask.targetHref,
        actionLabel: topTask.actionLabel,
        estimatedMinutes: topTask.estimatedMinutes,
      },
      dailyTasks,
      nextMilestoneCountdown: `${arena.dateVerificationStatus === "estimated_from_previous_cycle" ? "Estimated Target" : "Target Window"}: ${deadlineFormatted}`,
      topSkillGaps: missingSkillNames.slice(0, 4),
    };

    // Persist new orchestrator traces cleanly
    if (traces.length > 0) {
      traces.push({
        id: `tr-plan-${Date.now() + 2}`,
        agentName: "LearningPlannerAgent",
        timestamp: new Date().toISOString(),
        inputEvidence: `${dependencyRoadmap.length} DAG nodes; next unblocked: ${nextUnblockedNode.title}`,
        agentDecision: `Prioritized '${topTask.title}' as Primary Next Action`,
        reasoningSummary: topTask.reasonForRecommendation,
        recommendedAction: topTask.actionLabel,
        executionStatus: "executed",
        outcome: `${readinessStatus}`,
      });
      preparationsStore.appendAgentTraces(studentDNA.candidateId, arena.id, traces);
    }

    const latestLedger = preparationsStore.getOrCreateExtendedData(studentDNA.candidateId, arena.id).agentTraceLedger;

    let interviewTrack = "traditional_coding_dsa";
    if (arena.category === "OPEN_SOURCE") interviewTrack = "code_comprehension";
    else if (arena.category === "COMPANY_HACKATHON") interviewTrack = "system_design";

    return {
      arena,
      studentState,
      studentDNA,
      activeLevel,
      commandCenter,
      eightPillarProgress,
      dependencyRoadmap,
      personalizedRoadmap,
      githubDiscovery,
      matchedIssues: getAllMatchedIssues(),
      recommendedRepositories: getAllOpenSourceRepositories().slice(0, 10),
      contributionWorkspaces: workspacesList,
      rankedProjects,
      readyMockAssessmentSession: readyMockSession,
      assessmentHistory: extendedData.assessmentHistory,
      interviewHistory: extendedData.interviewHistory,
      interviewTrackConfig: {
        track: interviewTrack,
        company: arena.companyOrOrg,
        role: arena.shortName,
        directHref: `/student/practice-interview?track=${interviewTrack}&company=${encodeURIComponent(arena.companyOrOrg)}&role=${encodeURIComponent(arena.shortName)}`,
      },
      experienceIntelligence: {
        resources: experienceResourcesWithRationale,
        reconstructedJourneys,
        personalizedPlaybook,
        sourceCoverageReport,
      },
      proposalGuidance,
      agentTraceLedger: latestLedger,
    };
  }
}

export const preparationOrchestrator = PreparationOrchestrator.getInstance();
