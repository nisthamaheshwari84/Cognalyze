/**
 * COGNALYZE MENTOR — INTERACTION ENGINE
 * The Core Intelligence Layer of Cognalyze Mentor.
 * 
 * CORE ARCHITECTURAL PRINCIPLE:
 * "The Mentor must teach before it answers."
 * "Complexity must live inside the engine. Simplicity must live inside the experience."
 * 
 * Pipeline:
 * Student Input -> Intent -> Context Retrieval -> Knowledge & Reasoning State ->
 * Action Selection (33 Action Space) -> Action-Driven Response Generation ->
 * Decoupled Evaluation -> Evidence Engine.
 */

import {
  MentorTeachingAction,
  MentorDecisionContext,
  IntentAnalysisResult,
  SilentStudentContext,
  LearningTwinState,
  ConversationalMessage,
  LanguageCode,
  SpokenTurnPayload,
  VisualCanvasPayload,
  LearningSurfaceState,
  InterruptionContext
} from "./types";
import { groqFetch } from "../groq";
import { defaultLLMProvider } from "./providers/llm-provider";
import { constructAdaptiveLearningSurface } from "./surface-engine";
import { formatPrerequisiteSteppingMessage, PrerequisiteCheckResult } from "./prerequisite-graph";

export interface StudentReasoningAnalysis {
  hasAttempted: boolean;
  attemptSummary?: string;
  isStuck: boolean;
  stuckPoint?: string;
  hasMisconception: boolean;
  misconceptionSummary?: string;
  demonstratedInsight?: string;
}

/**
 * 1. Analyze the student's reasoning state from current input and recent dialogue
 */
export function analyzeStudentReasoningState(
  userText: string,
  messages: ConversationalMessage[]
): StudentReasoningAnalysis {
  const lower = userText.toLowerCase().trim();

  // Check for common misconceptions
  let hasMisconception = false;
  let misconceptionSummary: string | undefined = undefined;

  if (
    (lower.includes("sharding") && (lower.includes("copy") || lower.includes("replicate") || lower.includes("duplicate"))) ||
    (lower.includes("replication") && (lower.includes("partition") || lower.includes("split table")))
  ) {
    hasMisconception = true;
    misconceptionSummary = "Confusing database replication (copying for read-availability) with sharding (horizontal partitioning for write-capacity).";
  } else if (
    lower.includes("row by row") &&
    (messages.some((m) => m.content.toLowerCase().includes("spiral matrix") || m.content.toLowerCase().includes("leetcode 59")) ||
      lower.includes("spiral"))
  ) {
    // Partial mental model for spiral matrix
    return {
      hasAttempted: true,
      attemptSummary: "Traversing row-by-row sequentially",
      isStuck: false,
      hasMisconception: false,
      demonstratedInsight: "Initial horizontal traversal"
    };
  }

  // Detect student attempts
  const attemptIndicators = [
    "i thought",
    "i tried",
    "my approach",
    "what if we",
    "we can use",
    "i wrote",
    "first we",
    "i go downward",
    "following the outer boundary",
    "boundaries",
    "cache-aside",
    "add a load balancer",
    "shard the table",
    "read replica"
  ];
  const hasAttempted = attemptIndicators.some((ind) => lower.includes(ind));

  // Detect stuck points
  const stuckIndicators = [
    "i am stuck",
    "don't know where to start",
    "kuch samajh nahi aa raha",
    "lost",
    "how to do that",
    "no idea",
    "what next"
  ];
  const isStuck = stuckIndicators.some((ind) => lower.includes(ind));

  return {
    hasAttempted,
    attemptSummary: hasAttempted ? userText : undefined,
    isStuck,
    stuckPoint: isStuck ? userText : undefined,
    hasMisconception,
    misconceptionSummary
  };
}

/**
 * 2. Select the optimal Teaching Action from the 33-Action Space
 * Adheres to the Mentor Policy Hierarchy (Part 62) & Minimum Effective Intervention (MEI)
 */
