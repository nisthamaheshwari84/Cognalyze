/**
 * lib/skills/curriculum/subjects/pandas.ts
 * 
 * Pandas Tabular Data Manipulation Curriculum:
 * Series, DataFrames, Indexing, Vectorized Transformations, GroupBy Split-Apply-Combine,
 * Merging, Reshaping, Missing Data Imputation, and Memory Optimization.
 */

import { CanonicalSubject } from "../types";

export const PANDAS_SUBJECT: CanonicalSubject = {
  slug: "pandas",
  name: "Pandas & Production Data Wrangling",
  icon: "🐼",
  category: "Programming & Data Stack",
  tagline: "High-Performance DataFrames, Multi-Indexing & Split-Apply-Combine",
  description: "Master tabular transformations, relational joins, temporal windowing, categorical encodings, memory reduction, and scalable aggregations.",
  estimatedHours: 30,
  prerequisites: ["python", "numpy"],
  chapters: [
    {
      slug: "pandas-fundamentals",
      chapterNumber: 1,
      title: "Chapter 1: Series, DataFrames & Alignment",
      description: "Understand Series and DataFrame structures, explicit vs integer indexing (.loc vs .iloc), and automatic index alignment.",
      topics: [
        {
          slug: "indexing-and-selection",
          title: "Explicit Label Indexing (.loc) vs Position (.iloc)",
          summary: "Master bulletproof data selection without the dreaded SettingWithCopyWarning.",
          subtopics: [
            {
              id: "pd-101",
              slug: "loc-iloc-and-setting-with-copy",
              title: "Deterministic Selection: .loc vs .iloc & Eliminating SettingWithCopyWarning",
              subjectSlug: "pandas",
              chapterSlug: "pandas-fundamentals",
              topicSlug: "indexing-and-selection",
              estimatedMinutes: 25,
              difficulty: "beginner",
              canonicalSkill: "python_data_stack",
              prerequisites: [],
              learningGoal: "Differentiate label-based .loc from position-based .iloc, and use chained indexing safely without producing view-vs-copy ambiguities.",
              intuitiveStory: "Imagine looking up a library book either by its official catalog call number ('QA76.73') or by its physical position on the shelf ('Shelf 3, Book 4'). Label indexing uses the catalog; integer indexing counts shelves.",
              analogy: ".loc is calling people by their registered names; .iloc is calling people by where they sit in a row.",
              formalConcept: ".loc indexes by explicit row/column labels (endpoint inclusive); .iloc indexes by 0-based integer positions (endpoint exclusive). Chained indexing like df[cond]['col'] = val causes SettingWithCopyWarning because Pandas cannot guarantee if it mutates a view or a copy.",
              productionSignificance: "Chained indexing silently fails to write updates to the parent DataFrame in production pipelines, creating undetected data corruption.",
              visualType: "dataframe",
              mermaidDiagram: `graph TD
    DF["DataFrame: df"]
    Chained["Chained: df[df.age > 30]['salary'] = 100k<br/>WARNING: View vs Copy ambiguity!"]
    Safe["Deterministic: df.loc[df.age > 30, 'salary'] = 100k<br/>Guaranteed in-place update"]
    DF --> Chained
    DF --> Safe`,
              demonstrationSteps: [
                {
                  stepNumber: 1,
                  title: "Label vs Integer Position Selection",
                  explanation: ".loc includes the slice stop label; .iloc excludes the integer stop boundary.",
                  codeOrQuery: `import pandas as pd
data = {"revenue": [120, 250, 410], "cost": [80, 150, 200]}
df = pd.DataFrame(data, index=["Q1", "Q2", "Q3"])
print("Label index Q1:Q2 (inclusive):\\n", df.loc["Q1":"Q2", "revenue"])
print("Positional index 0:2 (exclusive):\\n", df.iloc[0:2, 0])`,
                  outputSummary: "Q1: 120, Q2: 250 for both operations."
                }
              ],
              audioNarrationScript: "Always use .loc or .iloc when assigning values in a Pandas DataFrame. Chained bracket notation creates a temporary intermediate object that might be a copy, discarding your updates. With .loc, you specify rows and columns in a single atomic call.",
              coBuildSlot: {
                slotId: "pd-slot-101",
                instruction: "Complete the statement to update the 'status' column to 'VIP' for users with 'spend' > 1000 using .loc.",
                starterSnippet: `import pandas as pd\ndef flag_vip(df: pd.DataFrame) -> pd.DataFrame:\n    df.loc[df['spend'] > 1000, 'status'] = 'VIP'\n    return df`,
                expectedPattern: "df\\.loc\\[\\s*df\\[['\"]spend['\"]\\]\\s*>\\s*1000\\s*,\\s*['\"]status['\"]\\]\\s*=\\s*['\"]VIP['\"]",
                hint1: "Use df.loc[condition, 'column_name'] = value.",
                hint2: "Write: df.loc[df['spend'] > 1000, 'status'] = 'VIP'",
                validationExplanation: "Correctly updates DataFrame in place without chained indexing."
              },
              executionEnvironment: "python_sandbox",
              starterCodeOrQuery: `import pandas as pd
df = pd.DataFrame({
    "user": ["Alice", "Bob", "Charlie"],
    "spend": [850, 1200, 450],
    "status": ["Standard", "Standard", "Standard"]
})
df.loc[df['spend'] > 1000, 'status'] = 'VIP'
print(df)
`,
              debugFault: {
                faultId: "pd-fault-101",
                title: "SettingWithCopyWarning via Chained Indexing",
                buggyCodeOrConfig: `import pandas as pd
def grant_bonus(df: pd.DataFrame) -> pd.DataFrame:
    # Bug: Chained indexing triggers SettingWithCopyWarning and fails to update parent
    high_perf = df[df['score'] > 90]
    high_perf['bonus'] = 5000
    return df`,
                correctCodeOrConfig: `import pandas as pd
def grant_bonus(df: pd.DataFrame) -> pd.DataFrame:
    df.loc[df['score'] > 90, 'bonus'] = 5000
    return df`,
                diagnosticHint: "Use df.loc[row_condition, 'col_name'] = val instead of creating a filtered slice first.",
                explanation: ".loc updates the underlying NumPy array backing the DataFrame directly without allocating an orphaned slice."
              },
              comprehensionChecks: [
                {
                  id: "pd-cc-101a",
                  question: "If an index has labels ['a', 'b', 'c', 'd'], what does df.loc['a':'c'] return?",
                  options: [
                    "Only rows 'a' and 'b'.",
                    "Rows 'a', 'b', and 'c' (endpoint inclusive).",
                    "An error, because strings cannot be sliced.",
                    "All four rows."
                  ],
                  correctIndex: 1,
                  explanation: "Unlike Python lists, .loc label slicing is endpoint inclusive because discrete step counts are not implied."
                }
              ],
              independentChallenge: {
                challengeId: "pd-chal-101",
                title: "Clean Outlier Filter & Imputation",
                description: "Write a function clean_outliers(df, column) that caps any value higher than the 99th percentile at that 99th percentile value using .loc.",
                starterCode: `import pandas as pd
def clean_outliers(df: pd.DataFrame, col: str) -> pd.DataFrame:
    p99 = df[col].quantile(0.99)
    df.loc[df[col] > p99, col] = p99
    return df
`,
                solutionCode: `import pandas as pd
def clean_outliers(df: pd.DataFrame, col: str) -> pd.DataFrame:
    p99 = df[col].quantile(0.99)
    df.loc[df[col] > p99, col] = p99
    return df
`,
                testCases: [
                  {
                    input: "values: [10, 20, 30, 1000]",
                    expectedOutput: "max capped at 99th percentile",
                    description: "Correctly caps right-skewed distribution tail."
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
    },
    {
      slug: "pandas-aggregations",
      chapterNumber: 2,
      title: "Chapter 2: GroupBy, Split-Apply-Combine & Windowing",
      description: "Master grouped aggregations, custom transform functions, rolling window metrics, and multi-key pivots.",
      topics: [
        {
          slug: "groupby-and-transforms",
          title: "GroupBy Aggregations vs Transforms",
          summary: "Learn when to reduce dimensions with agg() and when to preserve row shapes with transform().",
          subtopics: [
            {
              id: "pd-201",
              slug: "groupby-agg-vs-transform",
              title: "Split-Apply-Combine: agg() Dimension Reduction vs transform() Broadcast",
              subjectSlug: "pandas",
              chapterSlug: "pandas-aggregations",
              topicSlug: "groupby-and-transforms",
              estimatedMinutes: 30,
              difficulty: "intermediate",
              canonicalSkill: "python_data_stack",
              prerequisites: ["loc-iloc-and-setting-with-copy"],
              learningGoal: "Utilize groupby().transform() to compute group statistics broadcasted back to the original row shape for feature engineering.",
              intuitiveStory: "In a company payroll sheet, agg() tells you the average salary for the Engineering department (one number). transform() puts that department average right next to each engineer's individual salary on all 500 employee rows so you can calculate how much they earn above or below average.",
              analogy: "agg() is a department summary report; transform() stamps the department average on each individual badge.",
              formalConcept: "The Split-Apply-Combine pattern partitions data by keys. agg() collapses each group into a single scalar value (N_groups output). transform() applies a function that returns a like-indexed Series of the same length as the input group (N_rows output).",
              mathFormula: "z_{i} = \\frac{x_i - \\mu_{g(i)}}{\\sigma_{g(i)}}, \\quad \\text{where } g(i) \\text{ is the cohort/group of sample } i",
              productionSignificance: "Essential in feature engineering: normalizing user activity relative to their own country or plan cohort prevents geographic bias.",
              visualType: "dataframe",
              mermaidDiagram: `graph TD
    Input["Input DataFrame (6 Rows)<br/>Dept, Salary"] --> Split["Split by Dept: Sales & Eng"]
    Split --> Agg["agg('mean')<br/>Returns 2 rows (1 per Dept)"]
    Split --> Trans["transform('mean')<br/>Returns 6 rows (aligned to original index)"]`,
              demonstrationSteps: [
                {
                  stepNumber: 1,
                  title: "Computing Within-Cohort Deviations",
                  explanation: "Subtracting transform('mean') from the original series calculates the offset in one vectorized step.",
                  codeOrQuery: `import pandas as pd
df = pd.DataFrame({
    "dept": ["Eng", "Eng", "Sales", "Sales"],
    "salary": [120000, 160000, 80000, 100000]
})
df["dept_avg"] = df.groupby("dept")["salary"].transform("mean")
df["diff_from_avg"] = df["salary"] - df["dept_avg"]
print(df)`,
                  outputSummary: "Eng avg is 140k (diff: -20k, +20k); Sales avg is 90k (diff: -10k, +10k)."
                }
              ],
              audioNarrationScript: "The difference between agg and transform is fundamental to data manipulation. Aggregation reduces each group to a single value, shrinking your DataFrame. Transform produces an output with the exact same number of rows as the input, letting you compare individual records against group aggregates without performing a slow self-join.",
              coBuildSlot: {
                slotId: "pd-slot-201",
                instruction: "Complete the function normalize_within_group(df, group_col, value_col) using transform to return z-scores: (val - mean) / std.",
                starterSnippet: `import pandas as pd\ndef normalize_within_group(df: pd.DataFrame, group_col: str, val_col: str) -> pd.Series:\n    g = df.groupby(group_col)[val_col]\n    return (df[val_col] - g.transform('mean')) / g.transform('std')`,
                expectedPattern: "g\\.transform\\(['\"]mean['\"]\\)",
                hint1: "Use g.transform('mean') and g.transform('std').",
                hint2: "Write: (df[val_col] - g.transform('mean')) / g.transform('std')",
                validationExplanation: "Correctly standardizes continuous metric relative to its subgroup."
              },
              executionEnvironment: "python_sandbox",
              starterCodeOrQuery: `import pandas as pd
df = pd.DataFrame({
    "store": ["A", "A", "A", "B", "B", "B"],
    "sales": [100, 150, 200, 50, 60, 70]
})
g = df.groupby("store")["sales"]
df["zscore"] = (df["sales"] - g.transform("mean")) / g.transform("std")
print(df)
`,
              debugFault: {
                faultId: "pd-fault-201",
                title: "Using agg() where transform() is needed for column assignment",
                buggyCodeOrConfig: `import pandas as pd
def add_cohort_benchmark(df: pd.DataFrame) -> pd.DataFrame:
    # Bug: agg returns fewer rows, triggering ValueError during column assignment
    df['cohort_avg'] = df.groupby('cohort')['score'].agg('mean')
    return df`,
                correctCodeOrConfig: `import pandas as pd
def add_cohort_benchmark(df: pd.DataFrame) -> pd.DataFrame:
    df['cohort_avg'] = df.groupby('cohort')['score'].transform('mean')
    return df`,
                diagnosticHint: "agg() collapses rows to length of groups; transform() matches original DataFrame row length.",
                explanation: "Assigning to a column requires a Series with matching index and row count; transform guarantees this alignment."
              },
              comprehensionChecks: [
                {
                  id: "pd-cc-201a",
                  question: "What will df.groupby('category')['price'].transform('max') return?",
                  options: [
                    "A Series containing one maximum price for each category.",
                    "A Series with the same number of rows as df, where each entry is the maximum price of its category.",
                    "A single float representing the grand maximum.",
                    "A boolean Series."
                  ],
                  correctIndex: 1,
                  explanation: "transform preserves input shape, broadcasting the category maximum back across every member row."
                }
              ],
              independentChallenge: {
                challengeId: "pd-chal-201",
                title: "Cumulative Revenue Percentage by Product Category",
                description: "Compute the cumulative percentage of revenue generated by items within each product category ordered descending by revenue.",
                starterCode: `import pandas as pd
def category_revenue_share(df: pd.DataFrame) -> pd.DataFrame:
    df = df.sort_values(by=["category", "revenue"], ascending=[True, False]).copy()
    cat_total = df.groupby("category")["revenue"].transform("sum")
    df["cat_share_pct"] = (df["revenue"] / cat_total) * 100.0
    return df
`,
                solutionCode: `import pandas as pd
def category_revenue_share(df: pd.DataFrame) -> pd.DataFrame:
    df = df.sort_values(by=["category", "revenue"], ascending=[True, False]).copy()
    cat_total = df.groupby("category")["revenue"].transform("sum")
    df["cat_share_pct"] = (df["revenue"] / cat_total) * 100.0
    return df
`,
                testCases: [
                  {
                    input: "Category 'Books' with revenues [60, 40]",
                    expectedOutput: "Shares: 60%, 40%",
                    description: "Accurately computes intra-category percentage share."
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

