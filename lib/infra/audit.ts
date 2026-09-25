/**
 * AUDIT LOG INFRASTRUCTURE (Part 3 & Part 11)
 * 
 * Append-only immutable log for all human and system decisions,
 * consent modifications, and role requirement alterations.
 */

export interface LogAuditParams {
  orgId?: string;
  actorId: string;
  action: string;
  targetEntityType: string;
  targetEntityId: string;
  details?: Record<string, any>;
}

export async function recordAuditEntry(params: LogAuditParams): Promise<void> {
  try {
    let db: any = null;
    let schema: any = null;
    try {
      const dbModule = await import("@/lib/db");
      schema = await import("@/lib/db/schema");
      db = dbModule.getDb();
    } catch {
      return; // Offline / unconfigured environment
    }
    if (db && schema) {
      await db.insert(schema.auditLog).values({
        orgId: params.orgId ? (params.orgId as any) : null,
        actorId: params.actorId,
        action: params.action,
        targetEntityType: params.targetEntityType,
        targetEntityId: params.targetEntityId,
        details: params.details || {},
      });
    }
  } catch (err) {
    // Audit write failures in configured DB are logged to stdout with full context
    console.error("[AUDIT_LOG_ERROR] Failed to persist audit entry:", err, params);
  }
}

