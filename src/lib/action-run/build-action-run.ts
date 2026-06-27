import type { ReadmeExecutionOutput, ReadmeExecutionPlan } from "@/actions/readme/types";
import type { ActionRun } from "@/types/action-run";

export function buildReadmeActionRun(
  repositoryRef: string,
  plan: ReadmeExecutionPlan,
  output: ReadmeExecutionOutput,
): ActionRun | null {
  if (!output.prNumber || !output.prUrl || !output.branchName) {
    return null;
  }

  const now = new Date().toISOString();

  return {
    id: `run-${plan.planId}`,
    actionId: plan.planId,
    actionType: "readme",
    repositoryRef,
    branch: output.branchName,
    pullRequestNumber: output.prNumber,
    pullRequestUrl: output.prUrl,
    status: "AWAITING_REVIEW",
    createdAt: now,
    updatedAt: now,
  };
}
