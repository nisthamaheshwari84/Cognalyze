/**
 * lib/skills/ai-data/micro-learning-engine.ts
 *
 * Phase 3: Human-Centric Micro-Learning Engine for Cognalyze AI & Data Arena.
 * Ensures EVERY canonical topic (154) and EVERY subtopic (309) has:
 * - Short, digestible 10-part micro-learning structure (Understand -> Observe -> Try)
 * - English + natural Hinglish teaching mode
 * - Progressive disclosure (simple intuition first, toggleable deep mechanics)
 * - Schema-matched runnable code examples
 * - Real 1-minute interactive micro-practice per subtopic
 */

import {
  TaxonomyTopic,
  TaxonomySubtopic,
  getTopicLocation,
  getNextAndPreviousTopic,
} from "./master-curriculum-taxonomy";
import { TargetRoleSlug } from "./types";
import { TARGET_ROLE_PROFILES } from "./roles";
import { executePythonInSandbox } from "./python-lab-engine";
import { executeSqlInSandbox } from "./sql-lab-engine";

export type ContentLanguage = "english" | "hinglish";

export interface SubtopicMicroCheck {
  id: string;
  kind: "predict_output" | "spot_error" | "complete_code" | "apply_concept";
  questionPrompt: string;
  codeSnippet?: string;
  options: Array<{ id: string; text: string }>;
  correctOptionId: string;
  explanationEnglish: string;
  explanationHinglish: string;
}

export interface MicroLearningSubtopicUnit {
  subtopicId: string;
  topicId: string;
  title: string;
  order: number;
  concepts: string[];
  estimatedMinutes: number;
  // 10 Required Micro-Learning Parts
  whatIsIt: { english: string; hinglish: string };
  whyItMatters: { english: string; hinglish: string };
  whereUsed: string[];
  howItWorksSimple: { english: string; hinglish: string };
  howItWorksDeep: string;
  realWorldAnalogy: { english: string; hinglish: string };
  smallPracticalExample: string;
  runnableCodeExample: {
    language: "python" | "sql";
    code: string;
    expectedBehavior: string;
  };
  commonMistakes: string[];
  keyTakeaways: string[];
  microCheck: SubtopicMicroCheck;
}

export interface TopicMicroLearningPackage {
  topicId: string;
  subjectId: string;
  subjectTitle: string;
  moduleId: string;
  moduleTitle: string;
  topicTitle: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedMinutes: number;
  language: ContentLanguage;
  targetRole: TargetRoleSlug | string;
  roleWhy: string;
  connectionToPrevious: string;
  interviewRelevance: string[];
  prerequisites: Array<{ id: string; title: string }>;
  previousTopic: { id: string; title: string } | null;
  nextTopic: { id: string; title: string } | null;
  subtopicUnits: MicroLearningSubtopicUnit[];
}

interface SubjectAnalogyTemplate {
  analogyEn: (subTitle: string, c0: string) => string;
  analogyHi: (subTitle: string, c0: string) => string;
  whereUsed: string[];
  interviewFocus: string[];
}

