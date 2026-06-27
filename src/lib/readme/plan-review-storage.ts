import type { PlanReadmeActionResult } from "@/types/readme-plan-review";
import {
  README_PLAN_RESULT_KEY,
  type ReadmePlanReview,
} from "@/types/readme-plan-review";

export function savePlanReview(review: ReadmePlanReview): void {
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.setItem(README_PLAN_RESULT_KEY, JSON.stringify(review));
}

export function loadPlanReview(
  repositoryRef: string,
  suggestion: string,
): ReadmePlanReview | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = sessionStorage.getItem(README_PLAN_RESULT_KEY);

  if (!raw) {
    return null;
  }

  try {
    const review = JSON.parse(raw) as ReadmePlanReview;

    if (
      review.repositoryRef !== repositoryRef ||
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
  if (typeof window === "undefined") {
    return;
  }

  sessionStorage.removeItem(README_PLAN_RESULT_KEY);
}

export function buildReadmePlanReview(
  repositoryRef: string,
  suggestion: string,
  result: Extract<PlanReadmeActionResult, { success: true }>,
): ReadmePlanReview {
  return {
    repositoryRef,
    suggestion,
    plan: result.plan,
    preview: result.preview,
    previewDiff: result.previewDiff,
    validation: result.validation,
    plannedAt: new Date().toISOString(),
  };
}
