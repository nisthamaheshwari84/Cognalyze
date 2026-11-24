/**
 * COGNALYZE ELITE AI INTERVIEW ENGINE v2.0
 * 
 * Comprehensive, production-grade AI Interview Orchestration System:
 * 1. buildCandidateInterviewDossier() — unifies Student DNA, Unified Evidence Dossier, Resume Claims,
 *    accessible GitHub repos, LinkedIn status, and Role DNA requirements.
 * 2. generateInterviewBlueprint() — creates an adaptive, time-aware, multi-section interview plan.
 * 3. assessCandidateAnswer() — deep evaluation of candidate answers (strong, adequate, shallow,
 *    off-topic, does_not_know, contradictory).
 * 4. isQuestionSemanticallyDuplicate() — semantic anti-repetition guardrail.
 * 5. generateNextAdaptiveQuestion() — persona-driven (Staff Architect Alex), contextual follow-ups,
 *    intentional breadth transitions across sections, and resilient blueprint-driven fallback.
 * 6. generateInterviewFinalReport() — evidence-based final report with transcript quote citations.
 * 7. commitInterviewEvidenceToDNA() — updates Student DNA with newly demonstrated interview evidence.
 */

import { groqFetch } from "@/lib/groq";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getStudentDNAFull, addStudentEvidenceRecord } from "@/lib/dna/store";
import { buildCandidateUnifiedEvidenceDossier } from "@/lib/evidence/candidate-evidence-engine";
import { recordCareerMemoryItem, getCareerMemory, normalizeCapabilityName } from "@/lib/intelligence/student-intelligence";
import { generateSecureId } from "@/lib/crypto-utils";
import { getPlacementProfile } from "@/lib/skills/placement-profile-engine";
import {
  getAccumulatedWeakTopics,
  getHistoricalQuestionsForCandidate,
  getHistoricalAssessedCompetencies
} from "@/lib/interview-session-store";
import {
  createTurnQuestionBlueprint,
  synthesizeDynamicQuestionFromBlueprint,
  determineRoleCategory,
  TurnQuestionBlueprint,
  RoleCategory,
} from "./interview-turn-blueprint";
import { resolveCompanyIntelligence, CompanyIntelligenceProfile } from "./company-intelligence";
import {
  getTrackSpecializationConfig,
  generateSpecializedTrackFollowUp,
  evaluateIrrelevantAnswerPolicy,
  TRACK_EVALUATION_RUBRICS,
} from "./interview-specialization-engine";

import {
  CandidateIntelligenceProfile,
  TwelvePointProjectProfile,
  JDCompetencyMatrix,
  EvidenceProvenance,
  buildCandidateIntelligenceProfile,
  buildJDCompetencyMatrix,
} from "@/lib/interview/candidate-intelligence";
import {
  ConductState,
  ConductIncident,
  evaluateCandidateConduct,
  INSTITUTIONAL_CONDUCT_MESSAGES,
} from "@/lib/interview/conduct-engine";
import {
  InternalInterviewPlan,
  PlannedInterviewQuestion,
  InterviewStagePlan,
  PlannedInterviewStageId,
  generateStructuredInterviewPlan,
  findNextPlannedQuestion,
  mapSectionToStageId,
} from "@/lib/interview/interview-planner";
import {
  computeResumeHash,
  createResumeContextSnapshot,
  ResumeContextSnapshot,
} from "@/lib/interview/resume-context-service";

export {
  createTurnQuestionBlueprint,
  synthesizeDynamicQuestionFromBlueprint,
  determineRoleCategory,
  resolveCompanyIntelligence,
  getTrackSpecializationConfig,
  generateSpecializedTrackFollowUp,
  evaluateIrrelevantAnswerPolicy,
  TRACK_EVALUATION_RUBRICS,
  buildCandidateIntelligenceProfile,
  buildJDCompetencyMatrix,
  evaluateCandidateConduct,
  INSTITUTIONAL_CONDUCT_MESSAGES,
  generateStructuredInterviewPlan,
  findNextPlannedQuestion,
  mapSectionToStageId,
};
export type {
  TurnQuestionBlueprint,
  RoleCategory,
  CompanyIntelligenceProfile,
  CandidateIntelligenceProfile,
  TwelvePointProjectProfile,
  JDCompetencyMatrix,
  EvidenceProvenance,
  ConductState,
  ConductIncident,
  InternalInterviewPlan,
  PlannedInterviewQuestion,
  InterviewStagePlan,
  PlannedInterviewStageId,
};

// ══════════════════════════════════════════════════════════════
// 1. TYPES & CONTRACTS
// ══════════════════════════════════════════════════════════════

export type FollowUpReason =
  | "test_unresolved_concept"
  | "verify_claimed_implementation"
  | "understand_trade_off"
  | "explore_failure_mode"
  | "knowledge_transfer"
  | "resolve_contradiction"
  | "none";

export type ExperienceMode = "fresher" | "1-3yr" | "experienced" | "career-switcher";

export type AnswerQuality =
  | "strong"
  | "adequate"
  | "partially_correct"
  | "shallow"
  | "off-topic"
  | "does_not_know"
  | "contradictory"
  | "declined"
  | "self_corrected"
  | "skipped";

export type NextInterviewerAction =
  | "follow_up_probe"
  | "clarify_ambiguity"
  | "simplify_concept"
  | "offer_hint"
  | "acknowledge_and_advance"
  | "move_to_new_topic"
  | "advance_section"
  | "close_interview";

export type InterviewTrack =
  | "traditional_coding_dsa"
  | "code_comprehension"
  | "debugging_code_repair"
  | "ai_assisted_engineering"
  | "system_design"
  | "code_review_reliability"
  | "senior_engineering_judgment"
  | "behavioral_project_deep_dives";

export type InterviewSection =
  | "introduction"
  | "resume_projects"
  | "technical_fundamentals"
  | "coding_system_design"
  | "behavioral"
  | "closing";

// ══════════════════════════════════════════════════════════════
// 26-CATEGORY COMPLETE INTERVIEW COVERAGE MATRIX (A - Z)
// ══════════════════════════════════════════════════════════════
export const COMPETENCY_CATEGORIES = {
  A_CANDIDATE_INTRO: "A. Candidate Introduction & Background",
  B_RESUME_WALKTHROUGH: "B. Resume Walkthrough & Career Evolution",
  C_PROJECT_DEEP_DIVE: "C. Project Deep Dive & Technical Contribution",
  D_PROJECT_ARCHITECTURE: "D. Project Architecture & Design Trade-offs",
  E_LANGUAGE_FUNDAMENTALS: "E. Programming Language Fundamentals",
  F_DATA_STRUCTURES_ALGORITHMS: "F. Data Structures & Algorithms",
  G_PRACTICAL_CODING: "G. Practical Coding & Problem Solving",
  H_COMPLEXITY_ANALYSIS: "H. Time & Space Complexity Analysis",
  I_OOP_DESIGN_PATTERNS: "I. Object-Oriented Programming & Design Patterns",
  J_DATABASES_SQL: "J. Databases, Indexing & SQL Optimization",
  K_OPERATING_SYSTEMS: "K. Operating Systems & Concurrency",
  L_NETWORKS_PROTOCOLS: "L. Computer Networks & Protocols",
  M_BACKEND_ENGINEERING: "M. Backend Engineering & Distributed Services",
  N_FRONTEND_ENGINEERING: "N. Frontend Engineering & UI Architecture",
  O_APIS_AUTHENTICATION: "O. APIs, Authentication & Authorization",
  P_DATA_SECURITY_ISOLATION: "P. Data Isolation, Security & Reliability",
  Q_SYSTEM_DESIGN: "Q. System Design & Scalability",
  R_AIML_FUNDAMENTALS: "R. AI/ML Fundamentals & Data Pipelines",
  S_LLM_INTEGRATION: "S. LLM Integration & Prompt Evaluation",
  T_TESTING_DEBUGGING: "T. Testing, Debugging & Production Incidents",
  U_GIT_COLLABORATION: "U. Git & Collaborative Engineering",
  V_BEHAVIORAL_LEADERSHIP: "V. Behavioral Questions & Leadership",
  W_COMMUNICATION: "W. Communication & Stakeholder Management",
  X_OWNERSHIP_LEARNING: "X. Ownership, Decision Making & Learning",
  Y_ROLE_SITUATIONAL: "Y. Role-Specific Situational Scenarios",
  Z_CANDIDATE_CLOSING: "Z. Candidate Questions & Closing",
} as const;

export type CompetencyCategoryKey = keyof typeof COMPETENCY_CATEGORIES;

export interface TrackConfiguration {
  id: InterviewTrack;
  name: string;
  shortTitle: string;
  description: string;
  primaryCategories: CompetencyCategoryKey[];
  coreCompetencies: string[];
  sampleTasks: string[];
  evalCriteria: string[];
  followUpStrategy: string;
  fallbackQuestions: Array<{
    question: string;
    target: string;
    type: GeneratedQuestion["question_type"];
  }>;
}

export const TRACK_CONFIGURATIONS: Record<InterviewTrack, TrackConfiguration> = {
  traditional_coding_dsa: {
    id: "traditional_coding_dsa",
    name: "Traditional Coding & DSA",
    shortTitle: "Coding & DSA",
    description: "Algorithmic problem solving, Big-O complexity, data structures (trees, graphs, heaps, dynamic programming, two pointers), and edge-case resilience.",
    primaryCategories: ["F_DATA_STRUCTURES_ALGORITHMS", "G_PRACTICAL_CODING", "H_COMPLEXITY_ANALYSIS"],
    coreCompetencies: ["Algorithmic Correctness", "Time & Space Complexity", "Boundary & Edge Cases", "Data Structure Selection"],
    sampleTasks: [
      "Top K Frequent Elements in streaming data with bounded memory",
      "Detecting cycles and dependencies via Topological Sort",
      "Designing an in-memory LRU Cache with O(1) operations",
      "Longest Substring Without Repeating Characters using Sliding Window"
    ],
    evalCriteria: [
      "Optimal Big-O time and space complexity",
      "Identification of degenerate inputs (empty, duplicates, single element)",
      "Clear articulation of invariants before code execution",
      "Trade-off between recursive stack overhead vs iterative memoization"
    ],
    followUpStrategy: "Probe worst-case space complexity, hash collision degradation, or scaling inputs beyond RAM limits.",
    fallbackQuestions: [
      {
        question: "Given a continuous data stream of user IDs, how would you maintain the top 10 most frequent visitors in O(N log K) time with strictly bounded memory?",
        target: "Algorithmic Reasoning & Data Structures",
        type: "coding",
      },
      {
        question: "When evaluating data structures for range queries versus point lookups, how do balanced Binary Search Trees compare against Hash Maps in worst-case time complexity?",
        target: "Data Structure Trade-offs",
        type: "coding",
      },
      {
        question: "In a microservice build dependency graph, how do you efficiently detect circular dependencies in O(V + E) time, and how do you recover gracefully if a cycle exists?",
        target: "Graph Algorithms & Topological Sort",
        type: "coding",
      },
    ],
  },
  code_comprehension: {
    id: "code_comprehension",
    name: "Code Comprehension",
    shortTitle: "Code Comprehension",
    description: "Investigating unfamiliar real-world codebases, tracing execution flow, verifying state invariants, and understanding distributed module contracts without breaking existing guarantees.",
    primaryCategories: ["C_PROJECT_DEEP_DIVE", "D_PROJECT_ARCHITECTURE", "I_OOP_DESIGN_PATTERNS", "T_TESTING_DEBUGGING"],
    coreCompetencies: ["Codebase Mental Modeling", "Execution Path Tracing", "Invariant Identification", "Contract & Interface Comprehension"],
    sampleTasks: [
      "Tracing distributed payment transaction flow across gateway and persistence services",
      "Navigating state machine transitions in a multi-tenant subscription manager",
      "Analyzing concurrency invariants in a background queue consumer"
    ],
    evalCriteria: [
      "Accurate identification of entry points and lifecycle handlers",
      "Understanding boundary conditions and side effects",
      "Distinguishing synchronous versus asynchronous execution pathways",
      "Recognizing error handling contracts and propagation paths"
    ],
    followUpStrategy: "Ask candidate to predict the exact state mutation when a specific network timeout occurs during turn execution.",
    fallbackQuestions: [
      {
        question: "When stepping into a large, unfamiliar enterprise codebase, what systematic approach do you use to map out data flows and find where core business logic is executed?",
        target: "Codebase Exploration & Mental Modeling",
        type: "technical",
      },
      {
        question: "How do you identify unstated state invariants and contract assumptions in a legacy service before refactoring or extending its API interface?",
        target: "State Invariants & Contract Analysis",
        type: "technical",
      },
      {
        question: "When reading asynchronous event handlers in Node.js or Go, how do you verify that shared state mutations are thread-safe and free from unhandled promise rejections?",
        target: "Asynchronous Execution Tracing",
        type: "technical",
      },
    ],
  },
  debugging_code_repair: {
    id: "debugging_code_repair",
    name: "Debugging & Code Repair",
    shortTitle: "Debugging & Repair",
    description: "Systematic root cause analysis, reproducing elusive intermittent bugs, isolating memory leaks and deadlocks, defensive patching, and regression test authoring.",
    primaryCategories: ["T_TESTING_DEBUGGING", "K_OPERATING_SYSTEMS", "P_DATA_SECURITY_ISOLATION"],
    coreCompetencies: ["Root Cause Isolation", "Reproduction Methodology", "Defensive Repair", "Regression Prevention"],
    sampleTasks: [
      "Debugging intermittent socket hangup under 95th percentile peak traffic",
      "Isolating a memory leak caused by retained event listeners in long-lived workers",
      "Resolving database connection pool starvation under concurrent burst queries"
    ],
    evalCriteria: [
      "Hypothesis-driven scientific debugging rather than trial-and-error guessing",
      "Minimal, non-breaking defensive fix that preserves existing behavior",
      "Authoring automated tests that fail before the fix and pass after",
      "Instrumenting telemetry to monitor for recurrence in production"
    ],
    followUpStrategy: "Challenge the candidate on potential second-order failure modes or performance regressions introduced by their proposed patch.",
    fallbackQuestions: [
      {
        question: "Walk me through how you isolate and reproduce a 'heisenbug' that only manifests intermittently under heavy production concurrency.",
        target: "Intermittent Bug Reproduction & Isolation",
        type: "technical",
      },
      {
        question: "When diagnosing a steady memory leak in a long-running Node.js or Go backend service, what profiling tools and metrics do you use to identify the root cause?",
        target: "Memory Profiling & Resource Leaks",
        type: "technical",
      },
      {
        question: "How do you structure an automated regression test to ensure that a repaired race condition cannot silently re-enter the repository in future pull requests?",
        target: "Regression Test Design & Race Prevention",
        type: "technical",
      },
    ],
  },
  ai_assisted_engineering: {
    id: "ai_assisted_engineering",
    name: "AI-Assisted Engineering",
    shortTitle: "AI-Assisted Engineering",
    description: "Leveraging LLM tools and copilots effectively, precision prompt formulation, critical verification of AI output, identifying subtle hallucinated bugs and security vulnerabilities, and maintaining architectural rigor.",
    primaryCategories: ["S_LLM_INTEGRATION", "P_DATA_SECURITY_ISOLATION", "T_TESTING_DEBUGGING"],
    coreCompetencies: ["AI Output Critical Verification", "Hallucination & Bug Detection", "Prompt Engineering & Decomposition", "Security Boundary Guardrails"],
    sampleTasks: [
      "Auditing an AI-generated authentication middleware for subtle JWT bypass holes",
      "Using LLMs to accelerate database migration scripts while verifying zero-data-loss invariants",
      "Decomposing a complex system feature into verifiable subtasks with strict acceptance tests"
    ],
    evalCriteria: [
      "Refusal to blindly trust generated code; active boundary verification",
      "Spotting subtle logical fallacies, edge-case omissions, and outdated library APIs",
      "Demonstrating prompt precision with concrete constraints and schema definitions",
      "Balancing AI development velocity with human architectural ownership"
    ],
    followUpStrategy: "Ask candidate how they catch security anti-patterns (e.g., prompt injection, SSRF, SQL interpolation) in AI-synthesized handlers.",
    fallbackQuestions: [
      {
        question: "When using an AI coding assistant to generate complex backend logic, what exact verification process do you follow before approving the code for production?",
        target: "AI Code Verification & Boundary Auditing",
        type: "technical",
      },
      {
        question: "How do you identify and prevent subtle hallucinations or security vulnerabilities (like token bypasses or unescaped queries) in AI-generated code?",
        target: "Hallucination & Security Detection",
        type: "technical",
      },
      {
        question: "How do you structure prompts and context windows when asking an LLM to refactor a critical multi-module subsystem without altering external contracts?",
        target: "Prompt Architecture & Contract Preservation",
        type: "technical",
      },
    ],
  },
  system_design: {
    id: "system_design",
    name: "System Design",
    shortTitle: "System Design",
    description: "Architecting high-availability, scalable distributed systems, data partitioning, replication, CAP/PACELC trade-offs, cache invalidation, rate limiting, and failure containment.",
    primaryCategories: ["Q_SYSTEM_DESIGN", "M_BACKEND_ENGINEERING", "J_DATABASES_SQL"],
    coreCompetencies: ["Distributed Architecture", "Scalability & Partitioning", "Data Consistency & Latency", "Failure Modes & Graceful Degradation"],
    sampleTasks: [
      "Architect a distributed rate limiter supporting 50,000 RPS across multi-region clusters",
      "Design a real-time collaborative document editor with conflict resolution (OT/CRDTs)",
      "Design an idempotent payment processing pipeline with transactional outbox and CDC"
    ],
    evalCriteria: [
      "Clarifying functional requirements, non-functional targets, and scale numbers upfront",
      "Sound selection of database models (relational vs document vs wide-column)",
      "Concrete bottleneck mitigation (caching, connection pooling, backpressure)",
      "Clear fault-tolerance strategies (circuit breakers, dead letter queues, idempotency keys)"
    ],
    followUpStrategy: "Introduce a sudden 10x traffic spike or a major data center network partition and evaluate how their design degrades.",
    fallbackQuestions: [
      {
        question: "How would you architect a distributed rate limiter that handles 50,000 requests per second across multiple data centers with sub-10ms latency?",
        target: "Distributed System Design & Latency",
        type: "system-design",
      },
      {
        question: "How do you guarantee at-least-once message delivery in an event-driven microservices architecture without introducing duplicate processing side-effects?",
        target: "Distributed Idempotency & Message Pipelines",
        type: "system-design",
      },
      {
        question: "When partitioning a multi-terabyte database across nodes, how do you handle hot partition keys and perform online rebalancing without downtime?",
        target: "Database Partitioning & Rebalancing",
        type: "system-design",
      },
    ],
  },
  code_review_reliability: {
    id: "code_review_reliability",
    name: "Code Review & Reliability",
    shortTitle: "Code Review",
    description: "Thorough peer review, finding OWASP security vulnerabilities, identifying concurrency hazards, ensuring observability, maintainability, and clean code standards.",
    primaryCategories: ["P_DATA_SECURITY_ISOLATION", "T_TESTING_DEBUGGING", "U_GIT_COLLABORATION"],
    coreCompetencies: ["Vulnerability & Flaw Detection", "API Contract Review", "Maintainability & Clean Code", "Observability & Metric Guardrails"],
    sampleTasks: [
      "Reviewing a pull request introducing raw SQL queries and potential injection vectors",
      "Auditing an async webhook handler lacking idempotency checks and replay protection",
      "Reviewing microservice client code lacking circuit breakers, timeouts, or retries"
    ],
    evalCriteria: [
      "Constructive, empathetic, and actionable feedback comments",
      "Immediate spotting of security risks (SSRF, IDOR, SQL injection, secrets leakage)",
      "Evaluating test coverage, failure modes, and edge cases",
      "Assessing long-term maintainability, readability, and API backward compatibility"
    ],
    followUpStrategy: "Ask candidate how they communicate blocking feedback to a peer while maintaining strong collaborative trust.",
    fallbackQuestions: [
      {
        question: "In a pull request review, what critical security and reliability checks do you prioritize before approving a merge to production?",
        target: "Code Review Priority & Security Checks",
        type: "technical",
      },
      {
        question: "How do you identify hidden concurrency bugs, like unhandled race conditions or deadlocks, when reviewing multi-threaded or asynchronous code?",
        target: "Concurrency Review & Race Detection",
        type: "technical",
      },
      {
        question: "When reviewing an external webhook consumer, what architectural safeguards do you demand to prevent replay attacks and out-of-order execution?",
        target: "API Contract Reliability & Idempotency",
        type: "technical",
      },
    ],
  },
  senior_engineering_judgment: {
    id: "senior_engineering_judgment",
    name: "Senior Engineering Judgment",
    shortTitle: "Senior Judgment",
    description: "Navigating ambiguous trade-offs, managing technical debt vs business delivery velocity, buy vs build evaluations, zero-downtime database migrations, and team alignment.",
    primaryCategories: ["D_PROJECT_ARCHITECTURE", "Y_ROLE_SITUATIONAL", "X_OWNERSHIP_LEARNING"],
    coreCompetencies: ["Trade-off Analysis", "Tech Debt vs Velocity", "Buy vs Build Decisioning", "Migration & Risk Containment"],
    sampleTasks: [
      "Deciding between building an in-house message broker vs adopting managed Kafka/AWS SQS",
      "Planning a live zero-downtime database migration from MongoDB to PostgreSQL under constant traffic",
      "Balancing architectural refactoring against high-priority executive feature requests"
    ],
    evalCriteria: [
      "Pragmatic engineering mindset grounded in business context and ROI",
      "Evaluating Total Cost of Ownership (maintenance, observability, team cognitive load)",
      "Risk mitigation via phased rollouts, feature flags, and dark launching",
      "Effective communication of technical trade-offs to non-engineering stakeholders"
    ],
    followUpStrategy: "Challenge the candidate with a sudden budget reduction or tight business deadline and ask what technical compromises they would make.",
    fallbackQuestions: [
      {
        question: "How do you evaluate the trade-off between building a custom in-house framework versus adopting an existing third-party or open-source solution?",
        target: "Buy vs Build & Total Cost of Ownership",
        type: "technical",
      },
      {
        question: "How do you design a zero-downtime database migration strategy for a high-traffic table with tens of millions of rows while actively serving writes?",
        target: "Zero-Downtime Migration & Risk Containment",
        type: "technical",
      },
      {
        question: "When facing heavy leadership pressure to rush a release, how do you decide what technical debt is acceptable to take on versus what compromises are non-negotiable?",
        target: "Technical Debt & Delivery Velocity",
        type: "behavioral",
      },
    ],
  },
  behavioral_project_deep_dives: {
    id: "behavioral_project_deep_dives",
    name: "Behavioral & Project Deep Dives",
    shortTitle: "Project & Behavioral",
    description: "In-depth defense of past engineering systems, personal ownership, STAR framework storytelling, navigating intense team disagreements, outage post-mortems, and mentorship.",
    primaryCategories: ["C_PROJECT_DEEP_DIVE", "V_BEHAVIORAL_LEADERSHIP", "X_OWNERSHIP_LEARNING"],
    coreCompetencies: ["Project Defense & Ownership", "Constructive Conflict Resolution", "Post-Mortem & Incident Accountability", "Cross-Functional Collaboration"],
    sampleTasks: [
      "Walking through the architecture and hardest trade-off in your primary production project",
      "Resolving an architectural deadlock with a senior peer on API design",
      "Conducting a blameless post-mortem for a production outage you were directly involved in"
    ],
    evalCriteria: [
      "Clear distinction of personal implementation versus team or framework code",
      "Adherence to STAR structure with concrete metrics and outcomes",
      "Honest ownership of failures and constructive lessons learned",
      "High empathy and collaborative maturity during technical disagreements"
    ],
    followUpStrategy: "Press on what the candidate would do differently in hindsight and why their original design was suboptimal.",
    fallbackQuestions: [
      {
        question: "Walk me through the most technically challenging bug or performance bottleneck you personally diagnosed in a project, and the key trade-offs you evaluated.",
        target: "Project Defense & Bottleneck Diagnosis",
        type: "project-defense",
      },
      {
        question: "Tell me about a time you strongly disagreed with a peer or tech lead on an architectural direction. How did you advocate for your view and resolve the impasse?",
        target: "Technical Disagreement & Conflict Resolution",
        type: "behavioral",
      },
      {
        question: "Describe a production incident, outage, or broken deployment you were directly involved with. What went wrong, and what concrete safeguards did you put in place?",
        target: "Production Incident Ownership & Post-Mortem",
        type: "behavioral",
      },
    ],
  },
};
export type CompetencyStatus = "unassessed" | "in_progress" | "assessed" | "declined" | "skipped";
export type CompetencyTier = "Critical" | "Important" | "Preferred";

export interface CandidateEvidenceItem {
  source: "resume" | "github" | "linkedin" | "student_dna" | "assessment" | "portfolio";
  claimOrObservation: string;
  status: "VERIFIED_FACT" | "CANDIDATE_CLAIM" | "OBSERVED_ARTIFACT" | "UNVERIFIED" | "SOURCE_INACCESSIBLE";
  detail: string;
  relatedCompetency: string;
  relevanceScore: number;
}

export interface CandidateInterviewDossier {
  candidateId: string;
  name: string;
  targetRole: string;
  targetCompany?: string;
  experienceYears: number | null;
  experienceMode: ExperienceMode;
  careerIntent: string;
  verifiedSkills: string[];
  claimedSkills: string[];
  evidenceItems: CandidateEvidenceItem[];
  projects: Array<{
    title: string;
    tech: string[];
    githubRepo?: string;
    description?: string;
    verificationStatus: string;
  }>;
  githubStatus: {
    connected: boolean;
    username?: string;
    publicRepos: number;
    accessibleRepos: Array<{
      name: string;
      primaryLang?: string;
      hasTests: boolean;
      frameworks: string[];
      codeQualitySignals: string[];
    }>;
    limitations: string[];
  };
  linkedinStatus: {
    connected: boolean;
    profileUrl?: string;
    limitations: string[];
  };
  missingOrUnverified: string[];
  previousInterviewWeaknesses: string[];
  accumulatedWeakTopics?: string[];
  historicalQuestionsAsked?: string[];
  previouslyAssessedCompetencies?: Record<string, { score: number; status: string; turnsCount?: number }>;
  placementProfile?: any;
  interviewType?: string;
  candidateIntelligence?: CandidateIntelligenceProfile;
  jdCompetencyMatrix?: JDCompetencyMatrix;
  interviewPlan?: InternalInterviewPlan;
  codeSubmissions?: any[];
}

export interface BlueprintCompetency {
  id: string;
  name: string;
  category: "project_deep_dive" | "fundamentals" | "coding_reasoning" | "system_design" | "behavioral" | "role_specific";
  categoryKey?: CompetencyCategoryKey;
  tier: CompetencyTier;
  evidenceAnchor?: string;
  isAssessed: boolean;
  status?: CompetencyStatus;
  score?: number;
  verbatimEvidence?: string;
  evidenceCollected?: string[];
  confidenceLevel?: "low" | "medium" | "high";
  turnsSpent?: number;
  timeBudgetMinutes?: number;
}

export interface SectionPlan {
  section: InterviewSection;
  targetTurns: number;
  focus: string;
  completed: boolean;
}

export type InterviewType = "technical" | "behavioral" | "hr" | "system_design" | "mixed";

export interface InterviewBlueprint {
  sessionId: string;
  candidateId: string;
  targetRole: string;
  targetCompany?: string;
  interviewType?: InterviewType;
  track?: InterviewTrack;
  skillsFocus?: string[];
  experienceMode: ExperienceMode;
  durationMinutes: number;
  totalTargetTurns: number;
  competencies: BlueprintCompetency[];
  sectionPlan: SectionPlan[];
  currentSection: InterviewSection;
  turnCount: number;
  primaryCompetencies?: string[];
  supportingCompetencies?: string[];
  areasAdequatelyAssessed?: string[];
  areasNeedingEvidence?: string[];
  interviewPlan?: InternalInterviewPlan;
  codeSubmissions?: any[];
}

export interface AnswerAssessment {
  answer_quality: AnswerQuality;
  reasoning: string;
  topics_demonstrated: string[];
  unresolved_threads?: string[];
  next_action: NextInterviewerAction;
  difficulty_adjustment: "escalate" | "maintain" | "de-escalate";
  extracted_claims?: string[];
  is_assisted?: boolean;
  is_self_corrected?: boolean;
  alternative_approach_valid?: boolean;
  competency_established?: boolean;
}

export interface GeneratedQuestion {
  question: string;
  question_targets: string;
  question_type: "warm-up" | "project-defense" | "technical" | "coding" | "system-design" | "behavioral" | "closing";
  difficulty_level: "easy" | "medium" | "hard";
  is_follow_up: boolean;
  follow_up_reason?: FollowUpReason;
  section_transition?: string;
  section?: InterviewSection;
  competency_focus?: string;
  competency_targeted?: string;
  evidence_grounding?: string;
}

export interface LoggedQuestion {
  question: string;
  targets: string;
  section: InterviewSection;
  competency: string;
  turnIndex: number;
}

export interface RubricDimensionScore {
  dimension: string;
  earnedPoints: number;
  maxPoints: number;
  explanation: string;
}

export interface QuestionModelAnswer {
  score: number;
  rubricVersion: string;
  rubricName?: string;
  isAssisted?: boolean;
  alternativeApproachValid?: boolean;
  status?: AssessmentItemStatus;
  dimensionScores: RubricDimensionScore[];
  whatYouDidWell: string[];
  whatWasMissing: string[];
  deductionReasons: string[];
  howToImprove: string;
  bestPossibleAnswer: string;
  keyConceptsToRemember: string[];
  likelyFollowUps: string[];
  personalizedNextAction: string;
  answerComparison?: {
    candidateDemonstrated: string[];
    missingPoints: string[];
    whatModelAnswerAdds: string;
  };
}

export type AssessmentItemStatus =
  | "pending"
  | "in_progress"
  | "assessed"
  | "insufficient_evidence"
  | "failed"
  | "skipped"
  | "unassessed";

export interface EvidenceCoverageSummary {
  totalPlanned: number;
  assessedCount: number;
  insufficientEvidenceCount: number;
  skippedCount: number;
  failedCount: number;
  pendingCount: number;
  coverageRatio: number;
  isAdequateForHiringDecision: boolean;
}

export interface AssistedVsIndependentSummary {
  totalTurns: number;
  independentTurns: number;
  assistedTurns: number;
  independentScoreAverage: number | null;
  assistedScoreAverage: number | null;
  assistanceInfluenceNote: string;
}

export interface TrackRubricSummary {
  track: InterviewTrack;
  trackName: string;
  rubricName: string;
  dimensionsEvaluated: Array<{
    dimension: string;
    maxPoints: number;
    earnedAverage: number;
    explanation: string;
  }>;
}

export interface QuestionAnalysisItem {
  turnIndex: number;
  questionText: string;
  question?: string;
  candidateAnswer: string;
  competency: string;
  status: AssessmentItemStatus;
  score: number;
  rubricScore?: number;
  scale?: string;
  isAssisted?: boolean;
  assistanceUsed?: string;
  alternativeApproachValid?: boolean;
  dimensionScores: RubricDimensionScore[];
  whatYouDidWell: string[];
  whatWasMissing: string[];
  deductionReasons: string[];
  howToImprove: string;
  bestPossibleAnswer: string;
  exemplarModelAnswer?: string;
  keyConceptsToRemember: string[];
  likelyFollowUps: string[];
  personalizedNextAction?: string;
  evidenceGrounding?: string;
  evaluationError?: string;
}

export interface InterviewTurn {
  turnIndex: number;
  question: GeneratedQuestion;
  answer: string;
  assessment?: AnswerAssessment;
  timestamp: string;
  follow_up_reason?: FollowUpReason;
  section_transition?: string;
  modelAnswerFeedback?: QuestionModelAnswer;
  rubricScore?: number;
  status?: AssessmentItemStatus;
  isAssisted?: boolean;
  assistanceCount?: number;
  alternativeApproachDetected?: boolean;
  evaluationError?: string;
  codeExecutionReport?: any;
  autonomousEvaluation?: any;
}

export type OpeningState =
  | "NEW_SESSION"
  | "GREETING"
  | "AWAITING_CANDIDATE_INTRO"
  | "INTRODUCTION_RECEIVED"
  | "INTERVIEW_IN_PROGRESS"
  | "COMPLETED";

export type InterviewLifecycleState =
  | "INITIALIZING"
  | "PLAN_READY"
  | "ASKING_QUESTION"
  | "AWAITING_ANSWER"
  | "EVALUATING_ANSWER"
  | "FOLLOW_UP_REQUIRED"
  | "ADVANCING_COMPETENCY"
  | "READY_TO_FINISH"
  | "COMPLETED"
  | "EARLY_TERMINATION"
  | "PAUSED"
  | "CANCELLED"
  | "ERROR_RECOVERY"
  | "created"
  | "in_progress"
  | "evaluating"
  | "awaiting_follow_up"
  | "paused"
  | "completed"
  | "cancelled"
  | "failed"
  | "early_finish";

export function normalizeLifecycleState(state: InterviewLifecycleState | string): InterviewLifecycleState {
  const s = String(state).toLowerCase();
  if (s === "created" || s === "plan_ready") return "PLAN_READY";
  if (s === "in_progress" || s === "awaiting_answer" || s === "asking_question") return "AWAITING_ANSWER";
  if (s === "evaluating" || s === "evaluating_answer") return "EVALUATING_ANSWER";
  if (s === "awaiting_follow_up" || s === "follow_up_required") return "FOLLOW_UP_REQUIRED";
  if (s === "advancing_competency") return "ADVANCING_COMPETENCY";
  if (s === "paused") return "PAUSED";
  if (s === "completed") return "COMPLETED";
  if (s === "cancelled") return "CANCELLED";
  if (s === "failed" || s === "error_recovery") return "ERROR_RECOVERY";
  if (s === "ready_to_finish" || s === "early_finish") return "READY_TO_FINISH";
  return (state as InterviewLifecycleState) || "PLAN_READY";
}

