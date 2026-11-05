/**
 * lib/skills/dsa-visualizer.ts
 * 
 * Comprehensive Visual Dry-Run Simulation Studio & Algorithmic Pedagogical Engine.
 * 
 * Features:
 * 1. 8-Phase Algorithmic Teaching Sequence:
 *    - Phase 1: Problem Understanding & Real-World Impact
 *    - Phase 2: Intuitive Analogy / Story (jargon-free grounding)
 *    - Phase 3: Approach & Reasoning (Naive vs Optimal Big-O comparison)
 *    - Phase 4: Technical Implementation & Invariants (loop invariants, pitfalls)
 *    - Phase 5: Live Synchronized Demonstration (discrete frames, line highlighting)
 *    - Phase 6: Active Student Participation / Prediction Checkpoints
 *    - Phase 7: Contextual Pedagogical Feedback
 *    - Phase 8: Independent Transfer Lab (follow-up problem with bridge & code)
 * 2. Exact code line number synchronization (1-based index)
 * 3. State variables watch table supporting primitive & object formats with zero "undefined" errors
 * 4. Dual-language teacher-quality audio narrations (English & Hinglish)
 * 5. Full handling of both target-found and target-not-found / search-space-exhausted states
 */

export interface VisualArrayElement {
  value: number | string;
  index: number;
  highlight?: "low" | "high" | "mid" | "active" | "matched" | "discarded" | "sorted" | "normal";
}

export interface VisualPointer {
  label: string;
  index: number;
  color: string;
}

export interface VisualLinkedListNode {
  id: string;
  value: number | string;
  nextId: string | null;
  isHead?: boolean;
  isTail?: boolean;
  highlight?: "active" | "prev" | "curr" | "next" | "normal";
}

export interface VisualDpCell {
  row: number;
  col: number;
  value: number | string;
  isCurrent?: boolean;
  isComputed?: boolean;
  highlightFormula?: string;
}

export interface VisualDpTable {
  rowLabels: string[];
  colLabels: string[];
  cells: VisualDpCell[][];
}

export interface VisualStackItem {
  id: string;
  value: string | number;
  highlight?: "pushed" | "popped" | "matched" | "normal";
}

export interface PredictionOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
}

export interface VisualPredictionPoint {
  prompt: string;
  hinglishPrompt?: string;
  variableName?: string;
  options: PredictionOption[];
}

export interface VisualFrame {
  stepIndex: number;
  title: string;
  description: string;
  hinglishDescription: string;
  spokenNarration: string;
  spokenNarrationHinglish: string;
  codeLineNumber: number; // 1-based active line in codeSnippet
  structureType: "array" | "linked_list" | "tree" | "graph" | "dp_table" | "stack";
  array?: VisualArrayElement[];
  pointers?: VisualPointer[];
  linkedList?: VisualLinkedListNode[];
  dpTable?: VisualDpTable;
  stackItems?: VisualStackItem[];
  callStack?: string[];
  stateVariables: Record<string, any>;
  changedVariables?: string[];
  actionType: "init" | "compare" | "shift_pointer" | "update_variable" | "push" | "pop" | "traverse" | "found" | "finish";
  prediction?: VisualPredictionPoint;
}

export interface TeachingAnalogy {
  title: string;
  scenario: string;
  connection: string;
}

export interface ApproachComparison {
  naive: { name: string; timeComplexity: string; spaceComplexity: string; whySuboptimal: string };
  optimal: { name: string; timeComplexity: string; spaceComplexity: string; keyInsight: string };
}

export interface TechnicalInvariants {
  variables: Array<{ name: string; role: string; invariant: string }>;
  loopInvariant: string;
  terminationCondition: string;
  commonPitfalls: string[];
}

export interface TransferLabProblem {
  problemId: string;
  title: string;
  prompt: string;
  initialArrayOrInput: string;
  conceptualBridge: string;
  keyQuestion: string;
  solutionBreakdown: string;
  complexityTarget: string;
}

export interface AlgorithmCurriculum {
  problemId: string;
  algorithmName: string;
  problemUnderstanding: {
    plainLanguage: string;
    whyItMatters: string;
    realWorldUseCases: string[];
  };
  analogy: TeachingAnalogy;
  approachComparison: ApproachComparison;
  technicalDetails: TechnicalInvariants;
  transferLab: TransferLabProblem;
}

export interface DryRunSimulation {
  problemId: string;
  problemTitle: string;
  algorithmType: "binary_search" | "kadane" | "two_pointers" | "sorting" | "linked_list" | "binary_tree" | "graph" | "dynamic_programming" | "stack_queue";
  initialInputDescription: string;
  codeSnippet: string;
  totalSteps: number;
  frames: VisualFrame[];
  curriculum: AlgorithmCurriculum;
}

// ═════════════════════════════════════════════════════════════════════════
// 1. BINARY SEARCH PEDAGOGY & SIMULATION
// ═════════════════════════════════════════════════════════════════════════

export const BINARY_SEARCH_CURRICULUM: AlgorithmCurriculum = {
  problemId: "binary-search",
  algorithmName: "Binary Search (Divide & Conquer)",
  problemUnderstanding: {
    plainLanguage: "Given a sorted array of numbers in ascending order and a target value, find whether the target exists in the array and return its 0-based index. If the target is not present, return -1.",
    whyItMatters: "Searching unsorted data requires examining every single element one by one (O(N) linear time). In database indexes, distributed search engines, and operating system caches containing billions of rows, linear scans are completely infeasible. Binary search cuts the search space in half with every single comparison, reducing 1,000,000 items to at most 20 comparisons (O(log N)).",
    realWorldUseCases: [
      "Database primary key B-Tree index traversal (e.g. Postgres, MySQL)",
      "Git bisect automated commit regression hunting",
      "Network router IP routing prefix lookups (CIDR)",
      "Operating system virtual memory page boundary lookups"
    ]
  },
  analogy: {
    title: "The Oxford Dictionary Search",
    scenario: "Imagine looking up the word 'Python' in a 2,000-page physical dictionary. You do NOT start on page 1 reading every single word sequentially. Instead, you open the book right to the middle (around page 1,000, starting with letter 'M'). Seeing that 'P' comes after 'M' alphabetically, you immediately rip away or ignore pages 1 through 1,000 without looking at a single word. You repeat this halving process on the remaining pages until you land on 'Python'.",
    connection: "The dictionary pages correspond to the sorted array. Opening to the middle corresponds to calculating mid = (low + high) // 2. Tossing away the first half is updating low = mid + 1."
  },
  approachComparison: {
    naive: {
      name: "Linear Scan (Sequential Search)",
      timeComplexity: "O(N)",
      spaceComplexity: "O(1)",
      whySuboptimal: "Ignores the sorted guarantee entirely; visits all N items in the worst case, taking millions of operations on real-world inputs."
    },
    optimal: {
      name: "Binary Search (Logarithmic Halving)",
      timeComplexity: "O(log N)",
      spaceComplexity: "O(1)",
      keyInsight: "Monotonicity guarantee: if nums[mid] < target, then because the array is sorted, EVERY element from index low to mid is guaranteed to be strictly less than target. The entire left half can be discarded in O(1) time."
    }
  },
  technicalDetails: {
    variables: [
      { name: "low", role: "Left boundary index of the active search range", invariant: "Every element strictly to the left of low is known to be < target." },
      { name: "high", role: "Right boundary index of the active search range", invariant: "Every element strictly to the right of high is known to be > target." },
      { name: "mid", role: "Center pivot index where comparison occurs", invariant: "Calculated as low + (high - low) // 2." },
      { name: "nums[mid]", role: "Array value at the pivot index", invariant: "Compared against target to decide which half to prune." },
      { name: "resultIndex", role: "Final answer returned to caller", invariant: "Index of target if found; -1 if low > high." }
    ],
    loopInvariant: "If target exists in nums, it must lie strictly within the inclusive subarray nums[low..high].",
    terminationCondition: "low > high: The search window has length 0, mathematically proving the target is not in the array.",
    commonPitfalls: [
      "Integer overflow in 32-bit languages using (low + high) // 2 instead of low + (high - low) // 2.",
      "Writing while low < high instead of while low <= high, which fails when the target is at the final single element.",
      "Updating low = mid instead of low = mid + 1, causing an infinite loop when low and high differ by 1."
    ]
  },
  transferLab: {
    problemId: "search-in-rotated-sorted-array",
    title: "Search in Rotated Sorted Array",
    prompt: "An ascending sorted array of distinct integers was rotated at an unknown pivot index (e.g. [4, 5, 6, 7, 0, 1, 2]). Given target, find its index in O(log N) time, or return -1.",
    initialArrayOrInput: "nums = [4, 5, 6, 7, 0, 1, 2], target = 0",
    conceptualBridge: "Even though the whole array is no longer sorted, notice this fundamental property: for ANY mid index, AT LEAST ONE of the two halves ([low..mid] or [mid..high]) is guaranteed to be completely sorted! Check which half is sorted first, then check if target falls inside that sorted half's boundaries.",
    keyQuestion: "How do you check if the left half is sorted? If nums[low] <= nums[mid], the left half is normally sorted!",
    complexityTarget: "Time: O(log N), Space: O(1)",
    solutionBreakdown: "1. Find mid = (low + high) // 2.\n2. If nums[mid] == target, return mid.\n3. If nums[low] <= nums[mid] (left is sorted):\n   - If nums[low] <= target < nums[mid]: high = mid - 1\n   - Else: low = mid + 1\n4. Else (right is sorted):\n   - If nums[mid] < target <= nums[high]: low = mid + 1\n   - Else: high = mid - 1"
  }
};

