import { ApiError } from "@google/genai";

export type GeminiErrorCode = "RATE_LIMIT" | "AI_ERROR";

export interface GeminiErrorInfo {
  code: GeminiErrorCode;
  status: number;
  message: string;
  retryAfterSeconds?: number;
}

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

export function formatGeminiRateLimitMessage(rawMessage: string): string {
  const message = extractErrorText(rawMessage);
  const retryAfterSeconds = parseRetryAfterSeconds(message);

  if (isDailyQuotaExceeded(message)) {
    return (
      "Gemini API free tier daily limit reached (20 requests/day for gemini-2.5-flash). " +
      "Try again tomorrow, use a different API key, or enable billing at ai.google.dev."
    );
  }

  if (retryAfterSeconds) {
    return `Gemini API rate limit exceeded. Try again in about ${retryAfterSeconds} seconds.`;
  }

  return "Gemini API rate limit exceeded. Please wait a moment and try again.";
}

export function getGeminiErrorInfo(error: ApiError): GeminiErrorInfo {
  const message = extractErrorText(error.message || "AI request failed.");

  if (error.status === 429) {
    return {
      code: "RATE_LIMIT",
      status: 429,
      message: formatGeminiRateLimitMessage(message),
      retryAfterSeconds: parseRetryAfterSeconds(message),
    };
  }

  return {
    code: "AI_ERROR",
    status: error.status ?? 500,
    message: message || "AI request failed.",
  };
}

export function isGeminiRateLimitError(error: unknown): boolean {
  return error instanceof ApiError && error.status === 429;
}

export function mapGeminiApiError(error: unknown): GeminiErrorInfo | null {
  if (error instanceof ApiError) {
    return getGeminiErrorInfo(error);
  }

  return null;
}
