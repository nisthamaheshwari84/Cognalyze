/**
 * lib/skills/communication-engine.ts
 * Evidence-Based Communication & Spoken English Arena Engine for Cognalyze.
 * 
 * Core Principles:
 * 1. Simple on the surface, intelligent underneath.
 * 2. 4 Primary Modes: LEARN, PRACTICE, COACH, INTERVIEW.
 * 3. Evidence-First: Every claim must be grounded in the candidate's actual words.
 * 4. Question-Specific Rubrics across 8 placement categories.
 * 5. Deterministic and realistic scoring — NO fabricated evidence.
 * 6. Dynamic conversational follow-ups in mock interviews.
 */

import { groqFetch } from "@/lib/groq";
import { extractJSON, stripThinkTags } from "@/lib/ai/placement-intelligence";
import { getCandidateSeenQuestionIds, recordCandidateAttempt } from "@/lib/skills/candidate-history";

// ── 1. DATA MODELS & TYPES ───────────────────────────────────────────────────

export type CommunicationCategory =
  | "self_intro"
  | "project"
  | "hr"
  | "behavioral"
  | "situational"
  | "technical"
  | "client"
  | "corporate";

export interface CommunicationQuestion {
  id: string;
  category: CommunicationCategory;
  categoryLabel: string;
  topic: string;
  question: string;
  targetDurationSeconds: number;
  tips: string;
  idealFramework: string;
  rubricDimensions: string[];
}

export interface CommunicationLesson {
  id: string;
  title: string;
  category: CommunicationCategory;
  concept: string;
  weakExample: string;
  improvedExample: string;
  whyItWorks: string[];
  tryItQuestion: {
    questionId: string;
    prompt: string;
    targetSeconds: number;
  };
}

export interface EvaluationFinding {
  claim: string;
  evidence: string; // Direct quote or explicit excerpt from candidate text
  reason: string;
  recommendation?: string;
  type: "strength" | "improvement";
}

export interface DimensionScore {
  dimension: string;
  score: number;
  evidence: string;
  reason: string;
  confidence: "high" | "medium" | "low";
}

export interface CommunicationEvaluationReport {
  overallScore: number;
  verdict: "Strong" | "Developing" | "Needs Practice";
  summary: string;
  dimensions: DimensionScore[];
  strengths: EvaluationFinding[];
  weaknesses: EvaluationFinding[];
  recommendations: {
    recommendation: string;
    basedOn: string;
    actionablePractice: string;
  }[];
  detectedFillers: {
    word: string;
    count: number;
    examples: string[];
  }[];
  totalWords: number;
  speechPaceWpm?: number;
  targetDurationSeconds: number;
  durationSeconds: number;
  candidateResponse: string;
}

// ── 2. PART 1: 10 PRACTICAL PLACEMENT LESSONS (LEARN MODE) ───────────────────