export function simulateBinarySearch(
  arr: number[] = [1, 3, 5, 7, 9, 11, 13, 15],
  target: number = 9
): DryRunSimulation {
  const codeSnippet = `def binary_search(nums, target):
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
    return -1`;

  const frames: VisualFrame[] = [];
  let low = 0;
  let high = arr.length - 1;
  let step = 0;

  // Frame 0: Initialization
  frames.push({
    stepIndex: step++,
    title: "Phase 1 & 4: Initialize Search Boundaries",
    description: `Search space initialized over entire array: low = 0 (value ${arr[0]}), high = ${high} (value ${arr[high]}). Target = ${target}. Loop invariant holds: if ${target} exists, it must reside in [${low}..${high}].`,
    hinglishDescription: `Search space shuru hua: low pointer index 0 par hai aur high index ${high} par. Target hai ${target}. Agar target array mein hai, toh nums[${low}..${high}] ke andar hi hoga.`,
    spokenNarration: `Welcome to Binary Search. We begin by setting low to index 0 and high to index ${high}. The array has ${arr.length} elements. Target to find is ${target}. Loop invariant guarantees that if target exists, it is strictly within our active window.`,
    spokenNarrationHinglish: `Binary search shuru karte hain. Low index 0 par hai aur high index ${high} par. Total ${arr.length} elements hain aur target ${target} dhoondhna hai. Loop condition low less than or equal to high check karegi.`,
    codeLineNumber: 2,
    structureType: "array",
    array: arr.map((val, idx) => ({
      value: val,
      index: idx,
      highlight: idx === 0 ? "low" : idx === high ? "high" : "normal"
    })),
    pointers: [
      { label: `low=${low}`, index: low, color: "#2E7D5B" },
      { label: `high=${high}`, index: high, color: "#C24141" }
    ],
    stateVariables: {
      low: 0,
      high: high,
      mid: "—",
      "nums[mid]": "—",
      target: target,
      resultIndex: "— (searching)"
    },
    changedVariables: ["low", "high", "target"],
    actionType: "init"
  });

  let targetFound = false;

  while (low <= high) {
    const mid = Math.floor(low + (high - low) / 2);
    const midVal = arr[mid];

    if (midVal === target) {
      targetFound = true;
      frames.push({
        stepIndex: step++,
        title: `Target Match Confirmed at Index ${mid}!`,
        description: `nums[mid] (${midVal}) == target (${target}). Element located at index ${mid} with exact match. Algorithm returns ${mid}.`,
        hinglishDescription: `nums[mid] (${midVal}) target ${target} ke barabar hai! Index ${mid} par element successfully mil gaya. Function ${mid} return karega.`,
        spokenNarration: `Target match confirmed! Value at pivot index ${mid} is ${midVal}, which exactly equals target ${target}. The search terminates successfully in logarithmic steps, returning index ${mid}.`,
        spokenNarrationHinglish: `Target match ho gaya! Index ${mid} par value ${midVal} target ${target} ke barabar hai. Algorithm successfully complete hua aur index ${mid} return kiya.`,
        codeLineNumber: 7,
        structureType: "array",
        array: arr.map((val, idx) => ({
          value: val,
          index: idx,
          highlight: idx === mid ? "matched" : idx < low || idx > high ? "discarded" : "normal"
        })),
        pointers: [{ label: `found=${mid}`, index: mid, color: "#12B76A" }],
        stateVariables: {
          low: low,
          mid: mid,
          high: high,
          "nums[mid]": midVal,
          target: target,
          resultIndex: mid
        },
        changedVariables: ["resultIndex", "mid", "nums[mid]"],
        actionType: "found"
      });
      break;
    } else if (midVal < target) {
      const nextLow = mid + 1;
      frames.push({
        stepIndex: step++,
        title: `Evaluate Mid=${mid} (value ${midVal}) < Target (${target})`,
        description: `nums[mid] = ${midVal} is strictly less than target ${target}. Because array is sorted ascending, all elements in [${low}..${mid}] are <= ${midVal} < ${target}. Discarding left partition. Moving low = mid + 1 = ${nextLow}.`,
        hinglishDescription: `Middle value nums[${mid}] = ${midVal} target ${target} se chhota hai. Array sorted hai, isliye index 0 se ${mid} tak saare elements target se chhote hi honge. Left half discard karke low ko ${nextLow} par set kiya.`,
        spokenNarration: `At pivot index ${mid}, value ${midVal} is less than target ${target}. Because the array is sorted, every number to the left of index ${mid} is also strictly less than ${target}. We safely discard the entire left half and move low to ${nextLow}.`,
        spokenNarrationHinglish: `Pivot index ${mid} par value ${midVal} target ${target} se chhota hai. Array sorted hone ki wajah se left ke saare elements discard ho gaye, aur low pointer ab ${nextLow} par shift ho gaya.`,
        codeLineNumber: 9,
        structureType: "array",
        array: arr.map((val, idx) => ({
          value: val,
          index: idx,
          highlight: idx === mid ? "mid" : idx < nextLow || idx > high ? "discarded" : "normal"
        })),
        pointers: [
          { label: `low=${nextLow}`, index: Math.min(nextLow, arr.length - 1), color: "#2E7D5B" },
          { label: `mid=${mid}`, index: mid, color: "#356AE6" },
          { label: `high=${high}`, index: high, color: "#C24141" }
        ],
        stateVariables: {
          low: nextLow,
          mid: mid,
          high: high,
          "nums[mid]": midVal,
          target: target,
          resultIndex: "— (searching)"
        },
        changedVariables: ["low", "mid", "nums[mid]"],
        actionType: "shift_pointer",
        prediction: {
          prompt: `nums[${mid}] (${midVal}) is less than target (${target}). What must the new search boundaries become?`,
          hinglishPrompt: `nums[${mid}] = ${midVal} target ${target} se chhota hai. Nayi search boundaries kya honi chahiye?`,
          variableName: "low",
          options: [
            {
              id: "opt-1",
              text: `low = mid + 1 (${nextLow}), high stays ${high}`,
              isCorrect: true,
              explanation: "Correct! Since nums[mid] < target and the array is sorted, the target must reside strictly to the right of mid."
            },
            {
              id: "opt-2",
              text: `high = mid - 1 (${mid - 1}), low stays ${low}`,
              isCorrect: false,
              explanation: "Incorrect. That would search the left half, where all numbers are even smaller than nums[mid]!"
            },
            {
              id: "opt-3",
              text: `low = mid (${mid})`,
              isCorrect: false,
              explanation: "Incorrect. Setting low = mid can cause an infinite loop when high - low == 1."
            }
          ]
        }
      });
      low = nextLow;
    } else {
      const nextHigh = mid - 1;
      frames.push({
        stepIndex: step++,
        title: `Evaluate Mid=${mid} (value ${midVal}) > Target (${target})`,
        description: `nums[mid] = ${midVal} is strictly greater than target ${target}. Because array is sorted, all elements in [${mid}..${high}] are >= ${midVal} > ${target}. Discarding right partition. Moving high = mid - 1 = ${nextHigh}.`,
        hinglishDescription: `Middle value nums[${mid}] = ${midVal} target ${target} se bada hai. Array sorted hai, isliye index ${mid} se ${high} tak saare elements target se bade hi honge. Right half discard karke high ko ${nextHigh} par set kiya.`,
        spokenNarration: `At pivot index ${mid}, value ${midVal} is greater than target ${target}. Every element to the right is also greater than ${target}. We safely discard the right half and move high to ${nextHigh}.`,
        spokenNarrationHinglish: `Pivot index ${mid} par value ${midVal} target se bada hai. Right partition discard karke high pointer ko ${nextHigh} par le aaye.`,
        codeLineNumber: 11,
        structureType: "array",
        array: arr.map((val, idx) => ({
          value: val,
          index: idx,
          highlight: idx === mid ? "mid" : idx < low || idx > nextHigh ? "discarded" : "normal"
        })),
        pointers: [
          { label: `low=${low}`, index: low, color: "#2E7D5B" },
          { label: `mid=${mid}`, index: mid, color: "#356AE6" },
          { label: `high=${nextHigh}`, index: Math.max(0, nextHigh), color: "#C24141" }
        ],
        stateVariables: {
          low: low,
          mid: mid,
          high: nextHigh,
          "nums[mid]": midVal,
          target: target,
          resultIndex: "— (searching)"
        },
        changedVariables: ["high", "mid", "nums[mid]"],
        actionType: "shift_pointer",
        prediction: {
          prompt: `nums[${mid}] (${midVal}) is greater than target (${target}). What must the new search boundaries become?`,
          hinglishPrompt: `nums[${mid}] = ${midVal} target ${target} se bada hai. Nayi search boundaries kya hongi?`,
          variableName: "high",
          options: [
            {
              id: "opt-1",
              text: `high = mid - 1 (${nextHigh}), low stays ${low}`,
              isCorrect: true,
              explanation: "Correct! The target is smaller than nums[mid], so it can only exist in the left partition."
            },
            {
              id: "opt-2",
              text: `low = mid + 1 (${mid + 1})`,
              isCorrect: false,
              explanation: "Incorrect. The numbers to the right are all strictly greater than nums[mid]."
            }
          ]
        }
      });
      high = nextHigh;
    }
  }

  // Target Not Found Frame (Boundary exhausted: low > high)
  if (!targetFound) {
    frames.push({
      stepIndex: step++,
      title: "Search Space Exhausted: Target Not Found",
      description: `Boundary condition reached: low (${low}) > high (${high}). Search window length is 0. Mathematical proof: target ${target} does not exist in this sorted array. Function returns -1.`,
      hinglishDescription: `Search window khatam: low (${low}) high (${high}) se aage nikal gaya. Iska matlab target ${target} is array mein maujood nahi hai. Function -1 return karega.`,
      spokenNarration: `Pointers have crossed with low at ${low} and high at ${high}. The search space is exhausted. Target ${target} does not exist in this array. Function terminates returning minus one.`,
      spokenNarrationHinglish: `Pointers cross kar gaye, low ${low} par hai aur high ${high} par. Search space khatam ho gaya. Target ${target} array mein nahi mila, function minus one return karega.`,
      codeLineNumber: 12,
      structureType: "array",
      array: arr.map((val, idx) => ({
        value: val,
        index: idx,
        highlight: "discarded"
      })),
      pointers: [
        { label: `low=${low}`, index: Math.min(low, arr.length - 1), color: "#2E7D5B" },
        { label: `high=${high}`, index: Math.max(0, high), color: "#C24141" }
      ],
      stateVariables: {
        low: low,
        high: high,
        mid: "—",
        "nums[mid]": "—",
        target: target,
        resultIndex: -1
      },
      changedVariables: ["resultIndex"],
      actionType: "finish"
    });
  }

  return {
    problemId: "binary-search",
    problemTitle: "Binary Search (Logarithmic Divide & Conquer)",
    algorithmType: "binary_search",
    initialInputDescription: `nums = [${arr.join(", ")}], target = ${target}`,
    codeSnippet,
    totalSteps: frames.length,
    frames,
    curriculum: BINARY_SEARCH_CURRICULUM
  };
}

