/**
 * EVIDENCE-BASED SCORING ENGINE v1.0
 * 
 * Shared scoring pipeline used by both single-candidate analysis and bulk ranking.
 * Replaces the duplicate scoring logic across recruiter-analysis/route.ts,
 * rank-candidates/route.ts, and twoPassRanker.ts.
 * 
 * Architecture:
 *   Stage 1: Evidence Extraction — verbatim quote search per requirement (temp 0.0)
 *   Stage 2: Dimension Scoring — score each JD evaluation_dimension (temp 0.15)
 *   Stage 3: Confidence Computation — pure server-side math from evidence coverage
 *   Stage 4: Post-processing — quote verification, decision derivation, semantic fix
 */

import { groqFetch } from "@/lib/groq";
import type {
  EvaluationDimension,
  AuditedRequirement,
} from "@/lib/intelligence/jd-extractor";
import { extractJdRequirements } from "@/lib/intelligence/jd-extractor";

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface RequirementEvidence {
  requirement: string;
  criticality: "High" | "Medium" | "Low";
  status: "verified_work" | "verified_project" | "coursework" | "listed_only" | "missing";
  assessment: "strong" | "moderate" | "weak" | "missing";
  verbatim_quote: string | null;
  quote_location: string;
  evidence_location: string; // alias for quote_location in the task's expected format
  confidence: "high" | "medium" | "low";
  verification_flag?: string;
  weight_pct?: number; // populated when dimension weights are known
}

export interface VerificationFlag {
  claim: string;
  concern: string;
  suggested_interview_probe: string;
}

export interface DimensionScore {
  dimension: string;
  weight_pct: number;
  score: number;
  evidence_summary: string;
  sub_scores: {
    requirement: string;
    score: number;
    evidence_status: string;
  }[];
}

export interface ConfidenceResult {
  evidence_coverage_pct: number;
  confidence_level: "high" | "medium" | "low";
  confidence_score: number;
  confidence_reasoning: string;
}

export interface EvidenceScorerResult {
  // Core scores
  overall_fit: number;
  decision: "SHORTLIST" | "HOLD" | "REJECT";
  decision_confidence: number;
  confidence: ConfidenceResult;

  // Evidence trail
  requirement_evidence: RequirementEvidence[];
  dimension_scores: DimensionScore[];

  // Verification flags (new — "worth probing in interview")
  verification_flags: VerificationFlag[];

  // Score consistency (new — flags if overall_score contradicts evidence)
  score_consistency_warning?: string;

  // Candidate identity
  candidate_name: string;
  seniority_detected: string;

  // Legacy-compatible fields
  ats_match_score: number;
  technical_score: number;
  project_score: number;
  experience_score: number;
  education_score: number;
  achievement_score: number;

  // Qualitative fields
  strengths: { title: string; evidence: string; impact: string }[];
  concerns: { title: string; evidence: string; severity: string; deal_breaker: boolean }[];
  red_flags: { flag: string; severity: string; evidence: string }[];
  green_flags: { flag: string; strength: string; evidence: string }[];
  missing_skills: string[];
  recruiter_summary: string;
  interview_focus: string[];
  improvement_roadmap: { priority: string; action: string; timeline: string; impact: string }[];

  // Metadata
  scoring_version: string;
}

// ═══════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════

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

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.round(n)));
}

// ═══════════════════════════════════════════════════════════════════
// SENIORITY DETECTION & CALIBRATION
// ═══════════════════════════════════════════════════════════════════

type Seniority = "intern" | "junior" | "mid" | "senior" | "staff";

export function detectSeniority(text: string): Seniority {
  if (/intern|internship|trainee|co.?op|apprentice/i.test(text)) return "intern";
  if (/staff|principal|distinguished|fellow/i.test(text)) return "staff";
  if (/senior|sr\.|lead|architect|director/i.test(text)) return "senior";
  if (/mid.?level|3.?[-–].?6\s*year/i.test(text)) return "mid";
  return "junior";
}

