import { createOctokit } from "@/lib/github";
import { GitHubServiceError } from "@/lib/github/errors";
import { RequestError } from "@octokit/request-error";

export interface CreatePullRequestParams {
  accessToken: string;
  owner: string;
  repo: string;
  title: string;
  body: string;
  head: string;
  base: string;
}

export interface CreatePullRequestResult {
  number: number;
  url: string;
}

export async function createPullRequest(
  params: CreatePullRequestParams,
): Promise<CreatePullRequestResult> {
  const octokit = createOctokit(params.accessToken);

  try {
    const { data } = await octokit.rest.pulls.create({
      owner: params.owner,
      repo: params.repo,
      title: params.title,
      body: params.body,
      head: params.head,
      base: params.base,
    });

    return {
      number: data.number,
      url: data.html_url,
    };
  } catch (error) {
    if (error instanceof GitHubServiceError) {
      throw error;
    }

    if (error instanceof RequestError) {
      throw new GitHubServiceError(
        error.message || "Failed to create pull request",
        "API_ERROR",
        error.status ?? 500,
      );
    }

    throw new GitHubServiceError(
      "Failed to create pull request",
      "API_ERROR",
      500,
    );
  }
}
