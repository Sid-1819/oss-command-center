import { createOctokit } from "@/lib/github";
import { GitHubServiceError } from "@/lib/github/errors";
import { RequestError } from "@octokit/request-error";

interface RepositoryPathParams {
  accessToken: string;
  owner: string;
  repo: string;
}

export interface GetFileContentsParams extends RepositoryPathParams {
  path: string;
  ref?: string;
}

export interface FileContentsResult {
  content: string;
  sha: string;
  path: string;
}

export interface UpdateFileParams extends RepositoryPathParams {
  path: string;
  branch: string;
  content: string;
  sha: string;
  message: string;
}

export interface UpdateFileResult {
  commitSha: string;
  path: string;
}

function toGitHubServiceError(
  error: unknown,
  fallbackMessage: string,
): GitHubServiceError {
  if (error instanceof GitHubServiceError) {
    return error;
  }

  if (error instanceof RequestError) {
    if (error.status === 404) {
      return new GitHubServiceError(
        error.message || fallbackMessage,
        "NOT_FOUND",
        404,
      );
    }

    return new GitHubServiceError(
      error.message || fallbackMessage,
      "API_ERROR",
      error.status ?? 500,
    );
  }

  return new GitHubServiceError(fallbackMessage, "API_ERROR", 500);
}

export async function getFileContents(
  params: GetFileContentsParams,
): Promise<FileContentsResult> {
  const octokit = createOctokit(params.accessToken);

  try {
    const { data } = await octokit.rest.repos.getContent({
      owner: params.owner,
      repo: params.repo,
      path: params.path,
      ref: params.ref,
    });

    if (Array.isArray(data) || data.type !== "file") {
      throw new GitHubServiceError(
        `Path "${params.path}" is not a file`,
        "INVALID_RESPONSE",
        422,
      );
    }

    if (!("content" in data) || typeof data.content !== "string" || !data.sha) {
      throw new GitHubServiceError(
        `Unable to read file content for "${params.path}"`,
        "INVALID_RESPONSE",
        422,
      );
    }

    const content = Buffer.from(data.content, "base64").toString("utf8");

    return {
      content,
      sha: data.sha,
      path: data.path,
    };
  } catch (error) {
    throw toGitHubServiceError(error, `Failed to fetch ${params.path}`);
  }
}

export async function updateFile(
  params: UpdateFileParams,
): Promise<UpdateFileResult> {
  const octokit = createOctokit(params.accessToken);

  try {
    const { data } = await octokit.rest.repos.createOrUpdateFileContents({
      owner: params.owner,
      repo: params.repo,
      path: params.path,
      branch: params.branch,
      message: params.message,
      content: Buffer.from(params.content, "utf8").toString("base64"),
      sha: params.sha,
    });

    const commitSha = data.commit.sha;

    if (!commitSha) {
      throw new GitHubServiceError(
        `Failed to update ${params.path}`,
        "INVALID_RESPONSE",
        422,
      );
    }

    return {
      commitSha,
      path: params.path,
    };
  } catch (error) {
    throw toGitHubServiceError(error, `Failed to update ${params.path}`);
  }
}