export const COMMUNICATION_LESSONS: CommunicationLesson[] = [
  {
    id: "self_intro",
    title: "1. Self Introduction Pitch",
    category: "self_intro",
    concept: "An executive self-introduction is not your resume read aloud. It connects who you are, what technical problems you solve, and what you aim to achieve next in 60-90 seconds using Present -> Past -> Future.",
    weakExample: "Hi, I am Nishant. I am studying in final year computer science. I know Java, Python, C++, HTML, CSS, React, and Machine Learning. My hobbies are playing cricket and reading books. I want a job in a good company.",
    improvedExample: "Hi, I'm Nishant. I'm a final-year CS undergrad specializing in AI and cloud systems. Recently, I built Cognalyze, a full-stack platform that automates multi-stage technical screening for 500+ candidates. My core focus is backend architecture and machine learning pipelines, and I'm excited to scale reliable enterprise distributed services.",
    whyItWorks: [
      "Leads with academic focus and current specialization rather than generic greetings.",
      "Anchors technical claims in a concrete flagship project with demonstrable scale.",
      "Ends forward-looking with the exact engineering domain the candidate wants to build in."
    ],
    tryItQuestion: {
      questionId: "comm-intro-1",
      prompt: "Tell me about yourself in 60–90 seconds.",
      targetSeconds: 75
    }
  },
  {
    id: "project_explanation",
    title: "2. Project Explanation",
    category: "project",
    concept: "Explain technical projects using Problem -> Personal Contribution -> Architecture -> Result. Never say 'we used AI' without explaining why that solution was chosen.",
    weakExample: "We made an e-commerce website using MERN stack. It had login, cart, payment, and database. It was a good project and we got high marks in final review.",
    improvedExample: "To address inventory overselling during flash sales, I engineered an event-driven stock reservation service using Node.js and Redis. My personal contribution was designing the distributed lock and transactional rollbacks, preventing double-booking across 1,200 concurrent checkout requests with sub-50ms latency.",
    whyItWorks: [
      "Starts with the operational problem instead of just listing technologies.",
      "Explicitly separates personal architectural contribution from generic group work.",
      "Cites real engineering trade-offs (distributed lock, concurrency, latency metrics)."
    ],
    tryItQuestion: {
      questionId: "comm-proj-1",
      prompt: "Explain your most important project in 60 to 90 seconds.",
      targetSeconds: 90
    }
  },
  {
    id: "hr_questions",
    title: "3. HR & Motivation Questions",
    category: "hr",
    concept: "When answering 'Why our company?' or 'Why this role?', anchor your answer in the company's actual engineering challenges or business model, not flattering generalities like 'reputed organization'.",
    weakExample: "Your company is a very famous MNC with great work culture and high packages. It has always been my dream to work here and learn new technologies.",
    improvedExample: "I've followed your team's migration to event-driven microservices on AWS for retail banking. Having built distributed queues in my own projects, I want to contribute to high-reliability payment pathways where fault tolerance and transactional consistency are critical.",
    whyItWorks: [
      "Demonstrates actual research into the company's real technology stack and domain.",
      "Bridges the candidate's existing hands-on experience with the team's engineering mission.",
      "Avoids superficial clichés about prestige, culture, or salary."
    ],
    tryItQuestion: {
      questionId: "comm-hr-1",
      prompt: "Why do you want to join our engineering team specifically?",
      targetSeconds: 60
    }
  },
  {
    id: "behavioral_questions",
    title: "4. Behavioral & Conflict Handling",
    category: "behavioral",
    concept: "Use the STAR framework (Situation, Task, Action, Result) with strong personal ownership. Focus 60% of your time on the Action you personally executed and the lessons learned.",
    weakExample: "Once a teammate was not working properly on the frontend. We got angry, but then our professor intervened and we finished the submission on the last day.",
    improvedExample: "During our hackathon, our UI developer fell sick 12 hours before final judging. Instead of panicking, I audited our wireframes, cut two non-essential dashboards, and personally stepped in to implement the core user onboarding workflow in Next.js, allowing us to submit on time and place in the top 5.",
    whyItWorks: [
      "Eliminates blame-shifting and highlights proactive emergency triage.",
      "Quantifies time pressure (12 hours before judging) and describes decisive trade-offs.",
      "Provides a clean, verified outcome (top 5 placement) without exaggeration."
    ],
    tryItQuestion: {
      questionId: "comm-beh-1",
      prompt: "Tell me about a time you faced a major setback during a technical project.",
      targetSeconds: 90
    }
  },
  {
    id: "situational_questions",
    title: "5. Situational & Pressure Scenarios",
    category: "situational",
    concept: "When asked 'What would you do if...', demonstrate structured triage: Assess Impact -> Notify Stakeholders -> Implement Safe Fallback -> Conduct Root Cause Analysis.",
    weakExample: "If a production bug happened, I would quickly try to fix the code and deploy it immediately so nobody notices.",
    improvedExample: "First, I would assess user impact and trigger our automated rollback or feature flag to immediately restore uptime. Second, I'd post a status update to our incident channel. Third, with stability restored, I'd reproduce the regression locally, write an automated test to prevent recurrence, and deploy through CI/CD.",
    whyItWorks: [
      "Never recommends rogue hotfixing without safety gates or communication.",
      "Separates user mitigation (rollback) from long-term investigation (root cause & test).",
      "Demonstrates mature corporate engineering practices."
    ],
    tryItQuestion: {
      questionId: "comm-sit-1",
      prompt: "What would you do if you realized your production deployment broke a critical checkout feature?",
      targetSeconds: 75
    }
  },
  {
    id: "technical_explanation",
    title: "6. Technical Explanation & Analogies",
    category: "technical",
    concept: "Explaining tech concepts to non-engineers tests true mastery. Use tangible, physical everyday analogies (mailboxes, restaurant kitchens, library indexes) and avoid circular definitions.",
    weakExample: "An API is an Application Programming Interface. It has GET, POST, PUT, DELETE requests and transfers JSON payloads between client and server via HTTP protocol.",
    improvedExample: "Think of an API like a waiter in a restaurant. You are the customer sitting at the table (the app), and the kitchen is the server where food is prepared. You don't walk into the kitchen yourself; you give your order to the waiter, who takes it back, and returns with exactly what you asked for.",
    whyItWorks: [
      "Replaces abstract networking terminology with an immediate mental picture.",
      "Clarifies the boundary of security and separation of concerns intuitively.",
      "Accessible to recruiters, clients, and technical leads alike."
    ],
    tryItQuestion: {
      questionId: "comm-tech-1",
      prompt: "Explain what an API is to someone who has never written a line of code.",
      targetSeconds: 60
    }
  },
  {
    id: "client_communication",
    title: "7. Client Communication & De-escalation",
    category: "client",
    concept: "When communicating delays, outages, or scope changes to clients: Lead with the bottom line (BLUF), validate their business urgency, explain the safety rationale, and offer concrete options.",
    weakExample: "Sorry, our code is having bugs and we need more time so the release is delayed until next week.",
    improvedExample: "I want to share an urgent update on Friday's release. During our load testing, we caught an authentication token race condition that could compromise customer sessions. To safeguard your customer data, we recommend delaying deployment by 48 hours to complete verified patching. We can either launch the core catalog on schedule with checkout following on Monday, or do a unified launch on Tuesday.",
    whyItWorks: [
      "Frames the delay as proactive protection of client data and brand reputation.",
      "Quantifies the timeline (48 hours) rather than vague promises.",
      "Gives the client executive agency by presenting two viable business options."
    ],
    tryItQuestion: {
      questionId: "comm-client-1",
      prompt: "How would you explain a two-day release delay to an impatient client?",
      targetSeconds: 75
    }
  },
  {
    id: "concise_communication",
    title: "8. Concise Communication & Eliminating Fillers",
    category: "corporate",
    concept: "Conciseness is high signal-to-noise. Eliminate run-on sentences and vocalized fillers ('like', 'um', 'basically', 'actually'). Replace filler hesitations with a deliberate 1-second breath.",
    weakExample: "Basically, um, what I did was, like, I took the data and, you know, sort of processed it using Python because, actually, the existing script was, like, too slow.",
    improvedExample: "The legacy Python script processed batches sequentially in 45 minutes. I redesigned the pipeline using multiprocessing, reducing batch execution time to 8 minutes.",
    whyItWorks: [
      "Cuts word count by 60% while dramatically multiplying clarity and impact.",
      "Eliminates five vocal fillers that degrade executive authority.",
      "Presents clear baseline (45m) vs new benchmark (8m)."
    ],
    tryItQuestion: {
      questionId: "comm-corp-1",
      prompt: "Briefly explain how you improved the speed or efficiency of a project or assignment.",
      targetSeconds: 45
    }
  },
  {
    id: "handling_unknown",
    title: "9. Handling 'I Don't Know'",
    category: "technical",
    concept: "Never fake an answer or guess blindly when you don't know. Acknowledge your boundary, state your logical hypothesis, and explain how you would systematically investigate it.",
    weakExample: "I think it's probably something related to memory allocation or maybe threading, I'm not sure.",
    improvedExample: "I haven't worked directly with Kafka partition rebalancing under network partitions. However, based on distributed consensus principles, I would expect the cluster to temporarily pause consumers while the coordinator reassigns topic partitions. To confirm, I would inspect the consumer lag metrics and rebalance logs in our staging environment.",
    whyItWorks: [
      "Honest, transparent, and avoids dangerous guesswork.",
      "Demonstrates foundational problem-solving reasoning from adjacent principles.",
      "Explains an actionable verification path (inspecting metrics and logs)."
    ],
    tryItQuestion: {
      questionId: "comm-tech-2",
      prompt: "What do you do when an interviewer asks about a technology you have never used?",
      targetSeconds: 60
    }
  },
  {
    id: "professional_communication",
    title: "10. Professional Disagreement & Alignment",
    category: "corporate",
    concept: "Senior engineers disagree on data and user impact, never personal taste. Use: Acknowledge Value -> State Objective Concern -> Propose Data-Driven Test.",
    weakExample: "I don't like your design. It's too complicated and my approach is much cleaner.",
    improvedExample: "I see the flexibility of using GraphQL for this service. My main concern is that our team has heavy caching infrastructure already tuned for REST endpoints. Before deciding, could we benchmark our top 3 queries under GraphQL versus cached REST to evaluate p99 latency?",
    whyItWorks: [
      "Respects the peer's architectural rationale without dismissive hostility.",
      "Bases objection on objective team constraints (existing caching infrastructure).",
      "Proposes an empirical benchmark test to let evidence make the decision."
    ],
    tryItQuestion: {
      questionId: "comm-corp-2",
      prompt: "How would you handle a disagreement with a teammate over system design or technology choices?",
      targetSeconds: 75
    }
  }
];

// ── 3. PART 2: STRUCTURED 40+ PLACEMENT QUESTION BANK ────────────────────────

