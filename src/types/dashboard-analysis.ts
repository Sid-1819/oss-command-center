import type { MaintainerBriefing } from "@/types/maintainer-briefing";
import type { RepositoryAnalysis } from "@/types/repository-analysis";

export type DashboardErrorCode =
  | "VALIDATION"
  | "NOT_FOUND"
  | "FORBIDDEN"
  | "RATE_LIMIT"
  | "MISSING_API_KEY"
  | "INVALID_RESPONSE"
  | "AI_ERROR"
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
  FORBIDDEN: "GitHub access denied. Check GITHUB_TOKEN in .env.",
  RATE_LIMIT: "GitHub rate limit exceeded. Try again shortly.",
  MISSING_API_KEY: "AI briefing requires GOOGLE_API_KEY in .env.",
  INVALID_RESPONSE: "AI briefing failed. Try again.",
  AI_ERROR: "AI briefing failed. Try again.",
  UNKNOWN: "Something went wrong. Please try again.",
};

export function friendlyErrorMessage(error: DashboardError): string {
  return FRIENDLY_ERROR_MESSAGES[error.code] ?? error.message;
}
