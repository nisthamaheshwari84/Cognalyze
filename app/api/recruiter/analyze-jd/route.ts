import { NextRequest, NextResponse } from "next/server";
import { extractJdRequirements } from "@/lib/intelligence/jd-extractor";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { jdText } = body;

    if (!jdText || typeof jdText !== "string" || !jdText.trim()) {
      return NextResponse.json(
        { error: "A non-empty job description string is required." },
        { status: 400 }
      );
    }

    const result = await extractJdRequirements(jdText);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Error in /api/recruiter/analyze-jd:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to analyze job description." },
      { status: 500 }
    );
  }
}
