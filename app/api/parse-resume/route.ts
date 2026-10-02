import { NextResponse } from "next/server";
import { groqFetch } from "@/lib/groq";
import { sanitizePromptInput } from "@/lib/resilience/security";

export async function POST(req: Request) {
  try {
    let payload: any = {};
    try {
      payload = await req.json();
    } catch {
      return NextResponse.json(
        {
          error: "invalid_payload",
          userMessage: "Invalid request payload. Please upload your resume file again.",
          text: ""
        },
        { status: 400 }
      );
    }

    const { imageBase64, mimeType, filename = "resume.pdf" } = payload || {};

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        {
          error: "missing_content",
          userMessage: "No file content was detected. Please select a valid resume document.",
          text: ""
        },
        { status: 400 }
      );
    }

    // Safety check: Prevent memory exhaustion on oversized base64 strings (> 20MB base64 ≈ 15MB file)
    if (imageBase64.length > 20 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: "file_too_large",
          userMessage: "The uploaded file exceeds the 15MB limit. Please upload a condensed resume.",
          text: ""
        },
        { status: 413 }
      );
    }

    // 1. PDF Parsing
    if (mimeType === "application/pdf" || filename.toLowerCase().endsWith(".pdf")) {
      try {
        const { PDFParse } = require("pdf-parse");
        const buffer = Buffer.from(imageBase64, "base64");
        
        if (buffer.length < 10) {
          return NextResponse.json({
            error: "empty_pdf",
            userMessage: "The uploaded PDF appears to be empty (0 bytes). Please upload a valid document.",
            text: ""
          });
        }

        const parser = new PDFParse({ data: buffer });
        const data = await parser.getText();
        await parser.destroy();

        const rawText = data?.text || "";
        // Clean null characters and binary noise
        const sanitizedText = rawText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "").trim();

        if (sanitizedText.length > 10) {
          const pageTexts = sanitizedText
            .split("\f")
            .map((p: string) => p.trim())
            .filter((p: string) => p.length > 0);

          return NextResponse.json({
            success: true,
            text: sanitizedText,
            pages: pageTexts.length > 0 ? pageTexts : [sanitizedText],
            pageCount: pageTexts.length || 1,
            isScanned: false
          });
        }
      } catch (pdfErr) {
        console.warn("[parse-resume] PDFParse error, falling back to OCR / vision:", pdfErr);
      }

      // If text is too short or PDF is scanned image
      return NextResponse.json({
        success: false,
        error: "scanned_pdf",
        userMessage: "We couldn't reliably extract text from this PDF. It may be a scanned image or flattened canvas. You can paste your resume text directly or upload another format.",
        text: "",
        pages: []
      });
    }

    // 2. Plain Text / Markdown Files
    if (mimeType?.includes("text") || filename.toLowerCase().endsWith(".txt")) {
      try {
        const decoded = Buffer.from(imageBase64, "base64").toString("utf-8");
        const clean = decoded.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "").trim();
        return NextResponse.json({
          success: true,
          text: clean,
          pages: [clean],
          pageCount: 1,
          isScanned: false
        });
      } catch {
        // Fallback
      }
    }

    // 3. Image OCR via Vision LLM Fallback
    try {
      const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROQ_API_KEY || ""}`
        },
        body: JSON.stringify({
          model: "meta-llama/llama-4-scout-17b-16e-instruct",
          messages: [{
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mimeType || "image/jpeg"};base64,${imageBase64}` }
              },
              {
                type: "text",
                text: "Extract all text from this resume faithfully without omitting details. Return only the raw text."
              }
            ]
          }],
          max_tokens: 1500
        })
      });

      if (res && res.ok) {
        const data = await res.json();
        const extractedText = data?.choices?.[0]?.message?.content?.trim();
        if (extractedText && extractedText.length > 10) {
          return NextResponse.json({
            success: true,
            text: extractedText,
            pages: [extractedText],
            pageCount: 1,
            isScanned: true
          });
        }
      }
    } catch (visionErr) {
      console.warn("[parse-resume] Vision extraction fallback error:", visionErr);
    }

    return NextResponse.json({
      success: false,
      error: "unextractable",
      userMessage: "We couldn't reliably extract text from this document. You can retry or paste your text directly into Resume Studio.",
      text: ""
    });

  } catch (error: any) {
    console.error("[POST /api/parse-resume] Unhandled error:", error);
    return NextResponse.json({
      success: false,
      error: "parse_error",
      userMessage: "I couldn't process this resume right now. Your data is safe. Try uploading again or paste text directly.",
      text: ""
    }, { status: 200 }); // Return 200 with structured failure so frontend receives a clean state instead of 500
  }
}