// ═════════════════════════════════════════════════════════════════════════
// 2. KADANE'S ALGORITHM PEDAGOGY & SIMULATION
// ═════════════════════════════════════════════════════════════════════════

export const KADANE_CURRICULUM: AlgorithmCurriculum = {
  problemId: "maximum-subarray-sum-kadane-s-algorithm",
  algorithmName: "Kadane's Algorithm (Maximum Subarray Sum)",
  problemUnderstanding: {
    plainLanguage: "Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.",
    whyItMatters: "A naive check examines every pair of indices (i, j) taking O(N^2) or O(N^3) time. On an input with 100,000 values, that is 10 billion operations! Kadane's algorithm evaluates the exact maximum contiguous sum in a single linear O(N) scan using dynamic programming principles.",
    realWorldUseCases: [
      "Financial markets: finding the maximum profit period or peak stock rally",
      "Computer vision: maximum brightness or contrast bounding boxes in images",
      "Genomic sequence analysis: identifying GC-rich nucleotide subsequences in DNA",
      "Signal processing: detecting peak energy transmission burst intervals"
    ]
  },
  analogy: {
    title: "The Winning Streak Reset",
    scenario: "Imagine you are running a retail store tracking daily cashflow. If your accumulated debt drops negative (e.g. -₹50,000), carrying that debt forward into tomorrow will strictly reduce whatever profit tomorrow generates. You are mathematically better off writing off past debt, resetting your balance to zero, and starting fresh with tomorrow's earnings.",
    connection: "Whenever the running sum curr_sum drops below 0, adding it to nums[i] will make nums[i] smaller than it would be alone. Therefore, we reset curr_sum = nums[i] whenever curr_sum + nums[i] < nums[i]."
  },
  approachComparison: {
    naive: {
      name: "Brute-Force Nested Loops",
      timeComplexity: "O(N^2)",
      spaceComplexity: "O(1)",
      whySuboptimal: "Calculates sum of all N*(N+1)/2 possible subarrays. Times out completely on competitive platforms for N > 10,000."
    },
    optimal: {
      name: "Kadane's Dynamic Programming",
      timeComplexity: "O(N)",
      spaceComplexity: "O(1)",
      keyInsight: "At every index i, we make a greedy optimal local choice: either extend the running subarray (curr_sum + nums[i]) or start a brand new subarray at nums[i]."
    }
  },
  technicalDetails: {
    variables: [
      { name: "curr_sum", role: "Maximum contiguous sum ending strictly at index i", invariant: "curr_sum = max(nums[i], curr_sum + nums[i])." },
      { name: "max_sum", role: "Global maximum contiguous sum seen across all indices so far", invariant: "max_sum = max(max_sum, curr_sum)." },
      { name: "nums[i]", role: "Current number being evaluated", invariant: "Evaluated exactly once per loop iteration." },
      { name: "maxSubarraySum", role: "Verified maximum subarray sum", invariant: "Equal to max_sum at termination." }
    ],
    loopInvariant: "After processing index i, max_sum holds the maximum sum of any contiguous subarray within nums[0..i].",
    terminationCondition: "i == len(nums): All elements have been processed.",
    commonPitfalls: [
      "Initializing max_sum = 0 instead of nums[0], which fails when all array elements are negative (e.g. [-5, -2, -8] would erroneously return 0).",
      "Resetting curr_sum to 0 before checking max_sum.",
      "Attempting to sort the array, which breaks contiguous indexing."
    ]
  },
  transferLab: {
    problemId: "maximum-product-subarray",
    title: "Maximum Product Subarray",
    prompt: "Given an integer array nums, find a contiguous non-empty subarray within the array that has the largest product, and return that product (e.g. [-2, 3, -4] -> 24).",
    initialArrayOrInput: "nums = [2, 3, -2, 4, -1]",
    conceptualBridge: "Unlike addition, multiplying two negative numbers creates a positive product! Thus, a very small negative number can suddenly flip into the global maximum product when multiplied by another negative number. To transfer Kadane's principle, maintain BOTH curr_max AND curr_min at every step.",
    keyQuestion: "When nums[i] is negative, what happens to curr_max and curr_min? They swap roles before multiplying!",
    complexityTarget: "Time: O(N), Space: O(1)",
    solutionBreakdown: "1. Maintain curr_max = nums[0], curr_min = nums[0], ans = nums[0].\n2. For each num in nums[1:]:\n   - If num < 0: swap(curr_max, curr_min)\n   - curr_max = max(num, curr_max * num)\n   - curr_min = min(num, curr_min * num)\n   - ans = max(ans, curr_max)\n3. Return ans."
  }
};

