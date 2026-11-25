/**
 * COGNALYZE API ROUTE — GROUP DISCUSSION TURN & ORCHESTRATION CONTROLLER
 * 
 * Handles:
 * - Dynamic placement topic generation via Groq
 * - Session initialization with 5-archetype panel calibration
 * - Context-aware peer debate turns & active coach interventions
 * - Candidate turn ingestion with barge-in / interruption handling
 * - Final evidence-grounded evaluation generation & persistence
 */

import { NextResponse } from "next/server";
import { runGDJsonCompletion, sanitizeGDPromptInput } from "@/lib/gd/ai-gateway";
import {
  createGDSessionAsync,
  getGDSessionByIdAsync,
  saveGDSessionAsync,
  acquireGDTurnLock,
  releaseGDTurnLock
} from "@/lib/gd/gd-session-store";
import { insertGDEvaluationCloud } from "@/lib/gd/gd-cloud-db";
import {
  requireAuthenticatedGDStudent,
  GD_NO_STORE_HEADERS
} from "@/lib/gd/api-security";
import { orchestrateNextTurn } from "@/lib/gd/simulation-engine";
import { evaluateGDSessionAsync } from "@/lib/gd/evaluation-engine";
import { syncGDReportToStudentDNAAsync } from "@/lib/gd/dna-sync";
import { transitionLifecycleState } from "@/lib/gd/session-state-machine";
import { updateParticipantMemoryAfterTurn } from "@/lib/gd/dynamic-agent-generator";
import { GDSimulationFormat, GDDifficultyLevel, GDExperienceMode, GDTranscriptItem } from "@/lib/gd/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function jsonNoStore(data: any, status = 200) {
  return NextResponse.json(data, { status, headers: GD_NO_STORE_HEADERS });
}