const SUBJECT_TEACHING_PROFILES: Record<string, SubjectAnalogyTemplate> = {
  subj_python: {
    analogyEn: (sub, c0) =>
      `Think of ${sub} like organizing a kitchen prep station: every variable label points to a labeled jar (${c0}), so you can reuse ingredients safely without copying the whole pantry every time.`,
    analogyHi: (sub, c0) =>
      `${sub} ko ek kitchen prep station ki tarah samjhein: har variable ek label hai jo real data object (${c0}) ki taraf ishara karta hai, taaki memory waste na ho.`,
    whereUsed: ["Backend APIs & Automation Scripts", "Data Ingestion Workers", "ML & AI Orchestration Pipelines"],
    interviewFocus: ["Object mutability & reference semantics", "Time/space trade-offs in Python containers"],
  },
  subj_numpy: {
    analogyEn: (sub, c0) =>
      `Imagine painting a whole row of 1,000 tiles with a wide paint roller (${c0}) instead of dipping a tiny brush 1,000 times — that is how ${sub} processes contiguous numbers in C.`,
    analogyHi: (sub, c0) =>
      `Sochiye 1,000 tiles par ek chhote brush se ek-ek karke paint karne ke bajaye aap ek chauda roller (${c0}) chalate hain — ${sub} C-memory mein bilkul waise hi vectorized math karta hai.`,
    whereUsed: ["Feature Matrix Transformations", "Neural Network Tensor Operations", "Cosine Similarity & Embeddings"],
    interviewFocus: ["Broadcasting shape rules", "Contiguous views vs copies & vectorization speed"],
  },
  subj_pandas: {
    analogyEn: (sub, c0) =>
      `Think of ${sub} like a supercharged smart spreadsheet where columns have strict types and ${c0} aligns rows automatically by index even when rows arrive out of order.`,
    analogyHi: (sub, c0) =>
      `${sub} ko ek smart spreadsheet ki tarah samjhein jahan ${c0} har row ko index se match karta hai aur messy data cleanly filter ya aggregate hota hai.`,
    whereUsed: ["Exploratory Data Analysis (EDA)", "Time-Series & Cohort Feature Engineering", "Cleaning Null/Corrupt Production Exports"],
    interviewFocus: ["GroupBy aggregation vs transform", "Avoiding SettingWithCopyWarning & row loops"],
  },
  subj_sql: {
    analogyEn: (sub, c0) =>
      `Picture a well-indexed library catalog: instead of flipping through every book cover to cover, ${sub} (${c0}) lets the database jump directly to the matching shelves and summarize totals.`,
    analogyHi: (sub, c0) =>
      `${sub} ko ek smart library catalog ki tarah samjhein: poori kitaabein palatne ke bajaye database ${c0} ki madad se seedha relevant records nikalta hai.`,
    whereUsed: ["Product Funnel & Cohort Retention Reports", "Warehouse ETL Transformations", "Finance & Fraud Audits"],
    interviewFocus: ["Window functions (LAG/LEAD/DENSE_RANK)", "NULL semantics & JOIN cardinality safety"],
  },
  subj_stats_ab: {
    analogyEn: (sub, c0) =>
      `Before claiming a new medicine works, doctors test it against a placebo across enough patients; ${sub} (${c0}) stops product teams from shipping random coin-flip wins.`,
    analogyHi: (sub, c0) =>
      `Jaise nayi dawa ko bina control group ke approve nahi karte, ${sub} (${c0}) ensure karta hai ki A/B test ka result sirf luck nahi balki real statistical impact hai.`,
    whereUsed: ["Online A/B Experimentation", "Sample Ratio Mismatch (SRM) Checks", "Confidence Intervals & Risk Modeling"],
    interviewFocus: ["p-value vs practical significance", "Detecting SRM, peeking bias & network spillover"],
  },
  subj_ml: {
    analogyEn: (sub, c0) =>
      `Learning ${sub} is like tuning a thermostat with feedback: ${c0} measures how far predictions sit from reality and nudges parameters step by step without memorizing training noise.`,
    analogyHi: (sub, c0) =>
      `${sub} ko feedback-driven tuning ki tarah samjhein: ${c0} dekh ke model dekhta hai galti kitni hui aur parameters ko sahi direction mein adjust karta hai.`,
    whereUsed: ["Churn & Fraud Prediction", "Search & Feed Ranking", "Pricing & Demand Forecasting"],
    interviewFocus: ["Preventing train/test data leakage", "Precision-Recall trade-offs on imbalanced data"],
  },
  subj_deep_learning: {
    analogyEn: (sub, c0) =>
      `Think of ${sub} as a multi-floor assembly line where ${c0} passes signals forward and blames each adjustable knob proportionally backward whenever the final output misses.`,
    analogyHi: (sub, c0) =>
      `${sub} ek multi-layer factory line jaisa hai jahan signal aage badhta hai aur galti hone par ${c0} har weight ko uske contribution ke hisaab se update karta hai.`,
    whereUsed: ["Image & Speech Recognition", "Transformer Language Modeling", "Dense Semantic Embeddings"],
    interviewFocus: ["Backpropagation & gradient flow", "Scaled Dot-Product Self-Attention mechanics"],
  },
  subj_genai_llm: {
    analogyEn: (sub, c0) =>
      `An LLM without ${sub} is like a brilliant intern who speaks fluently in free-form paragraphs; adding ${c0} ensures strict JSON contracts and predictable production behavior.`,
    analogyHi: (sub, c0) =>
      `Bina ${sub} ke LLM sirf lambi kahani likhne wale intern jaisa hai; ${c0} lagane se output exact structured JSON format aur business rules follow karta hai.`,
    whereUsed: ["Structured Extraction Pipelines", "Domain Fine-Tuning (LoRA)", "Enterprise Copilots"],
    interviewFocus: ["Tokenization limits & temperature", "JSON schema validation & retry guardrails"],
  },
  subj_rag: {
    analogyEn: (sub, c0) =>
      `Think of ${sub} as an open-book exam: instead of relying on fuzzy memory, ${c0} finds the exact textbook paragraphs first so the model quotes verified facts.`,
    analogyHi: (sub, c0) =>
      `${sub} bilkul open-book exam jaisa hai: model ko andaza lagane ke bajaye ${c0} pehle exact sahi documents dhoondh kar laata hai taaki hallucinations na hon.`,
    whereUsed: ["Internal Company Knowledge Assistants", "Legal/Financial Document Q&A", "Customer Support Retrieval"],
    interviewFocus: ["Chunking overlap trade-offs", "Hybrid search (BM25 + Dense) & Cross-Encoder Reranking"],
  },
  subj_agents: {
    analogyEn: (sub, c0) =>
      `If an LLM is a brain in a jar, ${sub} (${c0}) gives it hands (tools), a notepad (memory), and safety brakes so it checks real data before acting.`,
    analogyHi: (sub, c0) =>
      `Agar LLM sirf dimaag hai, toh ${sub} (${c0}) usko haath (tools), diary (state memory) aur safety rules deta hai taaki woh verify karke action le.`,
    whereUsed: ["Autonomous Research & Triage Agents", "Multi-Step Tool Orchestration", "Automated Ticket Resolution"],
    interviewFocus: ["ReAct reasoning loops & tool schemas", "Cycle guards, max steps & permission boundaries"],
  },
  subj_data_engineering: {
    analogyEn: (sub, c0) =>
      `Think of ${sub} like city water plumbing with backup valves (${c0}): even if a pump restarts twice, homes receive clean, uncorrupted water without double billing.`,
    analogyHi: (sub, c0) =>
      `${sub} ko ek reliable water pipeline ki tarah samjhein: agar job fail hoke dobara chale tab bhi ${c0} duplicate data aur corrupt tables hone se rokta hai.`,
    whereUsed: ["Batch ETL / Streaming Pipelines", "Dimensional Warehouses (SCD Type 2)", "PySpark & Kafka Backfills"],
    interviewFocus: ["Idempotent retries & late data watermarks", "Partitioning & shuffle skew mitigation"],
  },
  subj_mlops: {
    analogyEn: (sub, c0) =>
      `Training a model is passing a driving test; ${sub} (${c0}) is maintaining the car on the highway with oil gauges, drift alarms, and instant rollback brakes.`,
    analogyHi: (sub, c0) =>
      `Model train karna sirf driving test paas karna hai; ${sub} (${c0}) highway par dashboard alerts, drift detection aur instant rollback safety brakes lagana hai.`,
    whereUsed: ["Low-Latency FastAPI Serving", "PSI Feature Drift Alerts", "Canary Model Rollouts"],
    interviewFocus: ["Training-serving skew", "Population Stability Index (PSI) & rollback automation"],
  },
  subj_ai_eval: {
    analogyEn: (sub, c0) =>
      `${sub} is a food safety inspector for AI: ${c0} tests every release against golden test cases and blocks prompt injections before reaching real users.`,
    analogyHi: (sub, c0) =>
      `${sub} AI ke liye quality & security inspector hai: ${c0} golden benchmarks aur injection guards se har release ko verify karta hai.`,
    whereUsed: ["CI/CD LLM Regression Gates", "Prompt Injection Defense", "PII Redaction & Faithfulness Audits"],
    interviewFocus: ["RAG Triad (Context Precision/Faithfulness/Relevance)", "Adversarial prompt defense"],
  },
  subj_ai_projects: {
    analogyEn: (sub, c0) =>
      `${sub} brings every workshop tool together to build a real deployable car — ${c0} connects ingestion, logic, evaluation, and verification end to end.`,
    analogyHi: (sub, c0) =>
      `${sub} saare alag-alag concepts ko jodkar ek real production project banata hai jahan ${c0} end-to-end kaam karta hai.`,
    whereUsed: ["Production Portfolio Capstones", "Take-Home Engineering Work Samples", "System Architecture Defenses"],
    interviewFocus: ["End-to-end latency, cost & failure-mode trade-offs"],
  },
};

