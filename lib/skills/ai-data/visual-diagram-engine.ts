/**
 * lib/skills/ai-data/visual-diagram-engine.ts
 * 
 * Interactive Visual Learning & Deep Architectural Diagram Engine.
 * Client-safe, pure TypeScript visual simulations for:
 * 1. CPython Bytecode & AST Type Definitions
 * 2. Memory Pointer & Reference Aliasing Model (Stack frames vs Heap PyObject pointers)
 * 3. NumPy Broadcasting Matrix Lab (Shape alignment, stride stretching, ValueError diagnosis)
 * 4. SQL Relational Join Visualizer (Deterministic relational algebra matching, query plan)
 * 5. Gradient Descent Loss Surface Visualizer (2D/3D loss curves, alpha learning rate divergence)
 * 6. RAG Pipeline Flow Visualizer (Chunking with overlap, 2D vector space, top-k cosine similarity)
 */

// ── 1. CPYTHON BYTECODE & AST TYPES ──────────────────────────────────────────

export interface CPythonInstruction {
  opname: string;
  argval: string;
  offset: number;
  startsLine?: number | null;
  description: string;
}

export interface CPythonAstNode {
  id: string;
  type: string;
  lineno: number;
  colOffset: number;
  children: CPythonAstNode[];
  summary: string;
}

export interface CPythonReflectionResult {
  success: boolean;
  code: string;
  tokens: Array<{ type: string; string: string; start: [number, number]; end: [number, number] }>;
  ast: CPythonAstNode | null;
  bytecode: CPythonInstruction[];
  stackTraceSteps: Array<{
    step: number;
    instruction: CPythonInstruction;
    stack: string[];
    explanation: string;
  }>;
  error?: string;
}

// ── 2. MEMORY POINTER & REFERENCE ALIASING MODEL ─────────────────────────────

export interface MemoryPointerState {
  stepIndex: number;
  description: string;
  stackVariables: Array<{ name: string; targetAddress: string; scope: string }>;
  heapObjects: Array<{
    address: string;
    type: "int" | "str" | "list" | "dict" | "custom";
    valueString: string;
    refCount: number;
    isMutable: boolean;
    isGarbageCollected?: boolean;
  }>;
  aliasingWarning?: string;
}

export function getMemoryAliasingScenario(scenarioType: "list_aliasing" | "string_immutability" | "shallow_vs_deep_copy" | "cycle"): MemoryPointerState[] {
  if (scenarioType === "list_aliasing") {
    return [
      {
        stepIndex: 1,
        description: "a = [1, 2] -> A new PyListObject is allocated at 0x10A. Variable 'a' in local stack points to 0x10A.",
        stackVariables: [{ name: "a", targetAddress: "0x10A", scope: "locals()" }],
        heapObjects: [{ address: "0x10A", type: "list", valueString: "[1, 2]", refCount: 1, isMutable: true }]
      },
      {
        stepIndex: 2,
        description: "b = a -> Variable 'b' copies the POINTER address 0x10A, NOT the list values! Both point to the exact same memory.",
        stackVariables: [
          { name: "a", targetAddress: "0x10A", scope: "locals()" },
          { name: "b", targetAddress: "0x10A", scope: "locals()" }
        ],
        heapObjects: [{ address: "0x10A", type: "list", valueString: "[1, 2]", refCount: 2, isMutable: true }],
        aliasingWarning: "Aliasing active: Mutating 'b' will silently mutate 'a' without any warning!"
      },
      {
        stepIndex: 3,
        description: "b.append(3) -> Mutates the PyListObject in-place at 0x10A. Because 'a' references 0x10A, a is now also [1, 2, 3]!",
        stackVariables: [
          { name: "a", targetAddress: "0x10A", scope: "locals()" },
          { name: "b", targetAddress: "0x10A", scope: "locals()" }
        ],
        heapObjects: [{ address: "0x10A", type: "list", valueString: "[1, 2, 3]", refCount: 2, isMutable: true }],
        aliasingWarning: "In-place mutation: id(a) == id(b) == 0x10A. Memory address unchanged."
      },
      {
        stepIndex: 4,
        description: "a = a + [4] -> The '+' operator creates a BRAND NEW PyListObject at 0x20B! 'a' now points to 0x20B; 'b' stays pointing to 0x10A.",
        stackVariables: [
          { name: "a", targetAddress: "0x20B", scope: "locals()" },
          { name: "b", targetAddress: "0x10A", scope: "locals()" }
        ],
        heapObjects: [
          { address: "0x10A", type: "list", valueString: "[1, 2, 3]", refCount: 1, isMutable: true },
          { address: "0x20B", type: "list", valueString: "[1, 2, 3, 4]", refCount: 1, isMutable: true }
        ]
      }
    ];
  }

  // String immutability
  return [
    {
      stepIndex: 1,
      description: "s1 = 'hello' -> PyUnicodeObject created at 0x501 with refCount=1.",
      stackVariables: [{ name: "s1", targetAddress: "0x501", scope: "locals()" }],
      heapObjects: [{ address: "0x501", type: "str", valueString: "'hello'", refCount: 1, isMutable: false }]
    },
    {
      stepIndex: 2,
      description: "s2 = s1 -> 's2' references 0x501. refCount becomes 2.",
      stackVariables: [
        { name: "s1", targetAddress: "0x501", scope: "locals()" },
        { name: "s2", targetAddress: "0x501", scope: "locals()" }
      ],
      heapObjects: [{ address: "0x501", type: "str", valueString: "'hello'", refCount: 2, isMutable: false }]
    },
    {
      stepIndex: 3,
      description: "s1 += ' world' -> Strings are IMMUTABLE. CPython allocates new PyUnicodeObject at 0x602. s2 remains pointing to 0x501.",
      stackVariables: [
        { name: "s1", targetAddress: "0x602", scope: "locals()" },
        { name: "s2", targetAddress: "0x501", scope: "locals()" }
      ],
      heapObjects: [
        { address: "0x501", type: "str", valueString: "'hello'", refCount: 1, isMutable: false },
        { address: "0x602", type: "str", valueString: "'hello world'", refCount: 1, isMutable: false }
      ]
    }
  ];
}

