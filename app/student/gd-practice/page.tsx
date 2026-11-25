"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import { useTheme } from "@/components/ThemeProvider";
import {
  GDSimulationFormat,
  GDDifficultyLevel,
  GDExperienceMode,
  GDDiscussionStage,
  GDComprehensiveReport,
  GDFriendsRoom
} from "@/lib/gd/types";
import { getGroupedTopicsForPracticeRoom } from "@/lib/group-discussion-data";
import { useFriendsRealtimeRoom } from "@/components/gd/useFriendsRealtimeRoom";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Hand,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Send,
  Sparkles,
  Clock,
  Users,
  Award,
  ShieldAlert,
  CheckCircle2,
  BarChart3,
  MessageSquare,
  RotateCcw,
  LogOut,
  X,
  ChevronRight,
  TrendingUp,
  Brain,
  Quote
} from "lucide-react";

interface GDMessage {
  speaker: string;
  avatar: string;
  role: string;
  content: string;
  time: string;
  stage?: GDDiscussionStage;
  isCoach?: boolean;
}

interface GDTopic {
  title: string;
  context?: string;
  category?: string;
  key_perspectives?: string[];
}

const GD_CATEGORIES = [
  { id: "ai", label: "🤖 AI & Autonomous Agents", name: "AI & Autonomous Agents" },
  { id: "arch", label: "⚡ System Architecture & Cloud", name: "System Architecture & Scalability" },
  { id: "fintech", label: "💳 FinTech, UPI & Security", name: "FinTech, UPI & Security" },
  { id: "hiring", label: "💼 Campus Hiring & Tech Careers", name: "Campus Placement & Career Trends" },
  { id: "web3", label: "🌐 Web3 & Open Source", name: "Web3 & Open Source Ecosystem" },
  { id: "ethics", label: "🏛️ Tech Ethics & Governance", name: "Corporate Tech Ethics & Privacy" }
];

const TOPICS_BY_CATEGORY: Record<string, GDTopic[]> = getGroupedTopicsForPracticeRoom();

interface PanelParticipantConfig {
  id: string;
  name: string;
  initials: string;
  role: string;
  archetype: string;
  tagline: string;
  gradient: string;
  badgeBg: string;
  badgeColor: string;
  pitch?: number;
  rate?: number;
  isCandidate?: boolean;
  isModerator?: boolean;
}

const PANEL_PARTICIPANTS: PanelParticipantConfig[] = [
  {
    id: "candidate-you",
    name: "You (Candidate)",
    initials: "YOU",
    role: "Candidate",
    archetype: "active_contender",
    tagline: "Active Floor Contender",
    gradient: "linear-gradient(135deg, #4f46e5, #7c3aed)",
    badgeBg: "rgba(99, 102, 241, 0.16)",
    badgeColor: "#818cf8",
    isCandidate: true
  },
  {
    id: "peer-rohan",
    name: "Rohan V.",
    initials: "RV",
    role: "Velocity Architect",
    archetype: "dominant_speaker",
    tagline: "Pacing, Latency & Sharding",
    gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
    badgeBg: "rgba(245, 158, 11, 0.16)",
    badgeColor: "#fbbf24"
  },
  {
    id: "peer-ananya",
    name: "Ananya S.",
    initials: "AS",
    role: "Data Systems Modeler",
    archetype: "analytical_thinker",
    tagline: "SLAs, Telemetry & Throughput",
    gradient: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
    badgeBg: "rgba(139, 92, 246, 0.16)",
    badgeColor: "#c084fc"
  },
  {
    id: "peer-karan",
    name: "Karan T.",
    initials: "KT",
    role: "Security & Threat Analyst",
    archetype: "critical_challenger",
    tagline: "Zero-Day Attack Surface & Risks",
    gradient: "linear-gradient(135deg, #ef4444, #b91c1c)",
    badgeBg: "rgba(239, 68, 68, 0.16)",
    badgeColor: "#f87171"
  },
  {
    id: "peer-priya",
    name: "Priya K.",
    initials: "PK",
    role: "Product & Strategy Lead",
    archetype: "diplomatic_contributor",
    tagline: "TAM, Business Synergy & Delivery",
    gradient: "linear-gradient(135deg, #10b981, #047857)",
    badgeBg: "rgba(16, 185, 129, 0.16)",
    badgeColor: "#34d399"
  },
  {
    id: "moderator-alex",
    name: "Alex (Discussion Director)",
    initials: "AD",
    role: "Lead FAANG Bar-Raiser",
    archetype: "coach_moderator",
    tagline: "Floor Etiquette, Synthesis & Time",
    gradient: "linear-gradient(135deg, #0ea5e9, #2563eb)",
    badgeBg: "rgba(14, 165, 233, 0.16)",
    badgeColor: "#38bdf8",
    isModerator: true
  }
];

function GDPracticeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isDark } = useTheme();

  const initialFormat = (searchParams.get("format") as GDSimulationFormat) || "competitive";
  const initialExperienceMode = (searchParams.get("experienceMode") as GDExperienceMode) || "standard_round";
  const initialDifficulty = (searchParams.get("difficulty") as GDDifficultyLevel) || "intermediate";
  const initialTopicParam = searchParams.get("topic") || "";
  const friendsRoomCodeParam = searchParams.get("room") || null;

  // Configuration States
  const [format, setFormat] = useState<GDSimulationFormat>(initialFormat);
  const [experienceMode, setExperienceMode] = useState<GDExperienceMode>(initialExperienceMode);
  const [difficulty, setDifficulty] = useState<GDDifficultyLevel>(initialDifficulty);
  const [selectedCategory, setSelectedCategory] = useState<string>("ai");
  const [topicsByCategory, setTopicsByCategory] = useState<Record<string, GDTopic[]>>(TOPICS_BY_CATEGORY);
  const [selectedTopic, setSelectedTopic] = useState<string>(
    initialTopicParam || TOPICS_BY_CATEGORY["ai"][0].title
  );
  const [customTopicInput, setCustomTopicInput] = useState<string>(initialTopicParam);
  const [generatingTopics, setGeneratingTopics] = useState(false);
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);

  // Active Session & Multiplayer States
  const [panelParticipants, setPanelParticipants] = useState<PanelParticipantConfig[]>(PANEL_PARTICIPANTS);
  const panelParticipantsRef = useRef<PanelParticipantConfig[]>(PANEL_PARTICIPANTS);
  panelParticipantsRef.current = panelParticipants;
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [friendsRoom, setFriendsRoom] = useState<GDFriendsRoom | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [friendsCopyFeedback, setFriendsCopyFeedback] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const [currentStage, setCurrentStage] = useState<GDDiscussionStage>("briefing");
  const [messages, setMessages] = useState<GDMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoFlow, setAutoFlow] = useState(true);

  // Audio, Video & Controls
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarTab, setSidebarTab] = useState<"coach" | "transcript">("coach");
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [coaching, setCoaching] = useState<any>(null);
  const [studentWarnings, setStudentWarnings] = useState<number>(0);
  const [moderatorAlert, setModeratorAlert] = useState<string | null>(null);

  // Comprehensive Report Modal
  const [showReportModal, setShowReportModal] = useState(false);
  const [evaluationReport, setEvaluationReport] = useState<GDComprehensiveReport | null>(null);
  const [reportDnaSynced, setReportDnaSynced] = useState<boolean | null>(null);
  const [evaluatingReport, setEvaluatingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);

  // Student Auth Verification for Live Simulation
  const [authStatus, setAuthStatus] = useState<"checking" | "authenticated" | "unauthenticated">("checking");
  const [launchError, setLaunchError] = useState<string | null>(null);

  // Mobile layout
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState<"stage" | "sidebar">("stage");

  // Speech Recognition & Timers
  const recognitionRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const autoTurnTimeoutRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<any>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const heartbeatIntervalRef = useRef<any>(null);
  const lastSpeechEndTimeRef = useRef<number>(Date.now());
  const activeSpeakerRef = useRef<string | null>(null);
  const lastSubmittedSpeechRef = useRef<string>("");

  const messagesRef = useRef<GDMessage[]>(messages);
  messagesRef.current = messages;
  const startedRef = useRef(started);
  startedRef.current = started;
  const autoFlowRef = useRef(autoFlow);
  autoFlowRef.current = autoFlow;
  const loadingRef = useRef(loading);
  loadingRef.current = loading;
  const micActiveRef = useRef(micActive);
  micActiveRef.current = micActive;
  const sessionIdRef = useRef<string | null>(sessionId);
  sessionIdRef.current = sessionId;
  const friendsRoomRef = useRef<GDFriendsRoom | null>(friendsRoom);
  friendsRoomRef.current = friendsRoom;
  const formatRef = useRef<GDSimulationFormat>(format);
  formatRef.current = format;
  const experienceModeRef = useRef<GDExperienceMode>(experienceMode);
  experienceModeRef.current = experienceMode;
  const difficultyRef = useRef<GDDifficultyLevel>(difficulty);
  difficultyRef.current = difficulty;
  const currentStageRef = useRef<GDDiscussionStage>(currentStage);
  currentStageRef.current = currentStage;

  const activeTopic = customTopicInput.trim() || selectedTopic;
  const activeTopicRef = useRef<string>(activeTopic);
  activeTopicRef.current = activeTopic;

  const triggerPeerTurnRef = useRef<() => Promise<void>>(async () => {});
  const handleStudentInterventionRef = useRef<(spokenText?: string) => Promise<void>>(async () => {});

  // Check student authentication cleanly before launching verified GD sessions
  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.authenticated && data?.user?.accountType !== "recruiter") {
          setAuthStatus("authenticated");
        } else {
          setAuthStatus("unauthenticated");
        }
      })
      .catch(() => setAuthStatus("unauthenticated"));
  }, []);

  // Responsive layout listener
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 960);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const mapTranscriptsToMessages = useCallback(
    (items: any[]): GDMessage[] =>
      items.map((t: any) => ({
        speaker:
          currentUserId && t.speakerId === `candidate-${currentUserId}`
            ? "You"
            : t.speakerName || "Participant",
        avatar: t.speakerAvatar || (t.isHuman ? "🎓" : "🎙️"),
        role: t.speakerRole || "Participant",
        content: t.content,
        time: t.formattedTime || "",
        stage: t.stage || "active_discussion",
        isCoach: Boolean(t.speakerId && String(t.speakerId).includes("moderator"))
      })),
    [currentUserId]
  );

  const syncFriendsRoomState = useCallback(async () => {
    if (!friendsRoomCodeParam) return;
    try {
      const res = await fetch("/api/gd/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "poll_room",
          roomCodeOrId: friendsRoom?.roomId || friendsRoomCodeParam
        })
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success || !data.room) return;

      if (data.currentUserId) setCurrentUserId(data.currentUserId);
      setFriendsRoom(data.room);
      if (data.sessionId) setSessionId(data.sessionId);
      if (data.currentStage) setCurrentStage(data.currentStage);

      if (data.room.status === "IN_PROGRESS") {
        setStarted(true);
        setAutoFlow(false);
        autoFlowRef.current = false;
      }

      if (Array.isArray(data.transcripts) && data.transcripts.length > 0) {
        const mapped = mapTranscriptsToMessages(data.transcripts);
        setMessages(mapped);
        messagesRef.current = mapped;
      }

      if (Array.isArray(data.room.participants)) {
        const palette = [
          { gradient: "linear-gradient(135deg, #f59e0b, #d97706)", badgeBg: "rgba(245, 158, 11, 0.16)", badgeColor: "#fbbf24" },
          { gradient: "linear-gradient(135deg, #10b981, #059669)", badgeBg: "rgba(16, 185, 129, 0.16)", badgeColor: "#34d399" },
          { gradient: "linear-gradient(135deg, #ef4444, #dc2626)", badgeBg: "rgba(239, 68, 68, 0.16)", badgeColor: "#f87171" },
          { gradient: "linear-gradient(135deg, #ec4899, #db2777)", badgeBg: "rgba(236, 72, 153, 0.16)", badgeColor: "#f472b6" }
        ];
        const friendCards: PanelParticipantConfig[] = data.room.participants.map((fp: any, idx: number) => {
          const isMe = data.currentUserId && fp.userId === data.currentUserId;
          const styleSlot = palette[idx % palette.length];
          const initials = String(fp.fullName || "FR")
            .split(/\s+/)
            .map((w: string) => w[0]?.toUpperCase() || "")
            .join("")
            .slice(0, 2);
          return {
            id: `candidate-${fp.userId}`,
            name: isMe ? "You (Candidate)" : fp.fullName,
            initials: isMe ? "YOU" : initials,
            role: fp.isHost ? "Host • Student" : "Peer Student",
            archetype: "human_peer",
            tagline: fp.micActive ? "Mic Active" : fp.handRaised ? "Hand Raised" : "Connected",
            gradient: isMe ? "linear-gradient(135deg, #4f46e5, #7c3aed)" : styleSlot.gradient,
            badgeBg: isMe ? "rgba(99, 102, 241, 0.16)" : styleSlot.badgeBg,
            badgeColor: isMe ? "#818cf8" : styleSlot.badgeColor,
            isCandidate: Boolean(isMe)
          };
        });
        const modCard = PANEL_PARTICIPANTS.find((p) => p.isModerator)!;
        setPanelParticipants([...friendCards, modCard]);
      }
    } catch {}
  }, [friendsRoom?.roomId, friendsRoomCodeParam, mapTranscriptsToMessages]);

  const realtimeRoom = useFriendsRealtimeRoom({
    room: friendsRoom,
    selfUserId: currentUserId,
    micActive,
    onRemoteRoomSync: (payload) => {
      setFriendsRoom(payload.room);
      if (payload.sessionId) setSessionId(payload.sessionId);
      if (payload.currentStage) setCurrentStage(payload.currentStage as GDDiscussionStage);
      if (payload.room.status === "IN_PROGRESS") {
        setStarted(true);
        setAutoFlow(false);
        autoFlowRef.current = false;
      }
      if (Array.isArray(payload.transcripts) && payload.transcripts.length > 0) {
        const mapped = mapTranscriptsToMessages(payload.transcripts);
        setMessages(mapped);
        messagesRef.current = mapped;
      }
    }
  });

  // Check and join Friends Room if query param is set + periodic fallback poll
  useEffect(() => {
    if (!friendsRoomCodeParam) return;
    fetch("/api/gd/friends", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "join_room", roomCodeOrId: friendsRoomCodeParam })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.room) {
          if (data.currentUserId) setCurrentUserId(data.currentUserId);
          setFriendsRoom(data.room);
          setSelectedTopic(data.room.topicTitle);
          setFormat(data.room.format);
          setDifficulty(data.room.difficulty);
          if (data.room.status === "IN_PROGRESS") {
            setStarted(true);
            setAutoFlow(false);
            autoFlowRef.current = false;
            if (Array.isArray(data.transcripts)) {
              const mapped = mapTranscriptsToMessages(data.transcripts);
              setMessages(mapped);
              messagesRef.current = mapped;
            }
          }
        } else if (data.message) {
          setModeratorAlert(data.message);
        }
      })
      .catch(err => console.warn("Failed to join friends room:", err));

    const pollInterval = setInterval(() => {
      syncFriendsRoomState();
    }, 2500);
    return () => clearInterval(pollInterval);
  }, [friendsRoomCodeParam]);

  // Cleanup session on unmount or navigation
  const cleanupSession = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    if (autoTurnTimeoutRef.current) clearTimeout(autoTurnTimeoutRef.current);
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (heartbeatIntervalRef.current) clearInterval(heartbeatIntervalRef.current);

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const s = videoRef.current.srcObject as MediaStream;
      s.getTracks().forEach(t => t.stop());
      videoRef.current.srcObject = null;
    }
    setActiveSpeaker(null);
    activeSpeakerRef.current = null;
  }, []);

  useEffect(() => {
    return () => cleanupSession();
  }, [cleanupSession]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          let current = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            current += event.results[i][0].transcript;
          }
          setInput(current);

          // Barge-in: User is actively speaking -> Immediately cancel peer speech!
          if (autoTurnTimeoutRef.current) clearTimeout(autoTurnTimeoutRef.current);
          if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
          }

          if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = setTimeout(() => {
            const cleanText = current.trim();
            if (cleanText.length > 3 && cleanText !== lastSubmittedSpeechRef.current) {
              lastSubmittedSpeechRef.current = cleanText;
              handleStudentInterventionRef.current(cleanText);
            }
          }, 1600);
        };

        recognition.onerror = () => setMicActive(false);
        recognition.onend = () => setMicActive(false);
        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Timer counter
  useEffect(() => {
    let interval: any = null;
    if (started) {
      interval = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [started]);

  // Auto-scroll transcript
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, currentSubtitle]);

  // Webcam handler
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (cameraActive && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(s => {
          stream = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(err => {
          console.warn("Camera access denied or unavailable:", err);
          setCameraActive(false);
        });
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const s = videoRef.current.srcObject as MediaStream;
        s.getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
    }
    return () => {
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [cameraActive]);

  // Calibrated Voice Synthesis (TTS)
  const speakVoice = useCallback((text: string, speaker: string, onDone?: () => void) => {
    let finished = false;
    let watchdogTimer: any = null;

    const markDone = () => {
      if (finished) return;
      finished = true;
      if (watchdogTimer) clearTimeout(watchdogTimer);
      activeUtteranceRef.current = null;
      setActiveSpeaker(null);
      activeSpeakerRef.current = null;
      lastSpeechEndTimeRef.current = Date.now();
      if (onDone) onDone();
    };

    setActiveSpeaker(speaker);
    activeSpeakerRef.current = speaker;
    setCurrentSubtitle(`${speaker}: "${text}"`);

    if (!soundEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
      const estimatedMs = Math.min(8000, Math.max(2200, text.split(" ").length * 260));
      setTimeout(markDone, estimatedMs);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.04;

      const matchedPanelMember = panelParticipantsRef.current.find(
        (p) =>
          p.name === speaker ||
          speaker.toLowerCase().includes(p.name.toLowerCase().split(" ")[0])
      );

      if (matchedPanelMember?.pitch && matchedPanelMember?.rate) {
        utterance.pitch = matchedPanelMember.pitch;
        utterance.rate = matchedPanelMember.rate;
      } else if (speaker.includes("Rohan")) {
        utterance.pitch = 0.88;
        utterance.rate = 1.08;
      } else if (speaker.includes("Ananya")) {
        utterance.pitch = 1.15;
        utterance.rate = 1.0;
      } else if (speaker.includes("Priya")) {
        utterance.pitch = 1.22;
        utterance.rate = 1.04;
      } else if (speaker.includes("Karan")) {
        utterance.pitch = 0.94;
        utterance.rate = 1.02;
      } else if (speaker.includes("Alex")) {
        utterance.pitch = 1.0;
        utterance.rate = 0.98;
      }

      utterance.onend = () => markDone();
      utterance.onerror = () => markDone();

      const wordCount = text.split(" ").length;
      const maxSpeechDurationMs = Math.max(2800, Math.min(16000, (wordCount / 2.4) * 1000 + 1200));
      watchdogTimer = setTimeout(markDone, maxSpeechDurationMs);

      activeUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      markDone();
    }
  }, [soundEnabled]);

  // Schedule Next Turn in Autonomous Debate (uses live ref to avoid stale mount closures)
  const scheduleNextTurn = useCallback(() => {
    if (autoTurnTimeoutRef.current) clearTimeout(autoTurnTimeoutRef.current);
    if (!autoFlowRef.current || !startedRef.current) return;

    // Realistic human GD turn-taking pause (1.4s)
    autoTurnTimeoutRef.current = setTimeout(() => {
      triggerPeerTurnRef.current();
    }, 1400);
  }, []);

  // Liveness Heartbeat: Prevents dead air
  useEffect(() => {
    if (!started || !autoFlow) return;

    const interval = setInterval(() => {
      const now = Date.now();
      if (
        !loadingRef.current &&
        !micActiveRef.current &&
        !activeSpeakerRef.current &&
        now - lastSpeechEndTimeRef.current > 2200
      ) {
        triggerPeerTurnRef.current();
      }
    }, 1600);

    heartbeatIntervalRef.current = interval;
    return () => clearInterval(interval);
  }, [started, autoFlow]);

  // Dynamic Topic Generator via Groq
  const handleGenerateAITopics = async () => {
    setGeneratingTopics(true);
    setGenerationNotice(null);
    try {
      const activeCatObj = GD_CATEGORIES.find(c => c.id === selectedCategory);
      const res = await fetch("/api/student/gd-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate_topics",
          category: activeCatObj?.name || "AI & Autonomous Agents"
        })
      });
      const data = await res.json();
      if (data.topics && Array.isArray(data.topics) && data.topics.length > 0) {
        setTopicsByCategory(prev => ({
          ...prev,
          [selectedCategory]: data.topics
        }));
        setSelectedTopic(data.topics[0].title);
        setCustomTopicInput("");
        setGenerationNotice(`Synthesized 4 fresh topics for "${activeCatObj?.name}" using Groq AI!`);
        setTimeout(() => setGenerationNotice(null), 4500);
      }
    } catch (err) {
      console.error("Failed to generate topics:", err);
    } finally {
      setGeneratingTopics(false);
    }
  };

  // Trigger Next Peer Turn
  const triggerPeerTurn = async () => {
    if (loadingRef.current || !startedRef.current) return;
    setLoading(true);
    loadingRef.current = true;

    try {
      // Multi-student Friends Room mode: sync live peer state instead of generating bot turns
      if (friendsRoomRef.current) {
        await syncFriendsRoomState();
        return;
      }

      const res = await fetch("/api/student/gd-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          topic: activeTopicRef.current,
          format: formatRef.current,
          difficulty: difficultyRef.current,
          messages: messagesRef.current.slice(-8)
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setModeratorAlert(data?.message || data?.error || "Unable to advance GD turn.");
        if (res.status === 401 || res.status === 403) {
          setAutoFlow(false);
          autoFlowRef.current = false;
        }
        return;
      }

      if (data.sessionId && !sessionIdRef.current) {
        setSessionId(data.sessionId);
        sessionIdRef.current = data.sessionId;
      }

      if (data.next_speaker) {
        const isCoach = Boolean(data.next_speaker.isCoachIntervention);
        const peerMsg: GDMessage = {
          speaker: data.next_speaker.name,
          avatar: data.next_speaker.avatar || (isCoach ? "🎙️" : "💬"),
          role: data.next_speaker.role || (isCoach ? "Discussion Director" : "Peer"),
          content: data.next_speaker.spoken_text,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          stage: data.currentStage || currentStageRef.current,
          isCoach
        };

        if (data.currentStage) setCurrentStage(data.currentStage);

        if (isCoach) {
          setModeratorAlert(data.next_speaker.spoken_text);
          setTimeout(() => setModeratorAlert(null), 8000);
        }

        setMessages(prev => {
          const updated = [...prev, peerMsg];
          messagesRef.current = updated;
          return updated;
        });

        speakVoice(peerMsg.content, peerMsg.speaker, () => {
          scheduleNextTurn();
        });
      }
    } catch (err) {
      console.error("GD turn error:", err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
      lastSpeechEndTimeRef.current = Date.now();
    }
  };
  triggerPeerTurnRef.current = triggerPeerTurn;

  // Launch GD Session
  const startGD = async () => {
    setLaunchError(null);
    setModeratorAlert(null);
    setStarted(true);
    startedRef.current = true;
    setAutoFlow(true);
    autoFlowRef.current = true;
    setLoading(true);
    loadingRef.current = true;
    setSecondsElapsed(0);
    lastSpeechEndTimeRef.current = Date.now();

    const initialPlaceholder: GDMessage = {
      speaker: "Moderator Alex",
      avatar: "🎙️",
      role: "Discussion Director",
      content: `Connecting you to the panel for: "${activeTopicRef.current}" (${formatRef.current.toUpperCase()} format)...`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      stage: "briefing",
      isCoach: true
    };
    setMessages([initialPlaceholder]);
    messagesRef.current = [initialPlaceholder];

    try {
      // Multi-student Friends Room mode: host launches shared room
      if (friendsRoomRef.current) {
        const res = await fetch("/api/gd/friends", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "start_room",
            roomId: friendsRoomRef.current.roomId
          })
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          setStarted(false);
          startedRef.current = false;
          const msg = data.message || "Only the room host can start the discussion.";
          setLaunchError(msg);
          setModeratorAlert(msg);
          return;
        }
        setAutoFlow(false);
        autoFlowRef.current = false;
        setFriendsRoom(data.room);
        if (data.sessionId) {
          setSessionId(data.sessionId);
          sessionIdRef.current = data.sessionId;
        }
        if (Array.isArray(data.transcripts)) {
          const mapped = mapTranscriptsToMessages(data.transcripts);
          setMessages(mapped);
          messagesRef.current = mapped;
        }
        realtimeRoom.broadcastRoomNudge();
        return;
      }

      const res = await fetch("/api/student/gd-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start_discussion",
          topic: activeTopicRef.current,
          format: formatRef.current,
          experienceMode: experienceModeRef.current,
          difficulty: difficultyRef.current,
          durationMinutes: 15
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setStarted(false);
        startedRef.current = false;
        setAutoFlow(false);
        autoFlowRef.current = false;
        const msg =
          res.status === 401
            ? "Please sign in with a student account to launch the AI GD panel and save evaluation scores."
            : data?.message || data?.error || "Unable to start GD session right now. Please retry.";
        setLaunchError(msg);
        setModeratorAlert(msg);
        return;
      }
      if (data.sessionId) {
        setSessionId(data.sessionId);
        sessionIdRef.current = data.sessionId;
      }
      if (Array.isArray(data.session?.participants)) {
        const aiSlots = data.session.participants.filter((p: any) => !p.isHuman);
        const palette = [
          { gradient: "linear-gradient(135deg, #f59e0b, #d97706)", badgeBg: "rgba(245, 158, 11, 0.16)", badgeColor: "#fbbf24" },
          { gradient: "linear-gradient(135deg, #10b981, #059669)", badgeBg: "rgba(16, 185, 129, 0.16)", badgeColor: "#34d399" },
          { gradient: "linear-gradient(135deg, #ef4444, #dc2626)", badgeBg: "rgba(239, 68, 68, 0.16)", badgeColor: "#f87171" },
          { gradient: "linear-gradient(135deg, #ec4899, #db2777)", badgeBg: "rgba(236, 72, 153, 0.16)", badgeColor: "#f472b6" }
        ];
        const dynamicPeers: PanelParticipantConfig[] = aiSlots.slice(0, 4).map((p: any, idx: number) => {
          const styleSlot = palette[idx % palette.length];
          const parts = String(p.name || "AI Peer").trim().split(/\s+/);
          const initials = parts.map((w: string) => w[0]?.toUpperCase() || "").join("").slice(0, 2) || "AI";
          return {
            id: p.id,
            name: p.name,
            initials,
            role: p.roleTitle || "Panelist",
            archetype: p.archetype,
            tagline: p.reasoningLens || p.roleTitle || "Adaptive Peer",
            gradient: styleSlot.gradient,
            badgeBg: styleSlot.badgeBg,
            badgeColor: styleSlot.badgeColor,
            pitch: p.voiceProfile?.pitch,
            rate: p.voiceProfile?.rate
          };
        });
        const candidateCard = PANEL_PARTICIPANTS.find((p) => p.isCandidate)!;
        const modCard = PANEL_PARTICIPANTS.find((p) => p.isModerator)!;
        if (dynamicPeers.length > 0) {
          setPanelParticipants([candidateCard, ...dynamicPeers, modCard]);
        }
      }

      const modMsg: GDMessage = {
        speaker: data.moderator_intro?.speaker || "Alex (Discussion Director)",
        avatar: data.moderator_intro?.avatar || "🎙️",
        role: data.moderator_intro?.role || "Discussion Director",
        content: data.moderator_intro?.content || `Welcome candidates. Today's placement topic is: "${activeTopicRef.current}". The floor is open.`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        stage: "briefing",
        isCoach: true
      };

      const peerMsg: GDMessage = {
        speaker: data.opening_speaker?.speaker || "Rohan V.",
        avatar: data.opening_speaker?.avatar || "⚡",
        role: data.opening_speaker?.role || "The Velocity Architect",
        content: data.opening_speaker?.content || `To kick off on "${activeTopicRef.current}", we must analyze the real-world operational trade-offs rather than generic theoretical models.`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        stage: "opening"
      };

      const initialList = [modMsg, peerMsg];
      setMessages(initialList);
      messagesRef.current = initialList;
      setCurrentStage("opening");
      currentStageRef.current = "opening";

      speakVoice(peerMsg.content, peerMsg.speaker, () => {
        scheduleNextTurn();
      });
    } catch (err: any) {
      console.error("Failed to start GD:", err);
      setStarted(false);
      startedRef.current = false;
      setAutoFlow(false);
      autoFlowRef.current = false;
      const rawMsg = String(err?.message || "");
      const msg = /load failed|failed to fetch|network|abort/i.test(rawMsg)
        ? "Server connection timed out or was interrupted while starting the GD panel. Please click Launch again."
        : rawMsg || "Connection interrupted while starting the GD panel.";
      setLaunchError(msg);
      setModeratorAlert(msg);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  // Student Speaks / Intervenes (uses refs so voice callbacks never hit stale closures)
  const handleStudentIntervention = async (spokenText?: string) => {
    const text = (spokenText || input).trim();
    if (!text || loadingRef.current) return;

    if (autoTurnTimeoutRef.current) clearTimeout(autoTurnTimeoutRef.current);
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    const userMsg: GDMessage = {
      speaker: "You",
      avatar: "🎓",
      role: "Candidate (You)",
      content: text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      stage: currentStageRef.current
    };

    const updated = [...messagesRef.current, userMsg];
    setMessages(updated);
    messagesRef.current = updated;
    setInput("");
    setHandRaised(false);
    setLoading(true);
    loadingRef.current = true;

    setActiveSpeaker("You");
    activeSpeakerRef.current = "You";
    setCurrentSubtitle(`You: "${text}"`);

    try {
      // Multi-student Friends Room mode: submit live human turn
      if (friendsRoomRef.current) {
        const res = await fetch("/api/gd/friends", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "submit_turn",
            roomId: friendsRoomRef.current.roomId,
            content: text
          })
        });
        const data = await res.json();
        setActiveSpeaker(null);
        activeSpeakerRef.current = null;
        if (!res.ok || !data.success) {
          setModeratorAlert(data.message || "Unable to submit turn in Friends room.");
          return;
        }
        setFriendsRoom(data.room);
        if (data.currentStage) setCurrentStage(data.currentStage);
        if (Array.isArray(data.transcripts)) {
          const mapped = mapTranscriptsToMessages(data.transcripts);
          setMessages(mapped);
          messagesRef.current = mapped;
        }
        if (data.coachIntervention?.content) {
          setModeratorAlert(data.coachIntervention.content);
          setTimeout(() => setModeratorAlert(null), 8000);
        }
        realtimeRoom.broadcastRoomNudge();
        return;
      }

      const res = await fetch("/api/student/gd-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          topic: activeTopicRef.current,
          format: formatRef.current,
          difficulty: difficultyRef.current,
          messages: updated.slice(-8),
          studentIntervention: text
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setActiveSpeaker(null);
        activeSpeakerRef.current = null;
        setModeratorAlert(
          res.status === 401
            ? "Session unauthenticated — please sign in as a student so the GD panel can respond."
            : data?.message || data?.error || "AI panel could not process that turn."
        );
        if (res.status === 401 || res.status === 403) {
          setAutoFlow(false);
          autoFlowRef.current = false;
        }
        return;
      }

      if (data.sessionId && !sessionIdRef.current) {
        setSessionId(data.sessionId);
        sessionIdRef.current = data.sessionId;
      }

      if (data.next_speaker) {
        const isCoach = Boolean(data.next_speaker.isCoachIntervention);
        const peerMsg: GDMessage = {
          speaker: data.next_speaker.name,
          avatar: data.next_speaker.avatar || (isCoach ? "🎙️" : "💬"),
          role: data.next_speaker.role || (isCoach ? "Discussion Director" : "Peer"),
          content: data.next_speaker.spoken_text,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          stage: data.currentStage || currentStageRef.current,
          isCoach
        };

        if (data.currentStage) setCurrentStage(data.currentStage);

        setMessages(prev => {
          const u = [...prev, peerMsg];
          messagesRef.current = u;
          return u;
        });

        speakVoice(peerMsg.content, peerMsg.speaker, () => {
          scheduleNextTurn();
        });
      } else {
        setActiveSpeaker(null);
        activeSpeakerRef.current = null;
        scheduleNextTurn();
      }

      if (data.student_coaching) {
        setCoaching(data.student_coaching);
      }
    } catch (err: any) {
      console.error("Student intervention error:", err);
      setActiveSpeaker(null);
      activeSpeakerRef.current = null;
      setModeratorAlert(err?.message || "Network error sending your point. Retrying flow.");
    } finally {
      setLoading(false);
      loadingRef.current = false;
      lastSpeechEndTimeRef.current = Date.now();
    }
  };
  handleStudentInterventionRef.current = handleStudentIntervention;

  const toggleMic = async () => {
    const nextMic = !micActive;
    if (friendsRoom) {
      fetch("/api/gd/friends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle_presence", roomId: friendsRoom.roomId, micActive: nextMic })
      }).then(() => realtimeRoom.broadcastRoomNudge()).catch(() => {});
    }

    if (!recognitionRef.current) {
      if (friendsRoom) {
        setMicActive(nextMic);
        micActiveRef.current = nextMic;
        return;
      }
      alert("Speech recognition is not supported in this browser. You can type your points in the input box or click Quick Points.");
      return;
    }

    if (micActive) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setMicActive(false);
      micActiveRef.current = false;
      if (input.trim()) {
        handleStudentIntervention(input);
      }
    } else {
      try {
        recognitionRef.current.start();
        setMicActive(true);
        micActiveRef.current = true;
      } catch (err) {
        if (friendsRoom) {
          setMicActive(true);
          micActiveRef.current = true;
        } else {
          console.error(err);
        }
      }
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const finishAndShowReport = async () => {
    cleanupSession();
    setEvaluatingReport(true);
    setReportError(null);
    setShowReportModal(true);

    try {
      // Multi-student Friends Room mode: generate caller's isolated evaluation & DNA sync
      if (friendsRoomRef.current) {
        const res = await fetch("/api/gd/friends", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "finalize_room_evaluation",
            roomId: friendsRoomRef.current.roomId,
            closeRoom: Boolean(currentUserId && friendsRoomRef.current.hostUserId === currentUserId)
          })
        });
        const data = await res.json();
        if (res.ok && data.success && data.report) {
          setFriendsRoom(data.room);
          setEvaluationReport(data.report);
          setReportDnaSynced(typeof data.dnaSynced === "boolean" ? data.dnaSynced : null);
          realtimeRoom.broadcastRoomNudge();
        } else {
          setReportError(data?.message || data?.error || "Unable to finalize Friends GD report.");
        }
        return;
      }

      if (!sessionIdRef.current) {
        setReportError("No active GD session initialized. Please sign in and launch a discussion first.");
        return;
      }

      const res = await fetch("/api/student/gd-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "finalize_evaluation",
          sessionId: sessionIdRef.current
        })
      });
      const data = await res.json();
      if (res.ok && data.success && data.report) {
        setEvaluationReport(data.report);
        setReportDnaSynced(typeof data.dnaSynced === "boolean" ? data.dnaSynced : null);
      } else {
        setReportError(data?.message || data?.error || "Unable to generate evaluation dossier.");
      }
    } catch (err: any) {
      console.error("Failed to finalize evaluation:", err);
      setReportError(err?.message || "Network error finalizing report.");
    } finally {
      setEvaluatingReport(false);
    }
  };

  const quickJumpIns = [
    { label: "⚡ Latency Risk", text: "I'd like to challenge the scalability premise here. If we optimize prematurely without empirical p99 latency benchmarks, we risk architectural bloat." },
    { label: "🎯 Delivery Velocity", text: "From a delivery timeline and TAM perspective, shipping a reliable v1 in 6 weeks creates far more business leverage than debating hypothetical scale." },
    { label: "🛡️ Attack Surface", text: "We have to consider the zero-day threat surface. Introducing distributed network hops expands our vulnerability surface exponentially." },
    { label: "⚖️ Propose Hybrid", text: "Let's synthesize the technical constraint with the business urgency: starting modular before breaking into independent microservices solves both trade-offs." }
  ];

  const candidateInterventions = messages.filter(m => m.speaker === "You");

  // Determine active speaker text for live card overlay
  const getSpeakerCurrentText = (speakerName: string): string | null => {
    if (!activeSpeaker) return null;
    const isThisSpeaker =
      (speakerName === "You (Candidate)" && (activeSpeaker === "You" || activeSpeaker === "Candidate")) ||
      activeSpeaker.includes(speakerName.replace(" (Director)", "").replace(" (Discussion Director)", "").trim()) ||
      speakerName.includes(activeSpeaker.trim());

    if (!isThisSpeaker) return null;

    if (activeSpeaker === "You") {
      return input || (currentSubtitle.replace(/^You:\s*"/, "").replace(/"$/, "") || "Speaking...");
    }

    const lastMsg = [...messages].reverse().find(m =>
      m.speaker.includes(speakerName.split(" ")[0]) || speakerName.includes(m.speaker.split(" ")[0])
    );
    return lastMsg ? lastMsg.content : currentSubtitle;
  };

  // Dynamic Theme Palette
  const C = {
    bgApp: isDark ? "#070E1A" : "#F8FAFC",
    bgHeader: isDark ? "rgba(11, 20, 36, 0.95)" : "rgba(255, 255, 255, 0.95)",
    bgCard: isDark ? "#0D1829" : "#FFFFFF",
    bgCardHover: isDark ? "#122036" : "#F1F5F9",
    borderLight: isDark ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.08)",
    borderMedium: isDark ? "#1E324F" : "#E2E8F0",
    borderActive: isDark ? "#6366F1" : "#4F46E5",
    textPrimary: isDark ? "#F8FAFC" : "#0F172A",
    textSecondary: isDark ? "#94A3B8" : "#475569",
    textMuted: isDark ? "#64748B" : "#94A3B8",
    dockBg: isDark ? "rgba(13, 24, 41, 0.94)" : "rgba(255, 255, 255, 0.94)",
    inputBg: isDark ? "rgba(0, 0, 0, 0.45)" : "#F1F5F9"
  };

  return (
    <div
      style={{
        height: "100vh",
        maxHeight: "100vh",
        width: "100vw",
        maxWidth: "100vw",
        background: C.bgApp,
        color: C.textPrimary,
        fontFamily: "var(--font-inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxSizing: "border-box"
      }}
    >
      {/* Waveform Keyframe Animations */}
      <style>{`
        @keyframes eqPulseA { 0%, 100% { height: 4px; } 50% { height: 18px; } }
        @keyframes eqPulseB { 0%, 100% { height: 16px; } 50% { height: 6px; } }
        @keyframes eqPulseC { 0%, 100% { height: 8px; } 50% { height: 20px; } }
        @keyframes glowRing {
          0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.6); }
          70% { box-shadow: 0 0 0 10px rgba(99, 102, 241, 0); }
          100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
        }
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.85); }
        }
      `}</style>

      {/* ── TOP NAV / MEETING BAR ── */}
      <header
        style={{
          height: 54,
          flexShrink: 0,
          padding: "0 1.25rem",
          borderBottom: `1px solid ${C.borderLight}`,
          background: C.bgHeader,
          backdropFilter: "blur(20px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 50,
          minWidth: 0
        }}
      >
        {/* Left: Branding, Topic & Stage */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0, flex: 1, marginRight: 12 }}>
          <button
            onClick={() => {
              cleanupSession();
              router.push("/group-discussion?view=overview");
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              fontWeight: 600,
              color: C.textSecondary,
              background: isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9",
              padding: "6px 10px",
              borderRadius: 8,
              border: `1px solid ${C.borderLight}`,
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0
            }}
          >
            <LogOut size={13} />
            <span>Back to Arena</span>
          </button>

          {started && (
            <button
              onClick={() => {
                cleanupSession();
                setStarted(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 12,
                fontWeight: 700,
                color: "#6366f1",
                background: "rgba(99,102,241,0.12)",
                padding: "6px 10px",
                borderRadius: 8,
                border: "1px solid rgba(99,102,241,0.25)",
                cursor: "pointer",
                whiteSpace: "nowrap",
                flexShrink: 0
              }}
            >
              <RotateCcw size={13} />
              <span>Change Topic</span>
            </button>
          )}

          <div style={{ width: 1, height: 18, background: C.borderLight, flexShrink: 0 }} />

          {/* Topic Title & Badges */}
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "nowrap" }}>
              <span
                style={{
                  display: "inline-block",
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: started ? "#22c55e" : "#eab308",
                  boxShadow: started ? "0 0 10px #22c55e" : "none",
                  flexShrink: 0,
                  animation: started ? "pulseDot 2s infinite" : "none"
                }}
              />
              <span style={{ fontSize: 12, fontWeight: 900, color: C.textPrimary, letterSpacing: 0.3, whiteSpace: "nowrap" }}>
                CAMPUS GD ARENA
              </span>
              <span
                style={{
                  fontSize: 10,
                  padding: "2px 7px",
                  borderRadius: 6,
                  background: "rgba(99,102,241,0.15)",
                  color: "#818cf8",
                  fontWeight: 800,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  textTransform: "uppercase"
                }}
              >
                {format.replace(/_/g, " ")} • {difficulty}
              </span>
              {friendsRoomCodeParam && (
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: "rgba(16,185,129,0.15)",
                    color: "#34d399",
                    fontWeight: 900,
                    whiteSpace: "nowrap"
                  }}
                >
                  ROOM: {friendsRoomCodeParam}
                </span>
              )}
            </div>
            <div
              style={{
                fontSize: 11,
                color: C.textSecondary,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                marginTop: 1
              }}
            >
              Topic: <strong style={{ color: C.textPrimary }}>{activeTopic}</strong>
            </div>
          </div>
        </div>

        {/* Right: Controls, Timer & Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          {started && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                background: isDark ? "rgba(0,0,0,0.4)" : "#F1F5F9",
                borderRadius: 8,
                border: `1px solid ${C.borderLight}`
              }}
            >
              <Clock size={13} color="#f59e0b" />
              <span style={{ fontSize: 12, fontWeight: 800, color: "#f59e0b", fontVariantNumeric: "tabular-nums" }}>
                {formatTimer(secondsElapsed)}
              </span>
            </div>
          )}

          {started && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                background: "rgba(99,102,241,0.12)",
                borderRadius: 8,
                border: "1px solid rgba(99,102,241,0.25)"
              }}
            >
              <span style={{ fontSize: 10, color: "#818cf8", fontWeight: 800, textTransform: "uppercase" }}>
                {experienceMode !== "standard_round" ? `${experienceMode.replace(/_/g, " ")} · ` : ""}
                {currentStage.replace(/_/g, " ")}
              </span>
            </div>
          )}

          {/* Sound Mute/Unmute */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11,
              padding: "5px 10px",
              borderRadius: 8,
              background: soundEnabled ? "rgba(16,185,129,0.15)" : isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9",
              border: soundEnabled ? "1px solid rgba(16,185,129,0.3)" : `1px solid ${C.borderLight}`,
              color: soundEnabled ? "#10b981" : C.textMuted,
              cursor: "pointer",
              fontWeight: 700
            }}
          >
            {soundEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            <span>{soundEnabled ? "Audio On" : "Audio Muted"}</span>
          </button>

          {/* Auto-Debate Flow Toggle */}
          <button
            onClick={() => {
              const next = !autoFlow;
              setAutoFlow(next);
              autoFlowRef.current = next;
              if (next && started) {
                lastSpeechEndTimeRef.current = Date.now() - 2500;
                triggerPeerTurn();
              }
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 11,
              padding: "5px 11px",
              borderRadius: 8,
              background: autoFlow ? "rgba(16,185,129,0.18)" : "rgba(239,68,68,0.15)",
              border: autoFlow ? "1px solid #10b981" : "1px solid rgba(239,68,68,0.3)",
              color: autoFlow ? "#10b981" : "#ef4444",
              cursor: "pointer",
              fontWeight: 800,
              whiteSpace: "nowrap"
            }}
          >
            {autoFlow ? <Play size={13} /> : <Pause size={13} />}
            <span>{autoFlow ? "Auto-Debate: ON" : "Auto: Paused"}</span>
          </button>

          {started && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                padding: "5px 10px",
                borderRadius: 8,
                background: sidebarOpen ? "rgba(99,102,241,0.15)" : isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9",
                border: sidebarOpen ? "1px solid rgba(99,102,241,0.3)" : `1px solid ${C.borderLight}`,
                color: sidebarOpen ? "#818cf8" : C.textSecondary,
                cursor: "pointer",
                fontWeight: 700
              }}
            >
              <BarChart3 size={13} />
              <span>{sidebarOpen ? "Hide Coach" : "Show Coach"}</span>
            </button>
          )}

          {started && (
            <button
              onClick={finishAndShowReport}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                fontSize: 11,
                padding: "5px 12px",
                borderRadius: 8,
                background: "linear-gradient(135deg, #e11d48, #be123c)",
                border: "none",
                color: "white",
                cursor: "pointer",
                fontWeight: 800,
                whiteSpace: "nowrap",
                boxShadow: "0 2px 10px rgba(225,29,72,0.4)"
              }}
            >
              <Award size={13} />
              <span>End & View Report</span>
            </button>
          )}
        </div>
      </header>

      {/* ── MODERATOR HIGH-PRIORITY INTERVENTION BANNER ── */}
      {moderatorAlert && (
        <div
          style={{
            background: "linear-gradient(90deg, #10b981, #059669)",
            color: "white",
            padding: "8px 20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: 12,
            fontWeight: 800,
            zIndex: 60,
            boxShadow: "0 4px 16px rgba(16,185,129,0.3)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16 }}>🎙️</span>
            <span>COACH ALEX: {moderatorAlert}</span>
          </div>
          <button
            onClick={() => setModeratorAlert(null)}
            style={{ background: "none", border: "none", color: "white", cursor: "pointer", fontWeight: 900 }}
          >
            ✕
          </button>
        </div>
      )}

      {/* ── PRE-FLIGHT TOPIC SELECTOR & SIMULATION LAUNCHER ── */}
      {!started ? (
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem 1.5rem"
          }}
        >
          {friendsRoom ? (
            <div
              style={{
                maxWidth: 760,
                width: "100%",
                padding: "2rem",
                background: C.bgCard,
                border: `1px solid ${C.borderLight}`,
                borderRadius: 24,
                boxShadow: isDark ? "0 25px 50px -12px rgba(0,0,0,0.8)" : "0 20px 40px -12px rgba(0,0,0,0.08)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 18 }}>
                <div>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#6366f1", textTransform: "uppercase" }}>
                    Friends Multiplayer Waiting Lobby · {realtimeRoom.realtimeStatus === "realtime_active" ? "Realtime Live" : "Sync Active"}
                  </span>
                  <h1 style={{ fontSize: 22, fontWeight: 900, margin: "4px 0 0", color: C.textPrimary }}>
                    Room {friendsRoom.roomCode}
                  </h1>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined" && navigator.clipboard) {
                      navigator.clipboard.writeText(`${window.location.origin}/student/gd-practice?room=${friendsRoom.roomCode}`);
                      setFriendsCopyFeedback("Invite Link Copied!");
                      setTimeout(() => setFriendsCopyFeedback(null), 2500);
                    }
                  }}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 10,
                    background: "rgba(99,102,241,0.14)",
                    border: "1px solid rgba(99,102,241,0.35)",
                    color: "#818cf8",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {friendsCopyFeedback || "Copy Room Invite Link"}
                </button>
              </div>

              <div style={{ padding: 14, borderRadius: 12, background: C.inputBg, border: `1px solid ${C.borderLight}`, marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase" }}>Topic</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary, marginTop: 4 }}>{friendsRoom.topicTitle}</div>
                <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 4 }}>
                  Format: {friendsRoom.format} · Difficulty: {friendsRoom.difficulty} · Max Peers: {friendsRoom.maxParticipants}
                </div>
              </div>

              <div style={{ marginBottom: 18 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.textMuted, textTransform: "uppercase", marginBottom: 8 }}>
                  Joined Participants ({friendsRoom.participants.length}/{friendsRoom.maxParticipants})
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8 }}>
                  {friendsRoom.participants.map((fp) => (
                    <div
                      key={fp.userId}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 10,
                        background: C.inputBg,
                        border: `1px solid ${fp.userId === currentUserId ? "#6366f1" : C.borderLight}`,
                        fontSize: 12
                      }}
                    >
                      <div style={{ fontWeight: 700, color: C.textPrimary }}>
                        {fp.avatar} {fp.fullName} {fp.userId === currentUserId ? "(You)" : ""}
                      </div>
                      <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>
                        {fp.isHost ? "Host" : "Peer"} · {fp.micActive ? "Mic Ready" : "Muted"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {currentUserId === friendsRoom.hostUserId ? (
                <button
                  type="button"
                  onClick={startGD}
                  style={{
                    width: "100%",
                    padding: "1rem",
                    background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                    color: "white",
                    border: "none",
                    borderRadius: 12,
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: "pointer"
                  }}
                >
                  Launch Shared Friends GD Session ({friendsRoom.participants.length} Joined)
                </button>
              ) : (
                <div style={{ textAlign: "center", padding: "12px", borderRadius: 10, background: "rgba(99,102,241,0.1)", color: "#818cf8", fontSize: 13, fontWeight: 700 }}>
                  Waiting for Host ({friendsRoom.hostName}) to start the live discussion...
                </div>
              )}
            </div>
          ) : (
          <div
            style={{
              maxWidth: 920,
              width: "100%",
              padding: "2.25rem",
              background: C.bgCard,
              border: `1px solid ${C.borderLight}`,
              borderRadius: 24,
              boxShadow: isDark
                ? "0 25px 50px -12px rgba(0,0,0,0.8)"
                : "0 20px 40px -12px rgba(0,0,0,0.08)"
            }}
          >
            {/* Header info */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: "1.75rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: "linear-gradient(135deg, #6366f1, #a855f7)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white"
                    }}
                  >
                    <Users size={22} />
                  </div>
                  <div>
                    <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, color: C.textPrimary }}>
                      Placement Group Discussion Arena
                    </h1>
                    <span style={{ fontSize: 11, color: "#6366f1", fontWeight: 700, textTransform: "uppercase" }}>
                      Multi-Speaker Live Autonomous Simulation
                    </span>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.5, margin: 0, maxWidth: 640 }}>
                  Practice realistic campus placement debates against 4 calibrated AI peer personas under an active FAANG panel bar-raiser with real-time speech and turn taking.
                </p>
              </div>

              <button
                onClick={handleGenerateAITopics}
                disabled={generatingTopics}
                style={{
                  padding: "9px 16px",
                  borderRadius: 12,
                  background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.25))",
                  border: "1px solid rgba(168,85,247,0.4)",
                  color: isDark ? "#e0e7ff" : "#4f46e5",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: generatingTopics ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                <Sparkles size={14} color="#a855f7" />
                <span>{generatingTopics ? "Synthesizing with Groq AI..." : "Generate Fresh Topics with AI"}</span>
              </button>
            </div>

            {generationNotice && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  background: "rgba(34,197,94,0.15)",
                  border: "1px solid rgba(34,197,94,0.3)",
                  color: "#10b981",
                  fontSize: 12,
                  fontWeight: 700,
                  marginBottom: "1.25rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 8
                }}
              >
                <CheckCircle2 size={15} />
                <span>{generationNotice}</span>
              </div>
            )}

            {/* Simulation Format & Difficulty Selectors */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: "1.5rem" }}>
              <div>
                <label style={{ fontSize: 11, color: C.textSecondary, fontWeight: 800, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  Simulation Format
                </label>
                <select
                  value={format}
                  onChange={(e: any) => setFormat(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: 12,
                    background: C.inputBg,
                    border: `1px solid ${C.borderLight}`,
                    color: C.textPrimary,
                    fontSize: 13,
                    fontWeight: 700,
                    outline: "none"
                  }}
                >
                  <option value="competitive">Competitive Placement GD (High Challenge)</option>
                  <option value="collaborative">Collaborative GD (Consensus Building)</option>
                  <option value="corporate">Corporate Assessment (Business Trade-offs)</option>
                  <option value="technical_business">Technical & Business (Architecture & SLAs)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 11, color: C.textSecondary, fontWeight: 800, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                  Difficulty Tier
                </label>
                <select
                  value={difficulty}
                  onChange={(e: any) => setDifficulty(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "11px 14px",
                    borderRadius: 12,
                    background: C.inputBg,
                    border: `1px solid ${C.borderLight}`,
                    color: C.textPrimary,
                    fontSize: 13,
                    fontWeight: 700,
                    outline: "none"
                  }}
                >
                  <option value="beginner">Beginner (Gentle Pacing)</option>
                  <option value="intermediate">Intermediate (Standard Campus Round)</option>
                  <option value="advanced">Advanced (High Pressure & Counter-probes)</option>
                  <option value="expert">Expert (Bar-Raiser Panel Rigor)</option>
                </select>
              </div>
            </div>

            {/* Scenario Experience Mode */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ fontSize: 11, color: C.textSecondary, fontWeight: 800, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                Experience Engine Scenario
              </label>
              <select
                value={experienceMode}
                onChange={(e: any) => setExperienceMode(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 14px",
                  borderRadius: 12,
                  background: C.inputBg,
                  border: `1px solid ${C.borderLight}`,
                  color: C.textPrimary,
                  fontSize: 12,
                  fontWeight: 700,
                  outline: "none"
                }}
              >
                <option value="standard_round">Standard Placement Roundtable</option>
                <option value="crisis_room">Crisis War-Room (Live Incident Shockwave)</option>
                <option value="boardroom_debate">Boardroom Strategy (ROI & Budget Pressure)</option>
                <option value="ethical_dilemma">Ethical & Policy Dilemma</option>
                <option value="case_data_discussion">Case & Constraint Analysis</option>
              </select>
            </div>

            {/* Domain Category Filter Chips */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontSize: 11, color: C.textSecondary, fontWeight: 800, textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                Select Domain Category
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {GD_CATEGORIES.map(cat => {
                  const isSelected = selectedCategory === cat.id;
                  const catTopics = topicsByCategory[cat.id] || [];
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        if (catTopics.length > 0 && !customTopicInput) {
                          setSelectedTopic(catTopics[0].title);
                        }
                      }}
                      style={{
                        padding: "7px 14px",
                        borderRadius: 10,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        border: isSelected ? "1px solid #6366f1" : `1px solid ${C.borderLight}`,
                        background: isSelected ? "rgba(99,102,241,0.18)" : isDark ? "rgba(255,255,255,0.03)" : "#F1F5F9",
                        color: isSelected ? (isDark ? "#e0e7ff" : "#4f46e5") : C.textSecondary,
                        transition: "all 0.15s ease"
                      }}
                    >
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Topics List */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontSize: 11, color: C.textSecondary, fontWeight: 800, textTransform: "uppercase", display: "block", marginBottom: 8 }}>
                Discussion Topics in {GD_CATEGORIES.find(c => c.id === selectedCategory)?.name}
              </label>
              <div style={{ display: "flex", flexDirection: "column", gap: 9, maxHeight: 250, overflowY: "auto", paddingRight: 4 }}>
                {(topicsByCategory[selectedCategory] || []).map((t, i) => {
                  const isSelected = selectedTopic === t.title && !customTopicInput;
                  return (
                    <div
                      key={i}
                      onClick={() => {
                        setSelectedTopic(t.title);
                        setCustomTopicInput("");
                      }}
                      style={{
                        padding: "0.9rem 1.15rem",
                        borderRadius: 14,
                        border: isSelected ? "1.5px solid #6366f1" : `1px solid ${C.borderLight}`,
                        background: isSelected ? (isDark ? "rgba(99,102,241,0.14)" : "rgba(99,102,241,0.06)") : C.bgCard,
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <div style={{ fontSize: 13, fontWeight: 800, color: isSelected ? (isDark ? "#e0e7ff" : "#4f46e5") : C.textPrimary, marginBottom: 4 }}>
                        {t.title}
                      </div>
                      {t.context && (
                        <div style={{ fontSize: 11, color: C.textSecondary, lineHeight: 1.4 }}>
                          {t.context}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Write-In Placement Topic */}
            <div style={{ marginBottom: "1.75rem" }}>
              <label style={{ fontSize: 11, color: C.textSecondary, fontWeight: 800, textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                Or Enter Custom Placement Topic
              </label>
              <input
                type="text"
                value={customTopicInput}
                onChange={e => setCustomTopicInput(e.target.value)}
                placeholder="e.g. Distributed Consensus (Raft vs Paxos) in High-Throughput Financial Ledgers..."
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  background: C.inputBg,
                  border: `1px solid ${C.borderLight}`,
                  borderRadius: 12,
                  color: C.textPrimary,
                  fontSize: 13,
                  outline: "none",
                  boxSizing: "border-box"
                }}
              />
            </div>

            {(authStatus === "unauthenticated" || launchError) && (
              <div
                style={{
                  marginBottom: "1.25rem",
                  padding: "12px 16px",
                  borderRadius: 12,
                  background: "rgba(239, 68, 68, 0.12)",
                  border: "1px solid rgba(239, 68, 68, 0.35)",
                  color: isDark ? "#fca5a5" : "#b91c1c",
                  fontSize: 13,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 10
                }}
              >
                <span>
                  {launchError || "Sign in with your Cognalyze student account to launch the live AI GD panel and record verified evaluations."}
                </span>
                {(authStatus === "unauthenticated" ||
                  Boolean(launchError && /sign in|unauthorized|authentication/i.test(launchError))) && (
                  <a
                    href={`/login?redirect=${encodeURIComponent("/student/gd-practice")}`}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 8,
                      background: "#4f46e5",
                      color: "#FFFFFF",
                      fontSize: 12,
                      fontWeight: 700,
                      textDecoration: "none",
                      whiteSpace: "nowrap"
                    }}
                  >
                    Sign In as Student →
                  </a>
                )}
              </div>
            )}

            {/* Launch Meeting Room Button */}
            <button
              onClick={startGD}
              style={{
                width: "100%",
                padding: "1.1rem",
                background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                color: "white",
                border: "none",
                borderRadius: 14,
                fontWeight: 900,
                fontSize: 15,
                cursor: "pointer",
                boxShadow: "0 4px 20px rgba(99,102,241,0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                transition: "transform 0.15s ease"
              }}
            >
              <Play size={18} />
              <span>Launch Live Placement Meeting Room (Continuous Auto-Debate)</span>
            </button>
          </div>
          )}
        </div>
      ) : (
        /* ── LIVE MEETING ROOM ── */
        <div style={{ flex: 1, minHeight: 0, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden", width: "100%" }}>
          <div
            style={{
              flex: 1,
              minHeight: 0,
              minWidth: 0,
              display: isMobile ? "flex" : "grid",
              flexDirection: "column",
              gridTemplateColumns: !isMobile ? (sidebarOpen ? "minmax(0, 1fr) 340px" : "minmax(0, 1fr)") : undefined,
              gap: "0.75rem",
              padding: "0.75rem 1rem",
              overflow: "hidden"
            }}
          >
            {/* Left Stage: 6-Slot Participant Conference Grid & Control Dock */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", minHeight: 0, minWidth: 0, height: "100%", overflow: "hidden" }}>
              
              {/* 6-Participant Balanced Conference Grid (2 rows x 3 columns) */}
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  minWidth: 0,
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gridTemplateRows: "repeat(2, minmax(0, 1fr))",
                  gap: "0.6rem"
                }}
              >
                {panelParticipants.map(p => {
                  const isUser = p.isCandidate;
                  const isCoach = p.isModerator;
                  const isSpeaking = activeSpeaker
                    ? (isUser && activeSpeaker === "You") ||
                      (!isUser && (activeSpeaker.includes(p.name.split(" ")[0]) || p.name.includes(activeSpeaker.split(" ")[0])))
                    : false;

                  const speakerText = getSpeakerCurrentText(p.name);

                  return (
                    <div
                      key={p.id}
                      style={{
                        background: isSpeaking
                          ? (isDark ? "rgba(99,102,241,0.14)" : "rgba(99,102,241,0.08)")
                          : C.bgCard,
                        border: isSpeaking
                          ? "2px solid #6366f1"
                          : isCoach
                          ? (isDark ? "1.5px solid rgba(14,165,233,0.3)" : "1.5px solid rgba(14,165,233,0.4)")
                          : `1px solid ${C.borderLight}`,
                        borderRadius: 16,
                        position: "relative",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        padding: "0.65rem 0.85rem",
                        boxShadow: isSpeaking
                          ? "0 0 24px rgba(99,102,241,0.45)"
                          : "none",
                        transition: "all 0.2s ease"
                      }}
                    >
                      {/* Top Bar of the Tile */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                          <span style={{ fontSize: 12, fontWeight: 900, color: C.textPrimary, whiteSpace: "nowrap" }}>
                            {p.name}
                          </span>
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 800,
                              padding: "2px 6px",
                              borderRadius: 5,
                              background: p.badgeBg,
                              color: p.badgeColor,
                              whiteSpace: "nowrap",
                              textTransform: "uppercase"
                            }}
                          >
                            {p.role}
                          </span>
                        </div>

                        {/* Speaking / Audio Waveform Indicator */}
                        {isSpeaking ? (
                          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                            <div style={{ display: "flex", gap: 2, alignItems: "flex-end", height: 16 }}>
                              <span style={{ width: 3, background: "#6366f1", borderRadius: 2, animation: "eqPulseA 0.4s infinite" }} />
                              <span style={{ width: 3, background: "#818cf8", borderRadius: 2, animation: "eqPulseB 0.5s infinite" }} />
                              <span style={{ width: 3, background: "#a5b4fc", borderRadius: 2, animation: "eqPulseC 0.45s infinite" }} />
                            </div>
                            <span style={{ fontSize: 9, color: "#818cf8", fontWeight: 800 }}>Speaking</span>
                          </div>
                        ) : (
                          <span style={{ fontSize: 9, color: C.textMuted, fontWeight: 700 }}>
                            {isUser ? (micActive ? "Ready" : "Muted") : "Listening"}
                          </span>
                        )}
                      </div>

                      {/* Center Stage: Live Camera OR Elevated Persona Avatar */}
                      <div
                        style={{
                          flex: 1,
                          minHeight: 0,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "relative",
                          padding: "0.25rem 0"
                        }}
                      >
                        {isUser && cameraActive ? (
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            style={{
                              position: "absolute",
                              inset: 0,
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                              borderRadius: 10,
                              transform: "scaleX(-1)"
                            }}
                          />
                        ) : (
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
                            {/* Stylized Gradient Avatar Circle */}
                            <div
                              style={{
                                width: 56,
                                height: 56,
                                borderRadius: "50%",
                                background: p.gradient,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                fontSize: 16,
                                fontWeight: 900,
                                letterSpacing: 0.5,
                                marginBottom: 6,
                                boxShadow: isSpeaking ? "0 0 18px rgba(99,102,241,0.6)" : "0 4px 12px rgba(0,0,0,0.15)",
                                border: isSpeaking ? "2px solid white" : "2px solid rgba(255,255,255,0.2)"
                              }}
                            >
                              {p.initials}
                            </div>
                            <div style={{ fontSize: 10, color: C.textSecondary, fontWeight: 600, maxWidth: 180, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {p.tagline}
                            </div>
                          </div>
                        )}

                        {/* Live Quote Speech Overlay on the Active Speaker's Card */}
                        {isSpeaking && speakerText && (
                          <div
                            style={{
                              position: "absolute",
                              bottom: 0,
                              left: 4,
                              right: 4,
                              padding: "6px 10px",
                              background: isDark ? "rgba(10,20,35,0.92)" : "rgba(255,255,255,0.95)",
                              backdropFilter: "blur(12px)",
                              border: "1px solid rgba(99,102,241,0.35)",
                              borderRadius: 10,
                              boxShadow: "0 6px 18px rgba(0,0,0,0.25)",
                              zIndex: 20
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "flex-start", gap: 5 }}>
                              <Quote size={12} color="#818cf8" style={{ flexShrink: 0, marginTop: 1 }} />
                              <div
                                style={{
                                  fontSize: 10,
                                  color: C.textPrimary,
                                  lineHeight: 1.35,
                                  fontWeight: 600,
                                  fontStyle: "italic",
                                  maxHeight: 38,
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  display: "-webkit-box",
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: "vertical"
                                }}
                              >
                                {speakerText}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Bottom Status Strip */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          paddingTop: 4,
                          borderTop: `1px solid ${C.borderLight}`,
                          zIndex: 10
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                          <span style={{ fontSize: 9, color: C.textMuted, fontWeight: 700, textTransform: "uppercase" }}>
                            {p.archetype.replace(/_/g, " ")}
                          </span>
                        </div>

                        {isUser && handRaised && (
                          <span style={{ fontSize: 9, color: "#f59e0b", fontWeight: 800 }}>
                            ✋ Floor Requested
                          </span>
                        )}

                        {isCoach && (
                          <span style={{ fontSize: 9, color: "#38bdf8", fontWeight: 800 }}>
                            ⭐ PANEL MODERATOR
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Live Speech Subtitle Strip */}
              <div
                style={{
                  padding: "0.5rem 0.9rem",
                  background: isDark ? "rgba(13,24,41,0.9)" : "#FFFFFF",
                  border: `1px solid ${C.borderLight}`,
                  borderRadius: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexShrink: 0
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1" }} />
                  <span style={{ fontSize: 10, color: "#6366f1", fontWeight: 900 }}>LIVE PROBE:</span>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: C.textPrimary,
                    fontStyle: "italic",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1
                  }}
                >
                  {currentSubtitle || (loading ? "Formulating counter-probe..." : "Floor active. Click mic or Quick Points to intervene anytime.")}
                </div>
              </div>

              {/* Quick Argument Intervention Chips */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, overflowX: "auto", flexShrink: 0, paddingBottom: 2 }}>
                <span style={{ fontSize: 10, color: C.textMuted, fontWeight: 800, flexShrink: 0 }}>Quick Interjections:</span>
                {quickJumpIns.map((chip, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleStudentIntervention(chip.text)}
                    disabled={loading}
                    style={{
                      padding: "5px 10px",
                      borderRadius: 8,
                      background: isDark ? "rgba(255,255,255,0.04)" : "#F1F5F9",
                      border: `1px solid ${C.borderLight}`,
                      color: C.textSecondary,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "all 0.15s ease"
                    }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Floating Bottom Meeting Control Dock */}
              <div
                style={{
                  padding: "0.6rem 1rem",
                  background: C.dockBg,
                  backdropFilter: "blur(20px)",
                  border: `1px solid ${C.borderLight}`,
                  borderRadius: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  flexShrink: 0,
                  boxShadow: isDark ? "0 10px 30px rgba(0,0,0,0.5)" : "0 8px 24px rgba(0,0,0,0.06)"
                }}
              >
                {/* Media Call Controls */}
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <button
                    onClick={toggleMic}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 14px",
                      borderRadius: 10,
                      border: micActive ? "1.5px solid #ef4444" : `1px solid ${C.borderLight}`,
                      background: micActive ? "rgba(239,68,68,0.2)" : isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9",
                      color: micActive ? "#ef4444" : C.textPrimary,
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    {micActive ? <Mic size={15} /> : <MicOff size={15} />}
                    <span>{micActive ? "Speaking (Mute)" : "Unmute Mic"}</span>
                  </button>

                  <button
                    onClick={() => setCameraActive(!cameraActive)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 12px",
                      borderRadius: 10,
                      border: cameraActive ? "1.5px solid #10b981" : `1px solid ${C.borderLight}`,
                      background: cameraActive ? "rgba(16,185,129,0.18)" : isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9",
                      color: cameraActive ? "#10b981" : C.textSecondary,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    {cameraActive ? <Video size={15} /> : <VideoOff size={15} />}
                    <span>{cameraActive ? "Cam On" : "Cam Off"}</span>
                  </button>

                  <button
                    onClick={() => setHandRaised(!handRaised)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "8px 12px",
                      borderRadius: 10,
                      border: handRaised ? "1.5px solid #f59e0b" : `1px solid ${C.borderLight}`,
                      background: handRaised ? "rgba(245,158,11,0.2)" : isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9",
                      color: handRaised ? "#f59e0b" : C.textSecondary,
                      fontSize: 11,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    <Hand size={15} />
                    <span>{handRaised ? "Hand Raised" : "Raise Hand"}</span>
                  </button>
                </div>

                {/* Instant Intervene Input Bar */}
                <div style={{ flex: 1, minWidth: 140, display: "flex", alignItems: "center", gap: 8 }}>
                  <input
                    type="text"
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter") handleStudentIntervention();
                    }}
                    placeholder="Type your point or counter-probe (Press Enter to speak)..."
                    style={{
                      flex: 1,
                      minWidth: 80,
                      padding: "9px 14px",
                      background: C.inputBg,
                      border: `1px solid ${C.borderLight}`,
                      borderRadius: 10,
                      color: C.textPrimary,
                      fontSize: 12,
                      outline: "none"
                    }}
                  />
                  <button
                    onClick={() => handleStudentIntervention()}
                    disabled={!input.trim()}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "9px 16px",
                      background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                      color: "white",
                      border: "none",
                      borderRadius: 10,
                      fontWeight: 800,
                      fontSize: 11,
                      cursor: input.trim() ? "pointer" : "not-allowed",
                      opacity: input.trim() ? 1 : 0.6,
                      whiteSpace: "nowrap"
                    }}
                  >
                    <span>Intervene</span>
                    <Send size={13} />
                  </button>
                </div>
              </div>

            </div>

            {/* Right: Coach Observation & Live Transcript Sidebar */}
            {sidebarOpen && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.6rem",
                  minHeight: 0,
                  minWidth: 0,
                  height: "100%",
                  overflow: "hidden"
                }}
              >
                {/* Segmented Sidebar Tab Header */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: 4,
                    background: isDark ? "rgba(0,0,0,0.3)" : "#E2E8F0",
                    borderRadius: 12,
                    flexShrink: 0
                  }}
                >
                  <button
                    onClick={() => setSidebarTab("coach")}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      padding: "6px 10px",
                      borderRadius: 9,
                      border: "none",
                      background: sidebarTab === "coach" ? C.bgCard : "transparent",
                      color: sidebarTab === "coach" ? "#6366f1" : C.textSecondary,
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: "pointer",
                      boxShadow: sidebarTab === "coach" ? "0 2px 8px rgba(0,0,0,0.1)" : "none"
                    }}
                  >
                    <BarChart3 size={13} />
                    <span>Recruiter Barometer</span>
                  </button>

                  <button
                    onClick={() => setSidebarTab("transcript")}
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 6,
                      padding: "6px 10px",
                      borderRadius: 9,
                      border: "none",
                      background: sidebarTab === "transcript" ? C.bgCard : "transparent",
                      color: sidebarTab === "transcript" ? "#6366f1" : C.textSecondary,
                      fontSize: 11,
                      fontWeight: 800,
                      cursor: "pointer",
                      boxShadow: sidebarTab === "transcript" ? "0 2px 8px rgba(0,0,0,0.1)" : "none"
                    }}
                  >
                    <MessageSquare size={13} />
                    <span>Transcript ({messages.length})</span>
                  </button>
                </div>

                {/* Tab 1: Real-Time Recruiter Feedback & Barometer */}
                {sidebarTab === "coach" ? (
                  <div
                    style={{
                      flex: 1,
                      minHeight: 0,
                      background: C.bgCard,
                      border: `1px solid ${C.borderLight}`,
                      borderRadius: 16,
                      padding: "1rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      overflowY: "auto"
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 10, color: "#10b981", fontWeight: 800, letterSpacing: 0.5, marginBottom: 2 }}>
                        FAANG HIRING COMMITTEE • BAROMETER
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 900, color: C.textPrimary }}>
                        Live Round-Table Debate Dynamics
                      </div>
                    </div>

                    {coaching ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "8px 12px",
                            background: "rgba(16,185,129,0.12)",
                            borderRadius: 12,
                            border: "1px solid rgba(16,185,129,0.25)"
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 9, color: C.textSecondary }}>GD Articulation Impact</div>
                            <div style={{ fontSize: 12, fontWeight: 900, color: "#10b981" }}>
                              {coaching.valueAdded || "High Value"} Contention
                            </div>
                          </div>
                          <div style={{ fontSize: 22, fontWeight: 900, color: "#10b981" }}>
                            {coaching.articulationScore}<span style={{ fontSize: 11, color: C.textMuted }}>/100</span>
                          </div>
                        </div>

                        <div
                          style={{
                            fontSize: 11,
                            color: C.textPrimary,
                            lineHeight: 1.4,
                            background: isDark ? "rgba(0,0,0,0.3)" : "#F1F5F9",
                            padding: "8px 10px",
                            borderRadius: 10,
                            border: `1px solid ${C.borderLight}`
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                            <TrendingUp size={13} color="#f59e0b" />
                            <strong style={{ color: "#f59e0b", fontSize: 10, textTransform: "uppercase" }}>Recommended Next Move:</strong>
                          </div>
                          <div>{coaching.feedbackTip}</div>
                        </div>

                        {coaching.winningCounterPhrase && (
                          <div
                            style={{
                              fontSize: 11,
                              color: isDark ? "#c7d2fe" : "#4338ca",
                              lineHeight: 1.4,
                              background: "rgba(99,102,241,0.1)",
                              padding: "8px 10px",
                              borderRadius: 10,
                              border: "1px solid rgba(99,102,241,0.2)"
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                              <Brain size={13} color="#818cf8" />
                              <strong style={{ color: C.textPrimary, fontSize: 10, textTransform: "uppercase" }}>Tactical Interjection:</strong>
                            </div>
                            <div style={{ fontStyle: "italic", marginBottom: 6 }}>
                              &quot;{coaching.winningCounterPhrase}&quot;
                            </div>
                            <button
                              onClick={() => setInput(coaching.winningCounterPhrase)}
                              style={{
                                padding: "4px 8px",
                                borderRadius: 6,
                                background: "#6366f1",
                                color: "white",
                                border: "none",
                                fontSize: 10,
                                fontWeight: 800,
                                cursor: "pointer"
                              }}
                            >
                              ⚡ Use this phrasing
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div
                        style={{
                          fontSize: 11,
                          color: C.textSecondary,
                          lineHeight: 1.45,
                          padding: "12px",
                          background: isDark ? "rgba(255,255,255,0.02)" : "#F8FAFC",
                          borderRadius: 12,
                          border: `1px solid ${C.borderLight}`
                        }}
                      >
                        Peers are actively debating architectural trade-offs. Jump in via microphone or Quick Points to assert floor leadership and earn bar-raiser approval!
                      </div>
                    )}

                    {/* Floor Share Progress Indicator */}
                    <div style={{ marginTop: "auto", paddingTop: 10, borderTop: `1px solid ${C.borderLight}` }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 10, color: C.textSecondary, fontWeight: 700 }}>Your Spoken Turns:</span>
                        <span style={{ fontSize: 11, color: "#6366f1", fontWeight: 900 }}>
                          {candidateInterventions.length} turns
                        </span>
                      </div>
                      <div style={{ width: "100%", height: 6, background: isDark ? "#1E2E48" : "#E2E8F0", borderRadius: 3, overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${Math.min(100, candidateInterventions.length * 20)}%`,
                            height: "100%",
                            background: "linear-gradient(90deg, #6366f1, #10b981)",
                            borderRadius: 3,
                            transition: "width 0.3s ease"
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Tab 2: Live Multi-Speaker Transcript Stream */
                  <div
                    style={{
                      flex: 1,
                      minHeight: 0,
                      background: C.bgCard,
                      border: `1px solid ${C.borderLight}`,
                      borderRadius: 16,
                      padding: "0.85rem",
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden"
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color: C.textSecondary,
                        fontWeight: 800,
                        letterSpacing: 0.5,
                        marginBottom: 8,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between"
                      }}
                    >
                      <span>LIVE TRANSCRIPT ({messages.length})</span>
                      {autoFlow && <span style={{ color: "#10b981", fontSize: 9 }}>● AUTO-FLOW ACTIVE</span>}
                    </div>

                    <div
                      ref={chatScrollRef}
                      style={{
                        flex: 1,
                        minHeight: 0,
                        overflowY: "auto",
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        paddingRight: 4
                      }}
                    >
                      {messages.map((m, idx) => {
                        const isUser = m.speaker === "You";
                        const isCoach = m.isCoach;
                        return (
                          <div
                            key={idx}
                            style={{
                              padding: "7px 10px",
                              background: isUser
                                ? "rgba(99,102,241,0.12)"
                                : isCoach
                                ? "rgba(16,185,129,0.12)"
                                : isDark
                                ? "rgba(255,255,255,0.03)"
                                : "#F8FAFC",
                              border: isUser
                                ? "1px solid rgba(99,102,241,0.25)"
                                : isCoach
                                ? "1px solid rgba(16,185,129,0.25)"
                                : `1px solid ${C.borderLight}`,
                              borderRadius: 10
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                              <span
                                style={{
                                  fontSize: 10,
                                  fontWeight: 800,
                                  color: isUser ? "#818cf8" : isCoach ? "#10b981" : C.textPrimary
                                }}
                              >
                                {m.avatar} {m.speaker}
                              </span>
                              <span style={{ fontSize: 9, color: C.textMuted }}>{m.time}</span>
                            </div>
                            <div style={{ fontSize: 11, color: C.textSecondary, lineHeight: 1.35 }}>
                              <MarkdownRenderer content={m.content} compact />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      )}

      {/* ── REAL EVIDENCE-GROUNDED EVALUATION DOSSIER MODAL ── */}
      {showReportModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(7,14,26,0.92)",
            backdropFilter: "blur(24px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "clamp(0.5rem, 2vw, 1.5rem)"
          }}
        >
          <div
            style={{
              maxWidth: 900,
              width: "100%",
              maxHeight: "92vh",
              overflowY: "auto",
              background: C.bgCard,
              border: `1px solid ${C.borderLight}`,
              borderRadius: 24,
              padding: "clamp(1rem, 3vw, 2.25rem)",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8)"
            }}
          >
            {evaluatingReport ? (
              <div style={{ textAlign: "center", padding: "3.5rem" }}>
                <div style={{ fontSize: 36, marginBottom: 14 }}>⏳</div>
                <h3 style={{ fontSize: 20, fontWeight: 800, color: C.textPrimary, marginBottom: 8 }}>
                  Analyzing Discussion Transcripts & Grounding Evidence...
                </h3>
                <p style={{ fontSize: 13, color: C.textSecondary }}>
                  Cross-examining candidate turns across 8 weighted evaluation dimensions with verifiable transcript citations.
                </p>
              </div>
            ) : evaluationReport ? (
              <div>
                {/* Modal Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderBottom: `1px solid ${C.borderLight}`, paddingBottom: "1.25rem", marginBottom: "1.5rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 11, padding: "2px 8px", background: "rgba(52,211,153,0.2)", color: "#10b981", borderRadius: 6, fontWeight: 900 }}>
                        OFFICIAL PLACEMENT GD VERDICT • COMMITTEE ARCHIVE
                      </span>
                      <span style={{ fontSize: 12, color: C.textMuted }}>Duration: {formatTimer(secondsElapsed)}</span>
                    </div>
                    <h2 style={{ fontSize: 22, fontWeight: 900, color: C.textPrimary, margin: "0 0 4px" }}>
                      Hiring Committee GD Assessment Report
                    </h2>
                    <div style={{ fontSize: 12, color: C.textSecondary }}>
                      Topic: <strong style={{ color: C.textPrimary }}>{activeTopic}</strong> • Format: <strong>{format.toUpperCase()}</strong> • Difficulty: <strong>{difficulty.toUpperCase()}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowReportModal(false)}
                    style={{
                      background: isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9",
                      border: `1px solid ${C.borderLight}`,
                      borderRadius: 10,
                      color: C.textPrimary,
                      padding: "6px 12px",
                      cursor: "pointer",
                      fontWeight: 800,
                      fontSize: 13
                    }}
                  >
                    ✕ Close
                  </button>
                </div>

                {/* Score & Verdict Banner */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))",
                    gap: 16,
                    background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(16,185,129,0.08))",
                    border: "1px solid rgba(99,102,241,0.25)",
                    borderRadius: 18,
                    padding: "1.5rem",
                    marginBottom: "1.5rem"
                  }}
                >
                  <div>
                    <div style={{ fontSize: 11, color: "#10b981", fontWeight: 800, letterSpacing: 1, marginBottom: 4 }}>
                      PLACEMENT COMMITTEE RECOMMENDATION
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: C.textPrimary, marginBottom: 6 }}>
                      {evaluationReport.hiringVerdict.replace(/_/g, " ")}
                    </div>
                    <p style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.5, margin: 0 }}>
                      {evaluationReport.verdictSummary}
                    </p>
                  </div>

                  <div
                    style={{
                      background: isDark ? "rgba(0,0,0,0.35)" : "#FFFFFF",
                      borderRadius: 14,
                      padding: "1rem",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      border: `1px solid ${C.borderLight}`
                    }}
                  >
                    <div style={{ fontSize: 10, color: C.textMuted, textTransform: "uppercase", letterSpacing: 1 }}>Composite Score</div>
                    <div style={{ fontSize: 40, fontWeight: 900, color: "#10b981", lineHeight: 1, margin: "6px 0" }}>
                      {evaluationReport.overallScore}<span style={{ fontSize: 16, color: C.textMuted }}>/100</span>
                    </div>
                    <span style={{ fontSize: 11, color: "#6366f1", fontWeight: 700 }}>
                      Floor Share: {evaluationReport.speakingTimeAnalysis.speakingPercentage}% ({evaluationReport.speakingTimeAnalysis.studentTurnCount} spoken turns)
                    </span>
                  </div>
                </div>

                {/* 8 Assessment Dimensions Grid */}
                <div style={{ marginBottom: "1.75rem" }}>
                  <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 800, letterSpacing: 1, marginBottom: 10, textTransform: "uppercase" }}>
                    8-Dimension Evaluated Competency Breakdown
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                    {evaluationReport.dimensions.map((dim, i) => (
                      <div
                        key={i}
                        style={{
                          padding: "0.9rem 1rem",
                          background: isDark ? "rgba(255,255,255,0.02)" : "#F8FAFC",
                          border: `1px solid ${C.borderLight}`,
                          borderRadius: 12
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                          <div style={{ fontSize: 12, fontWeight: 800, color: C.textPrimary }}>{dim.label}</div>
                          <div style={{ fontSize: 14, fontWeight: 900, color: dim.score >= 75 ? "#10b981" : dim.score >= 50 ? "#f59e0b" : "#ef4444" }}>
                            {dim.score}<span style={{ fontSize: 10, color: C.textMuted }}>/100</span>
                          </div>
                        </div>
                        <div style={{ fontSize: 11, color: C.textSecondary, lineHeight: 1.35, marginBottom: dim.citedExcerpts.length ? 6 : 0 }}>
                          {dim.feedback}
                        </div>
                        {dim.citedExcerpts.length > 0 && (
                          <div style={{ fontSize: 10, color: "#6366f1", fontStyle: "italic", background: "rgba(99,102,241,0.08)", padding: "4px 8px", borderRadius: 6 }}>
                            &quot;{dim.citedExcerpts[0].quote.substring(0, 95)}...&quot;
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Candidate Spoken Quotes & AI Evaluator Feedback */}
                <div style={{ marginBottom: "1.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                    <div style={{ fontSize: 11, color: C.textMuted, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase" }}>
                      Candidate Intervention Analysis ({evaluationReport.speakingTimeAnalysis.studentTurnCount} Spoken Turns)
                    </div>
                    {reportDnaSynced !== null && (
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "3px 8px",
                          borderRadius: 6,
                          background: reportDnaSynced ? "rgba(16,185,129,0.14)" : "rgba(245,158,11,0.14)",
                          color: reportDnaSynced ? "#10b981" : "#f59e0b"
                        }}
                      >
                        {reportDnaSynced ? "Verified & Synced to Student DNA" : "Not synced to Student DNA (Insufficient turns)"}
                      </span>
                    )}
                  </div>
                  {candidateInterventions.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {candidateInterventions.map((ci, idx) => {
                        const matchedWeak = evaluationReport.weakestContributions.find(
                          (w) => w.quote && ci.content && w.quote.slice(0, 40) === ci.content.slice(0, 40)
                        ) || (idx === candidateInterventions.length - 1 ? evaluationReport.weakestContributions[0] : undefined);
                        const matchedStrong = evaluationReport.strongestContributions.find(
                          (s) => s.quote && ci.content && s.quote.slice(0, 40) === ci.content.slice(0, 40)
                        );
                        return (
                          <div
                            key={idx}
                            style={{
                              padding: "0.9rem 1.15rem",
                              background: "rgba(99,102,241,0.06)",
                              border: "1px solid rgba(99,102,241,0.2)",
                              borderRadius: 14
                            }}
                          >
                            <div style={{ fontSize: 11, color: "#6366f1", fontWeight: 700, marginBottom: 2 }}>
                              Your Spoken Statement #{idx + 1}:
                            </div>
                            <div style={{ fontSize: 12, color: C.textPrimary, fontStyle: "italic", marginBottom: 6 }}>
                              &quot;{ci.content}&quot;
                            </div>
                            {matchedStrong && (
                              <div style={{ fontSize: 11, color: "#10b981", background: isDark ? "rgba(0,0,0,0.3)" : "#FFFFFF", padding: "6px 10px", borderRadius: 8, marginBottom: matchedWeak ? 6 : 0 }}>
                                <strong>Strength: </strong>
                                {matchedStrong.whyStrong}
                              </div>
                            )}
                            {matchedWeak?.recruiterRewrite && (
                              <div style={{ fontSize: 11, color: "#818cf8", background: isDark ? "rgba(0,0,0,0.3)" : "#FFFFFF", padding: "6px 10px", borderRadius: 8 }}>
                                <strong>Elevated Reframe: </strong>
                                &quot;{matchedWeak.recruiterRewrite}&quot;
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div style={{ padding: "1.25rem", background: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC", borderRadius: 14, fontSize: 12, color: C.textSecondary }}>
                      No interventions recorded during this session. In your next round, unmute your mic or click Quick Points to register your contributions!
                    </div>
                  )}
                </div>

                {/* Action CTAs */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, borderTop: `1px solid ${C.borderLight}`, paddingTop: "1.25rem" }}>
                  <button
                    onClick={() => window.print()}
                    style={{
                      padding: "10px 18px",
                      borderRadius: 10,
                      background: isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9",
                      border: `1px solid ${C.borderLight}`,
                      color: C.textPrimary,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    📄 Print Scorecard
                  </button>

                  <button
                    onClick={() => {
                      setShowReportModal(false);
                      setStarted(false);
                    }}
                    style={{
                      padding: "10px 20px",
                      borderRadius: 10,
                      background: "linear-gradient(135deg, #4f46e5, #7c3aed)",
                      border: "none",
                      color: "white",
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer"
                    }}
                  >
                    Practice Another Topic 🚀
                  </button>

                  <button
                    onClick={() => {
                      cleanupSession();
                      router.push("/student");
                    }}
                    style={{
                      padding: "10px 20px",
                      borderRadius: 10,
                      background: "linear-gradient(135deg, #10b981, #059669)",
                      border: "none",
                      color: "white",
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: "pointer"
                    }}
                  >
                    Go to Dashboard ➔
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "2rem" }}>
                <p style={{ color: C.textPrimary, fontSize: 14, marginBottom: 12 }}>
                  {reportError || "Report generation failed or was cancelled."}
                </p>
                <button onClick={() => setShowReportModal(false)} style={{ padding: "8px 16px", borderRadius: 8, background: "#6366f1", color: "white", border: "none", cursor: "pointer" }}>Close</button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
}

export default function StudentGDPracticePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#070E1A", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading GD Arena...</div>}>
      <GDPracticeContent />
    </Suspense>
  );
}