function buildSchemaSafeExampleCode(subjectId: string, topic: TaxonomyTopic, sub: TaxonomySubtopic, idx: number): {
  language: "python" | "sql";
  code: string;
  expectedBehavior: string;
} {
  const isSql = subjectId === "subj_sql" || topic.id.startsWith("sql-");
  if (isSql) {
    if (idx % 2 === 0) {
      return {
        language: "sql",
        code: `-- Micro-Example: ${sub.title}\nSELECT\n  u.country,\n  COUNT(o.order_id) AS completed_orders,\n  ROUND(SUM(o.amount_cents) / 100.0, 2) AS total_revenue_usd\nFROM users u\nJOIN orders o ON u.user_id = o.user_id\nWHERE o.status = 'completed'\nGROUP BY u.country\nORDER BY total_revenue_usd DESC;`,
        expectedBehavior: "Groups completed orders per country cleanly on the `ecommerce_analytics` SQLite schema (`users` + `orders`).",
      };
    }
    return {
      language: "sql",
      code: `-- Window Function Example: ${sub.title}\nSELECT\n  order_id,\n  user_id,\n  order_date,\n  amount_cents,\n  SUM(amount_cents) OVER (PARTITION BY user_id ORDER BY order_date) AS running_spend_cents\nFROM orders\nWHERE status = 'completed'\nORDER BY user_id, order_date\nLIMIT 8;`,
      expectedBehavior: "Computes cumulative customer spend ordered chronologically without collapsing individual order rows.",
    };
  }

  // Use sanitized topic starter if available and safe (avoiding blocked third-party imports in raw sandbox snippet)
  const rawStarter = topic.starterCode || "";
  const safeFromLibraries =
    rawStarter &&
    !rawStarter.includes("import numpy") &&
    !rawStarter.includes("import pandas") &&
    !rawStarter.includes("import sklearn") &&
    !rawStarter.includes("import torch") &&
    !rawStarter.includes("pass\n");

  if (idx === 0 && safeFromLibraries) {
    return {
      language: "python",
      code: rawStarter,
      expectedBehavior: `Runs a small interactive example demonstrating ${sub.title}.`,
    };
  }

  const c0 = sub.concepts[0] || topic.title;
  return {
    language: "python",
    code: `# Interactive Micro-Example: ${sub.title}\ndef inspect_${sub.id.replace(/[^a-zA-Z0-9]/g, "_")}(samples):\n    cleaned = [round(float(x), 3) for x in samples if x is not None]\n    avg = round(sum(cleaned) / len(cleaned), 3) if cleaned else 0.0\n    return {"concept": ${JSON.stringify(c0)}, "count": len(cleaned), "mean": avg}\n\nprint(inspect_${sub.id.replace(/[^a-zA-Z0-9]/g, "_")}([12, None, 18, 24]))`,
    expectedBehavior: `Filters missing inputs safely and prints summary telemetry for ${c0}.`,
  };
}

