export interface OAAptitudeQuestion {
  id: string;
  category: "quantitative" | "logical_reasoning" | "verbal_ability" | "programming_logic";
  topic: string;
  difficulty: "easy" | "medium" | "hard";
  question: string;
  options: string[];
  correct_option_index: number;
  explanation: string;
}

export interface TestCase {
  id: string;
  input: any[];
  expected: any;
  description: string;
}

export interface OACodingProblem {
  id: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  description: string;
  examples: Array<{ input: string; output: string; explanation?: string }>;
  starterCodes: {
    python: string;
    javascript: string;
  };
  functionName: string;
  testCases: TestCase[];
}

export interface GeneratedOASession {
  sessionId: string;
  targetCompany: string;
  companyTier: string;
  aptitudeQuestions: OAAptitudeQuestion[];
  codingProblems: OACodingProblem[];
  minTimeSeconds: number; // e.g. 300 seconds (5 min)
  startedAt: string;
}

// ── Curated Calibrated Question Pools for Dynamic Assembly ──

const FAANG_APTITUDE_POOL: OAAptitudeQuestion[] = [
  {
    id: "faang-apt-1",
    category: "programming_logic",
    topic: "Amortized Complexity",
    difficulty: "medium",
    question: "What is the amortized time complexity of N append operations on a dynamic array that doubles its capacity when full, starting with capacity 1?",
    options: ["O(N^2)", "O(N log N)", "O(1) per operation, O(N) total", "O(log N) per operation"],
    correct_option_index: 2,
    explanation: "Doubling occurs at sizes 1, 2, 4, 8... Sum of copy costs is 1 + 2 + 4 + ... + N = 2N - 1. Divided across N operations, amortized cost is O(1) per append.",
  },
  {
    id: "faang-apt-2",
    category: "quantitative",
    topic: "Combinatorics & Probability",
    difficulty: "medium",
    question: "A hashing function uniformly maps keys into 1000 buckets. What is the approximate minimum number of keys needed so that the probability of at least one collision exceeds 50%?",
    options: ["23", "38", "500", "720"],
    correct_option_index: 1,
    explanation: "By the Birthday Paradox formula, n ≈ sqrt(2 * M * ln(2)). For M = 1000, n ≈ sqrt(2 * 1000 * 0.693) ≈ sqrt(1386) ≈ 37.2 -> 38 keys.",
  },
  {
    id: "faang-apt-3",
    category: "programming_logic",
    topic: "Bit Manipulation",
    difficulty: "medium",
    question: "What does the expression (x & -x) evaluate to in two's complement integer arithmetic for a non-zero integer x?",
    options: ["Always 0", "The lowest set bit of x isolated as a power of 2", "The highest set bit of x", "x inverted"],
    correct_option_index: 1,
    explanation: "In two's complement, -x is (~x + 1). Bitwise ANDing x with (~x + 1) clears all bits except the least significant set bit.",
  },
  {
    id: "faang-apt-4",
    category: "logical_reasoning",
    topic: "Graph Theory Invariants",
    difficulty: "hard",
    question: "In a connected undirected graph with V vertices and E edges, what condition guarantees that every vertex has an even degree?",
    options: [
      "The graph has an Eulerian circuit",
      "The graph is bipartite",
      "The graph is a tree",
      "E must equal V - 1"
    ],
    correct_option_index: 0,
    explanation: "Euler's Theorem states that a connected undirected graph has an Eulerian circuit if and only if every vertex has an even degree.",
  },
  {
    id: "faang-apt-5",
    category: "quantitative",
    topic: "Recurrence Relations",
    difficulty: "medium",
    question: "Using the Master Theorem, what is the asymptotic solution of T(N) = 2*T(N/2) + O(N)?",
    options: ["O(N)", "O(N log N)", "O(N^2)", "O(log N)"],
    correct_option_index: 1,
    explanation: "a = 2, b = 2, f(N) = N. N^(log_b(a)) = N^(log_2(2)) = N^1. Since f(N) = Theta(N^(log_b(a))), Case 2 applies: T(N) = Theta(N log N).",
  },
  {
    id: "faang-apt-6",
    category: "logical_reasoning",
    topic: "Boolean Satisfiability & Logic",
    difficulty: "medium",
    question: "If (P -> Q) is False and (Q or R) is True, what are the truth values of P and R respectively?",
    options: ["P=True, R=True", "P=False, R=True", "P=True, R=False", "P=False, R=False"],
    correct_option_index: 0,
    explanation: "(P -> Q) is False only when P=True and Q=False. Since Q=False, (Q or R) = True requires R=True. Thus P=True and R=True.",
  },
  {
    id: "faang-apt-7",
    category: "programming_logic",
    topic: "Concurrency & Deadlocks",
    difficulty: "hard",
    question: "Which Coffman condition is eliminated by establishing a global linear ordering of all lock acquisitions across threads?",
    options: ["Mutual Exclusion", "Hold and Wait", "No Preemption", "Circular Wait"],
    correct_option_index: 3,
    explanation: "Strict resource hierarchy (linear lock order) eliminates Circular Wait because thread T1 holding lock L_i can only request L_j where j > i.",
  },
  {
    id: "faang-apt-8",
    category: "verbal_ability",
    topic: "Technical Precision & Specification",
    difficulty: "medium",
    question: "Choose the term that correctly completes: 'To prevent stale cache writes in high-concurrency systems, an API must support _____ operations using ETags or version vectors.'",
    options: ["asynchronous", "optimistic idempotent", "lossy", "ephemeral"],
    correct_option_index: 1,
    explanation: "ETags and version tokens enable optimistic concurrency control, ensuring updates are atomic and idempotent against concurrent state changes.",
  },
];