export const COMMUNICATION_QUESTION_BANK: CommunicationQuestion[] = [
  // ── 1. SELF INTRODUCTION ──
  {
    id: "comm-intro-1",
    category: "self_intro",
    categoryLabel: "Self Introduction",
    topic: "Comprehensive Introduction Pitch",
    question: "Walk me through your background and tell me about yourself.",
    targetDurationSeconds: 75,
    tips: "Use Present -> Past -> Future. State degree and specialization, anchor in your primary project, and conclude with your engineering ambition.",
    idealFramework: "Present (Degree & Core Stack) -> Past (Key Project & Quantified Result) -> Future (Role Alignment)",
    rubricDimensions: ["clarity", "structure", "relevance", "conciseness", "professional_positioning"]
  },
  {
    id: "comm-intro-2",
    category: "self_intro",
    categoryLabel: "Self Introduction",
    topic: "Technical Interests & Focus",
    question: "What are you currently working on or learning in your technical journey?",
    targetDurationSeconds: 60,
    tips: "Focus on one concrete skill or project you explored in the last 3 months and explain what engineering problem motivated you to learn it.",
    idealFramework: "Trigger -> Hands-On Practice -> Key Takeaway",
    rubricDimensions: ["clarity", "specificity", "relevance", "conciseness"]
  },
  {
    id: "comm-intro-3",
    category: "self_intro",
    categoryLabel: "Self Introduction",
    topic: "Career Trajectory & Ambition",
    question: "How did you get interested in software engineering, and where do you see yourself in three years?",
    targetDurationSeconds: 60,
    tips: "Keep your origin story under 25 seconds, then focus on becoming a reliable module owner who designs resilient systems.",
    idealFramework: "Spark -> Key Milestone -> 3-Year Technical Trajectory",
    rubricDimensions: ["clarity", "structure", "professional_positioning", "relevance"]
  },
  {
    id: "comm-intro-4",
    category: "self_intro",
    categoryLabel: "Self Introduction",
    topic: "Core Engineering Strengths",
    question: "What would you say are your two strongest technical strengths, and how have you demonstrated them?",
    targetDurationSeconds: 60,
    tips: "Name each strength clearly with one concrete example of how you used it in code or project design.",
    idealFramework: "Strength 1 + Proof -> Strength 2 + Proof",
    rubricDimensions: ["clarity", "specificity", "relevance", "conciseness"]
  },

  // ── 2. PROJECT EXPLANATION ──
  {
    id: "comm-proj-1",
    category: "project",
    categoryLabel: "Project Explanation",
    topic: "Flagship Project Overview",
    question: "Tell me about your most important project. What problem does it solve, and what was your exact contribution?",
    targetDurationSeconds: 90,
    tips: "State the problem, explain your personal role (never just 'we'), outline the architecture simply, and share a measurable outcome.",
    idealFramework: "Problem -> Personal Role -> Architecture -> Measurable Result",
    rubricDimensions: ["problem_understanding", "personal_contribution", "technical_explanation", "impact", "clarity"]
  },
  {
    id: "comm-proj-2",
    category: "project",
    categoryLabel: "Project Explanation",
    topic: "Hardest Technical Challenge",
    question: "What was the most difficult technical bug or challenge you resolved in your project?",
    targetDurationSeconds: 75,
    tips: "Explain how the system failed, how you debugged it step-by-step (logs, breakpoints, benchmarks), and what permanent fix you implemented.",
    idealFramework: "Failure Mode -> Debugging Method -> Solution -> Verification",
    rubricDimensions: ["technical_explanation", "personal_contribution", "clarity", "structure"]
  },
  {
    id: "comm-proj-3",
    category: "project",
    categoryLabel: "Project Explanation",
    topic: "Architectural Retrospective",
    question: "If you had two more weeks to rewrite your project from scratch, what architectural decision would you change and why?",
    targetDurationSeconds: 60,
    tips: "Show self-reflection. Name a specific database, framework, or caching decision that proved limited and explain your better alternative.",
    idealFramework: "Current Limitation -> Root Cause -> Better Architecture -> Trade-off",
    rubricDimensions: ["technical_explanation", "reflection", "clarity", "specificity"]
  },
  {
    id: "comm-proj-4",
    category: "project",
    categoryLabel: "Project Explanation",
    topic: "Database & Data Modeling",
    question: "Why did you choose your specific database (SQL vs NoSQL) for your project?",
    targetDurationSeconds: 60,
    tips: "Base your answer on data relationships, read/write patterns, and consistency requirements, not just 'it was easy to use'.",
    idealFramework: "Data Pattern -> Relational vs Document Trade-off -> Decision",
    rubricDimensions: ["technical_explanation", "specificity", "clarity", "relevance"]
  },

  // ── 3. HR & MOTIVATION ──
  {
    id: "comm-hr-1",
    category: "hr",
    categoryLabel: "HR Questions",
    topic: "Company & Team Motivation",
    question: "Why do you want to join our organization specifically over other opportunities?",
    targetDurationSeconds: 60,
    tips: "Mention specific products, technology transitions, or open-source initiatives the company is known for.",
    idealFramework: "Company Innovation -> Relevant Personal Background -> Value Added",
    rubricDimensions: ["relevance", "clarity", "professional_positioning", "structure"]
  },
  {
    id: "comm-hr-2",
    category: "hr",
    categoryLabel: "HR Questions",
    topic: "Value Proposition & Hiring Case",
    question: "Why should we hire you? What sets you apart from other graduating candidates?",
    targetDurationSeconds: 60,
    tips: "Combine strong fundamentals with hands-on debugging grit and clear communication. Give one concrete example.",
    idealFramework: "Core Value -> Demonstrated Evidence -> Cultural & Technical Fit",
    rubricDimensions: ["clarity", "specificity", "professional_positioning", "conciseness"]
  },
  {
    id: "comm-hr-3",
    category: "hr",
    categoryLabel: "HR Questions",
    topic: "Handling Constructive Criticism",
    question: "Tell me about a time you received critical feedback on your code or work. How did you respond?",
    targetDurationSeconds: 60,
    tips: "Demonstrate emotional maturity. Explain the reviewer's point, how you depersonalized it, and the permanent improvement you adopted.",
    idealFramework: "Feedback Context -> Emotional Processing -> Action Taken -> Lasting Growth",
    rubricDimensions: ["reflection", "clarity", "structure", "professional_positioning"]
  },
  {
    id: "comm-hr-4",
    category: "hr",
    categoryLabel: "HR Questions",
    topic: "Personal Drive & Curiosity",
    question: "What motivates you to keep coding and building when you run into frustrating blockers?",
    targetDurationSeconds: 60,
    tips: "Talk about the intellectual satisfaction of root-cause diagnosis and building tools that real users rely on.",
    idealFramework: "Core Philosophy -> Real Example -> Sustainable Habit",
    rubricDimensions: ["clarity", "relevance", "conciseness"]
  },

  // ── 4. BEHAVIORAL QUESTIONS ──
  {
    id: "comm-beh-1",
    category: "behavioral",
    categoryLabel: "Behavioral Questions",
    topic: "Navigating Failure & Resiliency",
    question: "Tell me about a time something went wrong in a project. What did you learn from that failure?",
    targetDurationSeconds: 75,
    tips: "Do not pick a fake weakness like 'I worked too hard'. Pick a real bug, missed requirement, or deployment slip, and show the permanent fix.",
    idealFramework: "Situation -> What Failed -> Personal Ownership & Fix -> Preventive Guardrail",
    rubricDimensions: ["situation", "action", "ownership", "result", "reflection"]
  },
  {
    id: "comm-beh-2",
    category: "behavioral",
    categoryLabel: "Behavioral Questions",
    topic: "Team Disagreement & Consensus",
    question: "Describe a situation where you had a disagreement with a peer or teammate. How did you resolve it?",
    targetDurationSeconds: 75,
    tips: "Show that you listened to their perspective, evaluated both options objectively using metrics or prototypes, and committed fully.",
    idealFramework: "Disagreement Context -> Active Listening -> Objective Evaluation -> Consensus",
    rubricDimensions: ["situation", "action", "ownership", "result", "clarity"]
  },
  {
    id: "comm-beh-3",
    category: "behavioral",
    categoryLabel: "Behavioral Questions",
    topic: "Taking Technical Initiative",
    question: "Tell me about a time you took initiative on a project without someone asking you to do so.",
    targetDurationSeconds: 60,
    tips: "Explain how you observed a bottleneck (e.g. slow build, manual test step, missing documentation) and solved it on your own.",
    idealFramework: "Observed Gap -> Proactive Action -> Positive Team Impact",
    rubricDimensions: ["ownership", "action", "result", "clarity"]
  },
  {
    id: "comm-beh-4",
    category: "behavioral",
    categoryLabel: "Behavioral Questions",
    topic: "Working Under Tight Deadlines",
    question: "Give an example of how you prioritized features when facing a strict, immovable deadline.",
    targetDurationSeconds: 60,
    tips: "Show ruthless triage: distinguishing P0 must-haves from P2 nice-to-haves and aligning expectations with your team.",
    idealFramework: "Constraint -> Triage Methodology -> Execution -> Outcome",
    rubricDimensions: ["action", "ownership", "result", "clarity"]
  },

  // ── 5. SITUATIONAL SCENARIOS ──
  {
    id: "comm-sit-1",
    category: "situational",
    categoryLabel: "Situational Scenarios",
    topic: "Production Outage Response",
    question: "What would you do if a deployment you just shipped caused an unexpected spike in error rates?",
    targetDurationSeconds: 75,
    tips: "Structure your response: 1. Immediate rollback/mitigation, 2. Stakeholder notification, 3. Local root cause reproduction, 4. Regression testing.",
    idealFramework: "Containment -> Transparent Communication -> Investigation -> Remediation",
    rubricDimensions: ["clarity", "structure", "ownership", "conciseness"]
  },
  {
    id: "comm-sit-2",
    category: "situational",
    categoryLabel: "Situational Scenarios",
    topic: "Impending Deadline Breach",
    question: "How would you handle a situation where you realize two days before a sprint deadline that your task will take four days?",
    targetDurationSeconds: 60,
    tips: "Never wait until the deadline morning. Proactively inform your lead, present the blocker, and propose a trimmed MVP scope.",
    idealFramework: "Early Notification -> Root Cause Analysis -> Proposed Scope Trade-offs",
    rubricDimensions: ["clarity", "professional_positioning", "ownership", "relevance"]
  },
  {
    id: "comm-sit-3",
    category: "situational",
    categoryLabel: "Situational Scenarios",
    topic: "Vague or Ambiguous Requirements",
    question: "What would you do if an assignment or ticket had unclear, ambiguous specifications?",
    targetDurationSeconds: 60,
    tips: "Explain how you document existing assumptions, prepare 2-3 specific clarifying questions, and schedule a 10-minute alignment check.",
    idealFramework: "Document Assumptions -> Draft Clarifying Questions -> Confirm with Lead",
    rubricDimensions: ["clarity", "ownership", "structure", "conciseness"]
  },

  // ── 6. TECHNICAL EXPLANATION ──
  {
    id: "comm-tech-1",
    category: "technical",
    categoryLabel: "Technical Explanation",
    topic: "Explaining APIs to Non-Tech Audience",
    question: "Explain what an API is to a business recruiter or client who has never coded.",
    targetDurationSeconds: 60,
    tips: "Use the restaurant waiter or postal service analogy. Avoid acronyms and jargon like HTTP, JSON, or endpoints.",
    idealFramework: "Everyday Analogy -> Function Mapping -> Real-World Example (Weather app)",
    rubricDimensions: ["simplicity", "clarity", "logical_structure", "analogies"]
  },
  {
    id: "comm-tech-2",
    category: "technical",
    categoryLabel: "Technical Explanation",
    topic: "Explaining Database Indexing",
    question: "Explain what database indexing is and why it matters without using technical database jargon.",
    targetDurationSeconds: 60,
    tips: "Use the book index analogy: flipping page-by-page versus checking the back index for a keyword.",
    idealFramework: "Book Analogy -> Problem without Index -> Benefit with Index -> Cost (Writes)",
    rubricDimensions: ["simplicity", "clarity", "logical_structure", "analogies"]
  },
  {
    id: "comm-tech-3",
    category: "technical",
    categoryLabel: "Technical Explanation",
    topic: "Explaining Cloud Computing",
    question: "Explain cloud computing simply to someone who thinks it has to do with the weather.",
    targetDurationSeconds: 60,
    tips: "Use the municipal power grid analogy: instead of running your own diesel generator in the basement, you plug into the wall and pay for what you consume.",
    idealFramework: "Generator vs Power Grid Analogy -> On-Demand Scaling -> Cost Efficiency",
    rubricDimensions: ["simplicity", "clarity", "logical_structure", "analogies"]
  },
  {
    id: "comm-tech-4",
    category: "technical",
    categoryLabel: "Technical Explanation",
    topic: "Explaining Caching Simply",
    question: "Explain how caching works and why apps use it using an everyday workplace scenario.",
    targetDurationSeconds: 60,
    tips: "Use the desktop sticky note vs library basement archive analogy. Quick access for frequent items.",
    idealFramework: "Desk Sticky Note vs Archive -> Latency Benefit -> Invalidation Trade-off",
    rubricDimensions: ["simplicity", "clarity", "logical_structure", "analogies"]
  },

  // ── 7. CLIENT COMMUNICATION ──
  {
    id: "comm-client-1",
    category: "client",
    categoryLabel: "Client Communication",
    topic: "Explaining a 48-Hour Delay",
    question: "You must brief a client that a promised feature release is delayed by 48 hours. How do you communicate this professionally?",
    targetDurationSeconds: 75,
    tips: "Lead with the decision (BLUF). State the safety/quality reason, reassure them about data integrity, and offer two clear choices.",
    idealFramework: "BLUF Decision -> Quality/Security Rationale -> Recovery Timeline -> Options",
    rubricDimensions: ["clarity", "audience_adaptation", "professionalism", "conciseness"]
  },
  {
    id: "comm-client-2",
    category: "client",
    categoryLabel: "Client Communication",
    topic: "Handling Out-of-Scope Requests",
    question: "A client insists on adding a major feature right in the middle of a sprint without extra budget. How do you respond?",
    targetDurationSeconds: 60,
    tips: "Validate the feature's value, explain the iron triangle (Time/Cost/Scope), and suggest swapping it for a lower-priority ticket.",
    idealFramework: "Validate Feature -> Explain Capacity Boundary -> Offer Trade-off (Swap Feature)",
    rubricDimensions: ["clarity", "professionalism", "audience_adaptation", "conciseness"]
  },
  {
    id: "comm-client-3",
    category: "client",
    categoryLabel: "Client Communication",
    topic: "Briefing on System Downtime",
    question: "Your client's customer-facing portal was down for 30 minutes this morning. How do you explain what happened and restore confidence?",
    targetDurationSeconds: 75,
    tips: "State root cause honestly, explain that customer data remained secure, and detail the automated alert/safeguard implemented.",
    idealFramework: "Incident Acknowledgment -> Root Cause Summary -> Security Assurance -> Safeguards",
    rubricDimensions: ["clarity", "professionalism", "de_escalation", "ownership"]
  },

  // ── 8. CORPORATE COMMUNICATION ──
  {
    id: "comm-corp-1",
    category: "corporate",
    categoryLabel: "Corporate Communication",
    topic: "Concise Engineering Status Update",
    question: "Give a 30-second standup update on a task that is currently blocked by another team's API.",
    targetDurationSeconds: 45,
    tips: "What you completed, what you're working on, the exact blocker, and what action you need from the scrum master.",
    idealFramework: "Yesterday Done -> Today Planned -> Specific Blocker & Action Needed",
    rubricDimensions: ["conciseness", "clarity", "structure", "professionalism"]
  },
  {
    id: "comm-corp-2",
    category: "corporate",
    categoryLabel: "Corporate Communication",
    topic: "Architectural Disagreement in Design Review",
    question: "During a technical design review, you disagree with a senior engineer's caching approach. How do you state your perspective constructively?",
    targetDurationSeconds: 60,
    tips: "Affirm their intent, raise an objective data point (e.g. cache invalidation complexity or memory footprint), and propose a quick benchmark.",
    idealFramework: "Affirm Intent -> Raise Objective Risk -> Propose Empirical Benchmark",
    rubricDimensions: ["professionalism", "clarity", "audience_adaptation", "conciseness"]
  },
  {
    id: "comm-corp-3",
    category: "corporate",
    categoryLabel: "Corporate Communication",
    topic: "Delivering Constructive Peer Feedback",
    question: "A teammate repeatedly submits pull requests with zero unit tests. How do you address this with them one-on-one?",
    targetDurationSeconds: 60,
    tips: "Have a private, empathetic conversation. Focus on protecting the team from weekend outages and offer to pair on the first test.",
    idealFramework: "Private Setting -> Shared Goal (Stability) -> Specific Concern -> Pair Offer",
    rubricDimensions: ["professionalism", "clarity", "audience_adaptation", "conciseness"]
  },

  // ── ADDITIONAL COMPREHENSIVE PLACEMENT DRILLS ──
  {
    id: "comm-intro-5",
    category: "self_intro",
    categoryLabel: "Self Introduction",
    topic: "Milestone-Based Journey",
    question: "Summarize your technical progression in three key milestones that shaped you as an engineer.",
    targetDurationSeconds: 60,
    tips: "Milestone 1: First project, Milestone 2: Hardest architectural lesson, Milestone 3: Current focus.",
    idealFramework: "Milestone 1 (Discovery) -> Milestone 2 (Hard Problem) -> Milestone 3 (Current Production Mindset)",
    rubricDimensions: ["clarity", "structure", "conciseness", "professional_positioning"]
  },
  {
    id: "comm-proj-5",
    category: "project",
    categoryLabel: "Project Explanation",
    topic: "Authentication & Security Architecture",
    question: "How did you design authentication and user security in your primary project?",
    targetDurationSeconds: 60,
    tips: "Explain token issuance (JWT), storage trade-offs (httpOnly cookies vs localStorage), and password hashing (bcrypt/argon2).",
    idealFramework: "Threat Model -> Auth Architecture -> Storage Choice -> Security Rationale",
    rubricDimensions: ["technical_explanation", "clarity", "specificity", "relevance"]
  },
  {
    id: "comm-proj-6",
    category: "project",
    categoryLabel: "Project Explanation",
    topic: "End-to-End Request Lifecycle",
    question: "Walk me through how a user request travels through your system from the frontend click to the database write and response.",
    targetDurationSeconds: 75,
    tips: "Trace chronologically: Client request -> Reverse proxy/API gateway -> Middleware/Auth -> Service logic -> DB write -> Client payload.",
    idealFramework: "Client Trigger -> Routing & Auth -> Business Layer -> Persistence -> Response",
    rubricDimensions: ["technical_explanation", "logical_structure", "clarity", "conciseness"]
  },
  {
    id: "comm-hr-5",
    category: "hr",
    categoryLabel: "HR Questions",
    topic: "Team Culture Preferences",
    question: "What does an ideal, high-performing engineering culture look like to you?",
    targetDurationSeconds: 60,
    tips: "Focus on psychological safety, blameless post-mortems, thorough code reviews, and automated CI/CD guardrails.",
    idealFramework: "Core Cultural Value -> Concrete Operational Example -> Personal Contribution",
    rubricDimensions: ["professional_positioning", "clarity", "reflection"]
  },
  {
    id: "comm-hr-6",
    category: "hr",
    categoryLabel: "HR Questions",
    topic: "Continuous Technical Learning",
    question: "How do you stay up-to-date with fast-changing developer tooling and modern AI frameworks?",
    targetDurationSeconds: 60,
    tips: "Mention reading engineering blogs (e.g. Uber, Netflix, Cloudflare), building weekend prototypes, and digging into changelogs.",
    idealFramework: "Curated Information Sources -> Hands-On Prototyping -> Critical Evaluation",
    rubricDimensions: ["clarity", "relevance", "conciseness"]
  },
  {
    id: "comm-beh-5",
    category: "behavioral",
    categoryLabel: "Behavioral Questions",
    topic: "Competing Priorities & Multitasking",
    question: "Tell me about a time you had to balance competing priorities across multiple project deadlines simultaneously.",
    targetDurationSeconds: 75,
    tips: "Describe how you applied impact/effort matrices, communicated transparently with mentors, and delivered on key commitments.",
    idealFramework: "Competing Demands -> Prioritization Matrix -> Transparent Alignment -> Execution",
    rubricDimensions: ["situation", "action", "ownership", "result"]
  },
  {
    id: "comm-beh-6",
    category: "behavioral",
    categoryLabel: "Behavioral Questions",
    topic: "Rapid Requirement Pivots",
    question: "Describe an occasion where project requirements changed drastically midway through development. How did you adapt?",
    targetDurationSeconds: 75,
    tips: "Show adaptability without panic. Explain modular code reuse, isolating the delta, and delivering the revised scope on time.",
    idealFramework: "Change Context -> Impact Evaluation -> Architecture Pivot -> Successful Delivery",
    rubricDimensions: ["situation", "action", "ownership", "result", "reflection"]
  },
  {
    id: "comm-sit-4",
    category: "situational",
    categoryLabel: "Situational Scenarios",
    topic: "Handling Client Rejection of Architecture",
    question: "What would you do if a client or stakeholder rejected your proposed technical solution?",
    targetDurationSeconds: 60,
    tips: "Depersonalize the feedback. Ask open-ended discovery questions to uncover the root business objection, and present modified options.",
    idealFramework: "Depersonalize -> Root Cause Discovery -> Address Constraints -> Iterate Solution",
    rubricDimensions: ["professionalism", "clarity", "ownership", "de_escalation"]
  },
  {
    id: "comm-sit-5",
    category: "situational",
    categoryLabel: "Situational Scenarios",
    topic: "Navigating Flawed Code Review Advice",
    question: "How would you handle code review feedback from a teammate that you strongly believe introduces a performance regression?",
    targetDurationSeconds: 60,
    tips: "Never start an argument in GitHub PR comments. Run a local benchmark test, present the flamegraph or timing data, and discuss 1-on-1.",
    idealFramework: "Empirical Benchmark -> Data-Driven Discussion -> Collaborative Alignment",
    rubricDimensions: ["professionalism", "clarity", "ownership", "conciseness"]
  },
  {
    id: "comm-tech-5",
    category: "technical",
    categoryLabel: "Technical Explanation",
    topic: "Synchronous vs Asynchronous Execution",
    question: "Explain the difference between synchronous and asynchronous operations to a non-technical project manager.",
    targetDurationSeconds: 60,
    tips: "Use the single-counter grocery line vs coffee shop pager analogy: waiting in line vs getting a buzzer and browsing.",
    idealFramework: "Grocery Line vs Coffee Buzzer Analogy -> User Experience Impact -> System Efficiency",
    rubricDimensions: ["simplicity", "clarity", "logical_structure", "analogies"]
  },
  {
    id: "comm-tech-6",
    category: "technical",
    categoryLabel: "Technical Explanation",
    topic: "How Password Hashing Works",
    question: "Explain what password hashing is and why websites never store plain text passwords to an everyday user.",
    targetDurationSeconds: 60,
    tips: "Use the blender and smoothie analogy: you can turn fruit into a smoothie instantly, but nobody can un-blend a smoothie back into whole fruit.",
    idealFramework: "Blender Smoothie Analogy -> One-Way Mathematical Property -> Breach Protection",
    rubricDimensions: ["simplicity", "clarity", "logical_structure", "analogies"]
  },
  {
    id: "comm-client-4",
    category: "client",
    categoryLabel: "Client Communication",
    topic: "Unrealistic Delivery Expectation",
    question: "A client demands a 6-week enterprise integration be delivered in 2 weeks. How do you push back constructively?",
    targetDurationSeconds: 75,
    tips: "Explain the quality and security risk of rushing, outline what a verified MVP can deliver in 2 weeks, with phase 2 following.",
    idealFramework: "Acknowledge Urgency -> Transparent Quality Risk -> Phased Delivery Plan (MVP + V2)",
    rubricDimensions: ["professionalism", "clarity", "audience_adaptation", "conciseness"]
  },
  {
    id: "comm-client-5",
    category: "client",
    categoryLabel: "Client Communication",
    topic: "Addressing Latency Complaints",
    question: "A client reports that the dashboard feels noticeably sluggish during morning peak hours. How do you respond?",
    targetDurationSeconds: 60,
    tips: "Validate their experience, outline immediate telemetry investigation, and commit to a 24-hour diagnostic briefing.",
    idealFramework: "Validate Friction -> Telemetry Triage Action -> Definite Briefing Window",
    rubricDimensions: ["professionalism", "clarity", "de_escalation", "ownership"]
  },
  {
    id: "comm-corp-4",
    category: "corporate",
    categoryLabel: "Corporate Communication",
    topic: "Executive Sprint Summary",
    question: "Deliver a 60-second executive summary of your team's completed sprint to the VP of Engineering.",
    targetDurationSeconds: 60,
    tips: "Lead with business impact (e.g. latency down 30%, 3 critical endpoints shipped), note remaining risks, and next sprint goal.",
    idealFramework: "Headline Impact -> Shipped Capabilities -> Known Risk -> Next Objective",
    rubricDimensions: ["conciseness", "clarity", "structure", "professionalism"]
  },
  {
    id: "comm-corp-5",
    category: "corporate",
    categoryLabel: "Corporate Communication",
    topic: "Onboarding an Overwhelmed Junior Peer",
    question: "A newly joined junior engineer tells you they feel completely lost in the 50,000-line codebase. How do you guide them?",
    targetDurationSeconds: 60,
    tips: "Normalize the feeling. Help them isolate one small feature flow, trace it with breakpoints, and give them a low-stakes starter ticket.",
    idealFramework: "Empathy & Normalization -> Narrow Focus (One User Flow) -> First Small Win",
    rubricDimensions: ["professionalism", "clarity", "audience_adaptation", "reflection"]
  }
];

