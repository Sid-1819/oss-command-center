"use server";

import { AuthError, requireSession } from "@/lib/auth";
import {
  DatabaseNotConfiguredError,
  deleteActionRunState,
  deletePlanReview,
  deleteWorkflowContext,
  getActionRunForRepository,
  getActionRunState,
  getPlanReview,
  getWorkflowContext,
  upsertActionRunState,
  upsertPlanReview,
  upsertWorkflowContext,
} from "@/lib/workflow-state/persistence";
import type { WorkflowStateResult } from "@/lib/workflow-state/errors";
import type {
  DocPlanContext,
  DocPlanReview,
  IssueFixPlanReview,
  IssuePlanContext,
} from "@/types/doc-plan-review";
import type { ActionRun, ActionRunCompletion } from "@/types/action-run";

function toErrorResult(error: unknown): WorkflowStateResult<never> {
  if (error instanceof AuthError) {
    return {
      success: false,
      error: {
        code: "EXPIRED_SESSION",
        message: error.message,
        status: 401,
      },
    };
  }

  if (error instanceof DatabaseNotConfiguredError) {
    return {
      success: false,
      error: {
        code: "DATABASE_UNAVAILABLE",
        message: error.message,
        status: 503,
      },
    };
  }

  return {
    success: false,
    error: {
      code: "UNKNOWN",
      message: error instanceof Error ? error.message : "Failed to access workflow state.",
      status: 500,
    },
  };
}

async function withSession<T>(
  fn: (userId: string) => Promise<T>,
): Promise<WorkflowStateResult<T>> {
  try {
    const session = await requireSession();
    const data = await fn(session.user.id);
    return { success: true, data };
  } catch (error) {
    return toErrorResult(error);
  }
}

export async function saveDocPlanContextAction(
  context: DocPlanContext,
): Promise<WorkflowStateResult<void>> {
  return withSession(async (userId) => {
    await upsertWorkflowContext(userId, "doc", context);
  });
}

export async function loadDocPlanContextAction(): Promise<
  WorkflowStateResult<DocPlanContext | null>
> {
  return withSession((userId) => getWorkflowContext<DocPlanContext>(userId, "doc"));
}

export async function saveIssuePlanContextAction(
  context: IssuePlanContext,
): Promise<WorkflowStateResult<void>> {
  return withSession(async (userId) => {
    await upsertWorkflowContext(userId, "issue", context);
  });
}

export async function loadIssuePlanContextAction(): Promise<
  WorkflowStateResult<IssuePlanContext | null>
> {
  return withSession((userId) => getWorkflowContext<IssuePlanContext>(userId, "issue"));
}

export async function savePlanReviewAction(
  review: DocPlanReview,
): Promise<WorkflowStateResult<void>> {
  return withSession(async (userId) => {
    await upsertPlanReview(userId, "doc", review);
  });
}

export async function loadPlanReviewAction(
  repositoryRef: string,
  targetFile: string,
  suggestion: string,
): Promise<WorkflowStateResult<DocPlanReview | null>> {
  return withSession((userId) =>
    getPlanReview(userId, "doc", { repositoryRef, targetFile, suggestion }),
  );
}

export async function clearPlanReviewAction(): Promise<WorkflowStateResult<void>> {
  return withSession(async (userId) => {
    await deletePlanReview(userId, "doc");
  });
}

export async function saveIssuePlanReviewAction(
  review: IssueFixPlanReview,
): Promise<WorkflowStateResult<void>> {
  return withSession(async (userId) => {
    await upsertPlanReview(userId, "issue", review);
  });
}

export async function loadIssuePlanReviewAction(
  repositoryRef: string,
  issueNumber: number,
): Promise<WorkflowStateResult<IssueFixPlanReview | null>> {
  return withSession((userId) =>
    getPlanReview(userId, "issue", { repositoryRef, issueNumber }),
  );
}

export async function clearIssuePlanReviewAction(): Promise<WorkflowStateResult<void>> {
  return withSession(async (userId) => {
    await deletePlanReview(userId, "issue");
  });
}

export async function saveActionRunAction(
  run: ActionRun,
  completion?: ActionRunCompletion,
): Promise<WorkflowStateResult<void>> {
  return withSession(async (userId) => {
    await upsertActionRunState(userId, run, completion);
  });
}

export async function loadActionRunCompletionAction(): Promise<
  WorkflowStateResult<ActionRunCompletion | null>
> {
  return withSession(async (userId) => {
    const state = await getActionRunState(userId);
    return state?.completion ?? null;
  });
}

export async function findActionRunForRepositoryAction(
  repositoryRef: string,
): Promise<WorkflowStateResult<ActionRun | null>> {
  return withSession(async (userId) => {
    const state = await getActionRunForRepository(userId, repositoryRef);
    return state?.run ?? null;
  });
}

export async function loadActionRunCompletionForRepositoryAction(
  repositoryRef: string,
): Promise<WorkflowStateResult<ActionRunCompletion | null>> {
  return withSession(async (userId) => {
    const state = await getActionRunForRepository(userId, repositoryRef);
    return state?.completion ?? null;
  });
}

export async function clearActionRunAction(): Promise<WorkflowStateResult<void>> {
  return withSession(async (userId) => {
    await deleteActionRunState(userId);
  });
}