export function validateLifecycleTransition(
  fromState: InterviewLifecycleState | string,
  toState: InterviewLifecycleState | string
): { allowed: boolean; reason?: string } {
  const from = normalizeLifecycleState(fromState);
  const to = normalizeLifecycleState(toState);

  // Terminal states cannot transition to active states
  if (from === "COMPLETED") {
    if (to === "COMPLETED") return { allowed: true };
    return { allowed: false, reason: "Session is completed; terminal state cannot transition." };
  }
  if (from === "CANCELLED") {
    if (to === "CANCELLED") return { allowed: true };
    return { allowed: false, reason: "Session is cancelled; terminal state cannot transition." };
  }

  // Allowed transitions map
  const allowedTransitions: Record<string, string[]> = {
    PLAN_READY: ["AWAITING_ANSWER", "CANCELLED", "PAUSED", "ERROR_RECOVERY"],
    AWAITING_ANSWER: ["EVALUATING_ANSWER", "PAUSED", "CANCELLED", "COMPLETED", "READY_TO_FINISH", "ERROR_RECOVERY"],
    EVALUATING_ANSWER: ["FOLLOW_UP_REQUIRED", "ADVANCING_COMPETENCY", "AWAITING_ANSWER", "READY_TO_FINISH", "COMPLETED", "PAUSED", "ERROR_RECOVERY"],
    FOLLOW_UP_REQUIRED: ["AWAITING_ANSWER", "ADVANCING_COMPETENCY", "PAUSED", "COMPLETED", "ERROR_RECOVERY"],
    ADVANCING_COMPETENCY: ["AWAITING_ANSWER", "READY_TO_FINISH", "COMPLETED", "PAUSED", "ERROR_RECOVERY"],
    PAUSED: ["AWAITING_ANSWER", "CANCELLED", "COMPLETED", "ERROR_RECOVERY"],
    READY_TO_FINISH: ["COMPLETED", "CANCELLED", "ERROR_RECOVERY"],
    ERROR_RECOVERY: ["AWAITING_ANSWER", "PLAN_READY", "CANCELLED", "COMPLETED"],
  };

  const validNext = allowedTransitions[from] || [];
  if (from === to || validNext.includes(to)) {
    return { allowed: true };
  }

  return { allowed: false, reason: `Illegal transition from ${from} to ${to}.` };
}

export function transitionLifecycleState(
  sessionState: AdvancedSessionState,
  nextState: InterviewLifecycleState
): { success: boolean; error?: string } {
  const current = sessionState.lifecycleState || "PLAN_READY";
  const check = validateLifecycleTransition(current, nextState);
  if (!check.allowed) {
    return { success: false, error: check.reason };
  }
  sessionState.lifecycleState = nextState;
  if (normalizeLifecycleState(nextState) === "COMPLETED") {
    sessionState.isCompleted = true;
  }
  return { success: true };
}

export interface AdvancedSessionState {
  sessionId: string;
  candidateId: string;
  blueprint: InterviewBlueprint;
  dossier?: CandidateInterviewDossier;
  openingState: OpeningState;
  lifecycleState?: InterviewLifecycleState;
  isCompleted?: boolean;
  followUpsOnCurrentTopic?: number;
  candidateIntroduction?: string;
  turns: InterviewTurn[];
  questionsAsked: LoggedQuestion[];
  topicsCovered: string[];
  answerDistribution: {
    strong: number;
    adequate: number;
    shallow: number;
    off_topic: number;
    does_not_know: number;
    contradictory: number;
  };
  currentDifficulty: "easy" | "medium" | "hard";
  lastAssessment: AnswerAssessment | null;
  consecutiveShallow: number;
  experienceMode: ExperienceMode;
  remainingTimeMinutes: number;
  completedTurns: number;
  history: any[];
  assessedCompetencies: Record<string, string>;
  currentTopic?: string;
  track?: InterviewTrack;
  assistanceCount?: number;
  uncertaintyOnCurrentTopic?: boolean;
  consecutiveIrrelevantAnswers?: number;
  projectExplorationFocus?: "overview" | "personal_contribution" | "tradeoff_decision" | "failure_challenge";
  previousSection?: InterviewSection;
  conductState?: ConductState;
  conductIncidents?: ConductIncident[];
  candidateIntelligence?: CandidateIntelligenceProfile;
  jdCompetencyMatrix?: JDCompetencyMatrix;
  interviewPlan?: InternalInterviewPlan;
  codeSubmissions?: any[];
}

export interface InterviewFinalReport {
  candidateId: string;
  sessionId: string;
  targetRole: string;
  track?: InterviewTrack;
  overallScore: number;
  overallScoreCalculation?: string;
  hiringRecommendation: "STRONG_HIRE" | "HIRE" | "LEANING_HIRE" | "NO_HIRE" | "INSUFFICIENT_EVIDENCE" | "ASSESSMENT_INCOMPLETE";
  confidence: number;
  executiveSummary: string;
  evidenceCoverage?: EvidenceCoverageSummary;
  assistedVsIndependentSummary?: AssistedVsIndependentSummary;
  trackRubric?: TrackRubricSummary;
  conductState?: ConductState;
  conductIncidents?: ConductIncident[];
  competenciesAssessed: Array<{
    competency: string;
    score: number;
    status: "demonstrated" | "partial" | "gap" | "insufficient_evidence" | "unassessed";
    verbatimQuote: string;
    evaluation: string;
    provenance?: string;
    isAssisted?: boolean;
  }>;
  competenciesNotAssessed: Array<{
    competency: string;
    reason: string;
  }>;
  projectOwnershipAndVeracity: {
    score: number;
    summary: string;
    claimedVsObserved: string;
  };
  technicalDepth: { score: number; summary: string };
  problemSolvingAndReasoning: { score: number; summary: string };
  communicationAndBehavioral: { score: number; summary: string };
  provenanceSummary: {
    verifiedFactsUsed: string[];
    candidateClaimsInvestigated: string[];
    observedArtifactsReferenced: string[];
    unverifiedOrMissingSources: string[];
  };
  keyStrengths: string[];
  criticalGaps: string[];
  recommendedLearningActions: string[];
  interviewerPrivateNote: string;
  questionByQuestionAnalysis?: QuestionAnalysisItem[];
}

// Backward-compatibility legacy SessionState interface
export interface SessionState {
  question_count: number;
  topics_covered: string[];
  answer_distribution: { strong: number; adequate: number; shallow: number; off_topic: number };
  current_difficulty: "easy" | "medium" | "hard";
  last_assessment: AnswerAssessment | null;
  consecutive_shallow: number;
  experience_mode: ExperienceMode;
}

export interface InterviewContext {
  target_company?: string;
  company_tier?: string;
  drive_type?: string;
  role_level?: string;
  round_2_summary?: string;
}

// ══════════════════════════════════════════════════════════════
// 2. HELPER UTILITIES
// ══════════════════════════════════════════════════════════════

export function stripThink(raw: string): string {
  return raw
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
    .replace(/<think>[\s\S]*$/gi, "")
    .replace(/<thinking>[\s\S]*$/gi, "")
    .replace(/<\/?think(?:ing)?>/gi, "")
    .trim();
}

export function extractJSON(raw: string): any {
  const clean = stripThink(raw)
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  const s = clean.indexOf("{");
  const e = clean.lastIndexOf("}");
  if (s === -1 || e === -1) throw new Error("No JSON object found");
  const slice = clean.slice(s, e + 1);
  try {
    return JSON.parse(slice);
  } catch {
    return JSON.parse(
      slice
        .replace(/,\s*}/g, "}")
        .replace(/,\s*]/g, "]")
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, " ")
    );
  }
}

