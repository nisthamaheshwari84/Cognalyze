/**
 * COGNALYZE MENTOR — KNOWLEDGE GRAPH
 * Topic dependency graphs, prerequisite chains, Socratic diagnostic probes,
 * common misconceptions, and 5-level hint ladders for representative domains.
 */

import { KnowledgeGraphNode } from "./types";

export const KNOWLEDGE_GRAPH: Record<string, KnowledgeGraphNode> = {
  // ──────────────────────────────────────────────────────────
  // DOMAIN 1: SYSTEM DESIGN
  // ──────────────────────────────────────────────────────────
  "sys-networking": {
    id: "sys-networking",
    title: "Client-Server & HTTP/TCP Basics",
    domain: "System Design",
    prerequisites: [],
    coreQuestions: [
      "What actually happens under the hood when a browser requests a URL?",
      "Why is TCP preferred over UDP for web applications, and what is the cost of the 3-way handshake?"
    ],
    commonMisconceptions: [
      {
        misconception: "HTTP/1.1 and HTTP/2 handle multiple concurrent requests the same way.",
        correctionScenario: "Compare head-of-line blocking in HTTP/1.1 pipelining with HTTP/2 binary multiplexing over a single TCP connection."
      }
    ],
    practicalChallenge: {
      task: "Design an API transport mechanism for a financial trading mobile app that needs sub-50ms market tick updates.",
      defensePrompt: "Why did you choose WebSockets/gRPC over periodic HTTP polling, and how will you handle connection drops?",
      constraints: ["50ms latency SLA", "Mobile networks with intermittent packet loss"]
    },
    hintLadder: {
      level1: "Think about the overhead of opening a new TCP connection on every request vs reusing a persistent connection.",
      level2: "HTTP request headers add ~1KB per request. Long polling still has HTTP overhead.",
      level3: "Consider full-duplex persistent connections like WebSockets or binary streaming with HTTP/2 (gRPC).",
      level4: "WebSocket allows server-initiated pushes without repeated TCP handshakes or header duplication.",
      level5: "Use WebSockets with binary protocol buffers and a client-side heartbeat ping/pong reconnection backoff."
    }
  },

  "sys-load-balancing": {
    id: "sys-load-balancing",
    title: "Load Balancing & Traffic Distribution",
    domain: "System Design",
    prerequisites: ["sys-networking"],
    coreQuestions: [
      "What is the difference between Layer 4 (Transport) and Layer 7 (Application) load balancing?",
      "What happens if one backend server becomes sluggish (not dead, but responding in 5 seconds instead of 50ms)?"
    ],
    commonMisconceptions: [
      {
        misconception: "Round-robin is always sufficient for stateless backends.",
        correctionScenario: "In heterogeneous request workloads, simple round-robin sends heavy requests to already saturated instances."
      }
    ],
    practicalChallenge: {
      task: "Configure traffic distribution for an e-commerce flash sale with 200,000 requests/sec across 50 worker nodes.",
      defensePrompt: "Why would you choose Least Connections or Peak EWMA over Round Robin for flash sales?",
      constraints: ["Spike traffic from 5k to 200k req/s", "Cart checkout requests take 10x longer than browse requests"]
    },
    hintLadder: {
      level1: "Consider that some requests take 10ms while others take 200ms. What does round robin do?",
      level2: "If requests have variable processing times, routing to the server with fewest active connections prevents convoy delays.",
      level3: "Use Layer 7 routing (e.g. NGINX/HAProxy/Envoy) with dynamic health checks and Least Outstanding Requests.",
      level4: "Combine Layer 4 (DNS/BGP Anycast + ECMP) for ingress routing with Layer 7 Envoy proxies using Peak EWMA.",
      level5: "Architecture: DNS round robin to Anycast L4 load balancers -> L7 Envoy proxy cluster -> Least Request routing with outlier detection circuit breakers."
    }
  },

  "sys-caching": {
    id: "sys-caching",
    title: "Caching Strategies & Cache Invalidation",
    domain: "System Design",
    prerequisites: ["sys-networking"],
    coreQuestions: [
      "Why is cache eviction (LRU/LFU) different from cache invalidation?",
      "What is the trade-off between Cache-Aside (Lazy Loading) and Write-Through caching?"
    ],
    commonMisconceptions: [
      {
        misconception: "Setting a TTL on cache solves all consistency issues.",
        correctionScenario: "Explain what happens during a viral flash sale when an item sells out in 2 seconds but TTL is 60 seconds."
      }
    ],
    practicalChallenge: {
      task: "Design the caching layer for an Instagram/Twitter user profile page with 100M daily active users.",
      defensePrompt: "Why did you choose Cache-Aside vs Write-Through, and how do you prevent the cache stampede (thundering herd) problem?",
      constraints: ["99:1 Read to Write ratio", "P99 read latency < 5ms", "Instant update required on user bio change"]
    },
    hintLadder: {
      level1: "99% of requests are reads. Do we want to load data into the cache on write or on first read?",
      level2: "Cache-Aside avoids caching keys that are never read, but first read suffers cache miss latency.",
      level3: "On bio update: write to database first, then actively evict (delete) the Redis key instead of overwriting.",
      level4: "To avoid thundering herd on popular profiles: use distributed mutex (e.g. singleflight or Redis lock with TTL).",
      level5: "Use Redis Cache-Aside. On write: DB commit -> Redis DEL. On read miss: acquire singleflight lock -> fetch from DB -> SETEX with jittered TTL -> return."
    }
  },

  "sys-db-scaling": {
    id: "sys-db-scaling",
    title: "Database Partitioning (Sharding) vs Replication",
    domain: "System Design",
    prerequisites: ["sys-caching"],
    coreQuestions: [
      "What is the exact distinction between horizontal database scaling (sharding) and read-replica scaling?",
      "If you shard users by user_id % 16, what happens when you need to query orders across all users in Mumbai?"
    ],
    commonMisconceptions: [
      {
        misconception: "Horizontal scaling and replication are the same thing.",
        correctionScenario: "Replication copies all data to multiple nodes (scales reads). Sharding splits data subsets across nodes (scales write capacity and storage limit)."
      }
    ],
    practicalChallenge: {
      task: "Design the data storage architecture for a ride-sharing app with 1 billion completed rides and 50,000 new rides per minute.",
      defensePrompt: "Why can't you just add 10 read replicas to handle this scale? Why is sharding mandatory here?",
      constraints: ["50,000 writes/sec exceeds single node IOPS", "Total storage > 50 Terabytes"]
    },
    hintLadder: {
      level1: "Replicas only scale read throughput. All write transactions must still hit the primary node.",
      level2: "When write IOPS or storage exceeds what a single machine can physically execute, you must partition the data.",
      level3: "Choose a partition key (e.g. city_id + time_bucket or user_id) to localize high-frequency transactions.",
      level4: "Use consistent hashing to shard across database clusters, with secondary indexing handled by an asynchronous search cluster.",
      level5: "Primary storage: Sharded PostgreSQL by city_id + ride_uuid via Citus/Vitess. Secondary indexing: CDC to Elasticsearch/Kafka for geo-spatial queries."
    }
  },

  "sys-consistency-cap": {
    id: "sys-consistency-cap",
    title: "CAP Theorem & Distributed Consistency",
    domain: "System Design",
    prerequisites: ["sys-db-scaling"],
    coreQuestions: [
      "In a network partition, why can you never have both linearizable Consistency and 100% Availability?",
      "What is the difference between Strong Consistency, Eventual Consistency, and Read-Your-Own-Writes consistency?"
    ],
    commonMisconceptions: [
      {
        misconception: "You can choose 'C and A' and ignore 'P'.",
        correctionScenario: "Network partitions in distributed systems are inevitable physical realities (cable cut, router failure, GC pause). You must choose behavior DURING a partition."
      }
    ],
    practicalChallenge: {
      task: "Design the checkout inventory deduction system for an airline seat reservation engine.",
      defensePrompt: "Why must this be a CP (Consistent/Partition-Tolerant) system rather than AP (Available/Partition-Tolerant)?",
      constraints: ["Zero double-booking allowed under any network condition"]
    },
    hintLadder: {
      level1: "What is worse for an airline: turning down a customer booking attempt or selling the exact same seat twice?",
      level2: "Selling the same seat twice causes legal and operational chaos. You cannot allow stale reads or partitioned split-brain writes.",
      level3: "You must sacrifice availability during a network split rather than allow split-brain writes.",
      level4: "Use a consensus algorithm (Raft / Paxos) or distributed ACID database (Spanner / CockroachDB) that requires quorum.",
      level5: "Implement Raft consensus with leaseholders (e.g. CockroachDB) enforcing linearizable isolation on seat allocation."
    }
  },

  // ──────────────────────────────────────────────────────────
  // DOMAIN 2: DATA STRUCTURES & ALGORITHMS (DSA)
  // ──────────────────────────────────────────────────────────
  "dsa-two-pointers": {
    id: "dsa-two-pointers",
    title: "Two Pointers & Sliding Window",
    domain: "DSA",
    prerequisites: [],
    coreQuestions: [
      "Why does sorting an array allow a two-pointer approach to find a target sum in O(N) instead of O(N^2)?",
      "When expanding and shrinking a sliding window, what invariant must be maintained at every step?"
    ],
    commonMisconceptions: [
      {
        misconception: "Sliding window works with negative numbers for subarray sum problems.",
        correctionScenario: "Show how negative numbers break the monotonicity invariant required to decide when to shrink the window."
      }
    ],
    practicalChallenge: {
      task: "Find the length of the longest substring without repeating characters in string S.",
      defensePrompt: "Why does the sliding window with a hash map run in O(N) time even though there is an inner while loop?",
      constraints: ["Time complexity O(N)", "Space complexity O(min(N, M)) where M is character set size"]
    },
    hintLadder: {
      level1: "Keep a window [left, right]. Expand right. What tells you when the window is invalid?",
      level2: "When you see a duplicate character, shrink left until the window has only unique characters.",
      level3: "Instead of moving left by 1 each time, store the last seen index of each character to jump left forward directly.",
      level4: "Map<char, int> lastSeen. If s[right] in map and map[s[right]] >= left: left = map[s[right]] + 1.",
      level5: "for (int right = 0; right < n; right++) { if (last[s[right]] >= left) left = last[s[right]] + 1; maxLen = max(maxLen, right - left + 1); last[s[right]] = right; }"
    }
  },

  "dsa-trees-graphs": {
    id: "dsa-trees-graphs",
    title: "Binary Trees, BFS & DFS Traversals",
    domain: "DSA",
    prerequisites: ["dsa-two-pointers"],
    coreQuestions: [
      "What is the operational difference between the call stack in recursion (DFS) and a FIFO queue (BFS)?",
      "How do you detect a cycle in a directed graph vs an undirected graph?"
    ],
    commonMisconceptions: [
      {
        misconception: "DFS always uses less memory than BFS.",
        correctionScenario: "In a degenerate skewed tree of depth N, DFS uses O(N) call stack, while BFS on a complete binary tree uses O(N/2) leaf nodes."
      }
    ],
    practicalChallenge: {
      task: "Given an undirected social graph, find the shortest connection path between two users.",
      defensePrompt: "Why is BFS guaranteed to find the shortest path in an unweighted graph, whereas DFS is not?",
      constraints: ["Graph can contain cycles", "Unweighted edges", "Return minimum hop count"]
    },
    hintLadder: {
      level1: "BFS explores layer by layer (distance 1, distance 2, etc.). Does DFS explore layer by layer?",
      level2: "Because BFS visits nodes in non-decreasing order of distance from the source, the first time target is popped from queue, it is shortest path.",
      level3: "Queue<Node> queue. Set<Node> visited. Keep track of current level count.",
      level4: "Initialize queue with start. While queue not empty: size = queue.size(). For each node in level: if node == target return level; add unvisited neighbors.",
      level5: "Standard BFS: queue.push(start), visited.add(start). Level loop: increment hops, return immediately when neighbor == target."
    }
  },

  // ──────────────────────────────────────────────────────────
  // DOMAIN 3: BACKEND & DISTRIBUTED SYSTEMS
  // ──────────────────────────────────────────────────────────
  "be-sql-indexing": {
    id: "be-sql-indexing",
    title: "SQL Indexing, B-Trees & Query Optimization",
    domain: "Backend & Distributed Systems",
    prerequisites: [],
    coreQuestions: [
      "Why does a database use a B+ Tree instead of a Binary Search Tree or Hash Map for disk-based indexing?",
      "If you have a compound index on (status, created_at), why will WHERE created_at > NOW() NOT use the index effectively?"
    ],
    commonMisconceptions: [
      {
        misconception: "Adding an index on every column makes all queries fast.",
        correctionScenario: "Every write/update must update all indexes on disk, and unneeded indexes cause severe write throughput collapse and memory pressure."
      }
    ],
    practicalChallenge: {
      task: "A query 'SELECT * FROM orders WHERE user_id = 42 ORDER BY created_at DESC LIMIT 20' is scanning 5 million rows in 4.2 seconds. Fix it.",
      defensePrompt: "Why does an index on (user_id, created_at DESC) eliminate the filesort, and what does EXPLAIN show?",
      constraints: ["Execution time must drop under 10ms", "Table size: 50 million rows"]
    },
    hintLadder: {
      level1: "If you only index user_id, the database finds all user 42 orders, then has to sort them in memory (filesort).",
      level2: "A compound index stores keys sorted first by the first column, and within identical first columns, sorted by the second column.",
      level3: "Create compound index: CREATE INDEX idx_orders_user_created ON orders (user_id, created_at DESC).",
      level4: "The B+ Tree will seek directly to user_id = 42, traverse the leaves in pre-sorted created_at order, and stop after 20 rows.",
      level5: "CREATE INDEX idx_user_created ON orders (user_id, created_at DESC); Query uses Index Scan backward, 0 rows sorted in memory, latency < 2ms."
    }
  },

  // ──────────────────────────────────────────────────────────
  // DOMAIN 4: AI / MACHINE LEARNING
  // ──────────────────────────────────────────────────────────
  "ai-embeddings-rag": {
    id: "ai-embeddings-rag",
    title: "Vector Embeddings & Retrieval-Augmented Generation (RAG)",
    domain: "AI / Machine Learning",
    prerequisites: [],
    coreQuestions: [
      "What does a vector embedding actually represent, and why does cosine similarity measure semantic closeness?",
      "Why is RAG preferred over fine-tuning for giving an LLM access to private, frequently changing company documents?"
    ],
    commonMisconceptions: [
      {
        misconception: "Fine-tuning an LLM is the best way to teach it new facts and documents.",
        correctionScenario: "Fine-tuning updates stylistic patterns and behaviors but is prone to hallucination for factual document retrieval. RAG grounds generation in verifiable text chunks."
      }
    ],
    practicalChallenge: {
      task: "Design a question-answering system over a 10,000-page internal medical handbook that cites exact paragraph numbers.",
      defensePrompt: "How do chunking size and overlap affect retrieval accuracy, and how do you prevent hallucinated citations?",
      constraints: ["Strict medical accuracy", "Zero hallucinations allowed on drug dosages"]
    },
    hintLadder: {
      level1: "LLMs cannot read 10,000 pages in one prompt context. How do we find the relevant 3 paragraphs?",
      level2: "Chunk documents with overlap (e.g. 500 tokens with 50-token overlap). Generate embeddings and store in vector DB with metadata (page/section).",
      level3: "Query -> query embedding -> top-K vector search -> prompt: 'Answer ONLY using the provided excerpts below. Cite source. If not found, say Unknown.'",
      level4: "Add re-ranking (cross-encoder) on the top 10 retrieved chunks to filter semantic noise before passing to LLM.",
      level5: "Pipeline: Chunking + Metadata -> text-embedding-3 -> HNSW Vector Index -> Top 15 -> Cohere Rerank -> Top 3 -> Grounded LLM Prompt with citation enforcement."
    }
  }
};

/**
 * Helper to get available domain names
 */
export function getSupportedDomains(): string[] {
  return [
    "System Design",
    "DSA & Problem Solving",
    "Backend & Distributed Systems",
    "AI / Machine Learning",
    "Full Stack Web Development"
  ];
}

/**
 * Get nodes belonging to a domain
 */
export function getDomainNodes(domain: string): KnowledgeGraphNode[] {
  const norm = domain.toLowerCase();
  return Object.values(KNOWLEDGE_GRAPH).filter(
    (n) => n.domain.toLowerCase().includes(norm) || norm.includes(n.domain.toLowerCase())
  );
}

/**
 * Get ordered concept prerequisites
 */
export function getMissingPrerequisites(conceptId: string, demonstratedConceptIds: string[]): string[] {
  const node = KNOWLEDGE_GRAPH[conceptId];
  if (!node) return [];
  return node.prerequisites.filter((p) => !demonstratedConceptIds.includes(p));
}
