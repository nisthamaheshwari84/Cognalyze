import { NextResponse } from "next/server";
import { getCandidateById, getRoleById, updateCandidateStage } from "@/lib/recruiter-store";
import { generateWorkSampleTask, evaluateWorkSampleWithAI, WorkSampleMiniTask } from "@/lib/ai/work-sample";

export async function POST(req: Request) {
  try {
    const { action, roleId, requirementId, candidateId, task, submissionText, triggerContext } = await req.json();

    if (action === "generate") {
      if (!roleId || !requirementId) {
        return NextResponse.json({ success: false, error: "roleId and requirementId are required" }, { status: 400 });
      }
      const role = await getRoleById(roleId);
      if (!role) {
        return NextResponse.json({ success: false, error: "Role not found" }, { status: 404 });
      }

      const miniTask = generateWorkSampleTask(role, requirementId, triggerContext || "direct_verification");

      if (candidateId) {
        await updateCandidateStage(candidateId, "Work Sample Pending", { activeWorkSample: miniTask });
      }

      return NextResponse.json({ success: true, task: miniTask });
    }

    if (action === "evaluate") {
      if (!task || !candidateId || !submissionText) {
        return NextResponse.json({ success: false, error: "task, candidateId, and submissionText are required" }, { status: 400 });
      }

      const evalResult = await evaluateWorkSampleWithAI(task, candidateId, submissionText);

      // Persist results onto candidate
      const candidate = await getCandidateById(candidateId);
      const existingResults = candidate?.workSampleResults || {};
      existingResults[task.requirementId] = {
        passed: evalResult.passed,
        score: evalResult.score,
        output: evalResult.verbatimProof
      };

      await updateCandidateStage(candidateId, "Work Sample Evaluated", {
        workSampleResults: existingResults,
        activeWorkSample: undefined
      });

      return NextResponse.json({ success: true, evaluation: evalResult });
    }

    return NextResponse.json({ success: false, error: "Invalid action. Expected 'generate' or 'evaluate'." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
