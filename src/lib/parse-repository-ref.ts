const GITHUB_URL_PREFIX = /^https?:\/\/(www\.)?github\.com\//i;
const REPO_SEGMENT = /^[a-zA-Z0-9._-]+$/;

export type ParseRepositoryRefResult =
  | { success: true; owner: string; repo: string; repositoryRef: string }
  | { success: false; message: string };

function normalizeInput(input: string): string {
  let normalized = input.trim();

  if (GITHUB_URL_PREFIX.test(normalized)) {
    normalized = normalized.replace(GITHUB_URL_PREFIX, "");
  }

  normalized = normalized.replace(/\/+$/, "").replace(/^\/+/, "");

  const queryIndex = normalized.indexOf("?");
  if (queryIndex !== -1) {
    normalized = normalized.slice(0, queryIndex);
  }

  const hashIndex = normalized.indexOf("#");
  if (hashIndex !== -1) {
    normalized = normalized.slice(0, hashIndex);
  }

  return normalized;
}

export function parseRepositoryRef(input: string): ParseRepositoryRefResult {
  const normalized = normalizeInput(input);

  if (!normalized) {
    return {
      success: false,
      message: "Repository is required. Use owner/repo format, e.g. vercel/next.js",
    };
  }

  const segments = normalized.split("/").filter(Boolean);

  if (segments.length !== 2) {
    return {
      success: false,
      message: "Use owner/repo format, e.g. vercel/next.js",
    };
  }

  const [owner, repo] = segments;

  if (!REPO_SEGMENT.test(owner) || !REPO_SEGMENT.test(repo)) {
    return {
      success: false,
      message: "Repository owner and name may only contain letters, numbers, dots, hyphens, and underscores",
    };
  }

  return {
    success: true,
    owner,
    repo,
    repositoryRef: `${owner}/${repo}`,
  };
}
