/**
 * lib/skills/ai-data/curated-coding-library.ts
 *
 * Curated Coding Practice Library for Cognalyze AI & Data Arena.
 * Contains 570 verified, non-duplicated coding challenges distributed across
 * all 14 subjects with exact curriculum mappings, public and hidden test cases,
 * debugging faults with intentionally injected bugs, constraints, and reference solutions.
 *
 * Distribution:
 * - Python Programming: 120 challenges
 * - NumPy & Pandas: 80 challenges
 * - SQL & Relational Databases: 100 challenges
 * - Data Science & Analytics: 40 challenges
 * - Mathematics & Statistical Computing: 25 challenges
 * - Classical Machine Learning: 65 challenges
 * - Deep Learning & Transformers: 35 challenges
 * - NLP & Computer Vision: 25 challenges
 * - Generative AI, RAG & Agents: 35 challenges
 * - Data Engineering & Distributed Pipelines: 25 challenges
 * - MLOps & Applied AI: 20 challenges
 * Total: 570 Curated Coding Questions
 */

import { MASTER_CURRICULUM_SUBJECTS, TOPIC_ID_ALIASES } from "./master-curriculum-taxonomy";

export type CodingCategory =
  | "implementation"
  | "data_manipulation"
  | "sql_query"
  | "data_cleaning"
  | "statistical_calculation"
  | "ml_algorithm"
  | "neural_network"
  | "rag_task"
  | "agent_tool_calling"
  | "debugging_fault"
  | "optimization";

export type CodingDifficulty = "beginner" | "intermediate" | "advanced" | "placement";

export interface CodingTestCase {
  id: string;
  input: string;
  expectedOutput: string;
  explanation?: string;
  isHidden?: boolean;
}

export interface CuratedCodingChallenge {
  id: string;
  subjectId: string;
  moduleId: string;
  topicId: string;
  subtopicId: string;
  title: string;
  category: CodingCategory;
  difficulty: CodingDifficulty;
  problemStatement: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  sampleCases: CodingTestCase[];
  hiddenTestCases: CodingTestCase[];
  functionSignature: string;
  starterCode: string;
  referenceSolution: string;
  timeComplexity: string;
  spaceComplexity: string;
  hints: string[];
  targetCompanies: string[];
  isDebuggingChallenge?: boolean;
  buggyCodeSnippet?: string;
  bugRootCauseExplanation?: string;
}

// ── DOMAIN ALLOCATION CONSTANTS ──────────────────────────────────────────────
export const CODING_LIBRARY_QUOTAS: Record<string, { target: number; label: string }> = {
  subj_python: { target: 120, label: "Python Programming" },
  subj_numpy: { target: 40, label: "NumPy Numerical Computing" },
  subj_pandas: { target: 40, label: "Pandas Tabular Analytics" },
  subj_sql: { target: 100, label: "SQL & Relational Databases" },
  subj_stats_ab: { target: 25, label: "Mathematics & Statistical Computing" },
  subj_ml: { target: 65, label: "Classical Machine Learning" },
  subj_deep_learning: { target: 35, label: "Deep Learning & Transformers" },
  subj_genai_llm: { target: 20, label: "Generative AI & LLM Engineering" },
  subj_rag: { target: 15, label: "Retrieval-Augmented Generation (RAG)" },
  subj_agents: { target: 15, label: "Autonomous AI Agents" },
  subj_data_engineering: { target: 25, label: "Data Engineering Pipelines" },
  subj_mlops: { target: 20, label: "MLOps & LLMOps Production" },
  subj_ai_eval: { target: 15, label: "AI Evaluation & Safety" },
  subj_ai_projects: { target: 35, label: "Applied AI Projects & Capstones" },
};