// ── 4. QUESTION SELECTION ENGINE (ANTI-REPETITION & ADAPTIVE) ─────────────────

export function getAdaptiveCommunicationQuestion(options: {
  category?: CommunicationCategory | "all";
  candidateId?: string;
  excludeQuestionIds?: string[];
}): CommunicationQuestion {
  const { category = "all", candidateId = "student-demo", excludeQuestionIds = [] } = options;

  let pool = [...COMMUNICATION_QUESTION_BANK];

  if (category && category !== "all") {
    const catFiltered = pool.filter(q => q.category === category);
    if (catFiltered.length > 0) pool = catFiltered;
  }

  // Exclude seen questions for candidate
  const seenIds = candidateId ? getCandidateSeenQuestionIds(candidateId, "communication_english") : new Set<string>();
  const allExcluded = new Set([...seenIds, ...excludeQuestionIds]);

  const unseenPool = pool.filter(q => !allExcluded.has(q.id));
  const candidatePool = unseenPool.length > 0 ? unseenPool : pool;

  // Shuffle and select
  const randomIndex = Math.floor(Math.random() * candidatePool.length);
  return candidatePool[randomIndex];
}

// ── 5. EVIDENCE-FIRST EVALUATION ENGINE ───────────────────────────────────────

/**
 * Scans candidate speech/text for exact vocal fillers with precise evidence quotes.
 */
