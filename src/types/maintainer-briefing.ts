import { z } from "zod";

export type AutoFixFixType =
  | "documentation"
  | "typo"
  | "config"
  | "comment"
  | "other";

export interface DocumentationFileSuggestion {
  path: string;
  suggestions: string[];
}

export interface AutoFixCandidate {
  issueNumber: number;
  reason: string;
  effort: "low";
  fixType: AutoFixFixType;
  suggestedFiles: string[];
}

export interface MaintainerBriefing {
  summary: string;

  priorities: {
    title: string;
    reason: string;
    priority: "high" | "medium" | "low";
  }[];

  repositoryHealth: {
    score: number;
    explanation: string;
  };

  release: {
    ready: boolean;
    reason: string;
  };

  documentation: {
    outdated: boolean;
    files: DocumentationFileSuggestion[];
  };

  contributorOpportunities: {
    issueNumber: number;
    reason: string;
  }[];

  autoFixCandidates: AutoFixCandidate[];

  recommendations: string[];
}

const prioritySchema = z.enum(["high", "medium", "low"]);
const autoFixFixTypeSchema = z.enum([
  "documentation",
  "typo",
  "config",
  "comment",
  "other",
]);

export const maintainerBriefingSchema = z.object({
  summary: z
    .string()
    .describe(
      "A maintainer decision brief on what to focus on next. Not an activity recap.",
    ),
  priorities: z
    .array(
      z.object({
        title: z.string().describe("Short title for the priority item."),
        reason: z
          .string()
          .describe(
            "Specific, actionable reason referencing PRs, issues, or repo signals.",
          ),
        priority: prioritySchema.describe(
          "Urgency for maintainer attention: high, medium, or low.",
        ),
      }),
    )
    .describe("Ordered list of what deserves attention now."),
  repositoryHealth: z.object({
    score: z
      .number()
      .min(0)
      .max(100)
      .describe("Overall maintainer health score from 0 to 100."),
    explanation: z
      .string()
      .describe("Brief explanation of the health score based on repo signals."),
  }),
  release: z.object({
    ready: z
      .boolean()
      .describe("Whether the project appears ready for a release."),
    reason: z
      .string()
      .describe("Concrete reason supporting the release readiness assessment."),
  }),
  documentation: z.object({
    outdated: z
      .boolean()
      .describe(
        "Whether documentation likely needs updates based on repository activity.",
      ),
    files: z
      .array(
        z.object({
          path: z
            .string()
            .describe(
              "Markdown file path, e.g. README.md, CHANGELOG.md, CONTRIBUTING.md, docs/guide.md",
            ),
          suggestions: z
            .array(z.string())
            .describe("Specific updates for this file."),
        }),
      )
      .describe("Per-file documentation update suggestions."),
  }),
  contributorOpportunities: z
    .array(
      z.object({
        issueNumber: z
          .number()
          .int()
          .describe("Issue number from the provided open issues list."),
        reason: z
          .string()
          .describe("Why this issue is beginner-friendly or good for contributors."),
      }),
    )
    .describe("Beginner-friendly issues from the input data only."),
  autoFixCandidates: z
    .array(
      z.object({
        issueNumber: z
          .number()
          .int()
          .describe("Issue number from the provided open issues list."),
        reason: z
          .string()
          .describe(
            "Why MaintainerOS can fix this with a single-file, low-effort change.",
          ),
        effort: z.literal("low").describe("Must be low effort only."),
        fixType: autoFixFixTypeSchema.describe("Category of the fix."),
        suggestedFiles: z
          .array(z.string())
          .describe("Target file(s); prefer exactly one file."),
      }),
    )
    .describe(
      "Issues the maintainer can auto-fix via PR (single file, small diff, no dependency changes). Not for beginner contributors.",
    ),
  recommendations: z
    .array(z.string())
    .describe("Concrete, actionable recommendations for the maintainer."),
});

export type GenerateMaintainerBriefingErrorCode =
  | "MISSING_API_KEY"
  | "INVALID_RESPONSE"
  | "VALIDATION"
  | "AI_ERROR"
  | "RATE_LIMIT"
  | "PROVIDER_NOT_IMPLEMENTED"
  | "PROVIDERS_EXHAUSTED";

export class GenerateMaintainerBriefingError extends Error {
  readonly code: GenerateMaintainerBriefingErrorCode;
  readonly status: number;

  constructor(
    message: string,
    code: GenerateMaintainerBriefingErrorCode,
    status: number,
  ) {
    super(message);
    this.name = "GenerateMaintainerBriefingError";
    this.code = code;
    this.status = status;
  }
}
