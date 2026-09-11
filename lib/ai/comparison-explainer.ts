/**
 * COMPARISON EXPLAINER v1.0
 * 
 * Generates a specific, evidence-referencing comparison explanation between
 * 2-3 candidates. The explanation MUST cite each candidate's actual
 * requirement_evidence data — not generic LLM comparison text.
 * 
 * The output must be specific enough that it wouldn't make sense if the 
 * two candidates were swapped for two different ones.
 */

import { groqFetch } from "@/lib/groq";
import type { EvidenceScorerResult, RequirementEvidence } from "./evidence-scorer";

export interface ComparisonExplanation {
  explanation: string;
  key_differentiators: {
    dimension: string;
    candidate_a: string;
    candidate_b: string;
    advantage: "A" | "B" | "tied";
  }[];
}

function stripThink(raw: string): string {
  return raw
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<thinking>[\s\S]*?<\/thinking>/gi, "")
    .replace(/<think>[\s\S]*$/gi, "")
    .replace(/<thinking>[\s\S]*$/gi, "")
    .replace(/<\/?think(?:ing)?>/gi, "")
    .trim();
}

function extractJSON(raw: string): any {
  const clean = stripThink(raw)
    .replace(/```json\s*/gi, "")
    .replace(/```\s*/g, "")
    .trim();
  const s = clean.indexOf("{");
  const e = clean.lastIndexOf("}");
  if (s === -1 || e === -1) throw new Error("No JSON object found in response");
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

/**
 * Build a concise per-candidate evidence summary for the comparison prompt.
 * Includes only the most informative fields to keep prompt size manageable.
 */
function buildCandidateSummary(
  name: string,
  result: EvidenceScorerResult
): string {
  const evidenceLines = result.requirement_evidence
    .filter((e) => e.criticality === "High" || e.criticality === "Medium")
    .map((e) => {
      const quote = e.verbatim_quote
        ? ` — "${e.verbatim_quote.slice(0, 120)}"`
        : "";
      return `  - ${e.requirement} [${e.criticality}]: ${e.assessment}${quote} (${e.evidence_location})`;
    })
    .join("\n");

  const dimLines = result.dimension_scores
    .map((d) => `  - ${d.dimension} (${d.weight_pct}%): ${d.score}/100 — ${d.evidence_summary.slice(0, 100)}`)
    .join("\n");

  return `CANDIDATE: ${name}
Score: ${result.overall_fit}/100 | Confidence: ${result.confidence.confidence_level} (${result.confidence.evidence_coverage_pct}% coverage)
Decision: ${result.decision}

Requirement Evidence:
${evidenceLines}

Dimension Scores:
${dimLines}

Verification Flags: ${result.verification_flags.length > 0 ? result.verification_flags.map((f) => f.claim).join(", ") : "None"}
Missing Skills: ${result.missing_skills.join(", ") || "None"}`;
}

/**
 * Generate a specific comparison explanation between two candidates.
 * 
 * The explanation MUST:
 * 1. Reference BOTH candidates' actual requirement_breakdown data
 * 2. Cite specific evidence quotes or evidence gaps
 * 3. Be specific enough that it wouldn't make sense if candidates were swapped
 * 4. Never be generic ("Candidate A is stronger overall")
 */
export async function generateComparisonExplanation(
  candidateA: { name: string; result: EvidenceScorerResult },
  candidateB: { name: string; result: EvidenceScorerResult },
  jobTitle: string
): Promise<ComparisonExplanation> {
  const summaryA = buildCandidateSummary(candidateA.name, candidateA.result);
  const summaryB = buildCandidateSummary(candidateB.name, candidateB.result);

  try {
    const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: `You are a senior technical recruiter comparing two candidates for the same role. You have each candidate's scored requirement breakdown with verbatim evidence quotes.

RULES:
1. Your comparison MUST reference BOTH candidates' actual evidence data below.
2. Cite specific evidence quotes, scores, or evidence gaps for EACH comparison point.
3. Your explanation must be specific enough that it ONLY makes sense for these two candidates — it should NOT work if the candidates were swapped for two different people.
4. Never use generic phrases like "Candidate A is stronger overall" without citing specific evidence.
5. Frame the comparison as strengths trade-offs, not as one being "better" — recruiters need to know WHERE each candidate excels.
6. Keep the explanation to 3-5 sentences.
7. Return ONLY valid JSON.`,
          },
          {
            role: "user",
            content: `ROLE: ${jobTitle}

${summaryA}

---

${summaryB}

---

Compare these two candidates and return ONLY this JSON:
{
  "explanation": "3-5 sentence comparison that cites both candidates' specific evidence. Example: '${candidateA.name} ranks above ${candidateB.name} specifically because A has strong, quoted evidence of [requirement] (a documented [specific project/experience]), while B only lists [skill] with no project reference. However, B has stronger [other requirement] evidence ([specific detail]) than A ([A's gap]).'",
  "key_differentiators": [
    {
      "dimension": "requirement or dimension name",
      "candidate_a": "A's specific evidence or gap for this dimension",
      "candidate_b": "B's specific evidence or gap for this dimension",
      "advantage": "A or B or tied"
    }
  ]
}`,
          },
        ],
        max_tokens: 1200,
        temperature: 0.15,
        response_format: { type: "json_object" },
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || `Groq API ${res.status}`);
    const raw = data.choices?.[0]?.message?.content;
    if (!raw) throw new Error("Empty response");

    const parsed = extractJSON(raw);
    return {
      explanation: stripThink(parsed.explanation || ""),
      key_differentiators: Array.isArray(parsed.key_differentiators) ? parsed.key_differentiators : [],
    };
  } catch (err: any) {
    console.error("[comparison-explainer] Failed:", err.message);
    // Fallback: generate a deterministic comparison from the data
    return generateFallbackComparison(candidateA, candidateB);
  }
}

