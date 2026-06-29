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
  | "PROVIDERS_EXHAUSTED"
  | "UNKNOWN";

export interface DashboardError {
  message: string;
  code: DashboardErrorCode;
  status?: number;
}

export type DashboardAnalysisSuccess = {
  analysis: RepositoryAnalysis;
  briefing: MaintainerBriefing;
  analyzedAt: string;
  repositoryRef: string;
};

export interface DashboardSession extends DashboardAnalysisSuccess {}

export type DashboardAnalysisResult =
  | ({
      success: true;
    } & DashboardAnalysisSuccess)
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
  MISSING_API_KEY: "Connect a compatible provider in MaintainerOS AI settings, or use hosted MaintainerOS AI.",
  INVALID_RESPONSE: "AI briefing failed. Try again.",
  AI_ERROR: "AI briefing failed. Try again.",
  PROVIDER_NOT_IMPLEMENTED:
    "That MaintainerOS AI provider is not available yet. Use hosted MaintainerOS AI or another compatible provider.",
  PROVIDERS_EXHAUSTED:
    "All MaintainerOS AI providers are unavailable. Try again later or connect your own provider.",
  UNKNOWN: "Something went wrong. Please try again.",
};

export function friendlyErrorMessage(error: DashboardError): string {
  if (error.code === "RATE_LIMIT" && error.message) {
    return error.message;
  }

  return FRIENDLY_ERROR_MESSAGES[error.code] ?? error.message;
}