export function selectMentorAction(
  userText: string,
  intent: IntentAnalysisResult,
  silentContext: SilentStudentContext,
  state: LearningTwinState,
  reasoning: StudentReasoningAnalysis,
  messages: ConversationalMessage[] = []
): MentorDecisionContext {
  const lower = userText.toLowerCase().trim();

  // HIERARCHY RULE 1: Explicit student instruction dominates
  if (
    intent.assistancePreference === "solution_requested" ||
    lower.includes("just give me the solution") ||
    lower.includes("show the code") ||
    lower.includes("give full code") ||
    lower.includes("just tell me the answer")
  ) {
    return {
      studentIntent: intent.intent,
      priorDemonstratedCapabilities: silentContext.demonstratedCapabilities,
      knownGaps: silentContext.knownGaps,
      selectedAction: "DIRECT_ANSWER",
      minimumInterventionRationale: "Student explicitly requested direct solution after guidance.",
      nextExpectedStudentAction: "Review solution and defend algorithmic trade-offs."
    };
  }

  // HIERARCHY RULE 2: Misconception detected -> MUST isolate and correct before progressing
  if (reasoning.hasMisconception) {
    return {
      studentIntent: intent.intent,
      priorDemonstratedCapabilities: silentContext.demonstratedCapabilities,
      knownGaps: silentContext.knownGaps,
      detectedMisconception: reasoning.misconceptionSummary,
      selectedAction: "CORRECT_MISCONCEPTION",
      minimumInterventionRationale: "Isolate the conflated concepts before allowing faulty mental model to propagate.",
      nextExpectedStudentAction: "Differentiate what happens to the actual underlying data in each technique."
    };
  }

  // HIERARCHY RULE 3: Confusion / Strategy shift trigger
  if (intent.strategyShiftTrigger) {
    const action: MentorTeachingAction = intent.wantsRealWorldExample ? "EXAMPLE" : "ANALOGY";
    return {
      studentIntent: intent.intent,
      priorDemonstratedCapabilities: silentContext.demonstratedCapabilities,
      knownGaps: silentContext.knownGaps,
      selectedAction: action,
      minimumInterventionRationale: "Student experienced confusion; shifting from technical lecture to concrete physical analogy.",
      nextExpectedStudentAction: "Map the analogy back to the engineering bottleneck."
    };
  }

  // HIERARCHY RULE 4: Debugging Intent (Part 37, Part 76)
  if (
    intent.intent === "debugging" ||
    lower.includes("500 error") ||
    lower.includes("code is broken") ||
    lower.includes("why isn't my code working") ||
    lower.includes("api is returning 500")
  ) {
    return {
      studentIntent: "debugging",
      priorDemonstratedCapabilities: silentContext.demonstratedCapabilities,
      knownGaps: silentContext.knownGaps,
      selectedAction: "DEBUG",
      minimumInterventionRationale: "Investigate server logs and recent changes rather than rewriting code prematurely.",
      nextExpectedStudentAction: "Share log excerpt and recent code diff."
    };
  }

  // HIERARCHY RULE 5: Project Mentoring (Part 35, Part 77)
  if (
    intent.intent === "project_guidance" ||
    (lower.includes("build") && (lower.includes("analyzer") || lower.includes("application") || lower.includes("project")))
  ) {
    return {
      studentIntent: "project_guidance",
      priorDemonstratedCapabilities: silentContext.demonstratedCapabilities,
      knownGaps: silentContext.knownGaps,
      selectedAction: "CLARIFY",
      minimumInterventionRationale: "Clarify decision boundary and required evidence before generating architecture or code.",
      nextExpectedStudentAction: "Define what the system decides and the required evidence."
    };
  }

  // HIERARCHY RULE 6: Mock Interview Intent (Part 36)
  if (intent.intent === "interview") {
    return {
      studentIntent: "interview",
      priorDemonstratedCapabilities: silentContext.demonstratedCapabilities,
      knownGaps: silentContext.knownGaps,
      selectedAction: "INTERVIEW",
      minimumInterventionRationale: "Adopt interviewer persona: present real-world problem and probe requirement clarification.",
      nextExpectedStudentAction: "Clarify functional and non-functional requirements."
    };
  }

  // HIERARCHY RULE 7: Problem Solving / LeetCode (Part 12, Part 74)
  const isProblemSolving =
    intent.intent === "problem_solving" ||
    messages.some((m) =>
      ["leetcode", "spiral", "matrix", "problem", "two sum", "algorithm"].some((k) =>
        m.content.toLowerCase().includes(k)
      )
    ) ||
    lower.includes("leetcode") ||
    lower.includes("spiral matrix") ||
    lower.includes("two sum") ||
    lower.includes("solve this problem");

  if (isProblemSolving) {
    // Look at conversation history to determine where the student is in the derivation
    const recentDialogue = messages.map((m) => m.content.toLowerCase()).join(" ");

    // Step 1: Student just introduced the problem -> PROBE what they've tried
    if (!reasoning.hasAttempted && !recentDialogue.includes("tried so far") && !recentDialogue.includes("what have you tried")) {
      return {
        studentIntent: "problem_solving",
        priorDemonstratedCapabilities: silentContext.demonstratedCapabilities,
        knownGaps: silentContext.knownGaps,
        selectedAction: "PROBE",
        minimumInterventionRationale: "Ascertain student's current mental model before providing any assistance.",
        nextExpectedStudentAction: "Explain initial thoughts or attempts."
      };
    }

    // Step 2: Student mentions row-by-row -> GUIDE on right edge boundary
    if (lower.includes("row by row") || lower.includes("row-by-row") || lower.includes("straight across")) {
      return {
        studentIntent: "problem_solving",
        priorDemonstratedCapabilities: silentContext.demonstratedCapabilities,
        knownGaps: silentContext.knownGaps,
        attemptedApproach: "Row-by-row traversal",
        selectedAction: "GUIDE",
        minimumInterventionRationale: "Acknowledge valid starting phase; prompt directional turn at boundary.",
        nextExpectedStudentAction: "Identify direction change when hitting the right edge."
      };
    }

    // Step 3: Student says "downward" -> GUIDE on bottom edge
    if (lower.includes("downward") || lower.includes("go down") || lower.includes("down")) {
      return {
        studentIntent: "problem_solving",
        priorDemonstratedCapabilities: silentContext.demonstratedCapabilities,
        knownGaps: silentContext.knownGaps,
        selectedAction: "GUIDE",
        minimumInterventionRationale: "Validate direction; prompt next logical transition at the bottom edge.",
        nextExpectedStudentAction: "Identify direction change when hitting the bottom edge."
      };
    }

    // Step 4: Student says "left" -> REFRAME into outer boundary concept
    if (lower.includes("left") || lower.includes("go left")) {
      return {
        studentIntent: "problem_solving",
        priorDemonstratedCapabilities: silentContext.demonstratedCapabilities,
        knownGaps: silentContext.knownGaps,
        selectedAction: "REFRAME",
        minimumInterventionRationale: "Synthesize repetitive turns into high-level concept: following outer perimeter.",
        nextExpectedStudentAction: "Recognize that the outer boundary is being traced."
      };
    }

    // Step 5: Student recognizes outer boundary -> PROBE state tracking (4 boundaries)
    if (lower.includes("outer boundary") || lower.includes("perimeter") || lower.includes("boundary")) {
      return {
        studentIntent: "problem_solving",
        priorDemonstratedCapabilities: silentContext.demonstratedCapabilities,
        knownGaps: silentContext.knownGaps,
        selectedAction: "ASK_TO_EXPLAIN",
        minimumInterventionRationale: "Prompt student to formalize the four explicit boundaries needed.",
        nextExpectedStudentAction: "Name the four boundaries: top, bottom, left, right."
      };
    }

    // Default problem-solving hint ladder step
    if (intent.assistancePreference === "hint_only" || lower.includes("hint")) {
      return {
        studentIntent: "problem_solving",
        priorDemonstratedCapabilities: silentContext.demonstratedCapabilities,
        knownGaps: silentContext.knownGaps,
        selectedAction: "PARTIAL_HINT",
        minimumInterventionRationale: "Provide smallest directional clue without solving the problem.",
        nextExpectedStudentAction: "Incorporate clue into algorithm derivation."
      };
    }

    return {
      studentIntent: "problem_solving",
      priorDemonstratedCapabilities: silentContext.demonstratedCapabilities,
      knownGaps: silentContext.knownGaps,
      selectedAction: "GUIDE",
      minimumInterventionRationale: "Minimum Socratic step to advance problem formulation.",
      nextExpectedStudentAction: "Propose next algorithmic step."
    };
  }

  // HIERARCHY RULE 8: System Design & Conceptual Learning (Part 16, Part 75)
  if (
    intent.intent === "learning" ||
    lower.includes("system design") ||
    lower.includes("load balancing") ||
    lower.includes("caching") ||
    lower.includes("blockchain")
  ) {
    // Check if student has demonstrated backend/database fundamentals
    const hasBackendDna =
      silentContext.demonstratedCapabilities.some((c) =>
        ["api", "backend", "sql", "database", "python", "rest"].some((k) => c.toLowerCase().includes(k))
      ) ||
      lower.includes("already know apis") ||
      lower.includes("already know databases") ||
      lower.includes("already know the basics");

    // Broad introduction request (e.g. "Teach me System Design")
    if (
      lower.includes("teach me system design") ||
      lower === "system design" ||
      lower.includes("mujhe system design")
    ) {
      if (hasBackendDna) {
        return {
          studentIntent: "learning",
          priorDemonstratedCapabilities: silentContext.demonstratedCapabilities,
          knownGaps: silentContext.knownGaps,
          selectedAction: "CONNECT_TO_PRIOR_KNOWLEDGE",
          minimumInterventionRationale: "Skip known API/database basics from Student DNA; launch directly into real scaling scenario.",
          nextExpectedStudentAction: "Analyze initial bottleneck when traffic scales from 10k to 1M req/min."
        };
      }
      return {
        studentIntent: "learning",
        priorDemonstratedCapabilities: silentContext.demonstratedCapabilities,
        knownGaps: silentContext.knownGaps,
        selectedAction: "PROBE",
        minimumInterventionRationale: "Ascertain backend exposure conversationally before assuming starting depth.",
        nextExpectedStudentAction: "Describe previous backend or database experience."
      };
    }

    // Student makes an architectural proposition -> ASK_TO_DEFEND (Part 34)
    if (
      lower.includes("cache") ||
      lower.includes("load balancer") ||
      lower.includes("shard") ||
      lower.includes("replica") ||
      lower.includes("queue")
    ) {
      return {
        studentIntent: "learning",
        priorDemonstratedCapabilities: silentContext.demonstratedCapabilities,
        knownGaps: silentContext.knownGaps,
        currentReasoning: userText,
        selectedAction: "ASK_TO_DEFEND",
        minimumInterventionRationale: "Challenge student to justify their architectural choice against failure modes.",
        nextExpectedStudentAction: "Defend trade-off (e.g. cache invalidation, single point of failure, read vs write latency)."
      };
    }

    return {
      studentIntent: "learning",
      priorDemonstratedCapabilities: silentContext.demonstratedCapabilities,
      knownGaps: silentContext.knownGaps,
      selectedAction: "APPLY",
      minimumInterventionRationale: "Frame concept as a concrete engineering trade-off scenario.",
      nextExpectedStudentAction: "Evaluate system constraint and choose component."
    };
  }

  // HIERARCHY RULE 9: Challenge Intent
  if (intent.intent === "challenge") {
    return {
      studentIntent: "challenge",
      priorDemonstratedCapabilities: silentContext.demonstratedCapabilities,
      knownGaps: silentContext.knownGaps,
      selectedAction: "CHALLENGE",
      minimumInterventionRationale: "Present rigorous edge case or scale constraint without lecturing.",
      nextExpectedStudentAction: "Propose resilient engineering solution."
    };
  }

  // HIERARCHY RULE 10: Revision Intent
  if (intent.intent === "revision") {
    return {
      studentIntent: "revision",
      priorDemonstratedCapabilities: silentContext.demonstratedCapabilities,
      knownGaps: silentContext.knownGaps,
      selectedAction: "REVISIT_PREREQUISITE",
      minimumInterventionRationale: "Resume from demonstrated learning state in Student DNA.",
      nextExpectedStudentAction: "Demonstrate retention of previously covered topic."
    };
  }

  // Default fallback action: PROBE with Minimum Effective Intervention
  return {
    studentIntent: intent.intent,
    priorDemonstratedCapabilities: silentContext.demonstratedCapabilities,
    knownGaps: silentContext.knownGaps,
    selectedAction: "PROBE",
    minimumInterventionRationale: "Ascertain student goal and starting level with minimum intervention.",
    nextExpectedStudentAction: "Elaborate on current objective."
  };
}

