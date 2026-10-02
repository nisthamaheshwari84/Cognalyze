import { NextResponse } from "next/server";
import { splitIntoResumes, splitTxtIntoResumes, extractPagesText } from "@/lib/ai/resumeSplitter";
import { rankAllCandidates } from "@/lib/ai/twoPassRanker";
import { jobs } from "@/lib/ai/jobStore";
import { sanitizePromptInput } from "@/lib/resilience/security";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("resumeFile") as File;
    const rawJobDescription = (formData.get("jobDescription") as string) || "";

    // 1. Resilient JD Handling (Section 11: Support short, long, or unformatted JDs gracefully)
    const { cleanText: sanitizedJd } = sanitizePromptInput(rawJobDescription, 8000);
    const effectiveJd = sanitizedJd.trim().length > 0
      ? sanitizedJd.trim()
      : "General Software Engineering Role: Evaluate candidates on problem solving, coding fundamentals, architecture, and engineering execution.";

    if (!file) {
      return NextResponse.json({
        error: "no_file",
        userMessage: "No file was selected. Please upload a .pdf or .txt resume bundle."
      }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase();
    let candidates: any[] = [];

    // 2. Extract pages/resumes defensively
    if (ext === "pdf") {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const pageTexts = await extractPagesText(buffer);
        if (pageTexts.length === 0) {
          return NextResponse.json({
            error: "scanned_or_empty_pdf",
            userMessage: "Could not extract text from this PDF. It may be a scanned image or empty. Please ensure it contains selectable text or upload a .txt file."
          }, { status: 422 });
        }
        candidates = splitIntoResumes(pageTexts);
      } catch (pdfErr: any) {
        return NextResponse.json({
          error: "pdf_corrupt",
          userMessage: "We couldn't read this PDF file. It may be damaged or password-protected. Try re-saving or uploading a .txt format."
        }, { status: 422 });
      }
    } else if (ext === "txt") {
      try {
        const text = await file.text();
        candidates = splitTxtIntoResumes(text);
      } catch (txtErr: any) {
        return NextResponse.json({
          error: "txt_read_error",
          userMessage: "Failed to read the text file. Please ensure it is saved in UTF-8 encoding."
        }, { status: 422 });
      }
    } else {
      return NextResponse.json({
        error: "unsupported_type",
        userMessage: `File format .${ext} is not supported. Please upload a .pdf or .txt document.`
      }, { status: 400 });
    }

    if (candidates.length === 0) {
      return NextResponse.json({
        error: "no_resumes_detected",
        userMessage: "No distinct candidate resumes could be identified in the uploaded document. Ensure resumes have recognizable headers or page dividers."
      }, { status: 422 });
    }

    // Support high-scale batches (Section 10: 1 to 2000+ resumes)
    const maxBulkLimit = 2500;
    if (candidates.length > maxBulkLimit) {
      return NextResponse.json({
        error: "batch_exceeds_limit",
        userMessage: `Detected ${candidates.length} resumes. To ensure optimal processing performance, please split batches larger than ${maxBulkLimit} resumes.`
      }, { status: 400 });
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    jobs.set(jobId, {
      status: "processing",
      progress: 0,
      total: candidates.length,
      phase: "Scoring candidates",
      detectedCount: candidates.length,
      successfulCount: 0,
      failedCount: 0,
      reviewCount: 0
    });

    const responseBody = {
      success: true,
      jobId,
      detectedCount: candidates.length,
      userMessage: `Successfully queued ${candidates.length} resumes for evidence-based ranking.`
    };

    // Background chunked processing (Section 10: Partial success tracking)
    rankAllCandidates(candidates, effectiveJd, ({ completed, total, phase }: { completed: number; total: number; phase: string }) => {
      const current = jobs.get(jobId) || {};
      const phaseMsg = phase === "scoring" ? "Scoring candidates" : "Debriefing & ranking";
      jobs.set(jobId, {
        ...current,
        progress: completed,
        total,
        phase: phaseMsg
      });
    })
      .then(({ ranked, failed, committeeReport }) => {
        const current = jobs.get(jobId) || {};
        jobs.set(jobId, {
          ...current,
          status: "complete",
          progress: candidates.length,
          total: candidates.length,
          phase: "done",
          ranked,
          failed,
          successfulCount: ranked.length,
          failedCount: failed.length,
          reviewCount: failed.length,
          committeeReport: committeeReport || `${ranked.length} candidates processed successfully. ${failed.length} need human review.`,
          summaryMessage: failed.length > 0
            ? `${ranked.length} processed successfully. ${failed.length} need review.`
            : `All ${ranked.length} candidates processed successfully with verified evidence.`
        });
      })
      .catch((err: any) => {
        console.error(`[bulk-upload] Job ${jobId} failed:`, err);
        const current = jobs.get(jobId) || {};
        jobs.set(jobId, {
          ...current,
          status: "error",
          error: err.message || "An unexpected error occurred during ranking.",
          userMessage: "The ranking process paused. Any processed results were preserved. You can resume or retry."
        });
      });

    return NextResponse.json(responseBody);
  } catch (error: any) {
    console.error("[POST /api/bulk-upload] Error:", error);
    return NextResponse.json({
      error: "server_error",
      userMessage: "I couldn't process this bulk upload right now. Your data is safe. Please try again."
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({ error: "Missing jobId parameter" }, { status: 400 });
    }

    const job = jobs.get(jobId);
    if (!job) {
      return NextResponse.json({
        error: "job_not_found",
        userMessage: "Job session not found or expired. Please upload your batch again."
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      ...job
    });
  } catch (error: any) {
    return NextResponse.json({
      error: "status_error",
      userMessage: "Failed to retrieve status. Please refresh."
    }, { status: 500 });
  }
}