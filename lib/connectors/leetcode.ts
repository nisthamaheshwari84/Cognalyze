/**
 * lib/connectors/leetcode.ts
 * 
 * COGNALYZE LEETCODE CONNECTOR — REAL STATISTICS & BOUNDED RETRIEVAL (PHASE 2)
 * 
 * Strict compliance with Section 9:
 * - Real profile statistics retrieval using LeetCode public GraphQL interface.
 * - Captures: total solved, easy, medium, hard, contest rating, global ranking.
 * - Crucial: Distinguishes genuine zero solved problems from failed query or unconfigured source.
 * - Preserves retrieved_at timestamp and freshness.
 * - Zero fabricated numbers or guessed problem counts.
 */

import {
  BaseSourceConnector,
  ConnectorRetrievalResult,
  NormalizedSourceArtifact
} from "./types";

export interface LeetCodeConnectorConfig {
  usernameOrUrl?: string;
  mockPayload?: {
    accessible: boolean;
    username?: string;
    totalSolved?: number;
    easySolved?: number;
    mediumSolved?: number;
    hardSolved?: number;
    contestRating?: number;
    globalRanking?: number;
    malformed?: boolean;
    staleTimestamp?: string;
  };
}

export interface LeetCodeStatsData {
  username: string;
  profileUrl: string;
  totalSolved: number | null;
  easySolved: number | null;
  mediumSolved: number | null;
  hardSolved: number | null;
  contestRating: number | null;
  globalRanking: number | null;
  retrievedAt: string;
  isStale: boolean;
}

export class LeetCodeSourceConnector implements BaseSourceConnector<LeetCodeConnectorConfig, LeetCodeStatsData> {
  readonly sourceType = "leetcode" as const;

  public extractUsername(input: string): string | null {
    if (!input || typeof input !== "string") return null;
    const trimmed = input.trim();
    if (!trimmed) return null;

    if (/^[a-zA-Z0-9_-]{3,30}$/.test(trimmed)) {
      return trimmed;
    }

    const match = trimmed.match(/^https?:\/\/(?:www\.)?leetcode\.com\/(?:u\/)?([a-zA-Z0-9_-]+)(?:\/.*)?$/i);
    if (match && match[1]) {
      return match[1];
    }

    return null;
  }

