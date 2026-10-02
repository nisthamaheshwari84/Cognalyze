/**
 * lib/dna/taxonomy.ts
 * CANONICAL SKILL TAXONOMY
 * 
 * Rules:
 * 1. Every skill maps to a single canonical skillId.
 * 2. Aliases map variations (e.g. "React.js", "ReactJS" -> "react").
 * 3. Supports categories, parent-child, related skills, prerequisites.
 * 4. Levels: 0=Unknown, 1=Familiar, 2=Beginner, 3=Intermediate, 4=Advanced, 5=Strongly Demonstrated.
 * 5. Unknown is explicitly distinct from zero.
 */

export type SkillCategory =
  | "Languages"
  | "Frontend"
  | "Backend & APIs"
  | "Data & Databases"
  | "Core CS & DSA"
  | "DevOps & Cloud"
  | "AI & ML"
  | "Communication & Behavioral";

export interface CanonicalSkill {
  skillId: string;
  name: string;
  aliases: string[];
  category: SkillCategory;
  parentSkillId?: string;
  childSkillIds?: string[];
  relatedSkillIds?: string[];
  prerequisites?: string[];
  proficiencyLevels: Record<1 | 2 | 3 | 4 | 5, { label: string; description: string }>;
}

export const CANONICAL_SKILL_TAXONOMY: Record<string, CanonicalSkill> = {
  // ── Languages ──
  python: {
    skillId: "python",
    name: "Python",
    aliases: ["python", "py", "python3", "python 3", "cpython"],
    category: "Languages",
    relatedSkillIds: ["fastapi", "django", "machine_learning"],
    proficiencyLevels: {
      1: { label: "Familiar", description: "Basic syntax, loops, and standard library data types." },
      2: { label: "Beginner", description: "Able to write scripts, functions, and work with files." },
      3: { label: "Intermediate", description: "OOP, generators, decorators, asynchronous programming, pip packages." },
      4: { label: "Advanced", description: "Performance optimization, memory profiling, metaprogramming, concurrency." },
      5: { label: "Strongly Demonstrated", description: "Multi-source verified in production frameworks, assessments, and high-quality repositories." }
    }
  },
  javascript: {
    skillId: "javascript",
    name: "JavaScript",
    aliases: ["javascript", "js", "es6", "es2020", "vanilla js", "ecmascript"],
    category: "Languages",
    childSkillIds: ["react", "node", "typescript"],
    proficiencyLevels: {
      1: { label: "Familiar", description: "Variables, DOM manipulation, simple events." },
      2: { label: "Beginner", description: "ES6 syntax, arrow functions, promises, fetch API." },
      3: { label: "Intermediate", description: "Async/await, closures, prototypes, event loop, error handling." },
      4: { label: "Advanced", description: "V8 internals, memory leak isolation, custom bundling, web workers." },
      5: { label: "Strongly Demonstrated", description: "Architected modern frontend/backend apps with verified benchmarks." }
    }
  },
  typescript: {
    skillId: "typescript",
    name: "TypeScript",
    aliases: ["typescript", "ts"],
    category: "Languages",
    parentSkillId: "javascript",
    relatedSkillIds: ["react", "node"],
    prerequisites: ["javascript"],
    proficiencyLevels: {
      1: { label: "Familiar", description: "Basic types, interfaces, and function signatures." },
      2: { label: "Beginner", description: "Generics, union/intersection types, tsconfig setup." },
      3: { label: "Intermediate", description: "Conditional types, mapped types, utility types, strict mode." },
      4: { label: "Advanced", description: "Type-level programming, AST transforms, complex template literal types." },
      5: { label: "Strongly Demonstrated", description: "Enterprise-grade type safety verified across multi-package repos." }
    }
  },
  java: {
    skillId: "java",
    name: "Java",
    aliases: ["java", "java8", "java 17", "java 21", "core java", "openjdk"],
    category: "Languages",
    relatedSkillIds: ["spring_boot", "dsa"],
    proficiencyLevels: {
      1: { label: "Familiar", description: "Basic syntax, primitive types, control flow." },
      2: { label: "Beginner", description: "OOP concepts, encapsulation, inheritance, basic collections." },
      3: { label: "Intermediate", description: "Multithreading, streams, generics, JVM memory basics." },
      4: { label: "Advanced", description: "JVM tuning, GC profiling, reactive streams, concurrency utilities." },
      5: { label: "Strongly Demonstrated", description: "High-throughput enterprise services verified via assessments and code." }
    }
  },
  cpp: {
    skillId: "cpp",
    name: "C++",
    aliases: ["cpp", "c++", "c/c++", "c plus plus", "modern c++"],
    category: "Languages",
    relatedSkillIds: ["dsa"],
    proficiencyLevels: {
      1: { label: "Familiar", description: "Pointers, arrays, basic functions." },
      2: { label: "Beginner", description: "OOP, basic STL vectors and strings." },
      3: { label: "Intermediate", description: "STL algorithms, templates, dynamic memory management, references." },
      4: { label: "Advanced", description: "Move semantics, RAII, custom allocators, smart pointers, lock-free queues." },
      5: { label: "Strongly Demonstrated", description: "Competitive programming achievements or low-latency systems code." }
    }
  },
  golang: {
    skillId: "golang",
    name: "Go",
    aliases: ["go", "golang"],
    category: "Languages",
    relatedSkillIds: ["docker", "rest_api", "system_design"],
    proficiencyLevels: {
      1: { label: "Familiar", description: "Go syntax, structs, slices, maps." },
      2: { label: "Beginner", description: "Interfaces, error handling, basic HTTP servers." },
      3: { label: "Intermediate", description: "Goroutines, channels, context, sync package." },
      4: { label: "Advanced", description: "Memory layout, garbage collection tuning, high-concurrency microservices." },
      5: { label: "Strongly Demonstrated", description: "Production-grade concurrent backend verified in repositories." }
    }
  },
  rust: {
    skillId: "rust",
    name: "Rust",
    aliases: ["rust", "rustlang"],
    category: "Languages",
    relatedSkillIds: ["system_design"],
    proficiencyLevels: {
      1: { label: "Familiar", description: "Syntax, ownership basics, cargo, primitive types." },
      2: { label: "Beginner", description: "Borrow checker, structs, enums, pattern matching." },
      3: { label: "Intermediate", description: "Traits, lifetimes, smart pointers, error handling with Result/Option." },
      4: { label: "Advanced", description: "Unsafe rust, concurrency, async tokio, macro programming." },
      5: { label: "Strongly Demonstrated", description: "Production systems, high performance CLI tools or engines." }
    }
  },

  // ── Frontend ──
  react: {
    skillId: "react",
    name: "React",
    aliases: ["react", "react.js", "reactjs", "react js"],
    category: "Frontend",
    parentSkillId: "javascript",
    relatedSkillIds: ["nextjs", "typescript"],
    prerequisites: ["javascript"],
    proficiencyLevels: {
      1: { label: "Familiar", description: "JSX, props, basic functional components." },
      2: { label: "Beginner", description: "useState, useEffect, event handling, simple forms." },
      3: { label: "Intermediate", description: "Custom hooks, useContext, performance profiling (useMemo/useCallback), router." },
      4: { label: "Advanced", description: "Server components, reconciliation engine, state architectures, micro-frontends." },
      5: { label: "Strongly Demonstrated", description: "Shipped complex production web apps with verified tests and audit." }
    }
  },
  nextjs: {
    skillId: "nextjs",
    name: "Next.js",
    aliases: ["next.js", "nextjs", "next js", "next"],
    category: "Frontend",
    parentSkillId: "react",
    relatedSkillIds: ["react", "typescript"],
    prerequisites: ["react"],
    proficiencyLevels: {
      1: { label: "Familiar", description: "File-system routing, pages router basics." },
      2: { label: "Beginner", description: "App router, SSR vs SSG, Link component." },
      3: { label: "Intermediate", description: "Server actions, middleware, API routes, streaming, ISR." },
      4: { label: "Advanced", description: "Edge runtime, partial prerendering, cache strategies, cold start tuning." },
      5: { label: "Strongly Demonstrated", description: "Full-stack Next.js applications deployed with production telemetry." }
    }
  },
  html_css: {
    skillId: "html_css",
    name: "HTML5 & Modern CSS",
    aliases: ["html", "html5", "css", "css3", "tailwind", "responsive design"],
    category: "Frontend",
    proficiencyLevels: {
      1: { label: "Familiar", description: "Semantic tags, basic selectors, margins/padding." },
      2: { label: "Beginner", description: "Flexbox, basic media queries, forms, accessibility attributes." },
      3: { label: "Intermediate", description: "CSS Grid, Tailwind CSS, animations, responsive layouts." },
      4: { label: "Advanced", description: "CSS architecture, subgrid, container queries, rendering engine paint cycles." },
      5: { label: "Strongly Demonstrated", description: "Pixel-perfect accessible design systems verified on live sites." }
    }
  },

  // ── Backend & APIs ──
  node: {
    skillId: "node",
    name: "Node.js",
    aliases: ["node", "node.js", "nodejs", "node js", "express", "express.js"],
    category: "Backend & APIs",
    parentSkillId: "javascript",
    relatedSkillIds: ["rest_api", "sql"],
    prerequisites: ["javascript"],
    proficiencyLevels: {
      1: { label: "Familiar", description: "npm basics, running scripts, standard modules." },
      2: { label: "Beginner", description: "Express routing, middleware, JSON responses." },
      3: { label: "Intermediate", description: "Streams, event emitter, JWT auth, database connections." },
      4: { label: "Advanced", description: "Cluster module, libuv event loop tuning, async hooks, memory profiling." },
      5: { label: "Strongly Demonstrated", description: "Scalable backend services tested with high load and security audits." }
    }
  },
  fastapi: {
    skillId: "fastapi",
    name: "FastAPI",
    aliases: ["fastapi", "fast api"],
    category: "Backend & APIs",
    parentSkillId: "python",
    relatedSkillIds: ["python", "rest_api"],
    prerequisites: ["python"],
    proficiencyLevels: {
      1: { label: "Familiar", description: "Basic route decorators, uvicorn startup." },
      2: { label: "Beginner", description: "Pydantic models, request validation, path/query params." },
      3: { label: "Intermediate", description: "Dependency injection, async endpoints, OAuth2/JWT security." },
      4: { label: "Advanced", description: "Background tasks, custom middleware, database connection pooling, WebSockets." },
      5: { label: "Strongly Demonstrated", description: "High-performance async APIs integrated with real datastores and AI models." }
    }
  },
  rest_api: {
    skillId: "rest_api",
    name: "REST APIs",
    aliases: ["rest", "rest api", "rest apis", "restful api", "restful apis", "api design"],
    category: "Backend & APIs",
    relatedSkillIds: ["node", "fastapi"],
    proficiencyLevels: {
      1: { label: "Familiar", description: "HTTP methods (GET, POST, PUT, DELETE), status codes." },
      2: { label: "Beginner", description: "CRUD endpoint design, request body parsing, query filters." },
      3: { label: "Intermediate", description: "Pagination, rate limiting, error schemas, authentication headers." },
      4: { label: "Advanced", description: "Idempotency keys, API versioning, OpenAPI specs, caching (ETags)." },
      5: { label: "Strongly Demonstrated", description: "Enterprise REST contracts with automated testing and OpenAPI validation." }
    }
  },
  system_design: {
    skillId: "system_design",
    name: "System Design",
    aliases: ["system design", "distributed systems", "software architecture", "scalability"],
    category: "Backend & APIs",
    relatedSkillIds: ["sql", "docker"],
    proficiencyLevels: {
      1: { label: "Familiar", description: "Client-server architecture, DNS, load balancing basics." },
      2: { label: "Beginner", description: "Horizontal vs vertical scaling, stateless servers, caching." },
      3: { label: "Intermediate", description: "Database sharding, replication, message queues, CAP theorem." },
      4: { label: "Advanced", description: "Distributed transactions, consensus (Raft/Paxos), event sourcing, high availability." },
      5: { label: "Strongly Demonstrated", description: "Proven architecture and deployment of multi-tier distributed systems." }
    }
  },

  // ── Data & Databases ──
  sql: {
    skillId: "sql",
    name: "SQL & Relational Databases",
    aliases: ["sql", "postgresql", "postgres", "mysql", "sqlite", "relational database", "rdbms"],
    category: "Data & Databases",
    proficiencyLevels: {
      1: { label: "Familiar", description: "Basic SELECT, WHERE, INSERT, UPDATE, DELETE queries." },
      2: { label: "Beginner", description: "JOINs (INNER, LEFT), GROUP BY, aggregate functions, primary keys." },
      3: { label: "Intermediate", description: "Subqueries, transactions, indexes, normalization (1NF-3NF)." },
      4: { label: "Advanced", description: "Window functions, query execution plan analysis, index optimization, locking." },
      5: { label: "Strongly Demonstrated", description: "Tuned complex relational databases under high concurrency with verified proofs." }
    }
  },
  nosql: {
    skillId: "nosql",
    name: "NoSQL & Key-Value Stores",
    aliases: ["nosql", "mongodb", "mongo", "redis", "dynamodb", "cassandra"],
    category: "Data & Databases",
    relatedSkillIds: ["sql"],
    proficiencyLevels: {
      1: { label: "Familiar", description: "Document/key-value concepts, JSON storage." },
      2: { label: "Beginner", description: "Basic CRUD in MongoDB or Redis SET/GET." },
      3: { label: "Intermediate", description: "Redis TTL, pub/sub, MongoDB aggregation pipelines, indexing." },
      4: { label: "Advanced", description: "Distributed Redis caching, cluster replication, eviction strategies." },
      5: { label: "Strongly Demonstrated", description: "Engineered sub-millisecond cache layers or large-scale document pipelines." }
    }
  },

  // ── Core CS & DSA ──
  dsa: {
    skillId: "dsa",
    name: "Data Structures & Algorithms",
    aliases: ["dsa", "data structures", "algorithms", "problem solving", "competitive programming", "leetcode"],
    category: "Core CS & DSA",
    proficiencyLevels: {
      1: { label: "Familiar", description: "Arrays, strings, time complexity basics (Big-O)." },
      2: { label: "Beginner", description: "Linked lists, stacks, queues, hash maps, binary search." },
      3: { label: "Intermediate", description: "Trees, graphs, BFS/DFS, recursion, sorting algorithms." },
      4: { label: "Advanced", description: "Dynamic programming, sliding window, backtracking, segment trees, trie." },
      5: { label: "Strongly Demonstrated", description: "High rating in competitive programming or verified 150+ medium/hard algorithmic solves." }
    }
  },
  cs_fundamentals: {
    skillId: "cs_fundamentals",
    name: "Computer Science Fundamentals",
    aliases: ["cs fundamentals", "operating systems", "os", "computer networks", "dbms", "oop"],
    category: "Core CS & DSA",
    proficiencyLevels: {
      1: { label: "Familiar", description: "Basic memory concepts, processes, TCP/IP overview." },
      2: { label: "Beginner", description: "Process vs thread, OOP pillars, relational schema basics." },
      3: { label: "Intermediate", description: "Deadlocks, virtual memory, paging, TCP 3-way handshake, ACID properties." },
      4: { label: "Advanced", description: "Kernel scheduling, network socket programming, transaction isolation levels." },
      5: { label: "Strongly Demonstrated", description: "Excellence demonstrated across technical interviews and system assessments." }
    }
  },

  // ── DevOps & Cloud ──
  git: {
    skillId: "git",
    name: "Git & Version Control",
    aliases: ["git", "github", "gitlab", "version control"],
    category: "DevOps & Cloud",
    proficiencyLevels: {
      1: { label: "Familiar", description: "git clone, git add, git commit, git push." },
      2: { label: "Beginner", description: "git branch, git checkout, merging, resolving basic conflicts." },
      3: { label: "Intermediate", description: "git rebase, pull request workflows, stash, cherry-pick." },
      4: { label: "Advanced", description: "Interactive rebasing, bisecting, reflog, Git hooks." },
      5: { label: "Strongly Demonstrated", description: "Maintained active open source repositories with clean branching hygiene." }
    }
  },
  docker: {
    skillId: "docker",
    name: "Docker & Containerization",
    aliases: ["docker", "containers", "dockerfile", "docker-compose"],
    category: "DevOps & Cloud",
    proficiencyLevels: {
      1: { label: "Familiar", description: "Running containers, docker ps, docker pull." },
      2: { label: "Beginner", description: "Writing basic Dockerfile, port mapping, environment variables." },
      3: { label: "Intermediate", description: "Multi-stage builds, docker-compose for multi-service apps, volumes." },
      4: { label: "Advanced", description: "Image optimization, security scanning, container networking, non-root users." },
      5: { label: "Strongly Demonstrated", description: "Deployed containerized production services with automated CI/CD pipelines." }
    }
  },

  // ── AI & ML ──
  machine_learning: {
    skillId: "machine_learning",
    name: "Machine Learning & AI",
    aliases: ["machine learning", "ml", "ai", "artificial intelligence", "deep learning", "pytorch", "tensorflow", "scikit-learn", "llm"],
    category: "AI & ML",
    parentSkillId: "python",
    proficiencyLevels: {
      1: { label: "Familiar", description: "Supervised vs unsupervised learning, basic metrics." },
      2: { label: "Beginner", description: "Linear regression, decision trees, data preprocessing with pandas/numpy." },
      3: { label: "Intermediate", description: "Random forests, neural networks, cross-validation, model evaluation." },
      4: { label: "Advanced", description: "Transformers, fine-tuning, embeddings, RAG pipelines, quantization." },
      5: { label: "Strongly Demonstrated", description: "Shipped deployed ML/AI applications with verified benchmarks and datasets." }
    }
  },

  // ── Communication & Behavioral ──
  communication: {
    skillId: "communication",
    name: "Technical Communication",
    aliases: ["communication", "spoken english", "articulation", "presentation", "clarity"],
    category: "Communication & Behavioral",
    proficiencyLevels: {
      1: { label: "Familiar", description: "Able to communicate basic project ideas." },
      2: { label: "Beginner", description: "Structures sentences without excessive stalling." },
      3: { label: "Intermediate", description: "Clearly explains technical architecture and personal roles without jargon." },
      4: { label: "Advanced", description: "Adapts technical explanations to non-technical stakeholders effortlessly." },
      5: { label: "Strongly Demonstrated", description: "Demonstrated excellence in technical and behavioral interviews." }
    }
  },
  leadership_ownership: {
    skillId: "leadership_ownership",
    name: "Extreme Ownership & Accountability",
    aliases: ["ownership", "accountability", "initiative", "leadership"],
    category: "Communication & Behavioral",
    proficiencyLevels: {
      1: { label: "Familiar", description: "Takes responsibility for assigned tasks." },
      2: { label: "Beginner", description: "Admits mistakes promptly rather than deflecting." },
      3: { label: "Intermediate", description: "Unblocks teammates, proactively resolves issues outside direct tickets." },
      4: { label: "Advanced", description: "Institutes mechanisms to permanently prevent recurring production bugs." },
      5: { label: "Strongly Demonstrated", description: "Consistently proven high agency across project deliveries and interviews." }
    }
  }
};

