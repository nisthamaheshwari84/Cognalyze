import { NextResponse } from "next/server";
import {
  getOrCreateLearningTwin,
  updateLearningTwin,
  recordMentorEvidence,
  saveSessionMessages,
  getActiveSession
} from "@/lib/mentor/store";
import { processMentorTurn } from "@/lib/mentor/engine";
import { ConversationalMessage } from "@/lib/mentor/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      candidateId = "student-demo",
      userMessage,
      sessionId,
      messages = [],
      interruptionContext,
      sessionLearningState
    }: {
      candidateId?: string;
      userMessage: string;
      sessionId?: string;
      messages: ConversationalMessage[];
      interruptionContext?: any;
      sessionLearningState?: any;
    } = body;

    if (!userMessage || typeof userMessage !== "string") {
      return NextResponse.json({ error: "Missing userMessage" }, { status: 400 });
    }

    const state = getOrCreateLearningTwin(candidateId);

    // Run adaptive engine with speech/interruption context & session state
    const result = await processMentorTurn(
      messages,
      state,
      userMessage,
      interruptionContext,
      sessionLearningState
    );

    // If evidence was generated during this turn, record it
    if (result.evidenceGenerated) {
      recordMentorEvidence(candidateId, result.evidenceGenerated);
    }

    // Persist any updated twin state
    const updatedTwin = updateLearningTwin(candidateId, result.updatedState);

    // Save turn messages to session
    const activeSess = sessionId ? { id: sessionId } : getActiveSession(candidateId, false);
    if (activeSess) {
      const allTurnMessages: ConversationalMessage[] = [
        ...messages,
        {
          id: `usr-${Date.now()}`,
          role: "user",
          content: userMessage,
          timestamp: new Date().toISOString(),
          metadata: {
            interruptionContext
          }
        },
        {
          id: `mnt-${Date.now()}`,
          role: "mentor",
          content: result.mentorResponse,
          timestamp: new Date().toISOString(),
          metadata: {
            hintLevel: result.availableHints?.currentLevel,
            whyContext: result.whyExplanation,
            intent: result.intent?.intent,
            topic: result.intent?.topic,
            evaluation: result.evaluation,
            teachingAction: result.teachingAction,
            decisionRationale: result.decisionContext?.minimumInterventionRationale,
            visualCanvas: result.visualCanvas,
            learningSurface: result.learningSurface,
            sessionLearningState: result.sessionLearningState
          }
        }
      ];
      saveSessionMessages(candidateId, activeSess.id, allTurnMessages);
    }

    return NextResponse.json({
      success: true,
      mentorResponse: result.mentorResponse,
      spokenResponse: result.spokenResponse || result.mentorResponse,
      visualCanvas: result.visualCanvas,
      learningSurface: result.learningSurface,
      sessionLearningState: result.sessionLearningState,
      resolvedReferences: result.resolvedReferences,
      waitTimeoutSeconds: result.waitTimeoutSeconds,
      learningTwin: updatedTwin,
      availableHints: result.availableHints,
      evidenceGenerated: result.evidenceGenerated,
      evaluation: result.evaluation,
      intent: result.intent,
      whyExplanation: result.whyExplanation,
      teachingAction: result.teachingAction,
      decisionContext: result.decisionContext
    });
  } catch (err: any) {
    console.error("[POST /api/mentor/turn] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to process turn" }, { status: 500 });
  }
}
