/**
 * EVIDENCE LAYER — CORE TYPES
 * 
 * Every claim made by a candidate resolves to one of four states:
 * - established: direct evidence found and confirmed
 * - partial: some evidence found, doesn't fully confirm the claim
 * - unknown: no evidence found (NEVER treated as "candidate lied"; routed to interview/work-sample)
 * - conflicting: evidence contradicts the claim
 */

export type EvidenceSource =
  | "github"
  | "leetcode"
  | "codeforces"
  | "resume"
  | "interview"
  | "behavioral";

export type EvidenceStatus =
  | "established"
  | "partial"
  | "unknown"
  | "conflicting";

export interface GitHubSurfaceRepo {
  name: string;
  is_fork: boolean;
  commit_count: number;
  commit_span_days: number;
  contributors: number;
}

export interface GitHubSurfaceFacts {
  repo_count: number;
  top_languages: string[];
  commits_last_6mo: number;
  top_repos: GitHubSurfaceRepo[];
}

export interface GitHubDeepRepoAnalysis {
  repo_name: string;
  commit_count: number;
  is_incremental_work: boolean;
  first_commit_at: string;
  last_commit_at: string;
  commit_span_days: number;
  commit_messages_sample: string[];
  pr_count: number;
  issue_activity_count: number;
}

export interface GitHubDeepFacts {
  repo_analyses: GitHubDeepRepoAnalysis[];
}

export interface CodeforcesFacts {
  handle: string;
  current_rating: number;
  max_rating: number;
  rank: string;
  contest_count: number;
  total_solved: number;
  solved_by_difficulty: Record<string, number>;
}

export interface LeetCodeFacts {
  username: string;
  total_solved: number;
  easy_solved: number;
  medium_solved: number;
  hard_solved: number;
  contest_rating?: number;
  global_ranking?: number;
}

export interface ResumeFacts {
  skills_claimed: string[];
  projects: Array<{
    name: string;
    technologies: string[];
    descriptionSnippet?: string;
  }>;
  companies: string[];
  documented_experience_years?: number;
  dsa_claim?: string;
  education?: string;
}

export type NormalizedFacts =
  | GitHubSurfaceFacts
  | GitHubDeepFacts
  | CodeforcesFacts
  | LeetCodeFacts
  | ResumeFacts
  | Record<string, any>
  | null;

export interface EvidenceRecord {
  id: string;
  candidate_id: string;
  role_id: string;
  source: EvidenceSource;
  claim: string;
  raw_data: any;
  normalized_facts: NormalizedFacts;
  extracted_summary?: string;
  status: EvidenceStatus;
  status_reason?: string;
  role_relevance?: string;
  fetched_at: string;
}

export interface CandidateProfileInput {
  candidateId: string;
  name: string;
  email?: string;
  resumeText?: string;
  githubUsernameOrUrl?: string;
  codeforcesHandle?: string;
  leetcodeUsernameOrUrl?: string;
  claimedSkills?: string[];
}

export interface EvidenceCollectionResult {
  candidateId: string;
  roleId: string;
  stage: "surface" | "deep";
  records: EvidenceRecord[];
  targetedInterviewQuestions?: Array<{
    requirement: string;
    gapDescription: string;
    question: string;
  }>;
  collectedAt: string;
}