const THRESHOLDS: Record<Seniority, { shortlist: number; hold: number }> = {
  intern: { shortlist: 58, hold: 42 },
  junior: { shortlist: 62, hold: 46 },
  mid:    { shortlist: 65, hold: 50 },
  senior: { shortlist: 68, hold: 54 },
  staff:  { shortlist: 72, hold: 58 },
};

const SALARY_RANGES: Record<Seniority, string> = {
  intern: "INR 20,000–50,000/month (stipend)",
  junior: "INR 4–8 LPA",
  mid:    "INR 12–22 LPA",
  senior: "INR 25–45 LPA",
  staff:  "INR 50–90 LPA",
};

// ═══════════════════════════════════════════════════════════════════
// SEMANTIC KEYWORD MAP (for post-processing false-negative fix)
// ═══════════════════════════════════════════════════════════════════

const SEMANTIC_MAP: Record<string, RegExp[]> = {
  "data structures and algorithms": [/dsa/i, /leetcode/i, /competitive.?programming/i, /solved.{0,10}\d+.{0,10}(problem|question)/i, /codeforces/i, /codechef/i, /hackerrank/i, /striver/i, /neetcode/i, /binary.?search/i, /dynamic.?programming/i],
  "rest apis":     [/rest.?api/i, /restful/i, /api.?integration/i, /axios/i, /fetch.?api/i, /express/i, /fastapi/i, /flask/i, /http.?endpoint/i, /backend.?api/i],
  "databases":     [/mysql/i, /mongodb/i, /postgresql/i, /sqlite/i, /supabase/i, /firebase/i, /redis/i, /nosql/i, /prisma/i, /mongoose/i],
  "cloud":         [/aws/i, /azure/i, /gcp/i, /ec2/i, /s3\b/i, /lambda/i, /vercel/i, /netlify/i, /heroku/i, /docker/i, /kubernetes/i],
  "system design": [/microservice/i, /distributed/i, /load.?balanc/i, /cach/i, /kafka/i, /message.?queue/i, /architect/i],
  "problem solving": [/solved/i, /problems/i, /leetcode/i, /hackathon/i, /debug/i, /optimized/i, /competitive/i],
  "communication": [/collaborated/i, /team/i, /cross.functional/i, /presented/i, /documentation/i, /mentored/i, /led/i],
  "full-stack": [/frontend/i, /backend/i, /full.?stack/i, /react.*node/i, /next.*express/i, /end.to.end/i],
};

function semanticPresent(kw: string, text: string): boolean {
  if (text.toLowerCase().includes(kw.toLowerCase())) return true;
  const patterns = SEMANTIC_MAP[kw.toLowerCase()];
  return patterns ? patterns.some((p) => p.test(text)) : false;
}

// ═══════════════════════════════════════════════════════════════════
// GROQ API HELPER (with retry for rate limits)
// ═══════════════════════════════════════════════════════════════════

const RETRY_DELAYS = [2000, 4000, 8000];

async function callGroq(
  messages: any[],
  opts: { max_tokens: number; temperature: number }
): Promise<string> {
  let lastError: any = null;

  for (let attempt = 0; attempt <= RETRY_DELAYS.length; attempt++) {
    try {
      const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages,
          max_tokens: opts.max_tokens,
          temperature: opts.temperature,
          response_format: { type: "json_object" },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.error?.message || `Groq API ${res.status}`;
        if (
          (res.status === 429 || /rate limit/i.test(errMsg)) &&
          attempt < RETRY_DELAYS.length
        ) {
          console.warn(`[evidence-scorer] Rate limited (attempt ${attempt + 1}), retrying in ${RETRY_DELAYS[attempt]}ms...`);
          await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
          lastError = new Error(errMsg);
          continue;
        }
        throw new Error(errMsg);
      }
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error("Empty Groq response");
      return content;
    } catch (err: any) {
      lastError = err;
      if (
        (/rate limit|429/i.test(err.message || "")) &&
        attempt < RETRY_DELAYS.length
      ) {
        console.warn(`[evidence-scorer] Error with rate limit (attempt ${attempt + 1}), retrying in ${RETRY_DELAYS[attempt]}ms...`);
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
        continue;
      }
      throw err;
    }
  }
  throw lastError || new Error("All retry attempts failed");
}