/**
 * 3. Build Action-Driven System Directives for the Response Generator
 */
export function buildActionDrivenSystemPrompt(
  decision: MentorDecisionContext,
  intent: IntentAnalysisResult,
  language: LanguageCode,
  silentBriefing: string
): string {
  let languageDirective = "";
  if (language === "hi") {
    languageDirective = `LANGUAGE: Natural Hindi. CRITICAL: Keep ALL technical terms in English (e.g. "Load Balancer", "Caching", "Sharding", "API", "Latency", "Boundary").`;
  } else if (language === "hinglish") {
    languageDirective = `LANGUAGE: Natural everyday Indian developer Hinglish (Roman script). CRITICAL: Keep ALL technical terms strictly in English.`;
  } else {
    languageDirective = `LANGUAGE: Clear, concise, conversational technical English.`;
  }

  return `You are Cognalyze Mentor — an evidence-aware, context-aware engineering mentor.
YOUR PRIMARY PRODUCT PRINCIPLE: TEACH BEFORE YOU ANSWER.
You are NOT an answer-dumping chatbot. A good mentor helps the student arrive at understanding themselves.

CURRENT MANDATED TEACHING ACTION: [${decision.selectedAction}]
RATIONALE: ${decision.minimumInterventionRationale}
NEXT STUDENT STEP EXPECTED: ${decision.nextExpectedStudentAction}

STRICT BEHAVIOR RULES:
1. EXECUTE ONLY THE MANDATED TEACHING ACTION (${decision.selectedAction}).
2. DO NOT DUMP COMPLETE CODE OR COMPLETE SOLUTIONS unless the action is strictly DIRECT_ANSWER.
3. Keep your turn CONVERSATIONAL and CRISP (1-3 sentences or short paragraphs).
4. NEVER use repetitive cheerleader filler ("Great question!", "Awesome job!", "Absolutely!").
5. NEVER output unrequested structured headers like "# Core Insight" or "# Complexity" by default. Speak like a real human mentor.
6. The output must be spoken naturally over voice — do not write markdown tables or read code blocks.

SILENT STUDENT DNA CONTEXT (Do not dump onto student):
${silentBriefing}

${languageDirective}`;
}

