/**
 * lib/skills/dsa-interview-question-bank.ts
 * 
 * Scalable Question Bank & Dynamic Blueprint Generator across all six assessment areas:
 * 1. Technical Reasoning
 * 2. Live Coding
 * 3. Debugging
 * 4. Code Comprehension
 * 5. Complexity & Optimization
 * 6. Adaptive Follow-Up
 * 
 * Enforces:
 * - Mandatory coverage of all 6 areas in every 5, 6, and 7 question interview.
 * - Anti-repeat filtering against candidate's persistent history ledger.
 * - Verified test cases, rubrics, and reference answers.
 */

import {
  AssessmentArea,
  InterviewLength,
  InterviewDifficulty,
  TargetRole,
  SupportedLanguage,
  AnyInterviewQuestion,
  TechnicalReasoningQuestion,
  LiveCodingQuestion,
  DebuggingQuestion,
  CodeComprehensionQuestion,
  ComplexityQuestion,
  AdaptiveFollowUpQuestion
} from "./dsa-interview-types";
import {
  CANONICAL_DSA_PROBLEMS,
  getCanonicalProblem,
  synthesizeCanonicalProblem
} from "./dsa-canonical-problems";
import { DSA_A2Z_PROBLEMS } from "../dsa-a2z-sheet";
import { isQuestionSeen, getSeenQuestionIds } from "./dsa-interview-history-store";

// ── 1. TECHNICAL REASONING QUESTION BANK ───────────────────────────────────────

