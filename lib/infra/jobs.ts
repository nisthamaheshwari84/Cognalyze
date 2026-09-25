/**
 * DURABLE JOB INFRASTRUCTURE (Part 3 & Part 6)
 * 
 * PostgreSQL-backed durable job state machine:
 * queued -> running -> completed | failed | cancelled
 * 
 * Supports resumable, chunked, idempotent execution on Vercel.
 */

import { getDb } from "@/lib/db";
import { jobs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export interface JobProgress {
  processed: number;
  total: number;
  step: string;
  details?: Record<string, any>;
}

export async function createJob(params: {
  orgId?: string;
  type: string;
  payload: Record<string, any>;
  totalItems?: number;
}): Promise<string> {
  const db = getDb();
  const initialProgress: JobProgress = {
    processed: 0,
    total: params.totalItems || 0,
    step: "initialized",
  };

  const [inserted] = await db
    .insert(jobs)
    .values({
      orgId: params.orgId ? (params.orgId as any) : null,
      type: params.type,
      status: "queued",
      payload: params.payload,
      progress: initialProgress,
    })
    .returning({ id: jobs.id });

  return inserted.id;
}

export async function updateJobProgress(
  jobId: string,
  progress: Partial<JobProgress>
): Promise<void> {
  const db = getDb();
  const existing = await db.query.jobs.findFirst({
    where: eq(jobs.id, jobId as any),
  });

  const existingProgress = existing?.progress as JobProgress | null | undefined;
  const updatedProgress: JobProgress = {
    processed: progress.processed ?? existingProgress?.processed ?? 0,
    total: progress.total ?? existingProgress?.total ?? 0,
    step: progress.step ?? existingProgress?.step ?? "running",
    details: progress.details ?? existingProgress?.details,
  };

  await db
    .update(jobs)
    .set({
      status: "running",
      progress: updatedProgress,
      updatedAt: new Date(),
    })
    .where(eq(jobs.id, jobId as any));
}

export async function completeJob(
  jobId: string,
  result: Record<string, any>
): Promise<void> {
  const db = getDb();
  await db
    .update(jobs)
    .set({
      status: "completed",
      result,
      updatedAt: new Date(),
    })
    .where(eq(jobs.id, jobId as any));
}

export async function failJob(
  jobId: string,
  error: string | Error
): Promise<void> {
  const db = getDb();
  const errorMessage = error instanceof Error ? error.message : String(error);
  await db
    .update(jobs)
    .set({
      status: "failed",
      error: errorMessage,
      updatedAt: new Date(),
    })
    .where(eq(jobs.id, jobId as any));
}

export async function getJobStatus(jobId: string) {
  const db = getDb();
  return db.query.jobs.findFirst({
    where: eq(jobs.id, jobId as any),
  });
}
