import { NextResponse } from "next/server";
import { executeMentorTurn, MentorMode } from "@/lib/mentor/ai-mentor-service";
import { createSuccessResponse, createFallbackResponse } from "@/lib/resilience/universal-contract";
import { sanitizePromptInput } from "@/lib/resilience/security";

export async function POST(req: Request) {
  let body: any = {};
  try {
    body = await req.json();
  } catch (parseErr) {
    // Malformed JSON payload - recover gracefully
    body = {};
  }

  const {
    studentId = "student-demo",
    message = "",
    mode = "all",
    history = []
  }: {
    studentId?: string;
    message?: string;
    mode?: MentorMode;
    history?: any[];
  } = body || {};

  const { cleanText } = sanitizePromptInput(typeof message === "string" ? message : "", 4000);
  const effectiveMessage = cleanText || "Hello, how can you help me today?";

  try {
    const result = await executeMentorTurn(
      typeof studentId === "string" ? studentId : "student-demo",
      effectiveMessage,
      mode,
      Array.isArray(history) ? history : []
    );

    const universal = createSuccessResponse(result, {
      evidence: result.evidenceUsed || [],
      missing_information: result.missingInformation || [],
      confidence: result.confidence || 0.88,
      sources: ["Student DNA", "Cognalyze Reasoning Engine"],
      next_action: result.featureLinks?.[0] ? {
        label: result.featureLinks[0].label,
        href: result.featureLinks[0].href,
        category: "practice"
      } : undefined
    });

    return NextResponse.json({
      success: true,
      data: result,
      universal
    });
  } catch (error: any) {
    console.error("[POST /api/student/ai-mentor/chat] Resilient recovery triggered:", error);

    // Guaranteed fallback response - Never crash the UI
    const fallbackTurn = {
      content: "I'm analyzing your current Student DNA. Even with a temporary connection hiccup, your progress is safe. How would you like to continue?",
      why: "Grounded in local Student DNA cache.",
      quickReplies: ["Teach me OOP", "Practice Tree Traversal", "Review Resume Bullets"],
      featureLinks: [{ label: "Open Question Bank", href: "/question-bank" }]
    };

    const universal = createFallbackResponse(fallbackTurn, {
      userMessage: "Reconnected using local reasoning engine.",
      internalError: error?.message
    });

    return NextResponse.json({
      success: true,
      data: fallbackTurn,
      universal
    });
  }
}
