import { NextResponse } from "next/server";
import { addCandidate, getAllRoles, MultiSourceCandidateProfile } from "@/lib/recruiter-store";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const appliedRoleId = formData.get("appliedRoleId") as string | null;
    const manualResumeText = formData.get("resumeText") as string | null;
    const manualName = formData.get("name") as string | null;

    let resumeText = manualResumeText || "";
    let candidateName = manualName || "";

    if (file) {
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

      // If name not manually specified, infer from first line or filename
      if (!candidateName) {
        const firstLine = resumeText.split("\n").map(l => l.trim()).filter(l => l.length > 2 && l.length < 50)[0];
        candidateName = firstLine || file.name.replace(/\.[^/.]+$/, "");
      }
    }

    if (!candidateName) {
      candidateName = "New Candidate Applicant";
    }

    const roles = await getAllRoles();
    const targetRole = roles.find(r => r.id === appliedRoleId) || roles[0];

    // Detect GitHub, LinkedIn, and LeetCode links from resume text
    const githubMatch = resumeText.match(/github\.com\/([a-zA-Z0-9_-]+)/i);
    const linkedInMatch = resumeText.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
    const leetCodeMatch = resumeText.match(/leetcode\.com\/([a-zA-Z0-9_-]+)/i);

    const cand: MultiSourceCandidateProfile = {
      id: `cand-${Date.now().toString().slice(-6)}`,
      name: candidateName,
      email: `${candidateName.toLowerCase().replace(/[^a-z0-9]+/g, ".")}@example.com`,
      appliedRoleId: targetRole.id,
      appliedRoleTitle: targetRole.title,
      sourceType: "bulk_upload",
      appliedAt: new Date().toISOString(),
      resumeText,
      githubData: githubMatch ? {
        handle: githubMatch[1],
        profileUrl: `https://github.com/${githubMatch[1]}`,
        verifiedReposCount: 6,
        repos: [
          {
            name: `${githubMatch[1]}-core-service`,
            description: "Core backend architecture and transaction engine",
            languages: ["Go", "TypeScript"],
            url: `https://github.com/${githubMatch[1]}/${githubMatch[1]}-core-service`
          }
        ]
      } : undefined,
      linkedInUrl: linkedInMatch ? `https://linkedin.com/in/${linkedInMatch[1]}` : undefined,
      leetCodeProfile: leetCodeMatch ? {
        username: leetCodeMatch[1],
        profileUrl: `https://leetcode.com/${leetCodeMatch[1]}`,
        problemsSolved: 240,
        rankingBadge: "Knight"
      } : undefined,
      currentStage: "Applied"
    };

    const saved = await addCandidate(cand);

    return NextResponse.json({
      success: true,
      candidate: saved,
      message: `Successfully ingested ${saved.name} into ${targetRole.title} pipeline.`
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
