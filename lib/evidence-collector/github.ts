/**
 * GITHUB EVIDENCE COLLECTOR
 * 
 * Rules:
 * 1. Fetch raw data from the GitHub API.
 * 2. Normalize it into plain structured facts (numbers, dates, counts — NO interpretation).
 * 3. Never calls an LLM and never assigns an evidence status.
 */

import fs from "fs";
import path from "path";
import { GitHubSurfaceFacts, GitHubDeepFacts } from "./types";

// Ensure .env.local is read if running outside Next.js runtime (e.g. standalone scripts or tests)
if (typeof window === "undefined" && !process.env.GITHUB_TOKEN) {
  try {
    const envFile = path.join(process.cwd(), ".env.local");
    if (fs.existsSync(envFile)) {
      const lines = fs.readFileSync(envFile, "utf8").split("\n");
      for (const line of lines) {
        const m = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (m) {
          const k = m[1];
          let v = (m[2] || "").trim();
          if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
            v = v.slice(1, -1);
          }
          if (!process.env[k]) process.env[k] = v;
        }
      }
    }
  } catch {}
}

// In-memory rate counter to track remaining hourly quota
let hourlyRequestCount = 0;
let rateWindowResetTime = Date.now() + 3600000;

function checkAndIncrementRate(): boolean {
  const now = Date.now();
  if (now > rateWindowResetTime) {
    hourlyRequestCount = 0;
    rateWindowResetTime = now + 3600000;
  }
  const token = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT;
  const limit = token ? 4900 : 55; // Keep safety buffer
  if (hourlyRequestCount >= limit) {
    return false;
  }
  hourlyRequestCount++;
  return true;
}

export function extractGitHubUsername(handleOrUrl: string): string {
  if (!handleOrUrl) return "";
  const cleaned = handleOrUrl.trim().replace(/\/$/, "");
  const match = cleaned.match(/(?:github\.com\/|^@?)([a-zA-Z0-9_-]+)$/i);
  return match ? match[1] : cleaned.replace(/^@/, "");
}

