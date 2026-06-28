"use server";

import { finalizeIssueFixPlanAction } from "@/actions/issue-fix/finalizeIssueFixPlanAction";
import { generateIssueFixPlanFromContext } from "@/lib/ai/generate-issue-fix-plan";
import { IssueFixActionError } from "@/actions/issue-fix/types";
import { prepareIssueFixPlanAction } from "@/actions/issue-fix/prepareIssueFixPlanAction";
import { mapProviderError } from "@/lib/ai/provider-errors";
import type {
  PlanIssueFixActionInput,
  PlanIssueFixActionResult,
} from "@/types/doc-plan-review";

export async function planIssueFixAction(
  input: PlanIssueFixActionInput,
): Promise<PlanIssueFixActionResult> {
  const prepared = await prepareIssueFixPlanAction(input);

  if (!prepared.success) {
    return {
      success: false,
      error: prepared.error,
    };
  }

  try {
    const payload = await generateIssueFixPlanFromContext({
      issueNumber: prepared.issueNumber,
      issueTitle: prepared.issueTitle,
      issueBody: prepared.issueBody,
      candidate: prepared.candidate,
      targetFile: prepared.targetFile,
      analysis: prepared.analysis,
      currentContent: prepared.currentContent,
      aiConfig: prepared.aiConfig,
      forceRefresh: input.forceRefresh,
    });

    return finalizeIssueFixPlanAction({
      issueNumber: prepared.issueNumber,
      targetFile: prepared.targetFile,
      currentContent: prepared.currentContent,
      sourceSha: prepared.sourceSha,
      payload,
    });
  } catch (error) {
    if (error instanceof IssueFixActionError) {
      return {
        success: false,
        error: { code: error.code, message: error.message, status: error.status },
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
        message: error instanceof Error ? error.message : "Failed to generate fix plan.",
        status: 500,
      },
    };
  }
}
