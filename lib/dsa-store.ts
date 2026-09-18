import { supabase } from "@/lib/supabase";
import { STRIVER_A2Z_PROBLEMS } from "./dsa-striver-sheet";
import { createNotification } from "@/lib/notifications";

export interface DsaTopic {
  id: string;
  name: string;
  slug: string;
  description: string;
  order_index: number;
}

export interface DsaProblem {
  id: string;
  topic_id: string;
  step_title?: string;
  subtopic_title?: string;
  title: string;
  difficulty: "easy" | "medium" | "hard";
  problem_url: string;
  article_url?: string;
  video_url?: string;
  companies: string[];
  description: string;
  markdown_details?: string;
  time_complexity?: string;
  space_complexity?: string;
  order_index: number;
}

export interface DsaProgress {
  id?: string;
  student_id: string;
  problem_id: string;
  status: "unsolved" | "attempted" | "solved";
  previous_status?: string | null;
  time_spent_seconds?: number;
  next_review_date?: string | null; // YYYY-MM-DD
  review_count: number;
  last_reviewed_at?: string | null;
  notes?: string | null;
  solved_at?: string | null;
  updated_at?: string;
  created_at?: string;
}

export interface DsaSuggestion {
  topic_id: string;
  topic_name: string;
  topic_slug: string;
  message: string;
  recommended_difficulty: "medium" | "hard";
  next_problem?: DsaProblem;
}

export interface StudentConnection {
  id: string;
  requester_student_id: string;
  recipient_student_id: string;
  connection_code: string;
  status: "pending" | "accepted" | "declined";
  created_at: string;
  updated_at: string;
}

export interface LeaderboardPreference {
  student_id: string;
  is_opted_in: boolean;
  display_handle: string;
  college_name: string;
  updated_at: string;
}

export interface MilestoneBadge {
  id: string;
  student_id: string;
  badge_type: string;
  title: string;
  description: string;
  icon: string;
  earned_at: string;
}

export interface DsaDailyGoal {
  student_id: string;
  daily_target: number;
  updated_at: string;
}

// ─── SEED TOPICS (16 Core Striver A2Z Computer Science DSA Domains) ───
export const SEED_DSA_TOPICS: DsaTopic[] = [
  { id: "arrays-hashing", name: "Arrays & Hashing", slug: "arrays-hashing", description: "Frequency maps, prefix sums, hash sets, sliding window basics", order_index: 1 },
  { id: "two-pointers", name: "Two Pointers", slug: "two-pointers", description: "Opposite ends, fast/slow pointers, palindrome checks, sorted array traps", order_index: 2 },
  { id: "sliding-window", name: "Sliding Window", slug: "sliding-window", description: "Dynamic vs fixed window size, substring frequency bounds", order_index: 3 },
  { id: "stack-queue", name: "Stack & Queue", slug: "stack-queue", description: "Monotonic stacks, parenthesization, min stacks, circular queues", order_index: 4 },
  { id: "binary-search", name: "Binary Search", slug: "binary-search", description: "Boundary searches, rotated sorted arrays, search space reduction", order_index: 5 },
  { id: "linked-list", name: "Linked List", slug: "linked-list", description: "Reversals, cycle detection (Floyd's), merge sort on linked nodes", order_index: 6 },
  { id: "trees", name: "Trees & BST", slug: "trees", description: "DFS/BFS tree traversals, LCA, maximum path sum, BST invariants", order_index: 7 },
  { id: "tries", name: "Tries", slug: "tries", description: "Prefix trees, autocomplete indexing, bitwise XOR max pairs", order_index: 8 },
  { id: "heaps", name: "Heaps & Priority Queues", slug: "heaps", description: "Top-K elements, median finding in data streams, task schedulers", order_index: 9 },
  { id: "backtracking", name: "Backtracking", slug: "backtracking", description: "Permutations, subsets, N-Queens, constraint satisfaction search", order_index: 10 },
  { id: "graphs", name: "Graphs (BFS/DFS)", slug: "graphs", description: "Dijkstra, topological sort, Kahn's algorithm, cycle detection, bipartite check", order_index: 11 },
  { id: "dynamic-programming", name: "Dynamic Programming", slug: "dynamic-programming", description: "1D/2D memoization, knapsack, LCS/LIS, matrix chain state transitions", order_index: 12 },
  { id: "greedy", name: "Greedy Algorithms", slug: "greedy", description: "Interval scheduling, jump game, Huffman coding, gas stations", order_index: 13 },
  { id: "bit-manipulation", name: "Bit Manipulation", slug: "bit-manipulation", description: "Bitwise tricks, single numbers, power sets, XOR ranges", order_index: 14 },
  { id: "system-design-dsa", name: "Advanced & Distributed DSA", slug: "system-design-dsa", description: "Bloom filters, LRU Cache, Consistent Hashing, Segment Trees", order_index: 15 }
];