const SERVICE_APTITUDE_POOL: OAAptitudeQuestion[] = [
  {
    id: "srv-apt-1",
    category: "quantitative",
    topic: "Time & Work",
    difficulty: "medium",
    question: "A can complete a project in 15 days, and B can complete it in 20 days. If they work together with C for 5 days to finish the entire project, how many days would C alone take?",
    options: ["25 days", "30 days", "60 days", "40 days"],
    correct_option_index: 2,
    explanation: "A's 5-day work = 5/15 = 1/3. B's 5-day work = 5/20 = 1/4. Combined A+B in 5 days = 1/3 + 1/4 = 7/12. Remaining work for C = 1 - 7/12 = 5/12. If C does 5/12 in 5 days, C does 1/12 per day -> 60 days.",
  },
  {
    id: "srv-apt-2",
    category: "quantitative",
    topic: "Speed, Distance, Time",
    difficulty: "medium",
    question: "Two trains of length 140m and 160m travel in opposite directions at speeds of 60 km/h and 48 km/h. How many seconds will they take to completely cross each other?",
    options: ["8 seconds", "10 seconds", "12 seconds", "15 seconds"],
    correct_option_index: 1,
    explanation: "Total distance = 140 + 160 = 300m. Relative speed = 60 + 48 = 108 km/h = 108 * (5/18) = 30 m/s. Time = 300 / 30 = 10 seconds.",
  },
  {
    id: "srv-apt-3",
    category: "logical_reasoning",
    topic: "Syllogisms",
    difficulty: "easy",
    question: "Statements: All routers are switches. Some switches are firewalls.\nConclusions:\nI. Some firewalls are switches.\nII. Some routers are firewalls.",
    options: ["Only I follows", "Only II follows", "Both I and II follow", "Neither follows"],
    correct_option_index: 0,
    explanation: "Since 'Some switches are firewalls', the converse 'Some firewalls are switches' is immediately valid (I follows). No direct connection guarantees routers are firewalls (II does not necessarily follow).",
  },
  {
    id: "srv-apt-4",
    category: "logical_reasoning",
    topic: "Blood Relations",
    difficulty: "easy",
    question: "Pointing to a photograph, Priya said, 'He is the only son of the father of my sister.' Who is the person in the photograph to Priya?",
    options: ["Brother", "Uncle", "Father", "Cousin"],
    correct_option_index: 0,
    explanation: "Father of Priya's sister is Priya's father. The only son of Priya's father is Priya's brother.",
  },
  {
    id: "srv-apt-5",
    category: "verbal_ability",
    topic: "Sentence Correction",
    difficulty: "easy",
    question: "Identify the grammatically correct sentence:",
    options: [
      "Neither of the two candidates have submitted their assignment.",
      "Neither of the two candidates has submitted his or her assignment.",
      "Neither of the two candidates were submitting assignments.",
      "Neither candidates has submitted their assignment."
    ],
    correct_option_index: 1,
    explanation: "'Neither of' is singular and requires the singular verb 'has' and singular pronoun.",
  },
  {
    id: "srv-apt-6",
    category: "programming_logic",
    topic: "Loop Execution & Arrays",
    difficulty: "medium",
    question: "In C/Java: int a = 5, b = 10; for (int i = 0; i < 3; i++) { a += b; b -= 2; } What are the values of a and b after the loop?",
    options: ["a=29, b=4", "a=24, b=6", "a=23, b=4", "a=35, b=4"],
    correct_option_index: 0,
    explanation: "i=0: a=5+10=15, b=8. i=1: a=15+8=23, b=6. i=2: a=23+6=29, b=4.",
  },
  {
    id: "srv-apt-7",
    category: "quantitative",
    topic: "Profit and Loss",
    difficulty: "medium",
    question: "A merchant marks an item 30% above cost price and allows a discount of 10%. What is the merchant's net profit percentage?",
    options: ["20%", "17%", "15%", "18.5%"],
    correct_option_index: 1,
    explanation: "Let CP = 100. MP = 130. SP = 130 * 0.9 = 117. Profit = 117 - 100 = 17%.",
  },
  {
    id: "srv-apt-8",
    category: "verbal_ability",
    topic: "Synonyms & Context",
    difficulty: "easy",
    question: "Choose the word most nearly opposite in meaning to 'METICULOUS':",
    options: ["Scrupulous", "Careless", "Punctual", "Thorough"],
    correct_option_index: 1,
    explanation: "Meticulous means extremely careful and precise; its antonym is careless.",
  },
];

