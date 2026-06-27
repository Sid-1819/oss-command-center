import {
  applyMarkdownDocPlan,
  buildPreviewDiff,
  type ApplyMarkdownDocPlanResult,
} from "@/actions/markdown-doc/apply-plan";
import type { MarkdownDocPlanStep } from "@/actions/markdown-doc/types";
import type { IssueFixPlanStep } from "./types";

export interface ApplyIssueFixPlanResult {
  updatedContent: string;
  appliedSteps: IssueFixPlanStep[];
  skippedSteps: IssueFixPlanStep[];
}

export function applyIssueFixPlan(
  content: string,
  steps: IssueFixPlanStep[],
): ApplyIssueFixPlanResult {
  let updatedContent = content;
  const appliedSteps: IssueFixPlanStep[] = [];
  const skippedSteps: IssueFixPlanStep[] = [];

  for (const step of steps) {
    const { operation, section, content: stepContent, rationale } = step;

    if (operation === "replace_all") {
      if (stepContent !== updatedContent) {
        updatedContent = stepContent;
        appliedSteps.push(step);
      } else {
        skippedSteps.push(step);
      }
      continue;
    }

    const markdownStep: MarkdownDocPlanStep = {
      operation,
      section,
      content: stepContent,
      rationale,
    };
    const result = applyMarkdownDocPlan(updatedContent, [markdownStep]);

    if (result.appliedSteps.length === 0) {
      skippedSteps.push(step);
      continue;
    }

    updatedContent = result.updatedContent;
    appliedSteps.push(step);
  }

  return {
    updatedContent,
    appliedSteps,
    skippedSteps,
  };
}

export { buildPreviewDiff };