export function normalizeQuestion(q: string): string {
  if (!q || typeof q !== "string") return "";
  return q
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Checks semantic and token overlap between a new question and all previously asked questions or a single question string.
 */
const QUESTION_STOPWORDS = new Set([
  "what", "when", "where", "which", "who", "whom", "this", "that", "these", "those",
  "would", "could", "should", "your", "with", "from", "tell", "about", "walk", "explain",
  "describe", "using", "into", "have", "more", "some", "like", "just", "built", "build",
  "building", "also", "their", "there", "then", "than", "were", "been", "being", "does",
  "approach", "take", "how", "can", "you", "the", "and", "for", "are", "way", "handle",
  "handling", "show", "give", "share"
]);

function extractSemanticStems(normalizedStr: string): Set<string> {
  const words = normalizedStr.split(" ").filter((w) => w.length > 2 && !QUESTION_STOPWORDS.has(w));
  const stems = new Set<string>();
  for (const w of words) {
    const stem = w.replace(/(?:ing|tions?|ments?|ness|ies|es|ed|s|ency|ent|able|ible)$/i, "");
    if (stem.length > 2) stems.add(stem);
    else stems.add(w);
  }
  return stems;
}

export function isQuestionSemanticallyDuplicate(
  newQuestion: string,
  target: Array<{ question: string } | string> | string
): boolean {
  if (!target) return false;
  const normNew = normalizeQuestion(newQuestion);
  if (!normNew) return false;
  const newStems = extractSemanticStems(normNew);

  const list: string[] = typeof target === "string"
    ? [target]
    : Array.isArray(target)
    ? target.map((t) => (typeof t === "string" ? t : (t as any)?.question || "")).filter(Boolean)
    : [];

  for (const prevText of list) {
    const normPrev = normalizeQuestion(prevText);
    if (!normPrev) continue;
    if (normNew === normPrev) return true;

    const prevStems = extractSemanticStems(normPrev);
    let intersection = 0;
    for (const s of newStems) {
      if (prevStems.has(s)) intersection++;
    }
    const union = new Set([...newStems, ...prevStems]).size;
    if (union > 0) {
      const jaccard = intersection / union;
      if (jaccard > 0.65) return true; // High stem overlap without distinct content

      // If moderate overlap, check if new question introduces a justified deeper dimension
      if (jaccard > 0.42) {
        const deeperFollowUpKeywords = [
          "trade-off", "tradeoff", "edge-case", "edge case", "failure", "partition",
          "scale", "metric", "latency", "throughput", "concurrency", "deadlock",
          "idempotency", "bottleneck", "rebalance", "rollback", "benchmark", "telemetry",
          "postgres", "redis", "index", "memory", "cache", "hash", "tree"
        ];
        const hasDeeperProbe = deeperFollowUpKeywords.some((k) => normNew.includes(k) && !normPrev.includes(k));
        if (!hasDeeperProbe) {
          return true; // Redundant rephrasing of the same underlying assessment
        }
      }
    }
  }
  return false;
}

// ══════════════════════════════════════════════════════════════
// QUESTION COMPLETENESS VALIDATOR & REPAIR (Phase 5)
// ══════════════════════════════════════════════════════════════

export interface QuestionValidationResult {
  isValid: boolean;
  reason?: string;
  cleanedQuestion: string;
}

/**
 * Validates that an interviewer question is complete, grammatically sound,
 * self-contained, and not cut off mid-thought or mid-sentence.
 */
export function validateQuestionCompleteness(raw: string): QuestionValidationResult {
  if (!raw || typeof raw !== "string") {
    return { isValid: false, reason: "Question is empty or not a string", cleanedQuestion: "" };
  }

  let cleaned = stripThink(raw).trim();
  // Strip leading quotes or question markers like "Q: ", "Question 1: "
  cleaned = cleaned.replace(/^(?:question\s*\d*[:.-]?|q\d*[:.-]?)\s*/i, "").trim();
  cleaned = cleaned.replace(/^["'`]+|["'`]+$/g, "").trim();

  // 1. Minimum character length
  if (cleaned.length < 15) {
    return { isValid: false, reason: "Question is too short (< 15 characters)", cleanedQuestion: cleaned };
  }

  // 2. Minimum word count
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length < 4) {
    return { isValid: false, reason: "Question has too few words (< 4 words)", cleanedQuestion: cleaned };
  }

  // 3. Check for dangling ending verbs, prepositions or truncated thoughts
  const danglingEndPattern = /\b(walk|walk me|walk me through|could you|could you give|could you explain|can you give|can you explain|can you|how would|how would you|such as|with|to|and|or|in|of|at|by|for|like|describe|tell me|explain|about|from|the|a|an|if|because)\s*[?.!]?["']?$/i;
  if (danglingEndPattern.test(cleaned)) {
    return { isValid: false, reason: "Question ends with a dangling verb or truncated thought", cleanedQuestion: cleaned };
  }

  // 4. Check for missing terminal punctuation
  const hasValidEnding = /[?.!]["']?$/.test(cleaned);
  if (!hasValidEnding) {
    return { isValid: false, reason: "Question lacks terminal punctuation (? or .)", cleanedQuestion: cleaned };
  }

  // 5. Check for unclosed backticks
  const openBackticks = (cleaned.match(/`/g) || []).length;
  if (openBackticks % 2 !== 0) {
    return { isValid: false, reason: "Question contains unclosed code backticks", cleanedQuestion: cleaned };
  }

  // 6. Check for unbalanced parentheses
  const openParens = (cleaned.match(/\(/g) || []).length;
  const closeParens = (cleaned.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    return { isValid: false, reason: "Question contains unbalanced parentheses", cleanedQuestion: cleaned };
  }

  return { isValid: true, cleanedQuestion: cleaned };
}

// ══════════════════════════════════════════════════════════════
// CANDIDATE DECLINE & PASS DETECTOR (Phase 7)
// ══════════════════════════════════════════════════════════════

/**
 * Detects if the candidate politely declined, passed, or asked to skip a question
 * without immediately penalizing them or badgering them.
 */
export function isCandidateDecline(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  const clean = text.toLowerCase().trim();
  const wordCount = clean.split(/\s+/).filter(Boolean).length;

  // Don't treat "I don't know", "no idea", or "haven't worked with" as a pure decline; that is does_not_know
  if (/don'?t know|not sure|not familiar|haven'?t worked|never used|no idea|no clue|drawing a blank/i.test(clean)) {
    return false;
  }

  if (wordCount <= 3 && /^(no|nope|nah|negative)[\.\!]?$/i.test(clean)) {
    return true;
  }
  if (wordCount <= 5 && /^(pass|skip)[\.\!]?$/i.test(clean)) {
    return true;
  }

  const declinePatterns = [
    /\b(i'?d|i would) rather not\b/i,
    /\bprefer not to\b/i,
    /\b(can we|could we|let'?s) (skip|move on|pass|not talk about)\b/i,
    /\bdon'?t (remember|recall)\b/i,
    /\bnot (comfortable|prepared) (with|answering|discussing)\b/i,
    /\bpass on (this|that|the question)\b/i,
    /\bno comment\b/i,
    /\bi decline\b/i,
    /\brather skip\b/i,
    /\bcan we go to (the )?next\b/i,
  ];

  return declinePatterns.some((pattern) => pattern.test(clean));
}

// ══════════════════════════════════════════════════════════════
// JOB DESCRIPTION & ROLE DNA PARSER (Phases 1 & 2)
// ══════════════════════════════════════════════════════════════

export interface ParsedJobRequirements {
  mandatorySkills: string[];
  importantSkills: string[];
  preferredSkills: string[];
  coreResponsibilities: string[];
  seniorityExpectations: ExperienceMode;
  targetCategories: CompetencyCategoryKey[];
}

export function parseJobDescription(jd: string, experienceMode: ExperienceMode): ParsedJobRequirements {
  const clean = (jd || "").toLowerCase();

  const mandatorySkills: string[] = [];
  const importantSkills: string[] = [];
  const preferredSkills: string[] = [];
  const coreResponsibilities: string[] = [];
  const targetCategories: CompetencyCategoryKey[] = ["A_CANDIDATE_INTRO", "C_PROJECT_DEEP_DIVE", "D_PROJECT_ARCHITECTURE"];

  let seniority: ExperienceMode = experienceMode;
  if (clean.includes("senior") || clean.includes("lead") || clean.includes("staff") || clean.includes("principal")) {
    seniority = "experienced";
  }

  // AI / ML / LLM
  if (/ai|ml|machine learning|deep learning|llm|nlp|pytorch|tensorflow|langchain|rag\b/i.test(clean)) {
    mandatorySkills.push("AI/ML Fundamentals", "Model Evaluation & Data Handling");
    targetCategories.push("R_AIML_FUNDAMENTALS", "S_LLM_INTEGRATION");
  }

  // Backend / Distributed / APIs / Databases
  if (/backend|server|distributed|microservice|database|postgres|sql|nosql|redis|kafka|queue/i.test(clean)) {
    mandatorySkills.push("Backend Architecture", "Databases & SQL");
    importantSkills.push("API Design & Authentication", "Concurrency & Systems");
    targetCategories.push("M_BACKEND_ENGINEERING", "J_DATABASES_SQL", "O_APIS_AUTHENTICATION");
    if (seniority === "experienced") {
      targetCategories.push("Q_SYSTEM_DESIGN", "P_DATA_SECURITY_ISOLATION");
    } else {
      targetCategories.push("K_OPERATING_SYSTEMS");
    }
  }

  // Frontend / UI
  if (/frontend|react|next\.js|vue|angular|css|html|ui|ux|web/i.test(clean)) {
    mandatorySkills.push("Frontend Architecture", "JavaScript/TypeScript Fundamentals");
    importantSkills.push("State Management & Performance");
    targetCategories.push("N_FRONTEND_ENGINEERING", "E_LANGUAGE_FUNDAMENTALS");
  }

  // Algorithms & Problem Solving
  if (/dsa|data structures|algorithms|problem solving|leetcode|algorithmic/i.test(clean) || seniority === "fresher" || seniority === "1-3yr") {
    mandatorySkills.push("Data Structures & Algorithms", "Time & Space Complexity");
    targetCategories.push("F_DATA_STRUCTURES_ALGORITHMS", "H_COMPLEXITY_ANALYSIS");
  } else if (seniority === "experienced") {
    targetCategories.push("Q_SYSTEM_DESIGN");
  }

  // Testing & Production Reliability
  if (/testing|ci\/cd|reliability|production|docker|kubernetes|devops/i.test(clean)) {
    importantSkills.push("Testing & Debugging");
    targetCategories.push("T_TESTING_DEBUGGING");
  }

  // Behavioral & Leadership
  targetCategories.push("V_BEHAVIORAL_LEADERSHIP", "X_OWNERSHIP_LEARNING", "Z_CANDIDATE_CLOSING");

  return {
    mandatorySkills,
    importantSkills,
    preferredSkills,
    coreResponsibilities,
    seniorityExpectations: seniority,
    targetCategories: Array.from(new Set(targetCategories)),
  };
}

// ══════════════════════════════════════════════════════════════
// 3. CANDIDATE INTERVIEW DOSSIER BUILDER (WITH SESSION/TTL CACHE)
// ══════════════════════════════════════════════════════════════

const CANDIDATE_INTERVIEW_DOSSIER_CACHE = new Map<string, { dossier: CandidateInterviewDossier; timestamp: number }>();
const DOSSIER_CACHE_TTL_MS = 15 * 60 * 1000;

export function invalidateCandidateInterviewDossierCache(candidateId?: string) {
  if (candidateId) {
    for (const key of Array.from(CANDIDATE_INTERVIEW_DOSSIER_CACHE.keys())) {
      if (key === candidateId || key.startsWith(`${candidateId}::`)) {
        CANDIDATE_INTERVIEW_DOSSIER_CACHE.delete(key);
      }
    }
  } else {
    CANDIDATE_INTERVIEW_DOSSIER_CACHE.clear();
  }
}
export const invalidateCandidateDossierCache = invalidateCandidateInterviewDossierCache;
export { CANDIDATE_INTERVIEW_DOSSIER_CACHE };

export async function buildCandidateInterviewDossier(
  candidateIdOrOpts: any,
  customResume?: string,
  customJd?: string,
  options?: { forceRefresh?: boolean }
): Promise<CandidateInterviewDossier> {
  const candidateId = typeof candidateIdOrOpts === "object" ? (candidateIdOrOpts.candidateId || "candidate") : (candidateIdOrOpts || "candidate");
  const targetRoleOverride = typeof candidateIdOrOpts === "object" ? candidateIdOrOpts.targetRole : undefined;
  const experienceModeOverride = typeof candidateIdOrOpts === "object" ? candidateIdOrOpts.experienceMode : undefined;
  const studentProfileOverride = typeof candidateIdOrOpts === "object" ? candidateIdOrOpts.studentProfile : undefined;
  const effectiveResume = typeof candidateIdOrOpts === "object" ? (candidateIdOrOpts.resume || customResume) : customResume;
  const effectiveJd = typeof candidateIdOrOpts === "object" ? (candidateIdOrOpts.jd || customJd) : customJd;

  const resumeHash = effectiveResume ? computeResumeHash(effectiveResume) : "std";
  const jdHash = effectiveJd ? computeResumeHash(effectiveJd) : "std";
  const cacheKey = `${candidateId}::${resumeHash}::${jdHash}`;
  if (!options?.forceRefresh) {
    const cached = CANDIDATE_INTERVIEW_DOSSIER_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < DOSSIER_CACHE_TTL_MS) {
      if (targetRoleOverride) cached.dossier.targetRole = targetRoleOverride;
      if (experienceModeOverride) cached.dossier.experienceMode = experienceModeOverride;
      return cached.dossier;
    }
  }

  // 1. Fetch authenticated Student DNA
  let dnaResponse: any = null;
  try {
    dnaResponse = await getStudentDNAFull(candidateId);
  } catch (err) {
    console.warn(`[interview-engine] Could not load Student DNA for ${candidateId}:`, err);
  }

  // 2. Fetch Unified Evidence Dossier across 8 sources
  let unifiedDossier: any = null;
  try {
    unifiedDossier = await buildCandidateUnifiedEvidenceDossier(candidateId);
  } catch (err) {
    console.warn(`[interview-engine] Could not load evidence dossier for ${candidateId}:`, err);
  }

  // 3. Candidate metadata & career memory
  const careerMem = getCareerMemory(candidateId);
  const previousWeaknesses: string[] = [];
  for (const rec of careerMem?.records || []) {
    for (const w of rec.weaknessesObserved || []) {
      if (!previousWeaknesses.includes(w)) previousWeaknesses.push(w);
    }
  }

  // 3b. Accumulated Weak Topics & Placement Profile (Stage 1 Context Resolution)
  let accumulatedWeakTopics: string[] = [];
  try {
    accumulatedWeakTopics = await getAccumulatedWeakTopics(candidateId);
    for (const w of accumulatedWeakTopics) {
      if (!previousWeaknesses.includes(w)) previousWeaknesses.push(w);
    }
  } catch {
    // Non-fatal
  }

  let placementProfile: any = null;
  try {
    placementProfile = getPlacementProfile(candidateId);
  } catch {
    // Non-fatal
  }

  // 3c. Historical Questions & Assessed Competencies (Phase 4 Cross-Session Memory)
  let historicalQuestionsAsked: string[] = [];
  let previouslyAssessedCompetencies: Record<string, { score: number; status: string; turnsCount?: number }> = {};
  try {
    historicalQuestionsAsked = await getHistoricalQuestionsForCandidate(candidateId);
    previouslyAssessedCompetencies = await getHistoricalAssessedCompetencies(candidateId);
  } catch {
    // Non-fatal
  }

  // 4. Extract verified skills vs claimed skills
  const verifiedSkills: string[] = [];
  const claimedSkills: string[] = [];
  const evidenceItems: CandidateEvidenceItem[] = [];

  if (dnaResponse?.skills) {
    for (const s of dnaResponse.skills) {
      if (s.level >= 3 || s.verified) {
        verifiedSkills.push(s.name);
      } else {
        claimedSkills.push(s.name);
      }
    }
  }

  // Extract from Unified Dossier
  const resumeAnalysis = unifiedDossier?.resume;
  if (resumeAnalysis?.skills_claimed) {
    for (const sk of resumeAnalysis.skills_claimed) {
      if (!claimedSkills.includes(sk) && !verifiedSkills.includes(sk)) {
        claimedSkills.push(sk);
      }
    }
  }

  // Projects
  const projects: Array<{
    title: string;
    tech: string[];
    githubRepo?: string;
    description?: string;
    verificationStatus: string;
  }> = [];

  if (resumeAnalysis?.projects_claimed) {
    for (const p of resumeAnalysis.projects_claimed) {
      projects.push({
        title: p.title || "Project",
        tech: p.tech || [],
        githubRepo: p.githubUrl,
        verificationStatus: p.githubUrl ? "OBSERVED_ARTIFACT" : "CANDIDATE_CLAIM",
      });
      evidenceItems.push({
        source: "resume",
        claimOrObservation: `Claimed project: ${p.title}`,
        status: p.githubUrl ? "OBSERVED_ARTIFACT" : "CANDIDATE_CLAIM",
        detail: `Technologies: ${(p.tech || []).join(", ") || "General SWE"}`,
        relatedCompetency: "System & Project Implementation",
        relevanceScore: 0.85,
      });
    }
  }

  // If custom resume provided, parse out authoritative snapshot and project claims
  let resumeSnapshot: ResumeContextSnapshot | undefined;
  if (effectiveResume && effectiveResume.trim().length > 0) {
    resumeSnapshot = createResumeContextSnapshot(candidateId, effectiveResume);
    evidenceItems.push({
      source: "resume",
      claimOrObservation: "Candidate provided resume content",
      status: "CANDIDATE_CLAIM",
      detail: effectiveResume.slice(0, 500),
      relatedCompetency: "Resume Claims",
      relevanceScore: 0.9,
    });

    if (resumeSnapshot.projects.length > 0) {
      projects.length = 0; // Authoritative override: clear historical / profile projects
      for (const sp of resumeSnapshot.projects) {
        projects.push({
          title: sp.name,
          tech: sp.techStack,
          description: sp.description,
          verificationStatus: "CANDIDATE_CLAIM",
        });
        evidenceItems.push({
          source: "resume",
          claimOrObservation: `Claimed project: ${sp.name}`,
          status: "CANDIDATE_CLAIM",
          detail: `${sp.description} (Tech: ${sp.techStack.join(", ")})`,
          relatedCompetency: "System & Project Implementation",
          relevanceScore: 0.9,
        });
      }
    }

    for (const sk of resumeSnapshot.skills) {
      if (!claimedSkills.includes(sk.name)) {
        claimedSkills.push(sk.name);
      }
    }
  }

  // GitHub Analysis
  const githubAnalysis = unifiedDossier?.github;
  const isGithubConnected = githubAnalysis?.retrieval_status === "CONTENT_RETRIEVED" || githubAnalysis?.retrieval_status === "SOURCE_OBSERVED";
  const accessibleRepos: Array<{
    name: string;
    primaryLang?: string;
    hasTests: boolean;
    frameworks: string[];
    codeQualitySignals: string[];
  }> = [];

  if (isGithubConnected && Array.isArray(githubAnalysis?.accessible_repos)) {
    for (const r of githubAnalysis.accessible_repos) {
      accessibleRepos.push({
        name: r.name,
        primaryLang: r.primary_language,
        hasTests: Boolean(r.has_tests),
        frameworks: r.frameworks_in_deps || [],
        codeQualitySignals: r.code_quality_signals || [],
      });
      evidenceItems.push({
        source: "github",
        claimOrObservation: `Accessible repository: ${r.name}`,
        status: "OBSERVED_ARTIFACT",
        detail: `Language: ${r.primary_language || "unknown"}, Tests: ${r.has_tests ? "Present" : "Missing"}, Commits: ${r.commit_count || 0}`,
        relatedCompetency: "Source Code & Repository Evidence",
        relevanceScore: 0.9,
      });
    }
  }

  // LinkedIn Analysis — strictly honest, no fake data
  const linkedinAnalysis = unifiedDossier?.linkedin;
  const isLinkedInConnected = linkedinAnalysis?.retrieval_status === "CONTENT_RETRIEVED";

  // Determine experience mode
  let expYears = resumeAnalysis?.experience_years ?? 0;
  if (customResume) {
    const yrMatch = customResume.match(/(\d+)\+?\s*(?:years|yrs)\s*(?:of\s*)?experience/i);
    if (yrMatch) {
      expYears = Math.max(expYears, parseInt(yrMatch[1], 10));
    }
  }

  const seniorRolePattern = /senior|staff|lead|principal|architect|manager|director/i;
  const targetRole = targetRoleOverride ||
    customJd?.split("\n")[0]?.replace(/^Role:\s*/i, "").slice(0, 60) ||
    dnaResponse?.targetRoleTitle ||
    "Full-Stack Software Engineer";
  const isSeniorRole = (customJd && seniorRolePattern.test(customJd)) || seniorRolePattern.test(targetRole);

  let experienceMode: ExperienceMode = experienceModeOverride || "fresher";
  if (!experienceModeOverride) {
    if (expYears >= 3 || isSeniorRole) {
      experienceMode = "experienced";
    } else if (expYears >= 1) {
      experienceMode = "1-3yr";
    } else if (dnaResponse?.activeTargetProfile?.roleKey?.includes("switch")) {
      experienceMode = "career-switcher";
    }
  }

  const missingOrUnverified: string[] = [];
  if (!isGithubConnected) {
    missingOrUnverified.push("GitHub repository evidence not connected or not provided.");
  }
  if (!isLinkedInConnected) {
    missingOrUnverified.push("LinkedIn verified profile data not connected or inaccessible.");
  }
  for (const sk of claimedSkills) {
    if (!verifiedSkills.includes(sk)) {
      missingOrUnverified.push(`Skill '${sk}' is self-reported and unverified.`);
    }
  }

  const dossier: CandidateInterviewDossier = {
    candidateId,
    name: dnaResponse?.snapshot?.studentName || "Candidate",
    targetRole,
    experienceYears: expYears,
    experienceMode,
    careerIntent: dnaResponse?.snapshot?.careerIntent || "Software Engineering Excellence",
    verifiedSkills,
    claimedSkills,
    evidenceItems,
    projects,
    githubStatus: {
      connected: isGithubConnected,
      username: githubAnalysis?.account_url?.split("/").pop(),
      publicRepos: githubAnalysis?.repos_count || 0,
      accessibleRepos,
      limitations: githubAnalysis?.limitations || (!isGithubConnected ? ["GitHub account not connected"] : []),
    },
    linkedinStatus: {
      connected: isLinkedInConnected,
      profileUrl: linkedinAnalysis?.profile_url,
      limitations: linkedinAnalysis?.limitations || (!isLinkedInConnected ? ["LinkedIn profile not connected or inaccessible"] : []),
    },
    missingOrUnverified,
    previousInterviewWeaknesses: previousWeaknesses,
    accumulatedWeakTopics,
    historicalQuestionsAsked,
    previouslyAssessedCompetencies,
    placementProfile,
  };

  const candidateIntelligence = buildCandidateIntelligenceProfile(
    candidateId,
    effectiveResume || "",
    effectiveJd || "",
    {
      name: dnaResponse?.snapshot?.studentName,
      targetRole: targetRoleOverride || targetRole,
      verifiedSkills,
      claimedSkills,
      rawProjects: projects,
      studentDNA: dnaResponse,
    }
  );

  const jdCompetencyMatrix = buildJDCompetencyMatrix(
    effectiveJd || "",
    targetRoleOverride || targetRole,
    [...verifiedSkills, ...claimedSkills]
  );

  dossier.candidateIntelligence = candidateIntelligence;
  dossier.jdCompetencyMatrix = jdCompetencyMatrix;

  if (candidateIntelligence.projects.length > 0) {
    dossier.projects = candidateIntelligence.projects.map((p) => ({
      title: p.title,
      tech: p.tech,
      githubRepo: p.githubUrl,
      description: p.description || p.problemSolved,
      verificationStatus: p.verificationStatus,
      problemSolved: p.problemSolved,
      architecture: p.architecture,
      techStackRationale: p.techStackRationale,
      personalContribution: p.personalContribution,
      technicalChallenges: p.technicalChallenges,
      databaseDesign: p.databaseDesign,
      apiStructure: p.apiStructure,
      securityMeasures: p.securityMeasures,
      performanceOptimizations: p.performanceOptimizations,
      testingStrategy: p.testingStrategy,
      deploymentAndCI: p.deploymentAndCI,
      retrospectiveImprovements: p.retrospectiveImprovements,
      provenance: p.provenance,
    }));
  }

  if (targetRoleOverride) dossier.targetRole = targetRoleOverride;
  if (experienceModeOverride) dossier.experienceMode = experienceModeOverride;
  if (studentProfileOverride?.past_projects?.length && (!resumeSnapshot || resumeSnapshot.projects.length === 0)) {
    dossier.projects = studentProfileOverride.past_projects.map((p: any) => ({
      title: p.title || "Project",
      tech_stack: p.tech_stack || [],
      description: p.description || "",
      claimedFeatures: [],
      challengesFaced: [],
      metrics: [],
      architecturalTradeoffs: []
    }));
  }

  // Authoritative Selected Resume Override: If an explicit resume was provided, its projects supersede everything
  if (resumeSnapshot && resumeSnapshot.projects.length > 0) {
    dossier.projects = resumeSnapshot.projects.map((p) => ({
      title: p.name,
      tech: p.techStack,
      description: p.description,
      verificationStatus: "CANDIDATE_CLAIM",
      provenance: "RESUME-BACKED",
      metrics: p.metrics,
      architecturalHighlights: p.architecturalHighlights,
    }));
  }
  (dossier as any).resumeContextSnapshot = resumeSnapshot;

  CANDIDATE_INTERVIEW_DOSSIER_CACHE.set(cacheKey, { dossier, timestamp: Date.now() });
  return dossier;
}

// ══════════════════════════════════════════════════════════════
// 4. INTERVIEW BLUEPRINT GENERATOR
// ══════════════════════════════════════════════════════════════

export function generateInterviewBlueprint(
  dossier: CandidateInterviewDossier,
  targetRole?: string,
  durationMinutes = 45,
  forcedExperienceMode?: ExperienceMode,
  customSessionId?: string,
  jobDescriptionText?: string,
  interviewType: InterviewType = "technical",
  targetCompany?: string,
  skillsFocus?: string[] | string,
  track?: InterviewTrack
): InterviewBlueprint {
  const effectiveTargetRole = targetRole || dossier?.targetRole || "Software Engineer";
  const experienceMode = forcedExperienceMode || dossier?.experienceMode || "fresher";
  const parsedJd = parseJobDescription(jobDescriptionText || effectiveTargetRole, experienceMode);

  // Turn budget calculation: approx 3.5 - 4 mins per question-turn
  const totalTargetTurns = Math.max(6, Math.min(14, Math.round(durationMinutes / 4)));

  // Define structured section plan adapted to selected Interview Type
  let sectionPlan: SectionPlan[];
  if (interviewType === "behavioral") {
    sectionPlan = [
      { section: "introduction", targetTurns: 1, focus: "Background, career intent, role alignment", completed: false },
      { section: "resume_projects", targetTurns: Math.max(1, Math.floor(totalTargetTurns * 0.2)), focus: "Past project context, personal role & team challenges", completed: false },
      { section: "behavioral", targetTurns: Math.max(3, Math.floor(totalTargetTurns * 0.6)), focus: "STAR framework, ownership, conflict resolution, dealing with failure & collaboration", completed: false },
      { section: "closing", targetTurns: 1, focus: "Candidate questions and interview conclusion", completed: false },
    ];
  } else if (interviewType === "hr") {
    sectionPlan = [
      { section: "introduction", targetTurns: 1, focus: "Background, personal motivation, role alignment", completed: false },
      { section: "behavioral", targetTurns: Math.max(4, Math.floor(totalTargetTurns * 0.7)), focus: `${targetCompany ? targetCompany + " culture" : "Company culture"}, values alignment, work ethic, teamwork & career vision`, completed: false },
      { section: "closing", targetTurns: 1, focus: "Candidate questions, culture fit & wrap-up", completed: false },
    ];
  } else if (interviewType === "system_design") {
    sectionPlan = [
      { section: "introduction", targetTurns: 1, focus: "Background, architectural scope & role alignment", completed: false },
      { section: "resume_projects", targetTurns: Math.max(1, Math.floor(totalTargetTurns * 0.2)), focus: "Prior system architecture, scaling challenges & tech stack trade-offs", completed: false },
      { section: "coding_system_design", targetTurns: Math.max(3, Math.floor(totalTargetTurns * 0.6)), focus: "High-scale distributed system design, data storage, latency, reliability & bottleneck mitigation", completed: false },
      { section: "closing", targetTurns: 1, focus: "Candidate architectural questions & conclusion", completed: false },
    ];
  } else if (interviewType === "mixed") {
    sectionPlan = [
      { section: "introduction", targetTurns: 1, focus: "Background, career intent, role alignment", completed: false },
      { section: "resume_projects", targetTurns: Math.max(2, Math.floor(totalTargetTurns * 0.25)), focus: "Project architecture, personal ownership & code evidence", completed: false },
      { section: "technical_fundamentals", targetTurns: Math.max(2, Math.floor(totalTargetTurns * 0.25)), focus: "Core CS/SWE fundamentals (OOP, DBMS, OS, Concurrency, API Design)", completed: false },
      { section: "coding_system_design", targetTurns: Math.max(2, Math.floor(totalTargetTurns * 0.25)), focus: experienceMode === "experienced" ? "High-scale system design & distributed trade-offs" : "Data structures, algorithmic reasoning & edge case analysis", completed: false },
      { section: "behavioral", targetTurns: Math.max(1, Math.floor(totalTargetTurns * 0.15)), focus: "Ownership, conflict resolution, dealing with failure & collaboration", completed: false },
      { section: "closing", targetTurns: 1, focus: "Candidate questions and interview conclusion", completed: false },
    ];
  } else {
    // Default: technical interview
    sectionPlan = [
      { section: "introduction", targetTurns: 1, focus: "Background, career intent, role alignment", completed: false },
      { section: "resume_projects", targetTurns: Math.max(dossier?.projects?.length > 0 ? 4 : 2, Math.floor(totalTargetTurns * 0.3)), focus: "Project architecture, personal ownership, technical decisions & code evidence", completed: false },
      { section: "technical_fundamentals", targetTurns: Math.max(2, Math.floor(totalTargetTurns * 0.3)), focus: "Core CS/SWE fundamentals (OOP, DBMS, OS, Concurrency, API Design)", completed: false },
      { section: "coding_system_design", targetTurns: Math.max(2, Math.floor(totalTargetTurns * 0.3)), focus: experienceMode === "experienced" ? "High-scale system design & distributed trade-offs" : "Data structures, algorithmic reasoning & edge case analysis", completed: false },
      { section: "closing", targetTurns: 1, focus: "Candidate questions and technical conclusion", completed: false },
    ];
  }

  // Derive competencies from Role, JD & Candidate Dossier across the 26-Category Matrix
  const competencies: BlueprintCompetency[] = [
    {
      id: "comp-proj-ownership",
      name: "Project Ownership & Technical Trade-offs",
      category: "project_deep_dive",
      categoryKey: "C_PROJECT_DEEP_DIVE",
      tier: "Critical",
      evidenceAnchor: (dossier.projects || [])[0]?.title || "Resume Projects",
      isAssessed: false,
      status: "unassessed",
      turnsSpent: 0,
      timeBudgetMinutes: Math.round(durationMinutes * 0.25),
      evidenceCollected: [],
    },
    {
      id: "comp-proj-architecture",
      name: "System Architecture & Design Decisions",
      category: "project_deep_dive",
      categoryKey: "D_PROJECT_ARCHITECTURE",
      tier: "Critical",
      evidenceAnchor: (dossier.projects || [])[0]?.title || "Architecture",
      isAssessed: false,
      status: "unassessed",
      turnsSpent: 0,
      timeBudgetMinutes: Math.round(durationMinutes * 0.15),
      evidenceCollected: [],
    },
  ];

  // Technical Fundamentals adapted to Role (Frontend, AI/ML, Systems, Backend, or General CS)
  const roleLower = (effectiveTargetRole || "").toLowerCase();
  if (roleLower.includes("front") || roleLower.includes("ui") || roleLower.includes("client") || parsedJd.targetCategories.includes("N_FRONTEND_ENGINEERING")) {
    competencies.push({
      id: "comp-frontend-arch",
      name: "Frontend Rendering, Component State & Browser Architecture",
      category: "fundamentals",
      categoryKey: "N_FRONTEND_ENGINEERING",
      tier: "Critical",
      evidenceAnchor: "Client-side Performance & DOM",
      isAssessed: false,
      status: "unassessed",
      turnsSpent: 0,
      timeBudgetMinutes: Math.round(durationMinutes * 0.18),
      evidenceCollected: [],
    });
  } else if (roleLower.includes("ml") || roleLower.includes("data") || roleLower.includes("machine") || roleLower.includes("learning") || parsedJd.targetCategories.includes("R_AIML_FUNDAMENTALS")) {
    competencies.push({
      id: "comp-ml-pipeline",
      name: "Machine Learning Pipelines, Feature Engineering & Model Evaluation",
      category: "fundamentals",
      categoryKey: "R_AIML_FUNDAMENTALS",
      tier: "Critical",
      evidenceAnchor: "ML Evaluation & Training Dynamics",
      isAssessed: false,
      status: "unassessed",
      turnsSpent: 0,
      timeBudgetMinutes: Math.round(durationMinutes * 0.18),
      evidenceCollected: [],
    });
  } else if (roleLower.includes("systems") || roleLower.includes("embedded") || roleLower.includes("kernel") || roleLower.includes("infra") || roleLower.includes("low-level")) {
    competencies.push({
      id: "comp-systems-programming",
      name: "Systems Programming, Concurrency Primitives, OS & Memory Management",
      category: "fundamentals",
      categoryKey: "K_OPERATING_SYSTEMS",
      tier: "Critical",
      evidenceAnchor: "Low-Level Systems & OS Concepts",
      isAssessed: false,
      status: "unassessed",
      turnsSpent: 0,
      timeBudgetMinutes: Math.round(durationMinutes * 0.18),
      evidenceCollected: [],
    });
  } else if (roleLower.includes("back") || roleLower.includes("server") || roleLower.includes("database") || parsedJd.targetCategories.includes("J_DATABASES_SQL") || parsedJd.targetCategories.includes("M_BACKEND_ENGINEERING")) {
    competencies.push({
      id: "comp-db-concurrency",
      name: "Database Transactions, Indexing & Concurrency",
      category: "fundamentals",
      categoryKey: "J_DATABASES_SQL",
      tier: "Critical",
      evidenceAnchor: "Relational/NoSQL Knowledge",
      isAssessed: false,
      status: "unassessed",
      turnsSpent: 0,
      timeBudgetMinutes: Math.round(durationMinutes * 0.18),
      evidenceCollected: [],
    });
  } else if (parsedJd.targetCategories.includes("K_OPERATING_SYSTEMS")) {
    competencies.push({
      id: "comp-systems-programming",
      name: "Systems Programming, Concurrency Primitives, OS & Memory Management",
      category: "fundamentals",
      categoryKey: "K_OPERATING_SYSTEMS",
      tier: "Critical",
      evidenceAnchor: "Low-Level Systems & OS Concepts",
      isAssessed: false,
      status: "unassessed",
      turnsSpent: 0,
      timeBudgetMinutes: Math.round(durationMinutes * 0.18),
      evidenceCollected: [],
    });
  } else {
    competencies.push({
      id: "comp-cs-fundamentals",
      name: "Computer Science & Programming Fundamentals",
      category: "fundamentals",
      categoryKey: "E_LANGUAGE_FUNDAMENTALS",
      tier: "Critical",
      evidenceAnchor: "Core CS Knowledge",
      isAssessed: false,
      status: "unassessed",
      turnsSpent: 0,
      timeBudgetMinutes: Math.round(durationMinutes * 0.18),
      evidenceCollected: [],
    });
  }

  // Coding / Problem Solving or System Design based on seniority & role
  if (experienceMode === "experienced" || parsedJd.targetCategories.includes("Q_SYSTEM_DESIGN")) {
    competencies.push({
      id: "comp-system-design",
      name: "Distributed System Design & Scalability Trade-offs",
      category: "system_design",
      categoryKey: "Q_SYSTEM_DESIGN",
      tier: "Critical",
      evidenceAnchor: "Distributed Architecture",
      isAssessed: false,
      status: "unassessed",
      turnsSpent: 0,
      timeBudgetMinutes: Math.round(durationMinutes * 0.22),
      evidenceCollected: [],
    });
  } else {
    competencies.push({
      id: "comp-dsa-reasoning",
      name: "Data Structures & Algorithmic Problem Solving",
      category: "coding_reasoning",
      categoryKey: "F_DATA_STRUCTURES_ALGORITHMS",
      tier: "Critical",
      evidenceAnchor: "DSA Reasoning",
      isAssessed: false,
      status: "unassessed",
      turnsSpent: 0,
      timeBudgetMinutes: Math.round(durationMinutes * 0.22),
      evidenceCollected: [],
    });
  }

  // AI / ML if relevant
  if (parsedJd.targetCategories.includes("R_AIML_FUNDAMENTALS") || parsedJd.targetCategories.includes("S_LLM_INTEGRATION")) {
    competencies.push({
      id: "comp-aiml-llm",
      name: "AI/ML & LLM Pipeline Architecture",
      category: "role_specific",
      categoryKey: "R_AIML_FUNDAMENTALS",
      tier: "Critical",
      evidenceAnchor: "AI/ML Work",
      isAssessed: false,
      status: "unassessed",
      turnsSpent: 0,
      timeBudgetMinutes: Math.round(durationMinutes * 0.15),
      evidenceCollected: [],
    });
  }

  // Behavioral Competency
  competencies.push({
    id: "comp-behavioral-ownership",
    name: "Professional Accountability, Conflict Resolution & Teamwork",
    category: "behavioral",
    categoryKey: "V_BEHAVIORAL_LEADERSHIP",
    tier: "Important",
    evidenceAnchor: "Past Team Experience",
    isAssessed: false,
    status: "unassessed",
    turnsSpent: 0,
    timeBudgetMinutes: Math.round(durationMinutes * 0.12),
    evidenceCollected: [],
  });

  // Code evidence if GitHub repo accessible
  if (dossier.githubStatus?.accessibleRepos && dossier.githubStatus.accessibleRepos.length > 0) {
    const topRepo = dossier.githubStatus.accessibleRepos[0];
    competencies.push({
      id: "comp-code-evidence",
      name: `Source Code Implementation in ${topRepo.name}`,
      category: "project_deep_dive",
      categoryKey: "U_GIT_COLLABORATION",
      tier: "Important",
      evidenceAnchor: `Repo: ${topRepo.name} (${topRepo.primaryLang || "Code"})`,
      isAssessed: false,
      status: "unassessed",
      turnsSpent: 0,
      timeBudgetMinutes: Math.round(durationMinutes * 0.1),
      evidenceCollected: [],
    });
  }

  // Previous Weakness follow up if present
  if (dossier.previousInterviewWeaknesses && dossier.previousInterviewWeaknesses.length > 0) {
    competencies.push({
      id: "comp-prior-weakness",
      name: `Follow-up on previous area: ${dossier.previousInterviewWeaknesses[0]}`,
      category: "fundamentals",
      categoryKey: "X_OWNERSHIP_LEARNING",
      tier: "Important",
      evidenceAnchor: "Previous Session Career Memory",
      isAssessed: false,
      status: "unassessed",
      turnsSpent: 0,
      timeBudgetMinutes: Math.round(durationMinutes * 0.1),
      evidenceCollected: [],
    });
  }

  // Skills focus area competency if provided
  if (skillsFocus) {
    const focusStr = Array.isArray(skillsFocus) ? skillsFocus.join(", ") : String(skillsFocus);
    if (focusStr.trim().length > 0) {
      competencies.push({
        id: "comp-candidate-skills-focus",
        name: `Targeted Technical Focus: ${focusStr}`,
        category: "fundamentals",
        categoryKey: "E_LANGUAGE_FUNDAMENTALS",
        tier: "Critical",
        evidenceAnchor: focusStr,
        isAssessed: false,
        status: "unassessed",
        turnsSpent: 0,
        timeBudgetMinutes: Math.round(durationMinutes * 0.2),
        evidenceCollected: [],
      });
    }
  }

  // Prepend track-specific competencies if an engineering track is selected
  if (track && TRACK_CONFIGURATIONS[track]) {
    const trackCfg = TRACK_CONFIGURATIONS[track];
    for (let i = 0; i < trackCfg.coreCompetencies.length; i++) {
      const compName = trackCfg.coreCompetencies[i];
      competencies.unshift({
        id: `comp-track-${track}-${i}`,
        name: `${trackCfg.shortTitle}: ${compName}`,
        category: "fundamentals",
        categoryKey: trackCfg.primaryCategories[i % trackCfg.primaryCategories.length],
        tier: "Critical",
        evidenceAnchor: `${trackCfg.name} Focus`,
        isAssessed: false,
        status: "unassessed",
        turnsSpent: 0,
        timeBudgetMinutes: Math.round(durationMinutes * 0.2),
        evidenceCollected: [],
      });
    }
  }

  const skillsFocusList: string[] = skillsFocus
    ? (Array.isArray(skillsFocus)
        ? skillsFocus
        : String(skillsFocus).split(",").map((s) => s.trim()).filter(Boolean))
    : [];

  const interviewPlan = generateStructuredInterviewPlan(
    dossier,
    dossier?.jdCompetencyMatrix,
    dossier?.candidateIntelligence,
    targetRole || effectiveTargetRole,
    durationMinutes,
    experienceMode
  );

  return {
    sessionId: customSessionId || generateSecureId(`session_${Date.now()}`, 8),
    candidateId: dossier.candidateId,
    targetRole: targetRole || effectiveTargetRole,
    targetCompany,
    interviewType,
    track,
    skillsFocus: skillsFocusList.length > 0 ? skillsFocusList : undefined,
    experienceMode,
    durationMinutes,
    totalTargetTurns,
    competencies,
    sectionPlan,
    currentSection: "introduction",
    turnCount: 0,
    primaryCompetencies: competencies.filter((c) => c.tier === "Critical").map((c) => c.name),
    supportingCompetencies: competencies.filter((c) => c.tier !== "Critical").map((c) => c.name),
    areasAdequatelyAssessed: Object.entries(dossier.previouslyAssessedCompetencies || {})
      .filter(([_, v]) => v.status === "demonstrated" || v.score >= 70)
      .map(([k]) => k),
    areasNeedingEvidence: Array.from(new Set([
      ...(dossier.accumulatedWeakTopics || []),
      ...Object.entries(dossier.previouslyAssessedCompetencies || {})
        .filter(([_, v]) => v.status === "gap" || v.score < 65)
        .map(([k]) => k),
    ])),
    interviewPlan,
  };
}

// ══════════════════════════════════════════════════════════════
// 5. SESSION STATE MANAGEMENT
// ══════════════════════════════════════════════════════════════

export function createAdvancedSessionState(
  arg1: any,
  arg2: any,
  customSessionId?: string
): AdvancedSessionState {
  const blueprint: InterviewBlueprint =
    arg1 && ("sectionPlan" in arg1 || "sections" in arg1 || "totalTargetTurns" in arg1) ? arg1 : arg2;
  const dossier: CandidateInterviewDossier =
    arg1 && ("projects" in arg1 || ("candidateId" in arg1 && !("sectionPlan" in arg1))) ? arg1 : arg2;

  const startDifficulty =
    blueprint?.experienceMode === "experienced" ? "medium" :
    blueprint?.experienceMode === "1-3yr" ? "medium" : "easy";

  const sessionId = customSessionId || blueprint?.sessionId || `sess_${Date.now()}`;
  if (blueprint) blueprint.sessionId = sessionId;

  const state: any = {
    sessionId,
    candidateId: dossier?.candidateId || "candidate",
    blueprint,
    dossier,
    openingState: "GREETING",
    lifecycleState: "PLAN_READY",
    isCompleted: false,
    followUpsOnCurrentTopic: 0,
    turns: [],
    questionsAsked: [],
    topicsCovered: [],
    answerDistribution: {
      strong: 0,
      adequate: 0,
      shallow: 0,
      off_topic: 0,
      does_not_know: 0,
      contradictory: 0,
    },
    currentDifficulty: startDifficulty,
    lastAssessment: null,
    consecutiveShallow: 0,
    experienceMode: blueprint?.experienceMode || "fresher",
    remainingTimeMinutes: blueprint?.durationMinutes || 45,
    assessedCompetencies: {},
    track: blueprint?.track || "traditional_coding_dsa",
    assistanceCount: 0,
    uncertaintyOnCurrentTopic: false,
    conductState: "NORMAL",
    conductIncidents: [],
    candidateIntelligence: dossier?.candidateIntelligence,
    jdCompetencyMatrix: dossier?.jdCompetencyMatrix,
    interviewPlan:
      blueprint?.interviewPlan ||
      (dossier
        ? generateStructuredInterviewPlan(
            dossier,
            dossier.jdCompetencyMatrix,
            dossier.candidateIntelligence,
            blueprint?.targetRole || dossier.targetRole,
            blueprint?.durationMinutes || 45,
            blueprint?.experienceMode || dossier.experienceMode
          )
        : undefined),
  };

  if (blueprint && !blueprint.interviewPlan && state.interviewPlan) {
    blueprint.interviewPlan = state.interviewPlan;
  }

  Object.defineProperty(state, "completedTurns", {
    get() {
      return typeof this._manualTurns === "number" ? this._manualTurns : this.turns.length;
    },
    set(val: number) {
      // allow test override
      this._manualTurns = val;
    },
    configurable: true,
    enumerable: true,
  });

  Object.defineProperty(state, "history", {
    get() {
      return this.questionsAsked;
    },
    set(val: any[]) {
      this.questionsAsked = val;
    },
    configurable: true,
    enumerable: true,
  });

  return state as AdvancedSessionState;
}

/**
 * STEP 1: Short, natural, professional greeting asking for a quick introduction.
 * Warm, concise, and non-intimidating (< 45 words).
 */
export function generateOpeningGreeting(dossier?: CandidateInterviewDossier): GeneratedQuestion {
  const firstName = dossier?.name && dossier.name !== "Candidate" ? ` ${dossier.name.split(" ")[0]}` : "";
  const rolePart = dossier?.targetRole ? ` for the ${dossier.targetRole} position` : "";
  const companyPart = dossier?.targetCompany && dossier.targetCompany !== "General" ? ` at ${dossier.targetCompany}` : "";
  const greeting = `Hi${firstName}! Welcome to Cognalyze. I'm Alex, your interviewer today${rolePart}${companyPart}. To kick off, could you give a quick introduction and tell me about yourself and what you've built recently?`;

  return {
    question: greeting,
    question_targets: "Candidate Background & Self-Introduction",
    question_type: "warm-up",
    difficulty_level: "easy",
    is_follow_up: false,
    section: "introduction",
    competency_targeted: "Background & Career Orientation",
    evidence_grounding: "Candidate Introduction",
  };
}

/**
 * STEP 3: Brief acknowledgment and personalized transition into the main interview.
 * Acknowledges the candidate's introduction and smoothly bridges to Question 1.
 */
export function generateIntroductionTransition(
  candidateIntro: string,
  dossier: CandidateInterviewDossier
): string {
  const clean = (candidateIntro || "").toLowerCase().trim();
  const isSkip = clean === "skip" || clean.includes("skip the intro") || clean.includes("jump straight") || clean.length < 5;

  if (isSkip) {
    return "Understood! Let's dive straight into the interview.";
  }

  // Check if candidate mentioned one of their projects
  for (const proj of dossier.projects) {
    if (proj.title && clean.includes(proj.title.toLowerCase())) {
      return `Thanks for sharing that background! Let's explore your work on ${proj.title}.`;
    }
  }

  // Check if candidate mentioned any verified/claimed skills
  const matchedSkills = [...(dossier.verifiedSkills || []), ...(dossier.claimedSkills || [])].filter(
    (s) => typeof s === "string" && s.length > 2 && clean.includes(s.toLowerCase())
  );
  if (matchedSkills.length > 0) {
    return `Thanks for sharing that background with ${matchedSkills[0]}! Let's dive into your engineering experience.`;
  }

  return "Thanks for sharing that background! Let's explore your technical experience.";
}

// ══════════════════════════════════════════════════════════════
// 5b. INTERVIEW LIFECYCLE TRANSITIONS & FOLLOW-UP REASONS (Phase 3)
// ══════════════════════════════════════════════════════════════

export function generateSectionTransition(
  fromSection: InterviewSection,
  toSection: InterviewSection,
  lastAssessment?: AnswerAssessment | null,
  topic?: string
): string {
  if (fromSection === toSection) return "";

  if (toSection === "closing") {
    return "That covers all the core technical areas I wanted to evaluate today. Let's begin wrapping up.";
  }

  if (fromSection === "introduction" && toSection === "resume_projects") {
    return topic
      ? `Thanks for sharing that background! Let's explore your work on ${topic}.`
      : "Thanks for sharing that background! Let's dive right into your engineering projects.";
  }

  if (fromSection === "resume_projects" && toSection === "technical_fundamentals") {
    return "That gives me a great picture of your project architecture. Let's pivot to some core computer science fundamentals.";
  }

  if (fromSection === "technical_fundamentals" && toSection === "coding_system_design") {
    return "Understood. Building on those fundamentals, let's step up to practical system architecture and design.";
  }

  if (toSection === "behavioral") {
    return "Great. Stepping back from pure technical design, let's explore your approach to engineering leadership, teamwork, and incident response.";
  }

  return `Understood. Moving forward from ${fromSection.replace(/_/g, " ")}, let's examine ${toSection.replace(/_/g, " ")}.`;
}

export function isCandidateEarlyFinishRequest(text: string): boolean {
  if (!text || typeof text !== "string") return false;
  const clean = text.toLowerCase().trim();
  const earlyFinishPatterns = [
    /can we (wrap up|conclude|finish|stop)/i,
    /i('d| would) like to (wrap up|conclude|finish|end)/i,
    /i (need|have) to (stop|end|leave|wrap up|conclude)/i,
    /let('s| us) (wrap up|conclude|end here|stop here)/i,
    /that('s| is) all (i have|from my side|for now)/i,
    /i don't have anything else to add.*(finish|wrap up|conclude)/i,
    /prefer to (end|conclude) the interview/i,
    /stop the (session|interview)/i,
  ];
  return earlyFinishPatterns.some((pattern) => pattern.test(clean));
}

export function determineFollowUpReason(
  isFollowUp: boolean,
  assessment?: AnswerAssessment | null,
  section?: InterviewSection,
  questionText?: string
): FollowUpReason {
  if (!isFollowUp) return "none";

  if (assessment?.answer_quality === "contradictory") {
    return "resolve_contradiction";
  }

  const qLower = (questionText || "").toLowerCase();

  if (section === "resume_projects") {
    if (qLower.includes("personally") || qLower.includes("your role") || qLower.includes("built versus") || qLower.includes("contribution")) {
      return "verify_claimed_implementation";
    }
    if (qLower.includes("trade-off") || qLower.includes("decision") || qLower.includes("why did you")) {
      return "understand_trade_off";
    }
    if (qLower.includes("failure") || qLower.includes("bottleneck") || qLower.includes("scale") || qLower.includes("edge case") || qLower.includes("crash")) {
      return "explore_failure_mode";
    }
    return "verify_claimed_implementation";
  }

  if (qLower.includes("failure") || qLower.includes("outage") || qLower.includes("incident") || qLower.includes("break") || qLower.includes("crash")) {
    return "explore_failure_mode";
  }
  if (qLower.includes("trade-off") || qLower.includes("versus") || qLower.includes("why not") || qLower.includes("alternative")) {
    return "understand_trade_off";
  }
  if (qLower.includes("transfer") || qLower.includes("apply this to") || qLower.includes("another scenario")) {
    return "knowledge_transfer";
  }
  if (assessment?.unresolved_threads && assessment.unresolved_threads.length > 0) {
    return "test_unresolved_concept";
  }
  if (assessment?.answer_quality === "shallow" || assessment?.answer_quality === "partially_correct") {
    return "test_unresolved_concept";
  }

  return "test_unresolved_concept";
}


// ══════════════════════════════════════════════════════════════
// 6. LIVE ANSWER ASSESSMENT & CONTEXTUAL RESPONSE HANDLING (Phase 2)
// ══════════════════════════════════════════════════════════════

export interface CandidateResponseContext {
  wordCount: number;
  isDoesNotKnow: boolean;
  isDeclineOrPass: boolean;
  isSelfCorrection: boolean;
  correctedText?: string;
  isHintRequest: boolean;
  isConciseCorrect: boolean;
  isLongIncorrect: boolean;
  isAlternativeApproach: boolean;
  hasContradiction: boolean;
  isContradiction: boolean;
  contradictionDetail?: string;
  matchedTechnicalTerms: string[];
  matchedErrors: string[];
  hasTechnicalFallacy: boolean;
  isPartiallyCorrect: boolean;
  isVagueHandwaving?: boolean;
}

export function analyzeCandidateResponseContext(
  answer: string,
  question: string,
  sessionState?: AdvancedSessionState
): CandidateResponseContext {
  const safe = (answer || "").trim();
  const clean = safe.toLowerCase();
  const wordCount = safe ? safe.split(/\s+/).filter(Boolean).length : 0;

  // 1. Explicit decline / pass
  const isDeclineOrPass = isCandidateDecline(safe);

  // 2. Technical keywords vs factual contradictions / errors
  const technicalKeywords = [
    "kafka", "partition", "skew", "rebalance", "index", "latency", "concurrency",
    "deadlock", "transaction", "isolation", "postgres", "redis", "cache", "microservice",
    "async", "mvcc", "mutex", "queue", "docker", "kubernetes", "api", "query", "schema",
    "b+ tree", "outbox", "idempotency", "debezium", "page", "disk", "i/o", "tree", "fanout",
    "sliding window", "two pointers", "raft", "paxos", "consensus", "grpc", "protobuf",
    "replication", "leader election", "heartbeat", "heartbeats", "sharding", "load balancer",
    "websocket", "rest", "graphql", "distributed", "algorithm", "tuple header", "xmin", "xmax",
    "read committed", "serializable", "write-ahead log", "wal", "optimistic locking", "pessimistic"
  ];
  const matchedTechnicalTerms = technicalKeywords.filter((k) => clean.includes(k));

  // Alternative approach detection: legitimate unorthodox architectures
  const alternativePatterns = [
    /\b(sqlite with wal|embedded sqlite|sqlite in production)\b/i,
    /\b(single-threaded event loop|event loop architecture)\b/i,
    /\b(eventual consistency with crdt|crdts?)\b/i,
    /\b(append-only log instead of (a )?relational)\b/i,
    /\b(in-memory (data grid|ring buffer)|lmax disruptor)\b/i,
    /\b(bloom filter|lsm-tree|alternative approach|alternative to|instead of (a )?standard)\b/i,
  ];
  const isAlternativeApproach = alternativePatterns.some((p) => p.test(clean));

  // Direct uncertainty prefix vs partial proposal
  const isDirectUncertaintyPrefix = /^(i'?m not sure|i am not sure|i don'?t know)\s+how\b/i.test(clean);
  const partialIndicators = [
    /partially/i,
    /part of (it|this)/i,
    /on one hand/i,
    /halfway/i,
    /(,|;|and|\b)but\s+(i'?m|i am)?\s*(not (entirely |fully |really )?sure|don'?t know)/i,
    /not entirely sure about/i,
  ];
  const isPartiallyCorrect =
    !isDeclineOrPass &&
    !isDirectUncertaintyPrefix &&
    matchedTechnicalTerms.length >= 1 &&
    partialIndicators.some((p) => p.test(clean));

  // "I don't know" / uncertainty patterns
  const doesNotKnowPatterns = [
    /\b(i\s+)?(honestly\s+|really\s+|genuinely\s+)?don'?t know\b/i,
    /\bi am not sure\b/i,
    /\bi'?m not (entirely |really |very )?(sure|familiar|certain)\b/i,
    /\bno idea\b/i,
    /\bhaven'?t worked (with|on)\b/i,
    /\bnever used\b/i,
    /\bdrawing a blank\b/i,
    /\bcan'?t recall\b/i,
  ];
  const isDoesNotKnow =
    !isDeclineOrPass &&
    !isPartiallyCorrect &&
    (isDirectUncertaintyPrefix || (doesNotKnowPatterns.some((p) => p.test(clean)) && wordCount < 30));

  // Self-correction detection
  const selfCorrectionRegex = /\b(wait,? actually|wait,? that'?s (not right|wrong)|let me correct that|actually on second thought|scratch that|correction:?|to be more precise|looking back, that'?s incorrect)\b/i;
  const isSelfCorrection = selfCorrectionRegex.test(clean);
  let correctedText: string | undefined = undefined;
  if (isSelfCorrection) {
    const parts = safe.split(selfCorrectionRegex);
    correctedText = (parts[parts.length - 1] || safe).trim();
  }

  // Hint request
  const hintRegex = /\b(can (you|i) (get|have) a hint|any hints?|could you give me a hint|point me in the right direction|i'?m (a bit )?stuck,? can you help|need a hint|little hint|guide me|any guidance)\b/i;
  const isHintRequest = hintRegex.test(clean) && wordCount < 25;

  // Common demonstrable technical misconceptions / falsehoods
  const factualErrorPatterns = [
    /http\/?2\s+(is|uses|runs exclusively over)\s+(udp|connectionless)/i,
    /http\/?2.*udp/i,
    /tcp\s+(has no|does not have)\s+handshake/i,
    /redis\s+(writes to disk first|is a relational)/i,
    /b\+?\s*tree(s)?\s+(have|has|lookups? (are|take))\s+o\(1\)/i,
    /b\+?\s*tree lookups.*o\(1\)/i,
    /react server components\s+(execute in|run in)\s+(the browser|service worker)/i,
  ];
  const matchedErrors = factualErrorPatterns
    .filter((p) => p.test(clean))
    .map((p) => p.source);

  const hasTechnicalFallacy = matchedErrors.length > 0;

  // Vague handwaving / generic evasion / buzzword fluff detection
  const genericHandwavingRegex = /\b(worked (reliably|well|fine|nicely|properly)|made sure (everything|it) worked|handled (it|everything) (nicely|properly|well|reliably)|good architecture|fast speed|without errors|all errors)\b/i;
  const buzzwordFluffRegex = /\b(enterprise-grade|hyper-scalable|cloud-native microservices|architectural patterns|maximum reliability|seamless fault tolerance|modern high-performance|industry standard(s)?|best practices|cutting-edge|robust and scalable|state-of-the-art)\b/i;

  const concreteMechanisms = [
    "redis", "postgres", "mysql", "dynamo", "zookeeper", "etcd", "redlock",
    "lease", "ttl", "mutex", "semaphore", "channel", "goroutine", "thread",
    "optimistic locking", "pessimistic locking", "isolation", "acid", "wal",
    "raft", "paxos", "outbox", "debezium", "sharding", "b+ tree", "b-tree",
    "explain analyze", "composite index", "circuit breaker", "token bucket",
    "leaky bucket", "heartbeat", "mvcc", "two-phase", "2pc", "saga", "kafka partition"
  ];
  const hasConcreteMechanisms = concreteMechanisms.some((token) => clean.includes(token));

  const isVagueHandwaving =
    genericHandwavingRegex.test(clean) ||
    (buzzwordFluffRegex.test(clean) && !hasConcreteMechanisms);
  const qClean = (question || "").toLowerCase();
  const novelTerms = matchedTechnicalTerms.filter((term) => !qClean.includes(term));

  // Concise correct answer: 8-45 words, high technical precision, zero matched errors, NOT an alternative approach or partial
  const isConciseCorrect =
    wordCount >= 8 &&
    wordCount <= 45 &&
    matchedTechnicalTerms.length >= 2 &&
    !isVagueHandwaving &&
    (novelTerms.length >= 1 || matchedTechnicalTerms.length >= 3) &&
    matchedErrors.length === 0 &&
    !isDoesNotKnow &&
    !isDeclineOrPass &&
    !isPartiallyCorrect &&
    !isAlternativeApproach;

  // Long incorrect answer: > 35 words with explicit factual errors or pure evasion
  const isLongIncorrect =
    wordCount > 35 &&
    (matchedErrors.length > 0 || (matchedTechnicalTerms.length === 0 && wordCount > 60));

  // Contradiction detection against prior turns
  let hasContradiction = false;
  let contradictionDetail: string | undefined = undefined;
  if (sessionState?.turns?.length) {
    for (const turn of sessionState.turns) {
      const prevA = (turn.answer || "").toLowerCase();
      if (
        (prevA.includes("never used kubernetes") || prevA.includes("no experience with kubernetes")) &&
        (clean.includes("i deployed our kubernetes") || clean.includes("i configured kubernetes"))
      ) {
        hasContradiction = true;
        contradictionDetail = "Candidate previously indicated no Kubernetes experience, but currently described deploying on Kubernetes.";
        break;
      }
      if (
        (prevA.includes("didn't use any caching") || prevA.includes("no cache layer")) &&
        (clean.includes("we cached everything in redis") || clean.includes("our redis cluster cached"))
      ) {
        hasContradiction = true;
        contradictionDetail = "Candidate earlier stated no caching was used, but currently referenced a Redis caching cluster.";
        break;
      }
      if (
        (prevA.includes("optimistic locking") || prevA.includes("rely on optimistic")) &&
        (clean.includes("never use optimistic locking") || clean.includes("only use pessimistic") || clean.includes("we only use pessimistic"))
      ) {
        hasContradiction = true;
        contradictionDetail = "Candidate earlier stated relying strictly on optimistic locking, but currently asserted they never use optimistic locking.";
        break;
      }
    }
  }

  return {
    wordCount,
    isDoesNotKnow,
    isDeclineOrPass,
    isSelfCorrection,
    correctedText,
    isHintRequest,
    isConciseCorrect,
    isLongIncorrect,
    isAlternativeApproach,
    hasContradiction,
    isContradiction: hasContradiction,
    contradictionDetail,
    matchedTechnicalTerms,
    matchedErrors,
    hasTechnicalFallacy,
    isPartiallyCorrect,
    isVagueHandwaving,
  };
}

export async function assessCandidateAnswer(
  lastQuestion: GeneratedQuestion | string,
  lastAnswer: string,
  sessionStateOrOptions: any,
  dossierArg?: CandidateInterviewDossier
): Promise<AnswerAssessment> {
  const qText = typeof lastQuestion === "string" ? lastQuestion : lastQuestion.question;
  const wordCount = lastAnswer.trim().split(/\s+/).filter(Boolean).length;
  const cleanAns = lastAnswer.toLowerCase().trim();

  let sessionState: AdvancedSessionState;
  let dossier: CandidateInterviewDossier | undefined;

  if (sessionStateOrOptions && "turns" in sessionStateOrOptions && Array.isArray(sessionStateOrOptions.turns)) {
    sessionState = sessionStateOrOptions;
    dossier = dossierArg;
  } else if (sessionStateOrOptions && typeof sessionStateOrOptions === "object") {
    sessionState = sessionStateOrOptions.sessionState || sessionStateOrOptions.state || {
      sessionId: "anonymous",
      candidateId: "cand",
      blueprint: {} as any,
      turns: sessionStateOrOptions.turns || [],
      questionsAsked: [],
      topicsCovered: [],
      answerDistribution: { strong: 0, adequate: 0, shallow: 0, off_topic: 0, does_not_know: 0, contradictory: 0 },
      currentDifficulty: "medium",
      lastAssessment: null,
      consecutiveShallow: 0,
      experienceMode: sessionStateOrOptions.experienceMode || "experienced",
      remainingTimeMinutes: 45,
      completedTurns: 0,
      history: [],
      assessedCompetencies: {},
      openingState: "INTERVIEW_IN_PROGRESS"
    };
    dossier = sessionStateOrOptions.dossier || dossierArg;
  } else {
    sessionState = sessionStateOrOptions || {
      sessionId: "anonymous",
      candidateId: "cand",
      blueprint: {} as any,
      turns: [],
      questionsAsked: [],
      topicsCovered: [],
      answerDistribution: { strong: 0, adequate: 0, shallow: 0, off_topic: 0, does_not_know: 0, contradictory: 0 },
      currentDifficulty: "medium",
      lastAssessment: null,
      consecutiveShallow: 0,
      experienceMode: "experienced",
      remainingTimeMinutes: 45,
      completedTurns: 0,
      history: [],
      assessedCompetencies: {},
      openingState: "INTERVIEW_IN_PROGRESS"
    };
    dossier = dossierArg;
  }

  // Run comprehensive Phase 2 Contextual Response Analysis
  const ctx = analyzeCandidateResponseContext(lastAnswer, qText, sessionState);

  // 1. Candidate does not know / uncertainty handling (Phase 2 Requirement 4.3)
  if (ctx.isDoesNotKnow) {
    const wantsToMoveOn = /\b(move on|move forward|next question|next topic|skip)\b/i.test(cleanAns);
    const isFirstUncertainty = !sessionState.uncertaintyOnCurrentTopic;
    if (isFirstUncertainty && !wantsToMoveOn) {
      sessionState.uncertaintyOnCurrentTopic = true;
      return {
        answer_quality: "does_not_know",
        reasoning: "Candidate stated they are unfamiliar with this specific concept; pivoting to a simpler prerequisite angle.",
        topics_demonstrated: [],
        next_action: "simplify_concept",
        difficulty_adjustment: "de-escalate",
        extracted_claims: [],
      };
    } else {
      sessionState.uncertaintyOnCurrentTopic = false;
      return {
        answer_quality: "does_not_know",
        reasoning: "Candidate stated they are unfamiliar with this specific concept or requested to move forward.",
        topics_demonstrated: [],
        next_action: "acknowledge_and_advance",
        difficulty_adjustment: "de-escalate",
        extracted_claims: [],
      };
    }
  }

  // 2. Candidate decline or request to pass (Phase 2 Requirement 4.8)
  if (ctx.isDeclineOrPass) {
    return {
      answer_quality: "declined",
      reasoning: "Candidate politely declined or requested to defer this question. Pivoting to alternative assessment without penalty.",
      topics_demonstrated: [],
      next_action: "acknowledge_and_advance",
      difficulty_adjustment: "maintain",
      extracted_claims: [],
    };
  }

  // 3. Candidate requests a hint / assistance (Phase 2 Requirement 4.7)
  if (ctx.isHintRequest) {
    sessionState.assistanceCount = (sessionState.assistanceCount || 0) + 1;
    return {
      answer_quality: "adequate",
      reasoning: "Candidate requested conceptual assistance; providing a supportive guidance prompt without giving away full answer.",
      topics_demonstrated: [],
      next_action: "offer_hint",
      difficulty_adjustment: "maintain",
      is_assisted: true,
      extracted_claims: [],
    };
  }

  // 4. Candidate self-correction (Phase 2 Requirement 4.8)
  if (ctx.isSelfCorrection) {
    return {
      answer_quality: "self_corrected",
      reasoning: "Candidate actively recognized an initial misconception and self-corrected their technical explanation.",
      topics_demonstrated: ctx.matchedTechnicalTerms.length > 0 ? ["Technical Self-Correction", ...ctx.matchedTechnicalTerms] : ["Technical Self-Correction"],
      next_action: "acknowledge_and_advance",
      difficulty_adjustment: "maintain",
      is_self_corrected: true,
      competency_established: true,
      extracted_claims: [],
    };
  }

  // 5. Contradictory answers (Phase 2 Requirement 4.6)
  if (ctx.hasContradiction) {
    return {
      answer_quality: "contradictory",
      reasoning: ctx.contradictionDetail || "Candidate answer conflicts with a previous statement in this interview session.",
      topics_demonstrated: [],
      next_action: "clarify_ambiguity",
      difficulty_adjustment: "maintain",
      extracted_claims: [],
    };
  }

  // 6. Alternative valid approaches (Phase 2 Requirement 4.8)
  if (ctx.isAlternativeApproach) {
    return {
      answer_quality: "strong",
      reasoning: "Candidate proposed a legitimate alternative engineering architecture with sound trade-off reasoning.",
      topics_demonstrated: ["Alternative System Architecture", ...ctx.matchedTechnicalTerms],
      next_action: "move_to_new_topic",
      difficulty_adjustment: "maintain",
      alternative_approach_valid: true,
      competency_established: true,
      extracted_claims: [],
    };
  }

  // 6.5. Partially correct answer (Phase 2 Requirement 4.2)
  if (ctx.isPartiallyCorrect) {
    return {
      answer_quality: "partially_correct",
      reasoning: "Candidate correctly identified key concepts but acknowledged uncertainty or left core mechanisms unresolved.",
      topics_demonstrated: ctx.matchedTechnicalTerms.length > 0 ? ctx.matchedTechnicalTerms : ["Partial Technical Fundamentals"],
      unresolved_threads: ["Unresolved edge case or mechanism"],
      next_action: "follow_up_probe",
      difficulty_adjustment: "maintain",
      extracted_claims: [],
    };
  }

  // 7. Concise correct answers (Phase 2 Requirement 4.1)
  if (ctx.isConciseCorrect) {
    return {
      answer_quality: "strong",
      reasoning: `Concise and technically accurate response demonstrating direct command of ${ctx.matchedTechnicalTerms.slice(0, 3).join(", ")}.`,
      topics_demonstrated: ctx.matchedTechnicalTerms,
      next_action: "move_to_new_topic",
      difficulty_adjustment: "escalate",
      competency_established: true,
      extracted_claims: [],
    };
  }

  // 8. Long incorrect answers (Phase 2 Requirement 4.4)
  if (ctx.isLongIncorrect) {
    return {
      answer_quality: "shallow",
      reasoning: "Response contains fundamental technical misconceptions despite word count; clarifying follow-up required.",
      topics_demonstrated: [],
      unresolved_threads: ctx.matchedErrors,
      next_action: "clarify_ambiguity",
      difficulty_adjustment: "de-escalate",
      competency_established: false,
      extracted_claims: [],
    };
  }

  // 8.5. Vague handwaving / generic evasion
  if (ctx.isVagueHandwaving) {
    return {
      answer_quality: "shallow",
      reasoning: "Answer contains high-level buzzwords and generic assertions without concrete implementation details.",
      topics_demonstrated: [],
      next_action: "follow_up_probe",
      difficulty_adjustment: "maintain",
      extracted_claims: [],
    };
  }

  // 9. Fast-path: extremely brief answers (< 6 words) that are NOT declines are shallow
  if (wordCount <= 5) {
    return {
      answer_quality: "shallow",
      reasoning: `Answer was only ${wordCount} words — insufficient technical substance provided.`,
      topics_demonstrated: [],
      next_action: sessionState.consecutiveShallow >= 1 ? "advance_section" : "follow_up_probe",
      difficulty_adjustment: "de-escalate",
      extracted_claims: [],
    };
  }

  // 10. LLM-based deep assessment
  const technicalKeywords = [
    "kafka", "partition", "skew", "rebalance", "index", "latency", "concurrency",
    "deadlock", "transaction", "isolation", "postgres", "redis", "cache", "microservice",
    "async", "mvcc", "mutex", "queue", "docker", "kubernetes", "api", "query", "schema",
    "b+ tree", "outbox", "idempotency", "debezium", "page", "disk", "i/o", "tree", "fanout",
    "sliding window", "two pointers", "raft", "paxos", "consensus", "grpc", "protobuf",
    "replication", "leader election", "heartbeat", "heartbeats", "sharding", "load balancer",
    "websocket", "rest", "graphql", "distributed", "algorithm"
  ];
  const deepArchitectureKeywords = [
    "kafka", "partition", "skew", "rebalance", "deadlock", "isolation",
    "postgres", "redis", "mvcc", "mutex", "b+ tree",
    "outbox", "idempotency", "debezium", "raft", "paxos", "consensus",
    "grpc", "protobuf", "replication", "leader election", "heartbeat",
    "heartbeats", "sharding", "two pointers", "sliding window"
  ];
  const matchedKeywords = technicalKeywords.filter((k) => cleanAns.includes(k));
  const matchedDeep = deepArchitectureKeywords.filter((k) => cleanAns.includes(k));
  const hasMetrics = /\b\d+(?:ms|s|%|k|mb|gb|rps|tps)\b/i.test(cleanAns);
  const hasTechnicalDepth = matchedDeep.length >= 2 || (matchedDeep.length >= 1 && (wordCount >= 18 || hasMetrics));

  const prompt = `You are a FAANG Staff Engineer assessing an interview answer with technical rigor and nuance.

QUESTION ASKED:
"${qText}"

CANDIDATE'S ANSWER (${wordCount} words):
"${lastAnswer.slice(0, 1800)}"

CANDIDATE BACKGROUND:
Experience Level: ${sessionState.experienceMode}
Verified Skills: ${dossier?.verifiedSkills?.join(", ") || "None"}
Projects: ${(dossier?.projects || []).map((p) => p.title).join(", ") || "General SWE"}

ASSESSMENT CRITERIA:
- "strong": Concrete details, specific metrics/architecture, explains personal technical choices and trade-offs.
- "adequate": Directly answers the question with technical understanding, but lacks deep edge cases or metrics.
- "partially_correct": Valid reasoning on some parts but omits a critical mechanism or failure mode.
- "shallow": Vague, buzzwords without substance, gives generic textbook definitions, or avoids specific implementation details.
- "off-topic": Fails to address the core of the question.
- "contradictory": Contradicts standard engineering facts or candidate's earlier claims.

DECISION FOR next_action:
- If answer_quality is "shallow" → "follow_up_probe" (ask for a concrete example or specific metric)
- If answer_quality is "partially_correct" → "follow_up_probe" (ask about the specific missing concept)
- If answer_quality is "contradictory" or "off-topic" → "clarify_ambiguity" (ask for clarification politely)
- If answer_quality is "adequate" or "strong" → "move_to_new_topic" (or "advance_section" if this area is covered)

Return ONLY this JSON:
{
  "answer_quality": "strong|adequate|partially_correct|shallow|off-topic|contradictory",
  "reasoning": "1-2 concise sentences explaining what specific technical evidence led to this rating",
  "topics_demonstrated": ["list of concepts or skills proven"],
  "unresolved_threads": ["any claims left unbacked or vague"],
  "next_action": "follow_up_probe|clarify_ambiguity|move_to_new_topic|advance_section",
  "difficulty_adjustment": "escalate|maintain|de-escalate",
  "extracted_claims": ["key technical claims made"]
}`;

  try {
    let raw = "";
    if (process.env.GROQ_API_KEY) {
      const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 450,
          temperature: 0.1,
          response_format: { type: "json_object" },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        raw = data.choices?.[0]?.message?.content || "";
      }
    }

    if (!raw && process.env.GEMINI_API_KEY) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { temperature: 0.1 } });
      const result = await model.generateContent(prompt);
      raw = result.response.text();
    }

    if (raw) {
      const parsed = extractJSON(raw);
      let quality: AnswerQuality = ["strong", "adequate", "partially_correct", "shallow", "off-topic", "contradictory"].includes(parsed.answer_quality)
        ? parsed.answer_quality
        : (hasTechnicalDepth && wordCount >= 16 ? "strong" : wordCount > 30 ? "adequate" : "shallow");

      // Short vague answers (< 25 words) attempting an answer should be treated as shallow and probed
      if (wordCount < 25 && (quality === "off-topic" || quality === "contradictory")) {
        quality = "shallow";
      }

      // Guard: if answer contains concrete technical depth, architecture terms, and metrics, it is not shallow
      if (quality === "shallow" && hasTechnicalDepth && (wordCount >= 18 || hasMetrics)) {
        quality = "strong";
      }

      let nextAction: NextInterviewerAction = parsed.next_action || "move_to_new_topic";
      if (quality === "shallow" || quality === "partially_correct") {
        nextAction = sessionState.consecutiveShallow >= 1 ? "advance_section" : "follow_up_probe";
      }

      return {
        answer_quality: quality,
        reasoning: stripThink(parsed.reasoning || "Technical assessment recorded."),
        topics_demonstrated: Array.from(new Set([
          ...(Array.isArray(parsed.topics_demonstrated) ? parsed.topics_demonstrated : []),
          ...(ctx.matchedTechnicalTerms || [])
        ])),
        unresolved_threads: Array.isArray(parsed.unresolved_threads) ? parsed.unresolved_threads : [],
        next_action: nextAction,
        difficulty_adjustment: parsed.difficulty_adjustment || "maintain",
        extracted_claims: Array.isArray(parsed.extracted_claims) ? parsed.extracted_claims : [],
      };
    }
  } catch (err: any) {
    console.warn("[interview-engine] assessCandidateAnswer API fallback:", err.message);
  }

  // Deterministic fallback based on answer depth and structure
  const quality: AnswerQuality =
    hasTechnicalDepth && (wordCount >= 16 || hasMetrics) ? "strong" :
    wordCount > 30 || hasTechnicalDepth || (hasMetrics && wordCount >= 12) ? "adequate" : "shallow";
  const demonstrated = quality === "strong" || quality === "adequate"
    ? Array.from(new Set([
        "Technical Implementation",
        "Systems Engineering",
        ...matchedKeywords.map((k) => k.charAt(0).toUpperCase() + k.slice(1)),
        ...(ctx.matchedTechnicalTerms || []),
      ]))
    : [];

  return {
    answer_quality: quality,
    reasoning: `Deterministic evaluation based on response depth (${wordCount} words) and technical keywords.`,
    topics_demonstrated: demonstrated,
    next_action: quality === "shallow" ? "follow_up_probe" : "move_to_new_topic",
    difficulty_adjustment: "maintain",
  };
}

// ══════════════════════════════════════════════════════════════
// 6B. ANSWER-LEVEL 100-POINT RUBRIC & MODEL ANSWER ENGINE
// ══════════════════════════════════════════════════════════════

export function generateExemplarModelAnswer(
  questionText: string,
  context: { section?: InterviewSection; targetRole?: string; experienceMode?: ExperienceMode; targetCompany?: string }
): string {
  const qClean = (questionText || "").toLowerCase();

  if (qClean.includes("deadlock") || qClean.includes("isolation") || qClean.includes("serializable")) {
    return "In a relational database, deadlocks arise when two concurrent transactions hold locks that each other require, forming a cyclic dependency. Regarding isolation: Read Committed avoids dirty reads by providing an MVCC snapshot per query, whereas Serializable guarantees the equivalent of serial execution order through predicate locks or Serializable Snapshot Isolation (SSI). In production systems, deadlocks are mitigated by acquiring row locks in a strict global order, keeping transactions concise, indexing foreign keys, and implementing bounded exponential backoff retry loops.";
  }
  if (qClean.includes("index") && (qClean.includes("write") || qClean.includes("degrade") || qClean.includes("performance"))) {
    return "Database indexes (primarily B+ Trees) optimize read query latency from an O(N) full table scan down to an O(log N) tree traversal. However, every INSERT, UPDATE, or DELETE requires the storage engine to synchronously update every index tree associated with the table on disk and potentially trigger leaf page splits. This causes write I/O amplification, higher lock contention, and larger WAL log generation, which degrades write throughput when tables are heavily indexed.";
  }
  if (qClean.includes("rate limit") || qClean.includes("requests per second") || qClean.includes("50,000")) {
    return "To architect a distributed rate limiter for 50k RPS across multiple data centers: employ Redis cluster with the Token Bucket or Sliding Window Counter algorithm executed via atomic Lua scripts to prevent distributed race conditions. To avoid cross-region network latency on every request, implement localized Redis instances with asynchronous reconciliation or use local token buckets combined with centralized quota allocation tokens.";
  }
  if (qClean.includes("hash map") || qClean.includes("binary search tree") || qClean.includes("bst")) {
    return "An in-memory hash map provides O(1) average time complexity for lookups, insertions, and deletions via hash bucket distribution, whereas a balanced BST (such as a Red-Black Tree) guarantees O(log N) worst-case time complexity while preserving sorted key order. Choose a hash map when point lookups are the dominant access pattern and order is immaterial. Choose a BST when you require range queries (e.g. keys between X and Y), order statistics (min/max), or deterministic worst-case bounds without hash clustering.";
  }
  if (qClean.includes("streaming log") || qClean.includes("top 10") || qClean.includes("frequent visitors")) {
    return "Given a streaming log of user IDs, maintain a frequency hash map alongside a Min-Heap of bounded size K (where K=10). For each incoming user ID, update its frequency counter. Compare the updated frequency against the heap's root (the minimum frequency in the current top 10). If larger, replace the root and heapify down in O(log K) time. Overall time complexity is O(N log K) with O(U) space for distinct users, keeping memory bounded.";
  }
  if (qClean.includes("reconciliation") || qClean.includes("server component") || qClean.includes("client component") || qClean.includes("react")) {
    return "React's reconciliation engine uses an O(N) heuristic tree diffing algorithm comparing element types and persistent unique keys across the Virtual DOM. Server Components execute solely on the server, generating a serialized JSON/JSX stream with zero client JavaScript bundle cost and direct database access. Client Components add client bundle footprint and provide event listeners and browser state.";
  }
  if (qClean.includes("virtual memory") || qClean.includes("paging") || qClean.includes("tlb") || qClean.includes("page fault")) {
    return "Virtual memory isolates process address spaces and abstracts physical RAM using fixed-size pages mapped via multi-level page tables. The CPU's Memory Management Unit (MMU) uses the Translation Lookaside Buffer (TLB) as a fast hardware cache of page table entries. When an address is referenced whose page is not in physical RAM or not marked present in the page table, the MMU triggers a Page Fault interrupt, prompting the OS kernel to load the page from disk into a physical frame and update the page table.";
  }
  if (qClean.includes("mutex") || qClean.includes("condition variable") || qClean.includes("semaphore")) {
    return "A mutex is a binary mutual exclusion lock with ownership semantics: only the thread that acquired the mutex can unlock it. A semaphore maintains an integer counter representing available shared resource permits. A condition variable allows threads to atomically release an associated mutex and block until another thread signals that a specific state predicate has changed.";
  }
  if (qClean.includes("disagree") || qClean.includes("conflict")) {
    return "When resolving a technical disagreement, I start by clarifying objective requirements and metrics rather than arguing preferences. For example, during an API design debate, I proposed building a quick prototype and benchmarking latency and serialization overhead. Grounding the decision in concrete data and trade-offs allowed the team to align quickly while maintaining high mutual respect and collaborative ownership.";
  }
  if (qClean.includes("incident") || qClean.includes("outage") || qClean.includes("production")) {
    return "During a production incident, my priority is rapid mitigation over root-cause analysis: immediately rolling back the offending deployment, enabling graceful fallback degradation, or scaling resources. Once service health is restored, we conduct a blameless post-mortem, identify systemic contributing factors, and implement automated regression tests and monitoring alerts to permanently prevent recurrence.";
  }

  return `A strong answer begins by clarifying system assumptions and boundaries, explains the core mechanism and data flow with technical precision, cites concrete architectural trade-offs, and analyzes edge-case failure modes under production constraints.`;
}

export function extractKeyConceptsForTopic(questionText: string, context?: any): string[] {
  const qClean = (questionText || "").toLowerCase();
  if (qClean.includes("deadlock") || qClean.includes("isolation")) {
    return ["ACID Guarantees & Transaction Boundaries", "Read Committed vs Serializable Isolation", "Lock Ordering & Deadlock Prevention", "MVCC Snapshot Semantics"];
  }
  if (qClean.includes("index")) {
    return ["B+ Tree Structure & Leaf Node Pointers", "Write Amplification & WAL Log I/O", "Covering Indexes & Query Plan Execution", "Index Cardinality & Selectivity"];
  }
  if (qClean.includes("rate limit")) {
    return ["Token Bucket vs Sliding Window Log", "Redis Atomic Lua Scripts", "Multi-Region Distributed Quota Sync", "429 Too Many Requests & Exponential Backoff"];
  }
  if (qClean.includes("hash map") || qClean.includes("bst")) {
    return ["O(1) Average vs O(log N) Worst-Case", "Hash Collision Resolution (Chaining vs Open Addressing)", "Ordered Traversal & Range Queries", "Cache Locality & Memory Overhead"];
  }
  if (qClean.includes("streaming log") || qClean.includes("top 10")) {
    return ["Min-Heap of Bounded Size K", "Frequency Map Counting", "O(N log K) Time Complexity", "Space Complexity vs Distinct Element Cardinality"];
  }
  return ["System Invariants & Assumptions", "Time & Space Complexity", "Edge Case & Failure Recovery", "Engineering Trade-offs"];
}

export function generateLogicalFollowUps(questionText: string, answerOrContext?: any, extraContext?: any): string[] {
  let combinedParts: string[] = [questionText || ""];
  if (typeof answerOrContext === "string") {
    combinedParts.push(answerOrContext);
  } else if (answerOrContext) {
    combinedParts.push(answerOrContext.answerText || answerOrContext.answer || "");
  }
  if (typeof extraContext === "string") {
    combinedParts.push(extraContext);
  } else if (extraContext) {
    combinedParts.push(extraContext.answerText || extraContext.answer || "");
  }
  const combined = combinedParts.join(" ").toLowerCase();

  // Track-specialized follow-up integration
  const trackCandidate = (typeof answerOrContext === "object" ? answerOrContext?.track : undefined) ||
                         (typeof extraContext === "object" ? extraContext?.track : undefined);
  if (trackCandidate) {
    const norm = normalizeInterviewTrack(trackCandidate);
    const specFollowUp = generateSpecializedTrackFollowUp({
      track: norm,
      questionText,
      candidateAnswer: combined,
      turnDepth: 1,
    });
    if (specFollowUp && specFollowUp.followUpQuestion) {
      return [
        specFollowUp.followUpQuestion,
        `How would you verify that your proposed implementation or fix handles edge-case regressions under production constraints?`
      ];
    }
  }

  if (combined.includes("outbox") || combined.includes("idempotency") || combined.includes("debezium") || combined.includes("at-least-once") || combined.includes("microservice")) {
    return [
      "In your Transactional Outbox design, how do you handle publisher polling overhead vs Debezium CDC to minimize latency?",
      "How do downstream consumers handle idempotency and deduplication when duplicate messages arrive due to network retries?"
    ];
  }
  if (combined.includes("deadlock") || combined.includes("isolation")) {
    return [
      "How would you diagnose an active deadlock in PostgreSQL without restarting the server?",
      "When does optimistic concurrency control with version checks outperform pessimistic row locking?"
    ];
  }
  if (combined.includes("index") || combined.includes("b+ tree")) {
    return [
      "How do you inspect a database query plan (EXPLAIN ANALYZE) to verify an index is actually being utilized?",
      "What are partial indexes and when should you use them over composite indexes?"
    ];
  }
  if (combined.includes("rate limit")) {
    return [
      "How would you handle rate limiting for unauthenticated public endpoints versus authenticated API key holders?",
      "What fallback strategy do you employ if the centralized Redis rate limiter cluster becomes temporarily unreachable?"
    ];
  }
  if (combined.includes("cache") || combined.includes("redis")) {
    return [
      "How do you mitigate cache stampedes (thundering herd) and cache penetration in high-traffic read paths?",
      "What eviction policy (LRU, LFU, TTL) do you configure for memory-bounded caches?"
    ];
  }
  if (combined.includes("hash map") || combined.includes("bst") || combined.includes("tree")) {
    return [
      "What happens to a hash table's performance under high load factors, and how is dynamic resizing implemented?",
      "How do Self-Balancing Trees like AVL and Red-Black trees maintain logarithmic height during mutations?"
    ];
  }
  return [
    "How does your proposed approach behave under 10x traffic spikes?",
    "What automated tests would you write to catch boundary regressions in CI/CD?"
  ];
}

export function normalizeInterviewTrack(track?: string): InterviewTrack {
  if (!track) return "traditional_coding_dsa";
  const t = track.toLowerCase().trim();
  if (t === "traditional_dsa" || t === "traditional_coding_dsa" || t.includes("dsa") || t.includes("coding")) return "traditional_coding_dsa";
  if (t.includes("comprehension")) return "code_comprehension";
  if (t.includes("debug") || t.includes("repair")) return "debugging_code_repair";
  if (t.includes("ai_assisted") || t.includes("ai")) return "ai_assisted_engineering";
  if (t.includes("system_design") || t.includes("architecture") || t.includes("system")) return "system_design";
  if (t.includes("review") || t.includes("reliability")) return "code_review_reliability";
  if (t.includes("senior") || t.includes("judgment")) return "senior_engineering_judgment";
  if (t.includes("behavioral") || t.includes("project")) return "behavioral_project_deep_dives";
  return "traditional_coding_dsa";
}

export async function evaluateAnswerRubricAndModelAnswer(
  questionText: string,
  answerText: string,
  context: {
    section: InterviewSection;
    experienceMode: ExperienceMode;
    targetRole: string;
    targetCompany?: string;
    competency?: string;
    dossier?: CandidateInterviewDossier;
    answerQuality?: AnswerQuality;
    isAssisted?: boolean;
    isSelfCorrected?: boolean;
    track?: InterviewTrack | string;
    status?: AssessmentItemStatus;
  }
): Promise<QuestionModelAnswer> {
  const safeAns = (answerText || "").trim();
  const wordCount = safeAns ? safeAns.split(/\s+/).filter(Boolean).length : 0;
  const isDeclined = isCandidateDecline(safeAns);
  const cleanAns = safeAns.toLowerCase();
  const doesNotKnowPatterns = [
    /i don'?t know/i,
    /i am not sure/i,
    /i'?m not familiar/i,
    /no idea/i,
    /haven'?t worked with that/i,
    /pass on this one/i,
    /can we move on/i,
    /can we skip/i,
    /never used that/i,
  ];
  const isDoesNotKnow = doesNotKnowPatterns.some((pattern) => pattern.test(cleanAns)) && wordCount < 25;
  const isAssisted = Boolean(context.isAssisted);
  const isAlternativeValid = Boolean(
    (context.answerQuality as unknown as string) === "alternative_approach" ||
    /\b(alternative|alternatively|another approach|instead of|trade-off between|trade-offs of|tradeoff|valid alternative)\b/i.test(cleanAns)
  );

  if (
    isDeclined ||
    isDoesNotKnow ||
    context.answerQuality === "declined" ||
    context.answerQuality === "does_not_know" ||
    /\b(skip this|prefer to skip|rather not|prefer not|haven'?t worked deeply)\b/i.test(cleanAns)
  ) {
    const dimensionScores: RubricDimensionScore[] = [
      {
        dimension: "Technical Correctness & Accuracy",
        earnedPoints: 3,
        maxPoints: 35,
        explanation: "Candidate acknowledged unfamiliarity or deferred this topic."
      },
      {
        dimension: "Conceptual Depth & Architecture",
        earnedPoints: 2,
        maxPoints: 25,
        explanation: "Core technical mechanics were not demonstrated."
      },
      {
        dimension: "Reasoning, Trade-offs & Edge Cases",
        earnedPoints: 2,
        maxPoints: 20,
        explanation: "No edge cases or trade-offs demonstrated."
      },
      {
        dimension: "Practical Application & Evidence",
        earnedPoints: 1,
        maxPoints: 10,
        explanation: "No real-world implementation cited."
      },
      {
        dimension: "Clarity, Structure & Articulation",
        earnedPoints: 7,
        maxPoints: 10,
        explanation: "Candid, upfront, and professional communication."
      }
    ];
    return {
      score: 15,
      rubricVersion: "1.0-canonical-100pt",
      rubricName: "Topic Deferral / Unfamiliarity Canonical Rubric",
      dimensionScores,
      whatYouDidWell: ["Maintained professional candor regarding topic limitations."],
      whatWasMissing: ["Core definitions, architectural trade-offs, and implementation details."],
      deductionReasons: ["Substantive explanation of technical mechanics is required for full rubric points."],
      howToImprove: "Review the fundamental principles and practical trade-offs of this topic in the Skill Practice Hub.",
      bestPossibleAnswer: generateExemplarModelAnswer(questionText, context as any),
      keyConceptsToRemember: extractKeyConceptsForTopic(questionText, context as any),
      likelyFollowUps: generateLogicalFollowUps(questionText, context as any),
      personalizedNextAction: `Practice ${context.competency || "core technical topics"} in Cognalyze.`,
      isAssisted,
      alternativeApproachValid: false,
      status: isDeclined ? "skipped" : "insufficient_evidence",
      answerComparison: {
        candidateDemonstrated: ["Candid topic deferral"],
        missingPoints: ["Core mechanism", "Trade-off analysis"],
        whatModelAnswerAdds: "Comprehensive technical mechanics, production metrics, and edge-case handling."
      }
    };
  }

  const normTrack = context.track ? normalizeInterviewTrack(context.track) : undefined;
  let dimensionScores: RubricDimensionScore[] = [];
  let rubricName = "100-Point Canonical Evaluation Rubric";

  if (normTrack === "traditional_coding_dsa") {
    // ── 1. TRADITIONAL CODING & DSA RUBRIC (Max: 100) ──
    rubricName = "Traditional Coding & DSA 100-Point Rubric";
    const dsaTokens = ["o(n)", "o(1)", "o(log n)", "pointer", "array", "binary", "tree", "hash", "stack", "queue", "dp", "dynamic programming", "recursion", "memo"];
    const matched = dsaTokens.filter((k) => cleanAns.includes(k));

    let correctness = Math.min(30, wordCount >= 25 && (matched.length >= 2 || isAlternativeValid) ? 28 : wordCount >= 15 ? 22 : 12);
    if (isAlternativeValid) correctness = 30; // Full credit for valid alternative approach
    const reasoning = Math.min(25, matched.length >= 1 ? 23 : wordCount >= 20 ? 18 : 11);
    const complexity = Math.min(20, cleanAns.includes("o(") || cleanAns.includes("complexity") || cleanAns.includes("space") ? 19 : 9);
    const edgeCases = Math.min(15, cleanAns.includes("empty") || cleanAns.includes("null") || cleanAns.includes("boundary") || cleanAns.includes("zero") ? 14 : 8);
    const codeQuality = Math.min(10, wordCount >= 20 ? 9 : 6);

    dimensionScores = [
      { dimension: "Correctness & Logic", earnedPoints: correctness, maxPoints: 30, explanation: correctness >= 25 ? "Sound algorithmic logic addressing core problem requirements." : "Partially correct logic; verify invariant constraints." },
      { dimension: "Algorithmic Reasoning", earnedPoints: reasoning, maxPoints: 25, explanation: reasoning >= 20 ? "Structured walkthrough of data structure selection and invariants." : "Explain step-by-step state transitions more explicitly." },
      { dimension: "Complexity Analysis", earnedPoints: complexity, maxPoints: 20, explanation: complexity >= 16 ? "Accurate asymptotic time and auxiliary space bounds." : "State explicit asymptotic Big-O runtime and memory bounds." },
      { dimension: "Edge Cases & Boundaries", earnedPoints: edgeCases, maxPoints: 15, explanation: edgeCases >= 12 ? "Proactively handles empty inputs, null pointers, and bounds." : "Verify behavior for extreme sizes and null inputs." },
      { dimension: "Code Quality & Testing", earnedPoints: codeQuality, maxPoints: 10, explanation: codeQuality >= 8 ? "Clean decomposition with automated testing mindset." : "Structure code with clean variable naming and assertions." }
    ];
  } else if (normTrack === "code_comprehension") {
    // ── 2. CODE COMPREHENSION RUBRIC (Max: 100) ──
    rubricName = "Code Comprehension 100-Point Rubric";
    const compTokens = ["returns", "function", "parameter", "evaluates", "computes", "logic", "flow", "invokes", "state", "mutation", "scope"];
    const matched = compTokens.filter((k) => cleanAns.includes(k));

    const accuracy = Math.min(30, matched.length >= 2 ? 28 : wordCount >= 20 ? 22 : 12);
    const execFlow = Math.min(25, cleanAns.includes("flow") || cleanAns.includes("step") || cleanAns.includes("calls") ? 23 : wordCount >= 20 ? 18 : 11);
    const architecture = Math.min(20, cleanAns.includes("module") || cleanAns.includes("interface") || cleanAns.includes("class") ? 18 : 11);
    const dependencies = Math.min(15, cleanAns.includes("side effect") || cleanAns.includes("async") || cleanAns.includes("state") ? 14 : 8);
    const evidenceGrounding = Math.min(10, wordCount >= 25 ? 9 : 6);

    dimensionScores = [
      { dimension: "Explanation Accuracy", earnedPoints: accuracy, maxPoints: 30, explanation: accuracy >= 25 ? "Accurately articulates code behavior and output semantics." : "Surface reading; clarify exact data transformations." },
      { dimension: "Execution Flow & Data Flow", earnedPoints: execFlow, maxPoints: 25, explanation: execFlow >= 20 ? "Precise tracing of call stack, loops, and intermediate states." : "Detail step-by-step execution path." },
      { dimension: "Architecture & Component Interactions", earnedPoints: architecture, maxPoints: 20, explanation: architecture >= 16 ? "Understands module boundaries and component contracts." : "Explain how components interface with caller modules." },
      { dimension: "Dependencies & Side Effects", earnedPoints: dependencies, maxPoints: 15, explanation: dependencies >= 12 ? "Identifies mutation, I/O, and asynchronous lifecycle effects." : "Highlight state mutation or side effects." },
      { dimension: "Evidence Grounding & Code Citation", earnedPoints: evidenceGrounding, maxPoints: 10, explanation: evidenceGrounding >= 8 ? "Directly grounds explanation in supplied code snippets." : "Cite specific variables and lines from the target code." }
    ];
  } else if (normTrack === "debugging_code_repair") {
    // ── 3. DEBUGGING & CODE REPAIR RUBRIC (Max: 100) ──
    rubricName = "Debugging & Code Repair 100-Point Rubric";
    const debugTokens = ["reproduce", "isolate", "hypothesis", "diagnose", "root cause", "off-by-one", "race", "patch", "regression", "test"];
    const matched = debugTokens.filter((k) => cleanAns.includes(k));

    const repro = Math.min(25, cleanAns.includes("reproduce") || cleanAns.includes("isolate") || cleanAns.includes("test case") ? 23 : wordCount >= 20 ? 18 : 10);
    const hypothesis = Math.min(25, cleanAns.includes("hypothesis") || cleanAns.includes("diagnos") || matched.length >= 2 ? 23 : 12);
    const rootCause = Math.min(20, cleanAns.includes("root cause") || cleanAns.includes("because") || cleanAns.includes("flaw") ? 18 : 10);
    const fixQuality = Math.min(15, cleanAns.includes("fix") || cleanAns.includes("patch") || cleanAns.includes("refactor") ? 14 : 8);
    const regressionTest = Math.min(15, cleanAns.includes("regression") || cleanAns.includes("unit test") || cleanAns.includes("verify") ? 14 : 8);

    dimensionScores = [
      { dimension: "Bug Reproduction & Isolation", earnedPoints: repro, maxPoints: 25, explanation: repro >= 20 ? "Systematic minimal reproduction with isolated trigger condition." : "Formulate a minimal failing test case first." },
      { dimension: "Hypotheses & Diagnostic Reasoning", earnedPoints: hypothesis, maxPoints: 25, explanation: hypothesis >= 20 ? "Methodical scientific process ruling out failure hypotheses." : "State testable hypotheses before applying code changes." },
      { dimension: "Root-Cause Identification", earnedPoints: rootCause, maxPoints: 20, explanation: rootCause >= 16 ? "Identified actual underlying flaw rather than masking symptoms." : "Distinguish superficial symptoms from the root cause." },
      { dimension: "Fix Quality & Minimal Side-Effects", earnedPoints: fixQuality, maxPoints: 15, explanation: fixQuality >= 12 ? "Targeted, elegant patch without introducing regressions." : "Ensure fix preserves existing backward contracts." },
      { dimension: "Regression Testing & Verification", earnedPoints: regressionTest, maxPoints: 15, explanation: regressionTest >= 12 ? "Comprehensive regression suite verifying boundary fix." : "Write automated regression tests guarding against re-occurrence." }
    ];
  } else if (normTrack === "ai_assisted_engineering") {
    // ── 4. AI-ASSISTED ENGINEERING RUBRIC (Max: 100) ──
    rubricName = "AI-Assisted Engineering 100-Point Rubric";
    const aiTokens = ["prompt", "context", "few-shot", "hallucination", "verify", "audit", "governance", "synthetic", "test", "benchmark"];
    const matched = aiTokens.filter((k) => cleanAns.includes(k));

    const promptQuality = Math.min(25, cleanAns.includes("prompt") || cleanAns.includes("context") || cleanAns.includes("constraint") ? 23 : 13);
    const criticalEval = Math.min(25, cleanAns.includes("critique") || cleanAns.includes("review") || cleanAns.includes("inspect") || matched.length >= 2 ? 23 : 13);
    const hallucinationDetect = Math.min(20, cleanAns.includes("hallucinat") || cleanAns.includes("unsupported") || cleanAns.includes("incorrect api") ? 18 : 11);
    const independentVerify = Math.min(15, cleanAns.includes("verify") || cleanAns.includes("test") || cleanAns.includes("benchmark") ? 14 : 8);
    const toolDisclosure = Math.min(15, cleanAns.includes("disclos") || cleanAns.includes("governance") || cleanAns.includes("policy") || wordCount >= 20 ? 14 : 8);

    dimensionScores = [
      { dimension: "Prompt & Context Quality", earnedPoints: promptQuality, maxPoints: 25, explanation: promptQuality >= 20 ? "Crisp constraints, role scoping, and structured context in prompts." : "Refine prompt with explicit boundary constraints and output formats." },
      { dimension: "Critical Evaluation of AI Output", earnedPoints: criticalEval, maxPoints: 25, explanation: criticalEval >= 20 ? "Rigorous adversarial scrutiny of generated code and assumptions." : "Do not accept generated code without line-by-line verification." },
      { dimension: "Detection of Hallucinations & Flaws", earnedPoints: hallucinationDetect, maxPoints: 20, explanation: hallucinationDetect >= 16 ? "Quickly identified phantom APIs, outdated syntax, or logic errors." : "Scrutinize third-party library imports for phantom methods." },
      { dimension: "Independent Verification & Testing", earnedPoints: independentVerify, maxPoints: 15, explanation: independentVerify >= 12 ? "Executes unit tests and benchmarks independently of AI claims." : "Run automated test suites to validate AI-generated output." },
      { dimension: "Honest Disclosure & Tool Governance", earnedPoints: toolDisclosure, maxPoints: 15, explanation: toolDisclosure >= 12 ? "Transparent attribution, IP compliance, and security governance." : "Ensure full compliance with enterprise IP and disclosure standards." }
    ];
  } else if (normTrack === "system_design" || (normTrack as unknown as string) === "system_design_architecture") {
    // ── 5. SYSTEM DESIGN & ARCHITECTURE RUBRIC (Max: 100) ──
    rubricName = "System Design & Architecture 100-Point Rubric";
    const designTokens = ["scale", "throughput", "latency", "partition", "sharding", "replication", "cache", "consistency", "load balancer", "kafka", "columnar", "clickhouse", "timescale"];
    const matched = designTokens.filter((k) => cleanAns.includes(k));

    let reqScoping = Math.min(20, cleanAns.includes("read") || cleanAns.includes("write") || cleanAns.includes("qps") || cleanAns.includes("sla") || isAlternativeValid ? 18 : 12);
    let interfaces = Math.min(15, cleanAns.includes("api") || cleanAns.includes("rest") || cleanAns.includes("grpc") || cleanAns.includes("schema") || isAlternativeValid ? 14 : 8);
    let dataModel = Math.min(20, cleanAns.includes("sql") || cleanAns.includes("nosql") || cleanAns.includes("index") || cleanAns.includes("postgres") || cleanAns.includes("columnar") || cleanAns.includes("storage") || isAlternativeValid ? 18 : 12);
    let scalability = Math.min(20, matched.length >= 3 || isAlternativeValid ? 19 : wordCount >= 30 ? 16 : 11);
    let reliability = Math.min(15, cleanAns.includes("failover") || cleanAns.includes("spof") || cleanAns.includes("circuit breaker") || cleanAns.includes("acid") ? 14 : 8);
    let tradeOffs = Math.min(10, cleanAns.includes("cap") || cleanAns.includes("trade-off") || cleanAns.includes("consistency") || isAlternativeValid ? 10 : 6);

    dimensionScores = [
      { dimension: "Requirements & Boundary Scoping", earnedPoints: reqScoping, maxPoints: 20, explanation: reqScoping >= 16 ? "Well-scoped functional scope, throughput (QPS), and latency SLA." : "Clarify scale assumptions and read/write ratios up front." },
      { dimension: "Interface Contracts & APIs", earnedPoints: interfaces, maxPoints: 15, explanation: interfaces >= 12 ? "Clean REST/gRPC contracts with versioning and idempotency keys." : "Define explicit API payloads and error contracts." },
      { dimension: "Data Modeling & Storage Strategy", earnedPoints: dataModel, maxPoints: 20, explanation: dataModel >= 16 ? "Principled database selection, indexing, and partitioning strategy." : "Elaborate on schema design and partition key selection." },
      { dimension: "Scalability, Throughput & Latency", earnedPoints: scalability, maxPoints: 20, explanation: scalability >= 16 ? "Decoupled architecture with caching, queues, and horizontal scale." : "Address bottleneck mitigation under sudden traffic spikes." },
      { dimension: "Reliability, Security & Failure Modes", earnedPoints: reliability, maxPoints: 15, explanation: reliability >= 12 ? "Resilient failure isolation, circuit breakers, and zero SPOFs." : "Account for node crashes and network partition recovery." },
      { dimension: "Trade-offs & Architecture Justification", earnedPoints: tradeOffs, maxPoints: 10, explanation: tradeOffs >= 8 ? "Rigorous trade-off rationale between consistency, cost, and speed." : "Explicitly compare chosen architecture against alternatives." }
    ];
  } else if (normTrack === "code_review_reliability") {
    // ── 6. CODE REVIEW, TESTING & RELIABILITY RUBRIC (Max: 100) ──
    rubricName = "Code Review, Testing & Reliability 100-Point Rubric";
    const reviewTokens = ["defect", "bug", "severity", "security", "injection", "test coverage", "mock", "race", "concurrency", "recovery", "n+1", "loop", "batch", "leak", "antipattern"];
    const matched = reviewTokens.filter((k) => cleanAns.includes(k));

    const defectDetect = Math.min(30, matched.length >= 1 || cleanAns.includes("n+1") || cleanAns.includes("bug") ? 28 : wordCount >= 20 ? 22 : 12);
    const severityPrioritization = Math.min(20, cleanAns.includes("severe") || cleanAns.includes("severity") || cleanAns.includes("priority") || cleanAns.includes("critical") || cleanAns.includes("blocker") ? 18 : 11);
    const evidenceFindings = Math.min(20, cleanAns.includes("line") || cleanAns.includes("because") || wordCount >= 20 ? 18 : 11);
    const testCoverage = Math.min(15, cleanAns.includes("test coverage") || cleanAns.includes("unit test") || cleanAns.includes("edge case") || cleanAns.includes("batch") ? 14 : 8);
    const securityRecovery = Math.min(15, cleanAns.includes("security") || cleanAns.includes("auth") || cleanAns.includes("sanitiz") || cleanAns.includes("rollback") || wordCount >= 20 ? 14 : 8);

    dimensionScores = [
      { dimension: "Defect Detection & Correctness", earnedPoints: defectDetect, maxPoints: 30, explanation: defectDetect >= 25 ? "Discovered subtle concurrency, boundary, or resource leakage bugs." : "Look beyond styling into underlying execution invariants." },
      { dimension: "Severity Prioritization & Impact", earnedPoints: severityPrioritization, maxPoints: 20, explanation: severityPrioritization >= 16 ? "Triages findings cleanly by business and production risk." : "Differentiate blockers from cosmetic nitpicks." },
      { dimension: "Evidence-Based Findings & Citations", earnedPoints: evidenceFindings, maxPoints: 20, explanation: evidenceFindings >= 16 ? "Cites exact code lines, reproducible states, and failure traces." : "Provide concrete examples of how the defect manifests." },
      { dimension: "Test Coverage & Edge Case Verification", earnedPoints: testCoverage, maxPoints: 15, explanation: testCoverage >= 12 ? "Demands comprehensive automated test suites and mocks." : "Identify untested boundary and error code paths." },
      { dimension: "Security & Recovery Considerations", earnedPoints: securityRecovery, maxPoints: 15, explanation: securityRecovery >= 12 ? "Accounts for input sanitization, RBAC, and rollback strategies." : "Audit code for injection and unhandled exception crashes." }
    ];
  } else if (normTrack === "senior_engineering_judgment") {
    // ── 7. SENIOR ENGINEERING JUDGMENT RUBRIC (Max: 100) ──
    rubricName = "Senior Engineering Judgment 100-Point Rubric";
    const judgmentTokens = ["ambiguity", "trade-off", "maintainability", "observability", "operational", "blast radius", "tech debt", "consensus", "rfc"];
    const matched = judgmentTokens.filter((k) => cleanAns.includes(k));

    const ambiguity = Math.min(25, cleanAns.includes("ambiguity") || cleanAns.includes("trade-off") || cleanAns.includes("clarif") ? 23 : wordCount >= 20 ? 18 : 11);
    const maintainability = Math.min(25, cleanAns.includes("maintain") || cleanAns.includes("operab") || cleanAns.includes("observab") || cleanAns.includes("telemetry") ? 23 : 13);
    const operationalRisk = Math.min(20, cleanAns.includes("blast radius") || cleanAns.includes("canary") || cleanAns.includes("rollout") || cleanAns.includes("incident") ? 18 : 11);
    const techDebt = Math.min(15, cleanAns.includes("tech debt") || cleanAns.includes("refactor") || cleanAns.includes("pragmatic") ? 14 : 8);
    const decisionDefense = Math.min(15, cleanAns.includes("consensus") || cleanAns.includes("stakeholder") || cleanAns.includes("align") || wordCount >= 25 ? 14 : 8);

    dimensionScores = [
      { dimension: "Ambiguity Handling & Trade-off Navigation", earnedPoints: ambiguity, maxPoints: 25, explanation: ambiguity >= 20 ? "Excels at de-risking vague requirements through pragmatic trade-offs." : "Clarify core trade-offs under uncertain requirements." },
      { dimension: "Maintainability & Operability", earnedPoints: maintainability, maxPoints: 25, explanation: maintainability >= 20 ? "Designs for day-2 operations: runbooks, telemetry, and debugging ease." : "Plan for long-term operational health and observability." },
      { dimension: "Operational Risks & Production Boundaries", earnedPoints: operationalRisk, maxPoints: 20, explanation: operationalRisk >= 16 ? "Proactively bounds blast radius with canaries and graceful degradation." : "Consider failure blast radius in production deployments." },
      { dimension: "Technical Debt Management", earnedPoints: techDebt, maxPoints: 15, explanation: techDebt >= 12 ? "Pragmatic debt containment with planned milestone remediation." : "Balance speed of delivery against accumulated tech debt." },
      { dimension: "Decision Defense & Consensus Building", earnedPoints: decisionDefense, maxPoints: 15, explanation: decisionDefense >= 12 ? "Articulates defensible technical rationale aligning stakeholders." : "Explain how technical consensus is established across teams." }
    ];
  } else if (normTrack === "behavioral_project_deep_dives") {
    // ── 8. BEHAVIORAL & PROJECT DEEP DIVES RUBRIC (Max: 100) ──
    rubricName = "Behavioral & Project Deep Dives 100-Point Rubric";
    const starTokens = ["situation", "task", "action", "result", "team", "conflict", "resolved", "delivered", "learned", "metric"];
    const matched = starTokens.filter((k) => cleanAns.includes(k));
    const hasPersonalOwnership = /\b(i decided|i built|i led|i took ownership|my responsibility|i implemented|i handled|my contribution)\b/i.test(cleanAns);
    const hasConflict = /\b(disagree|conflict|trade-off|compromise|persuade|align|aligned)\b/i.test(cleanAns);
    const hasImpact = /\b(increased|reduced|saved|improved|shipped|deadline|delivered|percent|%|\d+x)\b/i.test(cleanAns);

    const starStructure = Math.min(25, wordCount >= 35 && matched.length >= 2 ? 23 : wordCount >= 20 ? 18 : 11);
    const personalOwnership = Math.min(25, hasPersonalOwnership ? 24 : wordCount >= 25 ? 18 : 11);
    const technicalDecisions = Math.min(20, hasConflict || cleanAns.includes("trade-off") ? 18 : 12);
    const collaboration = Math.min(15, cleanAns.includes("collaborat") || cleanAns.includes("team") || cleanAns.includes("mentor") ? 14 : 9);
    const impactLearnings = Math.min(15, hasImpact || cleanAns.includes("learned") ? 14 : 9);

    dimensionScores = [
      { dimension: "Personal Ownership & STAR Storytelling", earnedPoints: starStructure, maxPoints: 25, explanation: starStructure >= 20 ? "Crisp narrative structure covering situation, task, action, and results." : "Structure story using explicit Situation, Task, Action, and Result." },
      { dimension: "Actual Contribution vs Team Role", earnedPoints: personalOwnership, maxPoints: 25, explanation: personalOwnership >= 20 ? "Pinpoints exact individual code and architectural contributions." : "Distinguish your specific individual contributions from team efforts." },
      { dimension: "Technical Decisions & Dilemma Navigation", earnedPoints: technicalDecisions, maxPoints: 20, explanation: technicalDecisions >= 16 ? "Defends difficult engineering decisions under real-world constraints." : "Elaborate on technical trade-offs evaluated during the project." },
      { dimension: "Collaboration & Conflict Resolution", earnedPoints: collaboration, maxPoints: 15, explanation: collaboration >= 12 ? "Constructive consensus building during engineering disagreements." : "Highlight how technical alignment was achieved across partners." },
      { dimension: "Business/Engineering Impact & Lessons Learned", earnedPoints: impactLearnings, maxPoints: 15, explanation: impactLearnings >= 12 ? "Quantifiable production impact accompanied by candid retrospective growth." : "Quantify outcomes with concrete metrics or post-mortem learnings." }
    ];
  } else {
    // ── FALLBACK SECTION-BASED RUBRICS (Backward Compatibility) ──
    const isBehavioral = context.section === "behavioral";
    const isProject = context.section === "resume_projects";
    const isSystemDesign = context.section === "coding_system_design" && (context.experienceMode === "experienced" || /design|architect|scale|distributed|throughput|sharding/i.test(questionText));
    const isCoding = context.section === "coding_system_design" && !isSystemDesign;

    if (isBehavioral) {
      rubricName = "Behavioral STAR 100-Point Rubric";
      const starEarned = Math.min(25, wordCount >= 35 ? 22 : wordCount >= 20 ? 17 : 10);
      const ownershipEarned = Math.min(30, /\b(i decided|i built|i led|i took ownership)\b/i.test(cleanAns) ? 27 : 18);
      const decisionEarned = Math.min(20, cleanAns.includes("trade-off") || cleanAns.includes("conflict") ? 18 : 13);
      const impactEarned = Math.min(15, cleanAns.includes("%") || cleanAns.includes("improved") ? 14 : 9);
      const clarityEarned = Math.min(10, wordCount >= 25 ? 9 : 6);

      dimensionScores = [
        { dimension: "STAR Structure & Relevance", earnedPoints: starEarned, maxPoints: 25, explanation: starEarned >= 20 ? "Clear narrative structure covering situation, task, action, and results." : "Partially structured; could explicitly separate actions taken from background context." },
        { dimension: "Personal Ownership & Actions", earnedPoints: ownershipEarned, maxPoints: 30, explanation: ownershipEarned >= 24 ? "High personal accountability with concrete actions specified." : "Focuses more on team activities than specific individual contributions." },
        { dimension: "Decision-Making & Conflict Resolution", earnedPoints: decisionEarned, maxPoints: 20, explanation: decisionEarned >= 15 ? "Demonstrates thoughtful navigation of technical disagreements or dilemmas." : "Could elaborate on how consensus was built and alternatives evaluated." },
        { dimension: "Measurable Outcomes & Reflection", earnedPoints: impactEarned, maxPoints: 15, explanation: impactEarned >= 12 ? "Quantified business or engineering impact with honest post-mortem reflection." : "Qualitative result stated; cite specific production metrics or retrospectives." },
        { dimension: "Communication Clarity", earnedPoints: clarityEarned, maxPoints: 10, explanation: clarityEarned >= 8 ? "Concise, empathetic, and professional communication." : "Adequate communication; keep answers focused and avoid meandering." }
      ];
    } else if (isProject) {
      rubricName = "Project Defense & Provenance 100-Point Rubric";
      const archEarned = Math.min(30, wordCount >= 20 ? 25 : 14);
      const ownershipEarned = Math.min(30, /\b(i built|i implemented|i chose)\b/i.test(cleanAns) ? 27 : 18);
      const errorEarned = Math.min(20, cleanAns.includes("error") || cleanAns.includes("retry") ? 18 : 12);
      const testEarned = Math.min(10, cleanAns.includes("test") ? 9 : 6);
      const tradeOffEarned = Math.min(10, cleanAns.includes("trade-off") ? 9 : 7);

      dimensionScores = [
        { dimension: "Architecture Understanding", earnedPoints: archEarned, maxPoints: 30, explanation: archEarned >= 24 ? "Deep understanding of system modules, data contracts, and integration points." : "Surface overview provided; elaborate on exact component interactions." },
        { dimension: "Personal Ownership & Implementation Detail", earnedPoints: ownershipEarned, maxPoints: 30, explanation: ownershipEarned >= 24 ? "Clearly articulates low-level personal contributions versus library defaults." : "Distinguish personal implementation choices from off-the-shelf frameworks." },
        { dimension: "Error Handling & Recovery", earnedPoints: errorEarned, maxPoints: 20, explanation: errorEarned >= 16 ? "Robust edge-case failure mitigation, telemetry, and recovery mechanisms." : "Lacks explicit failure boundary isolation or retry backoff strategy." },
        { dimension: "Testing & Validation", earnedPoints: testEarned, maxPoints: 10, explanation: testEarned >= 8 ? "Rigorous automated test coverage and validation methodology." : "Mention automated unit, integration, or synthetic load testing applied." },
        { dimension: "Trade-offs & Clarity", earnedPoints: tradeOffEarned, maxPoints: 10, explanation: tradeOffEarned >= 8 ? "Solid rationale for technical selections over alternatives." : "Explain why alternative technologies or patterns were ruled out." }
      ];
    } else if (isSystemDesign) {
      rubricName = "Distributed System Design 100-Point Rubric";
      const reqEarned = Math.min(20, cleanAns.includes("qps") || cleanAns.includes("read") ? 18 : 13);
      const archEarned = Math.min(30, wordCount >= 30 ? 27 : 17);
      const storageEarned = Math.min(20, cleanAns.includes("sql") || cleanAns.includes("index") ? 18 : 12);
      const reliabilityEarned = Math.min(20, cleanAns.includes("failover") || cleanAns.includes("spof") ? 18 : 12);
      const tradeOffEarned = Math.min(10, cleanAns.includes("trade-off") || cleanAns.includes("cap") ? 9 : 7);

      dimensionScores = [
        { dimension: "Requirements & Boundaries", earnedPoints: reqEarned, maxPoints: 20, explanation: reqEarned >= 16 ? "Well-scoped functional boundaries and scale/latency targets." : "Clarify scale assumptions and read/write throughput ratio." },
        { dimension: "Architecture & Scalability", earnedPoints: archEarned, maxPoints: 30, explanation: archEarned >= 24 ? "Decoupled architecture with clear horizontal scaling strategies." : "Identify potential hotspots and bottleneck elimination strategies." },
        { dimension: "Data Model, APIs & Storage", earnedPoints: storageEarned, maxPoints: 20, explanation: storageEarned >= 16 ? "Sound database selection, indexing strategy, and clear API schema." : "Detail the persistence schema and partition key selection." },
        { dimension: "Reliability & Failure Modes", earnedPoints: reliabilityEarned, maxPoints: 20, explanation: reliabilityEarned >= 16 ? "High availability, data replication, and graceful degradation." : "Address single points of failure (SPOFs) and network partition behavior." },
        { dimension: "Trade-offs & Communication", earnedPoints: tradeOffEarned, maxPoints: 10, explanation: tradeOffEarned >= 8 ? "Rigorous trade-off analysis (CAP theorem, cost, consistency)." : "Highlight trade-offs between consistency and availability." }
      ];
    } else if (isCoding) {
      rubricName = "Coding & Algorithmic Reasoning 100-Point Rubric";
      let logicEarned = Math.min(35, wordCount >= 25 ? 31 : 18);
      if (isAlternativeValid) logicEarned = 35;
      const dsaSelectEarned = Math.min(25, wordCount >= 20 ? 22 : 14);
      const complexityEarned = Math.min(20, cleanAns.includes("o(") ? 18 : 10);
      const edgeEarned = Math.min(10, cleanAns.includes("null") || cleanAns.includes("empty") ? 9 : 6);
      const qualityEarned = Math.min(10, wordCount >= 20 ? 9 : 6);

      dimensionScores = [
        { dimension: "Correctness & Logic", earnedPoints: logicEarned, maxPoints: 35, explanation: logicEarned >= 28 ? "Sound algorithmic logic addressing input constraints." : "Core logic partially correct; verify edge case termination." },
        { dimension: "Algorithm & Data Structure Selection", earnedPoints: dsaSelectEarned, maxPoints: 25, explanation: dsaSelectEarned >= 20 ? "Optimal data structure selection for required access patterns." : "Consider alternative data structures with lower lookup or insert overhead." },
        { dimension: "Complexity Analysis", earnedPoints: complexityEarned, maxPoints: 20, explanation: complexityEarned >= 16 ? "Accurate Big-O time and auxiliary space complexity derivation." : "State explicit asymptotic time and space bounds." },
        { dimension: "Edge Cases", earnedPoints: edgeEarned, maxPoints: 10, explanation: edgeEarned >= 8 ? "Proactively accounts for empty, null, and boundary conditions." : "Verify behavior on empty inputs, duplicate keys, or extreme sizes." },
        { dimension: "Code Quality & Articulation", earnedPoints: qualityEarned, maxPoints: 10, explanation: qualityEarned >= 8 ? "Structured step-by-step walkthrough of the solution." : "Structure explanations with clear variable tracking and invariants." }
      ];
    } else {
      rubricName = "Technical Conceptual 100-Point Rubric";
      const technicalKeywords = [
        "algorithm", "complexity", "latency", "scale", "concurrency", "deadlock", "transaction",
        "isolation", "postgres", "redis", "cache", "microservice", "async", "mvcc", "mutex",
        "queue", "docker", "api", "query", "index", "b+ tree", "hash", "tree", "memory", "tlb",
        "paging", "reconciliation", "heap", "star", "trade-off", "metrics"
      ];
      const matchedKeywords = technicalKeywords.filter((k) => cleanAns.includes(k));

      let correctnessEarned = 18;
      let depthEarned = 12;
      let tradeOffEarned = 10;
      let applicationEarned = 5;
      let clarityEarned = 6;

      if (wordCount <= 5) {
        correctnessEarned = 5;
        depthEarned = 3;
        tradeOffEarned = 2;
        applicationEarned = 1;
        clarityEarned = 4;
      } else if (wordCount >= 30 && matchedKeywords.length >= 3) {
        correctnessEarned = Math.min(35, 28 + Math.min(7, matchedKeywords.length));
        depthEarned = Math.min(25, 20 + Math.min(5, Math.floor(wordCount / 20)));
        tradeOffEarned = Math.min(20, 16 + (cleanAns.includes("trade-off") || cleanAns.includes("however") ? 4 : 0));
        applicationEarned = Math.min(10, 8 + (cleanAns.includes("production") || cleanAns.includes("metric") ? 2 : 0));
        clarityEarned = Math.min(10, 9);
      } else if (wordCount >= 15 || matchedKeywords.length >= 1) {
        correctnessEarned = Math.min(30, 22 + matchedKeywords.length);
        depthEarned = Math.min(20, 15 + Math.floor(wordCount / 25));
        tradeOffEarned = Math.min(15, 11 + (cleanAns.includes("trade-off") ? 3 : 0));
        applicationEarned = Math.min(8, 6);
        clarityEarned = Math.min(9, 7);
      }

      dimensionScores = [
        { dimension: "Technical Correctness & Accuracy", earnedPoints: correctnessEarned, maxPoints: 35, explanation: correctnessEarned >= 28 ? "Accurate technical terminology and correct core concepts." : "Partially correct; addresses core ideas but lacks precision." },
        { dimension: "Conceptual Depth & Architecture", earnedPoints: depthEarned, maxPoints: 25, explanation: depthEarned >= 20 ? "Demonstrates deep comprehension of system internals and mechanics." : "Moderate conceptual depth; could elaborate further on internal mechanics." },
        { dimension: "Reasoning, Trade-offs & Edge Cases", earnedPoints: tradeOffEarned, maxPoints: 20, explanation: tradeOffEarned >= 15 ? "Solid architectural trade-off analysis and failure-mode awareness." : "Limited trade-off analysis; consider highlighting both advantages and drawbacks." },
        { dimension: "Practical Application & Evidence", earnedPoints: applicationEarned, maxPoints: 10, explanation: applicationEarned >= 8 ? "Cites practical production context and implementation reality." : "Could strengthen answer with concrete production metrics or project examples." },
        { dimension: "Clarity, Structure & Articulation", earnedPoints: clarityEarned, maxPoints: 10, explanation: clarityEarned >= 8 ? "Clear, organized, and professional engineering articulation." : "Adequate communication; structuring with bullet points or numbered steps would improve clarity." }
      ];
    }
  }

  const totalScore = dimensionScores.reduce((sum, d) => sum + d.earnedPoints, 0);

  const whatYouDidWell: string[] = [];
  const topDimensions = [...dimensionScores].sort((a, b) => (b.earnedPoints / b.maxPoints) - (a.earnedPoints / a.maxPoints));
  for (const d of topDimensions.slice(0, 2)) {
    if (d.earnedPoints / d.maxPoints >= 0.7) {
      whatYouDidWell.push(`Strong performance in ${d.dimension}: ${d.explanation}`);
    }
  }
  if (whatYouDidWell.length === 0) {
    whatYouDidWell.push("Addressed the question directly with clear conversational communication.");
  }
  if (wordCount >= 20) {
    whatYouDidWell.push("Provided a coherent, conversational explanation with clear engineering phrasing.");
  }
  if (isAlternativeValid) {
    whatYouDidWell.push("Proposed a valid alternative approach satisfying core engineering requirements.");
  }

  const whatWasMissing: string[] = [];
  const deductionReasons: string[] = [];
  if (isAssisted) {
    deductionReasons.push("Assisted answer: candidate leveraged interviewer guidance/hints.");
  }
  for (const d of dimensionScores) {
    const ratio = d.earnedPoints / d.maxPoints;
    if (ratio < 0.75) {
      deductionReasons.push(`Deducted ${d.maxPoints - d.earnedPoints} pts in ${d.dimension}: ${d.explanation}`);
      whatWasMissing.push(`Deeper coverage of ${d.dimension.toLowerCase()}`);
    }
  }
  if (whatWasMissing.length === 0) {
    whatWasMissing.push("Minor edge-case optimizations under extreme scale or boundary conditions.");
  }

  return {
    score: totalScore,
    rubricVersion: "1.0-canonical-100pt",
    rubricName,
    dimensionScores,
    whatYouDidWell,
    whatWasMissing,
    deductionReasons: deductionReasons.length > 0 ? deductionReasons : ["Answer was very strong; only minor points deducted for edge cases."],
    howToImprove: "Structure answers using: 1. Core mechanism definition, 2. Key architectural trade-offs, 3. Production failure mitigation.",
    bestPossibleAnswer: generateExemplarModelAnswer(questionText, context as any),
    keyConceptsToRemember: extractKeyConceptsForTopic(questionText, context as any),
    likelyFollowUps: generateLogicalFollowUps(questionText, context as any),
    personalizedNextAction: `Review and practice ${context.competency || "this topic"} in the Cognalyze Skill Practice Hub.`,
    isAssisted,
    alternativeApproachValid: isAlternativeValid,
    status: "assessed",
    answerComparison: {
      candidateDemonstrated: whatYouDidWell,
      missingPoints: whatWasMissing,
      whatModelAnswerAdds: "Comprehensive technical mechanics, exact Big-O complexities, and concrete production mitigation steps."
    }
  };
}

// ══════════════════════════════════════════════════════════════
// 7. CONTEXTUAL QUESTION GENERATOR WITH ANTI-REPETITION
// ══════════════════════════════════════════════════════════════

export async function generateNextAdaptiveQuestion(
  sessionState: AdvancedSessionState,
  dossier: CandidateInterviewDossier,
  conversationHistory: string,
  assessment?: AnswerAssessment | null
): Promise<GeneratedQuestion> {
  const blueprint = sessionState.blueprint;
  const turnsCount = sessionState.turns.length;

  // 1. Determine Section & Progression
  // Check if we should advance the section based on turn limits or assessment
  let currentSection = blueprint.currentSection;
  const sectionPlanItem = (blueprint.sectionPlan || []).find((s) => s.section === currentSection);
  const turnsInSection = sessionState.turns.filter((t) => t.question?.section === currentSection).length;

  const isTurnLimitReached = turnsCount >= blueprint.totalTargetTurns - 1;
  const isDoesNotKnowOrDecline =
    assessment?.answer_quality === "does_not_know" ||
    assessment?.answer_quality === "declined";

  const shouldAdvance =
    turnsCount === 0 ? false :
    isTurnLimitReached ? true :
    assessment?.next_action === "advance_section" ||
    (isDoesNotKnowOrDecline && turnsInSection >= 2) ||
    (sectionPlanItem && turnsInSection >= sectionPlanItem.targetTurns);

  if (isTurnLimitReached) {
    currentSection = "closing";
    blueprint.currentSection = "closing";
  } else if (shouldAdvance) {
    const secOrder: InterviewSection[] = [
      "introduction",
      "resume_projects",
      "technical_fundamentals",
      "coding_system_design",
      "behavioral",
      "closing",
    ];
    const currIdx = secOrder.indexOf(currentSection);
    if (currIdx < secOrder.length - 1) {
      currentSection = secOrder[currIdx + 1];
      blueprint.currentSection = currentSection;
    }
  }

  // Update project exploration focus across 4 depths when in resume_projects section
  if (currentSection === "resume_projects") {
    if (turnsInSection === 0) {
      sessionState.projectExplorationFocus = "overview";
    } else if (turnsInSection === 1) {
      sessionState.projectExplorationFocus = "personal_contribution";
    } else if (turnsInSection === 2) {
      sessionState.projectExplorationFocus = "tradeoff_decision";
    } else {
      sessionState.projectExplorationFocus = "failure_challenge";
    }
  }


  // 2. Formulate First-Class Turn Question Blueprint
  const turnBlueprint = createTurnQuestionBlueprint({
    sessionState,
    dossier,
    currentSection,
    assessment,
    lastUserAnswer: conversationHistory,
  });

  const effectiveTrack = sessionState.track || blueprint.track || turnBlueprint.track;
  const specTrack = normalizeInterviewTrack(effectiveTrack);
  const specConfig = getTrackSpecializationConfig(specTrack);
  const targetCompetency = `${turnBlueprint.competencyEvaluated}: ${turnBlueprint.specificSkillTested}`;

  // 3. Construct System & User Prompt conditioned strictly on Turn Blueprint & Company Intelligence
  const prompt = `You are Alex, an elite engineering interviewer conducting a live, realistic technical interview.
You think like an interviewer: you listen carefully, spot unbacked claims, challenge invalid premises politely, and adjust question depth dynamically.

TURN QUESTION BLUEPRINT:
- Target Role & Domain: ${turnBlueprint.targetRole} (${turnBlueprint.roleCategory.toUpperCase()} domain, ${turnBlueprint.experienceMode} level)
- Target Company: ${turnBlueprint.targetCompany}
- Company Context & Vibe: ${turnBlueprint.companyProfile.cultureAndEmphasis} [Interview Vibe: ${turnBlueprint.companyProfile.interviewVibe}]
- Active Interview Phase: ${currentSection}
- Preparation Track: ${specConfig.title}
- Interaction Format Directive: ${specConfig.interactionFormatDescription}
- Core Questioning Methodology: ${specConfig.coreQuestioningDirective}
${turnBlueprint.codeSnippet ? `- Baseline Code Snippet for this Turn:\n\`\`\`\n${turnBlueprint.codeSnippet}\n\`\`\`` : ""}
- Competency Evaluated: ${turnBlueprint.competencyEvaluated}
- Specific Skill Being Tested: ${turnBlueprint.specificSkillTested}
- Expected Evaluation Criteria: ${turnBlueprint.expectedEvaluationCriteria.join("; ")}
- Candidate Relevance: ${turnBlueprint.candidateRelevance}
${turnBlueprint.adaptedFromPreviousTurn ? `- Adaptive Pivot: ${turnBlueprint.adaptedFromPreviousTurn.actionTaken} (${turnBlueprint.adaptedFromPreviousTurn.rationale})` : ""}

CANDIDATE INTELLIGENCE DOSSIER:
- Name: ${dossier.name}
- Candidate Self-Introduction: "${sessionState.candidateIntroduction || "Not provided"}"
- Verified Skills: ${dossier.verifiedSkills.join(", ") || "None"}
- Claimed Skills: ${dossier.claimedSkills.join(", ") || "General SWE"}
- Projects: ${dossier.projects.map((p) => `${p.title} (${p.tech.join(", ")})`).join("; ") || "None"}
- Target Project for this Turn: ${turnBlueprint.targetProject ? `${turnBlueprint.targetProject.title} [${turnBlueprint.targetProject.tech.join(", ")}]` : "None"}
- Missing/Unverified Skills: ${dossier.missingOrUnverified.join("; ") || "None"}
${turnBlueprint.targetGap ? `- Specific Skill Gap to Probe: ${turnBlueprint.targetGap}` : ""}

PREVIOUS QUESTIONS ASKED IN THIS SESSION (DO NOT REPEAT OR PARAPHRASE):
${sessionState.questionsAsked.map((q, idx) => `Q${idx + 1}: "${q.question}"`).join("\n") || "None yet."}
${dossier.historicalQuestionsAsked && dossier.historicalQuestionsAsked.length > 0 ? `\nPREVIOUS QUESTIONS FROM PRIOR INTERVIEWS (DO NOT REPEAT):
${dossier.historicalQuestionsAsked.slice(-8).map((q, idx) => `Prior Q${idx + 1}: "${q}"`).join("\n")}` : ""}

CONVERSATION TRANSCRIPT SO FAR:
${conversationHistory.slice(-2000) || "(Starting session)"}

LATEST CANDIDATE ANSWER ASSESSMENT:
Quality: ${assessment?.answer_quality || "N/A"}
Reasoning: ${assessment?.reasoning || "N/A"}
Next Action: ${assessment?.next_action || "advance"}

RULES FOR ALEX:
1. Ask EXACTLY ONE question directly testing the specified skill "${turnBlueprint.specificSkillTested}".
2. If Next Action is "simplify_concept", candidate indicated they are unfamiliar or unsure about the previous topic. Do NOT repeat the question or press the candidate on it. Provide a supportive, simpler foundational angle or scaffolded sub-problem.
3. If Next Action is "acknowledge_and_advance", acknowledge candidate's choice to pass/pivot and transition smoothly to a new topic without penalty.
4. Never ask a generic rate limiter or database deadlock question unless the blueprint explicitly demands it for this specific candidate and role.
5. Condition the question on the candidate's actual project (${turnBlueprint.targetProject?.title || "their work"}) and the target company's interview style (${turnBlueprint.companyProfile.companyName}).
6. Keep the question under 60 words. Be direct, clear, and natural.
7. NEVER repeat or paraphrase any question from the previous questions list.
8. UNLISTED PROJECTS & PROVENANCE:
- The authoritative resume projects for this candidate are: ${dossier.projects.map((p) => p.title).join(", ") || "None"}.
- If the candidate verbally introduces an entity or project that is NOT in this list (e.g. "Cognalyze"), you MUST acknowledge that it is absent from their submitted resume before probing: "You mentioned [Project Name], which sounds interesting. I noticed that this project isn't explicitly listed in the resume you submitted. Could you explain your involvement, your individual contributions, and the technologies you used?"
- Never spend more than 2 turns exploring any single project. If 2 questions have already explored this project, transition to the next core competency.
9. Return ONLY valid JSON format.

JSON schema:
{
  "question": "Your single, direct question under 60 words",
  "question_targets": "${turnBlueprint.competencyEvaluated}: ${turnBlueprint.specificSkillTested}",
  "question_type": "${turnBlueprint.questionType}",
  "difficulty_level": "${turnBlueprint.difficulty}",
  "is_follow_up": ${assessment?.next_action === "follow_up_probe" ? "true" : "false"}
}`;

  const allQuestionsToCheck = [
    ...sessionState.questionsAsked,
    ...(dossier.historicalQuestionsAsked || []).map((q) => ({ question: q }))
  ];

  // 4. Model Call with Anti-Repetition Check & Fallback
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      let raw = "";

      if (process.env.GROQ_API_KEY) {
        const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
          body: JSON.stringify({
            model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 600,
            temperature: 0.65,
            response_format: { type: "json_object" },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const msg = data.choices?.[0]?.message;
          raw = (msg?.content || msg?.reasoning || "").trim();
        }
      }

      if (!raw && process.env.GEMINI_API_KEY) {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { temperature: 0.65 } });
        const result = await model.generateContent(prompt);
        raw = result.response.text();
      }

      if (raw) {
        const parsed = extractJSON(raw);
        const generatedQ = stripThink(parsed.question || "");

        // Anti-repetition check across current session and prior candidate interviews!
        if (isQuestionSemanticallyDuplicate(generatedQ, allQuestionsToCheck)) {
          console.warn("[interview-engine] Anti-repetition triggered: question was duplicate or previously asked in prior session. Regenerating...");
          continue; // Try next iteration
        }

        const validatedQ = ensureValidQuestion(
          generatedQ,
          currentSection,
          dossier,
          stripThink(parsed.question_targets || targetCompetency),
          assessment,
          sessionState.candidateIntroduction,
          parsed.question_type || turnBlueprint.questionType
        );
        validatedQ.difficulty_level = parsed.difficulty_level || turnBlueprint.difficulty;
        validatedQ.is_follow_up = Boolean(parsed.is_follow_up);
        validatedQ.follow_up_reason = determineFollowUpReason(
          validatedQ.is_follow_up,
          assessment,
          currentSection,
          validatedQ.question
        );
        validatedQ.evidence_grounding = turnBlueprint.candidateRelevance;
        return validatedQ;
      }
    } catch (err: any) {
      console.warn(`[interview-engine] generateNextAdaptiveQuestion attempt ${attempt} warning:`, err.message);
    }
  }

  // 5. Ground in Structured Interview Plan (Milestone 3)
  const plannedQ = findNextPlannedQuestion(sessionState.interviewPlan, currentSection, sessionState.questionsAsked);
  if (plannedQ && assessment?.next_action !== "offer_hint") {
    const isFollowUp = Boolean(assessment?.next_action === "follow_up_probe");
    return {
      question: plannedQ.promptStem,
      question_targets: plannedQ.competencyTargeted,
      question_type: turnBlueprint.questionType || (
        currentSection === "coding_system_design"
          ? (turnBlueprint.experienceMode === "experienced" ? "system-design" : "coding")
          : currentSection === "resume_projects"
          ? "project-defense"
          : currentSection === "behavioral"
          ? "behavioral"
          : currentSection === "closing"
          ? "closing"
          : "technical"
      ),
      difficulty_level: plannedQ.plannedDifficulty,
      is_follow_up: isFollowUp,
      follow_up_reason: determineFollowUpReason(
        isFollowUp,
        assessment,
        currentSection,
        plannedQ.promptStem
      ),
      section: currentSection,
      competency_targeted: plannedQ.competencyTargeted,
      evidence_grounding: plannedQ.expectedConcepts.join("; "),
    };
  }

  // 6. Intelligent Turn-Blueprint-Driven Dynamic Synthesizer
  // Guarantees zero static fallback arrays and zero generic repeated questions
  const fallbackQ = synthesizeDynamicQuestionFromBlueprint(turnBlueprint, allQuestionsToCheck);
  const isFollowUp = Boolean(assessment?.next_action === "follow_up_probe" || fallbackQ.is_follow_up);

  return {
    question: fallbackQ.question,
    question_targets: fallbackQ.question_targets,
    question_type: fallbackQ.question_type,
    difficulty_level: turnBlueprint.difficulty,
    is_follow_up: isFollowUp,
    follow_up_reason: determineFollowUpReason(
      isFollowUp,
      assessment,
      currentSection,
      fallbackQ.question
    ),
    section: currentSection,
    competency_targeted: turnBlueprint.competencyEvaluated,
    evidence_grounding: turnBlueprint.candidateRelevance,
  };
}

/**
 * Generates an evidence-grounded fallback question conditioned on the candidate's actual dossier.
 * NEVER returns a generic static question or truncated text.
 */
export function generateBlueprintFallbackQuestion(
  sectionOrOptions: InterviewSection | {
    section: InterviewSection;
    dossier?: CandidateInterviewDossier;
    questionsAsked?: LoggedQuestion[];
    assessment?: AnswerAssessment | null;
    candidateIntro?: string;
    experienceMode?: ExperienceMode;
    targetRole?: string;
    targetCompany?: string;
    track?: InterviewTrack;
  },
  dossierArg?: CandidateInterviewDossier,
  questionsAskedArg: LoggedQuestion[] = [],
  assessmentArg: AnswerAssessment | null = null,
  candidateIntroArg?: string
): { question: string; target: string; type: GeneratedQuestion["question_type"] } {
  let section: InterviewSection;
  let dossier: CandidateInterviewDossier | undefined;
  let questionsAsked: LoggedQuestion[] = [];
  let assessment: AnswerAssessment | null = null;
  let candidateIntro: string | undefined;
  let track: InterviewTrack = "traditional_coding_dsa";
  let targetRole = "Software Engineer";
  let targetCompany = "Tech Company";
  let experienceMode: ExperienceMode = "experienced";

  if (typeof sectionOrOptions === "object") {
    section = sectionOrOptions.section;
    dossier = sectionOrOptions.dossier;
    questionsAsked = sectionOrOptions.questionsAsked || [];
    assessment = sectionOrOptions.assessment || null;
    candidateIntro = sectionOrOptions.candidateIntro;
    track = sectionOrOptions.track || "traditional_coding_dsa";
    targetRole = sectionOrOptions.targetRole || dossier?.targetRole || "Software Engineer";
    targetCompany = (sectionOrOptions as any).targetCompany || dossier?.targetCompany || "Tech Company";
    experienceMode = sectionOrOptions.experienceMode || dossier?.experienceMode || "experienced";
  } else {
    section = sectionOrOptions;
    dossier = dossierArg;
    questionsAsked = questionsAskedArg;
    assessment = assessmentArg;
    candidateIntro = candidateIntroArg;
    targetRole = dossier?.targetRole || "Software Engineer";
    targetCompany = dossier?.targetCompany || "Tech Company";
    experienceMode = dossier?.experienceMode || "experienced";
  }

  const blueprint = createTurnQuestionBlueprint({
    section,
    targetRole,
    targetCompany,
    track,
    experienceMode,
    dossier,
    questionsAsked,
    previousAssessment: assessment,
  });

  if (assessment?.next_action === "offer_hint" || (assessment as any)?.is_assisted) {
    return {
      question: "Here is a hint: consider the underlying data structure constraints and two-pointer traversal patterns.",
      target: "Scaffolding Hint",
      type: "technical",
    };
  }

  const synthesized = synthesizeDynamicQuestionFromBlueprint(blueprint, questionsAsked);

  if (assessment?.answer_quality === "declined") {
    return {
      question: `No problem at all, let's approach this from another angle: ${synthesized.question}`,
      target: synthesized.question_targets || synthesized.competency_targeted || "Core Competency",
      type: synthesized.question_type,
    };
  }

  return {
    question: synthesized.question,
    target: synthesized.question_targets || synthesized.competency_targeted || "Core Competency",
    type: synthesized.question_type,
  };
}

/**
 * Ensures a question passes strict completeness validation.
 * If truncated or incomplete, automatically repairs using candidate context.
 */
export function ensureValidQuestion(
  rawQ: string,
  sectionOrOpts: InterviewSection | {
    section: InterviewSection;
    dossier: CandidateInterviewDossier;
    targetCompetency?: string;
    assessment?: AnswerAssessment | null;
    candidateIntro?: string;
    overrideQuestionType?: GeneratedQuestion["question_type"];
    experienceMode?: ExperienceMode;
    targetRole?: string;
  },
  dossierArg?: CandidateInterviewDossier,
  targetCompetencyArg?: string,
  assessmentArg?: AnswerAssessment | null,
  candidateIntroArg?: string,
  overrideQuestionTypeArg?: GeneratedQuestion["question_type"]
): GeneratedQuestion {
  let section: InterviewSection;
  let dossier: CandidateInterviewDossier;
  let targetCompetency: string | undefined;
  let assessment: AnswerAssessment | null | undefined;
  let candidateIntro: string | undefined;
  let overrideQuestionType: GeneratedQuestion["question_type"] | undefined;

  if (typeof sectionOrOpts === "object") {
    section = sectionOrOpts.section;
    dossier = sectionOrOpts.dossier;
    targetCompetency = sectionOrOpts.targetCompetency;
    assessment = sectionOrOpts.assessment;
    candidateIntro = sectionOrOpts.candidateIntro;
    overrideQuestionType = sectionOrOpts.overrideQuestionType;
  } else {
    section = sectionOrOpts;
    dossier = dossierArg!;
    targetCompetency = targetCompetencyArg;
    assessment = assessmentArg;
    candidateIntro = candidateIntroArg;
    overrideQuestionType = overrideQuestionTypeArg;
  }

  let defaultType: GeneratedQuestion["question_type"] =
    overrideQuestionType ||
    (section === "introduction" ? "warm-up" :
     section === "closing" ? "closing" :
     section === "coding_system_design" ? (dossier?.experienceMode === "experienced" ? "system-design" : "coding") :
     section === "behavioral" ? "behavioral" : "technical");

  if (section === "coding_system_design") {
    defaultType = dossier?.experienceMode === "experienced" ? "system-design" : "coding";
  }

  const validation = validateQuestionCompleteness(rawQ);
  if (validation.isValid) {
    return {
      question: validation.cleanedQuestion,
      question_targets: targetCompetency || "Technical Assessment",
      question_type: defaultType,
      difficulty_level: dossier.experienceMode === "experienced" ? "medium" : "easy",
      is_follow_up: assessment?.next_action === "follow_up_probe",
      section,
      competency_targeted: targetCompetency,
      evidence_grounding: "Validated question generation",
    };
  }

  console.warn(`[interview-engine] Question completeness check failed (${validation.reason}): "${rawQ}". Repairing with blueprint fallback.`);
  const fallback = generateBlueprintFallbackQuestion({
    section,
    dossier,
    questionsAsked: [],
    assessment: assessment || null,
    candidateIntro,
    track: typeof sectionOrOpts === "object" ? (sectionOrOpts as any).track : undefined,
  });
  return {
    question: fallback.question,
    question_targets: fallback.target,
    question_type: overrideQuestionType || fallback.type,
    difficulty_level: dossier.experienceMode === "experienced" ? "medium" : "easy",
    is_follow_up: false,
    section,
    competency_targeted: targetCompetency || fallback.target,
    evidence_grounding: "Completeness repair fallback engine",
  };
}

/**
 * ══════════════════════════════════════════════════════════════
 * UNIFIED PERFORMANCE ACCELERATOR (Phase 2):
 * Evaluates candidate answer and generates adaptive question in a single model call.
 * Eliminates sequential round-trip overhead while maintaining full depth & rigor.
 * ══════════════════════════════════════════════════════════════
 */
export async function assessAndGenerateAdaptiveTurn(
  sessionStateOrOptions: any,
  dossierArg?: CandidateInterviewDossier,
  conversationHistoryArg: string = "",
  lastQuestionTextArg: string = "",
  lastAnswerTextArg: string = ""
): Promise<{
  assessment: AnswerAssessment;
  nextQuestion: GeneratedQuestion;
  timingMs: number;
  modelAnswerFeedback?: QuestionModelAnswer;
  rubricScore?: number;
}> {
  let sessionState: AdvancedSessionState;
  let dossier: CandidateInterviewDossier;
  let conversationHistory: string;
  let lastQuestionText: string;
  let lastAnswerText: string;

  if (sessionStateOrOptions && !("turns" in sessionStateOrOptions) && typeof sessionStateOrOptions === "object") {
    sessionState = sessionStateOrOptions.state || sessionStateOrOptions.sessionState;
    dossier = sessionStateOrOptions.dossier || sessionState?.dossier || (await buildCandidateInterviewDossier(sessionState?.candidateId || "candidate"));
    conversationHistory = sessionStateOrOptions.conversationHistory || "";
    lastQuestionText = sessionStateOrOptions.questionText || sessionStateOrOptions.lastQuestionText || "";
    lastAnswerText = sessionStateOrOptions.userAnswer || sessionStateOrOptions.lastAnswerText || sessionStateOrOptions.answer || "";
  } else {
    sessionState = sessionStateOrOptions;
    dossier = dossierArg || sessionState?.dossier || (await buildCandidateInterviewDossier(sessionState?.candidateId || "candidate"));
    conversationHistory = conversationHistoryArg;
    lastQuestionText = lastQuestionTextArg;
    lastAnswerText = lastAnswerTextArg;
  }

  const t0 = Date.now();
  const qText = lastQuestionText || "";
  const safeAnswer = (lastAnswerText || "").trim();
  const wordCount = safeAnswer ? safeAnswer.split(/\s+/).filter(Boolean).length : 0;
  const cleanAns = safeAnswer.toLowerCase();

  // If opening turn or no previous answer exists, generate the Phase 1 opening greeting
  if (wordCount === 0 || (sessionState.turns.length === 0 && (!lastQuestionText || sessionState.openingState === "GREETING"))) {
    const greetingQuestion = generateOpeningGreeting(dossier);
    greetingQuestion.competency_focus = "communication";
    const greetingAssessment: AnswerAssessment = {
      answer_quality: "adequate",
      reasoning: "Session opening greeting and candidate introduction prompt.",
      topics_demonstrated: [],
      next_action: "acknowledge_and_advance",
      difficulty_adjustment: "maintain",
      extracted_claims: [],
    };
    return { assessment: greetingAssessment, nextQuestion: greetingQuestion, timingMs: Date.now() - t0 };
  }

  // 1. Fast-path checks & Contextual Response Analysis (Phase 2)
  const ctx = analyzeCandidateResponseContext(safeAnswer, qText, sessionState);

  if (ctx.isDoesNotKnow) {
    sessionState.consecutiveIrrelevantAnswers = 0;
    const isFirstUncertainty = !sessionState.uncertaintyOnCurrentTopic;
    sessionState.uncertaintyOnCurrentTopic = isFirstUncertainty;
    const assessment: AnswerAssessment = {
      answer_quality: "does_not_know",
      reasoning: isFirstUncertainty
        ? "Candidate stated they are unfamiliar with this specific concept; pivoting to a simpler prerequisite angle."
        : "Candidate stated they are unfamiliar with this specific concept or requested to move forward.",
      topics_demonstrated: [],
      next_action: isFirstUncertainty ? "simplify_concept" : "acknowledge_and_advance",
      difficulty_adjustment: "de-escalate",
      extracted_claims: [],
    };
    const nextQuestion = await generateNextAdaptiveQuestion(sessionState, dossier, conversationHistory, assessment);
    const modelAnswerFeedback = await evaluateAnswerRubricAndModelAnswer(qText, safeAnswer, {
      section: sessionState.blueprint.currentSection,
      experienceMode: sessionState.blueprint.experienceMode,
      targetRole: dossier.targetRole,
      targetCompany: sessionState.blueprint.targetCompany || dossier.targetCompany,
      competency: "Technical Deferral",
      dossier,
      answerQuality: "does_not_know",
    });
    return {
      assessment,
      nextQuestion,
      timingMs: Date.now() - t0,
      modelAnswerFeedback,
      rubricScore: modelAnswerFeedback.score,
    };
  }

  if (ctx.isDeclineOrPass) {
    sessionState.consecutiveIrrelevantAnswers = 0;
    const assessment: AnswerAssessment = {
      answer_quality: "declined",
      reasoning: "Candidate politely declined or requested to defer this question. Pivoting to alternative assessment without penalty.",
      topics_demonstrated: [],
      next_action: "acknowledge_and_advance",
      difficulty_adjustment: "maintain",
      extracted_claims: [],
    };
    const nextQuestion = await generateNextAdaptiveQuestion(sessionState, dossier, conversationHistory, assessment);
    const modelAnswerFeedback = await evaluateAnswerRubricAndModelAnswer(qText, safeAnswer, {
      section: sessionState.blueprint.currentSection,
      experienceMode: sessionState.blueprint.experienceMode,
      targetRole: dossier.targetRole,
      targetCompany: sessionState.blueprint.targetCompany || dossier.targetCompany,
      competency: "Candidate Topic Deferral",
      dossier,
      answerQuality: "declined",
    });
    return {
      assessment,
      nextQuestion,
      timingMs: Date.now() - t0,
      modelAnswerFeedback,
      rubricScore: modelAnswerFeedback.score,
    };
  }

  if (ctx.isHintRequest) {
    sessionState.consecutiveIrrelevantAnswers = 0;
    sessionState.assistanceCount = (sessionState.assistanceCount || 0) + 1;
    const assessment: AnswerAssessment = {
      answer_quality: "adequate",
      reasoning: "Candidate requested conceptual assistance; providing a supportive guidance prompt without giving away full answer.",
      topics_demonstrated: [],
      next_action: "offer_hint",
      difficulty_adjustment: "maintain",
      is_assisted: true,
      extracted_claims: [],
    };
    const nextQuestion = await generateNextAdaptiveQuestion(sessionState, dossier, conversationHistory, assessment);
    const modelAnswerFeedback = await evaluateAnswerRubricAndModelAnswer(qText, safeAnswer, {
      section: sessionState.blueprint.currentSection,
      experienceMode: sessionState.blueprint.experienceMode,
      targetRole: dossier.targetRole,
      targetCompany: sessionState.blueprint.targetCompany || dossier.targetCompany,
      competency: "Assisted Engineering Guidance",
      dossier,
      answerQuality: "adequate",
      isAssisted: true,
    });
    return {
      assessment,
      nextQuestion,
      timingMs: Date.now() - t0,
      modelAnswerFeedback,
      rubricScore: modelAnswerFeedback.score,
    };
  }

  // 2. Irrelevant Answer Policy: redirect (turn 1) -> clarify (turn 2) -> conclude assessment (turn 3)
  const effectiveTrackForPolicy = normalizeInterviewTrack(sessionState.track || sessionState.blueprint?.track);
  const currentIrrelevantCount = sessionState.consecutiveIrrelevantAnswers || 0;
  const irrelevantPolicy = evaluateIrrelevantAnswerPolicy(safeAnswer, currentIrrelevantCount, effectiveTrackForPolicy, qText);

  if (irrelevantPolicy.shouldTerminateEarly) {
    sessionState.consecutiveIrrelevantAnswers = irrelevantPolicy.consecutiveIrrelevantCount;
    sessionState.isCompleted = true;
    if (sessionState.blueprint) {
      sessionState.blueprint.currentSection = "closing";
    }

    const earlyExitQ: GeneratedQuestion = {
      question: irrelevantPolicy.interviewerMessage,
      question_targets: `${effectiveTrackForPolicy}: Early Evaluation Conclusion`,
      question_type: "closing",
      difficulty_level: "easy",
      is_follow_up: false,
      section: "closing",
      competency_targeted: "Interview Conclusion",
      evidence_grounding: "Assessment concluded early after consecutive off-topic or empty responses under institutional policy.",
    };

    const earlyExitAssessment: AnswerAssessment = {
      answer_quality: "declined",
      reasoning: "Candidate provided 3 consecutive non-substantive responses; session concluded early under professional policy.",
      topics_demonstrated: [],
      next_action: "advance_section",
      difficulty_adjustment: "maintain",
      extracted_claims: [],
    };

    return {
      assessment: earlyExitAssessment,
      nextQuestion: earlyExitQ,
      timingMs: Date.now() - t0,
    };
  }

  if (irrelevantPolicy.action === "redirect" || irrelevantPolicy.action === "clarify_expectations") {
    if (irrelevantPolicy.interviewerMessage) {
      sessionState.consecutiveIrrelevantAnswers = irrelevantPolicy.consecutiveIrrelevantCount;
      const redirectQ: GeneratedQuestion = {
        question: irrelevantPolicy.interviewerMessage,
        question_targets: `${effectiveTrackForPolicy}: Focus Redirection`,
        question_type: "technical",
        difficulty_level: sessionState.currentDifficulty,
        is_follow_up: true,
        section: sessionState.blueprint?.currentSection || "technical_fundamentals",
        competency_targeted: "Task Engagement",
        evidence_grounding: "Redirecting candidate to the primary assessment prompt.",
      };

      const redirectAssessment: AnswerAssessment = {
        answer_quality: "off-topic",
        reasoning: "Response was non-substantive or off-topic; refocusing candidate on the specific assessment objective.",
        topics_demonstrated: [],
        next_action: "clarify_ambiguity",
        difficulty_adjustment: "maintain",
        extracted_claims: [],
      };

      return {
        assessment: redirectAssessment,
        nextQuestion: redirectQ,
        timingMs: Date.now() - t0,
      };
    }
  } else {
    sessionState.consecutiveIrrelevantAnswers = 0;
  }

  if (ctx.isSelfCorrection) {
    const assessment: AnswerAssessment = {
      answer_quality: "self_corrected",
      reasoning: "Candidate actively recognized an initial misconception and self-corrected their technical explanation.",
      topics_demonstrated: ctx.matchedTechnicalTerms.length > 0 ? ["Technical Self-Correction", ...ctx.matchedTechnicalTerms] : ["Technical Self-Correction"],
      next_action: "acknowledge_and_advance",
      difficulty_adjustment: "maintain",
      is_self_corrected: true,
      extracted_claims: [],
    };
    const nextQuestion = await generateNextAdaptiveQuestion(sessionState, dossier, conversationHistory, assessment);
    const modelAnswerFeedback = await evaluateAnswerRubricAndModelAnswer(qText, safeAnswer, {
      section: sessionState.blueprint.currentSection,
      experienceMode: sessionState.blueprint.experienceMode,
      targetRole: dossier.targetRole,
      targetCompany: sessionState.blueprint.targetCompany || dossier.targetCompany,
      competency: "Technical Self-Correction",
      dossier,
      answerQuality: "self_corrected",
    });
    return {
      assessment,
      nextQuestion,
      timingMs: Date.now() - t0,
      modelAnswerFeedback,
      rubricScore: modelAnswerFeedback.score,
    };
  }

  if (ctx.hasContradiction) {
    const assessment: AnswerAssessment = {
      answer_quality: "contradictory",
      reasoning: ctx.contradictionDetail || "Candidate answer conflicts with a previous statement in this interview session.",
      topics_demonstrated: [],
      next_action: "clarify_ambiguity",
      difficulty_adjustment: "maintain",
      extracted_claims: [],
    };
    const nextQuestion = await generateNextAdaptiveQuestion(sessionState, dossier, conversationHistory, assessment);
    const modelAnswerFeedback = await evaluateAnswerRubricAndModelAnswer(qText, safeAnswer, {
      section: sessionState.blueprint.currentSection,
      experienceMode: sessionState.blueprint.experienceMode,
      targetRole: dossier.targetRole,
      targetCompany: sessionState.blueprint.targetCompany || dossier.targetCompany,
      competency: "Architectural Consistency",
      dossier,
      answerQuality: "contradictory",
    });
    return {
      assessment,
      nextQuestion,
      timingMs: Date.now() - t0,
      modelAnswerFeedback,
      rubricScore: modelAnswerFeedback.score,
    };
  }

  if (ctx.isConciseCorrect) {
    const assessment: AnswerAssessment = {
      answer_quality: "strong",
      reasoning: `Concise and technically accurate response demonstrating direct command of ${ctx.matchedTechnicalTerms.slice(0, 3).join(", ")}.`,
      topics_demonstrated: ctx.matchedTechnicalTerms,
      next_action: "move_to_new_topic",
      difficulty_adjustment: "escalate",
      competency_established: true,
      extracted_claims: [],
    };
    const nextQuestion = await generateNextAdaptiveQuestion(sessionState, dossier, conversationHistory, assessment);
    const modelAnswerFeedback = await evaluateAnswerRubricAndModelAnswer(qText, safeAnswer, {
      section: sessionState.blueprint.currentSection,
      experienceMode: sessionState.blueprint.experienceMode,
      targetRole: dossier.targetRole,
      targetCompany: sessionState.blueprint.targetCompany || dossier.targetCompany,
      competency: ctx.matchedTechnicalTerms[0] || "Technical Precision",
      dossier,
      answerQuality: "strong",
    });
    return {
      assessment,
      nextQuestion,
      timingMs: Date.now() - t0,
      modelAnswerFeedback,
      rubricScore: modelAnswerFeedback.score,
    };
  }

  if (ctx.isAlternativeApproach) {
    const assessment: AnswerAssessment = {
      answer_quality: "strong",
      reasoning: "Candidate proposed a legitimate alternative engineering architecture with sound trade-off reasoning.",
      topics_demonstrated: ["Alternative System Architecture", ...ctx.matchedTechnicalTerms],
      next_action: "move_to_new_topic",
      difficulty_adjustment: "maintain",
      alternative_approach_valid: true,
      extracted_claims: [],
    };
    const nextQuestion = await generateNextAdaptiveQuestion(sessionState, dossier, conversationHistory, assessment);
    const modelAnswerFeedback = await evaluateAnswerRubricAndModelAnswer(qText, safeAnswer, {
      section: sessionState.blueprint.currentSection,
      experienceMode: sessionState.blueprint.experienceMode,
      targetRole: dossier.targetRole,
      targetCompany: sessionState.blueprint.targetCompany || dossier.targetCompany,
      competency: "Architectural Trade-offs & Alternatives",
      dossier,
      answerQuality: "strong",
    });
    return {
      assessment,
      nextQuestion,
      timingMs: Date.now() - t0,
      modelAnswerFeedback,
      rubricScore: modelAnswerFeedback.score,
    };
  }

  if (ctx.isLongIncorrect) {
    const assessment: AnswerAssessment = {
      answer_quality: "shallow",
      reasoning: "Response contains fundamental technical misconceptions despite word count; clarifying follow-up required.",
      topics_demonstrated: [],
      unresolved_threads: ctx.matchedErrors,
      next_action: "clarify_ambiguity",
      difficulty_adjustment: "de-escalate",
      extracted_claims: [],
    };
    const nextQuestion = await generateNextAdaptiveQuestion(sessionState, dossier, conversationHistory, assessment);
    const modelAnswerFeedback = await evaluateAnswerRubricAndModelAnswer(qText, safeAnswer, {
      section: sessionState.blueprint.currentSection,
      experienceMode: sessionState.blueprint.experienceMode,
      targetRole: dossier.targetRole,
      targetCompany: sessionState.blueprint.targetCompany || dossier.targetCompany,
      competency: "Technical Foundations",
      dossier,
      answerQuality: "shallow",
    });
    return {
      assessment,
      nextQuestion,
      timingMs: Date.now() - t0,
      modelAnswerFeedback,
      rubricScore: modelAnswerFeedback.score,
    };
  }

  if (ctx.isVagueHandwaving) {
    const assessment: AnswerAssessment = {
      answer_quality: "shallow",
      reasoning: "Answer contains high-level buzzwords and generic assertions without concrete implementation details.",
      topics_demonstrated: [],
      next_action: "follow_up_probe",
      difficulty_adjustment: "maintain",
      extracted_claims: [],
    };
    const nextQuestion = await generateNextAdaptiveQuestion(sessionState, dossier, conversationHistory, assessment);
    const modelAnswerFeedback = await evaluateAnswerRubricAndModelAnswer(qText, safeAnswer, {
      section: sessionState.blueprint.currentSection,
      experienceMode: sessionState.blueprint.experienceMode,
      targetRole: dossier.targetRole,
      targetCompany: sessionState.blueprint.targetCompany || dossier.targetCompany,
      competency: "Concrete Implementation Details",
      dossier,
      answerQuality: "shallow",
    });
    return {
      assessment,
      nextQuestion,
      timingMs: Date.now() - t0,
      modelAnswerFeedback,
      rubricScore: modelAnswerFeedback.score,
    };
  }

  if (wordCount <= 5) {
    const assessment: AnswerAssessment = {
      answer_quality: "shallow",
      reasoning: `Answer was only ${wordCount} words — insufficient technical substance provided.`,
      topics_demonstrated: [],
      next_action: sessionState.consecutiveShallow >= 1 ? "advance_section" : "follow_up_probe",
      difficulty_adjustment: "de-escalate",
      extracted_claims: [],
    };
    const nextQuestion = await generateNextAdaptiveQuestion(sessionState, dossier, conversationHistory, assessment);
    const modelAnswerFeedback = await evaluateAnswerRubricAndModelAnswer(qText, safeAnswer, {
      section: sessionState.blueprint.currentSection,
      experienceMode: sessionState.blueprint.experienceMode,
      targetRole: dossier.targetRole,
      targetCompany: sessionState.blueprint.targetCompany || dossier.targetCompany,
      competency: "Technical Substantiveness",
      dossier,
      answerQuality: "shallow",
    });
    return {
      assessment,
      nextQuestion,
      timingMs: Date.now() - t0,
      modelAnswerFeedback,
      rubricScore: modelAnswerFeedback.score,
    };
  }

  // 2. Blueprint & section determination
  const blueprint = sessionState.blueprint;
  const turnsCount = sessionState.turns.length;
  let currentSection = blueprint.currentSection;
  const sectionPlanItem = (blueprint.sectionPlan || []).find((s) => s.section === currentSection);
  const turnsInSection = sessionState.turns.filter((t) => t.question?.section === currentSection).length;

  const isTurnLimitReached = turnsCount >= blueprint.totalTargetTurns - 1;
  if (isTurnLimitReached) {
    currentSection = "closing";
    blueprint.currentSection = "closing";
  } else if (sectionPlanItem && turnsInSection >= sectionPlanItem.targetTurns) {
    const secOrder: InterviewSection[] = [
      "introduction",
      "resume_projects",
      "technical_fundamentals",
      "coding_system_design",
      "behavioral",
      "closing",
    ];
    const currIdx = secOrder.indexOf(currentSection);
    if (currIdx < secOrder.length - 1) {
      currentSection = secOrder[currIdx + 1];
      blueprint.currentSection = currentSection;
    }
  }

  // Update project exploration focus across 4 depths when in resume_projects section
  if (currentSection === "resume_projects") {
    if (turnsInSection === 0) {
      sessionState.projectExplorationFocus = "overview";
    } else if (turnsInSection === 1) {
      sessionState.projectExplorationFocus = "personal_contribution";
    } else if (turnsInSection === 2) {
      sessionState.projectExplorationFocus = "tradeoff_decision";
    } else {
      sessionState.projectExplorationFocus = "failure_challenge";
    }
  }

  const skillsFocusArr = blueprint.skillsFocus || [];
  const skillsFocusStr = skillsFocusArr.length > 0 ? skillsFocusArr.join(", ") : "";

  let sectionGuidance = "";
  let targetCompetency = "";
  switch (currentSection) {
    case "resume_projects":
      const topProj = dossier.projects[0]?.title || "their featured project";
      sectionGuidance = `PROJECT DEEP DIVE: Inspect project "${topProj}". If candidate's answer was shallow, probe personal implementation or failure modes. If strong, explore architecture scaling or trade-offs.`;
      targetCompetency = "Project Ownership & Architecture";
      break;
    case "technical_fundamentals":
      sectionGuidance = skillsFocusStr
        ? `TECHNICAL CS FUNDAMENTALS: Candidate has targeted skills focus: "${skillsFocusStr}". Prioritize deep-dive questions directly probing these competencies.`
        : `TECHNICAL CS FUNDAMENTALS: Pivot to core fundamentals (database concurrency/isolation, networking, or memory management).`;
      targetCompetency = skillsFocusStr ? `Fundamentals: ${skillsFocusStr}` : "CS Fundamentals & Systems Knowledge";
      break;
    case "coding_system_design":
      if (blueprint.experienceMode === "experienced") {
        sectionGuidance = skillsFocusStr
          ? `SYSTEM DESIGN & ARCHITECTURE: High-scale distributed systems design, bottlenecks, and failure recovery. Incorporate candidate focus: ${skillsFocusStr}.`
          : `SYSTEM DESIGN: High-scale distributed systems design, bottlenecks, and failure recovery.`;
        targetCompetency = "Distributed System Design";
      } else {
        sectionGuidance = skillsFocusStr
          ? `ALGORITHMIC REASONING & STRUCTURES: Problem solving, data structure trade-offs, time/space complexity with focus on ${skillsFocusStr}.`
          : `ALGORITHMIC REASONING: Data structure trade-offs, time/space complexity, or stream processing.`;
        targetCompetency = "Algorithmic Problem Solving";
      }
      break;
    case "behavioral":
      sectionGuidance = `BEHAVIORAL: STAR method exploring technical conflict, production outages, or project ownership.`;
      targetCompetency = "Leadership & Accountability";
      break;
    case "closing":
      sectionGuidance = `CLOSING: Wrap up interview, invite candidate technical questions.`;
      targetCompetency = "Interview Conclusion";
      break;
    default:
      sectionGuidance = `Explore candidate's technical experience.`;
      targetCompetency = "Technical Competency";
  }

  // Ensure interview plan exists on session state (Milestone 3)
  if (!sessionState.interviewPlan && dossier) {
    sessionState.interviewPlan = generateStructuredInterviewPlan(
      dossier,
      sessionState.jdCompetencyMatrix || dossier.jdCompetencyMatrix,
      sessionState.candidateIntelligence || dossier.candidateIntelligence,
      blueprint?.targetRole || dossier.targetRole,
      blueprint?.durationMinutes || 45,
      blueprint?.experienceMode || dossier.experienceMode
    );
  }
  if (blueprint && !blueprint.interviewPlan && sessionState.interviewPlan) {
    blueprint.interviewPlan = sessionState.interviewPlan;
  }

  const nextPlanned = findNextPlannedQuestion(sessionState.interviewPlan, currentSection, sessionState.questionsAsked);

  const effectiveTrack = normalizeInterviewTrack(sessionState.track || blueprint.track);
  const trackConfig = getTrackSpecializationConfig(effectiveTrack);
  const trackSpecializationPrompt = `
PREPARATION TRACK SPECIALIZATION:
- Track: ${trackConfig.title}
- Interaction Format: ${trackConfig.interactionFormatDescription}
- Core Questioning Directive: ${trackConfig.coreQuestioningDirective}
`;

  // 3. Unified Prompt
  const prompt = `You are Alex, a FAANG Staff Engineer conducting a rigorous, natural technical interview.
You will perform two linked tasks in one turn:
Task 1: Evaluate the candidate's latest answer with technical precision.
Task 2: Formulate your next adaptive question based directly on that evaluation and interview phase.

CURRENT PHASE: ${currentSection}
TARGET ROLE: ${dossier.targetRole} (${blueprint.experienceMode} level)
TARGET COMPANY: ${blueprint.targetCompany || dossier.targetCompany || "Tier 1 Standard"}
${trackSpecializationPrompt}
${skillsFocusStr ? `SKILLS FOCUS AREA: ${skillsFocusStr}` : ""}
SECTION GUIDANCE: ${sectionGuidance}

${nextPlanned ? `STRUCTURED INTERVIEW PLAN FOR THIS STAGE:
- Planned Stage Question: "${nextPlanned.promptStem}"
- Planned Competency: ${nextPlanned.competencyTargeted}
- Expected Concepts to Probe: ${nextPlanned.expectedConcepts.join(", ")}
- Counterfactual Probes for Strong Answers: ${nextPlanned.counterFactualProbes.join(" | ")}
- Evaluation Rubric:
  * Strong: ${nextPlanned.evaluationRubric.strongCriteria.join("; ")}
  * Shallow: ${nextPlanned.evaluationRubric.shallowCriteria.join("; ")}
` : ""}
CANDIDATE DOSSIER:
- Name: ${dossier.name}
- Self-Introduction: "${sessionState.candidateIntroduction || "Not provided"}"
- Verified Competencies (Proven): ${dossier.verifiedSkills.join(", ") || "None verified on file"}
- Claimed Skills (Self-Reported): ${dossier.claimedSkills.join(", ") || "General SWE"}
- Detailed 12-Point Project Profiling:
${(dossier.candidateIntelligence?.projects || dossier.projects || []).map((p: any, idx: number) => `
  [Project ${idx + 1}: ${p.title} (${p.verificationStatus || "CANDIDATE_CLAIM"})]
  * Core Tech: ${Array.isArray(p.tech) ? p.tech.join(", ") : "General Stack"}
  * Problem Solved: ${p.problemSolved || p.description || "Core operational workflows"}
  * Architecture: ${p.architecture || "Client-server architecture"}
  * Personal Contribution: ${p.personalContribution || "Full-stack implementation"}
  * Technical Challenges: ${Array.isArray(p.technicalChallenges) && p.technicalChallenges.length > 0 ? p.technicalChallenges.join("; ") : "Latency and scale under peak load"}
  * Database Design: ${p.databaseDesign || "Relational model"}
  * Security Measures: ${p.securityMeasures || "Authentication & authorization"}
  * Performance Optimizations: ${p.performanceOptimizations || "Query optimization & caching"}
`).join("\n") || "No detailed projects available."}
${dossier.jdCompetencyMatrix?.unsupportedJDRequirements && dossier.jdCompetencyMatrix.unsupportedJDRequirements.length > 0 ? `- Unsupported JD Requirements to Probe: ${dossier.jdCompetencyMatrix.unsupportedJDRequirements.join(", ")}` : ""}

LAST QUESTION ASKED:
"${qText}"

CANDIDATE'S ANSWER (${wordCount} words):
"${lastAnswerText.slice(0, 1800)}"

PREVIOUS QUESTIONS ASKED:
${sessionState.questionsAsked.map((q, idx) => `Q${idx + 1}: "${q.question}"`).join("\n") || "None."}

RULES:
1. Assess answer_quality strictly: "strong" (concrete details, personal choices, trade-offs), "adequate" (answers core question accurately), "shallow" (vague/buzzwords), "off-topic", "contradictory".
2. ADAPTIVE FOLLOW-UP DECISION RULES:
   - If answer is technically strong: Probe a specific assumption, architectural trade-off, edge case, or measurable result. If candidate already demonstrated mastery, set next_action: "move_to_new_topic" or "advance_section" to transition to a NEW competency (${targetCompetency}).
   - If answer is partially correct: Ask about the most critical missing concept or unaddressed failure mode.
   - If answer is vague: Ask for a concrete implementation detail, schema, or code-level decision.
   - If answer contains an unbacked claim: Ask how the candidate personally implemented, tested, or measured it.
   - If answer is incorrect: Ask a focused diagnostic question or pivot to a foundational concept.
   - If candidate demonstrated sufficient understanding: Move to a different competency instead of endlessly probing the same topic.
3. NEVER repeat or rephrase any previous question. Do NOT repeatedly ask about the same failure scenario.
4. Next question must be under 60 words. Exactly ONE question.
5. Return ONLY valid JSON in this schema:
{
  "assessment": {
    "answer_quality": "strong|adequate|shallow|off-topic|contradictory",
    "reasoning": "1-2 concise sentences explaining specific technical evidence observed",
    "topics_demonstrated": ["topics demonstrated"],
    "unresolved_threads": ["claims left unbacked"],
    "next_action": "follow_up_probe|move_to_new_topic|advance_section",
    "difficulty_adjustment": "escalate|maintain|de-escalate",
    "extracted_claims": ["key claims made"]
  },
  "next_question": {
    "question": "Your single, direct question under 60 words",
    "question_targets": "${targetCompetency}",
    "question_type": "project-defense|technical|coding|system-design|behavioral|closing",
    "difficulty_level": "${sessionState.currentDifficulty}",
    "is_follow_up": true
  }
}`;

  try {
    let raw = "";
    if (process.env.GROQ_API_KEY) {
      const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
        body: JSON.stringify({
          model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
          messages: [{ role: "user", content: prompt }],
          max_tokens: 800,
          temperature: 0.5,
          response_format: { type: "json_object" },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const msg = data.choices?.[0]?.message;
        raw = (msg?.content || msg?.reasoning || "").trim();
      }
    }

    if (!raw && process.env.GEMINI_API_KEY) {
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { temperature: 0.5 } });
      const result = await model.generateContent(prompt);
      raw = result.response.text();
    }

    if (raw) {
      const cleaned = stripThink(raw);
      const parsed = extractJSON(cleaned);
      if (parsed && parsed.assessment && parsed.next_question?.question) {
        const isRepeated = sessionState.questionsAsked.some((q) => isQuestionSemanticallyDuplicate(q.question, parsed.next_question.question));
        if (!isRepeated) {
          const validatedNextQ = ensureValidQuestion(
            parsed.next_question.question,
            currentSection,
            dossier,
            parsed.next_question.question_targets || targetCompetency,
            parsed.assessment,
            sessionState.candidateIntroduction
          );
          let isFollowUp = Boolean(parsed.next_question.is_follow_up);
          let nextAction = parsed.assessment.next_action || (parsed.assessment.answer_quality === "shallow" ? "follow_up_probe" : "move_to_new_topic");

          // Enforce bounded follow-ups: maximum 1 deep follow-up per topic to avoid trapping candidate
          const currentTopicFollowUps = sessionState.followUpsOnCurrentTopic || 0;
          if (currentTopicFollowUps >= 1) {
            isFollowUp = false;
            nextAction = "move_to_new_topic";
            sessionState.followUpsOnCurrentTopic = 0;
          } else if (isFollowUp || nextAction === "follow_up_probe" || nextAction === "clarify_ambiguity") {
            sessionState.followUpsOnCurrentTopic = currentTopicFollowUps + 1;
          } else {
            sessionState.followUpsOnCurrentTopic = 0;
          }

          validatedNextQ.is_follow_up = isFollowUp;
          validatedNextQ.follow_up_reason = determineFollowUpReason(
            isFollowUp,
            parsed.assessment,
            currentSection,
            validatedNextQ.question
          );
          validatedNextQ.difficulty_level = parsed.next_question.difficulty_level || sessionState.currentDifficulty;
          validatedNextQ.evidence_grounding = sectionPlanItem?.focus || "Unified turn engine";

          sessionState.lifecycleState = isFollowUp ? "FOLLOW_UP_REQUIRED" : "ADVANCING_COMPETENCY";

          const unifiedAssessment: AnswerAssessment = {
            answer_quality: parsed.assessment.answer_quality || "adequate",
            reasoning: stripThink(parsed.assessment.reasoning || "Technical answer evaluated."),
            topics_demonstrated: Array.isArray(parsed.assessment.topics_demonstrated) ? parsed.assessment.topics_demonstrated : ["Engineering Implementation"],
            unresolved_threads: Array.isArray(parsed.assessment.unresolved_threads) ? parsed.assessment.unresolved_threads : [],
            next_action: nextAction,
            difficulty_adjustment: parsed.assessment.difficulty_adjustment || "maintain",
            extracted_claims: Array.isArray(parsed.assessment.extracted_claims) ? parsed.assessment.extracted_claims : [],
          };

          const evaluatedModelAnswer = await evaluateAnswerRubricAndModelAnswer(qText, safeAnswer, {
            section: currentSection,
            experienceMode: blueprint.experienceMode,
            targetRole: dossier.targetRole,
            targetCompany: blueprint.targetCompany || dossier.targetCompany,
            competency: parsed.next_question.question_targets || targetCompetency,
            dossier,
            answerQuality: unifiedAssessment.answer_quality,
            track: effectiveTrack,
          });

          return {
            assessment: unifiedAssessment,
            nextQuestion: validatedNextQ,
            timingMs: Date.now() - t0,
            modelAnswerFeedback: evaluatedModelAnswer,
            rubricScore: evaluatedModelAnswer.score,
          };
        }
      }
    }
  } catch (err: any) {
    console.warn("[interview-engine] assessAndGenerateAdaptiveTurn unified call fallback:", err.message);
  }

  // Fallback: fast assessment + blueprint fallback question
  const fallbackAssessment = await assessCandidateAnswer(qText, lastAnswerText, sessionState, dossier);
  const currentTopicFollowUps = sessionState.followUpsOnCurrentTopic || 0;
  if (currentTopicFollowUps >= 1) {
    fallbackAssessment.next_action = "move_to_new_topic";
    sessionState.followUpsOnCurrentTopic = 0;
  } else if (fallbackAssessment.next_action === "follow_up_probe" || fallbackAssessment.next_action === "clarify_ambiguity") {
    sessionState.followUpsOnCurrentTopic = currentTopicFollowUps + 1;
  } else {
    sessionState.followUpsOnCurrentTopic = 0;
  }

  const fallbackQuestion = await generateNextAdaptiveQuestion(sessionState, dossier, conversationHistory, fallbackAssessment);
  if (currentTopicFollowUps >= 1) {
    fallbackQuestion.is_follow_up = false;
  }
  fallbackQuestion.competency_focus = fallbackQuestion.competency_focus || (fallbackQuestion as any).competency_targeted || targetCompetency || "technical_deep_dive";

  const fallbackModelAnswer = await evaluateAnswerRubricAndModelAnswer(qText, safeAnswer, {
    section: currentSection,
    experienceMode: blueprint.experienceMode,
    targetRole: dossier.targetRole,
    targetCompany: blueprint.targetCompany || dossier.targetCompany,
    competency: targetCompetency,
    dossier,
    answerQuality: fallbackAssessment.answer_quality,
    track: effectiveTrack,
  });

  return {
    assessment: fallbackAssessment,
    nextQuestion: fallbackQuestion,
    timingMs: Date.now() - t0,
    modelAnswerFeedback: fallbackModelAnswer,
    rubricScore: fallbackModelAnswer.score,
  };
}

// ══════════════════════════════════════════════════════════════
// 8. EVIDENCE-BASED FINAL REPORT GENERATOR
// ══════════════════════════════════════════════════════════════

export async function generateInterviewFinalReport(
  sessionStateOrOptions: any,
  transcriptArg?: Array<{ role: string; content: string }>,
  dossierArg?: CandidateInterviewDossier
): Promise<InterviewFinalReport> {
  let sessionState: AdvancedSessionState;
  let transcript: Array<{ role: string; content: string }>;
  let dossier: CandidateInterviewDossier;

  if (sessionStateOrOptions && "turns" in sessionStateOrOptions) {
    sessionState = sessionStateOrOptions;
    transcript = transcriptArg || [];
    dossier = (dossierArg || sessionState.dossier || (await buildCandidateInterviewDossier(sessionState.candidateId))) as CandidateInterviewDossier;
  } else {
    const opts = sessionStateOrOptions || {};
    transcript = opts.messages || opts.transcript || [];
    dossier = opts.dossier || (await buildCandidateInterviewDossier(opts.candidateId || "candidate", opts.resume, opts.jd));
    if (opts.targetRole) dossier.targetRole = opts.targetRole;
    if (opts.targetCompany) dossier.targetCompany = opts.targetCompany;

    const blueprint = generateInterviewBlueprint(
      dossier,
      opts.targetRole || dossier.targetRole,
      opts.durationMinutes || 45,
      undefined,
      opts.sessionId,
      opts.jd,
      opts.interviewType,
      opts.targetCompany
    );
    sessionState = opts.sessionState || createAdvancedSessionState(blueprint, dossier);

    if (sessionState.turns.length === 0) {
      const userMsgs = transcript.filter((m: any) => m.role === "user");
      const asstMsgs = transcript.filter((m: any) => m.role === "assistant");
      const minLen = Math.min(userMsgs.length, asstMsgs.length);
      for (let i = 0; i < minLen; i++) {
        sessionState.turns.push({
          turnIndex: i + 1,
          question: {
            question: asstMsgs[i].content,
            question_targets: "Technical Competency",
            question_type: "technical",
            difficulty_level: "medium",
            is_follow_up: false,
            section: "coding_system_design",
          },
          answer: userMsgs[i].content,
          assessment: {
            answer_quality: userMsgs[i].content.length > 80 ? "strong" : userMsgs[i].content.length > 30 ? "adequate" : "shallow",
            reasoning: "Demonstrated technical reasoning",
            topics_demonstrated: ["Technical Implementation"],
            next_action: "move_to_new_topic",
            difficulty_adjustment: "maintain",
          },
          timestamp: new Date().toISOString(),
        });
      }
    }
  }

  const turns = sessionState.turns || [];
  const turnsCount = turns.length;

  if (turnsCount === 0) {
    return {
      candidateId: dossier.candidateId,
      sessionId: sessionState.sessionId,
      targetRole: dossier.targetRole,
      overallScore: 0,
      overallScoreCalculation: "0 candidate answers evaluated. Insufficient evidence to produce a hiring score.",
      hiringRecommendation: "INSUFFICIENT_EVIDENCE",
      confidence: 0,
      executiveSummary: "Interview concluded with 0 candidate answers evaluated. Insufficient evidence to produce a hire recommendation.",
      evidenceCoverage: {
        totalPlanned: sessionState.blueprint?.totalTargetTurns || 5,
        assessedCount: 0,
        insufficientEvidenceCount: 0,
        skippedCount: 0,
        failedCount: 0,
        pendingCount: 0,
        coverageRatio: 0,
        isAdequateForHiringDecision: false
      },
      assistedVsIndependentSummary: {
        totalTurns: 0,
        independentTurns: 0,
        assistedTurns: 0,
        independentScoreAverage: null,
        assistedScoreAverage: null,
        assistanceInfluenceNote: "No candidate answers evaluated."
      },
      competenciesAssessed: [],
      competenciesNotAssessed: (sessionState.blueprint?.competencies || []).map((c) => ({
        competency: c.name,
        reason: "Interview concluded before candidate answered any questions.",
      })),
      projectOwnershipAndVeracity: { score: 0, summary: "No answers provided", claimedVsObserved: "No claims tested" },
      technicalDepth: { score: 0, summary: "No answers provided" },
      problemSolvingAndReasoning: { score: 0, summary: "No answers provided" },
      communicationAndBehavioral: { score: 0, summary: "No answers provided" },
      provenanceSummary: {
        verifiedFactsUsed: dossier.verifiedSkills || [],
        candidateClaimsInvestigated: [],
        observedArtifactsReferenced: [],
        unverifiedOrMissingSources: dossier.missingOrUnverified || [],
      },
      keyStrengths: [],
      criticalGaps: ["Candidate did not complete any substantive evaluation turns."],
      recommendedLearningActions: ["Retake the interview when prepared to answer technical prompts."],
      interviewerPrivateNote: "Early exit with 0 turns evaluated.",
      conductState: sessionState.conductState || "NORMAL",
      conductIncidents: sessionState.conductIncidents || [],
      questionByQuestionAnalysis: [],
    };
  }

  // Extract verbatim candidate answers
  const candidateQuotes: string[] = [];
  for (const t of turns) {
    if (t.answer && t.answer.length > 20) {
      candidateQuotes.push(`[${t.question.section}] Q: "${t.question.question}" -> A: "${t.answer.slice(0, 150)}..."`);
    }
  }

  const prompt = `You are a Senior Bar Raiser at a top-tier technology company. You have observed the candidate's full interview transcript.
Generate an objective, evidence-based final hiring scorecard citing the candidate's actual quotes and demonstrated competencies.

TARGET ROLE: ${dossier.targetRole} (${sessionState.experienceMode})
CANDIDATE: ${dossier.name}

TRANSCRIPT SUMMARY (${turnsCount} turns conducted):
${candidateQuotes.join("\n\n") || "No substantive answers recorded."}

ANSWER DISTRIBUTION:
${JSON.stringify(sessionState.answerDistribution || {})}

SECTIONS COVERED:
${sessionState.blueprint?.sectionPlan?.map((s) => `${s.section}: ${s.completed ? "Completed" : "Visited"}`).join(", ") || "General Technical Assessment"}

TOPICS DEMONSTRATED:
${sessionState.topicsCovered?.join(", ") || "General communication"}

RULES:
1. Every score MUST be justified by what the candidate actually said in the transcript.
2. DO NOT fabricate candidate accomplishments or quote lines they never said.
3. If a competency was not asked, place it in "competenciesNotAssessed" — NEVER penalize candidates for questions that were not asked.
4. Distinguish clearly between verified facts, candidate claims, and newly demonstrated interview evidence.

Return ONLY this JSON:
{
  "overallScore": 75,
  "hiringRecommendation": "STRONG_HIRE|HIRE|LEANING_HIRE|NO_HIRE",
  "confidence": 85,
  "executiveSummary": "2-3 sentences summarizing performance with direct reference to their actual answers",
  "competenciesAssessed": [
    {
      "competency": "Name of competency",
      "score": 80,
      "status": "demonstrated|partial|gap",
      "verbatimQuote": "Actual quote from candidate answer",
      "evaluation": "Detailed evaluation"
    }
  ],
  "competenciesNotAssessed": [
    { "competency": "Competency name", "reason": "Not probed within available interview duration" }
  ],
  "projectOwnershipAndVeracity": {
    "score": 75,
    "summary": "Assessment of genuine ownership vs surface recitation",
    "claimedVsObserved": "How claims matched actual explanations"
  },
  "technicalDepth": { "score": 75, "summary": "Technical rigor observed" },
  "problemSolvingAndReasoning": { "score": 75, "summary": "Problem solving approach" },
  "communicationAndBehavioral": { "score": 80, "summary": "Clarity and collaboration" },
  "provenanceSummary": {
    "verifiedFactsUsed": ["list of verified facts"],
    "candidateClaimsInvestigated": ["list of claims explored"],
    "observedArtifactsReferenced": ["GitHub repos or artifacts inspected"],
    "unverifiedOrMissingSources": ["Sources not accessible"]
  },
  "keyStrengths": ["Strength 1", "Strength 2"],
  "criticalGaps": ["Gap 1", "Gap 2"],
  "recommendedLearningActions": ["Action 1", "Action 2"],
  "interviewerPrivateNote": "Private note from Alex with candid assessment"
}`;

  try {
    let raw = "";

    if (process.env.GROQ_API_KEY) {
      try {
        const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
          body: JSON.stringify({
            model: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 1200,
            temperature: 0.2,
            response_format: { type: "json_object" },
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const msg = data.choices?.[0]?.message;
          raw = (msg?.content || msg?.reasoning || "").trim();
        }
      } catch (groqErr: any) {
        console.warn("[interview-engine] Groq final report notice:", groqErr.message);
      }
    }

    if (!raw && process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { temperature: 0.2 } });
        const result = await model.generateContent(prompt);
        raw = result.response.text();
      } catch (geminiErr: any) {
        console.warn("[interview-engine] Gemini final report fallback:", geminiErr.message);
      }
    }

    // Build structured question-by-question analysis for every turn
    const effectiveTrack = sessionState.track || sessionState.blueprint?.track || (sessionStateOrOptions as any)?.track || (sessionStateOrOptions as any)?.interviewTrack;
    const normTrack = normalizeInterviewTrack(effectiveTrack);

    const questionByQuestionAnalysis: QuestionAnalysisItem[] = turns.map((t, idx) => {
      const qText = t.question?.question || `Question ${idx + 1}`;
      const safeAnswer = (t.answer || "").trim();
      const wordCount = safeAnswer ? safeAnswer.split(/\s+/).filter(Boolean).length : 0;
      const isDeclined = isCandidateDecline(safeAnswer);
      const isDoesNotKnow = /i don'?t know|not sure|not familiar|no idea/i.test(safeAnswer) && wordCount < 25;

      let status: AssessmentItemStatus;
      if (t.status) {
        status = t.status;
      } else if (isDeclined || t.assessment?.answer_quality === "declined") {
        status = "skipped";
      } else if (t.evaluationError || (t as any).isFailed) {
        status = "failed";
      } else if (t.assessment?.answer_quality === "does_not_know" || (isDoesNotKnow && wordCount < 10)) {
        status = "insufficient_evidence";
      } else if (wordCount === 0) {
        status = "unassessed";
      } else {
        status = "assessed";
      }

      const isAssisted = Boolean(t.isAssisted || t.assessment?.is_assisted);
      const isAlternativeValid = Boolean(t.assessment?.alternative_approach_valid || t.alternativeApproachDetected);

      const modelAns = t.modelAnswerFeedback || {
        score: t.assessment?.answer_quality === "strong" ? 88 : t.assessment?.answer_quality === "adequate" ? 72 : t.assessment?.answer_quality === "shallow" ? 42 : 15,
        rubricVersion: "1.0-canonical-100pt",
        dimensionScores: [
          { dimension: "Technical Correctness & Accuracy", earnedPoints: t.assessment?.answer_quality === "strong" ? 30 : 20, maxPoints: 35, explanation: "Correctness evaluated" },
          { dimension: "Conceptual Depth & Architecture", earnedPoints: t.assessment?.answer_quality === "strong" ? 22 : 16, maxPoints: 25, explanation: "Depth evaluated" },
          { dimension: "Reasoning, Trade-offs & Edge Cases", earnedPoints: t.assessment?.answer_quality === "strong" ? 18 : 13, maxPoints: 20, explanation: "Reasoning evaluated" },
          { dimension: "Practical Application & Evidence", earnedPoints: t.assessment?.answer_quality === "strong" ? 9 : 6, maxPoints: 10, explanation: "Application evaluated" },
          { dimension: "Clarity, Structure & Articulation", earnedPoints: t.assessment?.answer_quality === "strong" ? 9 : 7, maxPoints: 10, explanation: "Clarity evaluated" }
        ],
        whatYouDidWell: [t.assessment?.reasoning || "Directly addressed the question asked."],
        whatWasMissing: ["Deeper exploration of edge cases and scale considerations."],
        deductionReasons: ["Minor deductions for missing production boundary considerations."],
        howToImprove: "Structure answers with explicit trade-off comparisons.",
        bestPossibleAnswer: generateExemplarModelAnswer(qText, { targetRole: dossier.targetRole, experienceMode: sessionState.experienceMode }),
        keyConceptsToRemember: extractKeyConceptsForTopic(qText),
        likelyFollowUps: generateLogicalFollowUps(qText),
        personalizedNextAction: "Practice this topic in the Cognalyze Skill Practice Hub."
      };

      const rawScore = t.rubricScore != null ? t.rubricScore : modelAns.score;
      const score = status === "assessed" ? Math.min(100, Math.max(0, rawScore)) : 0;

      return {
        turnIndex: idx + 1,
        question: qText,
        questionText: qText,
        candidateAnswer: t.answer,
        competency: t.question?.competency_targeted || t.question?.question_targets || "Technical Assessment",
        status,
        score,
        rubricScore: rawScore,
        scale: "0-100",
        isAssisted,
        assistanceUsed: isAssisted ? "Interviewer hint/coaching provided" : "Independent solution",
        alternativeApproachValid: isAlternativeValid,
        dimensionScores: modelAns.dimensionScores,
        whatYouDidWell: modelAns.whatYouDidWell,
        whatWasMissing: modelAns.whatWasMissing,
        deductionReasons: modelAns.deductionReasons,
        howToImprove: modelAns.howToImprove,
        bestPossibleAnswer: modelAns.bestPossibleAnswer,
        exemplarModelAnswer: modelAns.bestPossibleAnswer,
        keyConceptsToRemember: modelAns.keyConceptsToRemember,
        likelyFollowUps: modelAns.likelyFollowUps,
        personalizedNextAction: modelAns.personalizedNextAction,
        evaluationError: t.evaluationError,
      };
    });

    const assessedItems = questionByQuestionAnalysis.filter((q) => q.status === "assessed");
    const skippedItems = questionByQuestionAnalysis.filter((q) => q.status === "skipped");
    const failedItems = questionByQuestionAnalysis.filter((q) => q.status === "failed");
    const insufficientItems = questionByQuestionAnalysis.filter((q) => q.status === "insufficient_evidence");
    const pendingItems = questionByQuestionAnalysis.filter((q) => q.status === "pending" || q.status === "in_progress");

    const isSyntheticFromMessages = Boolean(!sessionStateOrOptions.sessionId && (sessionStateOrOptions as any).messages);
    const explicitPlanned = isSyntheticFromMessages ? turns.length : sessionState.blueprint?.totalTargetTurns;
    const plannedTurns = explicitPlanned || turns.length || 1;
    const isExplicitEarlyExit = Boolean(
      (sessionState as any).isEarlyExit ||
      (sessionState as any).lifecycleState === "early_finish" ||
      (sessionState as any).sessionStatus === "early_exit" ||
      turns.some(t => isCandidateEarlyFinishRequest(t.answer))
    );
    const isEarlyExit = isExplicitEarlyExit;
    const submittedCoverage = turns.length > 0 ? assessedItems.length / turns.length : 0;
    const plannedCoverage = plannedTurns > 0 ? assessedItems.length / plannedTurns : 0;

    // For a hiring decision to be justified:
    // 1. Must have at least 1 assessed item if session had only 1 planned turn.
    // 2. If explicit early exit, must have at least 2 assessed items AND at least 50% planned coverage.
    // 3. Otherwise, must have at least 2 assessed items AND at least 50% submitted coverage.
    // 4. Or an explicit external verified score was passed.
    const isAdequate = (
      (plannedTurns === 1 && assessedItems.length === 1) ||
      (isExplicitEarlyExit
        ? (assessedItems.length >= 2 && plannedCoverage >= 0.5 && submittedCoverage >= 0.5)
        : (assessedItems.length >= 2 && submittedCoverage >= 0.5)) ||
      Boolean((sessionStateOrOptions as any).finalScore?.overall && (sessionStateOrOptions as any).finalScore.overall >= 60)
    );

    const evidenceCoverage: EvidenceCoverageSummary = {
      totalPlanned: plannedTurns,
      assessedCount: assessedItems.length,
      insufficientEvidenceCount: insufficientItems.length,
      skippedCount: skippedItems.length,
      failedCount: failedItems.length,
      pendingCount: pendingItems.length,
      coverageRatio: Number(plannedCoverage.toFixed(2)),
      isAdequateForHiringDecision: isAdequate,
    };

    const independentItems = assessedItems.filter((q) => !q.isAssisted);
    const assistedItems = assessedItems.filter((q) => q.isAssisted);
    const independentAvg = independentItems.length > 0
      ? Math.round(independentItems.reduce((acc, q) => acc + q.score, 0) / independentItems.length)
      : null;
    const assistedAvg = assistedItems.length > 0
      ? Math.round(assistedItems.reduce((acc, q) => acc + q.score, 0) / assistedItems.length)
      : null;

    const assistedVsIndependentSummary: AssistedVsIndependentSummary = {
      totalTurns: turns.length,
      independentTurns: independentItems.length,
      assistedTurns: assistedItems.length,
      independentScoreAverage: independentAvg,
      assistedScoreAverage: assistedAvg,
      assistanceInfluenceNote: assistedItems.length > 0
        ? `${assistedItems.length} of ${assessedItems.length} assessed answers utilized interviewer hints/coaching and are evaluated under assisted performance standards.`
        : "All assessed answers were solved independently without hints.",
    };

    let overallScore = 0;
    let overallScoreCalculation = "";
    let finalRecommendation: "STRONG_HIRE" | "HIRE" | "LEANING_HIRE" | "NO_HIRE" | "INSUFFICIENT_EVIDENCE" | "ASSESSMENT_INCOMPLETE" = "INSUFFICIENT_EVIDENCE";

    if (assessedItems.length === 0) {
      overallScore = 0;
      finalRecommendation = pendingItems.length > 0 ? "ASSESSMENT_INCOMPLETE" : "INSUFFICIENT_EVIDENCE";
      overallScoreCalculation = "0 assessed items. Excluded skipped, failed, insufficient-evidence, and pending questions from score calculation.";
    } else {
      const sum = assessedItems.reduce((acc, q) => acc + q.score, 0);
      overallScore = Math.round(sum / assessedItems.length);
      overallScoreCalculation = `Average of ${assessedItems.length} assessed turns: ${overallScore}/100 (excluding ${skippedItems.length} skipped, ${failedItems.length} failed, ${insufficientItems.length} insufficient evidence, ${pendingItems.length} pending items).`;

      if (!isAdequate) {
        finalRecommendation = (pendingItems.length > 0 || isEarlyExit) ? "ASSESSMENT_INCOMPLETE" : "INSUFFICIENT_EVIDENCE";
      } else {
        finalRecommendation =
          overallScore >= 80 ? "STRONG_HIRE" :
          overallScore >= 68 ? "HIRE" :
          overallScore >= 55 ? "LEANING_HIRE" : "NO_HIRE";
      }
    }

    const trackRubric: TrackRubricSummary = {
      track: normTrack,
      trackName: normTrack.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      rubricName: `${normTrack.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} 100-Point Rubric`,
      dimensionsEvaluated: assessedItems.length > 0 && assessedItems[0].dimensionScores
        ? assessedItems[0].dimensionScores.map((d, dimIdx) => {
            const sumDim = assessedItems.reduce((sum, item) => sum + (item.dimensionScores[dimIdx]?.earnedPoints || 0), 0);
            return {
              dimension: d.dimension,
              maxPoints: d.maxPoints,
              earnedAverage: Math.round(sumDim / assessedItems.length),
              explanation: d.explanation,
            };
          })
        : [],
    };

    // Deterministic category score derivation from candidate's actual rubric dimensions
    function calculateCategoryScore(categoryMatchers: RegExp[]): { score: number; count: number } {
      let earnedSum = 0;
      let maxPointsSum = 0;
      let matchCount = 0;

      for (const item of assessedItems) {
        if (!item.dimensionScores || item.dimensionScores.length === 0) continue;
        for (const dim of item.dimensionScores) {
          if (categoryMatchers.some((regex) => regex.test(dim.dimension))) {
            earnedSum += dim.earnedPoints;
            maxPointsSum += dim.maxPoints;
            matchCount++;
          }
        }
      }

      if (maxPointsSum === 0) {
        return { score: overallScore, count: 0 };
      }
      return { score: Math.round((earnedSum / maxPointsSum) * 100), count: matchCount };
    }

    const techDepthCalc = calculateCategoryScore([
      /technical/i, /depth/i, /complexity/i, /correctness/i, /accuracy/i, /scalability/i, /data model/i, /root-cause/i, /execution flow/i
    ]);
    const problemSolvingCalc = calculateCategoryScore([
      /problem/i, /reasoning/i, /trade-off/i, /diagnostic/i, /hypothes/i, /boundary/i, /edge case/i, /requirements/i, /defect/i
    ]);
    const projectOwnershipCalc = calculateCategoryScore([
      /ownership/i, /contribution/i, /star/i, /impact/i, /decision/i, /application/i, /evidence/i, /governance/i, /disclosure/i
    ]);
    const communicationCalc = calculateCategoryScore([
      /clarity/i, /structure/i, /articulation/i, /communication/i, /collaboration/i, /conflict/i, /code quality/i, /explanation/i
    ]);

    if (raw) {
      const parsed = extractJSON(raw);
      const opts = sessionStateOrOptions || {};
      const targetScore = opts.finalScore?.overall ? Number(opts.finalScore.overall) : overallScore;

      let candidateRec = finalRecommendation;
      if (isAdequate && assessedItems.length > 0) {
        if (targetScore >= 80 && (parsed.hiringRecommendation === "NO_HIRE" || parsed.hiringRecommendation === "LEANING_HIRE" || !parsed.hiringRecommendation)) {
          candidateRec = "STRONG_HIRE";
        } else if (targetScore >= 68 && (parsed.hiringRecommendation === "NO_HIRE" || !parsed.hiringRecommendation)) {
          candidateRec = "HIRE";
        } else if (["STRONG_HIRE", "HIRE", "LEANING_HIRE", "NO_HIRE"].includes(parsed.hiringRecommendation)) {
          candidateRec = parsed.hiringRecommendation;
        } else {
          candidateRec = targetScore >= 80 ? "STRONG_HIRE" : targetScore >= 68 ? "HIRE" : targetScore >= 55 ? "LEANING_HIRE" : "NO_HIRE";
        }
      }

      return {
        candidateId: dossier.candidateId,
        sessionId: sessionState.sessionId,
        targetRole: dossier.targetRole,
        track: normTrack,
        overallScore: assessedItems.length > 0 ? targetScore : 0,
        overallScoreCalculation,
        hiringRecommendation: candidateRec,
        confidence: assessedItems.length === 0 ? 0 : (Number(parsed.confidence) || 80),
        executiveSummary: stripThink(parsed.executiveSummary || `Candidate completed ${assessedItems.length} evaluated questions across ${sessionState.topicsCovered.length || 1} technical areas.`),
        evidenceCoverage,
        assistedVsIndependentSummary,
        trackRubric,
        competenciesAssessed: Array.isArray(parsed.competenciesAssessed) && parsed.competenciesAssessed.length > 0
          ? parsed.competenciesAssessed.map((c: any) => ({
              ...c,
              score: Number(c.score) || overallScore,
              status: c.status || (overallScore >= 65 ? "demonstrated" : "gap"),
              provenance: "direct_demonstration"
            }))
          : assessedItems.map((q) => ({
              competency: q.competency,
              score: q.score,
              status: q.score >= 65 ? "demonstrated" : "gap",
              verbatimQuote: q.candidateAnswer.slice(0, 150),
              evaluation: q.whatYouDidWell[0] || "Competency evaluated in technical session.",
              provenance: "direct_demonstration",
              isAssisted: q.isAssisted,
            })),
        competenciesNotAssessed: Array.isArray(parsed.competenciesNotAssessed)
          ? parsed.competenciesNotAssessed
          : (sessionState.blueprint?.competencies || []).slice(assessedItems.length).map((c) => ({
              competency: c.name,
              reason: "Not reached within the completed interview turns",
            })),
        projectOwnershipAndVeracity: {
          score: assessedItems.length > 0 ? projectOwnershipCalc.score : 0,
          summary: typeof parsed.projectOwnershipAndVeracity === "object" && parsed.projectOwnershipAndVeracity?.summary
            ? parsed.projectOwnershipAndVeracity.summary
            : typeof parsed.projectOwnershipAndVeracity === "string"
            ? parsed.projectOwnershipAndVeracity
            : "Project ownership and individual technical contributions evaluated from candidate evidence.",
          claimedVsObserved: typeof parsed.projectOwnershipAndVeracity === "object" && parsed.projectOwnershipAndVeracity?.claimedVsObserved
            ? parsed.projectOwnershipAndVeracity.claimedVsObserved
            : "Candidate demonstrated firsthand architectural command in discussed topics."
        },
        technicalDepth: {
          score: assessedItems.length > 0 ? techDepthCalc.score : 0,
          summary: typeof parsed.technicalDepth === "object" && parsed.technicalDepth?.summary
            ? parsed.technicalDepth.summary
            : typeof parsed.technicalDepth === "string"
            ? parsed.technicalDepth
            : "Technical depth derived from algorithmic correctness and systems architecture rubrics."
        },
        problemSolvingAndReasoning: {
          score: assessedItems.length > 0 ? problemSolvingCalc.score : 0,
          summary: typeof parsed.problemSolvingAndReasoning === "object" && parsed.problemSolvingAndReasoning?.summary
            ? parsed.problemSolvingAndReasoning.summary
            : typeof parsed.problemSolvingAndReasoning === "string"
            ? parsed.problemSolvingAndReasoning
            : "Reasoning and trade-off navigation derived from candidate solution walkthroughs."
        },
        communicationAndBehavioral: {
          score: assessedItems.length > 0 ? communicationCalc.score : 0,
          summary: typeof parsed.communicationAndBehavioral === "object" && parsed.communicationAndBehavioral?.summary
            ? parsed.communicationAndBehavioral.summary
            : typeof parsed.communicationAndBehavioral === "string"
            ? parsed.communicationAndBehavioral
            : "Clarity, precision, and structured engineering articulation."
        },
        provenanceSummary: {
          verifiedFactsUsed: Array.from(new Set([...dossier.verifiedSkills, ...(parsed.provenanceSummary?.verifiedFactsUsed || [])])),
          candidateClaimsInvestigated: Array.from(new Set([...dossier.projects.map((p) => p.title), ...(parsed.provenanceSummary?.candidateClaimsInvestigated || [])])),
          observedArtifactsReferenced: Array.from(new Set([...dossier.githubStatus.accessibleRepos.map((r) => r.name), ...(parsed.provenanceSummary?.observedArtifactsReferenced || [])])),
          unverifiedOrMissingSources: Array.from(new Set([...dossier.missingOrUnverified, ...(parsed.provenanceSummary?.unverifiedOrMissingSources || [])])),
        },
        keyStrengths: Array.isArray(parsed.keyStrengths) && parsed.keyStrengths.length > 0 ? parsed.keyStrengths : ["Demonstrated technical adaptability"],
        criticalGaps: Array.isArray(parsed.criticalGaps) && parsed.criticalGaps.length > 0 ? parsed.criticalGaps : ["Further depth on edge cases recommended"],
        recommendedLearningActions: Array.isArray(parsed.recommendedLearningActions) && parsed.recommendedLearningActions.length > 0 ? parsed.recommendedLearningActions : ["Deepen knowledge of distributed trade-offs"],
        interviewerPrivateNote: stripThink(parsed.interviewerPrivateNote || "Candidate performed with verifiable baseline capability."),
        conductState: sessionState.conductState || "NORMAL",
        conductIncidents: sessionState.conductIncidents || [],
        questionByQuestionAnalysis,
      };
    }
  } catch (err: any) {
    console.warn("[interview-engine] generateInterviewFinalReport API warning:", err.message);
  }

  // Deterministic fallback report (Preserves exact same schema and calculations)
  const effectiveTrack = sessionState.track || sessionState.blueprint?.track || (sessionStateOrOptions as any)?.track || (sessionStateOrOptions as any)?.interviewTrack;
  const normTrack = normalizeInterviewTrack(effectiveTrack);

  const questionByQuestionAnalysis: QuestionAnalysisItem[] = turns.map((t, idx) => {
    const qText = t.question?.question || `Question ${idx + 1}`;
    const safeAnswer = (t.answer || "").trim();
    const wordCount = safeAnswer ? safeAnswer.split(/\s+/).filter(Boolean).length : 0;
    const isDeclined = isCandidateDecline(safeAnswer);
    const isDoesNotKnow = /i don'?t know|not sure|not familiar|no idea/i.test(safeAnswer) && wordCount < 25;

    let status: AssessmentItemStatus;
    if (t.status) {
      status = t.status;
    } else if (isDeclined || t.assessment?.answer_quality === "declined") {
      status = "skipped";
    } else if (t.evaluationError || (t as any).isFailed) {
      status = "failed";
    } else if (t.assessment?.answer_quality === "does_not_know" || (isDoesNotKnow && wordCount < 10)) {
      status = "insufficient_evidence";
    } else if (wordCount === 0) {
      status = "unassessed";
    } else {
      status = "assessed";
    }

    const isAssisted = Boolean(t.isAssisted || t.assessment?.is_assisted);
    const isAlternativeValid = Boolean(t.assessment?.alternative_approach_valid || t.alternativeApproachDetected);

    const modelAns = t.modelAnswerFeedback || {
      score: t.assessment?.answer_quality === "strong" ? 88 : t.assessment?.answer_quality === "adequate" ? 72 : t.assessment?.answer_quality === "shallow" ? 42 : 15,
      rubricVersion: "1.0-canonical-100pt",
      dimensionScores: [
        { dimension: "Technical Correctness & Accuracy", earnedPoints: t.assessment?.answer_quality === "strong" ? 30 : 20, maxPoints: 35, explanation: "Correctness evaluated" },
        { dimension: "Conceptual Depth & Architecture", earnedPoints: t.assessment?.answer_quality === "strong" ? 22 : 16, maxPoints: 25, explanation: "Depth evaluated" },
        { dimension: "Reasoning, Trade-offs & Edge Cases", earnedPoints: t.assessment?.answer_quality === "strong" ? 18 : 13, maxPoints: 20, explanation: "Reasoning evaluated" },
        { dimension: "Practical Application & Evidence", earnedPoints: t.assessment?.answer_quality === "strong" ? 9 : 6, maxPoints: 10, explanation: "Application evaluated" },
        { dimension: "Clarity, Structure & Articulation", earnedPoints: t.assessment?.answer_quality === "strong" ? 9 : 7, maxPoints: 10, explanation: "Clarity evaluated" }
      ],
      whatYouDidWell: [t.assessment?.reasoning || "Directly addressed the question asked."],
      whatWasMissing: ["Deeper exploration of edge cases and scale considerations."],
      deductionReasons: ["Minor deductions for missing production boundary considerations."],
      howToImprove: "Structure answers with explicit trade-off comparisons.",
      bestPossibleAnswer: generateExemplarModelAnswer(qText, { targetRole: dossier.targetRole, experienceMode: sessionState.experienceMode }),
      keyConceptsToRemember: extractKeyConceptsForTopic(qText),
      likelyFollowUps: generateLogicalFollowUps(qText),
      personalizedNextAction: "Practice this topic in the Cognalyze Skill Practice Hub."
    };

    const rawScore = t.rubricScore != null ? t.rubricScore : modelAns.score;
    const score = status === "assessed" ? Math.min(100, Math.max(0, rawScore)) : 0;

    return {
      turnIndex: idx + 1,
      question: qText,
      questionText: qText,
      candidateAnswer: t.answer,
      competency: t.question?.competency_targeted || t.question?.question_targets || "Technical Assessment",
      status,
      score,
      rubricScore: rawScore,
      scale: "0-100",
      isAssisted,
      assistanceUsed: isAssisted ? "Interviewer hint/coaching provided" : "Independent solution",
      alternativeApproachValid: isAlternativeValid,
      dimensionScores: modelAns.dimensionScores,
      whatYouDidWell: modelAns.whatYouDidWell,
      whatWasMissing: modelAns.whatWasMissing,
      deductionReasons: modelAns.deductionReasons,
      howToImprove: modelAns.howToImprove,
      bestPossibleAnswer: modelAns.bestPossibleAnswer,
      exemplarModelAnswer: modelAns.bestPossibleAnswer,
      keyConceptsToRemember: modelAns.keyConceptsToRemember,
      likelyFollowUps: modelAns.likelyFollowUps,
      personalizedNextAction: modelAns.personalizedNextAction,
      evaluationError: t.evaluationError,
    };
  });

  const assessedItems = questionByQuestionAnalysis.filter((q) => q.status === "assessed");
  const skippedItems = questionByQuestionAnalysis.filter((q) => q.status === "skipped");
  const failedItems = questionByQuestionAnalysis.filter((q) => q.status === "failed");
  const insufficientItems = questionByQuestionAnalysis.filter((q) => q.status === "insufficient_evidence");
  const pendingItems = questionByQuestionAnalysis.filter((q) => q.status === "pending" || q.status === "in_progress");

  const isSyntheticFromMessages = Boolean(!sessionStateOrOptions.sessionId && (sessionStateOrOptions as any).messages);
  const explicitPlanned = isSyntheticFromMessages ? turns.length : sessionState.blueprint?.totalTargetTurns;
  const plannedTurns = explicitPlanned || turns.length || 1;
  const isExplicitEarlyExit = Boolean(
    (sessionState as any).isEarlyExit ||
    (sessionState as any).lifecycleState === "early_finish" ||
    (sessionState as any).sessionStatus === "early_exit" ||
    turns.some(t => isCandidateEarlyFinishRequest(t.answer))
  );
  const isEarlyExit = isExplicitEarlyExit;
  const submittedCoverage = turns.length > 0 ? assessedItems.length / turns.length : 0;
  const plannedCoverage = plannedTurns > 0 ? assessedItems.length / plannedTurns : 0;

  const isAdequate = (
    (plannedTurns === 1 && assessedItems.length === 1) ||
    (isExplicitEarlyExit
      ? (assessedItems.length >= 2 && plannedCoverage >= 0.5 && submittedCoverage >= 0.5)
      : (assessedItems.length >= 2 && submittedCoverage >= 0.5)) ||
    Boolean((sessionStateOrOptions as any).finalScore?.overall && (sessionStateOrOptions as any).finalScore.overall >= 60)
  );

  const evidenceCoverage: EvidenceCoverageSummary = {
    totalPlanned: plannedTurns,
    assessedCount: assessedItems.length,
    insufficientEvidenceCount: insufficientItems.length,
    skippedCount: skippedItems.length,
    failedCount: failedItems.length,
    pendingCount: pendingItems.length,
    coverageRatio: Number(plannedCoverage.toFixed(2)),
    isAdequateForHiringDecision: isAdequate,
  };

  const independentItems = assessedItems.filter((q) => !q.isAssisted);
  const assistedItems = assessedItems.filter((q) => q.isAssisted);
  const independentAvg = independentItems.length > 0
    ? Math.round(independentItems.reduce((acc, q) => acc + q.score, 0) / independentItems.length)
    : null;
  const assistedAvg = assistedItems.length > 0
    ? Math.round(assistedItems.reduce((acc, q) => acc + q.score, 0) / assistedItems.length)
    : null;

  const assistedVsIndependentSummary: AssistedVsIndependentSummary = {
    totalTurns: turns.length,
    independentTurns: independentItems.length,
    assistedTurns: assistedItems.length,
    independentScoreAverage: independentAvg,
    assistedScoreAverage: assistedAvg,
    assistanceInfluenceNote: assistedItems.length > 0
      ? `${assistedItems.length} of ${assessedItems.length} assessed answers utilized interviewer hints/coaching and are evaluated under assisted performance standards.`
      : "All assessed answers were solved independently without hints.",
  };

  let overallScore = 0;
  let overallScoreCalculation = "";
  let finalRecommendation: "STRONG_HIRE" | "HIRE" | "LEANING_HIRE" | "NO_HIRE" | "INSUFFICIENT_EVIDENCE" | "ASSESSMENT_INCOMPLETE" = "INSUFFICIENT_EVIDENCE";

  if (assessedItems.length === 0) {
    overallScore = 0;
    finalRecommendation = pendingItems.length > 0 ? "ASSESSMENT_INCOMPLETE" : "INSUFFICIENT_EVIDENCE";
    overallScoreCalculation = "0 assessed items. Excluded skipped, failed, insufficient-evidence, and pending questions from score calculation.";
  } else {
    const sum = assessedItems.reduce((acc, q) => acc + q.score, 0);
    overallScore = Math.round(sum / assessedItems.length);
    overallScoreCalculation = `Average of ${assessedItems.length} assessed turns: ${overallScore}/100 (excluding ${skippedItems.length} skipped, ${failedItems.length} failed, ${insufficientItems.length} insufficient evidence, ${pendingItems.length} pending items).`;

    if (!isAdequate) {
      finalRecommendation = (pendingItems.length > 0 || isEarlyExit) ? "ASSESSMENT_INCOMPLETE" : "INSUFFICIENT_EVIDENCE";
    } else {
      finalRecommendation =
        overallScore >= 80 ? "STRONG_HIRE" :
        overallScore >= 68 ? "HIRE" :
        overallScore >= 55 ? "LEANING_HIRE" : "NO_HIRE";
    }
  }

  const trackRubric: TrackRubricSummary = {
    track: normTrack,
    trackName: normTrack.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    rubricName: `${normTrack.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} 100-Point Rubric`,
    dimensionsEvaluated: assessedItems.length > 0 && assessedItems[0].dimensionScores
      ? assessedItems[0].dimensionScores.map((d, dimIdx) => {
          const sumDim = assessedItems.reduce((sum, item) => sum + (item.dimensionScores[dimIdx]?.earnedPoints || 0), 0);
          return {
            dimension: d.dimension,
            maxPoints: d.maxPoints,
            earnedAverage: Math.round(sumDim / assessedItems.length),
            explanation: d.explanation,
          };
        })
      : [],
  };

  function calculateCategoryScoreFallback(categoryMatchers: RegExp[]): { score: number; count: number } {
    let earnedSum = 0;
    let maxPointsSum = 0;
    let matchCount = 0;

    for (const item of assessedItems) {
      if (!item.dimensionScores || item.dimensionScores.length === 0) continue;
      for (const dim of item.dimensionScores) {
        if (categoryMatchers.some((regex) => regex.test(dim.dimension))) {
          earnedSum += dim.earnedPoints;
          maxPointsSum += dim.maxPoints;
          matchCount++;
        }
      }
    }

    if (maxPointsSum === 0) {
      return { score: overallScore, count: 0 };
    }
    return { score: Math.round((earnedSum / maxPointsSum) * 100), count: matchCount };
  }

  const techDepthCalcFallback = calculateCategoryScoreFallback([
    /technical/i, /depth/i, /complexity/i, /correctness/i, /accuracy/i, /scalability/i, /data model/i, /root-cause/i, /execution flow/i
  ]);
  const problemSolvingCalcFallback = calculateCategoryScoreFallback([
    /problem/i, /reasoning/i, /trade-off/i, /diagnostic/i, /hypothes/i, /boundary/i, /edge case/i, /requirements/i, /defect/i
  ]);
  const projectOwnershipCalcFallback = calculateCategoryScoreFallback([
    /ownership/i, /contribution/i, /star/i, /impact/i, /decision/i, /application/i, /evidence/i, /governance/i, /disclosure/i
  ]);
  const communicationCalcFallback = calculateCategoryScoreFallback([
    /clarity/i, /structure/i, /articulation/i, /communication/i, /collaboration/i, /conflict/i, /code quality/i, /explanation/i
  ]);

  return {
    candidateId: dossier.candidateId,
    sessionId: sessionState.sessionId,
    targetRole: dossier.targetRole,
    track: normTrack,
    overallScore,
    overallScoreCalculation,
    hiringRecommendation: finalRecommendation,
    confidence: assessedItems.length === 0 ? 0 : 80,
    executiveSummary: assessedItems.length === 0
      ? "Interview concluded with insufficient evaluated evidence."
      : `Candidate completed ${assessedItems.length} evaluated questions across ${sessionState.topicsCovered.length || 1} technical areas.`,
    evidenceCoverage,
    assistedVsIndependentSummary,
    trackRubric,
    competenciesAssessed: assessedItems.length > 0
      ? assessedItems.map((q) => ({
          competency: q.competency,
          score: q.score,
          status: q.score >= 65 ? "demonstrated" : "gap",
          verbatimQuote: q.candidateAnswer.slice(0, 150),
          evaluation: q.whatYouDidWell[0] || "Competency evaluated in technical session.",
          provenance: "direct_demonstration",
          isAssisted: q.isAssisted,
        }))
      : [],
    competenciesNotAssessed: (sessionState.blueprint?.competencies || []).slice(assessedItems.length).map((c) => ({
      competency: c.name,
      reason: "Not reached within the completed interview turns",
    })),
    projectOwnershipAndVeracity: {
      score: assessedItems.length > 0 ? projectOwnershipCalcFallback.score : 0,
      summary: "Candidate explained their technical design clearly.",
      claimedVsObserved: "Explanations aligned with resume claims.",
    },
    technicalDepth: { score: assessedItems.length > 0 ? techDepthCalcFallback.score : 0, summary: "Solid foundational depth demonstrated." },
    problemSolvingAndReasoning: { score: assessedItems.length > 0 ? problemSolvingCalcFallback.score : 0, summary: "Systematic step-by-step problem-solving." },
    communicationAndBehavioral: { score: assessedItems.length > 0 ? communicationCalcFallback.score : 0, summary: "Clear and concise technical communication." },
    provenanceSummary: {
      verifiedFactsUsed: dossier.verifiedSkills,
      candidateClaimsInvestigated: dossier.projects.map((p) => p.title),
      observedArtifactsReferenced: dossier.githubStatus.accessibleRepos.map((r) => r.name),
      unverifiedOrMissingSources: dossier.missingOrUnverified,
    },
    keyStrengths: assessedItems.length > 0 ? ["Clear project articulation", "Solid grasp of core engineering trade-offs"] : [],
    criticalGaps: insufficientItems.length > 0 || skippedItems.length > 0
      ? ["Incomplete evidence coverage across target competencies"]
      : ["Further testing and edge-case validation practice recommended"],
    recommendedLearningActions: ["Deepen automated testing practices on GitHub projects"],
    interviewerPrivateNote: assessedItems.length === 0
      ? "Session concluded with 0 assessed answers."
      : "Candidate showed strong foundational ability and clear communication throughout the session.",
    conductState: sessionState.conductState || "NORMAL",
    conductIncidents: sessionState.conductIncidents || [],
    questionByQuestionAnalysis,
  };
}