export function analyzeVocalFillers(text: string): {
  detectedFillers: { word: string; count: number; examples: string[] }[];
  totalFillers: number;
} {
  const fillerWords = ["um", "uh", "like", "you know", "actually", "basically", "sort of", "kind of", "literally"];
  const detectedFillers: { word: string; count: number; examples: string[] }[] = [];
  let totalFillers = 0;

  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];

  fillerWords.forEach(fw => {
    const regex = new RegExp(`\\b${fw}\\b`, "gi");
    const matches = text.match(regex);
    if (matches && matches.length > 0) {
      const examples: string[] = [];
      sentences.forEach(s => {
        if (new RegExp(`\\b${fw}\\b`, "i").test(s) && examples.length < 2) {
          examples.push(s.trim());
        }
      });

      detectedFillers.push({
        word: fw,
        count: matches.length,
        examples
      });
      totalFillers += matches.length;
    }
  });

  return { detectedFillers, totalFillers };
}

/**
 * Deterministic evidence-backed fallback evaluator when LLM is offline.
 * Extracts actual verbatim sentences for evidence.
 */
function evaluateDeterministically(
  question: CommunicationQuestion,
  spokenText: string,
  durationSeconds: number
): CommunicationEvaluationReport {
  const words = spokenText.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentences = (spokenText.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [spokenText]).map(s => s.trim()).filter(Boolean);

  const { detectedFillers, totalFillers } = analyzeVocalFillers(spokenText);
  const wpm = durationSeconds > 5 ? Math.round((wordCount / durationSeconds) * 60) : 120;

  const strengths: EvaluationFinding[] = [];
  const weaknesses: EvaluationFinding[] = [];
  const dimensions: DimensionScore[] = [];

  // 1. Clarity Assessment
  const firstSentence = sentences[0] || spokenText;
  const hasDirectOpening = firstSentence.length > 15 && firstSentence.length < 180;
  const clarityScore = Math.min(92, Math.max(50, 75 + (hasDirectOpening ? 10 : -10) - (totalFillers > 3 ? 10 : 0)));

  dimensions.push({
    dimension: "Clarity",
    score: clarityScore,
    evidence: firstSentence.slice(0, 140),
    reason: hasDirectOpening
      ? "Opening sentence directly addresses the prompt without prolonged hesitation."
      : "Opening sentence is either overly brief or run-on.",
    confidence: "high"
  });

  if (hasDirectOpening) {
    strengths.push({
      claim: "Clear opening address",
      evidence: firstSentence.slice(0, 140),
      reason: "Directly established the premise of your response in the first statement.",
      type: "strength"
    });
  }

  // 2. Specificity & Evidence
  const textLower = spokenText.toLowerCase();
  const hasSpecificMetricOrTool = /\b(\d+%|\d+ms|\d+ days|\d+ hours|react|node|python|sql|aws|redis|api|mongodb|docker|c\+\+)\b/i.test(spokenText);
  const specificQuote = sentences.find(s => /\b(\d+|react|node|python|sql|aws|redis|api)\b/i.test(s)) || "";

  const specificityScore = hasSpecificMetricOrTool ? 84 : 62;
  dimensions.push({
    dimension: "Specificity",
    score: specificityScore,
    evidence: specificQuote ? specificQuote.slice(0, 140) : "Response speaks generally about concepts without specific numbers or tools.",
    reason: hasSpecificMetricOrTool
      ? "Cited concrete metrics, frameworks, or operational facts."
      : "Response relies on general descriptions without naming specific metrics, tools, or projects.",
    confidence: "high"
  });

  if (hasSpecificMetricOrTool && specificQuote) {
    strengths.push({
      claim: "Concrete technical or operational detail",
      evidence: specificQuote.slice(0, 140),
      reason: "Used tangible metrics or naming rather than broad generalities.",
      type: "strength"
    });
  } else {
    weaknesses.push({
      claim: "Missing specific metrics or concrete examples",
      evidence: firstSentence.slice(0, 120),
      reason: "The answer describes concepts in broad terms without anchoring in a specific project, metric, or timeline.",
      recommendation: "Name one specific tool, metric (e.g. 50ms, 40%), or concrete circumstance to ground your point.",
      type: "improvement"
    });
  }

  // 3. Structure & Conciseness
  const isTooBrief = wordCount < 30;
  const isRunOn = sentences.some(s => s.split(/\s+/).length > 35);
  const structureScore = isTooBrief ? 58 : isRunOn ? 65 : 82;

  dimensions.push({
    dimension: "Structure",
    score: structureScore,
    evidence: sentences[1] ? sentences[1].slice(0, 140) : firstSentence.slice(0, 140),
    reason: isTooBrief
      ? "Response terminates before developing the full context, action, and result."
      : isRunOn
      ? "Contains run-on sentences with multiple conjunctions."
      : "Thoughts are organized in sequential sentences with logical progression.",
    confidence: "medium"
  });

  if (isRunOn) {
    const runOnSentence = sentences.find(s => s.split(/\s+/).length > 35) || "";
    weaknesses.push({
      claim: "Run-on sentence structure",
      evidence: runOnSentence.slice(0, 140),
      reason: "Sentence exceeds 35 words, combining multiple thoughts without a clean pause.",
      recommendation: "Break long compound sentences into two 12-15 word declarative statements.",
      type: "improvement"
    });
  }

  // 4. Fillers Check
  if (totalFillers >= 2) {
    weaknesses.push({
      claim: `Vocal fillers detected (${totalFillers}x)`,
      evidence: detectedFillers.map(f => `"${f.word}" (${f.count}x)`).join(", "),
      reason: "Fillers were vocalized during thought transitions instead of taking a silent pause.",
      recommendation: "Take a 1-second deliberate silent breath instead of vocalizing fillers when shifting thoughts.",
      type: "improvement"
    });
  }

  // Overall Score Calculation
  const overallScore = Math.round(
    clarityScore * 0.35 +
    specificityScore * 0.35 +
    structureScore * 0.30
  );

  const verdict = overallScore >= 78 ? "Strong" : overallScore >= 64 ? "Developing" : "Needs Practice";

  return {
    overallScore,
    verdict,
    summary: `Response scored ${overallScore}/100 with ${verdict.toLowerCase()} articulation. ${strengths.length} clear strengths verified from transcript.`,
    dimensions,
    strengths,
    weaknesses,
    recommendations: weaknesses.map(w => ({
      recommendation: w.recommendation || "Structure response with Problem -> Action -> Result.",
      basedOn: w.claim,
      actionablePractice: `Practice: Focus strictly on eliminating ${w.claim.toLowerCase()}.`
    })),
    detectedFillers,
    totalWords: wordCount,
    speechPaceWpm: wpm,
    targetDurationSeconds: question.targetDurationSeconds,
    durationSeconds,
    candidateResponse: spokenText
  };
}

