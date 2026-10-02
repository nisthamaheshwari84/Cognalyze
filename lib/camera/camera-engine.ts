/**
 * COGNALYZE — UNIFIED CAMERA INTELLIGENCE ENGINE
 * 
 * High-performance browser video & audio analysis engine powered by
 * dual client-side vision inference (MediaPipe ObjectDetector + BlazeFace FaceDetector)
 * and sliding-window temporal event tracking.
 * 
 * Capabilities:
 * - Real-time Multi-Person Detection (0, 1, 2, 3+ individuals)
 * - Real-time Mobile Phone Detection with temporal confirmation
 * - Real-time Person Presence & Leave-Frame Tracking
 * - Lighting, Framing, Gaze, and Technical Quality Verification
 * 
 * Performance:
 * - Runs inference on live video frames at ~3.5-4 FPS (~280ms tick) consuming minimal CPU.
 * - Graceful fallback if WebGL/WASM is limited.
 * - Purely observable metrics with ZERO sensitive psychological inferences.
 */

import {
  CameraMode,
  CameraObservation,
  CameraQualityMetrics,
  CameraReadinessState,
  ObservationSeverity,
} from "./types";
import { interpretObservation } from "./mode-interpreter";
import { VisionPipeline } from "./vision-models";
import { FrameSample, TemporalTracker } from "./temporal-tracker";

export class CameraEngine {
  private mode: CameraMode;
  private sessionId: string;
  private stream: MediaStream | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenCtx: CanvasRenderingContext2D | null = null;

  private audioCtx: AudioContext | null = null;
  private audioAnalyser: AnalyserNode | null = null;
  private audioDataArray: Uint8Array<ArrayBuffer> | null = null;

  // Vision Pipeline & Temporal Tracker
  private visionPipeline: VisionPipeline;
  private temporalTracker: TemporalTracker;

  private timerId: any = null;
  private startTime: number = 0;
  private isRunning: boolean = false;
  private isProcessingTick: boolean = false;

  private previousFrameData: ImageData | null = null;
  private frozenFrameCount: number = 0;
  private faceMissingStreak: number = 0;
  private gazeAwayStreak: number = 0;
  private faceTouchStreak: number = 0;

  // Performance telemetry
  private lastTickTime: number = 0;
  private measuredInferenceFps: number = 0;
  private obsCounter: number = 0;

  private observationsTimeline: CameraObservation[] = [];
  private onObservationCallback: ((obs: CameraObservation) => void) | null = null;
  private onMetricsCallback: ((metrics: CameraQualityMetrics) => void) | null = null;

  private lastObservationTimeMap = new Map<string, number>();

  private readiness: CameraReadinessState = {
    camera: false,
    microphone: false,
    videoStream: false,
    audioStream: false,
    resolutionOk: false,
    lightingOk: false,
    faceVisible: false,
    framingOk: false,
    cameraPositionOk: false,
    allReady: false,
    fallbackMode: "camera_and_voice",
    diagnosticMessages: [],
  };

  constructor(mode: CameraMode = "interview", sessionId?: string) {
    this.mode = mode;
    this.sessionId = sessionId || `session_${Date.now()}`;
    this.visionPipeline = new VisionPipeline();
    this.temporalTracker = new TemporalTracker();
  }

  public setMode(mode: CameraMode) {
    this.mode = mode;
  }

  public getSessionId(): string {
    return this.sessionId;
  }

  public getReadiness(): CameraReadinessState {
    return { ...this.readiness };
  }

  public getTimeline(): CameraObservation[] {
    return [...this.observationsTimeline];
  }

  public getVisionPipeline(): VisionPipeline {
    return this.visionPipeline;
  }

  public getTemporalTracker(): TemporalTracker {
    return this.temporalTracker;
  }

