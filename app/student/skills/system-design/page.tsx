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

// ── COMPONENT PALETTE ──
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

// ── REFERENCE BLUEPRINTS ──
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
    }
  ]
};

function SystemDesignContent() {
  const searchParams = useSearchParams();
  const [candidateId, setCandidateId] = useState("student-demo");
  const [trackSlug, setTrackSlug] = useState<"service_mass" | "service_elite" | "product_mid" | "product_faang">("product_mid");

  const [challenges, setChallenges] = useState<SystemDesignChallenge[]>(SEED_SYSTEM_DESIGN_CHALLENGES);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>("sd-1");

  // Arena Mode: Interview Mode (Blank Canvas) vs Learning Mode (Guided Template)
  const [mode, setMode] = useState<ArenaMode>("interview");
  const [hintUsed, setHintUsed] = useState(false);

  // Phase Progression
  const [phase, setPhase] = useState<InterviewPhase>("requirements");

  // ── WHITEBOARD CANVAS STATE ──
  const [canvasNodes, setCanvasNodes] = useState<CanvasNode[]>([]);
  const [canvasEdges, setCanvasEdges] = useState<CanvasEdge[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  // Interaction: Drag, Connect, Zoom
  const [isConnectMode, setIsConnectMode] = useState(false);
  const [connectingSourceId, setConnectingSourceId] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [isPaletteOpen, setIsPaletteOpen] = useState(false);

  // Dragging State
  const canvasRef = useRef<HTMLDivElement>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [hasMovedDuringDrag, setHasMovedDuringDrag] = useState(false);

  // History for Undo / Redo
  const [history, setHistory] = useState<CanvasHistoryState[]>([{ nodes: [], edges: [] }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const pushHistory = (newNodes: CanvasNode[], newEdges: CanvasEdge[]) => {
    const trimmed = history.slice(0, historyIndex + 1);
    setHistory([...trimmed, { nodes: newNodes, edges: newEdges }]);
    setHistoryIndex(trimmed.length);
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const prev = history[historyIndex - 1];
      setCanvasNodes(prev.nodes);
      setCanvasEdges(prev.edges);
      setHistoryIndex(historyIndex - 1);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const next = history[historyIndex + 1];
      setCanvasNodes(next.nodes);
      setCanvasEdges(next.edges);
      setHistoryIndex(historyIndex + 1);
      setSelectedNodeId(null);
      setSelectedEdgeId(null);
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
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

  // ── CONVERSATION & INTERVIEWER DIALOGUE ──
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

  // ── PHASE 4: CHAOS INJECTION & DYNAMIC SCALE ──
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

    const rawTrack = searchParams.get("track");
    const validTracks = ["service_mass", "service_elite", "product_mid", "product_faang"];
    const paramTrack = (validTracks.includes(rawTrack || "") ? rawTrack : "product_mid") as "service_mass" | "service_elite" | "product_mid" | "product_faang";
    setTrackSlug(paramTrack);

    const brief = generateSessionBrief(paramTrack, "system_design", storedId);
    setSessionBrief(brief);

    const queryMode = searchParams.get("mode");
    if (queryMode === "learn" || queryMode === "learning") {
      setMode("learning");
      setCanvasNodes(LEARNING_STARTER_NODES);
      setCanvasEdges(LEARNING_STARTER_EDGES);
    } else if (queryMode === "interview" || queryMode === "practice") {
      setMode("interview");
      setCanvasNodes([]);
      setCanvasEdges([]);
    }
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

  // ── CANVAS OPERATIONS: ADD, MOVE, DUPLICATE, DELETE ──
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

  const handleDeleteSelectedNode = () => {
    if (!selectedNodeId) return;
    const nextNodes = canvasNodes.filter(n => n.id !== selectedNodeId);
    const nextEdges = canvasEdges.filter(e => e.from !== selectedNodeId && e.to !== selectedNodeId);

    setCanvasNodes(nextNodes);
    setCanvasEdges(nextEdges);
    pushHistory(nextNodes, nextEdges);
    setSelectedNodeId(null);
  };

  const handleDeleteSelectedEdge = () => {
    if (!selectedEdgeId) return;
    const nextEdges = canvasEdges.filter(e => e.id !== selectedEdgeId);
    setCanvasEdges(nextEdges);
    pushHistory(canvasNodes, nextEdges);
    setSelectedEdgeId(null);
  };

  const handleConfirmClearCanvas = () => {
    setCanvasNodes([]);
    setCanvasEdges([]);
    pushHistory([], []);
    setSelectedNodeId(null);
    setSelectedEdgeId(null);
    setIsClearConfirmOpen(false);
  };

  const handleAutoArrange = () => {
    if (canvasNodes.length === 0) return;

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

  // ── NODE DRAGGING EVENTS ──
  const handleMouseDownNode = (e: React.MouseEvent, node: CanvasNode) => {
    e.stopPropagation();

    if (isConnectMode) {
      if (!connectingSourceId) {
        setConnectingSourceId(node.id);
      } else if (connectingSourceId !== node.id) {
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

  // ── INTELLIGENT CHAOS SURGE ──
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

  const handleSendCandidateResponse = () => {
    if (!candidateResponse.trim()) return;
    const text = candidateResponse.trim();
    setCandidateResponse("");

    setInterviewerLog(prev => [
      ...prev,
      { sender: "candidate", text }
    ]);

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

  // ── FINAL SUBMISSION & EVALUATION ──
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
    <div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1", color: "#17191C", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
      {/* ── HEADER ── */}
      <header style={{ borderBottom: "1px solid #E4E1DA", backgroundColor: "#FFFFFF", padding: "12px 24px", position: "sticky", top: 0, zIndex: 50, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <div style={{ maxWidth: 1480, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <Link href="/student/skills" style={{ color: "#667085", textDecoration: "none", fontSize: 12, fontWeight: 600 }}>
                  ← Skill Practice Hub
                </Link>
                <span style={{ color: "#E4E1DA" }}>/</span>
                <span style={{ color: "#356AE6", fontSize: 12, fontWeight: 700 }}>Arena 2.0</span>
              </div>
              <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#162A43", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 8 }}>
                <span>🏛️</span>
                <span>System Design &amp; Architecture Studio</span>
              </h1>
            </div>

            {/* Mode Switcher */}
            <div style={{ display: "flex", background: "#F6F5F1", padding: 3, borderRadius: 8, border: "1px solid #E4E1DA", gap: 2 }}>
              <button
                onClick={() => handleSwitchMode("interview")}
                style={{
                  padding: "5px 12px",
                  borderRadius: 6,
                  border: "none",
                  background: mode === "interview" ? "#162A43" : "transparent",
                  color: mode === "interview" ? "#FFFFFF" : "#667085",
                  fontSize: 11,
                  fontWeight: 700,
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
                  borderRadius: 6,
                  border: "none",
                  background: mode === "learning" ? "#162A43" : "transparent",
                  color: mode === "learning" ? "#FFFFFF" : "#667085",
                  fontSize: 11,
                  fontWeight: 700,
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

            {/* Challenge Dropdown Selector */}
            <select
              value={selectedChallengeId}
              onChange={e => handleSelectChallenge(e.target.value)}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E4E1DA",
                color: "#17191C",
                padding: "6px 12px",
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                outline: "none"
              }}
            >
              {challenges.map(c => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>

            {/* Scale Target Badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#EFF4FE", border: "1px solid #D2E0FB", padding: "4px 10px", borderRadius: 6 }}>
              <span style={{ fontSize: 10, color: "#356AE6", fontWeight: 800 }}>⚡ SCALE</span>
              <span style={{ fontSize: 11, color: "#162A43", fontWeight: 600 }}>
                {activeChallenge.scale_metrics.split(".")[0]}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Technical Spec Drawer Button */}
            <button
              onClick={() => setIsSpecDrawerOpen(true)}
              style={{
                padding: "6px 12px",
                borderRadius: 7,
                border: "1px solid #E4E1DA",
                background: "#FFFFFF",
                color: "#475467",
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

            {/* Reference Blueprint Drawer Button */}
            <button
              onClick={() => setIsBlueprintDrawerOpen(true)}
              style={{
                padding: "6px 12px",
                borderRadius: 7,
                border: "1px solid #E4E1DA",
                background: "#FFFFFF",
                color: "#162A43",
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

      {/* ── INTERVIEW PROGRESSION INDICATOR ── */}
      <div style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #E4E1DA", padding: "8px 24px" }}>
        <div style={{ maxWidth: 1480, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
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
                  {idx > 0 && <span style={{ color: "#E4E1DA", fontSize: 11 }}>➔</span>}
                  <button
                    onClick={() => setPhase(p.id as InterviewPhase)}
                    style={{
                      background: isActive ? "#162A43" : isPast ? "#EAF4EE" : "transparent",
                      border: isActive ? "1px solid #162A43" : isPast ? "1px solid #C8E4D3" : "1px solid transparent",
                      color: isActive ? "#FFFFFF" : isPast ? "#2E7D5B" : "#667085",
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: 11,
                      fontWeight: isActive || isPast ? 700 : 600,
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
                  padding: "6px 14px",
                  borderRadius: 7,
                  border: "none",
                  background: "#356AE6",
                  color: "#FFFFFF",
                  fontSize: 11,
                  fontWeight: 700,
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
                  padding: "6px 14px",
                  borderRadius: 7,
                  border: "none",
                  background: "#356AE6",
                  color: "#FFFFFF",
                  fontSize: 11,
                  fontWeight: 700,
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
                  padding: "6px 14px",
                  borderRadius: 7,
                  border: "none",
                  background: "#B7791F",
                  color: "#FFFFFF",
                  fontSize: 11,
                  fontWeight: 700,
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
                  padding: "6px 14px",
                  borderRadius: 7,
                  border: "none",
                  background: "#2E7D5B",
                  color: "#FFFFFF",
                  fontSize: 11,
                  fontWeight: 700,
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
          <div style={{ background: "#EFF4FE", border: "1px solid #D2E0FB", borderRadius: 8, padding: "10px 16px", marginBottom: 14, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>💡</span>
              <div style={{ fontSize: 12, color: "#162A43" }}>
                <strong>Learning Mode:</strong> High-frequency rate-limiting directly querying PostgreSQL will cause connection exhaustion. Try adding a <strong>Redis Cluster</strong> from the component library.
              </div>
            </div>
            <span style={{ fontSize: 10, padding: "2px 8px", background: "#FFFFFF", color: "#356AE6", border: "1px solid #D2E0FB", borderRadius: 5, fontWeight: 700 }}>
              Guided Mode
            </span>
          </div>
        )}

        {/* ── CHAOS SURGE ALERT BANNER ── */}
        {chaosInjected && chaosScenario && (
          <div style={{ background: "#FEF7ED", border: "1px solid #F8D8A7", borderRadius: 10, padding: "14px 20px", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>🚨</span>
                <h3 style={{ fontSize: 13, fontWeight: 800, margin: 0, color: "#B7791F" }}>
                  {chaosScenario.title}
                </h3>
              </div>
              <span style={{ fontSize: 10, padding: "2px 8px", background: "#FFFFFF", color: "#B7791F", border: "1px solid #F8D8A7", borderRadius: 4, fontWeight: 800 }}>
                ACTIVE RESILIENCE DRILL
              </span>
            </div>
            
            <p style={{ margin: "0 0 10px", fontSize: 12, color: "#78350F", lineHeight: 1.4 }}>
              {chaosScenario.description}
            </p>

            <div style={{ padding: "10px 14px", background: "#FFFFFF", borderRadius: 7, border: "1px solid #F8D8A7", marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#B7791F", marginBottom: 2 }}>
                🎙️ Interviewer Challenge:
              </div>
              <div style={{ fontSize: 12, color: "#17191C", fontWeight: 700 }}>
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
                background: "#FFFFFF",
                border: "1px solid #E4E1DA",
                borderRadius: 7,
                padding: 10,
                color: "#17191C",
                fontSize: 12,
                outline: "none",
                boxSizing: "border-box"
              }}
            />
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            PHASE 1: REQUIREMENTS & CLARIFICATION
            ══════════════════════════════════════════════════════════════ */}
        {phase === "requirements" && (
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 18, marginBottom: 20 }}>
            
            {/* Left: Clarification Dialogue */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 18, boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>🎙️</span>
                  <h2 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: "#162A43" }}>
                    Phase 1: Clarify Problem Requirements
                  </h2>
                </div>
                <span style={{ fontSize: 11, padding: "2px 8px", background: "#EFF4FE", color: "#356AE6", border: "1px solid #D2E0FB", borderRadius: 5, fontWeight: 700 }}>
                  Interactive Brief
                </span>
              </div>

              {/* Initial Problem Prompt */}
              <div style={{ padding: "12px 16px", borderRadius: 8, background: "#F6F5F1", border: "1px solid #E4E1DA", marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#162A43", textTransform: "uppercase", marginBottom: 4 }}>
                  Problem Statement
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#17191C", marginBottom: 4 }}>
                  &ldquo;{activeChallenge.description}&rdquo;
                </div>
                <div style={{ fontSize: 11, color: "#667085" }}>
                  Before opening the whiteboard, clarify requirements regarding caller identity, SLA latency, accuracy tolerances, and outage policies.
                </div>
              </div>

              {/* Clarification Q&A History */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14, maxHeight: 280, overflowY: "auto", paddingRight: 4 }}>
                {clarificationsAsked.map(item => (
                  <div key={item.id} style={{ borderRadius: 7, background: "#F6F5F1", border: "1px solid #E4E1DA", padding: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                      <span style={{ fontSize: 11 }}>👤</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#356AE6" }}>
                        Candidate asked: {item.question}
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 6, paddingLeft: 16 }}>
                      <span style={{ fontSize: 11 }}>🏛️</span>
                      <span style={{ fontSize: 11, color: "#17191C", lineHeight: 1.4 }}>
                        {item.interviewerResponse}
                      </span>
                    </div>
                  </div>
                ))}

                {clarificationThinking && (
                  <div style={{ fontSize: 11, color: "#356AE6", fontStyle: "italic", padding: "6px 10px" }}>
                    Interviewer is evaluating requirement specification...
                  </div>
                )}
              </div>

              {/* Suggested Questions to Ask */}
              {availableClarifications.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#667085", textTransform: "uppercase", marginBottom: 6 }}>
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
                          border: "1px solid #E4E1DA",
                          background: "#FFFFFF",
                          color: "#17191C",
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
                    background: "#FFFFFF",
                    border: "1px solid #E4E1DA",
                    borderRadius: 7,
                    padding: "8px 12px",
                    color: "#17191C",
                    fontSize: 12,
                    outline: "none"
                  }}
                />
                <button
                  onClick={handleAskCustomQuestion}
                  disabled={clarificationThinking || !customQuestionInput.trim()}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 7,
                    border: "none",
                    background: "#356AE6",
                    color: "#FFFFFF",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: customQuestionInput.trim() ? "pointer" : "not-allowed"
                  }}
                >
                  Ask ➔
                </button>
              </div>

            </div>

            {/* Right: Discovered Requirements */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 16, boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#2E7D5B", textTransform: "uppercase" }}>
                    ✓ Discovered Requirements ({clarificationsAsked.length})
                  </div>
                </div>

                {clarificationsAsked.length === 0 ? (
                  <div style={{ fontSize: 12, color: "#667085", textAlign: "center", padding: "24px 10px", lineHeight: 1.5 }}>
                    No requirements uncovered yet. Ask the interviewer clarifying questions on the left.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {clarificationsAsked.map(c => (
                      <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "#EAF4EE", border: "1px solid #C8E4D3", borderRadius: 6 }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#14532D" }}>
                          {c.discoveredSpec.label}
                        </span>
                        <span style={{ fontSize: 11, color: "#166534", fontWeight: 600 }}>
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
                    borderRadius: 7,
                    border: "none",
                    background: "#356AE6",
                    color: "#FFFFFF",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Proceed to Architecture Canvas ➔
                </button>
              </div>

              {/* Bar-Raiser Principle Note */}
              <div style={{ background: "#EFF4FE", border: "1px solid #D2E0FB", borderRadius: 8, padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", marginBottom: 2 }}>
                  💡 Interview Assessment Standard
                </div>
                <div style={{ fontSize: 12, color: "#162A43", lineHeight: 1.4 }}>
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
              
              {/* Whiteboard Toolbar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FFFFFF", border: "1px solid #E4E1DA", padding: "7px 12px", borderRadius: 8, boxShadow: "0 1px 3px rgba(16,24,40,0.02)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  
                  {/* + Components Popover Button */}
                  <div style={{ position: "relative" }}>
                    <button
                      onClick={() => setIsPaletteOpen(!isPaletteOpen)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 6,
                        border: "none",
                        background: "#162A43",
                        color: "#FFFFFF",
                        fontSize: 11,
                        fontWeight: 700,
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
                        background: "#FFFFFF",
                        border: "1px solid #E4E1DA",
                        borderRadius: 8,
                        padding: 6,
                        boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
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
                              color: "#17191C",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                              textAlign: "left"
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = "#F6F5F1")}
                            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                          >
                            <span>{c.icon}</span>
                            <span>{c.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Connect Tool */}
                  <button
                    onClick={() => {
                      setIsConnectMode(!isConnectMode);
                      setConnectingSourceId(null);
                    }}
                    style={{
                      padding: "5px 10px",
                      borderRadius: 6,
                      border: isConnectMode ? "1px solid #356AE6" : "1px solid #E4E1DA",
                      background: isConnectMode ? "#356AE6" : "#F6F5F1",
                      color: isConnectMode ? "#FFFFFF" : "#475467",
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

                  {/* Undo & Redo */}
                  <button
                    onClick={handleUndo}
                    disabled={historyIndex <= 0}
                    style={{
                      padding: "5px 8px",
                      borderRadius: 6,
                      border: "1px solid #E4E1DA",
                      background: "#FFFFFF",
                      color: historyIndex <= 0 ? "#98A2B3" : "#475467",
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
                      border: "1px solid #E4E1DA",
                      background: "#FFFFFF",
                      color: historyIndex >= history.length - 1 ? "#98A2B3" : "#475467",
                      fontSize: 11,
                      cursor: historyIndex >= history.length - 1 ? "not-allowed" : "pointer"
                    }}
                    title="Redo (Ctrl+Y)"
                  >
                    ↪ Redo
                  </button>

                  {/* Auto-Arrange */}
                  <button
                    onClick={handleAutoArrange}
                    disabled={canvasNodes.length === 0}
                    style={{
                      padding: "5px 8px",
                      borderRadius: 6,
                      border: "1px solid #E4E1DA",
                      background: "#FFFFFF",
                      color: "#475467",
                      fontSize: 11,
                      cursor: canvasNodes.length === 0 ? "not-allowed" : "pointer"
                    }}
                    title="Clean tier-based layout"
                  >
                    🔀 Auto-Arrange
                  </button>

                  {/* Clear Canvas */}
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
                      border: "1px solid #F8C8C8",
                      background: "#FFFFFF",
                      color: canvasNodes.length === 0 ? "#98A2B3" : "#C24141",
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
                      style={{ padding: "3px 6px", borderRadius: 4, border: "1px solid #E4E1DA", background: "#FFFFFF", color: "#17191C", fontSize: 10, cursor: "pointer" }}
                    >
                      -
                    </button>
                    <span style={{ fontSize: 10, color: "#667085", minWidth: 32, textAlign: "center" }}>
                      {Math.round(zoomScale * 100)}%
                    </span>
                    <button
                      onClick={() => setZoomScale(prev => Math.min(1.3, prev + 0.1))}
                      style={{ padding: "3px 6px", borderRadius: 4, border: "1px solid #E4E1DA", background: "#FFFFFF", color: "#17191C", fontSize: 10, cursor: "pointer" }}
                    >
                      +
                    </button>
                  </div>

                  <span style={{ fontSize: 11, color: "#667085" }}>
                    {canvasNodes.length} Nodes • {canvasEdges.length} Connections
                  </span>
                </div>
              </div>

              {/* Whiteboard Canvas */}
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
                  background: "#0D1929",
                  border: "1px solid #233752",
                  borderRadius: 10,
                  position: "relative",
                  overflow: "hidden",
                  cursor: isConnectMode ? "crosshair" : "default"
                }}
              >
                {/* Canvas Grid Background */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px)",
                    backgroundSize: "22px 22px"
                  }}
                />

                {/* Empty State Prompt for Interview Mode */}
                {canvasNodes.length === 0 && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", pointerEvents: "none" }}>
                    <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.6 }}>🏗️</div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "rgba(255,255,255,0.85)" }}>
                      Interview Mode: Blank Architecture Canvas
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
                      Click <strong>[+ Components]</strong> in the top toolbar to begin placing system components.
                    </div>
                  </div>
                )}

                {/* SVG Connections Layer */}
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
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#356AE6" />
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
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="#2E7D5B" />
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
                          stroke={isEdgeSelected ? "#2E7D5B" : "#356AE6"}
                          strokeWidth={isEdgeSelected ? "3" : "2"}
                          strokeDasharray={edge.pattern === "async" ? "5 3" : undefined}
                          fill="none"
                          markerEnd={isEdgeSelected ? "url(#arrow-selected)" : "url(#arrow)"}
                          opacity="0.9"
                        />
                        {edge.protocol && (
                          <text
                            x={mx}
                            y={my - 6}
                            fill={isEdgeSelected ? "#2E7D5B" : "#356AE6"}
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
                          borderRadius: 8,
                          background: isSel
                            ? "#FFFFFF"
                            : isConnectingSrc
                            ? "#EFF4FE"
                            : "#FFFFFF",
                          border: isSel
                            ? "2px solid #356AE6"
                            : isConnectingSrc
                            ? "2px solid #2E7D5B"
                            : "1px solid #E4E1DA",
                          boxShadow: isSel ? "0 0 16px rgba(53,106,230,0.35)" : "0 2px 6px rgba(0,0,0,0.2)",
                          cursor: isConnectMode ? "crosshair" : "grab",
                          userSelect: "none",
                          minWidth: 130,
                          zIndex: isSel ? 20 : 10
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 2 }}>
                          <span style={{ fontSize: 16 }}>{node.icon}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: "#162A43" }}>{node.label}</span>
                        </div>
                        {node.role && (
                          <div style={{ fontSize: 10, color: "#667085", maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {node.role}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

              </div>

              {/* Dynamic Interviewer Dialogue Box */}
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "12px 16px", boxShadow: "0 1px 3px rgba(16,24,40,0.03)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 15 }}>🎙️</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#162A43", textTransform: "uppercase" }}>
                      Interviewer Live Probe
                    </span>
                  </div>
                  <span style={{ fontSize: 10, color: "#667085" }}>
                    Reasoning Engine Active
                  </span>
                </div>

                {/* Conversation Stream */}
                <div style={{ maxHeight: 110, overflowY: "auto", marginBottom: 8, display: "flex", flexDirection: "column", gap: 6 }}>
                  {interviewerLog.slice(-3).map((item, idx) => (
                    <div key={idx} style={{ fontSize: 12, color: item.sender === "interviewer" ? "#162A43" : "#356AE6", lineHeight: 1.4 }}>
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
                      background: "#FFFFFF",
                      border: "1px solid #E4E1DA",
                      borderRadius: 7,
                      padding: "8px 12px",
                      color: "#17191C",
                      fontSize: 12,
                      outline: "none"
                    }}
                  />
                  <button
                    onClick={handleToggleVoice}
                    style={{
                      padding: "8px 12px",
                      borderRadius: 7,
                      border: isVoiceRecording ? "1px solid #C24141" : "1px solid #E4E1DA",
                      background: isVoiceRecording ? "#FDF2F2" : "#F6F5F1",
                      color: isVoiceRecording ? "#C24141" : "#475467",
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
                      borderRadius: 7,
                      border: "none",
                      background: "#356AE6",
                      color: "#FFFFFF",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: candidateResponse.trim() ? "pointer" : "not-allowed"
                    }}
                  >
                    Send ➔
                  </button>
                </div>
              </div>

            </div>

            {/* Contextual Inspector: Component OR Connection */}
            {selectedNode && (
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ fontSize: 20 }}>{selectedNode.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 800, color: "#162A43" }}>{selectedNode.label}</div>
                        <div style={{ fontSize: 10, color: "#667085" }}>ID: {selectedNode.id}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedNodeId(null)}
                      style={{ background: "transparent", border: "none", color: "#667085", cursor: "pointer", fontSize: 14 }}
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ marginBottom: 12 }}>
                    <label style={{ fontSize: 11, color: "#475467", display: "block", marginBottom: 4, fontWeight: 700 }}>
                      Role &amp; Workload Rationale:
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
                        background: "#FFFFFF",
                        border: "1px solid #E4E1DA",
                        borderRadius: 6,
                        padding: 8,
                        color: "#17191C",
                        fontSize: 12,
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>

                  {/* Failure Modes */}
                  <div style={{ padding: "8px 10px", borderRadius: 7, background: "#F6F5F1", border: "1px solid #E4E1DA", marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#162A43", marginBottom: 2 }}>
                      ⚠️ Potential Failure Modes:
                    </div>
                    <div style={{ fontSize: 11, color: "#475467", lineHeight: 1.4 }}>
                      {selectedNode.type === "cache" && "• Memory fragmentation\n• Replication lag\n• Cache stampede"}
                      {selectedNode.type === "gateway" && "• CPU exhaustion under TLS\n• Bottleneck if not horizontally scaled"}
                      {selectedNode.type === "db" && "• Connection pool exhaustion\n• Disk I/O throttling"}
                      {selectedNode.type !== "cache" && selectedNode.type !== "gateway" && selectedNode.type !== "db" && "• Network partition latency\n• Failover timeout"}
                    </div>
                  </div>

                  {/* Duplicate Node */}
                  <button
                    onClick={handleDuplicateSelectedNode}
                    style={{
                      width: "100%",
                      padding: "7px",
                      borderRadius: 6,
                      border: "1px solid #D2E0FB",
                      background: "#EFF4FE",
                      color: "#356AE6",
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      marginBottom: 8
                    }}
                  >
                    📑 Duplicate (Horizontal Scale)
                  </button>
                </div>

                {/* Delete Node */}
                <button
                  onClick={handleDeleteSelectedNode}
                  style={{
                    width: "100%",
                    padding: "7px",
                    borderRadius: 6,
                    border: "none",
                    background: "#FDF2F2",
                    color: "#C24141",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  🗑️ Delete Component
                </button>
              </div>
            )}

            {/* Contextual Connection Inspector */}
            {selectedEdge && !selectedNode && (
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", justifyContent: "space-between", boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "#162A43" }}>Connection Inspector</div>
                      <div style={{ fontSize: 11, color: "#667085" }}>
                        {canvasNodes.find(n => n.id === selectedEdge.from)?.label} ➔ {canvasNodes.find(n => n.id === selectedEdge.to)?.label}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedEdgeId(null)}
                      style={{ background: "transparent", border: "none", color: "#667085", cursor: "pointer", fontSize: 14 }}
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ marginBottom: 10 }}>
                    <label style={{ fontSize: 11, color: "#475467", display: "block", marginBottom: 3, fontWeight: 700 }}>
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
                        background: "#FFFFFF",
                        border: "1px solid #E4E1DA",
                        borderRadius: 6,
                        padding: 6,
                        color: "#17191C",
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
                    <label style={{ fontSize: 11, color: "#475467", display: "block", marginBottom: 3, fontWeight: 700 }}>
                      Pattern:
                    </label>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => setCanvasEdges(prev => prev.map(ed => ed.id === selectedEdge.id ? { ...ed, pattern: "sync" } : ed))}
                        style={{
                          flex: 1,
                          padding: "6px",
                          borderRadius: 6,
                          border: selectedEdge.pattern === "sync" ? "1px solid #162A43" : "1px solid #E4E1DA",
                          background: selectedEdge.pattern === "sync" ? "#162A43" : "#F6F5F1",
                          color: selectedEdge.pattern === "sync" ? "#FFFFFF" : "#667085",
                          fontSize: 11,
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
                          padding: "6px",
                          borderRadius: 6,
                          border: selectedEdge.pattern === "async" ? "1px solid #162A43" : "1px solid #E4E1DA",
                          background: selectedEdge.pattern === "async" ? "#162A43" : "#F6F5F1",
                          color: selectedEdge.pattern === "async" ? "#FFFFFF" : "#667085",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        Asynchronous
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, color: "#475467", display: "block", marginBottom: 3, fontWeight: 700 }}>
                      Purpose &amp; Notes:
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
                        background: "#FFFFFF",
                        border: "1px solid #E4E1DA",
                        borderRadius: 6,
                        padding: 6,
                        color: "#17191C",
                        fontSize: 11,
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleDeleteSelectedEdge}
                  style={{
                    width: "100%",
                    padding: "7px",
                    borderRadius: 6,
                    border: "none",
                    background: "#FDF2F2",
                    color: "#C24141",
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
          <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 20, marginBottom: 20, boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 10, color: "#356AE6", fontWeight: 800, textTransform: "uppercase" }}>
                  Phase 3 of 5 • Contextual Architectural Checkpoints
                </div>
                <h2 style={{ fontSize: 16, fontWeight: 800, margin: "2px 0 0", color: "#162A43" }}>
                  Storage, Data Modeling &amp; Eviction Strategy
                </h2>
              </div>

              {/* Checkpoint Tabs */}
              <div style={{ display: "flex", background: "#F6F5F1", padding: 3, borderRadius: 7, border: "1px solid #E4E1DA", gap: 2 }}>
                {[
                  { id: "flow", label: "1. Request Flow" },
                  { id: "db", label: "2. Storage & Sharding" },
                  { id: "cache", label: "3. Caching & State" },
                  { id: "bottlenecks", label: "4. Failure Resilience" }
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setActiveDeepDiveTab(t.id as any)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 6,
                      border: "none",
                      background: activeDeepDiveTab === t.id ? "#162A43" : "transparent",
                      color: activeDeepDiveTab === t.id ? "#FFFFFF" : "#667085",
                      fontSize: 11,
                      fontWeight: 700,
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
                <div style={{ padding: "10px 14px", borderRadius: 7, background: "#EFF4FE", border: "1px solid #D2E0FB", marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", marginBottom: 2 }}>
                    🎙️ Interviewer Prompt:
                  </div>
                  <div style={{ fontSize: 12, color: "#162A43", fontWeight: 600 }}>
                    &ldquo;Walk me through the exact path an incoming request takes from DNS through CDN, Gateway, and downstream services. Where is rate-limit check evaluated?&rdquo;
                  </div>
                </div>
                <textarea
                  value={candidateArchitecture}
                  onChange={e => setCandidateArchitecture(e.target.value)}
                  placeholder="Clients -> Cloudflare CDN -> AWS ALB -> Node.js API Gateway -> Rate Limiter Middleware. The middleware queries an in-memory Redis cluster before proxying requests to internal backend microservices..."
                  rows={5}
                  style={{ width: "100%", background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 7, padding: 10, color: "#17191C", fontSize: 12, outline: "none", lineHeight: 1.5, boxSizing: "border-box" }}
                />
              </div>
            )}

            {/* Tab 2: Database & Sharding */}
            {activeDeepDiveTab === "db" && (
              <div>
                <div style={{ padding: "10px 14px", borderRadius: 7, background: "#EAF4EE", border: "1px solid #C8E4D3", marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#2E7D5B", marginBottom: 2 }}>
                    🎙️ Interviewer Prompt:
                  </div>
                  <div style={{ fontSize: 12, color: "#14532D", fontWeight: 600 }}>
                    &ldquo;Why did you choose this storage layer? How is your data partitioned across shards, and what consistency model (ACID vs Eventual) do you maintain?&rdquo;
                  </div>
                </div>
                <textarea
                  value={databaseChoice}
                  onChange={e => setDatabaseChoice(e.target.value)}
                  placeholder="Redis Cluster with Sentinel for automatic failover. For long-term audit logs and user plan quotas, PostgreSQL RDS with read replicas..."
                  rows={5}
                  style={{ width: "100%", background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 7, padding: 10, color: "#17191C", fontSize: 12, outline: "none", lineHeight: 1.5, boxSizing: "border-box" }}
                />
              </div>
            )}

            {/* Tab 3: Caching & Eviction */}
            {activeDeepDiveTab === "cache" && (
              <div>
                <div style={{ padding: "10px 14px", borderRadius: 7, background: "#FEF7ED", border: "1px solid #F8D8A7", marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#B7791F", marginBottom: 2 }}>
                    🎙️ Interviewer Prompt:
                  </div>
                  <div style={{ fontSize: 12, color: "#78350F", fontWeight: 600 }}>
                    &ldquo;How do you avoid race conditions on high-frequency counter updates? What is your eviction policy when memory approaches capacity?&rdquo;
                  </div>
                </div>
                <textarea
                  value={cachingStrategy}
                  onChange={e => setCachingStrategy(e.target.value)}
                  placeholder="Redis sliding window counter using Redis Hashes. Set TTL on keys equal to rate limit window (60s). Check-and-increment executes atomically inside Lua scripts..."
                  rows={5}
                  style={{ width: "100%", background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 7, padding: 10, color: "#17191C", fontSize: 12, outline: "none", lineHeight: 1.5, boxSizing: "border-box" }}
                />
              </div>
            )}

            {/* Tab 4: Bottlenecks & Resilience */}
            {activeDeepDiveTab === "bottlenecks" && (
              <div>
                <div style={{ padding: "10px 14px", borderRadius: 7, background: "#FDF2F2", border: "1px solid #F8C8C8", marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#C24141", marginBottom: 2 }}>
                    🎙️ Interviewer Prompt:
                  </div>
                  <div style={{ fontSize: 12, color: "#7F1D1D", fontWeight: 600 }}>
                    &ldquo;What is the biggest Single Point of Failure (SPOF) in this system? If that node dies, how does the system recover without taking down customer APIs?&rdquo;
                  </div>
                </div>
                <textarea
                  value={bottleneckStrategy}
                  onChange={e => setBottleneckStrategy(e.target.value)}
                  placeholder="If Redis becomes unreachable, fail-open for tier-1 users to prevent complete platform downtime. Fallback to local in-memory token bucket on API Gateway instances..."
                  rows={5}
                  style={{ width: "100%", background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 7, padding: 10, color: "#17191C", fontSize: 12, outline: "none", lineHeight: 1.5, boxSizing: "border-box" }}
                />
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
              <button
                onClick={() => setPhase("architecture")}
                style={{
                  padding: "7px 14px",
                  borderRadius: 7,
                  border: "1px solid #E4E1DA",
                  background: "#FFFFFF",
                  color: "#475467",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                ← Back to Canvas
              </button>

              <button
                onClick={handleTriggerIntelligentChaos}
                style={{
                  padding: "8px 20px",
                  borderRadius: 7,
                  border: "none",
                  background: "#B7791F",
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                💥 Trigger Chaos Drill ➔
              </button>
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            PHASE 4: CHAOS & DEFENSE
            ══════════════════════════════════════════════════════════════ */}
        {phase === "chaos" && (
          <div style={{ background: "#FFFFFF", border: "1px solid #F8D8A7", borderRadius: 10, padding: 20, marginBottom: 20, boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div>
                <span style={{ fontSize: 10, padding: "2px 8px", background: "#FEF7ED", color: "#B7791F", border: "1px solid #F8D8A7", borderRadius: 4, fontWeight: 800 }}>
                  PHASE 4: LIVE CHAOS DRILL
                </span>
                <h2 style={{ fontSize: 16, fontWeight: 800, margin: "4px 0 0", color: "#162A43" }}>
                  Defend Architecture Under Simulated Catastrophe
                </h2>
              </div>

              <button
                onClick={handleTriggerIntelligentChaos}
                style={{
                  padding: "5px 10px",
                  borderRadius: 6,
                  border: "1px solid #F8D8A7",
                  background: "#FEF7ED",
                  color: "#B7791F",
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer"
                }}
              >
                🔄 Re-roll Chaos Incident
              </button>
            </div>

            {/* Quick Defense Templates */}
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#667085", fontWeight: 700, marginBottom: 6 }}>
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
                      border: "1px solid #E4E1DA",
                      background: "#F6F5F1",
                      color: "#17191C",
                      fontSize: 11,
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
                  borderRadius: 7,
                  border: "1px solid #E4E1DA",
                  background: "#FFFFFF",
                  color: "#475467",
                  fontSize: 11,
                  fontWeight: 600,
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
                  borderRadius: 7,
                  border: "none",
                  background: "#2E7D5B",
                  color: "#FFFFFF",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: evaluating ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  boxShadow: "0 1px 2px rgba(16,24,40,0.05)"
                }}
              >
                <span>{evaluating ? "Evaluating System Design..." : "Finish Interview & Submit for Principal Review ➔"}</span>
              </button>
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            PHASE 5: EVIDENCE-BASED DIAGNOSTIC DOSSIER
            ══════════════════════════════════════════════════════════════ */}
        {(phase === "review" || evalResult) && evalResult && (
          <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 24, boxShadow: "0 1px 4px rgba(16,24,40,0.06)", marginBottom: 24 }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 10, padding: "2px 8px", background: "#EAF4EE", color: "#2E7D5B", border: "1px solid #C8E4D3", borderRadius: 5, fontWeight: 800, textTransform: "uppercase" }}>
                    🏛️ VERDICT: {evalResult.verdict}
                  </span>
                  <span style={{ fontSize: 10, padding: "2px 8px", background: "#EFF4FE", color: "#356AE6", border: "1px solid #D2E0FB", borderRadius: 5, fontWeight: 700 }}>
                    {mode === "learning" || hintUsed ? "Demonstrated with Guidance" : "Independently Demonstrated"}
                  </span>
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, margin: 0, color: "#162A43" }}>
                  Principal Architect Critique &amp; Evidence Dossier
                </h3>
              </div>

              {/* Secondary Score Display */}
              <div style={{ textAlign: "right", background: "#F6F5F1", padding: "6px 14px", borderRadius: 8, border: "1px solid #E4E1DA" }}>
                <div style={{ fontSize: 10, color: "#667085", textTransform: "uppercase", fontWeight: 700 }}>
                  Scalability Score
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#356AE6" }}>
                  {evalResult.scalabilityScore || 82}<span style={{ fontSize: 12, color: "#98A2B3" }}>/100</span>
                </div>
              </div>
            </div>

            {/* WHAT YOU DEMONSTRATED vs ARCHITECTURAL BOTTLENECK */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 14, marginBottom: 16 }}>
              
              <div style={{ padding: 14, borderRadius: 8, background: "#EAF4EE", border: "1px solid #C8E4D3" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#2E7D5B", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>✓</span>
                  <span>WHAT YOU DEMONSTRATED</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {(evalResult.demonstrated || evalResult.strengths || ["Requirement clarification established scope", "Separation of concerns across gateway & storage"]).map((item: string, idx: number) => (
                    <div key={idx} style={{ fontSize: 12, color: "#14532D", lineHeight: 1.4 }}>
                      • {item}
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ padding: 14, borderRadius: 8, background: "#FDF2F2", border: "1px solid #F8C8C8" }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#C24141", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>⚠️</span>
                  <span>ARCHITECTURAL BOTTLENECK / UNPROVEN CLAIM</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  {(evalResult.developing || evalResult.architecturalBottlenecks || ["Missing failover latency bounds on primary cache tier"]).map((item: string, idx: number) => (
                    <div key={idx} style={{ fontSize: 12, color: "#7F1D1D", lineHeight: 1.4 }}>
                      • {item}
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* WHY IT MATTERS */}
            <div style={{ padding: 14, borderRadius: 8, background: "#EFF4FE", border: "1px solid #D2E0FB", marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", textTransform: "uppercase", marginBottom: 3 }}>
                🔍 WHY IT MATTERS
              </div>
              <div style={{ fontSize: 12, color: "#162A43", lineHeight: 1.4 }}>
                {evalResult.whyItMatters || "Your target tier expects candidates to reason about resilience and partial failures, not only happy-path functional throughput."}
              </div>
            </div>

            {/* Principal Advice */}
            {evalResult.principalAdvice && (
              <div style={{ padding: 14, borderRadius: 8, background: "#F6F5F1", border: "1px solid #E4E1DA", marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: "#162A43", textTransform: "uppercase", marginBottom: 3 }}>
                  🎙️ Principal Architect Commentary
                </div>
                <div style={{ fontSize: 12, color: "#475467", lineHeight: 1.4 }}>
                  {evalResult.principalAdvice}
                </div>
              </div>
            )}

            {/* RECOMMENDED NEXT PRACTICE ACTION & ADAPTIVE RETRY */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: "1px solid #E4E1DA", flexWrap: "wrap", gap: 12 }}>
              <div>
                <div style={{ fontSize: 10, color: "#667085", textTransform: "uppercase", fontWeight: 700 }}>
                  RECOMMENDED NEXT PRACTICE ACTION
                </div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#162A43", marginTop: 2 }}>
                  {evalResult.nextBestAction?.title || "15-Minute Failure-Recovery Drill"}
                </div>
                <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>
                  {evalResult.nextBestAction?.description || "Simulate a complete Redis partition with 500k req/s and implement tiered fail-open policies."}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8 }}>
                {evalResult.transferTest && (
                  <button
                    onClick={() => handleSelectChallenge(evalResult.transferTest.challengeId)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 7,
                      border: "1px solid #D2E0FB",
                      background: "#EFF4FE",
                      color: "#356AE6",
                      fontSize: 11,
                      fontWeight: 700,
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
                    borderRadius: 7,
                    border: "none",
                    background: "#356AE6",
                    color: "#FFFFFF",
                    fontSize: 11,
                    fontWeight: 700,
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

      {/* ── TECHNICAL SPEC SLIDE-OVER DRAWER ── */}
      {isSpecDrawerOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(16,24,40,0.5)", zIndex: 100, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: 440, background: "#FFFFFF", borderLeft: "1px solid #E4E1DA", height: "100%", overflowY: "auto", padding: 22, boxShadow: "-4px 0 24px rgba(16,24,40,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>📄</span>
                <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: "#162A43" }}>
                  Technical Spec Sheet
                </h3>
              </div>
              <button
                onClick={() => setIsSpecDrawerOpen(false)}
                style={{ background: "transparent", border: "none", color: "#667085", cursor: "pointer", fontSize: 16 }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#356AE6", textTransform: "uppercase" }}>Problem</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#162A43", marginTop: 2 }}>{activeChallenge.title}</div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#B7791F", textTransform: "uppercase" }}>Scale Target</div>
              <div style={{ fontSize: 12, color: "#475467", marginTop: 2 }}>{activeChallenge.scale_metrics}</div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#2E7D5B", textTransform: "uppercase", marginBottom: 4 }}>
                Functional Requirements
              </div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#475467", lineHeight: 1.5 }}>
                {activeChallenge.functional_requirements.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#C24141", textTransform: "uppercase", marginBottom: 4 }}>
                Non-Functional Requirements
              </div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#475467", lineHeight: 1.5 }}>
                {activeChallenge.non_functional_requirements.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: "#162A43", textTransform: "uppercase", marginBottom: 4 }}>
                Architectural Hints
              </div>
              <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#475467", lineHeight: 1.5 }}>
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
                borderRadius: 7,
                border: "none",
                background: "#356AE6",
                color: "#FFFFFF",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              Close Spec Sheet
            </button>
          </div>
        </div>
      )}

      {/* ── REFERENCE BLUEPRINT STUDY DRAWER ── */}
      {isBlueprintDrawerOpen && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(16,24,40,0.5)", zIndex: 110, display: "flex", justifyContent: "flex-end" }}>
          <div style={{ width: 480, background: "#FFFFFF", borderLeft: "1px solid #E4E1DA", height: "100%", overflowY: "auto", padding: 22, boxShadow: "-4px 0 24px rgba(16,24,40,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>💡</span>
                <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: "#162A43" }}>
                  Reference Architecture Blueprint
                </h3>
              </div>
              <button
                onClick={() => setIsBlueprintDrawerOpen(false)}
                style={{ background: "transparent", border: "none", color: "#667085", cursor: "pointer", fontSize: 16 }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "8px 12px", borderRadius: 7, background: "#FEF7ED", border: "1px solid #F8D8A7", marginBottom: 14 }}>
              <div style={{ fontSize: 12, color: "#78350F", lineHeight: 1.4 }}>
                This is a <strong>study reference</strong> for learning. It does NOT overwrite your active whiteboard canvas in Interview Mode.
              </div>
            </div>

            {/* Blueprint Overview */}
            {(() => {
              const bp = REFERENCE_BLUEPRINTS[selectedChallengeId] || REFERENCE_BLUEPRINTS["sd-1"];
              return (
                <div>
                  <div style={{ fontSize: 12, color: "#17191C", lineHeight: 1.5, marginBottom: 14 }}>
                    {bp.overview}
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#356AE6", textTransform: "uppercase", marginBottom: 6 }}>
                      Components &amp; Data Flow:
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                      {bp.nodes.map((n, i) => (
                        <div key={n.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 8px", background: "#F6F5F1", borderRadius: 6, border: "1px solid #E4E1DA", fontSize: 11 }}>
                          <span>{n.icon}</span>
                          <span style={{ fontWeight: 700, color: "#162A43" }}>{n.label}</span>
                          <span style={{ color: "#667085" }}>— {n.role}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#B7791F", textTransform: "uppercase", marginBottom: 6 }}>
                      Key Architectural Trade-offs:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#475467", lineHeight: 1.5 }}>
                      {bp.keyTradeoffs.map((t, idx) => (
                        <li key={idx} style={{ marginBottom: 4 }}>{t}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ marginBottom: 18 }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#2E7D5B", textTransform: "uppercase", marginBottom: 6 }}>
                      Failure Mitigations:
                    </div>
                    <ul style={{ margin: 0, paddingLeft: 16, fontSize: 12, color: "#475467", lineHeight: 1.5 }}>
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
                        borderRadius: 7,
                        border: "1px solid #D2E0FB",
                        background: "#EFF4FE",
                        color: "#356AE6",
                        fontSize: 11,
                        fontWeight: 700,
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
                      borderRadius: 7,
                      border: "1px solid #E4E1DA",
                      background: "#FFFFFF",
                      color: "#667085",
                      fontSize: 11,
                      fontWeight: 600,
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
        <div style={{ position: "fixed", inset: 0, background: "rgba(16,24,40,0.5)", zIndex: 120, display: "flex", justifyContent: "center", alignItems: "center", padding: 20 }}>
          <div style={{ width: "100%", maxWidth: 400, background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 20, boxShadow: "0 10px 25px rgba(16,24,40,0.15)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: "#C24141" }}>
                Clear Whiteboard Canvas?
              </h3>
            </div>
            <p style={{ fontSize: 12, color: "#475467", margin: "0 0 14px", lineHeight: 1.4 }}>
              This will remove all {canvasNodes.length} nodes and {canvasEdges.length} connections from your canvas. You can undo this action.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                onClick={() => setIsClearConfirmOpen(false)}
                style={{ padding: "6px 12px", borderRadius: 6, border: "1px solid #E4E1DA", background: "#FFFFFF", color: "#667085", fontSize: 11, cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmClearCanvas}
                style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: "#C24141", color: "#FFFFFF", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
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
    <React.Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1" }} />}>
      <SystemDesignContent />
    </React.Suspense>
  );
}