// ═══════════════════════════════════════════════════════════════════
// STAGE 1: EVIDENCE EXTRACTION
// Temperature 0.0 — pure extraction, zero evaluation
// ═══════════════════════════════════════════════════════════════════

async function extractEvidence(
  resumeText: string,
  requirements: AuditedRequirement[],
  mustHaveSkills: string[],
  goodToHaveSkills: string[],
  jdText: string,
  jobTitle: string
): Promise<RequirementEvidence[]> {
  // Build the requirement list for the prompt
  const reqList = requirements.map((r) => `- "${r.name}" [${r.type}] [Criticality: ${r.criticality}]`).join("\n");

  const allSkills = [...new Set([...mustHaveSkills, ...goodToHaveSkills])];
  const skillsList = allSkills.map((s) => `- "${s}"`).join("\n");

  const raw = await callGroq(
    [
      {
        role: "system",
        content: `You are a strict evidence extractor. Your job is to search a resume for evidence of specific requirements.

RULES — follow these EXACTLY:
1. For each requirement, search the ENTIRE resume for evidence.
2. If you find evidence, provide a VERBATIM QUOTE — copy the exact words from the resume. Do not paraphrase or reconstruct.
3. Classify the evidence:
   - "verified_work": Evidence comes from a work experience / internship / production deployment
   - "verified_project": Evidence comes from a named project with implementation details
   - "coursework": Evidence comes from coursework, certification, or course mention
   - "listed_only": Skill is listed in a Skills section but no project/work uses it
   - "missing": ZERO evidence anywhere in the resume
4. If there is genuinely no evidence, set status to "missing" and verbatim_quote to null. Do NOT fabricate quotes.
5. quote_location must specify WHERE in the resume: "Skills section", "Project: [name]", "Experience: [company]", "Education", "Achievements", etc.
6. verification_flag: If a claim is impressive but unverifiable from the resume alone, add a probe phrased as "Worth probing: [specific question]". Never accusatory.

SEMANTIC MATCHING RULES:
- "solved 300+ DSA problems" or "LeetCode" or "competitive programming" → DSA = verified_project (not just listed)
- MongoDB/MySQL/PostgreSQL/Supabase/Firebase anywhere → databases = present
- Full-stack project with frontend + backend → REST APIs = likely present (verified_project)
- Skills listed in a Skills section = "listed_only" unless a project or experience also uses them

Return ONLY valid JSON. No markdown.`,
      },
      {
        role: "user",
        content: `ROLE: ${jobTitle}

JD REQUIREMENTS TO CHECK:
${reqList}

ADDITIONAL SKILLS TO CHECK:
${skillsList}

RESUME (search this ENTIRE text for evidence):
${resumeText.slice(0, 6000)}

Return ONLY this JSON:
{
  "evidence": [
    {
      "requirement": "exact requirement name from list above",
      "criticality": "High|Medium|Low",
      "status": "verified_work|verified_project|coursework|listed_only|missing",
      "verbatim_quote": "EXACT text copied from resume or null if missing",
      "quote_location": "where in resume: Skills section | Project: X | Experience: Y | Education | Achievements",
      "confidence": "high|medium|low",
      "verification_flag": "Worth probing: specific question — or omit if not needed"
    }
  ]
}`,
      },
    ],
    { max_tokens: 2500, temperature: 0.0 }
  );

  const parsed = extractJSON(raw);
  return Array.isArray(parsed.evidence) ? parsed.evidence : [];
}

// ═══════════════════════════════════════════════════════════════════
// STAGE 2: DIMENSION SCORING
// Temperature 0.15 — score each JD evaluation_dimension from evidence
// ═══════════════════════════════════════════════════════════════════

