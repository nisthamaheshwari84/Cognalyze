/**
 * COGNALYZE MENTOR — INTENT ENGINE
 * Natural language intent & constraint classifier.
 * Interpets user messages in real time without forcing manual modes or topic selections.
 */

import { IntentAnalysisResult, MentorIntent, AssistancePreference, TargetDepth, LanguageCode } from "./types";

/**
 * Analyze the student's message in context to infer intent, topic, assistance constraints,
 * language, and depth.
 */
export function analyzeStudentIntent(
  userText: string,
  previousIntent?: IntentAnalysisResult
): IntentAnalysisResult {
  const text = userText.trim();
  const lower = text.toLowerCase();

  // 1. Language Detection & Explicit Switches
  let language: LanguageCode = previousIntent?.language || "hinglish";
  if (
    lower.includes("switch to english") ||
    lower.includes("speak in english") ||
    lower.includes("in english") ||
    lower.includes("english please")
  ) {
    language = "en";
  } else if (
    lower.includes("switch to hindi") ||
    lower.includes("hindi mein") ||
    lower.includes("in hindi") ||
    lower.includes("hindi please")
  ) {
    language = "hi";
  } else if (
    lower.includes("switch to hinglish") ||
    lower.includes("hinglish mein") ||
    lower.includes("in hinglish") ||
    lower.includes("samjhao") ||
    lower.includes("batao") ||
    lower.includes("karo")
  ) {
    language = "hinglish";
  }

  // 2. Off-Topic Guardrail Check
  const offTopicTriggers = [
    "celebrity gossip",
    "who is dating",
    "tell me a joke about politics",
    "crypto meme coin pump",
    "random gossip",
    "tell me gossip",
    "astrology prediction"
  ];
  const isOffTopic = offTopicTriggers.some((t) => lower.includes(t));
  if (isOffTopic) {
    return {
      intent: "off_topic",
      topic: "General Off-Topic",
      scope: "Irrelevant Inquiry",
      assistancePreference: "guided",
      depth: "beginner",
      language,
      isOffTopic: true,
      redirectMessage:
        language === "hinglish"
          ? "Hum is session ko aapke technical learning aur interview prep pe focused rakhte hain. Batayein, aap kis technical concept, project ya problem pe kaam karna chahte hain?"
          : language === "hi"
          ? "आइए इस सत्र को आपकी तकनीकी शिक्षा और साक्षात्कार तैयारी पर केंद्रित रखें। बताएं, आप किस विषय या समस्या पर काम करना चाहते हैं?"
          : "Let's keep our session focused on your engineering goals and preparation. What technical topic, architecture, or coding challenge would you like to tackle?",
      wantsAnalogy: false,
      wantsRealWorldExample: false,
      strategyShiftTrigger: false,
      forbidDirectAnswer: false
    };
  }

  // 3. Time Budget Detection (e.g. "I have 20 minutes", "30 mins")
  let timeBudgetMinutes: number | undefined = undefined;
  const timeMatch = lower.match(/(?:i have|got|within)\s+(\d+)\s*(?:mins?|minutes?)/i);
  if (timeMatch) {
    timeBudgetMinutes = parseInt(timeMatch[1], 10);
  }

  // 4. Assistance Preferences & "Don't give me the answer"
  const forbidDirectAnswer =
    lower.includes("don't give me the answer") ||
    lower.includes("dont give me the answer") ||
    lower.includes("do not give me the answer") ||
    lower.includes("just guide me") ||
    lower.includes("answer mat dena") ||
    lower.includes("only guide me");

  let assistancePreference: AssistancePreference = previousIntent?.assistancePreference || "guided";
  if (forbidDirectAnswer) {
    assistancePreference = "no_answers";
  } else if (
    lower.includes("give me a hint") ||
    lower.includes("hint please") ||
    lower.includes("hint chahiye") ||
    lower.includes("ek hint do")
  ) {
    assistancePreference = "hint_only";
  } else if (
    lower.includes("give me the answer") ||
    lower.includes("give me the solution") ||
    lower.includes("give the solution") ||
    lower.includes("show solution") ||
    lower.includes("show the solution") ||
    lower.includes("solution batao") ||
    lower.includes("give full code") ||
    lower.includes("complete code")
  ) {
    assistancePreference = "solution_requested";
  }

  // 5. Depth Adjustment
  let depth: TargetDepth = previousIntent?.depth || "intermediate";
  if (
    lower.includes("go deeper") ||
    lower.includes("deep dive") ||
    lower.includes("technical version") ||
    lower.includes("in-depth") ||
    lower.includes("advanced") ||
    lower.includes("already know the basics")
  ) {
    depth = "deep_technical";
  } else if (
    lower.includes("like i'm a beginner") ||
    lower.includes("explain simply") ||
    lower.includes("for beginner") ||
    lower.includes("simple words") ||
    lower.includes("aasan bhasha")
  ) {
    depth = "beginner";
  } else if (
    lower.includes("interview-level") ||
    lower.includes("interview level") ||
    lower.includes("faang level")
  ) {
    depth = "interview_level";
  }

  // 6. Strategy Shift & Analogy Flags
  const wantsAnalogy =
    lower.includes("analogy") ||
    lower.includes("using cricket") ||
    lower.includes("like a 5 year old") ||
    lower.includes("metaphor");

  const wantsRealWorldExample =
    lower.includes("real-world example") ||
    lower.includes("real world example") ||
    lower.includes("production example") ||
    lower.includes("industry example");

  const strategyShiftTrigger =
    lower.includes("i don't understand") ||
    lower.includes("i dont understand") ||
    lower.includes("samajh nahi aaya") ||
    lower.includes("confused") ||
    lower.includes("explain that again") ||
    lower.includes("explain differently");

  // 7. Intent Inferences
  let intent: MentorIntent = previousIntent?.intent || "learning";

  if (
    lower.includes("take my interview") ||
    lower.includes("mock interview") ||
    lower.includes("interview me") ||
    lower.includes("interview tomorrow") ||
    lower.includes("prepare for a backend interview") ||
    lower.includes("interview ki tarah")
  ) {
    intent = "interview";
  } else if (
    lower.includes("leetcode") ||
    lower.includes("solve this problem") ||
    lower.includes("algorithm problem") ||
    lower.includes("coding problem") ||
    lower.includes("two sum") ||
    lower.includes("time complexity of this") ||
    lower.includes("ek question do") ||
    lower.includes("give me a problem")
  ) {
    intent = "problem_solving";
  } else if (
    lower.includes("my code is broken") ||
    lower.includes("api is returning 500") ||
    lower.includes("500 error") ||
    lower.includes("gives a 500") ||
    lower.includes("why isn't my code working") ||
    lower.includes("why is my code not working") ||
    lower.includes("debug this") ||
    lower.includes("debugging") ||
    lower.includes("error in my code") ||
    lower.includes("code is failing") ||
    lower.includes("wrong output")
  ) {
    intent = "debugging";
  } else if (
    lower.includes("review this code") ||
    lower.includes("why is this failing") ||
    lower.includes("code review")
  ) {
    intent = "code_review";
  } else if (
    lower.includes("build a") ||
    lower.includes("want to build") ||
    lower.includes("rag application") ||
    lower.includes("create a project") ||
    lower.includes("project guide")
  ) {
    intent = "project_guidance";
  } else if (
    lower.includes("stop explaining") ||
    lower.includes("challenge me") ||
    lower.includes("just challenge me") ||
    lower.includes("quiz me") ||
    lower.includes("quiz do") ||
    lower.includes("test me")
  ) {
    intent = "challenge";
  } else if (
    lower.includes("continue where we stopped") ||
    lower.includes("continue from yesterday") ||
    lower.includes("let's continue") ||
    lower.includes("revise")
  ) {
    intent = "revision";
  } else if (timeBudgetMinutes !== undefined) {
    intent = "time_budgeted";
  } else if (
    lower.includes("teach me") ||
    lower.includes("explain") ||
    lower.includes("what is") ||
    lower.includes("how does") ||
    lower.includes("difference between") ||
    lower.includes("samjhao")
  ) {
    intent = "learning";
  }

  // 8. Dynamic Topic Extraction
  let topic = previousIntent?.topic || "Engineering Foundations";

  // Clean and extract topic from natural prompts
  const cleanTopicMatch = text.match(
    /(?:teach me|explain|understand|about|on|master|build|help with|quiz me on|interview for)\s+([A-Za-z0-9\s#+\-./]+?)(?:\.|\?|,|but|in\s+hinglish|in\s+hindi|in\s+english|$)/i
  );
  if (cleanTopicMatch && cleanTopicMatch[1]) {
    const extracted = cleanTopicMatch[1].trim();
    if (extracted.length > 2 && !["this", "it", "something", "that"].includes(extracted.toLowerCase())) {
      topic = extracted;
    }
  } else if (lower.includes("system design") || lower.includes("tinyurl") || lower.includes("instagram") || lower.includes("youtube")) {
    topic = lower.includes("tinyurl") ? "System Design (TinyURL)" : lower.includes("instagram") ? "System Design (Instagram)" : lower.includes("youtube") ? "System Design (YouTube)" : "System Design";
  } else if (lower.includes("leetcode 59") || lower.includes("spiral matrix")) {
    topic = "Spiral Matrix (LeetCode 59)";
  } else if (lower.includes("binary search") || lower.includes("rotated sorted array")) {
    topic = "Binary Search & Monotonic Invariants";
  } else if (lower.includes("transformers") || lower.includes("attention")) {
    topic = "Transformers & Self-Attention";
  } else if (lower.includes("leetcode") || lower.includes("dsa")) {
    topic = "DSA & Problem Solving";
  } else if (lower.includes("recursion")) {
    topic = "Recursion & Backtracking";
  } else if (lower.includes("rag") || lower.includes("embeddings")) {
    topic = "RAG & Vector Search";
  } else if (lower.includes("blockchain") || lower.includes("web3")) {
    topic = "Blockchain & Consensus";
  } else if (lower.includes("database") || lower.includes("sql")) {
    topic = "Database Systems & Indexing";
  } else if (lower.includes("500") || lower.includes("broken")) {
    topic = "API Debugging & Root Cause Analysis";
  }

  // 9. Infer LearningTaskType
  let taskType: import("./types").LearningTaskType = "concept_learning";
  if (intent === "interview" || lower.includes("interview")) {
    taskType = "interview_simulation";
  } else if (intent === "debugging" || lower.includes("debug") || lower.includes("wrong output") || lower.includes("500")) {
    taskType = "debugging";
  } else if (
    topic.toLowerCase().includes("system design") ||
    lower.includes("design youtube") ||
    lower.includes("design instagram") ||
    lower.includes("tinyurl") ||
    lower.includes("distributed system")
  ) {
    taskType = "system_design";
  } else if (
    intent === "problem_solving" ||
    lower.includes("leetcode") ||
    lower.includes("spiral matrix") ||
    lower.includes("two sum") ||
    lower.includes("ek question do") ||
    lower.includes("give me a problem")
  ) {
    taskType = "problem_solving";
  } else if (
    lower.includes("visualize") ||
    lower.includes("visual") ||
    lower.includes("diagram") ||
    lower.includes("draw it") ||
    lower.includes("call stack")
  ) {
    taskType = "visual_explanation";
  } else if (intent === "project_guidance" || lower.includes("project") || lower.includes("build a")) {
    taskType = "project_building";
  } else if (intent === "learning" || lower.includes("explain") || lower.includes("samjhao") || lower.includes("what is")) {
    taskType = "concept_learning";
  } else if (previousIntent?.taskType) {
    taskType = previousIntent.taskType;
  }

  // 10. Infer ExplanationDepthLevel (L0 to L7)
  let depthLevel: import("./types").ExplanationDepthLevel = "L1_simple";
  if (lower.includes("one-line") || lower.includes("one line") || lower.includes("intuition") || lower.includes("basic idea")) {
    depthLevel = "L0_intuition";
  } else if (lower.includes("simple way") || lower.includes("simple") || lower.includes("aasan")) {
    depthLevel = "L1_simple";
  } else if (wantsRealWorldExample || lower.includes("real-world") || lower.includes("example")) {
    depthLevel = "L2_example";
  } else if (lower.includes("visualize") || lower.includes("diagram") || lower.includes("tree")) {
    depthLevel = "L3_visual";
  } else if (lower.includes("technical detail") || lower.includes("under the hood") || lower.includes("mechanism")) {
    depthLevel = "L4_technical_mechanism";
  } else if (lower.includes("math") || lower.includes("formula") || lower.includes("equation") || lower.includes("qkv")) {
    depthLevel = "L5_math";
  } else if (lower.includes("code dikhao") || lower.includes("implementation") || lower.includes("show code")) {
    depthLevel = "L6_implementation";
  } else if (lower.includes("interview perspective") || lower.includes("trade-off") || lower.includes("tradeoff")) {
    depthLevel = "L7_tradeoffs";
  } else if (previousIntent?.depthLevel) {
    depthLevel = previousIntent.depthLevel;
  }

  // 11. Detect Thinking Out Loud (vs Complete Turn)
  const isThinkingOutLoud = Boolean(
    (lower.includes("hmm") ||
      lower.includes("wait, maybe") ||
      lower.includes("i think maybe") ||
      lower.includes("actually wait") ||
      lower.includes("let me think") ||
      lower.includes("give me a second")) &&
      (lower.includes("...") || lower.includes("actually") || lower.includes("maybe") || lower.endsWith("..."))
  );

  return {
    intent,
    taskType,
    depthLevel,
    topic,
    scope: `${topic} (${depth})`,
    assistancePreference,
    depth,
    language,
    timeBudgetMinutes,
    isOffTopic: false,
    wantsAnalogy,
    wantsRealWorldExample,
    strategyShiftTrigger,
    forbidDirectAnswer: Boolean(
      forbidDirectAnswer || (previousIntent?.forbidDirectAnswer && assistancePreference === "no_answers")
    ),
    isThinkingOutLoud,
    explicitIntent: text,
    implicitIntent:
      taskType === "problem_solving"
        ? "isolate boundary conditions and algorithm invariants"
        : taskType === "system_design"
        ? "uncover scaling bottlenecks and trade-offs"
        : taskType === "debugging"
        ? "verify expected vs actual runtime state"
        : "develop conceptual mental model"
  };
}
