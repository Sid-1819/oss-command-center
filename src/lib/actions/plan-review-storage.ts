import {
  clearIssuePlanReviewAction,
  clearPlanReviewAction,
  loadIssuePlanReviewAction,
  loadPlanReviewAction,
  saveIssuePlanReviewAction,
  savePlanReviewAction,
} from "@/actions/workflow-state";
import { assertWorkflowResult } from "@/lib/workflow-state/errors";
import type {
  PlanIssueFixActionResult,
  PlanMarkdownDocActionResult,
} from "@/types/doc-plan-review";
import {
  type DocPlanReview,
  type IssueFixPlanReview,
} from "@/types/doc-plan-review";

export async function savePlanReview(review: DocPlanReview): Promise<void> {
  assertWorkflowResult(await savePlanReviewAction(review));
}

export async function loadPlanReview(
  repositoryRef: string,
  targetFile: string,
  suggestion: string,
): Promise<DocPlanReview | null> {
  return assertWorkflowResult(
    await loadPlanReviewAction(repositoryRef, targetFile, suggestion),
  );
}

export async function clearPlanReview(): Promise<void> {
  assertWorkflowResult(await clearPlanReviewAction());
}

export async function saveIssuePlanReview(review: IssueFixPlanReview): Promise<void> {
  assertWorkflowResult(await saveIssuePlanReviewAction(review));
}

export async function loadIssuePlanReview(
  repositoryRef: string,
  issueNumber: number,
): Promise<IssueFixPlanReview | null> {
  return assertWorkflowResult(await loadIssuePlanReviewAction(repositoryRef, issueNumber));
}

export async function clearIssuePlanReview(): Promise<void> {
  assertWorkflowResult(await clearIssuePlanReviewAction());
}

export function buildDocPlanReview(
  repositoryRef: string,
  targetFile: string,
  suggestion: string,
  result: Extract<PlanMarkdownDocActionResult, { success: true }>,
): DocPlanReview {
  return {
    repositoryRef,
    targetFile,
    suggestion,
    plan: result.plan,
    preview: result.preview,
    previewDiff: result.previewDiff,
    validation: result.validation,
    plannedAt: new Date().toISOString(),
  };
}

export function buildIssuePlanReview(
  repositoryRef: string,
  issueNumber: number,
  result: Extract<PlanIssueFixActionResult, { success: true }>,
): IssueFixPlanReview {
  return {
    repositoryRef,
    issueNumber,
    plan: result.plan,
    preview: result.preview,
    previewDiff: result.previewDiff,
    validation: result.validation,
    plannedAt: new Date().toISOString(),
  };
}