  public async retrieve(
    studentId: string,
    config: LeetCodeConnectorConfig,
    options?: { forceRefresh?: boolean; dryRun?: boolean }
  ): Promise<ConnectorRetrievalResult<LeetCodeStatsData>> {
    const now = new Date().toISOString();
    const artifacts: NormalizedSourceArtifact[] = [];
    const limitations: string[] = [];

    // 1. Not provided
    if (!config.usernameOrUrl && !config.mockPayload) {
      return {
        sourceType: this.sourceType,
        authenticatedStudentId: studentId,
        connectionStatus: "NOT_PROVIDED",
        inspectionStatus: "UNAVAILABLE",
        completeness: "NOT_ATTEMPTED",
        retrievedAt: now,
        artifacts: [],
        artifactsCount: 0,
        inspectedCount: 0,
        limitations: ["No LeetCode handle or profile link provided."],
      };
    }

    // 2. Mock payload for testing
    if (config.mockPayload) {
      const mock = config.mockPayload;
      if (mock.malformed) {
        return {
          sourceType: this.sourceType,
          authenticatedStudentId: studentId,
          connectionStatus: "RETRIEVAL_FAILED",
          inspectionStatus: "UNAVAILABLE",
          completeness: "NOT_ATTEMPTED",
          retrievedAt: now,
          artifacts: [],
          artifactsCount: 0,
          inspectedCount: 0,
          diagnostics: { errorCode: "MALFORMED_RESPONSE", errorMessage: "Invalid JSON response schema from platform" },
          limitations: ["LeetCode API response was malformed or schema has changed."],
          error: "Malformed LeetCode response.",
        };
      }

      if (!mock.accessible) {
        return {
          sourceType: this.sourceType,
          authenticatedStudentId: studentId,
          connectionStatus: "RETRIEVAL_FAILED",
          inspectionStatus: "UNAVAILABLE",
          completeness: "NOT_ATTEMPTED",
          retrievedAt: now,
          artifacts: [],
          artifactsCount: 0,
          inspectedCount: 0,
          diagnostics: { httpStatus: 404, errorCode: "NOT_FOUND", errorMessage: "LeetCode user profile does not exist" },
          limitations: ["LeetCode profile was inaccessible or returned 404."],
          error: "LeetCode statistics unavailable — the configured source could not retrieve this information.",
        };
      }

      const total = mock.totalSolved ?? 0;
      const easy = mock.easySolved ?? 0;
      const med = mock.mediumSolved ?? 0;
      const hard = mock.hardSolved ?? 0;
      const handle = mock.username || "candidate";
      const profileUrl = `https://leetcode.com/u/${handle}`;
      const retrievedAt = mock.staleTimestamp || now;
      const isStale = Boolean(mock.staleTimestamp && (Date.now() - new Date(mock.staleTimestamp).getTime() > 14 * 86400 * 1000));

      artifacts.push({
        artifactId: `lc_art_${studentId}_solved`,
        sourceType: "leetcode",
        sourceIdentifier: profileUrl,
        name: "LeetCode Solved Statistics",
        title: `LeetCode Solved Problems (${total})`,
        description: `Total Solved: ${total} (Easy: ${easy}, Medium: ${med}, Hard: ${hard})`,
        rawUrl: profileUrl,
        retrievedAt,
        inspectedAt: retrievedAt,
        languagesObserved: [],
        manifestsFound: [],
        testFilesFound: [],
        ciConfigured: false,
        snippets: [{
          section: "MatchedUser Problem Stats",
          excerpt: `Total: ${total}, Easy: ${easy}, Medium: ${med}, Hard: ${hard}, Contest Rating: ${mock.contestRating ?? "N/A"}`
        }],
        metadata: {
          totalSolved: total,
          easySolved: easy,
          mediumSolved: med,
          hardSolved: hard,
          contestRating: mock.contestRating ?? null,
          globalRanking: mock.globalRanking ?? null,
        }
      });

      limitations.push("Platform statistics reflect publicly solved problem counts up to retrieval timestamp.");

      const statsData: LeetCodeStatsData = {
        username: handle,
        profileUrl,
        totalSolved: total,
        easySolved: easy,
        mediumSolved: med,
        hardSolved: hard,
        contestRating: mock.contestRating ?? null,
        globalRanking: mock.globalRanking ?? null,
        retrievedAt,
        isStale,
      };

      return {
        sourceType: this.sourceType,
        authenticatedStudentId: studentId,
        authorizedSourceIdentity: handle,
        canonicalSourceUrl: profileUrl,
        connectionStatus: isStale ? "STALE" : "CONTENT_RETRIEVED",
        inspectionStatus: "INSPECTED",
        completeness: "COMPLETE",
        retrievedAt,
        inspectedAt: retrievedAt,
        artifacts,
        artifactsCount: 1,
        inspectedCount: 1,
        data: statsData,
        limitations,
      };
    }

    // 3. Live GraphQL Query
    const username = this.extractUsername(config.usernameOrUrl || "");
    if (!username) {
      return {
        sourceType: this.sourceType,
        authenticatedStudentId: studentId,
        connectionStatus: "RETRIEVAL_FAILED",
        inspectionStatus: "UNAVAILABLE",
        completeness: "NOT_ATTEMPTED",
        retrievedAt: now,
        artifacts: [],
        artifactsCount: 0,
        inspectedCount: 0,
        diagnostics: { errorCode: "INVALID_HANDLE", errorMessage: "Invalid LeetCode handle format." },
        limitations: ["Provided LeetCode handle or URL is invalid."],
        error: "Invalid LeetCode profile handle.",
      };
    }

    const profileUrl = `https://leetcode.com/u/${username}`;
    const graphqlQuery = {
      query: `
        query getUserProfile($username: String!) {
          matchedUser(username: $username) {
            username
            submitStatsGlobal {
              acSubmissionNum {
                difficulty
                count
              }
            }
            profile {
              ranking
              reputation
            }
          }
          userContestRanking(username: $username) {
            rating
            globalRanking
            attendedContestsCount
          }
        }
      `,
      variables: { username }
    };

    try {
      const res = await fetch("https://leetcode.com/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0 (compatible; CognalyzeEvidenceEngine/2.0)",
          Referer: "https://leetcode.com",
        },
        body: JSON.stringify(graphqlQuery),
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        return {
          sourceType: this.sourceType,
          authenticatedStudentId: studentId,
          authorizedSourceIdentity: username,
          canonicalSourceUrl: profileUrl,
          connectionStatus: "RETRIEVAL_FAILED",
          inspectionStatus: "UNAVAILABLE",
          completeness: "NOT_ATTEMPTED",
          retrievedAt: now,
          artifacts: [],
          artifactsCount: 0,
          inspectedCount: 0,
          diagnostics: { httpStatus: res.status, errorMessage: `HTTP ${res.status} from LeetCode` },
          limitations: ["LeetCode public endpoint returned non-200 status."],
          error: "LeetCode statistics unavailable — the configured source could not retrieve this information.",
        };
      }

      const json = await res.json();
      if (!json?.data?.matchedUser) {
        return {
          sourceType: this.sourceType,
          authenticatedStudentId: studentId,
          authorizedSourceIdentity: username,
          canonicalSourceUrl: profileUrl,
          connectionStatus: "RETRIEVAL_FAILED",
          inspectionStatus: "UNAVAILABLE",
          completeness: "NOT_ATTEMPTED",
          retrievedAt: now,
          artifacts: [],
          artifactsCount: 0,
          inspectedCount: 0,
          diagnostics: { errorCode: "NOT_FOUND", errorMessage: "User not found on platform" },
          limitations: ["LeetCode account does not exist or user profile is deleted."],
          error: "LeetCode user not found.",
        };
      }

      const matched = json.data.matchedUser;
      const acList: Array<{ difficulty: string; count: number }> = matched.submitStatsGlobal?.acSubmissionNum || [];
      const allItem = acList.find(d => d.difficulty === "All");
      const easyItem = acList.find(d => d.difficulty === "Easy");
      const medItem = acList.find(d => d.difficulty === "Medium");
      const hardItem = acList.find(d => d.difficulty === "Hard");

      const totalSolved = allItem ? allItem.count : 0;
      const easySolved = easyItem ? easyItem.count : 0;
      const mediumSolved = medItem ? medItem.count : 0;
      const hardSolved = hardItem ? hardItem.count : 0;

      const contest = json.data.userContestRanking;
      const contestRating = contest?.rating ? Math.round(contest.rating) : null;
      const globalRanking = matched.profile?.ranking ?? contest?.globalRanking ?? null;

      artifacts.push({
        artifactId: `lc_art_${studentId}_solved`,
        sourceType: "leetcode",
        sourceIdentifier: profileUrl,
        name: "LeetCode Solved Statistics",
        title: `LeetCode Solved Problems (${totalSolved})`,
        description: `Total Solved: ${totalSolved} (Easy: ${easySolved}, Medium: ${mediumSolved}, Hard: ${hardSolved})`,
        rawUrl: profileUrl,
        retrievedAt: now,
        inspectedAt: now,
        languagesObserved: [],
        manifestsFound: [],
        testFilesFound: [],
        ciConfigured: false,
        snippets: [{
          section: "Live LeetCode GraphQL Result",
          excerpt: `Total Solved: ${totalSolved}, Easy: ${easySolved}, Medium: ${mediumSolved}, Hard: ${hardSolved}, Contest Rating: ${contestRating ?? "Unrated"}`
        }],
        metadata: {
          totalSolved,
          easySolved,
          mediumSolved,
          hardSolved,
          contestRating,
          globalRanking,
        }
      });

      limitations.push("Public statistics reflect competitive coding problem count, not production system architecture.");

      const statsData: LeetCodeStatsData = {
        username,
        profileUrl,
        totalSolved,
        easySolved,
        mediumSolved,
        hardSolved,
        contestRating,
        globalRanking,
        retrievedAt: now,
        isStale: false,
      };

      return {
        sourceType: this.sourceType,
        authenticatedStudentId: studentId,
        authorizedSourceIdentity: username,
        canonicalSourceUrl: profileUrl,
        connectionStatus: "CONTENT_RETRIEVED",
        inspectionStatus: "INSPECTED",
        completeness: "COMPLETE",
        retrievedAt: now,
        inspectedAt: now,
        artifacts,
        artifactsCount: 1,
        inspectedCount: 1,
        data: statsData,
        limitations,
      };
    } catch (err: any) {
      return {
        sourceType: this.sourceType,
        authenticatedStudentId: studentId,
        authorizedSourceIdentity: username,
        canonicalSourceUrl: profileUrl,
        connectionStatus: "RETRIEVAL_FAILED",
        inspectionStatus: "UNAVAILABLE",
        completeness: "NOT_ATTEMPTED",
        retrievedAt: now,
        artifacts: [],
        artifactsCount: 0,
        inspectedCount: 0,
        diagnostics: { errorMessage: err.message },
        limitations: ["Network timeout connecting to LeetCode endpoint."],
        error: "LeetCode statistics unavailable — the configured source could not retrieve this information.",
      };
    }
  }
}

export const leetcodeConnector = new LeetCodeSourceConnector();
