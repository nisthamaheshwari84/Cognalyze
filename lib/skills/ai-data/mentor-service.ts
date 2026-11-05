/**
 * lib/skills/ai-data/mentor-service.ts
 * 
 * Socratic AI Mentor Guidance for AI, Data & Intelligence Labs.
 * Implements 4-tier progressive scaffolding:
 * - Level 1: Conceptual Framing (Statistical/Algorithmic theorem)
 * - Level 2: Structural Clue (CTE/Partition/Loop structure)
 * - Level 3: Syntax or Logic Nudge (Exact clause or formula direction)
 * - Level 4: Full Walkthrough & Reference (Marks attempt as assisted)
 */

import { getSqlChallengeBySlug } from "./sql-lab-engine";
import { getPythonChallengeBySlug } from "./python-lab-engine";

export interface MentorGuidanceRequest {
  labType: "sql" | "python" | "cohort" | "ab_testing";
  challengeSlug: string;
  hintLevel: 1 | 2 | 3 | 4;
  currentCode?: string;
}

export interface MentorGuidanceResponse {
  labType: string;
  challengeSlug: string;
  hintLevel: number;
  levelName: string;
  isAssisted: boolean;
  guidanceText: string;
  socraticQuestions: string[];
  suggestedCheckpoints: string[];
}

