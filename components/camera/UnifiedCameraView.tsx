"use client";

import React, { useEffect, useRef, useState } from "react";
import { CameraEngine } from "@/lib/camera/camera-engine";
import { CameraMode, CameraObservation, CameraQualityMetrics, CameraReadinessState } from "@/lib/camera/types";

interface UnifiedCameraViewProps {
  mode?: CameraMode;
  engineRef?: React.MutableRefObject<CameraEngine | null>;
  onObservation?: (obs: CameraObservation) => void;
  onReadinessChange?: (readiness: CameraReadinessState) => void;
  showReadinessBadge?: boolean;
  showCoachingPill?: boolean;
  showDebugPanel?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export default function UnifiedCameraView({
  mode = "interview",
  engineRef,
  onObservation,
  onReadinessChange,
  showReadinessBadge = true,
  showCoachingPill = true,
  showDebugPanel: initialShowDebug = false,
  style,
  className = "",
}: UnifiedCameraViewProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const internalEngineRef = useRef<CameraEngine | null>(null);

  const [metrics, setMetrics] = useState<CameraQualityMetrics | null>(null);
  const [readiness, setReadiness] = useState<CameraReadinessState | null>(null);
  const [recentTip, setRecentTip] = useState<string>("");
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [showDebug, setShowDebug] = useState<boolean>(initialShowDebug);

  useEffect(() => {
    let engine = engineRef?.current;
    if (!engine) {
      engine = new CameraEngine(mode);
      internalEngineRef.current = engine;
      if (engineRef) engineRef.current = engine;
    }

    let isMounted = true;

    async function init() {
      if (!engine) return;
      const { stream } = await engine.initializeMedia();

      if (!isMounted) return;

      if (stream && videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});

        engine.startObservationLoop(videoRef.current, {
          onObservation: (obs) => {
            if (isMounted) {
              if (obs.actionableTip && showCoachingPill) {
                setRecentTip(obs.actionableTip);
                setTimeout(() => {
                  if (isMounted) setRecentTip("");
                }, 6000);
              }
              onObservation?.(obs);
            }
          },
          onMetrics: (m) => {
            if (isMounted) {
              setMetrics(m);
              const r = engine?.getReadiness();
              if (r) {
                setReadiness(r);
                onReadinessChange?.(r);
              }
              const vol = engine?.getAudioVolume() || 0;
              setAudioLevel(vol);
            }
          },
        });
      } else {
        const r = engine.getReadiness();
        setReadiness(r);
        onReadinessChange?.(r);
      }
    }

    init();

    return () => {
      isMounted = false;
      if (internalEngineRef.current) {
        internalEngineRef.current.stop();
      }
    };
  }, [mode]);

  const isProctoring = mode === "proctoring" || mode === "assessment";
  const effectivePersonCount = metrics ? Math.max(metrics.personCount ?? 0, metrics.faceCount ?? 0) : 0;
  const isMultiple = effectivePersonCount > 1;
  const isMissing = !metrics?.faceDetected && effectivePersonCount === 0;
  const isPhone = !!metrics?.phoneDetected;

  const faceStatus = isPhone && isProctoring
    ? "phone"
    : isMultiple && isProctoring
    ? "multiple"
    : isMissing
    ? "missing"
    : "ok";

  const ovalColor =
    faceStatus === "ok"
      ? "#10B981"
      : faceStatus === "phone"
      ? "#EF4444"
      : faceStatus === "multiple"
      ? "#F59E0B"
      : "#EF4444";

  const ovalLabel =
    faceStatus === "ok"
      ? (isProctoring ? `✓ 1 CANDIDATE DETECTED` : `✓ FACE ALIGNED`)
      : faceStatus === "phone"
      ? `⚠ PHONE DETECTED${metrics?.lastPhoneConfidence ? ` (${Math.round(metrics.lastPhoneConfidence * 100)}%)` : ""}`
      : faceStatus === "multiple"
      ? `⚠ MULTIPLE PEOPLE (${effectivePersonCount})`
      : `ALIGN FACE IN FRAME`;

  return (
    <div
      className={`unified-camera-container ${className}`}
      style={{
        position: "relative",
        borderRadius: 12,
        overflow: "hidden",
        background: "#09090B",
        border: "1px solid #27272A",
        aspectRatio: "4/3",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      {/* Video Feed */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transform: "scaleX(-1)",
          display: readiness?.fallbackMode === "voice_only" || readiness?.fallbackMode === "text_only" ? "none" : "block",
        }}
      />

      {/* Voice-Only Fallback Screen */}
      {readiness?.fallbackMode === "voice_only" && (
        <div style={{ textAlign: "center", padding: 20, color: "#A1A1AA" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🎙️</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>Voice-Only Mode Active</div>
          <div style={{ fontSize: 11, color: "#71717A", marginTop: 4 }}>Camera unavailable; microphone active</div>
          {/* Audio waveform meter */}
          <div style={{ display: "flex", justifyContent: "center", gap: 3, marginTop: 12 }}>
            {[1, 2, 3, 4, 5].map((bar) => (
              <div
                key={bar}
                style={{
                  width: 4,
                  height: Math.min(28, Math.max(6, (audioLevel / 255) * 35 * (bar % 2 === 0 ? 1.2 : 0.8))),
                  background: "#10B981",
                  borderRadius: 2,
                  transition: "height 0.1s ease",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Text-Only Fallback Screen */}
      {readiness?.fallbackMode === "text_only" && (
        <div style={{ textAlign: "center", padding: 20, color: "#A1A1AA" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⌨️</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#FFFFFF" }}>Text-Only Practice Mode</div>
          <div style={{ fontSize: 11, color: "#71717A", marginTop: 4 }}>Media access denied; continuing in text mode</div>
        </div>
      )}

      {/* Face Oval Framing Guide (Only in camera mode) */}
      {readiness?.camera && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: "56%",
              height: "74%",
              border: `2px solid ${ovalColor}`,
              borderRadius: "50%",
              boxShadow: `0 0 25px ${ovalColor}30, inset 0 0 15px ${ovalColor}15`,
              transition: "all 0.3s ease",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "7%",
              left: "50%",
              transform: "translateX(-50%)",
              padding: "3px 12px",
              background: "rgba(9, 9, 11, 0.75)",
              border: `1px solid ${ovalColor}60`,
              borderRadius: 999,
              whiteSpace: "nowrap",
              backdropFilter: "blur(6px)",
            }}
          >
            <span style={{ fontSize: 9.5, color: ovalColor, fontWeight: 700, letterSpacing: 0.8 }}>
              {ovalLabel}
            </span>
          </div>
        </div>
      )}

      {/* Top Header Strip: Mode & Readiness */}
      <div
        style={{
          position: "absolute",
          top: 8,
          left: 8,
          right: 8,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 3,
          pointerEvents: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div
            style={{
              padding: "2px 8px",
              borderRadius: 4,
              background: "rgba(9, 9, 11, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: 0.5,
              color: isProctoring ? "#F59E0B" : "#356AE6",
              textTransform: "uppercase",
              backdropFilter: "blur(4px)",
            }}
          >
            {mode.replace("_", " ")}
          </div>

          {/* Discreet debug toggle button */}
          <button
            onClick={() => setShowDebug((prev) => !prev)}
            style={{
              pointerEvents: "auto",
              background: "rgba(9, 9, 11, 0.6)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 4,
              color: showDebug ? "#60A5FA" : "#71717A",
              fontSize: 9,
              padding: "1px 5px",
              cursor: "pointer",
            }}
            title="Toggle Vision Diagnostic Overlay"
          >
            ⚙️ {showDebug ? "DEBUG ON" : "DIAG"}
          </button>
        </div>

        {showReadinessBadge && readiness && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "2px 8px",
              borderRadius: 4,
              background: "rgba(9, 9, 11, 0.8)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              fontSize: 9,
              color: readiness.allReady ? "#10B981" : "#A1A1AA",
              fontWeight: 600,
              backdropFilter: "blur(4px)",
            }}
          >
            <span>{readiness.camera ? "Cam ✓" : "Cam ✕"}</span>
            {isProctoring && (
              <span>{isPhone ? "📱 ⚠" : "📱 ✕"}</span>
            )}
            <span>{effectivePersonCount > 1 ? "👥 ⚠" : effectivePersonCount === 1 ? "👤 1" : "👤 0"}</span>
            <span>{readiness.lightingOk ? "Light ✓" : "Light ⚠"}</span>
          </div>
        )}
      </div>

      {/* Internal Vision Debug Panel (Section 33) */}
      {showDebug && (
        <div
          style={{
            position: "absolute",
            top: 36,
            left: 8,
            right: 8,
            padding: "8px 10px",
            background: "rgba(9, 9, 11, 0.92)",
            border: "1px solid rgba(59, 130, 246, 0.4)",
            borderRadius: 6,
            fontSize: 9,
            lineHeight: 1.4,
            color: "#E2E8F0",
            fontFamily: "monospace",
            zIndex: 10,
            backdropFilter: "blur(8px)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #334155", paddingBottom: 4, marginBottom: 4 }}>
            <span style={{ color: "#60A5FA", fontWeight: 700 }}>VISION PIPELINE TELEMETRY</span>
            <span style={{ color: "#94A3B8" }}>{metrics?.inferenceFps || 0} FPS</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 8px" }}>
            <div>Camera: <span style={{ color: readiness?.camera ? "#10B981" : "#EF4444" }}>{readiness?.camera ? "READY" : "NO STREAM"}</span></div>
            <div>Video: <span style={{ color: videoRef.current && !videoRef.current.paused ? "#10B981" : "#F59E0B" }}>{videoRef.current?.videoWidth || 0}×{videoRef.current?.videoHeight || 0}</span></div>
            <div>Model: <span style={{ color: metrics?.visionModelStatus === "MODEL_READY" ? "#10B981" : metrics?.visionModelStatus === "MODEL_FALLBACK" ? "#F59E0B" : "#EF4444" }}>{metrics?.visionModelStatus || "LOADING"}</span></div>
            <div>State: <span style={{ color: "#60A5FA" }}>{metrics?.proctoringState || "READY"}</span></div>
            <div>Persons: <span style={{ color: (metrics?.personCount ?? 0) === 1 ? "#10B981" : "#F59E0B", fontWeight: 700 }}>{metrics?.personCount ?? 0}</span></div>
            <div>Faces: <span style={{ color: (metrics?.faceCount ?? 0) === 1 ? "#10B981" : "#F59E0B", fontWeight: 700 }}>{metrics?.faceCount ?? 0}</span></div>
            <div>Phones: <span style={{ color: (metrics?.phoneCount ?? 0) > 0 ? "#EF4444" : "#10B981", fontWeight: 700 }}>{metrics?.phoneCount ?? 0}</span></div>
            <div>Phone Conf: <span style={{ color: "#94A3B8" }}>{metrics?.lastPhoneConfidence ? `${(metrics.lastPhoneConfidence * 100).toFixed(1)}%` : "N/A"}</span></div>
          </div>
        </div>
      )}

      {/* Non-intrusive Live Coaching Pill */}
      {recentTip && (
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 12,
            right: 12,
            padding: "6px 12px",
            background: "rgba(22, 42, 67, 0.9)",
            border: "1px solid rgba(53, 106, 230, 0.5)",
            borderRadius: 6,
            zIndex: 4,
            backdropFilter: "blur(8px)",
            color: "#FFFFFF",
            fontSize: 10.5,
            lineHeight: 1.4,
            display: "flex",
            alignItems: "center",
            gap: 6,
            animation: "fadeIn 0.25s ease",
          }}
        >
          <span style={{ fontSize: 13, flexShrink: 0 }}>💡</span>
          <span>{recentTip}</span>
        </div>
      )}

      {/* Bottom Audio Level Indicator */}
      {readiness?.microphone && audioLevel > 5 && (
        <div
          style={{
            position: "absolute",
            bottom: 4,
            left: 8,
            display: "flex",
            alignItems: "center",
            gap: 4,
            zIndex: 3,
            padding: "2px 6px",
            borderRadius: 3,
            background: "rgba(9, 9, 11, 0.7)",
          }}
        >
          <span style={{ fontSize: 8, color: "#10B981", fontWeight: 700 }}>MIC</span>
          <div style={{ width: 36, height: 3, background: "#27272A", borderRadius: 2, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${Math.min(100, (audioLevel / 120) * 100)}%`,
                background: "#10B981",
                transition: "width 0.1s ease",
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
