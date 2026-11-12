/**
 * Interview State Machine & Conversation Flow Engine
 *
 * Implements the formal 8-phase state machine:
 * INTRO → RESUME_DEEP_DIVE → JD_CORE_SKILLS → CODING → SYSTEM_DESIGN → CANDIDATE_QUESTIONS → CLOSING → ENDED
 *
 * Provides follow-up intelligence, semantic deduplication, 2-strike junk-input handling,
 * and dynamic header generation.
 */

export type InterviewPhase =
  | "INTRO"
  | "RESUME_DEEP_DIVE"
  | "JD_CORE_SKILLS"
  | "CODING"
  | "SYSTEM_DESIGN"
  | "CANDIDATE_QUESTIONS"
  | "CLOSING"
  | "ENDED";

export interface StateMachineContext {
  phase: InterviewPhase;
  turnIndex: number;
  totalTargetTurns: number;
  junkStrikes: number;
  questionsAsked: Array<{ text: string; phase: InterviewPhase; timestamp: number }>;
  lastQuestionText: string;
  candidateQuestionsCount: number;
  isEarlyFinishRequested?: boolean;
}

export const PHASE_DISPLAY_LABELS: Record<InterviewPhase, string> = {
  INTRO: "INTRO & RAPPORT",
  RESUME_DEEP_DIVE: "RESUME DEEP DIVE",
  JD_CORE_SKILLS: "JD CORE SKILLS",
  CODING: "PRACTICAL CODING",
  SYSTEM_DESIGN: "SYSTEM DESIGN",
  CANDIDATE_QUESTIONS: "CANDIDATE Q&A",
  CLOSING: "CLOSING & NEXT STEPS",
  ENDED: "INTERVIEW COMPLETE",
};

export const PHASE_COLORS: Record<InterviewPhase, string> = {
  INTRO: "#A5B4FC",
  RESUME_DEEP_DIVE: "#60A5FA",
  JD_CORE_SKILLS: "#34D399",
  CODING: "#FBBF24",
  SYSTEM_DESIGN: "#F472B6",
  CANDIDATE_QUESTIONS: "#38BDF8",
  CLOSING: "#818CF8",
  ENDED: "#94A3B8",
};

// ══════════════════════════════════════════════════════════════
// 1. JUNK INPUT DETECTION & 2-STRIKE STATE MACHINE
// ══════════════════════════════════════════════════════════════

