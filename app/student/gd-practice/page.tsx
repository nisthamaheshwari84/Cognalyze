"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface GDMessage {
  speaker: string;
  avatar: string;
  role: string;
  content: string;
  time: string;
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

const TOPICS_BY_CATEGORY: Record<string, GDTopic[]> = {
  "ai": [
    {
      title: "Autonomous AI Coding Agents vs Junior Software Engineers: Redefining Campus Hiring in 2026",
      context: "AI generates 80% of boilerplate code; top recruiters now evaluate system architecture over LeetCode syntax.",
      category: "AI & Autonomous Agents",
      key_perspectives: ["Junior devs become obsolete", "Junior devs become high-leverage systems architects"]
    },
    {
      title: "Agentic Autonomous Workflows vs Human-in-the-Loop for Mission-Critical Production Systems",
      context: "Deploying multi-agent reasoning for automated production deployments introduces severe hallucination and downtime risks.",
      category: "AI & Autonomous Agents",
      key_perspectives: ["Fully autonomous pipelines maximize shipping velocity", "Strict human sign-off gates prevent catastrophic data loss"]
    },
    {
      title: "Open-Source LLMs vs Closed Proprietary APIs (OpenAI, Anthropic): Enterprise Dominance in 2026",
      context: "Enterprises balance strict IP data sovereignty and self-hosting infra costs against frontier model reasoning power.",
      category: "AI & Autonomous Agents",
      key_perspectives: ["Fine-tuned open weights guarantee total data privacy", "Frontier proprietary models outperform on complex edge-cases"]
    }
  ],
  "arch": [
    {
      title: "Should early-stage startups build Monoliths or Microservices for high concurrency?",
      context: "Balancing rapid feature shipping velocity against distributed network latency and operational telemetry complexity.",
      category: "System Architecture & Scalability",
      key_perspectives: ["Speed and simplicity favor modular monoliths", "Decoupled team ownership favors independent microservices"]
    },
    {
      title: "Serverless Edge Functions vs Dedicated Kubernetes Clusters: The Cost-to-Performance Inflection Point",
      context: "Cold-start latency and egress bill shocks challenge the serverless paradigm for high-volume, data-heavy workloads.",
      category: "System Architecture & Scalability",
      key_perspectives: ["Serverless scales to zero effortlessly with zero ops", "Kubernetes guarantees predictable unit economics at scale"]
    },
    {
      title: "ACID Strict Consistency vs Eventual Consistency for High-Throughput Fintech Payment Ledgers",
      context: "Handling tens of thousands of concurrent transactions while mathematically guaranteeing zero double-spend anomalies.",
      category: "System Architecture & Scalability",
      key_perspectives: ["ACID transactions ensure non-negotiable financial correctness", "Eventual consistency unlocks sub-millisecond p99 latency"]
    }
  ],
  "fintech": [
    {
      title: "Real-Time Payment Security: Instant UPI Settlement vs Zero-Day Fraud Prevention",
      context: "Sub-second payment convenience introduces major vulnerability windows for social engineering & bot attacks.",
      category: "FinTech, UPI & Security",
      key_perspectives: ["Frictionless velocity drives mass merchant adoption", "Mandatory delay buffers protect consumer capital"]
    },
    {
      title: "Central Bank Digital Currencies (CBDC / e-Rupee) vs Commercial UPI Apps: Financial Inclusion or Surveillance?",
      context: "Sovereign programmable money threatens the fee-free convenience of private fintech payment rails.",
      category: "FinTech, UPI & Security",
      key_perspectives: ["Sovereign security and offline settlements empower rural economy", "State overreach and transaction censorship risks"]
    },
    {
      title: "Zero-Trust Architecture vs Developer Velocity in High-Security Engineering Organizations",
      context: "Strict IAM perimeter verification and ephemeral credentials slow down deployment velocity across fast-paced teams.",
      category: "FinTech, UPI & Security",
      key_perspectives: ["Zero-trust is non-negotiable post-breach in fintech", "Excessive friction forces developers into insecure shadow IT"]
    }
  ],
  "hiring": [
    {
      title: "Remote Engineering vs In-Office Collaboration: The Real Impact on Junior Mentorship",
      context: "Remote work grants global autonomy but senior developer code pairing and ambient learning take a hit.",
      category: "Campus Placement & Career Trends",
      key_perspectives: ["Asynchronous documentation and deep work win", "Physical whiteboarding accelerates breakthroughs and career growth"]
    },
    {
      title: "LeetCode Grind vs Production Project Portfolios: Which Better Predicts Day-1 FAANG Engineering Output?",
      context: "Algorithmic trick questions fail to test real-world debugging, code reviews, and distributed system trade-offs.",
      category: "Campus Placement & Career Trends",
      key_perspectives: ["Data structures test fundamental problem-solving IQ", "Full-stack shipping proves real-world engineering readiness"]
    },
    {
      title: "Generalist Product Engineers vs Hyper-Specialized ML/Infra Engineers: Campus Hiring Demand in 2026",
      context: "Startups need agile generalists who ship end-to-end, while Big Tech pays premiums for deep systems specialists.",
      category: "Campus Placement & Career Trends",
      key_perspectives: ["Full-stack generalists adapt to any tech shift", "Specialists solve the 1% hardest scaling bottlenecks"]
    }
  ],
  "web3": [
    {
      title: "Public Blockchains vs Centralized Cloud Ledgers for Real-World Asset (RWA) Tokenization",
      context: "Institutional finance demands compliance, finality guarantees, and dispute resolution.",
      category: "Web3 & Open Source Ecosystem",
      key_perspectives: ["Permissionless composability unlocks global liquidity", "Centralized ledgers offer legal recourse and zero gas fees"]
    },
    {
      title: "Open Source Sustainability: Venture-Backed BSL Licensing vs Pure Apache/MIT Permissive Commons",
      context: "Redis, Elastic, and Terraform moving away from open source to prevent cloud provider parasitism.",
      category: "Web3 & Open Source Ecosystem",
      key_perspectives: ["Creators deserve revenue protection against cloud hyperscalers", "Restrictive licenses break open-source community trust"]
    }
  ],
  "ethics": [
    {
      title: "Algorithmic Transparency vs Trade Secrets: Should AI Models in Hiring & Lending Be Auditable?",
      context: "Deep neural networks make automated life-altering decisions without explainable human reasoning.",
      category: "Corporate Tech Ethics & Privacy",
      key_perspectives: ["Mandatory auditability prevents systemic demographic bias", "Forced disclosure leaks sensitive IP to foreign competitors"]
    },
    {
      title: "Big Tech Monopolies & Platform Lock-in: App Store Taxes vs Mandatory Sideloading Legislation",
      context: "Walled gardens ensure platform security and curation, but extract 30% tolls from developers.",
      category: "Corporate Tech Ethics & Privacy",
      key_perspectives: ["Curated walled gardens protect ordinary consumers from malware", "Open sideloading stimulates competitive startup pricing"]
    }
  ]
};

