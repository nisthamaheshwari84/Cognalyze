/**
 * COGNALYZE BULLETPROOF JSON REPAIR & PARSER
 * 
 * Guarantees that LLM outputs, malformed responses, truncated JSON, and 
 * markdown code blocks never crash the application.
 */

export function stripThinkTags(text: string): string {
  if (!text) return "";
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, "")
    .replace(/<think>[\s\S]*$/gi, "") // Unclosed think tag
    .trim();
}

/**
 * Strips markdown code blocks and attempts to locate JSON object or array bounds.
 */
export function extractJsonString(raw: string): string | null {
  if (!raw || typeof raw !== "string") return null;

  // 1. Remove reasoning / think tags
  let cleaned = stripThinkTags(raw);

  // 2. Remove markdown code fences
  cleaned = cleaned.replace(/```(?:json)?/gi, "").replace(/```/g, "").trim();

  // 3. Find outermost braces or brackets
  const firstBrace = cleaned.indexOf("{");
  const firstBracket = cleaned.indexOf("[");

  let startIdx = -1;
  let isArray = false;

  if (firstBrace !== -1 && firstBracket !== -1) {
    if (firstBrace < firstBracket) {
      startIdx = firstBrace;
      isArray = false;
    } else {
      startIdx = firstBracket;
      isArray = true;
    }
  } else if (firstBrace !== -1) {
    startIdx = firstBrace;
    isArray = false;
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    isArray = true;
  }

  if (startIdx === -1) return null;

  const closeChar = isArray ? "]" : "}";
  const lastCloseIdx = cleaned.lastIndexOf(closeChar);

  if (lastCloseIdx !== -1 && lastCloseIdx > startIdx) {
    return cleaned.slice(startIdx, lastCloseIdx + 1);
  }

  // If there's no matching closing bracket/brace, return from start to end (for auto-repair)
  return cleaned.slice(startIdx);
}

/**
 * Attempts to repair broken or truncated JSON strings.
 */
export function repairJsonString(jsonStr: string): string {
  let s = jsonStr.trim();

  // Remove trailing commas before } or ]
  s = s.replace(/,\s*([\}\]])/g, "$1");

  // Fix single quotes around keys or strings
  // Replace unquoted property names like { name: "foo" } with { "name": "foo" }
  s = s.replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');

  // Count open and close braces/brackets
  let openBraces = 0;
  let openBrackets = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (escapeNext) {
      escapeNext = false;
      continue;
    }
    if (ch === "\\") {
      escapeNext = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (!inString) {
      if (ch === "{") openBraces++;
      if (ch === "}") openBraces = Math.max(0, openBraces - 1);
      if (ch === "[") openBrackets++;
      if (ch === "]") openBrackets = Math.max(0, openBrackets - 1);
    }
  }

  // If currently inside an open string that got cut off, close it
  if (inString) {
    s += '"';
  }

  // Remove any trailing comma at the very end
  s = s.replace(/,\s*$/, "");

  // Auto-close missing brackets and braces
  while (openBrackets > 0) {
    s += "]";
    openBrackets--;
  }
  while (openBraces > 0) {
    s += "}";
    openBraces--;
  }

  return s;
}

/**
 * Safely parses any text into JSON with multi-stage recovery.
 * Returns fallbackValue if recovery is impossible.
 */
export function safeJsonParse<T = any>(raw: any, fallbackValue: T): T {
  if (raw === null || raw === undefined) return fallbackValue;
  if (typeof raw === "object") return raw as T;
  if (typeof raw !== "string") return fallbackValue;

  const text = raw.trim();
  if (!text) return fallbackValue;

  // 1. Direct parse attempt
  try {
    return JSON.parse(text) as T;
  } catch {
    // Continue to recovery
  }

  // 2. Extract potential JSON slice
  const extracted = extractJsonString(text);
  if (extracted) {
    try {
      return JSON.parse(extracted) as T;
    } catch {
      // Continue to repair
    }

    // 3. Repair JSON
    try {
      const repaired = repairJsonString(extracted);
      return JSON.parse(repaired) as T;
    } catch {
      // Continue to next recovery
    }
  }

  // 4. Try repairing raw text directly
  try {
    const repairedDirect = repairJsonString(text);
    return JSON.parse(repairedDirect) as T;
  } catch {
    return fallbackValue;
  }
}

/**
 * Validates and normalizes candidate profile data so downstream code never crashes on undefined properties.
 */
export function normalizeCandidateProfile<T extends Record<string, any>>(raw: any): T {
  const safe: any = safeJsonParse(raw, {}) || {};

  return {
    ...safe,
    profile: {
      anonymized_name: safe?.profile?.anonymized_name || safe?.name || "Candidate",
      headline: safe?.profile?.headline || "Software Engineer",
      summary: safe?.profile?.summary || "",
      location: safe?.profile?.location || "Not specified",
      country: safe?.profile?.country || "Not specified",
      years_of_experience: typeof safe?.profile?.years_of_experience === "number" ? safe.profile.years_of_experience : 0,
      current_title: safe?.profile?.current_title || "",
      current_company: safe?.profile?.current_company || "",
      current_industry: safe?.profile?.current_industry || "",
    },
    skills: Array.isArray(safe?.skills)
      ? safe.skills.map((s: any) => ({
          name: typeof s === "string" ? s : (s?.name || "Unknown Skill"),
          proficiency: s?.proficiency || "intermediate",
          endorsements: typeof s?.endorsements === "number" ? s.endorsements : 0,
          duration_months: typeof s?.duration_months === "number" ? s.duration_months : 12
        }))
      : [],
    career_history: Array.isArray(safe?.career_history)
      ? safe.career_history.map((c: any) => ({
          company: c?.company || "Organization",
          title: c?.title || "Role",
          start_date: c?.start_date || "",
          end_date: c?.end_date || null,
          duration_months: typeof c?.duration_months === "number" ? c.duration_months : 0,
          is_current: Boolean(c?.is_current),
          industry: c?.industry || "",
          description: c?.description || ""
        }))
      : [],
    education: Array.isArray(safe?.education)
      ? safe.education.map((e: any) => ({
          institution: e?.institution || "University",
          degree: e?.degree || "Degree",
          field_of_study: e?.field_of_study || "",
          start_year: e?.start_year || 0,
          end_year: e?.end_year || 0,
          grade: e?.grade || "",
          tier: e?.tier || "unknown"
        }))
      : [],
    redrob_signals: safe?.redrob_signals || {
      availability: "flexible",
      responsiveness_hours: 24,
      profile_completeness_pct: 75
    }
  } as unknown as T;
}
