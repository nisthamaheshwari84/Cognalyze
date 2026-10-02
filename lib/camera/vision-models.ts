/**
 * COGNALYZE — REAL-TIME VISION INFERENCE ENGINE
 * 
 * Production-grade client-side dual vision pipeline:
 * 1. Object Detection (MediaPipe EfficientDet-Lite0):
 *    - Real-time detection of 'person', 'cell phone', 'laptop', 'book'
 * 2. Multi-Face Detection (MediaPipe BlazeFace Short-Range):
 *    - Sub-millisecond detection of multiple faces with keypoints
 * 3. Graceful fallback to face-api.js (TinyFaceDetector) if WebAssembly/GPU unavailable
 * 
 * Truth Contract:
 * - NO fake inference, NO mock bounding boxes, NO simulated confidence.
 * - Every detection is derived from model execution on live video frames.
 */

import {
  BoundingBox,
  NormalizedDetection,
  VisionModelStatus,
} from "./types";

export interface VisionModelConfig {
  phoneThreshold?: number;
  personThreshold?: number;
  faceThreshold?: number;
  maxObjects?: number;
}

export const DEFAULT_VISION_CONFIG: VisionModelConfig = {
  phoneThreshold: 0.38,
  personThreshold: 0.45,
  faceThreshold: 0.45,
  maxObjects: 10,
};

export class VisionPipeline {
  private status: VisionModelStatus = "MODEL_LOADING";
  private diagnosticMessage: string = "";
  private config: VisionModelConfig;

  // MediaPipe detectors
  private objectDetector: any = null;
  private faceDetector: any = null;

  // Fallback face detector
  private faceApiRef: any = null;
  private faceApiLoaded: boolean = false;

  // Async face-api cache (face-api.js is async, detectFrame is sync)
  private faceApiCachedResult: { faces: NormalizedDetection[]; timestamp: number } = { faces: [], timestamp: 0 };
  private faceApiDetecting: boolean = false;

  private isInitializing: boolean = false;
  private lastTimestampMs: number = 0;
  private frameCount: number = 0;
  private initAttempts: number = 0;

  constructor(config: Partial<VisionModelConfig> = {}) {
    this.config = { ...DEFAULT_VISION_CONFIG, ...config };
  }

  public getStatus(): VisionModelStatus {
    return this.status;
  }

  public getDiagnosticMessage(): string {
    return this.diagnosticMessage;
  }

  public isReady(): boolean {
    return this.status === "MODEL_READY" || this.status === "MODEL_FALLBACK";
  }