// ── 3. NUMPY BROADCASTING MATRIX LAB ─────────────────────────────────────────

export interface BroadcastingAlignmentDimension {
  axis: number;
  dimA: number;
  dimB: number;
  resultDim: number;
  isCompatible: boolean;
  stretchedTarget: "none" | "A" | "B";
  reason: string;
}

export interface BroadcastingEvaluation {
  shapeA: number[];
  shapeB: number[];
  isBroadcastable: boolean;
  resultShape: number[] | null;
  alignment: BroadcastingAlignmentDimension[];
  errorMessage?: string;
  explanation: string;
}

export function evaluateNumpyBroadcasting(shapeA: number[], shapeB: number[]): BroadcastingEvaluation {
  const maxLen = Math.max(shapeA.length, shapeB.length);
  const padA = Array(maxLen - shapeA.length).fill(1).concat(shapeA);
  const padB = Array(maxLen - shapeB.length).fill(1).concat(shapeB);

  const alignment: BroadcastingAlignmentDimension[] = [];
  const resultShape: number[] = [];
  let isBroadcastable = true;
  let firstFailAxis = -1;

  for (let i = 0; i < maxLen; i++) {
    const dimA = padA[i];
    const dimB = padB[i];
    const axis = i - maxLen;

    if (dimA === dimB) {
      alignment.push({
        axis,
        dimA,
        dimB,
        resultDim: dimA,
        isCompatible: true,
        stretchedTarget: "none",
        reason: `Equal dimensions (${dimA} == ${dimB}). No stride stretching needed.`
      });
      resultShape.push(dimA);
    } else if (dimA === 1) {
      alignment.push({
        axis,
        dimA,
        dimB,
        resultDim: dimB,
        isCompatible: true,
        stretchedTarget: "A",
        reason: `Dimension 1 in Array A is virtually stretched to ${dimB} via 0-byte stride replication.`
      });
      resultShape.push(dimB);
    } else if (dimB === 1) {
      alignment.push({
        axis,
        dimA,
        dimB,
        resultDim: dimA,
        isCompatible: true,
        stretchedTarget: "B",
        reason: `Dimension 1 in Array B is virtually stretched to ${dimA} via 0-byte stride replication.`
      });
      resultShape.push(dimA);
    } else {
      isBroadcastable = false;
      if (firstFailAxis === -1) firstFailAxis = axis;
      alignment.push({
        axis,
        dimA,
        dimB,
        resultDim: 0,
        isCompatible: false,
        stretchedTarget: "none",
        reason: `CONFLICT: ${dimA} != ${dimB} and neither dimension is 1.`
      });
    }
  }

  if (!isBroadcastable) {
    const shapeAStr = `(${shapeA.join(",")}${shapeA.length === 1 ? "," : ""})`;
    const shapeBStr = `(${shapeB.join(",")}${shapeB.length === 1 ? "," : ""})`;
    return {
      shapeA,
      shapeB,
      isBroadcastable: false,
      resultShape: null,
      alignment,
      errorMessage: `ValueError: operands could not be broadcast together with shapes ${shapeAStr} ${shapeBStr}`,
      explanation: `Broadcasting failed at trailing axis ${firstFailAxis}. NumPy checks dimensions from right to left: two dimensions are compatible only if they are equal, or one of them is 1.`
    };
  }

  return {
    shapeA,
    shapeB,
    isBroadcastable: true,
    resultShape,
    alignment,
    explanation: `Compatible! Arrays ${JSON.stringify(shapeA)} and ${JSON.stringify(shapeB)} broadcast into ${JSON.stringify(resultShape)} with zero memory copies using stride manipulation.`
  };
}

