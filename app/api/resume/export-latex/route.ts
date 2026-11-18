import { NextResponse } from "next/server";
import {
  generateResumeLaTeX,
  LaTeXTemplateFamily,
} from "@/lib/resume/latex-engine";
import { convertResumeDocumentToOptimizedContent } from "@/lib/resume/converter";
import { ResumeDocument } from "@/lib/resume/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    let latexSource = body.latexSource;
    const filename = (body.filename || "resume").replace(/[^a-zA-Z0-9_-]/g, "_");

    if (!latexSource && body.document) {
      const doc = body.document as ResumeDocument;
      const optimized = convertResumeDocumentToOptimizedContent(doc);
      const template = (body.template || doc.settings?.template || "ats-classic") as LaTeXTemplateFamily;
      latexSource = generateResumeLaTeX(optimized, {
        template,
        paperSize: doc.settings?.paperSize === "Letter" ? "letterpaper" : "a4paper",
        fontSize: "10pt",
      });
    }

    if (!latexSource) {
      return NextResponse.json(
        { error: "Missing latexSource or document payload" },
        { status: 400 }
      );
    }

    return new Response(latexSource, {
      status: 200,
      headers: {
        "Content-Type": "application/x-latex; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.tex"`,
      },
    });
  } catch (error: any) {
    console.error("[export-latex] Error generating LaTeX download:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to export LaTeX" },
      { status: 500 }
    );
  }
}