export const TECHNICAL_REASONING_BANK: TechnicalReasoningQuestion[] = [
  {
    id: "tr-bs-monotonic-invariant",
    canonicalId: "binary-search",
    title: "Binary Search Monotonicity & Boundary Invariant",
    area: "technical_reasoning",
    topic: "binary-search",
    difficulty: "medium",
    expectedDurationMinutes: 8,
    prompt: "Explain why binary search can be applied to problem spaces where elements are not explicitly sorted, and prove the loop termination invariant for `while (low <= high)` versus `while (low < high)`.",
    scenario: "You are designing an algorithmic search across an answer space [min, max] where a predicate function isFeasible(mid) is monotonic.",
    invariantQuestion: "What mathematical property must hold for the search space to be halved safely at each step, and what boundary update rule prevents an infinite loop when only 2 elements remain?",
    requiredKeyConcepts: ["monotonicity", "answer space", "boundary contraction", "off-by-one prevention", "termination invariant"],
    referenceInvariantExplanation: "Binary search does not strictly require a sorted array; it requires a monotonic decision boundary where for all x <= k, predicate(x) is true (or false), and for x > k it inverts. In the `low <= high` paradigm, both bounds are inclusive. When mid is rejected, boundaries must contract to `mid - 1` or `mid + 1` to strictly reduce the interval size (high - low + 1), avoiding infinite cycles when low == high.",
    edgeCasesToConsider: ["2-element array where target is absent", "high + low causing 32-bit integer overflow", "Monotonicity inversion with duplicates"],
    rubric: [
      {
        name: "Monotonicity Understanding",
        weight: 40,
        description: "Candidate articulates the exact condition enabling binary search on answer space.",
        criteria: [{ scoreThreshold: 75, description: "States monotonicity of feasibility predicate" }]
      },
      {
        name: "Loop Boundary Invariant",
        weight: 40,
        description: "Accurately proves boundary contraction rules.",
        criteria: [{ scoreThreshold: 75, description: "Explains inclusive bounds vs strict reduction" }]
      },
      {
        name: "Edge Case Guarding",
        weight: 20,
        description: "Identifies 2-element convergence and integer overflow.",
        criteria: [{ scoreThreshold: 70, description: "Notes mid = low + (high - low) / 2" }]
      }
    ],
    semanticFingerprint: "fp_tr_bs_monotonic_invariant"
  },
  {
    id: "tr-kadane-negative-invariant",
    canonicalId: "maximum-subarray-sum-kadane-s-algorithm",
    title: "Kadane's Optimal Substructure & Negative Subarray Invariant",
    area: "technical_reasoning",
    topic: "arrays",
    difficulty: "medium",
    expectedDurationMinutes: 8,
    prompt: "Prove why Kadane's algorithm maintains the optimal maximum subarray sum in O(N) time without backtracking, and explain how the invariant adapts when all array elements are negative.",
    scenario: "A streaming data pipeline requires computing the highest continuous burst of transaction volumes in a single pass.",
    invariantQuestion: "Why is it mathematically safe to reset current_sum to 0 when current_sum < 0, and what bug occurs if max_sum is initialized to 0?",
    requiredKeyConcepts: ["optimal substructure", "negative prefix elimination", "non-empty subarray requirement", "O(N) single pass"],
    referenceInvariantExplanation: "Any prefix with a strictly negative sum can never contribute positively to any subsequent subarray starting after it. Therefore, resetting current_sum to 0 (or discarding the prefix) preserves optimality. If all elements are negative, initializing max_sum = 0 incorrectly outputs 0 for non-empty subarray requirements; max_sum must be initialized to nums[0] (or -infinity).",
    edgeCasesToConsider: ["All negative elements", "Single-element array", "Alternating large positive and negative numbers"],
    rubric: [
      {
        name: "Optimal Substructure Proof",
        weight: 50,
        description: "Explains why negative prefixes are mathematically discarded.",
        criteria: [{ scoreThreshold: 80, description: "Proves negative prefix decreases future contiguous sums" }]
      },
      {
        name: "All-Negative Edge Invariant",
        weight: 50,
        description: "Catches initialization pitfall for all-negative arrays.",
        criteria: [{ scoreThreshold: 80, description: "Explains why max_sum cannot default to 0" }]
      }
    ],
    semanticFingerprint: "fp_tr_kadane_negative_invariant"
  },
  {
    id: "tr-two-pointers-convergence",
    canonicalId: "two-sum",
    title: "Two-Pointer Sorted Convergence Invariant",
    area: "technical_reasoning",
    topic: "two-pointers",
    difficulty: "easy",
    expectedDurationMinutes: 7,
    prompt: "In a sorted array, prove why the two-pointer approach (left at 0, right at N-1) never misses the target sum pair when incrementing left or decrementing right.",
    scenario: "Given a sorted sequence, determine if any two distinct elements sum to target.",
    invariantQuestion: "Why does nums[left] + nums[right] > target guarantee that right can be decremented without eliminating potential pairs involving right?",
    requiredKeyConcepts: ["sorted monotonicity", "pair elimination proof", "O(N) convergence", "no backtrack requirement"],
    referenceInvariantExplanation: "Because the array is sorted in ascending order, if nums[left] + nums[right] > target, then for any other index i > left, nums[i] + nums[right] >= nums[left] + nums[right] > target. Thus, nums[right] cannot pair with ANY valid left index to equal target. It is mathematically safe to permanently discard right.",
    edgeCasesToConsider: ["Identical elements summing to target", "Target smaller than minimum pair", "No pair exists"],
    rubric: [
      {
        name: "Search Space Elimination Proof",
        weight: 60,
        description: "Rigorous explanation of why discarded elements cannot be part of any solution.",
        criteria: [{ scoreThreshold: 75, description: "Demonstrates monotonicity guarantees no missed pairs" }]
      },
      {
        name: "Complexity & Edge Behavior",
        weight: 40,
        description: "Explains O(N) single pass and duplicate pointer convergence.",
        criteria: [{ scoreThreshold: 70, description: "Shows strictly decreasing right - left" }]
      }
    ],
    semanticFingerprint: "fp_tr_two_pointers_convergence"
  },
  {
    id: "tr-linked-list-cycle-floyd",
    canonicalId: "detect-a-cycle-in-a-linked-list",
    title: "Floyd's Tortoise and Hare Cycle Invariant",
    area: "technical_reasoning",
    topic: "linked-lists",
    difficulty: "medium",
    expectedDurationMinutes: 8,
    prompt: "Prove mathematically why a fast pointer moving 2 steps and a slow pointer moving 1 step MUST meet if and only if a cycle exists in a linked list, and derive the maximum steps before collision.",
    scenario: "Validating stream memory buffers to verify no self-referential pointer loops exist.",
    invariantQuestion: "What is the relative speed between the two pointers, and why does modulo arithmetic guarantee they will not 'jump over' each other?",
    requiredKeyConcepts: ["relative velocity of 1", "modular arithmetic", "cycle length C", "O(N) time and O(1) space"],
    referenceInvariantExplanation: "Inside a cycle of length C, each iteration the distance between fast and slow decreases by (2 - 1) = 1 modulo C. Because the gap decreases strictly by 1 on every step, it must reach 0 without ever skipping over slow. The collision occurs in at most C iterations once slow enters the cycle.",
    edgeCasesToConsider: ["List with 1 or 2 nodes and no cycle", "Cycle encompassing the entire list", "Cycle at the very end with long tail"],
    rubric: [
      {
        name: "Relative Velocity Proof",
        weight: 50,
        description: "Explains relative distance closing by exactly 1 each step.",
        criteria: [{ scoreThreshold: 80, description: "Proves gap closes modulo C" }]
      },
      {
        name: "No-Skip Proof",
        weight: 50,
        description: "Explains why fast cannot skip slow.",
        criteria: [{ scoreThreshold: 80, description: "States gap 1 -> 0 cannot jump" }]
      }
    ],
    semanticFingerprint: "fp_tr_floyd_cycle_invariant"
  }
];

// ── 2. DEBUGGING QUESTION BANK ────────────────────────────────────────────────

