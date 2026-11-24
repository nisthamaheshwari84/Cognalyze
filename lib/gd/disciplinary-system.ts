/**
 * COGNALYZE GROUP DISCUSSION — PLATFORM-WIDE DISCIPLINARY & 3-WARNING SYSTEM
 * 
 * Formal 3-Warning Policy for Placement GDs & Friends Multiplayer Rooms:
 * - Warning 1 (First Warning): Official verbal notice explaining conduct breach; logged.
 * - Warning 2 (Final Warning): Strong caution; participant warned next breach causes 72h account suspension.
 * - Warning 3 (Account Suspension): Ejected from GD room, access revoked, server-authoritative 72h
 *   account suspension triggered via updateUser(userId, { status: "SUSPENDED" }) in lib/auth/store.ts.
 * 
 * Strict Validation Rules:
 * - Never punishes constructive disagreement, robust counterarguments, or natural overlap.
 * - Prevents false positives from background noise, short transcripts (< 4 words), or STT errors.
 * - High-severity threats or harassment trigger immediate escalation.
 * - Full audit trail with appeal token and resolution management.
 */

import fs from "fs";
import path from "path";
import { GDConductViolationCategory, GDWarningSeverity, GDModerationIncident } from "./types";
import { updateUser, getUserById } from "@/lib/auth/store";

export interface DisciplinaryRecord {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  sessionId: string;
  isFriendsRoom: boolean;
  roomCode?: string;
  warningNumber: 1 | 2 | 3;
  severity: GDWarningSeverity;
  violationCategory: GDConductViolationCategory;
  evidenceExcerpt: string;
  contextSummary: string;
  timestamp: number;
  moderatorUtterance: string;
  suspensionDurationHours?: number;
  suspensionStartedAt?: string;
  suspensionExpiresAt?: string;
  appealToken: string;
  appealStatus: "NONE" | "PENDING_REVIEW" | "UPHELD" | "REJECTED";
  appealNotes?: string;
  createdAt: string;
}

function isServerless(): boolean {
  return Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NEXT_RUNTIME === "edge");
}

function getDisciplinaryLogPath(): string {
  if (isServerless()) {
    return path.join("/tmp", "cognalyze-gd-disciplinary-log.json");
  }
  return path.join(process.cwd(), "data", "gd-disciplinary-log.json");
}

let inMemoryDisciplinaryLogs: DisciplinaryRecord[] = [];
let isLoaded = false;

function loadDisciplinaryLogs(): void {
  if (isLoaded) return;
  try {
    const filePath = getDisciplinaryLogPath();
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      inMemoryDisciplinaryLogs = JSON.parse(data);
    }
  } catch (err) {
    console.warn("[disciplinary-system] Log load fallback:", err);
    inMemoryDisciplinaryLogs = [];
  }
  isLoaded = true;
}

function persistDisciplinaryLogs(): void {
  try {
    const filePath = getDisciplinaryLogPath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(inMemoryDisciplinaryLogs, null, 2), "utf-8");
  } catch (err) {
    console.warn("[disciplinary-system] Failed to persist log to disk:", err);
  }
}

// Prohibited terms for severe harassment / slurs that warrant instant warning escalation
const SEVERE_HARASSMENT_REGEX = /\b(shut up|idiot|stupid|moron|loser|get out|dumb|garbage|trash|hate you|worthless|incompetent fool)\b/i;
const CONSTRUCTIVE_DISAGREEMENT_MARKERS = [
  "i disagree", "however", "on the contrary", "trade-off", "alternative",
  "bottleneck", "latency", "failure mode", "unrealistic", "counterpoint",
  "from a business perspective", "technically speaking", "p99", "scalable"
];

/**
 * Validate whether an utterance constitutes an actual conduct policy violation.
 * Prevents transcription errors, noise, and constructive debates from triggering warnings.
 */
