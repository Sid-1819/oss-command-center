import type { MaintainerBriefing } from "@/types/maintainer-briefing";
import type { RepositoryAnalysis } from "@/types/repository-analysis";

export type DashboardErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "RATE_LIMIT"
  | "UNAUTHORIZED"
  | "MISSING_API_KEY"
  | "INVALID_RESPONSE"
  | "AI_ERROR"
  | "PROVIDER_NOT_IMPLEMENTED"
  | "UNKNOWN";

export interface DashboardError {
  message: string;
  code: DashboardErrorCode;
  status?: number;
}

export type DashboardAnalysisResult =
  | {
      success: true;
      analysis: RepositoryAnalysis;
      briefing: MaintainerBriefing;
      analyzedAt: string;
      repositoryRef: string;
    }
  | {
      success: false;
      error: DashboardError;
    };

const FRIENDLY_ERROR_MESSAGES: Record<DashboardErrorCode, string> = {
  VALIDATION: "Use owner/repo format, e.g. vercel/next.js",
  NOT_FOUND: "Repository not found. Double-check the name.",
  FORBIDDEN: "GitHub access denied. Sign in again or pick a repository you can access.",
  RATE_LIMIT: "Rate limit exceeded. Try again shortly.",
  UNAUTHORIZED: "Sign in with GitHub to analyze repositories.",
  MISSING_API_KEY: "Add your API key in AI settings or switch to Mock mode.",
  INVALID_RESPONSE: "AI briefing failed. Try again.",
  AI_ERROR: "AI briefing failed. Try again.",
  PROVIDER_NOT_IMPLEMENTED: "That AI provider is not available yet. Use Mock or Gemini.",
  UNKNOWN: "Something went wrong. Please try again.",
};

export function friendlyErrorMessage(error: DashboardError): string {
  if (error.code === "RATE_LIMIT" && error.message) {
    return error.message;
  }

  return FRIENDLY_ERROR_MESSAGES[error.code] ?? error.message;
}
