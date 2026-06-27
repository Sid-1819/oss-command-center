import type { ActionRun } from "@/types/action-run";
import type { ValidationResult } from "@/actions/core/types";
import type { ApplyReadmePlanResult } from "@/actions/readme/apply-plan";
import type {
  ReadmeActionReport,
  ReadmeActionErrorCode,
  ReadmeExecutionOutput,
  ReadmeExecutionPlan,
} from "@/actions/readme/types";
import type { MaintainerBriefing } from "@/types/maintainer-briefing";
import type { RepositoryAnalysis } from "@/types/repository-analysis";

export const README_PLAN_CONTEXT_KEY = "maintaineros:readme-plan-context";
export const README_PLAN_RESULT_KEY = "maintaineros:readme-plan-result";

export interface ReadmePlanContext {
  repositoryRef: string;
  suggestion: string;
  analysis: RepositoryAnalysis;
  briefing: MaintainerBriefing;
  analyzedAt: string;
}

export interface PlanReadmeActionInput {
  repositoryRef: string;
  suggestion: string;
  analysis: RepositoryAnalysis;
  briefing: MaintainerBriefing;
}

export interface ReadmePlanReview {
  repositoryRef: string;
  suggestion: string;
  plan: ReadmeExecutionPlan;
  preview: ApplyReadmePlanResult;
  previewDiff: string;
  validation: ValidationResult;
  plannedAt: string;
}

export type PlanReadmeActionResult =
  | {
      success: true;
      plan: ReadmeExecutionPlan;
      preview: ApplyReadmePlanResult;
      previewDiff: string;
      validation: ValidationResult;
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
        status?: number;
      };
    };

export interface ExecuteReadmeActionInput {
  repositoryRef: string;
  plan: ReadmeExecutionPlan;
}

export type ExecuteReadmeActionResult =
  | {
      success: true;
      output: ReadmeExecutionOutput;
      report: ReadmeActionReport;
      actionRun?: ActionRun;
    }
  | {
      success: false;
      error: {
        code: ReadmeActionErrorCode | "EXPIRED_SESSION" | "VALIDATION" | "UNKNOWN";
        message: string;
        status?: number;
      };
    };
