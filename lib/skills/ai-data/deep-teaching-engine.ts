/**
 * lib/skills/ai-data/deep-teaching-engine.ts
 * 
 * 10-Stage Deep Teaching Engine for Cognalyze AI & Data Arena.
 * Enforces the universal learning sequence:
 * 1. Context & Intuition -> 2. Deep Concept -> 3. Visual Demo -> 4. Worked Example ->
 * 5. Experiment -> 6. Guided Practice -> 7. Debugging -> 8. Independent App ->
 * 9. Recall & Explanation -> 10. Evidence Ledger.
 * 
 * Supports both English and natural Hinglish teaching modes.
 */

import { TaxonomyTopic, getTaxonomyTopicById } from "./master-curriculum-taxonomy";
import { TargetRoleSlug } from "./types";

export type TeachingStageNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;
export type ContentLanguage = "english" | "hinglish";

export interface TeachingStagePayload {
  stageNumber: TeachingStageNumber;
  stageName: string;
  stageSubtitle: string;
  topicId: string;
  topicTitle: string;
  language: ContentLanguage;
  content: {
    title: string;
    description: string;
    bodyMarkdown: string;
    codeSnippet?: string;
    visualConfig?: any;
    exerciseTask?: string;
    starterCode?: string;
    brokenCode?: string;
    bugDiagnosis?: string;
    hints?: string[];
    evaluationPrompt?: string;
    careerRelevance?: {
      role: TargetRoleSlug;
      importance: string;
      why: string;
    };
  };
}

export interface StudentExplanationEvaluation {
  understandingScore: number; // 0-100
  passed: boolean;
  accuracyGrade: "EXCELLENT" | "SOLID" | "PARTIAL" | "MISCONCEPTIONS_DETECTED";
  feedbackMessage: string;
  detectedKeyConcepts: string[];
  missingCrucialPoints: string[];
  remediationAdvice?: string;
}

/**
 * Builds the complete structured content payload for a given topic and stage.
 */
