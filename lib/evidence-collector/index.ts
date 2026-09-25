/**
 * EVIDENCE LAYER — CENTRAL ORCHESTRATOR
 * 
 * Implements the 2-step LLM extraction + classification architecture:
 * - Step 1: Extract factual summary from normalized_facts using llama-3.1-8b-instant (No scoring/verdicts).
 * - Step 2: Classify status into established | partial | unknown | conflicting using llama-3.3-70b-versatile.
 * - Code Guard: Enforces that 'established' has backing facts; downgrades unbacked claims to 'unknown'.
 * - Step 3: Generates targeted interview questions for remaining 'unknown' rows in Deep Review stage.
 * 
 * Non-Negotiable Contract:
 * - Never calls an external API downstream; writes directly to the evidence table.
 * - Never treats 'unknown' as negative or as "candidate lied".
 * - All sources fetched concurrently with Promise.allSettled for failure isolation.
 */

import { randomUUID } from "node:crypto";
import { groqFetch } from "@/lib/groq-client";
import {
  CandidateProfileInput,
  EvidenceCollectionResult,
  EvidenceRecord,
  EvidenceSource,
  EvidenceStatus,
  NormalizedFacts,
} from "./types";
import { surfacePull as githubSurfacePull, deepPull as githubDeepPull } from "./github";
import { pullCodeforces } from "./codeforces";
import { pullLeetCode } from "./leetcode";
import { extractResumeFacts } from "./resume";
import {
  buildStep1ExtractionPrompt,
  buildStep2ClassificationPrompt,
  buildStep3InterviewQuestionPrompt,
} from "./prompts";
import { enforceEvidenceGuard } from "./guard";
import { saveEvidenceRecords, getEvidenceForCandidate } from "./store";

function extractJSON(raw: string): any {
  if (!raw) return {};
  const clean = raw
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();

  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1) return {};

  const jsonStr = clean.slice(start, end + 1);
  try {
    return JSON.parse(jsonStr);
  } catch {
    try {
      return JSON.parse(
        jsonStr
          .replace(/,\s*}/g, "}")
          .replace(/,\s*]/g, "]")
          .replace(/\n/g, " ")
      );
    } catch {
      return {};
    }
  }
}

/**
 * Step 1: LLM Factual Extraction
 * Model: llama-3.1-8b-instant
 * Banned: Scoring, verdicts, evaluations.
 */
export async function executeStep1Extraction(
  source: EvidenceSource,
  normalizedFacts: NormalizedFacts
): Promise<string> {
  if (!normalizedFacts) {
    return `No records or evidence returned from source (${source}).`;
  }

  const { system, user } = buildStep1ExtractionPrompt(source, normalizedFacts);

  try {
    const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY || ""}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.05,
        response_format: { type: "json_object" },
        max_tokens: 300,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const parsed = extractJSON(data.choices?.[0]?.message?.content || "");
      if (parsed.extracted_summary && typeof parsed.extracted_summary === "string") {
        return parsed.extracted_summary.trim();
      }
    }
  } catch (err) {
    console.warn(`[EvidenceOrchestrator] Step 1 LLM extraction failed for ${source}:`, err);
  }

  // Deterministic fallback if LLM is unavailable or rate-limited
  return generateDeterministicSummary(source, normalizedFacts);
}

/**
 * Step 2: LLM Status Classification
 * Model: llama-3.3-70b-versatile (primary)
 */
