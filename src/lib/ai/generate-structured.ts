import { createAiProvider } from "@/lib/ai/create-provider";
import {
  buildCacheFingerprint,
  getCachedResponse,
  setCachedResponse,
} from "@/lib/ai/cache";
import { resolveAiConfig } from "@/lib/ai/resolve-ai-config";
import {
  AiConfigError,
  DEFAULT_MODELS,
  type AiRequestConfig,
  type StructuredJsonRequest,
} from "@/lib/ai/types";
import type { z } from "zod";

const MAX_ATTEMPTS = 2;

const INVALID_JSON_CORRECTION =
  "Your previous response was invalid JSON. Return only valid JSON matching the schema.";

function stripMarkdownFences(text: string): string {
  const trimmed = text.trim();

  if (!trimmed.startsWith("```")) {
    return trimmed;
  }

  return trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();
}

type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; reason: "empty" | "json" | "validation" };

function parseStructuredResponse<T>(
  text: string | undefined,
  schema: z.ZodType<T>,
): ParseResult<T> {
  if (!text?.trim()) {
    return { success: false, reason: "empty" };
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(stripMarkdownFences(text));
  } catch {
    return { success: false, reason: "json" };
  }

  const validation = schema.safeParse(parsed);

  if (!validation.success) {
    return { success: false, reason: "validation" };
  }

  return { success: true, data: validation.data };
}

function resolveModel(aiConfig: AiRequestConfig, modelDefault: string): string {
  if (aiConfig.model?.trim()) {
    return aiConfig.model.trim();
  }

  if (aiConfig.provider !== "mock") {
    return DEFAULT_MODELS[aiConfig.provider];
  }

  return modelDefault;
}

export interface GenerateStructuredJsonOptions<T> {
  aiConfig?: AiRequestConfig;
  request: StructuredJsonRequest;
  cacheInputs?: Record<string, unknown>;
  forceRefresh?: boolean;
  onError?: (error: AiConfigError) => never;
  onInvalidResponse?: (reason: "validation" | "empty" | "json") => never;
}

export async function generateStructuredJson<T>(
  options: GenerateStructuredJsonOptions<T>,
): Promise<T> {
  const aiConfig = resolveAiConfig(options.aiConfig);
  const model = resolveModel(aiConfig, options.request.modelDefault);
  const fingerprint =
    options.cacheInputs &&
    buildCacheFingerprint(
      options.request.operation,
      aiConfig,
      options.cacheInputs,
    );

  if (fingerprint && !options.forceRefresh) {
    const cached = await getCachedResponse<T>(fingerprint, options.request.operation);

    if (cached !== null) {
      const validation = options.request.schema.safeParse(cached);

      if (validation.success) {
        return validation.data as T;
      }
    }
  }

  const provider = createAiProvider(aiConfig);
  let lastFailure: ParseResult<T> = { success: false, reason: "empty" };

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const responseText = await provider.generateRawJson({
        ...options.request,
        userPrompt:
          attempt === 1
            ? `${options.request.userPrompt}\n\n${INVALID_JSON_CORRECTION}`
            : options.request.userPrompt,
        correction: attempt === 1 ? INVALID_JSON_CORRECTION : options.request.correction,
      });

      const result = parseStructuredResponse(responseText, options.request.schema);

      if (result.success) {
        if (fingerprint) {
          await setCachedResponse(
            fingerprint,
            options.request.operation,
            aiConfig,
            model,
            result.data,
          );
        }

        return result.data as T;
      }

      lastFailure = result;
    } catch (error) {
      if (error instanceof AiConfigError) {
        if (options.onError) {
          options.onError(error);
        }

        throw error;
      }

      throw error;
    }
  }

  if (options.onInvalidResponse) {
    options.onInvalidResponse(lastFailure.reason);
  }

  throw new AiConfigError(
    lastFailure.reason === "validation"
      ? "AI response failed schema validation"
      : "AI response was empty or invalid",
    lastFailure.reason === "validation" ? "VALIDATION" : "INVALID_RESPONSE",
    lastFailure.reason === "validation" ? 422 : 502,
  );
}

export function mapAiConfigError(error: unknown): AiConfigError | null {
  return error instanceof AiConfigError ? error : null;
}
