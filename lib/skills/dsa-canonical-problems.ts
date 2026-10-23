/**
 * lib/skills/dsa-canonical-problems.ts
 * 
 * Canonical Problem Registry for Cognalyze DSA Arena.
 * 
 * Guarantees:
 * 1. Every problem has an immutable canonical identity, function name, and signature.
 * 2. Complete, un-truncated problem descriptions with input/output format, constraints, examples, and edge cases.
 * 3. Exact function contracts for C++, Python, JavaScript, and Java.
 * 4. Rigorous, authentic test cases with genuine expected outputs (NO "Verified Output" placeholders!).
 * 5. Distinct test fixtures that cannot be conflated between problems.
 */

export interface CanonicalExample {
  input: string;
  output: string;
  explanation: string;
}

export interface CanonicalTestCase {
  id: string;
  input: string;
  expected: string;
  argsJson: string; // JSON array string representing arguments to pass to the function
  isHidden?: boolean;
}

export interface CanonicalProblem {
  id: string;
  title: string;
  step_title: string;
  subtopic_title: string;
  difficulty: "easy" | "medium" | "hard";
  time_complexity: string;
  space_complexity: string;
  functionName: string;
  cppSignature: string;
  pythonSignature: string;
  jsSignature: string;
  javaSignature: string;
  fullDescription: string;
  inputFormat: string;
  outputFormat: string;
  constraints: string[];
  examples: CanonicalExample[];
  edgeCases: string[];
  hints: string[];
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
  publicTestCases: CanonicalTestCase[];
  hiddenTestCases: CanonicalTestCase[];
  followUpQuestions: Array<{
    id: string;
    question: string;
    expectedInsight: string;
  }>;
}

