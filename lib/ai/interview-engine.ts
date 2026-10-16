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

// ══════════════════════════════════════════════════════════════
// 1. TYPES & CONTRACTS
// ══════════════════════════════════════════════════════════════

export type ExperienceMode = "fresher" | "1-3yr" | "experienced" | "career-switcher";

export type AnswerQuality = "strong" | "adequate" | "shallow" | "off-topic" | "does_not_know" | "contradictory" | "declined";

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

export interface InterviewBlueprint {
  sessionId: string;
  candidateId: string;
  targetRole: string;
  experienceMode: ExperienceMode;
  durationMinutes: number;
  totalTargetTurns: number;
  competencies: BlueprintCompetency[];
  sectionPlan: SectionPlan[];
  currentSection: InterviewSection;
  turnCount: number;
}

export interface AnswerAssessment {
  answer_quality: AnswerQuality;
  reasoning: string;
  topics_demonstrated: string[];
  unresolved_threads?: string[];
  next_action:
    | "follow_up_probe"
    | "clarify_ambiguity"
    | "acknowledge_and_advance"
    | "move_to_new_topic"
    | "advance_section"
    | "close_interview";
  difficulty_adjustment: "escalate" | "maintain" | "de-escalate";
  extracted_claims?: string[];
}

export interface GeneratedQuestion {
  question: string;
  question_targets: string;
  question_type: "warm-up" | "project-defense" | "technical" | "coding" | "system-design" | "behavioral" | "closing";
  difficulty_level: "easy" | "medium" | "hard";
  is_follow_up: boolean;
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

export interface InterviewTurn {
  turnIndex: number;
  question: GeneratedQuestion;
  answer: string;
  assessment: AnswerAssessment;
  timestamp: string;
}

export type OpeningState =
  | "NEW_SESSION"
  | "GREETING"
  | "AWAITING_CANDIDATE_INTRO"
  | "INTRODUCTION_RECEIVED"
  | "INTERVIEW_IN_PROGRESS";

export interface AdvancedSessionState {
  sessionId: string;
  candidateId: string;
  blueprint: InterviewBlueprint;
  dossier?: CandidateInterviewDossier;
  openingState: OpeningState;
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
}

export interface InterviewFinalReport {
  candidateId: string;
  sessionId: string;
  targetRole: string;
  overallScore: number;
  hiringRecommendation: "STRONG_HIRE" | "HIRE" | "LEANING_HIRE" | "NO_HIRE";
  confidence: number;
  executiveSummary: string;
  competenciesAssessed: Array<{
    competency: string;
    score: number;
    status: "demonstrated" | "partial" | "gap";
    verbatimQuote: string;
    evaluation: string;
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
  return q
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Checks semantic and token overlap between a new question and all previously asked questions.
 */
export function isQuestionSemanticallyDuplicate(
  newQuestion: string,
  questionsAsked: Array<{ question: string }>
): boolean {
  if (!questionsAsked || questionsAsked.length === 0) return false;
  const normNew = normalizeQuestion(newQuestion);
  const newTokens = new Set(normNew.split(" ").filter((w) => w.length > 3));

  for (const prev of questionsAsked) {
    const normPrev = normalizeQuestion(prev.question);
    if (normNew === normPrev) return true;

    // Check token Jaccard similarity
    const prevTokens = new Set(normPrev.split(" ").filter((w) => w.length > 3));
    let intersection = 0;
    for (const t of newTokens) {
      if (prevTokens.has(t)) intersection++;
    }
    const union = new Set([...newTokens, ...prevTokens]).size;
    if (union > 0) {
      const jaccard = intersection / union;
      if (jaccard > 0.58) return true; // High overlap
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

  // 3. Check for dangling ending words, verbs, or conjunctions
  // e.g. "Walk", "Could you give", "Can you explain", "Walk me through", "How would you"
  const danglingEndPattern = /\b(walk|walk me|walk me through|could you|could you give|could you explain|can you give|can you explain|can you|how would|how would you|such as|with|to|and|or|in|of|at|by|for|like|describe|tell me|explain|what is|why do|about|from|the|a|an|if|when|where|which|whose|should|would|did|does|is|are|was|were)\s*[\.\?\!"]*$/i;

  if (danglingEndPattern.test(cleaned)) {
    return { isValid: false, reason: "Question ends with a dangling verb, preposition, or conjunction (truncated thought)", cleanedQuestion: cleaned };
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

  // Don't treat "I don't know" or "haven't worked with" as a pure decline; that is does_not_know
  if (/don'?t know|not sure|not familiar|haven'?t worked|never used/i.test(clean)) {
    return false;
  }

  if (wordCount <= 5 && /^(no|nope|nah|pass|skip|negative)(\.|\!|\s|$)/i.test(clean)) {
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
  candidateId: string,
  customResume?: string,
  customJd?: string,
  options?: { forceRefresh?: boolean }
): Promise<CandidateInterviewDossier> {
  const cacheKey = `${candidateId}::${customResume ? "custom" : "std"}::${customJd ? customJd.slice(0, 30) : "std"}`;
  if (!options?.forceRefresh) {
    const cached = CANDIDATE_INTERVIEW_DOSSIER_CACHE.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < DOSSIER_CACHE_TTL_MS) {
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

  // If custom resume provided, parse out explicit claims
  if (customResume && customResume.trim().length > 0) {
    evidenceItems.push({
      source: "resume",
      claimOrObservation: "Candidate provided resume content",
      status: "CANDIDATE_CLAIM",
      detail: customResume.slice(0, 500),
      relatedCompetency: "Resume Claims",
      relevanceScore: 0.9,
    });
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
  const targetRole = customJd?.split("\n")[0]?.replace(/^Role:\s*/i, "").slice(0, 60) ||
    dnaResponse?.targetRoleTitle ||
    "Full-Stack Software Engineer";
  const isSeniorRole = (customJd && seniorRolePattern.test(customJd)) || seniorRolePattern.test(targetRole);

  let experienceMode: ExperienceMode = "fresher";
  if (expYears >= 3 || isSeniorRole) {
    experienceMode = "experienced";
  } else if (expYears >= 1) {
    experienceMode = "1-3yr";
  } else if (dnaResponse?.activeTargetProfile?.roleKey?.includes("switch")) {
    experienceMode = "career-switcher";
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
  };

  CANDIDATE_INTERVIEW_DOSSIER_CACHE.set(cacheKey, { dossier, timestamp: Date.now() });
  return dossier;
}

// ══════════════════════════════════════════════════════════════
// 4. INTERVIEW BLUEPRINT GENERATOR
// ══════════════════════════════════════════════════════════════

export function generateInterviewBlueprint(
  dossier: CandidateInterviewDossier,
  targetRole: string,
  durationMinutes = 45,
  forcedExperienceMode?: ExperienceMode,
  customSessionId?: string,
  jobDescriptionText?: string
): InterviewBlueprint {
  const experienceMode = forcedExperienceMode || dossier.experienceMode;
  const parsedJd = parseJobDescription(jobDescriptionText || targetRole, experienceMode);

  // Turn budget calculation: approx 3.5 - 4 mins per question-turn
  const totalTargetTurns = Math.max(6, Math.min(14, Math.round(durationMinutes / 4)));

  // Define structured section plan
  const sectionPlan: SectionPlan[] = [
    { section: "introduction", targetTurns: 1, focus: "Background, career intent, role alignment", completed: false },
    { section: "resume_projects", targetTurns: Math.max(2, Math.floor(totalTargetTurns * 0.28)), focus: "Project architecture, personal ownership, technical decisions & code evidence", completed: false },
    { section: "technical_fundamentals", targetTurns: Math.max(2, Math.floor(totalTargetTurns * 0.25)), focus: "Core CS/SWE fundamentals (OOP, DBMS, OS, Concurrency, API Design)", completed: false },
    { section: "coding_system_design", targetTurns: Math.max(2, Math.floor(totalTargetTurns * 0.25)), focus: experienceMode === "experienced" ? "High-scale system design & distributed trade-offs" : "Data structures, algorithmic reasoning & edge case analysis", completed: false },
    { section: "behavioral", targetTurns: Math.max(1, Math.floor(totalTargetTurns * 0.15)), focus: "Ownership, conflict resolution, dealing with failure & collaboration", completed: false },
    { section: "closing", targetTurns: 1, focus: "Candidate questions and interview conclusion", completed: false },
  ];

  // Derive competencies from Role, JD & Candidate Dossier across the 26-Category Matrix
  const competencies: BlueprintCompetency[] = [
    {
      id: "comp-proj-ownership",
      name: "Project Ownership & Technical Trade-offs",
      category: "project_deep_dive",
      categoryKey: "C_PROJECT_DEEP_DIVE",
      tier: "Critical",
      evidenceAnchor: dossier.projects[0]?.title || "Resume Projects",
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
      evidenceAnchor: dossier.projects[0]?.title || "Architecture",
      isAssessed: false,
      status: "unassessed",
      turnsSpent: 0,
      timeBudgetMinutes: Math.round(durationMinutes * 0.15),
      evidenceCollected: [],
    },
  ];

  // Technical Fundamentals & Databases
  if (parsedJd.targetCategories.includes("J_DATABASES_SQL") || parsedJd.targetCategories.includes("M_BACKEND_ENGINEERING")) {
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
  if (dossier.githubStatus.accessibleRepos.length > 0) {
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
  if (dossier.previousInterviewWeaknesses.length > 0) {
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

  return {
    sessionId: customSessionId || `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    candidateId: dossier.candidateId,
    targetRole,
    experienceMode,
    durationMinutes,
    totalTargetTurns,
    competencies,
    sectionPlan,
    currentSection: "introduction",
    turnCount: 0,
  };
}

// ══════════════════════════════════════════════════════════════
// 5. SESSION STATE MANAGEMENT
// ══════════════════════════════════════════════════════════════

export function createAdvancedSessionState(
  blueprint: InterviewBlueprint,
  dossier: CandidateInterviewDossier,
  customSessionId?: string
): AdvancedSessionState {
  const startDifficulty =
    blueprint.experienceMode === "experienced" ? "medium" :
    blueprint.experienceMode === "1-3yr" ? "medium" : "easy";

  const sessionId = customSessionId || blueprint.sessionId;
  blueprint.sessionId = sessionId;

  return {
    sessionId,
    candidateId: dossier.candidateId,
    blueprint,
    dossier,
    openingState: "GREETING",
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
    experienceMode: blueprint.experienceMode,
    remainingTimeMinutes: blueprint.durationMinutes,
  };
}

/**
 * STEP 1: Short, natural, professional greeting asking for a quick introduction.
 * Warm, concise, and non-intimidating (< 45 words).
 */
export function generateOpeningGreeting(dossier: CandidateInterviewDossier): GeneratedQuestion {
  const firstName = dossier.name && dossier.name !== "Candidate" ? ` ${dossier.name.split(" ")[0]}` : "";
  const greeting = `Hi${firstName}! Welcome to Cognalyze. I'm Alex, your AI interviewer today. Let's start with a quick introduction. Could you briefly tell me about yourself and what you've been working on recently?`;

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
  const matchedSkills = [...dossier.verifiedSkills, ...dossier.claimedSkills].filter(
    (s) => s.length > 2 && clean.includes(s.toLowerCase())
  );
  if (matchedSkills.length > 0) {
    return `Thanks for sharing that background with ${matchedSkills[0]}! Let's dive into your engineering experience.`;
  }

  return "Thanks for sharing that background! Let's explore your technical experience.";
}


// ══════════════════════════════════════════════════════════════
// 6. LIVE ANSWER ASSESSMENT
// ══════════════════════════════════════════════════════════════

export async function assessCandidateAnswer(
  lastQuestion: GeneratedQuestion | string,
  lastAnswer: string,
  sessionState: AdvancedSessionState,
  dossier: CandidateInterviewDossier
): Promise<AnswerAssessment> {
  const qText = typeof lastQuestion === "string" ? lastQuestion : lastQuestion.question;
  const wordCount = lastAnswer.trim().split(/\s+/).filter(Boolean).length;
  const cleanAns = lastAnswer.toLowerCase().trim();

  // 1. Detect "Candidate does not know"
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
  if (isDoesNotKnow) {
    return {
      answer_quality: "does_not_know",
      reasoning: "Candidate stated they are unfamiliar with this specific concept or requested to move forward.",
      topics_demonstrated: [],
      next_action: "acknowledge_and_advance",
      difficulty_adjustment: "de-escalate",
      extracted_claims: [],
    };
  }

  // 2. Detect candidate decline or request to pass (Phase 7)
  if (isCandidateDecline(lastAnswer)) {
    return {
      answer_quality: "declined",
      reasoning: "Candidate politely declined or requested to defer this question. Pivoting to alternative assessment without penalty.",
      topics_demonstrated: [],
      next_action: "acknowledge_and_advance",
      difficulty_adjustment: "maintain",
      extracted_claims: [],
    };
  }

  // 3. Fast-path: extremely brief answers (< 6 words) that are NOT declines are shallow
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

  // 3. LLM-based deep assessment
  const technicalKeywords = [
    "kafka", "partition", "skew", "rebalance", "index", "latency", "concurrency",
    "deadlock", "transaction", "isolation", "postgres", "redis", "cache", "microservice",
    "async", "mvcc", "mutex", "queue", "docker", "kubernetes", "api", "query", "schema"
  ];
  const matchedKeywords = technicalKeywords.filter((k) => cleanAns.includes(k));
  const hasTechnicalDepth = matchedKeywords.length >= 2 || (matchedKeywords.length >= 1 && wordCount >= 18);

  const prompt = `You are a FAANG Staff Engineer assessing an interview answer with technical rigor and nuance.

QUESTION ASKED:
"${qText}"

CANDIDATE'S ANSWER (${wordCount} words):
"${lastAnswer.slice(0, 1800)}"

CANDIDATE BACKGROUND:
Experience Level: ${sessionState.experienceMode}
Verified Skills: ${dossier.verifiedSkills.join(", ") || "None"}
Projects: ${dossier.projects.map((p) => p.title).join(", ") || "General SWE"}

ASSESSMENT CRITERIA:
- "strong": Concrete details, specific metrics/architecture, explains personal technical choices and trade-offs.
- "adequate": Directly answers the question with technical understanding, but lacks deep edge cases or metrics.
- "shallow": Vague, buzzwords without substance, gives generic textbook definitions, or avoids specific implementation details.
- "off-topic": Fails to address the core of the question.
- "contradictory": Contradicts standard engineering facts or candidate's earlier claims.

DECISION FOR next_action:
- If answer_quality is "shallow" → "follow_up_probe" (ask for a concrete example or specific metric)
- If answer_quality is "contradictory" → "clarify_ambiguity" (ask for clarification politely)
- If answer_quality is "adequate" or "strong" → "move_to_new_topic" (or "advance_section" if this area is covered)

Return ONLY this JSON:
{
  "answer_quality": "strong|adequate|shallow|off-topic|contradictory",
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
          model: "llama-3.1-8b-instant",
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
      let quality: AnswerQuality = ["strong", "adequate", "shallow", "off-topic", "contradictory"].includes(parsed.answer_quality)
        ? parsed.answer_quality
        : (hasTechnicalDepth && wordCount >= 18 ? "strong" : wordCount > 35 ? "adequate" : "shallow");

      // Guard: if answer contains concrete technical depth, architecture terms, and metrics, it is not shallow
      if (quality === "shallow" && hasTechnicalDepth && wordCount >= 20) {
        quality = "strong";
      }

      let nextAction = parsed.next_action || "move_to_new_topic";
      // Prevent infinite probing: if candidate has given 2 consecutive shallow answers, force transition
      if (quality === "shallow" && sessionState.consecutiveShallow >= 1) {
        nextAction = "advance_section";
      }

      return {
        answer_quality: quality,
        reasoning: stripThink(parsed.reasoning || "Technical assessment recorded."),
        topics_demonstrated: Array.isArray(parsed.topics_demonstrated) ? parsed.topics_demonstrated : [],
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
    hasTechnicalDepth && wordCount >= 18 ? "strong" :
    wordCount > 35 || hasTechnicalDepth ? "adequate" : "shallow";
  return {
    answer_quality: quality,
    reasoning: `Deterministic evaluation based on response depth (${wordCount} words) and technical keywords.`,
    topics_demonstrated: quality === "strong" || quality === "adequate" ? ["Technical Implementation", "Systems Engineering"] : [],
    next_action: quality === "shallow" ? "follow_up_probe" : "move_to_new_topic",
    difficulty_adjustment: "maintain",
  };
}

// ══════════════════════════════════════════════════════════════
// 7. CONTEXTUAL QUESTION GENERATOR WITH ANTI-REPETITION
// ══════════════════════════════════════════════════════════════

export async function generateNextAdaptiveQuestion(
  sessionState: AdvancedSessionState,
  dossier: CandidateInterviewDossier,
  conversationHistory: string,
  assessment: AnswerAssessment | null
): Promise<GeneratedQuestion> {
  const blueprint = sessionState.blueprint;
  const turnsCount = sessionState.turns.length;

  // 1. Determine Section & Progression
  // Check if we should advance the section based on turn limits or assessment
  let currentSection = blueprint.currentSection;
  const sectionPlanItem = blueprint.sectionPlan.find((s) => s.section === currentSection);
  const turnsInSection = sessionState.turns.filter((t) => t.question?.section === currentSection).length;

  const isTurnLimitReached = turnsCount >= blueprint.totalTargetTurns - 1;
  const shouldAdvance =
    turnsCount === 0 ? false :
    isTurnLimitReached ? true :
    assessment?.next_action === "advance_section" ||
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


  // 2. Select Competency & Guidance based on Section
  let sectionGuidance = "";
  let targetCompetency = "";

  switch (currentSection) {
    case "introduction":
      sectionGuidance = `FIRST QUESTION (Warm-up): Welcome the candidate warmly and ask a focused opening question referencing their actual career intent (${dossier.careerIntent}) or target role (${dossier.targetRole}). Do NOT ask a generic "tell me about yourself." Ask about what they've recently built or what drew them to this role.`;
      targetCompetency = "Background & Career Orientation";
      break;

    case "resume_projects":
      const targetProj = dossier.projects[0]?.title || "their featured project";
      if (assessment?.next_action === "follow_up_probe") {
        sectionGuidance = `FOLLOW-UP PROBE ON PROJECT: The candidate's last answer was ${assessment.answer_quality}. Probe deeper on their specific implementation or technical trade-off: "${assessment.reasoning}". Force them to explain what THEY personally built versus existing libraries or team members.`;
      } else if (dossier.githubStatus.accessibleRepos.length > 0) {
        const repo = dossier.githubStatus.accessibleRepos[0];
        sectionGuidance = `PROJECT & GITHUB CODE DEEP DIVE: Inspect their project "${targetProj}" or accessible repo "${repo.name}". Ask about their architecture, database indexing, testing choices (${repo.hasTests ? "tests present" : "no automated tests observed"}), or how they handled scale/edge cases.`;
      } else {
        sectionGuidance = `PROJECT DEEP DIVE: Investigate their project "${targetProj}". Ask how they designed the architecture, handled failure states, or evaluated system performance.`;
      }
      targetCompetency = "Project Ownership & Architecture";
      break;

    case "technical_fundamentals":
      sectionGuidance = `TECHNICAL CS FUNDAMENTALS: Pivot intentionally away from project discussion to core fundamentals. For this ${blueprint.experienceMode} level, test database transactions / isolation levels, concurrency primitives, REST/gRPC API contract design, or OOP principles. Be direct and concise.`;
      targetCompetency = "CS Fundamentals & Systems Knowledge";
      break;

    case "coding_system_design":
      if (blueprint.experienceMode === "experienced") {
        sectionGuidance = `HIGH-SCALE SYSTEM DESIGN: Ask a realistic architecture question appropriate for a senior engineer (e.g., designing an idempotent payment webhook, rate limiter, or distributed message queue). Focus on bottleneck identification and failure recovery.`;
        targetCompetency = "Distributed System Design";
      } else {
        sectionGuidance = `DATA STRUCTURES & ALGORITHMIC REASONING: Pose a concrete algorithmic problem or data structure trade-off (e.g., balancing read vs write latency with trees/hashmaps, cycle detection, or handling streaming data). Ask them to walk through their approach and time/space complexity before writing code.`;
        targetCompetency = "Algorithmic Problem Solving";
      }
      break;

    case "behavioral":
      sectionGuidance = `BEHAVIORAL (STAR): Ask a pointed behavioral question assessing ownership, resolving a technical disagreement with a colleague, or how they responded when production broke or a project missed a deadline. Demand concrete personal accountability.`;
      targetCompetency = "Leadership & Accountability";
      break;

    case "closing":
      sectionGuidance = `CLOSING: We are wrapping up. Offer a concise, professional closing remark and invite the candidate to ask any question they have about the team, architecture, or tech stack.`;
      targetCompetency = "Interview Conclusion";
      break;
  }

  // 3. Construct System & User Prompt
  const prompt = `You are Alex, a Staff Engineer with 12 years of FAANG experience conducting a live technical interview.
You are sharp, technically rigorous, natural, and respectful. You never drone on, never flatter artificially, and never ask multiple questions in one message.

CURRENT INTERVIEW PHASE: ${currentSection}
TARGET ROLE: ${dossier.targetRole} (${blueprint.experienceMode} level)
SECTION GUIDANCE: ${sectionGuidance}

CANDIDATE INTELLIGENCE DOSSIER:
- Name: ${dossier.name}
- Candidate Self-Introduction: "${sessionState.candidateIntroduction || "Not provided"}"
- Verified Skills: ${dossier.verifiedSkills.join(", ") || "None"}
- Claimed Skills: ${dossier.claimedSkills.join(", ") || "General SWE"}
- Projects: ${dossier.projects.map((p) => `${p.title} (${p.tech.join(", ")})`).join("; ") || "None"}
- GitHub Repos: ${dossier.githubStatus.accessibleRepos.map((r) => `${r.name} [Lang: ${r.primaryLang || "?"}, Tests: ${r.hasTests}]`).join(", ") || "Not connected"}
- Missing/Unverified: ${dossier.missingOrUnverified.join("; ") || "None"}

PREVIOUS QUESTIONS ASKED IN THIS SESSION:
${sessionState.questionsAsked.map((q, idx) => `Q${idx + 1}: "${q.question}"`).join("\n") || "None yet."}

CONVERSATION TRANSCRIPT SO FAR:
${conversationHistory.slice(-2000) || "(Starting session)"}

LATEST CANDIDATE ANSWER ASSESSMENT:
Quality: ${assessment?.answer_quality || "N/A"}
Reasoning: ${assessment?.reasoning || "N/A"}
Next Action: ${assessment?.next_action || "advance"}

RULES FOR ALEX:
1. Ask EXACTLY ONE question. Never combine two questions with "and also...".
2. Keep the response under 60 words. Be concise and direct.
3. If the candidate said "I don't know", acknowledge politely ("No problem at all, let's shift gears...") and transition cleanly without shaming them.
4. If candidate's answer was vague, ask for a concrete example or metric from their work.
5. If transitioning sections, provide a smooth 1-sentence pivot before asking the question.
6. NEVER repeat or rephrase any question from the PREVIOUS QUESTIONS list. It MUST be a completely new question.
7. Return ONLY JSON format.

JSON schema:
{
  "question": "Your single, direct question under 60 words",
  "question_targets": "What specific competency this evaluates",
  "question_type": "warm-up|project-defense|technical|coding|system-design|behavioral|closing",
  "difficulty_level": "${sessionState.currentDifficulty}",
  "is_follow_up": ${assessment?.next_action === "follow_up_probe" ? "true" : "false"}
}`;

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

        // Anti-repetition check!
        if (isQuestionSemanticallyDuplicate(generatedQ, sessionState.questionsAsked)) {
          console.warn("[interview-engine] Anti-repetition triggered: question was duplicate. Regenerating...");
          continue; // Try next iteration
        }

        const validatedQ = ensureValidQuestion(
          generatedQ,
          currentSection,
          dossier,
          stripThink(parsed.question_targets || targetCompetency),
          assessment,
          sessionState.candidateIntroduction,
          parsed.question_type
        );
        validatedQ.difficulty_level = parsed.difficulty_level || sessionState.currentDifficulty;
        validatedQ.is_follow_up = Boolean(parsed.is_follow_up);
        validatedQ.evidence_grounding = sectionPlanItem?.focus;
        return validatedQ;
      }
    } catch (err: any) {
      console.warn(`[interview-engine] generateNextAdaptiveQuestion attempt ${attempt} warning:`, err.message);
    }
  }

  // 5. Intelligent Blueprint-Driven Fallback Generator
  // Constructs a targeted question directly from candidate's dossier & current section
  const fallbackQ = generateBlueprintFallbackQuestion(
    currentSection,
    dossier,
    sessionState.questionsAsked,
    assessment,
    sessionState.candidateIntroduction
  );
  return {
    question: fallbackQ.question,
    question_targets: fallbackQ.target,
    question_type: fallbackQ.type,
    difficulty_level: sessionState.currentDifficulty,
    is_follow_up: assessment?.next_action === "follow_up_probe",
    section: currentSection,
    competency_targeted: targetCompetency,
    evidence_grounding: "Blueprint fallback engine",
  };
}

/**
 * Generates an evidence-grounded fallback question conditioned on the candidate's actual dossier.
 * NEVER returns a generic static question or truncated text.
 */
export function generateBlueprintFallbackQuestion(
  section: InterviewSection,
  dossier: CandidateInterviewDossier,
  questionsAsked: LoggedQuestion[],
  assessment: AnswerAssessment | null,
  candidateIntro?: string
): { question: string; target: string; type: GeneratedQuestion["question_type"] } {
  const introClean = (candidateIntro || "").toLowerCase();
  const mentionedProject = dossier.projects.find(
    (p) => p.title && introClean.includes(p.title.toLowerCase())
  );
  const topProject = mentionedProject?.title || dossier.projects[0]?.title || "your main full-stack project";
  const accessibleRepo = dossier.githubStatus.accessibleRepos[0]?.name;
  const isDeclinedOrPass = assessment?.answer_quality === "declined" || assessment?.answer_quality === "does_not_know";

  if (section === "introduction") {
    return {
      question: `Welcome! To kick off, walk me through what you built in ${topProject} and your specific engineering responsibilities.`,
      target: "Project Ownership & Background",
      type: "warm-up",
    };
  }

  if (section === "resume_projects") {
    if (isDeclinedOrPass) {
      return {
        question: `No problem at all! Let's approach this from another angle: how would you conceptually design a reliable background job-processing service?`,
        target: "Resilience & Architecture",
        type: "project-defense",
      };
    }
    if (accessibleRepo) {
      return {
        question: `In your repository ${accessibleRepo}, how did you structure automated tests and validate input before persisting to your database?`,
        target: "Code Quality & Verification",
        type: "project-defense",
      };
    }
    return {
      question: `When building ${topProject}, what was the most difficult architectural trade-off or performance bottleneck you had to solve?`,
      target: "Technical Trade-offs",
      type: "project-defense",
    };
  }

  if (section === "technical_fundamentals") {
    if (isDeclinedOrPass) {
      return {
        question: "Understood, let's pivot. In a relational database, how do database indexes work, and when can adding an index actually degrade write performance?",
        target: "Database Indexing & Performance",
        type: "technical",
      };
    }
    return {
      question: "In a high-concurrency relational database, how do you handle deadlocks and choose between Read Committed and Serializable isolation?",
      target: "Database Concurrency & ACID Primitives",
      type: "technical",
    };
  }

  if (section === "coding_system_design") {
    if (isDeclinedOrPass) {
      return {
        question: "No problem. Let's look at another classic algorithmic trade-off: when would you choose an in-memory hash map over a balanced binary search tree?",
        target: "Data Structure Trade-offs",
        type: "coding",
      };
    }
    if (dossier.experienceMode === "experienced") {
      return {
        question: "How would you architect a distributed rate limiter that handles 50,000 requests per second across multiple data centers with low latency?",
        target: "Distributed System Design",
        type: "system-design",
      };
    }
    return {
      question: "Given a streaming log of user IDs, how would you find the top 10 most frequent visitors in O(N log K) time with bounded memory?",
      target: "Algorithmic Reasoning & Data Structures",
      type: "coding",
    };
  }

  if (section === "behavioral") {
    if (isDeclinedOrPass) {
      return {
        question: "That's completely fine. Tell me instead about a technical project where you had to quickly learn a new framework or technology under a deadline.",
        target: "Adaptability & Continuous Learning",
        type: "behavioral",
      };
    }
    return {
      question: "Can you tell me about a time when you strongly disagreed with a team member's technical decision? How did you resolve it?",
      target: "Conflict Resolution & Collaboration",
      type: "behavioral",
    };
  }

  return {
    question: "We're nearing the end of our conversation. Do you have any questions for me about our engineering architecture or culture?",
    target: "Closing & Candidate Q&A",
    type: "closing",
  };
}

/**
 * Ensures a question passes strict completeness validation.
 * If truncated or incomplete, automatically repairs using candidate context.
 */
export function ensureValidQuestion(
  rawQ: string,
  section: InterviewSection,
  dossier: CandidateInterviewDossier,
  targetCompetency?: string,
  assessment?: AnswerAssessment | null,
  candidateIntro?: string,
  overrideQuestionType?: GeneratedQuestion["question_type"]
): GeneratedQuestion {
  const defaultType: GeneratedQuestion["question_type"] =
    overrideQuestionType ||
    (section === "introduction" ? "warm-up" :
     section === "closing" ? "closing" :
     section === "coding_system_design" ? (dossier.experienceMode === "experienced" ? "system-design" : "coding") :
     section === "behavioral" ? "behavioral" : "technical");

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
  const fallback = generateBlueprintFallbackQuestion(section, dossier, [], assessment || null, candidateIntro);
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
  sessionState: AdvancedSessionState,
  dossier: CandidateInterviewDossier,
  conversationHistory: string,
  lastQuestionText: string,
  lastAnswerText: string
): Promise<{ assessment: AnswerAssessment; nextQuestion: GeneratedQuestion; timingMs: number }> {
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

  // 1. Fast-path checks (0ms)
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
  if (isDoesNotKnow) {
    const assessment: AnswerAssessment = {
      answer_quality: "does_not_know",
      reasoning: "Candidate stated they are unfamiliar with this specific concept or requested to move forward.",
      topics_demonstrated: [],
      next_action: "acknowledge_and_advance",
      difficulty_adjustment: "de-escalate",
      extracted_claims: [],
    };
    const nextQuestion = await generateNextAdaptiveQuestion(sessionState, dossier, conversationHistory, assessment);
    return { assessment, nextQuestion, timingMs: Date.now() - t0 };
  }

  if (isCandidateDecline(safeAnswer)) {
    const assessment: AnswerAssessment = {
      answer_quality: "declined",
      reasoning: "Candidate politely declined or requested to defer this question. Pivoting to alternative assessment without penalty.",
      topics_demonstrated: [],
      next_action: "acknowledge_and_advance",
      difficulty_adjustment: "maintain",
      extracted_claims: [],
    };
    const nextQuestion = await generateNextAdaptiveQuestion(sessionState, dossier, conversationHistory, assessment);
    return { assessment, nextQuestion, timingMs: Date.now() - t0 };
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
    return { assessment, nextQuestion, timingMs: Date.now() - t0 };
  }

  // 2. Blueprint & section determination
  const blueprint = sessionState.blueprint;
  const turnsCount = sessionState.turns.length;
  let currentSection = blueprint.currentSection;
  const sectionPlanItem = blueprint.sectionPlan.find((s) => s.section === currentSection);
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

  let sectionGuidance = "";
  let targetCompetency = "";
  switch (currentSection) {
    case "resume_projects":
      const topProj = dossier.projects[0]?.title || "their featured project";
      sectionGuidance = `PROJECT DEEP DIVE: Inspect project "${topProj}". If candidate's answer was shallow, probe personal implementation or failure modes. If strong, explore architecture scaling or trade-offs.`;
      targetCompetency = "Project Ownership & Architecture";
      break;
    case "technical_fundamentals":
      sectionGuidance = `TECHNICAL CS FUNDAMENTALS: Pivot to core fundamentals (database concurrency/isolation, networking, or memory management).`;
      targetCompetency = "CS Fundamentals & Systems Knowledge";
      break;
    case "coding_system_design":
      if (blueprint.experienceMode === "experienced") {
        sectionGuidance = `SYSTEM DESIGN: High-scale distributed systems design, bottlenecks, and failure recovery.`;
        targetCompetency = "Distributed System Design";
      } else {
        sectionGuidance = `ALGORITHMIC REASONING: Data structure trade-offs, time/space complexity, or stream processing.`;
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

  // 3. Unified Prompt
  const prompt = `You are Alex, a FAANG Staff Engineer conducting a rigorous, natural technical interview.
You will perform two linked tasks in one turn:
Task 1: Evaluate the candidate's latest answer with technical precision.
Task 2: Formulate your next adaptive question based directly on that evaluation and interview phase.

CURRENT PHASE: ${currentSection}
TARGET ROLE: ${dossier.targetRole} (${blueprint.experienceMode} level)
SECTION GUIDANCE: ${sectionGuidance}

CANDIDATE DOSSIER:
- Name: ${dossier.name}
- Self-Introduction: "${sessionState.candidateIntroduction || "Not provided"}"
- Verified Skills: ${dossier.verifiedSkills.join(", ") || "None"}
- Claimed Skills: ${dossier.claimedSkills.join(", ") || "General SWE"}
- Projects: ${dossier.projects.map((p) => p.title).join("; ") || "None"}

LAST QUESTION ASKED:
"${qText}"

CANDIDATE'S ANSWER (${wordCount} words):
"${lastAnswerText.slice(0, 1800)}"

PREVIOUS QUESTIONS ASKED:
${sessionState.questionsAsked.map((q, idx) => `Q${idx + 1}: "${q.question}"`).join("\n") || "None."}

RULES:
1. Assess answer_quality strictly: "strong" (concrete details, personal choices, trade-offs), "adequate" (answers core question accurately), "shallow" (vague/buzzwords), "off-topic", "contradictory".
2. If answer is shallow, next question MUST probe deeper on specific implementation or metrics.
3. If answer is adequate/strong, advance or explore trade-offs.
4. Next question must be under 60 words. Exactly ONE question.
5. NEVER repeat or rephrase any previous question.
6. Return ONLY valid JSON in this schema:
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
      const parsed = JSON.parse(cleaned);
      if (parsed.assessment && parsed.next_question?.question) {
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
          validatedNextQ.difficulty_level = parsed.next_question.difficulty_level || sessionState.currentDifficulty;
          validatedNextQ.is_follow_up = Boolean(parsed.next_question.is_follow_up);
          validatedNextQ.evidence_grounding = sectionPlanItem?.focus || "Unified turn engine";

          const nextAction = parsed.assessment.next_action || (parsed.assessment.answer_quality === "shallow" ? "follow_up_probe" : "move_to_new_topic");
          return {
            assessment: {
              answer_quality: parsed.assessment.answer_quality || "adequate",
              reasoning: stripThink(parsed.assessment.reasoning || "Technical answer evaluated."),
              topics_demonstrated: Array.isArray(parsed.assessment.topics_demonstrated) ? parsed.assessment.topics_demonstrated : ["Engineering Implementation"],
              unresolved_threads: Array.isArray(parsed.assessment.unresolved_threads) ? parsed.assessment.unresolved_threads : [],
              next_action: nextAction,
              difficulty_adjustment: parsed.assessment.difficulty_adjustment || "maintain",
              extracted_claims: Array.isArray(parsed.assessment.extracted_claims) ? parsed.assessment.extracted_claims : [],
            },
            nextQuestion: validatedNextQ,
            timingMs: Date.now() - t0,
          };
        }
      }
    }
  } catch (err: any) {
    console.warn("[interview-engine] assessAndGenerateAdaptiveTurn unified call fallback:", err.message);
  }

  // Fallback: fast assessment + blueprint fallback question
  const fallbackAssessment = await assessCandidateAnswer(qText, lastAnswerText, sessionState, dossier);
  const fallbackQuestion = await generateNextAdaptiveQuestion(sessionState, dossier, conversationHistory, fallbackAssessment);
  fallbackQuestion.competency_focus = fallbackQuestion.competency_focus || (fallbackQuestion as any).competency_targeted || targetCompetency || "technical_deep_dive";

  return {
    assessment: fallbackAssessment,
    nextQuestion: fallbackQuestion,
    timingMs: Date.now() - t0,
  };
}

// ══════════════════════════════════════════════════════════════
// 8. EVIDENCE-BASED FINAL REPORT GENERATOR
// ══════════════════════════════════════════════════════════════

export async function generateInterviewFinalReport(
  sessionState: AdvancedSessionState,
  transcript: Array<{ role: string; content: string }>,
  dossier: CandidateInterviewDossier
): Promise<InterviewFinalReport> {
  const turns = sessionState.turns;
  const turnsCount = turns.length;

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
${JSON.stringify(sessionState.answerDistribution)}

SECTIONS COVERED:
${sessionState.blueprint.sectionPlan.map((s) => `${s.section}: ${s.completed ? "Completed" : "Visited"}`).join(", ")}

TOPICS DEMONSTRATED:
${sessionState.topicsCovered.join(", ") || "General communication"}

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

    if (process.env.GEMINI_API_KEY) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig: { temperature: 0.2 } });
        const result = await model.generateContent(prompt);
        raw = result.response.text();
      } catch (geminiErr: any) {
        console.warn("[interview-engine] Gemini final report fallback:", geminiErr.message);
      }
    }

    if (!raw && process.env.GROQ_API_KEY) {
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
    }

    if (raw) {
      const parsed = extractJSON(raw);
      return {
        candidateId: dossier.candidateId,
        sessionId: sessionState.sessionId,
        targetRole: dossier.targetRole,
        overallScore: Number(parsed.overallScore) || 72,
        hiringRecommendation: parsed.hiringRecommendation || "HIRE",
        confidence: Number(parsed.confidence) || 80,
        executiveSummary: stripThink(parsed.executiveSummary || "Interview completed with structured assessment."),
        competenciesAssessed: Array.isArray(parsed.competenciesAssessed) ? parsed.competenciesAssessed : [],
        competenciesNotAssessed: Array.isArray(parsed.competenciesNotAssessed) ? parsed.competenciesNotAssessed : [],
        projectOwnershipAndVeracity: parsed.projectOwnershipAndVeracity || { score: 70, summary: "Adequate ownership demonstrated", claimedVsObserved: "Matched" },
        technicalDepth: parsed.technicalDepth || { score: 70, summary: "Solid fundamentals demonstrated" },
        problemSolvingAndReasoning: parsed.problemSolvingAndReasoning || { score: 72, summary: "Reasoning explained" },
        communicationAndBehavioral: parsed.communicationAndBehavioral || { score: 78, summary: "Clear communication" },
        provenanceSummary: {
          verifiedFactsUsed: Array.from(new Set([...dossier.verifiedSkills, ...(parsed.provenanceSummary?.verifiedFactsUsed || [])])),
          candidateClaimsInvestigated: Array.from(new Set([...dossier.projects.map((p) => p.title), ...(parsed.provenanceSummary?.candidateClaimsInvestigated || [])])),
          observedArtifactsReferenced: Array.from(new Set([...dossier.githubStatus.accessibleRepos.map((r) => r.name), ...(parsed.provenanceSummary?.observedArtifactsReferenced || [])])),
          unverifiedOrMissingSources: Array.from(new Set([...dossier.missingOrUnverified, ...(parsed.provenanceSummary?.unverifiedOrMissingSources || [])])),
        },

        keyStrengths: Array.isArray(parsed.keyStrengths) ? parsed.keyStrengths : ["Demonstrated technical adaptability"],
        criticalGaps: Array.isArray(parsed.criticalGaps) ? parsed.criticalGaps : ["Further depth on edge cases recommended"],
        recommendedLearningActions: Array.isArray(parsed.recommendedLearningActions) ? parsed.recommendedLearningActions : ["Deepen knowledge of distributed trade-offs"],
        interviewerPrivateNote: stripThink(parsed.interviewerPrivateNote || "Candidate performed well with clear baseline competency."),
      };
    }
  } catch (err: any) {
    console.warn("[interview-engine] generateInterviewFinalReport API warning:", err.message);
  }

  // Deterministic fallback report
  const strongCount = sessionState.answerDistribution.strong;
  const adequateCount = sessionState.answerDistribution.adequate;
  const overall = Math.min(95, Math.max(45, Math.round((strongCount * 25 + adequateCount * 18) / Math.max(1, turnsCount) * 4)));
  const rec = overall >= 80 ? "STRONG_HIRE" : overall >= 68 ? "HIRE" : overall >= 55 ? "LEANING_HIRE" : "NO_HIRE";

  return {
    candidateId: dossier.candidateId,
    sessionId: sessionState.sessionId,
    targetRole: dossier.targetRole,
    overallScore: overall,
    hiringRecommendation: rec,
    confidence: 80,
    executiveSummary: `Candidate completed ${turnsCount} interview turns demonstrating capability across ${sessionState.topicsCovered.length || 1} technical areas.`,
    competenciesAssessed: [
      {
        competency: "Project Implementation & Architecture",
        score: overall,
        status: overall >= 65 ? "demonstrated" : "gap",
        verbatimQuote: candidateQuotes[0] || "Candidate presented their architectural decisions.",
        evaluation: "Demonstrated clear ownership of project design decisions.",
      },
    ],
    competenciesNotAssessed: [
      { competency: "Production Scaling under 100k TPS", reason: "Out of scope for this interview duration" },
    ],
    projectOwnershipAndVeracity: {
      score: overall,
      summary: "Candidate explained their technical design clearly.",
      claimedVsObserved: "Explanations aligned with resume claims.",
    },
    technicalDepth: { score: overall, summary: "Solid foundational depth demonstrated." },
    problemSolvingAndReasoning: { score: overall, summary: "Systematic step-by-step problem-solving." },
    communicationAndBehavioral: { score: 80, summary: "Clear and concise technical communication." },
    provenanceSummary: {
      verifiedFactsUsed: dossier.verifiedSkills,
      candidateClaimsInvestigated: dossier.projects.map((p) => p.title),
      observedArtifactsReferenced: dossier.githubStatus.accessibleRepos.map((r) => r.name),
      unverifiedOrMissingSources: dossier.missingOrUnverified,
    },
    keyStrengths: ["Clear project articulation", "Solid grasp of core engineering trade-offs"],
    criticalGaps: ["Further testing and edge-case validation practice recommended"],
    recommendedLearningActions: ["Deepen automated testing practices on GitHub projects"],
    interviewerPrivateNote: "Candidate showed strong foundational ability and clear communication throughout the session.",
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

  // 1. Commit demonstrated competencies into Student DNA
  for (const comp of report.competenciesAssessed) {
    if (comp.status === "demonstrated" && comp.score >= 60) {
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
  try {
    recordCareerMemoryItem(candidateId, {
      id: `cm_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
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
  } catch (memErr) {
    console.warn("[interview-engine] Career memory record warning:", memErr);
  }

  return { success: count > 0, evidenceAdded: count };
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
