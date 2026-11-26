/**
 * lib/skills/ai-data/baseline-assessment-engine.ts
 * 
 * Genuine Diagnostic Baseline Assessment Engine for AI & Data Arena.
 * Evaluates candidate starting proficiency across 8 core disciplines:
 * 1. Python Programming Fundamentals
 * 2. Vectorized Numerical Computing (NumPy/Linear Algebra)
 * 3. Tabular Data Manipulation (Pandas)
 * 4. SQL & Relational Analytics
 * 5. Probability & Descriptive/Inferential Statistics
 * 6. Machine Learning Fundamentals & Validation
 * 7. LLM, Prompting & RAG Concepts
 * 8. Systems, Pipelines & Production Engineering
 * 
 * Classifies skills into:
 * - not_started
 * - learning
 * - practicing
 * - demonstrated
 * - independently_proficient
 */

import { TargetRoleSlug } from "./types";

export type ProficiencyClassification =
  | "not_started"
  | "learning"
  | "practicing"
  | "demonstrated"
  | "independently_proficient";

export interface BaselineDiagnosticQuestion {
  id: string;
  discipline: 
    | "programming_fundamentals"
    | "python"
    | "numpy_linear_algebra"
    | "pandas_data_wrangling"
    | "dsa"
    | "sql_analytics"
    | "statistics_probability"
    | "machine_learning"
    | "genai_llms"
    | "pipelines_systems";
  skillId: string;
  skillName: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  prompt: string;
  codeSnippet?: string;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
    diagnosticInsight: string;
  }>;
  explanation: string;
}

export interface StudentBaselineResponse {
  questionId: string;
  selectedOptionId: string;
  timeSpentSeconds: number;
}

export interface BaselineAssessmentResult {
  candidateId: string;
  assessedAt: string;
  targetRole: TargetRoleSlug;
  startingLevel: "beginner" | "intermediate" | "advanced";
  totalQuestions: number;
  correctCount: number;
  overallScorePercent: number;
  disciplineScores: Record<string, { scorePercent: number; demonstrated: boolean }>;
  skillClassifications: Record<string, {
    skillName: string;
    level: number;
    classification: ProficiencyClassification;
    exemptFromFoundations: boolean;
  }>;
  recommendedStartingStage: number;
  exemptionsGranted: string[];
  diagnosticSummary: string;
}

