import type { ActionRun } from "@/types/action-run";
import type { ValidationResult } from "@/actions/core/types";
import type { ApplyMarkdownDocPlanResult } from "@/actions/markdown-doc/apply-plan";
import type {
  MarkdownDocActionReport,
  MarkdownDocActionErrorCode,
  MarkdownDocExecutionOutput,
  MarkdownDocExecutionPlan,
} from "@/actions/markdown-doc/types";
import type { AiRequestConfig } from "@/lib/ai/types";
import type { MaintainerBriefing } from "@/types/maintainer-briefing";
import type { RepositoryAnalysis } from "@/types/repository-analysis";

export const DOC_PLAN_CONTEXT_KEY = "maintaineros:doc-plan-context";
export const DOC_PLAN_RESULT_KEY = "maintaineros:doc-plan-result";

/** @deprecated Use DOC_PLAN_CONTEXT_KEY */
export const README_PLAN_CONTEXT_KEY = DOC_PLAN_CONTEXT_KEY;
/** @deprecated Use DOC_PLAN_RESULT_KEY */
export const README_PLAN_RESULT_KEY = DOC_PLAN_RESULT_KEY;

export interface DocPlanContext {
  repositoryRef: string;
  targetFile: string;
  suggestion: string;
  analysis: RepositoryAnalysis;
  briefing: MaintainerBriefing;
  analyzedAt: string;
  aiConfig?: AiRequestConfig;
  demoMode?: boolean;
}

/** @deprecated Use DocPlanContext */
export type ReadmePlanContext = DocPlanContext;

export interface PlanMarkdownDocActionInput {
  repositoryRef: string;
  targetFile: string;
  suggestion: string;
  analysis: RepositoryAnalysis;
  briefing: MaintainerBriefing;
  aiConfig?: AiRequestConfig;
  forceRefresh?: boolean;
  demoMode?: boolean;
}

/** @deprecated Use PlanMarkdownDocActionInput */
export type PlanReadmeActionInput = Omit<PlanMarkdownDocActionInput, "targetFile"> & {
  targetFile?: string;
};

export interface DocPlanReview {
  repositoryRef: string;
  targetFile: string;
  suggestion: string;
  plan: MarkdownDocExecutionPlan;
  preview: ApplyMarkdownDocPlanResult;
  previewDiff: string;
  validation: ValidationResult;
  plannedAt: string;
}

/** @deprecated Use DocPlanReview */
export type ReadmePlanReview = DocPlanReview;

export type PlanMarkdownDocActionResult =
  | {
      success: true;
      plan: MarkdownDocExecutionPlan;
      preview: ApplyMarkdownDocPlanResult;
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

/** @deprecated Use PlanMarkdownDocActionResult */
export type PlanReadmeActionResult = PlanMarkdownDocActionResult;

export interface ExecuteMarkdownDocActionInput {
  repositoryRef: string;
  plan: MarkdownDocExecutionPlan;
  demoMode?: boolean;
}

/** @deprecated Use ExecuteMarkdownDocActionInput */
export type ExecuteReadmeActionInput = ExecuteMarkdownDocActionInput;

export type ExecuteMarkdownDocActionResult =
  | {
      success: true;
      output: MarkdownDocExecutionOutput;
      report: MarkdownDocActionReport;
      actionRun?: ActionRun;
    }
  | {
      success: false;
      error: {
        code: MarkdownDocActionErrorCode | "EXPIRED_SESSION" | "VALIDATION" | "UNKNOWN" | "README_CHANGED";
        message: string;
        status?: number;
      };
    };

/** @deprecated Use ExecuteMarkdownDocActionResult */
export type ExecuteReadmeActionResult = ExecuteMarkdownDocActionResult;

export interface PlanIssueFixActionInput {
  repositoryRef: string;
  issueNumber: number;
  analysis: RepositoryAnalysis;
  briefing: MaintainerBriefing;
  aiConfig?: AiRequestConfig;
  forceRefresh?: boolean;
  demoMode?: boolean;
}

export type PlanIssueFixActionResult =
  | {
      success: true;
      plan: import("@/actions/issue-fix/types").IssueFixExecutionPlan;
      preview: import("@/actions/issue-fix/apply-plan").ApplyIssueFixPlanResult;
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

export interface ExecuteIssueFixActionInput {
  repositoryRef: string;
  plan: import("@/actions/issue-fix/types").IssueFixExecutionPlan;
  demoMode?: boolean;
}

export type ExecuteIssueFixActionResult =
  | {
      success: true;
      output: import("@/actions/issue-fix/types").IssueFixExecutionOutput;
      report: import("@/actions/issue-fix/types").IssueFixActionReport;
      actionRun?: ActionRun;
    }
  | {
      success: false;
      error: {
        code: string;
        message: string;
        status?: number;
      };
    };

export interface IssueFixPlanReview {
  repositoryRef: string;
  issueNumber: number;
  plan: import("@/actions/issue-fix/types").IssueFixExecutionPlan;
  preview: import("@/actions/issue-fix/apply-plan").ApplyIssueFixPlanResult;
  previewDiff: string;
  validation: ValidationResult;
  plannedAt: string;
}

export const ISSUE_PLAN_CONTEXT_KEY = "maintaineros:issue-plan-context";
export const ISSUE_PLAN_RESULT_KEY = "maintaineros:issue-plan-result";

export interface IssuePlanContext {
  repositoryRef: string;
  issueNumber: number;
  analysis: RepositoryAnalysis;
  briefing: MaintainerBriefing;
  analyzedAt: string;
  aiConfig?: AiRequestConfig;
  demoMode?: boolean;
}
