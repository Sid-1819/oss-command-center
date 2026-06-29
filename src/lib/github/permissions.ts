import type { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";
import { RequestError } from "@octokit/request-error";

type RepositoryPermissions =
  RestEndpointMethodTypes["repos"]["get"]["response"]["data"]["permissions"];

export function hasRepositoryPushAccess(
  permissions: RepositoryPermissions | undefined,
): boolean {
  return Boolean(
    permissions?.push || permissions?.admin || permissions?.maintain,
  );
}

export function repositoryWriteAccessMessage(repositoryRef: string): string {
  return [
    `Your GitHub token cannot push to ${repositoryRef}.`,
    "Execution creates a branch, commits changes, and opens a pull request.",
    "Sign in with GitHub and grant repo access, or use a token with Contents: Read and write on this repository.",
  ].join(" ");
}

export function isPersonalAccessTokenForbidden(error: unknown): boolean {
  return (
    error instanceof RequestError &&
    error.status === 403 &&
    error.message
      .toLowerCase()
      .includes("resource not accessible by personal access token")
  );
}

export function personalAccessTokenForbiddenMessage(
  repositoryRef: string,
): string {
  return repositoryWriteAccessMessage(repositoryRef);
}