export const CANONICAL_DSA_PROBLEMS: Record<string, CanonicalProblem> = {
  // ── 1. PAINTER'S PARTITION PROBLEM ──
  "painter-s-partition-problem": {
    id: "painter-s-partition-problem",
    title: "Painter's Partition Problem",
    step_title: "Step 4: Binary Search",
    subtopic_title: "BS on Answers",
    difficulty: "hard",
    time_complexity: "O(N log(sum))",
    space_complexity: "O(1)",
    functionName: "paintersPartition",
    cppSignature: "int paintersPartition(vector<int>& boards, int k)",
    pythonSignature: "def paintersPartition(boards: list[int], k: int) -> int:",
    jsSignature: "function paintersPartition(boards, k)",
    javaSignature: "public int paintersPartition(int[] boards, int k)",
    fullDescription: 
      "Given an array `boards` of `n` integers where `boards[i]` represents the length of the i-th board, and an integer `k` representing the number of painters available. Each painter takes 1 unit of time to paint 1 unit length of a board. Each painter can only paint contiguous sections of boards. Any board can be painted by at most one painter. Determine the minimum time required to get all boards painted.",
    inputFormat: 
      "An array of integers `boards` representing board lengths, and an integer `k` representing the number of available painters.",
    outputFormat: 
      "Return a single integer representing the minimum possible maximum time required by any painter.",
    constraints: [
      "1 <= k <= boards.length <= 10^5",
      "1 <= boards[i] <= 10^5",
      "Total board length sum can reach up to 10^10; watch out for integer overflow during sum calculation in 32-bit environments."
    ],
    examples: [
      {
        input: "boards = [2, 1, 5, 6, 2, 3], k = 2",
        output: "11",
        explanation: "Painter 1 can paint boards [2, 1, 5] (total time = 8). Painter 2 can paint boards [6, 2, 3] (total time = 11). The maximum time spent by any painter is max(8, 11) = 11. No partition with k=2 can achieve a smaller maximum time."
      },
      {
        input: "boards = [10, 20, 30, 40], k = 2",
        output: "60",
        explanation: "Painter 1 paints boards [10, 20, 30] (time = 60). Painter 2 paints board [40] (time = 40). Maximum time = 60."
      },
      {
        input: "boards = [5, 5, 5, 5], k = 2",
        output: "10",
        explanation: "Painter 1 paints 2 boards (10 units), Painter 2 paints 2 boards (10 units). Maximum time is 10."
      }
    ],
    edgeCases: [
      "k = 1: A single painter must paint every board, so the answer is the total sum of all boards.",
      "k >= boards.length: Every board can be allocated to a distinct painter, so the answer is max(boards).",
      "Large board lengths: Sum of elements can exceed 2^31 - 1, requiring 64-bit integer accumulation (`long long` in C++)."
    ],
    hints: [
      "Hint 1: What are the minimum and maximum possible values for the answer? The search range is [max(boards), sum(boards)].",
      "Hint 2: If a maximum time `T` is feasible with `k` painters, is any `T' > T` also feasible? Yes, the feasibility predicate is monotonic.",
      "Hint 3: Use binary search on the answer range. For a midpoint `mid`, write a helper function `countPainters(boards, mid)` to greedily assign boards."
    ],
    starterCode: {
      python: `def paintersPartition(boards: list[int], k: int) -> int:
    # Write your solution here
    pass
`,
      javascript: `function paintersPartition(boards, k) {
    // Write your solution here
    
}
`,
      cpp: `int paintersPartition(vector<int>& boards, int k) {
    // Write your solution here
    return -1;
}
`,
      java: `public int paintersPartition(int[] boards, int k) {
    // Write your solution here
    return -1;
}
`
    },
    referenceSolution: {
      python: `def paintersPartition(boards: list[int], k: int) -> int:
    def countPainters(maxTime):
        painters = 1
        currentSum = 0
        for b in boards:
            if currentSum + b <= maxTime:
                currentSum += b
            else:
                painters += 1
                currentSum = b
        return painters

    low = max(boards)
    high = sum(boards)
    ans = high
    while low <= high:
        mid = (low + high) // 2
        if countPainters(mid) <= k:
            ans = mid
            high = mid - 1
        else:
            low = mid + 1
    return ans
`,
      javascript: `function paintersPartition(boards, k) {
    function countPainters(maxTime) {
        let painters = 1;
        let currentSum = 0;
        for (let b of boards) {
            if (currentSum + b <= maxTime) {
                currentSum += b;
            } else {
                painters++;
                currentSum = b;
            }
        }
        return painters;
    }

    let low = Math.max(...boards);
    let high = boards.reduce((a, b) => a + b, 0);
    let ans = high;

    while (low <= high) {
        let mid = Math.floor((low + high) / 2);
        if (countPainters(mid) <= k) {
            ans = mid;
            high = mid - 1;
        } else {
            low = mid + 1;
        }
    }
    return ans;
}
`,
      cpp: `int paintersPartition(vector<int>& boards, int k) {
    long long low = *max_element(boards.begin(), boards.end());
    long long high = 0;
    for (int b : boards) high += b;

    auto countPainters = [&](long long maxTime) -> int {
        int painters = 1;
        long long currentSum = 0;
        for (int b : boards) {
            if (currentSum + b <= maxTime) {
                currentSum += b;
            } else {
                painters++;
                currentSum = b;
            }
        }
        return painters;
    };

    long long ans = high;
    while (low <= high) {
        long long mid = low + (high - low) / 2;
        if (countPainters(mid) <= k) {
            ans = mid;
            high = mid - 1;
        } else {
            low = mid + 1;
        }
    }
    return (int)ans;
}
`,
      java: `public int paintersPartition(int[] boards, int k) {
    long low = 0, high = 0;
    for (int b : boards) {
        low = Math.max(low, b);
        high += b;
    }
    long ans = high;
    while (low <= high) {
        long mid = low + (high - low) / 2;
        int painters = 1;
        long current = 0;
        for (int b : boards) {
            if (current + b <= mid) {
                current += b;
            } else {
                painters++;
                current = b;
            }
        }
        if (painters <= k) {
            ans = mid;
            high = mid - 1;
        } else {
            low = mid + 1;
        }
    }
    return (int)ans;
}
`
    },
    publicTestCases: [
      {
        id: "pp-pub-1",
        input: "boards = [2, 1, 5, 6, 2, 3], k = 2",
        expected: "11",
        argsJson: "[[2, 1, 5, 6, 2, 3], 2]"
      },
      {
        id: "pp-pub-2",
        input: "boards = [10, 20, 30, 40], k = 2",
        expected: "60",
        argsJson: "[[10, 20, 30, 40], 2]"
      },
      {
        id: "pp-pub-3",
        input: "boards = [5, 5, 5, 5], k = 2",
        expected: "10",
        argsJson: "[[5, 5, 5, 5], 2]"
      }
    ],
    hiddenTestCases: [
      {
        id: "pp-hid-1",
        input: "boards = [100], k = 1",
        expected: "100",
        argsJson: "[[100], 1]",
        isHidden: true
      },
      {
        id: "pp-hid-2",
        input: "boards = [1, 2, 3, 4, 5], k = 5",
        expected: "5",
        argsJson: "[[1, 2, 3, 4, 5], 5]",
        isHidden: true
      },
      {
        id: "pp-hid-3",
        input: "boards = [12, 34, 67, 90], k = 2",
        expected: "113",
        argsJson: "[[12, 34, 67, 90], 2]",
        isHidden: true
      },
      {
        id: "pp-hid-4",
        input: "boards = [10, 10, 10, 10, 10, 10], k = 3",
        expected: "20",
        argsJson: "[[10, 10, 10, 10, 10, 10], 3]",
        isHidden: true
      }
    ],
    followUpQuestions: [
      {
        id: "pp-fu-1",
        question: "Why does binary search apply to this problem even though the original `boards` array is unsorted?",
        expectedInsight: "Binary search is conducted on the answer space [max(boards), sum(boards)], which is monotonic in feasibility, not on the input array."
      },
      {
        id: "pp-fu-2",
        question: "Could the sum of boards cause a 32-bit signed integer overflow? How did you account for this in your search space boundaries?",
        expectedInsight: "If N=10^5 and each board is 10^5, sum=10^10 which exceeds INT_MAX (2*10^9). High and running sum must use 64-bit integer types."
      },
      {
        id: "pp-fu-3",
        question: "What is the time complexity of the feasibility check, and how does that compose with the binary search range?",
        expectedInsight: "Feasibility takes linear O(N) time. The search range is [max, sum], taking log(sum - max + 1) iterations, giving total time O(N * log(sum))."
      }
    ]
  },

  // ── 2. MATRIX MEDIAN IN ROW-WISE SORTED MATRIX ──
  "matrix-median-in-row-wise-sorted-matrix": {
    id: "matrix-median-in-row-wise-sorted-matrix",
    title: "Matrix Median in Row-Wise Sorted Matrix",
    step_title: "Step 4: Binary Search",
    subtopic_title: "BS on 2D Arrays",
    difficulty: "hard",
    time_complexity: "O(32 * N log M)",
    space_complexity: "O(1)",
    functionName: "matrixMedian",
    cppSignature: "int matrixMedian(vector<vector<int>>& matrix)",
    pythonSignature: "def matrixMedian(matrix: list[list[int]]) -> int:",
    jsSignature: "function matrixMedian(matrix)",
    javaSignature: "public int matrixMedian(int[][] matrix)",
    fullDescription: 
      "Given a row-wise sorted matrix of size `r x c` where `r` and `c` are odd integers and `r * c` is always odd. Find the median of the matrix. The median of a sorted list of `n` elements (where `n` is odd) is the element at position `(n + 1) / 2`.",
    inputFormat: 
      "A 2D array of integers `matrix` where each individual row is sorted in non-decreasing order.",
    outputFormat: 
      "Return a single integer representing the median of the entire matrix.",
    constraints: [
      "1 <= r, c <= 1000",
      "r * c is odd",
      "1 <= matrix[i][j] <= 10^9"
    ],
    examples: [
      {
        input: "matrix = [[1, 3, 5], [2, 6, 9], [3, 6, 9]]",
        output: "5",
        explanation: "Sorted elements: [1, 2, 3, 3, 5, 6, 6, 9, 9]. Length is 9. The 5th element is 5."
      },
      {
        input: "matrix = [[1], [2], [3]]",
        output: "2",
        explanation: "Sorted elements: [1, 2, 3]. Median is 2."
      },
      {
        input: "matrix = [[1, 3, 4], [2, 5, 6], [7, 8, 9]]",
        output: "5",
        explanation: "Sorted elements: [1, 2, 3, 4, 5, 6, 7, 8, 9]. Median is 5."
      }
    ],
    edgeCases: [
      "Single column matrix: r rows and 1 column.",
      "Single row matrix: 1 row and c columns.",
      "Matrix containing duplicate values across rows."
    ],
    hints: [
      "Hint 1: The median has at least (r * c + 1) / 2 elements less than or equal to it.",
      "Hint 2: Find the minimum element (min of 1st column) and maximum element (max of last column) as the value range.",
      "Hint 3: Binary search on the value range [min, max]. In each step, use upper_bound / binary search on each row to count elements <= mid."
    ],
    starterCode: {
      python: `def matrixMedian(matrix: list[list[int]]) -> int:
    # Write your solution here
    pass
`,
      javascript: `function matrixMedian(matrix) {
    // Write your solution here
    
}
`,
      cpp: `int matrixMedian(vector<vector<int>>& matrix) {
    // Write your solution here
    return -1;
}
`,
      java: `public int matrixMedian(int[][] matrix) {
    // Write your solution here
    return -1;
}
`
    },
    referenceSolution: {
      python: `import bisect

def matrixMedian(matrix: list[list[int]]) -> int:
    r = len(matrix)
    c = len(matrix[0])
    low = min(row[0] for row in matrix)
    high = max(row[-1] for row in matrix)
    required = (r * c + 1) // 2

    while low <= high:
        mid = (low + high) // 2
        count = sum(bisect.bisect_right(row, mid) for row in matrix)
        if count < required:
            low = mid + 1
        else:
            high = mid - 1
    return low
`,
      javascript: `function matrixMedian(matrix) {
    const r = matrix.length;
    const c = matrix[0].length;
    let low = Infinity;
    let high = -Infinity;
    for (let i = 0; i < r; i++) {
        if (matrix[i][0] < low) low = matrix[i][0];
        if (matrix[i][c - 1] > high) high = matrix[i][c - 1];
    }
    const required = Math.floor((r * c + 1) / 2);

    function countLessEqual(row, target) {
        let l = 0, h = row.length - 1;
        while (l <= h) {
            let m = Math.floor((l + h) / 2);
            if (row[m] <= target) l = m + 1;
            else h = m - 1;
        }
        return l;
    }

    while (low <= high) {
        let mid = Math.floor((low + high) / 2);
        let count = 0;
        for (let i = 0; i < r; i++) {
            count += countLessEqual(matrix[i], mid);
        }
        if (count < required) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return low;
}
`,
      cpp: `int matrixMedian(vector<vector<int>>& matrix) {
    int r = matrix.size();
    int c = matrix[0].size();
    int low = INT_MAX, high = INT_MIN;
    for (int i = 0; i < r; i++) {
        low = min(low, matrix[i][0]);
        high = max(high, matrix[i][c - 1]);
    }
    int required = (r * c + 1) / 2;

    while (low <= high) {
        int mid = low + (high - low) / 2;
        int count = 0;
        for (int i = 0; i < r; i++) {
            count += upper_bound(matrix[i].begin(), matrix[i].end(), mid) - matrix[i].begin();
        }
        if (count < required) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return low;
}
`,
      java: `public int matrixMedian(int[][] matrix) {
    int r = matrix.length;
    int c = matrix[0].length;
    int low = Integer.MAX_VALUE, high = Integer.MIN_VALUE;
    for (int i = 0; i < r; i++) {
        low = Math.min(low, matrix[i][0]);
        high = Math.max(high, matrix[i][c - 1]);
    }
    int required = (r * c + 1) / 2;

    while (low <= high) {
        int mid = low + (high - low) / 2;
        int count = 0;
        for (int i = 0; i < r; i++) {
            int l = 0, h = c - 1;
            while (l <= h) {
                int m = l + (h - l) / 2;
                if (matrix[i][m] <= mid) l = m + 1;
                else h = m - 1;
            }
            count += l;
        }
        if (count < required) {
            low = mid + 1;
        } else {
            high = mid - 1;
        }
    }
    return low;
}
`
    },
    publicTestCases: [
      {
        id: "mm-pub-1",
        input: "matrix = [[1, 3, 5], [2, 6, 9], [3, 6, 9]]",
        expected: "5",
        argsJson: "[[[1, 3, 5], [2, 6, 9], [3, 6, 9]]]"
      },
      {
        id: "mm-pub-2",
        input: "matrix = [[1], [2], [3]]",
        expected: "2",
        argsJson: "[[[1], [2], [3]]]"
      },
      {
        id: "mm-pub-3",
        input: "matrix = [[1, 3, 4], [2, 5, 6], [7, 8, 9]]",
        expected: "5",
        argsJson: "[[[1, 3, 4], [2, 5, 6], [7, 8, 9]]]"
      }
    ],
    hiddenTestCases: [
      {
        id: "mm-hid-1",
        input: "matrix = [[1, 2, 3, 4, 5]]",
        expected: "3",
        argsJson: "[[[1, 2, 3, 4, 5]]]",
        isHidden: true
      },
      {
        id: "mm-hid-2",
        input: "matrix = [[3], [5], [8]]",
        expected: "5",
        argsJson: "[[[3], [5], [8]]]",
        isHidden: true
      },
      {
        id: "mm-hid-3",
        input: "matrix = [[2, 4, 6], [1, 3, 5], [7, 8, 9]]",
        expected: "5",
        argsJson: "[[[2, 4, 6], [1, 3, 5], [7, 8, 9]]]",
        isHidden: true
      }
    ],
    followUpQuestions: [
      {
        id: "mm-fu-1",
        question: "Why do we binary search on the value range [min, max] rather than row or column indexes?",
        expectedInsight: "Because while individual rows are sorted, the columns are not sorted against each other, so coordinate binary search does not guarantee monotonic partitioning. Searching value range allows counting elements <= mid across all rows in O(R log C)."
      },
      {
        id: "mm-fu-2",
        question: "How do you guarantee that the returned value `low` actually exists in the matrix?",
        expectedInsight: "Because when count >= required, we contract high = mid - 1. When count < required, low = mid + 1. The smallest value that has >= required elements <= it must be present in the matrix."
      }
    ]
  },

  // ── 3. MAXIMUM SUBARRAY SUM (KADANE'S ALGORITHM) ──
  "maximum-subarray-sum-kadane-s-algorithm": {
    id: "maximum-subarray-sum-kadane-s-algorithm",
    title: "Maximum Subarray Sum (Kadane's Algorithm)",
    step_title: "Step 3: Solve Problems on Arrays",
    subtopic_title: "Medium Array Problems",
    difficulty: "medium",
    time_complexity: "O(N)",
    space_complexity: "O(1)",
    functionName: "maxSubArray",
    cppSignature: "int maxSubArray(vector<int>& nums)",
    pythonSignature: "def maxSubArray(nums: list[int]) -> int:",
    jsSignature: "function maxSubArray(nums)",
    javaSignature: "public int maxSubArray(int[] nums)",
    fullDescription: 
      "Given an integer array `nums`, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.",
    inputFormat: "An array of integers `nums`.",
    outputFormat: "Return a single integer representing the maximum subarray sum.",
    constraints: [
      "1 <= nums.length <= 10^5",
      "-10^4 <= nums[i] <= 10^4"
    ],
    examples: [
      {
        input: "nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]",
        output: "6",
        explanation: "Subarray [4, -1, 2, 1] has the largest sum = 6."
      },
      {
        input: "nums = [1]",
        output: "1",
        explanation: "Subarray [1] has the largest sum = 1."
      },
      {
        input: "nums = [5, 4, -1, 7, 8]",
        output: "23",
        explanation: "The entire array [5, 4, -1, 7, 8] has the largest sum = 23."
      }
    ],
    edgeCases: [
      "All negative numbers: nums = [-5, -2, -8, -1]. Result must be the maximum single negative element (-1), not 0.",
      "Single element array: nums = [-10]. Result must be -10.",
      "All positive numbers: entire array sum."
    ],
    hints: [
      "Hint 1: If a prefix sum becomes negative, can it contribute positively to any future subarray? No, reset it.",
      "Hint 2: Keep track of `maxSoFar` initialized to `nums[0]`, not 0."
    ],
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
    curr_sum = 0
    for x in nums:
        curr_sum += x
        if curr_sum > max_sum:
            max_sum = curr_sum
        if curr_sum < 0:
            curr_sum = 0
    return max_sum
`,
      javascript: `function maxSubArray(nums) {
    let maxSum = nums[0];
    let currSum = 0;
    for (let x of nums) {
        currSum += x;
        if (currSum > maxSum) maxSum = currSum;
        if (currSum < 0) currSum = 0;
    }
    return maxSum;
}
`,
      cpp: `int maxSubArray(vector<int>& nums) {
    int maxSum = nums[0];
    int currSum = 0;
    for (int x : nums) {
        currSum += x;
        if (currSum > maxSum) maxSum = currSum;
        if (currSum < 0) currSum = 0;
    }
    return maxSum;
}
`,
      java: `public int maxSubArray(int[] nums) {
    int maxSum = nums[0];
    int currSum = 0;
    for (int x : nums) {
        currSum += x;
        if (currSum > maxSum) maxSum = currSum;
        if (currSum < 0) currSum = 0;
    }
    return maxSum;
}
`
    },
    publicTestCases: [
      {
        id: "kad-pub-1",
        input: "nums = [-2, 1, -3, 4, -1, 2, 1, -5, 4]",
        expected: "6",
        argsJson: "[[-2, 1, -3, 4, -1, 2, 1, -5, 4]]"
      },
      {
        id: "kad-pub-2",
        input: "nums = [1]",
        expected: "1",
        argsJson: "[[1]]"
      },
      {
        id: "kad-pub-3",
        input: "nums = [5, 4, -1, 7, 8]",
        expected: "23",
        argsJson: "[[5, 4, -1, 7, 8]]"
      }
    ],
    hiddenTestCases: [
      {
        id: "kad-hid-1",
        input: "nums = [-5, -2, -8, -1]",
        expected: "-1",
        argsJson: "[[-5, -2, -8, -1]]",
        isHidden: true
      },
      {
        id: "kad-hid-2",
        input: "nums = [-100]",
        expected: "-100",
        argsJson: "[[-100]]",
        isHidden: true
      },
      {
        id: "kad-hid-3",
        input: "nums = [1, 2, 3, -10, 4, 5]",
        expected: "9",
        argsJson: "[[1, 2, 3, -10, 4, 5]]",
        isHidden: true
      }
    ],
    followUpQuestions: [
      {
        id: "kad-fu-1",
        question: "How do you modify Kadane's algorithm to return the starting and ending indices of the maximum subarray rather than just the sum?",
        expectedInsight: "Track a temporary start pointer whenever `curr_sum` resets to 0. Whenever `curr_sum > max_sum`, update `ans_start = temp_start` and `ans_end = current_index`."
      }
    ]
  },

  // ── 4. SEARCH IN ROTATED SORTED ARRAY ──
  "search-in-rotated-sorted-array": {
    id: "search-in-rotated-sorted-array",
    title: "Search in Rotated Sorted Array",
    step_title: "Step 4: Binary Search",
    subtopic_title: "BS on 1D Arrays",
    difficulty: "medium",
    time_complexity: "O(log N)",
    space_complexity: "O(1)",
    functionName: "searchRotated",
    cppSignature: "int searchRotated(vector<int>& nums, int target)",
    pythonSignature: "def searchRotated(nums: list[int], target: int) -> int:",
    jsSignature: "function searchRotated(nums, target)",
    javaSignature: "public int searchRotated(int[] nums, int target)",
    fullDescription: 
      "Given the integer array `nums` sorted in ascending order (with distinct values) that is possibly rotated at an unknown pivot index, and an integer `target`, return the index of `target` if it is in `nums`, or -1 if it is not in `nums`. You must write an algorithm with O(log n) runtime complexity.",
    inputFormat: "An array of distinct integers `nums` and an integer `target`.",
    outputFormat: "Return the 0-indexed integer position of target, or -1 if target is absent.",
    constraints: [
      "1 <= nums.length <= 5000",
      "-10^4 <= nums[i], target <= 10^4",
      "All values of nums are unique."
    ],
    examples: [
      {
        input: "nums = [4, 5, 6, 7, 0, 1, 2], target = 0",
        output: "4",
        explanation: "0 is located at index 4."
      },
      {
        input: "nums = [4, 5, 6, 7, 0, 1, 2], target = 3",
        output: "-1",
        explanation: "3 is not in the array."
      },
      {
        input: "nums = [1], target = 0",
        output: "-1",
        explanation: "Target 0 not found in single-element array."
      }
    ],
    edgeCases: [
      "Single element array matching target.",
      "Array not rotated at all: [1, 2, 3, 4, 5].",
      "Pivot at extreme ends."
    ],
    hints: [
      "Hint 1: At any midpoint, at least one half (left or right) is guaranteed to be strictly sorted.",
      "Hint 2: Check if target lies within the boundaries of the sorted half. If yes, search there; otherwise search the other half."
    ],
    starterCode: {
      python: `def searchRotated(nums: list[int], target: int) -> int:
    # Write your solution here
    pass
`,
      javascript: `function searchRotated(nums, target) {
    // Write your solution here
    
}
`,
      cpp: `int searchRotated(vector<int>& nums, int target) {
    // Write your solution here
    return -1;
}
`,
      java: `public int searchRotated(int[] nums, int target) {
    // Write your solution here
    return -1;
}
`
    },
    referenceSolution: {
      python: `def searchRotated(nums: list[int], target: int) -> int:
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
      javascript: `function searchRotated(nums, target) {
    let low = 0, high = nums.length - 1;
    while (low <= high) {
        let mid = Math.floor((low + high) / 2);
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
      cpp: `int searchRotated(vector<int>& nums, int target) {
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
      java: `public int searchRotated(int[] nums, int target) {
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
      {
        id: "sr-pub-1",
        input: "nums = [4, 5, 6, 7, 0, 1, 2], target = 0",
        expected: "4",
        argsJson: "[[4, 5, 6, 7, 0, 1, 2], 0]"
      },
      {
        id: "sr-pub-2",
        input: "nums = [4, 5, 6, 7, 0, 1, 2], target = 3",
        expected: "-1",
        argsJson: "[[4, 5, 6, 7, 0, 1, 2], 3]"
      },
      {
        id: "sr-pub-3",
        input: "nums = [1], target = 0",
        expected: "-1",
        argsJson: "[[1], 0]"
      }
    ],
    hiddenTestCases: [
      {
        id: "sr-hid-1",
        input: "nums = [1], target = 1",
        expected: "0",
        argsJson: "[[1], 1]",
        isHidden: true
      },
      {
        id: "sr-hid-2",
        input: "nums = [3, 1], target = 1",
        expected: "1",
        argsJson: "[[3, 1], 1]",
        isHidden: true
      },
      {
        id: "sr-hid-3",
        input: "nums = [5, 1, 3], target = 5",
        expected: "0",
        argsJson: "[[5, 1, 3], 5]",
        isHidden: true
      }
    ],
    followUpQuestions: [
      {
        id: "sr-fu-1",
        question: "What happens if the array contains duplicate elements? Does O(log N) worst-case still hold?",
        expectedInsight: "No, if `nums[low] == nums[mid] == nums[high]`, we cannot tell which half is sorted and must increment low and decrement high, degrading worst-case complexity to O(N)."
      }
    ]
  },

  // ── 5. BOOK ALLOCATION PROBLEM ──
  "book-allocation-problem": {
    id: "book-allocation-problem",
    title: "Book Allocation Problem",
    step_title: "Step 4: Binary Search",
    subtopic_title: "BS on Answers",
    difficulty: "hard",
    time_complexity: "O(N log(sum))",
    space_complexity: "O(1)",
    functionName: "allocateBooks",
    cppSignature: "int allocateBooks(vector<int>& arr, int m)",
    pythonSignature: "def allocateBooks(arr: list[int], m: int) -> int:",
    jsSignature: "function allocateBooks(arr, m)",
    javaSignature: "public int allocateBooks(int[] arr, int m)",
    fullDescription: 
      "Given an array `arr` of integer page counts of `n` books and an integer `m` representing the number of students. Each book must be allocated to a student. All books must be allocated, each student gets at least one book, and allocations must be contiguous. Minimize the maximum number of pages allocated to any student. If allocation is impossible (m > n), return -1.",
    inputFormat: "An array of positive integers `arr` and an integer `m`.",
    outputFormat: "Return the minimum possible maximum page count, or -1 if m > arr.length.",
    constraints: [
      "1 <= m <= 10^5",
      "1 <= arr.length <= 10^5",
      "1 <= arr[i] <= 10^5"
    ],
    examples: [
      {
        input: "arr = [12, 34, 67, 90], m = 2",
        output: "113",
        explanation: "Allocation [12, 34, 67] (113 pages) and [90] (90 pages) minimizes the maximum allocated pages to 113."
      },
      {
        input: "arr = [25, 46, 28, 49, 24], m = 4",
        output: "71",
        explanation: "Allocation: [25, 46]=71, [28]=28, [49]=49, [24]=24. Maximum pages is 71."
      }
    ],
    edgeCases: [
      "m > arr.length: impossible to give each student at least 1 book; return -1.",
      "m == arr.length: each student receives exactly 1 book; answer is max(arr)."
    ],
    hints: [
      "Hint 1: Range of answer is [max(arr), sum(arr)].",
      "Hint 2: Monotonic predicate: if max pages X is possible with <= m students, so is any X' > X."
    ],
    starterCode: {
      python: `def allocateBooks(arr: list[int], m: int) -> int:
    # Write your solution here
    pass
`,
      javascript: `function allocateBooks(arr, m) {
    // Write your solution here
    
}
`,
      cpp: `int allocateBooks(vector<int>& arr, int m) {
    // Write your solution here
    return -1;
}
`,
      java: `public int allocateBooks(int[] arr, int m) {
    // Write your solution here
    return -1;
}
`
    },
    referenceSolution: {
      python: `def allocateBooks(arr: list[int], m: int) -> int:
    if m > len(arr):
        return -1
    def countStudents(maxPages):
        students = 1
        pages = 0
        for x in arr:
            if pages + x <= maxPages:
                pages += x
            else:
                students += 1
                pages = x
        return students

    low = max(arr)
    high = sum(arr)
    ans = high
    while low <= high:
        mid = (low + high) // 2
        if countStudents(mid) <= m:
            ans = mid
            high = mid - 1
        else:
            low = mid + 1
    return ans
`,
      javascript: `function allocateBooks(arr, m) {
    if (m > arr.length) return -1;
    function countStudents(maxPages) {
        let students = 1, pages = 0;
        for (let x of arr) {
            if (pages + x <= maxPages) {
                pages += x;
            } else {
                students++;
                pages = x;
            }
        }
        return students;
    }
    let low = Math.max(...arr);
    let high = arr.reduce((a, b) => a + b, 0);
    let ans = high;
    while (low <= high) {
        let mid = Math.floor((low + high) / 2);
        if (countStudents(mid) <= m) {
            ans = mid;
            high = mid - 1;
        } else {
            low = mid + 1;
        }
    }
    return ans;
}
`,
      cpp: `int allocateBooks(vector<int>& arr, int m) {
    if (m > (int)arr.size()) return -1;
    long long low = *max_element(arr.begin(), arr.end());
    long long high = 0;
    for (int x : arr) high += x;

    auto countStudents = [&](long long maxPages) -> int {
        int students = 1;
        long long pages = 0;
        for (int x : arr) {
            if (pages + x <= maxPages) pages += x;
            else {
                students++;
                pages = x;
            }
        }
        return students;
    };

    long long ans = high;
    while (low <= high) {
        long long mid = low + (high - low) / 2;
        if (countStudents(mid) <= m) {
            ans = mid;
            high = mid - 1;
        } else {
            low = mid + 1;
        }
    }
    return (int)ans;
}
`,
      java: `public int allocateBooks(int[] arr, int m) {
    if (m > arr.length) return -1;
    long low = 0, high = 0;
    for (int x : arr) {
        low = Math.max(low, x);
        high += x;
    }
    long ans = high;
    while (low <= high) {
        long mid = low + (high - low) / 2;
        int students = 1;
        long pages = 0;
        for (int x : arr) {
            if (pages + x <= mid) pages += x;
            else {
                students++;
                pages = x;
            }
        }
        if (students <= m) {
            ans = mid;
            high = mid - 1;
        } else {
            low = mid + 1;
        }
    }
    return (int)ans;
}
`
    },
    publicTestCases: [
      {
        id: "ab-pub-1",
        input: "arr = [12, 34, 67, 90], m = 2",
        expected: "113",
        argsJson: "[[12, 34, 67, 90], 2]"
      },
      {
        id: "ab-pub-2",
        input: "arr = [25, 46, 28, 49, 24], m = 4",
        expected: "71",
        argsJson: "[[25, 46, 28, 49, 24], 4]"
      }
    ],
    hiddenTestCases: [
      {
        id: "ab-hid-1",
        input: "arr = [10, 20], m = 3",
        expected: "-1",
        argsJson: "[[10, 20], 3]",
        isHidden: true
      },
      {
        id: "ab-hid-2",
        input: "arr = [10, 10, 10, 10], m = 2",
        expected: "20",
        argsJson: "[[10, 10, 10, 10], 2]",
        isHidden: true
      }
    ],
    followUpQuestions: [
      {
        id: "ab-fu-1",
        question: "How is Book Allocation mathematically equivalent to Painter's Partition and Split Array Largest Sum?",
        expectedInsight: "All three partition a contiguous 1D sequence into k subsegments minimizing the maximum subsegment sum using binary search on answer range."
      }
    ]
  },

  // ── 6. TWO SUM ──
  "two-sum-check-pair-with-target": {
    id: "two-sum-check-pair-with-target",
    title: "Two Sum - Check pair with Target",
    step_title: "Step 3: Solve Problems on Arrays",
    subtopic_title: "Medium Array Problems",
    difficulty: "easy",
    time_complexity: "O(N)",
    space_complexity: "O(N)",
    functionName: "twoSum",
    cppSignature: "vector<int> twoSum(vector<int>& nums, int target)",
    pythonSignature: "def twoSum(nums: list[int], target: int) -> list[int]:",
    jsSignature: "function twoSum(nums, target)",
    javaSignature: "public int[] twoSum(int[] nums, int target)",
    fullDescription:
      "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.",
    inputFormat: "An array of integers `nums` and an integer `target`.",
    outputFormat: "Return a 2-element array containing the zero-based indices of the two numbers.",
    constraints: [
      "2 <= nums.length <= 10^4",
      "-10^9 <= nums[i] <= 10^9",
      "-10^9 <= target <= 10^9",
      "Only one valid answer exists."
    ],
    examples: [
      {
        input: "nums = [2, 7, 11, 15], target = 9",
        output: "[0, 1]",
        explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
      },
      {
        input: "nums = [3, 2, 4], target = 6",
        output: "[1, 2]",
        explanation: "nums[1] + nums[2] == 6, we return [1, 2]."
      },
      {
        input: "nums = [3, 3], target = 6",
        output: "[0, 1]",
        explanation: "nums[0] + nums[1] == 6, we return [0, 1]."
      }
    ],
    edgeCases: [
      "Negative numbers in array and target: nums = [-1, -2, -3, -4, -5], target = -8 -> [2, 4].",
      "Two identical numbers that add up to target: nums = [3, 3], target = 6."
    ],
    hints: [
      "Hint 1: Can you use a hash map to check whether (target - nums[i]) was already seen?",
      "Hint 2: Insert each number and its index into the map as you iterate through the array."
    ],
    starterCode: {
      python: `def twoSum(nums: list[int], target: int) -> list[int]:
    # Write your solution here
    pass
`,
      javascript: `function twoSum(nums, target) {
    // Write your solution here
    
}
`,
      cpp: `vector<int> twoSum(vector<int>& nums, int target) {
    // Write your solution here
    return {};
}
`,
      java: `public int[] twoSum(int[] nums, int target) {
    // Write your solution here
    return new int[]{};
}
`
    },
    referenceSolution: {
      python: `def twoSum(nums: list[int], target: int) -> list[int]:
    lookup = {}
    for i, x in enumerate(nums):
        diff = target - x
        if diff in lookup:
            return [lookup[diff], i]
        lookup[x] = i
    return []
`,
      javascript: `function twoSum(nums, target) {
    const map = new Map();
    for (let i = 0; i < nums.length; i++) {
        const diff = target - nums[i];
        if (map.has(diff)) {
            return [map.get(diff), i];
        }
        map.set(nums[i], i);
    }
    return [];
}
`,
      cpp: `vector<int> twoSum(vector<int>& nums, int target) {
    unordered_map<int, int> seen;
    for (int i = 0; i < (int)nums.size(); i++) {
        int diff = target - nums[i];
        if (seen.find(diff) != seen.end()) {
            return {seen[diff], i};
        }
        seen[nums[i]] = i;
    }
    return {};
}
`,
      java: `public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        int diff = target - nums[i];
        if (seen.containsKey(diff)) {
            return new int[]{seen.get(diff), i};
        }
        seen.put(nums[i], i);
    }
    return new int[]{};
}
`
    },
    publicTestCases: [
      {
        id: "ts-pub-1",
        input: "nums = [2, 7, 11, 15], target = 9",
        expected: "[0, 1]",
        argsJson: "[[2, 7, 11, 15], 9]"
      },
      {
        id: "ts-pub-2",
        input: "nums = [3, 2, 4], target = 6",
        expected: "[1, 2]",
        argsJson: "[[3, 2, 4], 6]"
      },
      {
        id: "ts-pub-3",
        input: "nums = [3, 3], target = 6",
        expected: "[0, 1]",
        argsJson: "[[3, 3], 6]"
      }
    ],
    hiddenTestCases: [
      {
        id: "ts-hid-1",
        input: "nums = [-1, -2, -3, -4, -5], target = -8",
        expected: "[2, 4]",
        argsJson: "[[-1, -2, -3, -4, -5], -8]",
        isHidden: true
      },
      {
        id: "ts-hid-2",
        input: "nums = [0, 4, 3, 0], target = 0",
        expected: "[0, 3]",
        argsJson: "[[0, 4, 3, 0], 0]",
        isHidden: true
      }
    ],
    followUpQuestions: [
      {
        id: "ts-fu-1",
        question: "How does the hash map approach compare to the two-pointer approach after sorting in terms of space and time?",
        expectedInsight: "Hash map is O(N) time and O(N) space. Two-pointer requires O(N log N) sorting and preserves O(1) auxiliary space (though indices must be tracked)."
      }
    ]
  },

  // ── 7. COUNT DIGITS IN A NUMBER (STEP 1: BASICS) ──
  "count-digits-in-a-number": {
    id: "count-digits-in-a-number",
    title: "Count Digits in a Number",
    step_title: "Step 1: Learn the basics",
    subtopic_title: "Basic Maths",
    difficulty: "easy",
    time_complexity: "O(log10(N))",
    space_complexity: "O(1)",
    functionName: "countDigits",
    cppSignature: "int countDigits(int n)",
    pythonSignature: "def countDigits(n: int) -> int:",
    jsSignature: "function countDigits(n)",
    javaSignature: "public int countDigits(int n)",
    fullDescription: "Given an integer n, calculate the count of digits in n. For n = 0, the number of digits is 1.",
    inputFormat: "A single integer n.",
    outputFormat: "Return the count of digits in n.",
    constraints: ["0 <= n <= 2 * 10^9"],
    examples: [
      { input: "n = 12345", output: "5", explanation: "12345 has 5 digits." },
      { input: "n = 7", output: "1", explanation: "7 has 1 digit." },
      { input: "n = 0", output: "1", explanation: "0 has 1 digit." }
    ],
    edgeCases: [
      "n = 0: Must return 1.",
      "Large numbers close to 2 * 10^9: 10 digits."
    ],
    hints: [
      "Hint 1: You can repeatedly divide by 10 until n becomes 0.",
      "Hint 2: Special case: if n == 0, count is 1."
    ],
    starterCode: {
      python: `def countDigits(n: int) -> int:\n    # Write your solution here\n    pass\n`,
      javascript: `function countDigits(n) {\n    // Write your solution here\n    \n}\n`,
      cpp: `int countDigits(int n) {\n    // Write your solution here\n    return 0;\n}\n`,
      java: `public int countDigits(int n) {\n    // Write your solution here\n    return 0;\n}\n`
    },
    referenceSolution: {
      python: `def countDigits(n: int) -> int:\n    if n == 0:\n        return 1\n    cnt = 0\n    while n > 0:\n        cnt += 1\n        n //= 10\n    return cnt\n`,
      javascript: `function countDigits(n) {\n    if (n === 0) return 1;\n    let cnt = 0;\n    while (n > 0) {\n        cnt++;\n        n = Math.floor(n / 10);\n    }\n    return cnt;\n}\n`,
      cpp: `int countDigits(int n) {\n    if (n == 0) return 1;\n    int cnt = 0;\n    while (n > 0) {\n        cnt++;\n        n /= 10;\n    }\n    return cnt;\n}\n`,
      java: `public int countDigits(int n) {\n    if (n == 0) return 1;\n    int cnt = 0;\n    while (n > 0) {\n        cnt++;\n        n /= 10;\n    }\n    return cnt;\n}\n`
    },
    publicTestCases: [
      { id: "cd-pub-1", input: "n = 12345", expected: "5", argsJson: "[12345]" },
      { id: "cd-pub-2", input: "n = 7", expected: "1", argsJson: "[7]" }
    ],
    hiddenTestCases: [
      { id: "cd-hid-1", input: "n = 0", expected: "1", argsJson: "[0]", isHidden: true },
      { id: "cd-hid-2", input: "n = 1000000", expected: "7", argsJson: "[1000000]", isHidden: true }
    ],
    followUpQuestions: [
      {
        id: "cd-fu-1",
        question: "Can this be solved in O(1) time using logarithm?",
        expectedInsight: "Yes, using floor(log10(n)) + 1 for n > 0."
      }
    ]
  },

  // ── 8. REVERSE A NUMBER WITH OVERFLOW (STEP 1: BASICS) ──
  "reverse-a-number-with-overflow": {
    id: "reverse-a-number-with-overflow",
    title: "Reverse a Number with Overflow",
    step_title: "Step 1: Learn the basics",
    subtopic_title: "Basic Maths",
    difficulty: "easy",
    time_complexity: "O(log10(N))",
    space_complexity: "O(1)",
    functionName: "reverseNumber",
    cppSignature: "int reverseNumber(int x)",
    pythonSignature: "def reverseNumber(x: int) -> int:",
    jsSignature: "function reverseNumber(x)",
    javaSignature: "public int reverseNumber(int x)",
    fullDescription: "Given a signed 32-bit integer x, return x with its digits reversed. If reversing x causes the value to go outside the signed 32-bit integer range [-2^31, 2^31 - 1], then return 0.",
    inputFormat: "A 32-bit signed integer x.",
    outputFormat: "Return the reversed integer, or 0 on overflow.",
    constraints: ["-2^31 <= x <= 2^31 - 1"],
    examples: [
      { input: "x = 123", output: "321", explanation: "Reversing 123 yields 321." },
      { input: "x = -123", output: "-321", explanation: "Reversing -123 yields -321." },
      { input: "x = 120", output: "21", explanation: "Reversing 120 yields 21." }
    ],
    edgeCases: [
      "Overflow case: x = 1534236469 reversed exceeds 2^31 - 1, return 0.",
      "Negative numbers: sign preserved."
    ],
    hints: [
      "Hint 1: Pop digits from x using % 10 and push them onto rev using rev * 10 + pop.",
      "Hint 2: Check for 32-bit overflow before multiplying by 10."
    ],
    starterCode: {
      python: `def reverseNumber(x: int) -> int:\n    # Write your solution here\n    pass\n`,
      javascript: `function reverseNumber(x) {\n    // Write your solution here\n    \n}\n`,
      cpp: `int reverseNumber(int x) {\n    // Write your solution here\n    return 0;\n}\n`,
      java: `public int reverseNumber(int x) {\n    // Write your solution here\n    return 0;\n}\n`
    },
    referenceSolution: {
      python: `def reverseNumber(x: int) -> int:\n    sign = -1 if x < 0 else 1\n    x = abs(x)\n    rev = 0\n    while x > 0:\n        rev = rev * 10 + (x % 10)\n        x //= 10\n    rev *= sign\n    if rev < -2**31 or rev > 2**31 - 1:\n        return 0\n    return rev\n`,
      javascript: `function reverseNumber(x) {\n    const sign = x < 0 ? -1 : 1;\n    let n = Math.abs(x);\n    let rev = 0;\n    while (n > 0) {\n        rev = rev * 10 + (n % 10);\n        n = Math.floor(n / 10);\n    }\n    rev *= sign;\n    if (rev < -2147483648 || rev > 2147483647) return 0;\n    return rev;\n}\n`,
      cpp: `int reverseNumber(int x) {\n    long long rev = 0;\n    while (x != 0) {\n        rev = rev * 10 + (x % 10);\n        x /= 10;\n    }\n    if (rev < INT_MIN || rev > INT_MAX) return 0;\n    return (int)rev;\n}\n`,
      java: `public int reverseNumber(int x) {\n    long rev = 0;\n    while (x != 0) {\n        rev = rev * 10 + (x % 10);\n        x /= 10;\n    }\n    if (rev < Integer.MIN_VALUE || rev > Integer.MAX_VALUE) return 0;\n    return (int)rev;\n}\n`
    },
    publicTestCases: [
      { id: "rn-pub-1", input: "x = 123", expected: "321", argsJson: "[123]" },
      { id: "rn-pub-2", input: "x = -123", expected: "-321", argsJson: "[-123]" }
    ],
    hiddenTestCases: [
      { id: "rn-hid-1", input: "x = 120", expected: "21", argsJson: "[120]", isHidden: true },
      { id: "rn-hid-2", input: "x = 1534236469", expected: "0", argsJson: "[1534236469]", isHidden: true }
    ],
    followUpQuestions: [
      {
        id: "rn-fu-1",
        question: "How do you avoid 64-bit integer variables in environments that strictly restrict 32-bit registers?",
        expectedInsight: "Check if rev > INT_MAX / 10 or (rev == INT_MAX / 10 and pop > 7) before multiplying."
      }
    ]
  },

  // ── 9. CHECK PALINDROME NUMBER (STEP 1: BASICS) ──
  "check-palindrome-number": {
    id: "check-palindrome-number",
    title: "Check Palindrome Number",
    step_title: "Step 1: Learn the basics",
    subtopic_title: "Basic Maths",
    difficulty: "easy",
    time_complexity: "O(log10(N))",
    space_complexity: "O(1)",
    functionName: "isPalindromeNumber",
    cppSignature: "bool isPalindromeNumber(int n)",
    pythonSignature: "def isPalindromeNumber(n: int) -> bool:",
    jsSignature: "function isPalindromeNumber(n)",
    javaSignature: "public boolean isPalindromeNumber(int n)",
    fullDescription: "Given an integer n, return true if n is a palindrome, and false otherwise. An integer is a palindrome when it reads the same forward and backward.",
    inputFormat: "An integer n.",
    outputFormat: "Return true or false.",
    constraints: ["-2^31 <= n <= 2^31 - 1"],
    examples: [
      { input: "n = 121", output: "true", explanation: "121 reads as 121 from left to right and right to left." },
      { input: "n = -121", output: "false", explanation: "From left to right it reads -121, from right to left 121-." }
    ],
    edgeCases: [
      "Negative numbers: always false because of leading negative sign.",
      "Numbers ending in 0 (except 0 itself): false."
    ],
    hints: [
      "Hint 1: Negative numbers cannot be palindromes.",
      "Hint 2: Reverse half of the number to avoid 32-bit overflow."
    ],
    starterCode: {
      python: `def isPalindromeNumber(n: int) -> bool:\n    # Write your solution here\n    pass\n`,
      javascript: `function isPalindromeNumber(n) {\n    // Write your solution here\n    \n}\n`,
      cpp: `bool isPalindromeNumber(int n) {\n    // Write your solution here\n    return false;\n}\n`,
      java: `public boolean isPalindromeNumber(int n) {\n    // Write your solution here\n    return false;\n}\n`
    },
    referenceSolution: {
      python: `def isPalindromeNumber(n: int) -> bool:\n    if n < 0:\n        return False\n    if n == 0:\n        return True\n    if n % 10 == 0:\n        return False\n    rev = 0\n    curr = n\n    while curr > 0:\n        rev = rev * 10 + (curr % 10)\n        curr //= 10\n    return rev == n\n`,
      javascript: `function isPalindromeNumber(n) {\n    if (n < 0) return false;\n    if (n === 0) return true;\n    if (n % 10 === 0) return false;\n    let rev = 0, curr = n;\n    while (curr > 0) {\n        rev = rev * 10 + (curr % 10);\n        curr = Math.floor(curr / 10);\n    }\n    return rev === n;\n}\n`,
      cpp: `bool isPalindromeNumber(int n) {\n    if (n < 0) return false;\n    if (n == 0) return true;\n    if (n % 10 == 0) return false;\n    long long rev = 0;\n    long long curr = n;\n    while (curr > 0) {\n        rev = rev * 10 + (curr % 10);\n        curr /= 10;\n    }\n    return rev == (long long)n;\n}\n`,
      java: `public boolean isPalindromeNumber(int n) {\n    if (n < 0) return false;\n    if (n == 0) return true;\n    if (n % 10 == 0) return false;\n    long rev = 0, curr = n;\n    while (curr > 0) {\n        rev = rev * 10 + (curr % 10);\n        curr /= 10;\n    }\n    return rev == n;\n}\n`
    },
    publicTestCases: [
      { id: "pn-pub-1", input: "n = 121", expected: "true", argsJson: "[121]" },
      { id: "pn-pub-2", input: "n = -121", expected: "false", argsJson: "[-121]" }
    ],
    hiddenTestCases: [
      { id: "pn-hid-1", input: "n = 10", expected: "false", argsJson: "[10]", isHidden: true },
      { id: "pn-hid-2", input: "n = 12321", expected: "true", argsJson: "[12321]", isHidden: true }
    ],
    followUpQuestions: [
      {
        id: "pn-fu-1",
        question: "Can you solve it without reversing the entire number?",
        expectedInsight: "Yes, revert only half the number and compare rev == n or rev / 10 == n."
      }
    ]
  },

  // ── 10. SELECTION SORT (STEP 2: SORTING) ──
  "selection-sort": {
    id: "selection-sort",
    title: "Selection Sort",
    step_title: "Step 2: Learn Important Sorting Techniques",
    subtopic_title: "Sorting-I",
    difficulty: "easy",
    time_complexity: "O(N^2)",
    space_complexity: "O(1)",
    functionName: "selectionSort",
    cppSignature: "vector<int> selectionSort(vector<int>& arr)",
    pythonSignature: "def selectionSort(arr: list[int]) -> list[int]:",
    jsSignature: "function selectionSort(arr)",
    javaSignature: "public int[] selectionSort(int[] arr)",
    fullDescription: "Given an unsorted array of size N, use selection sort to sort the array in non-decreasing order.",
    inputFormat: "An array of integers arr.",
    outputFormat: "Return the sorted array.",
    constraints: ["1 <= arr.length <= 10^3", "-10^4 <= arr[i] <= 10^4"],
    examples: [
      { input: "arr = [13, 46, 24, 52, 20, 9]", output: "[9, 13, 20, 24, 46, 52]", explanation: "Array sorted in ascending order." },
      { input: "arr = [5, 4, 3, 2, 1]", output: "[1, 2, 3, 4, 5]", explanation: "Reverse sorted array." }
    ],
    edgeCases: [
      "Single element array: already sorted.",
      "Array with duplicates: correctly preserves duplicates in sorted order."
    ],
    hints: [
      "Hint 1: In each pass i from 0 to n-1, find the index of the minimum element in arr[i..n-1] and swap with arr[i]."
    ],
    starterCode: {
      python: `def selectionSort(arr: list[int]) -> list[int]:\n    # Write your solution here\n    pass\n`,
      javascript: `function selectionSort(arr) {\n    // Write your solution here\n    \n}\n`,
      cpp: `vector<int> selectionSort(vector<int>& arr) {\n    // Write your solution here\n    return arr;\n}\n`,
      java: `public int[] selectionSort(int[] arr) {\n    // Write your solution here\n    return arr;\n}\n`
    },
    referenceSolution: {
      python: `def selectionSort(arr: list[int]) -> list[int]:\n    n = len(arr)\n    for i in range(n):\n        min_idx = i\n        for j in range(i + 1, n):\n            if arr[j] < arr[min_idx]:\n                min_idx = j\n        arr[i], arr[min_idx] = arr[min_idx], arr[i]\n    return arr\n`,
      javascript: `function selectionSort(arr) {\n    const n = arr.length;\n    for (let i = 0; i < n; i++) {\n        let minIdx = i;\n        for (let j = i + 1; j < n; j++) {\n            if (arr[j] < arr[minIdx]) minIdx = j;\n        }\n        const temp = arr[i];\n        arr[i] = arr[minIdx];\n        arr[minIdx] = temp;\n    }\n    return arr;\n}\n`,
      cpp: `vector<int> selectionSort(vector<int>& arr) {\n    int n = arr.size();\n    for (int i = 0; i < n; i++) {\n        int minIdx = i;\n        for (int j = i + 1; j < n; j++) {\n            if (arr[j] < arr[minIdx]) minIdx = j;\n        }\n        swap(arr[i], arr[minIdx]);\n    }\n    return arr;\n}\n`,
      java: `public int[] selectionSort(int[] arr) {\n    int n = arr.length;\n    for (int i = 0; i < n; i++) {\n        int minIdx = i;\n        for (int j = i + 1; j < n; j++) {\n            if (arr[j] < arr[minIdx]) minIdx = j;\n        }\n        int temp = arr[i];\n        arr[i] = arr[minIdx];\n        arr[minIdx] = temp;\n    }\n    return arr;\n}\n`
    },
    publicTestCases: [
      { id: "ss-pub-1", input: "arr = [13, 46, 24, 52, 20, 9]", expected: "[9, 13, 20, 24, 46, 52]", argsJson: "[[13, 46, 24, 52, 20, 9]]" },
      { id: "ss-pub-2", input: "arr = [5, 4, 3, 2, 1]", expected: "[1, 2, 3, 4, 5]", argsJson: "[[5, 4, 3, 2, 1]]" }
    ],
    hiddenTestCases: [
      { id: "ss-hid-1", input: "arr = [1]", expected: "[1]", argsJson: "[[1]]", isHidden: true },
      { id: "ss-hid-2", input: "arr = [2, 1, 2, 1]", expected: "[1, 1, 2, 2]", argsJson: "[[2, 1, 2, 1]]", isHidden: true }
    ],
    followUpQuestions: [
      {
        id: "ss-fu-1",
        question: "Is Selection Sort stable?",
        expectedInsight: "Default selection sort with swaps is not stable because swapping can invert order of equal keys."
      }
    ]
  },

  // ── 11. REVERSE WORDS IN A STRING (STEP 5: STRINGS) ──
  "reverse-words-in-a-string": {
    id: "reverse-words-in-a-string",
    title: "Reverse Words in a String",
    step_title: "Step 5: Strings (Basic and Medium)",
    subtopic_title: "Basic Strings",
    difficulty: "medium",
    time_complexity: "O(N)",
    space_complexity: "O(1)",
    functionName: "reverseWords",
    cppSignature: "string reverseWords(string s)",
    pythonSignature: "def reverseWords(s: str) -> str:",
    jsSignature: "function reverseWords(s)",
    javaSignature: "public String reverseWords(String s)",
    fullDescription: "Given an input string s, reverse the order of the words. A word is defined as a sequence of non-space characters. The words in s will be separated by at least one space. Return a string of the words in reverse order concatenated by a single space. Note that s may contain leading or trailing spaces or multiple spaces between two words. The returned string should only have a single space separating the words. Do not include any extra spaces.",
    inputFormat: "A string s.",
    outputFormat: "Return the reversed words string.",
    constraints: ["1 <= s.length <= 10^4", "s contains English letters, digits, and spaces ' '."],
    examples: [
      { input: "s = \"the sky is blue\"", output: "blue is sky the", explanation: "Words reversed in order." },
      { input: "s = \"  hello world  \"", output: "world hello", explanation: "Leading and trailing spaces stripped." }
    ],
    edgeCases: [
      "Multiple spaces between words: compressed to single space.",
      "Single word with spaces: returns just the word without extra spaces."
    ],
    hints: [
      "Hint 1: Split string by whitespace or reverse the entire string then reverse each individual word."
    ],
    starterCode: {
      python: `def reverseWords(s: str) -> str:\n    # Write your solution here\n    pass\n`,
      javascript: `function reverseWords(s) {\n    // Write your solution here\n    \n}\n`,
      cpp: `string reverseWords(string s) {\n    // Write your solution here\n    return "";\n}\n`,
      java: `public String reverseWords(String s) {\n    // Write your solution here\n    return "";\n}\n`
    },
    referenceSolution: {
      python: `def reverseWords(s: str) -> str:\n    return " ".join(s.strip().split()[::-1])\n`,
      javascript: `function reverseWords(s) {\n    return s.trim().split(/\\s+/).reverse().join(" ");\n}\n`,
      cpp: `string reverseWords(string s) {\n    vector<string> words;\n    string word;\n    for (char c : s) {\n        if (c == ' ') {\n            if (!word.empty()) {\n                words.push_back(word);\n                word.clear();\n            }\n        } else {\n            word += c;\n        }\n    }\n    if (!word.empty()) words.push_back(word);\n    reverse(words.begin(), words.end());\n    string res;\n    for (int i = 0; i < (int)words.size(); i++) {\n        if (i > 0) res += " ";\n        res += words[i];\n    }\n    return res;\n}\n`,
      java: `public String reverseWords(String s) {\n    String[] parts = s.trim().split("\\\\s+");\n    StringBuilder sb = new StringBuilder();\n    for (int i = parts.length - 1; i >= 0; i--) {\n        sb.append(parts[i]);\n        if (i > 0) sb.append(" ");\n    }\n    return sb.toString();\n}\n`
    },
    publicTestCases: [
      { id: "rw-pub-1", input: "s = \"the sky is blue\"", expected: "blue is sky the", argsJson: "[\"the sky is blue\"]" },
      { id: "rw-pub-2", input: "s = \"  hello world  \"", expected: "world hello", argsJson: "[\"  hello world  \"]" }
    ],
    hiddenTestCases: [
      { id: "rw-hid-1", input: "s = \"a good   example\"", expected: "example good a", argsJson: "[\"a good   example\"]", isHidden: true }
    ],
    followUpQuestions: [
      {
        id: "rw-fu-1",
        question: "Can this be done in O(1) extra space in languages with mutable strings?",
        expectedInsight: "Yes, by in-place reversing the entire string, then reversing each word, then shifting characters to clean multiple spaces."
      }
    ]
  },

  // ── 11. FIND PEAK ELEMENT (Step 4) ──
  "find-peak-element": {
    id: "find-peak-element",
    title: "Find Peak Element",
    step_title: "Step 4: Binary Search",
    subtopic_title: "BS on 1D Arrays",
    difficulty: "medium",
    time_complexity: "O(log N)",
    space_complexity: "O(1)",
    functionName: "findPeakElement",
    cppSignature: "int findPeakElement(vector<int>& nums)",
    pythonSignature: "def findPeakElement(nums: list[int]) -> int:",
    jsSignature: "function findPeakElement(nums) {",
    javaSignature: "public int findPeakElement(int[] nums)",
    fullDescription: `A peak element is an element that is strictly greater than its neighbors.

Given a 0-indexed integer array \`nums\`, find a peak element, and return its index. If the array contains multiple peaks, return the index to any of the peaks.

You may imagine that \`nums[-1] = nums[n] = -∞\`. In other words, an element is always considered to be strictly greater than a neighbor that is outside the array.

You must write an algorithm that runs in \`O(log n)\` time.`,
    inputFormat: "An array of integers `nums` where `nums[i] != nums[i + 1]` for all valid `i`.",
    outputFormat: "Return the 0-based index of any peak element in `nums`.",
    constraints: [
      "1 <= nums.length <= 10^5",
      "-2^31 <= nums[i] <= 2^31 - 1",
      "nums[i] != nums[i + 1] for all valid i"
    ],
    examples: [
      {
        input: "nums = [1, 2, 3, 1]",
        output: "2",
        explanation: "3 is a peak element and your function should return the index number 2."
      },
      {
        input: "nums = [1, 2, 1, 3, 5, 6, 4]",
        output: "5",
        explanation: "Your function can return either index number 1 where the peak element is 2, or index number 5 where the peak element is 6."
      }
    ],
    edgeCases: [
      "Single element array (peak is at index 0)",
      "Strictly increasing array (peak is at the last element)",
      "Strictly decreasing array (peak is at index 0)"
    ],
    hints: [
      "Can you use binary search even though the entire array isn't sorted?",
      "Observe the slope at mid: if `nums[mid] < nums[mid + 1]`, a peak is guaranteed to exist on the right side.",
      "If `nums[mid] > nums[mid + 1]`, a peak is guaranteed to exist on the left side or at mid."
    ],
    starterCode: {
      python: `def findPeakElement(nums: list[int]) -> int:\n    # Write your O(log N) solution here\n    pass\n`,
      javascript: `function findPeakElement(nums) {\n    // Write your O(log N) solution here\n}\n`,
      cpp: `int findPeakElement(vector<int>& nums) {\n    // Write your O(log N) solution here\n    return 0;\n}\n`,
      java: `public int findPeakElement(int[] nums) {\n    // Write your O(log N) solution here\n    return 0;\n}\n`
    },
    referenceSolution: {
      python: `def findPeakElement(nums: list[int]) -> int:\n    n = len(nums)\n    if n == 1:\n        return 0\n    if nums[0] > nums[1]:\n        return 0\n    if nums[n - 1] > nums[n - 2]:\n        return n - 1\n    low, high = 1, n - 2\n    while low <= high:\n        mid = (low + high) // 2\n        if nums[mid] > nums[mid - 1] and nums[mid] > nums[mid + 1]:\n            return mid\n        elif nums[mid] > nums[mid - 1]:\n            low = mid + 1\n        else:\n            high = mid - 1\n    return -1\n`,
      javascript: `function findPeakElement(nums) {\n    const n = nums.length;\n    if (n === 1) return 0;\n    if (nums[0] > nums[1]) return 0;\n    if (nums[n - 1] > nums[n - 2]) return n - 1;\n    let low = 1, high = n - 2;\n    while (low <= high) {\n        const mid = Math.floor((low + high) / 2);\n        if (nums[mid] > nums[mid - 1] && nums[mid] > nums[mid + 1]) return mid;\n        if (nums[mid] > nums[mid - 1]) low = mid + 1;\n        else high = mid - 1;\n    }\n    return -1;\n}\n`,
      cpp: `int findPeakElement(vector<int>& nums) {\n    int n = nums.size();\n    if (n == 1) return 0;\n    if (nums[0] > nums[1]) return 0;\n    if (nums[n - 1] > nums[n - 2]) return n - 1;\n    int low = 1, high = n - 2;\n    while (low <= high) {\n        int mid = low + (high - low) / 2;\n        if (nums[mid] > nums[mid - 1] && nums[mid] > nums[mid + 1]) return mid;\n        if (nums[mid] > nums[mid - 1]) low = mid + 1;\n        else high = mid - 1;\n    }\n    return -1;\n}\n`,
      java: `public int findPeakElement(int[] nums) {\n    int n = nums.length;\n    if (n == 1) return 0;\n    if (nums[0] > nums[1]) return 0;\n    if (nums[n - 1] > nums[n - 2]) return n - 1;\n    int low = 1, high = n - 2;\n    while (low <= high) {\n        int mid = low + (high - low) / 2;\n        if (nums[mid] > nums[mid - 1] && nums[mid] > nums[mid + 1]) return mid;\n        if (nums[mid] > nums[mid - 1]) low = mid + 1;\n        else high = mid - 1;\n    }\n    return -1;\n}\n`
    },
    publicTestCases: [
      { id: "fpe-pub-1", input: "nums = [1, 2, 3, 1]", expected: "2", argsJson: "[[1, 2, 3, 1]]" },
      { id: "fpe-pub-2", input: "nums = [1, 2, 1, 3, 5, 6, 4]", expected: "5", argsJson: "[[1, 2, 1, 3, 5, 6, 4]]" },
      { id: "fpe-pub-3", input: "nums = [1]", expected: "0", argsJson: "[[1]]" }
    ],
    hiddenTestCases: [
      { id: "fpe-hid-1", input: "nums = [2, 1]", expected: "0", argsJson: "[[2, 1]]", isHidden: true },
      { id: "fpe-hid-2", input: "nums = [1, 2]", expected: "1", argsJson: "[[1, 2]]", isHidden: true },
      { id: "fpe-hid-3", input: "nums = [1, 3, 20, 4, 1, 0]", expected: "2", argsJson: "[[1, 3, 20, 4, 1, 0]]", isHidden: true }
    ],
    followUpQuestions: [
      {
        id: "fpe-fu-1",
        question: "Why does binary search work on this array even though it is unsorted?",
        expectedInsight: "Binary search does not strictly require a sorted array; it only requires a condition to eliminate half of the search space. By comparing mid with mid+1, we know which slope we are on and can guarantee a local maximum exists in the direction of the upward slope."
      }
    ]
  }
};

