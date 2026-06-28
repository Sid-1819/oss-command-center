import { z } from "zod";
import type {
  ActionExecutionResult,
  ActionReport,
} from "@/actions/core/types";
import type { ExecutionPlan } from "@/actions/core/types";
import type { AiRequestConfig } from "@/lib/ai/types";
import type { MaintainerBriefing } from "@/types/maintainer-briefing";
import type { RepositoryAnalysis } from "@/types/repository-analysis";

export const README_TARGET_FILE = "README.md" as const;

const ALLOWED_DOC_FILE_PATTERNS = [
  /^README\.md$/i,
  /^CHANGELOG\.md$/i,
  /^CONTRIBUTING\.md$/i,
  /^docs\/[^/]+\.md$/i,
];

export function isAllowedDocFile(path: string): boolean {
  const normalized = path.trim();
  return ALLOWED_DOC_FILE_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function slugifyDocFile(path: string): string {
  return path
    .replace(/\.md$/i, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .slice(0, 30);
}

export const markdownDocPlanStepSchema = z.object({
  operation: z
    .enum(["insert", "replace", "append"])
    .describe("How to apply the change to the target file."),
  section: z
    .string()
    .optional()
    .describe("Heading anchor for insert or replace operations."),
  content: z.string().describe("Markdown content to add or replace."),
  rationale: z
    .string()
    .describe("Why this change addresses the documentation suggestion."),
});

export const markdownDocExecutionPlanSchema = z.object({
  summary: z.string().describe("Brief overview of the planned file updates."),
  steps: z
    .array(markdownDocPlanStepSchema)
    .min(1)
    .describe("Ordered list of modification steps."),
});

export type MarkdownDocPlanStep = z.infer<typeof markdownDocPlanStepSchema>;
export type MarkdownDocPlanPayload = z.infer<typeof markdownDocExecutionPlanSchema>;

export interface MarkdownDocActionInput {
  repositoryRef: string;
  targetFile: string;
  analysis: RepositoryAnalysis;
  briefing: MaintainerBriefing;
  suggestion: string;
  currentContent?: string;
  sourceSha?: string;
  aiConfig?: AiRequestConfig;
  forceRefresh?: boolean;
  demoMode?: boolean;
}

export interface MarkdownDocExecutionPlan
  extends ExecutionPlan<MarkdownDocPlanStep> {
  targetFile: string;
  currentContent: string;
  sourceSha: string;
}

export interface MarkdownDocExecutionOutput extends ActionExecutionResult {
  targetFile: string;
  originalContent: string;
  updatedContent: string;
  appliedSteps: MarkdownDocPlanStep[];
  skippedSteps: MarkdownDocPlanStep[];
  previewDiff: string;
}

export interface MarkdownDocActionReport extends ActionReport {
  previewDiff: string;
  changedSections: string[];
}

export type MarkdownDocActionErrorCode =
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

export class MarkdownDocActionError extends Error {
  readonly code: MarkdownDocActionErrorCode;
  readonly status: number;

  constructor(
    message: string,
    code: MarkdownDocActionErrorCode,
    status: number,
  ) {
    super(message);
    this.name = "MarkdownDocActionError";
    this.code = code;
    this.status = status;
  }
}

// README backward-compat aliases
export type ReadmePlanStep = MarkdownDocPlanStep;
export type ReadmePlanPayload = MarkdownDocPlanPayload;
export type ReadmeActionInput = MarkdownDocActionInput & {
  targetFile: typeof README_TARGET_FILE;
  currentReadme?: string;
};
export type ReadmeExecutionPlan = MarkdownDocExecutionPlan & {
  targetFile: typeof README_TARGET_FILE;
};
export type ReadmeExecutionOutput = MarkdownDocExecutionOutput;
export type ReadmeActionReport = MarkdownDocActionReport;
export type ReadmeActionErrorCode = MarkdownDocActionErrorCode | "README_CHANGED";
export class ReadmeActionError extends MarkdownDocActionError {
  constructor(
    message: string,
    code: ReadmeActionErrorCode,
    status: number,
  ) {
    super(
      message,
      code === "README_CHANGED" ? "FILE_CHANGED" : code,
      status,
    );
    this.name = "ReadmeActionError";
  }
}
export const readmeExecutionPlanSchema = markdownDocExecutionPlanSchema;
export const readmePlanStepSchema = markdownDocPlanStepSchema;

export const DEFAULT_README_FIXTURE = `# Example Project

A sample open-source project for MaintainerOS development.

## Installation

\`\`\`bash
npm install example-project
\`\`\`

## Usage

Import the package and call \`run()\`:

\`\`\`javascript
import { run } from "example-project";

run();
\`\`\`

## Contributing

Pull requests are welcome. Please open an issue first to discuss major changes.

## License

MIT
`;
