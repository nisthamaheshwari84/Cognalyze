"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SystemDesignChallenge, SEED_SYSTEM_DESIGN_CHALLENGES } from "@/lib/skill-hub-store";
import {
  generateSessionBrief,
  generatePostSessionFeedback,
  PostSessionFeedback,
  SessionBrief
} from "@/lib/skills/adaptive-engine";
import SessionBriefModal from "@/components/skills/SessionBriefModal";

// ── TYPES & INTERFACES ──
export type ArenaMode = "interview" | "learning";
export type InterviewPhase = "requirements" | "architecture" | "deep_dive" | "chaos" | "review";

export interface CanvasNode {
  id: string;
  type: string;
  label: string;
  icon: string;
  x: number;
  y: number;
  annotation?: string;
  role?: string;
  config?: string;
}

export interface CanvasEdge {
  id: string;
  from: string;
  to: string;
  protocol?: string;
  pattern?: "sync" | "async";
  purpose?: string;
}

export interface ClarificationItem {
  id: string;
  question: string;
  category: "scope" | "scale" | "sla" | "resilience" | "data";
  interviewerResponse: string;
  discoveredSpec: { label: string; value: string };
}

interface CanvasHistoryState {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

// ── COMPONENT PALETTE (Section 4) ──
const PALETTE_COMPONENTS = [
  { type: "client", label: "Client App", icon: "📱", defaultRole: "Mobile & Web Browser Clients", defaultProtocol: "HTTPS" },
  { type: "cdn", label: "Cloudflare CDN", icon: "🌐", defaultRole: "Edge caching & DDoS origin shield", defaultProtocol: "HTTPS" },
  { type: "lb", label: "Load Balancer", icon: "⚖️", defaultRole: "AWS ALB / NGINX reverse proxy", defaultProtocol: "HTTP/2" },
  { type: "gateway", label: "API Gateway", icon: "🛡️", defaultRole: "Token validation, rate-limiting middleware", defaultProtocol: "HTTP/2" },
  { type: "service", label: "Backend Core", icon: "⚙️", defaultRole: "Stateless business logic cluster", defaultProtocol: "gRPC" },
  { type: "cache", label: "Redis Cluster", icon: "⚡", defaultRole: "In-memory sliding window counters", defaultProtocol: "RESP" },
  { type: "db", label: "PostgreSQL DB", icon: "🗄️", defaultRole: "Persistent relational records & quotas", defaultProtocol: "SQL" },
  { type: "queue", label: "Kafka Queue", icon: "📨", defaultRole: "Asynchronous write buffer & event bus", defaultProtocol: "Kafka TCP" },
  { type: "storage", label: "S3 Storage", icon: "📦", defaultRole: "Object storage for assets & blobs", defaultProtocol: "HTTPS" },
  { type: "circuit_breaker", label: "Circuit Breaker", icon: "🔌", defaultRole: "Envoy / Resilience4j failover filter", defaultProtocol: "Internal" },
  { type: "monitoring", label: "Grafana / Metrics", icon: "📊", defaultRole: "Prometheus telemetry & SLO alerting", defaultProtocol: "PromQL" }
];

// ── LEARNING STARTER TEMPLATE (Learning Mode Only) ──
const LEARNING_STARTER_NODES: CanvasNode[] = [
  { id: "learn-1", type: "client", label: "Client App", icon: "📱", x: 60, y: 160, role: "Mobile & Web Clients", annotation: "User traffic entry point" },
  { id: "learn-2", type: "gateway", label: "API Gateway", icon: "🛡️", x: 260, y: 160, role: "API Gateway", annotation: "Stateless request routing & auth" },
  { id: "learn-3", type: "service", label: "Backend Core", icon: "⚙️", x: 480, y: 160, role: "Backend Microservice", annotation: "Processes validated requests" },
  { id: "learn-4", type: "db", label: "PostgreSQL DB", icon: "🗄️", x: 700, y: 160, role: "Primary Database", annotation: "Persistent storage" }
];

const LEARNING_STARTER_EDGES: CanvasEdge[] = [
  { id: "ledge-1", from: "learn-1", to: "learn-2", protocol: "HTTPS", pattern: "sync", purpose: "User requests" },
  { id: "ledge-2", from: "learn-2", to: "learn-3", protocol: "gRPC", pattern: "sync", purpose: "Forward allowed requests" },
  { id: "ledge-3", from: "learn-3", to: "learn-4", protocol: "SQL", pattern: "sync", purpose: "Query customer data" }
];

// ── REFERENCE BLUEPRINTS (Reference Blueprint Modal/Drawer Only) ──
const REFERENCE_BLUEPRINTS: Record<string, {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  overview: string;
  keyTradeoffs: string[];
  failureMitigations: string[];
}> = {
  "sd-1": {
    overview: "Tier-1 Distributed Rate Limiter utilizing an in-memory Redis cluster with Lua scripting for atomic token bucket evaluation, isolated behind an API Gateway with local fallback.",
    nodes: [
      { id: "ref-1", type: "client", label: "Client App", icon: "📱", x: 40, y: 120, role: "Mobile & Web Apps" },
      { id: "ref-2", type: "cdn", label: "Cloudflare CDN", icon: "🌐", x: 180, y: 120, role: "Edge Shield & TLS" },
      { id: "ref-3", type: "lb", label: "AWS ALB", icon: "⚖️", x: 320, y: 120, role: "Layer 7 Load Balancer" },
      { id: "ref-4", type: "gateway", label: "API Gateway", icon: "🛡️", x: 470, y: 120, role: "Rate Limit Middleware" },
      { id: "ref-5", type: "cache", label: "Redis Cluster", icon: "⚡", x: 470, y: 260, role: "Atomic In-Memory Counters" },
      { id: "ref-6", type: "service", label: "Backend Core", icon: "⚙️", x: 640, y: 120, role: "Internal Microservices" },
      { id: "ref-7", type: "db", label: "PostgreSQL DB", icon: "🗄️", x: 800, y: 120, role: "Account Quota Metadata" }
    ],
    edges: [
      { id: "re-1", from: "ref-1", to: "ref-2", protocol: "HTTPS", pattern: "sync" },
      { id: "re-2", from: "ref-2", to: "ref-3", protocol: "HTTPS", pattern: "sync" },
      { id: "re-3", from: "ref-3", to: "ref-4", protocol: "HTTP/2", pattern: "sync" },
      { id: "re-4", from: "ref-4", to: "ref-5", protocol: "RESP", pattern: "sync", purpose: "Atomic sliding window check via Lua" },
      { id: "re-5", from: "ref-4", to: "ref-6", protocol: "gRPC", pattern: "sync", purpose: "Allowed requests forwarded" },
      { id: "re-6", from: "ref-6", to: "ref-7", protocol: "SQL", pattern: "sync", purpose: "Fetch user tier metadata" }
    ],
    keyTradeoffs: [
      "Sliding Window Counter vs Token Bucket: Sliding window provides smoother traffic shaping with minimal memory footprint (12 bytes/key).",
      "Centralized Redis vs Local Memory: Redis provides cluster-wide consistency; local memory on Gateway eliminates network latency but risks uneven enforcement across replicas."
    ],
    failureMitigations: [
      "Tiered Fail-Open: If Redis fails, allow authenticated requests through with telemetry alert to prevent business downtime.",
      "Local In-Memory Fallback: Gateway runs a local token bucket limiter if Redis connection times out."
    ]
  },
  "sd-2": {
    overview: "Distributed URL Shortener (TinyURL) using a distributed range-based Key Generation Service (KGS) and heavy read-caching via Redis over Cassandra NoSQL storage.",
    nodes: [
      { id: "ref-1", type: "client", label: "Client App", icon: "📱", x: 40, y: 120, role: "Client Redirect Caller" },
      { id: "ref-2", type: "lb", label: "Load Balancer", icon: "⚖️", x: 220, y: 120, role: "Geo-DNS & NGINX" },
      { id: "ref-3", type: "service", label: "URL Service", icon: "⚙️", x: 420, y: 120, role: "Stateless URL Resolution" },
      { id: "ref-4", type: "cache", label: "Redis LRU Cache", icon: "⚡", x: 420, y: 260, role: "Top 20% Hot URL Cache" },
      { id: "ref-5", type: "db", label: "Cassandra NoSQL", icon: "🗄️", x: 640, y: 120, role: "Partitioned by short_key" },
      { id: "ref-6", type: "service", label: "Key Generator (KGS)", icon: "⚙️", x: 640, y: 260, role: "Pre-generated Base62 IDs" }
    ],
    edges: [
      { id: "re-1", from: "ref-1", to: "ref-2", protocol: "HTTPS", pattern: "sync" },
      { id: "re-2", from: "ref-2", to: "ref-3", protocol: "HTTP", pattern: "sync" },
      { id: "re-3", from: "ref-3", to: "ref-4", protocol: "RESP", pattern: "sync" },
      { id: "re-4", from: "ref-3", to: "ref-5", protocol: "CQL", pattern: "sync" },
      { id: "re-5", from: "ref-3", to: "ref-6", protocol: "gRPC", pattern: "sync" }
    ],
    keyTradeoffs: [
      "HTTP 301 vs HTTP 302: 301 caches in user browser (lowest latency, zero server cost); 302 enables live click tracking.",
      "Base62 Range Generation vs MD5 Hashing: Range-based KGS prevents hash collision retries entirely."
    ],
    failureMitigations: [
      "Probabilistic Early Expiration: Prevents cache stampede when popular viral links expire."
    ]
  }
};

// ── CLARIFICATION SPECS PER CHALLENGE ──
const CHALLENGE_CLARIFICATIONS: Record<string, ClarificationItem[]> = {
  "sd-1": [
    {
      id: "c-1",
      question: "What is the rate-limiting scope (per User ID, per IP, or per API Key)?",
      category: "scope",
      interviewerResponse: "For this exercise, assume the limit is primarily per API Key for authenticated endpoints, with client IP address fallback for unauthenticated routes.",
      discoveredSpec: { label: "Scope", value: "API Key (Auth) + Client IP (Public)" }
    },
    {
      id: "c-2",
      question: "What is the allowable latency overhead SLA for the rate check?",
      category: "sla",
      interviewerResponse: "Strict sub-5ms P99 latency overhead. Rate checking must never become a bottleneck for downstream API microservices.",
      discoveredSpec: { label: "Latency SLA", value: "< 5ms P99 Overhead" }
    },
    {
      id: "c-3",
      question: "Is strict 100% accuracy required, or is slight drift acceptable under surge?",
      category: "data",
      interviewerResponse: "Near-strict (1-2% drift is acceptable during rolling window boundaries), but operations must be atomic to prevent race condition bypasses under concurrency.",
      discoveredSpec: { label: "Accuracy", value: "Sliding window counter (1-2% tolerance under burst)" }
    },
    {
      id: "c-4",
      question: "What is the outage policy if the rate-limiter cluster fails?",
      category: "resilience",
      interviewerResponse: "Fail-open with critical alerts. It is better to let some excess requests through than to cause a complete outage of our core commerce APIs.",
      discoveredSpec: { label: "Outage Policy", value: "Tiered Fail-Open + Immediate Alerting" }
    },
    {
      id: "c-5",
      question: "Are there distinct client tiers or VIP overrides?",
      category: "scope",
      interviewerResponse: "Yes. Standard tier is 100 req/min, while enterprise VIP tiers receive up to 5,000 req/min with dedicated burst allowances.",
      discoveredSpec: { label: "Tiering", value: "Standard (100 RPM) & VIP (5,000 RPM)" }
    }
  ],
  "sd-2": [
    {
      id: "c-1",
      question: "What should the short URL length and character set be?",
      category: "scope",
      interviewerResponse: "Use 7 characters Base62 ([0-9, a-z, A-Z]), which provides 62^7 = ~3.5 Trillion unique combinations, easily lasting decades.",
      discoveredSpec: { label: "Alias Format", value: "7 chars Base62 (~3.5T unique keys)" }
    },
    {
      id: "c-2",
      question: "What is the read-to-write ratio?",
      category: "scale",
      interviewerResponse: "Heavy 100:1 read-to-write ratio. ~100M URLs created per month vs ~10 Billion redirection reads per month (~4,000 read RPS).",
      discoveredSpec: { label: "Traffic Ratio", value: "100:1 Read-to-Write (Heavy Read Cache)" }
    },
    {
      id: "c-3",
      question: "Should we return HTTP 301 Permanent or HTTP 302 Temporary redirects?",
      category: "sla",
      interviewerResponse: "HTTP 301 lets browsers cache the redirect (sub-5ms, zero server load), whereas HTTP 302 forces every hit through our server for click analytics. Support 302 for trackable links.",
      discoveredSpec: { label: "Redirection", value: "HTTP 302 for Click Analytics / 301 for Static" }
    }
  ],
  "sd-3": [
    {
      id: "c-1",
      question: "What network transport protocol should be used for live messages?",
      category: "scope",
      interviewerResponse: "Full-duplex persistent WebSockets with bidirectional heartbeat ping/pong every 30s to detect ghost disconnects.",
      discoveredSpec: { label: "Transport", value: "WebSockets + 30s Heartbeat" }
    },
    {
      id: "c-2",
      question: "How should chat history be persisted for rapid timeline scrolling?",
      category: "data",
      interviewerResponse: "Wide-column store (Cassandra or ScyllaDB) partitioned by chat_id with clustering key timestamp DESC for lightning-fast range slices.",
      discoveredSpec: { label: "Persistence", value: "Cassandra partitioned by (chat_id, timestamp DESC)" }
    }
  ],
  "sd-4": [
    {
      id: "c-1",
      question: "What spatial indexing algorithm and cell resolution should we use?",
      category: "scope",
      interviewerResponse: "Use Uber H3 hexagonal spatial indexing (Resolution 8, ~460m radius) or Geohash. Hexagons have equidistant neighbors, eliminating corner distortion.",
      discoveredSpec: { label: "Spatial Index", value: "Uber H3 Hexagonal Cells (Res 8)" }
    }
  ],
  "sd-5": [
    {
      id: "c-1",
      question: "Can we lock relational database rows directly for flash sale checkout?",
      category: "data",
      interviewerResponse: "Absolutely not. 200,000 concurrent row locks will immediately exhaust the database connection pool and cause severe deadlocks.",
      discoveredSpec: { label: "DB Rule", value: "Zero DB row locks during peak surge" }
    }
  ],
  "sd-6": [
    {
      id: "c-1",
      question: "How does video playback adapt to fluctuating user network bandwidth?",
      category: "scope",
      interviewerResponse: "Transcode master 4K video asynchronously into Adaptive Bitrate Streaming chunks (HLS / MPEG-DASH) across 1080p, 720p, 480p, and 360p.",
      discoveredSpec: { label: "Streaming", value: "Adaptive Bitrate Streaming (HLS / DASH chunks)" }
    }
  ]
};

function SystemDesignContent() {
  const searchParams = useSearchParams();
  const [candidateId, setCandidateId] = useState("student-demo");
  const [trackSlug, setTrackSlug] = useState<"service_mass" | "service_elite" | "product_mid" | "product_faang">("product_mid");

  const [challenges, setChallenges] = useState<SystemDesignChallenge[]>(SEED_SYSTEM_DESIGN_CHALLENGES);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>(SEED_SYSTEM_DESIGN_CHALLENGES[0].id);

  // ── THREE DISTINCT MODES (Section 2) ──
  // Interview Mode starts completely blank (0 Nodes, 0 Connections)
  const [mode, setMode] = useState<ArenaMode>("interview");
  const [phase, setPhase] = useState<InterviewPhase>("requirements");
  const [hintUsed, setHintUsed] = useState(false);

  // ── CANVAS NODES & EDGES (Whiteboard) ──
  // INTERVIEW MODE STARTS WITH 0 NODES AND 0 CONNECTIONS
  const [canvasNodes, setCanvasNodes] = useState<CanvasNode[]>([]);
  const [canvasEdges, setCanvasEdges] = useState<CanvasEdge[]>([]);

  // Selection & Inspector
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Connection Mode
  const [isConnectMode, setIsConnectMode] = useState(false);
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);

