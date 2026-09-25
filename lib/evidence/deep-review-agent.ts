// lib/evidence/deep-review-agent.ts
//
// Stage 2b: wires the "Deep Project & Skill Verification" system prompt into a real,
// callable function. Assembles input from the other agents, calls the LLM, then
// validates every quoted "evidence_quotes" string against the actual input JSON —
// exactly the same anti-hallucination pattern as verifyQuoteExists() in resume-matcher.ts.
// If a quote can't be found in what we actually sent the model, we downgrade that
// step's verdict to "insufficient_evidence" instead of trusting it.

import { GithubEvidenceDossier } from "./github-agent";
import { LeetcodeEvidenceDossier } from "./leetcode-agent";
import { groqFetch } from "../groq";

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const GH_API = "https://api.github.com";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

function getGithubHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }
  return headers;
}

// ---------------- Input shape sent to the model ----------------

export interface ResumeProjectClaim {
  project_name: string;
  description_from_resume: string;
  claimed_technologies: string[];
  claimed_role: string;
  claimed_impact: string;
}

export interface HackathonClaim {
  name: string;
  claimed_project_link: string;
  claimed_description: string;
  claimed_result: string;
}

export interface ContestHistoryEntry {
  platform: string;
  handle: string;
  rating: number | null;
  contests_participated: number | null;
}

export interface DeepReviewRepoInput {
  name: string;
  description: string;
  readme_content: string;
  languages: string[];
  commit_history: { message: string; date: string; additions: number; deletions: number }[];
  contributors_count: number;
  url: string;
}

export interface DeepReviewInput {
  candidate_id: string;
  resume_project_claims: ResumeProjectClaim[];
  github_repos: DeepReviewRepoInput[];
  leetcode_stats: {
    total_solved: number;
    easy: number;
    medium: number;
    hard: number;
    contest_rating: number | null;
    global_ranking: number | null;
  };
  hackathon_claims: HackathonClaim[];
  contest_history: ContestHistoryEntry[];
}

// ---------------- Output shape expected back from the model ----------------

export interface StepResult {
  verdict: string;
  evidence_quotes: string[];
}

export interface PerProjectResult {
  project_name: string;
  matched_repo_url: string | null;
  step1_claim_match: StepResult;
  step2_vibe_coding_signal: StepResult;
  step3_learning_reflection: StepResult;
}

export interface DeepReviewOutput {
  candidate_id: string;
  stage: "deep_review";
  per_project_results: PerProjectResult[];
  skill_consistency: {
    dsa_claim_vs_leetcode: StepResult;
    competitive_programming_claim_vs_contest_history: StepResult;
  };
  hackathon_verification: { hackathon_name: string; verdict: string; evidence_quotes: string[] }[];
  overall_confidence: "high" | "medium" | "low";
  human_review_notes: string;
}

// ---------------- The system prompt (verbatim from the design doc) ----------------