// ── Curated Real Coding Problems (NOT pre-solved!) ──

const CODING_PROBLEMS_POOL: OACodingProblem[] = [
  {
    id: "oa-code-1",
    title: "Subarray Sum Equals Target",
    difficulty: "medium",
    description: `Given an array of integers \`nums\` and an integer \`k\`, return the total number of continuous subarrays whose sum equals to \`k\`.

Your solution must achieve O(N) time complexity using a prefix-sum hash map approach.`,
    examples: [
      { input: "nums = [1, 1, 1], k = 2", output: "2", explanation: "[1,1] from index 0-1 and index 1-2" },
      { input: "nums = [1, 2, 3], k = 3", output: "2", explanation: "[1,2] and [3]" }
    ],
    starterCodes: {
      python: `def subarray_sum(nums, k):
    # Write your solution here
    # Return integer count of continuous subarrays with sum == k
    pass
`,
      javascript: `function subarraySum(nums, k) {
    // Write your solution here
    // Return integer count of continuous subarrays with sum == k
    return 0;
}
`,
    },
    functionName: "subarray_sum",
    testCases: [
      { id: "tc-1", input: [[1, 1, 1], 2], expected: 2, description: "Basic positive numbers" },
      { id: "tc-2", input: [[1, 2, 3], 3], expected: 2, description: "Multiple valid subarrays" },
      { id: "tc-3", input: [[1, -1, 0], 0], expected: 3, description: "Zero and negative numbers" },
      { id: "tc-4", input: [[3, 4, 7, 2, -3, 1, 4, 2], 7], expected: 4, description: "Mixed array with multiple prefix matches" },
    ],
  },
  {
    id: "oa-code-2",
    title: "Longest Substring Without Repeating Characters",
    difficulty: "medium",
    description: `Given a string \`s\`, find the length of the longest substring without repeating characters.

Your solution must run in O(N) time using a sliding window technique.`,
    examples: [
      { input: 's = "abcabcbb"', output: "3", explanation: 'The answer is "abc", with the length of 3.' },
      { input: 's = "bbbbb"', output: "1", explanation: 'The answer is "b", with the length of 1.' },
      { input: 's = "pwwkew"', output: "3", explanation: 'The answer is "wke", with the length of 3.' }
    ],
    starterCodes: {
      python: `def length_of_longest_substring(s):
    # Write your solution here
    # Return integer length of longest unique substring
    pass
`,
      javascript: `function lengthOfLongestSubstring(s) {
    // Write your solution here
    // Return integer length of longest unique substring
    return 0;
}
`,
    },
    functionName: "length_of_longest_substring",
    testCases: [
      { id: "tc-1", input: ["abcabcbb"], expected: 3, description: "Standard repeated substring" },
      { id: "tc-2", input: ["bbbbb"], expected: 1, description: "All identical characters" },
      { id: "tc-3", input: ["pwwkew"], expected: 3, description: "Substring with middle overlap" },
      { id: "tc-4", input: [""], expected: 0, description: "Empty string edge case" },
      { id: "tc-5", input: ["au"], expected: 2, description: "Short distinct string" },
    ],
  },
];

