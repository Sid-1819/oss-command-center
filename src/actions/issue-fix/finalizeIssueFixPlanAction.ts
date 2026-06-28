"use server";

import type { ValidationResult } from "@/actions/core/types";
import { applyIssueFixPlan, buildPreviewDiff } from "@/actions/issue-fix/apply-plan";
import {
  issueFixExecutionPlanSchema,
  type IssueFixExecutionPlan,
  type IssueFixPlanPayload,
} from "@/actions/issue-fix/types";
import { issueFixValidator } from "@/actions/issue-fix/validator";
import type { PlanIssueFixActionResult } from "@/types/doc-plan-review";

function createPlanId(issueNumber: number): string {
  return `issue-fix-${issueNumber}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function finalizeIssueFixPlanAction(input: {
  issueNumber: number;
  targetFile: string;
  currentContent: string;
  sourceSha: string;
  payload: IssueFixPlanPayload;
}): Promise<PlanIssueFixActionResult> {
  const validationResult = issueFixExecutionPlanSchema.safeParse(input.payload);

  if (!validationResult.success) {
    return {
      success: false,
      error: {
        code: "VALIDATION",
        message: "AI plan failed schema validation.",
        status: 422,
      },
    };
  }

  const plan: IssueFixExecutionPlan = {
    planId: createPlanId(input.issueNumber),
    actionId: "issue-fix",
    summary: validationResult.data.summary,
    steps: validationResult.data.steps,
    createdAt: new Date().toISOString(),
    issueNumber: input.issueNumber,
    targetFile: input.targetFile,
    currentContent: input.currentContent,
    sourceSha: input.sourceSha,
  };

  const validation: ValidationResult = issueFixValidator.validate(plan);
  const preview = applyIssueFixPlan(input.currentContent, plan.steps);
  const previewDiff = buildPreviewDiff(
    input.targetFile,
    input.currentContent,
    preview.updatedContent,
  );

  return {
    success: true,
    plan,
    preview,
    previewDiff,
    validation,
  };
}