  /**
   * Initializes vision models in the browser.
   * Loads WebAssembly binaries from /wasm and weights from /models.
   */
  public async initialize(): Promise<{ success: boolean; status: VisionModelStatus; message: string }> {
    if (this.isReady()) {
      return { success: true, status: this.status, message: "Models already initialized" };
    }

    if (this.isInitializing) {
      // Wait for existing initialization to finish
      let attempts = 0;
      while (this.isInitializing && attempts < 50) {
        await new Promise((r) => setTimeout(r, 100));
        attempts++;
      }
      return { success: this.isReady(), status: this.status, message: this.diagnosticMessage };
    }

    if (typeof window === "undefined") {
      this.status = "MODEL_ERROR";
      this.diagnosticMessage = "SSR environment: vision models require browser context.";
      return { success: false, status: this.status, message: this.diagnosticMessage };
    }

    this.isInitializing = true;
    this.initAttempts++;
    this.status = "MODEL_LOADING";
    console.log(`[MODEL] Loading production vision models (MediaPipe Tasks Vision)... (attempt ${this.initAttempts})`);

    try {
      const visionPkg = await import("@mediapipe/tasks-vision");
      const { FilesetResolver, ObjectDetector, FaceDetector } = visionPkg;

      // 1. Resolve WASM assets locally from /wasm
      const wasmFileset = await FilesetResolver.forVisionTasks("/wasm").catch(async (wasmErr) => {
        console.warn("[MODEL] Local /wasm load note, retrying with CDN fallback:", wasmErr);
        return await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
        );
      });

      // 2. Initialize Object Detector (supports "person", "cell phone", "laptop", "book")
      // First try GPU delegate, fallback to CPU if WebGL is unavailable
      let objDetector = null;
      try {
        objDetector = await ObjectDetector.createFromOptions(wasmFileset, {
          baseOptions: {
            modelAssetPath: "/models/efficientdet_lite0.tflite",
            delegate: "GPU",
          },
          scoreThreshold: this.config.phoneThreshold || 0.38,
          runningMode: "VIDEO",
          maxResults: this.config.maxObjects || 10,
          categoryAllowlist: ["person", "cell phone", "laptop", "book"],
        });
      } catch (gpuErr) {
        console.warn("[MODEL] GPU delegate unavailable for ObjectDetector, falling back to CPU:", gpuErr);
        objDetector = await ObjectDetector.createFromOptions(wasmFileset, {
          baseOptions: {
            modelAssetPath: "/models/efficientdet_lite0.tflite",
            delegate: "CPU",
          },
          scoreThreshold: this.config.phoneThreshold || 0.38,
          runningMode: "VIDEO",
          maxResults: this.config.maxObjects || 10,
          categoryAllowlist: ["person", "cell phone", "laptop", "book"],
        });
      }

      this.objectDetector = objDetector;

      // 3. Initialize BlazeFace Multi-Face Detector
      let fDetector = null;
      try {
        fDetector = await FaceDetector.createFromOptions(wasmFileset, {
          baseOptions: {
            modelAssetPath: "/models/blaze_face_short_range.tflite",
            delegate: "GPU",
          },
          minDetectionConfidence: this.config.faceThreshold || 0.45,
          runningMode: "VIDEO",
        });
      } catch (fGpuErr) {
        console.warn("[MODEL] GPU delegate unavailable for FaceDetector, falling back to CPU:", fGpuErr);
        fDetector = await FaceDetector.createFromOptions(wasmFileset, {
          baseOptions: {
            modelAssetPath: "/models/blaze_face_short_range.tflite",
            delegate: "CPU",
          },
          minDetectionConfidence: this.config.faceThreshold || 0.45,
          runningMode: "VIDEO",
        });
      }

      this.faceDetector = fDetector;

      this.status = "MODEL_READY";
      this.diagnosticMessage = "Dual vision pipeline initialized (ObjectDetector + FaceDetector ready).";
      this.isInitializing = false;
      console.log(
        "[MODEL] ✅ Ready: MediaPipe ObjectDetector + BlazeFace FaceDetector active.",
        `\n  ObjectDetector: ${this.objectDetector ? 'loaded' : 'FAILED'}`,
        `\n  FaceDetector: ${this.faceDetector ? 'loaded' : 'FAILED'}`
      );
      return { success: true, status: this.status, message: this.diagnosticMessage };
    } catch (err: any) {
      console.warn("[MODEL] MediaPipe vision initialization failed, attempting fallback:", err);
      // Attempt fallback to face-api.js for face detection
      try {
        const faceapi = await import("face-api.js");
        await faceapi.nets.tinyFaceDetector.loadFromUri("/models");
        this.faceApiRef = faceapi;
        this.faceApiLoaded = true;
        this.status = "MODEL_FALLBACK";
        this.diagnosticMessage = `MediaPipe unavailable (${err?.message || "wasm error"}). Degraded mode: face detection active, object detection limited.`;
        this.isInitializing = false;
        console.log("[MODEL] Fallback: face-api.js active.");
        return { success: true, status: this.status, message: this.diagnosticMessage };
      } catch (fallbackErr: any) {
        this.status = "MODEL_ERROR";
        this.diagnosticMessage = `Vision models failed to initialize: ${err?.message || "WASM/WebGL error"}.`;
        this.isInitializing = false;
        console.error("[MODEL] Error: All vision model initialization attempts failed:", fallbackErr);
        return { success: false, status: this.status, message: this.diagnosticMessage };
      }
    }
  }

  /**
   * Processes a live video frame and returns normalized detections.
   * Frame must be validated before calling.
   */
  public detectFrame(
    video: HTMLVideoElement,
    timestampMs: number = performance.now()
  ): {
    objects: NormalizedDetection[];
    faces: NormalizedDetection[];
    personCount: number;
    phoneCount: number;
    faceCount: number;
    rawPhoneCandidate?: NormalizedDetection;
  } {
    if (!this.isReady()) {
      return {
        objects: [],
        faces: [],
        personCount: 0,
        phoneCount: 0,
        faceCount: 0,
      };
    }

    // MediaPipe requires strictly monotonically increasing timestamps for VIDEO mode
    const now = Math.max(timestampMs, this.lastTimestampMs + 1);
    this.lastTimestampMs = now;

    const vw = video.videoWidth || 640;
    const vh = video.videoHeight || 480;

    const normalizedObjects: NormalizedDetection[] = [];
    const normalizedFaces: NormalizedDetection[] = [];

    let personCount = 0;
    let phoneCount = 0;
    let rawPhoneCandidate: NormalizedDetection | undefined = undefined;

    // 1. Run Object Detection (person, cell phone, laptop, book)
    if (this.objectDetector) {
      try {
        const result = this.objectDetector.detectForVideo(video, now);
        if (result && result.detections) {
          for (const det of result.detections) {
            const cat = det.categories?.[0];
            if (!cat) continue;

            const name = (cat.categoryName || "").toLowerCase();
            const score = cat.score ?? 0;
            const bbox = det.boundingBox;

            if (!bbox) continue;

            // Normalize bounding box coordinates to 0..1
            const normalizedBox: BoundingBox = {
              x: Math.max(0, Math.min(1, bbox.originX / vw)),
              y: Math.max(0, Math.min(1, bbox.originY / vh)),
              width: Math.max(0, Math.min(1, bbox.width / vw)),
              height: Math.max(0, Math.min(1, bbox.height / vh)),
            };

            const normDet: NormalizedDetection = {
              className: name,
              confidence: score,
              boundingBox: normalizedBox,
              timestamp: Date.now(),
            };

            if (name === "person" && score >= (this.config.personThreshold || 0.45)) {
              personCount++;
              normalizedObjects.push(normDet);
            } else if (name === "cell phone" && score >= (this.config.phoneThreshold || 0.38)) {
              phoneCount++;
              normalizedObjects.push(normDet);
              if (!rawPhoneCandidate || score > rawPhoneCandidate.confidence) {
                rawPhoneCandidate = normDet;
              }
            } else if (name === "laptop" || name === "book") {
              normalizedObjects.push(normDet);
            }
          }
        }
      } catch (e) {
        console.warn("[INFERENCE] ObjectDetector frame inference note:", e);
      }
    }

    // 2. Run Face Detection
    let faceCount = 0;
    if (this.faceDetector) {
      try {
        const fResult = this.faceDetector.detectForVideo(video, now);
        if (fResult && fResult.detections) {
          for (const det of fResult.detections) {
            const score = det.categories?.[0]?.score ?? 0.5;
            const bbox = det.boundingBox;
            if (!bbox) continue;

            const normalizedBox: BoundingBox = {
              x: Math.max(0, Math.min(1, bbox.originX / vw)),
              y: Math.max(0, Math.min(1, bbox.originY / vh)),
              width: Math.max(0, Math.min(1, bbox.width / vw)),
              height: Math.max(0, Math.min(1, bbox.height / vh)),
            };

            const faceDet: NormalizedDetection = {
              className: "face",
              confidence: score,
              boundingBox: normalizedBox,
              timestamp: Date.now(),
            };

            normalizedFaces.push(faceDet);
            faceCount++;
          }
        }
      } catch (fe) {
        console.warn("[INFERENCE] FaceDetector frame inference note:", fe);
      }
    } else if (this.faceApiRef && this.faceApiLoaded) {
      // ── Fallback: Async face-api.js detection with result caching ──
      // face-api.js is async; we fire-and-forget detection and cache results.
      // On each sync call, we return the most recent cached result (<2s old).
      if (!this.faceApiDetecting) {
        this.faceApiDetecting = true;
        const capturedVw = vw;
        const capturedVh = vh;
        this.faceApiRef
          .detectAllFaces(
            video,
            new this.faceApiRef.TinyFaceDetectorOptions({
              inputSize: 224,
              scoreThreshold: 0.35,
            })
          )
          .then((results: any[]) => {
            this.faceApiCachedResult = {
              faces: (results || []).map((r: any) => ({
                className: "face" as const,
                confidence: r.score ?? 0.6,
                boundingBox: {
                  x: Math.max(0, Math.min(1, (r.box?.x ?? 0) / capturedVw)),
                  y: Math.max(0, Math.min(1, (r.box?.y ?? 0) / capturedVh)),
                  width: Math.max(0, Math.min(1, (r.box?.width ?? 0) / capturedVw)),
                  height: Math.max(0, Math.min(1, (r.box?.height ?? 0) / capturedVh)),
                },
                timestamp: Date.now(),
              })),
              timestamp: Date.now(),
            };
            this.faceApiDetecting = false;
          })
          .catch((err: any) => {
            console.warn("[INFERENCE] face-api.js fallback detection note:", err);
            this.faceApiDetecting = false;
          });
      }

      // Use cached face-api result if fresh (<2s old)
      if (
        this.faceApiCachedResult.timestamp > 0 &&
        Date.now() - this.faceApiCachedResult.timestamp < 2000
      ) {
        normalizedFaces.push(...this.faceApiCachedResult.faces);
        faceCount = this.faceApiCachedResult.faces.length;
      }
    }

    // Diagnostic console trace (throttled deterministically every 25 frames)
    this.frameCount++;
    if (this.frameCount % 25 === 0) {
      console.log(
        `[INFERENCE] person=${personCount} face=${faceCount} phone=${phoneCount}` +
        ` (res=${vw}x${vh}, mode=${this.status}, frame#${this.frameCount})`
      );
    }
    // Extra verbose logging for first 10 frames to help debug initialization
    if (this.frameCount <= 10) {
      console.log(
        `[INFERENCE:INIT] frame#${this.frameCount}: person=${personCount} face=${faceCount} phone=${phoneCount}` +
        ` objDetector=${!!this.objectDetector} faceDetector=${!!this.faceDetector} faceApi=${this.faceApiLoaded}`
      );
    }

    return {
      objects: normalizedObjects,
      faces: normalizedFaces,
      personCount,
      phoneCount,
      faceCount,
      rawPhoneCandidate,
    };
  }

  public release(): void {
    if (this.objectDetector) {
      try {
        this.objectDetector.close();
      } catch {}
      this.objectDetector = null;
    }
    if (this.faceDetector) {
      try {
        this.faceDetector.close();
      } catch {}
      this.faceDetector = null;
    }
    this.faceApiCachedResult = { faces: [], timestamp: 0 };
    this.faceApiDetecting = false;
    this.status = "MODEL_LOADING";
    this.isInitializing = false;
    console.log("[MODEL] Vision pipeline released.");
  }
}
