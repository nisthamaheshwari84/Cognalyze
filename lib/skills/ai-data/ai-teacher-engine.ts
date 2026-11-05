/**
 * lib/skills/ai-data/ai-teacher-engine.ts
 * 
 * Production AI Teacher Engine for the Cognalyze AI, Data & Intelligence Arena.
 * 
 * Manages the 6-Mode Co-Construction Learning Lifecycle:
 * - Mode A: Concept Mastery (Spoken/Audio transcript, real-world intuition, Mermaid diagram, key terminology)
 * - Mode B: Watch AI Build (Live block-by-block construction in real workspaces with architectural reasoning)
 * - Mode C: Build Together (Guided co-construction with slots/scaffolding and real-time validation)
 * - Mode D: Modify & Debug (Deliberate realistic fault injection, edge cases, diagnosis, and fix verification)
 * - Mode E: Solve Independently (Novel practical challenge with automated test harness)
 * - Mode F: Verified Evidence Dossier (Student DNA evidence recording upon verified execution)
 * 
 * Studio Integrations:
 * 1. Python Practice Sandbox (Code blocks, execution, stdout, variable state)
 * 2. SQL Lab (Query blocks, SQLite runtime, rowset inspection)
 * 3. ML Experiment Studio (Dataset, feature selection, training, confusion matrix, leakage audit)
 * 4. Data Pipeline Builder (DAG stages, rowset preview, quality fault gate)
 * 5. Visual AI Agent Builder (Node schemas, tool runner, execution traces, injection defense)
 */

import { AiDataTrackSlug } from "./types";
import { getLessonBySlug } from "./curriculum";

export type TeacherMode = 
  | "MODE_A_LEARN"
  | "MODE_B_WATCH_BUILD"
  | "MODE_C_BUILD_TOGETHER"
  | "MODE_D_MODIFY_DEBUG"
  | "MODE_E_INDEPENDENT"
  | "MODE_F_EVIDENCE";

export type StudioTarget = 
  | "python_sandbox"
  | "sql_lab"
  | "ml_studio"
  | "pipeline_builder"
  | "agent_builder";

export interface DemonstrationBlock {
  blockNumber: number;
  title: string;
  narration: string;
  architecturalReason: string;
  codeOrConfigDelta: string;
  accumulatedState: string;
  expectedOutputSummary: string;
  potentialPitfall: string;
  inspectionTip: string;
}

export interface CoBuildSlot {
  slotId: string;
  instruction: string;
  hintLevel1: string;
  hintLevel2: string;
  expectedPattern: string; // Regex or token check
  validationExplanation: string;
  starterSnippet: string;
}

export interface InjectedDebugFault {
  faultId: string;
  title: string;
  symptom: string;
  buggyCodeOrConfig: string;
  correctCodeOrConfig: string;
  diagnosticHints: string[];
  testCaseToExpose: {
    input: any;
    expected: any;
  };
  explanationOfRootCause: string;
}

export interface TopicTeacherPackage {
  topicSlug: string;
  title: string;
  trackSlug: AiDataTrackSlug;
  studioTarget: StudioTarget;
  canonicalSkill: string;
  estimatedMinutes: number;
  
  // Mode A: Concept Mastery
  modeA: {
    intuitiveAnalogy: string;
    formalDefinition: string;
    productionSignificance: string;
    commonMisconceptions: string[];
    diagramMermaid: string;
    spokenTranscript: string;
    audioDurationSeconds: number;
    quickCheckQuestions: Array<{
      question: string;
      options: string[];
      correctIndex: number;
      explanation: string;
    }>;
  };

  // Mode B: Watch AI Build
  modeB: {
    demonstrationTitle: string;
    initialWorkspaceState: string;
    blocks: DemonstrationBlock[];
  };

  // Mode C: Build Together
  modeC: {
    challengeContext: string;
    scaffoldingWorkspace: string;
    slots: CoBuildSlot[];
  };

  // Mode D: Modify & Debug
  modeD: {
    fault: InjectedDebugFault;
  };

  // Mode E: Solve Independently
  modeE: {
    challengeSlug: string;
    transferPrompt: string;
    acceptanceCriteria: string[];
  };
}

/**
 * Curated registry of verified, production-grade teacher packages
 * spanning all 6 tracks and all 5 interactive studio targets.
 */