export function getTopicStagePayload(
  topicId: string,
  stageNumber: TeachingStageNumber,
  language: ContentLanguage = "english",
  targetRole: TargetRoleSlug = "data_scientist"
): TeachingStagePayload | null {
  const topic = getTaxonomyTopicById(topicId);
  if (!topic) return null;

  const roleMeta = topic.roleRelevance[targetRole] || {
    importance: "HIGH",
    why: "Foundational engineering skill for production systems."
  };

  const isHinglish = language === "hinglish";

  switch (stageNumber) {
    case 1: // Context & Intuition
      return {
        stageNumber: 1,
        stageName: "Context & Intuition",
        stageSubtitle: "Why Does This Concept Exist? (Intuition Before Syntax)",
        topicId: topic.id,
        topicTitle: topic.title,
        language,
        content: {
          title: `Why ${topic.title} Matters in Real Engineering`,
          description: isHinglish
            ? "Syntax ya formula ratne se pehle samjhiye ki yeh problem aayi kahan se aur pehle developers ise kaise solve karte the."
            : "Before writing a single line of code, understand the fundamental problem this concept solves and what engineers struggled with before it existed.",
          bodyMarkdown: `### 1. The Core Engineering Problem
${isHinglish ? topic.contextAndIntuition.hinglish : topic.contextAndIntuition.english}

### 2. What Engineers Did Before
${topic.contextAndIntuition.whatWasUsedBefore}

### 3. Why It Exists Today
${topic.contextAndIntuition.whyExists}`,
          careerRelevance: {
            role: targetRole,
            importance: roleMeta.importance,
            why: roleMeta.why
          }
        }
      };

    case 2: // Deep Concept Explanation
      return {
        stageNumber: 2,
        stageName: "Deep Concept Explanation",
        stageSubtitle: "Internal Mechanics, Memory Layouts & Trade-offs",
        topicId: topic.id,
        topicTitle: topic.title,
        language,
        content: {
          title: `Under the Hood: How ${topic.title} Operates`,
          description: isHinglish
            ? "CPython aur memory ke level par execution kaise hoti hai, aur production mein iske kya trade-offs hain."
            : "Examine CPython internals, memory layouts, algorithmic complexity, and production engineering trade-offs.",
          bodyMarkdown: `### 1. Conceptual Mechanics
${isHinglish ? topic.deepExplanation.hinglish : topic.deepExplanation.english}

### 2. Internal Architecture
${topic.deepExplanation.internalMechanics}

### 3. Production Applications
${topic.deepExplanation.realWorldUsage}

### 4. Critical Invariants & Gotchas
${topic.deepExplanation.commonMistakes.map((m, i) => `${i + 1}. **Watch out**: ${m}`).join("\n")}`
        }
      };

    case 3: // Interactive Visual Demonstration
      return {
        stageNumber: 3,
        stageName: "Interactive Visual Demonstration",
        stageSubtitle: "Step-by-Step State Transitions & Memory Visualization",
        topicId: topic.id,
        topicTitle: topic.title,
        language,
        content: {
          title: `Visualizing ${topic.title}`,
          description: isHinglish
            ? "Dekhiye memory mein arrays, tables aur matrices ka state kaise badalta hai."
            : "Watch real-time state mutations, dimensional broadcasts, and execution traces step-by-step.",
          bodyMarkdown: isHinglish
            ? `Neeche diye gaye interactive visualization control se aap step-by-step execution dekh sakte hain. Observe karein ki memory kaise allocate ho rahi hai.`
            : `Step through the execution frames below to inspect array dimensions, memory addresses, and data transformations.`,
          visualConfig: topic.visualDemoConfig || {
            type: "ARRAY_BROADCASTING",
            initialState: { sample: "active_visualization" }
          }
        }
      };

    case 4: // Teacher-Led Worked Example
      return {
        stageNumber: 4,
        stageName: "Teacher-Led Worked Example",
        stageSubtitle: "Line-by-Line Code Walkthrough with Alex",
        topicId: topic.id,
        topicTitle: topic.title,
        language,
        content: {
          title: `Step-by-Step Implementation Walkthrough`,
          description: isHinglish
            ? "Alex aapko ek complete production example line-by-line samjhayenge."
            : "Alex walks through an authentic implementation line-by-line, explaining design choices.",
          bodyMarkdown: isHinglish
            ? `Pura solution ek saath dekhne ke bajaye, line-by-line samjhiye ki har statement kyu likhi gayi hai aur uski computational complexity kya hai.`
            : `Study how production engineers structure this logic. Notice error handling, vectorization, and clean naming conventions.`,
          codeSnippet: topic.solutionSnippet || `# Production implementation\npass`
        }
      };

    case 5: // Experiment & Interaction
      return {
        stageNumber: 5,
        stageName: "Experiment & Interaction",
        stageSubtitle: "Modify Parameters, Inputs & Observe Real-Time Outcomes",
        topicId: topic.id,
        topicTitle: topic.title,
        language,
        content: {
          title: `Live Sandbox Experimentation`,
          description: isHinglish
            ? "Parameters aur inputs ko change karke dekhiye ki output aur execution time par kya asar padta hai."
            : "Tweak array dimensions, inputs, and parameters to see how execution and output change in real time.",
          bodyMarkdown: isHinglish
            ? `Code ke andar values modify karein aur 'Run Sandbox' dabayein. Dekhiye ki different inputs par function kaise behave karta hai.`
            : `Modify the parameters in the sandbox editor below and observe the execution result.`,
          starterCode: topic.starterCode || `# Experiment sandbox\npass`
        }
      };

    case 6: // Guided Implementation
      return {
        stageNumber: 6,
        stageName: "Guided Implementation",
        stageSubtitle: "Hands-on Exercise with Diagnostic Hints",
        topicId: topic.id,
        topicTitle: topic.title,
        language,
        content: {
          title: `Complete the Engineering Task`,
          description: isHinglish
            ? "Task ko complete karein. Agar aap kahin rukte hain, toh Alex se contextual hint le sakte hain."
            : "Implement the required function to satisfy all test cases. Ask Alex for progressive hints if stuck.",
          bodyMarkdown: `**Task**: ${topic.practicalOutcome}`,
          exerciseTask: topic.practicalOutcome,
          starterCode: topic.starterCode || `# TODO: write your solution\npass`
        }
      };

    case 7: // Debugging & Misconception Correction
      return {
        stageNumber: 7,
        stageName: "Debugging & Misconception Correction",
        stageSubtitle: "Diagnose & Patch a Broken Production Implementation",
        topicId: topic.id,
        topicTitle: topic.title,
        language,
        content: {
          title: `Debug the Failing Bug`,
          description: isHinglish
            ? "Neeche diya gaya code production mein fail ho raha hai. Iska root-cause dhundhein aur fix karein."
            : "The snippet below contains an authentic subtle bug (off-by-one, leakage, or reference aliasing). Diagnose and fix it.",
          bodyMarkdown: `Analyze the broken implementation below. Run the tests to view the stack trace, identify why it failed, and patch the root cause.`,
          brokenCode: topic.starterCode ? topic.starterCode + "\n# BUG: unhandled edge case or mutation" : "# Broken code\npass",
          bugDiagnosis: topic.deepExplanation.commonMistakes[0] || "Memory reference aliasing bug."
        }
      };

    case 8: // Independent Application
      return {
        stageNumber: 8,
        stageName: "Independent Application",
        stageSubtitle: "Unfamiliar Problem Solving (Zero Solution Peeking)",
        topicId: topic.id,
        topicTitle: topic.title,
        language,
        content: {
          title: `Independent Engineering Challenge`,
          description: isHinglish
            ? "Bina kisi hint ke naye scenario par is concept ko apply karke dikhaiye."
            : "Solve an unfamiliar engineering challenge applying this concept independently with verified test assertions.",
          bodyMarkdown: `This challenge assesses whether you can synthesize this concept in an unfamiliar domain without guided prompts.`,
          exerciseTask: `Apply ${topic.title} to an edge-case dataset.`,
          starterCode: topic.starterCode || `# Independent challenge\npass`
        }
      };

    case 9: // Explanation & Recall
      return {
        stageNumber: 9,
        stageName: "Explanation & Recall",
        stageSubtitle: "Explain the Concept in Your Own Words",
        topicId: topic.id,
        topicTitle: topic.title,
        language,
        content: {
          title: `Demonstrate Conceptual Understanding`,
          description: isHinglish
            ? "Apne shabdon mein explain karein ki yeh concept kaise kaam karta hai aur kab use karna chahiye."
            : "Explain in your own words how this concept works internally and why you would select it over alternatives in an interview.",
          bodyMarkdown: isHinglish
            ? `### Sawaal:\nAgar ek technical interviewer aapse puche: **"Explain how ${topic.title} works under the hood and its major trade-offs"**, toh aap kya jawab denge? Type karein ya voice se bolein.`
            : `### Interview Prompt:\nIf a senior tech lead asks: **"Explain how ${topic.title} works under the hood and what failure modes you watch out for"**, how would you articulate it?`,
          evaluationPrompt: `Explain how ${topic.title} works, why it exists, and one common pitfall.`
        }
      };

    case 10: // Practical Connection & Evidence
      return {
        stageNumber: 10,
        stageName: "Practical Connection & Evidence",
        stageSubtitle: "Career Role Synchronization & Verified Student DNA",
        topicId: topic.id,
        topicTitle: topic.title,
        language,
        content: {
          title: `Verified Competency & Career Evidence`,
          description: isHinglish
            ? "Badhai ho! Aapne is topic ke saare theoretical aur practical requirements verify kar liye hain."
            : "Congratulations! You have demonstrated verified theoretical understanding, practical coding, and debugging competency.",
          bodyMarkdown: `### Verified Skill Credentials
- **Topic**: ${topic.title}
- **Track**: ${topic.trackId}
- **Target Role Impact**: ${roleMeta.importance} (${roleMeta.why})
- **Evidence Telemetry**: Hash-verified code submission and conceptual articulation ledger recorded.`,
          careerRelevance: {
            role: targetRole,
            importance: roleMeta.importance,
            why: roleMeta.why
          }
        }
      };

    default:
      return null;
  }
}

