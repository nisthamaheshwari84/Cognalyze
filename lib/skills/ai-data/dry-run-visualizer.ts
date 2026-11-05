/**
 * lib/skills/ai-data/dry-run-visualizer.ts
 * 
 * Visual Dry-Run Studio & Step-by-Step Execution Tracer for Cognalyze.
 * 
 * Simulates line-by-line / node-by-node code execution, generating:
 * - Line & block pointers
 * - Comprehensive variable watch tables (variable name, type, current value, delta)
 * - Visual execution timeline with branching states
 * - Spoken technical narration transcripts for Web Speech audio synthesis
 */

export interface DryRunVariableState {
  name: string;
  type: "int" | "float" | "str" | "list" | "dict" | "bool" | "tensor" | "null";
  value: string;
  hasChanged: boolean;
  notes?: string;
}

export interface DryRunStep {
  stepIndex: number;
  lineNumber: number;
  codeLine: string;
  actionSummary: string;
  variables: DryRunVariableState[];
  visualCallStack: string[];
  spokenNarration: string;
  audioDurationSeconds: number;
  intermediateOutput?: string;
  isTerminal?: boolean;
}

export interface DryRunTrace {
  id: string;
  title: string;
  languageOrStudio: "python" | "sql" | "agent_dag" | "pipeline";
  codeOrStructure: string;
  totalSteps: number;
  steps: DryRunStep[];
  finalOutput: string;
  executionComplexitySummary: {
    timeComplexity: string;
    spaceComplexity: string;
    iterationsCount: number;
  };
}

