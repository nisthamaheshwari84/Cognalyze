/**
 * COGNALYZE GD ARENA — GD SKILLS LAB SERVICE & MASTERY PERSISTENCE (PHASE 9)
 *
 * Powers the 12 targeted GD communication micro-drills:
 * - Generates contextual 1-turn micro-drill scenarios + peer cues
 * - Evaluates student responses strictly against each track's 3 rubric criteria
 * - Persists attemptCount, bestScore, latestScore, and feedback in Supabase `gd_skills_lab_progress`
 */

import { GD_SKILLS_LAB_TRACKS, GDSkillTrackSpec } from "@/components/gd/gd-theme";
import { isSupabaseAvailable, supabaseAdmin } from "@/lib/supabase";
import { runGDJsonCompletion, sanitizeGDPromptInput } from "./ai-gateway";

export interface GDSkillProgressRecord {
  userId: string;
  trackId: string;
  attemptCount: number;
  bestScore: number;
  latestScore: number;
  lastFeedback?: any;
  completedAt: string | null;
  updatedAt: string;
}

export interface GDSkillDrillScenario {
  trackId: string;
  trackTitle: string;
  category: string;
  promptScenario: string;
  peerSetupLine: string;
  targetGuidance: string;
  rubricChecklist: string[];
}

export interface GDSkillDrillEvaluation {
  trackId: string;
  score: number;
  passed: boolean;
  rubricHits: Array<{ criterion: string; met: boolean; note: string }>;
  coachFeedback: string;
  improvedExample: string;
  attemptCount: number;
  bestScore: number;
}

const inMemorySkillsProgress = new Map<string, Map<string, GDSkillProgressRecord>>();

export function getSkillTrackById(trackId: string): GDSkillTrackSpec | null {
  return GD_SKILLS_LAB_TRACKS.find((t) => t.id === trackId) || null;
}

export async function getUserSkillsProgressAsync(userId: string): Promise<GDSkillProgressRecord[]> {
  const localMap = inMemorySkillsProgress.get(userId) || new Map<string, GDSkillProgressRecord>();

  try {
    if (await isSupabaseAvailable()) {
      const { data, error } = await supabaseAdmin
        .from("gd_skills_lab_progress")
        .select("*")
        .eq("user_id", userId);
      if (!error && Array.isArray(data)) {
        for (const r of data) {
          localMap.set(r.track_id, {
            userId: r.user_id,
            trackId: r.track_id,
            attemptCount: Number(r.attempt_count || 0),
            bestScore: Number(r.best_score || 0),
            latestScore: Number(r.latest_score || 0),
            lastFeedback: r.last_feedback || null,
            completedAt: r.completed_at || null,
            updatedAt: r.updated_at
          });
        }
        inMemorySkillsProgress.set(userId, localMap);
      }
    }
  } catch {}

  return Array.from(localMap.values());
}

async function saveUserSkillProgressAsync(record: GDSkillProgressRecord): Promise<void> {
  const userMap = inMemorySkillsProgress.get(record.userId) || new Map<string, GDSkillProgressRecord>();
  userMap.set(record.trackId, record);
  inMemorySkillsProgress.set(record.userId, userMap);

  try {
    if (!(await isSupabaseAvailable())) return;
    await supabaseAdmin.from("gd_skills_lab_progress").upsert(
      {
        id: `gdskill_${record.userId}_${record.trackId}`,
        user_id: record.userId,
        track_id: record.trackId,
        attempt_count: record.attemptCount,
        best_score: record.bestScore,
        latest_score: record.latestScore,
        last_feedback: record.lastFeedback || null,
        completed_at: record.completedAt,
        updated_at: record.updatedAt
      },
      { onConflict: "user_id,track_id" }
    );
  } catch (err: any) {
    console.warn("[skills-lab] Failed to persist progress:", err?.message || err);
  }
}

export async function generateSkillDrillScenarioAsync(params: {
  trackId: string;
  targetRole?: string;
}): Promise<GDSkillDrillScenario | null> {
  const track = getSkillTrackById(params.trackId);
  if (!track) return null;

  const safeRole = sanitizeGDPromptInput(params.targetRole || "Software Engineer", 80);

  const aiScenario = await runGDJsonCompletion<{
    promptScenario: string;
    peerSetupLine: string;
    targetGuidance: string;
  }>({
    role: "skills_lab_coach",
    systemPrompt:
      "You create focused 30-to-45 second micro-drill scenarios for engineering placement Group Discussions.",
    userPrompt: `SKILL TRACK: "${track.title}" (${track.category} | ${track.difficulty})
OBJECTIVE: "${track.objective}"
RUBRIC SIGNALS: ${track.rubricFocus.join(", ")}
TARGET ROLE: ${safeRole}

Create one sharp realistic mid-discussion setup cue (a peer's preceding statement) and concise prompt asking the student to respond cleanly.
Return JSON ONLY:
{
  "promptScenario": "2-sentence scenario context",
  "peerSetupLine": "Realistic 1-2 sentence quote just spoken by an AI peer",
  "targetGuidance": "1-sentence tactical hint on what makes a top answer"
}`,
    validate: (p) =>
      typeof p?.promptScenario === "string" && typeof p?.peerSetupLine === "string"
        ? {
            promptScenario: p.promptScenario.trim(),
            peerSetupLine: p.peerSetupLine.trim(),
            targetGuidance: String(p.targetGuidance || track.objective).trim()
          }
        : null
  });

  if (aiScenario.ok) {
    return {
      trackId: track.id,
      trackTitle: track.title,
      category: track.category,
      ...aiScenario.data,
      rubricChecklist: track.rubricFocus
    };
  }

  return {
    trackId: track.id,
    trackTitle: track.title,
    category: track.category,
    promptScenario: `Practice round for "${track.title}" (${safeRole} focus): ${track.objective}`,
    peerSetupLine:
      track.category === "Opening"
        ? "Moderator Alex: The panel is ready. Someone please frame today's core tension before we debate specifics."
        : track.category === "Composure"
        ? "Rohan V.: Hold on—wait a second, that assumption misses the entire operational bottleneck and wastes time!"
        : "Ananya M.: If we optimize exclusively for speed right now, we completely ignore long-term security and audit risk.",
    targetGuidance: `Hit all 3 rubric goals concisely: ${track.rubricFocus.join(" -> ")}.`,
    rubricChecklist: track.rubricFocus
  };
}

