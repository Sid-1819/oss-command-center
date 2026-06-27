import type { Octokit } from "octokit";

export interface GetIssueParams {
  owner: string;
  repo: string;
  issueNumber: number;
}

export interface GitHubIssueDetails {
  number: number;
  title: string;
  body: string | null;
  state: string;
  labels: string[];
}

export async function getIssue(
  octokit: Octokit,
  params: GetIssueParams,
): Promise<GitHubIssueDetails> {
  const { data } = await octokit.rest.issues.get({
    owner: params.owner,
    repo: params.repo,
    issue_number: params.issueNumber,
  });

  return {
    number: data.number,
    title: data.title,
    body: data.body ?? null,
    state: data.state,
    labels: data.labels.map((label) =>
      typeof label === "string" ? label : label.name ?? "",
    ),
  };
}

export interface CommentOnIssueParams {
  accessToken: string;
  owner: string;
  repo: string;
  issueNumber: number;
  body: string;
}

export interface CloseIssueParams {
  accessToken: string;
  owner: string;
  repo: string;
  issueNumber: number;
  comment?: string;
}

export interface IssueActionResult {
  success: boolean;
  warning?: string;
}

export async function commentOnIssue(
  params: CommentOnIssueParams,
): Promise<IssueActionResult> {
  const { createOctokit } = await import("@/lib/github");
  const octokit = createOctokit(params.accessToken);

  try {
    await octokit.rest.issues.createComment({
      owner: params.owner,
      repo: params.repo,
      issue_number: params.issueNumber,
      body: params.body,
    });
    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, warning: `Could not comment on issue: ${message}` };
  }
}

export async function closeIssue(params: CloseIssueParams): Promise<IssueActionResult> {
  const { createOctokit } = await import("@/lib/github");
  const octokit = createOctokit(params.accessToken);

  try {
    if (params.comment) {
      await octokit.rest.issues.createComment({
        owner: params.owner,
        repo: params.repo,
        issue_number: params.issueNumber,
        body: params.comment,
      });
    }

    await octokit.rest.issues.update({
      owner: params.owner,
      repo: params.repo,
      issue_number: params.issueNumber,
      state: "closed",
      state_reason: "completed",
    });

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, warning: `Could not close issue: ${message}` };
  }
}
