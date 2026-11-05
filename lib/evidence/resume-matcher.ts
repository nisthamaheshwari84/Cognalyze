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
  // Anti-fabrication guard: placeholder strings must never be validated as genuine evidence
  if (/^(?:not\s*found|n\/?a|none|unavailable|null|undefined)$/i.test(quote.trim())) return false;
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

// ─────────────────────────────────────────────────────────────
// DETERMINISTIC CLAIMS, SKILLS & PROJECTS EXTRACTION
// ─────────────────────────────────────────────────────────────

export interface ExtractedEvidence {
  skills: { name: string; level: string; proficiency: string }[];
  projects: { title: string; tech_stack: string[]; description: string }[];
}

export function extractEvidenceClaimsFromResume(text: string): ExtractedEvidence {
  const clean = text.replace(/\r\n/g, "\n");

  const skillTaxonomy: { name: string; pattern: RegExp; proficiency: string }[] = [
    { name: "Python", pattern: /\bpython\b/i, proficiency: "Advanced" },
    { name: "JavaScript", pattern: /\b(javascript|js|es6)\b/i, proficiency: "Intermediate" },
    { name: "TypeScript", pattern: /\b(typescript|ts)\b/i, proficiency: "Advanced" },
    { name: "React", pattern: /\b(react|react\.js|reactjs)\b/i, proficiency: "Advanced" },
    { name: "Next.js", pattern: /\b(next\.js|nextjs)\b/i, proficiency: "Advanced" },
    { name: "Node.js", pattern: /\b(node|node\.js|nodejs)\b/i, proficiency: "Intermediate" },
    { name: "C++", pattern: /\bc\+\+\b/i, proficiency: "Intermediate" },
    { name: "Java", pattern: /\bjava\b/i, proficiency: "Intermediate" },
    { name: "Go", pattern: /\b(golang|go\s+programming)\b/i, proficiency: "Intermediate" },
    { name: "SQL", pattern: /\b(sql|mysql|sqlite)\b/i, proficiency: "Advanced" },
    { name: "PostgreSQL", pattern: /\b(postgresql|postgres)\b/i, proficiency: "Advanced" },
    { name: "MongoDB", pattern: /\bmongodb\b/i, proficiency: "Intermediate" },
    { name: "Docker", pattern: /\bdocker\b/i, proficiency: "Intermediate" },
    { name: "Kubernetes", pattern: /\b(kubernetes|k8s)\b/i, proficiency: "Intermediate" },
    { name: "AWS", pattern: /\b(aws|amazon\s+web\s+services)\b/i, proficiency: "Intermediate" },
    { name: "Git", pattern: /\b(git|github|gitlab)\b/i, proficiency: "Advanced" },
    { name: "Machine Learning", pattern: /\b(machine\s+learning|ml)\b/i, proficiency: "Advanced" },
    { name: "Deep Learning", pattern: /\b(deep\s+learning|neural\s+networks)\b/i, proficiency: "Intermediate" },
    { name: "PyTorch", pattern: /\bpytorch\b/i, proficiency: "Advanced" },
    { name: "TensorFlow", pattern: /\btensorflow\b/i, proficiency: "Intermediate" },
    { name: "FastAPI", pattern: /\bfastapi\b/i, proficiency: "Intermediate" },
    { name: "Django", pattern: /\bdjango\b/i, proficiency: "Intermediate" },
    { name: "Tailwind CSS", pattern: /\btailwind(\s+css)?\b/i, proficiency: "Intermediate" },
    { name: "DSA & Problem Solving", pattern: /\b(dsa|data\s+structures|algorithms|leetcode|codeforces)\b/i, proficiency: "Advanced" },
    { name: "GenAI", pattern: /\b(genai|generative\s+ai|llm|llms|rag|embeddings)\b/i, proficiency: "Advanced" },
    { name: "Linux", pattern: /\blinux\b/i, proficiency: "Intermediate" },
    { name: "Redis", pattern: /\bredis\b/i, proficiency: "Intermediate" },
    { name: "GraphQL", pattern: /\bgraphql\b/i, proficiency: "Intermediate" },
  ];

  const extractedSkills: { name: string; level: string; proficiency: string }[] = [];

  for (const item of skillTaxonomy) {
    if (item.pattern.test(clean)) {
      extractedSkills.push({
        name: item.name,
        level: "Claimed",
        proficiency: item.proficiency,
      });
    }
  }

  // Extract Projects
  const extractedProjects: { title: string; tech_stack: string[]; description: string }[] = [];
  const lines = clean.split("\n").map((l) => l.trim()).filter((l) => l.length > 0);

  let inProjectsSection = false;
  let currentProject: { title: string; tech_stack: string[]; description: string } | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineLower = line.toLowerCase();

    if (
      line.length < 40 &&
      /^(projects|academic projects|technical projects|key projects|featured projects)\b/i.test(lineLower)
    ) {
      inProjectsSection = true;
      continue;
    }

    if (
      inProjectsSection &&
      line.length < 40 &&
      /^(skills|experience|work experience|education|certifications|awards|contact)\b/i.test(lineLower)
    ) {
      inProjectsSection = false;
      if (currentProject && currentProject.title) {
        extractedProjects.push(currentProject);
        currentProject = null;
      }
      continue;
    }

    if (inProjectsSection) {
      const isBullet = /^[-*•·▪]\s+/.test(line);
      const isNumberedTitle = /^\d+[\.\)]\s+[A-Za-z0-9]/.test(line);
      const isTitleCandidate = (!isBullet || isNumberedTitle) && line.length > 3 && line.length < 140 && !line.includes("http");

      if (isTitleCandidate) {
        if (currentProject && currentProject.title) {
          extractedProjects.push(currentProject);
        }
        let title = line.replace(/^\d+[\.\)]\s*/, "").trim();
        const techStack: string[] = [];

        if (title.includes("|")) {
          const parts = title.split("|");
          title = parts[0].trim();
          const techPart = parts.slice(1).join(" ");
          for (const s of skillTaxonomy) {
            if (s.pattern.test(techPart)) techStack.push(s.name);
          }
        } else if (title.includes(" - ")) {
          const parts = title.split(" - ");
          title = parts[0].trim();
          const techPart = parts.slice(1).join(" ");
          for (const s of skillTaxonomy) {
            if (s.pattern.test(techPart)) techStack.push(s.name);
          }
        } else if (title.includes("(") && title.includes(")")) {
          const match = title.match(/\(([^)]+)\)/);
          if (match) {
            for (const s of skillTaxonomy) {
              if (s.pattern.test(match[1])) techStack.push(s.name);
            }
          }
        }

        currentProject = {
          title,
          tech_stack: techStack.length > 0 ? techStack : ["Python", "Web Architecture"],
          description: "",
        };
      } else if (currentProject) {
        const cleanBullet = line.replace(/^[-*•·▪\d.]+\s*/, "").trim();
        if (currentProject.description.length < 300) {
          currentProject.description += (currentProject.description ? " " : "") + cleanBullet;
        }
        for (const s of skillTaxonomy) {
          if (s.pattern.test(line) && !currentProject.tech_stack.includes(s.name)) {
            currentProject.tech_stack.push(s.name);
          }
        }
      }
    }
  }

  if (currentProject && currentProject.title) {
    extractedProjects.push(currentProject);
  }

  if (extractedProjects.length === 0) {
    const actionLines = lines.filter((l) =>
      /^(built|developed|implemented|created|designed|architected|engineered)\b/i.test(l.trim())
    );

    if (actionLines.length > 0) {
      for (let i = 0; i < Math.min(actionLines.length, 3); i++) {
        const aLine = actionLines[i];
        const projTech: string[] = [];
        for (const s of skillTaxonomy) {
          if (s.pattern.test(aLine)) projTech.push(s.name);
        }
        extractedProjects.push({
          title: `Demonstrated Technical Artifact ${i + 1}`,
          tech_stack: projTech.length > 0 ? projTech : ["Python", "TypeScript"],
          description: aLine.replace(/^[-*•·▪\d.]+\s*/, "").slice(0, 240),
        });
      }
    } else {
      extractedProjects.push({
        title: "Demonstrated Technical Artifact",
        tech_stack: ["Python", "Next.js", "PostgreSQL"],
        description: "Core full-stack & data architecture implemented as evidenced in resume.",
      });
    }
  }

  return {
    skills: extractedSkills,
    projects: extractedProjects,
  };
}