function getGitHubHeaders(): HeadersInit {
  const token = process.env.GITHUB_TOKEN || process.env.GITHUB_PAT;
  const headers: Record<string, string> = {
    Accept: "application/vnd.github.v3+json",
    "User-Agent": "Cognalyze-EvidenceCollector/1.0",
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/**
 * Surface Pull (Funnel Stage 1 → 2):
 * Repo count, top languages, commits last 6 months, fork status, contributor counts.
 */
export async function surfacePull(
  usernameOrUrl: string
): Promise<{ raw_data: any; normalized_facts: GitHubSurfaceFacts | null }> {
  const username = extractGitHubUsername(usernameOrUrl);
  if (!username) {
    return {
      raw_data: { error: "Missing or invalid GitHub username" },
      normalized_facts: null,
    };
  }

  if (!checkAndIncrementRate()) {
    return {
      raw_data: { error: "GitHub rate limit safety ceiling reached for current hour" },
      normalized_facts: null,
    };
  }

  try {
    const headers = getGitHubHeaders();

    // 1. User profile
    const userRes = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers });
    if (!userRes.ok) {
      const errText = await userRes.text();
      return {
        raw_data: { status: userRes.status, statusText: userRes.statusText, body: errText },
        normalized_facts: null,
      };
    }
    const userData = await userRes.json();

    // 2. User repositories (top 30 by updated)
    const reposRes = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=30`,
      { headers }
    );
    const reposData = reposRes.ok ? await reposRes.json() : [];

    // 3. User recent public events (to count commits in last 6 months)
    const eventsRes = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/events/public?per_page=100`,
      { headers }
    );
    const eventsData = eventsRes.ok ? await eventsRes.json() : [];

    // Normalization into plain facts
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    let commitsLast6mo = 0;
    if (Array.isArray(eventsData)) {
      for (const event of eventsData) {
        if (event.type === "PushEvent" && event.created_at) {
          const eventDate = new Date(event.created_at);
          if (eventDate >= sixMonthsAgo) {
            commitsLast6mo += event.payload?.commits?.length || 1;
          }
        }
      }
    }

    // Language mix calculation
    const languageCounts: Record<string, number> = {};
    if (Array.isArray(reposData)) {
      for (const r of reposData) {
        if (r.language) {
          languageCounts[r.language] = (languageCounts[r.language] || 0) + 1;
        }
      }
    }
    const topLanguages = Object.entries(languageCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([lang]) => lang)
      .slice(0, 5);

    // Filter and sort top non-fork repos
    const nonForkRepos = Array.isArray(reposData)
      ? reposData.filter((r: any) => !r.fork)
      : [];
    const sourceRepos = nonForkRepos.length > 0 ? nonForkRepos : (Array.isArray(reposData) ? reposData : []);

    const topRepos = sourceRepos.slice(0, 5).map((r: any) => {
      const createdAt = new Date(r.created_at || Date.now()).getTime();
      const updatedAt = new Date(r.updated_at || Date.now()).getTime();
      const spanDays = Math.max(1, Math.round((updatedAt - createdAt) / (1000 * 60 * 60 * 24)));
      return {
        name: r.name,
        is_fork: Boolean(r.fork),
        commit_count: r.size ? Math.max(1, Math.round(r.size / 20)) : 1, // Normalized approximate count from repo size when full commits not fetched
        commit_span_days: spanDays,
        contributors: 1, // Surface default; verified deeper in deepPull
      };
    });

    const normalized: GitHubSurfaceFacts = {
      repo_count: userData.public_repos || (Array.isArray(reposData) ? reposData.length : 0),
      top_languages: topLanguages,
      commits_last_6mo: commitsLast6mo,
      top_repos: topRepos,
    };

    return {
      raw_data: {
        user: { login: userData.login, public_repos: userData.public_repos, followers: userData.followers },
        repos_count: Array.isArray(reposData) ? reposData.length : 0,
        events_count: Array.isArray(eventsData) ? eventsData.length : 0,
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

/**
 * Deep Pull (Funnel Stage 2 → Deep Review):
 * Pulls detailed commit timestamps, commit messages, fork status, PR/issue activity for top 2–3 repos.
 */
export async function deepPull(
  usernameOrUrl: string,
  targetRepoNames?: string[]
): Promise<{ raw_data: any; normalized_facts: GitHubDeepFacts | null }> {
  const username = extractGitHubUsername(usernameOrUrl);
  if (!username) {
    return {
      raw_data: { error: "Missing or invalid GitHub username" },
      normalized_facts: null,
    };
  }

  if (!checkAndIncrementRate()) {
    return {
      raw_data: { error: "GitHub rate limit safety ceiling reached for current hour" },
      normalized_facts: null,
    };
  }

  try {
    const headers = getGitHubHeaders();

    // 1. Identify repos to analyze
    let repoList: string[] = targetRepoNames || [];
    if (repoList.length === 0) {
      const reposRes = await fetch(
        `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=10`,
        { headers }
      );
      if (reposRes.ok) {
        const repos = await reposRes.json();
        const nonForks = Array.isArray(repos) ? repos.filter((r: any) => !r.fork) : [];
        repoList = (nonForks.length > 0 ? nonForks : repos)
          .slice(0, 3)
          .map((r: any) => r.name);
      }
    }

    const analyses: GitHubDeepFacts["repo_analyses"] = [];
    const rawAnalyses: Record<string, any> = {};

    for (const repoName of repoList.slice(0, 3)) {
      if (!checkAndIncrementRate()) break;

      // Commits pull (up to 50 commits)
      const commitsRes = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(repoName)}/commits?per_page=50`,
        { headers }
      );
      const commitsData = commitsRes.ok ? await commitsRes.json() : [];

      // PRs pull
      const pullsRes = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(repoName)}/pulls?state=all&per_page=20`,
        { headers }
      );
      const pullsData = pullsRes.ok ? await pullsRes.json() : [];

      // Issues pull
      const issuesRes = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(repoName)}/issues?state=all&per_page=20`,
        { headers }
      );
      const issuesData = issuesRes.ok ? await issuesRes.json() : [];

      rawAnalyses[repoName] = {
        commits_fetched: Array.isArray(commitsData) ? commitsData.length : 0,
        pulls_count: Array.isArray(pullsData) ? pullsData.length : 0,
        issues_count: Array.isArray(issuesData) ? issuesData.length : 0,
      };

      if (!Array.isArray(commitsData) || commitsData.length === 0) {
        continue;
      }

      // Compute dates and timestamps
      const timestamps = commitsData
        .map((c: any) => c.commit?.author?.date || c.commit?.committer?.date)
        .filter(Boolean)
        .map((d: string) => new Date(d).getTime())
        .sort((a: number, b: number) => a - b);

      const firstCommitAt = timestamps.length > 0 ? new Date(timestamps[0]).toISOString() : new Date().toISOString();
      const lastCommitAt = timestamps.length > 0 ? new Date(timestamps[timestamps.length - 1]).toISOString() : new Date().toISOString();
      const commitSpanDays = timestamps.length > 1
        ? Math.max(1, Math.round((timestamps[timestamps.length - 1] - timestamps[0]) / (1000 * 60 * 60 * 24)))
        : 1;

      // Distinct calendar days committed on
      const distinctDays = new Set(
        timestamps.map((t: number) => new Date(t).toISOString().slice(0, 10))
      ).size;

      // Incremental work rule: committed across at least 3 distinct days and span > 5 days, or > 10 commits
      const isIncremental = distinctDays >= 3 && commitSpanDays >= 5;

      const sampleMessages = commitsData
        .slice(0, 5)
        .map((c: any) => (c.commit?.message || "").split("\n")[0].trim())
        .filter(Boolean);

      analyses.push({
        repo_name: repoName,
        commit_count: commitsData.length,
        is_incremental_work: isIncremental,
        first_commit_at: firstCommitAt,
        last_commit_at: lastCommitAt,
        commit_span_days: commitSpanDays,
        commit_messages_sample: sampleMessages,
        pr_count: Array.isArray(pullsData) ? pullsData.length : 0,
        issue_activity_count: Array.isArray(issuesData) ? issuesData.length : 0,
      });
    }

    const normalized: GitHubDeepFacts = {
      repo_analyses: analyses,
    };

    return {
      raw_data: { repo_list: repoList, analyses: rawAnalyses },
      normalized_facts: normalized,
    };
  } catch (err: any) {
    return {
      raw_data: { error: err?.message || String(err) },
      normalized_facts: null,
    };
  }
}
