"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  generateSessionBrief,
  PostSessionFeedback,
  SessionBrief
} from "@/lib/skills/adaptive-engine";
import SessionBriefModal from "@/components/skills/SessionBriefModal";
import {
  DSA_ROADMAP_STEPS,
  getAllDsaSheetProblems,
  getDsaSheetProblemById,
  getTargetedReTestProblem,
  DsaProblemFull,
  DsaInterviewQuestionItem
} from "@/lib/skills/dsa-curriculum";
import {
  getStudentDsaFocus,
  getStudentDsaSummary,
  getStudentDsaProgress,
  updateStudentDsaStatus
} from "@/lib/skills/candidate-history";
import {
  CANONICAL_DSA_PROBLEMS,
  getCanonicalProblem,
  CanonicalProblem
} from "@/lib/skills/dsa-canonical-problems";
import {
  getDraftKey,
  getProblemStarterCode,
  loadDraftsFromStorage,
  saveDraftToStorage,
  resolveProblemCode,
  SupportedLanguage
} from "@/lib/skills/dsa-code-persistence";
import CanonicalProblemView from "@/components/skills/CanonicalProblemView";
import { DsaInterviewSession } from "@/lib/skills/dsa-interview-store";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import { DsaMentorDrawer } from "@/components/skills/DsaMentorDrawer";
import { DsaVisualizer } from "@/components/skills/DsaVisualizer";
import { DsaApproachComparator } from "@/components/skills/DsaApproachComparator";
import { DsaDebugLab } from "@/components/skills/DsaDebugLab";
import { COMPANY_TRACKS, getCompanyTrackBySlug } from "@/lib/skills/dsa-company-prep";
import { DsaUpgradedInterviewView } from "@/components/skills/DsaUpgradedInterviewView";
import DsaMasteryTrackerView from "@/components/skills/DsaMasteryTrackerView";
import ConceptMasteryHub from "@/components/skills/learn/ConceptMasteryHub";

export type DSAMode = "learn" | "practice" | "coach" | "interview" | "tracker";

