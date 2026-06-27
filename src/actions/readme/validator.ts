import type { Validator } from "@/actions/core/Validator";
import type { ValidationIssue } from "@/actions/core/types";
import {
  README_TARGET_FILE,
  readmeExecutionPlanSchema,
  type ReadmeExecutionPlan,
} from "./types";

const MAX_STEP_CONTENT_LENGTH = 8 * 1024;

const OTHER_FILE_PATTERN =
  /\b(?:CHANGELOG(?:\.md)?|LICENSE(?:\.md)?|CONTRIBUTING(?:\.md)?)\b|\bdocs\/|\b(?!README)[A-Z0-9_-]+\.(?:md|txt|json|ya?ml|toml)\b/i;

export const readmeValidator: Validator<ReadmeExecutionPlan> = {
  validate(plan) {
    const issues: ValidationIssue[] = [];

    if (plan.targetFile !== README_TARGET_FILE) {
      issues.push({
        code: "INVALID_TARGET",
        message: `Only ${README_TARGET_FILE} is supported, got "${plan.targetFile}".`,
        path: "targetFile",
      });
    }

    const schemaResult = readmeExecutionPlanSchema.safeParse({
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
        message: "Plan must include the source SHA of README.md.",
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

      if (OTHER_FILE_PATTERN.test(step.content) || OTHER_FILE_PATTERN.test(step.rationale)) {
        issues.push({
          code: "SCOPE_VIOLATION",
          message: `Step ${index + 1} references files outside README.md scope.`,
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
