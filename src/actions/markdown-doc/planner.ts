import type { Planner } from "@/actions/core/Planner";
import { generateMarkdownDocPlanFromContext } from "@/lib/ai/generate-markdown-doc-plan";
import {
  isAllowedDocFile,
  MarkdownDocActionError,
  slugifyDocFile,
  type MarkdownDocActionInput,
  type MarkdownDocExecutionPlan,
} from "./types";

function createPlanId(targetFile: string): string {
  return `doc-${slugifyDocFile(targetFile)}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export const markdownDocPlanner: Planner<
  MarkdownDocActionInput,
  MarkdownDocExecutionPlan
> = {
  async plan(input) {
    if (!isAllowedDocFile(input.targetFile)) {
      throw new MarkdownDocActionError(
        `Target file "${input.targetFile}" is not allowed for markdown-doc actions.`,
        "VALIDATION",
        400,
      );
    }

    if (!input.currentContent?.trim()) {
      throw new MarkdownDocActionError(
        "File content is required before planning",
        "VALIDATION",
        400,
      );
    }

    if (!input.sourceSha?.trim()) {
      throw new MarkdownDocActionError(
        "Source SHA is required before planning",
        "VALIDATION",
        400,
      );
    }

    const payload = await generateMarkdownDocPlanFromContext({
      targetFile: input.targetFile,
      analysis: input.analysis,
      briefing: input.briefing,
      suggestion: input.suggestion,
      currentContent: input.currentContent,
      aiConfig: input.aiConfig,
      forceRefresh: input.forceRefresh,
    });

    return {
      planId: createPlanId(input.targetFile),
      actionId: "markdown-doc",
      summary: payload.summary,
      steps: payload.steps,
      createdAt: new Date().toISOString(),
      targetFile: input.targetFile,
      currentContent: input.currentContent,
      sourceSha: input.sourceSha,
    };
  },
};