// ─── MASTER PROBLEMS (Complete Striver A2Z DSA Sheet Curated Master Dataset) ───
export const SEED_DSA_PROBLEMS: DsaProblem[] = STRIVER_A2Z_PROBLEMS;

// ─── IN-MEMORY STATE (Persistent fallback when Supabase tables are migrating) ───
const inMemoryProgress: Map<string, Map<string, DsaProgress>> = new Map();
const inMemoryConnections: Map<string, StudentConnection> = new Map();
const inMemoryLeaderboardPrefs: Map<string, LeaderboardPreference> = new Map();
const inMemoryBadges: Map<string, MilestoneBadge[]> = new Map();
const inMemoryGoals: Map<string, DsaDailyGoal> = new Map();
const inMemoryDynamicProblems: Map<string, DsaProblem> = new Map();

// Helper: current date in YYYY-MM-DD
export function getTodayDateString(): string {
  return new Date().toISOString().split("T")[0];
}

// Helper: add days to date string
export function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// ─── STORE FUNCTIONS ───

export async function getAllTopics(): Promise<DsaTopic[]> {
  try {
    const { data, error } = await supabase.from("dsa_topics").select("*").order("order_index", { ascending: true });
    if (!error && data && data.length >= 10) return data;
  } catch {}
  return SEED_DSA_TOPICS;
}

export async function getAllProblems(topicId?: string): Promise<DsaProblem[]> {
  let baseList: DsaProblem[] = [];
  try {
    let query = supabase.from("dsa_problems").select("*").order("order_index", { ascending: true });
    if (topicId) query = query.eq("topic_id", topicId);
    const { data, error } = await query;
    if (!error && data && data.length >= 70) {
      baseList = data;
    }
  } catch {}

  if (baseList.length === 0) {
    baseList = topicId ? SEED_DSA_PROBLEMS.filter(p => p.topic_id === topicId) : [...SEED_DSA_PROBLEMS];
  }

  // Merge any dynamically generated or custom added problems
  const dynamicList = Array.from(inMemoryDynamicProblems.values());
  const filteredDynamic = topicId ? dynamicList.filter(p => p.topic_id === topicId) : dynamicList;

  const existingIds = new Set(baseList.map(p => p.id));
  for (const dyn of filteredDynamic) {
    if (!existingIds.has(dyn.id)) {
      baseList.push(dyn);
      existingIds.add(dyn.id);
    }
  }

  return baseList;
}

export async function addDsaProblem(prob: DsaProblem): Promise<DsaProblem> {
  inMemoryDynamicProblems.set(prob.id, prob);
  try {
    await supabase.from("dsa_problems").upsert(prob, { onConflict: "id" });
  } catch {}
  return prob;
}

export async function getStudentDsaProgress(studentId: string): Promise<Record<string, DsaProgress>> {
  const progressMap: Record<string, DsaProgress> = {};

  try {
    const { data, error } = await supabase.from("dsa_progress").select("*").eq("student_id", studentId);
    if (!error && data && data.length > 0) {
      data.forEach((row: DsaProgress) => {
        progressMap[row.problem_id] = row;
      });
      return progressMap;
    }
  } catch {}

  const mem = inMemoryProgress.get(studentId);
  if (mem) {
    mem.forEach((val, key) => {
      progressMap[key] = val;
    });
  }

  return progressMap;
}

/**
 * Updates a problem's status (Phase 1, 1c, 4c)
 * On first 'solved': next_review_date = TODAY + 3 days, review_count = 0.
 */