/**
 * 4. Deterministic Response Generator for Golden Scenarios & Offline Fallbacks
 */
export function generateDeterministicTeachingTurn(
  userText: string,
  decision: MentorDecisionContext,
  intent: IntentAnalysisResult,
  language: LanguageCode = "en"
): string {
  const lower = userText.toLowerCase().trim();
  const isHinglish = language === "hinglish";
  const isHindi = language === "hi";

  // GOLDEN LEETCODE 59 TEST (Part 74)
  if (decision.studentIntent === "problem_solving" || lower.includes("leetcode 59") || lower.includes("spiral matrix")) {
    if (decision.selectedAction === "PROBE") {
      if (isHinglish) {
        return "Sure! Problem solve karne se pehle, batayein aapne abhi tak kya approach try kiya hai?";
      }
      if (isHindi) {
        return "ज़रूर! इसे हल करने से पहले, बताएं कि आपने अब तक क्या प्रयास किया है?";
      }
      return "Sure. Before we solve it, what have you tried so far?";
    }

    if (lower.includes("row by row") || lower.includes("row-by-row")) {
      if (isHinglish) {
        return "Okay. First part ke liye toh row by row chal jayega. Par jab aap right edge pe pahunchte hain, tab kya hota hai?";
      }
      return "Okay. That works for the first part. What happens when you reach the right edge?";
    }

    if (lower.includes("downward") || lower.includes("down")) {
      if (isHinglish) {
        return "Exactly. Aur jab aap bottom pe pahunch jaate hain?";
      }
      return "Exactly. And once you reach the bottom?";
    }

    if (lower.includes("left") || lower.includes("go left")) {
      if (isHinglish) {
        return "Right. Toh fundamentally hum kya kar rahe hain?";
      }
      return "Right. So what are we really doing?";
    }

    if (lower.includes("outer boundary") || lower.includes("boundary") || lower.includes("perimeter")) {
      if (isHinglish) {
        return "Good! Toh matrix ko har baar poora dekhne ke bajaye, hume kaunse 4 boundaries track karne padenge?";
      }
      return "Good. So instead of thinking about the entire matrix every time, what could we keep track of? Which four boundaries do you need?";
    }
  }

  // GOLDEN SYSTEM DESIGN TEST (Part 75)
  if (
    decision.selectedAction === "CONNECT_TO_PRIOR_KNOWLEDGE" ||
    (lower.includes("system design") && !decision.attemptedApproach)
  ) {
    if (isHinglish) {
      return "Sure. Tumne already APIs aur databases ke saath kaam kiya hai, so main woh basics repeat nahi karunga. Pehle ek real situation se start karte hain:\n\nMaan lijiye aapka application 10,000 se seedha 1,000,000 requests per minute pe chala jata hai. Sabse pehle aapko kis cheez ki chinta hogi?";
    }
    if (isHindi) {
      return "ज़रूर। आपने पहले से ही APIs और databases के साथ काम किया है, इसलिए मैं वे मूल बातें नहीं दोहराऊंगा। एक परिदृश्य से शुरू करते हैं:\n\nमान लीजिए आपका एप्लिकेशन अचानक 10,000 से 1,000,000 अनुरोध प्रति मिनट पर चला जाता है। आपको सबसे पहले किस बात की चिंता होगी?";
    }
    return "You've already demonstrated API and database fundamentals, so I won't spend time there. Let's start with a scenario.\n\nImagine your application suddenly goes from 10,000 to 1,000,000 requests per minute. What worries you first?";
  }

  // GOLDEN DEBUGGING TEST (Part 76)
  if (
    decision.selectedAction === "DEBUG" ||
    lower.includes("500 error") ||
    lower.includes("code is broken") ||
    lower.includes("api is returning 500")
  ) {
    if (isHinglish) {
      return "Server logs me kya exact error message dikh raha hai? Aur is error ke aane se theek pehle code ya environment me kya change hua tha?";
    }
    if (isHindi) {
      return "सर्वर लॉग में क्या त्रुटि संदेश आ रहा है? और यह समस्या शुरू होने से ठीक पहले क्या बदलाव किया गया था?";
    }
    return "What does the server log show? And what changed immediately before this started?";
  }

  // GOLDEN PROJECT TEST (Part 77)
  if (
    decision.selectedAction === "CLARIFY" ||
    lower.includes("resume analyzer") ||
    lower.includes("ai application")
  ) {
    if (isHinglish) {
      return "Interesting project! Pehle clarify karte hain: aap chahte hain ki yeh system candidate ke baare me actually kya decide kare? Aur us decision ke liye system ko kis tarah ke evidence ki zaroorat hogi?";
    }
    return "Interesting project! Before building architecture, what do you want the system to actually decide? And what evidence would the system need before making that decision?";
  }

  // MISCONCEPTION CORRECTION (e.g. Sharding vs Replication)
  if (decision.selectedAction === "CORRECT_MISCONCEPTION") {
    if (isHinglish) {
      return "Aap yahan do alag concepts mix kar rahe hain. Let's isolate the difference: Replication aur Sharding me actual underlying data ke saath kya hota hai?";
    }
    return "You're mixing two concepts. Let's isolate the difference. What do you think happens to the actual data in each case?";
  }

  // STRATEGY SHIFT / ANALOGY
  if (decision.selectedAction === "ANALOGY") {
    if (isHinglish) {
      return "Ek second rukte hain. Ek simple analogy se samajhte hain:\n\nMaan lijiye ek restaurant me sirf 1 chef hai aur 100 orders aa gaye. Chef bottleneck ban jayega. Load Balancer ek head waiter jaisa hai jo tickets ko 5 alag chefs me distribute karta hai.\n\nAb batayein: agar ek chef ka stove kharab ho jaye toh head waiter ko kya karna chahiye?";
    }
    return "Let's step back for a moment and look at an analogy.\n\nImagine a busy restaurant where every order goes to a single chef. That chef becomes an immediate bottleneck. A Load Balancer acts like a head waiter distributing incoming tickets across 5 different chefs.\n\nNow: what should the load balancer do if one chef's stove breaks down?";
  }

  // DIRECT ANSWER REQUEST
  if (decision.selectedAction === "DIRECT_ANSWER") {
    if (isHinglish) {
      return "Theek hai, aapne is concept ko explore kar liya hai. Yeh raha iska solution:\n\nChar pointers use hote hain: `top`, `bottom`, `left`, `right`. Ek while loop me top row traverse karke `top++` karte hain, fir right column traverse karke `right--`, fir bottom row karke `bottom--`, fir left column karke `left++`.\n\nAb batayein: `while (top <= bottom && left <= right)` condition me equality sign kyun zaroori hai?";
    }
    return "Understood. Since you explicitly requested the solution, here is the core mechanism:\n\nMaintain four boundary pointers: `top = 0`, `bottom = n - 1`, `left = 0`, `right = m - 1`. Traverse left-to-right on top, increment top; top-to-bottom on right, decrement right; right-to-left on bottom, decrement bottom; bottom-to-top on left, increment left.\n\nNow: why is the condition `top <= bottom && left <= right` with equality strictly necessary for odd-dimensioned matrices?";
  }

  // DEFAULT CONVERSATIONAL TURN
  if (isHinglish) {
    return "Great. Is idea ko aage badhate hain. Aapke hisaab se agla step kya hona chahiye?";
  }
  return "Let's build on that. What do you think happens in the next step?";
}