export function getLabMentorGuidance(req: MentorGuidanceRequest): MentorGuidanceResponse {
  const { labType, challengeSlug, hintLevel } = req;
  const isAssisted = hintLevel === 4;

  if (labType === "sql") {
    const challenge = getSqlChallengeBySlug(challengeSlug);
    if (!challenge) {
      return {
        labType,
        challengeSlug,
        hintLevel,
        levelName: "General Guidance",
        isAssisted: false,
        guidanceText: "Focus on understanding your schema first. Inspect available columns and use `SELECT * FROM table LIMIT 5;` to verify actual data shapes.",
        socraticQuestions: ["What grain does each row represent in this table?"],
        suggestedCheckpoints: ["Confirm table names", "Check date formatting"]
      };
    }

    if (hintLevel === 1) {
      return {
        labType,
        challengeSlug,
        hintLevel: 1,
        levelName: "Level 1: Conceptual Framing",
        isAssisted: false,
        guidanceText: `**Conceptual Objective:** ${challenge.summary}\n\nBefore writing SQL, clarify the business entity grain. What does one row in the output represent? Think about which aggregation dimension or window partition is required.`,
        socraticQuestions: [
          "What is the unique key of the final output rowset?",
          "Are you aggregating rows together (GROUP BY) or maintaining individual rows while computing running totals (OVER / PARTITION BY)?"
        ],
        suggestedCheckpoints: ["Identify necessary tables", "Define the output grain"]
      };
    }

    if (hintLevel === 2) {
      return {
        labType,
        challengeSlug,
        hintLevel: 2,
        levelName: "Level 2: Structural Clue",
        isAssisted: false,
        guidanceText: `**Structural Plan:**\n${challenge.hints[0] || "Decompose the problem into a Common Table Expression (CTE) to pre-aggregate first before joining."}`,
        socraticQuestions: [
          "Can you break the query into an initial CTE (`WITH stage1 AS (...)`) to simplify calculations?",
          "What columns do you need to pass from stage 1 to the outer query?"
        ],
        suggestedCheckpoints: ["Draft CTE query", "Verify intermediary column types"]
      };
    }

    if (hintLevel === 3) {
      return {
        labType,
        challengeSlug,
        hintLevel: 3,
        levelName: "Level 3: Syntax & Logic Nudge",
        isAssisted: false,
        guidanceText: `**Logic & Clause Details:**\n${challenge.hints[1] || challenge.hints[0] || "Check your window framing or grouping clauses."}\n\n*Common Pitfall:* ${challenge.commonMistakes[0] || "Check NULL handling and date parsing functions."}`,
        socraticQuestions: [
          "Are you filtering aggregated rows using HAVING instead of WHERE?",
          "Does SQLite's `strftime` format dates as string YYYY-MM or numbers?"
        ],
        suggestedCheckpoints: ["Check JOIN condition", "Verify column aliases match output specification"]
      };
    }

    // Level 4: Full Walkthrough
    return {
      labType,
      challengeSlug,
      hintLevel: 4,
      levelName: "Level 4: Full Walkthrough (Assisted)",
      isAssisted: true,
      guidanceText: `**Full Architectural Solution:**\n\n${challenge.explanation}\n\n\`\`\`sql\n${challenge.referenceSql}\n\`\`\`\n\n*Note: Using Level 4 assistance marks this attempt as assisted in your learning diagnostics.*`,
      socraticQuestions: [
        "Why is this window framing or grouping mathematically optimal here?",
        "How would this query scale on a billion-row partitioned table?"
      ],
      suggestedCheckpoints: ["Study reference SQL execution plan", "Implement and verify edge cases"]
    };
  }

  if (labType === "python") {
    const challenge = getPythonChallengeBySlug(challengeSlug);
    if (!challenge) {
      return {
        labType,
        challengeSlug,
        hintLevel,
        levelName: "Python Guidance",
        isAssisted: false,
        guidanceText: "Ensure standard Python data structures (lists, dicts, tuples) are used. Remember that external libraries like numpy/pandas are restricted in pure standard library challenges.",
        socraticQuestions: ["How can this be computed using Python built-in math and statistics modules?"],
        suggestedCheckpoints: ["Use standard library", "Handle empty inputs gracefully"]
      };
    }

    if (hintLevel === 1) {
      return {
        labType,
        challengeSlug,
        hintLevel: 1,
        levelName: "Level 1: Conceptual Framing",
        isAssisted: false,
        guidanceText: `**Algorithmic Goal:** ${challenge.summary}\n\nThink about the algorithmic complexity required ($O(N)$ vs $O(N \\log N)$). Are you calculating a point statistic, rolling accumulator, or frequency distribution?`,
        socraticQuestions: [
          "Can you solve this with a single pass through the input stream?",
          "What are the mathematical edge cases (e.g. $N=0$, $N=1$, odd vs even lengths)?"
        ],
        suggestedCheckpoints: ["Formulate the mathematical definition", "Identify edge cases"]
      };
    }

    if (hintLevel === 2) {
      return {
        labType,
        challengeSlug,
        hintLevel: 2,
        levelName: "Level 2: Structural Clue",
        isAssisted: false,
        guidanceText: `**Data Structure & Pattern:**\n${challenge.hints[0] || "Consider sorting or using a rolling sliding window deque/slice."}`,
        socraticQuestions: [
          "Should you use `collections.deque` or slice indexing `data[i - window + 1 : i + 1]`?",
          "How will you accumulate running sums without re-summing from scratch?"
        ],
        suggestedCheckpoints: ["Set up data structure", "Implement main loop"]
      };
    }

    if (hintLevel === 3) {
      return {
        labType,
        challengeSlug,
        hintLevel: 3,
        levelName: "Level 3: Syntax & Logic Nudge",
        isAssisted: false,
        guidanceText: `**Implementation Details:**\n${challenge.hints[1] || challenge.hints[0] || "Round results to 2 decimal places using `round(val, 2)`."}\n\nEnsure exact return types match the contract (e.g., float vs dict vs list).`,
        socraticQuestions: [
          "For even-length median, did you take the average of indices `n//2 - 1` and `n//2`?",
          "Are all variance formulas dividing by $N$ or $N-1$ as requested?"
        ],
        suggestedCheckpoints: ["Verify boundary indices", "Check rounding precision"]
      };
    }

    // Level 4
    return {
      labType,
      challengeSlug,
      hintLevel: 4,
      levelName: "Level 4: Full Reference Solution (Assisted)",
      isAssisted: true,
      guidanceText: `**Optimal Implementation:**\n\n${challenge.explanation}\n\n\`\`\`python\n${challenge.referenceSolution}\n\`\`\`\n\n*Note: Consulting full code marks this attempt as assisted in your assessment record.*`,
      socraticQuestions: [
        "What is the time and space complexity of this reference implementation?",
        "How would you refactor this to handle a continuous unbounded generator stream?"
      ],
      suggestedCheckpoints: ["Test against edge case inputs", "Analyze Big-O performance"]
    };
  }

  if (labType === "cohort") {
    if (hintLevel === 1) {
      return {
        labType,
        challengeSlug: "cohort_retention",
        hintLevel: 1,
        levelName: "Level 1: Cohort Foundations",
        isAssisted: false,
        guidanceText: "In retention analytics, each cohort is defined by the user's acquisition date (Month 0). Period 0 retention is always 100% because all users were active in their signup month.",
        socraticQuestions: [
          "Why does the retention matrix take a triangular shape?",
          "What is the difference between retention dropoff (Month 1 dip) vs terminal churn flattening?"
        ],
        suggestedCheckpoints: ["Inspect Month 0 baseline (100%)", "Locate Month 1 steep drop"]
      };
    }
    if (hintLevel === 2) {
      return {
        labType,
        challengeSlug: "cohort_retention",
        hintLevel: 2,
        levelName: "Level 2: Structural Retention Mechanics",
        isAssisted: false,
        guidanceText: "Look at the steepest slope in each row. Usually Month 0 to Month 1 has the steepest drop (onboarding churn), whereas subsequent months flatten out towards asymptote (core product-market fit retention).",
        socraticQuestions: [
          "Does a later cohort (e.g. 2026-03) show higher Month 1 retention than an earlier cohort (2026-01)? What does that indicate about product improvements?",
          "How does an empty cell in the bottom-right arise in cohort triangles?"
        ],
        suggestedCheckpoints: ["Compare Month 1 across cohorts", "Determine if retention curves flatten"]
      };
    }
    return {
      labType,
      challengeSlug: "cohort_retention",
      hintLevel,
      levelName: hintLevel === 3 ? "Level 3: Strategic Interpretation" : "Level 4: Comprehensive Rubric (Assisted)",
      isAssisted: hintLevel === 4,
      guidanceText: hintLevel === 3
        ? "Formulate your hypothesis: A healthy SaaS or consumer product has a retention curve that flattens asymptotically parallel to the x-axis after Month 2, proving that a core group of power users retains indefinitely."
        : "**Executive Evaluation Rubric:**\n1. Identify Month 1 dropoff as initial activation friction.\n2. Note stabilizing retention from Month 2 onwards as Product-Market Fit validation.\n3. Recommend targeted onboarding nudges and day-3 re-engagement loops to lift Month 1 retention by 5-10%.",
      socraticQuestions: [
        "What lifecycle interventions are most effective in lifting Month 1 retention vs Month 6 retention?"
      ],
      suggestedCheckpoints: ["Draft executive diagnosis", "Propose actionable onboarding intervention"]
    };
  }

  // ab_testing
  if (hintLevel === 1) {
    return {
      labType,
      challengeSlug: "ab_testing",
      hintLevel: 1,
      levelName: "Level 1: Statistical Foundations",
      isAssisted: false,
      guidanceText: "Before analyzing conversion rates, you MUST check Sample Ratio Mismatch (SRM). If traffic was configured 50/50 but the observed split deviates significantly ($\\chi^2$ p-value < 0.01), the experiment is invalid due to selection bias.",
      socraticQuestions: [
        "Why is it hazardous to celebrate a conversion rate lift if an SRM is present?",
        "What causes Sample Ratio Mismatch in real production traffic (e.g. bot filters, redirect delays, crash loops)?"
      ],
      suggestedCheckpoints: ["Inspect Chi-Square p-value", "Verify traffic split against expected ratio"]
    };
  }

  return {
    labType,
    challengeSlug: "ab_testing",
    hintLevel,
    levelName: hintLevel === 2 ? "Level 2: Statistical vs Practical Significance" : hintLevel === 3 ? "Level 3: Confidence Interval Analysis" : "Level 4: Complete Decision Rubric (Assisted)",
    isAssisted: hintLevel === 4,
    guidanceText: hintLevel === 2
      ? "Distinguish between statistical significance ($p < 0.05$) and Minimum Detectable Effect (MDE). Even if $p < 0.05$, if the 95% confidence interval spans below the business hurdle rate (e.g. +5%), rolling out may not cover infrastructure and operational costs."
      : hintLevel === 3
      ? "Examine the 95% Confidence Interval for relative uplift. Does the lower bound remain strictly above zero? Does it exceed the MDE?"
      : "**Complete Decision Framework:**\n1. If SRM $\\chi^2 p < 0.01$: Abort rollout immediately and debug allocation routing.\n2. If SRM is clean and $p < 0.05$ and CI lower bound > 0: Roll out variant if uplift exceeds business MDE.\n3. If statistically flat or negative: Reject variant and document learnings.",
    socraticQuestions: [
      "What is the risk of false positives when checking metrics daily without sample-size stopping rules?"
    ],
    suggestedCheckpoints: ["State SRM verdict", "State Z-test statistical verdict", "Issue final rollout recommendation"]
  };
}

