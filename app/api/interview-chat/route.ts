import { isTestRuntime } from "@/lib/env";
import { NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import {
  buildCandidateInterviewDossier,
  generateInterviewBlueprint,
  createAdvancedSessionState,
  assessCandidateAnswer,
  generateNextAdaptiveQuestion,
  assessAndGenerateAdaptiveTurn,
  generateOpeningGreeting,
  generateIntroductionTransition,
  stripThink,
  AdvancedSessionState,
  InterviewTurn,
  GeneratedQuestion,
  generateBlueprintFallbackQuestion,
  generateSectionTransition,
  isCandidateEarlyFinishRequest,
  determineFollowUpReason,
  InterviewSection,
  InterviewTrack,
  generateStructuredInterviewPlan
} from "@/lib/ai/interview-engine";
import {
  evaluateCandidateConduct,
  ConductState,
  ConductIncident,
  INSTITUTIONAL_CONDUCT_MESSAGES
} from "@/lib/interview/conduct-engine";
import {
  getActiveSessionState,
  getActiveSessionStateAsync,
  getActiveSessionForCandidate,
  saveActiveSessionState,
  saveActiveSessionStateAsync,
  isSessionCompleted,
  getSessionById
} from "@/lib/interview-session-store";
import { generateSecureId } from "@/lib/crypto-utils";
import {
  buildClaimLedgerFromText,
  ROHAN_VERMA_CLAIM_LEDGER,
  FULL_STACK_AI_PRODUCTS_JD,
  ClaimLedger,
} from "@/lib/interview/ground-truth-service";
import {
  validateQuestionGrounding,
  repairUngroundedQuestion,
} from "@/lib/interview/grounding-validator";
import {
  determineNextPhase,
  formatStageHeader,
  handleJunkInput,
  isJunkInput,
  isSemanticDuplicate,
  InterviewPhase,
} from "@/lib/interview/interview-state-machine";
import {
  detectUnlistedProject,
  CandidateDisclosedEntity,
} from "@/lib/interview/unlisted-project-detector";
import {
  handleHintRequest,
  InterviewExperienceMode,
  HintPreferenceLevel,
} from "@/lib/interview/interview-mode-service";
import {
  understandCandidateAnswer,
  decideNextInterviewAction,
  validateQuestionQuality,
  createAutonomousSessionMemory,
  StructuredEvaluationRecord,
  FollowUpDecision,
} from "@/lib/interview/autonomous-intelligence-engine";

function trimMessages(messages: Array<{ role: string; content: string }>, maxMessages = 12) {
  if (messages.length <= maxMessages) return messages;
  return [messages[0], ...messages.slice(-(maxMessages - 1))];
}

export async function POST(req: Request) {
  const t0 = Date.now();
  const correlationId = req.headers.get("x-correlation-id") || generateSecureId(`chat_${Date.now()}`, 7);

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const {
    messages = [],
    jd,
    resume,
    qNumber = 0,
    sessionId: reqSessionId,
    candidateId: reqCandidateId,
    durationMinutes = 45,
    experienceMode: reqExperienceMode,
    interviewType,
    interviewTrack: reqInterviewTrack,
    track: reqTrack,
    targetCompany,
    targetRole,
    skillsFocus,
    difficulty,
    feedbackMode,
    interviewMode: reqInterviewMode,
    hintPreference: reqHintPreference,
    action: reqAction,
  } = body;

  const effectiveTrack = reqTrack || reqInterviewTrack;

  // 1. Authenticate candidate with strict server-side validation
  const auth = await getAuthenticatedContext(req as any);
  if (!auth?.user?.id && !isTestRuntime()) {
    return NextResponse.json(
      { error: "Unauthorized. Please sign in to continue your interview." },
      { status: 401, headers: { "Cache-Control": "no-store, no-cache, must-revalidate, private" } }
    );
  }

  // Prevent cross-user leakage: if authenticated, candidateId MUST match auth.user.id
  if (auth?.user?.id && reqCandidateId && reqCandidateId !== auth.user.id) {
    return NextResponse.json({ error: "Access denied. Candidate identity mismatch." }, { status: 403 });
  }

  const candidateId = auth?.user?.id || (isTestRuntime() ? (reqCandidateId || body.studentId || "student-demo") : "");
  if (!candidateId) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const defaultJd = "Full-Stack Software Engineer (General SWE at FAANG level). Core skills: Algorithms, Data Structures, System Design, React/Next.js, Node.js/Python, and scalable cloud architecture.";
  const defaultResume = "Candidate Software Engineer applying for SWE roles. Experience in computer science, full-stack development, distributed systems, and collaborative engineering.";

  const effectiveJd = (jd && String(jd).trim().length > 0) ? jd : defaultJd;
  const effectiveResume = (resume && String(resume).trim().length > 0) ? resume : defaultResume;

  const sessionId = reqSessionId || generateSecureId(`sess_${candidateId}_${Date.now()}`, 7);

  if (isSessionCompleted(sessionId)) {
    return NextResponse.json(
      { error: "Interview session is completed. No further questions or answers can be accepted.", isCompleted: true },
      { status: 400 }
    );
  }

  // Cross-tenant security guard: check both in-memory live state and persisted session state
  const existingLive = getActiveSessionState(sessionId);
  if (existingLive && existingLive.candidateId && existingLive.candidateId !== candidateId) {
    return NextResponse.json({ error: "Access denied. Session belongs to another candidate." }, { status: 403 });
  }
  const existingPersisted = await getSessionById(sessionId);
  if (existingPersisted && existingPersisted.candidate_id && existingPersisted.candidate_id !== candidateId) {
    return NextResponse.json({ error: "Access denied. Session belongs to another candidate." }, { status: 403 });
  }

  try {
    // 2. Load or Initialize Advanced Session State
    let sessionState: AdvancedSessionState | null = getActiveSessionState(sessionId, candidateId);
    if (!sessionState) {
      sessionState = await getActiveSessionStateAsync(sessionId, candidateId);
    }

    // Behavioral Integrity Check: If session was terminated for conduct violations, reject immediately
    if (sessionState && sessionState.conductState === "TERMINATED") {
      return NextResponse.json(
        {
          error: "Interview session terminated due to professional conduct policy violations.",
          isCompleted: true,
          isTerminated: true,
          conductState: "TERMINATED",
          message: INSTITUTIONAL_CONDUCT_MESSAGES.TERMINATED
        },
        { status: 400 }
      );
    }

    // Reuse session-cached dossier if present to avoid repeated 200ms+ disk/evidence parsing
    let dossier = sessionState?.dossier;
    let dossierCacheHit = Boolean(dossier);

    if (!dossier) {
      dossier = await buildCandidateInterviewDossier(candidateId, effectiveResume, effectiveJd);
    }

    // Authoritative Ground Truth & Claim Ledger extraction
    const { claimLedger } = buildClaimLedgerFromText(candidateId, effectiveResume, effectiveJd);

    if (!sessionState) {
      const blueprint = generateInterviewBlueprint(
        dossier,
        targetRole || effectiveJd.split("\n")[0] || dossier.targetRole,
        Number(durationMinutes) || 45,
        reqExperienceMode || dossier.experienceMode,
        sessionId,
        effectiveJd,
        interviewType || "technical",
        targetCompany,
        skillsFocus,
        effectiveTrack
      );
      sessionState = createAdvancedSessionState(blueprint, dossier);
      (sessionState as any).interviewMode = reqInterviewMode || "practice";
      (sessionState as any).hintPreference = reqHintPreference || "subtle_hints";
      if (effectiveTrack) {
        sessionState.track = effectiveTrack;
      }
      if (difficulty && difficulty !== "adaptive") {
        sessionState.currentDifficulty = difficulty as any;
      }
    } else {
      if (reqInterviewMode) {
        (sessionState as any).interviewMode = reqInterviewMode;
      }
      if (reqHintPreference) {
        (sessionState as any).hintPreference = reqHintPreference;
      }
      if (!sessionState.dossier) {
        sessionState.dossier = dossier;
      }
      if (!sessionState.track && effectiveTrack) {
        sessionState.track = effectiveTrack;
      }
      if (!sessionState.interviewPlan && dossier) {
        sessionState.interviewPlan = sessionState.blueprint?.interviewPlan || generateStructuredInterviewPlan(
          dossier,
          sessionState.jdCompetencyMatrix || dossier.jdCompetencyMatrix,
          sessionState.candidateIntelligence || dossier.candidateIntelligence,
          sessionState.blueprint?.targetRole || dossier.targetRole,
          sessionState.blueprint?.durationMinutes || 45,
          sessionState.experienceMode || dossier.experienceMode
        );
      }
    }

    const userMessages = messages.filter((m: any) => m.role === "user");
    const assistantMessages = messages.filter((m: any) => m.role === "assistant");

    // 4. STEP 1: Kickoff Turn (0 user messages)
    if (userMessages.length === 0) {
      // Idempotency: If greeting already generated, return it without re-generating (React StrictMode / retries)
      if (sessionState.openingState === "AWAITING_CANDIDATE_INTRO" && sessionState.questionsAsked.length > 0) {
        const existingGreeting = sessionState.questionsAsked[0];
        return NextResponse.json({
          message: existingGreeting.question,
          questionTargets: existingGreeting.targets,
          section: existingGreeting.section,
          difficulty: "easy",
          isFollowUp: false,
          sessionId,
          turnIndex: 0,
          openingState: sessionState.openingState,
          conductState: sessionState.conductState || "NORMAL",
          meta: {
            correlationId,
            latencyMs: Date.now() - t0,
            dossierCacheHit,
          }
        });
      }

      // If session was already in progress (resumed session), do NOT restart greeting
      if (sessionState.openingState === "INTERVIEW_IN_PROGRESS" && sessionState.questionsAsked.length > 0) {
        const lastQ = sessionState.questionsAsked[sessionState.questionsAsked.length - 1];
        return NextResponse.json({
          message: lastQ.question,
          questionTargets: lastQ.targets,
          section: lastQ.section,
          difficulty: sessionState.currentDifficulty,
          isFollowUp: false,
          sessionId,
          turnIndex: sessionState.turns.length,
          openingState: sessionState.openingState,
          currentSection: sessionState.blueprint.currentSection,
          conductState: sessionState.conductState || "NORMAL",
          meta: {
            correlationId,
            latencyMs: Date.now() - t0,
            dossierCacheHit,
          }
        });
      }

      // Generate concise, professional opening greeting (warm, natural, < 45 words)
      const greetingQ = generateOpeningGreeting(dossier);
      sessionState.openingState = "AWAITING_CANDIDATE_INTRO";
      sessionState.questionsAsked.push({
        question: greetingQ.question,
        targets: greetingQ.question_targets,
        section: "introduction",
        competency: greetingQ.competency_targeted || "Background & Career Orientation",
        turnIndex: 0,
      });
      saveActiveSessionState(sessionId, sessionState);

      return NextResponse.json({
        message: greetingQ.question,
        questionTargets: greetingQ.question_targets,
        section: "introduction",
        difficulty: "easy",
        isFollowUp: false,
        sessionId,
        turnIndex: 0,
        openingState: "AWAITING_CANDIDATE_INTRO",
        conductState: sessionState.conductState || "NORMAL",
        meta: {
          correlationId,
          latencyMs: Date.now() - t0,
          dossierCacheHit,
        }
      });
    }

    const lastUserMsg = userMessages.length > 0 ? userMessages[userMessages.length - 1].content : "";
    const lastAssistantMsg = assistantMessages.length > 0 ? assistantMessages[assistantMessages.length - 1].content : "";

    // 4.2 INTERVIEW MODE & HINT REQUEST GATE
    const isHintAction = reqAction === "request_hint" || (
      Boolean(lastUserMsg) &&
      lastUserMsg.trim().length < 60 &&
      /\b(can (you|i) (get|have) a hint|any hints?|could you give me a hint|give me a hint|need a hint|little hint|give a hint|guide me|any guidance)\b/i.test(lastUserMsg.trim())
    );

    if (isHintAction && assistantMessages.length > 0) {
      const currentMode = (sessionState as any).interviewMode || "practice";
      const currentHintPref = (sessionState as any).hintPreference || "subtle_hints";
      const lastQ = sessionState.questionsAsked[sessionState.questionsAsked.length - 1];
      const hintDecision = handleHintRequest({
        interviewMode: currentMode,
        hintPreference: currentHintPref,
        currentQuestion: lastQ?.question || lastAssistantMsg,
        currentCompetency: lastQ?.competency,
        turnIndex: sessionState.turns.length + 1,
      });

      if (hintDecision.isAssisted) {
        sessionState.assistanceCount = (sessionState.assistanceCount || 0) + 1;
        (sessionState as any).pendingAssistance = {
          isAssisted: true,
          assistanceLevel: currentHintPref,
        };
      }

      await saveActiveSessionStateAsync(sessionId, sessionState);

      return NextResponse.json({
        message: hintDecision.responseMessage,
        questionTargets: hintDecision.isAllowed ? `Practice Guidance (${hintDecision.hintLevel})` : "Evaluation Policy Notice",
        section: sessionState.blueprint?.currentSection || "resume_projects",
        difficulty: sessionState.currentDifficulty,
        isFollowUp: false,
        isHint: hintDecision.isAllowed,
        hintLevel: hintDecision.hintLevel,
        interviewMode: currentMode,
        sessionId,
        turnIndex: sessionState.turns.length,
        openingState: sessionState.openingState,
        currentSection: sessionState.blueprint?.currentSection,
        conductState: sessionState.conductState || "NORMAL",
        meta: {
          correlationId,
          latencyMs: Date.now() - t0,
          dossierCacheHit,
        }
      });
    }

    // 4.3 JUNK INPUT & KEYBOARD MASH 2-STRIKE GUARD
    if (lastUserMsg && isJunkInput(lastUserMsg)) {
      const currentStrikes = (sessionState as any).junkStrikes || 0;
      const junkRes = handleJunkInput(lastUserMsg, currentStrikes);
      (sessionState as any).junkStrikes = junkRes.newStrikes;

      if (junkRes.isJunk && !junkRes.advanceTurn) {
        return NextResponse.json({
          message: junkRes.replyMessage,
          questionTargets: "Input Clarification",
          section: sessionState.blueprint?.currentSection || "resume_projects",
          difficulty: sessionState.currentDifficulty,
          isFollowUp: false,
          sessionId,
          turnIndex: sessionState.turns.length,
          openingState: sessionState.openingState,
          currentSection: sessionState.blueprint?.currentSection,
          conductState: sessionState.conductState || "NORMAL",
          isJunkWarning: true,
          phase: (sessionState as any).interviewPhase || "RESUME_DEEP_DIVE",
          stageHeader: formatStageHeader((sessionState as any).interviewPhase || "RESUME_DEEP_DIVE", sessionState.turns.length, 12),
          meta: { correlationId, latencyMs: Date.now() - t0, dossierCacheHit }
        });
      }
    }

    // 4.5 CONDUCT & INTEGRITY GATE (Milestone 2)
    // Multilingual backend-enforced evaluation (English, Hindi, Hinglish).
    // Distinguishes genuine misconduct from frustration, nervousness, uncertainty, or clarification.
    if (lastUserMsg) {
      const currentConductState = sessionState.conductState || "NORMAL";
      const currentTurnNumber = (sessionState.turns?.length || 0) + 1;
      const conductRes = evaluateCandidateConduct(lastUserMsg, currentConductState, currentTurnNumber);

      if (conductRes.isMisconduct && conductRes.shouldHaltTurn) {
        // Enforce deterministic state machine transition
        sessionState.conductState = conductRes.newState;
        if (!sessionState.conductIncidents) {
          sessionState.conductIncidents = [];
        }
        if (conductRes.incident) {
          sessionState.conductIncidents.push(conductRes.incident);
        }

        const isTerminated = conductRes.newState === "TERMINATED";
        if (isTerminated) {
          sessionState.isCompleted = true;
          sessionState.lifecycleState = "EARLY_TERMINATION";
        }

        const warningMsg = conductRes.interviewerMessage || INSTITUTIONAL_CONDUCT_MESSAGES.FIRST_WARNING;

        sessionState.questionsAsked.push({
          question: warningMsg,
          targets: "Professional Conduct Directive",
          section: sessionState.blueprint?.currentSection || "resume_projects",
          competency: "Professional Communication & Integrity",
          turnIndex: currentTurnNumber,
        });

        // Persist session state durability across reloads and multi-instance environments
        await saveActiveSessionStateAsync(sessionId, sessionState);

        return NextResponse.json({
          message: warningMsg,
          questionTargets: "Professional Conduct Directive",
          section: sessionState.blueprint?.currentSection || "resume_projects",
          difficulty: sessionState.currentDifficulty,
          isFollowUp: false,
          sessionId,
          turnIndex: sessionState.turns.length,
          openingState: sessionState.openingState,
          currentSection: sessionState.blueprint?.currentSection,
          conductState: conductRes.newState,
          isMisconduct: true,
          isWarning: conductRes.newState === "FIRST_WARNING" || conductRes.newState === "FINAL_WARNING",
          isTerminated,
          incident: conductRes.incident,
          meta: {
            correlationId,
            latencyMs: Date.now() - t0,
            dossierCacheHit,
          }
        });
      }
    }

    // 5. STEP 2 & 3: Candidate Introduction Received -> Acknowledge & Transition to Question 1
    if (sessionState.openingState === "AWAITING_CANDIDATE_INTRO") {
      const candidateIntro = (lastUserMsg || "").trim();
      sessionState.candidateIntroduction = candidateIntro || "Candidate provided introduction.";
      sessionState.openingState = "INTERVIEW_IN_PROGRESS";
      sessionState.blueprint.currentSection = "resume_projects";

      // Check if candidate verbally introduced a project absent from their submitted resume
      const introUnlisted = detectUnlistedProject(candidateIntro, dossier.projects);
      let combinedMessage = "";
      let questionTargets = "Project Ownership & Architecture";
      let difficultyLevel = "intermediate";

      if (introUnlisted.hasUnlistedProject && introUnlisted.unlistedProjectName) {
        const disclosedEntity: CandidateDisclosedEntity = {
          name: introUnlisted.unlistedProjectName,
          firstMentionedTurn: 1,
          provenance: "INTERVIEW-DISCLOSED",
          turnsExplored: 1,
        };
        (sessionState as any).disclosedEntities = [disclosedEntity];
        combinedMessage = `Thanks for the introduction! You mentioned ${introUnlisted.unlistedProjectName}, which sounds interesting. I noticed that this project isn't explicitly listed in the resume you submitted. Could you explain your involvement, your individual contributions, and the core technologies you used in ${introUnlisted.unlistedProjectName}?`;
        questionTargets = `Project Discrepancy & Verification: ${introUnlisted.unlistedProjectName}`;
      } else {
        // Brief personalized transition (1 sentence)
        const transition = generateIntroductionTransition(candidateIntro, dossier);

        // Generate Question 1 of actual interview grounded in dossier & candidate introduction
        const firstQ = await generateNextAdaptiveQuestion(sessionState, dossier, candidateIntro, null);
        firstQ.question = repairUngroundedQuestion(firstQ.question, claimLedger);
        combinedMessage = `${transition} ${firstQ.question}`;
        questionTargets = firstQ.question_targets;
        difficultyLevel = firstQ.difficulty_level;
      }

      (sessionState as any).interviewPhase = "RESUME_DEEP_DIVE";

      sessionState.questionsAsked.push({
        question: combinedMessage,
        targets: questionTargets,
        section: "resume_projects",
        competency: "Project Ownership & Architecture",
        turnIndex: 1,
      });

      saveActiveSessionState(sessionId, sessionState);

      const totalTargetTurns = sessionState.blueprint?.totalTargetTurns || 12;

      return NextResponse.json({
        message: combinedMessage,
        questionTargets,
        section: "resume_projects",
        difficulty: difficultyLevel,
        isFollowUp: false,
        sessionId,
        turnIndex: 1,
        openingState: "INTERVIEW_IN_PROGRESS",
        currentSection: sessionState.blueprint.currentSection,
        conductState: sessionState.conductState || "NORMAL",
        phase: "RESUME_DEEP_DIVE",
        stageHeader: formatStageHeader("RESUME_DEEP_DIVE", 1, totalTargetTurns),
        meta: {
          correlationId,
          latencyMs: Date.now() - t0,
          dossierCacheHit,
        }
      });
    }

    // 6. Live Turn: Evaluate candidate's latest substantive answer & generate next adaptive question
    if (lastUserMsg && lastAssistantMsg) {
      // Idempotency guard: If the exact last answer was already evaluated in the last turn (e.g. concurrent retry or double click)
      const lastRecordedTurn = sessionState.turns[sessionState.turns.length - 1];
      if (lastRecordedTurn && lastRecordedTurn.answer.trim() === lastUserMsg.trim()) {
        const lastQ = sessionState.questionsAsked[sessionState.questionsAsked.length - 1];
        return NextResponse.json({
          message: lastQ?.question || "Let's move forward.",
          questionTargets: lastQ?.targets || "Adaptive Evaluation",
          section: lastQ?.section || sessionState.blueprint.currentSection,
          difficulty: sessionState.currentDifficulty,
          isFollowUp: false,
          sessionId,
          turnIndex: sessionState.turns.length,
          assessment: lastRecordedTurn.assessment,
          rubricScore: lastRecordedTurn.rubricScore,
          modelAnswer: lastRecordedTurn.modelAnswerFeedback,
          duplicateIgnored: true,
          meta: {
            correlationId,
            latencyMs: Date.now() - t0,
            dossierCacheHit,
          }
        });
      }

      // Early Finish / Wrap-up Request Guard (Stage 7)
      if (isCandidateEarlyFinishRequest(lastUserMsg)) {
        sessionState.blueprint.currentSection = "closing";
        sessionState.lifecycleState = "READY_TO_FINISH";
        const closingMsg = "Understood! That covers our technical exploration today. Do you have any questions for me about our engineering stack, team architecture, or what we are building before we conclude?";

        sessionState.questionsAsked.push({
          question: closingMsg,
          targets: "Interview Conclusion & Wrap-up",
          section: "closing",
          competency: "Candidate Questions & Closing",
          turnIndex: sessionState.turns.length + 1,
        });

        saveActiveSessionState(sessionId, sessionState);

        return NextResponse.json({
          message: closingMsg,
          questionTargets: "Interview Conclusion & Wrap-up",
          section: "closing",
          difficulty: sessionState.currentDifficulty,
          isFollowUp: false,
          followUpReason: "none",
          sessionId,
          turnIndex: sessionState.turns.length,
          openingState: sessionState.openingState,
          currentSection: "closing",
          isClosing: true,
          meta: {
            correlationId,
            latencyMs: Date.now() - t0,
            dossierCacheHit,
          }
        });
      }

      // 6.2 UNLISTED PROJECT DISCREPANCY & PROVENANCE GATE
      // When candidate verbally introduces a project/system not present on the submitted resume
      const alreadyDisclosed: CandidateDisclosedEntity[] = (sessionState as any).disclosedEntities || [];
      const unlistedDetection = detectUnlistedProject(
        lastUserMsg,
        dossier.projects,
        alreadyDisclosed
      );

      if (unlistedDetection.hasUnlistedProject && unlistedDetection.unlistedProjectName) {
        const disclosedEntity: CandidateDisclosedEntity = {
          name: unlistedDetection.unlistedProjectName,
          firstMentionedTurn: sessionState.turns.length + 1,
          provenance: "INTERVIEW-DISCLOSED",
          turnsExplored: 1,
        };
        (sessionState as any).disclosedEntities = [...alreadyDisclosed, disclosedEntity];

        const acknowledgmentQuestion = unlistedDetection.turnQuestion ||
          `You mentioned ${unlistedDetection.unlistedProjectName}, which sounds interesting. I noticed that this project isn't explicitly listed in the resume you submitted. Could you explain your involvement, your individual contributions, and the core technologies you used in ${unlistedDetection.unlistedProjectName}?`;

        sessionState.questionsAsked.push({
          question: acknowledgmentQuestion,
          targets: `Project Discrepancy & Verification: ${unlistedDetection.unlistedProjectName}`,
          section: "resume_projects",
          competency: "Project Provenance & Ownership",
          turnIndex: sessionState.turns.length + 1,
        });

        sessionState.turns.push({
          turnIndex: sessionState.turns.length + 1,
          question: {
            question: lastAssistantMsg,
            question_targets: "Technical Exploration",
            question_type: "project-defense",
            difficulty_level: "medium",
            is_follow_up: false,
            section: sessionState.blueprint?.currentSection || "resume_projects",
          },
          answer: lastUserMsg,
          assessment: {
            answer_quality: "adequate",
            reasoning: `Candidate verbally introduced unlisted project '${unlistedDetection.unlistedProjectName}'. Formally requested clarification and individual contribution breakdown.`,
            topics_demonstrated: [unlistedDetection.unlistedProjectName],
            next_action: "follow_up_probe",
            difficulty_adjustment: "maintain",
            extracted_claims: [`Disclosed project: ${unlistedDetection.unlistedProjectName}`],
          },
          rubricScore: 70,
          timestamp: new Date().toISOString(),
        });

        await saveActiveSessionStateAsync(sessionId, sessionState);

        return NextResponse.json({
          message: acknowledgmentQuestion,
          questionTargets: `Project Discrepancy & Verification: ${unlistedDetection.unlistedProjectName}`,
          section: "resume_projects",
          difficulty: sessionState.currentDifficulty,
          isFollowUp: true,
          sessionId,
          turnIndex: sessionState.turns.length,
          openingState: sessionState.openingState,
          currentSection: "resume_projects",
          conductState: sessionState.conductState || "NORMAL",
          meta: {
            correlationId,
            latencyMs: Date.now() - t0,
            dossierCacheHit,
            unlistedProjectDetected: unlistedDetection.unlistedProjectName,
            provenance: "INTERVIEW-DISCLOSED",
          }
        });
      }

      // 6.5 CANDIDATE QUESTIONS PHASE (State Machine)
      const currentTurnCount = sessionState.turns.length;
      const totalTurns = sessionState.blueprint?.totalTargetTurns || 12;
      const activePhase: InterviewPhase = (sessionState as any).interviewPhase || (
        currentTurnCount >= 10 ? "CANDIDATE_QUESTIONS" :
        currentTurnCount >= 6 ? "CODING" :
        currentTurnCount >= 3 ? "JD_CORE_SKILLS" : "RESUME_DEEP_DIVE"
      );

      // Transition to CANDIDATE_QUESTIONS if turn budget reached
      if (activePhase !== "CANDIDATE_QUESTIONS" && activePhase !== "CLOSING" && activePhase !== "ENDED" && currentTurnCount >= 10) {
        (sessionState as any).interviewPhase = "CANDIDATE_QUESTIONS";
        const inviteMsg = "That wraps up our technical deep dives! We have a few minutes left, and I would love to answer any questions you have for me about our engineering team, tech stack, roadmap, or day-to-day culture.";

        sessionState.questionsAsked.push({
          question: inviteMsg,
          targets: "Candidate Questions & Culture",
          section: "closing",
          competency: "Candidate Inquiries",
          turnIndex: currentTurnCount + 1,
        });
        await saveActiveSessionStateAsync(sessionId, sessionState);

        return NextResponse.json({
          message: inviteMsg,
          questionTargets: "Candidate Questions & Culture",
          section: "closing",
          difficulty: sessionState.currentDifficulty,
          isFollowUp: false,
          sessionId,
          turnIndex: currentTurnCount,
          openingState: sessionState.openingState,
          currentSection: "closing",
          phase: "CANDIDATE_QUESTIONS",
          stageHeader: formatStageHeader("CANDIDATE_QUESTIONS", currentTurnCount + 1, totalTurns),
          meta: { correlationId, latencyMs: Date.now() - t0, dossierCacheHit }
        });
      }

      // Handle ongoing CANDIDATE_QUESTIONS turns
      if (activePhase === "CANDIDATE_QUESTIONS") {
        const candidateQuestionsAsked = ((sessionState as any).candidateQuestionsCount || 0) + 1;
        (sessionState as any).candidateQuestionsCount = candidateQuestionsAsked;

        const isWrappingUp =
          candidateQuestionsAsked >= 2 ||
          /no more questions|all good|that covers it|thank you that was helpful|nothing else/i.test(lastUserMsg);

        if (isWrappingUp) {
          (sessionState as any).interviewPhase = "CLOSING";
          sessionState.isCompleted = true;
          sessionState.lifecycleState = "READY_TO_FINISH";

          const closingMsg = `Thank you so much for your thoughtful questions and for spending time with us today! We really enjoyed discussing your engineering background, systems architecture choices, and hands-on problem-solving. Our team will review the evaluation records and share detailed feedback and next steps shortly. Have a great day!`;

          sessionState.questionsAsked.push({
            question: closingMsg,
            targets: "Interview Conclusion",
            section: "closing",
            competency: "Closing Summary",
            turnIndex: currentTurnCount + 1,
          });
          await saveActiveSessionStateAsync(sessionId, sessionState);

          return NextResponse.json({
            message: closingMsg,
            questionTargets: "Interview Conclusion",
            section: "closing",
            difficulty: sessionState.currentDifficulty,
            isFollowUp: false,
            sessionId,
            turnIndex: currentTurnCount,
            openingState: sessionState.openingState,
            currentSection: "closing",
            isClosing: true,
            phase: "CLOSING",
            stageHeader: formatStageHeader("CLOSING", currentTurnCount + 1, totalTurns),
            meta: { correlationId, latencyMs: Date.now() - t0, dossierCacheHit }
          });
        }

        const answerMsg = `Great question! On our engineering team, we focus heavily on high-trust developer velocity and robust architectural patterns. Our tech stack is built on TypeScript, React and Next.js on the frontend, Node.js with PostgreSQL on the backend, and automated CI/CD with preview deployments for every PR. We emphasize continuous mentorship and structured design reviews before shipping to production. What else would you like to know before we wrap up?`;

        sessionState.questionsAsked.push({
          question: answerMsg,
          targets: "Engineering Culture & Architecture Q&A",
          section: "closing",
          competency: "Candidate Inquiry Response",
          turnIndex: currentTurnCount + 1,
        });
        await saveActiveSessionStateAsync(sessionId, sessionState);

        return NextResponse.json({
          message: answerMsg,
          questionTargets: "Engineering Culture & Architecture Q&A",
          section: "closing",
          difficulty: sessionState.currentDifficulty,
          isFollowUp: false,
          sessionId,
          turnIndex: currentTurnCount,
          openingState: sessionState.openingState,
          currentSection: "closing",
          phase: "CANDIDATE_QUESTIONS",
          stageHeader: formatStageHeader("CANDIDATE_QUESTIONS", currentTurnCount + 1, totalTurns),
          meta: { correlationId, latencyMs: Date.now() - t0, dossierCacheHit }
        });
      }

      // 7. Build recent conversation history
      const trimmed = trimMessages(messages, 10);
      const historyText = trimmed
        .map((m: any) => `${m.role === "assistant" ? "Alex (Interviewer)" : "Candidate"}: ${m.content}`)
        .join("\n");

      // Autonomous Answer Understanding Layer (Mandate 2, 3, 4, 5)
      const candidateAllSkills = [...(dossier.verifiedSkills || []), ...(dossier.claimedSkills || [])];
      const autoMemory = (sessionState as any).autonomousMemory || createAutonomousSessionMemory({
        sessionId,
        candidateId,
        dossier: {
          candidateId,
          name: dossier.name || "Candidate",
          targetRole: dossier.targetRole || "Software Engineer",
          targetCompany: dossier.targetCompany || "Technology Company",
          experienceLevel: dossier.experienceMode === "fresher" ? "fresher" : "experienced",
          trackId: sessionState.track || "fullstack",
          skills: candidateAllSkills,
          projects: dossier.projects || [],
        },
        mode: (sessionState as any).interviewMode === "professional" ? "professional" : "practice",
        initialCompetency: sessionState.questionsAsked[sessionState.questionsAsked.length - 1]?.competency || "System Architecture",
        initialDifficulty: sessionState.currentDifficulty as any,
      });
      (sessionState as any).autonomousMemory = autoMemory;

      const autoEval = await understandCandidateAnswer({
        questionId: `q_${sessionState.questionsAsked.length || sessionState.turns.length}`,
        questionText: lastAssistantMsg,
        rawAnswer: lastUserMsg,
        memory: autoMemory,
      });

      // Unified Accelerator: evaluates answer + generates next question in ONE model call
      const { assessment, nextQuestion, timingMs, modelAnswerFeedback, rubricScore } = await assessAndGenerateAdaptiveTurn(
        sessionState,
        dossier,
        historyText,
        lastAssistantMsg,
        lastUserMsg
      );

      // Dedicated Ambiguity & STT Clarification Intercept (Mandate 3 & 4)
      if (autoEval.ambiguity.detected && autoEval.ambiguity.details && autoEval.ambiguity.details.includes("?")) {
        nextQuestion.question = autoEval.ambiguity.details;
        nextQuestion.is_follow_up = true;
        nextQuestion.follow_up_reason = "verify_claimed_implementation";
      }

      // Question Grounding Validation: eliminate tech-transfer hallucinations (e.g. ChatDesk + Redis)
      nextQuestion.question = repairUngroundedQuestion(nextQuestion.question, claimLedger);

      // Question Quality Control Validation (Mandate 11)
      const qualityReport = validateQuestionQuality({
        questionText: nextQuestion.question,
        targetRole: dossier.targetRole,
        experienceLevel: dossier.experienceMode === "fresher" ? "fresher" : "experienced",
        questionHistory: sessionState.questionsAsked.map(q => ({ questionText: q.question })),
        candidateClaims: candidateAllSkills,
      });
      if (!qualityReport.isValid && qualityReport.repairedQuestion) {
        nextQuestion.question = qualityReport.repairedQuestion;
      }

      // Semantic duplicate check
      if (isSemanticDuplicate(nextQuestion.question, sessionState.questionsAsked.map(q => ({ text: q.question })))) {
        const fallback = generateBlueprintFallbackQuestion({
          section: sessionState.blueprint.currentSection,
          dossier,
          questionsAsked: sessionState.questionsAsked,
          assessment: sessionState.lastAssessment,
          candidateIntro: sessionState.candidateIntroduction,
          experienceMode: sessionState.experienceMode,
          targetRole: dossier.targetRole,
          track: sessionState.track as any,
        });
        nextQuestion.question = repairUngroundedQuestion(fallback.question, claimLedger);
      }

      // Update State Machine phase
      const calculatedPhase = determineNextPhase({
        phase: activePhase,
        turnIndex: sessionState.turns.length + 1,
        totalTargetTurns: totalTurns,
        junkStrikes: (sessionState as any).junkStrikes || 0,
        questionsAsked: sessionState.questionsAsked.map(q => ({ text: q.question, phase: activePhase, timestamp: Date.now() })),
        lastQuestionText: lastAssistantMsg,
        candidateQuestionsCount: (sessionState as any).candidateQuestionsCount || 0,
      }, lastUserMsg);
      (sessionState as any).interviewPhase = calculatedPhase;

      sessionState.lastAssessment = assessment;

      // Update answer distribution
      const qKey = assessment.answer_quality === "off-topic" ? "off_topic" : assessment.answer_quality;
      if (qKey in sessionState.answerDistribution) {
        (sessionState.answerDistribution as any)[qKey] = ((sessionState.answerDistribution as any)[qKey] || 0) + 1;
      }

      if (assessment.answer_quality === "shallow") {
        sessionState.consecutiveShallow++;
      } else {
        sessionState.consecutiveShallow = 0;
      }

      for (const top of assessment.topics_demonstrated) {
        if (!sessionState.topicsCovered.includes(top)) {
          sessionState.topicsCovered.push(top);
        }
      }

      // Record Turn
      const turnRecord: InterviewTurn = {
        turnIndex: sessionState.turns.length + 1,
        question: {
          question: lastAssistantMsg,
          question_targets: "Live evaluation",
          question_type: "technical",
          difficulty_level: sessionState.currentDifficulty,
          is_follow_up: assessment.next_action === "follow_up_probe",
          follow_up_reason: nextQuestion.follow_up_reason,
          section: sessionState.blueprint.currentSection,
        },
        answer: lastUserMsg,
        assessment,
        timestamp: new Date().toISOString(),
        follow_up_reason: nextQuestion.follow_up_reason,
        section_transition: nextQuestion.section_transition,
        modelAnswerFeedback,
        rubricScore: rubricScore ?? modelAnswerFeedback?.score,
        autonomousEvaluation: autoEval,
      };

      const pendingAssistance = (sessionState as any).pendingAssistance;
      if (pendingAssistance) {
        (turnRecord as any).isAssisted = true;
        (turnRecord as any).assistanceLevel = pendingAssistance.assistanceLevel;
        (sessionState as any).pendingAssistance = null;
      }

      sessionState.turns.push(turnRecord);

      // Track asked question for anti-repetition
      sessionState.questionsAsked.push({
        question: nextQuestion.question,
        targets: nextQuestion.question_targets,
        section: nextQuestion.section || sessionState.blueprint.currentSection,
        competency: nextQuestion.competency_targeted || "Technical Competency",
        turnIndex: sessionState.turns.length + 1,
      });

      await saveActiveSessionStateAsync(sessionId, sessionState);

      const totalDuration = Date.now() - t0;
      console.log(`[interview-chat][${correlationId}] Turn ${sessionState.turns.length} completed in ${totalDuration}ms (LLM: ${timingMs}ms, dossierCache: ${dossierCacheHit})`);

      return NextResponse.json({
        message: nextQuestion.question,
        questionTargets: nextQuestion.question_targets,
        section: nextQuestion.section,
        difficulty: nextQuestion.difficulty_level,
        isFollowUp: nextQuestion.is_follow_up,
        followUpReason: nextQuestion.follow_up_reason || "none",
        sectionTransition: nextQuestion.section_transition || "",
        assessment,
        autonomousEvaluation: autoEval,
        modelAnswer: modelAnswerFeedback,
        rubricScore: rubricScore ?? modelAnswerFeedback?.score,
        sessionId,
        turnIndex: sessionState.turns.length,
        openingState: sessionState.openingState,
        currentSection: sessionState.blueprint.currentSection,
        conductState: sessionState.conductState || "NORMAL",
        conductIncidents: sessionState.conductIncidents || [],
        phase: calculatedPhase,
        stageHeader: formatStageHeader(calculatedPhase, sessionState.turns.length, totalTurns),
        meta: {
          correlationId,
          latencyMs: totalDuration,
          dossierCacheHit,
          llmTimingMs: timingMs
        }
      });
    }

  } catch (err: any) {
    console.error("[interview-chat] Elite Engine Error:", err?.stack || err?.message);

    const userMsgs = (body?.messages || []).filter((m: any) => m.role === "user");
    const asstMsgs = (body?.messages || []).filter((m: any) => m.role === "assistant");
    const lastUserMsg = userMsgs.length > 0 ? userMsgs[userMsgs.length - 1].content : "";
    const lastAssistantMsg = asstMsgs.length > 0 ? asstMsgs[asstMsgs.length - 1].content : "";

    // Intelligently generate a non-repeating fallback conditioned on the current session state and dossier
    const sessionState = getActiveSessionState(sessionId, candidateId);
    const dossier = sessionState?.dossier || await buildCandidateInterviewDossier(candidateId, effectiveResume, effectiveJd);
    const currentSection = (sessionState?.blueprint?.currentSection || "resume_projects") as InterviewSection;
    const questionsAsked = sessionState?.questionsAsked || [];
    const effectiveTrack = (sessionState?.track || sessionState?.blueprint?.track) as InterviewTrack;
    const fallbackQ = generateBlueprintFallbackQuestion({
      section: currentSection,
      dossier,
      questionsAsked,
      assessment: sessionState?.lastAssessment || null,
      candidateIntro: sessionState?.candidateIntroduction,
      experienceMode: sessionState?.experienceMode,
      targetRole: dossier.targetRole,
      track: effectiveTrack,
    });

    if (sessionState) {
      // 1. If candidate submitted an answer to the previous question, preserve the answer with status "failed"
      // so their submitted response is not lost, but no fabricated score is awarded.
      if (lastUserMsg && lastAssistantMsg) {
        const turnIdx = sessionState.turns.length + 1;
        sessionState.turns.push({
          turnIndex: turnIdx,
          question: {
            question: lastAssistantMsg,
            question_targets: "Technical Question",
            competency_targeted: "Technical Evaluation",
            question_type: "technical",
            difficulty_level: sessionState.currentDifficulty || "medium",
            is_follow_up: false,
            section: currentSection,
          },
          answer: lastUserMsg,
          status: "failed",
          evaluationError: `AI Provider Evaluation Error: ${err.message}`,
          rubricScore: 0,
          timestamp: new Date().toISOString()
        });
      }

      // 2. Track the fallback question in questionsAsked so subsequent turns avoid repetition
      sessionState.questionsAsked.push({
        question: fallbackQ.question,
        targets: fallbackQ.target,
        section: currentSection,
        competency: fallbackQ.target || "Technical Core",
        turnIndex: sessionState.turns.length,
      });

      await saveActiveSessionStateAsync(sessionId, sessionState);
    }

    return NextResponse.json({
      message: fallbackQ.question,
      questionTargets: fallbackQ.target,
      section: currentSection,
      difficulty: sessionState?.currentDifficulty || "medium",
      isFollowUp: false,
      sessionId,
      turnIndex: sessionState?.turns.length || 1,
      fallback: true,
      evaluationStatus: "failed",
      evaluationError: err.message,
      error: err.message
    });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const candidateId = searchParams.get("candidateId") || undefined;

    const auth = await getAuthenticatedContext(req as any);
    const effectiveCandidateId = auth?.user?.id || candidateId;

    if (auth?.user?.id && candidateId && candidateId !== auth.user.id) {
      return NextResponse.json({ error: "Access denied. Candidate identity mismatch." }, { status: 403 });
    }

    const formatSessionPayload = (activeState: any, isPersisted = false) => {
      const messages: Array<{ role: "assistant" | "user"; content: string; time?: string }> = [];
      if (activeState.questionsAsked?.length > 0) {
        messages.push({ role: "assistant", content: activeState.questionsAsked[0].question });
      }
      if (activeState.candidateIntroduction) {
        messages.push({ role: "user", content: activeState.candidateIntroduction });
      }
      if (activeState.turns?.length > 0) {
        for (let i = 0; i < activeState.turns.length; i++) {
          const t = activeState.turns[i];
          if (i > 0 || !activeState.candidateIntroduction) {
            messages.push({ role: "assistant", content: t.question?.question || "" });
          }
          messages.push({ role: "user", content: t.answer });
        }
        const totalAsked = activeState.questionsAsked?.length || 0;
        if (totalAsked > activeState.turns.length) {
          const latestQ = activeState.questionsAsked[totalAsked - 1];
          if (latestQ && latestQ.question) {
            messages.push({ role: "assistant", content: latestQ.question });
          }
        }
      }

      const completed = Boolean(activeState.isCompleted || activeState.conductState === "TERMINATED" || isSessionCompleted(activeState.sessionId || activeState.id));

      return {
        id: activeState.sessionId || activeState.id,
        candidate_id: activeState.candidateId || activeState.candidate_id,
        openingState: activeState.openingState || (completed ? "COMPLETED" : "INTERVIEW_IN_PROGRESS"),
        lifecycleState: activeState.lifecycleState || (completed ? "COMPLETED" : "AWAITING_ANSWER"),
        isCompleted: completed,
        conductState: activeState.conductState || "NORMAL",
        conductIncidents: activeState.conductIncidents || [],
        track: activeState.track || activeState.blueprint?.track,
        currentSection: activeState.blueprint?.currentSection || "resume_projects",
        currentDifficulty: activeState.currentDifficulty || "medium",
        turns: activeState.turns || [],
        questionsAsked: activeState.questionsAsked || [],
        topicsCovered: activeState.topicsCovered || [],
        answerDistribution: activeState.answerDistribution || { strong: 0, adequate: 0, shallow: 0, off_topic: 0 },
        lastAssessment: activeState.lastAssessment || null,
        blueprint: activeState.blueprint || null,
        report: activeState.report || null,
        candidateIntroduction: activeState.candidateIntroduction || "",
        interviewMode: (activeState as any).interviewMode || "practice",
        hintPreference: (activeState as any).hintPreference || "subtle_hints",
        messages: activeState.transcript && activeState.transcript.length > 0 ? activeState.transcript : messages,
      };
    };

    // If specific sessionId requested:
    if (sessionId) {
      // Cross-tenant verification: check if this session belongs to a different candidate
      const rawLive = getActiveSessionState(sessionId) || (await getActiveSessionStateAsync(sessionId));
      if (rawLive && rawLive.candidateId && rawLive.candidateId !== effectiveCandidateId) {
        return NextResponse.json({ error: "Access denied. You do not own this session." }, { status: 403 });
      }

      const activeState = getActiveSessionState(sessionId, effectiveCandidateId) || (await getActiveSessionStateAsync(sessionId, effectiveCandidateId));
      if (activeState) {
        const completed = isSessionCompleted(sessionId) || Boolean(activeState.isCompleted);
        return NextResponse.json({
          success: true,
          resumable: !completed,
          isCompleted: completed,
          session: formatSessionPayload(activeState),
        });
      }

      const rawPersisted = await getSessionById(sessionId);
      if (rawPersisted && rawPersisted.candidate_id && rawPersisted.candidate_id !== effectiveCandidateId) {
        return NextResponse.json({ error: "Access denied. You do not own this session." }, { status: 403 });
      }

      const persisted = await getSessionById(sessionId, effectiveCandidateId);
      if (persisted) {
        return NextResponse.json({
          success: true,
          resumable: false,
          isCompleted: true,
          session: formatSessionPayload(persisted, true),
        });
      }

      return NextResponse.json({ error: "Session not found", resumable: false }, { status: 404 });
    }

    // No sessionId provided: look up active session for authenticated candidate
    if (effectiveCandidateId) {
      const activeForCand = getActiveSessionForCandidate(effectiveCandidateId);
      if (activeForCand) {
        return NextResponse.json({
          success: true,
          resumable: true,
          isCompleted: false,
          session: formatSessionPayload(activeForCand),
        });
      }
    }

    return NextResponse.json({
      success: false,
      resumable: false,
      message: "No active interview session found",
    }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}