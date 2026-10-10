/**
 * Cognalyze Multi-Tenant Client State Cleaner
 *
 * Ensures that when a user logs in, signs up, or switches accounts,
 * all cached personal data (profiles, resumes, calendar, applications,
 * mock interviews, notes, DNA) belonging to the previous account is
 * wiped cleanly from browser localStorage and sessionStorage.
 */

export function clearUserSessionStorage(newUserId?: string): void {
  if (typeof window === "undefined") return;

  try {
    const previousId = localStorage.getItem("cognalyze_student_id");
    const isDifferentUser = !newUserId || (previousId && previousId !== newUserId);

    if (isDifferentUser) {
      const keysToRemove = [
        "cognalyze_student_id",
        "cognalyze_role",
        "cognalyze_student_profile",
        "cognalyze_interview_sessions",
        "cognalyze_canonical_resume",
        "cognalyze_ai_mentor_conversations",
        "cognalyze_gd_topic_history",
        "cognalyze_gd_fresh_topics",
        "cognalyze_simulation_sessions",
        "cognalyze_applied_opportunities",
        "cognalyze_saved_opportunities",
        "cognalyze_calendar_events",
      ];

      for (const k of keysToRemove) {
        localStorage.removeItem(k);
      }

      // Also clean up dynamic student/candidate-specific keys
      const allKeys = Object.keys(localStorage);
      for (const k of allKeys) {
        if (
          k.startsWith("cognalyze_attempts_") ||
          k.startsWith("cognalyze_striver_") ||
          k.startsWith("cognalyze_behavioral_") ||
          k.startsWith("cognalyze_learner_memory_")
        ) {
          localStorage.removeItem(k);
        }
      }

      sessionStorage.clear();
    }

    if (newUserId) {
      localStorage.setItem("cognalyze_student_id", newUserId);
    }
  } catch (err) {
    console.warn("[client-storage-cleanup] Failed to clear user storage:", err);
  }
}
