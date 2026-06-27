import type { Validator } from "@/actions/core/Validator";
import type { ValidationIssue } from "@/actions/core/types";
import { buildPreviewDiff } from "@/actions/markdown-doc/apply-plan";
import { applyIssueFixPlan } from "./apply-plan";
import {
  BLOCKED_ISSUE_FIX_FILES,
  issueFixExecutionPlanSchema,
  type IssueFixExecutionPlan,
} from "./types";

const MAX_LINES_CHANGED = 50;
const MAX_STEP_CONTENT_LENGTH = 4 * 1024;

function countChangedLines(original: string, updated: string): number {
  const originalLines = original.split("\n");
  const updatedLines = updated.split("\n");
  let changed = 0;
  const max = Math.max(originalLines.length, updatedLines.length);

  for (let index = 0; index < max; index++) {
    if (originalLines[index] !== updatedLines[index]) changed += 1;
  }

  return changed;
}

export const issueFixValidator: Validator<IssueFixExecutionPlan> = {
  validate(plan) {
    const issues: ValidationIssue[] = [];

    if (BLOCKED_ISSUE_FIX_FILES.includes(plan.targetFile)) {
      issues.push({
        code: "BLOCKED_FILE",
        message: `${plan.targetFile} cannot be modified by issue-fix actions.`,
        path: "targetFile",
      });
    }

    const schemaResult = issueFixExecutionPlanSchema.safeParse({
      summary: plan.summary,
      steps: plan.steps,
    });

    if (!schemaResult.success) {
      issues.push({
        code: "SCHEMA_INVALID",
        message: "Plan failed schema validation.",
        path: "steps",
      });
    }

    if (!plan.sourceSha?.trim()) {
      issues.push({
        code: "MISSING_SOURCE_SHA",
        message: "Plan must include source SHA.",
        path: "sourceSha",
      });
    }

    for (const [index, step] of plan.steps.entries()) {
      if (!step.content.trim()) {
        issues.push({
          code: "EMPTY_CONTENT",
          message: `Step ${index + 1} has empty content.`,
          path: `steps[${index}].content`,
        });
      }

      if (step.content.length > MAX_STEP_CONTENT_LENGTH) {
        issues.push({
          code: "CONTENT_TOO_LARGE",
          message: `Step ${index + 1} exceeds content limit.`,
          path: `steps[${index}].content`,
        });
      }
    }

    const preview = applyIssueFixPlan(plan.currentContent, plan.steps);
    const linesChanged = countChangedLines(plan.currentContent, preview.updatedContent);

    if (linesChanged > MAX_LINES_CHANGED) {
      issues.push({
        code: "DIFF_TOO_LARGE",
        message: `Plan would change ${linesChanged} lines (max ${MAX_LINES_CHANGED}).`,
        path: "steps",
      });
    }

    if (/\b(?:npm install|yarn add|pnpm add)\b/i.test(plan.summary + plan.steps.map((s) => s.content).join(""))) {
      issues.push({
        code: "DEPENDENCY_CHANGE",
        message: "Plan appears to add dependencies.",
        path: "steps",
      });
    }

    // Ensure preview diff is computable
    buildPreviewDiff(plan.targetFile, plan.currentContent, preview.updatedContent);

    return { valid: issues.length === 0, issues };
  },
};
