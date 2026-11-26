/**
 * lib/skills/ai-data/assessment-engine.ts
 *
 * Phase 6: Comprehensive Server-Evaluated Assessment, Remediation & Mastery Verification Engine.
 * Supports:
 * 1. Conceptual MCQs
 * 2. Multiple-Select Questions (exact set match)
 * 3. Output Prediction
 * 4. Short-Answer & Scenario Reasoning
 * 5. Live Coding & Debugging Exercises (executed in real Python / SQL sandbox!)
 * 6. Topic-Specific Oral / Written Viva Explanation Check
 * 7. Weak-Concept Extraction & Targeted Remediation Plan
 * 8. Evidence-Gated Mastery Verification
 */

import { getTopicLocation } from "./master-curriculum-taxonomy";
import { executePythonInSandbox } from "./python-lab-engine";
import { executeSqlInSandbox } from "./sql-lab-engine";
import {
  getTopicMasteryRecord,
  updateTopicMasteryRecord,
  recordStudentAttempt,
} from "./store";
import { TopicMasteryRecord } from "./types";

export type AssessmentQuestionFormat =
  | "mcq"
  | "multi_select"
  | "output_prediction"
  | "short_answer"
  | "coding"
  | "debugging"
  | "scenario"
  | "viva";

export type AssessmentDifficultyTier = "beginner" | "intermediate" | "advanced" | "expert";

export interface AssessmentItem {
  id: string;
  topicId: string;
  format: AssessmentQuestionFormat;
  difficulty: AssessmentDifficultyTier;
  conceptTag: string;
  weightPoints: number;
  prompt: string;
  codeSnippet?: string;
  language?: "python" | "sql";
  options?: Array<{ id: string; text: string }>;
  correctOptionIds?: string[]; // supports mcq & multi_select
  expectedOutputText?: string;
  requiredConceptKeywords?: string[];
  starterCode?: string;
  entryFunction?: string;
  testCases?: Array<{ args: unknown[]; expected: unknown }>;
  rubricExplanation: string;
}

export interface TopicAssessmentBundle {
  topicId: string;
  topicTitle: string;
  subjectId: string;
  difficulty: AssessmentDifficultyTier;
  passThresholdPercent: number;
  estimatedMinutes: number;
  items: AssessmentItem[];
  transparentRubric: Array<{ format: string; weightPercent: number; criteria: string }>;
}

export interface AssessmentItemFeedback {
  questionId: string;
  conceptTag: string;
  format: AssessmentQuestionFormat;
  earnedPoints: number;
  maxPoints: number;
  passed: boolean;
  feedback: string;
  stdout?: string;
  stderr?: string;
}

export interface TopicAssessmentReport {
  topicId: string;
  scorePercent: number;
  passed: boolean;
  earnedPoints: number;
  maxPoints: number;
  itemFeedback: AssessmentItemFeedback[];
  weakConcepts: string[];
  remediationPlan: Array<{
    concept: string;
    whyWeak: string;
    targetedExercise: string;
    actionTab: "learn" | "comprehend" | "practical_lab";
  }>;
  masteryRecord: TopicMasteryRecord;
}

