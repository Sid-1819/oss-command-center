"use server";

import {
  getOpenIssues,
  getOpenPullRequests,
  getRepository,
} from "@/lib/github";
import {
  AnalyzeRepositoryError,
  type AnalyzeRepositoryErrorCode,
  type RepositoryAnalysis,
} from "@/types/repository-analysis";
import { RequestError } from "octokit";

type GitHubRepository = Awaited<ReturnType<typeof getRepository>>;
type GitHubPullRequest = Awaited<
  ReturnType<typeof getOpenPullRequests>
>[number];
type GitHubIssue = Awaited<ReturnType<typeof getOpenIssues>>[number];

function mapStatusToCode(status: number): AnalyzeRepositoryErrorCode {
  switch (status) {
    case 404:
      return "NOT_FOUND";
    case 403:
      return "FORBIDDEN";
    case 429:
      return "RATE_LIMIT";
    default:
      return "UNKNOWN";
  }
}

function toAnalyzeRepositoryError(
  error: unknown,
  owner: string,
  repo: string,
): AnalyzeRepositoryError {
  if (error instanceof AnalyzeRepositoryError) {
    return error;
  }

  if (error instanceof RequestError) {
    const code = mapStatusToCode(error.status);
    const repositoryRef = `${owner}/${repo}`;

    const messageByCode: Record<AnalyzeRepositoryErrorCode, string> = {
      NOT_FOUND: `Repository ${repositoryRef} not found`,
      FORBIDDEN: `Access denied for repository ${repositoryRef}`,
      RATE_LIMIT: "GitHub API rate limit exceeded",
      VALIDATION: "Invalid repository parameters",
      UNKNOWN: `Failed to analyze repository ${repositoryRef}`,
    };

    return new AnalyzeRepositoryError(
      messageByCode[code],
      code,
      error.status,
    );
  }

  return new AnalyzeRepositoryError(
    `Failed to analyze repository ${owner}/${repo}`,
    "UNKNOWN",
    500,
  );
}

function normalizeRepositoryAnalysis(
  repository: GitHubRepository,
  pullRequests: GitHubPullRequest[],
  issues: GitHubIssue[],
): RepositoryAnalysis {
  return {
    repository: {
      owner: repository.owner.login,
      name: repository.name,
      stars: repository.stargazers_count,
      forks: repository.forks_count,
      openIssues: issues.length,
      openPullRequests: pullRequests.length,
      defaultBranch: repository.default_branch,
      description: repository.description,
    },
    pullRequests: pullRequests.map((pullRequest) => ({
      number: pullRequest.number,
      title: pullRequest.title,
      author: pullRequest.user?.login ?? "unknown",
      createdAt: pullRequest.created_at,
    })),
    issues: issues.map((issue) => ({
      number: issue.number,
      title: issue.title,
      author: issue.user?.login ?? "unknown",
      labels: issue.labels.map((label) =>
        typeof label === "string" ? label : label.name ?? "",
      ),
      createdAt: issue.created_at,
    })),
  };
}

export async function analyzeRepository(
  owner: string,
  repo: string,
): Promise<RepositoryAnalysis> {
  const normalizedOwner = owner.trim();
  const normalizedRepo = repo.trim();

  if (!normalizedOwner || !normalizedRepo) {
    throw new AnalyzeRepositoryError(
      "Owner and repository name are required",
      "VALIDATION",
      400,
    );
  }

  try {
    const [repository, pullRequests, issues] = await Promise.all([
      getRepository(normalizedOwner, normalizedRepo),
      getOpenPullRequests(normalizedOwner, normalizedRepo),
      getOpenIssues(normalizedOwner, normalizedRepo),
    ]);

    return normalizeRepositoryAnalysis(repository, pullRequests, issues);
  } catch (error) {
    throw toAnalyzeRepositoryError(error, normalizedOwner, normalizedRepo);
  }
}
