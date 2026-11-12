/**
 * COGNALYZE AUTONOMOUS TECHNICAL INTERVIEW STUDIO
 *
 * Contextual multi-turn conversational interviewer driven by Student DNA,
 * target organization requirements, active projects, and contribution workspaces.
 *
 * Evaluates across 4 pillars:
 * 1. Technical Correctness (0-10)
 * 2. Reasoning Quality (0-10)
 * 3. Communication Clarity (0-10)
 * 4. Technical Depth (0-10)
 */

import {
  InterviewModeType,
  InterviewTurn,
  PersistedInterviewSession,
  PreparationArena,
  StudentIntelligenceSnapshot,
} from "./types";
import { getLLMProvider } from "@/lib/llm/llm-provider";
import { preparationsStore } from "./arena-store";
import { recordVerifiedPreparationEvidence } from "./student-dna-bridge";

const MAX_INTERVIEW_TURNS = 4;

export class AutonomousInterviewStudioEngine {
  private static instance: AutonomousInterviewStudioEngine;

  private constructor() {}

  public static getInstance(): AutonomousInterviewStudioEngine {
    if (!AutonomousInterviewStudioEngine.instance) {
      AutonomousInterviewStudioEngine.instance = new AutonomousInterviewStudioEngine();
    }
    return AutonomousInterviewStudioEngine.instance;
  }