  /**
   * Initializes media devices and kicks off vision model loading
   */
  public async initializeMedia(options?: {
    video?: boolean | MediaTrackConstraints;
    audio?: boolean | MediaTrackConstraints;
  }): Promise<{ stream: MediaStream | null; fallbackMode: CameraReadinessState["fallbackMode"] }> {
    const wantVideo = options?.video !== false;
    const wantAudio = options?.audio !== false;

    this.readiness.diagnosticMessages = [];

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      this.readiness.fallbackMode = "text_only";
      this.readiness.diagnosticMessages.push("Browser mediaDevices API not available.");
      return { stream: null, fallbackMode: "text_only" };
    }

    let stream: MediaStream | null = null;
    let videoOk = false;
    let audioOk = false;

    // 1. Try both Video + Audio
    if (wantVideo && wantAudio) {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: typeof options?.video === "object" ? options.video : { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
          audio: typeof options?.audio === "object" ? options.audio : { echoCancellation: true, noiseSuppression: true },
        });
        videoOk = stream.getVideoTracks().length > 0;
        audioOk = stream.getAudioTracks().length > 0;
      } catch (err: any) {
        this.readiness.diagnosticMessages.push(`Combined AV request: ${err?.message || "denied/failed"}`);
      }
    }

    // 2. Try Video-Only if combined failed
    if (!videoOk && wantVideo) {
      try {
        const vStream = await navigator.mediaDevices.getUserMedia({
          video: typeof options?.video === "object" ? options.video : { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
          audio: false,
        });
        stream = vStream;
        videoOk = stream.getVideoTracks().length > 0;
      } catch (err: any) {
        this.readiness.diagnosticMessages.push(`Video request: ${err?.message || "denied"}`);
      }
    }

    // 3. Try Audio-Only if video failed
    if (!videoOk && wantAudio) {
      try {
        const aStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: typeof options?.audio === "object" ? options.audio : { echoCancellation: true, noiseSuppression: true },
        });
        stream = aStream;
        audioOk = stream.getAudioTracks().length > 0;
      } catch (err: any) {
        this.readiness.diagnosticMessages.push(`Audio request: ${err?.message || "denied"}`);
      }
    }

    // Determine fallback mode
    if (videoOk && audioOk) {
      this.readiness.fallbackMode = "camera_and_voice";
    } else if (audioOk && !videoOk) {
      this.readiness.fallbackMode = "voice_only";
    } else if (videoOk && !audioOk) {
      this.readiness.fallbackMode = "camera_only";
    } else {
      this.readiness.fallbackMode = "text_only";
    }

    this.readiness.camera = videoOk;
    this.readiness.microphone = audioOk;
    this.readiness.videoStream = videoOk;
    this.readiness.audioStream = audioOk;
    this.stream = stream;

    // Attach stream track event listeners for disconnect detection
    if (stream && videoOk) {
      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          console.warn("[CAMERA] Video track ended / disconnected.");
          const discEvent = this.temporalTracker.handleCameraDisconnect();
          this.recordObservation(
            "camera_disconnected",
            discEvent.evidence,
            "critical",
            undefined,
            1.0
          );
        };
      });
    }

    // Attach audio analyzer if audio stream is active
    if (audioOk && stream) {
      this.initAudioAnalyzer(stream);
    }

    // Initialize vision models asynchronously
    if (videoOk) {
      this.visionPipeline.initialize().then((res) => {
        if (!res.success) {
          this.readiness.diagnosticMessages.push(res.message);
        }
      });
    }

    return { stream, fallbackMode: this.readiness.fallbackMode };
  }

  private initAudioAnalyzer(stream: MediaStream) {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      this.audioCtx = new AudioCtxClass();
      const source = this.audioCtx.createMediaStreamSource(stream);
      this.audioAnalyser = this.audioCtx.createAnalyser();
      this.audioAnalyser.fftSize = 256;
      source.connect(this.audioAnalyser);

      const bufferLength = this.audioAnalyser.frequencyBinCount;
      this.audioDataArray = new Uint8Array(bufferLength);
    } catch (e) {
      console.warn("[CameraEngine] Web Audio API init note:", e);
    }
  }

  public getAudioVolume(): number {
    if (!this.audioAnalyser || !this.audioDataArray) return 0;
    try {
      this.audioAnalyser.getByteFrequencyData(this.audioDataArray);
      let sum = 0;
      for (let i = 0; i < this.audioDataArray.length; i++) {
        sum += this.audioDataArray[i];
      }
      return Math.round(sum / this.audioDataArray.length);
    } catch {
      return 0;
    }
  }

  /**
   * Starts visual, object detection, and audio observation loop on an HTMLVideoElement
   */
  public startObservationLoop(
    videoElement: HTMLVideoElement,
    callbacks: {
      onObservation?: (obs: CameraObservation) => void;
      onMetrics?: (metrics: CameraQualityMetrics) => void;
    }
  ) {
    if (this.isRunning) return;

    this.videoEl = videoElement;
    this.onObservationCallback = callbacks.onObservation || null;
    this.onMetricsCallback = callbacks.onMetrics || null;
    this.startTime = Date.now();
    this.lastTickTime = performance.now();
    this.isRunning = true;

    // Offscreen sampling canvas for luminance and motion differencing (160x120)
    this.offscreenCanvas = document.createElement("canvas");
    this.offscreenCanvas.width = 160;
    this.offscreenCanvas.height = 120;
    this.offscreenCtx = this.offscreenCanvas.getContext("2d", { willReadFrequently: true });

    // Initial timeline entry
    this.recordObservation("technical_quality", "Camera stream initialized and real-time vision engine started.", "info", undefined, 1.0);

    // Attach integrity listeners for proctoring/assessment
    this.attachIntegrityListeners();

    // 280ms tick (~3.5 FPS) provides high responsiveness without overloading the UI thread
    this.timerId = setInterval(() => {
      this.processVideoTick();
    }, 280);
  }

  private attachIntegrityListeners() {
    if (typeof window === "undefined") return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        this.recordObservation(
          "integrity_event",
          "Assessment window lost focus or switched tabs.",
          this.mode === "proctoring" || this.mode === "assessment" ? "high" : "info",
          undefined,
          1.0
        );
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && (this.mode === "proctoring" || this.mode === "assessment")) {
        this.recordObservation("integrity_event", "Fullscreen mode was exited.", "high", undefined, 1.0);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
  }

  private processVideoTick() {
    if (!this.isRunning || !this.videoEl || this.isProcessingTick) return;

    const video = this.videoEl;
    // Frame validation: must have active video dimensions and readyState >= HAVE_CURRENT_DATA
    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0 || video.paused || video.ended) {
      return;
    }

    this.isProcessingTick = true;
    const nowPerf = performance.now();
    const deltaMs = nowPerf - (this.lastTickTime || nowPerf);
    this.lastTickTime = nowPerf;
    this.measuredInferenceFps = deltaMs > 0 ? Math.round((1000 / deltaMs) * 10) / 10 : 3.5;

    try {
      // 1. Run Real-Time Vision Inference on Live Video Element
      const detections = this.visionPipeline.detectFrame(video, nowPerf);

      // 2. Feed into Temporal Tracker for Event Confirmation
      const sample: FrameSample = {
        timestamp: Date.now(),
        personCount: detections.personCount,
        faceCount: detections.faceCount,
        phoneCount: detections.phoneCount,
        rawPhoneCandidate: detections.rawPhoneCandidate,
        objects: detections.objects,
        faces: detections.faces,
      };

      const { state: proctorState, newEvents, endedEvents } = this.temporalTracker.processFrame(sample);

      // 3. Emit confirmed proctoring observations for new events
      for (const evt of newEvents) {
        if (evt.eventType === "PHONE_DETECTED") {
          this.recordObservation(
            "phone_detected",
            evt.evidence,
            "critical",
            { durationSec: evt.durationSec },
            evt.confidence
          );
        } else if (evt.eventType === "MULTIPLE_PERSONS") {
          this.recordObservation(
            "multiple_people",
            evt.evidence,
            "high",
            { count: Math.max(sample.personCount, sample.faceCount) },
            evt.confidence
          );
        } else if (evt.eventType === "PERSON_LEFT_FRAME") {
          this.recordObservation(
            "person_left_frame",
            evt.evidence,
            "high",
            { durationSec: evt.durationSec },
            evt.confidence
          );
        }
      }

      // 4. Lighting & Motion Diffing on Offscreen Canvas
      let avgLuminance = 120;
      let avgCenterLum = 120;
      let avgPerimeterLum = 120;
      let lightingStatus: CameraQualityMetrics["lightingStatus"] = "good";
      let movementLevel: CameraQualityMetrics["movementLevel"] = "calm";
      let isFrozen = false;

      if (this.offscreenCanvas && this.offscreenCtx) {
        const cw = this.offscreenCanvas.width;
        const ch = this.offscreenCanvas.height;

        this.offscreenCtx.drawImage(video, 0, 0, cw, ch);
        const frameData = this.offscreenCtx.getImageData(0, 0, cw, ch);
        const pixels = frameData.data;

        let totalLuminance = 0;
        let centerLuminance = 0;
        let perimeterLuminance = 0;
        let centerPixelCount = 0;
        let perimeterPixelCount = 0;

        const cx1 = Math.floor(cw * 0.25);
        const cx2 = Math.floor(cw * 0.75);
        const cy1 = Math.floor(ch * 0.15);
        const cy2 = Math.floor(ch * 0.85);

        for (let y = 0; y < ch; y++) {
          for (let x = 0; x < cw; x++) {
            const i = (y * cw + x) * 4;
            const r = pixels[i];
            const g = pixels[i + 1];
            const b = pixels[i + 2];

            const lum = 0.299 * r + 0.587 * g + 0.114 * b;
            totalLuminance += lum;

            if (x >= cx1 && x <= cx2 && y >= cy1 && y <= cy2) {
              centerLuminance += lum;
              centerPixelCount++;
            } else {
              perimeterLuminance += lum;
              perimeterPixelCount++;
            }
          }
        }

        avgLuminance = Math.round(totalLuminance / (cw * ch));
        avgCenterLum = centerPixelCount > 0 ? Math.round(centerLuminance / centerPixelCount) : avgLuminance;
        avgPerimeterLum = perimeterPixelCount > 0 ? Math.round(perimeterLuminance / perimeterPixelCount) : avgLuminance;

        if (avgLuminance < 45) {
          lightingStatus = "too_dark";
        } else if (avgLuminance > 225) {
          lightingStatus = "too_bright";
        } else if (avgPerimeterLum - avgCenterLum > 55) {
          lightingStatus = "backlit";
        }

        // Frame Differencing for Frozen Video & Movement
        if (this.previousFrameData) {
          const prev = this.previousFrameData.data;
          let diffSum = 0;

          for (let j = 0; j < pixels.length; j += 4) {
            diffSum += Math.abs(pixels[j] - prev[j]) + Math.abs(pixels[j + 1] - prev[j + 1]) + Math.abs(pixels[j + 2] - prev[j + 2]);
          }

          const avgDiff = diffSum / (cw * ch * 3);

          if (avgDiff === 0) {
            this.frozenFrameCount++;
            if (this.frozenFrameCount > 12) isFrozen = true;
          } else {
            this.frozenFrameCount = 0;
          }

          if (avgDiff > 24) {
            movementLevel = "excessive";
          } else if (avgDiff > 12) {
            movementLevel = "moderate";
          }

          if (detections.faceCount > 0 && avgDiff > 8 && avgDiff < 25) {
            this.faceTouchStreak++;
            if (this.faceTouchStreak >= 6) movementLevel = "face_touching";
          } else {
            this.faceTouchStreak = 0;
          }
        }

        this.previousFrameData = frameData;
      }

      // 5. Face Presence, Framing & Posture from Vision Model
      const primaryFace = detections.faces[0];
      const primaryPerson = detections.objects.find((o) => o.className === "person");
      const effectiveFaceBox = primaryFace?.boundingBox || primaryPerson?.boundingBox;
      const faceDetected = detections.faceCount > 0 || detections.personCount > 0;

      let framingStatus: CameraQualityMetrics["framingStatus"] = "optimal";
      let postureStatus: CameraQualityMetrics["postureStatus"] = "upright";
      let gazeStatus: CameraQualityMetrics["gazeStatus"] = "camera_facing";

      if (effectiveFaceBox) {
        const boxW = effectiveFaceBox.width;
        const boxX = effectiveFaceBox.x;
        const boxY = effectiveFaceBox.y;

        if (boxW > 0.8) {
          framingStatus = "too_close";
        } else if (boxW < 0.15) {
          framingStatus = "too_far";
        } else if (boxX < 0.08 || boxX + boxW > 0.92) {
          framingStatus = "off_center";
        } else if (boxY < 0.04) {
          framingStatus = "low_angle";
        } else if (boxY > 0.35) {
          framingStatus = "high_angle";
        }

        const centerOffsetX = (boxX + boxW / 2) - 0.5;
        if (centerOffsetX < -0.16) postureStatus = "leaning_left";
        else if (centerOffsetX > 0.16) postureStatus = "leaning_right";
        else if (boxY > 0.28) postureStatus = "slouched";

        if (Math.abs(centerOffsetX) > 0.18) {
          gazeStatus = "looking_away";
          this.gazeAwayStreak++;
        } else {
          this.gazeAwayStreak = 0;
        }
      }

      // 6. Update Readiness State
      this.readiness.resolutionOk = video.videoWidth >= 480;
      this.readiness.lightingOk = lightingStatus === "good";
      this.readiness.faceVisible = faceDetected;
      this.readiness.framingOk = framingStatus === "optimal";
      this.readiness.cameraPositionOk = framingStatus !== "low_angle" && framingStatus !== "high_angle";
      this.readiness.allReady =
        this.readiness.camera &&
        this.readiness.faceVisible &&
        this.readiness.lightingOk;

      // 7. Full Quality & Proctoring Metrics Payload
      const metrics: CameraQualityMetrics = {
        resolution: { width: video.videoWidth, height: video.videoHeight },
        fps: 3.5,
        inferenceFps: this.measuredInferenceFps,
        lastInferenceTime: Date.now(),
        brightness: avgLuminance,
        contrast: Math.abs(avgCenterLum - avgPerimeterLum),
        lightingStatus,
        faceDetected,
        faceCount: Math.max(detections.faceCount, detections.personCount),
        faceBox: effectiveFaceBox,
        personCount: detections.personCount,
        peopleDetected: detections.personCount > 0,
        phoneDetected: detections.phoneCount > 0 || !!this.temporalTracker.getActivePhoneEvent(),
        phoneCount: detections.phoneCount,
        lastPhoneConfidence: detections.rawPhoneCandidate?.confidence,
        detectedObjects: detections.objects,
        detectedFaces: detections.faces,
        visionModelStatus: this.visionPipeline.getStatus(),
        proctoringState: proctorState,
        framingStatus,
        postureStatus,
        gazeStatus,
        movementLevel,
        isFrozen,
        streamActive: !!this.stream && this.stream.active,
      };

      if (this.onMetricsCallback) {
        this.onMetricsCallback(metrics);
      }

      // 8. Contextual Observation Triggers
      this.evaluateObservations(metrics);
    } catch (tickErr) {
      console.warn("[CameraEngine] Error during processVideoTick:", tickErr);
    } finally {
      this.isProcessingTick = false;
    }
  }

  private evaluateObservations(metrics: CameraQualityMetrics) {
    const now = Date.now();
    const canEmit = (type: string, cooldownMs = 15000) => {
      const last = this.lastObservationTimeMap.get(type) || 0;
      if (now - last > cooldownMs) {
        this.lastObservationTimeMap.set(type, now);
        return true;
      }
      return false;
    };

    // A. Face Missing (when face and person are missing)
    if (!metrics.faceDetected) {
      this.faceMissingStreak++;
      if (this.faceMissingStreak === 6 && canEmit("face_missing", 20000)) {
        this.recordObservation(
          "face_missing",
          "Face is not visible in camera frame. Adjust camera angle or position.",
          this.mode === "proctoring" ? "high" : "medium",
          undefined,
          0.92
        );
      }
    } else {
      this.faceMissingStreak = 0;
    }

    // B. Lighting quality issue
    if (metrics.lightingStatus !== "good" && canEmit("lighting", 30000)) {
      if (metrics.lightingStatus === "too_dark") {
        this.recordObservation("lighting", "Ambient lighting is low, reducing facial contrast.", "low", undefined, 0.85);
      } else if (metrics.lightingStatus === "backlit") {
        this.recordObservation("lighting", "Strong backlight detected behind candidate.", "low", undefined, 0.85);
      }
    }

    // C. Camera Angle / Framing
    if (metrics.framingStatus === "low_angle" && canEmit("camera_position", 25000)) {
      this.recordObservation("camera_position", "Camera is angled below eye level. Raise camera position.", "low", undefined, 0.88);
    } else if (metrics.framingStatus === "too_close" && canEmit("framing", 25000)) {
      this.recordObservation("framing", "Camera is positioned very close to candidate.", "low", undefined, 0.88);
    }

    // D. Gaze deviation
    if (this.gazeAwayStreak >= 10 && canEmit("camera_gaze", 20000)) {
      this.recordObservation(
        "camera_gaze",
        "Gaze oriented away from camera lens during response.",
        this.mode === "proctoring" ? "medium" : "low",
        { durationSec: 4 },
        0.89
      );
    }

    // E. Movement / Face Touching
    if (metrics.movementLevel === "face_touching" && canEmit("body_movement", 25000)) {
      this.recordObservation(
        "body_movement",
        "Frequent hand movements near face or chin observed.",
        "low",
        { count: 3 },
        0.82
      );
    }

    // F. Frozen Video
    if (metrics.isFrozen && canEmit("frozen_video", 30000)) {
      this.recordObservation(
        "technical_quality",
        "Video feed appeared static or frozen for several seconds.",
        "medium",
        undefined,
        0.95
      );
    }
  }

  public recordObservation(
    type: CameraObservation["observationType"],
    evidence: string,
    defaultSeverity: ObservationSeverity = "info",
    context?: { durationSec?: number; count?: number; isAnswering?: boolean },
    confidence: number = 0.88
  ): CameraObservation {
    const elapsedSec = Math.max(0, Math.round((Date.now() - (this.startTime || Date.now())) / 1000));
    const mins = Math.floor(elapsedSec / 60);
    const secs = elapsedSec % 60;
    const timeFormatted = `${mins < 10 ? "0" : ""}${mins}:${secs < 10 ? "0" : ""}${secs}`;

    const interpretationObj = interpretObservation(type, this.mode, context);
    this.obsCounter++;

    const obs: CameraObservation = {
      id: `obs_${Date.now()}_${this.obsCounter}`,
      timestamp: Date.now(),
      timeFormatted,
      sessionId: this.sessionId,
      mode: this.mode,
      observationType: type,
      confidence: Math.round(confidence * 100) / 100,
      duration: context?.durationSec,
      severity: interpretationObj.severity || defaultSeverity,
      evidence,
      interpretation: interpretationObj.interpretation,
      actionableTip: interpretationObj.actionableTip,
    };

    this.observationsTimeline.push(obs);

    if (this.onObservationCallback) {
      this.onObservationCallback(obs);
    }

    return obs;
  }

  public stop() {
    this.isRunning = false;
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.audioCtx && this.audioCtx.state !== "closed") {
      try {
        this.audioCtx.close();
      } catch {}
      this.audioCtx = null;
    }
    if (this.visionPipeline) {
      this.visionPipeline.release();
    }
  }
}