async function scoreDimensions(
  evidence: RequirementEvidence[],
  dimensions: EvaluationDimension[],
  requirements: AuditedRequirement[],
  resumeText: string,
  jdText: string,
  jobTitle: string,
  seniority: Seniority
): Promise<{
  dimension_scores: DimensionScore[];
  strengths: any[];
  concerns: any[];
  red_flags: any[];
  green_flags: any[];
  recruiter_summary: string;
  interview_focus: string[];
  improvement_roadmap: any[];
}> {
  const dimList = dimensions
    .map((d) => `- "${d.dimension}" (${d.weight_pct}%): ${d.reasoning}`)
    .join("\n");

  const evidenceSummary = evidence
    .map((e) => `- ${e.requirement}: ${e.status}${e.verbatim_quote ? ` — "${e.verbatim_quote}"` : " — no evidence"}`)
    .join("\n");

  const internNote = seniority === "intern"
    ? `\nINTERN RULES: Do NOT penalize for zero work experience. Projects + DSA + learning velocity are the primary signals. A student who built a full-stack AI app = strong intern.`
    : "";

  const raw = await callGroq(
    [
      {
        role: "system",
        content: `You are an evidence-based scoring engine. Score each JD evaluation dimension STRICTLY from the extracted evidence below.

SCORING PHILOSOPHY:
- Every score must reference specific evidence. No score without evidence.
- If evidence is "missing" for a requirement, that dimension score goes DOWN proportionally.
- If evidence is "listed_only" (no project/work proof), score lower than "verified_project" or "verified_work".
- Be granular: 63, 71, 44 — not 60, 60, 60.
- Score each dimension independently. Do not anchor to a pre-decided verdict.
${internNote}

CALIBRATED SCORING:
• 85-100: Evidence shows exceptional depth for this ${seniority} level. Rare.
• 70-84:  Strong evidence. Would advocate in committee.
• 55-69:  Adequate evidence but with gaps worth probing.
• 40-54:  Weak evidence. Key requirements have thin or no proof.
• Below 40: Critical evidence missing for this dimension.

FORBIDDEN WORDS: passionate, driven, dynamic, results-oriented, exceptional, outstanding, motivated, enthusiastic, spearheaded, leveraged, synergized, robust, scalable, seamless, comprehensive, proficient, detail-oriented.

Return ONLY valid JSON. No markdown. No <think> tags.`,
      },
      {
        role: "user",
        content: `ROLE: ${jobTitle} (${seniority.toUpperCase()})

EVALUATION DIMENSIONS (score each one):
${dimList}

EXTRACTED EVIDENCE (score from THIS — do not invent new evidence):
${evidenceSummary}

RESUME (for exact quotes only — search thoroughly):
${resumeText.slice(0, 4000)}

JD (for context):
${jdText.slice(0, 1000)}

Return ONLY this JSON:
{
  "dimension_scores": [
    {
      "dimension": "exact dimension name from list",
      "weight_pct": 30,
      "score": 72,
      "evidence_summary": "1-2 sentences citing specific evidence. Reference verbatim quotes.",
      "sub_scores": [
        { "requirement": "specific requirement", "score": 75, "evidence_status": "verified_project" }
      ]
    }
  ],
  "strengths": [
    { "title": "specific strength", "evidence": "verbatim quote or specific observation", "impact": "High|Medium" }
  ],
  "concerns": [
    { "title": "specific gap", "evidence": "what is missing", "severity": "High|Medium|Low", "deal_breaker": false }
  ],
  "red_flags": [
    { "flag": "specific red flag", "severity": "High|Medium|Low", "evidence": "exact observation" }
  ],
  "green_flags": [
    { "flag": "specific green flag", "strength": "High|Medium", "evidence": "exact observation" }
  ],
  "recruiter_summary": "3 sentences. Specific to THIS person. Evidence-based. Blunt. Written as a senior recruiter's private committee note.",
  "interview_focus": ["specific thing to probe — tied to a claim or gap in THIS resume"],
  "improvement_roadmap": [
    { "priority": "High|Medium|Low", "action": "specific skill or experience to build", "timeline": "X months", "impact": "High|Medium|Low" }
  ]
}`,
      },
    ],
    { max_tokens: 2200, temperature: 0.15 }
  );

  return extractJSON(raw);
}

