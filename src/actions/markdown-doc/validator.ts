import type { Validator } from "@/actions/core/Validator";
import type { ValidationIssue } from "@/actions/core/types";
import {
  isAllowedDocFile,
  markdownDocExecutionPlanSchema,
  type MarkdownDocExecutionPlan,
} from "./types";

const MAX_STEP_CONTENT_LENGTH = 8 * 1024;

const OTHER_FILE_PATTERN =
  /\b(?:LICENSE(?:\.md)?)\b|\b(?!README|CHANGELOG|CONTRIBUTING)[A-Z0-9_/-]+\.(?:md|txt|json|ya?ml|toml)\b/i;

export const markdownDocValidator: Validator<MarkdownDocExecutionPlan> = {
  validate(plan) {
    const issues: ValidationIssue[] = [];

    if (!isAllowedDocFile(plan.targetFile)) {
      issues.push({
        code: "INVALID_TARGET",
        message: `Target file "${plan.targetFile}" is not in the allowed markdown doc list.`,
        path: "targetFile",
      });
    }

    const schemaResult = markdownDocExecutionPlanSchema.safeParse({
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

    if (plan.steps.length === 0) {
      issues.push({
        code: "EMPTY_PLAN",
        message: "Plan must include at least one step.",
        path: "steps",
      });
    }

    if (!plan.sourceSha?.trim()) {
      issues.push({
        code: "MISSING_SOURCE_SHA",
        message: `Plan must include the source SHA of ${plan.targetFile}.`,
        path: "sourceSha",
      });
    }

    for (const [index, step] of plan.steps.entries()) {
      if (step.operation === "replace" && !step.section?.trim()) {
        issues.push({
          code: "REQUIRES_SECTION",
          message: `Step ${index + 1} uses replace but does not specify a section.`,
          path: `steps[${index}].section`,
        });
      }

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
          message: `Step ${index + 1} exceeds the ${MAX_STEP_CONTENT_LENGTH} character limit.`,
          path: `steps[${index}].content`,
        });
      }

      const referencesOtherFile =
        OTHER_FILE_PATTERN.test(step.content) ||
        OTHER_FILE_PATTERN.test(step.rationale);

      if (
        referencesOtherFile &&
        !step.content.includes(plan.targetFile) &&
        !step.rationale.includes(plan.targetFile)
      ) {
        issues.push({
          code: "SCOPE_VIOLATION",
          message: `Step ${index + 1} references files outside ${plan.targetFile} scope.`,
          path: `steps[${index}]`,
        });
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  },
};
