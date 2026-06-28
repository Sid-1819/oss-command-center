import { APICallError } from "ai";
import type { z } from "zod";
import {
  generateStructuredObject,
  streamStructuredObject,
  type GenerateObjectInput,
} from "@/lib/ai/generate-object";
import {
  getProviderErrorInfo,
  isFailoverError,
  logProviderAttempt,
} from "@/lib/ai/provider-errors";
import { AiConfigError, type AiOperation, type ProviderAttemptResult } from "@/lib/ai/types";

export interface StreamWithFallbackOptions<T> extends GenerateObjectInput<T> {
  onProviderSelected?: (provider: ProviderAttemptResult) => void;
}

function wrapStreamResponse(
  result: { toTextStreamResponse: () => Response },
  provider: ProviderAttemptResult,
): Response {
  const response = result.toTextStreamResponse();

  const headers = new Headers(response.headers);
  headers.set("X-AI-Provider", provider.provider);
  headers.set("X-AI-Model", provider.model);
  if (provider.usedFallback) {
    headers.set("X-AI-Fallback", "true");
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

export async function streamObjectWithFallback<T>(
  options: StreamWithFallbackOptions<T>,
): Promise<Response> {
  try {
    const { result, provider } = await streamStructuredObject(options);
    options.onProviderSelected?.(provider);
    return wrapStreamResponse(result, provider);
  } catch (error) {
    if (error instanceof AiConfigError) {
      return Response.json(
        { error: error.message, code: error.code },
        { status: error.status },
      );
    }

    if (error instanceof APICallError) {
      const info = getProviderErrorInfo("gemini", error);
      return Response.json(
        { error: info.message, code: info.code },
        { status: info.status },
      );
    }

    return Response.json(
      {
        error: error instanceof Error ? error.message : "AI request failed.",
        code: "AI_ERROR",
      },
      { status: 500 },
    );
  }
}

export async function generateObjectWithFallback<T>(
  options: StreamWithFallbackOptions<T>,
): Promise<{ object: T; provider: ProviderAttemptResult }> {
  try {
    const result = await generateStructuredObject(options);
    options.onProviderSelected?.(result.provider);
    return result;
  } catch (error) {
    if (error instanceof APICallError && isFailoverError(error)) {
      logProviderAttempt(
        options.operation,
        "gemini",
        1,
        error.message,
      );
    }

    throw error;
  }
}

export type { GenerateObjectInput };

export function cachedObjectResponse<T>(
  object: T,
  provider: ProviderAttemptResult,
): Response {
  return new Response(JSON.stringify(object), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-AI-Provider": provider.provider,
      "X-AI-Model": provider.model,
      "X-AI-Cache": "hit",
    },
  });
}

export function buildAiRouteBodySchema<T extends z.ZodType>(payloadSchema: T) {
  return payloadSchema;
}

export type AiRouteOperation = AiOperation;
