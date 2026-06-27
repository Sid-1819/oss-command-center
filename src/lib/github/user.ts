import { Octokit, RequestError } from "octokit";
import {
  GitHubUserError,
  type GitHubUserErrorCode,
  type UserRepository,
} from "@/types/github-user";

function createUserOctokit(accessToken: string): Octokit {
  return new Octokit({ auth: accessToken });
}

function isRateLimitError(error: RequestError): boolean {
  if (error.status === 429) {
    return true;
  }

  if (error.status !== 403) {
    return false;
  }

  const remaining = error.response?.headers["x-ratelimit-remaining"];
  return remaining === "0";
}

function mapRequestError(error: RequestError): GitHubUserError {
  if (error.status === 401) {
    return new GitHubUserError(
      "GitHub access token is invalid or has been revoked.",
      "REVOKED_TOKEN",
      error.status,
    );
  }

  if (isRateLimitError(error)) {
    return new GitHubUserError(
      "GitHub API rate limit exceeded.",
      "RATE_LIMIT",
      error.status,
    );
  }

  if (error.status === 403) {
    return new GitHubUserError(
      "GitHub access denied.",
      "FORBIDDEN",
      error.status,
    );
  }

  return new GitHubUserError(
    "Failed to fetch repositories from GitHub.",
    "UNKNOWN",
    error.status,
  );
}

function toUserRepository(
  repo: Awaited<
    ReturnType<
      ReturnType<typeof createUserOctokit>["rest"]["repos"]["listForAuthenticatedUser"]
    >
  >["data"][number],
): UserRepository | null {
  const permissions = repo.permissions;

  if (!permissions?.admin && !permissions?.maintain) {
    return null;
  }

  return {
    id: repo.id,
    name: repo.name,
    owner: repo.owner.login,
    full_name: repo.full_name,
    private: repo.private,
    default_branch: repo.default_branch,
    permissions: {
      admin: permissions.admin ?? false,
      maintain: permissions.maintain ?? false,
      push: permissions.push ?? false,
      triage: permissions.triage ?? false,
      pull: permissions.pull ?? false,
    },
    updated_at: repo.updated_at ?? repo.pushed_at ?? new Date(0).toISOString(),
  };
}

export async function getUserRepositories(
  accessToken: string,
): Promise<UserRepository[]> {
  if (!accessToken.trim()) {
    throw new GitHubUserError(
      "GitHub access token is required.",
      "EXPIRED_SESSION",
      401,
    );
  }

  const octokit = createUserOctokit(accessToken);

  try {
    const { data } = await octokit.rest.repos.listForAuthenticatedUser({
      sort: "pushed",
      direction: "desc",
      per_page: 100,
    });

    return data
      .map(toUserRepository)
      .filter((repository): repository is UserRepository => repository !== null);
  } catch (error) {
    if (error instanceof GitHubUserError) {
      throw error;
    }

    if (error instanceof RequestError) {
      throw mapRequestError(error);
    }

    throw new GitHubUserError(
      "Failed to fetch repositories from GitHub.",
      "UNKNOWN" satisfies GitHubUserErrorCode,
      500,
    );
  }
}
