/**
 * ADAPTIVE INTERVIEW ENGINE v1.0
 * 
 * Core intelligence for dynamic mock interviews:
 * 1. assessAnswer() — evaluates candidate's last answer before generating next question
 * 2. generateNextQuestion() — conditioned on assessment + session state + experience mode
 * 3. buildSessionContext() — tracks topics covered, difficulty curve, answer distribution
 * 
 * Design principles:
 * - No fixed question bank drives the session (fallbacks only for API failures)
 * - Shallow answers trigger follow-up probes (like a real interviewer)
 * - No college-tier bias: difficulty calibrated to demonstrated ability, not inferred background
 * - Experience mode genuinely changes question framing, not just a label
 */

import { groqFetch } from "@/lib/groq";

// ── Types ──

export type ExperienceMode = "fresher" | "1-3yr" | "experienced" | "career-switcher";

export type AnswerQuality = "strong" | "adequate" | "shallow" | "off-topic";

export interface AnswerAssessment {
  answer_quality: AnswerQuality;
  reasoning: string;
  topics_demonstrated: string[];
  next_action: "follow_up_probe" | "move_to_new_topic";
  difficulty_adjustment: "escalate" | "maintain" | "de-escalate";
}

export interface GeneratedQuestion {
  question: string;
  question_targets: string;
  question_type: "warm-up" | "technical" | "behavioral" | "system-design" | "closing";
  difficulty_level: "easy" | "medium" | "hard";
  is_follow_up: boolean;
}

export interface SessionState {
  question_count: number;
  topics_covered: string[];
  answer_distribution: { strong: number; adequate: number; shallow: number; off_topic: number };
  current_difficulty: "easy" | "medium" | "hard";
  last_assessment: AnswerAssessment | null;
  consecutive_shallow: number;
  experience_mode: ExperienceMode;
}

// ── Helpers ──

function stripThink(raw: string): string {
  return raw
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
    .replace(/<think>[\s\S]*$/gi, "")
    .replace(/<thinking>[\s\S]*$/gi, "")
    .replace(/<\/?think(?:ing)?>/gi, "")
    .trim();
}

function extractJSON(raw: string): any {
  const clean = stripThink(raw)
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  const s = clean.indexOf("{");
  const e = clean.lastIndexOf("}");
  if (s === -1 || e === -1) throw new Error("No JSON object found");
  const slice = clean.slice(s, e + 1);
  try {
    return JSON.parse(slice);
  } catch {
    return JSON.parse(
      slice
        .replace(/,\s*}/g, "}")
        .replace(/,\s*]/g, "]")
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, " ")
    );
  }
}

function getExperienceModeContext(mode: ExperienceMode): string {
  switch (mode) {
    case "fresher":
      return `EXPERIENCE MODE: Fresher/Student
- Assume no prior full-time work experience. Projects and academics are the primary evidence.
- Don't ask about "your team at work" or "production incidents" — ask about class projects, hackathons, personal projects.
- Behavioral questions should focus on teamwork in academic/project settings, not corporate environments.
- Start at easy difficulty and escalate based on demonstrated ability.
- Never assume familiarity with enterprise terminology, CI/CD pipelines, or internal company processes.`;

    case "1-3yr":
      return `EXPERIENCE MODE: 1-3 Years Experience
- Candidate has some work experience but is still early-career.
- Mix project-based and work-experience questions. Ask about real production challenges.
- Behavioral questions can reference professional settings (team conflicts, deadlines, code reviews).
- Start at medium difficulty.
- Can ask about deployment, monitoring, code review practices.`;

    case "experienced":
      return `EXPERIENCE MODE: Experienced Professional (3+ years)
- Candidate has significant work experience.
- Focus on architecture decisions, leadership, mentoring, production scale.
- Behavioral questions should probe leadership, cross-team collaboration, strategic thinking.
- Start at medium-hard difficulty.
- Expect and probe for metrics, scale, business impact.`;

    case "career-switcher":
      return `EXPERIENCE MODE: Career Switcher
- Candidate is transitioning from another field/role.
- Ask "bridge" questions: how prior experience transfers to the target role.
- Include "why are you switching?" and "what from your background is transferable?" questions.
- Behavioral emphasis on adaptability, learning speed, and transferable skills.
- Don't assume deep technical depth in the target field — assess learning ability and foundational understanding.
- Start at easy-medium difficulty, escalate based on demonstrated technical grasp.`;
  }
}

/**
 * Assess the candidate's last answer.
 * This is the core adaptive intelligence — it decides whether to probe deeper or move on.
 */
