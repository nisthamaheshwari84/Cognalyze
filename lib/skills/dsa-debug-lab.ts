/**
 * lib/skills/dsa-debug-lab.ts
 * 
 * "Debug This" Lab Engine.
 * 
 * Presents candidates with intentional, realistic bugs commonly seen in interview submissions:
 * - Off-by-one boundary bugs
 * - Integer overflow on mid calculation
 * - Unhandled empty / single-element edge cases
 * - Incorrect base cases in recursion
 * - Pointer desynchronization
 * 
 * Provides:
 * - Buggy code snippet with line numbers
 * - Failing test cases and symptoms
 * - Progressive hint ladder (Tier 1 clue -> Tier 2 line location -> Tier 3 patch explanation)
 * - Automated verification of student patches
 */

export interface DebugChallenge {
  id: string;
  problemId: string;
  problemTitle: string;
  bugType: "off_by_one" | "integer_overflow" | "unhandled_edge_case" | "incorrect_base_case" | "pointer_desync";
  language: "python" | "cpp" | "javascript" | "java";
  buggyCode: string;
  buggyLineNumber: number;
  symptom: string;
  failingTestCase: {
    input: string;
    expected: string;
    actualFaultyOutput: string;
  };
  hints: [string, string, string]; // [Mental Model, Target Area, Concrete Solution]
  correctCode: string;
  explanation: string;
}

const DEBUG_CHALLENGES: Record<string, DebugChallenge> = {
  "binary-search": {
    id: "debug-binary-search-overflow-boundary",
    problemId: "binary-search",
    problemTitle: "Binary Search",
    bugType: "off_by_one",
    language: "python",
    buggyCode: `def search(nums: list[int], target: int) -> int:
    low = 0
    high = len(nums) # BUG: should be len(nums) - 1
    
    while low <= high:
        mid = (low + high) // 2
        if mid >= len(nums): # Patch attempt masking index error
            break
        if nums[mid] == target:
            return mid
        elif nums[mid] < target:
            low = mid + 1
        else:
            high = mid # BUG: should be mid - 1, causing infinite loop when target < nums[mid]
            
    return -1`,
    buggyLineNumber: 3,
    symptom: "Infinite loop or IndexError when searching for target values smaller than existing elements.",
    failingTestCase: {
      input: "nums = [-1, 0, 3, 5, 9, 12], target = 2",
      expected: "-1",
      actualFaultyOutput: "Time Limit Exceeded (Infinite Loop when low=0, high=0, mid=0)"
    },
    hints: [
      "Observe how high is initialized and how it contracts when nums[mid] > target.",
      "Check line 3 and line 14: Is high an inclusive boundary or exclusive boundary? Mixing both creates infinite loops.",
      "Fix: Initialize high = len(nums) - 1 and update high = mid - 1 when target < nums[mid]."
    ],
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
    explanation: "When using the `while low <= high` invariant, both `low` and `high` are inclusive search bounds. Therefore `high` must start at `len(nums) - 1`, and when `nums[mid] > target`, `high` must shrink to `mid - 1` to ensure search space shrinks strictly each turn."
  },
  "two-sum": {
    id: "debug-two-sum-same-element-reuse",
    problemId: "two-sum",
    problemTitle: "Two Sum",
    bugType: "unhandled_edge_case",
    language: "python",
    buggyCode: `def twoSum(nums: list[int], target: int) -> list[int]:
    seen = {}
    # First pass: map every number to its index
    for i, num in enumerate(nums):
        seen[num] = i
        
    # Second pass: find complement
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [i, seen[complement]] # BUG: could pick the same element twice (e.g. target=6, nums[i]=3)
            
    return []`,
    buggyLineNumber: 11,
    symptom: "Returns identical indices [i, i] when an element equals target / 2.",
    failingTestCase: {
      input: "nums = [3, 2, 4], target = 6",
      expected: "[1, 2]",
      actualFaultyOutput: "[0, 0] (element at index 0 used twice)"
    },
    hints: [
      "Can the same element at index i be used to satisfy its own complement?",
      "Check line 11: What happens if target - num == num?",
      "Fix: Ensure seen[complement] != i, or better yet, use a single-pass hash map where you look up prior to inserting."
    ],
    correctCode: `def twoSum(nums: list[int], target: int) -> list[int]:
    seen = {}
    for i, num in enumerate(nums):
        complement = target - num
        if complement in seen:
            return [seen[complement], i]
        seen[num] = i
    return []`,
    explanation: "In two-pass hash map implementations, if `target == 2 * nums[i]`, checking `complement in seen` returns index `i` itself unless explicitly filtered by `seen[complement] != i`. Using a single-pass approach naturally avoids self-pairing."
  },
  "maximum-subarray-sum-kadane-s-algorithm": {
    id: "debug-maximum-subarray",
    problemId: "maximum-subarray-sum-kadane-s-algorithm",
    problemTitle: "Maximum Subarray (Kadane's Algorithm)",
    bugType: "unhandled_edge_case",
    language: "python",
    buggyCode: `def maxSubArray(nums: list[int]) -> int:
    max_sum = 0 # BUG: initialized to 0 instead of float('-inf') or nums[0]
    current_sum = 0
    
    for x in nums:
        current_sum += x
        if current_sum > max_sum:
            max_sum = current_sum
        if current_sum < 0:
            current_sum = 0
            
    return max_sum`,
    buggyLineNumber: 2,
    symptom: "Fails on all-negative arrays (e.g. [-5, -2, -8]), returning 0 instead of the maximum single element -2.",
    failingTestCase: {
      input: "nums = [-5, -2, -8, -1]",
      expected: "-1",
      actualFaultyOutput: "0"
    },
    hints: [
      "What if all numbers in the array are negative?",
      "Check line 2: Initializing max_sum to 0 assumes an empty subarray is allowed, but the problem requires at least one element.",
      "Fix: Initialize max_sum = nums[0] (or float('-inf')) so a negative answer can be properly recognized."
    ],
    correctCode: `def maxSubArray(nums: list[int]) -> int:
    max_sum = nums[0]
    current_sum = 0
    
    for x in nums:
        current_sum = max(x, current_sum + x)
        max_sum = max(max_sum, current_sum)
        
    return max_sum`,
    explanation: "When an array contains only negative integers, the optimal subarray is the maximum single negative integer. Initializing `max_sum = 0` produces a spurious 0 for non-empty subarray requirements."
  }
};