export default function StudentGDPracticePage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("ai");
  const [topicsByCategory, setTopicsByCategory] = useState<Record<string, GDTopic[]>>(TOPICS_BY_CATEGORY);
  const [selectedTopic, setSelectedTopic] = useState<string>(TOPICS_BY_CATEGORY["ai"][0].title);
  const [customTopicInput, setCustomTopicInput] = useState<string>("");
  const [generatingTopics, setGeneratingTopics] = useState(false);
  const [generationNotice, setGenerationNotice] = useState<string | null>(null);

  // Discussion state
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<GDMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<string | null>(null);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>("");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Real Meeting States
  const [autoFlow, setAutoFlow] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [handRaised, setHandRaised] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [coaching, setCoaching] = useState<any>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileTab, setMobileTab] = useState<"stage" | "transcript">("stage");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Speech Recognition & Timers
  const [speechSupported, setSpeechSupported] = useState(false);
  const [interimSpoken, setInterimSpoken] = useState("");
  const recognitionRef = useRef<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const autoTurnTimeoutRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<any>(null);
  const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const heartbeatIntervalRef = useRef<any>(null);
  const lastSpeechEndTimeRef = useRef<number>(Date.now());

  // References to bypass stale closures in automated turn intervals
  const messagesRef = useRef<GDMessage[]>(messages);
  messagesRef.current = messages;

  const autoFlowRef = useRef(autoFlow);
  autoFlowRef.current = autoFlow;

  const loadingRef = useRef(loading);
  loadingRef.current = loading;

  const micActiveRef = useRef(micActive);
  micActiveRef.current = micActive;

  const activeSpeakerRef = useRef(activeSpeaker);
  activeSpeakerRef.current = activeSpeaker;

  const startedRef = useRef(started);
  startedRef.current = started;

  const activeTopic = customTopicInput.trim() || selectedTopic;

  // Groq AI dynamic topic synthesizer
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
        setGenerationNotice(`✨ Successfully synthesized 4 fresh topics for "${activeCatObj?.name}" using Groq AI!`);
        setTimeout(() => setGenerationNotice(null), 4500);
      }
    } catch (err) {
      console.error("Failed to generate topics:", err);
    } finally {
      setGeneratingTopics(false);
    }
  };

  // Cleanup all audio, media, and timers immediately (Used when exiting page or completing GD)
  const cleanupSession = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
        window.speechSynthesis.pause();
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

  // Cleanup on unmount so agent NEVER continues talking after page navigation!
  useEffect(() => {
    return () => {
      cleanupSession();
    };
  }, [cleanupSession]);

  // Responsive sidebar: auto-adjust based on screen width
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (window.innerWidth < 1180) {
        setSidebarOpen(false);
      }
    }
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        setSpeechSupported(true);
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          let current = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            current += event.results[i][0].transcript;
          }
          setInterimSpoken(current);
          setInput(current);

          // Student is actively speaking: immediately interrupt AI peer and stop auto turn timer!
          if (autoTurnTimeoutRef.current) {
            clearTimeout(autoTurnTimeoutRef.current);
          }
          if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
          }

          // Hands-free auto-submission: If user pauses speaking for 1.8s, submit their speech autonomously!
          if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = setTimeout(() => {
            if (current.trim().length > 3) {
              handleStudentIntervention(current);
            }
          }, 1800);
        };

        recognition.onerror = () => {
          setMicActive(false);
        };
        recognition.onend = () => {
          setMicActive(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  // Timer for GD session
  useEffect(() => {
    let interval: any = null;
    if (started) {
      interval = setInterval(() => {
        setSecondsElapsed(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [started]);

  // Auto-scroll chat transcript to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, currentSubtitle]);

  // Handle webcam
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (cameraActive && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        .then(s => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
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

  // Voice Synthesis (TTS) with Autonomous Hand-off & Watchdog
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

    // Fallback simulation if muted or Web Speech API is absent
    if (!soundEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) {
      const estimatedMs = Math.min(8000, Math.max(2500, text.split(" ").length * 280));
      setTimeout(markDone, estimatedMs);
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;

      if (speaker.includes("Rohan")) {
        utterance.pitch = 0.88;
        utterance.rate = 1.08;
      } else if (speaker.includes("Priya")) {
        utterance.pitch = 1.25;
        utterance.rate = 1.02;
      } else if (speaker.includes("Karan")) {
        utterance.pitch = 0.82;
        utterance.rate = 0.98;
      } else {
        utterance.pitch = 1.0;
        utterance.rate = 1.0;
      }

      utterance.onend = () => markDone();
      utterance.onerror = () => markDone();

      // Guard with watchdog timer (in case browser Web Speech drops onend)
      const wordCount = text.split(" ").length;
      const maxSpeechDurationMs = Math.max(2800, Math.min(16000, (wordCount / 2.5) * 1000 + 1200));
      watchdogTimer = setTimeout(markDone, maxSpeechDurationMs);

      activeUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
      markDone();
    }
  }, [soundEnabled]);

  // Schedule next automated turn
  const scheduleNextTurn = useCallback(() => {
    if (autoTurnTimeoutRef.current) {
      clearTimeout(autoTurnTimeoutRef.current);
    }

    if (!autoFlowRef.current || !startedRef.current) return;

    // Fast, natural human GD cadence between peer retorts (1.2s - 1.6s)
    const pauseMs = 1400;
    autoTurnTimeoutRef.current = setTimeout(() => {
      triggerPeerTurn();
    }, pauseMs);
  }, []);

  // Continuous Debate Liveness Heartbeat: Prevents dead silence under any circumstance
  useEffect(() => {
    if (!started || !autoFlow) return;

    const interval = setInterval(() => {
      const now = Date.now();
      // If nobody is speaking, user is not typing or mic active, not loading, and silence > 2000ms:
      if (
        !loadingRef.current &&
        !micActiveRef.current &&
        !activeSpeakerRef.current &&
        now - lastSpeechEndTimeRef.current > 2000
      ) {
        triggerPeerTurn();
      }
    }, 1500);

    heartbeatIntervalRef.current = interval;
    return () => clearInterval(interval);
  }, [started, autoFlow]);

  // Trigger Peer Turn via backend with self-healing fallback
  const triggerPeerTurn = async () => {
    if (loadingRef.current || !startedRef.current) return;
    setLoading(true);
    loadingRef.current = true;

    try {
      const res = await fetch("/api/student/gd-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: activeTopic,
          messages: messagesRef.current.slice(-8)
        })
      });

      const data = await res.json();

      if (data.next_speaker) {
        const peerMsg: GDMessage = {
          speaker: data.next_speaker.name,
          avatar: data.next_speaker.avatar || "💬",
          role: data.next_speaker.role || "Peer",
          content: data.next_speaker.spoken_text,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };

        setMessages(prev => {
          const updated = [...prev, peerMsg];
          messagesRef.current = updated;
          return updated;
        });

        // Speak aloud, and immediately chain the next peer turn when done!
        speakVoice(peerMsg.content, peerMsg.speaker, () => {
          scheduleNextTurn();
        });
      } else {
        // Fallback next speaker to prevent silence
        const fallbackMsg: GDMessage = {
          speaker: "Priya",
          avatar: "🎯",
          role: "Product & Velocity Lead",
          content: "Looking at user retention and market speed, an engineering solution is only as valuable as the business leverage it unlocks.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };
        setMessages(prev => {
          const updated = [...prev, fallbackMsg];
          messagesRef.current = updated;
          return updated;
        });
        speakVoice(fallbackMsg.content, fallbackMsg.speaker, () => scheduleNextTurn());
      }
    } catch (err) {
      console.error("GD turn error:", err);
      // Auto-recovering peer debate retorts
      const fallbackList = [
        { speaker: "Rohan", avatar: "⚡", role: "The Tech Purist", content: "Priya's product timeline sounds ambitious, but without benchmarking our p99 database latency under peak load, this architecture will collapse in production." },
        { speaker: "Priya", avatar: "🎯", role: "Product & Velocity Lead", content: "Rohan, premature optimization kills early-stage momentum. If we take six months perfecting infrastructure while competitors ship, we won't have users left to scale for." },
        { speaker: "Karan", avatar: "💡", role: "Contrarian Risk Analyst", content: "Both of you are ignoring the supply-chain security surface. If third-party package dependencies aren't verified with zero-trust checks, an exploit compromises the entire cluster." },
        { speaker: "Moderator Alex", avatar: "🎙️", role: "Discussion Director", content: "We're seeing a clear clash between infrastructure durability, business speed, and security compliance. Let's hear how other candidates reconcile this dilemma." }
      ];
      const pick = fallbackList[Math.floor(Math.random() * fallbackList.length)];
      const fallbackMsg: GDMessage = {
        speaker: pick.speaker,
        avatar: pick.avatar,
        role: pick.role,
        content: pick.content,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages(prev => {
        const updated = [...prev, fallbackMsg];
        messagesRef.current = updated;
        return updated;
      });
      speakVoice(fallbackMsg.content, fallbackMsg.speaker, () => scheduleNextTurn());
    } finally {
      setLoading(false);
      loadingRef.current = false;
      lastSpeechEndTimeRef.current = Date.now();
    }
  };

  // Start Discussion
  const startGD = async () => {
    setStarted(true);
    setAutoFlow(true);
    autoFlowRef.current = true;
    setLoading(true);
    setSecondsElapsed(0);
    lastSpeechEndTimeRef.current = Date.now();

    const initialPlaceholder: GDMessage = {
      speaker: "Moderator Alex",
      avatar: "🎙️",
      role: "Discussion Director",
      content: `Connecting you to the live GD panel on: "${activeTopic}"...`,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    setMessages([initialPlaceholder]);

    try {
      const res = await fetch("/api/student/gd-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start_discussion",
          topic: activeTopic
        })
      });

      const data = await res.json();
      const modMsg: GDMessage = {
        speaker: data.moderator_intro?.speaker || "Moderator Alex",
        avatar: data.moderator_intro?.avatar || "🎙️",
        role: data.moderator_intro?.role || "Discussion Director",
        content: data.moderator_intro?.content || `Welcome candidates. Today's topic is: "${activeTopic}". The floor is open for structured technical perspectives.`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      const peerMsg: GDMessage = {
        speaker: data.opening_speaker?.speaker || "Rohan",
        avatar: data.opening_speaker?.avatar || "⚡",
        role: data.opening_speaker?.role || "The Tech Purist",
        content: data.opening_speaker?.content || `To kick off on "${activeTopic}", we must analyze the real-world operational trade-offs rather than generic theoretical models.`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };

      const initialList = [modMsg, peerMsg];
      setMessages(initialList);
      messagesRef.current = initialList;

      // Speak opening peer and automatically chain the discussion!
      speakVoice(peerMsg.content, peerMsg.speaker, () => {
        scheduleNextTurn();
      });
    } catch (err) {
      console.error("Failed to start GD:", err);
    } finally {
      setLoading(false);
    }
  };

  // Student Speaks / Intervenes
  const handleStudentIntervention = async (spokenText?: string) => {
    const text = (spokenText || input || interimSpoken).trim();
    if (!text || loading) return;

    if (autoTurnTimeoutRef.current) {
      clearTimeout(autoTurnTimeoutRef.current);
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
    }

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    const userMsg: GDMessage = {
      speaker: "You",
      avatar: "🎓",
      role: "Candidate (You)",
      content: text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };

    const updated = [...messages, userMsg];
    setMessages(updated);
    messagesRef.current = updated;
    setInput("");
    setInterimSpoken("");
    setHandRaised(false);
    setLoading(true);
    loadingRef.current = true;

    setActiveSpeaker("You");
    activeSpeakerRef.current = "You";
    setCurrentSubtitle(`You: "${text}"`);

    try {
      const res = await fetch("/api/student/gd-turn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: activeTopic,
          messages: updated.slice(-8),
          studentIntervention: text
        })
      });

      const data = await res.json();

      if (data.next_speaker) {
        const peerMsg: GDMessage = {
          speaker: data.next_speaker.name,
          avatar: data.next_speaker.avatar || "💬",
          role: data.next_speaker.role || "Peer",
          content: data.next_speaker.spoken_text,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        };

        setMessages(prev => {
          const u = [...prev, peerMsg];
          messagesRef.current = u;
          return u;
        });

        // Seamless handoff: Peer counters/responds and autonomously triggers the chain of peer turns!
        speakVoice(peerMsg.content, peerMsg.speaker, () => {
          scheduleNextTurn();
        });
      }

      if (data.student_coaching) {
        setCoaching(data.student_coaching);
      }
    } catch (err) {
      console.error("Student intervention peer response error:", err);
      // Fallback speaker immediately takes the floor
      const fallbackMsg: GDMessage = {
        speaker: "Rohan",
        avatar: "⚡",
        role: "The Tech Purist",
        content: "That point hits the core dilemma. But Priya, your product velocity plan doesn't account for how distributed locks degrade when candidate's scenario occurs.",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      };
      setMessages(prev => {
        const u = [...prev, fallbackMsg];
        messagesRef.current = u;
        return u;
      });
      speakVoice(fallbackMsg.content, fallbackMsg.speaker, () => {
        scheduleNextTurn();
      });
    } finally {
      setLoading(false);
      loadingRef.current = false;
      lastSpeechEndTimeRef.current = Date.now();
    }
  };

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. You can type your points in the input box or click Quick Counter chips.");
      return;
    }

    if (micActive) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      setMicActive(false);
      micActiveRef.current = false;
      if (interimSpoken.trim()) {
        handleStudentIntervention(interimSpoken);
      }
    } else {
      setInterimSpoken("");
      try {
        recognitionRef.current.start();
        setMicActive(true);
        micActiveRef.current = true;
      } catch (err) {
        console.error(err);
      }
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const getDiscussionPhase = (seconds: number) => {
    if (seconds < 90) return "Phase 1: Opening Framing";
    if (seconds < 480) return "Phase 2: Free Debate";
    return "Phase 3: Group Synthesis";
  };

  const finishAndShowReport = () => {
    cleanupSession();
    setShowReportModal(true);
  };

  const candidateInterventions = messages.filter(m => m.speaker === "You");

  const quickJumpIns = [
    { label: "⚡ Latency Risk", text: "I'd like to challenge the scalability premise here. If we optimize prematurely without empirical p99 latency benchmarks, we risk architectural bloat." },
    { label: "🎯 Delivery Velocity", text: "From a delivery timeline and TAM perspective, shipping a reliable v1 in 6 weeks creates far more business leverage than debating hypothetical scale." },
    { label: "🛡️ Attack Surface", text: "We have to consider the zero-day threat surface. Introducing distributed network hops expands our vulnerability surface exponentially." },
    { label: "⚖️ Propose Hybrid", text: "Let's synthesize the technical constraint with the business urgency: starting modular before breaking into independent microservices solves both trade-offs." }
  ];

  return (
    <div style={{ height: "100vh", maxHeight: "100vh", width: "100vw", maxWidth: "100vw", background: "#060312", color: "#f3f4f6", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", display: "flex", flexDirection: "column", overflow: "hidden", boxSizing: "border-box" }}>
      
      {/* Global Embedded Keyframes for Speaker Equalizer Waveforms */}
      <style>{`
        @keyframes eqPulseA {
          0%, 100% { height: 4px; }
          50% { height: 16px; }
        }
        @keyframes eqPulseB {
          0%, 100% { height: 14px; }
          50% { height: 6px; }
        }
        @keyframes eqPulseC {
          0%, 100% { height: 8px; }
          50% { height: 18px; }
        }
        @keyframes activeSpeakerGlow {
          0%, 100% { box-shadow: 0 0 15px rgba(99, 102, 241, 0.4); border-color: #818cf8; }
          50% { box-shadow: 0 0 30px rgba(99, 102, 241, 0.8); border-color: #c084fc; }
        }
      `}</style>

      {/* ── TOP NAV / MEETING BAR ── */}
      <header style={{ height: 50, flexShrink: 0, padding: "0 1rem", borderBottom: "1px solid rgba(255,255,255,0.08)", background: "rgba(6,3,18,0.95)", backdropFilter: "blur(20px)", display: "flex", alignItems: "center", justifyContent: "space-between", zIndex: 50, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: 1, marginRight: 10 }}>
          <button
            onClick={() => {
              cleanupSession();
              router.push("/student");
            }}
            style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", background: "rgba(255,255,255,0.04)", padding: "4px 8px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.08)", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0 }}
          >
            ← Exit GD Room
          </button>

          {started && (
            <button
              onClick={() => {
                cleanupSession();
                setStarted(false);
              }}
              style={{ fontSize: 11, color: "#818cf8", background: "rgba(99,102,241,0.12)", padding: "4px 8px", borderRadius: 6, border: "1px solid rgba(99,102,241,0.3)", cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0, fontWeight: 700 }}
              title="Return to topic lounge to choose or generate a different topic"
            >
              🔄 Change Topic
            </button>
          )}

          <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)", flexShrink: 0 }} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "nowrap" }}>
              <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: started ? "#22c55e" : "#eab308", boxShadow: started ? "0 0 8px #22c55e" : "none", flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 900, color: "white", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                CAMPUS GD ARENA
              </span>
              <span style={{ fontSize: 9, padding: "1px 5px", borderRadius: 4, background: "rgba(99,102,241,0.2)", color: "#a5b4fc", fontWeight: 800, whiteSpace: "nowrap", flexShrink: 0 }}>
                FAANG PANEL
              </span>
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              Topic: <strong>{activeTopic}</strong>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
          {started && (
            <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "3px 8px", background: "rgba(0,0,0,0.4)", borderRadius: 6, border: "1px solid rgba(255,255,255,0.1)" }}>
              <span style={{ fontSize: 10 }}>⏱️</span>
              <span style={{ fontSize: 11, fontWeight: 900, color: "#fbbf24", fontVariantNumeric: "tabular-nums" }}>
                {formatTimer(secondsElapsed)}
              </span>
            </div>
          )}

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            style={{ fontSize: 10, padding: "4px 8px", borderRadius: 6, background: soundEnabled ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)", border: soundEnabled ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(255,255,255,0.1)", color: soundEnabled ? "#34d399" : "rgba(255,255,255,0.4)", cursor: "pointer", fontWeight: 700, whiteSpace: "nowrap" }}
          >
            {soundEnabled ? "🔊 Voice On" : "🔇 Muted"}
          </button>

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
              fontSize: 10,
              padding: "4px 9px",
              borderRadius: 6,
              background: autoFlow ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.15)",
              border: autoFlow ? "1px solid #34d399" : "1px solid rgba(239,68,68,0.3)",
              color: autoFlow ? "#34d399" : "#fca5a5",
              cursor: "pointer",
              fontWeight: 800,
              whiteSpace: "nowrap",
              boxShadow: autoFlow ? "0 0 10px rgba(52,211,153,0.3)" : "none"
            }}
            title="When active, AI peers debate continuously without requiring you to click buttons!"
          >
            {autoFlow ? "⚡ Auto-Debate: ON" : "⏸️ Auto: Paused (Click to Resume)"}
          </button>

          {started && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{ fontSize: 10, padding: "4px 8px", borderRadius: 6, background: sidebarOpen ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.05)", border: sidebarOpen ? "1px solid rgba(52,211,153,0.3)" : "1px solid rgba(255,255,255,0.1)", color: sidebarOpen ? "#34d399" : "rgba(255,255,255,0.6)", cursor: "pointer", fontWeight: 700, whiteSpace: "nowrap" }}
            >
              📊 {sidebarOpen ? "Hide Coach" : "Show Coach"}
            </button>
          )}

          {started && (
            <button
              onClick={finishAndShowReport}
              style={{ fontSize: 10, padding: "4px 10px", borderRadius: 6, background: "linear-gradient(135deg,#e11d48,#be123c)", border: "none", color: "white", cursor: "pointer", fontWeight: 800, whiteSpace: "nowrap", boxShadow: "0 0 10px rgba(225,29,72,0.4)" }}
            >
              🏁 End & View Report
            </button>
          )}
        </div>
      </header>

      {/* ── PRE-FLIGHT TOPIC SELECTOR WITH CATEGORIES & AI GENERATOR ── */}
      {!started ? (
        <div style={{ flex: 1, overflowY: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
          <div style={{ maxWidth: 880, width: "100%", padding: "2rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, boxShadow: "0 25px 50px -12px rgba(0,0,0,0.8)" }}>
            
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12, marginBottom: "1.25rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 24 }}>🎙️</span>
                  <h1 style={{ fontSize: 22, fontWeight: 900, margin: 0, color: "white" }}>
                    Campus Placement Group Discussion Arena
                  </h1>
                </div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5, margin: 0 }}>
                  Select a categorized debate domain or trigger Groq AI to synthesize fresh controversial dilemmas from Tier-1 placement rounds.
                </p>
              </div>

              {/* AI Dynamic Generator Button */}
              <button
                onClick={handleGenerateAITopics}
                disabled={generatingTopics}
                style={{
                  padding: "8px 14px",
                  borderRadius: 10,
                  background: "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(168,85,247,0.3))",
                  border: "1px solid rgba(168,85,247,0.5)",
                  color: "#e0e7ff",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: generatingTopics ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  boxShadow: "0 0 15px rgba(168,85,247,0.25)",
                  transition: "all 0.2s ease"
                }}
              >
                <span>{generatingTopics ? "⏳" : "✨"}</span>
                <span>{generatingTopics ? "Synthesizing with Groq AI..." : "Generate Fresh Topics with AI"}</span>
              </button>
            </div>

            {/* Generation Success Notice */}
            {generationNotice && (
              <div style={{ padding: "8px 12px", borderRadius: 8, background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.3)", color: "#86efac", fontSize: 12, fontWeight: 700, marginBottom: "1rem", display: "flex", alignItems: "center", gap: 6 }}>
                <span>✓</span>
                <span>{generationNotice}</span>
              </div>
            )}

            {/* Category Filter Chips */}
            <div style={{ marginBottom: "1.25rem" }}>
              <label style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 8 }}>
                Select Domain Category
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
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
                        padding: "6px 12px",
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: "pointer",
                        border: isSelected ? "1px solid #818cf8" : "1px solid rgba(255,255,255,0.08)",
                        background: isSelected ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.03)",
                        color: isSelected ? "#e0e7ff" : "rgba(255,255,255,0.7)",
                        transition: "all 0.15s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: 6
                      }}
                    >
                      <span>{cat.label}</span>
                      <span style={{ fontSize: 10, padding: "1px 5px", borderRadius: 4, background: isSelected ? "rgba(129,140,248,0.3)" : "rgba(255,255,255,0.06)", color: isSelected ? "white" : "rgba(255,255,255,0.4)" }}>
                        {catTopics.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Topics List for Selected Category */}
            <div style={{ marginBottom: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <label style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5, display: "block" }}>
                  Hot Discussion Topics in {GD_CATEGORIES.find(c => c.id === selectedCategory)?.name}
                </label>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                  Click to select
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflowY: "auto", paddingRight: 4 }}>
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
                        padding: "0.85rem 1rem",
                        borderRadius: 12,
                        border: isSelected ? "1px solid #818cf8" : "1px solid rgba(255,255,255,0.06)",
                        background: isSelected ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.02)",
                        cursor: "pointer",
                        transition: "all 0.15s ease"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                        <div style={{ marginTop: 2, width: 14, height: 14, borderRadius: "50%", border: isSelected ? "4px solid #818cf8" : "2px solid rgba(255,255,255,0.3)", background: isSelected ? "white" : "transparent", flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: isSelected ? "#e0e7ff" : "white", marginBottom: 3 }}>
                            {t.title}
                          </div>
                          {t.context && (
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", lineHeight: 1.3, marginBottom: t.key_perspectives?.length ? 6 : 0 }}>
                              {t.context}
                            </div>
                          )}
                          {t.key_perspectives && t.key_perspectives.length > 0 && (
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                              {t.key_perspectives.map((p, pIdx) => (
                                <span
                                  key={pIdx}
                                  style={{
                                    fontSize: 10,
                                    padding: "2px 7px",
                                    borderRadius: 4,
                                    background: pIdx === 0 ? "rgba(56,189,248,0.1)" : "rgba(244,114,182,0.1)",
                                    color: pIdx === 0 ? "#7dd3fc" : "#f472b6",
                                    border: pIdx === 0 ? "1px solid rgba(56,189,248,0.2)" : "1px solid rgba(244,114,182,0.2)"
                                  }}
                                >
                                  {pIdx === 0 ? "Side A: " : "Side B: "}{p}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Write-In Placement Topic */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.5, display: "block", marginBottom: 6 }}>
                Or Enter Custom Topic from College Placement Drive
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={customTopicInput}
                  onChange={e => setCustomTopicInput(e.target.value)}
                  placeholder="e.g. Real-time sub-second payment settlement vs fraud buffers in FinTech..."
                  style={{ flex: 1, padding: "10px 14px", background: "rgba(0,0,0,0.3)", border: customTopicInput.trim() ? "1px solid #818cf8" : "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "white", fontSize: 12, boxSizing: "border-box" }}
                />
                {customTopicInput.trim() && (
                  <button
                    onClick={() => setCustomTopicInput("")}
                    style={{ padding: "0 12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", borderRadius: 8, fontSize: 11, cursor: "pointer" }}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Launch Meeting Room Button */}
            <button
              onClick={startGD}
              style={{ width: "100%", padding: "1rem", background: "linear-gradient(135deg,#6366f1,#a855f7)", color: "white", border: "none", borderRadius: 12, fontWeight: 900, fontSize: 14, cursor: "pointer", boxShadow: "0 0 30px rgba(99,102,241,0.4)", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <span>🚀 Launch Live Placement Meeting Room (Continuous Auto-Debate)</span>
            </button>
          </div>
        </div>
      ) : (
        /* ── LIVE MEETING ROOM (RESPONSIVE GOOGLE MEET / ZOOM LAYOUT) ── */
        <div style={{ flex: 1, minHeight: 0, minWidth: 0, display: "flex", flexDirection: "column", overflow: "hidden", width: "100%", maxWidth: "100vw", boxSizing: "border-box" }}>
          {/* Mobile Segmented Stage vs. Transcript Switcher */}
          {isMobile && (
            <div style={{ display: "flex", gap: 8, padding: "6px 12px", background: "rgba(15, 23, 42, 0.95)", borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
              <button
                onClick={() => setMobileTab("stage")}
                style={{
                  flex: 1,
                  padding: "7px 10px",
                  borderRadius: 8,
                  border: "none",
                  background: mobileTab === "stage" ? "linear-gradient(135deg, #6366f1, #a855f7)" : "rgba(255,255,255,0.06)",
                  color: "white",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                🎙️ Stage & Floor
              </button>
              <button
                onClick={() => setMobileTab("transcript")}
                style={{
                  flex: 1,
                  padding: "7px 10px",
                  borderRadius: 8,
                  border: "none",
                  background: mobileTab === "transcript" ? "linear-gradient(135deg, #6366f1, #a855f7)" : "rgba(255,255,255,0.06)",
                  color: "white",
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer"
                }}
              >
                💬 Log & Radar
              </button>
            </div>
          )}

          <div style={{
            flex: 1,
            minHeight: 0,
            minWidth: 0,
            display: isMobile ? "flex" : "grid",
            flexDirection: "column",
            gridTemplateColumns: !isMobile ? (sidebarOpen ? "minmax(0, 1fr) minmax(260px, 310px)" : "minmax(0, 1fr)") : undefined,
            gap: "0.6rem",
            padding: isMobile ? "0.4rem" : "0.5rem 0.85rem",
            overflow: "hidden",
            width: "100%",
            maxWidth: "100vw",
            boxSizing: "border-box"
          }}>
          
          {/* Left: Video & Avatar Meeting Grid + Dock */}
          <div style={{ display: (isMobile && mobileTab !== "stage") ? "none" : "flex", flexDirection: "column", gap: "0.45rem", minHeight: 0, minWidth: 0, height: "100%", overflow: "hidden", boxSizing: "border-box" }}>
            
            {/* 5-Participant Video Grid */}
            <div style={{ flex: 1, minHeight: 0, minWidth: 0, display: "grid", gridTemplateColumns: isMobile ? "repeat(2, minmax(0, 1fr))" : "repeat(3, minmax(0, 1fr))", gridTemplateRows: isMobile ? "repeat(3, minmax(0, 1fr))" : "repeat(2, minmax(0, 1fr))", gap: 6, boxSizing: "border-box" }}>
              
              {/* 1. YOU (Candidate) */}
              <div style={{
                background: activeSpeaker === "You" ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.03)",
                border: activeSpeaker === "You" ? "2px solid #818cf8" : handRaised ? "2px solid #fbbf24" : "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                position: "relative",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 0,
                minHeight: 0,
                boxSizing: "border-box",
                boxShadow: activeSpeaker === "You" ? "0 0 20px rgba(99,102,241,0.5)" : "none"
              }}>
                {cameraActive ? (
                  <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ textAlign: "center", padding: "0.5rem", minWidth: 0 }}>
                    <div style={{ fontSize: 32, marginBottom: 2 }}>🎓</div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>You (Candidate)</div>
                    <div style={{ fontSize: 9, color: "#818cf8" }}>Active Contender</div>
                  </div>
                )}

                {/* Tile Bottom Overlay */}
                <div style={{ position: "absolute", bottom: 4, left: 4, right: 4, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.65)", padding: "2px 6px", borderRadius: 6, backdropFilter: "blur(4px)", minWidth: 0 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "white" }}>You</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    {handRaised && <span style={{ fontSize: 10 }}>✋</span>}
                    <span style={{ fontSize: 8, color: micActive ? "#34d399" : "#f87171", fontWeight: 700 }}>
                      {micActive ? "🎤 Speaking" : "🔇 Muted"}
                    </span>
                  </div>
                </div>

                {/* Active Voice Equalizer */}
                {activeSpeaker === "You" && (
                  <div style={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 2, alignItems: "flex-end", height: 14 }}>
                    <span style={{ width: 2, background: "#818cf8", borderRadius: 2, animation: "eqPulseA 0.4s infinite" }} />
                    <span style={{ width: 2, background: "#818cf8", borderRadius: 2, animation: "eqPulseB 0.5s infinite" }} />
                    <span style={{ width: 2, background: "#818cf8", borderRadius: 2, animation: "eqPulseC 0.45s infinite" }} />
                  </div>
                )}
              </div>

              {/* 2. Rohan (Tech Purist) */}
              <div style={{
                background: activeSpeaker === "Rohan" ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.03)",
                border: activeSpeaker === "Rohan" ? "2px solid #38bdf8" : "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 0,
                minHeight: 0,
                boxSizing: "border-box",
                boxShadow: activeSpeaker === "Rohan" ? "0 0 20px rgba(56,189,248,0.5)" : "none"
              }}>
                <div style={{ textAlign: "center", padding: "0.5rem", minWidth: 0 }}>
                  <div style={{ fontSize: 32, marginBottom: 2 }}>⚡</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Rohan</div>
                  <div style={{ fontSize: 9, color: "#38bdf8", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>The Tech Purist • Latency & DB</div>
                </div>

                <div style={{ position: "absolute", bottom: 4, left: 4, right: 4, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.65)", padding: "2px 6px", borderRadius: 6, minWidth: 0 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "white" }}>Rohan (Peer)</span>
                  <span style={{ fontSize: 8, color: activeSpeaker === "Rohan" ? "#38bdf8" : "rgba(255,255,255,0.4)", fontWeight: 700 }}>
                    {activeSpeaker === "Rohan" ? "🎙️ Speaking" : "Listening"}
                  </span>
                </div>

                {activeSpeaker === "Rohan" && (
                  <div style={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 2, alignItems: "flex-end", height: 14 }}>
                    <span style={{ width: 2, background: "#38bdf8", borderRadius: 2, animation: "eqPulseC 0.35s infinite" }} />
                    <span style={{ width: 2, background: "#38bdf8", borderRadius: 2, animation: "eqPulseA 0.45s infinite" }} />
                    <span style={{ width: 2, background: "#38bdf8", borderRadius: 2, animation: "eqPulseB 0.4s infinite" }} />
                  </div>
                )}
              </div>

              {/* 3. Priya (Product Strategist) */}
              <div style={{
                background: activeSpeaker === "Priya" ? "rgba(192,132,252,0.15)" : "rgba(255,255,255,0.03)",
                border: activeSpeaker === "Priya" ? "2px solid #c084fc" : "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 0,
                minHeight: 0,
                boxSizing: "border-box",
                boxShadow: activeSpeaker === "Priya" ? "0 0 20px rgba(192,132,252,0.5)" : "none"
              }}>
                <div style={{ textAlign: "center", padding: "0.5rem", minWidth: 0 }}>
                  <div style={{ fontSize: 32, marginBottom: 2 }}>🎯</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Priya</div>
                  <div style={{ fontSize: 9, color: "#c084fc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Product Lead • TAM & Delivery</div>
                </div>

                <div style={{ position: "absolute", bottom: 4, left: 4, right: 4, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.65)", padding: "2px 6px", borderRadius: 6, minWidth: 0 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "white" }}>Priya (Peer)</span>
                  <span style={{ fontSize: 8, color: activeSpeaker === "Priya" ? "#c084fc" : "rgba(255,255,255,0.4)", fontWeight: 700 }}>
                    {activeSpeaker === "Priya" ? "🎙️ Speaking" : "Listening"}
                  </span>
                </div>

                {activeSpeaker === "Priya" && (
                  <div style={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 2, alignItems: "flex-end", height: 14 }}>
                    <span style={{ width: 2, background: "#c084fc", borderRadius: 2, animation: "eqPulseB 0.4s infinite" }} />
                    <span style={{ width: 2, background: "#c084fc", borderRadius: 2, animation: "eqPulseC 0.3s infinite" }} />
                    <span style={{ width: 2, background: "#c084fc", borderRadius: 2, animation: "eqPulseA 0.5s infinite" }} />
                  </div>
                )}
              </div>

              {/* 4. Karan (Contrarian & Risk) */}
              <div style={{
                background: activeSpeaker === "Karan" ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.03)",
                border: activeSpeaker === "Karan" ? "2px solid #fbbf24" : "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 0,
                minHeight: 0,
                boxSizing: "border-box",
                boxShadow: activeSpeaker === "Karan" ? "0 0 20px rgba(251,191,36,0.5)" : "none"
              }}>
                <div style={{ textAlign: "center", padding: "0.5rem", minWidth: 0 }}>
                  <div style={{ fontSize: 32, marginBottom: 2 }}>💡</div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Karan</div>
                  <div style={{ fontSize: 9, color: "#fbbf24", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Contrarian • Threat & Edge Cases</div>
                </div>

                <div style={{ position: "absolute", bottom: 4, left: 4, right: 4, display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(0,0,0,0.65)", padding: "2px 6px", borderRadius: 6, minWidth: 0 }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "white" }}>Karan (Peer)</span>
                  <span style={{ fontSize: 8, color: activeSpeaker === "Karan" ? "#fbbf24" : "rgba(255,255,255,0.4)", fontWeight: 700 }}>
                    {activeSpeaker === "Karan" ? "🎙️ Speaking" : "Listening"}
                  </span>
                </div>

                {activeSpeaker === "Karan" && (
                  <div style={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 2, alignItems: "flex-end", height: 14 }}>
                    <span style={{ width: 2, background: "#fbbf24", borderRadius: 2, animation: "eqPulseA 0.4s infinite" }} />
                    <span style={{ width: 2, background: "#fbbf24", borderRadius: 2, animation: "eqPulseB 0.35s infinite" }} />
                    <span style={{ width: 2, background: "#fbbf24", borderRadius: 2, animation: "eqPulseC 0.5s infinite" }} />
                  </div>
                )}
              </div>

              {/* 5. Alex (Moderator & Bar-Raiser Director) */}
              <div style={{
                gridColumn: "span 2",
                background: activeSpeaker === "Moderator Alex" ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.02)",
                border: activeSpeaker === "Moderator Alex" ? "2px solid #34d399" : "1px solid rgba(255,255,255,0.08)",
                borderRadius: 12,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                padding: "0.5rem 0.85rem",
                minWidth: 0,
                minHeight: 0,
                boxSizing: "border-box",
                boxShadow: activeSpeaker === "Moderator Alex" ? "0 0 20px rgba(52,211,153,0.5)" : "none"
              }}>
                <div style={{ fontSize: 32, flexShrink: 0 }}>🎙️</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ fontSize: 11, fontWeight: 900, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Alex (Discussion Director)</div>
                    <span style={{ fontSize: 8, padding: "1px 5px", borderRadius: 4, background: "rgba(52,211,153,0.2)", color: "#6ee7b7", fontWeight: 800, flexShrink: 0 }}>
                      PANEL DIRECTOR
                    </span>
                  </div>
                  <div style={{ fontSize: 9, color: "#34d399", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>Lead FAANG Placement Bar-Raiser</div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    Evaluating articulation clarity, non-verbal tone, and synthesis of conflicting points.
                  </div>
                </div>

                {activeSpeaker === "Moderator Alex" && (
                  <div style={{ position: "absolute", top: 6, right: 6, display: "flex", gap: 2, alignItems: "flex-end", height: 14 }}>
                    <span style={{ width: 2, background: "#34d399", borderRadius: 2, animation: "eqPulseA 0.4s infinite" }} />
                    <span style={{ width: 2, background: "#34d399", borderRadius: 2, animation: "eqPulseC 0.3s infinite" }} />
                    <span style={{ width: 2, background: "#34d399", borderRadius: 2, animation: "eqPulseB 0.5s infinite" }} />
                  </div>
                )}
              </div>

            </div>

            {/* Live Captions Strip */}
            <div style={{ padding: "0.4rem 0.75rem", background: "rgba(0,0,0,0.65)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, display: "flex", alignItems: "center", gap: 8, flexShrink: 0, minWidth: 0, width: "100%", boxSizing: "border-box" }}>
              <span style={{ fontSize: 9, color: "#818cf8", fontWeight: 800, flexShrink: 0, letterSpacing: 0.5 }}>LIVE CAPTION:</span>
              <div style={{ fontSize: 11, color: "white", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, minWidth: 0 }}>
                {currentSubtitle || (loading ? "AI peer formulating response..." : "Discussion room active. Continuous auto-debate running. Speak into mic to jump in anytime.")}
              </div>
            </div>

            {/* Quick Argument Chips (Jump into debate instantly) */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, overflowX: "auto", flexShrink: 0, minWidth: 0, width: "100%", boxSizing: "border-box", paddingBottom: 2, scrollbarWidth: "none" }}>
              <span style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", fontWeight: 800, flexShrink: 0 }}>Quick Points:</span>
              {quickJumpIns.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleStudentIntervention(chip.text)}
                  disabled={loading}
                  style={{
                    padding: "3px 8px",
                    borderRadius: 6,
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "rgba(255,255,255,0.85)",
                    fontSize: 9,
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    transition: "all 0.15s ease"
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,102,241,0.2)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Bottom Meeting Control Dock */}
            <div style={{ padding: "0.45rem 0.75rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, flexShrink: 0, minWidth: 0, width: "100%", boxSizing: "border-box", flexWrap: "wrap" }}>
              
              {/* Audio, Video & Toggle Controls */}
              <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                <button
                  onClick={toggleMic}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: micActive ? "2px solid #ef4444" : "1px solid rgba(255,255,255,0.15)",
                    background: micActive ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.05)",
                    color: micActive ? "#f87171" : "white",
                    fontSize: 10,
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    whiteSpace: "nowrap"
                  }}
                >
                  <span>{micActive ? "🔴 Speaking" : "🎤 Mic"}</span>
                </button>

                <button
                  onClick={() => setCameraActive(!cameraActive)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: cameraActive ? "1px solid #10b981" : "1px solid rgba(255,255,255,0.15)",
                    background: cameraActive ? "rgba(16,185,129,0.15)" : "rgba(255,255,255,0.05)",
                    color: cameraActive ? "#34d399" : "rgba(255,255,255,0.7)",
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap"
                  }}
                >
                  {cameraActive ? "📹 Cam On" : "📷 Cam Off"}
                </button>

                <button
                  onClick={() => setHandRaised(!handRaised)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: handRaised ? "1px solid #fbbf24" : "1px solid rgba(255,255,255,0.15)",
                    background: handRaised ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.05)",
                    color: handRaised ? "#fbbf24" : "rgba(255,255,255,0.7)",
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    whiteSpace: "nowrap"
                  }}
                >
                  <span>✋</span>
                  <span>{handRaised ? "Raised" : "Hand"}</span>
                </button>

                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  style={{
                    padding: "6px 10px",
                    borderRadius: 8,
                    border: sidebarOpen ? "1px solid #818cf8" : "1px solid rgba(255,255,255,0.15)",
                    background: sidebarOpen ? "rgba(99,102,241,0.2)" : "rgba(255,255,255,0.05)",
                    color: sidebarOpen ? "#a5b4fc" : "rgba(255,255,255,0.7)",
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: "pointer",
                    whiteSpace: "nowrap"
                  }}
                  title="Toggle Recruiter Coach & Transcript Sidebar"
                >
                  📊 {sidebarOpen ? "Hide Coach" : "Coach"}
                </button>
              </div>

              {/* Instant Intervene Input */}
              <div style={{ flex: 1, minWidth: 100, display: "flex", alignItems: "center", gap: 5 }}>
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") handleStudentIntervention();
                  }}
                  placeholder="Speak or type point..."
                  style={{ flex: 1, minWidth: 50, padding: "6px 10px", background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 8, color: "white", fontSize: 10, outline: "none" }}
                />
                <button
                  onClick={() => handleStudentIntervention()}
                  disabled={!input.trim() && !interimSpoken.trim()}
                  style={{ padding: "6px 12px", background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white", border: "none", borderRadius: 8, fontWeight: 800, fontSize: 10, cursor: "pointer", flexShrink: 0, whiteSpace: "nowrap" }}
                >
                  Intervene ➔
                </button>
              </div>

            </div>

          </div>

          {/* Right: Real-Time Recruiter Barometer & Live Discussion Log */}
          {(sidebarOpen || isMobile) && (
            <div style={{ display: (isMobile && mobileTab !== "transcript") ? "none" : "flex", flexDirection: "column", gap: "0.5rem", minHeight: 0, minWidth: 0, height: "100%", overflow: "hidden", boxSizing: "border-box" }}>
              
              {/* Recruiter Live GD Observation Barometer */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "0.75rem", flexShrink: 0, minWidth: 0 }}>
                <div style={{ fontSize: 9, color: "#34d399", fontWeight: 800, letterSpacing: 0.5, marginBottom: 2 }}>
                  FAANG HIRING COMMITTEE • GD OBSERVATION
                </div>
                <div style={{ fontSize: 11, fontWeight: 900, color: "white", marginBottom: 6 }}>
                  Live Round-Table Debate Dynamics
                </div>

                {coaching ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 8px", background: "rgba(16,185,129,0.1)", borderRadius: 8, border: "1px solid rgba(16,185,129,0.25)" }}>
                      <div>
                        <div style={{ fontSize: 8, color: "rgba(255,255,255,0.6)" }}>GD Articulation Impact</div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: "#34d399" }}>{coaching.valueAdded || "High Value"} Floor Contention</div>
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: "#34d399" }}>
                        {coaching.articulationScore}<span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>/100</span>
                      </div>
                    </div>

                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.85)", lineHeight: 1.3, background: "rgba(0,0,0,0.25)", padding: "5px 7px", borderRadius: 6 }}>
                      <strong style={{ color: "#fbbf24" }}>GD Strategy: </strong>{coaching.feedbackTip}
                    </div>

                    {coaching.winningCounterPhrase && (
                      <div style={{ fontSize: 9, color: "#a5b4fc", lineHeight: 1.3, background: "rgba(99,102,241,0.08)", padding: "5px 7px", borderRadius: 6 }}>
                        <strong style={{ color: "white" }}>⚡ Tactical GD Interjection: </strong>&quot;{coaching.winningCounterPhrase}&quot;
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.45)", lineHeight: 1.35 }}>
                    Peers are actively debating each other. Jump into the cross-fire anytime via microphone or Quick Points to assert group leadership!
                  </div>
                )}
              </div>

              {/* Discussion Transcript Stream */}
              <div style={{ flex: 1, minHeight: 0, minWidth: 0, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "0.75rem", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.5)", fontWeight: 800, letterSpacing: 0.5, marginBottom: 5, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>LIVE TRANSCRIPT ({messages.length})</span>
                  {autoFlow && <span style={{ color: "#34d399", fontSize: 8 }}>● AUTO-FLOW ACTIVE</span>}
                </div>

                <div ref={chatScrollRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, paddingRight: 4 }}>
                  {messages.map((m, idx) => {
                    const isUser = m.speaker === "You";
                    return (
                      <div key={idx} style={{ padding: "5px 7px", background: isUser ? "rgba(99,102,241,0.15)" : "rgba(255,255,255,0.02)", border: isUser ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(255,255,255,0.05)", borderRadius: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 1 }}>
                          <span style={{ fontSize: 9, fontWeight: 800, color: isUser ? "#a5b4fc" : "#e2e8f0" }}>
                            {m.avatar} {m.speaker}
                          </span>
                          <span style={{ fontSize: 8, color: "rgba(255,255,255,0.3)" }}>{m.time}</span>
                        </div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.8)", lineHeight: 1.3 }}>
                          {m.content}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

        </div>
        </div>
      )}

      {/* ── COMPREHENSIVE FAANG GD ASSESSMENT DOSSIER MODAL ── */}
      {showReportModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(6,3,15,0.92)", backdropFilter: "blur(24px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "clamp(0.5rem, 2vw, 1.5rem)" }}>
          <div style={{ maxWidth: 840, width: "100%", maxHeight: "92vh", overflowY: "auto", background: "#0b061d", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 24, padding: "clamp(1rem, 3vw, 2rem)", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.9)" }}>
            
            {/* Modal Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "1.25rem", marginBottom: "1.5rem" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, padding: "2px 8px", background: "rgba(52,211,153,0.2)", color: "#34d399", borderRadius: 6, fontWeight: 900 }}>
                    OFFICIAL GD VERDICT • COMMITTEE ARCHIVE
                  </span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Time: {formatTimer(secondsElapsed)}</span>
                </div>
                <h2 style={{ fontSize: 22, fontWeight: 900, color: "white", margin: "0 0 4px" }}>
                  FAANG Hiring Committee GD Assessment Report
                </h2>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                  Topic: <strong>{activeTopic}</strong>
                </div>
              </div>

              <button
                onClick={() => setShowReportModal(false)}
                style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, color: "white", padding: "6px 12px", cursor: "pointer", fontWeight: 800, fontSize: 13 }}
              >
                ✕ Close
              </button>
            </div>

            {/* Score & Verdict Banner */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", gap: 16, background: "linear-gradient(135deg,rgba(99,102,241,0.12),rgba(16,185,129,0.08))", border: "1px solid rgba(99,102,241,0.3)", borderRadius: 18, padding: "1.5rem", marginBottom: "1.5rem" }}>
              <div>
                <div style={{ fontSize: 11, color: "#34d399", fontWeight: 800, letterSpacing: 1, marginBottom: 4 }}>
                  PLACEMENT COMMITTEE RECOMMENDATION
                </div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "white", marginBottom: 6 }}>
                  {candidateInterventions.length >= 2 ? "STRONG HIRE • ADVANCE TO TECH ROUND" : "LEAN HIRE • CALIBRATION REQUIRED"}
                </div>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 1.5, margin: 0 }}>
                  Candidate demonstrated active awareness of distributed trade-offs and engaged directly with peers. Articulation showed high technical aptitude and collaborative debate presence.
                </p>
              </div>

              <div style={{ background: "rgba(0,0,0,0.35)", borderRadius: 14, padding: "1rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: 1 }}>Composite Score</div>
                <div style={{ fontSize: 38, fontWeight: 900, color: "#34d399", lineHeight: 1, margin: "6px 0" }}>
                  {coaching?.articulationScore || 86}<span style={{ fontSize: 16, color: "rgba(255,255,255,0.4)" }}>/100</span>
                </div>
                <span style={{ fontSize: 10, color: "#a5b4fc", fontWeight: 700 }}>Top 8% Campus Benchmark</span>
              </div>
            </div>

            {/* 4 Pillars Assessment Grid */}
            <div style={{ marginBottom: "1.75rem" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 800, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>
                Detailed Competency Breakdown
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                {[
                  { pillar: "Technical Depth & Systems Rigor", score: 88, desc: "Evaluates whether points were grounded in architecture, scale, and operational realities." },
                  { pillar: "Synthesis & Conflict Resolution", score: 85, desc: "Ability to bridge polarized views between Product (Priya) and Architecture (Rohan)." },
                  { pillar: "Floor Command & Assertive Entry", score: candidateInterventions.length >= 2 ? 86 : 74, desc: "Turn-taking confidence, vocal tone, and ability to steer away from theoretical hype." },
                  { pillar: "Contextual Evidence & Concrete Metrics", score: 82, desc: "Use of specific SLAs, p99 latency trade-offs, and production failure examples." }
                ].map((p, i) => (
                  <div key={i} style={{ padding: "1rem", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <div style={{ fontSize: 12, fontWeight: 800, color: "white" }}>{p.pillar}</div>
                      <div style={{ fontSize: 14, fontWeight: 900, color: "#38bdf8" }}>{p.score}<span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>/100</span></div>
                    </div>
                    <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>{p.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Areas of Scope & Improvement */}
            <div style={{ marginBottom: "1.75rem", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.25)", borderRadius: 16, padding: "1.25rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>💡</span>
                <span style={{ fontSize: 12, fontWeight: 900, color: "#fbbf24", letterSpacing: 0.5 }}>
                  AREAS OF SCOPE & RECRUITER COACHING TIPS
                </span>
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "rgba(255,255,255,0.85)", lineHeight: 1.6 }}>
                <li>
                  <strong style={{ color: "white" }}>Ground claims with empirical metrics:</strong> Instead of asking open-ended questions, quantify the latency or security SLA early to put peers on the defensive.
                </li>
                <li>
                  <strong style={{ color: "white" }}>Counter Priya on Product Velocity:</strong> Acknowledge delivery urgency first, then show how premature architectural compromises cause 10x technical debt later.
                </li>
                <li>
                  <strong style={{ color: "white" }}>Synthesize at the 8-minute mark:</strong> Summarize consensus across Rohan and Karan before Moderator Alex steps in to earn top leadership and bar-raiser bonus marks.
                </li>
              </ul>
            </div>

            {/* Candidate Spoken Quotes & Senior Recruiter Rewrites */}
            <div style={{ marginBottom: "2rem" }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 800, letterSpacing: 1, marginBottom: 8, textTransform: "uppercase" }}>
                Candidate Intervention Analysis ({candidateInterventions.length} Spoken Turns)
              </div>
              {candidateInterventions.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {candidateInterventions.map((ci, idx) => (
                    <div key={idx} style={{ padding: "1rem", background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: 12 }}>
                      <div style={{ fontSize: 11, color: "#a5b4fc", fontWeight: 700, marginBottom: 4 }}>
                        Your Spoken Statement #{idx + 1}:
                      </div>
                      <div style={{ fontSize: 12, color: "white", fontStyle: "italic", marginBottom: 8 }}>
                        &quot;{ci.content}&quot;
                      </div>
                      <div style={{ fontSize: 11, color: "#34d399", background: "rgba(0,0,0,0.3)", padding: "6px 10px", borderRadius: 8 }}>
                        <strong>✨ Senior Recruiter Rewrite: </strong>
                        &quot;While the theoretical argument holds for the happy path, in a production environment under 10x traffic spikes, our bottleneck shifts to distributed consensus latency.&quot;
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: "1rem", background: "rgba(255,255,255,0.03)", borderRadius: 12, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                  No interventions recorded during this session. In your next round, unmute your mic or click Quick Counter chips to register your points!
                </div>
              )}
            </div>

            {/* Action CTAs */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 12, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1.25rem" }}>
              <button
                onClick={() => {
                  window.print();
                }}
                style={{ padding: "10px 18px", borderRadius: 10, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.15)", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
              >
                📄 Print / Save Scorecard
              </button>

              <button
                onClick={() => {
                  setShowReportModal(false);
                  setStarted(false);
                }}
                style={{ padding: "10px 20px", borderRadius: 10, background: "linear-gradient(135deg,#6366f1,#8b5cf6)", border: "none", color: "white", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
              >
                Practice Another Topic 🚀
              </button>

              <button
                onClick={() => {
                  cleanupSession();
                  router.push("/student");
                }}
                style={{ padding: "10px 20px", borderRadius: 10, background: "linear-gradient(135deg,#10b981,#059669)", border: "none", color: "white", fontSize: 12, fontWeight: 800, cursor: "pointer" }}
              >
                Go to Dashboard ➔
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