  /**
   * Starts a personalized multi-turn interview grounded in Student DNA & target opportunity.
   */
  public async startInterviewSession(params: {
    candidateId: string;
    arena: PreparationArena;
    dna: StudentIntelligenceSnapshot;
    mode: InterviewModeType;
  }): Promise<PersistedInterviewSession> {
    const { candidateId, arena, dna, mode } = params;
    const ext = preparationsStore.getOrCreateExtendedData(candidateId, arena.id);
    const activeWorkspace = Object.values(ext.contributionWorkspaces)[0];
    const studentProj = dna.projects[0]?.title || arena.projects[0]?.title;
    const targetContextSummary = `${arena.shortName} (${arena.companyOrOrg}) | Focus: ${mode.replace(/_/g, " ")} | Artifact: ${
      activeWorkspace ? `${activeWorkspace.repoFullName} #${activeWorkspace.issueNumber}` : studentProj
    }`;

    const openingQuestion = await this.generateQuestion({
      arena,
      dna,
      mode,
      turnNumber: 1,
      previousTurns: [],
      artifactLabel: activeWorkspace
        ? `${activeWorkspace.repoFullName} (#${activeWorkspace.issueNumber}: ${activeWorkspace.issueTitle})`
        : studentProj,
    });

    const session: PersistedInterviewSession = {
      sessionId: `int-${arena.id}-${Date.now()}`,
      arenaId: arena.id,
      candidateId,
      mode,
      targetContextSummary,
      status: "active",
      turns: [
        {
          turnNumber: 1,
          interviewerQuestion: openingQuestion.question,
          focusCompetency: openingQuestion.competency,
          timestamp: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    preparationsStore.saveInterviewSession(candidateId, arena.id, session);
    return session;
  }

  /**
   * Evaluates student's turn response and generates a contextual follow-up or final report.
   */
  public async submitInterviewTurn(params: {
    candidateId: string;
    arena: PreparationArena;
    dna: StudentIntelligenceSnapshot;
    sessionId: string;
    studentResponse: string;
  }): Promise<PersistedInterviewSession> {
    const { candidateId, arena, dna, sessionId, studentResponse } = params;
    const session = preparationsStore.getInterviewSession(candidateId, arena.id, sessionId);
    if (!session) {
      throw new Error("Interview session not found for this candidate.");
    }
    if (session.status === "completed") {
      return session;
    }

    const currentTurn = session.turns[session.turns.length - 1];
    if (!currentTurn) {
      throw new Error("Malformed interview session with no active turn.");
    }

    currentTurn.studentResponse = studentResponse;
    currentTurn.evaluation = await this.evaluateTurnResponse(
      currentTurn.interviewerQuestion,
      currentTurn.focusCompetency,
      studentResponse,
      arena
    );

    if (session.turns.length >= MAX_INTERVIEW_TURNS) {
      session.status = "completed";
      session.finalReport = this.compileFinalReport(session.turns, arena);
      session.updatedAt = new Date().toISOString();
      preparationsStore.saveInterviewSession(candidateId, arena.id, session);

      // Record interview evidence into Student DNA
      const avgCorrectness = session.finalReport.averages.technicalCorrectness * 10;
      await recordVerifiedPreparationEvidence({
        candidateId,
        skillName: session.turns[0]?.focusCompetency || arena.requiredSkills[0]?.skill || arena.shortName,
        sourceType: "interview",
        sourceId: session.sessionId,
        claim: `Completed ${arena.shortName} ${session.mode.replace(/_/g, " ")} interview (${session.finalReport.overallVerdict})`,
        scorePct: Math.round(avgCorrectness),
        arenaShortName: arena.shortName,
        companyOrOrg: arena.companyOrOrg,
      });

      return session;
    }

    // Generate contextual follow-up probing what the student just explained
    const nextQ = await this.generateQuestion({
      arena,
      dna,
      mode: session.mode,
      turnNumber: session.turns.length + 1,
      previousTurns: session.turns,
      artifactLabel: session.targetContextSummary,
    });

    session.turns.push({
      turnNumber: session.turns.length + 1,
      interviewerQuestion: nextQ.question,
      focusCompetency: nextQ.competency,
      timestamp: new Date().toISOString(),
    });
    session.updatedAt = new Date().toISOString();

    preparationsStore.saveInterviewSession(candidateId, arena.id, session);
    return session;
  }

  private async generateQuestion(params: {
    arena: PreparationArena;
    dna: StudentIntelligenceSnapshot;
    mode: InterviewModeType;
    turnNumber: number;
    previousTurns: InterviewTurn[];
    artifactLabel: string;
  }): Promise<{ question: string; competency: string }> {
    const { arena, dna, mode, turnNumber, previousTurns, artifactLabel } = params;
    const lastTurn = previousTurns[previousTurns.length - 1];
    const verifiedList = dna.verifiedSkills.map(v => v.skill).slice(0, 4).join(", ") || "None verified yet";
    const gapList = dna.identifiedSkillGaps.map(g => g.skill).slice(0, 3).join(", ") || "Architecture & Testing";

    try {
      const llm = getLLMProvider();
      if (await llm.isAvailable()) {
        const transcript = previousTurns
          .map(t => `Q${t.turnNumber}: ${t.interviewerQuestion}\nCandidate: ${t.studentResponse || ""}`)
          .join("\n\n");

        const res = await llm.generateStructured<{ question: string; competency: string }>(
          [
            {
              role: "system",
              content: `You are a Principal Engineer conducting a ${mode.replace(/_/g, " ")} interview for ${arena.companyOrOrg} (${arena.shortName}). Ask concrete, non-generic technical follow-up questions that probe edge cases, failure modes, and reasoning.`,
            },
            {
              role: "user",
              content: `Candidate DNA verified skills: ${verifiedList}\nSkill gaps: ${gapList}\nContext/Artifact: ${artifactLabel}\nTurn ${turnNumber} of ${MAX_INTERVIEW_TURNS}.\nPrevious conversation:\n${transcript || "(Opening turn)"}\n\nReturn JSON: {"question": "...", "competency": "..."}`,
            },
          ],
          undefined,
          { timeoutMs: 8000, maxTokens: 450 }
        );
        if (res?.question && res.question.length > 15) {
          return {
            question: res.question,
            competency: res.competency || arena.requiredSkills[0]?.skill || "Technical Reasoning",
          };
        }
      }
    } catch {
      // Deterministic contextual fallback below
    }

    // Contextual deterministic probing grounded in mode, Student DNA & last student response
    if (turnNumber > 1 && lastTurn?.studentResponse) {
      const respLower = lastTurn.studentResponse.toLowerCase();
      if (respLower.includes("cache") || respLower.includes("redis")) {
        return {
          competency: "Cache Invalidation & Consistency",
          question: `You mentioned caching/Redis in your previous explanation. Walk me through what happens if Redis restarts cleanly or drops a write mid-transaction — how do you prevent stale reads or double execution?`,
        };
      }
      if (respLower.includes("test") || respLower.includes("mock")) {
        return {
          competency: "Test Isolation & CI Determinism",
          question: `Regarding your testing strategy: how do you ensure your mocks do not mask real protocol or schema breaking changes when the upstream dependency updates?`,
        };
      }
      if (lastTurn.studentResponse.trim().length < 40) {
        return {
          competency: lastTurn.focusCompetency,
          question: `Let's dig deeper into "${lastTurn.focusCompetency}": can you provide specific data structures, failure modes, and concrete complexity trade-offs rather than a brief summary?`,
        };
      }
      return {
        competency: arena.requiredSkills[turnNumber % Math.max(1, arena.requiredSkills.length)]?.skill || "Failure Mode Analysis",
        question: `Building on your approach for ${artifactLabel}: suppose throughput increases 20x overnight or an upstream timeout hits 5 seconds. Which component becomes the bottleneck first, and how would you instrument observability to prove it?`,
      };
    }

    // Opening questions customized by interview mode
    switch (mode) {
      case "open_source_contribution":
        return {
          competency: "Codebase Comprehension & PR Hygiene",
          question: `Looking at ${artifactLabel}, explain how you trace a bug from a user-facing symptom down to the failing internal function, and what minimal test reproduces it cleanly before editing source code.`,
        };
      case "project_deep_dive":
        return {
          competency: "System Architecture & Trade-Offs",
          question: `Walk me through the core architecture of ${artifactLabel}. What was the hardest technical constraint or trade-off you had to resolve, and what alternative did you intentionally reject?`,
        };
      case "debugging_interview":
        return {
          competency: "Root Cause Diagnostics",
          question: `Imagine your service in ${artifactLabel} passes every local unit test, yet suffers intermittent 500 errors and rising memory usage after 2 hours in production. Outline your exact step-by-step investigation order.`,
        };
      case "behavioral_lp":
        return {
          competency: "Ownership & Conflict Resolution",
          question: `Tell me about a time while building software or collaborating in a team when you strongly disagreed with a technical approach or deadline decision. What data did you gather, and how did it end?`,
        };
      default:
        return {
          competency: dna.identifiedSkillGaps[0]?.skill || arena.requiredSkills[0]?.skill || "Algorithmic & Systems Design",
          question: `For ${arena.shortName} (${arena.companyOrOrg}), let's inspect ${artifactLabel}: how do you guarantee correctness, bounded latency, and clean failure recovery under malformed or concurrent inputs?`,
        };
    }
  }

  private async evaluateTurnResponse(
    question: string,
    competency: string,
    response: string,
    arena: PreparationArena
  ): Promise<NonNullable<InterviewTurn["evaluation"]>> {
    try {
      const llm = getLLMProvider();
      if (await llm.isAvailable()) {
        const evaluated = await llm.generateStructured<NonNullable<InterviewTurn["evaluation"]>>(
          [
            {
              role: "system",
              content: `Evaluate the candidate response objectively on a 0-10 scale for ${arena.companyOrOrg} bar. Never inflate short/vague answers.`,
            },
            {
              role: "user",
              content: `Question (${competency}): ${question}\nCandidate Response: ${response}\n\nReturn JSON: {"technicalCorrectness": number, "reasoningQuality": number, "communicationClarity": number, "depth": number, "strengths": string[], "gaps": string[], "coachingFeedback": string}`,
            },
          ],
          undefined,
          { timeoutMs: 8000, maxTokens: 500 }
        );
        if (typeof evaluated?.technicalCorrectness === "number") {
          return evaluated;
        }
      }
    } catch {
      // Deterministic evaluation fallback below
    }

    const words = response.trim().split(/\s+/).filter(Boolean).length;
    const lower = response.toLowerCase();
    const signals = [
      "latency", "complexity", "o(", "index", "lock", "atomic", "transaction",
      "idempoten", "retry", "backoff", "test", "mock", "memory", "queue",
      "trade-off", "tradeoff", "edge case", "timeout", "metric", "log", "schema",
    ];
    const hits = signals.filter(s => lower.includes(s)).length;

    const baseDepth = Math.min(9, Math.max(2, Math.floor(words / 15) + hits));
    const technicalCorrectness = words < 12 ? 2 : Math.min(9, 4 + hits);
    const reasoningQuality = lower.includes("because") || lower.includes("therefore") || hits >= 2 ? Math.min(9, 5 + hits) : Math.min(6, 2 + hits);
    const communicationClarity = words >= 25 && words <= 220 ? 7 : words < 12 ? 3 : 6;

    const strengths: string[] = [];
    const gaps: string[] = [];
    if (hits >= 2) strengths.push(`Referenced concrete engineering mechanisms (${signals.filter(s => lower.includes(s)).slice(0, 3).join(", ")}).`);
    if (words >= 30) strengths.push("Provided structured explanation beyond one-line assertion.");
    if (hits < 2) gaps.push("Lacks explicit discussion of failure modes, complexity bounds, or verification tests.");
    if (words < 20) gaps.push("Response is too brief to prove technical ownership.");

    return {
      technicalCorrectness,
      reasoningQuality,
      communicationClarity,
      depth: baseDepth,
      strengths: strengths.length > 0 ? strengths : ["Attempted to answer the prompt directly."],
      gaps,
      coachingFeedback:
        gaps.length > 0
          ? `Strengthen your answer with concrete edge cases, complexity/latency numbers, and verification tests for ${competency}.`
          : `Solid technical breakdown. Keep articulating explicit trade-offs clearly.`,
    };
  }

  private compileFinalReport(
    turns: InterviewTurn[],
    arena: PreparationArena
  ): NonNullable<PersistedInterviewSession["finalReport"]> {
    const evals = turns.map(t => t.evaluation).filter((e): e is NonNullable<InterviewTurn["evaluation"]> => Boolean(e));
    const count = Math.max(1, evals.length);
    const avg = (fn: (e: NonNullable<InterviewTurn["evaluation"]>) => number) =>
      Number((evals.reduce((s, e) => s + fn(e), 0) / count).toFixed(1));

    const averages = {
      technicalCorrectness: avg(e => e.technicalCorrectness),
      reasoningQuality: avg(e => e.reasoningQuality),
      communicationClarity: avg(e => e.communicationClarity),
      depth: avg(e => e.depth),
    };

    const composite =
      (averages.technicalCorrectness + averages.reasoningQuality + averages.communicationClarity + averages.depth) / 4;

    const overallVerdict: NonNullable<PersistedInterviewSession["finalReport"]>["overallVerdict"] =
      composite >= 7.5
        ? "Strong Hire / Select"
        : composite >= 5.5
        ? "Borderline — Needs Targeted Polish"
        : "Not Ready Yet";

    const keyStrengths = Array.from(new Set(evals.flatMap(e => e.strengths))).slice(0, 4);
    const criticalGaps = Array.from(new Set(evals.flatMap(e => e.gaps))).slice(0, 4);

    return {
      overallVerdict,
      averages,
      keyStrengths: keyStrengths.length > 0 ? keyStrengths : ["Completed full multi-turn technical simulation."],
      criticalGaps: criticalGaps.length > 0 ? criticalGaps : ["Continue drilling harder edge-case scenarios."],
      improvementPlan: [
        {
          action: "Drill timed problem solving & complexity reasoning",
          targetHref: "/student/skills/dsa",
        },
        {
          action: "Practice codebase tracing & regression test isolation",
          targetHref: "/student/skills/code-comprehension",
        },
        {
          action: `Review weak concepts in ${arena.shortName} Autonomous Assessment`,
          targetHref: `/student/skills/preparations/${arena.slug}?tab=mock_assessment`,
        },
      ],
    };
  }
}

export const autonomousInterviewStudio = AutonomousInterviewStudioEngine.getInstance();

