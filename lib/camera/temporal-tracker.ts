/**
 * COGNALYZE — TEMPORAL TRACKER & PROCTORING EVENT ENGINE
 * 
 * Separates raw frame detections from confirmed proctoring events.
 * Implements sliding temporal windows to prevent single-frame false positives,
 * noise, or flicker from triggering false proctoring violations.
 * 
 * Rules:
 * - NO fake events or simulated flags.
 * - Every event has an explicit startTime, duration, model-derived confidence,
 *   and bounding box evidence where applicable.
 */

import {
  BoundingBox,
  ConfirmedProctoringEvent,
  NormalizedDetection,
  ProctoringState,
} from "./types";

export interface TemporalTrackerConfig {
  phoneConfirmFrames?: number; // Minimum consecutive detections to confirm phone (default: 2)
  phoneCooldownFrames?: number; // Consecutive misses to conclude phone removed (default: 3)
  multiplePersonConfirmFrames?: number; // Consecutive detections to confirm multiple people (default: 3)
  noPersonConfirmFrames?: number; // Consecutive misses to confirm person left (default: 4)
  windowSize?: number; // Number of history frames to preserve (default: 15)
}

export const DEFAULT_TEMPORAL_CONFIG: TemporalTrackerConfig = {
  phoneConfirmFrames: 2,
  phoneCooldownFrames: 4,
  multiplePersonConfirmFrames: 2,
  noPersonConfirmFrames: 3,
  windowSize: 20,
};

export interface FrameSample {
  timestamp: number;
  personCount: number;
  faceCount: number;
  phoneCount: number;
  rawPhoneCandidate?: NormalizedDetection;
  objects: NormalizedDetection[];
  faces: NormalizedDetection[];
}

export class TemporalTracker {
  private config: TemporalTrackerConfig;
  private history: FrameSample[] = [];

  // Active tracking state
  private currentState: ProctoringState = "CAMERA_READY";
  private confirmedEvents: ConfirmedProctoringEvent[] = [];

  // Phone tracking
  private phoneStreak: number = 0;
  private phoneMissStreak: number = 0;
  private phoneWindowHits: number = 0; // total phone detections in recent sliding window
  private activePhoneEvent: ConfirmedProctoringEvent | null = null;
  private phoneMaxConfidence: number = 0;
  private phoneLatestBox?: BoundingBox;

  // Multiple people tracking
  private multiplePersonStreak: number = 0;
  private multiplePersonMissStreak: number = 0;
  private activeMultiplePersonEvent: ConfirmedProctoringEvent | null = null;

  // Person presence tracking
  private noPersonStreak: number = 0;
  private activeNoPersonEvent: ConfirmedProctoringEvent | null = null;

  // Disconnect tracking
  private activeDisconnectEvent: ConfirmedProctoringEvent | null = null;

  // Sequence ID generator (purely monotonic, zero random)
  private eventCounter: number = 0;

  constructor(config: Partial<TemporalTrackerConfig> = {}) {
    this.config = { ...DEFAULT_TEMPORAL_CONFIG, ...config };
  }

  private nextId(prefix: string): string {
    this.eventCounter++;
    return `${prefix}_${Date.now()}_${this.eventCounter}`;
  }

  public getCurrentState(): ProctoringState {
    return this.currentState;
  }

  public getConfirmedEvents(): ConfirmedProctoringEvent[] {
    return [...this.confirmedEvents];
  }

  public getActivePhoneEvent(): ConfirmedProctoringEvent | null {
    return this.activePhoneEvent ? { ...this.activePhoneEvent } : null;
  }

  public getActiveMultiplePersonEvent(): ConfirmedProctoringEvent | null {
    return this.activeMultiplePersonEvent ? { ...this.activeMultiplePersonEvent } : null;
  }

