import { z } from "zod";
import type {
  ActionExecutionResult,
  ActionReport,
} from "@/actions/core/types";
import type { ExecutionPlan } from "@/actions/core/types";
import type { MaintainerBriefing } from "@/types/maintainer-briefing";
import type { RepositoryAnalysis } from "@/types/repository-analysis";

export const README_TARGET_FILE = "README.md" as const;

export const readmePlanStepSchema = z.object({
  operation: z
    .enum(["insert", "replace", "append"])
    .describe("How to apply the change to README.md."),
  section: z
    .string()
    .optional()
    .describe("Heading anchor for insert or replace operations."),
  content: z.string().describe("Markdown content to add or replace."),
  rationale: z
    .string()
    .describe("Why this change addresses the documentation suggestion."),
});

export const readmeExecutionPlanSchema = z.object({
  summary: z
    .string()
    .describe("Brief overview of the planned README.md updates."),
  steps: z
    .array(readmePlanStepSchema)
    .min(1)
    .describe("Ordered list of README.md modification steps."),
});

export type ReadmePlanStep = z.infer<typeof readmePlanStepSchema>;
export type ReadmePlanPayload = z.infer<typeof readmeExecutionPlanSchema>;

export interface ReadmeActionInput {
  repositoryRef: string;
  analysis: RepositoryAnalysis;
  briefing: MaintainerBriefing;
  suggestion: string;
  currentReadme?: string;
  sourceSha?: string;
}

export interface ReadmeExecutionPlan extends ExecutionPlan<ReadmePlanStep> {
  targetFile: typeof README_TARGET_FILE;
  currentReadme: string;
  sourceSha: string;
}

export interface ReadmeExecutionOutput extends ActionExecutionResult {
  targetFile: typeof README_TARGET_FILE;
  originalContent: string;
  updatedContent: string;
  appliedSteps: ReadmePlanStep[];
  skippedSteps: ReadmePlanStep[];
  previewDiff: string;
}

export interface ReadmeActionReport extends ActionReport {
  previewDiff: string;
  changedSections: string[];
}

export type ReadmeActionErrorCode =
  | "MISSING_API_KEY"
  | "INVALID_RESPONSE"
  | "VALIDATION"
  | "AI_ERROR"
  | "GITHUB_FETCH"
  | "GITHUB_BRANCH"
  | "GITHUB_UPDATE"
  | "GITHUB_PR"
  | "NO_CHANGES"
  | "README_CHANGED";

export class ReadmeActionError extends Error {
  readonly code: ReadmeActionErrorCode;
  readonly status: number;

  constructor(
    message: string,
    code: ReadmeActionErrorCode,
    status: number,
  ) {
    super(message);
    this.name = "ReadmeActionError";
    this.code = code;
    this.status = status;
  }
}

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
