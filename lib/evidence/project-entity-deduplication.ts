/**
 * lib/evidence/project-entity-deduplication.ts
 * 
 * COGNALYZE MULTI-SOURCE PROJECT ENTITY DEDUPLICATION ENGINE (Phase 5)
 * 
 * Solves Scenario 7:
 * When a candidate lists "HyperRoute" on Resume, has "hyperroute-core" on GitHub,
 * and mentions "HyperRoute Gateway" on LinkedIn, these 3 mentions represent
 * ONE underlying project entity, not three disparate projects.
 * 
 * Rules:
 * 1. Normalize project titles across punctuation, prefixes, suffixes, and qualifiers.
 * 2. Corroborate across distinct sources rather than inflating project counts.
 * 3. Elevate verification status when an independent repository or deployment corroborates a resume claim.
 * 4. Deterministic, pure evaluation with traceable provenance.
 */

export interface RawProjectMention {
  sourceType: "resume" | "github" | "linkedin" | "portfolio" | "student_declaration";
  rawTitle: string;
  description?: string;
  url?: string;
  techStack?: string[];
  commitsCount?: number;
  hasTests?: boolean;
  hasCi?: boolean;
}

export interface CanonicalProjectEntity {
  canonicalId: string;
  canonicalTitle: string;
  description?: string;
  primaryUrl?: string;
  mergedTechStack: string[];
  sourcesReferenced: Array<"resume" | "github" | "linkedin" | "portfolio" | "student_declaration">;
  rawMentionsCount: number;
  isCorroborated: boolean;
  verificationStatus: "INDEPENDENTLY_VERIFIED" | "STUDENT_REPORTED" | "UNVERIFIED";
  provenanceSummary: string;
  codeQualitySignals: string[];
  totalCommits?: number;
  hasTests: boolean;
  hasCi: boolean;
}

const COMMON_PROJECT_SUFFIXES = [
  "-core",
  "-service",
  "-backend",
  "-frontend",
  "-api",
  "-app",
  "-client",
  "-server",
  "-bot",
  "-agent",
  "-system",
  "-gateway",
  "-engine",
  "_core",
  "_service",
  "_backend",
  "_frontend",
  "_api",
  "_app",
];

/**
 * Normalizes a raw project title or repository name into a clean canonical matching key.
 */
export function normalizeProjectKey(title: string): string {
  if (!title || typeof title !== "string") return "";

  // 1. Take first part before colon, dash, or pipe if followed by descriptive text
  let base = title.split(/[:|—–-]\s+/)[0].trim().toLowerCase();

  // 2. Strip common role, descriptor, and component words
  base = base.replace(/\b(project|app|developer|engineer|tool|bot|gateway|service|core|engine|system|client|server)\b/gi, "").trim();

  // 3. Strip common technical suffixes
  for (const suffix of COMMON_PROJECT_SUFFIXES) {
    if (base.endsWith(suffix)) {
      base = base.slice(0, -suffix.length).trim();
    }
  }

  // 4. Strip non-alphanumeric except underscore/hyphen
  const cleaned = base.replace(/[^a-z0-9]/g, "");
  return cleaned || title.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Calculates token-level Jaccard similarity between two project descriptions or titles.
 */
function tokenSimilarity(a: string, b: string): number {
  const tokensA = new Set(a.toLowerCase().split(/[\s_-]+/).filter((t) => t.length > 2));
  const tokensB = new Set(b.toLowerCase().split(/[\s_-]+/).filter((t) => t.length > 2));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;

  let intersection = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) intersection++;
  }

  const union = new Set([...tokensA, ...tokensB]).size;
  return union > 0 ? intersection / union : 0;
}

/**
 * Normalizes a URL to its canonical form (e.g. stripping protocol and trailing slash).
 */
function canonicalizeUrl(url?: string): string {
  if (!url) return "";
  return url.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");
}

/**
 * Deduplicates raw project mentions across multiple sources into unified canonical project entities.
 */
