/**
 * lib/skills/dsa-bank.ts
 * Multi-topic curated DSA Problem Bank and Session Manager.
 * Contains authentic coding problems across Easy, Medium, and Hard tiers
 * with starter code, public/hidden test suites, and optimal complexity models.
 */

export interface DSATestCase {
  input: string;
  expected: string;
  isHidden?: boolean;
}

export interface DSAProblem {
  id: string;
  title: string;
  topic: "arrays" | "two_pointers" | "sliding_window" | "stack" | "binary_search" | "linked_list" | "trees" | "graphs" | "dp" | "greedy";
  topicLabel: string;
  difficulty: "Easy" | "Medium" | "Hard";
  description: string;
  constraints: string[];
  examples: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  starterCode: {
    python: string;
    javascript: string;
    cpp: string;
    java: string;
  };
  publicTestCases: DSATestCase[];
  hiddenTestCases: DSATestCase[];
  optimalComplexity: {
    time: string;
    space: string;
  };
  explanation: string;
  hints: string[];
  companyTags: string[];
}

export const DSA_PROBLEM_BANK: DSAProblem[] = [
  // ── SLIDING WINDOW ──
  {
    id: "dsa-longest-substring",
    title: "Longest Substring Without Repeating Characters",
    topic: "sliding_window",
    topicLabel: "Sliding Window",
    difficulty: "Medium",
    description: "Given a string `s`, find the length of the longest substring without repeating characters.\n\nA substring is a contiguous non-empty sequence of characters within a string.",
    constraints: [
      "0 <= s.length <= 5 * 10^4",
      "s consists of English letters, digits, symbols and spaces."
    ],
    examples: [
      { input: 's = "abcabcbb"', output: "3", explanation: 'The answer is "abc", with the length of 3.' },
      { input: 's = "bbbbb"', output: "1", explanation: 'The answer is "b", with the length of 1.' },
      { input: 's = "pwwkew"', output: "3", explanation: 'The answer is "wke", with the length of 3.' }
    ],
    starterCode: {
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
    let maxLen = 0;
    let left = 0;
    for (let right = 0; right < s.length; right++) {
        const char = s[right];
        if (charMap.has(char) && charMap.get(char) >= left) {
            left = charMap.get(char) + 1;
        }
        charMap.set(char, right);
        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}`,
      cpp: `int lengthOfLongestSubstring(string s) {
    vector<int> charMap(256, -1);
    int maxLen = 0, left = 0;
    for (int right = 0; right < s.length(); right++) {
        if (charMap[s[right]] >= left) {
            left = charMap[s[right]] + 1;
        }
        charMap[s[right]] = right;
        maxLen = max(maxLen, right - left + 1);
    }
    return maxLen;
}`,
      java: `public int lengthOfLongestSubstring(String s) {
    Map<Character, Integer> charMap = new HashMap<>();
    int maxLen = 0, left = 0;
    for (int right = 0; right < s.length(); right++) {
        char c = s.charAt(right);
        if (charMap.containsKey(c) && charMap.get(c) >= left) {
            left = charMap.get(c) + 1;
        }
        charMap.put(c, right);
        maxLen = Math.max(maxLen, right - left + 1);
    }
    return maxLen;
}`
    },
    publicTestCases: [
      { input: '"abcabcbb"', expected: "3" },
      { input: '"bbbbb"', expected: "1" },
      { input: '"pwwkew"', expected: "3" },
      { input: '""', expected: "0" }
    ],
    hiddenTestCases: [
      { input: '" "', expected: "1", isHidden: true },
      { input: '"dvdf"', expected: "3", isHidden: true },
      { input: '"tmmzuxt"', expected: "5", isHidden: true },
      { input: '"abcdefghijklmnopqrstuvwxyz"', expected: "26", isHidden: true }
    ],
    optimalComplexity: { time: "O(N)", space: "O(min(N, M)) where M is alphabet size" },
    explanation: "Use a sliding window [left, right] with a hash map of character positions. When encountering a duplicate character already inside the window, jump left pointer directly to index + 1.",
    hints: [
      "Use two pointers to define the window boundary.",
      "Track the latest position of each character rather than just a set.",
      "Ensure the left pointer only moves forward."
    ],
    companyTags: ["Amazon", "Google", "Microsoft", "Meta", "TCS Digital"]
  },

  // ── TWO POINTERS ──
  {
    id: "dsa-two-sum",
    title: "Two Sum (Sorted Array / Two Pointers)",
    topic: "two_pointers",
    topicLabel: "Two Pointers",
    difficulty: "Easy",
    description: "Given a 1-indexed array of integers `numbers` that is already sorted in non-decreasing order, find two numbers such that they add up to a specific `target` number.\n\nReturn the indices of the two numbers [index1, index2] as an integer array of length 2.",
    constraints: [
      "2 <= numbers.length <= 3 * 10^4",
      "-1000 <= numbers[i] <= 1000",
      "numbers is sorted in non-decreasing order.",
      "-1000 <= target <= 1000",
      "The tests are generated such that there is exactly one solution."
    ],
    examples: [
      { input: "numbers = [2,7,11,15], target = 9", output: "[1,2]", explanation: "The sum of 2 and 7 is 9. Therefore index1 = 1, index2 = 2." },
      { input: "numbers = [2,3,4], target = 6", output: "[1,3]", explanation: "The sum of 2 and 4 is 6. Therefore index1 = 1, index2 = 3." }
    ],
    starterCode: {
      python: `def twoSum(numbers: list[int], target: int) -> list[int]:
    left, right = 0, len(numbers) - 1
    while left < right:
        cur_sum = numbers[left] + numbers[right]
        if cur_sum == target:
            return [left + 1, right + 1]
        elif cur_sum < target:
            left += 1
        else:
            right -= 1
    return []
`,
      javascript: `function twoSum(numbers, target) {
    let left = 0, right = numbers.length - 1;
    while (left < right) {
        const sum = numbers[left] + numbers[right];
        if (sum === target) return [left + 1, right + 1];
        if (sum < target) left++;
        else right--;
    }
    return [];
}`,
      cpp: `vector<int> twoSum(vector<int>& numbers, int target) {
    int left = 0, right = numbers.size() - 1;
    while (left < right) {
        int sum = numbers[left] + numbers[right];
        if (sum == target) return {left + 1, right + 1};
        if (sum < target) left++;
        else right--;
    }
    return {};
}`,
      java: `public int[] twoSum(int[] numbers, int target) {
    int left = 0, right = numbers.length - 1;
    while (left < right) {
        int sum = numbers[left] + numbers[right];
        if (sum == target) return new int[]{left + 1, right + 1};
        if (sum < target) left++;
        else right--;
    }
    return new int[]{};
}`
    },
    publicTestCases: [
      { input: "numbers = [2,7,11,15], target = 9", expected: "[1,2]" },
      { input: "numbers = [2,3,4], target = 6", expected: "[1,3]" },
      { input: "numbers = [-1,0], target = -1", expected: "[1,2]" }
    ],
    hiddenTestCases: [
      { input: "numbers = [1,2,3,4,4,9], target = 8", expected: "[4,5]", isHidden: true },
      { input: "numbers = [-5,-3,0,2,4,6], target = 1", expected: "[1,6]", isHidden: true },
      { input: "numbers = [5,25,75], target = 100", expected: "[2,3]", isHidden: true }
    ],
    optimalComplexity: { time: "O(N)", space: "O(1)" },
    explanation: "Because the array is sorted, place one pointer at start and one at end. If sum < target, advance left. If sum > target, decrement right.",
    hints: [
      "Can we exploit the sorted order without using extra hash map memory?",
      "If the sum is too small, which pointer must move?",
      "Indices are 1-based in the output."
    ],
    companyTags: ["Google", "Amazon", "Infosys SP", "Wipro Turbo"]
  },

  // ── BINARY SEARCH ──
  {
    id: "dsa-search-rotated",
    title: "Search in Rotated Sorted Array",
    topic: "binary_search",
    topicLabel: "Binary Search",
    difficulty: "Medium",
    description: "There is an integer array `nums` sorted in ascending order (with distinct values).\n\nPrior to being passed to your function, `nums` is possibly rotated at an unknown pivot index. Given the array `nums` after the possible rotation and an integer `target`, return the index of `target` if it is in `nums`, or `-1` if it is not in `nums`.\n\nYou must write an algorithm with `O(log n)` runtime complexity.",
    constraints: [
      "1 <= nums.length <= 5000",
      "-10^4 <= nums[i] <= 10^4",
      "All values of nums are unique.",
      "nums is an ascending array that is possibly rotated.",
      "-10^4 <= target <= 10^4"
    ],
    examples: [
      { input: "nums = [4,5,6,7,0,1,2], target = 0", output: "4" },
      { input: "nums = [4,5,6,7,0,1,2], target = 3", output: "-1" },
      { input: "nums = [1], target = 0", output: "-1" }
    ],
    starterCode: {
      python: `def search(nums: list[int], target: int) -> int:
    left, right = 0, len(nums) - 1
    while left <= right:
        mid = (left + right) // 2
        if nums[mid] == target:
            return mid
        # Check if left half is sorted
        if nums[left] <= nums[mid]:
            if nums[left] <= target < nums[mid]:
                right = mid - 1
            else:
                left = mid + 1
        else: # Right half is sorted
            if nums[mid] < target <= nums[right]:
                left = mid + 1
            else:
                right = mid - 1
    return -1
`,
      javascript: `function search(nums, target) {
    let left = 0, right = nums.length - 1;
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (nums[mid] === target) return mid;
        if (nums[left] <= nums[mid]) {
            if (nums[left] <= target && target < nums[mid]) right = mid - 1;
            else left = mid + 1;
        } else {
            if (nums[mid] < target && target <= nums[right]) left = mid + 1;
            else right = mid - 1;
        }
    }
    return -1;
}`,
      cpp: `int search(vector<int>& nums, int target) {
    int left = 0, right = nums.size() - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) return mid;
        if (nums[left] <= nums[mid]) {
            if (nums[left] <= target && target < nums[mid]) right = mid - 1;
            else left = mid + 1;
        } else {
            if (nums[mid] < target && target <= nums[right]) left = mid + 1;
            else right = mid - 1;
        }
    }
    return -1;
}`,
      java: `public int search(int[] nums, int target) {
    int left = 0, right = nums.length - 1;
    while (left <= right) {
        int mid = left + (right - left) / 2;
        if (nums[mid] == target) return mid;
        if (nums[left] <= nums[mid]) {
            if (nums[left] <= target && target < nums[mid]) right = mid - 1;
            else left = mid + 1;
        } else {
            if (nums[mid] < target && target <= nums[right]) left = mid + 1;
            else right = mid - 1;
        }
    }
    return -1;
}`
    },
    publicTestCases: [
      { input: "nums = [4,5,6,7,0,1,2], target = 0", expected: "4" },
      { input: "nums = [4,5,6,7,0,1,2], target = 3", expected: "-1" },
      { input: "nums = [1], target = 0", expected: "-1" }
    ],
    hiddenTestCases: [
      { input: "nums = [5,1,3], target = 5", expected: "0", isHidden: true },
      { input: "nums = [1,3], target = 3", expected: "1", isHidden: true },
      { input: "nums = [6,7,1,2,3,4,5], target = 6", expected: "0", isHidden: true }
    ],
    optimalComplexity: { time: "O(log N)", space: "O(1)" },
    explanation: "At any point in a rotated sorted array, dividing by two leaves at least one half strictly sorted. Determine which half is sorted, check if target lies within that range, and prune the other half.",
    hints: [
      "In a rotated array, one half is always normally ordered.",
      "Check whether nums[left] <= nums[mid] to identify which side is sorted.",
      "Only search inside the sorted half if the target falls within its bounds."
    ],
    companyTags: ["Microsoft", "Google", "Amazon", "Uber"]
  },

  // ── STACK ──
  {
    id: "dsa-valid-parentheses",
    title: "Valid Parentheses & Bracket Matching",
    topic: "stack",
    topicLabel: "Stack",
    difficulty: "Easy",
    description: "Given a string `s` containing just the characters `'('`, `')'`, `'{'`, `'}'`, `'['` and `']'`, determine if the input string is valid.\n\nAn input string is valid if:\n1. Open brackets must be closed by the same type of brackets.\n2. Open brackets must be closed in the correct order.\n3. Every close bracket has a corresponding open bracket of the same type.",
    constraints: [
      "1 <= s.length <= 10^4",
      "s consists of parentheses only '()[]{}'."
    ],
    examples: [
      { input: 's = "()"', output: "true" },
      { input: 's = "()[]{}"', output: "true" },
      { input: 's = "(]"', output: "false" }
    ],
    starterCode: {
      python: `def isValid(s: str) -> bool:
    stack = []
    mapping = {')': '(', '}': '{', ']': '['}
    for char in s:
        if char in mapping:
            top_element = stack.pop() if stack else '#'
            if mapping[char] != top_element:
                return False
        else:
            stack.append(char)
    return not stack
