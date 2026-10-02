/**
 * lib/skills/behavioral-engine.ts
 * "HIDE THE COMPLEXITY, NOT THE INTELLIGENCE."
 * 
 * Implements the redesigned Cognalyze interview coaching intelligence:
 * 1. Micro-learning scenarios (Learn mode: 30-120s scenario -> A vs B choice -> Why -> Key Idea -> Try It).
 * 2. The "ONE THING TO IMPROVE" Engine:
 *    CLAIM -> EVIDENCE FROM CANDIDATE ANSWER -> REASON -> ACTION.
 *    No fabricated results, no 10-score dump, single highest-impact improvement.
 * 3. Anti-repetition question engine with candidate-specific isolation.
 * 4. Adaptive follow-up generator that listens to candidate's words.
 * 5. Simple Coach diagnosis ("What is missing", "You said", "Try").
 * 6. Conversational mock interview session & grounded final review report.
 * 7. Simplified candidate progress tracking.
 */

import {
  getCandidateAttempts,
  getCandidateSeenQuestionIds,
  recordCandidateAttempt,
  CandidateAttempt
} from "@/lib/skills/candidate-history";
import {
  CompetencyId,
  BehavioralQuestionFull,
  EXPANDED_BEHAVIORAL_QUESTION_BANK
} from "@/lib/skills/behavioral-curriculum";

// ── 1. MICRO-LEARNING DATA MODELS (LEARN MODE) ─────────────────────────────

export interface MicroLearnScenario {
  id: string;
  competencyId: CompetencyId;
  competencyTitle: string;
  icon: string;
  scenario: string;
  optionA: {
    text: string;
    isPreferred: boolean;
  };
  optionB: {
    text: string;
    isPreferred: boolean;
  };
  why: string;
  keyIdea: string;
  tryItQuestion: string;
  sampleQuestionId: string;
}

export const MICRO_LEARN_SCENARIOS: MicroLearnScenario[] = [
  {
    id: "learn-own-1",
    competencyId: "extreme_ownership",
    competencyTitle: "Ownership",
    icon: "🎯",
    scenario: "Your teammate's code caused a critical issue right before a project demo. What would you do?",
    optionA: {
      text: "Explain to the reviewer that the issue was in someone else's module, not mine.",
      isPreferred: false
    },
    optionB: {
      text: "Help identify the root cause, coordinate with my teammate, and make sure we get the demo working.",
      isPreferred: true
    },
    why: "Option B shows ownership because the candidate focuses on moving the problem forward and unblocking the team rather than assigning blame.",
    keyIdea: "When something goes wrong: focus less on who caused it, and more on what you did next.",
    tryItQuestion: "Tell me about a time you handled a difficult problem.",
    sampleQuestionId: "beh-own-1"
  },
  {
    id: "learn-disagree-1",
    competencyId: "disagree_and_commit",
    competencyTitle: "Disagreement",
    icon: "🤝",
    scenario: "You and a teammate disagree on which database to use for your application. How do you resolve it?",
    optionA: {
      text: "Argue until they agree with my choice, or ask an instructor to declare me right.",
      isPreferred: false
    },
    optionB: {
      text: "Build a quick benchmark with sample queries, compare read/write latency with data, and agree on the best fit for our requirements.",
      isPreferred: true
    },
    why: "Option B uses objective data instead of personal ego. It separates technical evaluation from personal pride.",
    keyIdea: "Disagreements should be resolved with data and trade-offs, not volume or authority.",
    tryItQuestion: "Tell me about a time you disagreed with your teammate.",
    sampleQuestionId: "beh-prod-1"
  },
  {
    id: "learn-failure-1",
    competencyId: "handling_failure",
    competencyTitle: "Handling Mistakes",
    icon: "🔄",
    scenario: "You accidentally pushed code that broke the staging environment during a sprint.",
    optionA: {
      text: "Acknowledge the issue immediately, revert the commit to restore staging, and add an automated pre-commit test so it cannot happen again.",
      isPreferred: true
    },
    optionB: {
      text: "Wait quietly to see if anyone notices while trying to patch it secretly.",
      isPreferred: false
    },
    why: "Great engineers own mistakes fast. The best candidates communicate quickly, fix the immediate damage, and build a guardrail against recurrence.",
    keyIdea: "Admitting a mistake quickly with a fix builds trust. Hiding it destroys trust.",
    tryItQuestion: "Tell me about a time something went wrong.",
    sampleQuestionId: "beh-own-2"
  },
  {
    id: "learn-team-1",
    competencyId: "teamwork_conflict",
    competencyTitle: "Difficult Teammates",
    icon: "👥",
    scenario: "A teammate in your group project stops responding to messages and misses a sprint deadline.",
    optionA: {
      text: "Complain to the project mentor immediately and ask to remove them from the group.",
      isPreferred: false
    },
    optionB: {
      text: "Reach out privately for a 1-on-1 chat to understand what is blocking them, and break their remaining tasks into smaller, manageable chunks.",
      isPreferred: true
    },
    why: "Private empathy often reveals hidden blockers (illness, confusion, overwhelm). Constructive leaders resolve conflict directly before escalating.",
    keyIdea: "Approach struggling teammates with curiosity rather than accusation.",
    tryItQuestion: "Tell me about a difficult teammate you worked with.",
    sampleQuestionId: "beh-team-1"
  },
  {
    id: "learn-invent-1",
    competencyId: "invent_and_simplify",
    competencyTitle: "Simplicity & Automation",
    icon: "💡",
    scenario: "Your team spends 2 hours every week manually copying database files and renaming backups.",
    optionA: {
      text: "Accept the manual task as routine maintenance that everyone has to take turns doing.",
      isPreferred: false
    },
    optionB: {
      text: "Write a 30-line cron script that automates the copy, checksums the backup, and sends a Slack notification on success.",
      isPreferred: true
    },
    why: "Eliminating manual toil with simple automation creates engineering leverage and prevents human error.",
    keyIdea: "If you have to do a manual task more than twice, look for a simple way to automate it.",
    tryItQuestion: "Tell me about a project you built to simplify something.",
    sampleQuestionId: "beh-inv-1"
  },
  {
    id: "learn-comm-1",
    competencyId: "dive_deep",
    competencyTitle: "Clear Communication",
    icon: "🗣️",
    scenario: "A non-technical client asks you why their app is running slower than expected.",
    optionA: {
      text: "Explain that our Redis in-memory key-value eviction policy hit maxmemory LRU due to cache misses and high IOPS on the NVMe disk.",
      isPreferred: false
    },
    optionB: {
      text: "Explain using an analogy: 'Think of the server like a kitchen counter. Right now the counter is crowded, so the chef has to walk back to the pantry for every ingredient. We are clearing the counter so orders process instantly.'",
      isPreferred: true
    },
    why: "Speaking without unnecessary jargon shows deep understanding and empathy for your audience.",
    keyIdea: "The smartest engineers explain complex things in simple, visual terms.",
    tryItQuestion: "Explain a technical concept to someone without a technical background.",
    sampleQuestionId: "beh-prod-4"
  }
];