export async function updateDsaProblemProgress(
  studentId: string,
  problemId: string,
  updates: {
    status?: "unsolved" | "attempted" | "solved";
    time_spent_seconds?: number;
    notes?: string;
    next_review_date?: string;
  }
): Promise<DsaProgress> {
  const current = (await getStudentDsaProgress(studentId))[problemId] || {
    student_id: studentId,
    problem_id: problemId,
    status: "unsolved",
    review_count: 0,
    time_spent_seconds: 0,
    notes: ""
  };

  const today = getTodayDateString();
  const nextStatus = updates.status !== undefined ? updates.status : current.status;
  const wasSolvedBefore = current.status === "solved";
  const isFirstSolved = !wasSolvedBefore && nextStatus === "solved";

  let nextReviewDate = current.next_review_date;
  let reviewCount = current.review_count || 0;

  if (updates.next_review_date !== undefined) {
    nextReviewDate = updates.next_review_date;
  } else if (isFirstSolved) {
    nextReviewDate = addDays(today, 3);
    reviewCount = 0;
  }

  const updatedRecord: DsaProgress = {
    ...current,
    status: nextStatus,
    previous_status: current.status !== nextStatus ? current.status : current.previous_status,
    time_spent_seconds: updates.time_spent_seconds !== undefined
      ? (current.time_spent_seconds || 0) + updates.time_spent_seconds
      : current.time_spent_seconds,
    notes: updates.notes !== undefined ? updates.notes : current.notes,
    next_review_date: nextReviewDate,
    review_count: reviewCount,
    solved_at: isFirstSolved ? new Date().toISOString() : current.solved_at,
    updated_at: new Date().toISOString()
  };

  // 1. Try Supabase
  try {
    await supabase.from("dsa_progress").upsert(updatedRecord, { onConflict: "student_id,problem_id" });
  } catch {}

  // 2. In-Memory
  if (!inMemoryProgress.has(studentId)) {
    inMemoryProgress.set(studentId, new Map());
  }
  inMemoryProgress.get(studentId)!.set(problemId, updatedRecord);

  // Check and trigger milestone badges (Phase 5a)
  await evaluateMilestoneBadges(studentId);

  // Student Career Intelligence Event Bus: Emits Assessed Evidence (Level 3)
  if (nextStatus === "solved") {
    try {
      const { recordStudentEvent } = await import("@/lib/intelligence/student-intelligence");
      const prob = STRIVER_A2Z_PROBLEMS.find(p => p.id === problemId);
      await recordStudentEvent({
        studentId,
        eventType: "dsa_solved",
        payload: {
          problemId,
          problemTitle: prob?.title || `Problem ${problemId}`,
          topicName: prob?.step_title || "Algorithms",
          difficulty: prob?.difficulty || "medium"
        }
      });
    } catch (err) {
      console.warn("Failed to record dsa_solved event to Student Intelligence:", err);
    }
  }

  return updatedRecord;
}

/**
 * Spaced Repetition Review (Phase 1a)
 * Schedule: 3 -> 7 -> 14 -> 30 days (stays at 30 after that)
 * If 'forgot': resets to review_count = 0, next review in 3 days.
 */
export async function recordSpacedReview(
  studentId: string,
  problemId: string,
  result: "retained" | "forgot"
): Promise<{ next_review_date: string; review_count: number }> {
  const current = (await getStudentDsaProgress(studentId))[problemId];
  if (!current || current.status !== "solved") {
    throw new Error("Only solved problems can undergo spaced repetition review.");
  }

  const today = getTodayDateString();
  let nextCount = current.review_count || 0;
  let nextDate = today;

  if (result === "forgot") {
    nextCount = 0;
    nextDate = addDays(today, 3);
  } else {
    // Retained
    nextCount = nextCount + 1;
    let daysToAdd = 3;
    if (nextCount === 1) daysToAdd = 7;
    else if (nextCount === 2) daysToAdd = 14;
    else daysToAdd = 30; // 3+ stays at 30
    nextDate = addDays(today, daysToAdd);
  }

  const updated: DsaProgress = {
    ...current,
    review_count: nextCount,
    next_review_date: nextDate,
    last_reviewed_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    await supabase.from("dsa_progress").upsert(updated, { onConflict: "student_id,problem_id" });
  } catch {}

  if (!inMemoryProgress.has(studentId)) inMemoryProgress.set(studentId, new Map());
  inMemoryProgress.get(studentId)!.set(problemId, updated);

  return { next_review_date: nextDate, review_count: nextCount };
}

/**
 * Get problems due for review today or overdue (Phase 1a)
 */
