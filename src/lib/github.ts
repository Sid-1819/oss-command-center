import type { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";
import { Octokit } from "octokit";

export const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

type GitHubRepository =
  RestEndpointMethodTypes["repos"]["get"]["response"]["data"];
type GitHubPullRequest =
  RestEndpointMethodTypes["pulls"]["list"]["response"]["data"][number];
type GitHubIssue =
  RestEndpointMethodTypes["issues"]["listForRepo"]["response"]["data"][number];

export async function getRepository(
  owner: string,
  repo: string,
): Promise<GitHubRepository> {
  const { data } = await octokit.rest.repos.get({ owner, repo });
  return data;
}

export async function getOpenPullRequests(
  owner: string,
  repo: string,
): Promise<GitHubPullRequest[]> {
  return octokit.paginate(octokit.rest.pulls.list, {
    owner,
    repo,
    state: "open",
    per_page: 100,
  });
}

export async function getOpenIssues(
  owner: string,
  repo: string,
): Promise<GitHubIssue[]> {
  const issues = await octokit.paginate(octokit.rest.issues.listForRepo, {
    owner,
    repo,
    state: "open",
    per_page: 100,
  });

  return issues.filter((issue) => !issue.pull_request);
}
