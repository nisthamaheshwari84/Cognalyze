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
  GeneratedQuestion
} from "@/lib/ai/interview-engine";
import {
  getActiveSessionState,
  saveActiveSessionState
} from "@/lib/interview-session-store";

function trimMessages(messages: Array<{ role: string; content: string }>, maxMessages = 12) {
  if (messages.length <= maxMessages) return messages;
  return [messages[0], ...messages.slice(-(maxMessages - 1))];
}

export async function POST(req: Request) {
  const t0 = Date.now();
  const correlationId = req.headers.get("x-correlation-id") || `chat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

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
    targetCompany,
    targetRole,
    skillsFocus,
    difficulty,
  } = body;

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

  const sessionId = reqSessionId || `sess_${candidateId}_${Math.floor(Date.now() / 3600000)}`;

  try {
    // 2. Load or Initialize Advanced Session State
    let sessionState: AdvancedSessionState | null = getActiveSessionState(sessionId, candidateId);

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
        skillsFocus
      );
      sessionState = createAdvancedSessionState(blueprint, dossier);
      if (difficulty && difficulty !== "adaptive") {
        sessionState.currentDifficulty = difficulty as any;
      }
    } else if (!sessionState.dossier) {
      sessionState.dossier = dossier;
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
      // 7. Build recent conversation history
      const trimmed = trimMessages(messages, 10);
      const historyText = trimmed
        .map((m: any) => `${m.role === "assistant" ? "Alex (Interviewer)" : "Candidate"}: ${m.content}`)
        .join("\n");

      // Unified Accelerator: evaluates answer + generates next question in ONE model call
      const { assessment, nextQuestion, timingMs } = await assessAndGenerateAdaptiveTurn(
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
          section: sessionState.blueprint.currentSection,
        },
        answer: lastUserMsg,
        assessment,
        timestamp: new Date().toISOString(),
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

      saveActiveSessionState(sessionId, sessionState);

      const totalDuration = Date.now() - t0;
      console.log(`[interview-chat][${correlationId}] Turn ${sessionState.turns.length} completed in ${totalDuration}ms (LLM: ${timingMs}ms, dossierCache: ${dossierCacheHit})`);

      return NextResponse.json({
        message: nextQuestion.question,
        questionTargets: nextQuestion.question_targets,
        section: nextQuestion.section,
        difficulty: nextQuestion.difficulty_level,
        isFollowUp: nextQuestion.is_follow_up,
        assessment,
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
    console.error("[interview-chat] Elite Engine Error:", err.message);

    // Fallback: contextual question from candidate's resume/project
    const targetProj = effectiveResume.match(/(?:project|built|developed|created)\s+([A-Za-z0-9_-]+)/i)?.[1] || "your primary project";
    const contextualFallback = qNumber <= 1
      ? `To begin, walk me through the architecture of ${targetProj} and the specific technical components you personally implemented.`
      : qNumber <= 4
      ? `In ${targetProj}, how did you handle data consistency, failure recovery, or error handling when external services or databases failed?`
      : `Let's discuss computer science fundamentals. How do you analyze time and space complexity when scaling an in-memory caching layer?`;

    return NextResponse.json({
      message: contextualFallback,
      fallback: true,
      error: err.message
    });
  }
}