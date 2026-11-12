/**
 * Proctoring & Integrity Event Service
 *
 * Implements authoritative event modeling, 1-paste=1-event deduplication,
 * keystroke-only WPM calculation (< 250 WPM ceiling), explicit AI-text heuristics,
 * and single-source derived counters.
 */

export type IntegrityEventType =
  | "PASTE"
  | "TAB_SWITCH"
  | "WINDOW_BLUR"
  | "FACE_LOST"
  | "MULTIPLE_FACES"
  | "HIGH_WPM_ANOMALY"
  | "AI_TEXT_HEURISTIC";

export interface IntegrityEvent {
  id: string;
  type: IntegrityEventType;
  timestamp: number;
  severity: "low" | "medium" | "high";
  description: string;
  metadata?: Record<string, any>;
}

export interface IntegrityCounters {
  pastes: number;
  tabSwitches: number;
  aiFlags: number;
  faceLost: number;
  multipleFaces: number;
  totalViolations: number;
  passportIntegrityScore: number;
}

// ══════════════════════════════════════════════════════════════
// 1. PASSPORT INTEGRITY SCORE CALCULATION
// ══════════════════════════════════════════════════════════════

/**
 * Authoritative Passport Integrity Score Formula:
 * Base: 100
 * - Pastes: -5 pts each
 * - Tab Switches / Window Blur: -8 pts each
 * - AI Text Flags: -20 pts each
 * - Face Lost (>10s): -4 pts each
 * - Multiple Faces: -10 pts each
 * Minimum bound: 0
 */
export function calculatePassportIntegrityScore(events: IntegrityEvent[]): number {
  let score = 100;
  for (const ev of events) {
    switch (ev.type) {
      case "PASTE":
        score -= 5;
        break;
      case "TAB_SWITCH":
      case "WINDOW_BLUR":
        score -= 8;
        break;
      case "AI_TEXT_HEURISTIC":
        score -= 20;
        break;
      case "FACE_LOST":
        score -= 4;
        break;
      case "MULTIPLE_FACES":
        score -= 10;
        break;
      case "HIGH_WPM_ANOMALY":
        score -= 15;
        break;
    }
  }
  return Math.max(0, Math.min(100, score));
}

// ══════════════════════════════════════════════════════════════
// 2. SINGLE-SOURCE DERIVED COUNTERS
// ══════════════════════════════════════════════════════════════

export function deriveIntegrityCounters(events: IntegrityEvent[]): IntegrityCounters {
  let pastes = 0;
  let tabSwitches = 0;
  let aiFlags = 0;
  let faceLost = 0;
  let multipleFaces = 0;

  for (const ev of events) {
    if (ev.type === "PASTE") pastes++;
    else if (ev.type === "TAB_SWITCH" || ev.type === "WINDOW_BLUR") tabSwitches++;
    else if (ev.type === "AI_TEXT_HEURISTIC" || ev.type === "HIGH_WPM_ANOMALY") aiFlags++;
    else if (ev.type === "FACE_LOST") faceLost++;
    else if (ev.type === "MULTIPLE_FACES") multipleFaces++;
  }

  const passportIntegrityScore = calculatePassportIntegrityScore(events);

  return {
    pastes,
    tabSwitches,
    aiFlags,
    faceLost,
    multipleFaces,
    totalViolations: events.length,
    passportIntegrityScore,
  };
}

// ══════════════════════════════════════════════════════════════
// 3. KEYSTROKE-ONLY WPM CALCULATION (Capped < 250 WPM)
// ══════════════════════════════════════════════════════════════

export interface KeystrokeTracker {
  keystrokeCount: number;
  startTime: number | null;
  lastKeystrokeTime: number | null;
}

export function createKeystrokeTracker(): KeystrokeTracker {
  return {
    keystrokeCount: 0,
    startTime: null,
    lastKeystrokeTime: null,
  };
}

export function recordPhysicalKeystroke(
  tracker: KeystrokeTracker,
  key: string
): KeystrokeTracker {
  // Only count printable characters, space, backspace
  if (key.length > 1 && key !== "Backspace" && key !== "Enter" && key !== "Space") {
    return tracker;
  }

  const now = Date.now();
  const startTime = tracker.startTime ?? now;

  return {
    keystrokeCount: tracker.keystrokeCount + 1,
    startTime,
    lastKeystrokeTime: now,
  };
}

export function calculateKeystrokeWpm(tracker: KeystrokeTracker): number {
  if (!tracker.startTime || tracker.keystrokeCount < 5) return 0;

  const durationMinutes = (Date.now() - tracker.startTime) / 60000;
  if (durationMinutes <= 0.01) return 0;

  // Standard metric: 5 keystrokes = 1 word
  const rawWpm = Math.round(tracker.keystrokeCount / 5 / durationMinutes);

  // Ceil at 250 WPM (world record typing speed)
  return Math.min(250, rawWpm);
}

// ══════════════════════════════════════════════════════════════
// 4. EVENT DEDUPLICATION & DISPATCH
// ══════════════════════════════════════════════════════════════

export class IntegrityEventEngine {
  private events: IntegrityEvent[] = [];
  private lastEventTimestamps: Record<string, number> = {};

  constructor(initialEvents: IntegrityEvent[] = []) {
    this.events = [...initialEvents];
  }

  public addEvent(
    type: IntegrityEventType,
    description: string,
    severity: "low" | "medium" | "high" = "medium",
    metadata?: Record<string, any>
  ): IntegrityEvent | null {
    const now = Date.now();
    const lastTime = this.lastEventTimestamps[type] || 0;

    // Strict 400ms debounce to prevent dual keydown + onPaste or dual blur + visibilitychange firing
    if (now - lastTime < 400) {
      return null;
    }

    this.lastEventTimestamps[type] = now;

    const event: IntegrityEvent = {
      id: `ev_${type.toLowerCase()}_${now}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      timestamp: now,
      severity,
      description,
      metadata,
    };

    this.events.push(event);
    return event;
  }

  public getEvents(): IntegrityEvent[] {
    return [...this.events];
  }

  public getCounters(): IntegrityCounters {
    return deriveIntegrityCounters(this.events);
  }

  public clear(): void {
    this.events = [];
    this.lastEventTimestamps = {};
  }
}

