import { z } from "zod";
import {
  buildCacheFingerprint,
  getCachedResponse,
  setCachedResponse,
} from "@/lib/ai/cache";
import { AI_PROVIDER_OPTIONS } from "@/lib/ai/provider-catalog";
import { cachedObjectResponse, streamObjectWithFallback } from "@/lib/ai/stream-with-fallback";
import { resolveAiConfig } from "@/lib/ai/resolve-ai-config";
import { AuthError, requireSession } from "@/lib/auth";
import type { AiOperation, AiRequestConfig, ProviderAttemptResult } from "@/lib/ai/types";

const aiProviderIds = AI_PROVIDER_OPTIONS.map((option) => option.id) as [
  (typeof AI_PROVIDER_OPTIONS)[number]["id"],
  ...(typeof AI_PROVIDER_OPTIONS)[number]["id"][],
];

const aiConfigSchema = z
  .object({
    provider: z.enum(aiProviderIds),
    apiKey: z.string().optional(),
    model: z.string().optional(),
  })
  .optional();

export async function requireAiRouteSession(): Promise<Response | null> {
  try {
    await requireSession();
    return null;
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json(
        { error: error.message, code: "EXPIRED_SESSION" },
        { status: 401 },
      );
    }

    return Response.json(
      { error: "Failed to verify session.", code: "UNKNOWN" },
      { status: 500 },
    );
  }
}

export interface HandleAiStreamOptions<T> {
  operation: AiOperation;
  aiConfig?: AiRequestConfig;
  forceRefresh?: boolean;
  cacheInputs?: Record<string, unknown>;
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
}

const CACHE_PROVIDER: ProviderAttemptResult = {
  provider: "gemini",
  model: "cache",
  usedFallback: false,
  attempt: 0,
};

export async function handleAiStreamRoute<T>(
  options: HandleAiStreamOptions<T>,
): Promise<Response> {
  const authError = await requireAiRouteSession();
  if (authError) {
    return authError;
  }

  const aiConfig = options.aiConfig;

  const resolvedConfig = resolveAiConfig(aiConfig);
  const fingerprint =
    options.cacheInputs &&
    buildCacheFingerprint(options.operation, resolvedConfig, options.cacheInputs);

  if (fingerprint && !options.forceRefresh) {
    const cached = await getCachedResponse<T>(fingerprint, options.operation);

    if (cached !== null) {
      const validation = options.schema.safeParse(cached);

      if (validation.success) {
        return cachedObjectResponse(validation.data, CACHE_PROVIDER);
      }
    }
  }

  const response = await streamObjectWithFallback({
    operation: options.operation,
    aiConfig,
    system: options.system,
    prompt: options.prompt,
    schema: options.schema,
  });

  if (fingerprint && response.ok) {
    const cloned = response.clone();
    void cloned
      .text()
      .then(async (text) => {
        try {
          const parsed = JSON.parse(text);
          const validation = options.schema.safeParse(parsed);

          if (validation.success) {
            await setCachedResponse(
              fingerprint,
              options.operation,
              resolvedConfig,
              cloned.headers.get("X-AI-Model") ?? "unknown",
              validation.data,
              cloned.headers.get("X-AI-Provider") ?? "auto",
            );
          }
        } catch {
          // Best-effort cache write from streamed body.
        }
      })
      .catch(() => undefined);
  }

  return response;
}

export { aiConfigSchema };