export async function evaluateSkillDrillResponseAsync(params: {
  userId: string;
  trackId: string;
  promptScenario: string;
  peerSetupLine: string;
  studentResponse: string;
}): Promise<GDSkillDrillEvaluation | { error: string }> {
  const track = getSkillTrackById(params.trackId);
  if (!track) return { error: "Unknown Skills Lab track ID." };

  const clean = sanitizeGDPromptInput(params.studentResponse, 700);
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length < 4) {
    return { error: "Please speak or write at least a complete sentence (4+ words) to evaluate this drill." };
  }

  const aiEval = await runGDJsonCompletion<{
    score: number;
    rubricHits: Array<{ criterion: string; met: boolean; note: string }>;
    coachFeedback: string;
    improvedExample: string;
  }>({
    role: "skills_lab_coach",
    systemPrompt:
      "You are Cognalyze's GD Skills Coach. Grade a student's targeted micro-drill turn fairly against the 3 exact rubric criteria. Never inflate scores on vague platitudes.",
    userPrompt: `TRACK: "${track.title}" (${track.objective})
RUBRIC CRITERIA:
1. ${track.rubricFocus[0]}
2. ${track.rubricFocus[1]}
3. ${track.rubricFocus[2]}

SCENARIO: ${sanitizeGDPromptInput(params.promptScenario, 300)}
PEER SETUP LINE: "${sanitizeGDPromptInput(params.peerSetupLine, 260)}"
STUDENT RESPONSE: "${clean}"

Return JSON ONLY:
{
  "score": 80,
  "rubricHits": [
    { "criterion": "${track.rubricFocus[0]}", "met": true, "note": "1-sentence observation" }
  ],
  "coachFeedback": "2-sentence specific coaching critique",
  "improvedExample": "Stronger 2-sentence version refining the student's actual point"
}`,
    validate: (p) =>
      typeof p?.score === "number" && Array.isArray(p?.rubricHits) && typeof p?.coachFeedback === "string"
        ? {
            score: Math.max(0, Math.min(100, Math.round(p.score))),
            rubricHits: p.rubricHits.slice(0, 3).map((h: any, idx: number) => ({
              criterion: String(h?.criterion || track.rubricFocus[idx] || "Criterion"),
              met: Boolean(h?.met),
              note: String(h?.note || "Evaluated against response.")
            })),
            coachFeedback: p.coachFeedback.trim(),
            improvedExample: String(p.improvedExample || "").trim()
          }
        : null
  });

  let score: number;
  let rubricHits: GDSkillDrillEvaluation["rubricHits"];
  let coachFeedback: string;
  let improvedExample: string;

  if (aiEval.ok) {
    score = aiEval.data.score;
    rubricHits = aiEval.data.rubricHits;
    coachFeedback = aiEval.data.coachFeedback;
    improvedExample = aiEval.data.improvedExample;
  } else {
    // Grounded deterministic rubric check if LLM unavailable
    const hasReason = /\b(because|therefore|if|trade-off|risk|cost|metric|sla|while)\b/i.test(clean);
    const hasLength = words.length >= 16;
    const hasBridge = /\b(building on|agree|however|rohan|ananya|priya|panel|both)\b/i.test(clean);
    const metFlags = [hasLength, hasReason, hasBridge];
    const metCount = metFlags.filter(Boolean).length;
    score = metCount === 3 ? 84 : metCount === 2 ? 72 : metCount === 1 ? 58 : 42;
    rubricHits = track.rubricFocus.map((criterion, idx) => ({
      criterion,
      met: metFlags[idx] ?? false,
      note: metFlags[idx] ? "Signal observed in response." : "Expand explicitly on this dimension in your next pass."
    }));
    coachFeedback =
      score >= 70
        ? "Clear, focused drill response hitting core structure. Keep grounding claims in concrete constraints."
        : "Your response was concise, but missed explicit bridging or causal trade-off grounding.";
    improvedExample = `Building on the panel's baseline point, "${clean.slice(0, 70)}..." — because doing so protects reliability while maintaining clear delivery ownership.`;
  }

  const passed = score >= 70;
  const existingList = await getUserSkillsProgressAsync(params.userId);
  const existing = existingList.find((p) => p.trackId === params.trackId);

  const nextAttemptCount = (existing?.attemptCount || 0) + 1;
  const nextBestScore = Math.max(existing?.bestScore || 0, score);
  const nowIso = new Date().toISOString();

  await saveUserSkillProgressAsync({
    userId: params.userId,
    trackId: params.trackId,
    attemptCount: nextAttemptCount,
    bestScore: nextBestScore,
    latestScore: score,
    lastFeedback: { coachFeedback, rubricHits },
    completedAt: passed ? existing?.completedAt || nowIso : existing?.completedAt || null,
    updatedAt: nowIso
  });

  return {
    trackId: track.id,
    score,
    passed,
    rubricHits,
    coachFeedback,
    improvedExample,
    attemptCount: nextAttemptCount,
    bestScore: nextBestScore
  };
}
