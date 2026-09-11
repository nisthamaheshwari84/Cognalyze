"use client";

import React, { useEffect, useState } from "react";

export default function PwaProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosPrompt, setShowIosPrompt] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // 1. Standalone Check
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(standalone);

    // 2. Online / Offline Listener
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // 3. Register Service Worker
    if ("serviceWorker" in navigator && process.env.NODE_ENV !== "test") {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("[PWA] Service Worker registered with scope:", reg.scope);
          })
          .catch((err) => {
            console.error("[PWA] Service Worker registration failed:", err);
          });
      });
    }

    // 4. Capture beforeinstallprompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      const dismissed = localStorage.getItem("cognalyze_pwa_dismissed");
      if (!dismissed && !standalone) {
        setShowInstallBanner(true);
      }
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // 5. iOS Safari Detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);
    if (isIosDevice && isSafari && !standalone) {
      setIsIos(true);
      const dismissedIos = localStorage.getItem("cognalyze_pwa_ios_dismissed");
      if (!dismissedIos) {
        setShowIosPrompt(true);
      }
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    }
  };

  const dismissBanner = () => {
    setShowInstallBanner(false);
    localStorage.setItem("cognalyze_pwa_dismissed", "true");
  };

  const dismissIosPrompt = () => {
    setShowIosPrompt(false);
    localStorage.setItem("cognalyze_pwa_ios_dismissed", "true");
  };

  return (
    <>
      {/* ── A. OFFLINE WARNING BANNER ── */}
      {!isOnline && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            backgroundColor: "#dc2626",
            color: "#ffffff",
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontSize: 12,
            fontWeight: 700,
            boxShadow: "0 4px 14px rgba(0,0,0,0.5)",
            animation: "slideDown 0.3s ease-out"
          }}
        >
          <span>📡</span>
          <span>
            You are offline. Cached schedules & sheets remain viewable. Reconnect for real-time AI simulations.
          </span>
        </div>
      )}

      {/* ── B. PWA INSTALL BANNER (DESKTOP & ANDROID) ── */}
      {showInstallBanner && !isStandalone && (
        <div
          style={{
            position: "fixed",
            bottom: 20,
            left: "50%",
            transform: "translateX(-50%)",
            width: "calc(100% - 32px)",
            maxWidth: 520,
            zIndex: 9000,
            backgroundColor: "rgba(15, 23, 42, 0.95)",
            border: "1px solid rgba(99, 102, 241, 0.4)",
            borderRadius: 16,
            padding: "12px 16px",
            backdropFilter: "blur(20px)",
            boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.8), 0 0 25px rgba(99, 102, 241, 0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            animation: "slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 10,
                background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                flexShrink: 0,
                boxShadow: "0 4px 12px rgba(99, 102, 241, 0.4)"
              }}
            >
              ⚡
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#ffffff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Install Cognalyze
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", lineHeight: 1.3 }}>
                Fast one-tap launch, offline support & full-screen arena.
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <button
              onClick={handleInstallClick}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "none",
                background: "linear-gradient(135deg, #6366f1 0%, #a855f7 100%)",
                color: "#ffffff",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 10px rgba(99, 102, 241, 0.3)",
                minHeight: 36
              }}
            >
              Install
            </button>
            <button
              onClick={dismissBanner}
              aria-label="Dismiss install prompt"
              style={{
                background: "transparent",
                border: "none",
                color: "#64748b",
                fontSize: 18,
                cursor: "pointer",
                padding: "6px",
                lineHeight: 1
              }}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ── C. IOS SAFARI "ADD TO HOME SCREEN" PROMPT ── */}
      {showIosPrompt && isIos && !isStandalone && (
        <div
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            width: "calc(100% - 32px)",
            maxWidth: 440,
            zIndex: 9000,
            backgroundColor: "rgba(15, 23, 42, 0.96)",
            border: "1px solid rgba(99, 102, 241, 0.35)",
            borderRadius: 16,
            padding: "14px 16px",
            backdropFilter: "blur(20px)",
            boxShadow: "0 20px 40px -10px rgba(0, 0, 0, 0.8)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12
          }}
        >
          <div style={{ fontSize: 12, color: "#cbd5e1", lineHeight: 1.5 }}>
            <span style={{ fontWeight: 800, color: "#ffffff", display: "block", marginBottom: 2 }}>
              Install Cognalyze on iOS
            </span>
            Tap <strong style={{ color: "#38bdf8" }}>Share (⎙)</strong> then tap{" "}
            <strong style={{ color: "#38bdf8" }}>&quot;Add to Home Screen&quot;</strong> for full-screen mode.
          </div>
          <button
            onClick={dismissIosPrompt}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "none",
              color: "#cbd5e1",
              fontSize: 11,
              fontWeight: 700,
              padding: "6px 10px",
              borderRadius: 6,
              cursor: "pointer"
            }}
          >
            Got it
          </button>
        </div>
      )}

      {children}
    </>
  );
}