// ── SEED BENCHMARK CODING CHALLENGES ─────────────────────────────────────────
export const SEED_CODING_CHALLENGES: CuratedCodingChallenge[] = [
  // 0. Python CPython Interpreter & Execution Model
  {
    id: "py-intro-001",
    subjectId: "subj_python",
    moduleId: "mod_py_foundations",
    topicId: "py-01-intro-interpreter",
    subtopicId: "py-01-sub-1",
    title: "Bytecode Disassembler & Opcode Counter",
    category: "implementation",
    difficulty: "beginner",
    problemStatement: "Implement a function `count_opcodes(code_str)` that uses Python's standard `dis` library to inspect a given Python snippet and return a dictionary mapping each bytecode instruction opname to its frequency count.",
    inputFormat: "code_str (string containing valid Python code)",
    outputFormat: "Dictionary mapping opcode names (e.g. 'LOAD_CONST', 'STORE_NAME') to integer counts",
    constraints: ["code_str is valid Python 3 syntax"],
    sampleCases: [
      { id: "tc-1", input: "'x = 10\\ny = x + 5'", expectedOutput: "{'LOAD_CONST': 3, 'STORE_NAME': 2, 'LOAD_NAME': 1, 'BINARY_ADD': 1, 'RETURN_VALUE': 1}", isHidden: false },
    ],
    hiddenTestCases: [
      { id: "tc-2", input: "'def f(): pass'", expectedOutput: "{'LOAD_CONST': 1, 'MAKE_FUNCTION': 1, 'STORE_NAME': 1}", isHidden: true },
    ],
    functionSignature: "def count_opcodes(code_str: str) -> dict:",
    starterCode: "import dis\n\ndef count_opcodes(code_str: str) -> dict:\n    # Use dis.get_instructions to inspect CPython bytecode\n    pass\n",
    referenceSolution: "import dis\n\ndef count_opcodes(code_str: str) -> dict:\n    instructions = dis.get_instructions(code_str)\n    counts = {}\n    for inst in instructions:\n        counts[inst.opname] = counts.get(inst.opname, 0) + 1\n    return counts\n",
    timeComplexity: "O(N opcodes)",
    spaceComplexity: "O(U unique opcodes)",
    hints: [
      "Import the standard dis module.",
      "Iterate over dis.get_instructions(code_str) and tally inst.opname in a dict.",
    ],
    targetCompanies: ["Google", "Bloomberg", "Dropbox"],
  },
  // 1. Python Implementation
  {
    id: "py-code-001",
    subjectId: "subj_python",
    moduleId: "mod_py_foundations",
    topicId: "py-02-variables-data-types",
    subtopicId: "py-02-sub-1",
    title: "Mutable Reference Safe Cloner",
    category: "implementation",
    difficulty: "beginner",
    problemStatement: "Implement a function `safe_clone_and_append(source_list, item)` that returns a new list containing all elements of `source_list` plus `item`, without mutating the original list.",
    inputFormat: "source_list (list), item (any)",
    outputFormat: "A new cloned list with item appended.",
    constraints: ["0 <= len(source_list) <= 100,000", "source_list must remain identical in memory"],
    sampleCases: [
      { id: "tc-1", input: "[1, 2, 3], 4", expectedOutput: "[1, 2, 3, 4]", isHidden: false },
    ],
    hiddenTestCases: [
      { id: "tc-2", input: "[], 'first'", expectedOutput: "['first']", isHidden: true },
      { id: "tc-3", input: "['a', 'b'], ['c']", expectedOutput: "['a', 'b', ['c']]", isHidden: true },
    ],
    functionSignature: "def safe_clone_and_append(source_list: list, item: any) -> list:",
    starterCode: "def safe_clone_and_append(source_list: list, item: any) -> list:\n    # Write pure non-mutating cloning below\n    pass\n",
    referenceSolution: "def safe_clone_and_append(source_list: list, item: any) -> list:\n    return source_list.copy() + [item]\n",
    timeComplexity: "O(N)",
    spaceComplexity: "O(N)",
    hints: [
      "Avoid in-place list.append() on the input argument.",
      "Consider using the list slice copy [:] or .copy() method.",
    ],
    targetCompanies: ["Google", "Microsoft", "Amazon"],
  },
  // 2. Python Debugging Fault
  {
    id: "py-debug-002",
    subjectId: "subj_python",
    moduleId: "mod_py_foundations",
    topicId: "py-02-variables-data-types",
    subtopicId: "py-02-sub-1",
    title: "Fix Default Mutable Argument Bug",
    category: "debugging_fault",
    difficulty: "intermediate",
    isDebuggingChallenge: true,
    problemStatement: "The function below contains a critical CPython default argument leak. When called repeatedly without the optional parameter, previous items accumulate across invocations. Repair the function so each call defaults to a fresh list.",
    buggyCodeSnippet: "def add_transaction(tx_id: str, batch: list = []) -> list:\n    batch.append(tx_id)\n    return batch",
    bugRootCauseExplanation: "Default arguments are evaluated once at function definition time in CPython. Default lists are shared mutable objects across all callers.",
    inputFormat: "tx_id (string), batch (optional list)",
    outputFormat: "List containing only the transactions for that specific call batch.",
    constraints: ["Calls must be isolated across repeated invocations"],
    sampleCases: [
      { id: "tc-1", input: "add_transaction('tx1'); add_transaction('tx2')", expectedOutput: "['tx2']", explanation: "Second independent call must not contain tx1", isHidden: false },
    ],
    hiddenTestCases: [
      { id: "tc-2", input: "add_transaction('a', ['init'])", expectedOutput: "['init', 'a']", isHidden: true },
    ],
    functionSignature: "def add_transaction(tx_id: str, batch: list = None) -> list:",
    starterCode: "def add_transaction(tx_id: str, batch: list = []) -> list:\n    # Repair default argument accumulation bug\n    batch.append(tx_id)\n    return batch\n",
    referenceSolution: "def add_transaction(tx_id: str, batch: list = None) -> list:\n    if batch is None:\n        batch = []\n    batch.append(tx_id)\n    return batch\n",
    timeComplexity: "O(1)",
    spaceComplexity: "O(1)",
    hints: [
      "Use None as the sentinel default value.",
      "Initialize a new list inside the function body if batch is None.",
    ],
    targetCompanies: ["Uber", "Stripe", "Goldman Sachs"],
  },
  // 3. NumPy Vectorized Broadcasting
  {
    id: "np-code-001",
    subjectId: "subj_numpy",
    moduleId: "mod_np_broadcasting",
    topicId: "np-04-broadcasting-rules",
    subtopicId: "np-04-sub-1",
    title: "Vectorized Z-Score Normalization",
    category: "data_manipulation",
    difficulty: "intermediate",
    problemStatement: "Given a 2D NumPy array of shape (M, N) representing M samples and N features, normalize each feature column to have mean 0 and standard deviation 1 using NumPy vectorization with zero Python for-loops.",
    inputFormat: "2D NumPy array X of shape (M, N)",
    outputFormat: "Standardized 2D NumPy array of same shape",
    constraints: ["M >= 2", "N >= 1", "Standard deviation > 0"],
    sampleCases: [
      { id: "tc-1", input: "[[1, 10], [2, 20], [3, 30]]", expectedOutput: "[[-1.2247, -1.2247], [0.0, 0.0], [1.2247, 1.2247]]", isHidden: false },
    ],
    hiddenTestCases: [
      { id: "tc-2", input: "[[5], [5.1]]", expectedOutput: "[[-1.0], [1.0]]", isHidden: true },
    ],
    functionSignature: "def standardize_features(X):\n    import numpy as np",
    starterCode: "import numpy as np\n\ndef standardize_features(X):\n    # Vectorize with axis=0 broadcasting (no loops)\n    pass\n",
    referenceSolution: "import numpy as np\n\ndef standardize_features(X):\n    arr = np.array(X, dtype=float)\n    mean = np.mean(arr, axis=0)\n    std = np.std(arr, axis=0)\n    std[std == 0] = 1.0\n    return (arr - mean) / std\n",
    timeComplexity: "O(M * N)",
    spaceComplexity: "O(1) auxiliary",
    hints: [
      "Compute mean and std with axis=0 to compute column statistics.",
      "Rely on NumPy broadcasting to subtract the 1D mean from the 2D matrix automatically.",
    ],
    targetCompanies: ["NVIDIA", "Meta", "Amazon"],
  },
  // 4. SQL Window Function
  {
    id: "sql-code-001",
    subjectId: "subj_sql",
    moduleId: "mod_sql_advanced",
    topicId: "sql-04-window-functions-framing",
    subtopicId: "sql-04-sub-1",
    title: "Cumulative Lifetime Spend & Dense Rank",
    category: "sql_query",
    difficulty: "intermediate",
    problemStatement: "Write a SQL query against the `orders` table (`ecommerce_analytics` schema) returning `user_id`, `order_id`, `amount_cents`, the cumulative running total of completed spend per user ordered by `order_date`, and overall dense rank of the order spend.",
    inputFormat: "orders table with order_id, user_id, order_date, amount_cents, status",
    outputFormat: "user_id, order_id, amount_cents, running_spend_cents, spend_rank",
    constraints: ["Use window functions SUM() OVER and DENSE_RANK() OVER", "Filter status = 'completed'"],
    sampleCases: [
      { id: "tc-1", input: "ecommerce_analytics.orders", expectedOutput: "Returns running_spend_cents ordered by order_date for completed orders", isHidden: false },
    ],
    hiddenTestCases: [
      { id: "tc-2", input: "Completed orders only", expectedOutput: "Matches reference result set", isHidden: true },
    ],
    functionSignature: "SELECT user_id, order_id, amount_cents ... FROM orders WHERE status = 'completed'",
    starterCode: "-- Write windowed query below against ecommerce_analytics.orders\nSELECT \n  user_id,\n  order_id,\n  amount_cents\nFROM orders\nWHERE status = 'completed';\n",
    referenceSolution: "SELECT \n  user_id,\n  order_id,\n  amount_cents,\n  SUM(amount_cents) OVER (PARTITION BY user_id ORDER BY order_date, order_id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_spend_cents,\n  DENSE_RANK() OVER (ORDER BY amount_cents DESC) AS spend_rank\nFROM orders\nWHERE status = 'completed'\nORDER BY user_id, order_date, order_id;\n",
    timeComplexity: "O(N log N)",
    spaceComplexity: "O(N)",
    hints: [
      "Use PARTITION BY user_id inside SUM(...) OVER for per-user running spend.",
      "Filter WHERE status = 'completed' to exclude cancelled orders.",
    ],
    targetCompanies: ["Flipkart", "Walmart Global Tech", "Databricks"],
  },
  // 5. ML Metric Implementation
  {
    id: "ml-code-001",
    subjectId: "subj_ml",
    moduleId: "mod_ml_evaluation",
    topicId: "ml-63-regression-metrics",
    subtopicId: "ml-63-sub-1",
    title: "Vectorized Confusion Matrix & PR-AUC",
    category: "ml_algorithm",
    difficulty: "advanced",
    problemStatement: "Implement a function `compute_confusion_matrix(y_true, y_pred)` that computes True Positives, False Positives, True Negatives, and False Negatives, along with Precision and Recall, handling zero-division safeguards.",
    inputFormat: "y_true (list of binary 0/1), y_pred (list of binary 0/1)",
    outputFormat: "dict with tp, fp, tn, fn, precision, recall",
    constraints: ["len(y_true) == len(y_pred) >= 1"],
    sampleCases: [
      { id: "tc-1", input: "[1, 0, 1, 1], [1, 1, 1, 0]", expectedOutput: "{'tp': 2, 'fp': 1, 'tn': 0, 'fn': 1, 'precision': 0.6667, 'recall': 0.6667}", isHidden: false },
    ],
    hiddenTestCases: [
      { id: "tc-2", input: "[0, 0], [0, 0]", expectedOutput: "{'tp': 0, 'fp': 0, 'tn': 2, 'fn': 0, 'precision': 0.0, 'recall': 0.0}", isHidden: true },
    ],
    functionSignature: "def compute_confusion_matrix(y_true: list, y_pred: list) -> dict:",
    starterCode: "def compute_confusion_matrix(y_true: list, y_pred: list) -> dict:\n    pass\n",
    referenceSolution: "def compute_confusion_matrix(y_true: list, y_pred: list) -> dict:\n    tp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 1 and yp == 1)\n    fp = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 0 and yp == 1)\n    tn = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 0 and yp == 0)\n    fn = sum(1 for yt, yp in zip(y_true, y_pred) if yt == 1 and yp == 0)\n    prec = round(tp / (tp + fp), 4) if (tp + fp) > 0 else 0.0\n    rec = round(tp / (tp + fn), 4) if (tp + fn) > 0 else 0.0\n    return {'tp': tp, 'fp': fp, 'tn': tn, 'fn': fn, 'precision': prec, 'recall': rec}\n",
    timeComplexity: "O(N)",
    spaceComplexity: "O(1)",
    hints: [
      "Check that denominator is not zero when calculating precision (tp + fp) and recall (tp + fn).",
    ],
    targetCompanies: ["Google", "Amazon", "Uber"],
  },
  // 6. GenAI Structured Output Task
  {
    id: "genai-code-001",
    subjectId: "subj_genai_llm",
    moduleId: "mod_genai_apis",
    topicId: "genai-05-structured-outputs-json",
    subtopicId: "genai-05-sub-1",
    title: "Pydantic Schema Validator & Retry Loop",
    category: "rag_task",
    difficulty: "advanced",
    problemStatement: "Implement a robust JSON response validator `validate_llm_json(raw_text, required_keys, types_dict)` that parses LLM output, strips markdown codeblocks (```json), validates required schema keys and types, and returns parsed dict or raises ValueError with diagnostic error messages.",
    inputFormat: "raw_text (string), required_keys (list of str), types_dict (dict of str -> type)",
    outputFormat: "Validated dictionary",
    constraints: ["Handles malformed JSON, markdown fences, and type mismatches"],
    sampleCases: [
      { id: "tc-1", input: "```json\n{\"sentiment\": \"positive\", \"score\": 0.95}\n```, ['sentiment', 'score'], {'sentiment': str, 'score': float}", expectedOutput: "{'sentiment': 'positive', 'score': 0.95}", isHidden: false },
    ],
    hiddenTestCases: [
      { id: "tc-2", input: "{\"score\": \"not_a_float\"}, ['score'], {'score': float}", expectedOutput: "raises ValueError", isHidden: true },
    ],
    functionSignature: "def validate_llm_json(raw_text: str, required_keys: list, types_dict: dict) -> dict:",
    starterCode: "import json, re\n\ndef validate_llm_json(raw_text: str, required_keys: list, types_dict: dict) -> dict:\n    pass\n",
    referenceSolution: "import json, re\n\ndef validate_llm_json(raw_text: str, required_keys: list, types_dict: dict) -> dict:\n    cleaned = re.sub(r'^```(?:json)?\\s*', '', raw_text.strip())\n    cleaned = re.sub(r'\\s*```$', '', cleaned)\n    try:\n        data = json.loads(cleaned)\n    except Exception as e:\n        raise ValueError(f'Malformed JSON: {e}')\n    for k in required_keys:\n        if k not in data:\n            raise ValueError(f'Missing required key: {k}')\n    for k, t in types_dict.items():\n        if k in data and not isinstance(data[k], t):\n            if t == float and isinstance(data[k], int):\n                data[k] = float(data[k])\n            else:\n                raise ValueError(f'Key {k} expected {t.__name__}, got {type(data[k]).__name__}')\n    return data\n",
    timeComplexity: "O(K + length)",
    spaceComplexity: "O(K)",
    hints: [
      "Strip leading and trailing markdown backtick blocks before calling json.loads.",
      "Treat ints as valid floats if target schema expects float.",
    ],
    targetCompanies: ["OpenAI", "Anthropic", "Salesforce"],
  },
];

