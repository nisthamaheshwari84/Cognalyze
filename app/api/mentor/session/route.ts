import { NextResponse } from "next/server";
import {
  getOrCreateLearningTwin,
  updateLearningTwin,
  resetMentorSession,
  getActiveSession,
  createMentorSession,
  endMentorSession,
  saveSessionMessages,
  getMentorSessionById
} from "@/lib/mentor/store";
import { KNOWLEDGE_GRAPH } from "@/lib/mentor/knowledge-graph";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidateId") || "student-demo";
    const domain = searchParams.get("domain") || undefined;
    const createIfMissing = searchParams.get("createIfMissing") === "true";

    const twin = getOrCreateLearningTwin(candidateId, domain ? { domain } : undefined);
    const activeNode = KNOWLEDGE_GRAPH[twin.activeConceptId] || KNOWLEDGE_GRAPH["sys-networking"];
    const activeSession = getActiveSession(candidateId, createIfMissing);

    return NextResponse.json({
      success: true,
      learningTwin: twin,
      activeConcept: activeNode,
      activeSession
    });
  } catch (err: any) {
    console.error("[GET /api/mentor/session] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to load session" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      candidateId = "student-demo",
      goal,
      reset,
      updates,
      action,
      sessionId,
      messages,
      sessionOptions
    } = body;

    if (reset) {
      resetMentorSession(candidateId);
      const newTwin = getOrCreateLearningTwin(candidateId, goal);
      return NextResponse.json({ success: true, learningTwin: newTwin });
    }

    // Explicit Action: Exit active session
    if (action === "exit") {
      if (sessionId && messages && Array.isArray(messages)) {
        saveSessionMessages(candidateId, sessionId, messages);
      }
      const endedSession = endMentorSession(candidateId, sessionId);
      return NextResponse.json({
        success: true,
        endedSession,
        message: "Session archived into history"
      });
    }

    // Explicit Action: Start a brand new session
    if (action === "new") {
      const newSession = createMentorSession(candidateId, sessionOptions);
      const twin = getOrCreateLearningTwin(candidateId);
      const activeNode = KNOWLEDGE_GRAPH[twin.activeConceptId] || KNOWLEDGE_GRAPH["sys-networking"];
      return NextResponse.json({
        success: true,
        learningTwin: twin,
        activeConcept: activeNode,
        activeSession: newSession
      });
    }

    // Explicit Action: Resume an existing session
    if (action === "resume" && sessionId) {
      const pastSession = getMentorSessionById(candidateId, sessionId);
      if (!pastSession) {
        return NextResponse.json({ error: "Session not found" }, { status: 404 });
      }
      pastSession.status = "active";
      const twin = getOrCreateLearningTwin(candidateId);
      return NextResponse.json({
        success: true,
        learningTwin: twin,
        activeSession: pastSession
      });
    }

    // Explicit Action: Save messages
    if (action === "save" && sessionId && messages) {
      saveSessionMessages(candidateId, sessionId, messages);
      return NextResponse.json({ success: true });
    }

    let twin = getOrCreateLearningTwin(candidateId, goal);
    if (updates) {
      twin = updateLearningTwin(candidateId, updates);
    }

    const activeNode = KNOWLEDGE_GRAPH[twin.activeConceptId] || KNOWLEDGE_GRAPH["sys-networking"];
    const activeSession = getActiveSession(candidateId, false);

    return NextResponse.json({
      success: true,
      learningTwin: twin,
      activeConcept: activeNode,
      activeSession
    });
  } catch (err: any) {
    console.error("[POST /api/mentor/session] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to update session" }, { status: 500 });
  }
}