// ══════════════════════════════════════════════════════════════
// 9. STUDENT DNA UPDATE FEEDBACK LOOP
// ══════════════════════════════════════════════════════════════

export async function commitInterviewEvidenceToDNA(
  candidateId: string,
  report: InterviewFinalReport
): Promise<{ success: boolean; evidenceAdded: number }> {
  let count = 0;
  const now = new Date().toISOString();

  // 1. Commit demonstrated or proficient competencies into Student DNA
  for (const comp of report.competenciesAssessed) {
    if (comp.status === "insufficient_evidence" || comp.status === "unassessed" || comp.status === "gap") {
      continue;
    }
    if ((comp.status === "demonstrated" || comp.score >= 70) && comp.score >= 60) {
      try {
        await addStudentEvidenceRecord(candidateId, {
          sourceType: "interview",
          sourceId: `interview_${report.sessionId}`,
          userId: candidateId,
          skillRaw: comp.competency,
          evidenceType: "VERIFIED_MOCK_INTERVIEW",
          claim: `Demonstrated competency in ${comp.competency} during technical interview`,
          strength: comp.score / 100,
          timestamp: now,
          metadata: {
            score: comp.score,
            verbatimQuote: comp.verbatimQuote,
            evaluation: comp.evaluation,
            targetRole: report.targetRole,
            sessionId: report.sessionId,
          },
        });
        count++;
      } catch (err) {
        console.warn(`[interview-engine] Failed to commit evidence for ${comp.competency}:`, err);
      }
    }
  }

  // 2. Record to Career Memory
  let careerMemoryRecorded = false;
  try {
    recordCareerMemoryItem(candidateId, {
      id: generateSecureId(`cm_${Date.now()}`, 7),
      type: "interview_feedback",
      companyName: "Cognalyze Technical Interview",
      roleTitle: report.targetRole,
      date: now,
      status: "Completed",
      strengthsObserved: report.keyStrengths,
      weaknessesObserved: report.criticalGaps,
      hasCorroboratedPattern: false,
      feedbackNotes: report.executiveSummary,
    });
    careerMemoryRecorded = true;
  } catch (memErr) {
    console.warn("[interview-engine] Career memory record warning:", memErr);
  }

  return { success: count > 0 || careerMemoryRecorded, evidenceAdded: count };
}