export function isJunkInput(text: string): boolean {
  const clean = text.trim();
  if (clean.length === 0) return true;
  if (clean.length < 3) return true;

  // Repetitive single character (e.g. "aaaaa", ".....")
  if (/^(.)\1+$/.test(clean)) return true;

  // Keyboard mash / random noise (e.g. "asdfghj", "BYY\", "zxczxc", "qwerqwer")
  const mashPatterns = [
    /^[asdfghjkl;']+$/i,
    /^[qwertyuiop]+$/i,
    /^[zxcvbnm,./]+$/i,
    /^[a-z0-9\\]{1,5}$/i, // Short random alphanumerics like "BYY\"
  ];

  if (clean.length <= 6) {
    const hasVowel = /[aeiouy]/i.test(clean);
    const isCommonAcronym = /^(sql|api|jwt|css|html|aws|gcp|ssh|npm|git|dns|tcp|udp|dom|dom|orm|db)$/i.test(clean);
    if (!hasVowel && !isCommonAcronym) return true;
  }

  for (const pat of mashPatterns) {
    if (pat.test(clean) && clean.length > 3) return true;
  }

  return false;
}

export function handleJunkInput(
  input: string,
  currentStrikes: number
): { isJunk: boolean; newStrikes: number; replyMessage?: string; advanceTurn: boolean } {
  if (!isJunkInput(input)) {
    return { isJunk: false, newStrikes: 0, advanceTurn: false };
  }

  const newStrikes = currentStrikes + 1;
  if (newStrikes === 1) {
    return {
      isJunk: true,
      newStrikes,
      replyMessage:
        "It looks like that was an unintended keystroke or noise. Please share your technical thought process, or feel free to let me know if you would like to move to the next topic.",
      advanceTurn: false,
    };
  }

  return {
    isJunk: true,
    newStrikes,
    replyMessage:
      "Understood. We will move on to the next topic to ensure we cover all planned assessment areas.",
    advanceTurn: true,
  };
}

// ══════════════════════════════════════════════════════════════
// 2. CANDIDATE DEFERRAL / "NO IDEA" DETECTION
// ══════════════════════════════════════════════════════════════

export function isCandidateDeferral(text: string): boolean {
  const clean = text.trim().toLowerCase();
  const wordCount = clean.split(/\s+/).filter(Boolean).length;
  if (wordCount > 25) return false;

  const patterns = [
    /\bi don'?t know\b/i,
    /\bno idea\b/i,
    /\bnot sure\b/i,
    /\bhaven'?t worked with (that|this)\b/i,
    /\bnever used (that|this)\b/i,
    /\bcan we (skip|pass|move on)\b/i,
    /\blet'?s (skip|move on|pass)\b/i,
    /\bpass on this\b/i,
    /\brather not\b/i,
    /\bprefer to skip\b/i,
    /^(no|nope|nah|skip|pass)(\.|\!|\s|$)/i,
  ];

  return patterns.some((p) => p.test(clean));
}

// ══════════════════════════════════════════════════════════════
// 3. SEMANTIC DEDUPLICATION (Jaccard + Token Overlap)
// ══════════════════════════════════════════════════════════════

export function calculateQuestionSimilarity(q1: string, q2: string): number {
  const tokenize = (s: string) =>
    new Set(
      s
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .filter((w) => w.length > 3)
    );

  const set1 = tokenize(q1);
  const set2 = tokenize(q2);

  if (set1.size === 0 || set2.size === 0) return 0;

  let intersection = 0;
  for (const item of set1) {
    if (set2.has(item)) intersection++;
  }

  const union = new Set([...set1, ...set2]).size;
  return intersection / union;
}

export function isSemanticDuplicate(
  candidateQuestion: string,
  pastQuestions: Array<{ text: string }>
): boolean {
  for (const past of pastQuestions) {
    if (calculateQuestionSimilarity(candidateQuestion, past.text) >= 0.70) {
      return true;
    }
  }
  return false;
}

// ══════════════════════════════════════════════════════════════
// 4. PHASE TRANSITION ENGINE
// ══════════════════════════════════════════════════════════════

export function determineNextPhase(
  ctx: StateMachineContext,
  candidateMessage: string
): InterviewPhase {
  if (ctx.phase === "ENDED") return "ENDED";

  // Check if candidate explicitly requested to end early
  if (
    /wrap up the interview|end the interview|stop the interview|conclude now/i.test(
      candidateMessage
    )
  ) {
    return "CLOSING";
  }

  const turn = ctx.turnIndex;

  switch (ctx.phase) {
    case "INTRO":
      // Turn 0 is greeting. Candidate reply moves directly to RESUME_DEEP_DIVE.
      return "RESUME_DEEP_DIVE";

    case "RESUME_DEEP_DIVE":
      // Typically 3 questions (Turns 1, 2, 3)
      if (turn >= 3) return "JD_CORE_SKILLS";
      return "RESUME_DEEP_DIVE";

    case "JD_CORE_SKILLS":
      // Typically 3 questions (Turns 4, 5, 6)
      if (turn >= 6) return "CODING";
      return "JD_CORE_SKILLS";

    case "CODING":
      // Typically 2 questions (Turns 7, 8)
      if (turn >= 8) return "SYSTEM_DESIGN";
      return "CODING";

    case "SYSTEM_DESIGN":
      // Typically 2 questions (Turns 9, 10)
      if (turn >= 10 || turn >= ctx.totalTargetTurns - 2) return "CANDIDATE_QUESTIONS";
      return "SYSTEM_DESIGN";

    case "CANDIDATE_QUESTIONS":
      // After candidate has asked 2 questions or indicates no more questions
      if (
        ctx.candidateQuestionsCount >= 2 ||
        /no more questions|all good|that covers it|thank you that was helpful|nothing else/i.test(
          candidateMessage
        )
      ) {
        return "CLOSING";
      }
      return "CANDIDATE_QUESTIONS";

    case "CLOSING":
      return "ENDED";

    default:
      return ctx.phase;
  }
}

// ══════════════════════════════════════════════════════════════
// 5. DYNAMIC HEADER FORMATTER
// ══════════════════════════════════════════════════════════════

export function formatStageHeader(
  phase: InterviewPhase,
  turnNumber: number,
  totalTargetTurns: number = 12
): string {
  const label = PHASE_DISPLAY_LABELS[phase] || "INTERVIEW";
  if (phase === "INTRO") return `${label} | INTRO`;
  if (phase === "CANDIDATE_QUESTIONS") return `${label} | CANDIDATE INQUIRIES`;
  if (phase === "CLOSING" || phase === "ENDED") return `${label} | FINAL SUMMARY`;

  const displayQ = Math.max(1, turnNumber);
  return `${label} | Q${displayQ} / ${totalTargetTurns}`;
}