// ── 2. SIMPLE, DIRECT QUESTIONS WITH 4 DIFFICULTY LEVELS ───────────────────

export interface SimpleQuestion {
  id: string;
  competencyId: CompetencyId;
  level: 1 | 2 | 3 | 4;
  levelLabel: "Level 1 · Direct" | "Level 2 · Scenario" | "Level 3 · Reasoning" | "Level 4 · Trade-off";
  question: string;
  coreSkill: string;
  contextTip?: string;
  suggestedStarter?: string;
}

export const SIMPLE_CORE_QUESTIONS: SimpleQuestion[] = [
  // Level 1: Simple direct questions
  {
    id: "sim-q1",
    competencyId: "extreme_ownership",
    level: 1,
    levelLabel: "Level 1 · Direct",
    question: "Tell me about a project you built that you are proud of.",
    coreSkill: "Explaining personal contribution",
    suggestedStarter: "I built a project called... My personal role was..."
  },
  {
    id: "sim-q2",
    competencyId: "disagree_and_commit",
    level: 1,
    levelLabel: "Level 1 · Direct",
    question: "Tell me about a time you disagreed with your teammate.",
    coreSkill: "Handling conflict with data",
    suggestedStarter: "In a team project, we had differing views on... I suggested..."
  },
  {
    id: "sim-q3",
    competencyId: "handling_failure",
    level: 1,
    levelLabel: "Level 1 · Direct",
    question: "Tell me about a time something went wrong.",
    coreSkill: "Accountability & learning",
    suggestedStarter: "During my project, an unexpected issue occurred when... What I did next was..."
  },
  {
    id: "sim-q4",
    competencyId: "teamwork_conflict",
    level: 1,
    levelLabel: "Level 1 · Direct",
    question: "Tell me about a difficult teammate you worked with.",
    coreSkill: "Empathy and collaboration",
    suggestedStarter: "On a team project, one member was struggling to... I decided to..."
  },
  {
    id: "sim-q5",
    competencyId: "dive_deep",
    level: 1,
    levelLabel: "Level 1 · Direct",
    question: "Explain a technical concept to someone without a technical background.",
    coreSkill: "Clear communication without jargon",
    suggestedStarter: "I like to explain this concept using a simple analogy: imagine..."
  },
  // Level 2: Specific scenario
  {
    id: "sim-q6",
    competencyId: "prioritization_pressure",
    level: 2,
    levelLabel: "Level 2 · Scenario",
    question: "Tell me about a time you had multiple competing deadlines at the same time.",
    coreSkill: "Time management and triage",
    suggestedStarter: "During exam week, I had a project delivery and a test on the same day. I prioritized by..."
  },
  {
    id: "sim-q7",
    competencyId: "bias_for_action",
    level: 2,
    levelLabel: "Level 2 · Scenario",
    question: "Tell me about a time you had to learn a technology very quickly to finish a task.",
    coreSkill: "Fast learning and agency",
    suggestedStarter: "Our team needed a feature using a library I had never touched before. I got up to speed by..."
  },
  {
    id: "sim-q8",
    competencyId: "invent_and_simplify",
    level: 2,
    levelLabel: "Level 2 · Scenario",
    question: "Tell me about a time you simplified a messy or repetitive process.",
    coreSkill: "Simplification and automation",
    suggestedStarter: "I noticed that our team spent hours manually doing... So I wrote a simple script to..."
  },
  // Level 3: Follow-up requiring reasoning
  {
    id: "sim-q9",
    competencyId: "handling_failure",
    level: 3,
    levelLabel: "Level 3 · Reasoning",
    question: "Tell me about a technical or design mistake you made. How did you realize it, and how did you resolve it?",
    coreSkill: "Root-cause reasoning",
    suggestedStarter: "Early in development, I made an architectural mistake by choosing... When I noticed the issue..."
  },
  {
    id: "sim-q10",
    competencyId: "disagree_and_commit",
    level: 3,
    levelLabel: "Level 3 · Reasoning",
    question: "Tell me about a time you had to convince someone using data rather than your personal opinion.",
    coreSkill: "Data-driven persuasion",
    suggestedStarter: "Our team debated two design approaches. Instead of arguing, I ran a benchmark that showed..."
  },
  // Level 4: Pressure / Ambiguity / Trade-offs
  {
    id: "sim-q11",
    competencyId: "ethical_integrity",
    level: 4,
    levelLabel: "Level 4 · Trade-off",
    question: "Describe a time you felt pressured to compromise on quality or security to meet an aggressive deadline. What did you do?",
    coreSkill: "Standing firm on standards",
    suggestedStarter: "Right before our deadline, a shortcut was suggested to skip... I explained the risks and offered..."
  },
  {
    id: "sim-q12",
    competencyId: "bias_for_action",
    level: 4,
    levelLabel: "Level 4 · Trade-off",
    question: "Tell me about a time you had to make an important decision with incomplete information.",
    coreSkill: "Calculated risk-taking",
    suggestedStarter: "We had only 24 hours and missing specs. I identified the critical path and decided to..."
  }
];