// ── 4. SQL RELATIONAL JOIN VISUALIZER ─────────────────────────────────────────

export interface SqlJoinEvaluation {
  joinType: "INNER" | "LEFT" | "RIGHT" | "FULL" | "CROSS";
  records: Array<Record<string, any>>;
  totalRows: number;
  matchedCount: number;
  unmatchedLeftCount: number;
  unmatchedRightCount: number;
  queryPlan: string[];
  explanation: string;
}

const EMPLOYEES_SEED = [
  { id: 1, name: "Alice Chen", department_id: 10 },
  { id: 2, name: "Bob Kumar", department_id: 20 },
  { id: 3, name: "Charlie Roy", department_id: 10 },
  { id: 4, name: "Devon Vance", department_id: 99 } // Unmatched employee
];

const DEPARTMENTS_SEED = [
  { id: 10, name: "Engineering", budget: 500000 },
  { id: 20, name: "Data Platform", budget: 400000 },
  { id: 30, name: "Talent Ops", budget: 150000 } // Unmatched department
];

export function evaluateSqlJoinVisualizer(joinType: "INNER" | "LEFT" | "RIGHT" | "FULL" | "CROSS"): SqlJoinEvaluation {
  const records: Array<Record<string, any>> = [];
  let matchedCount = 0;
  let unmatchedLeftCount = 0;
  let unmatchedRightCount = 0;

  if (joinType === "INNER") {
    for (const e of EMPLOYEES_SEED) {
      const d = DEPARTMENTS_SEED.find(dept => dept.id === e.department_id);
      if (d) {
        records.push({ emp_id: e.id, employee: e.name, dept_id: d.id, department: d.name, budget: d.budget });
        matchedCount++;
      }
    }
  } else if (joinType === "LEFT") {
    for (const e of EMPLOYEES_SEED) {
      const d = DEPARTMENTS_SEED.find(dept => dept.id === e.department_id);
      if (d) {
        records.push({ emp_id: e.id, employee: e.name, dept_id: d.id, department: d.name, budget: d.budget });
        matchedCount++;
      } else {
        records.push({ emp_id: e.id, employee: e.name, dept_id: null, department: null, budget: null });
        unmatchedLeftCount++;
      }
    }
  } else if (joinType === "RIGHT") {
    for (const d of DEPARTMENTS_SEED) {
      const emps = EMPLOYEES_SEED.filter(e => e.department_id === d.id);
      if (emps.length > 0) {
        for (const e of emps) {
          records.push({ emp_id: e.id, employee: e.name, dept_id: d.id, department: d.name, budget: d.budget });
          matchedCount++;
        }
      } else {
        records.push({ emp_id: null, employee: null, dept_id: d.id, department: d.name, budget: d.budget });
        unmatchedRightCount++;
      }
    }
  } else if (joinType === "FULL") {
    // Process left table
    const matchedDeptIds = new Set<number>();
    for (const e of EMPLOYEES_SEED) {
      const d = DEPARTMENTS_SEED.find(dept => dept.id === e.department_id);
      if (d) {
        records.push({ emp_id: e.id, employee: e.name, dept_id: d.id, department: d.name, budget: d.budget });
        matchedCount++;
        matchedDeptIds.add(d.id);
      } else {
        records.push({ emp_id: e.id, employee: e.name, dept_id: null, department: null, budget: null });
        unmatchedLeftCount++;
      }
    }
    // Add unmatched right records
    for (const d of DEPARTMENTS_SEED) {
      if (!matchedDeptIds.has(d.id)) {
        records.push({ emp_id: null, employee: null, dept_id: d.id, department: d.name, budget: d.budget });
        unmatchedRightCount++;
      }
    }
  } else if (joinType === "CROSS") {
    for (const e of EMPLOYEES_SEED) {
      for (const d of DEPARTMENTS_SEED) {
        records.push({ emp_id: e.id, employee: e.name, dept_id: d.id, department: d.name, budget: d.budget });
        if (e.department_id === d.id) matchedCount++;
      }
    }
  }

  const explanations: Record<string, string> = {
    INNER: "Only returns rows with matching keys on BOTH sides (department_id == id). Unmatched employee Devon (dept 99) and unmatched Talent Ops (dept 30) are eliminated.",
    LEFT: "Preserves ALL employees from the Left table. Devon has no matching department, so dept columns are padded with NULL.",
    RIGHT: "Preserves ALL departments from the Right table. Unmatched Talent Ops appears with emp_id=NULL.",
    FULL: "Preserves ALL rows from BOTH sides. Both Devon and Talent Ops appear with NULL fillers where data is missing.",
    CROSS: `Cartesian product: pairs every employee with every department (${EMPLOYEES_SEED.length} × ${DEPARTMENTS_SEED.length} = ${records.length} total rows).`
  };

  const queryPlan = [
    "SCAN employees e",
    `SEARCH departments d USING INTEGER PRIMARY KEY (rowid=?) -- ${joinType} JOIN optimization`
  ];

  return {
    joinType,
    records,
    totalRows: records.length,
    matchedCount,
    unmatchedLeftCount,
    unmatchedRightCount,
    queryPlan,
    explanation: explanations[joinType] || "Executed SQL Relational Join."
  };
}

