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
  InterviewTrack
} from "@/lib/ai/interview-engine";
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
  } = body;

  const effectiveTrack = reqTrack || reqInterviewTrack;

  // 1. Authenticate candidate with strict server-side validation
  const auth = await getAuthenticatedContext(req as any);
  const candidateId = auth?.user?.id || reqCandidateId || body.studentId || "student-demo";

  // Prevent cross-user leakage: if authenticated, candidateId MUST match auth.user.id
  if (auth?.user?.id && reqCandidateId && reqCandidateId !== auth.user.id) {
    return NextResponse.json({ error: "Access denied. Candidate identity mismatch." }, { status: 403 });
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

    // Reuse session-cached dossier if present to avoid repeated 200ms+ disk/evidence parsing
    let dossier = sessionState?.dossier;
    let dossierCacheHit = Boolean(dossier);

    if (!dossier) {
      dossier = await buildCandidateInterviewDossier(candidateId, effectiveResume, effectiveJd);
    }

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
      if (effectiveTrack) {
        sessionState.track = effectiveTrack;
      }
      if (difficulty && difficulty !== "adaptive") {
        sessionState.currentDifficulty = difficulty as any;
      }
    } else {
      if (!sessionState.dossier) {
        sessionState.dossier = dossier;
      }
      if (!sessionState.track && effectiveTrack) {
        sessionState.track = effectiveTrack;
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
        meta: {
          correlationId,
          latencyMs: Date.now() - t0,
          dossierCacheHit,
        }
      });
    }

    const lastUserMsg = userMessages.length > 0 ? userMessages[userMessages.length - 1].content : "";
    const lastAssistantMsg = assistantMessages.length > 0 ? assistantMessages[assistantMessages.length - 1].content : "";

    // 5. STEP 2 & 3: Candidate Introduction Received -> Acknowledge & Transition to Question 1
    if (sessionState.openingState === "AWAITING_CANDIDATE_INTRO") {
      const candidateIntro = (lastUserMsg || "").trim();
      sessionState.candidateIntroduction = candidateIntro || "Candidate provided introduction.";
      sessionState.openingState = "INTERVIEW_IN_PROGRESS";
      sessionState.blueprint.currentSection = "resume_projects";

      // Brief personalized transition (1 sentence)
      const transition = generateIntroductionTransition(candidateIntro, dossier);

      // Generate Question 1 of actual interview grounded in dossier & candidate introduction
      const firstQ = await generateNextAdaptiveQuestion(sessionState, dossier, candidateIntro, null);

      // Crisp combined message: [Acknowledgment & Transition] + [Question 1]
      const combinedMessage = `${transition} ${firstQ.question}`;

      sessionState.questionsAsked.push({
        question: combinedMessage,
        targets: firstQ.question_targets,
        section: firstQ.section || "resume_projects",
        competency: firstQ.competency_targeted || "Project Ownership & Architecture",
        turnIndex: 1,
      });

      saveActiveSessionState(sessionId, sessionState);

      return NextResponse.json({
        message: combinedMessage,
        questionTargets: firstQ.question_targets,
        section: firstQ.section || "resume_projects",
        difficulty: firstQ.difficulty_level,
        isFollowUp: false,
        sessionId,
        turnIndex: 1,
        openingState: "INTERVIEW_IN_PROGRESS",
        currentSection: sessionState.blueprint.currentSection,
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

      // 7. Build recent conversation history
      const trimmed = trimMessages(messages, 10);
      const historyText = trimmed
        .map((m: any) => `${m.role === "assistant" ? "Alex (Interviewer)" : "Candidate"}: ${m.content}`)
        .join("\n");

      // Unified Accelerator: evaluates answer + generates next question in ONE model call
      const { assessment, nextQuestion, timingMs, modelAnswerFeedback, rubricScore } = await assessAndGenerateAdaptiveTurn(
        sessionState,
        dossier,
        historyText,
        lastAssistantMsg,
        lastUserMsg
      );

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
      };
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
        modelAnswer: modelAnswerFeedback,
        rubricScore: rubricScore ?? modelAnswerFeedback?.score,
        sessionId,
        turnIndex: sessionState.turns.length,
        openingState: sessionState.openingState,
        currentSection: sessionState.blueprint.currentSection,
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

      const completed = Boolean(activeState.isCompleted || isSessionCompleted(activeState.sessionId || activeState.id));

      return {
        id: activeState.sessionId || activeState.id,
        candidate_id: activeState.candidateId || activeState.candidate_id,
        openingState: activeState.openingState || (completed ? "COMPLETED" : "INTERVIEW_IN_PROGRESS"),
        lifecycleState: activeState.lifecycleState || (completed ? "COMPLETED" : "AWAITING_ANSWER"),
        isCompleted: completed,
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