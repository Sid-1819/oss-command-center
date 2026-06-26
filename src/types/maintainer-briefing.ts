import { z } from "zod";

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
    suggestions: string[];
  };

  contributorOpportunities: {
    issueNumber: number;
    reason: string;
  }[];

  recommendations: string[];
}

const prioritySchema = z.enum(["high", "medium", "low"]);

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
    suggestions: z
      .array(z.string())
      .describe("Specific documentation updates to consider."),
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
  recommendations: z
    .array(z.string())
    .describe("Concrete, actionable recommendations for the maintainer."),
});

export type GenerateMaintainerBriefingErrorCode =
  | "MISSING_API_KEY"
  | "INVALID_RESPONSE"
  | "VALIDATION"
  | "AI_ERROR";

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
