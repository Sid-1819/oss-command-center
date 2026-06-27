export interface UserRepositoryPermissions {
  admin: boolean;
  maintain: boolean;
  push: boolean;
  triage: boolean;
  pull: boolean;
}

export interface UserRepository {
  id: number;
  name: string;
  owner: string;
  full_name: string;
  private: boolean;
  default_branch: string;
  permissions: UserRepositoryPermissions;
  updated_at: string;
}

export type GitHubUserErrorCode =
  | "REVOKED_TOKEN"
  | "EXPIRED_SESSION"
  | "RATE_LIMIT"
  | "FORBIDDEN"
  | "UNKNOWN";

export class GitHubUserError extends Error {
  readonly code: GitHubUserErrorCode;
  readonly status: number;

  constructor(
    message: string,
    code: GitHubUserErrorCode,
    status: number,
  ) {
    super(message);
    this.name = "GitHubUserError";
    this.code = code;
    this.status = status;
  }
}