export async function POST(req: Request) {
  try {
    const guard = await requireAuthenticatedGDStudent(req);
    if (!guard.ok) return guard.response;
    const { userId, userName, authCtx } = guard.student;

    const body = await req.json();
    const {
      action,
      sessionId,
      topic,
      category,
      format = "competitive",
      experienceMode = "standard_round",
      difficulty = "intermediate",
      durationMinutes = 15,
      messages = [],
      studentIntervention = "",
      isInterruption = false,
      interruptedSpeaker = "",
      company_tier = "FAANG/Product (Tier-1 hiring bar)",
      drive_type = "On-campus placement",
      role_level = "Fresher/Entry-level",
      target_company = "Target Company"
    } = body;

    // ── ACTION 1: Dynamic Context-Aware Topic Generation ──
    if (action === "generate_topics") {
      const cat = category || "AI & Tech Engineering";
      const prompt = `Generate 4 fresh, controversial, and engaging Group Discussion (GD) topics for an engineering hiring drive.
CONTEXT:
- Target Company: ${target_company}
- Company Tier/Bar: ${company_tier}
- Drive Type: ${drive_type}
- Role Level: ${role_level}
- Category: "${cat}"

CALIBRATION RULES:
- Tier-1 / FAANG Product: Focus on distributed scalability, engineering velocity vs tech debt, algorithmic bias, autonomous AI agents vs junior engineering intuition.
- No fabricated statistics (never cite fake percentages). Topics must balance technical feasibility with real business impact.

Return JSON in this format ONLY:
{
  "topics": [
    {
      "title": "Topic title",
      "context": "1-sentence background on why this is debated",
      "key_perspectives": ["Perspective A", "Perspective B"]
    }
  ]
}`;

      const topicGenResult = await runGDJsonCompletion<any[]>({
        role: "topic_generator",
        systemPrompt: "Return a strict JSON object with a non-empty 'topics' array of debatable GD topics.",
        userPrompt: sanitizeGDPromptInput(prompt, 1400),
        validate: (parsed) => (Array.isArray(parsed?.topics) && parsed.topics.length >= 2 ? parsed.topics : null)
      });

      if (topicGenResult.ok) {
        return jsonNoStore({ success: true, topics: topicGenResult.data });
      }

      return jsonNoStore(
        {
          success: false,
          error: "generation_failed",
          message: "Unable to synthesize dynamic topics at this moment. Please select from curated domains.",
          retryable: true
        },
        503
      );
    }

    // ── ACTION 2: Initialize & Start GD Session ──
    if (action === "start_discussion") {
      const session = await createGDSessionAsync({
        userId,
        topicId: `topic_${Date.now()}`,
        topicTitle: topic || "Autonomous AI Coding Agents vs Junior Software Engineers in 2026",
        format: format as GDSimulationFormat,
        experienceMode: experienceMode as GDExperienceMode,
        difficulty: difficulty as GDDifficultyLevel,
        durationMinutes: Number(durationMinutes) || 15,
        targetRole: (authCtx?.studentProfile?.careerGoals as any)?.targetRole || (authCtx?.studentProfile?.careerGoals as any)?.primaryRole || "Software Engineer"
      });

      // Transition to OPENING
      const runningSession = transitionLifecycleState(session, "OPENING");

      // Generate authentic Opening Sequence from Panel Director + Opening Peer
      const openingPeer = runningSession.participants.find(p => !p.isHuman) || runningSession.participants[1];
      const briefText = runningSession.experienceBlueprint?.openingScenarioBrief;

      const modMsg: GDTranscriptItem = {
        id: `turn-mod-intro-${Date.now()}`,
        speakerId: "moderator-alex",
        speakerName: "Alex (Discussion Director)",
        speakerAvatar: "🎙️",
        speakerRole: "Panel Director & Lead Bar-Raiser",
        isHuman: false,
        content: briefText
          ? `Welcome candidates. ${briefText} The floor is open.`
          : `Welcome candidates. Today's placement discussion topic is: "${session.topicTitle}". The panel is evaluating structured problem framing, empirical trade-offs, and collaborative synthesis. The floor is open.`,
        timestamp: Date.now(),
        formattedTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        stage: "briefing"
      };

      const peerMsg: GDTranscriptItem = {
        id: `turn-peer-intro-${Date.now()}`,
        speakerId: openingPeer.id,
        speakerName: openingPeer.name,
        speakerAvatar: openingPeer.avatar,
        speakerRole: openingPeer.roleTitle,
        isHuman: false,
        content: `To kick off on "${session.topicTitle}", we must distinguish between short-term prototype velocity and long-term production resilience. If we optimize purely for immediate developer convenience without establishing verification gates, the resulting technical debt paralyzes the enterprise.`,
        timestamp: Date.now() + 1000,
        formattedTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        stage: "opening"
      };

      runningSession.transcripts = [modMsg, peerMsg];
      openingPeer.speakingTurnCount += 1;
      openingPeer.lastSpokeAtTimestamp = Date.now();
      await saveGDSessionAsync(runningSession);

      return jsonNoStore({
        success: true,
        sessionId: runningSession.sessionId,
        session: runningSession,
        moderator_intro: {
          speaker: modMsg.speakerName,
          avatar: modMsg.speakerAvatar,
          role: modMsg.speakerRole,
          content: modMsg.content
        },
        opening_speaker: {
          speaker: peerMsg.speakerName,
          avatar: peerMsg.speakerAvatar,
          role: peerMsg.speakerRole,
          content: peerMsg.content
        }
      });
    }

    // ── ACTION 3: Finalize GD Evaluation Dossier ──
    if (action === "finalize_evaluation") {
      if (!sessionId) {
        return jsonNoStore({ success: false, error: "Missing sessionId" }, 400);
      }

      let session;
      try {
        session = await getGDSessionByIdAsync(sessionId, userId);
      } catch (err: any) {
        return jsonNoStore({ success: false, error: "forbidden", message: err.message }, 403);
      }
      if (!session) {
        return jsonNoStore({ success: false, error: "Session not found" }, 404);
      }

      const completedSession = transitionLifecycleState(session, "COMPLETED");
      const report = await evaluateGDSessionAsync(completedSession, {
        targetUserId: userId,
        targetUserName: userName
      });
      completedSession.evaluationReport = report;
      await saveGDSessionAsync(completedSession);

      const dnaSync = await syncGDReportToStudentDNAAsync({ userId, report }).catch(() => ({
        synced: false,
        reason: "sync_failed",
        recordedEvidenceIds: []
      }));

      await insertGDEvaluationCloud({
        session: completedSession,
        userId,
        report,
        dnaSynced: dnaSync.synced
      });

      return jsonNoStore({
        success: true,
        report,
        dnaSynced: dnaSync.synced,
        dnaSyncReason: dnaSync.reason || null
      });
    }

    // ── ACTION 4: Process Next Turn (Peer Retort or Candidate Intervention) ──
    let session = null;
    if (sessionId) {
      try {
        session = await getGDSessionByIdAsync(sessionId, userId);
      } catch (err: any) {
        return jsonNoStore({ success: false, error: "forbidden", message: err.message }, 403);
      }
      if (!session) {
        return jsonNoStore({ success: false, error: "Session not found" }, 404);
      }
    } else {
      session = await createGDSessionAsync({
        userId,
        topicId: `topic_${Date.now()}`,
        topicTitle:
          sanitizeGDPromptInput(
            String(topic || "Autonomous AI Coding Agents vs Junior Software Engineers in 2026"),
            240
          ) || "Autonomous AI Coding Agents vs Junior Software Engineers in 2026",
        format: format as GDSimulationFormat,
        difficulty: difficulty as GDDifficultyLevel
      });
    }

    // Concurrency Lock
    if (!acquireGDTurnLock(session.sessionId)) {
      return jsonNoStore({ success: false, error: "Turn in progress", retryable: true }, 429);
    }

    const cleanStudentIntervention =
      typeof studentIntervention === "string"
        ? sanitizeGDPromptInput(studentIntervention, 2000)
        : "";

    try {
      // If student spoke, record candidate transcript turn first
      if (cleanStudentIntervention) {
        const studentTurn: GDTranscriptItem = {
          id: `turn-student-${Date.now()}`,
          speakerId: `candidate-${userId}`,
          speakerName: userName,
          speakerAvatar: "🎓",
          speakerRole: "Candidate (You)",
          isHuman: true,
          content: cleanStudentIntervention,
          timestamp: Date.now(),
          formattedTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          stage: session.currentStage,
          isInterruption: Boolean(isInterruption),
          interruptedSpeakerName: sanitizeGDPromptInput(String(interruptedSpeaker || ""), 80)
        };

        session.transcripts.push(studentTurn);
        const candidateState = session.participants.find(p => p.isHuman);
        if (candidateState) {
          candidateState.speakingTurnCount += 1;
          candidateState.lastSpokeAtTimestamp = Date.now();
          if (isInterruption) candidateState.interruptionCount += 1;
          updateParticipantMemoryAfterTurn({
            session,
            speakerId: candidateState.id,
            utterance: cleanStudentIntervention,
            stage: session.currentStage
          });
        }
      }

      // Synchronize client messages only when session transcript is empty (peer/moderator intro only)
      if (session.transcripts.length === 0 && Array.isArray(messages) && messages.length > 0) {
        session.transcripts = messages
          .filter((m: any) => m && typeof m.content === "string" && m.speaker !== "You")
          .slice(0, 12)
          .map((m: any, i: number) => {
            const cleanSpeaker = sanitizeGDPromptInput(String(m.speaker || "Peer"), 60) || "Peer";
            return {
              id: `turn-sync-${i}-${Date.now()}`,
              speakerId: `peer-${cleanSpeaker}`,
              speakerName: cleanSpeaker,
              speakerAvatar: "💬",
              speakerRole: sanitizeGDPromptInput(String(m.role || "Peer"), 60) || "Peer",
              isHuman: false,
              content: sanitizeGDPromptInput(m.content, 1500),
              timestamp: Date.now() - (messages.length - i) * 1500,
              formattedTime: "Synced",
              stage: session.currentStage
            };
          });
      }

      // Decrement stage time
      session.stageTimeRemainingSeconds = Math.max(0, session.stageTimeRemainingSeconds - 15);

      // Orchestrate the next speaker turn
      const nextTurnResult = await orchestrateNextTurn(session, cleanStudentIntervention);

      // Record next speaker turn in session
      const nextTurnItem: GDTranscriptItem = {
        id: `turn-${nextTurnResult.speakerId}-${Date.now()}`,
        speakerId: nextTurnResult.speakerId,
        speakerName: nextTurnResult.speakerName,
        speakerAvatar: nextTurnResult.speakerAvatar,
        speakerRole: nextTurnResult.speakerRole,
        isHuman: false,
        content: nextTurnResult.content,
        timestamp: Date.now(),
        formattedTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        stage: nextTurnResult.stage
      };

      session.transcripts.push(nextTurnItem);

      // Update participant stats
      const speakerState = session.participants.find(p => p.id === nextTurnResult.speakerId);
      if (speakerState) {
        speakerState.speakingTurnCount += 1;
        speakerState.lastSpokeAtTimestamp = Date.now();
      }

      // If stage updated
      if (nextTurnResult.updatedStage) {
        session.currentStage = nextTurnResult.updatedStage;
      }

      await saveGDSessionAsync(session);

      return jsonNoStore({
        success: true,
        sessionId: session.sessionId,
        next_speaker: {
          name: nextTurnResult.speakerName,
          role: nextTurnResult.speakerRole,
          avatar: nextTurnResult.speakerAvatar,
          spoken_text: nextTurnResult.content,
          isCoachIntervention: nextTurnResult.isCoachIntervention,
          coachInterventionType: nextTurnResult.coachInterventionType,
          twistLabel: nextTurnResult.twistLabel
        },
        currentStage: session.currentStage,
        student_coaching: nextTurnResult.studentCoaching || null
      });
    } finally {
      releaseGDTurnLock(session.sessionId);
    }
  } catch (err: any) {
    console.error("[gd-turn] Controller exception:", err);
    return jsonNoStore(
      { success: false, error: "internal_error", message: err.message, retryable: true },
      500
    );
  }
}
