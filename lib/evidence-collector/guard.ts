/**
 * ANTI-HALLUCINATION CODE GUARD & BANNED LANGUAGE ENFORCER
 * 
 * Non-Negotiable Contract:
 * 1. An LLM output is NEVER allowed to set `status: established` without a corresponding
 *    fact in normalized_facts that the code layer can independently point to.
 * 2. If the LLM asserts `established` with null or non-corroborating facts, the code
 *    deterministically downgrades it to `unknown` and logs the audit event.
 * 3. Sanitizes any leaked banned language to adhere to the Section 6 truth contract.
 */

import { EvidenceStatus, NormalizedFacts } from "./types";

export interface GuardEvaluationResult {
  finalStatus: EvidenceStatus;
  finalReason: string;
  downgraded: boolean;
  sanitized: boolean;
}

const BANNED_PATTERNS = [
  /\bcandidate is weak\b/i,
  /\bcandidate lacks\b/i,
  /\blacks? (?:competence|skill|ability|depth)\b/i,
  /\bdishonest\b/i,
  /\blying\b/i,
  /\bfabricat(?:ed|ing)\b/i,
  /\buntrustworthy\b/i,
  /\bpoor performance\b/i,
];

/**
 * Checks if the reason text contains forbidden judgmental language.
 */
export function containsBannedLanguage(text: string): boolean {
  if (!text) return false;
  return BANNED_PATTERNS.some((p) => p.test(text));
}

/**
 * Sanitizes reason text to strictly compliant language.
 */
export function sanitizeReasonText(reason: string, defaultCite = ""): string {
  if (!reason || containsBannedLanguage(reason)) {
    return defaultCite
      ? `Available evidence does not currently confirm this claim (${defaultCite}).`
      : "Available evidence does not currently confirm this claim.";
  }
  return reason;
}

/**
 * Deterministically checks whether `normalized_facts` provides tangible backing evidence
 * for a claim to qualify as `established`.
 */
export function hasCorroboratingFacts(
  claimOrRequirement: string,
  source: string,
  facts: NormalizedFacts
): boolean {
  if (!facts) return false;

  const claimLower = (claimOrRequirement || "").toLowerCase();

  // 1. GitHub Surface Facts
  if ("repo_count" in facts && Array.isArray(facts.top_repos)) {
    if (facts.repo_count === 0 && facts.top_repos.length === 0) {
      return false;
    }
    // If claim mentions specific language (e.g. Python, TypeScript) or repo name
    const matchingLang = (facts.top_languages || []).some((lang: any) => {
      const langName = typeof lang === "string" ? lang : lang?.name || "";
      if (!langName) return false;
      return claimLower.includes(langName.toLowerCase()) || langName.toLowerCase().includes(claimLower);
    });
    const matchingRepo = (facts.top_repos || []).some((repo: any) => {
      const repoName = typeof repo === "string" ? repo : repo?.name || "";
      if (!repoName) return false;
      return claimLower.includes(repoName.toLowerCase()) || repoName.toLowerCase().includes(claimLower);
    });
    // Generic coding claims (git, github, programming)
    const isGenericClaim = /\b(git|github|coding|programming|open source)\b/i.test(claimLower);
    const hasActiveRepos = isGenericClaim && (facts.commits_last_6mo > 0 || facts.top_repos.length > 0);

    return matchingLang || matchingRepo || Boolean(hasActiveRepos);
  }

  // 2. GitHub Deep Facts
  if ("repo_analyses" in facts && Array.isArray(facts.repo_analyses)) {
    if (facts.repo_analyses.length === 0) return false;
    const matchingRepo = facts.repo_analyses.some((r) => {
      const nameMatch = claimLower.includes((r.name || "").toLowerCase());
      const techMatch = (r.languages || []).some((l: string) => claimLower.includes(l.toLowerCase()));
      return (nameMatch || techMatch) && (r.commit_count > 0 || r.pr_count > 0 || r.commit_span_days > 0);
    });
    const isGenericClaim = /\b(git|github|coding|programming|open source)\b/i.test(claimLower);
    const hasActivity = isGenericClaim && facts.repo_analyses.some((r) => r.commit_count > 0 || r.pr_count > 0);
    return matchingRepo || Boolean(hasActivity);
  }

  // 3. Codeforces Facts
  if ("current_rating" in facts && "total_solved" in facts) {
    if (facts.total_solved === 0 && facts.current_rating === 0) {
      return false;
    }
    return facts.total_solved > 0 || facts.contest_count > 0;
  }

  // 4. LeetCode Facts
  if ("total_solved" in facts) {
    return (facts.total_solved || 0) > 0;
  }

  // 5. Resume Facts
  if ("skills_claimed" in facts && "projects" in facts) {
    const hasClaimedSkill = (facts.skills_claimed || []).some((s: string) =>
      claimLower.includes(s.toLowerCase()) || s.toLowerCase().includes(claimLower)
    );
    const hasProject = (facts.projects as Array<{ name?: string; technologies?: string[] }> || []).some(
      (p: { name?: string; technologies?: string[] }) =>
        (p.technologies || []).some((t: string) => claimLower.includes(t.toLowerCase())) ||
        Boolean(p.name && claimLower.includes(p.name.toLowerCase()))
    );
    return hasClaimedSkill || hasProject;
  }

  return false;
}

/**
 * Enforces the code guard against model self-report:
 * - Never allow `established` when facts are null or empty.
 * - Downgrades to `unknown` if no corroborating fact exists.
 * - Enforces banned language rules.
 */
export function enforceEvidenceGuard(
  proposedStatus: EvidenceStatus,
  proposedReason: string,
  claimOrRequirement: string,
  source: string,
  normalizedFacts: NormalizedFacts
): GuardEvaluationResult {
  let finalStatus: EvidenceStatus = proposedStatus;
  let finalReason: string = proposedReason || "";
  let downgraded = false;
  let sanitized = false;

  // 1. If normalized facts are null or empty, status CANNOT be established or partial
  if (!normalizedFacts) {
    if (finalStatus === "established" || finalStatus === "partial") {
      finalStatus = "unknown";
      downgraded = true;
      finalReason = `Available evidence does not currently confirm this claim. Source (${source}) returned no data.`;
    }
  } else if (finalStatus === "established") {
    // 2. Validate that normalized_facts actually corroborates the claim
    const corroborated = hasCorroboratingFacts(claimOrRequirement, source, normalizedFacts);
    if (!corroborated) {
      finalStatus = "unknown";
      downgraded = true;
      finalReason = `[EvidenceGuard] Downgraded to 'unknown': No corroborating fact found in normalized_facts for "${claimOrRequirement}".`;
    }
  }

  // 3. Banned Language Sanitization
  if (containsBannedLanguage(finalReason)) {
    finalReason = sanitizeReasonText(finalReason);
    sanitized = true;
  }

  if (!finalReason) {
    finalReason = finalStatus === "established"
      ? "Verified through corroborating facts in source."
      : "Available evidence does not currently confirm this claim.";
  }

  return {
    finalStatus,
    finalReason,
    downgraded,
    sanitized,
  };
}
