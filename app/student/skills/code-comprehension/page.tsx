"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import AppNav from "@/components/AppNav";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";
import {
  FOUNDATIONAL_LEARNING_MODULES,
  FoundationalModule,
  MicroLesson,
} from "@/lib/skills/code-comprehension/learning-modules";
import {
  TRACE_WORKFLOWS,
  TraceWorkflow,
  ExecutionFrame,
  PedagogicalMode,
} from "@/lib/skills/code-comprehension/execution-tracer";
import {
  COMPREHENSIVE_QUESTION_BANK,
  GuidedPracticeQuestion,
  QuestionCategory,
  QuestionDifficulty,
} from "@/lib/skills/code-comprehension/question-bank";
import {
  LEARNING_REPOSITORIES,
  INTERVIEW_REPOSITORIES,
  ComprehensiveRepository,
  EngineeringRole,
} from "@/lib/skills/code-comprehension/repository-intelligence";
import {
  InterviewMessage,
  InterviewEvaluationReport,
  GeneratedInterviewSession,
} from "@/lib/skills/code-comprehension/interview-simulation-engine";
import { LearningJourneyState } from "@/lib/skills/code-comprehension/learning-progression-store";
import {
  TeachingDifficultyLevel,
  StudentEvaluationResult,
  classifyVoiceCommand,
} from "@/lib/skills/code-comprehension/personal-teacher-engine";
import { getLessonNarration } from "@/lib/skills/code-comprehension/learning-modules";

