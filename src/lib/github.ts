import type { RestEndpointMethodTypes } from "@octokit/plugin-rest-endpoint-methods";
import { Octokit } from "octokit";
import { GITHUB_LIST_LIMIT } from "@/lib/github-limits";

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
  const { data } = await octokit.rest.pulls.list({
    owner,
    repo,
    state: "open",
    per_page: GITHUB_LIST_LIMIT,
    sort: "updated",
    direction: "desc",
  });

  return data;
}

export async function getOpenIssues(
  owner: string,
  repo: string,
): Promise<GitHubIssue[]> {
  const { data } = await octokit.rest.issues.listForRepo({
    owner,
    repo,
    state: "open",
    per_page: GITHUB_LIST_LIMIT,
    sort: "updated",
    direction: "desc",
  });

  return data.filter((issue) => !issue.pull_request);
}

export async function getOpenIssueCount(
  owner: string,
  repo: string,
): Promise<number> {
  const { data } = await octokit.rest.search.issuesAndPullRequests({
    q: `repo:${owner}/${repo} is:issue is:open`,
    per_page: 1,
  });

  return data.total_count;
}

export async function getOpenPullRequestCount(
  owner: string,
  repo: string,
): Promise<number> {
  const { data } = await octokit.rest.search.issuesAndPullRequests({
    q: `repo:${owner}/${repo} is:pr is:open`,
    per_page: 1,
  });

  return data.total_count;
}