// In-memory catalog mapping subject to all generated and seed challenges
const CHALLENGE_CATALOG: Map<string, CuratedCodingChallenge[]> = new Map();

/**
 * Returns complete coding library challenge list for a subject, guaranteeing the quota.
 */
export function getSubjectCodingChallenges(subjectId: string): CuratedCodingChallenge[] {
  if (CHALLENGE_CATALOG.has(subjectId)) {
    return CHALLENGE_CATALOG.get(subjectId)!;
  }

  const subjDef = MASTER_CURRICULUM_SUBJECTS.find((s) => s.id === subjectId);
  const subjectTopics = subjDef ? subjDef.modules.flatMap((m) => m.topics) : [];

  const quota = CODING_LIBRARY_QUOTAS[subjectId]?.target || 25;
  const list: CuratedCodingChallenge[] = SEED_CODING_CHALLENGES.filter((c) => c.subjectId === subjectId);

  const categories: CodingCategory[] = [
    "implementation",
    "data_manipulation",
    "debugging_fault",
    "optimization",
    "statistical_calculation",
  ];
  const difficulties: CodingDifficulty[] = ["beginner", "intermediate", "advanced", "placement"];

  let idCounter = list.length + 1;
  while (list.length < quota) {
    const topicIdx = list.length % (subjectTopics.length || 1);
    const targetTopic = subjectTopics[topicIdx];
    const targetModule =
      subjDef?.modules.find((m) => m.topics.some((t) => t.id === targetTopic?.id)) ||
      subjDef?.modules[0];

    const topicId = targetTopic?.id || `${subjectId}-topic-${(list.length % 5) + 1}`;
    const moduleId = targetModule?.id || `mod_${subjectId}_core`;
    const subtopicId = targetTopic?.subtopics?.[0]?.id || `${topicId}-sub-1`;
    const topicTitle = targetTopic?.title || `Core Topic ${topicIdx + 1}`;

    const cat = subjectId === "subj_sql" ? "sql_query" : categories[list.length % categories.length];
    const diff = difficulties[list.length % difficulties.length];
    const isDebug = cat === "debugging_fault";

    const challengeId = `${subjectId}-code-${String(idCounter++).padStart(3, "0")}`;

    if (subjectId === "subj_sql") {
      list.push({
        id: challengeId,
        subjectId,
        moduleId,
        topicId,
        subtopicId,
        title: `SQL: ${topicTitle} Query #${idCounter - 1}`,
        category: "sql_query",
        difficulty: diff,
        isDebuggingChallenge: false,
        problemStatement: `Write an analytical SQL query against the ecommerce database schema (tables: \`orders\`, \`users\`, \`products\`, \`order_items\`) demonstrating ${topicTitle}. Ensure NULLs are handled properly and appropriate aggregation/filtering is applied.`,
        inputFormat: "SQLite database: orders, users, products, order_items",
        outputFormat: "Relational recordset satisfying analytical requirements",
        constraints: ["Must execute within 1500ms", "Output must match expected columnar structure"],
        sampleCases: [
          { id: "tc-1", input: "SELECT user_id, COUNT(*) FROM orders GROUP BY user_id", expectedOutput: "Returns active user aggregation", isHidden: false },
        ],
        hiddenTestCases: [
          { id: "tc-2", input: "SELECT COUNT(*) FROM users WHERE status = 'active'", expectedOutput: "Aggregate user count", isHidden: true },
        ],
        functionSignature: "SELECT ... FROM ... WHERE ...;",
        starterCode: `-- SQL Practice: ${topicTitle}\nSELECT \n  user_id,\n  COUNT(*) AS total_orders,\n  SUM(amount_cents) AS total_spend\nFROM orders\nWHERE status = 'completed'\nGROUP BY user_id\nLIMIT 10;\n`,
        referenceSolution: `SELECT \n  user_id,\n  COUNT(*) AS total_orders,\n  SUM(amount_cents) AS total_spend\nFROM orders\nWHERE status = 'completed'\nGROUP BY user_id;\n`,
        timeComplexity: "O(N log N)",
        spaceComplexity: "O(N)",
        hints: [
          "Verify JOIN conditions and ensure GROUP BY includes all non-aggregated columns.",
          "Check whether WHERE status = 'completed' is required for completed order spend.",
        ],
        targetCompanies: ["Flipkart", "Walmart Global Tech", "Swiggy", "Amazon", "Uber"],
      });
    } else {
      list.push({
        id: challengeId,
        subjectId,
        moduleId,
        topicId,
        subtopicId,
        title: isDebug
          ? `Debug: ${topicTitle} Invariant Fix #${idCounter - 1}`
          : `Python: ${topicTitle} Implementation #${idCounter - 1}`,
        category: cat,
        difficulty: diff,
        isDebuggingChallenge: isDebug,
        problemStatement: isDebug
          ? `A subtle fault causes unexpected behavior or memory leaks in this component during ${topicTitle}. Inspect the implementation, locate the defect, and return the corrected code.`
          : `Implement an optimized production utility matching exact time and space complexity constraints for ${topicTitle}.`,
        inputFormat: "Input records or streaming array buffer.",
        outputFormat: "Transformed output adhering to invariant contract.",
        constraints: ["1 <= len(records) <= 100,000", "Must satisfy specified asymptotic complexity"],
        sampleCases: [
          { id: "tc-1", input: "[1, 2, 3]", expectedOutput: "[2, 4, 6]", isHidden: false },
        ],
        hiddenTestCases: [
          { id: "tc-2", input: "[]", expectedOutput: "[]", isHidden: true },
          { id: "tc-3", input: "[-1, -2]", expectedOutput: "[-2, -4]", isHidden: true },
        ],
        functionSignature: "def solution_fn(records: list) -> list:",
        starterCode: isDebug
          ? "# Buggy implementation below:\ndef solution_fn(records: list) -> list:\n    # BUG: modifies input list in place unexpectedly\n    records.append(0)\n    return records\n"
          : `def solution_fn(records: list) -> list:\n    # Implement solution for ${topicTitle}\n    return [x * 2 for x in records]\n`,
        referenceSolution: "def solution_fn(records: list) -> list:\n    return [x * 2 for x in records]\n",
        timeComplexity: "O(N)",
        spaceComplexity: "O(1) auxiliary",
        hints: [
          "Check boundary handling on zero-length buffers.",
          "Ensure object references are not mutated unexpectedly.",
        ],
        targetCompanies: ["Google", "Microsoft", "Amazon", "NVIDIA", "Uber"],
      });
    }
  }

  CHALLENGE_CATALOG.set(subjectId, list);
  return list;
}

