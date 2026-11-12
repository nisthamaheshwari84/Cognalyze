/**
 * lib/recruitment/journey-store.ts
 * 
 * Persistence & state management for Student Recruitment Journeys.
 * Employs high-speed globalThis memory cache + persistent disk backup (data/recruitment-journeys.json)
 * with automatic cloud synchronization to Supabase.
 */

import { StudentRecruitmentJourney, StageAttemptSubmission } from "./types";
import { supabase, isSupabaseAvailable } from "../supabase";

function getGlobalMemoryStore(): Map<string, StudentRecruitmentJourney> {
  const g = globalThis as any;
  if (!g.__COGNALYZE_JOURNEY_STORE__) {
    g.__COGNALYZE_JOURNEY_STORE__ = new Map<string, StudentRecruitmentJourney>();
    loadJourneysFromFile(g.__COGNALYZE_JOURNEY_STORE__);
  }
  return g.__COGNALYZE_JOURNEY_STORE__;
}

function getJourneysFilePath(): string {
  if (typeof window === "undefined") {
    const path = eval("require")("path");
    const isServerless = Boolean(
      process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.NEXT_RUNTIME === "edge"
    );
    if (isServerless) {
      return path.join("/tmp", "recruitment-journeys.json");
    }
    return path.join(process.cwd(), "data", "recruitment-journeys.json");
  }
  return "";
}

function loadJourneysFromFile(store: Map<string, StudentRecruitmentJourney>): void {
  if (typeof window === "undefined") {
    try {
      const fs = eval("require")("fs");
      const filePath = getJourneysFilePath();
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf8");
        const list: StudentRecruitmentJourney[] = JSON.parse(raw);
        for (const j of list) {
          store.set(j.id, j);
        }
      }
    } catch (e: any) {
      console.warn("[journey-store] File load warning:", e.message);
    }
  }
}

function persistJourneysToFile(): void {
  if (typeof window === "undefined") {
    try {
      const fs = eval("require")("fs");
      const filePath = getJourneysFilePath();
      const list = Array.from(getGlobalMemoryStore().values());
      fs.writeFileSync(filePath, JSON.stringify(list, null, 2), "utf8");
    } catch (e: any) {
      console.warn("[journey-store] File save warning:", e.message);
    }
  }
}

export async function saveJourney(journey: StudentRecruitmentJourney): Promise<StudentRecruitmentJourney> {
  const store = getGlobalMemoryStore();
  store.set(journey.id, { ...journey });
  persistJourneysToFile();

  try {
    const available = await isSupabaseAvailable();
    if (available && supabase) {
      const payload = {
        id: journey.id,
        student_id: journey.studentId,
        company_id: journey.companyId,
        blueprint_id: journey.blueprintId,
        blueprint_version: journey.blueprintVersion,
        role_family: journey.roleFamily,
        hiring_channel: journey.hiringChannel,
        current_stage_id: journey.currentStageId,
        status: journey.status,
        overall_score: journey.overallScore,
        stage_progress: journey.stageProgress,
        competency_scores: journey.competencyScores,
        recruiter_pipeline_id: journey.recruiterPipelineId || null,
        started_at: journey.startedAt,
        completed_at: journey.completedAt || null,
        updated_at: journey.updatedAt,
      };

      const { error } = await supabase
        .from("student_recruitment_journeys")
        .upsert(payload, { onConflict: "id" });

      if (error) {
        console.warn("[journey-store] Supabase upsert error, falling back to memory:", error.message);
      }
    }
  } catch (err: any) {
    console.warn("[journey-store] Failed to persist journey to Supabase:", err.message);
  }

  return journey;
}

