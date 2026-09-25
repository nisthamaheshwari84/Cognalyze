// lib/evidence/resume-matcher.ts
//
// Stage 1: 1000 resumes -> ~200. Every candidate (selected or not) gets a
// criterion-by-criterion, evidence-backed decision. Nothing here is a free-text
// LLM verdict — the LLM only EXTRACTS facts; the pass/fail logic is deterministic code.

import { Evidence, CriterionResult, CandidateDecision, computeConfidence } from "./types";
import { groqFetch } from "../groq";

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

export interface JDRequirement {
  id: string;
  criterion: string; // "2+ years React experience"
  mandatory: boolean;
}

export interface ExtractedFact {
  requirement_id: string;
  found: boolean;
  quote: string; // exact substring from resume, empty if not found
  resume_line_ref: string; // e.g. "line 12" — we keep line numbers when we split the resume
}

// ---- Step A: deterministic resume pre-processing (no LLM) ----
// We number every line so extraction can cite a real, checkable location.
export function numberResumeLines(resumeText: string): string {
  return resumeText
    .split("\n")
    .map((line, i) => `${i + 1}: ${line}`)
    .join("\n");
}

// ---- Step B: LLM does ONLY extraction, never scoring ----
// The prompt forces the model to quote verbatim + cite a line number, or say "not found."
// This is deliberately narrow — a model is far more reliable at "find and quote" than at "judge."
export async function extractFactsForResume(
  numberedResume: string,
  requirements: JDRequirement[]
): Promise<ExtractedFact[]> {
  const apiKey = process.env.GROQ_API_KEY || "";
  const system = `You are a strict fact-extraction engine, not a judge.
For each requirement, search the numbered resume text and decide ONLY:
- found: true/false — is there a direct, literal statement supporting this requirement?
- quote: the EXACT substring from the resume that supports it (copy verbatim, do not summarize). Empty string if not found.
- resume_line_ref: the line number(s) the quote came from, e.g. "line 12" or "lines 8-9". Empty string if not found.

Rules:
- Do NOT infer or assume. If the resume doesn't literally support a requirement, found = false.
- Do NOT rate quality. That is not your job.
- Output ONLY valid JSON, an array of objects: [{ "requirement_id": "...", "found": bool, "quote": "...", "resume_line_ref": "..." }]
- No markdown fences, no preamble, no explanation text outside the JSON array.`;

  const user = `REQUIREMENTS:
${requirements.map((r) => `- id="${r.id}": ${r.criterion}`).join("\n")}

NUMBERED RESUME:
${numberedResume}`;

  const fetchFn = typeof groqFetch === "function" ? groqFetch : fetch;
  const res = await fetchFn("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0, // deterministic extraction — no creativity wanted here
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Groq extraction call failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  let raw: string = data.choices?.[0]?.message?.content ?? "[]";

  // Strip <think> tags and code fences defensively — this is the exact bug already
  // seen in Cognalyze with Groq responses, so we guard for it here permanently.
  raw = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  raw = raw.replace(/^```(json)?/i, "").replace(/```$/, "").trim();

  let parsed: ExtractedFact[];
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Extraction returned non-JSON output, refusing to guess: ${raw.slice(0, 300)}`);
  }
  return parsed;
}

// ---- Step C: verify the quote actually exists in the resume before trusting it ----
// This is the anti-hallucination check: if the model "quotes" something that isn't
// literally in the source text, we downgrade it to not-found rather than trust it.
export function verifyQuoteExists(resumeText: string, quote: string): boolean {
  if (!quote || quote.trim().length === 0) return false;
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  return normalize(resumeText).includes(normalize(quote));
}

// ---- Step D: deterministic decision logic (no LLM) ----
// This is where "found evidence" turns into "advance/reject" — pure code, fully auditable.
export function buildDecision(
  candidateId: string,
  requirements: JDRequirement[],
  facts: ExtractedFact[],
  resumeText: string,
  evidencePool: Evidence[]
): CandidateDecision {
  const criteriaResults: CriterionResult[] = requirements.map((req) => {
    const fact = facts.find((f) => f.requirement_id === req.id);

    if (!fact) {
      return {
        criterion: req.criterion,
        verdict: "insufficient_evidence",
        evidence_ids: [],
        reasoning: "Extraction step returned no result for this requirement.",
      };
    }

    const quoteIsReal = fact.found && verifyQuoteExists(resumeText, fact.quote);

    if (!quoteIsReal) {
      return {
        criterion: req.criterion,
        verdict: "not_met",
        evidence_ids: [],
        reasoning: "No verifiable statement found in the resume for this requirement.",
      };
    }

    const evidenceId = `ev_${candidateId}_${req.id}`;
    evidencePool.push({
      id: evidenceId,
      source_type: "resume_text",
      source_ref: `resume:${fact.resume_line_ref}`,
      quote_or_fact: fact.quote,
      extracted_at: new Date().toISOString(),
    });

    return {
      criterion: req.criterion,
      verdict: "met",
      evidence_ids: [evidenceId],
      reasoning: `Resume states: "${fact.quote}" (${fact.resume_line_ref}).`,
    };
  });

  const mandatoryFailed = requirements
    .filter((r) => r.mandatory)
    .some((r) => criteriaResults.find((c) => c.criterion === r.criterion)?.verdict === "not_met");

  const outcome: CandidateDecision["outcome"] = mandatoryFailed ? "reject" : "advance";

  const failedCriteria = criteriaResults.filter((c) => c.verdict === "not_met");
  const rejectionSummary =
    outcome === "reject"
      ? `Not advanced — did not meet: ${failedCriteria.map((c) => c.criterion).join("; ")}.`
      : undefined;

  return {
    candidate_id: candidateId,
    stage: "resume_jd_match",
    outcome,
    criteria_results: criteriaResults,
    overall_confidence: computeConfidence(criteriaResults),
    rejection_summary: rejectionSummary,
    created_at: new Date().toISOString(),
  };
}

// ---- Public entry point for Stage 1 ----
export async function runResumeJdMatch(
  candidateId: string,
  resumeText: string,
  requirements: JDRequirement[]
): Promise<{ decision: CandidateDecision; evidence: Evidence[] }> {
  const numbered = numberResumeLines(resumeText);
  const facts = await extractFactsForResume(numbered, requirements);
  const evidencePool: Evidence[] = [];
  const decision = buildDecision(candidateId, requirements, facts, resumeText, evidencePool);
  return { decision, evidence: evidencePool };
}

// ---- Batch runner with basic concurrency control for free-tier rate limits ----
export async function runResumeJdMatchBatch(
  candidates: { id: string; resumeText: string }[],
  requirements: JDRequirement[],
  concurrency = 3 // keep low for free Groq tier rate limits
): Promise<{ decisions: CandidateDecision[]; evidence: Evidence[] }> {
  const decisions: CandidateDecision[] = [];
  const allEvidence: Evidence[] = [];

  for (let i = 0; i < candidates.length; i += concurrency) {
    const batch = candidates.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map((c) => runResumeJdMatch(c.id, c.resumeText, requirements))
    );
    for (const r of results) {
      decisions.push(r.decision);
      allEvidence.push(...r.evidence);
    }
  }

  return { decisions, evidence: allEvidence };
}
