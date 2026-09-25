/**
 * LEETCODE EVIDENCE COLLECTOR
 * 
 * WARNING: Unofficial and unstable API dependency.
 * LeetCode does not provide a public authenticated REST API. This collector queries
 * the public LeetCode GraphQL gateway.
 * 
 * FAILURE CONTRACT:
 * - Every call is wrapped in a strict try/catch block with a short timeout.
 * - Any failure (403, 429, Cloudflare challenge, network error, or schema change)
 *   returns normalized_facts: null and writes status: unknown.
 * - This collector MUST NEVER throw an unhandled exception.
 * - Total failure MUST NEVER block candidate pipeline progression.
 */

import { LeetCodeFacts } from "./types";

export function extractLeetCodeUsername(handleOrUrl: string): string {
  if (!handleOrUrl) return "";
  const cleaned = handleOrUrl.trim().replace(/\/$/, "");
  const match = cleaned.match(/(?:leetcode\.com\/(?:u\/)?|^@?)([a-zA-Z0-9_.-]+)$/i);
  return match ? match[1] : cleaned.replace(/^@/, "");
}

const LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql";

const USER_PROFILE_QUERY = `
query getUserProfile($username: String!) {
  matchedUser(username: $username) {
    username
    profile {
      ranking
      reputation
    }
    submitStatsGlobal {
      acSubmissionNum {
        difficulty
        count
      }
    }
  }
  userContestRanking(username: $username) {
    rating
    globalRanking
    totalParticipants
    topPercentage
  }
}
`;

/**
 * Surface pull for LeetCode:
 * Total solved, easy/medium/hard breakdown, contest rating, and global ranking.
 */
export async function pullLeetCode(
  usernameOrUrl: string
): Promise<{ raw_data: any; normalized_facts: LeetCodeFacts | null }> {
  const username = extractLeetCodeUsername(usernameOrUrl);
  if (!username) {
    return {
      raw_data: { error: "Missing or invalid LeetCode username" },
      normalized_facts: null,
    };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout so LeetCode never stalls the pipeline

    const res = await fetch(LEETCODE_GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: `https://leetcode.com/${encodeURIComponent(username)}/`,
      },
      body: JSON.stringify({
        query: USER_PROFILE_QUERY,
        variables: { username },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      return {
        raw_data: { status: res.status, statusText: res.statusText, body: errText.slice(0, 300) },
        normalized_facts: null,
      };
    }

    const data = await res.json();
    const matchedUser = data?.data?.matchedUser;

    if (!matchedUser) {
      return {
        raw_data: { error: "LeetCode user not found or private profile", data },
        normalized_facts: null,
      };
    }

    const submissions = matchedUser.submitStatsGlobal?.acSubmissionNum || [];
    let totalSolved = 0;
    let easySolved = 0;
    let mediumSolved = 0;
    let hardSolved = 0;

    for (const item of submissions) {
      const diff = (item.difficulty || "").toLowerCase();
      const count = Number(item.count) || 0;
      if (diff === "all") totalSolved = count;
      else if (diff === "easy") easySolved = count;
      else if (diff === "medium") mediumSolved = count;
      else if (diff === "hard") hardSolved = count;
    }

    // If "all" was not present, sum parts
    if (totalSolved === 0 && (easySolved > 0 || mediumSolved > 0 || hardSolved > 0)) {
      totalSolved = easySolved + mediumSolved + hardSolved;
    }

    const contestRanking = data?.data?.userContestRanking;
    const contestRating = contestRanking?.rating ? Math.round(contestRanking.rating) : undefined;
    const globalRanking = matchedUser.profile?.ranking || contestRanking?.globalRanking || undefined;

    const normalized: LeetCodeFacts = {
      username: matchedUser.username || username,
      total_solved: totalSolved,
      easy_solved: easySolved,
      medium_solved: mediumSolved,
      hard_solved: hardSolved,
      contest_rating: contestRating,
      global_ranking: globalRanking,
    };

    return {
      raw_data: {
        matchedUser: {
          username: matchedUser.username,
          ranking: matchedUser.profile?.ranking,
        },
        contestRanking,
      },
      normalized_facts: normalized,
    };
  } catch (err: any) {
    // Unofficial API failure handling: Log safely and return null normalized_facts.
    // The pipeline marks this row as 'unknown' and never crashes.
    return {
      raw_data: { error: err?.name === "AbortError" ? "LeetCode API request timed out" : (err?.message || String(err)) },
      normalized_facts: null,
    };
  }
}
