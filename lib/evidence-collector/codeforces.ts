/**
 * CODEFORCES EVIDENCE COLLECTOR
 * 
 * Rules:
 * 1. Fetch raw data from the open Codeforces API.
 * 2. Normalize it into plain structured facts (numbers, dates, counts — NO interpretation).
 * 3. Never calls an LLM and never assigns an evidence status.
 */

import { CodeforcesFacts } from "./types";

export function extractCodeforcesHandle(handleOrUrl: string): string {
  if (!handleOrUrl) return "";
  const cleaned = handleOrUrl.trim().replace(/\/$/, "");
  const match = cleaned.match(/(?:codeforces\.com\/profile\/|^@?)([a-zA-Z0-9_.-]+)$/i);
  return match ? match[1] : cleaned.replace(/^@/, "");
}

/**
 * Surface pull for Codeforces:
 * Current rating, max rating, contest count, problems solved bucketed by difficulty.
 */
export async function pullCodeforces(
  handleOrUrl: string
): Promise<{ raw_data: any; normalized_facts: CodeforcesFacts | null }> {
  const handle = extractCodeforcesHandle(handleOrUrl);
  if (!handle) {
    return {
      raw_data: { error: "Missing or invalid Codeforces handle" },
      normalized_facts: null,
    };
  }

  try {
    // 1. Fetch user info
    const userRes = await fetch(
      `https://codeforces.com/api/user.info?handles=${encodeURIComponent(handle)}`,
      {
        headers: { "User-Agent": "Cognalyze-EvidenceCollector/1.0" },
      }
    );

    if (!userRes.ok) {
      const errText = await userRes.text();
      return {
        raw_data: { status: userRes.status, statusText: userRes.statusText, body: errText },
        normalized_facts: null,
      };
    }

    const userData = await userRes.json();
    if (userData.status !== "OK" || !Array.isArray(userData.result) || userData.result.length === 0) {
      return {
        raw_data: { error: "Codeforces user not found", response: userData },
        normalized_facts: null,
      };
    }

    const user = userData.result[0];

    // 2. Fetch user rating history / contests
    let contestCount = 0;
    try {
      const ratingRes = await fetch(
        `https://codeforces.com/api/user.rating?handle=${encodeURIComponent(handle)}`,
        { headers: { "User-Agent": "Cognalyze-EvidenceCollector/1.0" } }
      );
      if (ratingRes.ok) {
        const ratingData = await ratingRes.json();
        if (ratingData.status === "OK" && Array.isArray(ratingData.result)) {
          contestCount = ratingData.result.length;
        }
      }
    } catch {
      // Contest count remains 0 if rating call fails
    }

    // 3. Fetch submissions to extract solved problem counts
    const solvedByDiff: Record<string, number> = {
      "<1200": 0,
      "1200-1599": 0,
      "1600-1999": 0,
      "2000+": 0,
    };
    const solvedProblemIds = new Set<string>();

    try {
      const statusRes = await fetch(
        `https://codeforces.com/api/user.status?handle=${encodeURIComponent(handle)}&from=1&count=1000`,
        { headers: { "User-Agent": "Cognalyze-EvidenceCollector/1.0" } }
      );

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        if (statusData.status === "OK" && Array.isArray(statusData.result)) {
          for (const sub of statusData.result) {
            if (sub.verdict === "OK" && sub.problem) {
              const problemKey = `${sub.problem.contestId}-${sub.problem.index}`;
              if (!solvedProblemIds.has(problemKey)) {
                solvedProblemIds.add(problemKey);
                const rating = typeof sub.problem.rating === "number" ? sub.problem.rating : null;
                if (rating === null || rating < 1200) {
                  solvedByDiff["<1200"]++;
                } else if (rating <= 1599) {
                  solvedByDiff["1200-1599"]++;
                } else if (rating <= 1999) {
                  solvedByDiff["1600-1999"]++;
                } else {
                  solvedByDiff["2000+"]++;
                }
              }
            }
          }
        }
      }
    } catch {
      // Keep whatever submissions could be processed
    }

    const normalized: CodeforcesFacts = {
      handle: user.handle,
      current_rating: user.rating || 0,
      max_rating: user.maxRating || 0,
      rank: user.rank || "unranked",
      contest_count: contestCount,
      total_solved: solvedProblemIds.size,
      solved_by_difficulty: solvedByDiff,
    };

    return {
      raw_data: {
        handle: user.handle,
        rating: user.rating,
        maxRating: user.maxRating,
        rank: user.rank,
        contestCount,
        submissions_sample_size: solvedProblemIds.size,
      },
      normalized_facts: normalized,
    };
  } catch (err: any) {
    return {
      raw_data: { error: err?.message || String(err) },
      normalized_facts: null,
    };
  }
}
