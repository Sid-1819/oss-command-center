import type { ValidationResult } from "@/actions/core/types";
import type { ApplyMarkdownDocPlanResult } from "@/actions/markdown-doc/apply-plan";
import type { MarkdownDocExecutionPlan, MarkdownDocPlanStep } from "@/actions/markdown-doc/types";
import type { IssueFixExecutionPlan, IssueFixPlanStep } from "@/actions/issue-fix/types";
import type { ApplyIssueFixPlanResult } from "@/actions/issue-fix/apply-plan";
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
    if (originalLines[index] !== updatedLines[index]) {
      if (originalLines[index] !== undefined) linesRemoved += 1;
      if (updatedLines[index] !== undefined) linesAdded += 1;
    }
  }

  return { linesAdded, linesRemoved };
}

function stepLabel(step: MarkdownDocPlanStep | IssueFixPlanStep): string {
  const section = step.section ? ` → ${step.section}` : "";
  return `${step.operation}${section}`;
}

function validationToPreflightChecks(
  validation: ValidationResult,
  plan: { sourceSha: string; targetFile: string; steps: unknown[] },
  preview: { appliedSteps: unknown[]; skippedSteps: unknown[] },
  skippedStepList: Array<MarkdownDocPlanStep | IssueFixPlanStep>,
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

  const skippedChecks: PreflightCheck[] = skippedStepList.map((step, index) => ({
    id: `skipped-${index}`,
    name: `Skipped: ${stepLabel(step)}`,
    description: step.rationale,
    status: "warning" as const,
    details: step.section ?? step.operation,
  }));

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
        id: "file-scope",
        name: "File scope",
        description: `Plan only modifies ${plan.targetFile}.`,
        status: "success",
        details: `Target file: ${plan.targetFile}`,
      },
      {
        id: "source-sha",
        name: "Source snapshot",
        description: "Plan is tied to the current file revision.",
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
    previewCheck,
    ...skippedChecks,
  ];
}

export function toDocMaintenanceAction(
  plan: MarkdownDocExecutionPlan,
  preview: ApplyMarkdownDocPlanResult,
  validation: ValidationResult,
  repositoryRef: string,
  suggestion: string,
): MaintenanceAction {
  const { linesAdded, linesRemoved } = countDiffLines(
    plan.currentContent,
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
    title: `Update ${plan.targetFile}`,
    description: plan.summary,
    reasoning,
    repository: repositoryRef,
    repositoryUrl: `https://github.com/${repositoryRef}`,
    status: "review",
    proposedChanges: [
      {
        path: plan.targetFile,
        action: "modify",
        summary: plan.summary,
        beforeContent: plan.currentContent,
        afterContent: preview.updatedContent,
        linesAdded,
        linesRemoved,
      },
    ],
    preflightChecks: validationToPreflightChecks(
      validation,
      plan,
      preview,
      preview.skippedSteps,
    ),
    createdAt: new Date(plan.createdAt),
  };
}

export function toIssueMaintenanceAction(
  plan: IssueFixExecutionPlan,
  preview: ApplyIssueFixPlanResult,
  validation: ValidationResult,
  repositoryRef: string,
  issueTitle: string,
): MaintenanceAction {
  const { linesAdded, linesRemoved } = countDiffLines(
    plan.currentContent,
    preview.updatedContent,
  );

  const reasoning =
    plan.steps.length > 0
      ? plan.steps
          .map((step, index) => `${index + 1}. ${step.rationale}`)
          .join("\n\n")
      : issueTitle;

  return {
    id: plan.planId,
    type: "cleanup",
    title: `Fix issue #${plan.issueNumber}`,
    description: plan.summary,
    reasoning,
    repository: repositoryRef,
    repositoryUrl: `https://github.com/${repositoryRef}`,
    status: "review",
    proposedChanges: [
      {
        path: plan.targetFile,
        action: "modify",
        summary: plan.summary,
        beforeContent: plan.currentContent,
        afterContent: preview.updatedContent,
        linesAdded,
        linesRemoved,
      },
    ],
    preflightChecks: validationToPreflightChecks(
      validation,
      plan,
      preview,
      preview.skippedSteps,
    ),
    createdAt: new Date(plan.createdAt),
  };
}

/** @deprecated Use toDocMaintenanceAction */
export function toMaintenanceAction(
  plan: MarkdownDocExecutionPlan,
  preview: ApplyMarkdownDocPlanResult,
  validation: ValidationResult,
  repositoryRef: string,
  suggestion: string,
): MaintenanceAction {
  return toDocMaintenanceAction(plan, preview, validation, repositoryRef, suggestion);
}