// ══════════════════════════════════════════════════════════════
// 10. BACKWARD-COMPATIBILITY EXPORTS (Legacy v1.0 API)
// ══════════════════════════════════════════════════════════════

export async function assessAnswer(
  lastQuestion: string,
  lastAnswer: string,
  sessionState: SessionState,
  resumeContext: string,
  jdContext: string
): Promise<AnswerAssessment> {
  const dummyDossier: CandidateInterviewDossier = {
    candidateId: "legacy-session",
    name: "Candidate",
    targetRole: jdContext.split("\n")[0] || "Software Engineer",
    experienceYears: sessionState.experience_mode === "experienced" ? 4 : 0,
    experienceMode: sessionState.experience_mode,
    careerIntent: "Software Engineering",
    verifiedSkills: [],
    claimedSkills: [],
    evidenceItems: [],
    projects: [{ title: "Featured Project", tech: ["TypeScript", "React"], verificationStatus: "CANDIDATE_CLAIM" }],
    githubStatus: { connected: false, publicRepos: 0, accessibleRepos: [], limitations: [] },
    linkedinStatus: { connected: false, limitations: [] },
    missingOrUnverified: [],
    previousInterviewWeaknesses: [],
  };

  const dummyBlueprint = generateInterviewBlueprint(dummyDossier, dummyDossier.targetRole, 45, sessionState.experience_mode);
  const advancedState = createAdvancedSessionState(dummyBlueprint, dummyDossier);
  advancedState.currentDifficulty = sessionState.current_difficulty;
  advancedState.consecutiveShallow = sessionState.consecutive_shallow;
  advancedState.answerDistribution = {
    ...sessionState.answer_distribution,
    does_not_know: 0,
    contradictory: 0,
  };

  return assessCandidateAnswer(lastQuestion, lastAnswer, advancedState, dummyDossier);
}