export const BASELINE_DIAGNOSTIC_BANK: BaselineDiagnosticQuestion[] = [
  {
    id: "diag-prog-1",
    discipline: "programming_fundamentals",
    skillId: "programming_fundamentals",
    skillName: "Programming Fundamentals & Control Flow",
    difficulty: "beginner",
    prompt: "What happens when a function uses `return` inside a loop on the very first iteration without accumulating results?",
    codeSnippet: "def collect_positives(nums):\n    for x in nums:\n        if x > 0:\n            return x\n    return None",
    options: [
      {
        id: "a",
        text: "It returns all positive numbers in a list after finishing the loop.",
        isCorrect: false,
        diagnosticInsight: "Confused `return` (exits function immediately) with `yield` or appending to a list."
      },
      {
        id: "b",
        text: "It exits the function immediately on the first positive number found, ignoring all remaining elements.",
        isCorrect: true,
        diagnosticInsight: "Accurately understands control flow and early function termination."
      },
      {
        id: "c",
        text: "It skips only the current iteration and continues the loop.",
        isCorrect: false,
        diagnosticInsight: "Confused `return` with `continue`."
      },
      {
        id: "d",
        text: "Python raises a SyntaxError when `return` appears inside a `for` loop.",
        isCorrect: false,
        diagnosticInsight: "Misunderstands valid control flow syntax."
      }
    ],
    explanation: "`return` immediately terminates execution of the current function and sends back the value. To collect all matches, initialize an accumulator list before the loop and return it after the loop finishes."
  },
  {
    id: "diag-dsa-1",
    discipline: "dsa",
    skillId: "dsa",
    skillName: "Data Structures & Algorithms",
    difficulty: "intermediate",
    prompt: "You need to check whether any two numbers in an unsorted array of 100,000 items sum to a target T. Which approach provides O(N) average time complexity?",
    options: [
      {
        id: "a",
        text: "Nested loops checking every pair (i, j).",
        isCorrect: false,
        diagnosticInsight: "Nested loops run in O(N^2) time — 10 billion ops for 100k items."
      },
      {
        id: "b",
        text: "Store seen elements in a hash set / dictionary and check if (T - x) exists during a single pass.",
        isCorrect: true,
        diagnosticInsight: "Understands O(1) average hash lookup trade-off reducing O(N^2) to O(N)."
      },
      {
        id: "c",
        text: "Check `if (T - x) in list_so_far` using a Python list during a single pass.",
        isCorrect: false,
        diagnosticInsight: "Unaware that `in` on a list is O(N), making the overall loop still O(N^2)."
      },
      {
        id: "d",
        text: "Bubble sort the array first, then iterate linearly.",
        isCorrect: false,
        diagnosticInsight: "Bubble sort is O(N^2)."
      }
    ],
    explanation: "Membership lookup (`in`) on a Python `set` or `dict` is O(1) average time via hash tables, whereas `in` on a `list` scans sequentially in O(N). Using a hash set gives O(N) total time."
  },
  {
    id: "diag-py-1",
    discipline: "python",
    skillId: "python",
    skillName: "Python Programming",
    difficulty: "beginner",
    prompt: "In Python, what is the key difference between a list and a tuple regarding mutation and memory overhead?",
    options: [
      {
        id: "a",
        text: "Lists are immutable and faster; tuples are mutable and support append().",
        isCorrect: false,
        diagnosticInsight: "Confused mutability between lists and tuples."
      },
      {
        id: "b",
        text: "Lists are mutable and incur dynamic resizing overhead; tuples are immutable, memory-compact, and hashable if their elements are hashable.",
        isCorrect: true,
        diagnosticInsight: "Accurately understands object mutability, hashability, and memory layout."
      },
      {
        id: "c",
        text: "Both lists and tuples are mutable, but tuples only store numeric primitives.",
        isCorrect: false,
        diagnosticInsight: "Incorrectly assumes tuples only hold numeric data."
      },
      {
        id: "d",
        text: "Tuples cannot be indexed or sliced, while lists support random access.",
        isCorrect: false,
        diagnosticInsight: "Unaware that tuples are indexed sequence types in Python."
      }
    ],
    explanation: "Lists are dynamically sized mutable sequence arrays with memory over-allocation for O(1) amortized appends. Tuples are fixed-size immutable sequences allocated in one contiguous memory block, making them lighter and hashable (usable as dictionary keys)."
  },
  {
    id: "diag-num-1",
    discipline: "numpy_linear_algebra",
    skillId: "python_data_stack",
    skillName: "NumPy & Linear Algebra",
    difficulty: "intermediate",
    prompt: "If array A has shape (4, 1, 8) and array B has shape (3, 8), what is the resulting shape of (A * B) under NumPy broadcasting rules?",
    options: [
      {
        id: "a",
        text: "(4, 3, 8)",
        isCorrect: true,
        diagnosticInsight: "Understands trailing dimension alignment and size-1 virtual stretching."
      },
      {
        id: "b",
        text: "Broadcasting error: incompatible dimensions because 1 != 3.",
        isCorrect: false,
        diagnosticInsight: "Misunderstands that dimension 1 stretches to match any dimension."
      },
      {
        id: "c",
        text: "(12, 8)",
        isCorrect: false,
        diagnosticInsight: "Confused broadcasting with tensor contraction or flattening."
      },
      {
        id: "d",
        text: "(4, 8)",
        isCorrect: false,
        diagnosticInsight: "Dropped a batch dimension without dimension alignment."
      }
    ],
    explanation: "NumPy aligns dimensions from right to left: trailing 8 == 8; middle 1 stretches to 3; leading dimension 4 is prepended. The final broadcasted shape is (4, 3, 8)."
  },
  {
    id: "diag-pan-1",
    discipline: "pandas_data_wrangling",
    skillId: "exploratory_data_analysis",
    skillName: "Pandas Tabular Analytics",
    difficulty: "intermediate",
    prompt: "In a customer transaction DataFrame `df`, what is the most memory-efficient and idiomatic way to compute average purchase amount per user without creating Cartesian product overhead?",
    options: [
      {
        id: "a",
        text: "df.groupby('user_id')['amount'].transform('mean')",
        isCorrect: false,
        diagnosticInsight: "transform retains original DataFrame length rather than producing an aggregated summary."
      },
      {
        id: "b",
        text: "df.groupby('user_id', as_index=False)['amount'].mean()",
        isCorrect: true,
        diagnosticInsight: "Understands idiomatic grouped aggregation with vectorization."
      },
      {
        id: "c",
        text: "Iterating through df.iterrows() and appending to a defaultdict(list).",
        isCorrect: false,
        diagnosticInsight: "Relies on anti-pattern Python iteration instead of vectorization."
      },
      {
        id: "d",
        text: "pd.pivot_table(df, values='amount', index='user_id', aggfunc=list).apply(np.mean)",
        isCorrect: false,
        diagnosticInsight: "Inefficient intermediate object collection."
      }
    ],
    explanation: "`df.groupby('user_id', as_index=False)['amount'].mean()` leverages Cython-optimized grouping hash tables and directly outputs an aggregated tabular DataFrame."
  },
  {
    id: "diag-sql-1",
    discipline: "sql_analytics",
    skillId: "advanced_sql_analytics",
    skillName: "SQL & Relational Analytics",
    difficulty: "intermediate",
    prompt: "In PostgreSQL or SQLite, which window function correctly identifies the previous order timestamp for each customer partitioned by `customer_id` and ordered by `order_time`?",
    options: [
      {
        id: "a",
        text: "LEAD(order_time, 1) OVER (PARTITION BY customer_id ORDER BY order_time)",
        isCorrect: false,
        diagnosticInsight: "Confused LAG (previous) with LEAD (subsequent)."
      },
      {
        id: "b",
        text: "LAG(order_time, 1) OVER (PARTITION BY customer_id ORDER BY order_time)",
        isCorrect: true,
        diagnosticInsight: "Correctly applies LAG window function with partitioning and ordering."
      },
      {
        id: "c",
        text: "FIRST_VALUE(order_time) OVER (PARTITION BY customer_id)",
        isCorrect: false,
        diagnosticInsight: "FIRST_VALUE retrieves the initial row of the entire partition, not the immediate previous."
      },
      {
        id: "d",
        text: "DENSE_RANK() OVER (ORDER BY customer_id, order_time)",
        isCorrect: false,
        diagnosticInsight: "Confused ranking functions with value retrieval functions."
      }
    ],
    explanation: "`LAG(order_time, 1) OVER (PARTITION BY customer_id ORDER BY order_time)` accesses data from the preceding row within the defined partition without requiring a self-join."
  },
  {
    id: "diag-stat-1",
    discipline: "statistics_probability",
    skillId: "ab_testing_statistics",
    skillName: "Statistics & A/B Experimentation",
    difficulty: "intermediate",
    prompt: "During an A/B test with an intended 50/50 traffic split, you observe 52,400 visitors in Control and 47,600 in Treatment (p < 0.0001 under Chi-Square). What is this condition called, and what action should you take?",
    options: [
      {
        id: "a",
        text: "High Statistical Significance; proceed to roll out Treatment because p < 0.05.",
        isCorrect: false,
        diagnosticInsight: "Disastrous misconception: mistook sample ratio failure for conversion victory."
      },
      {
        id: "b",
        text: "Sample Ratio Mismatch (SRM); halt the test immediately and investigate traffic assignment bugs or redirect filtering.",
        isCorrect: true,
        diagnosticInsight: "Understands experimental integrity, SRM diagnostics, and causal validity."
      },
      {
        id: "c",
        text: "Simpson's Paradox; re-weight conversion rates using Bayes' Rule.",
        isCorrect: false,
        diagnosticInsight: "Incorrectly misattributed the issue to Simpson's paradox."
      },
      {
        id: "d",
        text: "Type II Error; run the test for 4 more weeks to balance the samples.",
        isCorrect: false,
        diagnosticInsight: "Unaware that severe assignment bias invalidates future experiment time."
      }
    ],
    explanation: "A severe deviation from the planned traffic allocation with p < 0.001 is a Sample Ratio Mismatch (SRM). It indicates systemic instrumentation, caching, or bot-filtering bugs that invalidate the experiment. You must never make rollout decisions on an SRM-tainted test."
  },
  {
    id: "diag-ml-1",
    discipline: "machine_learning",
    skillId: "classical_ml_modeling",
    skillName: "Machine Learning & Evaluation",
    difficulty: "intermediate",
    prompt: "Why should feature scaling (e.g., StandardScaler) be computed strictly on the training set and merely applied to the test set, rather than fitting on the entire combined dataset?",
    options: [
      {
        id: "a",
        text: "Fitting on the entire dataset changes the algorithm's time complexity from O(N) to O(N^2).",
        isCorrect: false,
        diagnosticInsight: "Irrelevant complexity claim."
      },
      {
        id: "b",
        text: "Fitting on the whole dataset introduces Data Leakage, transferring global mean and variance information from the test set into the training phase and artificially inflating evaluation scores.",
        isCorrect: true,
        diagnosticInsight: "Deep understanding of data leakage, validation hygiene, and generalization."
      },
      {
        id: "c",
        text: "Scikit-learn raises a ValueError if test set features have the same mean as the training set.",
        isCorrect: false,
        diagnosticInsight: "Fabricated library constraint."
      },
      {
        id: "d",
        text: "It only matters for neural networks; decision trees and linear models are immune to scaling order.",
        isCorrect: false,
        diagnosticInsight: "Fails to recognize that data leakage is an evaluation problem across all models."
      }
    ],
    explanation: "Fitting transformers on data that includes the test set leaks future/out-of-sample statistical parameters into the model training pipeline, creating over-optimistic evaluation metrics that degrade in production."
  },
  {
    id: "diag-gen-1",
    discipline: "genai_llms",
    skillId: "rag_architecture_and_retrieval",
    skillName: "Generative AI, RAG & LLMs",
    difficulty: "intermediate",
    prompt: "In a production Retrieval-Augmented Generation (RAG) system, what does the 'Context Precision' metric evaluate in the RAG Triad?",
    options: [
      {
        id: "a",
        text: "Whether the generated answer contains grammatical errors.",
        isCorrect: false,
        diagnosticInsight: "Confused retrieval precision with linguistic fluency."
      },
      {
        id: "b",
        text: "Whether all the ground-truth relevant chunks are ranked higher in the retrieved context than irrelevant chunks.",
        isCorrect: true,
        diagnosticInsight: "Accurately understands RAG retrieval ranking, signal-to-noise ratio, and Ragas metrics."
      },
      {
        id: "c",
        text: "Whether the vector database search query latency is below 10 milliseconds.",
        isCorrect: false,
        diagnosticInsight: "Confused quality evaluation with infrastructure latency."
      },
      {
        id: "d",
        text: "Whether the LLM response strictly returns JSON schema.",
        isCorrect: false,
        diagnosticInsight: "Confused retrieval quality with structured output enforcement."
      }
    ],
    explanation: "Context Precision measures whether the retriever ranked ground-truth relevant context chunks at the top of the context window, minimizing distracting noise before passing to the LLM synthesizer."
  },
  {
    id: "diag-sys-1",
    discipline: "pipelines_systems",
    skillId: "data_engineering_pipelines",
    skillName: "Data Pipelines & Production Systems",
    difficulty: "advanced",
    prompt: "What does it mean for a data pipeline ingestion step to be 'idempotent', and why is it critical for production data warehouses?",
    options: [
      {
        id: "a",
        text: "The pipeline completes in constant O(1) execution time regardless of file size.",
        isCorrect: false,
        diagnosticInsight: "Confused idempotency with algorithmic time complexity."
      },
      {
        id: "b",
        text: "Executing the same pipeline multiple times with the exact same input produces the exact same state without creating duplicate records or corrupted aggregations.",
        isCorrect: true,
        diagnosticInsight: "Understands fault-tolerant distributed systems and safe retry semantics."
      },
      {
        id: "c",
        text: "The pipeline runs purely in memory without writing to permanent disk.",
        isCorrect: false,
        diagnosticInsight: "Confused idempotency with transient caching."
      },
      {
        id: "d",
        text: "The pipeline only consumes data from encrypted Kafka topics.",
        isCorrect: false,
        diagnosticInsight: "Unrelated security concept."
      }
    ],
    explanation: "Idempotency ensures that re-running a failed or retried batch (e.g. via Airflow backfill) cleans or overwrites the target partition idempotently, preventing duplicate counts, phantom revenue, or corrupt state."
  }
];