export const DEEP_REVIEW_SYSTEM_PROMPT = `You are a Project & Skill Verification Analyst for a recruitment platform. Recruiters and
students will both see your output, so every conclusion you produce MUST be traceable to a
specific fact you were given. You are not allowed to guess, assume, or use outside knowledge
about the candidate, the technologies, or "how these things usually go." If the input does not
contain enough information to answer a step, you MUST say so explicitly instead of filling the
gap with an assumption.

You will be given a JSON object matching the DeepReviewInput shape: candidate_id,
resume_project_claims[], github_repos[] (each with name, description, readme_content,
languages, commit_history[], contributors_count, url), leetcode_stats, hackathon_claims[],
contest_history[].

Work through the following steps IN ORDER, for EVERY claimed project. Do not skip a step.
Do not merge steps.

STEP 1 — CLAIM-TO-REPO MATCHING
For each entry in resume_project_claims:
  1a. Search github_repos for the best-matching repo using name/description/readme_content
      similarity to description_from_resume. State which repo you matched it to, or state
      "no_matching_repo_found" if nothing plausible exists.
  1b. Quote the EXACT phrase(s) from description_from_resume and the EXACT phrase(s) from the
      repo's description/readme_content that support or contradict each other. Copy substrings
      verbatim — never paraphrase.
  1c. Verdict: "matched" / "partially_matched" / "mismatched" / "not_found".

STEP 2 — VIBE-CODING / LOW-ENGAGEMENT DETECTION
Using ONLY commit_history for the matched repo, cite actual commit dates/messages/counts:
  2a. If a "complex" claimed project has fewer than 3 total commits, flag "low_commit_depth"
      and quote the count.
  2b. If most commits cluster within a single day/few hours despite claimed complexity, flag
      "compressed_timeline" and quote the dates.
  2c. Classify messages as "generic" (e.g. "update", "final", "initial commit") vs
      "descriptive". Quote 2-3 representative messages. If 80%+ generic, flag
      "generic_commit_messages".
  2d. Note presence/absence of iteration evidence (bug fixes, refactors) as a signal only.
  2e. Output ONE of: "signals_of_genuine_iterative_work" / "mixed_signals" /
      "signals_of_low_engagement_or_single_shot_generation" / "insufficient_commit_data".
      Phrase as "the commit pattern shows X" — never as an accusation or certainty.

STEP 3 — LEARNING / UNDERSTANDING REFLECTION CHECK
  3a. Does readme_content explain WHY design decisions were made? Quote if yes, else "not present".
  3b. Do commit messages reference a specific bug/edge case/trade-off handled? Quote up to 2.
  3c. Verdict: "clear_evidence_of_understanding" / "some_evidence" / "no_evidence_found".

STEP 4 — SKILL-CONSISTENCY CROSS-CHECK
  4a. If claims mention DSA/algorithmic strength, compare against leetcode_stats (medium/hard
      fraction, contest_rating). State the numbers plainly.
  4b. Flag "consistent" / "inconsistent" / "not_applicable" with exact numbers quoted.
  4c. Do the same for contest_history if competitive programming is claimed.

STEP 5 — HACKATHON VERIFICATION
For each entry in hackathon_claims:
  5a. State whether claimed_project_link is present and non-empty.
  5b. If a matching repo exists, cross-check claimed_description the same way as Step 1.
  5c. Verdict: "verifiable" / "link_present_but_unverifiable_content" / "no_link_provided".

STEP 6 — AGGREGATE OUTPUT
Return EXACTLY this JSON shape and nothing else — no markdown fences, no preamble, no text
before or after it. Every evidence_quotes entry must be a substring that literally appears
somewhere in the input JSON you were given.

{
  "candidate_id": "<from input>",
  "stage": "deep_review",
  "per_project_results": [
    {
      "project_name": "...",
      "matched_repo_url": "<url or null>",
      "step1_claim_match": { "verdict": "...", "evidence_quotes": ["..."] },
      "step2_vibe_coding_signal": { "verdict": "...", "evidence_quotes": ["..."] },
      "step3_learning_reflection": { "verdict": "...", "evidence_quotes": ["..."] }
    }
  ],
  "skill_consistency": {
    "dsa_claim_vs_leetcode": { "verdict": "...", "evidence_quotes": ["..."] },
    "competitive_programming_claim_vs_contest_history": { "verdict": "...", "evidence_quotes": ["..."] }
  },
  "hackathon_verification": [
    { "hackathon_name": "...", "verdict": "...", "evidence_quotes": ["..."] }
  ],
  "overall_confidence": "high | medium | low",
  "human_review_notes": "2-3 plain-language sentences summarizing only what was found above — no new claims, no final pass/fail judgment."
}

HARD RULES:
- Never state a fact not traceable to the input JSON. Missing data -> "insufficient_evidence".
- Never claim a project "is vibe-coded" or "is fake" with certainty — only describe signals.
- Never estimate or average a number you were not given.
- Output ONLY the final JSON object, nothing else.
- If resume_project_claims or github_repos is empty, say so in human_review_notes and return
  empty arrays — never fabricate a project to analyze.`;

// ---------------- Step 1: assemble input from your other agents ----------------

export function buildDeepReviewInput(params: {
  candidateId: string;
  resumeProjectClaims: ResumeProjectClaim[];
  githubDossier: GithubEvidenceDossier;
  fullRepoDetails: DeepReviewRepoInput[]; // fetch README + commit_history per repo separately (see fetchFullRepoDetails below)
  leetcodeDossier: LeetcodeEvidenceDossier;
  hackathonClaims: HackathonClaim[];
  contestHistory: ContestHistoryEntry[];
}): DeepReviewInput {
  return {
    candidate_id: params.candidateId,
    resume_project_claims: params.resumeProjectClaims,
    github_repos: params.fullRepoDetails,
    leetcode_stats: {
      total_solved: params.leetcodeDossier.totalSolved,
      easy: params.leetcodeDossier.easySolved,
      medium: params.leetcodeDossier.mediumSolved,
      hard: params.leetcodeDossier.hardSolved,
      contest_rating: params.leetcodeDossier.contestRating,
      global_ranking: params.leetcodeDossier.contestGlobalRanking,
    },
    hackathon_claims: params.hackathonClaims,
    contest_history: params.contestHistory,
  };
}

