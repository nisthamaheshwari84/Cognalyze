import { NextResponse } from "next/server";
import { rankAllCandidates } from "@/lib/ai/twoPassRanker";
import { jobs } from "@/lib/ai/jobStore";
import { getRoleById, addCandidate } from "@/lib/recruiter-store";

export async function POST(req: Request) {
  try {
    const { jobDescription, candidates, roleId } = await req.json();

    let effectiveJd = (jobDescription || "").trim();
    let targetRoleTitle = "Engineering Role";

    if (roleId) {
      const role = await getRoleById(roleId);
      if (role) {
        targetRoleTitle = role.title;
        const reqLines = (role.tieredRequirements || []).map(
          r => `- ${r.name} (${r.tier}): ${r.description}`
        ).join("\n");
        const outcomeLines = (role.businessOutcomes || []).map(
          o => `- ${o.outcome} [${o.timeframe}]`
        ).join("\n");

        effectiveJd = `Role: ${role.title} (${role.seniority})\nDepartment: ${role.department}\n\nCore Requirements:\n${reqLines}\n\nKey Outcomes:\n${outcomeLines}\n\n${effectiveJd}`;
      }
    }

    if (!effectiveJd || effectiveJd.trim().length < 40) {
      return NextResponse.json({ error: "Job description or Role DNA too short (min 40 characters)" }, { status: 400 });
    }
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return NextResponse.json({ error: "No candidates provided" }, { status: 400 });
    }
    if (candidates.length > 2000) {
      return NextResponse.json({ error: "Max 2000 candidates per batch" }, { status: 400 });
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    
    // Map candidates to match the expected CandidateResult shape: { id, name, resumeText }
    const queueCandidates = candidates.map((c: any, idx: number) => ({
      id: c.id || `bulk-cand-${Date.now()}-${idx}`,
      name: c.name || `Candidate ${idx + 1}`,
      resumeText: c.resume || c.resumeText || c.text || ""
    }));

    jobs.set(jobId, { status: "processing", progress: 0, total: queueCandidates.length, phase: "Scoring candidates" });

    // Fire and forget - runs in background, progress reports update the Map
    rankAllCandidates(queueCandidates, effectiveJd, ({ completed, total, phase }) => {
      const current = jobs.get(jobId) || {};
      const phaseMsg = phase === "scoring" ? "Scoring candidates" : phase === "enriching" ? "Enriching top evidence" : "Debriefing & ranking";
      jobs.set(jobId, { ...current, progress: completed, total, phase: phaseMsg });
    })
      .then(async ({ ranked, failed, committeeReport }) => {
        // Auto-register top ranked candidates into recruiter-store so they are immediately accessible in Decision Room
        const topToRegister = ranked.slice(0, 100);
        for (const c of topToRegister) {
          const original = queueCandidates.find(q => q.id === c.candidate_id);
          try {
            await addCandidate({
              id: c.candidate_id,
              name: c.candidateName,
              email: `${c.candidateName.toLowerCase().replace(/[^a-z0-9]/g, ".")}@example.com`,
              appliedRoleId: roleId || "role-core-systems",
              appliedRoleTitle: targetRoleTitle,
              sourceType: "bulk_upload",
              appliedAt: new Date().toISOString(),
              resumeText: original?.resumeText || "",
              currentStage: c.final_score >= 75 ? "In Decision Room" : "Applied"
            });
          } catch {}
        }

        jobs.set(jobId, {
          status: "complete",
          progress: queueCandidates.length,
          total: queueCandidates.length,
          ranked,
          failed: failed.map(f => ({
            id: f.id,
            name: f.name || "Unknown Candidate",
            filename: f.filename || f.name || "Resume file",
            reason: f.reason || f.error || "Could not parse candidate resume"
          })),
          committeeReport,
        });
      })
      .catch((err) => {
        jobs.set(jobId, { status: "error", error: err.message });
      });

    return NextResponse.json({ jobId });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to initialize bulk analysis" }, { status: 500 });
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
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to retrieve status" }, { status: 500 });
  }
}