function buildSubtopicMicroCheck(
  subjectId: string,
  topic: TaxonomyTopic,
  sub: TaxonomySubtopic,
  idx: number
): SubtopicMicroCheck {
  const c0 = sub.concepts[0] || topic.title;
  const c1 = sub.concepts[1] || topic.conceptsCovered[0] || "input validation";
  const isSql = subjectId === "subj_sql" || topic.id.startsWith("sql-");

  if (isSql) {
    return {
      id: `${sub.id}-check`,
      kind: "spot_error",
      questionPrompt: `Quick Check (${sub.title}): Why can filtering the right-hand table in a LEFT JOIN inside WHERE instead of ON break your output?`,
      codeSnippet: `SELECT u.user_id, o.order_id\nFROM users u\nLEFT JOIN orders o ON u.user_id = o.user_id\nWHERE o.status = 'completed';`,
      options: [
        { id: "a", text: "It silently turns the LEFT JOIN into an INNER JOIN by dropping unmatched NULL rows." },
        { id: "b", text: "SQLite refuses to parse WHERE after a LEFT JOIN." },
        { id: "c", text: "It duplicates every customer record twice." },
      ],
      correctOptionId: "a",
      explanationEnglish: "Unmatched users have `o.status = NULL`. Filtering `WHERE o.status = 'completed'` removes NULLs and drops users with 0 orders. Put `AND o.status = 'completed'` inside `ON` to keep all users.",
      explanationHinglish: "Jin users ke orders nahi hote unke liye `o.status` NULL hota hai. `WHERE` mein filter lagane se NULL rows drop ho jaati hain aur LEFT JOIN asal mein INNER JOIN ban jata hai.",
    };
  }

  if (idx % 3 === 0) {
    return {
      id: `${sub.id}-check`,
      kind: "apply_concept",
      questionPrompt: `One-Minute Check (${sub.title}): Which engineering statement accurately applies ${c0}?`,
      options: [
        { id: "a", text: `Applying ${c0} validates invariants (${c1}) explicitly before downstream processing or scoring.` },
        { id: "b", text: `${c0} skips edge-case checks automatically so runtime crashes become impossible.` },
        { id: "c", text: `${c0} is only theoretical and has no effect on production reliability.` },
      ],
      correctOptionId: "a",
      explanationEnglish: `Correct! In ${topic.title}, ${c0} directly safeguards ${c1} and prevents subtle silent bugs.`,
      explanationHinglish: `Bilkul sahi! ${topic.title} mein ${c0} explicitly ${c1} ko verify karke silent bugs se bachata hai.`,
    };
  }

  if (idx % 3 === 1) {
    return {
      id: `${sub.id}-check`,
      kind: "predict_output",
      questionPrompt: `Predict the Output (${sub.title} — applying ${c0}): What does this guard print?`,
      codeSnippet: `records = [10, None, 20]\nvalid = [x for x in records if x is not None]\nprint(len(valid), sum(valid))`,
      options: [
        { id: "a", text: "2 30" },
        { id: "b", text: "3 30" },
        { id: "c", text: "TypeError: unsupported operand type(s) for +: 'int' and 'NoneType'" },
      ],
      correctOptionId: "a",
      explanationEnglish: "Filtering `x is not None` removes `None` cleanly before summation, yielding 2 elements totaling 30.",
      explanationHinglish: "`x is not None` filter pehle `None` ko hata deta hai, isliye valid mein 2 items bachte hain aur sum 30 print hota hai.",
    };
  }

  return {
    id: `${sub.id}-check`,
    kind: "spot_error",
    questionPrompt: `Identify the Trap (${sub.title}): Which mistake commonly breaks production pipelines using ${c0}?`,
    options: [
      { id: "a", text: topic.deepExplanation?.commonMistakes?.[0] || `Ignoring boundary cases and empty inputs when applying ${c0}.` },
      { id: "b", text: "Adding deterministic unit assertions before running pipelines." },
      { id: "c", text: "Validating schema types and missing values early." },
    ],
    correctOptionId: "a",
    explanationEnglish: `Yes — watching out for "${topic.deepExplanation?.commonMistakes?.[0] || `edge cases in ${c0}`}" prevents silent failures.`,
    explanationHinglish: `Sahi pehchana — "${topic.deepExplanation?.commonMistakes?.[0] || `${c0} ke edge cases`}" ko handle karna production bugs rokta hai.`,
  };
}