// ── 5. GRADIENT DESCENT LOSS SURFACE OPTIMIZER ───────────────────────────────

export interface GradientDescentStep {
  step: number;
  theta: number;
  gradient: number;
  loss: number;
  change: number;
}

export interface GradientDescentSimulation {
  learningRate: number;
  initialTheta: number;
  status: "CONVERGED" | "OSCILLATING" | "DIVERGED" | "PROGRESSING";
  steps: GradientDescentStep[];
  finalLoss: number;
  optimalTheta: number;
  explanation: string;
}

export function simulateGradientDescent(learningRate: number, initialTheta: number = -4.0, maxSteps: number = 20): GradientDescentSimulation {
  const steps: GradientDescentStep[] = [];
  let currentTheta = initialTheta;
  let status: GradientDescentSimulation["status"] = "PROGRESSING";

  for (let i = 0; i < maxSteps; i++) {
    const loss = Math.pow(currentTheta - 3, 2) + 1;
    const gradient = 2 * (currentTheta - 3);

    if (Math.abs(loss) > 1e6 || isNaN(loss)) {
      status = "DIVERGED";
      break;
    }

    const change = learningRate * gradient;
    steps.push({
      step: i,
      theta: Math.round(currentTheta * 1000) / 1000,
      gradient: Math.round(gradient * 1000) / 1000,
      loss: Math.round(loss * 1000) / 1000,
      change: Math.round(change * 1000) / 1000
    });

    if (Math.abs(gradient) < 0.001) {
      status = "CONVERGED";
      break;
    }

    currentTheta = currentTheta - change;
  }

  if (status !== "DIVERGED" && steps.length >= 2) {
    const last = steps[steps.length - 1];
    const prev = steps[steps.length - 2];
    if (Math.abs(last.loss - prev.loss) < 0.01 && last.loss <= 1.05) {
      status = "CONVERGED";
    } else if (last.loss > prev.loss && last.loss > 10) {
      status = "DIVERGED";
    } else if (Math.abs(last.theta - prev.theta) > 3) {
      status = "OSCILLATING";
    }
  }

  let explanation = "";
  if (status === "CONVERGED") {
    explanation = `Optimal convergence achieved! With learning rate alpha = ${learningRate}, the model smoothly descends the quadratic bowl to theta = 3.00 with minimum loss J = 1.0.`;
  } else if (status === "DIVERGED") {
    explanation = `DIVERGENCE / EXPLODING GRADIENT! Learning rate alpha = ${learningRate} is too large. Each gradient step overshoots the minimum and lands further up the opposite side of the bowl.`;
  } else if (status === "OSCILLATING") {
    explanation = `Heavy oscillation detected. Alpha = ${learningRate} bounces aggressively between opposite walls of the loss surface without settling into the minimum.`;
  } else {
    explanation = `Slow convergence. Learning rate alpha = ${learningRate} is too conservative; requires hundreds of iterations to reach the optimum.`;
  }

  return {
    learningRate,
    initialTheta,
    status,
    steps,
    finalLoss: steps.length > 0 ? steps[steps.length - 1].loss : 0,
    optimalTheta: 3.0,
    explanation
  };
}

