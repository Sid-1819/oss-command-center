import type { Octokit } from "octokit";

export interface PullRequestStatusParams {
  owner: string;
  repo: string;
  pullNumber: number;
}

export interface PullRequestStatus {
  state: "open" | "closed";
  merged: boolean;
  mergedAt?: string;
  mergedBy?: string;
}

export async function getPullRequestStatus(
  octokit: Octokit,
  params: PullRequestStatusParams,
): Promise<PullRequestStatus> {
  const { data } = await octokit.rest.pulls.get({
    owner: params.owner,
    repo: params.repo,
    pull_number: params.pullNumber,
  });

  return {
    state: data.state === "open" ? "open" : "closed",
    merged: Boolean(data.merged),
    mergedAt: data.merged_at ?? undefined,
    mergedBy: data.merged_by?.login ?? undefined,
  };
}
