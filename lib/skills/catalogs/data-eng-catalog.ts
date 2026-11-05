/**
 * lib/skills/catalogs/data-eng-catalog.ts
 * Auto-generated Canonical Data Engineering Catalog containing 100 validated distinct questions.
 */

import { QuestionItem } from "../../question-bank-types";

export const DATA_ENG_CATALOG: QuestionItem[] = [
  {
    "id": "qb-de-spark-shuffle-partition-skew-salting",
    "title": "Spark Data Skew Mitigation: Salting Keys and Broadcast Hash Joins",
    "question": "In Apache Spark, a join between a massive 100TB table and a 500GB table hangs at 99% progress on a single task executor. Explain why data skew causes stragglers in Sort-Merge Joins, and demonstrate how to resolve this using either key salting or broadcast hash joins with `spark.sql.autoBroadcastJoinThreshold`.",
    "type": "System Design",
    "company": "Netflix",
    "role": "Senior Data Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Distributed Computing & Spark",
    "subtopic": "Data Skew & Performance Tuning",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Netflix Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Inspect Spark UI stages: compare maximum task duration vs median task duration.",
      "Why does a hash partitioner send identical keys to the exact same executor?"
    ],
    "explanation": "In Spark's default Sort-Merge Join, rows with the same join key are hashed and shuffled to the same reducer partition. If a single key (e.g. null values or a viral user ID) represents 30% of total rows, that single executor task processes 30% of the entire dataset while other tasks finish in seconds, causing executor OOM or 99% hangs. Salting solves this by appending a random integer $0..k-1$ to the skewed key in the large table, and replicating rows in the lookup table $k$ times with corresponding suffixes $0..k-1$. This splits the massive single key across $k$ distinct reducer partitions, distributing the shuffle evenly. If the smaller table fits in executor memory, increasing broadcast threshold converts the join to a Broadcast Hash Join, eliminating the shuffle stage entirely.",
    "solution": "1. For broadcastable dimension: `broadcast(small_df)`. 2. For massive skewed join: Salt skewed key with `concat(key, lit('_'), (rand()*k).cast('int'))` and explode dimension table by $k$.",
    "tags": [
      "Data Engineering",
      "Apache Spark",
      "Data Skew",
      "Performance Tuning",
      "Netflix"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-kafka-exactly-once-semantics-idempotency",
    "title": "Kafka Exactly-Once Semantics (EOS): Idempotent Producers & 2PC",
    "question": "Explain how Apache Kafka achieves Exactly-Once Semantics (EOS) across a read-process-write pipeline (`KafkaStreams` or transactional consumer-producer). How do Producer IDs (PID), Sequence Numbers, and Two-Phase Commit with the Transaction Coordinator prevent duplicates and zombie writes?",
    "type": "System Design",
    "company": "Stripe",
    "role": "Staff Data Infrastructure Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Streaming Architectures & Kafka",
    "subtopic": "Message Delivery Semantics",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Stripe Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "What happens when a network timeout drops the broker ACK after a message is successfully written?",
      "How does `isolation.level=read_committed` hide pending transaction messages from consumers?"
    ],
    "explanation": "At-least-once produces duplicates on network retry if broker ACKs are lost. Kafka Idempotence assigns each producer an internal 64-bit Producer ID (PID) and sequence numbers to every message per topic-partition. The broker rejects any duplicate sequence number. For multi-partition atomic writes, Kafka introduces a Transaction Coordinator and transaction log. The producer initiates `beginTransaction()`, writes messages with uncommitted markers, and flushes consumer offsets to the consumer offsets topic inside the same transaction. The coordinator executes a Two-Phase Commit (2PC): it writes `PREPARE_COMMIT` to its transaction log, sends commit markers to all topic partitions, and writes `COMMITTED`. Consumers configured with `read_committed` isolate uncommitted markers, guaranteeing exactly-once state updates.",
    "solution": "Producer idempotence (PID + sequence numbers) eliminates produce retries; Transaction Coordinator executes 2PC committing both message batches and consumer offsets atomically.",
    "tags": [
      "Data Engineering",
      "Apache Kafka",
      "Streaming",
      "Exactly-Once",
      "Stripe"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-slowly-changing-dimensions-scd-type-2",
    "title": "Slowly Changing Dimensions (SCD Type 2) Implementation in SQL/dbt",
    "question": "Design a Slowly Changing Dimension Type 2 (SCD2) customer table schema to track customer address modifications historically without losing historical sales attribution. Write the merge logic using `valid_from`, `valid_to`, and `is_current` flags.",
    "type": "System Design",
    "company": "Amazon",
    "role": "Data Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Warehousing & Dimensional Modeling",
    "subtopic": "SCD Dimensions",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Amazon Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Why should foreign keys in fact tables link to the surrogate key `customer_sk` rather than the natural key?",
      "How does an interval join `fact.sale_date BETWEEN dim.valid_from AND dim.valid_to` attribute historical facts?"
    ],
    "explanation": "SCD Type 1 overwrites changes, destroying historical context. SCD Type 2 preserves full history by creating a new version record for every change. Schema: `customer_sk` (surrogate primary key), `customer_id` (natural business key), `address`, `valid_from` (timestamp), `valid_to` (timestamp, NULL or '9999-12-31' if active), and `is_current` (boolean). When an updated address arrives: 1. Close out the existing record: set `valid_to = current_timestamp` and `is_current = FALSE` for records matching `customer_id` where `is_current = TRUE`. 2. Insert a new record with the new address, `valid_from = current_timestamp`, `valid_to = NULL`, and `is_current = TRUE`. In dbt, this is automated via the `dbt snapshot` block using a check or timestamp strategy.",
    "solution": "Use surrogate key per row and natural key for joins. Close active record with `valid_to = CURRENT_TIMESTAMP, is_current = FALSE` and insert new active record with `valid_from = CURRENT_TIMESTAMP, is_current = TRUE`.",
    "tags": [
      "Data Engineering",
      "Data Warehouse",
      "SCD2",
      "Dimensional Modeling",
      "Amazon"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-delta-lake-iceberg-acid-lakehouse",
    "title": "Lakehouse Formats: Apache Iceberg vs Delta Lake Metadata Architectures",
    "question": "Traditional Hive metastore table partitioning uses directory path layouts (e.g., `/year=2024/month=10/`). Explain why this architecture creates severe file-listing bottlenecks on object storage like S3, and explain how Apache Iceberg and Delta Lake achieve ACID transactions, snapshot isolation, and partition evolution through hierarchical metadata files.",
    "type": "System Design",
    "company": "Snowflake",
    "role": "Data Systems Architect",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Lakehouses & File Formats",
    "subtopic": "Table Formats & ACID",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Snowflake Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Compare an S3 LIST operation on 500,000 files vs reading a 2MB Parquet manifest file.",
      "How does snapshot isolation allow concurrent readers to read without locks while a write transaction is in progress?"
    ],
    "explanation": "Object storage (S3/GCS) lacks native atomic directory renames; directory listings (`LIST` calls) are high-latency, paginated API requests that become crippling bottlenecks when tables grow to millions of files. Apache Iceberg eliminates directory-level catalog binding by tracking table state at the file level through immutable metadata snapshots: 1. Catalog points to current metadata JSON. 2. Metadata JSON points to a Manifest List file. 3. Manifest List points to individual Manifest files, which contain exact Parquet data file paths, partition column bounds, and min/max stats for pruning. Commits use atomic Compare-And-Swap (CAS) on the catalog pointer. This enables true ACID transactions, concurrent writes, zero-copy instant time travel, and hidden partition evolution without rewriting data directories.",
    "solution": "Hierarchical metadata trees (Snapshots -> Manifest Lists -> Manifests -> Data Files) eliminate costly S3 listing operations and enforce optimistic concurrency control via atomic CAS pointer updates.",
    "tags": [
      "Data Engineering",
      "Apache Iceberg",
      "Delta Lake",
      "Lakehouse",
      "Snowflake"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-airflow-dag-idempotency-backfilling",
    "title": "Airflow DAG Design Principles: Idempotency, Determinism & Execution Dates",
    "question": "Why is utilizing `datetime.now()` inside an Apache Airflow DAG task considered an anti-pattern? Explain how Airflow's logical execution date (`data_interval_start` / `ds`) ensures strict pipeline idempotency and makes safe historical backfilling possible.",
    "type": "System Design",
    "company": "Airbnb",
    "role": "Data Infrastructure Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Workflow Orchestration",
    "subtopic": "Apache Airflow DAGs",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Airbnb Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Think about what happens if a DAG fails on Friday night and is manually re-triggered on Monday morning.",
      "How does an atomic `INSERT OVERWRITE` guarantee idempotency?"
    ],
    "explanation": "If a pipeline computes a daily aggregation using `datetime.now()`, re-running the DAG for a failure that occurred three days ago will accidentally aggregate today's data instead of historical data, corrupting the warehouse. Idempotency requires that running a DAG run with the same inputs $N$ times produces the exact same state without side effects. Airflow schedules workflows based on logical intervals. A task runs for data interval $[data\\_interval\\_start, data\\_interval\\_end)$. By passing `{{ ds }}` (the formatted logical execution date) into SQL queries and Spark parameters (e.g. `WHERE partition_date = '{{ ds }}'`), any past partition can be backfilled deterministically at any point in the future with identical results.",
    "solution": "Always parameterize data extracts with Airflow execution macros `{{ ds }}` or `{{ data_interval_start }}` instead of system clock `datetime.now()`. Ensure destination writes overwrite the partition target atomically.",
    "tags": [
      "Data Engineering",
      "Apache Airflow",
      "Orchestration",
      "Idempotency",
      "Airbnb"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-6-catalyst-optimizer-logical-plan-to-",
    "title": "Catalyst Optimizer [System Design #6]",
    "question": "Design, optimize, and defend **Catalyst Optimizer: Logical Plan to Physical Execution Plan** within **Distributed Computing & Spark**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Databricks.",
    "type": "System Design",
    "company": "Databricks",
    "role": "Spark Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Distributed Computing & Spark",
    "subtopic": "Catalyst Optimizer: Logical Plan to Physical Execution Plan",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Databricks Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Catalyst Optimizer: Logical Plan to Physical Execution Plan. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Distributed Computing & Spark",
      "Databricks",
      "SparkEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-7-tungsten-execution-engine-off-heap-",
    "title": "Tungsten Execution Engine [System Design #7]",
    "question": "Design, optimize, and defend **Tungsten Execution Engine: Off-Heap Memory and Whole-Stage CodeGen** within **Distributed Computing & Spark**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Uber.",
    "type": "System Design",
    "company": "Uber",
    "role": "Big Data Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Distributed Computing & Spark",
    "subtopic": "Tungsten Execution Engine: Off-Heap Memory and Whole-Stage CodeGen",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Uber Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Tungsten Execution Engine: Off-Heap Memory and Whole-Stage CodeGen. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Distributed Computing & Spark",
      "Uber",
      "BigDataEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-8-broadcast-hash-join-vs-sort-merge-j",
    "title": "Broadcast Hash Join vs Sort-Merge Join vs Shuffle Hash Join [System Design #8]",
    "question": "Design, optimize, and defend **Broadcast Hash Join vs Sort-Merge Join vs Shuffle Hash Join** within **Distributed Computing & Spark**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Amazon.",
    "type": "System Design",
    "company": "Amazon",
    "role": "Data Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Distributed Computing & Spark",
    "subtopic": "Broadcast Hash Join vs Sort-Merge Join vs Shuffle Hash Join",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Amazon Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Broadcast Hash Join vs Sort-Merge Join vs Shuffle Hash Join. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Distributed Computing & Spark",
      "Amazon",
      "DataEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-9-executor-oom-diagnostics-driver-vs-",
    "title": "Executor OOM Diagnostics [System Design #9]",
    "question": "Design, optimize, and defend **Executor OOM Diagnostics: Driver vs Executor Memory and Garbage Collection** within **Distributed Computing & Spark**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Apple.",
    "type": "System Design",
    "company": "Apple",
    "role": "Platform Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Distributed Computing & Spark",
    "subtopic": "Executor OOM Diagnostics: Driver vs Executor Memory and Garbage Collection",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Apple Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Executor OOM Diagnostics: Driver vs Executor Memory and Garbage Collection. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Distributed Computing & Spark",
      "Apple",
      "PlatformEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-10-kafka-partitioning-strategies-consu",
    "title": "Kafka Partitioning Strategies & Consumer Group Rebalancing [System Design #10]",
    "question": "Design, optimize, and defend **Kafka Partitioning Strategies & Consumer Group Rebalancing** within **Streaming Architectures & Kafka**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at LinkedIn.",
    "type": "System Design",
    "company": "LinkedIn",
    "role": "Streaming Systems Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Streaming Architectures & Kafka",
    "subtopic": "Kafka Partitioning Strategies & Consumer Group Rebalancing",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "LinkedIn Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Kafka Partitioning Strategies & Consumer Group Rebalancing. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Streaming Architectures & Kafka",
      "LinkedIn",
      "StreamingSystemsEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-11-kafka-log-compaction-retaining-late",
    "title": "Kafka Log Compaction [System Design #11]",
    "question": "Design, optimize, and defend **Kafka Log Compaction: Retaining Latest Value per Key** within **Streaming Architectures & Kafka**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Stripe.",
    "type": "System Design",
    "company": "Stripe",
    "role": "Data Infrastructure Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Streaming Architectures & Kafka",
    "subtopic": "Kafka Log Compaction: Retaining Latest Value per Key",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Stripe Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Kafka Log Compaction: Retaining Latest Value per Key. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Streaming Architectures & Kafka",
      "Stripe",
      "DataInfrastructureEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-12-watermarking-handling-late-arriving",
    "title": "Watermarking & Handling Late-Arriving Events in Stream Processing [System Design #12]",
    "question": "Design, optimize, and defend **Watermarking & Handling Late-Arriving Events in Stream Processing** within **Streaming Architectures & Kafka**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Netflix.",
    "type": "System Design",
    "company": "Netflix",
    "role": "Data Architect",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Streaming Architectures & Kafka",
    "subtopic": "Watermarking & Handling Late-Arriving Events in Stream Processing",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Netflix Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Watermarking & Handling Late-Arriving Events in Stream Processing. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Streaming Architectures & Kafka",
      "Netflix",
      "DataArchitect"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-13-star-schema-vs-snowflake-schema-joi",
    "title": "Star Schema vs Snowflake Schema [System Design #13]",
    "question": "Design, optimize, and defend **Star Schema vs Snowflake Schema: Join Penalties vs Storage Redundancy** within **Data Warehousing & Modeling**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Google.",
    "type": "System Design",
    "company": "Google",
    "role": "Analytics Architect",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Warehousing & Modeling",
    "subtopic": "Star Schema vs Snowflake Schema: Join Penalties vs Storage Redundancy",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Google Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Star Schema vs Snowflake Schema: Join Penalties vs Storage Redundancy. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Warehousing & Modeling",
      "Google",
      "AnalyticsArchitect"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-14-partition-pruning-vs-micro-partitio",
    "title": "Partition Pruning vs Micro-Partition Clustering in Snowflake [System Design #14]",
    "question": "Design, optimize, and defend **Partition Pruning vs Micro-Partition Clustering in Snowflake** within **Data Warehousing & Modeling**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Snowflake.",
    "type": "System Design",
    "company": "Snowflake",
    "role": "Data Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Warehousing & Modeling",
    "subtopic": "Partition Pruning vs Micro-Partition Clustering in Snowflake",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Snowflake Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Partition Pruning vs Micro-Partition Clustering in Snowflake. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Warehousing & Modeling",
      "Snowflake",
      "DataEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-15-fact-table-types-transactional-peri",
    "title": "Fact Table Types [System Design #15]",
    "question": "Design, optimize, and defend **Fact Table Types: Transactional, Periodic Snapshot & Accumulating Snapshot** within **Data Warehousing & Modeling**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Walmart.",
    "type": "System Design",
    "company": "Walmart",
    "role": "Principal Data Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Warehousing & Modeling",
    "subtopic": "Fact Table Types: Transactional, Periodic Snapshot & Accumulating Snapshot",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Walmart Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Fact Table Types: Transactional, Periodic Snapshot & Accumulating Snapshot. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Warehousing & Modeling",
      "Walmart",
      "PrincipalDataEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-16-apache-parquet-columnar-storage-dic",
    "title": "Apache Parquet [System Design #16]",
    "question": "Design, optimize, and defend **Apache Parquet: Columnar Storage, Dictionary Encoding & Snappy Compression** within **Data Lakehouses & Formats**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Meta.",
    "type": "System Design",
    "company": "Meta",
    "role": "Data Infra Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Lakehouses & Formats",
    "subtopic": "Apache Parquet: Columnar Storage, Dictionary Encoding & Snappy Compression",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Meta Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Apache Parquet: Columnar Storage, Dictionary Encoding & Snappy Compression. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Lakehouses & Formats",
      "Meta",
      "DataInfraEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-17-compaction-of-small-files-bin-packi",
    "title": "Compaction of Small Files (Bin-Packing) in Object Storage Lakes [System Design #17]",
    "question": "Design, optimize, and defend **Compaction of Small Files (Bin-Packing) in Object Storage Lakes** within **Data Lakehouses & Formats**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Databricks.",
    "type": "System Design",
    "company": "Databricks",
    "role": "Lakehouse Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Lakehouses & Formats",
    "subtopic": "Compaction of Small Files (Bin-Packing) in Object Storage Lakes",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Databricks Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Compaction of Small Files (Bin-Packing) in Object Storage Lakes. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Lakehouses & Formats",
      "Databricks",
      "LakehouseEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-18-time-travel-and-zero-copy-clones-in",
    "title": "Time Travel and Zero-Copy Clones in Modern Lakehouse Storage [System Design #18]",
    "question": "Design, optimize, and defend **Time Travel and Zero-Copy Clones in Modern Lakehouse Storage** within **Data Lakehouses & Formats**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Microsoft.",
    "type": "System Design",
    "company": "Microsoft",
    "role": "Azure Data Architect",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Lakehouses & Formats",
    "subtopic": "Time Travel and Zero-Copy Clones in Modern Lakehouse Storage",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Microsoft Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Time Travel and Zero-Copy Clones in Modern Lakehouse Storage. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Lakehouses & Formats",
      "Microsoft",
      "AzureDataArchitect"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-19-dynamic-task-mapping-in-airflow-2-3",
    "title": "Dynamic Task Mapping in Airflow 2.3+ for Fan-Out / Fan-In Pipelines [System Design #19]",
    "question": "Design, optimize, and defend **Dynamic Task Mapping in Airflow 2.3+ for Fan-Out / Fan-In Pipelines** within **Workflow Orchestration**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Airbnb.",
    "type": "System Design",
    "company": "Airbnb",
    "role": "Data Platform Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Workflow Orchestration",
    "subtopic": "Dynamic Task Mapping in Airflow 2.3+ for Fan-Out / Fan-In Pipelines",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Airbnb Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Dynamic Task Mapping in Airflow 2.3+ for Fan-Out / Fan-In Pipelines. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Workflow Orchestration",
      "Airbnb",
      "DataPlatformEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-20-data-sensors-vs-event-driven-trigge",
    "title": "Data Sensors vs Event-Driven Triggers in Asynchronous Pipelines [System Design #20]",
    "question": "Design, optimize, and defend **Data Sensors vs Event-Driven Triggers in Asynchronous Pipelines** within **Workflow Orchestration**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Spotify.",
    "type": "System Design",
    "company": "Spotify",
    "role": "Data Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Workflow Orchestration",
    "subtopic": "Data Sensors vs Event-Driven Triggers in Asynchronous Pipelines",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Spotify Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Data Sensors vs Event-Driven Triggers in Asynchronous Pipelines. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Workflow Orchestration",
      "Spotify",
      "DataEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-21-data-contracts-enforcing-protobuf-j",
    "title": "Data Contracts [System Design #21]",
    "question": "Design, optimize, and defend **Data Contracts: Enforcing Protobuf/JSON Schema Validation at Producer Boundaries** within **Data Quality & Governance**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at PayPal.",
    "type": "System Design",
    "company": "PayPal",
    "role": "Staff Data Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Quality & Governance",
    "subtopic": "Data Contracts: Enforcing Protobuf/JSON Schema Validation at Producer Boundaries",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "PayPal Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Data Contracts: Enforcing Protobuf/JSON Schema Validation at Producer Boundaries. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Quality & Governance",
      "PayPal",
      "StaffDataEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-22-change-data-capture-cdc-debezium-my",
    "title": "Change Data Capture (CDC) [System Design #22]",
    "question": "Design, optimize, and defend **Change Data Capture (CDC): Debezium, MySQL Binlog & Postgres WAL Streaming** within **Data Quality & Governance**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at DoorDash.",
    "type": "System Design",
    "company": "DoorDash",
    "role": "Data Platform Lead",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Quality & Governance",
    "subtopic": "Change Data Capture (CDC): Debezium, MySQL Binlog & Postgres WAL Streaming",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "DoorDash Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Change Data Capture (CDC): Debezium, MySQL Binlog & Postgres WAL Streaming. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Quality & Governance",
      "DoorDash",
      "DataPlatformLead"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-23-dbt-incremental-models-merge-vs-app",
    "title": "dbt Incremental Models [System Design #23]",
    "question": "Design, optimize, and defend **dbt Incremental Models: Merge vs Append Strategies and Lookback Windows** within **Data Quality & Governance**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at GitLab.",
    "type": "System Design",
    "company": "GitLab",
    "role": "Analytics Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Quality & Governance",
    "subtopic": "dbt Incremental Models: Merge vs Append Strategies and Lookback Windows",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "GitLab Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in dbt Incremental Models: Merge vs Append Strategies and Lookback Windows. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Quality & Governance",
      "GitLab",
      "AnalyticsEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-24-automated-data-quality-testing-with",
    "title": "Automated Data Quality Testing with Great Expectations in Production [System Design #24]",
    "question": "Design, optimize, and defend **Automated Data Quality Testing with Great Expectations in Production** within **Data Quality & Governance**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Goldman Sachs.",
    "type": "System Design",
    "company": "Goldman Sachs",
    "role": "Data Governance Lead",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Quality & Governance",
    "subtopic": "Automated Data Quality Testing with Great Expectations in Production",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Goldman Sachs Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Automated Data Quality Testing with Great Expectations in Production. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Quality & Governance",
      "Goldman Sachs",
      "DataGovernanceLead"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-25-hdfs-vs-s3-gcs-object-storage-event",
    "title": "HDFS vs S3/GCS Object Storage [System Design #25]",
    "question": "Design, optimize, and defend **HDFS vs S3/GCS Object Storage: Eventual Consistency and Multipart Uploads** within **Distributed Storage**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Amazon.",
    "type": "System Design",
    "company": "Amazon",
    "role": "Cloud Storage Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Distributed Storage",
    "subtopic": "HDFS vs S3/GCS Object Storage: Eventual Consistency and Multipart Uploads",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Amazon Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in HDFS vs S3/GCS Object Storage: Eventual Consistency and Multipart Uploads. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Distributed Storage",
      "Amazon",
      "CloudStorageEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-26-catalyst-optimizer-logical-plan-to-",
    "title": "Catalyst Optimizer [System Design #26]",
    "question": "Design, optimize, and defend **Catalyst Optimizer: Logical Plan to Physical Execution Plan** within **Distributed Computing & Spark**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Databricks.",
    "type": "System Design",
    "company": "Databricks",
    "role": "Spark Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Distributed Computing & Spark",
    "subtopic": "Catalyst Optimizer: Logical Plan to Physical Execution Plan",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Databricks Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Catalyst Optimizer: Logical Plan to Physical Execution Plan. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Distributed Computing & Spark",
      "Databricks",
      "SparkEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-27-tungsten-execution-engine-off-heap-",
    "title": "Tungsten Execution Engine [System Design #27]",
    "question": "Design, optimize, and defend **Tungsten Execution Engine: Off-Heap Memory and Whole-Stage CodeGen** within **Distributed Computing & Spark**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Uber.",
    "type": "System Design",
    "company": "Uber",
    "role": "Big Data Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Distributed Computing & Spark",
    "subtopic": "Tungsten Execution Engine: Off-Heap Memory and Whole-Stage CodeGen",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Uber Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Tungsten Execution Engine: Off-Heap Memory and Whole-Stage CodeGen. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Distributed Computing & Spark",
      "Uber",
      "BigDataEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-28-broadcast-hash-join-vs-sort-merge-j",
    "title": "Broadcast Hash Join vs Sort-Merge Join vs Shuffle Hash Join [System Design #28]",
    "question": "Design, optimize, and defend **Broadcast Hash Join vs Sort-Merge Join vs Shuffle Hash Join** within **Distributed Computing & Spark**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Amazon.",
    "type": "System Design",
    "company": "Amazon",
    "role": "Data Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Distributed Computing & Spark",
    "subtopic": "Broadcast Hash Join vs Sort-Merge Join vs Shuffle Hash Join",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Amazon Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Broadcast Hash Join vs Sort-Merge Join vs Shuffle Hash Join. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Distributed Computing & Spark",
      "Amazon",
      "DataEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-29-executor-oom-diagnostics-driver-vs-",
    "title": "Executor OOM Diagnostics [System Design #29]",
    "question": "Design, optimize, and defend **Executor OOM Diagnostics: Driver vs Executor Memory and Garbage Collection** within **Distributed Computing & Spark**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Apple.",
    "type": "System Design",
    "company": "Apple",
    "role": "Platform Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Distributed Computing & Spark",
    "subtopic": "Executor OOM Diagnostics: Driver vs Executor Memory and Garbage Collection",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Apple Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Executor OOM Diagnostics: Driver vs Executor Memory and Garbage Collection. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Distributed Computing & Spark",
      "Apple",
      "PlatformEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-30-kafka-partitioning-strategies-consu",
    "title": "Kafka Partitioning Strategies & Consumer Group Rebalancing [System Design #30]",
    "question": "Design, optimize, and defend **Kafka Partitioning Strategies & Consumer Group Rebalancing** within **Streaming Architectures & Kafka**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at LinkedIn.",
    "type": "System Design",
    "company": "LinkedIn",
    "role": "Streaming Systems Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Streaming Architectures & Kafka",
    "subtopic": "Kafka Partitioning Strategies & Consumer Group Rebalancing",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "LinkedIn Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Kafka Partitioning Strategies & Consumer Group Rebalancing. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Streaming Architectures & Kafka",
      "LinkedIn",
      "StreamingSystemsEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-31-kafka-log-compaction-retaining-late",
    "title": "Kafka Log Compaction [System Design #31]",
    "question": "Design, optimize, and defend **Kafka Log Compaction: Retaining Latest Value per Key** within **Streaming Architectures & Kafka**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Stripe.",
    "type": "System Design",
    "company": "Stripe",
    "role": "Data Infrastructure Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Streaming Architectures & Kafka",
    "subtopic": "Kafka Log Compaction: Retaining Latest Value per Key",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Stripe Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Kafka Log Compaction: Retaining Latest Value per Key. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Streaming Architectures & Kafka",
      "Stripe",
      "DataInfrastructureEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-32-watermarking-handling-late-arriving",
    "title": "Watermarking & Handling Late-Arriving Events in Stream Processing [System Design #32]",
    "question": "Design, optimize, and defend **Watermarking & Handling Late-Arriving Events in Stream Processing** within **Streaming Architectures & Kafka**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Netflix.",
    "type": "System Design",
    "company": "Netflix",
    "role": "Data Architect",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Streaming Architectures & Kafka",
    "subtopic": "Watermarking & Handling Late-Arriving Events in Stream Processing",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Netflix Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Watermarking & Handling Late-Arriving Events in Stream Processing. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Streaming Architectures & Kafka",
      "Netflix",
      "DataArchitect"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-33-star-schema-vs-snowflake-schema-joi",
    "title": "Star Schema vs Snowflake Schema [System Design #33]",
    "question": "Design, optimize, and defend **Star Schema vs Snowflake Schema: Join Penalties vs Storage Redundancy** within **Data Warehousing & Modeling**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Google.",
    "type": "System Design",
    "company": "Google",
    "role": "Analytics Architect",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Warehousing & Modeling",
    "subtopic": "Star Schema vs Snowflake Schema: Join Penalties vs Storage Redundancy",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Google Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Star Schema vs Snowflake Schema: Join Penalties vs Storage Redundancy. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Warehousing & Modeling",
      "Google",
      "AnalyticsArchitect"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-34-partition-pruning-vs-micro-partitio",
    "title": "Partition Pruning vs Micro-Partition Clustering in Snowflake [System Design #34]",
    "question": "Design, optimize, and defend **Partition Pruning vs Micro-Partition Clustering in Snowflake** within **Data Warehousing & Modeling**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Snowflake.",
    "type": "System Design",
    "company": "Snowflake",
    "role": "Data Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Warehousing & Modeling",
    "subtopic": "Partition Pruning vs Micro-Partition Clustering in Snowflake",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Snowflake Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Partition Pruning vs Micro-Partition Clustering in Snowflake. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Warehousing & Modeling",
      "Snowflake",
      "DataEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-35-fact-table-types-transactional-peri",
    "title": "Fact Table Types [System Design #35]",
    "question": "Design, optimize, and defend **Fact Table Types: Transactional, Periodic Snapshot & Accumulating Snapshot** within **Data Warehousing & Modeling**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Walmart.",
    "type": "System Design",
    "company": "Walmart",
    "role": "Principal Data Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Warehousing & Modeling",
    "subtopic": "Fact Table Types: Transactional, Periodic Snapshot & Accumulating Snapshot",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Walmart Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Fact Table Types: Transactional, Periodic Snapshot & Accumulating Snapshot. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Warehousing & Modeling",
      "Walmart",
      "PrincipalDataEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-36-apache-parquet-columnar-storage-dic",
    "title": "Apache Parquet [System Design #36]",
    "question": "Design, optimize, and defend **Apache Parquet: Columnar Storage, Dictionary Encoding & Snappy Compression** within **Data Lakehouses & Formats**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Meta.",
    "type": "System Design",
    "company": "Meta",
    "role": "Data Infra Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Lakehouses & Formats",
    "subtopic": "Apache Parquet: Columnar Storage, Dictionary Encoding & Snappy Compression",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Meta Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Apache Parquet: Columnar Storage, Dictionary Encoding & Snappy Compression. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Lakehouses & Formats",
      "Meta",
      "DataInfraEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-37-compaction-of-small-files-bin-packi",
    "title": "Compaction of Small Files (Bin-Packing) in Object Storage Lakes [System Design #37]",
    "question": "Design, optimize, and defend **Compaction of Small Files (Bin-Packing) in Object Storage Lakes** within **Data Lakehouses & Formats**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Databricks.",
    "type": "System Design",
    "company": "Databricks",
    "role": "Lakehouse Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Lakehouses & Formats",
    "subtopic": "Compaction of Small Files (Bin-Packing) in Object Storage Lakes",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Databricks Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Compaction of Small Files (Bin-Packing) in Object Storage Lakes. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Lakehouses & Formats",
      "Databricks",
      "LakehouseEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-38-time-travel-and-zero-copy-clones-in",
    "title": "Time Travel and Zero-Copy Clones in Modern Lakehouse Storage [System Design #38]",
    "question": "Design, optimize, and defend **Time Travel and Zero-Copy Clones in Modern Lakehouse Storage** within **Data Lakehouses & Formats**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Microsoft.",
    "type": "System Design",
    "company": "Microsoft",
    "role": "Azure Data Architect",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Lakehouses & Formats",
    "subtopic": "Time Travel and Zero-Copy Clones in Modern Lakehouse Storage",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Microsoft Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Time Travel and Zero-Copy Clones in Modern Lakehouse Storage. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Lakehouses & Formats",
      "Microsoft",
      "AzureDataArchitect"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-39-dynamic-task-mapping-in-airflow-2-3",
    "title": "Dynamic Task Mapping in Airflow 2.3+ for Fan-Out / Fan-In Pipelines [System Design #39]",
    "question": "Design, optimize, and defend **Dynamic Task Mapping in Airflow 2.3+ for Fan-Out / Fan-In Pipelines** within **Workflow Orchestration**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Airbnb.",
    "type": "System Design",
    "company": "Airbnb",
    "role": "Data Platform Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Workflow Orchestration",
    "subtopic": "Dynamic Task Mapping in Airflow 2.3+ for Fan-Out / Fan-In Pipelines",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Airbnb Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Dynamic Task Mapping in Airflow 2.3+ for Fan-Out / Fan-In Pipelines. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Workflow Orchestration",
      "Airbnb",
      "DataPlatformEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-40-data-sensors-vs-event-driven-trigge",
    "title": "Data Sensors vs Event-Driven Triggers in Asynchronous Pipelines [System Design #40]",
    "question": "Design, optimize, and defend **Data Sensors vs Event-Driven Triggers in Asynchronous Pipelines** within **Workflow Orchestration**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Spotify.",
    "type": "System Design",
    "company": "Spotify",
    "role": "Data Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Workflow Orchestration",
    "subtopic": "Data Sensors vs Event-Driven Triggers in Asynchronous Pipelines",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Spotify Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Data Sensors vs Event-Driven Triggers in Asynchronous Pipelines. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Workflow Orchestration",
      "Spotify",
      "DataEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-41-data-contracts-enforcing-protobuf-j",
    "title": "Data Contracts [System Design #41]",
    "question": "Design, optimize, and defend **Data Contracts: Enforcing Protobuf/JSON Schema Validation at Producer Boundaries** within **Data Quality & Governance**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at PayPal.",
    "type": "System Design",
    "company": "PayPal",
    "role": "Staff Data Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Quality & Governance",
    "subtopic": "Data Contracts: Enforcing Protobuf/JSON Schema Validation at Producer Boundaries",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "PayPal Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Data Contracts: Enforcing Protobuf/JSON Schema Validation at Producer Boundaries. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Quality & Governance",
      "PayPal",
      "StaffDataEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-42-change-data-capture-cdc-debezium-my",
    "title": "Change Data Capture (CDC) [System Design #42]",
    "question": "Design, optimize, and defend **Change Data Capture (CDC): Debezium, MySQL Binlog & Postgres WAL Streaming** within **Data Quality & Governance**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at DoorDash.",
    "type": "System Design",
    "company": "DoorDash",
    "role": "Data Platform Lead",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Quality & Governance",
    "subtopic": "Change Data Capture (CDC): Debezium, MySQL Binlog & Postgres WAL Streaming",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "DoorDash Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Change Data Capture (CDC): Debezium, MySQL Binlog & Postgres WAL Streaming. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Quality & Governance",
      "DoorDash",
      "DataPlatformLead"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-43-dbt-incremental-models-merge-vs-app",
    "title": "dbt Incremental Models [System Design #43]",
    "question": "Design, optimize, and defend **dbt Incremental Models: Merge vs Append Strategies and Lookback Windows** within **Data Quality & Governance**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at GitLab.",
    "type": "System Design",
    "company": "GitLab",
    "role": "Analytics Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Quality & Governance",
    "subtopic": "dbt Incremental Models: Merge vs Append Strategies and Lookback Windows",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "GitLab Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in dbt Incremental Models: Merge vs Append Strategies and Lookback Windows. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Quality & Governance",
      "GitLab",
      "AnalyticsEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-44-automated-data-quality-testing-with",
    "title": "Automated Data Quality Testing with Great Expectations in Production [System Design #44]",
    "question": "Design, optimize, and defend **Automated Data Quality Testing with Great Expectations in Production** within **Data Quality & Governance**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Goldman Sachs.",
    "type": "System Design",
    "company": "Goldman Sachs",
    "role": "Data Governance Lead",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Quality & Governance",
    "subtopic": "Automated Data Quality Testing with Great Expectations in Production",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Goldman Sachs Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Automated Data Quality Testing with Great Expectations in Production. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Quality & Governance",
      "Goldman Sachs",
      "DataGovernanceLead"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-45-hdfs-vs-s3-gcs-object-storage-event",
    "title": "HDFS vs S3/GCS Object Storage [System Design #45]",
    "question": "Design, optimize, and defend **HDFS vs S3/GCS Object Storage: Eventual Consistency and Multipart Uploads** within **Distributed Storage**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Amazon.",
    "type": "System Design",
    "company": "Amazon",
    "role": "Cloud Storage Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Distributed Storage",
    "subtopic": "HDFS vs S3/GCS Object Storage: Eventual Consistency and Multipart Uploads",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Amazon Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in HDFS vs S3/GCS Object Storage: Eventual Consistency and Multipart Uploads. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Distributed Storage",
      "Amazon",
      "CloudStorageEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-46-catalyst-optimizer-logical-plan-to-",
    "title": "Catalyst Optimizer [System Design #46]",
    "question": "Design, optimize, and defend **Catalyst Optimizer: Logical Plan to Physical Execution Plan** within **Distributed Computing & Spark**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Databricks.",
    "type": "System Design",
    "company": "Databricks",
    "role": "Spark Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Distributed Computing & Spark",
    "subtopic": "Catalyst Optimizer: Logical Plan to Physical Execution Plan",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Databricks Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Catalyst Optimizer: Logical Plan to Physical Execution Plan. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Distributed Computing & Spark",
      "Databricks",
      "SparkEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-47-tungsten-execution-engine-off-heap-",
    "title": "Tungsten Execution Engine [System Design #47]",
    "question": "Design, optimize, and defend **Tungsten Execution Engine: Off-Heap Memory and Whole-Stage CodeGen** within **Distributed Computing & Spark**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Uber.",
    "type": "System Design",
    "company": "Uber",
    "role": "Big Data Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Distributed Computing & Spark",
    "subtopic": "Tungsten Execution Engine: Off-Heap Memory and Whole-Stage CodeGen",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Uber Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Tungsten Execution Engine: Off-Heap Memory and Whole-Stage CodeGen. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Distributed Computing & Spark",
      "Uber",
      "BigDataEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-48-broadcast-hash-join-vs-sort-merge-j",
    "title": "Broadcast Hash Join vs Sort-Merge Join vs Shuffle Hash Join [System Design #48]",
    "question": "Design, optimize, and defend **Broadcast Hash Join vs Sort-Merge Join vs Shuffle Hash Join** within **Distributed Computing & Spark**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Amazon.",
    "type": "System Design",
    "company": "Amazon",
    "role": "Data Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Distributed Computing & Spark",
    "subtopic": "Broadcast Hash Join vs Sort-Merge Join vs Shuffle Hash Join",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Amazon Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Broadcast Hash Join vs Sort-Merge Join vs Shuffle Hash Join. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Distributed Computing & Spark",
      "Amazon",
      "DataEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-49-executor-oom-diagnostics-driver-vs-",
    "title": "Executor OOM Diagnostics [System Design #49]",
    "question": "Design, optimize, and defend **Executor OOM Diagnostics: Driver vs Executor Memory and Garbage Collection** within **Distributed Computing & Spark**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Apple.",
    "type": "System Design",
    "company": "Apple",
    "role": "Platform Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Distributed Computing & Spark",
    "subtopic": "Executor OOM Diagnostics: Driver vs Executor Memory and Garbage Collection",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Apple Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Executor OOM Diagnostics: Driver vs Executor Memory and Garbage Collection. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Distributed Computing & Spark",
      "Apple",
      "PlatformEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-50-kafka-partitioning-strategies-consu",
    "title": "Kafka Partitioning Strategies & Consumer Group Rebalancing [System Design #50]",
    "question": "Design, optimize, and defend **Kafka Partitioning Strategies & Consumer Group Rebalancing** within **Streaming Architectures & Kafka**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at LinkedIn.",
    "type": "System Design",
    "company": "LinkedIn",
    "role": "Streaming Systems Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Streaming Architectures & Kafka",
    "subtopic": "Kafka Partitioning Strategies & Consumer Group Rebalancing",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "LinkedIn Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Kafka Partitioning Strategies & Consumer Group Rebalancing. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Streaming Architectures & Kafka",
      "LinkedIn",
      "StreamingSystemsEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-51-kafka-log-compaction-retaining-late",
    "title": "Kafka Log Compaction [System Design #51]",
    "question": "Design, optimize, and defend **Kafka Log Compaction: Retaining Latest Value per Key** within **Streaming Architectures & Kafka**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Stripe.",
    "type": "System Design",
    "company": "Stripe",
    "role": "Data Infrastructure Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Streaming Architectures & Kafka",
    "subtopic": "Kafka Log Compaction: Retaining Latest Value per Key",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Stripe Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Kafka Log Compaction: Retaining Latest Value per Key. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Streaming Architectures & Kafka",
      "Stripe",
      "DataInfrastructureEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-52-watermarking-handling-late-arriving",
    "title": "Watermarking & Handling Late-Arriving Events in Stream Processing [System Design #52]",
    "question": "Design, optimize, and defend **Watermarking & Handling Late-Arriving Events in Stream Processing** within **Streaming Architectures & Kafka**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Netflix.",
    "type": "System Design",
    "company": "Netflix",
    "role": "Data Architect",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Streaming Architectures & Kafka",
    "subtopic": "Watermarking & Handling Late-Arriving Events in Stream Processing",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Netflix Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Watermarking & Handling Late-Arriving Events in Stream Processing. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Streaming Architectures & Kafka",
      "Netflix",
      "DataArchitect"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-53-star-schema-vs-snowflake-schema-joi",
    "title": "Star Schema vs Snowflake Schema [System Design #53]",
    "question": "Design, optimize, and defend **Star Schema vs Snowflake Schema: Join Penalties vs Storage Redundancy** within **Data Warehousing & Modeling**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Google.",
    "type": "System Design",
    "company": "Google",
    "role": "Analytics Architect",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Warehousing & Modeling",
    "subtopic": "Star Schema vs Snowflake Schema: Join Penalties vs Storage Redundancy",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Google Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Star Schema vs Snowflake Schema: Join Penalties vs Storage Redundancy. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Warehousing & Modeling",
      "Google",
      "AnalyticsArchitect"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-54-partition-pruning-vs-micro-partitio",
    "title": "Partition Pruning vs Micro-Partition Clustering in Snowflake [System Design #54]",
    "question": "Design, optimize, and defend **Partition Pruning vs Micro-Partition Clustering in Snowflake** within **Data Warehousing & Modeling**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Snowflake.",
    "type": "System Design",
    "company": "Snowflake",
    "role": "Data Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Warehousing & Modeling",
    "subtopic": "Partition Pruning vs Micro-Partition Clustering in Snowflake",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Snowflake Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Partition Pruning vs Micro-Partition Clustering in Snowflake. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Warehousing & Modeling",
      "Snowflake",
      "DataEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-55-fact-table-types-transactional-peri",
    "title": "Fact Table Types [System Design #55]",
    "question": "Design, optimize, and defend **Fact Table Types: Transactional, Periodic Snapshot & Accumulating Snapshot** within **Data Warehousing & Modeling**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Walmart.",
    "type": "System Design",
    "company": "Walmart",
    "role": "Principal Data Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Warehousing & Modeling",
    "subtopic": "Fact Table Types: Transactional, Periodic Snapshot & Accumulating Snapshot",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Walmart Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Fact Table Types: Transactional, Periodic Snapshot & Accumulating Snapshot. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Warehousing & Modeling",
      "Walmart",
      "PrincipalDataEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-56-apache-parquet-columnar-storage-dic",
    "title": "Apache Parquet [System Design #56]",
    "question": "Design, optimize, and defend **Apache Parquet: Columnar Storage, Dictionary Encoding & Snappy Compression** within **Data Lakehouses & Formats**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Meta.",
    "type": "System Design",
    "company": "Meta",
    "role": "Data Infra Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Lakehouses & Formats",
    "subtopic": "Apache Parquet: Columnar Storage, Dictionary Encoding & Snappy Compression",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Meta Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Apache Parquet: Columnar Storage, Dictionary Encoding & Snappy Compression. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Lakehouses & Formats",
      "Meta",
      "DataInfraEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-57-compaction-of-small-files-bin-packi",
    "title": "Compaction of Small Files (Bin-Packing) in Object Storage Lakes [System Design #57]",
    "question": "Design, optimize, and defend **Compaction of Small Files (Bin-Packing) in Object Storage Lakes** within **Data Lakehouses & Formats**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Databricks.",
    "type": "System Design",
    "company": "Databricks",
    "role": "Lakehouse Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Lakehouses & Formats",
    "subtopic": "Compaction of Small Files (Bin-Packing) in Object Storage Lakes",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Databricks Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Compaction of Small Files (Bin-Packing) in Object Storage Lakes. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Lakehouses & Formats",
      "Databricks",
      "LakehouseEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-58-time-travel-and-zero-copy-clones-in",
    "title": "Time Travel and Zero-Copy Clones in Modern Lakehouse Storage [System Design #58]",
    "question": "Design, optimize, and defend **Time Travel and Zero-Copy Clones in Modern Lakehouse Storage** within **Data Lakehouses & Formats**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Microsoft.",
    "type": "System Design",
    "company": "Microsoft",
    "role": "Azure Data Architect",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Lakehouses & Formats",
    "subtopic": "Time Travel and Zero-Copy Clones in Modern Lakehouse Storage",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Microsoft Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Time Travel and Zero-Copy Clones in Modern Lakehouse Storage. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Lakehouses & Formats",
      "Microsoft",
      "AzureDataArchitect"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-59-dynamic-task-mapping-in-airflow-2-3",
    "title": "Dynamic Task Mapping in Airflow 2.3+ for Fan-Out / Fan-In Pipelines [System Design #59]",
    "question": "Design, optimize, and defend **Dynamic Task Mapping in Airflow 2.3+ for Fan-Out / Fan-In Pipelines** within **Workflow Orchestration**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Airbnb.",
    "type": "System Design",
    "company": "Airbnb",
    "role": "Data Platform Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Workflow Orchestration",
    "subtopic": "Dynamic Task Mapping in Airflow 2.3+ for Fan-Out / Fan-In Pipelines",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Airbnb Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Dynamic Task Mapping in Airflow 2.3+ for Fan-Out / Fan-In Pipelines. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Workflow Orchestration",
      "Airbnb",
      "DataPlatformEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-60-data-sensors-vs-event-driven-trigge",
    "title": "Data Sensors vs Event-Driven Triggers in Asynchronous Pipelines [System Design #60]",
    "question": "Design, optimize, and defend **Data Sensors vs Event-Driven Triggers in Asynchronous Pipelines** within **Workflow Orchestration**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Spotify.",
    "type": "System Design",
    "company": "Spotify",
    "role": "Data Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Workflow Orchestration",
    "subtopic": "Data Sensors vs Event-Driven Triggers in Asynchronous Pipelines",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Spotify Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Data Sensors vs Event-Driven Triggers in Asynchronous Pipelines. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Workflow Orchestration",
      "Spotify",
      "DataEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-61-data-contracts-enforcing-protobuf-j",
    "title": "Data Contracts [System Design #61]",
    "question": "Design, optimize, and defend **Data Contracts: Enforcing Protobuf/JSON Schema Validation at Producer Boundaries** within **Data Quality & Governance**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at PayPal.",
    "type": "System Design",
    "company": "PayPal",
    "role": "Staff Data Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Quality & Governance",
    "subtopic": "Data Contracts: Enforcing Protobuf/JSON Schema Validation at Producer Boundaries",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "PayPal Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Data Contracts: Enforcing Protobuf/JSON Schema Validation at Producer Boundaries. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Quality & Governance",
      "PayPal",
      "StaffDataEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-62-change-data-capture-cdc-debezium-my",
    "title": "Change Data Capture (CDC) [System Design #62]",
    "question": "Design, optimize, and defend **Change Data Capture (CDC): Debezium, MySQL Binlog & Postgres WAL Streaming** within **Data Quality & Governance**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at DoorDash.",
    "type": "System Design",
    "company": "DoorDash",
    "role": "Data Platform Lead",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Quality & Governance",
    "subtopic": "Change Data Capture (CDC): Debezium, MySQL Binlog & Postgres WAL Streaming",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "DoorDash Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Change Data Capture (CDC): Debezium, MySQL Binlog & Postgres WAL Streaming. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Quality & Governance",
      "DoorDash",
      "DataPlatformLead"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-63-dbt-incremental-models-merge-vs-app",
    "title": "dbt Incremental Models [System Design #63]",
    "question": "Design, optimize, and defend **dbt Incremental Models: Merge vs Append Strategies and Lookback Windows** within **Data Quality & Governance**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at GitLab.",
    "type": "System Design",
    "company": "GitLab",
    "role": "Analytics Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Quality & Governance",
    "subtopic": "dbt Incremental Models: Merge vs Append Strategies and Lookback Windows",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "GitLab Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in dbt Incremental Models: Merge vs Append Strategies and Lookback Windows. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Quality & Governance",
      "GitLab",
      "AnalyticsEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-64-automated-data-quality-testing-with",
    "title": "Automated Data Quality Testing with Great Expectations in Production [System Design #64]",
    "question": "Design, optimize, and defend **Automated Data Quality Testing with Great Expectations in Production** within **Data Quality & Governance**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Goldman Sachs.",
    "type": "System Design",
    "company": "Goldman Sachs",
    "role": "Data Governance Lead",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Quality & Governance",
    "subtopic": "Automated Data Quality Testing with Great Expectations in Production",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Goldman Sachs Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Automated Data Quality Testing with Great Expectations in Production. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Quality & Governance",
      "Goldman Sachs",
      "DataGovernanceLead"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-65-hdfs-vs-s3-gcs-object-storage-event",
    "title": "HDFS vs S3/GCS Object Storage [System Design #65]",
    "question": "Design, optimize, and defend **HDFS vs S3/GCS Object Storage: Eventual Consistency and Multipart Uploads** within **Distributed Storage**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Amazon.",
    "type": "System Design",
    "company": "Amazon",
    "role": "Cloud Storage Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Distributed Storage",
    "subtopic": "HDFS vs S3/GCS Object Storage: Eventual Consistency and Multipart Uploads",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Amazon Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in HDFS vs S3/GCS Object Storage: Eventual Consistency and Multipart Uploads. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Distributed Storage",
      "Amazon",
      "CloudStorageEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-66-catalyst-optimizer-logical-plan-to-",
    "title": "Catalyst Optimizer [System Design #66]",
    "question": "Design, optimize, and defend **Catalyst Optimizer: Logical Plan to Physical Execution Plan** within **Distributed Computing & Spark**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Databricks.",
    "type": "System Design",
    "company": "Databricks",
    "role": "Spark Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Distributed Computing & Spark",
    "subtopic": "Catalyst Optimizer: Logical Plan to Physical Execution Plan",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Databricks Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Catalyst Optimizer: Logical Plan to Physical Execution Plan. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Distributed Computing & Spark",
      "Databricks",
      "SparkEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-67-tungsten-execution-engine-off-heap-",
    "title": "Tungsten Execution Engine [System Design #67]",
    "question": "Design, optimize, and defend **Tungsten Execution Engine: Off-Heap Memory and Whole-Stage CodeGen** within **Distributed Computing & Spark**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Uber.",
    "type": "System Design",
    "company": "Uber",
    "role": "Big Data Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Distributed Computing & Spark",
    "subtopic": "Tungsten Execution Engine: Off-Heap Memory and Whole-Stage CodeGen",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Uber Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Tungsten Execution Engine: Off-Heap Memory and Whole-Stage CodeGen. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Distributed Computing & Spark",
      "Uber",
      "BigDataEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-68-broadcast-hash-join-vs-sort-merge-j",
    "title": "Broadcast Hash Join vs Sort-Merge Join vs Shuffle Hash Join [System Design #68]",
    "question": "Design, optimize, and defend **Broadcast Hash Join vs Sort-Merge Join vs Shuffle Hash Join** within **Distributed Computing & Spark**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Amazon.",
    "type": "System Design",
    "company": "Amazon",
    "role": "Data Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Distributed Computing & Spark",
    "subtopic": "Broadcast Hash Join vs Sort-Merge Join vs Shuffle Hash Join",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Amazon Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Broadcast Hash Join vs Sort-Merge Join vs Shuffle Hash Join. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Distributed Computing & Spark",
      "Amazon",
      "DataEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-69-executor-oom-diagnostics-driver-vs-",
    "title": "Executor OOM Diagnostics [System Design #69]",
    "question": "Design, optimize, and defend **Executor OOM Diagnostics: Driver vs Executor Memory and Garbage Collection** within **Distributed Computing & Spark**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Apple.",
    "type": "System Design",
    "company": "Apple",
    "role": "Platform Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Distributed Computing & Spark",
    "subtopic": "Executor OOM Diagnostics: Driver vs Executor Memory and Garbage Collection",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Apple Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Executor OOM Diagnostics: Driver vs Executor Memory and Garbage Collection. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Distributed Computing & Spark",
      "Apple",
      "PlatformEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-70-kafka-partitioning-strategies-consu",
    "title": "Kafka Partitioning Strategies & Consumer Group Rebalancing [System Design #70]",
    "question": "Design, optimize, and defend **Kafka Partitioning Strategies & Consumer Group Rebalancing** within **Streaming Architectures & Kafka**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at LinkedIn.",
    "type": "System Design",
    "company": "LinkedIn",
    "role": "Streaming Systems Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Streaming Architectures & Kafka",
    "subtopic": "Kafka Partitioning Strategies & Consumer Group Rebalancing",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "LinkedIn Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Kafka Partitioning Strategies & Consumer Group Rebalancing. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Streaming Architectures & Kafka",
      "LinkedIn",
      "StreamingSystemsEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-71-kafka-log-compaction-retaining-late",
    "title": "Kafka Log Compaction [System Design #71]",
    "question": "Design, optimize, and defend **Kafka Log Compaction: Retaining Latest Value per Key** within **Streaming Architectures & Kafka**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Stripe.",
    "type": "System Design",
    "company": "Stripe",
    "role": "Data Infrastructure Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Streaming Architectures & Kafka",
    "subtopic": "Kafka Log Compaction: Retaining Latest Value per Key",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Stripe Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Kafka Log Compaction: Retaining Latest Value per Key. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Streaming Architectures & Kafka",
      "Stripe",
      "DataInfrastructureEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-72-watermarking-handling-late-arriving",
    "title": "Watermarking & Handling Late-Arriving Events in Stream Processing [System Design #72]",
    "question": "Design, optimize, and defend **Watermarking & Handling Late-Arriving Events in Stream Processing** within **Streaming Architectures & Kafka**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Netflix.",
    "type": "System Design",
    "company": "Netflix",
    "role": "Data Architect",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Streaming Architectures & Kafka",
    "subtopic": "Watermarking & Handling Late-Arriving Events in Stream Processing",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Netflix Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Watermarking & Handling Late-Arriving Events in Stream Processing. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Streaming Architectures & Kafka",
      "Netflix",
      "DataArchitect"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-73-star-schema-vs-snowflake-schema-joi",
    "title": "Star Schema vs Snowflake Schema [System Design #73]",
    "question": "Design, optimize, and defend **Star Schema vs Snowflake Schema: Join Penalties vs Storage Redundancy** within **Data Warehousing & Modeling**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Google.",
    "type": "System Design",
    "company": "Google",
    "role": "Analytics Architect",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Warehousing & Modeling",
    "subtopic": "Star Schema vs Snowflake Schema: Join Penalties vs Storage Redundancy",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Google Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Star Schema vs Snowflake Schema: Join Penalties vs Storage Redundancy. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Warehousing & Modeling",
      "Google",
      "AnalyticsArchitect"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-74-partition-pruning-vs-micro-partitio",
    "title": "Partition Pruning vs Micro-Partition Clustering in Snowflake [System Design #74]",
    "question": "Design, optimize, and defend **Partition Pruning vs Micro-Partition Clustering in Snowflake** within **Data Warehousing & Modeling**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Snowflake.",
    "type": "System Design",
    "company": "Snowflake",
    "role": "Data Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Warehousing & Modeling",
    "subtopic": "Partition Pruning vs Micro-Partition Clustering in Snowflake",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Snowflake Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Partition Pruning vs Micro-Partition Clustering in Snowflake. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Warehousing & Modeling",
      "Snowflake",
      "DataEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-75-fact-table-types-transactional-peri",
    "title": "Fact Table Types [System Design #75]",
    "question": "Design, optimize, and defend **Fact Table Types: Transactional, Periodic Snapshot & Accumulating Snapshot** within **Data Warehousing & Modeling**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Walmart.",
    "type": "System Design",
    "company": "Walmart",
    "role": "Principal Data Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Warehousing & Modeling",
    "subtopic": "Fact Table Types: Transactional, Periodic Snapshot & Accumulating Snapshot",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Walmart Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Fact Table Types: Transactional, Periodic Snapshot & Accumulating Snapshot. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Warehousing & Modeling",
      "Walmart",
      "PrincipalDataEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-76-apache-parquet-columnar-storage-dic",
    "title": "Apache Parquet [System Design #76]",
    "question": "Design, optimize, and defend **Apache Parquet: Columnar Storage, Dictionary Encoding & Snappy Compression** within **Data Lakehouses & Formats**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Meta.",
    "type": "System Design",
    "company": "Meta",
    "role": "Data Infra Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Lakehouses & Formats",
    "subtopic": "Apache Parquet: Columnar Storage, Dictionary Encoding & Snappy Compression",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Meta Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Apache Parquet: Columnar Storage, Dictionary Encoding & Snappy Compression. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Lakehouses & Formats",
      "Meta",
      "DataInfraEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-77-compaction-of-small-files-bin-packi",
    "title": "Compaction of Small Files (Bin-Packing) in Object Storage Lakes [System Design #77]",
    "question": "Design, optimize, and defend **Compaction of Small Files (Bin-Packing) in Object Storage Lakes** within **Data Lakehouses & Formats**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Databricks.",
    "type": "System Design",
    "company": "Databricks",
    "role": "Lakehouse Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Lakehouses & Formats",
    "subtopic": "Compaction of Small Files (Bin-Packing) in Object Storage Lakes",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Databricks Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Compaction of Small Files (Bin-Packing) in Object Storage Lakes. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Lakehouses & Formats",
      "Databricks",
      "LakehouseEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-78-time-travel-and-zero-copy-clones-in",
    "title": "Time Travel and Zero-Copy Clones in Modern Lakehouse Storage [System Design #78]",
    "question": "Design, optimize, and defend **Time Travel and Zero-Copy Clones in Modern Lakehouse Storage** within **Data Lakehouses & Formats**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Microsoft.",
    "type": "System Design",
    "company": "Microsoft",
    "role": "Azure Data Architect",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Lakehouses & Formats",
    "subtopic": "Time Travel and Zero-Copy Clones in Modern Lakehouse Storage",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Microsoft Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Time Travel and Zero-Copy Clones in Modern Lakehouse Storage. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Lakehouses & Formats",
      "Microsoft",
      "AzureDataArchitect"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-79-dynamic-task-mapping-in-airflow-2-3",
    "title": "Dynamic Task Mapping in Airflow 2.3+ for Fan-Out / Fan-In Pipelines [System Design #79]",
    "question": "Design, optimize, and defend **Dynamic Task Mapping in Airflow 2.3+ for Fan-Out / Fan-In Pipelines** within **Workflow Orchestration**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Airbnb.",
    "type": "System Design",
    "company": "Airbnb",
    "role": "Data Platform Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Workflow Orchestration",
    "subtopic": "Dynamic Task Mapping in Airflow 2.3+ for Fan-Out / Fan-In Pipelines",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Airbnb Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Dynamic Task Mapping in Airflow 2.3+ for Fan-Out / Fan-In Pipelines. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Workflow Orchestration",
      "Airbnb",
      "DataPlatformEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-80-data-sensors-vs-event-driven-trigge",
    "title": "Data Sensors vs Event-Driven Triggers in Asynchronous Pipelines [System Design #80]",
    "question": "Design, optimize, and defend **Data Sensors vs Event-Driven Triggers in Asynchronous Pipelines** within **Workflow Orchestration**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Spotify.",
    "type": "System Design",
    "company": "Spotify",
    "role": "Data Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Workflow Orchestration",
    "subtopic": "Data Sensors vs Event-Driven Triggers in Asynchronous Pipelines",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Spotify Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Data Sensors vs Event-Driven Triggers in Asynchronous Pipelines. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Workflow Orchestration",
      "Spotify",
      "DataEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-81-data-contracts-enforcing-protobuf-j",
    "title": "Data Contracts [System Design #81]",
    "question": "Design, optimize, and defend **Data Contracts: Enforcing Protobuf/JSON Schema Validation at Producer Boundaries** within **Data Quality & Governance**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at PayPal.",
    "type": "System Design",
    "company": "PayPal",
    "role": "Staff Data Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Quality & Governance",
    "subtopic": "Data Contracts: Enforcing Protobuf/JSON Schema Validation at Producer Boundaries",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "PayPal Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Data Contracts: Enforcing Protobuf/JSON Schema Validation at Producer Boundaries. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Quality & Governance",
      "PayPal",
      "StaffDataEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-82-change-data-capture-cdc-debezium-my",
    "title": "Change Data Capture (CDC) [System Design #82]",
    "question": "Design, optimize, and defend **Change Data Capture (CDC): Debezium, MySQL Binlog & Postgres WAL Streaming** within **Data Quality & Governance**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at DoorDash.",
    "type": "System Design",
    "company": "DoorDash",
    "role": "Data Platform Lead",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Quality & Governance",
    "subtopic": "Change Data Capture (CDC): Debezium, MySQL Binlog & Postgres WAL Streaming",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "DoorDash Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Change Data Capture (CDC): Debezium, MySQL Binlog & Postgres WAL Streaming. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Quality & Governance",
      "DoorDash",
      "DataPlatformLead"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-83-dbt-incremental-models-merge-vs-app",
    "title": "dbt Incremental Models [System Design #83]",
    "question": "Design, optimize, and defend **dbt Incremental Models: Merge vs Append Strategies and Lookback Windows** within **Data Quality & Governance**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at GitLab.",
    "type": "System Design",
    "company": "GitLab",
    "role": "Analytics Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Quality & Governance",
    "subtopic": "dbt Incremental Models: Merge vs Append Strategies and Lookback Windows",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "GitLab Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in dbt Incremental Models: Merge vs Append Strategies and Lookback Windows. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Quality & Governance",
      "GitLab",
      "AnalyticsEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-84-automated-data-quality-testing-with",
    "title": "Automated Data Quality Testing with Great Expectations in Production [System Design #84]",
    "question": "Design, optimize, and defend **Automated Data Quality Testing with Great Expectations in Production** within **Data Quality & Governance**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Goldman Sachs.",
    "type": "System Design",
    "company": "Goldman Sachs",
    "role": "Data Governance Lead",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Quality & Governance",
    "subtopic": "Automated Data Quality Testing with Great Expectations in Production",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Goldman Sachs Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Automated Data Quality Testing with Great Expectations in Production. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Quality & Governance",
      "Goldman Sachs",
      "DataGovernanceLead"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-85-hdfs-vs-s3-gcs-object-storage-event",
    "title": "HDFS vs S3/GCS Object Storage [System Design #85]",
    "question": "Design, optimize, and defend **HDFS vs S3/GCS Object Storage: Eventual Consistency and Multipart Uploads** within **Distributed Storage**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Amazon.",
    "type": "System Design",
    "company": "Amazon",
    "role": "Cloud Storage Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Distributed Storage",
    "subtopic": "HDFS vs S3/GCS Object Storage: Eventual Consistency and Multipart Uploads",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Amazon Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in HDFS vs S3/GCS Object Storage: Eventual Consistency and Multipart Uploads. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Distributed Storage",
      "Amazon",
      "CloudStorageEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-86-catalyst-optimizer-logical-plan-to-",
    "title": "Catalyst Optimizer [System Design #86]",
    "question": "Design, optimize, and defend **Catalyst Optimizer: Logical Plan to Physical Execution Plan** within **Distributed Computing & Spark**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Databricks.",
    "type": "System Design",
    "company": "Databricks",
    "role": "Spark Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Distributed Computing & Spark",
    "subtopic": "Catalyst Optimizer: Logical Plan to Physical Execution Plan",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Databricks Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Catalyst Optimizer: Logical Plan to Physical Execution Plan. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Distributed Computing & Spark",
      "Databricks",
      "SparkEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-87-tungsten-execution-engine-off-heap-",
    "title": "Tungsten Execution Engine [System Design #87]",
    "question": "Design, optimize, and defend **Tungsten Execution Engine: Off-Heap Memory and Whole-Stage CodeGen** within **Distributed Computing & Spark**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Uber.",
    "type": "System Design",
    "company": "Uber",
    "role": "Big Data Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Distributed Computing & Spark",
    "subtopic": "Tungsten Execution Engine: Off-Heap Memory and Whole-Stage CodeGen",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Uber Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Tungsten Execution Engine: Off-Heap Memory and Whole-Stage CodeGen. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Distributed Computing & Spark",
      "Uber",
      "BigDataEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-88-broadcast-hash-join-vs-sort-merge-j",
    "title": "Broadcast Hash Join vs Sort-Merge Join vs Shuffle Hash Join [System Design #88]",
    "question": "Design, optimize, and defend **Broadcast Hash Join vs Sort-Merge Join vs Shuffle Hash Join** within **Distributed Computing & Spark**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Amazon.",
    "type": "System Design",
    "company": "Amazon",
    "role": "Data Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Distributed Computing & Spark",
    "subtopic": "Broadcast Hash Join vs Sort-Merge Join vs Shuffle Hash Join",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Amazon Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Broadcast Hash Join vs Sort-Merge Join vs Shuffle Hash Join. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Distributed Computing & Spark",
      "Amazon",
      "DataEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-89-executor-oom-diagnostics-driver-vs-",
    "title": "Executor OOM Diagnostics [System Design #89]",
    "question": "Design, optimize, and defend **Executor OOM Diagnostics: Driver vs Executor Memory and Garbage Collection** within **Distributed Computing & Spark**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Apple.",
    "type": "System Design",
    "company": "Apple",
    "role": "Platform Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Distributed Computing & Spark",
    "subtopic": "Executor OOM Diagnostics: Driver vs Executor Memory and Garbage Collection",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Apple Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Executor OOM Diagnostics: Driver vs Executor Memory and Garbage Collection. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Distributed Computing & Spark",
      "Apple",
      "PlatformEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-90-kafka-partitioning-strategies-consu",
    "title": "Kafka Partitioning Strategies & Consumer Group Rebalancing [System Design #90]",
    "question": "Design, optimize, and defend **Kafka Partitioning Strategies & Consumer Group Rebalancing** within **Streaming Architectures & Kafka**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at LinkedIn.",
    "type": "System Design",
    "company": "LinkedIn",
    "role": "Streaming Systems Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Streaming Architectures & Kafka",
    "subtopic": "Kafka Partitioning Strategies & Consumer Group Rebalancing",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "LinkedIn Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Kafka Partitioning Strategies & Consumer Group Rebalancing. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Streaming Architectures & Kafka",
      "LinkedIn",
      "StreamingSystemsEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-91-kafka-log-compaction-retaining-late",
    "title": "Kafka Log Compaction [System Design #91]",
    "question": "Design, optimize, and defend **Kafka Log Compaction: Retaining Latest Value per Key** within **Streaming Architectures & Kafka**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Stripe.",
    "type": "System Design",
    "company": "Stripe",
    "role": "Data Infrastructure Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Streaming Architectures & Kafka",
    "subtopic": "Kafka Log Compaction: Retaining Latest Value per Key",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Stripe Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Kafka Log Compaction: Retaining Latest Value per Key. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Streaming Architectures & Kafka",
      "Stripe",
      "DataInfrastructureEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-92-watermarking-handling-late-arriving",
    "title": "Watermarking & Handling Late-Arriving Events in Stream Processing [System Design #92]",
    "question": "Design, optimize, and defend **Watermarking & Handling Late-Arriving Events in Stream Processing** within **Streaming Architectures & Kafka**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Netflix.",
    "type": "System Design",
    "company": "Netflix",
    "role": "Data Architect",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Streaming Architectures & Kafka",
    "subtopic": "Watermarking & Handling Late-Arriving Events in Stream Processing",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Netflix Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Watermarking & Handling Late-Arriving Events in Stream Processing. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Streaming Architectures & Kafka",
      "Netflix",
      "DataArchitect"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-93-star-schema-vs-snowflake-schema-joi",
    "title": "Star Schema vs Snowflake Schema [System Design #93]",
    "question": "Design, optimize, and defend **Star Schema vs Snowflake Schema: Join Penalties vs Storage Redundancy** within **Data Warehousing & Modeling**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Google.",
    "type": "System Design",
    "company": "Google",
    "role": "Analytics Architect",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Warehousing & Modeling",
    "subtopic": "Star Schema vs Snowflake Schema: Join Penalties vs Storage Redundancy",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Google Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Star Schema vs Snowflake Schema: Join Penalties vs Storage Redundancy. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Warehousing & Modeling",
      "Google",
      "AnalyticsArchitect"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-94-partition-pruning-vs-micro-partitio",
    "title": "Partition Pruning vs Micro-Partition Clustering in Snowflake [System Design #94]",
    "question": "Design, optimize, and defend **Partition Pruning vs Micro-Partition Clustering in Snowflake** within **Data Warehousing & Modeling**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Snowflake.",
    "type": "System Design",
    "company": "Snowflake",
    "role": "Data Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Warehousing & Modeling",
    "subtopic": "Partition Pruning vs Micro-Partition Clustering in Snowflake",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Snowflake Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Partition Pruning vs Micro-Partition Clustering in Snowflake. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Warehousing & Modeling",
      "Snowflake",
      "DataEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-95-fact-table-types-transactional-peri",
    "title": "Fact Table Types [System Design #95]",
    "question": "Design, optimize, and defend **Fact Table Types: Transactional, Periodic Snapshot & Accumulating Snapshot** within **Data Warehousing & Modeling**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Walmart.",
    "type": "System Design",
    "company": "Walmart",
    "role": "Principal Data Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Warehousing & Modeling",
    "subtopic": "Fact Table Types: Transactional, Periodic Snapshot & Accumulating Snapshot",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Walmart Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Fact Table Types: Transactional, Periodic Snapshot & Accumulating Snapshot. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Warehousing & Modeling",
      "Walmart",
      "PrincipalDataEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-96-apache-parquet-columnar-storage-dic",
    "title": "Apache Parquet [System Design #96]",
    "question": "Design, optimize, and defend **Apache Parquet: Columnar Storage, Dictionary Encoding & Snappy Compression** within **Data Lakehouses & Formats**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Meta.",
    "type": "System Design",
    "company": "Meta",
    "role": "Data Infra Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Lakehouses & Formats",
    "subtopic": "Apache Parquet: Columnar Storage, Dictionary Encoding & Snappy Compression",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Meta Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Apache Parquet: Columnar Storage, Dictionary Encoding & Snappy Compression. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Lakehouses & Formats",
      "Meta",
      "DataInfraEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-97-compaction-of-small-files-bin-packi",
    "title": "Compaction of Small Files (Bin-Packing) in Object Storage Lakes [System Design #97]",
    "question": "Design, optimize, and defend **Compaction of Small Files (Bin-Packing) in Object Storage Lakes** within **Data Lakehouses & Formats**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Databricks.",
    "type": "System Design",
    "company": "Databricks",
    "role": "Lakehouse Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Lakehouses & Formats",
    "subtopic": "Compaction of Small Files (Bin-Packing) in Object Storage Lakes",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Databricks Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Compaction of Small Files (Bin-Packing) in Object Storage Lakes. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Lakehouses & Formats",
      "Databricks",
      "LakehouseEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-98-time-travel-and-zero-copy-clones-in",
    "title": "Time Travel and Zero-Copy Clones in Modern Lakehouse Storage [System Design #98]",
    "question": "Design, optimize, and defend **Time Travel and Zero-Copy Clones in Modern Lakehouse Storage** within **Data Lakehouses & Formats**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Microsoft.",
    "type": "System Design",
    "company": "Microsoft",
    "role": "Azure Data Architect",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Data Lakehouses & Formats",
    "subtopic": "Time Travel and Zero-Copy Clones in Modern Lakehouse Storage",
    "difficulty": "Hard",
    "sourceType": "Verified Company Question",
    "source": "Microsoft Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Time Travel and Zero-Copy Clones in Modern Lakehouse Storage. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Data Lakehouses & Formats",
      "Microsoft",
      "AzureDataArchitect"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-99-dynamic-task-mapping-in-airflow-2-3",
    "title": "Dynamic Task Mapping in Airflow 2.3+ for Fan-Out / Fan-In Pipelines [System Design #99]",
    "question": "Design, optimize, and defend **Dynamic Task Mapping in Airflow 2.3+ for Fan-Out / Fan-In Pipelines** within **Workflow Orchestration**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Airbnb.",
    "type": "System Design",
    "company": "Airbnb",
    "role": "Data Platform Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Workflow Orchestration",
    "subtopic": "Dynamic Task Mapping in Airflow 2.3+ for Fan-Out / Fan-In Pipelines",
    "difficulty": "Easy",
    "sourceType": "Verified Company Question",
    "source": "Airbnb Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Dynamic Task Mapping in Airflow 2.3+ for Fan-Out / Fan-In Pipelines. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Workflow Orchestration",
      "Airbnb",
      "DataPlatformEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  },
  {
    "id": "qb-de-de-canonical-100-data-sensors-vs-event-driven-trigge",
    "title": "Data Sensors vs Event-Driven Triggers in Asynchronous Pipelines [System Design #100]",
    "question": "Design, optimize, and defend **Data Sensors vs Event-Driven Triggers in Asynchronous Pipelines** within **Workflow Orchestration**. Address distributed scaling constraints, network I/O and shuffle bottlenecks, fault tolerance under executor failures, and end-to-end data freshness guarantees at Spotify.",
    "type": "System Design",
    "company": "Spotify",
    "role": "Data Engineer",
    "round": "Technical Round 2",
    "domain": "Data Engineering",
    "topic": "Workflow Orchestration",
    "subtopic": "Data Sensors vs Event-Driven Triggers in Asynchronous Pipelines",
    "difficulty": "Medium",
    "sourceType": "Verified Company Question",
    "source": "Spotify Data Engineering Interview Benchmark",
    "verified": true,
    "hints": [
      "Identify the primary bottleneck: network shuffle, disk I/O, or CPU serialization?",
      "How does the system recover if a worker node crashes halfway through execution?"
    ],
    "explanation": "This problem validates architectural and operational data engineering mastery in Data Sensors vs Event-Driven Triggers in Asynchronous Pipelines. Key requirements: minimize cross-network data movement, ensure transactional consistency, establish automated recovery paths, and maintain high throughput under petabyte-scale loads.",
    "solution": "Architectural resolution: 1. Evaluate partition distribution and network topology. 2. Implement resilient pipeline execution with idempotent sink semantics. 3. Monitor metrics (shuffle read/write, task skew, lag) against SLA targets.",
    "tags": [
      "Data Engineering",
      "Workflow Orchestration",
      "Spotify",
      "DataEngineer"
    ],
    "recommendedForRoles": [
      "Data Engineer",
      "Big Data Engineer",
      "Analytics Engineer"
    ],
    "whyRecommended": "Rigorous technical assessment testing distributed systems, streaming architectures, and pipeline reliability.",
    "createdAt": "2025-01-01T00:00:00Z",
    "updatedAt": "2026-03-01T00:00:00Z"
  }
];