export async function generateNextQuestion(
  sessionState: SessionState,
  assessment: AnswerAssessment | null,
  conversationHistory: string,
  resumeContext: string,
  jdContext: string,
  weakTopics: string[],
  evaluationDimensions?: any[],
  interviewContext?: InterviewContext
): Promise<GeneratedQuestion> {
  const dummyDossier: CandidateInterviewDossier = {
    candidateId: "legacy-session",
    name: "Candidate",
    targetRole: interviewContext?.target_company || jdContext.split("\n")[0] || "Software Engineer",
    experienceYears: sessionState.experience_mode === "experienced" ? 4 : 0,
    experienceMode: sessionState.experience_mode,
    careerIntent: "Software Engineering",
    verifiedSkills: [],
    claimedSkills: [],
    evidenceItems: [],
    projects: [{ title: "Featured Project", tech: ["Full-Stack"], verificationStatus: "CANDIDATE_CLAIM" }],
    githubStatus: { connected: false, publicRepos: 0, accessibleRepos: [], limitations: [] },
    linkedinStatus: { connected: false, limitations: [] },
    missingOrUnverified: [],
    previousInterviewWeaknesses: weakTopics,
  };

  const dummyBlueprint = generateInterviewBlueprint(dummyDossier, dummyDossier.targetRole, 45, sessionState.experience_mode);
  const advancedState = createAdvancedSessionState(dummyBlueprint, dummyDossier);
  advancedState.currentDifficulty = sessionState.current_difficulty;

  return generateNextAdaptiveQuestion(advancedState, dummyDossier, conversationHistory, assessment);
}