// Helper: pulls full commit messages (not just stats) for a repo, needed for Step 2/3 above.
// github-agent.ts's summarizeRepo() only pulls aggregate stats — this pulls actual messages.
export async function fetchFullRepoDetails(
  owner: string,
  repoNames: string[]
): Promise<DeepReviewRepoInput[]> {
  const results: DeepReviewRepoInput[] = [];

  for (const name of repoNames) {
    try {
      const [repoRes, readmeRes, commitsRes] = await Promise.all([
        fetch(`${GH_API}/repos/${owner}/${name}`, {
          headers: getGithubHeaders(),
        }),
        fetch(`${GH_API}/repos/${owner}/${name}/readme`, {
          headers: getGithubHeaders(),
        }),
        fetch(`${GH_API}/repos/${owner}/${name}/commits?per_page=100`, {
          headers: getGithubHeaders(),
        }),
      ]);

      const repo = repoRes.ok ? await repoRes.json() : null;
      if (!repo) continue;

      let readmeContent = "";
      if (readmeRes.ok) {
        const readmeJson = await readmeRes.json();
        try {
          readmeContent = Buffer.from(readmeJson.content, "base64").toString("utf-8");
        } catch {
          readmeContent = "";
        }
      }

      let commitHistory: DeepReviewRepoInput["commit_history"] = [];
      if (commitsRes.ok) {
        const commits = await commitsRes.json();
        if (Array.isArray(commits)) {
          commitHistory = commits.map((c: any) => ({
            message: c.commit?.message ?? "",
            date: c.commit?.author?.date ?? "",
            additions: 0,
            deletions: 0,
          }));
        }
      }

      results.push({
        name: repo.name,
        description: repo.description ?? "",
        readme_content: readmeContent,
        languages: repo.language ? [repo.language] : [],
        commit_history: commitHistory,
        contributors_count: 0,
        url: repo.html_url ?? `https://github.com/${owner}/${name}`,
      });
    } catch {
      // Continue inspecting other repos if one fails
      continue;
    }
  }

  return results;
}

// ---------------- Step 2: call the LLM with the system prompt ----------------

export async function callDeepReviewLLM(input: DeepReviewInput): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY || "";
  const fetchFn = typeof groqFetch === "function" ? groqFetch : fetch;
  const res = await fetchFn("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0, // deterministic — this is verification, not creative writing
      messages: [
        { role: "system", content: DEEP_REVIEW_SYSTEM_PROMPT },
        { role: "user", content: JSON.stringify(input) },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Deep review LLM call failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  let raw: string = data.choices?.[0]?.message?.content ?? "";

  // Same defensive cleanup as resume-matcher.ts — Groq sometimes leaks <think> tags or fences.
  raw = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  raw = raw.replace(/^```(json)?/i, "").replace(/```$/, "").trim();
  return raw;
}

// ---------------- Step 3: validate every quote actually exists in what we sent ----------------

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

export function quoteExistsInInput(quote: string, inputBlob: string): boolean {
  if (!quote || quote.trim().length === 0) return false;
  return normalize(inputBlob).includes(normalize(quote));
}

export function validateAndDowngrade(output: DeepReviewOutput, inputBlob: string): DeepReviewOutput {
  const checkStep = (step: StepResult): StepResult => {
    if (!step) {
      return { verdict: "insufficient_evidence", evidence_quotes: [] };
    }
    const quotes = Array.isArray(step.evidence_quotes) ? step.evidence_quotes : [];
    // If quotes are expected but not present, or if any quote is missing from inputBlob
    const allQuotesReal = quotes.length > 0 && quotes.every((q) => quoteExistsInInput(q, inputBlob));
    if (!allQuotesReal) {
      return {
        verdict: "insufficient_evidence",
        evidence_quotes: [],
      };
    }
    return step;
  };

  const perProjectResults = Array.isArray(output.per_project_results) ? output.per_project_results : [];
  for (const proj of perProjectResults) {
    proj.step1_claim_match = checkStep(proj.step1_claim_match);
    proj.step2_vibe_coding_signal = checkStep(proj.step2_vibe_coding_signal);
    proj.step3_learning_reflection = checkStep(proj.step3_learning_reflection);
  }

  if (output.skill_consistency) {
    output.skill_consistency.dsa_claim_vs_leetcode = checkStep(
      output.skill_consistency.dsa_claim_vs_leetcode
    );
    output.skill_consistency.competitive_programming_claim_vs_contest_history = checkStep(
      output.skill_consistency.competitive_programming_claim_vs_contest_history
    );
  }

  if (Array.isArray(output.hackathon_verification)) {
    output.hackathon_verification = output.hackathon_verification.map((h) => {
      const checked = checkStep({ verdict: h.verdict, evidence_quotes: h.evidence_quotes });
      return { ...h, verdict: checked.verdict, evidence_quotes: checked.evidence_quotes };
    });
  }

  return output;
}

// ---------------- Public entry point ----------------

export async function runDeepReview(input: DeepReviewInput): Promise<DeepReviewOutput> {
  const inputBlob = JSON.stringify(input);
  const raw = await callDeepReviewLLM(input);

  let parsed: DeepReviewOutput;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`Deep review LLM returned non-JSON output, refusing to guess: ${raw.slice(0, 300)}`);
  }

  return validateAndDowngrade(parsed, inputBlob);
}