export async function executeStep2Classification(
  claim: string,
  source: EvidenceSource,
  extractedSummary: string,
  normalizedFacts: NormalizedFacts
): Promise<{ status: EvidenceStatus; statusReason: string }> {
  // If facts are null, short-circuit to unknown immediately without burning tokens
  if (!normalizedFacts) {
    return {
      status: "unknown",
      statusReason: `Available evidence does not currently confirm this claim. Source (${source}) returned no data.`,
    };
  }

  const { system, user } = buildStep2ClassificationPrompt(
    claim,
    source,
    extractedSummary,
    normalizedFacts
  );

  let proposedStatus: EvidenceStatus = "unknown";
  let proposedReason = `Available evidence does not currently confirm this claim (${source}).`;

  try {
    const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY || ""}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.0,
        response_format: { type: "json_object" },
        max_tokens: 250,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const parsed = extractJSON(data.choices?.[0]?.message?.content || "");
      if (parsed.status && ["established", "partial", "unknown", "conflicting"].includes(parsed.status)) {
        proposedStatus = parsed.status as EvidenceStatus;
      }
      if (parsed.status_reason && typeof parsed.status_reason === "string") {
        proposedReason = parsed.status_reason.trim();
      }
    }
  } catch (err) {
    console.warn(`[EvidenceOrchestrator] Step 2 classification LLM failed for ${claim}:`, err);
    // Deterministic fallback evaluation
    const fallback = evaluateDeterministicStatus(claim, source, normalizedFacts);
    proposedStatus = fallback.status;
    proposedReason = fallback.reason;
  }

  // Apply deterministic code guard against model hallucinations
  const guarded = enforceEvidenceGuard(
    proposedStatus,
    proposedReason,
    claim,
    source,
    normalizedFacts
  );

  return {
    status: guarded.finalStatus,
    statusReason: guarded.finalReason,
  };
}

/**
 * Step 3: Targeted Interview Question Generation (Deep review stage only)
 * For rows still in 'unknown' status.
 */
export async function generateTargetedInterviewQuestion(
  requirement: string,
  unresolvedClaim: string,
  sourceChecked: string
): Promise<string> {
  const { system, user } = buildStep3InterviewQuestionPrompt(
    requirement,
    unresolvedClaim,
    sourceChecked
  );

  try {
    const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY || ""}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
        max_tokens: 200,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const parsed = extractJSON(data.choices?.[0]?.message?.content || "");
      if (parsed.targeted_question && typeof parsed.targeted_question === "string") {
        return parsed.targeted_question.trim();
      }
    }
  } catch (err) {
    console.warn("[EvidenceOrchestrator] Step 3 interview question LLM failed:", err);
  }

  return `Can you walk us through a specific technical challenge you encountered when implementing ${requirement}, including the trade-offs you evaluated?`;
}

/**
 * Deterministic summary fallback when LLM is offline
 */
function generateDeterministicSummary(source: EvidenceSource, facts: any): string {
  if (!facts) return `Source ${source} returned no verified records.`;

  if (source === "github") {
    if ("repo_count" in facts) {
      const topLangs = (facts.top_languages || []).join(", ") || "None";
      return `GitHub profile confirms ${facts.repo_count} public repositories, ${facts.commits_last_6mo} commits over the last 6 months, and primary languages: ${topLangs}.`;
    }
    if ("repo_analyses" in facts) {
      const count = (facts.repo_analyses || []).length;
      return `Deep repository forensic analysis of ${count} primary repositories confirms commit histories and incremental development patterns.`;
    }
  }

  if (source === "codeforces") {
    return `Codeforces profile for ${facts.handle} shows a current rating of ${facts.current_rating} (max: ${facts.max_rating}, rank: ${facts.rank}), ${facts.contest_count} contests, and ${facts.total_solved} verified solved problems.`;
  }

  if (source === "leetcode") {
    return `LeetCode profile for ${facts.username} confirms ${facts.total_solved} solved problems (${facts.easy_solved} Easy, ${facts.medium_solved} Medium, ${facts.hard_solved} Hard)${facts.contest_rating ? `, contest rating: ${facts.contest_rating}` : ""}.`;
  }

  if (source === "resume") {
    const skills = (facts.skills_claimed || []).slice(0, 5).join(", ");
    return `Resume documents ${facts.documented_experience_years || 0} years of experience with claimed skills: ${skills}.`;
  }

  return "Verified structured evidence records extracted.";
}

/**
 * Deterministic status fallback when LLM is offline
 */