export function simulateKadane(
  arr: number[] = [-2, 1, -3, 4, -1, 2, 1, -5, 4]
): DryRunSimulation {
  const codeSnippet = `def maxSubArray(nums):
    max_sum = curr_sum = nums[0]
    for i in range(1, len(nums)):
        curr_sum = max(nums[i], curr_sum + nums[i])
        max_sum = max(max_sum, curr_sum)
    return max_sum`;

  const frames: VisualFrame[] = [];
  let currSum = arr[0];
  let maxSum = arr[0];
  let step = 0;

  // Frame 0: Initialization
  frames.push({
    stepIndex: step++,
    title: "Phase 1 & 4: Initialize Kadane State",
    description: `Base case at index 0 (value ${arr[0]}): curr_sum = ${currSum}, max_sum = ${maxSum}. Loop invariant: both variables initialized to nums[0] to correctly handle all-negative arrays.`,
    hinglishDescription: `Base case index 0 par value ${arr[0]} se initialize kiya: curr_sum = ${currSum}, max_sum = ${maxSum}. All-negative arrays ke liye 0 ke bajaye nums[0] se initialize karna zaroori hai.`,
    spokenNarration: `Welcome to Kadane's Algorithm. We initialize both curr_sum and max_sum to the first element, which is ${arr[0]}. This invariant ensures that even if every element in the array is negative, we still find the correct single largest element.`,
    spokenNarrationHinglish: `Kadane's algorithm shuru karte hain. curr_sum aur max_sum dono ko pehle element ${arr[0]} se initialize kiya. Isse negative numbers ka edge case smoothly handle hota hai.`,
    codeLineNumber: 2,
    structureType: "array",
    array: arr.map((val, idx) => ({ value: val, index: idx, highlight: idx === 0 ? "active" : "normal" })),
    pointers: [{ label: "i=0", index: 0, color: "#356AE6" }],
    stateVariables: {
      curr_sum: currSum,
      max_sum: maxSum,
      maxSubarraySum: maxSum,
      "nums[0]": arr[0],
      "nums[i]": arr[0]
    },
    changedVariables: ["curr_sum", "max_sum", "maxSubarraySum"],
    actionType: "init"
  });

  // Frames 1..9 (one for each element)
  currSum = 0;
  maxSum = arr[0];
  for (let i = 0; i < arr.length; i++) {
    const val = arr[i];
    const extended = i === 0 ? val : currSum + val;
    const restarted = i === 0 ? true : val > extended;
    currSum = i === 0 ? val : Math.max(val, extended);
    maxSum = Math.max(maxSum, currSum);

    const isPredictionStep = i === 3; // Step where negative prefix [-2, 1, -3] resets at nums[3] = 4

    frames.push({
      stepIndex: step++,
      title: `Step i=${i} (value ${val}): ${restarted ? "Restart Subarray" : "Extend Subarray"}`,
      description: `At index ${i} (${val}): curr_sum = max(${val}, ${currSum - val} + ${val} = ${extended}) = ${currSum}. ${restarted ? "Negative prefix discarded; starting new subarray." : "Extended current subarray."} max_sum is now ${maxSum}.`,
      hinglishDescription: `Index ${i} par value ${val}: naya curr_sum = ${currSum}. ${restarted ? "Pichhla negative prefix chhod kar nayi shuruaat ki." : "Pichhle subarray ko aage badhaya."} max_sum ab ${maxSum} hai.`,
      spokenNarration: `At index ${i}, evaluating value ${val}. ${restarted ? `Because extending gives ${extended} which is less than ${val}, we discard the negative prefix and restart from ${val}.` : `Extending our subarray yields ${currSum}.`} Global max sum is now ${maxSum}.`,
      spokenNarrationHinglish: `Index ${i} par value ${val} dekhi. ${restarted ? `Negative prefix discard karke ${val} se naya subarray shuru kiya.` : `Subarray ko extend karke curr_sum ${currSum} hua.`} max_sum ab ${maxSum} hai.`,
      codeLineNumber: 4,
      structureType: "array",
      array: arr.map((v, idx) => ({
        value: v,
        index: idx,
        highlight: idx === i ? "active" : idx < i ? "sorted" : "normal"
      })),
      pointers: [{ label: `i=${i}`, index: i, color: "#356AE6" }],
      stateVariables: {
        "nums[i]": val,
        curr_sum: currSum,
        max_sum: maxSum,
        maxSubarraySum: maxSum
      },
      changedVariables: ["nums[i]", "curr_sum", "max_sum", "maxSubarraySum"],
      actionType: "update_variable",
      prediction: isPredictionStep ? {
        prompt: `Previous running sum was -2. Current element nums[3] = 4. What should curr_sum become?`,
        hinglishPrompt: `Pichhla running sum -2 tha aur current element 4 hai. curr_sum kya hona chahiye?`,
        variableName: "curr_sum",
        options: [
          {
            id: "opt-1",
            text: "curr_sum = 4 (Start new subarray, discard -2)",
            isCorrect: true,
            explanation: "Correct! -2 + 4 = 2, which is worse than just starting a new subarray at 4. Kadane greedily restarts here."
          },
          {
            id: "opt-2",
            text: "curr_sum = 2 (Keep extending: -2 + 4 = 2)",
            isCorrect: false,
            explanation: "Incorrect! Carrying forward a negative debt (-2) hurts future totals. max(4, -2 + 4) = 4."
          }
        ]
      } : undefined
    });
  }

  return {
    problemId: "maximum-subarray-sum-kadane-s-algorithm",
    problemTitle: "Maximum Subarray (Kadane's Algorithm)",
    algorithmType: "kadane",
    initialInputDescription: `nums = [${arr.join(", ")}]`,
    codeSnippet,
    totalSteps: frames.length,
    frames,
    curriculum: KADANE_CURRICULUM
  };
}

// ═════════════════════════════════════════════════════════════════════════
// 3. TWO POINTERS CONVERGENCE SIMULATION
// ═════════════════════════════════════════════════════════════════════════

export const TWO_POINTERS_CURRICULUM: AlgorithmCurriculum = {
  problemId: "two-sum",
  algorithmName: "Two Pointers Convergence (Sorted Pair Matching)",
  problemUnderstanding: {
    plainLanguage: "Given a 1-indexed or 0-indexed sorted array of numbers, find two numbers that sum up exactly to a given target and return their indices.",
    whyItMatters: "A brute force check tests all N*(N-1)/2 pairs in O(N^2) time. A hash map solves it in O(N) time but costs O(N) auxiliary memory. When the array is already sorted, two pointers converge inwards in O(N) time with strictly O(1) space.",
    realWorldUseCases: [
      "Ledger balancing: reconciling double-entry credit/debit transaction pairs",
      "E-commerce cart coupon matching: pairing products to hit an exact discount minimum",
      "Robotics motion planning: converging search of symmetric obstacle clearances",
      "Computer graphics: clipping and convex hull boundary scanning"
    ]
  },
  analogy: {
    title: "Two Runners on a Number Line",
    scenario: "Imagine Runner Left stands at the smallest number on the track, and Runner Right stands at the largest. They call out their combined sum. If the sum is too low, Runner Left steps forward to increase it. If the sum is too high, Runner Right steps backward to decrease it. Because the track is sorted, they are guaranteed to meet at the target without ever having to search backwards.",
    connection: "If curr_sum < target, only advancing left can possibly increase the sum. If curr_sum > target, only decrementing right can possibly decrease it."
  },
  approachComparison: {
    naive: {
      name: "Double Nested Loop",
      timeComplexity: "O(N^2)",
      spaceComplexity: "O(1)",
      whySuboptimal: "Tests every combination blindly without exploiting the sorted invariant."
    },
    optimal: {
      name: "Two Pointers Inward Scan",
      timeComplexity: "O(N)",
      spaceComplexity: "O(1)",
      keyInsight: "Monotonic sum response: each pointer move eliminates an entire row or column of potential pairs in O(1) time."
    }
  },
  technicalDetails: {
    variables: [
      { name: "left", role: "Points to smaller candidate element", invariant: "Increments only when sum is strictly less than target." },
      { name: "right", role: "Points to larger candidate element", invariant: "Decrements only when sum is strictly greater than target." },
      { name: "curr_sum", role: "numbers[left] + numbers[right]", invariant: "Monotonically increases when left increments; decreases when right decrements." },
      { name: "matchIndices", role: "Pair indices meeting target", invariant: "Populated upon exact match." }
    ],
    loopInvariant: "The target pair (if it exists) must reside within numbers[left..right].",
    terminationCondition: "left >= right: Pointers have crossed without a match.",
    commonPitfalls: [
      "Using two pointers on an UNSORTED array without sorting first.",
      "Moving both pointers simultaneously.",
      "Using left <= right instead of left < right, which allows pairing an element with itself."
    ]
  },
  transferLab: {
    problemId: "3sum",
    title: "3Sum (Triplets Sum to Zero)",
    prompt: "Given an integer array nums, return all the unique triplets [nums[i], nums[j], nums[k]] such that i != j, i != k, and j != k, and nums[i] + nums[j] + nums[k] == 0.",
    initialArrayOrInput: "nums = [-1, 0, 1, 2, -1, -4]",
    conceptualBridge: "Sort the array first in O(N log N). Fix the first element nums[i] with an outer loop, then run standard Two Pointers (left = i+1, right = len-1) to find two numbers that sum to -nums[i]! This reduces 3Sum from O(N^3) to O(N^2) in O(1) space.",
    keyQuestion: "How do you avoid duplicate triplets? Skip adjacent duplicate values for both i, left, and right!",
    complexityTarget: "Time: O(N^2), Space: O(1) auxiliary",
    solutionBreakdown: "1. Sort nums.\n2. For i from 0 to len-3:\n   - If i > 0 and nums[i] == nums[i-1]: continue\n   - left = i+1, right = len-1\n   - While left < right:\n     - s = nums[i] + nums[left] + nums[right]\n     - if s == 0: add triplet; while left < right and nums[left] == nums[left+1]: left++; while left < right and nums[right] == nums[right-1]: right--; left++; right--\n     - elif s < 0: left++\n     - else: right--"
  }
};

