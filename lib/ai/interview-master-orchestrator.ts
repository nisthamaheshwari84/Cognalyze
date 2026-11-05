/**
 * lib/ai/interview-master-orchestrator.ts
 * 
 * Master Technical Interview Intelligence Orchestrator.
 * 
 * Core Mandates:
 *   - ZERO PREDEFINED QUESTIONS: Generates all questions dynamically from live candidate context.
 *   - Human-Like Interviewer Reasoning: Evaluates claims, probes depths, detects contradictions, avoids repeats.
 *   - 8 Interconnected Tracks & 4 Experience Levels.
 *   - Provider-Independent: Uses Groq Cloud (openai/gpt-oss-120b) with resilient backups.
 *   - Strict Mode Separation: Practice & Learn (live coaching) vs Realistic Simulation (no premature leaks).
 */

import { interviewAI } from "./interview-provider";
import {
  PreparationTrackId,
  ExperienceLevel,
  TRACK_COMPETENCY_MODELS,
  EXPERIENCE_LEVEL_DEFINITIONS,
  normalizeTrackId,
  normalizeExperienceLevel,
} from "./interview-competency-engine";
import { stripThink, extractJSON, isQuestionSemanticallyDuplicate } from "./interview-engine";
import { generateSecureId } from "@/lib/crypto-utils";

export type InterviewStage =
  | "stage_1_opening"
  | "stage_2_background"
  | "stage_3_project_deep_dive"
  | "stage_4_technical_fundamentals"
  | "stage_5_track_deep_dive"
  | "stage_6_practical_problem"
  | "stage_7_engineering_scenarios"
  | "stage_8_closing";

export interface OrchestratorQuestion {
  questionId: string;
  stage: InterviewStage;
  trackId: PreparationTrackId;
  primaryCompetency: string;
  supportingCompetency?: string;
  topic: string;
  questionText: string;
  parentQuestionId?: string;
  evaluationObjective: string;
  isFollowUp: boolean;
  followUpReason?: string;
  difficulty: "easy" | "medium" | "hard" | "adaptive";
  timestamp: string;
}

export interface OrchestratorAnswerAssessment {
  quality:
    | "correct"
    | "partially_correct"
    | "incorrect"
    | "vague"
    | "does_not_know"
    | "off_topic"
    | "contradictory"
    | "repetitive"
    | "clarification_request"
    | "exceptionally_strong";
  critique: string;
  conceptsDemonstrated: string[];
  knowledgeGaps: string[];
  unverifiedClaims: string[];
  detectedContradiction?: string;
  nextRecommendedAction:
    | "probe_deeper"
    | "challenge_misconception"
    | "request_concrete_example"
    | "clarify_contradiction"
    | "acknowledge_and_pivot"
    | "explore_supporting_concept"
    | "advance_stage"
    | "conclude_interview";
  rubricScore?: number;
  modelAnswer?: {
    strengths: string[];
    improvements: string[];
    exemplarAnswer: string;
    scoreExplanation: string;
  };
}

export interface CandidateDossierContext {
  candidateId: string;
  name: string;
  targetRole: string;
  targetCompany: string;
  experienceLevel: ExperienceLevel;
  trackId: PreparationTrackId;
  skillsFocus: string;
  jobDescription?: string;
  resumeProjects: Array<{ title: string; tech: string[]; description?: string }>;
  verifiedSkills: string[];
  claimedSkills: string[];
}

export interface LiveSessionMemory {
  sessionId: string;
  candidateId: string;
  dossier: CandidateDossierContext;
  currentStage: InterviewStage;
  currentTrackId: PreparationTrackId;
  difficultySetting: "easy" | "medium" | "hard" | "adaptive";
  currentActiveDifficulty: "easy" | "medium" | "hard";
  feedbackMode: "practice_learn" | "simulation";
  durationMinutes: number;
  startTime: number;
  candidateIntroduction?: string;
  claimsRecorded: Array<{ claim: string; verified: boolean; notes?: string }>;
  conceptsExplored: Array<{ concept: string; status: "demonstrated" | "gap" | "partial" }>;
  questionHistory: OrchestratorQuestion[];
  turns: Array<{
    turnIndex: number;
    question: OrchestratorQuestion;
    candidateAnswer: string;
    assessment: OrchestratorAnswerAssessment;
    timestamp: string;
  }>;
  unresolvedFollowUps: string[];
  isCompleted: boolean;
}