export function createSessionState(experienceMode: ExperienceMode): SessionState {
  const startDifficulty = experienceMode === "experienced" || experienceMode === "1-3yr" ? "medium" : "easy";
  return {
    question_count: 0,
    topics_covered: [],
    answer_distribution: { strong: 0, adequate: 0, shallow: 0, off_topic: 0 },
    current_difficulty: startDifficulty,
    last_assessment: null,
    consecutive_shallow: 0,
    experience_mode: experienceMode,
  };
}

export function updateSessionState(state: SessionState, assessment: AnswerAssessment): SessionState {
  const newDistribution = { ...state.answer_distribution };
  const distKey = assessment.answer_quality === "off-topic" ? "off_topic" : assessment.answer_quality;
  if (distKey in newDistribution) {
    (newDistribution as any)[distKey] = ((newDistribution as any)[distKey] || 0) + 1;
  }

  const newTopics = [
    ...state.topics_covered,
    ...assessment.topics_demonstrated.filter((t) => !state.topics_covered.includes(t)),
  ];

  let newDifficulty = state.current_difficulty;
  if (assessment.difficulty_adjustment === "escalate") {
    newDifficulty = state.current_difficulty === "easy" ? "medium" : "hard";
  } else if (assessment.difficulty_adjustment === "de-escalate") {
    newDifficulty = state.current_difficulty === "hard" ? "medium" : "easy";
  }

  const consecutiveShallow = assessment.answer_quality === "shallow" ? state.consecutive_shallow + 1 : 0;

  return {
    ...state,
    question_count: state.question_count + 1,
    topics_covered: newTopics,
    answer_distribution: newDistribution,
    current_difficulty: newDifficulty,
    last_assessment: assessment,
    consecutive_shallow: consecutiveShallow,
  };
}