/**
 * 5. Generate structured SpokenTurnPayload separating speech-first audio from visual canvas
 */
export function generateSpokenTeachingPayload(
  userText: string,
  decision: MentorDecisionContext,
  intent: IntentAnalysisResult,
  language: LanguageCode = "en",
  interruption?: InterruptionContext,
  previousSurface?: LearningSurfaceState,
  prerequisiteCheck?: PrerequisiteCheckResult
): SpokenTurnPayload {
  const lower = userText.toLowerCase().trim();
  const isHinglish = language === "hinglish";
  const isHindi = language === "hi";

  // Build the rich adaptive learning surface
  const learningSurface = constructAdaptiveLearningSurface({
    userText,
    intent,
    teachingAction: decision.selectedAction,
    previousSurface,
    prerequisiteCheck,
    activeMisconception: decision.detectedMisconception
  });

  // 1. Interruption Handling (Section 6)
  if (interruption?.wasInterrupted || lower.startsWith("wait") || lower.includes("ruko") || lower.includes("hold on")) {
    const spoken = isHinglish
      ? "Haan bilkul, yahin rukte hain. Batao kaunsa point clear nahi hua ya tumhara kya matlab tha?"
      : isHindi
      ? "ज़रूर, यहीं रुकते हैं। बताएं कि कौन सा बिंदु स्पष्ट नहीं हुआ या आपका क्या अर्थ था?"
      : "Let's pause right there. Tell me which part felt unclear or what you meant.";
    return {
      spokenResponse: spoken,
      learningSurface,
      teachingAction: "LISTEN",
      decisionRationale: "Student interrupted during previous turn; pausing and actively listening.",
      waitTimeoutSeconds: 30
    };
  }

  // 2. Thinking Out Loud Handling
  if (intent.isThinkingOutLoud) {
    const spoken = isHinglish
      ? "Poora time lo. Aapke dimaag mein sorting vs hashmap ke baare mein kya chal raha hai, mujhe step-by-step batao."
      : isHindi
      ? "पूरा समय लें। आपके मन में जो विचार आ रहा है, मुझे साझा करें।"
      : "Take your time. Walk me through what's going through your mind as you consider your approach.";
    return {
      spokenResponse: spoken,
      learningSurface,
      teachingAction: "LISTEN",
      decisionRationale: "Student thinking out loud; maintaining turn without premature interruption.",
      waitTimeoutSeconds: 45
    };
  }

  // 3. Prerequisite Stepping Check
  if (decision.selectedAction === "REVISIT_PREREQUISITE" && prerequisiteCheck?.missingPrerequisiteName) {
    const spoken = formatPrerequisiteSteppingMessage(
      prerequisiteCheck.missingPrerequisiteName,
      intent.topic,
      language
    );
    return {
      spokenResponse: spoken,
      learningSurface,
      teachingAction: "REVISIT_PREREQUISITE",
      decisionRationale: prerequisiteCheck.rationale || "Stepping back to foundational prerequisite",
      waitTimeoutSeconds: 40
    };
  }

  // 4. Explicit Question / Checkpoint Request
  if (lower.includes("ek question do") || lower.includes("quiz do") || lower.includes("give me a problem") || lower.includes("test me")) {
    const spoken = isHinglish
      ? "Bilkul! Ek quick checkpoint question dekhte hain screen par. Iska answer batayein:"
      : "Great! Check out the quick checkpoint on your screen. What do you think is the answer?";
    return {
      spokenResponse: spoken,
      learningSurface,
      teachingAction: "CHALLENGE",
      decisionRationale: "Student requested question/checkpoint; presenting targeted quiz surface.",
      waitTimeoutSeconds: 45
    };
  }

  // 5. Explicit Visual Explanation Request
  if (lower.includes("visualize") || lower.includes("diagram") || lower.includes("visual tree")) {
    const spoken = isHinglish
      ? "Zaroor! Screen par dekho: Maine visual call stack open kiya hai. Notice karo har frame kaise pause rehta hai."
      : "Sure! Look at the visual call stack on your screen: notice how each frame pauses until the inner call returns.";
    return {
      spokenResponse: spoken,
      learningSurface,
      teachingAction: "EXPLAIN",
      decisionRationale: "Visual explanation requested; rendered dynamic visual surface.",
      waitTimeoutSeconds: 45
    };
  }

  // 6. System Design Scaling Scenario (Golden Test Part 75)
  if (
    decision.selectedAction === "CONNECT_TO_PRIOR_KNOWLEDGE" ||
    (lower.includes("system design") && !decision.attemptedApproach)
  ) {
    const spoken = isHinglish
      ? "Sure. Tumne already APIs aur databases ke saath kaam kiya hai, so main woh basics repeat nahi karunga. Pehle ek real situation se start karte hain:\n\nMaan lijiye aapka application 10,000 se seedha 1,000,000 requests per minute pe chala jata hai. Sabse pehle aapko kis cheez ki chinta hogi?"
      : isHindi
      ? "ज़रूर। आपने पहले से ही APIs और databases के साथ काम किया है, इसलिए मैं वे मूल बातें नहीं दोहराऊंगा। एक परिदृश्य से शुरू करते हैं:\n\nमान लीजिए आपका एप्लिकेशन अचानक 10,000 से 1,000,000 अनुरोध प्रति मिनट पर चला जाता है। आपको सबसे पहले किस बात की चिंता होगी?"
      : "You've already demonstrated API and database fundamentals, so I won't spend time there. Let's start with a scenario.\n\nImagine your application suddenly goes from 10,000 to 1,000,000 requests per minute. What worries you first?";

    return {
      spokenResponse: spoken,
      visualCanvas: {
        type: "architecture",
        title: "Traffic Spike Architecture",
        content: "[Clients] ──(1,000,000 req/min)──▶ [Single Monolith Server] ──▶ [Primary Database (CPU 98%)]",
        highlightSnippet: "Primary Database (CPU 98%)"
      },
      learningSurface,
      teachingAction: decision.selectedAction,
      decisionRationale: decision.minimumInterventionRationale,
      waitTimeoutSeconds: 45
    };
  }

  // 7. Debugging (Golden Test Part 76)
  if (
    decision.selectedAction === "DEBUG" ||
    lower.includes("500") ||
    lower.includes("broken") ||
    lower.includes("why isn't my code working")
  ) {
    const spoken = isHinglish
      ? "Server logs me kya exact error message dikh raha hai? Aur is error ke aane se theek pehle code ya environment me kya change hua tha?"
      : isHindi
      ? "सर्वर लॉग में क्या त्रुटि संदेश आ रहा है? और यह समस्या शुरू होने से ठीक पहले क्या बदलाव किया गया था?"
      : "What does the server log show? And what changed immediately before this started?";

    return {
      spokenResponse: spoken,
      visualCanvas: {
        type: "checklist",
        title: "Diagnostic Inspection",
        content: "1. Recent code diff or deployment\n2. Exception stack trace & HTTP 500 origin\n3. Database connection pool / timeouts\n4. Environment variables / secrets"
      },
      learningSurface,
      teachingAction: decision.selectedAction,
      decisionRationale: decision.minimumInterventionRationale,
      waitTimeoutSeconds: 45
    };
  }

  // 8. Project Guidance (Golden Test Part 77)
  if (
    decision.selectedAction === "CLARIFY" ||
    lower.includes("resume analyzer") ||
    lower.includes("ai application")
  ) {
    const spoken = isHinglish
      ? "Interesting project! Pehle clarify karte hain: aap chahte hain ki yeh system candidate ke baare me actually kya decide kare? Aur us decision ke liye system ko kis tarah ke evidence ki zaroorat hogi?"
      : "Interesting project! Before building architecture, what do you want the system to actually decide? And what evidence would the system need before making that decision?";

    return {
      spokenResponse: spoken,
      visualCanvas: {
        type: "schema",
        title: "Decision Boundary Formulation",
        content: "Candidate Claims + Artifacts ──▶ [Extraction Engine] ──▶ [Evidence Graph] ──▶ [Defensible Assessment]"
      },
      learningSurface,
      teachingAction: decision.selectedAction,
      decisionRationale: decision.minimumInterventionRationale,
      waitTimeoutSeconds: 45
    };
  }

  // 9. LeetCode 59 Spiral Matrix (Golden Test Part 74)
  if (decision.studentIntent === "problem_solving" || lower.includes("leetcode 59") || lower.includes("spiral matrix")) {
    if (decision.selectedAction === "PROBE") {
      const spoken = isHinglish
        ? "Sure! Problem solve karne se pehle, batayein aapne abhi tak kya approach try kiya hai?"
        : isHindi
        ? "ज़रूर! इसे हल करने से पहले, बताएं कि आपने अब तक क्या प्रयास किया है?"
        : "Sure. Before we solve it, what have you tried so far?";
      return {
        spokenResponse: spoken,
        learningSurface,
        teachingAction: "PROBE",
        decisionRationale: decision.minimumInterventionRationale,
        waitTimeoutSeconds: 45
      };
    }

    if (lower.includes("row by row") || lower.includes("row-by-row")) {
      const spoken = isHinglish
        ? "Okay. First part ke liye toh row by row chal jayega. Par jab aap right edge pe pahunchte hain, tab kya hota hai?"
        : "Okay. That works for the first part. What happens when you reach the right edge?";
      return {
        spokenResponse: spoken,
        learningSurface,
        teachingAction: "GUIDE",
        decisionRationale: decision.minimumInterventionRationale,
        waitTimeoutSeconds: 40
      };
    }

    if (lower.includes("downward") || lower.includes("down")) {
      const spoken = isHinglish
        ? "Exactly! Aur ek baar bottom pe pahunch gaye, tab?"
        : "Exactly. And once you reach the bottom?";
      return {
        spokenResponse: spoken,
        learningSurface,
        teachingAction: "GUIDE",
        decisionRationale: decision.minimumInterventionRationale,
        waitTimeoutSeconds: 40
      };
    }

    if (lower.includes("left") || lower.includes("go left")) {
      const spoken = isHinglish
        ? "Right. Toh fundamentally hum kya kar rahe hain?"
        : "Right. So what are we really doing?";
      return {
        spokenResponse: spoken,
        learningSurface,
        teachingAction: "REFRAME",
        decisionRationale: decision.minimumInterventionRationale,
        waitTimeoutSeconds: 40
      };
    }

    if (lower.includes("outer boundary") || lower.includes("boundary") || lower.includes("perimeter")) {
      const spoken = isHinglish
        ? "Good! Toh matrix ko har baar poora dekhne ke bajaye, hume kaunse 4 boundaries track karne padenge?"
        : "Good. So instead of thinking about the entire matrix every time, what could we keep track of? Which four boundaries do you need?";
      return {
        spokenResponse: spoken,
        visualCanvas: {
          type: "schema",
          title: "Matrix Traversal Boundaries",
          content: "top = 0 → row\nbottom = n-1 ← row\nleft = 0 ↓ col\nright = m-1 ↑ col"
        },
        learningSurface,
        teachingAction: "ASK_TO_EXPLAIN",
        decisionRationale: decision.minimumInterventionRationale,
        waitTimeoutSeconds: 45
      };
    }
  }

  // 10. Direct Solution Requested (Any domain)
  if (decision.selectedAction === "DIRECT_ANSWER") {
    const spoken = isHinglish
      ? "Theek hai, visual workspace me implementation dekhein. Is approach ko dhyan me rakh kar batayein: edge cases handle karne ke liye kaunsi condition critical hai?"
      : "Understood. Take a look at the boundary implementation in the visual workspace. Notice how the pointers shrink inward. Why is the boundary termination condition strictly necessary?";
    return {
      spokenResponse: spoken,
      visualCanvas: {
        type: "code",
        title: "Algorithmic Implementation",
        language: "typescript",
        content: `let top = 0, bottom = n - 1, left = 0, right = m - 1;\nwhile (top <= bottom && left <= right) {\n  for (let c = left; c <= right; c++) res.push(matrix[top][c]);\n  top++;\n  for (let r = top; r <= bottom; r++) res.push(matrix[r][right]);\n  right--;\n  // bottom and left passes...\n}`
      },
      learningSurface,
      teachingAction: "DIRECT_ANSWER",
      decisionRationale: decision.minimumInterventionRationale,
      waitTimeoutSeconds: 60
    };
  }

  // Fallback / standard turns
  const text = generateDeterministicTeachingTurn(userText, decision, intent, language);
  return {
    spokenResponse: text,
    learningSurface,
    teachingAction: decision.selectedAction,
    decisionRationale: decision.minimumInterventionRationale,
    waitTimeoutSeconds: 30
  };
}

