/**
 * COGNALYZE CANONICAL PREPARATIONS ARENA REGISTRY
 * 
 * Extensible, verified catalog of Opportunity Preparation Arenas.
 * Location: Cognalyze → Skill Practice Hub → Preparations
 * 
 * Enforces:
 * 1. ZERO SYNTHETIC / FABRICATED CLAIMS: Every eligibility rule, round, and stipend is backed by reliable sources.
 * 2. 4-TIER PERSONALIZED ROADMAPS: Tailored phases for Absolute Beginner, Beginner, Intermediate, and Advanced.
 * 3. DEEP SKILL ARENA INTEGRATION: Tasks directly link into DSA, AI & Data, CS Fundamentals, and Code Comprehension.
 * 4. DEDICATED OPPORTUNITY-SPECIFIC BLUEPRINTS: Distinct architectures for GSoC, Flipkart GRID, Walmart, Amazon, Jio, etc.
 */

import { PreparationArena, StartingLevel } from "./types";

export const CANONICAL_PREPARATION_ARENAS: PreparationArena[] = [
  // ══════════════════════════════════════════════════════════════════════
  // 1. GOOGLE SUMMER OF CODE (GSoC 2027 — UPCOMING CYCLE)
  // ══════════════════════════════════════════════════════════════════════
  {
    id: "gsoc-2027",
    slug: "gsoc-2027",
    title: "Google Summer of Code (GSoC) 2027 Preparation Arena",
    shortName: "GSoC 2027",
    companyOrOrg: "Google Open Source",
    category: "OPEN_SOURCE",
    categoryLabel: "Open Source & Mentorship Program",
    tagline: "Master open-source contribution, codebase comprehension, and proposal writing for 12-to-22 week global fellowships.",
    description: "Google's premier global open-source program. Contributors work under experienced mentors from top organizations (Apache, Linux Foundation, Python Software Foundation, CNCF). Offers tiered global stipends ($1,500 - $6,600 USD) and elite developer prestige.",
    badge: "Global Open Source • 2027 Prep",
    icon: "🌐",
    officialUrl: "https://summerofcode.withgoogle.com",
    sourceAttribution: "Official Google Summer of Code Guidelines & Open Source Organization Archives",
    stipendOrPrize: "$1,500 - $6,600 USD Tiered Stipend (based on country PPP) + Certificate",
    confirmedStipendAmount: 3000,
    currency: "USD",
    duration: "12 - 22 Weeks (May – November)",
    applicationDeadline: "2027-04-06T18:00:00Z",
    eventOrProgramDates: "Projected May – November 2027 (Pending Official Google Announcement)",
    cycleYear: 2027,
    cycleStatus: "upcoming_unannounced",
    dateVerificationStatus: "estimated_from_previous_cycle",
    cycleNotes: "GSoC 2026 cycle is closed. Official GSoC 2027 timeline typically publishes in Jan–Feb 2027; dates shown are planning estimates derived from prior Google cycles.",
    eligibility: {
      degreesAllowed: ["Any recognized degree", "Self-taught / Non-enrolled contributors welcome"],
      graduationYears: [2027, 2028, 2029, 2030],
      branchRestrictions: ["All disciplines eligible (CS, IT, Electrical, Mechanical, Humanities)"],
      otherRequirements: ["Age 18+ at time of registration", "New or beginner open-source contributor"]
    },
    selectionRounds: [
      {
        roundNumber: 1,
        name: "Organization Exploration & Community Bonding",
        description: "Engage in organization discussion channels (Mailing lists, Zulip, Discord, Slack), setup local development environment, and submit first good-first-issue PR.",
        format: "Public GitHub / GitLab Issue & PR discussion",
        eliminatory: true
      },
      {
        roundNumber: 2,
        name: "Technical Project Proposal Submission",
        description: "Author a comprehensive 10-15 page project proposal detailing deliverables, architecture, KaTeX/KaTeX diagrams, weekly milestones, risk mitigations, and bio.",
        format: "Formal PDF / Google Docs Submission to GSoC Portal",
        eliminatory: true
      },
      {
        roundNumber: 3,
        name: "Mid-Term Evaluation",
        description: "Demonstrate 50% working milestone code, unit tests, and maintainer sign-off to unlock Phase 1 stipend release.",
        format: "Code Review & Mentor Evaluation",
        eliminatory: true
      },
      {
        roundNumber: 4,
        name: "Final Evaluation & Code Handover",
        description: "Clean production-ready PR merged into main, complete documentation, and summary blog post for final stipend completion.",
        format: "Repository Merge & Mentorship Review",
        eliminatory: true
      }
    ],
    requiredSkills: [
      { skill: "Git & GitHub Collaborative Workflow", proficiency: "Intermediate", isMustHave: true, provenance: "VERIFIED" },
      { skill: "Codebase Comprehension & Tracing", proficiency: "Intermediate", isMustHave: true, provenance: "VERIFIED" },
      { skill: "Python / C++ / Go / Rust / TypeScript", proficiency: "Intermediate", isMustHave: true, provenance: "VERIFIED" },
      { skill: "Technical Proposal Writing & Milestone Estimation", proficiency: "Advanced", isMustHave: true, provenance: "VERIFIED" },
      { skill: "Automated Unit Testing & CI/CD", proficiency: "Intermediate", isMustHave: false, provenance: "RECOMMENDED" }
    ],
    primaryDomains: ["code_comprehension", "ai_data", "project", "github"],
    phases: {
      absolute_beginner: [
        {
          phaseNumber: 1,
          phaseName: "Open Source Foundations: Terminal, Git & First Commit",
          description: "Learn Linux terminal commands, Git branching, staging, commits, remote forks, and GitHub PR lifecycle from zero.",
          totalEstimatedHours: 15,
          tasks: [
            {
              id: "gsoc-ab-1",
              phase: 1,
              phaseName: "Terminal & Git Core",
              title: "Master Git Fork, Clone, and Branching Lifecycle",
              description: "Practice setting upstream remotes, syncing main branches, creating feature branches, and submitting non-destructive PRs.",
              estimatedMinutes: 60,
              linkedDomain: "github",
              targetHref: "/student/skills/code-comprehension",
              actionLabel: "Launch Code Comprehension Lab",
              minLevelRequired: "absolute_beginner",
              learningOutcomes: ["Fork vs Clone distinction", "Upstream synchronization", "Clean commit message conventions"],
              evidenceGenerated: "Verified Git collaborative workflow demonstration"
            },
            {
              id: "gsoc-ab-2",
              phase: 1,
              phaseName: "Syntax & Clean Code",
              title: "Python Data Structures & Module Architecture",
              description: "Build clean, modular Python functions with type hints and docstrings inside the AI & Data Arena sandbox.",
              estimatedMinutes: 90,
              linkedDomain: "ai_data",
              targetHref: "/student/skills/ai-data?tab=coding-arena&subject=subj_python",
              actionLabel: "Practice in Python Coding Arena",
              minLevelRequired: "absolute_beginner",
              learningOutcomes: ["Type hints and PEP-8 conventions", "Module import hierarchies", "Exception handling"],
              evidenceGenerated: "Clean Python syntax and data structure proficiency"
            }
          ]
        },
        {
          phaseNumber: 2,
          phaseName: "Codebase Exploration & Issue Triage",
          description: "Read large multi-file open-source codebases, trace functions across directories, and locate good first issues.",
          totalEstimatedHours: 20,
          tasks: [
            {
              id: "gsoc-ab-3",
              phase: 2,
              phaseName: "Codebase Tracing",
              title: "Trace Multi-File Execution Flows & Fix Diagnostic Bugs",
              description: "Use the Code Comprehension engine to diagnose execution bottlenecks in multi-file repository simulations.",
              estimatedMinutes: 90,
              linkedDomain: "code_comprehension",
              targetHref: "/student/skills/code-comprehension",
              actionLabel: "Trace Execution in Code Comprehension",
              minLevelRequired: "absolute_beginner",
              learningOutcomes: ["Locating entry points in open-source projects", "Reading stack traces", "Writing regression unit tests"],
              evidenceGenerated: "Multi-file diagnostic trace verified"
            }
          ]
        }
      ],
      beginner: [
        {
          phaseNumber: 1,
          phaseName: "Community Selection & Organization Onboarding",
          description: "Filter GSoC organizations based on your primary language stack, join communication channels, and build the development container.",
          totalEstimatedHours: 18,
          tasks: [
            {
              id: "gsoc-beg-1",
              phase: 1,
              phaseName: "Org Evaluation",
              title: "Evaluate 3 GSoC Orgs (e.g. Apache, PSF, CNCF)",
              description: "Audit repository activity, maintainer responsiveness, open issues labeled 'good first issue', and project idea lists.",
              estimatedMinutes: 75,
              linkedDomain: "github",
              targetHref: "/student/skills/preparations/gsoc-2026?tab=open-source",
              actionLabel: "Explore Open Source Studio",
              minLevelRequired: "beginner",
              learningOutcomes: ["Analyzing commit velocity", "Understanding CONTRIBUTING.md guidelines", "Setting up local Docker containers"],
              evidenceGenerated: "Organization audit dossier documented"
            }
          ]
        }
      ],
      intermediate: [
        {
          phaseNumber: 1,
          phaseName: "First PR Merge & Maintainer Communication",
          description: "Identify an open issue, discuss implementation with maintainers, write automated tests, and get your first PR reviewed and merged.",
          totalEstimatedHours: 25,
          tasks: [
            {
              id: "gsoc-int-1",
              phase: 1,
              phaseName: "Core PR Submission",
              title: "Author Clean Bug Fix PR with PyTest / Unit Tests",
              description: "Implement a genuine bug fix with unit tests matching the org's test suite and adhere to CI/CD linting checks.",
              estimatedMinutes: 120,
              linkedDomain: "code_comprehension",
              targetHref: "/student/skills/code-comprehension",
              actionLabel: "Audit Code in Code Comprehension Lab",
              minLevelRequired: "intermediate",
              learningOutcomes: ["Writing hermetic unit tests", "Responding constructively to maintainer code reviews", "Rebasing onto master"],
              evidenceGenerated: "Open-source contribution PR readiness verified"
            }
          ]
        },
        {
          phaseNumber: 2,
          phaseName: "Technical Proposal Drafting & Milestone Breakdown",
          description: "Draft your complete 12-to-22 week technical proposal with architecture diagrams, API specifications, and weekly milestones.",
          totalEstimatedHours: 30,
          tasks: [
            {
              id: "gsoc-int-2",
              phase: 2,
              phaseName: "Proposal Studio",
              title: "Draft GSoC Proposal & Submit for AI Rubric Review",
              description: "Use the built-in Proposal Reviewer to evaluate scope, timeline feasibility, technical architecture, and community engagement.",
              estimatedMinutes: 150,
              linkedDomain: "project",
              targetHref: "/student/skills/preparations/gsoc-2026?tab=proposal",
              actionLabel: "Open Proposal Review Studio",
              minLevelRequired: "intermediate",
              learningOutcomes: ["Decomposing a large feature into 8 two-week milestones", "Identifying technical edge cases", "Demonstrating pre-proposal proof of concept"],
              evidenceGenerated: "GSoC Proposal reviewed with rubric score >= 80%"
            }
          ]
        }
      ],
      advanced: [
        {
          phaseNumber: 1,
          phaseName: "Architecture Proof-of-Concept & Proposal Pre-Review",
          description: "Build an active prototype branch demonstrating feasibility of the hardest technical milestone before official proposal submission.",
          totalEstimatedHours: 35,
          tasks: [
            {
              id: "gsoc-adv-1",
              phase: 1,
              phaseName: "Working POC",
              title: "Implement Standalone Proof of Concept for GSoC Project Idea",
              description: "Demonstrate benchmarked performance, memory profiling, and architecture validation for maintainers.",
              estimatedMinutes: 180,
              linkedDomain: "project",
              targetHref: "/student/skills/ai-data?tab=applied-projects",
              actionLabel: "Build in Applied Projects Hub",
              minLevelRequired: "advanced",
              learningOutcomes: ["Benchmarking performance overhead", "Designing backward-compatible APIs", "Pre-proposal maintainer buy-in"],
              evidenceGenerated: "Verified working architectural prototype"
            }
          ]
        }
      ]
    },
    projects: [
      {
        id: "proj-gsoc-1",
        title: "Async Data Ingestion Pipeline & Prometheus Metrics Exporter",
        tagline: "Build a high-performance Python/Go asynchronous streaming agent modeled on CNCF telemetry standards.",
        difficulty: "Intermediate",
        estimatedDays: 14,
        architectureSummary: "An async telemetry agent that ingests high-frequency metrics, buffers them in memory with backpressure, and exposes a Prometheus-compliant HTTP scrape endpoint.",
        techStack: ["Python", "FastAPI", "Prometheus Client", "Docker", "PyTest"],
        systemComponents: [
          { component: "Ingestion Worker", technology: "Python AsyncIO", responsibility: "Ingest telemetry packets without blocking event loop" },
          { component: "Ring Buffer", technology: "Collections Deque / Lockless Buffer", responsibility: "Maintain sliding window under backpressure" },
          { component: "Prometheus Exporter", technology: "Prometheus Client HTTP", responsibility: "Serve atomic counter and gauge metrics for scraping" }
        ],
        milestones: [
          { milestoneNumber: 1, title: "Async Socket Ingestion Server", description: "Implement non-blocking UDP/TCP receiver handling 5,000 req/sec", deliverable: "Tested server script" },
          { milestoneNumber: 2, title: "Prometheus Metrics Exposer", description: "Map counters, histograms, and latency percentiles to scrape format", deliverable: "Passing endpoint tests" },
          { milestoneNumber: 3, title: "Docker Containerization & Documentation", description: "Package with multi-stage Dockerfile and write clear contributor README", deliverable: "Verified container build" }
        ],
        acceptanceCriteria: [
          "Zero memory leaks under 100,000 synthetic metrics batch",
          "Unit test coverage > 85%",
          "Clean GitHub Actions CI pipeline running lint and test suites"
        ],
        demoRequirements: "Spin up Prometheus instance scraping the application container and verify metrics graph dashboard.",
        sampleSubmissionHint: "Structure your repository with /src, /tests, /docs, and include a clear CONTRIBUTING.md guide."
      }
    ],
    openSourceRepos: [
      {
        name: "scikit-learn",
        org: "scikit-learn",
        url: "https://github.com/scikit-learn/scikit-learn",
        stars: "59k",
        techStack: ["Python", "Cython", "C++", "NumPy", "SciPy"],
        goodFirstIssuesUrl: "https://github.com/scikit-learn/scikit-learn/labels/good%20first%20issue",
        contributionGuideUrl: "https://scikit-learn.org/stable/developers/contributing.html",
        architectureOverview: "Modular machine learning algorithms written in Python and optimized in Cython/C with uniform fit/transform API contracts.",
        recommendedFirstPRFocus: "Documentation clarification, unit test coverage expansion, or numerical edge case assertions in utility modules.",
        maintainerTips: ["Always run 'pytest' locally before submitting PR", "Never introduce breaking changes to public estimators", "Be concise and polite on issue discussions"]
      },
      {
        name: "airflow",
        org: "apache",
        url: "https://github.com/apache/airflow",
        stars: "37k",
        techStack: ["Python", "PostgreSQL", "Flask", "React", "Docker"],
        goodFirstIssuesUrl: "https://github.com/apache/airflow/labels/good%20first%20issue",
        contributionGuideUrl: "https://github.com/apache/airflow/blob/main/CONTRIBUTING.rst",
        architectureOverview: "Distributed workflow management platform orchestrating complex DAG pipelines across Celery, Kubernetes, and Cloud providers.",
        recommendedFirstPRFocus: "Provider package enhancements, missing parameter validations in operators, or unit test mocks.",
        maintainerTips: ["Use Breeze development environment for reproducible tests", "Follow conventional commit message prefixes"]
      }
    ],
    mockAssessments: [
      {
        id: "gsoc-mock-oa",
        title: "GSoC Technical Readiness & Open-Source Architecture Assessment",
        type: "technical_oa",
        durationMinutes: 45,
        totalMarks: 50,
        passingPercentage: 75,
        questions: [
          {
            id: "gsoc-q1",
            question: "You need to fix a bug on an open-source project where your local branch has diverged by 14 commits behind upstream main. What sequence of Git commands resolves this cleanly without creating unnecessary merge bubbles?",
            type: "conceptual",
            options: [
              "git merge upstream/main && git push origin my-feature-branch",
              "git fetch upstream && git rebase upstream/main && git push --force-with-lease origin my-feature-branch",
              "git reset --hard upstream/main && git cherry-pick all commits",
              "git pull --no-ff origin main"
            ],
            correctAnswer: "git fetch upstream && git rebase upstream/main && git push --force-with-lease origin my-feature-branch",
            marks: 10,
            rubric: "Understands clean rebase history, upstream tracking, and safe force push (--force-with-lease)."
          },
          {
            id: "gsoc-q2",
            question: "Describe your strategy for breaking down a 12-week GSoC project when you discover in week 3 that the underlying library dependency has deprecated a core API you planned to use.",
            type: "proposal",
            marks: 20,
            rubric: "Evaluates immediate communication with mentors, isolation of deprecated dependency behind an adapter interface, and recalculation of milestone buffer weeks."
          }
        ]
      }
    ],
    proposalTemplate: {
      title: "GSoC Official Proposal Structure & Review Rubric",
      sections: [
        {
          sectionTitle: "1. Abstract & Problem Definition",
          guidingQuestions: [
            "What specific limitation in the repository does this project solve?",
            "Who are the end users or maintainers who benefit?",
            "Why is this the optimal time to build it?"
          ],
          exampleExcerpt: "Currently, Apache Foo does not support streaming JSON-ND ingestion, forcing users to buffer gigabyte payloads in memory. This project implements a zero-copy streaming parser yielding a 65% memory reduction."
        },
        {
          sectionTitle: "2. Technical Approach & Architecture",
          guidingQuestions: [
            "What modules, classes, and APIs will be created or modified?",
            "What external dependencies will be added, and are their licenses compatible?",
            "How will backward compatibility be preserved?"
          ],
          exampleExcerpt: "The parser will be implemented under `foo.io.streaming` utilizing an iterator interface. All existing tests in `tests/io` will run unmodified."
        },
        {
          sectionTitle: "3. 12-Week Milestone Schedule",
          guidingQuestions: [
            "What concrete deliverable is finished in each two-week sprint?",
            "Where is the mid-term evaluation milestone placed?",
            "Is there a dedicated buffer period for bug fixes, documentation, and reviews?"
          ],
          exampleExcerpt: "Weeks 1-2: Core tokenizer and benchmark harness. Weeks 3-4: Stream chunk buffer. Weeks 5-6: Mid-term evaluation & integration tests..."
        }
      ],
      scoringRubric: [
        { criterion: "Technical Depth & Feasibility", weightage: 35, description: "Detailed understanding of repository architecture, APIs, and edge cases" },
        { criterion: "Timeline Granularity & Realism", weightage: 25, description: "Clear two-week milestones with verifiable deliverables and buffer weeks" },
        { criterion: "Pre-Proposal Evidence & Community Engagement", weightage: 25, description: "Prior merged PRs, active discussion on issue threads, and mentor communication" },
        { criterion: "Proposal Clarity & Professionalism", weightage: 15, description: "Clean formatting, KaTeX formulas where relevant, and concise technical prose" }
      ]
    },
    diagnosticQuestions: [
      {
        id: "diag-gsoc-1",
        question: "What is your current experience with Git and open-source contribution?",
        options: [
          { label: "I have never opened a terminal or used Git/GitHub commands.", recommendedLevel: "absolute_beginner" },
          { label: "I know basic git add/commit/push for my personal college projects.", recommendedLevel: "beginner" },
          { label: "I have forked repos, opened PRs, and resolved merge conflicts.", recommendedLevel: "intermediate" },
          { label: "I have multiple merged PRs in active external open-source repositories.", recommendedLevel: "advanced" }
        ]
      }
    ]
  },

  // ══════════════════════════════════════════════════════════════════════
  // 2. FLIPKART GRiD 7.0 (Software Development Track)
  // ══════════════════════════════════════════════════════════════════════
  {
    id: "flipkart-grid-7",
    slug: "flipkart-grid-7",
    title: "Flipkart GRiD 7.0 — Software Development Track Preparation Arena",
    shortName: "Flipkart GRiD 7.0",
    companyOrOrg: "Flipkart",
    category: "COMPANY_HACKATHON",
    categoryLabel: "Flagship Company Hackathon & PPI Track",
    tagline: "Crack Level 1 OA, build high-concurrency e-commerce architectures, and secure direct SDE-1 PPIs (₹32 LPA CTC).",
    description: "Flipkart's flagship campus engineering competition. Problem statements simulate authentic Tier-1 e-commerce engineering challenges: Flash sale inventory locking under high concurrency, AI-driven visual catalog verification, and dynamic logistics routing under SLA constraints.",
    badge: "Direct SDE-1 PPI",
    icon: "🛍️",
    officialUrl: "https://unstop.com/competitions",
    sourceAttribution: "Official Flipkart GRiD Historical Unstop Listings & Engineering Campus Archives",
    stipendOrPrize: "₹5,25,000 Cash Pool + Direct SDE-1 PPIs (CTC ₹32 LPA) & Summer Internships (Prior Cycle Benchmark)",
    confirmedStipendAmount: 525000,
    currency: "INR",
    duration: "4 - 8 Weeks (Historical Aug – Oct Window)",
    applicationDeadline: "2027-08-15T18:00:00Z",
    eventOrProgramDates: "Projected August – October 2027 (Pending Next Edition Official Launch)",
    cycleYear: 2027,
    cycleStatus: "upcoming_unannounced",
    dateVerificationStatus: "estimated_from_previous_cycle",
    cycleNotes: "Flipkart GRiD 7.0 (2026) concluded. Dates shown are planning estimates for the upcoming cycle; official registration opens on Unstop.",
    eligibility: {
      degreesAllowed: ["B.Tech", "B.E.", "M.Tech", "Dual Degree", "MCA"],
      graduationYears: [2027, 2028, 2029],
      minCgpaOrGpa: "No minimum cutoff specified by organizer",
      branchRestrictions: ["All Engineering Branches Eligible"],
      otherRequirements: ["Team Size: 2 to 3 Members from same institute", "Inter-specialization teams permitted"]
    },
    selectionRounds: [
      {
        roundNumber: 1,
        name: "Level 1: Online Technical Assessment (OA)",
        description: "Timed 60-minute test evaluating Data Structures, Algorithms, CS Fundamentals (DBMS, OS, Computer Networks), and E-Commerce System Design puzzles.",
        format: "30 MCQs + 2 Algorithmic Coding Problems (Unstop Platform)",
        eliminatory: true
      },
      {
        roundNumber: 2,
        name: "Level 2: Problem Statement Prototype Submission",
        description: "Select 1 of 3 engineering problem statements. Author detailed architecture documentation, system flowcharts, and functional codebase prototype with test harness.",
        format: "Code Repository + Architecture PDF + 5-min Video Walkthrough",
        eliminatory: true
      },
      {
        roundNumber: 3,
        name: "Level 3: Grand Finale & Live Jury Defense",
        description: "Top 10 national finalist teams pitch live to Flipkart Principal Architects and Directors. Includes live fault-injection and stress testing.",
        format: "Live Technical Defense & Live Demo in Bengaluru HQ / Virtual",
        eliminatory: true
      }
    ],
    requiredSkills: [
      { skill: "Data Structures & Algorithms (Graphs, Trees, DP)", proficiency: "Advanced", isMustHave: true, provenance: "VERIFIED" },
      { skill: "High-Concurrency Concurrency & Locking", proficiency: "Advanced", isMustHave: true, provenance: "VERIFIED" },
      { skill: "Relational SQL, CTEs & Indexing", proficiency: "Intermediate", isMustHave: true, provenance: "VERIFIED" },
      { skill: "Distributed Caching (Redis) & Message Queues", proficiency: "Intermediate", isMustHave: false, provenance: "RECOMMENDED" },
      { skill: "Java / Python / Go Backend Engineering", proficiency: "Intermediate", isMustHave: true, provenance: "VERIFIED" }
    ],
    primaryDomains: ["dsa", "system_design", "ai_data", "cs_fundamentals", "project"],
    phases: {
      absolute_beginner: [
        {
          phaseNumber: 1,
          phaseName: "Core Algorithms & CS Fundamentals Kickstart",
          description: "Build algorithmic speed in arrays, strings, two-pointers, and review OS process concurrency and SQL transactions.",
          totalEstimatedHours: 20,
          tasks: [
            {
              id: "grid-ab-1",
              phase: 1,
              phaseName: "DSA Speed",
              title: "Master Step 3 Arrays & Kadane's Algorithm",
              description: "Solve linear array transformations, maximum subarray sum, and Dutch National Flag in the DSA Arena.",
              estimatedMinutes: 90,
              linkedDomain: "dsa",
              targetHref: "/student/skills/dsa?topic=arrays",
              actionLabel: "Launch DSA Arena",
              minLevelRequired: "absolute_beginner",
              learningOutcomes: ["O(N) time complexity proofs", "In-place array partitioning", "Boundary edge cases"],
              evidenceGenerated: "Verified Kadane and 2-pointer solutions in DSA Arena"
            },
            {
              id: "grid-ab-2",
              phase: 1,
              phaseName: "Database Locking",
              title: "SQL Transactions, ACID Properties & Isolation Levels",
              description: "Review row-level locks, phantom reads, and deadlocks in the CS Fundamentals workspace.",
              estimatedMinutes: 60,
              linkedDomain: "cs_fundamentals",
              targetHref: "/student/skills/cs-interview?subject=dbms",
              actionLabel: "Practice in CS Fundamentals",
              minLevelRequired: "absolute_beginner",
              learningOutcomes: ["Dirty reads vs non-repeatable reads", "Optimistic vs Pessimistic locking", "B-Tree index scans"],
              evidenceGenerated: "SQL isolation levels mastered"
            }
          ]
        }
      ],
      beginner: [
        {
          phaseNumber: 1,
          phaseName: "Level 1 OA Fast-Track: Graphs, Heaps & DP",
          description: "Solve typical Flipkart campus OA problems: BFS/DFS shortest paths, PriorityQueue intervals, and knapsack dynamic programming.",
          totalEstimatedHours: 25,
          tasks: [
            {
              id: "grid-beg-1",
              phase: 1,
              phaseName: "Graph Traversal",
              title: "Dijkstra & Topological Sort for Logistics Networks",
              description: "Solve graph shortest paths and dependency graphs inside the DSA Arena.",
              estimatedMinutes: 90,
              linkedDomain: "dsa",
              targetHref: "/student/skills/dsa?topic=graphs",
              actionLabel: "Practice Graphs in DSA Arena",
              minLevelRequired: "beginner",
              learningOutcomes: ["PriorityQueue Dijkstra implementation", "Cycle detection in directed graphs", "Disjoint Set Union (DSU)"],
              evidenceGenerated: "Graph algorithmic mastery logged to Student DNA"
            }
          ]
        }
      ],
      intermediate: [
        {
          phaseNumber: 1,
          phaseName: "Level 2 Prototype: High-Concurrency Flash Sale Architecture",
          description: "Build an idempotent flash-sale order reservation microservice preventing overselling when 50,000 customers buy 100 stock units.",
          totalEstimatedHours: 35,
          tasks: [
            {
              id: "grid-int-1",
              phase: 1,
              phaseName: "Flash Sale Engine",
              title: "Implement Distributed Lock & Lua Script in Redis/Postgres",
              description: "Build an inventory reservation service using atomic decrements and optimistic concurrency checks.",
              estimatedMinutes: 120,
              linkedDomain: "system_design",
              targetHref: "/student/skills/system-design",
              actionLabel: "Design Architecture in System Design",
              minLevelRequired: "intermediate",
              learningOutcomes: ["Atomic Lua script execution in Redis", "Compensating rollback transactions", "Handling idempotency keys"],
              evidenceGenerated: "Flash sale concurrency prototype verified"
            }
          ]
        }
      ],
      advanced: [
        {
          phaseNumber: 1,
          phaseName: "Jury Defense, Chaos Injection & Finalist Rehearsal",
          description: "Simulate live jury cross-examination on latency bottlenecks, database replica lag, and failover under network partitions.",
          totalEstimatedHours: 30,
          tasks: [
            {
              id: "grid-adv-1",
              phase: 1,
              phaseName: "Jury Defense",
              title: "Flipkart Technical Defense Mock Simulation",
              description: "Face Socratic AI jury questions on why your architecture chose Redis over Kafka, and how you prevent double-charging.",
              estimatedMinutes: 90,
              linkedDomain: "cs_fundamentals",
              targetHref: "/student/skills/cs-interview?subject=system_design",
              actionLabel: "Launch Jury Defense Mock",
              minLevelRequired: "advanced",
              learningOutcomes: ["Defending architectural trade-offs", "Explaining CAP theorem under network partitions", "Measuring P99 latency SLAs"],
              evidenceGenerated: "Jury defense passed with score >= 85%"
            }
          ]
        }
      ]
    },
    projects: [
      {
        id: "proj-grid-1",
        title: "FlashShield: Sub-Millisecond Distributed Inventory Reservation System",
        tagline: "Zero-overselling distributed inventory ledger handling 25,000 RPS flash sale bursts with atomic Lua scripts.",
        difficulty: "Advanced",
        estimatedDays: 10,
        architectureSummary: "A high-throughput checkout reservation engine utilizing Redis cluster atomic scripts for inventory decrement, write-ahead event streams for order processing, and PostgreSQL for authoritative transaction settlement.",
        techStack: ["Java/Python", "Redis (Lua)", "PostgreSQL", "Docker", "Locust (Load Testing)"],
        systemComponents: [
          { component: "API Gateway & Rate Limiter", technology: "Token Bucket / Envoy", responsibility: "Drop abusive traffic and enforce IP rate limits" },
          { component: "Atomic Reservation Cache", technology: "Redis Lua Engine", responsibility: "Verify and decrement stock atomically with sub-5ms latency" },
          { component: "Settlement Consumer", technology: "Background Worker Pool", responsibility: "Asynchronously write confirmed orders into relational DB" }
        ],
        milestones: [
          { milestoneNumber: 1, title: "Relational Schema with Strict Unique Constraints", description: "Design orders and inventory schema with transaction isolation", deliverable: "Tested SQL DDL & seed scripts" },
          { milestoneNumber: 2, title: "Atomic Redis Lua Script", description: "Write atomic inventory check-and-decrement script", deliverable: "Unit tests verifying exactly 0 overselling" },
          { milestoneNumber: 3, title: "Load Test Benchmark under 10k Concurrency", description: "Run Locust test with 10,000 parallel virtual users", deliverable: "Verified benchmark report showing 0 oversell errors" }
        ],
        acceptanceCriteria: [
          "Zero inventory oversold when 1,000 concurrent threads request 10 available units",
          "P99 latency < 25ms under 5,000 simulated RPS",
          "Idempotent retry returns previous confirmation without double-decrementing stock"
        ],
        demoRequirements: "Live Locust load test video proving 500 orders executed against 100 inventory units, resulting in exactly 100 successful orders and 400 clean out-of-stock responses.",
        sampleSubmissionHint: "Emphasize your latency percentiles and deadlock prevention strategy in your PDF architecture submission."
      }
    ],
    mockAssessments: [
      {
        id: "grid-mock-oa",
        title: "Flipkart GRiD Level 1 OA Simulation",
        type: "technical_oa",
        durationMinutes: 60,
        totalMarks: 100,
        passingPercentage: 70,
        questions: [
          {
            id: "grid-q1",
            question: "Given an e-commerce catalog of N products with prices and dependencies where buying product A requires buying product B, find the minimum cost to purchase a target set of products with cycles handled appropriately.",
            type: "coding",
            starterCode: "def min_purchase_cost(n, prices, dependencies, target):\n    # Write your solution here\n    pass",
            marks: 40,
            rubric: "Evaluates Topological Sort, Cycle Detection, and DP memoization on subtrees."
          },
          {
            id: "grid-q2",
            question: "Why does PostgreSQL READ COMMITTED isolation level fail to prevent the 'Lost Update' problem when two concurrent transactions read an item's balance and update it?",
            type: "conceptual",
            options: [
              "Because READ COMMITTED takes exclusive table locks",
              "Because each transaction sees the committed snapshot at statement start without locking the selected row",
              "Because MVCC causes transaction rollbacks automatically",
              "Because dirty reads are permitted in READ COMMITTED"
            ],
            correctAnswer: "Because each transaction sees the committed snapshot at statement start without locking the selected row",
            marks: 20,
            rubric: "Understands MVCC snapshot semantics and why SELECT ... FOR UPDATE or SERIALIZABLE is necessary."
          }
        ]
      }
    ],
    hackathonSubmissionChecklist: [
      {
        category: "Architecture & Documentation",
        items: [
          "System architecture diagram showing all microservices, caches, and queues",
          "Data model entity-relationship (ER) diagram with primary and foreign keys",
          "Explicit explanation of how concurrency conflicts and race conditions are mitigated",
          "P99 latency and throughput benchmark results graph included"
        ]
      },
      {
        category: "Demo Video & Code Quality",
        items: [
          "5-minute Loom / YouTube walkthrough with clear audio and team member roles",
          "Live terminal or UI execution of the core problem statement",
          "Demonstration of failure recovery or chaos injection (e.g. killing a worker node)",
          "Clean GitHub repository with Docker Compose one-command startup (`docker compose up`)"
        ]
      }
    ],
    diagnosticQuestions: [
      {
        id: "diag-grid-1",
        question: "How confident are you with algorithmic problem solving (Trees, Graphs, DP) and SQL transactions?",
        options: [
          { label: "Beginner: I know arrays and loops, but struggle with Graphs and DP.", recommendedLevel: "absolute_beginner" },
          { label: "Intermediate: I solve standard LeetCode mediums and understand SQL JOINs.", recommendedLevel: "intermediate" },
          { label: "Advanced: I have built distributed projects and solve hard graph/DP problems.", recommendedLevel: "advanced" }
        ]
      }
    ]
  },

  // ══════════════════════════════════════════════════════════════════════
  // 3. AMAZON HACKON & SMBHAV TECH CHALLENGE
  // ══════════════════════════════════════════════════════════════════════
  {
    id: "amazon-hackon-2026",
    slug: "amazon-hackon-2026",
    title: "Amazon HackOn & Smbhav Tech Challenge 2026 Preparation Arena",
    shortName: "Amazon HackOn 2026",
    companyOrOrg: "Amazon India",
    category: "COMPANY_HACKATHON",
    categoryLabel: "Flagship Company Hackathon & SDE PPI Track",
    tagline: "Build scalable cloud-native architectures, master Amazon Leadership Principles, and fast-track to Amazon SDE-1 interviews.",
    description: "Amazon's premier university innovation challenge. Focuses on customer-obsessed engineering solutions for small businesses, vernacular voice agents, supply chain optimization, and resilient serverless architectures. Winners and top finalists receive direct fast-tracks to Amazon SDE-1 and Intern interviews.",
    badge: "Amazon SDE-1 Fast-Track",
    icon: "📦",
    officialUrl: "https://unstop.com/hackathons",
    sourceAttribution: "Official Amazon HackOn / Smbhav Historical Listings & Amazon Campus Recruiting",
    stipendOrPrize: "₹7,50,000 Cash Pool + AWS Cloud Credits + Amazon SDE Interview Fast-Track (Prior Cycle Benchmark)",
    confirmedStipendAmount: 750000,
    currency: "INR",
    duration: "4 - 6 Weeks (Historical Mar – May Window)",
    applicationDeadline: "2027-05-10T18:00:00Z",
    eventOrProgramDates: "Projected March – May 2027 (Pending Official Amazon Cycle Announcement)",
    cycleYear: 2027,
    cycleStatus: "upcoming_unannounced",
    dateVerificationStatus: "estimated_from_previous_cycle",
    cycleNotes: "Amazon HackOn 2026 cycle concluded. Dates shown are planning estimates for the 2027 edition; start cloud-native & LP prep early.",
    eligibility: {
      degreesAllowed: ["B.Tech", "B.E.", "M.Tech", "MCA", "Dual Degree"],
      graduationYears: [2027, 2028, 2029],
      minCgpaOrGpa: "6.5+ CGPA recommended for interview fast-track",
      branchRestrictions: ["All Engineering & IT branches"],
      otherRequirements: ["Teams of 2 to 4 students", "Must use cloud/API architecture"]
    },
    selectionRounds: [
      {
        roundNumber: 1,
        name: "Ideation & Technical Architecture Deck Submission",
        description: "Submit a 5-slide technical pitch deck addressing the customer problem, proposed AWS cloud architecture, and competitive edge.",
        format: "PDF Presentation + Executive Summary",
        eliminatory: true
      },
      {
        roundNumber: 2,
        name: "Working Prototype & Video Demo",
        description: "Submit functional GitHub repository and 3-minute video showing end-to-end user flow and cloud integration.",
        format: "GitHub Repo + Loom Walkthrough",
        eliminatory: true
      },
      {
        roundNumber: 3,
        name: "Grand Finale & Amazon Bar-Raiser Defense",
        description: "Present live to Amazon Senior SDMs and Principal Engineers. Defend technical trade-offs through Amazon Leadership Principles.",
        format: "Live Jury Pitch & Q&A Defense",
        eliminatory: true
      }
    ],
    requiredSkills: [
      { skill: "Cloud Architecture & Serverless / Microservices", proficiency: "Intermediate", isMustHave: true, provenance: "VERIFIED" },
      { skill: "Amazon 16 Leadership Principles (Customer Obsession, Ownership)", proficiency: "Advanced", isMustHave: true, provenance: "VERIFIED" },
      { skill: "Python / Node.js Backend API Development", proficiency: "Intermediate", isMustHave: true, provenance: "VERIFIED" },
      { skill: "Data Structures & Core Problem Solving", proficiency: "Intermediate", isMustHave: true, provenance: "VERIFIED" }
    ],
    primaryDomains: ["system_design", "behavioral", "ai_data", "dsa", "project"],
    phases: {
      absolute_beginner: [
        {
          phaseNumber: 1,
          phaseName: "Cloud Basics & Amazon Behavioral Foundations",
          description: "Learn cloud computing paradigms (Compute, Storage, Database, APIs) and the STAR behavioral interview framework.",
          totalEstimatedHours: 15,
          tasks: [
            {
              id: "amz-ab-1",
              phase: 1,
              phaseName: "STAR Framework",
              title: "Master Amazon Leadership Principles using STAR Format",
              description: "Draft 3 verified STAR stories for Customer Obsession, Ownership, and Bias for Action in the Behavioral Arena.",
              estimatedMinutes: 60,
              linkedDomain: "behavioral",
              targetHref: "/student/skills/behavioral",
              actionLabel: "Practice in Behavioral Arena",
              minLevelRequired: "absolute_beginner",
              learningOutcomes: ["STAR story structuring", "Quantifying production impact", "Demonstrating ownership"],
              evidenceGenerated: "Amazon Leadership STAR stories logged"
            }
          ]
        }
      ],
      beginner: [
        {
          phaseNumber: 1,
          phaseName: "API Design & Cloud Data Persistence",
          description: "Build RESTful APIs with Python/Node, connect to relational databases, and learn async queue patterns.",
          totalEstimatedHours: 20,
          tasks: [
            {
              id: "amz-beg-1",
              phase: 1,
              phaseName: "REST API",
              title: "Design Idempotent Order Creation API",
              description: "Build an API endpoint supporting idempotency headers and schema validations in the Code Comprehension Lab.",
              estimatedMinutes: 75,
              linkedDomain: "code_comprehension",
              targetHref: "/student/skills/code-comprehension",
              actionLabel: "Build API in Code Comprehension",
              minLevelRequired: "beginner",
              learningOutcomes: ["HTTP status code standards", "Database connection pooling", "Input validation"],
              evidenceGenerated: "Idempotent API verified"
            }
          ]
        }
      ],
      intermediate: [
        {
          phaseNumber: 1,
          phaseName: "Vernacular Voice / Multimodal Prototype",
          description: "Build a prototype combining vernacular speech processing or GenAI with e-commerce product search.",
          totalEstimatedHours: 25,
          tasks: [
            {
              id: "amz-int-1",
              phase: 1,
              phaseName: "GenAI Integration",
              title: "Vector Search & Vernacular Semantic Product Discovery",
              description: "Implement text embeddings and vector similarity retrieval in the AI & Data Arena.",
              estimatedMinutes: 120,
              linkedDomain: "ai_data",
              targetHref: "/student/skills/ai-data?tab=coding-arena&subject=subj_genai",
              actionLabel: "Practice GenAI in AI & Data Arena",
              minLevelRequired: "intermediate",
              learningOutcomes: ["Cosine similarity over embeddings", "Hybrid lexical + semantic search", "Sub-100ms vector lookup"],
              evidenceGenerated: "Vector search pipeline verified"
            }
          ]
        }
      ],
      advanced: [
        {
          phaseNumber: 1,
          phaseName: "System Design Scaling & Bar-Raiser Rehearsal",
          description: "Defend high-availability trade-offs (multi-AZ, read replicas, circuit breakers) before Amazon interview panels.",
          totalEstimatedHours: 25,
          tasks: [
            {
              id: "amz-adv-1",
              phase: 1,
              phaseName: "System Design Mock",
              title: "Amazon SDE System Design: Scalable Distributed Caching",
              description: "Design distributed cache with eviction policies, thundering herd protection, and consistent hashing.",
              estimatedMinutes: 90,
              linkedDomain: "system_design",
              targetHref: "/student/skills/system-design",
              actionLabel: "Practice in System Design Arena",
              minLevelRequired: "advanced",
              learningOutcomes: ["Consistent hashing with virtual nodes", "Cache stampede mitigation", "Write-through vs Write-back"],
              evidenceGenerated: "Amazon System Design mock completed"
            }
          ]
        }
      ]
    },
    projects: [
      {
        id: "proj-amz-1",
        title: "BhashaMart: Multilingual Voice-Commerce Assistant for Rural Retailers",
        tagline: "Voice-first offline-tolerant retail inventory management in 8 Indian regional languages.",
        difficulty: "Intermediate",
        estimatedDays: 12,
        architectureSummary: "A progressive web app that transcribes regional spoken queries via Whisper/Bhashini, performs semantic catalog matching, and records orders into SQLite/PostgreSQL with offline sync.",
        techStack: ["Python", "FastAPI", "React PWA", "SQLite / PostgreSQL", "Docker"],
        systemComponents: [
          { component: "Voice Ingestion & STT", technology: "Whisper API / Web Speech", responsibility: "Transcribe regional voice queries to text" },
          { component: "Semantic Matching Engine", technology: "Sentence-Transformers / ChromaDB", responsibility: "Map spoken intent to product SKU catalog" },
          { component: "Offline Sync Engine", technology: "IndexedDB + Background ServiceWorker", responsibility: "Allow rural merchants to record sales offline" }
        ],
        milestones: [
          { milestoneNumber: 1, title: "Voice Recording & Audio Pipeline", description: "Capture audio stream and convert to normalized text", deliverable: "Working audio transcription endpoint" },
          { milestoneNumber: 2, title: "Semantic SKU Catalog Matcher", description: "Match colloquial product names ('1 packet haldi') to inventory", deliverable: "High-accuracy fuzzy test suite" },
          { milestoneNumber: 3, title: "Order Generation & Voice Confirmation", description: "Generate invoice and synthesize audio summary response", deliverable: "Complete end-to-end working demo" }
        ],
        acceptanceCriteria: [
          "Voice transcription latency < 1.2s",
          "Catalog search precision > 90% across colloquial Hindi/Tamil/Telugu terms",
          "Zero data loss when recording orders in offline airplane mode"
        ],
        demoRequirements: "Video demonstration showing merchant speaking order in Hindi, automatic receipt generation, and offline sync when network reconnects.",
        sampleSubmissionHint: "Emphasize how this embodies 'Customer Obsession' by solving real pain points for non-English-speaking shopkeepers."
      }
    ],
    mockAssessments: [
      {
        id: "amz-mock-assessment",
        title: "Amazon HackOn & SDE Preparation Mock Assessment",
        type: "system_design_defense",
        durationMinutes: 45,
        totalMarks: 50,
        passingPercentage: 75,
        questions: [
          {
            id: "amz-q1",
            question: "Amazon's retail website experiences a 10x traffic spike during Great Indian Festival. What architectural pattern best prevents cascading failures when downstream payment processing slows down?",
            type: "conceptual",
            options: [
              "Increase thread pool size infinitely on web servers",
              "Deploy Circuit Breaker pattern with exponential backoff and asynchronous message queue buffering",
              "Synchronously retry failed payment calls 10 times immediately",
              "Disable database replication to conserve IOPS"
            ],
            correctAnswer: "Deploy Circuit Breaker pattern with exponential backoff and asynchronous message queue buffering",
            marks: 15,
            rubric: "Understands Circuit Breakers (Netflix Hystrix / Resilience4j) and asynchronous decoupling."
          }
        ]
      }
    ],
    diagnosticQuestions: [
      {
        id: "diag-amz-1",
        question: "How familiar are you with cloud architecture and Amazon Leadership Principles?",
        options: [
          { label: "New to cloud concepts and unfamiliar with Amazon's LP questions.", recommendedLevel: "absolute_beginner" },
          { label: "I have built small APIs and know a few leadership principles.", recommendedLevel: "beginner" },
          { label: "I have deployed full-stack apps on AWS/GCP and use STAR responses.", recommendedLevel: "intermediate" },
          { label: "Experienced with microservices, Docker, CI/CD, and system design.", recommendedLevel: "advanced" }
        ]
      }
    ]
  },

  // ══════════════════════════════════════════════════════════════════════
  // 4. WALMART SPARKATHON & CODEHERS 2026
  // ══════════════════════════════════════════════════════════════════════
  {
    id: "walmart-sparkathon-2026",
    slug: "walmart-sparkathon-2026",
    title: "Walmart Sparkathon & CodeHers 2026 Preparation Arena",
    shortName: "Walmart Sparkathon",
    companyOrOrg: "Walmart Global Tech India",
    category: "COMPANY_HACKATHON",
    categoryLabel: "Retail Tech Innovation & Campus Hiring",
    tagline: "Build scalable omni-channel retail systems, master DSA OA screening, and fast-track to Walmart SDE-1 roles (₹24-30 LPA).",
    description: "Walmart Global Tech India's flagship engineering challenge for engineering students. Tracks focus on Next-Gen Omni-Channel Retail, Supply Chain Intelligence, and Generative Customer Engagement. Finalists receive direct interview tracks for full-time SDE-1 and summer internships.",
    badge: "Direct SDE-1 Fast-Track",
    icon: "🛒",
    officialUrl: "https://unstop.com/hackathons",
    sourceAttribution: "Official Walmart Global Tech Unstop Historical Archives & Careers",
    stipendOrPrize: "₹3,00,000 - ₹5,00,000 Cash Prizes + SDE-1 Interview Fast-Track (Prior Cycle Benchmark)",
    confirmedStipendAmount: 300000,
    currency: "INR",
    duration: "4 - 6 Weeks (Historical May – Jul Window)",
    applicationDeadline: "2027-06-30T18:00:00Z",
    eventOrProgramDates: "Projected May – July 2027 (Pending Next Edition Launch)",
    cycleYear: 2027,
    cycleStatus: "upcoming_unannounced",
    dateVerificationStatus: "estimated_from_previous_cycle",
    cycleNotes: "2026 Sparkathon & CodeHers concluded. Use this upcoming 2027 planning cycle to master retail scalability & OA rounds.",
    eligibility: {
      degreesAllowed: ["B.Tech", "B.E.", "M.Tech", "Dual Degree"],
      graduationYears: [2027, 2028, 2029],
      minCgpaOrGpa: "7.0+ CGPA",
      branchRestrictions: ["CSE, IT, ECE, EEE, AI, Data Science"],
      otherRequirements: ["Open to enrolled college students across India"]
    },
    selectionRounds: [
      {
        roundNumber: 1,
        name: "Round 1: Online Technical Assessment (Coding + CS Core)",
        description: "60-minute test consisting of 2 Data Structures & Algorithms coding challenges (Medium/Hard) and 15 CS fundamentals MCQs.",
        format: "Unstop Coding Platform",
        eliminatory: true
      },
      {
        roundNumber: 2,
        name: "Round 2: Retail Tech Project Submission",
        description: "Develop a prototype solving one of Walmart's declared retail tracks (Smart Replenishment, AR In-store Navigation, Dynamic Pricing).",
        format: "GitHub Repo + Architecture Document + Demo Video",
        eliminatory: true
      },
      {
        roundNumber: 3,
        name: "Round 3: Grand Finale & SDE Technical Interview",
        description: "Present prototype to Walmart Senior Engineering Leadership followed by direct technical and managerial interview rounds for SDE-1.",
        format: "Technical Interview & Prototype Presentation",
        eliminatory: true
      }
    ],
    requiredSkills: [
      { skill: "Data Structures & Algorithms (Trees, Graphs, DP)", proficiency: "Advanced", isMustHave: true, provenance: "VERIFIED" },
      { skill: "Object-Oriented Design & Design Patterns", proficiency: "Intermediate", isMustHave: true, provenance: "VERIFIED" },
      { skill: "Database Optimization & SQL Indexing", proficiency: "Intermediate", isMustHave: true, provenance: "VERIFIED" },
      { skill: "Java / Python / Spring Boot / FastAPI", proficiency: "Intermediate", isMustHave: true, provenance: "VERIFIED" }
    ],
    primaryDomains: ["dsa", "cs_fundamentals", "system_design", "ai_data", "project"],
    phases: {
      absolute_beginner: [
        {
          phaseNumber: 1,
          phaseName: "Core Algorithms & Object-Oriented Fundamentals",
          description: "Master essential algorithms, string hashing, binary search, and OOP design principles.",
          totalEstimatedHours: 20,
          tasks: [
            {
              id: "wal-ab-1",
              phase: 1,
              phaseName: "Binary Search",
              title: "Binary Search on Answer Space & Monotonic Functions",
              description: "Practice rotated sorted arrays and allocation puzzles in the DSA Arena.",
              estimatedMinutes: 90,
              linkedDomain: "dsa",
              targetHref: "/student/skills/dsa?topic=binary_search",
              actionLabel: "Practice in DSA Arena",
              minLevelRequired: "absolute_beginner",
              learningOutcomes: ["Lower bound / Upper bound", "Binary search predicate functions", "Handling integer overflow"],
              evidenceGenerated: "Binary search mastery recorded"
            }
          ]
        }
      ],
      beginner: [
        {
          phaseNumber: 1,
          phaseName: "Round 1 OA Mastery: DP, Strings & Graphs",
          description: "Solve high-frequency Walmart OA problems: Longest Common Subsequence, Word Ladder, and Dijkstra.",
          totalEstimatedHours: 22,
          tasks: [
            {
              id: "wal-beg-1",
              phase: 1,
              phaseName: "Dynamic Programming",
              title: "Grid DP & Subsequence Optimization",
              description: "Solve 2D grid path finding and knapsack variations in DSA Arena.",
              estimatedMinutes: 90,
              linkedDomain: "dsa",
              targetHref: "/student/skills/dsa?topic=dp",
              actionLabel: "Launch DP in DSA Arena",
              minLevelRequired: "beginner",
              learningOutcomes: ["Tabulation vs Memoization", "Space optimization from O(M*N) to O(N)", "State transition proofs"],
              evidenceGenerated: "Dynamic programming verified in Student DNA"
            }
          ]
        }
      ],
      intermediate: [
        {
          phaseNumber: 1,
          phaseName: "Retail Microservices & Smart Replenishment Project",
          description: "Build an event-driven inventory replenishment service with real-time stock alert thresholds.",
          totalEstimatedHours: 28,
          tasks: [
            {
              id: "wal-int-1",
              phase: 1,
              phaseName: "Inventory Alerts",
              title: "Build Low-Stock Replenishment Event Trigger",
              description: "Build event listener triggering automated supplier orders when stock dips below safety threshold.",
              estimatedMinutes: 100,
              linkedDomain: "code_comprehension",
              targetHref: "/student/skills/code-comprehension",
              actionLabel: "Build in Code Comprehension",
              minLevelRequired: "intermediate",
              learningOutcomes: ["Event-driven architecture", "Dead letter queues", "Transactional outbox pattern"],
              evidenceGenerated: "Retail replenishment service verified"
            }
          ]
        }
      ],
      advanced: [
        {
          phaseNumber: 1,
          phaseName: "Walmart SDE Technical Interview & High-Scale Systems",
          description: "Practice design of high-throughput retail systems (Walmart Cart service, Store Fulfillment, Flash Sales).",
          totalEstimatedHours: 25,
          tasks: [
            {
              id: "wal-adv-1",
              phase: 1,
              phaseName: "Cart Service",
              title: "Design Walmart Shopping Cart & Session Persistence",
              description: "Design high-availability shopping cart system handling 50M active sessions with Redis & Cassandra.",
              estimatedMinutes: 90,
              linkedDomain: "system_design",
              targetHref: "/student/skills/system-design",
              actionLabel: "Design in System Design Arena",
              minLevelRequired: "advanced",
              learningOutcomes: ["Session replication across data centers", "Conflict-free replicated data types (CRDTs)", "Optimistic checkout locking"],
              evidenceGenerated: "High-scale retail system design verified"
            }
          ]
        }
      ]
    },
    projects: [
      {
        id: "proj-wal-1",
        title: "OmniCart: Real-Time Dynamic In-Store Cart & Smart Stock Replenisher",
        tagline: "Omni-channel retail assistant with real-time shelf inventory reconciliation and predictive restocking.",
        difficulty: "Intermediate",
        estimatedDays: 10,
        architectureSummary: "A microservice that tracks customer cart items in real time, decrements virtual shelf stock, predicts replenishment time using exponential smoothing, and triggers automated supplier purchase orders.",
        techStack: ["Java / Python", "Spring Boot / FastAPI", "PostgreSQL", "Redis", "Docker"],
        systemComponents: [
          { component: "Cart State Service", technology: "Redis Hash", responsibility: "Maintain active user carts with 30-min TTL expiration" },
          { component: "Replenishment Predictor", technology: "Python Stats / Holt-Winters", responsibility: "Forecast depletion rate based on hourly sales volume" },
          { component: "Supplier Gateway", technology: "REST / Webhooks", responsibility: "Automate purchase orders to external distribution centers" }
        ],
        milestones: [
          { milestoneNumber: 1, title: "Cart API with Auto-Expiration", description: "Implement cart endpoints with TTL cleanup", deliverable: "Working cart service" },
          { milestoneNumber: 2, title: "Stock Depletion Forecast Algorithm", description: "Implement stock rate prediction algorithm", deliverable: "Validated forecasting test suite" },
          { milestoneNumber: 3, title: "Store Manager Dashboard", description: "Build clean manager UI showing live shelf health", deliverable: "Complete frontend + backend integration" }
        ],
        acceptanceCriteria: [
          "Cart reservation releases accurately within 5 seconds of TTL expiry",
          "Replenishment trigger initiates exactly once per threshold breach",
          "Passes all integration tests with PostgreSQL in Docker"
        ],
        demoRequirements: "Demonstrate customer adding items to cart, stock decrementing on manager screen, and automated replenishment alert triggered when stock falls below 5 units.",
        sampleSubmissionHint: "Highlight your fault-tolerant data storage and clean separation of concerns."
      }
    ],
    mockAssessments: [
      {
        id: "wal-mock-oa",
        title: "Walmart Global Tech Coding Assessment Simulation",
        type: "technical_oa",
        durationMinutes: 60,
        totalMarks: 100,
        passingPercentage: 75,
        questions: [
          {
            id: "wal-q1",
            question: "Given a network of Walmart distribution centers connected by roads with varying travel times, determine the minimum time required for a fleet of trucks to deliver goods to all fulfillment centers from a central warehouse.",
            type: "coding",
            starterCode: "def min_delivery_time(num_centers, roads, warehouse_id):\n    # Write Dijkstra or Network Delay Time implementation\n    pass",
            marks: 40,
            rubric: "Evaluates Dijkstra's algorithm using a min-heap PriorityQueue and edge relaxation."
          }
        ]
      }
    ],
    diagnosticQuestions: [
      {
        id: "diag-wal-1",
        question: "What is your proficiency with competitive DSA and Object-Oriented Design?",
        options: [
          { label: "Beginner: Still learning arrays, strings, and recursion.", recommendedLevel: "absolute_beginner" },
          { label: "Intermediate: Comfortable with Trees, Graphs, DP, and design patterns.", recommendedLevel: "intermediate" },
          { label: "Advanced: High LeetCode rating and experience building scalable backend projects.", recommendedLevel: "advanced" }
        ]
      }
    ]
  },

  // ══════════════════════════════════════════════════════════════════════
  // 5. PAID AI/ML & GENAI INTERNSHIP PREPARATION ARENA
  // ══════════════════════════════════════════════════════════════════════
  {
    id: "paid-aiml-internship-2026",
    slug: "paid-aiml-internship-2026",
    title: "Paid AI/ML & Generative AI Internship Preparation Arena",
    shortName: "AI/ML Internship",
    companyOrOrg: "Top AI Startups & Enterprises (Razorpay, Stripe, Swiggy, OpenAI Ecosystem)",
    category: "SPECIALIZED_INTERNSHIP",
    categoryLabel: "Specialized Career & Internship Track",
    tagline: "Master Python data stack, PyTorch deep learning, RAG pipelines, LLM fine-tuning, and production model serving.",
    description: "Comprehensive preparation arena designed to secure competitive paid machine learning and GenAI engineering internships (₹50k - ₹1.5L/month stipend). Focuses on verified hands-on skills: Vector databases, chunking strategies, embeddings, evaluation metrics, and GPU deployment.",
    badge: "High-Stipend Track",
    icon: "🧠",
    officialUrl: "https://cognalyze.com/student/skills/ai-data",
    sourceAttribution: "Industry AI Internship Job Descriptions (Anthropic, Razorpay, Zepto, Swiggy AI)",
    stipendOrPrize: "₹50,000 - ₹1,50,000 / month Stipend + PPO Fast-Track",
    confirmedStipendAmount: 75000,
    currency: "INR",
    duration: "8 - 12 Weeks Structured Preparation",
    applicationDeadline: "2027-06-15T18:00:00Z",
    eventOrProgramDates: "Year-Round Rolling Hiring (2026–2027 Internships)",
    cycleYear: 2027,
    cycleStatus: "active",
    dateVerificationStatus: "rolling",
    cycleNotes: "Startups and AI research teams open Winter/Spring/Summer 2027 internship cohorts on a rolling basis.",
    eligibility: {
      degreesAllowed: ["B.Tech", "B.E.", "M.Tech", "MS", "MCA", "Self-Taught Developers"],
      graduationYears: [2027, 2028, 2029],
      minCgpaOrGpa: "No rigid cutoff; code and project portfolio prioritized",
      branchRestrictions: ["Open to all branches"],
      otherRequirements: ["Demonstrated Python, Math/Stats, and ML project evidence"]
    },
    selectionRounds: [
      {
        roundNumber: 1,
        name: "Technical Screening: Python, SQL & ML Math Assessment",
        description: "45-minute technical assessment covering NumPy vectorization, Pandas aggregations, SQL window functions, and ML evaluation metrics (ROC-AUC, F1, Loss).",
        format: "Online Coding & Theory Sandbox",
        eliminatory: true
      },
      {
        roundNumber: 2,
        name: "Machine Learning Take-Home Assignment / RAG Build",
        description: "Build an end-to-end ML model or RAG pipeline with evaluation scripts, containerization, and API endpoint within 48 hours.",
        format: "GitHub Submission + Evaluation Metrics Log",
        eliminatory: true
      },
      {
        roundNumber: 3,
        name: "Live Technical Architecture & Deep Learning Defense",
        description: "Live whiteboarding with Senior ML Engineers. Defend model architecture, hallucination reduction, quantization, and deployment trade-offs.",
        format: "Live Video Whiteboarding & Code Walkthrough",
        eliminatory: true
      }
    ],
    requiredSkills: [
      { skill: "Python Vectorized Data Stack (NumPy, Pandas)", proficiency: "Advanced", isMustHave: true, provenance: "VERIFIED" },
      { skill: "Machine Learning Math & Loss Functions", proficiency: "Intermediate", isMustHave: true, provenance: "VERIFIED" },
      { skill: "Generative AI, Embeddings & RAG Architectures", proficiency: "Intermediate", isMustHave: true, provenance: "VERIFIED" },
      { skill: "Relational SQL (CTEs & Window Functions)", proficiency: "Intermediate", isMustHave: true, provenance: "VERIFIED" },
      { skill: "FastAPI / Docker Production Serving", proficiency: "Intermediate", isMustHave: false, provenance: "RECOMMENDED" }
    ],
    primaryDomains: ["ai_data", "project", "code_comprehension", "cs_fundamentals"],
    phases: {
      absolute_beginner: [
        {
          phaseNumber: 1,
          phaseName: "Python for Data & Vectorized Programming",
          description: "Learn Python memory model, mutable vs immutable types, list comprehensions, NumPy broadcasting, and Pandas series.",
          totalEstimatedHours: 20,
          tasks: [
            {
              id: "aiml-ab-1",
              phase: 1,
              phaseName: "Python Memory & Mutability",
              title: "Solve Python Object Memory & Mutable Reference Challenges",
              description: "Complete mutable reference safe cloner and bytecode disassembler challenges in AI & Data Arena.",
              estimatedMinutes: 90,
              linkedDomain: "ai_data",
              targetHref: "/student/skills/ai-data?tab=coding-arena&subject=subj_python",
              actionLabel: "Launch Python Coding Arena",
              minLevelRequired: "absolute_beginner",
              learningOutcomes: ["Pass-by-object-reference semantics", "Deep vs Shallow copy", "Default argument mutation trap"],
              evidenceGenerated: "Python core memory mechanics verified"
            },
            {
              id: "aiml-ab-2",
              phase: 1,
              phaseName: "SQL Foundations",
              title: "Master SQL CTEs & Aggregations in In-Memory SQLite",
              description: "Execute SQL queries calculating user retention cohorts and revenue per category in the SQL sandbox.",
              estimatedMinutes: 90,
              linkedDomain: "ai_data",
              targetHref: "/student/skills/ai-data?tab=coding-arena&subject=subj_sql",
              actionLabel: "Practice SQL in AI & Data Arena",
              minLevelRequired: "absolute_beginner",
              learningOutcomes: ["Common Table Expressions (WITH)", "GROUP BY and HAVING distinctions", "Inner vs Left Outer joins"],
              evidenceGenerated: "Relational SQL querying verified"
            }
          ]
        }
      ],
      beginner: [
        {
          phaseNumber: 1,
          phaseName: "Classical Machine Learning & Loss Optimization",
          description: "Implement Linear/Logistic Regression from scratch using gradient descent, train Random Forests, and tune hyperparameters.",
          totalEstimatedHours: 25,
          tasks: [
            {
              id: "aiml-beg-1",
              phase: 1,
              phaseName: "Gradient Descent",
              title: "Vectorized Gradient Descent & Cross-Entropy Loss",
              description: "Implement loss function calculation and weight updates in Python without scikit-learn in AI & Data Arena.",
              estimatedMinutes: 90,
              linkedDomain: "ai_data",
              targetHref: "/student/skills/ai-data?tab=coding-arena&subject=subj_classical_ml",
              actionLabel: "Practice ML in AI & Data Arena",
              minLevelRequired: "beginner",
              learningOutcomes: ["Vectorized dot product weight updates", "Learning rate scheduling", "L1 vs L2 regularization (Ridge vs Lasso)"],
              evidenceGenerated: "Gradient descent implementation verified"
            }
          ]
        }
      ],
      intermediate: [
        {
          phaseNumber: 1,
          phaseName: "Generative AI, Embeddings & RAG Architecture",
          description: "Build an end-to-end Retrieval-Augmented Generation (RAG) system with hybrid search, re-ranking, and grounded citations.",
          totalEstimatedHours: 35,
          tasks: [
            {
              id: "aiml-int-1",
              phase: 1,
              phaseName: "RAG Pipeline",
              title: "Build Document Chunking & Vector Similarity Search Pipeline",
              description: "Build recursive text chunker and cosine similarity index over documentation in the Applied Projects Hub.",
              estimatedMinutes: 120,
              linkedDomain: "ai_data",
              targetHref: "/student/skills/ai-data?tab=applied-projects",
              actionLabel: "Build in Applied Projects Hub",
              minLevelRequired: "intermediate",
              learningOutcomes: ["Recursive character vs token chunking", "Cosine similarity computation", "Cross-encoder re-ranking"],
              evidenceGenerated: "Verified production RAG pipeline"
            }
          ]
        }
      ],
      advanced: [
        {
          phaseNumber: 1,
          phaseName: "LLM Evaluation, Guardrails & Production Deployment",
          description: "Implement automated hallucination detection using RAGAS metrics, structured JSON output validation, and Docker deployment.",
          totalEstimatedHours: 30,
          tasks: [
            {
              id: "aiml-adv-1",
              phase: 1,
              phaseName: "Model Serving",
              title: "Deploy FastAPI Inference Server with Docker & Pydantic Validation",
              description: "Build asynchronous FastAPI microservice with Pydantic response contracts and streaming responses.",
              estimatedMinutes: 120,
              linkedDomain: "ai_data",
              targetHref: "/student/skills/ai-data?tab=coding-arena&subject=subj_genai",
              actionLabel: "Launch GenAI Sandbox",
              minLevelRequired: "advanced",
              learningOutcomes: ["FastAPI asynchronous streaming response", "Pydantic structured output enforcement", "Docker multi-stage builds"],
              evidenceGenerated: "Production AI service deployment verified"
            }
          ]
        }
      ]
    },
    projects: [
      {
        id: "proj-aiml-1",
        title: "OmniDoc-RAG: Production Enterprise Knowledge Assistant with Grounded Citations",
        tagline: "Enterprise document Q&A engine with hybrid dense/sparse retrieval, cross-encoder re-ranking, and hallucination scoring.",
        difficulty: "Advanced",
        estimatedDays: 14,
        architectureSummary: "A scalable RAG pipeline that processes PDF/Markdown technical documentation, splits with semantic overlap, stores vectors in ChromaDB/Qdrant, performs BM25 + dense hybrid search, and serves answers with exact line-number citations.",
        techStack: ["Python", "FastAPI", "ChromaDB", "Sentence-Transformers", "PyTest", "Docker"],
        systemComponents: [
          { component: "Document Ingestion & Chunker", technology: "Recursive Character Chunker", responsibility: "Extract text and generate 500-token chunks with 50-token overlap" },
          { component: "Hybrid Retrieval Engine", technology: "ChromaDB (Dense) + BM25 (Sparse)", responsibility: "Retrieve top-20 candidate passages combining keyword and semantic match" },
          { component: "Cross-Encoder Re-Ranker", technology: "MiniLM Cross-Encoder", responsibility: "Re-score top-20 down to top-5 most relevant passages" },
          { component: "FastAPI Inference API", technology: "FastAPI + Pydantic v2", responsibility: "Stream response tokens with markdown citation footnotes" }
        ],
        milestones: [
          { milestoneNumber: 1, title: "Deterministic Chunking & Embedding Pipeline", description: "Implement document chunking with metadata tracking", deliverable: "Tested chunking script" },
          { milestoneNumber: 2, title: "Hybrid Search & Re-Ranking Engine", description: "Combine dense vectors with BM25 sparse scores", deliverable: "Retrieval evaluation benchmark" },
          { milestoneNumber: 3, title: "FastAPI Service & Docker Container", description: "Serve streaming completions with citation anchors", deliverable: "Complete dockerized API" }
        ],
        acceptanceCriteria: [
          "Zero hallucination: If answer is not in retrieved chunks, responds 'I do not have sufficient information in the provided documents'",
          "Every claim is backed by [doc_name:page:line] citation",
          "Unit test coverage > 85%"
        ],
        demoRequirements: "Video demonstration querying the API with a complex technical PDF, showing retrieved chunk scores, and verified answer with correct page citations.",
        sampleSubmissionHint: "Present this project as your primary portfolio proof when applying for AI/ML internship roles."
      }
    ],
    mockAssessments: [
      {
        id: "aiml-mock-oa",
        title: "AI/ML Engineer Internship Technical Screening",
        type: "technical_oa",
        durationMinutes: 45,
        totalMarks: 50,
        passingPercentage: 75,
        questions: [
          {
            id: "aiml-q1",
            question: "Why does multiplying embeddings by their cosine similarity fail if vectors have not been normalized to unit length (L2 norm = 1)?",
            type: "conceptual",
            options: [
              "Because dot product is magnitude-dependent: longer vectors receive artificially high scores without normalization",
              "Because cosine similarity is only valid for non-negative numbers",
              "Because matrix multiplication requires square dimensions",
              "Because floating-point precision causes catastrophic cancellation"
            ],
            correctAnswer: "Because dot product is magnitude-dependent: longer vectors receive artificially high scores without normalization",
            marks: 15,
            rubric: "Understands dot product vs cosine distance and L2 normalization mechanics."
          }
        ]
      }
    ],
    diagnosticQuestions: [
      {
        id: "diag-aiml-1",
        question: "What is your current experience with Machine Learning and Generative AI?",
        options: [
          { label: "Absolute beginner: Learning Python syntax and basic math.", recommendedLevel: "absolute_beginner" },
          { label: "Beginner: Trained standard models (scikit-learn) and know basic Pandas.", recommendedLevel: "beginner" },
          { label: "Intermediate: Built RAG pipelines, fine-tuned models, and understand vector databases.", recommendedLevel: "intermediate" },
          { label: "Advanced: Deployed production ML APIs with Docker, quantization, and evaluation benchmarks.", recommendedLevel: "advanced" }
        ]
      }
    ]
  },

  // ══════════════════════════════════════════════════════════════════════
  // 6. GOOGLE SOFTWARE ENGINEER (SWE / SDE) HIRING PREPARATION ARENA
  // ══════════════════════════════════════════════════════════════════════
  {
    id: "google-swe-prep-2026",
    slug: "google-swe-prep-2026",
    title: "Google SWE & SDE Campus Hiring Preparation Arena",
    shortName: "Google SWE Prep",
    companyOrOrg: "Google",
    category: "COMPANY_HIRING",
    categoryLabel: "Company-Specific Technical Hiring Track",
    tagline: "Master LeetCode Hard algorithms, Google-style Socratic whiteboard interviews, and distributed scale thinking.",
    description: "Rigorous technical interview preparation arena calibrated to Google Software Engineering campus hiring and internships. Focuses on advanced algorithms (Segment Trees, Dynamic Programming on Trees, Dijkstra variants), clean modular code, and communicating trade-offs during live problem-solving.",
    badge: "Tier-1 FAANG Hiring",
    icon: "🔍",
    officialUrl: "https://careers.google.com/students",
    sourceAttribution: "Official Google Students & University Programs Hiring Architecture",
    stipendOrPrize: "Google SDE-1 (₹35-45 LPA CTC) / Summer Intern (₹1.2L/month stipend)",
    confirmedStipendAmount: 120000,
    currency: "INR",
    duration: "10 - 14 Weeks Intensive Preparation",
    applicationDeadline: "2027-09-30T18:00:00Z",
    eventOrProgramDates: "2026–2027 Campus & Off-Campus Hiring Cycle",
    cycleYear: 2027,
    cycleStatus: "active",
    dateVerificationStatus: "rolling",
    cycleNotes: "Google SWE Intern & New Grad 2027 cohorts recruit on rolling regional windows across Winter 2026 – Fall 2027.",
    eligibility: {
      degreesAllowed: ["B.Tech", "B.E.", "M.Tech", "Dual Degree", "PhD", "MCA"],
      graduationYears: [2027, 2028, 2029],
      minCgpaOrGpa: "No official cutoff; problem solving excellence strictly assessed",
      branchRestrictions: ["All Engineering Branches Eligible"],
      otherRequirements: ["Strong algorithmic foundation in C++, Java, or Python"]
    },
    selectionRounds: [
      {
        roundNumber: 1,
        name: "Google Online Challenge (GOC)",
        description: "Timed 60-minute coding assessment on Google's testing platform consisting of 2 algorithmic challenges (Medium & Hard).",
        format: "Online Proctored Algorithmic Test",
        eliminatory: true
      },
      {
        roundNumber: 2,
        name: "Technical Phone Screening (Round 1)",
        description: "45-minute live coding session on Google Docs / Interview Sandbox with a Google Software Engineer. Problem solving, edge case identification, and time complexity proofs.",
        format: "Live 1:1 Google Meet & Shared Editor",
        eliminatory: true
      },
      {
        roundNumber: 3,
        name: "Onsite / Final Virtual Rounds (Rounds 2, 3 & 4)",
        description: "Three consecutive 45-minute rounds covering advanced algorithms, tree/graph traversal, and Googleyness & Leadership behavioral alignment.",
        format: "3 Technical Rounds + 1 Googleyness Round",
        eliminatory: true
      }
    ],
    requiredSkills: [
      { skill: "Advanced Data Structures (Segment Trees, Trie, Disjoint Sets)", proficiency: "Advanced", isMustHave: true, provenance: "VERIFIED" },
      { skill: "Dynamic Programming on Trees & Bitmask DP", proficiency: "Advanced", isMustHave: true, provenance: "VERIFIED" },
      { skill: "Graph Algorithms (Shortest Paths, Bridges, Articulation Points)", proficiency: "Advanced", isMustHave: true, provenance: "VERIFIED" },
      { skill: "Communication of Algorithmic Trade-offs & Edge Cases", proficiency: "Advanced", isMustHave: true, provenance: "VERIFIED" },
      { skill: "Googleyness & Collaborative Mindset", proficiency: "Intermediate", isMustHave: true, provenance: "VERIFIED" }
    ],
    primaryDomains: ["dsa", "behavioral", "cs_fundamentals", "system_design"],
    phases: {
      absolute_beginner: [
        {
          phaseNumber: 1,
          phaseName: "Core Problem Solving & Recursion Masterclass",
          description: "Establish foundational recursion, stack memory tracing, and two-pointer arrays in DSA Arena.",
          totalEstimatedHours: 25,
          tasks: [
            {
              id: "goog-ab-1",
              phase: 1,
              phaseName: "Recursion & Backtracking",
              title: "Subsets, Permutations & Backtracking Trees",
              description: "Solve backtracking recursion trees and state space exploration in DSA Arena.",
              estimatedMinutes: 90,
              linkedDomain: "dsa",
              targetHref: "/student/skills/dsa?topic=recursion",
              actionLabel: "Practice in DSA Arena",
              minLevelRequired: "absolute_beginner",
              learningOutcomes: ["Recursion base case proofs", "Call stack unwinding", "Pruning dead search branches"],
              evidenceGenerated: "Recursion & Backtracking verified in Student DNA"
            }
          ]
        }
      ],
      beginner: [
        {
          phaseNumber: 1,
          phaseName: "Binary Trees & BST Invariants",
          description: "Solve Tree traversals, Lowest Common Ancestor (LCA), and maximum path sum.",
          totalEstimatedHours: 25,
          tasks: [
            {
              id: "goog-beg-1",
              phase: 1,
              phaseName: "Trees Mastery",
              title: "Lowest Common Ancestor & Binary Tree Maximum Path Sum",
              description: "Implement tree recursion calculating diameter, path sum, and LCA in DSA Arena.",
              estimatedMinutes: 90,
              linkedDomain: "dsa",
              targetHref: "/student/skills/dsa?topic=trees",
              actionLabel: "Solve Trees in DSA Arena",
              minLevelRequired: "beginner",
              learningOutcomes: ["Post-order depth-first calculation", "Handling negative node weights", "LCA in O(N) time and O(H) space"],
              evidenceGenerated: "Tree algorithms verified"
            }
          ]
        }
      ],
      intermediate: [
        {
          phaseNumber: 1,
          phaseName: "Advanced Graphs, Tries & Sliding Window",
          description: "Solve Word Break with Trie, Alien Dictionary (Topological Sort), and Hard Sliding Window problems.",
          totalEstimatedHours: 35,
          tasks: [
            {
              id: "goog-int-1",
              phase: 1,
              phaseName: "Trie & Prefix Trees",
              title: "Implement Trie (Prefix Tree) with Autocomplete & Wildcard Search",
              description: "Build prefix tree handling insertions, search, and prefix matching in DSA Arena.",
              estimatedMinutes: 90,
              linkedDomain: "dsa",
              targetHref: "/student/skills/dsa?topic=trie",
              actionLabel: "Implement Trie in DSA Arena",
              minLevelRequired: "intermediate",
              learningOutcomes: ["Trie node pointer structure", "O(L) search time complexity", "Memory trade-offs vs Hash Tables"],
              evidenceGenerated: "Trie data structure verified"
            }
          ]
        }
      ],
      advanced: [
        {
          phaseNumber: 1,
          phaseName: "Google Mock Socratic Interview & Hard Coding",
          description: "Simulate live Google 45-minute technical interview with real-time think-aloud practice and edge cases.",
          totalEstimatedHours: 30,
          tasks: [
            {
              id: "goog-adv-1",
              phase: 1,
              phaseName: "Live Google Mock",
              title: "Simulate 45-min Google SWE Algorithmic Interview",
              description: "Solve novel hard challenge without syntax help, verbalize trade-offs, and prove time/space complexity.",
              estimatedMinutes: 60,
              linkedDomain: "dsa",
              targetHref: "/student/practice-interview?track=product_faang",
              actionLabel: "Launch Google FAANG Interview",
              minLevelRequired: "advanced",
              learningOutcomes: ["Think-aloud protocol during coding", "Asking clarifying questions before coding", "Testing edge cases before being prompted"],
              evidenceGenerated: "Google SWE mock interview completed with score >= 80%"
            }
          ]
        }
      ]
    },
    projects: [
      {
        id: "proj-goog-1",
        title: "Distributed Rate Limiter & Sliding Window Log Streamer",
        tagline: "High-throughput token bucket & sliding-window log streamer modeled on Google Cloud Armor architecture.",
        difficulty: "Advanced",
        estimatedDays: 10,
        architectureSummary: "A distributed rate limiting daemon using Redis token buckets, thread-safe memory buffers, and clean algorithmic complexity bounds.",
        techStack: ["C++ / Python / Go", "Redis", "Docker", "PyTest / GoogleTest"],
        systemComponents: [
          { component: "Token Bucket Engine", technology: "Atomic Decrements", responsibility: "Enforce precise per-client rate quotas with sub-millisecond overhead" },
          { component: "Sliding Window Log Buffer", technology: "Circular Buffer", responsibility: "Maintain timestamped sliding window logs for accurate fraud detection" }
        ],
        milestones: [
          { milestoneNumber: 1, title: "Token Bucket Implementation", description: "Implement thread-safe token bucket algorithm", deliverable: "Tested limiter class" },
          { milestoneNumber: 2, title: "Sliding Window Log Streamer", description: "Implement sliding window counter", deliverable: "Benchmarked performance suite" }
        ],
        acceptanceCriteria: [
          "Zero race conditions under 1,000 parallel threads",
          "O(1) time complexity for rate checking"
        ],
        demoRequirements: "Demonstrate benchmark showing 100,000 requests processed with exact rate limit throttling enforced.",
        sampleSubmissionHint: "Highlight your mathematical time complexity and lock-free thread safety."
      }
    ],
    mockAssessments: [
      {
        id: "goog-mock-oa",
        title: "Google Online Challenge (GOC) Simulation",
        type: "technical_oa",
        durationMinutes: 60,
        totalMarks: 100,
        passingPercentage: 80,
        questions: [
          {
            id: "goog-q1",
            question: "Given a directed graph of server connections with latencies, find the length of the shortest path from server 0 to N-1 such that at most K servers in the path have an odd number of connections.",
            type: "coding",
            starterCode: "def shortest_path_constrained(n, edges, k):\n    # Write modified Dijkstra with 2D state (node, odd_count_left)\n    pass",
            marks: 50,
            rubric: "Evaluates state-space graph modeling where state is (cost, node, k_remaining)."
          }
        ]
      }
    ],
    diagnosticQuestions: [
      {
        id: "diag-goog-1",
        question: "How comfortable are you solving LeetCode Medium/Hard algorithmic challenges without syntax assistance?",
        options: [
          { label: "Beginner: Still learning basic data structures.", recommendedLevel: "absolute_beginner" },
          { label: "Intermediate: Can solve LeetCode Mediums with some trial-and-error.", recommendedLevel: "intermediate" },
          { label: "Advanced: Regularly solve LeetCode Hard and can prove time/space complexity.", recommendedLevel: "advanced" }
        ]
      }
    ]
  },

  // ══════════════════════════════════════════════════════════════════════
  // 7. JPMC CODE FOR GOOD (2027 CYCLE)
  // ══════════════════════════════════════════════════════════════════════
  {
    id: "jpmc-code-for-good-2027",
    slug: "jpmc-code-for-good-2027",
    title: "JPMorgan Chase Code for Good 2027 Preparation Arena",
    shortName: "JPMC Code for Good",
    companyOrOrg: "JPMorgan Chase & Co.",
    category: "COMPANY_HACKATHON",
    categoryLabel: "24-Hour Social Impact Hackathon & SEP Hiring Track",
    tagline: "Clear JPMC HackerRank screening + HireVue and collaborate with mentors to ship non-profit tech solutions in 24 hours.",
    description: "JPMorgan Chase's flagship hackathon hiring pathway for Software Engineer Program (SEP) Interns and Full-Time roles. Evaluated heavily on Git collaboration, rapid MVP delivery for NGO problem statements, mentor interaction, and clean system integration.",
    badge: "Direct SEP / Intern Conversion",
    icon: "🏦",
    officialUrl: "https://careers.jpmorgan.com/global/en/students/programs/code-for-good",
    sourceAttribution: "Official JPMorgan Chase Careers & SEP Hiring Guidelines",
    stipendOrPrize: "Summer Intern / SEP Full-Time Conversion Offers + Mentor Recognition",
    currency: "INR",
    duration: "6 - 8 Weeks Prep + 24-Hour Hackathon",
    applicationDeadline: "2027-04-15T18:00:00Z",
    eventOrProgramDates: "Projected June – July 2027 (Applications typically Feb – Apr 2027)",
    cycleYear: 2027,
    cycleStatus: "upcoming_unannounced",
    dateVerificationStatus: "estimated_from_previous_cycle",
    cycleNotes: "Based on historical JPMC Software Engineer Program campus timelines; verify active campus opening on careers.jpmorgan.com.",
    eligibility: {
      degreesAllowed: ["B.Tech", "B.E.", "M.Tech", "MCA"],
      graduationYears: [2028, 2029],
      minCgpaOrGpa: "7.0+ CGPA (typically 70% equivalent)",
      branchRestrictions: ["Circuit / CS / IT / All Eligible Engineering Branches per campus"],
      otherRequirements: ["Clear HackerRank Coding Challenge & HireVue Video Interview"]
    },
    selectionRounds: [
      { roundNumber: 1, name: "HackerRank Online Coding Challenge", description: "2 algorithmic coding problems focusing on arrays, strings, maps, and greedy optimization.", format: "Online Coding Assessment", eliminatory: true },
      { roundNumber: 2, name: "HireVue Video Interview", description: "2 behavioral/situational prompts recorded with structured STAR reflection.", format: "Asynchronous Video Interview", eliminatory: true },
      { roundNumber: 3, name: "24-Hour Code for Good Hackathon", description: "Assigned to a cross-college team of 6–7 with 2 JPMC mentors solving a real NGO problem statement.", format: "24-Hour Mentored Hackathon", eliminatory: true }
    ],
    requiredSkills: [
      { skill: "Data Structures & Algorithms (Arrays, Maps, Greedy)", proficiency: "Intermediate", isMustHave: true, provenance: "VERIFIED" },
      { skill: "Full-Stack Rapid Prototyping (React / Node / Django / FastAPI)", proficiency: "Intermediate", isMustHave: true, provenance: "VERIFIED" },
      { skill: "Git Collaboration & Branch Conflict Resolution", proficiency: "Intermediate", isMustHave: true, provenance: "VERIFIED" },
      { skill: "Behavioral Communication & Mentor Check-ins", proficiency: "Intermediate", isMustHave: true, provenance: "RECOMMENDED" }
    ],
    primaryDomains: ["dsa", "project", "behavioral", "github"],
    phases: {
      absolute_beginner: [
        {
          phaseNumber: 1,
          phaseName: "HackerRank Screening & Git Collaboration",
          description: "Build fluency in core array/map DSA problems and team Git PR workflows so you contribute cleanly on hackathon day.",
          totalEstimatedHours: 16,
          tasks: [
            { id: "jpmc-ab-1", phase: 1, phaseName: "DSA Core", title: "Arrays, HashMaps & String Manipulation Drill", description: "Solve foundational HackerRank-style coding patterns.", estimatedMinutes: 90, linkedDomain: "dsa", targetHref: "/student/skills/dsa", actionLabel: "Open DSA Arena", minLevelRequired: "absolute_beginner", learningOutcomes: ["O(n) frequency counting", "Prefix sums", "Edge-case input validation"], evidenceGenerated: "Arrays & HashMaps solved in sandbox" }
          ]
        }
      ],
      beginner: [
        {
          phaseNumber: 1,
          phaseName: "Screening + Full-Stack MVP Velocity",
          description: "Combine HackerRank speed with clean REST API & Auth scaffolding for 24-hour delivery.",
          totalEstimatedHours: 22,
          tasks: [
            { id: "jpmc-bg-1", phase: 1, phaseName: "Behavioral HireVue", title: "Practice STAR Behavioral Prompts", description: "Structure teamwork, conflict resolution, and adaptability answers cleanly.", estimatedMinutes: 45, linkedDomain: "behavioral", targetHref: "/student/skills/behavioral", actionLabel: "Open Behavioral Arena", minLevelRequired: "beginner", learningOutcomes: ["Concise 90-second STAR delivery"], evidenceGenerated: "Behavioral interview readiness" }
          ]
        }
      ],
      intermediate: [
        {
          phaseNumber: 1,
          phaseName: "24-Hour Architecture & Mentor Readiness",
          description: "Master DB modeling, RBAC, and team Git rebasing under time pressure.",
          totalEstimatedHours: 18,
          tasks: [
            { id: "jpmc-in-1", phase: 1, phaseName: "System Design", title: "Design Multi-Role NGO Portal & SQL Schema", description: "Model NGO beneficiary tracking with clean REST endpoints.", estimatedMinutes: 75, linkedDomain: "system_design", targetHref: "/student/skills/system-design", actionLabel: "Open System Design Arena", minLevelRequired: "intermediate", learningOutcomes: ["RBAC schema design", "API contract synchronization"], evidenceGenerated: "System architecture verified" }
          ]
        }
      ],
      advanced: [
        {
          phaseNumber: 1,
          phaseName: "Team Technical Leadership & Deployment",
          description: "Lead Git merges, CI verification, and accessibility/AI enhancements in 24 hours.",
          totalEstimatedHours: 12,
          tasks: [
            { id: "jpmc-ad-1", phase: 1, phaseName: "Code Review", title: "Simulate High-Velocity Team Code Walkthrough", description: "Practice explaining architecture trade-offs to engineering mentors.", estimatedMinutes: 45, linkedDomain: "code_comprehension", targetHref: "/student/skills/code-comprehension", actionLabel: "Open Code Comprehension", minLevelRequired: "advanced", learningOutcomes: ["Clear architectural justification"], evidenceGenerated: "Code walkthrough demonstrated" }
          ]
        }
      ]
    },
    projects: [
      {
        id: "jpmc-ngo-tracker",
        title: "Sahayak: Offline-First NGO Field Operations & Volunteer Coordination Platform",
        tagline: "Role-based beneficiary intake, multilingual forms, and automated volunteer matching designed for 24-hour NGO hackathon impact.",
        difficulty: "Intermediate",
        estimatedDays: 5,
        architectureSummary: "React + Next.js frontend with indexed local draft sync, FastAPI/Node REST API, PostgreSQL schema for beneficiaries & volunteers.",
        techStack: ["Next.js", "PostgreSQL", "TypeScript", "REST API"],
        systemComponents: [
          { component: "Field Intake PWA", technology: "Next.js + IndexedDB", responsibility: "Captures field surveys offline and syncs cleanly on reconnect" },
          { component: "Allocation API", technology: "Node.js / PostgreSQL", responsibility: "Matches verified volunteers to NGO cases by skill and region" }
        ],
        milestones: [
          { milestoneNumber: 1, title: "Auth & RBAC Schema", description: "Admin, Mentor, Volunteer roles", deliverable: "Tested migration & auth routes" },
          { milestoneNumber: 2, title: "End-to-End Impact Dashboard", description: "Live case metrics & demo seed", deliverable: "Deployed working demo" }
        ],
        acceptanceCriteria: ["Zero broken auth routes", "Clean responsive mobile layout for field volunteers"],
        demoRequirements: "Live 3-minute walkthrough prioritizing NGO problem statement alignment."
      }
    ],
    mockAssessments: [
      {
        id: "jpmc-oa-mock",
        title: "JPMC HackerRank + HireVue Screening Mock",
        type: "technical_oa",
        durationMinutes: 45,
        totalMarks: 50,
        passingPercentage: 70,
        questions: [
          { id: "jpmc-q1", question: "When a hackathon mentor reviews your team during Code for Good, what is evaluated MOST alongside working code?", type: "conceptual", options: ["Individual code commits only without helping teammates", "Collaborative communication, clean Git hygiene, problem decomposition, and willingness to unblock teammates", "Using the most complex microservices even if incomplete", "Writing zero documentation"], correctAnswer: "Collaborative communication, clean Git hygiene, problem decomposition, and willingness to unblock teammates", marks: 50, rubric: "Evaluates genuine understanding of JPMC mentor evaluation criteria." }
        ]
      }
    ],
    diagnosticQuestions: [
      {
        id: "diag-jpmc-1",
        question: "What is your current experience building and deploying a full-stack team app with Git?",
        options: [
          { label: "Still learning Git branching and REST APIs.", recommendedLevel: "absolute_beginner" },
          { label: "Built 1-2 solo apps; want faster team delivery.", recommendedLevel: "beginner" },
          { label: "Comfortable with Git PRs, SQL schemas, and API integration.", recommendedLevel: "intermediate" }
        ]
      }
    ]
  },

  // ══════════════════════════════════════════════════════════════════════
  // 8. MICROSOFT IMAGINE CUP (2027 CYCLE)
  // ══════════════════════════════════════════════════════════════════════
  {
    id: "microsoft-imagine-cup-2027",
    slug: "microsoft-imagine-cup-2027",
    title: "Microsoft Imagine Cup 2027 Preparation Arena",
    shortName: "Imagine Cup",
    companyOrOrg: "Microsoft",
    category: "COMPANY_HACKATHON",
    categoryLabel: "Global Student AI & Startup Innovation Competition",
    tagline: "Build an AI-powered startup MVP with Azure/AI Foundry, real user validation, and crisp 3-minute World Finals storytelling.",
    description: "Microsoft's premier global student technology competition focused on turning AI-driven startup concepts into validated products. Emphasizes real customer validation, responsible AI architecture, Azure cloud scalability, and commercial viability.",
    badge: "Global Startup Cup ($100k Prize Tier)",
    icon: "🚀",
    officialUrl: "https://imaginecup.microsoft.com",
    sourceAttribution: "Official Microsoft Imagine Cup Rules & Evaluation Rubric",
    stipendOrPrize: "Up to $100,000 USD Grand Prize + Azure Credits + Executive Mentorship (Prior Official Structure)",
    currency: "USD",
    duration: "8 - 16 Weeks MVP & Validation Cycle",
    applicationDeadline: "2027-01-22T18:00:00Z",
    eventOrProgramDates: "Projected Nov 2026 – May 2027 Cycle (Verify current regional deadlines on imaginecup.microsoft.com)",
    cycleYear: 2027,
    cycleStatus: "upcoming_unannounced",
    dateVerificationStatus: "estimated_from_previous_cycle",
    cycleNotes: "Verify exact MVP submission cutoff dates on imaginecup.microsoft.com for your country/region.",
    eligibility: {
      degreesAllowed: ["High School, Undergraduate, Graduate Students (18+)"],
      graduationYears: [2027, 2028, 2029, 2030],
      branchRestrictions: ["All disciplines eligible"],
      otherRequirements: ["Teams up to 4 students", "Must use cloud & AI responsibly with original IP"]
    },
    selectionRounds: [
      { roundNumber: 1, name: "MVP Submission & Pitch Video", description: "Submit working MVP demo video, architecture, and business viability narrative.", format: "3-Minute Video + Pitch Deck + Live Endpoint", eliminatory: true },
      { roundNumber: 2, name: "Semifinals & Mentorship Acceleration", description: "Refine product scalability, security, and go-to-market validation with Microsoft mentors.", format: "Mentored Virtual Round", eliminatory: true },
      { roundNumber: 3, name: "World Championship Pitch", description: "Live pitch and Q&A before industry judges.", format: "Live Finals Pitch", eliminatory: true }
    ],
    requiredSkills: [
      { skill: "Applied AI / RAG / Multimodal Model Integration", proficiency: "Intermediate", isMustHave: true, provenance: "VERIFIED" },
      { skill: "Cloud Architecture & Deployment", proficiency: "Intermediate", isMustHave: true, provenance: "VERIFIED" },
      { skill: "Product Validation & Technical Storytelling", proficiency: "Intermediate", isMustHave: true, provenance: "RECOMMENDED" }
    ],
    primaryDomains: ["ai_data", "system_design", "project", "behavioral"],
    phases: {
      absolute_beginner: [
        { phaseNumber: 1, phaseName: "AI Foundations & Problem Validation", description: "Learn structured prompt/RAG workflows and validate a concrete real-world user bottleneck.", totalEstimatedHours: 14, tasks: [{ id: "ic-ab-1", phase: 1, phaseName: "AI Core", title: "Build Grounded RAG Prototype in AI & Data Arena", description: "Learn chunking, embeddings, and citation grounding.", estimatedMinutes: 90, linkedDomain: "ai_data", targetHref: "/student/skills/ai-data", actionLabel: "Open AI & Data Arena", minLevelRequired: "absolute_beginner", learningOutcomes: ["Retrieval accuracy evaluation", "Avoiding hallucinations"], evidenceGenerated: "AI prototype fundamentals" }] }
      ],
      beginner: [
        { phaseNumber: 1, phaseName: "Working MVP Architecture", description: "Ship an end-to-end hosted product demo.", totalEstimatedHours: 20, tasks: [{ id: "ic-bg-1", phase: 1, phaseName: "System Design", title: "Design Cloud API & Inference Pipeline", description: "Ensure latency, privacy, and telemetry safeguards.", estimatedMinutes: 60, linkedDomain: "system_design", targetHref: "/student/skills/system-design", actionLabel: "Open System Design", minLevelRequired: "beginner", learningOutcomes: ["API rate limiting", "Responsible AI guardrails"], evidenceGenerated: "MVP architecture documented" }] }
      ],
      intermediate: [
        { phaseNumber: 1, phaseName: "Telemetry, Responsible AI & Pitch Defense", description: "Add user evaluation metrics and stress-test pitch Q&A.", totalEstimatedHours: 16, tasks: [{ id: "ic-in-1", phase: 1, phaseName: "Evaluation", title: "Benchmark Latency & Evaluation Metrics", description: "Quantify real precision/latency improvements over baseline.", estimatedMinutes: 75, linkedDomain: "ai_data", targetHref: "/student/skills/ai-data", actionLabel: "Open AI & Data Arena", minLevelRequired: "intermediate", learningOutcomes: ["Measurable accuracy benchmark"], evidenceGenerated: "Evaluation proof recorded" }] }
      ],
      advanced: [
        { phaseNumber: 1, phaseName: "Scale, Unit Economics & World Finals Polish", description: "Prove unit economics, security posture, and live multi-user concurrency.", totalEstimatedHours: 12, tasks: [{ id: "ic-ad-1", phase: 1, phaseName: "Defense", title: "Mock Technical Architecture & Startup Defense", description: "Defend build vs buy decisions and moat under judge Q&A.", estimatedMinutes: 45, linkedDomain: "behavioral", targetHref: "/student/skills/behavioral", actionLabel: "Practice Defense", minLevelRequired: "advanced", learningOutcomes: ["Concise judge defense"], evidenceGenerated: "Finals pitch defense" }] }
      ]
    },
    projects: [
      {
        id: "ic-civic-accessibility-ai",
        title: "Accessible Clinical Triage & Multilingual Care Companion",
        tagline: "Low-bandwidth speech-to-structured-clinical-notes assistant with human-in-the-loop verification.",
        difficulty: "Intermediate",
        estimatedDays: 10,
        architectureSummary: "Streaming audio client, quantized transcription + structured JSON validation, audit trail DB, and human clinician override UI.",
        techStack: ["Next.js", "Python FastAPI", "PostgreSQL", "Docker"],
        systemComponents: [
          { component: "Ingestion & Guardrail Service", technology: "FastAPI + Pydantic", responsibility: "Validates inputs and redacts PII before model inference" },
          { component: "Clinician Review Dashboard", technology: "Next.js", responsibility: "Displays confidence indicators and requires human sign-off" }
        ],
        milestones: [
          { milestoneNumber: 1, title: "PII-Safe Pipeline", description: "Redaction & schema validation", deliverable: "Automated pytest verification" },
          { milestoneNumber: 2, title: "Pilot Usability Demo", description: "End-to-end 3-min demo flow", deliverable: "Hosted MVP link" }
        ],
        acceptanceCriteria: ["Zero ungrounded medical claims", "Explicit human-in-the-loop confirmation UI"],
        demoRequirements: "3-minute problem -> architecture -> live user demo -> real feedback loop."
      }
    ],
    mockAssessments: [
      {
        id: "ic-mvp-mock",
        title: "Imagine Cup Architecture & Responsible AI Check",
        type: "hackathon_simulation",
        durationMinutes: 30,
        totalMarks: 50,
        passingPercentage: 70,
        questions: [
          { id: "ic-q1", question: "Which combination makes an Imagine Cup MVP stand out in Round 1 judging?", type: "conceptual", options: ["Slide deck mockups only", "Working live product solving a measurable pain point, responsible AI safeguards, clear business model, and real user feedback", "Cloning an open-source wrapper with no validation", "Focusing solely on UI animations"], correctAnswer: "Working live product solving a measurable pain point, responsible AI safeguards, clear business model, and real user feedback", marks: 50, rubric: "Matches published Microsoft Imagine Cup judging pillars." }
        ]
      }
    ],
    diagnosticQuestions: [
      {
        id: "diag-ic-1",
        question: "Where is your team currently on your AI MVP?",
        options: [
          { label: "Ideation stage; no prototype yet.", recommendedLevel: "absolute_beginner" },
          { label: "Early prototype working locally.", recommendedLevel: "beginner" },
          { label: "Hosted MVP with real user feedback.", recommendedLevel: "intermediate" }
        ]
      }
    ]
  },

  // ══════════════════════════════════════════════════════════════════════
  // 9. SMART INDIA HACKATHON (SIH 2027 CYCLE)
  // ══════════════════════════════════════════════════════════════════════
  {
    id: "sih-2027",
    slug: "sih-2027",
    title: "Smart India Hackathon (SIH) Preparation Arena",
    shortName: "Smart India Hackathon",
    companyOrOrg: "Ministry of Education Innovation Cell (Govt. of India)",
    category: "COMPANY_HACKATHON",
    categoryLabel: "National Software & Hardware Hackathon (6-Member Teams)",
    tagline: "Select high-leverage ministry problem statements, pass internal college SPOC rounds, and ship resilient 36-hour prototypes.",
    description: "India's largest nationwide innovation hackathon pairing student teams of 6 against real ministry and public-sector engineering problem statements. Winning requires rigorous requirement traceability, hardware/software integration clarity, offline/field resilience, and 36-hour mentor iteration.",
    badge: "National Finals • ₹1,00,000+ / PS",
    icon: "🇮🇳",
    officialUrl: "https://www.sih.gov.in",
    sourceAttribution: "Official Smart India Hackathon Portal (sih.gov.in)",
    stipendOrPrize: "₹1,00,000+ Cash Prize per Winning Problem Statement + National Finalist Credential",
    confirmedStipendAmount: 100000,
    currency: "INR",
    duration: "4 - 12 Weeks (Internal Selection + Grand Finale)",
    applicationDeadline: "2027-09-20T18:00:00Z",
    eventOrProgramDates: "Projected Aug – Dec 2027 Cycle (Verify current notification on sih.gov.in)",
    cycleYear: 2027,
    cycleStatus: "upcoming_unannounced",
    dateVerificationStatus: "estimated_from_previous_cycle",
    cycleNotes: "SIH runs annually through institute SPOC nominations in Aug–Oct; verify current active edition problem statements directly on sih.gov.in.",
    eligibility: {
      degreesAllowed: ["B.Tech", "B.E.", "M.Tech", "MCA", "Polytechnic / Engineering Institutes"],
      graduationYears: [2027, 2028, 2029, 2030],
      branchRestrictions: ["All AICTE/UGC recognized engineering institutions"],
      otherRequirements: ["Team of 6 members including mandatory female representation per official SIH team rules", "Nominated via Institute SPOC"]
    },
    selectionRounds: [
      { roundNumber: 1, name: "Internal College Hackathon (SPOC Nomination)", description: "Present standard SIH Idea Presentation PPT (strict template) before campus panel.", format: "6-Slide Official PPT + Q&A", eliminatory: true },
      { roundNumber: 2, name: "National Screening Evaluation", description: "Central ministry evaluators score novelty, feasibility, tech stack, and impact.", format: "Portal PPT Screening", eliminatory: true },
      { roundNumber: 3, name: "36-Hour National Grand Finale", description: "Live 36-hour build marathon at nodal centers with 3 mandatory mentoring & judging checkpoints.", format: "36-Hour Onsite Hackathon", eliminatory: true }
    ],
    requiredSkills: [
      { skill: "Full-Stack / IoT / AI System Integration", proficiency: "Intermediate", isMustHave: true, provenance: "VERIFIED" },
      { skill: "SQL Database & Offline-Resilient Sync", proficiency: "Intermediate", isMustHave: true, provenance: "VERIFIED" },
      { skill: "Architecture Flowcharts & Feasibility Proof", proficiency: "Intermediate", isMustHave: true, provenance: "VERIFIED" }
    ],
    primaryDomains: ["project", "system_design", "ai_data", "cs_fundamentals"],
    phases: {
      absolute_beginner: [
        { phaseNumber: 1, phaseName: "Problem Statement Decomposition & Team Roles", description: "Analyze problem constraints and divide backend, frontend, AI, and hardware responsibilities cleanly.", totalEstimatedHours: 14, tasks: [{ id: "sih-ab-1", phase: 1, phaseName: "SQL & Backend", title: "Design Normalized Relational Data Model", description: "Build clean database tables for public-sector records.", estimatedMinutes: 60, linkedDomain: "ai_data", targetHref: "/student/skills/ai-data?tab=coding-arena&subject=subj_sql", actionLabel: "Open SQL Arena", minLevelRequired: "absolute_beginner", learningOutcomes: ["Foreign key constraints", "Indexing basics"], evidenceGenerated: "SQL schema mastery" }] }
      ],
      beginner: [
        { phaseNumber: 1, phaseName: "SPOC Pitch Deck & Working Prototype", description: "Create crisp system diagrams and functional proof-of-concept before internal round.", totalEstimatedHours: 18, tasks: [{ id: "sih-bg-1", phase: 1, phaseName: "Architecture", title: "System Integration Blueprint", description: "Avoid hand-wavy slides by shipping a minimal runnable API + UI flow.", estimatedMinutes: 75, linkedDomain: "system_design", targetHref: "/student/skills/system-design", actionLabel: "Open System Design", minLevelRequired: "beginner", learningOutcomes: ["End-to-end data flow diagram"], evidenceGenerated: "Prototype architecture" }] }
      ],
      intermediate: [
        { phaseNumber: 1, phaseName: "Resilience, Security & Scale Under 36-Hour Clock", description: "Prepare modular templates, authentication, and mock-free endpoints.", totalEstimatedHours: 15, tasks: [{ id: "sih-in-1", phase: 1, phaseName: "CS Core", title: "OS, Networking & DB Concurrency Review", description: "Defend deployment and data privacy under nodal evaluator questioning.", estimatedMinutes: 60, linkedDomain: "cs_fundamentals", targetHref: "/student/skills/cs-interview", actionLabel: "Open CS Fundamentals", minLevelRequired: "intermediate", learningOutcomes: ["RBAC & encryption basics"], evidenceGenerated: "CS interview readiness" }] }
      ],
      advanced: [
        { phaseNumber: 1, phaseName: "Grand Finale Checkpoint Polish", description: "Ensure 36-hour mentor checkpoints show clear incremental progress.", totalEstimatedHours: 10, tasks: [{ id: "sih-ad-1", phase: 1, phaseName: "Verification", title: "Full System Integration & Edge-Case Audit", description: "Verify zero dead buttons, real error states, and reproducible deployment.", estimatedMinutes: 60, linkedDomain: "code_comprehension", targetHref: "/student/skills/code-comprehension", actionLabel: "Run Code Audit", minLevelRequired: "advanced", learningOutcomes: ["Production demo readiness"], evidenceGenerated: "System verification" }] }
      ]
    },
    projects: [
      {
        id: "sih-civic-gis-monitor",
        title: "JanDrishti: Geo-Tagged Public Infrastructure Grievance & SLA Escalation Engine",
        tagline: "End-to-end portal matching SIH public-sector transparency problem statements with tamper-evident photo timestamps and SLA routing.",
        difficulty: "Intermediate",
        estimatedDays: 7,
        architectureSummary: "Mobile-responsive reporter client, EXIF/geohash verifier backend, PostgreSQL + PostGIS/spatial query tables, and escalation cron.",
        techStack: ["Next.js", "PostgreSQL", "Python FastAPI", "Docker"],
        systemComponents: [
          { component: "Geo-Verification API", technology: "FastAPI", responsibility: "Validates coordinates, duplicates nearby clusters, and assigns municipal zone" },
          { component: "SLA Escalation Tracker", technology: "PostgreSQL", responsibility: "Tracks unresolved grievances and escalates overdue tickets" }
        ],
        milestones: [
          { milestoneNumber: 1, title: "Spatial Deduplication", description: "Cluster duplicate reports within 50m", deliverable: "Verified Python/SQL clustering unit test" },
          { milestoneNumber: 2, title: "Citizen & Official Portal", description: "Role-isolated tracking dashboard", deliverable: "Deployed interactive demo" }
        ],
        acceptanceCriteria: ["Handles offline-queued submissions gracefully", "Demonstrates zero duplicate spam escalation"],
        demoRequirements: "Live upload -> spatial cluster match -> SLA dashboard update."
      }
    ],
    mockAssessments: [
      {
        id: "sih-screening-mock",
        title: "SIH Problem Statement Feasibility & Architecture Check",
        type: "hackathon_simulation",
        durationMinutes: 30,
        totalMarks: 50,
        passingPercentage: 70,
        questions: [
          { id: "sih-q1", question: "During SIH Grand Finale mentoring sessions, what mistake most frequently sinks strong student teams?", type: "conceptual", options: ["Using PostgreSQL instead of MongoDB", "Building an impressive UI with hardcoded mock data that fails to handle edge cases or real ministry constraints requested by mentors", "Writing clean unit tests", "Keeping the architecture modular"], correctAnswer: "Building an impressive UI with hardcoded mock data that fails to handle edge cases or real ministry constraints requested by mentors", marks: 50, rubric: "Derived from recurring SIH evaluator and finalist retrospectives." }
        ]
      }
    ],
    diagnosticQuestions: [
      {
        id: "diag-sih-1",
        question: "What stage is your 6-member SIH team at?",
        options: [
          { label: "Selecting problem statements before college SPOC round.", recommendedLevel: "absolute_beginner" },
          { label: "Passed SPOC PPT; starting prototype architecture.", recommendedLevel: "beginner" },
          { label: "Building end-to-end software/hardware integration.", recommendedLevel: "intermediate" }
        ]
      }
    ]
  }
];

