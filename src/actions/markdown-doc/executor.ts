import type { Executor } from "@/actions/core/Executor";
import type { ActionExecutionContext } from "@/actions/core/types";
import { applyMarkdownDocPlan, buildPreviewDiff } from "@/actions/markdown-doc/apply-plan";
import { createBranch } from "@/lib/github/branches";
import { getFileContents, updateFile } from "@/lib/github/contents";
import { GitHubServiceError } from "@/lib/github/errors";
import { createPullRequest } from "@/lib/github/pullRequests";
import {
  MarkdownDocActionError,
  slugifyDocFile,
  type MarkdownDocExecutionOutput,
  type MarkdownDocExecutionPlan,
} from "./types";

function buildBranchName(plan: MarkdownDocExecutionPlan): string {
  const shortPlanId = plan.planId.replace(/[^a-zA-Z0-9-]/g, "-").slice(0, 40);
  const executionSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const slug = slugifyDocFile(plan.targetFile);

  return `maintaineros/doc-${slug}-${shortPlanId}-${executionSuffix}`;
}

function buildPullRequestBody(plan: MarkdownDocExecutionPlan): string {
  const rationales = plan.steps.map(
    (step, index) => `${index + 1}. ${step.rationale}`,
  );

  return [plan.summary, "", "## Planned changes", ...rationales].join("\n");
}

function toActionError(
  error: unknown,
  code: MarkdownDocActionError["code"],
): MarkdownDocActionError {
  if (error instanceof MarkdownDocActionError) {
    return error;
  }

  if (error instanceof GitHubServiceError) {
    return new MarkdownDocActionError(error.message, code, error.status);
  }

  const message =
    error instanceof Error ? error.message : "Markdown doc action execution failed";

  return new MarkdownDocActionError(message, code, 500);
}

export const markdownDocExecutor: Executor<
  MarkdownDocExecutionPlan,
  MarkdownDocExecutionOutput
> = {
  async execute(plan, context) {
    const startedAt = Date.now();
    const { targetFile } = plan;

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
      throw toActionError(error, "GITHUB_FETCH");
    }

    if (liveFile.sha !== plan.sourceSha) {
      throw new MarkdownDocActionError(
        `${targetFile} changed since plan was created; re-plan required`,
        "FILE_CHANGED",
        409,
      );
    }

    const { updatedContent, appliedSteps, skippedSteps } = applyMarkdownDocPlan(
      liveFile.content,
      plan.steps,
    );

    if (appliedSteps.length === 0 || updatedContent === liveFile.content) {
      throw new MarkdownDocActionError(
        `No changes could be applied to ${targetFile}`,
        "NO_CHANGES",
        422,
      );
    }

    const previewDiff = buildPreviewDiff(
      targetFile,
      liveFile.content,
      updatedContent,
    );

    const baseOutput = {
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
      throw toActionError(error, "GITHUB_BRANCH");
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
        message: `[MaintainerOS] Update ${targetFile}`,
      });
    } catch (error) {
      throw toActionError(error, "GITHUB_UPDATE");
    }

    let pullRequest;

    try {
      pullRequest = await createPullRequest({
        accessToken: context.accessToken,
        owner: context.owner,
        repo: context.repo,
        title: `[MaintainerOS] Update ${targetFile}`,
        body: buildPullRequestBody(plan),
        head: branch.branch,
        base: context.defaultBranch,
      });
    } catch (error) {
      throw toActionError(error, "GITHUB_PR");
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
