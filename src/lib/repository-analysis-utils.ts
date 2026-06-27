import { GITHUB_LIST_LIMIT } from "@/lib/github-limits";
import { normalizeBriefing } from "@/lib/maintainer-briefing-utils";
import type { MaintainerBriefing } from "@/types/maintainer-briefing";
import type { RepositoryAnalysis } from "@/types/repository-analysis";

const MAX_ISSUE_BODY_LENGTH = 2000;

export function trimAnalysisForBriefingPrompt(analysis: RepositoryAnalysis) {
  return {
    repository: analysis.repository,
    pullRequests: analysis.pullRequests.map((pullRequest) => ({
      number: pullRequest.number,
      title: pullRequest.title,
      author: pullRequest.author,
    })),
    issues: analysis.issues.map((issue) => ({
      number: issue.number,
      title: issue.title,
      labels: issue.labels,
      body: issue.body
        ? issue.body.slice(0, MAX_ISSUE_BODY_LENGTH)
        : undefined,
    })),
    note: `Data includes up to ${GITHUB_LIST_LIMIT} most recently updated open issues and pull requests. Totals in repository metadata reflect full open counts.`,
  };
}

export function trimAnalysisForClient(
  analysis: RepositoryAnalysis,
  briefing: MaintainerBriefing,
): RepositoryAnalysis {
  const normalized = normalizeBriefing(briefing);
  const neededIssueNumbers = new Set([
    ...normalized.contributorOpportunities.map(
      (opportunity) => opportunity.issueNumber,
    ),
    ...normalized.autoFixCandidates.map((candidate) => candidate.issueNumber),
  ]);

  return {
    repository: analysis.repository,
    pullRequests: [],
    issues: analysis.issues.filter((issue) => neededIssueNumbers.has(issue.number)),
  };
}
