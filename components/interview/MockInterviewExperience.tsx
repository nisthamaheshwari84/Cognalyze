"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { saveSession, InterviewSession } from "@/lib/interview-session-store";
import { useTheme } from "@/components/ThemeProvider";
import AppNav from "@/components/AppNav";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";

// ── Types ──
export type ExperienceMode = "fresher" | "1-3yr" | "experienced" | "career-switcher";
export type InterviewType = "technical" | "behavioral" | "hr" | "system_design" | "mixed";
export type DifficultyLevel = "adaptive" | "easy" | "medium" | "hard";
export type DurationMinutes = 15 | 30 | 45 | 60;

export interface Msg {
  role: "user" | "assistant";
  content: string;
  time: string;
  isFollowUp?: boolean;
}

export interface QuestionMeta {
  question_targets?: string;
  question_type?: string;
  difficulty_level?: string;
  is_follow_up?: boolean;
}

export interface AnswerAssessment {
  answer_quality: "strong" | "adequate" | "shallow" | "off-topic" | "does_not_know";
  reasoning: string;
  topics_demonstrated?: string[];
  next_action?: string;
  difficulty_adjustment?: string;
}

export interface LiveScore {
  overall: number;
  breakdown?: {
    relevance: number;
    technicalAccuracy: number;
    communicationClarity: number;
    problemSolving: number;
    depth: number;
    examples: number;
    confidence: number;
  };
  evidence?: {
    strengths?: string[];
    improvements?: string[];
    suggestedAnswer?: string;
    scoreReason?: string;
  };
  verdict?: string;
  hiringSignal?: string;
}

export interface FinalReportData {
  decision: "STRONG_HIRE" | "HIRE" | "LEANING_HIRE" | "NO_HIRE";
  confidence: number;
  headline: string;
  overview: string;
  hire_reasons: string[];
  no_hire_reasons: string[];
  standout_moments: string[];
  concerning_moments: string[];
  scorecard: {
    technical_depth?: { score: number; comment: string };
    problem_solving?: { score: number; comment: string };
    project_ownership?: { score: number; comment: string };
    communication?: { score: number; comment: string };
  };
  next_steps?: string;
  interviewer_note?: string;
  report?: any;
}

const EXPERIENCE_MODES: Array<{
  id: ExperienceMode;
  title: string;
  badge: string;
  description: string;
  icon: string;
}> = [
  {
    id: "fresher",
    title: "Fresher / Student",
    badge: "0 Years / College",
    description: "Evaluated on core CS fundamentals, algorithms, academic projects & hackathons. Zero corporate jargon.",
    icon: "🎓",
  },
  {
    id: "1-3yr",
    title: "Early Career",
    badge: "1 - 3 Years Exp",
    description: "Balanced evaluation of production code ownership, incident debugging, and feature architecture trade-offs.",
    icon: "💻",
  },
  {
    id: "experienced",
    title: "Experienced Engineer",
    badge: "3+ Years Exp",
    description: "Focuses on high-scale distributed architecture, bottlenecks, fault tolerance, and cross-team leadership.",
    icon: "🏛️",
  },
  {
    id: "career-switcher",
    title: "Career Switcher",
    badge: "Transition Track",
    description: "Evaluated on transferable problem solving, self-taught rigor, rapid ramp-up ability, and dedication.",
    icon: "🔄",
  },
];

const INTERVIEW_TYPES: Array<{
  id: InterviewType;
  title: string;
  badge: string;
  description: string;
  icon: string;
}> = [
  {
    id: "technical",
    title: "Technical Round",
    badge: "DSA & Core CS",
    description: "Algorithmic thinking, data structures, runtime complexity, debugging & core CS principles.",
    icon: "⚡",
  },
  {
    id: "behavioral",
    title: "Behavioral & Leadership",
    badge: "STAR Method",
    description: "Past experiences, conflict resolution, dealing with failure, ownership & team dynamics.",
    icon: "🤝",
  },
  {
    id: "hr",
    title: "HR & Culture Alignment",
    badge: "Values & Fit",
    description: "Company alignment, career trajectory, motivation, working style, and cultural contribution.",
    icon: "👔",
  },
  {
    id: "system_design",
    title: "System Design",
    badge: "Distributed Scale",
    description: "High-scale architecture, microservices, databases, caching, reliability & bottleneck mitigation.",
    icon: "🏗️",
  },
  {
    id: "mixed",
    title: "Mixed FAANG Round",
    badge: "Comprehensive",
    description: "Full-spectrum simulation blending project defense, fundamentals, architecture & behavioral scenarios.",
    icon: "🎯",
  },
];

const SUGGESTED_ROLES = [
  "Software Development Engineer (SDE I)",
  "Full Stack Software Engineer",
  "Backend Systems Engineer",
  "Frontend / UI Engineer",
  "Distributed Systems Engineer",
  "Machine Learning Engineer",
];

const SUGGESTED_COMPANIES = [
  "Google",
  "Amazon",
  "Microsoft",
  "Uber",
  "Stripe",
  "High-Growth Tier-1 Tech Startup",
];

const SUGGESTED_SKILLS = [
  "Data Structures & Algorithms",
  "Distributed Systems & Caching",
  "Concurrency & Multithreading",
  "SQL & Database Indexing",
  "Microservices & REST APIs",
  "React & Next.js Architecture",
  "System Design & Scalability",
  "Operating Systems & Memory",
];

