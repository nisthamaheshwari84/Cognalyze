// lib/evidence/leetcode-agent.ts
//
// Stage 2 (part 2): pure numeric evidence, no LLM at all — LeetCode stats are
// already structured facts, so there's nothing to "extract," only to fetch and format.

import { Evidence } from "./types";

const LEETCODE_GRAPHQL = "https://leetcode.com/graphql";

export interface LeetcodeEvidenceDossier {
  candidateId: string;
  username: string;
  found: boolean;
  totalSolved: number;
  easySolved: number;
  mediumSolved: number;
  hardSolved: number;
  contestRating: number | null;
  contestGlobalRanking: number | null;
  evidence: Evidence[];
}

const QUERY = `
  query userStats($username: String!) {
    matchedUser(username: $username) {
      username
      submitStats {
        acSubmissionNum { difficulty count }
      }
    }
    userContestRanking(username: $username) {
      rating
      globalRanking
    }
  }
`;

export async function buildLeetcodeDossier(
  candidateId: string,
  leetcodeUsername: string
): Promise<LeetcodeEvidenceDossier> {
  if (!leetcodeUsername || leetcodeUsername.trim().length === 0) {
    return emptyDossier(candidateId, leetcodeUsername || "unknown");
  }

  try {
    const res = await fetch(LEETCODE_GRAPHQL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: QUERY, variables: { username: leetcodeUsername.trim() } }),
    });

    if (!res.ok) {
      return emptyDossier(candidateId, leetcodeUsername);
    }

    const json = await res.json();
    const matched = json?.data?.matchedUser;
    if (!matched) {
      return emptyDossier(candidateId, leetcodeUsername);
    }

    const counts: Record<string, number> = {};
    for (const entry of matched.submitStats?.acSubmissionNum || []) {
      counts[entry.difficulty] = entry.count;
    }

    const rating = json?.data?.userContestRanking?.rating ?? null;
    const ranking = json?.data?.userContestRanking?.globalRanking ?? null;

    const evidence: Evidence[] = [
      {
        id: `ev_${candidateId}_lc_solved`,
        source_type: "leetcode_stats",
        source_ref: `leetcode.com/${leetcodeUsername}`,
        quote_or_fact: `Solved: total=${counts["All"] ?? 0}, easy=${counts["Easy"] ?? 0}, medium=${counts["Medium"] ?? 0}, hard=${counts["Hard"] ?? 0}`,
        extracted_at: new Date().toISOString(),
      },
    ];

    if (rating !== null) {
      evidence.push({
        id: `ev_${candidateId}_lc_contest`,
        source_type: "leetcode_stats",
        source_ref: `leetcode.com/${leetcodeUsername}/contest`,
        quote_or_fact: `Contest rating=${rating}, globalRanking=${ranking}`,
        extracted_at: new Date().toISOString(),
      });
    }

    return {
      candidateId,
      username: leetcodeUsername,
      found: true,
      totalSolved: counts["All"] ?? 0,
      easySolved: counts["Easy"] ?? 0,
      mediumSolved: counts["Medium"] ?? 0,
      hardSolved: counts["Hard"] ?? 0,
      contestRating: rating,
      contestGlobalRanking: ranking,
      evidence,
    };
  } catch {
    return emptyDossier(candidateId, leetcodeUsername);
  }
}

function emptyDossier(candidateId: string, username: string): LeetcodeEvidenceDossier {
  return {
    candidateId,
    username,
    found: false,
    totalSolved: 0,
    easySolved: 0,
    mediumSolved: 0,
    hardSolved: 0,
    contestRating: null,
    contestGlobalRanking: null,
    evidence: [
      {
        id: `ev_${candidateId}_lc_notfound`,
        source_type: "leetcode_stats",
        source_ref: `leetcode.com/${username}`,
        quote_or_fact: "No matching LeetCode profile found or API returned no data.",
        extracted_at: new Date().toISOString(),
      },
    ],
  };
}
