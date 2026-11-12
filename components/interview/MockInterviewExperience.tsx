"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { InterviewSession } from "@/lib/interview-session-types";
import { useTheme } from "@/components/ThemeProvider";
import AppNav from "@/components/AppNav";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import { generateSecureId } from "@/lib/crypto-utils";

// ── Types ──
export type ExperienceMode = "fresher" | "1-3yr" | "experienced" | "career-switcher";
export type InterviewType = "technical" | "behavioral" | "hr" | "system_design" | "mixed";
export type DifficultyLevel = "adaptive" | "easy" | "medium" | "hard";
export type DurationMinutes = 15 | 30 | 45 | 60;
export type FeedbackMode = "simulation" | "practice_learn";

export type InterviewTrack =
  | "traditional_coding_dsa"
  | "code_comprehension"
  | "debugging_code_repair"
  | "ai_assisted_engineering"
  | "system_design"
  | "code_review_reliability"
  | "senior_engineering_judgment"
  | "behavioral_project_deep_dives";

export const INTERVIEW_TRACKS: Array<{
  id: InterviewTrack;
  title: string;
  badge: string;
  description: string;
  icon: string;
  defaultFocus: string;
  defaultType: InterviewType;
}> = [
  {
    id: "traditional_coding_dsa",
    title: "Traditional Coding & DSA",
    badge: "Algorithms & Big-O",
    description: "Algorithmic thinking, data structures (trees, graphs, DP), edge cases, and runtime complexity.",
    icon: "💻",
    defaultFocus: "Data Structures, Algorithms, Complexity Analysis, Edge Cases",
    defaultType: "technical",
  },
  {
    id: "code_comprehension",
    title: "Code Comprehension",
    badge: "Mental Models & Tracing",
    description: "Navigating unfamiliar codebases, execution flow tracing, state invariants, and module contracts.",
    icon: "🔍",
    defaultFocus: "Codebase Navigation, Invariant Verification, Execution Flow, Module Contracts",
    defaultType: "technical",
  },
  {
    id: "debugging_code_repair",
    title: "Debugging & Code Repair",
    badge: "Root Cause & Defense",
    description: "Systematic root cause isolation, reproducing elusive intermittent bugs, memory leaks, and defensive patching.",
    icon: "🛠️",
    defaultFocus: "Root Cause Isolation, Regression Prevention, Concurrency Bugs, Defensive Patching",
    defaultType: "technical",
  },
  {
    id: "ai_assisted_engineering",
    title: "AI-Assisted Engineering",
    badge: "AI Auditing & Tooling",
    description: "Auditing AI-generated code, hallucination detection, prompt-assisted development, and regression testing.",
    icon: "🤖",
    defaultFocus: "AI Code Verification, Hallucination Auditing, Prompt Engineering, Test Coverage",
    defaultType: "technical",
  },
  {
    id: "system_design",
    title: "System Design & Scale",
    badge: "Distributed Systems",
    description: "Scalability, microservices, partitioning, caching strategies, latency, fault tolerance, and trade-offs.",
    icon: "🏗️",
    defaultFocus: "Distributed Systems, Microservices, Caching, Database Partitioning, Latency",
    defaultType: "system_design",
  },
  {
    id: "code_review_reliability",
    title: "Code Review & Reliability",
    badge: "Quality & Testing",
    description: "High-standard PR reviews, test suites, race conditions, edge cases, error handling, and maintainability.",
    icon: "📋",
    defaultFocus: "Pull Request Review, Concurrency Invariants, Test Automation, Clean Architecture",
    defaultType: "technical",
  },
  {
    id: "senior_engineering_judgment",
    title: "Senior Engineering Judgment",
    badge: "Trade-offs & Debt",
    description: "Technical debt prioritization, risk vs velocity trade-offs, architecture migration, and operational resilience.",
    icon: "⚖️",
    defaultFocus: "Architecture Trade-offs, Technical Debt, Migration Strategies, Operational Resilience",
    defaultType: "mixed",
  },
  {
    id: "behavioral_project_deep_dives",
    title: "Behavioral & Project Deep Dives",
    badge: "STAR & Ownership",
    description: "Real project defense, handling production failures, cross-functional conflicts, and technical leadership.",
    icon: "🤝",
    defaultFocus: "STAR Method, Technical Leadership, Incident Recovery, Cross-Functional Collaboration",
    defaultType: "behavioral",
  },
];

export interface RubricDimensionScore {
  dimension: string;
  earnedPoints: number;
  maxPoints: number;
  explanation: string;
}

export interface QuestionModelAnswer {
  score: number;
  rubricVersion?: string;
  dimensionScores: RubricDimensionScore[];
  whatYouDidWell: string[];
  whatWasMissing: string[];
  deductionReasons: string[];
  howToImprove: string;
  bestPossibleAnswer: string;
  keyConceptsToRemember: string[];
  likelyFollowUps: string[];
  personalizedNextAction?: string;
  answerComparison?: {
    candidateDemonstrated: string[];
    missingPoints: string[];
    whatModelAnswerAdds: string;
  };
}

export interface Msg {
  role: "user" | "assistant";
  content: string;
  time: string;
  isFollowUp?: boolean;
  modelAnswer?: QuestionModelAnswer;
  rubricScore?: number;
  turnIndex?: number;
  questionTargets?: string;
  section?: string;
  assessment?: AnswerAssessment;
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
  const paramTrack = (searchParams.get("track") as InterviewTrack) || "";

  // ── Setup State ──
  const [interviewTrack, setInterviewTrack] = useState<InterviewTrack>(() => {
    if (paramTrack && INTERVIEW_TRACKS.some((t) => t.id === paramTrack)) return paramTrack;
    if (paramType === "system_design") return "system_design";
    if (paramType === "behavioral" || paramType === "hr") return "behavioral_project_deep_dives";
    return "traditional_coding_dsa";
  });
  const [targetRole, setTargetRole] = useState(paramRole || "Software Development Engineer");
  const [targetCompany, setTargetCompany] = useState(paramCompany || "FAANG / Tier 1 Standard");
  const [experienceMode, setExperienceMode] = useState<ExperienceMode>("fresher");
  const [interviewType, setInterviewType] = useState<InterviewType>(paramType || "technical");
  const [skillsFocus, setSkillsFocus] = useState(paramFocus || "Data Structures, System Design, Concurrency, SQL");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("adaptive");
  const [durationMinutes, setDurationMinutes] = useState<DurationMinutes>(45);
  const [feedbackMode, setFeedbackMode] = useState<FeedbackMode>("practice_learn");
  const [showReviewDrawer, setShowReviewDrawer] = useState(false);
  const [expandedTurns, setExpandedTurns] = useState<Record<number, boolean>>({});
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
  const [selectedReviewTurn, setSelectedReviewTurn] = useState<number | null>(null);
  const [modelAnswerExpanded, setModelAnswerExpanded] = useState<boolean>(false);

  // ── Speech Recognition & Audio Refs ──
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const sessionStartTimeRef = useRef<number>(0);
  const sessionIdRef = useRef<string>("");
  const submissionLockRef = useRef<boolean>(false);

  // ── Session Isolation & State Reset ──
  const resetSessionState = useCallback(() => {
    setMessages([]);
    setInput("");
    setActiveQuestionMeta(null);
    setLastAssessment(null);
    setLiveScore(null);
    setSessionDistribution({ strong: 0, adequate: 0, shallow: 0, off_topic: 0 });
    setTopicsCovered([]);
    setFinalReport(null);
    setSavedSessionId(null);
    setSelectedReviewTurn(null);
    setModelAnswerExpanded(false);
    submissionLockRef.current = false;
  }, []);

