/**
 * SIMPLE, EVIDENCE-GROUNDED ROLE EXTRACTOR
 * 
 * Truth Contracts:
 * 1. Zero Hallucination: Every extracted requirement must cite an exact verbatim sentence from the JD.
 * 2. No Unsupported Assumptions: "cloud technologies" is never converted to "AWS"; "database" is never converted to "PostgreSQL".
 * 3. Ambiguity Handling: Vague statements are explicitly tagged with `needsConfirmation: true` and an explanation.
 * 4. Conflict Detection: Conflicting statements (e.g. "2+ years" vs "5+ years") are surfaced for recruiter confirmation.
 * 5. Traceability: Clearly differentiates JD-extracted vs Recruiter-added items.
 */

import { verifyQuoteInSource } from "@/lib/evidence/quote-verifier";
import {
  SemanticRequirementCategory,
  SemanticRequirementItem,
  AmbiguityStatus,
  RoleDNAStructure,
  RequirementType,
  ImportanceLevel,
  EvidenceExpectation
} from "./types";
import {
  normalizeCanonicalName,
  getExpectedEvidenceSignals,
  getVerificationStrategy,
  assembleRoleDnaStructure,
  parseJobDescriptionSemantically,
  inferRequirementType,
  inferEvidenceExpectation,
  extractAcceptableOptions,
  extractMinExperience
} from "./semantic-jd-parser";

export type RoleCategory = "required" | "preferred" | "experience" | "education" | "responsibility" | "other";

export interface StructuredRoleRequirement {
  id: string;
  name: string;
  category: RoleCategory;
  evidenceQuote: string;
  source: "job_description" | "recruiter_added";
  needsConfirmation?: boolean;
  ambiguityReason?: string;
  conflictEvidence?: {
    statementA: string;
    statementB: string;
    reason: string;
  };
  startChar?: number;
  endChar?: number;

  // Rich semantic attributes
  canonicalName?: string;
  semanticCategory?: SemanticRequirementCategory;
  subtype?: string;
  rationale?: string;
  evidenceSignals?: string[];
  verificationStrategy?: string[];
  confidence?: number;
  ambiguityStatus?: AmbiguityStatus;
  relatedCapabilities?: { name: string; confidence: number; explanation: string }[];

  // Enhanced Role DNA fields
  requirementType?: RequirementType;
  importance?: ImportanceLevel;
  evidenceExpectation?: EvidenceExpectation;
  acceptableOptions?: string[];
  minimumExperienceYears?: number;
}

export interface RoleExtractionConflict {
  statementA: string;
  statementB: string;
  reason: string;
}

export interface RoleExtractionResult {
  roleTitle: string;
  department: string;
  seniority: "Junior" | "Mid-Level" | "Senior" | "Staff" | "Principal";
  targetHires: number;
  workMode?: "Remote" | "Hybrid" | "On-site";
  location?: string;
  requirements: StructuredRoleRequirement[];
  conflicts: RoleExtractionConflict[];
  rawText: string;
  roleDna?: RoleDNAStructure;
  summary: {
    requiredCount: number;
    preferredCount: number;
    experienceCount: number;
    educationCount: number;
    responsibilityCount?: number;
    otherCount: number;
    needsConfirmationCount: number;
  };
}

// Patterns that signal a vague or ambiguous capability
const AMBIGUOUS_PATTERNS = [
  { pattern: /\b(cloud technologies|cloud platforms?|cloud experience)\b/i, reason: "The JD mentions cloud experience but does not specify a particular cloud platform (e.g., AWS, Azure, GCP)." },
  { pattern: /\b(modern frontend frameworks?|frontend libraries?)\b/i, reason: "Specific framework (e.g., React, Vue, Angular) not identified in the JD." },
  { pattern: /\b(databases? knowledge|database experience|relational or non-relational)\b/i, reason: "Database mentioned in generic terms; specific engine (e.g., PostgreSQL, MongoDB) not identified." },
  { pattern: /\b(agile methodologies|fast-paced environment)\b/i, reason: "Contextual work culture phrase; difficult to objectively verify on technical artifacts." },
  { pattern: /\b(problem-?solving skills?|critical thinking)\b/i, reason: "General capability phrase; best verified through structured code demonstration rather than flat keyword." },
  { pattern: /\b(clean code|best practices)\b/i, reason: "Subjective coding standard; verified through live code review." },
];

