import { NextResponse } from "next/server";
import { analyzeResumeIntelligence } from "@/lib/ai/resume-intelligence-engine";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { resume, jd } = await req.json();

    if (!resume || typeof resume !== "string" || !resume.trim()) {
      return NextResponse.json({ error: "Resume text is required." }, { status: 400 });
    }

    const report = await analyzeResumeIntelligence(resume, jd || "");
    const rewriter = report.rewriter;

    // Collect all evidence drawer items
    const evidenceDrawer = [
      ...rewriter.experience.flatMap((e) => e.bullets || []),
      ...rewriter.projects.flatMap((p) => p.bullets || []),
    ];

    // Build standard markdown representation of the rewritten resume
    const mdParts: string[] = [];
    mdParts.push(`# CANDIDATE RESUME\n`);
    if (rewriter.summary) {
      mdParts.push(`## PROFESSIONAL SUMMARY\n${rewriter.summary}\n`);
    }

    if (rewriter.skills && rewriter.skills.length > 0) {
      mdParts.push(`## TECHNICAL SKILLS`);
      for (const skillGroup of rewriter.skills) {
        mdParts.push(`- **${skillGroup.category}:** ${skillGroup.items.join(", ")}`);
      }
      mdParts.push("");
    }

    if (rewriter.experience && rewriter.experience.length > 0) {
      mdParts.push(`## WORK EXPERIENCE`);
      for (const exp of rewriter.experience) {
        mdParts.push(`### ${exp.role} — ${exp.company} (${exp.period})`);
        for (const b of exp.bullets) {
          mdParts.push(`- ${b.rewrittenText}`);
        }
        mdParts.push("");
      }
    }

    if (rewriter.projects && rewriter.projects.length > 0) {
      mdParts.push(`## TECHNICAL PROJECTS`);
      for (const proj of rewriter.projects) {
        mdParts.push(`### ${proj.title} [${proj.tech.join(", ")}]`);
        for (const b of proj.bullets) {
          mdParts.push(`- ${b.rewrittenText}`);
        }
        mdParts.push("");
      }
    }

    if (rewriter.education && rewriter.education.length > 0) {
      mdParts.push(`## EDUCATION`);
      for (const edu of rewriter.education) {
        mdParts.push(`- **${edu.degree}** | ${edu.institution} (${edu.year})${edu.details ? ` — ${edu.details}` : ""}`);
      }
      mdParts.push("");
    }

    return NextResponse.json({
      rewritten_resume: mdParts.join("\n"),
      structured_resume: rewriter,
      evidence_drawer: evidenceDrawer,
      zero_fabrication_certified: rewriter.zeroFabricationCertified,
      ats_structure_score: rewriter.atsStructureScore,
      ats_notes: rewriter.atsNotes,
      report, // Unified single source of truth report
    });
  } catch (error: any) {
    console.error("[API /api/rewrite-resume] Error:", error);
    return NextResponse.json({ error: error.message || "Failed to rewrite resume." }, { status: 500 });
  }
}