export async function getDueForReviewProblems(studentId: string): Promise<Array<DsaProblem & { progress: DsaProgress }>> {
  const progressMap = await getStudentDsaProgress(studentId);
  const problems = await getAllProblems();
  const problemMap = new Map(problems.map(p => [p.id, p]));
  const today = getTodayDateString();

  const dueList: Array<DsaProblem & { progress: DsaProgress }> = [];

  for (const prog of Object.values(progressMap)) {
    if (prog.status === "solved" && prog.next_review_date) {
      if (prog.next_review_date <= today) {
        const prob = problemMap.get(prog.problem_id);
        if (prob) {
          dueList.push({ ...prob, progress: prog });
        }
      }
    }
  }

  // Unified Notification Hook: when a problem becomes due for spaced-repetition review -> normal priority
  if (dueList.length > 0) {
    const firstDue = dueList[0];
    await createNotification({
      studentId,
      sourceFeature: "dsa_tracker",
      notificationType: "review_due",
      title: `⚡ Spaced Review Due: ${firstDue.title}`,
      body: `You have ${dueList.length} problem(s) due for retention review today. Keep your algorithmic streak strong!`,
      linkUrl: `/student/dsa-tracker`,
      priority: "normal"
    });
  }

  return dueList;
}

/**
 * Difficulty-Adaptive Suggestions (Phase 1b)
 * If last 5 solved problems in a topic were all 'easy' and marked solved without being reset to 'attempted' first:
 * surface a suggestion: "You've cleared the easy problems in {topic} — try a medium one."
 */
export async function getDifficultyAdaptiveSuggestions(studentId: string): Promise<DsaSuggestion[]> {
  const progressMap = await getStudentDsaProgress(studentId);
  const topics = await getAllTopics();
  const allProblems = await getAllProblems();

  const suggestions: DsaSuggestion[] = [];

  for (const topic of topics) {
    const topicProblems = allProblems.filter(p => p.topic_id === topic.id);
    const solvedInTopic = topicProblems
      .map(p => ({ problem: p, progress: progressMap[p.id] }))
      .filter(item => item.progress && item.progress.status === "solved")
      .sort((a, b) => new Date(b.progress.solved_at || 0).getTime() - new Date(a.progress.solved_at || 0).getTime());

    if (solvedInTopic.length >= 5) {
      const last5 = solvedInTopic.slice(0, 5);
      const all5Easy = last5.every(item => item.problem.difficulty === "easy");
      const noStruggleSignal = last5.every(item => item.progress.previous_status !== "attempted");

      if (all5Easy && noStruggleSignal) {
        const nextMedium = topicProblems.find(
          p => p.difficulty === "medium" && (!progressMap[p.id] || progressMap[p.id].status !== "solved")
        );

        suggestions.push({
          topic_id: topic.id,
          topic_name: topic.name,
          topic_slug: topic.slug,
          message: `You've cleared the easy problems in ${topic.name} without struggling — step up to a medium one to expand your problem-solving depth.`,
          recommended_difficulty: "medium",
          next_problem: nextMedium
        });

        if (suggestions.length >= 2) break;
      }
    }
  }

  return suggestions;
}

/**
 * Weak Topics Detector (Phase 2b)
 * A topic is "weak" if solved-ratio in dsa_progress for that topic is below ~40%
 * AND the student has attempted at least 3 problems in it (distinguishing struggling from not started).
 */
export async function getWeakTopics(studentId: string): Promise<Array<{ topic: DsaTopic; solved_ratio: number; attempted_count: number }>> {
  const progressMap = await getStudentDsaProgress(studentId);
  const topics = await getAllTopics();
  const allProblems = await getAllProblems();

  const weakTopics: Array<{ topic: DsaTopic; solved_ratio: number; attempted_count: number }> = [];

  for (const topic of topics) {
    const topicProblems = allProblems.filter(p => p.topic_id === topic.id);
    if (topicProblems.length === 0) continue;

    let solvedCount = 0;
    let attemptedCount = 0;

    for (const prob of topicProblems) {
      const prog = progressMap[prob.id];
      if (prog) {
        if (prog.status === "solved") solvedCount++;
        if (prog.status === "attempted" || prog.status === "solved") attemptedCount++;
      }
    }

    // Only flag if student has actively attempted at least 3 problems
    if (attemptedCount >= 3) {
      const ratio = solvedCount / topicProblems.length;
      if (ratio < 0.40) {
        weakTopics.push({
          topic,
          solved_ratio: Math.round(ratio * 100),
          attempted_count: attemptedCount
        });
      }
    }
  }

  return weakTopics;
}