// ═══════════════════════════════════════════════════════════════════
// STAGE 3: CONFIDENCE COMPUTATION (pure server-side math)
// ═══════════════════════════════════════════════════════════════════

export function computeConfidence(evidence: RequirementEvidence[]): ConfidenceResult {
  const total = evidence.length;
  if (total === 0) {
    return {
      evidence_coverage_pct: 0,
      confidence_level: "low",
      confidence_score: 0,
      confidence_reasoning: "No requirements were evaluated — confidence cannot be determined.",
    };
  }

  const covered = evidence.filter((e) => e.status !== "missing").length;
  const verified = evidence.filter(
    (e) => e.status === "verified_work" || e.status === "verified_project"
  ).length;
  const missing = evidence.filter((e) => e.status === "missing").length;
  const weak = evidence.filter((e) => e.status === "listed_only").length;
  const moderate = evidence.filter((e) => e.status === "coursework").length;

  const coverage = (covered / total) * 100;
  const quality = (verified / total) * 100;

  // Confidence = weighted blend of coverage and evidence quality
  const score = Math.round(coverage * 0.6 + quality * 0.4);

  // Hard rules (task requirement: below 50% coverage cannot be "high")
  let level: "high" | "medium" | "low";
  if (coverage < 50) {
    // Cannot be "high" below 50% coverage regardless of what the LLM returns
    level = coverage < 30 ? "low" : "medium";
  } else if (score >= 70) {
    level = "high";
  } else if (score >= 45) {
    level = "medium";
  } else {
    level = "low";
  }

  // Generate human-readable confidence reasoning
  const coverageRound = Math.round(coverage);
  let reasoning: string;
  if (level === "low") {
    reasoning = `Only ${covered} of ${total} requirements had any resume evidence to evaluate (${coverageRound}% coverage). ${missing} requirements had zero evidence. This score should be treated as provisional pending more information (portfolio, interview, references) for the uncovered requirements.`;
  } else if (level === "medium") {
    const gapItems = missing > 0 ? `${missing} requirement${missing > 1 ? "s" : ""} had no evidence` : "";
    const weakItems = weak > 0 ? `${weak} ${weak > 1 ? "were" : "was"} listed without project proof` : "";
    const parts = [gapItems, weakItems].filter(Boolean).join(" and ");
    reasoning = `${covered} of ${total} requirements had evidence (${coverageRound}% coverage), with ${verified} strongly verified through work or projects. ${parts ? `However, ${parts}, limiting full confidence.` : "Evidence quality is moderate."}`;
  } else {
    reasoning = `${covered} of ${total} requirements had evidence (${coverageRound}% coverage), with ${verified} strongly verified through documented work experience or project implementations. The strength distribution supports high confidence in this assessment.`;
  }

  return {
    evidence_coverage_pct: Math.round(coverage),
    confidence_level: level,
    confidence_score: clamp(score, 0, 100),
    confidence_reasoning: reasoning,
  };
}

// ═══════════════════════════════════════════════════════════════════
// STAGE 4: POST-PROCESSING
// Quote verification + decision derivation + semantic fix
// ═══════════════════════════════════════════════════════════════════

function verifyQuotes(evidence: RequirementEvidence[], resumeText: string): RequirementEvidence[] {
  const resumeLower = resumeText.toLowerCase();

  return evidence.map((e) => {
    if (!e.verbatim_quote) return e;

    // Check if the verbatim quote is actually in the resume
    const quoteLower = e.verbatim_quote.toLowerCase().trim();
    if (quoteLower.length < 4) return e; // trivially short

    // Try exact match first
    if (resumeLower.includes(quoteLower)) return e;

    // Try 3-word n-gram match (handles minor LLM reformatting)
    const words = quoteLower.replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length > 2);
    if (words.length >= 3) {
      for (let i = 0; i <= words.length - 3; i++) {
        const ngram = words.slice(i, i + 3).join(" ");
        if (resumeLower.includes(ngram)) return e; // close enough
      }
    }

    // Quote not verified — downgrade to listed_only and clear the fabricated quote
    console.warn(`[evidence-scorer] Fabricated quote detected and removed: "${e.verbatim_quote.slice(0, 50)}..."`);
    return {
      ...e,
      verbatim_quote: null,
      status: e.status === "missing" ? "missing" : "listed_only" as RequirementEvidence["status"],
      confidence: "low" as const,
    };
  });
}