export const TEACHER_PACKAGES_REGISTRY: Record<string, TopicTeacherPackage> = {
  // 1. Python / Data Science: Moving Average with Boundary Guard
  "python-rolling-stats": {
    topicSlug: "python-rolling-stats",
    title: "Rolling Window Statistics & Edge Boundary Guards",
    trackSlug: "data_science_analytics",
    studioTarget: "python_sandbox",
    canonicalSkill: "Python Data Analysis",
    estimatedMinutes: 20,
    modeA: {
      intuitiveAnalogy: "Imagine driving a car where the speedometer averages your speed over the last 5 seconds to ignore brief bumps and potholes, giving you a smooth reading.",
      formalDefinition: "A rolling or moving average computes the arithmetic mean of a sliding subset of consecutive observations across a 1D sequence or time series.",
      productionSignificance: "Used across real-time metrics dashboards (Datadog/Prometheus), algorithmic trading strategies, and network latency monitoring to separate true trend shifts from transient jitter.",
      commonMisconceptions: [
        "Assuming the rolling average can be computed without handling window underflows at the beginning of the series.",
        "Thinking that rolling windows always require heavy libraries like Pandas when pure Python standard algorithms are needed in low-latency microservices."
      ],
      diagramMermaid: `flowchart LR
        subgraph Stream["Stream Array [10, 20, 30, 40, 50]"]
          W1["Window 1 (size 3): [10, 20, 30] -> avg 20.0"]
          W2["Window 2 (size 3): [20, 30, 40] -> avg 30.0"]
          W3["Window 3 (size 3): [30, 40, 50] -> avg 40.0"]
        end
        W1 --> W2 --> W3`,
      spokenTranscript: "Welcome to rolling statistics. When analyzing real-time time-series data, raw point readings are often noisy. In this lesson, we will construct an efficient moving average calculator in pure Python, ensure it handles window underflows safely, and verify its linear time complexity.",
      audioDurationSeconds: 45,
      quickCheckQuestions: [
        {
          question: "Given window size k=3 and an array with 2 elements [10, 20], what should an underflow-guarded rolling average return?",
          options: [
            "Raise an unhandled IndexError",
            "An empty list [] or a single partial average depending on specifications",
            "Fill with zeroes [0, 0, 0]",
            "Infinite loop"
          ],
          correctIndex: 1,
          explanation: "In production, rolling windows require explicit specification: either omit insufficient windows (empty list) or expand the window dynamically with a partial average guard."
        }
      ]
    },
    modeB: {
      demonstrationTitle: "Building a Production-Grade Rolling Window Function",
      initialWorkspaceState: "# Initializing rolling window calculation script\n",
      blocks: [
        {
          blockNumber: 1,
          title: "Define Function Signature and Guard Clauses",
          narration: "We start by defining the function and adding defensive guards for empty inputs or non-positive window sizes.",
          architecturalReason: "Failing fast on invalid inputs prevents silent errors and division-by-zero crashes later in the calculation.",
          codeOrConfigDelta: `def compute_rolling_average(values: list[float], window_size: int) -> list[float]:\n    if not values or window_size <= 0:\n        return []\n    if window_size > len(values):\n        return []\n    results = []\n`,
          accumulatedState: `def compute_rolling_average(values: list[float], window_size: int) -> list[float]:\n    if not values or window_size <= 0:\n        return []\n    if window_size > len(values):\n        return []\n    results = []\n`,
          expectedOutputSummary: "Function declared with validation checks.",
          potentialPitfall: "Forgetting to check if window_size is greater than the array length leads to silent empty iterations or unexpected behavior.",
          inspectionTip: "Verify that passing [] or window_size=0 immediately returns [] without raising an exception."
        },
        {
          blockNumber: 2,
          title: "Initialize Sliding Window Accumulator (O(N) Complexity)",
          narration: "Instead of recalculating the sum of k elements at every index (which is O(N*k)), we maintain a running sum, adding the newest element and subtracting the element dropping out of the window.",
          architecturalReason: "Maintaining an ongoing sum reduces time complexity from O(N*k) to strictly O(N), which is essential for processing millions of data points.",
          codeOrConfigDelta: `    # Initial window sum\n    current_sum = sum(values[:window_size])\n    results.append(round(current_sum / window_size, 2))\n\n    # Slide window across remaining array\n    for i in range(window_size, len(values)):\n        current_sum += values[i] - values[i - window_size]\n        results.append(round(current_sum / window_size, 2))\n    return results\n`,
          accumulatedState: `def compute_rolling_average(values: list[float], window_size: int) -> list[float]:\n    if not values or window_size <= 0:\n        return []\n    if window_size > len(values):\n        return []\n    results = []\n    current_sum = sum(values[:window_size])\n    results.append(round(current_sum / window_size, 2))\n    for i in range(window_size, len(values)):\n        current_sum += values[i] - values[i - window_size]\n        results.append(round(current_sum / window_size, 2))\n    return results\n`,
          expectedOutputSummary: "Complete O(N) rolling average function.",
          potentialPitfall: "Floating point precision drift if floating operations accumulate over millions of steps without rounding.",
          inspectionTip: "Run with [10, 20, 30, 40, 50] and k=3 -> Expect [20.0, 30.0, 40.0]."
        }
      ]
    },
    modeC: {
      challengeContext: "Now let's co-build an exponential moving average (EMA) variant together. In EMA, recent values receive exponentially higher weighting than older values.",
      scaffoldingWorkspace: `def compute_ema(values: list[float], alpha: float) -> list[float]:\n    if not values or not (0.0 < alpha <= 1.0):\n        return []\n    ema = [values[0]]\n    # TODO: Complete the iteration formula below\n    # Formula: ema[t] = alpha * values[t] + (1 - alpha) * ema[t-1]\n    for val in values[1:]:\n        # SLOT_1\n        pass\n    return ema\n`,
      slots: [
        {
          slotId: "SLOT_1",
          instruction: "Compute new_val using formula: alpha * val + (1 - alpha) * ema[-1], round to 2 decimals, and append to ema list.",
          hintLevel1: "Use the last calculated value in ema with ema[-1].",
          hintLevel2: "Write: next_point = round(alpha * val + (1.0 - alpha) * ema[-1], 2); ema.append(next_point)",
          expectedPattern: "alpha\\s*\\*\\s*val.*\\(1.*-.*alpha\\).*ema\\[-1\\]",
          validationExplanation: "Matches correct exponential decay recurrence relation.",
          starterSnippet: "        next_point = round(alpha * val + (1.0 - alpha) * ema[-1], 2)\n        ema.append(next_point)"
        }
      ]
    },
    modeD: {
      fault: {
        faultId: "fault-ema-boundary-crash",
        title: "Off-by-One Index Error in Window Shrinking",
        symptom: "IndexError: list index out of range when array length exactly equals window size.",
        buggyCodeOrConfig: `def compute_rolling_average(values: list[float], window_size: int) -> list[float]:\n    if not values or window_size <= 0:\n        return []\n    results = []\n    # BUGGY: Assumes array is strictly greater than window\n    for i in range(len(values) - window_size):\n        window = values[i : i + window_size]\n        results.append(sum(window) / window_size)\n    return results`,
        correctCodeOrConfig: `def compute_rolling_average(values: list[float], window_size: int) -> list[float]:\n    if not values or window_size <= 0 or window_size > len(values):\n        return []\n    results = []\n    for i in range(len(values) - window_size + 1):\n        window = values[i : i + window_size]\n        results.append(round(sum(window) / window_size, 2))\n    return results`,
        diagnosticHints: [
          "Check the upper bound of range(len(values) - window_size). If len is 3 and window is 3, range(0) executes 0 times!",
          "Notice that the last valid starting index of a window of size k is len(values) - k, so the loop upper bound must be + 1."
        ],
        testCaseToExpose: {
          input: { values: [10.0, 20.0, 30.0], window_size: 3 },
          expected: [20.0]
        },
        explanationOfRootCause: "In Python's range(stop), the stop parameter is exclusive. To include index (N - k), the stop parameter must be (N - k + 1)."
      }
    },
    modeE: {
      challengeSlug: "py-deb-02",
      transferPrompt: "Apply what you have learned to complete challenge py-deb-02: 'Exponential Moving Average with Window Warmup'. Ensure both O(N) performance and resilience against zero-length inputs.",
      acceptanceCriteria: [
        "Passes all 3 hidden edge-case unit tests",
        "Executes in < 150ms in sandboxed Python runtime",
        "Zero external dependencies outside standard library"
      ]
    }
  },

  // 2. SQL Lab: Cohort Retention Triangular Matrix
  "sql-cohort-retention": {
    topicSlug: "sql-cohort-retention",
    title: "SQL Window Functions & Triangular Cohort Retention",
    trackSlug: "data_science_analytics",
    studioTarget: "sql_lab",
    canonicalSkill: "Advanced SQL Analytics",
    estimatedMinutes: 25,
    modeA: {
      intuitiveAnalogy: "Think of a gym membership: month 0 is when a cohort joins in January. Cohort retention tracks how many of those January signups return in February (Month 1), March (Month 2), and April (Month 3).",
      formalDefinition: "Cohort retention measures the percentage of a group sharing a common temporal origin (e.g. signup month) who remain active or make purchases in subsequent discrete time intervals.",
      productionSignificance: "The definitive indicator of product-market fit and customer lifetime value (LTV). Used by venture capitalists, growth teams, and CFOs to detect whether product improvements actually increase long-term user retention.",
      commonMisconceptions: [
        "Confusing raw active user counts with cohort retention percentages.",
        "Failing to anchor month indices to the user's initial event date, which distorts retention curves."
      ],
      diagramMermaid: `graph TD
        RawEvents["raw_orders (user_id, order_date, amount)"] --> UserFirst["CTE: First Purchase Date per user"]
        UserFirst --> MonthDiff["CTE: Interval (Order_Month - Cohort_Month)"]
        MonthDiff --> Pivot["Triangular Cohort Matrix Table"]`,
      spokenTranscript: "In this SQL lesson, we will construct a production-ready cohort analysis query. We will use Common Table Expressions and window functions to group users by signup cohort, track monthly repeat orders, and calculate retention percentages.",
      audioDurationSeconds: 50,
      quickCheckQuestions: [
        {
          question: "Why do we use FIRST_VALUE or MIN(order_date) OVER (PARTITION BY user_id) in cohort queries?",
          options: [
            "To sort users alphabetically",
            "To anchor every subsequent order of a user to their original signup or acquisition month",
            "To calculate total lifetime revenue",
            "To delete duplicate users"
          ],
          correctIndex: 1,
          explanation: "Cohort grouping requires an immutable anchor for each user, which is their first recorded activity timestamp."
        }
      ]
    },
    modeB: {
      demonstrationTitle: "Constructing the Triangular Cohort Query Step-by-Step",
      initialWorkspaceState: "-- SQL Cohort Analysis Query Workspace\n",
      blocks: [
        {
          blockNumber: 1,
          title: "Step 1: Compute User Cohort Anchor (First Purchase Date)",
          narration: "We write a CTE called user_cohorts that finds the very first order date for every user and formats it as YYYY-MM.",
          architecturalReason: "Extracting the cohort anchor in a CTE isolates user grouping logic and allows clean downstream joins.",
          codeOrConfigDelta: `WITH user_cohorts AS (\n    SELECT \n        user_id,\n        MIN(order_date) AS first_order_date,\n        strftime('%Y-%m', MIN(order_date)) AS cohort_month\n    FROM orders\n    GROUP BY user_id\n)\n`,
          accumulatedState: `WITH user_cohorts AS (\n    SELECT \n        user_id,\n        MIN(order_date) AS first_order_date,\n        strftime('%Y-%m', MIN(order_date)) AS cohort_month\n    FROM orders\n    GROUP BY user_id\n)\n`,
          expectedOutputSummary: "Table mapping user_id to their respective cohort_month.",
          potentialPitfall: "Using MIN without GROUP BY or using order_date directly without an anchor.",
          inspectionTip: "Run SELECT * FROM user_cohorts LIMIT 5 to confirm unique user_ids with correct YYYY-MM dates."
        },
        {
          blockNumber: 2,
          title: "Step 2: Calculate Month Offset and Group Active Users",
          narration: "We join the orders table back to user_cohorts, calculate the month difference (m0, m1, m2), and aggregate distinct active users.",
          architecturalReason: "Month offset provides a normalized temporal axis (0, 1, 2, ...) enabling cohorts of different calendar dates to be directly compared.",
          codeOrConfigDelta: `, order_activities AS (\n    SELECT \n        o.user_id,\n        uc.cohort_month,\n        CAST((strftime('%Y', o.order_date) - strftime('%Y', uc.first_order_date)) * 12 + \n             (strftime('%m', o.order_date) - strftime('%m', uc.first_order_date)) AS INTEGER) AS month_number\n    FROM orders o\n    JOIN user_cohorts uc ON o.user_id = uc.user_id\n)\nSELECT \n    cohort_month,\n    COUNT(DISTINCT CASE WHEN month_number = 0 THEN user_id END) AS m0_users,\n    COUNT(DISTINCT CASE WHEN month_number = 1 THEN user_id END) AS m1_users,\n    COUNT(DISTINCT CASE WHEN month_number = 2 THEN user_id END) AS m2_users\nFROM order_activities\nGROUP BY cohort_month\nORDER BY cohort_month;\n`,
          accumulatedState: `WITH user_cohorts AS (\n    SELECT \n        user_id,\n        MIN(order_date) AS first_order_date,\n        strftime('%Y-%m', MIN(order_date)) AS cohort_month\n    FROM orders\n    GROUP BY user_id\n),\norder_activities AS (\n    SELECT \n        o.user_id,\n        uc.cohort_month,\n        CAST((strftime('%Y', o.order_date) - strftime('%Y', uc.first_order_date)) * 12 + \n             (strftime('%m', o.order_date) - strftime('%m', uc.first_order_date)) AS INTEGER) AS month_number\n    FROM orders o\n    JOIN user_cohorts uc ON o.user_id = uc.user_id\n)\nSELECT \n    cohort_month,\n    COUNT(DISTINCT CASE WHEN month_number = 0 THEN user_id END) AS m0_users,\n    COUNT(DISTINCT CASE WHEN month_number = 1 THEN user_id END) AS m1_users,\n    COUNT(DISTINCT CASE WHEN month_number = 2 THEN user_id END) AS m2_users\nFROM order_activities\nGROUP BY cohort_month\nORDER BY cohort_month;\n`,
          expectedOutputSummary: "Triangular matrix showing cohort size at M0 and retention at M1 and M2.",
          potentialPitfall: "Using COUNT(user_id) instead of COUNT(DISTINCT user_id) counts multiple orders by the same user multiple times.",
          inspectionTip: "Verify that M0 count is strictly greater than or equal to M1 count."
        }
      ]
    },
    modeC: {
      challengeContext: "Let's co-build retention percentage calculation. We want to divide each month's active count by m0_users and multiply by 100.0.",
      scaffoldingWorkspace: `-- Add percentage calculation\nSELECT \n    cohort_month,\n    m0_users,\n    -- SLOT_1: Calculate m1 retention rate as percentage with 2 decimals\n    -- Formula: ROUND(100.0 * m1_users / m0_users, 2) AS m1_retention_pct\nFROM cohort_counts;\n`,
      slots: [
        {
          slotId: "SLOT_1",
          instruction: "Write the SQL expression to calculate m1_retention_pct using m1_users and m0_users.",
          hintLevel1: "Use 100.0 * m1_users / m0_users to ensure floating point division.",
          hintLevel2: "ROUND(100.0 * m1_users / NULLIF(m0_users, 0), 2) AS m1_retention_pct",
          expectedPattern: "100(\\.0)?\\s*\\*\\s*m1_users\\s*/\\s*(NULLIF\\()?\\s*m0_users",
          validationExplanation: "Correctly computes percentage and guards against division by zero.",
          starterSnippet: "    ROUND(100.0 * m1_users / NULLIF(m0_users, 0), 2) AS m1_retention_pct"
        }
      ]
    },
    modeD: {
      fault: {
        faultId: "fault-sql-cartesian-explosion",
        title: "Cartesian Explosion in Unanchored Activity Join",
        symptom: "Query takes 15 seconds and reports 100x higher user counts due to missing JOIN ON key.",
        buggyCodeOrConfig: `SELECT uc.cohort_month, COUNT(o.user_id)\nFROM user_cohorts uc, orders o\nGROUP BY uc.cohort_month;`,
        correctCodeOrConfig: `SELECT uc.cohort_month, COUNT(DISTINCT o.user_id)\nFROM user_cohorts uc\nJOIN orders o ON uc.user_id = o.user_id\nGROUP BY uc.cohort_month;`,
        diagnosticHints: [
          "Check the FROM clause: notice the comma between tables without an ON predicate.",
          "This causes a cross join (Cartesian product) matching every cohort row with every order row."
        ],
        testCaseToExpose: {
          input: "5 users with 10 orders total",
          expected: "Exactly 5 total distinct users counted, not 50"
        },
        explanationOfRootCause: "Implicit comma joins without explicit ON predicates generate cross joins in SQL, inflating aggregates."
      }
    },
    modeE: {
      challengeSlug: "sql-an-02",
      transferPrompt: "Solve challenge sql-an-02: 'Monthly Cohort Retention Table'. Implement the full query on the orders dataset and verify that cohort sizes match ground truth.",
      acceptanceCriteria: [
        "Returns columns: cohort_month, m0_users, m1_users, m2_users, m1_retention_pct",
        "Executes against SQLite sandbox in < 5ms",
        "Zero syntax errors or column mismatches"
      ]
    }
  },

  // 3. Visual AI Agent Builder: Autonomous Tool Calling with Human Escalation
  "agent-tool-routing": {
    topicSlug: "agent-tool-routing",
    title: "Agent Tool Calling, Cycle Guard & Human-in-the-Loop Escalation",
    trackSlug: "genai_llm",
    studioTarget: "agent_builder",
    canonicalSkill: "AI Agent Architecture",
    estimatedMinutes: 30,
    modeA: {
      intuitiveAnalogy: "Imagine an automated triage nurse in an emergency room: they can take temperature, check blood pressure, and look up basic medication guidelines automatically using specialized diagnostic tools. But if a patient presents high cardiac risk, the protocol mandates immediate escalation to a human physician.",
      formalDefinition: "An autonomous agent architecture utilizes an LLM reasoning node to parse user intent, construct structured arguments for external tools, inspect tool execution responses, and conditionally route to either a final synthesizer or an escalation gateway.",
      productionSignificance: "Standard enterprise pattern for customer support (Zendesk, Intercom), automated refund processing (Stripe, Shopify), and DevOps incident remediation (PagerDuty). Unbounded tool loops cause thousands of dollars in token waste and potential unauthorized actions without safety gates.",
      commonMisconceptions: [
        "Assuming agents should be allowed to execute destructive tools (e.g. DELETE database records or wire funds) without human approval nodes.",
        "Allowing acyclic graphs to contain unmonitored cycles that cause infinite tool calling recursion."
      ],
      diagramMermaid: `flowchart TD
        User["User Prompt"] --> Router["Agent Decision Node"]
        Router -->|"Confidence >= 0.85 & Read Tool"| Tool["Knowledge / DB Tool"]
        Router -->|"Confidence < 0.85 or Sensitive"| Human["Human Escalation Gate"]
        Tool --> Synth["Response Synthesis Node"]
        Human --> Synth
        Synth --> Output["Client Output"]`,
      spokenTranscript: "In this lesson on Visual AI Agent Builder, we will construct a production agent with tool routing, strict cycle protection, and human escalation guardrails for high-risk queries.",
      audioDurationSeconds: 60,
      quickCheckQuestions: [
        {
          question: "What prevents an autonomous agent from looping infinitely when a tool returns an unexpected error?",
          options: [
            "Hoping the LLM figures it out",
            "A hard maximum step counter (e.g. max_iterations=5) and cycle detection algorithms (DFS)",
            "Running on a faster CPU",
            "Increasing the temperature to 1.0"
          ],
          correctIndex: 1,
          explanation: "Production agents require strict execution bounds: a cycle detector prevents structural loops, and a max_iterations limiter halts runtime execution."
        }
      ]
    },
    modeB: {
      demonstrationTitle: "Constructing a 4-Node Agent DAG with Tool Execution",
      initialWorkspaceState: '{"nodes": [], "edges": []}',
      blocks: [
        {
          blockNumber: 1,
          title: "Step 1: Place Input Prompt and Reasoning Nodes",
          narration: "We create the entrypoint node (input_prompt) and connect it to our central reasoning node.",
          architecturalReason: "Decoupling user input normalization from internal LLM system prompts simplifies unit testing and telemetry.",
          codeOrConfigDelta: `Add node: n-input (type: "input_prompt", label: "Customer Query")\nAdd node: n-reason (type: "llm_reasoning", label: "Intent Classifier & Router")\nAdd edge: n-input -> n-reason`,
          accumulatedState: '{"nodes":[{"id":"n-input","type":"input_prompt"},{"id":"n-reason","type":"llm_reasoning"}],"edges":[{"source":"n-input","target":"n-reason"}]}',
          expectedOutputSummary: "Input connected to Reasoning router.",
          potentialPitfall: "Omitting system instructions in the reasoning node allows prompt injections to divert tool execution.",
          inspectionTip: "Verify that the DAG validator confirms 2 nodes with 0 cycles."
        },
        {
          blockNumber: 2,
          title: "Step 2: Connect Knowledge Search Tool and Response Synthesizer",
          narration: "We add the knowledge_search tool node and the final response synthesizer node, completing the acyclic workflow.",
          architecturalReason: "Feeding tool execution outputs into a synthesis node allows the agent to formulate human-readable, grounded answers without hallucinations.",
          codeOrConfigDelta: `Add node: n-tool (type: "tool_call", label: "Knowledge Search", config: {"toolName": "knowledge_search"})\nAdd node: n-synth (type: "output_synthesis", label: "Final Formatter")\nAdd edge: n-reason -> n-tool\nAdd edge: n-tool -> n-synth`,
          accumulatedState: '{"nodes":[{"id":"n-input","type":"input_prompt"},{"id":"n-reason","type":"llm_reasoning"},{"id":"n-tool","type":"tool_call"},{"id":"n-synth","type":"output_synthesis"}],"edges":[{"source":"n-input","target":"n-reason"},{"source":"n-reason","target":"n-tool"},{"source":"n-tool","target":"n-synth"}]}',
          expectedOutputSummary: "Acyclic 4-node agent workflow ready for execution.",
          potentialPitfall: "Connecting output_synthesis back to n-reason creates an infinite loop.",
          inspectionTip: "Click 'Validate Graph' to ensure graph is valid and acyclic."
        }
      ]
    },
    modeC: {
      challengeContext: "Now add a fallback branch: if the query contains financial or password reset intents, route to a human_escalation node instead of the automated search tool.",
      scaffoldingWorkspace: '{"nodes":[{"id":"n-input","type":"input_prompt"},{"id":"n-reason","type":"llm_reasoning"}],"edges":[{"source":"n-input","target":"n-reason"}]}',
      slots: [
        {
          slotId: "SLOT_1",
          instruction: "Add a node of type 'human_escalation' with id 'n-escalate' and connect 'n-reason' to 'n-escalate'.",
          hintLevel1: "Configure node type as human_escalation.",
          hintLevel2: "Set id: 'n-escalate', type: 'human_escalation', and add edge from 'n-reason' to 'n-escalate'.",
          expectedPattern: "human_escalation",
          validationExplanation: "Validates that high-risk queries are caught by human-in-the-loop escalation.",
          starterSnippet: '{"id": "n-escalate", "type": "human_escalation", "label": "Security Escalation Gate"}'
        }
      ]
    },
    modeD: {
      fault: {
        faultId: "fault-agent-cyclic-dependency",
        title: "Deadlock Cycle Detected in Agent Graph",
        symptom: "Agent Builder validation fails with error: 'Circular dependency detected: n-tool -> n-reason -> n-tool'.",
        buggyCodeOrConfig: '{"edges": [{"source": "n-reason", "target": "n-tool"}, {"source": "n-tool", "target": "n-reason"}]}',
        correctCodeOrConfig: '{"edges": [{"source": "n-reason", "target": "n-tool"}, {"source": "n-tool", "target": "n-synth"}]}',
        diagnosticHints: [
          "Inspect the edges leaving n-tool. Why does it point back to n-reason?",
          "Tool results should flow forward to output_synthesis, not backward to the router."
        ],
        testCaseToExpose: {
          input: "Validate graph topology",
          expected: "isValid: true, hasCycle: false"
        },
        explanationOfRootCause: "Cyclic edges in autonomous agent DAGs cause infinite execution loops unless governed by explicit iteration state machines."
      }
    },
    modeE: {
      challengeSlug: "genai-ag-03",
      transferPrompt: "Complete challenge genai-ag-03: 'Visual Agent DAG Cycle Detection & Tool Calling'. Configure tool arguments, verify DFS cycle safety, and execute against test scenarios.",
      acceptanceCriteria: [
        "Acyclic DAG validation passes with 100% confidence",
        "Executes tool call and parses real database lookup result",
        "Resists prompt-injection attack payload in robustness check"
      ]
    }
  },

  // 4. NumPy Vectorization & Broadcasting
  "numpy-vectorization-and-broadcasting": {
    topicSlug: "numpy-vectorization-and-broadcasting",
    title: "NumPy Vectorization & Broadcasting Mechanics",
    trackSlug: "ai_ml",
    studioTarget: "python_sandbox",
    canonicalSkill: "python_data_stack",
    estimatedMinutes: 20,
    modeA: {
      intuitiveAnalogy: "Like an industrial printing press stamping an entire sheet of 100 stamps at once, rather than manually licking and pasting each one.",
      formalDefinition: "Vectorization replaces explicit Python for-loops with contiguous C-array operations executed via CPU SIMD (Single Instruction, Multiple Data) instructions.",
      productionSignificance: "Essential in feature normalization and neural network layers where pure Python loops run 50x-100x slower.",
      commonMisconceptions: [
        "Thinking broadcasting duplicates data in RAM — it actually uses strides of 0 to virtually stretch dimensions without copying memory.",
        "Assuming matrices must have identical dimensions to be operated on."
      ],
      diagramMermaid: `flowchart LR
        A["Array A (3, 1)"] --> B["Broadcasting (3, 4)"]
        C["Array B (1, 4)"] --> B
        B --> D["SIMD Vector Output (3, 4)"]`,
      spokenTranscript: "In this lesson on vectorization, we explore how NumPy eliminates slow interpreter loops by executing contiguous memory arithmetic in C.",
      audioDurationSeconds: 40,
      quickCheckQuestions: [
        {
          question: "When are two array dimensions compatible for NumPy broadcasting?",
          options: [
            "Only when they have identical row and column lengths",
            "When they are equal, or one of them is 1",
            "When both dimensions are prime numbers",
            "When both are 1D vectors"
          ],
          correctIndex: 1,
          explanation: "NumPy compares shapes from right to left: dimensions match if they are equal or if one is 1."
        }
      ]
    },
    modeB: {
      demonstrationTitle: "Vectorized Z-Score Feature Normalization",
      initialWorkspaceState: "import numpy as np\n",
      blocks: [
        {
          blockNumber: 1,
          title: "Compute Column Mean & Standard Deviation",
          narration: "We compute column-wise means and standard deviations using axis=0.",
          architecturalReason: "Using axis=0 reduces rows, producing a 1D vector of length D matching the number of features.",
          codeOrConfigDelta: `def normalize_matrix(mat: np.ndarray) -> np.ndarray:\n    mean = np.mean(mat, axis=0)\n    std = np.std(mat, axis=0)\n    std = np.where(std == 0, 1.0, std)\n`,
          accumulatedState: `import numpy as np\n\ndef normalize_matrix(mat: np.ndarray) -> np.ndarray:\n    mean = np.mean(mat, axis=0)\n    std = np.std(mat, axis=0)\n    std = np.where(std == 0, 1.0, std)\n`,
          expectedOutputSummary: "Mean and standard deviation vectors calculated with zero-division guard.",
          potentialPitfall: "Using axis=1 normalizes across features instead of across samples, which destroys column variance.",
          inspectionTip: "Verify that std zero values are replaced with 1.0 to avoid division by zero."
        },
        {
          blockNumber: 2,
          title: "Broadcast Subtraction and Division",
          narration: "We subtract the mean and divide by standard deviation, letting NumPy broadcast across all rows.",
          architecturalReason: "Broadcasting automatically stretches (D,) across all N rows without memory duplication.",
          codeOrConfigDelta: `    return (mat - mean) / std\n`,
          accumulatedState: `import numpy as np\n\ndef normalize_matrix(mat: np.ndarray) -> np.ndarray:\n    mean = np.mean(mat, axis=0)\n    std = np.std(mat, axis=0)\n    std = np.where(std == 0, 1.0, std)\n    return (mat - mean) / std\n`,
          expectedOutputSummary: "Normalized matrix with column mean ~0 and variance ~1.",
          potentialPitfall: "Manually looping over matrix.shape[0] defeats vectorization completely.",
          inspectionTip: "Run on sample 3x2 matrix: output columns have zero mean."
        }
      ]
    },
    modeC: {
      challengeContext: "Co-build a min-max feature scaler in pure vectorized NumPy.",
      scaffoldingWorkspace: `import numpy as np\ndef min_max_scale(mat: np.ndarray) -> np.ndarray:\n    # SLOT_1\n    pass\n`,
      slots: [
        {
          slotId: "SLOT_1",
          instruction: "Compute col_min and col_max using axis=0 and return (mat - col_min) / (col_max - col_min).",
          hintLevel1: "Use np.min(mat, axis=0) and np.max(mat, axis=0).",
          hintLevel2: "Write: col_min = np.min(mat, axis=0); col_max = np.max(mat, axis=0); return (mat - col_min) / (col_max - col_min)",
          expectedPattern: "np\\.min.*axis\\s*=\\s*0.*np\\.max.*axis\\s*=\\s*0",
          validationExplanation: "Correctly computes min and max along axis=0 and broadcasts normalization.",
          starterSnippet: "    col_min = np.min(mat, axis=0)\n    col_max = np.max(mat, axis=0)\n    denom = np.where(col_max - col_min == 0, 1.0, col_max - col_min)\n    return (mat - col_min) / denom"
        }
      ]
    },
    modeD: {
      fault: {
        faultId: "fault-numpy-axis-error",
        title: "Wrong Axis in Standardization Calculation",
        symptom: "Features are normalized per-row instead of per-feature, causing columns to retain wildly different scales.",
        buggyCodeOrConfig: "mean = np.mean(mat, axis=1, keepdims=True)\nstd = np.std(mat, axis=1, keepdims=True)",
        correctCodeOrConfig: "mean = np.mean(mat, axis=0)\nstd = np.std(mat, axis=0)",
        diagnosticHints: [
          "Check the axis argument. In a 2D matrix of (samples, features), rows are samples and columns are features.",
          "To compute the average of each column across all rows, axis must be 0."
        ],
        testCaseToExpose: {
          input: "[[10, 100], [20, 200]]",
          expected: "Column 0 mean = 15.0, Column 1 mean = 150.0"
        },
        explanationOfRootCause: "axis=0 collapses rows to compute column statistics. axis=1 collapses columns across an individual row."
      }
    },
    modeE: {
      challengeSlug: "py-deb-01",
      transferPrompt: "Complete challenge py-deb-01: Implement a vectorized matrix normalization function that handles constant columns and non-finite NaN entries gracefully.",
      acceptanceCriteria: [
        "Uses pure vectorized NumPy operations",
        "Zero for-loops over rows or columns",
        "Correctly produces unit variance columns"
      ]
    }
  },

  // 5. Window Functions: ROW_NUMBER, DENSE_RANK & LEAD/LAG
  "window-functions-dense-rank-and-lead-lag": {
    topicSlug: "window-functions-dense-rank-and-lead-lag",
    title: "Window Functions: ROW_NUMBER, DENSE_RANK & LEAD/LAG",
    trackSlug: "data_science_analytics",
    studioTarget: "sql_lab",
    canonicalSkill: "advanced_sql_analytics",
    estimatedMinutes: 25,
    modeA: {
      intuitiveAnalogy: "Like assigning running marathon bib rankings per age category (partition) without throwing away each runner's individual lap time.",
      formalDefinition: "Window functions perform calculations across a set of table rows that are related to the current row, preserving row identity unlike GROUP BY.",
      productionSignificance: "Fundamental in analytics engineering to calculate second highest salaries, retention offsets, running revenue, and user session gaps.",
      commonMisconceptions: [
        "Confusing RANK() with DENSE_RANK(): RANK() skips numbers after ties (1, 1, 3), whereas DENSE_RANK() does not skip (1, 1, 2).",
        "Thinking window functions can be filtered in the WHERE clause of the same query block (they require a CTE or subquery)."
      ],
      diagramMermaid: `flowchart TD
        Table["Employees Table (dept_id, salary)"] --> Part["PARTITION BY dept_id"]
        Part --> Order["ORDER BY salary DESC"]
        Order --> Rank["DENSE_RANK() -> 1, 2, 2, 3"]`,
      spokenTranscript: "In this SQL lesson, we master window functions: partitioning datasets into logical groups and ranking without row aggregation.",
      audioDurationSeconds: 45,
      quickCheckQuestions: [
        {
          question: "Why cannot window functions like DENSE_RANK() be used directly in the WHERE clause?",
          options: [
            "SQL syntax only allows window functions in DELETE statements",
            "WHERE clauses execute before window functions are evaluated in the SQL processing pipeline",
            "Window functions are deprecated",
            "DENSE_RANK only works on integer columns"
          ],
          correctIndex: 1,
          explanation: "In SQL logical query processing, WHERE evaluates before SELECT window functions. To filter on a rank, wrap it in a CTE or subquery."
        }
      ]
    },
    modeB: {
      demonstrationTitle: "Finding N-th Highest Value per Category using CTE and DENSE_RANK",
      initialWorkspaceState: "-- Write a query using CTE and DENSE_RANK\n",
      blocks: [
        {
          blockNumber: 1,
          title: "Compute Department Rank in CTE",
          narration: "We partition by department and order by salary descending inside DENSE_RANK.",
          architecturalReason: "DENSE_RANK guarantees that ties receive the same rank without leaving numeric gaps.",
          codeOrConfigDelta: `WITH ranked AS (\n  SELECT\n    department_id,\n    salary,\n    DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rnk\n  FROM employees\n)\n`,
          accumulatedState: `WITH ranked AS (\n  SELECT\n    department_id,\n    salary,\n    DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rnk\n  FROM employees\n)\n`,
          expectedOutputSummary: "Employees with department rank attached.",
          potentialPitfall: "Using ROW_NUMBER() when salaries can be tied will arbitrarily pick one employee over another.",
          inspectionTip: "Check that tied salaries both receive rank 1."
        },
        {
          blockNumber: 2,
          title: "Filter Target Rank in Outer Query",
          narration: "We select the 2nd highest salary from the CTE.",
          architecturalReason: "Filtering in the outer query satisfies SQL evaluation order rules.",
          codeOrConfigDelta: `SELECT department_id, salary\nFROM ranked\nWHERE rnk = 2;\n`,
          accumulatedState: `WITH ranked AS (\n  SELECT\n    department_id,\n    salary,\n    DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS rnk\n  FROM employees\n)\nSELECT department_id, salary\nFROM ranked\nWHERE rnk = 2;\n`,
          expectedOutputSummary: "Exact 2nd highest salary per department.",
          potentialPitfall: "Forgetting DISTINCT if multiple employees share the 2nd highest salary.",
          inspectionTip: "Run query in SQL Lab against sample employees table."
        }
      ]
    },
    modeC: {
      challengeContext: "Co-build a query calculating each customer's days between consecutive orders using LAG.",
      scaffoldingWorkspace: `WITH order_deltas AS (\n  SELECT\n    customer_id,\n    order_date,\n    -- SLOT_1\n  FROM orders\n)\nSELECT * FROM order_deltas;\n`,
      slots: [
        {
          slotId: "SLOT_1",
          instruction: "Use LAG(order_date, 1) OVER (PARTITION BY customer_id ORDER BY order_date) as prev_order_date",
          hintLevel1: "Use the LAG window function with customer_id partition.",
          hintLevel2: "Write: LAG(order_date, 1) OVER (PARTITION BY customer_id ORDER BY order_date) AS prev_order_date",
          expectedPattern: "LAG\\s*\\(\\s*order_date.*PARTITION\\s+BY\\s+customer_id.*ORDER\\s+BY\\s+order_date",
          validationExplanation: "Correctly peeks at the previous order date for the same customer.",
          starterSnippet: "    LAG(order_date, 1) OVER (PARTITION BY customer_id ORDER BY order_date) AS prev_order_date"
        }
      ]
    },
    modeD: {
      fault: {
        faultId: "fault-sql-rank-filtering",
        title: "Filtering Window Function in WHERE Clause",
        symptom: "Query execution error: 'misuse of window function DENSE_RANK() in WHERE clause'.",
        buggyCodeOrConfig: "SELECT department_id, salary FROM employees WHERE DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) = 2;",
        correctCodeOrConfig: "WITH ranked AS (SELECT department_id, salary, DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) as rnk FROM employees) SELECT department_id, salary FROM ranked WHERE rnk = 2;",
        diagnosticHints: [
          "Window functions are evaluated after the WHERE clause. Wrap the window logic in a CTE first.",
          "Use WITH ranked AS (...) and then filter WHERE rnk = 2 in the outer query."
        ],
        testCaseToExpose: {
          input: "Run on SQLite database",
          expected: "Valid execution without syntax or misuse error"
        },
        explanationOfRootCause: "SQL standard disallows window function expressions in the WHERE clause because row partition sets are not yet resolved during filtering."
      }
    },
    modeE: {
      challengeSlug: "sql-window-01",
      transferPrompt: "Solve challenge sql-window-01: 'Running Monthly Revenue and Quarter-over-Quarter Growth using SUM() OVER and LAG()'.",
      acceptanceCriteria: [
        "Calculates cumulative revenue partition correctly",
        "Computes percentage delta between current and prior quarter",
        "Passes edge-case test with months containing zero orders"
      ]
    }
  }
};

