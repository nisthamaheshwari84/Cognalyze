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
  }
};
