import { NextResponse } from "next/server";
import { requireRecruiterAuth } from "@/lib/auth/server";
import { addCandidate, getAllRoles, MultiSourceCandidateProfile } from "@/lib/recruiter-store";

export async function POST(req: Request) {
  try {
    const authCheck = await requireRecruiterAuth(req);
    if (!authCheck.success) return authCheck.response;

    const contentType = req.headers.get("content-type") || "";
    let resumeText = "";
    let candidateName = "";
    let appliedRoleId: string | null = null;
    let uploadedFileName = "Uploaded Resume.txt";

    if (contentType.includes("application/json")) {
      const jsonBody = await req.json();
      resumeText = jsonBody.resumeText || "";
      candidateName = jsonBody.name || "";
      appliedRoleId = jsonBody.appliedRoleId || null;
    } else {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      appliedRoleId = formData.get("appliedRoleId") as string | null;
      const manualResumeText = formData.get("resumeText") as string | null;
      const manualName = formData.get("name") as string | null;

      resumeText = manualResumeText || "";
      candidateName = manualName || "";

      if (file) {
        uploadedFileName = file.name;
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = file.name.toLowerCase();

        if (fileName.endsWith(".txt") || fileName.endsWith(".json") || fileName.endsWith(".md")) {
          resumeText = buffer.toString("utf-8");
        } else if (fileName.endsWith(".pdf")) {
          try {
            const pdfParse = require("pdf-parse");
            const pdfData = await pdfParse(buffer);
            resumeText = pdfData.text || "";
          } catch (pdfErr) {
            // Fallback text extraction
            resumeText = buffer.toString("utf-8").replace(/[^\x20-\x7E\n]/g, " ");
          }
        } else {
          resumeText = buffer.toString("utf-8");
        }

        if (!candidateName) {
          candidateName = file.name.replace(/\.[^/.]+$/, "");
        }
      }
    }

    if (!candidateName) {
      const firstLine = resumeText.split("\n").map(l => l.trim()).filter(l => l.length > 2 && l.length < 50)[0];
      candidateName = firstLine || "New Candidate Applicant";
    }

    if (!candidateName) {
      candidateName = "New Candidate Applicant";
    }

    const roles = await getAllRoles();
    const targetRole = roles.find(r => r.id === appliedRoleId) || roles[0];

    // Extract real contact information from resume text (zero hallucination)
    const emailMatch = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const phoneMatch = resumeText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    const candidateEmail = emailMatch ? emailMatch[0] : "";
    const candidatePhone = phoneMatch ? phoneMatch[0] : undefined;

    // Detect GitHub, LinkedIn, and LeetCode links from resume text
    const githubMatch = resumeText.match(/github\.com\/([a-zA-Z0-9_-]+)/i);
    const linkedInMatch = resumeText.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
    const leetCodeMatch = resumeText.match(/leetcode\.com\/([a-zA-Z0-9_-]+)/i);

    const cand: MultiSourceCandidateProfile = {
      id: `cand-${Date.now().toString().slice(-6)}`,
      name: candidateName,
      email: candidateEmail,
      phone: candidatePhone,
      appliedRoleId: targetRole.id,
      appliedRoleTitle: targetRole.title,
      sourceType: "bulk_upload",
      appliedAt: new Date().toISOString(),
      resumeText,
      githubData: githubMatch ? {
        handle: githubMatch[1],
        profileUrl: `https://github.com/${githubMatch[1]}`,
        verifiedReposCount: 0,
        repos: []
      } : undefined,
      linkedInUrl: linkedInMatch ? `https://linkedin.com/in/${linkedInMatch[1]}` : undefined,
      leetCodeProfile: leetCodeMatch ? {
        username: leetCodeMatch[1],
        profileUrl: `https://leetcode.com/${leetCodeMatch[1]}`,
        problemsSolved: 0,
        rankingBadge: "Pending Verification"
      } : undefined,
      currentStage: "Applied"
    };

    const saved = await addCandidate(cand);

    // Also persist resume to persistent Resume Vault and Supabase
    try {
      const { saveResumeRecord } = await import("@/lib/resume/store");
      await saveResumeRecord({
        candidateId: saved.id,
        candidateName: saved.name,
        candidateEmail: saved.email,
        fileName: uploadedFileName,
        parsedText: resumeText,
        skills: [],
        projects: []
      });
    } catch {}

    return NextResponse.json({
      success: true,
      candidate: saved,
      message: `Successfully ingested ${saved.name} into ${targetRole.title} pipeline.`
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
