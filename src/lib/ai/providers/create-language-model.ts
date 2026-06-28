import { createGoogle } from "@ai-sdk/google";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import type { LanguageModel } from "ai";
import { DEFAULT_MODELS, type ChainProviderId } from "@/lib/ai/types";

export interface LanguageModelSpec {
  provider: ChainProviderId;
  model: string;
  apiKey: string;
}

export { getServerProviderChain, isServerChainConfigured } from "@/lib/ai/router";

export function createLanguageModel(
  spec: LanguageModelSpec,
  modelOverride?: string,
): LanguageModel {
  const modelId = modelOverride?.trim() || spec.model;

  switch (spec.provider) {
    case "gemini":
      return createGoogle({ apiKey: spec.apiKey })(modelId);
    case "openrouter": {
      const client = createOpenRouter({ apiKey: spec.apiKey });
      return client(modelId, {
        usage: { include: true },
      });
    }
    default:
      throw new Error(`Unsupported chain provider: ${spec.provider satisfies never}`);
  }
}

export function createByokLanguageModel(
  provider: ChainProviderId,
  apiKey: string,
  model?: string,
): LanguageModel {
  return createLanguageModel(
    {
      provider,
      apiKey,
      model: model?.trim() || DEFAULT_MODELS[provider],
    },
    model,
  );
}
