import { GITHUB_LIST_LIMIT } from "@/lib/github-limits";
import type { MaintainerBriefing } from "@/types/maintainer-briefing";
import type { RepositoryAnalysis } from "@/types/repository-analysis";

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
    })),
    note: `Data includes up to ${GITHUB_LIST_LIMIT} most recently updated open issues and pull requests. Totals in repository metadata reflect full open counts.`,
  };
}

export function trimAnalysisForClient(
  analysis: RepositoryAnalysis,
  briefing: MaintainerBriefing,
): RepositoryAnalysis {
  const neededIssueNumbers = new Set(
    briefing.contributorOpportunities.map((opportunity) => opportunity.issueNumber),
  );

  return {
    repository: analysis.repository,
    pullRequests: [],
    issues: analysis.issues.filter((issue) => neededIssueNumbers.has(issue.number)),
  };
}