// Aliases for matching alternate IDs
CANONICAL_DSA_PROBLEMS["search-in-rotated-sorted-array-i-unique"] = CANONICAL_DSA_PROBLEMS["search-in-rotated-sorted-array"];
CANONICAL_DSA_PROBLEMS["search-in-rotated-sorted-array-i"] = CANONICAL_DSA_PROBLEMS["search-in-rotated-sorted-array"];
CANONICAL_DSA_PROBLEMS["kadane-s-algorithm-maximum-subarray-sum-in-an-array"] = CANONICAL_DSA_PROBLEMS["maximum-subarray-sum-kadane-s-algorithm"];
CANONICAL_DSA_PROBLEMS["reverse-a-number"] = CANONICAL_DSA_PROBLEMS["reverse-a-number-with-overflow"];
CANONICAL_DSA_PROBLEMS["find-peak-element-in-array"] = CANONICAL_DSA_PROBLEMS["find-peak-element"];

/**
 * Helper to retrieve a canonical problem by ID.
 */
export function getCanonicalProblem(id: string): CanonicalProblem | undefined {
  return CANONICAL_DSA_PROBLEMS[id];
}

/**
 * Returns all canonical problem IDs.
 */
export function getAllCanonicalProblemIds(): string[] {
  return Object.keys(CANONICAL_DSA_PROBLEMS);
}

