import type { z } from "zod";

export type AiProviderId = "auto" | ByokProviderId;

export type ByokProviderId =
  | "gemini"
  | "openrouter"
  | "openai"
  | "anthropic"
  | "mistral"
  | "groq"
  | "xai";

export type AiExecutionMode = "byok" | "chain";

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
  provider?: ByokProviderId;
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
  provider: ByokProviderId;
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

export const DEFAULT_MODELS: Record<ByokProviderId, string> = {
  gemini: "gemini-2.5-flash",
  openrouter: "openrouter/free",
  openai: "gpt-4o-mini",
  anthropic: "claude-3-5-haiku-latest",
  mistral: "mistral-small-latest",
  groq: "llama-3.3-70b-versatile",
  xai: "grok-2-1212",
};
