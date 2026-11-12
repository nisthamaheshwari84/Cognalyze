/**
 * lib/recruitment/interview-adapter.ts
 * 
 * Adapter connecting Recruitment Arena journey stages to the Cognalyze
 * Adaptive Technical & Behavioral Interview Engines.
 * Injects authentic company cultural personas and competency rubrics.
 */

import { BlueprintStageDefinition } from "./types";
import { getCompanyById } from "./company-registry";
import { getCompetencyFrameworkById } from "./competency-frameworks";

export interface StageInterviewConfig {
  stageId: string;
  companyName: string;
  interviewerPersona: string;
  interviewerRole: string;
  focusCompetencies: string[];
  systemPrompt: string;
  openingQuestion: string;
  sampleProbingQuestions: string[];
}

export function generateStageInterviewConfig(
  companyId: string,
  stageDef: BlueprintStageDefinition,
  candidateName: string = "Candidate"
): StageInterviewConfig {
  const company = getCompanyById(companyId);
  const companyName = company ? company.name : companyId.toUpperCase();
  const framework = company?.competencyFrameworkId
    ? getCompetencyFrameworkById(company.competencyFrameworkId)
    : null;

  // Gather principles matching stage target competencies
  const relevantPrinciples = (framework?.principles || []).filter((p) =>
    stageDef.targetCompetencies.some(
      (c) => c.toLowerCase().includes(p.id.toLowerCase()) || p.id.toLowerCase().includes(c.toLowerCase())
    )
  );

  const activePrinciples = relevantPrinciples.length > 0 ? relevantPrinciples : framework?.principles || [];

  const sampleProbingQuestions = activePrinciples.flatMap((p) => p.sampleProbingQuestions);

  let interviewerRole = "Senior Technical Interviewer";
  let interviewerPersona = `You are a Senior Software Engineer at ${companyName}.`;
  let openingQuestion = `Hello ${candidateName}, welcome to this technical interview round at ${companyName}. To start off, could you briefly walk me through a complex technical system or project you have architected, highlighting the toughest architectural tradeoff you had to make?`;

  if (stageDef.stageType === "behavioral_competency") {
    if (companyId === "amazon") {
      interviewerRole = "Amazon Bar Raiser";
      interviewerPersona = `You are an Amazon Bar Raiser from an independent engineering organization. You evaluate candidates strictly against the 16 Leadership Principles, seeking specific quantitative metrics and deep STAR-format examples. You do not accept surface-level answers.`;
      openingQuestion = `Hello ${candidateName}, welcome to your Amazon interview. I am your Bar Raiser today. Let's start with Customer Obsession: Tell me about a time you had to balance urgent customer requests against critical technical architecture and engineering constraints. Walk me through the situation, your exact actions, and the measurable outcome.`;
    } else if (companyId === "google") {
      interviewerRole = "Google Engineering Lead";
      interviewerPersona = `You are a Staff Software Engineer at Google conducting a Googlyness & Leadership interview. You look for intellectual humility, comfort with ambiguity, doing the right thing, and collaborative mindset without personal ego.`;
      openingQuestion = `Hi ${candidateName}, welcome. At Google, we frequently work on ill-defined problems where there is no clear consensus. Can you share an experience where you had to lead a project through significant technical ambiguity or disagreement within your team?`;
    } else if (companyId === "atlassian") {
      interviewerRole = "Atlassian Engineering Lead";
      interviewerPersona = `You are a Principal Engineer at Atlassian evaluating candidates against Atlassian's 5 core values: Open company no bullshit, Play as a team, Don't #@!% the customer, Build with heart and balance, and Be the change you seek.`;
      openingQuestion = `Hi ${candidateName}, welcome to Atlassian! One of our core values is 'Open company, no bullshit'—fostering transparent, direct, and constructive communication. Tell me about a time when you had to share uncomfortable technical feedback or deliver difficult news to leadership.`;
    }
  } else if (stageDef.stageType === "technical_interview_dsa") {
    interviewerRole = `${companyName} Algorithmic Interviewer`;
    interviewerPersona = `You are a Technical Interviewer at ${companyName}. You evaluate problem-solving intuition, data structure selection, Big-O computational complexity, and live code hygiene without IDE assistance.`;
    openingQuestion = `Hello ${candidateName}. Today we will collaborate on an algorithmic problem solving challenge relevant to high-scale services at ${companyName}. Before writing any code, I would like you to think aloud, clarify any ambiguous constraints, and discuss your planned time and space complexity.`;
  } else if (stageDef.stageType === "system_design_lld" || stageDef.stageType === "system_design_hld") {
    interviewerRole = `${companyName} Systems Architect`;
    interviewerPersona = `You are a Distributed Systems Architect at ${companyName}. You assess class modularity, SOLID principles, fault tolerance, transaction isolation, and scalability bottlenecks.`;
    openingQuestion = `Hello ${candidateName}. In this round, we are going to design a resilient subsystem for ${companyName}. We want to focus on clean interface boundaries, concurrency handling, and failure modes.`;
  }

  const systemPrompt = `${interviewerPersona}
Company: ${companyName}
Round: ${stageDef.title}
Target Competencies: ${stageDef.targetCompetencies.join(", ")}

Instructions:
1. Maintain an authentic, professional, and calibrated tone.
2. Probe deeply using the STAR format (Situation, Task, Action, Result).
3. If the candidate gives vague or rehearsed answers, ask follow-up questions probing exact technical mechanics, metric improvements, and trade-offs.
4. Evaluate both positive and negative behavioral indicators.`;

  return {
    stageId: stageDef.id,
    companyName,
    interviewerPersona,
    interviewerRole,
    focusCompetencies: stageDef.targetCompetencies,
    systemPrompt,
    openingQuestion,
    sampleProbingQuestions,
  };
}

