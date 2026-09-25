import { supabase } from "@/lib/supabase";

export type NotificationPriority = "low" | "normal" | "high";

export type SourceFeature =
  | "calendar"
  | "matching"
  | "question_bank"
  | "company_brief"
  | "dsa_tracker"
  | "application_tracker"
  | string;

export interface NotificationItem {
  id: string;
  student_id: string;
  source_feature: SourceFeature;
  notification_type: string;
  title: string;
  body: string;
  link_url: string;
  priority: NotificationPriority;
  is_read: boolean;
  created_at: string;
}

export interface CreateNotificationParams {
  studentId: string;
  sourceFeature: SourceFeature;
  notificationType: string;
  title: string;
  body?: string;
  linkUrl?: string;
  priority?: NotificationPriority;
}

// In-memory notifications store for local dev / offline fallback
const inMemoryNotifications: Map<string, NotificationItem[]> = new Map();

/**
 * Resolves candidate ID (e.g. "student-demo") to consistent student profile ID or fallback
 */
export async function resolveStudentId(candidateOrStudentId: string): Promise<string> {
  if (!candidateOrStudentId) return "student-demo";
  try {
    const { data } = await supabase
      .from("student_profiles")
      .select("id")
      .eq("candidate_id", candidateOrStudentId)
      .maybeSingle();

    if (data?.id) return data.id;
  } catch {
    // Supabase unavailable, fallback to string identifier
  }
  return candidateOrStudentId;
}

/**
 * Extensibility contract: Central function every feature calls to report signals.
 * Server-side only. Deduplicates active unread alerts for same subject.
 */
export async function createNotification(params: CreateNotificationParams): Promise<NotificationItem> {
  const {
    studentId,
    sourceFeature,
    notificationType,
    title,
    body = "",
    linkUrl = "/student",
    priority = "normal"
  } = params;

  const resolvedId = await resolveStudentId(studentId);
  const now = new Date().toISOString();

  // Deduplication guard: Check if an identical unread notification already exists
  const existingList = inMemoryNotifications.get(resolvedId) || [];
  const duplicate = existingList.find(
    n => !n.is_read && n.source_feature === sourceFeature && n.notification_type === notificationType && n.title === title
  );

  if (duplicate) {
    return duplicate;
  }

  const newNotification: NotificationItem = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    student_id: resolvedId,
    source_feature: sourceFeature,
    notification_type: notificationType,
    title,
    body,
    link_url: linkUrl,
    priority,
    is_read: false,
    created_at: now
  };

  // 1. Update in-memory store
  existingList.unshift(newNotification);
  inMemoryNotifications.set(resolvedId, existingList);

  // If candidateOrStudentId was an alias, also map alias
  if (studentId !== resolvedId) {
    const aliasList = inMemoryNotifications.get(studentId) || [];
    aliasList.unshift(newNotification);
    inMemoryNotifications.set(studentId, aliasList);
  }

  // 2. Persist to Supabase if available
  try {
    await supabase.from("notifications").insert({
      student_id: resolvedId,
      source_feature: sourceFeature,
      notification_type: notificationType,
      title,
      body,
      link_url: linkUrl,
      priority,
      is_read: false,
      created_at: now
    });
  } catch {
    // Supabase insert fallback handled gracefully
  }

  return newNotification;
}

/**
 * Returns notifications for authenticated student, sorted newest first
 */
export async function getNotifications(studentId: string, limit = 50): Promise<{ notifications: NotificationItem[]; unread_count: number }> {
  const resolvedId = await resolveStudentId(studentId);

  // 1. Attempt Supabase fetch
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .or(`student_id.eq.${resolvedId},student_id.eq.${studentId}`)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (data && !error && data.length > 0) {
      const notifications: NotificationItem[] = data.map((d: any) => ({
        id: d.id,
        student_id: d.student_id,
        source_feature: d.source_feature,
        notification_type: d.notification_type,
        title: d.title,
        body: d.body || "",
        link_url: d.link_url || "/student",
        priority: (d.priority as NotificationPriority) || "normal",
        is_read: !!d.is_read,
        created_at: d.created_at
      }));
      const unread_count = notifications.filter((n: NotificationItem) => !n.is_read).length;
      return { notifications, unread_count };
    }
  } catch {
    // Fall back to in-memory store
  }

  // 2. In-memory store
  const list = inMemoryNotifications.get(resolvedId) || inMemoryNotifications.get(studentId) || [];
  const sorted = [...list].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, limit);
  const unread_count = sorted.filter(n => !n.is_read).length;

  return { notifications: sorted, unread_count };
}

/**
 * Mark a single notification as read. Validates student ownership.
 */
export async function markNotificationRead(notificationId: string, studentId: string): Promise<boolean> {
  const resolvedId = await resolveStudentId(studentId);

  // Check in-memory store & enforce ownership
  let found = false;
  for (const [sId, notifs] of inMemoryNotifications.entries()) {
    const target = notifs.find(n => n.id === notificationId);
    if (target) {
      if (sId !== resolvedId && sId !== studentId && target.student_id !== resolvedId && target.student_id !== studentId) {
        // Ownership mismatch: unauthorized
        return false;
      }
      target.is_read = true;
      found = true;
    }
  }

  // Supabase update with ownership constraint
  try {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId)
      .or(`student_id.eq.${resolvedId},student_id.eq.${studentId}`);
  } catch {}

  return found;
}

/**
 * Mark all notifications as read for a given student.
 */
export async function markAllNotificationsRead(studentId: string): Promise<number> {
  const resolvedId = await resolveStudentId(studentId);

  let updatedCount = 0;
  const list = inMemoryNotifications.get(resolvedId) || inMemoryNotifications.get(studentId) || [];
  for (const n of list) {
    if (!n.is_read) {
      n.is_read = true;
      updatedCount++;
    }
  }

  try {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .or(`student_id.eq.${resolvedId},student_id.eq.${studentId}`)
      .eq("is_read", false);
  } catch {}

  return updatedCount;
}