// ── 6. RAG PIPELINE FLOW SIMULATOR ──────────────────────────────────────────

export interface RagChunk {
  chunkId: string;
  text: string;
  startChar: number;
  endChar: number;
  embeddingCoordinates: [number, number];
  cosineSimilarity: number;
  isRetrieved: boolean;
}

export interface RagPipelineSimulation {
  rawTextLength: number;
  chunkSize: number;
  chunkOverlap: number;
  totalChunks: number;
  topK: number;
  query: string;
  chunks: RagChunk[];
  retrievedContextText: string;
  synthesizedPrompt: string;
  generatedAnswer: string;
  explanation: string;
}

export function simulateRagPipelineFlow(params: {
  rawDocument?: string;
  chunkSize?: number;
  chunkOverlap?: number;
  query?: string;
  topK?: number;
}): RagPipelineSimulation {
  const {
    rawDocument = "Cognalyze Evidence Engine verifies genuine student competence. Unlike traditional mock interviews that rely on self-reported claims, Cognalyze captures real-time code executions, execution traces, and Socratic answers. Students build a verified Student DNA portfolio with verifiable proof cards for recruiters.",
    chunkSize = 120,
    chunkOverlap = 30,
    query = "How does Cognalyze prove student skills without relying on resumes?",
    topK = 2
  } = params;

  const chunks: RagChunk[] = [];
  let start = 0;
  let counter = 1;

  while (start < rawDocument.length) {
    const end = Math.min(rawDocument.length, start + chunkSize);
    const chunkText = rawDocument.slice(start, end).trim();

    const hash = chunkText.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
    const xCoord = Math.round((Math.sin(hash) * 40 + 50) * 10) / 10;
    const yCoord = Math.round((Math.cos(hash) * 40 + 50) * 10) / 10;

    const queryTokens = query.toLowerCase().split(/\W+/).filter(Boolean);
    const chunkTokens = chunkText.toLowerCase().split(/\W+/).filter(Boolean);
    const overlapMatches = queryTokens.filter(t => chunkTokens.includes(t));
    const similarity = Math.round((0.35 + (overlapMatches.length / (queryTokens.length || 1)) * 0.6) * 100) / 100;

    chunks.push({
      chunkId: `chunk_${counter++}`,
      text: chunkText,
      startChar: start,
      endChar: end,
      embeddingCoordinates: [xCoord, yCoord],
      cosineSimilarity: Math.min(0.98, similarity),
      isRetrieved: false
    });

    if (end >= rawDocument.length) break;
    start += Math.max(20, chunkSize - chunkOverlap);
  }

  const sortedChunks = [...chunks].sort((a, b) => b.cosineSimilarity - a.cosineSimilarity);
  const retrievedIds = new Set(sortedChunks.slice(0, topK).map(c => c.chunkId));

  chunks.forEach(c => {
    c.isRetrieved = retrievedIds.has(c.chunkId);
  });

  const retrievedChunks = chunks.filter(c => c.isRetrieved);
  const retrievedContext = retrievedChunks.map(c => `[${c.chunkId}]: "${c.text}"`).join("\n\n");

  const synthesizedPrompt = `SYSTEM: You are a grounded AI assistant. Answer strictly based on the provided context.\n\nCONTEXT:\n${retrievedContext}\n\nUSER QUESTION: ${query}\n\nANSWER:`;

  const generatedAnswer = `Cognalyze proves competence through its Evidence Engine and Student DNA portfolio, capturing real-time code executions, execution traces, and Socratic answers instead of self-reported resume claims [chunk_1].`;

  return {
    rawTextLength: rawDocument.length,
    chunkSize,
    chunkOverlap,
    totalChunks: chunks.length,
    topK,
    query,
    chunks,
    retrievedContextText: retrievedContext,
    synthesizedPrompt,
    generatedAnswer,
    explanation: `RAG Pipeline partitioned ${rawDocument.length} characters into ${chunks.length} chunks (stride=${chunkSize - chunkOverlap}). Vector space cosine similarity identified the top-${topK} most relevant chunks to ground the LLM generation and eliminate hallucinations.`
  };
}