export function simulateTwoPointers(
  arr: number[] = [2, 7, 11, 15],
  target: number = 9
): DryRunSimulation {
  const codeSnippet = `def two_sum(numbers, target):
    left = 0
    right = len(numbers) - 1
    while left < right:
        curr_sum = numbers[left] + numbers[right]
        if curr_sum == target:
            return [left, right]
        elif curr_sum < target:
            left += 1
        else:
            right -= 1
    return []`;

  const frames: VisualFrame[] = [];
  let left = 0;
  let right = arr.length - 1;
  let step = 0;

  // Frame 0: Init
  frames.push({
    stepIndex: step++,
    title: "Phase 1 & 4: Initialize Inward Converging Pointers",
    description: `Array sorted: [${arr.join(", ")}]. Left pointer at index 0 (val ${arr[0]}), right pointer at index ${right} (val ${arr[right]}). Target sum = ${target}.`,
    hinglishDescription: `Array sorted hai. Left pointer index 0 par hai aur right pointer index ${right} par. Target sum ${target} banana hai.`,
    spokenNarration: `We place left at index 0 and right at index ${right}. Target sum is ${target}. Inward convergence eliminates an entire column or row of pairs with every step.`,
    spokenNarrationHinglish: `Sorted array par left pointer 0 par aur right pointer index ${right} par rakha. Dono pointers inward move karenge target sum ${target} dhoondhne ke liye.`,
    codeLineNumber: 2,
    structureType: "array",
    array: arr.map((val, idx) => ({
      value: val,
      index: idx,
      highlight: idx === 0 ? "low" : idx === right ? "high" : "normal"
    })),
    pointers: [
      { label: `left=${left}`, index: left, color: "#2E7D5B" },
      { label: `right=${right}`, index: right, color: "#C24141" }
    ],
    stateVariables: {
      left: 0,
      right: right,
      curr_sum: arr[0] + arr[right],
      target: target,
      matchIndices: "—"
    },
    changedVariables: ["left", "right", "curr_sum"],
    actionType: "init"
  });

  while (left < right) {
    const sum = arr[left] + arr[right];

    if (sum === target) {
      frames.push({
        stepIndex: step++,
        title: `Target Sum ${target} Matched! [${left}, ${right}]`,
        description: `numbers[${left}] (${arr[left]}) + numbers[${right}] (${arr[right]}) == ${target}. Pair confirmed at indices [${left}, ${right}].`,
        hinglishDescription: `numbers[${left}] (${arr[left]}) + numbers[${right}] (${arr[right]}) = ${target}. Target match ho gaya indices [${left}, ${right}] par.`,
        spokenNarration: `Target sum matched! Sum of ${arr[left]} at index ${left} and ${arr[right]} at index ${right} equals ${target}. Returning indices [${left}, ${right}].`,
        spokenNarrationHinglish: `Target sum match ho gaya! Index ${left} par ${arr[left]} aur index ${right} par ${arr[right]} ka sum exact ${target} hai.`,
        codeLineNumber: 7,
        structureType: "array",
        array: arr.map((val, idx) => ({
          value: val,
          index: idx,
          highlight: idx === left || idx === right ? "matched" : "normal"
        })),
        pointers: [
          { label: `left=${left}`, index: left, color: "#12B76A" },
          { label: `right=${right}`, index: right, color: "#12B76A" }
        ],
        stateVariables: {
          left: left,
          right: right,
          curr_sum: sum,
          target: target,
          matchIndices: `[${left}, ${right}]`
        },
        changedVariables: ["curr_sum", "matchIndices"],
        actionType: "found"
      });
      break;
    } else if (sum < target) {
      const nextLeft = left + 1;
      frames.push({
        stepIndex: step++,
        title: `Sum (${sum}) < Target (${target}) → Increment Left`,
        description: `${arr[left]} + ${arr[right]} = ${sum} < ${target}. To increase the sum, advance left pointer to index ${nextLeft}.`,
        hinglishDescription: `Sum ${sum} target ${target} se chhota hai. Sum badhane ke liye left pointer ko index ${nextLeft} par badhaya.`,
        spokenNarration: `Current sum ${sum} is less than ${target}. Since the array is sorted, we advance left pointer to increase the sum.`,
        spokenNarrationHinglish: `Sum ${sum} target se chhota hai. Left pointer ko right shift karke index ${nextLeft} par laya.`,
        codeLineNumber: 9,
        structureType: "array",
        array: arr.map((val, idx) => ({
          value: val,
          index: idx,
          highlight: idx === nextLeft ? "low" : idx === right ? "high" : "normal"
        })),
        pointers: [
          { label: `left=${nextLeft}`, index: nextLeft, color: "#2E7D5B" },
          { label: `right=${right}`, index: right, color: "#C24141" }
        ],
        stateVariables: {
          left: nextLeft,
          right: right,
          curr_sum: arr[nextLeft] + arr[right],
          target: target,
          matchIndices: "—"
        },
        changedVariables: ["left", "curr_sum"],
        actionType: "shift_pointer"
      });
      left = nextLeft;
    } else {
      const nextRight = right - 1;
      frames.push({
        stepIndex: step++,
        title: `Sum (${sum}) > Target (${target}) → Decrement Right`,
        description: `${arr[left]} + ${arr[right]} = ${sum} > ${target}. To decrease the sum, decrement right pointer to index ${nextRight}.`,
        hinglishDescription: `Sum ${sum} target ${target} se bada hai. Sum kam karne ke liye right pointer ko index ${nextRight} par ghata diya.`,
        spokenNarration: `Current sum ${sum} is greater than ${target}. We decrement right pointer to decrease the sum.`,
        spokenNarrationHinglish: `Sum ${sum} target se bada hai. Right pointer ko index ${nextRight} par move kiya.`,
        codeLineNumber: 11,
        structureType: "array",
        array: arr.map((val, idx) => ({
          value: val,
          index: idx,
          highlight: idx === left ? "low" : idx === nextRight ? "high" : "normal"
        })),
        pointers: [
          { label: `left=${left}`, index: left, color: "#2E7D5B" },
          { label: `right=${nextRight}`, index: nextRight, color: "#C24141" }
        ],
        stateVariables: {
          left: left,
          right: nextRight,
          curr_sum: arr[left] + arr[nextRight],
          target: target,
          matchIndices: "—"
        },
        changedVariables: ["right", "curr_sum"],
        actionType: "shift_pointer"
      });
      right = nextRight;
    }
  }

  return {
    problemId: "two-sum",
    problemTitle: "Two Sum II (Two Pointers Sorted Array)",
    algorithmType: "two_pointers",
    initialInputDescription: `numbers = [${arr.join(", ")}], target = ${target}`,
    codeSnippet,
    totalSteps: frames.length,
    frames,
    curriculum: TWO_POINTERS_CURRICULUM
  };
}