// ── 3. THE "ONE THING TO IMPROVE" EVALUATION ENGINE ─────────────────────────

export interface SingleImprovementEvaluation {
  evaluationId: string;
  questionId: string;
  answerId: string;
  candidateText: string;
  whatWorked: string;            // One concrete strength
  oneThingToImprove: string;     // The SINGLE highest-impact improvement
  evidenceQuote: string;         // EXACT quote or grounded excerpt from candidate answer
  whyThisMatters: string;        // Short, plain explanation of why interviewers look for this
  tryThis: string;               // One concrete sentence to add or rewrite
  adaptiveFollowUp: string;      // Natural follow-up probe grounded in their actual words
  internalScore: number;         // 0-100 score maintained internally
  internalVerdict: "Strong" | "Good" | "Needs Practice";
  isShortOrEmpty: boolean;
  detailedAnalysis?: {
    situationPresent: boolean;
    personalRolePresent: boolean;
    actionPresent: boolean;
    resultPresent: boolean;
    ownershipRatio: number;
    metricsFound: boolean;
  };
}

/**
 * Clean sentence splitter that preserves content.
 */
function splitIntoSentences(text: string): string[] {
  return text
    .split(/(?<=[.?!])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

/**
 * Core Evidence-Based Evaluator.
 * Adheres strictly to: CLAIM -> EVIDENCE FROM CANDIDATE ANSWER -> REASON -> ACTION.
 * Never invents metrics. Never claims leadership if absent.
 */
export function evaluateSingleImprovement(
  questionTitleOrObj: string | BehavioralQuestionFull | SimpleQuestion,
  answerText: string,
  candidateId: string = "student-demo"
): SingleImprovementEvaluation {
  const clean = (answerText || "").trim();
  const answerId = `ans_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const evaluationId = `eval_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  const questionId = typeof questionTitleOrObj === "string"
    ? "custom-q"
    : questionTitleOrObj.id;

  const questionText = typeof questionTitleOrObj === "string"
    ? questionTitleOrObj
    : (questionTitleOrObj as any).question || (questionTitleOrObj as any).title || "Interview Question";

  // ── 1. GUARD: EMPTY OR TOO SHORT (< 12 words) ──
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length < 12) {
    const quote = clean.length > 0 ? `"${clean}"` : "(No answer provided)";
    return {
      evaluationId,
      questionId,
      answerId,
      candidateText: clean,
      whatWorked: clean.length > 0 ? "You began formulating your thoughts." : "You opened the question.",
      oneThingToImprove: "Not enough evidence yet.",
      evidenceQuote: quote,
      whyThisMatters: "Interviewers need at least 2–3 sentences to understand what happened, what you personally did, and the outcome.",
      tryThis: "Write 2–3 sentences: start with the situation, describe your specific action ('I...'), and share what happened next.",
      adaptiveFollowUp: "Could you walk me through the background of what happened and what your personal role was?",
      internalScore: 25,
      internalVerdict: "Needs Practice",
      isShortOrEmpty: true,
      detailedAnalysis: {
        situationPresent: false,
        personalRolePresent: false,
        actionPresent: false,
        resultPresent: false,
        ownershipRatio: 0,
        metricsFound: false
      }
    };
  }

  const sentences = splitIntoSentences(clean);

  // ── 2. LINGUISTIC EVIDENCE EXTRACTION ──
  const iMatches = clean.match(/\b(i|my|mine|myself|i'd|i've|i'm|i'll)\b/gi) || [];
  const weMatches = clean.match(/\b(we|our|us|team|group|everyone|teammates?)\b/gi) || [];
  const totalPronouns = iMatches.length + weMatches.length;
  const iRatio = totalPronouns > 0 ? Math.round((iMatches.length / totalPronouns) * 100) : 50;

  // Metric detection (numbers, %, time units)
  const metricRegex = /\b(\d+%\b|\d+\s*(hours?|days?|weeks?|months?|ms|seconds?|mins?|minutes?|users?|records?|queries|reqs?|transactions?|k|m|million|lakhs?)|zero\s+errors?|99\.\d+%|\d+\s*stars?)/i;
  const hasMetrics = metricRegex.test(clean);

  // Result / Outcome keywords
  const resultRegex = /\b(result|outcome|decreased|increased|saved|delivered|succeeded|grade|prevented|improved|resolved|launched|deployed|fixed|working|reduced|passed)\b/i;
  const hasResult = resultRegex.test(clean);

  // Hypothetical language check (e.g. "Usually I would", "I think one should", "Generally in this case")
  const hypotheticalRegex = /\b(usually|generally|normally|one should|i would typically|i believe people should|in most cases)\b/i;
  const hasHypothetical = hypotheticalRegex.test(clean);

  // Find representative sentence quotes
  const weSentence = sentences.find(s => /\b(we|our|team|group)\b/i.test(s));
  const iSentence = sentences.find(s => /\b(i|my)\b/i.test(s));
  const resultSentence = sentences.find(s => resultRegex.test(s));
  const hypotheticalSentence = sentences.find(s => hypotheticalRegex.test(s));
  const lastSentence = sentences[sentences.length - 1];

  // ── 3. EXTRACT RELEVANT TOPIC FOR ADAPTIVE NEXT QUESTION ──
  // Extract project/tech words for natural follow-ups
  const techKeywords = clean.match(/\b(react|node|python|java|sql|api|database|auth|backend|frontend|demo|model|pipeline|algorithm|socket|caching|login|service|contract|client|bug|latency)\b/i);
  const mentionedSubject = techKeywords ? techKeywords[0].toLowerCase() : "the project";

  // ── 4. PRIORITY LIST: FIND THE SINGLE MOST USEFUL IMPROVEMENT ──

  let whatWorked = "";
  let oneThingToImprove = "";
  let evidenceQuote = "";
  let whyThisMatters = "";
  let tryThis = "";
  let adaptiveFollowUp = "";
  let internalScore = 70;
  let internalVerdict: "Strong" | "Good" | "Needs Practice" = "Good";

  // Priority 1: Personal Ownership ("I" vs "We")
  if (iRatio < 40 && weMatches.length >= 2) {
    whatWorked = "You clearly explained what the project does and how the team approached the challenge.";
    oneThingToImprove = "I couldn't clearly tell what YOU personally worked on.";
    evidenceQuote = weSentence ? `"${weSentence}"` : `"${clean.slice(0, 80)}..."`;
    whyThisMatters = "Interviewers need to understand your individual contribution, not only the team's work.";
    tryThis = "Add one sentence: 'My specific personal contribution was [describe your code or task].'";
    adaptiveFollowUp = `What part of ${mentionedSubject} did you personally build or code?`;
    internalScore = 55;
    internalVerdict = "Needs Practice";
  }
  // Priority 2: Hypothetical vs Specific past story
  else if (hasHypothetical && !/\b(in my|when i was|during our|last year|for my capstone|in our college)\b/i.test(clean)) {
    whatWorked = "Your communication is thoughtful and structured.";
    oneThingToImprove = "Your answer describes general principles rather than a specific past story.";
    evidenceQuote = hypotheticalSentence ? `"${hypotheticalSentence}"` : `"${sentences[0]}"`;
    whyThisMatters = "Behavioral interviewers evaluate past behavior as the best predictor of future performance.";
    tryThis = "Anchor to a real project: 'In my [semester project / internship], when this happened, I...'";
    adaptiveFollowUp = `Can you tell me about a specific time when this actually happened to you?`;
    internalScore = 60;
    internalVerdict = "Needs Practice";
  }
  // Priority 3: Missing Outcome / Result
  else if (!hasResult) {
    whatWorked = "Strong personal ownership—you used 'I' to clearly identify the actions you took.";
    oneThingToImprove = "The final result and impact of your work is missing.";
    evidenceQuote = lastSentence ? `"${lastSentence}"` : `"${clean.slice(-70)}"`;
    whyThisMatters = "Interviewers want to see what changed because of your action.";
    tryThis = "Add one sentence: 'As a result of this action, [state the final outcome or improvement].'";
    adaptiveFollowUp = `What was the final outcome or impact after you took that action?`;
    internalScore = 68;
    internalVerdict = "Good";
  }
  // Priority 4: Missing Quantifiable Metric or Specific Scale
  else if (!hasMetrics && words.length >= 40) {
    whatWorked = "You walked through the situation and your personal actions clearly.";
    oneThingToImprove = "Add a concrete metric or specific scale to your result.";
    evidenceQuote = resultSentence ? `"${resultSentence}"` : `"${lastSentence}"`;
    whyThisMatters = "Adding numbers (hours saved, users impacted, % improved) makes your achievement concrete and memorable.";
    tryThis = "Add a specific number: 'This saved our team about [X hours / reduced bugs by Y%].'";
    adaptiveFollowUp = `What was the measurable impact or time saved after your fix was deployed?`;
    internalScore = 78;
    internalVerdict = "Good";
  }
  // Priority 5: Already Strong — Add Reflective Polish
  else {
    whatWorked = "Exceptional answer! You clearly stated your personal role ('I'), your concrete action, and the outcome.";
    oneThingToImprove = "Add a brief reflection on what you learned or what you would do differently today.";
    evidenceQuote = resultSentence ? `"${resultSentence}"` : `"${sentences[sentences.length - 1]}"`;
    whyThisMatters = "Top candidates stand out by showing continuous learning and operational maturity.";
    tryThis = "Add one sentence: 'Looking back, one mechanism I would put in place earlier is [preventive step].'";
    adaptiveFollowUp = `Looking back, what is one systemic thing you would do differently today?`;
    internalScore = 90;
    internalVerdict = "Strong";
  }

  return {
    evaluationId,
    questionId,
    answerId,
    candidateText: clean,
    whatWorked,
    oneThingToImprove,
    evidenceQuote,
    whyThisMatters,
    tryThis,
    adaptiveFollowUp,
    internalScore,
    internalVerdict,
    isShortOrEmpty: false,
    detailedAnalysis: {
      situationPresent: sentences.length >= 2,
      personalRolePresent: iRatio >= 45,
      actionPresent: iMatches.length >= 2,
      resultPresent: hasResult,
      ownershipRatio: iRatio,
      metricsFound: hasMetrics
    }
  };
}

// ── 4. COACH MODE DIAGNOSIS ENGINE ──────────────────────────────────────────

export interface CoachDiagnosticResult {
  headline: string;
  whatIsWorking: string;
  missingElement: string;
  quoteEvidence: string;
  actionableSuggestion: string;
  followUpPrompt: string;
}

/**
 * Coach Mode: "I already have an answer. Make it better."
 * Pinpoints the single missing element and gives direct rewrite guidance.
 */
export function evaluateCoachDraft(
  candidateDraft: string,
  targetQuestion?: string
): CoachDiagnosticResult {
  const clean = candidateDraft.trim();
  const words = clean.split(/\s+/).filter(Boolean);

  if (words.length < 10) {
    return {
      headline: "Your draft is too brief to coach effectively.",
      whatIsWorking: "You have started an initial draft.",
      missingElement: "Core context and personal actions.",
      quoteEvidence: clean ? `"${clean}"` : "(Empty text)",
      actionableSuggestion: "Write 2–3 sentences explaining what the project was, what you personally did, and what happened.",
      followUpPrompt: "What was the project, and what specific problem were you trying to solve?"
    };
  }

  const evalResult = evaluateSingleImprovement(targetQuestion || "Interview Question", clean);

  // If role is unclear ("we" vs "I")
  if (evalResult.oneThingToImprove.includes("YOU personally")) {
    return {
      headline: "Your answer is clear, but too general.",
      whatIsWorking: "You clearly explained what the project does and the team's objective.",
      missingElement: "Your specific personal role.",
      quoteEvidence: evalResult.evidenceQuote,
      actionableSuggestion: "Replace 'We made...' or 'We built...' with: 'My specific contribution was...'",
      followUpPrompt: "What exact part of the project or codebase did YOU personally code or own?"
    };
  }

  // If result is missing
  if (evalResult.oneThingToImprove.includes("result") || evalResult.oneThingToImprove.includes("impact")) {
    return {
      headline: "Good initiative, but the ending is missing.",
      whatIsWorking: "You clearly walked through the actions you took with strong personal ownership.",
      missingElement: "The final result or outcome.",
      quoteEvidence: evalResult.evidenceQuote,
      actionableSuggestion: "Add one sentence at the end: 'As a result, ...'",
      followUpPrompt: "What happened after you took those actions? Did it work, save time, or prevent an issue?"
    };
  }

  // If hypothetical
  if (evalResult.oneThingToImprove.includes("principles rather than a specific past story")) {
    return {
      headline: "Sounds like advice rather than your own story.",
      whatIsWorking: "Your reasoning and communication are very clean.",
      missingElement: "A real, concrete past experience.",
      quoteEvidence: evalResult.evidenceQuote,
      actionableSuggestion: "Switch from 'Usually I would...' to: 'In my final-year project, when our teammate...'",
      followUpPrompt: "Can you tell me about a specific project where you lived this exact situation?"
    };
  }

  // Already strong
  return {
    headline: "Strong draft! It just needs a sharp closing reflection.",
    whatIsWorking: "You demonstrated personal agency, concrete actions, and a tangible result.",
    missingElement: "A mature closing takeaway.",
    quoteEvidence: evalResult.evidenceQuote,
    actionableSuggestion: "Add one closing sentence: 'What I learned from this experience was...'",
    followUpPrompt: "Looking back at that project today, what is one thing you would do differently?"
  };
}

// ── 5. ADAPTIVE FOLLOW-UP GENERATOR (INTERVIEW MODE) ────────────────────────

/**
 * Intelligent interviewer follow-up generator that listens to candidate's words.
 * Never asks generic unrelated questions.
 */
export function generateInterviewAdaptiveFollowUp(
  currentQuestion: BehavioralQuestionFull | SimpleQuestion,
  candidateAnswer: string
): string {
  const clean = candidateAnswer.trim();
  const words = clean.toLowerCase();

  // If answer was brief or vague
  if (clean.split(/\s+/).length < 25) {
    return "Could you walk me through the specific steps you personally took during that situation?";
  }

  // If candidate used heavily "we"
  const iMatches = clean.match(/\b(i|my|mine)\b/gi) || [];
  const weMatches = clean.match(/\b(we|our|us|team)\b/gi) || [];
  if (weMatches.length > iMatches.length * 2) {
    return "You explained what the team accomplished. What specifically was YOUR individual contribution to that deliverable?";
  }

  // If candidate mentioned a specific technology or module
  const techMatch = words.match(/\b(auth|database|postgres|mongo|api|redis|websocket|backend|frontend|testing|docker|kubernetes|pipeline)\b/);
  if (techMatch) {
    return `You mentioned working on the ${techMatch[0]}. What was the hardest technical challenge or trade-off you encountered there?`;
  }

  // If candidate mentioned a disagreement or conflict
  if (words.includes("disagree") || words.includes("argument") || words.includes("debate") || words.includes("conflict")) {
    return "How did your teammate initially respond to your counter-proposal, and how did you keep the conversation constructive?";
  }

  // If candidate mentioned a failure or bug
  if (words.includes("bug") || words.includes("crash") || words.includes("error") || words.includes("mistake") || words.includes("broke")) {
    return "What automated safeguard or mechanism did you add afterward so that exact issue could never happen again?";
  }

  // If candidate did not mention metrics or outcome
  if (!/\b(\d+%|\d+\s*(hours?|days?|users?|records?)|zero\s+errors?|improved|decreased|saved)\b/i.test(clean)) {
    return "What was the final measurable result or outcome once your work was completed?";
  }

  // Default deep probe
  return "Looking back at that experience today, what is one thing you would do differently?";
}

// ── 6. ANTI-REPETITION QUESTION ENGINE ──────────────────────────────────────

/**
 * Retrieves the next fresh question for a candidate, guaranteeing:
 * 1. Checks candidate's seen history.
 * 2. Excludes exact matches and recently seen questions.
 * 3. Does not serve the same question between Practice and Interview.
 * 4. Adapts based on candidate's weak spots if specified.
 */
export function getNextCandidateQuestion(
  candidateId: string,
  mode: "practice" | "interview" | "coach" = "practice",
  options?: {
    competencyId?: string;
    targetWeakness?: string;
    targetLevel?: 1 | 2 | 3 | 4;
    excludeIds?: string[];
  }
): BehavioralQuestionFull {
  const seenIds = getCandidateSeenQuestionIds(candidateId, "behavioral_hr");
  const extraExcludes = new Set(options?.excludeIds || []);

  let pool = [...EXPANDED_BEHAVIORAL_QUESTION_BANK];

  // Filter out any explicitly excluded IDs
  pool = pool.filter(q => !extraExcludes.has(q.id));

  // If competency filter requested
  if (options?.competencyId && options.competencyId !== "all") {
    const compFiltered = pool.filter(q => q.competency_id === options.competencyId);
    if (compFiltered.length > 0) pool = compFiltered;
  }

  // Filter out questions the candidate has already seen in recent attempts
  const unseenPool = pool.filter(q => !seenIds.has(q.id));

  // If all questions have been seen, recycle from the least recently used
  const finalPool = unseenPool.length > 0 ? unseenPool : pool;

  // Pick a fresh question with random variation
  const selectedIndex = Math.floor(Math.random() * finalPool.length);
  return finalPool[selectedIndex] || EXPANDED_BEHAVIORAL_QUESTION_BANK[0];
}

// ── 7. CANDIDATE PROGRESS & WEAK SPOT SUMMARY ───────────────────────────────

export interface SimpleCandidateProgress {
  candidateId: string;
  totalAnswers: number;
  gettingBetterAt: string[];
  workOnNext: {
    title: string;
    reason: string;
    recommendedQuestion: BehavioralQuestionFull;
  };
  improvementDetected?: {
    earlier: string;
    now: string;
  };
  recentSessionsCount: number;
}

/**
 * Computes simple, actionable progress for the candidate.
 * No 15-rubric matrix. Plain English:
 * "You're getting better at: ... Work on next: ..."
 */
export function getSimpleCandidateProgress(candidateId: string): SimpleCandidateProgress {
  const attempts = getCandidateAttempts(candidateId, "behavioral_hr");

  const totalAnswers = attempts.length;

  // Analyze historical ownership shifts across answers (Q1 vs Qn)
  let improvementDetected: { earlier: string; now: string } | undefined;

  if (attempts.length >= 3) {
    const oldest = attempts.slice(-2);
    const newest = attempts.slice(0, 2);

    const oldHadOwnershipGap = oldest.some(a => (a.weaknesses || []).some(w => w.toLowerCase().includes("personal") || w.toLowerCase().includes("'we'")));
    const newHasOwnership = newest.some(a => (a.strengths || []).some(s => s.toLowerCase().includes("personal") || s.toLowerCase().includes("ownership")));

    if (oldHadOwnershipGap && newHasOwnership) {
      improvementDetected = {
        earlier: "You mostly described team actions ('we decided', 'the team built').",
        now: "You clearly describe your individual contribution ('I implemented', 'I took ownership')."
      };
    }
  }

  // Determine what candidate is getting better at
  const gettingBetterAt: string[] = [];
  if (totalAnswers >= 1) gettingBetterAt.push("Structuring answers with clear problem context");
  if (totalAnswers >= 2) gettingBetterAt.push("Directly addressing interviewer questions without hesitation");
  if (totalAnswers >= 4) gettingBetterAt.push("Highlighting technical interventions clearly");
  if (gettingBetterAt.length === 0) gettingBetterAt.push("Starting your interview journey");

  // Determine single highest-impact weak spot
  let weakSpotTitle = "Personal Role Specificity";
  let weakSpotReason = "Your project explanations are clear, but your individual contribution could stand out more sharply.";
  let targetCompetency: CompetencyId = "extreme_ownership";

  // Check recent weaknesses recorded
  const allRecentWeaknesses = attempts.slice(0, 5).flatMap(a => a.weaknesses || []);
  const joinedWeaknesses = allRecentWeaknesses.join(" ").toLowerCase();

  if (joinedWeaknesses.includes("metric") || joinedWeaknesses.includes("quantifiable")) {
    weakSpotTitle = "Adding Measurable Impact";
    weakSpotReason = "Your actions are clear, but interviewers want to see concrete numbers (time saved, uptime, or users).";
    targetCompetency = "invent_and_simplify";
  } else if (joinedWeaknesses.includes("disagree") || joinedWeaknesses.includes("conflict")) {
    weakSpotTitle = "Navigating Disagreement with Data";
    weakSpotReason = "Practice demonstrating data-driven persuasion when collaborating with teammates.";
    targetCompetency = "disagree_and_commit";
  }

  const recommendedQuestion = getNextCandidateQuestion(candidateId, "practice", {
    competencyId: targetCompetency
  });

  return {
    candidateId,
    totalAnswers,
    gettingBetterAt,
    workOnNext: {
      title: weakSpotTitle,
      reason: weakSpotReason,
      recommendedQuestion
    },
    improvementDetected,
    recentSessionsCount: attempts.length
  };
}

// ── 8. INTERVIEW FINAL REPORT GENERATOR ─────────────────────────────────────

export interface GroundedInterviewReview {
  whatYouDidWell: Array<{
    point: string;
    quote?: string;
  }>;
  whatToWorkOn: Array<{
    point: string;
    quote?: string;
  }>;
  overallObservation: string;
  recommendedNextPractice: {
    topic: string;
    reason: string;
    suggestedQuestionId: string;
    questionText: string;
  };
}

/**
 * Generates an end-of-interview report strictly grounded in candidate answers.
 * Shows actual excerpts, 2-3 strengths, 2-3 improvements, and next recommended practice.
 */
export function generateGroundedInterviewReview(
  evaluations: SingleImprovementEvaluation[]
): GroundedInterviewReview {
  if (!evaluations || evaluations.length === 0) {
    return {
      whatYouDidWell: [
        { point: "Participated in the interview session and attempted all questions." }
      ],
      whatToWorkOn: [
        { point: "Provide more detailed responses with personal 'I' actions and measurable outcomes." }
      ],
      overallObservation: "Keep practicing common behavioral questions to build fluency.",
      recommendedNextPractice: {
        topic: "Ownership & Personal Contribution",
        reason: "Practice clearly separating your personal technical actions from general team work.",
        suggestedQuestionId: "beh-own-1",
        questionText: "Tell me about a project you are proud of."
      }
    };
  }

  // 1. Extract what worked across answers
  const whatYouDidWell: Array<{ point: string; quote?: string }> = [];
  const strongEvals = evaluations.filter(e => !e.isShortOrEmpty);

  for (const e of strongEvals) {
    if (whatYouDidWell.length >= 3) break;
    whatYouDidWell.push({
      point: e.whatWorked,
      quote: e.evidenceQuote
    });
  }

  if (whatYouDidWell.length === 0) {
    whatYouDidWell.push({
      point: "You communicated your ideas and attempted each scenario.",
      quote: evaluations[0]?.candidateText ? `"${evaluations[0].candidateText.slice(0, 60)}..."` : undefined
    });
  }

  // 2. Extract highest-impact improvements across answers
  const whatToWorkOn: Array<{ point: string; quote?: string }> = [];
  for (const e of evaluations) {
    if (whatToWorkOn.length >= 3) break;
    whatToWorkOn.push({
      point: e.oneThingToImprove,
      quote: e.evidenceQuote
    });
  }

  // 3. Recommended next practice
  const highestNeedEval = evaluations.find(e => e.internalScore < 70) || evaluations[0];
  const recommendedNextPractice = {
    topic: highestNeedEval?.oneThingToImprove.includes("YOU personally")
      ? "Individual Contribution & Ownership"
      : highestNeedEval?.oneThingToImprove.includes("result")
      ? "Demonstrating Measurable Results"
      : "Structuring Real Past Experiences",
    reason: highestNeedEval?.whyThisMatters || "Focusing on this single area will make your responses significantly more compelling to interviewers.",
    suggestedQuestionId: highestNeedEval?.questionId || "sim-q1",
    questionText: "Tell me about a time you handled a difficult problem."
  };

  const overallObservation = `You answered ${evaluations.length} scenarios. Your communication was easy to follow. Your primary focus for next time should be ${recommendedNextPractice.topic.toLowerCase()}.`;

  return {
    whatYouDidWell,
    whatToWorkOn,
    overallObservation,
    recommendedNextPractice
  };
}
