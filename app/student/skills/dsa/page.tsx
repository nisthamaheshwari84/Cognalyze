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
  STRIVER_STEPS,
  getAllStriverProblems,
  getStriverProblemById,
  getTargetedReTestProblem,
  StriverProblemFull,
  DsaInterviewQuestionItem
} from "@/lib/skills/striver-curriculum";
import {
  getStudentDsaFocus,
  getStudentDsaSummary,
  getStudentStriverProgress,
  updateStudentStriverStatus
} from "@/lib/skills/candidate-history";
import {
  CANONICAL_DSA_PROBLEMS,
  getCanonicalProblem,
  CanonicalProblem
} from "@/lib/skills/dsa-canonical-problems";
import CanonicalProblemView from "@/components/skills/CanonicalProblemView";
import { DsaInterviewSession } from "@/lib/skills/dsa-interview-store";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";

export type DSAMode = "learn" | "practice" | "coach" | "interview";

function DSACodingArenaContent() {
  const searchParams = useSearchParams();
  const [candidateId, setCandidateId] = useState("");
  const [trackSlug, setTrackSlug] = useState<"service_mass" | "service_elite" | "product_mid" | "product_faang">("product_mid");

  // Mode Selector: Learn | Practice | Coach | Interview
  const [mode, setMode] = useState<DSAMode>("practice");
  const [selectedLanguage, setSelectedLanguage] = useState<"cpp" | "python" | "javascript" | "java">("cpp");

  // Striver Roadmap Navigation State
  const [selectedStepId, setSelectedStepId] = useState<string>("step-4");
  const [selectedSubtopic, setSelectedSubtopic] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [problemsList, setProblemsList] = useState<StriverProblemFull[]>([]);
  const [activeProblem, setActiveProblem] = useState<StriverProblemFull>(() => getStriverProblemById("painter-s-partition-problem"));

  // Dynamic Candidate State & Striver Progress
  const [dsaSummary, setDsaSummary] = useState(() => getStudentDsaSummary(""));
  const [currentFocus, setCurrentFocus] = useState(() => getStudentDsaFocus(""));
  const [candidateProgressMap, setCandidateProgressMap] = useState<Record<string, any>>({});

  // Learn Mode State
  const [revealedSolution, setRevealedSolution] = useState(false);
  const [activeLearnSection, setActiveLearnSection] = useState<"concept" | "bruteforce" | "optimal" | "dryrun">("concept");
  const [checkpointSubmitted, setCheckpointSubmitted] = useState(false);
  const [selectedCheckpointOption, setSelectedCheckpointOption] = useState<number | null>(null);

  // Practice & Code Editor State
  const [code, setCode] = useState("");
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
    if (queryMode && ["learn", "practice", "coach", "interview"].includes(queryMode)) {
      setMode(queryMode);
    }

    const queryStepId = searchParams.get("step") || searchParams.get("stepId");
    if (queryStepId && STRIVER_STEPS.some(s => s.id === queryStepId)) {
      setSelectedStepId(queryStepId);
    }

    const queryProblemId = searchParams.get("problemId") || searchParams.get("id");
    if (queryProblemId) {
      const p = getStriverProblemById(queryProblemId);
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

      // Check saved selection in localStorage if query parameters weren't explicitly provided
      if (typeof window !== "undefined" && !queryStepId && !queryProblemId) {
        try {
          const saved = localStorage.getItem(`cognalyze_dsa_sel_${finalId}`);
          if (saved) {
            const parsed = JSON.parse(saved);
            if (parsed.stepId && STRIVER_STEPS.some(s => s.id === parsed.stepId)) {
              setSelectedStepId(parsed.stepId);
            }
            if (parsed.problemId) {
              const p = getStriverProblemById(parsed.problemId);
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
              const qProb = getStriverProblemById(activeQ.problemId);
              setActiveProblem(qProb);
              if (activeQ.submittedCode) {
                setCode(activeQ.submittedCode);
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
    const progress = getStudentStriverProgress(cid);
    setCandidateProgressMap(progress);
  };

  // Canonical Selection Handlers
  const handleSelectStep = (stepId: string) => {
    setSelectedStepId(stepId);
    setSelectedSubtopic("all");
    const list = getAllStriverProblems({ stepId, subtopic: "all" });
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
    const prob = getStriverProblemById(problemId);
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
    let list = getAllStriverProblems({
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

  // Sync starter code when active problem or language changes (outside active interview with existing code)
  useEffect(() => {
    if (activeProblem) {
      const canonical = getCanonicalProblem(activeProblem.id);
      const starter = canonical?.starterCode[selectedLanguage] ||
                      activeProblem.starterCode[selectedLanguage] ||
                      activeProblem.starterCode.python;

      // In active interview, preserve existing submitted code for the question if present
      if (mode === "interview" && activeSession && interviewStarted) {
        const q = activeSession.questions[activeSession.currentQuestionIndex];
        if (q && q.submittedCode) {
          setCode(q.submittedCode);
          return;
        }
      }

      setCode(starter);
      setTestOutput(null);
      setPostFeedback(null);
      setRevealedSolution(false);
      setInterviewerFollowUp(null);
      setCandidateFollowUpResponse("");
      setFollowUpSaved(false);
      setCheckpointSubmitted(false);
      setSelectedCheckpointOption(null);
    }
  }, [activeProblem, selectedLanguage, mode]);

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
          const prob = getStriverProblemById(firstQ.problemId);
          setActiveProblem(prob);
          const canonical = getCanonicalProblem(prob.id);
          setCode(canonical?.starterCode[selectedLanguage] || prob.starterCode[selectedLanguage] || prob.starterCode.python);
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
            isInterview: false
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
          const nextProb = getStriverProblemById(nextQ.problemId);
          setActiveProblem(nextProb);
          const canonical = getCanonicalProblem(nextProb.id);
          setCode(nextQ.submittedCode || canonical?.starterCode[selectedLanguage] || nextProb.starterCode[selectedLanguage] || nextProb.starterCode.python);
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
    updateStudentStriverStatus(candidateId, activeProblem.id, "learned");
    refreshCandidateData(candidateId);
  };

  const handleAskCoach = () => {
    if (!coachInput.trim()) return;
    const userMsg = coachInput.trim();
    setCoachLog(prev => [...prev, { sender: "candidate", text: userMsg }]);
    setCoachInput("");

    setTimeout(() => {
      let reply = `In ${activeProblem.title}, consider what invariant must hold true at every element.`;
      if (userMsg.toLowerCase().includes("loop") || userMsg.toLowerCase().includes("nested")) {
        reply = "Nested loops compare every pair in O(N²). Can a hash map or binary search on answers reduce redundant work?";
      } else if (userMsg.toLowerCase().includes("pointer") || userMsg.toLowerCase().includes("window")) {
        reply = "If using two pointers, define when the left pointer moves forward. Does moving the right pointer strictly increase the constraint?";
      } else if (userMsg.toLowerCase().includes("overflow") || userMsg.toLowerCase().includes("range")) {
        reply = "Always check constraints: if total sums reach 10^10, does your language require 64-bit integers (`long long` in C++) to prevent silent overflow?";
      } else if (userMsg.toLowerCase().includes("edge") || userMsg.toLowerCase().includes("empty")) {
        reply = "Always verify: What if N = 1? What if all numbers are negative? Does your initialization guard against empty inputs?";
      }
      setCoachLog(prev => [...prev, { sender: "coach", text: reply }]);
    }, 600);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const currentStep = STRIVER_STEPS.find(s => s.id === selectedStepId) || STRIVER_STEPS[3];
  const canonicalActive = getCanonicalProblem(activeProblem.id);

  // Interview Question Progress Tracking
  const activeQuestionIndex = activeSession?.currentQuestionIndex ?? 0;
  const isLastInterviewQuestion = activeSession ? activeQuestionIndex === activeSession.questions.length - 1 : false;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#F6F5F1", color: "#17191C", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}>
      
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
                <span style={{ color: "#356AE6", fontSize: 12, fontWeight: 700 }}>DSA Arena (Striver A2Z)</span>
              </div>
              <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#162A43", display: "flex", alignItems: "center", gap: 8, letterSpacing: "-0.02em" }}>
                <span>⚡</span>
                <span>DSA Algorithmic Problem Solving &amp; Striver Curriculum Arena</span>
              </h1>
            </div>

            {/* Mode Selector Tabs (Disabled during active interview to prevent desync) */}
            <div style={{ display: "flex", background: "#F6F5F1", padding: 3, borderRadius: 8, border: "1px solid #E4E1DA", gap: 2 }}>
              {[
                { id: "learn", label: "💡 Learn" },
                { id: "practice", label: "🛠️ Practice" },
                { id: "coach", label: "🎓 Coach" },
                { id: "interview", label: "🎯 Interview" }
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

            <span style={{ fontSize: 11, padding: "4px 9px", background: "#EFF4FE", color: "#356AE6", border: "1px solid #D2E0FB", borderRadius: 6, fontWeight: 700 }}>
              🏛️ {trackSlug.replace("_", " ").toUpperCase()} BAR
            </span>
          </div>

        </div>
      </header>

      {/* Dynamic Focus Strip */}
      <div style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #E4E1DA", padding: "8px 24px" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ color: "#667085" }}>Current Focus:</span>
            <strong style={{ color: "#162A43" }}>{currentFocus.topic}</strong>
            <span style={{ color: "#E4E1DA" }}>|</span>
            <span style={{ color: "#475467" }}>{currentFocus.reason}</span>
            <span style={{ color: "#E4E1DA" }}>|</span>
            <span style={{ color: "#2E7D5B", fontWeight: 700 }}>
              📊 Striver Progress: {dsaSummary.totalSolved} / {dsaSummary.totalAvailable} Solved
            </span>
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
          <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 18, marginBottom: 24 }}>
            
            {/* Left: Striver Roadmap Steps & Problems Browser */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 16, height: "calc(100vh - 180px)", overflowY: "auto", position: "sticky", top: 80, boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#162A43", textTransform: "uppercase", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Striver A2Z Roadmap</span>
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
                {STRIVER_STEPS.map(s => (
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

            {/* Right: Full Problem Details and Learning Tutorial */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 24, boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
              {canonicalActive ? (
                <CanonicalProblemView problem={canonicalActive} selectedLanguage={selectedLanguage} />
              ) : (
                <div style={{ fontSize: 14, color: "#162A43", lineHeight: 1.6 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, margin: "0 0 8px" }}>{activeProblem.title}</h2>
                  <p>{activeProblem.description}</p>
                </div>
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

        {/* ══════════════════════════════════════════════════════════════
            MODE 2 & 3: PRACTICE & COACH MODE
            ══════════════════════════════════════════════════════════════ */}
        {(mode === "practice" || mode === "coach") && (
          <div style={{ display: "grid", gridTemplateColumns: mode === "coach" ? "1fr 340px" : "1fr 300px", gap: 18, marginBottom: 24 }}>
            
            {/* Left: Problem Details & Code Editor */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              
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
                        {STRIVER_STEPS.map(s => (
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

              {/* Code Editor */}
              <div style={{ background: "#162A43", border: "1px solid #233752", borderRadius: 10, overflow: "hidden", boxShadow: "0 1px 3px rgba(16,24,40,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#111C2E", padding: "8px 16px", borderBottom: "1px solid #233752" }}>
                  <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, fontFamily: "monospace" }}>
                    solution.{selectedLanguage === "cpp" ? "cpp" : selectedLanguage === "python" ? "py" : selectedLanguage === "javascript" ? "js" : "java"}
                  </span>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => {
                        const canonical = getCanonicalProblem(activeProblem.id);
                        setCode(canonical?.starterCode[selectedLanguage] || activeProblem.starterCode[selectedLanguage] || activeProblem.starterCode.python);
                      }}
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
                  onChange={e => setCode(e.target.value)}
                  rows={16}
                  style={{
                    width: "100%",
                    background: "transparent",
                    color: "#FFFFFF",
                    fontFamily: "monospace",
                    fontSize: 12.5,
                    lineHeight: 1.5,
                    padding: 14,
                    border: "none",
                    outline: "none",
                    boxSizing: "border-box",
                    resize: "vertical"
                  }}
                />
              </div>

              {/* Execution & Test Case Diagnostics */}
              {testOutput && (
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

            </div>

            {/* Right: Socratic Coach OR Scaffolding */}
            {mode === "coach" ? (
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", height: 600, boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: "#162A43", textTransform: "uppercase", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
                  <span>Socratic Coach</span>
                  <span style={{ fontSize: 10, color: "#2E7D5B" }}>● Online</span>
                </div>

                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, paddingRight: 4, marginBottom: 12 }}>
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
                </div>

                <div style={{ display: "flex", gap: 6 }}>
                  <input
                    type="text"
                    value={coachInput}
                    onChange={e => setCoachInput(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleAskCoach()}
                    placeholder="Ask about invariants, bounds, or pointers..."
                    style={{ flex: 1, background: "#F6F5F1", border: "1px solid #E4E1DA", borderRadius: 6, padding: "8px 10px", fontSize: 12, outline: "none" }}
                  />
                  <button
                    onClick={handleAskCoach}
                    style={{ padding: "8px 14px", borderRadius: 6, border: "none", background: "#356AE6", color: "#FFFFFF", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                  >
                    Ask
                  </button>
                </div>
              </div>
            ) : (
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
                    marginTop: 18,
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
            )}

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            MODE 4: INTERVIEW MODE
            ══════════════════════════════════════════════════════════════ */}
        {mode === "interview" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {!interviewStarted ? (
              /* ── SCREEN 4A: PROPER INTERVIEW SETUP FLOW ── */
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 32, maxWidth: 640, margin: "20px auto", boxShadow: "0 1px 4px rgba(16,24,40,0.06)" }}>
                <div style={{ textAlign: "center", marginBottom: 20 }}>
                  <span style={{ fontSize: 36 }}>🎯</span>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: "#162A43", margin: "8px 0 6px" }}>
                    Multi-Question Technical Interview Simulation
                  </h2>
                  <p style={{ fontSize: 13, color: "#667085", lineHeight: 1.6, margin: 0 }}>
                    Solve a sequence of verified algorithmic problems with genuine compiler execution, proctoring telemetry, and contextual follow-ups. Question sequence is locked for the duration of the interview.
                  </p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#162A43", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                      Target Roadmap Step / Curriculum
                    </label>
                    <select
                      value={selectedStepId}
                      onChange={e => handleSelectStep(e.target.value)}
                      style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #E4E1DA", background: "#F6F5F1", fontSize: 12, fontWeight: 600, outline: "none" }}
                    >
                      {STRIVER_STEPS.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.icon} {s.title} ({s.problemCount} Qs)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#162A43", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                        Question Count
                      </label>
                      <select
                        value={interviewQuestionCount}
                        onChange={e => setInterviewQuestionCount(parseInt(e.target.value, 10))}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #E4E1DA", background: "#F6F5F1", fontSize: 12, fontWeight: 600, outline: "none" }}
                      >
                        <option value={2}>2 Questions (Foundational + Core)</option>
                        <option value={3}>3 Questions (Standard 30-min Loop)</option>
                        <option value={4}>4 Questions (Bar-Raiser Marathon)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#162A43", textTransform: "uppercase", display: "block", marginBottom: 6 }}>
                        Programming Language
                      </label>
                      <select
                        value={selectedLanguage}
                        onChange={e => setSelectedLanguage(e.target.value as any)}
                        style={{ width: "100%", padding: "8px 10px", borderRadius: 7, border: "1px solid #E4E1DA", background: "#F6F5F1", fontSize: 12, fontWeight: 600, outline: "none" }}
                      >
                        <option value="cpp">C++ 20 (Clang++/G++)</option>
                        <option value="python">Python 3</option>
                        <option value="javascript">JavaScript (Node VM)</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleStartInterviewSession}
                  style={{
                    width: "100%",
                    padding: "12px",
                    borderRadius: 8,
                    border: "none",
                    background: "#356AE6",
                    color: "#FFFFFF",
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer",
                    boxShadow: "0 2px 4px rgba(53,106,230,0.2)"
                  }}
                >
                  Start Locked Interview Session ➔
                </button>
              </div>
            ) : interviewCompleted && activeSession?.finalScorecard ? (
              /* ── SCREEN 4B: FINAL EVIDENCE-BACKED SCORECARD ── */
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 28, marginBottom: 24, boxShadow: "0 1px 4px rgba(16,24,40,0.06)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20, flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <span style={{ fontSize: 10, padding: "2px 8px", background: "#EFF4FE", color: "#356AE6", border: "1px solid #D2E0FB", borderRadius: 4, fontWeight: 800, textTransform: "uppercase" }}>
                      AUTHENTICATED TECHNICAL SCORECARD
                    </span>
                    <h3 style={{ fontSize: 20, fontWeight: 800, color: "#162A43", margin: "4px 0 2px" }}>
                      Bar-Raiser Technical Interview Evaluation Dossier
                    </h3>
                    <div style={{ fontSize: 12, color: "#667085" }}>
                      Session ID: {activeSession.sessionId} • Language: {activeSession.language.toUpperCase()} • Step: {activeSession.stepId || selectedStepId}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 32, fontWeight: 800, color: activeSession.finalScorecard.overallScore >= 70 ? "#2E7D5B" : "#C24141" }}>
                      {activeSession.finalScorecard.overallScore}%
                    </div>
                    <span style={{
                      fontSize: 12,
                      padding: "2px 8px",
                      borderRadius: 4,
                      fontWeight: 800,
                      background: activeSession.finalScorecard.overallScore >= 70 ? "#EAF4EE" : "#FDF2F2",
                      color: activeSession.finalScorecard.overallScore >= 70 ? "#2E7D5B" : "#C24141"
                    }}>
                      VERDICT: {activeSession.finalScorecard.verdict.toUpperCase()}
                    </span>
                    {activeSession.finalScorecard.scoreCalculationExplanation && (
                      <div style={{ fontSize: 10, color: "#667085", marginTop: 4, maxWidth: 360, textAlign: "right" }}>
                        {activeSession.finalScorecard.scoreCalculationExplanation}
                      </div>
                    )}
                  </div>
                </div>

                {/* Multi-Dimensional Competency Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10, marginBottom: 20 }}>
                  {[
                    { label: "Functional Correctness", val: activeSession.finalScorecard.dimensionScores.functionalCorrectness },
                    { label: "Hidden Test Execution", val: activeSession.finalScorecard.dimensionScores.hiddenTests },
                    { label: "Boundary & Edge Cases", val: activeSession.finalScorecard.dimensionScores.edgeCaseHandling },
                    { label: "Time Complexity", val: activeSession.finalScorecard.dimensionScores.timeComplexity },
                    { label: "Space Complexity", val: activeSession.finalScorecard.dimensionScores.spaceComplexity },
                    { label: "Conceptual Defense", val: activeSession.finalScorecard.dimensionScores.conceptualUnderstanding }
                  ].map((dim, i) => (
                    <div key={i} style={{ background: "#F6F5F1", padding: 12, borderRadius: 8, border: "1px solid #E4E1DA" }}>
                      <div style={{ fontSize: 11, color: "#667085", marginBottom: 2 }}>{dim.label}</div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: dim.val >= 70 ? "#2E7D5B" : dim.val >= 40 ? "#B7791F" : "#C24141" }}>
                        {dim.val}%
                      </div>
                    </div>
                  ))}
                </div>

                {/* Per-Question Results Breakdown */}
                <div style={{ fontSize: 12, fontWeight: 800, color: "#162A43", textTransform: "uppercase", marginBottom: 8 }}>
                  Locked Round Breakdown ({activeSession.questions.length} Questions)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginBottom: 20 }}>
                  {activeSession.finalScorecard.questionSummaries.map((r, i) => (
                    <div key={i} style={{ padding: 14, borderRadius: 8, background: "#FFFFFF", border: r.score >= 70 ? "1px solid #C8E4D3" : "1px solid #F8C8C8" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: "#667085", fontWeight: 700 }}>Question {i + 1}</span>
                        <span style={{ color: r.score >= 70 ? "#2E7D5B" : "#C24141", fontWeight: 800, fontSize: 11 }}>
                          {r.verdict} ({r.score}%)
                        </span>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: "#162A43", marginBottom: 6 }}>{r.title}</div>
                      <div style={{ fontSize: 11, color: "#475467", marginBottom: 6 }}>
                        Tests Passed: <strong>{r.passedCount}/{r.totalTests}</strong>
                      </div>
                      {r.specificFeedback && (
                        <div style={{ fontSize: 11, color: "#374151", background: "#F9FAFB", padding: "6px 8px", borderRadius: 5, marginBottom: 6, lineHeight: 1.4 }}>
                          <strong>Feedback:</strong> {r.specificFeedback}
                        </div>
                      )}
                      {r.expectedApproach && (
                        <div style={{ fontSize: 10.5, color: "#6B7280" }}>
                          <strong>Expected Approach:</strong> {r.expectedApproach}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Proctoring & Integrity Telemetry */}
                <div style={{ padding: 14, borderRadius: 8, background: "#F6F5F1", border: "1px solid #E4E1DA", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: activeSession.finalScorecard.proctoringSummary.flagged ? "#B7791F" : "#2E7D5B" }}>
                      🛡️ Proctoring &amp; Environment Integrity Telemetry
                    </span>
                    <div style={{ fontSize: 11, color: "#667085", marginTop: 2 }}>
                      {activeSession.finalScorecard.proctoringSummary.totalTabSwitches === 0
                        ? "Continuous environment focus verified: zero tab switch events recorded."
                        : `Flagged: ${activeSession.finalScorecard.proctoringSummary.totalTabSwitches} tab-switch violation(s) captured by client telemetry.`}
                    </div>
                    <div style={{ fontSize: 10, color: "#98A2B3", marginTop: 3 }}>
                      * Note: Integrity telemetry assesses proctored environment adherence independently from algorithmic code correctness.
                    </div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: activeSession.finalScorecard.proctoringSummary.flagged ? "#B7791F" : "#2E7D5B" }}>
                    {activeSession.finalScorecard.proctoringSummary.flagged ? "Flagged" : "Verified 100%"}
                  </span>
                </div>

                {/* Strengths & Weaknesses */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                  <div style={{ padding: 12, borderRadius: 8, background: "#EAF4EE", border: "1px solid #C8E4D3" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#2E7D5B", marginBottom: 4 }}>
                      ✓ DEMONSTRATED STRENGTHS
                    </div>
                    {activeSession.finalScorecard.strengths.map((s, i) => (
                      <div key={i} style={{ fontSize: 12, color: "#14532D", lineHeight: 1.4 }}>• {s}</div>
                    ))}
                  </div>

                  <div style={{ padding: 12, borderRadius: 8, background: "#FEF7ED", border: "1px solid #F8D8A7" }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#B7791F", marginBottom: 4 }}>
                      ⚠️ AREAS FOR IMPROVEMENT
                    </div>
                    {activeSession.finalScorecard.weaknesses.map((w, i) => (
                      <div key={i} style={{ fontSize: 12, color: "#78350F", lineHeight: 1.4 }}>• {w}</div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 14, borderTop: "1px solid #E4E1DA" }}>
                  <div>
                    <div style={{ fontSize: 10, color: "#667085", textTransform: "uppercase", fontWeight: 700 }}>
                      RECOMMENDED NEXT ACTION
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#162A43" }}>
                      {activeSession.finalScorecard.recommendation}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setInterviewStarted(false);
                      setInterviewCompleted(false);
                      setActiveSession(null);
                      setMode("practice");
                    }}
                    style={{ padding: "8px 18px", borderRadius: 7, border: "none", background: "#356AE6", color: "#FFFFFF", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
                  >
                    Back to Practice Arena ➔
                  </button>
                </div>
              </div>
            ) : (
              /* ── SCREEN 4C: ACTIVE LOCKED MULTI-QUESTION INTERVIEW ── */
              <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 18 }}>
                
                {/* Left: Current Locked Question & Code Editor */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  
                  {/* Interview Question Progress Header */}
                  {activeSession && (
                    <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: "10px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {activeSession.questions.map((q, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: "4px 10px",
                              borderRadius: 5,
                              fontSize: 11,
                              fontWeight: 700,
                              background: idx === activeSession.currentQuestionIndex ? "#162A43" : q.status === "completed" || q.status === "submitted" ? "#EAF4EE" : "#F6F5F1",
                              color: idx === activeSession.currentQuestionIndex ? "#FFFFFF" : q.status === "completed" || q.status === "submitted" ? "#2E7D5B" : "#667085",
                              border: `1px solid ${idx === activeSession.currentQuestionIndex ? "#162A43" : "#E4E1DA"}`
                            }}
                          >
                            Q{idx + 1}: {q.title.slice(0, 16)}... {q.status === "completed" || q.status === "submitted" ? "✓" : ""}
                          </div>
                        ))}
                      </div>

                      <span style={{ fontSize: 11, color: "#667085" }}>
                        Question {activeSession.currentQuestionIndex + 1} of {activeSession.questions.length}
                      </span>
                    </div>
                  )}

                  {/* Problem Statement Card */}
                  <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 18, boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
                    {canonicalActive ? (
                      <CanonicalProblemView problem={canonicalActive} selectedLanguage={selectedLanguage} />
                    ) : (
                      <div>
                        <h2 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 6px", color: "#162A43" }}>{activeProblem.title}</h2>
                        <p style={{ margin: "0 0 8px", fontSize: 13, color: "#475467" }}>{activeProblem.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Code Editor */}
                  <div style={{ background: "#162A43", border: "1px solid #233752", borderRadius: 10, overflow: "hidden" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#111C2E", padding: "8px 16px", borderBottom: "1px solid #233752" }}>
                      <span style={{ fontSize: 11, color: "#94A3B8", fontWeight: 700, fontFamily: "monospace" }}>
                        solution.{selectedLanguage === "cpp" ? "cpp" : selectedLanguage === "python" ? "py" : "js"}
                      </span>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={handleRunCode}
                          disabled={runningTests}
                          style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: "#2E7D5B", color: "#FFFFFF", fontSize: 11, fontWeight: 700, cursor: runningTests ? "not-allowed" : "pointer" }}
                        >
                          {runningTests ? "Compiling..." : "▶ Run Visible Tests"}
                        </button>
                        <button
                          onClick={handleSubmitCode}
                          disabled={evaluating}
                          style={{ padding: "5px 16px", borderRadius: 6, border: "none", background: "#356AE6", color: "#FFFFFF", fontSize: 11, fontWeight: 700, cursor: evaluating ? "not-allowed" : "pointer" }}
                        >
                          {evaluating ? "Evaluating..." : "Evaluate Question ➔"}
                        </button>
                      </div>
                    </div>

                    <textarea
                      value={code}
                      onChange={e => setCode(e.target.value)}
                      rows={15}
                      style={{
                        width: "100%",
                        background: "transparent",
                        color: "#FFFFFF",
                        fontFamily: "monospace",
                        fontSize: 12.5,
                        lineHeight: 1.5,
                        padding: 14,
                        border: "none",
                        outline: "none",
                        boxSizing: "border-box"
                      }}
                    />
                  </div>

                  {/* Real Execution Diagnostics */}
                  {testOutput && (
                    <div style={{
                      background: "#FFFFFF",
                      border: testOutput.compilationError ? "1px solid #F8C8C8" : testOutput.passed ? "1px solid #C8E4D3" : "1px solid #F8C8C8",
                      borderRadius: 10,
                      padding: 14
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                        <span style={{
                          fontSize: 10,
                          padding: "2px 8px",
                          borderRadius: 4,
                          fontWeight: 800,
                          textTransform: "uppercase",
                          background: testOutput.passed ? "#EAF4EE" : "#FDF2F2",
                          color: testOutput.passed ? "#2E7D5B" : "#C24141"
                        }}>
                          {testOutput.verdict}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#162A43" }}>
                          Score: {testOutput.score}% ({testOutput.passedCount}/{testOutput.totalTests} tests passed)
                        </span>
                      </div>

                      {testOutput.compilationError && (
                        <div style={{ background: "#FEF2F2", border: "1px solid #F87171", borderRadius: 6, padding: "8px 10px", fontSize: 11, color: "#991B1B", fontFamily: "monospace", whiteSpace: "pre-wrap" }}>
                          {testOutput.compilationError}
                        </div>
                      )}

                      {testOutput.results && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                          {testOutput.results.slice(0, 4).map((r, i) => (
                            <div key={i} style={{ fontSize: 11, fontFamily: "monospace", color: r.passed ? "#166534" : "#991B1B" }}>
                              {r.passed ? "✓" : "✗"} Test {i + 1}: Expected {r.expected} → Actual: {r.actual}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Next Question Navigation */}
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
                    {!isLastInterviewQuestion ? (
                      <button
                        onClick={handleNextInterviewQuestion}
                        style={{
                          padding: "9px 20px",
                          borderRadius: 7,
                          border: "none",
                          background: "#162A43",
                          color: "#FFFFFF",
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        Next Question ({activeQuestionIndex + 2} of {activeSession?.questions.length}) ➔
                      </button>
                    ) : (
                      <button
                        onClick={handleFinalizeInterview}
                        style={{
                          padding: "10px 24px",
                          borderRadius: 7,
                          border: "none",
                          background: "#2E7D5B",
                          color: "#FFFFFF",
                          fontSize: 13,
                          fontWeight: 800,
                          cursor: "pointer",
                          boxShadow: "0 2px 4px rgba(46,125,91,0.25)"
                        }}
                      >
                        Finalize All Questions &amp; View Bar-Raiser Scorecard ➔
                      </button>
                    )}
                  </div>

                  {evaluationError && (
                    <div style={{ background: "#FEF2F2", border: "1px solid #F87171", borderRadius: 8, padding: 12, marginTop: 10, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 12, color: "#991B1B" }}>⚠️ {evaluationError}</span>
                      <button
                        onClick={handleFinalizeInterview}
                        disabled={evaluating}
                        style={{ padding: "6px 14px", background: "#991B1B", color: "#FFF", borderRadius: 6, border: "none", cursor: evaluating ? "not-allowed" : "pointer", fontSize: 11, fontWeight: 700 }}
                      >
                        {evaluating ? "Evaluating..." : "Retry Final Evaluation ↺"}
                      </button>
                    </div>
                  )}

                </div>

                {/* Right: Technical Follow-up Challenge & Proctoring */}
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  
                  {/* Proctoring Webcam Preview */}
                  <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 12, textAlign: "center", boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: "#2E7D5B", marginBottom: 6, display: "flex", justifyContent: "space-between" }}>
                      <span>● LIVE PROCTORING</span>
                      <span>HD WEBCAM</span>
                    </div>
                    <div style={{ width: "100%", height: 130, background: "#111C2E", borderRadius: 7, overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    </div>
                  </div>

                  {/* Contextual Technical Follow-up */}
                  <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 16, boxShadow: "0 1px 3px rgba(16,24,40,0.04)" }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#162A43", textTransform: "uppercase", marginBottom: 8 }}>
                      🏛️ Technical Follow-up Probe
                    </div>
                    {interviewerFollowUp ? (
                      <div>
                        <div style={{ padding: "10px 12px", borderRadius: 7, background: "#EFF4FE", border: "1px solid #D2E0FB", fontSize: 12, color: "#162A43", lineHeight: 1.5, marginBottom: 10 }}>
                          <strong>Interviewer:</strong> &ldquo;{interviewerFollowUp}&rdquo;
                        </div>
                        <textarea
                          value={candidateFollowUpResponse}
                          onChange={e => {
                            setCandidateFollowUpResponse(e.target.value);
                            setFollowUpSaved(false);
                          }}
                          placeholder="Explain monotonicity, overflow safeguards, or trade-offs..."
                          rows={4}
                          style={{ width: "100%", background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 7, padding: 8, color: "#17191C", fontSize: 12, outline: "none", marginBottom: 8, boxSizing: "border-box" }}
                        />
                        <button
                          onClick={handleSaveFollowUpResponse}
                          style={{
                            width: "100%",
                            padding: "8px",
                            borderRadius: 6,
                            border: "none",
                            background: followUpSaved ? "#2E7D5B" : "#356AE6",
                            color: "#FFFFFF",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          {followUpSaved ? "✓ Defense Recorded" : "Submit Technical Defense ➔"}
                        </button>
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: "#667085", lineHeight: 1.5 }}>
                        Run visible tests or evaluate your code to receive the interviewer&apos;s trade-off challenge on complexity and edge invariants.
                      </div>
                    )}
                  </div>

                </div>

              </div>
            )}
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