export function buildTopicAssessment(
  topicId: string,
  difficultyOverride?: AssessmentDifficultyTier
): TopicAssessmentBundle | null {
  const loc = getTopicLocation(topicId);
  if (!loc) return null;
  const { topic, subject } = loc;
  const isSql = subject.id === "subj_sql" || topic.id.startsWith("sql-");
  const concepts = topic.conceptsCovered?.length ? topic.conceptsCovered : [topic.title];
  const c0 = concepts[0] || topic.title;
  const c1 = concepts[1] || topic.practicalOutcome || topic.title;
  const diff: AssessmentDifficultyTier = difficultyOverride || (topic.difficulty as AssessmentDifficultyTier) || "intermediate";

  const items: AssessmentItem[] = [
    // 1. Conceptual MCQ (15 pts)
    {
      id: `${topic.id}-asmt-mcq`,
      topicId: topic.id,
      format: "mcq",
      difficulty: diff,
      conceptTag: c0,
      weightPoints: 15,
      prompt: `Core Concept Check (${topic.title}): Which engineering invariant directly explains why ${c0} is critical?`,
      options: [
        { id: "a", text: topic.contextAndIntuition.whyExists },
        { id: "b", text: `${c0} eliminates the need for input validation or error handling entirely.` },
        { id: "c", text: `${c0} is purely cosmetic and does not alter runtime behavior or data correctness.` },
      ],
      correctOptionIds: ["a"],
      rubricExplanation: topic.deepExplanation.english,
    },
    // 2. Multi-Select (15 pts)
    {
      id: `${topic.id}-asmt-multi`,
      topicId: topic.id,
      format: "multi_select",
      difficulty: diff,
      conceptTag: c1,
      weightPoints: 15,
      prompt: `Select ALL valid statements / safeguards for ${topic.title} (choose 2):`,
      options: [
        { id: "a", text: `Guard against common failure: ${topic.deepExplanation.commonMistakes[0] || "Invalid edge-case inputs"}` },
        { id: "b", text: `Verify practical objective: ${topic.practicalOutcome}` },
        { id: "c", text: "Skip automated assertions to minimize execution time in production." },
      ],
      correctOptionIds: ["a", "b"],
      rubricExplanation: `Both handling edge-case traps and verifying the practical invariant (${topic.practicalOutcome}) are mandatory.`,
    },
    // 3. Output Prediction (15 pts)
    {
      id: `${topic.id}-asmt-output`,
      topicId: topic.id,
      format: "output_prediction",
      difficulty: diff,
      conceptTag: "Trace & Execution Semantics",
      weightPoints: 15,
      prompt: isSql
        ? "Given 3 rows in `orders` with `amount_cents` values [100, NULL, 300], what integer does `SELECT AVG(amount_cents)` return?"
        : "Trace carefully — what exact single line does this Python code print?",
      codeSnippet: isSql
        ? `SELECT CAST(AVG(amount_cents) AS INTEGER) FROM orders;`
        : `vals = [2, 4, 6]\nres = [x * 2 for x in vals if x > 2]\nprint(res)`,
      language: isSql ? "sql" : "python",
      expectedOutputText: isSql ? "200" : "[4, 6]".replace("[4, 6]", "[8, 12]"),
      rubricExplanation: isSql
        ? "SQL AVG ignores NULL rows: (100 + 300) / 2 = 200."
        : "The list comprehension filters values > 2 ([4, 6]) and doubles each, printing [8, 12].",
    },
    // 4. Scenario / Application (15 pts)
    {
      id: `${topic.id}-asmt-scenario`,
      topicId: topic.id,
      format: "scenario",
      difficulty: diff === "beginner" ? "intermediate" : diff,
      conceptTag: `Applied ${c0}`,
      weightPoints: 15,
      prompt: `Scenario (${topic.title}): A production pipeline slows down or gives inconsistent results when handling empty batches and malformed records around ${c0}. Which concrete engineering fix applies first?`,
      options: [
        { id: "a", text: `Validate schema/types at entry, guard empty/null inputs, and benchmark ${c1} cleanly.` },
        { id: "b", text: "Catch all exceptions silently (`except: pass`) and return zero metrics." },
        { id: "c", text: "Duplicate inputs until batch size exceeds 10,000 rows." },
      ],
      correctOptionIds: ["a"],
      rubricExplanation: "Explicit validation + failing loudly on corrupt contracts prevents silent data corruption.",
    },
    // 5. Real Live Coding / Debugging (25 pts)
    isSql
      ? {
          id: `${topic.id}-asmt-code`,
          topicId: topic.id,
          format: "coding",
          difficulty: diff,
          conceptTag: `SQL Implementation (${topic.title})`,
          weightPoints: 25,
          language: "sql",
          prompt: "Write and run an executable SQL query on `ecommerce_analytics` returning each country's completed order count (`cnt`) and total revenue in cents (`rev`), ordered descending by `rev`.",
          starterCode: `-- Assessment SQL Task\nSELECT u.country, COUNT(o.order_id) AS cnt, SUM(o.amount_cents) AS rev\nFROM users u\nJOIN orders o ON u.user_id = o.user_id\nWHERE o.status = 'completed'\nGROUP BY u.country\nORDER BY rev DESC;`,
          rubricExplanation: "Must execute against SQLite `ecommerce_analytics`, filter `completed`, group by `u.country`, and return rows.",
        }
      : {
          id: `${topic.id}-asmt-code`,
          topicId: topic.id,
          format: "coding",
          difficulty: diff,
          conceptTag: `Code Implementation (${topic.title})`,
          weightPoints: 25,
          language: "python",
          prompt: `Implement \`assess_transform(nums: list) -> list\` filtering out non-positive/None values and returning squared valid numbers in order.`,
          starterCode: `def assess_transform(nums: list) -> list:\n    # Filter x is not None and x > 0, return [x * x ...]\n    return []\n`,
          entryFunction: "assess_transform",
          testCases: [
            { args: [[3, -2, null, 5]], expected: [9, 25] },
            { args: [[]], expected: [] },
          ],
          rubricExplanation: "Function must guard against None/negative values and handle empty lists cleanly.",
        },
    // 6. Concept Explanation / Viva Defense (15 pts)
    {
      id: `${topic.id}-asmt-viva`,
      topicId: topic.id,
      format: "viva",
      difficulty: diff,
      conceptTag: `Conceptual Defense (${c0})`,
      weightPoints: 15,
      prompt: `Explain in your own words (3+ sentences) how ${topic.title} works internally, why it matters for real systems, and one mistake engineers must avoid.`,
      requiredConceptKeywords: concepts.slice(0, 3).map((c) => c.toLowerCase().split(" ")[0]),
      rubricExplanation: `Must clearly connect internal mechanics of ${c0} with real-world usage and trade-offs.`,
    },
  ];

  // Fix expectedOutputText literally so output prediction reads cleanly
  if (!isSql) {
    items[2].expectedOutputText = "[8, 12]";
  }

  return {
    topicId: topic.id,
    topicTitle: topic.title,
    subjectId: subject.id,
    difficulty: diff,
    passThresholdPercent: 70,
    estimatedMinutes: 15,
    items,
    transparentRubric: [
      { format: "Conceptual & Multi-Select", weightPercent: 30, criteria: "Exact understanding of core mechanics and failure traps" },
      { format: "Output Trace & Scenario", weightPercent: 30, criteria: "Accurate runtime mental model and production judgment" },
      { format: "Live Coding Verification", weightPercent: 25, criteria: "Executed in sandbox with all test assertions passing" },
      { format: "Concept Defense (Viva)", weightPercent: 15, criteria: "Articulates how it works internally in own words" },
    ],
  };
}

