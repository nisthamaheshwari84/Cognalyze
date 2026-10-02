/**
 * COGNALYZE — ADAPTIVE LEARNER CAMERA & DELIVERY MEMORY
 * 
 * Persists observable candidate presentation habits across sessions:
 * - Camera framing tendencies
 * - Pacing & answer duration patterns
 * - Gaze and posture patterns
 * 
 * Injects personalized pre-session reminders to drive measurable improvement:
 * OBSERVE → REMEMBER → PRACTICE → RETEST → IMPROVE
 */

import { LearnerCameraMemory, CameraObservation } from "./types";

const LEARNER_MEMORY_KEY = "cognalyze_camera_learner_memory";

const DEFAULT_MEMORY: LearnerCameraMemory = {
  studentId: "student-active",
  totalSessions: 0,
  repeatedHabits: {
    frequentFaceTouching: 0,
    cameraAngleLow: 0,
    gazeAwayExtended: 0,
    slouchedPosture: 0,
    fastPacedSpeech: 0,
    longAnswers: 0,
  },
  lastSessionDate: new Date().toISOString(),
  preSessionTips: [
    "Position your camera approximately eye level with head and shoulders centered.",
    "Ensure balanced frontal lighting so your face is clearly visible without strong backlight.",
  ],
};

export function getLearnerCameraMemory(studentId = "student-active"): LearnerCameraMemory {
  if (typeof window === "undefined") return { ...DEFAULT_MEMORY, studentId };
  try {
    const raw = localStorage.getItem(`${LEARNER_MEMORY_KEY}_${studentId}`);
    if (!raw) return { ...DEFAULT_MEMORY, studentId };
    return JSON.parse(raw);
  } catch {
    return { ...DEFAULT_MEMORY, studentId };
  }
}

export function updateLearnerCameraMemory(
  studentId: string,
  observations: CameraObservation[],
  voiceMetrics?: { wordsPerMinute?: number; speakingDurationSec?: number }
): LearnerCameraMemory {
  const current = getLearnerCameraMemory(studentId);

  let faceTouchingCount = 0;
  let angleLowCount = 0;
  let gazeAwayCount = 0;
  let slouchCount = 0;

  for (const obs of observations) {
    if (obs.observationType === "body_movement" && obs.evidence.toLowerCase().includes("face")) {
      faceTouchingCount++;
    }
    if (obs.observationType === "camera_position" || (obs.observationType === "framing" && obs.evidence.toLowerCase().includes("low"))) {
      angleLowCount++;
    }
    if (obs.observationType === "camera_gaze" && obs.severity !== "info") {
      gazeAwayCount++;
    }
    if (obs.observationType === "posture" && obs.evidence.toLowerCase().includes("slouch")) {
      slouchCount++;
    }
  }

  const isFastPaced = (voiceMetrics?.wordsPerMinute || 0) > 175 ? 1 : 0;
  const isLongAnswer = (voiceMetrics?.speakingDurationSec || 0) > 150 ? 1 : 0;

  const updated: LearnerCameraMemory = {
    studentId,
    totalSessions: current.totalSessions + 1,
    repeatedHabits: {
      frequentFaceTouching: current.repeatedHabits.frequentFaceTouching + (faceTouchingCount > 2 ? 1 : 0),
      cameraAngleLow: current.repeatedHabits.cameraAngleLow + (angleLowCount > 0 ? 1 : 0),
      gazeAwayExtended: current.repeatedHabits.gazeAwayExtended + (gazeAwayCount > 1 ? 1 : 0),
      slouchedPosture: current.repeatedHabits.slouchedPosture + (slouchCount > 1 ? 1 : 0),
      fastPacedSpeech: current.repeatedHabits.fastPacedSpeech + isFastPaced,
      longAnswers: current.repeatedHabits.longAnswers + isLongAnswer,
    },
    lastSessionDate: new Date().toISOString(),
    preSessionTips: [],
  };

  // Compile tailored pre-session tips for future sessions
  const tips: string[] = [];
  if (updated.repeatedHabits.cameraAngleLow >= 1) {
    tips.push("Camera Tip: In your previous session, the camera was slightly below eye level. Raise your laptop on a stand or books.");
  }
  if (updated.repeatedHabits.gazeAwayExtended >= 1) {
    tips.push("Engagement Tip: Maintain camera-facing gaze when delivering your final conclusion.");
  }
  if (updated.repeatedHabits.frequentFaceTouching >= 1) {
    tips.push("Presence Tip: Rest hands comfortably on the desk between hand gestures to project composure.");
  }
  if (updated.repeatedHabits.longAnswers >= 1) {
    tips.push("Pacing Tip: Target 60–90 seconds per technical answer. State the core architecture before diving into edge cases.");
  }

  if (tips.length === 0) {
    tips.push("Ready: Your camera framing and presentation setup demonstrated solid composure in recent sessions.");
  }

  updated.preSessionTips = tips;

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(`${LEARNER_MEMORY_KEY}_${studentId}`, JSON.stringify(updated));
    } catch {}
  }

  return updated;
}
