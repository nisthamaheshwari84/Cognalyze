/**
 * lib/question-bank/role-taxonomy.ts
 *
 * Dynamic Role-Dependent Question Taxonomy for Cognalyze.
 *
 * Adapts interview categories, topic weightages, and evaluation rubrics
 * based on the target role selected by the candidate.
 */

import { resolveCanonicalRole } from "./canonical-identity";

export interface RoleTaxonomyConfig {
  role: string;
  categoryPriorities: {
    category: string;
    weightPercentage: number;
    description: string;
    mustHaveTopics: string[];
  }[];
  primaryInterviewRounds: string[];
  difficultyExpectation: {
    easyPercentage: number;
    mediumPercentage: number;
    hardPercentage: number;
  };
}

export const ROLE_TAXONOMY_MAP: Record<string, RoleTaxonomyConfig> = {
  "Software Engineer": {
    role: "Software Engineer",
    categoryPriorities: [
      {
        category: "DSA",
        weightPercentage: 40,
        description: "Algorithmic problem solving, data structures, complexity bounds",
        mustHaveTopics: ["Arrays", "Two Pointers", "Trees & Graphs", "Dynamic Programming", "Hash Maps"]
      },
      {
        category: "System Design",
        weightPercentage: 25,
        description: "Low-level design (OOP) and high-level distributed systems",
        mustHaveTopics: ["SOLID Principles", "Design Patterns", "Microservices", "Scalability", "Caching"]
      },
      {
        category: "DBMS",
        weightPercentage: 15,
        description: "Relational modeling, indexing, transaction isolation",
        mustHaveTopics: ["ACID Properties", "B-Tree Indexing", "SQL Joins", "Normalization", "Transactions"]
      },
      {
        category: "Operating Systems",
        weightPercentage: 10,
        description: "Concurrency, memory management, process scheduling",
        mustHaveTopics: ["Virtual Memory", "Deadlocks", "Threads vs Processes", "Mutex & Semaphores"]
      },
      {
        category: "HR / Behavioral",
        weightPercentage: 10,
        description: "Collaboration, ownership, conflict resolution, STAR responses",
        mustHaveTopics: ["Ownership", "Cross-team Collaboration", "Handling Failure", "Mentorship"]
      }
    ],
    primaryInterviewRounds: ["Online Assessment", "Coding Round", "Technical Round 1", "Technical Round 2", "System Design", "HR"],
    difficultyExpectation: { easyPercentage: 20, mediumPercentage: 55, hardPercentage: 25 }
  },

  "SDE": {
    role: "SDE",
    categoryPriorities: [
      {
        category: "DSA",
        weightPercentage: 45,
        description: "Core algorithm design, binary search, graph traversals, memoization",
        mustHaveTopics: ["Binary Search", "Heaps", "Graphs (BFS/DFS)", "Dynamic Programming", "Sliding Window"]
      },
      {
        category: "OOP",
        weightPercentage: 20,
        description: "Object-oriented design, class modeling, design patterns",
        mustHaveTopics: ["Inheritance vs Composition", "Factory & Singleton", "Observer Pattern", "Strategy Pattern"]
      },
      {
        category: "System Design",
        weightPercentage: 20,
        description: "Scalable architecture, API gateways, load balancers, database sharding",
        mustHaveTopics: ["CAP Theorem", "Consistent Hashing", "Rate Limiting", "Message Queues"]
      },
      {
        category: "HR / Behavioral",
        weightPercentage: 15,
        description: "Engineering leadership principles, delivery velocity, bar-raiser standards",
        mustHaveTopics: ["Customer Obsession", "Deliver Results", "Bias for Action", "Deep Dive"]
      }
    ],
    primaryInterviewRounds: ["Online Assessment", "Technical Screen", "Technical Round 1", "Machine Coding (LLD)", "System Architecture", "Bar-Raiser"],
    difficultyExpectation: { easyPercentage: 15, mediumPercentage: 60, hardPercentage: 25 }
  },

  "Backend Developer": {
    role: "Backend Developer",
    categoryPriorities: [
      {
        category: "System Design",
        weightPercentage: 35,
        description: "Distributed backends, fault tolerance, replication, caching",
        mustHaveTopics: ["Microservices", "Kafka / Event Streams", "Redis / Memcached", "Database Sharding", "gRPC vs REST"]
      },
      {
        category: "DBMS",
        weightPercentage: 25,
        description: "Deep database internals, query optimization, NoSQL vs Relational",
        mustHaveTopics: ["PostgreSQL Optimization", "Query Execution Plans", "Connection Pooling", "Distributed Locks"]
      },
      {
        category: "DSA",
        weightPercentage: 25,
        description: "Data structures for backend systems (hash tables, trees, heaps, LRU caches)",
        mustHaveTopics: ["Hash Maps", "LRU Cache", "Priority Queues", "String Tokenization"]
      },
      {
        category: "Computer Networks",
        weightPercentage: 15,
        description: "Network layer, HTTP/2, HTTP/3, TCP handshake, TLS, WebSockets",
        mustHaveTopics: ["TCP vs UDP", "TLS Handshake", "WebSockets", "DNS Lifecycle", "CORS"]
      }
    ],
    primaryInterviewRounds: ["Online Assessment", "Technical Round 1", "Machine Coding", "System Architecture", "Managerial"],
    difficultyExpectation: { easyPercentage: 15, mediumPercentage: 55, hardPercentage: 30 }
  },

  "Frontend Developer": {
    role: "Frontend Developer",
    categoryPriorities: [
      {
        category: "Web Development",
        weightPercentage: 45,
        description: "Modern JavaScript, TypeScript, React ecosystem, DOM manipulation",
        mustHaveTopics: ["Event Loop & Microtasks", "Closures & Prototypes", "React Hooks & Fiber", "SSR vs CSR", "Virtual DOM"]
      },
      {
        category: "System Design",
        weightPercentage: 25,
        description: "Frontend system design: state management, asset bundling, micro-frontends",
        mustHaveTopics: ["Virtualization & Infinite Scroll", "Design Systems", "Web Performance & Core Web Vitals", "Security (XSS/CSRF)"]
      },
      {
        category: "DSA",
        weightPercentage: 20,
        description: "Client-side problem solving: trees (DOM traversal), debounce/throttle, parsing",
        mustHaveTopics: ["DOM Tree Traversal", "Debouncing & Throttling", "Deep Clone / Flatten", "LRU Cache"]
      },
      {
        category: "HR / Behavioral",
        weightPercentage: 10,
        description: "Product collaboration, UX alignment, cross-functional execution",
        mustHaveTopics: ["Design Collaboration", "Accessibility (a11y)", "Mentoring", "Code Review"]
      }
    ],
    primaryInterviewRounds: ["Online Assessment", "Machine Coding (UI Component)", "Technical Round 1", "Frontend Architecture", "Culture Fit"],
    difficultyExpectation: { easyPercentage: 25, mediumPercentage: 55, hardPercentage: 20 }
  },

  "Full Stack Developer": {
    role: "Full Stack Developer",
    categoryPriorities: [
      {
        category: "Web Development",
        weightPercentage: 30,
        description: "Full-stack framework mastery, client-server lifecycle, state sync",
        mustHaveTopics: ["React / Next.js", "REST/GraphQL APIs", "State Management", "Authentication & JWT"]
      },
      {
        category: "DBMS",
        weightPercentage: 25,
        description: "Full-stack database modeling, ORMs, schema migrations",
        mustHaveTopics: ["PostgreSQL", "Prisma / TypeORM", "Indexes", "Redis Caching"]
      },
      {
        category: "DSA",
        weightPercentage: 25,
        description: "General problem solving, data structures, recursion, arrays",
        mustHaveTopics: ["Arrays & Strings", "Linked Lists", "Trees", "Sorting & Searching"]
      },
      {
        category: "System Design",
        weightPercentage: 20,
        description: "End-to-end full stack architecture, deployment, CDN, containerization",
        mustHaveTopics: ["Full-Stack Architecture", "Docker", "CI/CD", "Rate Limiting"]
      }
    ],
    primaryInterviewRounds: ["Coding Assessment", "Machine Coding (Full Stack)", "Technical Round 1", "System Design", "HR"],
    difficultyExpectation: { easyPercentage: 25, mediumPercentage: 55, hardPercentage: 20 }
  },

  "Data Scientist": {
    role: "Data Scientist",
    categoryPriorities: [
      {
        category: "AI / ML",
        weightPercentage: 40,
        description: "Supervised & unsupervised learning, model evaluation, deep learning",
        mustHaveTopics: ["Regression & Classification", "Random Forests / XGBoost", "Bias-Variance Tradeoff", "Cross-Validation", "Neural Networks"]
      },
      {
        category: "Aptitude",
        weightPercentage: 25,
        description: "Statistics, probability distributions, hypothesis testing, Bayes theorem",
        mustHaveTopics: ["Probability Distributions", "Hypothesis Testing (p-values)", "Central Limit Theorem", "A/B Testing"]
      },
      {
        category: "DBMS",
        weightPercentage: 20,
        description: "Analytical SQL, aggregation, window functions, feature stores",
        mustHaveTopics: ["Window Functions (RANK, OVER)", "CTE & Subqueries", "Aggregations", "Data Modeling"]
      },
      {
        category: "Programming",
        weightPercentage: 15,
        description: "Python, Pandas, NumPy, Vectorized calculations",
        mustHaveTopics: ["Pandas DataFrames", "NumPy Vectorization", "Data Cleaning", "Matplotlib / Seaborn"]
      }
    ],
    primaryInterviewRounds: ["Technical Screening", "Live Coding / Data Analysis", "ML Architecture & Modeling", "Case Study", "Hiring Manager"],
    difficultyExpectation: { easyPercentage: 20, mediumPercentage: 50, hardPercentage: 30 }
  },

  "ML Engineer": {
    role: "ML Engineer",
    categoryPriorities: [
      {
        category: "AI / ML",
        weightPercentage: 45,
        description: "Production ML, deep learning, PyTorch, model optimization, loss functions",
        mustHaveTopics: ["Backpropagation & Optimizers", "Transformers & Attention", "Embeddings", "PyTorch Custom Modules", "Quantization"]
      },
      {
        category: "System Design",
        weightPercentage: 25,
        description: "Machine learning system design: feature stores, model serving, inference pipelines",
        mustHaveTopics: ["Recommendation Systems", "Real-time Inference", "Batch vs Streaming", "Monitoring Concept Drift"]
      },
      {
        category: "DSA",
        weightPercentage: 20,
        description: "Python / C++ algorithmic problem solving, matrix math, graph algorithms",
        mustHaveTopics: ["Matrix Operations", "Graphs", "Dynamic Programming", "Heaps"]
      },
      {
        category: "Programming",
        weightPercentage: 10,
        description: "Python production engineering, Docker, GPU concurrency",
        mustHaveTopics: ["CUDA Basics", "Multi-processing", "Docker for ML", "FastAPI / Triton"]
      }
    ],
    primaryInterviewRounds: ["Coding Assessment", "ML Problem Solving", "ML System Design", "Research Deep Dive", "Culture"],
    difficultyExpectation: { easyPercentage: 15, mediumPercentage: 55, hardPercentage: 30 }
  },

  "AI Engineer": {
    role: "AI Engineer",
    categoryPriorities: [
      {
        category: "Generative AI",
        weightPercentage: 50,
        description: "LLMs, prompt engineering, RAG pipelines, fine-tuning, agent architecture",
        mustHaveTopics: ["RAG Architecture", "Vector Databases (Pinecone/Milvus)", "Embedding Models", "Function Calling / Tools", "Hallucination Mitigation"]
      },
      {
        category: "System Design",
        weightPercentage: 25,
        description: "Autonomous agent design, multi-agent orchestrations, token caching, streaming APIs",
        mustHaveTopics: ["Agent Loop Architecture", "Semantic Caching", "Rate-Limiting & Quotas", "Context Window Management"]
      },
      {
        category: "Programming",
        weightPercentage: 15,
        description: "Python, LangChain/LlamaIndex, OpenAI/Groq/Anthropic APIs, async handling",
        mustHaveTopics: ["Async Python", "Streaming SSE", "Structured JSON Outputs", "Pydantic Schemas"]
      },
      {
        category: "DSA",
        weightPercentage: 10,
        description: "Core algorithms, cosine similarity, graph trees",
        mustHaveTopics: ["Cosine Similarity", "k-Nearest Neighbors (k-NN)", "Trie", "Hash Maps"]
      }
    ],
    primaryInterviewRounds: ["Technical Screening", "GenAI Architecture Coding", "Autonomous Agent System Design", "Security & Guardrails", "Managerial"],
    difficultyExpectation: { easyPercentage: 15, mediumPercentage: 50, hardPercentage: 35 }
  },

  "Data Analyst": {
    role: "Data Analyst",
    categoryPriorities: [
      {
        category: "DBMS",
        weightPercentage: 50,
        description: "Advanced SQL mastery: Window functions, self joins, pivots, aggregations",
        mustHaveTopics: ["Window Functions (LEAD, LAG, DENSE_RANK)", "Pivots & CTEs", "Cohort Analysis", "Retention Queries"]
      },
      {
        category: "Aptitude",
        weightPercentage: 25,
        description: "Business analytics, metric design, KPI modeling, hypothesis testing",
        mustHaveTopics: ["A/B Testing", "KPI Trees", "Churn & LTV Modeling", "Root-Cause Diagnostics"]
      },
      {
        category: "Programming",
        weightPercentage: 15,
        description: "Python data manipulation, Pandas, visualization libraries",
        mustHaveTopics: ["Pandas GroupBy & Merge", "Data Cleaning", "Matplotlib / Seaborn"]
      },
      {
        category: "HR / Behavioral",
        weightPercentage: 10,
        description: "Stakeholder communication, executive presentation of insights",
        mustHaveTopics: ["Explaining Complex Insights to Non-Tech", "Prioritization", "Cross-functional Impact"]
      }
    ],
    primaryInterviewRounds: ["SQL Screen", "Business Case Study", "Live Data Analysis", "Presentation & Stakeholder Fit"],
    difficultyExpectation: { easyPercentage: 30, mediumPercentage: 55, hardPercentage: 15 }
  },

  "Product Manager": {
    role: "Product Manager",
    categoryPriorities: [
      {
        category: "HR / Behavioral",
        weightPercentage: 40,
        description: "Product sense, customer empathy, stakeholder alignment, STAR stories",
        mustHaveTopics: ["Product Design (Design X for Y)", "Root Cause Analysis", "Pricing Strategy", "Conflict Resolution"]
      },
      {
        category: "Aptitude",
        weightPercentage: 30,
        description: "Estimation, market sizing, metrics formulation, north star definition",
        mustHaveTopics: ["Guesstimates & Sizing", "North Star Metrics", "A/B Test Design", "Unit Economics"]
      },
      {
        category: "System Design",
        weightPercentage: 20,
        description: "Technical literacy: API architecture, database trade-offs, scalability constraints",
        mustHaveTopics: ["API Endpoints", "Latency vs Throughput", "Scalability Limits", "Technical Trade-offs"]
      },
      {
        category: "DBMS",
        weightPercentage: 10,
        description: "Basic SQL queries for metric pulling and funnel analysis",
        mustHaveTopics: ["SQL Select & GroupBy", "Funnel Conversion", "Aggregation"]
      }
    ],
    primaryInterviewRounds: ["Product Sense Round", "Product Execution & Metrics", "Technical Fluency Round", "Leadership & Vision"],
    difficultyExpectation: { easyPercentage: 20, mediumPercentage: 55, hardPercentage: 25 }
  },

  "DevOps Engineer": {
    role: "DevOps Engineer",
    categoryPriorities: [
      {
        category: "Operating Systems",
        weightPercentage: 35,
        description: "Linux system internals, bash scripting, process management, storage",
        mustHaveTopics: ["Linux Commands & Pipes", "Systemd Services", "File Permissions & ACLs", "Kernel Parameters", "Bash Scripting"]
      },
      {
        category: "System Design",
        weightPercentage: 30,
        description: "Cloud infrastructure, Kubernetes, CI/CD, Terraform, service meshes",
        mustHaveTopics: ["Kubernetes Pods & Ingress", "Docker Multistage Builds", "CI/CD Pipelines", "Terraform IaC", "Prometheus & Grafana"]
      },
      {
        category: "Computer Networks",
        weightPercentage: 20,
        description: "DNS, load balancing, SSL/TLS certificates, firewalls, subnets, VPCs",
        mustHaveTopics: ["VPC & Subnets", "Load Balancers (ALB/NLB)", "SSL/TLS Offloading", "BGP & Routing"]
      },
      {
        category: "Programming",
        weightPercentage: 15,
        description: "Automation scripting in Python or Go",
        mustHaveTopics: ["Python Automation", "REST API Integration", "JSON/YAML Parsing"]
      }
    ],
    primaryInterviewRounds: ["Linux & Scripting Assessment", "Live Troubleshooting & Debugging", "Architecture & Infrastructure as Code", "Incident Response"],
    difficultyExpectation: { easyPercentage: 20, mediumPercentage: 55, hardPercentage: 25 }
  },

  "Cloud Engineer": {
    role: "Cloud Engineer",
    categoryPriorities: [
      {
        category: "System Design",
        weightPercentage: 40,
        description: "Multi-cloud architecture (AWS/GCP/Azure), serverless, high availability",
        mustHaveTopics: ["AWS IAM & Security", "Serverless (Lambda/Cloud Functions)", "Storage Tiers (S3/Blob)", "Disaster Recovery & Multi-Region"]
      },
      {
        category: "Computer Networks",
        weightPercentage: 25,
        description: "Cloud networking: VPCs, Direct Connect, VPNs, CDN (CloudFront)",
        mustHaveTopics: ["VPC Peering & Transit Gateway", "CloudFront / CDN", "Route 53 DNS", "NAT Gateways"]
      },
      {
        category: "Operating Systems",
        weightPercentage: 20,
        description: "Virtualization, EC2/VM instances, container runtimes",
        mustHaveTopics: ["Linux Administration", "Containerization", "Security Hardening"]
      },
      {
        category: "DBMS",
        weightPercentage: 15,
        description: "Managed cloud databases (RDS, Aurora, DynamoDB, Cosmos DB)",
        mustHaveTopics: ["Aurora Replication", "DynamoDB Partition Keys", "Backup & Recovery"]
      }
    ],
    primaryInterviewRounds: ["Cloud Architecture Screen", "Hands-on Infrastructure Lab", "Security & Reliability Review", "Managerial"],
    difficultyExpectation: { easyPercentage: 20, mediumPercentage: 55, hardPercentage: 25 }
  },

  "Cybersecurity Engineer": {
    role: "Cybersecurity Engineer",
    categoryPriorities: [
      {
        category: "Computer Networks",
        weightPercentage: 35,
        description: "Network security, packet analysis, firewalls, intrusion detection, VPNs",
        mustHaveTopics: ["TCP/IP Vulnerabilities", "Wireshark Packet Inspection", "Firewall Rules & WAF", "DDoS Mitigation"]
      },
      {
        category: "Operating Systems",
        weightPercentage: 25,
        description: "OS security, Linux privilege escalation, memory exploits, access controls",
        mustHaveTopics: ["Buffer Overflow", "Privilege Escalation", "SELinux", "Authentication (PAM/Kerberos)"]
      },
      {
        category: "Web Development",
        weightPercentage: 25,
        description: "Application security, OWASP Top 10, penetration testing, secure coding",
        mustHaveTopics: ["SQL Injection", "XSS & CSRF", "CORS Misconfigurations", "Authentication Flaws (JWT)"]
      },
      {
        category: "Aptitude",
        weightPercentage: 15,
        description: "Cryptography, public key infrastructure, hashing algorithms, AES/RSA",
        mustHaveTopics: ["Symmetric vs Asymmetric Crypto", "Hashing vs Encryption", "PKI & Certificates", "Zero Trust Architecture"]
      }
    ],
    primaryInterviewRounds: ["Security Fundamentals Screen", "Hands-on Vulnerability / CTF Assessment", "Threat Modeling & Architecture", "Incident Management"],
    difficultyExpectation: { easyPercentage: 15, mediumPercentage: 55, hardPercentage: 30 }
  }
};

