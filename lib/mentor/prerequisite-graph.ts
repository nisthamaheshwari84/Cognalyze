/**
 * COGNALYZE MENTOR — PREREQUISITE KNOWLEDGE GRAPH
 * Maintains concept dependency trees, detects missing prerequisites,
 * and enables graceful in-place repair without restarting entire curricula.
 */

export interface ConceptPrerequisiteDef {
  id: string;
  name: string;
  prerequisites: string[];
  coreInsight: string;
  diagnosticQuestion: string;
}

export const PREREQUISITE_REGISTRY: Record<string, ConceptPrerequisiteDef> = {
  // Recursion & Algorithms Hierarchy
  call_stack: {
    id: "call_stack",
    name: "Call Stack & Activation Records",
    prerequisites: [],
    coreInsight: "Each function invocation creates a stack frame that pauses until inner calls return.",
    diagnosticQuestion: "When a function calls itself, where does the paused state of the previous call live?"
  },
  recursion: {
    id: "recursion",
    name: "Recursion Fundamentals",
    prerequisites: ["call_stack"],
    coreInsight: "Solving a problem by solving a smaller self-similar instance with a terminating base case.",
    diagnosticQuestion: "What happens if a recursive function does not reach its base case?"
  },
  backtracking: {
    id: "backtracking",
    name: "Backtracking",
    prerequisites: ["recursion", "call_stack"],
    coreInsight: "Exploring choices systematically and undoing the choice when a path fails.",
    diagnosticQuestion: "Why do we have to revert our state change after the recursive call finishes?"
  },
  dfs: {
    id: "dfs",
    name: "Depth-First Search (DFS)",
    prerequisites: ["backtracking", "recursion"],
    coreInsight: "Traversing as deep as possible along each branch before backtracking.",
    diagnosticQuestion: "How do you prevent an infinite cycle in DFS on a cyclic graph?"
  },

  // Binary Search Hierarchy
  sorted_arrays: {
    id: "sorted_arrays",
    name: "Sorted Array Invariant",
    prerequisites: [],
    coreInsight: "Every element to the left is smaller, every element to the right is larger.",
    diagnosticQuestion: "Why can you discard half the search space if an array is sorted?"
  },
  binary_search: {
    id: "binary_search",
    name: "Binary Search",
    prerequisites: ["sorted_arrays"],
    coreInsight: "Eliminating 50% of the candidate space at each step via a monotonic check.",
    diagnosticQuestion: "If arr[mid] < target, which half is guaranteed not to contain the target?"
  },
  monotonic_boundary: {
    id: "monotonic_boundary",
    name: "Monotonic Decision Boundary",
    prerequisites: ["binary_search"],
    coreInsight: "Binary search applies to any predicate that transitions monotonically from FFFF to TTTT.",
    diagnosticQuestion: "Can binary search be used on an unsorted array if an answer space is monotonic?"
  },
  rotated_sorted_array: {
    id: "rotated_sorted_array",
    name: "Search in Rotated Sorted Array",
    prerequisites: ["binary_search", "monotonic_boundary"],
    coreInsight: "At least one half of a rotated sorted array is always strictly sorted.",
    diagnosticQuestion: "How do you determine which half of a rotated array is normal sorted order?"
  },

  // Distributed Systems Hierarchy
  stateless_api: {
    id: "stateless_api",
    name: "Stateless API Architecture",
    prerequisites: [],
    coreInsight: "Any server can handle any request because session state is not pinned to memory.",
    diagnosticQuestion: "Why does horizontal scaling require stateless backend servers?"
  },
  load_balancing: {
    id: "load_balancing",
    name: "Load Balancing",
    prerequisites: ["stateless_api"],
    coreInsight: "Distributing incoming traffic across multiple healthy backend nodes.",
    diagnosticQuestion: "What happens if a load balancer routes traffic to an unhealthy server?"
  },
  read_replicas: {
    id: "read_replicas",
    name: "Database Read Replication",
    prerequisites: ["stateless_api"],
    coreInsight: "Duplicating read data across secondary nodes to scale read throughput.",
    diagnosticQuestion: "If we add 5 read replicas, does our write capacity increase?"
  },
  sharding: {
    id: "sharding",
    name: "Database Sharding (Horizontal Partitioning)",
    prerequisites: ["read_replicas"],
    coreInsight: "Splitting a single dataset across multiple database instances based on a shard key to scale write capacity.",
    diagnosticQuestion: "What is the trade-off when running queries that do not include the shard key?"
  },

  // Deep Learning & Transformers Hierarchy
  vector_embeddings: {
    id: "vector_embeddings",
    name: "Vector Embeddings & Dot Product",
    prerequisites: [],
    coreInsight: "Semantic similarity mapped to geometric alignment via dot product cosine similarity.",
    diagnosticQuestion: "What does a high dot product between two normalized vectors indicate?"
  },
  self_attention: {
    id: "self_attention",
    name: "Self-Attention Mechanism (Q, K, V)",
    prerequisites: ["vector_embeddings"],
    coreInsight: "Queries score Keys to form a softmax distribution that weights Values.",
    diagnosticQuestion: "Why do we divide QK^T by the square root of d_k?"
  },
  transformers: {
    id: "transformers",
    name: "Transformer Architecture",
    prerequisites: ["self_attention"],
    coreInsight: "Stacking multi-head attention and feed-forward blocks with residual connections.",
    diagnosticQuestion: "Why are positional encodings required in transformers but not in RNNs?"
  }
};