  // Component Palette Drawer
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Canvas Dragging
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hasMovedDuringDrag, setHasMovedDuringDrag] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Canvas Zoom
  const [zoomScale, setZoomScale] = useState(1);

  // Undo / Redo History Stack (Section 58)
  const [history, setHistory] = useState<CanvasHistoryState[]>([{ nodes: [], edges: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Push State to History
  const pushHistory = useCallback((newNodes: CanvasNode[], newEdges: CanvasEdge[]) => {
    setHistory(prev => {
      const upToCurrent = prev.slice(0, historyIndex + 1);
      return [...upToCurrent, { nodes: newNodes, edges: newEdges }];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const handleUndo = () => {
    if (historyIndex > 0) {
      const targetState = history[historyIndex - 1];
      setCanvasNodes(targetState.nodes);
      setCanvasEdges(targetState.edges);
      setHistoryIndex(historyIndex - 1);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const targetState = history[historyIndex + 1];
      setCanvasNodes(targetState.nodes);
      setCanvasEdges(targetState.edges);
      setHistoryIndex(historyIndex + 1);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
    }
  };

  // Keyboard shortcuts: Delete, Undo, Redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") {
        return;
      }

      if ((e.key === "Backspace" || e.key === "Delete")) {
        if (selectedNodeId) {
          handleDeleteSelectedNode();
        } else if (selectedEdgeId) {
          handleDeleteSelectedEdge();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === "y") {
        handleRedo();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // ── PHASE 1: REQUIREMENTS & CLARIFICATION ──
  const [clarificationsAsked, setClarificationsAsked] = useState<ClarificationItem[]>([]);
  const [customQuestionInput, setCustomQuestionInput] = useState("");
  const [clarificationThinking, setClarificationThinking] = useState(false);

  // ── CONVERSATION & INTERVIEWER DIALOGUE (Section 20, 53) ──
  const [candidateResponse, setCandidateResponse] = useState("");
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
  const [interviewerLog, setInterviewerLog] = useState<{ sender: "interviewer" | "candidate"; text: string }[]>([
    {
      sender: "interviewer",
      text: "Welcome to the System Design Interview. Review the requirements and ask clarifying questions, or jump onto the blank canvas to architect your system."
    }
  ]);

  // ── PHASE 3: DEEP DIVE SPECIFICATIONS ──
  const [activeDeepDiveTab, setActiveDeepDiveTab] = useState<"flow" | "db" | "cache" | "bottlenecks">("flow");
  const [candidateArchitecture, setCandidateArchitecture] = useState("");
  const [databaseChoice, setDatabaseChoice] = useState("");
  const [cachingStrategy, setCachingStrategy] = useState("");
  const [bottleneckStrategy, setBottleneckStrategy] = useState("");

  // ── PHASE 4: CHAOS INJECTION & DYNAMIC SCALE (Section 27, 28) ──
  const [chaosInjected, setChaosInjected] = useState(false);
  const [chaosScenario, setChaosScenario] = useState<{
    title: string;
    description: string;
    interviewerProbe: string;
  } | null>(null);
  const [chaosDefense, setChaosDefense] = useState("");

  // ── PHASE 5: EVALUATION & DIAGNOSTIC DOSSIER ──
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<any>(null);
  const [postFeedback, setPostFeedback] = useState<PostSessionFeedback | null>(null);

  // Drawers & Modals
  const [isSpecDrawerOpen, setIsSpecDrawerOpen] = useState(false);
  const [isBlueprintDrawerOpen, setIsBlueprintDrawerOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [isBriefOpen, setIsBriefOpen] = useState(false);
  const [sessionBrief, setSessionBrief] = useState<SessionBrief | null>(null);

  // Active Challenge
  const activeChallenge = challenges.find(c => c.id === selectedChallengeId) || challenges[0];

  // Initialize
  useEffect(() => {
    const storedId = searchParams.get("candidateId") || localStorage.getItem("cognalyze_student_id") || "student-demo";
    setCandidateId(storedId);

    const paramTrack = (searchParams.get("track") as any) || "product_mid";
    setTrackSlug(paramTrack);

    const brief = generateSessionBrief(paramTrack, "system_design", storedId);
    setSessionBrief(brief);
  }, [searchParams]);

  // Handle Mode Change (Interview vs Learning)
  const handleSwitchMode = (newMode: ArenaMode) => {
    if (newMode === mode) return;

    if (canvasNodes.length > 0) {
      const confirmSwitch = window.confirm(`Switching to ${newMode === "interview" ? "Interview Mode (Blank Canvas)" : "Learning Mode (Guided Starter)"}? Do you want to load the mode's default canvas?`);
      if (!confirmSwitch) return;
    }

    setMode(newMode);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);

    if (newMode === "interview") {
      // INTERVIEW MODE: Strictly 0 Nodes, 0 Connections (Section 1, 2)
      setCanvasNodes([]);
      setCanvasEdges([]);
      setHistory([{ nodes: [], edges: [] }]);
      setHistoryIndex(0);
      setInterviewerLog([
        {
          sender: "interviewer",
          text: "Interview Mode active. The canvas is completely blank. Drag components onto the whiteboard to begin constructing your system."
        }
      ]);
    } else {
      // LEARNING MODE: Guided starter with fully editable nodes
      setCanvasNodes(LEARNING_STARTER_NODES);
      setCanvasEdges(LEARNING_STARTER_EDGES);
      setHistory([{ nodes: LEARNING_STARTER_NODES, edges: LEARNING_STARTER_EDGES }]);
      setHistoryIndex(0);
      setInterviewerLog([
        {
          sender: "interviewer",
          text: "Learning Mode active. A baseline starter architecture is loaded. You can freely move, delete, reconnect, and augment these components."
        }
      ]);
    }
  };

  // Handle Challenge Switch
  const handleSelectChallenge = (id: string) => {
    setSelectedChallengeId(id);
    setPhase("requirements");
    setClarificationsAsked([]);
    setChaosInjected(false);
    setChaosScenario(null);
    setChaosDefense("");
    setEvalResult(null);
    setPostFeedback(null);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setHintUsed(false);

    if (mode === "interview") {
      // Always blank for Interview Mode
      setCanvasNodes([]);
      setCanvasEdges([]);
      setHistory([{ nodes: [], edges: [] }]);
      setHistoryIndex(0);
    } else {
      setCanvasNodes(LEARNING_STARTER_NODES);
      setCanvasEdges(LEARNING_STARTER_EDGES);
      setHistory([{ nodes: LEARNING_STARTER_NODES, edges: LEARNING_STARTER_EDGES }]);
      setHistoryIndex(0);
    }

    setCandidateArchitecture("");
    setDatabaseChoice("");
    setCachingStrategy("");
    setBottleneckStrategy("");
  };

  // ── CLARIFICATION HANDLING (Phase 1) ──
  const handleAskClarification = (item: ClarificationItem) => {
    if (clarificationsAsked.some(c => c.id === item.id)) return;
    setClarificationThinking(true);
    setTimeout(() => {
      setClarificationsAsked(prev => [...prev, item]);
      setInterviewerLog(prev => [
        ...prev,
        { sender: "candidate", text: item.question },
        { sender: "interviewer", text: item.interviewerResponse }
      ]);
      setClarificationThinking(false);
    }, 400);
  };

  const handleAskCustomQuestion = () => {
    if (!customQuestionInput.trim()) return;
    const text = customQuestionInput.trim();
    setCustomQuestionInput("");
    setClarificationThinking(true);

    setTimeout(() => {
      let response = "That is a valid architectural consideration. For this exercise, assume active-active regional deployment and a sub-10ms P99 target.";
      let spec = { label: "Clarified Assumption", value: text.substring(0, 32) + "..." };

      const lower = text.toLowerCase();
      if (lower.includes("user") || lower.includes("ip") || lower.includes("key") || lower.includes("who")) {
        response = "Requests come from both mobile clients and 3rd party B2B developers. Authentication headers supply an API key; unauthenticated calls fall back to client IP.";
        spec = { label: "Client Identity", value: "API Key + IP fallback" };
      } else if (lower.includes("latency") || lower.includes("sla") || lower.includes("speed")) {
        response = "Sub-5ms latency overhead at P99. The check happens on every single request, so minimal CPU overhead is essential.";
        spec = { label: "Latency SLA", value: "< 5ms P99" };
      } else if (lower.includes("fail") || lower.includes("down") || lower.includes("outage")) {
        response = "Tiered fail-open policy. If the rate-limiter cluster degrades, allow traffic through to core services rather than dropping legitimate transactions.";
        spec = { label: "Failure Resilience", value: "Tiered Fail-Open" };
      } else if (lower.includes("redis") || lower.includes("cache") || lower.includes("storage")) {
        response = "We recommend Redis with Lua scripting for atomic read-and-decrement. Persistent configurations can reside in a relational database.";
        spec = { label: "Storage Model", value: "In-Memory Atomic + DB metadata" };
      }

      const newItem: ClarificationItem = {
        id: `custom-${Date.now()}`,
        question: text,
        category: "scope",
        interviewerResponse: response,
        discoveredSpec: spec
      };

      setClarificationsAsked(prev => [...prev, newItem]);
      setInterviewerLog(prev => [
        ...prev,
        { sender: "candidate", text },
        { sender: "interviewer", text: response }
      ]);
      setClarificationThinking(false);
    }, 450);
  };

  // ── CANVAS OPERATIONS: ADD, MOVE, DUPLICATE, DELETE (Sections 5-10) ──
  const handleAddPaletteNode = (comp: typeof PALETTE_COMPONENTS[0]) => {
    const newNode: CanvasNode = {
      id: `node-${Date.now()}`,
      type: comp.type,
      label: comp.label,
      icon: comp.icon,
      x: 120 + Math.floor(Math.random() * 240),
      y: 100 + Math.floor(Math.random() * 180),
      annotation: comp.defaultRole,
      role: comp.defaultRole
    };

    const nextNodes = [...canvasNodes, newNode];
    setCanvasNodes(nextNodes);
    pushHistory(nextNodes, canvasEdges);
    setSelectedNodeId(newNode.id);
    setSelectedEdgeId(null);
    setIsPaletteOpen(false);

    // Dynamic Interviewer reaction to added component (Section 20)
    if (comp.type === "cache") {
      setInterviewerLog(prev => [
        ...prev,
        { sender: "interviewer", text: "I see you've introduced Redis into your architecture. What state will reside in memory, and how will you ensure atomic updates?" }
      ]);
    } else if (comp.type === "queue") {
      setInterviewerLog(prev => [
        ...prev,
        { sender: "interviewer", text: "Kafka message queue added. Are you using this for audit logging or decoupling critical-path writes? How will you handle consumer backpressure?" }
      ]);
    } else if (comp.type === "circuit_breaker") {
      setInterviewerLog(prev => [
        ...prev,
        { sender: "interviewer", text: "Good initiative adding a Circuit Breaker. What failure thresholds trigger the trip to open state, and how do you test half-open recovery?" }
      ]);
    }
  };

  // Duplicate Selected Node (Section 9)
  const handleDuplicateSelectedNode = () => {
    if (!selectedNodeId) return;
    const target = canvasNodes.find(n => n.id === selectedNodeId);
    if (!target) return;

    const dupNode: CanvasNode = {
      ...target,
      id: `node-${Date.now()}`,
      label: `${target.label} (Replica)`,
      x: target.x + 30,
      y: target.y + 40
    };

    const nextNodes = [...canvasNodes, dupNode];
    setCanvasNodes(nextNodes);
    pushHistory(nextNodes, canvasEdges);
    setSelectedNodeId(dupNode.id);

    setInterviewerLog(prev => [
      ...prev,
      { sender: "interviewer", text: `I see you duplicated ${target.label} to add a replica. How do you distribute incoming load across these parallel instances?` }
    ]);
  };

  // Delete Selected Node (Section 8)
  const handleDeleteSelectedNode = () => {
    if (!selectedNodeId) return;
    const nextNodes = canvasNodes.filter(n => n.id !== selectedNodeId);
    const nextEdges = canvasEdges.filter(e => e.from !== selectedNodeId && e.to !== selectedNodeId);

    setCanvasNodes(nextNodes);
    setCanvasEdges(nextEdges);
    pushHistory(nextNodes, nextEdges);
    setSelectedNodeId(null);
  };

  // Delete Selected Edge (Section 12)
  const handleDeleteSelectedEdge = () => {
    if (!selectedEdgeId) return;
    const nextEdges = canvasEdges.filter(e => e.id !== selectedEdgeId);
    setCanvasEdges(nextEdges);
    pushHistory(canvasNodes, nextEdges);
    setSelectedEdgeId(null);
  };

  // Clear Canvas (Section 59)
  const handleConfirmClearCanvas = () => {
    setCanvasNodes([]);
    setCanvasEdges([]);
    pushHistory([], []);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setIsClearConfirmOpen(false);
  };

  // Auto-Arrange Layout (Section 57)
  const handleAutoArrange = () => {
    if (canvasNodes.length === 0) return;

    // Rank components by layer
    const getTier = (type: string) => {
      if (type === "client") return 0;
      if (type === "cdn" || type === "lb") return 1;
      if (type === "gateway") return 2;
      if (type === "service") return 3;
      if (type === "cache" || type === "queue") return 4;
      if (type === "db" || type === "storage") return 5;
      return 3;
    };

    const arranged = canvasNodes.map(node => {
      const tier = getTier(node.type);
      const sameTierNodes = canvasNodes.filter(n => getTier(n.type) === tier);
      const indexInTier = sameTierNodes.findIndex(n => n.id === node.id);

      const targetX = 60 + tier * 160;
      const targetY = 120 + indexInTier * 110;

      return { ...node, x: targetX, y: targetY };
    });

    setCanvasNodes(arranged);
    pushHistory(arranged, canvasEdges);
  };

  // ── NODE DRAGGING EVENTS (Section 3, 6) ──
  const handleMouseDownNode = (e: React.MouseEvent, node: CanvasNode) => {
    e.stopPropagation();

    if (isConnectMode) {
      if (!connectingSourceId) {
        setConnectingSourceId(node.id);
      } else if (connectingSourceId !== node.id) {
        // Connect Source to Target
        const defaultProtocol = node.type === "cache" ? "RESP" : node.type === "db" ? "SQL" : "HTTP/2";
        const newEdge: CanvasEdge = {
          id: `edge-${Date.now()}`,
          from: connectingSourceId,
          to: node.id,
          protocol: defaultProtocol,
          pattern: node.type === "queue" ? "async" : "sync",
          purpose: `Requests from ${canvasNodes.find(n => n.id === connectingSourceId)?.label} to ${node.label}`
        };

        const nextEdges = [...canvasEdges, newEdge];
        setCanvasEdges(nextEdges);
        pushHistory(canvasNodes, nextEdges);
        setConnectingSourceId(null);
        setIsConnectMode(false);
        setSelectedEdgeId(newEdge.id);

        // Dynamic Graph Analysis on Connection (Section 10, 14)
        const srcNode = canvasNodes.find(n => n.id === connectingSourceId);
        if (srcNode?.type === "gateway" && node.type === "cache") {
          setInterviewerLog(prev => [
            ...prev,
            { sender: "interviewer", text: "You connected the Gateway directly to Redis. This puts Redis on the critical request path. How will this impact end-to-end latency?" }
          ]);
        } else if (srcNode?.type === "gateway" && node.type === "db") {
          setInterviewerLog(prev => [
            ...prev,
            { sender: "interviewer", text: "Notice: Connecting API Gateway directly to PostgreSQL bypasses the business logic microservice tier. Why did you choose direct DB access?" }
          ]);
        }
      }
      return;
    }

    setSelectedNodeId(node.id);
    setSelectedEdgeId(null);
    setDraggingNodeId(node.id);
    setHasMovedDuringDrag(false);

    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setDragOffset({
        x: (e.clientX - rect.left) / zoomScale - node.x,
        y: (e.clientY - rect.top) / zoomScale - node.y
      });
    }
  };

  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    if (!draggingNodeId || !canvasRef.current) return;
    setHasMovedDuringDrag(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const newX = Math.max(10, Math.min(rect.width / zoomScale - 160, (e.clientX - rect.left) / zoomScale - dragOffset.x));
    const newY = Math.max(10, Math.min(rect.height / zoomScale - 90, (e.clientY - rect.top) / zoomScale - dragOffset.y));

    setCanvasNodes(prev => prev.map(n => n.id === draggingNodeId ? { ...n, x: newX, y: newY } : n));
  };

  const handleMouseUpCanvas = () => {
    if (draggingNodeId && hasMovedDuringDrag) {
      pushHistory(canvasNodes, canvasEdges);
    }
    setDraggingNodeId(null);
    setHasMovedDuringDrag(false);
  };

  // ── INTELLIGENT CHAOS SURGE (Section 27, 28) ──
  const handleTriggerIntelligentChaos = () => {
    setChaosInjected(true);
    setPhase("chaos");

    const hasRedis = canvasNodes.some(n => n.type === "cache");
    const hasKafka = canvasNodes.some(n => n.type === "queue");
    const hasDB = canvasNodes.some(n => n.type === "db");

    let scenario = {
      title: "💥 CHAOS INJECTED: 10x Global Traffic Surge",
      description: "Traffic surged from 12k RPS to 120k RPS. Ingress Gateway instances are throttling connections.",
      interviewerProbe: "Your ingress tier is maxed out. Walk me through how your load-balancing and caching dynamically scale."
    };

    if (hasRedis) {
      scenario = {
        title: "💥 CHAOS INJECTED: Redis Cluster Master OOM Crash & 350ms Replica Lag",
        description: "Traffic surged to 500,000 req/s. The primary Redis cluster master crashed due to memory fragmentation. Replica failover is taking 350ms.",
        interviewerProbe: "Your Redis tier is unresponsive under 500k req/s. Do you fail-open or fail-closed? How do you prevent your downstream relational database from collapsing under a thundering herd?"
      };
    } else if (hasKafka) {
      scenario = {
        title: "💥 CHAOS INJECTED: Kafka Broker Partition & Consumer Rebalance Storm",
        description: "Broker 3 lost connectivity to Zookeeper/KRaft. Consumer group partitions are constantly rebalancing while write backlog reaches 1.2M messages.",
        interviewerProbe: "Consumer lag is spiking. How does your architecture absorb writes without dropping transactions or exhausting gateway buffers?"
      };
    } else if (hasDB) {
      scenario = {
        title: "💥 CHAOS INJECTED: Database Connection Pool Exhaustion",
        description: "PostgreSQL max connections reached (500/500). Queries are queuing with latency exceeding 2,500ms.",
        interviewerProbe: "All database connection slots are locked. How do you shed load or decouple synchronous read queries from the persistent storage tier?"
      };
    }

    setChaosScenario(scenario);
    setInterviewerLog(prev => [
      ...prev,
      { sender: "interviewer", text: `${scenario.title} — ${scenario.interviewerProbe}` }
    ]);
  };

  // Candidate sends response in dialogue
  const handleSendCandidateResponse = () => {
    if (!candidateResponse.trim()) return;
    const text = candidateResponse.trim();
    setCandidateResponse("");

    setInterviewerLog(prev => [
      ...prev,
      { sender: "candidate", text }
    ]);

    // Adaptive follow-up probe (Section 20)
    setTimeout(() => {
      let probe = "Understood. How does this decision affect your P99 latency bounds under peak traffic surge?";
      const lower = text.toLowerCase();
      if (lower.includes("fail-open") || lower.includes("fail open")) {
        probe = "You chose to fail-open. Does this allow abusive callers to saturate downstream microservices? How do you mitigate malicious flooding?";
      } else if (lower.includes("fail-closed") || lower.includes("fail closed")) {
        probe = "You chose to fail-closed. This blocks legitimate users during a cache glitch. How do you prevent revenue loss for VIP enterprise accounts?";
      } else if (lower.includes("token bucket") || lower.includes("leaky bucket")) {
        probe = "Token bucket handles bursty traffic well. Where is the bucket state persisted, and what prevents race conditions across multi-threaded workers?";
      } else if (lower.includes("lua") || lower.includes("atomic")) {
        probe = "Redis Lua scripts execute atomically on a single Redis thread. What happens if a slow Lua script blocks the single-threaded event loop?";
      }

      setInterviewerLog(prev => [
        ...prev,
        { sender: "interviewer", text: probe }
      ]);
    }, 500);
  };

  // Voice Mode Toggle (Section 54)
  const handleToggleVoice = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Speech recognition is not supported in this browser. Please type your response.");
      return;
    }

    if (isVoiceRecording) {
      setIsVoiceRecording(false);
    } else {
      setIsVoiceRecording(true);
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setCandidateResponse(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsVoiceRecording(false);
      };

      recognition.onerror = () => {
        setIsVoiceRecording(false);
      };

      recognition.start();
    }
  };

  // ── FINAL SUBMISSION & EVALUATION (Sections 45, 46) ──
  const handleSubmitInterview = async () => {
    setEvaluating(true);
    setEvalResult(null);

    const canvasSummary = canvasNodes.length > 0
      ? canvasNodes.map(n => `${n.icon} ${n.label} (${n.annotation || "Standard"})`).join(" -> ")
      : "No nodes placed on canvas";

    try {
      const res = await fetch("/api/skills/system-design", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: activeChallenge.id,
          candidateArchitecture: candidateArchitecture || canvasSummary,
          databaseChoice,
          cachingStrategy,
          bottleneckStrategy: bottleneckStrategy + (chaosDefense ? `\n[CHAOS DEFENSE]: ${chaosDefense}` : ""),
          clarifications: clarificationsAsked,
          canvasGraph: { nodes: canvasNodes, edges: canvasEdges },
          chaosDefense,
          hintsUsed: mode === "learning" || hintUsed,
          track: trackSlug
        })
      });

      const data = await res.json();
      if (data.evaluation) {
        setEvalResult(data.evaluation);
        setPhase("review");

        const fb = generatePostSessionFeedback(trackSlug, "system_design", [
          {
            score: data.evaluation.scalabilityScore || 82,
            verdict: data.evaluation.verdict || "Hire",
            conceptualAccuracy: data.evaluation.dataModelingScore || 84,
            depthScore: data.evaluation.faultToleranceScore || 80,
            feedback: data.evaluation.principalAdvice || "Strong architecture demonstration.",
            detectedClaims: ["Redis in-memory caching", "Decoupled gateway tier"],
            observedStrengths: data.evaluation.demonstrated || ["Clear separation of tiers"],
            observedGaps: data.evaluation.developing || ["Multi-region consistency under failure"],
            nextFollowUp: {
              type: "TRADE_OFF",
              question: "How do you handle multi-region replication lag?",
              reason: "Probing partition tolerance limits."
            }
          }
        ], candidateId);
        setPostFeedback(fb);
      }
    } catch (err) {
      console.error("System design evaluation error:", err);
    } finally {
      setEvaluating(false);
    }
  };

  const selectedNode = canvasNodes.find(n => n.id === selectedNodeId);
  const selectedEdge = canvasEdges.find(e => e.id === selectedEdgeId);
  const availableClarifications = (CHALLENGE_CLARIFICATIONS[activeChallenge.id] || CHALLENGE_CLARIFICATIONS["sd-1"]).filter(
    c => !clarificationsAsked.some(a => a.id === c.id)
  );

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#090d16", color: "#f8fafc", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* ── HEADER ── */}
      <header style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", backgroundColor: "rgba(15, 23, 42, 0.9)", backdropFilter: "blur(16px)", padding: "12px 24px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1480, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <Link href="/student/skills" style={{ color: "#94a3b8", textDecoration: "none", fontSize: 12, fontWeight: 600 }}>
                  ← Skill Practice Hub
                </Link>
                <span style={{ color: "rgba(255,255,255,0.2)" }}>/</span>
                <span style={{ color: "#a855f7", fontSize: 12, fontWeight: 700 }}>Arena 2.0</span>
              </div>
              <h1 style={{ fontSize: 18, fontWeight: 900, margin: 0, letterSpacing: "-0.5px", display: "flex", alignItems: "center", gap: 8 }}>
                <span>🏛️</span>
                <span>System Design & Architecture Studio</span>
              </h1>
            </div>

            {/* Mode Switcher: Interview vs Learning (Section 2, 66) */}
            <div style={{ display: "flex", background: "rgba(0,0,0,0.5)", padding: 3, borderRadius: 10, border: "1px solid rgba(255,255,255,0.1)" }}>
              <button
                onClick={() => handleSwitchMode("interview")}
                style={{
                  padding: "5px 12px",
                  borderRadius: 7,
                  border: "none",
                  background: mode === "interview" ? "linear-gradient(135deg, rgba(168,85,247,0.4) 0%, rgba(99,102,241,0.3) 100%)" : "transparent",
                  color: mode === "interview" ? "#c084fc" : "#94a3b8",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <span>🎯</span>
                <span>Interview Mode (Blank Canvas)</span>
              </button>
              <button
                onClick={() => handleSwitchMode("learning")}
                style={{
                  padding: "5px 12px",
                  borderRadius: 7,
                  border: "none",
                  background: mode === "learning" ? "linear-gradient(135deg, rgba(56,189,248,0.4) 0%, rgba(16,185,129,0.3) 100%)" : "transparent",
                  color: mode === "learning" ? "#38bdf8" : "#94a3b8",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6
                }}
              >
                <span>💡</span>
                <span>Learning Mode (Guided)</span>
              </button>
            </div>

            {/* Challenge Dropdown Selector (Section 36) */}
            <select
              value={selectedChallengeId}
              onChange={e => handleSelectChallenge(e.target.value)}
              style={{
                background: "rgba(30, 41, 59, 0.8)",
                border: "1px solid rgba(168, 85, 247, 0.4)",
                color: "white",
                padding: "6px 12px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
                outline: "none"
              }}
            >
              {challenges.map(c => (
                <option key={c.id} value={c.id} style={{ background: "#0f172a", color: "white" }}>
                  {c.title}
                </option>
              ))}
            </select>

            {/* Scale Target Badge (Section 37) */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(56, 189, 248, 0.1)", border: "1px solid rgba(56, 189, 248, 0.3)", padding: "4px 10px", borderRadius: 8 }}>
              <span style={{ fontSize: 10, color: "#38bdf8", fontWeight: 800 }}>⚡ SCALE</span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
                {activeChallenge.scale_metrics.split(".")[0]}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Technical Spec Drawer Button (Section 35) */}
            <button
              onClick={() => setIsSpecDrawerOpen(true)}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid rgba(255,255,255,0.15)",
                background: "rgba(255,255,255,0.05)",
                color: "#e2e8f0",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <span>📄</span>
              <span>Technical Spec</span>
            </button>

            {/* Reference Blueprint Drawer Button (Section 34) */}
            <button
              onClick={() => setIsBlueprintDrawerOpen(true)}
              style={{
                padding: "6px 12px",
                borderRadius: 8,
                border: "1px solid rgba(245,158,11,0.35)",
                background: "rgba(245,158,11,0.1)",
                color: "#fbbf24",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6
              }}
            >
              <span>💡</span>
              <span>Reference Blueprint (Study)</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── INTERVIEW PROGRESSION INDICATOR (Section 16) ── */}
      <div style={{ backgroundColor: "#0b1120", borderBottom: "1px solid rgba(255, 255, 255, 0.06)", padding: "8px 24px" }}>
        <div style={{ maxWidth: 1480, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {[
              { id: "requirements", step: "1", title: "Requirements & Clarification" },
              { id: "architecture", step: "2", title: "Architecture Canvas" },
              { id: "deep_dive", step: "3", title: "Storage & Deep Dive" },
              { id: "chaos", step: "4", title: "Chaos & Resilience" },
              { id: "review", step: "5", title: "Defense & Diagnostic" }
            ].map((p, idx) => {
              const isActive = phase === p.id;
              const isPast =
                (phase === "architecture" && p.id === "requirements") ||
                (phase === "deep_dive" && ["requirements", "architecture"].includes(p.id)) ||
                (phase === "chaos" && ["requirements", "architecture", "deep_dive"].includes(p.id)) ||
                (phase === "review");

              return (
                <React.Fragment key={p.id}>
                  {idx > 0 && <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 11 }}>➔</span>}
                  <button
                    onClick={() => setPhase(p.id as InterviewPhase)}
                    style={{
                      background: isActive ? "rgba(168,85,247,0.2)" : "transparent",
                      border: isActive ? "1px solid rgba(168,85,247,0.5)" : "1px solid transparent",
                      color: isActive ? "#c084fc" : isPast ? "#34d399" : "rgba(255,255,255,0.4)",
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: isActive || isPast ? 800 : 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 6
                    }}
                  >
                    <span>{isPast && !isActive ? "✓" : p.step}.</span>
                    <span>{p.title}</span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          {/* Quick Stepper Action */}
          <div style={{ display: "flex", gap: 8 }}>
            {phase === "requirements" && (
              <button
                onClick={() => setPhase("architecture")}
                style={{
                  padding: "5px 14px",
                  borderRadius: 6,
                  border: "none",
                  background: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)",
                  color: "white",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                Proceed to Canvas ➔
              </button>
            )}
            {phase === "architecture" && (
              <button
                onClick={() => setPhase("deep_dive")}
                style={{
                  padding: "5px 14px",
                  borderRadius: 6,
                  border: "none",
                  background: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)",
                  color: "white",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                Proceed to Deep Dive ➔
              </button>
            )}
            {phase === "deep_dive" && (
              <button
                onClick={handleTriggerIntelligentChaos}
                style={{
                  padding: "5px 14px",
                  borderRadius: 6,
                  border: "none",
                  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  color: "white",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                💥 Trigger Chaos Drill ➔
              </button>
            )}
            {phase === "chaos" && (
              <button
                onClick={handleSubmitInterview}
                disabled={evaluating}
                style={{
                  padding: "5px 14px",
                  borderRadius: 6,
                  border: "none",
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "white",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: evaluating ? "not-allowed" : "pointer"
                }}
              >
                {evaluating ? "Evaluating..." : "Finish Interview & Review ➔"}
              </button>
            )}
          </div>

        </div>
      </div>

      <main style={{ maxWidth: 1480, margin: "0 auto", padding: "16px 24px" }}>

        {/* Learning Mode Guided Banner */}
        {mode === "learning" && (
          <div style={{ background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.25)", borderRadius: 12, padding: "10px 16px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>💡</span>
              <div style={{ fontSize: 12, color: "white" }}>
                <strong>Learning Mode:</strong> High-frequency rate-limiting directly querying PostgreSQL will cause connection exhaustion. Try adding a <strong>Redis Cluster</strong> from the component library.
              </div>
            </div>
            <span style={{ fontSize: 10, padding: "2px 8px", background: "rgba(56, 189, 248, 0.2)", color: "#38bdf8", borderRadius: 6, fontWeight: 700 }}>
              Guided Mode
            </span>
          </div>
        )}

        {/* ── CHAOS SURGE ALERT BANNER (Shown during chaos) ── */}
        {chaosInjected && chaosScenario && (
          <div style={{ background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.5)", borderRadius: 14, padding: "14px 20px", marginBottom: 16, boxShadow: "0 0 30px rgba(245,158,11,0.15)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>🚨</span>
                <h3 style={{ fontSize: 13, fontWeight: 900, margin: 0, color: "#fbbf24" }}>
                  {chaosScenario.title}
                </h3>
              </div>
              <span style={{ fontSize: 10, padding: "2px 8px", background: "rgba(245,158,11,0.2)", color: "#fef08a", borderRadius: 4, fontWeight: 800 }}>
                ACTIVE RESILIENCE DRILL
              </span>
            </div>
            
            <p style={{ margin: "0 0 10px", fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>
              {chaosScenario.description}
            </p>

            <div style={{ padding: "10px 14px", background: "rgba(0,0,0,0.4)", borderRadius: 8, border: "1px solid rgba(245,158,11,0.3)", marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#fbbf24", marginBottom: 2 }}>
                🎙️ Interviewer Challenge:
              </div>
              <div style={{ fontSize: 12, color: "white", fontWeight: 700 }}>
                {chaosScenario.interviewerProbe}
              </div>
            </div>

            <textarea
              value={chaosDefense}
              onChange={e => setChaosDefense(e.target.value)}
              placeholder="Explain how your architecture survives: fail-open vs fail-closed policy, circuit breakers, fallback token bucket in gateway memory, and queue buffering..."
              rows={2}
              style={{
                width: "100%",
                background: "#080b12",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 8,
                padding: 10,
                color: "white",
                fontSize: 12,
                outline: "none"
              }}
            />
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            PHASE 1: REQUIREMENTS & CLARIFICATION (Section 17, 18)
            ══════════════════════════════════════════════════════════════ */}
        {phase === "requirements" && (
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 18, marginBottom: 20 }}>
            
            {/* Left: Clarification Dialogue */}
            <div style={{ background: "rgba(15, 23, 42, 0.85)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 14, padding: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🎙️</span>
                  <h2 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: "white" }}>
                    Phase 1: Clarify Problem Requirements
                  </h2>
                </div>
                <span style={{ fontSize: 11, padding: "2px 8px", background: "rgba(168,85,247,0.15)", color: "#c084fc", borderRadius: 6, fontWeight: 700 }}>
                  Interactive Brief
                </span>
              </div>

              {/* Initial Problem Prompt */}
              <div style={{ padding: "12px 16px", borderRadius: 10, background: "rgba(99, 102, 241, 0.1)", border: "1px solid rgba(99, 102, 241, 0.25)", marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#a5b4fc", textTransform: "uppercase", marginBottom: 4 }}>
                  Problem Statement
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "white", marginBottom: 4 }}>
                  &ldquo;{activeChallenge.description}&rdquo;
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>
                  Before opening the whiteboard, clarify requirements regarding caller identity, SLA latency, accuracy tolerances, and outage policies.
                </div>
              </div>

              {/* Clarification Q&A History */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14, maxHeight: 280, overflowY: "auto", paddingRight: 4 }}>
                {clarificationsAsked.map(item => (
                  <div key={item.id} style={{ borderRadius: 8, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", padding: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 11 }}>👤</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#38bdf8" }}>
                        Candidate asked: {item.question}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 6, paddingLeft: 16 }}>
                      <span style={{ fontSize: 11 }}>🏛️</span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", lineHeight: 1.4 }}>
                        {item.interviewerResponse}
                      </span>
                    </div>
                  </div>
                ))}

                {clarificationThinking && (
                  <div style={{ fontSize: 11, color: "#a855f7", fontStyle: "italic", padding: "6px 10px" }}>
                    Interviewer is evaluating requirement specification...
                  </div>
                )}
              </div>

              {/* Suggested Questions to Ask */}
              {availableClarifications.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", marginBottom: 6 }}>
                    Suggested Clarifying Probes (Click to Ask):
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {availableClarifications.map(c => (
                      <button
                        key={c.id}
                        onClick={() => handleAskClarification(c)}
                        disabled={clarificationThinking}
                        style={{
                          padding: "5px 10px",
                          borderRadius: 6,
                          border: "1px solid rgba(255,255,255,0.12)",
                          background: "rgba(255,255,255,0.04)",
                          color: "white",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                          textAlign: "left"
                        }}
                      >
                        💬 {c.question}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Clarification Input */}
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={customQuestionInput}
                  onChange={e => setCustomQuestionInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAskCustomQuestion()}
                  placeholder="Ask any custom clarifying question (e.g. Do we require multi-region replication?)..."
                  style={{
                    flex: 1,
                    background: "#080b12",
                    border: "1px solid rgba(255,255,255,0.15)",
                    borderRadius: 8,
                    padding: "8px 12px",
                    color: "white",
                    fontSize: 11,
                    outline: "none"
                  }}
                />
                <button
                  onClick={handleAskCustomQuestion}
                  disabled={clarificationThinking || !customQuestionInput.trim()}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "none",
                    background: "#a855f7",
                    color: "white",
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: customQuestionInput.trim() ? "pointer" : "not-allowed"
                  }}
                >
                  Ask ➔
                </button>
              </div>

            </div>

            {/* Right: Discovered Requirements */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: "rgba(15, 23, 42, 0.85)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 14, padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#34d399", textTransform: "uppercase" }}>
                    ✓ Discovered Requirements ({clarificationsAsked.length})
                  </div>
                </div>

                {clarificationsAsked.length === 0 ? (
                  <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", padding: "24px 10px", lineHeight: 1.5 }}>
                    No requirements uncovered yet. Ask the interviewer clarifying questions on the left.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {clarificationsAsked.map(c => (
                      <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)", borderRadius: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: "#a7f3d0" }}>
                          {c.discoveredSpec.label}
                        </span>
                        <span style={{ fontSize: 11, color: "white", fontWeight: 600 }}>
                          {c.discoveredSpec.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setPhase("architecture")}
                  style={{
                    width: "100%",
                    marginTop: 14,
                    padding: "9px",
                    borderRadius: 8,
                    border: "none",
                    background: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)",
                    color: "white",
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  Proceed to Architecture Canvas ➔
                </button>
              </div>

              {/* Bar-Raiser Principle Note */}
              <div style={{ background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.25)", borderRadius: 12, padding: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#818cf8", marginBottom: 2 }}>
                  💡 Interview Assessment Standard
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>
                  In Tier-1 evaluations, starting with a blank canvas and asking targeted scope questions distinguishes senior engineers from candidates who memorize diagrams.
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            PHASE 2: INTERACTIVE ARCHITECTURE CANVAS (Whiteboard)
            ══════════════════════════════════════════════════════════════ */}
        {phase === "architecture" && (
          <div style={{ display: "grid", gridTemplateColumns: selectedNode || selectedEdge ? "1fr 280px" : "1fr", gap: 16, marginBottom: 20, transition: "grid-template-columns 0.25s ease" }}>
            
            {/* Whiteboard Workspace */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              
              {/* Whiteboard Toolbar (Section 38, 58, 59) */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(15, 23, 42, 0.85)", border: "1px solid rgba(255, 255, 255, 0.08)", padding: "7px 12px", borderRadius: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  
                  {/* + Components Popover Button (Section 4, 51) */}
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={() => setIsPaletteOpen(!isPaletteOpen)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 6,
                        border: "1px solid rgba(168,85,247,0.4)",
                        background: "rgba(168,85,247,0.2)",
                        color: "#c084fc",
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                      }}
                    >
                      <span>➕</span>
                      <span>Components {isPaletteOpen ? "▲" : "▼"}</span>
                    </button>

                    {/* Popover Component List */}
                    {isPaletteOpen && (
                      <div style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        marginTop: 6,
                        width: 220,
                        background: "#0f172a",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: 10,
                        padding: 6,
                        boxShadow: "0 10px 30px rgba(0,0,0,0.85)",
                        zIndex: 100,
                        display: "grid",
                        gridTemplateColumns: "1fr",
                        gap: 3
                      }}>
                        {PALETTE_COMPONENTS.map(c => (
                          <button
                            key={c.type}
                            onClick={() => handleAddPaletteNode(c)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "6px 8px",
                              borderRadius: 6,
                              border: "none",
                              background: "transparent",
                              color: "white",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                              textAlign: "left"
                            }}
                          >
                            <span>{c.icon}</span>
                            <span>{c.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Connect Tool (Section 10) */}
                  <button
                    onClick={() => {
                      setIsConnectMode(!isConnectMode);
                      setConnectingSourceId(null);
                    }}
                    style={{
                      padding: "5px 10px",
                      borderRadius: 6,
                      border: isConnectMode ? "1px solid rgba(56,189,248,0.6)" : "1px solid rgba(255,255,255,0.1)",
                      background: isConnectMode ? "rgba(56,189,248,0.2)" : "rgba(255,255,255,0.04)",
                      color: isConnectMode ? "#38bdf8" : "#94a3b8",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 5
                    }}
                  >
                    <span>🔗</span>
                    <span>{isConnectMode ? (connectingSourceId ? "Select Target..." : "Click Source Node") : "Connect"}</span>
                  </button>

                  {/* Undo & Redo (Section 58) */}
                  <button
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    style={{
                      padding: "5px 8px",
                      borderRadius: 6,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.04)",
                      color: historyIndex <= 0 ? "rgba(255,255,255,0.2)" : "#94a3b8",
                      fontSize: 11,
                      cursor: historyIndex <= 0 ? "not-allowed" : "pointer"
                    }}
                    title="Undo (Ctrl+Z)"
                  >
                    ↩ Undo
                  </button>
                  <button
                    onClick={handleRedo}
                    disabled={historyIndex >= history.length - 1}
                    style={{
                      padding: "5px 8px",
                      borderRadius: 6,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.04)",
                      color: historyIndex >= history.length - 1 ? "rgba(255,255,255,0.2)" : "#94a3b8",
                      fontSize: 11,
                      cursor: historyIndex >= history.length - 1 ? "not-allowed" : "pointer"
                    }}
                    title="Redo (Ctrl+Y)"
                  >
                    ↪ Redo
                  </button>

                  {/* Auto-Arrange (Section 57) */}
                  <button
                    onClick={handleAutoArrange}
                    disabled={canvasNodes.length === 0}
                    style={{
                      padding: "5px 8px",
                      borderRadius: 6,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.04)",
                      color: "#94a3b8",
                      fontSize: 11,
                      cursor: canvasNodes.length === 0 ? "not-allowed" : "pointer"
                    }}
                    title="Clean tier-based layout"
                  >
                    🔀 Auto-Arrange
                  </button>

                  {/* Clear Canvas (Section 59) */}
                  <button
                    onClick={() => {
                      if (canvasNodes.length > 0) {
                        setIsClearConfirmOpen(true);
                      }
                    }}
                    disabled={canvasNodes.length === 0}
                    style={{
                      padding: "5px 8px",
                      borderRadius: 6,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.04)",
                      color: canvasNodes.length === 0 ? "rgba(255,255,255,0.2)" : "#f87171",
                      fontSize: 11,
                      cursor: canvasNodes.length === 0 ? "not-allowed" : "pointer"
                    }}
                  >
                    🧹 Clear
                  </button>
                </div>

                {/* Zoom & Canvas Graph Count */}
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <button
                      onClick={() => setZoomScale(prev => Math.max(0.7, prev - 0.1))}
                      style={{ padding: "3px 6px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "white", fontSize: 10, cursor: "pointer" }}
                    >
                      -
                    </button>
                    <span style={{ fontSize: 10, color: "#94a3b8", minWidth: 32, textAlign: "center" }}>
                      {Math.round(zoomScale * 100)}%
                    </span>
                    <button
                      onClick={() => setZoomScale(prev => Math.min(1.3, prev + 0.1))}
                      style={{ padding: "3px 6px", borderRadius: 4, border: "1px solid rgba(255,255,255,0.1)", background: "transparent", color: "white", fontSize: 10, cursor: "pointer" }}
                    >
                      +
                    </button>
                  </div>

                  <span style={{ fontSize: 11, color: "#94a3b8" }}>
                    {canvasNodes.length} Nodes • {canvasEdges.length} Connections
                  </span>
                </div>
              </div>

              {/* Whiteboard Canvas (Section 3, 6) */}
              <div
                ref={canvasRef}
                onMouseMove={handleMouseMoveCanvas}
                onMouseUp={handleMouseUpCanvas}
                onClick={() => {
                  setSelectedNodeId(null);
                  setSelectedEdgeId(null);
                }}
                style={{
                  height: 480,
                  background: "#080b14",
                  border: "1px solid rgba(99, 102, 241, 0.25)",
                  borderRadius: 14,
                  position: "relative",
                  overflow: "hidden",
                  boxShadow: "inset 0 0 50px rgba(0,0,0,0.85)",
                  cursor: isConnectMode ? "crosshair" : "default"
                }}
              >
                {/* Canvas Grid Background */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)",
                    backgroundSize: "22px 22px"
                  }}
                />

                {/* Empty State Prompt for Interview Mode (Section 1) */}
                {canvasNodes.length === 0 && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", pointerEvents: "none" }}>
                    <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.6 }}>🏗️</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.7)" }}>
                      Interview Mode: Blank Architecture Canvas
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
                      Click <strong>[+ Components]</strong> in the top toolbar to begin placing system components.
                    </div>
                  </div>
                )}

                {/* SVG Connections Layer (Section 10, 11) */}
                <svg
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    pointerEvents: "none",
                    transform: `scale(${zoomScale})`,
                    transformOrigin: "top left"
                  }}
                >
                  <defs>
                    <marker
                      id="arrow"
                      viewBox="0 0 10 10"
                      refX="10"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#c084fc" />
                    </marker>
                    <marker
                      id="arrow-selected"
                      viewBox="0 0 10 10"
                      refX="10"
                      refY="5"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
                    </marker>
                  </defs>

                  {canvasEdges.map(edge => {
                    const src = canvasNodes.find(n => n.id === edge.from);
                    const tgt = canvasNodes.find(n => n.id === edge.to);
                    if (!src || !tgt) return null;

                    const isEdgeSelected = edge.id === selectedEdgeId;

                    const x1 = src.x + 75;
                    const y1 = src.y + 35;
                    const x2 = tgt.x + 75;
                    const y2 = tgt.y + 35;

                    const mx = (x1 + x2) / 2;
                    const my = (y1 + y2) / 2;

                    return (
                      <g key={edge.id} style={{ pointerEvents: "auto", cursor: "pointer" }} onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEdgeId(edge.id);
                        setSelectedNodeId(null);
                      }}>
                        <path
                          d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                          stroke={isEdgeSelected ? "#38bdf8" : "#a855f7"}
                          strokeWidth={isEdgeSelected ? "3" : "2"}
                          strokeDasharray={edge.pattern === "async" ? "5 3" : undefined}
                          fill="none"
                          markerEnd={isEdgeSelected ? "url(#arrow-selected)" : "url(#arrow)"}
                          opacity="0.85"
                        />
                        {edge.protocol && (
                          <text
                            x={mx}
                            y={my - 6}
                            fill={isEdgeSelected ? "#38bdf8" : "#c084fc"}
                            fontSize="9"
                            fontWeight="800"
                            textAnchor="middle"
                            style={{ userSelect: "none" }}
                          >
                            {edge.protocol}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Canvas Nodes (Movable, Selectable) */}
                <div style={{ transform: `scale(${zoomScale})`, transformOrigin: "top left", width: "100%", height: "100%", position: "absolute" }}>
                  {canvasNodes.map(node => {
                    const isSel = node.id === selectedNodeId;
                    const isConnectingSrc = node.id === connectingSourceId;

                    return (
                      <div
                        key={node.id}
                        onMouseDown={e => handleMouseDownNode(e, node)}
                        onClick={e => {
                          e.stopPropagation();
                          if (!isConnectMode) {
                            setSelectedNodeId(node.id);
                            setSelectedEdgeId(null);
                          }
                        }}
                        style={{
                          position: "absolute",
                          left: node.x,
                          top: node.y,
                          padding: "8px 12px",
                          borderRadius: 10,
                          background: isSel
                            ? "linear-gradient(135deg, rgba(168,85,247,0.35) 0%, rgba(15,23,42,0.95) 100%)"
                            : isConnectingSrc
                            ? "rgba(56,189,248,0.3)"
                            : "rgba(15, 23, 42, 0.9)",
                          border: isSel
                            ? "2px solid #c084fc"
                            : isConnectingSrc
                            ? "2px solid #38bdf8"
                            : "1px solid rgba(255,255,255,0.15)",
                          boxShadow: isSel ? "0 0 20px rgba(168,85,247,0.4)" : "0 4px 12px rgba(0,0,0,0.6)",
                          cursor: isConnectMode ? "crosshair" : "grab",
                          userSelect: "none",
                          minWidth: 130,
                          zIndex: isSel ? 20 : 10
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                          <span style={{ fontSize: 16 }}>{node.icon}</span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: "white" }}>{node.label}</span>
                        </div>
                        {node.role && (
                          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {node.role}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* Dynamic Interviewer Dialogue Box (Section 20, 53) */}
              <div style={{ background: "rgba(15, 23, 42, 0.9)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 12, padding: "12px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 15 }}>🎙️</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#c084fc", textTransform: "uppercase" }}>
                      Interviewer Live Probe
                    </span>
                  </div>
                  <span style={{ fontSize: 10, color: "#94a3b8" }}>
                    Reasoning Engine Active
                  </span>
                </div>

                {/* Conversation Stream */}
                <div style={{ maxHeight: 110, overflowY: "auto", marginBottom: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                  {interviewerLog.slice(-3).map((item, idx) => (
                    <div key={idx} style={{ fontSize: 12, color: item.sender === "interviewer" ? "white" : "#38bdf8", lineHeight: 1.4 }}>
                      <strong>{item.sender === "interviewer" ? "🏛️ Interviewer: " : "👤 You: "}</strong>
                      {item.text}
                    </div>
                  ))}
                </div>

                {/* Candidate Response Input with Voice Option */}
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    value={candidateResponse}
                    onChange={e => setCandidateResponse(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleSendCandidateResponse()}
                    placeholder="Defend your architectural choice or explain your flow..."
                    style={{
                      flex: 1,
                      background: "#080b12",
                      border: "1px solid rgba(255,255,255,0.15)",
                      borderRadius: 8,
                      padding: "8px 12px",
                      color: "white",
                      fontSize: 11,
                      outline: "none"
                    }}
                  />
                  <button
                    onClick={handleToggleVoice}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: isVoiceRecording ? "1px solid #ef4444" : "1px solid rgba(255,255,255,0.15)",
                      background: isVoiceRecording ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.05)",
                      color: isVoiceRecording ? "#f87171" : "#94a3b8",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                    title="Speak using voice recognition"
                  >
                    {isVoiceRecording ? "🔴 Listening..." : "🎙️ Speak"}
                  </button>
                  <button
                    onClick={handleSendCandidateResponse}
                    disabled={!candidateResponse.trim()}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 8,
                      border: "none",
                      background: "#a855f7",
                      color: "white",
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: candidateResponse.trim() ? "pointer" : "not-allowed"
                    }}
                  >
                    Send ➔
                  </button>
                </div>
              </div>

            </div>

            {/* Contextual Inspector: Component OR Connection (Section 7, 11, 52) */}
            {selectedNode && (
              <div style={{ background: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(168, 85, 247, 0.4)", borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ fontSize: 20 }}>{selectedNode.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 900, color: "white" }}>{selectedNode.label}</div>
                        <div style={{ fontSize: 10, color: "#818cf8" }}>ID: {selectedNode.id}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedNodeId(null)}
                      style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 14 }}
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 10, color: "#94a3b8", display: "block", marginBottom: 4, fontWeight: 700 }}>
                      Role & Workload Rationale:
                    </label>
                    <textarea
                      value={selectedNode.role || ""}
                      onChange={e => {
                        const val = e.target.value;
                        setCanvasNodes(prev => prev.map(n => n.id === selectedNode.id ? { ...n, role: val, annotation: val } : n));
                      }}
                      rows={3}
                      style={{
                        width: "100%",
                        background: "#080b12",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: 6,
                        padding: 8,
                        color: "white",
                        fontSize: 11,
                        outline: "none"
                      }}
                    />
                  </div>

                  {/* Failure Modes */}
                  <div style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 10 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#38bdf8", marginBottom: 2 }}>
                      ⚠️ Potential Failure Modes:
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", lineHeight: 1.4 }}>
                      {selectedNode.type === "cache" && "• Memory fragmentation\n• Replication lag\n• Cache stampede"}
                      {selectedNode.type === "gateway" && "• CPU exhaustion under TLS\n• Bottleneck if not horizontally scaled"}
                      {selectedNode.type === "db" && "• Connection pool exhaustion\n• Disk I/O throttling"}
                      {selectedNode.type !== "cache" && selectedNode.type !== "gateway" && selectedNode.type !== "db" && "• Network partition latency\n• Failover timeout"}
                    </div>
                  </div>

                  {/* Duplicate Node (Section 9) */}
                  <button
                    onClick={handleDuplicateSelectedNode}
                    style={{
                      width: "100%",
                      padding: "6px",
                      borderRadius: 6,
                      border: "1px solid rgba(56,189,248,0.3)",
                      background: "rgba(56,189,248,0.1)",
                      color: "#38bdf8",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      marginBottom: 8
                    }}
                  >
                    📑 Duplicate (Horizontal Scale)
                  </button>
                </div>

                {/* Delete Node (Section 8) */}
                <button
                  onClick={handleDeleteSelectedNode}
                  style={{
                    width: "100%",
                    padding: "6px",
                    borderRadius: 6,
                    border: "none",
                    background: "rgba(239,68,68,0.2)",
                    color: "#f87171",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  🗑️ Delete Component
                </button>
              </div>
            )}

            {/* Contextual Connection Inspector (Section 11, 12) */}
            {selectedEdge && !selectedNode && (
              <div style={{ background: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(56, 189, 248, 0.4)", borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 900, color: "#38bdf8" }}>Connection Inspector</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.6)" }}>
                        {canvasNodes.find(n => n.id === selectedEdge.from)?.label} ➔ {canvasNodes.find(n => n.id === selectedEdge.to)?.label}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedEdgeId(null)}
                      style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 14 }}
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 10, color: "#94a3b8", display: "block", marginBottom: 3, fontWeight: 700 }}>
                      Communication Protocol:
                    </label>
                    <select
                      value={selectedEdge.protocol || "HTTP/2"}
                      onChange={e => {
                        const val = e.target.value;
                        setCanvasEdges(prev => prev.map(ed => ed.id === selectedEdge.id ? { ...ed, protocol: val } : ed));
                      }}
                      style={{
                        width: "100%",
                        background: "#080b12",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: 6,
                        padding: 6,
                        color: "white",
                        fontSize: 11,
                        outline: "none"
                      }}
                    >
                      <option value="HTTPS">HTTPS / REST</option>
                      <option value="HTTP/2">HTTP/2 / gRPC</option>
                      <option value="RESP">RESP (Redis Protocol)</option>
                      <option value="SQL">SQL (TCP)</option>
                      <option value="Kafka TCP">Kafka TCP</option>
                      <option value="WebSocket">WebSocket (WSS)</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 10, color: "#94a3b8", display: "block", marginBottom: 3, fontWeight: 700 }}>
                      Pattern:
                    </label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => setCanvasEdges(prev => prev.map(ed => ed.id === selectedEdge.id ? { ...ed, pattern: "sync" } : ed))}
                        style={{
                          flex: 1,
                          padding: "5px",
                          borderRadius: 6,
                          border: "none",
                          background: selectedEdge.pattern === "sync" ? "#38bdf8" : "rgba(255,255,255,0.06)",
                          color: selectedEdge.pattern === "sync" ? "#080b12" : "white",
                          fontSize: 10,
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        Synchronous
                      </button>
                      <button
                        onClick={() => setCanvasEdges(prev => prev.map(ed => ed.id === selectedEdge.id ? { ...ed, pattern: "async" } : ed))}
                        style={{
                          flex: 1,
                          padding: "5px",
                          borderRadius: 6,
                          border: "none",
                          background: selectedEdge.pattern === "async" ? "#a855f7" : "rgba(255,255,255,0.06)",
                          color: "white",
                          fontSize: 10,
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        Asynchronous
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 10, color: "#94a3b8", display: "block", marginBottom: 3, fontWeight: 700 }}>
                      Purpose & Notes:
                    </label>
                    <textarea
                      value={selectedEdge.purpose || ""}
                      onChange={e => {
                        const val = e.target.value;
                        setCanvasEdges(prev => prev.map(ed => ed.id === selectedEdge.id ? { ...ed, purpose: val } : ed));
                      }}
                      rows={2}
                      style={{
                        width: "100%",
                        background: "#080b12",
                        border: "1px solid rgba(255,255,255,0.15)",
                        borderRadius: 6,
                        padding: 6,
                        color: "white",
                        fontSize: 11,
                        outline: "none"
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleDeleteSelectedEdge}
                  style={{
                    width: "100%",
                    padding: "6px",
                    borderRadius: 6,
                    border: "none",
                    background: "rgba(239,68,68,0.2)",
                    color: "#f87171",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    marginTop: 10
                  }}
                >
                  🗑️ Delete Connection
                </button>
              </div>
            )}

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            PHASE 3: STORAGE & DEEP DIVE (Contextual Checkpoints)
            ══════════════════════════════════════════════════════════════ */}
        {phase === "deep_dive" && (
          <div style={{ background: "rgba(15, 23, 42, 0.85)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: 14, padding: 20, marginBottom: 20 }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 10, color: "#a855f7", fontWeight: 800, textTransform: "uppercase" }}>
                  Phase 3 of 5 • Contextual Architectural Checkpoints
                </div>
                <h2 style={{ fontSize: 16, fontWeight: 900, margin: "2px 0 0", color: "white" }}>
                  Storage, Data Modeling & Eviction Strategy
                </h2>
              </div>

              {/* Checkpoint Tabs */}
              <div style={{ display: "flex", background: "rgba(0,0,0,0.4)", padding: 3, borderRadius: 8 }}>
                {[
                  { id: "flow", label: "1. Request Flow", color: "#38bdf8" },
                  { id: "db", label: "2. Storage & Sharding", color: "#34d399" },
                  { id: "cache", label: "3. Caching & State", color: "#fbbf24" },
                  { id: "bottlenecks", label: "4. Failure Resilience", color: "#f87171" }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveDeepDiveTab(t.id as any)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 6,
                      border: "none",
                      background: activeDeepDiveTab === t.id ? "rgba(255,255,255,0.1)" : "transparent",
                      color: activeDeepDiveTab === t.id ? t.color : "#94a3b8",
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: "pointer"
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab 1: Request Flow */}
            {activeDeepDiveTab === "flow" && (
              <div>
                <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(56, 189, 248, 0.08)", border: "1px solid rgba(56, 189, 248, 0.2)", marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#38bdf8", marginBottom: 2 }}>
                    🎙️ Interviewer Prompt:
                  </div>
                  <div style={{ fontSize: 12, color: "white", fontWeight: 600 }}>
                    &ldquo;Walk me through the exact path an incoming request takes from DNS through CDN, Gateway, and downstream services. Where is rate-limit check evaluated?&rdquo;
                  </div>
                </div>
                <textarea
                  value={candidateArchitecture}
                  onChange={e => setCandidateArchitecture(e.target.value)}
                  placeholder="Clients -> Cloudflare CDN -> AWS ALB -> Node.js API Gateway -> Rate Limiter Middleware. The middleware queries an in-memory Redis cluster before proxying requests to internal backend microservices..."
                  rows={5}
                  style={{ width: "100%", background: "#080b12", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: 10, color: "white", fontSize: 11, outline: "none", lineHeight: 1.5 }}
                />
              </div>
            )}

            {/* Tab 2: Database & Sharding */}
            {activeDeepDiveTab === "db" && (
              <div>
                <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(52, 211, 153, 0.08)", border: "1px solid rgba(52, 211, 153, 0.2)", marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#34d399", marginBottom: 2 }}>
                    🎙️ Interviewer Prompt:
                  </div>
                  <div style={{ fontSize: 12, color: "white", fontWeight: 600 }}>
                    &ldquo;Why did you choose this storage layer? How is your data partitioned across shards, and what consistency model (ACID vs Eventual) do you maintain?&rdquo;
                  </div>
                </div>
                <textarea
                  value={databaseChoice}
                  onChange={e => setDatabaseChoice(e.target.value)}
                  placeholder="Redis Cluster with Sentinel for automatic failover. For long-term audit logs and user plan quotas, PostgreSQL RDS with read replicas..."
                  rows={5}
                  style={{ width: "100%", background: "#080b12", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: 10, color: "white", fontSize: 11, outline: "none", lineHeight: 1.5 }}
                />
              </div>
            )}

            {/* Tab 3: Caching & Eviction */}
            {activeDeepDiveTab === "cache" && (
              <div>
                <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(251, 191, 36, 0.08)", border: "1px solid rgba(251, 191, 36, 0.2)", marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#fbbf24", marginBottom: 2 }}>
                    🎙️ Interviewer Prompt:
                  </div>
                  <div style={{ fontSize: 12, color: "white", fontWeight: 600 }}>
                    &ldquo;How do you avoid race conditions on high-frequency counter updates? What is your eviction policy when memory approaches capacity?&rdquo;
                  </div>
                </div>
                <textarea
                  value={cachingStrategy}
                  onChange={e => setCachingStrategy(e.target.value)}
                  placeholder="Redis sliding window counter using Redis Hashes. Set TTL on keys equal to rate limit window (60s). Check-and-increment executes atomically inside Lua scripts..."
                  rows={5}
                  style={{ width: "100%", background: "#080b12", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: 10, color: "white", fontSize: 11, outline: "none", lineHeight: 1.5 }}
                />
              </div>
            )}

            {/* Tab 4: Bottlenecks & Resilience */}
            {activeDeepDiveTab === "bottlenecks" && (
              <div>
                <div style={{ padding: "10px 14px", borderRadius: 8, background: "rgba(248, 113, 113, 0.08)", border: "1px solid rgba(248, 113, 113, 0.2)", marginBottom: 10 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#f87171", marginBottom: 2 }}>
                    🎙️ Interviewer Prompt:
                  </div>
                  <div style={{ fontSize: 12, color: "white", fontWeight: 600 }}>
                    &ldquo;What is the biggest Single Point of Failure (SPOF) in this system? If that node dies, how does the system recover without taking down customer APIs?&rdquo;
                  </div>
                </div>
                <textarea
                  value={bottleneckStrategy}
                  onChange={e => setBottleneckStrategy(e.target.value)}
                  placeholder="If Redis becomes unreachable, fail-open for tier-1 users to prevent complete platform downtime. Fallback to local in-memory token bucket on API Gateway instances..."
                  rows={5}
                  style={{ width: "100%", background: "#080b12", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 8, padding: 10, color: "white", fontSize: 11, outline: "none", lineHeight: 1.5 }}
                />
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
              <button
                onClick={() => setPhase("architecture")}
                style={{
                  padding: "7px 14px",
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "transparent",
                  color: "#94a3b8",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                ← Back to Canvas
              </button>

              <button
                onClick={handleTriggerIntelligentChaos}
                style={{
                  padding: "8px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                💥 Trigger Chaos Drill ➔
              </button>
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            PHASE 4: CHAOS & DEFENSE (Section 27, 28, 29)
            ══════════════════════════════════════════════════════════════ */}
        {phase === "chaos" && (
          <div style={{ background: "rgba(15, 23, 42, 0.85)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: 14, padding: 20, marginBottom: 20 }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <span style={{ fontSize: 10, padding: "2px 8px", background: "rgba(245,158,11,0.2)", color: "#fbbf24", borderRadius: 4, fontWeight: 800 }}>
                  PHASE 4: LIVE CHAOS DRILL
                </span>
                <h2 style={{ fontSize: 16, fontWeight: 900, margin: "4px 0 0", color: "white" }}>
                  Defend Architecture Under Simulated Catastrophe
                </h2>
              </div>

              <button
                onClick={handleTriggerIntelligentChaos}
                style={{
                  padding: "5px 10px",
                  borderRadius: 6,
                  border: "1px solid rgba(245,158,11,0.4)",
                  background: "rgba(245,158,11,0.1)",
                  color: "#fbbf24",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                🔄 Re-roll Chaos Incident
              </button>
            </div>

            {/* Quick Defense Templates */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 700, marginBottom: 6 }}>
                Quick Architectural Defense Strategies (Click to append):
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {[
                  "Tiered Fail-Open for authenticated VIPs with Prometheus P1 alert",
                  "Local In-Memory Token Bucket on API Gateway as secondary fallback",
                  "Circuit Breaker (Envoy / Resilience4j) tripping to half-open state",
                  "Kafka buffer queue to absorb 500k RPS write surge during DB partition"
                ].map(strat => (
                  <button
                    key={strat}
                    onClick={() => setChaosDefense(prev => prev ? `${prev}\n• ${strat}` : `• ${strat}`)}
                    style={{
                      padding: "4px 8px",
                      borderRadius: 6,
                      border: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.04)",
                      color: "rgba(255,255,255,0.85)",
                      fontSize: 10,
                      cursor: "pointer"
                    }}
                  >
                    + {strat}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
              <button
                onClick={() => setPhase("architecture")}
                style={{
                  padding: "7px 14px",
                  borderRadius: 6,
                  border: "1px solid rgba(255,255,255,0.15)",
                  background: "transparent",
                  color: "#94a3b8",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                ← Modify Architecture on Canvas
              </button>

              <button
                onClick={handleSubmitInterview}
                disabled={evaluating}
                style={{
                  padding: "10px 24px",
                  borderRadius: 8,
                  border: "none",
                  background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                  color: "white",
                  fontSize: 12,
                  fontWeight: 900,
                  cursor: evaluating ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 4px 15px rgba(16,185,129,0.3)"
                }}
              >
                <span>{evaluating ? "Evaluating System Design..." : "Finish Interview & Submit for Principal Review ➔"}</span>
              </button>
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            PHASE 5: EVIDENCE-BASED DIAGNOSTIC DOSSIER (Section 45, 46)
            ══════════════════════════════════════════════════════════════ */}
        {(phase === "review" || evalResult) && evalResult && (
          <div style={{ background: "rgba(15, 23, 42, 0.95)", border: "1px solid rgba(168, 85, 247, 0.4)", borderRadius: 16, padding: 24, boxShadow: "0 20px 50px rgba(0,0,0,0.7)", marginBottom: 24 }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, padding: "2px 8px", background: "rgba(16,185,129,0.2)", color: "#34d399", borderRadius: 6, fontWeight: 800, textTransform: "uppercase" }}>
                    🏛️ VERDICT: {evalResult.verdict}
                  </span>
                  <span style={{ fontSize: 10, padding: "2px 8px", background: mode === "learning" || hintUsed ? "rgba(245,158,11,0.2)" : "rgba(168,85,247,0.2)", color: mode === "learning" || hintUsed ? "#fbbf24" : "#c084fc", borderRadius: 6, fontWeight: 800 }}>
                    {mode === "learning" || hintUsed ? "Demonstrated with Guidance" : "Independently Demonstrated"}
                  </span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 900, margin: 0, color: "white" }}>
                  Principal Architect Critique & Evidence Dossier
                </h3>
              </div>

              {/* Secondary Score Display */}
              <div style={{ textAlign: "right", background: "rgba(255,255,255,0.04)", padding: "6px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)" }}>
                <div style={{ fontSize: 9, color: "#94a3b8", textTransform: "uppercase", fontWeight: 700 }}>
                  Scalability Score (Secondary)
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#38bdf8" }}>
                  {evalResult.scalabilityScore || 82}<span style={{ fontSize: 12, color: "#94a3b8" }}>/100</span>
                </div>
              </div>
            </div>

            {/* WHAT YOU DEMONSTRATED vs ARCHITECTURAL BOTTLENECK */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14, marginBottom: 16 }}>
              
              <div style={{ padding: 14, borderRadius: 12, background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)" }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: "#34d399", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>✓</span>
                  <span>WHAT YOU DEMONSTRATED</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {(evalResult.demonstrated || evalResult.strengths || ["Requirement clarification established scope", "Separation of concerns across gateway & storage"]).map((item: string, idx: number) => (
                    <div key={idx} style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", lineHeight: 1.4 }}>
                      • {item}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: 14, borderRadius: 12, background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.25)" }}>
                <div style={{ fontSize: 11, fontWeight: 900, color: "#f87171", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>⚠️</span>
                  <span>ARCHITECTURAL BOTTLENECK / UNPROVEN CLAIM</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {(evalResult.developing || evalResult.architecturalBottlenecks || ["Missing failover latency bounds on primary cache tier"]).map((item: string, idx: number) => (
                    <div key={idx} style={{ fontSize: 11, color: "rgba(255,255,255,0.9)", lineHeight: 1.4 }}>
                      • {item}
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* WHY IT MATTERS */}
            <div style={{ padding: 14, borderRadius: 10, background: "rgba(99, 102, 241, 0.08)", border: "1px solid rgba(99, 102, 241, 0.25)", marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#818cf8", textTransform: "uppercase", marginBottom: 3 }}>
                🔍 WHY IT MATTERS
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", lineHeight: 1.4 }}>
                {evalResult.whyItMatters || "Your target tier expects candidates to reason about resilience and partial failures, not only happy-path functional throughput."}
              </div>
            </div>

            {/* Principal Advice */}
            {evalResult.principalAdvice && (
              <div style={{ padding: 14, borderRadius: 10, background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#c084fc", textTransform: "uppercase", marginBottom: 3 }}>
                  🎙️ Principal Architect Commentary
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", lineHeight: 1.4 }}>
                  {evalResult.principalAdvice}
                </div>
              </div>
            )}

            {/* RECOMMENDED NEXT PRACTICE ACTION & ADAPTIVE RETRY (Section 47, 48) */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: "1px solid rgba(255,255,255,0.08)", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 9, color: "#94a3b8", textTransform: "uppercase", fontWeight: 800 }}>
                  RECOMMENDED NEXT PRACTICE ACTION
                </div>
                <div style={{ fontSize: 13, fontWeight: 900, color: "white", marginTop: 2 }}>
                  {evalResult.nextBestAction?.title || "15-Minute Failure-Recovery Drill"}
                </div>
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>
                  {evalResult.nextBestAction?.description || "Simulate a complete Redis partition with 500k req/s and implement tiered fail-open policies."}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                {evalResult.transferTest && (
                  <button
                    onClick={() => handleSelectChallenge(evalResult.transferTest.challengeId)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 8,
                      border: "1px solid rgba(56,189,248,0.4)",
                      background: "rgba(56,189,248,0.15)",
                      color: "#38bdf8",
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: "pointer"
                    }}
                  >
                    Transfer Test: {evalResult.transferTest.title} ➔
                  </button>
                )}

                <button
                  onClick={handleTriggerIntelligentChaos}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 8,
                    border: "none",
                    background: "linear-gradient(135deg, #a855f7 0%, #6366f1 100%)",
                    color: "white",
                    fontSize: 11,
                    fontWeight: 800,
                    cursor: "pointer"
                  }}
                >
                  Run Failure Drill ➔
                </button>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* ── TECHNICAL SPEC SLIDE-OVER DRAWER (Section 35) ── */}
      {isSpecDrawerOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: 440, background: "#0f172a", borderLeft: "1px solid rgba(255,255,255,0.15)", height: "100%", overflowY: "auto", padding: 22, boxShadow: "-10px 0 40px rgba(0,0,0,0.8)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>📄</span>
                <h3 style={{ fontSize: 15, fontWeight: 900, margin: 0, color: "white" }}>
                  Technical Spec Sheet
                </h3>
              </div>
              <button
                onClick={() => setIsSpecDrawerOpen(false)}
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 16 }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#38bdf8", textTransform: "uppercase" }}>Problem</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: "white", marginTop: 2 }}>{activeChallenge.title}</div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#fbbf24", textTransform: "uppercase" }}>Scale Target</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 2 }}>{activeChallenge.scale_metrics}</div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#34d399", textTransform: "uppercase", marginBottom: 4 }}>
                Functional Requirements
              </div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
                {activeChallenge.functional_requirements.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#f87171", textTransform: "uppercase", marginBottom: 4 }}>
                Non-Functional Requirements
              </div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
                {activeChallenge.non_functional_requirements.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#c084fc", textTransform: "uppercase", marginBottom: 4 }}>
                Architectural Hints
              </div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
                {activeChallenge.architectural_hints.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            <button
              onClick={() => setIsSpecDrawerOpen(false)}
              style={{
                width: "100%",
                padding: "9px",
                borderRadius: 8,
                border: "none",
                background: "#a855f7",
                color: "white",
                fontSize: 11,
                fontWeight: 800,
                cursor: "pointer"
              }}
            >
              Close Spec Sheet
            </button>
          </div>
        </div>
      )}

      {/* ── REFERENCE BLUEPRINT STUDY DRAWER (Section 34, 70) ── */}
      {isBlueprintDrawerOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 110, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: 480, background: "#0f172a", borderLeft: "1px solid rgba(245,158,11,0.4)", height: "100%", overflowY: "auto", padding: 22, boxShadow: "-10px 0 40px rgba(0,0,0,0.85)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>💡</span>
                <h3 style={{ fontSize: 15, fontWeight: 900, margin: 0, color: "#fbbf24" }}>
                  Reference Architecture Blueprint
                </h3>
              </div>
              <button
                onClick={() => setIsBlueprintDrawerOpen(false)}
                style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 16 }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.25)", marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", lineHeight: 1.4 }}>
                This is a <strong>study reference</strong> for learning. It does NOT overwrite your active whiteboard canvas in Interview Mode.
              </div>
            </div>

            {/* Blueprint Overview */}
            {(() => {
              const bp = REFERENCE_BLUEPRINTS[selectedChallengeId] || REFERENCE_BLUEPRINTS["sd-1"];
              return (
                <div>
                  <div style={{ fontSize: 11, color: "white", lineHeight: 1.5, marginBottom: 14 }}>
                    {bp.overview}
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#38bdf8", textTransform: "uppercase", marginBottom: 6 }}>
                      Components & Data Flow:
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {bp.nodes.map((n, i) => (
                        <div key={n.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", background: "rgba(255,255,255,0.04)", borderRadius: 6, fontSize: 11 }}>
                          <span>{n.icon}</span>
                          <span style={{ fontWeight: 800, color: "white" }}>{n.label}</span>
                          <span style={{ color: "#94a3b8" }}>— {n.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#fbbf24", textTransform: "uppercase", marginBottom: 6 }}>
                      Key Architectural Trade-offs:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
                      {bp.keyTradeoffs.map((t, idx) => (
                        <li key={idx} style={{ marginBottom: 4 }}>{t}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#34d399", textTransform: "uppercase", marginBottom: 6 }}>
                      Failure Mitigations:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 11, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>
                      {bp.failureMitigations.map((m, idx) => (
                        <li key={idx} style={{ marginBottom: 4 }}>{m}</li>
                      ))}
                    </ul>
                  </div>

                  {mode === "learning" && (
                    <button
                      onClick={() => {
                        setCanvasNodes(bp.nodes);
                        setCanvasEdges(bp.edges);
                        pushHistory(bp.nodes, bp.edges);
                        setHintUsed(true);
                        setIsBlueprintDrawerOpen(false);
                      }}
                      style={{
                        width: "100%",
                        padding: "9px",
                        borderRadius: 8,
                        border: "1px solid rgba(245,158,11,0.4)",
                        background: "rgba(245,158,11,0.2)",
                        color: "#fbbf24",
                        fontSize: 11,
                        fontWeight: 800,
                        cursor: "pointer",
                        marginBottom: 8
                      }}
                    >
                      Copy Blueprint to Learning Canvas (Guided Assistance) ➔
                    </button>
                  )}

                  <button
                    onClick={() => setIsBlueprintDrawerOpen(false)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: 8,
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "transparent",
                      color: "#94a3b8",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    Close Reference
                  </button>
                </div>
              );
            })()}

          </div>
        </div>
      )}

      {/* ── CONFIRM CLEAR CANVAS MODAL ── */}
      {isClearConfirmOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 120, display: "flex", justifyContent: "center", alignItems: "center", padding: 20 }}>
          <div style={{ width: "100%", maxWidth: 400, background: "#0f172a", border: "1px solid rgba(239,68,68,0.4)", borderRadius: 14, padding: 20, boxShadow: "0 20px 40px rgba(0,0,0,0.8)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <h3 style={{ fontSize: 14, fontWeight: 900, margin: 0, color: "#f87171" }}>
                Clear Whiteboard Canvas?
              </h3>
            </div>
            <p style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", margin: "0 0 14px", lineHeight: 1.4 }}>
              This will remove all {canvasNodes.length} nodes and {canvasEdges.length} connections from your canvas. You can undo this action.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                onClick={() => setIsClearConfirmOpen(false)}
                style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "#94a3b8", fontSize: 11, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClearCanvas}
                style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "#ef4444", color: "white", fontSize: 11, fontWeight: 800, cursor: "pointer" }}
              >
                Yes, Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pre-Session Brief Modal */}
      {sessionBrief && (
        <SessionBriefModal
          isOpen={isBriefOpen}
          onClose={() => setIsBriefOpen(false)}
          brief={sessionBrief}
          onStartSession={() => setIsBriefOpen(false)}
          targetHref="/student/skills/system-design"
        />
      )}

    </div>
  );
}

export default function SystemDesignPage() {
  return (
    <React.Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "#090d16" }} />}>
      <SystemDesignContent />
    </React.Suspense>
  );
}