export async function assessAnswer(
  lastQuestion: string,
  lastAnswer: string,
  sessionState: SessionState,
  resumeContext: string,
  jdContext: string
): Promise<AnswerAssessment> {
  const wordCount = lastAnswer.split(/\s+/).filter(Boolean).length;

  // Fast-path: extremely short answers are definitionally shallow
  if (wordCount <= 5) {
    return {
      answer_quality: "shallow",
      reasoning: `Answer was only ${wordCount} words — no substantive content to evaluate.`,
      topics_demonstrated: [],
      next_action: "follow_up_probe",
      difficulty_adjustment: "de-escalate",
    };
  }

  const prompt = `You are an experienced FAANG interviewer assessing a candidate's answer. Be precise and specific.

QUESTION ASKED:
"${lastQuestion.slice(0, 500)}"

CANDIDATE'S ANSWER (${wordCount} words):
"${lastAnswer.slice(0, 1500)}"

CANDIDATE BACKGROUND: ${resumeContext.slice(0, 500)}
SESSION CONTEXT: ${sessionState.question_count} questions asked so far. Topics covered: ${sessionState.topics_covered.join(", ") || "none yet"}. Current difficulty: ${sessionState.current_difficulty}.
Answer distribution so far: ${JSON.stringify(sessionState.answer_distribution)}

ASSESSMENT RULES:
- "strong": Answer is specific, demonstrates real understanding, includes concrete examples/details, shows depth beyond surface level.
- "adequate": Answer addresses the question with some substance but lacks depth, specific examples, or technical precision.
- "shallow": Answer is vague, uses buzzwords without depth, gives a generic response that could apply to any candidate, or is too brief to evaluate.
- "off-topic": Answer doesn't address the question at all.

DECISION RULES FOR next_action:
- If answer_quality is "shallow" → ALWAYS set next_action to "follow_up_probe" (probe deeper on the same topic)
- If answer_quality is "off-topic" → "follow_up_probe" (redirect them back to the question)
- If answer_quality is "adequate" → "follow_up_probe" if this is a critical topic, otherwise "move_to_new_topic"
- If answer_quality is "strong" → "move_to_new_topic" (they've demonstrated competence, explore another area)

Return ONLY this JSON:
{
  "answer_quality": "strong|adequate|shallow|off-topic",
  "reasoning": "1-2 specific sentences about WHAT in the answer led to this assessment — cite what they said or didn't say",
  "topics_demonstrated": ["list of technical/behavioral topics the answer touched on"],
  "next_action": "follow_up_probe|move_to_new_topic",
  "difficulty_adjustment": "escalate|maintain|de-escalate"
}`;

  try {
    const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 400,
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) throw new Error(`Groq API ${res.status}`);
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) throw new Error("Empty response");

    const parsed = extractJSON(raw);

    // Validate and normalize
    const quality = ["strong", "adequate", "shallow", "off-topic"].includes(parsed.answer_quality)
      ? parsed.answer_quality as AnswerQuality
      : "adequate";

    const nextAction = quality === "shallow" || quality === "off-topic"
      ? "follow_up_probe" as const  // Enforce: shallow ALWAYS gets probed
      : parsed.next_action === "follow_up_probe"
        ? "follow_up_probe" as const
        : "move_to_new_topic" as const;

    return {
      answer_quality: quality,
      reasoning: stripThink(parsed.reasoning || "Assessment generated."),
      topics_demonstrated: Array.isArray(parsed.topics_demonstrated) ? parsed.topics_demonstrated : [],
      next_action: nextAction,
      difficulty_adjustment: parsed.difficulty_adjustment || "maintain",
    };
  } catch (err: any) {
    console.error("[interview-engine] assessAnswer failed:", err.message);
    // Fallback: basic heuristic assessment
    const quality: AnswerQuality = wordCount < 15 ? "shallow" : wordCount < 40 ? "adequate" : "adequate";
    return {
      answer_quality: quality,
      reasoning: "Assessment based on answer length (LLM unavailable).",
      topics_demonstrated: [],
      next_action: quality === "shallow" ? "follow_up_probe" : "move_to_new_topic",
      difficulty_adjustment: "maintain",
    };
  }
}

export interface InterviewContext {
  target_company?: string;
  company_tier?: string;
  drive_type?: string;
  role_level?: string;
  round_2_summary?: string;
}

/**
 * Generate the next interview question, conditioned on the session state and context.
 * Implements the 50-year expert interviewer persona with zero static fallbacks.
 */
