/**
 * lib/skills/code-comprehension/personal-teacher-engine.ts
 * 
 * Personal AI Engineering Teacher for Cognalyze Code Comprehension Lab.
 * Implements a true one-to-one teaching experience:
 * TEACH -> DEMONSTRATE -> ASK -> LISTEN -> EVALUATE -> CORRECT -> ADAPT
 * 
 * Core Capabilities:
 * 1. Multi-tier progression (Level 1: Absolute Beginner -> Level 6: Expert System Defense)
 * 2. Structured conversational lesson narration broken into meaningful spoken segments
 * 3. Free-form voice/text response evaluation with misconception detection
 * 4. Contextual voice interrupt commands ("explain simply", "give example", "what happens internally", "why")
 * 5. Deterministic fallback + Gemini LLM integration for dynamic mentor dialogue
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

export type TeachingDifficultyLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface LessonNarrationSegments {
  conceptIntro: string;
  whyItMatters: string;
  codeWalkthrough: string;
  internalMechanics: string;
  commonMistakes: string;
  checkpointQuestion: string;
  recap: string;
  fullSpokenScript: string;
}

export interface StudentEvaluationResult {
  isCorrect: boolean;
  score: number; // 0 - 100
  understandingLevel: TeachingDifficultyLevel;
  teacherPraise: string;
  misconceptionsDetected: string[];
  correctionExplanation: string;
  demonstratedProof: string;
  followUpQuestion?: string;
  readyToAdvance: boolean;
}

export interface VoiceCommandIntent {
  intent: "explain_again" | "simpler_explanation" | "give_example" | "why_this_matters" | "internal_deep_dive" | "next_step" | "answer_submission" | "unknown";
  cleanText: string;
  detectedKeyword?: string;
}

// -----------------------------------------------------------------------------
// 1. VOICE COMMAND INTENT CLASSIFIER
// -----------------------------------------------------------------------------

export function classifyVoiceCommand(transcript: string): VoiceCommandIntent {
  const t = transcript.trim().toLowerCase();

  if (/(explain (this )?again|repeat|say that again|one more time|replay)/i.test(t)) {
    return { intent: "explain_again", cleanText: transcript, detectedKeyword: "explain_again" };
  }
  if (/(simpl|easier|layman|beginner|like i am five|eli5|too complex)/i.test(t)) {
    return { intent: "simpler_explanation", cleanText: transcript, detectedKeyword: "simpler" };
  }
  if (/(example|for instance|can you illustrate)/i.test(t)) {
    return { intent: "give_example", cleanText: transcript, detectedKeyword: "example" };
  }
  if (/(why are we doing this|why does this matter|why is this needed|what is the purpose|\bwhy\b)/i.test(t)) {
    return { intent: "why_this_matters", cleanText: transcript, detectedKeyword: "why" };
  }
  if (/(internally|under the hood|low level|memory|socket|database lock|how does express|mechanics)/i.test(t)) {
    return { intent: "internal_deep_dive", cleanText: transcript, detectedKeyword: "internals" };
  }
  if (/(move on|next step|\bnext\b|advance|continue|i am ready|proceed)/i.test(t)) {
    return { intent: "next_step", cleanText: transcript, detectedKeyword: "next" };
  }

  return { intent: "answer_submission", cleanText: transcript };
}

// -----------------------------------------------------------------------------
// 2. CONVERSATIONAL TEACHER EXPLANATION BUILDER
// -----------------------------------------------------------------------------

export function buildAdaptiveLessonNarration(params: {
  topicTitle: string;
  filePath: string;
  functionName: string;
  activeLineNumbers?: string;
  codeSnippet: string;
  architectureStage: string;
  variablesSummary?: string;
  level: TeachingDifficultyLevel;
  customAnalogy?: string;
  customInternalDetails?: string;
}): LessonNarrationSegments {
  const { topicTitle, filePath, functionName, activeLineNumbers, codeSnippet, architectureStage, level } = params;

  // Level 1: Absolute Beginner
  if (level === 1) {
    const intro = `Welcome! Let's explore "${topicTitle}" step by step. If you've never looked at production backend code before, don't worry. Think of our server like a busy restaurant: when a customer places an order, it doesn't immediately get cooked. It first passes through an order desk, gets validated, and then reaches the chef.`;
    const why = `Why does this step matter? In real applications like Spotify or Stripe, millions of requests arrive every minute. If we let anyone touch the database directly without these safeguards, our system would instantly crash or get hacked.`;
    const walkthrough = `Look at the code in ${filePath} inside function ${functionName}. Notice line by line how we take the incoming request, check who sent it, and prepare the parameters before doing any heavy work.`;
    const internals = params.customAnalogy || `Internally, the server creates an isolated request object in memory so this customer's data never mixes with anyone else's.`;
    const commonMistakes = `A common beginner mistake is assuming the controller writes directly to the database. In clean architecture, we always separate receiving the request from actually saving it.`;
    const checkpoint = `Let me pause here. In your own words, why do we want an authentication check before the controller runs?`;
    const recap = `To summarize: safety first. We authenticate and validate before touching any business logic.`;

    const full = `${intro} ${why} ${walkthrough} ${internals} ${commonMistakes} ${checkpoint}`;
    return {
      conceptIntro: intro,
      whyItMatters: why,
      codeWalkthrough: walkthrough,
      internalMechanics: internals,
      commonMistakes: commonMistakes,
      checkpointQuestion: checkpoint,
      recap: recap,
      fullSpokenScript: full,
    };
  }

  // Level 2 & 3: Practical Engineering (Default)
  const intro = `Let's break down "${topicTitle}". We are currently inside the ${architectureStage} layer, specifically in ${filePath} executing ${functionName}${activeLineNumbers ? ` around lines ${activeLineNumbers}` : ""}.`;
  const why = `In production architectures, keeping boundaries clean between routing, authorization, and domain logic is what allows teams to scale to thousands of daily deploys without breaking state invariants.`;
  const walkthrough = `Let's walk through the executing code:\n${codeSnippet}\nNotice how variables transition: the incoming payload is unpacked, cryptographic headers are inspected, and only verified claims are passed downward into the execution stack.`;
  const internals = params.customInternalDetails || `At the Node.js runtime level, the Express router handles this synchronously on the event loop before dispatching asynchronous promises to the service or database pool.`;
  const commonMistakes = `Junior engineers frequently leak tenant parameters from the request body directly into SQL queries, creating critical IDOR vulnerabilities. Here, tenant claims are strictly injected from the signed JWT payload.`;
  const checkpoint = `Here is your checkpoint question: Looking at the variables right now, what guarantees that this operation is logically isolated to the authenticated organization?`;
  const recap = `Key takeaway: Always derive tenant context from the cryptographically verified token, never from untrusted client input.`;

  const full = `${intro} ${why} ${walkthrough} ${internals} ${commonMistakes} ${checkpoint}`;
  return {
    conceptIntro: intro,
    whyItMatters: why,
    codeWalkthrough: walkthrough,
    internalMechanics: internals,
    commonMistakes: commonMistakes,
    checkpointQuestion: checkpoint,
    recap: recap,
    fullSpokenScript: full,
  };
}

// -----------------------------------------------------------------------------
// 3. STUDENT RESPONSE EVALUATION (VOICE OR TYPED)
// -----------------------------------------------------------------------------

export async function evaluateStudentTeachingResponse(params: {
  topicTitle: string;
  filePath: string;
  codeSnippet: string;
  checkpointQuestion: string;
  studentAnswer: string;
  expectedInvariants: string[];
  knownMisconceptions?: Array<{ triggerKeyword: string; explanation: string }>;
  currentDifficultyLevel: TeachingDifficultyLevel;
}): Promise<StudentEvaluationResult> {
  const { topicTitle, studentAnswer, expectedInvariants, knownMisconceptions = [] } = params;
  const answerLower = studentAnswer.toLowerCase();

  // 1. Check for known misconceptions
  const detectedMisconceptions: string[] = [];
  let misconceptionExplanation = "";

  for (const m of knownMisconceptions) {
    if (answerLower.includes(m.triggerKeyword.toLowerCase())) {
      detectedMisconceptions.push(m.triggerKeyword);
      misconceptionExplanation += ` ${m.explanation}`;
    }
  }

  // Common software engineering misconception checks
  if (answerLower.includes("client decides") || answerLower.includes("from request body") || answerLower.includes("req.body.orgid")) {
    detectedMisconceptions.push("untrusted_body_reliance");
    misconceptionExplanation += " Be careful: req.body can be easily forged by an attacker modifying the JSON payload with Curl or Postman.";
  }
  if (answerLower.includes("controller saves to db") || answerLower.includes("controller queries sql")) {
    detectedMisconceptions.push("controller_db_coupling");
    misconceptionExplanation += " Remember that controllers handle HTTP request/response serialization; the database repository is responsible for persistence.";
  }

  // 2. Keyword & semantic alignment scoring
  let matchedInvariants = 0;
  for (const inv of expectedInvariants) {
    const words = inv.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const matchCount = words.filter(w => answerLower.includes(w)).length;
    if (matchCount >= Math.min(2, words.length)) {
      matchedInvariants++;
    }
  }

  const invariantRatio = expectedInvariants.length > 0 ? matchedInvariants / expectedInvariants.length : 1;
  const isCorrect = (invariantRatio >= 0.5 || answerLower.length >= 25) && detectedMisconceptions.length === 0;
  const score = isCorrect
    ? Math.min(100, Math.round(70 + invariantRatio * 30))
    : detectedMisconceptions.length > 0
    ? 45
    : Math.max(30, Math.round(invariantRatio * 60));

  // 3. If Gemini is available, generate nuanced conversational feedback
  if (process.env.GEMINI_API_KEY && studentAnswer.length > 5) {
    try {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `You are Alex, an expert, encouraging, and razor-sharp Senior Software Engineering Teacher mentoring a student.
Topic: "${topicTitle}"
File: "${params.filePath}"
Code executing:
\`\`\`typescript
${params.codeSnippet}
\`\`\`

Checkpoint Question Asked:
"${params.checkpointQuestion}"

Student's Answer:
"${studentAnswer}"

Expected Invariants: ${expectedInvariants.join("; ")}

Respond with a JSON object:
{
  "isCorrect": boolean,
  "score": number (0 to 100),
  "teacherPraise": string (one sentence acknowledging what they understood),
  "correctionExplanation": string (two sentences guiding their mental model if imperfect, or cementing the architectural rule if correct),
  "demonstratedProof": string (cite the exact line of code proving this),
  "followUpQuestion": string (a short thought-provoking follow-up question to test deeper comprehension),
  "readyToAdvance": boolean
}`;

      const res = await model.generateContent(prompt);
      const text = res.response.text();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          isCorrect: parsed.isCorrect ?? isCorrect,
          score: parsed.score ?? score,
          understandingLevel: (parsed.isCorrect ? Math.min(6, params.currentDifficultyLevel + 1) : Math.max(1, params.currentDifficultyLevel)) as TeachingDifficultyLevel,
          teacherPraise: parsed.teacherPraise || (isCorrect ? "Excellent reasoning!" : "Good instinct, let's refine this."),
          misconceptionsDetected: detectedMisconceptions,
          correctionExplanation: parsed.correctionExplanation || misconceptionExplanation || "Review the exact data flow through the repository.",
          demonstratedProof: parsed.demonstratedProof || `Notice the check in ${params.filePath}.`,
          followUpQuestion: parsed.followUpQuestion,
          readyToAdvance: parsed.readyToAdvance ?? isCorrect,
        };
      }
    } catch (err) {
      console.warn("[personal-teacher-engine] Gemini API fallback to deterministic evaluation:", err);
    }
  }

  // 4. Deterministic Evaluation Fallback
  if (isCorrect) {
    return {
      isCorrect: true,
      score: Math.max(85, score),
      understandingLevel: Math.min(6, params.currentDifficultyLevel + 1) as TeachingDifficultyLevel,
      teacherPraise: "Spot on! That demonstrates real engineering comprehension.",
      misconceptionsDetected: [],
      correctionExplanation: `You accurately identified the key architectural invariant: ${expectedInvariants[0] || "the verified claims protect downstream state"}.`,
      demonstratedProof: `Observed directly in ${params.filePath} where verified claims are injected into req.user before controller dispatch.`,
      followUpQuestion: "What failure scenario would occur if this check were bypassed in production?",
      readyToAdvance: true,
    };
  } else {
    return {
      isCorrect: false,
      score: Math.max(40, score),
      understandingLevel: Math.max(1, params.currentDifficultyLevel - 1) as TeachingDifficultyLevel,
      teacherPraise: "You're thinking about the right area, but there is an important nuance here.",
      misconceptionsDetected: detectedMisconceptions,
      correctionExplanation: misconceptionExplanation || `Look closely at ${params.filePath}: we must verify that ${expectedInvariants[0] || "all state transitions respect the trust boundary"}.`,
      demonstratedProof: `In ${params.filePath}, note how the function explicitly isolates tenant context.`,
      followUpQuestion: "Can you see where the verified organization identity originates?",
      readyToAdvance: false,
    };
  }
}

// -----------------------------------------------------------------------------
// 4. ON-DEMAND INTERRUPT EXPLANATION PROVIDER
// -----------------------------------------------------------------------------

export function provideInterruptExplanation(params: {
  intent: "simpler_explanation" | "give_example" | "why_this_matters" | "internal_deep_dive" | "explain_again";
  topicTitle: string;
  filePath: string;
  functionName: string;
  codeSnippet: string;
  architectureStage: string;
  variablesSummary?: string;
  currentDifficultyLevel: TeachingDifficultyLevel;
}): {
  responseTitle: string;
  spokenExplanation: string;
  visualCodeHighlight?: string;
  nextSuggestedAction: string;
} {
  const { intent, topicTitle, filePath, functionName, architectureStage } = params;

  switch (intent) {
    case "simpler_explanation":
      return {
        responseTitle: "Alex: Intuitive Analogy",
        spokenExplanation: `Let's make this simple: Imagine you are entering a secure building with an ID badge. You don't get to write your own name and department on a napkin and hand it to the receptionist. The badge scanner reads the microchip in your badge and attaches your official clearance level. That's exactly what this code in ${filePath} does for the API!`,
        nextSuggestedAction: "Check the decoded token claims to see the verified tenant ID.",
      };

    case "give_example":
      return {
        responseTitle: "Alex: Production Scenario",
        spokenExplanation: `Here is a real example: Suppose User A belongs to Acme Corp and User B belongs to Globex. If User A tries to read or create a task with organizationId 'globex' in the JSON body, this layer rejects it or overwrites it with Acme Corp because the signed JWT cryptographic token says User A only has authority over Acme Corp.`,
        nextSuggestedAction: "Notice how the repository query appends organizationId to every SQL WHERE clause.",
      };

    case "why_this_matters":
      return {
        responseTitle: "Alex: Why This Matters",
        spokenExplanation: `Why do we do this? In multi-tenant SaaS, tenant data leakage is a company-ending security breach. Without strict architectural trust boundaries right at the ${architectureStage} layer, a simple bug in the frontend could expose private customer records to a competitor.`,
        nextSuggestedAction: "Verify where the request enters the domain service.",
      };

    case "internal_deep_dive":
      return {
        responseTitle: "Alex: Low-Level Mechanics",
        spokenExplanation: `Under the hood in Node.js, the Express framework executes middleware synchronously across an internal stack array. When ${functionName} executes, it holds the socket stream, verifies the HMAC-SHA256 signature, and stores the decoded claims on req.user in memory before passing control to next().`,
        nextSuggestedAction: "Inspect the call stack depth and variable allocations in the inspector panel.",
      };

    case "explain_again":
    default:
      return {
        responseTitle: "Alex: Re-explaining Concept",
        spokenExplanation: `Let's review ${topicTitle} once more: The request enters ${filePath} at ${functionName}. Its job is to cross the trust boundary, validate all invariants, and hand off clean, verified data to the service layer.`,
        nextSuggestedAction: "Answer the checkpoint question when you're ready to proceed.",
      };
  }
}