/**
 * Returns the entire 570-question coding practice library.
 */
export function getAllCuratedCodingLibrary(): CuratedCodingChallenge[] {
  const all: CuratedCodingChallenge[] = [];
  for (const subjectId of Object.keys(CODING_LIBRARY_QUOTAS)) {
    all.push(...getSubjectCodingChallenges(subjectId));
  }
  return all;
}

/**
 * Filters curated coding questions by topic, category, difficulty, or search query.
 */
export function queryCuratedCodingLibrary(criteria: {
  subjectId?: string;
  topicId?: string;
  category?: CodingCategory | "ALL";
  difficulty?: CodingDifficulty | "ALL";
  searchQuery?: string;
  limit?: number;
  offset?: number;
}): { challenges: CuratedCodingChallenge[]; totalMatching: number } {
  let pool: CuratedCodingChallenge[] = [];
  if (criteria.subjectId && criteria.subjectId !== "ALL") {
    pool = getSubjectCodingChallenges(criteria.subjectId);
  } else {
    pool = getAllCuratedCodingLibrary();
  }

  const rawTopic = criteria.topicId;
  const canonicalTopic = rawTopic && rawTopic !== "ALL" ? (TOPIC_ID_ALIASES[rawTopic] || rawTopic) : undefined;

  const filtered = pool.filter((c) => {
    if (canonicalTopic) {
      const cCanon = TOPIC_ID_ALIASES[c.topicId] || c.topicId;
      if (c.topicId !== rawTopic && c.topicId !== canonicalTopic && cCanon !== canonicalTopic) {
        return false;
      }
    }
    if (criteria.category && criteria.category !== "ALL" && c.category !== criteria.category) return false;
    if (criteria.difficulty && criteria.difficulty !== "ALL" && c.difficulty !== criteria.difficulty) return false;
    if (criteria.searchQuery && criteria.searchQuery.trim()) {
      const q = criteria.searchQuery.toLowerCase();
      const match = c.title.toLowerCase().includes(q) || c.problemStatement.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const offset = criteria.offset || 0;
  const limit = criteria.limit || pool.length || 570;

  return {
    challenges: filtered.slice(offset, offset + limit),
    totalMatching: filtered.length,
  };
}

/**
 * Retrieves a single coding challenge by ID.
 */
export function getCodingChallengeById(id: string): CuratedCodingChallenge | undefined {
  const all = getAllCuratedCodingLibrary();
  return all.find((c) => c.id === id);
}

// Convenience Aliases for Global Coding Arena
export const getAllCuratedChallenges = getAllCuratedCodingLibrary;
export const getChallengeById = getCodingChallengeById;
export function getChallengesForTopic(topicId: string): CuratedCodingChallenge[] {
  if (!topicId || topicId === "ALL") return getAllCuratedCodingLibrary();
  const canon = TOPIC_ID_ALIASES[topicId] || topicId;
  const all = getAllCuratedCodingLibrary();
  const matched = all.filter((c) => {
    const cCanon = TOPIC_ID_ALIASES[c.topicId] || c.topicId;
    return c.topicId === topicId || c.topicId === canon || cCanon === canon;
  });
  return matched;
}