export function getBaselineDiagnosticQuestions(): BaselineDiagnosticQuestion[] {
  return BASELINE_DIAGNOSTIC_BANK;
}

export function evaluateBaselineAssessment(
  candidateId: string,
  targetRole: TargetRoleSlug,
  startingLevel: "beginner" | "intermediate" | "advanced",
  responses: StudentBaselineResponse[]
): BaselineAssessmentResult {
  const bank = BASELINE_DIAGNOSTIC_BANK;
  let correctCount = 0;
  const disciplineScores: Record<string, { total: number; correct: number }> = {};
  const skillClassifications: BaselineAssessmentResult["skillClassifications"] = {};
  const exemptionsGranted: string[] = [];

  for (const q of bank) {
    if (!disciplineScores[q.discipline]) {
      disciplineScores[q.discipline] = { total: 0, correct: 0 };
    }
    disciplineScores[q.discipline].total++;

    const studentResp = responses.find((r) => r.questionId === q.id);
    const chosenOpt = q.options.find((o) => o.id === studentResp?.selectedOptionId);
    const isCorrect = Boolean(chosenOpt?.isCorrect);

    if (isCorrect) {
      correctCount++;
      disciplineScores[q.discipline].correct++;
    }

    const level = isCorrect ? (startingLevel === "advanced" ? 4 : 3) : startingLevel === "beginner" ? 1 : 2;
    const classification: ProficiencyClassification = 
      isCorrect ? (level >= 4 ? "independently_proficient" : "demonstrated") : level === 1 ? "learning" : "practicing";

    const exempt = isCorrect && (q.difficulty === "intermediate" || q.difficulty === "advanced");
    if (exempt) {
      exemptionsGranted.push(q.skillId);
    }

    skillClassifications[q.skillId] = {
      skillName: q.skillName,
      level,
      classification,
      exemptFromFoundations: exempt
    };
  }

  const overallScorePercent = Math.round((correctCount / bank.length) * 100);

  const formattedDisciplineScores: BaselineAssessmentResult["disciplineScores"] = {};
  for (const [disc, data] of Object.entries(disciplineScores)) {
    const pct = Math.round((data.correct / data.total) * 100);
    formattedDisciplineScores[disc] = {
      scorePercent: pct,
      demonstrated: pct >= 70
    };
  }

  let recommendedStartingStage = 1;
  if (overallScorePercent >= 85) {
    recommendedStartingStage = 3; // Jump directly to Advanced / Specialized Topics
  } else if (overallScorePercent >= 60) {
    recommendedStartingStage = 2; // Jump past elementary syntax to Applied Data Stack
  }

  const diagnosticSummary = overallScorePercent >= 80
    ? `Strong technical baseline verified (${overallScorePercent}%). You have demonstrated solid command of computational data stacks and reasoning. You have received prerequisite exemptions for foundational modules.`
    : overallScorePercent >= 50
    ? `Intermediate foundation established (${overallScorePercent}%). You understand fundamental syntax and relational logic, but need guided co-construction in experimentation, leakage prevention, and systems architecture.`
    : `Foundational learning recommended (${overallScorePercent}%). Starting from Stage 1 will build rock-solid intuitions in vectorized arithmetic, data transformation, and reliable query composition.`;

  return {
    candidateId,
    assessedAt: new Date().toISOString(),
    targetRole,
    startingLevel,
    totalQuestions: bank.length,
    correctCount,
    overallScorePercent,
    disciplineScores: formattedDisciplineScores,
    skillClassifications,
    recommendedStartingStage,
    exemptionsGranted: Array.from(new Set(exemptionsGranted)),
    diagnosticSummary
  };
}