export async function generateNextQuestion(
  sessionState: SessionState,
  assessment: AnswerAssessment | null,
  conversationHistory: string,
  resumeContext: string,
  jdContext: string,
  weakTopics: string[],
  evaluationDimensions?: any[],
  interviewContext?: InterviewContext
): Promise<GeneratedQuestion> {
  const { question_count, topics_covered, current_difficulty, experience_mode } = sessionState;

  // Determine question phase
  let phase: string;
  let phaseGuidance: string;
  if (question_count === 0) {
    phase = "warm-up";
    phaseGuidance = `This is the FIRST question. Start with an opening question that references the candidate's specific background, resume projects, or Round 2 performance. Do NOT ask generic questions like "tell me about yourself."`;
  } else if (question_count <= 6) {
    phase = "core";
    if (assessment?.next_action === "follow_up_probe") {
      phaseGuidance = `The candidate's last answer was ${assessment.answer_quality}. ${assessment.reasoning}
IMPORTANT: You must probe DEEPER on the same topic — do not move to a new topic. Ask a specific follow-up that forces them to demonstrate real understanding and technical precision.`;
    } else {
      const uncoveredNote = weakTopics.length > 0
        ? `Weak topics from prior sessions: ${weakTopics.join(", ")} — try to include one.`
        : "";
      phaseGuidance = `Move to a NEW topic not yet covered. Topics already covered: ${topics_covered.join(", ") || "none"}. ${uncoveredNote}
Calibrate appropriately to the exact company tier, drive type, and role level.`;
    }
  } else {
    phase = "closing";
    phaseGuidance = `We're nearing the end of the interview. Ask a conclusive closing question or invite the candidate to ask questions.`;
  }

  // Evaluation dimensions context (from JD Intelligence if available)
  let dimContext = "";
  if (evaluationDimensions && evaluationDimensions.length > 0) {
    dimContext = `\nEVALUATION DIMENSIONS (from job analysis):
${evaluationDimensions.slice(0, 5).map((d: any) => `- ${d.dimension} (weight: ${d.weight_pct}%)`).join("\n")}
Align questions to these dimensions where relevant.\n`;
  }

  const targetCompany = interviewContext?.target_company || "Target Company";
  const companyTier = interviewContext?.company_tier || "FAANG/Product (Tier-1 hiring bar)";
  const driveType = interviewContext?.drive_type || "On-campus placement";
  const roleLevel = interviewContext?.role_level || (experience_mode === "fresher" ? "Fresher/Entry-level" : "1-3 years");
  const round2Summary = interviewContext?.round_2_summary || "Round 2 Online Assessment completed.";

  const systemPrompt = `You are a technical interviewer with 50 years of combined experience across FAANG companies, mid-size product companies, and service-based IT companies in India — you have personally conducted and calibrated interviews across every tier of this landscape and know exactly what gets asked where, and why.

You know, from direct experience, that these are NOT the same interview:
- A Tier-1 college on-campus SDE-1 drive for a product company: DSA-heavy, fundamentals-focused, system design is rare or very lightweight (the role doesn't need it yet) — over-testing system design here would be a real interviewer's mistake, not rigor.
- A service-based company's on-campus drive: often weighted toward aptitude, communication, and CS-fundamentals (OOP, DBMS, OS basics), sometimes with lighter DSA expectations than a product company — but don't assume this uniformly; some service companies now run product-company-style bars for select roles.
- A FAANG or senior product-company technical round: DSA is table stakes, system design becomes central at 3+ years and especially at senior levels, and depth of reasoning (not just correct answers) is scrutinized.
- An experienced-hire/lateral interview: much more project-depth interrogation ("walk me through what YOU specifically built and decided"), less generic DSA, more architecture and tradeoff discussion.

You calibrate every question to the ACTUAL context given below — you never ask a question just because it's a "classic interview question." You ask what a real interviewer in this exact context would actually ask, and you never invent a fabricated statistic or survey result to justify a question style — if you're drawing on a general, well-known industry pattern, state it as a general pattern ("many product companies at this level..."), not as a specific invented number.

CONTEXT FOR THIS SESSION:
Target company/opportunity: ${targetCompany}
Company tier/type: ${companyTier}
Drive type: ${driveType}
Role level: ${roleLevel}
Candidate's resume/profile: ${resumeContext.slice(0, 1800)}
Candidate's Round 2 (Online Assessment) performance: ${round2Summary}
Conversation so far this round: ${conversationHistory.slice(0, 2500)}

Generate the next interview question, or a follow-up probe if the candidate's last answer was shallow (reuse the existing answer_assessment logic). Never select from a fixed list — construct this question specifically for this exact moment, this candidate, and this context.`;

  const userPrompt = `CURRENT PHASE: ${phase}
${phaseGuidance}
${dimContext}
JOB CONTEXT: ${jdContext.slice(0, 1000)}

RULES:
- Ask ONE question only. Never two in one message.
- Be conversational but precise — like a real interviewer, not a quiz master.
- Reference the candidate's actual resume content or OA performance where relevant.
- NEVER invent or cite fake statistics like "73% of candidates..." or "according to a survey".
- Keep the question under 60 words. Be direct.
- Do not reveal scores or that you're an AI.

Return ONLY this JSON:
{
  "question": "Your next interview question",
  "question_targets": "What this question is specifically testing for",
  "question_type": "warm-up|technical|behavioral|system-design|closing",
  "difficulty_level": "${current_difficulty}",
  "is_follow_up": ${assessment?.next_action === "follow_up_probe" ? "true" : "false"}
}`;

  // Execute with retry-once behavior (never fall back to a static pre-written question)
  let lastErr: any = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          max_tokens: 300,
          temperature: 0.65,
          response_format: { type: "json_object" },
        }),
      });

      if (!res.ok) throw new Error(`Groq API ${res.status}`);
      const data = await res.json();
      const raw = data.choices?.[0]?.message?.content;
      if (!raw) throw new Error("Empty response");

      const parsed = extractJSON(raw);
      if (!parsed.question) throw new Error("No question field in parsed output");

      return {
        question: stripThink(parsed.question),
        question_targets: stripThink(parsed.question_targets || "Context-specific evaluation"),
        question_type: parsed.question_type || (phase === "warm-up" ? "warm-up" : "technical"),
        difficulty_level: parsed.difficulty_level || current_difficulty,
        is_follow_up: parsed.is_follow_up ?? (assessment?.next_action === "follow_up_probe"),
      };
    } catch (err: any) {
      lastErr = err;
      console.warn(`[interview-engine] generateNextQuestion attempt ${attempt} failed:`, err.message);
      if (attempt === 1) {
        await new Promise((r) => setTimeout(r, 400));
      }
    }
  }

  // If retry also failed, throw error — ZERO static fallback question allowed!
  console.error("[interview-engine] generateNextQuestion failed after 2 attempts:", lastErr?.message);
  throw new Error(`Question generation failed after retry: ${lastErr?.message || "Unknown error"}`);
}