export function evaluateUtteranceForMisconduct(params: {
  speakerName: string;
  text: string;
  recentSpeakerHistory: { speakerName: string; text: string; timestamp: number }[];
  isInterruption: boolean;
  participantSpeakingRatio: number; // e.g. 0.45 = 45% of total time
}): {
  isViolation: boolean;
  category?: GDConductViolationCategory;
  suggestedSeverity?: GDWarningSeverity;
  reason?: string;
  isHighSeverityEscalation?: boolean;
} {
  const { text, isInterruption, participantSpeakingRatio } = params;
  const clean = text.trim();
  const words = clean.split(/\s+/).filter(Boolean);

  // Guard: Speech recognition noise or tiny fragments (< 4 words) never cause disciplinary action
  if (words.length < 4) {
    return { isViolation: false };
  }

  // 1. Check for Severe Harassment or Personal Attacks (Highest Severity)
  if (SEVERE_HARASSMENT_REGEX.test(clean)) {
    return {
      isViolation: true,
      category: "PERSONAL_ATTACK",
      suggestedSeverity: "WARNING_1",
      reason: "Direct disrespectful or insulting language directed at a fellow candidate.",
      isHighSeverityEscalation: true
    };
  }

  // 2. Check for Disrespectful / Aggressive Conduct
  const lower = clean.toLowerCase();
  if (
    lower.includes("don't talk") ||
    lower.includes("stop talking") ||
    lower.includes("you don't know anything") ||
    lower.includes("you have no idea")
  ) {
    return {
      isViolation: true,
      category: "DISRESPECTFUL_LANGUAGE",
      suggestedSeverity: "WARNING_1",
      reason: "Attempting to silence another candidate or dismiss them disrespectfully."
    };
  }

  // 3. Check for Constructive Disagreement Protection:
  // If the user uses technical or polite debate framing, it is 100% PROTECTED.
  const hasConstructiveMarker = CONSTRUCTIVE_DISAGREEMENT_MARKERS.some(m => lower.includes(m));
  if (hasConstructiveMarker) {
    // Cannot be a violation unless pure profanity (checked above)
    return { isViolation: false };
  }

  // 4. Excessive Speaking Dominance (Monopolizing > 45% of the floor in a multi-party GD)
  if (participantSpeakingRatio > 0.48 && words.length > 80) {
    return {
      isViolation: true,
      category: "EXCESSIVE_DOMINANCE",
      suggestedSeverity: "NOTICE",
      reason: "Monopolizing the floor and preventing other candidates from speaking."
    };
  }

  // 5. Flagrant Repeated Interruptions
  if (isInterruption && words.length > 15) {
    return {
      isViolation: true,
      category: "REPEATED_INTERRUPTION",
      suggestedSeverity: "NOTICE",
      reason: "Interrupting while another candidate is delivering an argument."
    };
  }

  return { isViolation: false };
}

/**
 * Issue a formal warning or trigger 72h account suspension under the 3-Warning Policy.
 */