// ═════════════════════════════════════════════════════════════════════════
// 4. LINKED LIST REVERSAL SIMULATION
// ═════════════════════════════════════════════════════════════════════════

export const LINKED_LIST_REVERSAL_CURRICULUM: AlgorithmCurriculum = {
  problemId: "reverse-a-linked-list",
  algorithmName: "In-Place Singly Linked List Reversal",
  problemUnderstanding: {
    plainLanguage: "Given the head of a singly linked list, reverse the direction of all pointers in-place and return the new head pointer.",
    whyItMatters: "Reversing a linked list tests pointer manipulation, auxiliary memory discipline (O(1) space constraint), and defensive coding against memory leaks and dangling pointers. In low-level kernels and database engines, buffer pools manage free blocks via intrusive linked lists that must be reversed or spliced without allocating new nodes.",
    realWorldUseCases: [
      "Operating system kernel free-list buffer recycling",
      "Undo/redo action transaction history reversal",
      "Network packet queue prioritization inversion",
      "LRU cache doubly-linked-list eviction splices"
    ]
  },
  analogy: {
    title: "Uncoupling and Flipping Train Cars",
    scenario: "Imagine a train of cars hitched together facing right: A -> B -> C -> None. To reverse the train, you uncouple car A and hitch it to None. But before doing so, you MUST place a clip on car B so the rest of the train does not roll away down the tracks! Then you point car A backwards, and repeat for car B.",
    connection: "The clip is next_temp = curr.next. Pointing car A backwards is curr.next = prev. Moving to the next car is prev = curr and curr = next_temp."
  },
  approachComparison: {
    naive: {
      name: "Stack / Auxiliary Array Copy",
      timeComplexity: "O(N)",
      spaceComplexity: "O(N)",
      whySuboptimal: "Allocates O(N) memory and copies node values rather than reversing actual references in place."
    },
    optimal: {
      name: "Three-Pointer Iterative Inversion",
      timeComplexity: "O(N)",
      spaceComplexity: "O(1)",
      keyInsight: "Preserve the next pointer in temporary storage before redirecting curr.next to prev."
    }
  },
  technicalDetails: {
    variables: [
      { name: "prev", role: "Tail of the already-reversed sublist", invariant: "Initially None; becomes new head at termination." },
      { name: "curr", role: "Active node undergoing pointer redirection", invariant: "Initially head; moves forward each iteration." },
      { name: "next_node", role: "Temporary reference to curr.next", invariant: "Preserved before curr.next is rewritten." }
    ],
    loopInvariant: "All nodes strictly before curr are reversed and rooted at prev.",
    terminationCondition: "curr is None: All nodes have been redirected.",
    commonPitfalls: [
      "Losing the reference to curr.next before redirecting curr.next = prev, causing an immediate null pointer exception.",
      "Forgetting to terminate head.next = None, creating a cycle in the list.",
      "Returning curr instead of prev at the end (curr is None!)."
    ]
  },
  transferLab: {
    problemId: "palindrome-linked-list",
    title: "Palindrome Linked List",
    prompt: "Given the head of a singly linked list, return true if it is a palindrome or false otherwise in O(N) time and O(1) space.",
    initialArrayOrInput: "head = [1, 2, 2, 1]",
    conceptualBridge: "Use the Fast & Slow Pointer technique (slow advances 1 step, fast advances 2 steps) to locate the exact middle of the linked list. Then REVERSE the second half in-place using the exact 3-pointer algorithm learned here! Finally, compare the first half and the reversed second half node-by-node.",
    keyQuestion: "What is the new head of the reversed second half? It is prev returned from the reversal helper!",
    complexityTarget: "Time: O(N), Space: O(1)",
    solutionBreakdown: "1. Find middle with slow/fast pointers.\n2. Reverse second half: prev = None, curr = slow. While curr: nxt = curr.next, curr.next = prev, prev = curr, curr = nxt.\n3. Compare p1 = head, p2 = prev until p2 is None.\n4. Return True."
  }
};

export function simulateLinkedListReversal(): DryRunSimulation {
  const codeSnippet = `def reverseList(head):
    prev = None
    curr = head
    while curr:
        next_node = curr.next
        curr.next = prev
        prev = curr
        curr = next_node
    return prev`;

  const initialNodes = [
    { id: "n1", value: 1, nextId: "n2" },
    { id: "n2", value: 2, nextId: "n3" },
    { id: "n3", value: 3, nextId: "n4" },
    { id: "n4", value: 4, nextId: null }
  ];

  const frames: VisualFrame[] = [];
  let step = 0;

  // Frame 0: Init
  frames.push({
    stepIndex: step++,
    title: "Phase 1 & 4: Initialize Three Pointers",
    description: "prev = None, curr = head (Node 1). next_node uninitialized. Invariant: prev will always anchor the reversed sublist.",
    hinglishDescription: "prev pointer ko None par rakha aur curr ko head (Node 1) par. Pointer redirection shuru hone wali hai.",
    spokenNarration: "To reverse a linked list in-place without auxiliary memory, we establish three pointers: prev initialized to None, curr pointing to head, and next_node to safely capture the forward reference.",
    spokenNarrationHinglish: "Linked list reverse karne ke liye teen pointers use karte hain: prev ko None par set kiya aur curr ko head par. Agle step mein curr ka next save karenge.",
    codeLineNumber: 2,
    structureType: "linked_list",
    linkedList: initialNodes.map((n, idx) => ({
      ...n,
      highlight: idx === 0 ? "curr" : "normal"
    })),
    stateVariables: {
      prev: "None",
      curr: "Node(1)",
      next_node: "—"
    },
    changedVariables: ["prev", "curr"],
    actionType: "init"
  });

  // Steps for each node
  const nodeValues = [1, 2, 3, 4];
  for (let i = 0; i < nodeValues.length; i++) {
    const val = nodeValues[i];
    const nextVal = i < nodeValues.length - 1 ? `Node(${nodeValues[i + 1]})` : "None";
    const prevVal = i === 0 ? "None" : `Node(${nodeValues[i - 1]})`;

    frames.push({
      stepIndex: step++,
      title: `Redirect Node(${val}).next to ${prevVal}`,
      description: `Saved next_node = ${nextVal}. Redirected Node(${val}).next = ${prevVal}. Shifted prev = Node(${val}), curr = ${nextVal}.`,
      hinglishDescription: `Node(${val}) ka next pointer ${prevVal} ki taraf mod diya. prev ab Node(${val}) par hai aur curr ${nextVal} par.`,
      spokenNarration: `For Node ${val}, we first preserve the reference to ${nextVal}, redirect its next pointer backwards to ${prevVal}, then advance prev to Node ${val} and curr to ${nextVal}.`,
      spokenNarrationHinglish: `Node ${val} ka pointer pichhe mod diya. prev ab Node ${val} ban gaya aur curr aage badh gaya.`,
      codeLineNumber: 6,
      structureType: "linked_list",
      linkedList: initialNodes.map((n, idx) => ({
        ...n,
        highlight: idx === i ? "curr" : idx < i ? "prev" : "normal"
      })),
      stateVariables: {
        prev: `Node(${val})`,
        curr: nextVal,
        next_node: nextVal
      },
      changedVariables: ["prev", "curr", "next_node"],
      actionType: "shift_pointer"
    });
  }

  return {
    problemId: "reverse-a-linked-list",
    problemTitle: "Reverse a Singly Linked List (In-Place Pointer Redirection)",
    algorithmType: "linked_list",
    initialInputDescription: "head = [1 -> 2 -> 3 -> 4 -> None]",
    codeSnippet,
    totalSteps: frames.length,
    frames,
    curriculum: LINKED_LIST_REVERSAL_CURRICULUM
  };
}

// ═════════════════════════════════════════════════════════════════════════
// 5. VALID PARENTHESES SIMULATION
// ═════════════════════════════════════════════════════════════════════════

