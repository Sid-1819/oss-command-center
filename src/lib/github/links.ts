import type { RepositoryAnalysis } from "@/types/repository-analysis";

export type GitHubReference =
  | { type: "issue"; number: number }
  | { type: "pull"; number: number };

export function buildGitHubIssueUrl(
  owner: string,
  repo: string,
  issueNumber: number,
): string {
  return `https://github.com/${owner}/${repo}/issues/${issueNumber}`;
}

export function buildGitHubPullRequestUrl(
  owner: string,
  repo: string,
  pullNumber: number,
): string {
  return `https://github.com/${owner}/${repo}/pull/${pullNumber}`;
}

export function resolveGitHubUrl(
  owner: string,
  repo: string,
  reference: GitHubReference,
): string {
  return reference.type === "pull"
    ? buildGitHubPullRequestUrl(owner, repo, reference.number)
    : buildGitHubIssueUrl(owner, repo, reference.number);
}

export function parsePrimaryGitHubReference(
  title: string,
  reason?: string,
): GitHubReference | null {
  const text = `${title} ${reason ?? ""}`;

  const pullMatch = text.match(/\b(?:pr|pull request)\s*#(\d+)\b/i);
  if (pullMatch) {
    return { type: "pull", number: Number.parseInt(pullMatch[1], 10) };
  }

  const issueMatch = text.match(/\b(?:issue|bug)\s*#(\d+)\b/i);
  if (issueMatch) {
    return { type: "issue", number: Number.parseInt(issueMatch[1], 10) };
  }

  const hashMatch = text.match(/#(\d+)\b/);
  if (hashMatch) {
    return { type: "issue", number: Number.parseInt(hashMatch[1], 10) };
  }

  return null;
}

const SECURITY_LABEL_KEYWORDS = [
  "security",
  "vulnerability",
  "cve",
  "dependabot",
  "security-alert",
];

const SECURITY_TITLE_KEYWORDS = [
  "security",
  "vulnerability",
  "cve",
  "xss",
  "injection",
  "exploit",
];

export type SecuritySeverity = "critical" | "high" | "medium" | "low";

export interface SecurityIssueItem {
  issueNumber: number;
  title: string;
  description: string;
  severity: SecuritySeverity;
}

function inferSecuritySeverity(
  issue: RepositoryAnalysis["issues"][number],
): SecuritySeverity {
  const normalizedLabels = issue.labels.map((label) => label.toLowerCase());

  if (
    normalizedLabels.some((label) =>
      ["critical", "p0", "severity: critical"].some((token) => label.includes(token)),
    )
  ) {
    return "critical";
  }

  if (
    normalizedLabels.some((label) =>
      ["high", "priority: high", "severity: high"].some((token) => label.includes(token)),
    )
  ) {
    return "high";
  }

  if (
    normalizedLabels.some((label) =>
      ["low", "priority: low", "severity: low"].some((token) => label.includes(token)),
    )
  ) {
    return "low";
  }

  return "medium";
}

export function getSecurityIssuesFromAnalysis(
  analysis: RepositoryAnalysis,
): SecurityIssueItem[] {
  return analysis.issues
    .filter((issue) => {
      const labelMatch = issue.labels.some((label) =>
        SECURITY_LABEL_KEYWORDS.some((keyword) => label.toLowerCase().includes(keyword)),
      );
      const titleMatch = SECURITY_TITLE_KEYWORDS.some((keyword) =>
        issue.title.toLowerCase().includes(keyword),
      );

      return labelMatch || titleMatch;
    })
    .map((issue) => ({
      issueNumber: issue.number,
      title: issue.title,
      description:
        issue.body?.trim() ||
        `Open security-related issue #${issue.number} (${issue.labels.join(", ") || "no labels"}).`,
      severity: inferSecuritySeverity(issue),
    }));
}
