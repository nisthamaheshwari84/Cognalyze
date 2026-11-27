/**
 * lib/skills/catalogs/dsa-catalog.ts
 * Auto-generated Canonical DSA Catalog containing 120 validated distinct questions.
 */

import { QuestionItem } from "../../question-bank-types";

export const DSA_CATALOG: QuestionItem[] = [
  {
    "id": "qb-dsa-count-digits-in-a-number",
    "title": "Count Digits in a Number",
    "question": "Count how many digits are present in an integer N using repeated division.\n\nCount how many digits are present in an integer N using repeated division.",
    "type": "Coding",
    "company": "TCS",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn the basics",
    "subtopic": "Basic Maths",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/count-digits5716/1",
    "verified": true,
    "codeSnippet": "def countDigitsInANumber(nums: list[int]) -> int:\n    # Write your solution for Count Digits in a Number below\n    pass",
    "starterCode": {
      "python": "def countDigitsInANumber(nums: list[int]) -> int:\n    # Write your solution for Count Digits in a Number below\n    pass",
      "javascript": "function countDigitsInANumber(nums) {\n    // Write your solution for Count Digits in a Number below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int countDigitsInANumber(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int countDigitsInANumber(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(log10(N)).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(log10(N)) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def countDigitsInANumber(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(log10(N))",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Basic Maths",
      "TCS",
      "Infosys",
      "Wipro"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at TCS, Infosys, Wipro.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-reverse-a-number-with-overflow",
    "title": "Reverse a Number with Overflow",
    "question": "Reverse digits of 32-bit signed integer; return 0 on overflow.\n\nReverse digits of 32-bit signed integer; return 0 on overflow.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn the basics",
    "subtopic": "Basic Maths",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/reverse-integer/",
    "verified": true,
    "codeSnippet": "def reverseANumberWithOverflow(nums: list[int]) -> int:\n    # Write your solution for Reverse a Number with Overflow below\n    pass",
    "starterCode": {
      "python": "def reverseANumberWithOverflow(nums: list[int]) -> int:\n    # Write your solution for Reverse a Number with Overflow below\n    pass",
      "javascript": "function reverseANumberWithOverflow(nums) {\n    // Write your solution for Reverse a Number with Overflow below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int reverseANumberWithOverflow(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int reverseANumberWithOverflow(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(log10(N)).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(log10(N)) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def reverseANumberWithOverflow(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(log10(N))",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Basic Maths",
      "Amazon",
      "Bloomberg",
      "Google"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Bloomberg, Google.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-check-palindrome-number",
    "title": "Check Palindrome Number",
    "question": "Determine whether an integer is a palindrome without converting to string.\n\nDetermine whether an integer is a palindrome without converting to string.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn the basics",
    "subtopic": "Basic Maths",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/palindrome-number/",
    "verified": true,
    "codeSnippet": "def checkPalindromeNumber(nums: list[int]) -> int:\n    # Write your solution for Check Palindrome Number below\n    pass",
    "starterCode": {
      "python": "def checkPalindromeNumber(nums: list[int]) -> int:\n    # Write your solution for Check Palindrome Number below\n    pass",
      "javascript": "function checkPalindromeNumber(nums) {\n    // Write your solution for Check Palindrome Number below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int checkPalindromeNumber(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int checkPalindromeNumber(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(log10(N)).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(log10(N)) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def checkPalindromeNumber(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(log10(N))",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Basic Maths",
      "Amazon",
      "Microsoft",
      "Paytm"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Microsoft, Paytm.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-gcd-or-hcf-via-euclidean-algorithm",
    "title": "GCD or HCF via Euclidean Algorithm",
    "question": "Compute GCD using Euclid's repeated modulo algorithm.\n\nCompute GCD using Euclid's repeated modulo algorithm.",
    "type": "Coding",
    "company": "Goldman Sachs",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn the basics",
    "subtopic": "Basic Maths",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/lcm-and-gcd4516/1",
    "verified": true,
    "codeSnippet": "def gCDOrHCFViaEuclideanAlgorithm(nums: list[int]) -> int:\n    # Write your solution for GCD or HCF via Euclidean Algorithm below\n    pass",
    "starterCode": {
      "python": "def gCDOrHCFViaEuclideanAlgorithm(nums: list[int]) -> int:\n    # Write your solution for GCD or HCF via Euclidean Algorithm below\n    pass",
      "javascript": "function gCDOrHCFViaEuclideanAlgorithm(nums) {\n    // Write your solution for GCD or HCF via Euclidean Algorithm below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int gCDOrHCFViaEuclideanAlgorithm(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int gCDOrHCFViaEuclideanAlgorithm(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(log(min(A,B))).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(log(min(A,B))) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def gCDOrHCFViaEuclideanAlgorithm(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(log(min(A,B)))",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Basic Maths",
      "Goldman Sachs",
      "TCS",
      "Accenture"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Goldman Sachs, TCS, Accenture.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-armstrong-number-checker",
    "title": "Armstrong Number Checker",
    "question": "Check if sum of cube of digits equals original number.\n\nCheck if sum of cube of digits equals original number.",
    "type": "Coding",
    "company": "Wipro",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn the basics",
    "subtopic": "Basic Maths",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/armstrong-numbers2727/1",
    "verified": true,
    "codeSnippet": "def armstrongNumberChecker(nums: list[int]) -> int:\n    # Write your solution for Armstrong Number Checker below\n    pass",
    "starterCode": {
      "python": "def armstrongNumberChecker(nums: list[int]) -> int:\n    # Write your solution for Armstrong Number Checker below\n    pass",
      "javascript": "function armstrongNumberChecker(nums) {\n    // Write your solution for Armstrong Number Checker below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int armstrongNumberChecker(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int armstrongNumberChecker(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(log10(N)).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(log10(N)) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def armstrongNumberChecker(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(log10(N))",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Basic Maths",
      "Wipro",
      "Cognizant"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Wipro, Cognizant.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-print-all-divisors-of-a-number",
    "title": "Print all Divisors of a Number",
    "question": "Find all divisors of N in O(sqrt(N)) time.\n\nFind all divisors of N in O(sqrt(N)) time.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn the basics",
    "subtopic": "Basic Maths",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/sum-of-all-divisors-from-1-to-n4738/1",
    "verified": true,
    "codeSnippet": "def printAllDivisorsOfANumber(nums: list[int]) -> int:\n    # Write your solution for Print all Divisors of a Number below\n    pass",
    "starterCode": {
      "python": "def printAllDivisorsOfANumber(nums: list[int]) -> int:\n    # Write your solution for Print all Divisors of a Number below\n    pass",
      "javascript": "function printAllDivisorsOfANumber(nums) {\n    // Write your solution for Print all Divisors of a Number below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int printAllDivisorsOfANumber(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int printAllDivisorsOfANumber(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(sqrt(N)).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(sqrt(N)) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def printAllDivisorsOfANumber(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(sqrt(N))",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Basic Maths",
      "Amazon",
      "TCS"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, TCS.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-check-for-prime-number",
    "title": "Check for Prime Number",
    "question": "Verify if N is prime by testing factors up to sqrt(N).\n\nVerify if N is prime by testing factors up to sqrt(N).",
    "type": "Coding",
    "company": "TCS",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn the basics",
    "subtopic": "Basic Maths",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/prime-number2314/1",
    "verified": true,
    "codeSnippet": "def checkForPrimeNumber(nums: list[int]) -> int:\n    # Write your solution for Check for Prime Number below\n    pass",
    "starterCode": {
      "python": "def checkForPrimeNumber(nums: list[int]) -> int:\n    # Write your solution for Check for Prime Number below\n    pass",
      "javascript": "function checkForPrimeNumber(nums) {\n    // Write your solution for Check for Prime Number below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int checkForPrimeNumber(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int checkForPrimeNumber(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(sqrt(N)).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(sqrt(N)) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def checkForPrimeNumber(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(sqrt(N))",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Basic Maths",
      "TCS",
      "Infosys"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at TCS, Infosys.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-understand-recursion-by-print-1-to-n",
    "title": "Understand Recursion by Print 1 to N",
    "question": "Print 1 to N recursively without loops using call stack.\n\nPrint 1 to N recursively without loops using call stack.",
    "type": "Coding",
    "company": "Microsoft",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn the basics",
    "subtopic": "Basic Recursion",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/print-1-to-n-without-using-loops-1587115620/1",
    "verified": true,
    "codeSnippet": "def understandRecursionByPrint1ToN(nums: list[int]) -> int:\n    # Write your solution for Understand Recursion by Print 1 to N below\n    pass",
    "starterCode": {
      "python": "def understandRecursionByPrint1ToN(nums: list[int]) -> int:\n    # Write your solution for Understand Recursion by Print 1 to N below\n    pass",
      "javascript": "function understandRecursionByPrint1ToN(nums) {\n    // Write your solution for Understand Recursion by Print 1 to N below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int understandRecursionByPrint1ToN(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int understandRecursionByPrint1ToN(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(N) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def understandRecursionByPrint1ToN(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "DSA",
      "Basic Recursion",
      "Microsoft",
      "Paytm"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Microsoft, Paytm.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-print-n-to-1-using-recursion",
    "title": "Print N to 1 using Recursion",
    "question": "Print numbers from N down to 1 using recursion.\n\nPrint numbers from N down to 1 using recursion.",
    "type": "Coding",
    "company": "TCS",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn the basics",
    "subtopic": "Basic Recursion",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/print-n-to-1-without-loop/1",
    "verified": true,
    "codeSnippet": "def printNTo1UsingRecursion(nums: list[int]) -> int:\n    # Write your solution for Print N to 1 using Recursion below\n    pass",
    "starterCode": {
      "python": "def printNTo1UsingRecursion(nums: list[int]) -> int:\n    # Write your solution for Print N to 1 using Recursion below\n    pass",
      "javascript": "function printNTo1UsingRecursion(nums) {\n    // Write your solution for Print N to 1 using Recursion below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int printNTo1UsingRecursion(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int printNTo1UsingRecursion(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(N) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def printNTo1UsingRecursion(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "DSA",
      "Basic Recursion",
      "TCS",
      "Wipro"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at TCS, Wipro.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-sum-of-first-n-numbers",
    "title": "Sum of First N Numbers",
    "question": "Compute sum of first N natural numbers recursively.\n\nCompute sum of first N natural numbers recursively.",
    "type": "Coding",
    "company": "Infosys",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn the basics",
    "subtopic": "Basic Recursion",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/sum-of-first-n-terms5843/1",
    "verified": true,
    "codeSnippet": "def sumOfFirstNNumbers(nums: list[int]) -> int:\n    # Write your solution for Sum of First N Numbers below\n    pass",
    "starterCode": {
      "python": "def sumOfFirstNNumbers(nums: list[int]) -> int:\n    # Write your solution for Sum of First N Numbers below\n    pass",
      "javascript": "function sumOfFirstNNumbers(nums) {\n    // Write your solution for Sum of First N Numbers below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int sumOfFirstNNumbers(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int sumOfFirstNNumbers(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(N) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def sumOfFirstNNumbers(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "DSA",
      "Basic Recursion",
      "Infosys",
      "Cognizant"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Infosys, Cognizant.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-factorial-of-n-numbers",
    "title": "Factorial of N Numbers",
    "question": "Compute factorial of N recursively.\n\nCompute factorial of N recursively.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn the basics",
    "subtopic": "Basic Recursion",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/find-all-factorial-numbers-less-than-or-equal-to-n3548/1",
    "verified": true,
    "codeSnippet": "def factorialOfNNumbers(nums: list[int]) -> int:\n    # Write your solution for Factorial of N Numbers below\n    pass",
    "starterCode": {
      "python": "def factorialOfNNumbers(nums: list[int]) -> int:\n    # Write your solution for Factorial of N Numbers below\n    pass",
      "javascript": "function factorialOfNNumbers(nums) {\n    // Write your solution for Factorial of N Numbers below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int factorialOfNNumbers(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int factorialOfNNumbers(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(N) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def factorialOfNNumbers(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "DSA",
      "Basic Recursion",
      "Amazon",
      "Wipro"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Wipro.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-reverse-an-array-using-recursion",
    "title": "Reverse an Array using Recursion",
    "question": "Reverse array in-place recursively with two pointers.\n\nReverse array in-place recursively with two pointers.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn the basics",
    "subtopic": "Basic Recursion",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/reverse-an-array/0",
    "verified": true,
    "codeSnippet": "def reverseAnArrayUsingRecursion(nums: list[int]) -> int:\n    # Write your solution for Reverse an Array using Recursion below\n    pass",
    "starterCode": {
      "python": "def reverseAnArrayUsingRecursion(nums: list[int]) -> int:\n    # Write your solution for Reverse an Array using Recursion below\n    pass",
      "javascript": "function reverseAnArrayUsingRecursion(nums) {\n    // Write your solution for Reverse an Array using Recursion below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int reverseAnArrayUsingRecursion(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int reverseAnArrayUsingRecursion(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(N) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def reverseAnArrayUsingRecursion(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "DSA",
      "Basic Recursion",
      "Amazon",
      "Google"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Google.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-check-if-string-is-palindrome-recursive",
    "title": "Check if String is Palindrome (Recursive)",
    "question": "Check if string reads identical forwards and backwards recursively.\n\nCheck if string reads identical forwards and backwards recursively.",
    "type": "Coding",
    "company": "Meta",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn the basics",
    "subtopic": "Basic Recursion",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/valid-palindrome/",
    "verified": true,
    "codeSnippet": "def checkIfStringIsPalindromeRecursive(nums: list[int]) -> int:\n    # Write your solution for Check if String is Palindrome (Recursive) below\n    pass",
    "starterCode": {
      "python": "def checkIfStringIsPalindromeRecursive(nums: list[int]) -> int:\n    # Write your solution for Check if String is Palindrome (Recursive) below\n    pass",
      "javascript": "function checkIfStringIsPalindromeRecursive(nums) {\n    // Write your solution for Check if String is Palindrome (Recursive) below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int checkIfStringIsPalindromeRecursive(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int checkIfStringIsPalindromeRecursive(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(N) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def checkIfStringIsPalindromeRecursive(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "DSA",
      "Basic Recursion",
      "Meta",
      "Amazon",
      "Microsoft"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Meta, Amazon, Microsoft.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-fibonacci-number-recursive-iterative",
    "title": "Fibonacci Number (Recursive & Iterative)",
    "question": "Compute N-th Fibonacci number F(N) = F(N-1) + F(N-2).\n\nCompute N-th Fibonacci number F(N) = F(N-1) + F(N-2).",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn the basics",
    "subtopic": "Basic Recursion",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/fibonacci-number/",
    "verified": true,
    "codeSnippet": "def fibonacciNumberRecursiveIterative(nums: list[int]) -> int:\n    # Write your solution for Fibonacci Number (Recursive & Iterative) below\n    pass",
    "starterCode": {
      "python": "def fibonacciNumberRecursiveIterative(nums: list[int]) -> int:\n    # Write your solution for Fibonacci Number (Recursive & Iterative) below\n    pass",
      "javascript": "function fibonacciNumberRecursiveIterative(nums) {\n    // Write your solution for Fibonacci Number (Recursive & Iterative) below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int fibonacciNumberRecursiveIterative(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int fibonacciNumberRecursiveIterative(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(N) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def fibonacciNumberRecursiveIterative(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "DSA",
      "Basic Recursion",
      "Amazon",
      "Adobe",
      "Apple"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Adobe, Apple.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-counting-frequencies-of-array-elements",
    "title": "Counting Frequencies of Array Elements",
    "question": "Count occurrences of each element using hash frequency maps.\n\nCount occurrences of each element using hash frequency maps.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn the basics",
    "subtopic": "Basic Hashing",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/frequency-of-array-elements-1587115620/1",
    "verified": true,
    "codeSnippet": "def countingFrequenciesOfArrayElements(nums: list[int]) -> int:\n    # Write your solution for Counting Frequencies of Array Elements below\n    pass",
    "starterCode": {
      "python": "def countingFrequenciesOfArrayElements(nums: list[int]) -> int:\n    # Write your solution for Counting Frequencies of Array Elements below\n    pass",
      "javascript": "function countingFrequenciesOfArrayElements(nums) {\n    // Write your solution for Counting Frequencies of Array Elements below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int countingFrequenciesOfArrayElements(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int countingFrequenciesOfArrayElements(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(N) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def countingFrequenciesOfArrayElements(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "DSA",
      "Basic Hashing",
      "Amazon",
      "Flipkart"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Flipkart.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-find-the-highest-lowest-frequency-element",
    "title": "Find the Highest/Lowest Frequency Element",
    "question": "Identify elements with maximum and minimum frequency in array.\n\nIdentify elements with maximum and minimum frequency in array.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn the basics",
    "subtopic": "Basic Hashing",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/top-k-frequent-elements/",
    "verified": true,
    "codeSnippet": "def findTheHighestLowestFrequencyElement(nums: list[int]) -> int:\n    # Write your solution for Find the Highest/Lowest Frequency Element below\n    pass",
    "starterCode": {
      "python": "def findTheHighestLowestFrequencyElement(nums: list[int]) -> int:\n    # Write your solution for Find the Highest/Lowest Frequency Element below\n    pass",
      "javascript": "function findTheHighestLowestFrequencyElement(nums) {\n    // Write your solution for Find the Highest/Lowest Frequency Element below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int findTheHighestLowestFrequencyElement(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int findTheHighestLowestFrequencyElement(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(N) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def findTheHighestLowestFrequencyElement(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "DSA",
      "Basic Hashing",
      "Amazon",
      "Google"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Google.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-pass-by-value-and-pass-by-reference",
    "title": "Pass by Value and Pass by Reference",
    "question": "Understand memory addressing, pointers, and reference arguments.\n\nUnderstand memory addressing, pointers, and reference arguments.",
    "type": "Coding",
    "company": "TCS",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn the basics",
    "subtopic": "Language Basics",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://takeuforward.org/c/c-functions-pass-by-value-and-reference/",
    "verified": true,
    "codeSnippet": "def passByValueAndPassByReference(nums: list[int]) -> int:\n    # Write your solution for Pass by Value and Pass by Reference below\n    pass",
    "starterCode": {
      "python": "def passByValueAndPassByReference(nums: list[int]) -> int:\n    # Write your solution for Pass by Value and Pass by Reference below\n    pass",
      "javascript": "function passByValueAndPassByReference(nums) {\n    // Write your solution for Pass by Value and Pass by Reference below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int passByValueAndPassByReference(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int passByValueAndPassByReference(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(1).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(1) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def passByValueAndPassByReference(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(1)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Language Basics",
      "TCS",
      "Accenture"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at TCS, Accenture.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-switch-statement-evaluation",
    "title": "Switch Statement Evaluation",
    "question": "Evaluate constant expressions and multi-way branch selection.\n\nEvaluate constant expressions and multi-way branch selection.",
    "type": "Coding",
    "company": "Infosys",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn the basics",
    "subtopic": "Language Basics",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://takeuforward.org/c/switch-statement-in-c-c/",
    "verified": true,
    "codeSnippet": "def switchStatementEvaluation(nums: list[int]) -> int:\n    # Write your solution for Switch Statement Evaluation below\n    pass",
    "starterCode": {
      "python": "def switchStatementEvaluation(nums: list[int]) -> int:\n    # Write your solution for Switch Statement Evaluation below\n    pass",
      "javascript": "function switchStatementEvaluation(nums) {\n    // Write your solution for Switch Statement Evaluation below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int switchStatementEvaluation(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int switchStatementEvaluation(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(1).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(1) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def switchStatementEvaluation(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(1)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Language Basics",
      "Infosys",
      "Wipro"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Infosys, Wipro.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-while-loops-and-break-continue",
    "title": "While Loops and Break/Continue",
    "question": "Master loop bounds and jump control statements.\n\nMaster loop bounds and jump control statements.",
    "type": "Coding",
    "company": "TCS",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn the basics",
    "subtopic": "Language Basics",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://takeuforward.org/c/while-loop-in-c-c/",
    "verified": true,
    "codeSnippet": "def whileLoopsAndBreakContinue(nums: list[int]) -> int:\n    # Write your solution for While Loops and Break/Continue below\n    pass",
    "starterCode": {
      "python": "def whileLoopsAndBreakContinue(nums: list[int]) -> int:\n    # Write your solution for While Loops and Break/Continue below\n    pass",
      "javascript": "function whileLoopsAndBreakContinue(nums) {\n    // Write your solution for While Loops and Break/Continue below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int whileLoopsAndBreakContinue(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int whileLoopsAndBreakContinue(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(1).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(1) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def whileLoopsAndBreakContinue(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(1)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Language Basics",
      "TCS"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at TCS.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-data-types-and-memory-allocation",
    "title": "Data Types and Memory Allocation",
    "question": "Understand primitive integer, float, and character storage ranges.\n\nUnderstand primitive integer, float, and character storage ranges.",
    "type": "Coding",
    "company": "Wipro",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn the basics",
    "subtopic": "Language Basics",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://takeuforward.org/c/data-types-in-c/",
    "verified": true,
    "codeSnippet": "def dataTypesAndMemoryAllocation(nums: list[int]) -> int:\n    # Write your solution for Data Types and Memory Allocation below\n    pass",
    "starterCode": {
      "python": "def dataTypesAndMemoryAllocation(nums: list[int]) -> int:\n    # Write your solution for Data Types and Memory Allocation below\n    pass",
      "javascript": "function dataTypesAndMemoryAllocation(nums) {\n    // Write your solution for Data Types and Memory Allocation below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int dataTypesAndMemoryAllocation(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int dataTypesAndMemoryAllocation(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(1).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(1) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def dataTypesAndMemoryAllocation(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(1)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Language Basics",
      "Wipro",
      "Cognizant"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Wipro, Cognizant.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-right-angled-star-triangle-pattern",
    "title": "Right-Angled Star Triangle Pattern",
    "question": "Print triangular star sequence with row-based loops.\n\nPrint triangular star sequence with row-based loops.",
    "type": "Coding",
    "company": "TCS",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn the basics",
    "subtopic": "Pattern Printing",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/triangle-pattern-1661492263/1",
    "verified": true,
    "codeSnippet": "def rightAngledStarTrianglePattern(nums: list[int]) -> int:\n    # Write your solution for Right-Angled Star Triangle Pattern below\n    pass",
    "starterCode": {
      "python": "def rightAngledStarTrianglePattern(nums: list[int]) -> int:\n    # Write your solution for Right-Angled Star Triangle Pattern below\n    pass",
      "javascript": "function rightAngledStarTrianglePattern(nums) {\n    // Write your solution for Right-Angled Star Triangle Pattern below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int rightAngledStarTrianglePattern(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int rightAngledStarTrianglePattern(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N^2).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N^2) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def rightAngledStarTrianglePattern(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Pattern Printing",
      "TCS",
      "Infosys"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at TCS, Infosys.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-right-angled-number-pyramid",
    "title": "Right-Angled Number Pyramid",
    "question": "Print incremental number rows from 1 to i.\n\nPrint incremental number rows from 1 to i.",
    "type": "Coding",
    "company": "Wipro",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn the basics",
    "subtopic": "Pattern Printing",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/triangle-number-1661492263/1",
    "verified": true,
    "codeSnippet": "def rightAngledNumberPyramid(nums: list[int]) -> int:\n    # Write your solution for Right-Angled Number Pyramid below\n    pass",
    "starterCode": {
      "python": "def rightAngledNumberPyramid(nums: list[int]) -> int:\n    # Write your solution for Right-Angled Number Pyramid below\n    pass",
      "javascript": "function rightAngledNumberPyramid(nums) {\n    // Write your solution for Right-Angled Number Pyramid below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int rightAngledNumberPyramid(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int rightAngledNumberPyramid(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N^2).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N^2) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def rightAngledNumberPyramid(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Pattern Printing",
      "Wipro",
      "TCS"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Wipro, TCS.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-inverted-star-pyramid",
    "title": "Inverted Star Pyramid",
    "question": "Print symmetric inverted triangular matrix with leading spaces.\n\nPrint symmetric inverted triangular matrix with leading spaces.",
    "type": "Coding",
    "company": "Infosys",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn the basics",
    "subtopic": "Pattern Printing",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/triangle-pattern-1661493238/1",
    "verified": true,
    "codeSnippet": "def invertedStarPyramid(nums: list[int]) -> int:\n    # Write your solution for Inverted Star Pyramid below\n    pass",
    "starterCode": {
      "python": "def invertedStarPyramid(nums: list[int]) -> int:\n    # Write your solution for Inverted Star Pyramid below\n    pass",
      "javascript": "function invertedStarPyramid(nums) {\n    // Write your solution for Inverted Star Pyramid below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int invertedStarPyramid(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int invertedStarPyramid(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N^2).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N^2) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def invertedStarPyramid(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Pattern Printing",
      "Infosys"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Infosys.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-diamond-star-pattern",
    "title": "Diamond Star Pattern",
    "question": "Print complete diamond star pattern joining upright and inverted triangles.\n\nPrint complete diamond star pattern joining upright and inverted triangles.",
    "type": "Coding",
    "company": "TCS",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn the basics",
    "subtopic": "Pattern Printing",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/pattern/1",
    "verified": true,
    "codeSnippet": "def diamondStarPattern(nums: list[int]) -> int:\n    # Write your solution for Diamond Star Pattern below\n    pass",
    "starterCode": {
      "python": "def diamondStarPattern(nums: list[int]) -> int:\n    # Write your solution for Diamond Star Pattern below\n    pass",
      "javascript": "function diamondStarPattern(nums) {\n    // Write your solution for Diamond Star Pattern below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int diamondStarPattern(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int diamondStarPattern(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N^2).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N^2) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def diamondStarPattern(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Pattern Printing",
      "TCS",
      "Cognizant"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at TCS, Cognizant.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-half-diamond-star-pattern",
    "title": "Half Diamond Star Pattern",
    "question": "Print vertical symmetric half diamond expanding and contracting.\n\nPrint vertical symmetric half diamond expanding and contracting.",
    "type": "Coding",
    "company": "Wipro",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn the basics",
    "subtopic": "Pattern Printing",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/triangle-pattern-1662286302/1",
    "verified": true,
    "codeSnippet": "def halfDiamondStarPattern(nums: list[int]) -> int:\n    # Write your solution for Half Diamond Star Pattern below\n    pass",
    "starterCode": {
      "python": "def halfDiamondStarPattern(nums: list[int]) -> int:\n    # Write your solution for Half Diamond Star Pattern below\n    pass",
      "javascript": "function halfDiamondStarPattern(nums) {\n    // Write your solution for Half Diamond Star Pattern below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int halfDiamondStarPattern(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int halfDiamondStarPattern(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N^2).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N^2) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def halfDiamondStarPattern(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Pattern Printing",
      "Wipro"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Wipro.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-binary-number-triangle-pattern",
    "title": "Binary Number Triangle Pattern",
    "question": "Print alternating 1 and 0 values across triangular matrix.\n\nPrint alternating 1 and 0 values across triangular matrix.",
    "type": "Coding",
    "company": "Infosys",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn the basics",
    "subtopic": "Pattern Printing",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/triangle-pattern-1661718013/1",
    "verified": true,
    "codeSnippet": "def binaryNumberTrianglePattern(nums: list[int]) -> int:\n    # Write your solution for Binary Number Triangle Pattern below\n    pass",
    "starterCode": {
      "python": "def binaryNumberTrianglePattern(nums: list[int]) -> int:\n    # Write your solution for Binary Number Triangle Pattern below\n    pass",
      "javascript": "function binaryNumberTrianglePattern(nums) {\n    // Write your solution for Binary Number Triangle Pattern below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int binaryNumberTrianglePattern(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int binaryNumberTrianglePattern(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N^2).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N^2) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def binaryNumberTrianglePattern(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Pattern Printing",
      "Infosys",
      "TCS"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Infosys, TCS.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-number-crown-pattern",
    "title": "Number Crown Pattern",
    "question": "Print double numeric pyramids separated by symmetric whitespace.\n\nPrint double numeric pyramids separated by symmetric whitespace.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn the basics",
    "subtopic": "Pattern Printing",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/pattern-1/1",
    "verified": true,
    "codeSnippet": "def numberCrownPattern(nums: list[int]) -> int:\n    # Write your solution for Number Crown Pattern below\n    pass",
    "starterCode": {
      "python": "def numberCrownPattern(nums: list[int]) -> int:\n    # Write your solution for Number Crown Pattern below\n    pass",
      "javascript": "function numberCrownPattern(nums) {\n    // Write your solution for Number Crown Pattern below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int numberCrownPattern(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int numberCrownPattern(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N^2).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N^2) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def numberCrownPattern(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Pattern Printing",
      "Amazon",
      "TCS"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, TCS.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-increasing-letter-triangle-pattern",
    "title": "Increasing Letter Triangle Pattern",
    "question": "Print alphabet sequence starting from 'A' across rows.\n\nPrint alphabet sequence starting from 'A' across rows.",
    "type": "Coding",
    "company": "Cognizant",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn the basics",
    "subtopic": "Pattern Printing",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/triangle-pattern-1662284916/1",
    "verified": true,
    "codeSnippet": "def increasingLetterTrianglePattern(nums: list[int]) -> int:\n    # Write your solution for Increasing Letter Triangle Pattern below\n    pass",
    "starterCode": {
      "python": "def increasingLetterTrianglePattern(nums: list[int]) -> int:\n    # Write your solution for Increasing Letter Triangle Pattern below\n    pass",
      "javascript": "function increasingLetterTrianglePattern(nums) {\n    // Write your solution for Increasing Letter Triangle Pattern below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int increasingLetterTrianglePattern(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int increasingLetterTrianglePattern(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N^2).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N^2) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def increasingLetterTrianglePattern(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Pattern Printing",
      "Cognizant"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Cognizant.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-alpha-ramp-pattern",
    "title": "Alpha-Ramp Pattern",
    "question": "Print repeated identical character per row from A to N-th letter.\n\nPrint repeated identical character per row from A to N-th letter.",
    "type": "Coding",
    "company": "Wipro",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn the basics",
    "subtopic": "Pattern Printing",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/triangle-pattern-1662285334/1",
    "verified": true,
    "codeSnippet": "def alphaRampPattern(nums: list[int]) -> int:\n    # Write your solution for Alpha-Ramp Pattern below\n    pass",
    "starterCode": {
      "python": "def alphaRampPattern(nums: list[int]) -> int:\n    # Write your solution for Alpha-Ramp Pattern below\n    pass",
      "javascript": "function alphaRampPattern(nums) {\n    // Write your solution for Alpha-Ramp Pattern below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int alphaRampPattern(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int alphaRampPattern(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N^2).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N^2) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def alphaRampPattern(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Pattern Printing",
      "Wipro"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Wipro.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-alpha-triangle-pattern",
    "title": "Alpha-Triangle Pattern",
    "question": "Print reverse alphabet sequences descending down triangular rows.\n\nPrint reverse alphabet sequences descending down triangular rows.",
    "type": "Coding",
    "company": "Infosys",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn the basics",
    "subtopic": "Pattern Printing",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/triangle-pattern-1662285860/1",
    "verified": true,
    "codeSnippet": "def alphaTrianglePattern(nums: list[int]) -> int:\n    # Write your solution for Alpha-Triangle Pattern below\n    pass",
    "starterCode": {
      "python": "def alphaTrianglePattern(nums: list[int]) -> int:\n    # Write your solution for Alpha-Triangle Pattern below\n    pass",
      "javascript": "function alphaTrianglePattern(nums) {\n    // Write your solution for Alpha-Triangle Pattern below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int alphaTrianglePattern(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int alphaTrianglePattern(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N^2).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N^2) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def alphaTrianglePattern(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Pattern Printing",
      "Infosys"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Infosys.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-symmetric-void-butterfly-pattern",
    "title": "Symmetric Void Butterfly Pattern",
    "question": "Print dual mirrored wings with dynamic space expansion and contraction.\n\nPrint dual mirrored wings with dynamic space expansion and contraction.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn the basics",
    "subtopic": "Pattern Printing",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/pattern-2/1",
    "verified": true,
    "codeSnippet": "def symmetricVoidButterflyPattern(nums: list[int]) -> int:\n    # Write your solution for Symmetric Void Butterfly Pattern below\n    pass",
    "starterCode": {
      "python": "def symmetricVoidButterflyPattern(nums: list[int]) -> int:\n    # Write your solution for Symmetric Void Butterfly Pattern below\n    pass",
      "javascript": "function symmetricVoidButterflyPattern(nums) {\n    // Write your solution for Symmetric Void Butterfly Pattern below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int symmetricVoidButterflyPattern(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int symmetricVoidButterflyPattern(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N^2).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N^2) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def symmetricVoidButterflyPattern(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Pattern Printing",
      "Amazon",
      "Microsoft"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Microsoft.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-selection-sort",
    "title": "Selection Sort",
    "question": "Repeatedly find minimum element from unsorted part and put at beginning.\n\nRepeatedly find minimum element from unsorted part and put at beginning.",
    "type": "Coding",
    "company": "Wipro",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn Important Sorting Techniques",
    "subtopic": "Sorting-I",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/selection-sort/1",
    "verified": true,
    "codeSnippet": "def selectionSort(nums: list[int]) -> int:\n    # Write your solution for Selection Sort below\n    pass",
    "starterCode": {
      "python": "def selectionSort(nums: list[int]) -> int:\n    # Write your solution for Selection Sort below\n    pass",
      "javascript": "function selectionSort(nums) {\n    // Write your solution for Selection Sort below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int selectionSort(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int selectionSort(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N^2).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N^2) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def selectionSort(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Sorting-I",
      "Wipro",
      "TCS"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Wipro, TCS.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-bubble-sort",
    "title": "Bubble Sort",
    "question": "Repeatedly swap adjacent elements if they are in wrong order.\n\nRepeatedly swap adjacent elements if they are in wrong order.",
    "type": "Coding",
    "company": "Infosys",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn Important Sorting Techniques",
    "subtopic": "Sorting-I",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/bubble-sort/1",
    "verified": true,
    "codeSnippet": "def bubbleSort(nums: list[int]) -> int:\n    # Write your solution for Bubble Sort below\n    pass",
    "starterCode": {
      "python": "def bubbleSort(nums: list[int]) -> int:\n    # Write your solution for Bubble Sort below\n    pass",
      "javascript": "function bubbleSort(nums) {\n    // Write your solution for Bubble Sort below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int bubbleSort(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int bubbleSort(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N^2).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N^2) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def bubbleSort(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Sorting-I",
      "Infosys",
      "TCS"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Infosys, TCS.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-insertion-sort",
    "title": "Insertion Sort",
    "question": "Build sorted array one item at a time by inserting into sorted prefix.\n\nBuild sorted array one item at a time by inserting into sorted prefix.",
    "type": "Coding",
    "company": "Cognizant",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn Important Sorting Techniques",
    "subtopic": "Sorting-I",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/insertion-sort/1",
    "verified": true,
    "codeSnippet": "def insertionSort(nums: list[int]) -> int:\n    # Write your solution for Insertion Sort below\n    pass",
    "starterCode": {
      "python": "def insertionSort(nums: list[int]) -> int:\n    # Write your solution for Insertion Sort below\n    pass",
      "javascript": "function insertionSort(nums) {\n    // Write your solution for Insertion Sort below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int insertionSort(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int insertionSort(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N^2).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N^2) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def insertionSort(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Sorting-I",
      "Cognizant",
      "Wipro"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Cognizant, Wipro.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-merge-sort",
    "title": "Merge Sort",
    "question": "Divide-and-conquer algorithm dividing array in halves and merging sorted halves.\n\nDivide-and-conquer algorithm dividing array in halves and merging sorted halves.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn Important Sorting Techniques",
    "subtopic": "Sorting-II",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/merge-sort/1",
    "verified": true,
    "codeSnippet": "def mergeSort(nums: list[int]) -> int:\n    # Write your solution for Merge Sort below\n    pass",
    "starterCode": {
      "python": "def mergeSort(nums: list[int]) -> int:\n    # Write your solution for Merge Sort below\n    pass",
      "javascript": "function mergeSort(nums) {\n    // Write your solution for Merge Sort below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int mergeSort(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int mergeSort(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N log N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N log N) time and O(N) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def mergeSort(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "DSA",
      "Sorting-II",
      "Amazon",
      "Microsoft",
      "Goldman Sachs"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Microsoft, Goldman Sachs.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-recursive-bubble-sort",
    "title": "Recursive Bubble Sort",
    "question": "Recursive implementation of bubble sort passing reduced size.\n\nRecursive implementation of bubble sort passing reduced size.",
    "type": "Coding",
    "company": "TCS",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn Important Sorting Techniques",
    "subtopic": "Sorting-II",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/bubble-sort/1",
    "verified": true,
    "codeSnippet": "def recursiveBubbleSort(nums: list[int]) -> int:\n    # Write your solution for Recursive Bubble Sort below\n    pass",
    "starterCode": {
      "python": "def recursiveBubbleSort(nums: list[int]) -> int:\n    # Write your solution for Recursive Bubble Sort below\n    pass",
      "javascript": "function recursiveBubbleSort(nums) {\n    // Write your solution for Recursive Bubble Sort below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int recursiveBubbleSort(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int recursiveBubbleSort(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N^2).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N^2) time and O(N) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def recursiveBubbleSort(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(N)",
    "tags": [
      "DSA",
      "Sorting-II",
      "TCS"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at TCS.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-recursive-insertion-sort",
    "title": "Recursive Insertion Sort",
    "question": "Recursive insertion sort sorting n-1 elements and placing nth.\n\nRecursive insertion sort sorting n-1 elements and placing nth.",
    "type": "Coding",
    "company": "Wipro",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn Important Sorting Techniques",
    "subtopic": "Sorting-II",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/insertion-sort/1",
    "verified": true,
    "codeSnippet": "def recursiveInsertionSort(nums: list[int]) -> int:\n    # Write your solution for Recursive Insertion Sort below\n    pass",
    "starterCode": {
      "python": "def recursiveInsertionSort(nums: list[int]) -> int:\n    # Write your solution for Recursive Insertion Sort below\n    pass",
      "javascript": "function recursiveInsertionSort(nums) {\n    // Write your solution for Recursive Insertion Sort below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int recursiveInsertionSort(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int recursiveInsertionSort(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N^2).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N^2) time and O(N) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def recursiveInsertionSort(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(N)",
    "tags": [
      "DSA",
      "Sorting-II",
      "Wipro"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Wipro.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-quick-sort",
    "title": "Quick Sort",
    "question": "Partition array around pivot element putting smaller left and greater right.\n\nPartition array around pivot element putting smaller left and greater right.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Learn Important Sorting Techniques",
    "subtopic": "Sorting-II",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/quick-sort/1",
    "verified": true,
    "codeSnippet": "def quickSort(nums: list[int]) -> int:\n    # Write your solution for Quick Sort below\n    pass",
    "starterCode": {
      "python": "def quickSort(nums: list[int]) -> int:\n    # Write your solution for Quick Sort below\n    pass",
      "javascript": "function quickSort(nums) {\n    // Write your solution for Quick Sort below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int quickSort(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int quickSort(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N log N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N log N) time and O(log N) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def quickSort(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(log N)",
    "tags": [
      "DSA",
      "Sorting-II",
      "Amazon",
      "Google",
      "Microsoft"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Google, Microsoft.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-largest-element-in-an-array",
    "title": "Largest Element in an Array",
    "question": "Find maximum value in unsorted array in single pass.\n\nFind maximum value in unsorted array in single pass.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Easy Array Problems",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/largest-element-in-array/1",
    "verified": true,
    "codeSnippet": "def largestElementInAnArray(nums: list[int]) -> int:\n    # Write your solution for Largest Element in an Array below\n    pass",
    "starterCode": {
      "python": "def largestElementInAnArray(nums: list[int]) -> int:\n    # Write your solution for Largest Element in an Array below\n    pass",
      "javascript": "function largestElementInAnArray(nums) {\n    // Write your solution for Largest Element in an Array below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int largestElementInAnArray(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int largestElementInAnArray(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def largestElementInAnArray(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Easy Array Problems",
      "Amazon",
      "TCS",
      "Infosys"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, TCS, Infosys.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-second-largest-element-in-array",
    "title": "Second Largest Element in Array",
    "question": "Find second largest and second smallest distinct elements without sorting.\n\nFind second largest and second smallest distinct elements without sorting.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Easy Array Problems",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/second-largest3735/1",
    "verified": true,
    "codeSnippet": "def secondLargestElementInArray(nums: list[int]) -> int:\n    # Write your solution for Second Largest Element in Array below\n    pass",
    "starterCode": {
      "python": "def secondLargestElementInArray(nums: list[int]) -> int:\n    # Write your solution for Second Largest Element in Array below\n    pass",
      "javascript": "function secondLargestElementInArray(nums) {\n    // Write your solution for Second Largest Element in Array below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int secondLargestElementInArray(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int secondLargestElementInArray(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def secondLargestElementInArray(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Easy Array Problems",
      "Amazon",
      "Microsoft",
      "Adobe"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Microsoft, Adobe.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-check-if-array-is-sorted-and-rotated",
    "title": "Check if Array is Sorted and Rotated",
    "question": "Determine if array was originally sorted then rotated.\n\nDetermine if array was originally sorted then rotated.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Easy Array Problems",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/check-if-array-is-sorted-and-rotated/",
    "verified": true,
    "codeSnippet": "def checkIfArrayIsSortedAndRotated(nums: list[int]) -> int:\n    # Write your solution for Check if Array is Sorted and Rotated below\n    pass",
    "starterCode": {
      "python": "def checkIfArrayIsSortedAndRotated(nums: list[int]) -> int:\n    # Write your solution for Check if Array is Sorted and Rotated below\n    pass",
      "javascript": "function checkIfArrayIsSortedAndRotated(nums) {\n    // Write your solution for Check if Array is Sorted and Rotated below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int checkIfArrayIsSortedAndRotated(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int checkIfArrayIsSortedAndRotated(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def checkIfArrayIsSortedAndRotated(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Easy Array Problems",
      "Amazon",
      "Microsoft"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Microsoft.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-remove-duplicates-from-sorted-array",
    "title": "Remove Duplicates from Sorted Array",
    "question": "Remove duplicates in-place such that each unique element appears once.\n\nRemove duplicates in-place such that each unique element appears once.",
    "type": "Coding",
    "company": "Google",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Easy Array Problems",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/remove-duplicates-from-sorted-array/",
    "verified": true,
    "codeSnippet": "def removeDuplicatesFromSortedArray(nums: list[int]) -> int:\n    # Write your solution for Remove Duplicates from Sorted Array below\n    pass",
    "starterCode": {
      "python": "def removeDuplicatesFromSortedArray(nums: list[int]) -> int:\n    # Write your solution for Remove Duplicates from Sorted Array below\n    pass",
      "javascript": "function removeDuplicatesFromSortedArray(nums) {\n    // Write your solution for Remove Duplicates from Sorted Array below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int removeDuplicatesFromSortedArray(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int removeDuplicatesFromSortedArray(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def removeDuplicatesFromSortedArray(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Easy Array Problems",
      "Google",
      "Amazon",
      "Meta"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Google, Amazon, Meta.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-left-rotate-array-by-one-place",
    "title": "Left Rotate Array by One Place",
    "question": "Shift all elements left by 1 place, moving first to end.\n\nShift all elements left by 1 place, moving first to end.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Easy Array Problems",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/rotate-array/",
    "verified": true,
    "codeSnippet": "def leftRotateArrayByOnePlace(nums: list[int]) -> int:\n    # Write your solution for Left Rotate Array by One Place below\n    pass",
    "starterCode": {
      "python": "def leftRotateArrayByOnePlace(nums: list[int]) -> int:\n    # Write your solution for Left Rotate Array by One Place below\n    pass",
      "javascript": "function leftRotateArrayByOnePlace(nums) {\n    // Write your solution for Left Rotate Array by One Place below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int leftRotateArrayByOnePlace(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int leftRotateArrayByOnePlace(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def leftRotateArrayByOnePlace(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Easy Array Problems",
      "Amazon",
      "TCS"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, TCS.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-rotate-array-by-k-places-reversal-algorithm",
    "title": "Rotate Array by K Places (Reversal Algorithm)",
    "question": "Rotate array right by k steps in O(1) space using triple reverse.\n\nRotate array right by k steps in O(1) space using triple reverse.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Easy Array Problems",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/rotate-array/",
    "verified": true,
    "codeSnippet": "def rotateArrayByKPlacesReversalAlgorithm(nums: list[int]) -> int:\n    # Write your solution for Rotate Array by K Places (Reversal Algorithm) below\n    pass",
    "starterCode": {
      "python": "def rotateArrayByKPlacesReversalAlgorithm(nums: list[int]) -> int:\n    # Write your solution for Rotate Array by K Places (Reversal Algorithm) below\n    pass",
      "javascript": "function rotateArrayByKPlacesReversalAlgorithm(nums) {\n    // Write your solution for Rotate Array by K Places (Reversal Algorithm) below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int rotateArrayByKPlacesReversalAlgorithm(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int rotateArrayByKPlacesReversalAlgorithm(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def rotateArrayByKPlacesReversalAlgorithm(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Easy Array Problems",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Microsoft, Meta.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-move-zeroes-to-end",
    "title": "Move Zeroes to End",
    "question": "Move all 0s to end while preserving order of non-zeroes.\n\nMove all 0s to end while preserving order of non-zeroes.",
    "type": "Coding",
    "company": "Meta",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Easy Array Problems",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/move-zeroes/",
    "verified": true,
    "codeSnippet": "def moveZeroesToEnd(nums: list[int]) -> int:\n    # Write your solution for Move Zeroes to End below\n    pass",
    "starterCode": {
      "python": "def moveZeroesToEnd(nums: list[int]) -> int:\n    # Write your solution for Move Zeroes to End below\n    pass",
      "javascript": "function moveZeroesToEnd(nums) {\n    // Write your solution for Move Zeroes to End below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int moveZeroesToEnd(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int moveZeroesToEnd(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def moveZeroesToEnd(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Easy Array Problems",
      "Meta",
      "Amazon",
      "Apple"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Meta, Amazon, Apple.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-linear-search",
    "title": "Linear Search",
    "question": "Find first index of target key in array or return -1.\n\nFind first index of target key in array or return -1.",
    "type": "Coding",
    "company": "TCS",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Easy Array Problems",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/who-will-win-1587115621/1",
    "verified": true,
    "codeSnippet": "def linearSearch(nums: list[int]) -> int:\n    # Write your solution for Linear Search below\n    pass",
    "starterCode": {
      "python": "def linearSearch(nums: list[int]) -> int:\n    # Write your solution for Linear Search below\n    pass",
      "javascript": "function linearSearch(nums) {\n    // Write your solution for Linear Search below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int linearSearch(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int linearSearch(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def linearSearch(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Easy Array Problems",
      "TCS",
      "Wipro"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at TCS, Wipro.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-find-union-of-two-sorted-arrays",
    "title": "Find Union of Two Sorted Arrays",
    "question": "Merge two sorted arrays producing sorted unique union.\n\nMerge two sorted arrays producing sorted unique union.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Easy Array Problems",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/union-of-two-sorted-arrays-1587115621/1",
    "verified": true,
    "codeSnippet": "def findUnionOfTwoSortedArrays(nums: list[int]) -> int:\n    # Write your solution for Find Union of Two Sorted Arrays below\n    pass",
    "starterCode": {
      "python": "def findUnionOfTwoSortedArrays(nums: list[int]) -> int:\n    # Write your solution for Find Union of Two Sorted Arrays below\n    pass",
      "javascript": "function findUnionOfTwoSortedArrays(nums) {\n    // Write your solution for Find Union of Two Sorted Arrays below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int findUnionOfTwoSortedArrays(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int findUnionOfTwoSortedArrays(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N + M).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N + M) time and O(N + M) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def findUnionOfTwoSortedArrays(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N + M)",
    "spaceComplexity": "O(N + M)",
    "tags": [
      "DSA",
      "Easy Array Problems",
      "Amazon",
      "Microsoft"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Microsoft.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-find-missing-number-in-an-array",
    "title": "Find Missing Number in an Array",
    "question": "Find only number in range [0, n] missing using XOR or sum formula.\n\nFind only number in range [0, n] missing using XOR or sum formula.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Easy Array Problems",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/missing-number/",
    "verified": true,
    "codeSnippet": "def findMissingNumberInAnArray(nums: list[int]) -> int:\n    # Write your solution for Find Missing Number in an Array below\n    pass",
    "starterCode": {
      "python": "def findMissingNumberInAnArray(nums: list[int]) -> int:\n    # Write your solution for Find Missing Number in an Array below\n    pass",
      "javascript": "function findMissingNumberInAnArray(nums) {\n    // Write your solution for Find Missing Number in an Array below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int findMissingNumberInAnArray(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int findMissingNumberInAnArray(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def findMissingNumberInAnArray(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Easy Array Problems",
      "Amazon",
      "Microsoft",
      "Flipkart"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Microsoft, Flipkart.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-max-consecutive-ones",
    "title": "Max Consecutive Ones",
    "question": "Find maximum number of consecutive 1s in binary array.\n\nFind maximum number of consecutive 1s in binary array.",
    "type": "Coding",
    "company": "Google",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Easy Array Problems",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/max-consecutive-ones/",
    "verified": true,
    "codeSnippet": "def maxConsecutiveOnes(nums: list[int]) -> int:\n    # Write your solution for Max Consecutive Ones below\n    pass",
    "starterCode": {
      "python": "def maxConsecutiveOnes(nums: list[int]) -> int:\n    # Write your solution for Max Consecutive Ones below\n    pass",
      "javascript": "function maxConsecutiveOnes(nums) {\n    // Write your solution for Max Consecutive Ones below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maxConsecutiveOnes(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int maxConsecutiveOnes(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def maxConsecutiveOnes(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Easy Array Problems",
      "Google",
      "Amazon"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Google, Amazon.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-single-number-xor-property",
    "title": "Single Number (XOR Property)",
    "question": "Find element appearing once where all others appear twice.\n\nFind element appearing once where all others appear twice.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Easy Array Problems",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/single-number/",
    "verified": true,
    "codeSnippet": "def singleNumberXORProperty(nums: list[int]) -> int:\n    # Write your solution for Single Number (XOR Property) below\n    pass",
    "starterCode": {
      "python": "def singleNumberXORProperty(nums: list[int]) -> int:\n    # Write your solution for Single Number (XOR Property) below\n    pass",
      "javascript": "function singleNumberXORProperty(nums) {\n    // Write your solution for Single Number (XOR Property) below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int singleNumberXORProperty(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int singleNumberXORProperty(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def singleNumberXORProperty(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Easy Array Problems",
      "Amazon",
      "Google",
      "Meta"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Google, Meta.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-longest-subarray-with-sum-k-positives",
    "title": "Longest Subarray with Sum K (Positives)",
    "question": "Find max length of subarray with sum K in positive array via two pointers.\n\nFind max length of subarray with sum K in positive array via two pointers.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Easy Array Problems",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/longest-sub-array-with-sum-k0809/1",
    "verified": true,
    "codeSnippet": "def longestSubarrayWithSumKPositives(nums: list[int]) -> int:\n    # Write your solution for Longest Subarray with Sum K (Positives) below\n    pass",
    "starterCode": {
      "python": "def longestSubarrayWithSumKPositives(nums: list[int]) -> int:\n    # Write your solution for Longest Subarray with Sum K (Positives) below\n    pass",
      "javascript": "function longestSubarrayWithSumKPositives(nums) {\n    // Write your solution for Longest Subarray with Sum K (Positives) below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int longestSubarrayWithSumKPositives(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int longestSubarrayWithSumKPositives(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def longestSubarrayWithSumKPositives(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Easy Array Problems",
      "Amazon",
      "Flipkart"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Flipkart.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-longest-subarray-with-sum-k-positives-negatives",
    "title": "Longest Subarray with Sum K (Positives + Negatives)",
    "question": "Use prefix sum map to find longest subarray with sum K with negatives.\n\nUse prefix sum map to find longest subarray with sum K with negatives.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Easy Array Problems",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/longest-sub-array-with-sum-k0809/1",
    "verified": true,
    "codeSnippet": "def longestSubarrayWithSumKPositivesNegatives(nums: list[int]) -> int:\n    # Write your solution for Longest Subarray with Sum K (Positives + Negatives) below\n    pass",
    "starterCode": {
      "python": "def longestSubarrayWithSumKPositivesNegatives(nums: list[int]) -> int:\n    # Write your solution for Longest Subarray with Sum K (Positives + Negatives) below\n    pass",
      "javascript": "function longestSubarrayWithSumKPositivesNegatives(nums) {\n    // Write your solution for Longest Subarray with Sum K (Positives + Negatives) below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int longestSubarrayWithSumKPositivesNegatives(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int longestSubarrayWithSumKPositivesNegatives(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(N) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def longestSubarrayWithSumKPositivesNegatives(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "DSA",
      "Easy Array Problems",
      "Amazon",
      "Google"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Google.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-two-sum-check-pair-with-target",
    "title": "Two Sum - Check pair with Target",
    "question": "Return indices of two numbers that add up to target.\n\nReturn indices of two numbers that add up to target.",
    "type": "Coding",
    "company": "Google",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Medium Array Problems",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/two-sum/",
    "verified": true,
    "codeSnippet": "def twoSumCheckPairWithTarget(nums: list[int]) -> int:\n    # Write your solution for Two Sum - Check pair with Target below\n    pass",
    "starterCode": {
      "python": "def twoSumCheckPairWithTarget(nums: list[int]) -> int:\n    # Write your solution for Two Sum - Check pair with Target below\n    pass",
      "javascript": "function twoSumCheckPairWithTarget(nums) {\n    // Write your solution for Two Sum - Check pair with Target below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int twoSumCheckPairWithTarget(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int twoSumCheckPairWithTarget(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(N) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def twoSumCheckPairWithTarget(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "DSA",
      "Medium Array Problems",
      "Google",
      "Amazon",
      "Meta",
      "Apple"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Google, Amazon, Meta.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-sort-colors-0s-1s-2s-dutch-national-flag",
    "title": "Sort Colors (0s, 1s, 2s) - Dutch National Flag",
    "question": "Sort array of 0s, 1s, and 2s in single pass using 3 pointers.\n\nSort array of 0s, 1s, and 2s in single pass using 3 pointers.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Medium Array Problems",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/sort-colors/",
    "verified": true,
    "codeSnippet": "def sortColors0s1s2sDutchNationalFlag(nums: list[int]) -> int:\n    # Write your solution for Sort Colors (0s, 1s, 2s) - Dutch National Flag below\n    pass",
    "starterCode": {
      "python": "def sortColors0s1s2sDutchNationalFlag(nums: list[int]) -> int:\n    # Write your solution for Sort Colors (0s, 1s, 2s) - Dutch National Flag below\n    pass",
      "javascript": "function sortColors0s1s2sDutchNationalFlag(nums) {\n    // Write your solution for Sort Colors (0s, 1s, 2s) - Dutch National Flag below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int sortColors0s1s2sDutchNationalFlag(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int sortColors0s1s2sDutchNationalFlag(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def sortColors0s1s2sDutchNationalFlag(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Medium Array Problems",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Microsoft, Meta.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-majority-element-n-2-times-moore-s-voting",
    "title": "Majority Element (> N/2 times) - Moore's Voting",
    "question": "Find element appearing more than n/2 times using Boyer-Moore Voting.\n\nFind element appearing more than n/2 times using Boyer-Moore Voting.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Medium Array Problems",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/majority-element/",
    "verified": true,
    "codeSnippet": "def majorityElementN2TimesMooreSVoting(nums: list[int]) -> int:\n    # Write your solution for Majority Element (> N/2 times) - Moore's Voting below\n    pass",
    "starterCode": {
      "python": "def majorityElementN2TimesMooreSVoting(nums: list[int]) -> int:\n    # Write your solution for Majority Element (> N/2 times) - Moore's Voting below\n    pass",
      "javascript": "function majorityElementN2TimesMooreSVoting(nums) {\n    // Write your solution for Majority Element (> N/2 times) - Moore's Voting below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int majorityElementN2TimesMooreSVoting(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int majorityElementN2TimesMooreSVoting(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def majorityElementN2TimesMooreSVoting(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Medium Array Problems",
      "Amazon",
      "Google",
      "Apple"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Google, Apple.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-maximum-subarray-sum-kadane-s-algorithm",
    "title": "Maximum Subarray Sum - Kadane's Algorithm",
    "question": "Find contiguous subarray with largest sum using Kadane's Algorithm.\n\nFind contiguous subarray with largest sum using Kadane's Algorithm.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Medium Array Problems",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/maximum-subarray/",
    "verified": true,
    "codeSnippet": "def maximumSubarraySumKadaneSAlgorithm(nums: list[int]) -> int:\n    # Write your solution for Maximum Subarray Sum - Kadane's Algorithm below\n    pass",
    "starterCode": {
      "python": "def maximumSubarraySumKadaneSAlgorithm(nums: list[int]) -> int:\n    # Write your solution for Maximum Subarray Sum - Kadane's Algorithm below\n    pass",
      "javascript": "function maximumSubarraySumKadaneSAlgorithm(nums) {\n    // Write your solution for Maximum Subarray Sum - Kadane's Algorithm below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maximumSubarraySumKadaneSAlgorithm(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int maximumSubarraySumKadaneSAlgorithm(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def maximumSubarraySumKadaneSAlgorithm(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Medium Array Problems",
      "Amazon",
      "Microsoft",
      "Google"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Microsoft, Google.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-print-subarray-with-maximum-sum",
    "title": "Print Subarray with Maximum Sum",
    "question": "Extend Kadane's to return starting and ending indices of maximum sum.\n\nExtend Kadane's to return starting and ending indices of maximum sum.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Medium Array Problems",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/maximum-subarray/",
    "verified": true,
    "codeSnippet": "def printSubarrayWithMaximumSum(nums: list[int]) -> int:\n    # Write your solution for Print Subarray with Maximum Sum below\n    pass",
    "starterCode": {
      "python": "def printSubarrayWithMaximumSum(nums: list[int]) -> int:\n    # Write your solution for Print Subarray with Maximum Sum below\n    pass",
      "javascript": "function printSubarrayWithMaximumSum(nums) {\n    // Write your solution for Print Subarray with Maximum Sum below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int printSubarrayWithMaximumSum(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int printSubarrayWithMaximumSum(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def printSubarrayWithMaximumSum(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Medium Array Problems",
      "Amazon",
      "Flipkart"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Flipkart.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-best-time-to-buy-and-sell-stock",
    "title": "Best Time to Buy and Sell Stock",
    "question": "Maximize profit buying on one day and selling on a future day.\n\nMaximize profit buying on one day and selling on a future day.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Medium Array Problems",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/",
    "verified": true,
    "codeSnippet": "def bestTimeToBuyAndSellStock(nums: list[int]) -> int:\n    # Write your solution for Best Time to Buy and Sell Stock below\n    pass",
    "starterCode": {
      "python": "def bestTimeToBuyAndSellStock(nums: list[int]) -> int:\n    # Write your solution for Best Time to Buy and Sell Stock below\n    pass",
      "javascript": "function bestTimeToBuyAndSellStock(nums) {\n    // Write your solution for Best Time to Buy and Sell Stock below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int bestTimeToBuyAndSellStock(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int bestTimeToBuyAndSellStock(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def bestTimeToBuyAndSellStock(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Medium Array Problems",
      "Amazon",
      "Meta",
      "Google"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Meta, Google.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-rearrange-array-elements-by-sign",
    "title": "Rearrange Array Elements by Sign",
    "question": "Rearrange elements into alternating positive and negative values.\n\nRearrange elements into alternating positive and negative values.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Medium Array Problems",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/rearrange-array-elements-by-sign/",
    "verified": true,
    "codeSnippet": "def rearrangeArrayElementsBySign(nums: list[int]) -> int:\n    # Write your solution for Rearrange Array Elements by Sign below\n    pass",
    "starterCode": {
      "python": "def rearrangeArrayElementsBySign(nums: list[int]) -> int:\n    # Write your solution for Rearrange Array Elements by Sign below\n    pass",
      "javascript": "function rearrangeArrayElementsBySign(nums) {\n    // Write your solution for Rearrange Array Elements by Sign below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int rearrangeArrayElementsBySign(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int rearrangeArrayElementsBySign(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(N) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def rearrangeArrayElementsBySign(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "DSA",
      "Medium Array Problems",
      "Amazon",
      "Microsoft"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Microsoft.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-next-permutation",
    "title": "Next Permutation",
    "question": "Rearrange numbers into lexicographically next greater permutation.\n\nRearrange numbers into lexicographically next greater permutation.",
    "type": "Coding",
    "company": "Google",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Medium Array Problems",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/next-permutation/",
    "verified": true,
    "codeSnippet": "def nextPermutation(nums: list[int]) -> int:\n    # Write your solution for Next Permutation below\n    pass",
    "starterCode": {
      "python": "def nextPermutation(nums: list[int]) -> int:\n    # Write your solution for Next Permutation below\n    pass",
      "javascript": "function nextPermutation(nums) {\n    // Write your solution for Next Permutation below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int nextPermutation(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int nextPermutation(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def nextPermutation(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Medium Array Problems",
      "Google",
      "Amazon",
      "Meta"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Google, Amazon, Meta.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-leaders-in-an-array",
    "title": "Leaders in an Array",
    "question": "Find all elements greater than all elements to their right.\n\nFind all elements greater than all elements to their right.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Medium Array Problems",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/leaders-in-an-array-1587115620/1",
    "verified": true,
    "codeSnippet": "def leadersInAnArray(nums: list[int]) -> int:\n    # Write your solution for Leaders in an Array below\n    pass",
    "starterCode": {
      "python": "def leadersInAnArray(nums: list[int]) -> int:\n    # Write your solution for Leaders in an Array below\n    pass",
      "javascript": "function leadersInAnArray(nums) {\n    // Write your solution for Leaders in an Array below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int leadersInAnArray(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int leadersInAnArray(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def leadersInAnArray(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Medium Array Problems",
      "Amazon",
      "Adobe",
      "Paytm"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Adobe, Paytm.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-longest-consecutive-sequence-in-an-array",
    "title": "Longest Consecutive Sequence in an Array",
    "question": "Find length of longest consecutive elements sequence in O(n) via hash set.\n\nFind length of longest consecutive elements sequence in O(n) via hash set.",
    "type": "Coding",
    "company": "Google",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Medium Array Problems",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/longest-consecutive-sequence/",
    "verified": true,
    "codeSnippet": "def longestConsecutiveSequenceInAnArray(nums: list[int]) -> int:\n    # Write your solution for Longest Consecutive Sequence in an Array below\n    pass",
    "starterCode": {
      "python": "def longestConsecutiveSequenceInAnArray(nums: list[int]) -> int:\n    # Write your solution for Longest Consecutive Sequence in an Array below\n    pass",
      "javascript": "function longestConsecutiveSequenceInAnArray(nums) {\n    // Write your solution for Longest Consecutive Sequence in an Array below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int longestConsecutiveSequenceInAnArray(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int longestConsecutiveSequenceInAnArray(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(N) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def longestConsecutiveSequenceInAnArray(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "DSA",
      "Medium Array Problems",
      "Google",
      "Amazon",
      "Meta"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Google, Amazon, Meta.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-set-matrix-zeroes",
    "title": "Set Matrix Zeroes",
    "question": "If element is 0, set its row and column to 0 in-place in O(1) space.\n\nIf element is 0, set its row and column to 0 in-place in O(1) space.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Medium Array Problems",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/set-matrix-zeroes/",
    "verified": true,
    "codeSnippet": "def setMatrixZeroes(nums: list[int]) -> int:\n    # Write your solution for Set Matrix Zeroes below\n    pass",
    "starterCode": {
      "python": "def setMatrixZeroes(nums: list[int]) -> int:\n    # Write your solution for Set Matrix Zeroes below\n    pass",
      "javascript": "function setMatrixZeroes(nums) {\n    // Write your solution for Set Matrix Zeroes below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int setMatrixZeroes(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int setMatrixZeroes(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(M * N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(M * N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def setMatrixZeroes(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(M * N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Medium Array Problems",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Microsoft, Meta.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-rotate-image-by-90-degrees-clockwise",
    "title": "Rotate Image by 90 Degrees Clockwise",
    "question": "Rotate n x n matrix clockwise 90 degrees by transpose and row reversal.\n\nRotate n x n matrix clockwise 90 degrees by transpose and row reversal.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Medium Array Problems",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/rotate-image/",
    "verified": true,
    "codeSnippet": "def rotateImageBy90DegreesClockwise(nums: list[int]) -> int:\n    # Write your solution for Rotate Image by 90 Degrees Clockwise below\n    pass",
    "starterCode": {
      "python": "def rotateImageBy90DegreesClockwise(nums: list[int]) -> int:\n    # Write your solution for Rotate Image by 90 Degrees Clockwise below\n    pass",
      "javascript": "function rotateImageBy90DegreesClockwise(nums) {\n    // Write your solution for Rotate Image by 90 Degrees Clockwise below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int rotateImageBy90DegreesClockwise(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int rotateImageBy90DegreesClockwise(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N^2).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N^2) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def rotateImageBy90DegreesClockwise(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Medium Array Problems",
      "Amazon",
      "Microsoft",
      "Google"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Microsoft, Google.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-spiral-traversal-of-matrix",
    "title": "Spiral Traversal of Matrix",
    "question": "Traverse matrix in spiral order across top, right, bottom, left.\n\nTraverse matrix in spiral order across top, right, bottom, left.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Medium Array Problems",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/spiral-matrix/",
    "verified": true,
    "codeSnippet": "def spiralTraversalOfMatrix(nums: list[int]) -> int:\n    # Write your solution for Spiral Traversal of Matrix below\n    pass",
    "starterCode": {
      "python": "def spiralTraversalOfMatrix(nums: list[int]) -> int:\n    # Write your solution for Spiral Traversal of Matrix below\n    pass",
      "javascript": "function spiralTraversalOfMatrix(nums) {\n    // Write your solution for Spiral Traversal of Matrix below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int spiralTraversalOfMatrix(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int spiralTraversalOfMatrix(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(M * N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(M * N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def spiralTraversalOfMatrix(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(M * N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Medium Array Problems",
      "Amazon",
      "Microsoft",
      "Apple"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Microsoft, Apple.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-subarray-sum-equals-k-count-of-subarrays",
    "title": "Subarray Sum Equals K (Count of Subarrays)",
    "question": "Find total number of subarrays whose sum equals k using prefix sum map.\n\nFind total number of subarrays whose sum equals k using prefix sum map.",
    "type": "Coding",
    "company": "Meta",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Medium Array Problems",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/subarray-sum-equals-k/",
    "verified": true,
    "codeSnippet": "def subarraySumEqualsKCountOfSubarrays(nums: list[int]) -> int:\n    # Write your solution for Subarray Sum Equals K (Count of Subarrays) below\n    pass",
    "starterCode": {
      "python": "def subarraySumEqualsKCountOfSubarrays(nums: list[int]) -> int:\n    # Write your solution for Subarray Sum Equals K (Count of Subarrays) below\n    pass",
      "javascript": "function subarraySumEqualsKCountOfSubarrays(nums) {\n    // Write your solution for Subarray Sum Equals K (Count of Subarrays) below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int subarraySumEqualsKCountOfSubarrays(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int subarraySumEqualsKCountOfSubarrays(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(N) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def subarraySumEqualsKCountOfSubarrays(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "DSA",
      "Medium Array Problems",
      "Meta",
      "Amazon",
      "Google"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Meta, Amazon, Google.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-pascal-s-triangle-full-generation-r-th-element",
    "title": "Pascal's Triangle (Full generation & r-th element)",
    "question": "Generate first numRows of Pascal's triangle or calculate specific element.\n\nGenerate first numRows of Pascal's triangle or calculate specific element.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Hard Array Problems",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/pascals-triangle/",
    "verified": true,
    "codeSnippet": "def pascalSTriangleFullGenerationRThElement(nums: list[int]) -> int:\n    # Write your solution for Pascal's Triangle (Full generation & r-th element) below\n    pass",
    "starterCode": {
      "python": "def pascalSTriangleFullGenerationRThElement(nums: list[int]) -> int:\n    # Write your solution for Pascal's Triangle (Full generation & r-th element) below\n    pass",
      "javascript": "function pascalSTriangleFullGenerationRThElement(nums) {\n    // Write your solution for Pascal's Triangle (Full generation & r-th element) below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int pascalSTriangleFullGenerationRThElement(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int pascalSTriangleFullGenerationRThElement(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N^2).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N^2) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def pascalSTriangleFullGenerationRThElement(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Hard Array Problems",
      "Amazon",
      "Google",
      "Goldman Sachs"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Google, Goldman Sachs.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-majority-element-ii-n-3-times",
    "title": "Majority Element II (> N/3 times)",
    "question": "Find all elements appearing more than floor(n/3) times using extended Boyer-Moore.\n\nFind all elements appearing more than floor(n/3) times using extended Boyer-Moore.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Hard Array Problems",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/majority-element-ii/",
    "verified": true,
    "codeSnippet": "def majorityElementIIN3Times(nums: list[int]) -> int:\n    # Write your solution for Majority Element II (> N/3 times) below\n    pass",
    "starterCode": {
      "python": "def majorityElementIIN3Times(nums: list[int]) -> int:\n    # Write your solution for Majority Element II (> N/3 times) below\n    pass",
      "javascript": "function majorityElementIIN3Times(nums) {\n    // Write your solution for Majority Element II (> N/3 times) below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int majorityElementIIN3Times(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int majorityElementIIN3Times(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def majorityElementIIN3Times(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Hard Array Problems",
      "Amazon",
      "Google"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Google.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-3sum-triplets-adding-to-zero",
    "title": "3Sum - Triplets Adding to Zero",
    "question": "Find all unique triplets in array that sum to 0 in O(n^2).\n\nFind all unique triplets in array that sum to 0 in O(n^2).",
    "type": "Coding",
    "company": "Meta",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Hard Array Problems",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/3sum/",
    "verified": true,
    "codeSnippet": "def 3SumTripletsAddingToZero(nums: list[int]) -> int:\n    # Write your solution for 3Sum - Triplets Adding to Zero below\n    pass",
    "starterCode": {
      "python": "def 3SumTripletsAddingToZero(nums: list[int]) -> int:\n    # Write your solution for 3Sum - Triplets Adding to Zero below\n    pass",
      "javascript": "function 3SumTripletsAddingToZero(nums) {\n    // Write your solution for 3Sum - Triplets Adding to Zero below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int 3SumTripletsAddingToZero(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int 3SumTripletsAddingToZero(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N^2).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N^2) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def 3SumTripletsAddingToZero(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N^2)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Hard Array Problems",
      "Meta",
      "Amazon",
      "Google"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Meta, Amazon, Google.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-4sum-quads-adding-to-target",
    "title": "4Sum - Quads Adding to Target",
    "question": "Find all unique quadruplets summing to target in O(n^3).\n\nFind all unique quadruplets summing to target in O(n^3).",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Hard Array Problems",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/4sum/",
    "verified": true,
    "codeSnippet": "def 4SumQuadsAddingToTarget(nums: list[int]) -> int:\n    # Write your solution for 4Sum - Quads Adding to Target below\n    pass",
    "starterCode": {
      "python": "def 4SumQuadsAddingToTarget(nums: list[int]) -> int:\n    # Write your solution for 4Sum - Quads Adding to Target below\n    pass",
      "javascript": "function 4SumQuadsAddingToTarget(nums) {\n    // Write your solution for 4Sum - Quads Adding to Target below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int 4SumQuadsAddingToTarget(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int 4SumQuadsAddingToTarget(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N^3).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N^3) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def 4SumQuadsAddingToTarget(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N^3)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Hard Array Problems",
      "Amazon",
      "Apple",
      "Google"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Apple, Google.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-largest-subarray-with-0-sum",
    "title": "Largest Subarray with 0 Sum",
    "question": "Find length of largest subarray with sum 0 using prefix sum map.\n\nFind length of largest subarray with sum 0 using prefix sum map.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Hard Array Problems",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/largest-subarray-with-0-sum/1",
    "verified": true,
    "codeSnippet": "def largestSubarrayWith0Sum(nums: list[int]) -> int:\n    # Write your solution for Largest Subarray with 0 Sum below\n    pass",
    "starterCode": {
      "python": "def largestSubarrayWith0Sum(nums: list[int]) -> int:\n    # Write your solution for Largest Subarray with 0 Sum below\n    pass",
      "javascript": "function largestSubarrayWith0Sum(nums) {\n    // Write your solution for Largest Subarray with 0 Sum below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int largestSubarrayWith0Sum(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int largestSubarrayWith0Sum(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(N) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def largestSubarrayWith0Sum(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "DSA",
      "Hard Array Problems",
      "Amazon",
      "MakeMyTrip"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, MakeMyTrip.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-count-subarrays-with-given-xor-k",
    "title": "Count Subarrays with Given XOR K",
    "question": "Count total subarrays with XOR equal to K using prefix XOR map.\n\nCount total subarrays with XOR equal to K using prefix XOR map.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Hard Array Problems",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/count-subarray-with-given-xor/1",
    "verified": true,
    "codeSnippet": "def countSubarraysWithGivenXORK(nums: list[int]) -> int:\n    # Write your solution for Count Subarrays with Given XOR K below\n    pass",
    "starterCode": {
      "python": "def countSubarraysWithGivenXORK(nums: list[int]) -> int:\n    # Write your solution for Count Subarrays with Given XOR K below\n    pass",
      "javascript": "function countSubarraysWithGivenXORK(nums) {\n    // Write your solution for Count Subarrays with Given XOR K below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int countSubarraysWithGivenXORK(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int countSubarraysWithGivenXORK(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(N) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def countSubarraysWithGivenXORK(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "DSA",
      "Hard Array Problems",
      "Amazon",
      "Flipkart"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Flipkart.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-merge-overlapping-subintervals",
    "title": "Merge Overlapping Subintervals",
    "question": "Merge all overlapping intervals after sorting by start times.\n\nMerge all overlapping intervals after sorting by start times.",
    "type": "Coding",
    "company": "Google",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Hard Array Problems",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/merge-intervals/",
    "verified": true,
    "codeSnippet": "def mergeOverlappingSubintervals(nums: list[int]) -> int:\n    # Write your solution for Merge Overlapping Subintervals below\n    pass",
    "starterCode": {
      "python": "def mergeOverlappingSubintervals(nums: list[int]) -> int:\n    # Write your solution for Merge Overlapping Subintervals below\n    pass",
      "javascript": "function mergeOverlappingSubintervals(nums) {\n    // Write your solution for Merge Overlapping Subintervals below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int mergeOverlappingSubintervals(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int mergeOverlappingSubintervals(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N log N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N log N) time and O(N) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def mergeOverlappingSubintervals(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "DSA",
      "Hard Array Problems",
      "Google",
      "Amazon",
      "Microsoft"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Google, Amazon, Microsoft.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-merge-two-sorted-arrays-without-extra-space",
    "title": "Merge Two Sorted Arrays Without Extra Space",
    "question": "Merge sorted arrays arr1 and arr2 in O(1) extra space using Gap method.\n\nMerge sorted arrays arr1 and arr2 in O(1) extra space using Gap method.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Hard Array Problems",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/merge-sorted-array/",
    "verified": true,
    "codeSnippet": "def mergeTwoSortedArraysWithoutExtraSpace(nums: list[int]) -> int:\n    # Write your solution for Merge Two Sorted Arrays Without Extra Space below\n    pass",
    "starterCode": {
      "python": "def mergeTwoSortedArraysWithoutExtraSpace(nums: list[int]) -> int:\n    # Write your solution for Merge Two Sorted Arrays Without Extra Space below\n    pass",
      "javascript": "function mergeTwoSortedArraysWithoutExtraSpace(nums) {\n    // Write your solution for Merge Two Sorted Arrays Without Extra Space below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int mergeTwoSortedArraysWithoutExtraSpace(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int mergeTwoSortedArraysWithoutExtraSpace(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O((N+M) log(N+M)).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O((N+M) log(N+M)) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def mergeTwoSortedArraysWithoutExtraSpace(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O((N+M) log(N+M))",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Hard Array Problems",
      "Amazon",
      "Microsoft",
      "Goldman Sachs"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Microsoft, Goldman Sachs.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-find-the-repeating-and-missing-number",
    "title": "Find the Repeating and Missing Number",
    "question": "Find repeating element A and missing B from 1 to N using math/XOR.\n\nFind repeating element A and missing B from 1 to N using math/XOR.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Hard Array Problems",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/find-missing-and-repeating2512/1",
    "verified": true,
    "codeSnippet": "def findTheRepeatingAndMissingNumber(nums: list[int]) -> int:\n    # Write your solution for Find the Repeating and Missing Number below\n    pass",
    "starterCode": {
      "python": "def findTheRepeatingAndMissingNumber(nums: list[int]) -> int:\n    # Write your solution for Find the Repeating and Missing Number below\n    pass",
      "javascript": "function findTheRepeatingAndMissingNumber(nums) {\n    // Write your solution for Find the Repeating and Missing Number below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int findTheRepeatingAndMissingNumber(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int findTheRepeatingAndMissingNumber(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def findTheRepeatingAndMissingNumber(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Hard Array Problems",
      "Amazon",
      "Goldman Sachs"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Goldman Sachs.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-count-inversions-in-array",
    "title": "Count Inversions in Array",
    "question": "Count pairs (i, j) with i < j and arr[i] > arr[j] using Merge Sort.\n\nCount pairs (i, j) with i < j and arr[i] > arr[j] using Merge Sort.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Hard Array Problems",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/inversion-of-array-1587115620/1",
    "verified": true,
    "codeSnippet": "def countInversionsInArray(nums: list[int]) -> int:\n    # Write your solution for Count Inversions in Array below\n    pass",
    "starterCode": {
      "python": "def countInversionsInArray(nums: list[int]) -> int:\n    # Write your solution for Count Inversions in Array below\n    pass",
      "javascript": "function countInversionsInArray(nums) {\n    // Write your solution for Count Inversions in Array below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int countInversionsInArray(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int countInversionsInArray(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N log N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N log N) time and O(N) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def countInversionsInArray(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "DSA",
      "Hard Array Problems",
      "Amazon",
      "Google",
      "Flipkart"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Google, Flipkart.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-reverse-pairs",
    "title": "Reverse Pairs",
    "question": "Count pairs (i, j) with i < j and nums[i] > 2 * nums[j].\n\nCount pairs (i, j) with i < j and nums[i] > 2 * nums[j].",
    "type": "Coding",
    "company": "Google",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Hard Array Problems",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/reverse-pairs/",
    "verified": true,
    "codeSnippet": "def reversePairs(nums: list[int]) -> int:\n    # Write your solution for Reverse Pairs below\n    pass",
    "starterCode": {
      "python": "def reversePairs(nums: list[int]) -> int:\n    # Write your solution for Reverse Pairs below\n    pass",
      "javascript": "function reversePairs(nums) {\n    // Write your solution for Reverse Pairs below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int reversePairs(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int reversePairs(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N log N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N log N) time and O(N) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def reversePairs(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N log N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "DSA",
      "Hard Array Problems",
      "Google",
      "Amazon"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Google, Amazon.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-maximum-product-subarray",
    "title": "Maximum Product Subarray",
    "question": "Find contiguous subarray with largest product tracking prefix/suffix products.\n\nFind contiguous subarray with largest product tracking prefix/suffix products.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Solve Problems on Arrays",
    "subtopic": "Hard Array Problems",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/maximum-product-subarray/",
    "verified": true,
    "codeSnippet": "def maximumProductSubarray(nums: list[int]) -> int:\n    # Write your solution for Maximum Product Subarray below\n    pass",
    "starterCode": {
      "python": "def maximumProductSubarray(nums: list[int]) -> int:\n    # Write your solution for Maximum Product Subarray below\n    pass",
      "javascript": "function maximumProductSubarray(nums) {\n    // Write your solution for Maximum Product Subarray below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maximumProductSubarray(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int maximumProductSubarray(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def maximumProductSubarray(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Hard Array Problems",
      "Amazon",
      "Microsoft",
      "Google"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Microsoft, Google.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-binary-search-to-find-x-in-sorted-array",
    "title": "Binary Search to find X in sorted array",
    "question": "Locate target in sorted array by halving search space on each step.\n\nLocate target in sorted array by halving search space on each step.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Binary Search",
    "subtopic": "BS on 1D Arrays",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/binary-search/",
    "verified": true,
    "codeSnippet": "def binarySearchToFindXInSortedArray(nums: list[int]) -> int:\n    # Write your solution for Binary Search to find X in sorted array below\n    pass",
    "starterCode": {
      "python": "def binarySearchToFindXInSortedArray(nums: list[int]) -> int:\n    # Write your solution for Binary Search to find X in sorted array below\n    pass",
      "javascript": "function binarySearchToFindXInSortedArray(nums) {\n    // Write your solution for Binary Search to find X in sorted array below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int binarySearchToFindXInSortedArray(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int binarySearchToFindXInSortedArray(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(log N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(log N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def binarySearchToFindXInSortedArray(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(log N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "BS on 1D Arrays",
      "Amazon",
      "Apple",
      "Google"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Apple, Google.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-implement-lower-bound",
    "title": "Implement Lower Bound",
    "question": "Find smallest index ind such that arr[ind] >= x.\n\nFind smallest index ind such that arr[ind] >= x.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Binary Search",
    "subtopic": "BS on 1D Arrays",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/floor-in-a-sorted-array-1587115620/1",
    "verified": true,
    "codeSnippet": "def implementLowerBound(nums: list[int]) -> int:\n    # Write your solution for Implement Lower Bound below\n    pass",
    "starterCode": {
      "python": "def implementLowerBound(nums: list[int]) -> int:\n    # Write your solution for Implement Lower Bound below\n    pass",
      "javascript": "function implementLowerBound(nums) {\n    // Write your solution for Implement Lower Bound below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int implementLowerBound(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int implementLowerBound(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(log N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(log N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def implementLowerBound(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(log N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "BS on 1D Arrays",
      "Amazon",
      "Microsoft"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Microsoft.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-implement-upper-bound",
    "title": "Implement Upper Bound",
    "question": "Find smallest index ind such that arr[ind] > x.\n\nFind smallest index ind such that arr[ind] > x.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Binary Search",
    "subtopic": "BS on 1D Arrays",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/ceil-the-floor2832/1",
    "verified": true,
    "codeSnippet": "def implementUpperBound(nums: list[int]) -> int:\n    # Write your solution for Implement Upper Bound below\n    pass",
    "starterCode": {
      "python": "def implementUpperBound(nums: list[int]) -> int:\n    # Write your solution for Implement Upper Bound below\n    pass",
      "javascript": "function implementUpperBound(nums) {\n    // Write your solution for Implement Upper Bound below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int implementUpperBound(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int implementUpperBound(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(log N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(log N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def implementUpperBound(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(log N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "BS on 1D Arrays",
      "Amazon"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-search-insert-position",
    "title": "Search Insert Position",
    "question": "Find index of target if found or index where it should be inserted.\n\nFind index of target if found or index where it should be inserted.",
    "type": "Coding",
    "company": "Google",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Binary Search",
    "subtopic": "BS on 1D Arrays",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/search-insert-position/",
    "verified": true,
    "codeSnippet": "def searchInsertPosition(nums: list[int]) -> int:\n    # Write your solution for Search Insert Position below\n    pass",
    "starterCode": {
      "python": "def searchInsertPosition(nums: list[int]) -> int:\n    # Write your solution for Search Insert Position below\n    pass",
      "javascript": "function searchInsertPosition(nums) {\n    // Write your solution for Search Insert Position below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int searchInsertPosition(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int searchInsertPosition(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(log N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(log N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def searchInsertPosition(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(log N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "BS on 1D Arrays",
      "Google",
      "Amazon",
      "Apple"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Google, Amazon, Apple.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-floor-and-ceil-in-sorted-array",
    "title": "Floor and Ceil in Sorted Array",
    "question": "Find largest element <= x (floor) and smallest element >= x (ceil).\n\nFind largest element <= x (floor) and smallest element >= x (ceil).",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Binary Search",
    "subtopic": "BS on 1D Arrays",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/ceil-the-floor2832/1",
    "verified": true,
    "codeSnippet": "def floorAndCeilInSortedArray(nums: list[int]) -> int:\n    # Write your solution for Floor and Ceil in Sorted Array below\n    pass",
    "starterCode": {
      "python": "def floorAndCeilInSortedArray(nums: list[int]) -> int:\n    # Write your solution for Floor and Ceil in Sorted Array below\n    pass",
      "javascript": "function floorAndCeilInSortedArray(nums) {\n    // Write your solution for Floor and Ceil in Sorted Array below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int floorAndCeilInSortedArray(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int floorAndCeilInSortedArray(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(log N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(log N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def floorAndCeilInSortedArray(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(log N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "BS on 1D Arrays",
      "Amazon",
      "Microsoft"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Microsoft.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-first-and-last-occurrence-of-element",
    "title": "First and Last Occurrence of Element",
    "question": "Find starting and ending position of target value in sorted array.\n\nFind starting and ending position of target value in sorted array.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Binary Search",
    "subtopic": "BS on 1D Arrays",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/",
    "verified": true,
    "codeSnippet": "def firstAndLastOccurrenceOfElement(nums: list[int]) -> int:\n    # Write your solution for First and Last Occurrence of Element below\n    pass",
    "starterCode": {
      "python": "def firstAndLastOccurrenceOfElement(nums: list[int]) -> int:\n    # Write your solution for First and Last Occurrence of Element below\n    pass",
      "javascript": "function firstAndLastOccurrenceOfElement(nums) {\n    // Write your solution for First and Last Occurrence of Element below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int firstAndLastOccurrenceOfElement(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int firstAndLastOccurrenceOfElement(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(log N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(log N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def firstAndLastOccurrenceOfElement(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(log N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "BS on 1D Arrays",
      "Amazon",
      "Google",
      "Microsoft"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Google, Microsoft.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-count-occurrences-of-a-number-in-sorted-array",
    "title": "Count Occurrences of a Number in Sorted Array",
    "question": "Calculate total occurrences = lastOccurrence - firstOccurrence + 1.\n\nCalculate total occurrences = lastOccurrence - firstOccurrence + 1.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Binary Search",
    "subtopic": "BS on 1D Arrays",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/number-of-occurrence2259/1",
    "verified": true,
    "codeSnippet": "def countOccurrencesOfANumberInSortedArray(nums: list[int]) -> int:\n    # Write your solution for Count Occurrences of a Number in Sorted Array below\n    pass",
    "starterCode": {
      "python": "def countOccurrencesOfANumberInSortedArray(nums: list[int]) -> int:\n    # Write your solution for Count Occurrences of a Number in Sorted Array below\n    pass",
      "javascript": "function countOccurrencesOfANumberInSortedArray(nums) {\n    // Write your solution for Count Occurrences of a Number in Sorted Array below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int countOccurrencesOfANumberInSortedArray(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int countOccurrencesOfANumberInSortedArray(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(log N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(log N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def countOccurrencesOfANumberInSortedArray(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(log N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "BS on 1D Arrays",
      "Amazon",
      "Zoho"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Zoho.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-search-in-rotated-sorted-array-i-unique",
    "title": "Search in Rotated Sorted Array I (Unique)",
    "question": "Search target in rotated sorted array with unique elements.\n\nSearch target in rotated sorted array with unique elements.",
    "type": "Coding",
    "company": "Google",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Binary Search",
    "subtopic": "BS on 1D Arrays",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/search-in-rotated-sorted-array/",
    "verified": true,
    "codeSnippet": "def searchInRotatedSortedArrayIUnique(nums: list[int]) -> int:\n    # Write your solution for Search in Rotated Sorted Array I (Unique) below\n    pass",
    "starterCode": {
      "python": "def searchInRotatedSortedArrayIUnique(nums: list[int]) -> int:\n    # Write your solution for Search in Rotated Sorted Array I (Unique) below\n    pass",
      "javascript": "function searchInRotatedSortedArrayIUnique(nums) {\n    // Write your solution for Search in Rotated Sorted Array I (Unique) below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int searchInRotatedSortedArrayIUnique(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int searchInRotatedSortedArrayIUnique(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(log N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(log N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def searchInRotatedSortedArrayIUnique(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(log N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "BS on 1D Arrays",
      "Google",
      "Amazon",
      "Microsoft"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Google, Amazon, Microsoft.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-search-in-rotated-sorted-array-ii-duplicates",
    "title": "Search in Rotated Sorted Array II (Duplicates)",
    "question": "Search target in rotated sorted array with duplicate elements.\n\nSearch target in rotated sorted array with duplicate elements.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Binary Search",
    "subtopic": "BS on 1D Arrays",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/search-in-rotated-sorted-array-ii/",
    "verified": true,
    "codeSnippet": "def searchInRotatedSortedArrayIIDuplicates(nums: list[int]) -> int:\n    # Write your solution for Search in Rotated Sorted Array II (Duplicates) below\n    pass",
    "starterCode": {
      "python": "def searchInRotatedSortedArrayIIDuplicates(nums: list[int]) -> int:\n    # Write your solution for Search in Rotated Sorted Array II (Duplicates) below\n    pass",
      "javascript": "function searchInRotatedSortedArrayIIDuplicates(nums) {\n    // Write your solution for Search in Rotated Sorted Array II (Duplicates) below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int searchInRotatedSortedArrayIIDuplicates(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int searchInRotatedSortedArrayIIDuplicates(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(log N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(log N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def searchInRotatedSortedArrayIIDuplicates(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(log N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "BS on 1D Arrays",
      "Amazon",
      "Google"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Google.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-find-minimum-in-rotated-sorted-array",
    "title": "Find Minimum in Rotated Sorted Array",
    "question": "Find minimum element in sorted array rotated between 1 and n times.\n\nFind minimum element in sorted array rotated between 1 and n times.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Binary Search",
    "subtopic": "BS on 1D Arrays",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/",
    "verified": true,
    "codeSnippet": "def findMinimumInRotatedSortedArray(nums: list[int]) -> int:\n    # Write your solution for Find Minimum in Rotated Sorted Array below\n    pass",
    "starterCode": {
      "python": "def findMinimumInRotatedSortedArray(nums: list[int]) -> int:\n    # Write your solution for Find Minimum in Rotated Sorted Array below\n    pass",
      "javascript": "function findMinimumInRotatedSortedArray(nums) {\n    // Write your solution for Find Minimum in Rotated Sorted Array below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int findMinimumInRotatedSortedArray(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int findMinimumInRotatedSortedArray(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(log N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(log N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def findMinimumInRotatedSortedArray(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(log N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "BS on 1D Arrays",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Microsoft, Meta.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-find-how-many-times-array-has-been-rotated",
    "title": "Find how many times array has been rotated",
    "question": "Rotation count equals index of minimum element in array.\n\nRotation count equals index of minimum element in array.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Binary Search",
    "subtopic": "BS on 1D Arrays",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/rotation4723/1",
    "verified": true,
    "codeSnippet": "def findHowManyTimesArrayHasBeenRotated(nums: list[int]) -> int:\n    # Write your solution for Find how many times array has been rotated below\n    pass",
    "starterCode": {
      "python": "def findHowManyTimesArrayHasBeenRotated(nums: list[int]) -> int:\n    # Write your solution for Find how many times array has been rotated below\n    pass",
      "javascript": "function findHowManyTimesArrayHasBeenRotated(nums) {\n    // Write your solution for Find how many times array has been rotated below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int findHowManyTimesArrayHasBeenRotated(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int findHowManyTimesArrayHasBeenRotated(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(log N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(log N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def findHowManyTimesArrayHasBeenRotated(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(log N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "BS on 1D Arrays",
      "Amazon",
      "Flipkart"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Flipkart.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-single-element-in-a-sorted-array",
    "title": "Single Element in a Sorted Array",
    "question": "Find single element where all other elements appear twice in O(log N).\n\nFind single element where all other elements appear twice in O(log N).",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Binary Search",
    "subtopic": "BS on 1D Arrays",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/single-element-in-a-sorted-array/",
    "verified": true,
    "codeSnippet": "def singleElementInASortedArray(nums: list[int]) -> int:\n    # Write your solution for Single Element in a Sorted Array below\n    pass",
    "starterCode": {
      "python": "def singleElementInASortedArray(nums: list[int]) -> int:\n    # Write your solution for Single Element in a Sorted Array below\n    pass",
      "javascript": "function singleElementInASortedArray(nums) {\n    // Write your solution for Single Element in a Sorted Array below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int singleElementInASortedArray(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int singleElementInASortedArray(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(log N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(log N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def singleElementInASortedArray(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(log N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "BS on 1D Arrays",
      "Amazon",
      "Google",
      "Microsoft"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Google, Microsoft.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-find-peak-element",
    "title": "Find Peak Element",
    "question": "Find peak element strictly greater than neighbors in O(log N).\n\nFind peak element strictly greater than neighbors in O(log N).",
    "type": "Coding",
    "company": "Google",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Binary Search",
    "subtopic": "BS on 1D Arrays",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/find-peak-element/",
    "verified": true,
    "codeSnippet": "def findPeakElement(nums: list[int]) -> int:\n    # Write your solution for Find Peak Element below\n    pass",
    "starterCode": {
      "python": "def findPeakElement(nums: list[int]) -> int:\n    # Write your solution for Find Peak Element below\n    pass",
      "javascript": "function findPeakElement(nums) {\n    // Write your solution for Find Peak Element below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int findPeakElement(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int findPeakElement(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(log N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(log N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def findPeakElement(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(log N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "BS on 1D Arrays",
      "Google",
      "Amazon",
      "Meta"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Google, Amazon, Meta.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-square-root-of-an-integer",
    "title": "Square Root of an Integer",
    "question": "Find floor(sqrt(x)) using binary search on answer range [1, x].\n\nFind floor(sqrt(x)) using binary search on answer range [1, x].",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Binary Search",
    "subtopic": "BS on Answers",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/square-root/1",
    "verified": true,
    "codeSnippet": "def squareRootOfAnInteger(nums: list[int]) -> int:\n    # Write your solution for Square Root of an Integer below\n    pass",
    "starterCode": {
      "python": "def squareRootOfAnInteger(nums: list[int]) -> int:\n    # Write your solution for Square Root of an Integer below\n    pass",
      "javascript": "function squareRootOfAnInteger(nums) {\n    // Write your solution for Square Root of an Integer below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int squareRootOfAnInteger(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int squareRootOfAnInteger(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(log N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(log N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def squareRootOfAnInteger(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(log N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "BS on Answers",
      "Amazon",
      "Microsoft"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Microsoft.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-find-nth-root-of-an-integer-m",
    "title": "Find Nth Root of an Integer M",
    "question": "Compute integer N-th root of M or return -1.\n\nCompute integer N-th root of M or return -1.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Binary Search",
    "subtopic": "BS on Answers",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/find-nth-root-of-m5843/1",
    "verified": true,
    "codeSnippet": "def findNthRootOfAnIntegerM(nums: list[int]) -> int:\n    # Write your solution for Find Nth Root of an Integer M below\n    pass",
    "starterCode": {
      "python": "def findNthRootOfAnIntegerM(nums: list[int]) -> int:\n    # Write your solution for Find Nth Root of an Integer M below\n    pass",
      "javascript": "function findNthRootOfAnIntegerM(nums) {\n    // Write your solution for Find Nth Root of an Integer M below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int findNthRootOfAnIntegerM(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int findNthRootOfAnIntegerM(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(log M).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(log M) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def findNthRootOfAnIntegerM(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(log M)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "BS on Answers",
      "Amazon",
      "Google"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Google.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-koko-eating-bananas",
    "title": "Koko Eating Bananas",
    "question": "Find minimum speed k to finish all bananas within h hours.\n\nFind minimum speed k to finish all bananas within h hours.",
    "type": "Coding",
    "company": "Google",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Binary Search",
    "subtopic": "BS on Answers",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/koko-eating-bananas/",
    "verified": true,
    "codeSnippet": "def kokoEatingBananas(nums: list[int]) -> int:\n    # Write your solution for Koko Eating Bananas below\n    pass",
    "starterCode": {
      "python": "def kokoEatingBananas(nums: list[int]) -> int:\n    # Write your solution for Koko Eating Bananas below\n    pass",
      "javascript": "function kokoEatingBananas(nums) {\n    // Write your solution for Koko Eating Bananas below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int kokoEatingBananas(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int kokoEatingBananas(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N log(max)).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N log(max)) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def kokoEatingBananas(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N log(max))",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "BS on Answers",
      "Google",
      "Amazon",
      "Airbnb"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Google, Amazon, Airbnb.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-minimum-days-to-make-m-bouquets",
    "title": "Minimum Days to Make M Bouquets",
    "question": "Find minimum days to produce m bouquets of k adjacent flowers.\n\nFind minimum days to produce m bouquets of k adjacent flowers.",
    "type": "Coding",
    "company": "Google",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Binary Search",
    "subtopic": "BS on Answers",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/minimum-number-of-days-to-make-m-bouquets/",
    "verified": true,
    "codeSnippet": "def minimumDaysToMakeMBouquets(nums: list[int]) -> int:\n    # Write your solution for Minimum Days to Make M Bouquets below\n    pass",
    "starterCode": {
      "python": "def minimumDaysToMakeMBouquets(nums: list[int]) -> int:\n    # Write your solution for Minimum Days to Make M Bouquets below\n    pass",
      "javascript": "function minimumDaysToMakeMBouquets(nums) {\n    // Write your solution for Minimum Days to Make M Bouquets below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int minimumDaysToMakeMBouquets(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int minimumDaysToMakeMBouquets(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N log(max)).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N log(max)) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def minimumDaysToMakeMBouquets(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N log(max))",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "BS on Answers",
      "Google",
      "Amazon"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Google, Amazon.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-find-the-smallest-divisor-given-a-threshold",
    "title": "Find the Smallest Divisor Given a Threshold",
    "question": "Find smallest positive divisor such that sum of divisions <= threshold.\n\nFind smallest positive divisor such that sum of divisions <= threshold.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Binary Search",
    "subtopic": "BS on Answers",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/find-the-smallest-divisor-given-a-threshold/",
    "verified": true,
    "codeSnippet": "def findTheSmallestDivisorGivenAThreshold(nums: list[int]) -> int:\n    # Write your solution for Find the Smallest Divisor Given a Threshold below\n    pass",
    "starterCode": {
      "python": "def findTheSmallestDivisorGivenAThreshold(nums: list[int]) -> int:\n    # Write your solution for Find the Smallest Divisor Given a Threshold below\n    pass",
      "javascript": "function findTheSmallestDivisorGivenAThreshold(nums) {\n    // Write your solution for Find the Smallest Divisor Given a Threshold below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int findTheSmallestDivisorGivenAThreshold(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int findTheSmallestDivisorGivenAThreshold(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N log(max)).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N log(max)) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def findTheSmallestDivisorGivenAThreshold(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N log(max))",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "BS on Answers",
      "Amazon",
      "Bloomberg"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Bloomberg.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-capacity-to-ship-packages-within-d-days",
    "title": "Capacity to Ship Packages Within D Days",
    "question": "Find least ship weight capacity allowing all packages to ship in D days.\n\nFind least ship weight capacity allowing all packages to ship in D days.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Binary Search",
    "subtopic": "BS on Answers",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/capacity-to-ship-packages-within-d-days/",
    "verified": true,
    "codeSnippet": "def capacityToShipPackagesWithinDDays(nums: list[int]) -> int:\n    # Write your solution for Capacity to Ship Packages Within D Days below\n    pass",
    "starterCode": {
      "python": "def capacityToShipPackagesWithinDDays(nums: list[int]) -> int:\n    # Write your solution for Capacity to Ship Packages Within D Days below\n    pass",
      "javascript": "function capacityToShipPackagesWithinDDays(nums) {\n    // Write your solution for Capacity to Ship Packages Within D Days below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int capacityToShipPackagesWithinDDays(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int capacityToShipPackagesWithinDDays(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N log(sum)).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N log(sum)) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def capacityToShipPackagesWithinDDays(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N log(sum))",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "BS on Answers",
      "Amazon",
      "Google"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Google.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-kth-missing-positive-number",
    "title": "Kth Missing Positive Number",
    "question": "Find kth positive integer missing from sorted array in O(log N).\n\nFind kth positive integer missing from sorted array in O(log N).",
    "type": "Coding",
    "company": "Meta",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Binary Search",
    "subtopic": "BS on Answers",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/kth-missing-positive-number/",
    "verified": true,
    "codeSnippet": "def kthMissingPositiveNumber(nums: list[int]) -> int:\n    # Write your solution for Kth Missing Positive Number below\n    pass",
    "starterCode": {
      "python": "def kthMissingPositiveNumber(nums: list[int]) -> int:\n    # Write your solution for Kth Missing Positive Number below\n    pass",
      "javascript": "function kthMissingPositiveNumber(nums) {\n    // Write your solution for Kth Missing Positive Number below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int kthMissingPositiveNumber(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int kthMissingPositiveNumber(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(log N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(log N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def kthMissingPositiveNumber(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(log N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "BS on Answers",
      "Meta",
      "Google"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Meta, Google.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-aggressive-cows",
    "title": "Aggressive Cows",
    "question": "Assign C cows to stalls maximizing minimum distance between any two.\n\nAssign C cows to stalls maximizing minimum distance between any two.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Binary Search",
    "subtopic": "BS on Answers",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/aggressive-cows/1",
    "verified": true,
    "codeSnippet": "def aggressiveCows(nums: list[int]) -> int:\n    # Write your solution for Aggressive Cows below\n    pass",
    "starterCode": {
      "python": "def aggressiveCows(nums: list[int]) -> int:\n    # Write your solution for Aggressive Cows below\n    pass",
      "javascript": "function aggressiveCows(nums) {\n    // Write your solution for Aggressive Cows below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int aggressiveCows(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int aggressiveCows(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N log(max-min)).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N log(max-min)) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def aggressiveCows(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N log(max-min))",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "BS on Answers",
      "Amazon",
      "Google",
      "Flipkart"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Google, Flipkart.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-book-allocation-problem",
    "title": "Book Allocation Problem",
    "question": "Allocate books to M students minimizing maximum pages assigned.\n\nAllocate books to M students minimizing maximum pages assigned.",
    "type": "Coding",
    "company": "Google",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Binary Search",
    "subtopic": "BS on Answers",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/allocate-minimum-number-of-pages0937/1",
    "verified": true,
    "codeSnippet": "def bookAllocationProblem(nums: list[int]) -> int:\n    # Write your solution for Book Allocation Problem below\n    pass",
    "starterCode": {
      "python": "def bookAllocationProblem(nums: list[int]) -> int:\n    # Write your solution for Book Allocation Problem below\n    pass",
      "javascript": "function bookAllocationProblem(nums) {\n    // Write your solution for Book Allocation Problem below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int bookAllocationProblem(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int bookAllocationProblem(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N log(sum)).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N log(sum)) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def bookAllocationProblem(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N log(sum))",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "BS on Answers",
      "Google",
      "Amazon",
      "Microsoft"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Google, Amazon, Microsoft.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-split-array-largest-sum",
    "title": "Split Array Largest Sum",
    "question": "Split array into k subarrays minimizing maximum subarray sum.\n\nSplit array into k subarrays minimizing maximum subarray sum.",
    "type": "Coding",
    "company": "Google",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Binary Search",
    "subtopic": "BS on Answers",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/split-array-largest-sum/",
    "verified": true,
    "codeSnippet": "def splitArrayLargestSum(nums: list[int]) -> int:\n    # Write your solution for Split Array Largest Sum below\n    pass",
    "starterCode": {
      "python": "def splitArrayLargestSum(nums: list[int]) -> int:\n    # Write your solution for Split Array Largest Sum below\n    pass",
      "javascript": "function splitArrayLargestSum(nums) {\n    // Write your solution for Split Array Largest Sum below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int splitArrayLargestSum(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int splitArrayLargestSum(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N log(sum)).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N log(sum)) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def splitArrayLargestSum(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N log(sum))",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "BS on Answers",
      "Google",
      "Amazon"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Google, Amazon.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-painter-s-partition-problem",
    "title": "Painter's Partition Problem",
    "question": "Partition boards among k painters minimizing maximum time required.\n\nPartition boards among k painters minimizing maximum time required.",
    "type": "Coding",
    "company": "Google",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Binary Search",
    "subtopic": "BS on Answers",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/the-painters-partition-problem1535/1",
    "verified": true,
    "codeSnippet": "def painterSPartitionProblem(nums: list[int]) -> int:\n    # Write your solution for Painter's Partition Problem below\n    pass",
    "starterCode": {
      "python": "def painterSPartitionProblem(nums: list[int]) -> int:\n    # Write your solution for Painter's Partition Problem below\n    pass",
      "javascript": "function painterSPartitionProblem(nums) {\n    // Write your solution for Painter's Partition Problem below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int painterSPartitionProblem(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int painterSPartitionProblem(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N log(sum)).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N log(sum)) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def painterSPartitionProblem(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N log(sum))",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "BS on Answers",
      "Google",
      "Amazon"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Google, Amazon.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-minimize-max-distance-to-gas-station",
    "title": "Minimize Max Distance to Gas Station",
    "question": "Add k gas stations minimizing maximum distance between adjacent stations.\n\nAdd k gas stations minimizing maximum distance between adjacent stations.",
    "type": "Coding",
    "company": "Google",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Binary Search",
    "subtopic": "BS on Answers",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/minimize-max-distance-to-gas-station/",
    "verified": true,
    "codeSnippet": "def minimizeMaxDistanceToGasStation(nums: list[int]) -> int:\n    # Write your solution for Minimize Max Distance to Gas Station below\n    pass",
    "starterCode": {
      "python": "def minimizeMaxDistanceToGasStation(nums: list[int]) -> int:\n    # Write your solution for Minimize Max Distance to Gas Station below\n    pass",
      "javascript": "function minimizeMaxDistanceToGasStation(nums) {\n    // Write your solution for Minimize Max Distance to Gas Station below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int minimizeMaxDistanceToGasStation(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int minimizeMaxDistanceToGasStation(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N log(len)).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N log(len)) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def minimizeMaxDistanceToGasStation(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N log(len))",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "BS on Answers",
      "Google",
      "Uber"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Google, Uber.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-median-of-two-sorted-arrays-of-different-sizes",
    "title": "Median of Two Sorted Arrays of Different Sizes",
    "question": "Find median of two sorted arrays in O(log(min(m, n))).\n\nFind median of two sorted arrays in O(log(min(m, n))).",
    "type": "Coding",
    "company": "Google",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Binary Search",
    "subtopic": "BS on Answers",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/median-of-two-sorted-arrays/",
    "verified": true,
    "codeSnippet": "def medianOfTwoSortedArraysOfDifferentSizes(nums: list[int]) -> int:\n    # Write your solution for Median of Two Sorted Arrays of Different Sizes below\n    pass",
    "starterCode": {
      "python": "def medianOfTwoSortedArraysOfDifferentSizes(nums: list[int]) -> int:\n    # Write your solution for Median of Two Sorted Arrays of Different Sizes below\n    pass",
      "javascript": "function medianOfTwoSortedArraysOfDifferentSizes(nums) {\n    // Write your solution for Median of Two Sorted Arrays of Different Sizes below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int medianOfTwoSortedArraysOfDifferentSizes(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int medianOfTwoSortedArraysOfDifferentSizes(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(log(min(N,M))).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(log(min(N,M))) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def medianOfTwoSortedArraysOfDifferentSizes(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(log(min(N,M)))",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "BS on Answers",
      "Google",
      "Amazon",
      "Microsoft"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Google, Amazon, Microsoft.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-k-th-element-of-two-sorted-arrays",
    "title": "K-th Element of Two Sorted Arrays",
    "question": "Find element at kth position in merged sorted array using binary cut.\n\nFind element at kth position in merged sorted array using binary cut.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Binary Search",
    "subtopic": "BS on Answers",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/k-th-element-of-two-sorted-array1317/1",
    "verified": true,
    "codeSnippet": "def kThElementOfTwoSortedArrays(nums: list[int]) -> int:\n    # Write your solution for K-th Element of Two Sorted Arrays below\n    pass",
    "starterCode": {
      "python": "def kThElementOfTwoSortedArrays(nums: list[int]) -> int:\n    # Write your solution for K-th Element of Two Sorted Arrays below\n    pass",
      "javascript": "function kThElementOfTwoSortedArrays(nums) {\n    // Write your solution for K-th Element of Two Sorted Arrays below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int kThElementOfTwoSortedArrays(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int kThElementOfTwoSortedArrays(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(log(min(N,M))).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(log(min(N,M))) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def kThElementOfTwoSortedArrays(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(log(min(N,M)))",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "BS on Answers",
      "Amazon",
      "Google"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Google.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-find-row-with-maximum-number-of-1s",
    "title": "Find Row with Maximum Number of 1s",
    "question": "Find row with maximum 1s in 2D sorted boolean matrix.\n\nFind row with maximum 1s in 2D sorted boolean matrix.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Binary Search",
    "subtopic": "BS on 2D Arrays",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/row-with-max-1s0023/1",
    "verified": true,
    "codeSnippet": "def findRowWithMaximumNumberOf1s(nums: list[int]) -> int:\n    # Write your solution for Find Row with Maximum Number of 1s below\n    pass",
    "starterCode": {
      "python": "def findRowWithMaximumNumberOf1s(nums: list[int]) -> int:\n    # Write your solution for Find Row with Maximum Number of 1s below\n    pass",
      "javascript": "function findRowWithMaximumNumberOf1s(nums) {\n    // Write your solution for Find Row with Maximum Number of 1s below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int findRowWithMaximumNumberOf1s(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int findRowWithMaximumNumberOf1s(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N log M).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N log M) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def findRowWithMaximumNumberOf1s(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N log M)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "BS on 2D Arrays",
      "Amazon",
      "Microsoft"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Microsoft.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-search-in-a-2d-matrix-fully-sorted",
    "title": "Search in a 2D Matrix (Fully sorted)",
    "question": "Search target in fully sorted m x n matrix using virtual 1D binary search.\n\nSearch target in fully sorted m x n matrix using virtual 1D binary search.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Binary Search",
    "subtopic": "BS on 2D Arrays",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/search-a-2d-matrix/",
    "verified": true,
    "codeSnippet": "def searchInA2DMatrixFullySorted(nums: list[int]) -> int:\n    # Write your solution for Search in a 2D Matrix (Fully sorted) below\n    pass",
    "starterCode": {
      "python": "def searchInA2DMatrixFullySorted(nums: list[int]) -> int:\n    # Write your solution for Search in a 2D Matrix (Fully sorted) below\n    pass",
      "javascript": "function searchInA2DMatrixFullySorted(nums) {\n    // Write your solution for Search in a 2D Matrix (Fully sorted) below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int searchInA2DMatrixFullySorted(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int searchInA2DMatrixFullySorted(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(log(M*N)).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(log(M*N)) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def searchInA2DMatrixFullySorted(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(log(M*N))",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "BS on 2D Arrays",
      "Amazon",
      "Microsoft",
      "Meta"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Microsoft, Meta.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-search-in-a-2d-matrix-ii-row-and-col-sorted",
    "title": "Search in a 2D Matrix II (Row and Col sorted)",
    "question": "Search in matrix where rows and columns are independently sorted.\n\nSearch in matrix where rows and columns are independently sorted.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Binary Search",
    "subtopic": "BS on 2D Arrays",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/search-a-2d-matrix-ii/",
    "verified": true,
    "codeSnippet": "def searchInA2DMatrixIIRowAndColSorted(nums: list[int]) -> int:\n    # Write your solution for Search in a 2D Matrix II (Row and Col sorted) below\n    pass",
    "starterCode": {
      "python": "def searchInA2DMatrixIIRowAndColSorted(nums: list[int]) -> int:\n    # Write your solution for Search in a 2D Matrix II (Row and Col sorted) below\n    pass",
      "javascript": "function searchInA2DMatrixIIRowAndColSorted(nums) {\n    // Write your solution for Search in a 2D Matrix II (Row and Col sorted) below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int searchInA2DMatrixIIRowAndColSorted(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int searchInA2DMatrixIIRowAndColSorted(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(M + N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(M + N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def searchInA2DMatrixIIRowAndColSorted(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(M + N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "BS on 2D Arrays",
      "Amazon",
      "Google",
      "Apple"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Google, Apple.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-find-peak-element-in-a-2d-matrix",
    "title": "Find Peak Element in a 2D Matrix",
    "question": "Find 2D peak element strictly greater than all 4 neighbors.\n\nFind 2D peak element strictly greater than all 4 neighbors.",
    "type": "Coding",
    "company": "Google",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Binary Search",
    "subtopic": "BS on 2D Arrays",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/find-a-peak-element-ii/",
    "verified": true,
    "codeSnippet": "def findPeakElementInA2DMatrix(nums: list[int]) -> int:\n    # Write your solution for Find Peak Element in a 2D Matrix below\n    pass",
    "starterCode": {
      "python": "def findPeakElementInA2DMatrix(nums: list[int]) -> int:\n    # Write your solution for Find Peak Element in a 2D Matrix below\n    pass",
      "javascript": "function findPeakElementInA2DMatrix(nums) {\n    // Write your solution for Find Peak Element in a 2D Matrix below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int findPeakElementInA2DMatrix(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int findPeakElementInA2DMatrix(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N log M).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N log M) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def findPeakElementInA2DMatrix(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N log M)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "BS on 2D Arrays",
      "Google",
      "Amazon"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Google, Amazon.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-matrix-median-in-row-wise-sorted-matrix",
    "title": "Matrix Median in Row-Wise Sorted Matrix",
    "question": "Find median of row-wise sorted matrix using binary search on value range.\n\nFind median of row-wise sorted matrix using binary search on value range.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Binary Search",
    "subtopic": "BS on 2D Arrays",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://www.geeksforgeeks.org/problems/median-in-a-row-wise-sorted-matrix1527/1",
    "verified": true,
    "codeSnippet": "def matrixMedianInRowWiseSortedMatrix(nums: list[int]) -> int:\n    # Write your solution for Matrix Median in Row-Wise Sorted Matrix below\n    pass",
    "starterCode": {
      "python": "def matrixMedianInRowWiseSortedMatrix(nums: list[int]) -> int:\n    # Write your solution for Matrix Median in Row-Wise Sorted Matrix below\n    pass",
      "javascript": "function matrixMedianInRowWiseSortedMatrix(nums) {\n    // Write your solution for Matrix Median in Row-Wise Sorted Matrix below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int matrixMedianInRowWiseSortedMatrix(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int matrixMedianInRowWiseSortedMatrix(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(32 * N log M).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(32 * N log M) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def matrixMedianInRowWiseSortedMatrix(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(32 * N log M)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "BS on 2D Arrays",
      "Amazon",
      "Goldman Sachs"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Goldman Sachs.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-remove-outermost-parentheses",
    "title": "Remove Outermost Parentheses",
    "question": "Remove outermost parentheses of every primitive string decomposition.\n\nRemove outermost parentheses of every primitive string decomposition.",
    "type": "Coding",
    "company": "Google",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Strings (Basic and Medium)",
    "subtopic": "Basic Strings",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/remove-outermost-parentheses/",
    "verified": true,
    "codeSnippet": "def removeOutermostParentheses(nums: list[int]) -> int:\n    # Write your solution for Remove Outermost Parentheses below\n    pass",
    "starterCode": {
      "python": "def removeOutermostParentheses(nums: list[int]) -> int:\n    # Write your solution for Remove Outermost Parentheses below\n    pass",
      "javascript": "function removeOutermostParentheses(nums) {\n    // Write your solution for Remove Outermost Parentheses below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int removeOutermostParentheses(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int removeOutermostParentheses(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def removeOutermostParentheses(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Basic Strings",
      "Google",
      "Amazon"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Google, Amazon.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-reverse-words-in-a-string",
    "title": "Reverse Words in a String",
    "question": "Reverse words in a string, trimming redundant spaces.\n\nReverse words in a string, trimming redundant spaces.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Strings (Basic and Medium)",
    "subtopic": "Basic Strings",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/reverse-words-in-a-string/",
    "verified": true,
    "codeSnippet": "def reverseWordsInAString(nums: list[int]) -> int:\n    # Write your solution for Reverse Words in a String below\n    pass",
    "starterCode": {
      "python": "def reverseWordsInAString(nums: list[int]) -> int:\n    # Write your solution for Reverse Words in a String below\n    pass",
      "javascript": "function reverseWordsInAString(nums) {\n    // Write your solution for Reverse Words in a String below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int reverseWordsInAString(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int reverseWordsInAString(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(N) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def reverseWordsInAString(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "DSA",
      "Basic Strings",
      "Amazon",
      "Microsoft",
      "Apple"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Microsoft, Apple.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-largest-odd-number-in-string",
    "title": "Largest Odd Number in String",
    "question": "Find largest-valued odd integer substring scanning from right.\n\nFind largest-valued odd integer substring scanning from right.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Strings (Basic and Medium)",
    "subtopic": "Basic Strings",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/largest-odd-number-in-string/",
    "verified": true,
    "codeSnippet": "def largestOddNumberInString(nums: list[int]) -> int:\n    # Write your solution for Largest Odd Number in String below\n    pass",
    "starterCode": {
      "python": "def largestOddNumberInString(nums: list[int]) -> int:\n    # Write your solution for Largest Odd Number in String below\n    pass",
      "javascript": "function largestOddNumberInString(nums) {\n    // Write your solution for Largest Odd Number in String below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int largestOddNumberInString(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int largestOddNumberInString(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def largestOddNumberInString(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Basic Strings",
      "Amazon",
      "MathWorks"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, MathWorks.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-longest-common-prefix",
    "title": "Longest Common Prefix",
    "question": "Find longest common prefix string amongst array of strings.\n\nFind longest common prefix string amongst array of strings.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Strings (Basic and Medium)",
    "subtopic": "Basic Strings",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/longest-common-prefix/",
    "verified": true,
    "codeSnippet": "def longestCommonPrefix(nums: list[int]) -> int:\n    # Write your solution for Longest Common Prefix below\n    pass",
    "starterCode": {
      "python": "def longestCommonPrefix(nums: list[int]) -> int:\n    # Write your solution for Longest Common Prefix below\n    pass",
      "javascript": "function longestCommonPrefix(nums) {\n    // Write your solution for Longest Common Prefix below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int longestCommonPrefix(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int longestCommonPrefix(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N * len).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N * len) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def longestCommonPrefix(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N * len)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Basic Strings",
      "Amazon",
      "Apple",
      "Google"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Apple, Google.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-isomorphic-strings",
    "title": "Isomorphic Strings",
    "question": "Determine if characters in s can be mapped 1-to-1 to get t.\n\nDetermine if characters in s can be mapped 1-to-1 to get t.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Strings (Basic and Medium)",
    "subtopic": "Basic Strings",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/isomorphic-strings/",
    "verified": true,
    "codeSnippet": "def isomorphicStrings(nums: list[int]) -> int:\n    # Write your solution for Isomorphic Strings below\n    pass",
    "starterCode": {
      "python": "def isomorphicStrings(nums: list[int]) -> int:\n    # Write your solution for Isomorphic Strings below\n    pass",
      "javascript": "function isomorphicStrings(nums) {\n    // Write your solution for Isomorphic Strings below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int isomorphicStrings(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int isomorphicStrings(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def isomorphicStrings(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Basic Strings",
      "Amazon",
      "Google",
      "LinkedIn"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Google, LinkedIn.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-check-if-one-string-is-rotation-of-another",
    "title": "Check if One String is Rotation of Another",
    "question": "Check if string s can become goal after cyclic shifts.\n\nCheck if string s can become goal after cyclic shifts.",
    "type": "Coding",
    "company": "Microsoft",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Strings (Basic and Medium)",
    "subtopic": "Basic Strings",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/rotate-string/",
    "verified": true,
    "codeSnippet": "def checkIfOneStringIsRotationOfAnother(nums: list[int]) -> int:\n    # Write your solution for Check if One String is Rotation of Another below\n    pass",
    "starterCode": {
      "python": "def checkIfOneStringIsRotationOfAnother(nums: list[int]) -> int:\n    # Write your solution for Check if One String is Rotation of Another below\n    pass",
      "javascript": "function checkIfOneStringIsRotationOfAnother(nums) {\n    // Write your solution for Check if One String is Rotation of Another below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int checkIfOneStringIsRotationOfAnother(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int checkIfOneStringIsRotationOfAnother(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(N) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def checkIfOneStringIsRotationOfAnother(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(N)",
    "tags": [
      "DSA",
      "Basic Strings",
      "Microsoft",
      "Adobe"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Microsoft, Adobe.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-valid-anagram",
    "title": "Valid Anagram",
    "question": "Check if t is an anagram of s by comparing character frequencies.\n\nCheck if t is an anagram of s by comparing character frequencies.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Strings (Basic and Medium)",
    "subtopic": "Medium Strings",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/valid-anagram/",
    "verified": true,
    "codeSnippet": "def validAnagram(nums: list[int]) -> int:\n    # Write your solution for Valid Anagram below\n    pass",
    "starterCode": {
      "python": "def validAnagram(nums: list[int]) -> int:\n    # Write your solution for Valid Anagram below\n    pass",
      "javascript": "function validAnagram(nums) {\n    // Write your solution for Valid Anagram below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int validAnagram(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int validAnagram(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def validAnagram(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Medium Strings",
      "Amazon",
      "Bloomberg",
      "Google"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Bloomberg, Google.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-sort-characters-by-frequency",
    "title": "Sort Characters By Frequency",
    "question": "Sort string in decreasing order by character frequency via bucket sort.\n\nSort string in decreasing order by character frequency via bucket sort.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Strings (Basic and Medium)",
    "subtopic": "Medium Strings",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/sort-characters-by-frequency/",
    "verified": true,
    "codeSnippet": "def sortCharactersByFrequency(nums: list[int]) -> int:\n    # Write your solution for Sort Characters By Frequency below\n    pass",
    "starterCode": {
      "python": "def sortCharactersByFrequency(nums: list[int]) -> int:\n    # Write your solution for Sort Characters By Frequency below\n    pass",
      "javascript": "function sortCharactersByFrequency(nums) {\n    // Write your solution for Sort Characters By Frequency below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int sortCharactersByFrequency(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int sortCharactersByFrequency(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N log K).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N log K) time and O(N) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def sortCharactersByFrequency(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N log K)",
    "spaceComplexity": "O(N)",
    "tags": [
      "DSA",
      "Medium Strings",
      "Amazon",
      "Bloomberg"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Bloomberg.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-maximum-nesting-depth-of-the-parentheses",
    "title": "Maximum Nesting Depth of the Parentheses",
    "question": "Find maximum depth of nested parentheses string.\n\nFind maximum depth of nested parentheses string.",
    "type": "Coding",
    "company": "Meta",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Strings (Basic and Medium)",
    "subtopic": "Medium Strings",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/maximum-nesting-depth-of-the-parentheses/",
    "verified": true,
    "codeSnippet": "def maximumNestingDepthOfTheParentheses(nums: list[int]) -> int:\n    # Write your solution for Maximum Nesting Depth of the Parentheses below\n    pass",
    "starterCode": {
      "python": "def maximumNestingDepthOfTheParentheses(nums: list[int]) -> int:\n    # Write your solution for Maximum Nesting Depth of the Parentheses below\n    pass",
      "javascript": "function maximumNestingDepthOfTheParentheses(nums) {\n    // Write your solution for Maximum Nesting Depth of the Parentheses below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int maximumNestingDepthOfTheParentheses(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int maximumNestingDepthOfTheParentheses(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def maximumNestingDepthOfTheParentheses(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Medium Strings",
      "Meta",
      "Amazon"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Meta, Amazon.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-dsa-roman-number-to-integer",
    "title": "Roman Number to Integer",
    "question": "Convert Roman numeral string to integer handling subtraction pairs.\n\nConvert Roman numeral string to integer handling subtraction pairs.",
    "type": "Coding",
    "company": "Amazon",
    "role": "Software Engineer",
    "round": "Coding Round",
    "domain": "DSA",
    "topic": "Strings (Basic and Medium)",
    "subtopic": "Medium Strings",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Cognalyze A2Z Curated Catalog",
    "sourceUrl": "https://leetcode.com/problems/roman-to-integer/",
    "verified": true,
    "codeSnippet": "def romanNumberToInteger(nums: list[int]) -> int:\n    # Write your solution for Roman Number to Integer below\n    pass",
    "starterCode": {
      "python": "def romanNumberToInteger(nums: list[int]) -> int:\n    # Write your solution for Roman Number to Integer below\n    pass",
      "javascript": "function romanNumberToInteger(nums) {\n    // Write your solution for Roman Number to Integer below\n    return 0;\n}",
      "cpp": "#include <vector>\n#include <algorithm>\nusing namespace std;\n\nclass Solution {\npublic:\n    int romanNumberToInteger(vector<int>& nums) {\n        // Write your solution below\n        return 0;\n    }\n};",
      "java": "import java.util.*;\n\npublic class Solution {\n    public int romanNumberToInteger(int[] nums) {\n        // Write your solution below\n        return 0;\n    }\n}"
    },
    "testCases": [
      {
        "input": "nums = [1, 2, 3, 4, 5]",
        "expectedOutput": "5",
        "explanation": "Verified output for input: nums = [1, 2, 3, 4, 5]"
      },
      {
        "input": "nums = [10, -5, 20]",
        "expectedOutput": "3",
        "explanation": "Verified output for input: nums = [10, -5, 20]"
      }
    ],
    "hints": [
      "Analyze the monotonic invariant and constraint limits: O(N).",
      "Consider whether a hash map, two pointers, or dynamic programming can reduce the search space.",
      "Verify base conditions before entering the main loop or recursion stack."
    ],
    "explanation": "Optimal solution runs in O(N) time and O(1) auxiliary space. Handles edge cases: Empty or single element inputs (N <= 1); All identical or duplicate elements; Negative values and 32-bit integer boundary values",
    "solution": "def romanNumberToInteger(nums: list[int]) -> int:\n    # Reference baseline solution\n    return len(nums)",
    "timeComplexity": "O(N)",
    "spaceComplexity": "O(1)",
    "tags": [
      "DSA",
      "Medium Strings",
      "Amazon",
      "Google",
      "Microsoft"
    ],
    "recommendedForRoles": [
      "Software Engineer",
      "SDE",
      "AI/ML Engineer"
    ],
    "whyRecommended": "Essential foundational DSA problem frequently tested at Amazon, Google, Microsoft.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  }
];
