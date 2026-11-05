import { CompanyPrepGuide } from "./question-bank-types";

export const COMPANY_PREP_GUIDES: Record<string, CompanyPrepGuide> = {
  Amazon: {
    company: "Amazon",
    logoText: "AMZN",
    overview: "Amazon evaluates candidates heavily on Leadership Principles (Customer Obsession, Ownership, Bias for Action, Dive Deep) combined with algorithmic problem-solving and scalable system architecture.",
    rolesAvailable: ["SDE-1", "SDE-2", "Backend Developer", "Machine Learning Engineer"],
    hiringRounds: [
      {
        round: "Online Assessment",
        description: "90-minute online coding test featuring 2 DSA questions (medium/hard) plus work simulation assessments.",
        keyFocusTopics: ["Arrays", "Trees", "Graphs", "Dynamic Programming", "Hash Maps"],
        typicalEliminationRate: "65%"
      },
      {
        round: "Technical Round 1",
        description: "1 hour live pair coding focusing on data structures, algorithmic complexity, and 15 mins of STAR Behavioral Leadership Principles.",
        keyFocusTopics: ["Trees & BFS/DFS", "Two Pointers", "Sliding Window", "Customer Obsession"],
        typicalEliminationRate: "45%"
      },
      {
        round: "Technical Round 2",
        description: "Deep dive into low-level design, object-oriented principles, and scalable system components.",
        keyFocusTopics: ["OOP / SOLID", "LRU Cache", "Thread Safety", "Deliver Results"],
        typicalEliminationRate: "40%"
      },
      {
        round: "System Design",
        description: "Distributed architecture round evaluating high availability, database partitioning, and rate limiting.",
        keyFocusTopics: ["Microservices", "DynamoDB / NoSQL", "Caching", "Message Queues"],
        typicalEliminationRate: "35%"
      },
      {
        round: "Behavioral",
        description: "The famous 'Bar Raiser' round evaluating culture fit, engineering disagreement handling, and long-term ownership.",
        keyFocusTopics: ["Have Backbone; Disagree and Commit", "Earn Trust", "Invent and Simplify"],
        typicalEliminationRate: "30%"
      }
    ],
    topicWeightage: [
      { topic: "DSA (Trees & Graphs)", percentage: 35 },
      { topic: "System Design & OOP", percentage: 25 },
      { topic: "Leadership Principles (STAR)", percentage: 25 },
      { topic: "Concurrency & OS", percentage: 15 }
    ],
    difficultyDistribution: { easy: 15, medium: 60, hard: 25 },
    sampleQuestionIds: ["qb-dsa-001", "qb-dsa-002", "qb-hr-001", "qb-sys-001"]
  },
  Google: {
    company: "Google",
    logoText: "GOOG",
    overview: "Google focuses on rigorous algorithmic optimality, clean maintainable code, mathematical proof of complexity, and Googleyness.",
    rolesAvailable: ["Software Engineer", "AI/ML Engineer", "Systems Engineer"],
    hiringRounds: [
      {
        round: "Online Assessment",
        description: "Google Online Challenge (GOC): 2 challenging algorithmic problems focusing on dynamic programming and graph traversals.",
        keyFocusTopics: ["Dynamic Programming", "Dijkstra / Shortest Path", "Bit Manipulation"],
        typicalEliminationRate: "75%"
      },
      {
        round: "Technical Round 1",
        description: "45-minute live coding in Google Docs or CoderPad: writing bug-free, clean code without IDE autocomplete.",
        keyFocusTopics: ["Recursion & Backtracking", "Binary Search on Answer", "Heaps"],
        typicalEliminationRate: "50%"
      },
      {
        round: "Technical Round 2",
        description: "Complex data structure composition, trie manipulation, and string search algorithms.",
        keyFocusTopics: ["Trie", "Segment Trees", "Topological Sort"],
        typicalEliminationRate: "40%"
      },
      {
        round: "Behavioral",
        description: "Googleyness and Leadership: evaluating intellectual humility, ambiguity navigation, and bias-free collaboration.",
        keyFocusTopics: ["Navigating Ambiguity", "Peer Mentorship", "Ethical AI"],
        typicalEliminationRate: "20%"
      }
    ],
    topicWeightage: [
      { topic: "Algorithms (DP & Graphs)", percentage: 45 },
      { topic: "Data Structures & Trees", percentage: 30 },
      { topic: "Math & Bitwise Logic", percentage: 15 },
      { topic: "Googleyness", percentage: 10 }
    ],
    difficultyDistribution: { easy: 10, medium: 50, hard: 40 },
    sampleQuestionIds: ["qb-dsa-001", "qb-aiml-001", "qb-os-001"]
  },
  Microsoft: {
    company: "Microsoft",
    logoText: "MSFT",
    overview: "Microsoft evaluates core computer science fundamentals (OS, DBMS, OOP) alongside practical data structure problem solving and growth mindset.",
    rolesAvailable: ["Software Engineer", "Cloud Engineer", "Full Stack Developer"],
    hiringRounds: [
      {
        round: "Online Assessment",
        description: "Codility OA with 3 problems covering arrays, strings, and hash maps.",
        keyFocusTopics: ["Arrays", "String Parsing", "Prefix Sums"],
        typicalEliminationRate: "60%"
      },
      {
        round: "Technical Round 1",
        description: "Data structures with emphasis on linked lists, binary search trees, and recursion.",
        keyFocusTopics: ["Linked Lists", "BST Validation", "Stack & Queues"],
        typicalEliminationRate: "40%"
      },
      {
        round: "Technical Round 2",
        description: "Core CS Fundamentals: threading, memory management, deadlock prevention, and SQL queries.",
        keyFocusTopics: ["Operating Systems", "DBMS Indexing", "OOP SOLID Principles"],
        typicalEliminationRate: "35%"
      },
      {
        round: "Managerial",
        description: "Director/Partner round: architectural trade-offs, project deep dives, and growth mindset.",
        keyFocusTopics: ["Growth Mindset", "Production Debugging", "Architecture"],
        typicalEliminationRate: "25%"
      }
    ],
    topicWeightage: [
      { topic: "DSA (Trees & Linked Lists)", percentage: 40 },
      { topic: "CS Fundamentals (OS, DBMS)", percentage: 30 },
      { topic: "OOP & Design Patterns", percentage: 20 },
      { topic: "Growth Mindset / HR", percentage: 10 }
    ],
    difficultyDistribution: { easy: 25, medium: 55, hard: 20 },
    sampleQuestionIds: ["qb-oop-001", "qb-os-001", "qb-cn-001"]
  },
  "Goldman Sachs": {
    company: "Goldman Sachs",
    logoText: "GS",
    overview: "Goldman Sachs tests mathematical aptitude, probabilistic reasoning, multi-threaded Java/C++, and transactional database consistency.",
    rolesAvailable: ["Software Engineer", "Quantitative Analyst", "Data Engineer"],
    hiringRounds: [
      {
        round: "Online Assessment",
        description: "HackerRank assessment with Advanced Math, Quantitative Aptitude, and 2 algorithmic questions.",
        keyFocusTopics: ["Probability", "Combinatorics", "Dynamic Programming", "Matrix Operations"],
        typicalEliminationRate: "70%"
      },
      {
        round: "Technical Round 1",
        description: "Data structures with high emphasis on hash collision handling, custom sorting, and multi-threading.",
        keyFocusTopics: ["Thread Concurrency", "Custom HashMaps", "Heap Sorting"],
        typicalEliminationRate: "50%"
      },
      {
        round: "Technical Round 2",
        description: "Fintech transactional consistency: ACID isolation, deadlocks, and low-latency message pipelines.",
        keyFocusTopics: ["DBMS Isolation", "Distributed Transactions", "Kafka / Event Streams"],
        typicalEliminationRate: "45%"
      }
    ],
    topicWeightage: [
      { topic: "Math & Probability", percentage: 30 },
      { topic: "DSA & Concurrency", percentage: 35 },
      { topic: "DBMS & ACID Transactions", percentage: 25 },
      { topic: "Behavioral & Integrity", percentage: 10 }
    ],
    difficultyDistribution: { easy: 15, medium: 50, hard: 35 },
    sampleQuestionIds: ["qb-dbms-001", "qb-dsa-002", "qb-apt-001"]
  },
  TCS: {
    company: "TCS",
    logoText: "TCS",
    overview: "TCS National Qualifier Test (NQT) evaluates quantitative aptitude, logical reasoning, verbal ability, and foundation programming logic across Ninja and Digital bands.",
    rolesAvailable: ["TCS Prime", "TCS Digital", "TCS Ninja"],
    hiringRounds: [
      {
        round: "Online Assessment",
        description: "TCS iON NQT: Foundation Section (Numerical, Reasoning, Verbal) + Advanced Section (Advanced Quant & 2 Coding Problems).",
        keyFocusTopics: ["Time & Work", "Permutations", "Arrays & Strings", "Number Theory"],
        typicalEliminationRate: "70%"
      },
      {
        round: "Technical Round 1",
        description: "Evaluation of academic projects, OOP definitions, basic SQL queries, and language syntax.",
        keyFocusTopics: ["OOP Four Pillars", "SQL SELECT / GROUP BY", "Data Structures"],
        typicalEliminationRate: "40%"
      },
      {
        round: "HR",
        description: "Willingness to relocate, bond policies, shift adaptability, and communication skills.",
        keyFocusTopics: ["Relocation", "Communication", "Work Ethic"],
        typicalEliminationRate: "20%"
      }
    ],
    topicWeightage: [
      { topic: "Quantitative & Aptitude", percentage: 40 },
      { topic: "Basic Coding & Logic", percentage: 30 },
      { topic: "OOP & Basic SQL", percentage: 20 },
      { topic: "Communication / HR", percentage: 10 }
    ],
    difficultyDistribution: { easy: 50, medium: 40, hard: 10 },
    sampleQuestionIds: ["qb-apt-001", "qb-oop-001", "qb-hr-001"]
  },
  Meta: {
    company: "Meta",
    logoText: "META",
    overview: "Meta evaluates rapid problem solving (2 medium problems in 45 mins), tree/graph traversals, heap queues, and system design.",
    rolesAvailable: ["Software Engineer (E4/E5)", "Production Engineer", "Data Scientist"],
    hiringRounds: [
      { round: "Technical Screen", description: "45-min live coding with 2 medium LeetCode-style questions on CoderPad.", keyFocusTopics: ["Binary Trees", "Graphs (BFS/DFS)", "Two Pointers"], typicalEliminationRate: "60%" },
      { round: "Technical Round 2", description: "Deep dive into dynamic programming, interval scheduling, and heap priority queues.", keyFocusTopics: ["DP", "Monotonic Stacks", "Intervals"], typicalEliminationRate: "45%" },
      { round: "System Design", description: "High-scale distributed systems round (Feed, Messenger, Video streaming).", keyFocusTopics: ["Distributed Caching", "Database Sharding", "Rate Limiting"], typicalEliminationRate: "40%" }
    ],
    topicWeightage: [
      { topic: "Trees & Graphs", percentage: 40 },
      { topic: "Arrays & Two Pointers", percentage: 30 },
      { topic: "System Design", percentage: 20 },
      { topic: "Behavioral", percentage: 10 }
    ],
    difficultyDistribution: { easy: 10, medium: 65, hard: 25 },
    sampleQuestionIds: ["qb-dsa-001", "qb-dsa-002"]
  },
  Apple: {
    company: "Apple",
    logoText: "AAPL",
    overview: "Apple emphasizes systems fundamentals, memory safety, hardware-software boundaries, and clean maintainable code.",
    rolesAvailable: ["Software Engineer", "iOS Systems Engineer", "Core OS Engineer"],
    hiringRounds: [
      { round: "Technical Screen", description: "1-hour phone screen covering recursion, pointers, and memory constraints.", keyFocusTopics: ["Pointers", "Linked Lists", "Recursion"], typicalEliminationRate: "50%" },
      { round: "Onsite Loop", description: "4-5 rounds covering algorithms, low-level architecture, and cross-functional design.", keyFocusTopics: ["Bit Manipulation", "Trees", "Concurrency"], typicalEliminationRate: "45%" }
    ],
    topicWeightage: [
      { topic: "Core Data Structures", percentage: 40 },
      { topic: "OS & Memory Management", percentage: 30 },
      { topic: "Low-Level Architecture", percentage: 20 },
      { topic: "Culture Fit", percentage: 10 }
    ],
    difficultyDistribution: { easy: 20, medium: 55, hard: 25 },
    sampleQuestionIds: ["qb-dsa-001"]
  },
  Netflix: {
    company: "Netflix",
    logoText: "NFLX",
    overview: "Netflix hires high-performing engineers with high autonomy; tests distributed architectures, caching, and stream resilience.",
    rolesAvailable: ["Senior Software Engineer", "ML Platform Engineer", "Data Engineer"],
    hiringRounds: [
      { round: "Technical Screen", description: "Practical algorithm design focusing on caching and streaming windows.", keyFocusTopics: ["LRU Cache", "Sliding Window", "Heaps"], typicalEliminationRate: "55%" },
      { round: "System Architecture", description: "Microservice fault tolerance, Chaos engineering, and message queues.", keyFocusTopics: ["Resilience Patterns", "Kafka", "Cassandra"], typicalEliminationRate: "45%" }
    ],
    topicWeightage: [
      { topic: "Distributed Systems & Architecture", percentage: 45 },
      { topic: "Data Structures & Caching", percentage: 35 },
      { topic: "Culture & Freedom/Responsibility", percentage: 20 }
    ],
    difficultyDistribution: { easy: 10, medium: 50, hard: 40 },
    sampleQuestionIds: ["qb-dsa-002"]
  },
  Uber: {
    company: "Uber",
    logoText: "UBER",
    overview: "Uber technical interviews heavily emphasize geospatial routing, shortest-path algorithms, and real-time dispatch systems.",
    rolesAvailable: ["Software Engineer 1", "Software Engineer 2", "Data Scientist"],
    hiringRounds: [
      { round: "Online Assessment", description: "CodeSignal General Coding Assessment (GCA) with 4 questions in 70 mins.", keyFocusTopics: ["Matrix Traversal", "Array Manipulations", "Greedy Choice"], typicalEliminationRate: "70%" },
      { round: "Technical Round 1", description: "Graph algorithms, Dijkstra, Floyd-Warshall, and Monotonic Queues.", keyFocusTopics: ["Dijkstra's Algorithm", "Sliding Window Max", "Intervals"], typicalEliminationRate: "45%" }
    ],
    topicWeightage: [
      { topic: "Graphs & Shortest Paths", percentage: 45 },
      { topic: "Heaps & Priority Queues", percentage: 25 },
      { topic: "System Design", percentage: 20 },
      { topic: "Behavioral", percentage: 10 }
    ],
    difficultyDistribution: { easy: 15, medium: 55, hard: 30 },
    sampleQuestionIds: ["qb-dsa-001"]
  },
  Stripe: {
    company: "Stripe",
    logoText: "STRIPE",
    overview: "Stripe values clean production code, idempotency, testing, and handling failure edge cases gracefully.",
    rolesAvailable: ["Software Engineer", "Backend Developer", "Infrastructure Engineer"],
    hiringRounds: [
      { round: "Technical Screen", description: "1-hour live coding in an IDE with real execution and unit test cases.", keyFocusTopics: ["Idempotency", "Rate Limiting", "Intervals"], typicalEliminationRate: "50%" },
      { round: "Integration Round", description: "Extending an existing API or parsing financial ledger event streams.", keyFocusTopics: ["Clean Refactoring", "Error Handling", "Testing"], typicalEliminationRate: "40%" }
    ],
    topicWeightage: [
      { topic: "Clean Code & Production Design", percentage: 40 },
      { topic: "Data Structures (Intervals, Hash Maps)", percentage: 35 },
      { topic: "System Architecture", percentage: 25 }
    ],
    difficultyDistribution: { easy: 10, medium: 60, hard: 30 },
    sampleQuestionIds: ["qb-dsa-001"]
  },
  Flipkart: {
    company: "Flipkart",
    logoText: "FLPK",
    overview: "Flipkart evaluates problem solving followed by a mandatory 90-minute Machine Coding (Low-Level Design) round.",
    rolesAvailable: ["SDE-1", "SDE-2"],
    hiringRounds: [
      { round: "Online Assessment", description: "90-minute HackerRank test with 3 DSA questions.", keyFocusTopics: ["Binary Search", "Dynamic Programming", "Graphs"], typicalEliminationRate: "70%" },
      { round: "Machine Coding (LLD)", description: "90 minutes to write fully working, clean, object-oriented code for an assigned system.", keyFocusTopics: ["Design Patterns", "Clean Code", "In-Memory DB"], typicalEliminationRate: "55%" }
    ],
    topicWeightage: [
      { topic: "Low-Level Design (Machine Coding)", percentage: 45 },
      { topic: "DSA & Problem Solving", percentage: 35 },
      { topic: "System Design (HLD)", percentage: 20 }
    ],
    difficultyDistribution: { easy: 15, medium: 55, hard: 30 },
    sampleQuestionIds: ["qb-dsa-001"]
  },
  Infosys: {
    company: "Infosys",
    logoText: "INFY",
    overview: "Infosys assesses problem solving across Specialist Programmer (SP) and Digital Specialist Engineer (DSE) roles.",
    rolesAvailable: ["Specialist Programmer", "Digital Specialist Engineer", "System Engineer"],
    hiringRounds: [
      { round: "Online Assessment (HackWithInfy)", description: "3 hours with 3 algorithmic problems.", keyFocusTopics: ["Dynamic Programming", "Greedy Algorithms", "Trees"], typicalEliminationRate: "75%" },
      { round: "Technical Interview", description: "DSA optimization, DBMS SQL, and academic project review.", keyFocusTopics: ["SQL Queries", "OOP", "Complexity"], typicalEliminationRate: "40%" }
    ],
    topicWeightage: [
      { topic: "Algorithms (DP & Greedy)", percentage: 50 },
      { topic: "DBMS & SQL", percentage: 25 },
      { topic: "OOP & Projects", percentage: 25 }
    ],
    difficultyDistribution: { easy: 20, medium: 50, hard: 30 },
    sampleQuestionIds: ["qb-dsa-001"]
  },
  Wipro: {
    company: "Wipro",
    logoText: "WIPRO",
    overview: "Wipro National Level Talent Hunt (NLTH) tests quantitative aptitude, logical reasoning, and core programming.",
    rolesAvailable: ["Wipro Turbo", "Wipro Elite"],
    hiringRounds: [
      { round: "Online Assessment", description: "Aptitude + 2 coding questions on basic data structures.", keyFocusTopics: ["Arrays", "Strings", "Sorting"], typicalEliminationRate: "65%" },
      { round: "Technical Interview", description: "Review of written code, language fundamentals, and basic SQL.", keyFocusTopics: ["String Parsing", "Loops", "Basic SQL"], typicalEliminationRate: "35%" }
    ],
    topicWeightage: [
      { topic: "Basic Coding & Logic", percentage: 40 },
      { topic: "Quantitative & Aptitude", percentage: 35 },
      { topic: "Technical Fundamentals", percentage: 25 }
    ],
    difficultyDistribution: { easy: 55, medium: 35, hard: 10 },
    sampleQuestionIds: ["qb-apt-001"]
  }
};
