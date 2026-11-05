import { NextRequest, NextResponse } from "next/server";
import { groqFetch } from "@/lib/groq";
import { sanitizePromptInput } from "@/lib/resilience/security";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { recordStudentEvent } from "@/lib/intelligence/student-intelligence";
import { invalidateStudentDNACache } from "@/lib/ai/student-dna";
import { upsertStudentProfileByUserId } from "@/lib/auth/store";
import { upsertStudentProfile } from "@/lib/placement-store";
import { saveResumeRecord } from "@/lib/resume/store";
import { extractEvidenceClaimsFromResume, ExtractedEvidence } from "@/lib/evidence/resume-matcher";

// ============================================================
// 1. HELPER: EXTRACT TEXT FROM DOCX BUFFER (USING YAUZL)
// ============================================================
async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  return new Promise((resolve) => {
    try {
      const yauzl = require("yauzl");
      yauzl.fromBuffer(buffer, { lazyEntries: true }, (err: any, zipfile: any) => {
        if (err || !zipfile) {
          // Fallback to raw XML string matching
          const raw = buffer.toString("utf-8");
          const xmlMatches = raw.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
          if (xmlMatches && xmlMatches.length > 0) {
            return resolve(xmlMatches.map((m) => m.replace(/<[^>]+>/g, "")).join(" "));
          }
          return resolve("");
        }

        let documentXmlFound = false;
        zipfile.readEntry();

        zipfile.on("entry", (entry: any) => {
          if (entry.fileName === "word/document.xml") {
            documentXmlFound = true;
            zipfile.openReadStream(entry, (streamErr: any, readStream: any) => {
              if (streamErr) return resolve("");
              const chunks: Buffer[] = [];
              readStream.on("data", (chunk: Buffer) => chunks.push(chunk));
              readStream.on("end", () => {
                const xml = Buffer.concat(chunks).toString("utf-8");
                // Break into paragraphs
                const paragraphs = xml.split(/<\/w:p>/g);
                const text = paragraphs
                  .map((p) => {
                    const matches = p.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
                    return matches ? matches.map((m) => m.replace(/<[^>]+>/g, "")).join("") : "";
                  })
                  .filter((p) => p.trim().length > 0)
                  .join("\n");
                resolve(text);
              });
            });
          } else {
            zipfile.readEntry();
          }
        });

        zipfile.on("end", () => {
          if (!documentXmlFound) resolve("");
        });

        zipfile.on("error", () => resolve(""));
      });
    } catch {
      resolve("");
    }
  });
}

