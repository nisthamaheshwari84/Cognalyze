"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import { useTheme } from "@/components/ThemeProvider";
import {
  MentorMode,
  MentorMessage,
  TodaysFocusItem,
  StudentMentorContext,
  FeatureLink
} from "@/lib/mentor/ai-mentor-service";
import MentorMarkdownRenderer from "@/components/mentor/MentorMarkdownRenderer";
import LearnerModelDrawer from "@/components/mentor/LearnerModelDrawer";
import {
  Sparkles,
  Send,
  RotateCcw,
  Square,
  ThumbsUp,
  ThumbsDown,
  ChevronRight,
  ExternalLink,
  BookOpen,
  Code2,
  Briefcase,
  Calendar,
  Compass,
  FileText,
  Search,
  History,
  X,
  Plus,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  Copy,
  Check,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Brain,
  Phone,
  PhoneOff
} from "lucide-react";

interface SavedConversation {
  id: string;
  title: string;
  date: string;
  messages: MentorMessage[];
  mode: MentorMode;
}

export default function StudentAiMentorPage() {
  const { isDark } = useTheme();
  const [candidateId, setCandidateId] = useState("student-demo");
  const [mode, setMode] = useState<MentorMode>("all");
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<MentorMessage[]>([]);
  const [activeWhy, setActiveWhy] = useState<string | null>(null);
  const [showTodaysFocus, setShowTodaysFocus] = useState(true);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [learnerDrawerOpen, setLearnerDrawerOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeakingId, setIsSpeakingId] = useState<string | null>(null);
  const [voiceMode, setVoiceMode] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [voiceAgentOpen, setVoiceAgentOpen] = useState(false);
  const [voiceAgentState, setVoiceAgentState] = useState<"idle" | "listening" | "thinking" | "speaking">("idle");
  const [searchHistoryQuery, setSearchHistoryQuery] = useState("");
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [context, setContext] = useState<StudentMentorContext | null>(null);

  const [conversations, setConversations] = useState<SavedConversation[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>("session-default");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const recognitionRef = useRef<any>(null);
  const voiceSilenceTimerRef = useRef<any>(null);
  const voiceAutoSendRef = useRef<((text: string) => void) | undefined>(undefined);
  const voiceModeRef = useRef(false);
  const voiceAgentOpenRef = useRef(false);
  voiceAgentOpenRef.current = voiceAgentOpen;
  const isListeningRef = useRef(false);
  isListeningRef.current = isListening;

  // Keep autoSend ref updated with latest handleSendMessage
  voiceAutoSendRef.current = (text: string) => handleSendMessage(text);

  const speakText = (text: string, msgId: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    if (isSpeakingId === msgId) {
      setIsSpeakingId(null);
      setVoiceAgentState("idle");
      return;
    }
    const cleanSpoken = text
      .replace(/```[\s\S]*?```/g, "Code example omitted for voice.")
      .replace(/`[^`]+`/g, "")
      .replace(/#{1,6}\s+/g, "")
      .replace(/\*\*([^*]+)\*\*/g, "$1")
      .replace(/\*([^*]+)\*/g, "$1")
      .replace(/\|[^|]+\|/g, "")
      .replace(/---/g, "")
      .replace(/\$[^$]+\$/g, "formula");

    const utterance = new SpeechSynthesisUtterance(cleanSpoken);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onstart = () => {
      setIsSpeakingId(msgId);
      setVoiceAgentState("speaking");
    };
    utterance.onend = () => {
      setIsSpeakingId(null);
      setVoiceAgentState("idle");
      // If voice agent overlay is still open, automatically resume listening after speaking
      if (voiceAgentOpenRef.current) {
        setTimeout(() => {
          if (voiceAgentOpenRef.current && !isListeningRef.current) {
            startListening();
          }
        }, 300);
      }
    };
    utterance.onerror = () => {
      setIsSpeakingId(null);
      setVoiceAgentState("idle");
    };
    setIsSpeakingId(msgId);
    setVoiceAgentState("speaking");
    window.speechSynthesis.speak(utterance);
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setIsListening(false);
    isListeningRef.current = false;
    setVoiceMode(false);
    voiceModeRef.current = false;
    setInterimTranscript("");
    if (voiceSilenceTimerRef.current) clearTimeout(voiceSilenceTimerRef.current);
    setVoiceAgentState((prev) => (prev === "listening" ? "idle" : prev));
  };

  const startListening = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input is supported in Google Chrome and Microsoft Edge browsers.");
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      let accumulatedFinal = "";

      recognition.onresult = (event: any) => {
        let interim = "";
        let finalText = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalText += transcript;
          } else {
            interim += transcript;
          }
        }
        if (finalText) {
          accumulatedFinal += (accumulatedFinal ? " " : "") + finalText.trim();
          setInputText(accumulatedFinal);
          setInterimTranscript("");
          // Reset silence timer — auto-send after 1.5s of silence
          if (voiceSilenceTimerRef.current) clearTimeout(voiceSilenceTimerRef.current);
          voiceSilenceTimerRef.current = setTimeout(() => {
            if (accumulatedFinal.trim()) {
              setVoiceAgentState("thinking");
              voiceAutoSendRef.current?.(accumulatedFinal.trim());
              accumulatedFinal = "";
              setInputText("");
            }
          }, 1500);
        } else if (interim) {
          setInterimTranscript(interim);
        }
      };
      recognition.onerror = (e: any) => {
        if (e.error !== "no-speech") {
          console.warn("Speech recognition error:", e.error);
          setIsListening(false);
          isListeningRef.current = false;
          setVoiceMode(false);
          voiceModeRef.current = false;
          setVoiceAgentState((prev) => (prev === "listening" ? "idle" : prev));
        }
      };
      recognition.onend = () => {
        if (voiceModeRef.current || (voiceAgentOpenRef.current && isListeningRef.current)) {
          try {
            recognition.start();
          } catch {
            setIsListening(false);
            isListeningRef.current = false;
            setVoiceMode(false);
            voiceModeRef.current = false;
          }
        } else {
          setIsListening(false);
          isListeningRef.current = false;
        }
      };
      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
      isListeningRef.current = true;
      setVoiceMode(true);
      voiceModeRef.current = true;
      setVoiceAgentState("listening");
    } catch (err) {
      console.warn("Speech recognition error:", err);
      setIsListening(false);
      isListeningRef.current = false;
      setVoiceMode(false);
      voiceModeRef.current = false;
      setVoiceAgentState("idle");
    }
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Initial load
  useEffect(() => {
    const stored =
      typeof window !== "undefined"
        ? localStorage.getItem("cognalyze_student_id") || "student-demo"
        : "student-demo";
    setCandidateId(stored);

    // Fetch live Student DNA Context
    fetch(`/api/student/ai-mentor/context?studentId=${stored}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.context) {
          setContext(data.context);
        }
      })
      .catch((err) => console.warn("Failed to load mentor context:", err));

    // Load saved conversations from localStorage
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem("cognalyze_ai_mentor_conversations");
        if (raw) {
          const parsed: SavedConversation[] = JSON.parse(raw);
          if (parsed.length > 0) {
            setConversations(parsed);
            setActiveSessionId(parsed[0].id);
            setMessages(parsed[0].messages);
            setMode(parsed[0].mode || "all");
            return;
          }
        }
      } catch {
        // fallback to default preset
      }

      // Default initial preset conversations
      const presets: SavedConversation[] = [
        {
          id: "session-trees",
          title: "DSA Recursion & Tree Traversals",
          date: "Yesterday",
          mode: "dsa",
          messages: [
            {
              id: "p1",
              role: "user",
              content: "Teach me how to think about recursion for binary trees.",
              timestamp: new Date(Date.now() - 86400000).toISOString()
            },
            {
              id: "p2",
              role: "mentor",
              content: `### Intuition: Trust the Subtree

When solving tree problems, never trace every node mentally. **Trust that your function works on the left subtree and right subtree**, and just ask yourself:

1. **What is my Base Case?** (Usually: \`if not root: return 0\` or \`return None\`)
2. **What work do I do at the CURRENT node?** (e.g. \`1 + max(left, right)\`)
3. **What do I return to my parent?**

\`\`\`python
def maxDepth(root):
    if not root:
        return 0
    return 1 + max(maxDepth(root.left), maxDepth(root.right))
\`\`\`

Would you like to try calculating the diameter of a binary tree next?`,
              timestamp: new Date(Date.now() - 86000000).toISOString(),
              why: "Your Student DNA shows 24 verified DSA problems. Tree traversals are a core focus area.",
              quickReplies: ["Yes, let's do diameter of binary tree", "Explain time complexity", "Show BFS iterative approach"],
              featureLinks: [{ label: "Open DSA Tracker", href: "/dsa-tracker" }]
            }
          ]
        },
        {
          id: "session-pitch",
          title: "Payment Recovery Agent Architecture Pitch",
          date: "3 days ago",
          mode: "projects",
          messages: [
            {
              id: "p3",
              role: "user",
              content: "How do I explain my Autonomous Payment Recovery Agent project in an interview?",
              timestamp: new Date(Date.now() - 259200000).toISOString()
            },
            {
              id: "p4",
              role: "mentor",
              content: `### 30-Second Architecture Pitch

*"I built an event-driven autonomous payment recovery pipeline that correlates payment failures across webhooks, applies pattern recognition for smart retries, and verifies customer intent with strict truth contracts—reducing churn by 35%."*

#### Key Deep-Dive Points
- **Trade-off**: Evaluated cron pollers vs distributed webhooks. Chose webhooks with Redis deduplication to avoid double-charging.
- **Resilience**: Handled downstream gateway rate limits with exponential backoff and jitter.`,
              timestamp: new Date(Date.now() - 259000000).toISOString(),
              why: "Your project has corroborated evidence in Student DNA.",
              quickReplies: ["What are possible interviewer follow-ups?", "Review my resume bullet points"],
              featureLinks: [{ label: "Review Resume Claims", href: "/resume" }]
            }
          ]
        }
      ];
      setConversations(presets);
    }
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Persist current conversation to localStorage
  const persistConversations = (updated: SavedConversation[]) => {
    setConversations(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("cognalyze_ai_mentor_conversations", JSON.stringify(updated));
      } catch {
        // ignore quota
      }
    }
  };

  const handleStartNewSession = () => {
    const newId = `session-${Date.now()}`;
    const newSession: SavedConversation = {
      id: newId,
      title: "New Mentorship Session",
      date: "Just now",
      messages: [],
      mode: "all"
    };
    const updated = [newSession, ...conversations];
    setActiveSessionId(newId);
    setMessages([]);
    setMode("all");
    persistConversations(updated);
    setHistoryDrawerOpen(false);
  };

  const handleSelectSession = (sess: SavedConversation) => {
    setActiveSessionId(sess.id);
    setMessages(sess.messages);
    setMode(sess.mode || "all");
    setHistoryDrawerOpen(false);
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;
    if (loading) {
      // Don't block silently — give visual feedback
      console.log("[Mentor] Still processing previous message, please wait.");
      return;
    }

    setInputText("");
    if (inputRef.current) inputRef.current.style.height = "auto";

    const userMsg: MentorMessage = {
      id: `usr-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString()
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);
    setVoiceAgentState("thinking");

    // Update conversation title if first message
    const currentSession = conversations.find((c) => c.id === activeSessionId);
    let titleToSet = currentSession?.title || "Mentorship Session";
    if (messages.length === 0) {
      titleToSet = text.slice(0, 32) + (text.length > 32 ? "..." : "");
    }

    try {
      abortControllerRef.current = new AbortController();

      const res = await fetch("/api/student/ai-mentor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: candidateId,
          message: text,
          mode,
          history: newMessages.slice(-8)
        }),
        signal: abortControllerRef.current.signal
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.data) {
          const mentorMsgId = `mnt-${Date.now()}`;
          const mentorMsg: MentorMessage = {
            id: mentorMsgId,
            role: "mentor",
            content: data.data.content,
            timestamp: new Date().toISOString(),
            why: data.data.why,
            quickReplies: data.data.quickReplies,
            featureLinks: data.data.featureLinks,
            mode
          };

          const finalMessages = [...newMessages, mentorMsg];
          setMessages(finalMessages);

          // Auto-speak response when in voice mode or full-screen voice agent
          if ((voiceMode || voiceAgentOpenRef.current) && data.data.content) {
            speakText(data.data.content, mentorMsgId);
          } else {
            setVoiceAgentState("idle");
          }

          // Update saved sessions
          const updatedSessions = conversations.map((c) => {
            if (c.id === activeSessionId) {
              return { ...c, title: titleToSet, messages: finalMessages, mode };
            }
            return c;
          });
          persistConversations(updatedSessions);
        } else {
          throw new Error(data?.error || "Failed to generate response");
        }
      } else {
        throw new Error("Failed to generate response");
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Mentor generation stopped by user.");
      } else {
        // Fallback error turn
        const errorMsgId = `mnt-${Date.now()}`;
        const errorMsg: MentorMessage = {
          id: errorMsgId,
          role: "mentor",
          content: `Your mentor encountered a brief connection delay. Let's try again or pick one of the core focus actions below.`,
          timestamp: new Date().toISOString(),
          quickReplies: ["Teach me OOP", "Practice DSA with hints", "Review my project pitch"],
          featureLinks: [{ label: "Open Question Bank", href: "/question-bank" }]
        };
        const finalMessages = [...newMessages, errorMsg];
        setMessages(finalMessages);
        if (voiceAgentOpenRef.current) {
          speakText(errorMsg.content, errorMsgId);
        }
      }
    } finally {
      setLoading(false);
      abortControllerRef.current = null;
      setVoiceAgentState((prev) => (prev === "thinking" ? "idle" : prev));
    }
  };

  const handleStopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setLoading(false);
    }
  };

  const handleRetryLastMessage = () => {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    if (lastUser) {
      handleSendMessage(lastUser.content);
    }
  };

  const handleCopyCode = (codeText: string, id: string) => {
    navigator.clipboard.writeText(codeText);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleFeedback = (msgId: string, type: "helpful" | "unhelpful") => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, feedback: type } : m))
    );
  };

  const modesList: { key: MentorMode; label: string; icon: string }[] = [
    { key: "all", label: "All / General", icon: "✦" },
    { key: "learn", label: "Learn a Concept", icon: "🧠" },
    { key: "dsa", label: "DSA & Coding", icon: "⚡" },
    { key: "interview", label: "Interview Coach", icon: "🎯" },
    { key: "projects", label: "Project Guidance", icon: "🛠️" },
    { key: "resume", label: "Resume Review", icon: "📄" },
    { key: "opportunities", label: "Opportunities", icon: "💼" },
    { key: "career", label: "Study Planner", icon: "📅" }
  ];

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchHistoryQuery.toLowerCase())
  );

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: isDark ? "#07111F" : "#F6F5F1",
        color: isDark ? "#F2F6FC" : "#17191C",
        display: "flex",
        flexDirection: "column",
        fontFamily: "var(--font-inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
        transition: "background-color 150ms ease"
      }}
    >
      <AppNav role="student" />

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 1. MENTOR TOPBAR (Sub-header)                                         */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <header
        style={{
          backgroundColor: isDark ? "#0A1626" : "#FFFFFF",
          borderBottom: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
          position: "sticky",
          top: 56,
          zIndex: 20
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Subtle Robot Icon */}
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              backgroundColor: isDark ? "#13243A" : "#EFF4FE",
              border: `1px solid ${isDark ? "#2A435F" : "#D2E0FB"}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#356AE6",
              boxShadow: isDark ? "0 2px 8px rgba(0,0,0,0.3)" : "none"
            }}
          >
            <Sparkles size={20} className="text-[#3478F6] animate-pulse" />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: isDark ? "#F2F6FC" : "#162A43", letterSpacing: "-0.2px" }}>
                COGNALYZE AI MENTOR
              </h1>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: 4,
                  backgroundColor: isDark ? "#13243A" : "#EFF4FE",
                  color: isDark ? "#BFD4FF" : "#356AE6",
                  border: `1px solid ${isDark ? "#2A435F" : "#D2E0FB"}`
                }}
              >
                ✦ Live Companion
              </span>
            </div>
            <div style={{ fontSize: 12, color: isDark ? "#8292A8" : "#667085", marginTop: 2 }}>
              Your personal learning and career mentor · <span style={{ color: isDark ? "#B6C4D6" : "#475467" }}>Ask, learn, practice, plan.</span>
            </div>
          </div>
        </div>

        {/* Right Action Tools */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Voice Agent Trigger in Topbar */}
          <button
            type="button"
            onClick={() => {
              setVoiceAgentOpen(true);
              startListening();
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 12px",
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              backgroundColor: isDark ? "rgba(16, 185, 129, 0.16)" : "#ECFDF5",
              border: `1px solid ${isDark ? "#10B981" : "#059669"}`,
              color: isDark ? "#34D399" : "#059669",
              transition: "all 120ms ease",
              boxShadow: "0 1px 3px rgba(16, 185, 129, 0.15)"
            }}
            className="hover:scale-[1.02] active:scale-[0.98]"
            title="Start live Voice Agent call with your mentor"
          >
            <Phone size={13} className="animate-pulse" />
            <span>Voice Agent</span>
          </button>

          <button
            type="button"
            onClick={() => setLearnerDrawerOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 12px",
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              backgroundColor: learnerDrawerOpen
                ? isDark
                  ? "rgba(16, 185, 129, 0.16)"
                  : "#ECFDF5"
                : isDark
                ? "#101F34"
                : "#FFFFFF",
              border: `1px solid ${learnerDrawerOpen ? (isDark ? "#10B981" : "#059669") : isDark ? "#223750" : "#E4E1DA"}`,
              color: learnerDrawerOpen ? (isDark ? "#34D399" : "#059669") : isDark ? "#B6C4D6" : "#17191C"
            }}
          >
            <Brain size={13} color="#10B981" />
            <span>Learner Model</span>
          </button>

          <button
            type="button"
            onClick={() => setShowTodaysFocus(!showTodaysFocus)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 12px",
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              backgroundColor: showTodaysFocus
                ? isDark
                  ? "rgba(52, 120, 246, 0.16)"
                  : "#EEF4FD"
                : isDark
                ? "#101F34"
                : "#FFFFFF",
              border: `1px solid ${showTodaysFocus ? (isDark ? "#3478F6" : "#356AE6") : isDark ? "#223750" : "#E4E1DA"}`,
              color: showTodaysFocus ? (isDark ? "#73A6FF" : "#356AE6") : isDark ? "#B6C4D6" : "#17191C"
            }}
          >
            <Lightbulb size={13} />
            <span>Today's Focus</span>
          </button>

          <button
            type="button"
            onClick={() => setHistoryDrawerOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 12px",
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              backgroundColor: isDark ? "#101F34" : "#FFFFFF",
              border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
              color: isDark ? "#B6C4D6" : "#17191C"
            }}
          >
            <History size={13} />
            <span>Recent Chats</span>
          </button>

          <button
            type="button"
            onClick={handleStartNewSession}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 12px",
              borderRadius: 7,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              backgroundColor: "#3478F6",
              border: "none",
              color: "#FFFFFF",
              boxShadow: "0 1px 2px rgba(16, 24, 40, 0.05)"
            }}
          >
            <Plus size={13} />
            <span>New Chat</span>
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 2. MAIN STAGE WRAPPER                                                 */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      <main
        style={{
          flex: 1,
          maxWidth: 1120,
          width: "100%",
          margin: "0 auto",
          padding: "16px 20px 32px",
          display: "flex",
          flexDirection: "column",
          gap: 16
        }}
      >
        {/* ── Mode Selection Bar ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            overflowX: "auto",
            paddingBottom: 4,
            scrollbarWidth: "none"
          }}
        >
          {modesList.map((m) => {
            const isSelected = mode === m.key;
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => setMode(m.key)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "6px 12px",
                  borderRadius: 20,
                  fontSize: 12,
                  fontWeight: isSelected ? 600 : 500,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  backgroundColor: isSelected
                    ? isDark
                      ? "rgba(52, 120, 246, 0.18)"
                      : "#EEF4FD"
                    : isDark
                    ? "#0E1B2E"
                    : "#FFFFFF",
                  border: isSelected
                    ? `1px solid ${isDark ? "#3478F6" : "#356AE6"}`
                    : `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                  color: isSelected
                    ? isDark
                      ? "#73A6FF"
                      : "#356AE6"
                    : isDark
                    ? "#B6C4D6"
                    : "#667085",
                  transition: "all 150ms ease"
                }}
              >
                <span>{m.icon}</span>
                <span>{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Today's Focus Dynamic Banner (Collapsible) ── */}
        {showTodaysFocus && context && (
          <section
            style={{
              backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
              border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
              borderRadius: 10,
              padding: "14px 18px",
              boxShadow: isDark ? "0 4px 16px rgba(0,0,0,0.2)" : "0 1px 3px rgba(16,24,40,0.05)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 0.6,
                    padding: "2px 7px",
                    borderRadius: 4,
                    backgroundColor: isDark ? "rgba(234, 182, 90, 0.12)" : "#FEF7ED",
                    color: isDark ? "#F0C978" : "#B7791F",
                    border: `1px solid ${isDark ? "rgba(234, 182, 90, 0.25)" : "#F8D8A7"}`
                  }}
                >
                  TODAY'S FOCUS
                </span>
                <span style={{ fontSize: 12, color: isDark ? "#8292A8" : "#667085" }}>
                  Calibrated for {context.targetRole}
                </span>
              </div>

              <button
                onClick={() => setShowTodaysFocus(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: isDark ? "#8292A8" : "#98A2B3",
                  fontSize: 11,
                  cursor: "pointer"
                }}
              >
                Dismiss ✕
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
              {context.todaysFocus.map((item) => (
                <div
                  key={item.id}
                  style={{
                    backgroundColor: isDark ? "#13243A" : "#FAF9F6",
                    border: `1px solid ${isDark ? "#263D57" : "#E4E1DA"}`,
                    borderRadius: 8,
                    padding: "10px 12px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "all 120ms ease"
                  }}
                  className={isDark ? "hover:border-[#3478F6]/60 hover:bg-[#152840]" : "hover:border-[#356AE6]/60 hover:bg-[#F2F6FE]"}
                >
                  <div
                    onClick={() => handleSendMessage(`Let's focus on: ${item.title}. ${item.subtitle}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: isDark ? "#4C8DFF" : "#356AE6"
                        }}
                      >
                        {item.category}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveWhy(item.why);
                        }}
                        title="Why was this recommended?"
                        style={{
                          background: "transparent",
                          border: "none",
                          fontSize: 10,
                          fontWeight: 700,
                          color: isDark ? "#8292A8" : "#667085",
                          cursor: "pointer",
                          textDecoration: "underline"
                        }}
                      >
                        Why?
                      </button>
                    </div>

                    <div style={{ fontSize: 12, fontWeight: 600, color: isDark ? "#F2F6FC" : "#17191C", lineHeight: 1.4 }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: 11, color: isDark ? "#AABBD0" : "#667085", marginTop: 2 }}>
                      {item.subtitle}
                    </div>
                  </div>

                  <div style={{ marginTop: 8, paddingTop: 6, borderTop: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <button
                      type="button"
                      onClick={() => handleSendMessage(`Let's focus on: ${item.title}. ${item.subtitle}`)}
                      style={{
                        background: "transparent",
                        border: "none",
                        fontSize: 11,
                        fontWeight: 600,
                        color: isDark ? "#73A6FF" : "#356AE6",
                        cursor: "pointer",
                        padding: 0
                      }}
                    >
                      Ask Mentor 💬
                    </button>
                    <Link
                      href={item.actionHref}
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: isDark ? "#8292A8" : "#667085",
                        textDecoration: "none",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4
                      }}
                    >
                      <span>{item.actionLabel}</span>
                      <span>→</span>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Chat Container ── */}
        <section
          style={{
            flex: 1,
            backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
            border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
            borderRadius: 12,
            display: "flex",
            flexDirection: "column",
            minHeight: 460,
            boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.18)" : "0 1px 3px rgba(16,24,40,0.04)",
            overflow: "hidden"
          }}
        >
          {/* Messages Area */}
          <div
            style={{
              flex: 1,
              padding: "24px 20px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 20
            }}
          >
            {/* WELCOME / EMPTY STATE */}
            {messages.length === 0 && (
              <div style={{ textAlign: "center", padding: "32px 16px 20px", maxWidth: 680, margin: "0 auto" }}>
                {/* Robot Mascot in Hero State */}
                <div
                  style={{
                    width: 64,
                    height: 64,
                    margin: "0 auto 16px",
                    borderRadius: 16,
                    backgroundColor: isDark ? "#13243A" : "#EFF4FE",
                    border: `1.5px solid ${isDark ? "#2A435F" : "#D2E0FB"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: isDark ? "0 8px 24px rgba(0,0,0,0.3)" : "0 4px 12px rgba(53,106,230,0.12)"
                  }}
                >
                  <span style={{ fontSize: 32 }}>🤖</span>
                </div>

                <h2 style={{ fontSize: 20, fontWeight: 700, color: isDark ? "#F2F6FC" : "#162A43", margin: "0 0 6px" }}>
                  Hi, {context?.studentName?.split(" ")[0] || "Nistha"} 👋
                </h2>
                <div style={{ fontSize: 14, fontWeight: 600, color: isDark ? "#4C8DFF" : "#356AE6", marginBottom: 8 }}>
                  I’m your Cognalyze AI Mentor.
                </div>
                <p style={{ fontSize: 13, color: isDark ? "#B6C4D6" : "#667085", lineHeight: 1.6, margin: "0 0 24px" }}>
                  I can help you learn, practice, prepare, and make better career decisions using the evidence in your Cognalyze profile.
                </p>

                {/* 9 Quick Action Shortcuts */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: 10,
                    textAlign: "left"
                  }}
                >
                  {[
                    { title: "Learn a Concept", prompt: "Teach me how recursion works step by step with an analogy.", icon: "🧠" },
                    { title: "Practice DSA", prompt: "Give me a medium DSA tree problem and guide my intuition.", icon: "⚡" },
                    { title: "Prepare for Interview", prompt: "Simulate a technical interview question for my target role.", icon: "🎯" },
                    { title: "Review My Skill Gaps", prompt: "What are my biggest skill gaps and how do I bridge them?", icon: "📊" },
                    { title: "Improve My Resume", prompt: "Review my resume projects and suggest stronger impact statements.", icon: "📄" },
                    { title: "Prepare for an Opportunity", prompt: "Evaluate my match for upcoming SDE Intern roles.", icon: "💼" },
                    { title: "Practice HR Questions", prompt: "Ask me a behavioral question on conflict and evaluate my answer.", icon: "💬" },
                    { title: "Start Mock Interview", prompt: "Run a 15-minute technical mock interview on system design.", icon: "🎙️" },
                    { title: "Plan My Week", prompt: "Make me a 2-week DSA and CS core study plan.", icon: "📅" }
                  ].map((seed, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        handleSendMessage(seed.prompt);
                      }}
                      style={{
                        backgroundColor: isDark ? "#13243A" : "#FAF9F6",
                        border: `1px solid ${isDark ? "#263D57" : "#E4E1DA"}`,
                        borderRadius: 8,
                        padding: "12px 14px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        textAlign: "left",
                        transition: "all 120ms ease",
                        WebkitTapHighlightColor: "transparent",
                        touchAction: "manipulation" as any,
                        userSelect: "none" as any
                      }}
                      onMouseDown={(e) => (e.currentTarget.style.transform = "scale(0.97)")}
                      onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                      className={isDark ? "hover:border-[#3478F6] hover:bg-[#182D46]" : "hover:border-[#356AE6] hover:bg-[#EEF4FD]"}
                    >
                      <span style={{ fontSize: 18, pointerEvents: "none" }}>{seed.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: isDark ? "#F2F6FC" : "#17191C", pointerEvents: "none" }}>
                        {seed.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation Messages */}
            {messages.map((msg, idx) => {
              const isUser = msg.role === "user";

              if (isUser) {
                return (
                  <div
                    key={msg.id || idx}
                    style={{
                      display: "flex",
                      justifyContent: "flex-end"
                    }}
                  >
                    <div
                      style={{
                        maxWidth: "75%",
                        backgroundColor: "#3478F6",
                        color: "#FFFFFF",
                        padding: "12px 16px",
                        borderRadius: "14px 14px 2px 14px",
                        fontSize: 13,
                        lineHeight: 1.5,
                        boxShadow: "0 2px 8px rgba(52, 120, 246, 0.25)"
                      }}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={msg.id || idx}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                    maxWidth: "85%",
                    alignSelf: "flex-start"
                  }}
                >
                  <div
                    style={{
                      backgroundColor: isDark ? "#13243A" : "#FAF9F6",
                      border: `1px solid ${isDark ? "#263D57" : "#E4E1DA"}`,
                      borderRadius: "14px 14px 14px 2px",
                      padding: "16px 18px",
                      color: isDark ? "#F2F6FC" : "#17191C",
                      fontSize: 13,
                      lineHeight: 1.6,
                      boxShadow: isDark ? "0 4px 12px rgba(0,0,0,0.15)" : "0 1px 2px rgba(16,24,40,0.03)"
                    }}
                  >
                    {/* Message Header */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingBottom: 8,
                        marginBottom: 10,
                        borderBottom: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 15 }}>🤖</span>
                        <span style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#4C8DFF" : "#356AE6", letterSpacing: 0.4 }}>
                          COGNALYZE AI MENTOR
                        </span>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => speakText(msg.content, msg.id)}
                          title={isSpeakingId === msg.id ? "Stop playback" : "Listen to mentor explanation"}
                          style={{
                            background: isSpeakingId === msg.id
                              ? isDark ? "rgba(16, 185, 129, 0.2)" : "#D1FAE5"
                              : "transparent",
                            border: `1px solid ${isSpeakingId === msg.id ? "#10B981" : "transparent"}`,
                            borderRadius: 4,
                            padding: "2px 6px",
                            cursor: "pointer",
                            color: isSpeakingId === msg.id ? "#10B981" : isDark ? "#8292A8" : "#667085",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 11,
                            fontWeight: 600
                          }}
                        >
                          {isSpeakingId === msg.id ? <VolumeX size={13} /> : <Volume2 size={13} />}
                          <span>{isSpeakingId === msg.id ? "Pause" : "Listen"}</span>
                        </button>

                        {msg.why && (
                          <button
                            onClick={() => setActiveWhy(msg.why || null)}
                            style={{
                              background: "transparent",
                              border: "none",
                              fontSize: 11,
                              fontWeight: 700,
                              color: isDark ? "#EAB65A" : "#B7791F",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 3
                            }}
                          >
                            <span>💡 Why this advice?</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Message Body with safe markdown rendering (No raw ##, **, |, <br>) */}
                    <div style={{ marginTop: 6 }}>
                      <MentorMarkdownRenderer content={msg.content} />
                    </div>

                    {/* Feedback & Actions Footer */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginTop: 14,
                        paddingTop: 8,
                        borderTop: `1px solid ${isDark ? "rgba(34, 55, 80, 0.7)" : "#E4E1DA"}`
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ fontSize: 11, color: isDark ? "#8292A8" : "#98A2B3" }}>Was this helpful?</span>
                        <button
                          onClick={() => handleFeedback(msg.id, "helpful")}
                          style={{
                            background: msg.feedback === "helpful" ? (isDark ? "rgba(53, 185, 130, 0.2)" : "#EAF4EE") : "transparent",
                            border: `1px solid ${msg.feedback === "helpful" ? "#35B982" : isDark ? "#263D57" : "#E4E1DA"}`,
                            borderRadius: 4,
                            padding: "2px 6px",
                            cursor: "pointer",
                            fontSize: 11,
                            color: msg.feedback === "helpful" ? "#35B982" : isDark ? "#8292A8" : "#667085"
                          }}
                        >
                          👍
                        </button>
                        <button
                          onClick={() => handleFeedback(msg.id, "unhelpful")}
                          style={{
                            background: msg.feedback === "unhelpful" ? (isDark ? "rgba(233, 104, 114, 0.2)" : "#FDF0F0") : "transparent",
                            border: `1px solid ${msg.feedback === "unhelpful" ? "#E96872" : isDark ? "#263D57" : "#E4E1DA"}`,
                            borderRadius: 4,
                            padding: "2px 6px",
                            cursor: "pointer",
                            fontSize: 11,
                            color: msg.feedback === "unhelpful" ? "#E96872" : isDark ? "#8292A8" : "#667085"
                          }}
                        >
                          👎
                        </button>
                      </div>

                      <button
                        onClick={() => handleSendMessage(`Explain this concept more simply with another example.`)}
                        style={{
                          background: "transparent",
                          border: "none",
                          fontSize: 11,
                          fontWeight: 600,
                          color: isDark ? "#4C8DFF" : "#356AE6",
                          cursor: "pointer"
                        }}
                      >
                        Simplify this →
                      </button>
                    </div>
                  </div>

                  {/* Contextual Action Pills (Rendered on latest mentor turn) */}
                  {idx === messages.length - 1 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
                      {msg.quickReplies?.map((qr, qIdx) => (
                        <button
                          key={qIdx}
                          type="button"
                          onClick={() => handleSendMessage(qr)}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 20,
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: "pointer",
                            backgroundColor: isDark ? "rgba(52, 120, 246, 0.15)" : "#EEF4FD",
                            border: `1px solid ${isDark ? "#3478F6" : "#356AE6"}`,
                            color: isDark ? "#73A6FF" : "#356AE6",
                            transition: "all 120ms ease",
                            WebkitTapHighlightColor: "transparent",
                            touchAction: "manipulation" as any
                          }}
                          className={isDark ? "hover:bg-[#3478F6]/25 active:scale-[0.97]" : "hover:bg-[#DDEBFE] active:scale-[0.97]"}
                        >
                          ✦ {qr}
                        </button>
                      ))}

                      {msg.featureLinks?.map((fl, fIdx) => (
                        <Link
                          key={fIdx}
                          href={fl.href}
                          style={{
                            padding: "4px 10px",
                            borderRadius: 6,
                            fontSize: 11,
                            fontWeight: 600,
                            textDecoration: "none",
                            backgroundColor: isDark ? "#101F34" : "#FFFFFF",
                            border: `1px solid ${isDark ? "#2A435F" : "#D1CDC4"}`,
                            color: isDark ? "#F2F6FC" : "#17191C",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4
                          }}
                        >
                          <span>{fl.label}</span>
                          <span>↗</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Loading Indicator */}
            {loading && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "12px 16px",
                  borderRadius: 8,
                  backgroundColor: isDark ? "#13243A" : "#FAF9F6",
                  border: `1px solid ${isDark ? "#263D57" : "#E4E1DA"}`,
                  maxWidth: 320
                }}
              >
                <div style={{ display: "flex", gap: 4 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#3478F6", animation: "bounce 1s infinite alternate" }} />
                  <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#3478F6", animation: "bounce 1s infinite alternate", animationDelay: "0.2s" }} />
                  <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#3478F6", animation: "bounce 1s infinite alternate", animationDelay: "0.4s" }} />
                </div>
                <span style={{ fontSize: 12, color: isDark ? "#8292A8" : "#667085" }}>
                  Mentor is formulating guidance...
                </span>
                <button
                  onClick={handleStopGeneration}
                  style={{
                    marginLeft: "auto",
                    background: "transparent",
                    border: "none",
                    color: isDark ? "#E96872" : "#C24141",
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Stop
                </button>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Input Stage */}
          <div
            style={{
              padding: "14px 20px",
              borderTop: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
              backgroundColor: isDark ? "#0A1626" : "#FFFFFF",
              display: "flex",
              flexDirection: "column",
              gap: 8
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-end",
                gap: 10,
                backgroundColor: isDark ? "#101F34" : "#FAF9F6",
                border: `1px solid ${isDark ? "#263D57" : "#E4E1DA"}`,
                borderRadius: 8,
                padding: "8px 12px"
              }}
            >
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  e.target.style.height = "auto";
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask your mentor anything (e.g. 'Teach me recursion', 'Review my resume projects', 'Give me a mock interview question')..."
                rows={1}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  resize: "none",
                  fontSize: 13,
                  color: isDark ? "#F2F6FC" : "#17191C",
                  fontFamily: "inherit",
                  lineHeight: 1.5,
                  maxHeight: 120
                }}
              />

              {loading ? (
                <button
                  type="button"
                  onClick={handleStopGeneration}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    backgroundColor: isDark ? "#13243A" : "#FEE4E2",
                    color: isDark ? "#E96872" : "#D92D20",
                    border: `1px solid ${isDark ? "#E96872" : "#FECDCA"}`,
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 4
                  }}
                >
                  <Square size={12} />
                  <span>Stop</span>
                </button>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <button
                    type="button"
                    onClick={toggleListening}
                    title={isListening ? "Listening... click to stop" : "Click to speak via voice"}
                    style={{
                      padding: "6px 10px",
                      borderRadius: 6,
                      backgroundColor: isListening
                        ? isDark ? "rgba(239, 68, 68, 0.25)" : "#FEE2E2"
                        : isDark ? "rgba(255, 255, 255, 0.06)" : "#F1F5F9",
                      color: isListening ? "#EF4444" : isDark ? "#94A3B8" : "#64748B",
                      border: `1px solid ${isListening ? "#EF4444" : isDark ? "#263D57" : "#CBD5E1"}`,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 12,
                      fontWeight: 600
                    }}
                  >
                    {isListening ? <MicOff size={13} className="animate-pulse" /> : <Mic size={13} />}
                    <span>{isListening ? "Listening..." : "Speak"}</span>
                  </button>

                  {/* Voice Agent Mode Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setVoiceAgentOpen(true);
                      startListening();
                    }}
                    title="Open immersive voice agent for hands-free conversation"
                    style={{
                      padding: "6px 10px",
                      borderRadius: 6,
                      backgroundColor: isDark ? "rgba(16, 185, 129, 0.12)" : "#ECFDF5",
                      color: isDark ? "#34D399" : "#059669",
                      border: `1px solid ${isDark ? "#10B981" : "#6EE7B7"}`,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 12,
                      fontWeight: 600,
                      transition: "all 150ms ease",
                      WebkitTapHighlightColor: "transparent",
                      touchAction: "manipulation" as any
                    }}
                  >
                    <Phone size={13} />
                    <span>Voice Agent</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSendMessage()}
                    disabled={!inputText.trim()}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 6,
                      backgroundColor: !inputText.trim() ? (isDark ? "#16283F" : "#E4E1DA") : "#3478F6",
                      color: !inputText.trim() ? (isDark ? "#8292A8" : "#98A2B3") : "#FFFFFF",
                      border: "none",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: !inputText.trim() ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      transition: "all 150ms ease"
                    }}
                  >
                    <span>Send</span>
                    <Send size={12} />
                  </button>
                </div>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 11, color: isDark ? "#8292A8" : "#98A2B3" }}>
              <span>Press <kbd style={{ padding: "1px 4px", borderRadius: 3, backgroundColor: isDark ? "#13243A" : "#E4E1DA" }}>Enter</kbd> to send, <kbd style={{ padding: "1px 4px", borderRadius: 3, backgroundColor: isDark ? "#13243A" : "#E4E1DA" }}>Shift + Enter</kbd> for new line</span>
              {messages.length > 0 && (
                <button
                  onClick={handleRetryLastMessage}
                  style={{ background: "transparent", border: "none", color: isDark ? "#4C8DFF" : "#356AE6", cursor: "pointer", fontSize: 11 }}
                >
                  ↺ Retry last response
                </button>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 3. "WHY?" MODAL (Evidence Transparency)                               */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {activeWhy && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            backgroundColor: isDark ? "rgba(3, 8, 16, 0.72)" : "rgba(22, 42, 67, 0.45)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16
          }}
          onClick={() => setActiveWhy(null)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 480,
              backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
              borderRadius: 12,
              border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
              padding: "20px 24px",
              boxShadow: isDark ? "0 24px 48px -12px rgba(0,0,0,0.5)" : "0 20px 40px -10px rgba(22,42,67,0.18)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>💡</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: isDark ? "#F2F6FC" : "#162A43" }}>
                  Why did Cognalyze recommend this?
                </span>
              </div>
              <button
                onClick={() => setActiveWhy(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: isDark ? "#8292A8" : "#98A2B3",
                  fontSize: 16,
                  cursor: "pointer"
                }}
              >
                ✕
              </button>
            </div>

            <div
              style={{
                backgroundColor: isDark ? "#13243A" : "#FAF9F6",
                border: `1px solid ${isDark ? "#263D57" : "#E4E1DA"}`,
                borderRadius: 8,
                padding: "14px",
                fontSize: 13,
                lineHeight: 1.6,
                color: isDark ? "#EAF0F8" : "#17191C"
              }}
            >
              {activeWhy}
            </div>

            <div style={{ marginTop: 14, fontSize: 11, color: isDark ? "#8292A8" : "#667085" }}>
              Recommendations are grounded strictly in your verified Student DNA, campus eligibility, and career milestones.
            </div>

            <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setActiveWhy(null)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 6,
                  backgroundColor: "#3478F6",
                  color: "#FFFFFF",
                  border: "none",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 4. RECENT SESSIONS DRAWER                                             */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {historyDrawerOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9998,
            backgroundColor: isDark ? "rgba(3, 8, 16, 0.65)" : "rgba(22, 42, 67, 0.35)",
            backdropFilter: "blur(4px)",
            display: "flex",
            justifyContent: "flex-end"
          }}
          onClick={() => setHistoryDrawerOpen(false)}
        >
          <div
            style={{
              width: 360,
              maxWidth: "85vw",
              height: "100%",
              backgroundColor: isDark ? "#0A1729" : "#FFFFFF",
              borderLeft: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: 14
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: isDark ? "#F2F6FC" : "#162A43" }}>
                Recent Conversations
              </div>
              <button
                onClick={() => setHistoryDrawerOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: isDark ? "#8292A8" : "#98A2B3",
                  fontSize: 16,
                  cursor: "pointer"
                }}
              >
                ✕
              </button>
            </div>

            {/* Search sessions input */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "8px 12px",
                borderRadius: 7,
                backgroundColor: isDark ? "#101F34" : "#F6F5F1",
                border: `1px solid ${isDark ? "#263D57" : "#E4E1DA"}`
              }}
            >
              <Search size={14} color={isDark ? "#8292A8" : "#98A2B3"} />
              <input
                type="text"
                value={searchHistoryQuery}
                onChange={(e) => setSearchHistoryQuery(e.target.value)}
                placeholder="Search conversations..."
                style={{
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontSize: 12,
                  color: isDark ? "#F2F6FC" : "#17191C",
                  width: "100%"
                }}
              />
            </div>

            {/* List */}
            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
              {filteredConversations.map((sess) => {
                const isCurrent = sess.id === activeSessionId;
                return (
                  <button
                    key={sess.id}
                    onClick={() => handleSelectSession(sess)}
                    style={{
                      textAlign: "left",
                      padding: "10px 12px",
                      borderRadius: 8,
                      backgroundColor: isCurrent
                        ? isDark
                          ? "rgba(52, 120, 246, 0.16)"
                          : "#EEF4FD"
                        : isDark
                        ? "#0E1B2E"
                        : "#FAF9F6",
                      border: isCurrent
                        ? `1px solid ${isDark ? "#3478F6" : "#356AE6"}`
                        : `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: 4
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: isDark ? "#F2F6FC" : "#17191C" }}>
                      {sess.title}
                    </div>
                    <div style={{ fontSize: 11, color: isDark ? "#8292A8" : "#667085" }}>
                      {sess.date} · {sess.messages.length} messages
                    </div>
                  </button>
                );
              })}

              {filteredConversations.length === 0 && (
                <div style={{ textAlign: "center", padding: "32px 0", color: isDark ? "#8292A8" : "#98A2B3", fontSize: 12 }}>
                  No matching conversations found.
                </div>
              )}
            </div>

            <button
              onClick={handleStartNewSession}
              style={{
                width: "100%",
                padding: "10px 0",
                borderRadius: 7,
                backgroundColor: "#3478F6",
                color: "#FFFFFF",
                border: "none",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              + New Conversation
            </button>
          </div>
        </div>
      )}

      {/* Persistent Learner Model & Cognitive State Drawer */}
      <LearnerModelDrawer
        isOpen={learnerDrawerOpen}
        onClose={() => setLearnerDrawerOpen(false)}
        studentId={candidateId}
      />

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* 6. VOICE AGENT OVERLAY — Full-Screen Immersive Voice Conversation     */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {voiceAgentOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 10000,
            background: isDark
              ? "radial-gradient(ellipse at center, #0A1F38 0%, #050E1A 70%)"
              : "radial-gradient(ellipse at center, #EEF4FD 0%, #D6E4F5 70%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-inter, -apple-system, BlinkMacSystemFont, sans-serif)"
          }}
        >
          {/* Close Button */}
          <button
            type="button"
            onClick={() => {
              setVoiceAgentOpen(false);
              setVoiceAgentState("idle");
              recognitionRef.current?.stop();
              setIsListening(false);
              setVoiceMode(false);
              voiceModeRef.current = false;
              setInterimTranscript("");
              if (voiceSilenceTimerRef.current) clearTimeout(voiceSilenceTimerRef.current);
              window.speechSynthesis?.cancel();
            }}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
              border: "none",
              borderRadius: 12,
              padding: "10px 14px",
              cursor: "pointer",
              color: isDark ? "#E2E8F0" : "#334155",
              fontSize: 13,
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
              transition: "all 150ms ease"
            }}
          >
            <PhoneOff size={16} />
            <span>End Call</span>
          </button>

          {/* Animated Voice Orb */}
          <div style={{ position: "relative", marginBottom: 48 }}>
            <style>{`
              @keyframes voicePulse {
                0%, 100% { transform: scale(1); opacity: 0.5; }
                50% { transform: scale(1.15); opacity: 0.8; }
              }
              @keyframes voicePulseOuter {
                0%, 100% { transform: scale(1); opacity: 0.2; }
                50% { transform: scale(1.3); opacity: 0.4; }
              }
              @keyframes voiceIdle {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.03); }
              }
              @keyframes thinkingDot {
                0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
                40% { opacity: 1; transform: scale(1.2); }
              }
            `}</style>

            {/* Outer pulse ring */}
            <div style={{
              position: "absolute",
              inset: -32,
              borderRadius: "50%",
              border: `2px solid ${voiceAgentState === "listening" ? "#3B82F6" : voiceAgentState === "speaking" ? "#10B981" : "transparent"}`,
              animation: voiceAgentState === "listening" || voiceAgentState === "speaking" ? "voicePulseOuter 2s ease-in-out infinite" : "none",
              pointerEvents: "none"
            }} />

            {/* Inner pulse ring */}
            <div style={{
              position: "absolute",
              inset: -16,
              borderRadius: "50%",
              background: voiceAgentState === "listening"
                ? "rgba(59, 130, 246, 0.12)"
                : voiceAgentState === "speaking"
                ? "rgba(16, 185, 129, 0.12)"
                : "transparent",
              animation: voiceAgentState === "listening" || voiceAgentState === "speaking" ? "voicePulse 1.5s ease-in-out infinite" : "none",
              pointerEvents: "none"
            }} />

            {/* Main Orb */}
            <button
              type="button"
              onClick={() => {
                if (voiceAgentState === "idle" || voiceAgentState === "speaking") {
                  // Start listening
                  window.speechSynthesis?.cancel();
                  setVoiceAgentState("listening");
                  toggleListening();
                } else if (voiceAgentState === "listening") {
                  // Stop listening
                  recognitionRef.current?.stop();
                  setIsListening(false);
                  setVoiceMode(false);
                  voiceModeRef.current = false;
                  setVoiceAgentState("idle");
                }
              }}
              style={{
                width: 140,
                height: 140,
                borderRadius: "50%",
                border: "none",
                cursor: "pointer",
                background: voiceAgentState === "listening"
                  ? "linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)"
                  : voiceAgentState === "speaking"
                  ? "linear-gradient(135deg, #10B981 0%, #059669 100%)"
                  : voiceAgentState === "thinking"
                  ? "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
                  : isDark
                  ? "linear-gradient(135deg, #1E3A5F 0%, #0F2035 100%)"
                  : "linear-gradient(135deg, #3478F6 0%, #2563EB 100%)",
                boxShadow: voiceAgentState === "listening"
                  ? "0 0 60px rgba(59, 130, 246, 0.4), 0 12px 40px rgba(59, 130, 246, 0.3)"
                  : voiceAgentState === "speaking"
                  ? "0 0 60px rgba(16, 185, 129, 0.4), 0 12px 40px rgba(16, 185, 129, 0.3)"
                  : "0 12px 40px rgba(0, 0, 0, 0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 300ms ease",
                animation: voiceAgentState === "idle" ? "voiceIdle 3s ease-in-out infinite" : "none"
              }}
            >
              {voiceAgentState === "listening" ? (
                <Mic size={48} color="#FFFFFF" />
              ) : voiceAgentState === "speaking" ? (
                <Volume2 size={48} color="#FFFFFF" />
              ) : voiceAgentState === "thinking" ? (
                <div style={{ display: "flex", gap: 8 }}>
                  {[0, 1, 2].map((d) => (
                    <div key={d} style={{
                      width: 10, height: 10, borderRadius: "50%",
                      backgroundColor: "#FFFFFF",
                      animation: `thinkingDot 1.2s ease-in-out ${d * 0.15}s infinite`
                    }} />
                  ))}
                </div>
              ) : (
                <Mic size={48} color="#FFFFFF" style={{ opacity: 0.8 }} />
              )}
            </button>
          </div>

          {/* State Label */}
          <div style={{
            fontSize: 18,
            fontWeight: 700,
            color: isDark ? "#F2F6FC" : "#162A43",
            marginBottom: 8,
            letterSpacing: "-0.01em"
          }}>
            {voiceAgentState === "listening" ? "Listening..." :
             voiceAgentState === "thinking" ? "Thinking..." :
             voiceAgentState === "speaking" ? "Mentor is speaking..." :
             "Tap to start speaking"}
          </div>

          <div style={{
            fontSize: 13,
            color: isDark ? "#8292A8" : "#667085",
            marginBottom: 32,
            textAlign: "center",
            maxWidth: 400
          }}>
            {voiceAgentState === "listening"
              ? "Speak naturally. I'll send your message after a short pause."
              : voiceAgentState === "thinking"
              ? "Processing your question with Student DNA context..."
              : voiceAgentState === "speaking"
              ? "Tap the orb to interrupt and ask something else."
              : "Your AI mentor is ready for a voice conversation."}
          </div>

          {/* Live Transcript Display */}
          {(inputText || interimTranscript) && (
            <div style={{
              maxWidth: 600,
              width: "90%",
              padding: "16px 20px",
              borderRadius: 12,
              backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
              border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
              marginBottom: 24,
              textAlign: "center"
            }}>
              <div style={{
                fontSize: 15,
                color: isDark ? "#E2E8F0" : "#1E293B",
                lineHeight: 1.6
              }}>
                {inputText}
                {interimTranscript && (
                  <span style={{ color: isDark ? "#64748B" : "#94A3B8", fontStyle: "italic" }}>
                    {inputText ? " " : ""}{interimTranscript}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Last Mentor Response (if any) */}
          {messages.length > 0 && messages[messages.length - 1].role === "mentor" && (
            <div style={{
              maxWidth: 600,
              width: "90%",
              padding: "16px 20px",
              borderRadius: 12,
              backgroundColor: isDark ? "rgba(52, 120, 246, 0.08)" : "rgba(52, 120, 246, 0.06)",
              border: `1px solid ${isDark ? "rgba(52, 120, 246, 0.15)" : "rgba(52, 120, 246, 0.12)"}`,
              textAlign: "left",
              maxHeight: 200,
              overflowY: "auto"
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#73A6FF" : "#3478F6", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Mentor Response
              </div>
              <div style={{
                fontSize: 13,
                color: isDark ? "#CBD5E1" : "#334155",
                lineHeight: 1.6
              }}>
                {messages[messages.length - 1].content.slice(0, 500)}
                {messages[messages.length - 1].content.length > 500 && "..."}
              </div>
            </div>
          )}

          {/* Bottom hint */}
          <div style={{
            position: "absolute",
            bottom: 24,
            fontSize: 11,
            color: isDark ? "#64748B" : "#94A3B8",
            display: "flex",
            alignItems: "center",
            gap: 6
          }}>
            <span>Press</span>
            <kbd style={{
              padding: "2px 6px",
              borderRadius: 4,
              backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
              fontSize: 10,
              fontWeight: 600
            }}>Esc</kbd>
            <span>to exit voice mode</span>
          </div>
        </div>
      )}
    </div>
  );
}
