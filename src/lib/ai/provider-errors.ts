import { APICallError } from "ai";
import type { ByokProviderId } from "@/lib/ai/types";

export type ProviderErrorCode = "RATE_LIMIT" | "AI_ERROR";

export interface ProviderErrorInfo {
  code: ProviderErrorCode;
  status: number;
  message: string;
  retryAfterSeconds?: number;
}

const PROVIDER_LABELS: Record<ByokProviderId, string> = {
  gemini: "Google Gemini",
  openrouter: "OpenRouter",
  openai: "OpenAI",
  anthropic: "Anthropic",
  mistral: "Mistral",
  groq: "Groq",
  xai: "xAI",
};

function extractErrorText(rawMessage: string): string {
  const trimmed = rawMessage.trim();

  if (!trimmed.startsWith("{")) {
    return trimmed;
  }

  try {
    const parsed = JSON.parse(trimmed) as {
      error?: { message?: string };
    };

    return parsed.error?.message?.trim() || trimmed;
  } catch {
    return trimmed;
  }
}

function parseRetryAfterSeconds(message: string): number | undefined {
  const match = message.match(/retry in ([\d.]+)s/i);

  if (!match?.[1]) {
    return undefined;
  }

  return Math.max(1, Math.ceil(Number.parseFloat(match[1])));
}

function isDailyQuotaExceeded(message: string): boolean {
  return /PerDay|free_tier|free tier|daily limit|quotaValue/i.test(message);
}

export function formatRateLimitMessage(
  provider: ByokProviderId,
  rawMessage: string,
): string {
  const label = PROVIDER_LABELS[provider];
  const message = extractErrorText(rawMessage);
  const retryAfterSeconds = parseRetryAfterSeconds(message);

  if (provider === "gemini" && isDailyQuotaExceeded(message)) {
    return (
      "Gemini API free tier daily limit reached. " +
      "Try again tomorrow, use a different API key, or enable billing at ai.google.dev."
    );
  }

  if (retryAfterSeconds) {
    return `${label} API rate limit exceeded. Try again in about ${retryAfterSeconds} seconds.`;
  }

  return `${label} API rate limit exceeded. Please wait a moment and try again.`;
}

export function getProviderErrorInfo(
  provider: ByokProviderId,
  error: APICallError,
): ProviderErrorInfo {
  const message = extractErrorText(error.message || "AI request failed.");
  const status = error.statusCode ?? 500;

  if (status === 429) {
    return {
      code: "RATE_LIMIT",
      status: 429,
      message: formatRateLimitMessage(provider, message),
      retryAfterSeconds: parseRetryAfterSeconds(message),
    };
  }

  return {
    code: "AI_ERROR",
    status,
    message: message || "AI request failed.",
  };
}

export function isFailoverError(error: unknown): boolean {
  if (!(error instanceof APICallError)) {
    return false;
  }

  const status = error.statusCode ?? 500;

  return status === 429 || status === 401 || status === 403 || status >= 500;
}

export function mapProviderError(error: unknown): ProviderErrorInfo | null {
  if (!(error instanceof APICallError)) {
    return null;
  }

  const providerHeader = error.responseHeaders?.["x-ai-provider"];
  const provider =
    providerHeader === "openrouter" || providerHeader === "gemini"
      ? providerHeader
      : "gemini";

  return getProviderErrorInfo(provider, error);
}

export function logProviderAttempt(
  operation: string,
  provider: ByokProviderId,
  attempt: number,
  reason: string,
): void {
  console.info(
    `[ai] operation=${operation} provider=${provider} attempt=${attempt} reason=${reason}`,
  );
}