function applySemanticFix(evidence: RequirementEvidence[], resumeText: string): RequirementEvidence[] {
  return evidence.map((e) => {
    if (e.status !== "missing") return e;

    // Check if the requirement is semantically present
    if (semanticPresent(e.requirement, resumeText)) {
      return {
        ...e,
        status: "listed_only" as RequirementEvidence["status"],
        confidence: "medium" as const,
        verbatim_quote: null,
      };
    }
    return e;
  });
}

function deriveDecision(
  overallFit: number,
  seniority: Seniority
): "SHORTLIST" | "HOLD" | "REJECT" {
  const t = THRESHOLDS[seniority];
  if (overallFit >= t.shortlist) return "SHORTLIST";
  if (overallFit >= t.hold) return "HOLD";
  return "REJECT";
}

// Map dimension scores to legacy category scores for backward compatibility
function deriveLegacyScores(dimensionScores: DimensionScore[]): {
  technical_score: number;
  project_score: number;
  experience_score: number;
  education_score: number;
  achievement_score: number;
} {
  const techScores: number[] = [];
  const projScores: number[] = [];
  const expScores: number[] = [];
  const eduScores: number[] = [];
  const achScores: number[] = [];

  for (const ds of dimensionScores) {
    const dimLower = ds.dimension.toLowerCase();
    if (/technical|skill|language|framework|tool|stack|competenc/i.test(dimLower)) {
      techScores.push(ds.score);
    }
    if (/project|build|implement|deploy|ship/i.test(dimLower)) {
      projScores.push(ds.score);
    }
    if (/experience|production|work|industry|professional/i.test(dimLower)) {
      expScores.push(ds.score);
    }
    if (/education|academic|degree|certif/i.test(dimLower)) {
      eduScores.push(ds.score);
    }
    if (/achievement|impact|leadership|community|contribution|problem.?solv/i.test(dimLower)) {
      achScores.push(ds.score);
    }
  }

  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
  const allScores = dimensionScores.map((d) => d.score);
  const overallAvg = avg(allScores);

  return {
    technical_score: techScores.length ? avg(techScores) : overallAvg,
    project_score: projScores.length ? avg(projScores) : overallAvg,
    experience_score: expScores.length ? avg(expScores) : overallAvg,
    education_score: eduScores.length ? avg(eduScores) : overallAvg,
    achievement_score: achScores.length ? avg(achScores) : overallAvg,
  };
}

// ═══════════════════════════════════════════════════════════════════
// MAIN SCORING PIPELINE
// ═══════════════════════════════════════════════════════════════════

export interface ScoringInput {
  resumeText: string;
  jdText: string;
  jobTitle: string;
  candidateName?: string;
  // Pre-analyzed JD Intelligence (optional — if not provided, we extract on-the-fly)
  evaluationDimensions?: EvaluationDimension[];
  auditedRequirements?: AuditedRequirement[];
  mustHaveSkills?: string[];
  goodToHaveSkills?: string[];
}

