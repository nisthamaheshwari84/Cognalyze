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
import { groqFetch } from "@/lib/groq";
import { extractJSON, stripThinkTags } from "@/lib/ai/placement-intelligence";
import {
  createGDSession,
  getGDSessionById,
  saveGDSession,
  acquireGDTurnLock,
  releaseGDTurnLock
} from "@/lib/gd/gd-session-store";
import { orchestrateNextTurn } from "@/lib/gd/simulation-engine";
import { evaluateGDSession } from "@/lib/gd/evaluation-engine";
import { transitionLifecycleState } from "@/lib/gd/session-state-machine";
import { GDSimulationFormat, GDDifficultyLevel, GDTranscriptItem } from "@/lib/gd/types";
import { getAuthenticatedContext } from "@/lib/auth/server";

export async function POST(req: Request) {
  try {
    const authCtx = await getAuthenticatedContext(req);
    const userId = authCtx?.user?.id || "guest-student";
    const userName = authCtx?.user?.fullName || "Candidate (You)";

    const body = await req.json();
    const {
      action,
      sessionId,
      topic,
      category,
      format = "competitive",
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

      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              model: "openai/gpt-oss-120b",
              messages: [{ role: "user", content: prompt }],
              temperature: 0.85,
              max_tokens: 1000
            })
          });

          if (res.ok) {
            const data = await res.json();
            const raw = data.choices?.[0]?.message?.content || "{}";
            const clean = stripThinkTags(raw);
            const parsed = extractJSON(clean);

            if (Array.isArray(parsed.topics) && parsed.topics.length >= 2) {
              return NextResponse.json({ success: true, topics: parsed.topics });
            }
          }
        } catch (e: any) {
          if (attempt === 1) await new Promise(r => setTimeout(r, 400));
        }
      }

      return NextResponse.json(
        {
          success: false,
          error: "generation_failed",
          message: "Unable to synthesize dynamic topics at this moment. Please select from curated domains.",
          retryable: true
        },
        { status: 503 }
      );
    }

    // ── ACTION 2: Initialize & Start GD Session ──
    if (action === "start_discussion") {
      const session = createGDSession({
        userId,
        topicId: `topic_${Date.now()}`,
        topicTitle: topic || "Autonomous AI Coding Agents vs Junior Software Engineers in 2026",
        format: format as GDSimulationFormat,
        difficulty: difficulty as GDDifficultyLevel,
        durationMinutes: Number(durationMinutes) || 15,
        targetRole: (authCtx?.studentProfile?.careerGoals as any)?.targetRole || (authCtx?.studentProfile?.careerGoals as any)?.primaryRole || "Software Engineer"
      });

      // Transition to OPENING
      const runningSession = transitionLifecycleState(session, "OPENING");

      // Generate authentic Opening Sequence from Panel Director + Opening Peer
      const openingPeer = runningSession.participants.find(p => !p.isHuman) || runningSession.participants[1];

      const modMsg: GDTranscriptItem = {
        id: `turn-mod-intro-${Date.now()}`,
        speakerId: "moderator-alex",
        speakerName: "Alex (Discussion Director)",
        speakerAvatar: "🎙️",
        speakerRole: "Panel Director & Lead Bar-Raiser",
        isHuman: false,
        content: `Welcome candidates. Today's placement discussion topic is: "${session.topicTitle}". The panel is evaluating structured problem framing, empirical trade-offs, and collaborative synthesis. The floor is open.`,
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
      saveGDSession(runningSession);

      return NextResponse.json({
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
        return NextResponse.json({ success: false, error: "Missing sessionId" }, { status: 400 });
      }

      const session = getGDSessionById(sessionId, userId);
      if (!session) {
        return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
      }

      const completedSession = transitionLifecycleState(session, "COMPLETED");
      const report = evaluateGDSession(completedSession);
      completedSession.evaluationReport = report;
      saveGDSession(completedSession);

      return NextResponse.json({
        success: true,
        report
      });
    }

    // ── ACTION 4: Process Next Turn (Peer Retort or Candidate Intervention) ──
    // Load session if exists, or generate fallback virtual session
    let session = sessionId ? getGDSessionById(sessionId, userId) : null;
    if (!session) {
      session = createGDSession({
        userId,
        topicId: `topic_${Date.now()}`,
        topicTitle: topic || "Autonomous AI Coding Agents vs Junior Software Engineers in 2026",
        format: format as GDSimulationFormat,
        difficulty: difficulty as GDDifficultyLevel
      });
    }

    // Concurrency Lock
    if (!acquireGDTurnLock(session.sessionId)) {
      return NextResponse.json(
        { success: false, error: "Turn in progress", retryable: true },
        { status: 429 }
      );
    }

    try {
      // If student spoke, record candidate transcript turn first
      if (studentIntervention && studentIntervention.trim()) {
        const studentTurn: GDTranscriptItem = {
          id: `turn-student-${Date.now()}`,
          speakerId: `candidate-${userId}`,
          speakerName: userName,
          speakerAvatar: "🎓",
          speakerRole: "Candidate (You)",
          isHuman: true,
          content: studentIntervention.trim(),
          timestamp: Date.now(),
          formattedTime: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          stage: session.currentStage,
          isInterruption: Boolean(isInterruption),
          interruptedSpeakerName: interruptedSpeaker
        };

        session.transcripts.push(studentTurn);
        const candidateState = session.participants.find(p => p.isHuman);
        if (candidateState) {
          candidateState.speakingTurnCount += 1;
          candidateState.lastSpokeAtTimestamp = Date.now();
          if (isInterruption) candidateState.interruptionCount += 1;
        }
      }

      // Synchronize client messages if session transcript was empty
      if (session.transcripts.length === 0 && Array.isArray(messages) && messages.length > 0) {
        session.transcripts = messages.map((m: any, i: number) => ({
          id: `turn-sync-${i}-${Date.now()}`,
          speakerId: m.speaker === "You" ? `candidate-${userId}` : `peer-${m.speaker}`,
          speakerName: m.speaker,
          speakerAvatar: m.avatar || "💬",
          speakerRole: m.role || "Peer",
          isHuman: m.speaker === "You",
          content: m.content,
          timestamp: Date.now() - (messages.length - i) * 1500,
          formattedTime: m.time || "10:00 AM",
          stage: session.currentStage
        }));
      }

      // Decrement stage time
      session.stageTimeRemainingSeconds = Math.max(0, session.stageTimeRemainingSeconds - 15);

      // Orchestrate the next speaker turn
      const nextTurnResult = await orchestrateNextTurn(session, studentIntervention);

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

      saveGDSession(session);

      return NextResponse.json({
        success: true,
        sessionId: session.sessionId,
        next_speaker: {
          name: nextTurnResult.speakerName,
          role: nextTurnResult.speakerRole,
          avatar: nextTurnResult.speakerAvatar,
          spoken_text: nextTurnResult.content,
          isCoachIntervention: nextTurnResult.isCoachIntervention,
          coachInterventionType: nextTurnResult.coachInterventionType
        },
        currentStage: session.currentStage,
        student_coaching: nextTurnResult.studentCoaching || {
          articulationScore: 82,
          valueAdded: "High",
          feedbackTip: "Anchor your point with specific SLAs or real-world system constraints.",
          winningCounterPhrase: "Let us examine the operational failure modes before deciding on an architecture."
        }
      });
    } finally {
      releaseGDTurnLock(session.sessionId);
    }
  } catch (err: any) {
    console.error("[gd-turn] Controller exception:", err);
    return NextResponse.json(
      { success: false, error: "internal_error", message: err.message, retryable: true },
      { status: 500 }
    );
  }
}