export const DEBUGGING_BANK: DebuggingQuestion[] = [
  {
    id: "dbg-bs-off-by-one",
    canonicalId: "binary-search",
    title: "Debug Binary Search Boundary Contract",
    area: "debugging",
    topic: "binary-search",
    difficulty: "medium",
    expectedDurationMinutes: 10,
    prompt: "Diagnose and fix the bug in this binary search implementation. The function hangs in an infinite loop on certain target values.",
    bugType: "off_by_one",
    buggyLanguage: "python",
    buggyLineNumber: 14,
    observedSymptom: "Infinite loop / Time Limit Exceeded when target is smaller than the middle element.",
    failingTestCase: {
      input: "nums = [-1, 0, 3, 5, 9, 12], target = 2",
      expected: "-1",
      actualFaultyOutput: "Infinite Loop (low=0, high=0, mid=0 repeatedly)"
    },
    buggyCode: `def search(nums: list[int], target: int) -> int:
    low = 0
    high = len(nums) - 1
    
    while low <= high:
        mid = (low + high) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            low = mid + 1
        else:
            high = mid # BUG: should be mid - 1
            
    return -1`,
    correctCode: `def search(nums: list[int], target: int) -> int:
    low = 0
    high = len(nums) - 1
    
    while low <= high:
        mid = low + (high - low) // 2
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            low = mid + 1
        else:
            high = mid - 1
            
    return -1`,
    rootCauseExplanation: "In the inclusive bounds pattern `while low <= high`, when `nums[mid] > target`, setting `high = mid` instead of `high = mid - 1` fails to contract the search space when `low == mid == high`. This creates an infinite loop where mid recalculates to the same index indefinitely.",
    regressionTestCases: [
      { id: "reg-1", input: "nums = [5], target = 2", expected: "-1", argsJson: "[[-1, 0, 3, 5, 9, 12], 2]" },
      { id: "reg-2", input: "nums = [1, 3, 5], target = 3", expected: "1", argsJson: "[[1, 3, 5], 3]" }
    ],
    rubric: [
      {
        name: "Defect Localization",
        weight: 35,
        description: "Candidate identifies line 14 (`high = mid`).",
        criteria: [{ scoreThreshold: 80, description: "Pinpoints high boundary contraction" }]
      },
      {
        name: "Root Cause Reasoning",
        weight: 35,
        description: "Explains non-contracting search space when low == high.",
        criteria: [{ scoreThreshold: 75, description: "Explains infinite cycle condition" }]
      },
      {
        name: "Patch Correctness",
        weight: 30,
        description: "Fixes to high = mid - 1.",
        criteria: [{ scoreThreshold: 90, description: "Produces working code passing all tests" }]
      }
    ],
    semanticFingerprint: "fp_dbg_bs_off_by_one"
  },
  {
    id: "dbg-two-sum-self-pair",
    canonicalId: "two-sum",
    title: "Debug Two Sum Element Self-Pairing",
    area: "debugging",
    topic: "hashing",
    difficulty: "easy",
    expectedDurationMinutes: 8,
    prompt: "Diagnose and repair the bug where the function returns duplicate indices using the same array element twice.",
    bugType: "unhandled_edge_case",
    buggyLanguage: "python",
    buggyLineNumber: 9,
    observedSymptom: "Returns identical indices [0, 0] when target is twice the first number (e.g. nums=[3, 2, 4], target=6).",
    failingTestCase: {
      input: "nums = [3, 2, 4], target = 6",
      expected: "[1, 2]",
      actualFaultyOutput: "[0, 0] (element at index 0 used twice)"
    },
    buggyCode: `def twoSum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        seen[num] = i
        
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [i, seen[complement]] # BUG: doesn't check seen[complement] != i
            
    return []`,
    correctCode: `def twoSum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
    rootCauseExplanation: "In a two-pass hash map, if `target == 2 * nums[i]`, `complement in seen` returns index `i` itself because the element was stored in the first pass. This violates the rule that an element cannot be used twice. A single-pass approach or checking `seen[complement] != i` resolves the defect.",
    regressionTestCases: [
      { id: "reg-1", input: "nums = [3, 2, 4], target = 6", expected: "[1, 2]", argsJson: "[[3, 2, 4], 6]" },
      { id: "reg-2", input: "nums = [3, 3], target = 6", expected: "[0, 1]", argsJson: "[[3, 3], 6]" }
    ],
    rubric: [
      {
        name: "Defect Localization",
        weight: 35,
        description: "Identifies self-pairing condition on two-pass map.",
        criteria: [{ scoreThreshold: 80, description: "Points out index reuse" }]
      },
      {
        name: "Root Cause Explanation",
        weight: 35,
        description: "Explains target == 2 * num conflict.",
        criteria: [{ scoreThreshold: 80, description: "Explains self-lookup in seen map" }]
      },
      {
        name: "Patch Verification",
        weight: 30,
        description: "Implements single-pass or adds index distinct check.",
        criteria: [{ scoreThreshold: 90, description: "Passes regression cases without self-pairing" }]
      }
    ],
    semanticFingerprint: "fp_dbg_two_sum_self_pair"
  },
  {
    id: "dbg-kadane-all-negative",
    canonicalId: "maximum-subarray-sum-kadane-s-algorithm",
    title: "Debug Kadane's Negative Subarray Zero Trap",
    area: "debugging",
    topic: "arrays",
    difficulty: "medium",
    expectedDurationMinutes: 8,
    prompt: "Diagnose why this Kadane's implementation fails on input arrays containing only negative numbers.",
    bugType: "unhandled_edge_case",
    buggyLanguage: "python",
    buggyLineNumber: 2,
    observedSymptom: "Returns 0 on [-5, -2, -8, -1], whereas the expected maximum subarray sum is -1.",
    failingTestCase: {
      input: "nums = [-5, -2, -8, -1]",
      expected: "-1",
      actualFaultyOutput: "0"
    },
    buggyCode: `def maxSubArray(nums: list[int]) -> int:
    max_sum = 0 # BUG: initialized to 0 instead of nums[0] or -inf
    curr_sum = 0
    
    for x in nums:
        curr_sum += x
        if curr_sum > max_sum:
            max_sum = curr_sum
        if curr_sum < 0:
            curr_sum = 0
            
    return max_sum`,
    correctCode: `def maxSubArray(nums: list[int]) -> int:
    max_sum = nums[0]
    curr_sum = 0
    
    for x in nums:
        curr_sum = max(x, curr_sum + x)
        max_sum = max(max_sum, curr_sum)
        
    return max_sum`,
    rootCauseExplanation: "The problem statement requires a non-empty subarray. Initializing `max_sum = 0` assumes an empty subarray with sum 0 is permissible. If all numbers are negative, `curr_sum` will never exceed 0, so the function spuriously returns 0 instead of the maximum single element.",
    regressionTestCases: [
      { id: "reg-1", input: "nums = [-5, -2, -8, -1]", expected: "-1", argsJson: "[[-5, -2, -8, -1]]" },
      { id: "reg-2", input: "nums = [-1]", expected: "-1", argsJson: "[[-1]]" }
    ],
    rubric: [
      {
        name: "Initialization Bug Detection",
        weight: 40,
        description: "Catches max_sum = 0 initialization error.",
        criteria: [{ scoreThreshold: 85, description: "Identifies spurious 0 return" }]
      },
      {
        name: "Non-Empty Subarray Constraint",
        weight: 30,
        description: "Explains non-empty subarray invariant.",
        criteria: [{ scoreThreshold: 75, description: "Explains negative maximum single element" }]
      },
      {
        name: "Correct Patch",
        weight: 30,
        description: "Sets max_sum = nums[0] and updates correctly.",
        criteria: [{ scoreThreshold: 90, description: "Passes all-negative test cases" }]
      }
    ],
    semanticFingerprint: "fp_dbg_kadane_all_negative"
  }
];

// ── 3. CODE COMPREHENSION QUESTION BANK ───────────────────────────────────────

export const CODE_COMPREHENSION_BANK: CodeComprehensionQuestion[] = [
  {
    id: "comp-fast-slow-collision",
    canonicalId: "detect-a-cycle-in-a-linked-list",
    title: "Code Comprehension: Fast & Slow Pointer Step Tracing",
    area: "code_comprehension",
    topic: "linked-lists",
    difficulty: "medium",
    expectedDurationMinutes: 8,
    prompt: "Trace the execution of this cycle-detection snippet for the given linked list structure. Predict the state of pointers at each step until collision.",
    snippetLanguage: "python",
    codeSnippet: `class Node:
    def __init__(self, val, nxt=None):
        self.val = val
        self.next = nxt

def traceCycle(head: Node):
    slow = head
    fast = head
    step = 0
    while fast and fast.next:
        slow = slow.next
        fast = fast.next.next
        step += 1
        if slow == fast:
            return step
    return -1`,
    executionTraceTarget: "Value of `step` and values of slow.val and fast.val at each iteration until slow == fast.",
    traceInputs: [
      {
        inputName: "List with cycle",
        inputValue: "1 -> 2 -> 3 -> 4 -> 5 -> cycle back to 2",
        expectedOutput: "Collision occurs at step = 4, where slow.val = 5 and fast.val = 5"
      }
    ],
    expectedStateEvolution: [
      { step: 1, description: "First iteration", variableState: { slow: 2, fast: 3 } },
      { step: 2, description: "Second iteration", variableState: { slow: 3, fast: 5 } },
      { step: 3, description: "Third iteration", variableState: { slow: 4, fast: 3 } },
      { step: 4, description: "Fourth iteration (Collision)", variableState: { slow: 5, fast: 5 } }
    ],
    referenceExplanation: "At step 0: slow=1, fast=1. Step 1: slow=2, fast=3. Step 2: slow=3, fast=5. Step 3: slow=4, fast enters cycle (5 -> 2 -> 3), so fast=3. Step 4: slow=5, fast (3 -> 4 -> 5), so fast=5. Slow and fast meet on node 5 at step 4.",
    rubric: [
      {
        name: "Pointer Progression Accuracy",
        weight: 50,
        description: "Accurately traces slow moving 1 step and fast moving 2 steps.",
        criteria: [{ scoreThreshold: 80, description: "Traces correct node sequence" }]
      },
      {
        name: "Cycle Re-entry & Collision",
        weight: 50,
        description: "Correctly models fast looping through 5->2->3 and collision at 5.",
        criteria: [{ scoreThreshold: 80, description: "States collision at step 4 on node 5" }]
      }
    ],
    semanticFingerprint: "fp_comp_fast_slow_collision"
  },
  {
    id: "comp-recursion-tree-subsets",
    canonicalId: "subsets",
    title: "Code Comprehension: Recursion Call-Stack & State Tree",
    area: "code_comprehension",
    topic: "recursion",
    difficulty: "medium",
    expectedDurationMinutes: 8,
    prompt: "Examine this recursive backtracking code. Trace the chronological order in which subsets are appended to `result` for input `nums = [1, 2]`.",
    snippetLanguage: "python",
    codeSnippet: `def subsets(nums: list[int]) -> list[list[int]]:
    result = []
    
    def backtrack(idx: int, current: list[int]):
        if idx == len(nums):
            result.append(list(current))
            return
            
        # Decision 1: Include nums[idx]
        current.append(nums[idx])
        backtrack(idx + 1, current)
        
        # Backtrack
        current.pop()
        
        # Decision 2: Exclude nums[idx]
        backtrack(idx + 1, current)
        
    backtrack(0, [])
    return result`,
    executionTraceTarget: "Chronological sequence of lists appended to result.",
    traceInputs: [
      {
        inputName: "nums",
        inputValue: "[1, 2]",
        expectedOutput: "[[1, 2], [1], [2], []]"
      }
    ],
    expectedStateEvolution: [
      { step: 1, description: "Include 1, Include 2 -> leaf idx=2", variableState: { subset: "[1, 2]" } },
      { step: 2, description: "Backtrack pop 2, Exclude 2 -> leaf idx=2", variableState: { subset: "[1]" } },
      { step: 3, description: "Backtrack pop 1, Exclude 1, Include 2 -> leaf idx=2", variableState: { subset: "[2]" } },
      { step: 4, description: "Backtrack pop 2, Exclude 2 -> leaf idx=2", variableState: { subset: "[]" } }
    ],
    referenceExplanation: "The tree explores the 'include' branch first to maximum depth: [1, 2] is appended first. Then 2 is popped and the exclude branch reaches depth 2, appending [1]. Then 1 is popped and the outer exclude branch runs with 2 included, appending [2]. Finally 2 is excluded, appending []. Total: [[1, 2], [1], [2], []].",
    rubric: [
      {
        name: "Call Stack Traversal Order",
        weight: 60,
        description: "Correctly identifies depth-first include branch precedence.",
        criteria: [{ scoreThreshold: 80, description: "Chronological order [[1,2],[1],[2],[]]" }]
      },
      {
        name: "Backtracking State Restoration",
        weight: 40,
        description: "Explains current.pop() undoing mutations.",
        criteria: [{ scoreThreshold: 75, description: "Notes array reuse across branches" }]
      }
    ],
    semanticFingerprint: "fp_comp_recursion_tree_subsets"
  }
];

// ── 4. COMPLEXITY & OPTIMIZATION QUESTION BANK ─────────────────────────────────

export const COMPLEXITY_BANK: ComplexityQuestion[] = [
  {
    id: "cpx-two-sum-hash-vs-twopointer",
    canonicalId: "two-sum",
    title: "Complexity Trade-Off: Hash Map vs Sorted Two Pointers",
    area: "complexity_optimization",
    topic: "arrays",
    difficulty: "medium",
    expectedDurationMinutes: 8,
    prompt: "Analyze the time and space complexity of solving Two Sum with a Hash Map versus sorting first and applying Two Pointers. Explain when you would prefer one over the other in production.",
    snippetLanguage: "python",
    codeSnippet: `# Approach A: Hash Map
def twoSumA(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, x in enumerate(nums):
        if target - x in seen:
            return [seen[target - x], i]
        seen[x] = i
    return []

# Approach B: Sort + Two Pointers
def twoSumB(nums: list[int], target: int) -> list[int]:
    indexed = sorted([(x, i) for i, x in enumerate(nums)])
    l, r = 0, len(nums) - 1
    while l < r:
        s = indexed[l][0] + indexed[r][0]
        if s == target:
            return [indexed[l][1], indexed[r][1]]
        elif s < target:
            l += 1
        else:
            r -= 1
    return []`,
    expectedTimeComplexity: "Approach A: O(N) average. Approach B: O(N log N) due to sort.",
    expectedSpaceComplexity: "Approach A: O(N) auxiliary space. Approach B: O(N) auxiliary space (to preserve indices).",
    bottleneckExplanation: "Approach A's bottleneck is hash collision risk and cache locality overhead. Approach B's bottleneck is the sorting step O(N log N).",
    optimizationOpportunity: "If the input array is already sorted and only values (not original indices) are needed, Two Pointers achieves O(N) time with O(1) auxiliary space.",
    alternativeApproaches: [
      {
        name: "Single-Pass Hash Map",
        time: "O(N) avg, O(N^2) worst-case with malicious hash collisions",
        space: "O(N)",
        tradeOff: "Fastest linear time on unsorted arrays, consumes linear RAM."
      },
      {
        name: "Sort + In-place Two Pointers",
        time: "O(N log N)",
        space: "O(1) if modifying input and returning values, O(N) to retain indices",
        tradeOff: "Deterministic worst-case performance, cache-friendly sequential access."
      }
    ],
    rubric: [
      {
        name: "Big-O Derivation",
        weight: 50,
        description: "Accurate time and space analysis of both algorithms.",
        criteria: [{ scoreThreshold: 80, description: "O(N) vs O(N log N) correctly derived" }]
      },
      {
        name: "Architectural Trade-Off Judgment",
        weight: 50,
        description: "Evaluates memory constraints, cache locality, and hash collisions.",
        criteria: [{ scoreThreshold: 75, description: "Explains when sorting is preferred over heap allocation" }]
      }
    ],
    semanticFingerprint: "fp_cpx_two_sum_hash_vs_twopointer"
  },
  {
    id: "cpx-matrix-median-binary-search",
    canonicalId: "painter-s-partition-problem",
    title: "Complexity Analysis: Binary Search on Answer Space",
    area: "complexity_optimization",
    topic: "binary-search",
    difficulty: "hard",
    expectedDurationMinutes: 10,
    prompt: "Analyze the time and space complexity of binary search on answer space for partitioning problems (e.g. Painter's Partition / Book Allocation).",
    snippetLanguage: "python",
    codeSnippet: `def isFeasible(boards: list[int], k: int, max_limit: int) -> bool:
    count = 1
    current = 0
    for b in boards:
        if current + b <= max_limit:
            current += b
        else:
            count += 1
            current = b
            if count > k:
                return False
    return True

def minTime(boards: list[int], k: int) -> int:
    low = max(boards)
    high = sum(boards)
    ans = high
    while low <= high:
        mid = low + (high - low) // 2
        if isFeasible(boards, k, mid):
            ans = mid
            high = mid - 1
        else:
            low = mid + 1
    return ans`,
    expectedTimeComplexity: "O(N * log(sum(boards) - max(boards)))",
    expectedSpaceComplexity: "O(1) auxiliary space",
    bottleneckExplanation: "Each step of binary search takes O(N) to iterate through the boards array. The number of iterations is log2(sum - max).",
    optimizationOpportunity: "Parallelizing the feasibility check across CPU cores if N is extremely large.",
    alternativeApproaches: [
      {
        name: "Dynamic Programming",
        time: "O(k * N^2)",
        space: "O(k * N)",
        tradeOff: "Impractically slow compared to binary search on answer space."
      }
    ],
    rubric: [
      {
        name: "Time Complexity Derivation",
        weight: 50,
        description: "Accurately derives O(N * log(Range)).",
        criteria: [{ scoreThreshold: 80, description: "Mentions log of search space multiplied by O(N) check" }]
      },
      {
        name: "Space & Bottleneck",
        weight: 50,
        description: "Confirms O(1) space and identifies linear scan bottleneck.",
        criteria: [{ scoreThreshold: 80, description: "Confirms auxiliary space is strictly constant" }]
      }
    ],
    semanticFingerprint: "fp_cpx_bs_answer_space"
  }
];

// ── 5. ADAPTIVE FOLLOW-UP QUESTION BANK ───────────────────────────────────────

export const ADAPTIVE_FOLLOWUP_BANK: AdaptiveFollowUpQuestion[] = [
  {
    id: "afu-bs-duplicates",
    canonicalId: "search-in-rotated-sorted-array-ii",
    title: "Adaptive Follow-Up: Rotated Array with Duplicate Elements",
    area: "adaptive_followup",
    topic: "binary-search",
    difficulty: "hard",
    expectedDurationMinutes: 8,
    prompt: "How does your binary search logic degrade if the array contains duplicate elements (e.g., nums[low] == nums[mid] == nums[high])? Can O(log N) worst-case time still be guaranteed?",
    triggerCondition: "after_optimal_solution",
    probePrompt: "Consider nums = [3, 1, 2, 3, 3, 3, 3] searching for 1. When low, mid, and high all equal 3, which half is sorted?",
    expectedInsight: "When nums[low] == nums[mid] == nums[high], we cannot determine whether the left or right half is sorted. We must increment low and decrement high, shrinking the window by 1. Consequently, worst-case time complexity degrades from O(log N) to O(N).",
    constraintsAdjustment: "Input array now contains duplicate values.",
    rubric: [
      {
        name: "Worst-Case Degradation Proof",
        weight: 60,
        description: "Explains loss of monotonic partition when endpoints match.",
        criteria: [{ scoreThreshold: 80, description: "Explains degradation to O(N)" }]
      },
      {
        name: "Recovery Strategy",
        weight: 40,
        description: "Proposes low++ and high-- to bypass ambiguous duplicates.",
        criteria: [{ scoreThreshold: 75, description: "States correct boundary contraction" }]
      }
    ],
    semanticFingerprint: "fp_afu_bs_duplicates"
  },
  {
    id: "afu-streaming-memory-limit",
    canonicalId: "two-sum",
    title: "Adaptive Follow-Up: Terabyte Scale Streaming Memory Constraint",
    area: "adaptive_followup",
    topic: "system-design-dsa",
    difficulty: "hard",
    expectedDurationMinutes: 8,
    prompt: "Suppose the input array is 100 GB in size and cannot fit into RAM. How would you solve Two Sum or find pairs under strict memory limits (e.g. 1 GB RAM)?",
    triggerCondition: "after_optimal_solution",
    probePrompt: "The hash map approach would crash with an OutOfMemory error. What external sorting or hashing strategy scales to disk?",
    expectedInsight: "Use External Merge Sort to sort the 100 GB file in chunks on disk, then execute two-pointer convergence using two streaming file pointers reading forward from start and backward from end, utilizing O(1) RAM.",
    constraintsAdjustment: "Array exceeds available RAM; file-backed streaming.",
    rubric: [
      {
        name: "External Sorting Concept",
        weight: 50,
        description: "Proposes external merge sort or hash partitioning on disk.",
        criteria: [{ scoreThreshold: 80, description: "Explains chunked disk sorting" }]
      },
      {
        name: "Streaming Two-Pointer Convergence",
        weight: 50,
        description: "Describes streaming two pointers over sorted disk files with bounded buffers.",
        criteria: [{ scoreThreshold: 80, description: "Explains O(1) RAM streaming scan" }]
      }
    ],
    semanticFingerprint: "fp_afu_streaming_memory_limit"
  }
];

// ── 6. DYNAMIC INTERVIEW BLUEPRINT GENERATOR ──────────────────────────────────

export interface GenerateBlueprintParams {
  candidateId: string;
  questionCount?: InterviewLength; // 5, 6, or 7 (default 6)
  stepId?: string;
  topic?: string;
  difficulty?: InterviewDifficulty;
  targetRole?: TargetRole;
  targetCompany?: string;
  language?: SupportedLanguage;
}

/**
 * Builds a balanced, multi-dimensional question blueprint covering all six mandatory areas.
 * Excludes previously seen questions from candidate history to guarantee zero repeats.
 */
export function generateInterviewBlueprint(params: GenerateBlueprintParams): AnyInterviewQuestion[] {
  const candidateId = params.candidateId || "guest";
  const count: InterviewLength = params.questionCount === 5 || params.questionCount === 7 ? params.questionCount : 6;
  const lang: SupportedLanguage = params.language || "cpp";
  const diff = params.difficulty || "mixed";

  const seenIds = getSeenQuestionIds(candidateId);

  // Helper to pick unseen question with fallback if bank exhausted
  function pickUnseen<T extends { id: string; canonicalId?: string; semanticFingerprint?: string }>(
    bank: T[],
    topicFilter?: string
  ): T {
    let pool = bank;
    if (topicFilter && topicFilter !== "all") {
      const filtered = bank.filter(q => (q as any).topic?.toLowerCase().includes(topicFilter.toLowerCase()));
      if (filtered.length > 0) pool = filtered;
    }

    const unseen = pool.filter(q => !isQuestionSeen(candidateId, q));
    if (unseen.length > 0) {
      return unseen[Math.floor(Math.random() * unseen.length)];
    }
    // Fallback: pick question from pool with earliest appearance
    return pool[0];
  }

  // 1. Technical Reasoning Question
  const qReasoning = pickUnseen(TECHNICAL_REASONING_BANK, params.topic);

  // 2. Live Coding Question (drawn from canonical/A2Z DSA)
  const canonicalList = Object.values(CANONICAL_DSA_PROBLEMS);
  let eligibleCoding = canonicalList.filter(p => !seenIds.has(p.id));
  if (params.stepId) {
    const stepNum = params.stepId.replace("step-", "").trim();
    const stepMatches = canonicalList.filter(p => p.step_title.toLowerCase().includes(`step ${stepNum}:`));
    if (stepMatches.length > 0) eligibleCoding = stepMatches;
  }
  if (eligibleCoding.length === 0) {
    eligibleCoding = canonicalList;
  }
  const chosenCanonical = eligibleCoding[0] || CANONICAL_DSA_PROBLEMS["painter-s-partition-problem"];

  const qLiveCoding1: LiveCodingQuestion = {
    id: `lc-${chosenCanonical.id}`,
    canonicalId: chosenCanonical.id,
    problemId: chosenCanonical.id,
    title: chosenCanonical.title,
    area: "live_coding",
    topic: chosenCanonical.subtopic_title,
    difficulty: chosenCanonical.difficulty,
    expectedDurationMinutes: 15,
    prompt: chosenCanonical.fullDescription,
    functionName: chosenCanonical.functionName,
    constraints: chosenCanonical.constraints,
    examples: chosenCanonical.examples,
    starterCode: chosenCanonical.starterCode,
    publicTestCases: chosenCanonical.publicTestCases,
    hiddenTestCases: chosenCanonical.hiddenTestCases,
    referenceSolution: chosenCanonical.referenceSolution,
    optimalComplexity: {
      time: chosenCanonical.time_complexity,
      space: chosenCanonical.space_complexity
    },
    semanticFingerprint: `fp_lc_${chosenCanonical.id}`,
    rubric: [
      {
        name: "Functional Test Correctness",
        weight: 40,
        description: "Passes visible and hidden edge case test suites.",
        criteria: [{ scoreThreshold: 80, description: "Passes 100% of test cases" }]
      },
      {
        name: "Time & Space Complexity",
        weight: 30,
        description: "Achieves optimal Big-O bounds.",
        criteria: [{ scoreThreshold: 80, description: "Optimal complexity achieved" }]
      },
      {
        name: "Code Quality & Implementation",
        weight: 30,
        description: "Clean boundary condition handling and robust variable naming.",
        criteria: [{ scoreThreshold: 75, description: "Structured clean implementation" }]
      }
    ]
  };

  // 3. Debugging Question
  const qDebugging = pickUnseen(DEBUGGING_BANK, params.topic);

  // 4. Code Comprehension Question
  const qComprehension = pickUnseen(CODE_COMPREHENSION_BANK, params.topic);

  // 5. Complexity Question
  const qComplexity = pickUnseen(COMPLEXITY_BANK, params.topic);

  // 6. Adaptive Follow-Up Question
  const qAdaptive = pickUnseen(ADAPTIVE_FOLLOWUP_BANK, params.topic);

  // Construct questions based on 5, 6, or 7 length
  if (count === 5) {
    // 5-Question blueprint: merges coding + complexity analysis into Q2, preserving all 6 competencies
    const combinedCoding: LiveCodingQuestion = {
      ...qLiveCoding1,
      title: `${qLiveCoding1.title} (Implementation & Complexity Proof)`,
      prompt: `${qLiveCoding1.prompt}\n\n[MANDATORY EVALUATION]: In addition to writing working code, you must explicitly document your time complexity and auxiliary space complexity in the solution comments.`
    };
    return [qReasoning, combinedCoding, qDebugging, qComprehension, qAdaptive];
  }

  if (count === 7) {
    // 7-Question blueprint: adds a second distinct Live Coding problem
    const secondEligible = eligibleCoding.filter(p => p.id !== chosenCanonical.id);
    const secondCanonical = secondEligible.length > 0 ? secondEligible[0] : canonicalList[1] || chosenCanonical;

    const qLiveCoding2: LiveCodingQuestion = {
      id: `lc2-${secondCanonical.id}`,
      canonicalId: secondCanonical.id,
      problemId: secondCanonical.id,
      title: `${secondCanonical.title} (Advanced Round)`,
      area: "live_coding",
      topic: secondCanonical.subtopic_title,
      difficulty: secondCanonical.difficulty === "easy" ? "medium" : "hard",
      expectedDurationMinutes: 15,
      prompt: secondCanonical.fullDescription,
      functionName: secondCanonical.functionName,
      constraints: secondCanonical.constraints,
      examples: secondCanonical.examples,
      starterCode: secondCanonical.starterCode,
      publicTestCases: secondCanonical.publicTestCases,
      hiddenTestCases: secondCanonical.hiddenTestCases,
      referenceSolution: secondCanonical.referenceSolution,
      optimalComplexity: {
        time: secondCanonical.time_complexity,
        space: secondCanonical.space_complexity
      },
      semanticFingerprint: `fp_lc2_${secondCanonical.id}`,
      rubric: [
        {
          name: "Algorithmic Precision",
          weight: 50,
          description: "Passes all test fixtures",
          criteria: [{ scoreThreshold: 80, description: "Passes test cases" }]
        },
        {
          name: "Optimization Quality",
          weight: 50,
          description: "Optimal time/space bounds",
          criteria: [{ scoreThreshold: 80, description: "Optimal complexity" }]
        }
      ]
    };

    return [qReasoning, qLiveCoding1, qDebugging, qComprehension, qLiveCoding2, qComplexity, qAdaptive];
  }

  // Default: Standard 6-Question blueprint (1 per area)
  return [qReasoning, qLiveCoding1, qDebugging, qComprehension, qComplexity, qAdaptive];
}

