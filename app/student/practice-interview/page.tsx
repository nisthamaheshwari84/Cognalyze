"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import {
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  Lock,
  AlertCircle,
  Dna,
} from "lucide-react";

const RAW_ENV_ENGINE_ORIGIN = (
  process.env.NEXT_PUBLIC_INTERVIEW_INTELLIGENCE_URL || ""
).trim().replace(/\/+$/, "");

const DEFAULT_ENGINE_ORIGIN =
  RAW_ENV_ENGINE_ORIGIN && !/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(RAW_ENV_ENGINE_ORIGIN)
    ? RAW_ENV_ENGINE_ORIGIN
    : "https://interview-intelligence-sigma.vercel.app";

interface LaunchSessionData {
  ticket: string;
  expiresAt: string;
  launchOrigin: string;
  postLaunchUrl: string;
  identity: {
    userId: string;
    username: string;
    fullName: string;
  };
  contextHints?: {
    targetRole?: string;
    companyContext?: string;
    opportunityId?: string;
    roundType?: string;
    focusAreas?: string[];
  };
}

export default function StudentPracticeInterviewPage() {
  const [isServerHealthy, setIsServerHealthy] = useState<boolean>(true);
  const [checking, setChecking] = useState<boolean>(false);
  const [iframeLoaded, setIframeLoaded] = useState<boolean>(false);

  // Unified Identity Launch State (non-blocking: iframe starts loading immediately in parallel)
  const [launchState, setLaunchState] = useState<
    "initializing" | "ready" | "unauthenticated" | "forbidden" | "error"
  >("initializing");
  const [launchData, setLaunchData] = useState<LaunchSessionData | null>(null);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [engineOriginLabel, setEngineOriginLabel] = useState<string>(DEFAULT_ENGINE_ORIGIN);
  const [openingDedicated, setOpeningDedicated] = useState<boolean>(false);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const ticketDispatchedRef = useRef<string | null>(null);
  const iframeReadyRef = useRef<boolean>(false);

  const readContextHintsFromUrl = useCallback(() => {
    if (typeof window === "undefined") return {};
    const params = new URLSearchParams(window.location.search);
    const focus = params.get("focus") || params.get("skills");
    return {
      targetRole: params.get("role") || params.get("title") || undefined,
      companyContext: params.get("company") || undefined,
      opportunityId: params.get("oppId") || undefined,
      roundType: params.get("mode") || undefined,
      focusAreas: focus ? focus.split(",").map((s) => s.trim()).filter(Boolean) : undefined,
    };
  }, []);

  const checkServerHealth = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/health", { method: "GET", cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setIsServerHealthy(Boolean(data.reachable ?? data.status === "ok"));
        if (data.engineOrigin) {
          setEngineOriginLabel(data.engineOrigin);
        }
      } else {
        setIsServerHealthy(false);
      }
    } catch {
      setIsServerHealthy(false);
    } finally {
      setChecking(false);
    }
  }, []);

  const requestLaunchTicket = useCallback(async (): Promise<LaunchSessionData | null> => {
    try {
      const hints = readContextHintsFromUrl();
      const res = await fetch("/api/interview-intelligence/launch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify(hints),
      });

      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        setLaunchState("unauthenticated");
        setLaunchError(data.message || "Please sign in to Cognalyze to access Interview Intelligence.");
        return null;
      }
      if (res.status === 403) {
        setLaunchState("forbidden");
        setLaunchError(data.message || "A student account is required to launch the Interview Arena.");
        return null;
      }
      if (!res.ok || !data.success || !data.ticket) {
        setLaunchState("error");
        setLaunchError(data.message || "Unable to issue verified Cognalyze launch ticket.");
        return null;
      }

      const payload: LaunchSessionData = {
        ticket: data.ticket,
        expiresAt: data.expiresAt,
        launchOrigin: data.launchOrigin || DEFAULT_ENGINE_ORIGIN,
        postLaunchUrl: data.postLaunchUrl,
        identity: data.identity,
        contextHints: data.contextHints,
      };
      setLaunchData(payload);
      setEngineOriginLabel(payload.launchOrigin);
      setLaunchState("ready");
      setLaunchError(null);
      return payload;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : null;
      setLaunchState("error");
      setLaunchError(msg || "Network error initializing Interview Intelligence session.");
      return null;
    }
  }, [readContextHintsFromUrl]);

  useEffect(() => {
    let active = true;
    async function bootstrap() {
      if (!active) return;
      await Promise.all([requestLaunchTicket(), checkServerHealth()]);
    }
    void bootstrap();
    const interval = setInterval(() => {
      void checkServerHealth();
    }, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [requestLaunchTicket, checkServerHealth]);

  const dispatchTicketToIframe = useCallback(
    async (payload: LaunchSessionData, forceRefresh = false) => {
      const targetWindow = iframeRef.current?.contentWindow;
      if (!targetWindow) return;

      let activePayload = payload;
      if (forceRefresh || ticketDispatchedRef.current === activePayload.ticket) {
        const refreshed = await requestLaunchTicket();
        if (!refreshed) return;
        activePayload = refreshed;
      }

      ticketDispatchedRef.current = activePayload.ticket;
      targetWindow.postMessage(
        {
          type: "COGNALYZE_LAUNCH_TICKET",
          ticket: activePayload.ticket,
          contextHints: activePayload.contextHints || {},
        },
        activePayload.launchOrigin
      );
    },
    [requestLaunchTicket]
  );

  // Immediately dispatch ticket if iframe finished booting before /launch completed
  useEffect(() => {
    if (launchState === "ready" && launchData && iframeReadyRef.current && !ticketDispatchedRef.current) {
      void dispatchTicketToIframe(launchData, false);
    }
  }, [launchState, launchData, dispatchTicketToIframe]);

  // Secure Origin-Validated Handoff via postMessage (never exposes tokens in URL query strings)
  useEffect(() => {
    const expectedOrigin = (launchData?.launchOrigin || engineOriginLabel || DEFAULT_ENGINE_ORIGIN).replace(
      /\/+$/,
      ""
    );

    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== expectedOrigin) return;
      if (!event.data || typeof event.data !== "object") return;
      const msgType = String((event.data as { type?: string }).type || "");

      if (msgType === "COGNALYZE_READY") {
        iframeReadyRef.current = true;
        setIframeLoaded(true);
        setIsServerHealthy(true);
        if (launchData && launchState === "ready") {
          void dispatchTicketToIframe(launchData, false);
        }
      } else if (msgType === "COGNALYZE_TICKET_NEEDED") {
        iframeReadyRef.current = true;
        setIframeLoaded(true);
        if (launchData) {
          void dispatchTicketToIframe(launchData, true);
        } else {
          void requestLaunchTicket();
        }
      } else if (msgType === "COGNALYZE_INTERVIEW_COMPLETED") {
        void checkServerHealth();
      } else if (msgType === "COGNALYZE_LOGOUT_REQUESTED") {
        window.location.href = "/login?redirect=/student/practice-interview";
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [launchData, launchState, engineOriginLabel, dispatchTicketToIframe, requestLaunchTicket, checkServerHealth]);

  // Dedicated window launch strictly via POST form (single-use ticket in POST body, zero tokens in URL)
  const handleOpenDedicatedWindow = async () => {
    if (openingDedicated) return;
    setOpeningDedicated(true);
    try {
      const fresh = await requestLaunchTicket();
      if (!fresh) return;

      const form = document.createElement("form");
      form.method = "POST";
      form.action = fresh.postLaunchUrl;
      form.target = "_blank";
      form.style.display = "none";

      const ticketInput = document.createElement("input");
      ticketInput.type = "hidden";
      ticketInput.name = "ticket";
      ticketInput.value = fresh.ticket;
      form.appendChild(ticketInput);

      if (fresh.contextHints?.targetRole) {
        const roleInput = document.createElement("input");
        roleInput.type = "hidden";
        roleInput.name = "targetRole";
        roleInput.value = fresh.contextHints.targetRole;
        form.appendChild(roleInput);
      }
      if (fresh.contextHints?.companyContext) {
        const compInput = document.createElement("input");
        compInput.type = "hidden";
        compInput.name = "companyContext";
        compInput.value = fresh.contextHints.companyContext;
        form.appendChild(compInput);
      }

      document.body.appendChild(form);
      form.submit();
      document.body.removeChild(form);
    } finally {
      setOpeningDedicated(false);
    }
  };

  const activeOrigin = launchData?.launchOrigin || engineOriginLabel || DEFAULT_ENGINE_ORIGIN;
  const shouldShowIframe =
    launchState === "initializing" || (launchState === "ready" && Boolean(launchData));

  // Ensure loading overlay never gets stuck if iframe completes initial load before React attaches onLoad
  useEffect(() => {
    if (!shouldShowIframe || iframeLoaded) return;
    const timer = window.setTimeout(() => {
      setIframeLoaded(true);
    }, 2200);
    return () => window.clearTimeout(timer);
  }, [shouldShowIframe, iframeLoaded]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1", display: "flex", flexDirection: "column" }}>
      {/* Global App Header Navigation */}
      <AppNav />

      {/* Arena Sub-Header Control Bar */}
      <div
        style={{
          backgroundColor: "#FFFFFF",
          borderBottom: "1px solid #E4E1DA",
          padding: "10px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: "linear-gradient(135deg, #162A43, #356AE6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              fontSize: 16,
              fontWeight: 800,
            }}
          >
            ⚡
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <h1 style={{ fontSize: 15, fontWeight: 800, color: "#162A43", margin: 0 }}>
                Personalized Interview Arena
              </h1>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 800,
                  textTransform: "uppercase",
                  padding: "2px 8px",
                  borderRadius: 6,
                  backgroundColor: "#EFF4FE",
                  color: "#356AE6",
                  border: "1px solid #D2E0FB",
                }}
              >
                Autonomous Studio
              </span>
              {launchData?.identity && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: "2px 8px",
                    borderRadius: 6,
                    backgroundColor: "#EAF4EE",
                    color: "#2E7D5B",
                    border: "1px solid #C8E4D3",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <ShieldCheck size={11} />
                  @{launchData.identity.username} · Student DNA Synced
                </span>
              )}
            </div>
            <p style={{ fontSize: 11, color: "#667085", margin: 0 }}>
              Single-Identity Adaptive Orchestration · Shared Cognalyze Student DNA · Real-Time Proctoring
            </p>
          </div>
        </div>

        {/* Status & Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div
            title={`Engine endpoint: ${activeOrigin}`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 6,
              backgroundColor: isServerHealthy ? "#EAF4EE" : "#FEF7ED",
              color: isServerHealthy ? "#2E7D5B" : "#B7791F",
              border: `1px solid ${isServerHealthy ? "#C8E4D3" : "#F8D8A7"}`,
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                backgroundColor: isServerHealthy ? "#2E7D5B" : "#B7791F",
              }}
            />
            <span>{isServerHealthy ? "Engine Active" : "Engine Offline"}</span>
            <button
              onClick={() => void checkServerHealth()}
              disabled={checking}
              title="Refresh engine connection"
              style={{
                border: "none",
                background: "transparent",
                color: "inherit",
                cursor: "pointer",
                padding: 0,
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <RefreshCw size={11} className={checking ? "animate-spin" : ""} />
            </button>
          </div>

          {launchState === "ready" && launchData && (
            <button
              type="button"
              onClick={() => void handleOpenDedicatedWindow()}
              disabled={openingDedicated}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                fontWeight: 700,
                padding: "6px 12px",
                borderRadius: 7,
                backgroundColor: "#FFFFFF",
                color: "#356AE6",
                border: "1px solid #D2E0FB",
                cursor: openingDedicated ? "wait" : "pointer",
                boxShadow: "0 1px 2px rgba(16,24,40,0.04)",
              }}
            >
              <span>{openingDedicated ? "Launching..." : "Open Dedicated Window"}</span>
              <ExternalLink size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", position: "relative" }}>
        {launchState === "unauthenticated" ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
          >
            <div
              style={{
                maxWidth: 460,
                width: "100%",
                backgroundColor: "#FFFFFF",
                border: "1px solid #E4E1DA",
                borderRadius: 16,
                padding: 32,
                textAlign: "center",
                boxShadow: "0 4px 16px rgba(16, 24, 40, 0.05)",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: "#EFF4FE",
                  color: "#356AE6",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 16,
                }}
              >
                <Lock size={22} />
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "#162A43", margin: "0 0 8px" }}>
                Sign In with Your Cognalyze Account
              </h2>
              <p style={{ fontSize: 13, color: "#667085", lineHeight: 1.6, margin: "0 0 24px" }}>
                Interview Intelligence automatically connects to your verified Cognalyze identity, @username,
                and Student DNA — no separate registration needed.
              </p>
              <Link
                href="/login?redirect=/student/practice-interview"
                style={{
                  padding: "10px 20px",
                  borderRadius: 9,
                  backgroundColor: "#162A43",
                  color: "#FFFFFF",
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <Dna size={15} />
                <span>Sign In to Cognalyze</span>
              </Link>
            </div>
          </div>
        ) : launchState === "forbidden" || launchState === "error" ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}
          >
            <div
              style={{
                maxWidth: 460,
                width: "100%",
                backgroundColor: "#FFFFFF",
                border: "1px solid #FECDCA",
                borderRadius: 16,
                padding: 28,
                textAlign: "center",
              }}
            >
              <AlertCircle size={28} style={{ color: "#D92D20", margin: "0 auto 12px" }} />
              <h2 style={{ fontSize: 16, fontWeight: 800, color: "#162A43", margin: "0 0 8px" }}>
                Unable to Launch Personalized Interview Arena
              </h2>
              <p style={{ fontSize: 13, color: "#667085", margin: "0 0 20px" }}>
                {launchError || "Could not verify interview handoff session."}
              </p>
              <button
                type="button"
                onClick={() => void requestLaunchTicket()}
                style={{
                  padding: "9px 18px",
                  borderRadius: 8,
                  backgroundColor: "#356AE6",
                  color: "#FFFFFF",
                  border: "none",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Retry Handshake
              </button>
            </div>
          </div>
        ) : shouldShowIframe ? (
          <div style={{ flex: 1, position: "relative", minHeight: "calc(100vh - 120px)" }}>
            {!iframeLoaded && (
              <div
                style={{
                  position: "absolute",
                  top: 14,
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 14px",
                  borderRadius: 999,
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  border: "1px solid #D2E0FB",
                  boxShadow: "0 4px 12px rgba(16, 24, 40, 0.08)",
                  zIndex: 5,
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: "50%",
                    border: "2px solid #D2E0FB",
                    borderTopColor: "#356AE6",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#162A43" }}>
                  Connecting Interview Studio...
                </span>
              </div>
            )}
            <iframe
              ref={iframeRef}
              src={`${activeOrigin}/?embed=1`}
              onLoad={() => {
                setIframeLoaded(true);
                setIsServerHealthy(true);
                if (launchState === "ready" && launchData && !ticketDispatchedRef.current) {
                  window.setTimeout(() => {
                    if (!ticketDispatchedRef.current) {
                      void dispatchTicketToIframe(launchData, false);
                    }
                  }, 100);
                }
              }}
              style={{
                width: "100%",
                height: "calc(100vh - 120px)",
                border: "none",
                display: "block",
                backgroundColor: "#FFFFFF",
              }}
              allow="camera *; microphone *; display-capture *; autoplay *; clipboard-write *; clipboard-read *"
              title="Cognalyze Personalized Interview Arena"
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