function DSACodingArenaContent() {
  const searchParams = useSearchParams();
  const [candidateId, setCandidateId] = useState("");
  const [trackSlug, setTrackSlug] = useState<"service_mass" | "service_elite" | "product_mid" | "product_faang">("product_mid");

  // Mode Selector: Learn | Practice | Coach | Interview
  const [mode, setMode] = useState<DSAMode>("practice");
  const [selectedLanguage, setSelectedLanguage] = useState<"cpp" | "python" | "javascript" | "java">("cpp");

  // A2Z DSA Roadmap Navigation State
  const [selectedStepId, setSelectedStepId] = useState<string>("step-4");
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [problemsList, setProblemsList] = useState<DsaProblemFull[]>([]);
  const [activeProblem, setActiveProblem] = useState<DsaProblemFull>(() => getDsaSheetProblemById("painter-s-partition-problem"));

  // Dynamic Candidate State & DSA progress
  const [dsaSummary, setDsaSummary] = useState(() => getStudentDsaSummary(""));
  const [currentFocus, setCurrentFocus] = useState(() => getStudentDsaFocus(""));
  const [candidateProgressMap, setCandidateProgressMap] = useState<Record<string, any>>({});

  // DSA Mentor, Company Tracks & Advanced Labs State
  const [isMentorOpen, setIsMentorOpen] = useState(false);
  const [roadmapMode, setRoadmapMode] = useState<"a2z" | "company">("a2z");
  const [selectedCompanySlug, setSelectedCompanySlug] = useState<string>("google");
  const [companyProvenanceFilter, setCompanyProvenanceFilter] = useState<string>("all");
  const [activeLabTab, setActiveLabTab] = useState<"tutorial" | "dryrun" | "approaches" | "debug">("tutorial");

  // Learn Mode State
  const [learnSubView, setLearnSubView] = useState<"concept_mastery" | "problem_labs">("concept_mastery");
  const [revealedSolution, setRevealedSolution] = useState(false);
  const [activeLearnSection, setActiveLearnSection] = useState<"concept" | "bruteforce" | "optimal" | "dryrun">("concept");
  const [checkpointSubmitted, setCheckpointSubmitted] = useState(false);
  const [selectedCheckpointOption, setSelectedCheckpointOption] = useState<number | null>(null);

  // Practice & Code Editor State (Protected Single Source of Truth & LocalStorage Partitioning)
  const draftsRef = useRef<Record<string, string>>({});
  const activeProblemIdRef = useRef<string>(activeProblem.id);
  const activeLanguageRef = useRef<string>(selectedLanguage);
  const isCodeInitializedRef = useRef<boolean>(false);
  const [code, setCode] = useState("");

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    const key = getDraftKey(activeProblem.id, selectedLanguage);
    draftsRef.current[key] = newCode;
    saveDraftToStorage(candidateId, activeProblem.id, selectedLanguage as SupportedLanguage, newCode);
  };

  const handleResetStarter = () => {
    const starter = getProblemStarterCode(activeProblem, selectedLanguage as SupportedLanguage);
    const key = getDraftKey(activeProblem.id, selectedLanguage);
    draftsRef.current[key] = starter;
    saveDraftToStorage(candidateId, activeProblem.id, selectedLanguage as SupportedLanguage, starter);
    setCode(starter);
    setTestOutput(null);
    setPostFeedback(null);
    setLastSubmissionVerdict(null);
  };

  const [runningTests, setRunningTests] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [testOutput, setTestOutput] = useState<{
    passed: boolean;
    score: number;
    passedCount: number;
    totalTests: number;
    status: string;
    verdict: string;
    message: string;
    compilationError?: string;
    results?: Array<{
      input: string;
      expected: string;
      actual: string;
      passed: boolean;
      status: string;
      executionTimeMs: number;
      errorMessage?: string;
      isHidden?: boolean;
    }>;
  } | null>(null);
  const [postFeedback, setPostFeedback] = useState<PostSessionFeedback | null>(null);
  const [lastSubmissionVerdict, setLastSubmissionVerdict] = useState<string | null>(null);

  // Socratic Coach Mode State
  const [coachLog, setCoachLog] = useState<{ sender: "coach" | "candidate"; text: string }[]>([
    {
      sender: "coach",
      text: "Hello! I am your Socratic Algorithmic Coach. I observe your approach and invariants. How are you formulating your data structure or boundary conditions?"
    }
  ]);
  const [coachInput, setCoachInput] = useState("");
  const [coachThinking, setCoachThinking] = useState(false);
  const [coachAssistanceUsed, setCoachAssistanceUsed] = useState(false);
  const [suggestedChips, setSuggestedChips] = useState<string[]>([
    "Check my invariant logic",
    "Give me a progressive hint",
    "What is the optimal complexity?",
    "Explain in Hinglish"
  ]);
  const [coachViewMode, setCoachViewMode] = useState<"both" | "editor" | "coach">("both");

  // ── INTERVIEW MODE STATE (Persistent Server-Backed Session) ──
  const [interviewTopic, setInterviewTopic] = useState("binary-search");
  const [interviewDifficulty, setInterviewDifficulty] = useState("mixed");
  const [interviewQuestionCount, setInterviewQuestionCount] = useState(3);
  const [interviewDurationMins, setInterviewDurationMins] = useState(30);

  const [activeSession, setActiveSession] = useState<DsaInterviewSession | null>(null);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [interviewTimeLeft, setInterviewTimeLeft] = useState(1800);
  const [interviewerFollowUp, setInterviewerFollowUp] = useState<string | null>(null);
  const [candidateFollowUpResponse, setCandidateFollowUpResponse] = useState("");
  const [followUpSaved, setFollowUpSaved] = useState(false);
  const [evaluationError, setEvaluationError] = useState<string | null>(null);

  // Proctoring State
  const [proctoringActive, setProctoringActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [tabSwitchViolations, setTabSwitchViolations] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Session Brief Modal
  const [sessionBrief, setSessionBrief] = useState<SessionBrief | null>(null);
  const [isBriefOpen, setIsBriefOpen] = useState(false);

  // ── CANONICAL SELECTION PERSISTENCE HELPER ──
  const saveSelection = (step: string, problemId: string, currentMode: DSAMode, cid?: string) => {
    if (typeof window !== "undefined") {
      try {
        const targetCid = cid || candidateId || "guest";
        localStorage.setItem(`cognalyze_dsa_sel_${targetCid}`, JSON.stringify({
          stepId: step,
          problemId,
          mode: currentMode
        }));
        const url = new URL(window.location.href);
        url.searchParams.set("step", step);
        url.searchParams.set("stepId", step);
        url.searchParams.set("problemId", problemId);
        url.searchParams.set("mode", currentMode);
        window.history.replaceState({}, "", url.toString());
      } catch {}
    }
  };

  // ── 1. INITIALIZATION ──────────────────────────────────────────────────────
  useEffect(() => {
    const paramTrack = (searchParams.get("track") as any) || "product_mid";
    setTrackSlug(paramTrack);

    const queryMode = (searchParams.get("mode") as DSAMode) || null;
    if (queryMode && ["learn", "practice", "coach", "interview", "tracker"].includes(queryMode)) {
      setMode(queryMode);
    }

    const queryStepId = searchParams.get("step") || searchParams.get("stepId");
    if (queryStepId && DSA_ROADMAP_STEPS.some(s => s.id === queryStepId)) {
      setSelectedStepId(queryStepId);
    }

    const queryProblemId = searchParams.get("problemId") || searchParams.get("id");
    if (queryProblemId && queryProblemId !== activeProblemIdRef.current) {
      const p = getDsaSheetProblemById(queryProblemId);
      setActiveProblem(p);
      setSelectedStepId(p.step_id);
    }

    async function initUser() {
      let resolvedId = searchParams.get("candidateId");
      if (!resolvedId) {
        try {
          const sessionRes = await fetch("/api/auth/session");
          if (sessionRes.ok) {
            const data = await sessionRes.json();
            if (data.authenticated && data.user?.id) {
              resolvedId = data.user.id;
              if (resolvedId && typeof window !== "undefined") {
                localStorage.setItem("cognalyze_student_id", resolvedId);
              }
            }
          }
        } catch {}
      }
      if (!resolvedId && typeof window !== "undefined") {
        resolvedId = localStorage.getItem("cognalyze_student_id");
      }
      const finalId = resolvedId || "guest";
      setCandidateId(finalId);
      refreshCandidateData(finalId);
      const brief = generateSessionBrief(paramTrack, "dsa_coding", finalId);
      setSessionBrief(brief);

      // Merge persisted drafts from storage without clobbering active in-memory typing
      const userDrafts = loadDraftsFromStorage(finalId);
      draftsRef.current = { ...userDrafts, ...draftsRef.current };

      // Check saved selection in localStorage if query parameters weren't explicitly provided
      if (typeof window !== "undefined" && !queryStepId && !queryProblemId) {
        try {
          const saved = localStorage.getItem(`cognalyze_dsa_sel_${finalId}`);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.stepId && DSA_ROADMAP_STEPS.some(s => s.id === parsed.stepId)) {
              setSelectedStepId(parsed.stepId);
            }
            if (parsed.problemId && parsed.problemId !== activeProblemIdRef.current) {
              const p = getDsaSheetProblemById(parsed.problemId);
              setActiveProblem(p);
              setSelectedStepId(p.step_id);
            }
            if (parsed.mode && !queryMode) {
              setMode(parsed.mode);
            }
          }
        } catch {}
      }

      // Check for active ongoing interview session to resume on refresh
      try {
        const sessRes = await fetch(`/api/skills/dsa?mode=interview_session&candidateId=${finalId}`);
        const sessData = await sessRes.json();
        if (sessData.success && sessData.session) {
          const s: DsaInterviewSession = sessData.session;
          setActiveSession(s);
          if (s.status === "in_progress") {
            setInterviewStarted(true);
            setInterviewCompleted(false);
            const remainingSec = Math.max(0, Math.floor((new Date(s.expiresAt).getTime() - Date.now()) / 1000));
            setInterviewTimeLeft(remainingSec);
            const activeQ = s.questions[s.currentQuestionIndex];
            if (activeQ) {
              const qProb = getDsaSheetProblemById(activeQ.problemId);
              if (qProb.id !== activeProblemIdRef.current) {
                setActiveProblem(qProb);
              }
              if (activeQ.submittedCode) {
                handleCodeChange(activeQ.submittedCode);
              }
              if (activeQ.testResults) {
                setTestOutput(activeQ.testResults as any);
              }
              if (activeQ.followUpQuestion) {
                setInterviewerFollowUp(activeQ.followUpQuestion.question);
                setCandidateFollowUpResponse(activeQ.followUpQuestion.candidateResponse || "");
              }
            }
          } else if (s.status === "completed" && s.finalScorecard) {
            setInterviewStarted(true);
            setInterviewCompleted(true);
          }
        }
      } catch (err) {
        console.warn("Failed to check active interview session:", err);
      }
    }

    initUser();
  }, [searchParams]);

  const refreshCandidateData = (cid: string) => {
    const summary = getStudentDsaSummary(cid);
    setDsaSummary(summary);
    const focus = getStudentDsaFocus(cid);
    setCurrentFocus(focus);
    const progress = getStudentDsaProgress(cid);
    setCandidateProgressMap(progress);
  };

  // Canonical Selection Handlers
  const handleSelectStep = (stepId: string) => {
    setSelectedStepId(stepId);
    setSelectedSubtopic("all");
    const list = getAllDsaSheetProblems({ stepId, subtopic: "all" });
    setProblemsList(list);
    // If activeProblem doesn't belong to this step, switch to first problem of the step
    if (activeProblem.step_id !== stepId && list.length > 0) {
      setActiveProblem(list[0]);
      saveSelection(stepId, list[0].id, mode);
    } else {
      saveSelection(stepId, activeProblem.id, mode);
    }
  };

  const handleSelectProblem = (problemId: string) => {
    if (problemId === activeProblem.id) return;
    const prob = getDsaSheetProblemById(problemId);
    setActiveProblem(prob);
    if (prob.step_id && prob.step_id !== selectedStepId) {
      setSelectedStepId(prob.step_id);
      saveSelection(prob.step_id, prob.id, mode);
    } else {
      saveSelection(selectedStepId, prob.id, mode);
    }
  };

  const handleSwitchMode = (newMode: DSAMode) => {
    if (mode === "interview" && interviewStarted && !interviewCompleted) {
      if (!confirm("An interview is currently in progress. Switching modes will leave your session running. Continue?")) {
        return;
      }
    }
    setMode(newMode);
    setPostFeedback(null);
    setTestOutput(null);
    saveSelection(selectedStepId, activeProblem.id, newMode);
  };

  // Sync problems list when step, subtopic, or search changes
  useEffect(() => {
    let list = getAllDsaSheetProblems({
      stepId: selectedStepId,
      subtopic: selectedSubtopic,
      search: searchQuery
    });
    // Guarantee that activeProblem is in list if it belongs to selectedStepId
    if (activeProblem && activeProblem.step_id === selectedStepId && !list.some(p => p.id === activeProblem.id)) {
      list = [activeProblem, ...list];
    }
    setProblemsList(list);
  }, [selectedStepId, selectedSubtopic, searchQuery, activeProblem]);

  // Keep selectedStepId aligned with activeProblem outside interview mode
  useEffect(() => {
    if (activeProblem && activeProblem.step_id && activeProblem.step_id !== selectedStepId && mode !== "interview") {
      setSelectedStepId(activeProblem.step_id);
    }
  }, [activeProblem, mode]);

  // Initial mount: load persisted drafts from localStorage and resolve starting code
  useEffect(() => {
    const stored = loadDraftsFromStorage(candidateId);
    draftsRef.current = { ...stored, ...draftsRef.current };

    const res = resolveProblemCode({
      problem: activeProblem,
      language: selectedLanguage as SupportedLanguage,
      candidateId,
      inMemoryDrafts: draftsRef.current,
      interviewSubmittedCode: mode === "interview" && activeSession ? activeSession.questions[activeSession.currentQuestionIndex]?.submittedCode : null
    });

    setCode(res.code);
    draftsRef.current[getDraftKey(activeProblem.id, selectedLanguage)] = res.code;
    activeProblemIdRef.current = activeProblem.id;
    activeLanguageRef.current = selectedLanguage;
    isCodeInitializedRef.current = true;
  }, []);

  // Controlled transition: Sync code ONLY when activeProblem.id or selectedLanguage genuinely changes
  useEffect(() => {
    if (!isCodeInitializedRef.current) return;

    const prevProblemId = activeProblemIdRef.current;
    const prevLanguage = activeLanguageRef.current;
    const newProblemId = activeProblem.id;
    const newLanguage = selectedLanguage;

    // Strict guard: Do nothing if neither the problem ID nor the programming language changed!
    if (prevProblemId === newProblemId && prevLanguage === newLanguage) {
      return;
    }

    // 1. Preserve current editor code into outgoing draft slot
    const outgoingKey = getDraftKey(prevProblemId, prevLanguage);
    draftsRef.current[outgoingKey] = code;
    saveDraftToStorage(candidateId, prevProblemId, prevLanguage as SupportedLanguage, code);

    // 2. Resolve code for incoming problem & language
    const res = resolveProblemCode({
      problem: activeProblem,
      language: newLanguage as SupportedLanguage,
      candidateId,
      inMemoryDrafts: draftsRef.current,
      interviewSubmittedCode: mode === "interview" && activeSession ? activeSession.questions[activeSession.currentQuestionIndex]?.submittedCode : null
    });

    setCode(res.code);
    const incomingKey = getDraftKey(newProblemId, newLanguage);
    draftsRef.current[incomingKey] = res.code;

    // 3. Update tracked refs
    activeProblemIdRef.current = newProblemId;
    activeLanguageRef.current = newLanguage;

    // 4. Reset transient problem-specific diagnostics
    setTestOutput(null);
    setPostFeedback(null);
    setRevealedSolution(false);
    setInterviewerFollowUp(null);
    setCandidateFollowUpResponse("");
    setFollowUpSaved(false);
    setCheckpointSubmitted(false);
    setSelectedCheckpointOption(null);
  }, [activeProblem.id, selectedLanguage]);

  // Interview Timer Countdown
  useEffect(() => {
    let timer: any = null;
    if (mode === "interview" && interviewStarted && !interviewCompleted && interviewTimeLeft > 0) {
      timer = setInterval(() => {
        setInterviewTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            handleFinalizeInterview();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [mode, interviewStarted, interviewCompleted, interviewTimeLeft]);

  // Proctoring: Camera & Tab Visibility Change
  useEffect(() => {
    if (mode === "interview" && interviewStarted && !interviewCompleted) {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: { width: 240, height: 180 }, audio: false })
          .then(stream => {
            setCameraStream(stream);
            setProctoringActive(true);
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
            if (activeSession) {
              fetch("/api/skills/dsa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  action: "interview_telemetry",
                  sessionId: activeSession.sessionId,
                  type: "camera_status",
                  details: "Webcam stream active"
                })
              }).catch(() => {});
            }
          })
          .catch(() => {
            setProctoringActive(false);
          });
      }

      const handleVisibilityChange = () => {
        if (document.hidden) {
          setTabSwitchViolations(prev => prev + 1);
          if (activeSession) {
            fetch("/api/skills/dsa", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                action: "interview_telemetry",
                sessionId: activeSession.sessionId,
                type: "tab_switch",
                details: "Candidate navigated away from browser tab"
              })
            }).catch(() => {});
          }
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      return () => {
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        if (cameraStream) {
          cameraStream.getTracks().forEach(t => t.stop());
        }
      };
    } else {
      if (cameraStream) {
        cameraStream.getTracks().forEach(t => t.stop());
        setCameraStream(null);
      }
    }
  }, [mode, interviewStarted, interviewCompleted, activeSession]);

  // ── 2. START LOCKED MULTI-QUESTION INTERVIEW ─────────────────────────────────
  const handleStartInterviewSession = async () => {
    try {
      const res = await fetch("/api/skills/dsa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "interview_create",
          candidateId,
          stepId: selectedStepId,
          topicId: interviewTopic,
          difficulty: interviewDifficulty,
          language: selectedLanguage,
          questionCount: interviewQuestionCount,
          durationMinutes: interviewDurationMins
        })
      });
      const data = await res.json();
      if (data.success && data.session) {
        const s: DsaInterviewSession = data.session;
        setActiveSession(s);
        setInterviewStarted(true);
        setInterviewCompleted(false);
        setInterviewTimeLeft(s.durationMinutes * 60);
        setTabSwitchViolations(0);
        setTestOutput(null);
        setPostFeedback(null);
        setFollowUpSaved(false);

        const firstQ = s.questions[0];
        if (firstQ) {
          const prob = getDsaSheetProblemById(firstQ.problemId);
          setActiveProblem(prob);
          const starter = getProblemStarterCode(prob, selectedLanguage as SupportedLanguage);
          handleCodeChange(starter);
          if (firstQ.followUpQuestion) {
            setInterviewerFollowUp(firstQ.followUpQuestion.question);
          }
        }
      }
    } catch (err: any) {
      console.error("Failed to start interview session:", err);
    }
  };

  // ── 3. RUN CODE (PUBLIC TEST CASES ONLY) ───────────────────────────────────
  const handleRunCode = async () => {
    setRunningTests(true);
    try {
      const res = await fetch("/api/skills/dsa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "run",
          problemId: activeProblem.id,
          code,
          language: selectedLanguage,
          candidateId,
          trackSlug
        })
      });
      const data = await res.json();
      setTestOutput({
        passed: data.passed,
        score: data.score,
        passedCount: data.passedCount,
        totalTests: data.totalTests,
        status: data.status || (data.passed ? "passed" : "failed"),
        verdict: data.verdict || (data.passed ? "Accepted" : "Failed"),
        message: data.message || (data.passed ? "All public tests passed." : "Tests failed."),
        compilationError: data.compilationError,
        results: data.results
      });

      if (mode === "interview" && !interviewerFollowUp) {
        setInterviewerFollowUp(
          data.passed
            ? `Your solution passed visible tests. What invariant guarantees that binary search will not encounter an infinite loop on edge inputs?`
            : `Your solution failed on public test cases. How does your pointer logic guard against out-of-bounds or invalid bounds?`
        );
      }
    } catch (err: any) {
      setTestOutput({
        passed: false,
        score: 0,
        passedCount: 0,
        totalTests: activeProblem.publicTestCases.length,
        status: "infrastructure_error",
        verdict: "Infrastructure Error",
        message: "Execution or network error: " + err.message
      });
    } finally {
      setRunningTests(false);
    }
  };

  // ── 4. SUBMIT / EVALUATE CODE (PUBLIC + HIDDEN CASES) ─────────────────────
  const handleSubmitCode = async () => {
    setEvaluating(true);
    try {
      if (mode === "interview" && activeSession) {
        // Record into locked interview session
        const res = await fetch("/api/skills/dsa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "interview_submit_code",
            sessionId: activeSession.sessionId,
            questionIndex: activeSession.currentQuestionIndex,
            code,
            language: selectedLanguage
          })
        });
        const data = await res.json();
        if (data.session) {
          setActiveSession(data.session);
        }
        if (data.testResults) {
          const tr = data.testResults;
          setTestOutput({
            passed: tr.passed,
            score: tr.score,
            passedCount: tr.passedCount,
            totalTests: tr.totalTests,
            status: tr.status,
            verdict: tr.verdict,
            message: tr.compilationError ? `Compilation Error: ${tr.compilationError}` : tr.passed ? `✓ Passed all ${tr.passedCount}/${tr.totalTests} tests!` : `Evaluated: ${tr.passedCount}/${tr.totalTests} passed.`,
            compilationError: tr.compilationError,
            results: tr.results
          });
        }
      } else {
        // Standalone practice submission
        const res = await fetch("/api/skills/dsa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "submit",
            problemId: activeProblem.id,
            code,
            language: selectedLanguage,
            candidateId,
            trackSlug,
            timeSpentSeconds: 180,
            isInterview: false,
            isAssisted: coachAssistanceUsed || revealedSolution,
            assistanceTier: revealedSolution ? 5 : coachAssistanceUsed ? 3 : 1
          })
        });
        const data = await res.json();
        setTestOutput({
          passed: data.passed,
          score: data.score,
          passedCount: data.passedCount,
          totalTests: data.totalTests,
          status: data.status || (data.passed ? "passed" : "failed"),
          verdict: data.verdict || "Evaluated",
          message: data.message || "",
          compilationError: data.compilationError,
          results: data.results
        });
        setLastSubmissionVerdict(data.verdict);
        if (data.postFeedback) {
          setPostFeedback(data.postFeedback);
        }
        refreshCandidateData(candidateId);
      }
    } catch (err: any) {
      console.error("Submission error:", err);
    } finally {
      setEvaluating(false);
    }
  };

  // ── 5. RECORD TECHNICAL FOLLOW-UP RESPONSE ─────────────────────────────────
  const handleSaveFollowUpResponse = async () => {
    if (!candidateFollowUpResponse.trim() || !activeSession) return;
    try {
      const res = await fetch("/api/skills/dsa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "interview_answer_followup",
          sessionId: activeSession.sessionId,
          questionIndex: activeSession.currentQuestionIndex,
          answer: candidateFollowUpResponse
        })
      });
      const data = await res.json();
      if (data.session) {
        setActiveSession(data.session);
        setFollowUpSaved(true);
      }
    } catch (err) {
      console.error("Failed to save follow-up answer:", err);
    }
  };

  // ── 6. ADVANCE TO NEXT QUESTION IN LOCKED SESSION ──────────────────────────
  const handleNextInterviewQuestion = async () => {
    if (!activeSession) return;
    try {
      const currQ = activeSession.questions[activeSession.currentQuestionIndex];
      // Auto-evaluate current question if code was written but not yet submitted
      if (currQ && currQ.status !== "submitted" && code.trim()) {
        setEvaluating(true);
        try {
          const subRes = await fetch("/api/skills/dsa", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "interview_submit_code",
              sessionId: activeSession.sessionId,
              questionIndex: activeSession.currentQuestionIndex,
              code,
              language: selectedLanguage
            })
          });
          const subData = await subRes.json();
          if (subData.session) {
            setActiveSession(subData.session);
          }
        } catch (subErr) {
          console.warn("Auto-submit on advance failed:", subErr);
        } finally {
          setEvaluating(false);
        }
      }

      const res = await fetch("/api/skills/dsa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "interview_next",
          sessionId: activeSession.sessionId
        })
      });
      const data = await res.json();
      if (data.session) {
        setActiveSession(data.session);
        const nextQ = data.session.questions[data.session.currentQuestionIndex];
        if (nextQ) {
          const nextProb = getDsaSheetProblemById(nextQ.problemId);
          setActiveProblem(nextProb);
          const nextCode = nextQ.submittedCode || getProblemStarterCode(nextProb, selectedLanguage as SupportedLanguage);
          handleCodeChange(nextCode);
          setTestOutput(nextQ.testResults as any || null);
          setInterviewerFollowUp(nextQ.followUpQuestion?.question || null);
          setCandidateFollowUpResponse(nextQ.followUpQuestion?.candidateResponse || "");
          setFollowUpSaved(!!nextQ.followUpQuestion?.candidateResponse);
        }
      }
    } catch (err) {
      console.error("Failed to advance question:", err);
    }
  };

  // ── 7. FINALIZE INTERVIEW (ONLY AFTER ALL QUESTIONS) ──────────────────────
  const handleFinalizeInterview = async () => {
    if (!activeSession) return;
    setEvaluating(true);
    setEvaluationError(null);
    try {
      const currQ = activeSession.questions[activeSession.currentQuestionIndex];
      // Auto-evaluate current question if code was written but not yet submitted
      if (currQ && currQ.status !== "submitted" && code.trim()) {
        try {
          const subRes = await fetch("/api/skills/dsa", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "interview_submit_code",
              sessionId: activeSession.sessionId,
              questionIndex: activeSession.currentQuestionIndex,
              code,
              language: selectedLanguage
            })
          });
          const subData = await subRes.json();
          if (subData.session) {
            setActiveSession(subData.session);
          }
        } catch (subErr) {
          console.warn("Auto-submit on finalize failed:", subErr);
        }
      }

      const res = await fetch("/api/skills/dsa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "interview_finalize",
          sessionId: activeSession.sessionId
        })
      });
      const data = await res.json();
      if (data.success && data.session && data.session.finalScorecard) {
        setActiveSession(data.session);
        setInterviewCompleted(true);
        if (cameraStream) {
          cameraStream.getTracks().forEach(t => t.stop());
          setCameraStream(null);
        }
      } else {
        setEvaluationError(data.error || "Evaluation failed to generate scorecard. Please click Retry Final Evaluation.");
      }
    } catch (err: any) {
      console.error("Failed to finalize interview:", err);
      setEvaluationError(err.message || "Network error while completing evaluation.");
    } finally {
      setEvaluating(false);
    }
  };

  const handleStartReTest = (topicId: string, currentProbId: string) => {
    const reTestProb = getTargetedReTestProblem(candidateId, topicId, currentProbId);
    setActiveProblem(reTestProb);
    setSelectedStepId(reTestProb.step_id);
    setMode("practice");
    setPostFeedback(null);
    setTestOutput(null);
  };

  const handleMarkAsLearned = () => {
    updateStudentDsaStatus(candidateId, activeProblem.id, "learned");
    refreshCandidateData(candidateId);
  };

  const handleAskCoach = async (overridePrompt?: string) => {
    const promptToSend = (overridePrompt || coachInput).trim();
    if (!promptToSend || coachThinking) return;
    setCoachLog(prev => [...prev, { sender: "candidate", text: promptToSend }]);
    setCoachInput("");
    setCoachThinking(true);

    try {
      const res = await fetch("/api/skills/dsa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "coach_turn",
          candidateId,
          problemId: activeProblem.id,
          code,
          language: selectedLanguage,
          query: promptToSend,
          history: coachLog.slice(-6),
          testOutput
        })
      });
      const data = await res.json();
      if (data.reply) {
        setCoachLog(prev => [...prev, { sender: "coach", text: data.reply }]);
        if (data.assistanceUsed) setCoachAssistanceUsed(true);
        if (data.suggestedPromptChips && Array.isArray(data.suggestedPromptChips)) {
          setSuggestedChips(data.suggestedPromptChips);
        }
      } else {
        setCoachLog(prev => [...prev, { sender: "coach", text: `In ${activeProblem.title}, consider what invariant must hold true at every element. How are your boundary conditions guarding against edge inputs?` }]);
      }
    } catch (err) {
      setCoachLog(prev => [...prev, { sender: "coach", text: "Network hiccup connecting to Socratic coach. In the meantime, verify your termination condition and boundary checks!" }]);
    } finally {
      setCoachThinking(false);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const currentStep = DSA_ROADMAP_STEPS.find(s => s.id === selectedStepId) || DSA_ROADMAP_STEPS[3];
  const canonicalActive = getCanonicalProblem(activeProblem.id);

  // Interview Question Progress Tracking
  const activeQuestionIndex = activeSession?.currentQuestionIndex ?? 0;
  const isLastInterviewQuestion = activeSession ? activeQuestionIndex === activeSession.questions.length - 1 : false;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1", color: "#17191C", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      <style>{`
        @media (max-width: 860px) {
          .dsa-arena-split-layout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
      
      {/* ── HEADER ── */}
      <header style={{ borderBottom: "1px solid #E4E1DA", backgroundColor: "#FFFFFF", padding: "12px 24px", position: "sticky", top: 0, zIndex: 40, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <Link href="/skill-practice" style={{ color: "#667085", textDecoration: "none", fontSize: 12, fontWeight: 600 }}>
                  ← Skill Practice Hub
                </Link>
                <span style={{ color: "#98A2B3" }}>/</span>
                <span style={{ color: "#356AE6", fontSize: 12, fontWeight: 700 }}>DSA Arena (A2Z Roadmap)</span>
              </div>
              <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#162A43", display: "flex", alignItems: "center", gap: 8, letterSpacing: "-0.02em" }}>
                <span>⚡</span>
                <span>DSA Algorithmic Problem Solving &amp; DSA Curriculum Arena</span>
              </h1>
            </div>

            {/* Mode Selector Tabs (Disabled during active interview to prevent desync) */}
            <div style={{ display: "flex", background: "#F6F5F1", padding: 3, borderRadius: 8, border: "1px solid #E4E1DA", gap: 2 }}>
              {[
                { id: "learn", label: "💡 Learn" },
                { id: "practice", label: "🛠️ Practice" },
                { id: "coach", label: "🎓 Coach" },
                { id: "interview", label: "🎯 Interview" },
                { id: "tracker", label: "📊 Mastery Tracker" }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => handleSwitchMode(m.id as DSAMode)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "none",
                    background: mode === m.id ? "#162A43" : "transparent",
                    color: mode === m.id ? "#FFFFFF" : "#667085",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s ease"
                  }}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Language Selector */}
            <select
              value={selectedLanguage}
              onChange={e => setSelectedLanguage(e.target.value as any)}
              disabled={mode === "interview" && interviewStarted}
              style={{
                background: "#FFFFFF",
                border: "1px solid #E4E1DA",
                color: "#17191C",
                padding: "6px 10px",
                borderRadius: 7,
                fontSize: 12,
                fontWeight: 600,
                outline: "none"
              }}
            >
              <option value="cpp">C++ 20 (Clang++/G++)</option>
              <option value="python">Python 3 (Process)</option>
              <option value="javascript">JavaScript (Node VM)</option>
            </select>

            {/* Dedicated Contextual DSA Mentor Button */}
            <button
              onClick={() => setIsMentorOpen(!isMentorOpen)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "6px 12px",
                borderRadius: 7,
                border: "1px solid #D2E0FB",
                background: isMentorOpen ? "#EFF4FE" : "#FFFFFF",
                color: "#356AE6",
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(16,24,40,0.05)"
              }}
            >
              <span>🤖</span>
              <span>DSA Mentor</span>
            </button>

            {/* Target Placement Bar Selector */}
            <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
              <select
                value={trackSlug}
                onChange={(e) => setTrackSlug(e.target.value as any)}
                aria-label="Target Placement Bar"
                style={{
                  appearance: "none",
                  WebkitAppearance: "none",
                  background: "#EFF4FE",
                  border: "1px solid #D2E0FB",
                  color: "#356AE6",
                  padding: "6px 26px 6px 10px",
                  borderRadius: 7,
                  fontSize: 11,
                  fontWeight: 800,
                  cursor: "pointer",
                  outline: "none",
                  boxShadow: "0 1px 2px rgba(16,24,40,0.03)"
                }}
              >
                <option value="service_mass">🎯 Mass Recruiters (TCS / Infy / Wipro)</option>
                <option value="service_elite">🚀 Service Elite (TCS Digital / GenC)</option>
                <option value="product_mid">⭐ Product Mid-Tier (Swiggy / Zomato)</option>
                <option value="product_faang">🦄 Tier-1 Product / FAANG (Google / MSFT)</option>
              </select>
              <span style={{ position: "absolute", right: 8, pointerEvents: "none", fontSize: 9, color: "#356AE6", fontWeight: 900 }}>
                ▼
              </span>
            </div>
          </div>

        </div>
      </header>

      {/* Dynamic Focus Strip */}
      <div style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #E4E1DA", padding: "8px 24px" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ color: "#667085", fontWeight: 600 }}>Current Focus:</span>
            <span style={{ color: "#162A43", fontWeight: 800, background: "#F6F5F1", padding: "2px 8px", borderRadius: 5, border: "1px solid #E4E1DA" }}>
              {currentFocus.topic}
            </span>
            <span style={{ color: "#D1CDC4" }}>•</span>
            <span style={{ color: "#475467" }}>{currentFocus.reason}</span>
            <span style={{ color: "#D1CDC4" }}>•</span>
            <span style={{ color: "#2E7D5B", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 4 }}>
              <span>📊</span>
              <span>SDE 455 Sheet: {dsaSummary.totalSolved} / {dsaSummary.totalAvailable} Solved</span>
            </span>
            <button
              onClick={() => handleSwitchMode("tracker")}
              style={{
                padding: "3px 10px",
                borderRadius: 5,
                background: mode === "tracker" ? "#162A43" : "#EFF4FE",
                color: mode === "tracker" ? "#FFFFFF" : "#356AE6",
                border: "1px solid #D2E0FB",
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer"
              }}
            >
              {mode === "tracker" ? "Active Tracker View ✓" : "Open Mastery Tracker ➔"}
            </button>
          </div>

          {mode === "interview" && interviewStarted && !interviewCompleted && (
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: "#EFF4FE", color: "#356AE6", border: "1px solid #D2E0FB", fontWeight: 800 }}>
                🔒 LOCKED SESSION ({activeSession?.sessionId.slice(-6)})
              </span>
              {proctoringActive && (
                <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: "#EAF4EE", color: "#2E7D5B", border: "1px solid #C8E4D3", fontWeight: 700 }}>
                  ● WEBCAM ACTIVE
                </span>
              )}
              {tabSwitchViolations > 0 && (
                <span style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: "#FDF2F2", color: "#C24141", border: "1px solid #F8C8C8", fontWeight: 700 }}>
                  ⚠️ {tabSwitchViolations} Tab Switch
                </span>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: interviewTimeLeft < 300 ? "#C24141" : "#B7791F", fontWeight: 700 }}>
                <span>⏱️ {formatTimer(interviewTimeLeft)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <main style={{ maxWidth: 1440, margin: "0 auto", padding: "18px 24px" }}>

        {/* ══════════════════════════════════════════════════════════════
            MODE 1: LEARN MODE
            ══════════════════════════════════════════════════════════════ */}
        {mode === "learn" && (
          <div style={{ marginBottom: 24 }}>
            {/* Learn Sub-View Switcher */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16, background: "#FFFFFF", padding: 5, borderRadius: 10, border: "1px solid #E4E1DA", boxShadow: "0 1px 3px rgba(16,24,40,0.03)" }}>
              <button
                type="button"
                onClick={() => setLearnSubView("concept_mastery")}
                style={{
                  flex: 1,
                  padding: "8px 14px",
                  borderRadius: 7,
                  border: "none",
                  background: learnSubView === "concept_mastery" ? "#162A43" : "transparent",
                  color: learnSubView === "concept_mastery" ? "#FFFFFF" : "#667085",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "all 0.15s ease"
                }}
              >
                <span>🌟 Concept Mastery Platform (17 Steps)</span>
              </button>
              <button
                type="button"
                onClick={() => setLearnSubView("problem_labs")}
                style={{
                  flex: 1,
                  padding: "8px 14px",
                  borderRadius: 7,
                  border: "none",
                  background: learnSubView === "problem_labs" ? "#162A43" : "transparent",
                  color: learnSubView === "problem_labs" ? "#FFFFFF" : "#667085",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  transition: "all 0.15s ease"
                }}
              >
                <span>📖 Problem Deep Dive &amp; Labs</span>
              </button>
            </div>

            {learnSubView === "concept_mastery" ? (
              <ConceptMasteryHub
                onNavigateToPractice={(probId) => {
                  handleSelectProblem(probId);
                  setMode("practice");
                }}
              />
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 18 }}>
            
            {/* Left: A2Z DSA Roadmap Steps & Company Tracks Browser */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 16, height: "calc(100vh - 180px)", overflowY: "auto", position: "sticky", top: 80, boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
              {/* Navigation Mode: A2Z DSA vs Company Tracks */}
              <div style={{ display: "flex", background: "#F6F5F1", padding: 2, borderRadius: 6, border: "1px solid #E4E1DA", marginBottom: 12 }}>
                <button
                  onClick={() => setRoadmapMode("a2z")}
                  style={{
                    flex: 1,
                    padding: "5px 6px",
                    borderRadius: 4,
                    border: "none",
                    background: roadmapMode === "a2z" ? "#162A43" : "transparent",
                    color: roadmapMode === "a2z" ? "#FFFFFF" : "#667085",
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  📜 A2Z DSA
                </button>
                <button
                  onClick={() => setRoadmapMode("company")}
                  style={{
                    flex: 1,
                    padding: "5px 6px",
                    borderRadius: 4,
                    border: "none",
                    background: roadmapMode === "company" ? "#162A43" : "transparent",
                    color: roadmapMode === "company" ? "#FFFFFF" : "#667085",
                    fontSize: 10,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  🏢 Company Prep
                </button>
              </div>

              {roadmapMode === "company" ? (
                <div>
                  <label style={{ fontSize: 10, fontWeight: 800, color: "#667085", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                    Target Company Track
                  </label>
                  <select
                    value={selectedCompanySlug}
                    onChange={e => setSelectedCompanySlug(e.target.value)}
                    style={{
                      width: "100%",
                      background: "#F6F5F1",
                      border: "1px solid #E4E1DA",
                      color: "#17191C",
                      padding: "7px 10px",
                      borderRadius: 7,
                      fontSize: 12,
                      fontWeight: 700,
                      outline: "none",
                      marginBottom: 10,
                      cursor: "pointer"
                    }}
                  >
                    {COMPANY_TRACKS.map(c => (
                      <option key={c.slug} value={c.slug}>
                        {c.name} ({c.category.replace(/_/g, " ").toUpperCase()})
                      </option>
                    ))}
                  </select>

                  {/* Company Profile Brief */}
                  {(() => {
                    const currentCompany = getCompanyTrackBySlug(selectedCompanySlug) || COMPANY_TRACKS[0];
                    return (
                      <div>
                        <div style={{ background: "#EFF4FE", borderRadius: 6, border: "1px solid #D2E0FB", padding: 8, marginBottom: 8 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ fontSize: 11, fontWeight: 800, color: "#356AE6" }}>
                              {currentCompany.name} • {currentCompany.roles[0]}
                            </div>
                            <span style={{ fontSize: 9, background: "#ECFDF5", color: "#027A48", fontWeight: 700, padding: "1px 5px", borderRadius: 4 }}>
                              100% Coverage Verified
                            </span>
                          </div>
                          <div style={{ fontSize: 10, color: "#475467", marginTop: 2 }}>
                            {currentCompany.assessmentFormat.interviewRounds} Rounds • {currentCompany.assessmentFormat.oaDurationMinutes}m OA • {currentCompany.problems.length} Curated Questions
                          </div>
                        </div>

                        {/* Provenance Filter Pills */}
                        <div style={{ display: "flex", gap: 4, marginBottom: 8, overflowX: "auto" }}>
                          {[
                            { id: "all", label: `All (${currentCompany.problems.length})` },
                            { id: "historical_verified", label: "Verified" },
                            { id: "historical_reported", label: "Reported" },
                            { id: "curated_practice", label: "Curated" },
                            { id: "ai_generated_fallback", label: "Adaptive" }
                          ].map(f => {
                            const isAct = companyProvenanceFilter === f.id;
                            return (
                              <button
                                key={f.id}
                                onClick={() => setCompanyProvenanceFilter(f.id)}
                                type="button"
                                style={{
                                  padding: "3px 7px",
                                  borderRadius: 4,
                                  border: `1px solid ${isAct ? "#356AE6" : "#E4E1DA"}`,
                                  background: isAct ? "#EFF4FE" : "#FFFFFF",
                                  color: isAct ? "#356AE6" : "#667085",
                                  fontSize: 9,
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  whiteSpace: "nowrap"
                                }}
                              >
                                {f.label}
                              </button>
                            );
                          })}
                        </div>

                        {/* Company Problems List */}
                        {(() => {
                          const filteredList = currentCompany.problems.filter(p => {
                            if (companyProvenanceFilter === "all") return true;
                            if (companyProvenanceFilter === "historical_verified") {
                              return p.provenance === "historical_verified" || p.provenance === "verified_historical";
                            }
                            if (companyProvenanceFilter === "historical_reported") {
                              return p.provenance === "historical_reported" || p.provenance === "community_reported";
                            }
                            if (companyProvenanceFilter === "curated_practice") {
                              return p.provenance === "curated_practice" || p.provenance === "role_pattern";
                            }
                            if (companyProvenanceFilter === "ai_generated_fallback") {
                              return p.provenance === "ai_generated_fallback" || p.provenance === "cognalyze_simulation";
                            }
                            return true;
                          });

                          const getProvenanceBadge = (prov: string) => {
                            switch (prov) {
                              case "historical_verified":
                              case "verified_historical":
                                return { bg: "#ECFDF5", color: "#027A48", border: "#A6F4C5", label: "Verified" };
                              case "historical_reported":
                              case "community_reported":
                                return { bg: "#EFF4FE", color: "#356AE6", border: "#D2E0FB", label: "Reported" };
                              case "ai_generated_fallback":
                              case "cognalyze_simulation":
                                return { bg: "#FFFBEB", color: "#B45309", border: "#FDE68A", label: "Adaptive" };
                              default:
                                return { bg: "#F5F3FF", color: "#7C3AED", border: "#DDD6FE", label: "Curated" };
                            }
                          };

                          if (filteredList.length === 0) {
                            return (
                              <div style={{ padding: 14, background: "#F9FAFB", borderRadius: 8, border: "1px dashed #D1D5DB", textAlign: "center" }}>
                                <div style={{ fontSize: 11, fontWeight: 700, color: "#4B5563" }}>
                                  No questions under '{companyProvenanceFilter}' filter
                                </div>
                                <button
                                  onClick={() => setCompanyProvenanceFilter("all")}
                                  type="button"
                                  style={{
                                    marginTop: 6,
                                    fontSize: 10,
                                    padding: "3px 8px",
                                    borderRadius: 4,
                                    border: "1px solid #356AE6",
                                    background: "#EFF4FE",
                                    color: "#356AE6",
                                    fontWeight: 700,
                                    cursor: "pointer"
                                  }}
                                >
                                  Reset to All ({currentCompany.problems.length})
                                </button>
                              </div>
                            );
                          }

                          return (
                            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: "calc(100vh - 390px)", overflowY: "auto" }}>
                              {filteredList.map(cp => {
                                const isSelected = activeProblem.id === cp.problemId;
                                const badge = getProvenanceBadge(cp.provenance);
                                return (
                                  <div
                                    key={cp.problemId}
                                    onClick={() => handleSelectProblem(cp.problemId)}
                                    style={{
                                      padding: "8px 10px",
                                      borderRadius: 7,
                                      background: isSelected ? "#EFF4FE" : "#FFFFFF",
                                      border: isSelected ? "1px solid #356AE6" : "1px solid #E4E1DA",
                                      cursor: "pointer",
                                      display: "flex",
                                      justifyContent: "space-between",
                                      alignItems: "center"
                                    }}
                                  >
                                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: 6 }}>
                                      <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? "#162A43" : "#17191C" }}>
                                        {cp.title}
                                      </div>
                                      <div style={{ fontSize: 10, color: "#667085" }}>
                                        Freq: {cp.frequencyScore}/100 • {cp.assessmentStage.replace(/_/g, " ")}
                                      </div>
                                    </div>
                                    <span
                                      style={{
                                        fontSize: 9,
                                        padding: "2px 5px",
                                        borderRadius: 4,
                                        background: badge.bg,
                                        color: badge.color,
                                        border: `1px solid ${badge.border}`,
                                        fontWeight: 700,
                                        whiteSpace: "nowrap"
                                      }}
                                    >
                                      {badge.label}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div>
                  {/* SDE 455 Sheet Master Questions & Tracker Switcher */}
                  <div style={{ marginBottom: 12, padding: "9px 12px", background: "#EFF4FE", border: "1px solid #D2E0FB", borderRadius: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#162A43" }}>SDE 455 Master Qs</div>
                      <div style={{ fontSize: 10, color: "#667085" }}>{dsaSummary.totalSolved} / {dsaSummary.totalAvailable} Solved</div>
                    </div>
                    <button
                      onClick={() => handleSwitchMode("tracker")}
                      style={{
                        padding: "4px 8px",
                        borderRadius: 5,
                        background: "#356AE6",
                        color: "#FFFFFF",
                        border: "none",
                        fontSize: 10,
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      Mastery Tracker 📊
                    </button>
                  </div>

                  <div style={{ fontSize: 12, fontWeight: 800, color: "#162A43", textTransform: "uppercase", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>A2Z DSA Roadmap</span>
                    <span style={{ fontSize: 11, color: "#667085" }}>17 Steps</span>
                  </div>

                  {/* Step Selector Dropdown */}
                  <select
                    value={selectedStepId}
                    onChange={e => handleSelectStep(e.target.value)}
                    style={{
                      width: "100%",
                      background: "#F6F5F1",
                      border: "1px solid #E4E1DA",
                      color: "#17191C",
                      padding: "7px 10px",
                      borderRadius: 7,
                      fontSize: 12,
                      fontWeight: 600,
                      outline: "none",
                      marginBottom: 10,
                      cursor: "pointer"
                    }}
                  >
                    {DSA_ROADMAP_STEPS.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.icon} {s.title} ({s.problemCount} Qs)
                      </option>
                    ))}
                  </select>

                  {/* Subtopic Filters */}
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 12 }}>
                    <button
                      onClick={() => setSelectedSubtopic("all")}
                      style={{
                        padding: "4px 8px",
                        borderRadius: 5,
                        border: selectedSubtopic === "all" ? "1px solid #162A43" : "1px solid #E4E1DA",
                        background: selectedSubtopic === "all" ? "#162A43" : "#FFFFFF",
                        color: selectedSubtopic === "all" ? "#FFFFFF" : "#667085",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      All
                    </button>
                    {currentStep.subtopics.map(sub => (
                      <button
                        key={sub}
                        onClick={() => setSelectedSubtopic(sub)}
                        style={{
                          padding: "4px 8px",
                          borderRadius: 5,
                          border: selectedSubtopic === sub ? "1px solid #162A43" : "1px solid #E4E1DA",
                          background: selectedSubtopic === sub ? "#162A43" : "#FFFFFF",
                          color: selectedSubtopic === sub ? "#FFFFFF" : "#667085",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer"
                        }}
                      >
                        {sub}
                      </button>
                    ))}
                  </div>

                  {/* Search Filter */}
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search problem title..."
                    style={{
                      width: "100%",
                      background: "#FFFFFF",
                      border: "1px solid #E4E1DA",
                      borderRadius: 6,
                      padding: "6px 8px",
                      color: "#17191C",
                      fontSize: 12,
                      outline: "none",
                      marginBottom: 10,
                      boxSizing: "border-box"
                    }}
                  />

                  {/* Problems List in Selected Step */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: "calc(100vh - 360px)", overflowY: "auto" }}>
                    {problemsList.map(p => {
                      const prog = candidateProgressMap[p.id];
                      const isSolved = prog?.status === "solved";
                      const isLearned = prog?.status === "learned";
                      const isRevision = prog?.status === "needs_revision";
                      const isSelected = activeProblem.id === p.id;

                      return (
                        <div
                          key={p.id}
                          onClick={() => handleSelectProblem(p.id)}
                          style={{
                            padding: "8px 10px",
                            borderRadius: 7,
                            background: isSelected ? "#EFF4FE" : "#FFFFFF",
                            border: isSelected ? "1px solid #356AE6" : "1px solid #E4E1DA",
                            cursor: "pointer",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                          }}
                        >
                          <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginRight: 6 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? "#162A43" : "#17191C" }}>{p.title}</div>
                            <div style={{ fontSize: 10, color: "#667085" }}>{p.subtopic_title}</div>
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                            {isSolved ? (
                              <span style={{ fontSize: 10, color: "#2E7D5B", fontWeight: 800 }}>✓</span>
                            ) : isLearned ? (
                              <span style={{ fontSize: 10, color: "#356AE6", fontWeight: 800 }}>💡</span>
                            ) : isRevision ? (
                              <span style={{ fontSize: 10, color: "#C24141", fontWeight: 800 }}>⚠️</span>
                            ) : null}
                            <span style={{
                              fontSize: 10,
                              padding: "1px 6px",
                              borderRadius: 4,
                              background: p.difficulty === "easy" ? "#EAF4EE" : p.difficulty === "medium" ? "#FEF7ED" : "#FDF2F2",
                              color: p.difficulty === "easy" ? "#2E7D5B" : p.difficulty === "medium" ? "#B7791F" : "#C24141",
                              border: `1px solid ${p.difficulty === "easy" ? "#C8E4D3" : p.difficulty === "medium" ? "#F8D8A7" : "#F8C8C8"}`,
                              fontWeight: 700
                            }}>
                              {p.difficulty[0].toUpperCase()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Full Problem Details, Learning Tutorial, and Advanced Labs */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 24, boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
              {/* Lab Navigation Sub-Tabs */}
              <div style={{ display: "flex", gap: 6, marginBottom: 18, borderBottom: "1px solid #E4E1DA", paddingBottom: 10, flexWrap: "wrap" }}>
                {[
                  { id: "tutorial", label: "📖 Concept & Invariants" },
                  { id: "dryrun", label: "🎬 Visual Dry-Run Studio" },
                  { id: "approaches", label: "⚖️ Approach Comparison (Brute vs Optimal)" },
                  { id: "debug", label: "🐛 \"Debug This\" Lab" }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveLabTab(tab.id as any)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 6,
                      border: activeLabTab === tab.id ? "1px solid #356AE6" : "1px solid #E4E1DA",
                      background: activeLabTab === tab.id ? "#EFF4FE" : "#FFFFFF",
                      color: activeLabTab === tab.id ? "#356AE6" : "#667085",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeLabTab === "tutorial" && (
                canonicalActive ? (
                  <CanonicalProblemView problem={canonicalActive} selectedLanguage={selectedLanguage} />
                ) : (
                  <div style={{ fontSize: 14, color: "#162A43", lineHeight: 1.6 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>{activeProblem.title}</h2>
                    <p>{activeProblem.description}</p>
                  </div>
                )
              )}

              {activeLabTab === "dryrun" && (
                <DsaVisualizer problemId={activeProblem.id} problemTitle={activeProblem.title} />
              )}

              {activeLabTab === "approaches" && (
                <DsaApproachComparator
                  problemId={activeProblem.id}
                  problemTitle={activeProblem.title}
                  selectedLanguage={selectedLanguage}
                  onApplyCode={(c) => {
                    handleCodeChange(c);
                    setMode("practice");
                  }}
                />
              )}

              {activeLabTab === "debug" && (
                <DsaDebugLab
                  problemId={activeProblem.id}
                  problemTitle={activeProblem.title}
                  onApplyFixToMainEditor={(c) => {
                    handleCodeChange(c);
                    setMode("practice");
                  }}
                />
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 24, paddingTop: 16, borderTop: "1px solid #E4E1DA" }}>
                <button
                  onClick={handleMarkAsLearned}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 7,
                    border: "1px solid #D2E0FB",
                    background: "#EFF4FE",
                    color: "#356AE6",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  ✓ Mark as Learned
                </button>
                <button
                  onClick={() => setMode("practice")}
                  style={{
                    padding: "8px 18px",
                    borderRadius: 7,
                    border: "none",
                    background: "#356AE6",
                    color: "#FFFFFF",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Solve in Practice ➔
                </button>
              </div>
            </div>

              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            MODE 2 & 3: PRACTICE & COACH MODE
            ══════════════════════════════════════════════════════════════ */}
        {(mode === "practice" || mode === "coach") && (
          <div
            className="dsa-arena-split-layout"
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(340px, 1fr) minmax(380px, 1.15fr)",
              gap: 18,
              marginBottom: 24,
              alignItems: "start"
            }}
          >
            
            {/* Left Column: Problem Details & Scaffolding (Scrollable & Sticky) */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              maxHeight: "calc(100vh - 140px)",
              overflowY: "auto",
              position: "sticky",
              top: 76,
              paddingRight: 6
            }}>
              
              {/* Problem Statement Card */}
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 20, boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, flexWrap: "wrap", gap: 10, paddingBottom: 12, borderBottom: "1px solid #E4E1DA" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 800, color: "#667085", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                        Roadmap Step
                      </span>
                      <select
                        value={selectedStepId}
                        onChange={e => handleSelectStep(e.target.value)}
                        style={{
                          background: "#F6F5F1",
                          color: "#162A43",
                          border: "1px solid #E4E1DA",
                          borderRadius: 6,
                          padding: "6px 10px",
                          fontSize: 12,
                          fontWeight: 700,
                          outline: "none",
                          cursor: "pointer",
                          maxWidth: 240
                        }}
                      >
                        {DSA_ROADMAP_STEPS.map(s => (
                          <option key={s.id} value={s.id}>
                            {s.icon} {s.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <span style={{ fontSize: 10, fontWeight: 800, color: "#667085", textTransform: "uppercase", display: "block", marginBottom: 4 }}>
                        Problem Selector
                      </span>
                      <select
                        value={activeProblem.id}
                        onChange={e => handleSelectProblem(e.target.value)}
                        style={{
                          background: "#F6F5F1",
                          color: "#162A43",
                          border: "1px solid #E4E1DA",
                          borderRadius: 6,
                          padding: "6px 10px",
                          fontSize: 12,
                          fontWeight: 700,
                          outline: "none",
                          cursor: "pointer",
                          maxWidth: 340
                        }}
                      >
                        {problemsList.map(p => (
                          <option key={p.id} value={p.id}>{p.title} ({p.difficulty})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, padding: "3px 8px", borderRadius: 4, background: "#EFF4FE", color: "#356AE6", fontWeight: 700, border: "1px solid #D2E0FB" }}>
                      {currentStep.title}
                    </span>
                    <span style={{
                      fontSize: 11,
                      padding: "3px 8px",
                      borderRadius: 4,
                      background: activeProblem.difficulty === "easy" ? "#EAF4EE" : activeProblem.difficulty === "medium" ? "#FEF7ED" : "#FDF2F2",
                      color: activeProblem.difficulty === "easy" ? "#2E7D5B" : activeProblem.difficulty === "medium" ? "#B7791F" : "#C24141",
                      border: `1px solid ${activeProblem.difficulty === "easy" ? "#C8E4D3" : activeProblem.difficulty === "medium" ? "#F8D8A7" : "#F8C8C8"}`,
                      fontWeight: 700
                    }}>
                      {activeProblem.difficulty.toUpperCase()}
                    </span>
                  </div>
                </div>

                {canonicalActive ? (
                  <CanonicalProblemView problem={canonicalActive} selectedLanguage={selectedLanguage} />
                ) : (
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 6px", color: "#162A43" }}>{activeProblem.title}</h2>
                    <p style={{ margin: "0 0 10px", fontSize: 13, color: "#475467" }}>{activeProblem.description}</p>
                  </div>
                )}
              </div>

              {/* Scaffolding, Hints & Progression */}
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 16, boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
                <h3 style={{ fontSize: 12, fontWeight: 800, color: "#162A43", textTransform: "uppercase", marginBottom: 10 }}>
                  Practice Scaffolding &amp; Hints
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {activeProblem.hints.map((hint, idx) => (
                    <div key={idx} style={{ padding: "8px 10px", borderRadius: 6, background: "#F6F5F1", border: "1px solid #E4E1DA", fontSize: 12, color: "#475467", lineHeight: 1.4 }}>
                      {hint}
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handleStartReTest(activeProblem.topic_id, activeProblem.id)}
                  style={{
                    width: "100%",
                    marginTop: 14,
                    padding: "9px",
                    borderRadius: 7,
                    border: "1px solid #D2E0FB",
                    background: "#EFF4FE",
                    color: "#356AE6",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  🔄 Try Another in {activeProblem.subtopic_title}
                </button>

                <button
                  onClick={() => setMode("interview")}
                  style={{
                    width: "100%",
                    marginTop: 8,
                    padding: "9px",
                    borderRadius: 7,
                    border: "none",
                    background: "#162A43",
                    color: "#FFFFFF",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  Ready: Multi-Question Interview ➔
                </button>
              </div>

            </div>

            {/* Right Column: Code Editor & Execution Diagnostics & Coach */}
            <div style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              maxHeight: "calc(100vh - 140px)",
              overflowY: "auto",
              position: "sticky",
              top: 76,
              paddingRight: 6
            }}>

              {/* Mode Coach View Switcher if in Coach Mode */}
              {mode === "coach" && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FFFFFF", border: "1px solid #E4E1DA", padding: "6px 12px", borderRadius: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#162A43", display: "flex", alignItems: "center", gap: 6 }}>
                    <span>🎓</span> Coach Mode Active
                  </span>
                  <div style={{ display: "flex", gap: 4 }}>
                    {[
                      { id: "both", label: "Split (Both)" },
                      { id: "editor", label: "Editor Only" },
                      { id: "coach", label: `Coach (${coachLog.length})` }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setCoachViewMode(tab.id as any)}
                        style={{
                          padding: "3px 8px",
                          borderRadius: 4,
                          border: coachViewMode === tab.id ? "1px solid #356AE6" : "1px solid #E4E1DA",
                          background: coachViewMode === tab.id ? "#EFF4FE" : "#F6F5F1",
                          color: coachViewMode === tab.id ? "#356AE6" : "#667085",
                          fontSize: 10,
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Code Editor */}
              {(mode !== "coach" || coachViewMode !== "coach") && (
                <div style={{ background: "#162A43", border: "1px solid #233752", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 3px rgba(16,24,40,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#111C2E", padding: "8px 16px", borderBottom: "1px solid #233752" }}>
                    <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, fontFamily: "monospace" }}>
                      solution.{selectedLanguage === "cpp" ? "cpp" : selectedLanguage === "python" ? "py" : selectedLanguage === "javascript" ? "js" : "java"}
                    </span>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={handleResetStarter}
                        style={{ padding: "4px 8px", borderRadius: 5, border: "1px solid #233752", background: "transparent", color: "#94A3B8", fontSize: 10, cursor: "pointer" }}
                      >
                        Reset Starter
                      </button>
                      <button
                        onClick={handleRunCode}
                        disabled={runningTests}
                        style={{
                          padding: "5px 14px",
                          borderRadius: 6,
                          border: "none",
                          background: "#2E7D5B",
                          color: "#FFFFFF",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: runningTests ? "not-allowed" : "pointer"
                        }}
                      >
                        {runningTests ? "Compiling & Running..." : "▶ Run Visible Tests"}
                      </button>
                      <button
                        onClick={handleSubmitCode}
                        disabled={evaluating}
                        style={{
                          padding: "5px 16px",
                          borderRadius: 6,
                          border: "none",
                          background: "#356AE6",
                          color: "#FFFFFF",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: evaluating ? "not-allowed" : "pointer"
                        }}
                      >
                        {evaluating ? "Evaluating..." : "Submit Solution ➔"}
                      </button>
                    </div>
                  </div>

                  <textarea
                    value={code}
                    onChange={e => handleCodeChange(e.target.value)}
                    rows={mode === "coach" && coachViewMode === "both" ? 14 : 22}
                    style={{
                      width: "100%",
                      minHeight: mode === "coach" && coachViewMode === "both" ? 260 : 420,
                      background: "transparent",
                      color: "#FFFFFF",
                      fontFamily: "'Fira Code', 'JetBrains Mono', Menlo, Monaco, Consolas, monospace",
                      fontSize: 12.5,
                      lineHeight: 1.5,
                      padding: 14,
                      border: "none",
                      outline: "none",
                      boxSizing: "border-box",
                      resize: "vertical",
                      tabSize: 4
                    }}
                  />
                </div>
              )}

              {/* Execution & Test Case Diagnostics */}
              {testOutput && (mode !== "coach" || coachViewMode !== "coach") && (
                <div style={{
                  background: "#FFFFFF",
                  border: testOutput.compilationError ? "1px solid #F8C8C8" : testOutput.passed ? "1px solid #C8E4D3" : "1px solid #F8C8C8",
                  borderRadius: 10,
                  padding: 16,
                  boxShadow: "0 1px 3px rgba(16,24,40,0.04)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: 4,
                        fontWeight: 800,
                        textTransform: "uppercase",
                        background: testOutput.passed ? "#EAF4EE" : "#FDF2F2",
                        color: testOutput.passed ? "#2E7D5B" : "#C24141",
                        border: `1px solid ${testOutput.passed ? "#C8E4D3" : "#F8C8C8"}`
                      }}>
                        {testOutput.verdict}
                      </span>
                      <strong style={{ fontSize: 13, color: "#162A43" }}>
                        Score: {testOutput.score}% ({testOutput.passedCount}/{testOutput.totalTests} tests passed)
                      </strong>
                    </div>
                    <span style={{ fontSize: 11, color: "#667085" }}>
                      Engine: {selectedLanguage.toUpperCase()} Execution Sandbox
                    </span>
                  </div>

                  {testOutput.compilationError && (
                    <div style={{ background: "#FEF2F2", border: "1px solid #F87171", borderRadius: 6, padding: "10px 12px", marginBottom: 12, fontSize: 12, color: "#991B1B", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
                      <strong>Compilation / Contract Error:</strong>
                      {"\n"}{testOutput.compilationError}
                    </div>
                  )}

                  {testOutput.results && testOutput.results.length > 0 && (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {testOutput.results.map((r, i) => (
                        <div key={i} style={{
                          padding: "8px 12px",
                          borderRadius: 6,
                          background: r.passed ? "#F0FDF4" : "#FEF2F2",
                          border: `1px solid ${r.passed ? "#DCFCE7" : "#FEE2E2"}`,
                          fontSize: 12
                        }}>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 2 }}>
                            <strong style={{ color: r.passed ? "#166534" : "#991B1B" }}>
                              Test {i + 1}: {r.passed ? "✓ Passed" : `✗ ${r.status.toUpperCase()}`}
                            </strong>
                            <span style={{ fontSize: 10, color: "#64748B" }}>{r.executionTimeMs}ms</span>
                          </div>
                          <div style={{ color: "#334155", fontFamily: "monospace", fontSize: 11 }}>
                            Input: {r.input}
                          </div>
                          <div style={{ color: "#334155", fontFamily: "monospace", fontSize: 11 }}>
                            Expected: {r.expected} | Actual: <span style={{ color: r.passed ? "#166534" : "#DC2626", fontWeight: 700 }}>{r.actual}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Socratic Coach Panel (if in Coach mode and view includes coach) */}
              {mode === "coach" && coachViewMode !== "editor" && (
                <div style={{
                  background: "#FFFFFF",
                  border: "1px solid #E4E1DA",
                  borderRadius: 10,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  minHeight: coachViewMode === "coach" ? 560 : 360,
                  boxShadow: "0 1px 3px rgba(16,24,40,0.04)"
                }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#162A43", textTransform: "uppercase", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                    <span>Socratic Coach</span>
                    <span style={{ fontSize: 10, color: "#2E7D5B" }}>● Online</span>
                  </div>

                  <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, paddingRight: 4, marginBottom: 12, maxHeight: coachViewMode === "coach" ? 420 : 220 }}>
                    {coachLog.map((m, idx) => (
                      <div
                        key={idx}
                        style={{
                          alignSelf: m.sender === "coach" ? "flex-start" : "flex-end",
                          background: m.sender === "coach" ? "#EFF4FE" : "#162A43",
                          color: m.sender === "coach" ? "#162A43" : "#FFFFFF",
                          padding: "8px 12px",
                          borderRadius: 8,
                          maxWidth: "85%",
                          fontSize: 12,
                          lineHeight: 1.4
                        }}
                      >
                        <MarkdownRenderer content={m.text} compact isDark={m.sender !== "coach"} />
                      </div>
                    ))}
                    {coachThinking && (
                      <div style={{ alignSelf: "flex-start", background: "#EFF4FE", color: "#356AE6", padding: "6px 12px", borderRadius: 8, fontSize: 11, fontStyle: "italic", display: "flex", alignItems: "center", gap: 6 }}>
                        <span>Coach is reasoning through your code and invariants...</span>
                      </div>
                    )}
                  </div>

                  {suggestedChips.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                      {suggestedChips.map((chip, i) => (
                        <button
                          key={i}
                          onClick={() => handleAskCoach(chip)}
                          disabled={coachThinking}
                          style={{
                            background: "#F6F5F1",
                            border: "1px solid #E4E1DA",
                            borderRadius: 12,
                            padding: "3px 8px",
                            fontSize: 10,
                            color: "#162A43",
                            cursor: coachThinking ? "not-allowed" : "pointer",
                            fontWeight: 600,
                            opacity: coachThinking ? 0.6 : 1
                          }}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      type="text"
                      value={coachInput}
                      disabled={coachThinking}
                      onChange={e => setCoachInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && !coachThinking && handleAskCoach()}
                      placeholder="Ask about invariants, bounds, or pointers..."
                      style={{ flex: 1, background: "#F6F5F1", border: "1px solid #E4E1DA", borderRadius: 6, padding: "8px 10px", fontSize: 12, outline: "none" }}
                    />
                    <button
                      onClick={() => handleAskCoach()}
                      disabled={coachThinking || !coachInput.trim()}
                      style={{
                        padding: "8px 14px",
                        borderRadius: 6,
                        border: "none",
                        background: coachThinking ? "#93C5FD" : "#356AE6",
                        color: "#FFFFFF",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: coachThinking ? "not-allowed" : "pointer"
                      }}
                    >
                      {coachThinking ? "..." : "Ask"}
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            MODE 4: INTERVIEW MODE (UPGRADED 5-7 QUESTION 6-AREA SIMULATION)
            ══════════════════════════════════════════════════════════════ */}
        {mode === "interview" && (
          <DsaUpgradedInterviewView
            candidateId={candidateId}
            selectedStepId={selectedStepId}
            selectedLanguage={selectedLanguage}
            setSelectedLanguage={setSelectedLanguage}
            onSelectStep={handleSelectStep}
            onExitInterview={() => setMode("practice")}
          />
        )}

        {/* ══════════════════════════════════════════════════════════════
            MODE 5: SDE 455 DSA MASTERY TRACKER
            ══════════════════════════════════════════════════════════════ */}
        {mode === "tracker" && (
          <div style={{ marginBottom: 24 }}>
            <DsaMasteryTrackerView
              isEmbedded={true}
              onSelectProblem={(probId) => {
                const prob = getDsaSheetProblemById(probId);
                if (prob) {
                  setActiveProblem(prob);
                  setSelectedStepId(prob.step_id);
                  setMode("practice");
                  saveSelection(prob.step_id, prob.id, "practice");
                }
              }}
            />
          </div>
        )}

      </main>

      {/* Pre-Session Brief Modal */}
      {sessionBrief && (
        <SessionBriefModal
          isOpen={isBriefOpen}
          onClose={() => setIsBriefOpen(false)}
          brief={sessionBrief}
          onStartSession={() => setIsBriefOpen(false)}
          targetHref="/student/skills/dsa"
        />
      )}

      {/* Dedicated Contextual DSA Mentor Drawer */}
      <DsaMentorDrawer
        isOpen={isMentorOpen}
        onClose={() => setIsMentorOpen(false)}
        activeProblemTitle={activeProblem.title}
        activeProblemId={activeProblem.id}
        currentCode={code}
        currentLanguage={selectedLanguage}
      />

    </div>
  );
}

export default function DSACodingArenaPage() {
  return (
    <React.Suspense fallback={<div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1" }} />}>
      <DSACodingArenaContent />
    </React.Suspense>
  );
}