export async function scoreCandidate(input: ScoringInput): Promise<EvidenceScorerResult> {
  const {
    resumeText,
    jdText,
    jobTitle,
    candidateName = "Unknown Candidate",
  } = input;

  // ── Step 0: Get JD Intelligence (use provided or extract on-the-fly) ──
  let dimensions = input.evaluationDimensions;
  let requirements = input.auditedRequirements;
  let mustHave = input.mustHaveSkills;
  let goodToHave = input.goodToHaveSkills;

  if (!dimensions || dimensions.length === 0 || !requirements || requirements.length === 0) {
    console.log("[evidence-scorer] No pre-analyzed JD Intelligence provided, extracting on-the-fly...");
    const jdIntel = await extractJdRequirements(jdText);
    dimensions = jdIntel.evaluation_dimensions;
    requirements = jdIntel.audited_requirements;
    mustHave = jdIntel.must_have_skills;
    goodToHave = jdIntel.good_to_have_skills;
  }

  mustHave = mustHave || [];
  goodToHave = goodToHave || [];

  const seniority = detectSeniority(jdText + " " + jobTitle);

  // ── Stage 1: Evidence Extraction ──
  let evidence: RequirementEvidence[];
  try {
    evidence = await extractEvidence(resumeText, requirements, mustHave, goodToHave, jdText, jobTitle);
  } catch (err: any) {
    console.error("[evidence-scorer] Stage 1 (evidence extraction) failed:", err.message);
    evidence = requirements.map((r) => ({
      requirement: r.name,
      criticality: r.criticality,
      status: "missing" as const,
      assessment: "missing" as const,
      verbatim_quote: null,
      quote_location: "N/A",
      evidence_location: "N/A",
      confidence: "low" as const,
    }));
  }

  // ── Stage 4a: Post-process evidence (quote verification + semantic fix) ──
  evidence = verifyQuotes(evidence, resumeText);
  evidence = applySemanticFix(evidence, resumeText);

  // ── Enrich evidence with assessment + evidence_location + weight_pct ──
  const statusToAssessment: Record<RequirementEvidence["status"], RequirementEvidence["assessment"]> = {
    verified_work: "strong",
    verified_project: "strong",
    coursework: "moderate",
    listed_only: "weak",
    missing: "missing",
  };

  evidence = evidence.map((e) => ({
    ...e,
    assessment: statusToAssessment[e.status] || "missing",
    evidence_location: e.evidence_location || e.quote_location || "N/A",
    weight_pct: e.weight_pct || dimensions.find(
      (d) => d.dimension.toLowerCase().includes(e.requirement.toLowerCase().slice(0, 15)) ||
             e.requirement.toLowerCase().includes(d.dimension.toLowerCase().slice(0, 15))
    )?.weight_pct,
  }));

  // ── Stage 2: Dimension Scoring ──
  let scoringResult: Awaited<ReturnType<typeof scoreDimensions>>;
  try {
    scoringResult = await scoreDimensions(
      evidence,
      dimensions,
      requirements,
      resumeText,
      jdText,
      jobTitle,
      seniority
    );
  } catch (err: any) {
    console.error("[evidence-scorer] Stage 2 (dimension scoring) failed:", err.message);
    scoringResult = {
      dimension_scores: dimensions.map((d) => ({
        dimension: d.dimension,
        weight_pct: d.weight_pct,
        score: 0,
        evidence_summary: "Scoring failed — retry.",
        sub_scores: [],
      })),
      strengths: [],
      concerns: [],
      red_flags: [],
      green_flags: [],
      recruiter_summary: "Analysis failed — retry.",
      interview_focus: [],
      improvement_roadmap: [],
    };
  }

  const { dimension_scores } = scoringResult;

  // ── Stage 3: Server-side math ──
  // Compute overall_fit as weighted average of dimension scores
  const weightSum = dimension_scores.reduce((sum, d) => sum + d.weight_pct, 0);
  const overallFit = weightSum > 0
    ? clamp(
        dimension_scores.reduce((sum, d) => sum + d.score * d.weight_pct, 0) / weightSum,
        5,
        97
      )
    : 0;

  // Confidence from evidence coverage
  const confidence = computeConfidence(evidence);

  // Decision from score (server-side, not LLM)
  const decision = deriveDecision(overallFit, seniority);

  // ── Build verification_flags ──
  const verificationFlags: VerificationFlag[] = [];

  // 1. From explicit verification_flag fields on evidence
  for (const e of evidence) {
    if (e.verification_flag && e.verification_flag.trim()) {
      verificationFlags.push({
        claim: e.requirement,
        concern: e.verification_flag.replace(/^Worth probing:\s*/i, ""),
        suggested_interview_probe: e.verification_flag.replace(/^Worth probing:\s*/i, ""),
      });
    }
  }

  // 2. Auto-generate for "listed_only" items with high criticality (impressive claims without proof)
  for (const e of evidence) {
    if (e.status === "listed_only" && e.criticality === "High") {
      verificationFlags.push({
        claim: e.requirement,
        concern: `Resume lists "${e.requirement}" in skills but provides no project, work experience, or concrete evidence to support this claim`,
        suggested_interview_probe: `Walk me through a specific project or work experience where you applied ${e.requirement}. What was the problem, your approach, and the measurable outcome?`,
      });
    }
  }

  // 3. Never phrase as accusatory — always "worth probing" framing
  // (The prompt already enforces this; this is the safety net)

  // ── Score consistency validation ──
  let scoreConsistencyWarning: string | undefined;
  const highWeightDims = dimension_scores.filter((d) => d.weight_pct >= 20);
  const highWeightMissing = highWeightDims.filter((d) => d.score < 30);
  if (overallFit > 80 && highWeightMissing.length > 0) {
    scoreConsistencyWarning = `Overall score (${overallFit}) may be inconsistent: ${highWeightMissing.map(
      (d) => `"${d.dimension}" (weight ${d.weight_pct}%) scored only ${d.score}`
    ).join("; ")}. Consider re-evaluating.`;
    console.warn("[evidence-scorer] Score consistency warning:", scoreConsistencyWarning);
  }
  // Also check if most evidence is "missing" but score is high
  const missingCount = evidence.filter((e) => e.status === "missing").length;
  if (overallFit > 75 && missingCount > evidence.length * 0.6) {
    scoreConsistencyWarning = `Overall score (${overallFit}) is high but ${missingCount} of ${evidence.length} requirements have no evidence. Score may be inflated.`;
    console.warn("[evidence-scorer] Score consistency warning:", scoreConsistencyWarning);
  }

  // ATS match score: percentage of must-have skills that have any evidence
  const mustHaveEvidence = evidence.filter(
    (e) => mustHave!.some((mh) => e.requirement.toLowerCase().includes(mh.toLowerCase())) && e.status !== "missing"
  );
  const atsMatchScore = mustHave!.length > 0
    ? clamp(Math.round((mustHaveEvidence.length / mustHave!.length) * 100), 0, 100)
    : overallFit;

  // Legacy scores
  const legacyScores = deriveLegacyScores(dimension_scores);

  // Missing skills list
  const missingSkills = evidence
    .filter((e) => e.status === "missing" && e.criticality !== "Low")
    .map((e) => e.requirement);

  return {
    overall_fit: overallFit,
    decision,
    decision_confidence: confidence.confidence_score,
    confidence,

    requirement_evidence: evidence,
    dimension_scores,

    verification_flags: verificationFlags,
    score_consistency_warning: scoreConsistencyWarning,

    candidate_name: candidateName,
    seniority_detected: seniority,

    ats_match_score: atsMatchScore,
    ...legacyScores,

    strengths: scoringResult.strengths || [],
    concerns: scoringResult.concerns || [],
    red_flags: scoringResult.red_flags || [],
    green_flags: scoringResult.green_flags || [],
    missing_skills: missingSkills,
    recruiter_summary: scoringResult.recruiter_summary || "",
    interview_focus: scoringResult.interview_focus || [],
    improvement_roadmap: scoringResult.improvement_roadmap || [],

    scoring_version: "evidence-v2.0",
  };
}

// ═══════════════════════════════════════════════════════════════════
// LIGHTWEIGHT EXTRACTION (for bulk ranking — evidence only, no scoring)
// ═══════════════════════════════════════════════════════════════════

export async function extractEvidenceForCandidate(
  resumeText: string,
  requirements: AuditedRequirement[],
  mustHaveSkills: string[],
  goodToHaveSkills: string[],
  jdText: string,
  jobTitle: string
): Promise<RequirementEvidence[]> {
  let evidence = await extractEvidence(resumeText, requirements, mustHaveSkills, goodToHaveSkills, jdText, jobTitle);
  evidence = verifyQuotes(evidence, resumeText);
  evidence = applySemanticFix(evidence, resumeText);
  return evidence;
}
