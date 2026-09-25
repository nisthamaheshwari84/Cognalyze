/**
 * JD INTAKE & REQUIREMENT EXTRACTION ENGINE (Phase 2)
 * 
 * Ingests raw job descriptions, extracts discrete requirements with exact
 * verbatim spans verified by deterministic quote verifier, categorizes into
 * core | trainable | evaluated | context, and produces the JD Review Lens.
 */

import { verifyQuoteInSource } from "@/lib/evidence/quote-verifier";
import {
  JdIntakeResult,
  JdRequirement,
  JdReviewFinding,
  JdReviewLensResult,
  RoleRequirementCategory,
} from "./types";

// Technologies that are readily trainable on the job if an engineer has core language fundamentals
const TRAINABLE_TOOL_PATTERNS = [
  /\b(tailwind|bootstrap|sass|less)\b/i,
  /\b(prisma|drizzle|typeorm|hibernate|sequelize|sqlalchemy)\b/i,
  /\b(fastapi|express|flask|gin|fiber|actix)\b/i,
  /\b(jest|vitest|mocha|cypress|playwright)\b/i,
  /\b(github actions|gitlab ci|jenkins|circleci)\b/i,
  /\b(redis|memcached)\b/i,
  /\b(s3|sqs|sns|dynamodb)\b/i,
  /\b(helm|argocd|datadog|prometheus|grafana)\b/i,
];

// Complex architectural and problem solving capabilities best evaluated via demonstration tasks
const EVALUATED_CAPABILITY_PATTERNS = [
  /\b(system design|architecture|distributed systems|scalability|fault tolerance|concurrency)\b/i,
  /\b(code quality|debugging|refactoring|code review|mentorship)\b/i,
  /\b(api design|microservices|performance optimization)\b/i,
];

/**
 * Extracts requirements and spans from raw JD text deterministically.
 */
export function processJdIntake(rawJd: string, fallbackTitle = "Software Engineer"): JdIntakeResult {
  const text = rawJd || "";
  const lines = text.split("\n");

  // 1. Identify Role Title and Seniority
  let roleTitle = fallbackTitle;
  let seniority = "Mid / Experienced";
  let hiresTarget = 1;

  for (const rawLine of lines.slice(0, 15)) {
    const line = rawLine.trim();
    const lower = line.toLowerCase();
    if (lower.startsWith("title:") || lower.startsWith("role:") || lower.startsWith("position:")) {
      roleTitle = line.replace(/^(title|role|position):/i, "").trim() || fallbackTitle;
    } else if (lower.startsWith("hires:") || lower.startsWith("openings:")) {
      const parsed = parseInt(line.replace(/[^0-9]/g, ""), 10);
      if (!isNaN(parsed) && parsed > 0) hiresTarget = parsed;
    } else if (lower.includes("intern") || lower.includes("campus") || lower.includes("junior") || lower.includes("graduate")) {
      seniority = "Early Career / Campus";
    } else if (lower.includes("senior") || lower.includes("lead") || lower.includes("staff") || lower.includes("principal")) {
      seniority = "Senior / Staff";
    }
  }

  // 2. Scan lines and identify requirement sections & items
  const requirements: JdRequirement[] = [];
  let currentCategory: RoleRequirementCategory = "core";
  let reqIndex = 0;

  for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
    const rawLine = lines[lineIdx];
    const line = rawLine.trim();
    if (!line) continue;

    const lower = line.toLowerCase();

    // Section header detection
    const isBullet = /^[-•*]|\d+\./.test(line);
    const isShort = line.length < 60;
    const isHeader = (!isBullet && isShort) || line.endsWith(":");

    if (isHeader) {
      if (
        lower.includes("preferred") ||
        lower.includes("nice to have") ||
        lower.includes("bonus") ||
        lower.includes("good to have") ||
        lower.includes("plus")
      ) {
        currentCategory = "context";
        continue;
      }
      if (
        lower.includes("what you'll learn") ||
        lower.includes("trainable") ||
        lower.includes("nice-to-learn")
      ) {
        currentCategory = "trainable";
        continue;
      }
      if (
        lower.includes("must have") ||
        lower.includes("requirements") ||
        lower.includes("qualifications") ||
        lower.includes("what you need") ||
        lower.includes("what we are looking for")
      ) {
        currentCategory = "core";
        continue;
      }
    }

    // Only process actionable requirement lines (bullets or lines with requirement verbs)
    if (!isBullet && !lower.includes("experience") && !lower.includes("proficien") && !lower.includes("knowledge") && !lower.includes("degree")) {
      continue;
    }

    const cleanSnippet = line.replace(/^[-•*]|\d+\.\s*/, "").trim();
    if (cleanSnippet.length < 5) continue;

    // Verify quote deterministically in source text to capture exact character span
    const verification = verifyQuoteInSource(text, cleanSnippet);
    if (!verification.verified || !verification.sourceOffsets) {
      continue;
    }

    reqIndex++;
    const reqId = `req-${reqIndex}`;

    // Refine category based on observable technical attributes
    let assignedCategory: RoleRequirementCategory = currentCategory;

    if (assignedCategory === "core") {
      if (EVALUATED_CAPABILITY_PATTERNS.some((p) => p.test(cleanSnippet))) {
        assignedCategory = "evaluated";
      } else if (TRAINABLE_TOOL_PATTERNS.some((p) => p.test(cleanSnippet)) && cleanSnippet.length < 60) {
        assignedCategory = "trainable";
      }
    }

    requirements.push({
      id: reqId,
      text: cleanSnippet,
      category: assignedCategory,
      origin: "deterministic",
      jdSpan: {
        startChar: verification.sourceOffsets.startChar,
        endChar: verification.sourceOffsets.endChar,
        rawSnippet: verification.verbatimQuote,
      },
      status: "active",
      version: 1,
    });
  }

  // 3. Generate the JD Review Lens (Over-restrictiveness Analysis)
  const reviewLens = analyzeOverRestrictiveness(requirements);

  return {
    roleTitle,
    seniority,
    hiresTarget,
    requirements,
    reviewLens,
  };
}

