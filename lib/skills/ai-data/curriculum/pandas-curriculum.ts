/**
 * lib/skills/ai-data/curriculum/pandas-curriculum.ts
 * 
 * Complete Pandas Learning Journey for Cognalyze Master Taxonomy.
 * Covers Series, DataFrames, indexing, data hygiene, GroupBy, joins, pivot tables, and EDA.
 */

import { TaxonomyTopic, TaxonomyModule } from "../master-curriculum-taxonomy";

export const PANDAS_MODULES: TaxonomyModule[] = [
  {
    id: "mod_pandas_foundations",
    trackId: "track_pandas",
    title: "Pandas Core: Series, DataFrames & Dual Indexing (loc vs iloc)",
    description: "Tabular memory representations, labeled vs integer indexing, and boolean filtering.",
    order: 1,
    topics: [
      {
        id: "pd-01-series-dataframe",
        trackId: "track_pandas",
        moduleId: "mod_pandas_foundations",
        title: "Tabular Architecture: Series, DataFrames & Memory Layouts",
        order: 1,
        estimatedMinutes: 30,
        difficulty: "beginner",
        prerequisites: ["np-01-intro-why-numpy"],
        roleRelevance: {
          data_analyst: { importance: "CRITICAL", why: "Core foundation for every single spreadsheet and SQL dataset import." },
          data_scientist: { importance: "CRITICAL", why: "Essential data container for feature exploration and statistical transformations." },
          data_engineer: { importance: "CRITICAL", why: "Crucial for batch processing and Parquet/Arrow table migrations." },
          ml_engineer: { importance: "HIGH", why: "Pre-processing tabular datasets before feeding into XGBoost or PyTorch Tabular." },
          mlops_engineer: { importance: "HIGH", why: "Drift monitoring comparisons between training and production inference feeds." },
          ai_engineer: { importance: "HIGH", why: "Structuring tabular contexts for few-shot prompt injection and evaluation." },
          genai_llm_engineer: { importance: "HIGH", why: "Extracting structured JSON outputs into standardized tabular data." },
          applied_ai_engineer: { importance: "CRITICAL", why: "Data ingestion, validation, and analytics reporting in web backends." },
        },
        learningObjectives: [
          "Understand how a `Series` combines a 1D NumPy ndarray with an explicit labeled `Index`.",
          "Learn how a `DataFrame` stores heterogeneous columns as an internal dict of homogeneous 1D array blocks (`BlockManager`).",
          "Inspect memory usage with `df.info(memory_usage='deep')` and optimize dtypes (`category`, `int32`, `float32`)."
        ],
        conceptsCovered: ["BlockManager", "Series vs DataFrame", "Index Alignment", "Categorical Dtypes", "Memory Footprint"],
        subtopics: [
          { id: "pd-01-sub-1", title: "BlockManager 2D Array Slice Architecture & Memory Profiling", order: 1, concepts: ["BlockManager", "Memory Optimization", "Categorical"] },
          { id: "pd-01-sub-2", title: "Series 1D ndarray + Index Alignment Invariants", order: 2, concepts: ["Series", "Index Alignment", "NaN Coercion"] }
        ],
        practicalOutcome: "Profile and reduce the memory consumption of a 100,000-row customer dataset by 65% through optimal dtype downcasting.",
        contextAndIntuition: {
          english: "NumPy arrays are great for homogenous numbers, but real-world data is messy: customer names (strings), birth dates (datetime), transaction amounts (float), and active flags (bool). Pandas combines the mathematical speed of NumPy with the relational flexibility of SQL tables.",
          hinglish: "NumPy sirf ek hi type ke numbers ke liye fast hai, lekin real company data mein strings, dates, floats aur booleans mixed hote hain. Pandas NumPy ki speed aur SQL ki tabular flexibility ko ek saath laata hai.",
          whyExists: "Provides relational tabular manipulation with automatic index-aligned arithmetic.",
          whatWasUsedBefore: "Lists of dicts or custom CSV parsing with slow nested loops."
        },
        deepExplanation: {
          english: "Under the hood, Pandas groups columns of the same dtype together into contiguous memory blocks managed by `BlockManager`. When you read a CSV with object columns, strings are stored as pointers to Python strings; converting high-cardinality strings to `category` dtype replaces pointers with compact integer codes pointing to a single lookup table.",
          hinglish: "Pandas andar se same type ke columns ko blocks mein group karta hai. Agar aap text columns ko `category` bana dete ho, toh Pandas memory mein baar baar lambe strings rakhne ke bajaye integer codes store karta hai, jisse memory 70% tak kam ho jati hai.",
          internalMechanics: "BlockManager managing 2D slices of homogeneous C-contiguous arrays mapped to axis labels.",
          realWorldUsage: "E-commerce customer analytics, financial stock pricing, and customer churn prediction.",
          commonMistakes: [
            "Leaving string columns as generic `object` dtype on large datasets (causes massive RAM bloat).",
            "Assuming `df['col']` creates an independent copy (it often creates a view, leading to `SettingWithCopyWarning`)."
          ]
        },
        visualDemoConfig: {
          type: "DATAFRAME_TRANSFORM",
          initialState: {
            columns: ["customer_id", "tier", "spend"],
            data: [[101, "Gold", 450.5], [102, "Silver", 120.0], [103, "Gold", 890.2]]
          }
        },
        externalResources: [
          {
            id: "res-pd-01",
            creatorOrOrg: "CampusX",
            title: "Pandas Complete Course for Data Analysis & Data Science (Series & DataFrames)",
            topicCovered: "Series, DataFrame, Indexing, and Memory Profiling",
            url: "https://www.youtube.com/watch?v=vmEHCJofslg",
            timestamp: "00:15:30",
            language: "Hinglish",
            difficulty: "beginner",
            whyRecommended: "Clear visual diagrams of Series, DataFrame columns, and index alignment.",
            lastVerified: "2026-11-10"
          },
          {
            id: "res-pd-02",
            creatorOrOrg: "Official Pandas Documentation",
            title: "10 Minutes to pandas",
            topicCovered: "Object creation, viewing data, and basic operations",
            url: "https://pandas.pydata.org/docs/user_guide/10min.html",
            language: "English",
            difficulty: "beginner",
            whyRecommended: "Authoritative quickstart for syntax and conventions.",
            lastVerified: "2026-11-10"
          }
        ],
        starterCode: `import pandas as pd\n\ndef create_customer_summary(data_dict):\n    # data_dict is {"name": [...], "age": [...], "city": [...]}\n    # Return a DataFrame with name as index and memory footprint in bytes\n    pass`,
        solutionSnippet: `import pandas as pd\n\ndef create_customer_summary(data_dict):\n    df = pd.DataFrame(data_dict).set_index("name")\n    return {\n        "dataframe": df,\n        "memory_bytes": df.memory_usage(deep=True).sum()\n    }`
      },
      {
        id: "pd-02-loc-vs-iloc",
        trackId: "track_pandas",
        moduleId: "mod_pandas_foundations",
        title: "Dual Indexing Precision: loc (Label-Based) vs iloc (Position-Based)",
        order: 2,
        estimatedMinutes: 30,
        difficulty: "intermediate",
        prerequisites: ["pd-01-series-dataframe"],
        roleRelevance: {
          data_analyst: { importance: "CRITICAL", why: "Avoids subtle bugs when slicing sales cohorts by calendar dates." },
          data_scientist: { importance: "CRITICAL", why: "Essential for train/test splitting and cross-validation index extraction." },
          data_engineer: { importance: "HIGH", why: "Correctly partitions staging tables without off-by-one errors." },
          ml_engineer: { importance: "HIGH", why: "Prevents target leakage when extracting feature matrices and labels." },
          mlops_engineer: { importance: "SUPPORTING", why: "Extracting specific alert rows from production prediction logs." },
          ai_engineer: { importance: "HIGH", why: "Slicing top-k retrieval documents from tabular search indices." },
          genai_llm_engineer: { importance: "SUPPORTING", why: "Selecting calibration examples for dynamic few-shot prompt sets." },
          applied_ai_engineer: { importance: "HIGH", why: "Precise updating of specific records without mutating other rows." },
        },
        learningObjectives: [
          "Understand the crucial distinction: `.loc` is strictly label-based (endpoint inclusive); `.iloc` is strictly integer 0-indexed (endpoint exclusive).",
          "Eliminate `SettingWithCopyWarning` by properly using `.loc[row_indexer, col_indexer] = value`.",
          "Master multi-axis conditional filtering using combined boolean masks."
        ],
        conceptsCovered: ["Label vs Position Indexing", "Endpoint Inclusion vs Exclusion", "SettingWithCopyWarning", "Chained Indexing Anti-pattern"],
        subtopics: [
          { id: "pd-02-sub-1", title: "Label (.loc) vs Integer Position (.iloc) Indexing Semantics", order: 1, concepts: [".loc", ".iloc", "Endpoint Inclusion"] },
          { id: "pd-02-sub-2", title: "SettingWithCopyWarning Elimination & In-Place Mutation", order: 2, concepts: ["Chained Indexing", "View vs Copy", "In-Place Mutation"] }
        ],
        practicalOutcome: "Perform a safe, in-place conditional salary adjustment on employee records using `.loc` without trigger warnings.",
        contextAndIntuition: {
          english: "If your DataFrame index has labels `[2020, 2021, 2022]`, what should `df[0]` mean? The row labeled 0, or the first row at position 0? Ambiguity leads to catastrophic data corruption. Pandas resolved this by introducing two explicit accessors: `.loc` (by label) and `.iloc` (by integer position).",
          hinglish: "Agar aapke DataFrame ka index year hai `[2020, 2021, 2022]`, toh `df[0]` ka kya matlab hona chahiye? Label 0 ya pehla row? Is confusion ko khatam karne ke liye Pandas ne do alag tools banaye: `.loc` label ke basis par dhoondta hai, aur `.iloc` integer position (0, 1, 2) ke basis par.",
          whyExists: "Eliminates indexing ambiguity and guarantees deterministic row/column selections.",
          whatWasUsedBefore: "Ambiguous integer-vs-label indexing in early Python data tools."
        },
        deepExplanation: {
          english: "Crucially, `.loc[1:3]` INCLUDES the row labeled 3, following dictionary-like label slicing conventions. In contrast, `.iloc[1:3]` follows standard Python slice rules (EXCLUDES index 3, selecting rows at positions 1 and 2). Chained indexing `df[mask]['col'] = 5` fails because the first bracket may return an ephemeral temporary copy, losing the mutation.",
          hinglish: "Bohot zaroori rule: `.loc[1:3]` label 3 ko INCLUDE karta hai, jabki `.iloc[1:3]` standard Python slicing ki tarah 3 ko EXCLUDE karta hai (sirf 1 aur 2 leta hai). `df[cond]['col'] = val` mat likhein kyunki wo temporary copy ko modify karta hai; hamesha `.loc[cond, 'col'] = val` use karein.",
          internalMechanics: "Direct indexing delegate mapping through IndexEngine C-level hashtable lookups.",
          realWorldUsage: "Updating customer status, extracting validation splits, and audit logging.",
          commonMistakes: [
            "Chained indexing `df[df['age'] > 30]['status'] = 'senior'` (triggers SettingWithCopyWarning; change fails silently).",
            "Forgetting that `.loc` with boolean masks requires the mask to match the DataFrame index."
          ]
        },
        visualDemoConfig: {
          type: "DATAFRAME_TRANSFORM",
          initialState: {
            rows: ["A", "B", "C", "D"],
            columns: ["score", "grade"],
            locSelection: "rows A to C (inclusive)",
            ilocSelection: "positions 0 to 2 (exclusive of 2)"
          }
        },
        externalResources: [
          {
            id: "res-pd-loc-01",
            creatorOrOrg: "CampusX",
            title: "Pandas loc vs iloc: Never Get Confused Again",
            topicCovered: "Label vs Integer Indexing, SettingWithCopyWarning fix",
            url: "https://www.youtube.com/watch?v=vmEHCJofslg",
            timestamp: "00:48:20",
            language: "Hinglish",
            difficulty: "intermediate",
            whyRecommended: "Clear visual breakdown of endpoint inclusion vs exclusion and fixing copy warnings.",
            lastVerified: "2026-11-10"
          }
        ],
        starterCode: `import pandas as pd\n\ndef update_high_earners(df):\n    # Safely increase 'salary' by 10% for employees where 'performance_score' >= 90\n    # Use .loc and return the modified DataFrame\n    pass`,
        solutionSnippet: `import pandas as pd\n\ndef update_high_earners(df):\n    df = df.copy()\n    mask = df["performance_score"] >= 90\n    df.loc[mask, "salary"] = df.loc[mask, "salary"] * 1.10\n    return df`
      }
    ]
  }
];

