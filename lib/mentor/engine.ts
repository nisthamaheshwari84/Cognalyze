/**
 * COGNALYZE MENTOR — ADAPTIVE ENGINE
 * Core learning loop orchestrator:
 * Natural Intent Understanding -> Silent Student DNA Ingestion ->
 * Adaptive Teaching -> Progressive Hint Ladder -> Explain-Do-Defend ->
 * Decoupled Structured Evaluation & Evidence Generation.
 */

import {
  LearningTwinState,
  ConversationalMessage,
  TeachingLoopStep,
  HintLevel,
  MentorEvidenceRecord,
  LanguageCode,
  StructuredEvaluationResult,
  IntentAnalysisResult,
  MentorTeachingAction,
  MentorDecisionContext,
  VisualCanvasPayload,
  LearningSurfaceState,
  SessionLearningState,
  ResolvedReference,
  InterruptionContext,
  SpokenTurnPayload
} from "./types";
import { KNOWLEDGE_GRAPH } from "./knowledge-graph";
import { groqFetch } from "../groq";
import { analyzeStudentIntent } from "./intent-engine";
import { getSilentStudentContext, buildSilentBriefingDirective } from "./context-retriever";
import { evaluateStudentAnswer } from "./evaluator";
import { resolveContextualReferences } from "./reference-resolver";
import { checkPrerequisites } from "./prerequisite-graph";
import {
  analyzeStudentReasoningState,
  selectMentorAction,
  dispatchMentorActionTurn,
  generateDeterministicTeachingTurn
} from "./interaction-engine";

interface ProcessTurnResult {
  mentorResponse: string;
  spokenResponse?: string;
  visualCanvas?: VisualCanvasPayload;
  learningSurface?: LearningSurfaceState;
  sessionLearningState?: SessionLearningState;
  resolvedReferences?: ResolvedReference[];
  waitTimeoutSeconds?: number;
  updatedState: Partial<LearningTwinState>;
  availableHints?: {
    currentLevel: HintLevel;
    nextHintText?: string;
    canRequestNext: boolean;
  };
  evidenceGenerated?: MentorEvidenceRecord;
  evaluation?: StructuredEvaluationResult;
  whyExplanation?: string;
  intent?: IntentAnalysisResult;
  teachingAction?: MentorTeachingAction;
  decisionContext?: MentorDecisionContext;
}

/**
 * Detect lightweight confusion signals in student messages
 */
export function detectConfusion(
  userText: string,
  state: LearningTwinState
): { isConfused: boolean; signalType?: "re_explanation_request" | "contradiction" | "guessing" } {
  const lower = userText.toLowerCase().trim();

  // Explicit confusion phrases (English & Hinglish)
  const confusionPhrases = [
    "i don't understand",
    "i dont understand",
    "confused",
    "not getting it",
    "samajh nahi aaya",
    "samajh nahi aa raha",
    "kuch samajh nahi aaya",
    "doubt hai",
    "phir se batao",
    "fir se batao",
    "explain again",
    "lost",
    "i'm lost",
    "what do you mean"
  ];

  if (confusionPhrases.some((phrase) => lower.includes(phrase))) {
    return { isConfused: true, signalType: "re_explanation_request" };
  }

  // Guessing signals (e.g. "maybe?", "i guess", "probably?")
  if (lower.startsWith("maybe") || lower.startsWith("i think maybe") || lower.includes("random guess")) {
    return { isConfused: true, signalType: "guessing" };
  }

  return { isConfused: false };
}

/**
 * Construct the system persona prompt tailored to candidate goal, silent DNA context, and language
 */