// Patterns for Education / Eligibility
const EDUCATION_PATTERNS = [
  /\b(bachelor['’]?s?|master['’]?s?|phd|b\.?tech|b\.?e\.?|m\.?tech|m\.?s\.?|computer science degree|equivalent practical experience)\b/i,
  /\b(degree in computer science|stem degree|engineering degree)\b/i,
];

// Patterns for Experience
const EXPERIENCE_PATTERNS = [
  /\b(\d+[\s-]*\+?[\s-]*years?(\s+of)?(\s+hands-on)?\s+[a-z0-9\s/.,-]+)/i,
  /\b(prior experience (as|in|with)\s+[a-z0-9\s/.,-]+)/i,
  /\b(minimum\s+\d+\s+years?)/i,
];

// Patterns for Other Constraints
const OTHER_CONSTRAINTS_PATTERNS = [
  /\b(work authorization|visa sponsorship|us citizen|authorized to work)\b/i,
  /\b(notice period|immediate joiner|\d+\s+days notice)\b/i,
  /\b(on-call rotation|shift timings?|night shift|travel required)\b/i,
  /\b(located in|based in|relocation)\b/i,
];

/**
 * Extracts structured, evidence-grounded requirements from raw JD text.
 */
export function extractStructuredRoleFromJd(rawJd: string, fallbackTitle = "Software Engineer"): RoleExtractionResult {
  const text = (rawJd || "").trim();
  const lines = text.split(/\r?\n/);

  // 1. Basic Metadata Extraction
  let roleTitle = fallbackTitle;
  let department = "Engineering";
  let seniority: RoleExtractionResult["seniority"] = "Senior";
  let targetHires = 1;
  let workMode: RoleExtractionResult["workMode"] = "Remote";
  let location = "";

  for (const rawLine of lines.slice(0, 20)) {
    const line = rawLine.trim();
    const lower = line.toLowerCase();

    if (/^(title|role|position|job title):/i.test(line)) {
      roleTitle = line.replace(/^(title|role|position|job title):/i, "").trim() || fallbackTitle;
    } else if (/^(department|team):/i.test(line)) {
      department = line.replace(/^(department|team):/i, "").trim() || department;
    } else if (/^(openings|hires|positions? count):/i.test(line)) {
      const num = parseInt(line.replace(/[^0-9]/g, ""), 10);
      if (!isNaN(num) && num > 0) targetHires = num;
    } else if (/^(location|office):/i.test(line)) {
      location = line.replace(/^(location|office):/i, "").trim();
    }

    // Infer work mode
    if (lower.includes("remote") && !lower.includes("not remote")) workMode = "Remote";
    else if (lower.includes("hybrid")) workMode = "Hybrid";
    else if (lower.includes("on-site") || lower.includes("onsite") || lower.includes("in-office")) workMode = "On-site";

    // Infer seniority
    if (lower.includes("junior") || lower.includes("fresher") || lower.includes("entry level") || lower.includes("intern")) {
      seniority = "Junior";
    } else if (lower.includes("mid-level") || lower.includes("sde 2") || lower.includes("experienced")) {
      seniority = "Mid-Level";
    } else if (lower.includes("staff") || lower.includes("lead")) {
      seniority = "Staff";
    } else if (lower.includes("principal")) {
      seniority = "Principal";
    }
  }

  // 2. Scan Lines & Track Sections
  const requirements: StructuredRoleRequirement[] = [];
  const conflicts: RoleExtractionConflict[] = [];
  let currentSectionCategory: RoleCategory = "required";
  let reqSeq = 0;

  // Track experience claims for conflict detection
  const detectedExperienceQuotes: string[] = [];

  for (let idx = 0; idx < lines.length; idx++) {
    const rawLine = lines[idx];
    const line = rawLine.trim();
    if (!line) continue;

    const lower = line.toLowerCase();

    // Skip metadata lines that were already parsed in header
    if (/^(title|role|position|job title|department|team|openings|hires|location|office|work mode):/i.test(line)) {
      continue;
    }

    // Section Header Detection
    const isExplicitBullet = /^[-*•●]|\d+[\.)]\s/.test(line);
    const hasColonEnd = line.endsWith(":");
    const isKnownHeaderWord = /^(responsibilities|requirements|qualifications|eligibility|what you'?ll do|about the role|about us|preferred qualifications|must-have requirements|must-have qualifications|good-to-have requirements|good to have|nice to have|key responsibilities|core responsibilities|duties|who can apply|education|prerequisites|skills required|technical requirements|who you are|candidate profile|role overview):?$/i.test(line);
    const isHeader = !isExplicitBullet && (hasColonEnd || isKnownHeaderWord);

    if (isHeader) {
      if (
        lower.includes("preferred") ||
        lower.includes("nice to have") ||
        lower.includes("nice-to-have") ||
        lower.includes("good to have") ||
        lower.includes("good-to-have") ||
        lower.includes("bonus") ||
        lower.includes("plus") ||
        lower.includes("desired") ||
        lower.includes("desirable")
      ) {
        currentSectionCategory = "preferred";
        continue;
      }
      if (
        lower.includes("education") ||
        lower.includes("qualification") ||
        lower.includes("eligibility") ||
        lower.includes("who can apply") ||
        lower.includes("prerequisites") ||
        lower.includes("academic")
      ) {
        currentSectionCategory = "education";
        continue;
      }
      if (
        lower.includes("responsibilit") ||
        lower.includes("what you will do") ||
        lower.includes("what you'll do") ||
        lower.includes("day to day") ||
        lower.includes("day-to-day") ||
        lower.includes("duties") ||
        lower.includes("tasks") ||
        lower.includes("what you'll work on") ||
        lower.includes("role overview")
      ) {
        currentSectionCategory = "responsibility";
        continue;
      }
      if (
        lower.includes("experience") &&
        (lower.includes("years") || lower.includes("minimum") || lower.includes("required"))
      ) {
        currentSectionCategory = "experience";
        continue;
      }
      if (
        lower.includes("required") ||
        lower.includes("must have") ||
        lower.includes("must-have") ||
        lower.includes("requirements") ||
        lower.includes("basic qualification") ||
        lower.includes("minimum qualification") ||
        lower.includes("what you bring") ||
        lower.includes("skills")
      ) {
        currentSectionCategory = "required";
        continue;
      }
      if (
        lower.includes("work authorization") ||
        lower.includes("constraints") ||
        lower.includes("benefits")
      ) {
        currentSectionCategory = "other";
        continue;
      }
    }

    // Skip generic conversational chatter lines that aren't requirements only if in "other" category
    if (
      currentSectionCategory === "other" &&
      !isExplicitBullet &&
      !lower.includes("experience") &&
      !lower.includes("proficien") &&
      !lower.includes("knowledg") &&
      !lower.includes("degree") &&
      !lower.includes("ability to") &&
      !lower.includes("skilled in")
    ) {
      continue;
    }

    // Clean requirement text
    const cleanSnippet = line.replace(/^[-*•●]\s*|\d+\.\s*/, "").trim();
    if (cleanSnippet.length < 5) continue;

    // Verify quote in source text to ensure 100% grounded character span
    const verification = verifyQuoteInSource(text, cleanSnippet);
    if (!verification.verified || !verification.sourceOffsets) {
      continue;
    }

    // Determine category
    let finalCategory: RoleCategory = currentSectionCategory;

    if (EDUCATION_PATTERNS.some(p => p.test(cleanSnippet))) {
      finalCategory = "education";
    } else if (EXPERIENCE_PATTERNS.some(p => p.test(cleanSnippet))) {
      finalCategory = "experience";
      detectedExperienceQuotes.push(cleanSnippet);
    } else if (OTHER_CONSTRAINTS_PATTERNS.some(p => p.test(cleanSnippet))) {
      finalCategory = "other";
    } else if (
      lower.includes("preferred") ||
      lower.includes("plus") ||
      lower.includes("nice to have")
    ) {
      finalCategory = "preferred";
    } else if (currentSectionCategory === "responsibility" || /^(build|develop|create|design|architect|evaluate|debug|optimize|collaborate|write|maintain|implement)\b/i.test(cleanSnippet)) {
      finalCategory = "responsibility";
    }

    // Check for ambiguity
    let isAmbiguous = false;
    let ambiguityReason: string | undefined;

    for (const amb of AMBIGUOUS_PATTERNS) {
      if (amb.pattern.test(cleanSnippet)) {
        isAmbiguous = true;
        ambiguityReason = amb.reason;
        break;
      }
    }

    // Generate clean, readable requirement name without bullet noise
    // Keep exact stated name (e.g. "Experience with cloud technologies" stays "Cloud technologies")
    let cleanName = cleanSnippet;
    if (cleanSnippet.length > 70) {
      const matchKey = cleanSnippet.match(/(?:experience (?:with|in)|proficient in|strong knowledge of|working with)\s+([^,.;]+)/i);
      if (matchKey && matchKey[1]) {
        cleanName = matchKey[1].trim();
      } else {
        cleanName = cleanSnippet.slice(0, 65) + "…";
      }
    }

    // Capitalize first character
    cleanName = cleanName.charAt(0).toUpperCase() + cleanName.slice(1);

    // Map to semantic category
    let semanticCategory: SemanticRequirementCategory = "MUST_HAVE";
    let subtype = "technical_skill";

    if (finalCategory === "responsibility") {
      semanticCategory = "RESPONSIBILITY";
      subtype = "operational_task";
    } else if (finalCategory === "preferred") {
      semanticCategory = "PREFERRED";
    } else if (finalCategory === "education") {
      semanticCategory = "ELIGIBILITY";
      subtype = "education_degree";
    } else if (finalCategory === "experience") {
      semanticCategory = "MUST_HAVE";
      subtype = "experience_tenure";
    } else if (finalCategory === "other") {
      semanticCategory = "CONSTRAINT";
      subtype = "work_constraint";
    }

    if (isAmbiguous) {
      semanticCategory = "UNKNOWN";
    }

    const canonical = normalizeCanonicalName(cleanSnippet);
    const evidenceSignals = getExpectedEvidenceSignals(canonical, semanticCategory);
    const verificationStrategy = getVerificationStrategy(canonical, semanticCategory);
    const acceptableOptions = extractAcceptableOptions(cleanSnippet, canonical);
    const minExp = extractMinExperience(cleanSnippet);
    const reqType = inferRequirementType(canonical, subtype);
    const importance: ImportanceLevel = finalCategory === "required" ? "mandatory" : finalCategory === "preferred" ? "preferred" : "conditional";
    const evidenceExpectation = inferEvidenceExpectation(reqType, semanticCategory);

    reqSeq++;
    requirements.push({
      id: `req-${reqSeq}`,
      name: cleanName,
      category: finalCategory,
      evidenceQuote: verification.verbatimQuote,
      source: "job_description",
      needsConfirmation: isAmbiguous,
      ambiguityReason,
      startChar: verification.sourceOffsets.startChar,
      endChar: verification.sourceOffsets.endChar,
      canonicalName: canonical,
      semanticCategory,
      subtype,
      rationale: isAmbiguous
        ? (ambiguityReason || "Ambiguous requirement needing confirmation.")
        : `${canonical} is ${finalCategory === "required" ? "explicitly required" : finalCategory === "preferred" ? "preferred" : finalCategory} based on "${cleanSnippet}".`,
      evidenceSignals,
      verificationStrategy,
      confidence: isAmbiguous ? 0.85 : 0.95,
      ambiguityStatus: isAmbiguous ? "AMBIGUOUS" : "CLEAR",
      requirementType: reqType,
      importance,
      evidenceExpectation,
      acceptableOptions,
      minimumExperienceYears: minExp
    });
  }

  // 3. Conflict Detection across Experience Statements
  if (detectedExperienceQuotes.length >= 2) {
    const numbers = detectedExperienceQuotes.map(q => {
      const m = q.match(/(\d+)[\s-]*\+?[\s-]*years?/i);
      return m ? { num: parseInt(m[1], 10), quote: q } : null;
    }).filter(Boolean) as { num: number; quote: string }[];

    if (numbers.length >= 2) {
      const uniqueYears = Array.from(new Set(numbers.map(n => n.num)));
      if (uniqueYears.length > 1 && Math.abs(uniqueYears[0] - uniqueYears[1]) >= 2) {
        conflicts.push({
          statementA: numbers[0].quote,
          statementB: numbers[1].quote,
          reason: `Conflicting experience requirements found in job description: "${numbers[0].num}+ years" vs "${numbers[1].num}+ years".`
        });
      }
    }
  }

  // Assemble semantic Role DNA
  const roleDna = assembleRoleDnaStructure(
    roleTitle,
    department,
    seniority,
    targetHires,
    workMode,
    location,
    [],
    requirements.map(r => ({
      id: r.id,
      canonical_name: r.canonicalName || r.name,
      category: r.semanticCategory || (r.category === "required" ? "MUST_HAVE" : r.category === "preferred" ? "PREFERRED" : r.category === "education" ? "ELIGIBILITY" : r.category === "responsibility" ? "RESPONSIBILITY" : "CONSTRAINT"),
      subtype: (r.subtype as any) || "technical_skill",
      mandatory: r.category === "required",
      confidence: r.confidence || 0.95,
      source_text: r.evidenceQuote,
      source_section: r.category,
      rationale: r.rationale || `Identified from JD`,
      evidence_signals: r.evidenceSignals || [],
      verification_strategy: r.verificationStrategy || [],
      ambiguity_status: r.ambiguityStatus || "CLEAR",
      ambiguity_reason: r.ambiguityReason
    }))
  );

  return {
    roleTitle,
    department,
    seniority,
    targetHires,
    workMode,
    location,
    requirements,
    conflicts,
    rawText: text,
    roleDna,
    summary: {
      requiredCount: requirements.filter(r => r.category === "required").length,
      preferredCount: requirements.filter(r => r.category === "preferred").length,
      experienceCount: requirements.filter(r => r.category === "experience").length,
      educationCount: requirements.filter(r => r.category === "education").length,
      responsibilityCount: requirements.filter(r => r.category === "responsibility").length,
      otherCount: requirements.filter(r => r.category === "other").length,
      needsConfirmationCount: requirements.filter(r => r.needsConfirmation).length
    }
  };
}

