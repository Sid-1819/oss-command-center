import { createOctokit } from "@/lib/github";
import { GitHubServiceError } from "@/lib/github/errors";
import {
  isPersonalAccessTokenForbidden,
  personalAccessTokenForbiddenMessage,
} from "@/lib/github/permissions";
import { RequestError } from "@octokit/request-error";

const MAX_BRANCH_RETRIES = 3;

export interface CreateBranchParams {
  accessToken: string;
  owner: string;
  repo: string;
  branch: string;
  fromRef: string;
}

export interface CreateBranchResult {
  branch: string;
  sha: string;
}

function normalizeRef(ref: string): string {
  return ref.startsWith("refs/heads/") ? ref : `refs/heads/${ref}`;
}

function stripRefPrefix(ref: string): string {
  return ref.replace(/^refs\/heads\//, "");
}

function isRefAlreadyExistsError(error: unknown): boolean {
  if (error instanceof GitHubServiceError && error.code === "BRANCH_EXISTS") {
    return true;
  }

  return (
    error instanceof RequestError &&
    error.status === 422 &&
    typeof error.message === "string" &&
    error.message.toLowerCase().includes("reference already exists")
  );
}

function appendRetrySuffix(branch: string, attempt: number): string {
  return `${branch}-retry-${attempt}`;
}

async function createBranchOnce(
  params: CreateBranchParams,
): Promise<CreateBranchResult> {
  const octokit = createOctokit(params.accessToken);
  const baseRef = normalizeRef(params.fromRef);

  try {
    const { data: refData } = await octokit.rest.git.getRef({
      owner: params.owner,
      repo: params.repo,
      ref: baseRef.replace(/^refs\//, ""),
    });

    const sha = refData.object.sha;

    await octokit.rest.git.createRef({
      owner: params.owner,
      repo: params.repo,
      ref: normalizeRef(params.branch),
      sha,
    });

    return {
      branch: stripRefPrefix(normalizeRef(params.branch)),
      sha,
    };
  } catch (error) {
    if (error instanceof GitHubServiceError) {
      throw error;
    }

    if (error instanceof RequestError) {
      const repositoryRef = `${params.owner}/${params.repo}`;

      if (isPersonalAccessTokenForbidden(error)) {
        throw new GitHubServiceError(
          personalAccessTokenForbiddenMessage(repositoryRef),
          "API_ERROR",
          403,
        );
      }

      throw new GitHubServiceError(
        error.message || `Failed to create branch ${params.branch}`,
        error.status === 422 ? "BRANCH_EXISTS" : "API_ERROR",
        error.status ?? 500,
      );
    }

    throw new GitHubServiceError(
      `Failed to create branch ${params.branch}`,
      "API_ERROR",
      500,
    );
  }
}

export async function createBranch(
  params: CreateBranchParams,
): Promise<CreateBranchResult> {
  let branchName = params.branch;

  for (let attempt = 0; attempt <= MAX_BRANCH_RETRIES; attempt++) {
    try {
      return await createBranchOnce({
        ...params,
        branch: branchName,
      });
    } catch (error) {
      if (!isRefAlreadyExistsError(error) || attempt === MAX_BRANCH_RETRIES) {
        if (error instanceof GitHubServiceError) {
          throw error;
        }

        throw new GitHubServiceError(
          `Branch ${branchName} already exists`,
          "BRANCH_EXISTS",
          422,
        );
      }

      branchName = appendRetrySuffix(params.branch, attempt + 1);
    }
  }

  throw new GitHubServiceError(
    `Unable to create branch for ${params.branch}`,
    "BRANCH_EXISTS",
    422,
  );
}

export interface DeleteBranchParams {
  accessToken: string;
  owner: string;
  repo: string;
  branch: string;
}

export interface DeleteBranchResult {
  success: boolean;
  warning?: string;
}

export async function deleteBranch(
  params: DeleteBranchParams,
): Promise<DeleteBranchResult> {
  const octokit = createOctokit(params.accessToken);
  const ref = normalizeRef(params.branch);

  try {
    await octokit.rest.git.deleteRef({
      owner: params.owner,
      repo: params.repo,
      ref,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof RequestError) {
      if (error.status === 422 || error.status === 404) {
        return {
          success: false,
          warning: `Could not delete branch ${params.branch}: ${error.message}`,
        };
      }
    }

    const message =
      error instanceof Error ? error.message : "Unknown branch deletion error";

    return {
      success: false,
      warning: `Could not delete branch ${params.branch}: ${message}`,
    };
  }
}
