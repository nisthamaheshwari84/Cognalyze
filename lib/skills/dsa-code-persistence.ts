/**
 * DSA Arena Code Editor Persistence & Draft Synchronization Architecture
 * 
 * Provides an authoritative, isolated single-source-of-truth for code drafts
 * across DSA PROBLEMs, programming languages, and study modes.
 * 
 * Guarantees:
 * 1. Single authoritative source of truth for user code.
 * 2. Complete isolation between different problems and different languages.
 * 3. User code is never overwritten by background fetches, mode switching, or re-renders.
 * 4. Empty string (`""`) is respected as a valid intentional user draft (e.g. after clearing template).
 * 5. Safe debounced local storage persistence.
 * 6. Explicit starter code reset policy only when requested by user.
 */

import { DsaProblemFull } from "./dsa-curriculum";
import { getCanonicalProblem } from "./dsa-canonical-problems";

export type SupportedLanguage = "cpp" | "python" | "javascript" | "java";

export interface ResolveCodeParams {
  problem: DsaProblemFull;
  language: SupportedLanguage;
  candidateId?: string;
  inMemoryDrafts: Record<string, string>;
  interviewSubmittedCode?: string | null;
}

export interface ResolveCodeResult {
  code: string;
  isFromDraft: boolean;
  source: "in_memory_draft" | "local_storage_draft" | "interview_submission" | "starter_template";
}

/**
 * Generate a deterministic composite key for (problemId, language).
 */
export function getDraftKey(problemId: string, language: string): string {
  const cleanId = (problemId || "").trim();
  const cleanLang = (language || "cpp").trim().toLowerCase();
  return `${cleanId}::${cleanLang}`;
}

/**
 * Generate the localStorage partition key for a candidate.
 */
export function getStorageKey(candidateId?: string): string {
  const cid = candidateId && candidateId.trim() ? candidateId.trim() : "guest";
  return `cognalyze_dsa_drafts_${cid}`;
}

/**
 * Retrieve canonical starter code for a problem in the specified language.
 */
export function getProblemStarterCode(
  problem: DsaProblemFull,
  language: SupportedLanguage
): string {
  if (!problem) return "";
  const canonical = getCanonicalProblem(problem.id);
  const langKey = language as keyof typeof problem.starterCode;

  return (
    canonical?.starterCode?.[langKey] ||
    problem.starterCode?.[langKey] ||
    problem.starterCode?.cpp ||
    problem.starterCode?.python ||
    ""
  );
}

/**
 * Read all persisted drafts for a candidate from localStorage safely.
 */
export function loadDraftsFromStorage(candidateId?: string): Record<string, string> {
  if (typeof window === "undefined" || !window.localStorage) {
    return {};
  }
  try {
    const key = getStorageKey(candidateId);
    const raw = window.localStorage.getItem(key);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      return parsed;
    }
    return {};
  } catch (err) {
    console.warn("[DsaCodePersistence] Failed to read drafts from storage:", err);
    return {};
  }
}

/**
 * Save an individual draft safely to localStorage.
 */
export function saveDraftToStorage(
  candidateId: string | undefined,
  problemId: string,
  language: SupportedLanguage,
  code: string
): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  try {
    const key = getStorageKey(candidateId);
    const drafts = loadDraftsFromStorage(candidateId);
    const draftKey = getDraftKey(problemId, language);
    drafts[draftKey] = code;
    window.localStorage.setItem(key, JSON.stringify(drafts));
  } catch (err) {
    console.warn("[DsaCodePersistence] Failed to persist draft:", err);
  }
}

/**
 * Save a batch of in-memory drafts to localStorage.
 */
export function saveAllDraftsToStorage(
  candidateId: string | undefined,
  drafts: Record<string, string>
): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  try {
    const key = getStorageKey(candidateId);
    const existing = loadDraftsFromStorage(candidateId);
    const merged = { ...existing, ...drafts };
    window.localStorage.setItem(key, JSON.stringify(merged));
  } catch (err) {
    console.warn("[DsaCodePersistence] Failed to batch persist drafts:", err);
  }
}

/**
 * Clear a specific draft from storage (e.g., when resetting starter code).
 */
export function clearDraftFromStorage(
  candidateId: string | undefined,
  problemId: string,
  language: SupportedLanguage
): void {
  if (typeof window === "undefined" || !window.localStorage) {
    return;
  }
  try {
    const key = getStorageKey(candidateId);
    const drafts = loadDraftsFromStorage(candidateId);
    const draftKey = getDraftKey(problemId, language);
    delete drafts[draftKey];
    window.localStorage.setItem(key, JSON.stringify(drafts));
  } catch (err) {
    console.warn("[DsaCodePersistence] Failed to clear draft:", err);
  }
}

/**
 * Resolve the authoritative code for a problem and language under strict precedence:
 * 1. In-memory draft for (problemId, language) - handles active session edits.
 * 2. LocalStorage draft for (problemId, language) - handles page reload recovery.
 * 3. Active interview submitted code (if resuming an ongoing interview session).
 * 4. Starter code template from canonical/curriculum definition.
 * 
 * CRUCIAL: Empty string (`""`) is a completely valid draft (user deleted code to start fresh).
 * It must NEVER be treated as falsy or replaced with starter code.
 */
export function resolveProblemCode(params: ResolveCodeParams): ResolveCodeResult {
  const { problem, language, candidateId, inMemoryDrafts, interviewSubmittedCode } = params;
  if (!problem) {
    return { code: "", isFromDraft: false, source: "starter_template" };
  }

  const draftKey = getDraftKey(problem.id, language);

  // 1. Check in-memory draft (active edits)
  if (typeof inMemoryDrafts[draftKey] === "string") {
    return {
      code: inMemoryDrafts[draftKey],
      isFromDraft: true,
      source: "in_memory_draft"
    };
  }

  // 2. Check localStorage drafts (persisted across sessions)
  const storedDrafts = loadDraftsFromStorage(candidateId);
  if (typeof storedDrafts[draftKey] === "string") {
    return {
      code: storedDrafts[draftKey],
      isFromDraft: true,
      source: "local_storage_draft"
    };
  }

  // 3. Check active interview submitted code
  if (typeof interviewSubmittedCode === "string" && interviewSubmittedCode.trim().length > 0) {
    return {
      code: interviewSubmittedCode,
      isFromDraft: true,
      source: "interview_submission"
    };
  }

  // 4. Default to canonical or curriculum starter code
  const starter = getProblemStarterCode(problem, language);
  return {
    code: starter,
    isFromDraft: false,
    source: "starter_template"
  };
}