// ============================================================
// 2. MAIN API HANDLER: POST /api/parse-resume
// ============================================================
export async function POST(req: NextRequest) {
  try {
    let filename = "resume.pdf";
    let mimeType = "application/pdf";
    let buffer: Buffer | null = null;
    let rawText = "";
    let candidateId = "student-demo";

    const contentType = req.headers.get("content-type") || "";

    // ── A. Handle multipart/form-data ──
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = (formData.get("resume") || formData.get("file")) as File | null;
      candidateId = (formData.get("candidateId") as string) || candidateId;
      const manualText = (formData.get("resumeText") || formData.get("text")) as string | null;

      if (manualText && manualText.trim().length > 0) {
        rawText = manualText.trim();
      }

      if (file) {
        filename = file.name || "resume.pdf";
        mimeType =
          file.type ||
          (filename.toLowerCase().endsWith(".pdf")
            ? "application/pdf"
            : filename.toLowerCase().endsWith(".docx")
            ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            : filename.toLowerCase().endsWith(".txt")
            ? "text/plain"
            : "application/octet-stream");
        buffer = Buffer.from(await file.arrayBuffer());
      }
    } else {
      // ── B. Handle application/json ──
      try {
        const payload = await req.json();
        candidateId = payload.candidateId || candidateId;
        filename = payload.filename || filename;
        mimeType = payload.mimeType || mimeType;

        if (payload.resumeText || payload.text) {
          rawText = (payload.resumeText || payload.text).trim();
        } else if (payload.imageBase64) {
          buffer = Buffer.from(payload.imageBase64, "base64");
        }
      } catch {
        return NextResponse.json(
          {
            success: false,
            error: "invalid_payload",
            userMessage: "Invalid request payload. Please select and upload your resume again.",
            text: "",
          },
          { status: 400 }
        );
      }
    }

    // Safety check: Validate presence of input
    if ((!buffer || buffer.length === 0) && !rawText) {
      return NextResponse.json(
        {
          success: false,
          error: "missing_content",
          userMessage: "No file content was detected. Please select a valid resume document (.pdf, .docx, .txt).",
          text: "",
        },
        { status: 400 }
      );
    }

    // Safety check: Prevent memory exhaustion on oversized files (> 20MB)
    if (buffer && buffer.length > 20 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          error: "file_too_large",
          userMessage: "The uploaded file exceeds the 20MB limit. Please upload a condensed resume document.",
          text: "",
        },
        { status: 413 }
      );
    }

    let sanitizedText = rawText;

    // ── C. Parse Binary File According to Extension / MimeType ──
    if (!sanitizedText && buffer) {
      const lowerName = filename.toLowerCase();

      // 1. PDF Parsing
      if (mimeType === "application/pdf" || lowerName.endsWith(".pdf")) {
        try {
          const pdfParseMod = require("pdf-parse");
          const PDFParse =
            pdfParseMod.PDFParse ||
            pdfParseMod.default?.PDFParse ||
            pdfParseMod.default ||
            pdfParseMod;

          if (typeof PDFParse === "function") {
            const parser = new PDFParse({ data: buffer });
            const data = await parser.getText();
            await parser.destroy();
            const rawPdfText = data?.text || "";
            sanitizedText = rawPdfText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "").trim();
          }
        } catch (pdfErr) {
          console.warn("[parse-resume] PDFParse error, trying buffer text stream fallback:", pdfErr);
        }

        // Buffer text stream fallback if PDFParse caught error or scanned/empty
        if (!sanitizedText || sanitizedText.length < 25) {
          const rawBuf = buffer.toString("utf-8");
          const textChunks =
            rawBuf.match(/\(([^()]+)\)\s*Tj/g) || rawBuf.match(/\[(.*?)\]\s*TJ/g);
          if (textChunks && textChunks.length > 5) {
            sanitizedText = textChunks
              .map((c) => c.replace(/[()[\]\sTjTJ]/g, " "))
              .join(" ")
              .replace(/\s+/g, " ")
              .trim();
          }
        }
      }

      // 2. DOCX Parsing
      else if (
        lowerName.endsWith(".docx") ||
        lowerName.endsWith(".doc") ||
        mimeType.includes("wordprocessingml")
      ) {
        try {
          sanitizedText = await extractTextFromDocx(buffer);
        } catch (docxErr) {
          console.warn("[parse-resume] DOCX extraction error:", docxErr);
        }

        // Raw XML text fallback
        if (!sanitizedText || sanitizedText.length < 25) {
          const raw = buffer.toString("utf-8");
          const xmlMatches = raw.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
          if (xmlMatches && xmlMatches.length > 0) {
            sanitizedText = xmlMatches
              .map((m) => m.replace(/<[^>]+>/g, ""))
              .join(" ")
              .trim();
          } else {
            sanitizedText = raw.replace(/[^\x20-\x7E\n\r\t]/g, " ").trim();
          }
        }
      }

      // 3. Plain Text / Markdown / CSV / JSON
      else if (
        mimeType.includes("text") ||
        lowerName.endsWith(".txt") ||
        lowerName.endsWith(".md") ||
        lowerName.endsWith(".json")
      ) {
        sanitizedText = buffer
          .toString("utf-8")
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
          .trim();
      }

      // 4. Image Formats (Vision Fallback)
      else if (
        mimeType.includes("image") ||
        lowerName.endsWith(".png") ||
        lowerName.endsWith(".jpg") ||
        lowerName.endsWith(".jpeg") ||
        lowerName.endsWith(".webp")
      ) {
        try {
          const base64 = buffer.toString("base64");
          const res = await groqFetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.GROQ_API_KEY || ""}`,
            },
            body: JSON.stringify({
              model: "meta-llama/llama-4-scout-17b-16e-instruct",
              messages: [
                {
                  role: "user",
                  content: [
                    {
                      type: "image_url",
                      image_url: { url: `data:${mimeType || "image/jpeg"};base64,${base64}` },
                    },
                    {
                      type: "text",
                      text: "Extract all text from this resume faithfully. Return only the raw text.",
                    },
                  ],
                },
              ],
              max_tokens: 1500,
            }),
          });

          if (res && res.ok) {
            const data = await res.json();
            sanitizedText = data?.choices?.[0]?.message?.content?.trim() || "";
          }
        } catch (visionErr) {
          console.warn("[parse-resume] Image Vision extraction error:", visionErr);
        }
      }

      // Default fallback
      if (!sanitizedText && buffer.length > 0) {
        sanitizedText = buffer
          .toString("utf-8")
          .replace(/[^\x20-\x7E\n\r\t]/g, " ")
          .replace(/\s+/g, " ")
          .trim();
      }
    }

    // If still no extractable text
    if (!sanitizedText || sanitizedText.trim().length < 15) {
      return NextResponse.json({
        success: false,
        error: "unextractable_document",
        userMessage:
          "We couldn't extract readable text from this document. It may be a flattened image or scanned PDF. You can paste your resume text directly into the modal or upload another file.",
        text: "",
      });
    }

    // ── D. Extract Evidence Claims & Skills & Projects ──
    const extractedData = extractEvidenceClaimsFromResume(sanitizedText);

    // ── E. Determine Target Candidate Identity & Server-Side Authorization (P0 Fix SEC-AUTH-01) ──
    let authContext: any = null;
    try {
      authContext = await getAuthenticatedContext(req);
    } catch {}

    let targetCandidateId: string | null = null;
    let savedResumeId: string | undefined;

    if (authContext?.user) {
      if (authContext.user.accountType === "student") {
        // Enforce candidate identity strictly from authenticated session.
        // If client supplied a candidateId that targets another user -> 403 Forbidden (prevent IDOR)
        if (candidateId && candidateId !== authContext.user.id && candidateId !== "student-demo") {
          return NextResponse.json(
            {
              success: false,
              error: "forbidden_cross_candidate",
              userMessage: "Forbidden. You cannot modify the profile or resume for another candidate.",
              text: "",
            },
            { status: 403 }
          );
        }
        targetCandidateId = authContext.user.id;
      } else if (authContext.user.accountType === "recruiter") {
        // Authorized recruiter workflow
        targetCandidateId = candidateId && candidateId !== "student-demo" ? candidateId : null;
      }
    }

    // ONLY mutate profiles if caller is authenticated with an authorized target candidate
    if (targetCandidateId) {
      // 1. Update Student DNA via recordStudentEvent
      try {
        await recordStudentEvent({
          studentId: targetCandidateId,
          eventType: "resume_uploaded",
          payload: {
            skills: extractedData.skills,
            projects: extractedData.projects,
            filename,
          },
        });
      } catch (dnaErr) {
        console.warn("[parse-resume] Student DNA recording error:", dnaErr);
      }

      // Invalidate cached Student DNA
      invalidateStudentDNACache(targetCandidateId);

      // 2. Update Auth Store Profile
      // Parsing failure protection: do NOT erase existing valid profile data if extraction yielded no skills
      try {
        const { upsertStudentProfileByUserId, getStudentProfileByUserId } = await import("@/lib/auth/store");
        const existingProfile = getStudentProfileByUserId(targetCandidateId);

        const validLevels = ["Beginner", "Intermediate", "Advanced", "Expert"] as const;
        const newSkills = extractedData.skills.map((s) => {
          const level = validLevels.includes(s.proficiency as any)
            ? (s.proficiency as "Beginner" | "Intermediate" | "Advanced" | "Expert")
            : "Intermediate";
          return {
            name: s.name,
            level,
          };
        });

        const newProjects = extractedData.projects.map((p) => ({
          title: p.title,
          description: p.description,
          techStack: p.tech_stack,
        }));

        // Preserve existing profile data (P0 Fix SEC-AUTH-01):
        // Merge newly parsed skills and projects with existing profile data so existing valid data is never erased
        const existingSkills = existingProfile?.skills || [];
        const existingProjects = existingProfile?.projects || [];

        const skillMap = new Map<string, any>();
        for (const s of existingSkills) {
          skillMap.set(s.name.toLowerCase(), s);
        }
        for (const s of newSkills) {
          skillMap.set(s.name.toLowerCase(), s);
        }
        const finalSkills = Array.from(skillMap.values());

        const projectMap = new Map<string, any>();
        for (const p of existingProjects) {
          projectMap.set(p.title.toLowerCase(), p);
        }
        for (const p of newProjects) {
          projectMap.set(p.title.toLowerCase(), p);
        }
        const finalProjects = Array.from(projectMap.values());

        const profileUpdates: any = {
          resumeFileName: filename,
          skills: finalSkills,
          projects: finalProjects,
        };

        if (existingProfile?.profileCompleted || finalSkills.length > 0) {
          profileUpdates.profileCompleted = true;
        }

        upsertStudentProfileByUserId(targetCandidateId, profileUpdates);
      } catch (authErr) {
        console.warn("[parse-resume] auth store update error:", authErr);
      }

      // 3. Update Placement Store
      try {
        await upsertStudentProfile({
          candidate_id: targetCandidateId,
          skills: extractedData.skills.map((s) => ({ name: s.name, level: "Intermediate" })),
          past_projects: extractedData.projects.map((p) => ({
            title: p.title,
            tech_stack: p.tech_stack,
            description: p.description,
          })),
          target_roles: ["Software Engineer", "AI/ML Engineer"],
          target_companies_or_events: [],
          availability: "Immediate",
          risk_appetite: "Moderate",
          profile_summary: `Resume parsed: ${filename}. ${extractedData.skills.length} skills, ${extractedData.projects.length} demonstrated projects.`,
        });
      } catch (placeErr) {
        console.warn("[parse-resume] placement store update error:", placeErr);
      }

      // 4. Persist to Resume Vault (disk and Supabase resumes table)
      try {
        const saved = await saveResumeRecord({
          candidateId: targetCandidateId,
          candidateName: authContext?.user?.fullName,
          candidateEmail: authContext?.user?.email,
          fileName: filename,
          parsedText: sanitizedText,
          skills: extractedData.skills,
          projects: extractedData.projects,
        });
        savedResumeId = saved.id;
      } catch (vaultErr) {
        console.warn("[parse-resume] resume vault persist error:", vaultErr);
      }

      // Trigger Opportunity Matching in background against current live database (non-blocking)
      try {
        const { opportunityService } = await import("@/lib/opportunities/opportunity-service");
        opportunityService.getPersonalizedFeed(targetCandidateId, { forceRefresh: false }).catch(() => {});
      } catch {}
    }

    const pageTexts = sanitizedText
      .split("\f")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    return NextResponse.json({
      success: true,
      text: sanitizedText,
      pages: pageTexts.length > 0 ? pageTexts : [sanitizedText],
      pageCount: pageTexts.length || 1,
      filename,
      resumeId: savedResumeId,
      skillsCount: extractedData.skills.length,
      projectsCount: extractedData.projects.length,
      extractedSkills: extractedData.skills,
      extractedProjects: extractedData.projects,
      message: `Resume parsed successfully! Extracted ${extractedData.skills.length} skills and ${extractedData.projects.length} demonstrated projects into Student DNA.`,
    });
  } catch (error: any) {
    console.error("[POST /api/parse-resume] Unhandled error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "parse_error",
        userMessage:
          "I couldn't process this resume document right now. Please try again or paste your resume text directly.",
        text: "",
      },
      { status: 200 }
    );
  }
}