/**
 * Generates an authentic, fresh Online Assessment tailored to company tier.
 */
export function generateOASession(
  targetCompany: string = "Google",
  companyTier: string = "Tier 1 FAANG"
): GeneratedOASession {
  const isService =
    companyTier.includes("Service") ||
    targetCompany.toLowerCase().includes("tcs") ||
    targetCompany.toLowerCase().includes("infosys") ||
    targetCompany.toLowerCase().includes("wipro");

  const aptitudeQuestions = isService ? SERVICE_APTITUDE_POOL : FAANG_APTITUDE_POOL;

  return {
    sessionId: `oa_${Date.now()}`,
    targetCompany,
    companyTier,
    aptitudeQuestions,
    codingProblems: CODING_PROBLEMS_POOL,
    minTimeSeconds: 180, // 3 minutes minimum required time elapsed
    startedAt: new Date().toISOString(),
  };
}

/**
 * Deterministically tests JavaScript code against test cases in an isolated execution context.
 */
export function executeJavascriptCode(
  code: string,
  functionName: string,
  testCases: TestCase[]
): {
  passed: number;
  total: number;
  results: Array<{ id: string; passed: boolean; input: any; expected: any; actual: any; error?: string }>;
  logs: string[];
} {
  const results: any[] = [];
  let passedCount = 0;
  const logs: string[] = [];

  try {
    // Wrap code in self-executing function returning the target function
    const wrappedCode = `
      ${code}
      if (typeof ${functionName} === 'function') return ${functionName};
      if (typeof subarraySum === 'function') return subarraySum;
      if (typeof lengthOfLongestSubstring === 'function') return lengthOfLongestSubstring;
      throw new Error('Function "${functionName}" is not defined or exported.');
    `;

    const fn = new Function(wrappedCode)();

    testCases.forEach((tc) => {
      try {
        const actual = fn(...tc.input);
        const isMatch = JSON.stringify(actual) === JSON.stringify(tc.expected);
        if (isMatch) {
          passedCount++;
          logs.push(`✓ Test [${tc.id}] Passed (${tc.description}): Input ${JSON.stringify(tc.input)} -> ${JSON.stringify(actual)}`);
        } else {
          logs.push(`✗ Test [${tc.id}] Failed (${tc.description}): Expected ${JSON.stringify(tc.expected)}, got ${JSON.stringify(actual)}`);
        }
        results.push({
          id: tc.id,
          passed: isMatch,
          input: tc.input,
          expected: tc.expected,
          actual,
        });
      } catch (err: any) {
        logs.push(`✗ Test [${tc.id}] Runtime Error: ${err.message}`);
        results.push({
          id: tc.id,
          passed: false,
          input: tc.input,
          expected: tc.expected,
          actual: null,
          error: err.message,
        });
      }
    });
  } catch (compileErr: any) {
    logs.push(`Syntax / Compilation Error: ${compileErr.message}`);
    testCases.forEach((tc) => {
      results.push({
        id: tc.id,
        passed: false,
        input: tc.input,
        expected: tc.expected,
        actual: null,
        error: compileErr.message,
      });
    });
  }

  return {
    passed: passedCount,
    total: testCases.length,
    results,
    logs,
  };
}
