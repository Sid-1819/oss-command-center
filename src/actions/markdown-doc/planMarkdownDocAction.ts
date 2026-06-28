"use server";

import { finalizeMarkdownDocPlanAction } from "@/actions/markdown-doc/finalizeMarkdownDocPlanAction";
import { generateMarkdownDocPlanFromContext } from "@/lib/ai/generate-markdown-doc-plan";
import { mapProviderError } from "@/lib/ai/provider-errors";
import { MarkdownDocActionError } from "@/actions/markdown-doc/types";
import { prepareMarkdownDocPlanAction } from "@/actions/markdown-doc/prepareMarkdownDocPlanAction";
import type {
  PlanMarkdownDocActionInput,
  PlanMarkdownDocActionResult,
} from "@/types/doc-plan-review";

export async function planMarkdownDocAction(
  input: PlanMarkdownDocActionInput,
): Promise<PlanMarkdownDocActionResult> {
  const prepared = await prepareMarkdownDocPlanAction(input);

  if (!prepared.success) {
    return {
      success: false,
      error: prepared.error,
    };
  }

  try {
    const payload = await generateMarkdownDocPlanFromContext({
      targetFile: prepared.targetFile,
      analysis: prepared.analysis,
      briefing: prepared.briefing,
      suggestion: prepared.suggestion,
      currentContent: prepared.currentContent,
      aiConfig: prepared.aiConfig,
      forceRefresh: input.forceRefresh,
    });

    return finalizeMarkdownDocPlanAction({
      targetFile: prepared.targetFile,
      currentContent: prepared.currentContent,
      sourceSha: prepared.sourceSha,
      payload,
    });
  } catch (error) {
    if (error instanceof MarkdownDocActionError) {
      return {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          status: error.status,
        },
      };
    }

    const providerError = mapProviderError(error);

    if (providerError) {
      return {
        success: false,
        error: {
          code: providerError.code,
          message: providerError.message,
          status: providerError.status,
        },
      };
    }

    return {
      success: false,
      error: {
        code: "AI_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Failed to generate documentation update plan.",
        status: 500,
      },
    };
  }
}