export const ROLE_TAXONOMIES = ROLE_TAXONOMY_MAP;

/**
 * Returns the taxonomy configuration for a given role name or role ID.
 * Defaults cleanly to "Software Engineer" taxonomy.
 */
export function getRoleTaxonomy(roleNameOrId: string): RoleTaxonomyConfig {
  const normalized = (roleNameOrId || "").trim().toLowerCase();
  for (const [key, tax] of Object.entries(ROLE_TAXONOMY_MAP)) {
    if (
      key.toLowerCase() === normalized ||
      (tax.role && tax.role.toLowerCase() === normalized)
    ) {
      return tax;
    }
  }
  // Try resolving canonical role name
  const canonicalName = resolveCanonicalRole(roleNameOrId);
  if (ROLE_TAXONOMY_MAP[canonicalName]) {
    return ROLE_TAXONOMY_MAP[canonicalName];
  }
  return ROLE_TAXONOMY_MAP["Software Engineer"];
}

/**
 * Retrieves the weight percentage for a specific category within a role.
 */
export function getRoleCategoryWeight(roleNameOrId: string, category: string): number {
  const tax = getRoleTaxonomy(roleNameOrId);
  const catLower = category.toLowerCase().trim();
  const match = (tax.categoryPriorities || []).find(c => {
    const cName = c.category.toLowerCase().trim();
    if (cName === catLower || cName.includes(catLower) || catLower.includes(cName)) return true;
    if (catLower === "sql" && (cName === "dbms" || c.description.toLowerCase().includes("sql"))) return true;
    return false;
  });
  return match ? match.weightPercentage : 0;
}

/**
 * Retrieves all must-have topics for a role across its core categories.
 */
export function getRoleMustHaveTopics(roleNameOrId: string): string[] {
  const tax = getRoleTaxonomy(roleNameOrId);
  const topics: string[] = [];
  for (const c of (tax.categoryPriorities || [])) {
    topics.push(...c.mustHaveTopics);
  }
  return Array.from(new Set(topics));
}