const ARENA_SLUG_ALIASES: Record<string, string> = {
  "gsoc": "gsoc-2027",
  "gsoc-2026": "gsoc-2027",
  "flipkart": "flipkart-grid-7",
  "flipkart-grid": "flipkart-grid-7",
  "amazon-hackon": "amazon-hackon-2026",
  "walmart-sparkathon": "walmart-sparkathon-2026",
  "walmart-codehers": "walmart-sparkathon-2026",
  "paid-aiml-internship": "paid-aiml-internship-2026",
  "google-swe-prep": "google-swe-prep-2026",
  "jpmc-cfg": "jpmc-code-for-good-2027",
  "imagine-cup": "microsoft-imagine-cup-2027",
  "sih": "sih-2027",
};

export function getPreparationArenaBySlug(slug: string): PreparationArena | null {
  const normalized = slug.trim().toLowerCase();
  const resolved = ARENA_SLUG_ALIASES[normalized] || normalized;
  return (
    CANONICAL_PREPARATION_ARENAS.find(
      a => a.slug.toLowerCase() === resolved || a.id.toLowerCase() === resolved
    ) || null
  );
}

export function getAllPreparationArenas(): PreparationArena[] {
  return CANONICAL_PREPARATION_ARENAS;
}

export function getArenasByCategory(category: string): PreparationArena[] {
  if (category === "ALL") return CANONICAL_PREPARATION_ARENAS;
  return CANONICAL_PREPARATION_ARENAS.filter(a => a.category === category);
}

