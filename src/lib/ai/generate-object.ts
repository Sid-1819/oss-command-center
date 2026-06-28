import { generateObject, streamObject } from "ai";
import type { z } from "zod";
import maintainerBriefingFixture from "@/lib/ai/fixtures/maintainer-briefing.json";
import markdownDocPlanFixture from "@/lib/ai/fixtures/markdown-doc-plan.json";
import issueFixPlanFixture from "@/lib/ai/fixtures/issue-fix-plan.json";
import {
  isFailoverError,
  logProviderAttempt,
} from "@/lib/ai/provider-errors";
import {
  providerLabel,
  resolveModelTargets,
  toLanguageModel,
} from "@/lib/ai/provider-chain";
import { resolveAiConfig } from "@/lib/ai/resolve-ai-config";
import {
  AiConfigError,
  SERVER_CHAIN_DEFAULTS,
  type AiOperation,
  type AiRequestConfig,
  type ProviderAttemptResult,
} from "@/lib/ai/types";

const MOCK_FIXTURES: Record<AiOperation, unknown> = {
  "maintainer-briefing": maintainerBriefingFixture,
  "markdown-doc-plan": markdownDocPlanFixture,
  "issue-fix-plan": issueFixPlanFixture,
};

const INVALID_JSON_CORRECTION =
  "Your previous response was invalid JSON. Return only valid JSON matching the schema.";

export interface GenerateObjectInput<T> {
  operation: AiOperation;
  system: string;
  prompt: string;
  schema: z.ZodType<T>;
  aiConfig?: AiRequestConfig;
  correction?: string;
}

export interface GenerateObjectResult<T> {
  object: T;
  provider: ProviderAttemptResult;
}

function resolveModelId(
  provider: keyof typeof SERVER_CHAIN_DEFAULTS,
  override?: string,
  specModel?: string,
): string {
  return override?.trim() || specModel?.trim() || SERVER_CHAIN_DEFAULTS[provider];
}

async function generateWithChain<T>(
  input: GenerateObjectInput<T>,
  correction?: string,
): Promise<GenerateObjectResult<T>> {
  const resolved = resolveAiConfig(input.aiConfig);
  const targets = resolveModelTargets(resolved);
  const prompt = correction ? `${input.prompt}\n\n${correction}` : input.prompt;

  if (targets.mode === "mock") {
    const fixture = MOCK_FIXTURES[input.operation];
    const parsed = input.schema.parse(fixture);

    return {
      object: parsed,
      provider: {
        provider: "gemini",
        model: "mock",
        usedFallback: false,
        attempt: 1,
      },
    };
  }

  let lastError: unknown;

  for (let index = 0; index < targets.models.length; index++) {
    const spec = targets.models[index]!;
    const modelId = resolveModelId(
      spec.provider,
      targets.modelOverride,
      spec.model,
    );

    try {
      const { object } = await generateObject({
        model: toLanguageModel({ ...spec, model: modelId }),
        schema: input.schema,
        system: input.system,
        prompt,
      });

      const parsed = input.schema.parse(object);

      return {
        object: parsed,
        provider: {
          provider: spec.provider,
          model: modelId,
          usedFallback: index > 0,
          attempt: index + 1,
        },
      };
    } catch (error) {
      lastError = error;

      if (resolved.mode === "byok" || !isFailoverError(error)) {
        throw error;
      }

      logProviderAttempt(
        input.operation,
        spec.provider,
        index + 1,
        error instanceof Error ? error.message : "unknown",
      );
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new AiConfigError(
    "All AI providers are unavailable. Try again later.",
    "PROVIDERS_EXHAUSTED",
    503,
  );
}

export async function generateStructuredObject<T>(
  input: GenerateObjectInput<T>,
): Promise<GenerateObjectResult<T>> {
  try {
    return await generateWithChain(input);
  } catch (error) {
    if (error instanceof AiConfigError) {
      throw error;
    }

    try {
      return await generateWithChain(input, INVALID_JSON_CORRECTION);
    } catch (retryError) {
      if (retryError instanceof AiConfigError) {
        throw retryError;
      }

      throw retryError;
    }
  }
}

export interface StreamStructuredObjectResult<T> {
  toTextStreamResponse: () => Response;
  object: Promise<T>;
}

export async function streamStructuredObject<T>(
  input: GenerateObjectInput<T>,
): Promise<{
  result: StreamStructuredObjectResult<T>;
  provider: ProviderAttemptResult;
}> {
  const resolved = resolveAiConfig(input.aiConfig);
  const targets = resolveModelTargets(resolved);

  if (targets.mode === "mock") {
    const fixture = MOCK_FIXTURES[input.operation];
    const parsed = input.schema.parse(fixture);
    const body = JSON.stringify(parsed);

    return {
      result: {
        object: Promise.resolve(parsed),
        toTextStreamResponse: () =>
          new Response(body, {
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
              "X-AI-Provider": "mock",
              "X-AI-Model": "mock",
            },
          }),
      },
      provider: {
        provider: "gemini",
        model: "mock",
        usedFallback: false,
        attempt: 1,
      },
    };
  }

  let lastError: unknown;

  for (let index = 0; index < targets.models.length; index++) {
    const spec = targets.models[index]!;
    const modelId = resolveModelId(
      spec.provider,
      targets.modelOverride,
      spec.model,
    );

    try {
      const result = streamObject({
        model: toLanguageModel({ ...spec, model: modelId }),
        schema: input.schema,
        system: input.system,
        prompt: input.prompt,
      });

      return {
        result: {
          object: result.object as Promise<T>,
          toTextStreamResponse: () => result.toTextStreamResponse(),
        },
        provider: {
          provider: spec.provider,
          model: modelId,
          usedFallback: index > 0,
          attempt: index + 1,
        },
      };
    } catch (error) {
      lastError = error;

      if (resolved.mode === "byok" || !isFailoverError(error)) {
        throw error;
      }

      logProviderAttempt(
        input.operation,
        spec.provider,
        index + 1,
        error instanceof Error ? error.message : "unknown",
      );
    }
  }

  if (lastError instanceof Error) {
    throw lastError;
  }

  throw new AiConfigError(
    "All AI providers are unavailable. Try again later.",
    "PROVIDERS_EXHAUSTED",
    503,
  );
}

export function providerHeaderValue(provider: ProviderAttemptResult): string {
  return `${providerLabel(provider.provider)}/${provider.model}`;
}