export async function getJourneyById(id: string): Promise<StudentRecruitmentJourney | null> {
  const store = getGlobalMemoryStore();
  let cached = store.get(id);

  if (!cached) {
    // Re-check disk file
    loadJourneysFromFile(store);
    cached = store.get(id);
  }

  if (cached) return { ...cached };

  try {
    const available = await isSupabaseAvailable();
    if (available && supabase) {
      const { data, error } = await supabase
        .from("student_recruitment_journeys")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) {
        console.warn("[journey-store] Error fetching journey from Supabase:", error.message);
      } else if (data) {
        const journey: StudentRecruitmentJourney = {
          id: data.id,
          studentId: data.student_id,
          companyId: data.company_id,
          blueprintId: data.blueprint_id,
          blueprintVersion: data.blueprint_version,
          roleFamily: data.role_family,
          hiringChannel: data.hiring_channel,
          currentStageId: data.current_stage_id,
          status: data.status,
          overallScore: Number(data.overall_score || 0),
          stageProgress: data.stage_progress || {},
          competencyScores: data.competency_scores || {},
          recruiterPipelineId: data.recruiter_pipeline_id || undefined,
          startedAt: data.started_at,
          completedAt: data.completed_at || undefined,
          updatedAt: data.updated_at,
        };
        store.set(journey.id, journey);
        persistJourneysToFile();
        return journey;
      }
    }
  } catch (err: any) {
    console.warn("[journey-store] Supabase lookup error:", err.message);
  }

  return null;
}

export async function getJourneysByStudent(studentId: string): Promise<StudentRecruitmentJourney[]> {
  const store = getGlobalMemoryStore();
  loadJourneysFromFile(store);

  const memoryJourneys = Array.from(store.values()).filter(
    (j) => j.studentId === studentId || studentId === "student-demo"
  );

  try {
    const available = await isSupabaseAvailable();
    if (available && supabase) {
      const { data, error } = await supabase
        .from("student_recruitment_journeys")
        .select("*")
        .eq("student_id", studentId)
        .order("updated_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: StudentRecruitmentJourney[] = data.map((d: any) => ({
          id: d.id,
          studentId: d.student_id,
          companyId: d.company_id,
          blueprintId: d.blueprint_id,
          blueprintVersion: d.blueprint_version,
          roleFamily: d.role_family,
          hiringChannel: d.hiring_channel,
          currentStageId: d.current_stage_id,
          status: d.status,
          overallScore: Number(d.overall_score || 0),
          stageProgress: d.stage_progress || {},
          competencyScores: d.competency_scores || {},
          recruiterPipelineId: d.recruiter_pipeline_id || undefined,
          startedAt: d.started_at,
          completedAt: d.completed_at || undefined,
          updatedAt: d.updated_at,
        }));

        for (const j of mapped) {
          store.set(j.id, j);
        }
        persistJourneysToFile();
        return mapped;
      }
    }
  } catch (err: any) {
    console.warn("[journey-store] Failed to fetch student journeys from Supabase:", err.message);
  }

  return memoryJourneys.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function saveStageAttemptRecord(
  submission: StageAttemptSubmission,
  attemptResult: { stagePassed: boolean; percentageScore: number; stageType: string; studentId: string }
): Promise<void> {
  try {
    const available = await isSupabaseAvailable();
    if (available && supabase) {
      const payload = {
        journey_id: submission.journeyId,
        stage_id: submission.stageId,
        stage_type: attemptResult.stageType,
        student_id: attemptResult.studentId,
        status: attemptResult.stagePassed ? "PASSED" : "FAILED",
        raw_score: submission.rawScore,
        max_score: submission.maxScore,
        percentage_score: attemptResult.percentageScore,
        duration_seconds: submission.durationSeconds,
        telemetry: submission.telemetry || {},
        rubric_evaluations: submission.rubricEvaluations || {},
        evaluator_feedback: submission.evaluatorFeedback || null,
        session_reference_id: submission.sessionReferenceId || null,
        completed_at: new Date().toISOString(),
      };

      await supabase.from("student_recruitment_stage_attempts").insert(payload);
    }
  } catch (err: any) {
    console.warn("[journey-store] Failed to save stage attempt record to Supabase:", err.message);
  }
}