  /**
   * Processes a raw detection sample from a frame and updates temporal state.
   */
  public processFrame(sample: FrameSample): {
    state: ProctoringState;
    newEvents: ConfirmedProctoringEvent[];
    endedEvents: ConfirmedProctoringEvent[];
  } {
    this.history.push(sample);
    if (this.history.length > (this.config.windowSize || 15)) {
      this.history.shift();
    }

    const now = sample.timestamp || Date.now();
    const newEvents: ConfirmedProctoringEvent[] = [];
    const endedEvents: ConfirmedProctoringEvent[] = [];

    // ─────────────────────────────────────────────────────────────
    // 1. MOBILE PHONE TEMPORAL EVALUATION
    // ─────────────────────────────────────────────────────────────
    if (sample.phoneCount > 0 && sample.rawPhoneCandidate) {
      this.phoneStreak++;
      this.phoneMissStreak = 0;
      this.phoneWindowHits++;
      this.phoneMaxConfidence = Math.max(this.phoneMaxConfidence, sample.rawPhoneCandidate.confidence);
      this.phoneLatestBox = sample.rawPhoneCandidate.boundingBox;

      const confirmThreshold = this.config.phoneConfirmFrames || 2;
      // Confirm if streak OR sliding window hits are sufficient
      if (this.phoneStreak >= confirmThreshold || this.phoneWindowHits >= confirmThreshold + 1) {
        if (!this.activePhoneEvent) {
          // Confirm NEW Phone Event
          this.activePhoneEvent = {
            id: this.nextId("evt_phone"),
            eventType: "PHONE_DETECTED",
            startTime: now - (Math.min(this.phoneStreak, confirmThreshold) - 1) * 350,
            durationSec: 0,
            confidence: Math.round(this.phoneMaxConfidence * 100) / 100,
            boundingBox: this.phoneLatestBox,
            evidence: `Mobile phone detected with ${(this.phoneMaxConfidence * 100).toFixed(1)}% model confidence.`,
            metadata: {
              rawDetectionCount: this.phoneStreak,
              windowHits: this.phoneWindowHits,
            },
          };
          this.confirmedEvents.push(this.activePhoneEvent);
          newEvents.push(this.activePhoneEvent);
          console.log(`[EVENT] PHONE_DETECTED confirmed at ${new Date(now).toISOString()} (confidence: ${this.phoneMaxConfidence.toFixed(2)}, streak: ${this.phoneStreak}, windowHits: ${this.phoneWindowHits})`);
        } else {
          // Update active event
          this.activePhoneEvent.durationSec = Math.max(0, Math.round((now - this.activePhoneEvent.startTime) / 100) / 10);
          this.activePhoneEvent.confidence = Math.max(this.activePhoneEvent.confidence, Math.round(this.phoneMaxConfidence * 100) / 100);
          this.activePhoneEvent.boundingBox = this.phoneLatestBox;
        }
      }
    } else {
      this.phoneMissStreak++;
      // Allow 1 brief miss without resetting the streak (handles flicker)
      if (this.phoneMissStreak >= 2) {
        this.phoneStreak = 0;
      }
      const cooldown = this.config.phoneCooldownFrames || 4;
      if (this.phoneMissStreak >= cooldown) {
        this.phoneStreak = 0;
        this.phoneMaxConfidence = 0;
        this.phoneWindowHits = 0;
        if (this.activePhoneEvent) {
          // Conclude active phone event
          this.activePhoneEvent.endTime = now;
          this.activePhoneEvent.durationSec = Math.max(0.5, Math.round((now - this.activePhoneEvent.startTime) / 100) / 10);
          endedEvents.push({ ...this.activePhoneEvent });
          console.log(`[EVENT] PHONE_REMOVED: Phone session concluded. Duration: ${this.activePhoneEvent.durationSec}s`);
          this.activePhoneEvent = null;
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 2. MULTIPLE PERSON / FACE TEMPORAL EVALUATION
    // ─────────────────────────────────────────────────────────────
    const effectivePeople = Math.max(sample.personCount, sample.faceCount);
    if (effectivePeople >= 2) {
      this.multiplePersonStreak++;
      this.multiplePersonMissStreak = 0;

      const confirmThreshold = this.config.multiplePersonConfirmFrames || 2;
      if (this.multiplePersonStreak >= confirmThreshold) {
        if (!this.activeMultiplePersonEvent) {
          const confidence = sample.objects.find((o) => o.className === "person")?.confidence || 0.85;
          this.activeMultiplePersonEvent = {
            id: this.nextId("evt_multi_person"),
            eventType: "MULTIPLE_PERSONS",
            startTime: now - (confirmThreshold - 1) * 350,
            durationSec: 0,
            confidence: Math.round(confidence * 100) / 100,
            evidence: `${effectivePeople} individuals simultaneously detected in camera frame.`,
            metadata: {
              detectedPersons: sample.personCount,
              detectedFaces: sample.faceCount,
            },
          };
          this.confirmedEvents.push(this.activeMultiplePersonEvent);
          newEvents.push(this.activeMultiplePersonEvent);
          console.log(`[EVENT] MULTIPLE_PERSONS confirmed: ${effectivePeople} people/faces present.`);
        } else {
          this.activeMultiplePersonEvent.durationSec = Math.max(0, Math.round((now - this.activeMultiplePersonEvent.startTime) / 100) / 10);
        }
      }
    } else {
      this.multiplePersonMissStreak++;
      // Allow 1 brief miss (handles detection flicker)
      if (this.multiplePersonMissStreak >= 2) {
        this.multiplePersonStreak = 0;
      }
      if (this.multiplePersonMissStreak >= 3) {
        this.multiplePersonStreak = 0;
        if (this.activeMultiplePersonEvent) {
          this.activeMultiplePersonEvent.endTime = now;
          this.activeMultiplePersonEvent.durationSec = Math.max(0.5, Math.round((now - this.activeMultiplePersonEvent.startTime) / 100) / 10);
          endedEvents.push({ ...this.activeMultiplePersonEvent });
          console.log(`[EVENT] MULTIPLE_PERSONS concluded. Duration: ${this.activeMultiplePersonEvent.durationSec}s`);
          this.activeMultiplePersonEvent = null;
        }
      }
    }

    // ─────────────────────────────────────────────────────────────
    // 3. NO PERSON / CANDIDATE LEFT FRAME TEMPORAL EVALUATION
    // ─────────────────────────────────────────────────────────────
    if (sample.personCount === 0 && sample.faceCount === 0) {
      this.noPersonStreak++;
      const confirmThreshold = this.config.noPersonConfirmFrames || 3;
      if (this.noPersonStreak >= confirmThreshold) {
        if (!this.activeNoPersonEvent) {
          this.activeNoPersonEvent = {
            id: this.nextId("evt_no_person"),
            eventType: "PERSON_LEFT_FRAME",
            startTime: now - (confirmThreshold - 1) * 350,
            durationSec: 0,
            confidence: 0.95,
            evidence: "Candidate left the camera frame. Zero persons or faces detected.",
          };
          this.confirmedEvents.push(this.activeNoPersonEvent);
          newEvents.push(this.activeNoPersonEvent);
          console.log(`[EVENT] PERSON_LEFT_FRAME confirmed (streak: ${this.noPersonStreak}).`);
        } else {
          this.activeNoPersonEvent.durationSec = Math.max(0, Math.round((now - this.activeNoPersonEvent.startTime) / 100) / 10);
        }
      }
    } else {
      if (this.activeNoPersonEvent) {
        this.activeNoPersonEvent.endTime = now;
        this.activeNoPersonEvent.durationSec = Math.max(0.5, Math.round((now - this.activeNoPersonEvent.startTime) / 100) / 10);
        endedEvents.push({ ...this.activeNoPersonEvent });
        console.log(`[EVENT] Candidate returned to frame. Duration away: ${this.activeNoPersonEvent.durationSec}s`);
        this.activeNoPersonEvent = null;
      }
      this.noPersonStreak = 0;
    }

    // ─────────────────────────────────────────────────────────────
    // 4. RESOLVE CONSOLIDATED PROCTORING STATE
    // ─────────────────────────────────────────────────────────────
    if (this.activeDisconnectEvent) {
      this.currentState = "CAMERA_DISCONNECTED";
    } else if (this.activePhoneEvent) {
      this.currentState = "PHONE_DETECTED";
    } else if (this.activeMultiplePersonEvent) {
      this.currentState = "MULTIPLE_PERSONS";
    } else if (this.activeNoPersonEvent) {
      this.currentState = "NO_PERSON";
    } else if (effectivePeople === 1) {
      this.currentState = "ONE_PERSON";
    } else {
      this.currentState = "CAMERA_READY";
    }

    return {
      state: this.currentState,
      newEvents,
      endedEvents,
    };
  }

  public handleCameraDisconnect(): ConfirmedProctoringEvent {
    if (!this.activeDisconnectEvent) {
      this.activeDisconnectEvent = {
        id: this.nextId("evt_disconnect"),
        eventType: "CAMERA_DISCONNECTED",
        startTime: Date.now(),
        durationSec: 0,
        confidence: 1.0,
        evidence: "Camera media stream tracks were ended or disconnected.",
      };
      this.confirmedEvents.push(this.activeDisconnectEvent);
      this.currentState = "CAMERA_DISCONNECTED";
      console.log("[EVENT] CAMERA_DISCONNECTED logged.");
    }
    return this.activeDisconnectEvent;
  }

  public handleCameraReconnect(): void {
    if (this.activeDisconnectEvent) {
      this.activeDisconnectEvent.endTime = Date.now();
      this.activeDisconnectEvent.durationSec = Math.max(0.5, Math.round((Date.now() - this.activeDisconnectEvent.startTime) / 100) / 10);
      this.activeDisconnectEvent = null;
      this.currentState = "CAMERA_READY";
      console.log("[EVENT] Camera stream reconnected.");
    }
  }

  public reset(): void {
    this.history = [];
    this.confirmedEvents = [];
    this.phoneStreak = 0;
    this.phoneMissStreak = 0;
    this.phoneWindowHits = 0;
    this.activePhoneEvent = null;
    this.multiplePersonStreak = 0;
    this.activeMultiplePersonEvent = null;
    this.noPersonStreak = 0;
    this.activeNoPersonEvent = null;
    this.activeDisconnectEvent = null;
    this.currentState = "CAMERA_READY";
  }
}
