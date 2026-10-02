/**
 * COGNALYZE — MODE-SPECIFIC CAMERA INTERPRETATION ENGINE
 * 
 * Maps normalized visual observations into mode-specific interpretations:
 * - INTERVIEW MODE: Professional camera presence, framing, posture, answer delivery.
 * - PRESENTATION MODE: Audience engagement, camera interaction, delivery pacing.
 * - PROCTORING MODE: Assessment integrity, presence verification, room compliance.
 * - COMMUNICATION MODE: Speaking rhythm, body language, articulation.
 * 
 * Strict Guideline:
 * - NO assumptions about internal psychological states ("lying", "anxious", "nervous").
 * - Factual, evidence-based descriptions only.
 */

import { CameraMode, CameraObservationType, ObservationSeverity } from "./types";

export interface ModeInterpretation {
  interpretation: string;
  actionableTip: string;
  severity: ObservationSeverity;
}

export function interpretObservation(
  observationType: CameraObservationType,
  mode: CameraMode,
  context?: {
    isAnswering?: boolean;
    durationSec?: number;
    count?: number;
  }
): ModeInterpretation {
  const isAnswering = context?.isAnswering ?? false;
  const durationSec = context?.durationSec ?? 0;
  const count = context?.count ?? 1;

  switch (observationType) {
    case "camera_gaze":
      if (mode === "proctoring" || mode === "assessment") {
        return {
          interpretation: `Gaze oriented away from assessment interface for ${durationSec > 0 ? `~${Math.round(durationSec)}s` : "extended duration"}.`,
          actionableTip: "Please keep your gaze centered on the assessment questions.",
          severity: durationSec > 6 ? "medium" : "low",
        };
      }
      if (mode === "presentation") {
        return {
          interpretation: "Gaze diverted away from primary audience / camera position.",
          actionableTip: "Aim to deliver key takeaway statements directly toward the camera lens.",
          severity: "low",
        };
      }
      // Interview or Communication mode
      if (isAnswering && durationSec > 5) {
        return {
          interpretation: "Camera-facing gaze decreased during the main portion of your explanation.",
          actionableTip: "When articulating your main conclusion, direct your gaze toward the upper third of the screen to convey focused delivery.",
          severity: "low",
        };
      }
      return {
        interpretation: "Brief gaze shift observed (natural thinking pause).",
        actionableTip: "Briefly glancing away to structure your thoughts is natural.",
        severity: "info",
      };

    case "face_missing":
      if (mode === "proctoring" || mode === "assessment") {
        return {
          interpretation: `Candidate left camera frame for ${durationSec > 0 ? `approximately ${Math.round(durationSec)} seconds` : "a brief period"}.`,
          actionableTip: "Remain seated and clearly visible within the camera frame throughout the session.",
          severity: durationSec > 5 ? "high" : "medium",
        };
      }
      return {
        interpretation: "Face temporarily moved outside camera boundaries.",
        actionableTip: "Adjust your seating position so your face remains consistently in the frame.",
        severity: "medium",
      };

    case "multiple_people":
      if (mode === "proctoring" || mode === "assessment") {
        return {
          interpretation: "Multiple individuals detected in the assessment camera frame.",
          actionableTip: "Ensure you are alone in a quiet, private room during formal assessments.",
          severity: "high",
        };
      }
      return {
        interpretation: "Another person was visible in the camera frame.",
        actionableTip: "For formal interviews, choose a quiet private space to avoid background distractions.",
        severity: "low",
      };

    case "phone_detected":
      if (mode === "proctoring" || mode === "assessment") {
        return {
          interpretation: `Mobile phone candidate detected in camera frame${durationSec > 0 ? ` for ~${Math.round(durationSec)}s` : ""}.`,
          actionableTip: "Please remove mobile phones and auxiliary electronic devices from your workspace.",
          severity: "critical",
        };
      }
      return {
        interpretation: "Mobile phone visible in camera frame during interview.",
        actionableTip: "Keep mobile devices out of view to maintain undivided interview engagement.",
        severity: "medium",
      };

    case "person_left_frame":
      if (mode === "proctoring" || mode === "assessment") {
        return {
          interpretation: `Candidate left camera frame${durationSec > 0 ? ` for ~${Math.round(durationSec)}s` : ""}.`,
          actionableTip: "Please return to your seat and remain clearly in the camera frame.",
          severity: "high",
        };
      }
      return {
        interpretation: "Candidate moved outside camera boundaries.",
        actionableTip: "Ensure you remain positioned directly in front of the camera.",
        severity: "medium",
      };

    case "camera_disconnected":
      return {
        interpretation: "Camera video stream was disconnected or interrupted.",
        actionableTip: "Check your camera connection and ensure browser camera permissions remain active.",
        severity: "critical",
      };

    case "model_error":
      return {
        interpretation: "Visual detection pipeline encountered an inference initialization error.",
        actionableTip: "Ensure WebAssembly and WebGL are enabled in your browser settings.",
        severity: "medium",
      };

    case "framing":
      return {
        interpretation: "Camera framing differs from recommended eye-level upper-body framing.",
        actionableTip: "Position your camera approximately at eye level with your head and shoulders comfortably centered.",
        severity: "low",
      };

    case "lighting":
      return {
        interpretation: "Lighting conditions may cause facial features to be underexposed or cast strong shadows.",
        actionableTip: "Position a gentle light source in front of you and avoid sitting directly in front of bright windows.",
        severity: "low",
      };

    case "camera_position":
      return {
        interpretation: "Camera is positioned at an upward or downward tilt angle.",
        actionableTip: "Raise your laptop or camera so the lens sits close to natural eye height.",
        severity: "low",
      };

    case "posture":
      return {
        interpretation: "Repeated leaning or slouching away from the central frame was observed.",
        actionableTip: "Maintain an upright, comfortable posture with both feet flat on the floor.",
        severity: "low",
      };

    case "body_movement":
      if (count > 2) {
        return {
          interpretation: "Repeated face-touching or hand movements near the microphone were observed.",
          actionableTip: "Rest your hands comfortably on the desk or lap between gestures to project composure.",
          severity: "low",
        };
      }
      return {
        interpretation: "Dynamic hand gestures accompanied your answer.",
        actionableTip: "Natural gestures reinforce technical explanations when kept controlled.",
        severity: "info",
      };

    case "integrity_event":
      if (mode === "proctoring" || mode === "assessment") {
        return {
          interpretation: "Browser focus or window visibility changed during the session.",
          actionableTip: "Keep the assessment window active and avoid navigating to other applications.",
          severity: "high",
        };
      }
      return {
        interpretation: "Application focus shifted briefly.",
        actionableTip: "Keep the interview window active to avoid audio desynchronization.",
        severity: "info",
      };

    case "technical_quality":
      return {
        interpretation: "Video frame rate or stream quality dropped temporarily.",
        actionableTip: "Ensure a stable network connection and close background tabs streaming video.",
        severity: "medium",
      };

    case "voice_delivery":
    default:
      return {
        interpretation: "Voice and pacing observations recorded.",
        actionableTip: "Maintain steady pacing and pause briefly between structured points.",
        severity: "info",
      };
  }
}