/**
 * Deterministic fallback comparison when LLM fails.
 * Uses the actual evidence data to build a comparison.
 */
function generateFallbackComparison(
  candidateA: { name: string; result: EvidenceScorerResult },
  candidateB: { name: string; result: EvidenceScorerResult }
): ComparisonExplanation {
  const a = candidateA.result;
  const b = candidateB.result;

  // Find where A is stronger and where B is stronger
  const aAdvantages: string[] = [];
  const bAdvantages: string[] = [];
  const differentiators: ComparisonExplanation["key_differentiators"] = [];

  for (const dimA of a.dimension_scores) {
    const dimB = b.dimension_scores.find((d) => d.dimension === dimA.dimension);
    if (!dimB) continue;

    const diff = dimA.score - dimB.score;
    if (Math.abs(diff) >= 10) {
      const advantage = diff > 0 ? "A" : "B";
      differentiators.push({
        dimension: dimA.dimension,
        candidate_a: `${dimA.score}/100 — ${dimA.evidence_summary.slice(0, 80)}`,
        candidate_b: `${dimB.score}/100 — ${dimB.evidence_summary.slice(0, 80)}`,
        advantage: advantage as "A" | "B",
      });

      if (advantage === "A") {
        aAdvantages.push(`${dimA.dimension} (${dimA.score} vs ${dimB.score})`);
      } else {
        bAdvantages.push(`${dimA.dimension} (${dimB.score} vs ${dimA.score})`);
      }
    } else {
      differentiators.push({
        dimension: dimA.dimension,
        candidate_a: `${dimA.score}/100`,
        candidate_b: `${dimB.score}/100`,
        advantage: "tied",
      });
    }
  }

  const explanation = [
    `${candidateA.name} (${a.overall_fit}/100, ${a.confidence.confidence_level} confidence) vs ${candidateB.name} (${b.overall_fit}/100, ${b.confidence.confidence_level} confidence).`,
    aAdvantages.length > 0
      ? `${candidateA.name} leads in ${aAdvantages.join(", ")}.`
      : "",
    bAdvantages.length > 0
      ? `${candidateB.name} leads in ${bAdvantages.join(", ")}.`
      : "",
    a.missing_skills.length > 0 || b.missing_skills.length > 0
      ? `Key gaps: ${candidateA.name} missing ${a.missing_skills.slice(0, 2).join(", ") || "none"}, ${candidateB.name} missing ${b.missing_skills.slice(0, 2).join(", ") || "none"}.`
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return { explanation, key_differentiators: differentiators };
}