/**
 * Normalizes any freeform skill text to its canonical taxonomy representation.
 * Returns null if no match found.
 */
export function normalizeSkill(rawName: string): CanonicalSkill | null {
  if (!rawName || typeof rawName !== "string") return null;
  const clean = rawName.trim().toLowerCase();

  // 1. Direct match by skillId
  if (CANONICAL_SKILL_TAXONOMY[clean]) {
    return CANONICAL_SKILL_TAXONOMY[clean];
  }

  // 2. Exact match against aliases
  for (const skill of Object.values(CANONICAL_SKILL_TAXONOMY)) {
    if (skill.aliases.some(alias => alias === clean)) {
      return skill;
    }
  }

  // 3. Substring/fuzzy alias matching
  for (const skill of Object.values(CANONICAL_SKILL_TAXONOMY)) {
    if (skill.aliases.some(alias => clean.includes(alias) || alias.includes(clean))) {
      return skill;
    }
  }

  return null;
}

export function getCanonicalSkill(skillId: string): CanonicalSkill | null {
  return CANONICAL_SKILL_TAXONOMY[skillId] || null;
}

export function getAllCanonicalSkills(): CanonicalSkill[] {
  return Object.values(CANONICAL_SKILL_TAXONOMY);
}

export function getSkillsByCategory(category: SkillCategory): CanonicalSkill[] {
  return Object.values(CANONICAL_SKILL_TAXONOMY).filter(s => s.category === category);
}