export function buildMentorSystemPrompt(
  state: LearningTwinState,
  intent?: IntentAnalysisResult
): string {
  const { activeGoal, activeConceptId, currentLoopStep, currentMode, dontGiveAnswerMode, currentHintLevel, studentId } = state;
  const node = KNOWLEDGE_GRAPH[activeConceptId] || KNOWLEDGE_GRAPH["sys-networking"];

  // Language directive
  const activeLang = intent?.language || activeGoal.preferredLanguage;
  let languageGuideline = "";
  if (activeLang === "hi") {
    languageGuideline = `LANGUAGE INSTRUCTION (HINDI):
Respond in clear, natural Hindi (Devanagari script or conversational Hindi).
CRITICAL RULE: Keep ALL technical terms in English (e.g. "Load Balancer", "Caching", "Sharding", "Replication", "Latency", "Throughput", "Index", "TCP handshake", "B+ Tree"). Never mechanically translate technical terminology into awkward Hindi.`;
  } else if (activeLang === "hinglish") {
    languageGuideline = `LANGUAGE INSTRUCTION (HINGLISH):
Respond in natural, engaging conversational Hinglish (Roman script, everyday Indian developer conversational style).
Example tone: "Agar ek single server pe 10 million requests aa jayein, toh server crash ho sakta hai. Isko handle karne ke liye hum multiple servers lagate hain, par traffic divide kaun karega? Wahi Load Balancer ka kaam hai."
CRITICAL RULE: Keep ALL technical terms in English (e.g. "Load Balancer", "Database Sharding", "Replication", "Cache Miss", "Latency"). Do NOT use robotic textbook language.`;
  } else {
    languageGuideline = `LANGUAGE INSTRUCTION (ENGLISH):
Respond in clear, concise, conversational technical English. Be direct, warm, and engaging.`;
  }

  // Silent Student DNA Context
  const silentContext = getSilentStudentContext(studentId || "student-demo");
  const silentBriefing = buildSilentBriefingDirective(silentContext);

  const topic = intent?.topic || node.title;
  const isInterview = intent?.intent === "interview" || currentMode === "interview";
  const forbidAnswers = dontGiveAnswerMode || intent?.forbidDirectAnswer || intent?.assistancePreference === "no_answers";

  return `You are Cognalyze Mentor — the intelligent, adaptive learning environment of Cognalyze.
You are NOT a generic chatbot, course lecturer, or quiz generator.
You are an expert engineering mentor who:
1. Listens actively and understands the learner's demonstrated state.
2. Teaches through Socratic inquiry, short progressive steps, real-world trade-offs, and practical application.
3. NEVER dumps giant walls of text. Keep explanations under 2-3 crisp paragraphs or bullet points, then immediately ask a focused interactive question.
4. Detects confusion immediately and steps back constructively with analogies without shaming.
5. Employs the EXPLAIN -> DO -> DEFEND loop: after teaching, make the student design/code/explain, then challenge their architectural or algorithmic decisions.
6. ${isInterview ? "INTERVIEWER PERSONA ACTIVE: Ask realistic technical interview questions, introduce constraints, probe edge cases, and debrief evidence-based observations at the end." : "MENTOR PERSONA ACTIVE: Guide, teach, challenge, and scaffold understanding."}

SILENT STUDENT DNA BRIEFING (Use silently — do NOT dump this list onto the student):
${silentBriefing}

ACTIVE INTENT CONTEXT:
- Active Topic: ${topic}
- Intent: ${intent?.intent || "learning"}
- Depth: ${intent?.depth || "intermediate"}
- Time Budget: ${intent?.timeBudgetMinutes ? `${intent.timeBudgetMinutes} minutes` : "Standard"}
- "Don't Give Me The Answer" Constraint: ${forbidAnswers ? "STRICTLY ACTIVE (Refuse complete code or full solutions; provide guiding questions and conceptual clues only)" : "OFF"}
- Active Hint Level: ${currentHintLevel}/5

${languageGuideline}

RESPONSE FORMAT:
- Acknowledge what the learner said in 1 sentence.
- Provide the core insight / analogy / Socratic guidance concisely.
- Always end with ONE specific, thought-provoking question or challenge for the student to solve or defend.
- NEVER use generic cheerleader praise ("Great question!", "Awesome job!", "You are a rockstar!"). Be professional, warm, and intellectual.`;
}

/**
 * Process a conversational turn with intent understanding, silent context,
 * action selection via Mentor Interaction Engine, reference resolution, and decoupled evaluation.
 */
