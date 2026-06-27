import type { z } from "zod";

export type AiProviderId = "mock" | "gemini" | "openai" | "anthropic";

export type AiOperation =
  | "maintainer-briefing"
  | "markdown-doc-plan"
  | "issue-fix-plan";

export interface AiRequestConfig {
  provider: AiProviderId;
  apiKey?: string;
  model?: string;
}

export interface StructuredJsonRequest {
  operation: AiOperation;
  systemInstruction: string;
  userPrompt: string;
  schema: z.ZodType;
  modelDefault: string;
  correction?: string;
}

export interface AiProvider {
  id: AiProviderId;
  generateRawJson(request: StructuredJsonRequest): Promise<string>;
}

export type AiErrorCode =
  | "MISSING_API_KEY"
  | "INVALID_RESPONSE"
  | "VALIDATION"
  | "AI_ERROR"
  | "RATE_LIMIT"
  | "PROVIDER_NOT_IMPLEMENTED";

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

export const DEFAULT_MODELS: Record<Exclude<AiProviderId, "mock">, string> = {
  gemini: "gemini-2.5-flash",
  openai: "gpt-4o-mini",
  anthropic: "claude-sonnet-4-20250514",
};
