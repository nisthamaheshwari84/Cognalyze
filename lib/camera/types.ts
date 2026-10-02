/**
 * COGNALYZE — UNIFIED CAMERA, PROCTORING & REAL INTERVIEW INTELLIGENCE ENGINE
 * Core Architecture & Normalized Observation Types
 * 
 * Truth Contract:
 * - Observable signals ONLY (framing, posture, lighting, movement, gaze, audio).
 * - ZERO inference of sensitive or psychological traits (no emotion, no personality,
 *   no honesty/attractiveness/mental health classification).
 * - Context-dependent interpretation (Interview vs Presentation vs Proctoring).
 */

export type CameraMode =
  | "interview"
  | "mock_interview"
  | "presentation"
  | "communication"
  | "proctoring"
  | "assessment";

export type CameraObservationType =
  | "face_presence"
  | "face_missing"
  | "multiple_people"
  | "phone_detected"
  | "person_left_frame"
  | "framing"
  | "lighting"
  | "camera_position"
  | "posture"
  | "camera_gaze"
  | "body_movement"
  | "voice_delivery"
  | "technical_quality"
  | "integrity_event"
  | "model_error"
  | "camera_disconnected";

export type ObservationSeverity = "info" | "low" | "medium" | "high" | "critical";

export type ProctoringState =
  | "CAMERA_READY"
  | "NO_PERSON"
  | "ONE_PERSON"
  | "MULTIPLE_PERSONS"
  | "PHONE_DETECTED"
  | "FACE_NOT_VISIBLE"
  | "PERSON_LEFT_FRAME"
  | "CAMERA_DISCONNECTED"
  | "MODEL_ERROR";

export type VisionModelStatus = "MODEL_LOADING" | "MODEL_READY" | "MODEL_ERROR" | "MODEL_FALLBACK";

export interface BoundingBox {
  x: number; // 0..1 normalized
  y: number; // 0..1 normalized
  width: number; // 0..1 normalized
  height: number; // 0..1 normalized
}

export interface NormalizedDetection {
  className: "person" | "cell phone" | "face" | "laptop" | "book" | string;
  confidence: number;
  boundingBox: BoundingBox;
  timestamp: number;
}

export interface ConfirmedProctoringEvent {
  id: string;
  eventType: ProctoringState;
  startTime: number;
  endTime?: number;
  durationSec: number;
  confidence: number;
  boundingBox?: BoundingBox;
  evidence: string;
  metadata?: Record<string, any>;
}

export interface CameraObservation {
  id: string;
  timestamp: number;
  timeFormatted: string; // e.g. "02:41"
  sessionId: string;
  mode: CameraMode;
  observationType: CameraObservationType;
  confidence: number; // 0.0 - 1.0 (actual model-derived confidence)
  duration?: number; // duration in seconds
  severity: ObservationSeverity;
  evidence: string; // purely factual observation
  interpretation?: string; // mode-specific meaning
  actionableTip?: string; // practical advice
  metadata?: Record<string, any>;
}

export interface CameraQualityMetrics {
  resolution: { width: number; height: number };
  fps: number;
  inferenceFps?: number;
  lastInferenceTime?: number;
  brightness: number; // 0 - 255
  contrast: number;
  lightingStatus: "good" | "too_dark" | "too_bright" | "backlit";
  faceDetected: boolean;
  faceCount: number;
  faceBox?: BoundingBox; // normalized 0..1
  personCount: number;
  peopleDetected: boolean;
  phoneDetected: boolean;
  phoneCount: number;
  lastPhoneConfidence?: number;
  detectedObjects?: NormalizedDetection[];
  detectedFaces?: NormalizedDetection[];
  visionModelStatus?: VisionModelStatus;
  proctoringState?: ProctoringState;
  framingStatus: "optimal" | "too_close" | "too_far" | "off_center" | "low_angle" | "high_angle";
  postureStatus: "upright" | "slouched" | "leaning_left" | "leaning_right" | "leaning_back";
  gazeStatus: "camera_facing" | "looking_away" | "looking_down" | "thinking_pause";
  movementLevel: "calm" | "moderate" | "excessive" | "face_touching";
  isFrozen: boolean;
  streamActive: boolean;
}

export interface CameraReadinessState {
  camera: boolean;
  microphone: boolean;
  videoStream: boolean;
  audioStream: boolean;
  resolutionOk: boolean;
  lightingOk: boolean;
  faceVisible: boolean;
  framingOk: boolean;
  cameraPositionOk: boolean;
  allReady: boolean;
  fallbackMode: "camera_and_voice" | "voice_only" | "camera_only" | "text_only";
  diagnosticMessages: string[];
}

export interface VoiceMetrics {
  speakingDurationSec: number;
  wordCount: number;
  wordsPerMinute: number;
  fillerWordsFound: string[];
  fillerWordCount: number;
  longPausesCount: number;
  averageVolume: number;
  clarityAssessment: string;
}

export interface CameraSessionReport {
  sessionId: string;
  mode: CameraMode;
  startTime: number;
  endTime: number;
  durationFormatted: string;
  readinessSummary: CameraReadinessState;
  timeline: CameraObservation[];
  proctoringSummary?: {
    cameraAvailability: "Stable" | "Intermittent" | "Disconnected";
    personPresenceSummary: string;
    multiplePersonEventsCount: number;
    multiplePersonTotalDurationSec: number;
    phoneEventsCount: number;
    phoneTotalDurationSec: number;
    noPersonEventsCount: number;
    noPersonTotalDurationSec: number;
    cameraDisconnectsCount: number;
    confirmedEvents: ConfirmedProctoringEvent[];
  };
  presentationPerformance: {
    cameraFraming: string;
    lightingQuality: string;
    postureObservations: string;
    cameraPresence: string;
    movementObservations: string;
    voiceDeliverySummary: string;
  };
  whatWorked: string[];
  whatNeedsImprovement: string[];
  specificEvidence: string[];
  nextPracticeDrills: string[];
}

export interface LearnerCameraMemory {
  studentId: string;
  totalSessions: number;
  repeatedHabits: {
    frequentFaceTouching: number;
    cameraAngleLow: number;
    gazeAwayExtended: number;
    slouchedPosture: number;
    fastPacedSpeech: number;
    longAnswers: number;
  };
  lastSessionDate: string;
  preSessionTips: string[];
}