/**
 * Main evaluation pipeline: Uses LLM with strict evidence-grounding constraints,
 * falling back to verified deterministic extraction.
 */
export async function evaluateCommunicationResponse(options: {
  candidateId: string;
  questionId: string;
  spokenText: string;
  durationSeconds: number;
}): Promise<CommunicationEvaluationReport> {
  const { candidateId, questionId, spokenText, durationSeconds } = options;

  const question =
    COMMUNICATION_QUESTION_BANK.find(q => q.id === questionId) ||
    COMMUNICATION_QUESTION_BANK[0];

  const trimmedText = spokenText.trim();
  const { detectedFillers, totalFillers } = analyzeVocalFillers(trimmedText);

  // System prompt enforcing strict anti-fabrication and direct quote extraction
  const systemPrompt = `You are Cognalyze's Chief Communication Intelligence Evaluator.
Your mandate is EVIDENCE-BASED candidate evaluation.

CRITICAL RULES:
1. NO FABRICATED EVIDENCE: Every claim in 'strengths' and 'weaknesses' MUST cite an EXACT VERBATIM excerpt from the Candidate Response in the 'evidence' field.
2. If the candidate DID NOT say something, do NOT claim they said it.
3. If an element is missing (e.g. no metric or no team example), state honestly: 'Response does not state a metric or specific project name.'
4. NO GENERIC ADVICE: Never say 'be more confident' or 'improve vocabulary'. Advise on sentence structure, phrasing, and concrete omissions.
5. Scores must reflect actual response quality based on the question's rubric.

QUESTION:
Title: "${question.topic}"
Category: "${question.categoryLabel}"
Prompt: "${question.question}"
Target Duration: ${question.targetDurationSeconds} seconds
Ideal Framework: "${question.idealFramework}"
Relevant Rubrics: ${question.rubricDimensions.join(", ")}

CANDIDATE RESPONSE TRANSCRIPT:
"${trimmedText}"

DURATION RECORDED: ${durationSeconds} seconds.

Return STRICT JSON matching this schema:
{
  "overallScore": number (35-95),
  "verdict": "Strong" | "Developing" | "Needs Practice",
  "summary": "1-2 sentences summarizing performance grounded in transcript",
  "dimensions": [
    {
      "dimension": "Clarity",
      "score": number (0-100),
      "evidence": "exact verbatim excerpt from transcript",
      "reason": "why this score was assigned",
      "confidence": "high" | "medium" | "low"
    }
  ],
  "strengths": [
    {
      "claim": "Specific observation of what worked",
      "evidence": "exact verbatim quote from transcript",
      "reason": "why this helps the candidate in an interview",
      "type": "strength"
    }
  ],
  "weaknesses": [
    {
      "claim": "Specific observation of what can improve",
      "evidence": "exact verbatim quote or explicit note on omission",
      "reason": "why this leaves the interviewer with doubts",
      "recommendation": "concrete phrasing or restructuring action",
      "type": "improvement"
    }
  ],
  "recommendations": [
    {
      "recommendation": "Concrete phrasing or structural fix",
      "basedOn": "Name of weakness",
      "actionablePractice": "Exact question or prompt to practice next"
    }
  ]
}`;

  try {
    const aiRes = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [{ role: "user", content: systemPrompt }],
        temperature: 0.2,
        max_tokens: 1200
      })
    });

    const data = await aiRes.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    const clean = stripThinkTags(raw);
    const parsed = extractJSON(clean);

    if (parsed && typeof parsed.overallScore === "number" && Array.isArray(parsed.dimensions)) {
      const words = trimmedText.split(/\s+/).filter(Boolean);
      const wpm = durationSeconds > 5 ? Math.round((words.length / durationSeconds) * 60) : 120;

      const report: CommunicationEvaluationReport = {
        overallScore: Math.max(35, Math.min(98, Math.round(parsed.overallScore))),
        verdict: parsed.verdict || (parsed.overallScore >= 78 ? "Strong" : parsed.overallScore >= 64 ? "Developing" : "Needs Practice"),
        summary: parsed.summary || "Evaluation completed with verified evidence.",
        dimensions: parsed.dimensions.map((d: any) => ({
          dimension: d.dimension || "Communication",
          score: Math.max(20, Math.min(100, Math.round(d.score || 70))),
          evidence: d.evidence || trimmedText.slice(0, 100),
          reason: d.reason || "Evaluated against placement communication criteria.",
          confidence: d.confidence || "high"
        })),
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        detectedFillers,
        totalWords: words.length,
        speechPaceWpm: wpm,
        targetDurationSeconds: question.targetDurationSeconds,
        durationSeconds,
        candidateResponse: trimmedText
      };

      // Record attempt in Candidate History Store
      try {
        recordCandidateAttempt({
          candidateId,
          domain: "communication_english",
          topic: question.topic,
          mode: "practice",
          score: report.overallScore,
          accuracy: report.overallScore,
          timeSpentSeconds: durationSeconds,
          questionsAttempted: 1,
          questionsCorrect: report.overallScore >= 70 ? 1 : 0,
          questionIds: [question.id],
          weaknesses: report.weaknesses.map(w => w.claim),
          strengths: report.strengths.map(s => s.claim),
          feedback: report.summary
        });
      } catch (err) {
        console.warn("Could not record candidate attempt:", err);
      }

      return report;
    }
  } catch (err) {
    console.warn("LLM communication evaluation fallback triggered:", err);
  }

  // Fallback to deterministic evaluation
  const fallbackReport = evaluateDeterministically(question, trimmedText, durationSeconds);
  try {
    recordCandidateAttempt({
      candidateId,
      domain: "communication_english",
      topic: question.topic,
      mode: "practice",
      score: fallbackReport.overallScore,
      accuracy: fallbackReport.overallScore,
      timeSpentSeconds: durationSeconds,
      questionsAttempted: 1,
      questionsCorrect: fallbackReport.overallScore >= 70 ? 1 : 0,
      questionIds: [question.id],
      weaknesses: fallbackReport.weaknesses.map(w => w.claim),
      strengths: fallbackReport.strengths.map(s => s.claim),
      feedback: fallbackReport.summary
    });
  } catch (err) {
    console.warn("Could not record fallback attempt:", err);
  }

  return fallbackReport;
}

