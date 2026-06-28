import { z } from "zod";
import type {
  ActionExecutionResult,
  ActionReport,
} from "@/actions/core/types";
import type { ExecutionPlan } from "@/actions/core/types";
import type { AiRequestConfig } from "@/lib/ai/types";
import type { AutoFixCandidate } from "@/types/maintainer-briefing";
import type { RepositoryAnalysis } from "@/types/repository-analysis";

export const BLOCKED_ISSUE_FIX_FILES = [
  "package.json",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
  "pnpm-lock.yml",
];

export const issueFixPlanStepSchema = z.object({
  operation: z
    .enum(["insert", "replace", "append", "replace_all"])
    .describe("How to apply the change."),
  section: z
    .string()
    .optional()
    .describe("Heading anchor for markdown insert/replace."),
  content: z.string().describe("New or replacement content."),
  rationale: z.string().describe("Why this fixes the issue."),
});

export const issueFixExecutionPlanSchema = z.object({
  summary: z.string().describe("Brief overview of the planned fix."),
  steps: z
    .array(issueFixPlanStepSchema)
    .min(1)
    .max(3)
    .describe("Ordered list of modification steps."),
});

export type IssueFixPlanStep = z.infer<typeof issueFixPlanStepSchema>;
export type IssueFixPlanPayload = z.infer<typeof issueFixExecutionPlanSchema>;

export interface IssueFixActionInput {
  repositoryRef: string;
  issueNumber: number;
  candidate: AutoFixCandidate;
  analysis: RepositoryAnalysis;
  issueTitle: string;
  issueBody?: string;
  targetFile: string;
  currentContent?: string;
  sourceSha?: string;
  aiConfig?: AiRequestConfig;
  forceRefresh?: boolean;
  demoMode?: boolean;
}

export interface IssueFixExecutionPlan extends ExecutionPlan<IssueFixPlanStep> {
  issueNumber: number;
  targetFile: string;
  currentContent: string;
  sourceSha: string;
}

export interface IssueFixExecutionOutput extends ActionExecutionResult {
  issueNumber: number;
  targetFile: string;
  originalContent: string;
  updatedContent: string;
  appliedSteps: IssueFixPlanStep[];
  skippedSteps: IssueFixPlanStep[];
  previewDiff: string;
}

export interface IssueFixActionReport extends ActionReport {
  previewDiff: string;
}

export type IssueFixActionErrorCode =
  | "MISSING_API_KEY"
  | "INVALID_RESPONSE"
  | "VALIDATION"
  | "AI_ERROR"
  | "RATE_LIMIT"
  | "PROVIDER_NOT_IMPLEMENTED"
  | "PROVIDERS_EXHAUSTED"
  | "GITHUB_FETCH"
  | "GITHUB_BRANCH"
  | "GITHUB_UPDATE"
  | "GITHUB_PR"
  | "NO_CHANGES"
  | "FILE_CHANGED";

export class IssueFixActionError extends Error {
  readonly code: IssueFixActionErrorCode;
  readonly status: number;

  constructor(
    message: string,
    code: IssueFixActionErrorCode,
    status: number,
  ) {
    super(message);
    this.name = "IssueFixActionError";
    this.code = code;
    this.status = status;
  }
}