export interface PrerequisiteCheckResult {
  hasMissingPrerequisite: boolean;
  missingPrerequisiteId?: string;
  missingPrerequisiteName?: string;
  rationale?: string;
  suggestedAction?: "REVISIT_PREREQUISITE" | "PROBE";
}

/**
 * Checks if the student has demonstrated all prerequisite foundations for the target concept.
 */
export function checkPrerequisites(
  targetConceptId: string,
  demonstratedConcepts: string[],
  struggleKeywords: string[] = []
): PrerequisiteCheckResult {
  const normTarget = targetConceptId.toLowerCase().replace(/[-\s]/g, "_");
  const def = PREREQUISITE_REGISTRY[normTarget];

  if (!def || !def.prerequisites.length) {
    return { hasMissingPrerequisite: false };
  }

  const demonstratedSet = new Set(
    demonstratedConcepts.map((c) => c.toLowerCase().replace(/[-\s]/g, "_"))
  );

  // Check each prerequisite
  for (const prereqId of def.prerequisites) {
    const prereqDef = PREREQUISITE_REGISTRY[prereqId];
    const isDemonstrated = demonstratedSet.has(prereqId);

    // If not demonstrated, or student specifically shows confusion relevant to this prereq
    const showsConfusion = struggleKeywords.some((w) =>
      prereqDef?.name.toLowerCase().includes(w.toLowerCase()) ||
      prereqDef?.coreInsight.toLowerCase().includes(w.toLowerCase())
    );

    if (!isDemonstrated || showsConfusion) {
      return {
        hasMissingPrerequisite: true,
        missingPrerequisiteId: prereqId,
        missingPrerequisiteName: prereqDef?.name || prereqId,
        rationale: `Foundational prerequisite "${prereqDef?.name || prereqId}" is not yet calibrated or actively confused.`,
        suggestedAction: "REVISIT_PREREQUISITE"
      };
    }
  }

  return { hasMissingPrerequisite: false };
}

/**
 * Returns a warm, natural explanation when stepping back to a prerequisite.
 */
export function formatPrerequisiteSteppingMessage(
  prerequisiteName: string,
  targetConceptName: string,
  language: string
): string {
  if (language === "hinglish") {
    return `Ek second rukte hain. Aage badhne se pehle, mujhe lagta hai issue ek level neeche "${prerequisiteName}" mein hai. Isko 2 minute mein clear karte hain, phir ${targetConceptName} bohot naturally samajh aayega.`;
  }
  if (language === "hi") {
    return `आगे बढ़ने से पहले, मुझे लगता है कि आधारभूत अवधारणा "${prerequisiteName}" को स्पष्ट करना आवश्यक है। इसे समझ लेते हैं, फिर ${targetConceptName} आसानी से स्पष्ट हो जाएगा।`;
  }
  return `Before we continue, I think the issue is actually one level below this in "${prerequisiteName}". Let's quickly clear that up, and ${targetConceptName} will make total sense.`;
}