export const CANONICAL_DRY_RUN_TRACES: Record<string, DryRunTrace> = {
  // 1. Sliding Window Rolling Average Trace
  "rolling-average-trace": {
    id: "rolling-average-trace",
    title: "Linear Time O(N) Sliding Window Rolling Average",
    languageOrStudio: "python",
    codeOrStructure: `def compute_rolling_average(values, k):
    results = []
    current_sum = sum(values[:k])
    results.append(current_sum / k)
    for i in range(k, len(values)):
        current_sum += values[i] - values[i - k]
        results.append(current_sum / k)
    return results`,
    totalSteps: 6,
    finalOutput: "[20.0, 30.0, 40.0]",
    executionComplexitySummary: {
      timeComplexity: "O(N) - 1 pass with O(1) slide",
      spaceComplexity: "O(N) - results array",
      iterationsCount: 2
    },
    steps: [
      {
        stepIndex: 1,
        lineNumber: 2,
        codeLine: "results = []",
        actionSummary: "Initialize empty results accumulator list",
        variables: [
          { name: "values", type: "list", value: "[10, 20, 30, 40, 50]", hasChanged: false },
          { name: "k", type: "int", value: "3", hasChanged: false },
          { name: "results", type: "list", value: "[]", hasChanged: true }
        ],
        visualCallStack: ["compute_rolling_average"],
        spokenNarration: "We begin by initializing an empty results array to store our calculated moving averages.",
        audioDurationSeconds: 4
      },
      {
        stepIndex: 2,
        lineNumber: 3,
        codeLine: "current_sum = sum(values[:k])",
        actionSummary: "Compute initial window sum for first k=3 elements (10 + 20 + 30 = 60)",
        variables: [
          { name: "values", type: "list", value: "[10, 20, 30, 40, 50]", hasChanged: false },
          { name: "current_sum", type: "int", value: "60", hasChanged: true, notes: "10 + 20 + 30" }
        ],
        visualCallStack: ["compute_rolling_average"],
        spokenNarration: "Next, we sum the first window of 3 elements: ten plus twenty plus thirty equals sixty.",
        audioDurationSeconds: 5
      },
      {
        stepIndex: 3,
        lineNumber: 4,
        codeLine: "results.append(current_sum / k)",
        actionSummary: "Calculate first average 60 / 3 = 20.0 and append to results",
        variables: [
          { name: "results", type: "list", value: "[20.0]", hasChanged: true }
        ],
        visualCallStack: ["compute_rolling_average"],
        spokenNarration: "We divide sixty by three to yield twenty point zero, our first window average.",
        audioDurationSeconds: 4
      },
      {
        stepIndex: 4,
        lineNumber: 5,
        codeLine: "for i in range(k, len(values)): # Iteration 1: i = 3 (val = 40)",
        actionSummary: "Entering slide loop: i = 3, incoming element = 40, outgoing element = 10",
        variables: [
          { name: "i", type: "int", value: "3", hasChanged: true },
          { name: "values[i]", type: "int", value: "40", hasChanged: true, notes: "Incoming" },
          { name: "values[i-k]", type: "int", value: "10", hasChanged: true, notes: "Outgoing" }
        ],
        visualCallStack: ["compute_rolling_average"],
        spokenNarration: "Now we slide to index three. We add incoming forty and subtract outgoing ten.",
        audioDurationSeconds: 5
      },
      {
        stepIndex: 5,
        lineNumber: 6,
        codeLine: "current_sum += values[i] - values[i - k] # 60 + 40 - 10 = 90",
        actionSummary: "Updated current_sum to 90 without recomputing full slice",
        variables: [
          { name: "current_sum", type: "int", value: "90", hasChanged: true, notes: "60 + 40 - 10" },
          { name: "results", type: "list", value: "[20.0, 30.0]", hasChanged: true, notes: "Appended 90/3=30.0" }
        ],
        visualCallStack: ["compute_rolling_average"],
        spokenNarration: "Current sum updates in constant time to ninety, giving an average of thirty point zero.",
        audioDurationSeconds: 5
      },
      {
        stepIndex: 6,
        lineNumber: 8,
        codeLine: "return results # [20.0, 30.0, 40.0]",
        actionSummary: "Final sliding iteration completes and returns results list",
        variables: [
          { name: "results", type: "list", value: "[20.0, 30.0, 40.0]", hasChanged: false }
        ],
        visualCallStack: ["compute_rolling_average"],
        spokenNarration: "The final slide adds fifty and drops twenty, completing the list with twenty, thirty, forty.",
        audioDurationSeconds: 6,
        isTerminal: true
      }
    ]
  },

  // 2. RRF Reciprocal Rank Fusion Trace
  "rrf-fusion-trace": {
    id: "rrf-fusion-trace",
    title: "Hybrid Search Reciprocal Rank Fusion (k=60)",
    languageOrStudio: "python",
    codeOrStructure: `def rrf(dense_ranks, sparse_ranks, k=60):
    scores = {}
    for r, doc in enumerate(dense_ranks, 1):
        scores[doc] = scores.get(doc, 0.0) + 1.0 / (k + r)
    for r, doc in enumerate(sparse_ranks, 1):
        scores[doc] = scores.get(doc, 0.0) + 1.0 / (k + r)
    return sorted(scores.items(), key=lambda x: -x[1])`,
    totalSteps: 5,
    finalOutput: "[('doc_A', 0.0328), ('doc_B', 0.0161), ('doc_C', 0.0161)]",
    executionComplexitySummary: {
      timeComplexity: "O(D log D) where D is unique document count",
      spaceComplexity: "O(D) score dictionary",
      iterationsCount: 4
    },
    steps: [
      {
        stepIndex: 1,
        lineNumber: 2,
        codeLine: "scores = {}",
        actionSummary: "Initialize empty dictionary for score accumulation",
        variables: [
          { name: "dense_ranks", type: "list", value: "['doc_A', 'doc_B']", hasChanged: false },
          { name: "sparse_ranks", type: "list", value: "['doc_A', 'doc_C']", hasChanged: false },
          { name: "scores", type: "dict", value: "{}", hasChanged: true }
        ],
        visualCallStack: ["rrf"],
        spokenNarration: "We initialize our reciprocal rank accumulator dictionary.",
        audioDurationSeconds: 4
      },
      {
        stepIndex: 2,
        lineNumber: 3,
        codeLine: "for r, doc in enumerate(dense_ranks, 1): # r=1, doc='doc_A'",
        actionSummary: "Dense Rank 1: doc_A score += 1 / (60 + 1) = 0.01639",
        variables: [
          { name: "r", type: "int", value: "1", hasChanged: true },
          { name: "doc", type: "str", value: "'doc_A'", hasChanged: true },
          { name: "scores['doc_A']", type: "float", value: "0.0164", hasChanged: true }
        ],
        visualCallStack: ["rrf"],
        spokenNarration: "Document A is rank one in dense search, earning zero point zero one six four points.",
        audioDurationSeconds: 5
      },
      {
        stepIndex: 3,
        lineNumber: 5,
        codeLine: "for r, doc in enumerate(sparse_ranks, 1): # r=1, doc='doc_A'",
        actionSummary: "Sparse Rank 1: doc_A appears again! score += 1 / (60 + 1) = 0.0328",
        variables: [
          { name: "scores['doc_A']", type: "float", value: "0.0328", hasChanged: true, notes: "Double overlap" }
        ],
        visualCallStack: ["rrf"],
        spokenNarration: "Document A also ranks first in sparse keyword search, doubling its score to zero point zero three two eight.",
        audioDurationSeconds: 6
      },
      {
        stepIndex: 4,
        lineNumber: 5,
        codeLine: "sparse loop continued for doc_C (r=2) -> score += 1/62 = 0.0161",
        actionSummary: "doc_C receives single rank 2 contribution",
        variables: [
          { name: "scores['doc_C']", type: "float", value: "0.0161", hasChanged: true }
        ],
        visualCallStack: ["rrf"],
        spokenNarration: "Document C receives a single second-place contribution.",
        audioDurationSeconds: 4
      },
      {
        stepIndex: 5,
        lineNumber: 7,
        codeLine: "return sorted(scores.items(), key=lambda x: -x[1])",
        actionSummary: "Sort by accumulated score descending",
        variables: [
          { name: "final_ranks", type: "list", value: "[('doc_A', 0.0328), ('doc_B', 0.0161), ('doc_C', 0.0161)]", hasChanged: true }
        ],
        visualCallStack: ["rrf"],
        spokenNarration: "Sorting produces Document A clearly at the top, demonstrating the hybrid fusion advantage.",
        audioDurationSeconds: 5,
        isTerminal: true
      }
    ]
  },

  // 3. SQL Window Function DENSE_RANK Trace
  "sql-window-ranking-trace": {
    id: "sql-window-ranking-trace",
    title: "SQL Window Ranking Partition Trace (DENSE_RANK)",
    languageOrStudio: "sql",
    codeOrStructure: `WITH ranked AS (
    SELECT
        department_id,
        employee_id,
        salary,
        DENSE_RANK() OVER (PARTITION BY department_id ORDER BY salary DESC) AS salary_rank
    FROM employees
)
SELECT * FROM ranked WHERE salary_rank = 2;`,
    totalSteps: 4,
    finalOutput: "department_id=1, employee_id=102, salary=120000, salary_rank=2",
    executionComplexitySummary: {
      timeComplexity: "O(N log N) - Partition sort",
      spaceComplexity: "O(N) - Window spool buffer",
      iterationsCount: 3
    },
    steps: [
      {
        stepIndex: 1,
        lineNumber: 1,
        codeLine: "WITH ranked AS ( ... )",
        actionSummary: "Initialize Common Table Expression window spool buffer",
        variables: [
          { name: "active_partition", type: "str", value: "None", hasChanged: true },
          { name: "current_row", type: "int", value: "0", hasChanged: false }
        ],
        visualCallStack: ["CTE_EXECUTION"],
        spokenNarration: "The SQL execution engine initiates the common table expression spool buffer.",
        audioDurationSeconds: 4
      },
      {
        stepIndex: 2,
        lineNumber: 6,
        codeLine: "PARTITION BY department_id ORDER BY salary DESC",
        actionSummary: "Bucket rows by department_id and sort salaries descending within partition",
        variables: [
          { name: "active_partition", type: "str", value: "dept_1", hasChanged: true },
          { name: "partition_salaries", type: "list", value: "[150000, 120000, 120000, 95000]", hasChanged: true }
        ],
        visualCallStack: ["CTE_EXECUTION", "WINDOW_PARTITION"],
        spokenNarration: "Rows are grouped into department one, with salaries sorted from highest to lowest.",
        audioDurationSeconds: 5
      },
      {
        stepIndex: 3,
        lineNumber: 6,
        codeLine: "DENSE_RANK() OVER (...) AS salary_rank",
        actionSummary: "Assign ranks: 150k -> 1, 120k -> 2, tied 120k -> 2 (no gap!), 95k -> 3",
        variables: [
          { name: "ranks_assigned", type: "dict", value: "{150k: 1, 120k: 2, 95k: 3}", hasChanged: true }
        ],
        visualCallStack: ["CTE_EXECUTION", "DENSE_RANK_CALC"],
        spokenNarration: "DENSE_RANK assigns rank one to the top salary, and rank two to tied second-place salaries without numeric gaps.",
        audioDurationSeconds: 6
      },
      {
        stepIndex: 4,
        lineNumber: 9,
        codeLine: "SELECT * FROM ranked WHERE salary_rank = 2;",
        actionSummary: "Filter outer query for salary_rank = 2, returning exact tied second-highest earners",
        variables: [
          { name: "result_rows_count", type: "int", value: "2", hasChanged: true }
        ],
        visualCallStack: ["OUTER_FILTER"],
        spokenNarration: "The outer query filters for rank two, returning both employees tied at one hundred twenty thousand.",
        audioDurationSeconds: 5,
        isTerminal: true
      }
    ]
  },

  // 4. ML Gradient Descent Parameter Update Trace
  "gradient-descent-trace": {
    id: "gradient-descent-trace",
    title: "Logistic Regression Gradient Descent Step (Cross-Entropy)",
    languageOrStudio: "python",
    codeOrStructure: `def gradient_descent_step(w, X, y, lr=0.1):
    z = X @ w
    p = 1.0 / (1.0 + np.exp(-z))
    error = p - y
    grad = (X.T @ error) / len(y)
    w_next = w - lr * grad
    return w_next`,
    totalSteps: 5,
    finalOutput: "w_next = [0.42, -0.18]",
    executionComplexitySummary: {
      timeComplexity: "O(N * D) - Vectorized matrix-vector product",
      spaceComplexity: "O(N) - Prediction vector buffer",
      iterationsCount: 1
    },
    steps: [
      {
        stepIndex: 1,
        lineNumber: 2,
        codeLine: "z = X @ w",
        actionSummary: "Compute linear logit dot product z = Xw",
        variables: [
          { name: "w", type: "list", value: "[0.5, -0.2]", hasChanged: false },
          { name: "z", type: "list", value: "[1.2, -0.8, 0.4]", hasChanged: true }
        ],
        visualCallStack: ["gradient_descent_step"],
        spokenNarration: "We compute linear logit activations by taking the dot product of feature matrix X and weight vector w.",
        audioDurationSeconds: 4
      },
      {
        stepIndex: 2,
        lineNumber: 3,
        codeLine: "p = 1.0 / (1.0 + np.exp(-z))",
        actionSummary: "Apply Sigmoid activation function to map logits to probabilities [0, 1]",
        variables: [
          { name: "p", type: "list", value: "[0.768, 0.310, 0.598]", hasChanged: true }
        ],
        visualCallStack: ["gradient_descent_step", "SIGMOID"],
        spokenNarration: "Sigmoid squashes linear scores into continuous probabilities between zero and one.",
        audioDurationSeconds: 4
      },
      {
        stepIndex: 3,
        lineNumber: 4,
        codeLine: "error = p - y",
        actionSummary: "Compute prediction residual error vector (p - y)",
        variables: [
          { name: "y", type: "list", value: "[1.0, 0.0, 1.0]", hasChanged: false },
          { name: "error", type: "list", value: "[-0.232, 0.310, -0.402]", hasChanged: true }
        ],
        visualCallStack: ["gradient_descent_step"],
        spokenNarration: "Residual errors measure the gap between predicted probabilities and binary ground truth.",
        audioDurationSeconds: 4
      },
      {
        stepIndex: 4,
        lineNumber: 5,
        codeLine: "grad = (X.T @ error) / len(y)",
        actionSummary: "Project residuals against features to compute loss gradient with respect to w",
        variables: [
          { name: "grad", type: "list", value: "[0.80, -0.20]", hasChanged: true }
        ],
        visualCallStack: ["gradient_descent_step"],
        spokenNarration: "Projecting errors against feature dimensions calculates the steepest direction of cross-entropy increase.",
        audioDurationSeconds: 5
      },
      {
        stepIndex: 5,
        lineNumber: 6,
        codeLine: "w_next = w - lr * grad",
        actionSummary: "Step in negative gradient direction to reduce classification log-loss",
        variables: [
          { name: "w_next", type: "list", value: "[0.42, -0.18]", hasChanged: true }
        ],
        visualCallStack: ["gradient_descent_step", "WEIGHT_UPDATE"],
        spokenNarration: "We take a learning-rate scaled step opposite the gradient, reducing cross-entropy loss for the next iteration.",
        audioDurationSeconds: 5,
        isTerminal: true
      }
    ]
  },

  // 5. ReAct AI Agent Tool Routing Trace
  "react-agent-trace": {
    id: "react-agent-trace",
    title: "ReAct Agent Tool Execution & Observation Synthesis",
    languageOrStudio: "agent_dag",
    codeOrStructure: `def react_cycle(query, tools):
    # Step 1: Model reasons about query intent
    thought = reason(query)
    # Step 2: Model emits structured tool invocation
    action = call_tool("database_lookup", {"customer_id": 401})
    # Step 3: Tool sandbox executes and returns observation
    obs = execute_tool(action)
    # Step 4: Final response synthesized with verified evidence
    response = synthesize(thought, obs)
    return response`,
    totalSteps: 4,
    finalOutput: "Customer 401 balance verified: $450.00. Refund approved.",
    executionComplexitySummary: {
      timeComplexity: "O(1) - 2 model turns + 1 tool call",
      spaceComplexity: "O(K) - Context message buffer",
      iterationsCount: 2
    },
    steps: [
      {
        stepIndex: 1,
        lineNumber: 3,
        codeLine: "thought = reason(query)",
        actionSummary: "Reasoning node: Agent recognizes need for customer balance before approving refund",
        variables: [
          { name: "agent_state", type: "str", value: "THINKING", hasChanged: true },
          { name: "thought", type: "str", value: "'Need customer 401 ledger balance'", hasChanged: true }
        ],
        visualCallStack: ["AGENT_REASON"],
        spokenNarration: "The agent reads the user's refund request and determines that it must inspect the customer's ledger balance.",
        audioDurationSeconds: 4
      },
      {
        stepIndex: 2,
        lineNumber: 5,
        codeLine: "action = call_tool('database_lookup', {'customer_id': 401})",
        actionSummary: "Action node: Agent generates structured tool payload to query database",
        variables: [
          { name: "agent_state", type: "str", value: "TOOL_CALLING", hasChanged: true },
          { name: "tool_name", type: "str", value: "database_lookup", hasChanged: true },
          { name: "tool_args", type: "dict", value: "{'customer_id': 401}", hasChanged: true }
        ],
        visualCallStack: ["TOOL_DISPATCH"],
        spokenNarration: "The agent issues a structured JSON function call targeting the database lookup tool.",
        audioDurationSeconds: 4
      },
      {
        stepIndex: 3,
        lineNumber: 7,
        codeLine: "obs = execute_tool(action)",
        actionSummary: "Observation node: Sandboxed tool executes and returns verified rowset",
        variables: [
          { name: "agent_state", type: "str", value: "OBSERVATION_RECEIVED", hasChanged: true },
          { name: "obs", type: "dict", value: "{'balance_cents': 45000, 'eligible': True}", hasChanged: true }
        ],
        visualCallStack: ["TOOL_SANDBOX"],
        spokenNarration: "The isolated tool sandbox queries the database and returns a verified eligible balance of four hundred fifty dollars.",
        audioDurationSeconds: 5
      },
      {
        stepIndex: 4,
        lineNumber: 9,
        codeLine: "response = synthesize(thought, obs)",
        actionSummary: "Synthesis node: Agent constructs final user-facing response grounded in verified evidence",
        variables: [
          { name: "agent_state", type: "str", value: "COMPLETE", hasChanged: true },
          { name: "response", type: "str", value: "'Customer 401 balance verified: $450.00. Refund approved.'", hasChanged: true }
        ],
        visualCallStack: ["AGENT_SYNTHESIS"],
        spokenNarration: "With verified evidence in hand, the agent constructs a grounded final response and terminates the loop.",
        audioDurationSeconds: 5,
        isTerminal: true
      }
    ]
  }
};

/**
 * Returns a dry run trace by id, with default fallback to rolling average.
 */
export function getDryRunTrace(traceId: string): DryRunTrace {
  return CANONICAL_DRY_RUN_TRACES[traceId] || CANONICAL_DRY_RUN_TRACES["rolling-average-trace"];
}

/**
 * Lists all available dry run trace previews.
 */
export function listAvailableDryRunTraces(): Array<{ id: string; title: string; languageOrStudio: string; totalSteps: number }> {
  return Object.values(CANONICAL_DRY_RUN_TRACES).map((t) => ({
    id: t.id,
    title: t.title,
    languageOrStudio: t.languageOrStudio,
    totalSteps: t.totalSteps
  }));
}

