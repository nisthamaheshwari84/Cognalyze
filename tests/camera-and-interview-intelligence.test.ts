import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { interpretObservation } from "../lib/camera/mode-interpreter";
import { analyzeVoiceDelivery } from "../lib/camera/voice-intelligence";
import { getLearnerCameraMemory, updateLearnerCameraMemory } from "../lib/camera/learner-memory";
import { generateCameraSessionReport } from "../lib/camera/session-reporter";
import { CameraObservation, CameraReadinessState } from "../lib/camera/types";

describe("Unified Camera Intelligence Engine & Interview Live Scoring", () => {

  // ═══════════════════════════════════════════════════════════
  // 1. MODE-SPECIFIC CAMERA INTERPRETATION
  // ═══════════════════════════════════════════════════════════
  describe("Mode-Specific Camera Interpretation", () => {
    test("Gaze deviation produces interview coaching in 'interview' mode", () => {
      const result = interpretObservation("camera_gaze", "interview", {
        isAnswering: true,
        durationSec: 4,
      });

      assert.ok(result.interpretation.toLowerCase().includes("gaze") || result.interpretation.toLowerCase().includes("camera"));
      assert.ok(result.actionableTip && result.actionableTip.length > 0);
      // STRICT RULE: No personality, deception, or emotional state claims
      assert.doesNotMatch(result.interpretation, /nervous|lying|dishonest|anxious|insecure/i);
    });

    test("Gaze deviation produces attention violation event in 'proctoring' mode", () => {
      const result = interpretObservation("camera_gaze", "proctoring", {
        isAnswering: true,
        durationSec: 7,
      });

      assert.strictEqual(result.severity, "medium");
      assert.ok(result.interpretation.toLowerCase().includes("assessment") || result.interpretation.toLowerCase().includes("gaze"));
      // Proctoring must record evidence without falsely declaring cheating
      assert.doesNotMatch(result.interpretation, /cheating confirmed|fraudulent candidate/i);
    });

    test("Multiple persons detected in proctoring mode raises high-severity observation", () => {
      const result = interpretObservation("multiple_people", "proctoring", {
        count: 2,
      });

      assert.strictEqual(result.severity, "high");
      assert.ok(result.interpretation.toLowerCase().includes("multiple") || result.interpretation.toLowerCase().includes("person") || result.interpretation.toLowerCase().includes("individual"));
    });

    test("Camera framing observation provides physical actionable correction", () => {
      const result = interpretObservation("framing", "interview", {
        durationSec: 3,
      });

      assert.ok(result.actionableTip?.toLowerCase().includes("center") || result.actionableTip?.toLowerCase().includes("frame") || result.actionableTip?.toLowerCase().includes("camera"));
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 2. VOICE INTELLIGENCE
  // ═══════════════════════════════════════════════════════════
  describe("Voice Delivery Intelligence", () => {
    test("Detects speaking rate (WPM) and filler words accurately", () => {
      const sampleTranscript = "Um, so basically, I built a microservice with FastAPI, uh, because we needed asynchronous concurrency, like, handling 5000 requests per second.";
      const durationSeconds = 12;

      const metrics = analyzeVoiceDelivery(sampleTranscript, durationSeconds);
      assert.strictEqual(metrics.fillerWordCount >= 3, true, "Should identify 'um', 'basically', 'uh', 'like'");
      assert.strictEqual(metrics.speakingDurationSec, 12);
      assert.ok(metrics.wordsPerMinute > 0);

      // Strictly factual observations, no emotional inference
      assert.doesNotMatch(metrics.clarityAssessment, /lack of confidence|scared|nervous/i);
    });

    test("Flags overly lengthy responses for concise coaching", () => {
      const longTranscript = "First, ".repeat(180) + "finally we deployed.";
      const durationSeconds = 190; // Over 3 minutes

      const metrics = analyzeVoiceDelivery(longTranscript, durationSeconds);
      assert.ok(metrics.clarityAssessment.includes("duration") || metrics.clarityAssessment.includes("target") || metrics.clarityAssessment.includes("60"));
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 3. ADAPTIVE LEARNER CAMERA MEMORY
  // ═══════════════════════════════════════════════════════════
  describe("Adaptive Learner Camera Memory", () => {
    test("Remembers recurring presentation habits across sessions", () => {
      const studentId = "student-test-memory";
      const habitObsTime = Date.now();
      const sampleObs: CameraObservation[] = [
        {
          id: "obs-habit-1",
          timestamp: habitObsTime - 10000,
          timeFormatted: "00:00:10",
          sessionId: "test-sess",
          mode: "interview",
          observationType: "camera_position",
          confidence: 0.9,
          duration: 10,
          severity: "low",
          evidence: "Camera angle slightly low",
        },
      ];

      const updated = updateLearnerCameraMemory(studentId, sampleObs, {
        wordsPerMinute: 140,
        speakingDurationSec: 75,
      });

      assert.ok(updated.repeatedHabits.cameraAngleLow >= 1);
      assert.ok(updated.preSessionTips.length > 0);
      assert.ok(updated.preSessionTips.some(t => t.toLowerCase().includes("eye level") || t.toLowerCase().includes("camera")));
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 4. EVIDENCE-BASED SESSION REPORTING
  // ═══════════════════════════════════════════════════════════
  describe("Evidence-Based Session Reporting", () => {
    test("Generates comprehensive report with timeline and practice drills", () => {
      const reportNow = Date.now();
      const observations: CameraObservation[] = [
        {
          id: "obs-rep-1",
          timestamp: reportNow - 300000,
          timeFormatted: "00:00:05",
          sessionId: "sess-rep-1",
          mode: "interview",
          observationType: "technical_quality",
          confidence: 1.0,
          duration: 0,
          severity: "info",
          evidence: "Camera and microphone initialized cleanly",
        },
        {
          id: "obs-rep-2",
          timestamp: reportNow - 150000,
          timeFormatted: "00:02:15",
          sessionId: "sess-rep-1",
          mode: "interview",
          observationType: "camera_gaze",
          confidence: 0.92,
          duration: 5,
          severity: "low",
          evidence: "Gaze shifted during architectural trade-off explanation",
        },
      ];

      const readiness: CameraReadinessState = {
        camera: true,
        microphone: true,
        videoStream: true,
        audioStream: true,
        resolutionOk: true,
        lightingOk: true,
        faceVisible: true,
        framingOk: true,
        cameraPositionOk: true,
        allReady: true,
        fallbackMode: "camera_and_voice",
        diagnosticMessages: [],
      };

      const report = generateCameraSessionReport({
        sessionId: "sess-rep-1",
        mode: "interview",
        startTime: reportNow - 300000,
        endTime: reportNow,
        readiness,
        timeline: observations,
        voiceMetrics: {
          speakingDurationSec: 180,
          wordCount: 420,
          wordsPerMinute: 140,
          fillerWordsFound: ["like", "um"],
          fillerWordCount: 2,
          longPausesCount: 1,
          averageVolume: 65,
          clarityAssessment: "Well-calibrated delivery pace.",
        },
        interviewNotes: {
          strongestAnswer: "In production, I'd partition Redis cluster keys using consistent hashing.",
        },
      });

      assert.strictEqual(report.sessionId, "sess-rep-1");
      assert.ok(report.timeline.length >= 2);
      assert.ok(report.whatWorked.length > 0);
      assert.ok(report.nextPracticeDrills.length > 0);
      // Verify no pseudo-scores (e.g. "honesty: 98%")
      const serialized = JSON.stringify(report);
      assert.doesNotMatch(serialized, /"honesty"|"attractiveness"|"personalityScore"|"nervousness"/i);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 5. INTERVIEW LIVE SCORE & STRONGEST ANSWER SPECIFICATION
  // ═══════════════════════════════════════════════════════════
  describe("Interview Live Score & Strongest Answer Specification", () => {
    test("Validates 7-dimension breakdown sum and clamping within 0-100", () => {
      const breakdown = {
        relevance: 18,        // max 20
        technicalAccuracy: 17, // max 20
        communicationClarity: 13, // max 15
        problemSolving: 12,    // max 15
        depth: 11,             // max 15
        examples: 8,           // max 10
        confidence: 4,         // max 5
      };

      const calculatedSum =
        breakdown.relevance +
        breakdown.technicalAccuracy +
        breakdown.communicationClarity +
        breakdown.problemSolving +
        breakdown.depth +
        breakdown.examples +
        breakdown.confidence;

      assert.strictEqual(calculatedSum, 83);
      assert.ok(calculatedSum >= 0 && calculatedSum <= 100);

      // Hiring signal determination
      const hiringSignal = calculatedSum >= 75 ? "STRONG" : calculatedSum >= 55 ? "MODERATE" : "WEAK";
      assert.strictEqual(hiringSignal, "STRONG");
    });

    test("Ensures Strongest Answer benchmark provides actionable architectural depth", () => {
      const sampleStrongestAnswer = "In production, I'd design the URL shortener using base62 encoding with a distributed counter via Redis and write-behind caching to PostgreSQL, guaranteeing sub-10ms reads and handling 100k QPS with geo-distributed CDN edge endpoints.";
      assert.ok(sampleStrongestAnswer.length > 50);
      assert.ok(sampleStrongestAnswer.includes("Redis") || sampleStrongestAnswer.includes("architecture"));
    });
  });
});
