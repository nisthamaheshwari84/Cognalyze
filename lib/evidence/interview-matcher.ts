// lib/evidence/interview-matcher.ts
//
// Stage 3: Interview / DNA deep review.
// Applies the extract-then-score contract to interview transcripts:
// 1. Extracts claims with timestamps / speaker markers first (Groq temperature 0)
// 2. Anti-hallucination check: verifies the quote actually exists in the transcript
// 3. Scores only against verified extracted quotes — never raw transcript text directly.

import { Evidence, CriterionResult, CandidateDecision, computeConfidence, validateCandidateDecision } from "./types";
import { groqFetch } from "../groq";

const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

export interface InterviewCompetency {
  id: string;
  criterion: string; // e.g. "Demonstrates system design trade-off understanding in caching"
  mandatory: boolean;
}

export interface ExtractedInterviewFact {
  competency_id: string;
  found: boolean;
  quote: string; // exact candidate utterance
  timestamp_ref: string; // e.g. "00:12:03" or "line 28"
}

export function verifyInterviewQuote(transcriptText: string, quote: string): boolean {
  if (!quote || quote.trim().length === 0) return false;
  const normalize = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();
  return normalize(transcriptText).includes(normalize(quote));
}

export async function extractInterviewFacts(
  transcriptText: string,
  competencies: InterviewCompetency[]
): Promise<ExtractedInterviewFact[]> {
  const apiKey = process.env.GROQ_API_KEY || "";
  const system = `You are a strict interview fact-extraction engine, not a judge.
For each competency, search the interview transcript and extract ONLY direct statements made by the candidate.
- found: true/false — is there a direct statement by the candidate supporting this competency?
- quote: the EXACT candidate utterance verbatim (copy exact words, do NOT paraphrase or summarize).
- timestamp_ref: the timestamp or line number where this quote appears, e.g. "00:12:03" or "turn 14". Empty if not found.

Rules:
- Do NOT infer. If the candidate did not explicitly discuss or demonstrate this, found = false.
- Do NOT judge quality.
- Output ONLY valid JSON, an array: [{ "competency_id": "...", "found": bool, "quote": "...", "timestamp_ref": "..." }]
- No markdown fences, no preamble, no text outside the JSON array.`;

  const user = `COMPETENCIES:
${competencies.map((c) => `- id="${c.id}": ${c.criterion}`).join("\n")}

TRANSCRIPT:
${transcriptText}`;

  const fetchFn = typeof groqFetch === "function" ? groqFetch : fetch;
  const res = await fetchFn("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Groq interview extraction failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json();
  let raw: string = data.choices?.[0]?.message?.content ?? "[]";

  raw = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  raw = raw.replace(/^```(json)?/i, "").replace(/```$/, "").trim();

  let parsed: ExtractedInterviewFact[];
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Interview extraction returned non-JSON output: ${raw.slice(0, 300)}`);
  }
  return parsed;
}

export function buildInterviewDecision(
  candidateId: string,
  competencies: InterviewCompetency[],
  facts: ExtractedInterviewFact[],
  transcriptText: string,
  evidencePool: Evidence[]
): CandidateDecision {
  const criteriaResults: CriterionResult[] = competencies.map((comp) => {
    const fact = facts.find((f) => f.competency_id === comp.id);

    if (!fact) {
      return {
        criterion: comp.criterion,
        verdict: "insufficient_evidence",
        evidence_ids: [],
        reasoning: "No statement regarding this competency was extracted from the interview.",
      };
    }

    const quoteIsReal = fact.found && verifyInterviewQuote(transcriptText, fact.quote);

    if (!quoteIsReal) {
      return {
        criterion: comp.criterion,
        verdict: "not_met",
        evidence_ids: [],
        reasoning: "No verifiable candidate statement was found in the interview transcript.",
      };
    }

    const evidenceId = `ev_${candidateId}_int_${comp.id}`;
    evidencePool.push({
      id: evidenceId,
      source_type: "interview_transcript",
      source_ref: `transcript:${fact.timestamp_ref || "unspecified"}`,
      quote_or_fact: fact.quote,
      extracted_at: new Date().toISOString(),
    });

    return {
      criterion: comp.criterion,
      verdict: "met",
      evidence_ids: [evidenceId],
      reasoning: `Candidate stated: "${fact.quote}" at [${fact.timestamp_ref}].`,
    };
  });

  const mandatoryFailed = competencies
    .filter((c) => c.mandatory)
    .some((c) => criteriaResults.find((r) => r.criterion === c.criterion)?.verdict === "not_met");

  const outcome: CandidateDecision["outcome"] = mandatoryFailed ? "reject" : "advance";

  const failedCriteria = criteriaResults.filter((c) => c.verdict === "not_met");
  const rejectionSummary =
    outcome === "reject"
      ? `Interview did not establish: ${failedCriteria.map((c) => c.criterion).join("; ")}.`
      : undefined;

  const decision: CandidateDecision = {
    candidate_id: candidateId,
    stage: "deep_review",
    outcome,
    criteria_results: criteriaResults,
    overall_confidence: computeConfidence(criteriaResults),
    rejection_summary: rejectionSummary,
    created_at: new Date().toISOString(),
  };

  validateCandidateDecision(decision, evidencePool);
  return decision;
}

export async function runInterviewReview(
  candidateId: string,
  transcriptText: string,
  competencies: InterviewCompetency[]
): Promise<{ decision: CandidateDecision; evidence: Evidence[] }> {
  const facts = await extractInterviewFacts(transcriptText, competencies);
  const evidencePool: Evidence[] = [];
  const decision = buildInterviewDecision(
    candidateId,
    competencies,
    facts,
    transcriptText,
    evidencePool
  );
  return { decision, evidence: evidencePool };
}
