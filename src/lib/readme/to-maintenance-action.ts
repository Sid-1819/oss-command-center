import type { ValidationResult } from "@/actions/core/types";
import type { ApplyReadmePlanResult } from "@/actions/readme/apply-plan";
import {
  README_TARGET_FILE,
  type ReadmeExecutionPlan,
  type ReadmePlanStep,
} from "@/actions/readme/types";
import type {
  MaintenanceAction,
  PreflightCheck,
} from "@/types/execution-workflow";

function countDiffLines(
  originalContent: string,
  updatedContent: string,
): { linesAdded: number; linesRemoved: number } {
  const originalLines = originalContent.split("\n");
  const updatedLines = updatedContent.split("\n");
  let linesAdded = 0;
  let linesRemoved = 0;

  const maxLines = Math.max(originalLines.length, updatedLines.length);

  for (let index = 0; index < maxLines; index++) {
    const originalLine = originalLines[index];
    const updatedLine = updatedLines[index];

    if (originalLine === updatedLine) {
      continue;
    }

    if (originalLine !== undefined) {
      linesRemoved += 1;
    }

    if (updatedLine !== undefined) {
      linesAdded += 1;
    }
  }

  return { linesAdded, linesRemoved };
}

function stepLabel(step: ReadmePlanStep): string {
  const section = step.section ? ` → ${step.section}` : "";
  return `${step.operation}${section}`;
}

function validationToPreflightChecks(
  validation: ValidationResult,
  plan: ReadmeExecutionPlan,
  preview: ApplyReadmePlanResult,
): PreflightCheck[] {
  const truncatedSha = plan.sourceSha.slice(0, 7);
  const totalSteps = plan.steps.length;
  const appliedCount = preview.appliedSteps.length;
  const skippedCount = preview.skippedSteps.length;

  const previewCheck: PreflightCheck = {
    id: "preview-application",
    name: "Preview application",
    description: `${appliedCount} of ${totalSteps} steps applied in preview`,
    status: skippedCount > 0 ? "warning" : "success",
    details:
      skippedCount > 0
        ? `${skippedCount} step(s) could not be applied during preview`
        : "All steps applied successfully in preview",
  };

  const skippedChecks: PreflightCheck[] = preview.skippedSteps.map(
    (step, index) => ({
      id: `skipped-${index}`,
      name: `Skipped: ${stepLabel(step)}`,
      description: step.rationale,
      status: "warning" as const,
      details: step.section ?? step.operation,
    }),
  );

  if (validation.valid) {
    return [
      {
        id: "plan-valid",
        name: "Plan validation",
        description: "AI-generated plan passed all validation checks.",
        status: "success",
        details: "Ready for review.",
      },
      {
        id: "readme-scope",
        name: "README scope",
        description: "Plan only modifies README.md.",
        status: "success",
        details: `Target file: ${README_TARGET_FILE}`,
      },
      {
        id: "source-sha",
        name: "Source snapshot",
        description: "Plan is tied to the current README.md revision.",
        status: "success",
        details: `SHA: ${truncatedSha}`,
      },
      previewCheck,
      ...skippedChecks,
    ];
  }

  const issueChecks: PreflightCheck[] = validation.issues.map((issue, index) => ({
    id: `validation-${index}`,
    name: issue.code,
    description: issue.message,
    status: "error" as const,
    details: issue.path,
  }));

  return [
    ...issueChecks,
    {
      id: "plan-valid",
      name: "Plan validation",
      description: "AI-generated plan failed validation.",
      status: "error",
      details: `${validation.issues.length} issue(s) must be resolved before execution.`,
    },
    {
      id: "source-sha",
      name: "Source snapshot",
      description: "Plan is tied to the current README.md revision.",
      status: "success",
      details: `SHA: ${truncatedSha}`,
    },
    previewCheck,
    ...skippedChecks,
  ];
}

export function toMaintenanceAction(
  plan: ReadmeExecutionPlan,
  preview: ApplyReadmePlanResult,
  validation: ValidationResult,
  repositoryRef: string,
  suggestion: string,
): MaintenanceAction {
  const { linesAdded, linesRemoved } = countDiffLines(
    plan.currentReadme,
    preview.updatedContent,
  );

  const reasoning =
    plan.steps.length > 0
      ? plan.steps
          .map((step, index) => {
            const label = step.section ? ` (${step.section})` : "";
            return `${index + 1}. ${step.rationale}${label}`;
          })
          .join("\n\n")
      : suggestion;

  return {
    id: plan.planId,
    type: "documentation",
    title: "Update README",
    description: plan.summary,
    reasoning,
    repository: repositoryRef,
    repositoryUrl: `https://github.com/${repositoryRef}`,
    status: "review",
    proposedChanges: [
      {
        path: README_TARGET_FILE,
        action: "modify",
        summary: plan.summary,
        beforeContent: plan.currentReadme,
        afterContent: preview.updatedContent,
        linesAdded,
        linesRemoved,
      },
    ],
    preflightChecks: validationToPreflightChecks(validation, plan, preview),
    createdAt: new Date(plan.createdAt),
  };
}