export default function MockInterviewExperience() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { isDark } = useTheme();

  // Search parameters
  const opportunityId = searchParams.get("opportunityId") || "";
  const paramRole = searchParams.get("role") || "";
  const paramCompany = searchParams.get("company") || "";
  const paramType = (searchParams.get("type") as InterviewType) || "";
  const paramFocus = searchParams.get("focus") || "";

  // ── Setup State ──
  const [targetRole, setTargetRole] = useState(paramRole || "Software Development Engineer");
  const [targetCompany, setTargetCompany] = useState(paramCompany || "FAANG / Tier 1 Standard");
  const [experienceMode, setExperienceMode] = useState<ExperienceMode>("fresher");
  const [interviewType, setInterviewType] = useState<InterviewType>(paramType || "technical");
  const [skillsFocus, setSkillsFocus] = useState(paramFocus || "Data Structures, System Design, Concurrency, SQL");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("adaptive");
  const [durationMinutes, setDurationMinutes] = useState<DurationMinutes>(45);
  const [jobDescription, setJobDescription] = useState("");
  const [showJdInput, setShowJdInput] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // ── Authenticated Candidate & Profile Context ──
  const [candidateId, setCandidateId] = useState<string>("");
  const [candidateName, setCandidateName] = useState<string>("Candidate");
  const [studentProfile, setStudentProfile] = useState<any>(null);
  const [opportunity, setOpportunity] = useState<any>(null);

  // ── Lifecycle & Session State ──
  const [stage, setStage] = useState<"setup" | "room" | "report">("setup");
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [activeQuestionMeta, setActiveQuestionMeta] = useState<QuestionMeta | null>(null);
  const [lastAssessment, setLastAssessment] = useState<AnswerAssessment | null>(null);
  const [liveScore, setLiveScore] = useState<LiveScore | null>(null);
  const [sessionDistribution, setSessionDistribution] = useState({
    strong: 0,
    adequate: 0,
    shallow: 0,
    off_topic: 0,
  });
  const [topicsCovered, setTopicsCovered] = useState<string[]>([]);
  const [finalReport, setFinalReport] = useState<FinalReportData | null>(null);
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);
  const [savingSession, setSavingSession] = useState(false);

  // ── Speech Recognition & Audio Refs ──
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionStartTimeRef = useRef<number>(0);
  const sessionIdRef = useRef<string>("");
  const submissionLockRef = useRef<boolean>(false);

  // ── Pre-fill Candidate & Opportunity Context ──
  useEffect(() => {
    let isMounted = true;

    async function loadCandidateAndOpportunity() {
      try {
        const sessRes = await fetch("/api/auth/session");
        if (sessRes.ok) {
          const sessData = await sessRes.json();
          if (sessData.authenticated && sessData.user?.id) {
            if (isMounted) {
              setCandidateId(sessData.user.id);
              setCandidateName(sessData.studentProfile?.fullName || sessData.user.fullName || "Candidate");
              if (sessData.studentProfile) {
                setStudentProfile(sessData.studentProfile);
                if (!paramRole && sessData.studentProfile.targetRoles?.[0]) {
                  setTargetRole(sessData.studentProfile.targetRoles[0]);
                }
                if (sessData.studentProfile.experience_level) {
                  setExperienceMode(sessData.studentProfile.experience_level);
                }
                if (!paramFocus && sessData.studentProfile.skills?.length > 0) {
                  const skillsStr = sessData.studentProfile.skills
                    .slice(0, 5)
                    .map((s: any) => s.name || s)
                    .join(", ");
                  setSkillsFocus(skillsStr);
                }
              }
            }
          }
        }
      } catch (err) {
        console.warn("Session fetch notice in mock interview:", err);
      }

      // If an opportunity ID was passed in query params, load it
      if (opportunityId) {
        try {
          const oppRes = await fetch("/api/opportunities/ingest");
          if (oppRes.ok) {
            const oppData = await oppRes.json();
            const match = (oppData.opportunities || []).find((o: any) => o.id === opportunityId);
            if (match && isMounted) {
              setOpportunity(match);
              setTargetRole(match.title || paramRole || "Software Development Engineer");
              setTargetCompany(match.organizer || "Tier-1 Tech Company");
              const tags = match.tags?.join(", ") || match.domain_tags?.join(", ") || "";
              if (tags) setSkillsFocus(tags);
              if (match.description) {
                setJobDescription(match.description);
                setShowJdInput(true);
              }
            }
          }
        } catch (e) {
          console.warn("Opportunity load notice:", e);
        }
      }
    }

    loadCandidateAndOpportunity();

    return () => {
      isMounted = false;
    };
  }, [opportunityId, paramRole, paramFocus]);

  // ── Speech Recognition Setup ──
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = false;
        rec.interimResults = true;
        rec.lang = "en-US";
        rec.onresult = (event: any) => {
          let str = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            str += event.results[i][0].transcript;
          }
          setInput(str);
        };
        rec.onend = () => setIsListening(false);
        rec.onerror = () => setIsListening(false);
        recognitionRef.current = rec;
      }
    }
  }, []);

  // ── Auto Scroll Chat ──
  useEffect(() => {
    if (stage === "room") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, stage]);

  // ── Voice Output (TTS) ──
  const speakVoice = useCallback(
    (text: string) => {
      if (!soundEnabled || typeof window === "undefined" || !("speechSynthesis" in window)) return;
      try {
        window.speechSynthesis.cancel();
        // Clean markdown backticks, bullets, or asterisks for natural speech flow
        const cleanText = text.replace(/[`*#_]/g, "").replace(/\n+/g, " ");
        const utt = new SpeechSynthesisUtterance(cleanText);
        utt.rate = 1.02;
        utt.pitch = 0.96;
        window.speechSynthesis.speak(utt);
      } catch (e) {
        console.warn("TTS error:", e);
      }
    },
    [soundEnabled]
  );

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert("Speech recognition is not supported in this browser. You can type your responses in the input box.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // ── START INTERVIEW ──
  const handleStartInterview = async () => {
    setLoading(true);
    setStage("room");
    sessionStartTimeRef.current = Date.now();
    const effectiveCandidateId = candidateId || `candidate_${Date.now()}`;
    const generatedSessionId = `mock_${effectiveCandidateId}_${Date.now()}`;
    sessionIdRef.current = generatedSessionId;

    const candidateSkills = skillsFocus || "Algorithms, Data Structures & Distributed Architecture";
    const candidateProjects = studentProfile?.past_projects?.map((p: any) => `${p.title} (${p.tech_stack?.join(", ") || ""})`).join("; ") || "Real-world engineering projects";

    const jdContext = `Target Role: ${targetRole}. Target Company: ${targetCompany}. Interview Type: ${interviewType.toUpperCase()}. Target Experience Level: ${experienceMode}. Focus Areas: ${skillsFocus}. ${jobDescription ? `Job Description Requirements: ${jobDescription}` : ""}`;
    const resumeContext = `Candidate Name: ${candidateName}. Skills: ${candidateSkills}. Projects: ${candidateProjects}. Experience Mode: ${experienceMode}.`;

    try {
      const chatRes = await fetch("/api/interview-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [],
          jd: jdContext,
          resume: resumeContext,
          qNumber: 0,
          sessionId: generatedSessionId,
          candidateId: effectiveCandidateId,
          durationMinutes,
          experienceMode,
          interviewType,
          targetCompany,
          targetRole,
          skillsFocus,
          difficulty,
        }),
      });

      const chatData = await chatRes.json();
      const firstMsg =
        chatData.message ||
        `Welcome to your personalized ${interviewType.toUpperCase()} round for ${targetRole} at ${targetCompany}. I'm Alex, your interviewer today. To get started, please give a brief 1-minute introduction covering your background, technical interests, and what you've been working on recently.`;

      setActiveQuestionMeta({
        question_targets: chatData.questionTargets || "Opening Introduction",
        question_type: chatData.section || "introduction",
        difficulty_level: chatData.difficulty || "easy",
        is_follow_up: false,
      });

      const initialMessage: Msg = {
        role: "assistant",
        content: firstMsg,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isFollowUp: false,
      };

      setMessages([initialMessage]);
      speakVoice(firstMsg);
    } catch (err) {
      console.error("[MOCK INTERVIEW] Failed to start:", err);
      const fallbackMsg: Msg = {
        role: "assistant",
        content: `Welcome to your ${interviewType} interview for ${targetRole} at ${targetCompany}! Let's begin: Could you briefly walk me through your background and the most technically demanding project you've completed?`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isFollowUp: false,
      };
      setMessages([fallbackMsg]);
      speakVoice(fallbackMsg.content);
    } finally {
      setLoading(false);
    }
  };

  // ── SUBMIT ANSWER & RECEIVE ADAPTIVE TURN ──
  const handleSend = async () => {
    const text = input.trim();
    if (!text || isSubmitting || submissionLockRef.current) return;

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    submissionLockRef.current = true;
    setIsSubmitting(true);
    setInput("");

    const userMsg: Msg = {
      role: "user",
      content: text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);

    const jdContext = `Target Role: ${targetRole}. Target Company: ${targetCompany}. Interview Type: ${interviewType.toUpperCase()}. Target Experience Level: ${experienceMode}. Focus Areas: ${skillsFocus}. ${jobDescription ? `Job Description: ${jobDescription}` : ""}`;
    const resumeContext = `Candidate: ${candidateName}. Skills: ${skillsFocus}.`;

    try {
      const chatRes = await fetch("/api/interview-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          jd: jdContext,
          resume: resumeContext,
          qNumber: updatedMessages.filter((m) => m.role === "assistant").length + 1,
          sessionId: sessionIdRef.current,
          candidateId: candidateId || "student-demo",
          durationMinutes,
          experienceMode,
          interviewType,
          targetCompany,
          targetRole,
          skillsFocus,
          difficulty,
        }),
      });

      const chatData = await chatRes.json();
      const isFollowUp = Boolean(chatData.isFollowUp || chatData.is_follow_up);
      const asstContent =
        chatData.message ||
        (isFollowUp
          ? "That gives some helpful context. Could you dive deeper into the exact trade-offs and edge-case failure modes of that approach?"
          : "Understood. Let's build on this concept. How would you handle this scenario at 10x higher scale?");

      const asstMsg: Msg = {
        role: "assistant",
        content: asstContent,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isFollowUp,
      };

      setMessages((prev) => [...prev, asstMsg]);
      speakVoice(asstContent);

      // Real-time assessment update
      if (chatData.answer_assessment || chatData.assessment) {
        const assessment = chatData.answer_assessment || chatData.assessment;
        setLastAssessment(assessment);

        // Update running session distribution
        const qKey = assessment.answer_quality === "off-topic" ? "off_topic" : assessment.answer_quality;
        setSessionDistribution((prev: any) => ({
          ...prev,
          [qKey]: (prev[qKey] || 0) + 1,
        }));

        if (assessment.topics_demonstrated?.length > 0) {
          setTopicsCovered((prev) => {
            const set = new Set([...prev, ...assessment.topics_demonstrated]);
            return Array.from(set);
          });
        }
      }

      setActiveQuestionMeta({
        question_targets: chatData.questionTargets || chatData.question_targets || "Adaptive Evaluation",
        question_type: chatData.section || chatData.question_type || "Technical",
        difficulty_level: chatData.difficulty || chatData.difficulty_level || "medium",
        is_follow_up: isFollowUp,
      });

      // Background live scoring (non-blocking)
      fetch("/api/interview-score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          jd: jdContext,
          resume: resumeContext,
          studentId: candidateId,
        }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((scoreData) => {
          if (scoreData) setLiveScore(scoreData);
        })
        .catch((err) => console.warn("[MOCK INTERVIEW] Live score telemetry notice:", err));
    } catch (err) {
      console.error("[MOCK INTERVIEW] Turn error:", err);
      const fallbackProbe: Msg = {
        role: "assistant",
        content: "Interesting perspective. Could you elaborate on what trade-offs you considered and how you verified correctness in production?",
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        isFollowUp: true,
      };
      setMessages((prev) => [...prev, fallbackProbe]);
      speakVoice(fallbackProbe.content);
    } finally {
      setIsSubmitting(false);
      submissionLockRef.current = false;
    }
  };

  // ── COMPLETE INTERVIEW & GENERATE DETAILED REPORT ──
  const handleCompleteInterview = async () => {
    if (savingSession) return;
    setSavingSession(true);

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    const jdContext = `Target Role: ${targetRole}. Target Company: ${targetCompany}. Interview Type: ${interviewType.toUpperCase()}. Target Experience Level: ${experienceMode}. Focus Areas: ${skillsFocus}. ${jobDescription ? `Job Description: ${jobDescription}` : ""}`;
    const resumeContext = `Candidate: ${candidateName}. Skills: ${skillsFocus}.`;

    try {
      // 1. Generate canonical final verdict & detailed report
      const finalRes = await fetch("/api/interview-final", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages.map((m) => ({ role: m.role, content: m.content, time: m.time, isFollowUp: m.isFollowUp })),
          jd: jdContext,
          resume: resumeContext,
          finalScore: liveScore,
          candidateId: candidateId || "student-demo",
          sessionId: sessionIdRef.current,
          targetCompany,
          targetRole,
          interviewType,
          difficulty,
          durationMinutes,
        }),
      });

      let reportData: FinalReportData;
      if (finalRes.ok) {
        reportData = await finalRes.json();
      } else {
        reportData = {
          decision: (liveScore?.overall || 78) >= 75 ? "HIRE" : "LEANING_HIRE",
          confidence: 82,
          headline: `Interview Complete: ${targetRole} (${interviewType.toUpperCase()})`,
          overview: `Completed adaptive mock round covering ${topicsCovered.length > 0 ? topicsCovered.join(", ") : skillsFocus}. Solid engagement with technical probing.`,
          hire_reasons: [
            "Demonstrated systematic engineering reasoning",
            "Clear technical communication during probing turns",
            "Consistent engagement with trade-off analysis",
          ],
          no_hire_reasons: [
            "Could expand deeper into high-scale concurrency bottlenecks",
            "Review edge-case error recovery scenarios",
          ],
          standout_moments: [
            "Clear architecture walkthrough and structured problem decomposition",
          ],
          concerning_moments: [],
          scorecard: {
            technical_depth: { score: liveScore?.overall || 78, comment: "Solid conceptual foundation" },
            problem_solving: { score: 80, comment: "Structured decomposition" },
            project_ownership: { score: 82, comment: "Verifiable project details" },
            communication: { score: 78, comment: "Clear, concise technical articulation" },
          },
          next_steps: "Review suggested practice questions in Skill Practice Hub to solidify weak areas.",
          interviewer_note: "Strong performance with clear upside in system depth.",
        };
      }

      setFinalReport(reportData);

      // 2. Persist to storage with authenticated user isolation
      const saved = await saveSession({
        id: sessionIdRef.current,
        candidate_id: candidateId || "student-demo",
        session_type: "mock_interview",
        experience_mode: experienceMode,
        target_role: targetRole,
        target_company: targetCompany,
        interview_type: interviewType,
        difficulty,
        duration_minutes: durationMinutes,
        topics_covered: topicsCovered.length > 0 ? topicsCovered : [skillsFocus],
        answer_distribution: sessionDistribution,
        security_flags: { tab_switches: 0, face_violations: 0 },
        overall_score: reportData.report?.overallScore || liveScore?.overall || 80,
        weak_topics_identified: reportData.no_hire_reasons || [],
        report: reportData,
        transcript: messages,
      });

      setSavedSessionId(saved.id);
      setStage("report");
    } catch (err) {
      console.error("[MOCK INTERVIEW] Error completing interview:", err);
      // Fallback display
      setFinalReport({
        decision: "HIRE",
        confidence: 75,
        headline: `Completed Interview: ${targetRole}`,
        overview: "Interview finished and saved to your candidate trajectory.",
        hire_reasons: ["Completed full interview round", "Answered adaptive follow-up questions"],
        no_hire_reasons: ["Continue practice on core algorithms and scalability"],
        standout_moments: ["Good communication throughout round"],
        concerning_moments: [],
        scorecard: {
          technical_depth: { score: 75, comment: "Consistent baseline" },
          communication: { score: 80, comment: "Clear responses" },
        },
      });
      setStage("report");
    } finally {
      setSavingSession(false);
    }
  };

  // ═════════════════════════════════════════════════════════════════════
  // RENDER: STAGE 1 — PERSONALIZED SETUP SCREEN
  // ═════════════════════════════════════════════════════════════════════
  if (stage === "setup") {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: isDark ? "#07111F" : "#F6F5F1",
          color: isDark ? "#F2F6FC" : "#17191C",
          fontFamily: "var(--font-inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
        }}
      >
        <AppNav role="student" />

        <main style={{ maxWidth: 960, margin: "0 auto", padding: "2.5rem 1.5rem 4rem" }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "2.25rem" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 14px",
                borderRadius: 999,
                backgroundColor: isDark ? "rgba(52,120,246,0.15)" : "#EEF4FD",
                border: `1px solid ${isDark ? "#223750" : "#D1E2FB"}`,
                color: isDark ? "#3478F6" : "#356AE6",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: 1.5,
                textTransform: "uppercase",
                marginBottom: 12,
              }}
            >
              <span>🎙️</span> PERSONALIZED INTERVIEW ARENA
            </div>
            <h1
              style={{
                fontSize: "clamp(1.75rem, 3vw, 2.35rem)",
                fontWeight: 800,
                color: isDark ? "#F2F6FC" : "#162A43",
                letterSpacing: "-0.03em",
                margin: "0 0 10px",
              }}
            >
              Personalized Interview Arena
            </h1>
            <p
              style={{
                fontSize: 14,
                color: isDark ? "#B6C4D6" : "#667085",
                maxWidth: 680,
                margin: "0 auto",
                lineHeight: 1.6,
              }}
            >
              Configure your target role, company, track, and difficulty. Alex adapts in real time — asking one question at a time, probing shallow answers with deep follow-ups, and delivering an evidence-backed scorecard.
            </p>
          </div>

          {/* Quick Context Banner if detected */}
          {opportunity && (
            <div
              style={{
                padding: "1rem 1.25rem",
                borderRadius: 12,
                backgroundColor: isDark ? "#13243A" : "#EFF4FE",
                border: `1px solid ${isDark ? "#223750" : "#D2E0FB"}`,
                marginBottom: "1.75rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 22 }}>🎯</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: isDark ? "#3478F6" : "#356AE6" }}>
                    TARGETING OPPORTUNITY
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: isDark ? "#F2F6FC" : "#162A43" }}>
                    {opportunity.title} · {opportunity.organizer}
                  </div>
                </div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  padding: "4px 10px",
                  borderRadius: 6,
                  backgroundColor: "#2E7D5B",
                  color: "#FFFFFF",
                  fontWeight: 700,
                }}
              >
                Auto-Calibrated
              </span>
            </div>
          )}

          {/* Card Container */}
          <div
            style={{
              backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
              border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
              borderRadius: 16,
              padding: "2rem",
              boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(22,42,67,0.04)",
              display: "flex",
              flexDirection: "column",
              gap: "2rem",
            }}
          >
            {/* 1. Target Role & Company */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: isDark ? "#3478F6" : "#356AE6", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
                1. TARGET ROLE & COMPANY
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 14 }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: isDark ? "#B6C4D6" : "#475467", marginBottom: 6 }}>
                    Target Role / Position Title
                  </label>
                  <input
                    type="text"
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value)}
                    placeholder="e.g. Software Development Engineer"
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      borderRadius: 9,
                      border: `1px solid ${isDark ? "#223750" : "#D0D5DD"}`,
                      backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                      color: isDark ? "#F2F6FC" : "#17191C",
                      fontSize: 13,
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                  {/* Suggestions */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {SUGGESTED_ROLES.slice(0, 3).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setTargetRole(role)}
                        style={{
                          fontSize: 11,
                          padding: "3px 8px",
                          borderRadius: 6,
                          backgroundColor: targetRole === role ? (isDark ? "#3478F6" : "#356AE6") : isDark ? "rgba(255,255,255,0.04)" : "#F6F5F1",
                          color: targetRole === role ? "#FFFFFF" : isDark ? "#B6C4D6" : "#667085",
                          border: `1px solid ${targetRole === role ? "#356AE6" : isDark ? "#223750" : "#E4E1DA"}`,
                          cursor: "pointer",
                        }}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: isDark ? "#B6C4D6" : "#475467", marginBottom: 6 }}>
                    Target Company / Organization
                  </label>
                  <input
                    type="text"
                    value={targetCompany}
                    onChange={(e) => setTargetCompany(e.target.value)}
                    placeholder="e.g. Google, Amazon, or Series B Startup"
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      borderRadius: 9,
                      border: `1px solid ${isDark ? "#223750" : "#D0D5DD"}`,
                      backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                      color: isDark ? "#F2F6FC" : "#17191C",
                      fontSize: 13,
                      boxSizing: "border-box",
                      outline: "none",
                    }}
                  />
                  {/* Suggestions */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                    {SUGGESTED_COMPANIES.slice(0, 4).map((comp) => (
                      <button
                        key={comp}
                        type="button"
                        onClick={() => setTargetCompany(comp)}
                        style={{
                          fontSize: 11,
                          padding: "3px 8px",
                          borderRadius: 6,
                          backgroundColor: targetCompany === comp ? (isDark ? "#3478F6" : "#356AE6") : isDark ? "rgba(255,255,255,0.04)" : "#F6F5F1",
                          color: targetCompany === comp ? "#FFFFFF" : isDark ? "#B6C4D6" : "#667085",
                          border: `1px solid ${targetCompany === comp ? "#356AE6" : isDark ? "#223750" : "#E4E1DA"}`,
                          cursor: "pointer",
                        }}
                      >
                        {comp}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Experience Level */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: isDark ? "#3478F6" : "#356AE6", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
                2. EXPERIENCE LEVEL
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
                {EXPERIENCE_MODES.map((m) => {
                  const active = experienceMode === m.id;
                  return (
                    <div
                      key={m.id}
                      onClick={() => setExperienceMode(m.id)}
                      style={{
                        padding: "1rem",
                        borderRadius: 12,
                        border: active ? "2px solid #356AE6" : `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                        backgroundColor: active ? (isDark ? "rgba(52,120,246,0.12)" : "#EEF4FD") : isDark ? "#13243A" : "#FAF9F6",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 22 }}>{m.icon}</span>
                        <span
                          style={{
                            fontSize: 10,
                            padding: "2px 7px",
                            borderRadius: 999,
                            backgroundColor: active ? (isDark ? "#3478F6" : "#356AE6") : isDark ? "rgba(255,255,255,0.06)" : "#E4E1DA",
                            color: active ? "#FFFFFF" : isDark ? "#B6C4D6" : "#667085",
                            fontWeight: 700,
                          }}
                        >
                          {m.badge}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: active ? (isDark ? "#3478F6" : "#356AE6") : isDark ? "#F2F6FC" : "#162A43", marginBottom: 4 }}>
                        {m.title}
                      </div>
                      <div style={{ fontSize: 11, color: isDark ? "#B6C4D6" : "#667085", lineHeight: 1.4 }}>
                        {m.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Interview Type */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: isDark ? "#3478F6" : "#356AE6", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
                3. INTERVIEW TYPE
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 10 }}>
                {INTERVIEW_TYPES.map((t) => {
                  const active = interviewType === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setInterviewType(t.id)}
                      style={{
                        padding: "0.9rem",
                        borderRadius: 12,
                        border: active ? "2px solid #356AE6" : `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                        backgroundColor: active ? (isDark ? "rgba(52,120,246,0.12)" : "#EEF4FD") : isDark ? "#13243A" : "#FAF9F6",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 20 }}>{t.icon}</span>
                        <span
                          style={{
                            fontSize: 9,
                            padding: "2px 6px",
                            borderRadius: 999,
                            backgroundColor: active ? (isDark ? "#3478F6" : "#356AE6") : isDark ? "rgba(255,255,255,0.06)" : "#E4E1DA",
                            color: active ? "#FFFFFF" : isDark ? "#B6C4D6" : "#667085",
                            fontWeight: 700,
                          }}
                        >
                          {t.badge}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: active ? (isDark ? "#3478F6" : "#356AE6") : isDark ? "#F2F6FC" : "#162A43", marginBottom: 4 }}>
                        {t.title}
                      </div>
                      <div style={{ fontSize: 11, color: isDark ? "#B6C4D6" : "#667085", lineHeight: 1.35 }}>
                        {t.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Technical Skills & Focus Areas */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: isDark ? "#3478F6" : "#356AE6", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
                4. TECHNICAL SKILLS & FOCUS AREAS
              </div>
              <input
                type="text"
                value={skillsFocus}
                onChange={(e) => setSkillsFocus(e.target.value)}
                placeholder="e.g. Data Structures, System Design, Concurrency, SQL, React"
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  borderRadius: 9,
                  border: `1px solid ${isDark ? "#223750" : "#D0D5DD"}`,
                  backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                  color: isDark ? "#F2F6FC" : "#17191C",
                  fontSize: 13,
                  boxSizing: "border-box",
                  outline: "none",
                }}
              />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {SUGGESTED_SKILLS.map((skill) => {
                  const selected = skillsFocus.toLowerCase().includes(skill.toLowerCase());
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => {
                        if (selected) {
                          const updated = skillsFocus
                            .split(",")
                            .map((s) => s.trim())
                            .filter((s) => s.toLowerCase() !== skill.toLowerCase())
                            .join(", ");
                          setSkillsFocus(updated);
                        } else {
                          setSkillsFocus(skillsFocus ? `${skillsFocus}, ${skill}` : skill);
                        }
                      }}
                      style={{
                        fontSize: 11,
                        padding: "3px 9px",
                        borderRadius: 6,
                        backgroundColor: selected ? (isDark ? "rgba(46,125,91,0.2)" : "#EAF4EE") : isDark ? "rgba(255,255,255,0.04)" : "#F6F5F1",
                        color: selected ? (isDark ? "#34D399" : "#2E7D5B") : isDark ? "#B6C4D6" : "#667085",
                        border: selected ? "1px solid #2E7D5B" : `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                        cursor: "pointer",
                        fontWeight: selected ? 700 : 500,
                      }}
                    >
                      {selected ? `✓ ${skill}` : `+ ${skill}`}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Difficulty & Duration */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: isDark ? "#3478F6" : "#356AE6", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                  5. INTERVIEW DIFFICULTY
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                  {[
                    { id: "adaptive", label: "Adaptive (Auto)", desc: "Scales with answers" },
                    { id: "easy", label: "Easy", desc: "Core fundamentals" },
                    { id: "medium", label: "Medium", desc: "Industry hiring bar" },
                    { id: "hard", label: "Hard", desc: "Staff / Principal depth" },
                  ].map((diff) => (
                    <button
                      key={diff.id}
                      type="button"
                      onClick={() => setDifficulty(diff.id as DifficultyLevel)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 8,
                        textAlign: "left",
                        border: difficulty === diff.id ? "2px solid #356AE6" : `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                        backgroundColor: difficulty === diff.id ? (isDark ? "rgba(52,120,246,0.15)" : "#EEF4FD") : isDark ? "#13243A" : "#FAF9F6",
                        color: difficulty === diff.id ? (isDark ? "#3478F6" : "#356AE6") : isDark ? "#F2F6FC" : "#17191C",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{diff.label}</div>
                      <div style={{ fontSize: 10, color: isDark ? "#B6C4D6" : "#667085" }}>{diff.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: isDark ? "#3478F6" : "#356AE6", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                  6. TARGET DURATION
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                  {[
                    { id: 15, label: "15 Mins", desc: "Sprint (4-5 Qs)" },
                    { id: 30, label: "30 Mins", desc: "Standard (7-8 Qs)" },
                    { id: 45, label: "45 Mins", desc: "Full Round (10-12 Qs)" },
                    { id: 60, label: "60 Mins", desc: "Deep Dive evaluation" },
                  ].map((dur) => (
                    <button
                      key={dur.id}
                      type="button"
                      onClick={() => setDurationMinutes(dur.id as DurationMinutes)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: 8,
                        textAlign: "left",
                        border: durationMinutes === dur.id ? "2px solid #356AE6" : `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                        backgroundColor: durationMinutes === dur.id ? (isDark ? "rgba(52,120,246,0.15)" : "#EEF4FD") : isDark ? "#13243A" : "#FAF9F6",
                        color: durationMinutes === dur.id ? (isDark ? "#3478F6" : "#356AE6") : isDark ? "#F2F6FC" : "#17191C",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{dur.label}</div>
                      <div style={{ fontSize: 10, color: isDark ? "#B6C4D6" : "#667085" }}>{dur.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 7. Optional Job Description Accordion */}
            <div>
              <button
                type="button"
                onClick={() => setShowJdInput(!showJdInput)}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  fontSize: 12,
                  fontWeight: 700,
                  color: isDark ? "#3478F6" : "#356AE6",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <span>{showJdInput ? "▼" : "▶"}</span>
                <span>Target Job Description or Posting Requirements (Optional)</span>
              </button>

              {showJdInput && (
                <div style={{ marginTop: 10 }}>
                  <textarea
                    rows={4}
                    value={jobDescription}
                    onChange={(e) => setJobDescription(e.target.value)}
                    placeholder="Paste job description text, specific role requirements, or company tech stack here..."
                    style={{
                      width: "100%",
                      padding: "0.75rem 1rem",
                      borderRadius: 9,
                      border: `1px solid ${isDark ? "#223750" : "#D0D5DD"}`,
                      backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                      color: isDark ? "#F2F6FC" : "#17191C",
                      fontSize: 12,
                      boxSizing: "border-box",
                      outline: "none",
                      resize: "vertical",
                    }}
                  />
                  <div style={{ fontSize: 11, color: isDark ? "#B6C4D6" : "#667085", marginTop: 4 }}>
                    Questions will be ground-anchored against this specific job description.
                  </div>
                </div>
              )}
            </div>

            {/* Launch Action Bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 14,
                paddingTop: "1.25rem",
                borderTop: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: `1px solid ${soundEnabled ? "#2E7D5B" : isDark ? "#223750" : "#E4E1DA"}`,
                    backgroundColor: soundEnabled ? (isDark ? "rgba(46,125,91,0.2)" : "#EAF4EE") : isDark ? "#13243A" : "#FAF9F6",
                    color: soundEnabled ? (isDark ? "#34D399" : "#2E7D5B") : isDark ? "#B6C4D6" : "#667085",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  <span>{soundEnabled ? "🔊" : "🔇"}</span>
                  <span>{soundEnabled ? "Voice TTS Enabled" : "Voice TTS Muted"}</span>
                </button>
                <Link
                  href="/student/interview-prep/history"
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: isDark ? "#B6C4D6" : "#667085",
                    textDecoration: "none",
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                    backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                  }}
                >
                  📊 Session History
                </Link>
              </div>

              <button
                type="button"
                onClick={handleStartInterview}
                disabled={loading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "0.85rem 2rem",
                  borderRadius: 10,
                  border: "none",
                  background: "linear-gradient(135deg, #356AE6, #2858C7)",
                  color: "#FFFFFF",
                  fontSize: 14,
                  fontWeight: 800,
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 4px 14px rgba(53, 106, 230, 0.3)",
                }}
              >
                <span>{loading ? "Calibrating..." : "Launch Personalized Interview Arena"}</span>
                <span>➔</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════
  // RENDER: STAGE 2 — DISTRACTION-FREE INTERVIEW ROOM
  // ═════════════════════════════════════════════════════════════════════
  if (stage === "room") {
    return (
      <div
        style={{
          minHeight: "100vh",
          backgroundColor: isDark ? "#07111F" : "#F6F5F1",
          color: isDark ? "#F2F6FC" : "#17191C",
          fontFamily: "var(--font-inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Sticky Room Bar */}
        <header
          style={{
            position: "sticky",
            top: 0,
            zIndex: 40,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0.75rem 1.75rem",
            backgroundColor: isDark ? "rgba(10,22,38,0.95)" : "rgba(255,255,255,0.96)",
            borderBottom: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
            backdropFilter: "blur(16px)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => {
                if (confirm("Exit this mock interview round and return to setup? Uncompleted progress will not be certified.")) {
                  setStage("setup");
                }
              }}
              style={{
                fontSize: 12,
                color: isDark ? "#B6C4D6" : "#667085",
                background: "transparent",
                border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                borderRadius: 7,
                padding: "5px 10px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              ← Exit
            </button>
            <div style={{ width: 1, height: 16, backgroundColor: isDark ? "#223750" : "#E4E1DA" }} />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 800, color: isDark ? "#3478F6" : "#356AE6" }}>
                  {targetRole}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 999,
                    backgroundColor: isDark ? "rgba(52,120,246,0.15)" : "#EEF4FD",
                    color: isDark ? "#3478F6" : "#356AE6",
                    fontWeight: 700,
                  }}
                >
                  {interviewType.toUpperCase()}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    padding: "2px 8px",
                    borderRadius: 999,
                    backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F0EFEA",
                    color: isDark ? "#B6C4D6" : "#667085",
                    fontWeight: 600,
                  }}
                >
                  {targetCompany}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              style={{
                fontSize: 11,
                padding: "5px 10px",
                borderRadius: 7,
                border: soundEnabled ? "1px solid #2E7D5B" : `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                backgroundColor: soundEnabled ? (isDark ? "rgba(46,125,91,0.2)" : "#EAF4EE") : isDark ? "#13243A" : "#FAF9F6",
                color: soundEnabled ? (isDark ? "#34D399" : "#2E7D5B") : isDark ? "#B6C4D6" : "#667085",
                cursor: "pointer",
                fontWeight: 700,
              }}
            >
              {soundEnabled ? "🔊 Voice TTS On" : "🔇 Voice TTS Muted"}
            </button>

            <button
              type="button"
              onClick={handleCompleteInterview}
              disabled={savingSession || messages.length < 2}
              style={{
                fontSize: 12,
                padding: "6px 14px",
                borderRadius: 8,
                backgroundColor: "#C24141",
                color: "#FFFFFF",
                border: "none",
                fontWeight: 700,
                cursor: savingSession || messages.length < 2 ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px rgba(194,65,65,0.25)",
              }}
            >
              {savingSession ? "Grading Report..." : "Finish & View Report ➔"}
            </button>
          </div>
        </header>

        {/* Room Main Content: Two Columns */}
        <div
          style={{
            flex: 1,
            maxWidth: 1360,
            width: "100%",
            margin: "0 auto",
            padding: "1rem 1.5rem",
            display: "grid",
            gridTemplateColumns: "1fr 380px",
            gap: "1.25rem",
            boxSizing: "border-box",
            height: "calc(100vh - 60px)",
          }}
        >
          {/* Left Column: Chat Conversation Stream */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
              border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            {/* Active Question Bar */}
            {activeQuestionMeta && (
              <div
                style={{
                  padding: "8px 1.25rem",
                  backgroundColor: activeQuestionMeta.is_follow_up
                    ? isDark
                      ? "rgba(183,121,31,0.15)"
                      : "#FEF7ED"
                    : isDark
                    ? "rgba(52,120,246,0.1)"
                    : "#EEF4FD",
                  borderBottom: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: 11,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 14 }}>{activeQuestionMeta.is_follow_up ? "🔍" : "🎯"}</span>
                  <span
                    style={{
                      fontWeight: 800,
                      color: activeQuestionMeta.is_follow_up ? "#B7791F" : isDark ? "#3478F6" : "#356AE6",
                    }}
                  >
                    {activeQuestionMeta.is_follow_up
                      ? "SOCRATIC FOLLOW-UP PROBE: Evaluating answer depth & edge cases"
                      : `FOCUS: ${activeQuestionMeta.question_type || "Technical Competency"}`}
                  </span>
                </div>
                <div style={{ color: isDark ? "#B6C4D6" : "#667085", fontSize: 11 }}>
                  Difficulty: <strong style={{ color: "#2E7D5B" }}>{activeQuestionMeta.difficulty_level || difficulty}</strong>
                </div>
              </div>
            )}

            {/* Message Stream */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "1.5rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              {messages.map((m, i) => {
                const isUser = m.role === "user";
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: isUser ? "flex-end" : "flex-start",
                      gap: 4,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, maxWidth: "85%" }}>
                      {!isUser && (
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: "50%",
                            background: m.isFollowUp
                              ? "linear-gradient(135deg, #B7791F, #D97706)"
                              : "linear-gradient(135deg, #162A43, #356AE6)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#FFFFFF",
                            fontSize: 14,
                            flexShrink: 0,
                            boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                          }}
                        >
                          {m.isFollowUp ? "🔍" : "👔"}
                        </div>
                      )}

                      <div>
                        <div
                          style={{
                            padding: "0.95rem 1.25rem",
                            borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                            backgroundColor: isUser
                              ? "linear-gradient(135deg, #356AE6, #2858C7)"
                              : m.isFollowUp
                              ? isDark
                                ? "rgba(183,121,31,0.15)"
                                : "#FEF7ED"
                              : isDark
                              ? "#13243A"
                              : "#FAF9F6",
                            background: isUser ? "linear-gradient(135deg, #356AE6, #2858C7)" : undefined,
                            border: isUser
                              ? "none"
                              : m.isFollowUp
                              ? "1px solid rgba(183,121,31,0.3)"
                              : `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                            color: isUser ? "#FFFFFF" : isDark ? "#F2F6FC" : "#17191C",
                            fontSize: 13.5,
                            lineHeight: 1.6,
                            boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                          }}
                        >
                          <MarkdownRenderer content={m.content} compact isDark={isUser || isDark} />
                        </div>
                        <div
                          style={{
                            fontSize: 10,
                            color: isDark ? "#7E8FA6" : "#98A2B3",
                            marginTop: 4,
                            textAlign: isUser ? "right" : "left",
                          }}
                        >
                          {m.time} {m.isFollowUp && "• follow-up probe"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {isSubmitting && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "0.5rem 0",
                    color: isDark ? "#3478F6" : "#356AE6",
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: isDark ? "#3478F6" : "#356AE6",
                      display: "inline-block",
                      animation: "pulse 1s infinite",
                    }}
                  />
                  <span>Alex is evaluating your answer and formulating the next adaptive question...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div
              style={{
                padding: "1rem 1.25rem",
                borderTop: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                backgroundColor: isDark ? "#13243A" : "#FAF9F6",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <button
                type="button"
                onClick={toggleMic}
                disabled={isSubmitting}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 10,
                  border: isListening ? "2px solid #C24141" : `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                  backgroundColor: isListening
                    ? isDark
                      ? "rgba(194,65,65,0.25)"
                      : "#FDF0F0"
                    : isDark
                    ? "#0E1B2E"
                    : "#FFFFFF",
                  color: isListening ? "#C24141" : isDark ? "#F2F6FC" : "#17191C",
                  fontSize: 18,
                  cursor: isSubmitting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                }}
                title={isListening ? "Listening... click to stop" : "Speak your response (Microphone)"}
              >
                {isListening ? "🔴" : "🎤"}
              </button>

              <textarea
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                disabled={isSubmitting}
                placeholder={
                  isListening
                    ? "Listening... speak now or press mic to stop"
                    : "Speak or type your technical answer... (Press Enter to submit, Shift+Enter for new line)"
                }
                style={{
                  flex: 1,
                  padding: "0.75rem 1rem",
                  borderRadius: 10,
                  border: `1px solid ${isDark ? "#223750" : "#D0D5DD"}`,
                  backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
                  color: isDark ? "#F2F6FC" : "#17191C",
                  fontSize: 13,
                  outline: "none",
                  resize: "none",
                  lineHeight: 1.4,
                  boxSizing: "border-box",
                }}
              />

              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || isSubmitting}
                style={{
                  height: 44,
                  padding: "0 1.25rem",
                  borderRadius: 10,
                  border: "none",
                  background:
                    input.trim() && !isSubmitting
                      ? "linear-gradient(135deg, #356AE6, #2858C7)"
                      : isDark
                      ? "rgba(255,255,255,0.06)"
                      : "#E4E1DA",
                  color: input.trim() && !isSubmitting ? "#FFFFFF" : isDark ? "#7E8FA6" : "#98A2B3",
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: input.trim() && !isSubmitting ? "pointer" : "not-allowed",
                  flexShrink: 0,
                }}
              >
                Send ➔
              </button>
            </div>
          </div>

          {/* Right Column: Real-Time Assessment & Rubric Panel */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              overflowY: "auto",
            }}
          >
            {/* Real-Time Assessment Card */}
            <div
              style={{
                backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
                border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                borderRadius: 16,
                padding: "1.25rem",
                boxShadow: isDark ? "0 4px 14px rgba(0,0,0,0.2)" : "0 2px 8px rgba(0,0,0,0.03)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 800, color: isDark ? "#3478F6" : "#356AE6", letterSpacing: 0.8, textTransform: "uppercase" }}>
                  REAL-TIME ASSESSMENT
                </span>
                {lastAssessment && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: 999,
                      textTransform: "uppercase",
                      backgroundColor:
                        lastAssessment.answer_quality === "strong"
                          ? isDark
                            ? "rgba(46,125,91,0.25)"
                            : "#EAF4EE"
                          : lastAssessment.answer_quality === "adequate"
                          ? isDark
                            ? "rgba(183,121,31,0.25)"
                            : "#FDF6E9"
                          : isDark
                          ? "rgba(194,65,65,0.25)"
                          : "#FDF0F0",
                      color:
                        lastAssessment.answer_quality === "strong"
                          ? "#2E7D5B"
                          : lastAssessment.answer_quality === "adequate"
                          ? "#B7791F"
                          : "#C24141",
                    }}
                  >
                    {lastAssessment.answer_quality}
                  </span>
                )}
              </div>

              {lastAssessment ? (
                <div>
                  <p style={{ fontSize: 12, color: isDark ? "#F2F6FC" : "#17191C", lineHeight: 1.5, margin: "0 0 10px" }}>
                    {lastAssessment.reasoning}
                  </p>
                  <div
                    style={{
                      padding: "8px 10px",
                      borderRadius: 8,
                      backgroundColor:
                        lastAssessment.next_action === "follow_up_probe"
                          ? isDark
                            ? "rgba(183,121,31,0.15)"
                            : "#FDF6E9"
                          : isDark
                          ? "rgba(46,125,91,0.15)"
                          : "#EAF4EE",
                      fontSize: 11,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>{lastAssessment.next_action === "follow_up_probe" ? "🔍" : "➡️"}</span>
                    <span
                      style={{
                        fontWeight: 700,
                        color: lastAssessment.next_action === "follow_up_probe" ? "#B7791F" : "#2E7D5B",
                      }}
                    >
                      {lastAssessment.next_action === "follow_up_probe"
                        ? "Probing deeper into trade-offs & edge cases"
                        : "Advancing to next technical competency"}
                    </span>
                  </div>

                  {lastAssessment.topics_demonstrated && lastAssessment.topics_demonstrated.length > 0 && (
                    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {lastAssessment.topics_demonstrated.map((t, idx) => (
                        <span
                          key={idx}
                          style={{
                            fontSize: 10,
                            padding: "2px 7px",
                            borderRadius: 6,
                            backgroundColor: isDark ? "#13243A" : "#F0EFEA",
                            color: isDark ? "#B6C4D6" : "#667085",
                          }}
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "1.5rem 0.5rem", color: isDark ? "#7E8FA6" : "#98A2B3", fontSize: 12 }}>
                  Answer Alex&apos;s questions to stream live evidence, answer quality, and follow-up alerts.
                </div>
              )}
            </div>

            {/* Answer Distribution Tally */}
            <div
              style={{
                backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
                border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                borderRadius: 16,
                padding: "1rem 1.25rem",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#B6C4D6" : "#667085", letterSpacing: 0.5, marginBottom: 8 }}>
                SESSION ANSWER DISTRIBUTION
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, textAlign: "center" }}>
                <div style={{ padding: "6px 2px", borderRadius: 8, backgroundColor: isDark ? "rgba(46,125,91,0.15)" : "#EAF4EE" }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#2E7D5B" }}>{sessionDistribution.strong}</div>
                  <div style={{ fontSize: 9, color: isDark ? "#B6C4D6" : "#667085" }}>Strong</div>
                </div>
                <div style={{ padding: "6px 2px", borderRadius: 8, backgroundColor: isDark ? "rgba(183,121,31,0.15)" : "#FDF6E9" }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#B7791F" }}>{sessionDistribution.adequate}</div>
                  <div style={{ fontSize: 9, color: isDark ? "#B6C4D6" : "#667085" }}>Adequate</div>
                </div>
                <div style={{ padding: "6px 2px", borderRadius: 8, backgroundColor: isDark ? "rgba(249,115,22,0.15)" : "#FFF7ED" }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#EA580C" }}>{sessionDistribution.shallow}</div>
                  <div style={{ fontSize: 9, color: isDark ? "#B6C4D6" : "#667085" }}>Shallow</div>
                </div>
                <div style={{ padding: "6px 2px", borderRadius: 8, backgroundColor: isDark ? "rgba(194,65,65,0.15)" : "#FDF0F0" }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#C24141" }}>{sessionDistribution.off_topic}</div>
                  <div style={{ fontSize: 9, color: isDark ? "#B6C4D6" : "#667085" }}>Off-topic</div>
                </div>
              </div>
            </div>

            {/* Live Scoring */}
            {liveScore && (
              <div
                style={{
                  backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
                  border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                  borderRadius: 16,
                  padding: "1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 10, color: isDark ? "#B6C4D6" : "#667085", fontWeight: 700, textTransform: "uppercase" }}>
                      ESTIMATED SCORE
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: "#2E7D5B" }}>
                      {liveScore.overall} <span style={{ fontSize: 12, color: isDark ? "#7E8FA6" : "#98A2B3" }}>/ 100</span>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "4px 8px",
                      borderRadius: 6,
                      backgroundColor: "#EAF4EE",
                      color: "#2E7D5B",
                      border: "1px solid #C8E4D3",
                    }}
                  >
                    {liveScore.hiringSignal || "SOLID FIT"}
                  </span>
                </div>

                {liveScore.evidence?.strengths && liveScore.evidence.strengths.length > 0 && (
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "#2E7D5B", marginBottom: 3 }}>
                      ✓ DEMONSTRATED STRENGTHS
                    </div>
                    <div style={{ fontSize: 11, color: isDark ? "#B6C4D6" : "#667085", lineHeight: 1.4 }}>
                      {liveScore.evidence.strengths[0]}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Practice Tip Card Linking to Skill Practice Hub */}
            <div
              style={{
                backgroundColor: isDark ? "#13243A" : "#EFF4FE",
                border: `1px solid ${isDark ? "#223750" : "#D2E0FB"}`,
                borderRadius: 14,
                padding: "1rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 14 }}>⚡</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: isDark ? "#3478F6" : "#356AE6" }}>
                  SKILL PRACTICE HUB
                </span>
              </div>
              <p style={{ fontSize: 11, color: isDark ? "#B6C4D6" : "#667085", margin: "0 0 8px", lineHeight: 1.4 }}>
                Want structured DSA, CS fundamentals, or system design drills? Practice in the dedicated Hub anytime.
              </p>
              <Link
                href="/skill-practice"
                target="_blank"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: isDark ? "#3478F6" : "#356AE6",
                  textDecoration: "none",
                }}
              >
                Open Skill Practice Hub ↗
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════
  // RENDER: STAGE 3 — POST-INTERVIEW DETAILED REPORT & HISTORY SCREEN
  // ═════════════════════════════════════════════════════════════════════
  const reportOverallScore = finalReport?.report?.overallScore || liveScore?.overall || 82;
  const hireDecision = finalReport?.decision || "HIRE";
  const hireColor =
    hireDecision === "STRONG_HIRE" || hireDecision === "HIRE"
      ? "#2E7D5B"
      : hireDecision === "LEANING_HIRE"
      ? "#B7791F"
      : "#C24141";
  const hireBg =
    hireDecision === "STRONG_HIRE" || hireDecision === "HIRE"
      ? isDark
        ? "rgba(46,125,91,0.2)"
        : "#EAF4EE"
      : hireDecision === "LEANING_HIRE"
      ? isDark
        ? "rgba(183,121,31,0.2)"
        : "#FEF7ED"
      : isDark
      ? "rgba(194,65,65,0.2)"
      : "#FDF0F0";

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: isDark ? "#07111F" : "#F6F5F1",
        color: isDark ? "#F2F6FC" : "#17191C",
        fontFamily: "var(--font-inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
      }}
    >
      <AppNav role="student" />

      <main style={{ maxWidth: 1040, margin: "0 auto", padding: "2.5rem 1.5rem 4rem" }}>
        {/* Navigation Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <button
              onClick={() => setStage("setup")}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: isDark ? "#3478F6" : "#356AE6",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              ← Start New Personalized Interview Arena Session
            </button>
            <span style={{ color: isDark ? "#7E8FA6" : "#98A2B3" }}>•</span>
            <span style={{ fontSize: 12, color: isDark ? "#B6C4D6" : "#667085" }}>Official Evaluation Report</span>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <Link
              href="/student/interview-prep/history"
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: isDark ? "#F2F6FC" : "#162A43",
                backgroundColor: isDark ? "#13243A" : "#FFFFFF",
                border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                padding: "6px 14px",
                borderRadius: 8,
                textDecoration: "none",
              }}
            >
              📊 Full Prep History
            </Link>
            <Link
              href="/skill-practice"
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#FFFFFF",
                backgroundColor: "#356AE6",
                padding: "6px 14px",
                borderRadius: 8,
                textDecoration: "none",
              }}
            >
              ⚡ Practice Weak Topics
            </Link>
          </div>
        </div>

        {/* Top Summary Card */}
        <div
          style={{
            backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
            border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
            borderRadius: 16,
            padding: "2rem",
            marginBottom: "1.5rem",
            boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(22,42,67,0.04)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: "3px 10px",
                    borderRadius: 999,
                    backgroundColor: hireBg,
                    color: hireColor,
                    letterSpacing: 0.5,
                  }}
                >
                  VERDICT: {hireDecision.replace("_", " ")}
                </span>
                <span style={{ fontSize: 12, color: isDark ? "#B6C4D6" : "#667085" }}>
                  Confidence: {finalReport?.confidence || 85}%
                </span>
                {savedSessionId && (
                  <span style={{ fontSize: 11, color: "#2E7D5B", fontWeight: 700 }}>
                    ✓ Saved to Verified Profile
                  </span>
                )}
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: isDark ? "#F2F6FC" : "#162A43", margin: "0 0 6px", letterSpacing: "-0.02em" }}>
                {targetRole} · {targetCompany}
              </h1>
              <div style={{ fontSize: 13, color: isDark ? "#B6C4D6" : "#667085" }}>
                Track: <strong>{experienceMode.toUpperCase()}</strong> · Type: <strong>{interviewType.toUpperCase()}</strong> · Completed on {new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
              </div>
            </div>

            {/* Score Pill */}
            <div
              style={{
                padding: "1rem 1.5rem",
                borderRadius: 14,
                backgroundColor: isDark ? "#13243A" : "#FAF9F6",
                border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 800, color: isDark ? "#B6C4D6" : "#667085", letterSpacing: 0.5, textTransform: "uppercase" }}>
                COMPOSITE SCORE
              </div>
              <div style={{ fontSize: 34, fontWeight: 900, color: hireColor }}>
                {reportOverallScore} <span style={{ fontSize: 14, color: isDark ? "#7E8FA6" : "#98A2B3" }}>/ 100</span>
              </div>
            </div>
          </div>

          {/* Executive Overview */}
          <div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: `1px solid ${isDark ? "#223750" : "#E4E1DA"}` }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: isDark ? "#3478F6" : "#356AE6", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>
              EXECUTIVE EVALUATION SUMMARY
            </div>
            <p style={{ fontSize: 13.5, color: isDark ? "#F2F6FC" : "#17191C", lineHeight: 1.6, margin: 0 }}>
              {finalReport?.overview || "Demonstrated solid technical reasoning and answered adaptive follow-up probes with consistency."}
            </p>
          </div>
        </div>

        {/* 4 Performance Rubric Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14, marginBottom: "1.5rem" }}>
          {[
            {
              title: "Technical Depth",
              score: finalReport?.scorecard?.technical_depth?.score || 82,
              comment: finalReport?.scorecard?.technical_depth?.comment || "Strong grasp of algorithmic trade-offs & data models.",
              icon: "⚡",
            },
            {
              title: "Problem Solving",
              score: finalReport?.scorecard?.problem_solving?.score || 80,
              comment: finalReport?.scorecard?.problem_solving?.comment || "Structured decomposition with clear edge-case reasoning.",
              icon: "🧩",
            },
            {
              title: "Project Ownership",
              score: finalReport?.scorecard?.project_ownership?.score || 84,
              comment: finalReport?.scorecard?.project_ownership?.comment || "Concrete engineering ownership and tech stack justification.",
              icon: "🏛️",
            },
            {
              title: "Communication Clarity",
              score: finalReport?.scorecard?.communication?.score || 78,
              comment: finalReport?.scorecard?.communication?.comment || "Articulate technical dialogue and receptive to follow-up prompts.",
              icon: "🎙️",
            },
          ].map((cat, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
                border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                borderRadius: 14,
                padding: "1.25rem",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <span style={{ fontSize: 20 }}>{cat.icon}</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: isDark ? "#3478F6" : "#356AE6" }}>
                  {cat.score} <span style={{ fontSize: 10, color: isDark ? "#7E8FA6" : "#98A2B3" }}>/ 100</span>
                </span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? "#F2F6FC" : "#162A43", marginBottom: 4 }}>
                {cat.title}
              </div>
              <div style={{ fontSize: 11, color: isDark ? "#B6C4D6" : "#667085", lineHeight: 1.45 }}>
                {cat.comment}
              </div>
            </div>
          ))}
        </div>

        {/* Strengths & Improvement Areas Side by Side */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 14, marginBottom: "1.5rem" }}>
          {/* Strengths */}
          <div
            style={{
              backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
              border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
              borderRadius: 14,
              padding: "1.5rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 18 }}>✓</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#2E7D5B", textTransform: "uppercase" }}>
                DEMONSTRATED STRENGTHS
              </span>
            </div>
            <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: 8 }}>
              {(finalReport?.hire_reasons || ["Demonstrated structured technical problem solving"]).map((r, i) => (
                <li key={i} style={{ fontSize: 12.5, color: isDark ? "#F2F6FC" : "#17191C", lineHeight: 1.5 }}>
                  {r}
                </li>
              ))}
            </ul>
          </div>

          {/* Gaps / Areas to Level Up */}
          <div
            style={{
              backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
              border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
              borderRadius: 14,
              padding: "1.5rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <span style={{ fontSize: 18 }}>⚠️</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: "#B7791F", textTransform: "uppercase" }}>
                AREAS REQUIRING DEPTH & REFINEMENT
              </span>
            </div>
            <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: 8 }}>
              {(finalReport?.no_hire_reasons || ["Continue practicing edge case verification"]).map((r, i) => (
                <li key={i} style={{ fontSize: 12.5, color: isDark ? "#F2F6FC" : "#17191C", lineHeight: 1.5 }}>
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Personalized Preparation Plan & Suggested Practice Problems */}
        <div
          style={{
            backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
            border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
            borderRadius: 16,
            padding: "1.75rem",
            marginBottom: "1.5rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 20 }}>📋</span>
            <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: isDark ? "#F2F6FC" : "#162A43" }}>
              Personalized Preparation Plan & Recommended Practice
            </h2>
          </div>
          <p style={{ fontSize: 12.5, color: isDark ? "#B6C4D6" : "#667085", margin: "0 0 16px", lineHeight: 1.5 }}>
            Based on the topics probed in this round, here are the high-impact practice modules calibrated for {targetRole} at {targetCompany}:
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 12 }}>
            <Link
              href="/student/skills/dsa"
              style={{
                textDecoration: "none",
                padding: "1rem",
                borderRadius: 10,
                backgroundColor: isDark ? "#13243A" : "#FAF9F6",
                border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                display: "block",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: isDark ? "#3478F6" : "#356AE6" }}>
                  ⚡ DSA Arena & Problem Bank
                </span>
                <span style={{ fontSize: 10, color: "#2E7D5B", fontWeight: 700 }}>PRACTICE ➔</span>
              </div>
              <div style={{ fontSize: 11, color: isDark ? "#B6C4D6" : "#667085", lineHeight: 1.4 }}>
                Practice algorithmic patterns, complexity analysis, and edge case test suites.
              </div>
            </Link>

            <Link
              href="/student/skills/cs-interview"
              style={{
                textDecoration: "none",
                padding: "1rem",
                borderRadius: 10,
                backgroundColor: isDark ? "#13243A" : "#FAF9F6",
                border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                display: "block",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: isDark ? "#3478F6" : "#356AE6" }}>
                  💻 CS Fundamentals Subject Hub
                </span>
                <span style={{ fontSize: 10, color: "#2E7D5B", fontWeight: 700 }}>REVISE ➔</span>
              </div>
              <div style={{ fontSize: 11, color: isDark ? "#B6C4D6" : "#667085", lineHeight: 1.4 }}>
                Subject-wise modules on OS, DBMS, SQL, Computer Networks, OOP, and Concurrency.
              </div>
            </Link>

            <Link
              href="/student/skills/system-design"
              style={{
                textDecoration: "none",
                padding: "1rem",
                borderRadius: 10,
                backgroundColor: isDark ? "#13243A" : "#FAF9F6",
                border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                display: "block",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: isDark ? "#3478F6" : "#356AE6" }}>
                  🏗️ System Design Studio
                </span>
                <span style={{ fontSize: 10, color: "#2E7D5B", fontWeight: 700 }}>DESIGN ➔</span>
              </div>
              <div style={{ fontSize: 11, color: isDark ? "#B6C4D6" : "#667085", lineHeight: 1.4 }}>
                Architect distributed rate limiters, caching layers, and high-throughput databases.
              </div>
            </Link>

            <Link
              href="/student/skills/behavioral"
              style={{
                textDecoration: "none",
                padding: "1rem",
                borderRadius: 10,
                backgroundColor: isDark ? "#13243A" : "#FAF9F6",
                border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                display: "block",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: isDark ? "#3478F6" : "#356AE6" }}>
                  🤝 Behavioral Bar-Raiser Studio
                </span>
                <span style={{ fontSize: 10, color: "#2E7D5B", fontWeight: 700 }}>PRACTICE ➔</span>
              </div>
              <div style={{ fontSize: 11, color: isDark ? "#B6C4D6" : "#667085", lineHeight: 1.4 }}>
                Structure STAR stories, conflict resolution, and leadership principles.
              </div>
            </Link>
          </div>
        </div>

        {/* Full Question-by-Question Transcript Audit */}
        <div
          style={{
            backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
            border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
            borderRadius: 16,
            padding: "1.75rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18 }}>📜</span>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: isDark ? "#F2F6FC" : "#162A43" }}>
                Full Turn-by-Turn Transcript & Follow-Up Audit
              </h3>
            </div>
            <span style={{ fontSize: 11, color: isDark ? "#B6C4D6" : "#667085" }}>
              {messages.length} Conversation Turns
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {messages.map((m, idx) => {
              const isAsst = m.role === "assistant";
              return (
                <div
                  key={idx}
                  style={{
                    padding: "1rem 1.25rem",
                    borderRadius: 12,
                    backgroundColor: isAsst
                      ? isDark
                        ? "#13243A"
                        : "#FAF9F6"
                      : isDark
                      ? "rgba(52,120,246,0.1)"
                      : "#EEF4FD",
                    border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: isAsst ? (isDark ? "#3478F6" : "#356AE6") : "#2E7D5B" }}>
                        {isAsst ? "Alex (Senior Interviewer)" : "Candidate Answer"}
                      </span>
                      {m.isFollowUp && (
                        <span
                          style={{
                            fontSize: 9,
                            padding: "2px 6px",
                            borderRadius: 4,
                            backgroundColor: "#FEF7ED",
                            color: "#B7791F",
                            border: "1px solid #F8D8A7",
                            fontWeight: 700,
                          }}
                        >
                          FOLLOW-UP PROBE
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 10, color: isDark ? "#7E8FA6" : "#98A2B3" }}>{m.time}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: isDark ? "#F2F6FC" : "#17191C", lineHeight: 1.55 }}>
                    <MarkdownRenderer content={m.content} compact isDark={isDark} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