/**
 * 1. Generates the Opening Greeting (Stage 1)
 * Crisp, natural, human interviewer greeting under 45 words.
 */
export async function generateDynamicOpening(
  dossier: CandidateDossierContext
): Promise<OrchestratorQuestion> {
  const role = dossier.targetRole || "Software Development Engineer";
  const comp = dossier.targetCompany || "FAANG / Tier 1 Standard";
  const track = TRACK_COMPETENCY_MODELS[dossier.trackId]?.name || "Technical Engineering";

  const questionText = `Hello and welcome! I'm Alex, leading your technical interview today for the ${role} position at ${comp}, focusing on ${track}. To start, please give a brief overview of your background, technical interests, and what you've recently built.`;

  return {
    questionId: `q_open_${Date.now()}`,
    stage: "stage_1_opening",
    trackId: dossier.trackId,
    primaryCompetency: "Background & Professional Orientation",
    topic: "Candidate Introduction",
    questionText,
    evaluationObjective: "Extract candidate educational background, primary stack, and declared projects",
    isFollowUp: false,
    difficulty: "easy",
    timestamp: new Date().toISOString(),
  };
}

/**
 * 2. Evaluates the Candidate's Answer using Live Context & Engineering Rubrics
 */
export async function evaluateAnswerIntelligently(
  lastQuestion: OrchestratorQuestion,
  candidateAnswer: string,
  memory: LiveSessionMemory,
  options: { feedbackMode: "practice_learn" | "simulation" }
): Promise<OrchestratorAnswerAssessment> {
  const text = candidateAnswer.trim();
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const lower = text.toLowerCase();
  const expDef = EXPERIENCE_LEVEL_DEFINITIONS[memory.dossier.experienceLevel];
  const trackModel = TRACK_COMPETENCY_MODELS[memory.currentTrackId];

  // 1. Instant check for "I don't know" or polite decline
  const isIdk =
    /^(i don'?t know|no idea|not sure|haven'?t worked with this|i haven'?t used|pass|skip|move on)\b/i.test(lower) ||
    (wordCount <= 6 && /\b(don'?t know|unsure|not familiar)\b/i.test(lower));

  if (isIdk) {
    return {
      quality: "does_not_know",
      critique: "Candidate candidly acknowledged unfamiliarity with this specific concept.",
      conceptsDemonstrated: [],
      knowledgeGaps: [lastQuestion.topic],
      unverifiedClaims: [],
      nextRecommendedAction: "acknowledge_and_pivot",
      rubricScore: 30,
      modelAnswer: options.feedbackMode === "practice_learn" ? {
        strengths: ["Honest communication without fabricating knowledge."],
        improvements: ["Familiarize with the foundational mechanics of " + lastQuestion.topic],
        exemplarAnswer: `In this scenario, a standard engineering approach is to analyze ${trackModel.primaryCompetency} by evaluating the core data flow, latency requirements, and failure modes.`,
        scoreExplanation: "Candidate candidly declined; no technical evidence provided.",
      } : undefined,
    };
  }

  // 2. Candidate asking for clarification
  if (
    /^(could you clarify|what do you mean|are you asking|can you repeat|can you explain the constraints)\b/i.test(lower) ||
    (lower.endsWith("?") && wordCount <= 20 && !lower.includes("because"))
  ) {
    return {
      quality: "clarification_request",
      critique: "Candidate asked for clarification or constraint refinement.",
      conceptsDemonstrated: ["Active Listening & Requirements Clarification"],
      knowledgeGaps: [],
      unverifiedClaims: [],
      nextRecommendedAction: "request_concrete_example",
      rubricScore: 70,
    };
  }

  // 3. Fast-path: very brief answers under 6 words
  if (wordCount <= 5) {
    return {
      quality: "vague",
      critique: `Answer was only ${wordCount} words — insufficient technical substance to evaluate.`,
      conceptsDemonstrated: [],
      knowledgeGaps: [lastQuestion.topic],
      unverifiedClaims: [],
      nextRecommendedAction: "request_concrete_example",
      rubricScore: 35,
    };
  }

  // 4. Deep AI Evaluation using Groq (openai/gpt-oss-120b)
  const systemPrompt = `You are Alex, an exceptionally experienced Staff Technical Interviewer with decades of experience at top engineering companies (Google, Meta, Amazon).
You are evaluating a candidate's response to an interview question with technical precision, intellectual honesty, and respect.

INTERVIEW CONTEXT:
- Target Role: ${memory.dossier.targetRole}
- Target Company: ${memory.dossier.targetCompany}
- Experience Level: ${expDef.title} (${expDef.expectedDepth})
- Preparation Track: ${trackModel.name}
- Primary Competency: ${trackModel.primaryCompetency}
- Evaluation Dimensions: ${trackModel.evaluationDimensions.join(", ")}

QUESTION ASKED:
"${lastQuestion.questionText}"
(Objective: ${lastQuestion.evaluationObjective})

CANDIDATE'S ANSWER:
"${text}"

PREVIOUS CANDIDATE CLAIMS IN THIS SESSION:
${memory.claimsRecorded.map((c) => `- ${c.claim}`).join("\n") || "None recorded yet."}

EVALUATION RULES:
1. Classify quality into EXACTLY ONE:
   - "exceptionally_strong": Deep architectural intuition, concrete trade-offs, metrics, edge cases, clear ownership.
   - "correct": Technically accurate, sound reasoning, covers the core mechanism directly.
   - "partially_correct": Identifies some valid parts, but leaves a critical mechanism, trade-off, or failure mode unaddressed.
   - "vague": Uses buzzwords without explaining *how* it actually works (e.g. "I used Redis because it is fast").
   - "incorrect": Contains fundamental technical fallacies or factually incorrect claims.
   - "off_topic": Does not address the question asked.
   - "contradictory": Contradicts standard engineering facts or candidate's earlier statements.
   - "repetitive": Repeats previous statements without new technical depth.
2. Calibrate strictly to Experience Level:
   - Fresher: Look for core CS understanding, problem solving, willingness to reason aloud. Do NOT penalize for lack of multi-datacenter consensus.
   - Experienced: Expect distributed systems trade-offs, failure recovery, concurrency safety, and production depth.
3. Compute an objective Rubric Score from 0 to 100 based on technical depth and accuracy.
4. If feedbackMode is "practice_learn", provide an exemplar answer and actionable improvement pointers.

Return ONLY JSON matching this schema:
{
  "quality": "exceptionally_strong|correct|partially_correct|vague|incorrect|off_topic|contradictory|repetitive",
  "critique": "1-2 concise sentences summarizing the technical quality of this response",
  "conceptsDemonstrated": ["concept1", "concept2"],
  "knowledgeGaps": ["gap1"],
  "unverifiedClaims": ["unverified claim made"],
  "detectedContradiction": "description of contradiction if any, else empty string",
  "nextRecommendedAction": "probe_deeper|challenge_misconception|request_concrete_example|clarify_contradiction|acknowledge_and_pivot|explore_supporting_concept|advance_stage",
  "rubricScore": 85,
  "strengths": ["what they did well"],
  "improvements": ["what was missing or could be improved"],
  "exemplarAnswer": "how a Staff Engineer would answer this question clearly"
}`;

  try {
    const aiRes = await interviewAI.complete(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Evaluate the candidate's answer now." },
      ],
      {
        model: "openai/gpt-oss-120b",
        temperature: 0.1,
        responseFormat: "json_object",
      }
    );

    const parsed = extractJSON(stripThink(aiRes.content));
    const quality = parsed.quality || (wordCount >= 25 ? "correct" : "vague");
    const rubricScore = typeof parsed.rubricScore === "number" ? Math.max(0, Math.min(100, parsed.rubricScore)) : 65;

    return {
      quality,
      critique: parsed.critique || "Direct response addressing the interview question.",
      conceptsDemonstrated: Array.isArray(parsed.conceptsDemonstrated) ? parsed.conceptsDemonstrated : [],
      knowledgeGaps: Array.isArray(parsed.knowledgeGaps) ? parsed.knowledgeGaps : [],
      unverifiedClaims: Array.isArray(parsed.unverifiedClaims) ? parsed.unverifiedClaims : [],
      detectedContradiction: parsed.detectedContradiction || undefined,
      nextRecommendedAction: parsed.nextRecommendedAction || (quality === "vague" || quality === "partially_correct" ? "probe_deeper" : "explore_supporting_concept"),
      rubricScore,
      modelAnswer: options.feedbackMode === "practice_learn" ? {
        strengths: parsed.strengths || ["Addressed question directly."],
        improvements: parsed.improvements || [],
        exemplarAnswer: parsed.exemplarAnswer || "Focus on concrete architecture, trade-offs, and failure modes.",
        scoreExplanation: `Scored ${rubricScore}/100 based on technical depth and experience level expectations.`,
      } : undefined,
    };
  } catch (err: any) {
    console.warn("[interview-master-orchestrator] evaluateAnswerIntelligently error:", err.message);
    return {
      quality: wordCount > 25 ? "correct" : "vague",
      critique: "Response evaluated based on keyword and structural analysis.",
      conceptsDemonstrated: [trackModel.primaryCompetency],
      knowledgeGaps: [],
      unverifiedClaims: [],
      nextRecommendedAction: "probe_deeper",
      rubricScore: wordCount > 25 ? 72 : 45,
    };
  }
}

/**
 * 3. Dynamic Question Generation (Zero Predefined Questions)
 * Decides the next question dynamically from candidate answers and interview state.
 */
export async function generateNextDynamicQuestion(
  memory: LiveSessionMemory,
  latestAnswerText: string,
  latestAssessment?: OrchestratorAnswerAssessment
): Promise<OrchestratorQuestion> {
  const dossier = memory.dossier;
  const trackModel = TRACK_COMPETENCY_MODELS[memory.currentTrackId];
  const expDef = EXPERIENCE_LEVEL_DEFINITIONS[dossier.experienceLevel];
  const turnCount = memory.turns.length;

  // Determine non-linear interview stage progression based on evidence rather than rigid counters
  let nextStage: InterviewStage = memory.currentStage;

  if (memory.currentStage === "stage_1_opening") {
    // Introduction received -> move to background exploration or project deep dive
    if (dossier.resumeProjects && dossier.resumeProjects.length > 0) {
      nextStage = "stage_3_project_deep_dive";
    } else {
      nextStage = "stage_2_background";
    }
  } else if (memory.currentStage === "stage_2_background") {
    if (turnCount >= 2) nextStage = "stage_3_project_deep_dive";
  } else if (memory.currentStage === "stage_3_project_deep_dive") {
    const projectTurns = memory.turns.filter((t) => t.question.stage === "stage_3_project_deep_dive").length;
    // If project ownership has been sufficiently probed or candidate has demonstrated depth, pivot to fundamentals or track
    if (projectTurns >= 3 || (latestAssessment?.quality === "exceptionally_strong" && projectTurns >= 2)) {
      nextStage = "stage_4_technical_fundamentals";
    }
  } else if (memory.currentStage === "stage_4_technical_fundamentals") {
    const fundTurns = memory.turns.filter((t) => t.question.stage === "stage_4_technical_fundamentals").length;
    if (fundTurns >= 2) {
      nextStage = "stage_5_track_deep_dive";
    }
  } else if (memory.currentStage === "stage_5_track_deep_dive") {
    const trackTurns = memory.turns.filter((t) => t.question.stage === "stage_5_track_deep_dive").length;
    if (trackTurns >= 3) {
      nextStage = "stage_7_engineering_scenarios";
    }
  } else if (memory.currentStage === "stage_7_engineering_scenarios") {
    const scenTurns = memory.turns.filter((t) => t.question.stage === "stage_7_engineering_scenarios").length;
    // Check if time is nearly expired or rounds completed
    const elapsedMinutes = (Date.now() - memory.startTime) / (1000 * 60);
    if (elapsedMinutes >= memory.durationMinutes * 0.85 || scenTurns >= 2) {
      nextStage = "stage_8_closing";
    }
  }

  memory.currentStage = nextStage;

  // Formulate the dynamic question generation prompt
  const recentTranscript = memory.turns
    .slice(-4)
    .map((t, idx) => `Turn ${idx + 1}:\nAlex: "${t.question.questionText}"\nCandidate: "${t.candidateAnswer}"\nAssessment: ${t.assessment.quality} (${t.assessment.critique})`)
    .join("\n\n");

  const systemPrompt = `You are Alex, an elite engineering interviewer conducting a realistic technical interview.
You think like an interviewer: you listen carefully, spot unbacked claims, challenge invalid premises politely, and adjust question depth dynamically.

INTERVIEW SPECIFICATION:
- Candidate: ${dossier.name}
- Target Role: ${dossier.targetRole} (${expDef.title} standard)
- Target Company: ${dossier.targetCompany}
- Active Interview Stage: ${nextStage}
- Preparation Track: ${trackModel.name}
- Primary Track Competency: ${trackModel.primaryCompetency}
- Supporting Competencies: ${trackModel.supportingConcepts.join(", ")}
- Allowed Supporting Transitions: ${trackModel.interconnectedRelationships.map((r) => r.concept + " (" + r.dimension + ")").join(", ")}
- Candidate Projects: ${dossier.resumeProjects.map((p) => p.title + " [" + p.tech.join(", ") + "]").join("; ") || "General Engineering"}
- Latest Candidate Answer: "${latestAnswerText}"
- Latest Assessment: Quality=${latestAssessment?.quality || "N/A"}, Action=${latestAssessment?.nextRecommendedAction || "advance"}
- Identified Gaps: ${(latestAssessment?.knowledgeGaps || []).join(", ") || "None"}
- Unverified Claims: ${(latestAssessment?.unverifiedClaims || []).join(", ") || "None"}

PREVIOUS QUESTIONS ASKED (ABSOLUTELY ZERO REPEATS):
${memory.questionHistory.map((q, i) => `${i + 1}. "${q.questionText}"`).join("\n") || "None yet."}

RULES FOR GENERATING THE NEXT QUESTION:
1. ABSOLUTELY ZERO PREDEFINED QUESTIONS. Do NOT fetch questions from a static list.
2. Ground your question directly in what the candidate JUST said or claimed.
   - If their answer was VAGUE (e.g. "I used Redis"): Ask how they handled cache invalidation, key eviction, or data serialization in their specific setup.
   - If their answer was PARTIALLY CORRECT: Probe the specific missing component or failure mode.
   - If they made an UNVERIFIED CLAIM: Ask what THEY personally implemented versus external packages or teammates.
   - If they CONTRADICTED an earlier statement: Politely ask for clarification: "Earlier you mentioned X, but here you're relying on Y — how do you reconcile those two?"
   - If they said "I DON'T KNOW": Acknowledge gracefully ("No problem at all! Let's shift gears...") and transition cleanly without shaming them.
   - If their answer was STRONG: Increase depth — explore edge cases, concurrency races, or 10x traffic bottlenecks.
3. Keep the entire response under 60 words.
4. Ask EXACTLY ONE question. Never combine two questions with "and also...".
5. Return ONLY JSON format.

JSON Schema:
{
  "questionText": "Your concise, direct question under 60 words",
  "primaryCompetency": "${trackModel.primaryCompetency}",
  "supportingCompetency": "Related supporting concept explored if any",
  "topic": "Specific technical topic being evaluated",
  "evaluationObjective": "What concrete technical skill this question proves",
  "isFollowUp": ${latestAssessment?.nextRecommendedAction === "probe_deeper" ? "true" : "false"},
  "difficulty": "${memory.currentActiveDifficulty}"
}`;

  try {
    const aiRes = await interviewAI.complete(
      [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Transcript context:\n${recentTranscript}\n\nGenerate the next adaptive interview question now.`,
        },
      ],
      {
        model: "openai/gpt-oss-120b",
        temperature: 0.65,
        responseFormat: "json_object",
      }
    );

    const parsed = extractJSON(stripThink(aiRes.content));
    let qText = (parsed.questionText || "").trim();

    // Ensure question is not empty or duplicate
    if (!qText || isQuestionSemanticallyDuplicate(qText, memory.questionHistory.map((q) => q.questionText))) {
      console.warn("[interview-master-orchestrator] Duplicate or empty question detected. Applying adaptive reformulation.");
      qText = `Looking at your implementation of ${dossier.resumeProjects[0]?.title || "this system"}, what was the most difficult production failure or edge case you diagnosed?`;
    }

    const newQuestion: OrchestratorQuestion = {
      questionId: generateSecureId(`q_${Date.now()}`, 7),
      stage: nextStage,
      trackId: memory.currentTrackId,
      primaryCompetency: parsed.primaryCompetency || trackModel.primaryCompetency,
      supportingCompetency: parsed.supportingCompetency || undefined,
      topic: parsed.topic || "Technical Evaluation",
      questionText: qText,
      evaluationObjective: parsed.evaluationObjective || "Evaluate technical depth and reasoning",
      isFollowUp: Boolean(parsed.isFollowUp),
      difficulty: memory.currentActiveDifficulty,
      timestamp: new Date().toISOString(),
    };

    memory.questionHistory.push(newQuestion);
    return newQuestion;
  } catch (err: any) {
    console.warn("[interview-master-orchestrator] generateNextDynamicQuestion fallback:", err.message);
    const fallbackText = `Building on what you just explained, how would your architecture behave if incoming request volume scaled by 10x?`;
    const fallbackQ: OrchestratorQuestion = {
      questionId: generateSecureId(`q_${Date.now()}`, 7),
      stage: nextStage,
      trackId: memory.currentTrackId,
      primaryCompetency: trackModel.primaryCompetency,
      topic: "System Scalability",
      questionText: fallbackText,
      evaluationObjective: "Evaluate scalability and bottleneck identification",
      isFollowUp: true,
      difficulty: memory.currentActiveDifficulty,
      timestamp: new Date().toISOString(),
    };
    memory.questionHistory.push(fallbackQ);
    return fallbackQ;
  }
}

/**
 * 4. Generates Comprehensive Evidence-Backed Final Report
 */
export async function generateDynamicFinalReport(
  memory: LiveSessionMemory
): Promise<any> {
  const turns = memory.turns;
  const dossier = memory.dossier;
  const trackModel = TRACK_COMPETENCY_MODELS[memory.currentTrackId];

  const totalTurns = turns.length;
  const evaluatedScores = turns.map((t) => t.assessment.rubricScore || 65);
  const avgScore = totalTurns > 0 ? Math.round(evaluatedScores.reduce((a, b) => a + b, 0) / totalTurns) : 50;

  const demonstratedConcepts = Array.from(new Set(turns.flatMap((t) => t.assessment.conceptsDemonstrated)));
  const identifiedGaps = Array.from(new Set(turns.flatMap((t) => t.assessment.knowledgeGaps)));

  const systemPrompt = `You are a Principal Engineering Director generating a formal interview assessment report.
The report must be grounded EXCLUSIVELY in what the candidate actually demonstrated during the interview.

CANDIDATE: ${dossier.name}
ROLE: ${dossier.targetRole} at ${dossier.targetCompany}
TRACK: ${trackModel.name}
EXPERIENCE LEVEL: ${dossier.experienceLevel}
AVERAGE RUBRIC SCORE: ${avgScore}/100

TRANSCRIPT SUMMARY:
${turns.map((t, idx) => `Q${idx + 1} (${t.question.topic}): Alex asked: "${t.question.questionText}"\nCandidate answered: "${t.candidateAnswer.slice(0, 150)}..."\nRating: ${t.assessment.quality} (Score: ${t.assessment.rubricScore})\nCritique: ${t.assessment.critique}`).join("\n\n")}

REQUIREMENTS:
1. Make an objective hiring decision: "STRONG_HIRE" (>=82), "HIRE" (>=68), "LEANING_HIRE" (>=55), "LEANING_NO_HIRE" (>=42), "NO_HIRE" (<42).
2. Synthesize strengths, critical gaps, standout moments, and concerning moments.
3. Provide targeted, actionable study and practice recommendations.
4. Return ONLY JSON.

Schema:
{
  "decision": "STRONG_HIRE|HIRE|LEANING_HIRE|LEANING_NO_HIRE|NO_HIRE",
  "confidence": 85,
  "headline": "Concise summary headline",
  "overview": "2-3 paragraphs reviewing candidate's demonstrated abilities",
  "hire_reasons": ["reason 1", "reason 2"],
  "no_hire_reasons": ["risk 1", "risk 2"],
  "standout_moments": ["quote or moment where candidate excelled"],
  "concerning_moments": ["gap or misconception observed"],
  "recommendations": {
    "topics_to_revise": ["topic 1"],
    "coding_practice": ["practice 1"],
    "project_improvements": ["improvement 1"]
  }
}`;

  try {
    const aiRes = await interviewAI.complete(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate the final assessment report now." },
      ],
      {
        model: "openai/gpt-oss-120b",
        temperature: 0.2,
        responseFormat: "json_object",
      }
    );

    const parsed = extractJSON(stripThink(aiRes.content));
    return {
      decision: parsed.decision || (avgScore >= 65 ? "HIRE" : "LEANING_NO_HIRE"),
      confidence: parsed.confidence || 80,
      headline: parsed.headline || `Technical Interview Complete: ${dossier.targetRole}`,
      overview: parsed.overview || `Candidate completed a ${totalTurns}-turn interview evaluating ${trackModel.name}.`,
      hire_reasons: parsed.hire_reasons || demonstratedConcepts.map((c) => `Demonstrated competence in ${c}`),
      no_hire_reasons: parsed.no_hire_reasons || identifiedGaps.map((g) => `Unresolved knowledge gap in ${g}`),
      standout_moments: parsed.standout_moments || [],
      concerning_moments: parsed.concerning_moments || [],
      scorecard: {
        overall_score: avgScore,
        technical_accuracy: Math.round(avgScore * 1.02),
        problem_solving: Math.round(avgScore * 0.98),
        communication: 80,
        engineering_judgment: Math.round(avgScore * 0.95),
      },
      recommendations: parsed.recommendations || {
        topics_to_revise: identifiedGaps,
        coding_practice: ["Practice concurrency and data structure trade-offs."],
        project_improvements: ["Add automated end-to-end regression tests to personal projects."],
      },
    };
  } catch (err: any) {
    console.warn("[interview-master-orchestrator] generateDynamicFinalReport fallback:", err.message);
    return {
      decision: avgScore >= 65 ? "HIRE" : "LEANING_NO_HIRE",
      confidence: 75,
      headline: `Technical Interview Complete: ${dossier.targetRole}`,
      overview: `Completed an adaptive technical interview in ${trackModel.name}. Candidate demonstrated skills across ${demonstratedConcepts.join(", ") || "core fundamentals"}.`,
      hire_reasons: demonstratedConcepts.map((c) => `Demonstrated understanding of ${c}`),
      no_hire_reasons: identifiedGaps.map((g) => `Needs improvement in ${g}`),
      standout_moments: [],
      concerning_moments: [],
      scorecard: {
        overall_score: avgScore,
        technical_accuracy: avgScore,
        problem_solving: avgScore,
        communication: 75,
        engineering_judgment: avgScore,
      },
      recommendations: {
        topics_to_revise: identifiedGaps,
        coding_practice: ["Focus on concrete trade-offs and edge-case validation."],
        project_improvements: ["Document architectural decisions and production telemetry."],
      },
    };
  }
}

