/**
 * COGNALYZE GD ARENA — SERVER TOPIC HISTORY, DEDUPLICATION & CUSTOM BRIEF SERVICE
 *
 * - Persists user topic history in Supabase `gd_topic_history` (+ in-memory cache)
 * - Enriches custom student prompts into balanced 2-camp discussion briefs via AI Gateway
 * - Provides Student DNA relevance scoring for topic discovery
 */

import { isSupabaseAvailable, supabaseAdmin } from "@/lib/supabase";
import { GDTopicItem, scoreTopicForStudentDNA } from "@/lib/group-discussion-data";
import { runGDJsonCompletion, sanitizeGDPromptInput } from "./ai-gateway";

export { scoreTopicForStudentDNA };

const inMemoryTopicHistory = new Map<string, string[]>();

export async function getUserTopicHistoryAsync(userId: string): Promise<string[]> {
  const local = inMemoryTopicHistory.get(userId) || [];
  try {
    if (await isSupabaseAvailable()) {
      const { data, error } = await supabaseAdmin
        .from("gd_topic_history")
        .select("topic_title")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(120);
      if (!error && Array.isArray(data)) {
        const cloudTitles = data.map((r: any) => String(r.topic_title || "")).filter(Boolean);
        return Array.from(new Set([...cloudTitles, ...local]));
      }
    }
  } catch {}
  return local;
}

export async function recordGeneratedTopicsAsync(
  userId: string,
  topics: Array<{ title: string; domain?: string; category?: string; difficulty?: string }>
): Promise<void> {
  if (!topics || topics.length === 0) return;

  const prev = inMemoryTopicHistory.get(userId) || [];
  const merged = Array.from(new Set([...topics.map((t) => t.title), ...prev])).slice(0, 200);
  inMemoryTopicHistory.set(userId, merged);

  try {
    if (!(await isSupabaseAvailable())) return;
    const rows = topics.map((t) => ({
      id: `gdth_${Date.now()}_${globalThis.crypto.randomUUID().slice(0, 8)}`,
      user_id: userId,
      topic_title: t.title,
      domain: t.domain || null,
      category: t.category || null,
      difficulty: t.difficulty || null
    }));
    await supabaseAdmin.from("gd_topic_history").insert(rows);
  } catch (err: any) {
    console.warn("[topic-service] Failed to persist topic history:", err?.message || err);
  }
}

export interface CustomTopicBrief {
  valid: boolean;
  reason?: string;
  normalizedTitle: string;
  context: string;
  propositionCamp: string;
  oppositionCamp: string;
  keyQuestions: string[];
  category: GDTopicItem["category"];
}

export async function prepareCustomTopicBrief(params: {
  rawPrompt: string;
  targetRole?: string;
}): Promise<CustomTopicBrief> {
  const clean = sanitizeGDPromptInput(params.rawPrompt, 240);
  const words = clean.split(/\s+/).filter(Boolean);

  if (words.length < 4) {
    return {
      valid: false,
      reason: "Please provide a complete debatable prompt with at least 4 words (e.g., 'Should startups prioritize microservices over monoliths?').",
      normalizedTitle: clean,
      context: "",
      propositionCamp: "",
      oppositionCamp: "",
      keyQuestions: [],
      category: "Technical"
    };
  }

  const aiBrief = await runGDJsonCompletion<Omit<CustomTopicBrief, "valid" | "reason">>({
    role: "topic_generator",
    systemPrompt:
      "Transform a student's Group Discussion prompt into a neutral, non-leading, balanced two-sided debate brief. Never invent statistics.",
    userPrompt: `Student custom prompt: "${clean}"\nTarget role context: "${sanitizeGDPromptInput(params.targetRole || "Software Engineer", 80)}"\n\nReturn JSON ONLY:\n{\n  "normalizedTitle": "Refined clear debatable topic title",\n  "context": "1-2 sentences setting factual industry framing",\n  "propositionCamp": "Strongest core thesis supporting option A",\n  "oppositionCamp": "Strongest counter-thesis supporting option B",\n  "keyQuestions": ["Trade-off question 1", "Risk/ethics question 2", "Operational scalability question 3"],\n  "category": "Technical" | "Business" | "Abstract" | "HR" | "AI & Technology" | "Current / Relevant"\n}`,
    validate: (parsed) => {
      if (
        typeof parsed?.normalizedTitle !== "string" ||
        typeof parsed?.propositionCamp !== "string" ||
        typeof parsed?.oppositionCamp !== "string"
      ) {
        return null;
      }
      return {
        normalizedTitle: parsed.normalizedTitle.trim() || clean,
        context: String(parsed.context || "Multi-perspective trade-off discussion.").trim(),
        propositionCamp: parsed.propositionCamp.trim(),
        oppositionCamp: parsed.oppositionCamp.trim(),
        keyQuestions: Array.isArray(parsed.keyQuestions) ? parsed.keyQuestions.slice(0, 4).map(String) : [],
        category: parsed.category || "Technical"
      };
    }
  });

  if (aiBrief.ok) {
    return { valid: true, ...aiBrief.data };
  }

  return {
    valid: true,
    normalizedTitle: clean,
    context: `Structured Group Discussion examining operational, economic, and long-term trade-offs around "${clean}".`,
    propositionCamp: "Prioritizes execution speed, innovation leverage, and near-term capability gains.",
    oppositionCamp: "Prioritizes systemic reliability, risk governance, and sustainable long-term unit economics.",
    keyQuestions: [
      "What are the measurable operational trade-offs over a 12-to-24 month horizon?",
      "Which failure modes or stakeholder risks must be mitigated first?",
      "Where is a hybrid or phased rollout stronger than an all-or-nothing stance?"
    ],
    category: "Technical"
  };
}