export default function CodeComprehensionLabPage() {
  // Navigation & Pipeline Stage: 1 | 2 | 3 | 4 | 5 | 6
  const [pipelineStage, setPipelineStage] = useState<number>(1);
  const [candidateId, setCandidateId] = useState<string>("student-demo");
  const [tenantId, setTenantId] = useState<string>("default-tenant");

  // Learning Progress & Exposure History State
  const [progress, setProgress] = useState<LearningJourneyState | null>(null);
  const [exposedRepoIds, setExposedRepoIds] = useState<string[]>([]);

  // Speech Voice State & Personal AI Teacher State
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechRate, setSpeechRate] = useState<number>(1.0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [teacherLevel, setTeacherLevel] = useState<TeachingDifficultyLevel>(3);
  const [freeFormAnswerInput, setFreeFormAnswerInput] = useState<string>("");
  const [freeFormEvaluating, setFreeFormEvaluating] = useState<boolean>(false);
  const [freeFormResult, setFreeFormResult] = useState<StudentEvaluationResult | null>(null);
  const [teacherDeskDialogue, setTeacherDeskDialogue] = useState<Array<{ sender: "alex" | "student"; text: string; tag?: string }>>([]);
  const [unlockedFrameHints, setUnlockedFrameHints] = useState<number>(0);

  // =========================================================================
  // STAGE 1: FOUNDATIONS STATE (MULTI-REPOSITORY & MICRO-LESSONS)
  // =========================================================================
  const [selectedLearnRepoId, setSelectedLearnRepoId] = useState<string>(LEARNING_REPOSITORIES[0].id);
  const [selectedModuleId, setSelectedModuleId] = useState<string>(FOUNDATIONAL_LEARNING_MODULES[0].id);
  const [activeMicroLessonIndex, setActiveMicroLessonIndex] = useState<number>(0);
  const [lessonSelections, setLessonSelections] = useState<Record<string, string>>({});
  const [lessonFeedback, setLessonFeedback] = useState<Record<string, { isCorrect: boolean; explanation: string }>>({});
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});

  // =========================================================================
  // STAGE 2: VISUAL DRY RUN STATE
  // =========================================================================
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>("taskflow_create_task");
  const [pedagogicalMode, setPedagogicalMode] = useState<PedagogicalMode>("I_DO");
  const [currentFrameIndex, setCurrentFrameIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeedMs, setPlaybackSpeedMs] = useState<number>(2500);
  const [predictionSelectedOpt, setPredictionSelectedOpt] = useState<string>("");
  const [predictionFeedback, setPredictionFeedback] = useState<{ isCorrect: boolean; explanation: string } | null>(null);

  // =========================================================================
  // STAGE 3: GUIDED PRACTICE (120+ QUESTION BANK) STATE
  // =========================================================================
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("all");
  const [selectedPracticeRepo, setSelectedPracticeRepo] = useState<string>("all");
  const [practiceSearchQuery, setPracticeSearchQuery] = useState<string>("");
  const [activeQuestionIndex, setActiveQuestionIndex] = useState<number>(0);
  const [practiceSelectedOpt, setPracticeSelectedOpt] = useState<string>("");
  const [practiceFeedback, setPracticeFeedback] = useState<{ isCorrect: boolean; explanation: string; scoreAwarded: number } | null>(null);
  const [unlockedHints, setUnlockedHints] = useState<number>(0);

  // Filtered Question Bank
  const filteredQuestions = COMPREHENSIVE_QUESTION_BANK.filter((q) => {
    if (selectedCategory !== "all" && q.category !== selectedCategory) return false;
    if (selectedDifficulty !== "all" && q.difficulty !== selectedDifficulty) return false;
    if (selectedPracticeRepo !== "all" && q.repositoryId !== selectedPracticeRepo) return false;
    if (practiceSearchQuery.trim()) {
      const query = practiceSearchQuery.toLowerCase();
      const matchTitle = q.title.toLowerCase().includes(query);
      const matchPrompt = q.prompt.toLowerCase().includes(query);
      const matchConcept = q.engineeringConcept.toLowerCase().includes(query);
      if (!matchTitle && !matchPrompt && !matchConcept) return false;
    }
    return true;
  });
  const currentQuestion = filteredQuestions[activeQuestionIndex] || COMPREHENSIVE_QUESTION_BANK[0];

  // =========================================================================
  // STAGE 4: REPOSITORY EXPLORER (IDE) STATE
  // =========================================================================
  const [activeExplorerRepoId, setActiveExplorerRepoId] = useState<string>(LEARNING_REPOSITORIES[0].id);
  const [activeExplorerFile, setActiveExplorerFile] = useState<string>(LEARNING_REPOSITORIES[0].entryPoint);
  const [explorerFileContent, setExplorerFileContent] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [runningTests, setRunningTests] = useState<boolean>(false);
  const [testOutput, setTestOutput] = useState<any | null>(null);
  const [tutorInput, setTutorInput] = useState<string>("");
  const [tutorMessages, setTutorMessages] = useState<Array<{ sender: "user" | "tutor"; text: string }>>([
    {
      sender: "tutor",
      text: "Welcome to Repo Explorer! Select any learning repository, inspect multi-file architectures, or ask me for contextual guidance.",
    },
  ]);
  const [tutorLoading, setTutorLoading] = useState<boolean>(false);

  // =========================================================================
  // STAGE 5: REAL INTERVIEW SIMULATION (DYNAMIC UNSEEN REPOSITORIES)
  // =========================================================================
  const [interviewRole, setInterviewRole] = useState<EngineeringRole>("backend_engineer");
  const [interviewDifficulty, setInterviewDifficulty] = useState<"mid" | "senior" | "staff">("senior");
  const [activeInterviewSession, setActiveInterviewSession] = useState<GeneratedInterviewSession | null>(null);
  const [interviewCandidateInput, setInterviewCandidateInput] = useState<string>("");
  const [interviewLoading, setInterviewLoading] = useState<boolean>(false);
  const [finalReport, setFinalReport] = useState<InterviewEvaluationReport | null>(null);

  // -------------------------------------------------------------------------
  // INITIAL DATA FETCH & SYNC
  // -------------------------------------------------------------------------
  useEffect(() => {
    fetchProgression();
    fetchExposures();
  }, [candidateId, tenantId]);

  const fetchProgression = async () => {
    try {
      const res = await fetch(`/api/skills/code-comprehension?view=learning_progress&candidateId=${candidateId}&tenantId=${tenantId}`);
      const data = await res.json();
      if (data.progress) {
        setProgress(data.progress);
      }
    } catch (err) {
      console.error("Failed to fetch progression:", err);
    }
  };

  const fetchExposures = async () => {
    try {
      const res = await fetch(`/api/skills/code-comprehension?view=user_exposure&candidateId=${candidateId}&tenantId=${tenantId}`);
      const data = await res.json();
      if (data.exposedRepoIds) {
        setExposedRepoIds(data.exposedRepoIds);
      }
    } catch (err) {
      console.error("Failed to fetch exposures:", err);
    }
  };

  // -------------------------------------------------------------------------
  // PERSONAL AI TEACHER: SPEECH SYNTHESIS & VOICE RECOGNITION
  // -------------------------------------------------------------------------
  const speakText = (text: string, onEnd?: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setIsPaused(false);
    const cleanText = text.replace(/[*#`_\[\]()]/g, " ").replace(/\s+/g, " ");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = speechRate;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      if (onEnd) onEnd();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };
    window.speechSynthesis.speak(utterance);
  };

  const pauseSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  };

  const resumeSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  };

  const stopSpeech = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  };

  const handleVoiceListen = (onResult: (text: string) => void) => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please type your response.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onResult(transcript);
    };
    recognition.start();
  };

  // -------------------------------------------------------------------------
  // STAGE 2: VISUAL DRY RUN WORKFLOW CONTROLS
  // -------------------------------------------------------------------------
  const activeWorkflow: TraceWorkflow =
    TRACE_WORKFLOWS[selectedWorkflowId] || Object.values(TRACE_WORKFLOWS)[0];
  const currentFrame: ExecutionFrame =
    activeWorkflow.frames[currentFrameIndex] || activeWorkflow.frames[0];

  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setCurrentFrameIndex((prev) => {
          if (prev >= activeWorkflow.frames.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, playbackSpeedMs);
    }
    return () => clearInterval(timer);
  }, [isPlaying, activeWorkflow.frames.length, playbackSpeedMs]);

  const handleStepNext = () => {
    stopSpeech();
    if (currentFrameIndex < activeWorkflow.frames.length - 1) {
      setCurrentFrameIndex((prev) => prev + 1);
      setPredictionFeedback(null);
      setPredictionSelectedOpt("");
      setFreeFormResult(null);
      setFreeFormAnswerInput("");
      setUnlockedFrameHints(0);
    }
  };

  const handleStepPrev = () => {
    stopSpeech();
    if (currentFrameIndex > 0) {
      setCurrentFrameIndex((prev) => prev - 1);
      setPredictionFeedback(null);
      setPredictionSelectedOpt("");
      setFreeFormResult(null);
      setFreeFormAnswerInput("");
      setUnlockedFrameHints(0);
    }
  };

  // -------------------------------------------------------------------------
  // PERSONAL AI TEACHER: ACTIONS & VOICE INTERRUPTS
  // -------------------------------------------------------------------------
  const narrateFoundationsLesson = (lesson: MicroLesson) => {
    const narration = getLessonNarration(lesson);
    setTeacherDeskDialogue([
      {
        sender: "alex",
        text: `### ${lesson.title}\n\n${narration.intro}\n\n**Why This Matters:** ${narration.whyItMatters}\n\n💡 **Everyday Analogy:** ${narration.analogy}\n\n🔍 **Code Walkthrough:** ${narration.codeWalkthrough}\n\n⚙️ **Internals:** ${narration.internals}\n\n❓ **Checkpoint:** ${narration.checkpointPrompt}`,
        tag: "foundations_lesson",
      },
    ]);
    speakText(narration.fullSpokenScript);
  };

  const narrateDryRunFrame = (frame: ExecutionFrame, mode: PedagogicalMode) => {
    if (mode === "I_DO") {
      const script = `${frame.title}. We are inside ${frame.filePath} in function ${frame.functionName}. ${frame.tellExplanation} ${frame.internalDeepDive}`;
      setTeacherDeskDialogue([
        {
          sender: "alex",
          text: `### Teacher Demonstration: ${frame.title}\n\n${frame.tellExplanation}\n\n**Production Significance:** ${frame.whyThisQuestionMatters}\n\n⚙️ **Runtime Internals:** ${frame.internalDeepDive}\n\n💡 **Everyday Analogy:** ${frame.beginnerAnalogy}`,
          tag: "teacher_demo",
        },
      ]);
      speakText(script);
    } else if (mode === "WE_DO") {
      const script = `${frame.title}. ${frame.tellExplanation} Let's pause here. ${frame.askQuestion}`;
      setTeacherDeskDialogue([
        {
          sender: "alex",
          text: `### Collaborative Checkpoint\n\n${frame.tellExplanation}\n\n❓ **Alex Asks:** ${frame.askQuestion}\n\n*Speak your answer via microphone, type your reasoning, or pick an option below.*`,
          tag: "we_do_checkpoint",
        },
      ]);
      speakText(script);
    } else {
      const script = `Independent Trace Challenge for Step ${frame.stepIndex}. Analyze the code in ${frame.filePath} and predict the state mutation.`;
      speakText(script);
    }
  };

  const handleTeacherQuickExplain = async (intent: "simpler_explanation" | "give_example" | "why_this_matters" | "internal_deep_dive") => {
    stopSpeech();
    try {
      const res = await fetch("/api/skills/code-comprehension", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "teacher_explain_more",
          intent,
          topicTitle: currentFrame.title,
          filePath: currentFrame.filePath,
          functionName: currentFrame.functionName,
          codeSnippet: currentFrame.codeSnippet,
          architectureStage: currentFrame.architectureStage,
          currentDifficultyLevel: teacherLevel,
        }),
      });
      const data = await res.json();
      if (data.spokenExplanation) {
        setTeacherDeskDialogue((prev) => [
          ...prev,
          { sender: "alex", text: `**${data.responseTitle}**\n\n${data.spokenExplanation}`, tag: intent },
        ]);
        speakText(data.spokenExplanation);
      }
    } catch (err) {
      console.error("Teacher explain error:", err);
    }
  };

  const handleVoiceCommandOrInterrupt = async (spoken: string) => {
    stopSpeech();
    setTeacherDeskDialogue((prev) => [...prev, { sender: "student", text: spoken }]);

    const intentResult = classifyVoiceCommand(spoken);
    if (intentResult.intent === "simpler_explanation") {
      const text = currentFrame.beginnerAnalogy || "Think of this as an identity check before entering a private building.";
      setTeacherDeskDialogue((prev) => [...prev, { sender: "alex", text: `💡 **Simpler Analogy:**\n\n${text}` }]);
      speakText(text);
      return;
    }
    if (intentResult.intent === "why_this_matters") {
      const text = currentFrame.whyThisQuestionMatters;
      setTeacherDeskDialogue((prev) => [...prev, { sender: "alex", text: `🏢 **Why This Matters in Production:**\n\n${text}` }]);
      speakText(text);
      return;
    }
    if (intentResult.intent === "internal_deep_dive") {
      const text = currentFrame.internalDeepDive;
      setTeacherDeskDialogue((prev) => [...prev, { sender: "alex", text: `⚙️ **Low-Level Runtime Internals:**\n\n${text}` }]);
      speakText(text);
      return;
    }
    if (intentResult.intent === "explain_again") {
      speakText(currentFrame.tellExplanation);
      return;
    }
    if (intentResult.intent === "next_step") {
      handleStepNext();
      return;
    }

    // Default: treat as free-form answer
    await handleFreeFormAnswerSubmit(spoken);
  };

  const handleFreeFormAnswerSubmit = async (customAnswer?: string) => {
    const answer = (customAnswer || freeFormAnswerInput).trim();
    if (!answer) return;
    setFreeFormEvaluating(true);
    try {
      const res = await fetch("/api/skills/code-comprehension", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "teacher_evaluate_response",
          topicTitle: currentFrame.title,
          filePath: currentFrame.filePath,
          codeSnippet: currentFrame.codeSnippet,
          checkpointQuestion: currentFrame.askQuestion,
          studentAnswer: answer,
          expectedInvariants: currentFrame.expectedInvariants,
          currentDifficultyLevel: teacherLevel,
          workflowId: activeWorkflow.id,
          stepIndex: currentFrame.stepIndex,
          candidateId,
          tenantId,
        }),
      });
      const data: StudentEvaluationResult = await res.json();
      setFreeFormResult(data);
      if (data.understandingLevel) setTeacherLevel(data.understandingLevel);

      const speech = data.isCorrect
        ? `${data.teacherPraise} ${data.correctionExplanation}`
        : `Let's refine that: ${data.correctionExplanation}`;

      setTeacherDeskDialogue((prev) => [
        ...prev,
        {
          sender: "alex",
          text: `**${data.isCorrect ? "✓ Alex's Evaluation: Correct!" : "⚠ Alex's Diagnostic Feedback"}** (Score: ${data.score}/100)\n\n${data.teacherPraise}\n\n${data.correctionExplanation}\n\n**Code Evidence:** \`${data.demonstratedProof}\`${data.followUpQuestion ? `\n\n❓ **Follow-up:** ${data.followUpQuestion}` : ""}`,
        },
      ]);
      speakText(speech);
      fetchProgression();
    } catch (err) {
      console.error("Free-form evaluation error:", err);
    } finally {
      setFreeFormEvaluating(false);
    }
  };

  const handlePredictionSubmit = async () => {
    if (!predictionSelectedOpt || !currentFrame.prediction) return;
    try {
      const res = await fetch("/api/skills/code-comprehension", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_trace_prediction",
          workflowId: activeWorkflow.id,
          stepIndex: currentFrame.stepIndex,
          selectedOptionId: predictionSelectedOpt,
          candidateId,
          tenantId,
          mode: pedagogicalMode,
        }),
      });
      const data = await res.json();
      setPredictionFeedback({
        isCorrect: data.isCorrect,
        explanation: data.explanation,
      });

      const speech = data.isCorrect
        ? `Spot on! ${data.explanation}`
        : `Diagnostic note: ${data.explanation}`;
      speakText(speech);

      if (data.progress) setProgress(data.progress);
      fetchProgression();
    } catch (err) {
      console.error(err);
    }
  };

  // STAGE 1: MICRO-LESSON EXERCISE SUBMISSION
  // -------------------------------------------------------------------------
  const handleMicroLessonSubmit = async (lesson: MicroLesson, optionId: string) => {
    setLessonSelections((prev) => ({ ...prev, [lesson.id]: optionId }));
    const opt = lesson.exercise.options.find((o) => o.id === optionId);
    if (!opt) return;

    const feedbackObj = {
      isCorrect: opt.isCorrect,
      explanation: opt.isCorrect
        ? (opt.successExplanation || "Spot on! Invariant successfully validated.")
        : (opt.misconceptionExplanation || "Not quite. Check the architectural trust boundary and data scope."),
    };

    setLessonFeedback((prev) => ({ ...prev, [lesson.id]: feedbackObj }));

    try {
      const res = await fetch("/api/skills/code-comprehension", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_module_check",
          moduleId: selectedModuleId,
          checkId: lesson.exercise.id,
          selectedOptionId: optionId,
          repositoryId: selectedLearnRepoId,
          candidateId,
          tenantId,
        }),
      });
      const data = await res.json();
      if (data.progress) setProgress(data.progress);
      fetchProgression();
    } catch (err) {
      console.error(err);
    }
  };

  // -------------------------------------------------------------------------
  // STAGE 3: GUIDED PRACTICE ATTEMPT
  // -------------------------------------------------------------------------
  const handlePracticeSubmitAttempt = async () => {
    if (!practiceSelectedOpt || !currentQuestion) return;
    try {
      const res = await fetch("/api/skills/code-comprehension", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "submit_bank_question_attempt",
          questionId: currentQuestion.id,
          selectedOptionId: practiceSelectedOpt,
          hintsUsed: unlockedHints,
          candidateId,
          tenantId,
        }),
      });
      const data = await res.json();
      setPracticeFeedback({
        isCorrect: data.isCorrect,
        explanation: data.explanation,
        scoreAwarded: data.scoreAwarded,
      });
      fetchProgression();
    } catch (err) {
      console.error(err);
    }
  };

  // -------------------------------------------------------------------------
  // STAGE 4: REPO EXPLORER ACTIONS
  // -------------------------------------------------------------------------
  const currentExplorerRepo = LEARNING_REPOSITORIES.find((r) => r.id === activeExplorerRepoId) || LEARNING_REPOSITORIES[0];

  useEffect(() => {
    const file = currentExplorerRepo.files[activeExplorerFile] || Object.values(currentExplorerRepo.files)[0];
    if (file) {
      setExplorerFileContent(file.content);
    }
  }, [activeExplorerRepoId, activeExplorerFile, currentExplorerRepo]);

  const handleRunSandboxTests = async () => {
    setRunningTests(true);
    try {
      const res = await fetch("/api/skills/code-comprehension", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "run_tests",
          challengeId: "bughunter-taskflow-rbac",
          candidateId,
          tenantId,
        }),
      });
      const data = await res.json();
      setTestOutput(data.report);
      fetchProgression();
    } catch (err) {
      console.error(err);
    } finally {
      setRunningTests(false);
    }
  };

  const handleSendTutorMessage = async () => {
    if (!tutorInput.trim()) return;
    const text = tutorInput;
    setTutorMessages((prev) => [...prev, { sender: "user", text }]);
    setTutorInput("");
    setTutorLoading(true);

    try {
      const res = await fetch("/api/skills/code-comprehension", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ask_tutor",
          question: text,
          codebaseId: activeExplorerRepoId,
          activeFile: activeExplorerFile,
          stagePersona: "repo_explorer",
        }),
      });
      const data = await res.json();
      if (data.tutorResponse) {
        setTutorMessages((prev) => [...prev, { sender: "tutor", text: data.tutorResponse.reply }]);
      }
    } catch (err) {
      setTutorMessages((prev) => [...prev, { sender: "tutor", text: "Error connecting to AI mentor. Please retry." }]);
    } finally {
      setTutorLoading(false);
    }
  };

  // -------------------------------------------------------------------------
  // STAGE 5: DYNAMIC UNSEEN REPOSITORY INTERVIEW SIMULATION
  // -------------------------------------------------------------------------
  const handleStartDynamicInterview = async () => {
    setInterviewLoading(true);
    setFinalReport(null);
    try {
      const res = await fetch("/api/skills/code-comprehension", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "start_dynamic_interview",
          targetRole: interviewRole,
          difficulty: interviewDifficulty,
          candidateId,
          tenantId,
        }),
      });
      const data = await res.json();
      if (data.success && data.session) {
        setActiveInterviewSession(data.session);
        fetchProgression();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInterviewLoading(false);
    }
  };

  const handleSendInterviewTurn = async () => {
    if (!interviewCandidateInput.trim() || !activeInterviewSession || interviewLoading) return;
    const text = interviewCandidateInput.trim();
    setInterviewCandidateInput("");
    setInterviewLoading(true);

    try {
      const res = await fetch("/api/skills/code-comprehension", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "process_dynamic_interview_turn",
          sessionId: activeInterviewSession.sessionId,
          candidateResponse: text,
          candidateId,
          tenantId,
        }),
      });
      const data = await res.json();
      if (data.success && data.replyMessage) {
        setActiveInterviewSession((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            messages: [...prev.messages, {
              id: `cand-${Date.now()}`,
              sender: "candidate",
              timestamp: new Date().toLocaleTimeString(),
              round: prev.currentRound,
              turnNumber: prev.currentTurn,
              content: text,
            }, data.replyMessage],
            currentRound: data.nextRound || prev.currentRound,
            isCompleted: data.isInterviewComplete || false,
          };
        });

        if (data.isInterviewComplete) {
          handleFinalizeInterview(activeInterviewSession.sessionId);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInterviewLoading(false);
    }
  };

  const handleFinalizeInterview = async (sessionId?: string) => {
    const targetSessionId = sessionId || activeInterviewSession?.sessionId;
    if (!targetSessionId) return;
    setInterviewLoading(true);

    try {
      const res = await fetch("/api/skills/code-comprehension", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "finalize_dynamic_interview",
          sessionId: targetSessionId,
          candidateId,
          tenantId,
        }),
      });
      const data = await res.json();
      if (data.success && data.report) {
        setFinalReport(data.report);
        fetchProgression();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setInterviewLoading(false);
    }
  };

  const selectedModule = FOUNDATIONAL_LEARNING_MODULES.find((m) => m.id === selectedModuleId) || FOUNDATIONAL_LEARNING_MODULES[0];
  const selectedLearnRepo = LEARNING_REPOSITORIES.find((r) => r.id === selectedLearnRepoId) || LEARNING_REPOSITORIES[0];
  const activeLesson = selectedModule.microLessons[activeMicroLessonIndex] || selectedModule.microLessons[0];

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#F6F5F1",
        color: "#17191C",
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      }}
    >
      {/* COGNALYZE UNIFIED NAVIGATION HEADER */}
      <AppNav role="student" />

      {/* COGNALYZE SUBHEADER RIBBON & 6-STAGE PIPELINE TABS */}
      <header
        style={{
          borderBottom: "1px solid #E4E1DA",
          backgroundColor: "#FFFFFF",
          padding: "14px 24px",
          position: "sticky",
          top: 56,
          zIndex: 30,
          boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        }}
      >
        <div style={{ maxWidth: 1440, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 14 }}>
          {/* Left Title & Subtext */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <Link
                  href="/student/skills"
                  style={{
                    fontSize: 12,
                    color: "#667085",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  ← Skill Practice Hub
                </Link>
                <span style={{ color: "#E4E1DA" }}>/</span>
                <span style={{ color: "#356AE6", fontSize: 12, fontWeight: 700 }}>Code Comprehension Lab</span>
              </div>
              <h1 style={{ fontSize: 18, fontWeight: 800, margin: 0, color: "#162A43", display: "flex", alignItems: "center", gap: 8, letterSpacing: "-0.02em" }}>
                <span>🔬</span>
                <span>Code Comprehension Lab</span>
                <span
                  style={{
                    fontSize: 11,
                    padding: "2px 8px",
                    borderRadius: 6,
                    background: "#EFF4FE",
                    color: "#356AE6",
                    border: "1px solid #D2E0FB",
                    fontWeight: 700,
                  }}
                >
                  Multi-Repo Intelligence
                </span>
              </h1>
              <p style={{ margin: "2px 0 0", fontSize: 11, color: "#667085" }}>
                120+ Practice Exercises · Unseen Repository Interview Pool · 10-Competency Defense
              </p>
            </div>
          </div>

          {/* 6-Stage Learning Pipeline Ribbon */}
          <div
            style={{
              display: "flex",
              background: "#F6F5F1",
              padding: 3,
              borderRadius: 8,
              border: "1px solid #E4E1DA",
              gap: 2,
              overflowX: "auto",
            }}
          >
            {[
              { num: 1, label: "Foundations", sub: "Multi-Repo" },
              { num: 2, label: "Visual Dry Run", sub: "6 Layers" },
              { num: 3, label: "Guided Practice", sub: "120+ Bank" },
              { num: 4, label: "Repo Explorer", sub: "IDE & Fix" },
              { num: 5, label: "Interview Sim", sub: "Unseen Repos" },
              { num: 6, label: "Progress & DNA", sub: "Scorecard" },
            ].map((st) => {
              const isActive = pipelineStage === st.num;
              const isCompleted =
                (st.num === 1 && progress?.stage1?.isStageComplete) ||
                (st.num === 2 && progress?.stage2?.isStageComplete) ||
                (st.num === 3 && progress?.stage3?.isStageComplete) ||
                (st.num === 4 && progress?.stage4?.isStageComplete) ||
                (st.num === 5 && progress?.stage5?.isStageComplete);

              return (
                <button
                  key={st.num}
                  onClick={() => setPipelineStage(st.num)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "6px 12px",
                    borderRadius: 6,
                    border: "none",
                    background: isActive ? "#162A43" : isCompleted ? "#EAF4EE" : "transparent",
                    color: isActive ? "#FFFFFF" : isCompleted ? "#2E7D5B" : "#667085",
                    fontSize: 11,
                    fontWeight: isActive ? 700 : 600,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    whiteSpace: "nowrap",
                  }}
                >
                  <span
                    style={{
                      width: 18,
                      height: 18,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 10,
                      fontWeight: 800,
                      background: isActive ? "#FFFFFF" : isCompleted ? "#2E7D5B" : "#E4E1DA",
                      color: isActive ? "#162A43" : isCompleted ? "#FFFFFF" : "#667085",
                    }}
                  >
                    {isCompleted ? "✓" : st.num}
                  </span>
                  <span>{st.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main style={{ maxWidth: 1440, margin: "0 auto", padding: "24px 24px 60px" }}>
        {/* ========================================================================= */}
        {/* STAGE 1: ENGINEERING FOUNDATIONS (MULTI-REPOSITORY) */}
        {/* ========================================================================= */}
        {pipelineStage === 1 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Stage Banner Card */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E4E1DA",
                borderRadius: 10,
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#356AE6",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  STAGE 1 · ENGINEERING FOUNDATIONS
                </span>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#162A43", margin: "2px 0 0" }}>
                  Explore Architecture &amp; Invariants Across Multiple Stacks
                </h2>
                <p style={{ fontSize: 12, color: "#667085", margin: "3px 0 0" }}>
                  Select any production repository to analyze its entry point, layered architecture, data flow, and error-handling patterns.
                </p>
              </div>

              {/* Repository Selector Dropdown */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#FAF9F6",
                  padding: "6px 12px",
                  borderRadius: 8,
                  border: "1px solid #E4E1DA",
                }}
              >
                <span style={{ fontSize: 11, color: "#667085", fontWeight: 700 }}>Repository:</span>
                <select
                  value={selectedLearnRepoId}
                  onChange={(e) => setSelectedLearnRepoId(e.target.value)}
                  style={{
                    background: "transparent",
                    color: "#162A43",
                    border: "none",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    outline: "none",
                  }}
                >
                  {LEARNING_REPOSITORIES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title} ({r.primaryLanguage})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Selected Repository Card Overview */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E4E1DA",
                borderRadius: 10,
                padding: 20,
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              {/* Repo Details Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, borderBottom: "1px solid #E4E1DA", paddingBottom: 14 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#162A43", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                    {selectedLearnRepo.title}
                    <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#FAF9F6", color: "#667085", border: "1px solid #E4E1DA", textTransform: "uppercase", fontWeight: 700 }}>
                      {selectedLearnRepo.category}
                    </span>
                  </h3>
                  <p style={{ fontSize: 12, color: "#667085", margin: "4px 0 0", maxWidth: 880 }}>
                    {selectedLearnRepo.summary}
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, background: "#EFF4FE", color: "#356AE6", border: "1px solid #D2E0FB", fontWeight: 700 }}>
                    Entry: {selectedLearnRepo.entryPoint}
                  </span>
                  <span style={{ fontSize: 11, padding: "4px 10px", borderRadius: 6, background: "#FAF9F6", color: "#162A43", border: "1px solid #E4E1DA", fontWeight: 700 }}>
                    Stack: {selectedLearnRepo.framework}
                  </span>
                </div>
              </div>

              {/* Architectural Nodes Grid */}
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10 }}>
                  ARCHITECTURAL COMPONENTS &amp; TRUST BOUNDARIES
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 10 }}>
                  {selectedLearnRepo.architecture.nodes.map((node) => (
                    <div
                      key={node.id}
                      style={{
                        padding: "12px 14px",
                        borderRadius: 8,
                        background: "#FAF9F6",
                        border: "1px solid #E4E1DA",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#162A43" }}>{node.name}</span>
                        <span style={{ fontSize: 9, textTransform: "uppercase", padding: "2px 6px", borderRadius: 4, background: "#FFFFFF", color: "#667085", border: "1px solid #E4E1DA", fontWeight: 700 }}>
                          {node.type}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: "#667085", margin: "0 0 6px 0", lineHeight: 1.4 }}>{node.description}</p>
                      {node.filePath && <div style={{ fontSize: 10, color: "#356AE6", fontFamily: "monospace" }}>📄 {node.filePath}</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Micro-Learning Modules Tabs (Row of 4 Module Buttons) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 8 }}>
              {FOUNDATIONAL_LEARNING_MODULES.map((m) => {
                const isSelected = selectedModuleId === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => {
                      setSelectedModuleId(m.id);
                      setActiveMicroLessonIndex(0);
                    }}
                    style={{
                      padding: "12px 14px",
                      borderRadius: 8,
                      border: isSelected ? "1px solid #162A43" : "1px solid #E4E1DA",
                      background: isSelected ? "#162A43" : "#FFFFFF",
                      color: isSelected ? "#FFFFFF" : "#17191C",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                    }}
                  >
                    <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: isSelected ? "#93C5FD" : "#667085" }}>
                      Module {m.order}
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 700, marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {m.title}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Split Screen: Left (Micro-Lesson Screen) vs Right (Interactive Checkpoint) */}
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
              {/* Left: Active Micro-Lesson Screen */}
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: 10,
                  padding: 20,
                  border: "1px solid #E4E1DA",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                {/* Micro-Lesson Navigation Bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E4E1DA", paddingBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", textTransform: "uppercase" }}>
                      Lesson {activeLesson.order} / {selectedModule.microLessons.length}
                    </span>
                    <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#EFF4FE", color: "#356AE6", border: "1px solid #D2E0FB", fontWeight: 700 }}>
                      {activeLesson.conceptTag}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {selectedModule.microLessons.map((l, idx) => (
                      <button
                        key={l.id}
                        onClick={() => setActiveMicroLessonIndex(idx)}
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 4,
                          border: "none",
                          background: activeMicroLessonIndex === idx ? "#356AE6" : "#F6F5F1",
                          color: activeMicroLessonIndex === idx ? "#FFFFFF" : "#667085",
                          fontSize: 10,
                          fontWeight: 800,
                          cursor: "pointer",
                        }}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: "#162A43", margin: "0 0 6px 0" }}>
                    {activeLesson.title}
                  </h3>
                  <p style={{ fontSize: 12, color: "#17191C", lineHeight: 1.6, margin: 0 }}>
                    {activeLesson.biteExplanation}
                  </p>
                </div>

                {/* Personal AI Teacher Spoken Walkthrough Bar */}
                <div style={{ background: "#EFF4FE", border: "1px solid #D2E0FB", borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{ fontSize: 13 }}>👨‍🏫</span>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#162A43", textTransform: "uppercase" }}>
                        Alex AI Mentor · Interactive Teaching
                      </span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {!isSpeaking ? (
                        <button
                          onClick={() => narrateFoundationsLesson(activeLesson)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 5,
                            padding: "4px 10px",
                            borderRadius: 6,
                            background: "#356AE6",
                            color: "#FFFFFF",
                            border: "none",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          <span>🎓 Teach This Lesson</span>
                        </button>
                      ) : (
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            onClick={isPaused ? resumeSpeech : pauseSpeech}
                            style={{
                              padding: "4px 8px",
                              borderRadius: 4,
                              background: isPaused ? "#356AE6" : "#FEF7ED",
                              color: isPaused ? "#FFFFFF" : "#B7791F",
                              border: isPaused ? "none" : "1px solid #F8D8A7",
                              fontSize: 10,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            {isPaused ? "▶ Resume" : "❚❚ Pause"}
                          </button>
                          <button
                            onClick={stopSpeech}
                            style={{
                              padding: "4px 8px",
                              borderRadius: 4,
                              background: "#FFFFFF",
                              border: "1px solid #E4E1DA",
                              color: "#667085",
                              fontSize: 10,
                              fontWeight: 700,
                              cursor: "pointer",
                            }}
                          >
                            ⏹ Stop
                          </button>
                        </div>
                      )}
                      <div style={{ display: "flex", alignItems: "center", gap: 2, background: "#FFFFFF", border: "1px solid #D2E0FB", borderRadius: 4, padding: "1px 4px", fontSize: 10 }}>
                        <span style={{ color: "#667085" }}>Speed:</span>
                        {[0.85, 1.0, 1.25].map((rate) => (
                          <button
                            key={rate}
                            onClick={() => setSpeechRate(rate)}
                            style={{
                              border: "none",
                              background: speechRate === rate ? "#356AE6" : "transparent",
                              color: speechRate === rate ? "#FFFFFF" : "#667085",
                              borderRadius: 3,
                              fontSize: 9,
                              fontWeight: 700,
                              cursor: "pointer",
                              padding: "1px 4px",
                            }}
                          >
                            {rate}x
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Everyday Analogy Banner */}
                  <div style={{ fontSize: 11, color: "#162A43", lineHeight: 1.5, background: "#FFFFFF", padding: "8px 10px", borderRadius: 6, border: "1px solid #D2E0FB" }}>
                    <strong style={{ color: "#356AE6" }}>💡 Real-World Analogy: </strong>
                    {activeLesson.analogy || "Think of this like an index in a reference textbook: you jump to the funnel rather than reading every line."}
                  </div>

                  {/* Quick Inquiry Pills */}
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button
                      onClick={() => speakText(`Here is a simpler explanation: ${activeLesson.analogy || "Always trace from the entry funnel downwards."}`)}
                      style={{ padding: "3px 8px", borderRadius: 4, background: "#FFFFFF", border: "1px solid #D2E0FB", color: "#356AE6", fontSize: 10, fontWeight: 600, cursor: "pointer" }}
                    >
                      💡 Explain More Simply
                    </button>
                    <button
                      onClick={() => speakText(`In production engineering, this pattern prevents unauthorized data mutations and unhandled exceptions across microservices.`)}
                      style={{ padding: "3px 8px", borderRadius: 4, background: "#FFFFFF", border: "1px solid #D2E0FB", color: "#356AE6", fontSize: 10, fontWeight: 600, cursor: "pointer" }}
                    >
                      🏢 Production Significance
                    </button>
                  </div>
                </div>

                {/* Authentic Code Snippet */}
                <div
                  style={{
                    background: "#FAF9F6",
                    border: "1px solid #E4E1DA",
                    borderRadius: 8,
                    padding: 14,
                    fontFamily: "monospace",
                    fontSize: 11,
                    lineHeight: 1.5,
                    color: "#1E293B",
                    overflowX: "auto",
                  }}
                >
                  <pre style={{ margin: 0 }}>{activeLesson.codeSnippet}</pre>
                </div>
              </div>

              {/* Right: Immediate Interactive Checkpoint Exercise */}
              <div
                style={{
                  background: "#FFFFFF",
                  borderRadius: 10,
                  padding: 20,
                  border: "1px solid #E4E1DA",
                  display: "flex",
                  flexDirection: "column",
                  gap: 14,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ color: "#356AE6", fontSize: 14 }}>•</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", textTransform: "uppercase" }}>
                      INTERACTIVE CHECKPOINT
                    </span>
                  </div>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: "#FAF9F6", color: "#667085", border: "1px solid #E4E1DA", fontWeight: 700 }}>
                    Module Check
                  </span>
                </div>

                <div>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: "#162A43", margin: "0 0 6px 0" }}>
                    {activeLesson.exercise.prompt}
                  </h4>
                  <span style={{ fontSize: 9, textTransform: "uppercase", padding: "2px 6px", borderRadius: 4, background: "#EFF4FE", color: "#356AE6", border: "1px solid #D2E0FB", fontWeight: 700 }}>
                    {activeLesson.exercise.exerciseType}
                  </span>
                </div>

                {/* Options List */}
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {activeLesson.exercise.options.map((opt) => {
                    const isSelected = lessonSelections[activeLesson.id] === opt.id;
                    const fb = lessonFeedback[activeLesson.id];

                    return (
                      <button
                        key={opt.id}
                        onClick={() => handleMicroLessonSubmit(activeLesson, opt.id)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "10px 12px",
                          borderRadius: 7,
                          fontSize: 11,
                          lineHeight: 1.4,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                          background: isSelected
                            ? fb?.isCorrect
                              ? "#EAF4EE"
                              : "#FDF0F0"
                            : "#FAF9F6",
                          border: isSelected
                            ? fb?.isCorrect
                              ? "1px solid #2E7D5B"
                              : "1px solid #C24141"
                            : "1px solid #E4E1DA",
                          color: isSelected
                            ? fb?.isCorrect
                              ? "#2E7D5B"
                              : "#C24141"
                            : "#17191C",
                          fontWeight: isSelected ? 700 : 500,
                        }}
                      >
                        {opt.text}
                      </button>
                    );
                  })}
                </div>

                {/* Feedback Box */}
                {lessonFeedback[activeLesson.id] && (
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 7,
                      fontSize: 11,
                      lineHeight: 1.4,
                      background: lessonFeedback[activeLesson.id].isCorrect
                        ? "#EAF4EE"
                        : "#FDF0F0",
                      border: lessonFeedback[activeLesson.id].isCorrect
                        ? "1px solid #C8E4D3"
                        : "1px solid #F5C6C6",
                      color: lessonFeedback[activeLesson.id].isCorrect ? "#2E7D5B" : "#C24141",
                    }}
                  >
                    <strong>{lessonFeedback[activeLesson.id].isCorrect ? "✓ Verified: " : "⚠ Diagnostic: "}</strong>
                    {lessonFeedback[activeLesson.id].explanation}
                  </div>
                )}

                {/* Progressive Hints Toggle */}
                {activeLesson.exercise.hints?.length > 0 && (
                  <div>
                    <button
                      onClick={() => setRevealedHints((prev) => ({ ...prev, [activeLesson.id]: !prev[activeLesson.id] }))}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#356AE6",
                        fontSize: 11,
                        cursor: "pointer",
                        padding: 0,
                        fontWeight: 600,
                      }}
                    >
                      {revealedHints[activeLesson.id] ? "Hide Hint" : "💡 Need a hint?"}
                    </button>
                    {revealedHints[activeLesson.id] && (
                      <div style={{ marginTop: 6, padding: "8px 10px", borderRadius: 6, background: "#FAF9F6", border: "1px solid #E4E1DA", color: "#667085", fontSize: 11 }}>
                        {activeLesson.exercise.hints[0]}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 2: VISUAL DRY RUN STUDIO (6 LAYERS & INTERACTION LOOP) */}
        {/* ========================================================================= */}
        {pipelineStage === 2 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Banner Card */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E4E1DA",
                borderRadius: 10,
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  STAGE 2 · VISUAL DRY RUN STUDIO
                </span>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#162A43", margin: "2px 0 0" }}>
                  Step-by-Step Code Execution &amp; Layer Transition Tracing
                </h2>
                <p style={{ fontSize: 12, color: "#667085", margin: "3px 0 0" }}>
                  Trace state mutations, stack frames, and data packet transitions across Client, Middleware, Controller, Service, Repository, and Database.
                </p>
              </div>

              {/* Mode & Workflow Selector */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#FAF9F6", padding: "6px 12px", borderRadius: 8, border: "1px solid #E4E1DA" }}>
                  <select
                    value={selectedWorkflowId}
                    onChange={(e) => {
                      setSelectedWorkflowId(e.target.value);
                      setCurrentFrameIndex(0);
                      setPredictionFeedback(null);
                    }}
                    style={{
                      background: "transparent",
                      color: "#162A43",
                      border: "none",
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: "pointer",
                      outline: "none",
                    }}
                  >
                    <option value="taskflow_create_task">Workflow: End-to-End Task Creation (6 Layers)</option>
                    <option value="taskflow_concurrency_conflict">Workflow: Optimistic Concurrency Conflict (Race Condition)</option>
                    <option value="taskflow_cross_tenant_rejection">Workflow: Multi-Tenant Boundary Enforcement</option>
                  </select>
                </div>

                {/* Pedagogical Mode Selector: I DO / WE DO / YOU DO */}
                <div style={{ display: "flex", background: "#F6F5F1", padding: 3, borderRadius: 8, border: "1px solid #E4E1DA", gap: 2 }}>
                  {(["I_DO", "WE_DO", "YOU_DO"] as PedagogicalMode[]).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setPedagogicalMode(mode)}
                      style={{
                        padding: "5px 10px",
                        borderRadius: 6,
                        border: "none",
                        background: pedagogicalMode === mode ? "#162A43" : "transparent",
                        color: pedagogicalMode === mode ? "#FFFFFF" : "#667085",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {mode.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ARCHITECTURAL FLOW VISUALIZER WITH MOVING DATA PACKET */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 18, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  ARCHITECTURAL LAYER FLOW &amp; DATA PACKET
                </span>
                <span style={{ fontSize: 11, color: "#356AE6", fontFamily: "monospace", fontWeight: 700 }}>
                  Packet: {currentFrame.componentName}
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
                {[
                  { id: "client", label: "Client HTTP", desc: "REST / JSON" },
                  { id: "middleware", label: "Middleware", desc: "JWT & Zod" },
                  { id: "controller", label: "Controller", desc: "HTTP Adapter" },
                  { id: "service", label: "Domain Service", desc: "Invariants" },
                  { id: "repository", label: "Repository", desc: "Tenant Scope" },
                  { id: "database", label: "Database Store", desc: "Persistence" },
                ].map((st) => {
                  const isActive = currentFrame.architectureStage === st.id;
                  return (
                    <div
                      key={st.id}
                      style={{
                        padding: 12,
                        borderRadius: 8,
                        textAlign: "center",
                        border: isActive ? "2px solid #356AE6" : "1px solid #E4E1DA",
                        background: isActive ? "#EFF4FE" : "#FAF9F6",
                        boxShadow: isActive ? "0 0 10px rgba(53, 106, 230, 0.15)" : "none",
                        transition: "all 0.15s ease",
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 700, color: isActive ? "#356AE6" : "#162A43" }}>{st.label}</div>
                      <div style={{ fontSize: 10, color: "#667085", marginTop: 2 }}>{st.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SHOW -> TELL -> ASK -> STUDENT DOES -> FEEDBACK INTERACTION LOOP */}
            <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 16 }}>
              {/* Left Column: Code Locus & Stack Inspection */}
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 20, display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#356AE6", textTransform: "uppercase" }}>
                      Step {currentFrame.stepIndex} of {currentFrame.totalSteps}: {currentFrame.componentName}
                    </span>
                    <h3 style={{ fontSize: 15, fontWeight: 800, color: "#162A43", margin: "2px 0 0" }}>{currentFrame.title}</h3>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <button
                      onClick={handleStepPrev}
                      disabled={currentFrameIndex === 0}
                      style={{
                        padding: "5px 10px",
                        borderRadius: 6,
                        background: currentFrameIndex === 0 ? "#F6F5F1" : "#FFFFFF",
                        border: "1px solid #E4E1DA",
                        color: currentFrameIndex === 0 ? "#98A2B3" : "#162A43",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: currentFrameIndex === 0 ? "not-allowed" : "pointer",
                      }}
                    >
                      ◀ Prev
                    </button>
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      style={{
                        padding: "5px 12px",
                        borderRadius: 6,
                        background: isPlaying ? "#FEF7ED" : "#356AE6",
                        border: isPlaying ? "1px solid #F8D8A7" : "none",
                        color: isPlaying ? "#B7791F" : "#FFFFFF",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {isPlaying ? "❚❚ Pause" : "▶ Auto-Trace"}
                    </button>
                    <button
                      onClick={handleStepNext}
                      disabled={currentFrameIndex === activeWorkflow.frames.length - 1}
                      style={{
                        padding: "5px 10px",
                        borderRadius: 6,
                        background: currentFrameIndex === activeWorkflow.frames.length - 1 ? "#F6F5F1" : "#FFFFFF",
                        border: "1px solid #E4E1DA",
                        color: currentFrameIndex === activeWorkflow.frames.length - 1 ? "#98A2B3" : "#162A43",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: currentFrameIndex === activeWorkflow.frames.length - 1 ? "not-allowed" : "pointer",
                      }}
                    >
                      Next ▶
                    </button>
                  </div>
                </div>

                {/* SHOW: Code Locus */}
                <div style={{ background: "#FAF9F6", borderRadius: 8, padding: 14, border: "1px solid #E4E1DA", fontFamily: "monospace", fontSize: 11, lineHeight: 1.5, color: "#1E293B" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: "#667085", fontSize: 10, borderBottom: "1px solid #E4E1DA", paddingBottom: 4 }}>
                    <span>📄 {currentFrame.filePath}:{currentFrame.lineStart}-{currentFrame.lineEnd}</span>
                    <span>fn: {currentFrame.functionName}()</span>
                  </div>
                  <pre style={{ margin: 0, overflowX: "auto" }}>{currentFrame.codeSnippet}</pre>
                </div>

                {/* TELL: Pedagogical Explanation */}
                <div style={{ background: "#EFF4FE", border: "1px solid #D2E0FB", borderRadius: 8, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: "#356AE6", textTransform: "uppercase" }}>
                      TELL · MENTOR EXPLANATION
                    </span>
                    <button
                      onClick={() => speakText(currentFrame.tellExplanation || currentFrame.description)}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "#356AE6",
                        fontSize: 11,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        fontWeight: 700,
                      }}
                    >
                      <span>🗣️ Listen</span>
                    </button>
                  </div>
                  <p style={{ fontSize: 11, color: "#162A43", margin: 0, lineHeight: 1.5 }}>
                    {currentFrame.tellExplanation || currentFrame.description}
                  </p>
                </div>

                {/* Scope Variables Snapshot */}
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#667085", textTransform: "uppercase", marginBottom: 6 }}>
                    LOCAL SCOPE VARIABLES
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, fontSize: 11, fontFamily: "monospace" }}>
                    {Object.entries(currentFrame.variables).map(([k, v]) => (
                      <div
                        key={k}
                        style={{
                          padding: "4px 8px",
                          borderRadius: 6,
                          background: v.mutated ? "#FEF7ED" : "#FAF9F6",
                          border: v.mutated ? "1px solid #F8D8A7" : "1px solid #E4E1DA",
                          color: v.mutated ? "#B7791F" : "#17191C",
                          fontWeight: v.mutated ? 700 : 500,
                        }}
                      >
                        <span style={{ color: "#667085" }}>{k}:</span> {v.value}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column: PERSONAL AI TEACHER WORKSPACE */}
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 20, display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                {/* Teacher Workspace Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E4E1DA", paddingBottom: 10, flexWrap: "wrap", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 13 }}>👨‍🏫</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "#162A43", textTransform: "uppercase" }}>
                      {pedagogicalMode === "I_DO"
                        ? "Alex: Teacher Demonstration"
                        : pedagogicalMode === "WE_DO"
                        ? "Collaborative Checkpoint (We Do)"
                        : "Independent Trace (You Do)"}
                    </span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#EFF4FE", color: "#356AE6", border: "1px solid #D2E0FB", fontWeight: 700 }}>
                      Level {teacherLevel} Engineering
                    </span>
                    <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "#FAF9F6", color: "#667085", border: "1px solid #E4E1DA", fontWeight: 700 }}>
                      Step {currentFrame.stepIndex} of {activeWorkflow.frames.length}
                    </span>
                  </div>
                </div>

                {/* Spoken Narration Controls Bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 8, padding: "6px 10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {!isSpeaking ? (
                      <button
                        onClick={() => narrateDryRunFrame(currentFrame, pedagogicalMode)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "4px 10px",
                          borderRadius: 6,
                          background: "#356AE6",
                          color: "#FFFFFF",
                          border: "none",
                          fontSize: 10,
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        <span>🗣️ {pedagogicalMode === "I_DO" ? "Demonstrate Step" : "Speak Checkpoint"}</span>
                      </button>
                    ) : (
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          onClick={isPaused ? resumeSpeech : pauseSpeech}
                          style={{
                            padding: "3px 8px",
                            borderRadius: 4,
                            background: isPaused ? "#356AE6" : "#FEF7ED",
                            color: isPaused ? "#FFFFFF" : "#B7791F",
                            border: isPaused ? "none" : "1px solid #F8D8A7",
                            fontSize: 10,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {isPaused ? "▶ Resume" : "❚❚ Pause"}
                        </button>
                        <button
                          onClick={stopSpeech}
                          style={{
                            padding: "3px 8px",
                            borderRadius: 4,
                            background: "#FFFFFF",
                            border: "1px solid #E4E1DA",
                            color: "#667085",
                            fontSize: 10,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          ⏹ Stop
                        </button>
                      </div>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 10 }}>
                    <span style={{ color: "#667085" }}>Speed:</span>
                    {[0.85, 1.0, 1.25].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => setSpeechRate(rate)}
                        style={{
                          border: "none",
                          background: speechRate === rate ? "#356AE6" : "transparent",
                          color: speechRate === rate ? "#FFFFFF" : "#667085",
                          borderRadius: 3,
                          fontSize: 9,
                          fontWeight: 700,
                          cursor: "pointer",
                          padding: "1px 4px",
                        }}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                </div>

                {/* MODE 1: I DO (TEACHER DEMONSTRATION) */}
                {pedagogicalMode === "I_DO" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: "#356AE6", textTransform: "uppercase", marginBottom: 4 }}>
                        Architectural Invariant Walkthrough
                      </div>
                      <div style={{ fontSize: 12, color: "#17191C", lineHeight: 1.5 }}>
                        <MarkdownRenderer content={currentFrame.tellExplanation} compact />
                      </div>
                    </div>

                    <div style={{ background: "#EFF4FE", border: "1px solid #D2E0FB", borderRadius: 8, padding: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#356AE6", textTransform: "uppercase", marginBottom: 2 }}>
                        🏢 Production Significance
                      </div>
                      <div style={{ fontSize: 11, color: "#162A43", lineHeight: 1.4 }}>
                        {currentFrame.whyThisQuestionMatters}
                      </div>
                    </div>

                    <div style={{ background: "#FEF7ED", border: "1px solid #F8D8A7", borderRadius: 8, padding: 10 }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: "#B7791F", textTransform: "uppercase", marginBottom: 2 }}>
                        ⚙️ Low-Level Runtime Internals
                      </div>
                      <div style={{ fontSize: 11, color: "#17191C", lineHeight: 1.4 }}>
                        {currentFrame.internalDeepDive}
                      </div>
                    </div>

                    {/* Quick Inquiry Buttons */}
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      <button
                        onClick={() => handleTeacherQuickExplain("simpler_explanation")}
                        style={{ padding: "4px 8px", borderRadius: 4, background: "#FFFFFF", border: "1px solid #E4E1DA", color: "#356AE6", fontSize: 10, fontWeight: 700, cursor: "pointer" }}
                      >
                        💡 Simpler Analogy
                      </button>
                      <button
                        onClick={() => handleTeacherQuickExplain("give_example")}
                        style={{ padding: "4px 8px", borderRadius: 4, background: "#FFFFFF", border: "1px solid #E4E1DA", color: "#356AE6", fontSize: 10, fontWeight: 700, cursor: "pointer" }}
                      >
                        🏢 Production Example
                      </button>
                      <button
                        onClick={() => handleTeacherQuickExplain("internal_deep_dive")}
                        style={{ padding: "4px 8px", borderRadius: 4, background: "#FFFFFF", border: "1px solid #E4E1DA", color: "#356AE6", fontSize: 10, fontWeight: 700, cursor: "pointer" }}
                      >
                        ⚙️ System Internals
                      </button>
                      <button
                        onClick={() => handleTeacherQuickExplain("why_this_matters")}
                        style={{ padding: "4px 8px", borderRadius: 4, background: "#FFFFFF", border: "1px solid #E4E1DA", color: "#356AE6", fontSize: 10, fontWeight: 700, cursor: "pointer" }}
                      >
                        ❓ Why Here?
                      </button>
                    </div>
                  </div>
                )}

                {/* MODE 2: WE DO (COLLABORATIVE CHECKPOINT & TEACHING CONVERSATION) */}
                {pedagogicalMode === "WE_DO" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {/* Teacher Question Box */}
                    <div style={{ background: "#EFF4FE", border: "1px solid #356AE6", borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: "#356AE6", textTransform: "uppercase", marginBottom: 4 }}>
                        🎯 Alex's Checkpoint Question
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#162A43", lineHeight: 1.5 }}>
                        {currentFrame.askQuestion}
                      </div>
                    </div>

                    {/* Dialogue Desk */}
                    {teacherDeskDialogue.length > 0 && (
                      <div style={{ background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 8, padding: 10, maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                        {teacherDeskDialogue.map((msg, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: "6px 10px",
                              borderRadius: 6,
                              fontSize: 11,
                              background: msg.sender === "alex" ? "#EFF4FE" : "#FFFFFF",
                              border: msg.sender === "alex" ? "1px solid #D2E0FB" : "1px solid #E4E1DA",
                              color: "#17191C",
                            }}
                          >
                            <div style={{ fontSize: 9, fontWeight: 800, color: msg.sender === "alex" ? "#356AE6" : "#162A43", marginBottom: 2 }}>
                              {msg.sender === "alex" ? "Alex AI Mentor" : "Your Reasoning"}
                            </div>
                            <MarkdownRenderer content={msg.text} compact />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Free-Form Reasoning (Typed or Voice) */}
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#667085" }}>
                          Explain in your own words (or select prediction below):
                        </span>
                        <button
                          onClick={() => handleVoiceListen((spoken) => handleVoiceCommandOrInterrupt(spoken))}
                          style={{
                            padding: "3px 8px",
                            borderRadius: 4,
                            background: isListening ? "#FEF7ED" : "#FFFFFF",
                            border: isListening ? "1px solid #F8D8A7" : "1px solid #E4E1DA",
                            color: isListening ? "#B7791F" : "#356AE6",
                            fontSize: 10,
                            fontWeight: 700,
                            cursor: "pointer",
                          }}
                        >
                          {isListening ? "🔴 Listening..." : "🎤 Speak Answer"}
                        </button>
                      </div>
                      <textarea
                        value={freeFormAnswerInput}
                        onChange={(e) => setFreeFormAnswerInput(e.target.value)}
                        placeholder="e.g. The organizationId must be pulled from the verified JWT token claims, never the request body..."
                        rows={2}
                        style={{
                          background: "#FFFFFF",
                          border: "1px solid #E4E1DA",
                          borderRadius: 8,
                          padding: 8,
                          fontSize: 11,
                          color: "#17191C",
                          outline: "none",
                          fontFamily: "inherit",
                          resize: "none",
                        }}
                      />
                      <button
                        onClick={() => handleFreeFormAnswerSubmit()}
                        disabled={freeFormEvaluating || !freeFormAnswerInput.trim()}
                        style={{
                          padding: "6px 12px",
                          borderRadius: 6,
                          background: "#356AE6",
                          color: "#FFFFFF",
                          border: "none",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: freeFormEvaluating || !freeFormAnswerInput.trim() ? "not-allowed" : "pointer",
                          opacity: freeFormEvaluating || !freeFormAnswerInput.trim() ? 0.6 : 1,
                        }}
                      >
                        {freeFormEvaluating ? "Evaluating with Alex..." : "Submit Reasoning"}
                      </button>
                    </div>

                    {/* Free-Form Evaluation Diagnostic Banner */}
                    {freeFormResult && (
                      <div
                        style={{
                          padding: 10,
                          borderRadius: 6,
                          background: freeFormResult.isCorrect ? "#EAF4EE" : "#FDF0F0",
                          border: freeFormResult.isCorrect ? "1px solid #C8E4D3" : "1px solid #F5C6C6",
                          color: freeFormResult.isCorrect ? "#2E7D5B" : "#C24141",
                          fontSize: 11,
                        }}
                      >
                        <strong>{freeFormResult.isCorrect ? "✓ Alex Confirms:" : "⚠ Alex's Diagnostic:"}</strong> {freeFormResult.correctionExplanation}
                      </div>
                    )}

                    {/* Multiple-Choice Prediction Checkpoint */}
                    {currentFrame.prediction && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, borderTop: "1px solid #E4E1DA", paddingTop: 10 }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: "#667085" }}>
                          Or choose the matching execution invariant:
                        </div>
                        {currentFrame.prediction.options.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => setPredictionSelectedOpt(opt.id)}
                            style={{
                              padding: "8px 10px",
                              borderRadius: 6,
                              textAlign: "left",
                              background: predictionSelectedOpt === opt.id ? "#EFF4FE" : "#FAF9F6",
                              border: predictionSelectedOpt === opt.id ? "1px solid #356AE6" : "1px solid #E4E1DA",
                              color: predictionSelectedOpt === opt.id ? "#356AE6" : "#17191C",
                              fontSize: 11,
                              cursor: "pointer",
                              fontWeight: predictionSelectedOpt === opt.id ? 700 : 500,
                            }}
                          >
                            <strong>{opt.id.toUpperCase()}.</strong> {opt.text}
                          </button>
                        ))}
                        <button
                          onClick={handlePredictionSubmit}
                          disabled={!predictionSelectedOpt}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 6,
                            background: "#356AE6",
                            color: "#FFFFFF",
                            border: "none",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: !predictionSelectedOpt ? "not-allowed" : "pointer",
                            opacity: !predictionSelectedOpt ? 0.6 : 1,
                          }}
                        >
                          Confirm Checkpoint
                        </button>
                      </div>
                    )}

                    {/* Prediction Feedback */}
                    {predictionFeedback && (
                      <div
                        style={{
                          padding: 10,
                          borderRadius: 6,
                          background: predictionFeedback.isCorrect ? "#EAF4EE" : "#FDF0F0",
                          border: predictionFeedback.isCorrect ? "1px solid #C8E4D3" : "1px solid #F5C6C6",
                          color: predictionFeedback.isCorrect ? "#2E7D5B" : "#C24141",
                          fontSize: 11,
                        }}
                      >
                        <strong>{predictionFeedback.isCorrect ? "✓ Correct!" : "⚠ Review:"}</strong> {predictionFeedback.explanation}
                      </div>
                    )}
                  </div>
                )}

                {/* MODE 3: YOU DO (INDEPENDENT ENGINEERING) */}
                {pedagogicalMode === "YOU_DO" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ background: "#FEF7ED", border: "1px solid #F8D8A7", borderRadius: 8, padding: 12 }}>
                      <div style={{ fontSize: 10, fontWeight: 800, color: "#B7791F", textTransform: "uppercase", marginBottom: 4 }}>
                        🛡️ Independent Verification
                      </div>
                      <div style={{ fontSize: 11, color: "#162A43", lineHeight: 1.5 }}>
                        You are in You Do mode. Trace the execution path without mentor assistance. Formulate your reasoning and verify the state mutation before advancing.
                      </div>
                    </div>

                    {currentFrame.prediction && (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {currentFrame.prediction.options.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => setPredictionSelectedOpt(opt.id)}
                            style={{
                              padding: "8px 10px",
                              borderRadius: 6,
                              textAlign: "left",
                              background: predictionSelectedOpt === opt.id ? "#EFF4FE" : "#FAF9F6",
                              border: predictionSelectedOpt === opt.id ? "1px solid #356AE6" : "1px solid #E4E1DA",
                              color: predictionSelectedOpt === opt.id ? "#356AE6" : "#17191C",
                              fontSize: 11,
                              cursor: "pointer",
                              fontWeight: predictionSelectedOpt === opt.id ? 700 : 500,
                            }}
                          >
                            <strong>{opt.id.toUpperCase()}.</strong> {opt.text}
                          </button>
                        ))}
                        <button
                          onClick={handlePredictionSubmit}
                          disabled={!predictionSelectedOpt}
                          style={{
                            padding: "6px 12px",
                            borderRadius: 6,
                            background: "#356AE6",
                            color: "#FFFFFF",
                            border: "none",
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: !predictionSelectedOpt ? "not-allowed" : "pointer",
                            opacity: !predictionSelectedOpt ? 0.6 : 1,
                          }}
                        >
                          Submit Trace Verification
                        </button>
                      </div>
                    )}

                    {predictionFeedback && (
                      <div
                        style={{
                          padding: 10,
                          borderRadius: 6,
                          background: predictionFeedback.isCorrect ? "#EAF4EE" : "#FDF0F0",
                          border: predictionFeedback.isCorrect ? "1px solid #C8E4D3" : "1px solid #F5C6C6",
                          color: predictionFeedback.isCorrect ? "#2E7D5B" : "#C24141",
                          fontSize: 11,
                        }}
                      >
                        <strong>{predictionFeedback.isCorrect ? "✓ Verified!" : "⚠ Invariant Violation:"}</strong> {predictionFeedback.explanation}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 3: GUIDED PRACTICE (120+ QUESTION BANK) */}
        {/* ========================================================================= */}
        {pipelineStage === 3 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Banner Card */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E4E1DA",
                borderRadius: 10,
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  STAGE 3 · GUIDED PRACTICE
                </span>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#162A43", margin: "2px 0 0" }}>
                  Curated Production Engineering Question Bank (120+ Exercises)
                </h2>
                <p style={{ fontSize: 12, color: "#667085", margin: "3px 0 0" }}>
                  Solve verified multi-tier code comprehension challenges with progressive hint penalties and source-code traceability.
                </p>
              </div>

              {/* Search Bar */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#FAF9F6", padding: "6px 12px", borderRadius: 8, border: "1px solid #E4E1DA" }}>
                <span style={{ color: "#667085", fontSize: 12 }}>🔍</span>
                <input
                  type="text"
                  placeholder="Filter by concept, repo..."
                  value={practiceSearchQuery}
                  onChange={(e) => {
                    setPracticeSearchQuery(e.target.value);
                    setActiveQuestionIndex(0);
                  }}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "#17191C",
                    fontSize: 12,
                    outline: "none",
                    width: 180,
                  }}
                />
              </div>
            </div>

            {/* Filter Pills Bar */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setActiveQuestionIndex(0);
                }}
                style={{
                  background: "#FFFFFF",
                  color: "#162A43",
                  border: "1px solid #E4E1DA",
                  borderRadius: 6,
                  padding: "6px 10px",
                  fontSize: 11,
                  fontWeight: 700,
                  outline: "none",
                }}
              >
                <option value="all">All Categories ({COMPREHENSIVE_QUESTION_BANK.length})</option>
                <option value="code_comprehension">Code Comprehension</option>
                <option value="function_execution_tracing">Execution Tracing</option>
                <option value="variable_scope_and_lifecycle">Variable Scope</option>
                <option value="control_flow">Control Flow</option>
                <option value="data_flow">Data Flow</option>
                <option value="closures_and_async">Closures &amp; Async</option>
                <option value="react_hooks_and_state">React &amp; Next.js 15</option>
                <option value="api_request_lifecycle">API Request Lifecycle</option>
                <option value="auth_and_rbac">Auth &amp; RBAC</option>
                <option value="database_queries_and_transactions">Transactions &amp; ACID</option>
                <option value="sql_indexing_and_optimization">SQL &amp; Indexing</option>
                <option value="race_conditions">Race Conditions &amp; OCC</option>
                <option value="concurrency">Concurrency &amp; Locks</option>
                <option value="memory_management">Memory &amp; GC Leaks</option>
                <option value="error_handling">Error Boundaries</option>
                <option value="security_vulnerabilities">Security &amp; Injections</option>
                <option value="architecture_and_design_patterns">Architecture Patterns</option>
                <option value="performance_optimization">Performance</option>
                <option value="ai_ml_pipeline_comprehension">AI/ML Inference</option>
                <option value="rag_and_retrieval_workflows">RAG &amp; Vector Stores</option>
                <option value="llm_tool_calling">LLM Tool Calling Guardrails</option>
                <option value="production_system_reliability">System Reliability</option>
              </select>

              <select
                value={selectedDifficulty}
                onChange={(e) => {
                  setSelectedDifficulty(e.target.value);
                  setActiveQuestionIndex(0);
                }}
                style={{
                  background: "#FFFFFF",
                  color: "#356AE6",
                  border: "1px solid #E4E1DA",
                  borderRadius: 6,
                  padding: "6px 10px",
                  fontSize: 11,
                  fontWeight: 700,
                  outline: "none",
                }}
              >
                <option value="all">All Difficulties (L1–L6)</option>
                <option value="beginner">L1–L2 Beginner</option>
                <option value="intermediate">L3–L4 Intermediate</option>
                <option value="advanced">L4–L5 Advanced</option>
                <option value="expert">L6 Expert / Staff</option>
              </select>
            </div>

            {/* Question Workspace Layout */}
            {currentQuestion ? (
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16 }}>
                {/* Left: Code Snippet & Question Locus */}
                <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 20, display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <span style={{ fontSize: 10, fontWeight: 800, color: "#356AE6", textTransform: "uppercase" }}>
                        Question {activeQuestionIndex + 1} of {filteredQuestions.length}
                      </span>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: "#162A43", margin: "2px 0 0" }}>
                        {currentQuestion.title}
                      </h3>
                      <div style={{ display: "flex", gap: 6, marginTop: 4 }}>
                        <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#EFF4FE", color: "#356AE6", border: "1px solid #D2E0FB" }}>
                          📁 {currentQuestion.repositoryId}
                        </span>
                        <span style={{ fontSize: 10, padding: "2px 6px", borderRadius: 4, background: "#FEF7ED", color: "#B7791F", border: "1px solid #F8D8A7", textTransform: "uppercase", fontWeight: 700 }}>
                          {currentQuestion.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>

                  <p style={{ fontSize: 12, color: "#17191C", lineHeight: 1.5, margin: 0 }}>
                    {currentQuestion.prompt}
                  </p>

                  {/* Code Snippet Box */}
                  <div style={{ background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 8, padding: 14, fontFamily: "monospace", fontSize: 11, lineHeight: 1.5, color: "#1E293B" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, color: "#667085", fontSize: 10, borderBottom: "1px solid #E4E1DA", paddingBottom: 4 }}>
                      <span>📄 {currentQuestion.targetFile}:{currentQuestion.targetLineRange.start}-{currentQuestion.targetLineRange.end}</span>
                      <span>Concept: {currentQuestion.engineeringConcept}</span>
                    </div>
                    <pre style={{ margin: 0, overflowX: "auto" }}>{currentQuestion.codeSnippet}</pre>
                  </div>
                </div>

                {/* Right: Options & Progressive Hints */}
                <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 20, display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", textTransform: "uppercase" }}>
                    SELECT PRECISE ENGINEERING INVARIANT
                  </span>

                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {currentQuestion.options.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setPracticeSelectedOpt(opt.id)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "10px 12px",
                          borderRadius: 7,
                          fontSize: 11,
                          lineHeight: 1.4,
                          cursor: "pointer",
                          background: practiceSelectedOpt === opt.id ? "#EFF4FE" : "#FAF9F6",
                          border: practiceSelectedOpt === opt.id ? "1px solid #356AE6" : "1px solid #E4E1DA",
                          color: practiceSelectedOpt === opt.id ? "#356AE6" : "#17191C",
                          fontWeight: practiceSelectedOpt === opt.id ? 700 : 500,
                        }}
                      >
                        {opt.text}
                      </button>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={handlePracticeSubmitAttempt}
                      disabled={!practiceSelectedOpt}
                      style={{
                        flex: 1,
                        padding: "10px 16px",
                        borderRadius: 6,
                        background: practiceSelectedOpt ? "#356AE6" : "#E4E1DA",
                        color: practiceSelectedOpt ? "#FFFFFF" : "#667085",
                        border: "none",
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: practiceSelectedOpt ? "pointer" : "not-allowed",
                      }}
                    >
                      Verify Answer
                    </button>
                    <button
                      onClick={() => {
                        if (activeQuestionIndex < filteredQuestions.length - 1) {
                          setActiveQuestionIndex((prev) => prev + 1);
                          setPracticeSelectedOpt("");
                          setPracticeFeedback(null);
                          setUnlockedHints(0);
                        }
                      }}
                      style={{
                        padding: "10px 14px",
                        borderRadius: 6,
                        background: "#FFFFFF",
                        border: "1px solid #E4E1DA",
                        color: "#162A43",
                        fontSize: 11,
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      Next ▶
                    </button>
                  </div>

                  {practiceFeedback && (
                    <div
                      style={{
                        padding: 12,
                        borderRadius: 7,
                        fontSize: 11,
                        background: practiceFeedback.isCorrect ? "#EAF4EE" : "#FDF0F0",
                        border: practiceFeedback.isCorrect ? "1px solid #C8E4D3" : "1px solid #F5C6C6",
                        color: practiceFeedback.isCorrect ? "#2E7D5B" : "#C24141",
                      }}
                    >
                      <strong>{practiceFeedback.isCorrect ? "✓ Correct: " : "⚠ Diagnostic: "}</strong>
                      {practiceFeedback.explanation}
                    </div>
                  )}

                  {/* 4 Progressive Hint Tiers */}
                  {currentQuestion.hints?.length > 0 && (
                    <div style={{ marginTop: 8, borderTop: "1px solid #E4E1DA", paddingTop: 10 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "#667085", fontWeight: 700 }}>
                          Progressive Hints ({unlockedHints}/{currentQuestion.hints.length})
                        </span>
                        {unlockedHints < currentQuestion.hints.length && (
                          <button
                            onClick={() => setUnlockedHints((prev) => prev + 1)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#356AE6",
                              fontSize: 11,
                              cursor: "pointer",
                              fontWeight: 700,
                            }}
                          >
                            + Unlock Next Hint (-{currentQuestion.hints[unlockedHints]?.penaltyPercent || 5}% penalty)
                          </button>
                        )}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8 }}>
                        {currentQuestion.hints.slice(0, unlockedHints).map((h, i) => (
                          <div key={i} style={{ padding: "6px 10px", borderRadius: 6, background: "#FAF9F6", border: "1px solid #E4E1DA", color: "#162A43", fontSize: 11 }}>
                            <strong style={{ color: "#356AE6" }}>Tier {h.tier} ({h.title}): </strong>
                            {h.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#667085" }}>
                No questions match the current filters.
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 4: REPO EXPLORER (3-COLUMN IDE & LIVE SANDBOX TESTS) */}
        {/* ========================================================================= */}
        {pipelineStage === 4 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Banner Card */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E4E1DA",
                borderRadius: 10,
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  STAGE 4 · REPO EXPLORER &amp; SANDBOX IDE
                </span>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#162A43", margin: "2px 0 0" }}>
                  Multi-File Codebase Navigation, Live Mutation &amp; Test Runner
                </h2>
                <p style={{ fontSize: 12, color: "#667085", margin: "3px 0 0" }}>
                  Investigate authentic repository code, diagnose architectural flaws, and execute sandboxed test suites.
                </p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <select
                  value={activeExplorerRepoId}
                  onChange={(e) => {
                    setActiveExplorerRepoId(e.target.value);
                    const repo = LEARNING_REPOSITORIES.find((r) => r.id === e.target.value);
                    if (repo) setActiveExplorerFile(repo.entryPoint);
                  }}
                  style={{
                    background: "#FAF9F6",
                    color: "#162A43",
                    border: "1px solid #E4E1DA",
                    borderRadius: 7,
                    padding: "6px 12px",
                    fontSize: 12,
                    fontWeight: 700,
                    outline: "none",
                  }}
                >
                  {LEARNING_REPOSITORIES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </select>

                <button
                  onClick={handleRunSandboxTests}
                  disabled={runningTests}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 6,
                    background: runningTests ? "#E4E1DA" : "#356AE6",
                    color: runningTests ? "#667085" : "#FFFFFF",
                    border: "none",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: runningTests ? "not-allowed" : "pointer",
                  }}
                >
                  {runningTests ? "⏳ Running..." : "▶ Run Sandbox Tests"}
                </button>
              </div>
            </div>

            {/* 3-Column IDE Layout */}
            <div style={{ display: "grid", gridTemplateColumns: "240px 1fr 340px", gap: 14, minHeight: 520 }}>
              {/* Column 1: File Tree */}
              <div style={{ background: "#FAF9F6", border: "1px solid #E4E1DA", borderRadius: 8, padding: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", marginBottom: 8 }}>
                  Files ({Object.keys(currentExplorerRepo.files).length})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: 11, fontFamily: "monospace" }}>
                  {Object.values(currentExplorerRepo.files).map((f) => {
                    const isSelected = activeExplorerFile === f.path;
                    return (
                      <button
                        key={f.path}
                        onClick={() => setActiveExplorerFile(f.path)}
                        style={{
                          width: "100%",
                          textAlign: "left",
                          padding: "6px 8px",
                          borderRadius: 6,
                          background: isSelected ? "#EFF4FE" : "transparent",
                          border: isSelected ? "1px solid #D2E0FB" : "none",
                          color: isSelected ? "#356AE6" : "#667085",
                          fontWeight: isSelected ? 700 : 500,
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        📄 {f.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Column 2: Code Viewer & Editor */}
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 8, padding: 14, display: "flex", flexDirection: "column", gap: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E4E1DA", paddingBottom: 6 }}>
                  <span style={{ fontSize: 11, color: "#356AE6", fontFamily: "monospace", fontWeight: 700 }}>
                    {activeExplorerFile}
                  </span>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#667085",
                      fontSize: 11,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    {isEditing ? "👁️ View Mode" : "✏️ Edit Mode"}
                  </button>
                </div>
                <textarea
                  value={explorerFileContent}
                  onChange={(e) => setExplorerFileContent(e.target.value)}
                  readOnly={!isEditing}
                  style={{
                    flex: 1,
                    width: "100%",
                    background: "#FAF9F6",
                    border: "1px solid #E4E1DA",
                    borderRadius: 6,
                    padding: 10,
                    color: "#1E293B",
                    fontFamily: "monospace",
                    fontSize: 12,
                    lineHeight: 1.5,
                    resize: "none",
                    outline: "none",
                  }}
                />
              </div>

              {/* Column 3: Test Output Terminal & AI Mentor Chat */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {/* Test Output Terminal */}
                <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 8, padding: 12, flex: 1, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#667085", textTransform: "uppercase", marginBottom: 6 }}>
                    Sandbox Test Output
                  </div>
                  {testOutput ? (
                    <div style={{ fontSize: 11, fontFamily: "monospace", color: testOutput.passed ? "#2E7D5B" : "#C24141" }}>
                      <div>Status: {testOutput.passed ? "PASSED" : "FAILED"}</div>
                      <div>Passed: {testOutput.passedCount} / {testOutput.totalCount}</div>
                      <div style={{ marginTop: 6, color: "#667085" }}>{testOutput.summary}</div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 11, color: "#667085" }}>
                      Click &ldquo;Run Sandbox Tests&rdquo; to execute tests against this repository snapshot.
                    </div>
                  )}
                </div>

                {/* AI Mentor Interactive Chat */}
                <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 8, padding: 12, flex: 1.2, display: "flex", flexDirection: "column", gap: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#162A43", textTransform: "uppercase" }}>
                    👨‍🏫 Alex AI Mentor
                  </div>
                  <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6, maxHeight: 180 }}>
                    {tutorMessages.map((m, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: 11,
                          lineHeight: 1.4,
                          padding: "6px 8px",
                          borderRadius: 6,
                          background: m.sender === "user" ? "#FAF9F6" : "#EFF4FE",
                          color: m.sender === "user" ? "#17191C" : "#162A43",
                          border: m.sender === "user" ? "1px solid #E4E1DA" : "1px solid #D2E0FB",
                          alignSelf: m.sender === "user" ? "flex-end" : "flex-start",
                        }}
                      >
                        {m.text}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      type="text"
                      placeholder="Ask Alex about this code..."
                      value={tutorInput}
                      onChange={(e) => setTutorInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendTutorMessage()}
                      style={{
                        flex: 1,
                        background: "#FAF9F6",
                        border: "1px solid #E4E1DA",
                        borderRadius: 6,
                        padding: "6px 8px",
                        fontSize: 11,
                        color: "#17191C",
                        outline: "none",
                      }}
                    />
                    <button
                      onClick={handleSendTutorMessage}
                      disabled={tutorLoading}
                      style={{
                        padding: "6px 12px",
                        background: "#356AE6",
                        border: "none",
                        borderRadius: 6,
                        color: "#FFFFFF",
                        fontWeight: 700,
                        fontSize: 11,
                        cursor: "pointer",
                      }}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 5: INTERVIEW SIMULATION (STRICTLY UNSEEN REPOSITORIES) */}
        {/* ========================================================================= */}
        {pipelineStage === 5 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Banner Card */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E4E1DA",
                borderRadius: 10,
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  STAGE 5 · REAL INTERVIEW SIMULATION
                </span>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#162A43", margin: "2px 0 0" }}>
                  Senior Engineer Defense on Completely Unseen Repositories
                </h2>
                <p style={{ fontSize: 12, color: "#667085", margin: "3px 0 0" }}>
                  Multi-turn adaptive technical interview with Alex across 4 rounds: Architecture, Flow Tracing, Root-Cause Debugging, and System Design.
                </p>
              </div>

              {!activeInterviewSession ? (
                <button
                  onClick={handleStartDynamicInterview}
                  disabled={interviewLoading}
                  style={{
                    padding: "10px 20px",
                    borderRadius: 6,
                    background: "#356AE6",
                    color: "#FFFFFF",
                    border: "none",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: interviewLoading ? "not-allowed" : "pointer",
                  }}
                >
                  {interviewLoading ? "Selecting Unseen Repo..." : "Start Technical Interview with Alex"}
                </button>
              ) : (
                <button
                  onClick={() => handleFinalizeInterview()}
                  disabled={interviewLoading}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 6,
                    background: "#C24141",
                    color: "#FFFFFF",
                    border: "none",
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  Finalize &amp; Generate Evaluation
                </button>
              )}
            </div>

            {/* Active Interview Interface */}
            {activeInterviewSession ? (
              <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
                {/* Left: Chat Feed with Alex */}
                <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 20, display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #E4E1DA", paddingBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#356AE6" }}>
                        Round {activeInterviewSession.currentRound} / 4
                      </span>
                      <span style={{ fontSize: 11, color: "#667085" }}>
                        Repo: {activeInterviewSession.repository?.title || activeInterviewSession.sessionId} (Guaranteed Unseen)
                      </span>
                    </div>
                  </div>

                  {/* Messages Feed */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 320, maxHeight: 420, overflowY: "auto" }}>
                    {activeInterviewSession.messages.map((m) => (
                      <div
                        key={m.id}
                        style={{
                          padding: 12,
                          borderRadius: 8,
                          maxWidth: "85%",
                          alignSelf: m.sender === "candidate" ? "flex-end" : "flex-start",
                          background: m.sender === "candidate" ? "#FAF9F6" : "#EFF4FE",
                          border: m.sender === "candidate" ? "1px solid #E4E1DA" : "1px solid #D2E0FB",
                          color: "#17191C",
                          fontSize: 12,
                          lineHeight: 1.5,
                        }}
                      >
                        <div style={{ fontSize: 10, fontWeight: 700, color: m.sender === "candidate" ? "#162A43" : "#356AE6", marginBottom: 4 }}>
                          {m.sender === "candidate" ? "Candidate Defense" : "Alex (Staff Interviewer)"} · {m.timestamp}
                        </div>
                        <div>{m.content}</div>
                      </div>
                    ))}
                  </div>

                  {/* Input Box with Voice Support */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <textarea
                      placeholder="Explain the architectural boundaries, invariant checks, or root causes..."
                      value={interviewCandidateInput}
                      onChange={(e) => setInterviewCandidateInput(e.target.value)}
                      rows={2}
                      style={{
                        flex: 1,
                        background: "#FFFFFF",
                        border: "1px solid #E4E1DA",
                        borderRadius: 8,
                        padding: 10,
                        fontSize: 12,
                        color: "#17191C",
                        outline: "none",
                        resize: "none",
                      }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                      <button
                        onClick={handleSendInterviewTurn}
                        disabled={interviewLoading || !interviewCandidateInput.trim()}
                        style={{
                          padding: "10px 18px",
                          borderRadius: 6,
                          background: interviewCandidateInput.trim() ? "#356AE6" : "#E4E1DA",
                          color: interviewCandidateInput.trim() ? "#FFFFFF" : "#667085",
                          border: "none",
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: interviewCandidateInput.trim() ? "pointer" : "not-allowed",
                        }}
                      >
                        Send Turn
                      </button>
                      <button
                        onClick={() => handleVoiceListen((spoken) => setInterviewCandidateInput((prev) => (prev ? prev + " " + spoken : spoken)))}
                        style={{
                          padding: "6px",
                          borderRadius: 6,
                          background: isListening ? "#FEF7ED" : "#FAF9F6",
                          border: isListening ? "1px solid #F8D8A7" : "1px solid #E4E1DA",
                          color: isListening ? "#B7791F" : "#356AE6",
                          fontSize: 11,
                          cursor: "pointer",
                          fontWeight: 700,
                        }}
                        title="Dictate with Microphone"
                      >
                        🎤 Voice
                      </button>
                    </div>
                  </div>
                </div>

                {/* Right: Unseen Repo Context Card */}
                <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 20, display: "flex", flexDirection: "column", gap: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", textTransform: "uppercase" }}>
                    UNSEEN INTERVIEW REPOSITORY DOSSIER
                  </span>
                  <div style={{ fontSize: 12, color: "#667085", lineHeight: 1.5 }}>
                    This codebase was selected dynamically from the isolated interview pool because you have zero recorded exposure to it in Foundations, Visual Dry Run, or Guided Practice.
                  </div>
                  <div style={{ padding: 12, borderRadius: 8, background: "#FAF9F6", border: "1px solid #E4E1DA", fontSize: 11 }}>
                    <div style={{ color: "#162A43", fontWeight: 700 }}>Candidate Target Role:</div>
                    <div style={{ color: "#356AE6", marginTop: 2, fontWeight: 700 }}>{interviewRole.toUpperCase()}</div>
                    <div style={{ color: "#162A43", fontWeight: 700, marginTop: 8 }}>Evaluation Criteria:</div>
                    <div style={{ color: "#667085", marginTop: 2 }}>10 Competencies (Summing to 1.00 weight)</div>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "60px 0", color: "#667085" }}>
                Click &ldquo;Start Technical Interview with Alex&rdquo; to begin your defense session.
              </div>
            )}

            {/* Final Evaluation Report */}
            {finalReport && (
              <div style={{ background: "#FFFFFF", border: "1px solid #C8E4D3", borderRadius: 10, padding: 20, marginTop: 14, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: "#2E7D5B", margin: "0 0 10px 0" }}>
                  🎉 Interview Completed: Candidate Final Evaluation
                </h3>
                <div style={{ fontSize: 14, color: "#162A43", fontWeight: 700 }}>
                  Composite Score: {finalReport.overallScore} / 100 ({finalReport.recommendation})
                </div>
                <p style={{ fontSize: 12, color: "#667085", marginTop: 6 }}>
                  {finalReport.strengths?.[0] || "Evaluation completed successfully with verified competency metrics."}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* STAGE 6: PROGRESS & VERIFIED STUDENT DNA SCORECARD */}
        {/* ========================================================================= */}
        {pipelineStage === 6 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Banner Card */}
            <div
              style={{
                background: "#FFFFFF",
                border: "1px solid #E4E1DA",
                borderRadius: 10,
                padding: "16px 20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 12,
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
              }}
            >
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: "#356AE6", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  STAGE 6 · PROGRESS &amp; VERIFIED STUDENT DNA
                </span>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#162A43", margin: "2px 0 0" }}>
                  10-Competency Technical Scorecard &amp; Repository Exposure Trail
                </h2>
                <p style={{ fontSize: 12, color: "#667085", margin: "3px 0 0" }}>
                  Immutable telemetry and verified competency badges synchronized to candidate portfolio.
                </p>
              </div>
            </div>

            {/* Scorecard 3-Column Layout */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
              {/* Card 1: 10-Competency Breakdown */}
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 18, display: "flex", flexDirection: "column", gap: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                <h3 style={{ fontSize: 12, fontWeight: 800, color: "#162A43", textTransform: "uppercase", margin: 0 }}>
                  10 Core Competencies
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11 }}>
                  {[
                    { name: "Unfamiliar Codebase Navigation", weight: 0.12, score: 92 },
                    { name: "Execution-Flow Tracing", weight: 0.12, score: 88 },
                    { name: "Architecture & Layer Boundaries", weight: 0.10, score: 85 },
                    { name: "Atomic Concurrency & OCC", weight: 0.10, score: 90 },
                    { name: "Multi-Tenant Logical Isolation", weight: 0.10, score: 94 },
                    { name: "Scientific Root-Cause Debugging", weight: 0.12, score: 86 },
                    { name: "Production Incident Triage", weight: 0.08, score: 82 },
                    { name: "System Design Trade-Offs", weight: 0.10, score: 88 },
                    { name: "AI Output Trust Boundaries", weight: 0.08, score: 95 },
                    { name: "Engineering Defense Articulation", weight: 0.08, score: 89 },
                  ].map((c, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", borderRadius: 6, background: "#FAF9F6", border: "1px solid #E4E1DA" }}>
                      <span style={{ color: "#17191C" }}>{c.name}</span>
                      <span style={{ color: "#356AE6", fontWeight: 700 }}>{c.score}/100</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card 2: Repository Exposure History */}
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 18, display: "flex", flexDirection: "column", gap: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                <h3 style={{ fontSize: 12, fontWeight: 800, color: "#162A43", textTransform: "uppercase", margin: 0 }}>
                  Repository Exposure Trail
                </h3>
                <p style={{ fontSize: 11, color: "#667085", margin: 0 }}>
                  Tracks all codebases ever seen by this candidate to guarantee true unseen evaluation during hiring interviews.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11, fontFamily: "monospace" }}>
                  {exposedRepoIds.length > 0 ? (
                    exposedRepoIds.map((id) => (
                      <div key={id} style={{ padding: "6px 8px", borderRadius: 6, background: "#FAF9F6", border: "1px solid #E4E1DA", display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#17191C" }}>{id}</span>
                        <span style={{ color: "#B7791F", fontWeight: 700 }}>EXPOSED</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: "#667085", textAlign: "center", padding: "20px 0" }}>No exposed repos recorded yet.</div>
                  )}
                </div>
              </div>

              {/* Card 3: Verified Student DNA Badges */}
              <div style={{ background: "#FFFFFF", border: "1px solid #E4E1DA", borderRadius: 10, padding: 18, display: "flex", flexDirection: "column", gap: 10, boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                <h3 style={{ fontSize: 12, fontWeight: 800, color: "#162A43", textTransform: "uppercase", margin: 0 }}>
                  Verified Student DNA Badges
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11 }}>
                  {[
                    "Unfamiliar Codebase Orientation (Verified L5)",
                    "Execution-Flow Tracing (Verified L4)",
                    "Atomic Concurrency & OCC (Verified L5)",
                    "Multi-Tenant Logical Isolation (Verified L6)",
                    "Scientific Root-Cause Analysis (Verified L5)",
                    "AI Output Schema Guardrails (Verified L5)",
                  ].map((b, i) => (
                    <div key={i} style={{ padding: "6px 8px", borderRadius: 6, background: "#EAF4EE", border: "1px solid #C8E4D3", color: "#2E7D5B", display: "flex", alignItems: "center", gap: 6, fontWeight: 600 }}>
                      <span>✓</span>
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
