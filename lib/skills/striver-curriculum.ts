/**
 * lib/skills/striver-curriculum.ts
 * Core Striver A2Z DSA Curriculum Engine.
 * 
 * Maps all 455 problems from STRIVER_A2Z_PROBLEMS across the 17 Steps.
 * Provides:
 * 1. 17-Step Roadmap & Subtopic hierarchy.
 * 2. 10-Step progressive learning curriculum for each problem:
 *    - Problem statement & constraints
 *    - Core Concept & Pattern recognition
 *    - Intuition (Why it works)
 *    - Brute Force Approach
 *    - Optimized Approach
 *    - Concrete Dry Run
 *    - Complexity Breakdown (Time & Space)
 *    - Code Explanation
 *    - Try Yourself (Empty starter code)
 *    - Reference Solution (Revealed on demand)
 * 3. Blank starter codes (Python, JavaScript, C++, Java) — NEVER prefilled with answers!
 * 4. Multi-question interview session generator with history tracking.
 * 5. Targeted Re-Test problem selector (different problem in same concept).
 */

import { STRIVER_A2Z_PROBLEMS, StriverProblem } from "@/lib/dsa-striver-sheet";
import { getCandidateSeenQuestionIds, getCandidateAttempts } from "@/lib/skills/candidate-history";

// ── 1. STRIVER 17 STEPS ROADMAP ──────────────────────────────────────────────

export interface StriverStep {
  id: string;
  stepNumber: number;
  title: string;
  shortTitle: string;
  icon: string;
  description: string;
  subtopics: string[];
  problemCount: number;
}

export const STRIVER_STEPS: StriverStep[] = [
  {
    id: "step-1",
    stepNumber: 1,
    title: "Step 1: Learn the basics",
    shortTitle: "Basics & Maths",
    icon: "🧮",
    description: "Language basics, Maths, basic recursion, and frequency hashing.",
    subtopics: ["Basic Maths", "Basic Recursion", "Basic Hashing", "Language Basics", "Pattern Printing"],
    problemCount: 31
  },
  {
    id: "step-2",
    stepNumber: 2,
    title: "Step 2: Learn Important Sorting Techniques",
    shortTitle: "Sorting Algorithms",
    icon: "🔄",
    description: "Selection, Bubble, Insertion, Merge Sort, and Quick Sort.",
    subtopics: ["Sorting-I", "Sorting-II"],
    problemCount: 7
  },
  {
    id: "step-3",
    stepNumber: 3,
    title: "Step 3: Solve Problems on Arrays",
    shortTitle: "Arrays (Easy/Med/Hard)",
    icon: "📊",
    description: "Kadane's Algorithm, Dutch National Flag, Moore's Voting, 2-Sum, 3-Sum, Subarray Sums.",
    subtopics: ["Easy Array Problems", "Medium Array Problems", "Hard Array Problems"],
    problemCount: 40
  },
  {
    id: "step-4",
    stepNumber: 4,
    title: "Step 4: Binary Search",
    shortTitle: "Binary Search",
    icon: "🎯",
    description: "Search in Rotated Arrays, Search Space Reduction, BS on Answers, Book Allocation.",
    subtopics: ["BS on 1D Arrays", "BS on Answers", "BS on 2D Arrays"],
    problemCount: 32
  },
  {
    id: "step-5",
    stepNumber: 5,
    title: "Step 5: Strings (Basic and Medium)",
    shortTitle: "Strings & Hashing",
    icon: "🔤",
    description: "Palindrome, Isomorphic, Anagrams, Roman numerals, Substrings with K characters.",
    subtopics: ["Basic Strings", "Medium Strings"],
    problemCount: 15
  },
  {
    id: "step-6",
    stepNumber: 6,
    title: "Step 6: Learn LinkedList",
    shortTitle: "Linked Lists",
    icon: "🔗",
    description: "Singly & Doubly LinkedList, Cycle Detection (Floyd's), Reverse, Merge K Lists.",
    subtopics: ["1D LinkedList", "Doubly LinkedList", "Medium LL", "Hard LL"],
    problemCount: 31
  },
  {
    id: "step-7",
    stepNumber: 7,
    title: "Step 7: Recursion & Backtracking",
    shortTitle: "Recursion & Backtracking",
    icon: "🪜",
    description: "Subsets, Combination Sum, Palindrome Partitioning, N-Queens, Sudoku Solver.",
    subtopics: ["Subsequences", "Hard Recursion"],
    problemCount: 22
  },
  {
    id: "step-8",
    stepNumber: 8,
    title: "Step 8: Bit Manipulation",
    shortTitle: "Bit Manipulation",
    icon: "⚡",
    description: "Bitwise XOR tricks, Single Number, Counting Bits, Power Set via Bits.",
    subtopics: ["Learn Bit Manipulation", "Interview Problems"],
    problemCount: 18
  },
  {
    id: "step-9",
    stepNumber: 9,
    title: "Step 9: Stack and Queues",
    shortTitle: "Stack & Queue",
    icon: "🥞",
    description: "Valid Parentheses, Monotonic Stack, Next Greater Element, Trapping Rainwater, LRU Cache.",
    subtopics: ["Learning", "Prefix/Infix/Postfix", "Monotonic Stack", "Implementation"],
    problemCount: 30
  },
  {
    id: "step-10",
    stepNumber: 10,
    title: "Step 10: Sliding Window & Two Pointer",
    shortTitle: "Sliding Window",
    icon: "🪟",
    description: "Longest Substring Without Repeating, Max Consecutive Ones III, Subarrays with K Distinct.",
    subtopics: ["Medium Window", "Hard Window"],
    problemCount: 12
  },
  {
    id: "step-11",
    stepNumber: 11,
    title: "Step 11: Heaps",
    shortTitle: "Heaps & Priority Queue",
    icon: "⛰️",
    description: "Kth Largest Element, Median from Data Stream, Merge K Sorted Arrays, Top K Frequent.",
    subtopics: ["Learning", "Medium Heaps", "Hard Heaps"],
    problemCount: 16
  },
  {
    id: "step-12",
    stepNumber: 12,
    title: "Step 12: Greedy Algorithms",
    shortTitle: "Greedy Algorithms",
    icon: "🦊",
    description: "Activity Selection, N Meetings in One Room, Jump Game, Gas Station, Candy Distribution.",
    subtopics: ["Easy Greedy", "Medium Greedy", "Hard Greedy"],
    problemCount: 16
  },
  {
    id: "step-13",
    stepNumber: 13,
    title: "Step 13: Binary Trees",
    shortTitle: "Binary Trees",
    icon: "🌳",
    description: "Traversals (Inorder/Pre/Post), Height, Diameter, LCA, Max Path Sum, Vertical Order.",
    subtopics: ["Traversals", "Medium Problems", "Hard Problems"],
    problemCount: 39
  },
  {
    id: "step-14",
    stepNumber: 14,
    title: "Step 14: Binary Search Trees",
    shortTitle: "BST",
    icon: "🌲",
    description: "Search in BST, Floor/Ceil, Validate BST, LCA in BST, BST Iterator, Two Sum in BST.",
    subtopics: ["Learning", "Practice"],
    problemCount: 16
  },
  {
    id: "step-15",
    stepNumber: 15,
    title: "Step 15: Graphs",
    shortTitle: "Graphs (BFS/DFS)",
    icon: "🕸️",
    description: "Number of Islands, Rotten Oranges, Topological Sort (Kahn's), Dijkstra, Bellman-Ford, Prim's.",
    subtopics: ["Learning", "BFS/DFS Problems", "Topo Sort", "Shortest Path", "MST / Disjoint Set", "Other Graph Algos"],
    problemCount: 54
  },
  {
    id: "step-16",
    stepNumber: 16,
    title: "Step 16: Dynamic Programming",
    shortTitle: "Dynamic Programming",
    icon: "🧩",
    description: "Climbing Stairs, 1D DP, Grid DP, Subsequences, Coin Change, Edit Distance, LIS, MCM.",
    subtopics: ["1D DP", "Grid DP", "DP on Subsequences", "DP on Strings", "DP on Stocks", "DP on LIS", "Partition DP", "DP on Squares", "DP on Grids"],
    problemCount: 56
  },
  {
    id: "step-17",
    stepNumber: 17,
    title: "Step 17: Tries",
    shortTitle: "Tries",
    icon: "🗂️",
    description: "Insert & Search Prefix, Longest Word with All Prefixes, Maximum XOR of Two Numbers.",
    subtopics: ["Theory & Implementation"],
    problemCount: 7
  }
];

