/**
 * lib/skills/ai-data/curriculum/data-engineering-curriculum.ts
 *
 * Complete Data Engineering Curriculum Decomposition for Cognalyze.
 * Covers: Batch vs Streaming architectures, ETL/ELT pipelines, Lakehouses,
 * PySpark distributed transformations, Airflow orchestration, and Data Quality invariants.
 */

import { TaxonomyTopic, TaxonomyModule } from "../master-curriculum-taxonomy";

export const DATA_ENGINEERING_MODULES: TaxonomyModule[] = [
  {
    id: "mod_de_architecture",
    trackId: "track_data_engineering",
    title: "Module 1: Data Lifecycle, Batch & Streaming Invariants",
    description: "Foundational data architecture: Lambda vs Kappa, bounded vs unbounded streams, and event-time watermarking.",
    order: 1,
    topics: [
      {
        id: "de-01-batch-streaming-lifecycle",
        trackId: "track_data_engineering",
        moduleId: "mod_de_architecture",
        title: "Data Lifecycle: Batch vs Streaming Paradigms & Watermarking",
        order: 1,
        estimatedMinutes: 35,
        difficulty: "intermediate",
        prerequisites: ["sql-01-joins-execution-model"],
        roleRelevance: {
          data_analyst: { importance: "HIGH", why: "Understanding whether reports reflect real-time streams or nightly batch snapshots." },
          data_scientist: { importance: "HIGH", why: "Avoiding temporal leakage by ensuring training sets respect point-in-time correctness." },
          data_engineer: { importance: "CRITICAL", why: "Core foundation for choosing Kafka event streams vs Airflow scheduled batch jobs." },
          ml_engineer: { importance: "CRITICAL", why: "Feature store ingestion pipelines must guarantee sub-minute streaming freshness." },
          mlops_engineer: { importance: "HIGH", why: "Monitoring ingestion lag, watermark skews, and streaming buffer saturation." },
          ai_engineer: { importance: "HIGH", why: "Streaming ingestion for real-time memory and semantic cache updates." },
          genai_llm_engineer: { importance: "SUPPORTING", why: "Dynamic knowledge ingestion pipelines for enterprise RAG." },
          applied_ai_engineer: { importance: "HIGH", why: "Serving predictions against real-time customer event streams." }
        },
        learningObjectives: [
          "Differentiate between Bounded Datasets (Batch) and Unbounded Event Streams (Streaming).",
          "Analyze the trade-offs of Lambda Architecture (dual batch/speed layer) vs Kappa Architecture (stream-native).",
          "Formulate Event-Time vs Processing-Time semantics and late-arriving data watermarks."
        ],
        conceptsCovered: ["Bounded vs Unbounded Data", "Lambda vs Kappa", "Event Time vs Processing Time", "Watermarking", "Windowing"],
        subtopics: [
          { id: "de-01-sub-1", title: "Event Time, Processing Time & Late-Arriving Data", order: 1, concepts: ["Event Time", "Ingestion Time", "Late Arrival"] },
          { id: "de-01-sub-2", title: "Lambda vs Kappa Architecture Trade-Offs", order: 2, concepts: ["Speed Layer", "Serving Layer", "Unified Log"] }
        ],
        practicalOutcome: "Construct a streaming watermark simulation in Python that handles out-of-order event timestamps.",
        contextAndIntuition: {
          english: "If a mobile phone goes into airplane mode during a flight and lands 5 hours later, its payment event timestamp is 5 hours old. Processing-time would mistakenly record it today; Event-time correctly reconstructs the timeline using watermarks to close the window.",
          hinglish: "Jab user flight mein hota hai aur phone network aane par 5 ghante baad event sync karta hai, toh processing time use galat order mein likh dega. Event-time watermarking us purane event ko uske asli time window mein accurately place karta hai.",
          whyExists: "Prevents temporal corruption and out-of-order mutations in distributed financial and IoT pipelines.",
          whatWasUsedBefore: "Naive batch cron jobs running midnight SQL queries that missed intra-day transactions."
        },
        deepExplanation: {
          english: "A watermark `W(t)` is a monotonically increasing timestamp asserting that no events with `timestamp < W(t)` will arrive. When a streaming engine reaches watermark `t`, it triggers window calculations and commits state to storage.",
          hinglish: "Watermark ek strictly increasing timestamp hota hai jo pipeline ko batata hai ki is time se purana koi event ab nahi aayega, jisse aggregate calculation finalize ho sake.",
          internalMechanics: "Sliding window aggregation buffer with allowed lateness thresholds and dead-letter queue routing.",
          realWorldUsage: "Uber rides matching event streaming, Stripe fraud authorization, and e-commerce cart attribution.",
          commonMistakes: [
            "Using server receipt timestamp instead of client event timestamp for fraud detection.",
            "Setting watermark tolerance to zero, dropping valid high-latency mobile telemetry."
          ]
        },
        externalResources: [
          {
            id: "res-de-watermark-01",
            creatorOrOrg: "Apache Flink & Streaming Systems Standards",
            title: "Streaming Systems: The What, Where, When, and How of Large-Scale Data Processing",
            topicCovered: "Event-time watermarks, windowing triggers, and stateful streaming guarantees",
            url: "https://www.oreilly.com/library/view/streaming-systems/9781491983867/",
            language: "English",
            difficulty: "intermediate",
            whyRecommended: "Canonical reference for streaming data architectures.",
            lastVerified: "2026-11-10"
          }
        ],
        starterCode: `def process_event_stream(events, watermark_delay_s=5):\n    # Implement watermarked event-time windowing\n    return []`,
        solutionSnippet: `def process_event_stream(events, watermark_delay_s=5):\n    events_sorted = sorted(events, key=lambda x: x["event_time"])\n    watermark = 0\n    committed = []\n    for e in events_sorted:\n        watermark = max(watermark, e["event_time"] - watermark_delay_s)\n        if e["event_time"] >= watermark:\n            committed.append(e)\n    return committed`
      }
    ]
  },
  {
    id: "mod_de_pipelines",
    trackId: "track_data_engineering",
    title: "Module 2: Resilient ETL/ELT Pipelines & Idempotency",
    description: "Designing failure-resilient data extraction, schema validation, incremental CDC, and strictly idempotent writes.",
    order: 2,
    topics: [
      {
        id: "de-02-idempotent-pipelines",
        trackId: "track_data_engineering",
        moduleId: "mod_de_pipelines",
        title: "Pipeline Resiliency: Idempotency, Dead-Letter Queues & CDC",
        order: 1,
        estimatedMinutes: 40,
        difficulty: "intermediate",
        prerequisites: ["de-01-batch-streaming-lifecycle"],
        roleRelevance: {
          data_analyst: { importance: "HIGH", why: "Ensures revenue metrics are not double-counted when failed jobs retry." },
          data_scientist: { importance: "HIGH", why: "Guarantees reproducible daily training data slices." },
          data_engineer: { importance: "CRITICAL", why: "The cornerstone principle of production pipeline engineering: f(f(x)) = f(x)." },
          ml_engineer: { importance: "CRITICAL", why: "Feature extraction jobs must produce identical feature matrices upon retry." },
          mlops_engineer: { importance: "HIGH", why: "Automating safe pipeline self-healing and backfills." },
          ai_engineer: { importance: "HIGH", why: "Safe vector database upserts during document re-indexing." },
          genai_llm_engineer: { importance: "SUPPORTING", why: "Preventing duplicate chunk embeddings in vector stores." },
          applied_ai_engineer: { importance: "HIGH", why: "Eliminating duplicate webhook side-effects in enterprise integrations." }
        },
        learningObjectives: [
          "Define Idempotency in data mutations and analyze why naive append queries corrupt data on network retries.",
          "Implement Upsert / Merge patterns using primary deterministic hashing.",
          "Design Change Data Capture (CDC) pipelines using database WAL logs."
        ],
        conceptsCovered: ["Idempotence", "MERGE / Upsert", "Change Data Capture (CDC)", "Dead Letter Queues", "Deduplication"],
        subtopics: [
          { id: "de-02-sub-1", title: "Deterministic Hashing & Upsert / Merge Invariants", order: 1, concepts: ["Primary Key Hash", "Merge Statement", "Overwriting Partition"] },
          { id: "de-02-sub-2", title: "Change Data Capture (CDC) & Debezium WAL Parsing", order: 2, concepts: ["Write-Ahead Log", "Row-Level Deltas", "Schema Evolution"] }
        ],
        practicalOutcome: "Build an idempotent upsert pipeline in Python that processes raw JSON mutations without duplicates.",
        contextAndIntuition: {
          english: "If a worker crashes 99% through an ETL job, an orchestrator like Airflow will restart it. If your write is an `INSERT`, every record is inserted twice, doubling revenue numbers. An idempotent pipeline uses deterministic UPSERT so running the job 10 times yields the exact same state as running it once.",
          hinglish: "Agar pipeline crash hone par retry hoti hai aur aap naive insert use kar rahe hain, toh duplicate rows create ho jayengi. Idempotent pipeline deterministic key ya hash use karke update karti hai jisse 1 baar run ho ya 10 baar, result hamesha consistent rehta hai.",
          whyExists: "Eliminates duplicate billing, corrupted financial records, and manual rollback emergencies.",
          whatWasUsedBefore: "Fragile scripts that required manual DB table truncation before each manual re-run."
        },
        deepExplanation: {
          english: "Mathematically, an operation `f` is idempotent if `f(f(x)) = f(x)`. In databases, this is achieved via `INSERT ... ON CONFLICT (id) DO UPDATE` or staging-table atomic partition swaps `INSERT OVERWRITE TABLE partition(date='2026-11-10')`.",
          hinglish: "Idempotent operation `f(f(x)) = f(x)` follow karta hai. Database mein ye atomic partition swap ya `ON CONFLICT DO UPDATE` se achieve hota hai taaki duplicate key conflicts safely resolve ho sakein.",
          internalMechanics: "Deterministic composite primary key hashing; atomic two-phase commit file renames in object stores (S3/GCS).",
          realWorldUsage: "Stripe transaction ledger replication, Shopify order sync, and Salesforce CRM data warehouses.",
          commonMistakes: [
            "Generating new random UUIDs during pipeline retries instead of deterministic event-content hashes.",
            "Failing to handle schema evolution when an upstream API adds unexpected null fields."
          ]
        },
        externalResources: [
          {
            id: "res-de-idempotency-01",
            creatorOrOrg: "Martin Kleppmann (Designing Data-Intensive Applications)",
            title: "Designing Data-Intensive Applications: Reliable, Scalable, and Maintainable Systems",
            topicCovered: "Idempotency, transaction logs, CDC, and distributed stream processors",
            url: "https://dataintensive.net/",
            language: "English",
            difficulty: "advanced",
            whyRecommended: "The definitive standard text for distributed data system invariants.",
            lastVerified: "2026-11-10"
          }
        ],
        starterCode: `def idempotent_upsert(existing_records, incoming_events):\n    # Merge incoming events by 'id', updating latest timestamp\n    return {}`,
        solutionSnippet: `def idempotent_upsert(existing_records, incoming_events):\n    state = dict(existing_records)\n    for ev in incoming_events:\n        eid = ev["id"]\n        if eid not in state or ev["updated_at"] >= state[eid]["updated_at"]:\n            state[eid] = ev\n    return state`
      }
    ]
  },
  {
    id: "mod_de_storage",
    trackId: "track_data_engineering",
    title: "Module 3: Storage Architectures: Lakehouses, Warehouses & Dimensional Modeling",
    description: "Star and Snowflake schemas, columnar storage (Parquet/ORC), Delta Lake / Iceberg ACID guarantees, and partition pruning.",
    order: 3,
    topics: [
      {
        id: "de-03-lakehouse-dimensional-modeling",
        trackId: "track_data_engineering",
        moduleId: "mod_de_storage",
        title: "Storage Architectures: Star Schemas, Columnar Parquet & Delta Lake",
        order: 1,
        estimatedMinutes: 45,
        difficulty: "advanced",
        prerequisites: ["de-02-idempotent-pipelines"],
        roleRelevance: {
          data_analyst: { importance: "CRITICAL", why: "Directly querying Fact and Dimension tables for business dashboards." },
          data_scientist: { importance: "CRITICAL", why: "Reading columnar Parquet slices with partition pruning for 100x faster IO." },
          data_engineer: { importance: "CRITICAL", why: "Designing storage layouts that optimize write throughput and analytical query latency." },
          ml_engineer: { importance: "CRITICAL", why: "Feature store backend tables formatted as ACID Delta/Iceberg tables." },
          mlops_engineer: { importance: "HIGH", why: "Managing table versioning, time-travel audits, and storage compaction." },
          ai_engineer: { importance: "HIGH", why: "Interfacing semantic indices with analytical lakehouse gold tables." },
          genai_llm_engineer: { importance: "HIGH", why: "Extracting structured enterprise corpora for fine-tuning sets." },
          applied_ai_engineer: { importance: "HIGH", why: "Connecting multi-modal intelligence directly to lakehouse tables." }
        },
        learningObjectives: [
          "Design Fact tables (additive, semi-additive) and Dimension tables (SCD Type 1, 2, 3) in Star Schemas.",
          "Analyze Columnar vs Row-oriented disk layouts: Why Parquet vectorization minimizes disk IO for analytical scans.",
          "Evaluate Lakehouse ACID protocols (Delta Lake, Apache Iceberg) with transaction logs and time-travel querying."
        ],
        conceptsCovered: ["Star Schema", "Fact vs Dimension", "Parquet Columnar", "ACID Lakehouse", "Time Travel", "Partition Pruning"],
        subtopics: [
          { id: "de-03-sub-1", title: "Dimensional Modeling: Facts, Dimensions & SCD Type 2", order: 1, concepts: ["Fact Table", "Surrogate Key", "SCD Type 2 History"] },
          { id: "de-03-sub-2", title: "Columnar Storage & ACID Delta Lake Transaction Logs", order: 2, concepts: ["Parquet Snappy", "Delta Log JSON", "Time-Travel Querying"] }
        ],
        practicalOutcome: "Construct a Star Schema database model with SCD Type 2 historical change tracking in Python/SQL.",
        contextAndIntuition: {
          english: "If you query average order value over 1 billion rows in a row-oriented CSV, the disk reads customer names, phone numbers, and addresses. Columnar Parquet reads ONLY the order_value column, speeding up analytical aggregate queries by 100x while compressing identical values.",
          hinglish: "Jab aap CSV ya row-based table mein query karte hain toh disk har column read karti hai. Columnar Parquet sirf usi column ko disk se scan karta hai jo SELECT mein chahiye, jisse 1 billion rows ki aggregation seconds mein complete ho jati hai.",
          whyExists: "Drastically lowers analytical cloud compute and storage costs while maintaining full transactional ACID safety.",
          whatWasUsedBefore: "Unindexed relational OLTP databases that locked up whenever analysts ran heavy reporting queries."
        },
        deepExplanation: {
          english: "Parquet stores data in Column Chunks inside Row Groups. Each chunk contains statistics (min, max, null count). Delta Lake maintains a `_delta_log/` directory containing immutable JSON commit records ensuring serializable isolation and enabling zero-copy time-travel `VERSION AS OF 12`.",
          hinglish: "Parquet chunks ke saath min/max stats save karta hai jisse irrelevant data skip ho jata hai (predicate pushdown). Delta Lake `_delta_log` ke through ACID transactions aur time-travel queries allow karta hai.",
          internalMechanics: "Predicate pushdown, dictionary encoding, run-length compression, and optimistic concurrency commit protocols.",
          realWorldUsage: "Databricks Lakehouse, Snowflake Data Cloud, and BigQuery enterprise data architectures.",
          commonMistakes: [
            "Over-partitioning tables by timestamp down to the minute, creating millions of 10KB tiny files that degrade IO.",
            "Mutating dimensions without preserving historic effective dates, corrupting prior quarter revenue reports."
          ]
        },
        externalResources: [
          {
            id: "res-de-lakehouse-01",
            creatorOrOrg: "Databricks & Apache Iceberg Community",
            title: "Delta Lake: High-Performance ACID Table Storage over Cloud Object Stores",
            topicCovered: "ACID transactions, time-travel, partition pruning, and compaction",
            url: "https://delta.io/",
            language: "English",
            difficulty: "advanced",
            whyRecommended: "Industry standard documentation for modern lakehouse architectures.",
            lastVerified: "2026-11-10"
          }
        ],
        starterCode: `def scd_type_2_update(current_dim, new_record):\n    # Implement Slowly Changing Dimension Type 2 (close old row, insert new active)\n    return []`,
        solutionSnippet: `def scd_type_2_update(current_dim, new_record):\n    updated = []\n    for row in current_dim:\n        if row["id"] == new_record["id"] and row["is_current"]:\n            row_copy = dict(row)\n            row_copy["is_current"] = False\n            row_copy["valid_to"] = new_record["effective_date"]\n            updated.append(row_copy)\n        else:\n            updated.append(row)\n    new_row = dict(new_record)\n    new_row["is_current"] = True\n    new_row["valid_to"] = "9999-12-31"\n    updated.append(new_row)\n    return updated`
      }
    ]
  }
];
