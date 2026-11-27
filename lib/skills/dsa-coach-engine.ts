/**
 * lib/skills/dsa-coach-engine.ts
 * 
 * Socratic AI Coach Engine for Cognalyze Programming & DSA Arena.
 * 
 * Features:
 * 1. Socratic Pedagogical Behavior:
 *    - Understands candidate code, active problem constraints, and test outputs.
 *    - Never immediately gives away the entire solution unless explicitly requested (Tier 5).
 *    - Guides through mental models, boundary conditions, and algorithmic invariants.
 * 2. Multi-tier Progressive Assistance:
 *    - Tier 1: Mental Model & Pattern Recognition.
 *    - Tier 2: Invariant Check & Guiding Question.
 *    - Tier 3: Concrete Small Hint.
 *    - Tier 4: Algorithmic Approach / Pseudocode.
 *    - Tier 5: Complete Walkthrough & Reference Solution.
 * 3. Language Agnostic:
 *    - Understands C++, Python, JavaScript, and Java implementations.
 *    - Seamlessly supports English and natural Hinglish explanations.
 * 4. Resilient Fallback:
 *    - Uses Groq Cloud with fast model rotation.
 *    - If network/API is unavailable, falls back to deterministic, verified Socratic guidance.
 */

import { groqFetch } from "@/lib/groq";
import { DsaProblemFull } from "./dsa-curriculum";
import { CanonicalProblem } from "./dsa-canonical-problems";

export interface CoachMessage {
  sender: "coach" | "candidate";
  text: string;
}

export interface CoachTurnInput {
  candidateId: string;
  problem: DsaProblemFull | CanonicalProblem;
  code: string;
  language: "cpp" | "python" | "javascript" | "java";
  query: string;
  history?: CoachMessage[];
  testOutput?: {
    passed: boolean;
    verdict?: string;
    compilationError?: string;
    passedCount?: number;
    totalTests?: number;
    message?: string;
  } | null;
  preferredLanguage?: "en" | "hinglish";
}

export interface CoachTurnResult {
  reply: string;
  assistanceTier: 1 | 2 | 3 | 4 | 5;
  assistanceUsed: boolean;
  suggestedPromptChips: string[];
}

export async function executeDsaCoachTurn(input: CoachTurnInput): Promise<CoachTurnResult> {
  const {
    problem,
    code,
    language,
    query,
    history = [],
    testOutput,
    preferredLanguage = "en"
  } = input;

  const lowerQuery = query.toLowerCase();

  // Detect whether candidate is asking for full code / answer
  const isDirectSolutionDemanded =
    lowerQuery.includes("give me the code") ||
    lowerQuery.includes("give code") ||
    lowerQuery.includes("solution dedo") ||
    lowerQuery.includes("pura code") ||
    lowerQuery.includes("full solution") ||
    lowerQuery.includes("show solution");

  const isHinglish =
    preferredLanguage === "hinglish" ||
    lowerQuery.includes("batao") ||
    lowerQuery.includes("karo") ||
    lowerQuery.includes("samjhao") ||
    lowerQuery.includes("kaise") ||
    lowerQuery.includes("kya");

  // Determine assistance tier
  let tier: 1 | 2 | 3 | 4 | 5 = 1;
  if (isDirectSolutionDemanded) {
    tier = 4;
  } else if (lowerQuery.includes("hint") || lowerQuery.includes("clue")) {
    tier = 3;
  } else if (lowerQuery.includes("complexity") || lowerQuery.includes("time") || lowerQuery.includes("space")) {
    tier = 2;
  } else if (lowerQuery.includes("error") || lowerQuery.includes("fail") || lowerQuery.includes("test")) {
    tier = 2;
  }

  // Construct structured Socratic prompt
  const problemTitle = problem.title;
  const timeComp = problem.time_complexity || "optimal";
  const spaceComp = problem.space_complexity || "optimal";
  const hints = (problem.hints && problem.hints.length > 0) ? problem.hints.join("\n- ") : "Think about the search space and monotonicity.";

  const testInfo = testOutput
    ? `Test Status: ${testOutput.verdict || (testOutput.passed ? "Passed" : "Failed")}. Passed: ${testOutput.passedCount || 0}/${testOutput.totalTests || 0}. ${testOutput.compilationError ? `Error: ${testOutput.compilationError}` : ""}`
    : "No recent test run executed.";

  const systemPrompt = `You are the Cognalyze Socratic DSA Coach.
Your goal is to guide students to independent problem-solving mastery in Data Structures and Algorithms.

STRICT COACHING RULES:
1. NEVER output the complete working solution code unless tier 5 is explicitly requested.
2. Ask probing Socratic questions that guide the candidate to realize invariants, bounds, or pointer movements.
3. If they share buggy code or test failures, diagnose the root cause conceptually (e.g. integer overflow, off-by-one, boundary condition) rather than fixing it for them.
4. If candidate writes in Hinglish, respond warmly in conversational Hinglish (Hindi written in Roman script).
5. Keep explanations crisp, pedagogical, and encouraging (max 3-4 short paragraphs or bullet points).
6. Target Time Complexity: ${timeComp}. Target Space Complexity: ${spaceComp}.
7. Problem: "${problemTitle}".
8. Available Hints:
- ${hints}

Current Candidate Code (${language}):
\`\`\`${language}
${code.slice(0, 1500)}
\`\`\`

Test Run Context:
${testInfo}`;

  const userPrompt = `Candidate Query: "${query}"

Recent conversation:
${history.slice(-4).map(m => `${m.sender.toUpperCase()}: ${m.text}`).join("\n")}

Respond to the candidate following the Socratic coaching rules.`;

  try {
    const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 650
      })
    });

    if (res && res.ok) {
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      if (content) {
        return {
          reply: content,
          assistanceTier: tier,
          assistanceUsed: tier >= 3,
          suggestedPromptChips: getSuggestedChips(tier, isHinglish)
        };
      }
    }
  } catch (err) {
    // Graceful fallback to deterministic high-quality Socratic rules
  }

  // Deterministic Fallback Response
  const fallbackReply = generateDeterministicSocraticGuidance(problem, query, code, testOutput, isHinglish, tier);

  return {
    reply: fallbackReply,
    assistanceTier: tier,
    assistanceUsed: tier >= 3,
    suggestedPromptChips: getSuggestedChips(tier, isHinglish)
  };
}