function evaluateDeterministicStatus(
  claim: string,
  source: EvidenceSource,
  facts: any
): { status: EvidenceStatus; reason: string } {
  if (!facts) {
    return {
      status: "unknown",
      reason: `Available evidence does not currently confirm this claim. Source (${source}) returned no data.`,
    };
  }

  const claimLower = claim.toLowerCase();

  if (source === "github" && "top_repos" in facts) {
    const hasLang = (facts.top_languages || []).some((l: string) => claimLower.includes(l.toLowerCase()));
    if (hasLang && facts.commits_last_6mo > 0) {
      return {
        status: "established",
        reason: `Direct evidence confirmed with ${facts.commits_last_6mo} recent commits in matching language.`,
      };
    }
    if (facts.repo_count > 0) {
      return {
        status: "partial",
        reason: `Partial evidence found: ${facts.repo_count} repositories exist, but specific claim is not fully confirmed.`,
      };
    }
  }

  if (source === "codeforces" && "total_solved" in facts) {
    if (claimLower.includes("dsa") || claimLower.includes("competitive") || claimLower.includes("problem solving")) {
      if (facts.total_solved >= 50 || facts.current_rating >= 1200) {
        return {
          status: "established",
          reason: `Confirmed by ${facts.total_solved} verified problems solved and rating ${facts.current_rating}.`,
        };
      }
      return {
        status: "partial",
        reason: `Some competitive programming activity verified (${facts.total_solved} solved), but depth is limited.`,
      };
    }
  }

  if (source === "leetcode" && "total_solved" in facts) {
    if (claimLower.includes("dsa") || claimLower.includes("algorithm") || claimLower.includes("problem solving")) {
      if (facts.total_solved >= 50) {
        return {
          status: "established",
          reason: `Confirmed by ${facts.total_solved} LeetCode problems solved (${facts.medium_solved} Medium, ${facts.hard_solved} Hard).`,
        };
      }
      return {
        status: "partial",
        reason: `Partial evidence found: ${facts.total_solved} problems solved on LeetCode.`,
      };
    }
  }

  return {
    status: "unknown",
    reason: `Available evidence does not currently confirm this claim from ${source}.`,
  };
}

/**
 * Main Entry Point: Collects evidence matching the specific funnel stage.
 * Stage 1 -> 2: Surface pulls (GitHub, Codeforces, LeetCode, Resume)
 * Stage 2 -> Deep review: Deep pulls (GitHub deep per-repo inspection) + Step 3 interview generation
 */
