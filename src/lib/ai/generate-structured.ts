import {
  buildCacheFingerprint,
  getCachedResponse,
  setCachedResponse,
} from "@/lib/ai/cache";
import { generateStructuredObject } from "@/lib/ai/generate-object";
import { resolveAiConfig, toAiRequestConfig } from "@/lib/ai/resolve-ai-config";
import { isByokProvider } from "@/lib/ai/provider-catalog";
import {
  getDefaultModelForProvider,
  getTaskTypeForOperation,
} from "@/lib/ai/router";
import {
  AiConfigError,
  type AiOperation,
  type AiRequestConfig,
  type StructuredJsonRequest,
} from "@/lib/ai/types";

function resolveModel(aiConfig: AiRequestConfig, operation: AiOperation): string {
  if (aiConfig.model?.trim()) {
    return aiConfig.model.trim();
  }

  if (isByokProvider(aiConfig.provider)) {
    return getDefaultModelForProvider(
      aiConfig.provider,
      getTaskTypeForOperation(operation),
    );
  }

  return getDefaultModelForProvider("gemini", getTaskTypeForOperation(operation));
}

export interface GenerateStructuredJsonOptions<T = unknown> {
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
  const resolvedConfig = resolveAiConfig(options.aiConfig);
  const aiConfig = toAiRequestConfig(resolvedConfig);
  const model = resolveModel(aiConfig, options.request.operation);
  const fingerprint =
    options.cacheInputs &&
    buildCacheFingerprint(
      options.request.operation,
      resolvedConfig,
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

  try {
    const { object, provider } = await generateStructuredObject<T>({
      operation: options.request.operation,
      system: options.request.systemInstruction,
      prompt: options.request.userPrompt,
      schema: options.request.schema as import("zod").ZodType<T>,
      aiConfig: options.aiConfig,
      correction: options.request.correction,
    });

    if (fingerprint) {
      await setCachedResponse(
        fingerprint,
        options.request.operation,
        resolvedConfig,
        provider.model || model,
        object,
        provider.provider,
      );
    }

    return object;
  } catch (error) {
    if (error instanceof AiConfigError) {
      if (options.onError) {
        options.onError(error);
      }

      throw error;
    }

    if (options.onInvalidResponse) {
      options.onInvalidResponse("validation");
    }

    throw error;
  }
}

export function mapAiConfigError(error: unknown): AiConfigError | null {
  return error instanceof AiConfigError ? error : null;
}