/**
 * Analyzes requirements for over-restrictiveness and identifies items
 * better suited for validation rather than automatic resume-filtering elimination.
 */
export function analyzeOverRestrictiveness(requirements: JdRequirement[]): JdReviewLensResult {
  const findings: JdReviewFinding[] = [];

  for (const req of requirements) {
    if (req.category === "core") {
      // Check A: Is it a specific framework or library that is easily trainable?
      const matchesTrainable = TRAINABLE_TOOL_PATTERNS.some((p) => p.test(req.text));
      if (matchesTrainable) {
        findings.push({
          requirementId: req.id,
          requirementText: req.text,
          issue: "on_the_job_trainable",
          currentCategory: "core",
          recommendedCategory: "trainable",
          rationale: `Tooling requirement ("${req.text}") can be learned rapidly on the job if the engineer has core language fundamentals. Auto-eliminating candidates without exact library experience artificially shrinks the talent pool.`,
        });
      }

      // Check B: Is it an architectural or complex capability better evaluated via a work sample?
      const matchesEvaluated = EVALUATED_CAPABILITY_PATTERNS.some((p) => p.test(req.text));
      if (matchesEvaluated) {
        findings.push({
          requirementId: req.id,
          requirementText: req.text,
          issue: "better_suited_for_validation",
          currentCategory: "core",
          recommendedCategory: "evaluated",
          rationale: `Complex capability ("${req.text}") rarely has unambiguous proof on a flat resume. Suggest evaluating via a structured work sample or system design session rather than resume elimination.`,
        });
      }
    }
  }

  const overRestrictiveCount = findings.length;
  let summary = "Role requirement distribution is well-calibrated for screening.";
  if (overRestrictiveCount > 0) {
    summary = `${overRestrictiveCount} requirement${overRestrictiveCount === 1 ? "" : "s"} may be suitable for validation rather than automatic elimination.`;
  }

  return {
    overRestrictiveCount,
    summary,
    findings,
    historicalCaveat: "Review suggestions are observational and recruiter-editable. Edits are recorded immutably.",
  };
}