/**
 * Analytics: Heatmap, 14-day Cramming Detector, Time-to-Solve (Phase 3)
 */
export async function getDsaLearningAnalytics(studentId: string): Promise<{
  heatmap: Array<{ topic: DsaTopic; total: number; solved: number; completion_pct: number; easy: number; medium: number; hard: number }>;
  cramming_analysis: {
    is_cramming: boolean;
    recent_solves_count: number;
    highest_single_day_solves: number;
    highest_day_percentage: number;
    note: string | null;
  };
  time_trends: {
    has_enough_data: boolean;
    avg_seconds_by_difficulty: { easy: number; medium: number; hard: number };
    total_timed_problems: number;
  };
}> {
  const progressMap = await getStudentDsaProgress(studentId);
  const topics = await getAllTopics();
  const allProblems = await getAllProblems();

  // 1. Topic Mastery Heatmap
  const heatmap = topics.map(topic => {
    const problems = allProblems.filter(p => p.topic_id === topic.id);
    const solved = problems.filter(p => progressMap[p.id]?.status === "solved");
    const easy = solved.filter(p => p.difficulty === "easy").length;
    const medium = solved.filter(p => p.difficulty === "medium").length;
    const hard = solved.filter(p => p.difficulty === "hard").length;

    return {
      topic,
      total: problems.length,
      solved: solved.length,
      completion_pct: problems.length > 0 ? Math.round((solved.length / problems.length) * 100) : 0,
      easy,
      medium,
      hard
    };
  });

  // 2. Consistency vs Cramming Detector (solves across last 14 days)
  const now = new Date();
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(now.getDate() - 14);

  const dayCounts: Record<string, number> = {};
  let total14DaySolves = 0;

  for (const prog of Object.values(progressMap)) {
    if (prog.status === "solved" && prog.solved_at) {
      const d = new Date(prog.solved_at);
      if (d >= fourteenDaysAgo) {
        const dateKey = d.toISOString().split("T")[0];
        dayCounts[dateKey] = (dayCounts[dateKey] || 0) + 1;
        total14DaySolves++;
      }
    }
  }

  let maxSingleDay = 0;
  for (const count of Object.values(dayCounts)) {
    if (count > maxSingleDay) maxSingleDay = count;
  }

  const maxPercent = total14DaySolves > 0 ? (maxSingleDay / total14DaySolves) * 100 : 0;
  const isCramming = total14DaySolves >= 5 && maxPercent >= 60;

  const crammingNote = isCramming
    ? "Most of your recent practice happened in one session — spreading practice across more days tends to help retention more than the same total volume in a single sitting."
    : null;

  // 3. Time-to-Solve Trends
  const timedSolves = Object.values(progressMap)
    .filter(p => p.status === "solved" && (p.time_spent_seconds || 0) > 0)
    .sort((a, b) => new Date(b.solved_at || 0).getTime() - new Date(a.solved_at || 0).getTime())
    .slice(0, 10);

  const hasEnoughData = timedSolves.length >= 3;
  const problemMap = new Map(allProblems.map(p => [p.id, p]));

  const diffTimes: Record<string, { total: number; count: number }> = {
    easy: { total: 0, count: 0 },
    medium: { total: 0, count: 0 },
    hard: { total: 0, count: 0 }
  };

  timedSolves.forEach(item => {
    const prob = problemMap.get(item.problem_id);
    if (prob && item.time_spent_seconds) {
      diffTimes[prob.difficulty].total += item.time_spent_seconds;
      diffTimes[prob.difficulty].count++;
    }
  });

  const avgByDiff = {
    easy: diffTimes.easy.count > 0 ? Math.round(diffTimes.easy.total / diffTimes.easy.count) : 0,
    medium: diffTimes.medium.count > 0 ? Math.round(diffTimes.medium.total / diffTimes.medium.count) : 0,
    hard: diffTimes.hard.count > 0 ? Math.round(diffTimes.hard.total / diffTimes.hard.count) : 0
  };

  return {
    heatmap,
    cramming_analysis: {
      is_cramming: isCramming,
      recent_solves_count: total14DaySolves,
      highest_single_day_solves: maxSingleDay,
      highest_day_percentage: Math.round(maxPercent),
      note: crammingNote
    },
    time_trends: {
      has_enough_data: hasEnoughData,
      avg_seconds_by_difficulty: avgByDiff,
      total_timed_problems: timedSolves.length
    }
  };
}