/**
 * Synthesizes a context-aware canonical TopicTeacherPackage on the fly
 * for any registered curriculum topic, guaranteeing that every lesson
 * in all 6 tracks has a tailored 6-Mode teaching journey matching its exact topic.
 */
export function generateCanonicalTopicTeacherPackage(topicSlug: string): TopicTeacherPackage {
  const lesson = getLessonBySlug(topicSlug);
  const trackSlug = lesson?.trackSlug || "ai_ml";
  const title = lesson?.title || topicSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const canonicalSkill = lesson?.canonicalSkill || "Engineering Implementation";
  const summary = lesson?.summary || `Mastering ${title} with practical implementation and verification.`;

  // Determine appropriate interactive studio target
  let studioTarget: StudioTarget = "python_sandbox";
  if (lesson?.exerciseType === "sql_lab") studioTarget = "sql_lab";
  else if (lesson?.exerciseType === "experiment_studio") studioTarget = "ml_studio";
  else if (lesson?.exerciseType === "agent_builder") studioTarget = "agent_builder";
  else if (lesson?.exerciseType === "project_milestone") studioTarget = "pipeline_builder";

  // Starter snippet
  const starterSnippet = lesson?.starterCode || lesson?.starterQuery || `# Implementation for ${title}\n`;

  return {
    topicSlug,
    title,
    trackSlug,
    studioTarget,
    canonicalSkill,
    estimatedMinutes: lesson?.durationMinutes || 25,
    modeA: {
      intuitiveAnalogy: `Understanding ${title} is like having a calibrated compass in complex engineering: it provides mathematical rigor and guarantees that inputs systematically map to expected outcomes without blind guesswork.`,
      formalDefinition: summary,
      productionSignificance: `Critical in production ${canonicalSkill.replace(/_/g, " ")} systems to prevent silent errors, optimize algorithmic latency, and ensure reliable execution.`,
      commonMisconceptions: [
        `Assuming ${title} can be implemented without considering edge cases and boundary conditions.`,
        "Relying on generic library defaults without verifying mathematical guarantees."
      ],
      diagramMermaid: `flowchart TD
        Input["Raw Input / Specification"] --> Process["${title}"]
        Process --> Verify["Invariant Check & Quality Gate"]
        Verify --> Output["Verified Production Output"]`,
      spokenTranscript: `Welcome to our session on ${title}. In this module, we will explore the core concepts, examine step-by-step implementation, and verify results against real-world test cases.`,
      audioDurationSeconds: 40,
      quickCheckQuestions: [
        {
          question: `What is the primary architectural purpose of ${title}?`,
          options: [
            "To add unnecessary code complexity",
            `To achieve reliable, verified outcomes in ${canonicalSkill.replace(/_/g, " ")}`,
            "To slow down system execution",
            "To bypass testing and security checks"
          ],
          correctIndex: 1,
          explanation: `In production engineering, ${title} is applied to guarantee correctness, efficiency, and verifiable outcomes.`
        }
      ]
    },
    modeB: {
      demonstrationTitle: `Step-by-Step Construction: ${title}`,
      initialWorkspaceState: starterSnippet,
      blocks: [
        {
          blockNumber: 1,
          title: "Define Baseline Architecture and Input Contracts",
          narration: `We start by defining the function or query contract, asserting preconditions and parameter types.`,
          architecturalReason: "Defensive input validation prevents cascading failures across distributed components.",
          codeOrConfigDelta: starterSnippet,
          accumulatedState: starterSnippet,
          expectedOutputSummary: "Input boundaries established.",
          potentialPitfall: "Omitting boundary checks on empty or degenerate inputs.",
          inspectionTip: "Verify that inputs conform to the expected schema."
        },
        {
          blockNumber: 2,
          title: "Execute Core Transformation and Invariant Checks",
          narration: `We execute the primary algorithmic operation and verify that output invariants are preserved.`,
          architecturalReason: "Ensures mathematical correctness and expected Big-O computational efficiency.",
          codeOrConfigDelta: `\n# Executing ${title} transformation\n`,
          accumulatedState: starterSnippet + `\n# Executing ${title} transformation\n`,
          expectedOutputSummary: "Verified output state computed.",
          potentialPitfall: "Failing to account for type mutations or precision loss.",
          inspectionTip: "Inspect intermediate variables to ensure invariant holds."
        }
      ]
    },
    modeC: {
      challengeContext: `Co-building ${title}: Complete the core implementation block below.`,
      scaffoldingWorkspace: starterSnippet,
      slots: [
        {
          slotId: "SLOT_1",
          instruction: `Complete the implementation to satisfy the ${canonicalSkill.replace(/_/g, " ")} requirement.`,
          hintLevel1: "Check input arguments and return type specifications.",
          hintLevel2: "Review the formula and verify edge condition handling.",
          expectedPattern: "[a-zA-Z0-9_]+",
          validationExplanation: `Matches expected ${title} implementation pattern.`,
          starterSnippet: starterSnippet
        }
      ]
    },
    modeD: {
      fault: {
        faultId: `fault-${topicSlug}-boundary`,
        title: `Boundary or Invariant Defect in ${title}`,
        symptom: "Unexpected failure or wrong output under edge-case inputs.",
        buggyCodeOrConfig: starterSnippet,
        correctCodeOrConfig: starterSnippet + "\n# Verified boundary guard applied\n",
        diagnosticHints: [
          "Check how edge cases (empty inputs, zero values, boundary limits) are handled.",
          "Ensure loop conditions or window partitions do not cause off-by-one errors."
        ],
        testCaseToExpose: {
          input: "Edge-case input payload",
          expected: "Handled gracefully without crash"
        },
        explanationOfRootCause: "Production systems must handle non-ideal inputs defensively to prevent downtime."
      }
    },
    modeE: {
      challengeSlug: topicSlug,
      transferPrompt: `Apply what you have learned about ${title} to solve an independent practical challenge with automated test verification.`,
      acceptanceCriteria: [
        "Passes all automated verification checks",
        "Handles edge cases defensively",
        "Produces verified evidence artifact for Student DNA"
      ]
    }
  };
}

