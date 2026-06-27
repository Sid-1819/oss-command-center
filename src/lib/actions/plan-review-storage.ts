import type {
  PlanIssueFixActionResult,
  PlanMarkdownDocActionResult,
} from "@/types/doc-plan-review";
import {
  DOC_PLAN_RESULT_KEY,
  ISSUE_PLAN_RESULT_KEY,
  type DocPlanReview,
  type IssueFixPlanReview,
} from "@/types/doc-plan-review";

export function savePlanReview(review: DocPlanReview): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(DOC_PLAN_RESULT_KEY, JSON.stringify(review));
}

export function loadPlanReview(
  repositoryRef: string,
  targetFile: string,
  suggestion: string,
): DocPlanReview | null {
  if (typeof window === "undefined") return null;

  const raw = sessionStorage.getItem(DOC_PLAN_RESULT_KEY);
  if (!raw) return null;

  try {
    const review = JSON.parse(raw) as DocPlanReview;
    if (
      review.repositoryRef !== repositoryRef ||
      review.targetFile !== targetFile ||
      review.suggestion !== suggestion
    ) {
      return null;
    }
    return review;
  } catch {
    return null;
  }
}

export function clearPlanReview(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(DOC_PLAN_RESULT_KEY);
}

export function saveIssuePlanReview(review: IssueFixPlanReview): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(ISSUE_PLAN_RESULT_KEY, JSON.stringify(review));
}

export function loadIssuePlanReview(
  repositoryRef: string,
  issueNumber: number,
): IssueFixPlanReview | null {
  if (typeof window === "undefined") return null;

  const raw = sessionStorage.getItem(ISSUE_PLAN_RESULT_KEY);
  if (!raw) return null;

  try {
    const review = JSON.parse(raw) as IssueFixPlanReview;
    if (review.repositoryRef !== repositoryRef || review.issueNumber !== issueNumber) {
      return null;
    }
    return review;
  } catch {
    return null;
  }
}

export function clearIssuePlanReview(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ISSUE_PLAN_RESULT_KEY);
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