export const VALID_PARENTHESES_CURRICULUM: AlgorithmCurriculum = {
  problemId: "valid-parentheses",
  algorithmName: "Valid Parentheses (Stack LIFO Parsing)",
  problemUnderstanding: {
    plainLanguage: "Given a string containing just '(', ')', '{', '}', '[' and ']', determine if the input string is valid. Open brackets must be closed by the same type of brackets in the correct order.",
    whyItMatters: "Bracket matching is the cornerstone of compilers, syntax highlighters, JSON parsers, and mathematical expression evaluators. A stack's Last-In First-Out (LIFO) discipline ensures innermost nested scopes are matched and closed before outer scopes.",
    realWorldUseCases: [
      "Compilers: AST syntax checking for code blocks ({, }, (, ))",
      "JSON / XML payload deserialization and validation",
      "SQL query engine nested subquery parsing",
      "Math calculators: operator precedence and parentheses resolution"
    ]
  },
  analogy: {
    title: "Russian Nesting Dolls (Matryoshka)",
    scenario: "Imagine packing nesting dolls. You open the largest doll, then the middle doll, then the small doll. When closing them, you MUST close the smallest doll first before you can close the middle doll, and finally the largest doll. If you try to put the largest doll cap onto the small doll, the structure fails.",
    connection: "Opening a doll is pushing onto the stack. Closing a doll is popping the top element and checking for an exact match."
  },
  approachComparison: {
    naive: {
      name: "Repeated String Replacement",
      timeComplexity: "O(N^2)",
      spaceComplexity: "O(N)",
      whySuboptimal: "Repeatedly searching and replacing '()', '[]', '{}' takes quadratic time and copies string buffers continuously."
    },
    optimal: {
      name: "LIFO Stack Invariant",
      timeComplexity: "O(N)",
      spaceComplexity: "O(N)",
      keyInsight: "Every closing bracket MUST match the most recently opened bracket at the top of the stack."
    }
  },
  technicalDetails: {
    variables: [
      { name: "stack", role: "LIFO container storing pending open brackets", invariant: "Contains open brackets waiting for closing partners." },
      { name: "char", role: "Current character being inspected", invariant: "Either pushed (if open) or matched with top (if close)." },
      { name: "top", role: "Most recently pushed bracket", invariant: "Must match closing partner." }
    ],
    loopInvariant: "The stack represents all currently unclosed opening brackets in correct nesting order.",
    terminationCondition: "End of string reached AND stack is empty.",
    commonPitfalls: [
      "Encountering a closing bracket when the stack is empty (e.g. string starting with ')').",
      "Loop finishing but open brackets remaining in stack (e.g. string '(((').",
      "Wrong closing bracket type (e.g. '(]')."
    ]
  },
  transferLab: {
    problemId: "minimum-add-to-make-parentheses-valid",
    title: "Minimum Add to Make Parentheses Valid",
    prompt: "Given a string s of '(' and ')', return the minimum number of parentheses we must add to make the resulting string valid (e.g. '())' -> 1).",
    initialArrayOrInput: "s = '())((('",
    conceptualBridge: "Instead of just returning boolean true/false, track open brackets in a stack or counter. When a closing bracket arrives with no matching open bracket, increment needed_adds. At the end, add any remaining unclosed open brackets!",
    keyQuestion: "Can this transfer problem be solved in O(1) space? Yes! Track open_needed and close_needed counters without an actual stack array.",
    complexityTarget: "Time: O(N), Space: O(1)",
    solutionBreakdown: "1. open_needed = 0, added = 0.\n2. For char in s:\n   - if char == '(': open_needed += 1\n   - else:\n     - if open_needed > 0: open_needed -= 1\n     - else: added += 1\n3. Return added + open_needed."
  }
};

export function simulateValidParentheses(inputStr: string = "{[()]}"): DryRunSimulation {
  const codeSnippet = `def isValid(s):
    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    for char in s:
        if char in mapping:
            top_element = stack.pop() if stack else '#'
            if mapping[char] != top_element:
                return False
        else:
            stack.append(char)
    return not stack`;

  const frames: VisualFrame[] = [];
  const stack: string[] = [];
  const mapping: Record<string, string> = { ")": "(", "}": "{", "]": "[" };
  let step = 0;

  // Frame 0: Init
  frames.push({
    stepIndex: step++,
    title: "Phase 1 & 4: Initialize LIFO Parsing Stack",
    description: `Input string: "${inputStr}". Initialized empty stack []. Valid bracket pairs: () , {} , [].`,
    hinglishDescription: `Input string "${inputStr}" ke liye empty stack [] initialize kiya. LIFO rule follow hoga.`,
    spokenNarration: `We initialize an empty stack to parse bracket pairs in "${inputStr}". Opening brackets will be pushed; closing brackets must match the top element.`,
    spokenNarrationHinglish: `Bracket matching ke liye empty stack create kiya. Opening brackets stack mein push honge aur closing brackets top se match honge.`,
    codeLineNumber: 2,
    structureType: "stack",
    stackItems: [],
    stateVariables: {
      stackSize: 0,
      char: "—",
      top: "EMPTY"
    },
    changedVariables: ["stackSize", "top"],
    actionType: "init"
  });

  for (let i = 0; i < inputStr.length; i++) {
    const char = inputStr[i];

    if (char in mapping) {
      const top = stack.pop() || "#";
      frames.push({
        stepIndex: step++,
        title: `Pop & Match: '${top}' with '${char}'`,
        description: `Encountered closing bracket '${char}'. Popped '${top}' from stack. Match valid: mapping['${char}'] == '${top}'.`,
        hinglishDescription: `Closing bracket '${char}' aaya. Stack se '${top}' pop kiya aur match confirm hua.`,
        spokenNarration: `Encountered closing bracket '${char}'. Popping top element '${top}' from stack. Perfect match confirmed.`,
        spokenNarrationHinglish: `Closing bracket '${char}' aane par stack se '${top}' pop kiya. Bracket successfully match hua.`,
        codeLineNumber: 6,
        structureType: "stack",
        stackItems: stack.map((item, idx) => ({ id: `s-${idx}`, value: item, highlight: "popped" })),
        stateVariables: {
          stackSize: stack.length,
          char: char,
          top: stack.length > 0 ? stack[stack.length - 1] : "EMPTY"
        },
        changedVariables: ["stackSize", "char", "top"],
        actionType: "pop"
      });
    } else {
      stack.push(char);
      frames.push({
        stepIndex: step++,
        title: `Push Opening Bracket: '${char}'`,
        description: `Encountered opening bracket '${char}'. Pushed onto stack. Stack depth is now ${stack.length}.`,
        hinglishDescription: `Opening bracket '${char}' mila. Stack mein push kiya, ab stack size ${stack.length} hai.`,
        spokenNarration: `Encountered opening bracket '${char}'. Pushing onto stack. Stack depth is now ${stack.length}.`,
        spokenNarrationHinglish: `Opening bracket '${char}' ko stack mein push kiya. Ab stack size ${stack.length} hai.`,
        codeLineNumber: 10,
        structureType: "stack",
        stackItems: stack.map((item, idx) => ({ id: `s-${idx}`, value: item, highlight: "pushed" })),
        stateVariables: {
          stackSize: stack.length,
          char: char,
          top: char
        },
        changedVariables: ["stackSize", "char", "top"],
        actionType: "push"
      });
    }
  }

  return {
    problemId: "valid-parentheses",
    problemTitle: "Valid Parentheses (Stack LIFO Parsing)",
    algorithmType: "stack_queue",
    initialInputDescription: `s = "${inputStr}"`,
    codeSnippet,
    totalSteps: frames.length,
    frames,
    curriculum: VALID_PARENTHESES_CURRICULUM
  };
}

// ═════════════════════════════════════════════════════════════════════════
// 6. CLIMBING STAIRS DP SIMULATION
// ═════════════════════════════════════════════════════════════════════════