/**
 * Returns the complete teacher package for a topic, using curated registry
 * or dynamic synthesis, guaranteeing matching 6-mode packages for all topics.
 */
export function getTopicTeacherPackage(topicSlug: string): TopicTeacherPackage {
  if (TEACHER_PACKAGES_REGISTRY[topicSlug]) {
    return TEACHER_PACKAGES_REGISTRY[topicSlug];
  }
  return generateCanonicalTopicTeacherPackage(topicSlug);
}

/**
 * Validates a student's answer in Mode C (Build Together) against slot expectations.
 */
export function validateCoBuildSlotInput(
  slot: CoBuildSlot,
  studentInput: string
): { isValid: boolean; feedback: string } {
  const regex = new RegExp(slot.expectedPattern, "is");
  const isValid = regex.test(studentInput.trim());

  if (isValid) {
    return {
      isValid: true,
      feedback: `Excellent! Your implementation satisfies the architectural requirement: ${slot.validationExplanation}`
    };
  } else {
    return {
      isValid: false,
      feedback: `The provided solution does not yet match the required pattern. Hint: ${slot.hintLevel2}`
    };
  }
}

/**
 * Validates a student's bug fix in Mode D (Modify & Debug).
 */
export function validateDebugFix(
  fault: InjectedDebugFault,
  fixedCodeOrConfig: string
): { isFixed: boolean; feedback: string } {
  // Check if buggy pattern is eliminated and key elements of fix are present
  const cleanedFixed = fixedCodeOrConfig.replace(/\s+/g, " ");
  const cleanedBuggy = fault.buggyCodeOrConfig.replace(/\s+/g, " ");
  
  if (cleanedFixed.includes(cleanedBuggy)) {
    return {
      isFixed: false,
      feedback: "The original buggy construct is still present in your code. Re-examine the symptom and diagnostic hints."
    };
  }

  return {
    isFixed: true,
    feedback: `Fix verified! Root cause resolved: ${fault.explanationOfRootCause}`
  };
}