/**
 * Company-Readiness Score (Phase 3c)
 * (topics relevant to opportunity with >70% solved) / (total relevant topics)
 */
export async function computeCompanyReadinessScore(
  studentId: string,
  opportunityDetails: { id: string; title: string; organizer: string; tags?: string[]; domain_tags?: string[]; extracted_context?: any }
): Promise<{
  readiness_percentage: number;
  relevant_topics: Array<{ topic: DsaTopic; solved_pct: number; is_mastered: boolean }>;
  disclaimer: string;
}> {
  const topics = await getAllTopics();
  const allProblems = await getAllProblems();
  const progressMap = await getStudentDsaProgress(studentId);

  // Match opportunity keywords against topics
  const combinedText = [
    opportunityDetails.title,
    opportunityDetails.organizer,
    ...(opportunityDetails.tags || []),
    ...(opportunityDetails.domain_tags || []),
    opportunityDetails.extracted_context?.summary || "",
    ...(opportunityDetails.extracted_context?.tracks_or_themes || []),
  ].join(" ").toLowerCase();

  const relevantTopics = topics.filter(topic => {
    const tName = topic.name.toLowerCase();
    const tDesc = topic.description.toLowerCase();
    // Heuristic match
    if (combinedText.includes("distributed") || combinedText.includes("system design") || combinedText.includes("architecture")) {
      if (topic.id === "system-design-dsa" || topic.id === "graphs" || topic.id === "stack-queue") return true;
    }
    if (combinedText.includes("algorithm") || combinedText.includes("competitive") || combinedText.includes("coding challenge")) {
      if (topic.id === "arrays-hashing" || topic.id === "dynamic-programming" || topic.id === "trees") return true;
    }
    if (combinedText.includes("ai") || combinedText.includes("ml") || combinedText.includes("genai")) {
      if (topic.id === "arrays-hashing" || topic.id === "sliding-window" || topic.id === "graphs") return true;
    }
    return combinedText.includes(tName.split(" ")[0]) || tDesc.split(" ").some(w => w.length > 4 && combinedText.includes(w));
  });

  const matched = relevantTopics.length > 0 ? relevantTopics : topics.slice(0, 4);

  let masteredCount = 0;
  const topicStats = matched.map(topic => {
    const problems = allProblems.filter(p => p.topic_id === topic.id);
    const solved = problems.filter(p => progressMap[p.id]?.status === "solved");
    const pct = problems.length > 0 ? Math.round((solved.length / problems.length) * 100) : 0;
    const isMastered = pct >= 70;
    if (isMastered) masteredCount++;
    return {
      topic,
      solved_pct: pct,
      is_mastered: isMastered
    };
  });

  const score = Math.round((masteredCount / matched.length) * 100);

  return {
    readiness_percentage: score,
    relevant_topics: topicStats,
    disclaimer: `Your DSA coverage for ${opportunityDetails.organizer}'s likely focus areas is estimated at ${score}%. This is an educational heuristic based on topic overlap, not a prediction or guarantee of interview outcome.`
  };
}

/**
 * Social Layer: Mutual Connections (Phase 4a)
 */
export async function getStudentConnections(studentId: string): Promise<StudentConnection[]> {
  try {
    const { data, error } = await supabase
      .from("student_connections")
      .select("*")
      .or(`requester_student_id.eq.${studentId},recipient_student_id.eq.${studentId}`);
    if (!error && data) return data;
  } catch {}

  const conns: StudentConnection[] = [];
  inMemoryConnections.forEach(c => {
    if (c.requester_student_id === studentId || c.recipient_student_id === studentId) {
      conns.push(c);
    }
  });
  return conns;
}

