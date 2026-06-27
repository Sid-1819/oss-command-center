import type { Executor } from "@/actions/core/Executor";
import type { ActionExecutionContext } from "@/actions/core/types";
import { getFileContents, updateFile } from "@/lib/github/contents";
import { GitHubServiceError } from "@/lib/github/errors";
import { createBranch } from "@/lib/github/branches";
import { createPullRequest } from "@/lib/github/pullRequests";
import { applyIssueFixPlan, buildPreviewDiff } from "./apply-plan";
import {
  IssueFixActionError,
  type IssueFixExecutionOutput,
  type IssueFixExecutionPlan,
} from "./types";

function buildBranchName(plan: IssueFixExecutionPlan): string {
  const shortPlanId = plan.planId.replace(/[^a-zA-Z0-9-]/g, "-").slice(0, 30);
  return `maintaineros/issue-${plan.issueNumber}-${shortPlanId}`;
}

function buildPullRequestBody(plan: IssueFixExecutionPlan): string {
  const rationales = plan.steps.map((step, index) => `${index + 1}. ${step.rationale}`);
  return [
    plan.summary,
    "",
    `Fixes #${plan.issueNumber}`,
    "",
    "## Planned changes",
    ...rationales,
  ].join("\n");
}

function toError(error: unknown, code: IssueFixActionError["code"]): IssueFixActionError {
  if (error instanceof IssueFixActionError) return error;
  if (error instanceof GitHubServiceError) {
    return new IssueFixActionError(error.message, code, error.status);
  }
  return new IssueFixActionError(
    error instanceof Error ? error.message : "Issue fix execution failed",
    code,
    500,
  );
}

export const issueFixExecutor: Executor<IssueFixExecutionPlan, IssueFixExecutionOutput> = {
  async execute(plan, context) {
    const startedAt = Date.now();
    const { targetFile, issueNumber } = plan;

    let liveFile;

    try {
      liveFile = await getFileContents({
        accessToken: context.accessToken,
        owner: context.owner,
        repo: context.repo,
        path: targetFile,
        ref: context.defaultBranch,
      });
    } catch (error) {
      throw toError(error, "GITHUB_FETCH");
    }

    if (liveFile.sha !== plan.sourceSha) {
      throw new IssueFixActionError(
        `${targetFile} changed since plan was created; re-plan required`,
        "FILE_CHANGED",
        409,
      );
    }

    const { updatedContent, appliedSteps, skippedSteps } = applyIssueFixPlan(
      liveFile.content,
      plan.steps,
    );

    if (appliedSteps.length === 0 || updatedContent === liveFile.content) {
      throw new IssueFixActionError("No changes could be applied", "NO_CHANGES", 422);
    }

    const previewDiff = buildPreviewDiff(targetFile, liveFile.content, updatedContent);

    const baseOutput = {
      issueNumber,
      targetFile,
      originalContent: liveFile.content,
      updatedContent,
      appliedSteps,
      skippedSteps,
      previewDiff,
      filesChanged: [targetFile],
      executionDurationMs: Date.now() - startedAt,
    };

    if (context.dryRun) {
      return {
        ...baseOutput,
        branchName: null,
        commitSha: null,
        prNumber: null,
        prUrl: null,
        dryRun: true,
      };
    }

    const branchName = buildBranchName(plan);

    let branch;

    try {
      branch = await createBranch({
        accessToken: context.accessToken,
        owner: context.owner,
        repo: context.repo,
        branch: branchName,
        fromRef: context.defaultBranch,
      });
    } catch (error) {
      throw toError(error, "GITHUB_BRANCH");
    }

    let updateResult;

    try {
      updateResult = await updateFile({
        accessToken: context.accessToken,
        owner: context.owner,
        repo: context.repo,
        path: targetFile,
        branch: branch.branch,
        content: updatedContent,
        sha: liveFile.sha,
        message: `[MaintainerOS] Fix #${issueNumber}`,
      });
    } catch (error) {
      throw toError(error, "GITHUB_UPDATE");
    }

    let pullRequest;

    try {
      pullRequest = await createPullRequest({
        accessToken: context.accessToken,
        owner: context.owner,
        repo: context.repo,
        title: `[MaintainerOS] Fix #${issueNumber}`,
        body: buildPullRequestBody(plan),
        head: branch.branch,
        base: context.defaultBranch,
      });
    } catch (error) {
      throw toError(error, "GITHUB_PR");
    }

    return {
      ...baseOutput,
      branchName: branch.branch,
      commitSha: updateResult.commitSha,
      prNumber: pullRequest.number,
      prUrl: pullRequest.url,
      dryRun: false,
      executionDurationMs: Date.now() - startedAt,
    };
  },
};