export function buildMicroLearningPackage(
  topicId: string,
  targetRole: TargetRoleSlug | string = "ai_engineer",
  language: ContentLanguage = "english"
): TopicMicroLearningPackage | null {
  const location = getTopicLocation(topicId);
  if (!location) return null;

  const { topic, subject, module: mod } = location;
  const nav = getNextAndPreviousTopic(topic.id);
  const roleProfile = TARGET_ROLE_PROFILES[targetRole as TargetRoleSlug] || TARGET_ROLE_PROFILES.ai_engineer;
  const subjTemplate = SUBJECT_TEACHING_PROFILES[subject.id] || SUBJECT_TEACHING_PROFILES.subj_python;
  const roleRel = (topic.roleRelevance as Record<string, { importance: string; why: string }>)?.[targetRole];

  const subtopics: TaxonomySubtopic[] =
    topic.subtopics && topic.subtopics.length > 0
      ? topic.subtopics
      : [
          {
            id: `${topic.id}-sub-1`,
            title: topic.title,
            order: 1,
            concepts: topic.conceptsCovered || [topic.title],
          },
        ];

  const subtopicUnits: MicroLearningSubtopicUnit[] = subtopics.map((sub, idx) => {
    const concepts = sub.concepts?.length ? sub.concepts : topic.conceptsCovered;
    const c0 = concepts[0] || sub.title;
    const c1 = concepts[1] || topic.practicalOutcome || topic.title;

    return {
      subtopicId: sub.id,
      topicId: topic.id,
      title: sub.title,
      order: sub.order || idx + 1,
      concepts,
      estimatedMinutes: Math.max(5, Math.round(topic.estimatedMinutes / subtopics.length)),
      whatIsIt: {
        english:
          idx === 0
            ? `${sub.title} is a building block of ${topic.title}. Simply put: ${topic.contextAndIntuition.english}`
            : `${sub.title} focuses on ${c0} and ${c1} inside ${topic.title}, giving you a clean, predictable way to handle real inputs without ad-hoc guesswork.`,
        hinglish:
          idx === 0
            ? `${sub.title}, ${topic.title} ka ek important hissa hai. Aasaan shabdon mein: ${topic.contextAndIntuition.hinglish}`
            : `${sub.title} mainly ${c0} aur ${c1} par focus karta hai, taaki aap real data par predictable aur bug-free logic likh sakein.`,
      },
      whyItMatters: {
        english: `${topic.contextAndIntuition.whyExists} For a ${roleProfile.title}, mastering ${sub.title} directly unlocks: ${topic.practicalOutcome}`,
        hinglish: `${topic.contextAndIntuition.whyExists} ${roleProfile.title} role mein ${sub.title} samajhna zaroori hai kyunki: ${topic.practicalOutcome}`,
      },
      whereUsed: [topic.deepExplanation.realWorldUsage, ...subjTemplate.whereUsed.slice(0, 2)],
      howItWorksSimple: {
        english:
          idx === 0
            ? `Previously: ${topic.contextAndIntuition.whatWasUsedBefore} Today, ${sub.title} works step by step by organizing ${c0} cleanly before applying ${c1}.`
            : `Start by preparing clean inputs (${c0}), apply the deterministic rule for ${sub.title}, and verify edge cases (${c1}) before returning output.`,
        hinglish:
          idx === 0
            ? `Pehle engineers karte the: ${topic.contextAndIntuition.whatWasUsedBefore} Aaj ${sub.title} step-by-step ${c0} ko cleanly structure karke ${c1} apply karta hai.`
            : `Sabse pehle inputs ko clean rakhein (${c0}), phir ${sub.title} ka core step apply karein aur output return karne se pehle edge cases (${c1}) check karein.`,
      },
      howItWorksDeep: `${topic.deepExplanation.english}\n\n**Under the Hood:** ${topic.deepExplanation.internalMechanics}`,
      realWorldAnalogy: {
        english: subjTemplate.analogyEn(sub.title, c0),
        hinglish: subjTemplate.analogyHi(sub.title, c0),
      },
      smallPracticalExample: `Suppose you receive messy production data needing ${c0}. Applying ${sub.title} validates ${c1} on every record first so downstream steps never silently break.`,
      runnableCodeExample: buildSchemaSafeExampleCode(subject.id, topic, sub, idx),
      commonMistakes: topic.deepExplanation.commonMistakes.length
        ? topic.deepExplanation.commonMistakes
        : [`Skipping input validation or edge-case checks in ${sub.title}.`],
      keyTakeaways: [
        `${sub.title} connects ${c0} with ${c1} reliably.`,
        `Always verify edge cases (empty inputs, NULLs, type mismatches) early.`,
        `Master this step before moving to dependent concepts in ${subject.title}.`,
      ],
      microCheck: buildSubtopicMicroCheck(subject.id, topic, sub, idx),
    };
  });

  const connectionToPrevious = nav.previous
    ? `Builds directly on "${nav.previous.topic.title}" (${nav.previous.subject.title}), turning those mechanics into ${topic.practicalOutcome}`
    : `Foundational entry point for ${subject.title} — everything ahead builds on these concepts.`;

  return {
    topicId: topic.id,
    subjectId: subject.id,
    subjectTitle: subject.title,
    moduleId: mod.id,
    moduleTitle: mod.title,
    topicTitle: topic.title,
    difficulty: topic.difficulty,
    estimatedMinutes: topic.estimatedMinutes,
    language,
    targetRole,
    roleWhy: roleRel?.why || `Core competency required for ${roleProfile.title} workflows.`,
    connectionToPrevious,
    interviewRelevance: subjTemplate.interviewFocus,
    prerequisites: (topic.prerequisites || []).map((pid) => {
      const p = getTopicLocation(pid);
      return { id: pid, title: p?.topic.title || pid };
    }),
    previousTopic: nav.previous ? { id: nav.previous.topic.id, title: nav.previous.topic.title } : null,
    nextTopic: nav.next ? { id: nav.next.topic.id, title: nav.next.topic.title } : null,
    subtopicUnits,
  };
}

