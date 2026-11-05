/**
 * lib/skills/curriculum/subjects/dsa.ts
 * 
 * Data Structures, Algorithms & LeetCode Patterns Curriculum:
 * Arrays, Two Pointers, Sliding Window, Binary Search, Linked Lists,
 * Stacks, Queues, Binary Trees, Graphs (BFS/DFS), Dynamic Programming, and Greedy.
 */

import { CanonicalSubject } from "../types";

export const DSA_SUBJECT: CanonicalSubject = {
  slug: "dsa",
  name: "Data Structures, Algorithms & Patterns",
  icon: "⚡",
  category: "Algorithms",
  tagline: "The 16 Core LeetCode Patterns & Optimal Complexity Proofs",
  description: "Master algorithmic problem solving: Two Pointers, Sliding Window, Binary Search, Linked List reversal, Monotonic Stack, Tree traversals, Graph BFS/DFS, and 2D Dynamic Programming.",
  estimatedHours: 50,
  prerequisites: ["python"],
  chapters: [
    {
      slug: "sliding-window-and-pointers",
      chapterNumber: 1,
      title: "Chapter 1: Two Pointers & Dynamic Sliding Window",
      description: "Master collision pointers, slow/fast runner techniques, and dynamic sliding windows with hash maps.",
      topics: [
        {
          slug: "sliding-window-maximum",
          title: "Sliding Window Maximum & Monotonic Deques",
          summary: "Maintain extremum elements across a moving window in amortized O(1) time per step.",
          subtopics: [
            {
              id: "dsa-101",
              slug: "sliding-window-monotonic-deque",
              title: "Monotonic Queue Pattern: O(N) Sliding Window Maximum",
              subjectSlug: "dsa",
              chapterSlug: "sliding-window-and-pointers",
              topicSlug: "sliding-window-maximum",
              estimatedMinutes: 30,
              difficulty: "advanced",
              canonicalSkill: "dsa",
              prerequisites: [],
              learningGoal: "Implement an amortized O(N) Sliding Window Maximum using a double-ended queue (deque) maintaining monotonic decreasing order.",
              intuitiveStory: "Imagine an office sports team. When a 20-year-old superstar athlete joins, every player older than them who is worse at the game will never be the best player on the team again (they get evicted from the queue).",
              analogy: "A monotonic deque is a line of candidates where newcomers immediately evict any weaker previous candidates.",
              formalConcept: "The naive sliding window checks K elements in O(N * K) time. A monotonic decreasing deque stores indices of candidate maxima. Elements smaller than the incoming element are popped from the back in amortized O(1), and expired indices falling outside [i - k + 1, i] are popped from the front.",
              mathFormula: "T(N) = \\sum_{i=1}^N (O(1) \\text{ push} + O(1) \\text{ amortized pop}) = O(N)",
              productionSignificance: "Real-time rate limiters and financial high-frequency trading market data filters process million-tick streams with sliding window max filters.",
              visualType: "array_pointers",
              mermaidDiagram: `graph LR
    Window["Window [i-k+1 .. i]"] --> Front["Deque Front: Index of MAXIMUM element"]
    Front --> Middle["Middle: Smaller candidate elements"]
    Middle --> Back["Deque Back: New incoming element"]
    Back -- "Evicts all smaller elements from back" --> Clean["Strictly Monotonic Decreasing Order"]`,
              demonstrationSteps: [
                {
                  stepNumber: 1,
                  title: "Monotonic Deque Implementation",
                  explanation: "Uses collections.deque to achieve O(1) appends and pops on both ends.",
                  codeOrQuery: `from collections import deque

def max_sliding_window(nums: list[int], k: int) -> list[int]:
    q = deque() # stores indices
    res = []
    for i, x in enumerate(nums):
        # 1. Remove expired indices from front
        if q and q[0] <= i - k:
            q.popleft()
        # 2. Maintain monotonic decreasing order by popping smaller elements from back
        while q and nums[q[-1]] <= x:
            q.pop()
        q.append(i)
        # 3. Add to result once first window is formed
        if i >= k - 1:
            res.append(nums[q[0]])
    return res

print(max_sliding_window([1, 3, -1, -3, 5, 3, 6, 7], 3))`,
                  outputSummary: "[3, 3, 5, 5, 6, 7]"
                }
              ],
              audioNarrationScript: "The key to solving the sliding window maximum problem in linear time is the monotonic deque. We maintain indices in decreasing order of value. When a new element arrives, any previous smaller elements inside the window can never be the maximum again, so we discard them from the back. The front always points to the window maximum.",
              coBuildSlot: {
                slotId: "dsa-slot-101",
                instruction: "Complete the while loop to evict smaller elements: while q and nums[q[-1]] <= x: q.pop().",
                starterSnippet: `from collections import deque\ndef evict_smaller(q: deque, nums: list[int], x: int):\n    while q and nums[q[-1]] <= x:\n        q.pop()`,
                expectedPattern: "while\\s+q\\s+and\\s+nums\\[q\\[-1\\]\\]\\s*<=\\s*x:\\s*q\\.pop\\(\\)",
                hint1: "Check if q is not empty and the element at index q[-1] is <= x.",
                hint2: "Write: while q and nums[q[-1]] <= x: q.pop()",
                validationExplanation: "Correctly maintains monotonic decreasing invariant."
              },
              executionEnvironment: "python_sandbox",
              starterCodeOrQuery: `from collections import deque

def max_sliding_window(nums: list[int], k: int) -> list[int]:
    q = deque()
    res = []
    for i, x in enumerate(nums):
        if q and q[0] <= i - k:
            q.popleft()
        while q and nums[q[-1]] <= x:
            q.pop()
        q.append(i)
        if i >= k - 1:
            res.append(nums[q[0]])
    return res

nums = [9, 11, 8, 5, 7, 10]
print("Sliding max (k=3):", max_sliding_window(nums, 3))
`,
              debugFault: {
                faultId: "dsa-fault-101",
                title: "Storing Values Instead of Indices Causing Expiration Inaccuracy",
                buggyCodeOrConfig: `from collections import deque
def window_max(nums, k):
    q = deque() # Bug: Storing values prevents knowing when the max leaves the window
    for x in nums:
        while q and q[-1] < x: q.pop()
        q.append(x)
    return list(q)`,
                correctCodeOrConfig: `from collections import deque
def window_max(nums, k):
    q = deque() # Store indices: q[0] <= i - k checks expiration deterministically
    res = []
    for i, x in enumerate(nums):
        if q and q[0] <= i - k: q.popleft()
        while q and nums[q[-1]] <= x: q.pop()
        q.append(i)
        if i >= k - 1: res.append(nums[q[0]])
    return res`,
                diagnosticHint: "Store indices in the deque so you can test q[0] <= i - k to detect when an element has expired.",
                explanation: "Storing indices allows simultaneous lookup of the value (nums[q[0]]) and spatial expiration (q[0] <= i - k)."
              },
              comprehensionChecks: [
                {
                  id: "dsa-cc-101a",
                  question: "Why is the time complexity of the monotonic deque approach O(N) rather than O(N * K)?",
                  options: [
                    "Because each element is pushed into the deque exactly once and popped at most once.",
                    "Because the queue runs on GPU memory.",
                    "Because Python optimizes while loops.",
                    "Because N is always smaller than K."
                  ],
                  correctIndex: 0,
                  explanation: "Across all N iterations, each element index enters the deque once and leaves the deque at most once. The total amortized operations are 2N, which is strictly O(N)."
                }
              ],
              independentChallenge: {
                challengeId: "dsa-chal-101",
                title: "Longest Substring Without Repeating Characters",
                description: "Given a string s, find the length of the longest substring without repeating characters using the dynamic sliding window pattern.",
                starterCode: `def length_of_longest_substring(s: str) -> int:
    char_index = {}
    left = 0
    max_len = 0
    for right, char in enumerate(s):
        if char in char_index and char_index[char] >= left:
            left = char_index[char] + 1
        char_index[char] = right
        max_len = max(max_len, right - left + 1)
    return max_len
`,
                solutionCode: `def length_of_longest_substring(s: str) -> int:
    char_index = {}
    left = 0
    max_len = 0
    for right, char in enumerate(s):
        if char in char_index and char_index[char] >= left:
            left = char_index[char] + 1
        char_index[char] = right
        max_len = max(max_len, right - left + 1)
    return max_len
`,
                testCases: [
                  {
                    input: "s='abcabcbb'",
                    expectedOutput: "3 ('abc')",
                    description: "Returns length of longest distinct character sequence."
                  }
                ],
                rubric: {
                  correctness: 40,
                  codeQuality: 30,
                  efficiency: 30
                }
              }
            }
          ]
        }
      ]
    }
  ]
};

