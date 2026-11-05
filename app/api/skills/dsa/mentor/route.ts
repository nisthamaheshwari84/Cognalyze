/**
 * app/api/skills/dsa/mentor/route.ts
 * 
 * Dedicated & Contextual DSA Mentor Endpoint.
 * 
 * Supports:
 * - Socratic problem guidance in English and Hinglish
 * - Line-by-line code debugging & test output reasoning
 * - Image vision analysis (whiteboard diagrams, notes, screenshots)
 * - Web Speech audio synthesis summary
 */

import { NextRequest, NextResponse } from "next/server";
import { executeDsaMentorTurn } from "@/lib/skills/dsa-mentor-service";
import { getAuthenticatedContext } from "@/lib/auth/server";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    const body = await req.json();

    const studentId = auth?.user?.id || (body.studentId === "student-demo" ? "student-demo" : body.studentId || "guest");
    const {
      message = "",
      code = "",
      language = "python",
      problemId,
      imageBase64,
      history = [],
      voiceRequested = false
    } = body;

    // Validate image format if present
    if (imageBase64 && typeof imageBase64 === "string") {
      if (!imageBase64.startsWith("data:image/") || imageBase64.length > 5 * 1024 * 1024) {
        return NextResponse.json({
          success: false,
          error: "Invalid image format or size exceeds 5MB limit. Please upload JPEG, PNG, or WebP."
        }, { status: 400 });
      }
    }

    const result = await executeDsaMentorTurn({
      studentId,
      message,
      code,
      language,
      problemId,
      imageBase64,
      history,
      voiceRequested
    });

    return NextResponse.json({
      success: true,
      studentId,
      ...result
    });
  } catch (err: any) {
    console.error("[POST /api/skills/dsa/mentor] Error:", err);
    return NextResponse.json({
      success: false,
      error: err.message || "Failed to process DSA mentor turn"
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const problemId = searchParams.get("problemId") || "";

    return NextResponse.json({
      success: true,
      status: "online",
      model: "llama-3.3-70b-versatile (Groq) + llama-3.2-11b-vision-preview",
      capabilities: ["text", "code_context", "image_vision", "voice_synthesis", "hinglish"],
      defaultPrompts: [
        "Explain the core invariant of this problem",
        "How do I choose the correct data structure?",
        "Walk me through a dry run of the optimal approach",
        "What are the tricky edge cases I might miss?"
      ]
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

