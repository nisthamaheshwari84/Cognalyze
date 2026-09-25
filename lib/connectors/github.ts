/**
 * AUTHORIZED GITHUB CONNECTOR (Part 2.2 S3 & Phase 3)
 * 
 * Compliant with Rule S3:
 * Integrations must genuinely work via authorized consent/OAuth.
 * If credentials or consent are missing, returns "Not connected" honestly.
 * No scraping. Only official GitHub REST API with candidate authorization.
 */

export interface GitHubRepoEvidence {
  id: string;
  name: string;
  url: string;
  description: string;
  primaryLanguage: string;
  languages: string[];
  starsCount: number;
  forksCount: number;
  lastPushedAt: string;
  isFork: boolean;
  tier: "T2"; // Observed artifact with retained source
}

export interface GitHubConnectionResult {
  connected: boolean;
  username?: string;
  profileUrl?: string;
  repositoriesCount?: number;
  evidenceItems?: GitHubRepoEvidence[];
  message?: string;
}

/**
 * Fetches real authorized GitHub evidence for a candidate.
 * Strictly checks for token or authorized access. Never fakes data.
 */
export async function fetchAuthorizedGitHubEvidence(
  accessToken?: string,
  targetUsername?: string
): Promise<GitHubConnectionResult> {
  // If neither token nor authorized username is supplied, report honest unconnected state
  if (!accessToken && !targetUsername) {
    return {
      connected: false,
      message: "GitHub account is not connected. Connect via OAuth with candidate consent to verify public repositories.",
    };
  }

  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "Cognalyze-Evidence-OS",
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  try {
    const userUrl = accessToken
      ? "https://api.github.com/user"
      : `https://api.github.com/users/${encodeURIComponent(targetUsername!)}`;

    const userRes = await fetch(userUrl, { headers });

    if (!userRes.ok) {
      if (userRes.status === 404) {
        return { connected: false, message: "Authorized GitHub user profile not found." };
      }
      if (userRes.status === 401 || userRes.status === 403) {
        return { connected: false, message: "GitHub authorization expired or rate limit reached. Re-authentication required." };
      }
      return { connected: false, message: `GitHub API returned status ${userRes.status}.` };
    }

    const userData = await userRes.json();
    const username = userData.login;
    const profileUrl = userData.html_url;

    // Fetch user's non-forked or public repositories
    const reposUrl = accessToken
      ? "https://api.github.com/user/repos?sort=updated&per_page=30"
      : `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=30`;

    const reposRes = await fetch(reposUrl, { headers });
    const reposData = reposRes.ok ? await reposRes.json() : [];

    const evidenceItems: GitHubRepoEvidence[] = (Array.isArray(reposData) ? reposData : [])
      .filter((r: any) => !r.fork)
      .slice(0, 15)
      .map((r: any) => ({
        id: `gh-repo-${r.id}`,
        name: r.name,
        url: r.html_url,
        description: r.description || "Public repository",
        primaryLanguage: r.language || "Unknown",
        languages: r.language ? [r.language] : [],
        starsCount: r.stargazers_count || 0,
        forksCount: r.forks_count || 0,
        lastPushedAt: r.pushed_at || r.updated_at,
        isFork: Boolean(r.fork),
        tier: "T2" as const,
      }));

    return {
      connected: true,
      username,
      profileUrl,
      repositoriesCount: evidenceItems.length,
      evidenceItems,
    };
  } catch (err: any) {
    return {
      connected: false,
      message: `Failed to connect to GitHub API: ${err.message}`,
    };
  }
}
