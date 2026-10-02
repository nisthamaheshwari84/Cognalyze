/**
 * COGNALYZE — CAMERA & INTERVIEW SESSION REPORT ENGINE
 * 
 * Compiles timestamped visual observations, voice delivery metrics,
 * and technical interview milestones into an actionable session debrief.
 * 
 * Rules:
 * - NO fake personality scores (e.g. no "Confidence: 92%").
 * - Specific evidence and timestamps for every critique.
 * - Actionable drills for the next practice session.
 */

import {
  CameraMode,
  CameraObservation,
  CameraReadinessState,
  CameraSessionReport,
  VoiceMetrics,
} from "./types";

export function generateCameraSessionReport(params: {
  sessionId: string;
  mode: CameraMode;
  startTime: number;
  endTime: number;
  readiness: CameraReadinessState;
  timeline: CameraObservation[];
  voiceMetrics?: VoiceMetrics;
  interviewNotes?: {
    topicsCovered?: string[];
    strongestAnswer?: string;
    gapAnswers?: string[];
  };
}): CameraSessionReport {
  const {
    sessionId,
    mode,
    startTime,
    endTime,
    readiness,
    timeline,
    voiceMetrics,
    interviewNotes,
  } = params;

  const totalSec = Math.max(1, Math.round((endTime - startTime) / 1000));
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  const durationFormatted = `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;

  // Categorize observations
  const framingObs = timeline.filter((o) => o.observationType === "framing" || o.observationType === "camera_position");
  const lightingObs = timeline.filter((o) => o.observationType === "lighting");
  const postureObs = timeline.filter((o) => o.observationType === "posture");
  const gazeObs = timeline.filter((o) => o.observationType === "camera_gaze" && o.severity !== "info");
  const movementObs = timeline.filter((o) => o.observationType === "body_movement");
  const phoneObs = timeline.filter((o) => o.observationType === "phone_detected");
  const multiplePeopleObs = timeline.filter((o) => o.observationType === "multiple_people");
  const noPersonObs = timeline.filter((o) => o.observationType === "person_left_frame" || o.observationType === "face_missing");
  const disconnectObs = timeline.filter((o) => o.observationType === "camera_disconnected");
  const integrityObs = timeline.filter((o) => o.observationType === "integrity_event" || o.observationType === "multiple_people" || o.observationType === "face_missing" || o.observationType === "phone_detected");

  // Proctoring Summary
  const multiplePersonTotalDuration = multiplePeopleObs.reduce((acc, o) => acc + (o.duration || 3), 0);
  const phoneTotalDuration = phoneObs.reduce((acc, o) => acc + (o.duration || 3), 0);
  const noPersonTotalDuration = noPersonObs.reduce((acc, o) => acc + (o.duration || 3), 0);

  const proctoringSummary: CameraSessionReport["proctoringSummary"] = {
    cameraAvailability: disconnectObs.length === 0 ? "Stable" : disconnectObs.length <= 2 ? "Intermittent" : "Disconnected",
    personPresenceSummary: noPersonObs.length === 0 ? "1 primary person detected consistently" : `${noPersonObs.length} interruption(s) in person presence`,
    multiplePersonEventsCount: multiplePeopleObs.length,
    multiplePersonTotalDurationSec: multiplePersonTotalDuration,
    phoneEventsCount: phoneObs.length,
    phoneTotalDurationSec: phoneTotalDuration,
    noPersonEventsCount: noPersonObs.length,
    noPersonTotalDurationSec: noPersonTotalDuration,
    cameraDisconnectsCount: disconnectObs.length,
    confirmedEvents: [],
  };

  // Build presentation performance narratives
  const cameraFraming = framingObs.length === 0
    ? "Stable eye-level framing maintained with upper body centered throughout."
    : framingObs.map((o) => `[${o.timeFormatted}] ${o.evidence}`).join(". ");

  const lightingQuality = lightingObs.length === 0
    ? "Even frontal lighting with balanced facial contrast and no harsh backlighting."
    : lightingObs.map((o) => `[${o.timeFormatted}] ${o.evidence}`).join(". ");

  const postureObservations = postureObs.length === 0
    ? "Consistent upright posture with stable centering in the frame."
    : postureObs.map((o) => `[${o.timeFormatted}] ${o.evidence}`).join(". ");

  const cameraPresence = gazeObs.length === 0
    ? "Consistent camera-facing engagement with natural thinking pauses during solution structuring."
    : `${gazeObs.length} extended gaze shift(s) observed: ${gazeObs.map((o) => `at ${o.timeFormatted} (${o.evidence})`).join(", ")}.`;

  const movementObservations = movementObs.length === 0
    ? "Composed physical delivery with controlled hand gestures."
    : movementObs.map((o) => `[${o.timeFormatted}] ${o.evidence}`).join(". ");

  const voiceDeliverySummary = voiceMetrics
    ? `${voiceMetrics.wordsPerMinute} WPM delivery across ${voiceMetrics.wordCount} words. ${voiceMetrics.fillerWordCount} filler word(s) detected. ${voiceMetrics.clarityAssessment}`
    : "Vocal delivery remained synchronized with video feed.";

  // What Worked
  const whatWorked: string[] = [];
  if (readiness.faceVisible && readiness.framingOk) {
    whatWorked.push("Initial camera setup and eye-level framing met professional video interview standards.");
  }
  if (gazeObs.length <= 1) {
    whatWorked.push("Maintained direct camera presence during crucial conclusion and architecture delivery moments.");
  }
  if (movementObs.length <= 1) {
    whatWorked.push("Controlled body language with minimal distracting movements or face-touching.");
  }
  if (voiceMetrics && voiceMetrics.wordsPerMinute >= 120 && voiceMetrics.wordsPerMinute <= 165) {
    whatWorked.push(`Well-cadenced speaking rate of ${voiceMetrics.wordsPerMinute} WPM provided clear technical transmission.`);
  }
  if (interviewNotes?.strongestAnswer) {
    whatWorked.push(`Strongest answer delivered on "${interviewNotes.strongestAnswer.slice(0, 80)}..."`);
  }
  if (whatWorked.length === 0) {
    whatWorked.push("Completed full interactive session with persistent video connection.");
  }

  // What Needs Improvement
  const whatNeedsImprovement: string[] = [];
  if (gazeObs.length > 2) {
    whatNeedsImprovement.push(`Gaze diverted away from camera for ${gazeObs.length} extended intervals. Practice speaking directly to the camera lens.`);
  }
  if (movementObs.length >= 2) {
    whatNeedsImprovement.push("Repeated hand gestures near the face or microphone occurred during technical explanations.");
  }
  if (voiceMetrics && voiceMetrics.fillerWordCount >= 4) {
    whatNeedsImprovement.push(`Used ${voiceMetrics.fillerWordCount} filler words (${voiceMetrics.fillerWordsFound.slice(0, 2).join(", ")}). Replace filler vocalizations with silent 1-second pauses.`);
  }
  if (voiceMetrics && voiceMetrics.speakingDurationSec > 150) {
    whatNeedsImprovement.push("Answer length exceeded the 90-second sweet spot. Condense background setup to focus on architectural trade-offs.");
  }
  if (integrityObs.length > 0 && (mode === "proctoring" || mode === "assessment")) {
    whatNeedsImprovement.push(`${integrityObs.length} integrity event(s) logged (e.g. window blur or framing shift). Keep assessment interface continuously focused.`);
  }
  if (whatNeedsImprovement.length === 0) {
    whatNeedsImprovement.push("Continue practicing under timed constraints to maintain this level of composure under pressure.");
  }

  // Specific Evidence
  const specificEvidence: string[] = [];
  for (const obs of timeline.slice(0, 8)) {
    specificEvidence.push(`${obs.timeFormatted} — [${obs.observationType.toUpperCase()}]: ${obs.evidence}`);
  }
  if (voiceMetrics) {
    specificEvidence.push(`Vocal Pacing — ${voiceMetrics.wordCount} words spoken over ${voiceMetrics.speakingDurationSec}s (${voiceMetrics.wordsPerMinute} WPM).`);
  }

  // Next Practice Drills
  const nextPracticeDrills: string[] = [];
  if (voiceMetrics && voiceMetrics.speakingDurationSec > 120) {
    nextPracticeDrills.push("Drill 1: 60-Second Architecture Defense — Practice answering complex system design questions in strictly under 90 seconds.");
  } else {
    nextPracticeDrills.push("Drill 1: Deep Project Defense — Practice articulating failure scenarios and database scaling trade-offs.");
  }

  if (gazeObs.length > 1) {
    nextPracticeDrills.push("Drill 2: Lens Focus Drill — Position a sticky note near your camera lens to anchor eye contact during summary statements.");
  } else {
    nextPracticeDrills.push("Drill 2: Live Code Communication — Practice articulating algorithmic complexity out loud while writing syntax.");
  }

  return {
    sessionId,
    mode,
    startTime,
    endTime,
    durationFormatted,
    readinessSummary: readiness,
    timeline,
    proctoringSummary,
    presentationPerformance: {
      cameraFraming,
      lightingQuality,
      postureObservations,
      cameraPresence,
      movementObservations,
      voiceDeliverySummary,
    },
    whatWorked,
    whatNeedsImprovement,
    specificEvidence,
    nextPracticeDrills,
  };
}