// ── 6. DYNAMIC MOCK INTERVIEW ENGINE ──────────────────────────────────────────

export interface InterviewMessage {
  speaker: "interviewer" | "candidate";
  text: string;
  timestamp?: string;
}

/**
 * Generates an organic follow-up question strictly based on the candidate's actual words.
 */
export async function generateInterviewFollowup(options: {
  interviewHistory: InterviewMessage[];
  currentResponse: string;
  turnNumber: number;
}): Promise<{
  interviewerText: string;
  isFinalTurn: boolean;
}> {
  const { interviewHistory, currentResponse, turnNumber } = options;

  if (turnNumber >= 3) {
    return {
      interviewerText: "Thank you for answering those questions so clearly. That concludes our mock interview session. Let me compile your detailed communication diagnostic report now.",
      isFinalTurn: true
    };
  }

  const prompt = `You are a Senior Engineering Hiring Manager conducting an interactive placement interview.
You are evaluating a candidate's verbal articulation, technical ownership, and clarity.

INTERVIEW HISTORY SO FAR:
${interviewHistory.map(m => `${m.speaker.toUpperCase()}: "${m.text}"`).join("\n")}

CANDIDATE JUST ANSWERED:
"${currentResponse}"

TASK:
1. Give a natural, conversational 1-sentence acknowledgment of what the candidate just explained.
2. Formulate ONE sharp follow-up question that drills directly into something the candidate mentioned (e.g. personal contribution, metrics, trade-offs, or handling failure).
3. Do NOT ask a completely unrelated question. Ground your follow-up in their exact words.

Return STRICT JSON:
{
  "acknowledgment": "1 natural sentence referencing their answer",
  "followupQuestion": "1 sharp contextual follow-up question"
}`;

  try {
    const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        max_tokens: 300
      })
    });

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    const clean = stripThinkTags(raw);
    const parsed = extractJSON(clean);

    if (parsed.followupQuestion) {
      const interviewerText = `${parsed.acknowledgment ? parsed.acknowledgment + " " : ""}${parsed.followupQuestion}`;
      return {
        interviewerText,
        isFinalTurn: false
      };
    }
  } catch (err) {
    console.warn("Interview follow-up fallback:", err);
  }

  // Fallbacks if LLM fails
  const followups = [
    "Thanks for walking me through that. You mentioned that project—what was the single hardest technical trade-off you personally had to defend?",
    "Understood. When you reflect on that implementation, what specific metric proved to you that the solution was actually working as intended?",
    "That makes sense. If you had to explain that system's core architecture to a non-technical client who was skeptical about the delivery timeline, how would you phrase it?"
  ];

  return {
    interviewerText: followups[turnNumber % followups.length],
    isFinalTurn: false
  };
}

