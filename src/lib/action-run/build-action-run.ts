import type { ActionRun, ActionRunType } from "@/types/action-run";
import type { IssueFixExecutionOutput, IssueFixExecutionPlan } from "@/actions/issue-fix/types";
import type { MarkdownDocExecutionOutput, MarkdownDocExecutionPlan } from "@/actions/markdown-doc/types";

export function buildMarkdownDocActionRun(
  repositoryRef: string,
  plan: MarkdownDocExecutionPlan,
  output: MarkdownDocExecutionOutput,
): ActionRun | null {
  if (!output.prNumber || !output.prUrl || !output.branchName) {
    return null;
  }

  const now = new Date().toISOString();

  return {
    id: `run-${plan.planId}`,
    actionId: plan.planId,
    actionType: "markdown-doc",
    repositoryRef,
    targetFile: plan.targetFile,
    branch: output.branchName,
    pullRequestNumber: output.prNumber,
    pullRequestUrl: output.prUrl,
    status: "AWAITING_REVIEW",
    createdAt: now,
    updatedAt: now,
  };
}

export function buildIssueFixActionRun(
  repositoryRef: string,
  plan: IssueFixExecutionPlan,
  output: IssueFixExecutionOutput,
): ActionRun | null {
  if (!output.prNumber || !output.prUrl || !output.branchName) {
    return null;
  }

  const now = new Date().toISOString();

  return {
    id: `run-${plan.planId}`,
    actionId: plan.planId,
    actionType: "issue-fix",
    repositoryRef,
    targetFile: plan.targetFile,
    issueNumber: plan.issueNumber,
    branch: output.branchName,
    pullRequestNumber: output.prNumber,
    pullRequestUrl: output.prUrl,
    status: "AWAITING_REVIEW",
    createdAt: now,
    updatedAt: now,
  };
}

/** @deprecated Use buildMarkdownDocActionRun */
export function buildReadmeActionRun(
  repositoryRef: string,
  plan: MarkdownDocExecutionPlan,
  output: MarkdownDocExecutionOutput,
): ActionRun | null {
  return buildMarkdownDocActionRun(repositoryRef, plan, output);
}

export function buildActionRunForType(
  actionType: ActionRunType,
  repositoryRef: string,
  plan: MarkdownDocExecutionPlan | IssueFixExecutionPlan,
  output: MarkdownDocExecutionOutput | IssueFixExecutionOutput,
): ActionRun | null {
  if (actionType === "issue-fix") {
    return buildIssueFixActionRun(
      repositoryRef,
      plan as IssueFixExecutionPlan,
      output as IssueFixExecutionOutput,
    );
  }

  return buildMarkdownDocActionRun(
    repositoryRef,
    plan as MarkdownDocExecutionPlan,
    output as MarkdownDocExecutionOutput,
  );
}