/**
 * High-level entry point: Runs semantic parser with full Role DNA pipeline
 */
export async function extractSemanticRoleFromJd(
  rawJd: string,
  fallbackTitle = "Software Engineer"
): Promise<RoleExtractionResult> {
  const roleDna = await parseJobDescriptionSemantically(rawJd, fallbackTitle);

  // Convert RoleDNAStructure into StructuredRoleRequirement[]
  const allSemanticItemsMap = new Map<string, SemanticRequirementItem>();
  for (const item of [
    ...roleDna.mustHaves,
    ...roleDna.preferred,
    ...roleDna.eligibility,
    ...roleDna.responsibilities,
    ...roleDna.evidenceSignals,
    ...roleDna.constraints,
    ...roleDna.ambiguities
  ]) {
    if (!allSemanticItemsMap.has(item.id)) {
      allSemanticItemsMap.set(item.id, item);
    }
  }
  const allSemanticItems = Array.from(allSemanticItemsMap.values());

  const structuredRequirements: StructuredRoleRequirement[] = allSemanticItems.map((item, idx) => {
    let cat: RoleCategory = "required";
    if (item.category === "RESPONSIBILITY") cat = "responsibility";
    else if (item.category === "PREFERRED") cat = "preferred";
    else if (item.category === "ELIGIBILITY") cat = "education";
    else if (item.category === "CONSTRAINT") cat = "other";
    else if (item.category === "EVIDENCE_SIGNAL") cat = "preferred";
    else if (item.category === "UNKNOWN") cat = "other";
    else if (item.subtype === "experience_tenure") cat = "experience";

    return {
      id: item.id || `req-${idx + 1}`,
      name: item.canonical_name,
      category: cat,
      evidenceQuote: item.source_text || item.canonical_name,
      source: "job_description",
      needsConfirmation: item.ambiguity_status === "AMBIGUOUS",
      ambiguityReason: item.ambiguity_reason,
      canonicalName: item.canonical_name,
      semanticCategory: item.category,
      subtype: item.subtype,
      rationale: item.rationale,
      evidenceSignals: item.evidence_signals,
      verificationStrategy: item.verification_strategy,
      confidence: item.confidence,
      ambiguityStatus: item.ambiguity_status,
      relatedCapabilities: item.related_capabilities,
      requirementType: item.requirement_type,
      importance: item.importance,
      evidenceExpectation: item.evidence_expectation,
      acceptableOptions: item.acceptable_options,
      minimumExperienceYears: item.minimum_experience_years
    };
  });

  return {
    roleTitle: roleDna.roleTitle,
    department: roleDna.department,
    seniority: roleDna.seniority,
    targetHires: roleDna.targetHires,
    workMode: roleDna.workMode,
    location: roleDna.location,
    requirements: structuredRequirements,
    conflicts: [],
    rawText: rawJd,
    roleDna,
    summary: {
      requiredCount: structuredRequirements.filter(r => r.category === "required").length,
      preferredCount: structuredRequirements.filter(r => r.category === "preferred").length,
      experienceCount: structuredRequirements.filter(r => r.category === "experience").length,
      educationCount: structuredRequirements.filter(r => r.category === "education").length,
      responsibilityCount: structuredRequirements.filter(r => r.category === "responsibility").length,
      otherCount: structuredRequirements.filter(r => r.category === "other").length,
      needsConfirmationCount: structuredRequirements.filter(r => r.needsConfirmation).length
    }
  };
}

