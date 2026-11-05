/**
 * lib/skills/curriculum/subjects/data_engineering.ts
 * 
 * Data Engineering & Distributed Systems Curriculum:
 * ETL/ELT Pipeline Design, Apache Spark Distributed Processing, Shuffle Optimization,
 * Apache Kafka Streaming & Partitioning, and Dimensional Modeling.
 */

import { CanonicalSubject } from "../types";

export const DATA_ENGINEERING_SUBJECT: CanonicalSubject = {
  slug: "data_engineering",
  name: "Data Engineering & Distributed Systems",
  icon: "⚙️",
  category: "Data & Databases",
  tagline: "Batch ETL, Distributed Spark Shuffles & Kafka Event Streams",
  description: "Master enterprise data engineering: idempotent pipeline design, Apache Spark memory management, join skew remediation via salting, Kafka consumer offsets, and Lakehouse architectures.",
  estimatedHours: 40,
  prerequisites: ["python", "sql"],
  chapters: [
    {
      slug: "distributed-spark-and-skew",
      chapterNumber: 1,
      title: "Chapter 1: Apache Spark & Data Skew Remediation",
      description: "Diagnose straggler tasks in Spark cluster executors and remediate hot join keys using distributed salting.",
      topics: [
        {
          slug: "shuffle-and-skew-optimization",
          title: "Join Skew Remediation & Key Salting",
          summary: "Remediate uneven partition distributions where 99% of tasks finish in seconds but 1 task hangs.",
          subtopics: [
            {
              id: "de-101",
              slug: "spark-join-skew-salting",
              title: "Distributed Pipeline Optimization: Key Salting & Skew Remediation in Spark",
              subjectSlug: "data_engineering",
              chapterSlug: "distributed-spark-and-skew",
              topicSlug: "shuffle-and-skew-optimization",
              estimatedMinutes: 30,
              difficulty: "advanced",
              canonicalSkill: "data_engineering_pipelines",
              prerequisites: [],
              learningGoal: "Diagnose join skew in distributed processing frameworks and implement randomized key salting to redistribute partitions evenly across executors.",
              intuitiveStory: "Imagine grocery store checkouts where one customer arrives with 10,000 items while 20 other customers have only 2 items each. The cashier handling the 10,000 items takes 5 hours (the straggler), while all other cashiers sit idle. Salting splits that giant order across 10 cashiers simultaneously.",
              analogy: "Key salting is breaking a massive shipping container into 10 smaller boxes so 10 couriers can carry it concurrently.",
              formalConcept: "When joining two tables on a skewed key K, Spark hashes K to a single partition, sending all matching records to one executor. Salting appends a random integer [0, S-1] to K on the large table and replicates keys on the small table by S, distributing the workload across S executors.",
              mathFormula: "K_{\\text{salted}} = (K, \\text{random}(0, S - 1)), \\quad \\text{Redistribution Speedup } \\approx S",
              productionSignificance: "Without salting, black Friday transaction processing in retail data lakes fails due to executor Out-Of-Memory (OOM) crashes.",
              visualType: "sql_table",
              mermaidDiagram: `graph TD
    SkewedTable["Skewed Table: 90% of rows have user_id = 'GUEST'"] --> Salt["Append Salt: 'GUEST_0', 'GUEST_1', ..., 'GUEST_9'"]
    SmallTable["Lookup Table: 'GUEST'"] --> Explode["Replicate rows for salts 0..9"]
    Salt --> Join["Distributed Equi-Join across 10 Executors"]
    Explode --> Join
    Join --> Res["Balanced Partitioning with Zero Straggler Tasks!"]`,
              demonstrationSteps: [
                {
                  stepNumber: 1,
                  title: "Simulating Key Salting Distribution in Python",
                  explanation: "Redistributes a single hot key into 5 uniform buckets.",
                  codeOrQuery: `import random
from collections import Counter

# Simulating 1,000 skewed records for user_id = 999
hot_records = [999] * 1000
salted_keys = [f"{uid}_{random.randint(0, 4)}" for uid in hot_records]
distribution = Counter(salted_keys)
print("Salted partitions count:", len(distribution))
print("Sample bucket sizes:", list(distribution.values())[:3])`,
                  outputSummary: "5 balanced partitions each containing ~200 records rather than 1 containing 1,000."
                }
              ],
              audioNarrationScript: "In distributed cluster computing, the total execution time of a stage is determined by the slowest executor task. When a single join key contains millions of records, that one executor runs out of memory. Salting divides that single key across multiple worker nodes, restoring linear scaling.",
              coBuildSlot: {
                slotId: "de-slot-101",
                instruction: "Complete the salting function: f'{key}_{random.randint(0, num_salts - 1)}'.",
                starterSnippet: `import random\ndef salt_key(key: str, num_salts: int = 5) -> str:\n    return f"{key}_{random.randint(0, num_salts - 1)}"`,
                expectedPattern: "f[\"']\\{key\\}_\\{random\\.randint\\(0,\\s*num_salts\\s*-\\s*1\\)\\}[\"']",
                hint1: "Use an f-string: f'{key}_{random.randint(0, num_salts - 1)}'.",
                hint2: "Write: return f\"{key}_{random.randint(0, num_salts - 1)}\"",
                validationExplanation: "Correctly appends randomized salt integer to distribute partition hash."
              },
              executionEnvironment: "python_sandbox",
              starterCodeOrQuery: `import random

def salt_key(key: str, num_salts: int = 5) -> str:
    return f"{key}_{random.randint(0, num_salts - 1)}"

for _ in range(5):
    print("Salted key:", salt_key("MERCHANT_AMAZON", 5))
`,
              debugFault: {
                faultId: "de-fault-101",
                title: "Salting Only the Left Table Without Replicating the Dimension Table",
                buggyCodeOrConfig: `def apply_salting(fact_df, dim_df, salts=5):
    # Bug: Fact table has keys like 'USER_1', but dim_df still has 'USER', causing 0 join matches!
    fact_df['join_key'] = fact_df['key'].apply(lambda k: f"{k}_{random.randint(0, salts-1)}")
    return fact_df.merge(dim_df, on='join_key')`,
                correctCodeOrConfig: `def apply_salting(fact_df, dim_df, salts=5):
    fact_df['join_key'] = fact_df['key'].apply(lambda k: f"{k}_{random.randint(0, salts-1)}")
    # Must explode/replicate dimension table across all salt values 0..salts-1
    dim_rows = []
    for _, row in dim_df.iterrows():
        for s in range(salts):
            r = row.to_dict()
            r['join_key'] = f"{row['key']}_{s}"
            dim_rows.append(r)
    return fact_df.merge(pd.DataFrame(dim_rows), on='join_key')`,
                diagnosticHint: "Equi-joins fail if the lookup table doesn't contain matching salted suffixes for all random buckets.",
                explanation: "The smaller dimension table must be exploded across all salt values so any random salt finds its match."
              },
              comprehensionChecks: [
                {
                  id: "de-cc-101a",
                  question: "Why does Broadcast Hash Join eliminate data skew without needing salting?",
                  options: [
                    "Because it broadcasts the smaller table to all executors, completely bypassing the shuffle phase.",
                    "Because it converts strings to integers.",
                    "Because it requires zero memory.",
                    "Because it runs only on the master node."
                  ],
                  correctIndex: 0,
                  explanation: "When a table is small enough to broadcast (<10MB by default in Spark), each executor keeps a full copy in memory, avoiding network shuffles."
                }
              ],
              independentChallenge: {
                challengeId: "de-chal-101",
                title: "Idempotent Webhook Deduplicator",
                description: "Write an idempotent message processor process_webhook(event, processed_cache) that skips duplicate idempotency keys and updates state atomically.",
                starterCode: `def process_webhook(event: dict, cache: set, balances: dict) -> dict:
    key = event["idempotency_key"]
    if key in cache:
        return {"status": "SKIPPED_DUPLICATE", "balance": balances.get(event["user_id"], 0)}
    cache.add(key)
    balances[event["user_id"]] = balances.get(event["user_id"], 0) + event["amount"]
    return {"status": "PROCESSED", "balance": balances[event["user_id"]]}
`,
                solutionCode: `def process_webhook(event: dict, cache: set, balances: dict) -> dict:
    key = event["idempotency_key"]
    if key in cache:
        return {"status": "SKIPPED_DUPLICATE", "balance": balances.get(event["user_id"], 0)}
    cache.add(key)
    balances[event["user_id"]] = balances.get(event["user_id"], 0) + event["amount"]
    return {"status": "PROCESSED", "balance": balances[event["user_id"]]}
`,
                testCases: [
                  {
                    input: "event with key 'idem_1' delivered twice",
                    expectedOutput: "First: PROCESSED, Second: SKIPPED_DUPLICATE",
                    description: "Guarantees zero double-crediting under network retries."
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

