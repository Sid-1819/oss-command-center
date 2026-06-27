export type GitHubServiceErrorCode =
  | "NOT_FOUND"
  | "INVALID_RESPONSE"
  | "BRANCH_EXISTS"
  | "API_ERROR";

export class GitHubServiceError extends Error {
  readonly code: GitHubServiceErrorCode;
  readonly status: number;

  constructor(
    message: string,
    code: GitHubServiceErrorCode,
    status: number,
  ) {
    super(message);
    this.name = "GitHubServiceError";
    this.code = code;
    this.status = status;
  }
}