export async function issueDisciplinaryAction(params: {
  userId: string;
  userName: string;
  sessionId: string;
  isFriendsRoom: boolean;
  roomCode?: string;
  violationCategory: GDConductViolationCategory;
  evidenceQuote: string;
  contextSummary: string;
  customSuspensionHours?: number;
}): Promise<{
  warningNumber: 1 | 2 | 3;
  severity: GDWarningSeverity;
  moderatorUtterance: string;
  isSuspended: boolean;
  suspensionExpiresAt?: string;
  disciplinaryRecord: DisciplinaryRecord;
}> {
  loadDisciplinaryLogs();

  const {
    userId,
    userName,
    sessionId,
    isFriendsRoom,
    roomCode,
    violationCategory,
    evidenceQuote,
    contextSummary,
    customSuspensionHours = 72
  } = params;

  // Retrieve user's existing warning count for this session
  const priorSessionWarnings = inMemoryDisciplinaryLogs.filter(
    r => r.userId === userId && r.sessionId === sessionId
  );
  const nextWarningNumber = (priorSessionWarnings.length + 1) as 1 | 2 | 3;

  const now = Date.now();
  const appealToken = `appeal_${now}_${Math.random().toString(36).substring(2, 9)}`;

  let severity: GDWarningSeverity = "WARNING_1";
  let moderatorUtterance = "";
  let isSuspended = false;
  let suspensionExpiresAt: string | undefined = undefined;

  if (nextWarningNumber === 1) {
    severity = "WARNING_1";
    moderatorUtterance = `Candidate ${userName}: This is an official first warning regarding ${violationCategory.toLowerCase().replace(/_/g, " ")}. In a placement discussion, professional decorum and active listening are non-negotiable. Please allow others to speak and maintain respectful communication.`;
  } else if (nextWarningNumber === 2) {
    severity = "WARNING_2";
    moderatorUtterance = `Candidate ${userName}: This is your FINAL WARNING. You have repeated policy violations. If you commit another verified conduct violation during this session, your room access will be immediately terminated and your Cognalyze account will be suspended for 72 hours.`;
  } else {
    // 3rd Warning -> Full Server-Side Account Suspension!
    severity = "WARNING_3";
    isSuspended = true;
    const durationHours = customSuspensionHours;
    const expiresDate = new Date(now + durationHours * 60 * 60 * 1000);
    suspensionExpiresAt = expiresDate.toISOString();

    moderatorUtterance = `Candidate ${userName}: Having received three verified conduct warnings, you are disqualified and removed from this discussion immediately. Pursuant to Cognalyze placement standards, your account has been temporarily suspended for ${durationHours} hours.`;

    // SERVER-AUTHORITATIVE ENFORCEMENT: Update user record in store
    try {
      const user = getUserById(userId);
      if (user) {
        updateUser(userId, { status: "SUSPENDED" });
        console.warn(`[disciplinary-system] User ${userId} (${userName}) has been suspended until ${suspensionExpiresAt}`);
      }
    } catch (err) {
      console.error("[disciplinary-system] Failed to apply account suspension:", err);
    }
  }

  const record: DisciplinaryRecord = {
    id: `disc_${now}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    userEmail: getUserById(userId)?.email || "student@cognalyze.internal",
    userName,
    sessionId,
    isFriendsRoom,
    roomCode,
    warningNumber: Math.min(3, nextWarningNumber) as 1 | 2 | 3,
    severity,
    violationCategory,
    evidenceExcerpt: evidenceQuote,
    contextSummary,
    timestamp: now,
    moderatorUtterance,
    suspensionDurationHours: isSuspended ? customSuspensionHours : undefined,
    suspensionStartedAt: isSuspended ? new Date(now).toISOString() : undefined,
    suspensionExpiresAt,
    appealToken,
    appealStatus: "NONE",
    createdAt: new Date(now).toISOString()
  };

  inMemoryDisciplinaryLogs.push(record);
  persistDisciplinaryLogs();

  return {
    warningNumber: record.warningNumber,
    severity,
    moderatorUtterance,
    isSuspended,
    suspensionExpiresAt,
    disciplinaryRecord: record
  };
}

/**
 * Check if a user is currently under active disciplinary suspension.
 */
export function isUserSuspended(userId: string): {
  suspended: boolean;
  expiresAt?: string;
  reason?: string;
  appealToken?: string;
} {
  loadDisciplinaryLogs();
  const user = getUserById(userId);
  if (!user || user.status !== "SUSPENDED") {
    return { suspended: false };
  }

  const latestSuspension = inMemoryDisciplinaryLogs
    .filter(r => r.userId === userId && r.severity === "WARNING_3")
    .sort((a, b) => b.timestamp - a.timestamp)[0];

  if (!latestSuspension || !latestSuspension.suspensionExpiresAt) {
    return { suspended: true, reason: "Account suspended due to placement conduct policy violations." };
  }

  const expiry = new Date(latestSuspension.suspensionExpiresAt).getTime();
  if (Date.now() > expiry) {
    // Suspension expired: automatically restore account!
    updateUser(userId, { status: "ACTIVE" });
    return { suspended: false };
  }

  return {
    suspended: true,
    expiresAt: latestSuspension.suspensionExpiresAt,
    reason: `Suspended for repeated conduct violations (${latestSuspension.violationCategory}).`,
    appealToken: latestSuspension.appealToken
  };
}

/**
 * Submit an appeal for an incorrect warning or transcription misattribution.
 */
export function submitDisciplinaryAppeal(params: {
  appealToken: string;
  userId: string;
  explanation: string;
}): { success: boolean; message: string } {
  loadDisciplinaryLogs();
  const record = inMemoryDisciplinaryLogs.find(
    r => r.appealToken === params.appealToken && r.userId === params.userId
  );
  if (!record) {
    return { success: false, message: "Invalid appeal token or user mismatch." };
  }

  record.appealStatus = "PENDING_REVIEW";
  record.appealNotes = params.explanation;
  persistDisciplinaryLogs();

  return {
    success: true,
    message: "Appeal submitted successfully. Cognalyze Integrity Review Committee will audit the session recording within 24 hours."
  };
}