  const handleLoadHistoricalSession = useCallback(async (sessId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/interview-chat?sessionId=${encodeURIComponent(sessId)}&candidateId=${encodeURIComponent(candidateId || "")}`);
      if (!res.ok) {
        alert("Session could not be retrieved.");
        return;
      }
      const data = await res.json();
      if (!data.found || !data.session) {
        alert("No persisted data found for this session.");
        return;
      }
      const sess = data.session;
      resetSessionState();
      sessionIdRef.current = sess.id;
      if (sess.messages && sess.messages.length > 0) {
        setMessages(sess.messages);
      }
      if (sess.answer_distribution) {
        setSessionDistribution(sess.answer_distribution);
      }
      if (sess.topics_covered && Array.isArray(sess.topics_covered)) {
        setTopicsCovered(sess.topics_covered);
      }
      if (sess.overall_score !== undefined && sess.overall_score !== null) {
        setLiveScore((prev: any) => ({
          ...(prev || {}),
          overall: sess.overall_score,
        }));
      }
      if (sess.report) {
        setFinalReport(sess.report);
        setStage("report");
      } else {
        setStage("room");
      }
    } catch (err) {
      console.error("Failed to load historical session:", err);
      alert("Error loading historical session.");
    } finally {
      setLoading(false);
    }
  }, [candidateId, resetSessionState]);

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

      // If an opportunity ID was passed in query params, load it directly
      if (opportunityId) {
        try {
          const oppRes = await fetch(`/api/opportunities/${opportunityId}`);
          if (oppRes.ok) {
            const oppData = await oppRes.json();
            const match = oppData.opportunity || oppData.canonicalOpportunity;
            if (match && isMounted) {
              setOpportunity(match);
              setTargetRole(match.title || paramRole || "Software Development Engineer");
              setTargetCompany(match.organizer || match.companyName || "Tier-1 Tech Company");
              const tags = (match.tags && Array.isArray(match.tags))
                ? match.tags.join(", ")
                : (match.requiredSkills && Array.isArray(match.requiredSkills))
                ? match.requiredSkills.join(", ")
                : match.domain_tags?.join(", ") || "";
              if (tags) setSkillsFocus(tags);
              const desc = match.extracted_context?.summary || match.description || "";
              if (desc) {
                setJobDescription(desc);
                setShowJdInput(true);
              }
            }
          } else {
            // Fallback to ingest endpoint
            const fallbackRes = await fetch("/api/opportunities/ingest");
            if (fallbackRes.ok) {
              const fallbackData = await fallbackRes.json();
              const match = (fallbackData.opportunities || []).find((o: any) => o.id === opportunityId);
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
    resetSessionState();
    setLoading(true);
    setStage("room");
    sessionStartTimeRef.current = Date.now();
    const effectiveCandidateId = candidateId || `candidate_${Date.now()}`;
    const generatedSessionId = generateSecureId(`mock_${effectiveCandidateId}_${Date.now()}`, 7);
    sessionIdRef.current = generatedSessionId;
    const currentSessionId = generatedSessionId;

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
          interviewTrack,
          track: interviewTrack,
          targetCompany,
          targetRole,
          skillsFocus,
          difficulty,
          feedbackMode,
        }),
      });

      const chatData = await chatRes.json();
      if (sessionIdRef.current !== currentSessionId) return;

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
      if (sessionIdRef.current !== currentSessionId) return;
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
      if (sessionIdRef.current === currentSessionId) {
        setLoading(false);
      }
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

    const currentSessionId = sessionIdRef.current;

    try {
      const chatRes = await fetch("/api/interview-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: updatedMessages.map((m) => ({ role: m.role, content: m.content })),
          jd: jdContext,
          resume: resumeContext,
          qNumber: updatedMessages.filter((m) => m.role === "assistant").length + 1,
          sessionId: currentSessionId,
          candidateId: candidateId || "student-demo",
          durationMinutes,
          experienceMode,
          interviewType,
          interviewTrack,
          track: interviewTrack,
          targetCompany,
          targetRole,
          skillsFocus,
          difficulty,
          feedbackMode,
        }),
      });

      const chatData = await chatRes.json();
      if (sessionIdRef.current !== currentSessionId) return;

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

      const turnNum = updatedMessages.filter((m) => m.role === "user").length;
      if (chatData.modelAnswer) {
        userMsg.modelAnswer = chatData.modelAnswer;
        userMsg.rubricScore = chatData.rubricScore ?? chatData.modelAnswer.score;
        userMsg.turnIndex = turnNum;
        userMsg.questionTargets = chatData.questionTargets;
        userMsg.section = chatData.section;

        if (feedbackMode === "practice_learn") {
          setExpandedTurns((prev) => ({ ...prev, [turnNum]: true }));
        }
      }

      // Real-time assessment update
      if (chatData.answer_assessment || chatData.assessment) {
        const assessment = chatData.answer_assessment || chatData.assessment;
        userMsg.assessment = assessment;
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

      setMessages((prev) => {
        const copy = [...prev];
        if (copy.length > 0 && copy[copy.length - 1].role === "user") {
          copy[copy.length - 1] = { ...userMsg };
        }
        return [...copy, asstMsg];
      });

      speakVoice(asstContent);

      if (typeof chatData.rubricScore === "number" || chatData.modelAnswer?.score) {
        const earned = chatData.rubricScore ?? chatData.modelAnswer?.score;
        setLiveScore((prev) => ({
          overall: earned,
          hiringSignal: earned >= 75 ? "STRONG FIT" : earned >= 55 ? "SOLID FIT" : "DEVELOPING",
          breakdown: prev?.breakdown,
          evidence: {
            strengths: chatData.modelAnswer?.whatYouDidWell || ["Directly addressed technical question."],
            improvements: chatData.modelAnswer?.whatWasMissing || [],
            suggestedAnswer: chatData.modelAnswer?.bestPossibleAnswer || "",
            scoreReason: `Evaluated across 5 canonical rubric dimensions: score ${earned}/100.`,
          },
          verdict: `Live Answer Score: ${earned}/100.`,
        }));
      }

      setActiveQuestionMeta({
        question_targets: chatData.questionTargets || chatData.question_targets || "Adaptive Evaluation",
        question_type: chatData.section || chatData.question_type || "Technical",
        difficulty_level: chatData.difficulty || chatData.difficulty_level || "medium",
        is_follow_up: isFollowUp,
      });
    } catch (err) {
      if (sessionIdRef.current !== currentSessionId) return;
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
      if (sessionIdRef.current === currentSessionId) {
        setIsSubmitting(false);
        submissionLockRef.current = false;
      }
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
          interviewTrack,
          track: interviewTrack,
          difficulty,
          durationMinutes,
        }),
      });

      const candidateUserAnswers = messages.filter((m) => m.role === "user");
      const hasEvaluatedAnswers = candidateUserAnswers.length > 0 && liveScore !== null;
      const safeOverallScore = hasEvaluatedAnswers ? (liveScore?.overall ?? 0) : 0;

      let reportData: FinalReportData;
      if (finalRes.ok) {
        reportData = await finalRes.json();
      } else {
        reportData = {
          decision: safeOverallScore >= 75 ? "HIRE" : safeOverallScore >= 55 ? "LEANING_HIRE" : "NO_HIRE",
          confidence: hasEvaluatedAnswers ? 82 : 40,
          headline: hasEvaluatedAnswers ? `Interview Complete: ${targetRole} (${interviewType.toUpperCase()})` : `Interview Concluded Early: ${targetRole}`,
          overview: hasEvaluatedAnswers
            ? `Completed adaptive mock round covering ${topicsCovered.length > 0 ? topicsCovered.join(", ") : skillsFocus}.`
            : "Interview was concluded before substantive technical answers were submitted. No certified score earned.",
          hire_reasons: hasEvaluatedAnswers ? ["Completed full interview round", "Engaged with technical prompts"] : [],
          no_hire_reasons: hasEvaluatedAnswers ? ["Review edge-case error recovery scenarios"] : ["Concluded early without sufficient evidence across required competencies"],
          standout_moments: [],
          concerning_moments: [],
          scorecard: {
            technical_depth: { score: safeOverallScore, comment: hasEvaluatedAnswers ? "Demonstrated technical reasoning" : "Insufficient evidence" },
            problem_solving: { score: safeOverallScore, comment: hasEvaluatedAnswers ? "Decomposition evaluated" : "Insufficient evidence" },
            project_ownership: { score: safeOverallScore, comment: hasEvaluatedAnswers ? "Project details discussed" : "Insufficient evidence" },
            communication: { score: safeOverallScore, comment: hasEvaluatedAnswers ? "Clear articulation" : "Insufficient evidence" },
          },
          next_steps: "Review suggested practice questions in Skill Practice Hub to solidify weak areas.",
          interviewer_note: hasEvaluatedAnswers ? "Candidate engaged with technical interview." : "Early exit before competency evaluation.",
        };
      }

      setFinalReport(reportData);

      // 2. Persist to storage with authenticated user isolation
      const computedFinalScore = typeof reportData.report?.overallScore === "number"
        ? reportData.report.overallScore
        : safeOverallScore;

      let savedSessionId = sessionIdRef.current;
      try {
        const saveRes = await fetch("/api/interview/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: sessionIdRef.current,
            candidate_id: candidateId || "student-demo",
            session_type: "mock_interview",
            experience_mode: experienceMode,
            target_role: targetRole,
            target_company: targetCompany,
            interview_type: interviewType,
            track: interviewTrack,
            difficulty,
            duration_minutes: durationMinutes,
            topics_covered: topicsCovered.length > 0 ? topicsCovered : [skillsFocus],
            answer_distribution: sessionDistribution,
            security_flags: { tab_switches: 0, face_violations: 0 },
            overall_score: computedFinalScore,
            weak_topics_identified: reportData.no_hire_reasons || [],
            report: reportData,
            transcript: messages,
          })
        });
        if (saveRes.ok) {
          const saveJson = await saveRes.json();
          if (saveJson.session?.id) {
            savedSessionId = saveJson.session.id;
          }
        }
      } catch (saveErr) {
        console.warn("[MockInterviewExperience] Server save session warning:", saveErr);
      }

      setSavedSessionId(savedSessionId);
      setStage("report");
    } catch (err) {
      console.error("[MOCK INTERVIEW] Error completing interview:", err);
      const safeScore = liveScore?.overall ?? 0;
      setFinalReport({
        decision: safeScore >= 75 ? "HIRE" : safeScore >= 55 ? "LEANING_HIRE" : "NO_HIRE",
        confidence: safeScore > 0 ? 75 : 30,
        headline: `Completed Interview: ${targetRole}`,
        overview: safeScore > 0 ? "Interview finished and saved to your candidate trajectory." : "Interview concluded with provisional evidence.",
        hire_reasons: safeScore >= 55 ? ["Completed interview round"] : [],
        no_hire_reasons: ["Continue practice on core algorithms and scalability"],
        standout_moments: [],
        concerning_moments: [],
        scorecard: {
          technical_depth: { score: safeScore, comment: safeScore > 0 ? "Consistent baseline" : "Awaiting substantive evidence" },
          communication: { score: safeScore, comment: safeScore > 0 ? "Clear responses" : "Awaiting substantive evidence" },
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

            {/* 3. Preparation Track (All 8 Disciplines) */}
            <div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: isDark ? "#3478F6" : "#356AE6", letterSpacing: 1, textTransform: "uppercase" }}>
                  3. PREPARATION TRACK (8 Practice Disciplines)
                </div>
                <span style={{ fontSize: 10, color: isDark ? "#B6C4D6" : "#667085", fontWeight: 600 }}>
                  Active: {INTERVIEW_TRACKS.find((t) => t.id === interviewTrack)?.title || "Coding & DSA"}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 10 }}>
                {INTERVIEW_TRACKS.map((trk) => {
                  const active = interviewTrack === trk.id;
                  return (
                    <div
                      key={trk.id}
                      onClick={() => {
                        setInterviewTrack(trk.id);
                        setInterviewType(trk.defaultType);
                        if (!skillsFocus || INTERVIEW_TRACKS.some((t) => t.defaultFocus === skillsFocus)) {
                          setSkillsFocus(trk.defaultFocus);
                        }
                      }}
                      style={{
                        padding: "0.95rem",
                        borderRadius: 12,
                        border: active ? "2px solid #356AE6" : `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                        backgroundColor: active ? (isDark ? "rgba(52,120,246,0.14)" : "#EEF4FD") : isDark ? "#13243A" : "#FAF9F6",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 20 }}>{trk.icon}</span>
                        <span
                          style={{
                            fontSize: 9,
                            padding: "2px 7px",
                            borderRadius: 999,
                            backgroundColor: active ? (isDark ? "#3478F6" : "#356AE6") : isDark ? "rgba(255,255,255,0.06)" : "#E4E1DA",
                            color: active ? "#FFFFFF" : isDark ? "#B6C4D6" : "#667085",
                            fontWeight: 700,
                          }}
                        >
                          {trk.badge}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: active ? (isDark ? "#3478F6" : "#356AE6") : isDark ? "#F2F6FC" : "#162A43", marginBottom: 4 }}>
                        {trk.title}
                      </div>
                      <div style={{ fontSize: 11, color: isDark ? "#B6C4D6" : "#667085", lineHeight: 1.35 }}>
                        {trk.description}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. Round Format */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: isDark ? "#3478F6" : "#356AE6", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
                4. ROUND FORMAT
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

            {/* 5. Technical Skills & Focus Areas */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: isDark ? "#3478F6" : "#356AE6", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
                5. TECHNICAL SKILLS & FOCUS AREAS
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

            {/* 7. Feedback Mode */}
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 800, color: isDark ? "#3478F6" : "#356AE6", letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>
                7. FEEDBACK & LEARNING MODE
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
                {[
                  {
                    id: "practice_learn",
                    title: "Practice & Learn (Instant Feedback)",
                    badge: "RECOMMENDED",
                    desc: "See exemplar model answers, 100-pt rubric breakdown, and likely follow-up probes immediately after each answer.",
                    icon: "🎯",
                  },
                  {
                    id: "simulation",
                    title: "Realistic Simulation (Pressure Test)",
                    badge: "INTERVIEW MODE",
                    desc: "Seamless, uninterrupted interview dialogue. Model answers and rubric scores remain accessible via the Review Drawer.",
                    icon: "👔",
                  },
                ].map((mode) => {
                  const active = feedbackMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setFeedbackMode(mode.id as FeedbackMode)}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 10,
                        textAlign: "left",
                        border: active ? "2px solid #356AE6" : `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                        backgroundColor: active ? (isDark ? "rgba(52,120,246,0.15)" : "#EEF4FD") : isDark ? "#13243A" : "#FAF9F6",
                        color: active ? (isDark ? "#3478F6" : "#356AE6") : isDark ? "#F2F6FC" : "#17191C",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 800, color: active ? (isDark ? "#3478F6" : "#356AE6") : isDark ? "#F2F6FC" : "#17191C" }}>
                          {mode.icon} {mode.title}
                        </span>
                        <span
                          style={{
                            fontSize: 9,
                            padding: "2px 6px",
                            borderRadius: 4,
                            backgroundColor: active ? "#356AE6" : isDark ? "#223750" : "#E4E1DA",
                            color: "#FFFFFF",
                            fontWeight: 800,
                          }}
                        >
                          {mode.badge}
                        </span>
                      </div>
                      <div style={{ fontSize: 11, color: isDark ? "#B6C4D6" : "#667085", lineHeight: 1.4 }}>
                        {mode.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 8. Optional Job Description Accordion */}
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
    const evaluatedUserMessages = messages.filter((m) => m.role === "user" && m.modelAnswer);
    const activeReviewMsg = selectedReviewTurn !== null
      ? evaluatedUserMessages.find((m) => m.turnIndex === selectedReviewTurn) || evaluatedUserMessages[evaluatedUserMessages.length - 1]
      : evaluatedUserMessages[evaluatedUserMessages.length - 1];
    const totalEvaluatedTurns = evaluatedUserMessages.length;
    const overallComputedScore = totalEvaluatedTurns > 0
      ? Math.round(evaluatedUserMessages.reduce((sum, m) => sum + (m.rubricScore ?? m.modelAnswer?.score ?? 0), 0) / totalEvaluatedTurns)
      : 0;

    const derivedDistribution = evaluatedUserMessages.reduce(
      (acc, m) => {
        const quality = m.assessment?.answer_quality || (m.rubricScore && m.rubricScore >= 75 ? "strong" : m.rubricScore && m.rubricScore >= 55 ? "adequate" : "shallow");
        if (quality === "strong") acc.strong++;
        else if (quality === "adequate") acc.adequate++;
        else if ((quality as string) === "off-topic" || (quality as string) === "off_topic") acc.off_topic++;
        else acc.shallow++;
        return acc;
      },
      { strong: 0, adequate: 0, shallow: 0, off_topic: 0 }
    );

    const derivedTopicsCovered = Array.from(
      new Set(
        evaluatedUserMessages.flatMap((m) => m.assessment?.topics_demonstrated || [])
      )
    );
    const evidenceCoverage = Math.min(100, Math.round((derivedTopicsCovered.length / 5) * 100));
    const assessmentConfidence = totalEvaluatedTurns >= 4 ? "High (Multiple Calibrated Dimensions)" : totalEvaluatedTurns >= 2 ? "Moderate (Sufficient Evidence)" : "Provisional (Initial Turns)";
    const currentAssessment = activeReviewMsg?.assessment || lastAssessment;

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
                  resetSessionState();
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
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                padding: "3px 8px",
                borderRadius: 6,
                backgroundColor: feedbackMode === "practice_learn" ? (isDark ? "rgba(46,125,91,0.2)" : "#EAF4EE") : (isDark ? "rgba(52,120,246,0.15)" : "#EEF4FD"),
                color: feedbackMode === "practice_learn" ? "#2E7D5B" : (isDark ? "#3478F6" : "#356AE6"),
                border: `1px solid ${feedbackMode === "practice_learn" ? "#C8E4D3" : isDark ? "#223750" : "#D2E0FB"}`,
              }}
            >
              {feedbackMode === "practice_learn" ? "🎯 Practice & Learn Mode" : "👔 Simulation Mode"}
            </span>

            <button
              type="button"
              onClick={() => setShowReviewDrawer(!showReviewDrawer)}
              style={{
                fontSize: 11,
                padding: "5px 10px",
                borderRadius: 7,
                border: `1px solid ${showReviewDrawer ? "#356AE6" : isDark ? "#223750" : "#E4E1DA"}`,
                backgroundColor: showReviewDrawer ? (isDark ? "rgba(52,120,246,0.2)" : "#EEF4FD") : isDark ? "#13243A" : "#FAF9F6",
                color: showReviewDrawer ? (isDark ? "#3478F6" : "#356AE6") : isDark ? "#B6C4D6" : "#667085",
                cursor: "pointer",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              <span>🔍 Model Answers</span>
              {messages.filter((m) => m.role === "user" && m.modelAnswer).length > 0 && (
                <span
                  style={{
                    backgroundColor: "#356AE6",
                    color: "#FFFFFF",
                    fontSize: 9,
                    fontWeight: 800,
                    padding: "1px 5px",
                    borderRadius: 999,
                  }}
                >
                  {messages.filter((m) => m.role === "user" && m.modelAnswer).length}
                </span>
              )}
            </button>

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
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span
                    style={{
                      fontSize: 10,
                      padding: "2px 8px",
                      borderRadius: 999,
                      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#E4E1DA",
                      fontWeight: 700,
                      color: isDark ? "#E2E8F0" : "#334155",
                    }}
                  >
                    {INTERVIEW_TRACKS.find((t) => t.id === interviewTrack)?.title || "Coding & DSA"}
                  </span>
                  <div style={{ color: isDark ? "#B6C4D6" : "#667085", fontSize: 11 }}>
                    Difficulty: <strong style={{ color: "#2E7D5B" }}>{activeQuestionMeta.difficulty_level || difficulty}</strong>
                  </div>
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
          {/* Right Column: 5-Card Intelligent Assessment & Review Panel */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              overflowY: "auto",
            }}
          >
            {/* 1. REAL-TIME ASSESSMENT */}
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
                  1. REAL-TIME ASSESSMENT
                </span>
                {currentAssessment && (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: 999,
                      textTransform: "uppercase",
                      backgroundColor:
                        currentAssessment.answer_quality === "strong"
                          ? isDark ? "rgba(46,125,91,0.25)" : "#EAF4EE"
                          : currentAssessment.answer_quality === "adequate"
                          ? isDark ? "rgba(183,121,31,0.25)" : "#FDF6E9"
                          : isDark ? "rgba(194,65,65,0.25)" : "#FDF0F0",
                      color:
                        currentAssessment.answer_quality === "strong"
                          ? "#2E7D5B"
                          : currentAssessment.answer_quality === "adequate"
                          ? "#B7791F"
                          : "#C24141",
                    }}
                  >
                    {currentAssessment.answer_quality}
                  </span>
                )}
              </div>

              {activeQuestionMeta && (
                <div style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#3478F6" : "#356AE6", marginBottom: 6 }}>
                  Target Competency: {activeQuestionMeta.question_targets || activeQuestionMeta.question_type}
                </div>
              )}

              {currentAssessment ? (
                <div>
                  <div style={{ fontSize: 12, color: isDark ? "#F2F6FC" : "#17191C", lineHeight: 1.5, margin: "0 0 10px" }}>
                    <MarkdownRenderer content={currentAssessment.reasoning} compact isDark={isDark} />
                  </div>
                  <div
                    style={{
                      padding: "8px 10px",
                      borderRadius: 8,
                      backgroundColor:
                        currentAssessment.next_action === "follow_up_probe"
                          ? isDark ? "rgba(183,121,31,0.15)" : "#FDF6E9"
                          : isDark ? "rgba(46,125,91,0.15)" : "#EAF4EE",
                      fontSize: 11,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span>{currentAssessment.next_action === "follow_up_probe" ? "🔍" : "➡️"}</span>
                    <span
                      style={{
                        fontWeight: 700,
                        color: currentAssessment.next_action === "follow_up_probe" ? "#B7791F" : "#2E7D5B",
                      }}
                    >
                      {currentAssessment.next_action === "follow_up_probe"
                        ? "Follow-up probe required on trade-offs & edge cases"
                        : "Competency satisfied — transitioning to next focus"}
                    </span>
                  </div>

                  {currentAssessment.topics_demonstrated && currentAssessment.topics_demonstrated.length > 0 && (
                    <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 4 }}>
                      {currentAssessment.topics_demonstrated.map((t, idx) => (
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

            {/* 2. LATEST ANSWER REVIEW */}
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
                  2. LATEST ANSWER REVIEW
                </span>
                {activeReviewMsg?.modelAnswer && (
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: 6,
                      backgroundColor: (activeReviewMsg.rubricScore ?? activeReviewMsg.modelAnswer.score) >= 75 ? "#EAF4EE" : (activeReviewMsg.rubricScore ?? activeReviewMsg.modelAnswer.score) >= 55 ? "#FEF7ED" : "#FDF0F0",
                      color: (activeReviewMsg.rubricScore ?? activeReviewMsg.modelAnswer.score) >= 75 ? "#2E7D5B" : (activeReviewMsg.rubricScore ?? activeReviewMsg.modelAnswer.score) >= 55 ? "#B7791F" : "#C24141",
                    }}
                  >
                    {activeReviewMsg.rubricScore ?? activeReviewMsg.modelAnswer.score}/100 pts
                  </span>
                )}
              </div>

              {/* Turn selector if multiple turns exist */}
              {evaluatedUserMessages.length > 1 && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, overflowX: "auto", paddingBottom: 4 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: isDark ? "#7E8FA6" : "#98A2B3" }}>Review:</span>
                  {evaluatedUserMessages.map((m, idx) => {
                    const isSelected = (selectedReviewTurn === null && idx === evaluatedUserMessages.length - 1) || selectedReviewTurn === m.turnIndex;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedReviewTurn(m.turnIndex || idx + 1)}
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: 6,
                          border: `1px solid ${isSelected ? "#356AE6" : isDark ? "#223750" : "#E4E1DA"}`,
                          backgroundColor: isSelected ? (isDark ? "#1A365D" : "#EEF4FD") : isDark ? "#13243A" : "#FAF9F6",
                          color: isSelected ? "#356AE6" : isDark ? "#B6C4D6" : "#667085",
                          cursor: "pointer",
                        }}
                      >
                        Turn {m.turnIndex || idx + 1} ({m.rubricScore ?? m.modelAnswer?.score}pts)
                      </button>
                    );
                  })}
                </div>
              )}

              {activeReviewMsg?.modelAnswer ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {/* Evaluated question context */}
                  {activeReviewMsg.questionTargets && (
                    <div style={{ fontSize: 11, color: isDark ? "#B6C4D6" : "#667085", lineHeight: 1.3 }}>
                      <strong style={{ color: isDark ? "#F2F6FC" : "#17191C" }}>Target:</strong> {activeReviewMsg.questionTargets}
                    </div>
                  )}

                  {/* 100-Point Dimension Breakdown */}
                  <div>
                    <div style={{ fontSize: 10, fontWeight: 800, color: isDark ? "#B6C4D6" : "#667085", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>
                      RUBRIC BREAKDOWN (5 DIMENSIONS)
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      {activeReviewMsg.modelAnswer.dimensionScores.map((dim: any, dIdx: number) => (
                        <div
                          key={dIdx}
                          style={{
                            padding: "6px 8px",
                            borderRadius: 8,
                            backgroundColor: isDark ? "#13243A" : "#F6F5F1",
                            border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, color: isDark ? "#F2F6FC" : "#17191C" }}>
                              {dim.dimension}
                            </span>
                            <span style={{ fontSize: 10.5, fontWeight: 800, color: isDark ? "#3478F6" : "#356AE6" }}>
                              {dim.earnedPoints}/{dim.maxPoints}
                            </span>
                          </div>
                          <div style={{ height: 3, borderRadius: 2, backgroundColor: isDark ? "#223750" : "#E4E1DA", overflow: "hidden", marginBottom: 3 }}>
                            <div
                              style={{
                                height: "100%",
                                width: `${Math.round((dim.earnedPoints / dim.maxPoints) * 100)}%`,
                                backgroundColor: dim.earnedPoints / dim.maxPoints >= 0.75 ? "#2E7D5B" : dim.earnedPoints / dim.maxPoints >= 0.5 ? "#B7791F" : "#C24141",
                                borderRadius: 2,
                              }}
                            />
                          </div>
                          <div style={{ fontSize: 9.5, color: isDark ? "#B6C4D6" : "#667085", lineHeight: 1.3 }}>
                            <MarkdownRenderer content={dim.explanation} compact isDark={isDark} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Exemplar Model Answer */}
                  <div
                    style={{
                      borderRadius: 8,
                      backgroundColor: isDark ? "rgba(46,125,91,0.12)" : "#EAF4EE",
                      border: "1px solid rgba(46,125,91,0.3)",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      onClick={() => setModelAnswerExpanded(!modelAnswerExpanded)}
                      style={{
                        padding: "8px 10px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        cursor: "pointer",
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#2E7D5B" }}>
                        ★ TOP-TIER EXEMPLAR MODEL ANSWER
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: "#2E7D5B" }}>
                        {modelAnswerExpanded ? "▲ Collapse" : "▼ Expand"}
                      </span>
                    </div>
                    {modelAnswerExpanded && (
                      <div style={{ padding: "0 10px 10px", fontSize: 11.5, color: isDark ? "#F2F6FC" : "#17191C", lineHeight: 1.5 }}>
                        {activeReviewMsg.modelAnswer.bestPossibleAnswer}
                      </div>
                    )}
                  </div>

                  {/* Strengths & Missing Side by Side */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    <div style={{ padding: "6px 8px", borderRadius: 8, backgroundColor: isDark ? "#13243A" : "#FAF9F6", border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}` }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: "#2E7D5B", marginBottom: 2 }}>
                        ✓ WHAT YOU DID WELL
                      </div>
                      <div style={{ fontSize: 10.5, color: isDark ? "#B6C4D6" : "#667085", lineHeight: 1.35 }}>
                        {activeReviewMsg.modelAnswer.whatYouDidWell.join("; ") || "Direct technical response provided."}
                      </div>
                    </div>
                    <div style={{ padding: "6px 8px", borderRadius: 8, backgroundColor: isDark ? "#13243A" : "#FAF9F6", border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}` }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: "#B7791F", marginBottom: 2 }}>
                        ⚠️ WHAT WAS MISSING / DEDUCTIONS
                      </div>
                      <div style={{ fontSize: 10.5, color: isDark ? "#B6C4D6" : "#667085", lineHeight: 1.35 }}>
                        {activeReviewMsg.modelAnswer.whatWasMissing.join("; ") || activeReviewMsg.modelAnswer.howToImprove}
                      </div>
                    </div>
                  </div>

                  {/* Likely Follow-Up Questions */}
                  {activeReviewMsg.modelAnswer.likelyFollowUps && activeReviewMsg.modelAnswer.likelyFollowUps.length > 0 && (
                    <div style={{ padding: "6px 8px", borderRadius: 8, backgroundColor: isDark ? "#13243A" : "#FAF9F6", border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}` }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: isDark ? "#3478F6" : "#356AE6", marginBottom: 2 }}>
                        🔮 LIKELY INTERVIEWER FOLLOW-UPS:
                      </div>
                      <ul style={{ margin: 0, paddingLeft: "1rem", fontSize: 10.5, color: isDark ? "#B6C4D6" : "#667085", lineHeight: 1.4 }}>
                        {activeReviewMsg.modelAnswer.likelyFollowUps.map((fu: string, fuIdx: number) => (
                          <li key={fuIdx}>{fu}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "1.5rem 0.5rem", color: isDark ? "#7E8FA6" : "#98A2B3", fontSize: 12 }}>
                  {isSubmitting ? "Alex is evaluating your answer..." : "Submit your first technical answer to view rubric breakdown and exemplar model answer."}
                </div>
              )}
            </div>

            {/* 3. SESSION ANSWER DISTRIBUTION */}
            <div
              style={{
                backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
                border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                borderRadius: 16,
                padding: "1rem 1.25rem",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: isDark ? "#B6C4D6" : "#667085", letterSpacing: 0.5, marginBottom: 8 }}>
                3. SESSION ANSWER DISTRIBUTION
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, textAlign: "center" }}>
                <div style={{ padding: "6px 2px", borderRadius: 8, backgroundColor: isDark ? "rgba(46,125,91,0.15)" : "#EAF4EE" }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#2E7D5B" }}>{derivedDistribution.strong}</div>
                  <div style={{ fontSize: 9, color: isDark ? "#B6C4D6" : "#667085" }}>Strong</div>
                </div>
                <div style={{ padding: "6px 2px", borderRadius: 8, backgroundColor: isDark ? "rgba(183,121,31,0.15)" : "#FDF6E9" }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#B7791F" }}>{derivedDistribution.adequate}</div>
                  <div style={{ fontSize: 9, color: isDark ? "#B6C4D6" : "#667085" }}>Adequate</div>
                </div>
                <div style={{ padding: "6px 2px", borderRadius: 8, backgroundColor: isDark ? "rgba(249,115,22,0.15)" : "#FFF7ED" }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#EA580C" }}>{derivedDistribution.shallow}</div>
                  <div style={{ fontSize: 9, color: isDark ? "#B6C4D6" : "#667085" }}>Shallow</div>
                </div>
                <div style={{ padding: "6px 2px", borderRadius: 8, backgroundColor: isDark ? "rgba(194,65,65,0.15)" : "#FDF0F0" }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: "#C24141" }}>{derivedDistribution.off_topic}</div>
                  <div style={{ fontSize: 9, color: isDark ? "#B6C4D6" : "#667085" }}>Off-topic</div>
                </div>
              </div>
            </div>

            {/* 4. OVERALL INTERVIEW SCORE */}
            <div
              style={{
                backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
                border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                borderRadius: 16,
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 10, color: isDark ? "#B6C4D6" : "#667085", fontWeight: 700, textTransform: "uppercase" }}>
                    4. OVERALL INTERVIEW SCORE
                  </div>
                  {totalEvaluatedTurns > 0 ? (
                    <div style={{ fontSize: 24, fontWeight: 900, color: "#2E7D5B" }}>
                      {overallComputedScore} <span style={{ fontSize: 12, color: isDark ? "#7E8FA6" : "#98A2B3" }}>/ 100</span>
                    </div>
                  ) : (
                    <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? "#7E8FA6" : "#98A2B3", marginTop: 4 }}>
                      Provisional (Awaiting Evaluation)
                    </div>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    padding: "4px 8px",
                    borderRadius: 6,
                    backgroundColor: totalEvaluatedTurns === 0 ? (isDark ? "#13243A" : "#F6F5F1") : overallComputedScore >= 75 ? "#EAF4EE" : overallComputedScore >= 55 ? "#FEF7ED" : "#FDF0F0",
                    color: totalEvaluatedTurns === 0 ? (isDark ? "#7E8FA6" : "#98A2B3") : overallComputedScore >= 75 ? "#2E7D5B" : overallComputedScore >= 55 ? "#B7791F" : "#C24141",
                    border: "1px solid rgba(0,0,0,0.06)",
                  }}
                >
                  {assessmentConfidence}
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 11, color: isDark ? "#B6C4D6" : "#667085" }}>
                <span>Evidence Coverage:</span>
                <span style={{ fontWeight: 700 }}>{evidenceCoverage}% ({derivedTopicsCovered.length} Competencies)</span>
              </div>

              <div style={{ fontSize: 10, color: isDark ? "#7E8FA6" : "#98A2B3", lineHeight: 1.35 }}>
                {totalEvaluatedTurns > 0
                  ? `Computed from ${totalEvaluatedTurns} validated answer evaluation${totalEvaluatedTurns > 1 ? "s" : ""} across 5 canonical rubric dimensions.`
                  : "Score reflects actual submitted answers. No arbitrary or pre-filled scores are displayed."}
              </div>
            </div>

            {/* 5. SKILL PRACTICE HUB */}
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
                  5. SKILL PRACTICE HUB
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

        {/* Model Answers & Rubrics Slide-Out Review Drawer */}
        {showReviewDrawer && (
          <div
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "100%",
              maxWidth: 540,
              backgroundColor: isDark ? "#0A1626" : "#FFFFFF",
              borderLeft: `1px solid ${isDark ? "#223750" : "#D2E0FB"}`,
              boxShadow: "-8px 0 24px rgba(0,0,0,0.25)",
              zIndex: 100,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                padding: "1.25rem 1.5rem",
                borderBottom: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                backgroundColor: isDark ? "#0E1B2E" : "#FAF9F6",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 18 }}>💡</span>
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: isDark ? "#F2F6FC" : "#162A43" }}>
                    Turn-by-Turn Model Answers & Rubric Review
                  </h3>
                  <div style={{ fontSize: 11, color: isDark ? "#B6C4D6" : "#667085" }}>
                    Official 100-point rubric breakdown & FAANG-standard exemplar responses
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowReviewDrawer(false)}
                style={{
                  background: "transparent",
                  border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                  borderRadius: 6,
                  padding: "4px 8px",
                  fontSize: 12,
                  fontWeight: 700,
                  color: isDark ? "#B6C4D6" : "#667085",
                  cursor: "pointer",
                }}
              >
                ✕ Close
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem 1.5rem", display: "flex", flexDirection: "column", gap: 16 }}>
              {messages.filter((m) => m.role === "user" && m.modelAnswer).length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem 1rem", color: isDark ? "#7E8FA6" : "#98A2B3" }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>📝</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>No Answer Evaluations Yet</div>
                  <div style={{ fontSize: 11.5, lineHeight: 1.5 }}>
                    Answer Alex&apos;s interview questions. As you complete each question, comprehensive 100-point rubric evaluations and exemplar answers will appear here.
                  </div>
                </div>
              ) : (
                messages
                  .filter((m) => m.role === "user" && m.modelAnswer)
                  .map((m, revIdx) => {
                    const ans = m.modelAnswer!;
                    return (
                      <div
                        key={revIdx}
                        style={{
                          borderRadius: 12,
                          backgroundColor: isDark ? "#0E1B2E" : "#FAF9F6",
                          border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                          padding: "1rem",
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 800, color: isDark ? "#3478F6" : "#356AE6" }}>
                            TURN #{m.turnIndex || revIdx + 1} EVALUATION
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              padding: "2px 8px",
                              borderRadius: 999,
                              backgroundColor: ans.score >= 75 ? "#EAF4EE" : ans.score >= 55 ? "#FEF7ED" : "#FDF0F0",
                              color: ans.score >= 75 ? "#2E7D5B" : ans.score >= 55 ? "#B7791F" : "#C24141",
                              border: `1px solid ${ans.score >= 75 ? "#C8E4D3" : ans.score >= 55 ? "#F8D8A7" : "#F5C2C2"}`,
                            }}
                          >
                            Score: {ans.score}/100
                          </span>
                        </div>

                        {/* Candidate submitted answer */}
                        <div style={{ fontSize: 11.5, color: isDark ? "#B6C4D6" : "#475467", fontStyle: "italic", marginBottom: 10, padding: "6px 10px", borderRadius: 6, backgroundColor: isDark ? "rgba(0,0,0,0.2)" : "#F2EFEB" }}>
                          &ldquo;{m.content.slice(0, 180)}{m.content.length > 180 ? "..." : ""}&rdquo;
                        </div>

                        {/* 5-Dimension Rubric Summary */}
                        <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 10 }}>
                          {ans.dimensionScores.map((ds, dsIdx) => (
                            <div key={dsIdx} style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5 }}>
                              <span style={{ color: isDark ? "#B6C4D6" : "#667085" }}>{ds.dimension}</span>
                              <span style={{ fontWeight: 700, color: isDark ? "#F2F6FC" : "#17191C" }}>
                                {ds.earnedPoints}/{ds.maxPoints} pts
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Top-tier exemplar answer */}
                        <div style={{ padding: "8px 10px", borderRadius: 8, backgroundColor: isDark ? "rgba(46,125,91,0.12)" : "#EAF4EE", border: "1px solid rgba(46,125,91,0.25)", marginBottom: 8 }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: "#2E7D5B", marginBottom: 3 }}>
                            ★ EXEMPLAR MODEL ANSWER:
                          </div>
                          <div style={{ fontSize: 11.5, color: isDark ? "#F2F6FC" : "#17191C", lineHeight: 1.5 }}>
                            {ans.bestPossibleAnswer}
                          </div>
                        </div>

                        {/* Strengths & Missing */}
                        <div style={{ fontSize: 10.5, color: isDark ? "#B6C4D6" : "#667085", lineHeight: 1.4 }}>
                          <strong style={{ color: "#2E7D5B" }}>Strengths:</strong> {ans.whatYouDidWell.join("; ")}
                        </div>
                        <div style={{ fontSize: 10.5, color: isDark ? "#B6C4D6" : "#667085", lineHeight: 1.4, marginTop: 2 }}>
                          <strong style={{ color: "#B7791F" }}>Gap / Missing:</strong> {ans.whatWasMissing.join("; ") || ans.howToImprove}
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════
  // RENDER: STAGE 3 — POST-INTERVIEW DETAILED REPORT & HISTORY SCREEN
  // ═════════════════════════════════════════════════════════════════════
  const reportOverallScore = finalReport?.report?.overallScore ?? liveScore?.overall ?? 0;
  const hireDecision = finalReport?.decision || (reportOverallScore >= 68 ? "HIRE" : "NO_HIRE");
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
              onClick={() => {
                resetSessionState();
                setStage("setup");
              }}
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
              {finalReport?.overview || (reportOverallScore === 0 ? "The interview session was concluded before substantive technical answers were submitted. No certified score earned." : "Demonstrated technical reasoning and answered adaptive follow-up probes with consistency.")}
            </p>
          </div>
        </div>

        {/* 4 Performance Rubric Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 14, marginBottom: "1.5rem" }}>
          {[
            {
              title: "Technical Depth",
              score: finalReport?.scorecard?.technical_depth?.score ?? (reportOverallScore > 0 ? reportOverallScore : 0),
              comment: finalReport?.scorecard?.technical_depth?.comment || (reportOverallScore === 0 ? "No technical answers submitted for depth assessment." : "Comprehension evaluated based on submitted answers."),
              icon: "⚡",
            },
            {
              title: "Problem Solving",
              score: finalReport?.scorecard?.problem_solving?.score ?? (reportOverallScore > 0 ? reportOverallScore : 0),
              comment: finalReport?.scorecard?.problem_solving?.comment || (reportOverallScore === 0 ? "No problem solving responses submitted." : "Algorithmic and structural reasoning evaluated."),
              icon: "🧩",
            },
            {
              title: "Project Ownership",
              score: finalReport?.scorecard?.project_ownership?.score ?? (reportOverallScore > 0 ? reportOverallScore : 0),
              comment: finalReport?.scorecard?.project_ownership?.comment || (reportOverallScore === 0 ? "No project defense responses submitted." : "Architecture and implementation claims evaluated."),
              icon: "🏛️",
            },
            {
              title: "Communication Clarity",
              score: finalReport?.scorecard?.communication?.score ?? (reportOverallScore > 0 ? reportOverallScore : 0),
              comment: finalReport?.scorecard?.communication?.comment || (reportOverallScore === 0 ? "No responses submitted for communication assessment." : "Communication clarity evaluated."),
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

        {/* ═══ QUESTION-BY-QUESTION DEEP DIVE: 100-POINT RUBRIC & MODEL ANSWERS ═══ */}
        {(() => {
          const qList =
            (finalReport?.report?.questionByQuestionAnalysis && finalReport.report.questionByQuestionAnalysis.length > 0)
              ? finalReport.report.questionByQuestionAnalysis
              : messages
                  .filter((m) => m.role === "user" && m.modelAnswer)
                  .map((m, idx) => ({
                    turnIndex: m.turnIndex || idx + 1,
                    question: m.questionTargets ? `Question ${idx + 1}: ${m.questionTargets}` : `Question ${idx + 1}`,
                    section: m.section || "technical_fundamentals",
                    candidateAnswer: m.content,
                    rubricScore: m.rubricScore || m.modelAnswer!.score,
                    dimensionScores: m.modelAnswer!.dimensionScores,
                    exemplarModelAnswer: m.modelAnswer!.bestPossibleAnswer,
                    whatWentWell: m.modelAnswer!.whatYouDidWell,
                    whatWasMissing: m.modelAnswer!.whatWasMissing,
                    deductionReasons: m.modelAnswer!.deductionReasons,
                    keyConcepts: m.modelAnswer!.keyConceptsToRemember,
                    likelyFollowUps: m.modelAnswer!.likelyFollowUps,
                  }));

          if (qList.length === 0) return null;

          return (
            <div
              style={{
                backgroundColor: isDark ? "#0E1B2E" : "#FFFFFF",
                border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                borderRadius: 16,
                padding: "1.75rem",
                marginBottom: "1.5rem",
                boxShadow: isDark ? "0 4px 20px rgba(0,0,0,0.3)" : "0 4px 20px rgba(22,42,67,0.04)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 22 }}>🎯</span>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0, color: isDark ? "#F2F6FC" : "#162A43" }}>
                      Question-by-Question Deep Dive & Exemplar Model Answers
                    </h3>
                    <div style={{ fontSize: 11.5, color: isDark ? "#B6C4D6" : "#667085" }}>
                      Evaluated against Cognalyze&apos;s canonical 100-point FAANG interview rubric
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "3px 10px",
                    borderRadius: 999,
                    backgroundColor: isDark ? "rgba(52,120,246,0.15)" : "#EEF4FD",
                    color: isDark ? "#3478F6" : "#356AE6",
                    border: `1px solid ${isDark ? "#223750" : "#D2E0FB"}`,
                  }}
                >
                  {qList.length} Technical Questions Evaluated
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                {qList.map((item: any, qIdx: number) => {
                  const score = item.rubricScore || 80;
                  const scoreBadgeBg = score >= 75 ? "#EAF4EE" : score >= 55 ? "#FEF7ED" : "#FDF0F0";
                  const scoreBadgeColor = score >= 75 ? "#2E7D5B" : score >= 55 ? "#B7791F" : "#C24141";
                  const scoreBadgeBorder = score >= 75 ? "#C8E4D3" : score >= 55 ? "#F8D8A7" : "#F5C2C2";

                  return (
                    <div
                      key={qIdx}
                      style={{
                        padding: "1.25rem 1.5rem",
                        borderRadius: 14,
                        backgroundColor: isDark ? "#13243A" : "#FAF9F6",
                        border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                        display: "flex",
                        flexDirection: "column",
                        gap: 12,
                      }}
                    >
                      {/* Turn Header */}
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              padding: "2px 8px",
                              borderRadius: 6,
                              backgroundColor: isDark ? "#0A1626" : "#FFFFFF",
                              border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                              color: isDark ? "#3478F6" : "#356AE6",
                              textTransform: "uppercase",
                            }}
                          >
                            Q{item.turnIndex || qIdx + 1} · {String(item.section || "Technical").replace("_", " ")}
                          </span>
                        </div>

                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 900,
                            padding: "3px 10px",
                            borderRadius: 999,
                            backgroundColor: scoreBadgeBg,
                            color: scoreBadgeColor,
                            border: `1px solid ${scoreBadgeBorder}`,
                          }}
                        >
                          Rubric Score: {score} / 100
                        </span>
                      </div>

                      {/* Question */}
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: isDark ? "#B6C4D6" : "#667085", textTransform: "uppercase", marginBottom: 3 }}>
                          QUESTION PROMPTED:
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: isDark ? "#F2F6FC" : "#162A43", lineHeight: 1.5 }}>
                          {item.question}
                        </div>
                      </div>

                      {/* Candidate Submitted Answer */}
                      <div
                        style={{
                          padding: "10px 14px",
                          borderRadius: 8,
                          backgroundColor: isDark ? "#0A1626" : "#FFFFFF",
                          border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                        }}
                      >
                        <div style={{ fontSize: 10, fontWeight: 800, color: isDark ? "#7E8FA6" : "#98A2B3", textTransform: "uppercase", marginBottom: 3 }}>
                          YOUR SUBMITTED ANSWER:
                        </div>
                        <div style={{ fontSize: 12.5, color: isDark ? "#F2F6FC" : "#17191C", lineHeight: 1.55 }}>
                          {item.candidateAnswer}
                        </div>
                      </div>

                      {/* 5-Dimension Rubric Breakdown Grid */}
                      {item.dimensionScores && item.dimensionScores.length > 0 && (
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 800, color: isDark ? "#B6C4D6" : "#667085", letterSpacing: 0.5, textTransform: "uppercase", marginBottom: 6 }}>
                            100-POINT RUBRIC DIMENSION BREAKDOWN:
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
                            {item.dimensionScores.map((dim: any, dIdx: number) => (
                              <div
                                key={dIdx}
                                style={{
                                  padding: "8px 10px",
                                  borderRadius: 8,
                                  backgroundColor: isDark ? "#0A1626" : "#FFFFFF",
                                  border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}`,
                                }}
                              >
                                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3 }}>
                                  <span style={{ fontSize: 10.5, fontWeight: 700, color: isDark ? "#F2F6FC" : "#17191C" }}>
                                    {dim.dimension}
                                  </span>
                                  <span style={{ fontSize: 11, fontWeight: 800, color: isDark ? "#3478F6" : "#356AE6" }}>
                                    {dim.earnedPoints}/{dim.maxPoints}
                                  </span>
                                </div>
                                <div style={{ height: 4, borderRadius: 2, backgroundColor: isDark ? "#223750" : "#E4E1DA", overflow: "hidden", marginBottom: 4 }}>
                                  <div
                                    style={{
                                      height: "100%",
                                      width: `${Math.round((dim.earnedPoints / dim.maxPoints) * 100)}%`,
                                      backgroundColor: dim.earnedPoints / dim.maxPoints >= 0.75 ? "#2E7D5B" : dim.earnedPoints / dim.maxPoints >= 0.5 ? "#B7791F" : "#C24141",
                                      borderRadius: 2,
                                    }}
                                  />
                                </div>
                                <div style={{ fontSize: 9.5, color: isDark ? "#B6C4D6" : "#667085", lineHeight: 1.35 }}>
                                  <MarkdownRenderer content={dim.explanation} compact isDark={isDark} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Exemplar Model Answer */}
                      <div
                        style={{
                          padding: "12px 14px",
                          borderRadius: 10,
                          backgroundColor: isDark ? "rgba(46,125,91,0.12)" : "#EAF4EE",
                          border: "1px solid rgba(46,125,91,0.3)",
                        }}
                      >
                        <div style={{ fontSize: 11, fontWeight: 800, color: "#2E7D5B", marginBottom: 4 }}>
                          ★ TOP-TIER EXEMPLAR MODEL ANSWER (FAANG BAR):
                        </div>
                        <div style={{ fontSize: 12.5, color: isDark ? "#F2F6FC" : "#17191C", lineHeight: 1.55 }}>
                          {item.exemplarModelAnswer}
                        </div>
                      </div>

                      {/* Strengths & Missing Side by Side */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 10 }}>
                        <div style={{ padding: "10px 12px", borderRadius: 8, backgroundColor: isDark ? "#0A1626" : "#FFFFFF", border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}` }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: "#2E7D5B", marginBottom: 4 }}>
                            ✓ WHAT YOU DEMONSTRATED WELL
                          </div>
                          <div style={{ fontSize: 11.5, color: isDark ? "#B6C4D6" : "#667085", lineHeight: 1.45 }}>
                            {Array.isArray(item.whatWentWell) ? item.whatWentWell.join("; ") : "Direct technical response provided."}
                          </div>
                        </div>
                        <div style={{ padding: "10px 12px", borderRadius: 8, backgroundColor: isDark ? "#0A1626" : "#FFFFFF", border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}` }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: "#B7791F", marginBottom: 4 }}>
                            ⚠️ WHAT WAS MISSING / DEDUCTION REASON
                          </div>
                          <div style={{ fontSize: 11.5, color: isDark ? "#B6C4D6" : "#667085", lineHeight: 1.45 }}>
                            {Array.isArray(item.whatWasMissing) ? item.whatWasMissing.join("; ") : "Expand on production scale and trade-offs."}
                          </div>
                        </div>
                      </div>

                      {/* Likely Follow-Up Questions */}
                      {item.likelyFollowUps && item.likelyFollowUps.length > 0 && (
                        <div style={{ padding: "10px 12px", borderRadius: 8, backgroundColor: isDark ? "#0A1626" : "#FFFFFF", border: `1px solid ${isDark ? "#223750" : "#E4E1DA"}` }}>
                          <div style={{ fontSize: 10, fontWeight: 800, color: isDark ? "#3478F6" : "#356AE6", marginBottom: 4 }}>
                            🔮 LIKELY INTERVIEWER FOLLOW-UP QUESTIONS:
                          </div>
                          <ul style={{ margin: 0, paddingLeft: "1.2rem", fontSize: 11.5, color: isDark ? "#B6C4D6" : "#667085", lineHeight: 1.5 }}>
                            {item.likelyFollowUps.map((fu: string, fuIdx: number) => (
                              <li key={fuIdx}>{fu}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}

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
