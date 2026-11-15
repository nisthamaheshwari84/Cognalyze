import fs from "fs";
import path from "path";
import crypto from "crypto";
import { supabaseAdmin, isSupabaseAvailable } from "@/lib/supabase";

export interface StudentApplicationRecord {
  id: string;
  userId: string;
  opportunityId: string;
  stage: "Saved" | "Drafting" | "Applied" | "Interviewing" | "Offer" | "Rejected";
  appliedAt?: string | null;
  deadline?: string | null;
  organizationName: string;
  positionTitle: string;
  resumeVersion?: string;
  coverLetter?: string;
  tailoredBulletsJson?: any;
  applyUrl: string;
  notes?: string;
  followUpDate?: string | null;
  permissionLevel?: number;
  createdAt: string;
  updatedAt: string;
}

export interface StudentApplicationAction {
  id: string;
  applicationId: string;
  userId: string;
  actionType: string;
  summary: string;
  createdAt: string;
}

export interface AgentTraceRecord {
  id: string;
  agentName: string;
  taskType: string;
  status: "success" | "fallback" | "error" | "blocked";
  inputSummary: string;
  outputSummary: string;
  toolsUsedJson?: string[];
  durationMs: number;
  tokenUsage?: number;
  modelName?: string;
  errorMessage?: string | null;
  createdAt: string;
}

const APPS_FILE = path.join(process.cwd(), "data", "student-opportunity-applications.json");
const ACTIONS_FILE = path.join(process.cwd(), "data", "student-opportunity-actions.json");
const TRACES_FILE = path.join(process.cwd(), "data", "opportunity-agent-traces.json");
const SAVED_FILE = path.join(process.cwd(), "data", "saved-opportunities.json");

function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn(`[student-application-service] Failed reading ${filePath}:`, err);
  }
  return fallback;
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error(`[student-application-service] Failed writing ${filePath}:`, err);
  }
}

export class StudentOpportunityApplicationService {
  private static instance: StudentOpportunityApplicationService;

  private constructor() {}

  public static getInstance(): StudentOpportunityApplicationService {
    if (!StudentOpportunityApplicationService.instance) {
      StudentOpportunityApplicationService.instance = new StudentOpportunityApplicationService();
    }
    return StudentOpportunityApplicationService.instance;
  }

  // ─────────────────────────────────────────────────────────────
  // 1. Saved Bookmarks Store
  // ─────────────────────────────────────────────────────────────

  public async getSavedOpportunityIds(userId: string): Promise<string[]> {
    const store = readJsonFile<Record<string, string[]>>(SAVED_FILE, {});
    return store[userId] || [];
  }

  public async saveOpportunity(userId: string, opportunityId: string): Promise<boolean> {
    const store = readJsonFile<Record<string, string[]>>(SAVED_FILE, {});
    const current = new Set(store[userId] || []);
    current.add(opportunityId);
    store[userId] = Array.from(current);
    writeJsonFile(SAVED_FILE, store);
    return true;
  }

  public async unsaveOpportunity(userId: string, opportunityId: string): Promise<boolean> {
    const store = readJsonFile<Record<string, string[]>>(SAVED_FILE, {});
    const current = new Set(store[userId] || []);
    const removed = current.delete(opportunityId);
    store[userId] = Array.from(current);
    writeJsonFile(SAVED_FILE, store);
    return removed;
  }