export async function processMentorTurn(
  messages: ConversationalMessage[],
  state: LearningTwinState,
  userMessage: string,
  interruptionContext?: InterruptionContext,
  sessionLearningState?: SessionLearningState
): Promise<ProcessTurnResult> {
  const activeNode = KNOWLEDGE_GRAPH[state.activeConceptId] || KNOWLEDGE_GRAPH["sys-networking"];

  // 1. Contextual Reference Resolution ("yeh", "woh", "this", "upar wala", "pointer")
  const refResolution = resolveContextualReferences(userMessage, {
    activeTopic: sessionLearningState?.currentTopic || state.activeGoal?.title || state.activeGoal?.domain || "Engineering",
    surfaceState: sessionLearningState?.surfaceState,
    recentMessages: messages
  });
  const normalizedUserText = refResolution.resolvedText;

  // Derive previous intent to preserve multi-turn topic & task context
  const lastMentorMsg = [...messages].reverse().find((m) => m.metadata?.intent || m.metadata?.topic);
  const previousIntent: any = sessionLearningState?.currentTopic
    ? {
        intent: "learning",
        topic: sessionLearningState.currentTopic,
        taskType: sessionLearningState.taskType,
        depthLevel: sessionLearningState.depthLevel,
        assistancePreference: sessionLearningState.assistanceLevel,
        language: state.activeGoal?.preferredLanguage || "hinglish"
      }
    : lastMentorMsg?.metadata?.topic
    ? {
        intent: lastMentorMsg.metadata.intent || "learning",
        topic: lastMentorMsg.metadata.topic,
        language: state.activeGoal?.preferredLanguage || "hinglish"
      }
    : undefined;

  // 2. Analyze user intent and constraints from normalized text with context
  const intent = analyzeStudentIntent(normalizedUserText, previousIntent);

  // 3. Off-Topic Guardrail: return immediate polite redirect
  if (intent.isOffTopic && intent.redirectMessage) {
    return {
      mentorResponse: intent.redirectMessage,
      spokenResponse: intent.redirectMessage,
      updatedState: { lastActiveAt: new Date().toISOString() },
      intent,
      teachingAction: "STOP"
    };
  }

  // 4. Progressive hint level escalation check
  const lowerUser = normalizedUserText.toLowerCase().trim();
  const isHintRequest =
    intent.assistancePreference === "hint_only" ||
    lowerUser.includes("hint") ||
    lowerUser.includes("clue") ||
    lowerUser.includes("madad") ||
    lowerUser === "give me a hint" ||
    lowerUser === "i need a hint";

  let newHintLevel = state.currentHintLevel;
  if (isHintRequest && newHintLevel < 5) {
    newHintLevel = (newHintLevel + 1) as HintLevel;
  }

  // 5. Ingest Silent Student DNA
  const silentContext = getSilentStudentContext(state.studentId || "student-demo");
  const silentBriefing = buildSilentBriefingDirective(silentContext);

  // 6. Prerequisite Check & Dependency Reasoning
  const prereqCheck = checkPrerequisites(
    intent.topic,
    silentContext.demonstratedCapabilities,
    [normalizedUserText]
  );

  // 7. Analyze Student Reasoning & Misconception State
  const reasoning = analyzeStudentReasoningState(normalizedUserText, messages);

  // 8. Select Teaching Action from 33-Action Space (MEI Hierarchy)
  let decision = selectMentorAction(
    normalizedUserText,
    intent,
    silentContext,
    state,
    reasoning,
    messages
  );

  // If missing foundational prerequisite detected and student is struggling
  if (prereqCheck.hasMissingPrerequisite && (reasoning.isStuck || reasoning.hasMisconception || decision.selectedAction === "PROBE")) {
    decision = {
      ...decision,
      selectedAction: "REVISIT_PREREQUISITE",
      minimumInterventionRationale: prereqCheck.rationale || "Stepping back to foundational prerequisite."
    };
  }

  // 9. Assemble conversation history for the turn
  const history = messages.slice(-6).map((m) => ({
    role: m.role === "mentor" ? ("assistant" as const) : ("user" as const),
    content: m.content
  }));
  history.push({ role: "user", content: normalizedUserText });

  // 10. Generate action-driven conversational turn (SpokenTurnPayload with Adaptive Learning Surface)
  const activeLanguage = intent.language || state.activeGoal.preferredLanguage || "en";
  const spokenTurn = await dispatchMentorActionTurn(
    normalizedUserText,
    decision,
    intent,
    activeLanguage,
    silentBriefing,
    history,
    interruptionContext,
    sessionLearningState?.surfaceState,
    prereqCheck
  );

  // 11. Decoupled Structured Evaluation (runs separately from text generation)
  const { evaluation, evidence } = evaluateStudentAnswer(
    normalizedUserText,
    intent.topic || activeNode.title,
    newHintLevel,
    intent,
    state.studentId
  );

  // 12. Update Session Learning State
  const updatedSessionLearningState: SessionLearningState = {
    sessionId: sessionLearningState?.sessionId || "sess-" + Date.now(),
    currentGoal: state.activeGoal?.title || "Master Engineering Concepts",
    currentTopic: intent.topic,
    taskType: intent.taskType || "concept_learning",
    knownConcepts: Array.from(new Set([...(sessionLearningState?.knownConcepts || []), ...(silentContext.demonstratedCapabilities || [])])),
    uncertainConcepts: reasoning.hasMisconception && reasoning.misconceptionSummary ? [...(sessionLearningState?.uncertainConcepts || []), reasoning.misconceptionSummary] : (sessionLearningState?.uncertainConcepts || []),
    activeMisconceptions: reasoning.hasMisconception && reasoning.misconceptionSummary ? [reasoning.misconceptionSummary] : [],
    currentAttempt: reasoning.attemptSummary,
    reasoningQuality: reasoning.demonstratedInsight ? "intermediate" : "novice",
    confidence: state.concepts[state.activeConceptId]?.confidenceScore || 70,
    assistanceLevel: intent.assistancePreference,
    currentDifficulty: "medium",
    depthLevel: intent.depthLevel || "L1_simple",
    currentLearningObjective: `Master ${intent.topic} with deep technical reasoning and zero memorization`,
    surfaceState: spokenTurn.learningSurface || {
      surfaceType: "concept",
      title: intent.topic
    },
    activeReferences: refResolution.resolvedReferences,
    prerequisiteStack: prereqCheck.hasMissingPrerequisite && prereqCheck.missingPrerequisiteId ? [prereqCheck.missingPrerequisiteId] : []
  };

  return {
    mentorResponse: spokenTurn.spokenResponse,
    spokenResponse: spokenTurn.spokenResponse,
    visualCanvas: spokenTurn.visualCanvas,
    learningSurface: spokenTurn.learningSurface,
    sessionLearningState: updatedSessionLearningState,
    resolvedReferences: refResolution.resolvedReferences,
    waitTimeoutSeconds: spokenTurn.waitTimeoutSeconds,
    updatedState: {
      currentHintLevel: newHintLevel,
      dontGiveAnswerMode: state.dontGiveAnswerMode || intent.forbidDirectAnswer,
      lastActiveAt: new Date().toISOString()
    },
    availableHints: {
      currentLevel: newHintLevel,
      nextHintText: newHintLevel < 5 ? getHintText(activeNode, (newHintLevel + 1) as HintLevel) : undefined,
      canRequestNext: newHintLevel < 5 && !(state.dontGiveAnswerMode || intent.forbidDirectAnswer)
    },
    evidenceGenerated: evidence,
    evaluation,
    whyExplanation: evidence?.whyExplanation || evaluation?.whyExplanation,
    intent,
    teachingAction: decision.selectedAction,
    decisionContext: decision
  };
}

