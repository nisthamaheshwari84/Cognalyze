/**
 * lib/skills/dsa-interview-history-store.ts
 * 
 * Persistent Question History & Anti-Repeat Ledger for DSA Interview Mode.
 * 
 * Ensures:
 * 1. Persistent Question History per candidate across all sessions (completed, abandoned, timed_out).
 * 2. Multi-tier repeat detection:
 *    - Exact question ID match
 *    - Canonical problem ID match
 *    - Normalized semantic fingerprint match
 * 3. Concurrency-safe in-memory cache synchronized with data/dsa-question-history.json.
 * 4. Multi-tenant user isolation.
 */

import fs from "fs";
import path from "path";
import { CandidateQuestionHistoryEntry, AssessmentArea } from "./dsa-interview-types";

const DATA_DIR = path.join(process.cwd(), "data");
const HISTORY_FILE = path.join(DATA_DIR, "dsa-question-history.json");

// In-memory cache keyed by candidateId -> array of history entries
let candidateHistoryMap: Map<string, CandidateQuestionHistoryEntry[]> | null = null;

function ensureHistoryLoaded(): Map<string, CandidateQuestionHistoryEntry[]> {
  if (candidateHistoryMap) return candidateHistoryMap;
  candidateHistoryMap = new Map();

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(HISTORY_FILE)) {
      const raw = fs.readFileSync(HISTORY_FILE, "utf8");
      const list: CandidateQuestionHistoryEntry[] = JSON.parse(raw);
      for (const entry of list) {
        const arr = candidateHistoryMap.get(entry.candidateId) || [];
        arr.push(entry);
        candidateHistoryMap.set(entry.candidateId, arr);
      }
    }
  } catch (err) {
    console.warn("[dsa-interview-history-store] Failed to load history from disk:", err);
  }

  return candidateHistoryMap;
}

function persistHistoryToDisk(): void {
  if (!candidateHistoryMap) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const allEntries: CandidateQuestionHistoryEntry[] = [];
    for (const list of candidateHistoryMap.values()) {
      allEntries.push(...list);
    }
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(allEntries, null, 2), "utf8");
  } catch (err) {
    console.error("[dsa-interview-history-store] Failed to save history to disk:", err);
  }
}

/**
 * Returns all historical question IDs and canonical IDs presented to a candidate.
 */
export function getSeenQuestionIds(candidateId: string): Set<string> {
  const map = ensureHistoryLoaded();
  const entries = map.get(candidateId) || [];
  const set = new Set<string>();
  for (const e of entries) {
    if (e.questionId) set.add(e.questionId);
    if (e.canonicalId) set.add(e.canonicalId);
  }
  return set;
}

/**
 * Returns all semantic fingerprints of questions presented to a candidate.
 */
export function getSeenFingerprints(candidateId: string): Set<string> {
  const map = ensureHistoryLoaded();
  const entries = map.get(candidateId) || [];
  const set = new Set<string>();
  for (const e of entries) {
    if (e.semanticFingerprint) set.add(e.semanticFingerprint);
  }
  return set;
}

/**
 * Checks if a proposed question is a duplicate or near-duplicate for this candidate.
 */
export function isQuestionSeen(
  candidateId: string,
  question: {
    id: string;
    canonicalId?: string;
    semanticFingerprint?: string;
  }
): boolean {
  const seenIds = getSeenQuestionIds(candidateId);
  if (seenIds.has(question.id)) return true;
  if (question.canonicalId && seenIds.has(question.canonicalId)) return true;

  if (question.semanticFingerprint) {
    const seenFps = getSeenFingerprints(candidateId);
    if (seenFps.has(question.semanticFingerprint)) return true;
  }

  return false;
}

/**
 * Records newly presented questions into the candidate's persistent ledger.
 */
export function recordQuestionsPresented(
  candidateId: string,
  sessionId: string,
  questions: Array<{
    id: string;
    canonicalId?: string;
    area: AssessmentArea;
    topic: string;
    difficulty?: "easy" | "medium" | "hard";
    semanticFingerprint: string;
  }>
): void {
  const map = ensureHistoryLoaded();
  const arr = map.get(candidateId) || [];
  const now = new Date().toISOString();

  for (const q of questions) {
    arr.push({
      candidateId,
      sessionId,
      questionId: q.id,
      canonicalId: q.canonicalId,
      area: q.area,
      topic: q.topic,
      difficulty: q.difficulty || "medium",
      semanticFingerprint: q.semanticFingerprint,
      presentedAt: now
    });
  }

  map.set(candidateId, arr);
  persistHistoryToDisk();
}

/**
 * Test & maintenance helper: reset history for a specific candidate.
 */
export function clearCandidateQuestionHistory(candidateId: string): void {
  const map = ensureHistoryLoaded();
  map.delete(candidateId);
  persistHistoryToDisk();
}