export function evaluateSubtopicMicroCheck(params: {
  topicId: string;
  subtopicId: string;
  selectedOptionId?: string;
  explanationText?: string;
  language?: ContentLanguage;
}): {
  passed: boolean;
  score: number;
  feedback: string;
  correctOptionId: string;
} {
  const pkg = buildMicroLearningPackage(params.topicId, "ai_engineer", params.language || "english");
  if (!pkg) {
    return {
      passed: false,
      score: 0,
      feedback: "Topic not found in canonical taxonomy.",
      correctOptionId: "",
    };
  }
  const unit = pkg.subtopicUnits.find((u) => u.subtopicId === params.subtopicId) || pkg.subtopicUnits[0];
  const check = unit.microCheck;
  const isHinglish = params.language === "hinglish";

  if (params.selectedOptionId) {
    const passed = params.selectedOptionId === check.correctOptionId;
    return {
      passed,
      score: passed ? 100 : 0,
      correctOptionId: check.correctOptionId,
      feedback: isHinglish ? check.explanationHinglish : check.explanationEnglish,
    };
  }

  // Own-words recall check fallback
  const words = (params.explanationText || "").trim().toLowerCase();
  const conceptMatches = unit.concepts.filter((c) => words.includes(c.toLowerCase().split(" ")[0]));
  const passed = words.length >= 35 && (conceptMatches.length >= 1 || words.split(/\s+/).length >= 8);
  return {
    passed,
    score: passed ? Math.min(100, 70 + conceptMatches.length * 15) : 35,
    correctOptionId: check.correctOptionId,
    feedback: passed
      ? `Great explanation in your own words covering ${conceptMatches.join(", ") || unit.title}!`
      : `Try mentioning key ideas like ${unit.concepts.slice(0, 2).join(" and ")} in a couple of clear sentences.`,
  };
}

export async function runMicroExampleInSandbox(params: {
  language: "python" | "sql";
  code: string;
}): Promise<{ success: boolean; stdout?: string; stderr?: string; rows?: unknown[]; columns?: string[]; executionTimeMs?: number }> {
  if (params.language === "sql") {
    const res = await executeSqlInSandbox("ecommerce_analytics", params.code);
    return {
      success: res.success,
      rows: res.rows,
      columns: res.columns,
      stderr: res.errorMessage,
      executionTimeMs: res.executionTimeMs,
    };
  }
  const res = await executePythonInSandbox(params.code);
  return {
    success: res.success,
    stdout: res.stdout,
    stderr: res.stderr || res.errorMessage,
    executionTimeMs: res.executionTimeMs,
  };
}
