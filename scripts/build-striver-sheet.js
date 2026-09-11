const fs = require("fs");
const path = require("path");

// Read existing 53 problems from lib/dsa-striver-sheet.ts
const existingContent = fs.readFileSync(path.join(__dirname, "../lib/dsa-striver-sheet.ts"), "utf-8");

// Additional 52 classic Striver A2Z problems with full details
const additionalProblems = [
  // ─── STEP 1: LEARN THE BASICS ───
  {
    id: "count-digits",
    topic_id: "arrays-hashing",
    step_title: "Step 1: Learn the Basics",
    subtopic_title: "Basic Maths for DSA",
    title: "Count Digits in a Number",
    difficulty: "easy",
    problem_url: "https://www.geeksforgeeks.org/problems/count-digits5716/1",
    article_url: "https://takeuforward.org/data-structure/count-digits-in-a-number/",
    companies: ["TCS", "Wipro", "Infosys", "Cognizant"],
    description: "Count the number of digits in an integer N using logarithmic division.",
    markdown_details: `## Problem Statement
Given an integer **N**, write a program to count the number of digits in **N**.

### Examples
\`\`\`text
Input: N = 12345
Output: 5
Explanation: The number 12345 has 5 digits.
\`\`\`

### Striver's Approach & Intuition
Repeatedly divide \`N\` by 10 until \`N == 0\`, incrementing a counter on each step, or compute \`Math.floor(Math.log10(N)) + 1\`.

### Optimal Complexity
- **Time:** \`O(log10(N))\`
- **Space:** \`O(1)\``,
    time_complexity: "O(log10(N))",
    space_complexity: "O(1)",
    order_index: 54,
  },
  {
    id: "reverse-integer",
    topic_id: "arrays-hashing",
    step_title: "Step 1: Learn the Basics",
    subtopic_title: "Basic Maths for DSA",
    title: "Reverse Integer with Overflow Check",
    difficulty: "easy",
    problem_url: "https://leetcode.com/problems/reverse-integer/",
    article_url: "https://takeuforward.org/data-structure/reverse-digits-of-a-number/",
    companies: ["Amazon", "Bloomberg", "Apple", "Google"],
    description: "Reverse digits of a 32-bit signed integer. Return 0 if reversing causes overflow.",
    markdown_details: `## Problem Statement
Given a signed 32-bit integer **x**, return **x** with its digits reversed. If reversing **x** causes the value to go outside the signed 32-bit integer range \`[-2^31, 2^31 - 1]\`, then return \`0\`.

### Examples
\`\`\`text
Input: x = 123
Output: 321
Input: x = -123
Output: -321
\`\`\`

### Optimal Complexity
- **Time:** \`O(log10(X))\`
- **Space:** \`O(1)\``,
    time_complexity: "O(log10(N))",
    space_complexity: "O(1)",
    order_index: 55,
  },
  {
    id: "palindrome-number",
    topic_id: "arrays-hashing",
    step_title: "Step 1: Learn the Basics",
    subtopic_title: "Basic Maths for DSA",
    title: "Palindrome Number",
    difficulty: "easy",
    problem_url: "https://leetcode.com/problems/palindrome-number/",
    article_url: "https://takeuforward.org/data-structure/check-if-a-number-is-palindrome-or-not/",
    companies: ["Amazon", "Microsoft", "Adobe", "Paytm"],
    description: "Check if an integer is a palindrome reading the same backward as forward.",
    markdown_details: `## Problem Statement
Given an integer **x**, return \`true\` if **x** is a palindrome, and \`false\` otherwise. Negative numbers are never palindromes.

### Optimal Complexity
- **Time:** \`O(log10(N))\`
- **Space:** \`O(1)\``,
    time_complexity: "O(log10(N))",
    space_complexity: "O(1)",
    order_index: 56,
  },
  {
    id: "gcd-lcm",
    topic_id: "arrays-hashing",
    step_title: "Step 1: Learn the Basics",
    subtopic_title: "Basic Maths for DSA",
    title: "GCD / Euclidean Algorithm",
    difficulty: "easy",
    problem_url: "https://www.geeksforgeeks.org/problems/lcm-and-gcd4516/1",
    article_url: "https://takeuforward.org/data-structure/find-gcd-of-two-numbers/",
    companies: ["Amazon", "TCS", "Accenture", "Goldman Sachs"],
    description: "Find the Greatest Common Divisor of two numbers using the Euclidean algorithm.",
    markdown_details: `## Problem Statement
Given two positive integers \`a\` and \`b\`, find their Greatest Common Divisor (GCD).

### Striver's Approach & Intuition (Euclidean Algorithm)
\`\`\`ts
function gcd(a: number, b: number): number {
  while (a > 0 && b > 0) {
    if (a > b) a = a % b;
    else b = b % a;
  }
  return a === 0 ? b : a;
}
\`\`\`

### Optimal Complexity
- **Time:** \`O(log(min(a, b)))\`
- **Space:** \`O(1)\``,
    time_complexity: "O(log(min(a, b)))",
    space_complexity: "O(1)",
    order_index: 57,
  },

  // ─── STEP 2: SORTING TECHNIQUES ───
  {
    id: "merge-sort-algorithm",
    topic_id: "arrays-hashing",
    step_title: "Step 2: Learn Important Sorting Techniques",
    subtopic_title: "Sorting Techniques",
    title: "Merge Sort Algorithm",
    difficulty: "medium",
    problem_url: "https://www.geeksforgeeks.org/problems/merge-sort/1",
    article_url: "https://takeuforward.org/data-structure/merge-sort-algorithm/",
    companies: ["Amazon", "Microsoft", "Google", "Paytm"],
    description: "Divide and conquer sorting algorithm with guaranteed O(N log N) runtime.",
    markdown_details: `## Problem Statement
Given an array **arr**, sort the array in non-decreasing order using the **Merge Sort** divide-and-conquer algorithm.

### Optimal Complexity
- **Time:** \`O(N log N)\`
- **Space:** \`O(N)\``,
    time_complexity: "O(N log N)",
    space_complexity: "O(N)",
    order_index: 58,
  },
  {
    id: "quick-sort-algorithm",
    topic_id: "arrays-hashing",
    step_title: "Step 2: Learn Important Sorting Techniques",
    subtopic_title: "Sorting Techniques",
    title: "Quick Sort Algorithm",
    difficulty: "medium",
    problem_url: "https://www.geeksforgeeks.org/problems/quick-sort/1",
    article_url: "https://takeuforward.org/data-structure/quick-sort-algorithm/",
    companies: ["Amazon", "Microsoft", "Goldman Sachs", "VMware"],
    description: "In-place partition sorting algorithm using pivot selection.",
    markdown_details: `## Problem Statement
Implement Quick Sort algorithm using Lomuto or Hoare partitioning to sort an array in-place.

### Optimal Complexity
- **Time:** \`O(N log N)\` average, \`O(N^2)\` worst case
- **Space:** \`O(log N)\` recursion stack`,
    time_complexity: "O(N log N)",
    space_complexity: "O(log N)",
    order_index: 59,
  },

  // ─── STEP 5: STRINGS ───
  {
    id: "reverse-words-in-a-string",
    topic_id: "two-pointers",
    step_title: "Step 5: Strings (Basic and Medium)",
    subtopic_title: "Basic Strings",
    title: "Reverse Words in a String",
    difficulty: "medium",
    problem_url: "https://leetcode.com/problems/reverse-words-in-a-string/",
    article_url: "https://takeuforward.org/data-structure/reverse-words-in-a-string/",
    companies: ["Amazon", "Microsoft", "Google", "Apple", "Flipkart"],
    description: "Reverse the order of words in a string, removing duplicate or trailing spaces.",
    markdown_details: `## Problem Statement
Given an input string **s**, reverse the order of the words. A word is defined as a sequence of non-space characters. Return a string of the words in reverse order concatenated by a single space.

### Examples
\`\`\`text
Input: s = "the sky is blue"
Output: "blue is sky the"
Input: s = "  hello world  "
Output: "world hello"
\`\`\`

### Optimal Complexity
- **Time:** \`O(N)\`
- **Space:** \`O(N)\``,
    time_complexity: "O(N)",
    space_complexity: "O(N)",
    order_index: 60,
  },
  {
    id: "longest-common-prefix",
    topic_id: "two-pointers",
    step_title: "Step 5: Strings (Basic and Medium)",
    subtopic_title: "Basic Strings",
    title: "Longest Common Prefix",
    difficulty: "easy",
    problem_url: "https://leetcode.com/problems/longest-common-prefix/",
    article_url: "https://takeuforward.org/data-structure/longest-common-prefix/",
    companies: ["Amazon", "Google", "Apple", "Adobe"],
    description: "Find the longest common prefix string amongst an array of strings.",
    markdown_details: `## Problem Statement
Write a function to find the longest common prefix string amongst an array of strings. If there is no common prefix, return an empty string \`""\`.

### Optimal Complexity
- **Time:** \`O(N * M)\` (where M is minimum string length)
- **Space:** \`O(1)\``,
    time_complexity: "O(N * M)",
    space_complexity: "O(1)",
    order_index: 61,
  },
  {
    id: "valid-anagram",
    topic_id: "arrays-hashing",
    step_title: "Step 5: Strings (Basic and Medium)",
    subtopic_title: "Basic Strings",
    title: "Valid Anagram",
    difficulty: "easy",
    problem_url: "https://leetcode.com/problems/valid-anagram/",
    article_url: "https://takeuforward.org/data-structure/check-if-two-strings-are-anagrams-of-each-other/",
    companies: ["Google", "Amazon", "Meta", "Bloomberg", "Uber"],
    description: "Determine if two strings are anagrams of each other using 26-element frequency counting.",
    markdown_details: `## Problem Statement
Given two strings **s** and **t**, return \`true\` if **t** is an anagram of **s**, and \`false\` otherwise.

### Optimal Complexity
- **Time:** \`O(N)\`
- **Space:** \`O(1)\` (26 alphabet characters)`,
    time_complexity: "O(N)",
    space_complexity: "O(1)",
    order_index: 62,
  },
  {
    id: "string-to-integer-atoi",
    topic_id: "arrays-hashing",
    step_title: "Step 5: Strings (Basic and Medium)",
    subtopic_title: "Medium Strings",
    title: "String to Integer (atoi)",
    difficulty: "medium",
    problem_url: "https://leetcode.com/problems/string-to-integer-atoi/",
    article_url: "https://takeuforward.org/data-structure/string-to-integer-atoi/",
    companies: ["Amazon", "Microsoft", "Meta", "Apple", "Bloomberg"],
    description: "Convert a string to a 32-bit signed integer handling whitespace, signs, and overflow clamping.",
    markdown_details: `## Problem Statement
Implement the \`myAtoi(string s)\` function, which converts a string to a 32-bit signed integer according to standard C/C++ atoi behavior.

### Optimal Complexity
- **Time:** \`O(N)\`
- **Space:** \`O(1)\``,
    time_complexity: "O(N)",
    space_complexity: "O(1)",
    order_index: 63,
  },
  {
    id: "longest-palindromic-substring",
    topic_id: "dynamic-programming",
    step_title: "Step 5: Strings (Basic and Medium)",
    subtopic_title: "Medium Strings",
    title: "Longest Palindromic Substring",
    difficulty: "medium",
    problem_url: "https://leetcode.com/problems/longest-palindromic-substring/",
    article_url: "https://takeuforward.org/data-structure/longest-palindromic-substring/",
    companies: ["Amazon", "Microsoft", "Google", "Meta", "Adobe", "Flipkart"],
    description: "Find the longest palindromic substring in s using center expansion or DP.",
    markdown_details: `## Problem Statement
Given a string **s**, return the longest palindromic substring in **s**.

### Striver's Approach & Intuition (Expand Around Center)
A palindrome mirrors around its center. There are \`2N - 1\` possible centers (N odd single-char centers, N-1 even double-char centers). Expanding around each center takes O(N), yielding O(N^2) time and O(1) space!

### Optimal Complexity
- **Time:** \`O(N^2)\`
- **Space:** \`O(1)\``,
    time_complexity: "O(N^2)",
    space_complexity: "O(1)",
    order_index: 64,
  },

  // ─── STEP 8: BIT MANIPULATION ───
  {
    id: "power-of-two",
    topic_id: "bit-manipulation",
    step_title: "Step 8: Bit Manipulation",
    subtopic_title: "Learn Bit Manipulation",
    title: "Power of Two",
    difficulty: "easy",
    problem_url: "https://leetcode.com/problems/power-of-two/",
    article_url: "https://takeuforward.org/data-structure/check-if-a-number-is-a-power-of-2-or-not/",
    companies: ["Google", "Amazon", "Apple", "Microsoft"],
    description: "Check if n is a power of two using bitwise (n & (n - 1)) == 0 trick in O(1) time.",
    markdown_details: `## Problem Statement
Given an integer **n**, return \`true\` if it is a power of two. Otherwise, return \`false\`.

### Striver's Approach & Intuition
A power of two in binary has exactly one bit set (e.g., \`4 = 100\`, \`8 = 1000\`).
Subtracting 1 flips all bits up to the lowest set bit (\`4 - 1 = 3 = 011\`).
Therefore: \`n > 0 && (n & (n - 1)) === 0\` returns true if and only if n is a power of two!

### Optimal Complexity
- **Time:** \`O(1)\`
- **Space:** \`O(1)\``,
    time_complexity: "O(1)",
    space_complexity: "O(1)",
    order_index: 65,
  },
  {
    id: "number-of-1-bits",
    topic_id: "bit-manipulation",
    step_title: "Step 8: Bit Manipulation",
    subtopic_title: "Learn Bit Manipulation",
    title: "Number of 1 Bits (Hamming Weight)",
    difficulty: "easy",
    problem_url: "https://leetcode.com/problems/number-of-1-bits/",
    article_url: "https://takeuforward.org/data-structure/count-set-bits-in-an-integer/",
    companies: ["Microsoft", "Apple", "Amazon", "Cisco"],
    description: "Count set bits using Brian Kernighan's bit-clearing algorithm in O(number of set bits).",
    markdown_details: `## Problem Statement
Given a positive integer **n**, write a function that returns the number of set bits it has (also known as the Hamming weight).

### Striver's Approach & Intuition (Brian Kernighan's Algorithm)
In each iteration, perform \`n = n & (n - 1)\`, which clears the lowest set bit. Count how many times loop runs until \`n === 0\`.

### Optimal Complexity
- **Time:** \`O(k)\` where k is number of set bits (\`<= 32\`)
- **Space:** \`O(1)\``,
    time_complexity: "O(k)",
    space_complexity: "O(1)",
    order_index: 66,
  },

  // ─── STEP 11: HEAPS / PRIORITY QUEUES ───
  {
    id: "kth-largest-element-in-array",
    topic_id: "heaps",
    step_title: "Step 11: Heaps & Priority Queues",
    subtopic_title: "Medium Problems",
    title: "Kth Largest Element in an Array",
    difficulty: "medium",
    problem_url: "https://leetcode.com/problems/kth-largest-element-in-an-array/",
    article_url: "https://takeuforward.org/data-structure/kth-largest-smallest-element-in-an-array/",
    companies: ["Amazon", "Meta", "Google", "Microsoft", "Apple", "Goldman Sachs"],
    description: "Find the kth largest element using a Min-Heap of size k or QuickSelect.",
    markdown_details: `## Problem Statement
Given an integer array **nums** and an integer **k**, return the \`k-th\` largest element in the array.

### Optimal Complexity
- **Time:** \`O(N log K)\` (Min-heap of size K) or \`O(N)\` average (QuickSelect)
- **Space:** \`O(K)\``,
    time_complexity: "O(N log K)",
    space_complexity: "O(K)",
    order_index: 67,
  },
  {
    id: "top-k-frequent-elements",
    topic_id: "heaps",
    step_title: "Step 11: Heaps & Priority Queues",
    subtopic_title: "Medium Problems",
    title: "Top K Frequent Elements",
    difficulty: "medium",
    problem_url: "https://leetcode.com/problems/top-k-frequent-elements/",
    article_url: "https://takeuforward.org/data-structure/top-k-frequent-elements/",
    companies: ["Amazon", "Meta", "Google", "Microsoft", "Uber", "Yelp"],
    description: "Find k most frequent elements in array using bucket sort in O(n) time.",
    markdown_details: `## Problem Statement
Given an integer array **nums** and an integer **k**, return the \`k\` most frequent elements. You may return the answer in any order.

### Striver's Approach & Intuition
Count frequencies in a Hash Map. Then use **Bucket Sort**: create an array of buckets where index = frequency. Iterate from highest frequency bucket downwards to collect k elements in linear O(N) time!

### Optimal Complexity
- **Time:** \`O(N)\`
- **Space:** \`O(N)\``,
    time_complexity: "O(N)",
    space_complexity: "O(N)",
    order_index: 68,
  },
  {
    id: "find-median-from-data-stream",
    topic_id: "heaps",
    step_title: "Step 11: Heaps & Priority Queues",
    subtopic_title: "Hard Problems",
    title: "Find Median from Data Stream",
    difficulty: "hard",
    problem_url: "https://leetcode.com/problems/find-median-from-data-stream/",
    article_url: "https://takeuforward.org/data-structure/find-median-from-data-stream/",
    companies: ["Google", "Amazon", "Microsoft", "Meta", "Apple", "Goldman Sachs"],
    description: "Maintain real-time median in data stream using two balanced heaps (Max-Heap and Min-Heap).",
    markdown_details: `## Problem Statement
The median is the middle value in an ordered integer list. Design a data structure that supports adding numbers from a data stream and finding the median of all elements.

### Striver's Approach & Intuition
Maintain two heaps:
- \`maxHeap\` (stores smaller half of numbers)
- \`minHeap\` (stores larger half of numbers)
Keep sizes balanced such that \`maxHeap.size == minHeap.size\` or \`maxHeap.size == minHeap.size + 1\`.

### Optimal Complexity
- **Add Num:** \`O(log N)\`
- **Find Median:** \`O(1)\`
- **Space:** \`O(N)\``,
    time_complexity: "O(log N)",
    space_complexity: "O(N)",
    order_index: 69,
  },

  // ─── STEP 12: GREEDY ALGORITHMS ───
  {
    id: "jump-game",
    topic_id: "greedy",
    step_title: "Step 12: Greedy Algorithms",
    subtopic_title: "Medium & Hard Greedy",
    title: "Jump Game",
    difficulty: "medium",
    problem_url: "https://leetcode.com/problems/jump-game/",
    article_url: "https://takeuforward.org/data-structure/jump-game-i/",
    companies: ["Amazon", "Microsoft", "Google", "Meta", "Apple"],
    description: "Determine if you are able to reach the last index by tracking the maximum reachable index.",
    markdown_details: `## Problem Statement
You are given an integer array **nums**. You are initially positioned at the array's first index, and each element in the array represents your maximum jump length at that position. Return \`true\` if you can reach the last index.

### Striver's Approach & Intuition
Maintain \`maxReach = 0\`. Iterate through array:
- If \`i > maxReach\`, you are stuck! Return false.
- Update \`maxReach = max(maxReach, i + nums[i])\`.
- If \`maxReach >= n - 1\`, return true immediately!

### Optimal Complexity
- **Time:** \`O(N)\`
- **Space:** \`O(1)\``,
    time_complexity: "O(N)",
    space_complexity: "O(1)",
    order_index: 70,
  },
  {
    id: "minimum-platforms",
    topic_id: "greedy",
    step_title: "Step 12: Greedy Algorithms",
    subtopic_title: "Medium & Hard Greedy",
    title: "Minimum Platforms Required",
    difficulty: "medium",
    problem_url: "https://www.geeksforgeeks.org/problems/minimum-platforms-1587115620/1",
    article_url: "https://takeuforward.org/data-structure/minimum-number-of-platforms-required-for-a-railway/",
    companies: ["Amazon", "Microsoft", "Paytm", "Flipkart", "Walmart"],
    description: "Find the minimum number of railway platforms required so that no train waits.",
    markdown_details: `## Problem Statement
Given arrival and departure times of all trains that reach a railway station, find the minimum number of platforms required for the railway station so that no train is kept waiting.

### Striver's Approach & Intuition
Sort arrival array and departure array independently! Use two pointers \`i = 0\` (arrival), \`j = 0\` (departure).
- If \`arr[i] <= dep[j]\`: a train arrived before another left, so platform needed: \`platforms++\`, \`i++\`.
- Else: train departed, platform freed: \`platforms--\`, \`j++\`.
Track maximum platforms needed at any point in time.

### Optimal Complexity
- **Time:** \`O(N log N)\`
- **Space:** \`O(1)\``,
    time_complexity: "O(N log N)",
    space_complexity: "O(1)",
    order_index: 71,
  },

  // ─── STEP 13: BINARY TREES ───
  {
    id: "maximum-depth-of-binary-tree",
    topic_id: "trees",
    step_title: "Step 13: Binary Trees",
    subtopic_title: "Medium Problems",
    title: "Maximum Depth of Binary Tree",
    difficulty: "easy",
    problem_url: "https://leetcode.com/problems/maximum-depth-of-binary-tree/",
    article_url: "https://takeuforward.org/data-structure/maximum-depth-of-a-binary-tree/",
    companies: ["Amazon", "Google", "Microsoft", "Meta", "Apple"],
    description: "Find the maximum depth (height) of binary tree using post-order DFS.",
    markdown_details: `## Problem Statement
Given the \`root\` of a binary tree, return its maximum depth. A binary tree's maximum depth is the number of nodes along the longest path from the root node down to the farthest leaf node.

### Striver's Approach & Intuition
\`\`\`ts
function maxDepth(root: TreeNode | null): number {
  if (!root) return 0;
  return 1 + Math.max(maxDepth(root.left), maxDepth(root.right));
}
\`\`\`

### Optimal Complexity
- **Time:** \`O(N)\`
- **Space:** \`O(H)\``,
    time_complexity: "O(N)",
    space_complexity: "O(H)",
    order_index: 72,
  },
  {
    id: "same-tree",
    topic_id: "trees",
    step_title: "Step 13: Binary Trees",
    subtopic_title: "Medium Problems",
    title: "Same Tree",
    difficulty: "easy",
    problem_url: "https://leetcode.com/problems/same-tree/",
    article_url: "https://takeuforward.org/data-structure/check-if-two-trees-are-identical/",
    companies: ["Amazon", "Google", "Microsoft"],
    description: "Check if two binary trees are structurally identical and have the same node values.",
    markdown_details: `## Problem Statement
Given the roots of two binary trees \`p\` and \`q\`, write a function to check if they are the same or not.

### Optimal Complexity
- **Time:** \`O(N)\`
- **Space:** \`O(H)\``,
    time_complexity: "O(N)",
    space_complexity: "O(H)",
    order_index: 73,
  },
  {
    id: "zigzag-level-order-traversal",
    topic_id: "trees",
    step_title: "Step 13: Binary Trees",
    subtopic_title: "Medium Problems",
    title: "Binary Tree Zigzag Level Order Traversal",
    difficulty: "medium",
    problem_url: "https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/",
    article_url: "https://takeuforward.org/data-structure/zig-zag-traversal-of-binary-tree/",
    companies: ["Amazon", "Microsoft", "Meta", "Flipkart"],
    description: "Traverse binary tree level by level in alternating left-to-right and right-to-left order.",
    markdown_details: `## Problem Statement
Given the \`root\` of a binary tree, return the zigzag level order traversal of its nodes' values (i.e., from left to right, then right to left for the next level and alternate between).

### Optimal Complexity
- **Time:** \`O(N)\`
- **Space:** \`O(N)\``,
    time_complexity: "O(N)",
    space_complexity: "O(N)",
    order_index: 74,
  },
  {
    id: "top-view-of-binary-tree",
    topic_id: "trees",
    step_title: "Step 13: Binary Trees",
    subtopic_title: "Medium Problems",
    title: "Top View of Binary Tree",
    difficulty: "medium",
    problem_url: "https://www.geeksforgeeks.org/problems/top-view-of-binary-tree/1",
    article_url: "https://takeuforward.org/data-structure/top-view-of-a-binary-tree/",
    companies: ["Amazon", "Flipkart", "Paytm", "Samsung"],
    description: "Return nodes visible when viewing the binary tree from the top using vertical coordinates.",
    markdown_details: `## Problem Statement
Given below is a binary tree. The task is to print the top view of binary tree. Top view of a binary tree is the set of nodes visible when the tree is viewed from the top.

### Striver's Approach & Intuition
Perform BFS level order traversal tracking vertical line index \`line\`. Root starts at line 0, left child at \`line - 1\`, right child at \`line + 1\`. Store the FIRST node encountered at each vertical line in a Map.

### Optimal Complexity
- **Time:** \`O(N)\`
- **Space:** \`O(N)\``,
    time_complexity: "O(N)",
    space_complexity: "O(N)",
    order_index: 75,
  },

  // ─── STEP 15: GRAPHS ───
  {
    id: "rotting-oranges",
    topic_id: "graphs",
    step_title: "Step 15: Graphs",
    subtopic_title: "BFS / DFS",
    title: "Rotting Oranges",
    difficulty: "medium",
    problem_url: "https://leetcode.com/problems/rotting-oranges/",
    article_url: "https://takeuforward.org/data-structure/rotten-oranges-min-time-to-rot-all-oranges-bfs/",
    companies: ["Amazon", "Microsoft", "Google", "Uber", "Apple"],
    description: "Calculate minimum minutes until no fresh orange remains using multi-source BFS queue.",
    markdown_details: `## Problem Statement
You are given an \`m x n\` grid where each cell can have one of three values:
- 0: empty cell
- 1: fresh orange
- 2: rotten orange
Every minute, any fresh orange that is 4-directionally adjacent to a rotten orange becomes rotten. Return the minimum number of minutes that must elapse until no cell has a fresh orange. If impossible, return \`-1\`.

### Striver's Approach & Intuition (Multi-Source BFS)
Push all initially rotten oranges \`(r, c, time = 0)\` into a queue. Count total fresh oranges.
Pop from queue, infect 4-directionally adjacent fresh oranges, decrement fresh count, and push with \`time + 1\`.
If fresh count is 0 at the end, return max time; otherwise return -1.

### Optimal Complexity
- **Time:** \`O(M * N)\`
- **Space:** \`O(M * N)\``,
    time_complexity: "O(M * N)",
    space_complexity: "O(M * N)",
    order_index: 76,
  },
  {
    id: "is-graph-bipartite",
    topic_id: "graphs",
    step_title: "Step 15: Graphs",
    subtopic_title: "BFS / DFS",
    title: "Is Graph Bipartite?",
    difficulty: "medium",
    problem_url: "https://leetcode.com/problems/is-graph-bipartite/",
    article_url: "https://takeuforward.org/data-structure/bipartite-graph-dfs-implementation/",
    companies: ["Google", "Meta", "Amazon", "Microsoft"],
    description: "Determine if graph can be colored using two colors such that no adjacent vertices share color.",
    markdown_details: `## Problem Statement
There is an undirected graph with \`n\` nodes. Return \`true\` if and only if it is bipartite. A graph is bipartite if we can partition nodes into two independent sets U and V such that every edge connects between U and V.

### Optimal Complexity
- **Time:** \`O(V + 2E)\`
- **Space:** \`O(V)\``,
    time_complexity: "O(V + E)",
    space_complexity: "O(V)",
    order_index: 77,
  },

  // ─── STEP 16: DYNAMIC PROGRAMMING ───
  {
    id: "house-robber",
    topic_id: "dynamic-programming",
    step_title: "Step 16: Dynamic Programming",
    subtopic_title: "1D DP",
    title: "House Robber",
    difficulty: "medium",
    problem_url: "https://leetcode.com/problems/house-robber/",
    article_url: "https://takeuforward.org/data-structure/maximum-sum-of-non-adjacent-elements-dp-5/",
    companies: ["Amazon", "Google", "Microsoft", "Meta", "Cisco"],
    description: "Maximize stolen loot from non-adjacent houses using state-space recurrence.",
    markdown_details: `## Problem Statement
You are a professional robber planning to rob houses along a street. Each house has a certain amount of money stashed. Adjacent houses have security systems connected, so two adjacent houses cannot be robbed on the same night. Return the maximum amount of money you can rob tonight without alerting the police.

### Striver's Approach & Intuition
At house \`i\`:
- \`rob = nums[i] + prev2\`
- \`skip = prev1\`
- \`curr = max(rob, skip)\`
Keep rolling \`prev2 = prev1\`, \`prev1 = curr\` for O(1) space!

### Optimal Complexity
- **Time:** \`O(N)\`
- **Space:** \`O(1)\``,
    time_complexity: "O(N)",
    space_complexity: "O(1)",
    order_index: 78,
  },
  {
    id: "unique-paths",
    topic_id: "dynamic-programming",
    step_title: "Step 16: Dynamic Programming",
    subtopic_title: "2D / Grid DP",
    title: "Grid Unique Paths",
    difficulty: "medium",
    problem_url: "https://leetcode.com/problems/unique-paths/",
    article_url: "https://takeuforward.org/data-structure/grid-unique-paths-dp-on-grids-dp8/",
    companies: ["Google", "Amazon", "Microsoft", "Meta", "Goldman Sachs"],
    description: "Number of unique paths from top-left to bottom-right in m x n grid moving only down or right.",
    markdown_details: `## Problem Statement
There is a robot on an \`m x n\` grid. The robot is initially located at the top-left corner and tries to reach the bottom-right corner. The robot can only move either down or right at any point in time. Return the number of possible unique paths.

### Striver's Approach & Intuition
Total steps needed to reach the end: \`m - 1\` down and \`n - 1\` right.
Total moves = \`m + n - 2\`.
This is a direct combinatorics combination problem: \`nCr(m + n - 2, m - 1)\`!

### Optimal Complexity
- **Time:** \`O(min(m, n))\`
- **Space:** \`O(1)\``,
    time_complexity: "O(min(M, N))",
    space_complexity: "O(1)",
    order_index: 79,
  },
  {
    id: "longest-common-subsequence",
    topic_id: "dynamic-programming",
    step_title: "Step 16: Dynamic Programming",
    subtopic_title: "DP on Strings",
    title: "Longest Common Subsequence (LCS)",
    difficulty: "medium",
    problem_url: "https://leetcode.com/problems/longest-common-subsequence/",
    article_url: "https://takeuforward.org/data-structure/longest-common-subsequence-dp-25/",
    companies: ["Amazon", "Google", "Microsoft", "Meta", "Adobe"],
    description: "Find the length of the longest common subsequence between two strings text1 and text2.",
    markdown_details: `## Problem Statement
Given two strings **text1** and **text2**, return the length of their longest common subsequence. If there is no common subsequence, return 0.

### Striver's Approach & Intuition
If \`text1[i - 1] === text2[j - 1]\`: \`dp[i][j] = 1 + dp[i - 1][j - 1]\`.
Else: \`dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])\`.
Can be space-optimized using two rolling 1D arrays of size \`text2.length + 1\`.

### Optimal Complexity
- **Time:** \`O(M * N)\`
- **Space:** \`O(N)\``,
    time_complexity: "O(M * N)",
    space_complexity: "O(N)",
    order_index: 80,
  }
];

// Append additional problems into STRIVER_A2Z_PROBLEMS array
const insertIndex = existingContent.lastIndexOf("];");
const formattedAdditional = additionalProblems.map(p => JSON.stringify(p, null, 2)).join(",\n  ");
const updatedContent = existingContent.slice(0, insertIndex) + ",\n  " + formattedAdditional + "\n];\n";

fs.writeFileSync(path.join(__dirname, "../lib/dsa-striver-sheet.ts"), updatedContent, "utf-8");
console.log(`Successfully merged ${additionalProblems.length} additional problems into lib/dsa-striver-sheet.ts!`);
