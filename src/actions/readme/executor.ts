import type { Executor } from "@/actions/core/Executor";
import type { ActionExecutionContext } from "@/actions/core/types";
import { applyReadmePlan, buildPreviewDiff } from "@/actions/readme/apply-plan";
import { createBranch } from "@/lib/github/branches";
import { getFileContents, updateFile } from "@/lib/github/contents";
import { GitHubServiceError } from "@/lib/github/errors";
import { createPullRequest } from "@/lib/github/pullRequests";
import {
  README_TARGET_FILE,
  ReadmeActionError,
  type ReadmeExecutionOutput,
  type ReadmeExecutionPlan,
} from "./types";

const COMMIT_MESSAGE = "[MaintainerOS] Update README.md";
const PR_TITLE = "[MaintainerOS] Update README.md";

function buildBranchName(planId: string): string {
  const shortPlanId = planId.replace(/[^a-zA-Z0-9-]/g, "-").slice(0, 40);
  const executionSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  return `maintaineros/readme-${shortPlanId}-${executionSuffix}`;
}

function buildPullRequestBody(plan: ReadmeExecutionPlan): string {
  const rationales = plan.steps.map(
    (step, index) => `${index + 1}. ${step.rationale}`,
  );

  return [plan.summary, "", "## Planned changes", ...rationales].join("\n");
}

function toReadmeActionError(
  error: unknown,
  code: ReadmeActionError["code"],
): ReadmeActionError {
  if (error instanceof ReadmeActionError) {
    return error;
  }

  if (error instanceof GitHubServiceError) {
    return new ReadmeActionError(error.message, code, error.status);
  }

  const message =
    error instanceof Error ? error.message : "README action execution failed";

  return new ReadmeActionError(message, code, 500);
}

export const readmeExecutor: Executor<ReadmeExecutionPlan, ReadmeExecutionOutput> = {
  async execute(plan, context) {
    const startedAt = Date.now();

    if (plan.targetFile !== README_TARGET_FILE) {
      throw new ReadmeActionError(
        `Only ${README_TARGET_FILE} is supported`,
        "VALIDATION",
        400,
      );
    }

    let liveFile;

    try {
      liveFile = await getFileContents({
        accessToken: context.accessToken,
        owner: context.owner,
        repo: context.repo,
        path: README_TARGET_FILE,
        ref: context.defaultBranch,
      });
    } catch (error) {
      throw toReadmeActionError(error, "GITHUB_FETCH");
    }

    if (liveFile.sha !== plan.sourceSha) {
      throw new ReadmeActionError(
        "README.md changed since plan was created; re-plan required",
        "README_CHANGED",
        409,
      );
    }

    const { updatedContent, appliedSteps, skippedSteps } = applyReadmePlan(
      liveFile.content,
      plan.steps,
    );

    if (appliedSteps.length === 0 || updatedContent === liveFile.content) {
      throw new ReadmeActionError(
        "No README.md changes could be applied",
        "NO_CHANGES",
        422,
      );
    }

    const previewDiff = buildPreviewDiff(
      README_TARGET_FILE,
      liveFile.content,
      updatedContent,
    );

    const baseOutput = {
      targetFile: README_TARGET_FILE,
      originalContent: liveFile.content,
      updatedContent,
      appliedSteps,
      skippedSteps,
      previewDiff,
      filesChanged: [README_TARGET_FILE],
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

    const branchName = buildBranchName(plan.planId);

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
      throw toReadmeActionError(error, "GITHUB_BRANCH");
    }

    let updateResult;

    try {
      updateResult = await updateFile({
        accessToken: context.accessToken,
        owner: context.owner,
        repo: context.repo,
        path: README_TARGET_FILE,
        branch: branch.branch,
        content: updatedContent,
        sha: liveFile.sha,
        message: COMMIT_MESSAGE,
      });
    } catch (error) {
      throw toReadmeActionError(error, "GITHUB_UPDATE");
    }

    let pullRequest;

    try {
      pullRequest = await createPullRequest({
        accessToken: context.accessToken,
        owner: context.owner,
        repo: context.repo,
        title: PR_TITLE,
        body: buildPullRequestBody(plan),
        head: branch.branch,
        base: context.defaultBranch,
      });
    } catch (error) {
      throw toReadmeActionError(error, "GITHUB_PR");
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