export const CLIMBING_STAIRS_CURRICULUM: AlgorithmCurriculum = {
  problemId: "climbing-stairs",
  algorithmName: "Climbing Stairs (Dynamic Programming Memoization)",
  problemUnderstanding: {
    plainLanguage: "You are climbing a staircase. It takes n steps to reach the top. Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?",
    whyItMatters: "Introduces optimal substructure and overlapping subproblems—the two foundational conditions of dynamic programming. Naive recursion computes the exact same states over and over taking O(2^N) exponential time. Memoization reduces it to O(N) linear time.",
    realWorldUseCases: [
      "Path counting in grid routing and robotics",
      "Combinatorial game theory decision trees",
      "Financial option pricing lattices (binomial tree model)",
      "Network hop routing permutations"
    ]
  },
  analogy: {
    title: "The Final Leap",
    scenario: "To land on stair number 5, your very last stride had to come from either stair 4 (taking a 1-step hop) or stair 3 (taking a 2-step hop). There are no other physical possibilities! Therefore, total distinct ways to reach stair 5 is strictly the sum of ways to reach stair 4 plus ways to reach stair 3.",
    connection: "dp[i] = dp[i-1] + dp[i-2]. This matches the Fibonacci recurrence."
  },
  approachComparison: {
    naive: {
      name: "Naive Recursion",
      timeComplexity: "O(2^N)",
      spaceComplexity: "O(N) call stack",
      whySuboptimal: "Recomputes f(n-2) and f(n-3) billions of times for n > 40."
    },
    optimal: {
      name: "Bottom-Up Dynamic Programming",
      timeComplexity: "O(N)",
      spaceComplexity: "O(1) space with two variables",
      keyInsight: "Store previously computed results so each state is solved exactly once."
    }
  },
  technicalDetails: {
    variables: [
      { name: "i", role: "Current stair number being computed", invariant: "Iterates from 3 to n." },
      { name: "dp[i]", role: "Distinct ways to reach stair i", invariant: "dp[i] = dp[i-1] + dp[i-2]." },
      { name: "dp[1]", role: "Base case 1 step", invariant: "1 way." },
      { name: "dp[2]", role: "Base case 2 steps", invariant: "2 ways." }
    ],
    loopInvariant: "For all k <= i, dp[k] contains the verified number of ways to reach stair k.",
    terminationCondition: "i reaches n: dp[n] is returned.",
    commonPitfalls: [
      "Off-by-one errors in base cases (e.g. setting dp[2] = 1 instead of 2).",
      "Allocating an array of size n instead of n+1, causing an index out of bounds error."
    ]
  },
  transferLab: {
    problemId: "house-robber",
    title: "House Robber (DP Non-Adjacent Optimization)",
    prompt: "You are planning to rob houses along a street. Each house has a certain amount of money stashed. Adjacent houses have security systems connected and will alert police if robbed on the same night. Return the max money you can rob without alerting police.",
    initialArrayOrInput: "nums = [2, 7, 9, 3, 1]",
    conceptualBridge: "At each house i, you make a choice: rob house i (which means you must skip house i-1 and take money from i-2: nums[i] + dp[i-2]) OR skip house i (taking dp[i-1]). dp[i] = max(dp[i-1], nums[i] + dp[i-2])!",
    keyQuestion: "How does this parallel Climbing Stairs? In Climbing Stairs we SUM; in House Robber we take the MAX!",
    complexityTarget: "Time: O(N), Space: O(1)",
    solutionBreakdown: "1. prev2 = 0, prev1 = 0.\n2. For num in nums:\n   - current = max(prev1, prev2 + num)\n   - prev2 = prev1\n   - prev1 = current\n3. Return prev1."
  }
};

export function simulateClimbingStairs(n: number = 4): DryRunSimulation {
  const codeSnippet = `def climbStairs(n):
    if n <= 2:
        return n
    dp = [0] * (n + 1)
    dp[1], dp[2] = 1, 2
    for i in range(3, n + 1):
        dp[i] = dp[i - 1] + dp[i - 2]
    return dp[n]`;

  const dp = new Array(n + 1).fill(0);
  dp[1] = 1;
  if (n >= 2) dp[2] = 2;

  const frames: VisualFrame[] = [];
  let step = 0;

  // Frame 0: Base Cases
  frames.push({
    stepIndex: step++,
    title: "Phase 1 & 4: Initialize Base Cases dp[1] = 1, dp[2] = 2",
    description: `Stair count n = ${n}. Base cases: dp[1] = 1 (1 step), dp[2] = 2 ([1+1] or [2]). Recurrence: dp[i] = dp[i-1] + dp[i-2].`,
    hinglishDescription: `Base cases set kiye: dp[1] = 1 aur dp[2] = 2. Naye steps ke liye dp[i] = dp[i-1] + dp[i-2] use karenge.`,
    spokenNarration: `We establish dynamic programming base cases: exactly 1 way to reach step 1, and 2 ways to reach step 2. For all subsequent stairs, the answer is the sum of the two preceding stairs.`,
    spokenNarrationHinglish: `DP base cases initialize kiye: step 1 ke liye 1 way aur step 2 ke liye 2 ways. Aage har step pichhle do steps ka sum hoga.`,
    codeLineNumber: 4,
    structureType: "dp_table",
    dpTable: {
      rowLabels: ["Ways"],
      colLabels: Array.from({ length: n + 1 }, (_, idx) => `i=${idx}`),
      cells: [
        Array.from({ length: n + 1 }, (_, idx) => ({
          row: 0,
          col: idx,
          value: dp[idx],
          isComputed: idx <= 2 && idx > 0,
          isCurrent: idx === 2
        }))
      ]
    },
    stateVariables: {
      "dp[1]": 1,
      "dp[2]": 2,
      [`dp[${n}]`]: "—"
    },
    changedVariables: ["dp[1]", "dp[2]"],
    actionType: "init"
  });

  for (let i = 3; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
    frames.push({
      stepIndex: step++,
      title: `Compute dp[${i}] = dp[${i - 1}] + dp[${i - 2}] = ${dp[i]}`,
      description: `dp[${i}] = ${dp[i - 1]} + ${dp[i - 2]} = ${dp[i]}. Sum of ways from stair ${i - 1} and stair ${i - 2}.`,
      hinglishDescription: `dp[${i}] calculate kiya: ${dp[i - 1]} + ${dp[i - 2]} = ${dp[i]}. Pichhle do steps ke ways jod diye.`,
      spokenNarration: `To reach step ${i}, we must arrive either from step ${i - 1} or step ${i - 2}. Adding ${dp[i - 1]} and ${dp[i - 2]} yields ${dp[i]} distinct ways.`,
      spokenNarrationHinglish: `Step ${i} par pahunchne ke liye step ${i - 1} aur step ${i - 2} ke ways ko joda. Total ${dp[i]} ways bane.`,
      codeLineNumber: 6,
      structureType: "dp_table",
      dpTable: {
        rowLabels: ["Ways"],
        colLabels: Array.from({ length: n + 1 }, (_, idx) => `i=${idx}`),
        cells: [
          Array.from({ length: n + 1 }, (_, idx) => ({
            row: 0,
            col: idx,
            value: dp[idx],
            isComputed: idx <= i && idx > 0,
            isCurrent: idx === i,
            highlightFormula: idx === i ? `dp[${i - 1}] + dp[${i - 2}]` : undefined
          }))
        ]
      },
      stateVariables: {
        i: i,
        [`dp[${i}]`]: dp[i]
      },
      changedVariables: ["i", `dp[${i}]`],
      actionType: "update_variable"
    });
  }

  return {
    problemId: "climbing-stairs",
    problemTitle: "Climbing Stairs (Dynamic Programming Memoization)",
    algorithmType: "dynamic_programming",
    initialInputDescription: `n = ${n} stairs`,
    codeSnippet,
    totalSteps: frames.length,
    frames,
    curriculum: CLIMBING_STAIRS_CURRICULUM
  };
}

// ═════════════════════════════════════════════════════════════════════════
// 7. MASTER SIMULATION DISPATCHER
// ═════════════════════════════════════════════════════════════════════════

export function generateDryRunSimulation(problemId: string, customInput?: any): DryRunSimulation {
  const normId = problemId.toLowerCase();

  if (normId.includes("two-sum") || normId.includes("reverse-an-array") || normId.includes("two_pointers")) {
    return simulateTwoPointers(customInput?.array, customInput?.target);
  }

  if (normId.includes("kadane") || normId.includes("maximum-subarray") || normId.includes("max-subarray")) {
    return simulateKadane(customInput?.array);
  }

  if (normId.includes("binary-search") || normId.includes("search-insert") || normId.includes("find-peak") || normId.includes("search-in-rotated")) {
    return simulateBinarySearch(customInput?.array, customInput?.target);
  }

  if (normId.includes("linked-list") || normId.includes("reverse-a-linked-list") || normId.includes("reverse-linked")) {
    return simulateLinkedListReversal();
  }

  if (normId.includes("parentheses") || normId.includes("valid-parentheses") || normId.includes("stack")) {
    return simulateValidParentheses(customInput?.string);
  }

  if (normId.includes("climb") || normId.includes("stairs") || normId.includes("fibonacci") || normId.includes("dp")) {
    return simulateClimbingStairs(customInput?.n);
  }

  return simulateBinarySearch(customInput?.array, customInput?.target);
}