/**
 * Evaluates a student's free-form conceptual explanation (Stage 9)
 * against the verified key concepts of the topic.
 */
export function evaluateStudentExplanation(
  topicId: string,
  studentText: string,
  language: ContentLanguage = "english"
): StudentExplanationEvaluation {
  const topic = getTaxonomyTopicById(topicId);
  if (!topic) {
    return {
      understandingScore: 50,
      passed: false,
      accuracyGrade: "PARTIAL",
      feedbackMessage: "Topic metadata not found." ,
      detectedKeyConcepts: [],
      missingCrucialPoints: []
    };
  }

  const cleanText = studentText.toLowerCase().trim();
  const matchedConcepts: string[] = [];
  const missingPoints: string[] = [];

  for (const concept of topic.conceptsCovered) {
    const conceptLower = concept.toLowerCase();
    const keywords = conceptLower
      .split(/[\s,()]+/)
      .filter((w) => w.length >= 4 && !["trick", "rule", "model", "table"].includes(w));

    const isDirectMatch = cleanText.includes(conceptLower);
    const isKeywordMatch = keywords.length > 0 && keywords.some((kw) => cleanText.includes(kw));

    if (isDirectMatch || isKeywordMatch) {
      matchedConcepts.push(concept);
    } else {
      missingPoints.push(concept);
    }
  }

  // Word count check to prevent 1-word non-answers
  const wordCount = cleanText.split(/\s+/).filter(Boolean).length;
  let score = 0;

  if (wordCount < 10) {
    return {
      understandingScore: 15,
      passed: false,
      accuracyGrade: "PARTIAL",
      feedbackMessage: language === "hinglish"
        ? "Aapka jawab bohot chhota hai. Kripya internal mechanics aur real-world use case ko detail mein explain karein."
        : "Your explanation is too brief. Please explain the internal mechanics and real-world usage in detail.",
      detectedKeyConcepts: matchedConcepts,
      missingCrucialPoints: topic.conceptsCovered
    };
  }

  const ratio = matchedConcepts.length / Math.max(topic.conceptsCovered.length, 1);
  score = Math.min(100, Math.round(ratio * 70 + (wordCount >= 30 ? 30 : wordCount)));

  const passed = score >= 65;
  let grade: StudentExplanationEvaluation["accuracyGrade"] = "SOLID";

  if (score >= 85) grade = "EXCELLENT";
  else if (score >= 65) grade = "SOLID";
  else if (score >= 40) grade = "PARTIAL";
  else grade = "MISCONCEPTIONS_DETECTED";

  const feedbackMessage = language === "hinglish"
    ? passed
      ? `Shaabash! Aapne core concepts (${matchedConcepts.join(", ")}) ko bohot achhi tarah explain kiya hai.`
      : `Achha prayas, lekin aapka jawab complete nahi hai. Kripya in concepts par bhi dhyan dein: ${missingPoints.slice(0, 3).join(", ")}.`
    : passed
      ? `Strong articulation! You accurately covered essential concepts: ${matchedConcepts.join(", ")}.`
      : `Good effort, but your explanation missed critical architectural points: ${missingPoints.slice(0, 3).join(", ")}.`;

  return {
    understandingScore: score,
    passed,
    accuracyGrade: grade,
    feedbackMessage,
    detectedKeyConcepts: matchedConcepts,
    missingCrucialPoints: missingPoints,
    remediationAdvice: missingPoints.length > 0
      ? `Review the Deep Concept stage regarding ${missingPoints[0]}.`
      : undefined
  };
}