export async function createConnectionInvite(studentId: string): Promise<{ connection_code: string }> {
  const code = `COG-${Math.floor(1000 + Math.random() * 9000)}`;
  const conn: StudentConnection = {
    id: `conn-${Date.now()}`,
    requester_student_id: studentId,
    recipient_student_id: "",
    connection_code: code,
    status: "pending",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  try {
    await supabase.from("student_connections").insert(conn);
  } catch {}
  inMemoryConnections.set(code, conn);

  return { connection_code: code };
}

export async function acceptConnectionInvite(recipientStudentId: string, code: string): Promise<StudentConnection> {
  const conn = inMemoryConnections.get(code);
  if (!conn) throw new Error("Invalid or expired connection code.");
  if (conn.requester_student_id === recipientStudentId) {
    throw new Error("You cannot connect with your own invite code.");
  }

  conn.recipient_student_id = recipientStudentId;
  conn.status = "accepted";
  conn.updated_at = new Date().toISOString();

  try {
    await supabase.from("student_connections").update(conn).eq("connection_code", code);
  } catch {}

  return conn;
}

/**
 * Social Layer: Leaderboard Preferences (Phase 4b)
 * Default is OPTED-OUT.
 */
export async function getLeaderboardPreferences(studentId: string): Promise<LeaderboardPreference> {
  try {
    const { data } = await supabase.from("student_leaderboard_preferences").select("*").eq("student_id", studentId).maybeSingle();
    if (data) return data;
  } catch {}

  const mem = inMemoryLeaderboardPrefs.get(studentId);
  if (mem) return mem;

  return {
    student_id: studentId,
    is_opted_in: false,
    display_handle: `Coder#${studentId.slice(-4) || "0421"}`,
    college_name: "Engineering Institute",
    updated_at: new Date().toISOString()
  };
}

export async function updateLeaderboardPreference(
  studentId: string,
  isOptedIn: boolean,
  handle?: string
): Promise<LeaderboardPreference> {
  const pref: LeaderboardPreference = {
    student_id: studentId,
    is_opted_in: isOptedIn,
    display_handle: handle?.trim() || `Coder#${studentId.slice(-4) || "0421"}`,
    college_name: "Engineering Institute",
    updated_at: new Date().toISOString()
  };

  try {
    await supabase.from("student_leaderboard_preferences").upsert(pref);
  } catch {}
  inMemoryLeaderboardPrefs.set(studentId, pref);

  return pref;
}

export async function getCollegeLeaderboard(): Promise<Array<{ rank: number; display_handle: string; solved_count: number; streak_days: number }>> {
  // Only students who explicitly opted in
  const optedIn: Array<{ display_handle: string; solved_count: number; streak_days: number }> = [];

  // Seed benchmark opted-in students for rich leaderboard display
  const benchmarkPeers = [
    { display_handle: "AlgoMaster#99", solved_count: 54, streak_days: 12 },
    { display_handle: "BytePioneer#42", solved_count: 48, streak_days: 9 },
    { display_handle: "GraphRider#17", solved_count: 39, streak_days: 7 },
    { display_handle: "NullPointer#08", solved_count: 27, streak_days: 5 },
    { display_handle: "Rustacean#33", solved_count: 21, streak_days: 4 }
  ];

  optedIn.push(...benchmarkPeers);

  // Add real opted-in students
  inMemoryLeaderboardPrefs.forEach((pref, sId) => {
    if (pref.is_opted_in) {
      const pMap = inMemoryProgress.get(sId);
      let count = 0;
      if (pMap) {
        pMap.forEach(p => { if (p.status === "solved") count++; });
      }
      optedIn.push({
        display_handle: pref.display_handle,
        solved_count: count,
        streak_days: count > 0 ? Math.min(14, Math.ceil(count / 2)) : 0
      });
    }
  });

  optedIn.sort((a, b) => b.solved_count - a.solved_count);

  return optedIn.map((item, idx) => ({
    rank: idx + 1,
    ...item
  }));
}

/**
 * Milestone Badges (Phase 5a)
 */
export const BADGE_DEFINITIONS = [
  { type: "first_solve", title: "First Blood", description: "Solved your first DSA problem on Cognalyze.", icon: "🌱" },
  { type: "5_problems", title: "Pattern Seeker", description: "Solved 5 algorithmic problems.", icon: "⚡" },
  { type: "25_problems", title: "Code Craftsman", description: "Cleared 25 DSA benchmark problems.", icon: "🛡️" },
  { type: "50_problems", title: "Half-Centurion", description: "50 problems mastered across topics.", icon: "🏆" },
  { type: "topic_master", title: "Domain Master", description: "Achieved 100% completion on a DSA topic.", icon: "👑" },
  { type: "streak_7", title: "Weekly Champion", description: "7-day continuous practice consistency.", icon: "🔥" }
];

export async function getStudentBadges(studentId: string): Promise<MilestoneBadge[]> {
  try {
    const { data } = await supabase.from("student_badges").select("*").eq("student_id", studentId);
    if (data && data.length > 0) return data;
  } catch {}
  return inMemoryBadges.get(studentId) || [];
}

export async function evaluateMilestoneBadges(studentId: string): Promise<MilestoneBadge[]> {
  const progressMap = await getStudentDsaProgress(studentId);
  const solvedCount = Object.values(progressMap).filter(p => p.status === "solved").length;
  const currentBadges = await getStudentBadges(studentId);
  const earnedTypes = new Set(currentBadges.map(b => b.badge_type));

  const newlyEarned: MilestoneBadge[] = [];

  if (solvedCount >= 1 && !earnedTypes.has("first_solve")) {
    newlyEarned.push({ id: `b-${Date.now()}-1`, student_id: studentId, badge_type: "first_solve", title: "First Blood", description: "Solved your first DSA problem on Cognalyze.", icon: "🌱", earned_at: new Date().toISOString() });
  }
  if (solvedCount >= 5 && !earnedTypes.has("5_problems")) {
    newlyEarned.push({ id: `b-${Date.now()}-5`, student_id: studentId, badge_type: "5_problems", title: "Pattern Seeker", description: "Solved 5 algorithmic problems.", icon: "⚡", earned_at: new Date().toISOString() });
  }
  if (solvedCount >= 25 && !earnedTypes.has("25_problems")) {
    newlyEarned.push({ id: `b-${Date.now()}-25`, student_id: studentId, badge_type: "25_problems", title: "Code Craftsman", description: "Cleared 25 DSA benchmark problems.", icon: "🛡️", earned_at: new Date().toISOString() });
  }
  if (solvedCount >= 50 && !earnedTypes.has("50_problems")) {
    newlyEarned.push({ id: `b-${Date.now()}-50`, student_id: studentId, badge_type: "50_problems", title: "Half-Centurion", description: "50 problems mastered across topics.", icon: "🏆", earned_at: new Date().toISOString() });
  }

  if (newlyEarned.length > 0) {
    const updated = [...currentBadges, ...newlyEarned];
    inMemoryBadges.set(studentId, updated);
    try {
      await supabase.from("student_badges").insert(newlyEarned);
    } catch {}

    // Unified Notification Hook: when a badge is earned -> low priority
    for (const b of newlyEarned) {
      await createNotification({
        studentId,
        sourceFeature: "dsa_tracker",
        notificationType: "badge_earned",
        title: `🏆 New Badge Earned: ${b.icon} ${b.title}!`,
        body: `${b.description}`,
        linkUrl: `/student/dsa-tracker`,
        priority: "low"
      });
    }

    return updated;
  }

  return currentBadges;
}

/**
 * Daily Goal Setting & Reflection (Phase 5b)
 */
export async function getStudentDsaGoal(studentId: string): Promise<{
  daily_target: number;
  last_7_days_completion_pct: number;
  last_30_days_completion_pct: number;
  total_solved_7_days: number;
  total_solved_30_days: number;
}> {
  let target = 2;
  try {
    const { data } = await supabase.from("student_dsa_goals").select("*").eq("student_id", studentId).maybeSingle();
    if (data?.daily_target) target = data.daily_target;
  } catch {}
  const mem = inMemoryGoals.get(studentId);
  if (mem) target = mem.daily_target;

  const progressMap = await getStudentDsaProgress(studentId);
  const now = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(now.getDate() - 7);
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);

  let count7 = 0;
  let count30 = 0;

  for (const prog of Object.values(progressMap)) {
    if (prog.status === "solved" && prog.solved_at) {
      const d = new Date(prog.solved_at);
      if (d >= sevenDaysAgo) count7++;
      if (d >= thirtyDaysAgo) count30++;
    }
  }

  const expected7 = target * 7;
  const expected30 = target * 30;

  return {
    daily_target: target,
    total_solved_7_days: count7,
    total_solved_30_days: count30,
    last_7_days_completion_pct: Math.min(100, Math.round((count7 / Math.max(1, expected7)) * 100)),
    last_30_days_completion_pct: Math.min(100, Math.round((count30 / Math.max(1, expected30)) * 100))
  };
}

export async function setStudentDsaGoal(studentId: string, dailyTarget: number): Promise<DsaDailyGoal> {
  const goal: DsaDailyGoal = {
    student_id: studentId,
    daily_target: Math.max(1, Math.min(20, Math.round(dailyTarget))),
    updated_at: new Date().toISOString()
  };

  try {
    await supabase.from("student_dsa_goals").upsert(goal);
  } catch {}
  inMemoryGoals.set(studentId, goal);

  return goal;
}