export async function collectEvidence(
  candidateId: string,
  roleId: string,
  stage: "surface" | "deep",
  profile: CandidateProfileInput,
  roleRequirements: string[] = []
): Promise<EvidenceCollectionResult> {
  const fetchedAt = new Date().toISOString();
  const createdRecords: EvidenceRecord[] = [];

  // Default claims to verify if none provided
  const claimsToCheck = roleRequirements.length > 0
    ? roleRequirements
    : [
        "Backend API development",
        "Data Structures and Algorithms",
        "Version control and collaborative Git",
      ];

  if (stage === "surface") {
    // ── STAGE 1 -> 2 SURFACE PULLS (Parallel with Promise.allSettled) ──
    const tasks: Array<{
      source: EvidenceSource;
      claim: string;
      pullPromise: Promise<{ raw_data: any; normalized_facts: any }>;
    }> = [];

    // 1. Resume
    if (profile.resumeText) {
      tasks.push({
        source: "resume",
        claim: "Resume-documented experience & skills",
        pullPromise: Promise.resolve(extractResumeFacts(profile.resumeText)),
      });
    }

    // 2. GitHub surface pull
    if (profile.githubUsernameOrUrl) {
      tasks.push({
        source: "github",
        claim: "Git repository activity & language proficiency",
        pullPromise: githubSurfacePull(profile.githubUsernameOrUrl),
      });
    }

    // 3. Codeforces pull
    if (profile.codeforcesHandle) {
      tasks.push({
        source: "codeforces",
        claim: "Competitive programming and algorithmic problem solving",
        pullPromise: pullCodeforces(profile.codeforcesHandle),
      });
    }

    // 4. LeetCode pull
    if (profile.leetcodeUsernameOrUrl) {
      tasks.push({
        source: "leetcode",
        claim: "Data Structures & Algorithms problem-solving track record",
        pullPromise: pullLeetCode(profile.leetcodeUsernameOrUrl),
      });
    }

    const settled = await Promise.allSettled(tasks.map((t) => t.pullPromise));

    for (let i = 0; i < tasks.length; i++) {
      const task = tasks[i];
      const res = settled[i];

      let rawData: any = null;
      let facts: NormalizedFacts = null;

      if (res.status === "fulfilled" && res.value) {
        rawData = res.value.raw_data;
        facts = res.value.normalized_facts;
      } else if (res.status === "rejected") {
        rawData = { error: String(res.reason) };
        facts = null;
      }

      // Step 1: Extraction
      const summary = await executeStep1Extraction(task.source, facts);

      // Step 2: Classification against task claim
      const classification = await executeStep2Classification(
        task.claim,
        task.source,
        summary,
        facts
      );

      createdRecords.push({
        id: randomUUID(),
        candidate_id: candidateId,
        role_id: roleId,
        source: task.source,
        claim: task.claim,
        raw_data: rawData,
        normalized_facts: facts,
        extracted_summary: summary,
        status: classification.status,
        status_reason: classification.statusReason,
        role_relevance: task.claim,
        fetched_at: fetchedAt,
      });
    }
  } else {
    // ── STAGE 2 -> DEEP REVIEW (Deep GitHub pull + targeted interview generation) ──
    let rawData: any = null;
    let facts: NormalizedFacts = null;

    if (profile.githubUsernameOrUrl) {
      try {
        const deepRes = await githubDeepPull(profile.githubUsernameOrUrl);
        rawData = deepRes.raw_data;
        facts = deepRes.normalized_facts;
      } catch (err: any) {
        rawData = { error: err?.message || String(err) };
        facts = null;
      }
    }

    const summary = await executeStep1Extraction("github", facts);
    const deepClaim = "Production repository depth, incremental commits, and PR contribution history";
    const classification = await executeStep2Classification(
      deepClaim,
      "github",
      summary,
      facts
    );

    createdRecords.push({
      id: randomUUID(),
      candidate_id: candidateId,
      role_id: roleId,
      source: "github",
      claim: deepClaim,
      raw_data: rawData,
      normalized_facts: facts,
      extracted_summary: summary,
      status: classification.status,
      status_reason: classification.statusReason,
      role_relevance: "Repository engineering depth",
      fetched_at: fetchedAt,
    });
  }

  // Persist all records into the evidence table
  await saveEvidenceRecords(createdRecords);

  // Generate targeted interview questions for any 'unknown' rows in Deep Review stage
  const targetedInterviewQuestions: Array<{
    requirement: string;
    gapDescription: string;
    question: string;
  }> = [];

  if (stage === "deep") {
    // Fetch all existing evidence for candidate to identify remaining unknowns
    const allEvidence = await getEvidenceForCandidate(candidateId, roleId);
    const unknownRows = allEvidence.filter((r) => r.status === "unknown");

    for (const unk of unknownRows.slice(0, 4)) {
      const q = await generateTargetedInterviewQuestion(
        unk.role_relevance || unk.claim,
        unk.claim,
        unk.source
      );
      targetedInterviewQuestions.push({
        requirement: unk.role_relevance || unk.claim,
        gapDescription: unk.status_reason || "Evidence not found in external profile.",
        question: q,
      });
    }
  }

  return {
    candidateId,
    roleId,
    stage,
    records: createdRecords,
    targetedInterviewQuestions: stage === "deep" ? targetedInterviewQuestions : undefined,
    collectedAt: fetchedAt,
  };
}