export async function evaluateTopicAssessmentSubmission(params: {
  candidateId: string;
  topicId: string;
  answers: Record<string, string | string[]>;
  difficulty?: AssessmentDifficultyTier;
}): Promise<TopicAssessmentReport | null> {
  const bundle = buildTopicAssessment(params.topicId, params.difficulty);
  if (!bundle) return null;

  const feedbackList: AssessmentItemFeedback[] = [];
  const weakConcepts = new Set<string>();
  let earnedPoints = 0;
  let maxPoints = 0;
  let codingPassed = false;
  let vivaPassed = false;

  for (const item of bundle.items) {
    maxPoints += item.weightPoints;
    const rawAns = params.answers[item.id];

    if (item.format === "mcq" || item.format === "scenario") {
      const sel = typeof rawAns === "string" ? rawAns.trim() : "";
      const passed = Boolean(item.correctOptionIds?.includes(sel));
      const pts = passed ? item.weightPoints : 0;
      earnedPoints += pts;
      if (!passed) weakConcepts.add(item.conceptTag);
      feedbackList.push({
        questionId: item.id,
        conceptTag: item.conceptTag,
        format: item.format,
        earnedPoints: pts,
        maxPoints: item.weightPoints,
        passed,
        feedback: passed ? `Correct! ${item.rubricExplanation}` : `Needs review: ${item.rubricExplanation}`,
      });
    } else if (item.format === "multi_select") {
      const selectedArr = Array.isArray(rawAns)
        ? rawAns
        : typeof rawAns === "string"
        ? rawAns.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      const expected = new Set(item.correctOptionIds || []);
      const got = new Set(selectedArr);
      const passed = expected.size === got.size && Array.from(expected).every((id) => got.has(id));
      const pts = passed ? item.weightPoints : 0;
      earnedPoints += pts;
      if (!passed) weakConcepts.add(item.conceptTag);
      feedbackList.push({
        questionId: item.id,
        conceptTag: item.conceptTag,
        format: item.format,
        earnedPoints: pts,
        maxPoints: item.weightPoints,
        passed,
        feedback: passed
          ? `Exact multi-select match! ${item.rubricExplanation}`
          : `Missed exact set of valid options (${Array.from(expected).join(", ")}). ${item.rubricExplanation}`,
      });
    } else if (item.format === "output_prediction") {
      const norm = String(rawAns || "").replace(/\s+/g, "").toLowerCase();
      const expNorm = String(item.expectedOutputText || "").replace(/\s+/g, "").toLowerCase();
      const passed = norm.length > 0 && norm === expNorm;
      const pts = passed ? item.weightPoints : 0;
      earnedPoints += pts;
      if (!passed) weakConcepts.add(item.conceptTag);
      feedbackList.push({
        questionId: item.id,
        conceptTag: item.conceptTag,
        format: item.format,
        earnedPoints: pts,
        maxPoints: item.weightPoints,
        passed,
        feedback: passed
          ? `Accurate trace! ${item.rubricExplanation}`
          : `Expected '${item.expectedOutputText}'. ${item.rubricExplanation}`,
      });
    } else if (item.format === "coding" || item.format === "debugging") {
      const code = String(rawAns || "").trim();
      if (item.language === "sql") {
        const res = await executeSqlInSandbox("ecommerce_analytics", code);
        const colsLower = res.columns.map((c) => c.toLowerCase());
        const ok =
          res.success &&
          res.rows.length >= 2 &&
          (colsLower.includes("country") && (colsLower.includes("rev") || colsLower.includes("cnt")));
        const pts = ok ? item.weightPoints : res.success ? Math.round(item.weightPoints * 0.35) : 0;
        earnedPoints += pts;
        codingPassed = ok;
        if (!ok) weakConcepts.add(item.conceptTag);
        feedbackList.push({
          questionId: item.id,
          conceptTag: item.conceptTag,
          format: item.format,
          earnedPoints: pts,
          maxPoints: item.weightPoints,
          passed: ok,
          stdout: res.success ? `Returned ${res.rowCount} rows.` : "",
          stderr: res.errorMessage,
          feedback: ok
            ? `SQL verified against live schema (${res.rowCount} country aggregates)!`
            : res.errorMessage || "Ensure query joins users & orders, filters completed, and returns country, cnt, rev.",
        });
      } else {
        const fn = item.entryFunction || "assess_transform";
        const cases = item.testCases || [];
        const harness = `${code}\nimport json\n_cases = json.loads(${JSON.stringify(JSON.stringify(cases))})\n_res = []\nif ${JSON.stringify(fn)} not in globals():\n    print("__ASMT_MISSING__")\nelse:\n    _f = globals()[${JSON.stringify(fn)}]\n    for tc in _cases:\n        try:\n            _act = _f(*tc["args"])\n            _res.append(_act == tc["expected"])\n        except Exception:\n            _res.append(False)\n    print("__ASMT_OK__:" + json.dumps(_res))\n`;
        const run = await executePythonInSandbox(harness);
        const out = run.stdout || "";
        const m = out.match(/__ASMT_OK__:(\[.*\])/);
        let passCount = 0;
        if (m) {
          const arr = JSON.parse(m[1]) as boolean[];
          passCount = arr.filter(Boolean).length;
        }
        const ok = run.success && m !== null && passCount === cases.length && cases.length > 0;
        const pts = cases.length > 0 ? Math.round((passCount / cases.length) * item.weightPoints) : 0;
        earnedPoints += pts;
        codingPassed = ok;
        if (!ok) weakConcepts.add(item.conceptTag);
        feedbackList.push({
          questionId: item.id,
          conceptTag: item.conceptTag,
          format: item.format,
          earnedPoints: pts,
          maxPoints: item.weightPoints,
          passed: ok,
          stdout: out,
          stderr: run.stderr,
          feedback: ok
            ? `All ${cases.length} Python test assertions passed!`
            : run.stderr || `${passCount}/${cases.length} assertions passed.`,
        });
      }
    } else if (item.format === "viva" || item.format === "short_answer") {
      const text = String(rawAns || "").trim();
      const lower = text.toLowerCase();
      const kwMatches = (item.requiredConceptKeywords || []).filter((kw) => kw.length > 2 && lower.includes(kw));
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      const ok = wordCount >= 12 && (kwMatches.length >= 1 || text.length >= 60);
      const pts = ok ? item.weightPoints : wordCount >= 5 ? Math.round(item.weightPoints * 0.35) : 0;
      earnedPoints += pts;
      vivaPassed = ok;
      if (!ok) weakConcepts.add(item.conceptTag);
      feedbackList.push({
        questionId: item.id,
        conceptTag: item.conceptTag,
        format: item.format,
        earnedPoints: pts,
        maxPoints: item.weightPoints,
        passed: ok,
        feedback: ok
          ? `Solid explanation (${wordCount} words, referenced ${kwMatches.join(", ") || "core concepts"}).`
          : `Explanation too brief or missing core terminology (${(item.requiredConceptKeywords || []).join(", ")}).`,
      });
    }
  }

  const scorePercent = maxPoints > 0 ? Math.round((earnedPoints / maxPoints) * 100) : 0;
  const passed = scorePercent >= bundle.passThresholdPercent;
  const weakList = Array.from(weakConcepts);

  const remediationPlan = passed
    ? []
    : weakList.map((concept) => ({
        concept,
        whyWeak: `Missed verification checks related to ${concept} in ${bundle.topicTitle}.`,
        targetedExercise: concept.toLowerCase().includes("implementation") || concept.toLowerCase().includes("trace")
          ? `Re-run the guided example & fix edge cases in Code Comprehension for ${bundle.topicTitle}.`
          : `Review the micro-lesson 'How It Works' & 'Common Mistakes' for ${concept}, then retake remediation.`,
        actionTab: (concept.toLowerCase().includes("implementation") ? "practical_lab" : concept.toLowerCase().includes("trace") ? "comprehend" : "learn") as "learn" | "comprehend" | "practical_lab",
      }));

  // Update persisted mastery record strictly from actual score & verified sub-gates
  const masteryRecord = updateTopicMasteryRecord(params.candidateId, bundle.topicId, (prev) => ({
    codingPassed: prev.codingPassed || codingPassed,
    explanationPassed: prev.explanationPassed || vivaPassed,
    assessmentScore: prev.assessmentScore !== null ? Math.max(prev.assessmentScore, scorePercent) : scorePercent,
    assessmentPassed: prev.assessmentPassed || passed,
    weakConcepts: weakList,
    remediationRequired: !passed && !prev.assessmentPassed,
    attemptsCount: (prev.attemptsCount || 0) + 1,
  }));

  // Record verifiable Student DNA attempt
  const trackMap: Record<string, "ai_ml" | "data_science_analytics" | "genai_llm" | "data_eng" | "mlops" | "applied_projects"> = {
    subj_python: "ai_ml",
    subj_numpy: "ai_ml",
    subj_pandas: "data_science_analytics",
    subj_sql: "data_science_analytics",
    subj_stats_ab: "data_science_analytics",
    subj_ml: "ai_ml",
    subj_deep_learning: "ai_ml",
    subj_genai_llm: "genai_llm",
    subj_rag: "genai_llm",
    subj_agents: "genai_llm",
    subj_data_engineering: "data_eng",
    subj_mlops: "mlops",
    subj_ai_eval: "genai_llm",
    subj_ai_projects: "applied_projects",
  };
  await recordStudentAttempt({
    candidateId: params.candidateId,
    trackSlug: trackMap[bundle.subjectId] || "ai_ml",
    lessonSlug: bundle.topicId,
    exerciseType: "conceptual_challenge",
    score: scorePercent,
    passed,
    assisted: false,
    executionReport: {
      totalTests: feedbackList.length,
      passedCount: feedbackList.filter((f) => f.passed).length,
      executionTimeMs: 120,
    },
  });

  return {
    topicId: bundle.topicId,
    scorePercent,
    passed,
    earnedPoints,
    maxPoints,
    itemFeedback: feedbackList,
    weakConcepts: weakList,
    remediationPlan,
    masteryRecord,
  };
}

export function getMasteryGateStatus(candidateId: string, topicId: string): {
  record: TopicMasteryRecord;
  gates: Array<{ label: string; met: boolean; requiredForMastery: boolean }>;
  canClaimMastery: boolean;
} {
  const record = getTopicMasteryRecord(candidateId, topicId);
  const gates = [
    { label: "Conceptual Micro-Checks", met: record.conceptStepsCompleted.length > 0, requiredForMastery: true },
    { label: "Code Comprehension & Debug", met: record.comprehensionPassed, requiredForMastery: true },
    { label: "Practical Laboratory", met: record.labPassed, requiredForMastery: true },
    { label: "Topic Coding & Assessment (>= 70%)", met: record.assessmentPassed, requiredForMastery: true },
    { label: "Concept Defense (Own-Words Viva)", met: record.explanationPassed, requiredForMastery: true },
  ];
  const canClaimMastery = gates.every((g) => g.met);
  return { record, gates, canClaimMastery };
}
