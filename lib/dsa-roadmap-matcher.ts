import { SEED_DSA_TOPICS, DsaTopic } from "./dsa-store";

export interface MatchedAction {
  originalText: string;
  matchedTopic: DsaTopic | null;
  deepLinkUrl: string | null;
}

/**
 * Matches action text against known DSA topic names (case-insensitive substring/word match).
 * If matched, returns deep-link URL: /student/dsa-tracker?topic={topic_slug}.
 */
export function matchActionToDsaTopic(actionText: string, topics: DsaTopic[] = SEED_DSA_TOPICS): MatchedAction {
  if (!actionText || typeof actionText !== "string") {
    return { originalText: "", matchedTopic: null, deepLinkUrl: null };
  }

  const clean = actionText.toLowerCase();

  // Explicit mappings for common phrases
  const aliases: Record<string, string> = {
    "dynamic programming": "dynamic-programming",
    "dp": "dynamic-programming",
    "binary search": "binary-search",
    "graph": "graphs",
    "bfs": "graphs",
    "dfs": "graphs",
    "tree": "trees",
    "bst": "trees",
    "linked list": "linked-list",
    "stack": "stack-queue",
    "queue": "stack-queue",
    "heap": "heaps",
    "priority queue": "heaps",
    "two pointer": "two-pointers",
    "sliding window": "sliding-window",
    "trie": "tries",
    "backtracking": "backtracking",
    "greedy": "greedy",
    "system design": "system-design-dsa",
    "hash map": "arrays-hashing",
    "hash table": "arrays-hashing",
    "array": "arrays-hashing"
  };

  for (const [key, slug] of Object.entries(aliases)) {
    const regex = new RegExp(`\\b${key}\\b`, "i");
    if (regex.test(clean)) {
      const topic = topics.find(t => t.slug === slug);
      if (topic) {
        return {
          originalText: actionText,
          matchedTopic: topic,
          deepLinkUrl: `/student/dsa-tracker?topic=${topic.slug}`
        };
      }
    }
  }

  // Fallback: match direct topic names
  for (const topic of topics) {
    const words = topic.name.toLowerCase().split(/[\s&/]+/);
    for (const w of words) {
      if (w.length >= 4 && clean.includes(w)) {
        return {
          originalText: actionText,
          matchedTopic: topic,
          deepLinkUrl: `/student/dsa-tracker?topic=${topic.slug}`
        };
      }
    }
  }

  return {
    originalText: actionText,
    matchedTopic: null,
    deepLinkUrl: null
  };
}