function generateDeterministicSocraticGuidance(
  problem: DsaProblemFull | CanonicalProblem,
  query: string,
  code: string,
  testOutput: CoachTurnInput["testOutput"],
  isHinglish: boolean,
  tier: number
): string {
  const title = problem.title;
  const timeComp = problem.time_complexity || "optimal";

  if (testOutput?.compilationError) {
    if (isHinglish) {
      return `Aapke code mein syntax ya signature error aa raha hai:\n\`${testOutput.compilationError.slice(0, 120)}\`\n\nCheck kijiye: kya function name aur parameters problem statement ke exact signature se match kar rahe hain?`;
    }
    return `Your code encountered a compilation/signature issue:\n\`${testOutput.compilationError.slice(0, 120)}\`\n\nVerify that your function name and parameter types match the expected signature for **${title}**.`;
  }

  if (testOutput && !testOutput.passed) {
    if (isHinglish) {
      return `Aapka solution kuch test cases par fail ho raha hai (${testOutput.passedCount}/${testOutput.totalTests} passed).\n\n**Socratic Check:**\n1. Kya aapne boundary conditions check kiye? (Jaise $N = 1$, empty arrays, ya negative values?)\n2. Binary Search ya Two Pointers mein \`low <= high\` versus \`low < high\` ka termination condition sahi hai?\n3. Intermediate sums calculate karte waqt integer overflow toh nahi ho raha?`;
    }
    return `Your implementation passed ${testOutput.passedCount}/${testOutput.totalTests} test cases.\n\n**Key Invariants to Check:**\n1. **Edge Conditions:** How does your logic handle $N = 1$, empty inputs, or elements with duplicate values?\n2. **Termination:** If using pointers or binary search, is your loop condition strictly avoiding infinite loops?\n3. **Integer Bounds:** Are intermediate cumulative sums exceeding 32-bit integer limits?`;
  }

  if (tier >= 3) {
    const hint1 = problem.hints?.[0] || "Consider sorting or using a frequency map to eliminate redundant linear scans.";
    if (isHinglish) {
      return `**Hint for ${title}:**\n${hint1}\n\nTarget complexity: **${timeComp}**. Ek baar sochiye: kaunsa element ya boundary condition har step par strictly eliminate ho sakta hai?`;
    }
    return `**Algorithmic Hint for ${title}:**\n${hint1}\n\nAiming for **${timeComp}** runtime. Consider which half of the search space or which pointer movement can be safely ruled out at each step.`;
  }

  if (isHinglish) {
    return `**${title}** ko solve karte waqt pehle invariant define kijiye.\n\n- Brute force approach kya hai? Kya usme repeated work ho raha hai?\n- Target complexity **${timeComp}** achieve karne ke liye kya hum hash map, binary search, ya sliding window use kar sakte hain?\n\nAap code mein kis specific line ya condition par stuck feel kar rahe hain?`;
  }

  return `For **${title}**, let's reason through the core invariants:\n\n1. **Brute Force Baseline:** What is the naive approach, and what redundant computations does it perform?\n2. **Optimal Target:** To achieve **${timeComp}**, what data structure or monotonic property allows pruning unnecessary checks?\n\nWhich specific invariant or pointer transition would you like to examine together?`;
}

function getSuggestedChips(tier: number, isHinglish: boolean): string[] {
  if (isHinglish) {
    return [
      "Kya mera logic sahi direction mein hai?",
      "Mujhe ek chhota hint do",
      "Iska optimal time complexity kya hai?",
      "Edge cases kya ho sakte hain?"
    ];
  }
  return [
    "Check my invariant logic",
    "Give me a progressive hint",
    "What is the optimal complexity?",
    "What edge cases should I test?"
  ];
}