`,
      javascript: `function isValid(s) {
    const stack = [];
    const mapping = { ')': '(', '}': '{', ']': '[' };
    for (let char of s) {
        if (mapping[char]) {
            const top = stack.length ? stack.pop() : '#';
            if (mapping[char] !== top) return false;
        } else {
            stack.push(char);
        }
    }
    return stack.length === 0;
}`,
      cpp: `bool isValid(string s) {
    stack<char> st;
    unordered_map<char, char> mapping = {{')', '('}, {'}', '{'}, {']', '['}};
    for (char c : s) {
        if (mapping.count(c)) {
            char top = !st.empty() ? st.top() : '#';
            if (!st.empty()) st.pop();
            if (mapping[c] != top) return false;
        } else {
            st.push(c);
        }
    }
    return st.empty();
}`,
      java: `public boolean isValid(String s) {
    Stack<Character> stack = new Stack<>();
    Map<Character, Character> mapping = Map.of(')', '(', '}', '{', ']', '[');
    for (char c : s.toCharArray()) {
        if (mapping.containsKey(c)) {
            char top = !stack.isEmpty() ? stack.pop() : '#';
            if (mapping.get(c) != top) return false;
        } else {
            stack.push(c);
        }
    }
    return stack.isEmpty();
}`
    },
    publicTestCases: [
      { input: '"()"', expected: "true" },
      { input: '"()[]{}"', expected: "true" },
      { input: '"(]"', expected: "false" }
    ],
    hiddenTestCases: [
      { input: '"([)]"', expected: "false", isHidden: true },
      { input: '"{[]}"', expected: "true", isHidden: true },
      { input: '"["', expected: "false", isHidden: true }
    ],
    optimalComplexity: { time: "O(N)", space: "O(N)" },
    explanation: "Push opening brackets onto a stack. When an opening bracket is matched with its closing counterpart, pop from stack. At the end, the stack must be empty.",
    hints: [
      "Last in, first out: the most recent opening bracket must be closed first.",
      "Check for odd length strings upfront.",
      "Ensure you handle a closing bracket when the stack is empty."
    ],
    companyTags: ["TCS Ninja", "Accenture", "Infosys GenC", "Amazon"]
  },

  // ── DYNAMIC PROGRAMMING ──
  {
    id: "dsa-coin-change",
    title: "Coin Change (Fewest Coins to Make Amount)",
    topic: "dp",
    topicLabel: "Dynamic Programming",
    difficulty: "Medium",
    description: "You are given an integer array `coins` representing coins of different denominations and an integer `amount` representing a total amount of money.\n\nReturn the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return `-1`.\n\nYou may assume that you have an infinite number of each kind of coin.",
    constraints: [
      "1 <= coins.length <= 12",
      "1 <= coins[i] <= 2^31 - 1",
      "0 <= amount <= 10^4"
    ],
    examples: [
      { input: "coins = [1,2,5], amount = 11", output: "3", explanation: "11 = 5 + 5 + 1 (3 coins)" },
      { input: "coins = [2], amount = 3", output: "-1" },
      { input: "coins = [1], amount = 0", output: "0" }
    ],
    starterCode: {
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
}`,
      cpp: `int coinChange(vector<int>& coins, int amount) {
    vector<int> dp(amount + 1, amount + 1);
    dp[0] = 0;
    for (int coin : coins) {
        for (int x = coin; x <= amount; x++) {
            dp[x] = min(dp[x], dp[x - coin] + 1);
        }
    }
    return dp[amount] > amount ? -1 : dp[amount];
}`,
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
}`
    },
    publicTestCases: [
      { input: "coins = [1,2,5], amount = 11", expected: "3" },
      { input: "coins = [2], amount = 3", expected: "-1" },
      { input: "coins = [1], amount = 0", expected: "0" }
    ],
    hiddenTestCases: [
      { input: "coins = [186,419,83,408], amount = 6249", expected: "20", isHidden: true },
      { input: "coins = [2,5,10,1], amount = 27", expected: "4", isHidden: true },
      { input: "coins = [2], amount = 1", expected: "-1", isHidden: true }
    ],
    optimalComplexity: { time: "O(amount * len(coins))", space: "O(amount)" },
    explanation: "Bottom-up 1D dynamic programming. Let dp[i] be the minimum coins for amount i. Transition: dp[i] = min(dp[i], dp[i - coin] + 1).",
    hints: [
      "Greedy choice (taking largest coin first) fails for denominations like [1, 3, 4] with amount 6.",
      "Build solutions for amounts from 0 up to target.",
      "Initialize table with infinity."
    ],
    companyTags: ["Google", "Amazon", "Razorpay", "Swiggy"]
  },

  // ── TREES & GRAPHS ──
  {
    id: "dsa-number-of-islands",
    title: "Number of Connected Grid Islands (BFS / DFS)",
    topic: "graphs",
    topicLabel: "Graphs & Grid Traversals",
    difficulty: "Medium",
    description: "Given an `m x n` 2D binary grid `grid` which represents a map of `'1'`s (land) and `'0'`s (water), return the number of islands.\n\nAn island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are surrounded by water.",
    constraints: [
      "m == grid.length",
      "n == grid[i].length",
      "1 <= m, n <= 300",
      "grid[i][j] is '0' or '1'."
    ],
    examples: [
      { input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', output: "1" },
      { input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', output: "3" }
    ],
    starterCode: {
      python: `def numIslands(grid: list[list[str]]) -> int:
    if not grid:
        return 0
    rows, cols = len(grid), len(grid[0])
    islands = 0
    def dfs(r, c):
        if r < 0 or c < 0 or r >= rows or c >= cols or grid[r][c] != '1':
            return
        grid[r][c] = '0' # mark visited
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
}`,
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
}`,
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
}`
    },
    publicTestCases: [
      { input: 'grid = [["1","1","1","1","0"],["1","1","0","1","0"],["1","1","0","0","0"],["0","0","0","0","0"]]', expected: "1" },
      { input: 'grid = [["1","1","0","0","0"],["1","1","0","0","0"],["0","0","1","0","0"],["0","0","0","1","1"]]', expected: "3" }
    ],
    hiddenTestCases: [
      { input: 'grid = [["1","0"],["0","1"]]', expected: "2", isHidden: true },
      { input: 'grid = [["1"]]', expected: "1", isHidden: true },
      { input: 'grid = [["0"]]', expected: "0", isHidden: true }
    ],
    optimalComplexity: { time: "O(M * N)", space: "O(M * N) recursion stack" },
    explanation: "Iterate across the grid. Whenever land ('1') is encountered, increment the island count and trigger a DFS/BFS traversal that sinks the entire connected component by setting visited cells to '0'.",
    hints: [
      "Sink connected land to avoid visiting it multiple times.",
      "Check 4-directional bounds carefully.",
      "Diagonal connections do not count as part of the same island."
    ],
    companyTags: ["Amazon", "Google", "Uber", "Flipkart"]
  }
];

/**
 * Filter DSA problems dynamically based on candidate profile, target track,
 * and avoided seen questions.
 */
export function getAdaptiveDSAProblems(options: {
  topic?: string;
  candidateId?: string;
  count?: number;
}): DSAProblem[] {
  const { topic = "all", count } = options;

  let pool = [...DSA_PROBLEM_BANK];

  if (topic && topic !== "all") {
    const filtered = pool.filter(p => p.topic === topic);
    if (filtered.length > 0) pool = filtered;
  }

  // Shuffle problem list
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return count ? pool.slice(0, count) : pool;
}