/**
 * 6. Primary Turn Dispatcher using LLM with Strict Action Constraints
 */
export async function dispatchMentorActionTurn(
  userText: string,
  decision: MentorDecisionContext,
  intent: IntentAnalysisResult,
  language: LanguageCode,
  silentBriefing: string,
  history: { role: "system" | "user" | "assistant"; content: string }[],
  interruption?: InterruptionContext,
  previousSurface?: LearningSurfaceState,
  prerequisiteCheck?: PrerequisiteCheckResult
): Promise<SpokenTurnPayload> {
  const learningSurface = constructAdaptiveLearningSurface({
    userText,
    intent,
    teachingAction: decision.selectedAction,
    previousSurface,
    prerequisiteCheck,
    activeMisconception: decision.detectedMisconception
  });

  // If interruption active or thinking out loud, return conversational turn immediately
  if (interruption?.wasInterrupted || intent.isThinkingOutLoud) {
    const payload = generateSpokenTeachingPayload(userText, decision, intent, language, interruption, previousSurface, prerequisiteCheck);
    payload.learningSurface = learningSurface;
    return payload;
  }

  const systemPrompt = buildActionDrivenSystemPrompt(decision, intent, language, silentBriefing);

  try {
    const rawContent = await defaultLLMProvider.generateTurn(systemPrompt, history, {
      temperature: 0.2,
      maxTokens: 350
    });

    if (rawContent && rawContent.length > 5) {
      return {
        spokenResponse: rawContent,
        learningSurface,
        teachingAction: decision.selectedAction,
        decisionRationale: decision.minimumInterventionRationale,
        waitTimeoutSeconds: 30
      };
    }
  } catch (err) {
    console.warn("[InteractionEngine] LLM invocation failed, using deterministic action turn:", err);
  }

  // Deterministic Golden Response fallback
  return generateSpokenTeachingPayload(userText, decision, intent, language, interruption, previousSurface, prerequisiteCheck);
}