/**
 * Evaluates an interview response or transcript for STAR structure and competency indicators.
 */
export function evaluateInterviewResponse(
  responseContent: string,
  targetCompetencies: string[]
): {
  score: number;
  starBreakdown: {
    situationPresent: boolean;
    taskPresent: boolean;
    actionPresent: boolean;
    resultPresent: boolean;
  };
  strengths: string[];
  growthAreas: string[];
} {
  const text = responseContent.toLowerCase();

  // Basic STAR heuristics
  const situationKeywords = ["when", "project", "client", "context", "problem", "situation", "background", "team was"];
  const taskKeywords = ["needed to", "goal", "responsible for", "objective", "task was", "challenge was"];
  const actionKeywords = ["i implemented", "i designed", "i created", "i decided", "i investigated", "i wrote", "my approach"];
  const resultKeywords = ["resulted in", "improved", "reduced", "outcome", "metric", "percent", "%", "delivered", "impact"];

  const situationPresent = situationKeywords.some((w) => text.includes(w));
  const taskPresent = taskKeywords.some((w) => text.includes(w));
  const actionPresent = actionKeywords.some((w) => text.includes(w));
  const resultPresent = resultKeywords.some((w) => text.includes(w));

  const starCount = [situationPresent, taskPresent, actionPresent, resultPresent].filter(Boolean).length;
  let score = 50 + starCount * 12; // Base 50, up to 98 with full STAR

  const strengths: string[] = [];
  const growthAreas: string[] = [];

  if (actionPresent) {
    strengths.push("Clear personal ownership and actionable technical contribution.");
  } else {
    growthAreas.push("Clarify your specific individual contributions versus general team actions.");
  }

  if (resultPresent) {
    strengths.push("Concrete impact and outcome articulated.");
  } else {
    growthAreas.push("Quantify the business or performance outcome (e.g. % latency reduction, bug frequency).");
  }

  if (starCount >= 3) {
    strengths.push("Structured, narrative response following STAR methodology.");
  } else {
    growthAreas.push("Structure your response more clearly into Situation, Task, Action, and Result.");
  }

  return {
    score: Math.min(100, Math.max(30, score)),
    starBreakdown: {
      situationPresent,
      taskPresent,
      actionPresent,
      resultPresent,
    },
    strengths,
    growthAreas,
  };
}