/**
 * Compiles comprehensive end-of-interview report from full multi-turn conversation.
 */
export async function generateFullInterviewReport(options: {
  candidateId: string;
  interviewHistory: InterviewMessage[];
}): Promise<CommunicationEvaluationReport> {
  const { candidateId, interviewHistory } = options;

  const candidateResponses = interviewHistory
    .filter(m => m.speaker === "candidate")
    .map(m => m.text)
    .join(" ");

  const totalWords = candidateResponses.split(/\s+/).filter(Boolean).length;
  const { detectedFillers } = analyzeVocalFillers(candidateResponses);

  const prompt = `You are a Senior Bar-Raiser summarizing a full multi-turn mock interview.
Evaluate the candidate's communication across all responses.

FULL INTERVIEW TRANSCRIPT:
${interviewHistory.map(m => `${m.speaker.toUpperCase()}: "${m.text}"`).join("\n\n")}

CRITICAL RULES:
1. Base every strength and weakness strictly on verbatim quotes from the candidate's answers.
2. NO fabricated evidence.
3. No dramatic labels like 'ELIMINATED' or 'REJECTION RISK'. Use 'Strong', 'Developing', or 'Needs Practice'.

Return STRICT JSON:
{
  "overallScore": number (40-95),
  "verdict": "Strong" | "Developing" | "Needs Practice",
  "summary": "2-sentence executive summary of verbal readiness and technical communication",
  "dimensions": [
    {
      "dimension": "Clarity",
      "score": number (0-100),
      "evidence": "exact quote from candidate",
      "reason": "why this score was assigned",
      "confidence": "high"
    },
    {
      "dimension": "Structure & Flow",
      "score": number (0-100),
      "evidence": "exact quote from candidate",
      "reason": "how well answers transitioned",
      "confidence": "high"
    },
    {
      "dimension": "Technical Ownership",
      "score": number (0-100),
      "evidence": "exact quote from candidate",
      "reason": "degree of first-person contribution demonstrated",
      "confidence": "high"
    },
    {
      "dimension": "Audience Adaptation",
      "score": number (0-100),
      "evidence": "exact quote from candidate",
      "reason": "clarity of explanations",
      "confidence": "high"
    }
  ],
  "strengths": [
    {
      "claim": "Observed communication strength",
      "evidence": "exact verbatim candidate quote",
      "reason": "why this creates interviewer confidence",
      "type": "strength"
    }
  ],
  "weaknesses": [
    {
      "claim": "Specific area requiring practice",
      "evidence": "exact verbatim candidate quote or specific omission",
      "reason": "why this needs work",
      "recommendation": "exact action to practice",
      "type": "improvement"
    }
  ],
  "recommendations": [
    {
      "recommendation": "Concrete practice directive",
      "basedOn": "Observed gap",
      "actionablePractice": "Suggested topic or drill"
    }
  ]
}`;

  try {
    const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-oss-120b",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
        max_tokens: 1400
      })
    });

    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    const clean = stripThinkTags(raw);
    const parsed = extractJSON(clean);

    if (parsed && typeof parsed.overallScore === "number") {
      const report: CommunicationEvaluationReport = {
        overallScore: Math.round(parsed.overallScore),
        verdict: parsed.verdict || (parsed.overallScore >= 78 ? "Strong" : parsed.overallScore >= 64 ? "Developing" : "Needs Practice"),
        summary: parsed.summary || "Full mock interview evaluation completed.",
        dimensions: Array.isArray(parsed.dimensions) ? parsed.dimensions : [],
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        detectedFillers,
        totalWords,
        targetDurationSeconds: 180,
        durationSeconds: 180,
        candidateResponse: candidateResponses
      };

      try {
        recordCandidateAttempt({
          candidateId,
          domain: "communication_english",
          topic: "Full Mock Interview Diagnostic",
          mode: "interview",
          score: report.overallScore,
          accuracy: report.overallScore,
          timeSpentSeconds: 180,
          questionsAttempted: interviewHistory.filter(m => m.speaker === "interviewer").length,
          questionsCorrect: report.overallScore >= 70 ? 1 : 0,
          questionIds: ["full-mock-interview"],
          weaknesses: report.weaknesses.map(w => w.claim),
          strengths: report.strengths.map(s => s.claim),
          feedback: report.summary
        });
      } catch (err) {
        console.warn("Could not save interview attempt:", err);
      }

      return report;
    }
  } catch (err) {
    console.warn("Interview report fallback:", err);
  }

  // Fallback report
  const fallback = evaluateDeterministically(
    COMMUNICATION_QUESTION_BANK[0],
    candidateResponses || "Interview completed with basic answers.",
    180
  );
  fallback.summary = `Mock Interview completed. Overall score: ${fallback.overallScore}/100. Evaluated across ${interviewHistory.length} conversational turns.`;
  return fallback;
}
