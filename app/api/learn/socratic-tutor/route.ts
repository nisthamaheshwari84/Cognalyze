import { NextRequest, NextResponse } from "next/server";
import {
  generateSocraticTutorReply,
  SocraticTutorRequest
} from "@/lib/skills/learn/socratic-evaluator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      microConceptId,
      userMessage,
      conversationHistory = [],
      language = "en"
    } = body;

    if (!microConceptId) {
      return NextResponse.json(
        { error: "Missing required parameter: microConceptId" },
        { status: 400 }
      );
    }

    if (!userMessage || typeof userMessage !== "string" || userMessage.trim().length === 0) {
      return NextResponse.json(
        { error: "userMessage must be a non-empty string" },
        { status: 400 }
      );
    }

    const payload: SocraticTutorRequest = {
      microConceptId,
      userMessage: userMessage.trim(),
      conversationHistory,
      language: language === "hinglish" ? "hinglish" : "en"
    };

    const replyObj = await generateSocraticTutorReply(payload);
    return NextResponse.json(replyObj);
  } catch (err: any) {
    console.error("[POST /api/learn/socratic-tutor] Error:", err);
    return NextResponse.json(
      { error: err.message || "Failed to generate tutor reply" },
      { status: 500 }
    );
  }
}
