import type { z } from "zod";

export type AiProviderId =
  | "mock"
  | "auto"
  | "gemini"
  | "openrouter";

export type AiExecutionMode = "mock" | "byok" | "chain";

export type ChainProviderId = "gemini" | "openrouter";

export type AiOperation =
  | "maintainer-briefing"
  | "markdown-doc-plan"
  | "issue-fix-plan";

export interface AiRequestConfig {
  provider: AiProviderId;
  apiKey?: string;
  model?: string;
}

export interface ResolvedAiConfig {
  mode: AiExecutionMode;
  provider?: Exclude<AiProviderId, "mock" | "auto">;
  apiKey?: string;
  model?: string;
}

export interface StructuredJsonRequest {
  operation: AiOperation;
  systemInstruction: string;
  userPrompt: string;
  schema: z.ZodType;
  correction?: string;
}

export interface AiProvider {
  id: AiProviderId;
  generateRawJson(request: StructuredJsonRequest): Promise<string>;
}

export interface ProviderAttemptResult {
  provider: ChainProviderId;
  model: string;
  usedFallback: boolean;
  attempt: number;
}

export type AiErrorCode =
  | "MISSING_API_KEY"
  | "INVALID_RESPONSE"
  | "VALIDATION"
  | "AI_ERROR"
  | "RATE_LIMIT"
  | "PROVIDER_NOT_IMPLEMENTED"
  | "PROVIDERS_EXHAUSTED";

export class AiConfigError extends Error {
  readonly code: AiErrorCode;
  readonly status: number;

  constructor(message: string, code: AiErrorCode, status: number) {
    super(message);
    this.name = "AiConfigError";
    this.code = code;
    this.status = status;
  }
}

export const DEFAULT_MODELS: Record<
  Exclude<AiProviderId, "mock" | "auto">,
  string
> = {
  gemini: "gemini-2.5-flash",
  openrouter: "openrouter/free",
};