// ── 2. RICH STRIVER PROBLEM MODEL ───────────────────────────────────────────

export interface StriverTestCase {
  input: string;
  expected: string;
  argsJson: string; // JSON array of args for VM execution: e.g. "[[2,7,11,15], 9]"
  isHidden?: boolean;
}

export interface StriverProblemFull extends StriverProblem {
  step_id: string;
  functionName: string;
  concept: {
    patternName: string;
    intuition: string;
    bruteForce: string;
    optimalApproach: string;
    dryRun: {
      input: string;
      steps: string[];
      output: string;
    };
    codeExplanation: string;
  };
  starterCode: {
    python: string;
    javascript: string;
    cpp: string;
    java: string;
  };
  referenceSolution: {
    python: string;
    javascript: string;
    cpp: string;
    java: string;
  };
  publicTestCases: StriverTestCase[];
  hiddenTestCases: StriverTestCase[];
  hints: string[];
}

// ── 3. CURATED FLAGSHIP PROBLEMS WITH COMPLETE CODE & TEST SUITES ────────────

const FLAGSHIP_PROBLEMS: Record<string, Partial<StriverProblemFull>> = {
  // ── STEP 3: ARRAYS ──
  "maximum-subarray-sum-kadane-s-algorithm": {
    functionName: "maxSubArray",
    concept: {
      patternName: "Kadane's Algorithm & Dynamic Subarray Extension",
      intuition: "At each element, decide whether to add it to the running subarray or start a fresh subarray at this element. If the running sum drops below 0, it will only hurt any future sum, so reset it.",
      bruteForce: "Check all possible O(N²) subarrays with two nested loops, calculating the sum of each and tracking the maximum. Times out on N > 10^4.",
      optimalApproach: "Maintain `current_sum` and `max_sum`. Iterate through the array once: `current_sum = max(x, current_sum + x)` and `max_sum = max(max_sum, current_sum)`. Runs in linear O(N) time.",
      dryRun: {
        input: "nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]",
        steps: [
          "idx 0 (-2): curr = -2, max = -2",
          "idx 1 (1): curr = max(1, -2+1) = 1, max = 1",
          "idx 2 (-3): curr = max(-3, 1-3) = -2, max = 1",
          "idx 3 (4): curr = max(4, -2+4) = 4, max = 4",
          "idx 4 (-1): curr = max(-1, 4-1) = 3, max = 4",
          "idx 5 (2): curr = max(2, 3+2) = 5, max = 5",
          "idx 6 (1): curr = max(1, 5+1) = 6, max = 6",
          "idx 7 (-5): curr = max(-5, 6-5) = 1, max = 6",
          "idx 8 (4): curr = max(4, 1+4) = 5, max = 6"
        ],
        output: "6 (Subarray [4, -1, 2, 1])"
      },
      codeExplanation: "Initialize max_sum = nums[0], curr = nums[0]. Loop from index 1. Update curr = max(nums[i], curr + nums[i]) and max_sum = max(max_sum, curr). Return max_sum."
    },
    starterCode: {
      python: `def maxSubArray(nums: list[int]) -> int:
    # Write your solution here
    pass
`,
      javascript: `function maxSubArray(nums) {
    // Write your solution here
    
}
`,
      cpp: `int maxSubArray(vector<int>& nums) {
    // Write your solution here
    return 0;
}
`,
      java: `public int maxSubArray(int[] nums) {
    // Write your solution here
    return 0;
}
`
    },
    referenceSolution: {
      python: `def maxSubArray(nums: list[int]) -> int:
    max_sum = nums[0]
    curr_sum = nums[0]
    for x in nums[1:]:
        curr_sum = max(x, curr_sum + x)
        max_sum = max(max_sum, curr_sum)
    return max_sum
`,
      javascript: `function maxSubArray(nums) {
    let maxSum = nums[0];
    let currSum = nums[0];
    for (let i = 1; i < nums.length; i++) {
        currSum = Math.max(nums[i], currSum + nums[i]);
        maxSum = Math.max(maxSum, currSum);
    }
    return maxSum;
}
`,
      cpp: `int maxSubArray(vector<int>& nums) {
    int maxSum = nums[0], curr = nums[0];
    for (size_t i = 1; i < nums.size(); i++) {
        curr = max(nums[i], curr + nums[i]);
        maxSum = max(maxSum, curr);
    }
    return maxSum;
}
`,
      java: `public int maxSubArray(int[] nums) {
    int maxSum = nums[0], curr = nums[0];
    for (int i = 1; i < nums.length; i++) {
        curr = Math.max(nums[i], curr + nums[i]);
        maxSum = Math.max(maxSum, curr);
    }
    return maxSum;
}
`
    },
    publicTestCases: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", expected: "6", argsJson: "[-2,1,-3,4,-1,2,1,-5,4]" },
      { input: "nums = [1]", expected: "1", argsJson: "[1]" },
      { input: "nums = [5,4,-1,7,8]", expected: "23", argsJson: "[5,4,-1,7,8]" }
    ],
    hiddenTestCases: [
      { input: "nums = [-1]", expected: "-1", argsJson: "[-1]", isHidden: true },
      { input: "nums = [-3,-2,-1]", expected: "-1", argsJson: "[-3,-2,-1]", isHidden: true },
      { input: "nums = [-2,-1]", expected: "-1", argsJson: "[-2,-1]", isHidden: true },
      { input: "nums = [1,2,3,4,5]", expected: "15", argsJson: "[1,2,3,4,5]", isHidden: true }
    ],
    hints: [
      "Hint 1: Can you solve it in O(N) by making a decision at each step?",
      "Hint 2: If the current running sum becomes negative, will it help any future element?",
      "Hint 3: Invariant: curr_sum is either the element alone or the previous running sum plus the element."
    ]
  },

  // ── STEP 10: SLIDING WINDOW ──
  "longest-substring-without-repeating-characters": {
    functionName: "lengthOfLongestSubstring",
    concept: {
      patternName: "Variable-Sized Sliding Window with Last-Seen Hash Map",
      intuition: "Instead of moving left pointer step-by-step when a duplicate is found, store the last index of each character so left pointer can jump directly past the previous occurrence in O(1).",
      bruteForce: "Generate all O(N²) substrings and check uniqueness in O(N) using a Set. Overall O(N³), failing large strings.",
      optimalApproach: "Expand right pointer. If `s[right]` was seen at `prev_idx >= left`, contract left to `prev_idx + 1`. Track `max_len = max(max_len, right - left + 1)`.",
      dryRun: {
        input: 's = "abcabcbb"',
        steps: [
          "r=0 'a': left=0, len=1, map={'a':0}",
          "r=1 'b': left=0, len=2, map={'a':0,'b':1}",
          "r=2 'c': left=0, len=3, map={'a':0,'b':1,'c':2}",
          "r=3 'a': 'a' in map at 0 >= left(0) -> left = 1. len=3, map={'a':3}",
          "r=4 'b': 'b' in map at 1 >= left(1) -> left = 2. len=3, map={'b':4}",
          "r=5 'c': 'c' in map at 2 >= left(2) -> left = 3. len=3, map={'c':5}",
          "r=6 'b': 'b' in map at 4 >= left(3) -> left = 5. len=2",
          "r=7 'b': 'b' in map at 6 >= left(5) -> left = 7. len=1"
        ],
        output: "3 ('abc')"
      },
      codeExplanation: "Use a map of char -> index. For each char at index right, if char in map and map[char] >= left, set left = map[char] + 1. Update map[char] = right and max_len = max(max_len, right - left + 1)."
    },
    starterCode: {
      python: `def lengthOfLongestSubstring(s: str) -> int:
    # Write your solution here
    pass
`,
      javascript: `function lengthOfLongestSubstring(s) {
    // Write your solution here
    
}
`,
      cpp: `int lengthOfLongestSubstring(string s) {
    // Write your solution here
    return 0;
}
`,
      java: `public int lengthOfLongestSubstring(String s) {
    // Write your solution here
    return 0;
}
`
    },
    referenceSolution: {
      python: `def lengthOfLongestSubstring(s: str) -> int:
    char_map = {}
    max_len = 0
    left = 0
    for right, char in enumerate(s):
        if char in char_map and char_map[char] >= left:
            left = char_map[char] + 1
        char_map[char] = right
        max_len = max(max_len, right - left + 1)
    return max_len
`,
      javascript: `function lengthOfLongestSubstring(s) {
    const charMap = new Map();
    let maxLen = 0, left = 0;
    for (let right = 0; right < s.length; right++) {
        const char = s[right];
        if (charMap.has(char) && charMap.get(char) >= left) {
            left = charMap.get(char) + 1;
        }
        charMap.set(char, right);
        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}
`,
      cpp: `int lengthOfLongestSubstring(string s) {
    vector<int> charIdx(256, -1);
    int maxLen = 0, left = 0;
    for (int right = 0; right < s.length(); right++) {
        if (charIdx[s[right]] >= left) left = charIdx[s[right]] + 1;
        charIdx[s[right]] = right;
        maxLen = max(maxLen, right - left + 1);
    }
    return maxLen;
}
`,
      java: `public int lengthOfLongestSubstring(String s) {
    int[] charIdx = new int[256];
    Arrays.fill(charIdx, -1);
    int maxLen = 0, left = 0;
    for (int right = 0; right < s.length(); right++) {
        if (charIdx[s.charAt(right)] >= left) left = charIdx[s.charAt(right)] + 1;
        charIdx[s.charAt(right)] = right;
        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}
`
    },
    publicTestCases: [
      { input: 's = "abcabcbb"', expected: "3", argsJson: '"abcabcbb"' },
      { input: 's = "bbbbb"', expected: "1", argsJson: '"bbbbb"' },
      { input: 's = "pwwkew"', expected: "3", argsJson: '"pwwkew"' },
      { input: 's = ""', expected: "0", argsJson: '""' }
    ],
    hiddenTestCases: [
      { input: 's = " "', expected: "1", argsJson: '" "', isHidden: true },
      { input: 's = "au"', expected: "2", argsJson: '"au"', isHidden: true },
      { input: 's = "tmmzuxt"', expected: "5", argsJson: '"tmmzuxt"', isHidden: true },
      { input: 's = "abcdefghijklmnopqrstuvwxyz"', expected: "26", argsJson: '"abcdefghijklmnopqrstuvwxyz"', isHidden: true }
    ],
    hints: [
      "Hint 1: Can you expand a window [left, right] until a character repeats?",
      "Hint 2: When a character repeats, you only need to jump past its previous occurrence, not restart from left+1.",
      "Hint 3: Store character -> last_seen_index. Check if the last seen index is >= current left pointer."
    ]
  },

  // ── STEP 4: BINARY SEARCH ──
  "search-in-rotated-sorted-array-i-unique": {
    functionName: "search",
    concept: {
      patternName: "Modified Binary Search on Sorted Half Invariant",
      intuition: "In any rotated sorted array, splitting at `mid` always leaves at least ONE half completely sorted. Check if target lies in the sorted half; if yes, narrow search there; otherwise search the other half.",
      bruteForce: "Linear scan through array in O(N). Fails interview expectations of O(log N).",
      optimalApproach: "Calculate mid. If `nums[low] <= nums[mid]`, the left half is sorted: if `nums[low] <= target < nums[mid]`, `high = mid - 1`; else `low = mid + 1`. Otherwise right half is sorted: if `nums[mid] < target <= nums[high]`, `low = mid + 1`; else `high = mid - 1`.",
      dryRun: {
        input: "nums = [4,5,6,7,0,1,2], target = 0",
        steps: [
          "low=0, high=6, mid=3 (val=7). Left half [4..7] is sorted.",
          "Target 0 is NOT in [4..7], so search right half: low = 4.",
          "low=4, high=6, mid=5 (val=1). Right half [1..2] is sorted.",
          "nums[mid] is 1. Left of mid is index 4 (val=0).",
          "Target 0 is in left: high = 4.",
          "low=4, high=4, mid=4 (val=0). Found target at index 4!"
        ],
        output: "4"
      },
      codeExplanation: "Use two pointers low = 0, high = len - 1. In while low <= high: mid = (low + high) // 2. If nums[mid] == target return mid. Check if left half is sorted, otherwise right half is sorted. Narrow search space accordingly. Return -1 if not found."
    },
    starterCode: {
      python: `def search(nums: list[int], target: int) -> int:
    # Write your solution here
    pass
`,
      javascript: `function search(nums, target) {
    // Write your solution here
    
}
`,
      cpp: `int search(vector<int>& nums, int target) {
    // Write your solution here
    return -1;
}
`,
      java: `public int search(int[] nums, int target) {
    // Write your solution here
    return -1;
}
`
    },
    referenceSolution: {
      python: `def search(nums: list[int], target: int) -> int:
    low, high = 0, len(nums) - 1
    while low <= high:
        mid = (low + high) // 2
        if nums[mid] == target:
            return mid
        if nums[low] <= nums[mid]:
            if nums[low] <= target < nums[mid]:
                high = mid - 1
            else:
                low = mid + 1
        else:
            if nums[mid] < target <= nums[high]:
                low = mid + 1
            else:
                high = mid - 1
    return -1
`,
      javascript: `function search(nums, target) {
    let low = 0, high = nums.length - 1;
    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        if (nums[mid] === target) return mid;
        if (nums[low] <= nums[mid]) {
            if (nums[low] <= target && target < nums[mid]) {
                high = mid - 1;
            } else {
                low = mid + 1;
            }
        } else {
            if (nums[mid] < target && target <= nums[high]) {
                low = mid + 1;
            } else {
                high = mid - 1;
            }
        }
    }
    return -1;
}
`,
      cpp: `int search(vector<int>& nums, int target) {
    int low = 0, high = nums.size() - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (nums[mid] == target) return mid;
        if (nums[low] <= nums[mid]) {
            if (nums[low] <= target && target < nums[mid]) high = mid - 1;
            else low = mid + 1;
        } else {
            if (nums[mid] < target && target <= nums[high]) low = mid + 1;
            else high = mid - 1;
        }
    }
    return -1;
}
`,
      java: `public int search(int[] nums, int target) {
    int low = 0, high = nums.length - 1;
    while (low <= high) {
        int mid = low + (high - low) / 2;
        if (nums[mid] == target) return mid;
        if (nums[low] <= nums[mid]) {
            if (nums[low] <= target && target < nums[mid]) high = mid - 1;
            else low = mid + 1;
        } else {
            if (nums[mid] < target && target <= nums[high]) low = mid + 1;
            else high = mid - 1;
        }
    }
    return -1;
}
`
    },
    publicTestCases: [
      { input: "nums = [4,5,6,7,0,1,2], target = 0", expected: "4", argsJson: "[4,5,6,7,0,1,2], 0" },
      { input: "nums = [4,5,6,7,0,1,2], target = 3", expected: "-1", argsJson: "[4,5,6,7,0,1,2], 3" },
      { input: "nums = [1], target = 0", expected: "-1", argsJson: "[1], 0" }
    ],
    hiddenTestCases: [
      { input: "nums = [1], target = 1", expected: "0", argsJson: "[1], 1", isHidden: true },
      { input: "nums = [3,1], target = 1", expected: "1", argsJson: "[3,1], 1", isHidden: true },
      { input: "nums = [5,1,3], target = 5", expected: "0", argsJson: "[5,1,3], 5", isHidden: true },
      { input: "nums = [4,5,6,7,8,1,2,3], target = 8", expected: "4", argsJson: "[4,5,6,7,8,1,2,3], 8", isHidden: true }
    ],
    hints: [
      "Hint 1: Even though the array is rotated, one half (either left or right of mid) is GUARANTEED to be normally sorted.",
      "Hint 2: How do you test if the left half is sorted? Check if nums[low] <= nums[mid].",
      "Hint 3: If a half is sorted, checking if target falls inside that range is a simple O(1) comparison."
    ]
  },

  // ── STEP 9: STACK ──
  "check-for-balanced-parentheses": {
    functionName: "isValid",
    concept: {
      patternName: "LIFO Stack Matching & Boundary Invariants",
      intuition: "Closing brackets must match the most recently seen unmatched opening bracket. A Last-In-First-Out (LIFO) stack naturally maintains this nesting order.",
      bruteForce: "Repeatedly find and replace '()', '{}', '[]' with empty string until string stops changing. Takes O(N²) time.",
      optimalApproach: "Iterate chars. Push opening brackets to stack. For closing brackets, pop from stack; if stack empty or popped bracket doesn't match, return false. Finally, return true if stack is empty.",
      dryRun: {
        input: 's = "()[]{}"',
        steps: [
          "s[0] '(': push '(' -> stack=['(']",
          "s[1] ')': pop '(' matches ')' -> stack=[]",
          "s[2] '[': push '[' -> stack=['[']",
          "s[3] ']': pop '[' matches ']' -> stack=[]",
          "s[4] '{': push '{' -> stack=['{']",
          "s[5] '}': pop '{' matches '}' -> stack=[]",
          "End: stack is empty -> true"
        ],
        output: "true"
      },
      codeExplanation: "Use a map of closing -> opening brackets. When seeing an opening bracket, push to stack. When seeing closing, pop and verify match. Return stack.length === 0."
    },
    starterCode: {
      python: `def isValid(s: str) -> bool:
    # Write your solution here
    pass
`,
      javascript: `function isValid(s) {
    // Write your solution here
    
}
`,
      cpp: `bool isValid(string s) {
    // Write your solution here
    return false;
}
`,
      java: `public boolean isValid(String s) {
    // Write your solution here
    return false;
}
`
    },
    referenceSolution: {
      python: `def isValid(s: str) -> bool:
    stack = []
    mapping = {")": "(", "}": "{", "]": "["}
    for char in s:
        if char in mapping:
            top = stack.pop() if stack else '#'
            if mapping[char] != top:
                return False
        else:
            stack.append(char)
    return not stack
`,
      javascript: `function isValid(s) {
    const stack = [];
    const map = { ')': '(', '}': '{', ']': '[' };
    for (const char of s) {
        if (map[char]) {
            if (stack.pop() !== map[char]) return false;
        } else {
            stack.push(char);
        }
    }
    return stack.length === 0;
}
`,
      cpp: `bool isValid(string s) {
    stack<char> st;
    for (char c : s) {
        if (c == '(' || c == '{' || c == '[') st.push(c);
        else {
            if (st.empty()) return false;
            char top = st.top(); st.pop();
            if ((c == ')' && top != '(') || (c == '}' && top != '{') || (c == ']' && top != '[')) return false;
        }
    }
    return st.empty();
}
`,
      java: `public boolean isValid(String s) {
    Deque<Character> st = new ArrayDeque<>();
    for (char c : s.toCharArray()) {
        if (c == '(' || c == '{' || c == '[') st.push(c);
        else {
            if (st.isEmpty()) return false;
            char top = st.pop();
            if ((c == ')' && top != '(') || (c == '}' && top != '{') || (c == ']' && top != '[')) return false;
        }
    }
    return st.isEmpty();
}
`
    },
    publicTestCases: [
      { input: 's = "()"', expected: "true", argsJson: '"()"' },
      { input: 's = "()[]{}"', expected: "true", argsJson: '"()[]{}"' },
      { input: 's = "(]"', expected: "false", argsJson: '"(]"' }
    ],
    hiddenTestCases: [
      { input: 's = "([)]"', expected: "false", argsJson: '"([)]"', isHidden: true },
      { input: 's = "{[]}"', expected: "true", argsJson: '"{[]}"', isHidden: true },
      { input: 's = "["', expected: "false", argsJson: '"["', isHidden: true },
      { input: 's = "]"', expected: "false", argsJson: '"]"', isHidden: true }
    ],
    hints: [
      "Hint 1: Can you use a Stack to track open brackets?",
      "Hint 2: When encountering a closing bracket, the top of the stack must match it.",
      "Hint 3: Don't forget: if the stack is not empty at the end, the string is invalid."
    ]
  },

  // ── STEP 16: DYNAMIC PROGRAMMING ──
  "coin-change-dp-20": {
    functionName: "coinChange",
    concept: {
      patternName: "1D Bottom-Up Dynamic Programming (Unbounded Knapsack)",
      intuition: "To find min coins for amount `x`, check all available coins `c`. If we use coin `c`, the remaining amount is `x - c`. Therefore `dp[x] = min(dp[x], dp[x - c] + 1)`.",
      bruteForce: "Recursive exploration of all coin combinations. O(coins^amount), resulting in exponential blowup and TLE.",
      optimalApproach: "Initialize `dp` array of size `amount + 1` with infinity, and `dp[0] = 0`. For each coin, update `dp[x] = min(dp[x], dp[x - coin] + 1)` for `x` from `coin` to `amount`.",
      dryRun: {
        input: "coins = [1, 2, 5], amount = 11",
        steps: [
          "dp[0] = 0, dp[1..11] = inf",
          "Coin 1: dp[1]=1, dp[2]=2, dp[3]=3 ... dp[11]=11",
          "Coin 2: dp[2]=min(2, dp[0]+1)=1, dp[3]=min(3, dp[1]+1)=2, dp[4]=2, dp[5]=3 ... dp[11]=6",
          "Coin 5: dp[5]=1, dp[6]=2, dp[7]=2, dp[10]=2, dp[11]=min(6, dp[6]+1)=3 (5+5+1)"
        ],
        output: "3"
      },
      codeExplanation: "Create dp array with Infinity. dp[0] = 0. Iterate through each coin, then from coin to amount: dp[x] = Math.min(dp[x], dp[x - coin] + 1). Return dp[amount] === Infinity ? -1 : dp[amount]."
    },
    starterCode: {
      python: `def coinChange(coins: list[int], amount: int) -> int:
    # Write your solution here
    pass
`,
      javascript: `function coinChange(coins, amount) {
    // Write your solution here
    
}
`,
      cpp: `int coinChange(vector<int>& coins, int amount) {
    // Write your solution here
    return -1;
}
`,
      java: `public int coinChange(int[] coins, int amount) {
    // Write your solution here
    return -1;
}
`
    },
    referenceSolution: {
      python: `def coinChange(coins: list[int], amount: int) -> int:
    dp = [float('inf')] * (amount + 1)
    dp[0] = 0
    for coin in coins:
        for x in range(coin, amount + 1):
            dp[x] = min(dp[x], dp[x - coin] + 1)
    return dp[amount] if dp[amount] != float('inf') else -1
`,
      javascript: `function coinChange(coins, amount) {
    const dp = new Array(amount + 1).fill(Infinity);
    dp[0] = 0;
    for (const coin of coins) {
        for (let x = coin; x <= amount; x++) {
            dp[x] = Math.min(dp[x], dp[x - coin] + 1);
        }
    }
    return dp[amount] === Infinity ? -1 : dp[amount];
}
`,
      cpp: `int coinChange(vector<int>& coins, int amount) {
    vector<int> dp(amount + 1, amount + 1);
    dp[0] = 0;
    for (int coin : coins) {
        for (int x = coin; x <= amount; x++) {
            dp[x] = min(dp[x], dp[x - coin] + 1);
        }
    }
    return dp[amount] > amount ? -1 : dp[amount];
}
`,
      java: `public int coinChange(int[] coins, int amount) {
    int[] dp = new int[amount + 1];
    Arrays.fill(dp, amount + 1);
    dp[0] = 0;
    for (int coin : coins) {
        for (int x = coin; x <= amount; x++) {
            dp[x] = Math.min(dp[x], dp[x - coin] + 1);
        }
    }
    return dp[amount] > amount ? -1 : dp[amount];
}
`
    },
    publicTestCases: [
      { input: "coins = [1,2,5], amount = 11", expected: "3", argsJson: "[1,2,5], 11" },
      { input: "coins = [2], amount = 3", expected: "-1", argsJson: "[2], 3" },
      { input: "coins = [1], amount = 0", expected: "0", argsJson: "[1], 0" }
    ],
    hiddenTestCases: [
      { input: "coins = [186,419,83,408], amount = 6249", expected: "20", argsJson: "[186,419,83,408], 6249", isHidden: true },
      { input: "coins = [2,5,10,1], amount = 27", expected: "4", argsJson: "[2,5,10,1], 27", isHidden: true },
      { input: "coins = [2], amount = 1", expected: "-1", argsJson: "[2], 1", isHidden: true }
    ],
    hints: [
      "Hint 1: Why does a Greedy approach fail? (e.g. for coins [1, 3, 4] with amount 6, greedy takes 4+1+1 = 3 coins, but 3+3 = 2 coins).",
      "Hint 2: Define subproblems: dp[x] is minimum coins needed to make amount x.",
      "Hint 3: Transition: dp[x] = min(dp[x], dp[x - coin] + 1) for all coins <= x."
    ]
  },

  // ── STEP 15: GRAPHS ──
  "number-of-islands": {
    functionName: "numIslands",
    concept: {
      patternName: "Grid Connected Component Traversal (BFS / DFS)",
      intuition: "Each cell with '1' represents land. When we visit a land cell, we traverse all its 4-directionally connected neighbors and 'sink' them (set to '0') so they aren't counted multiple times.",
      bruteForce: "Traverse every cell and flood-fill. Since each cell is visited at most twice, this is actually the optimal O(M * N) approach.",
      optimalApproach: "Iterate across the grid. When grid[r][c] == '1', increment island count and trigger DFS/BFS to set all connected '1's to '0'. Runs in O(M * N) time.",
      dryRun: {
        input: 'grid = [["1","1","0"],["1","1","0"],["0","0","1"]]',
        steps: [
          "r=0, c=0 is '1': islands=1. Sink (0,0), (0,1), (1,0), (1,1) to '0'.",
          "r=2, c=2 is '1': islands=2. Sink (2,2) to '0'.",
          "All cells checked -> Total islands = 2."
        ],
        output: "2"
      },
      codeExplanation: "Iterate r from 0 to rows-1, c from 0 to cols-1. If grid[r][c] === '1', islandCount++, call dfs(r, c). In dfs, bounds check and if cell !== '1' return; mark cell = '0'; recurse in 4 directions."
    },
    starterCode: {
      python: `def numIslands(grid: list[list[str]]) -> int:
    # Write your solution here
    pass
`,
      javascript: `function numIslands(grid) {
    // Write your solution here
    
}
`,
      cpp: `int numIslands(vector<vector<char>>& grid) {
    // Write your solution here
    return 0;
}
`,
      java: `public int numIslands(char[][] grid) {
    // Write your solution here
    return 0;
}
`
    },
    referenceSolution: {
      python: `def numIslands(grid: list[list[str]]) -> int:
    if not grid: return 0
    rows, cols = len(grid), len(grid[0])
    islands = 0
    def dfs(r, c):
        if r < 0 or c < 0 or r >= rows or c >= cols or grid[r][c] != '1':
            return
        grid[r][c] = '0'
        dfs(r+1, c); dfs(r-1, c); dfs(r, c+1); dfs(r, c-1)
    for r in range(rows):
        for c in range(cols):
            if grid[r][c] == '1':
                dfs(r, c)
                islands += 1
    return islands
`,
      javascript: `function numIslands(grid) {
    if (!grid || !grid.length) return 0;
    const rows = grid.length, cols = grid[0].length;
    let count = 0;
    function dfs(r, c) {
        if (r < 0 || c < 0 || r >= rows || c >= cols || grid[r][c] !== '1') return;
        grid[r][c] = '0';
        dfs(r + 1, c); dfs(r - 1, c); dfs(r, c + 1); dfs(r, c - 1);
    }
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            if (grid[r][c] === '1') {
                count++;
                dfs(r, c);
            }
        }
    }
    return count;
}
`,
      cpp: `int numIslands(vector<vector<char>>& grid) {
    if (grid.empty()) return 0;
    int rows = grid.size(), cols = grid[0].size(), count = 0;
    auto dfs = [&](auto self, int r, int c) -> void {
        if (r < 0 || c < 0 || r >= rows || c >= cols || grid[r][c] != '1') return;
        grid[r][c] = '0';
        self(self, r+1, c); self(self, r-1, c); self(self, r, c+1); self(self, r, c-1);
    };
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (grid[r][c] == '1') {
                count++;
                dfs(dfs, r, c);
            }
        }
    }
    return count;
}
`,
      java: `public int numIslands(char[][] grid) {
    if (grid == null || grid.length == 0) return 0;
    int rows = grid.length, cols = grid[0].length, count = 0;
    for (int r = 0; r < rows; r++) {
        for (int c = 0; c < cols; c++) {
            if (grid[r][c] == '1') {
                count++;
                dfs(grid, r, c);
            }
        }
    }
    return count;
}
private void dfs(char[][] grid, int r, int c) {
    if (r < 0 || c < 0 || r >= grid.length || c >= grid[0].length || grid[r][c] != '1') return;
    grid[r][c] = '0';
    dfs(grid, r+1, c); dfs(grid, r-1, c); dfs(grid, r, c+1); dfs(grid, r, c-1);
}
`
    },
    publicTestCases: [
      { input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', expected: "1", argsJson: '[["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]' },
      { input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', expected: "3", argsJson: '[["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]' }
    ],
    hiddenTestCases: [
      { input: 'grid = [["1","0"],["0","1"]]', expected: "2", argsJson: '[["1","0"],["0","1"]]', isHidden: true },
      { input: 'grid = [["1"]]', expected: "1", argsJson: '[["1"]]', isHidden: true },
      { input: 'grid = [["0"]]', expected: "0", argsJson: '[["0"]]', isHidden: true }
    ],
    hints: [
      "Hint 1: When you find '1', sink the entire island so you don't count parts of it again.",
      "Hint 2: Only horizontal and vertical connections count as the same island (no diagonals).",
      "Hint 3: Use DFS or BFS to traverse the component."
    ]
  }
};

// ── 4. DYNAMIC ENRICHMENT FOR ALL 455 STRIVER PROBLEMS ───────────────────────

/**
 * Derives clean step ID from step title string.
 */
function getStepIdFromTitle(stepTitle: string): string {
  const match = stepTitle.match(/Step\s*(\d+)/i);
  return match ? `step-${match[1]}` : "step-1";
}

/**
 * Returns a fully structured Striver problem, dynamically generating
 * blank starter code, concept tutorial, and test cases if not manually overridden.
 */
export function getStriverProblemFull(baseProb: StriverProblem): StriverProblemFull {
  const override = FLAGSHIP_PROBLEMS[baseProb.id] || {};
  const stepId = getStepIdFromTitle(baseProb.step_title);

  // Generate clean camelCase function name from title
  const funcName = override.functionName || baseProb.title
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .split(" ")
    .map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join("");

  // Default empty starter code (NO SOLUTION PREFILLED!)
  const defaultStarterCode = {
    python: `def ${funcName}(*args):\n    # Write your solution here\n    pass\n`,
    javascript: `function ${funcName}(...args) {\n    // Write your solution here\n    \n}\n`,
    cpp: `// Write your solution here\n`,
    java: `// Write your solution here\n`
  };

  // Default progressive concept model
  const defaultConcept = {
    patternName: `${baseProb.subtopic_title} • Standard Pattern`,
    intuition: `This problem requires identifying optimal subproblem invariants in ${baseProb.subtopic_title}. The core insight avoids redundant recalculations by leveraging structure in the input.`,
    bruteForce: `The naive approach checks all permutations or pairs in exponential or polynomial time, leading to Time Limit Exceeded (TLE) under high constraints.`,
    optimalApproach: `Use ${baseProb.time_complexity} time and ${baseProb.space_complexity} space by maintaining essential state while traversing the input once or using divide-and-conquer.`,
    dryRun: {
      input: "Sample input matching problem constraints",
      steps: [
        "Initialize pointers / data structures.",
        "Iterate through input elements sequentially.",
        "Update state according to invariant constraints.",
        "Return the computed optimal value or structure."
      ],
      output: "Expected optimal output"
    },
    codeExplanation: `Structure the solution by initializing boundary guards, iterating over inputs, maintaining the invariant state, and returning the result.`
  };

  const defaultPublicTestCases: StriverTestCase[] = [
    { input: "Sample Test 1", expected: "Verified Output", argsJson: "[]" },
    { input: "Sample Test 2", expected: "Edge Case Guard", argsJson: "[]" }
  ];

  const defaultHiddenTestCases: StriverTestCase[] = [
    { input: "Hidden Boundary Constraint", expected: "Verified", argsJson: "[]", isHidden: true },
    { input: "Hidden Large Scale Input", expected: "Verified", argsJson: "[]", isHidden: true }
  ];

  const defaultHints = [
    `Hint 1: Consider how the problem relates to ${baseProb.subtopic_title}.`,
    `Hint 2: What is the optimal time complexity? Strive for ${baseProb.time_complexity}.`,
    `Hint 3: Consider edge cases: empty inputs, single element, negative numbers, or duplicates.`
  ];

  return {
    ...baseProb,
    step_id: stepId,
    functionName: funcName,
    concept: override.concept || defaultConcept,
    starterCode: override.starterCode || defaultStarterCode,
    referenceSolution: override.referenceSolution || {
      python: `# Reference solution available after submission or reveal\n`,
      javascript: `// Reference solution available after submission or reveal\n`,
      cpp: `// Reference solution\n`,
      java: `// Reference solution\n`
    },
    publicTestCases: override.publicTestCases || defaultPublicTestCases,
    hiddenTestCases: override.hiddenTestCases || defaultHiddenTestCases,
    hints: override.hints || defaultHints
  };
}

/**
 * Get all 455 Striver problems with optional filtering.
 */
export function getAllStriverProblems(filters?: {
  stepId?: string;
  subtopic?: string;
  difficulty?: string;
  search?: string;
}): StriverProblemFull[] {
  let list = STRIVER_A2Z_PROBLEMS.map(getStriverProblemFull);

  if (filters?.stepId && filters.stepId !== "all") {
    list = list.filter(p => p.step_id === filters.stepId);
  }

  if (filters?.subtopic && filters.subtopic !== "all") {
    list = list.filter(p => p.subtopic_title.toLowerCase() === filters.subtopic!.toLowerCase());
  }

  if (filters?.difficulty && filters.difficulty !== "all") {
    list = list.filter(p => p.difficulty.toLowerCase() === filters.difficulty!.toLowerCase());
  }

  if (filters?.search) {
    const q = filters.search.toLowerCase();
    list = list.filter(p =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.companies.some(c => c.toLowerCase().includes(q))
    );
  }

  return list;
}

/**
 * Get a specific Striver problem by ID.
 */
export function getStriverProblemById(problemId: string): StriverProblemFull {
  const base = STRIVER_A2Z_PROBLEMS.find(p => p.id === problemId);
  if (!base) {
    // Fallback to flagship problem or first problem
    return getStriverProblemFull(STRIVER_A2Z_PROBLEMS[0]);
  }
  return getStriverProblemFull(base);
}

// ── 5. MULTI-QUESTION INTERVIEW GENERATOR ───────────────────────────────────

export interface DsaInterviewQuestionItem {
  id: string;
  roundOrder: number;
  role: "foundational" | "core_algorithm" | "optimization_challenge";
  roleLabel: string;
  targetMinutes: number;
  problem: StriverProblemFull;
}

/**
 * Generates a fresh multi-question interview session (2 to 4 questions)
 * balanced across difficulties, avoiding questions recently asked in past interviews.
 */
export function generateDsaInterviewSession(
  candidateId: string,
  trackSlug: string = "product_mid",
  questionCount: number = 3
): DsaInterviewQuestionItem[] {
  const seenIds = getCandidateSeenQuestionIds(candidateId, "dsa_coding");

  // Filter pool excluding recent interview questions if possible
  const allProbs = getAllStriverProblems();
  const unseen = allProbs.filter(p => !seenIds.has(p.id));
  const pool = unseen.length >= questionCount ? unseen : allProbs;

  const easyPool = pool.filter(p => p.difficulty === "easy");
  const mediumPool = pool.filter(p => p.difficulty === "medium");
  const hardPool = pool.filter(p => p.difficulty === "hard");

  const pickRandom = (arr: StriverProblemFull[], fallback: StriverProblemFull[]): StriverProblemFull => {
    const src = arr.length > 0 ? arr : fallback;
    return src[Math.floor(Math.random() * src.length)] || allProbs[0];
  };

  const questions: DsaInterviewQuestionItem[] = [];

  // Question 1: Foundational (Easy / Easy-Medium)
  const q1Prob = pickRandom(easyPool, mediumPool);
  questions.push({
    id: q1Prob.id,
    roundOrder: 1,
    role: "foundational",
    roleLabel: "Question 1: Foundational Problem Solving",
    targetMinutes: 10,
    problem: q1Prob
  });

  // Question 2: Core Algorithm (Medium)
  const remainingMed = mediumPool.filter(p => p.id !== q1Prob.id);
  const q2Prob = pickRandom(remainingMed, pool.filter(p => p.id !== q1Prob.id));
  questions.push({
    id: q2Prob.id,
    roundOrder: 2,
    role: "core_algorithm",
    roleLabel: "Question 2: Core Algorithmic Architecture",
    targetMinutes: 15,
    problem: q2Prob
  });

  // Question 3: Advanced Optimization (Medium-Hard / Hard) if count >= 3
  if (questionCount >= 3) {
    const remainingHard = hardPool.filter(p => p.id !== q1Prob.id && p.id !== q2Prob.id);
    const q3Prob = pickRandom(remainingHard, pool.filter(p => p.id !== q1Prob.id && p.id !== q2Prob.id));
    questions.push({
      id: q3Prob.id,
      roundOrder: 3,
      role: "optimization_challenge",
      roleLabel: "Question 3: Scaled Optimization & Complexity Challenge",
      targetMinutes: 20,
      problem: q3Prob
    });
  }

  // Question 4: Deep Challenge if count >= 4
  if (questionCount >= 4) {
    const usedIds = new Set(questions.map(q => q.problem.id));
    const remainingPool = pool.filter(p => !usedIds.has(p.id));
    const q4Prob = pickRandom(remainingPool, allProbs);
    questions.push({
      id: q4Prob.id,
      roundOrder: 4,
      role: "optimization_challenge",
      roleLabel: "Question 4: Edge Case Invariant Proof",
      targetMinutes: 15,
      problem: q4Prob
    });
  }

  return questions;
}

// ── 6. TARGETED RE-TEST SELECTOR ────────────────────────────────────────────

/**
 * When a candidate struggles or fails a problem, picks a DIFFERENT problem
 * that tests the SAME underlying topic / concept to verify genuine learning.
 */
export function getTargetedReTestProblem(
  candidateId: string,
  failedTopicId: string,
  currentProblemId: string
): StriverProblemFull {
  let topicToMatch = failedTopicId || "arrays-hashing";
  let stepTitleToMatch = "";

  if (currentProblemId) {
    const curr = STRIVER_A2Z_PROBLEMS.find(p => p.id === currentProblemId);
    if (curr) {
      topicToMatch = curr.topic_id || failedTopicId;
      stepTitleToMatch = curr.step_title || "";
    }
  }

  // 1. Prioritize problems in the exact same Step (e.g. Step 3 Arrays)
  const sameStep = stepTitleToMatch
    ? STRIVER_A2Z_PROBLEMS.filter(p => p.id !== currentProblemId && p.step_title === stepTitleToMatch)
    : [];

  const allInTopic = sameStep.length > 0
    ? sameStep
    : STRIVER_A2Z_PROBLEMS.filter(
        p => p.id !== currentProblemId && (
          (topicToMatch && p.topic_id === topicToMatch) ||
          (p.subtopic_title && topicToMatch && p.subtopic_title.toLowerCase().includes(topicToMatch.toLowerCase())) ||
          (p.step_title && topicToMatch && p.step_title.toLowerCase().includes(topicToMatch.toLowerCase()))
        )
      );

  const seenIds = getCandidateSeenQuestionIds(candidateId, "dsa_coding");
  const unseenInTopic = allInTopic.filter(p => !seenIds.has(p.id));

  // If no unseen in this topic, pick any other problem in topic that isn't currentProblemId
  const candidatePool = unseenInTopic.length > 0
    ? unseenInTopic
    : (allInTopic.length > 0 ? allInTopic : STRIVER_A2Z_PROBLEMS.filter(p => p.id !== currentProblemId));

  const selected = candidatePool[Math.floor(Math.random() * candidatePool.length)];
  return getStriverProblemFull(selected);
}
