"use server";

import type { ValidationResult } from "@/actions/core/types";
import {
  applyMarkdownDocPlan,
  buildPreviewDiff,
} from "@/actions/markdown-doc/apply-plan";
import {
  markdownDocExecutionPlanSchema,
  slugifyDocFile,
  type MarkdownDocExecutionPlan,
  type MarkdownDocPlanPayload,
} from "@/actions/markdown-doc/types";
import { markdownDocValidator } from "@/actions/markdown-doc/validator";
import type { PlanMarkdownDocActionResult } from "@/types/doc-plan-review";

function createPlanId(targetFile: string): string {
  return `doc-${slugifyDocFile(targetFile)}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function finalizeMarkdownDocPlanAction(input: {
  targetFile: string;
  currentContent: string;
  sourceSha: string;
  payload: MarkdownDocPlanPayload;
}): Promise<PlanMarkdownDocActionResult> {
  const validationResult = markdownDocExecutionPlanSchema.safeParse(input.payload);

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

  const plan: MarkdownDocExecutionPlan = {
    planId: createPlanId(input.targetFile),
    actionId: "markdown-doc",
    summary: validationResult.data.summary,
    steps: validationResult.data.steps,
    createdAt: new Date().toISOString(),
    targetFile: input.targetFile,
    currentContent: input.currentContent,
    sourceSha: input.sourceSha,
  };

  const validation: ValidationResult = markdownDocValidator.validate(plan);
  const preview = applyMarkdownDocPlan(input.currentContent, plan.steps);
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
