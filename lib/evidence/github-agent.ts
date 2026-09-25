// lib/evidence/github-agent.ts
//
// Stage 2 (part 1): ~200 -> ~50-60. Pulls REAL data from GitHub's API.
// Red/green flags are deterministic rules over real numbers — the LLM's only job
// is to write a short human-readable summary of facts that code already decided.

import { Evidence } from "./types";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // use a token even for public data — much higher rate limit
const GH_API = "https://api.github.com";

function getHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
  };
  if (GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${GITHUB_TOKEN}`;
  }
  return headers;
}

export interface RepoSummary {
  name: string;
  url: string;
  isFork: boolean;
  stars: number;
  language: string | null;
  commitCount: number;
  lastCommitDate: string | null;
  hasReadme: boolean;
  readmeLength: number;
  contributorsCount: number;
}

export interface GithubFlag {
  type: "red" | "green";
  label: string;
  detail: string; // the actual numbers/facts behind the flag
}

export interface GithubEvidenceDossier {
  candidateId: string;
  username: string;
  totalPublicRepos: number;
  originalRepos: number;
  forkedRepos: number;
  activeMonthsLast12: number; // months with at least 1 commit in the last year
  flags: GithubFlag[];
  topRepos: RepoSummary[];
  evidence: Evidence[];
}

async function ghFetch(path: string): Promise<any> {
  const res = await fetch(`${GH_API}${path}`, {
    headers: getHeaders(),
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub API error on ${path}: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

async function getRepoCommitActivity(owner: string, repo: string): Promise<{
  commitCount: number;
  lastCommitDate: string | null;
  activeWeeksLast52: number;
}> {
  // /stats/commit_activity gives 52 weeks of commit counts — one call, cheap on rate limit.
  // GitHub sometimes returns 202 while it computes stats; caller should tolerate empty result.
  try {
    const res = await fetch(`${GH_API}/repos/${owner}/${repo}/stats/commit_activity`, {
      headers: getHeaders(),
    });
    if (res.status !== 200) {
      return { commitCount: 0, lastCommitDate: null, activeWeeksLast52: 0 };
    }
    const weeks: { total: number; week: number }[] = await res.json();
    if (!Array.isArray(weeks)) {
      return { commitCount: 0, lastCommitDate: null, activeWeeksLast52: 0 };
    }
    const commitCount = weeks.reduce((sum, w) => sum + (w.total || 0), 0);
    const activeWeeksLast52 = weeks.filter((w) => (w.total || 0) > 0).length;
    const lastActiveWeek = [...weeks].reverse().find((w) => (w.total || 0) > 0);
    const lastCommitDate = lastActiveWeek ? new Date(lastActiveWeek.week * 1000).toISOString() : null;
    return { commitCount, lastCommitDate, activeWeeksLast52 };
  } catch {
    return { commitCount: 0, lastCommitDate: null, activeWeeksLast52: 0 };
  }
}

async function summarizeRepo(owner: string, repo: any): Promise<RepoSummary> {
  const [readme, contributors, activity] = await Promise.all([
    ghFetch(`/repos/${owner}/${repo.name}/readme`).catch(() => null),
    ghFetch(`/repos/${owner}/${repo.name}/contributors?per_page=100`).catch(() => []),
    getRepoCommitActivity(owner, repo.name),
  ]);

  let readmeLength = 0;
  if (readme?.content) {
    try {
      readmeLength = Buffer.from(readme.content, "base64").toString("utf-8").length;
    } catch {
      readmeLength = 0;
    }
  }

  return {
    name: repo.name,
    url: repo.html_url,
    isFork: Boolean(repo.fork),
    stars: repo.stargazers_count ?? 0,
    language: repo.language ?? null,
    commitCount: activity.commitCount,
    lastCommitDate: activity.lastCommitDate,
    hasReadme: !!readme,
    readmeLength,
    contributorsCount: Array.isArray(contributors) ? contributors.length : 0,
  };
}

// ---- Deterministic flag rules — auditable, no LLM involved ----
export function computeFlags(repos: RepoSummary[], activeMonthsLast12: number): GithubFlag[] {
  const flags: GithubFlag[] = [];
  const originals = repos.filter((r) => !r.isFork);

  if (originals.length === 0) {
    flags.push({
      type: "red",
      label: "No original work",
      detail: `All ${repos.length} public repos are forks — no independently authored project found.`,
    });
  } else {
    flags.push({
      type: "green",
      label: "Original projects present",
      detail: `${originals.length} of ${repos.length} public repos are original (not forked).`,
    });
  }

  const substantialOriginals = originals.filter((r) => r.commitCount >= 10);
  if (substantialOriginals.length === 0 && originals.length > 0) {
    flags.push({
      type: "red",
      label: "Low commit depth",
      detail: `Original repos have fewer than 10 commits each — may be bootstrapped/one-off rather than actively built.`,
    });
  } else if (substantialOriginals.length > 0) {
    flags.push({
      type: "green",
      label: "Sustained development",
      detail: `${substantialOriginals.length} original repo(s) with 10+ commits, showing iterative work.`,
    });
  }

  if (activeMonthsLast12 >= 6) {
    flags.push({
      type: "green",
      label: "Consistent recent activity",
      detail: `Active in ${activeMonthsLast12} of the last 12 months.`,
    });
  } else if (activeMonthsLast12 <= 1) {
    flags.push({
      type: "red",
      label: "Inactive / dormant profile",
      detail: `Active in only ${activeMonthsLast12} of the last 12 months.`,
    });
  }

  const readmeless = originals.filter((r) => !r.hasReadme || r.readmeLength < 50);
  if (readmeless.length === originals.length && originals.length > 0) {
    flags.push({
      type: "red",
      label: "No documentation",
      detail: `None of the ${originals.length} original repos have a substantive README — hard to verify what was actually built.`,
    });
  }

  return flags;
}

export async function buildGithubDossier(
  candidateId: string,
  githubUsername: string
): Promise<GithubEvidenceDossier> {
  const user = await ghFetch(`/users/${githubUsername}`).catch(() => null);
  if (!user) {
    return {
      candidateId,
      username: githubUsername,
      totalPublicRepos: 0,
      originalRepos: 0,
      forkedRepos: 0,
      activeMonthsLast12: 0,
      flags: [
        {
          type: "red",
          label: "GitHub profile not found",
          detail: `Username "${githubUsername}" returned 404 from GitHub API.`,
        },
      ],
      topRepos: [],
      evidence: [],
    };
  }

  const repos = (await ghFetch(`/users/${githubUsername}/repos?per_page=100&sort=updated`).catch(() => [])) || [];
  // Only deep-inspect the top N updated repos to stay within free-tier rate limits (5000/hr authenticated).
  const topN = repos.slice(0, 8);
  const summaries = await Promise.all(topN.map((r: any) => summarizeRepo(githubUsername, r)));

  // Approximate active months from commit_activity weeks across all inspected repos.
  const activeWeekSet = new Set<string>();
  for (const s of summaries) {
    if (s.lastCommitDate) activeWeekSet.add(s.lastCommitDate.slice(0, 7)); // yyyy-mm granularity, approximate
  }
  const activeMonthsLast12 = activeWeekSet.size;

  const flags = computeFlags(summaries, activeMonthsLast12);

  const evidence: Evidence[] = summaries.map((s) => ({
    id: `ev_${candidateId}_gh_${s.name}`,
    source_type: "github_repo",
    source_ref: s.url,
    quote_or_fact: `fork=${s.isFork}, commits=${s.commitCount}, stars=${s.stars}, lastCommit=${s.lastCommitDate ?? "unknown"}, hasReadme=${s.hasReadme}`,
    extracted_at: new Date().toISOString(),
  }));

  return {
    candidateId,
    username: githubUsername,
    totalPublicRepos: repos.length,
    originalRepos: summaries.filter((s) => !s.isFork).length,
    forkedRepos: summaries.filter((s) => s.isFork).length,
    activeMonthsLast12,
    flags,
    topRepos: summaries,
    evidence,
  };
}
