export interface RepositoryAnalysis {
  repository: {
    owner: string;
    name: string;
    stars: number;
    forks: number;
    openIssues: number;
    openPullRequests: number;
    sampledIssues: number;
    sampledPullRequests: number;
    defaultBranch: string;
    description: string | null;
  };

  pullRequests: {
    number: number;
    title: string;
    author: string;
    createdAt: string;
  }[];

  issues: {
    number: number;
    title: string;
    author: string;
    labels: string[];
    createdAt: string;
    body?: string;
  }[];
}

export type AnalyzeRepositoryErrorCode =
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "RATE_LIMIT"
  | "VALIDATION"
  | "UNAUTHORIZED"
  | "UNKNOWN";

export class AnalyzeRepositoryError extends Error {
  readonly code: AnalyzeRepositoryErrorCode;
  readonly status: number;

  constructor(
    message: string,
    code: AnalyzeRepositoryErrorCode,
    status: number,
  ) {
    super(message);
    this.name = "AnalyzeRepositoryError";
    this.code = code;
    this.status = status;
  }
}