export function deduplicateProjectEntities(mentions: RawProjectMention[]): CanonicalProjectEntity[] {
  if (!mentions || mentions.length === 0) return [];

  const entities: CanonicalProjectEntity[] = [];

  for (const mention of mentions) {
    if (!mention.rawTitle && !mention.url) continue;

    const key = normalizeProjectKey(mention.rawTitle || mention.url || "");
    const cleanUrl = canonicalizeUrl(mention.url);

    // Look for existing matching entity
    let matchedEntity = entities.find((e) => {
      // Direct key match
      if (key && normalizeProjectKey(e.canonicalTitle) === key) return true;

      // Direct URL match
      if (cleanUrl && e.primaryUrl && canonicalizeUrl(e.primaryUrl) === cleanUrl) return true;

      // High token similarity between titles
      if (tokenSimilarity(e.canonicalTitle, mention.rawTitle) >= 0.6) return true;

      return false;
    });

    if (!matchedEntity) {
      // Derive clean canonical title
      let canonicalTitle = mention.rawTitle.split(/[:|—–]\s+/)[0].trim();
      for (const suffix of COMMON_PROJECT_SUFFIXES) {
        if (canonicalTitle.toLowerCase().endsWith(suffix)) {
          canonicalTitle = canonicalTitle.slice(0, -suffix.length).trim();
        }
      }

      const isVerifiedSource = mention.sourceType === "github" && Boolean(mention.url);
      const qualitySignals: string[] = [];
      if (mention.hasTests) qualitySignals.push("Automated test suite verified");
      if (mention.hasCi) qualitySignals.push("CI/CD pipeline configured");
      if ((mention.commitsCount || 0) > 10) qualitySignals.push(`${mention.commitsCount} commits verified`);

      matchedEntity = {
        canonicalId: `proj_${key || Date.now().toString(36)}`,
        canonicalTitle: canonicalTitle || mention.rawTitle,
        description: mention.description,
        primaryUrl: mention.url,
        mergedTechStack: Array.from(new Set(mention.techStack || [])),
        sourcesReferenced: [mention.sourceType],
        rawMentionsCount: 1,
        isCorroborated: false,
        verificationStatus: isVerifiedSource ? "INDEPENDENTLY_VERIFIED" : "STUDENT_REPORTED",
        provenanceSummary: mention.sourceType.toUpperCase(),
        codeQualitySignals: qualitySignals,
        totalCommits: mention.commitsCount,
        hasTests: Boolean(mention.hasTests),
        hasCi: Boolean(mention.hasCi),
      };

      entities.push(matchedEntity);
    } else {
      // Merge mention into existing entity
      matchedEntity.rawMentionsCount++;

      if (!matchedEntity.sourcesReferenced.includes(mention.sourceType)) {
        matchedEntity.sourcesReferenced.push(mention.sourceType);
      }

      // Merge tech stack
      for (const tech of mention.techStack || []) {
        if (!matchedEntity.mergedTechStack.includes(tech)) {
          matchedEntity.mergedTechStack.push(tech);
        }
      }

      // Update URL if we discover a real repository URL
      if (!matchedEntity.primaryUrl && mention.url) {
        matchedEntity.primaryUrl = mention.url;
      }

      // Merge commit count and test indicators
      if (mention.commitsCount && (!matchedEntity.totalCommits || mention.commitsCount > matchedEntity.totalCommits)) {
        matchedEntity.totalCommits = mention.commitsCount;
      }
      if (mention.hasTests) matchedEntity.hasTests = true;
      if (mention.hasCi) matchedEntity.hasCi = true;

      // Update quality signals
      if (mention.hasTests && !matchedEntity.codeQualitySignals.some((s) => s.includes("test"))) {
        matchedEntity.codeQualitySignals.push("Automated test suite verified");
      }
      if (mention.hasCi && !matchedEntity.codeQualitySignals.some((s) => s.includes("CI/CD"))) {
        matchedEntity.codeQualitySignals.push("CI/CD pipeline configured");
      }

      // Check corroboration
      if (matchedEntity.sourcesReferenced.length >= 2) {
        matchedEntity.isCorroborated = true;
      }

      // If corroborated by GitHub with commits or tests, elevate status
      if (matchedEntity.sourcesReferenced.includes("github")) {
        matchedEntity.verificationStatus = "INDEPENDENTLY_VERIFIED";
      }

      // Update provenance summary
      matchedEntity.provenanceSummary = matchedEntity.sourcesReferenced
        .map((s) => s.toUpperCase())
        .join(" + ");
    }
  }

  return entities;
}
