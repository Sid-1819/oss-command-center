export type WorkflowStateKind = "doc" | "issue" | "dashboard";

export function getWorkflowContextTtlMs(): number {
  const hours = Number(process.env.WORKFLOW_CONTEXT_TTL_HOURS ?? 24);
  return hours * 60 * 60 * 1000;
}

export function getPlanReviewTtlMs(): number {
  const hours = Number(process.env.WORKFLOW_PLAN_REVIEW_TTL_HOURS ?? 24);
  return hours * 60 * 60 * 1000;
}

export function getActionRunTtlMs(): number {
  const hours = Number(process.env.WORKFLOW_ACTION_RUN_TTL_HOURS ?? 720);
  return hours * 60 * 60 * 1000;
}