/**
 * Retrieve hint from knowledge node
 */
export function getHintText(node: any, level: HintLevel): string {
  switch (level) {
    case 1:
      return node.hintLadder?.level1 || "Consider the physical data path and bottlenecks.";
    case 2:
      return node.hintLadder?.level2 || "Direction: Check how state vs statelessness impacts scale.";
    case 3:
      return node.hintLadder?.level3 || "Approach: Use an in-memory layer or partitioning.";
    case 4:
      return node.hintLadder?.level4 || "Partial Architecture: Cache-Aside with Write-Through or Index Seek.";
    case 5:
      return node.hintLadder?.level5 || "Full Solution: Complete distributed pattern with failover.";
    default:
      return "Take your time to analyze the problem requirements.";
  }
}

/**
 * Fallback deterministic response for zero-downtime offline scenarios
 */
function generateDeterministicResponse(
  userText: string,
  state: LearningTwinState,
  hintLevel: HintLevel,
  isConfused: boolean,
  intent?: IntentAnalysisResult
): string {
  const node = KNOWLEDGE_GRAPH[state.activeConceptId] || KNOWLEDGE_GRAPH["sys-networking"];
  const topic = intent?.topic || node.title;
  const isHinglish = (intent?.language || state.activeGoal.preferredLanguage) === "hinglish";
  const isHindi = (intent?.language || state.activeGoal.preferredLanguage) === "hi";

  if (isConfused || intent?.strategyShiftTrigger) {
    if (isHinglish) {
      return `Ek basic analogy se samajhte hain. Maan lijiye aap ek busy restaurant me hain aur saare orders sirf ek hi chef ko ja rahe hain. Chef slow ho jayega. Load Balancer ka role ek Head Waiter jaisa hota hai jo orders ko evenly 5 alag chefs me distribute karta hai.\n\nAb aap batayein: agar ek chef ka stove kharab ho jaye, toh Head Waiter ko kya karna chahiye?`;
    }
    if (isHindi) {
      return `एक सरल उदाहरण से समझते हैं। मान लीजिए एक व्यस्त रेस्टोरेंट में सभी ऑर्डर केवल एक ही शेफ को जा रहे हैं। Load Balancer का कार्य एक हेड वेटर जैसा है जो ऑर्डर्स को 5 अलग-अलग शेफ्स में वितरित करता है।\n\nबताएं: यदि कोई एक शेफ उपलब्ध न हो, तो Load Balancer को क्या करना चाहिए?`;
    }
    return `Let's take a simple analogy. Imagine a busy restaurant where every order goes to a single chef. That chef quickly becomes a bottleneck. A Load Balancer acts like a head waiter distributing incoming tickets across 5 different chefs.\n\nNow consider: what should the load balancer do if one server (or chef) suddenly starts failing health checks?`;
  }

  if (intent?.intent === "interview") {
    if (isHinglish) {
      return `Great, chaliye **${topic}** pe aapka mock interview shuru karte hain.\n\n**Scenario:** Maan lijiye aapko ek URL Shortener (like TinyURL) design karna hai jo daily 100 Million read requests handle karega.\n\nAap requirements clarify karne se shuru karenge ya direct architecture design karenge? Aapka pehla step kya hoga?`;
    }
    return `Let's conduct a realistic interview round focused on **${topic}**.\n\n**Problem:** You are tasked with designing a URL shortening service (like Bitly) supporting 100 Million daily active requests with low read latency.\n\nBefore jumping into architecture, how would you clarify functional and non-functional requirements? What is your first step?`;
  }

  if (intent?.intent === "problem_solving") {
    if (isHinglish) {
      return `Aap **${topic}** solve kar rahe hain. Solution dekhne se pehle, batayein:\n\nAapne abhi tak kya approach try kiya hai, aur time complexity ka constraint kya hai?`;
    }
    return `Let's work through **${topic}** together.\n\nBefore looking at code, tell me: what approach have you tried so far, and what are the time or space constraints?`;
  }

  if (hintLevel > 0) {
    const hint = getHintText(node, hintLevel);
    return isHinglish
      ? `💡 **Hint Level ${hintLevel}/5:**\n${hint}\n\nAb is clue ko dhyan me rakhkar apna approach batayein.`
      : `💡 **Hint Level ${hintLevel}/5:**\n${hint}\n\nTaking this clue into account, what would your next step be?`;
  }

  return isHinglish
    ? `Bahut valid point! **${topic}** me scalability ensure karne ke liye trade-offs samajhna critical hai.\n\nAb agla scenario: Maan lijiye traffic achanak 10x badh jata hai aur database CPU 95% touch kar raha hai. Aap reads ko cache karenge ya writes ko shard karenge, aur kyun?`
    : `A solid architectural observation. In **${topic}**, evaluating trade-offs is what separates memorization from engineering.\n\nNow consider this scenario: your traffic suddenly spikes 10x and database CPU hits 95%. Would you introduce a cache first or shard the database, and why?`;
}