  public async isOpportunitySaved(userId: string, opportunityId: string): Promise<boolean> {
    const saved = await this.getSavedOpportunityIds(userId);
    return saved.includes(opportunityId);
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Student Applications Management
  // ─────────────────────────────────────────────────────────────

  public async getApplications(userId: string): Promise<StudentApplicationRecord[]> {
    try {
      const isAvailable = await isSupabaseAvailable();
      if (isAvailable && supabaseAdmin) {
        const { data, error } = await supabaseAdmin
          .from("student_opportunity_applications")
          .select("*")
          .eq("user_id", userId)
          .order("updated_at", { ascending: false });

        if (!error && Array.isArray(data)) {
          return data.map((r: any) => ({
            id: r.id,
            userId: r.user_id,
            opportunityId: r.opportunity_id,
            stage: r.stage,
            appliedAt: r.applied_at,
            deadline: r.deadline,
            organizationName: r.organization_name,
            positionTitle: r.position_title,
            resumeVersion: r.resume_version,
            coverLetter: r.cover_letter,
            tailoredBulletsJson: r.tailored_bullets_json,
            applyUrl: r.apply_url,
            notes: r.notes,
            followUpDate: r.follow_up_date,
            permissionLevel: r.permission_level,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          }));
        }
      }
    } catch (err) {
      console.warn("[student-application-service] Supabase load skipped, fallback to disk:", err);
    }

    const diskApps = readJsonFile<StudentApplicationRecord[]>(APPS_FILE, []);
    return diskApps.filter((app) => app.userId === userId);
  }

  public async getApplicationById(userId: string, applicationId: string): Promise<StudentApplicationRecord | null> {
    const apps = await this.getApplications(userId);
    return apps.find((a) => a.id === applicationId) || null;
  }

  public async getApplicationByOpportunityId(userId: string, oppId: string): Promise<StudentApplicationRecord | null> {
    const apps = await this.getApplications(userId);
    return apps.find((a) => a.opportunityId === oppId) || null;
  }

  public async upsertApplication(
    userId: string,
    payload: {
      opportunityId: string;
      stage?: "Saved" | "Drafting" | "Applied" | "Interviewing" | "Offer" | "Rejected";
      organizationName: string;
      positionTitle: string;
      applyUrl: string;
      deadline?: string | null;
      appliedAt?: string | null;
      resumeVersion?: string;
      coverLetter?: string;
      tailoredBulletsJson?: any;
      notes?: string;
      followUpDate?: string | null;
      permissionLevel?: number;
    }
  ): Promise<StudentApplicationRecord> {
    const existing = await this.getApplicationByOpportunityId(userId, payload.opportunityId);
    const now = new Date().toISOString();
    const id = existing ? existing.id : crypto.randomUUID();

    const record: StudentApplicationRecord = {
      id,
      userId,
      opportunityId: payload.opportunityId,
      stage: payload.stage || existing?.stage || "Saved",
      appliedAt: payload.appliedAt ?? existing?.appliedAt ?? (payload.stage === "Applied" ? now : null),
      deadline: payload.deadline ?? existing?.deadline ?? null,
      organizationName: payload.organizationName,
      positionTitle: payload.positionTitle,
      resumeVersion: payload.resumeVersion ?? existing?.resumeVersion ?? "Primary Resume",
      coverLetter: payload.coverLetter ?? existing?.coverLetter ?? "",
      tailoredBulletsJson: payload.tailoredBulletsJson ?? existing?.tailoredBulletsJson ?? null,
      applyUrl: payload.applyUrl,
      notes: payload.notes ?? existing?.notes ?? "",
      followUpDate: payload.followUpDate ?? existing?.followUpDate ?? null,
      permissionLevel: payload.permissionLevel ?? existing?.permissionLevel ?? 2,
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };

    // Save to disk first (resilient ACID local)
    const diskApps = readJsonFile<StudentApplicationRecord[]>(APPS_FILE, []);
    const idx = diskApps.findIndex((a) => a.id === id || (a.userId === userId && a.opportunityId === payload.opportunityId));
    if (idx >= 0) {
      diskApps[idx] = record;
    } else {
      diskApps.push(record);
    }
    writeJsonFile(APPS_FILE, diskApps);

    // Save to Supabase if available
    try {
      const isAvailable = await isSupabaseAvailable();
      if (isAvailable && supabaseAdmin) {
        await supabaseAdmin.from("student_opportunity_applications").upsert(
          {
            id: record.id,
            user_id: record.userId,
            opportunity_id: record.opportunityId,
            stage: record.stage,
            applied_at: record.appliedAt,
            deadline: record.deadline,
            organization_name: record.organizationName,
            position_title: record.positionTitle,
            resume_version: record.resumeVersion,
            cover_letter: record.coverLetter,
            tailored_bullets_json: record.tailoredBulletsJson,
            apply_url: record.applyUrl,
            notes: record.notes,
            follow_up_date: record.followUpDate,
            permission_level: record.permissionLevel,
            updated_at: record.updatedAt,
          },
          { onConflict: "id" }
        );
      }
    } catch (dbErr) {
      console.warn("[student-application-service] Supabase persist skipped:", dbErr);
    }

    // Record action log
    await this.logAction(
      record.id,
      userId,
      existing ? "APPLICATION_UPDATED" : "APPLICATION_CREATED",
      `Application for ${record.positionTitle} at ${record.organizationName} updated to stage ${record.stage}`
    );

    return record;
  }

  public async updateStage(
    userId: string,
    applicationId: string,
    newStage: "Saved" | "Drafting" | "Applied" | "Interviewing" | "Offer" | "Rejected",
    notes?: string,
    followUpDate?: string | null
  ): Promise<StudentApplicationRecord | null> {
    const existing = await this.getApplicationById(userId, applicationId);
    if (!existing) return null;

    const now = new Date().toISOString();
    existing.stage = newStage;
    if (newStage === "Applied" && !existing.appliedAt) {
      existing.appliedAt = now;
    }
    if (notes !== undefined) existing.notes = notes;
    if (followUpDate !== undefined) existing.followUpDate = followUpDate;
    existing.updatedAt = now;

    // Disk persist
    const diskApps = readJsonFile<StudentApplicationRecord[]>(APPS_FILE, []);
    const idx = diskApps.findIndex((a) => a.id === applicationId && a.userId === userId);
    if (idx >= 0) {
      diskApps[idx] = existing;
      writeJsonFile(APPS_FILE, diskApps);
    }

    // Supabase persist
    try {
      const isAvailable = await isSupabaseAvailable();
      if (isAvailable && supabaseAdmin) {
        await supabaseAdmin
          .from("student_opportunity_applications")
          .update({
            stage: existing.stage,
            applied_at: existing.appliedAt,
            notes: existing.notes,
            follow_up_date: existing.followUpDate,
            updated_at: existing.updatedAt,
          })
          .eq("id", applicationId)
          .eq("user_id", userId);
      }
    } catch (err) {
      console.warn("[student-application-service] Supabase updateStage skipped:", err);
    }

    await this.logAction(
      applicationId,
      userId,
      "STAGE_TRANSITION",
      `Moved to stage ${newStage}${notes ? ` with notes: "${notes}"` : ""}`
    );

    return existing;
  }

  public async deleteApplication(userId: string, applicationId: string): Promise<boolean> {
    const diskApps = readJsonFile<StudentApplicationRecord[]>(APPS_FILE, []);
    const filtered = diskApps.filter((a) => !(a.id === applicationId && a.userId === userId));
    writeJsonFile(APPS_FILE, filtered);

    try {
      const isAvailable = await isSupabaseAvailable();
      if (isAvailable && supabaseAdmin) {
        await supabaseAdmin
          .from("student_opportunity_applications")
          .delete()
          .eq("id", applicationId)
          .eq("user_id", userId);
      }
    } catch (err) {
      console.warn("[student-application-service] Supabase deleteApplication skipped:", err);
    }

    return true;
  }

  // ─────────────────────────────────────────────────────────────
  // 3. Application Action Audits
  // ─────────────────────────────────────────────────────────────

  public async logAction(
    applicationId: string,
    userId: string,
    actionType: string,
    summary: string
  ): Promise<StudentApplicationAction> {
    const action: StudentApplicationAction = {
      id: crypto.randomUUID(),
      applicationId,
      userId,
      actionType,
      summary,
      createdAt: new Date().toISOString(),
    };

    const actions = readJsonFile<StudentApplicationAction[]>(ACTIONS_FILE, []);
    actions.unshift(action);
    if (actions.length > 500) actions.length = 500;
    writeJsonFile(ACTIONS_FILE, actions);

    try {
      const isAvailable = await isSupabaseAvailable();
      if (isAvailable && supabaseAdmin) {
        await supabaseAdmin.from("student_opportunity_actions").insert({
          id: action.id,
          application_id: action.applicationId,
          user_id: action.userId,
          action_type: action.actionType,
          summary: action.summary,
          created_at: action.createdAt,
        });
      }
    } catch {
      // Non-fatal
    }

    return action;
  }

  // ─────────────────────────────────────────────────────────────
  // 4. Agent Traces Logging
  // ─────────────────────────────────────────────────────────────

  public async logAgentTrace(params: {
    agentName: string;
    taskType: string;
    status: "success" | "fallback" | "error" | "blocked";
    inputSummary: string;
    outputSummary: string;
    toolsUsed: string[];
    durationMs: number;
    tokenUsage?: number;
    modelName?: string;
    errorMessage?: string | null;
  }): Promise<AgentTraceRecord> {
    const trace: AgentTraceRecord = {
      id: `tr-${crypto.randomUUID().slice(0, 12)}`,
      agentName: params.agentName,
      taskType: params.taskType,
      status: params.status,
      inputSummary: params.inputSummary.slice(0, 400),
      outputSummary: params.outputSummary.slice(0, 500),
      toolsUsedJson: params.toolsUsed,
      durationMs: Math.round(params.durationMs),
      tokenUsage: params.tokenUsage ?? 0,
      modelName: params.modelName ?? "deterministic",
      errorMessage: params.errorMessage ?? null,
      createdAt: new Date().toISOString(),
    };

    const traces = readJsonFile<AgentTraceRecord[]>(TRACES_FILE, []);
    traces.unshift(trace);
    if (traces.length > 500) traces.length = 500;
    writeJsonFile(TRACES_FILE, traces);

    try {
      const isAvailable = await isSupabaseAvailable();
      if (isAvailable && supabaseAdmin) {
        await supabaseAdmin.from("opportunity_agent_traces").insert({
          id: trace.id,
          agent_name: trace.agentName,
          task_type: trace.taskType,
          status: trace.status,
          input_summary: trace.inputSummary,
          output_summary: trace.outputSummary,
          tools_used_json: trace.toolsUsedJson,
          duration_ms: trace.durationMs,
          token_usage: trace.tokenUsage,
          model_name: trace.modelName,
          error_message: trace.errorMessage,
          created_at: trace.createdAt,
        });
      }
    } catch {
      // Non-fatal
    }

    return trace;
  }
}

export const studentApplicationService = StudentOpportunityApplicationService.getInstance();