/**
 * Create initial session state.
 */
export function createSessionState(experienceMode: ExperienceMode): SessionState {
  const startDifficulty = experienceMode === "fresher" ? "easy"
    : experienceMode === "career-switcher" ? "easy"
    : experienceMode === "1-3yr" ? "medium"
    : "medium";

  return {
    question_count: 0,
    topics_covered: [],
    answer_distribution: { strong: 0, adequate: 0, shallow: 0, off_topic: 0 },
    current_difficulty: startDifficulty as "easy" | "medium" | "hard",
    last_assessment: null,
    consecutive_shallow: 0,
    experience_mode: experienceMode,
  };
}

/**
 * Update session state after an answer assessment.
 */
export function updateSessionState(
  state: SessionState,
  assessment: AnswerAssessment
): SessionState {
  const newDistribution = { ...state.answer_distribution };
  const distKey = assessment.answer_quality === "off-topic" ? "off_topic" : assessment.answer_quality;
  newDistribution[distKey] = (newDistribution[distKey] || 0) + 1;

  const newTopics = [
    ...state.topics_covered,
    ...assessment.topics_demonstrated.filter(t => !state.topics_covered.includes(t)),
  ];

  // Difficulty adjustment
  let newDifficulty = state.current_difficulty;
  if (assessment.difficulty_adjustment === "escalate") {
    newDifficulty = state.current_difficulty === "easy" ? "medium" : "hard";
  } else if (assessment.difficulty_adjustment === "de-escalate") {
    newDifficulty = state.current_difficulty === "hard" ? "medium" : "easy";
  }

  const consecutiveShallow = assessment.answer_quality === "shallow"
    ? state.consecutive_shallow + 1
    : 0;

  return {
    ...state,
    question_count: state.question_count + 1,
    topics_covered: newTopics,
    answer_distribution: newDistribution,
    current_difficulty: newDifficulty,
    last_assessment: assessment,
    consecutive_shallow: consecutiveShallow,
  };
}
