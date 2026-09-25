import { NextRequest, NextResponse } from "next/server";
import { extractSemanticRoleFromJd, extractStructuredRoleFromJd } from "@/lib/roles/role-extractor";
import { extractJdRequirements } from "@/lib/intelligence/jd-extractor";

export async function POST(req: NextRequest) {
  try {
    let jdText = "";
    let fallbackTitle = "Software Engineer";
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const textParam = formData.get("jdText") as string | null;
      const titleParam = formData.get("fallbackTitle") as string | null;
      if (titleParam && titleParam.trim()) fallbackTitle = titleParam.trim();

      if (textParam && textParam.trim()) {
        jdText = textParam.trim();
      } else if (file) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = file.name.toLowerCase();

        if (fileName.endsWith(".txt") || fileName.endsWith(".md") || fileName.endsWith(".json")) {
          jdText = buffer.toString("utf-8");
        } else if (fileName.endsWith(".pdf")) {
          try {
            const pdfParse = require("pdf-parse");
            const pdfData = await pdfParse(buffer);
            jdText = pdfData.text || "";
          } catch (pdfErr) {
            jdText = buffer.toString("utf-8").replace(/[^\x20-\x7E\n]/g, " ");
          }
        } else if (fileName.endsWith(".docx")) {
          // DOCX XML string extraction fallback
          const raw = buffer.toString("utf-8");
          const xmlMatches = raw.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
          if (xmlMatches && xmlMatches.length > 0) {
            jdText = xmlMatches.map(m => m.replace(/<[^>]+>/g, "")).join(" ");
          } else {
            jdText = raw.replace(/[^\x20-\x7E\n]/g, " ");
          }
        } else {
          jdText = buffer.toString("utf-8");
        }
      }
    } else {
      const body = await req.json();
      jdText = body.jdText || "";
      if (body.fallbackTitle || body.title) fallbackTitle = (body.fallbackTitle || body.title).trim();
    }

    if (!jdText || typeof jdText !== "string" || !jdText.trim()) {
      return NextResponse.json(
        { success: false, error: "A non-empty job description or file is required." },
        { status: 400 }
      );
    }

    // Run semantic Role DNA intelligence pipeline
    let structuredResult;
    try {
      structuredResult = await extractSemanticRoleFromJd(jdText, fallbackTitle);
    } catch (parseErr) {
      console.warn("[analyze-jd] Semantic parser fallback to deterministic:", parseErr);
      structuredResult = extractStructuredRoleFromJd(jdText, fallbackTitle);
    }

    // Also obtain legacy fields for backward compatibility if needed
    let legacyResult = null;
    try {
      legacyResult = await extractJdRequirements(jdText);
    } catch {
      // Non-fatal if legacy LLM call is unavailable
    }

    return NextResponse.json({
      success: true,
      result: structuredResult,
      roleDna: structuredResult.roleDna,
      ...legacyResult, // backward compatibility
      structured: structuredResult
    });
  } catch (error: any) {
    console.error("Error in /api/recruiter/analyze-jd:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to analyze job description." },
      { status: 500 }
    );
  }
}