/**
 * Get debug challenge for a problem, or synthesize one if missing.
 */
export function getDebugChallenge(problemId: string, problemTitle?: string): DebugChallenge {
  if (DEBUG_CHALLENGES[problemId]) {
    return DEBUG_CHALLENGES[problemId];
  }

  const title = problemTitle || problemId.replace(/-/g, " ");
  return {
    id: `debug-${problemId}`,
    problemId,
    problemTitle: title,
    bugType: "off_by_one",
    language: "python",
    buggyCode: `def solve(nums: list[int]) -> int:\n    # Simulated bug challenge for ${title}\n    n = len(nums)\n    total = 0\n    for i in range(n + 1): # BUG: IndexError off-by-one\n        total += nums[i]\n    return total`,
    buggyLineNumber: 5,
    symptom: "IndexError: list index out of range on the last iteration.",
    failingTestCase: {
      input: "nums = [1, 2, 3]",
      expected: "6",
      actualFaultyOutput: "IndexError: list index out of range at i=3"
    },
    hints: [
      "Check the loop bounds carefully.",
      "In zero-indexed languages, the last element is at n - 1.",
      "Fix: Change range(n + 1) to range(n)."
    ],
    correctCode: `def solve(nums: list[int]) -> int:\n    n = len(nums)\n    total = 0\n    for i in range(n):\n        total += nums[i]\n    return total`,
    explanation: "Zero-indexed arrays of length n only contain indices 0 through n - 1. Iterating up to n causes an off-by-one index boundary error."
  };
}
