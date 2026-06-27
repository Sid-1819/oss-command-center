export interface ActionMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  category?: string;
}

export interface ActionContext {
  repositoryRef: string;
  requestedAt: string;
}

export interface ActionExecutionUser {
  id: string;
  username: string;
}

export interface ActionExecutionContext {
  accessToken: string;
  owner: string;
  repo: string;
  defaultBranch: string;
  user: ActionExecutionUser;
  dryRun: boolean;
}

export interface ActionExecutionResult {
  branchName: string | null;
  commitSha: string | null;
  prNumber: number | null;
  prUrl: string | null;
  filesChanged: string[];
  executionDurationMs: number;
  dryRun: boolean;
}

export interface ExecutionPlan<TStep = unknown> {
  planId: string;
  actionId: string;
  summary: string;
  steps: TStep[];
  createdAt: string;
}

export interface ValidationIssue {
  code: string;
  message: string;
  path?: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export interface ExecutionResult<TArtifacts = unknown> {
  success: boolean;
  artifacts: TArtifacts;
  appliedSteps: number;
  errors?: string[];
}

export type ActionReportStatus = "completed" | "partial" | "failed";

export interface ActionReport {
  status: ActionReportStatus;
  summary: string;
  highlights: string[];
  warnings: string[];
}

export type ActionErrorCode =
  | "PLAN"
  | "VALIDATE"
  | "EXECUTE"
  | "REPORT"
  | "UNKNOWN";

export class ActionError extends Error {
  readonly code: ActionErrorCode;
  readonly phase: ActionErrorCode;
  readonly status: number;
  readonly details?: unknown;

  constructor(
    message: string,
    phase: ActionErrorCode,
    status: number,
    details?: unknown,
  ) {
    super(message);
    this.name = "ActionError";
    this.code = phase;
    this.phase = phase;
    this.status = status;
    this.details = details;
  }
}

export type ActionPipelineResult<TPlan, TOutput, TReport> =
  | {
      success: true;
      plan: TPlan;
      execution: TOutput;
      report: TReport;
    }
  | {
      success: false;
      phase: ActionErrorCode;
      error: ActionError | ValidationResult;
    };
